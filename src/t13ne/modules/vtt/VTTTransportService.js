/**
 * @module Modules/VTT/VTTTransportService
 * @description Unified, role-filtered session host/client transport layer across:
 * - InMemoryTransportHub (deterministic Node/local tests)
 * - PeerJSTransportAdapter (Referee-hosted PeerJS via P2PNetworkManager + EventBus)
 * - WebSocketTransportAdapter (Authoritative server/index.js WebSocket + REST)
 */

import { EventBus } from '../../core/EventBus.js';
import {
    createAuthChallenge,
    createPassphraseVerifier,
    generateSessionKeyPair,
    signSessionJWT,
    verifyAuthChallengeResponse,
    verifySessionJWT
} from './VTTAuthService.js';

function clone(value) {
    if (value === null || value === undefined || typeof value !== 'object') return value;
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

const PUPPET_RATE_LIMIT_PER_SEC = 25;

/**
 * Deterministic in-memory transport hub for local multiplayer simulation and automated tests.
 */
export class InMemoryTransportHub {
    constructor() {
        this.hostHandler = null;
        this.clients = new Map(); // peerId -> handler
        this.disconnectedPeers = new Set();
    }

    attachHost(handler) {
        this.hostHandler = handler;
    }

    attachClient(peerId, handler) {
        this.clients.set(peerId, handler);
        this.disconnectedPeers.delete(peerId);
    }

    disconnectPeer(peerId) {
        this.disconnectedPeers.add(peerId);
    }

    reconnectPeer(peerId) {
        this.disconnectedPeers.delete(peerId);
    }

    sendToHost(peerId, msg) {
        if (this.disconnectedPeers.has(peerId) || !this.hostHandler) return false;
        this.hostHandler(peerId, clone(msg));
        return true;
    }

    sendToPeer(peerId, msg) {
        if (this.disconnectedPeers.has(peerId)) return false;
        const handler = this.clients.get(peerId);
        if (!handler) return false;
        handler(clone(msg));
        return true;
    }
}

/**
 * PeerJS adapter wrapping P2PNetworkManager + EventBus.
 */
export class PeerJSTransportAdapter {
    constructor(p2pManager, eventBus = EventBus) {
        this.p2p = p2pManager;
        this.bus = eventBus;
        this._unsubs = [];
    }

    bindHost(onPeerMessage) {
        const types = ['SESSION_COMMAND', 'SESSION_SYNC_REQUEST', 'SKIN_SYNC', 'AVATAR_PUPPET'];
        for (const t of types) {
            const unsub = this.bus.on(`p2p:msg:${t}`, ({ message, senderId }) => {
                onPeerMessage(senderId, message);
            });
            if (typeof unsub === 'function') this._unsubs.push(unsub);
        }
    }

    bindClient(onHostMessage) {
        const types = ['STATE_PROJECTION', 'SESSION_EVENT', 'SESSION_ERROR', 'SKIN_SYNC', 'AVATAR_PUPPET'];
        for (const t of types) {
            const unsub = this.bus.on(`p2p:msg:${t}`, ({ message }) => {
                onHostMessage(message);
            });
            if (typeof unsub === 'function') this._unsubs.push(unsub);
        }
    }

    sendToHost(msg) {
        if (typeof this.p2p?.sendToHost === 'function') {
            this.p2p.sendToHost(msg);
        } else {
            this.p2p.broadcast(msg);
        }
    }

    sendToPeer(peerId, msg) {
        if (typeof this.p2p?.sendTo === 'function') {
            this.p2p.sendTo(peerId, msg);
        } else {
            this.p2p.broadcast(msg);
        }
    }

    dispose() {
        for (const unsub of this._unsubs) {
            try { unsub(); } catch (e) {}
        }
        this._unsubs = [];
    }
}

/**
 * WebSocket adapter talking to server/index.js session endpoints.
 */
export class WebSocketTransportAdapter {
    constructor({ wsUrl, sessionId, actorId, token = null, WebSocketImpl = null } = {}) {
        this.wsUrl = wsUrl;
        this.sessionId = sessionId;
        this.actorId = actorId;
        this.token = token;
        this.WebSocketImpl = WebSocketImpl ?? (typeof WebSocket !== 'undefined' ? WebSocket : null);
        this.ws = null;
        this._onMessage = null;
        this._onOpen = null;
        this._onClose = null;
        this.connected = false;
    }

    connect({ onMessage, onOpen, onClose } = {}) {
        this._onMessage = onMessage;
        this._onOpen = onOpen;
        this._onClose = onClose;
        if (!this.WebSocketImpl) {
            throw new Error('WebSocket implementation is unavailable.');
        }
        return new Promise((resolve, reject) => {
            const ws = new this.WebSocketImpl(this.wsUrl);
            this.ws = ws;
            let settled = false;

            const handleOpen = () => {
                this.connected = true;
                ws.send(JSON.stringify({
                    type: 'SESSION_JOIN',
                    sessionId: this.sessionId,
                    actorId: this.actorId,
                    token: this.token
                }));
                this._onOpen?.();
                if (!settled) { settled = true; resolve(); }
            };

            const handleMsg = (event) => {
                try {
                    const raw = typeof event === 'string' ? event : event.data;
                    const msg = JSON.parse(typeof raw === 'string' ? raw : raw.toString());
                    this._onMessage?.(msg);
                } catch (e) {}
            };

            const handleClose = () => {
                this.connected = false;
                this._onClose?.();
            };

            const handleError = (err) => {
                if (!settled) { settled = true; reject(err); }
            };

            if (typeof ws.addEventListener === 'function') {
                ws.addEventListener('open', handleOpen);
                ws.addEventListener('message', handleMsg);
                ws.addEventListener('close', handleClose);
                ws.addEventListener('error', handleError);
            } else {
                ws.on('open', handleOpen);
                ws.on('message', handleMsg);
                ws.on('close', handleClose);
                ws.on('error', handleError);
            }
        });
    }

    send(msg) {
        if (this.ws && this.connected) {
            this.ws.send(JSON.stringify(msg));
            return true;
        }
        return false;
    }

    close() {
        this.connected = false;
        try { this.ws?.close(); } catch (e) {}
        this.ws = null;
    }
}

/**
 * Authoritative VTT host enforcing role-filtered projections and per-peer identity binding.
 */
export class VTTSessionHost {
    /**
     * @param {import('../systems/T13Session.js').T13Session} session
     * @param {object} [options]
     */
    constructor(session, options = {}) {
        this.session = session;
        this.transport = options.transport ?? new InMemoryTransportHub();
        this.peers = new Map(); // peerId -> { actorId, role, lastSeq }
        this._puppetRates = new Map(); // peerId -> number[] timestamps
        this._now = options.now ?? (() => Date.now());
        this._authKeyPair = null;
        this._passphraseVerifier = null;
        this._challenges = new Map();

        if (this.transport instanceof InMemoryTransportHub) {
            this.transport.attachHost((peerId, msg) => this.handlePeerMessage(peerId, msg));
        } else if (typeof this.transport?.bindHost === 'function') {
            this.transport.bindHost((peerId, msg) => this.handlePeerMessage(peerId, msg));
        }
    }

    async initAuth(refereePassphrase = null) {
        if (!this._authKeyPair) {
            this._authKeyPair = await generateSessionKeyPair();
        }
        if (refereePassphrase) {
            this._passphraseVerifier = await createPassphraseVerifier(refereePassphrase);
        }
        return this._authKeyPair.publicJwk;
    }

    createAuthChallenge() {
        if (!this._passphraseVerifier) {
            throw new Error('Referee passphrase verifier not configured on VTTSessionHost.');
        }
        const challenge = createAuthChallenge();
        this._challenges.set(challenge.challengeId, challenge);
        return {
            challengeId: challenge.challengeId,
            nonce: challenge.nonce,
            salt: this._passphraseVerifier.salt,
            iterations: this._passphraseVerifier.iterations,
            expiresAt: challenge.expiresAt
        };
    }

    async verifyChallengeAndIssueToken({ challengeId, response, actorId = 'referee' }) {
        const challenge = this._challenges.get(challengeId);
        if (!challenge) return { ok: false, error: 'Invalid challenge.' };
        this._challenges.delete(challengeId);
        if (challenge.expiresAt <= this._now()) return { ok: false, error: 'Challenge expired.' };
        const valid = await verifyAuthChallengeResponse(response, {
            nonce: challenge.nonce,
            verifier: this._passphraseVerifier
        });
        if (!valid) return { ok: false, error: 'Invalid passphrase proof.' };
        await this.initAuth();
        const token = await signSessionJWT(
            { sub: actorId, sid: this.session.sessionId, role: 'referee' },
            this._authKeyPair.privateKey,
            { kid: this._authKeyPair.kid }
        );
        return { ok: true, token, publicJwk: this._authKeyPair.publicJwk };
    }

    async registerPeerWithToken(peerId, { token, fallbackActorId = null, name = null } = {}) {
        let role = 'player';
        let actorId = fallbackActorId ?? peerId;
        if (token && this._authKeyPair) {
            const check = await verifySessionJWT(token, this._authKeyPair.publicKey, {
                expectedSessionId: this.session.sessionId
            });
            if (!check.valid) {
                throw Object.assign(new Error(check.reason || 'Invalid session JWT.'), { code: 'UNAUTHORIZED' });
            }
            role = check.claims.role === 'referee' ? 'referee' : 'player';
            actorId = check.claims.sub || actorId;
        }
        this.registerPeer(peerId, { actorId, role, name });
        return { actorId, role };
    }

    /**
     * Binds an authenticated peer connection to a specific actorId and role.
     * Authority never trusts client-claimed roles inside subsequent commands.
     */
    registerPeer(peerId, { actorId, role = 'player', name = null } = {}) {
        if (!peerId || !actorId) throw new Error('registerPeer requires peerId and actorId.');
        const normalizedRole = ['referee', 'player', 'observer'].includes(role) ? role : 'player';
        this.peers.set(peerId, { actorId: String(actorId), role: normalizedRole, lastSeq: 0 });

        if (!this.session.getActorRole(actorId)) {
            this.session.dispatch({
                id: `host-join-${actorId}-${this.session.revision}`,
                sessionId: this.session.sessionId,
                actorId: this.session.refereeId,
                type: 'Session:Join',
                payload: { actorId, role: normalizedRole, name: name ?? actorId }
            });
        }
        this.sendProjectionToPeer(peerId);
    }

    unregisterPeer(peerId) {
        this.peers.delete(peerId);
        this._puppetRates.delete(peerId);
    }

    sendProjectionToPeer(peerId) {
        const peer = this.peers.get(peerId);
        if (!peer) return;
        const projection = this.session.getProjection({ role: peer.role, actorId: peer.actorId });
        const events = this.session.getEventsSince(0, { role: peer.role, actorId: peer.actorId });
        const latestSeq = events.length ? events[events.length - 1].seq : 0;
        peer.lastSeq = latestSeq;
        this._sendToPeer(peerId, {
            type: 'STATE_PROJECTION',
            sessionId: this.session.sessionId,
            projection,
            lastSeq: latestSeq
        });
    }

    /**
     * Dispatches an authoritative local command (e.g. from the host Referee UI)
     * and fans out role-filtered events to every connected peer.
     */
    dispatchLocal(command) {
        const prevSeq = this._getLatestSeq();
        const outcome = this.session.dispatch(command);
        if (outcome.ok && !outcome.duplicate) {
            this._fanOutEventsSince(prevSeq);
        }
        return outcome;
    }

    handlePeerMessage(peerId, msg) {
        const peer = this.peers.get(peerId);
        if (!peer || !msg || typeof msg !== 'object') return;

        if (msg.type === 'SESSION_SYNC_REQUEST') {
            const afterSeq = Number.isFinite(msg.afterSeq) ? msg.afterSeq : peer.lastSeq;
            const missed = this.session.getEventsSince(afterSeq, { role: peer.role, actorId: peer.actorId });
            if (afterSeq <= 0) {
                this.sendProjectionToPeer(peerId);
                return;
            }
            for (const event of missed) {
                this._sendToPeer(peerId, {
                    type: 'SESSION_EVENT',
                    sessionId: this.session.sessionId,
                    event
                });
                peer.lastSeq = Math.max(peer.lastSeq, event.seq);
            }
            this._sendToPeer(peerId, {
                type: 'STATE_PROJECTION',
                sessionId: this.session.sessionId,
                projection: this.session.getProjection({ role: peer.role, actorId: peer.actorId }),
                lastSeq: peer.lastSeq
            });
            return;
        }

        if (msg.type === 'SESSION_COMMAND') {
            const cmd = msg.command;
            if (!cmd || typeof cmd !== 'object') {
                this._sendError(peerId, cmd?.id ?? null, 'INVALID_COMMAND', 'Missing command payload.');
                return;
            }
            // Enforce identity binding: a peer cannot spoof another actorId
            if (cmd.actorId !== peer.actorId) {
                this._sendError(peerId, cmd.id ?? null, 'FORBIDDEN', `Peer '${peerId}' cannot act as '${cmd.actorId}'.`);
                return;
            }
            const prevSeq = this._getLatestSeq();
            const outcome = this.session.dispatch(cmd);
            if (!outcome.ok) {
                this._sendError(peerId, cmd.id, outcome.error, outcome.message, outcome.revision);
                if (outcome.error === 'REVISION_CONFLICT') {
                    this.sendProjectionToPeer(peerId);
                }
                return;
            }
            if (outcome.duplicate) {
                const filteredEvents = (outcome.events || []).filter(evt =>
                    this.session.constructor.isEventVisibleTo(evt.visibility, { role: peer.role, actorId: peer.actorId })
                );
                for (const event of filteredEvents) {
                    this._sendToPeer(peerId, { type: 'SESSION_EVENT', sessionId: this.session.sessionId, event });
                }
                return;
            }
            this._fanOutEventsSince(prevSeq);
            return;
        }

        if (msg.type === 'SKIN_SYNC') {
            const { entityId, skinDocument } = msg;
            const prevSeq = this._getLatestSeq();
            const outcome = this.session.dispatch({
                id: `skin-${peer.actorId}-${this._now()}`,
                sessionId: this.session.sessionId,
                actorId: peer.actorId,
                type: 'VTT:SyncSkin',
                payload: { entityId, skinDocument }
            });
            if (!outcome.ok) {
                this._sendError(peerId, null, outcome.error, outcome.message);
                return;
            }
            this._fanOutEventsSince(prevSeq);
            return;
        }

        if (msg.type === 'AVATAR_PUPPET') {
            if (!this._allowPuppetFrame(peerId)) return;
            const frame = msg.frame;
            if (!frame || typeof frame !== 'object') return;
            for (const [otherPeerId] of this.peers.entries()) {
                if (otherPeerId === peerId) continue;
                this._sendToPeer(otherPeerId, {
                    type: 'AVATAR_PUPPET',
                    actorId: peer.actorId,
                    frame: clone(frame)
                });
            }
        }
    }

    _allowPuppetFrame(peerId) {
        const now = this._now();
        const windowStart = now - 1000;
        const list = (this._puppetRates.get(peerId) || []).filter(ts => ts >= windowStart);
        if (list.length >= PUPPET_RATE_LIMIT_PER_SEC) {
            this._puppetRates.set(peerId, list);
            return false;
        }
        list.push(now);
        this._puppetRates.set(peerId, list);
        return true;
    }

    _getLatestSeq() {
        const events = this.session.getEventsSince(0, { role: 'referee', actorId: this.session.refereeId });
        return events.length ? events[events.length - 1].seq : 0;
    }

    _fanOutEventsSince(afterSeq) {
        for (const [peerId, peer] of this.peers.entries()) {
            const visible = this.session.getEventsSince(afterSeq, { role: peer.role, actorId: peer.actorId });
            for (const event of visible) {
                this._sendToPeer(peerId, {
                    type: 'SESSION_EVENT',
                    sessionId: this.session.sessionId,
                    event
                });
                peer.lastSeq = Math.max(peer.lastSeq, event.seq);
            }
            // Send lightweight refreshed projection after state-mutating events so client caches converge
            if (visible.length > 0) {
                this._sendToPeer(peerId, {
                    type: 'STATE_PROJECTION',
                    sessionId: this.session.sessionId,
                    projection: this.session.getProjection({ role: peer.role, actorId: peer.actorId }),
                    lastSeq: peer.lastSeq
                });
            }
        }
    }

    _sendError(peerId, commandId, error, message, currentRevision = this.session.revision) {
        this._sendToPeer(peerId, {
            type: 'SESSION_ERROR',
            sessionId: this.session.sessionId,
            commandId,
            error,
            message,
            currentRevision
        });
    }

    _sendToPeer(peerId, msg) {
        if (this.transport instanceof InMemoryTransportHub) {
            this.transport.sendToPeer(peerId, msg);
        } else if (typeof this.transport?.sendToPeer === 'function') {
            this.transport.sendToPeer(peerId, msg);
        }
    }
}

/**
 * Client-side session proxy with reconnect catch-up and idempotent command queuing.
 */
export class VTTSessionClient {
    constructor({ peerId, actorId, sessionId = 'session-1', transport = null } = {}) {
        this.peerId = peerId ?? actorId;
        this.actorId = actorId;
        this.sessionId = sessionId;
        this.transport = transport;
        this.projection = null;
        this.lastSeq = 0;
        this.events = [];
        this.errors = [];
        this._commandCounter = 0;
        this._pendingCommands = new Map();
        this._listeners = new Map();

        if (this.transport instanceof InMemoryTransportHub) {
            this.transport.attachClient(this.peerId, (msg) => this.handleServerMessage(msg));
        } else if (typeof this.transport?.bindClient === 'function') {
            this.transport.bindClient((msg) => this.handleServerMessage(msg));
        }
    }

    on(event, fn) {
        if (!this._listeners.has(event)) this._listeners.set(event, new Set());
        this._listeners.get(event).add(fn);
        return () => this._listeners.get(event)?.delete(fn);
    }

    _emit(event, detail) {
        const set = this._listeners.get(event);
        if (!set) return;
        for (const fn of set) {
            try { fn(detail); } catch (e) {}
        }
    }

    nextCommandId(prefix = 'cmd') {
        this._commandCounter += 1;
        return `${prefix}-${this.actorId}-${this._commandCounter}`;
    }

    sendCommand(type, payload = {}, { id = null, expectedRevision = undefined } = {}) {
        const cmdId = id ?? this.nextCommandId(type.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        const command = {
            id: cmdId,
            sessionId: this.sessionId,
            actorId: this.actorId,
            ...(expectedRevision !== undefined ? { expectedRevision } : {}),
            type,
            payload: clone(payload)
        };
        const envelope = { type: 'SESSION_COMMAND', command };
        this._pendingCommands.set(cmdId, envelope);
        this._send(envelope);
        return cmdId;
    }

    requestSync() {
        this._send({
            type: 'SESSION_SYNC_REQUEST',
            sessionId: this.sessionId,
            afterSeq: this.lastSeq
        });
    }

    sendSkinSync(entityId, skinDocument) {
        this._send({
            type: 'SKIN_SYNC',
            entityId,
            skinDocument: clone(skinDocument)
        });
    }

    sendPuppetFrame(frame) {
        this._send({
            type: 'AVATAR_PUPPET',
            actorId: this.actorId,
            frame: clone(frame)
        });
    }

    flushPending() {
        for (const envelope of this._pendingCommands.values()) {
            this._send(envelope);
        }
    }

    handleServerMessage(msg) {
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'STATE_PROJECTION') {
            this.projection = clone(msg.projection);
            if (Number.isFinite(msg.lastSeq)) {
                this.lastSeq = Math.max(this.lastSeq, msg.lastSeq);
            }
            this._emit('projection', this.projection);
        } else if (msg.type === 'SESSION_EVENT') {
            const evt = msg.event;
            if (!evt) return;
            if (evt.commandId && this._pendingCommands.has(evt.commandId)) {
                this._pendingCommands.delete(evt.commandId);
            }
            if (!this.events.some(e => e.seq === evt.seq)) {
                this.events.push(clone(evt));
                this.events.sort((a, b) => a.seq - b.seq);
            }
            this.lastSeq = Math.max(this.lastSeq, evt.seq ?? 0);
            this._emit('event', evt);
        } else if (msg.type === 'SESSION_ERROR') {
            if (msg.commandId) this._pendingCommands.delete(msg.commandId);
            this.errors.push(clone(msg));
            this._emit('error', msg);
        } else if (msg.type === 'AVATAR_PUPPET') {
            this._emit('puppet', { actorId: msg.actorId, frame: msg.frame });
        }
    }

    _send(msg) {
        if (this.transport instanceof InMemoryTransportHub) {
            this.transport.sendToHost(this.peerId, msg);
        } else if (typeof this.transport?.sendToHost === 'function') {
            this.transport.sendToHost(msg);
        } else if (typeof this.transport?.send === 'function') {
            this.transport.send(msg);
        }
    }
}
