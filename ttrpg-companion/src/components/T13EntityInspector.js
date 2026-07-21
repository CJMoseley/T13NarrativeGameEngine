import { SafeDOM } from '../t13ne/utils/SafeDOM.js';

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
        this.shadowRoot.innerHTML = '';
        if (!this.entity) return;

        const type = this.entity.charType || this.entity.type || 'Unknown';
        const name = Array.isArray(this.entity.name) ? this.entity.name[0] : (this.entity.name || 'Unnamed');
        const isDetailed = ['Hero', 'Grunt', 'Paradox Warrior', 'Mercari', 'Wyrdchilde'].includes(type);

        const style = SafeDOM.el('style', {}, `
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
        `);

        const container = SafeDOM.el('div', { class: 'inspector-container' }, [
            SafeDOM.el('div', { class: 'header' }, [
                SafeDOM.el('span', { class: 'close-btn', onclick: () => this.inspect(null) }, '× Close'),
                SafeDOM.el('span', { class: 'type-tag' }, SafeDOM.escape(type)),
                SafeDOM.el('h1', { style: 'margin: 8px 0 0 0; font-size: 1.5rem;' }, SafeDOM.escape(name))
            ]),
            SafeDOM.el('div', { class: 'content' }, [
                SafeDOM.el('div', { class: 'section' }, [
                    SafeDOM.el('h2', { class: 'section-title' }, 'Narrative Description'),
                    SafeDOM.el('p', { style: 'font-size: 0.9rem; color: #475569; line-height: 1.6;' }, SafeDOM.escape(this.entity.description || 'A hooked entity in this narrative plot.'))
                ]),
                isDetailed ? SafeDOM.el('t13-character-sheet') : this.renderSpecifics()
            ])
        ]);

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(container);

        if (isDetailed) {
            setTimeout(() => {
                const sheet = this.shadowRoot.querySelector('t13-character-sheet');
                if (sheet) sheet.setCharacter(this.entity);
            }, 0);
        }
    }

    renderSpecifics() {
        if (this.entity.facetweb && this.entity.facetweb.Stats) {
            return SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Facet Boons'),
                SafeDOM.el('div', { class: 'stat-grid' }, this.entity.facetweb.Stats.map(s =>
                    SafeDOM.el('div', { class: 'stat-item' }, [
                        `Facet ${s.Facet}: `,
                        SafeDOM.el('strong', {}, String(s.Facet_Boon))
                    ])
                ))
            ]);
        }
        return document.createDocumentFragment();
    }
}
customElements.define('t13-entity-inspector', T13EntityInspector);
