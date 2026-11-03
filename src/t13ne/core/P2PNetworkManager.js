import { EventBus } from './EventBus.js';
import { Peer } from 'peerjs';

const MAX_P2P_MESSAGE_BYTES = 131072;

// Explicitly allowlisted P2P message types
const ALLOWED_P2P_MSG_TYPES = new Set([
    'TOKEN_MOVE',
    'DICE_ROLL',
    'PLOT_SYNC',
    'CLEAR_TABLE'
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
     * Checks the wire format and fields used by current VTT handlers.
     * This does not authenticate peers or authorize actions.
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

        const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
        const valid = msg.type === 'CLEAR_TABLE' ||
            (msg.type === 'DICE_ROLL' && Array.isArray(msg.rolls) && msg.rolls.length <= 128 &&
                msg.rolls.every(Number.isFinite)) ||
            (msg.type === 'TOKEN_MOVE' && typeof msg.tokenId === 'string' && msg.tokenId.length > 0 &&
                object(msg.position) && Number.isFinite(msg.position.x) && Number.isFinite(msg.position.z)) ||
            (msg.type === 'PLOT_SYNC' && object(msg.plot) &&
                (msg.plot.tensionLevel === undefined || Number.isFinite(msg.plot.tensionLevel)));
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
        EventBus.emit('p2p:peer-connected', { peerId: conn.peer });
    }
}
export default new P2PNetworkManager();
