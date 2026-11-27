import { EventBus } from './EventBus.js';
import { Peer } from 'peerjs';

const MAX_P2P_MESSAGE_BYTES = 131072;
const PUPPET_MAX_PER_SECOND = 25;

// Explicitly allowlisted P2P message types
const ALLOWED_P2P_MSG_TYPES = new Set([
    'TOKEN_MOVE',
    'DICE_ROLL',
    'PLOT_SYNC',
    'CLEAR_TABLE',
    'SESSION_COMMAND',
    'SESSION_EVENT',
    'STATE_PROJECTION',
    'SESSION_SYNC_REQUEST',
    'SESSION_ERROR',
    'SKIN_SYNC',
    'AVATAR_PUPPET'
]);

export class P2PNetworkManager {
    constructor() {
        this.peer = null;
        this.connections = new Map();
        this.mediaCalls = new Map();
        this.isHost = false;
        this.peerId = null;
        this.hostPeerId = null;
        this._puppetRateState = new Map();
    }

    async init(customId = null) {
        return new Promise((resolve) => {
            this.peer = new Peer(customId, { host: '0.peerjs.com', port: 443, secure: true });
            this.peer.on('open', (id) => { this.peerId = id; resolve(id); });
            this.peer.on('connection', (conn) => this._handleIncomingConnection(conn));
            this.peer.on('call', (call) => {
                this.mediaCalls.set(call.peer, call);
                EventBus.emit('p2p:incoming-call', { call, peerId: call.peer });
            });
        });
    }

    async createRoom(roomId) {
        this.isHost = true;
        this.hostPeerId = `t13-room-${roomId}`;
        await this.init(this.hostPeerId);
    }

    async joinRoom(roomId) {
        this.isHost = false;
        this.hostPeerId = `t13-room-${roomId}`;
        await this.init();
        const conn = this.peer.connect(this.hostPeerId);
        this._handleIncomingConnection(conn);
    }

    sendTo(peerId, data) {
        const conn = this.connections.get(peerId);
        if (!conn || !conn.open) return false;
        const payload = JSON.stringify({ ...data, sender: this.peerId, ts: Date.now() });
        conn.send(payload);
        return true;
    }

    sendToHost(data) {
        if (this.hostPeerId && this.connections.has(this.hostPeerId)) {
            return this.sendTo(this.hostPeerId, data);
        }
        this.broadcast(data);
        return true;
    }

    broadcast(data) {
        const payload = JSON.stringify({ ...data, sender: this.peerId, ts: Date.now() });
        this.connections.forEach(c => { if (c.open) c.send(payload); });
    }

    callPeer(peerId, stream) {
        if (!this.peer || typeof this.peer.call !== 'function' || !stream) return null;
        const call = this.peer.call(peerId, stream);
        if (call) this.mediaCalls.set(peerId, call);
        return call;
    }

    _allowPuppetFromPeer(senderId) {
        const now = Date.now();
        const cutoff = now - 1000;
        const times = (this._puppetRateState.get(senderId) || []).filter(ts => ts >= cutoff);
        if (times.length >= PUPPET_MAX_PER_SECOND) {
            this._puppetRateState.set(senderId, times);
            return false;
        }
        times.push(now);
        this._puppetRateState.set(senderId, times);
        return true;
    }

    /**
     * Checks the wire format and fields used by VTT and session handlers.
     * Session authority and role projections are enforced separately by VTTSessionHost.
     */
    validateIncomingMessage(data, senderId) {
        if (typeof data !== 'string') {
            console.warn(`[P2P Trust Boundary] Dropped non-string payload from ${senderId}`);
            return null;
        }
        if (data.length > MAX_P2P_MESSAGE_BYTES) {
            console.warn(`[P2P Trust Boundary] Dropped oversized message from ${senderId}`);
            return null;
        }
        const bytes = new TextEncoder().encode(data).byteLength;
        if (bytes > MAX_P2P_MESSAGE_BYTES) {
            console.warn(`[P2P Trust Boundary] Dropped oversized message (${bytes} bytes) from ${senderId}`);
            return null;
        }
        let msg;
        try {
            msg = JSON.parse(data);
        } catch (e) {
            console.warn(`[P2P Trust Boundary] Dropped malformed JSON from ${senderId}:`, e.message);
            return null;
        }

        if (!msg || typeof msg !== 'object' || Array.isArray(msg)) {
            console.warn(`[P2P Trust Boundary] Dropped non-object payload from ${senderId}`);
            return null;
        }

        if (!msg.type || typeof msg.type !== 'string' || !ALLOWED_P2P_MSG_TYPES.has(msg.type)) {
            console.warn(`[P2P Trust Boundary] Dropped disallowed message type '${msg.type}' from ${senderId}`);
            return null;
        }

        const isObj = value => value !== null && typeof value === 'object' && !Array.isArray(value);
        const isStr = value => typeof value === 'string' && value.length > 0;

        let valid = false;
        switch (msg.type) {
            case 'CLEAR_TABLE':
                valid = true;
                break;
            case 'DICE_ROLL':
                valid = Array.isArray(msg.rolls) && msg.rolls.length <= 128 && msg.rolls.every(Number.isFinite);
                break;
            case 'TOKEN_MOVE':
                valid = isStr(msg.tokenId) && isObj(msg.position) &&
                    Number.isFinite(msg.position.x) && Number.isFinite(msg.position.z);
                break;
            case 'PLOT_SYNC':
                valid = isObj(msg.plot) && (msg.plot.tensionLevel === undefined || Number.isFinite(msg.plot.tensionLevel));
                break;
            case 'SESSION_COMMAND':
                valid = isObj(msg.command) && isStr(msg.command.id) && isStr(msg.command.sessionId) &&
                    isStr(msg.command.actorId) && isStr(msg.command.type) &&
                    (msg.command.payload === undefined || isObj(msg.command.payload));
                break;
            case 'SESSION_EVENT':
                valid = isObj(msg.event) && Number.isInteger(msg.event.seq) &&
                    Number.isInteger(msg.event.revision) && isStr(msg.event.type);
                break;
            case 'STATE_PROJECTION':
                valid = isObj(msg.projection) && isStr(msg.projection.sessionId) &&
                    Number.isInteger(msg.projection.revision);
                break;
            case 'SESSION_SYNC_REQUEST':
                valid = isStr(msg.sessionId) && (msg.afterSeq === undefined || Number.isFinite(msg.afterSeq));
                break;
            case 'SESSION_ERROR':
                valid = isStr(msg.error);
                break;
            case 'SKIN_SYNC':
                valid = isStr(msg.entityId) && isObj(msg.skinDocument) &&
                    msg.skinDocument.format === 't13-avatar-skin' &&
                    Number.isInteger(msg.skinDocument.version) &&
                    isStr(msg.skinDocument.bodyPlan) &&
                    (isStr(msg.skinDocument.regionRleRgb24Base64) || isStr(msg.skinDocument.regionRleRgb565Base64) ||
                     isStr(msg.skinDocument.regionRgbBase64) || isStr(msg.skinDocument.regionRgb565Base64) ||
                     Array.isArray(msg.skinDocument.rlePixels) || Array.isArray(msg.skinDocument.pixels));
                break;
            case 'AVATAR_PUPPET':
                valid = isStr(msg.actorId) && isObj(msg.frame) &&
                    Object.values(msg.frame).every(v =>
                        typeof v === 'number' ? Number.isFinite(v) :
                        isObj(v) ? Object.values(v).every(n => typeof n === 'number' && Number.isFinite(n)) :
                        typeof v === 'boolean' || typeof v === 'string'
                    );
                if (valid && !this._allowPuppetFromPeer(senderId)) {
                    console.warn(`[P2P Trust Boundary] Rate-limited AVATAR_PUPPET from ${senderId}`);
                    return null;
                }
                break;
            default:
                valid = false;
        }

        if (!valid) {
            console.warn(`[P2P Trust Boundary] Dropped invalid '${msg.type}' payload from ${senderId}`);
            return null;
        }

        return msg;
    }

    _handleIncomingConnection(conn) {
        this.connections.set(conn.peer, conn);
        conn.on('data', (data) => {
            const validMsg = this.validateIncomingMessage(data, conn.peer);
            if (validMsg) {
                EventBus.emit(`p2p:msg:${validMsg.type}`, { message: validMsg, senderId: conn.peer });
            }
        });
        if (typeof conn.on === 'function') {
            conn.on('close', () => {
                this.connections.delete(conn.peer);
                this._puppetRateState.delete(conn.peer);
                EventBus.emit('p2p:peer-disconnected', { peerId: conn.peer });
            });
        }
        EventBus.emit('p2p:peer-connected', { peerId: conn.peer });
    }
}
export default new P2PNetworkManager();
