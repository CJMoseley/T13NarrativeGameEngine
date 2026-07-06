import { SafeDOM } from '../t13ne/utils/SafeDOM.js';

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
        this.shadowRoot.innerHTML = '';
        if (!this.annexData) return;
        const { name, type, description, proficiencies = [] } = this.annexData;

        const style = SafeDOM.el('style', {}, `
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
        `);

        const container = SafeDOM.el('div', { class: 'annex-card' }, [
            SafeDOM.el('div', { class: 'header' }, [
                SafeDOM.el('span', { class: 'title' }, SafeDOM.escape(name)),
                SafeDOM.el('span', { class: 'type' }, SafeDOM.escape(type || 'Annex'))
            ]),
            SafeDOM.el('div', { class: 'content' }, [
                SafeDOM.el('div', { class: 'desc' }, SafeDOM.escape(description)),
                SafeDOM.el('div', { class: 'prof-list' }, proficiencies.map(p => {
                    let knotClass = '';
                    if (p.knot & 16) knotClass = 'knot-root';
                    if (p.knot & 32) knotClass = 'knot-channel';
                    return SafeDOM.el('div', { class: `prof-item ${knotClass}` }, SafeDOM.escape(p.name));
                }))
            ])
        ]);

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(container);
    }
}
customElements.define('t13-annex', T13AnnexWidget);
