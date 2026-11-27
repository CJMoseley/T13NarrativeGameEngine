/**
 * @module Modules/Systems/T13Session
 * @description Headless, deterministic, isolated T13 game session runtime.
 * Supports concurrent independent sessions (no shared singletons), optimistic revision locking,
 * idempotent command deduplication, visibility-tagged event logs, role-filtered projections,
 * seeded PRNG state capture, and full JSON snapshot save/restore.
 */

import { validateSpeciesDescendant } from '../characters/T13SpeciesDescendant.js';
import { registerStage2Commands } from './T13SessionRules.js';

export const T13_SESSION_SCHEMA_VERSION = 1;

function deepClone(value) {
    if (value === null || value === undefined || typeof value !== 'object') {
        return value;
    }
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
}

function hashSeedString(seed) {
    if (typeof seed === 'number' && Number.isFinite(seed)) {
        return (seed | 0) >>> 0;
    }
    const str = String(seed ?? 't13-default-seed');
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
}

class SessionMulberry32 {
    constructor(seedOrState = 't13-default-seed', isRawState = false) {
        this.state = isRawState
            ? (Number(seedOrState) >>> 0)
            : hashSeedString(seedOrState);
    }

    nextRandom() {
        this.state = (this.state + 0x6D2B79F5) | 0;
        let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) | 0;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    nextInt(min = 0, max = 1) {
        let lo = Math.trunc(min);
        let hi = Math.trunc(max);
        if (hi < lo) [lo, hi] = [hi, lo];
        const span = hi - lo + 1;
        return lo + Math.floor(this.nextRandom() * span);
    }

    rollDie(sides = 6) {
        const s = Math.max(2, Math.trunc(sides));
        return this.nextInt(1, s);
    }

    getState() {
        return this.state >>> 0;
    }

    setState(rawState) {
        this.state = (Number(rawState) >>> 0);
    }
}

export class T13Session {
    /**
     * @param {object} [options]
     * @param {string} [options.sessionId]
     * @param {string|number} [options.seed]
     * @param {string} [options.refereeId='referee']
     * @param {object} [options.initialTable]
     */
    constructor(options = {}) {
        this.schemaVersion = T13_SESSION_SCHEMA_VERSION;
        this.sessionId = String(options.sessionId ?? 'session-1');
        this.seed = options.seed ?? 't13-default-seed';
        this.refereeId = String(options.refereeId ?? 'referee');

        this._rng = new SessionMulberry32(this.seed, false);
        this.revision = 0;
        this._nextEventSeq = 1;

        this._commandHandlers = new Map();
        this._processedCommands = new Map();
        this._eventLog = [];

        this._state = {
            actors: {
                system: { id: 'system', name: 'System', role: 'system', joinedAtRevision: 0 },
                [this.refereeId]: { id: this.refereeId, name: 'Referee', role: 'referee', joinedAtRevision: 0 }
            },
            speciesDescendants: {},
            characters: {},
            privateHands: {},
            publicHandCounts: {},
            wyrdTarotHands: {},
            publicWyrdTarotCounts: {},
            wyrdTarotSlots: {},
            preparedReserves: {},
            styleReserves: {},
            deck: { drawPile: [], discardPile: [], deckCount: 0 },
            drama: {
                tensionLevel: 1,
                latentLimit: 21,
                poolType: 'Water',
                thresholdModifier: 0,
                pool: [],
                activeDramas: [],
                history: [],
                lastLatentPlotId: null,
                consecutiveLatentCount: 0
            },
            yarnWeaves: [],
            plots: {},
            refereeSecrets: {
                notes: {},
                hiddenPlots: {},
                hiddenObstacles: {}
            },
            table: deepClone(options.initialTable ?? { tokens: {}, activeOrdeal: null, ordealHistory: [] })
        };

        this._registerBuiltinCommands();
        registerStage2Commands(this);
    }

    nextRandom() {
        return this._rng.nextRandom();
    }

    nextInt(min = 0, max = 1) {
        return this._rng.nextInt(min, max);
    }

    rollDie(sides = 6) {
        return this._rng.rollDie(sides);
    }

    /**
     * Registers a command handler.
     * @param {string} type
     * @param {object} definition - { roles?: string[], handler: (ctx) => any }
     */
    registerCommand(type, definition) {
        if (typeof type !== 'string' || !type.trim()) {
            throw new Error('T13Session.registerCommand: command type must be a non-empty string.');
        }
        const handler = typeof definition === 'function' ? definition : definition?.handler;
        if (typeof handler !== 'function') {
            throw new Error(`T13Session.registerCommand: '${type}' requires a handler function.`);
        }
        const roles = Array.isArray(definition?.roles) ? [...definition.roles] : ['referee', 'player', 'system'];
        this._commandHandlers.set(type, { roles, handler });
    }

    /**
     * Resolves an actor's role in this session.
     * @param {string} actorId
     * @returns {string|null}
     */
    getActorRole(actorId) {
        if (!actorId) return null;
        const actor = this._state.actors[actorId];
        return actor ? actor.role : null;
    }

    /**
     * Dispatches an authoritative revisioned command into the session.
     * @param {object} command
     * @returns {{ok: boolean, duplicate?: boolean, error?: string, revision: number, currentRevision?: number, events?: Array, result?: any}}
     */
    dispatch(command) {
        if (!command || typeof command !== 'object' || Array.isArray(command)) {
            return { ok: false, error: 'INVALID_COMMAND', message: 'Command must be a plain object.', revision: this.revision };
        }
        const { id, sessionId, actorId, expectedRevision, type, payload = {} } = command;

        if (typeof id !== 'string' || !id.trim()) {
            return { ok: false, error: 'INVALID_COMMAND', message: 'Command id is required.', revision: this.revision };
        }
        if (sessionId !== this.sessionId) {
            return {
                ok: false,
                error: 'SESSION_MISMATCH',
                message: `Expected sessionId '${this.sessionId}', received '${sessionId}'.`,
                revision: this.revision
            };
        }
        if (typeof actorId !== 'string' || !actorId.trim()) {
            return { ok: false, error: 'INVALID_COMMAND', message: 'actorId is required.', revision: this.revision };
        }
        if (typeof type !== 'string' || !type.trim()) {
            return { ok: false, error: 'INVALID_COMMAND', message: 'Command type is required.', revision: this.revision };
        }

        // Idempotent deduplication takes precedence over expectedRevision on retries
        if (this._processedCommands.has(id)) {
            const recorded = this._processedCommands.get(id);
            if (recorded.type !== type || recorded.actorId !== actorId) {
                return {
                    ok: false,
                    error: 'COMMAND_ID_CONFLICT',
                    message: `Command id '${id}' already used by '${recorded.type}'.`,
                    revision: this.revision
                };
            }
            return {
                ok: true,
                duplicate: true,
                revision: recorded.revision,
                events: deepClone(recorded.events),
                result: deepClone(recorded.result)
            };
        }

        if (expectedRevision !== undefined && expectedRevision !== null && expectedRevision !== this.revision) {
            return {
                ok: false,
                error: 'REVISION_CONFLICT',
                message: `Expected revision ${expectedRevision}, current revision is ${this.revision}.`,
                revision: this.revision,
                currentRevision: this.revision
            };
        }

        const spec = this._commandHandlers.get(type);
        if (!spec) {
            return {
                ok: false,
                error: 'UNKNOWN_COMMAND',
                message: `Unknown command '${type}'.`,
                revision: this.revision
            };
        }

        // Resolve role (Session:Join allows self-joining as a player before actor record exists)
        const existingRole = this.getActorRole(actorId);
        const effectiveRole = existingRole ?? (type === 'Session:Join' ? 'player' : null);

        if (!effectiveRole || !spec.roles.includes(effectiveRole)) {
            return {
                ok: false,
                error: 'FORBIDDEN',
                message: `Actor '${actorId}' (${effectiveRole ?? 'unregistered'}) is not authorized for '${type}'.`,
                revision: this.revision
            };
        }

        // Capture rollback checkpoints so failed handlers leave zero mutation or RNG drift
        const preState = deepClone(this._state);
        const preRngState = this._rng.getState();
        const nextRevision = this.revision + 1;
        const stagedEvents = [];

        const emit = (eventType, eventPayload = {}, visibility = 'public') => {
            const evt = {
                seq: this._nextEventSeq + stagedEvents.length,
                revision: nextRevision,
                commandId: id,
                actorId,
                type: eventType,
                visibility: Array.isArray(visibility) ? [...visibility] : String(visibility),
                payload: deepClone(eventPayload)
            };
            stagedEvents.push(evt);
            return evt;
        };

        let result;
        try {
            result = spec.handler({
                session: this,
                state: this._state,
                actorId,
                actorRole: effectiveRole,
                payload: deepClone(payload),
                revision: nextRevision,
                emit
            });
        } catch (err) {
            this._state = preState;
            this._rng.setState(preRngState);
            return {
                ok: false,
                error: err?.code || 'HANDLER_ERROR',
                message: err?.message || String(err),
                revision: this.revision
            };
        }

        this.revision = nextRevision;
        this._nextEventSeq += stagedEvents.length;
        this._eventLog.push(...stagedEvents);

        this._processedCommands.set(id, {
            id,
            type,
            actorId,
            revision: nextRevision,
            events: deepClone(stagedEvents),
            result: deepClone(result ?? null)
        });

        return {
            ok: true,
            duplicate: false,
            revision: this.revision,
            events: deepClone(stagedEvents),
            result: deepClone(result ?? null)
        };
    }

    /**
     * Checks whether a single event visibility tag or array of tags permits access.
     * @param {string|string[]} visibility
     * @param {{role?: string, actorId?: string|null}} viewer
     * @returns {boolean}
     */
    static isEventVisibleTo(visibility, { role = 'player', actorId = null } = {}) {
        const isReferee = role === 'referee' || role === 'system';
        if (isReferee) return true;

        const tags = Array.isArray(visibility) ? visibility : [visibility];
        for (const tag of tags) {
            if (tag === 'public') return true;
            if (actorId && tag === `player:${actorId}`) return true;
        }
        return false;
    }

    /**
     * Returns ordered events with seq > afterSeq that are visible to the given role/actor.
     * @param {number} [afterSeq=0]
     * @param {{role?: string, actorId?: string|null}} [viewer]
     * @returns {Array<object>}
     */
    getEventsSince(afterSeq = 0, viewer = { role: 'player', actorId: null }) {
        const cutoff = Number.isFinite(afterSeq) ? afterSeq : 0;
        return this._eventLog
            .filter(evt => evt.seq > cutoff && T13Session.isEventVisibleTo(evt.visibility, viewer))
            .map(deepClone);
    }

    /**
     * Returns a role-filtered, deep-cloned state projection safe to send across network boundaries.
     * @param {{role?: string, actorId?: string|null}} [viewer]
     * @returns {object}
     */
    getProjection(viewer = { role: 'player', actorId: null }) {
        const role = viewer?.role ?? 'player';
        const actorId = viewer?.actorId ?? null;
        const isReferee = role === 'referee' || role === 'system';

        const publicPlots = {};
        for (const [pid, plot] of Object.entries(this._state.plots || {})) {
            if (isReferee || plot.status !== 'Hidden') {
                publicPlots[pid] = deepClone(plot);
            }
        }

        const maskedWyrdSlots = {};
        for (const [entityId, stack] of Object.entries(this._state.wyrdTarotSlots || {})) {
            maskedWyrdSlots[entityId] = (Array.isArray(stack) ? stack : []).map(entry => {
                if (isReferee || !entry.faceDown || (actorId && entry.playedBy === actorId)) {
                    return deepClone(entry);
                }
                return {
                    id: entry.id,
                    faceDown: true,
                    playedBy: entry.playedBy,
                    orientation: 'hidden',
                    active: false,
                    suspended: Boolean(entry.suspended),
                    promised: Boolean(entry.promised)
                };
            });
        }

        const projection = {
            schemaVersion: this.schemaVersion,
            sessionId: this.sessionId,
            revision: this.revision,
            actors: deepClone(this._state.actors),
            speciesDescendants: deepClone(this._state.speciesDescendants),
            characters: deepClone(this._state.characters),
            publicHandCounts: deepClone(this._state.publicHandCounts),
            publicWyrdTarotCounts: deepClone(this._state.publicWyrdTarotCounts || {}),
            wyrdTarotSlots: maskedWyrdSlots,
            preparedReserves: deepClone(this._state.preparedReserves),
            styleReserves: deepClone(this._state.styleReserves),
            deckCounts: {
                deckCount: this._state.deck?.deckCount ?? 0,
                drawPileCount: this._state.deck?.drawPile?.length ?? 0,
                discardPileCount: this._state.deck?.discardPile?.length ?? 0
            },
            drama: deepClone(this._state.drama),
            yarnWeaves: deepClone(this._state.yarnWeaves || []),
            plots: publicPlots,
            table: deepClone(this._state.table),
            privateHand: actorId && this._state.privateHands[actorId]
                ? deepClone(this._state.privateHands[actorId])
                : [],
            wyrdTarotHand: actorId && this._state.wyrdTarotHands?.[actorId]
                ? deepClone(this._state.wyrdTarotHands[actorId])
                : []
        };

        if (isReferee) {
            projection.privateHands = deepClone(this._state.privateHands);
            projection.wyrdTarotHands = deepClone(this._state.wyrdTarotHands || {});
            projection.refereeSecrets = deepClone(this._state.refereeSecrets);
            projection.deck = deepClone(this._state.deck);
        }

        return projection;
    }

    /**
     * Serializes the complete authoritative session state, PRNG cursor, deduplication ledger,
     * and event log into a JSON-safe plain object.
     * @returns {object}
     */
    snapshot() {
        return {
            schemaVersion: this.schemaVersion,
            sessionId: this.sessionId,
            seed: this.seed,
            refereeId: this.refereeId,
            rngState: this._rng.getState(),
            revision: this.revision,
            nextEventSeq: this._nextEventSeq,
            state: deepClone(this._state),
            eventLog: deepClone(this._eventLog),
            processedCommands: Array.from(this._processedCommands.values()).map(deepClone)
        };
    }

    /**
     * Restores an isolated T13Session from a snapshot object or JSON string.
     * @param {object|string} input
     * @param {object} [options] - Optional { commands } extra handlers to register.
     * @returns {T13Session}
     */
    static fromSnapshot(input, options = {}) {
        const snap = typeof input === 'string' ? JSON.parse(input) : input;
        if (!snap || typeof snap !== 'object') {
            throw new Error('T13Session.fromSnapshot: Invalid snapshot input.');
        }
        if (snap.schemaVersion !== T13_SESSION_SCHEMA_VERSION) {
            throw new Error(`T13Session.fromSnapshot: Unsupported schemaVersion '${snap.schemaVersion}'.`);
        }

        const session = new T13Session({
            sessionId: snap.sessionId,
            seed: snap.seed,
            refereeId: snap.refereeId
        });

        session._rng.setState(snap.rngState);
        session.revision = snap.revision ?? 0;
        session._nextEventSeq = snap.nextEventSeq ?? (Array.isArray(snap.eventLog) ? snap.eventLog.length + 1 : 1);
        session._state = deepClone(snap.state);
        if (!session._state.wyrdTarotHands) session._state.wyrdTarotHands = {};
        if (!session._state.publicWyrdTarotCounts) session._state.publicWyrdTarotCounts = {};
        if (!session._state.wyrdTarotSlots) session._state.wyrdTarotSlots = {};
        if (!session._state.yarnWeaves) session._state.yarnWeaves = [];
        if (!session._state.drama) {
            session._state.drama = {
                tensionLevel: 1,
                latentLimit: 21,
                poolType: 'Water',
                thresholdModifier: 0,
                pool: [],
                activeDramas: [],
                history: [],
                lastLatentPlotId: null,
                consecutiveLatentCount: 0
            };
        }
        session._eventLog = Array.isArray(snap.eventLog) ? deepClone(snap.eventLog) : [];
        session._processedCommands = new Map();

        if (Array.isArray(snap.processedCommands)) {
            for (const entry of snap.processedCommands) {
                session._processedCommands.set(entry.id, deepClone(entry));
            }
        }

        if (options.commands && typeof options.commands === 'object') {
            for (const [cmdType, def] of Object.entries(options.commands)) {
                session.registerCommand(cmdType, def);
            }
        }

        return session;
    }

    _registerBuiltinCommands() {
        this.registerCommand('Session:Join', {
            roles: ['referee', 'player', 'system'],
            handler: ({ state, actorId, actorRole, payload, revision, emit }) => {
                const isAuthority = actorRole === 'referee' || actorRole === 'system';
                const targetId = isAuthority && payload.actorId ? String(payload.actorId) : actorId;
                const requestedRole = payload.role ? String(payload.role) : 'player';
                const assignedRole = isAuthority && ['player', 'referee', 'observer'].includes(requestedRole)
                    ? requestedRole
                    : (state.actors[targetId]?.role ?? 'player');

                const actorRecord = {
                    id: targetId,
                    name: String(payload.name ?? state.actors[targetId]?.name ?? targetId),
                    role: assignedRole,
                    joinedAtRevision: revision
                };
                state.actors[targetId] = actorRecord;
                if (!state.privateHands[targetId]) {
                    state.privateHands[targetId] = [];
                    state.publicHandCounts[targetId] = 0;
                }
                emit('Session:ActorJoined', { actor: actorRecord }, 'public');
                return { actor: deepClone(actorRecord) };
            }
        });

        this.registerCommand('Session:Leave', {
            roles: ['referee', 'player', 'system'],
            handler: ({ state, actorId, actorRole, payload, emit }) => {
                const isAuthority = actorRole === 'referee' || actorRole === 'system';
                const targetId = isAuthority && payload.actorId ? String(payload.actorId) : actorId;
                if (targetId === 'system' || targetId === this.refereeId) {
                    const err = new Error(`Cannot remove core authority actor '${targetId}'.`);
                    err.code = 'FORBIDDEN';
                    throw err;
                }
                delete state.actors[targetId];
                emit('Session:ActorLeft', { actorId: targetId }, 'public');
                return { removedActorId: targetId };
            }
        });

        this.registerCommand('Species:Register', {
            roles: ['referee', 'system'],
            handler: ({ state, payload, emit }) => {
                const rawSpec = payload.species ?? payload;
                const validation = validateSpeciesDescendant(rawSpec);
                if (!validation.valid) {
                    const err = new Error(validation.errors.join(' '));
                    err.code = 'INVALID_SPECIES';
                    throw err;
                }
                const species = validation.normalized;
                state.speciesDescendants[species.id] = species;
                emit('Species:Registered', { species }, 'public');
                return { species: deepClone(species) };
            }
        });

        this.registerCommand('Character:Register', {
            roles: ['referee', 'player', 'system'],
            handler: ({ state, actorId, actorRole, payload, emit }) => {
                const char = deepClone(payload.character ?? payload);
                if (!char || typeof char !== 'object' || !char.id) {
                    const err = new Error('Character:Register requires payload.character with an id.');
                    err.code = 'INVALID_CHARACTER';
                    throw err;
                }
                const isAuthority = actorRole === 'referee' || actorRole === 'system';
                const ownerActorId = isAuthority && char.ownerActorId ? String(char.ownerActorId) : actorId;
                char.ownerActorId = ownerActorId;
                state.characters[char.id] = char;
                emit('Character:Registered', { character: char }, 'public');
                return { character: deepClone(char) };
            }
        });

        this.registerCommand('Character:Update', {
            roles: ['referee', 'player', 'system'],
            handler: ({ state, actorId, actorRole, payload, emit }) => {
                const charId = String(payload.characterId ?? payload.id ?? '');
                const existing = state.characters[charId];
                if (!existing) {
                    const err = new Error(`Character '${charId}' not found.`);
                    err.code = 'NOT_FOUND';
                    throw err;
                }
                const isAuthority = actorRole === 'referee' || actorRole === 'system';
                if (!isAuthority && existing.ownerActorId !== actorId) {
                    const err = new Error(`Actor '${actorId}' does not own character '${charId}'.`);
                    err.code = 'FORBIDDEN';
                    throw err;
                }
                const patch = payload.patch ?? payload.updates ?? {};
                const updated = {
                    ...existing,
                    ...deepClone(patch),
                    id: existing.id,
                    ownerActorId: isAuthority && patch.ownerActorId ? patch.ownerActorId : existing.ownerActorId
                };
                state.characters[charId] = updated;
                emit('Character:Updated', { characterId: charId, character: updated }, 'public');
                return { character: deepClone(updated) };
            }
        });

        this.registerCommand('Hand:DealPrivate', {
            roles: ['referee', 'system'],
            handler: ({ session, state, payload, emit }) => {
                const targetActorId = String(payload.targetActorId ?? '');
                if (!targetActorId || !state.actors[targetActorId]) {
                    const err = new Error(`Target actor '${targetActorId}' is not registered in session.`);
                    err.code = 'INVALID_TARGET';
                    throw err;
                }

                let dealtCards;
                if (Array.isArray(payload.cards) && payload.cards.length > 0) {
                    dealtCards = deepClone(payload.cards);
                } else {
                    const count = Math.max(1, Math.trunc(payload.count ?? 1));
                    const suits = ['Diamonds', 'Hearts', 'Clubs', 'Spades'];
                    dealtCards = [];
                    for (let i = 0; i < count; i++) {
                        const suit = suits[session.nextInt(0, suits.length - 1)];
                        const pips = session.nextInt(1, 13);
                        dealtCards.push({ id: `card-${session.revision + 1}-${i}`, suit, pips });
                    }
                }

                if (!Array.isArray(state.privateHands[targetActorId])) {
                    state.privateHands[targetActorId] = [];
                }
                state.privateHands[targetActorId].push(...dealtCards);
                const totalHandCount = state.privateHands[targetActorId].length;
                state.publicHandCounts[targetActorId] = totalHandCount;

                emit('Hand:DealtPrivate', { targetActorId, cards: dealtCards }, ['referee', `player:${targetActorId}`]);
                emit('Hand:CountChanged', { targetActorId, added: dealtCards.length, totalHandCount }, 'public');

                return { targetActorId, count: dealtCards.length, totalHandCount };
            }
        });

        this.registerCommand('Referee:SetSecretNote', {
            roles: ['referee', 'system'],
            handler: ({ state, payload, emit }) => {
                const key = String(payload.key ?? '');
                if (!key) {
                    const err = new Error('Referee:SetSecretNote requires a non-empty key.');
                    err.code = 'INVALID_KEY';
                    throw err;
                }
                state.refereeSecrets.notes[key] = deepClone(payload.note ?? payload.value ?? '');
                emit('Referee:SecretNoteUpdated', { key, note: state.refereeSecrets.notes[key] }, 'referee');
                return { key };
            }
        });

        this.registerCommand('RNG:Draw', {
            roles: ['referee', 'player', 'system'],
            handler: ({ session, payload, emit }) => {
                const count = Math.max(1, Math.min(64, Math.trunc(payload.count ?? 1)));
                const results = [];
                if (payload.min !== undefined || payload.max !== undefined) {
                    const min = Math.trunc(payload.min ?? 0);
                    const max = Math.trunc(payload.max ?? 1);
                    for (let i = 0; i < count; i++) results.push(session.nextInt(min, max));
                } else {
                    const sides = Math.max(2, Math.trunc(payload.sides ?? 13));
                    for (let i = 0; i < count; i++) results.push(session.rollDie(sides));
                }
                emit('RNG:Drawn', { results }, 'public');
                return { results };
            }
        });
    }
}

export default T13Session;
