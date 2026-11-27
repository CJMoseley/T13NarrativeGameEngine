import { SafeDOM } from '../utils/SafeDOM.js';
import { SPECIES_VOICE_PRESETS } from '../../../src/t13ne/modules/audio/VoiceFXChain.js';
import { STAKES_RULES } from '../../../src/t13ne/modules/systems/T13SessionRules.js';
import { VTT_TOKEN_TYPES } from '../../../src/t13ne/modules/vtt/T13SessionVTT.js';

export function buildMinimalHexagramTable() {
    return Array.from({ length: 64 }, (_, logical) => ({
        Hexagram: {
            Number: logical + 1,
            Logical: logical,
            Name: `Hexagram ${logical + 1}`
        },
        Hexagram_Quest: {
            Line_Quests: [1, 2, 3, 4, 5, 6].map((line) => ({
                Line: line,
                Quest: `Resolve changing line ${line} (Hexagram ${logical + 1})`
            }))
        }
    }));
}

const TOKEN_TYPE_LABELS = {
    character: 'Character',
    extra: 'Extra',
    creature: 'Creature',
    prop: 'Prop',
    terrain: 'Terrain'
};

const VOICE_PRESET_LABELS = {
    neutral: 'Natural',
    'giant-kaiju': 'Colossal / Kaiju',
    'fae-small': 'Fae / Diminutive',
    'chitin-click': 'Chitinous Click',
    'subharmonic-growl': 'Subharmonic Growl',
    'deep-resonator': 'Deep Resonator',
    'hive-chorus': 'Hive Chorus',
    'ethereal-shimmer': 'Ethereal Shimmer',
    'metallic-ring': 'Metallic Ring',
    'synth-vocoder': 'Synthetic Vocoder'
};

const COMMAND_STATUS_LABELS = {
    'Spread:InterpretQuest': 'Plot queued from Quest Spread.',
    'Plot:Confirm': 'Plot confirmed as Active.',
    'Referee:SetSecretNote': 'Private Referee note saved.',
    'VTT:SpawnToken': 'Token placed on tabletop.',
    'Deck:Initialize': 'Deck initialized and shuffled.',
    'Card:Draw': 'Private card dealt.',
    'Ordeal:Start': 'Ordeal started.',
    'Ordeal:DrawStage': 'Stage drawn.',
    'Ordeal:AdvancePhase': 'Advanced to next Ordeal Phase.',
    'Ordeal:AdvanceRound': 'Advanced to next Ordeal Round.',
    'Ordeal:Resolve': 'Ordeal resolved.',
    'Wound:Apply': 'Wound applied.',
    'IChing:GrantReward': 'I-Ching reward granted.',
    'Hitch:Evaluate': 'Hitch evaluated.',
    'VTT:SetFog': 'Fog of War updated.'
};

function humanizeLabel(raw) {
    return String(raw || '')
        .replace(/[_:]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, (ch) => ch.toUpperCase())
        .trim();
}

const BaseElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

export class T13RefereeConsole extends BaseElement {
    constructor() {
        super();
        if (typeof this.attachShadow === 'function') {
            this.attachShadow({ mode: 'open' });
        }
        this.sessionClient = null;
        this.sessionState = null;
        this.bridge = null;
        this.isAuthorized = false;
        this.audioHooks = { voipManager: null, audioDirector: null };
        this._clientUnsubs = [];
        this._status = '';
        this._error = '';
        this._lastSnapshot = null;

        this._form = {
            plotTitle: 'Crimson Nexus Awakening',
            secretKey: 'Plot Hook',
            secretNote: 'Cultists hold the Obsidian Key.',
            tokenLabel: 'Clockwork Sentinel',
            tokenKind: 'character',
            tokenSpecies: 'Mech',
            tokenHidden: false,
            voicePreset: 'synth-vocoder',
            stakes: 'High',
            targetActorId: '',
            targetCharId: '',
            woundTotalPips: 14,
            ichingReward: 'Chi',
            ichingAmount: 2,
            hitchFacet: 'Wyrd',
            hitchBane: 5,
            audioMood: 'Mystery'
        };
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {
        this._unbind();
    }

    _unbind() {
        while (this._clientUnsubs.length) {
            try { this._clientUnsubs.pop()?.(); } catch (_) {}
        }
    }

    bindSessionClient(client) {
        this._unbind();
        this.sessionClient = client || null;
        if (!client || typeof client.on !== 'function') return;
        const u1 = client.on('projection', (proj) => this.setSessionState(proj));
        const u2 = client.on('error', (err) => {
            this._error = err?.message || String(err);
            this.render();
        });
        if (typeof u1 === 'function') this._clientUnsubs.push(u1);
        if (typeof u2 === 'function') this._clientUnsubs.push(u2);
    }

    setBridge(bridge) {
        this.bridge = bridge || null;
        this.render();
    }

    setAuthorized(authorized) {
        this.isAuthorized = Boolean(authorized);
        this.render();
    }

    setAudioHooks({ voipManager = null, audioDirector = null } = {}) {
        this.audioHooks = {
            voipManager: voipManager ?? this.audioHooks.voipManager,
            audioDirector: audioDirector ?? this.audioHooks.audioDirector
        };
        this.render();
    }

    setSessionState(projection) {
        this.sessionState = projection || null;
        const actors = Object.values(projection?.actors || {}).filter(a => a.role !== 'system');
        const preferred = actors.find(a => a.role === 'player') || actors[0];
        if ((!this._form.targetActorId || this._form.targetActorId === 'system') && preferred) {
            this._form.targetActorId = preferred.id;
        }
        const chars = Object.values(projection?.characters || {});
        if (!this._form.targetCharId && chars.length) {
            this._form.targetCharId = chars[0].id;
        }
        this.render();
    }

    async _sendCommand(type, payload) {
        if (!this.sessionClient?.sendCommand) {
            this._error = 'No active session client.';
            this.render();
            return null;
        }
        try {
            this._error = '';
            const res = await this.sessionClient.sendCommand(type, payload);
            this._status = COMMAND_STATUS_LABELS[type] || `${humanizeLabel(type)} completed.`;
            this.render();
            return res;
        } catch (err) {
            this._error = err?.message || String(err);
            this.render();
            return null;
        }
    }

    render() {
        if (!this.shadowRoot) return;
        this.shadowRoot.innerHTML = '';

        const style = SafeDOM.el('style', {}, `
            :host { display: block; font-family: 'Inter', sans-serif; color: #e2e8f0; }
            .console-wrap { display: flex; flex-direction: column; gap: 14px; }
            .gate-box { background: #450a0a; border: 1px solid #ef4444; color: #fecaca; padding: 14px; border-radius: 8px; font-weight: 600; }
            .ref-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; }
            .ref-card { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
            .ref-title { font-size: 0.82rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #f59e0b; border-bottom: 1px solid #1e293b; padding-bottom: 6px; }
            .row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
            label { font-size: 0.76rem; color: #94a3b8; display: flex; flex-direction: column; gap: 3px; font-weight: 600; }
            input, select, textarea { background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 5px; padding: 6px 8px; font-size: 0.82rem; }
            button { background: #d97706; color: #fff; border: none; border-radius: 6px; padding: 7px 11px; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
            button:hover { background: #b45309; }
            button.secondary { background: #334155; }
            button.primary { background: #2563eb; }
            .list-box { max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; }
            .list-item { background: #1e293b; padding: 6px 8px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; gap: 6px; }
            .status-bar { font-size: 0.8rem; color: #38bdf8; }
            .error-bar { font-size: 0.8rem; color: #f87171; }
        `);

        if (!this.isAuthorized) {
            this.shadowRoot.appendChild(style);
            this.shadowRoot.appendChild(SafeDOM.el('div', { class: 'gate-box', 'data-referee-locked': 'true' },
                'Referee Console locked. Elevate to Referee credentials via challenge-response above to unlock authoritative Plot, Ordeal, Secret Note, and Adjudication controls.'
            ));
            return;
        }

        const state = this.sessionState || {};
        const plots = Object.values(state.plots || {});
        const actors = Object.values(state.actors || {});
        const chars = Object.values(state.characters || {});
        const secrets = state.refereeSecrets?.notes && typeof state.refereeSecrets.notes === 'object'
            ? state.refereeSecrets.notes
            : {};
        const f = this._form;

        const fieldInput = (labelText, value, onChange, type = 'text') => {
            const inp = SafeDOM.el('input', { type, value: String(value ?? '') });
            inp.addEventListener('input', (e) => onChange(e.target.value));
            return SafeDOM.el('label', {}, [labelText, inp]);
        };

        const fieldSelect = (labelText, current, options, onChange) => {
            const sel = SafeDOM.el('select', {}, options.map(opt => {
                const val = typeof opt === 'object' ? opt.value : opt;
                const txt = typeof opt === 'object' ? opt.label : opt;
                return SafeDOM.el('option', { value: val, ...(current === val ? { selected: 'selected' } : {}) }, txt);
            }));
            sel.addEventListener('change', (e) => onChange(e.target.value));
            return SafeDOM.el('label', {}, [labelText, sel]);
        };

        // 1. Plots & Quest Spreads
        const plotCard = SafeDOM.el('div', { class: 'ref-card' }, [
            SafeDOM.el('div', { class: 'ref-title' }, 'Plots & Quest Spreads'),
            SafeDOM.el('div', { class: 'row' }, [
                fieldInput('Plot Title', f.plotTitle, (v) => { f.plotTitle = v; }),
                SafeDOM.el('button', {
                    type: 'button',
                    'data-ref-action': 'interpret-spread',
                    onclick: () => this._sendCommand('Spread:InterpretQuest', {
                        title: f.plotTitle || 'Untitled Quest',
                        spread: {
                            spreadDefinition: { id: 'quest-6-card' },
                            cards: [
                                { position: 'Line 1', card: { data: { Tao: [1, 0] } } },
                                { position: 'Line 2', card: { data: { Tao: [0, 0] } } },
                                { position: 'Line 3', card: { data: { Tao: [1, 1] } } },
                                { position: 'Line 4', card: { data: { Tao: [1, 0] } } },
                                { position: 'Line 5', card: { data: { Tao: [0, 1] } } },
                                { position: 'Line 6', card: { data: { Tao: [1, 1] } } }
                            ]
                        },
                        hexagrams: buildMinimalHexagramTable()
                    })
                }, 'Interpret Spread & Queue Plot')
            ]),
            SafeDOM.el('div', { class: 'list-box', 'data-ref-plots': 'true' },
                plots.length
                    ? plots.map(p => SafeDOM.el('div', { class: 'list-item' }, [
                        SafeDOM.el('span', {}, `${p.title} (${humanizeLabel(p.status)})`),
                        ...(p.status !== 'Active' ? [SafeDOM.el('button', {
                            type: 'button',
                            class: 'primary',
                            onclick: () => this._sendCommand('Plot:Confirm', { plotId: p.id })
                        }, 'Confirm Plot')] : [])
                    ]))
                    : [SafeDOM.el('span', { style: 'color:#94a3b8;' }, 'No plots queued.')]
            )
        ]);

        // 2. Private Referee Notes (never disclosed in player projections)
        const secretsCard = SafeDOM.el('div', { class: 'ref-card' }, [
            SafeDOM.el('div', { class: 'ref-title' }, 'Private Notes'),
            SafeDOM.el('div', { class: 'row' }, [
                fieldInput('Note Title', f.secretKey, (v) => { f.secretKey = v; }),
                fieldInput('Note', f.secretNote, (v) => { f.secretNote = v; }),
                SafeDOM.el('button', {
                    type: 'button',
                    'data-ref-action': 'save-secret',
                    onclick: () => this._sendCommand('Referee:SetSecretNote', { key: f.secretKey, note: f.secretNote })
                }, 'Save Secret Note')
            ]),
            SafeDOM.el('div', { class: 'list-box', 'data-ref-secrets': 'true' },
                Object.keys(secrets).length
                    ? Object.entries(secrets).map(([k, v]) => SafeDOM.el('div', { class: 'list-item' }, [
                        SafeDOM.el('strong', {}, humanizeLabel(k)),
                        SafeDOM.el('span', {}, typeof v === 'string' ? v : JSON.stringify(v))
                    ]))
                    : [SafeDOM.el('span', { style: 'color:#94a3b8;' }, 'No Referee secrets recorded.')]
            )
        ]);

        // 3. NPC / Encounter Spawner & Voice FX Switcher
        const hiddenToggle = SafeDOM.el('input', { type: 'checkbox', ...(f.tokenHidden ? { checked: 'checked' } : {}) });
        hiddenToggle.addEventListener('change', (e) => { f.tokenHidden = Boolean(e.target.checked); });

        const spawnerCard = SafeDOM.el('div', { class: 'ref-card' }, [
            SafeDOM.el('div', { class: 'ref-title' }, 'NPC & Encounter Spawner'),
            SafeDOM.el('div', { class: 'row' }, [
                fieldInput('Name', f.tokenLabel, (v) => { f.tokenLabel = v; }),
                fieldSelect('Type', f.tokenKind, VTT_TOKEN_TYPES.map(t => ({ value: t, label: TOKEN_TYPE_LABELS[t] || humanizeLabel(t) })), (v) => { f.tokenKind = v; }),
                fieldSelect('Species', f.tokenSpecies, ['Human', 'Insectoid', 'Mech', 'Giant', 'Fae'], (v) => { f.tokenSpecies = v; }),
                SafeDOM.el('label', { style: 'flex-direction:row; align-items:center; gap:6px;' }, [hiddenToggle, 'Hidden from Players'])
            ]),
            SafeDOM.el('div', { class: 'row' }, [
                SafeDOM.el('button', {
                    type: 'button',
                    'data-ref-action': 'spawn-npc',
                    onclick: () => this._sendCommand('VTT:SpawnToken', {
                        id: `npc-${Date.now().toString(36)}`,
                        name: f.tokenLabel || 'NPC',
                        tokenType: f.tokenKind,
                        speciesId: f.tokenSpecies,
                        incarna: 'Trial',
                        hidden: f.tokenHidden,
                        position: {
                            x: Math.round((Math.random() - 0.5) * 6),
                            y: 0,
                            z: Math.round((Math.random() - 0.5) * 6)
                        }
                    })
                }, 'Spawn Token on VTT'),
                fieldSelect('NPC Voice FX', f.voicePreset, Object.keys(SPECIES_VOICE_PRESETS).map(k => ({ value: k, label: VOICE_PRESET_LABELS[k] || humanizeLabel(k) })), (v) => {
                    f.voicePreset = v;
                    this.audioHooks?.voipManager?.setLocalVoiceProfile(v);
                })
            ])
        ]);

        // 4. Deck & Ordeal Director
        const visibleActors = actors.filter(a => a.role !== 'system');
        const actorOpts = visibleActors.length
            ? visibleActors.map(a => ({ value: a.id, label: `${a.name || a.id} (${humanizeLabel(a.role)})` }))
            : [{ value: 'player-1', label: 'Player 1' }];
        const ordealCard = SafeDOM.el('div', { class: 'ref-card' }, [
            SafeDOM.el('div', { class: 'ref-title' }, 'Deck & Ordeals'),
            SafeDOM.el('div', { class: 'row' }, [
                fieldSelect('Stakes', f.stakes, Object.keys(STAKES_RULES), (v) => { f.stakes = v; }),
                fieldSelect('Recipient', f.targetActorId || actorOpts[0].value, actorOpts, (v) => { f.targetActorId = v; })
            ]),
            SafeDOM.el('div', { class: 'row' }, [
                SafeDOM.el('button', { type: 'button', 'data-ref-action': 'init-deck', onclick: () => this._sendCommand('Deck:Initialize', { deckCount: 1 }) }, 'Init Deck'),
                SafeDOM.el('button', {
                    type: 'button',
                    'data-ref-action': 'deal-card',
                    onclick: () => this._sendCommand('Card:Draw', {
                        targetActorId: f.targetActorId || actorOpts[0].value,
                        count: 1,
                        cardContext: 'Ordeal'
                    })
                }, 'Deal Private Card'),
                SafeDOM.el('button', {
                    type: 'button',
                    'data-ref-action': 'start-ordeal',
                    onclick: () => this._sendCommand('Ordeal:Start', {
                        stakes: f.stakes,
                        participants: actors.filter(a => a.role === 'player').map(a => a.id)
                    })
                }, 'Start Ordeal'),
                SafeDOM.el('button', { type: 'button', class: 'secondary', 'data-ref-action': 'draw-stage', onclick: () => this._sendCommand('Ordeal:DrawStage', { cardCount: 2 }) }, 'Draw Stage'),
                SafeDOM.el('button', { type: 'button', class: 'secondary', onclick: () => this._sendCommand('Ordeal:AdvancePhase', {}) }, 'Next Phase'),
                SafeDOM.el('button', { type: 'button', class: 'secondary', onclick: () => this._sendCommand('Ordeal:AdvanceRound', {}) }, 'Next Round'),
                SafeDOM.el('button', { type: 'button', class: 'primary', onclick: () => this._sendCommand('Ordeal:Resolve', { outcome: 'Completed' }) }, 'Resolve Ordeal')
            ])
        ]);

        // 5. Adjudication (Wounds, Hitches, I-Ching, Fog, Music Mood)
        const charOpts = chars.length
            ? chars.map(c => ({ value: c.id, label: Array.isArray(c.name) ? c.name[0] : (c.name || c.id) }))
            : [{ value: '', label: '(No characters)' }];
        const adjCard = SafeDOM.el('div', { class: 'ref-card' }, [
            SafeDOM.el('div', { class: 'ref-title' }, 'Adjudication & Environment'),
            SafeDOM.el('div', { class: 'row' }, [
                fieldSelect('Character', f.targetCharId || charOpts[0].value, charOpts, (v) => { f.targetCharId = v; }),
                fieldInput('Wound Pips', f.woundTotalPips, (v) => { f.woundTotalPips = Number(v) || 10; }, 'number'),
                fieldSelect('I-Ching Reward', f.ichingReward, [
                    { value: 'Chi', label: 'Chi' },
                    { value: 'Karma', label: 'Karma' },
                    { value: 'Renown', label: 'Renown' },
                    { value: 'Tao:Yin', label: 'Yin' },
                    { value: 'Tao:Yang', label: 'Yang' }
                ], (v) => { f.ichingReward = v; })
            ]),
            SafeDOM.el('div', { class: 'row' }, [
                SafeDOM.el('button', {
                    type: 'button',
                    'data-ref-action': 'apply-wound',
                    onclick: () => this._sendCommand('Wound:Apply', {
                        characterId: f.targetCharId || charOpts[0].value,
                        stakes: f.stakes,
                        totalPips: f.woundTotalPips
                    })
                }, 'Apply Wound'),
                SafeDOM.el('button', {
                    type: 'button',
                    class: 'primary',
                    'data-ref-action': 'grant-reward',
                    onclick: () => this._sendCommand('IChing:GrantReward', {
                        characterId: f.targetCharId || charOpts[0].value,
                        gainKey: `ref-grant-${Date.now()}`,
                        rewardType: f.ichingReward,
                        amount: f.ichingAmount
                    })
                }, 'Grant I-Ching Reward'),
                SafeDOM.el('button', {
                    type: 'button',
                    class: 'secondary',
                    onclick: () => this._sendCommand('Hitch:Evaluate', {
                        characterId: f.targetCharId || charOpts[0].value,
                        facet: f.hitchFacet,
                        bane: f.hitchBane,
                        triggered: true
                    })
                }, 'Evaluate Hitch'),
                SafeDOM.el('button', {
                    type: 'button',
                    class: 'secondary',
                    onclick: () => this._sendCommand('VTT:SetFog', { enabled: !(state.table?.fogOfWar?.enabled) })
                }, state.table?.fogOfWar?.enabled ? 'Disable Fog' : 'Enable Fog'),
                fieldSelect('Music Mood', f.audioMood, ['Calm', 'Mystery', 'Action', 'Eerie', 'Triumph'], (v) => {
                    f.audioMood = v;
                    this.audioHooks?.audioDirector?.setMood(v, 0.7);
                })
            ])
        ]);

        // 6. Session Snapshot Save / Restore
        const snapCard = SafeDOM.el('div', { class: 'ref-card' }, [
            SafeDOM.el('div', { class: 'ref-title' }, 'Session Snapshots'),
            SafeDOM.el('div', { class: 'row' }, [
                SafeDOM.el('button', {
                    type: 'button',
                    class: 'primary',
                    'data-ref-action': 'save-snapshot',
                    onclick: async () => {
                        if (!this.bridge?.fetchSnapshot) return;
                        try {
                            this._lastSnapshot = await this.bridge.fetchSnapshot();
                            this._status = `Snapshot captured at revision ${this._lastSnapshot?.revision ?? '?'}`;
                            this._error = '';
                        } catch (err) {
                            this._error = err?.message || String(err);
                        }
                        this.render();
                    }
                }, 'Save / Capture Snapshot'),
                SafeDOM.el('button', {
                    type: 'button',
                    'data-ref-action': 'restore-snapshot',
                    onclick: async () => {
                        if (!this.bridge?.restoreSnapshot || !this._lastSnapshot) {
                            this._error = 'Capture a snapshot first before restoring.';
                            this.render();
                            return;
                        }
                        try {
                            await this.bridge.restoreSnapshot(this._lastSnapshot);
                            this._status = `Restored snapshot revision ${this._lastSnapshot?.revision ?? '?'}`;
                            this._error = '';
                        } catch (err) {
                            this._error = err?.message || String(err);
                        }
                        this.render();
                    }
                }, 'Restore Captured Snapshot')
            ])
        ]);

        const wrap = SafeDOM.el('div', { class: 'console-wrap' }, [
            ...(this._status ? [SafeDOM.el('div', { class: 'status-bar', 'data-ref-status': 'true' }, this._status)] : []),
            ...(this._error ? [SafeDOM.el('div', { class: 'error-bar', 'data-ref-error': 'true' }, this._error)] : []),
            SafeDOM.el('div', { class: 'ref-grid' }, [plotCard, secretsCard, spawnerCard, ordealCard, adjCard, snapCard])
        ]);

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(wrap);
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('t13-referee-console')) {
    customElements.define('t13-referee-console', T13RefereeConsole);
}
