﻿import AuthorMain from '/src/t13ne/AuthorMain.js';
import NarrativeUI from './t13ne-narrative-UI.js';
import CharacterUI from './t13ne-chars-UI.js';
import FacetWebUI from './t13ne-facetweb-UI.js';
import UI from './t13ne-UI.js';
import TapestryUI from './t13ne-tapestry-UI.js';
import Wizard from './t13ne-wizard.js';

const T13 = AuthorMain.getEngine();

export default class Inspector {
    constructor(workbench) {
        this.workbench = workbench;
        this.formData = {};
    }

    create(type) {
        const typeMap = {
            'game': 'Game',
            'plot': 'Plot',
            'character': 'Character',
            'thread': 'Thread',
            'knot': 'Knot',
            'descendant': 'Descendant',
            'annex': 'Annex',
            'tapestry': 'Tapestry'
        };
        const formalType = typeMap[type];

        this.workbench.log(`System: Configuring ${formalType} parameters...`, 'info');

        this.showEntityModal(formalType, (data) => {
            const args = Object.entries(data)
                .filter(([, v]) => v !== undefined && v !== null && v !== '')
                .map(([k, v]) => `${k}="${String(v).replace(/"/g, '\\"')}"`)
                .join(', ');
            const cmd = `${formalType}:Create(${args})`;
            this.workbench.runCommand(cmd, `Created ${formalType} "${data.name}"`);
        });
    }

    editEntity() {
        const obj = NarrativeUI.selectedEntity;
        if (!obj) return;

        this.showEntityModal(obj.constructor.name, (data) => {
            // Apply changes to the object
            const fields = ['name', 'fullName', 'altName', 'description', 'goal', 'rank', 'type', 'model', 'ageCategory', 'incarna', 'charType', 'experienceTier'];
            fields.forEach(f => {
                if (data[f] !== undefined) {
                    if (obj[f] !== undefined) obj[f] = data[f];
                    const pascal = f.charAt(0).toUpperCase() + f.slice(1);
                    if (obj[pascal] !== undefined) obj[pascal] = data[f];
                }
            });

            if (data.ageCategory !== undefined && (obj.constructor.name === 'Character' || obj.model)) {
                const ageMap = {
                    'New-born': { scale: -4, dice: '1d3-1' },
                    'Infant': { scale: -3, dice: '1d3' },
                    'Kid': { scale: -2, dice: '1d4' },
                    'Young-Adult': { scale: -1, dice: '1d5' },
                    'Adult': { scale: 0, dice: '1d6' },
                    'Aged': { scale: 0, dice: '1d8' }
                };
                const ageInfo = ageMap[data.ageCategory];
                if (ageInfo) {
                    obj.scaleModifier = ageInfo.scale;
                    obj.proficiencyDice = ageInfo.dice;
                }
            }

            if (data.scale !== undefined) {
                if (obj.id?.startsWith('tap-')) obj.Scale = data.scale;
                else if (obj.facetweb) obj.facetweb.Scale = data.scale;
            }
            if (data.stats !== undefined) {
                if (obj.id?.startsWith('tap-')) obj.Stats = data.stats;
                else if (obj.facetweb) obj.facetweb.Stats = data.stats;
            }

            obj.lastModified = Date.now();
            UI.notify(`Updated ${obj.Name || obj.name}`, 'success');
            this.workbench.refreshAll();
            NarrativeUI.inspect(obj);
        }, true);
    }

    deleteEntity(obj) {
        if (!obj || !obj.id) return;

        const GameModule = T13.getModule('Game');
        const activeGame = GameModule.getActiveGame();

        if (activeGame) {
            ['plots', 'characters', 'descendants', 'annexes', 'tapestries', 'threads'].forEach(listName => {
                if (activeGame[listName]) {
                    activeGame[listName] = activeGame[listName].filter(id => id !== obj.id);
                }
            });
            activeGame.lastModified = Date.now();
        }

        if (GameModule.entityVault) {
            GameModule.entityVault.delete(obj.id);
        }

        const Plots = T13.getModule('Plots');
        if (Plots && Plots.plots) {
            Plots.plots = Plots.plots.filter(p => p.id !== obj.id);
        }

        const Referee = T13.getModule('Referee');
        if (Referee && Referee.characters) {
            Referee.characters = Referee.characters.filter(c => c.id !== obj.id);
        }

        UI.notify(`${obj.Name || obj.name} deleted.`, 'success');
        NarrativeUI.selectedEntity = null;

        const inspector = document.getElementById('inspector-body');
        if (inspector) inspector.innerHTML = '<p style="color:var(--text-dim); text-align:center; margin-top:2rem;">Select an item to inspect.</p>';

        this.workbench.refreshAll();
    }

    showEntityModal(type, callback, isEdit = false) {
        const obj = isEdit ? NarrativeUI.selectedEntity : null;
        const title = isEdit ? `Edit ${type}` : `Create ${type}`;

        // Initialize form data
        this.formData = isEdit ? JSON.parse(JSON.stringify(obj)) : {};
        if (!this.formData.facetweb) this.formData.facetweb = {};

        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const submitBtn = document.getElementById('modal-submit');
        const wizard = new Wizard('modal-body', 'modal-submit', () => this.closeModal());

        if (!modalBody) {
            console.error("Modal body not found.");
            return;
        }

        if (modalTitle) modalTitle.textContent = title;
        if (submitBtn) submitBtn.style.display = 'block'; // Reset visibility

        const isCharacter = type === 'Character' || (obj && obj.constructor.name === 'Character');
        const isTapestry = type === 'Tapestry' || type === 'T13Tapestry' || (obj && obj.constructor.name === 'T13Tapestry');

        if (isCharacter || isTapestry) {
            // Generate a draft ID for persistence
            const draftId = isEdit ? `draft_edit_${obj.id}` : `draft_create_${type}`;

            let config = null;
            if (isCharacter) config = CharacterUI.getWizardConfig();
            else if (isTapestry) config = TapestryUI.getWizardConfig();

            if (config) {
                wizard.start(config, this.formData, callback, draftId);
            }
        } else {
            this.renderSinglePageForm(type, obj, callback, isEdit);
        }

        this.openModal();
    }

    renderSinglePageForm(type, obj, callback, isEdit) {
        const modalBody = document.getElementById('modal-body');
        let html = `<div class="modal-split-layout" style="display: grid; grid-template-columns: 1fr; gap: 1rem; height: calc(100% - 80px); overflow-y: auto; overflow-x: hidden;">`;
        html += `<div style="overflow-y: auto; padding-right: 0.5rem;">`;
        html += `
            <div class="form-group">
                <label>Common Name</label>
                <input type="text" id="m-name" placeholder="Name" value="${obj ? (obj.Name || obj.name) : 'New ' + type}">
            </div>
            <div class="form-group">
                <label>Full / Formal Name</label>
                <input type="text" id="m-full" placeholder="Formal Name (Optional)" value="${obj?.fullName || ''}">
            </div>
            <div class="form-group">
                <label>Aliases / AKAs</label>
                <input type="text" id="m-aliases" placeholder="AKA, AKA (Optional)" value="${obj?.altName || ''}">
            </div>
        `;

        if (type === 'Plot' || (obj && (!!obj.rank || obj.constructor.name === 'T13Plot'))) {
            html += `
                <div class="form-group">
                    <label>Rank</label>
                    <select id="m-rank">
                        ${['Scene', 'Act', 'Story', 'Chapter', 'Arc', 'Volume', 'Epic', 'Cycle'].map(r =>
                `<option value="${r}" ${obj?.rank === r ? 'selected' : ''}>${r}</option>`
            ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Goal</label>
                    <textarea id="m-goal" placeholder="Plot mission/goal...">${obj ? (obj.Goal || obj.goal || '') : ''}</textarea>
                </div>
            `;
        } else if (type === 'Game' || (obj && obj.constructor.name === 'T13Game')) {
            html += `
                <div class="form-group">
                    <label>Game Type</label>
                    <select id="m-gtype">
                        ${['Core', 'World-building', 'Collaborative', 'Sandbox', 'Plotted', 'Random', 'Adventure', 'Campaign'].map(gt =>
                `<option value="${gt}" ${obj?.type === gt ? 'selected' : ''}>${gt}</option>`
            ).join('')}
                    </select>
                </div>
            `;
        }

        html += `
            <div class="form-group">
                <label>Description</label>
                <textarea id="m-desc" placeholder="Description/Notes..." style="min-height: 100px;">${obj ? (obj.Description || obj.description || '') : ''}</textarea>
            </div>
        `;

        html += `</div>`; // End Left Column

        html += `</div>`; // End Grid

        // Inject Delete button if editing
        if (isEdit) {
            html += `
                <div style="margin-top: 10px; border-top: 1px solid var(--glass-border); padding-top: 10px;">
                    <button class="btn" id="inspector-delete-btn" style="width: 100%; background: rgba(220, 38, 38, 0.2); color: #f87171; border: 1px solid rgba(220, 38, 38, 0.5);">Delete ${type}</button>
                </div>
            `;
        }

        modalBody.innerHTML = html;

        // Attach Event Listeners
        if (isEdit) {
            const delBtn = document.getElementById('inspector-delete-btn');
            if (delBtn) {
                delBtn.onclick = () => {
                    this.deleteEntity(obj);
                    this.closeModal();
                };
            }
        }

        // Bind the main modal submit button (which is outside the modal-body in the HTML structure)
        const submitBtn = document.getElementById('modal-submit');
        // Remove old listeners to prevent duplicates
        const newBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newBtn, submitBtn);

        newBtn.textContent = isEdit ? 'Save Changes' : 'Create';
        newBtn.onclick = () => {
            const data = {
                name: document.getElementById('m-name').value,
                fullName: document.getElementById('m-full').value,
                altName: document.getElementById('m-aliases').value,
                description: document.getElementById('m-desc').value
            };

            const rankEl = document.getElementById('m-rank');
            if (rankEl) data.rank = rankEl.value;

            const goalEl = document.getElementById('m-goal');
            if (goalEl) data.goal = goalEl.value;

            const gtypeEl = document.getElementById('m-gtype');
            if (gtypeEl) data.type = gtypeEl.value;

            const modelEl = document.getElementById('m-model');
            if (modelEl) data.model = modelEl.value;

            callback(data);
            this.closeModal();
        };
    }

    openModal() {
        document.getElementById('modal-overlay').classList.add('active');
    }

    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    }

    toggleJoin(idx, btn) {
        // If btn is not passed (called from inline HTML), find it
        if (!btn) {
            btn = document.querySelector(`.facet-pair-row[data-idx="${idx}"] .join-toggle`);
        }
        const row = document.querySelector(`.facet-pair-row[data-idx="${idx}"]`);
        if (!row) return;

        const isJoined = row.dataset.joined === 'true';
        row.dataset.joined = (!isJoined).toString();
        if (btn) btn.textContent = !isJoined ? '🔗' : '🔓';

        if (!isJoined) {
            const yangInput = row.querySelector('input[data-side="facet"]');
            if (yangInput) {
                this.syncBoon(idx, 'facet', yangInput.value);
            }
        }
    }

    syncBoon(idx, side, value) {
        const row = document.querySelector(`.facet-pair-row[data-idx="${idx}"]`);
        if (!row || row.dataset.joined !== 'true') return;

        const val = parseInt(value) || 0;
        const otherSide = side === 'facet' ? 'antifacet' : 'facet';
        const otherInput = row.querySelector(`input[data-side="${otherSide}"]`);
        if (otherInput) otherInput.value = 26 - val;
    }

    randomizeFacets(type) {
        const grid = document.getElementById('m-facet-grid');
        FacetWebUI.randomize(type, grid);
    }

    standardizeFacets() {
        const Tapestry = T13.getModule('Tapestry');
        if (!Tapestry) return;

        let stats = null;
        const GameModule = T13.getModule('Game');
        const activeGame = GameModule ? GameModule.getActiveGame() : null;
        if (activeGame && activeGame.tapestries && activeGame.tapestries.length > 0) {
            const baseTap = GameModule.getEntity(activeGame.tapestries[0]);
            if (baseTap && baseTap.Stats) {
                stats = JSON.parse(JSON.stringify(baseTap.Stats));
            }
        }
        if (!stats) stats = JSON.parse(JSON.stringify(Tapestry.defaultStatblock.Stats));
        const grid = document.getElementById('m-facet-grid');
        if (grid) grid.innerHTML = FacetWebUI.renderGrid(stats);
    }

    sortFacets(side) {
        const stats = this.readGridData();
        stats.sort((a, b) => {
            const idA = side === 'yin' ? a.Antifacet : a.Facet;
            const idB = side === 'yin' ? b.Antifacet : b.Facet;
            const nameA = FacetWebUI.getFacetName(idA);
            const nameB = FacetWebUI.getFacetName(idB);
            return nameA.localeCompare(nameB);
        });
        const grid = document.getElementById('m-facet-grid');
        if (grid) grid.innerHTML = FacetWebUI.renderGrid(stats);
    }

    readGridData() {
        const grid = document.getElementById('m-facet-grid');
        if (!grid) return [];
        const rows = Array.from(grid.querySelectorAll('.facet-pair-row'));
        return rows.map(row => {
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
    }

    handleDrop(idx, event) {
        FacetWebUI.drop(event);
    }
}
