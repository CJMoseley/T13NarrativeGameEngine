import Logger from './Logger.js';
import { EventBus } from './EventBus.js';
import { Peer } from 'peerjs';

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
        this.connections.forEach(c => { if(c.open) c.send(payload); });
    }

    _handleIncomingConnection(conn) {
        this.connections.set(conn.peer, conn);
        conn.on('data', (data) => {
            const msg = typeof data === 'string' ? JSON.parse(data) : data;
            EventBus.emit(`p2p:msg:${msg.type}`, { message: msg, senderId: conn.peer });
        });
        EventBus.emit('p2p:peer-connected', { peerId: conn.peer });
    }
}
export default new P2PNetworkManager();
