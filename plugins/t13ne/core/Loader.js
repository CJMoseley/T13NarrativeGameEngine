import Logger from '@/js/core/Logger.js';

export class Loader {
    constructor() {
        this.statusElement = document.getElementById('loadingStatus');
        this.mainMenuElement = document.getElementById('mainMenu');
        this.genericMessages = [
            "Reticulating Splines...",
            "Herding Schrodinger's Cats...",
            "Dividing by Zero...",
            "Ignoring Laws of Physics...",
            "Charging Laser Pointers...",
            "Untangling Quantum Strings...",
            "Consulting the Galactic Oracle...",
        ];
        this.messageInterval = null;
    }

    async loadModule(name, loadFunction, messages = []) {
        this.stopFunnyMessages();
        this.updateStatus(`Engaging: ${name}...`);

        const messageList = messages.length > 0 ? messages : this.genericMessages;
        this.startFunnyMessages(messageList);

        try {
            await loadFunction();
            Logger.message(`Loader: ${name} complete.`);
        } catch (error) {
            Logger.message(`ERROR: Failed to load ${name}: ${error}`);
            this.updateStatus(`CRITICAL FAILURE during: ${name}. Check console.`);
            throw error;
        } finally {
            this.stopFunnyMessages();
        }
    }

    startFunnyMessages(messages) {
        this.messageInterval = setInterval(() => {
            const message = messages[Math.floor(Math.random() * messages.length)];
            this.updateStatus(message);
        }, 1500);
    }

    stopFunnyMessages() {
        if (this.messageInterval) {
            clearInterval(this.messageInterval);
            this.messageInterval = null;
        }
    }

    updateStatus(text) {
        if (this.statusElement) {
            this.statusElement.innerText = text;
        }
    }

    completeLoading() {
        this.stopFunnyMessages();
        this.updateStatus("Ready to Race!");
        Logger.message("Loader: Loading complete.");
    }
}
