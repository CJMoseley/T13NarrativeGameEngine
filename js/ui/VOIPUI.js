/* LEGACY CODE - MOVED TO src/t13ne/core/ui/

import Logger from '../core/Logger.js';

/**
 * Manages the VOIP user interface.
 */
export class VOIPUI {
    constructor(voipManager) {
        const funcName = 'VOIPUI.constructor';
        Logger.start(funcName);
        this.voipManager = voipManager;
        this.domElement = null;
        this.micSelect = null;
        this.muteButton = null;
        this.peerList = null;
        this.isMuted = false;
        Logger.end(funcName);
    }

    /**
     * Initializes the VOIP UI, creating the DOM elements and event listeners.
     */
    async init() {
        const funcName = 'VOIPUI.init';
        Logger.start(funcName);
        this.createUI();
        await this.populateMicrophones();
        this.attachEventListeners();
        this.hide(); // Hidden by default
        Logger.end(funcName);
    }

    /**
     * Creates the main UI container and elements.
     */
    createUI() {
        const funcName = 'VOIPUI.createUI';
        Logger.start(funcName);

        this.domElement = document.createElement('div');
        this.domElement.id = 'voip-ui';
        this.domElement.style.position = 'absolute';
        this.domElement.style.bottom = '10px';
        this.domElement.style.left = '10px';
        this.domElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.domElement.style.color = 'white';
        this.domElement.style.padding = '10px';
        this.domElement.style.borderRadius = '5px';
        this.domElement.style.fontFamily = 'sans-serif';

        const title = document.createElement('h3');
        title.textContent = 'VOIP Controls';
        title.style.margin = '0 0 10px 0';
        this.domElement.appendChild(title);

        // Mic selection
        const micLabel = document.createElement('label');
        micLabel.textContent = 'Microphone: ';
        micLabel.htmlFor = 'mic-select';
        this.domElement.appendChild(micLabel);

        this.micSelect = document.createElement('select');
        this.micSelect.id = 'mic-select';
        this.domElement.appendChild(this.micSelect);

        // Mute button
        this.muteButton = document.createElement('button');
        this.muteButton.textContent = 'Mute';
        this.muteButton.style.marginLeft = '10px';
        this.domElement.appendChild(this.muteButton);

        // Peer list for volume controls
        this.peerList = document.createElement('div');
        this.peerList.id = 'voip-peer-list';
        this.peerList.style.marginTop = '10px';
        this.domElement.appendChild(this.peerList);

        document.body.appendChild(this.domElement);
        Logger.end(funcName);
    }

    /**
     * Populates the microphone selection dropdown.
     */
    async populateMicrophones() {
        const funcName = 'VOIPUI.populateMicrophones';
        Logger.start(funcName);

        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            Logger.message("WARN: VOIPUI: enumerateDevices() not supported.");
            Logger.end(funcName, "enumerateDevices not supported.");
            return;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(device => device.kind === 'audioinput');

        this.micSelect.innerHTML = '';
        audioDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Microphone ${this.micSelect.length + 1}`;
            this.micSelect.appendChild(option);
        });
        Logger.end(funcName, `Populated with ${audioDevices.length} microphones.`);
    }

    /**
     * Attaches event listeners to the UI elements.
     */
    attachEventListeners() {
        const funcName = 'VOIPUI.attachEventListeners';
        Logger.start(funcName);
        this.micSelect.addEventListener('change', (event) => {
            const deviceId = event.target.value;
            Logger.message(`Microphone selection changed to: ${deviceId}`);
            this.voipManager.changeMicrophone(deviceId);
        });
        this.muteButton.addEventListener('click', () => this.toggleMute());
        Logger.end(funcName);
    }

    /**
     * Toggles the mute state.
     */
    toggleMute() {
        const funcName = 'VOIPUI.toggleMute';
        Logger.start(funcName);
        this.isMuted = !this.isMuted;
        this.voipManager.setMuted(this.isMuted);
        this.muteButton.textContent = this.isMuted ? 'Unmute' : 'Mute';
        Logger.end(funcName, `Muted state is now: ${this.isMuted}`);
    }

    /**
     * Adds a UI element for a peer, including a volume slider.
     * @param {string} peerId - The ID of the peer.
     */
    addPeer(peerId) {
        const funcName = 'VOIPUI.addPeer';
        Logger.start(funcName, { peerId });

        const peerDiv = document.createElement('div');
        peerDiv.id = `peer-${peerId}`;
        peerDiv.style.marginTop = '5px';

        const peerLabel = document.createElement('label');
        peerLabel.textContent = `Volume (${peerId}): `;
        peerDiv.appendChild(peerLabel);

        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = 0;
        volumeSlider.max = 1;
        volumeSlider.step = 0.01;
        volumeSlider.value = 1;

        volumeSlider.addEventListener('input', (event) => {
            this.voipManager.setPeerVolume(peerId, event.target.value);
        });

        peerDiv.appendChild(volumeSlider);
        this.peerList.appendChild(peerDiv);
        Logger.end(funcName);
    }

    /**
     * Removes the UI element for a peer.
     * @param {string} peerId - The ID of the peer.
     */
    removePeer(peerId) {
        const funcName = 'VOIPUI.removePeer';
        Logger.start(funcName, { peerId });
        const peerDiv = document.getElementById(`peer-${peerId}`);
        if (peerDiv) {
            this.peerList.removeChild(peerDiv);
            Logger.message(`Removed UI for peer: ${peerId}`);
        }
        Logger.end(funcName);
    }

    show() {
        const funcName = 'VOIPUI.show';
        Logger.start(funcName);
        if (this.domElement) this.domElement.style.display = 'block';
        Logger.end(funcName);
    }

    hide() {
        const funcName = 'VOIPUI.hide';
        Logger.start(funcName);
        if (this.domElement) this.domElement.style.display = 'none';
        Logger.end(funcName);
    }
}

*/