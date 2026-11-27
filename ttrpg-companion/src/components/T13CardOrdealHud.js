import { SafeDOM } from '../utils/SafeDOM.js';
import './T13YarnCardWidget.js';

const BaseElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

export function formatSessionLogEntry(evt) {
    if (!evt || !evt.type) return '';
    const p = evt.payload || {};
    switch (evt.type) {
        case 'Test:Resolved': {
            const r = p.result || {};
            const rolls = r.diceRolls || r.rolls;
            return `Test (${r.facet || 'Facet'}): ${r.outcome ?? r.successLevel ?? 'Resolved'} Total=${r.total ?? r.score ?? '-'}${rolls ? ` [${rolls.join(', ')}]` : ''}`;
        }
        case 'Card:DrawnPrivate':
            return `Drew ${p.cards?.length ?? 1} card(s) to Private Hand (${p.cardContext || 'Ordeal'})`;
        case 'Card:Played':
            return `${p.ownerId || 'Actor'} played ${p.card?.name || 'Card'}`;
        case 'Card:Prepared':
            return `${p.ownerId || 'Actor'} prepared ${p.card?.name || 'Card'} (${p.reserveType || 'prepared'})`;
        case 'Card:Discarded':
            return `${p.ownerId || 'Actor'} discarded ${p.discarded?.length ?? 1} card(s)`;
        case 'Ordeal:Started':
            return `Ordeal Started: ${p.ordeal?.stakes || 'Low'} Stakes (${p.ordeal?.terrain || 'Closed'})`;
        case 'Ordeal:StageDrawn':
            return `Stage ${(p.stageIndex ?? 0) + 1} Drawn: Difficulty ${p.stage?.difficulty ?? '?'} (${p.stage?.difficultyRatio ?? ''})`;
        case 'Ordeal:CardsPlayed':
            return `${p.actorId} ${p.actionType} action: ${p.actionPips} action pips (RT:${p.rt}, GRT:${p.grt})${p.tricks?.length ? ` Tricks: ${p.tricks.map(t => t.name || t).join(', ')}` : ''}`;
        case 'Ordeal:DefenseResolved':
            return `Defense resolved for ${p.defenderId}: ${p.effect?.summary || p.effect?.mode || 'Parry'}`;
        case 'Ordeal:Resolved':
            return `Ordeal Resolved: ${p.outcome || 'Completed'}`;
        case 'Hitch:Evaluated':
            return `Hitch (${p.hitch?.facet}): ${p.hitch?.tier} Marks=${p.hitch?.marks} Ruins=${p.hitch?.ruins}`;
        case 'Wound:Applied':
            return `Wound Applied to ${p.characterId}: ${p.wound?.name} (Lvl ${p.wound?.level})`;
        case 'Sway:Adjusted':
            return `Sway ${p.currency} for ${p.characterId}: ${p.delta > 0 ? '+' : ''}${p.delta} (Balance ${p.balance})`;
        case 'Drama:StressRelieved':
            return `Stress Relieved for ${p.characterId}: -${p.relievedTotal} (${p.dramaType})`;
        case 'Plot:CreatedFromQuestSpread':
        case 'Plot:Confirmed':
            return `Plot ${evt.type === 'Plot:Confirmed' ? 'Confirmed' : 'Created'}: ${p.plot?.title || p.plot?.id}`;
        default:
            return `${evt.type}`;
    }
}

export class T13CardOrdealHud extends BaseElement {
    constructor() {
        super();
        if (typeof this.attachShadow === 'function') {
            this.attachShadow({ mode: 'open' });
        }
        this.sessionClient = null;
        this.sessionState = null;
        this.viewerActorId = null;
        this.voipManager = null;
        this.activeCharacterId = null;
        this.selectedPoolCardIds = new Set();
        this.selectedWildCardIds = new Set();
        this.eventLog = [];
        this._clientUnsubs = [];
        this._hudError = null;
        this._voipTimer = null;
    }

    connectedCallback() {
        this.render();
        if (typeof setInterval === 'function' && !this._voipTimer) {
            this._voipTimer = setInterval(() => {
                if (this.voipManager && this.shadowRoot) this._refreshVoipBadges();
            }, 400);
            if (typeof this._voipTimer?.unref === 'function') this._voipTimer.unref();
        }
    }

    disconnectedCallback() {
        this._unbind();
        if (this._voipTimer) {
            clearInterval(this._voipTimer);
            this._voipTimer = null;
        }
    }

    _unbind() {
        while (this._clientUnsubs.length) {
            try { this._clientUnsubs.pop()?.(); } catch (_) {}
        }
    }

    bindSessionClient(client, viewerActorId = null) {
        this._unbind();
        this.sessionClient = client || null;
        if (viewerActorId) this.viewerActorId = viewerActorId;
        if (!client || typeof client.on !== 'function') return;

        const u1 = client.on('projection', (proj) => {
            this.setSessionState(proj, this.viewerActorId || client.actorId || proj?.viewerActorId);
        });
        const u2 = client.on('event', (evt) => {
            if (evt.seq && this.eventLog.some(item => item.id === evt.seq)) return;
            const line = formatSessionLogEntry(evt);
            if (line) {
                this.eventLog.unshift({ id: evt.seq || Date.now(), text: line, type: evt.type });
                if (this.eventLog.length > 40) this.eventLog.length = 40;
                this.render();
            }
        });
        const u3 = client.on('error', (err) => {
            this._hudError = err?.message || String(err);
            this.render();
        });
        if (typeof u1 === 'function') this._clientUnsubs.push(u1);
        if (typeof u2 === 'function') this._clientUnsubs.push(u2);
        if (typeof u3 === 'function') this._clientUnsubs.push(u3);
    }

    setSessionState(projection, viewerActorId = null) {
        this.sessionState = projection || null;
        if (viewerActorId) this.viewerActorId = viewerActorId;
        this.render();
    }

    setVOIPManager(voipManager) {
        this.voipManager = voipManager || null;
        this.render();
    }

    setActiveCharacterId(characterId) {
        this.activeCharacterId = characterId || null;
    }

    async _sendCommand(type, payload) {
        if (!this.sessionClient?.sendCommand) {
            this._hudError = 'Not connected to a live session.';
            this.render();
            return null;
        }
        try {
            this._hudError = null;
            return await this.sessionClient.sendCommand(type, payload);
        } catch (err) {
            this._hudError = err?.message || String(err);
            this.render();
            return null;
        }
    }

    _refreshVoipBadges() {
        const localBadge = this.shadowRoot?.querySelector('[data-voip-local]');
        if (localBadge && this.voipManager) {
            localBadge.textContent = this.voipManager.isSpeaking ? 'Speaking' : (this.voipManager.isMuted ? 'Muted' : 'Idle');
            localBadge.dataset.speaking = String(Boolean(this.voipManager.isSpeaking));
        }
    }

    async _handleCardAction(detail) {
        const { action, card } = detail || {};
        if (!card?.id) return;
        const ownerId = this.viewerActorId || this.sessionClient?.actorId || this.sessionState?.viewerActorId;
        if (action === 'play') {
            await this._sendCommand('Card:Play', { ownerId, cardId: card.id, cardContext: 'Ordeal' });
        } else if (action === 'prepare') {
            await this._sendCommand('Card:Prepare', { ownerId, cardId: card.id, reserveType: 'prepared', cardContext: 'Ordeal' });
        } else if (action === 'significator') {
            await this._sendCommand('Card:Prepare', { ownerId, cardId: card.id, reserveType: 'style', styleName: 'Significator', cardContext: 'Ordeal' });
        } else if (action === 'discard') {
            await this._sendCommand('Card:Discard', { ownerId, cardId: card.id, cardContext: 'Ordeal' });
        }
    }

    render() {
        if (!this.shadowRoot) return;
        this.shadowRoot.innerHTML = '';

        const state = this.sessionState || {};
        const actorId = this.viewerActorId || this.sessionClient?.actorId || state.viewerActorId || 'local';
        const privateHand = Array.isArray(state.privateHand) ? state.privateHand : [];
        const prepared = Array.isArray(state.preparedReserves?.[actorId]) ? state.preparedReserves[actorId] : [];
        const styleReserves = state.styleReserves?.[actorId] && typeof state.styleReserves[actorId] === 'object'
            ? state.styleReserves[actorId]
            : {};
        const ordeal = state.table?.activeOrdeal || null;
        const participant = ordeal?.participants?.[actorId] || null;
        const myPool = Array.isArray(participant?.ordealPool) ? participant.ordealPool : [];
        const wildPool = Array.isArray(ordeal?.wildPool) ? ordeal.wildPool : [];
        const stage = ordeal?.stages?.[ordeal?.currentStageIndex ?? 0] || null;

        const style = SafeDOM.el('style', {}, `
            :host { display: block; font-family: 'Inter', sans-serif; color: #e2e8f0; }
            .hud-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
            .hud-panel { background: rgba(15, 23, 42, 0.88); border: 1px solid #334155; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
            .hud-title { font-size: 0.78rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #93c5fd; display: flex; justify-content: space-between; align-items: center; }
            .card-strip { display: flex; flex-wrap: wrap; gap: 8px; }
            .reserve-chip, .pool-chip { background: #1e293b; border: 1px solid #475569; border-radius: 6px; padding: 6px 10px; font-size: 0.8rem; display: flex; align-items: center; gap: 8px; }
            .pool-chip.selected { border-color: #38bdf8; background: #0c4a6e; }
            .hud-btn { background: #2563eb; color: #fff; border: none; border-radius: 6px; padding: 6px 10px; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
            .hud-btn.secondary { background: #475569; }
            .hud-btn.warn { background: #d97706; }
            .action-row { display: flex; flex-wrap: wrap; gap: 6px; }
            .voip-peer { display: flex; justify-content: space-between; align-items: center; gap: 6px; background: #1e293b; border-radius: 6px; padding: 6px 8px; font-size: 0.78rem; }
            .speaking-dot { width: 8px; height: 8px; border-radius: 50%; background: #64748b; display: inline-block; }
            .speaking-dot[data-speaking="true"] { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
            .log-list { max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; font-size: 0.78rem; color: #cbd5e1; }
            .log-item { padding: 4px 6px; background: rgba(30,41,59,0.7); border-left: 3px solid #38bdf8; border-radius: 3px; }
            .hud-error { background: #450a0a; border: 1px solid #ef4444; color: #fecaca; padding: 6px 10px; border-radius: 6px; font-size: 0.8rem; }
        `);

        const handStrip = SafeDOM.el('div', { class: 'card-strip', 'data-role': 'private-hand' });
        handStrip.addEventListener('card-action', (e) => this._handleCardAction(e.detail));
        if (privateHand.length) {
            for (const card of privateHand) {
                const w = SafeDOM.el('t13-yarn-card', { interactive: 'true' });
                w.setInteractive(true);
                w.setCard(card);
                handStrip.appendChild(w);
            }
        } else {
            handStrip.appendChild(SafeDOM.el('span', { style: 'color:#94a3b8; font-size:0.8rem;' }, 'Private hand is empty.'));
        }

        const reserveChildren = [];
        for (const card of prepared) {
            reserveChildren.push(SafeDOM.el('div', { class: 'reserve-chip' }, [
                SafeDOM.el('span', {}, `Prepared: ${card.name} (${card.pips})`),
                SafeDOM.el('button', {
                    class: 'hud-btn',
                    type: 'button',
                    onclick: () => this._sendCommand('Card:Play', { ownerId: actorId, cardId: card.id })
                }, 'Play')
            ]));
        }
        for (const [styleName, cards] of Object.entries(styleReserves)) {
            for (const card of (cards || [])) {
                reserveChildren.push(SafeDOM.el('div', { class: 'reserve-chip' }, [
                    SafeDOM.el('span', {}, `${styleName}: ${card.name} (${card.pips})`),
                    SafeDOM.el('button', {
                        class: 'hud-btn',
                        type: 'button',
                        onclick: () => this._sendCommand('Card:Play', { ownerId: actorId, cardId: card.id })
                    }, 'Play')
                ]));
            }
        }

        const ordealChildren = [];
        if (ordeal) {
            ordealChildren.push(SafeDOM.el('div', { style: 'font-size:0.82rem; color:#fde68a;' },
                `Stakes: ${ordeal.stakes} • Round ${ordeal.roundNumber} / Phase ${ordeal.phaseNumber} • Stage ${(ordeal.currentStageIndex ?? 0) + 1} (${stage?.progress ?? 0}/${stage?.difficulty ?? '?'} pips)`
            ));
            if (wildPool.length) {
                ordealChildren.push(SafeDOM.el('div', { class: 'action-row' }, wildPool.map(wc => {
                    const checked = this.selectedWildCardIds.has(wc.id);
                    return SafeDOM.el('button', {
                        type: 'button',
                        class: `pool-chip${checked ? ' selected' : ''}`,
                        'data-pool-kind': 'wild',
                        onclick: () => {
                            if (checked) this.selectedWildCardIds.delete(wc.id);
                            else this.selectedWildCardIds.add(wc.id);
                            this.render();
                        }
                    }, `Wild: ${wc.name} (${wc.pips})`);
                })));
            }
            if (participant) {
                ordealChildren.push(SafeDOM.el('div', { style: 'font-size:0.78rem; color:#cbd5e1;' },
                    `Your Ordeal Pool (${myPool.length}) • RT: ${participant.rt} • GRT: ${participant.grt}`
                ));
                ordealChildren.push(SafeDOM.el('div', { class: 'action-row' }, myPool.map(pc => {
                    const checked = this.selectedPoolCardIds.has(pc.id);
                    return SafeDOM.el('button', {
                        type: 'button',
                        class: `pool-chip${checked ? ' selected' : ''}`,
                        'data-pool-kind': 'ordeal',
                        onclick: () => {
                            if (checked) this.selectedPoolCardIds.delete(pc.id);
                            else this.selectedPoolCardIds.add(pc.id);
                            this.render();
                        }
                    }, `${pc.name} (${pc.pips})`);
                })));
                const playOrdealAction = (actionType) => this._sendCommand('Ordeal:PlayCards', {
                    actorId,
                    characterId: this.activeCharacterId,
                    actionType,
                    playCardIds: Array.from(this.selectedPoolCardIds),
                    wildCardIds: Array.from(this.selectedWildCardIds)
                }).then((res) => {
                    if (res) {
                        this.selectedPoolCardIds.clear();
                        this.selectedWildCardIds.clear();
                    }
                });
                ordealChildren.push(SafeDOM.el('div', { class: 'action-row' }, [
                    SafeDOM.el('button', { class: 'hud-btn', type: 'button', 'data-ordeal-action': 'full', onclick: () => playOrdealAction('full') }, 'Full Action'),
                    SafeDOM.el('button', { class: 'hud-btn secondary', type: 'button', 'data-ordeal-action': 'half-wait', onclick: () => playOrdealAction('half-wait') }, 'Half-Wait (Draw)'),
                    SafeDOM.el('button', { class: 'hud-btn secondary', type: 'button', 'data-ordeal-action': 'half-quick', onclick: () => playOrdealAction('half-quick') }, 'Half-Quick'),
                    SafeDOM.el('button', {
                        class: 'hud-btn warn',
                        type: 'button',
                        'data-ordeal-action': 'defend',
                        onclick: () => this._sendCommand('Ordeal:Defend', {
                            defenderId: actorId,
                            defenseCardIds: Array.from(this.selectedPoolCardIds),
                            mode: 'Parry'
                        })
                    }, 'Defend (Parry)')
                ]));
            }
        } else {
            ordealChildren.push(SafeDOM.el('span', { style: 'color:#94a3b8; font-size:0.8rem;' }, 'No active Ordeal.'));
        }

        const voipPeers = this.voipManager?.remoteStreams instanceof Map
            ? Array.from(this.voipManager.remoteStreams.entries())
            : [];
        const sessionActors = Object.values(state.actors || {});
        const voipRows = [
            SafeDOM.el('div', { class: 'voip-peer' }, [
                SafeDOM.el('span', {}, [
                    SafeDOM.el('span', { class: 'speaking-dot', 'data-speaking': String(Boolean(this.voipManager?.isSpeaking)) }),
                    ` Local (${actorId}) — `,
                    SafeDOM.el('strong', { 'data-voip-local': 'true' }, this.voipManager?.isSpeaking ? 'Speaking' : (this.voipManager?.isMuted ? 'Muted' : 'Idle'))
                ]),
                SafeDOM.el('div', { style: 'display:flex; gap:4px;' }, [
                    SafeDOM.el('button', {
                        class: 'hud-btn secondary',
                        type: 'button',
                        onclick: () => {
                            if (!this.voipManager) return;
                            this.voipManager.setMuted(!this.voipManager.isMuted);
                            this.render();
                        }
                    }, this.voipManager?.isMuted ? 'Unmute Mic' : 'Mute Mic'),
                    SafeDOM.el('button', {
                        class: 'hud-btn secondary',
                        type: 'button',
                        onclick: () => {
                            if (!this.voipManager) return;
                            this.voipManager.setAccessibilityBypass(!this.voipManager.accessibilityBypass);
                            this.render();
                        }
                    }, this.voipManager?.accessibilityBypass ? 'FX: Dry Bypass ON' : 'FX: Active')
                ])
            ])
        ];
        for (const [peerId, info] of voipPeers) {
            voipRows.push(SafeDOM.el('div', { class: 'voip-peer', 'data-peer-id': peerId }, [
                SafeDOM.el('span', {}, [
                    SafeDOM.el('span', { class: 'speaking-dot', 'data-speaking': String(Boolean(info.isSpeaking)) }),
                    ` ${peerId}`
                ]),
                SafeDOM.el('button', {
                    class: 'hud-btn secondary',
                    type: 'button',
                    onclick: () => {
                        this.voipManager?.setPeerMuted?.(peerId, !info.muted);
                        this.render();
                    }
                }, info.muted ? 'Unmute Peer' : 'Mute Peer')
            ]));
        }
        if (voipPeers.length === 0 && sessionActors.length > 0) {
            for (const act of sessionActors) {
                if (act.id === actorId) continue;
                voipRows.push(SafeDOM.el('div', { class: 'voip-peer' }, [
                    SafeDOM.el('span', {}, `${act.label || act.id} (${act.role})`),
                    SafeDOM.el('span', { style: 'color:#94a3b8;' }, 'Peer Ready')
                ]));
            }
        }

        const root = SafeDOM.el('div', {}, [
            ...(this._hudError ? [SafeDOM.el('div', { class: 'hud-error' }, this._hudError)] : []),
            SafeDOM.el('div', { class: 'hud-grid' }, [
                SafeDOM.el('div', { class: 'hud-panel' }, [
                    SafeDOM.el('div', { class: 'hud-title' }, [`Private Hand (${privateHand.length})`, SafeDOM.el('span', {}, `Reserves: ${prepared.length}`)]),
                    handStrip,
                    ...(reserveChildren.length ? [SafeDOM.el('div', { class: 'action-row' }, reserveChildren)] : [])
                ]),
                SafeDOM.el('div', { class: 'hud-panel', 'data-panel': 'active-ordeal' }, [
                    SafeDOM.el('div', { class: 'hud-title' }, ['Active Ordeal Bar', SafeDOM.el('span', {}, ordeal ? ordeal.status : 'Standby')]),
                    ...ordealChildren
                ]),
                SafeDOM.el('div', { class: 'hud-panel', 'data-panel': 'voip-strip' }, [
                    SafeDOM.el('div', { class: 'hud-title' }, ['VOIP & Voice FX Strip', SafeDOM.el('span', {}, `${sessionActors.length} Actor(s)`)]),
                    ...voipRows
                ]),
                SafeDOM.el('div', { class: 'hud-panel', 'data-panel': 'session-log' }, [
                    SafeDOM.el('div', { class: 'hud-title' }, ['Roll & Narrative Log', SafeDOM.el('span', {}, `Rev ${state.revision ?? 0}`)]),
                    SafeDOM.el('div', { class: 'log-list' },
                        this.eventLog.length
                            ? this.eventLog.map(item => SafeDOM.el('div', { class: 'log-item' }, item.text))
                            : [SafeDOM.el('span', { style: 'color:#94a3b8;' }, 'No session events yet.')]
                    )
                ])
            ])
        ]);

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(root);
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('t13-card-ordeal-hud')) {
    customElements.define('t13-card-ordeal-hud', T13CardOrdealHud);
}
