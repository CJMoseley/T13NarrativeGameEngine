import { SafeDOM } from '../t13ne/utils/SafeDOM.js';

export class T13PlotWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.plotData = null;
    }

    connectedCallback() {
        this.render();
    }

    setPlot(data) {
        this.plotData = data;
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = '';
        if (!this.plotData) {
            this.shadowRoot.appendChild(SafeDOM.el('p', { style: 'color: #64748b; font-style: italic;' }, 'No active plot selected.'));
            return;
        }

        const { Name, Rank, goal, tensionLevel, subPlots = [], Hooked_Characters = [], quests = [], hand = [], Conflict = null, plotDescendants = [] } = this.plotData;

        const style = SafeDOM.el('style', {}, `
            :host { display: block; font-family: 'Inter', sans-serif; color: #1e293b; }
            .plot-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .header { background: #1e293b; color: #fff; padding: 24px; border-bottom: 1px solid #334155; }
            .rank-badge { display: inline-block; padding: 4px 12px; background: #3b82f6; border-radius: 4px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; }
            .title { font-size: 1.75rem; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: -0.025em; }
            .content { padding: 24px; }
            .section { margin-bottom: 32px; }
            .section-title { font-size: 0.875rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; border-left: 4px solid #3b82f6; padding-left: 12px; }
            .conflict-box { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
            .side-label { font-weight: 800; font-size: 0.7rem; text-transform: uppercase; color: #be123c; margin-bottom: 4px; }
            .goal-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; font-style: italic; color: #475569; margin-bottom: 16px; }
            .hand-grid { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 12px; }
            .quest-item { background: #fdf2f8; border: 1px solid #fce7f3; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
            .quest-header { display: flex; justify-content: space-between; font-weight: 800; font-size: 0.85rem; color: #9d174d; text-transform: uppercase; margin-bottom: 8px; }
            .entity-list { display: flex; flex-wrap: wrap; gap: 8px; }
            .entity-chip { padding: 6px 12px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: #1e293b; cursor: pointer; }
            .descendant-chip { background: #fefce8; border-color: #fef08a; color: #854d0e; }
        `);

        const card = SafeDOM.el('div', { class: 'plot-card' }, [
            SafeDOM.el('div', { class: 'header' }, [
                SafeDOM.el('span', { class: 'rank-badge' }, SafeDOM.escape(Rank)),
                SafeDOM.el('h1', { class: 'title' }, SafeDOM.escape(Name))
            ]),
            SafeDOM.el('div', { class: 'content' }, [
                Conflict ? SafeDOM.el('div', { class: 'section' }, [
                    SafeDOM.el('h2', { class: 'section-title' }, 'Conflict Spread'),
                    SafeDOM.el('div', { class: 'conflict-box' }, [
                        SafeDOM.el('div', {}, [
                            SafeDOM.el('div', { class: 'side-label' }, 'Dominant Side'),
                            SafeDOM.el('div', { style: 'font-weight: 700;' }, SafeDOM.escape(Conflict.Sides?.Dominant?.Expressions?.join(', ') || 'Unknown')),
                        ]),
                        SafeDOM.el('div', { style: 'margin-top: 12px;' }, [
                            SafeDOM.el('div', { class: 'side-label' }, 'Pressed Side'),
                            SafeDOM.el('div', { style: 'font-weight: 700;' }, SafeDOM.escape(Conflict.Sides?.Pressed?.Expressions?.join(', ') || 'Unknown')),
                        ])
                    ])
                ]) : document.createDocumentFragment(),

                SafeDOM.el('div', { class: 'section' }, [
                    SafeDOM.el('h2', { class: 'section-title' }, 'Narrative Goal & Tension'),
                    SafeDOM.el('div', { class: 'goal-box' }, SafeDOM.escape(goal)),
                    SafeDOM.el('div', { class: 'tension-bar' }, [
                        SafeDOM.el('div', { class: 'tension-fill', style: { width: `${(tensionLevel / 11) * 100}%` } })
                    ])
                ]),

                SafeDOM.el('div', { class: 'section' }, [
                    SafeDOM.el('h2', { class: 'section-title' }, 'Plot Quests'),
                    SafeDOM.el('div', {}, quests.length ? quests.map(q =>
                        SafeDOM.el('div', { class: 'quest-item' }, [
                            SafeDOM.el('div', { class: 'quest-header' }, [
                                SafeDOM.el('span', {}, SafeDOM.escape(q.name)),
                                SafeDOM.el('span', {}, `Reward: ${q.reward || 'None'}`)
                            ]),
                            SafeDOM.el('div', { style: 'font-size: 0.85rem;' }, SafeDOM.escape(q.description))
                        ])
                    ) : [SafeDOM.el('span', { style: 'color: #94a3b8; font-size: 0.875rem;' }, 'No active quests.')])
                ]),

                SafeDOM.el('div', { class: 'section' }, [
                    SafeDOM.el('h2', { class: 'section-title' }, 'Yarn Card Hand'),
                    SafeDOM.el('div', { class: 'hand-grid' }, hand.length ? hand.map(() => SafeDOM.el('t13-yarn-card')) : [SafeDOM.el('span', { style: 'color: #94a3b8; font-size: 0.875rem;' }, 'Hand is empty.')])
                ]),

                SafeDOM.el('div', { class: 'section' }, [
                    SafeDOM.el('h2', { class: 'section-title' }, 'Subplots & Descendants'),
                    SafeDOM.el('div', { class: 'entity-list' }, [
                        ...subPlots.map(sp => SafeDOM.el('div', { class: 'entity-chip' }, `Plot: ${sp.Name || sp.name}`)),
                        ...plotDescendants.map(d => SafeDOM.el('div', { class: 'entity-chip descendant-chip' }, `${d.Type}: ${d.Name || d.name}`))
                    ])
                ]),

                SafeDOM.el('div', { class: 'section' }, [
                    SafeDOM.el('h2', { class: 'section-title' }, 'Hooked Characters'),
                    SafeDOM.el('div', { class: 'entity-list' }, Hooked_Characters.map(c =>
                        SafeDOM.el('div', {
                            class: 'entity-chip',
                            onclick: () => this.dispatchEvent(new CustomEvent('inspect-character', { detail: c.id || c, bubbles: true, composed: true }))
                        }, SafeDOM.escape(c.name || c))
                    ))
                ])
            ])
        ]);

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(card);

        const cardWidgets = this.shadowRoot.querySelectorAll('t13-yarn-card');
        hand.forEach((c, i) => { if (cardWidgets[i]) cardWidgets[i].setCard(c); });
    }
}
customElements.define('t13-plot-widget', T13PlotWidget);
