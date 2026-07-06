import { SafeDOM } from '../t13ne/utils/SafeDOM.js';

export class T13CharacterSheet extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.characterData = null;
    }

    connectedCallback() {
        this.render();
    }

    setCharacter(data) {
        this.characterData = data;
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = '';
        if (!this.characterData) {
            this.shadowRoot.appendChild(SafeDOM.el('p', { style: 'color: #64748b; font-style: italic;' }, 'No character data loaded.'));
            return;
        }

        const { name, charType, boons, hexagram, descendants = [], hitches = [], proficiencies = [], annexes = [], plots = [], extras = [] } = this.characterData;
        const displayName = Array.isArray(name) ? name[0] : name;

        const style = SafeDOM.el('style', {}, `
            :host { display: block; font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.5; }
            .sheet-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
            .header { background: #f8fafc; padding: 24px; border-bottom: 1px solid #e2e8f0; }
            .name-row { display: flex; justify-content: space-between; align-items: baseline; }
            .name { font-size: 2rem; font-weight: 800; margin: 0; color: #0f172a; text-transform: uppercase; letter-spacing: -0.025em; }
            .type-badge { font-size: 0.75rem; font-weight: 700; background: #3b82f6; color: #fff; padding: 4px 12px; border-radius: 4px; text-transform: uppercase; }
            .hexagram { display: flex; align-items: center; gap: 12px; margin-top: 8px; color: #64748b; }

            .section { padding: 24px; border-bottom: 1px solid #f1f5f9; }
            .section-title { font-size: 0.875rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; border-left: 4px solid #3b82f6; padding-left: 12px; }

            .boon-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .boon-item { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
            .boon-label { font-weight: 600; color: #475569; }
            .boon-value { font-family: monospace; font-size: 1.25rem; font-weight: 700; color: #2563eb; }

            .list-container { display: flex; flex-direction: column; gap: 12px; }
            .widget-list { display: flex; flex-wrap: wrap; gap: 8px; }
            .widget-chip { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 4px 12px; border-radius: 16px; font-size: 0.875rem; font-weight: 500; color: #475569; }
            .hitch-chip { background: #fef2f2; border: 1px solid #fee2e2; color: #dc2626; }
            .plot-chip { background: #fff7ed; border: 1px solid #ffedd5; color: #9a3412; }
            .extra-chip { background: #f5f3ff; border: 1px solid #ede9fe; color: #5b21b6; }
        `);

        const container = SafeDOM.el('div', { class: 'sheet-container' }, [
            SafeDOM.el('div', { class: 'header' }, [
                SafeDOM.el('div', { class: 'name-row' }, [
                    SafeDOM.el('h1', { class: 'name' }, SafeDOM.escape(displayName)),
                    SafeDOM.el('span', { class: 'type-badge' }, SafeDOM.escape(charType))
                ]),
                SafeDOM.el('div', { class: 'hexagram' }, [
                    SafeDOM.el('span', { style: 'font-size: 1.5rem;' }, '☯'),
                    SafeDOM.el('span', {}, `Hexagram #${hexagram.number}: ${hexagram.name}`)
                ])
            ]),
            SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Facet Boons'),
                SafeDOM.el('div', { class: 'boon-grid' }, Object.entries(boons).map(([label, val]) =>
                    SafeDOM.el('div', { class: 'boon-item' }, [
                        SafeDOM.el('span', { class: 'boon-label' }, label),
                        SafeDOM.el('span', { class: 'boon-value' }, String(val))
                    ])
                ))
            ]),
            SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Annexes & Knotwork'),
                SafeDOM.el('div', { class: 'list-container' },
                    annexes.length ? annexes.map(() => SafeDOM.el('t13-annex')) : [SafeDOM.el('span', { style: 'color: #94a3b8; font-size: 0.875rem;' }, 'No active annexes.')]
                )
            ]),
            SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Proficiencies'),
                SafeDOM.el('div', { class: 'widget-list' },
                    proficiencies.length ? proficiencies.map(() => SafeDOM.el('t13-proficiency')) : [SafeDOM.el('span', { style: 'color: #94a3b8; font-size: 0.875rem;' }, 'No base proficiencies.')]
                )
            ]),
            SafeDOM.el('div', { class: 'section' }, [
                SafeDOM.el('h2', { class: 'section-title' }, 'Hitches'),
                SafeDOM.el('div', { class: 'widget-list' },
                    hitches.length ? hitches.map(h => SafeDOM.el('div', { class: 'widget-chip hitch-chip' }, SafeDOM.escape(h))) : [SafeDOM.el('span', { style: 'color: #94a3b8; font-size: 0.875rem;' }, 'No active hitches.')]
                )
            ])
        ]);

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(container);

        // Populate sub-components
        const annexContainer = this.shadowRoot.querySelectorAll('t13-annex');
        annexes.forEach((a, i) => { if (annexContainer[i]) annexContainer[i].setAnnex(a); });

        const profContainer = this.shadowRoot.querySelectorAll('t13-proficiency');
        proficiencies.forEach((p, i) => { if (profContainer[i]) profContainer[i].setProficiency([p.name, p.facet, '']); });
    }
}

customElements.define('t13-character-sheet', T13CharacterSheet);
