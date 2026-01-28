import Logger from "@/src/t13ne/core/Logger.js";

/**
 * T13NE_Editor Module
 * Manages the in-engine authoring and editing tools.
 */
class T13NE_Editor {
    constructor() {
        this.initialized = false;
        this.t13ne = null;
        this.isActive = false;
        this.editorMode = 'data'; // 'data', 'scene2d', 'scene3d'
    }

    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;
        this.initialized = true;
        Logger.message("T13NE_Editor: Initialized.");
    }

    toggleEditor() {
        this.isActive = !this.isActive;
        if (this.isActive) {
            this.showEditorUI();
        } else {
            this.hideEditorUI();
        }
    }

    showEditorUI() {
        Logger.message("T13NE_Editor: Showing Editor UI.");

        // 1. Inject Editor Overlay if not exists
        let overlay = document.getElementById('t13-editor-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 't13-editor-overlay';
            Object.assign(overlay.style, {
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '300px',
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                padding: '15px',
                border: '1px solid #38bdf8',
                borderRadius: '8px',
                zIndex: '10001',
                fontFamily: 'sans-serif'
            });
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <h3 style="margin-top:0">T13NE Editor</h3>
            <div style="margin-bottom:10px">
                <button onclick="T13NE.getModule('Editor').setMode('data')">Data</button>
                <button onclick="T13NE.getModule('Editor').setMode('scene2d')">2D Scene</button>
                <button onclick="T13NE.getModule('Editor').setMode('scene3d')">3D Scene</button>
            </div>
            <div id="editor-controls">
                Mode: ${this.editorMode}<br>
                <small>Authoring tools enabled.</small>
            </div>
        `;
        overlay.style.display = 'block';
    }

    hideEditorUI() {
        Logger.message("T13NE_Editor: Hiding Editor UI.");
    }

    setMode(mode) {
        this.editorMode = mode;
        Logger.message(`T13NE_Editor: Mode set to ${mode}`);
    }

    /**
     * Entity Editing: Merging/Cutting logic placeholder.
     */
    mergeEntities(entity1, entity2) {
        Logger.message(`T13NE_Editor: Merging ${entity1.id} and ${entity2.id}`);
        // Implementation for knot-merging
    }
}

export default new T13NE_Editor();







