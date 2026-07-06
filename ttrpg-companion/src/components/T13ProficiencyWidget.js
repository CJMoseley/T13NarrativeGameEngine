import { EventBus } from '/src/t13ne/core/EventBus.js';

export class T13ProficiencyWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.data = null;
    }

    connectedCallback() {
        this.render();
    }

    setProficiency(data) {
        this.data = data; // ["Name", "Source/Context", "Synonyms"]
        this.render();
    }

    render() {
        if (!this.data) return;
        const [name, source, synonyms] = Array.isArray(this.data) ? this.data : [this.data, '', ''];

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: inline-block; }
                .prof-chip {
                    background: #f0fdf4;
                    border: 1px solid #dcfce7;
                    color: #166534;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: help;
                    position: relative;
                }
                .prof-chip:hover .tooltip { display: block; }
                .tooltip {
                    display: none;
                    position: absolute;
                    bottom: 120%;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 200px;
                    background: #1e293b;
                    color: #fff;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    z-index: 100;
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                }
                .source { color: #94a3b8; margin-bottom: 4px; display: block; text-transform: uppercase; font-size: 0.65rem; }
                .synonyms { color: #cbd5e1; font-style: italic; display: block; margin-top: 4px; border-top: 1px solid #334155; padding-top: 4px; }
            </style>
            <div class="prof-chip">
                ${name}
                <div class="tooltip">
                    <span class="source">${source}</span>
                    <div>Knowledge of ${name.toLowerCase()} and its applications.</div>
                    <span class="synonyms">${synonyms}</span>
                </div>
            </div>
        `;
    }
}

customElements.define('t13-proficiency', T13ProficiencyWidget);
