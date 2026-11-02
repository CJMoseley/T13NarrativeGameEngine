import { EventBus } from './EventBus.js';
import { Peer } from 'peerjs';

// Maximum allowable raw P2P message length (128 KB) to prevent memory exhaustion / DoS
const MAX_P2P_MESSAGE_LENGTH = 131072;

// Explicitly allowlisted P2P message types
const ALLOWED_P2P_MSG_TYPES = new Set([
    'TOKEN_MOVE',
    'DICE_ROLL',
    'PLOT_SYNC',
    'ENTITY_TRANSFER',
    'CHAT_MESSAGE',
    'HEARTBEAT'
]);

export class P2PNetworkManager {
    constructor() {
        this.peer = null;
        this.connections = new Map();
        this.isHost = false;
        this.peerId = null;
    }

    async init(customId = null) {
        return new Promise((resolve) => {
            this.peer = new Peer(customId, { host: '0.peerjs.com', port: 443, secure: true });
            this.peer.on('open', (id) => { this.peerId = id; resolve(id); });
            this.peer.on('connection', (conn) => this._handleIncomingConnection(conn));
        });
    }

    async createRoom(roomId) { await this.init(`t13-room-${roomId}`); this.isHost = true; }
    async joinRoom(roomId) { await this.init(); const conn = this.peer.connect(`t13-room-${roomId}`); this._handleIncomingConnection(conn); }

    broadcast(data) {
        const payload = JSON.stringify({ ...data, sender: this.peerId, ts: Date.now() });
        this.connections.forEach(c => { if (c.open) c.send(payload); });
    }

    /**
     * Validates and sanitizes incoming P2P message against trust boundary policy.
     * Rejects oversized payloads, malformed structures, or unapproved types.
     */
    validateIncomingMessage(data, senderId) {
        if (!data) return null;

        let msg = data;
        if (typeof data === 'string') {
            if (data.length > MAX_P2P_MESSAGE_LENGTH) {
                console.warn(`[P2P Trust Boundary] Dropped oversized message (${data.length} bytes) from ${senderId}`);
                return null;
            }
            try {
                msg = JSON.parse(data);
            } catch (e) {
                console.warn(`[P2P Trust Boundary] Dropped malformed JSON from ${senderId}:`, e.message);
                return null;
            }
        }

        if (!msg || typeof msg !== 'object' || Array.isArray(msg)) {
            console.warn(`[P2P Trust Boundary] Dropped non-object payload from ${senderId}`);
            return null;
        }

        if (!msg.type || typeof msg.type !== 'string' || !ALLOWED_P2P_MSG_TYPES.has(msg.type)) {
            console.warn(`[P2P Trust Boundary] Dropped disallowed message type '${msg.type}' from ${senderId}`);
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
        EventBus.emit('p2p:peer-connected', { peerId: conn.peer });
    }
}
export default new P2PNetworkManager();
