import Logger from "@/src/t13ne/core/Logger.js";
import T13NE from '@plugins/t13ne/T13NE.js';

class T13NECardsUI {
    constructor() {
        this.container = null;
        this.cardsAPI = null;
        this.draggedCard = null;
    }

    async initialize(container) {
        this.container = container;
        this.cardsAPI = T13NE.getModule('CardsAPI');
        if (!this.cardsAPI) {
            Logger.error('T13NECardsUI: CardsAPI not found.');
            return;
        }

        this.render();
        this.setupEventListeners();
    }

    render() {
        if (!this.container) return;

        const gameModule = T13NE.getModule('Game');
        const activeGame = gameModule?.getActiveGame();

        this.container.innerHTML = `
            <div class="card-table">
                <div class="card-table-sidebar">
                    <div class="deck-area">
                        <h3>Deck</h3>
                        <div class="deck-visual" id="deck-draw-pile" title="Draw Card">
                            <div class="card-back blue"></div>
                            <span class="card-count">${this.cardsAPI.deck.currentDeck.length}</span>
                        </div>
                        <div class="discard-visual" id="deck-discard-pile">
                            ${this.cardsAPI.deck.discardPile.length > 0 ? this.cardsAPI.deck.discardPile[this.cardsAPI.deck.discardPile.length - 1].render() : '<div class="card-empty">Discard</div>'}
                            <span class="card-count">${this.cardsAPI.deck.discardPile.length}</span>
                        </div>
                    </div>

                    <div class="pools-area">
                        <h3>Communal Pools</h3>
                        <div class="pool" id="pool-general" data-pool-id="general">
                            <h4>General Pool</h4>
                            <div class="cards-shelf">
                                ${(this.cardsAPI.pools['general'] || []).map(c => this.renderCard(c)).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card-table-main">
                    <div class="active-spreads-area" id="active-spreads">
                        <h3>Active Spreads</h3>
                        ${(this.cardsAPI.activeSpreads || []).map(s => this.renderSpread(s)).join('')}
                        <div class="spread-controls">
                            <select id="spread-selector">
                                <option value="">Draw New Spread...</option>
                                ${Object.keys(this.cardsAPI.spreadDefinitions).map(id => `<option value="${id}">${this.cardsAPI.spreadDefinitions[id].name}</option>`).join('')}
                            </select>
                            <button id="btn-draw-spread">Draw</button>
                        </div>
                    </div>

                    <div class="hands-area">
                        <h3>Character Hands</h3>
                        <div class="hands-shelf">
                            ${(activeGame?.characters || []).map(charId => {
            const char = gameModule.getEntity(charId);
            return this.renderHand(charId, char?.name || charId);
        }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachInteractions();
    }

    renderCard(card) {
        if (!card) return '';
        // Wrap the standard Card.render() with a draggable container
        return `
            <div class="card-wrapper" draggable="true" data-card-id="${card.id}" data-suit="${card.suit}" data-name="${card.name}">
                ${card.render()}
            </div>
        `;
    }

    renderHand(ownerId, ownerName) {
        const hand = this.cardsAPI.hands[ownerId] || [];
        return `
            <div class="hand-container" data-owner-id="${ownerId}">
                <h4>${ownerName}</h4>
                <div class="cards-shelf hand-drop-zone" data-owner-id="${ownerId}">
                    ${hand.map(c => this.renderCard(c)).join('')}
                </div>
                <button class="btn-draw-to-hand" data-owner-id="${ownerId}">Draw</button>
            </div>
        `;
    }

    renderSpread(spread) {
        const def = this.cardsAPI.spreadDefinitions[spread.spreadId];
        return `
            <div class="spread-container" data-spread-id="${spread.id}">
                <h4>${def?.name || spread.spreadId}</h4>
                <div class="spread-slots">
                    ${def?.cardPositions?.map(pos => {
            const cardAtPos = spread.cards.find(sc => sc.position.role === pos.role);
            return `
                            <div class="spread-slot slot-drop-zone" data-spread-id="${spread.id}" data-role="${pos.role}">
                                <div class="slot-label">${pos.role}</div>
                                ${cardAtPos ? this.renderCard(cardAtPos.card) : '<div class="slot-empty">+</div>'}
                                <div class="slot-desc">${pos.description || ''}</div>
                            </div>
                        `;
        }).join('') || '<div class="no-positions">No positions defined</div>'}
                </div>
                <button class="btn-close-spread" data-spread-id="${spread.id}">Close</button>
            </div>
        `;
    }

    setupEventListeners() {
        this.container.addEventListener('click', async (e) => {
            if (e.target.closest('#btn-draw-spread')) {
                const spreadId = this.container.querySelector('#spread-selector').value;
                if (spreadId) {
                    const result = this.cardsAPI.getCardSpread(spreadId);
                    if (result) {
                        // Create a new active spread from the result
                        const newSpread = {
                            id: `spread-${Date.now()}`,
                            spreadId: spreadId,
                            cards: result.cards
                        };
                        this.cardsAPI.activeSpreads.push(newSpread);
                        this.cardsAPI.persistToGame();
                        this.render();
                    }
                }
            }

            if (e.target.closest('.btn-draw-to-hand')) {
                const ownerId = e.target.closest('.btn-draw-to-hand').dataset.ownerId;
                this.cardsAPI.drawToHand(ownerId);
                this.render();
            }

            if (e.target.closest('#deck-draw-pile')) {
                // Default: Draw to a general pool or first hand?
                // For now, let's just draw to general pool
                const cards = this.cardsAPI.deck.draw(1);
                if (cards.length > 0) {
                    this.cardsAPI.moveToPool(cards[0], 'general');
                    this.render();
                }
            }

            if (e.target.closest('.btn-close-spread')) {
                const spreadId = e.target.closest('.btn-close-spread').dataset.spreadId;
                const idx = this.cardsAPI.activeSpreads.findIndex(s => s.id === spreadId);
                if (idx !== -1) {
                    // Move cards to discard?
                    const spread = this.cardsAPI.activeSpreads[idx];
                    spread.cards.forEach(sc => this.cardsAPI.moveToDiscard(sc.card));
                    this.cardsAPI.activeSpreads.splice(idx, 1);
                    this.cardsAPI.persistToGame();
                    this.render();
                }
            }
        });
    }

    attachInteractions() {
        const wrappers = this.container.querySelectorAll('.card-wrapper');
        wrappers.forEach(w => {
            w.addEventListener('dragstart', (e) => {
                this.draggedCardId = e.target.closest('.card-wrapper').dataset.cardId;
                e.dataTransfer.setData('text/plain', this.draggedCardId);
                e.target.classList.add('dragging');
            });

            w.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
            });
        });

        const dropZones = this.container.querySelectorAll('.hand-drop-zone, .slot-drop-zone, .discard-visual, .pool');
        dropZones.forEach(dz => {
            dz.addEventListener('dragover', (e) => {
                e.preventDefault();
                dz.classList.add('drag-over');
            });

            dz.addEventListener('dragleave', () => {
                dz.classList.remove('drag-over');
            });

            dz.addEventListener('drop', (e) => {
                e.preventDefault();
                dz.classList.remove('drag-over');
                const cardId = e.dataTransfer.getData('text/plain');
                this.handleDrop(cardId, dz);
            });
        });
    }

    handleDrop(cardId, target) {
        // Find the card instance
        const card = this.findCardById(cardId);
        if (!card) return;

        if (target.classList.contains('hand-drop-zone')) {
            const ownerId = target.dataset.ownerId;
            if (!this.cardsAPI.hands[ownerId]) this.cardsAPI.hands[ownerId] = [];
            this.cardsAPI.removeFromCurrentLocation(card);
            this.cardsAPI.hands[ownerId].push(card);
        } else if (target.classList.contains('slot-drop-zone')) {
            const spreadId = target.dataset.spreadId;
            const role = target.dataset.role;
            this.cardsAPI.moveToSpread(card, spreadId, role);
        } else if (target.classList.contains('discard-visual')) {
            this.cardsAPI.moveToDiscard(card);
        } else if (target.dataset.poolId) {
            this.cardsAPI.moveToPool(card, target.dataset.poolId);
        }

        this.cardsAPI.persistToGame();
        this.render();
    }

    findCardById(id) {
        // Search through all possible card locations
        const allHands = Object.values(this.cardsAPI.hands).flat();
        const allPools = Object.values(this.cardsAPI.pools).flat();
        const allSpreads = this.cardsAPI.activeSpreads.flatMap(s => s.cards.map(sc => sc.card));

        return allHands.find(c => c.id === id) ||
            allPools.find(c => c.id === id) ||
            allSpreads.find(c => c.id === id) ||
            this.cardsAPI.deck.currentDeck.find(c => c.id === id) ||
            this.cardsAPI.deck.discardPile.find(c => c.id === id);
    }
}

export default new T13NECardsUI();







