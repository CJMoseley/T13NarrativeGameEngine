import T13NE from '/src/t13ne/T13NE.js';
import UI from './t13ne-UI.js';
import CharacterUI from './t13ne-chars-UI.js';
import GeometryUI from './t13ne-geometry-ui.js';

/**
 * T13NE Narrative UI Module
 * Handles the main Narrative Glob/Packets view.
 */
class NarrativeUI {
    constructor() {
        this.selectedEntity = null;
    }

    render() {
        const list = document.getElementById('packet-list');
        if (!list) return;

        const GameModule = T13NE.getModule('Game');

        // Attempt recovery of orphans before rendering to ensure sync
        if (GameModule) GameModule.recoverOrphans();

        list.innerHTML = '';

        const games = GameModule?.getAllGames() || [];

        // Use the Vault as the source of truth for "All" to catch everything
        const allEntities = GameModule?.getAllEntities() || [];
        const allPlots = allEntities.filter(e => e.constructor.name === 'T13Plot' || e.rank);
        const allChars = allEntities.filter(e => e.constructor.name === 'Character' || e.model || e.charType);

        if (games.length === 0 && allPlots.length === 0 && allChars.length === 0) {
            const empty = document.getElementById('narrative-empty');
            if (empty) empty.style.display = 'block';
            return;
        }

        const empty = document.getElementById('narrative-empty');
        if (empty) empty.style.display = 'none';

        // Render Games
        games.forEach(game => {
            const gameHeader = document.createElement('div');
            gameHeader.className = 'game-header';
            gameHeader.style.cssText = 'padding: 1rem; background: var(--glass-bg); border-radius: 0.75rem; border: 1px solid var(--accent-blue); margin-bottom: 1rem; cursor: pointer; display: flex; align-items: center; gap: 1rem;';
            gameHeader.innerHTML = `
                <div style="font-size: 1.5rem;">🎮</div>
                <div style="flex: 1;">
                    <strong style="color: var(--accent-blue)">${game.name}</strong>
                    <div style="font-size: 0.7rem; color: var(--text-dim)">${game.type} • ${game.plots.length} Plots • ${game.characters.length} Chars</div>
                </div>
            `;
            gameHeader.onclick = () => {
                this.selectedEntity = game;
                GameModule.setActiveGame(game.id);
                this.inspect(game);
                this.render();
            };
            if (this.selectedEntity === game) gameHeader.style.borderColor = 'var(--accent-blue)';
            list.appendChild(gameHeader);

            const gameContent = document.createElement('div');
            gameContent.className = 'entity-grid';
            gameContent.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem; padding-left: 2rem;';

            const entityIds = [
                ...(game.plots || []),
                ...(game.characters || []),
                ...(game.descendants || []),
                ...(game.annexes || []),
                ...(game.tapestries || []),
                ...(game.threads || [])
            ];

            const gameEntities = entityIds
                .map(id => GameModule.getEntity(id))
                .filter(ent => !!ent);

            gameEntities.forEach(item => {
                const card = UI.render(item, null, 'card');
                if (card) gameContent.appendChild(card);
            });

            if (gameEntities.length === 0) {
                gameContent.innerHTML += `<div style="font-size: 0.75rem; color: var(--text-dim); padding: 0.5rem; opacity: 0.5;">(Game is empty)</div>`;
            }

            list.appendChild(gameContent);
        });

        // Render Ungrouped
        const ungroupedPlots = allPlots.filter(p => !GameModule.findEntityGame(p.id));
        const ungroupedChars = allChars.filter(c => !GameModule.findEntityGame(c.id));

        if (ungroupedPlots.length > 0 || ungroupedChars.length > 0) {
            const ungroupedHeader = document.createElement('h3');
            ungroupedHeader.style.cssText = 'font-size: 0.9rem; color: var(--text-dim); margin: 1rem 0; padding-left: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em;';
            ungroupedHeader.textContent = 'Entity Vault (Ungrouped)';
            list.appendChild(ungroupedHeader);

            const ungroupedGrid = document.createElement('div');
            ungroupedGrid.className = 'entity-grid';
            ungroupedGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;';
            list.appendChild(ungroupedGrid);

            [...ungroupedPlots, ...ungroupedChars].forEach(item => {
                const card = UI.render(item, null, 'card');
                if (card) ungroupedGrid.appendChild(card);
            });
        }

        // Add "New Cycle" Button at the bottom
        const cycleBtn = document.createElement('button');
        cycleBtn.className = 'btn btn-primary';
        cycleBtn.style.cssText = 'display: block; width: 100%; margin-top: 2rem; padding: 1rem;';
        cycleBtn.textContent = '✨ Generate New Narrative Cycle';
        cycleBtn.onclick = () => {
            const name = prompt("Name the new Cycle:");
            if (name) {
                T13NE.Commands.execute(`Ref:GenerateCycle(name="${name}")`);
                // Refresh checks would happen here or via event listeners
                setTimeout(() => this.render(), 1000); // Hacky refresh
            }
        };
        list.appendChild(cycleBtn);
    }

    createItemCard(obj) {
        const div = document.createElement('div');
        const typeName = obj.constructor.name;
        let type = 'Item';
        let color = 'var(--accent-blue)';

        if (typeName === 'T13Plot' || !!obj.rank) { type = 'Plot'; color = 'var(--accent-purple)'; }
        else if (typeName === 'Character' || !!obj.model) { type = 'Char'; color = 'var(--accent-blue)'; }
        else if (typeName === 'T13Game') { type = 'Game'; color = 'var(--accent-blue)'; }
        else if (typeName === 'Annex' || !!obj.proficiencyIds) { type = 'Knot'; color = 'var(--accent-green)'; }
        else if (typeName === 'Descendant' || obj.id?.startsWith('desc-')) { type = 'Desc'; color = 'var(--accent-blue)'; }
        else if (obj.id?.startsWith('tap-')) { type = 'Tapestry'; color = '#f97316'; }
        else if (obj.id?.startsWith('prof-')) { type = 'Thread'; color = 'var(--accent-purple)'; }

        div.className = `card ${this.selectedEntity === obj ? 'active' : ''}`;
        div.style.cursor = 'pointer';
        if (this.selectedEntity === obj) div.style.borderColor = color;

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <strong style="color: ${color}">${obj.Name || obj.name}</strong>
                <span class="status-badge" style="background: ${color}22; color: ${color}">${type}</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 0.5rem;">
                State: <span style="color: var(--accent-green)">${obj.Rank || obj.rank || obj.type || (obj.model || 'Active')}</span>
            </div>
        `;
        div.onclick = () => {
            this.selectedEntity = obj;
            this.inspect(obj);
            this.render();
        };
        return div;
    }

    async inspect(obj) {
        const body = document.getElementById('inspector-body');
        if (!body) return;

        const isPlot = obj.constructor.name === 'T13Plot' || !!obj.rank;
        const isGame = obj.constructor.name === 'T13Game';
        const isChar = obj.constructor.name === 'Character' || !!obj.model;
        const isTap = obj.id?.startsWith('tap-') || obj.constructor.name === 'T13Tapestry' || (obj.Stats && obj.Hex);

        const nameData = [
            obj.Name || obj.name || '',
            obj.fullName || '',
            obj.altName || ''
        ];

        let html = `
            <div class="form-group">
                <label>Identity</label>
                <h4 style="font-family: Outfit; font-size: 1.2rem; margin-bottom: 0.25rem;">${obj.Name || obj.name}</h4>
                ${obj.fullName && obj.fullName !== (obj.Name || obj.name) ? `<div style="font-size: 0.8rem; color: var(--text-dim);">Formal: ${obj.fullName}</div>` : ''}
                ${obj.altName && obj.altName !== (obj.Name || obj.name) ? `<div style="font-size: 0.8rem; color: var(--text-dim); font-style: italic;">AKA: ${obj.altName}</div>` : ''}
                <div style="margin-top: 0.5rem;">${GeometryUI.render(nameData)}</div>
            </div>

            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                ${isPlot ? `<span class="status-badge" style="background: var(--accent-purple)22; color: var(--accent-purple)">${obj.Rank || obj.rank}</span>` : ''}
                ${isGame ? `<span class="status-badge" style="background: var(--accent-blue)22; color: var(--accent-blue)">${obj.type}</span>` : ''}
                ${isChar ? `<span class="status-badge" style="background: var(--accent-green)22; color: var(--accent-green)">${obj.charType || obj.model}</span>` : ''}
                ${isTap ? `<span class="status-badge" style="background: #f9731622; color: #f97316">Tapestry</span>` : ''}
            </div>

            <div class="form-group"><label>Description</label><p style="font-size: 0.85rem; line-height: 1.4;">${obj.Description || obj.description || 'No description provided.'}</p></div>
        `;

        if (isChar) {
            const charContainer = document.createElement('div');
            CharacterUI.renderInspector(obj, charContainer);
            html += charContainer.innerHTML;

            // Render Facet Web for Characters
            const tapHandler = UI.getHandler('T13Tapestry');
            if (tapHandler && (obj.facetweb || obj.Stats)) {
                html += tapHandler.renderInspector(obj);
            }

            // Alternates
            if (obj.alternates && obj.alternates.length > 0) {
                html += `
                    <div class="form-group">
                        <label>Alternates (${obj.alternates.length})</label>
                        <div style="font-size: 0.75rem; color: var(--accent-blue)">
                            ${obj.alternates.map((alt, i) => `• ${alt.name[0]} ${i === obj.activeAlternateIndex ? '<b>(Active)</b>' : ''}`).join('<br>')}
                        </div>
                    </div>
                `;
            }

            // Backstory Button
            html += `
                <div class="form-group">
                    <button class="btn" style="width: 100%; border: 1px dashed var(--accent-purple); color: var(--accent-purple);" 
                        onclick="T13NE.Commands.execute({cmd: 'Ref:GenerateBackstory', args: {target: NarrativeUI.selectedEntity}}).then(() => NarrativeUI.render())">
                        📜 Generate Backstory
                    </button>
                    ${obj.history ? `<div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 0.5rem;">History Events: ${obj.history.length}</div>` : ''}
                </div>
            `;

            // Pacts
            if (obj.pacts && obj.pacts.length > 0) {
                html += `
                    <div class="form-group">
                        <label>Pact Memberships</label>
                        <div style="font-size: 0.75rem;">
                            ${obj.pacts.map(p => `• <b>${p.pactId}</b> (${p.membership})`).join('<br>')}
                        </div>
                    </div>
                `;
            }
        }

        if (isTap) {
            const handler = UI.getHandler('T13Tapestry');
            if (handler) html += handler.renderInspector(obj);
        }

        if (obj.iching) {
            html += `
                <div class="form-group" style="display: flex; gap: 1rem; border-top: 1px solid var(--glass-border); padding-top: 0.75rem;">
                    <div><label>I-Ching</label><div style="font-size: 1.5rem;">${obj.iching[0]} : ${obj.iching[1]}</div></div>
                </div>
            `;
        }

        if (isGame) {
            html += `
                <div class="form-group"><label>Plots</label><p style="font-size: 0.8rem;">${obj.plots.length} contained</p></div>
                <div class="form-group"><label>Characters</label><p style="font-size: 0.8rem;">${obj.characters.length} contained</p></div>
            `;
        }

        if (obj.Goal || obj.goal) {
            html += `<div class="form-group"><label>Goal</label><p style="font-size: 0.85rem; color: var(--accent-green)">${obj.Goal || obj.goal}</p></div>`;
        }

        html += `
            <div id="uhpp-inspector-anchor"></div>
            <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
                <button class="btn btn-primary" style="flex: 1;" onclick="Workbench.editEntity()">Edit Data</button>
                ${isGame ? `` : `<button class="btn" style="flex: 1;" onclick="Workbench.triggerAction()">Execute Action</button>`}
            </div>
            <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                <button class="btn" style="flex: 1; background: rgba(52, 211, 153, 0.2); border-color: rgba(52, 211, 153, 0.4); color: var(--accent-green); font-weight: 600;" onclick="Workbench.engineAction('save')">Save</button>
                <button class="btn" style="flex: 1; background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4); color: var(--danger); font-weight: 600;" onclick="Workbench.deleteEntity(NarrativeUI.selectedEntity)">Delete</button>
            </div>
        `;

        body.innerHTML = html;

        // UHPP Integration for Descendants and Locations
        if (obj.constructor.name === 'Descendant' || obj.constructor.name === 'Location' || obj.id?.startsWith('desc-') || obj.descendantType) {
            const anchor = document.getElementById('uhpp-inspector-anchor');
            if (anchor) {
                try {
                    const { UHPPEditorUI } = await import('/src/t13ne/procgen/uhpp/UHPPEditorUI.js');
                    const uhppUI = new UHPPEditorUI(window.Workbench);
                    uhppUI.renderInspector(obj, anchor);
                } catch (e) {
                    console.error("Failed to load UHPP Editor UI:", e);
                }
            }
        }
    }
}

const narrativeUI = new NarrativeUI();
window.NarrativeUI = narrativeUI;
export default narrativeUI;
