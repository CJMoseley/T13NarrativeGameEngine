import { hashRoom, generateChallenge, solveChallenge, verifyChallenge } from './CryptoUtils.js';

export class DirectNetworkClient {
    constructor() {
        this.ws = null;
        this.clientId = `client_${Math.floor(Math.random() * 100000)}`;
        this.roomHash = null;
        this.password = null;
        this.isHost = false;
        this.peers = new Map(); // peerId -> { pc, dataChannel, authenticated: false }
        this.rtcConfig = { iceServers: [] }; // No external STUN/TURN as requested
        
        // Callbacks
        this.onPeerConnected = null;
        this.onPeerDisconnected = null;
        this.onMessageReceived = null;
        this.onStatusChange = null;
    }

    log(msg, type = 'info') {
        console.log(`[DirectNet][${type.toUpperCase()}] ${msg}`);
        if (this.onStatusChange) {
            this.onStatusChange(msg);
        }
    }

    async start(url, roomName, password, isHost = false) {
        this.isHost = isHost;
        this.password = password;
        this.roomHash = await hashRoom(roomName, password);
        this.log(`Hashing room credentials: ${this.roomHash.slice(0, 10)}...`);

        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(url);
            } catch (err) {
                this.log(`WebSocket initialization failed: ${err.message}`, 'error');
                return reject(err);
            }

            this.ws.onopen = () => {
                this.log("Connected to signaling server. Registering...");
                this.ws.send(JSON.stringify({
                    type: 'register',
                    clientId: this.clientId,
                    roomId: this.roomHash,
                    info: { isHost }
                }));
            };

            this.ws.onmessage = async (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    await this._handleSignalingMessage(msg);
                } catch (err) {
                    this.log(`Error parsing signaling message: ${err.message}`, 'error');
                }
            };

            this.ws.onerror = (err) => {
                this.log("Signaling server connection error.", "error");
                reject(err);
            };

            this.ws.onclose = () => {
                this.log("Disconnected from signaling server.");
                this.disconnectAll();
            };

            // Resolve promise when registration completes successfully
            const registrationListener = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'registered' && msg.clientId === this.clientId) {
                        this.log(`Registered successfully. ID: ${this.clientId}`);
                        this.ws.removeEventListener('message', registrationListener);
                        resolve();
                    }
                } catch (e) {}
            };
            this.ws.addEventListener('message', registrationListener);
        });
    }

    disconnectAll() {
        for (const [peerId, peer] of this.peers.entries()) {
            this._closePeer(peerId);
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.log("All direct network connections closed.");
    }

    async _handleSignalingMessage(msg) {
        const from = msg.from;
        if (!from) return;

        if (msg.type === 'peerJoined') {
            this.log(`Peer joined room: ${from}. Initiating connection...`);
            await this.connectToPeer(from);
        } else if (msg.type === 'peerExists') {
            this.log(`Existing peer detected: ${from}. Connecting...`);
            await this.connectToPeer(from);
        } else if (msg.type === 'peerLeft') {
            this.log(`Peer left: ${from}`);
            this._closePeer(from);
        } else if (msg.type === 'offer') {
            await this._handleOffer(from, msg.offer);
        } else if (msg.type === 'answer') {
            await this._handleAnswer(from, msg.answer);
        } else if (msg.type === 'candidate') {
            await this._handleCandidate(from, msg.candidate);
        }
    }

    async connectToPeer(peerId) {
        if (this.peers.has(peerId)) return;
        this.log(`Creating RTCPeerConnection to: ${peerId}`);
        const pc = new RTCPeerConnection(this.rtcConfig);
        const peerRecord = { pc, dataChannel: null, authenticated: false };
        this.peers.set(peerId, peerRecord);

        // Host creates the data channel
        if (this.isHost) {
            const dc = pc.createDataChannel('vtt-sync');
            peerRecord.dataChannel = dc;
            this._setupDataChannel(peerId, dc);
        }

        pc.onicecandidate = (event) => {
            if (event.candidate && this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    to: peerId,
                    type: 'candidate',
                    candidate: event.candidate
                }));
            }
        };

        pc.ondatachannel = (event) => {
            if (!this.isHost) {
                peerRecord.dataChannel = event.channel;
                this._setupDataChannel(peerId, event.channel);
            }
        };

        pc.onconnectionstatechange = () => {
            this.log(`Peer connection state for ${peerId}: ${pc.connectionState}`);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                this._closePeer(peerId);
            }
        };

        // If initiating connection (Host initiates to all joining peers)
        if (this.isHost) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            this.ws.send(JSON.stringify({
                to: peerId,
                type: 'offer',
                offer
            }));
        }
    }

    async _handleOffer(peerId, offer) {
        if (!this.peers.has(peerId)) {
            const pc = new RTCPeerConnection(this.rtcConfig);
            this.peers.set(peerId, { pc, dataChannel: null, authenticated: false });
            
            pc.onicecandidate = (event) => {
                if (event.candidate && this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        to: peerId,
                        type: 'candidate',
                        candidate: event.candidate
                    }));
                }
            };

            pc.ondatachannel = (event) => {
                const peer = this.peers.get(peerId);
                if (peer) {
                    peer.dataChannel = event.channel;
                    this._setupDataChannel(peerId, event.channel);
                }
            };

            pc.onconnectionstatechange = () => {
                this.log(`Peer connection state for ${peerId}: ${pc.connectionState}`);
                if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                    this._closePeer(peerId);
                }
            };
        }

        const peer = this.peers.get(peerId);
        await peer.pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.pc.createAnswer();
        await peer.pc.setLocalDescription(answer);
        this.ws.send(JSON.stringify({
            to: peerId,
            type: 'answer',
            answer
        }));
    }

    async _handleAnswer(peerId, answer) {
        const peer = this.peers.get(peerId);
        if (peer) {
            await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    }

    async _handleCandidate(peerId, candidate) {
        const peer = this.peers.get(peerId);
        if (peer) {
            await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }

    _setupDataChannel(peerId, dc) {
        dc.onopen = async () => {
            this.log(`Data channel opened with peer ${peerId}. Initiating auth...`);
            
            if (this.isHost) {
                // Generate a random authentication challenge
                const challenge = generateChallenge();
                peerId.challenge = challenge; // Store temporarily
                dc.send(JSON.stringify({
                    type: 'auth_challenge',
                    challenge
                }));
            }
        };

        dc.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                await this._handleChannelMessage(peerId, dc, data);
            } catch (err) {
                this.log(`Data channel parse error: ${err.message}`, 'error');
            }
        };

        dc.onclose = () => {
            this.log(`Data channel closed with peer ${peerId}`);
            this._closePeer(peerId);
        };
    }

    async _handleChannelMessage(peerId, dc, msg) {
        const peer = this.peers.get(peerId);
        if (!peer) return;

        // Challenge-Response Handshake
        if (msg.type === 'auth_challenge') {
            this.log("Auth challenge received. Solving...");
            const response = await solveChallenge(msg.challenge, this.password);
            dc.send(JSON.stringify({
                type: 'auth_response',
                response
            }));
            return;
        }

        if (msg.type === 'auth_response') {
            this.log("Auth response received. Verifying...");
            const verified = await verifyChallenge(peerId.challenge, msg.response, this.password);
            if (verified) {
                this.log(`Peer ${peerId} successfully authenticated.`);
                peer.authenticated = true;
                dc.send(JSON.stringify({ type: 'auth_success' }));
                
                if (this.onPeerConnected) {
                    this.onPeerConnected(peerId);
                }
            } else {
                this.log(`Peer ${peerId} authentication FAILED. Disconnecting.`, 'warn');
                dc.send(JSON.stringify({ type: 'auth_failed', reason: 'Incorrect room password.' }));
                setTimeout(() => this._closePeer(peerId), 500);
            }
            return;
        }

        if (msg.type === 'auth_success') {
            this.log("Successfully authenticated with Host.");
            peer.authenticated = true;
            if (this.onPeerConnected) {
                this.onPeerConnected(peerId);
            }
            return;
        }

        if (msg.type === 'auth_failed') {
            this.log(`Connection rejected by host: ${msg.reason}`, 'error');
            this._closePeer(peerId);
            return;
        }

        // Drop messages from unauthenticated peers
        if (!peer.authenticated) {
            this.log(`Discarding message from unauthenticated peer: ${peerId}`, 'warn');
            return;
        }

        // Direct payload message routing
        if (this.onMessageReceived) {
            this.onMessageReceived(peerId, msg);
        }
    }

    broadcast(payload) {
        const messageString = JSON.stringify(payload);
        for (const [peerId, peer] of this.peers.entries()) {
            if (peer.dataChannel && peer.dataChannel.readyState === 'open' && peer.authenticated) {
                peer.dataChannel.send(messageString);
            }
        }
    }

    _closePeer(peerId) {
        if (this.peers.has(peerId)) {
            const peer = this.peers.get(peerId);
            try {
                if (peer.dataChannel) peer.dataChannel.close();
                peer.pc.close();
            } catch (e) {}
            this.peers.delete(peerId);
            this.log(`Connection with ${peerId} clean closed.`);
            if (this.onPeerDisconnected) {
                this.onPeerDisconnected(peerId);
            }
        }
    }
}
