export class T13AnnexWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.annexData = null;
    }

    connectedCallback() {
        this.render();
    }

    setAnnex(data) {
        this.annexData = data; // { name, type, description, proficiencies: [{ name, knot, facet }] }
        this.render();
    }

    render() {
        if (!this.annexData) return;
        const { name, type, description, proficiencies = [] } = this.annexData;

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
                .header { background: #f8fafc; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
                .title { font-weight: 800; font-size: 0.9rem; text-transform: uppercase; color: #1e293b; }
                .type { font-size: 0.7rem; font-weight: 700; color: #3b82f6; background: #eff6ff; padding: 2px 8px; border-radius: 4px; }
                .content { padding: 16px; background: #fff; }
                .desc { font-size: 0.85rem; color: #64748b; margin-bottom: 12px; line-height: 1.5; }
                .prof-list { display: flex; flex-wrap: wrap; gap: 8px; }
                .prof-item { font-size: 0.75rem; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; border-left: 3px solid #cbd5e1; }
                .knot-root { border-left-color: #ef4444; }
                .knot-channel { border-left-color: #3b82f6; }
            </style>
            <div class="header">
                <span class="title">${name}</span>
                <span class="type">${type || 'Annex'}</span>
            </div>
            <div class="content">
                <div class="desc">${description}</div>
                <div class="prof-list">
                    ${proficiencies.map(p => {
                        let knotClass = '';
                        if (p.knot & 16) knotClass = 'knot-root';
                        if (p.knot & 32) knotClass = 'knot-channel';
                        return `<div class="prof-item ${knotClass}">${p.name}</div>`;
                    }).join('')}
                </div>
            </div>
        `;
    }
}
customElements.define('t13-annex', T13AnnexWidget);
