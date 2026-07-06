import { SafeDOM } from '../t13ne/utils/SafeDOM.js';

export class T13YarnCardWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.cardData = null;
    }

    connectedCallback() {
        this.render();
    }

    setCard(data) {
        this.cardData = data; // { name, suit, pips, meaning }
        this.render();
    }

    render() {
        if (!this.cardData) return;
        const { name, suit, pips, meaning } = this.cardData;
        const isRed = suit === 'Diamonds' || suit === 'Hearts';

        const style = SafeDOM.el('style', {}, `
            :host { display: inline-block; perspective: 1000px; }
            .card {
                width: 100px;
                height: 140px;
                background: #fff;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                padding: 12px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                color: ${isRed ? '#ef4444' : '#1e293b'};
                font-family: 'JetBrains Mono', monospace;
                cursor: help;
                transition: transform 0.2s;
            }
            .card:hover { transform: translateY(-5px) rotateY(10deg); border-color: #3b82f6; }
            .corner { font-size: 1.25rem; font-weight: 800; line-height: 1; }
            .suit { font-size: 1rem; }
            .name { font-size: 0.65rem; text-align: center; text-transform: uppercase; font-weight: 700; margin-top: auto; }
            .meaning { display: none; }
        `);

        const card = SafeDOM.el('div', { class: 'card', title: meaning || name }, [
            SafeDOM.el('div', { class: 'corner' }, [
                SafeDOM.el('div', {}, String(pips)),
                SafeDOM.el('div', { class: 'suit' }, this.getSuitSymbol(suit))
            ]),
            SafeDOM.el('div', { class: 'name' }, SafeDOM.escape(name))
        ]);

        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(card);
    }

    getSuitSymbol(suit) {
        const symbols = { 'Hearts': '♥', 'Diamonds': '♦', 'Clubs': '♣', 'Spades': '♠' };
        return symbols[suit] || suit;
    }
}
customElements.define('t13-yarn-card', T13YarnCardWidget);
