import Logger from '../core/Logger.js';
import { EventBus } from '../core/EventBus.js';

/**
 * Manages WebRTC peer-to-peer connections and dynamic track synchronization.
 */
export class WebRTCManager {
    constructor(signaling, rtcConfiguration) {
        const funcName = 'WebRTCManager.constructor';
        Logger.start(funcName);
        this.signaling = signaling;
        this.rtcConfiguration = rtcConfiguration;
        this.peers = new Map(); // Map of peerId -> RTCPeerConnection
        this.localTracks = [];

        if (this.signaling?.ws && typeof this.signaling.ws.addEventListener === 'function') {
            this.signaling.ws.addEventListener('message', this._handleSignalingMessage.bind(this));
        }
        Logger.end(funcName);
    }

    createPeerConnection(peerId) {
        const funcName = 'WebRTCManager.createPeerConnection';
        Logger.start(funcName, { peerId });
        if (this.peers.has(peerId)) {
            Logger.message(`WARN: WebRTCManager: Peer connection for ${peerId} already exists.`);
            return this.peers.get(peerId);
        }

        const pc = new RTCPeerConnection(this.rtcConfiguration);
        this.peers.set(peerId, pc);

        // Attach already-active local tracks to peers joining after start()
        for (const track of this.localTracks) {
            try { pc.addTrack(track); } catch (e) {}
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.signaling?.send?.({
                    type: 'candidate',
                    to: peerId,
                    candidate: event.candidate
                });
            }
        };

        pc.ontrack = (event) => {
            Logger.message(`WebRTCManager: Received remote track from ${peerId}.`);
            EventBus.emit('webrtc:remote-track', {
                peerId,
                track: event.track,
                stream: event.streams?.[0] ?? null
            });
        };

        pc.onconnectionstatechange = () => {
            Logger.message(`WebRTCManager: Connection state with ${peerId} changed to ${pc.connectionState}`);
            if (pc.connectionState === 'closed' || pc.connectionState === 'failed') {
                this.close(peerId);
            }
        };

        EventBus.emit('webrtc:peer-created', { peerId, pc });
        Logger.end(funcName, pc);
        return pc;
    }

    addTrack(track) {
        const funcName = 'WebRTCManager.addTrack';
        Logger.start(funcName);
        if (track && !this.localTracks.includes(track)) {
            this.localTracks.push(track);
        }
        for (const [peerId, pc] of this.peers.entries()) {
            Logger.message(`WebRTCManager: Adding track to peer ${peerId}`);
            pc.addTrack(track);
        }
        Logger.end(funcName);
    }

    replaceLocalTrack(newTrack) {
        this.localTracks = newTrack ? [newTrack] : [];
        for (const pc of this.peers.values()) {
            const senders = typeof pc.getSenders === 'function' ? pc.getSenders() : [];
            const audioSender = senders.find(s => s.track?.kind === 'audio');
            if (audioSender && typeof audioSender.replaceTrack === 'function') {
                audioSender.replaceTrack(newTrack).catch(() => {});
            } else if (newTrack) {
                pc.addTrack(newTrack);
            }
        }
    }

    async connect(peerId) {
        const funcName = 'WebRTCManager.connect';
        Logger.start(funcName, { peerId });
        const pc = this.createPeerConnection(peerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        this.signaling?.send?.({
            type: 'offer',
            to: peerId,
            offer
        });
        Logger.end(funcName);
    }

    close(peerId) {
        const funcName = 'WebRTCManager.close';
        Logger.start(funcName, { peerId });
        if (this.peers.has(peerId)) {
            try { this.peers.get(peerId).close(); } catch (e) {}
            this.peers.delete(peerId);
            EventBus.emit('webrtc:peer-closed', { peerId });
        }
        Logger.end(funcName);
    }

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
                    this.signaling?.send?.({
                        type: 'answer',
                        to: from,
                        answer
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
