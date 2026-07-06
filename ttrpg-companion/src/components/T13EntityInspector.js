export class T13EntityInspector extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.entity = null;
    }

    connectedCallback() {
        this.render();
    }

    inspect(entity) {
        this.entity = entity;
        this.render();
    }

    render() {
        if (!this.entity) {
            this.shadowRoot.innerHTML = '';
            return;
        }

        const type = this.entity.charType || this.entity.type || 'Unknown';
        const name = Array.isArray(this.entity.name) ? this.entity.name[0] : (this.entity.name || 'Unnamed');
        const isDetailed = ['Hero', 'Grunt', 'Paradox Warrior', 'Mercari', 'Wyrdchilde'].includes(type);

        this.shadowRoot.innerHTML = `
            <style>
                :host { position: fixed; right: 0; top: 0; bottom: 0; width: 400px; background: #fff; box-shadow: -4px 0 24px rgba(0,0,0,0.1); z-index: 1000; display: flex; flex-direction: column; animation: slideIn 0.3s ease; }
                @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .header { padding: 24px; background: #1e293b; color: #fff; }
                .close-btn { position: absolute; top: 12px; right: 12px; cursor: pointer; color: #94a3b8; }
                .type-tag { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; background: #3b82f6; padding: 2px 8px; border-radius: 4px; }
                .content { flex: 1; overflow-y: auto; padding: 24px; }
                .section { margin-bottom: 24px; }
                .section-title { font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }
                .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                .stat-item { background: #f8fafc; padding: 8px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 0.85rem; }
            </style>
            <div class="header">
                <span class="close-btn" onclick="this.getRootNode().host.inspect(null)">&times; Close</span>
                <span class="type-tag">${type}</span>
                <h1 style="margin: 8px 0 0 0; font-size: 1.5rem;">${name}</h1>
            </div>
            <div class="content">
                <div class="section">
                    <h2 class="section-title">Narrative Description</h2>
                    <p style="font-size: 0.9rem; color: #475569; line-height: 1.6;">${this.entity.description || 'A hooked entity in this narrative plot.'}</p>
                </div>
                ${isDetailed ? `<t13-character-sheet></t13-character-sheet>` : this.renderSpecifics()}
            </div>
        `;
    }

    renderSpecifics() {
        // Post-render population for detailed types
        setTimeout(() => {
            const sheet = this.shadowRoot.querySelector('t13-character-sheet');
            if (sheet) sheet.setCharacter(this.entity);
        }, 0);

        if (this.entity.facetweb) {
            return `
                <div class="section">
                    <h2 class="section-title">Facet Boons</h2>
                    <div class="stat-grid">
                        ${this.entity.facetweb.Stats.map(s => `
                            <div class="stat-item">Facet ${s.Facet}: <strong>${s.Facet_Boon}</strong></div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        return '';
    }
}
customElements.define('t13-entity-inspector', T13EntityInspector);
