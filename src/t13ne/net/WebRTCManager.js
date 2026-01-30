import Logger from '../core/Logger.js';

/**
 * Manages WebRTC peer-to-peer connections.
 */
export class WebRTCManager {
    constructor(signaling, rtcConfiguration) {
        const funcName = 'WebRTCManager.constructor';
        Logger.start(funcName);
        this.signaling = signaling;
        this.rtcConfiguration = rtcConfiguration;
        this.peers = new Map(); // Map of peerId -> RTCPeerConnection

        this.signaling.ws.addEventListener('message', this._handleSignalingMessage.bind(this));
        Logger.end(funcName);
    }

    /**
     * Creates a new peer connection for a given peer ID.
     * @param {string} peerId - The ID of the peer to connect to.
     * @returns {RTCPeerConnection}
     */
    createPeerConnection(peerId) {
        const funcName = 'WebRTCManager.createPeerConnection';
        Logger.start(funcName, { peerId });
        if (this.peers.has(peerId)) {
            Logger.message(`WARN: WebRTCManager: Peer connection for ${peerId} already exists.`);
            return this.peers.get(peerId);
        }

        const pc = new RTCPeerConnection(this.rtcConfiguration);
        this.peers.set(peerId, pc);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.signaling.send({
                    type: 'candidate',
                    to: peerId,
                    candidate: event.candidate,
                });
            }
        };

        pc.ontrack = (event) => {
            Logger.message(`WebRTCManager: Received remote track from ${peerId}.`);
            // This event will be handled by the VOIPManager
        };

        pc.onconnectionstatechange = () => {
            Logger.message(`WebRTCManager: Connection state with ${peerId} changed to ${pc.connectionState}`);
        };

        Logger.end(funcName, pc);
        return pc;
    }

    /**
     * Adds a local audio track to all peer connections.
     * @param {MediaStreamTrack} track - The audio track to send.
     */
    addTrack(track) {
        const funcName = 'WebRTCManager.addTrack';
        Logger.start(funcName);
        for (const [peerId, pc] of this.peers.entries()) {
            Logger.message(`WebRTCManager: Adding track to peer ${peerId}`);
            pc.addTrack(track);
        }
        Logger.end(funcName);
    }

    /**
     * Initiates a connection to a peer by creating an offer.
     * @param {string} peerId - The ID of the peer to connect to.
     */
    async connect(peerId) {
        const funcName = 'WebRTCManager.connect';
        Logger.start(funcName, { peerId });
        const pc = this.createPeerConnection(peerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        this.signaling.send({
            type: 'offer',
            to: peerId,
            offer: offer,
        });
        Logger.end(funcName);
    }

    /**
     * Closes the connection to a specific peer.
     * @param {string} peerId - The ID of the peer to disconnect from.
     */
    close(peerId) {
        const funcName = 'WebRTCManager.close';
        Logger.start(funcName, { peerId });
        if (this.peers.has(peerId)) {
            this.peers.get(peerId).close();
            this.peers.delete(peerId);
        }
        Logger.end(funcName);
    }

    /**
     * Handles incoming signaling messages.
     * @param {MessageEvent} event - The WebSocket message event.
     * @private
     */
    async _handleSignalingMessage(event) {
        const funcName = 'WebRTCManager._handleSignalingMessage';
        Logger.start(funcName);
        try {
            const msg = JSON.parse(event.data);
            const from = msg.from;

            if (!from) return;

            const pc = this.peers.get(from) || this.createPeerConnection(from);

            switch (msg.type) {
                case 'offer':
                    await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    this.signaling.send({
                        type: 'answer',
                        to: from,
                        answer: answer,
                    });
                    break;
                case 'answer':
                    await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
                    break;
                case 'candidate':
                    await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
                    break;
            }
        } catch (e) {
            Logger.message(`WARN: Invalid signaling message: ${e}`);
        }
        Logger.end(funcName);
    }
}
