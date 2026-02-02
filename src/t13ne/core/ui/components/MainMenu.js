import Logger from '../../Logger.js';
import Localization from '../Localization.js';
import { UI } from '../UI.js';

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
        const button = UI.CE('button', {
            className: 'menu-button',
            onClick: () => {
                Logger.message(`MainMenu: Button "${option.text}" clicked.`);
                option.onClick();
            }
        }, option.text);
        this.menuOptionsElement.appendChild(button);
    }

    show() {
        if (!this.element) return;
        this._clear();

        // Center the menu content
        this.element.style.display = 'flex';
        this.element.style.justifyContent = 'center';
        this.element.style.alignItems = 'center';
        this.menuOptionsElement.style.textAlign = 'center';

        const titleElement = UI.CE('h1', {}, Localization.__('MENU_TITLE'));
        this.menuOptionsElement.appendChild(titleElement);

        // These actions will now be handled by the ViewManager or UIManager
        this._addOption({ text: Localization.__('MENU_NEW_GAME'), onClick: () => this.viewManager.showGalaxyMap() });
        this._addOption({ text: Localization.__('MENU_GALAXY_MAP'), onClick: () => this.viewManager.showGalaxyMap() });
        this._addOption({ text: Localization.__('MENU_SETTINGS'), onClick: () => this.uiManager.showSettingsMenu() });
        this._addOption({ text: 'Author Mode', onClick: () => window.location.href = '/src/t13ne/index.html' });
        this._addOption({ text: Localization.__('MENU_CONTROLS'), onClick: () => this.uiManager.showControls() });
        this._addOption({ text: Localization.__('MENU_TEST_MENU'), onClick: () => this.uiManager.showTestMenu() });

        this.element.classList.add('menu-reveal');
        Logger.message("MainMenu component shown.");
    }

    hide() {
        if (!this.element) return;
        this.element.style.display = 'none';
        this.element.classList.remove('menu-reveal');
        Logger.message("MainMenu component hidden.");
    }
}
