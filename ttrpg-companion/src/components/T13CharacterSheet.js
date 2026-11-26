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
        this._previewRenderer = null;
        this._previewAvatar = null;
        this._previewRunId = 0;
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {
        this._disposePreview();
    }

    setCharacter(data) {
        this.characterData = data;
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
            .widget-chip { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 4px 12px; border-radius: 16px; font-size: 0.875rem; font-weight: 500; color: #475569; }
            .hitch-chip { background: #fef2f2; border: 1px solid #fee2e2; color: #dc2626; }
            .descendant-row { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; }
        `);

        const previewBox = SafeDOM.el('div', { class: 'avatar-preview-box' }, 'Loading avatar...');
        const metaChildren = [
            SafeDOM.el('div', { class: 'hexagram' }, [
                SafeDOM.el('span', { style: 'font-size: 1.2rem;' }, '☯'),
                SafeDOM.el('span', {}, `Hexagram #${hexagram?.number}: ${hexagram?.name}`)
            ]),
            ...(significator ? [SafeDOM.el('div', { class: 'significator' }, [
                SafeDOM.el('span', { style: 'font-size: 1.2rem;' }, '🃟'),
                SafeDOM.el('span', {}, `Significator: ${significator.name}`)
            ])] : [])
        ];

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
                        SafeDOM.el('button', { class: 'avatar-btn', type: 'button', onclick: () => this.openAvatarMaker() }, 'Open avatar model maker')
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

        sections.push(
            SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Facet Boons'),
                SafeDOM.el('div', { class: 'boon-grid' }, Object.entries(boons || {}).map(([label, val]) =>
                    SafeDOM.el('div', { class: 'boon-item' }, [
                        SafeDOM.el('span', { class: 'boon-label' }, label),
                        SafeDOM.el('span', { class: 'boon-value' }, String(val))
                    ])
                ))
            ]),
            SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Descendants & Gear'),
                SafeDOM.el('div', { class: 'list-container' },
                    descendants.length
                        ? descendants.map(d => {
                            const dName = Array.isArray(d.name) ? d.name[0] : (d.name || 'Unnamed Descendant');
                            const { formation, material } = resolveFormation(d, null);
                            return SafeDOM.el('div', { class: 'descendant-row' }, [
                                SafeDOM.el('span', { style: 'font-size: 0.875rem; font-weight: 600;' }, `${dName} (${d.descendantType || 'Item'} • ${formation} / ${material})`),
                                SafeDOM.el('button', { class: 'avatar-btn', type: 'button', onclick: () => this.openDescendantMaker(d) }, 'Inspect Model')
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
                    proficiencies.length ? proficiencies.map(() => SafeDOM.el('t13-proficiency')) : [SafeDOM.el('span', { style: 'color: #94a3b8; font-size: 0.875rem;' }, 'No base proficiencies.')]
                )
            ]),
            SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Hitches & Complications'),
                SafeDOM.el('div', { class: 'widget-list' },
                    hitches.length ? hitches.map(h => SafeDOM.el('div', { class: 'widget-chip hitch-chip' }, SafeDOM.escape(typeof h === 'string' ? h : (h?.name || 'Hitch')))) : [SafeDOM.el('span', { style: 'color: #94a3b8; font-size: 0.875rem;' }, 'No active hitches.')]
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
}

if (typeof customElements !== 'undefined' && !customElements.get('t13-character-sheet')) {
    customElements.define('t13-character-sheet', T13CharacterSheet);
}
