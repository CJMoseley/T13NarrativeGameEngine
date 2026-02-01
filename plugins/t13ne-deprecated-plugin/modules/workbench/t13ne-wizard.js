/**
 * T13NE Wizard Module
 * Standardizes multi-step creation/editing flows.
 */
export default class Wizard {
    constructor(modalBodyId, submitBtnId, closeCallback) {
        this.modalBody = document.getElementById(modalBodyId);
        this.submitBtn = document.getElementById(submitBtnId);
        this.closeCallback = closeCallback;
        this.steps = [];
        this.currentStepIndex = 0;
        this.data = {};
        this.onComplete = null;
        this.draftId = null;
    }

    /**
     * Starts the wizard.
     * @param {object} config - { steps: [{ title, render(data), onRender(dom, data), onSave(dom, data), validate(dom, data) }] }
     * @param {object} initialData 
     * @param {function} onComplete 
     * @param {string} [draftId] - Optional ID for localStorage persistence.
     */
    start(config, initialData, onComplete, draftId = null) {
        this.steps = config.steps;
        this.draftId = draftId;
        this.onComplete = onComplete;
        
        // Load draft if available
        let loadedData = {};
        let savedStep = 0;
        if (this.draftId) {
            const saved = localStorage.getItem(this.draftId);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    loadedData = parsed.data || {};
                    savedStep = parsed.step || 0;
                } catch(e) { console.warn("Wizard: Failed to load draft", e); }
            }
        }

        this.data = { ...JSON.parse(JSON.stringify(initialData || {})), ...loadedData };
        this.currentStepIndex = savedStep < this.steps.length ? savedStep : 0;
        
        if (this.submitBtn) this.submitBtn.style.display = 'none';
        this.render();
    }

    saveDraft() {
        if (this.draftId) {
            const state = {
                data: this.data,
                step: this.currentStepIndex,
                timestamp: Date.now()
            };
            localStorage.setItem(this.draftId, JSON.stringify(state));
        }
    }

    clearDraft() {
        if (this.draftId) {
            localStorage.removeItem(this.draftId);
        }
    }

    render() {
        if (!this.modalBody) return;
        
        const step = this.steps[this.currentStepIndex];
        
        let html = `<div class="wizard-container" style="height: 100%; display: flex; flex-direction: column;">`;
        
        // Progress Bar
        html += `<div class="wizard-progress" style="display: flex; gap: 5px; margin-bottom: 1rem;">`;
        this.steps.forEach((s, i) => {
            const active = i <= this.currentStepIndex;
            html += `<div style="flex: 1; height: 4px; background: ${active ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)'};" title="${s.title}"></div>`;
        });
        html += `</div>`;

        // Content Area
        html += `<div class="wizard-content" style="flex: 1; overflow-y: auto; padding-right: 5px; margin-bottom: 1rem;">`;
        html += `<h3 style="margin-bottom: 1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem;">${step.title}</h3>`;
        html += step.render(this.data);
        html += `</div>`;

        // Navigation
        html += `<div class="wizard-nav" style="display: flex; justify-content: space-between; padding-top: 1rem; border-top: 1px solid var(--glass-border);">`;
        
        if (this.currentStepIndex > 0) {
            html += `<button class="btn" id="wiz-back">Back</button>`;
        } else {
            html += `<div></div>`;
        }

        if (this.draftId && localStorage.getItem(this.draftId)) {
            html += `<button class="btn" id="wiz-reset" style="font-size:0.7rem; opacity:0.7;">Reset Draft</button>`;
        }

        if (this.currentStepIndex < this.steps.length - 1) {
            html += `<button class="btn btn-primary" id="wiz-next">Next</button>`;
        } else {
            html += `<button class="btn btn-primary" id="wiz-finish">Finish</button>`;
        }
        
        html += `</div></div>`;

        this.modalBody.innerHTML = html;
        this.bindEvents(step);
    }

    bindEvents(step) {
        // Allow step to bind its own events (e.g. dynamic dropdowns, geometry calculators)
        if (step.onRender) {
            step.onRender(this.modalBody, this.data);
        }

        const backBtn = document.getElementById('wiz-back');
        if (backBtn) {
            backBtn.onclick = () => {
                if (step.onSave) step.onSave(this.modalBody, this.data);
                this.currentStepIndex--;
                this.saveDraft();
                this.render();
            };
        }

        const nextBtn = document.getElementById('wiz-next');
        if (nextBtn) {
            nextBtn.onclick = () => {
                if (step.validate && !step.validate(this.modalBody, this.data)) return;
                if (step.onSave) step.onSave(this.modalBody, this.data);
                this.currentStepIndex++;
                this.saveDraft();
                this.render();
            };
        }

        const finishBtn = document.getElementById('wiz-finish');
        if (finishBtn) {
            finishBtn.onclick = async () => {
                if (step.validate && !step.validate(this.modalBody, this.data)) return;
                if (step.onSave) step.onSave(this.modalBody, this.data);
                
                try {
                    if (this.onComplete) await this.onComplete(this.data);
                    this.clearDraft(); // Only clear draft if completion was successful
                    if (this.closeCallback) this.closeCallback();
                    if (this.submitBtn) this.submitBtn.style.display = 'block';
                } catch (e) {
                    console.error("Wizard: Completion failed, draft retained.", e);
                    // Do not close, do not clear draft
                }
            };
        }

        const resetBtn = document.getElementById('wiz-reset');
        if (resetBtn) {
            resetBtn.onclick = () => {
                if (confirm("Discard this draft and start over?")) {
                    this.clearDraft();
                    this.currentStepIndex = 0;
                    this.data = {}; // Or reload initialData if we kept it
                    this.render();
                }
            };
        }
    }
}
