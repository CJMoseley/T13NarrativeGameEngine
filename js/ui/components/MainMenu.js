import Logger from '../../core/Logger.js';

/**
 * MainMenu Component
 *
 * Renders the main menu options and delegates actions to the UIManager.
 */
export class MainMenu {
    constructor(uiManager) {
        const funcName = 'MainMenu.constructor';
        Logger.start(funcName);
        this.uiManager = uiManager;
        this.viewManager = uiManager.viewManager;
        this.element = document.getElementById('mainMenu'); // The root element for all menus
        this.menuOptionsElement = document.getElementById('menuOptions'); // The container for buttons
        Logger.end(funcName);
    }

    _clear() {
        this.menuOptionsElement.innerHTML = '';
    }

    _addOption(option) {
        const button = document.createElement('button');
        button.className = 'menu-button';
        button.textContent = option.text;
        button.onclick = () => {
            Logger.message(`MainMenu: Button "${option.text}" clicked.`);
            option.onClick();
        };
        this.menuOptionsElement.appendChild(button);
    }

    show() {
        this._clear();

        // Center the menu content
        this.element.style.display = 'flex';
        this.element.style.justifyContent = 'center';
        this.element.style.alignItems = 'center';
        this.menuOptionsElement.style.textAlign = 'center';

        const titleElement = document.createElement('h1');
        titleElement.textContent = 'Wormhole Racers';
        this.menuOptionsElement.appendChild(titleElement);

        // These actions will now be handled by the ViewManager or UIManager
        this._addOption({ text: 'New Game', onClick: () => this.viewManager.showGalaxyMap() });
        this._addOption({ text: 'Galaxy Map', onClick: () => this.viewManager.showGalaxyMap() });
        this._addOption({ text: 'Settings', onClick: () => this.uiManager.showSettingsMenu() });
        this._addOption({ text: 'Controls', onClick: () => this.uiManager.showControls() });
        this._addOption({ text: 'Test Menu', onClick: () => this.uiManager.showTestMenu() });

        this.element.classList.add('menu-reveal');
        Logger.message("MainMenu component shown.");
    }

    hide() {
        this.element.style.display = 'none';
        this.element.classList.remove('menu-reveal');
        Logger.message("MainMenu component hidden.");
    }
}
