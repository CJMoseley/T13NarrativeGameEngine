import { MusicEditorUI } from '../workbench/t13ne-music-editor.js';
import Logger from '../../core/Logger.js';

/**
 * T13NE_Editor Module
 * Manages the in-engine authoring and editing tools.
 */
class T13NE_Editor {
    constructor() {
        this.initialized = false;
        this.t13ne = null;
        this.isActive = false;
        this.editorMode = 'data'; // 'data', 'scene2d', 'scene3d', 'music'
        this.musicEditor = null;
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
                position: 'fixed',
                top: '10px',
                right: '10px',
                bottom: '10px',
                width: '80%', // Expanded widely for music editor
                maxWidth: '1200px',
                background: 'rgba(0, 0, 0, 0.9)',
                color: '#fff',
                padding: '15px',
                border: '1px solid #38bdf8',
                borderRadius: '8px',
                zIndex: '10001',
                fontFamily: 'sans-serif',
                display: 'flex',
                flexDirection: 'column'
            });
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div style="flex: 0 0 auto; margin-bottom: 10px; border-bottom: 1px solid #444; padding-bottom: 10px;">
                <h3 style="margin: 0 0 10px 0; display:inline-block;">T13NE Editor</h3>
                <span style="float:right; cursor:pointer;" onclick="T13NE.getModule('Editor').toggleEditor()">✖</span>
                <div>
                    <button onclick="T13NE.getModule('Editor').setMode('data')">Data</button>
                    <button onclick="T13NE.getModule('Editor').setMode('scene2d')">2D Scene</button>
                    <button onclick="T13NE.getModule('Editor').setMode('scene3d')">3D Scene</button>
                    <button onclick="T13NE.getModule('Editor').setMode('music')">Music</button>
                </div>
            </div>
            <div id="editor-main-content" style="flex: 1; overflow: hidden; position: relative;">
                <!-- Content injected here -->
            </div>
            <div id="editor-controls" style="flex: 0 0 auto; margin-top: 5px; font-size: 0.8em; color: #888;">
                Mode: <span id="editor-mode-label">${this.editorMode}</span>
            </div>
        `;
        overlay.style.display = 'flex';

        // Render initial mode
        this.renderModeContent();
    }

    setMode(mode) {
        this.editorMode = mode;
        const label = document.getElementById('editor-mode-label');
        if (label) label.textContent = mode;
        Logger.message(`T13NE_Editor: Mode set to ${mode}`);
        this.renderModeContent();
    }

    async renderModeContent() {
        const container = document.getElementById('editor-main-content');
        if (!container) return;
        container.innerHTML = ''; // Clear current

        if (this.editorMode === 'music') {
            if (!this.musicEditor) {
                this.musicEditor = new MusicEditorUI('editor-main-content');
            }
            await this.musicEditor.initialize(); // Re-init/Refresh
        } else {
            container.innerHTML = `<div style="padding: 20px;">Placeholder for ${this.editorMode} mode.</div>`;
        }
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







