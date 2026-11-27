/**
 * @module Modules/Systems/T13SessionDramaCards
 * @description Stage 2.6 authoritative session rules for:
 * - Drama Systems (`Drama:Configure`, `Drama:AddDie`, `Drama:RollPool`, `Drama:PlayCard`, `Drama:Reject`, `Drama:RelieveStress`)
 * - Wyrd Tarot (`WyrdTarot:Draw`, `WyrdTarot:Play`, `WyrdTarot:TriggerFaceDown`, `WyrdTarot:DiscardSlot`)
 * - Yarn Card Play & Reality Manipulation (`Yarn:PlayCards`, `Yarn:ManipulateReality`)
 * - Ordeal Suit Defense & Yarn-Tangling (`Ordeal:Defend`, `Ordeal:YarnTangleAction`)
 */

import T13Boons from '../mechanics/t13ne-boon.js';
import {
    calculateTopOfPoolYarnChiDelta,
    calculateWyrdTarotHandLimit,
    calculateYarnManipulationCost,
    classifyCardDrama,
    evaluateDramaPoolRoll,
    getDramaDieSpec,
    getDramaPoolSpec,
    getLatentLimitForTension,
    isPersistentWyrdTarotCard,
    normalizeCardMeta,
    resolveSuitDefenseEffect
} from '../mechanics/T13CardPlayRules.js';
import { defaultDiceForBoon, getFacetMeta, rollDiceSpec } from '../mechanics/T13TestRules.js';

function clone(value) {
    if (value === null || value === undefined || typeof value !== 'object') return value;
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

function makeErr(code, message) {
    const err = new Error(message);
    err.code = code;
    return err;
}

function ensureCharacterSway(character) {
    if (!character.sway || typeof character.sway !== 'object') {
        character.sway = { Chi: 0, Yarn: 0, Twists: 0, 'Tao:Yin': 0, 'Tao:Yang': 0 };
    }
    return character.sway;
}

export function ensureDramaState(state) {
    if (!state.drama || typeof state.drama !== 'object') {
        state.drama = {
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
    if (!Array.isArray(state.drama.pool)) state.drama.pool = [];
    if (!Array.isArray(state.drama.activeDramas)) state.drama.activeDramas = [];
    if (!Array.isArray(state.drama.history)) state.drama.history = [];
    return state.drama;
}

function ensureSlotStack(state, targetEntityId) {
    if (!state.wyrdTarotSlots || typeof state.wyrdTarotSlots !== 'object') {
        state.wyrdTarotSlots = {};
    }
    if (!Array.isArray(state.wyrdTarotSlots[targetEntityId])) {
        state.wyrdTarotSlots[targetEntityId] = [];
    }
    return state.wyrdTarotSlots[targetEntityId];
}

function pullOwnedCard(state, ownerId, cardId, { allowedZones = ['wyrdTarotHand', 'privateHand', 'ordealPool'] } = {}) {
    if (allowedZones.includes('wyrdTarotHand')) {
        const wHand = state.wyrdTarotHands?.[ownerId] || [];
        const idx = wHand.findIndex(c => c.id === cardId);
        if (idx !== -1) {
            const card = wHand.splice(idx, 1)[0];
            if (!state.publicWyrdTarotCounts) state.publicWyrdTarotCounts = {};
            state.publicWyrdTarotCounts[ownerId] = wHand.length;
            return { card, source: 'wyrdTarotHand' };
        }
    }
    if (allowedZones.includes('privateHand')) {
        const hand = state.privateHands?.[ownerId] || [];
        const idx = hand.findIndex(c => c.id === cardId);
        if (idx !== -1) {
            const card = hand.splice(idx, 1)[0];
            state.publicHandCounts[ownerId] = hand.length;
            return { card, source: 'privateHand' };
        }
    }
    if (allowedZones.includes('ordealPool')) {
        const pool = state.table?.activeOrdeal?.participants?.[ownerId]?.ordealPool || [];
        const idx = pool.findIndex(c => c.id === cardId);
        if (idx !== -1) {
            const card = pool.splice(idx, 1)[0];
            return { card, source: 'ordealPool' };
        }
    }
    return null;
}

function selectTargetPlotForLatentDrama(state, requestedPlotId = null) {
    const drama = ensureDramaState(state);
    const activePlots = Object.values(state.plots || {}).filter(p => p.status !== 'Resolved' && p.status !== 'Completed');

    let plotId = requestedPlotId ? String(requestedPlotId) : (activePlots[0]?.id ?? 'default-plot');
    if (drama.lastLatentPlotId === plotId && drama.consecutiveLatentCount >= 3) {
        // Must rotate to another plot if same plot claimed Latent Drama 3 times in a row
        const alternate = activePlots.find(p => p.id !== plotId);
        if (!alternate) {
            throw makeErr(
                'LATENT_PLOT_LIMIT_REACHED',
                `Plot '${plotId}' already claimed Latent Drama 3 times in a row; another Plot must receive it.`
            );
        }
        plotId = alternate.id;
    }

    if (drama.lastLatentPlotId === plotId) {
        drama.consecutiveLatentCount += 1;
    } else {
        drama.lastLatentPlotId = plotId;
        drama.consecutiveLatentCount = 1;
    }
    return plotId;
}

/**
 * Adds a Drama Die to the session pool and triggers Latent Drama if the limit is reached.
 */
export function pushCharacterDramaDie(session, state, opts = {}, emit = null) {
    const drama = ensureDramaState(state);
    const spec = getDramaDieSpec(opts.type || 'Character');
    const die = {
        id: opts.id || `dd-${session.revision + 1}-${drama.pool.length + 1}`,
        type: spec.type,
        die: spec.die,
        sides: spec.sides,
        source: opts.source || opts.characterId || 'Unknown',
        characterId: opts.characterId ?? null,
        plotId: opts.plotId ?? null,
        fixedRoll: opts.fixedRoll ?? null
    };
    drama.pool.push(die);

    if (emit) {
        emit('Drama:DieAdded', { die: clone(die), poolSize: drama.pool.length, latentLimit: drama.latentLimit }, 'public');
    }

    if (drama.pool.length >= drama.latentLimit) {
        const claimedPlotId = selectTargetPlotForLatentDrama(state, opts.plotId);
        const consumedCount = drama.pool.length;
        drama.pool = [];
        const latentRecord = {
            id: `drama-latent-${session.revision + 1}-${drama.history.length + 1}`,
            type: 'Latent Drama',
            plotId: claimedPlotId,
            poolSizeEmptied: consumedCount,
            sourceCharacterId: opts.characterId ?? null,
            status: 'Pending',
            components: [
                { type: 'Atmospheric / Narrative Moment', required: true },
                { type: 'Hazard', required: true },
                { type: 'Choice', options: ['Ratchet', 'Prod', 'Break'], required: true }
            ]
        };
        drama.activeDramas.push(latentRecord);
        drama.history.push(clone(latentRecord));
        if (emit) {
            emit('Drama:LatentTriggered', { drama: clone(latentRecord) }, 'public');
        }
        return { die, latentDrama: latentRecord, poolSize: 0 };
    }

    return { die, latentDrama: null, poolSize: drama.pool.length };
}

/**
 * Plays a Wyrd Tarot card onto a target Character or Descendant slot.
 */
export function applyWyrdTarotPlay({
    session,
    state,
    card,
    ownerId,
    targetEntityId,
    orientation = 'normal',
    faceDown = false,
    promised = false,
    wildcardAs = null,
    emit = null
}) {
    const stack = ensureSlotStack(state, targetEntityId);
    const entryId = `wt-${session.revision + 1}-${stack.length + 1}`;
    const meta = normalizeCardMeta(card);

    if (faceDown) {
        for (const existing of stack) {
            if (existing.active) {
                existing.active = false;
                existing.suspended = true;
            }
        }
        const hiddenEntry = {
            id: entryId,
            card: clone(card),
            playedBy: ownerId,
            orientation: String(orientation || 'normal'),
            faceDown: true,
            active: false,
            suspended: false,
            promised: Boolean(promised),
            wildcardAs: wildcardAs || null
        };
        stack.push(hiddenEntry);
        if (emit) {
            emit('WyrdTarot:PlayedPrivate', { targetEntityId, entry: clone(hiddenEntry) }, ['referee', `player:${ownerId}`]);
            emit('WyrdTarot:Played', {
                targetEntityId,
                entry: { id: entryId, faceDown: true, playedBy: ownerId, orientation: 'hidden', active: false }
            }, 'public');
        }
        return { targetEntityId, entry: hiddenEntry, persisted: true, discarded: false };
    }

    const persistent = !wildcardAs && isPersistentWyrdTarotCard(card);
    if (persistent) {
        for (const existing of stack) {
            if (existing.active) {
                existing.active = false;
                existing.suspended = true;
            }
        }
        const slotEntry = {
            id: entryId,
            card: clone(card),
            playedBy: ownerId,
            orientation: String(orientation || 'normal'),
            faceDown: false,
            active: true,
            suspended: false,
            promised: Boolean(promised),
            wildcardAs: null
        };
        stack.push(slotEntry);
        if (emit) {
            emit('WyrdTarot:Played', { targetEntityId, entry: clone(slotEntry), persisted: true }, 'public');
        }
        return { targetEntityId, entry: slotEntry, persisted: true, discarded: false };
    }

    // Non-Court card (or Joker acting as Non-Court): takes effect & is discarded, revealing underlying Court card
    if (!state.deck) state.deck = { drawPile: [], discardPile: [], deckCount: 0 };
    state.deck.discardPile.push(clone(card));
    let revealedUnderlying = null;
    if (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (!top.faceDown) {
            top.suspended = false;
            top.active = true;
            revealedUnderlying = top;
        }
    }

    const effectSummary = {
        id: entryId,
        card: clone(card),
        cardName: meta.name,
        wyrdTarot: card.data?.Tarot?.WyrdTarot ?? card.wyrdTarot ?? (wildcardAs || 'Effect'),
        orientation: String(orientation || 'normal'),
        playedBy: ownerId,
        promised: Boolean(promised),
        wildcardAs: wildcardAs || null,
        revealedUnderlyingId: revealedUnderlying?.id ?? null
    };
    if (emit) {
        emit('WyrdTarot:Played', { targetEntityId, entry: effectSummary, persisted: false, discarded: true }, 'public');
    }
    return { targetEntityId, entry: effectSummary, persisted: false, discarded: true };
}

/**
 * Turns over any face-down Wyrd Tarot card atop a target's slot when they take an Action
 * (docs/rules/Card-Guide.md), discarding Non-Court cards to re-activate covered Court cards.
 */
export function triggerFaceDownWyrdTarotOnAction(state, targetEntityId, emit = null) {
    const stack = state.wyrdTarotSlots?.[targetEntityId];
    if (!Array.isArray(stack) || stack.length === 0) return null;
    const top = stack[stack.length - 1];
    if (!top.faceDown) return null;

    top.faceDown = false;
    const persistent = !top.wildcardAs && isPersistentWyrdTarotCard(top.card);
    if (persistent) {
        top.active = true;
        top.suspended = false;
        const result = { targetEntityId, entry: clone(top), discarded: false, reactivatedEntryId: null };
        if (emit) emit('WyrdTarot:FaceDownTriggered', result, 'public');
        return result;
    }

    // Non-Court card flips, takes effect, discards, and reactivates covered Court card
    stack.pop();
    if (!state.deck) state.deck = { drawPile: [], discardPile: [], deckCount: 0 };
    state.deck.discardPile.push(clone(top.card));

    let reactivated = null;
    if (stack.length > 0) {
        const under = stack[stack.length - 1];
        if (!under.faceDown) {
            under.suspended = false;
            under.active = true;
            reactivated = clone(under);
        }
    }

    const result = {
        targetEntityId,
        entry: clone(top),
        discarded: true,
        reactivatedEntry: reactivated
    };
    if (emit) emit('WyrdTarot:FaceDownTriggered', result, 'public');
    return result;
}

export function registerStage26Commands(session, { drawFromSessionDeck, ensureSessionDeck }) {
    // -------------------------------------------------------------------------
    // 1. Drama Pool, Dice, Latent Drama, Card-Based Drama & Rejections
    // -------------------------------------------------------------------------
    session.registerCommand('Drama:Configure', {
        roles: ['referee', 'system'],
        handler: ({ state, payload, emit }) => {
            const drama = ensureDramaState(state);
            if (payload.tensionLevel !== undefined) {
                drama.tensionLevel = Math.max(1, Math.min(6, Math.trunc(Number(payload.tensionLevel))));
                if (payload.latentLimit === undefined) {
                    drama.latentLimit = getLatentLimitForTension(drama.tensionLevel);
                }
            }
            if (payload.latentLimit !== undefined) {
                drama.latentLimit = Math.max(2, Math.trunc(Number(payload.latentLimit)));
            }
            if (payload.poolType !== undefined) {
                drama.poolType = getDramaPoolSpec(payload.poolType).type;
            }
            if (payload.thresholdModifier !== undefined) {
                drama.thresholdModifier = Math.trunc(Number(payload.thresholdModifier) || 0);
            }
            emit('Drama:Configured', { drama: clone(drama) }, 'public');
            return clone(drama);
        }
    });

    session.registerCommand('Drama:AddDie', {
        roles: ['player', 'referee', 'system'],
        handler: ({ session: s, state, actorId, actorRole, payload, emit }) => {
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            if (payload.spendChi) {
                const char = state.characters[String(payload.characterId ?? '')];
                if (!char) throw makeErr('NOT_FOUND', `Character '${payload.characterId}' not found.`);
                if (!isAuthority && char.ownerActorId !== actorId) {
                    throw makeErr('FORBIDDEN', `Actor '${actorId}' does not own character '${char.id}'.`);
                }
                const sway = ensureCharacterSway(char);
                if ((sway.Chi || 0) < 1) throw makeErr('INSUFFICIENT_SWAY', 'Need 1 Chi to add an Atmospheric Drama Die.');
                sway.Chi -= 1;
            }

            const added = pushCharacterDramaDie(s, state, payload, emit);

            if (!added.latentDrama && payload.autoRoll) {
                const drama = ensureDramaState(state);
                const evalRes = evaluateDramaPoolRoll({
                    dice: drama.pool,
                    plots: payload.plots || Object.values(state.plots || {}).filter(p => p.dramaPoolType).map(p => ({
                        id: p.id,
                        poolType: p.dramaPoolType,
                        thresholdModifier: p.thresholdModifier ?? 0,
                        overstressed: Boolean(p.overstressed)
                    })),
                    defaultPoolType: drama.poolType,
                    thresholdModifier: drama.thresholdModifier,
                    overstressed: Boolean(payload.overstressed),
                    rollDie: (sides) => s.rollDie(sides)
                });
                drama.pool = evalRes.remainingPool;
                for (const t of evalRes.triggered) {
                    const entry = {
                        id: `drama-${s.revision + 1}-${drama.history.length + 1}`,
                        ...t,
                        sourceCharacterId: payload.characterId ?? null,
                        status: 'Pending'
                    };
                    drama.activeDramas.push(entry);
                    drama.history.push(clone(entry));
                    emit('Drama:Triggered', { drama: entry }, 'public');
                }
                return { ...added, rolled: evalRes };
            }

            return added;
        }
    });

    session.registerCommand('Drama:RollPool', {
        roles: ['referee', 'system'],
        handler: ({ session: s, state, payload, emit }) => {
            const drama = ensureDramaState(state);
            const activePlots = Array.isArray(payload.plots) && payload.plots.length
                ? payload.plots
                : Object.values(state.plots || {}).filter(p => p.dramaPoolType).map(p => ({
                    id: p.id,
                    poolType: p.dramaPoolType,
                    thresholdModifier: p.thresholdModifier ?? 0,
                    overstressed: Boolean(p.overstressed)
                }));

            const evalRes = evaluateDramaPoolRoll({
                dice: drama.pool,
                plots: activePlots,
                defaultPoolType: payload.poolType || drama.poolType,
                thresholdModifier: payload.thresholdModifier ?? drama.thresholdModifier,
                overstressed: Boolean(payload.overstressed),
                rollDie: (sides) => s.rollDie(sides)
            });

            drama.pool = evalRes.remainingPool;
            const created = [];
            for (const trig of evalRes.triggered) {
                const entry = {
                    id: `drama-${s.revision + 1}-${drama.history.length + 1}`,
                    ...trig,
                    sourceCharacterId: trig.dice?.[0]?.characterId ?? null,
                    status: 'Pending'
                };
                drama.activeDramas.push(entry);
                drama.history.push(clone(entry));
                created.push(entry);
            }

            emit('Drama:PoolRolled', {
                rolledDice: evalRes.rolledDice,
                triggered: created,
                remainingPoolSize: drama.pool.length
            }, 'public');
            return { rolledDice: evalRes.rolledDice, triggered: created, remainingPool: clone(drama.pool) };
        }
    });

    session.registerCommand('Drama:PlayCard', {
        roles: ['player', 'referee', 'system'],
        handler: ({ session: s, state, actorId, actorRole, payload, emit }) => {
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            const ownerId = isAuthority && payload.ownerId ? String(payload.ownerId) : actorId;
            let card = null;
            if (payload.cardId) {
                const pulled = pullOwnedCard(state, ownerId, String(payload.cardId));
                if (!pulled) throw makeErr('CARD_NOT_FOUND', `Card '${payload.cardId}' not owned by '${ownerId}'.`);
                card = pulled.card;
                ensureSessionDeck(s, state);
                state.deck.discardPile.push(card);
            } else if (isAuthority && payload.card) {
                card = clone(payload.card);
            } else {
                throw makeErr('CARD_REQUIRED', 'Drama:PlayCard requires payload.cardId.');
            }

            const dramaSpec = classifyCardDrama(card);
            const drama = ensureDramaState(state);
            const entry = {
                id: `drama-card-${s.revision + 1}-${drama.history.length + 1}`,
                type: dramaSpec.type,
                roll: dramaSpec.roll,
                stressReliefRule: dramaSpec.stressRelief,
                card: clone(card),
                playedBy: ownerId,
                targetCharacterId: payload.targetCharacterId ?? null,
                plotId: payload.plotId ?? null,
                status: 'Active'
            };
            drama.activeDramas.push(entry);
            drama.history.push(clone(entry));

            if (payload.targetCharacterId && state.characters[payload.targetCharacterId]) {
                const char = state.characters[payload.targetCharacterId];
                const rel = dramaSpec.stressRelief === 'all' ? 999
                    : (typeof dramaSpec.stressRelief === 'number' ? dramaSpec.stressRelief : Number(payload.stressRelief ?? 0));
                if (rel > 0 && char.stressState) {
                    const firstBucket = Object.values(char.stressState)[0];
                    if (firstBucket) firstBucket.stress = Math.max(0, (firstBucket.stress || 0) - rel);
                }
            }

            emit('Drama:CardPlayed', { drama: clone(entry) }, 'public');
            return clone(entry);
        }
    });

    session.registerCommand('Drama:Reject', {
        roles: ['referee', 'system', 'player'],
        handler: ({ state, actorId, actorRole, payload, emit }) => {
            const dramaState = ensureDramaState(state);
            const entry = dramaState.activeDramas.find(d => d.id === payload.dramaId);
            if (!entry) throw makeErr('NOT_FOUND', `Active Drama '${payload.dramaId}' not found.`);

            const payerCharId = payload.payerCharacterId || entry.sourceCharacterId;
            if (payerCharId) {
                const payer = state.characters[payerCharId];
                if (!payer) throw makeErr('NOT_FOUND', `Character '${payerCharId}' not found.`);
                const isAuthority = actorRole === 'referee' || actorRole === 'system';
                if (!isAuthority && payer.ownerActorId !== actorId) {
                    throw makeErr('FORBIDDEN', 'Cannot spend Yarn from another actor character.');
                }
                const sway = ensureCharacterSway(payer);
                if ((sway.Yarn || 0) >= 1) {
                    sway.Yarn -= 1;
                } else if (payload.useChiPool) {
                    const conv = calculateTopOfPoolYarnChiDelta(sway.Chi || 0, -1);
                    if (!conv.ok) throw makeErr('INSUFFICIENT_SWAY', 'Need 1 Yarn (or equivalent Chi) to reject Drama.');
                    sway.Chi = conv.newChi;
                } else {
                    throw makeErr('INSUFFICIENT_SWAY', 'Need 1 Yarn to reject or redirect Drama.');
                }
            }

            const mode = String(payload.mode || 'type').toLowerCase();
            if (mode === 'target') {
                if (!payload.newTargetCharacterId) throw makeErr('INVALID_TARGET', 'Reject target requires newTargetCharacterId.');
                entry.originalTargetCharacterId = entry.targetCharacterId || entry.sourceCharacterId || null;
                entry.targetCharacterId = String(payload.newTargetCharacterId);
                entry.rejectedMode = 'target';
            } else {
                if (!payload.newType) throw makeErr('INVALID_DRAMA_TYPE', 'Reject type requires newType.');
                entry.originalType = entry.type;
                entry.type = String(payload.newType);
                entry.rejectedMode = 'type';
            }
            entry.status = 'RejectedAndModified';

            // Rejecting Drama automatically relieves 1 Stress/Strain/Shock on the triggering character
            // and permits their Player to play a Wyrd Tarot or Ordeal card as a Stress Effect.
            const sourceCharId = payload.triggerCharacterId || entry.sourceCharacterId || entry.originalTargetCharacterId;
            let stressReduced = 0;
            if (sourceCharId && state.characters[sourceCharId]?.stressState) {
                const buckets = Object.values(state.characters[sourceCharId].stressState);
                for (const b of buckets) {
                    if ((b.stress || 0) > 0) { b.stress -= 1; stressReduced = 1; break; }
                    if ((b.strains || 0) > 0) { b.strains -= 1; stressReduced = 1; break; }
                    if ((b.shocks || 0) > 0) { b.shocks -= 1; stressReduced = 1; break; }
                }
            }
            entry.stressEffectCardEligible = true;

            emit('Drama:Rejected', {
                drama: clone(entry),
                sourceCharacterId: sourceCharId || null,
                stressReduced,
                stressEffectCardEligible: true
            }, 'public');
            return {
                drama: clone(entry),
                sourceCharacterId: sourceCharId || null,
                stressReduced,
                stressEffectCardEligible: true
            };
        }
    });

    session.registerCommand('Drama:RelieveStress', {
        roles: ['player', 'referee', 'system'],
        handler: ({ session: s, state, actorId, actorRole, payload, emit }) => {
            const char = state.characters[String(payload.characterId ?? '')];
            if (!char) throw makeErr('NOT_FOUND', `Character '${payload.characterId}' not found.`);
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            if (!isAuthority && char.ownerActorId !== actorId) {
                throw makeErr('FORBIDDEN', `Actor '${actorId}' does not own character '${char.id}'.`);
            }

            const dramaType = String(payload.dramaType || 'Atmospheric');
            let relief;
            if (payload.amount !== undefined) {
                relief = Math.max(0, Math.trunc(Number(payload.amount)));
            } else if (dramaType === 'Break') {
                relief = 9999;
            } else if (dramaType === 'Atmospheric') {
                relief = 1;
            } else if (dramaType === 'Prod') {
                relief = 2;
            } else if (dramaType === 'Narrative Moment') {
                const facetName = String(payload.facet || 'Awe');
                const meta = getFacetMeta(facetName);
                const boon = char.facetweb?.Stats?.[meta?.FacetName || facetName]?.Boon ?? 13;
                relief = Math.max(1, rollDiceSpec(defaultDiceForBoon(boon), (min, max) => s.nextInt(min, max)).total);
            } else {
                relief = 2;
            }

            let relievedTotal = 0;
            if (char.stressState && typeof char.stressState === 'object') {
                const targetKey = payload.facet ? `Facet:${payload.facet}` : null;
                const keys = targetKey && char.stressState[targetKey] ? [targetKey] : Object.keys(char.stressState);
                let remaining = relief;
                for (const k of keys) {
                    const b = char.stressState[k];
                    if (!b || remaining <= 0) continue;
                    const take = Math.min(b.stress || 0, remaining);
                    b.stress = Math.max(0, (b.stress || 0) - take);
                    relievedTotal += take;
                    remaining -= take;
                }
            }

            if (payload.dramaId) {
                const d = ensureDramaState(state).activeDramas.find(x => x.id === payload.dramaId);
                if (d) d.status = 'Resolved';
            }

            emit('Drama:StressRelieved', { characterId: char.id, dramaType, relievedTotal }, 'public');
            return { characterId: char.id, dramaType, relievedTotal };
        }
    });

    // -------------------------------------------------------------------------
    // 2. Wyrd Tarot Hand & Per-Character / Descendant Slot
    // -------------------------------------------------------------------------
    session.registerCommand('WyrdTarot:Draw', {
        roles: ['player', 'referee', 'system'],
        handler: ({ session: s, state, actorId, actorRole, payload, emit }) => {
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            const targetActorId = isAuthority && payload.targetActorId ? String(payload.targetActorId) : actorId;
            if (!state.actors[targetActorId]) {
                throw makeErr('INVALID_TARGET', `Target actor '${targetActorId}' is not registered.`);
            }

            if (!state.wyrdTarotHands) state.wyrdTarotHands = {};
            if (!state.publicWyrdTarotCounts) state.publicWyrdTarotCounts = {};
            if (!Array.isArray(state.wyrdTarotHands[targetActorId])) state.wyrdTarotHands[targetActorId] = [];

            const count = Math.max(1, Math.trunc(payload.count ?? 1));
            const character = payload.characterId ? state.characters[String(payload.characterId)] : null;
            const powerTier = payload.powerTier || character?.powerTier || 'Mercari';
            const currentChi = payload.currentChi ?? character?.sway?.Chi ?? 0;
            const maxChi = payload.maxChi ?? character?.maxChi ?? Math.max(1, currentChi);
            const limitInfo = calculateWyrdTarotHandLimit({
                powerTier,
                currentChi,
                maxChi,
                gruntAllowed: payload.gruntAllowed !== false
            });

            if (!(isAuthority && payload.ignoreLimit)) {
                const projectedSize = state.wyrdTarotHands[targetActorId].length + count;
                if (projectedSize > limitInfo.limit) {
                    throw makeErr(
                        'WYRD_TAROT_LIMIT_EXCEEDED',
                        `Wyrd Tarot hand limit is ${limitInfo.limit} (${limitInfo.powerTier} at ${limitInfo.chiPercent}% Chi).`
                    );
                }
            }

            const drawn = drawFromSessionDeck(s, state, count);
            state.wyrdTarotHands[targetActorId].push(...drawn);
            state.publicWyrdTarotCounts[targetActorId] = state.wyrdTarotHands[targetActorId].length;

            emit('WyrdTarot:DrawnPrivate', { targetActorId, cards: drawn }, ['referee', `player:${targetActorId}`]);
            emit('WyrdTarot:HandCountChanged', {
                targetActorId,
                added: drawn.length,
                totalWyrdTarotCount: state.publicWyrdTarotCounts[targetActorId],
                handLimit: limitInfo.limit
            }, 'public');

            return {
                targetActorId,
                drawnCount: drawn.length,
                totalWyrdTarotCount: state.publicWyrdTarotCounts[targetActorId],
                handLimit: limitInfo.limit
            };
        }
    });

    session.registerCommand('WyrdTarot:Play', {
        roles: ['player', 'referee', 'system'],
        handler: ({ session: s, state, actorId, actorRole, payload, emit }) => {
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            const ownerId = isAuthority && payload.ownerId ? String(payload.ownerId) : actorId;
            const targetEntityId = String(payload.targetEntityId ?? payload.characterId ?? '');
            if (!targetEntityId) {
                throw makeErr('INVALID_TARGET', 'WyrdTarot:Play requires payload.targetEntityId.');
            }

            if (payload.requireOrdealReach) {
                const reachable = new Set([
                    ...(Array.isArray(payload.reachableTargets) ? payload.reachableTargets : []),
                    ...(Array.isArray(payload.attackedTargets) ? payload.attackedTargets : [])
                ]);
                if (!reachable.has(targetEntityId)) {
                    throw makeErr('OUT_OF_REACH', `Target '${targetEntityId}' cannot be touched or affected by Ordeal cards.`);
                }
            }

            let card = null;
            if (payload.cardId) {
                const pulled = pullOwnedCard(state, ownerId, String(payload.cardId), {
                    allowedZones: payload.allowedZones || ['wyrdTarotHand', 'privateHand', 'ordealPool']
                });
                if (!pulled) throw makeErr('CARD_NOT_FOUND', `Wyrd Tarot card '${payload.cardId}' not owned by '${ownerId}'.`);
                card = pulled.card;
            } else if (isAuthority && payload.card) {
                card = clone(payload.card);
            } else {
                throw makeErr('CARD_REQUIRED', 'WyrdTarot:Play requires payload.cardId.');
            }

            return applyWyrdTarotPlay({
                session: s,
                state,
                card,
                ownerId,
                targetEntityId,
                orientation: payload.orientation || 'normal',
                faceDown: Boolean(payload.faceDown),
                promised: Boolean(payload.promised),
                wildcardAs: payload.wildcardAs || null,
                emit
            });
        }
    });

    session.registerCommand('WyrdTarot:TriggerFaceDown', {
        roles: ['player', 'referee', 'system'],
        handler: ({ state, payload, emit }) => {
            const targetEntityId = String(payload.targetEntityId ?? '');
            const triggered = triggerFaceDownWyrdTarotOnAction(state, targetEntityId, emit);
            if (!triggered) throw makeErr('NO_FACEDOWN_CARD', `No face-down Wyrd Tarot card atop '${targetEntityId}'.`);
            return triggered;
        }
    });

    session.registerCommand('WyrdTarot:DiscardSlot', {
        roles: ['player', 'referee', 'system'],
        handler: ({ state, payload, emit }) => {
            const targetEntityId = String(payload.targetEntityId ?? '');
            const stack = state.wyrdTarotSlots?.[targetEntityId];
            if (!Array.isArray(stack) || stack.length === 0) {
                throw makeErr('EMPTY_SLOT', `Target '${targetEntityId}' has no active Wyrd Tarot card.`);
            }
            const removed = stack.pop();
            if (!state.deck) state.deck = { drawPile: [], discardPile: [], deckCount: 0 };
            state.deck.discardPile.push(clone(removed.card));

            let reactivated = null;
            if (stack.length > 0) {
                const top = stack[stack.length - 1];
                if (!top.faceDown) {
                    top.suspended = false;
                    top.active = true;
                    reactivated = clone(top);
                }
            }
            emit('WyrdTarot:SlotDiscarded', { targetEntityId, removedId: removed.id, reactivated }, 'public');
            return { targetEntityId, removedId: removed.id, reactivated };
        }
    });

    // -------------------------------------------------------------------------
    // 3. Yarn Card Play & Reality Manipulation (docs/rules/Yarn.md & Card-Guide.md)
    // -------------------------------------------------------------------------
    session.registerCommand('Yarn:PlayCards', {
        roles: ['player', 'referee', 'system'],
        handler: ({ session: s, state, actorId, actorRole, payload, emit }) => {
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            const ownerId = isAuthority && payload.ownerId ? String(payload.ownerId) : actorId;
            const cardIds = Array.isArray(payload.cardIds) ? payload.cardIds.map(String) : [];

            const cards = [];
            const sources = [];
            for (const cid of cardIds) {
                const pulled = pullOwnedCard(state, ownerId, cid, {
                    allowedZones: ['privateHand', 'wyrdTarotHand', 'ordealPool']
                });
                if (!pulled) throw makeErr('CARD_NOT_FOUND', `Yarn card '${cid}' not found in Hand or Ordeal Pool for '${ownerId}'.`);
                cards.push(pulled.card);
                sources.push(pulled.source);
            }
            if (cards.length === 0 && isAuthority && Array.isArray(payload.cards)) {
                cards.push(...clone(payload.cards));
            }
            if (cards.length === 0) {
                throw makeErr('CARDS_REQUIRED', 'Yarn:PlayCards requires at least 1 card.');
            }

            const beatType = String(payload.beatType || 'Scene');
            if (payload.strictSceneMinimum && beatType === 'Scene' && cards.length < 3) {
                throw makeErr('MIN_SCENE_CARDS', 'On-the-fly Scene Yarn creation requires at least 3 cards (Beat Type, Significator, Specifics).');
            }

            ensureSessionDeck(s, state);
            if (!payload.keepCards) {
                state.deck.discardPile.push(...clone(cards));
            }

            if (!Array.isArray(state.yarnWeaves)) state.yarnWeaves = [];
            const roles = Array.isArray(payload.roles) ? payload.roles : ['BeatType', 'Significator', 'Specifics'];
            const weave = {
                id: `yarn-weave-${s.revision + 1}`,
                kind: 'CardPlay',
                actorId: ownerId,
                beatType,
                plotId: payload.plotId ?? null,
                recommendedMinCardsMet: cards.length >= 3,
                cards: cards.map((c, idx) => ({ card: clone(c), role: roles[idx] || `Detail-${idx + 1}`, source: sources[idx] || 'authority' })),
                summary: payload.summary || null
            };
            state.yarnWeaves.push(weave);

            emit('Yarn:CardsPlayed', { weave: clone(weave) }, 'public');
            return clone(weave);
        }
    });

    session.registerCommand('Yarn:ManipulateReality', {
        roles: ['player', 'referee', 'system'],
        handler: ({ session: s, state, actorId, actorRole, payload, emit }) => {
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            const characterId = String(payload.characterId ?? '');
            const character = characterId ? state.characters[characterId] : null;
            if (characterId && !character) throw makeErr('NOT_FOUND', `Character '${characterId}' not found.`);
            if (character && !isAuthority && character.ownerActorId !== actorId) {
                throw makeErr('FORBIDDEN', `Actor '${actorId}' does not own character '${characterId}'.`);
            }

            const techniques = Array.isArray(payload.techniques) ? payload.techniques : [];
            const costInfo = calculateYarnManipulationCost({
                baseCost: payload.baseCost ?? 1,
                techniques,
                faeryType: payload.faeryType ?? null
            });

            if (payload.counterWeaveId) {
                const targetWeave = (state.yarnWeaves || []).find(w => w.id === payload.counterWeaveId);
                if (!targetWeave) throw makeErr('NOT_FOUND', `Target Yarn weave '${payload.counterWeaveId}' not found.`);
                if (targetWeave.techniques?.includes('Flip-Flop') && targetWeave.flipFlopDurationChi !== undefined) {
                    if (Number(payload.matchFlipFlopDurationChi) !== Number(targetWeave.flipFlopDurationChi)) {
                        targetWeave.flipFlopConfused = true;
                        emit('Yarn:FlipFlopConfused', { targetWeaveId: targetWeave.id, actorId }, 'public');
                        return { countered: false, flipFlopConfused: true, targetWeaveId: targetWeave.id };
                    }
                }
                if (costInfo.yarnCost < (targetWeave.yarnCost || 1)) {
                    throw makeErr('INSUFFICIENT_YARN_BID', `Must spend at least ${targetWeave.yarnCost} Yarn to counter '${targetWeave.id}'.`);
                }
                targetWeave.counteredBy = actorId;
            }

            let chiSpent = 0;
            let yarnSpent = 0;
            if (character) {
                const sway = ensureCharacterSway(character);
                const useChiPool = payload.useChiPool !== false;
                if (useChiPool) {
                    const conv = calculateTopOfPoolYarnChiDelta(sway.Chi || 0, -costInfo.yarnCost);
                    if (conv.ok) {
                        sway.Chi = conv.newChi;
                        chiSpent = Math.abs(conv.chiDelta);
                    } else if ((sway.Yarn || 0) >= costInfo.yarnCost) {
                        sway.Yarn -= costInfo.yarnCost;
                        yarnSpent = costInfo.yarnCost;
                    } else {
                        throw makeErr('INSUFFICIENT_SWAY', `Need ${costInfo.yarnCost} Yarn from Chi pool or Yarn reserve.`);
                    }
                } else {
                    if ((sway.Yarn || 0) < costInfo.yarnCost) {
                        throw makeErr('INSUFFICIENT_SWAY', `Need ${costInfo.yarnCost} Yarn.`);
                    }
                    sway.Yarn -= costInfo.yarnCost;
                    yarnSpent = costInfo.yarnCost;
                }

                if (costInfo.extraChi > 0) {
                    sway.Chi = (sway.Chi || 0) + costInfo.extraChi;
                }
                if (costInfo.extraYin > 0) {
                    sway['Tao:Yin'] = (sway['Tao:Yin'] || 0) + costInfo.extraYin;
                }
                if (costInfo.extraYang > 0) {
                    sway['Tao:Yang'] = (sway['Tao:Yang'] || 0) + costInfo.extraYang;
                }
            }

            if (!Array.isArray(state.yarnWeaves)) state.yarnWeaves = [];
            const weave = {
                id: `yarn-reality-${s.revision + 1}`,
                kind: 'RealityManipulation',
                actorId,
                characterId: characterId || null,
                statement: String(payload.statement || ''),
                techniques,
                flipFlopDurationChi: payload.flipFlopDurationChi ?? null,
                ...costInfo,
                chiSpent,
                yarnSpent
            };
            state.yarnWeaves.push(weave);
            emit('Yarn:RealityManipulated', { weave: clone(weave) }, 'public');
            return clone(weave);
        }
    });

    // -------------------------------------------------------------------------
    // 4. Ordeal Suit Defense (Parry / Soak) & Yarn-Tangling Ordeal
    // -------------------------------------------------------------------------
    session.registerCommand('Ordeal:Defend', {
        roles: ['player', 'referee', 'system'],
        handler: ({ state, actorId, actorRole, payload, emit }) => {
            const ordeal = state.table?.activeOrdeal;
            if (!ordeal || ordeal.status !== 'Active') throw makeErr('NO_ACTIVE_ORDEAL', 'No active Ordeal.');
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            const defenderId = isAuthority && payload.defenderId ? String(payload.defenderId) : actorId;
            const defender = ordeal.participants[defenderId];
            if (!defender) throw makeErr('NOT_PARTICIPANT', `'${defenderId}' is not a participant in the active Ordeal.`);

            const defenseIds = Array.isArray(payload.defenseCardIds) ? payload.defenseCardIds : [];
            const defenseCards = [];
            for (const cid of defenseIds) {
                const idx = defender.ordealPool.findIndex(c => c.id === cid);
                if (idx === -1) throw makeErr('CARD_NOT_IN_POOL', `Defense card '${cid}' not in defender's Ordeal Pool.`);
                defenseCards.push(defender.ordealPool.splice(idx, 1)[0]);
            }

            const effect = resolveSuitDefenseEffect(payload.suit || defenseCards[0]?.suit || 'Diamonds', payload.mode || 'Parry', {
                attackCards: clone(payload.attackCards || []),
                defenseCards,
                matchedCardId: payload.matchedCardId || null
            });

            if (Array.isArray(effect.addToDefenderPool) && effect.addToDefenderPool.length) {
                defender.ordealPool.push(...clone(effect.addToDefenderPool));
            }
            if (Array.isArray(effect.prepareForDefender) && effect.prepareForDefender.length) {
                if (!state.preparedReserves[defenderId]) state.preparedReserves[defenderId] = [];
                state.preparedReserves[defenderId].push(...clone(effect.prepareForDefender));
            }
            if (payload.attackerId && ordeal.participants[payload.attackerId]) {
                const attacker = ordeal.participants[payload.attackerId];
                if (effect.attackerRtAdded) attacker.rt += effect.attackerRtAdded;
                if (effect.attackerGrtAdded) attacker.grt += effect.attackerGrtAdded;
            }
            if (defenseCards.length) {
                if (!state.deck) state.deck = { drawPile: [], discardPile: [], deckCount: 0 };
                state.deck.discardPile.push(...defenseCards);
            }

            emit('Ordeal:DefenseResolved', { defenderId, effect }, 'public');
            return effect;
        }
    });

    session.registerCommand('Ordeal:YarnTangleAction', {
        roles: ['player', 'referee', 'system'],
        handler: ({ session: s, state, actorId, actorRole, payload, emit }) => {
            const ordeal = state.table?.activeOrdeal;
            if (!ordeal || ordeal.status !== 'Active') throw makeErr('NO_ACTIVE_ORDEAL', 'No active Ordeal.');
            const isAuthority = actorRole === 'referee' || actorRole === 'system';
            if (!ordeal.yarnTangle) {
                ordeal.yarnTangle = { knockedOut: [], suitWins: {} };
            }

            const op = String(payload.operation || '');
            ensureSessionDeck(s, state);

            if (op === 'initPools') {
                for (const p of Object.values(ordeal.participants)) {
                    const needed = Math.max(0, 3 - p.ordealPool.length);
                    if (needed > 0) p.ordealPool.push(...drawFromSessionDeck(s, state, needed));
                }
                emit('Ordeal:YarnTanglePoolsInitialized', { participants: Object.keys(ordeal.participants) }, 'public');
                return { ok: true, operation: op };
            }

            if (op === 'knockout') {
                const challengerId = isAuthority && payload.challengerId ? String(payload.challengerId) : actorId;
                const defenderId = String(payload.defenderId ?? '');
                const cPool = ordeal.participants[challengerId]?.ordealPool;
                const dPool = ordeal.participants[defenderId]?.ordealPool;
                if (!cPool || !dPool) throw makeErr('NOT_PARTICIPANT', 'Invalid Yarn-Tangling participants.');
                if (ordeal.yarnTangle.knockedOut.includes(challengerId) || ordeal.yarnTangle.knockedOut.includes(defenderId)) {
                    throw makeErr('ALREADY_KNOCKED_OUT', 'Participant already knocked out this round.');
                }

                const pipsSum = (pool) => pool.reduce((sum, c) => sum + (normalizeCardMeta(c).pips || 0), 0);
                const maxSuited = (pool) => {
                    const counts = {};
                    for (const c of pool) {
                        const suit = normalizeCardMeta(c).suit;
                        counts[suit] = (counts[suit] || 0) + 1;
                    }
                    return Math.max(0, ...Object.values(counts));
                };

                const cPips = pipsSum(cPool);
                const dPips = pipsSum(dPool);
                let winnerId = defenderId;
                let loserId = challengerId;
                let reason = 'Compare';

                if (cPips >= 32) {
                    winnerId = defenderId;
                    loserId = challengerId;
                    reason = 'ChallengerBust32';
                } else if (dPips >= 32) {
                    winnerId = challengerId;
                    loserId = defenderId;
                    reason = 'DefenderBust32';
                } else {
                    const cMax = maxSuited(cPool);
                    const dMax = maxSuited(dPool);
                    if (cMax > dMax || (cMax === dMax && cPips > dPips)) {
                        winnerId = challengerId;
                        loserId = defenderId;
                    }
                }

                ordeal.yarnTangle.knockedOut.push(loserId);
                emit('Ordeal:YarnTangleKnockOut', { winnerId, loserId, reason, cPips, dPips }, 'public');
                return { winnerId, loserId, reason, cPips, dPips };
            }

            if (op === 'recordSuitWin') {
                if (!isAuthority) throw makeErr('FORBIDDEN', 'Only Referee/System can record Yarn-Tangling Suit wins.');
                const winnerId = String(payload.actorId ?? '');
                const suit = String(payload.suit ?? '');
                if (!ordeal.yarnTangle.suitWins[winnerId]) ordeal.yarnTangle.suitWins[winnerId] = [];
                if (!ordeal.yarnTangle.suitWins[winnerId].includes(suit)) {
                    ordeal.yarnTangle.suitWins[winnerId].push(suit);
                }
                const wonOrdeal = ordeal.yarnTangle.suitWins[winnerId].length >= 4;
                if (wonOrdeal) {
                    ordeal.status = 'Resolved';
                    ordeal.outcome = `YarnTanglingWinner:${winnerId}`;
                }
                emit('Ordeal:YarnTangleSuitWon', { winnerId, suit, suitsWon: ordeal.yarnTangle.suitWins[winnerId], wonOrdeal }, 'public');
                return { winnerId, suit, suitsWon: clone(ordeal.yarnTangle.suitWins[winnerId]), wonOrdeal };
            }

            throw makeErr('INVALID_OPERATION', `Unsupported Yarn-Tangling operation '${op}'.`);
        }
    });
}
