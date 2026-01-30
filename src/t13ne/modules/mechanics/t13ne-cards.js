import PRNG from "../systems/t13ne-prng.js";
import CodexLoader from "../codex/CodexLoader.js"; // Import CodexLoader

class Card {
    constructor(data, sourceDeckId = 'base', backColor = 'blue') {
        this.data = data; // Store the entire data object
        this.id = this._generateCardId(data); // Generate a unique ID for the card instance
        this.name = data.Card;
        this.suit = data.Suit;
        this.pips = data.Pips;
        this.iconSuit = data.IconSuit;
        this.svg = data.Svg;
        this.className = this._deriveClassName(data.Suit);
        this.commands = data.Commands || {}; // For embedded commands
        this.sourceDeckId = sourceDeckId;
        this.backColor = backColor;
    }

    _generateCardId(data) {
        // Use Suit and Card to create a unique ID for the Card instance
        const cardName = data.Card.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return `${data.Suit}-${cardName}`;
    }

    _deriveClassName(suit) {
        switch (String(suit)) { // Ensure suit is treated as a string for comparison
            case "1": return "diamonds";
            case "2": return "hearts";
            case "3": return "clubs";
            case "4": return "spades";
            case "0": return "wildcard";
            default: return "";
        }
    }

    // A simple method to render the card
    render() {
        return `<div class="card ${this.className}" data-source-deck="${this.sourceDeckId}" style="border-color: ${this.backColor};">
                    <div class="card-pips">${this.pips}</div>
                    <div class="card-suit">${this.iconSuit}</div>
                    <div class="card-name">${this.name}</div>
                    <div class="card-description">${this.data.Narrative_Meaning || ''}</div>
                    <div class="card-source-deck">${this.sourceDeckId}</div>
                </div>`;
    }

    toString() {
        return `${this.name} (${this.pips} ${this.suit}) [${this.sourceDeckId}]`;
    }
}

class Deck {
    constructor(seed = Date.now()) {
        this.prng = PRNG.create(seed);
        this.sourceDecks = new Map(); // Stores { deckId -> { cards: Card[], backColor: string } }
        this.currentDeck = []; // The combined, shuffled deck
        this.discardPile = [];
        this.shufflePatterns = {
            'fisherYates': this._fisherYatesShuffle,
            'riffle': this._riffleShuffle,
            'overhand': this._overhandShuffle,
            'pile': this._pileShuffle,
            'mongean': this._mongeanShuffle
        };
    }

    /**
     * Adds a new source deck to the master deck.
     * @param {string} deckId - Unique identifier for this source deck.
     * @param {Array<Object>} cardIdentifiers - An array of objects, each with 'suit' and 'card' properties, e.g., [{ suit: '1', card: 'Ace' }].
     * Or an array of full card data objects.
     * @param {string} backColor - Color for the back of cards from this deck.
     */
    async addSourceDeck(deckId, cardDataOrIdentifiers, backColor = 'blue') {
        if (this.sourceDecks.has(deckId)) {
            console.warn(`Deck with ID '${deckId}' already exists. Overwriting.`);
        }

        const cards = [];
        const allCardsData = await CodexLoader.getAllCardData();

        if (!allCardsData) {
            console.error(`Deck: Cannot add source deck '${deckId}' because card data is not loaded.`);
            return;
        }

        for (const item of cardDataOrIdentifiers) {
            let cardData = null;
            // Check if item is a full card data object or an identifier
            if (item.Narrative_Meaning) { // Heuristic: if it has a complex property, it's full data
                cardData = item;
            } else if (item.suit && item.card) { // It's an identifier
                cardData = allCardsData.find(c => String(c.Suit) === String(item.suit) && c.Card === item.card);
            }

            if (cardData) {
                cards.push(new Card(cardData, deckId, backColor));
            } else {
                console.warn(`Could not find card data for:`, item);
            }
        }

        this.sourceDecks.set(deckId, { cards: cards, backColor: backColor });
        this._rebuildCurrentDeck();
    }

    /**
     * Removes a source deck from the master deck.
     * @param {string} deckId - Unique identifier of the source deck to remove.
     */
    removeSourceDeck(deckId) {
        if (!this.sourceDecks.has(deckId)) {
            console.warn(`Deck with ID '${deckId}' not found.`);
            return;
        }
        this.sourceDecks.delete(deckId);
        this._rebuildCurrentDeck();
    }

    /**
     * Rebuilds the current deck from all active source decks.
     * This method also clears the discard pile and the current deck.
     * The new deck is not shuffled by default.
     * @private
     */
    _rebuildCurrentDeck() {
        this.currentDeck = [];
        this.discardPile = [];
        for (const { cards } of this.sourceDecks.values()) {
            this.currentDeck.push(...cards);
        }
        console.log(`Current deck rebuilt with ${this.currentDeck.length} cards.`);
    }

    _fisherYatesShuffle() {
        // Fisher-Yates (Knuth) shuffle algorithm operates on currentDeck
        for (let i = this.currentDeck.length - 1; i > 0; i--) {
            const j = this.prng.nextInt(0, i);
            [this.currentDeck[i], this.currentDeck[j]] = [this.currentDeck[j], this.currentDeck[i]];
        }
    }

    _riffleShuffle() {
        const mid = Math.floor(this.currentDeck.length / 2);
        const left = this.currentDeck.slice(0, mid);
        const right = this.currentDeck.slice(mid);
        this.currentDeck = [];
        let i = 0, j = 0;
        while (i < left.length || j < right.length) {
            if (i < left.length && (j === right.length || this.prng.nextDouble() < 0.5)) {
                this.currentDeck.push(left[i++]);
            }
            if (j < right.length && (i === left.length || this.prng.nextDouble() < 0.5)) {
                this.currentDeck.push(right[j++]);
            }
        }
    }

    _overhandShuffle() {
        const tempDeck = [];
        let workingDeck = [...this.currentDeck];
        while (workingDeck.length > 0) {
            const numToTake = this.prng.nextInt(1, Math.min(workingDeck.length, Math.floor(this.currentDeck.length / 5))); // Take 1/5th of deck or less
            tempDeck.unshift(...workingDeck.splice(0, numToTake));
        }
        this.currentDeck = tempDeck;
    }

    _pileShuffle() {
        const numPiles = this.prng.nextInt(2, 7); // 2 to 7 piles
        const piles = Array.from({ length: numPiles }, () => []);
        let pileIndex = 0;
        for (const card of this.currentDeck) {
            piles[pileIndex].push(card);
            pileIndex = (pileIndex + 1) % numPiles;
        }
        this.currentDeck = piles.flat();
    }

    _mongeanShuffle() {
        const newDeck = [];
        for (let i = 0; i < this.currentDeck.length; i++) {
            const card = this.currentDeck[i];
            if (i % 2 === 0) { // Even position, put at top
                newDeck.unshift(card);
            } else { // Odd position, put at bottom
                newDeck.push(card);
            }
        }
        this.currentDeck = newDeck;
    }

    /**
     * Shuffles the current combined deck using specified patterns.
     * @param {string[]|string} patterns - A single shuffle pattern string or an array of shuffle pattern strings to apply sequentially.
     */
    shuffle(patterns = ['fisherYates']) {
        if (!Array.isArray(patterns)) {
            patterns = [patterns];
        }

        for (const pattern of patterns) {
            const shuffleFunc = this.shufflePatterns[pattern];
            if (shuffleFunc) {
                shuffleFunc.call(this); // Call the shuffle function in the context of the Deck instance
                console.log(`Deck shuffled using ${pattern} pattern.`);
            } else {
                console.warn(`Unknown shuffle pattern: ${pattern}. Skipping.`);
            }
        }
    }

    /**
     * Draws cards from the top of the current deck.
     * @param {number} numCards - The number of cards to draw.
     * @returns {Card[]} An array of drawn cards.
     */
    draw(numCards = 1) {
        if (numCards > this.currentDeck.length) {
            console.warn(`Not enough cards to draw ${numCards}. Drawing all remaining ${this.currentDeck.length} cards.`);
            numCards = this.currentDeck.length;
        }
        return this.currentDeck.splice(0, numCards);
    }

    /**
     * Adds cards to the discard pile.
     * @param {Card|Card[]} cards - A single card or an array of cards to discard.
     */
    discard(cards) {
        if (!Array.isArray(cards)) {
            cards = [cards];
        }
        this.discardPile.push(...cards);
        console.log(`Discarded ${cards.length} card(s). Discard pile size: ${this.discardPile.length}`);
    }

    /**
     * Returns the top card of the discard pile without removing it.
     * @returns {Card|null} The top card, or null if the discard pile is empty.
     */
    getTopDiscard() {
        return this.discardPile.length > 0 ? this.discardPile[this.discardPile.length - 1] : null;
    }

    /**
     * Resets the deck to its original state (rebuilds from source decks), clears discard, and reshuffles.
     * @param {string[]|string} shufflePatterns - The shuffle patterns to apply after resetting.
     */
    reset(shufflePatterns = ['fisherYates']) {
        this._rebuildCurrentDeck(); // Rebuilds from source decks and clears discard
        this.shuffle(shufflePatterns);
    }
}

const AllSuits = Object.freeze({
    DIAMONDS: "1",
    HEARTS: "2",
    CLUBS: "3",
    SPADES: "4",
    WILDCARD: "0"
});

export { Card, Deck, AllSuits };







