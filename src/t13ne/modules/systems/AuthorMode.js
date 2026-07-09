import Logger from "/src/t13ne/core/Logger.js";
import { EventBus } from "/src/t13ne/core/EventBus.js";

/**
 * AuthorMode Module
 * Manages the transition between Player and Author (Referee) modes.
 * Centralizes access to content creation tools and the Author Workbench.
 */
class AuthorMode {
    constructor() {
        this.isActive = false;
        this.t13ne = null;
        this.workbench = null;
    }

    async initialize(t13ne) {
        this.t13ne = t13ne;
        Logger.message("AuthorMode: Initialized.");
    }

    /**
     * Toggles Author Mode.
     * When activated, it loads the Workbench UI and enables administrative controls.
     */
    async toggle(state) {
        this.isActive = state !== undefined ? state : !this.isActive;
        Logger.message(`AuthorMode: Author Mode is now ${this.isActive ? 'ACTIVE' : 'INACTIVE'}.`);

        if (this.isActive) {
            await this.enableAuthorTools();
            EventBus.emit('authormode:activated');
        } else {
            this.disableAuthorTools();
            EventBus.emit('authormode:deactivated');
        }
    }

    async enableAuthorTools() {
        if (!this.workbench) {
            Logger.message("AuthorMode: Loading Workbench UI...");
            try {
                const { default: Workbench } = await import('../workbench/t13ne-workbench.js');
                this.workbench = new Workbench();
                await this.workbench.init();
            } catch (e) {
                Logger.error("AuthorMode: Failed to load Workbench UI.", e);
            }
        }

        // Show the Author Mode panel if it exists in the DOM
        const authorPanel = document.getElementById('view-author');
        if (authorPanel) {
            authorPanel.style.display = 'block';
        }
    }

    disableAuthorTools() {
        const authorPanel = document.getElementById('view-author');
        if (authorPanel) {
            authorPanel.style.display = 'none';
        }
    }

    /**
     * Returns true if current user has authority to use Author Mode.
     * In a P2P session, only the Host can use Author Mode.
     */
    canAuthor() {
        const network = this.t13ne.getModule('P2PNetworkManager');
        return network ? network.isHost : true;
    }
}

export default new AuthorMode();
