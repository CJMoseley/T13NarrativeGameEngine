/* LEGACY CODE - MOVED TO src/t13ne/core/ui/

import Logger from '../../core/Logger.js';

/**
 * PauseMenu Component
 *
 * A simple menu that appears when the player pauses the game.
 */
export class PauseMenu {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.viewManager = uiManager.viewManager;
        this.element = document.createElement('div');
        this.element.id = 'pauseMenu';
        this.element.className = 'menu-container';
        this.element.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 10px;
        `;

        this.init();
        document.getElementById('ui-layer').appendChild(this.element);
    }

    init() {
        this.element.innerHTML = `
            <h2>Paused</h2>
            <button class="menu-button" id="resumeButton">Resume</button>
            <button class="menu-button" id="quitButton">Quit to Main Menu</button>
        `;

        this.element.querySelector('#resumeButton').addEventListener('click', () => {
            this.uiManager.hidePauseMenu();
        });

        this.element.querySelector('#quitButton').addEventListener('click', () => {
            this.viewManager.sceneManager.unloadScene();
            this.uiManager.showMainMenu();
        });
    }

    show() {
        this.element.style.display = 'block';
        Logger.message("PauseMenu shown.");
    }

    hide() {
        this.element.style.display = 'none';
        Logger.message("PauseMenu hidden.");
    }
}

*/