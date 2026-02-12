// src/t13ne/core/ui/components/SettingsMenu.js
import { UI } from '../UI.js';
import Logger from '../../Logger.js';
import T13NE from '../../../T13NE.js';

export class SettingsMenu {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.element = null;
        this.create();
    }

    create() {
        this.element = UI.CE('div', {
            id: 'settings-menu',
            className: 't13ne-menu',
            style: {
                display: 'none',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                padding: '20px',
                borderRadius: '10px',
                border: '1px solid #444',
                color: '#fff',
                minWidth: '400px',
                zIndex: '2000'
            }
        });

        const title = UI.CE('h2', { style: { textAlign: 'center', marginBottom: '20px' } }, 'Settings');
        this.element.appendChild(title);

        this.contentContainer = UI.CE('div', { className: 'settings-content' });
        this.element.appendChild(this.contentContainer);

        const closeBtn = UI.CE('button', {
            className: 'menu-button',
            style: { marginTop: '20px', width: '100%' },
            onclick: () => this.close()
        }, 'Back');
        this.element.appendChild(closeBtn);

        document.body.appendChild(this.element);
    }

    show() {
        this.renderContent();
        this.element.style.display = 'block';
    }

    hide() {
        this.element.style.display = 'none';
    }

    close() {
        this.hide();
        this.uiManager.showMainMenu();
    }

    renderContent() {
        this.contentContainer.innerHTML = '';
        const config = T13NE.getConfig().audio || {};

        // --- Global Audio Settings ---
        this.contentContainer.appendChild(UI.CE('h3', {}, 'Audio Levels'));
        
        this.addSlider('Master Volume', config.masterVolume ?? 0.5, (val) => {
            T13NE.setConfig({ audio: { masterVolume: val } });
        });

        this.addSlider('Music Volume', config.musicVolume ?? 0.8, (val) => {
            T13NE.setConfig({ audio: { musicVolume: val } });
        });

        this.addSlider('SFX Volume', config.sfxVolume ?? 1.0, (val) => {
            T13NE.setConfig({ audio: { sfxVolume: val } });
        });

        this.addSlider('Dialogue Volume', config.dialogueVolume ?? 1.0, (val) => {
            T13NE.setConfig({ audio: { dialogueVolume: val } });
        });

        // --- Controls Settings ---
        this.contentContainer.appendChild(UI.CE('hr', { style: { margin: '15px 0', borderColor: '#444' } }));
        this.contentContainer.appendChild(UI.CE('h3', {}, 'Controls Sensitivity'));

        const controlsConfig = T13NE.getConfig().controls || {};

        this.addSlider('Rotation Speed', controlsConfig.rotateSpeed ?? 2.0, (val) => {
            T13NE.setConfig({ controls: { ...T13NE.getConfig().controls, rotateSpeed: val } });
        }, 0.1, 5.0, 0.1);

        this.addSlider('Zoom Speed', controlsConfig.zoomSpeed ?? 1.2, (val) => {
            T13NE.setConfig({ controls: { ...T13NE.getConfig().controls, zoomSpeed: val } });
        }, 0.1, 5.0, 0.1);

        this.addSlider('Pan Speed', controlsConfig.panSpeed ?? 0.8, (val) => {
            T13NE.setConfig({ controls: { ...T13NE.getConfig().controls, panSpeed: val } });
        }, 0.1, 5.0, 0.1);

        // --- VOIP Settings ---
        const voipManager = this.uiManager.gameEngine.voipManager;
        if (voipManager && voipManager.remoteStreams.size > 0) {
            this.contentContainer.appendChild(UI.CE('hr', { style: { margin: '15px 0', borderColor: '#444' } }));
            this.contentContainer.appendChild(UI.CE('h3', {}, 'VOIP Levels'));

            voipManager.remoteStreams.forEach((remote, peerId) => {
                // Default to 1.0 if not set, or read from audio element
                const currentVol = remote.audio ? remote.audio.volume : 1.0;
                this.addSlider(`Player: ${peerId.substring(0, 8)}...`, currentVol, (val) => {
                    voipManager.setPeerVolume(peerId, val);
                });
            });
        } else if (voipManager) {
             this.contentContainer.appendChild(UI.CE('hr', { style: { margin: '15px 0', borderColor: '#444' } }));
             this.contentContainer.appendChild(UI.CE('p', { style: { color: '#888', fontStyle: 'italic' } }, 'No active VOIP connections.'));
        }
    }

    addSlider(label, value, onChange, min = 0, max = 1, step = 0.01) {
        const container = UI.CE('div', { style: { marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } });
        
        const labelEl = UI.CE('label', { style: { flex: '1' } }, label);
        
        const slider = UI.CE('input', {
            type: 'range',
            min: min.toString(),
            max: max.toString(),
            step: step.toString(),
            value: value.toString(),
            style: { flex: '2', margin: '0 10px' },
            oninput: (e) => {
                const val = parseFloat(e.target.value);
                onChange(val);
                // Update percentage text if we add it later
            }
        });

        container.appendChild(labelEl);
        container.appendChild(slider);
        this.contentContainer.appendChild(container);
    }
}
