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

        const { Name, Rank, goal, tensionLevel, subPlots = [], Hooked_Characters = [] } = this.plotData;

        const style = SafeDOM.el('style', {}, `
            :host { display: block; font-family: 'Inter', sans-serif; color: #1e293b; }
            .plot-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: #1e293b; color: #fff; padding: 24px; border-bottom: 1px solid #334155; }
            .rank-badge { display: inline-block; padding: 4px 12px; background: #3b82f6; border-radius: 4px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; }
            .title { font-size: 1.75rem; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: -0.025em; }
            .content { padding: 24px; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 0.875rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; border-left: 4px solid #3b82f6; padding-left: 12px; }
            .goal-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; font-style: italic; color: #475569; }
            .tension-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 8px; }
            .tension-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #ef4444); transition: width 0.3s ease; }
            .entity-list { display: flex; flex-wrap: wrap; gap: 8px; }
            .entity-chip { padding: 6px 12px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem; font-weight: 600; color: #1e293b; cursor: pointer; transition: all 0.2s; }
            .entity-chip:hover { border-color: #3b82f6; color: #3b82f6; }
            .subplot-item { padding: 12px; border: 1px solid #f1f5f9; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
            .subplot-name { font-weight: 600; color: #1e293b; }
            .subplot-rank { font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 700; }
        `);

        const card = SafeDOM.el('div', { class: 'plot-card' }, [
            SafeDOM.el('div', { class: 'header' }, [
                SafeDOM.el('span', { class: 'rank-badge' }, SafeDOM.escape(Rank)),
                SafeDOM.el('h1', { class: 'title' }, SafeDOM.escape(Name))
            ]),
            SafeDOM.el('div', { class: 'content' }, [
                SafeDOM.el('div', { class: 'section' }, [
                    SafeDOM.el('h2', { class: 'section-title' }, 'Narrative Goal'),
                    SafeDOM.el('div', { class: 'goal-box' }, SafeDOM.escape(goal))
                ]),
                SafeDOM.el('div', { class: 'section' }, [
                    SafeDOM.el('div', { style: 'display: flex; justify-content: space-between; align-items: center;' }, [
                        SafeDOM.el('h2', { class: 'section-title', style: 'margin-bottom: 0;' }, 'Narrative Tension'),
                        SafeDOM.el('span', { style: 'font-weight: 800; color: #ef4444;' }, `${tensionLevel} / 11`)
                    ]),
                    SafeDOM.el('div', { class: 'tension-bar' }, [
                        SafeDOM.el('div', { class: 'tension-fill', style: { width: `${(tensionLevel / 11) * 100}%` } })
                    ])
                ]),
                SafeDOM.el('div', { class: 'section' }, [
                    SafeDOM.el('h2', { class: 'section-title' }, 'Hooked Characters'),
                    SafeDOM.el('div', { class: 'entity-list' },
                        Hooked_Characters.length ? Hooked_Characters.map(c =>
                            SafeDOM.el('div', {
                                class: 'entity-chip',
                                onclick: () => this.dispatchEvent(new CustomEvent('inspect-character', { detail: c.id || c, bubbles: true, composed: true }))
                            }, SafeDOM.escape(c.name || c))
                        ) : [SafeDOM.el('span', { style: 'color: #94a3b8; font-size: 0.875rem;' }, 'No characters hooked yet.')]
                    )
                ]),
                SafeDOM.el('div', { class: 'section' }, [
                    SafeDOM.el('h2', { class: 'section-title' }, 'Active Subplots'),
                    SafeDOM.el('div', { class: 'subplot-list' },
                        subPlots.length ? subPlots.map(sp =>
                            SafeDOM.el('div', { class: 'subplot-item' }, [
                                SafeDOM.el('span', { class: 'subplot-name' }, SafeDOM.escape(sp.Name || sp.name)),
                                SafeDOM.el('span', { class: 'subplot-rank' }, SafeDOM.escape(sp.Rank))
                            ])
                        ) : [SafeDOM.el('span', { style: 'color: #94a3b8; font-size: 0.875rem;' }, 'No subplots branching.')]
                    )
                ])
            ])
        ]);

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(card);
    }
}

customElements.define('t13-plot-widget', T13PlotWidget);
