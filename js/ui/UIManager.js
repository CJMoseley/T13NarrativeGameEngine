import Logger from '../core/Logger.js';
import { MainMenu } from './components/MainMenu.js';
import { TestMenu } from './components/TestMenu.js';
import { ShipyardPanel } from './components/ShipyardPanel.js';
import { PauseMenu } from './components/PauseMenu.js';
import { EventBus } from '../core/EventBus.js';

/**
 * UIManager
 *
 * This class is responsible for managing the lifecycle of all 2D UI components.
 */
export class UIManager {
    constructor(viewManager) {
        const funcName = 'UIManager.constructor';
        Logger.start(funcName);
        this.viewManager = viewManager;
        this.gameEngine = viewManager.gameEngine;
        this.uiContainer = document.getElementById('ui-container');
        this.activeMenu = null;

        // Components will be instantiated in initialize()
        this.mainMenu = null;
        this.testMenu = null;
        this.shipyardPanel = null;
        this.pauseMenu = null;

        this.listenForSceneChanges();

        Logger.message("UIManager instantiated.");
        Logger.end(funcName);
    }

    initialize() {
        // Instantiate all UI components now that the DOM is ready
        this.mainMenu = new MainMenu(this);
        this.testMenu = new TestMenu(this);
        this.shipyardPanel = new ShipyardPanel(this);
        this.pauseMenu = new PauseMenu(this);

        Logger.message("UIManager initialized and components instantiated.");
    }

    listenForSceneChanges() {
        EventBus.on('scene:load', (sceneName) => {
            this.hideAll(); // Hide all menus when a scene loads
            // The ShipyardPanel is for a future ship building feature. Keep it hidden for now.
            this.shipyardPanel.hide();
        });
    }

    hideAll() {
        if (this.mainMenu) this.mainMenu.hide();
        if (this.testMenu) this.testMenu.hide();
        if (this.pauseMenu) this.pauseMenu.hide();
        // Add other menus here as they are created
        this.activeMenu = null;
    }

    showMainMenu() {
        this.hideAll();
        if (this.mainMenu && this.mainMenu.element) {
            this.viewManager.assignLayer(this.mainMenu.element, 'MENUS');
        }
        this.mainMenu.show();
        this.activeMenu = this.mainMenu;
    }

    showTestMenu() {
        this.hideAll();
        if (this.testMenu && this.testMenu.element) {
            this.viewManager.assignLayer(this.testMenu.element, 'MENUS');
        }
        this.testMenu.show();
        this.activeMenu = this.testMenu;
    }

    showPauseMenu() {
        if (this.pauseMenu && this.pauseMenu.element) {
            this.viewManager.assignLayer(this.pauseMenu.element, 'MENUS');
        }
        this.pauseMenu.show();
    }

    hidePauseMenu() {
        this.pauseMenu.hide();
    }
}
