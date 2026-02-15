import T13NE from '@plugins/t13ne/T13NE.js';
import Logger from '/src/t13ne/core/Logger.js';
import UI from './t13ne-UI.js';
import { TIE } from '@plugins/t13ne/modules/t13ne-knots.js';

/**
 * T13NE Knots UI Module
 * Provides an Annex Builder interface.
 */
class KnotsUI {
    constructor() {
        this.character = null;
        this.workbench = {
            root: null,
            channel: null,
            umbrals: [],
            nimbeds: []
        };
        this.profCache = new Map();
    }

    refresh() {
        const Referee = T13NE.getModule('Referee');
        const characters = Referee?.getCharacters() || [];
        const grid = document.getElementById('knots-grid');
        if (!grid) return;

        if (!this.character || !characters.find(c => c.id === this.character.id)) {
            this.character = characters[0] || null;
        }

        grid.innerHTML = '';
        grid.innerHTML = `
            <div class="knots-header" style="margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem;">
                <label for="character-select-knots">Editing Annexes for:</label>
                <select id="character-select-knots" class="input-control">
                    ${characters.map(c => `<option value="${c.id}" ${this.character?.id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
            </div>
            <div id="annex-builder-container"></div>
        `;

        const select = document.getElementById('character-select-knots');
        select.onchange = () => {
            const charId = select.value;
            this.character = Referee.getCharacter(charId);
            this.workbench = {
                root: null,
                channel: null,
                umbrals: [],
                nimbeds: []
            };
            this.renderAnnexBuilder();
        };

        if (this.character) {
            this.renderAnnexBuilder();
        } else {
            document.getElementById('annex-builder-container').innerHTML = '<p class="text-dim">No characters available to edit.</p>';
        }
    }

    renderAnnexBuilder() {
        const container = document.getElementById('annex-builder-container');
        if (!this.character) {
            container.innerHTML = '<p class="text-dim">Select a character to begin building Annexes.</p>';
            return;
        }

        container.innerHTML = `
            <div class="annex-builder-layout">
                <div id="proficiency-sources" class="pane">
                    <h3>Available Proficiencies</h3>
                    <div id="suggested-profs" class="prof-source-list"><h4>Suggested</h4></div>
                    <div id="library-profs" class="prof-source-list"><h4>Library (Recent)</h4></div>
                </div>
                <div id="annex-workbench" class="pane">
                    <h3>Annex Workbench</h3>
                    <div class="workbench-grid">
                        <div class="wb-section">
                            <label>Root (Concept)</label>
                            <div id="drop-root" class="drop-zone single-slot" data-slot="root"></div>
                        </div>
                        <div class="wb-section">
                            <label>Channel (Action)</label>
                            <div id="drop-channel" class="drop-zone single-slot" data-slot="channel"></div>
                        </div>
                        <div class="wb-section full-width">
                            <label>Umbrals (Costs/Limits)</label>
                            <div id="drop-umbrals" class="drop-zone multi-slot" data-slot="umbrals"></div>
                        </div>
                        <div class="wb-section full-width">
                            <label>Nimbeds (Benefits/Glows)</label>
                            <div id="drop-nimbeds" class="drop-zone multi-slot" data-slot="nimbeds"></div>
                        </div>
                    </div>
                    <div id="annex-preview" class="info-box" style="margin: 1rem 0; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 4px;">
                        <em>Drag proficiencies to see Annex details...</em>
                    </div>
                    <div class="workbench-controls">
                        <input type="text" id="annex-name-input" class="input-control" placeholder="New Annex Name">
                        <textarea id="annex-desc-input" class="input-control" placeholder="Description..."></textarea>
                        <button id="create-annex-btn" class="btn btn-primary">Create Annex</button>
                    </div>
                </div>
                <div id="character-annexes" class="pane">
                    <h3>${this.character.name}'s Annexes</h3>
                    <div id="character-annexes-list"></div>
                </div>
            </div>
        `;

        this.populateSources();
        this.renderWorkbench();
        this.updatePreview();
        this.renderCharacterAnnexes();
        this.attachBuilderEventListeners();
    }

    async populateSources() {
        const suggestedContainer = document.getElementById('suggested-profs');
        const libraryContainer = document.getElementById('library-profs');
        const Threads = T13NE.getModule('Threads');

        // Render suggested proficiencies
        const suggestions = this.character.annexSuggestions || [];
        if (suggestions.length > 0) {
            for (const suggestion of suggestions) {
                for (const profIdentifier of suggestion.proficiencies) {
                    const prof = await Threads.getProficiency(profIdentifier);
                    if (prof) this.profCache.set(prof.id, prof);
                    if (prof) suggestedContainer.appendChild(this.createProficiencyDraggable(prof));
                }
            }
        }

        // Render some profs from the library
        const manifest = await T13NE.getModule('Codex')._getOrBuildProficiencyManifest();
        const recentProfIds = Object.keys(manifest.paths).slice(-20).reverse();
        for (const id of recentProfIds) {
            const prof = await Threads.getProficiency(id);
            if (prof) this.profCache.set(prof.id, prof);
            if (prof) libraryContainer.appendChild(this.createProficiencyDraggable(prof));
        }
    }

    createProficiencyDraggable(prof) {
        const div = document.createElement('div');
        div.className = 'draggable-prof';
        div.setAttribute('draggable', true);
        div.dataset.profId = prof.id;
        div.innerHTML = `<strong>${prof.name}</strong><p>${prof.description.substring(0, 50)}...</p>`;
        div.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', prof.id);
            e.target.classList.add('dragging');
        };
        div.ondragend = (e) => e.target.classList.remove('dragging');
        return div;
    }

    renderWorkbench() {
        const renderItem = (profId, slot, index = null) => {
            const prof = this.profCache.get(profId) || { name: profId };
            const idxArg = index !== null ? `, ${index}` : '';
            return `
                <div class="workbench-prof-item">
                    <span>${prof.name}</span>
                    <button onclick="KnotsUI.removeFromWorkbench('${slot}'${idxArg})">&times;</button>
                </div>`;
        };

        const rootZone = document.getElementById('drop-root');
        rootZone.innerHTML = this.workbench.root ? renderItem(this.workbench.root, 'root') : '<span class="placeholder">Drop Root</span>';

        const channelZone = document.getElementById('drop-channel');
        channelZone.innerHTML = this.workbench.channel ? renderItem(this.workbench.channel, 'channel') : '<span class="placeholder">Drop Channel</span>';

        const umbralsZone = document.getElementById('drop-umbrals');
        umbralsZone.innerHTML = this.workbench.umbrals.length ? 
            this.workbench.umbrals.map((p, i) => renderItem(p, 'umbrals', i)).join('') : 
            '<span class="placeholder">Drop Umbrals</span>';

        const nimbedsZone = document.getElementById('drop-nimbeds');
        nimbedsZone.innerHTML = this.workbench.nimbeds.length ? 
            this.workbench.nimbeds.map((p, i) => renderItem(p, 'nimbeds', i)).join('') : 
            '<span class="placeholder">Drop Nimbeds</span>';
    }

    async updatePreview() {
        const previewEl = document.getElementById('annex-preview');
        if (!previewEl) return;

        const Facets = T13NE.getModule('Facets');
        if (!Facets) return;

        const getFacetData = async (profId) => {
            if (!profId) return null;
            const prof = this.profCache.get(profId);
            if (!prof || !prof.tags || !prof.tags.facets || !prof.tags.facets[0]) return null;
            return await Facets.getFacet(prof.tags.facets[0]);
        };

        const rootFacet = await getFacetData(this.workbench.root);
        const channelFacet = await getFacetData(this.workbench.channel);
        
        // Tangle logic: Usually Root for Skills, but can be complex. Default to Root.
        const tangleFacet = rootFacet; 

        let html = '<h4>Annex Preview</h4>';
        
        if (rootFacet) {
            html += `<div><strong>Root (${rootFacet.FacetName}):</strong> ${rootFacet.Annex_Root_Text || rootFacet.Annex_Root || ''}</div>`;
        }
        if (channelFacet) {
            html += `<div><strong>Channel (${channelFacet.FacetName}):</strong> ${channelFacet.Annex_Channel_Text || channelFacet.Annex_Channel || ''}</div>`;
        }
        if (tangleFacet) {
             html += `<div><strong>Tangle (${tangleFacet.FacetName}):</strong> ${tangleFacet.Tangle_Text || tangleFacet.Tangle || ''}</div>`;
        }

        if (this.workbench.umbrals.length > 0) {
            html += '<h5>Umbrals</h5><ul>';
            for (const pid of this.workbench.umbrals) {
                const f = await getFacetData(pid);
                if (f) {
                    html += `<li><strong>${f.FacetName}:</strong> ${f.Umbral_Text || f.Umbral || 'Cost'}</li>`;
                    // Placeholder for command
                    html += `<li style="font-size:0.7em; color:var(--accent-purple)">Cmd: Apply ${f.FacetName} Umbral Effect</li>`;
                }
            }
            html += '</ul>';
        }

        if (this.workbench.nimbeds.length > 0) {
            html += '<h5>Nimbeds</h5><ul>';
            for (const pid of this.workbench.nimbeds) {
                const f = await getFacetData(pid);
                if (f) {
                    html += `<li><strong>${f.FacetName}:</strong> ${f.Nimbed_Text || f.Nimbed || 'Benefit'}</li>`;
                    // Placeholder for command
                    html += `<li style="font-size:0.7em; color:var(--accent-green)">Cmd: Apply ${f.FacetName} Nimbed Effect</li>`;
                }
            }
            html += '</ul>';
        }

        // Determine Type
        let count = (this.workbench.root ? 1 : 0) + (this.workbench.channel ? 1 : 0) + this.workbench.umbrals.length + this.workbench.nimbeds.length;
        let type = 'Proficiency';
        if (count === 2) type = 'Skill';
        else if (count >= 3 && count <= 5) type = 'Talent';
        else if (count > 5) type = 'Power';
        
        if (count > 0) {
             html = `<div style="margin-bottom:0.5rem"><span class="status-badge">${type}</span></div>` + html;
        }

        previewEl.innerHTML = html;
    }

    renderCharacterAnnexes() {
        const container = document.getElementById('character-annexes-list');
        container.innerHTML = '';
        if (this.character && this.character.subAnnexes) {
            this.character.subAnnexes.forEach(annex => {
                const card = UI.render(annex, null, 'card');
                if (card) container.appendChild(card);
            });
        }
        if (container.innerHTML === '') {
            container.innerHTML = '<p class="empty-list">No annexes created.</p>';
        }
    }

    attachBuilderEventListeners() {
        document.getElementById('create-annex-btn').onclick = () => this.createAnnexFromWorkbench();
        
        const zones = document.querySelectorAll('.drop-zone');
        zones.forEach(zone => {
            zone.ondragover = (e) => { e.preventDefault(); zone.classList.add('drag-over'); };
            zone.ondragleave = (e) => zone.classList.remove('drag-over');
            zone.ondrop = (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                const profId = e.dataTransfer.getData('text/plain');
                const slot = zone.dataset.slot;
                this.addToWorkbench(profId, slot);
            };
        });
    }

    addToWorkbench(profId, slot) {
        if (!profId) return;
        
        // Fetch prof if not in cache (should be there from drag source, but safety check)
        // For now assume it's in cache or we just use ID
        
        if (slot === 'root') this.workbench.root = profId;
        else if (slot === 'channel') this.workbench.channel = profId;
        else if (slot === 'umbrals') this.workbench.umbrals.push(profId);
        else if (slot === 'nimbeds') this.workbench.nimbeds.push(profId);
        
        this.renderWorkbench();
        this.updatePreview();
    }

    removeFromWorkbench(slot, index = null) {
        if (slot === 'root') this.workbench.root = null;
        else if (slot === 'channel') this.workbench.channel = null;
        else if (slot === 'umbrals' && index !== null) this.workbench.umbrals.splice(index, 1);
        else if (slot === 'nimbeds' && index !== null) this.workbench.nimbeds.splice(index, 1);
        
        this.renderWorkbench();
        this.updatePreview();
    }

    async createAnnexFromWorkbench() {
        const AnnexFactory = T13NE.getModule('AnnexFactory');
        const name = document.getElementById('annex-name-input').value || 'Unnamed Annex';
        const description = document.getElementById('annex-desc-input').value;

        const proficiencies = [];
        if (this.workbench.root) proficiencies.push({ profId: this.workbench.root, knot: TIE.ROOT | TIE.THREAD });
        if (this.workbench.channel) proficiencies.push({ profId: this.workbench.channel, knot: TIE.CHANNEL | TIE.THREAD });
        this.workbench.umbrals.forEach(p => proficiencies.push({ profId: p, knot: TIE.UMBRAL | TIE.THREAD }));
        this.workbench.nimbeds.forEach(p => proficiencies.push({ profId: p, knot: TIE.NIMBED | TIE.THREAD }));

        const newAnnex = await AnnexFactory.create({ name, description, proficiencies });

        if (this.character) {
            if (!this.character.subAnnexes) this.character.subAnnexes = [];
            this.character.subAnnexes.push(newAnnex);
            UI.notify(`Annex "${newAnnex.name}" created and added to ${this.character.name}.`, 'success');
            
            // Clear workbench
            this.workbench = { root: null, channel: null, umbrals: [], nimbeds: [] };
            document.getElementById('annex-name-input').value = '';
            document.getElementById('annex-desc-input').value = '';
            
            this.renderWorkbench();
            this.updatePreview();
            this.renderCharacterAnnexes();
        }
    }
}

const knotsUI = new KnotsUI();
window.KnotsUI = knotsUI; // Expose for inline event handlers
export default knotsUI;
