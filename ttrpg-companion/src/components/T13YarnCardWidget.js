import { SafeDOM } from '../utils/SafeDOM.js';

const BaseElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

export class T13YarnCardWidget extends BaseElement {
    constructor() {
        super();
        if (typeof this.attachShadow === 'function') {
            this.attachShadow({ mode: 'open' });
        }
        this.cardData = null;
        this.selected = false;
        this.interactive = false;
    }

    connectedCallback() {
        this.interactive = this.hasAttribute('interactive') || this.interactive;
        this.render();
    }

    setCard(card) {
        this.cardData = card || null;
        this.render();
    }

    setSelected(selected) {
        this.selected = Boolean(selected);
        this.render();
    }

    setInteractive(enabled) {
        this.interactive = Boolean(enabled);
        this.render();
    }

    _emitAction(action) {
        if (!this.cardData || typeof this.dispatchEvent !== 'function' || typeof CustomEvent === 'undefined') return;
        this.dispatchEvent(new CustomEvent('card-action', {
            detail: { action, card: this.cardData },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        if (!this.shadowRoot) return;
        this.shadowRoot.innerHTML = '';
        if (!this.cardData) {
            this.shadowRoot.appendChild(SafeDOM.el('div', { style: 'color:#94a3b8; font-size:0.8rem;' }, 'No card'));
            return;
        }

        const suitColors = {
            Diamonds: '#0284c7',
            Hearts: '#e11d48',
            Clubs: '#16a34a',
            Spades: '#334155',
            Wildcard: '#9333ea'
        };
        const suitIcons = {
            Diamonds: '♦',
            Hearts: '♥',
            Clubs: '♣',
            Spades: '♠',
            Wildcard: '★'
        };
        const suit = this.cardData.suit || 'Wildcard';
        const color = suitColors[suit] || '#334155';
        const icon = suitIcons[suit] || '🃟';

        const style = SafeDOM.el('style', {}, `
            :host { display: inline-block; }
            .card {
                width: 144px;
                background: ${this.selected ? '#eff6ff' : '#ffffff'};
                border: 2px solid ${this.selected ? '#2563eb' : '#cbd5e1'};
                border-radius: 10px;
                padding: 10px;
                box-shadow: ${this.selected ? '0 0 0 2px rgba(37,99,235,0.25)' : '0 2px 6px rgba(15,23,42,0.08)'};
                transition: transform 0.15s, border-color 0.15s;
                font-family: 'Inter', sans-serif;
                color: #0f172a;
                display: flex;
                flex-direction: column;
                gap: 6px;
                cursor: pointer;
            }
            .card:hover { transform: translateY(-2px); border-color: ${color}; }
            .card-top { display: flex; justify-content: space-between; align-items: center; font-weight: 800; color: ${color}; font-size: 0.95rem; }
            .card-name { font-size: 0.82rem; font-weight: 700; color: #1e293b; }
            .card-meaning { font-size: 0.72rem; color: #64748b; line-height: 1.3; }
            .card-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; margin-top: 4px; }
            .card-btn { border: none; border-radius: 4px; padding: 4px 6px; font-size: 0.7rem; font-weight: 700; cursor: pointer; background: #1e293b; color: #fff; }
            .card-btn.prep { background: #0284c7; }
            .card-btn.sig { background: #7c3aed; }
            .card-btn.disc { background: #b91c1c; }
        `);

        const cardEl = SafeDOM.el('div', {
            class: 'card',
            'data-card-id': this.cardData.id || '',
            onclick: () => {
                this.selected = !this.selected;
                if (typeof this.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
                    this.dispatchEvent(new CustomEvent('card-select', {
                        detail: { selected: this.selected, card: this.cardData },
                        bubbles: true,
                        composed: true
                    }));
                }
                this.render();
            }
        }, [
            SafeDOM.el('div', { class: 'card-top' }, [
                SafeDOM.el('span', {}, `${icon} ${SafeDOM.escape(suit)}`),
                SafeDOM.el('span', {}, `${this.cardData.pips ?? '?'}`)
            ]),
            SafeDOM.el('div', { class: 'card-name' }, SafeDOM.escape(this.cardData.name || 'Unnamed Card')),
            ...(this.cardData.meaning ? [SafeDOM.el('div', { class: 'card-meaning' }, SafeDOM.escape(this.cardData.meaning))] : [])
        ]);

        if (this.interactive) {
            const btn = (label, cls, action) => SafeDOM.el('button', {
                type: 'button',
                class: `card-btn ${cls}`,
                'data-card-action': action,
                onclick: (e) => {
                    e.stopPropagation();
                    this._emitAction(action);
                }
            }, label);

            cardEl.appendChild(SafeDOM.el('div', { class: 'card-actions' }, [
                btn('Play', '', 'play'),
                btn('Prepare', 'prep', 'prepare'),
                btn('Significator', 'sig', 'significator'),
                btn('Discard', 'disc', 'discard')
            ]));
        }

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(cardEl);
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('t13-yarn-card')) {
    customElements.define('t13-yarn-card', T13YarnCardWidget);
}
