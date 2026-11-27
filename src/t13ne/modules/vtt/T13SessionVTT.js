/**
 * @module Modules/VTT/T13SessionVTT
 * @description Authoritative VTT table commands (tokens, board/grid config, ActionSpace zones,
 * fog-of-war, and portable AvatarSkinDocument sync) registered into headless T13Session.
 */

function clone(value) {
    if (value === null || value === undefined || typeof value !== 'object') return value;
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

export const VTT_GRID_TYPES = Object.freeze(['square', 'hex', 'none']);
export const VTT_VIEW_MODES = Object.freeze(['2d-topdown', '3d-orbit', 'psychosocial']);
export const VTT_TOKEN_TYPES = Object.freeze(['character', 'extra', 'creature', 'prop', 'terrain']);
export const VTT_ALLEGIANCES = Object.freeze(['ally', 'enemy', 'neutral', 'prop']);
export const VTT_ZONE_KINDS = Object.freeze(['Open', 'Closed', 'Difficult', 'Hazard', 'Custom']);

export function createDefaultVTTTableState() {
    return {
        tokens: {},
        activeOrdeal: null,
        ordealHistory: [],
        board: {
            width: 20,
            height: 20,
            gridType: 'square',
            gridSize: 1,
            snapEnabled: true,
            viewMode: '3d-orbit',
            backdropUrl: null,
            actionSpaceType: 'Battle-board'
        },
        zones: {},
        fogOfWar: {
            enabled: false,
            hiddenCells: [],
            revealedAreas: []
        },
        skins: {}
    };
}

export function ensureVTTTableShape(table) {
    const defaults = createDefaultVTTTableState();
    if (!table || typeof table !== 'object') return defaults;
    if (!table.tokens || typeof table.tokens !== 'object') table.tokens = {};
    if (!Array.isArray(table.ordealHistory)) table.ordealHistory = [];
    if (!table.board || typeof table.board !== 'object') {
        table.board = defaults.board;
    } else {
        table.board = { ...defaults.board, ...table.board };
    }
    if (!table.zones || typeof table.zones !== 'object') table.zones = {};
    if (!table.fogOfWar || typeof table.fogOfWar !== 'object') {
        table.fogOfWar = defaults.fogOfWar;
    } else {
        table.fogOfWar = {
            enabled: Boolean(table.fogOfWar.enabled),
            hiddenCells: Array.isArray(table.fogOfWar.hiddenCells) ? table.fogOfWar.hiddenCells : [],
            revealedAreas: Array.isArray(table.fogOfWar.revealedAreas) ? table.fogOfWar.revealedAreas : []
        };
    }
    if (!table.skins || typeof table.skins !== 'object') table.skins = {};
    return table;
}

function validatePosition(pos, fallback = { x: 0, y: 0, z: 0 }) {
    if (!pos) return { ...fallback };
    const x = Number(pos.x ?? 0);
    const y = Number(pos.y ?? 0);
    const z = Number(pos.z ?? 0);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        const err = new Error('Token position coordinates (x, y, z) must be finite numbers.');
        err.code = 'INVALID_POSITION';
        throw err;
    }
    return { x, y, z };
}

function validateBackdropUrl(url) {
    if (url === null || url === undefined || url === '') return null;
    if (typeof url !== 'string' || url.length > 2048) {
        const err = new Error('backdropUrl must be a string up to 2048 characters or null.');
        err.code = 'INVALID_BOARD_CONFIG';
        throw err;
    }
    const trimmed = url.trim();
    if (/^(javascript|vbscript):/i.test(trimmed)) {
        const err = new Error('Disallowed backdropUrl scheme.');
        err.code = 'INVALID_BOARD_CONFIG';
        throw err;
    }
    return trimmed;
}

function isValidSkinSummary(doc) {
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return false;
    if (doc.format !== 't13-avatar-skin') return false;
    if (!Number.isInteger(doc.version) || doc.version < 1 || doc.version > 4) return false;
    if (typeof doc.bodyPlan !== 'string' || !doc.bodyPlan.trim()) return false;
    const hasPixels = Array.isArray(doc.pixels) || Array.isArray(doc.rlePixels) ||
        typeof doc.regionRleRgb24Base64 === 'string' || typeof doc.regionRleRgb565Base64 === 'string' ||
        typeof doc.regionRgbBase64 === 'string' || typeof doc.regionRgb565Base64 === 'string';
    if (!hasPixels) return false;
    if (Array.isArray(doc.pixels) && doc.pixels.length > 512 * 512 * 4) return false;
    return true;
}

export function registerVTTCommands(session) {
    session.registerCommand('VTT:SpawnToken', {
        roles: ['referee', 'player', 'system'],
        handler: ({ state, actorId, actorRole, payload, revision, emit }) => {
            const table = ensureVTTTableShape(state.table);
            state.table = table;
            const isAuthority = actorRole === 'referee' || actorRole === 'system';

            const raw = payload.token ?? payload;
            const tokenId = String(raw.id ?? payload.tokenId ?? `token-${revision}-${Object.keys(table.tokens).length + 1}`).trim();
            if (!tokenId) {
                const err = new Error('VTT:SpawnToken requires a valid tokenId.');
                err.code = 'INVALID_TOKEN';
                throw err;
            }
            if (!isAuthority && raw.hidden) {
                const err = new Error('Players cannot spawn hidden Referee tokens.');
                err.code = 'FORBIDDEN';
                throw err;
            }
            if (!isAuthority && raw.ownerActorId && raw.ownerActorId !== actorId) {
                const err = new Error('Players can only spawn tokens owned by themselves.');
                err.code = 'FORBIDDEN';
                throw err;
            }

            const tokenType = VTT_TOKEN_TYPES.includes(raw.tokenType) ? raw.tokenType : 'character';
            const allegiance = VTT_ALLEGIANCES.includes(raw.allegiance)
                ? raw.allegiance
                : (tokenType === 'prop' || tokenType === 'terrain' ? 'prop' : 'ally');

            const token = {
                id: tokenId,
                name: String(raw.name ?? tokenId).slice(0, 80),
                tokenType,
                ownerActorId: isAuthority ? String(raw.ownerActorId ?? actorId) : actorId,
                characterId: raw.characterId ?? null,
                descendantId: raw.descendantId ?? null,
                speciesId: raw.speciesId ?? null,
                bodyPlan: raw.bodyPlan ?? null,
                incarna: raw.incarna ?? null,
                allegiance,
                color: Number.isInteger(raw.color) ? raw.color : (allegiance === 'enemy' ? 0xef4444 : allegiance === 'prop' ? 0x94a3b8 : 0x3b82f6),
                scale: Number.isFinite(raw.scale) && raw.scale > 0.1 && raw.scale <= 20 ? Number(raw.scale) : 1,
                facing: Number.isFinite(raw.facing) ? Number(raw.facing) : 0,
                position: validatePosition(raw.position),
                hidden: isAuthority ? Boolean(raw.hidden) : false,
                status: {
                    wounds: Math.max(0, Math.trunc(raw.status?.wounds ?? 0)),
                    stress: Math.max(0, Math.trunc(raw.status?.stress ?? 0)),
                    maxStress: Math.max(1, Math.trunc(raw.status?.maxStress ?? 6))
                },
                propSpec: raw.propSpec ? clone(raw.propSpec) : null,
                createdAtRevision: revision
            };

            table.tokens[tokenId] = token;
            emit('VTT:TokenSpawned', { token }, token.hidden ? 'referee' : 'public');
            return { token: clone(token) };
        }
    });

    session.registerCommand('VTT:MoveToken', {
        roles: ['referee', 'player', 'system'],
        handler: ({ state, actorId, actorRole, payload, emit }) => {
            const table = ensureVTTTableShape(state.table);
            const tokenId = String(payload.tokenId ?? '');
            const token = table.tokens[tokenId];
            if (!token) {
                const err = new Error(`Token '${tokenId}' not found.`);
                err.code = 'NOT_FOUND';
                throw err;
            }
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            if (!isAuthority && token.ownerActorId !== actorId) {
                const err = new Error(`Actor '${actorId}' cannot move token '${tokenId}' owned by '${token.ownerActorId}'.`);
                err.code = 'FORBIDDEN';
                throw err;
            }
            token.position = validatePosition(payload.position, token.position);
            if (payload.facing !== undefined) {
                if (!Number.isFinite(Number(payload.facing))) {
                    const err = new Error('facing must be finite.');
                    err.code = 'INVALID_POSITION';
                    throw err;
                }
                token.facing = Number(payload.facing);
            }
            emit('VTT:TokenMoved', { tokenId, position: clone(token.position), facing: token.facing }, token.hidden ? 'referee' : 'public');
            return { token: clone(token) };
        }
    });

    session.registerCommand('VTT:UpdateToken', {
        roles: ['referee', 'player', 'system'],
        handler: ({ state, actorId, actorRole, payload, emit }) => {
            const table = ensureVTTTableShape(state.table);
            const tokenId = String(payload.tokenId ?? '');
            const token = table.tokens[tokenId];
            if (!token) {
                const err = new Error(`Token '${tokenId}' not found.`);
                err.code = 'NOT_FOUND';
                throw err;
            }
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            if (!isAuthority && token.ownerActorId !== actorId) {
                const err = new Error(`Actor '${actorId}' cannot update token '${tokenId}'.`);
                err.code = 'FORBIDDEN';
                throw err;
            }
            const patch = payload.patch ?? payload;
            if (!isAuthority && (patch.hidden !== undefined || patch.ownerActorId !== undefined)) {
                const err = new Error('Only Referee can change token hidden visibility or ownership.');
                err.code = 'FORBIDDEN';
                throw err;
            }

            const wasHidden = Boolean(token.hidden);
            if (patch.name !== undefined) token.name = String(patch.name).slice(0, 80);
            if (patch.facing !== undefined && Number.isFinite(Number(patch.facing))) token.facing = Number(patch.facing);
            if (patch.scale !== undefined && Number.isFinite(Number(patch.scale)) && Number(patch.scale) > 0.1) token.scale = Number(patch.scale);
            if (patch.allegiance !== undefined && VTT_ALLEGIANCES.includes(patch.allegiance)) token.allegiance = patch.allegiance;
            if (patch.color !== undefined && Number.isInteger(patch.color)) token.color = patch.color;
            if (patch.status && typeof patch.status === 'object') {
                token.status = {
                    wounds: Math.max(0, Math.trunc(patch.status.wounds ?? token.status?.wounds ?? 0)),
                    stress: Math.max(0, Math.trunc(patch.status.stress ?? token.status?.stress ?? 0)),
                    maxStress: Math.max(1, Math.trunc(patch.status.maxStress ?? token.status?.maxStress ?? 6))
                };
            }
            if (isAuthority && patch.hidden !== undefined) token.hidden = Boolean(patch.hidden);
            if (isAuthority && patch.ownerActorId !== undefined) token.ownerActorId = String(patch.ownerActorId);

            if (wasHidden && !token.hidden) {
                emit('VTT:TokenRevealed', { token: clone(token) }, 'public');
            } else if (!wasHidden && token.hidden) {
                emit('VTT:TokenConcealed', { tokenId }, 'public');
                emit('VTT:TokenUpdated', { tokenId, token: clone(token) }, 'referee');
            } else {
                emit('VTT:TokenUpdated', { tokenId, token: clone(token) }, token.hidden ? 'referee' : 'public');
            }
            return { token: clone(token) };
        }
    });

    session.registerCommand('VTT:RemoveToken', {
        roles: ['referee', 'player', 'system'],
        handler: ({ state, actorId, actorRole, payload, emit }) => {
            const table = ensureVTTTableShape(state.table);
            const tokenId = String(payload.tokenId ?? '');
            const token = table.tokens[tokenId];
            if (!token) {
                const err = new Error(`Token '${tokenId}' not found.`);
                err.code = 'NOT_FOUND';
                throw err;
            }
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            if (!isAuthority && token.ownerActorId !== actorId) {
                const err = new Error(`Actor '${actorId}' cannot remove token '${tokenId}'.`);
                err.code = 'FORBIDDEN';
                throw err;
            }
            delete table.tokens[tokenId];
            emit('VTT:TokenRemoved', { tokenId }, token.hidden ? 'referee' : 'public');
            return { removedTokenId: tokenId };
        }
    });

    session.registerCommand('VTT:SetBoardConfig', {
        roles: ['referee', 'system'],
        handler: ({ state, payload, emit }) => {
            const table = ensureVTTTableShape(state.table);
            const board = table.board;
            if (payload.width !== undefined) {
                const w = Number(payload.width);
                if (!Number.isFinite(w) || w < 4 || w > 200) throw Object.assign(new Error('Board width must be 4..200.'), { code: 'INVALID_BOARD_CONFIG' });
                board.width = w;
            }
            if (payload.height !== undefined) {
                const h = Number(payload.height);
                if (!Number.isFinite(h) || h < 4 || h > 200) throw Object.assign(new Error('Board height must be 4..200.'), { code: 'INVALID_BOARD_CONFIG' });
                board.height = h;
            }
            if (payload.gridType !== undefined) {
                if (!VTT_GRID_TYPES.includes(payload.gridType)) throw Object.assign(new Error(`Invalid gridType '${payload.gridType}'.`), { code: 'INVALID_BOARD_CONFIG' });
                board.gridType = payload.gridType;
            }
            if (payload.gridSize !== undefined) {
                const gs = Number(payload.gridSize);
                if (!Number.isFinite(gs) || gs <= 0 || gs > 20) throw Object.assign(new Error('gridSize must be in (0, 20].'), { code: 'INVALID_BOARD_CONFIG' });
                board.gridSize = gs;
            }
            if (payload.snapEnabled !== undefined) board.snapEnabled = Boolean(payload.snapEnabled);
            if (payload.viewMode !== undefined) {
                if (!VTT_VIEW_MODES.includes(payload.viewMode)) throw Object.assign(new Error(`Invalid viewMode '${payload.viewMode}'.`), { code: 'INVALID_BOARD_CONFIG' });
                board.viewMode = payload.viewMode;
            }
            if (payload.backdropUrl !== undefined) board.backdropUrl = validateBackdropUrl(payload.backdropUrl);
            if (payload.actionSpaceType !== undefined) board.actionSpaceType = String(payload.actionSpaceType);

            emit('VTT:BoardConfigUpdated', { board: clone(board) }, 'public');
            return { board: clone(board) };
        }
    });

    session.registerCommand('VTT:SetZone', {
        roles: ['referee', 'system'],
        handler: ({ state, payload, revision, emit }) => {
            const table = ensureVTTTableShape(state.table);
            const raw = payload.zone ?? payload;
            const zoneId = String(raw.id ?? `zone-${revision}`).trim();
            if (!zoneId) throw Object.assign(new Error('Zone id is required.'), { code: 'INVALID_ZONE' });
            const kind = VTT_ZONE_KINDS.includes(raw.kind) ? raw.kind : 'Open';
            const zone = {
                id: zoneId,
                name: String(raw.name ?? kind),
                kind,
                label: String(raw.label ?? raw.name ?? kind),
                color: Number.isInteger(raw.color) ? raw.color : (kind === 'Closed' ? 0xef4444 : kind === 'Hazard' ? 0xf59e0b : kind === 'Difficult' ? 0xa855f7 : 0x10b981),
                bounds: {
                    x: Number(raw.bounds?.x ?? 0),
                    z: Number(raw.bounds?.z ?? 0),
                    width: Math.max(0.5, Number(raw.bounds?.width ?? 4)),
                    depth: Math.max(0.5, Number(raw.bounds?.depth ?? 4))
                }
            };
            table.zones[zoneId] = zone;
            emit('VTT:ZoneUpdated', { zone: clone(zone) }, 'public');
            return { zone: clone(zone) };
        }
    });

    session.registerCommand('VTT:RemoveZone', {
        roles: ['referee', 'system'],
        handler: ({ state, payload, emit }) => {
            const table = ensureVTTTableShape(state.table);
            const zoneId = String(payload.zoneId ?? payload.id ?? '');
            if (!table.zones[zoneId]) throw Object.assign(new Error(`Zone '${zoneId}' not found.`), { code: 'NOT_FOUND' });
            delete table.zones[zoneId];
            emit('VTT:ZoneRemoved', { zoneId }, 'public');
            return { removedZoneId: zoneId };
        }
    });

    session.registerCommand('VTT:SetFog', {
        roles: ['referee', 'system'],
        handler: ({ state, payload, emit }) => {
            const table = ensureVTTTableShape(state.table);
            const next = {
                enabled: payload.enabled !== undefined ? Boolean(payload.enabled) : table.fogOfWar.enabled,
                hiddenCells: Array.isArray(payload.hiddenCells)
                    ? payload.hiddenCells.map(c => ({ x: Math.trunc(c.x), z: Math.trunc(c.z) }))
                    : table.fogOfWar.hiddenCells,
                revealedAreas: Array.isArray(payload.revealedAreas)
                    ? clone(payload.revealedAreas)
                    : table.fogOfWar.revealedAreas
            };
            table.fogOfWar = next;
            emit('VTT:FogUpdated', { fogOfWar: clone(next) }, 'public');
            return { fogOfWar: clone(next) };
        }
    });

    session.registerCommand('VTT:SyncSkin', {
        roles: ['referee', 'player', 'system'],
        handler: ({ state, actorId, actorRole, payload, emit }) => {
            const table = ensureVTTTableShape(state.table);
            const entityId = String(payload.entityId ?? '');
            const skinDocument = payload.skinDocument;
            if (!entityId || !isValidSkinSummary(skinDocument)) {
                throw Object.assign(new Error('VTT:SyncSkin requires entityId and a valid t13-avatar-skin document.'), { code: 'INVALID_SKIN' });
            }
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            const charOwner = state.characters?.[entityId]?.ownerActorId;
            const tokenOwner = table.tokens?.[entityId]?.ownerActorId;
            const owner = charOwner ?? tokenOwner ?? null;
            if (!isAuthority && owner && owner !== actorId) {
                throw Object.assign(new Error(`Actor '${actorId}' does not own entity '${entityId}'.`), { code: 'FORBIDDEN' });
            }
            const clonedDoc = clone(skinDocument);
            table.skins[entityId] = clonedDoc;
            emit('VTT:SkinSynced', { entityId, skinDocument: clonedDoc }, 'public');
            return { entityId };
        }
    });

    session.registerCommand('VTT:ClearTable', {
        roles: ['referee', 'system'],
        handler: ({ state, payload, emit }) => {
            const table = ensureVTTTableShape(state.table);
            if (payload.clearTokens) table.tokens = {};
            if (payload.clearZones) table.zones = {};
            if (payload.clearFog) table.fogOfWar = { enabled: false, hiddenCells: [], revealedAreas: [] };
            emit('VTT:TableCleared', {
                clearTokens: Boolean(payload.clearTokens),
                clearZones: Boolean(payload.clearZones),
                clearFog: Boolean(payload.clearFog)
            }, 'public');
            return { cleared: true };
        }
    });
}
