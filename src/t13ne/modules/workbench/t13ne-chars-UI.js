import T13NE from '@/src/t13ne/T13NE.js';
import UI from './t13ne-UI.js';
import FacetWebUI from './t13ne-facetweb-UI.js';
import GeometryUI from './t13ne-geometry-ui.js';

/**
 * T13NE Character UI Module
 * Oversees character rendering and allows sub-type registration.
 */
class CharacterUI {
    constructor() {
        this.subTypes = new Map();
    }

    /**
     * Registers a UI handler for a character sub-type.
     * @param {string} modelName - 'Extra', 'Lite', 'Archetype', 'Full', 'Detailed'
     * @param {object} handler - { renderInspector, renderForm }
     */
    registerSubType(modelName, handler) {
        this.subTypes.set(modelName.toLowerCase(), handler);
    }

    /**
     * Renders character-specific inspector fields.
     */
    renderInspector(char, container) {
        const model = (char.model || char.charType || 'Extra').toLowerCase();
        const handler = this.subTypes.get(model);

        let html = `
            <div class="form-group">
                <label>Model</label>
                <span class="status-badge" style="background: var(--accent-green)22; color: var(--accent-green)">${char.model || char.charType}</span>
            </div>
            <div class="form-group">
                <label>Age Category</label>
                <div style="font-size: 0.85rem;">${char.ageCategory || 'Adult'}</div>
            </div>
            <div class="form-group">
                <label>Type & Tier</label>
                <div style="font-size: 0.85rem;">${char.experienceTier || 'Fresh'} ${char.charType || 'Grunt'}</div>
            </div>
            <div class="form-group">
                <label>Incarna</label>
                <div style="font-size: 0.85rem;">${char.incarna || 'Nature (Flesh)'}</div>
            </div>
        `;

        if (handler && handler.renderInspector) {
            html += handler.renderInspector(char);
        } else {
            // Default Detailed/Fallback view
            if (char.archetypeStats) {
                html += `
                    <div class="form-group" style="background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 0.4rem;">
                        <label>Archetype Stats</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.8rem;">
                            ${Object.entries(char.archetypeStats).map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`).join('')}
                        </div>
                    </div>
                `;
            }
        }

        container.innerHTML += html;
    }

    /**
     * Renders character-specific form fields for creation/edit.
     */
    renderForm(char) {
        let html = `
            <div class="form-group">
                <label>Model</label>
                <select id="m-model">
                    <option value="Detailed" ${char?.model === 'Detailed' ? 'selected' : ''}>Detailed (Standard PC/NPC)</option>
                    <option value="Archetype" ${char?.model === 'Archetype' ? 'selected' : ''}>Archetype (Grouped Stats)</option>
                    <option value="Lite" ${char?.model === 'Lite' ? 'selected' : ''}>Lite (Boon/Hitch focused)</option>
                    <option value="Full" ${char?.model === 'Full' ? 'selected' : ''}>Full (Multi-Alternate)</option>
                    <option value="Extra" ${char?.model === 'Extra' || !char ? 'selected' : ''}>Extra (Vex/Chorus/Cast/FON)</option>
                </select>
            </div>
            
            <div id="detailed-fields" style="display: ${char?.model === 'Extra' ? 'none' : 'block'}">
            <div class="form-group">
                <label>Character Type</label>
                <select id="m-char-type">
                    <option value="Grunt" ${char?.charType === 'Grunt' ? 'selected' : ''}>Grunt</option>
                    <option value="Hero" ${char?.charType === 'Hero' ? 'selected' : ''}>Hero</option>
                    <option value="Yarn-Teller" ${char?.charType === 'Yarn-Teller' ? 'selected' : ''}>Yarn-Teller</option>
                    <option value="Monster" ${char?.charType === 'Monster' ? 'selected' : ''}>Monster</option>
                </select>
            </div>
            <div class="form-group">
                <label>Experience Tier</label>
                <select id="m-exp-tier">
                    <option value="Fresh" ${char?.experienceTier === 'Fresh' ? 'selected' : ''}>Fresh</option>
                    <option value="Seasoned" ${char?.experienceTier === 'Seasoned' ? 'selected' : ''}>Seasoned</option>
                    <option value="Veteran" ${char?.experienceTier === 'Veteran' ? 'selected' : ''}>Veteran</option>
                    <option value="Master" ${char?.experienceTier === 'Master' ? 'selected' : ''}>Master</option>
                    <option value="Legend" ${char?.experienceTier === 'Legend' ? 'selected' : ''}>Legend</option>
                </select>
            </div>
            <div class="form-group">
                <label>Persona</label>
                <input type="text" id="m-persona" value="${char?.personaDetails?.Name || ''}" placeholder="e.g. Leader">
            </div>
            <div class="form-group">
                <label>Core</label>
                <input type="text" id="m-core" value="${char?.personalityAnnex?.cores?.[0] || ''}" placeholder="e.g. Warrior">
            </div>
            <div class="form-group">
                <label>I-Ching (Hexagrams)</label>
                <div style="display: flex; gap: 10px;">
                    <input type="number" id="m-iching-1" value="${char?.iching?.[0] || 0}" placeholder="1-64" style="width: 60px;">
                    <input type="number" id="m-iching-2" value="${char?.iching?.[1] || 0}" placeholder="1-64" style="width: 60px;">
                </div>
            </div>
            </div>

            <div class="form-group">
                <label>Incarna (Formation Facet)</label>
                <select id="m-incarna">
                    <option value="">Select Incarna...</option>
                    ${this._renderIncarnaOptions(char?.incarna)}
                </select>
            </div>
            <div class="form-group">
                <label>Age category</label>
                <select id="m-age">
                    <option value="New-born" ${char?.ageCategory === 'New-born' ? 'selected' : ''}>New-born</option>
                    <option value="Infant" ${char?.ageCategory === 'Infant' ? 'selected' : ''}>Infant</option>
                    <option value="Kid" ${char?.ageCategory === 'Kid' ? 'selected' : ''}>Kid</option>
                    <option value="Young-Adult" ${char?.ageCategory === 'Young-Adult' ? 'selected' : ''}>Young-Adult</option>
                    <option value="Adult" ${char?.ageCategory === 'Adult' || !char ? 'selected' : ''}>Adult</option>
                    <option value="Aged" ${char?.ageCategory === 'Aged' ? 'selected' : ''}>Aged</option>
                </select>
            </div>
        `;

        const model = (char?.model || 'Extra').toLowerCase();
        const handler = this.subTypes.get(model);
        if (handler && handler.renderForm) {
            html += handler.renderForm(char);
        }

        return html;
    }

    _renderIncarnaOptions(selected) {
        let html = '';
        for (let i = 0; i < 24; i++) {
            const name = FacetWebUI.getFacetName(i);
            html += `<option value="${name}" ${selected === name ? 'selected' : ''}>${name}</option>`;
        }
        return html;
    }

    getWizardConfig() {
        return {
            steps: [
                {
                    title: 'Identity',
                    render: (data) => `
                        <div class="form-group">
                            <label>Common Name</label>
                            <input type="text" id="m-name" value="${data.Name || data.name || ''}" placeholder="Name">
                        </div>
                        <div class="form-group">
                            <label>Full / Formal Name</label>
                            <input type="text" id="m-full" value="${data.fullName || ''}" placeholder="Formal Name">
                        </div>
                        <div class="form-group">
                            <label>Aliases</label>
                            <input type="text" id="m-aliases" value="${data.altName || ''}" placeholder="Aliases">
                        </div>
                        <div id="geometry-display"></div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="m-desc" style="min-height: 100px;">${data.Description || data.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Model</label>
                            <select id="m-model">
                                <option value="Detailed" ${data.model === 'Detailed' ? 'selected' : ''}>Detailed</option>
                                <option value="Extra" ${data.model === 'Extra' || !data.model ? 'selected' : ''}>Extra</option>
                            </select>
                        </div>
                    `,
                    onRender: (dom, data) => {
                        const nameInput = dom.querySelector('#m-name');
                        const fullInput = dom.querySelector('#m-full');
                        const aliasesInput = dom.querySelector('#m-aliases');

                        const updateGeo = () => {
                            const T13Geometry = T13NE.getModule('T13Geometry');
                            const display = dom.querySelector('#geometry-display');

                            const nameData = [
                                nameInput.value || '',
                                fullInput.value || '',
                                aliasesInput.value || ''
                            ];

                            if (display && (nameInput.value || fullInput.value || aliasesInput.value)) {
                                display.innerHTML = GeometryUI ? GeometryUI.render(nameData) : '';
                                // Store geometry data for saving
                                if (T13Geometry) data.geometry = T13Geometry.calculateFullGeo(nameData);
                            }
                        };
                        nameInput.addEventListener('input', updateGeo);
                        fullInput.addEventListener('input', updateGeo);
                        aliasesInput.addEventListener('input', updateGeo);
                        updateGeo();
                    },
                    onSave: (dom, data) => {
                        data.name = dom.querySelector('#m-name').value;
                        data.fullName = dom.querySelector('#m-full').value;
                        data.altName = dom.querySelector('#m-aliases').value;
                        data.description = dom.querySelector('#m-desc').value;
                        data.model = dom.querySelector('#m-model').value;
                    }
                },
                {
                    title: 'Facet Web',
                    render: (data) => {
                        let stats = data.stats || data.facetweb?.Stats || data.Stats;
                        if (!stats) {
                            // Try to inherit from Game Tapestry first
                            const GameModule = T13NE.getModule('Game');
                            const activeGame = GameModule ? GameModule.getActiveGame() : null;
                            if (activeGame && activeGame.tapestries && activeGame.tapestries.length > 0) {
                                const baseTap = GameModule.getEntity(activeGame.tapestries[0]);
                                if (baseTap && baseTap.Stats) {
                                    stats = JSON.parse(JSON.stringify(baseTap.Stats));
                                }
                            }
                            if (!stats) {
                                const Tapestry = T13NE.getModule('Tapestry');
                                stats = JSON.parse(JSON.stringify(Tapestry.defaultStatblock.Stats));
                            }
                        }
                        let scale = data.scale !== undefined ? data.scale : (data.facetweb?.Scale || data.Scale || 0);
                        return `
                            <div class="form-group">
                                <label>Scale</label>
                                <input type="number" id="m-scale" value="${scale}">
                            </div>
                            <div class="form-group">
                                <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem;">
                                    <label>Facets</label>
                                    <div>
                                        <button class="btn" onclick="Workbench.randomizeFacets('boons')">Rand Boons</button>
                                        <button class="btn" onclick="Workbench.standardizeFacets()">Reset</button>
                                    </div>
                                </div>
                                <div id="m-facet-grid">${FacetWebUI.renderGrid(stats)}</div>
                            </div>
                            <div class="form-group" style="margin-top: 1rem; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 4px; text-align: center;">
                                <label>I-Ching (Calculated)</label>
                                <div id="m-iching-display" style="font-size: 1.2rem; color: var(--accent-green);">-- / --</div>
                            </div>
                        `;
                    },
                    onSave: (dom, data) => {
                        data.scale = parseInt(dom.querySelector('#m-scale').value);
                        // Note: readGridData is currently in Inspector, needs to be accessible or moved to FacetWebUI
                        // For now, assuming Inspector's readGridData is available or we move it.
                        // Actually, FacetWebUI should probably have a readGrid method.
                        // Let's assume Workbench.inspector.readGridData() is available or we implement it here.
                        // Since we can't easily access Inspector instance here without passing it, 
                        // we might need to rely on DOM parsing similar to Inspector.
                        const grid = dom.querySelector('#m-facet-grid');
                        if (grid) {
                            const rows = Array.from(grid.querySelectorAll('.facet-pair-row'));
                            data.stats = rows.map(row => {
                                const yangItem = row.querySelector('.facet-item[data-side="facet"]');
                                const yinItem = row.querySelector('.facet-item[data-side="antifacet"]');
                                const yangInput = yangItem.querySelector('input');
                                const yinInput = yinItem.querySelector('input');
                                return {
                                    Facet: parseInt(yangItem.dataset.id),
                                    Facet_Boon: parseInt(yangInput.value) || 0,
                                    Facet_Sway: 0,
                                    Facet_Mutation_Matrix: 0,
                                    Joined: row.dataset.joined === 'true',
                                    Antifacet_Mutation_Matrix: 0,
                                    Antifacet: parseInt(yinItem.dataset.id),
                                    Antifacet_Boon: parseInt(yinInput.value) || 0,
                                    AntiFacet_Sway: 0
                                };
                            });

                            // Calculate and save I-Ching here
                            const IChing = T13NE.getModule('IChing');
                            if (IChing) {
                                data.iching = IChing.calculateIChing({ Stats: data.stats });
                                const display = dom.querySelector('#m-iching-display');
                                if (display) {
                                    display.textContent = `${data.iching[0]} / ${data.iching[1]}`;
                                }
                            }
                        }
                    }
                },
                {
                    title: 'Personality',
                    render: (data) => {
                        return `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; height: 400px;">
                            <div class="source-facets" style="overflow-y: auto; border-right: 1px solid var(--glass-border); padding-right: 0.5rem;">
                                <h5 style="margin-bottom: 0.5rem; color: var(--text-dim);">Available Facets</h5>
                                <div id="p-facet-list" style="display: flex; flex-direction: column; gap: 0.25rem;"></div>
                            </div>
                            <div class="target-slots" style="overflow-y: auto; display: flex; flex-direction: column; gap: 1rem;">
                                <div>
                                    <h5 style="margin-bottom: 0.5rem; color: var(--accent-blue);">Personas (Root)</h5>
                                    <div id="drop-personas" class="drop-zone multi-slot" data-slot="personas" style="min-height: 50px; border: 1px dashed #666; padding: 0.5rem; border-radius: 4px;"></div>
                                </div>
                                <div>
                                    <h5 style="margin-bottom: 0.5rem; color: var(--accent-purple);">Cores (Channel)</h5>
                                    <div id="drop-cores" class="drop-zone multi-slot" data-slot="cores" style="min-height: 50px; border: 1px dashed #666; padding: 0.5rem; border-radius: 4px;"></div>
                                </div>
                                <div>
                                    <h5 style="margin-bottom: 0.5rem; color: var(--danger);">Hitches</h5>
                                    <div id="drop-hitches" class="drop-zone multi-slot" data-slot="hitches" style="min-height: 50px; border: 1px dashed #666; padding: 0.5rem; border-radius: 4px;"></div>
                                </div>
                                <div style="margin-top: auto; padding: 0.5rem; background: rgba(0,0,0,0.3); border-radius: 4px;">
                                    <strong>Annex Boon: </strong> <span id="p-annex-boon" style="color: var(--accent-green);">0</span>
                                </div>
                            </div>
                        </div>
                        `;
                    },
                    onRender: async (dom, data) => {
                        const stats = data.stats || [];
                        const Facets = T13NE.getModule('Facets');

                        // Sort by Boon value descending
                        const sortedStats = [...stats].sort((a, b) => {
                            const boonA = Math.max(a.Facet_Boon, a.Antifacet_Boon);
                            const boonB = Math.max(b.Facet_Boon, b.Antifacet_Boon);
                            return boonB - boonA;
                        });

                        const list = dom.querySelector('#p-facet-list');

                        // Helper to create draggable item
                        const createDraggable = (facetId, boon) => {
                            const fName = FacetWebUI.getFacetName(facetId);
                            const div = document.createElement('div');
                            div.className = 'facet-chip';
                            div.draggable = true;
                            div.style.cssText = 'padding: 4px 8px; background: #333; border-radius: 4px; cursor: grab; font-size: 0.8rem; display: flex; justify-content: space-between; margin-bottom: 2px;';
                            div.innerHTML = `<span>${fName}</span> <span style="color: var(--accent-blue)">${boon}</span>`;

                            div.ondragstart = (e) => {
                                e.dataTransfer.setData('text/plain', JSON.stringify({ facetId, boon, name: fName }));
                            };
                            return div;
                        };

                        // Populate Source List
                        for (const s of sortedStats) {
                            list.appendChild(createDraggable(s.Facet, s.Facet_Boon));
                            list.appendChild(createDraggable(s.Antifacet, s.Antifacet_Boon));
                        }

                        // Initialize data structure if missing
                        if (!data.personalityAnnex) data.personalityAnnex = { personas: [], cores: [], hitches: [] };

                        // Setup Drop Zones
                        const setupZone = (id, listName) => {
                            const zone = dom.querySelector(id);
                            const currentItems = data.personalityAnnex[listName] || [];

                            const renderItems = async () => {
                                zone.innerHTML = '';
                                for (const item of currentItems) {
                                    let displayName = item;
                                    if (Facets) {
                                        const facetData = await Facets.getFacet(item);
                                        if (facetData) {
                                            if (listName === 'personas' && facetData.Persona) displayName = `${facetData.FacetName}: ${facetData.Persona.Name}`;
                                            else if (listName === 'cores' && facetData.Core) displayName = `${facetData.FacetName}: ${facetData.Core}`;
                                            else if (listName === 'hitches' && facetData.Hitch) displayName = `${facetData.FacetName}: ${facetData.Hitch}`;
                                        }
                                    }

                                    const el = document.createElement('div');
                                    el.style.cssText = 'background: var(--accent-purple); padding: 4px 8px; margin: 2px; border-radius: 3px; font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center;';
                                    el.innerHTML = `<span>${displayName}</span> <span class="remove" style="cursor:pointer; margin-left:5px; font-weight:bold;">&times;</span>`;
                                    el.querySelector('.remove').onclick = () => {
                                        const idx = currentItems.indexOf(item);
                                        if (idx > -1) currentItems.splice(idx, 1);
                                        renderItems();
                                        updateBoon();
                                    };
                                    zone.appendChild(el);
                                }
                            };

                            renderItems();

                            zone.ondragover = (e) => { e.preventDefault(); zone.style.borderColor = 'var(--accent-blue)'; zone.style.background = 'rgba(255,255,255,0.05)'; };
                            zone.ondragleave = (e) => { zone.style.borderColor = '#666'; zone.style.background = 'transparent'; };
                            zone.ondrop = (e) => {
                                e.preventDefault();
                                zone.style.borderColor = '#666';
                                zone.style.background = 'transparent';
                                const dropped = JSON.parse(e.dataTransfer.getData('text/plain'));
                                if (dropped && dropped.name) {
                                    currentItems.push(dropped.name);
                                    renderItems();
                                    updateBoon();
                                }
                            };
                        };

                        setupZone('#drop-personas', 'personas');
                        setupZone('#drop-cores', 'cores');
                        setupZone('#drop-hitches', 'hitches');

                        const updateBoon = async () => {
                            let sumBoons = 0;
                            const getBoonVal = async (facetName) => {
                                if (!Facets) return 0;
                                const facet = await Facets.getFacet(facetName);
                                if (!facet) return 0;
                                const stat = stats.find(s => s.Facet === facet.FacetIndex || s.Antifacet === facet.FacetIndex);
                                if (!stat) return 13;
                                return stat.Facet === facet.FacetIndex ? stat.Facet_Boon : stat.Antifacet_Boon;
                            };

                            for (const p of data.personalityAnnex.personas) sumBoons += await getBoonVal(p);
                            for (const c of data.personalityAnnex.cores) sumBoons += await getBoonVal(c);

                            // Approximate Annex Boon (Intrepid: Sum / 2)
                            dom.querySelector('#p-annex-boon').textContent = Math.floor(sumBoons / 2);
                        };
                        updateBoon();
                    },
                    onSave: (dom, data) => {
                        // Sync primary persona for legacy/display
                        if (data.personalityAnnex.personas.length > 0) {
                            if (!data.personaDetails) data.personaDetails = {};
                            data.personaDetails.Name = data.personalityAnnex.personas[0];
                        }
                    }
                },
                {
                    title: 'Details',
                    render: (data) => `
                        <div class="form-group">
                            <label>Character Type</label>
                            <select id="m-char-type">
                                <option value="Grunt" ${data.charType === 'Grunt' ? 'selected' : ''}>Grunt</option>
                                <option value="Hero" ${data.charType === 'Hero' ? 'selected' : ''}>Hero</option>
                                <option value="Yarn-Teller" ${data.charType === 'Yarn-Teller' ? 'selected' : ''}>Yarn-Teller</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Experience Tier</label>
                            <select id="m-exp-tier">
                                <option value="Fresh" ${data.experienceTier === 'Fresh' ? 'selected' : ''}>Fresh</option>
                                <option value="Experienced" ${data.experienceTier === 'Experienced' ? 'selected' : ''}>Experienced</option>
                                <option value="Veteran" ${data.experienceTier === 'Veteran' ? 'selected' : ''}>Veteran</option>
                                <option value="Maxed" ${data.experienceTier === 'Maxed' ? 'selected' : ''}>Maxed</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Incarna</label>
                            <select id="m-incarna">
                                <option value="">Select Incarna...</option>
                                ${this._renderIncarnaOptions(data.incarna)}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Age Category</label>
                            <select id="m-age">
                                <option value="Adult" ${data.ageCategory === 'Adult' ? 'selected' : ''}>Adult</option>
                                <option value="Kid" ${data.ageCategory === 'Kid' ? 'selected' : ''}>Kid</option>
                                <option value="Young-Adult" ${data.ageCategory === 'Young-Adult' ? 'selected' : ''}>Young-Adult</option>
                                <option value="Aged" ${data.ageCategory === 'Aged' ? 'selected' : ''}>Aged</option>
                            </select>
                        </div>
                    `,
                    onSave: (dom, data) => {
                        data.charType = dom.querySelector('#m-char-type').value;
                        data.experienceTier = dom.querySelector('#m-exp-tier').value;
                        data.incarna = dom.querySelector('#m-incarna').value;
                        data.ageCategory = dom.querySelector('#m-age').value;
                    }
                }
            ]
        };
    }
}

const characterUI = new CharacterUI();

// Register Default Sub-types
characterUI.registerSubType('lite', {
    renderInspector: (char) => `
        <div class="form-group">
            <label>Sway</label>
            <div style="font-size: 0.8rem;">Yin: ${char.yinSway}/${char.maxYin} | Yang: ${char.yangSway}/${char.maxYang}</div>
        </div>
    `,
    renderForm: (char) => `
        <div class="form-group">
            <label>Max Yin (Lite Only)</label>
            <input type="number" id="m-max-yin" value="${char?.maxYin || 13}">
        </div>
    `
});

characterUI.registerSubType('archetype', {
    renderInspector: (char) => `
        <div class="form-group" style="background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 0.4rem;">
            <label>Archetype Stats</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.8rem;">
                ${Object.entries(char.archetypeStats || {}).map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`).join('')}
            </div>
        </div>
    `
});

window.CharacterUI = characterUI;
export default characterUI;





