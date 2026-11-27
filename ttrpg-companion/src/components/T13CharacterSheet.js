import * as THREE from 'three';
import { SafeDOM } from '../utils/SafeDOM.js';
import { AvatarStage } from '../../../src/t13ne/procgen/uhpp/AvatarStage.js';
import {
    facetBoonsFromStats,
    appearanceFromFacets,
    calculateSpeciesSize,
    formatHeightCm,
    resolveFormation,
    descendantAvatarData
} from '../../../src/t13ne/procgen/avatar/AvatarFacetBody.js';
import { SPECIES_VOICE_PRESETS } from '../../../src/t13ne/modules/audio/VoiceFXChain.js';

/**
 * Generates a Character avatar and its physical/material summary through AvatarStage.
 * Used by T13CharacterSheet in the browser and directly testable in Node.
 * @param {object} characterData
 * @param {object} [options]
 * @returns {Promise<{avatar: THREE.Object3D, measurements: object, descriptors: object}>}
 */
export async function buildCharacterSheetAvatar(characterData, options = {}) {
    if (!characterData || typeof characterData !== 'object') {
        throw new TypeError('buildCharacterSheetAvatar requires a character object.');
    }
    const stage = options.stage ?? new AvatarStage();
    const species = options.species
        ?? (typeof characterData.species === 'object' ? characterData.species
            : { name: characterData.species || 'Human' });
    const stats = Array.isArray(characterData.facetweb?.Stats) ? characterData.facetweb.Stats : null;
    const boons = stats ? facetBoonsFromStats(stats) : {};
    const sizeInfo = calculateSpeciesSize({ boons, character: characterData, species });
    const { descriptors } = appearanceFromFacets(boons);

    const context = await stage.execute({
        character: { ...characterData, species: characterData.species ?? 'Human' },
        ...(typeof characterData.species === 'object' ? { species: characterData.species } : {}),
        ...(options.scene ? { scene: options.scene } : {}),
        ...(options.skinDocument ? { skinDocument: options.skinDocument } : {}),
        ...(options.skinStore ? { skinStore: options.skinStore } : {})
    });

    return {
        avatar: context.avatar,
        measurements: {
            heightCm: context.avatarMeasurements?.heightCm ?? sizeInfo.heightCm,
            heightDisplay: formatHeightCm(context.avatarMeasurements?.heightCm ?? sizeInfo.heightCm),
            formation: context.avatarMeasurements?.formation ?? sizeInfo.formation,
            material: context.avatarMeasurements?.material ?? sizeInfo.material
        },
        descriptors
    };
}

/**
 * Generates a Descendant procedural model and Formation material metadata through AvatarStage.
 * @param {object} descendantData
 * @param {object} [options]
 * @returns {Promise<{avatar: THREE.Object3D, measurements: object, descendantInfo: object}>}
 */
export async function buildDescendantSheetAvatar(descendantData, options = {}) {
    if (!descendantData || typeof descendantData !== 'object') {
        throw new TypeError('buildDescendantSheetAvatar requires a Descendant object.');
    }
    const stage = options.stage ?? new AvatarStage();
    const descendantInfo = descendantAvatarData(descendantData);
    const context = await stage.execute({
        descendant: descendantData,
        ...(options.bodyPlan ? { bodyPlan: options.bodyPlan } : {}),
        ...(options.scene ? { scene: options.scene } : {}),
        ...(options.skinDocument ? { skinDocument: options.skinDocument } : {}),
        ...(options.skinStore ? { skinStore: options.skinStore } : {})
    });
    return {
        avatar: context.avatar,
        measurements: context.avatarMeasurements,
        descendantInfo
    };
}

const BaseElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

export class T13CharacterSheet extends BaseElement {
    constructor() {
        super();
        if (typeof this.attachShadow === 'function') {
            this.attachShadow({ mode: 'open' });
        }
        this.characterData = null;
        this.sessionClient = null;
        this.sessionState = null;
        this.audioHooks = { voipManager: null, liveAvatarController: null };
        this._clientUnsubs = [];
        this._previewRenderer = null;
        this._previewAvatar = null;
        this._previewRunId = 0;
        this._voicePreset = 'auto';
        this._dryVoiceBypass = false;
        this._puppetMode = 'idle';
        this._runnerState = {
            facet: 'Awe',
            testType: 'dice',
            difficulty: 2,
            extraDiceCount: 0,
            strainDiceCount: 0,
            chiSpend: 0,
            stressGain: 0,
            bane: 4,
            hitchTriggered: true,
            lastOutcome: null,
            lastError: null
        };
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {
        this._unbindSessionClient();
        this._disposePreview();
    }

    _unbindSessionClient() {
        while (this._clientUnsubs.length) {
            const unsub = this._clientUnsubs.pop();
            try { unsub?.(); } catch (_) {}
        }
    }

    bindSessionClient(client) {
        this._unbindSessionClient();
        this.sessionClient = client || null;
        if (!client || typeof client.on !== 'function') return;

        const onProj = (proj) => this.setSessionState(proj);
        const onEvent = (evt) => {
            if (!evt || !this.characterData) return;
            const targetId = evt.payload?.characterId;
            if (targetId && targetId !== this.characterData.id) return;
            if (evt.type === 'Test:Resolved') {
                this._runnerState.lastOutcome = evt.payload?.result ?? evt.payload;
                this._runnerState.lastError = null;
                this.render();
            } else if (evt.type === 'Hitch:Evaluated') {
                this._runnerState.lastOutcome = evt.payload?.hitch ?? evt.payload;
                this._runnerState.lastError = null;
                this.render();
            }
        };
        const u1 = client.on('projection', onProj);
        const u2 = client.on('event', onEvent);
        if (typeof u1 === 'function') this._clientUnsubs.push(u1);
        if (typeof u2 === 'function') this._clientUnsubs.push(u2);
    }

    setSessionState(projection) {
        this.sessionState = projection || null;
        if (this.characterData?.id && projection?.characters?.[this.characterData.id]) {
            this.characterData = projection.characters[this.characterData.id];
        }
        this.render();
    }

    setAudioHooks(hooks = {}) {
        this.audioHooks = {
            voipManager: hooks.voipManager ?? this.audioHooks?.voipManager ?? null,
            liveAvatarController: hooks.liveAvatarController ?? this.audioHooks?.liveAvatarController ?? null
        };
        if (this.audioHooks.liveAvatarController?.mode) {
            this._puppetMode = this.audioHooks.liveAvatarController.mode;
        }
        if (this.audioHooks.voipManager) {
            this._dryVoiceBypass = Boolean(this.audioHooks.voipManager.accessibilityBypass);
        }
        this.render();
    }

    async _sendSessionCommand(type, payload) {
        if (typeof this.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
            this.dispatchEvent(new CustomEvent('session-command', {
                detail: { type, payload },
                bubbles: true,
                composed: true
            }));
        }
        if (!this.sessionClient || typeof this.sessionClient.sendCommand !== 'function') {
            this._runnerState.lastError = 'No active session connection; command queued locally.';
            this.render();
            return null;
        }
        try {
            const res = await this.sessionClient.sendCommand(type, payload);
            this._runnerState.lastError = null;
            return res;
        } catch (err) {
            this._runnerState.lastError = err?.message || String(err);
            this.render();
            return null;
        }
    }

    setCharacter(data) {
        this.characterData = data;
        const firstFacet = data?.boons ? Object.keys(data.boons)[0] : null;
        if (firstFacet) this._runnerState.facet = firstFacet;
        this.render();
    }

    _disposePreview() {
        this._previewRunId++;
        if (this._previewAvatar) {
            this._previewAvatar.traverse(obj => {
                obj.geometry?.dispose();
                const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                for (const m of mats) {
                    m?.map?.dispose();
                    m?.dispose();
                }
            });
            this._previewAvatar = null;
        }
        if (this._previewRenderer) {
            this._previewRenderer.dispose();
            this._previewRenderer = null;
        }
    }

    render() {
        if (!this.shadowRoot) return;
        this._disposePreview();
        this.shadowRoot.innerHTML = '';
        if (!this.characterData) {
            this.shadowRoot.appendChild(SafeDOM.el('p', { style: 'color: #64748b; font-style: italic;' }, 'No character data loaded.'));
            return;
        }

        const {
            name, charType, boons, hexagram, significator,
            features = [], descendants = [], hitches = [], proficiencies = [], annexes = []
        } = this.characterData;
        const displayName = Array.isArray(name) ? name[0] : name;

        const stats = Array.isArray(this.characterData.facetweb?.Stats) ? this.characterData.facetweb.Stats : null;
        const facetBoons = stats ? facetBoonsFromStats(stats) : {};
        const speciesObj = typeof this.characterData.species === 'object'
            ? this.characterData.species
            : { name: this.characterData.species || 'Human' };
        const sizeInfo = calculateSpeciesSize({ boons: facetBoons, character: this.characterData, species: speciesObj });
        const heightLabel = formatHeightCm(sizeInfo.heightCm);
        const { descriptors } = appearanceFromFacets(facetBoons);
        const descriptorSummary = [descriptors.awe, descriptors.burden, descriptors.gossamer, descriptors.miasma]
            .filter(Boolean)
            .join(' • ');

        const style = SafeDOM.el('style', {}, `
            :host { display: block; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.5; }
            .sheet-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
            .header { background: #f8fafc; padding: 24px; border-bottom: 1px solid #e2e8f0; }
            .name-row { display: flex; justify-content: space-between; align-items: baseline; }
            .name { font-size: 2rem; font-weight: 800; margin: 0; color: #0f172a; text-transform: uppercase; letter-spacing: -0.025em; }
            .type-badge { font-size: 0.75rem; font-weight: 700; background: #3b82f6; color: #fff; padding: 4px 12px; border-radius: 4px; text-transform: uppercase; }
            .meta-row { display: flex; flex-wrap: wrap; gap: 24px; margin-top: 12px; }
            .hexagram, .significator { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 0.9rem; font-weight: 600; }

            .section { padding: 24px; border-bottom: 1px solid #f1f5f9; }
            .section-title { font-size: 0.875rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; border-left: 4px solid #3b82f6; padding-left: 12px; }

            .avatar-row { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
            .avatar-preview-box { width: 140px; height: 180px; border-radius: 8px; background: #0f172a; border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; overflow: hidden; color: #94a3b8; font-size: 0.75rem; }
            .avatar-details { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 200px; }
            .avatar-meta { font-size: 0.875rem; color: #334155; }
            .avatar-btn { align-self: flex-start; background: #1e293b; color: #fff; border: none; border-radius: 6px; padding: 8px 14px; cursor: pointer; font-weight: 600; font-size: 0.85rem; }
            .avatar-btn:hover { background: #334155; }

            .boon-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .boon-item { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
            .boon-label { font-weight: 600; color: #475569; }
            .boon-value { font-family: monospace; font-size: 1.25rem; font-weight: 700; color: #2563eb; }

            .feature-box { background: #fdf2f8; border: 1px solid #fce7f3; border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 4px solid #db2777; }
            .feature-name { font-weight: 800; font-size: 0.8rem; color: #9d174d; text-transform: uppercase; }

            .list-container { display: flex; flex-direction: column; gap: 12px; }
            .widget-list { display: flex; flex-wrap: wrap; gap: 8px; }
            .widget-chip { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 4px 12px; border-radius: 16px; font-size: 0.875rem; font-weight: 500; color: #475569; cursor: pointer; }
            .widget-chip:hover { border-color: #3b82f6; }
            .hitch-chip { background: #fef2f2; border: 1px solid #fee2e2; color: #dc2626; }
            .descendant-row, .wound-row, .sway-row, .stress-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; }
            .boon-clickable { cursor: pointer; transition: border-color 0.15s, background 0.15s; text-align: left; width: 100%; font: inherit; }
            .boon-clickable:hover, .boon-clickable.active { border-color: #2563eb; background: #eff6ff; }
            .runner-panel { margin-top: 14px; padding: 14px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; display: flex; flex-direction: column; gap: 10px; }
            .runner-controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
            .runner-controls label { font-size: 0.78rem; color: #475569; display: flex; flex-direction: column; gap: 3px; font-weight: 600; }
            .runner-controls input, .runner-controls select { padding: 5px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem; background: #fff; color: #0f172a; }
            .runner-result { padding: 10px 12px; border-radius: 6px; background: #0f172a; color: #e2e8f0; font-family: monospace; font-size: 0.82rem; white-space: pre-wrap; }
            .runner-error { padding: 8px 12px; border-radius: 6px; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; font-size: 0.82rem; }
            .sway-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; }
            .mini-btn { background: #1e293b; color: #fff; border: none; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 0.8rem; font-weight: 600; }
            .mini-btn.secondary { background: #475569; }
            .mini-btn.danger { background: #b91c1c; }
            .voice-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1; }
            .voice-row label { font-size: 0.8rem; color: #334155; display: flex; align-items: center; gap: 6px; font-weight: 600; }
        `);

        const previewBox = SafeDOM.el('div', { class: 'avatar-preview-box' }, 'Loading avatar...');
        const metaChildren = [
            SafeDOM.el('div', { class: 'hexagram' }, [
                SafeDOM.el('span', { style: 'font-size: 1.2rem;' }, '☯'),
                SafeDOM.el('span', {}, `Hexagram #${hexagram?.number ?? hexagram?.Hexagram?.Number ?? '?'}: ${hexagram?.name ?? hexagram?.Hexagram?.Name ?? 'Unset'}`)
            ]),
            ...(significator ? [SafeDOM.el('div', { class: 'significator' }, [
                SafeDOM.el('span', { style: 'font-size: 1.2rem;' }, '🃟'),
                SafeDOM.el('span', {}, `Significator: ${significator.name}`)
            ])] : [])
        ];

        const voiceLabels = {
            auto: 'Auto (Species)',
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
        const presetNames = ['auto', ...Object.keys(SPECIES_VOICE_PRESETS)];
        const voiceSelect = SafeDOM.el('select', { 'data-role': 'voice-preset' }, presetNames.map(p =>
            SafeDOM.el('option', { value: p, ...(this._voicePreset === p ? { selected: 'selected' } : {}) }, voiceLabels[p] || p)
        ));
        voiceSelect.addEventListener('change', (e) => {
            this._voicePreset = e.target.value;
            const vm = this.audioHooks?.voipManager;
            if (vm) {
                if (this._voicePreset === 'auto') {
                    vm.setLocalVoiceProfile(this.characterData);
                } else {
                    vm.setLocalVoiceProfile(this._voicePreset);
                }
            }
        });

        const dryBypassCheck = SafeDOM.el('input', {
            type: 'checkbox',
            'data-role': 'dry-bypass',
            ...(this._dryVoiceBypass ? { checked: 'checked' } : {})
        });
        dryBypassCheck.addEventListener('change', (e) => {
            this._dryVoiceBypass = Boolean(e.target.checked);
            this.audioHooks?.voipManager?.setAccessibilityBypass(this._dryVoiceBypass);
        });

        const puppetLabels = { idle: 'Idle', audio: 'Audio / Voice', webcam: 'Webcam' };
        const puppetSelect = SafeDOM.el('select', { 'data-role': 'puppet-mode' }, ['idle', 'audio', 'webcam'].map(m =>
            SafeDOM.el('option', { value: m, ...(this._puppetMode === m ? { selected: 'selected' } : {}) }, puppetLabels[m] || m)
        ));
        puppetSelect.addEventListener('change', async (e) => {
            this._puppetMode = e.target.value;
            const ctrl = this.audioHooks?.liveAvatarController;
            if (ctrl && typeof ctrl.setMode === 'function') {
                try {
                    await ctrl.setMode(this._puppetMode, this.audioHooks?.voipManager || null);
                } catch (err) {
                    this._runnerState.lastError = err?.message || String(err);
                    this.render();
                }
            }
        });

        const spawnTokenBtn = SafeDOM.el('button', {
            class: 'avatar-btn',
            type: 'button',
            'data-action': 'spawn-character-token',
            onclick: () => this.spawnCharacterTokenOnVTT()
        }, 'Spawn VTT Token');

        const sections = [
            SafeDOM.el('div', { class: 'header' }, [
                SafeDOM.el('div', { class: 'name-row' }, [
                    SafeDOM.el('h1', { class: 'name' }, SafeDOM.escape(displayName)),
                    SafeDOM.el('span', { class: 'type-badge' }, SafeDOM.escape(charType || 'Character'))
                ]),
                SafeDOM.el('div', { class: 'meta-row' }, metaChildren)
            ]),
            SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Appearance & Formation'),
                SafeDOM.el('div', { class: 'avatar-row' }, [
                    previewBox,
                    SafeDOM.el('div', { class: 'avatar-details' }, [
                        SafeDOM.el('div', { class: 'avatar-meta' }, `Formation: ${sizeInfo.formation} (${sizeInfo.material})${heightLabel ? ` • Height: ${heightLabel}` : ''}`),
                        ...(descriptorSummary ? [SafeDOM.el('div', { class: 'avatar-meta' }, `Build & Bearing: ${descriptorSummary}`)] : []),
                        SafeDOM.el('div', { style: 'display:flex; gap:8px; flex-wrap:wrap;' }, [
                            SafeDOM.el('button', { class: 'avatar-btn', type: 'button', onclick: () => this.openAvatarMaker() }, 'Open avatar model maker'),
                            spawnTokenBtn
                        ]),
                        SafeDOM.el('div', { class: 'voice-row' }, [
                            SafeDOM.el('label', {}, ['Voice FX:', voiceSelect]),
                            SafeDOM.el('label', {}, [dryBypassCheck, 'Dry Voice Bypass']),
                            SafeDOM.el('label', {}, ['Puppeting:', puppetSelect])
                        ])
                    ])
                ])
            ])
        ];

        if (features.length) {
            sections.push(SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Hexagram & Significator Features'),
                SafeDOM.el('div', {}, features.map(f => SafeDOM.el('div', { class: 'feature-box' }, [
                    SafeDOM.el('div', { class: 'feature-name' }, SafeDOM.escape(f.name)),
                    SafeDOM.el('div', { style: 'font-size: 0.85rem; color: #831843;' }, SafeDOM.escape(f.description))
                ])))
            ]));
        }

        const boonEntries = Object.entries(boons || {});
        const runner = this._runnerState;
        const facetOptions = Array.from(new Set([runner.facet, ...boonEntries.map(([k]) => k)].filter(Boolean)));
        const runnerFacetSel = SafeDOM.el('select', { 'data-runner': 'facet' }, facetOptions.map(f =>
            SafeDOM.el('option', { value: f, ...(runner.facet === f ? { selected: 'selected' } : {}) }, f)
        ));
        runnerFacetSel.addEventListener('change', (e) => { runner.facet = e.target.value; });

        const runnerMethodSel = SafeDOM.el('select', { 'data-runner': 'testType' }, [
            ['dice', 'Dice Test'],
            ['card', 'Card Draw Test'],
            ['value', 'Value Test']
        ].map(([val, label]) =>
            SafeDOM.el('option', { value: val, ...(runner.testType === val ? { selected: 'selected' } : {}) }, label)
        ));
        runnerMethodSel.addEventListener('change', (e) => { runner.testType = e.target.value; });

        const diffInput = SafeDOM.el('input', { type: 'number', min: '0', max: '30', value: String(runner.difficulty), style: 'width:68px;', 'data-runner': 'difficulty' });
        diffInput.addEventListener('change', (e) => { runner.difficulty = Number(e.target.value) || 0; });

        const extraInput = SafeDOM.el('input', { type: 'number', min: '0', max: '10', value: String(runner.extraDiceCount), style: 'width:58px;', 'data-runner': 'extraDice' });
        extraInput.addEventListener('change', (e) => { runner.extraDiceCount = Math.max(0, Number(e.target.value) || 0); });

        const strainInput = SafeDOM.el('input', { type: 'number', min: '0', max: '10', value: String(runner.strainDiceCount), style: 'width:58px;', 'data-runner': 'strainDice' });
        strainInput.addEventListener('change', (e) => { runner.strainDiceCount = Math.max(0, Number(e.target.value) || 0); });

        const baneInput = SafeDOM.el('input', { type: 'number', min: '1', max: '20', value: String(runner.bane), style: 'width:58px;', 'data-runner': 'bane' });
        baneInput.addEventListener('change', (e) => { runner.bane = Math.max(1, Number(e.target.value) || 1); });

        const performTestBtn = SafeDOM.el('button', {
            class: 'avatar-btn',
            type: 'button',
            'data-action': 'perform-test',
            onclick: () => this.performSelectedTest()
        }, 'Perform Test');

        const evalHitchBtn = SafeDOM.el('button', {
            class: 'mini-btn secondary',
            type: 'button',
            'data-action': 'evaluate-hitch',
            onclick: () => this.evaluateSelectedHitch()
        }, 'Evaluate Hitch');

        const runnerChildren = [
            SafeDOM.el('div', { style: 'font-weight:700; font-size:0.85rem; color:#1e293b;' }, 'Tests & Hitches'),
            SafeDOM.el('div', { class: 'runner-controls' }, [
                SafeDOM.el('label', {}, ['Facet', runnerFacetSel]),
                SafeDOM.el('label', {}, ['Method', runnerMethodSel]),
                SafeDOM.el('label', {}, ['Difficulty', diffInput]),
                SafeDOM.el('label', {}, ['Extra d6', extraInput]),
                SafeDOM.el('label', {}, ['Strain d6', strainInput]),
                SafeDOM.el('label', {}, ['Hitch Bane', baneInput]),
                performTestBtn,
                evalHitchBtn
            ])
        ];
        if (runner.lastOutcome) {
            const o = runner.lastOutcome;
            const summaryText = o.tier
                ? `Hitch ${o.facet} (Bane ${o.bane}) -> Tier: ${o.tier}, Marks: ${o.marks}, Ruins: ${o.ruins}, Triggered: ${o.triggered}`
                : `${o.type || runner.testType} (${o.facet || runner.facet}): Outcome=${o.outcome ?? o.successLevel ?? (o.success ? 'Success' : 'Failure')} | Total=${o.total ?? o.score ?? o.finalValue ?? '-'}${(o.diceRolls || o.rolls) ? ` | Rolls=[${(o.diceRolls || o.rolls).join(', ')}]` : ''}`;
            runnerChildren.push(SafeDOM.el('div', { class: 'runner-result', 'data-role': 'test-outcome' }, summaryText));
        }
        if (runner.lastError) {
            runnerChildren.push(SafeDOM.el('div', { class: 'runner-error', 'data-role': 'test-error' }, runner.lastError));
        }

        const swayObj = this.characterData.sway && typeof this.characterData.sway === 'object' ? this.characterData.sway : {};
        const swayKeys = Array.from(new Set(['Tao:Yin', 'Tao:Yang', 'Chi', 'Coin', 'Karma', 'Renown', 'Wealth', ...Object.keys(swayObj)]));
        const stressEntries = this.characterData.stressState && typeof this.characterData.stressState === 'object'
            ? Object.entries(this.characterData.stressState)
            : [];
        const wounds = Array.isArray(this.characterData.wounds) ? this.characterData.wounds : [];

        sections.push(
            SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Facet Boons'),
                SafeDOM.el('div', { class: 'boon-grid' }, boonEntries.map(([label, val]) =>
                    SafeDOM.el('button', {
                        type: 'button',
                        class: `boon-item boon-clickable${runner.facet === label ? ' active' : ''}`,
                        'data-facet': label,
                        onclick: () => {
                            this._runnerState.facet = label;
                            this.render();
                        }
                    }, [
                        SafeDOM.el('span', { class: 'boon-label' }, label),
                        SafeDOM.el('span', { class: 'boon-value' }, String(val))
                    ])
                )),
                SafeDOM.el('div', { class: 'runner-panel' }, runnerChildren)
            ]),
            SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Sway Purse'),
                SafeDOM.el('div', { class: 'sway-grid' }, swayKeys.map((currency) => {
                    const amount = Number(swayObj[currency] ?? 0);
                    const displayCurrency = currency.replace(/^Tao:/, '');
                    return SafeDOM.el('div', { class: 'sway-row', 'data-sway': currency }, [
                        SafeDOM.el('span', { style: 'font-weight:600; font-size:0.85rem;' }, `${displayCurrency}: ${amount}`),
                        SafeDOM.el('div', { style: 'display:flex; gap:4px;' }, [
                            SafeDOM.el('button', {
                                class: 'mini-btn secondary',
                                type: 'button',
                                'data-action': `sway-minus-${currency}`,
                                onclick: () => this._adjustSway(currency, -1)
                            }, '-1'),
                            SafeDOM.el('button', {
                                class: 'mini-btn',
                                type: 'button',
                                'data-action': `sway-plus-${currency}`,
                                onclick: () => this._adjustSway(currency, 1)
                            }, '+1')
                        ])
                    ]);
                }))
            ]),
            SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Stress, Strain & Shock'),
                SafeDOM.el('div', { class: 'list-container' }, [
                    ...(stressEntries.length
                        ? stressEntries.map(([bucket, vals]) => SafeDOM.el('div', { class: 'stress-row' }, [
                            SafeDOM.el('span', { style: 'font-size:0.85rem; font-weight:600;' }, `${bucket.replace(/^Facet:/, '')}: Stress ${vals?.stress ?? 0} • Strains ${vals?.strains ?? 0} • Shocks ${vals?.shocks ?? 0}`),
                            SafeDOM.el('button', {
                                class: 'mini-btn',
                                type: 'button',
                                onclick: () => this._relieveStress(bucket.replace(/^Facet:/, ''), 1)
                            }, 'Relieve Stress (-1)')
                        ]))
                        : [SafeDOM.el('div', { class: 'stress-row' }, [
                            SafeDOM.el('span', { style: 'color:#64748b; font-size:0.85rem;' }, 'No accumulated Stress/Strain/Shock.'),
                            SafeDOM.el('button', {
                                class: 'mini-btn secondary',
                                type: 'button',
                                onclick: () => this._relieveStress(runner.facet, 1)
                            }, 'Atmospheric Relief')
                        ])])
                ])
            ]),
            SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Active Wounds'),
                SafeDOM.el('div', { class: 'list-container' },
                    wounds.length
                        ? wounds.map(w => SafeDOM.el('div', { class: 'wound-row', 'data-wound-id': w.id }, [
                            SafeDOM.el('span', { style: 'font-size:0.85rem; font-weight:600;' }, `${w.name} (Lvl ${w.level}) • ${w.freshness || 'Fresh'} • ${w.damageType || 'Physical'}`),
                            SafeDOM.el('div', { style: 'display:flex; gap:6px;' }, [
                                SafeDOM.el('button', {
                                    class: 'mini-btn',
                                    type: 'button',
                                    onclick: () => this._updateWoundState(w.id, { spendChiToReduce: true })
                                }, 'Spend Chi to Reduce'),
                                SafeDOM.el('button', {
                                    class: 'mini-btn secondary',
                                    type: 'button',
                                    onclick: () => this._updateWoundState(w.id, { freshness: w.freshness === 'Treated' ? 'Untreated' : 'Treated' })
                                }, w.freshness === 'Treated' ? 'Mark Untreated' : 'Treat'),
                                SafeDOM.el('button', {
                                    class: 'mini-btn danger',
                                    type: 'button',
                                    onclick: () => this._updateWoundState(w.id, { action: 'remove' })
                                }, 'Heal')
                            ])
                        ]))
                        : [SafeDOM.el('span', { style: 'color: #94a3b8; font-size: 0.875rem;' }, 'No active wounds.')]
                )
            ]),
            SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Descendants & Gear'),
                SafeDOM.el('div', { class: 'list-container' },
                    descendants.length
                        ? descendants.map((d, idx) => {
                            const dName = Array.isArray(d.name) ? d.name[0] : (d.name || 'Unnamed Descendant');
                            const { formation, material } = resolveFormation(d, null);
                            return SafeDOM.el('div', { class: 'descendant-row' }, [
                                SafeDOM.el('span', { style: 'font-size: 0.875rem; font-weight: 600;' }, `${dName} (${d.descendantType || 'Item'} • ${formation} / ${material})`),
                                SafeDOM.el('div', { style: 'display:flex; gap:6px;' }, [
                                    SafeDOM.el('button', { class: 'avatar-btn', type: 'button', onclick: () => this.openDescendantMaker(d) }, 'Inspect Model'),
                                    SafeDOM.el('button', { class: 'mini-btn', type: 'button', onclick: () => this.spawnDescendantOnVTT(d, idx) }, 'Spawn Prop on VTT')
                                ])
                            ]);
                        })
                        : [SafeDOM.el('span', { style: 'color: #94a3b8; font-size: 0.875rem;' }, 'No linked descendants.')]
                )
            ]),
            SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Annexes & Knotwork'),
                SafeDOM.el('div', { class: 'list-container' },
                    annexes.length ? annexes.map(() => SafeDOM.el('t13-annex')) : [SafeDOM.el('span', { style: 'color: #94a3b8; font-size: 0.875rem;' }, 'No active annexes.')]
                )
            ]),
            SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Proficiencies'),
                SafeDOM.el('div', { class: 'widget-list' },
                    proficiencies.length ? proficiencies.map((p) => SafeDOM.el('t13-proficiency', {
                        onclick: () => {
                            if (p?.facet) {
                                this._runnerState.facet = p.facet;
                                this.render();
                            }
                        }
                    })) : [SafeDOM.el('span', { style: 'color: #94a3b8; font-size: 0.875rem;' }, 'No base proficiencies.')]
                )
            ]),
            SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Hitches & Complications'),
                SafeDOM.el('div', { class: 'widget-list' },
                    hitches.length ? hitches.map(h => {
                        const label = typeof h === 'string' ? h : (h?.name || `${h?.facet || 'Hitch'} (${h?.tier || `Bane ${h?.bane ?? '?'}`})`);
                        return SafeDOM.el('button', {
                            type: 'button',
                            class: 'widget-chip hitch-chip',
                            onclick: () => {
                                if (h && typeof h === 'object') {
                                    if (h.facet) this._runnerState.facet = h.facet;
                                    if (h.bane) this._runnerState.bane = Number(h.bane);
                                    this.render();
                                }
                            }
                        }, SafeDOM.escape(label));
                    }) : [SafeDOM.el('span', { style: 'color: #94a3b8; font-size: 0.875rem;' }, 'No active hitches.')]
                )
            ])
        );

        const container = SafeDOM.el('div', { class: 'sheet-container' }, sections);
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(container);

        const annexContainer = this.shadowRoot.querySelectorAll('t13-annex');
        annexes.forEach((a, i) => { if (annexContainer[i]) annexContainer[i].setAnnex(a); });

        const profContainer = this.shadowRoot.querySelectorAll('t13-proficiency');
        proficiencies.forEach((p, i) => { if (profContainer[i]) profContainer[i].setProficiency([p.name, p.facet, '']); });

        this._mountAvatarPreview(previewBox);
    }

    async _mountAvatarPreview(previewBox) {
        if (!this.characterData || typeof window === 'undefined') return;
        const runId = ++this._previewRunId;
        try {
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0f172a);
            scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 1.8));
            const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
            dirLight.position.set(1.5, 2.5, 3.0);
            scene.add(dirLight);

            const { avatar } = await buildCharacterSheetAvatar(this.characterData, { scene });
            if (runId !== this._previewRunId) {
                avatar.traverse(o => o.geometry?.dispose());
                return;
            }
            this._previewAvatar = avatar;

            const box = new THREE.Box3().setFromObject(avatar);
            const size = box.getSize(new THREE.Vector3());
            const upperCenterY = box.min.y + size.y * 0.68;
            const camera = new THREE.PerspectiveCamera(30, 140 / 180, 0.05, 50);
            camera.position.set(0, upperCenterY, Math.max(size.y * 1.15, 0.8));
            camera.lookAt(0, upperCenterY - size.y * 0.04, 0);

            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(140, 180, false);
            renderer.render(scene, camera);
            this._previewRenderer = renderer;
            previewBox.innerHTML = '';
            previewBox.appendChild(renderer.domElement);
        } catch (error) {
            if (runId === this._previewRunId) {
                previewBox.textContent = '3D preview unavailable';
            }
        }
    }

    async openAvatarMaker() {
        try {
            const character = this.characterData;
            const [{ AvatarModelMaker }, { CharacterSkinStore }, { default: CodexDB }] = await Promise.all([
                import('../../../src/t13ne/procgen/avatar/AvatarModelMaker.js'),
                import('../../../src/t13ne/procgen/avatar/CharacterSkinStore.js'),
                import('../../../src/t13ne/modules/codex/CodexDB.js')
            ]);
            const store = new CharacterSkinStore(CodexDB);
            const id = character.id;
            const saved = id == null ? null : await store.load(id);
            let revision = saved?.revision ?? 0;
            const onSave = id == null ? null : async document => {
                revision = await store.save(id, document, revision);
                const box = this.shadowRoot?.querySelector('.avatar-preview-box');
                if (box) {
                    this._disposePreview();
                    this._mountAvatarPreview(box);
                }
            };
            new AvatarModelMaker({ character, skinDocument: saved?.document ?? null, onSave }).open();
        } catch (error) {
            console.error('Unable to open avatar model maker:', error);
            window.alert(`Unable to open avatar model maker: ${error.message}`);
        }
    }

    async openDescendantMaker(descendant) {
        try {
            const [{ AvatarModelMaker }, { CharacterSkinStore }, { default: CodexDB }] = await Promise.all([
                import('../../../src/t13ne/procgen/avatar/AvatarModelMaker.js'),
                import('../../../src/t13ne/procgen/avatar/CharacterSkinStore.js'),
                import('../../../src/t13ne/modules/codex/CodexDB.js')
            ]);
            const store = new CharacterSkinStore(CodexDB);
            const id = descendant?.id;
            const saved = id == null ? null : await store.load(id);
            let revision = saved?.revision ?? 0;
            const onSave = id == null ? null : async document => {
                revision = await store.save(id, document, revision);
            };
            new AvatarModelMaker({ character: descendant, skinDocument: saved?.document ?? null, onSave }).open();
        } catch (error) {
            console.error('Unable to open descendant model maker:', error);
            window.alert(`Unable to open descendant model maker: ${error.message}`);
        }
    }

    async performSelectedTest() {
        if (!this.characterData) return null;
        const r = this._runnerState;
        const extraDice = Array.from({ length: Math.max(0, r.extraDiceCount || 0) }, () => '1d6');
        const strainDice = Array.from({ length: Math.max(0, r.strainDiceCount || 0) }, () => '1d6');
        const res = await this._sendSessionCommand('Test:Perform', {
            characterId: this.characterData.id,
            testType: r.testType || 'dice',
            options: {
                facet: r.facet || 'Awe',
                difficulty: Number(r.difficulty ?? 0),
                extraDice,
                strainDice,
                chiSpend: Number(r.chiSpend ?? 0),
                stressGain: Number(r.stressGain ?? 0)
            }
        });
        if (res && typeof res === 'object') {
            this._runnerState.lastOutcome = res;
            this.render();
        }
        return res;
    }

    async evaluateSelectedHitch() {
        if (!this.characterData) return null;
        const r = this._runnerState;
        const res = await this._sendSessionCommand('Hitch:Evaluate', {
            characterId: this.characterData.id,
            facet: r.facet || 'Awe',
            bane: Number(r.bane ?? 4),
            triggered: true
        });
        if (res && typeof res === 'object') {
            this._runnerState.lastOutcome = res;
            this.render();
        }
        return res;
    }

    async _adjustSway(currency, delta) {
        if (!this.characterData) return null;
        return this._sendSessionCommand('Sway:Adjust', {
            characterId: this.characterData.id,
            currency,
            delta
        });
    }

    async _relieveStress(facet, amount = 1) {
        if (!this.characterData) return null;
        return this._sendSessionCommand('Drama:RelieveStress', {
            characterId: this.characterData.id,
            facet,
            amount,
            dramaType: 'Atmospheric'
        });
    }

    async _updateWoundState(woundId, patch) {
        if (!this.characterData) return null;
        return this._sendSessionCommand('Wound:UpdateState', {
            characterId: this.characterData.id,
            woundId,
            ...patch
        });
    }

    async spawnCharacterTokenOnVTT() {
        if (!this.characterData) return null;
        const char = this.characterData;
        const displayName = Array.isArray(char.name) ? char.name[0] : (char.name || char.id);
        const speciesId = char.speciesDescendantId ?? (typeof char.species === 'object' ? char.species.id || char.species.name : (char.species || 'Human'));
        return this._sendSessionCommand('VTT:SpawnToken', {
            id: `token-${char.id}`,
            name: displayName,
            tokenType: 'character',
            characterId: char.id,
            ownerActorId: char.ownerActorId ?? null,
            speciesId,
            incarna: char.incarna || 'Nature',
            position: { x: 0, y: 0, z: 0 }
        });
    }

    async spawnDescendantOnVTT(descendant, idx = 0) {
        if (!this.characterData || !descendant) return null;
        const dName = Array.isArray(descendant.name) ? descendant.name[0] : (descendant.name || 'Prop');
        const { formation } = resolveFormation(descendant, null);
        return this._sendSessionCommand('VTT:SpawnToken', {
            id: `prop-${this.characterData.id}-${descendant.id || idx}`,
            name: dName,
            tokenType: 'prop',
            descendantId: descendant.id ?? null,
            ownerActorId: this.characterData.ownerActorId ?? null,
            incarna: formation,
            position: { x: 1 + idx, y: 0, z: 1 }
        });
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('t13-character-sheet')) {
    customElements.define('t13-character-sheet', T13CharacterSheet);
}
