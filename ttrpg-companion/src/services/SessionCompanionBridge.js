import { EventBus } from '../../../src/t13ne/core/EventBus.js';
import { T13Session } from '../../../src/t13ne/modules/systems/T13Session.js';
import { solveAuthChallenge } from '../../../src/t13ne/modules/vtt/VTTAuthService.js';
import {
    InMemoryTransportHub,
    VTTSessionClient,
    VTTSessionHost,
    WebSocketTransportAdapter
} from '../../../src/t13ne/modules/vtt/VTTTransportService.js';

/**
 * Coordinates authentication (ES256 JWT + challenge-response), authoritative VTT transport
 * (WebSocket/REST server with offline InMemory host fallback), and live component synchronization.
 */
export class SessionCompanionBridge {
    constructor({ apiBase = 'http://localhost:5713', wsUrl = 'ws://localhost:5713', sessionId = 'default', actorId = null, mode = 'player' } = {}) {
        this.apiBase = apiBase;
        this.wsUrl = wsUrl;
        this.sessionId = sessionId;
        this.mode = mode;
        this.actorId = actorId || `${mode}-${Math.random().toString(36).slice(2, 8)}`;
        this.token = null;
        this.role = 'player';
        this.transportMode = 'offline';
        this.host = null;
        this.client = null;
        this.wsAdapter = null;
        this._boundTargets = {
            vttCanvas: null,
            characterSheet: null,
            cardHud: null,
            refereeConsole: null,
            audioDirector: null,
            voipManager: null,
            liveAvatarController: null
        };
        this._commandListeners = new Set();
        this._eventUnsubs = [];
    }

    attachComponents(targets = {}) {
        Object.assign(this._boundTargets, targets);
        this._syncBindings();
    }

    _syncBindings() {
        const {
            vttCanvas,
            characterSheet,
            cardHud,
            refereeConsole,
            audioDirector,
            voipManager,
            liveAvatarController
        } = this._boundTargets;

        if (!this.client) return;

        while (this._eventUnsubs.length) {
            try { this._eventUnsubs.pop()?.(); } catch (_) {}
        }

        if (vttCanvas?.bindSessionClient) {
            vttCanvas.bindSessionClient(this.client, this.role);
        }
        if (characterSheet?.bindSessionClient) {
            characterSheet.bindSessionClient(this.client);
            characterSheet.setAudioHooks({ voipManager, liveAvatarController });
        }
        if (cardHud?.bindSessionClient) {
            cardHud.bindSessionClient(this.client, this.actorId);
            cardHud.setVOIPManager(voipManager);
        }
        if (refereeConsole?.bindSessionClient) {
            refereeConsole.bindSessionClient(this.client);
            refereeConsole.setBridge(this);
            refereeConsole.setAuthorized(this.role === 'referee');
            refereeConsole.setAudioHooks({ voipManager, audioDirector });
        }

        const uEvt = this.client.on('event', (evt) => {
            if (audioDirector?.handleSessionEvent) {
                try { audioDirector.handleSessionEvent(evt); } catch (_) {}
            }
            for (const fn of this._commandListeners) {
                try { fn(evt); } catch (_) {}
            }
        });
        const uProj = this.client.on('projection', (proj) => {
            if (refereeConsole) refereeConsole.setAuthorized(this.role === 'referee');
            if (characterSheet) characterSheet.setSessionState(proj);
            if (cardHud) cardHud.setSessionState(proj, this.actorId);
            if (vttCanvas && proj?.table) vttCanvas.syncFromProjection(proj, this.role);
        });
        const uPuppet = this.client.on('puppet', ({ actorId, frame }) => {
            EventBus.emit('avatar:remote-puppet', { actorId, frame });
            if (vttCanvas?.applyRemotePuppet) {
                vttCanvas.applyRemotePuppet(actorId, frame);
            }
        });
        if (typeof uEvt === 'function') this._eventUnsubs.push(uEvt);
        if (typeof uProj === 'function') this._eventUnsubs.push(uProj);
        if (typeof uPuppet === 'function') this._eventUnsubs.push(uPuppet);
    }

    onSessionEvent(fn) {
        this._commandListeners.add(fn);
        return () => this._commandListeners.delete(fn);
    }

    async fetchPlayerToken() {
        const res = await fetch(`${this.apiBase}/api/v1/auth/player-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actorId: this.actorId, sessionId: this.sessionId })
        });
        if (!res.ok) throw new Error(`Failed to fetch player token (${res.status}).`);
        const data = await res.json();
        this.token = data.token;
        this.role = 'player';
        return data;
    }

    async elevateWithPassphrase(passphrase) {
        if (!passphrase || !String(passphrase).trim()) {
            throw new Error('Referee passphrase is required.');
        }
        const chRes = await fetch(`${this.apiBase}/api/v1/auth/challenge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!chRes.ok) {
            throw new Error(`Challenge request failed (${chRes.status}).`);
        }
        const challenge = await chRes.json();
        const proof = await solveAuthChallenge(String(passphrase), challenge);

        const verRes = await fetch(`${this.apiBase}/api/v1/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                challengeId: challenge.challengeId,
                response: proof,
                actorId: this.actorId,
                sessionId: this.sessionId
            })
        });
        const verified = await verRes.json().catch(() => ({}));
        if (!verRes.ok || !verified.ok || !verified.token) {
            throw new Error(verified.error || 'Referee credential verification failed.');
        }

        this.token = verified.token;
        this.role = 'referee';
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('t13ne_referee_token', this.token);
        }

        // Re-join active WS session or upgrade offline host role
        if (this.wsAdapter && this.wsAdapter.connected) {
            this.wsAdapter.send({
                type: 'SESSION_JOIN',
                sessionId: this.sessionId,
                actorId: this.actorId,
                token: this.token
            });
        } else if (this.host) {
            this.host.session.dispatch({
                id: `local-elevate-${Date.now()}`,
                sessionId: this.sessionId,
                actorId: this.host.session.refereeId,
                type: 'Session:Join',
                payload: { actorId: this.actorId, role: 'referee', name: 'Referee' }
            });
            this.client?.requestSync();
        }
        this._syncBindings();
        return verified;
    }

    async deElevate() {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('t13ne_referee_token');
        }
        this.role = 'player';
        this.token = null;
        try {
            await this.fetchPlayerToken();
            if (this.wsAdapter && this.wsAdapter.connected) {
                this.wsAdapter.send({
                    type: 'SESSION_JOIN',
                    sessionId: this.sessionId,
                    actorId: this.actorId,
                    token: this.token
                });
            }
        } catch (_) {
            if (this.host) {
                this.host.session.dispatch({
                    id: `local-deelevate-${Date.now()}`,
                    sessionId: this.sessionId,
                    actorId: this.host.session.refereeId,
                    type: 'Session:Join',
                    payload: { actorId: this.actorId, role: 'player', name: this.actorId }
                });
                this.client?.requestSync();
            }
        }
        this._syncBindings();
    }

    async connect({ sessionId = this.sessionId, actorId = this.actorId, storedRefereeToken = null } = {}) {
        this.sessionId = sessionId || 'default';
        this.actorId = actorId || this.actorId;
        this.token = storedRefereeToken || this.token;

        try {
            if (!this.token) {
                await this.fetchPlayerToken();
            }
            const adapter = new WebSocketTransportAdapter({
                wsUrl: this.wsUrl,
                sessionId: this.sessionId,
                actorId: this.actorId,
                token: this.token
            });
            const client = new VTTSessionClient({
                peerId: this.actorId,
                actorId: this.actorId,
                sessionId: this.sessionId,
                transport: adapter
            });
            await adapter.connect({
                onMessage: (msg) => {
                    if (msg?.type === 'registered' && msg.role) {
                        this.role = msg.role;
                        this._boundTargets.refereeConsole?.setAuthorized(this.role === 'referee');
                        if (this._boundTargets.vttCanvas) {
                            this._boundTargets.vttCanvas.viewerRole = this.role;
                        }
                    }
                    client.handleServerMessage(msg);
                }
            });
            this.wsAdapter = adapter;
            this.client = client;
            this.transportMode = 'websocket';
            this._syncBindings();
            return { transportMode: 'websocket', role: this.role, client };
        } catch (_) {
            return this.connectOfflineFallback();
        }
    }

    connectOfflineFallback() {
        const hub = new InMemoryTransportHub();
        const session = new T13Session({ sessionId: this.sessionId, refereeId: this.actorId });
        const host = new VTTSessionHost(session, { transport: hub });
        const initialRole = this.mode === 'referee' ? 'referee' : 'player';
        this.role = initialRole;
        session.dispatch({
            id: `init-join-${this.actorId}`,
            sessionId: this.sessionId,
            actorId: session.refereeId,
            type: 'Session:Join',
            payload: { actorId: this.actorId, role: initialRole, name: this.actorId }
        });
        host.peers.set(this.actorId, { actorId: this.actorId, role: initialRole, lastSeq: 0 });
        const client = new VTTSessionClient({
            peerId: this.actorId,
            actorId: this.actorId,
            sessionId: this.sessionId,
            transport: hub
        });
        client.requestSync();
        this.host = host;
        this.client = client;
        this.transportMode = 'offline';
        this._syncBindings();
        return { transportMode: 'offline', role: this.role, client };
    }

    async fetchSnapshot() {
        if (this.transportMode === 'websocket') {
            const res = await fetch(`${this.apiBase}/api/v1/sessions/${encodeURIComponent(this.sessionId)}/snapshot`, {
                headers: this.token ? { Authorization: `Bearer ${this.token}` } : {}
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || `Snapshot fetch failed (${res.status})`);
            return data.snapshot;
        }
        return this.host?.session?.snapshot?.() ?? null;
    }

    async restoreSnapshot(snapshot) {
        if (this.transportMode === 'websocket') {
            const res = await fetch(`${this.apiBase}/api/v1/sessions/${encodeURIComponent(this.sessionId)}/restore`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
                },
                body: JSON.stringify({ snapshot })
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || `Snapshot restore failed (${res.status})`);
            this.client?.requestSync();
            return data;
        }
        if (this.host) {
            this.host.session = T13Session.fromSnapshot(snapshot);
            this.client?.requestSync();
            return { ok: true, sessionId: this.host.session.sessionId, revision: this.host.session.revision };
        }
        return null;
    }

    dispose() {
        while (this._eventUnsubs.length) {
            try { this._eventUnsubs.pop()?.(); } catch (_) {}
        }
        this.wsAdapter?.close();
    }
}
