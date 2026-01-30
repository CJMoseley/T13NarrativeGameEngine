/* LEGACY CODE - MOVED TO src/t13ne/core/ui/

import Logger from '../core/Logger.js';

class IntroSequence {
    static element = null;
    static statusElement = null;

    static init() {
        // Try to find elements if we haven't yet
        if (!this.element) this.element = document.getElementById('intro-sequence');
        if (!this.statusElement) this.statusElement = document.getElementById('loading-status');
        
        if (!this.element) {
            // Don't log error yet, might be too early. We'll check in show/hide.
            return false;
        }
        return true;
    }

    static show() {
        this.init();
        if (this.element) {
            this.element.style.display = 'flex';
            this.element.style.zIndex = '9999'; // Ensure it's on top when shown
        }
    }

    static hide() {
        this.init();
        if (this.element) {
            this.element.style.display = 'none';
        }
    }

    static updateStatus(message) {
        this.init();
        if (this.statusElement) {
            this.statusElement.textContent = message;
        }
        Logger.message(`Loading Status: ${message}`);
    }
}

// Initialize on script load
IntroSequence.init();

export default IntroSequence;

*/