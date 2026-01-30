import Logger from '@/src/t13ne/core/Logger.js';
import AuthorMain from '@plugins/t13ne/AuthorMain.js';
import T13NE from '@plugins/t13ne/T13NE.js';
import UI from './t13ne-UI.js';
import NarrativeUI from './t13ne-narrative-UI.js';
import ThreadsUI from './t13ne-threads-UI.js';
import KnotsUI from './t13ne-knots-UI.js';
import LibraryUI from './t13ne-codex-UI.js';
import CardsUI from './t13ne-cards-ui.js';
import CharacterUI from './t13ne-chars-UI.js';
import TapestryUI from './t13ne-tapestry-UI.js';
import Inspector from './t13ne-inspector.js';
import Terminal from './t13ne-terminal.js';

const T13 = AuthorMain.getEngine();

/**
 * T13NE Workbench Orchestrator
 */
export default class Workbench {
    constructor() {
        this.activeView = 'narrative';
        this.selectedEntity = null;
        this.inspector = new Inspector(this);
        this.terminal = new Terminal(this);
    }

    async init() {
        this.injectLayoutOverrides(); // Inject styles early for loader
        this.showLoader("System: Bootstrapping...");
        this.log("System: Starting bootstrap sequence...");
        try {
            await AuthorMain.bootstrap();
            this.log("System: T13NE Engine Online.", "info");

            // Pre-cache Proficiencies to ensure list is populated
            const Codex = T13.getModule('Codex');
            if (Codex) {
                this.showLoader("Building Proficiency Index...");
                await Codex._getOrBuildProficiencyManifest();
                this.log("System: Proficiency Index built.", "success");
            }

            // Load saved narrative state if exists
            const savedState = localStorage.getItem('T13_NARRATIVE_PACKETS');
            if (savedState) {
                const GameState = T13.getModule('GameState');
                const success = await GameState.load(savedState);
                if (success) {
                    this.log("System: Previous narrative state restored.", "success");
                } else {
                    this.log("System: Failed to restore narrative state.", "error");
                }
            }

            this.updateAIStatus();
            this.registerHandlers();
            this.refreshAll();
            this.setupNav();
            this.terminal.setup();

            // Initialize Card Table
            const cardContainer = document.getElementById('card-table-container');
            if (cardContainer) {
                await CardsUI.initialize(cardContainer);
            }
        } catch (e) {
            this.log("System Error: " + e.message, "error");
        } finally {
            this.hideLoader();
        }
    }

    injectLayoutOverrides() {
        const style = document.createElement('style');
        style.textContent = `
            /* Ensure inspector is visible and scrollable */
            #inspector-body {
                height: 100%;
                overflow-y: auto;
                padding-bottom: 2rem;
            }

            /* Dark Theme Inputs - Enforce readability */
            input, select, textarea, .input-control {
                background-color: rgba(0, 0, 0, 0.5) !important;
                color: #ffffff !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                border-radius: 4px;
                padding: 6px;
            }
            
            input:focus, select:focus, textarea:focus {
                background-color: rgba(0, 0, 0, 0.8) !important;
                border-color: var(--accent-blue, #667eea) !important;
                outline: none;
            }

            option {
                background-color: #222;
                color: #fff;
            }

            ::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }

            @media (max-width: 900px) {
                #inspector-body {
                    border-left: none;
                    border-top: 1px solid var(--glass-border);
                    padding-top: 1rem;
                    margin-top: 1rem;
                    max-height: 50vh; /* Limit height when stacked */
                }
                .modal-split-layout { grid-template-columns: 1fr !important; }
                .modal-split-layout > div { border-left: none !important; border-top: 1px solid var(--glass-border); padding-left: 0 !important; padding-top: 1rem; }
            }

            /* Widen Modal for Tapestry Editing */
            #modal-overlay .modal-content {
                max-width: 1200px !important;
            }

            /* Ensure Navigation Tabs Wrap */
            .nav-tabs, .navigation, .nav-links, nav ul, .tab-bar {
                display: flex !important;
                flex-wrap: wrap !important;
                max-width: 100vw;
                overflow-x: auto;
            }

            /* Workbench Loader */
            #wb-loader {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(10, 10, 15, 0.95); z-index: 10000;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                color: var(--accent-blue, #667eea); font-family: sans-serif;
                transition: opacity 0.3s;
            }
            .wb-spinner {
                width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.1);
                border-top-color: var(--accent-blue, #667eea); border-radius: 50%;
                animation: wb-spin 1s linear infinite; margin-bottom: 1rem;
            }
            @keyframes wb-spin { to { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
    }

    showLoader(msg) {
        let el = document.getElementById('wb-loader');
        if (!el) {
            el = document.createElement('div');
            el.id = 'wb-loader';
            el.innerHTML = `<div class="wb-spinner"></div><div id="wb-loader-msg"></div>`;
            document.body.appendChild(el);
        }
        const msgEl = document.getElementById('wb-loader-msg');
        if (msgEl) msgEl.textContent = msg;
        el.style.opacity = '1';
        el.style.pointerEvents = 'all';
    }

    hideLoader() {
        const el = document.getElementById('wb-loader');
        if (el) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            setTimeout(() => { if(el.parentNode) el.parentNode.removeChild(el); }, 300);
        }
    }

    registerHandlers() {
        UI.register('Character', CharacterUI);
        UI.register('T13Plot', {
            render: (obj, container, viewType) => {
                if (viewType === 'card') return NarrativeUI.createItemCard(obj);
                return null;
            }
        });
        UI.register('T13Game', {
            render: (obj, container, viewType) => {
                if (viewType === 'card') return NarrativeUI.createItemCard(obj);
                return null;
            }
        });
        UI.register('T13Tapestry', {
            render: (obj, container, viewType) => {
                if (viewType === 'card') return NarrativeUI.createItemCard(obj);
                return null;
            },
            renderInspector: (obj) => TapestryUI.renderInspector(obj)
        });
    }

    setupNav() {
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.id === 'ai-status') return;
            item.onclick = () => {
                document.querySelectorAll('.nav-item, .view-content').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                const view = item.dataset.view;
                document.getElementById('view-' + view).classList.add('active');
                this.activeView = view;
                this.refreshView(view);
            };
        });
    }

    refreshAll() {
        this.refreshView(this.activeView);
    }

    refreshView(view) {
        switch (view) {
            case 'narrative': NarrativeUI.render(); break;
            case 'threads': ThreadsUI.refresh(); break;
            case 'knots': KnotsUI.refresh(); break;
            case 'library': LibraryUI.refresh(); break;
            case 'cards': CardsUI.render(); break;
        }
    }

    log(msg, type = 'info') {
        this.terminal.log(msg, type);
    }

    triggerAction(action) {
        this.selectedEntity = NarrativeUI.selectedEntity;
        if (!this.selectedEntity) return;

        if (action === 'setActiveGame') {
            const GameModule = T13.getModule('Game');
            GameModule.setActiveGame(this.selectedEntity.id);
            UI.notify(`System: ${this.selectedEntity.name} is now the ACTIVE game context.`, 'success');
            this.engineAction('save');
            NarrativeUI.render();
            return;
        }

        this.log(`System: Executing context action for ${this.selectedEntity.id}...`, 'info');
    }

    // Delegated methods for HTML event handlers
    create(type) { this.inspector.create(type); }
    editEntity() { this.inspector.editEntity(); }
    deleteEntity(obj) { this.inspector.deleteEntity(obj); }
    closeModal() { this.inspector.closeModal(); }
    toggleJoin(idx, btn) { this.inspector.toggleJoin(idx, btn); }
    syncBoon(idx, side, val) { this.inspector.syncBoon(idx, side, val); }
    randomizeFacets(type) { this.inspector.randomizeFacets(type); }
    handleDrop(idx, event) { this.inspector.handleDrop(idx, event); }
    standardizeFacets() { this.inspector.standardizeFacets(); }
    sortFacets(side) { this.inspector.sortFacets(side); }

    async runCommand(cmd, successMsg) {
        const context = { ...AuthorMain.getContext(), ...this.getWorkbenchContext() };
        const result = await AuthorMain.executeCommand(cmd, context);
        if (result?.error) {
            UI.notify(result.error, 'error');
            this.log(`Error: ${result.error}`, 'error');
        } else {
            UI.notify(successMsg, 'success');
            this.log(`Success: ${successMsg}`, 'success');
            this.refreshAll();
        }
    }

    getWorkbenchContext() {
        const ent = NarrativeUI.selectedEntity;
        if (!ent) return {};
        const isPlot = ent.constructor.name === 'T13Plot' || !!ent.rank;
        return isPlot ? { plot: ent } : { character: ent };
    }

    updateAIStatus() {
        const ai = T13.getModule('AIService');
        const statusEl = document.getElementById('ai-status');
        if (ai && statusEl) {
            statusEl.innerHTML = `<span style="color: var(--accent-green);">●</span> AI Service: Connected`;
        }
    }

    async engineAction(act) {
        const GameState = T13.getModule('GameState');
        if (act === 'save') {
            localStorage.setItem('T13_NARRATIVE_PACKETS', await GameState.save());
            this.log("System: Engine state persisted to LocalStorage.", "success");
        } else if (act === 'export') {
            const blob = new Blob([await GameState.exportGlob()], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `t13-nar-glob-${Date.now()}.json`; a.click();
            this.log("System: Export glob triggered.", "success");
        }
    }
}
