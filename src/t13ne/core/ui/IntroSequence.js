import Logger from '../Logger.js';

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

    /**
     * Prompts the user to interact with the page to enable audio.
     * @param {Function} callback - Function to call after interaction.
     */
    static promptForInteraction(callback) {
        this.init();
        if (!this.element) {
            // Fallback: just call callback if we can't show UI
            if (callback) callback();
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'audio-prompt-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.9); z-index:10001; display:flex; justify-content:center; align-items:center; cursor:pointer; flex-direction:column; font-family: "Jura", sans-serif;';
        overlay.innerHTML = `
            <h1 style="color:#66aaff; margin-bottom:10px; text-transform:uppercase; letter-spacing:4px;">Wormhole Racers</h1>
            <p style="color:#889; margin-bottom:30px;">[ SENSORS LOCALIZING ... ]</p>
            <div style="padding:20px 40px; border:1px solid #337ab7; color:#66aaff; text-transform:uppercase; letter-spacing:2px; background: rgba(51, 122, 183, 0.1); transition: all 0.3s;">
                Initialize Engine
            </div>
            <p style="color:#445; margin-top:40px; font-size: 0.8em;">(Requires User Gesture for Audio)</p>
        `;

        const onInteract = () => {
            document.body.removeChild(overlay);
            window.removeEventListener('keydown', onInteract);
            if (callback) callback();
        };

        overlay.onclick = onInteract;
        window.addEventListener('keydown', onInteract, { once: true });

        document.body.appendChild(overlay);
    }
}

// Initialize on script load
IntroSequence.init();

export default IntroSequence;