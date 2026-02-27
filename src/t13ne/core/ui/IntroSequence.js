import Logger from '/src/t13ne/core/Logger.js';

class IntroSequenceUI {
    constructor() {
        this.element = document.getElementById('intro-sequence');
        this.statusElement = document.getElementById('loading-status');
        this.interactionPrompt = null;
    }

    show() {
        if (this.element) {
            this.element.style.display = 'flex';
            this.element.style.opacity = '1';
            this.element.style.zIndex = '10000';
        }
    }

    hide() {
        if (this.element) {
            this.element.style.transition = 'opacity 1s ease-out';
            this.element.style.opacity = '0';
            setTimeout(() => {
                if (this.element.style.opacity === '0') {
                    this.element.style.display = 'none';
                }
            }, 1000);
        }
    }

    updateStatus(message) {
        if (this.statusElement) {
            this.statusElement.innerText = message;
        }
    }

    promptForInteraction(callback) {
        if (!this.element) return;
        
        if (!this.interactionPrompt) {
            this.interactionPrompt = document.createElement('button');
            this.interactionPrompt.innerText = "Click to Initialize Audio";
            this.interactionPrompt.className = 'menu-button';
            this.interactionPrompt.style.marginTop = '20px';
            this.interactionPrompt.onclick = () => {
                this.interactionPrompt.style.display = 'none';
                if (callback) callback();
            };
            
            const content = this.element.querySelector('.intro-content');
            if (content) content.appendChild(this.interactionPrompt);
        }
        
        this.interactionPrompt.style.display = 'block';
        this.updateStatus("Waiting for user interaction...");
    }
}

export default new IntroSequenceUI();
