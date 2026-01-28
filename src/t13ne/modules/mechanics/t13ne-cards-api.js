/**
 * @module Plugins/T13Ne/CardsAPI
 * @description
 * This module provides an API for working with decks of cards, drawing spreads, and interpreting them.
 * It uses the CodexLoader to get card data and PRNG for randomness.
 */

import { Card, Deck } from '@/src/t13ne/modules/mechanics/t13ne-cards.js';
import PRNG from '@/src/t13ne/modules/systems/t13ne-prng.js';
import dice from '@/src/t13ne/modules/mechanics/t13ne-dice.js';
import Logger from '@/js/core/Logger.js';
import CodexLoader from '@/src/t13ne/modules/codex/CodexLoader.js'; // Import CodexLoader

// Helper function to gather entropy from various browser sources
async function gatherEntropy() {
    let entropy = '';

    // 1. window.crypto for strong randomness
    if (window.crypto && window.crypto.getRandomValues) {
        const randomArray = new Uint32Array(10); // Get 10 random 32-bit integers
        window.crypto.getRandomValues(randomArray);
        entropy += Array.from(randomArray).join('');
    }

    // 2. High-resolution time stamps
    entropy += performance.now().toString();
    entropy += Date.now().toString();

    // 3. User interaction (if available) - this would typically be a listener
    // For now, we just add a placeholder string, real implementation would be event-driven
    entropy += 'userinteraction';

    // 4. Screen/Window properties
    entropy += window.screen.width;
    entropy += window.screen.height;
    entropy += window.screen.colorDepth;
    entropy += window.innerHeight;
    entropy += window.innerWidth;

    // 5. Navigator properties
    entropy += navigator.userAgent;
    entropy += navigator.hardwareConcurrency;
    entropy += navigator.deviceMemory;

    return entropy;
}

/**
 * @class T13NECardsAPI
 * @description
 * Provides an API for working with decks of cards, drawing spreads, and interpreting them.
 */
class T13NECardsAPI {
    /**
     * @constructor
     * @param {string|null} [seed=null] - The seed for the random number generator.
     */
    constructor(seed = null) {
        this.seed = seed;
        this.deck = new Deck(seed); // Initialize the Master Deck immediately
        this.spreadDefinitions = {}; // Store loaded spread definitions
        this.isInitialized = false;
        this.activeGameId = null;

        // Visual State Collections
        this.hands = {}; // ownerId -> Card[]
        this.pools = {}; // poolId -> Card[]
        this.activeSpreads = []; // { id, spreadId, cards: {card, position}[] }
    }

    /**
     * Initializes the Cards API.
     * This method sets up the PRNG, loads the base deck of cards, and loads the spread definitions.
     * @async
     */
    async initialize(t13ne) {
        if (this.isInitialized) return;
        this.t13ne = t13ne;

        if (this.seed === null) {
            // Gather entropy from various sources for seeding
            const collectedEntropy = await gatherEntropy();
            this.seed = collectedEntropy;
        }
        PRNG.setSeed(this.seed); // Set global PRNG seed for dice and other uses
        Logger.message("T13NECardsAPI: PRNG initialized with seed:", this.seed);

        await this.loadSpreadDefinitions(); // Load spread definitions

        // Check for active game and sync
        const GameModule = this.t13ne.getModule('Game');
        if (GameModule) {
            const activeGame = GameModule.getActiveGame();
            if (activeGame) {
                await this.syncWithGame(activeGame);
            }
        } else {
            // Fallback for standalone use
            await this.addBaseDeck('base-0', 'blue');
            await this.addBaseDeck('base-1', 'red');
        }

        this.isInitialized = true;
        Logger.message("T13NECardsAPI: Initialized successfully.");
    }

    /**
     * Loads the base set of cards (from cards.json) as a source deck.
     * @param {string} deckId - ID for this source deck.
     * @param {string} backColor - Color for the back of cards from this deck.
     * @param {string} path - Path to the cards.json file.
     * @returns {Promise<boolean>} True if successful, false otherwise.
     * @async
     */
    async addBaseDeck(deckId = 'base', backColor = 'blue') {
        const allCardsData = await CodexLoader.getAllCardData();

        if (!allCardsData || allCardsData.length === 0) {
            Logger.error('T13NECardsAPI: Card data not loaded or empty. Cannot add base deck.');
            return false;
        }

        await this.deck.addSourceDeck(deckId, allCardsData, backColor);
        Logger.message(`T13NECardsAPI: Base deck '${deckId}' loaded.`);
        return true;
    }

    /**
     * Calculates required number of decks based on player count.
     * Formula: 1 + max(1, ceil(numPlayers / 4))
     */
    calculateRequiredDecks(numPlayers) {
        const decksNeeded = 1 + Math.max(1, Math.ceil(numPlayers / 4));
        return decksNeeded;
    }

    /**
     * Synchronizes the Cards API with the given Game instance.
     * @param {T13Game} game 
     */
    async syncWithGame(game) {
        if (!game) return;
        this.activeGameId = game.id;

        // 1. Scale Decks
        const numPlayers = game.characters.length || 1; // At least 1 player
        const needed = this.calculateRequiredDecks(numPlayers);

        // Count existing "base" decks
        const currentBaseCount = Array.from(this.deck.sourceDecks.keys())
            .filter(k => k.startsWith('base-')).length;

        if (currentBaseCount === 0 && !this.deck.sourceDecks.has('base')) {
            // First time setup - add required number of decks
            for (let i = 0; i < needed; i++) {
                await this.addBaseDeck(`base-${i}`, i % 2 === 0 ? 'blue' : 'red');
            }
        } else if (currentBaseCount < needed) {
            // Add more decks if needed
            for (let i = currentBaseCount; i < needed; i++) {
                await this.addBaseDeck(`base-${i}`, i % 2 === 0 ? 'blue' : 'red');
            }
        }

        // 2. Load persistent state if it exists
        if (game.cardState && game.cardState.decks && game.cardState.decks.length > 0) {
            // Restore deck and discard
            this.deck.currentDeck = this._restoreCards(game.cardState.decks);
            this.deck.discardPile = this._restoreCards(game.cardState.discard);

            // Restore Hands
            this.hands = {};
            for (const [ownerId, serializedHand] of Object.entries(game.cardState.hands || {})) {
                this.hands[ownerId] = this._restoreCards(serializedHand);
            }

            // Restore Pools
            this.pools = {};
            for (const [poolId, serializedPool] of Object.entries(game.cardState.pools || {})) {
                this.pools[poolId] = this._restoreCards(serializedPool);
            }

            // Restore Spreads
            this.activeSpreads = (game.cardState.spreads || []).map(s => ({
                id: s.id,
                spreadId: s.spreadId,
                cards: s.cards.map(sc => ({
                    card: this._restoreCards([sc.card])[0],
                    position: sc.position
                })).filter(sc => !!sc.card)
            }));

            Logger.message(`T13NECardsAPI: Restored full card state from Game "${game.name}"`);
        } else {
            // New game state - initial shuffle
            this.deck.shuffle(['fisherYates', 'riffle']);
            this.persistToGame();
        }
    }

    _restoreCards(serializedCards) {
        if (!serializedCards) return [];
        // Map back to Card instances. We need full card data.
        // This is tricky because we usually draw from sourceDecks.
        // For persistence, we might just store { suit, card, sourceDeckId }
        const allDecks = Array.from(this.deck.sourceDecks.values()).flatMap(d => d.cards);
        return serializedCards.map(s => {
            return allDecks.find(c => String(c.suit) === String(s.suit) && c.name === s.name && c.sourceDeckId === s.sourceDeckId) || null;
        }).filter(c => !!c);
    }

    /**
     * Persists the current card state to the active Game.
     */
    persistToGame() {
        const GameModule = this.t13ne?.getModule('Game');
        const game = GameModule?.getActiveGame();
        if (!game || game.id !== this.activeGameId) return;

        const serialize = (c) => ({ suit: c.suit, name: c.name, sourceDeckId: c.sourceDeckId });

        game.cardState.decks = this.deck.currentDeck.map(serialize);
        game.cardState.discard = this.deck.discardPile.map(serialize);

        // Sync Hands
        game.cardState.hands = {};
        for (const [ownerId, hand] of Object.entries(this.hands || {})) {
            game.cardState.hands[ownerId] = hand.map(serialize);
        }

        // Sync Pools
        game.cardState.pools = {};
        for (const [poolId, pool] of Object.entries(this.pools || {})) {
            game.cardState.pools[poolId] = pool.map(serialize);
        }

        // Sync Spreads
        game.cardState.spreads = (this.activeSpreads || []).map(s => ({
            id: s.id,
            spreadId: s.spreadId,
            cards: s.cards.map(sc => ({
                card: serialize(sc.card),
                position: sc.position
            }))
        }));

        game.lastModified = Date.now();
    }

    /**
     * Draws a card to a specific hand.
     */
    drawToHand(ownerId) {
        if (!this.hands[ownerId]) this.hands[ownerId] = [];

        const cards = this.deck.draw(1);
        if (cards.length > 0) {
            this.hands[ownerId].push(cards[0]);
            this.persistToGame();
            return cards[0];
        }
        return null;
    }

    /**
     * Moves a card to a spread position.
     */
    moveToSpread(card, spreadId, positionRole) {
        let spread = this.activeSpreads.find(s => s.id === spreadId);
        if (!spread) {
            const def = this.spreadDefinitions[spreadId];
            if (!def) {
                // If spreadId is actually a spread definition ID, create it
                spread = { id: spreadId, spreadId: spreadId, cards: [] };
                this.activeSpreads.push(spread);
            } else {
                spread = { id: `spread-${Date.now()}`, spreadId: spreadId, cards: [] };
                this.activeSpreads.push(spread);
            }
        }

        // Find position definition if possible
        const def = this.spreadDefinitions[spread.spreadId];
        const posDef = def?.cardPositions?.find(p => p.role === positionRole);

        this.removeFromCurrentLocation(card);

        spread.cards.push({ card, position: posDef || { role: positionRole } });
        this.persistToGame();
        return true;
    }

    /**
     * Moves a card to a communal pool.
     */
    moveToPool(card, poolId = 'general') {
        if (!this.pools[poolId]) this.pools[poolId] = [];
        this.removeFromCurrentLocation(card);
        this.pools[poolId].push(card);
        this.persistToGame();
        return true;
    }

    /**
     * Moves a card to discard.
     */
    moveToDiscard(card) {
        this.removeFromCurrentLocation(card);
        this.deck.discard(card);
        this.persistToGame();
        return true;
    }

    /**
     * Removes a card from all managed collections.
     */
    removeFromCurrentLocation(card) {
        // Search hands
        for (const hand of Object.values(this.hands)) {
            const idx = hand.indexOf(card);
            if (idx !== -1) { hand.splice(idx, 1); return; }
        }
        // Search pools
        for (const pool of Object.values(this.pools)) {
            const idx = pool.indexOf(card);
            if (idx !== -1) { pool.splice(idx, 1); return; }
        }
        // Search spreads
        for (const spread of this.activeSpreads) {
            const idx = spread.cards.findIndex(sc => sc.card === card);
            if (idx !== -1) { spread.cards.splice(idx, 1); return; }
        }
        // Search deck
        const dIdx = this.deck.currentDeck.indexOf(card);
        if (dIdx !== -1) { this.deck.currentDeck.splice(dIdx, 1); return; }

        // Search discard
        const discIdx = this.deck.discardPile.indexOf(card);
        if (discIdx !== -1) { this.deck.discardPile.splice(discIdx, 1); return; }
    }

    /**
     * Adds a custom deck of cards to the master deck.
     * @param {string} deckId - Unique identifier for this source deck.
     * @param {Array<Object>} cardIdentifiers - Array of card identifiers, e.g., [{ suit: '1', card: 'Ace' }].
     * @param {string} backColor - Color for the back of cards from this deck.
     * @async
     */
    async addCustomDeck(deckId, cardIdentifiers, backColor = 'green') {
        await this.deck.addSourceDeck(deckId, cardIdentifiers, backColor);
        Logger.message(`T13NECardsAPI: Custom deck '${deckId}' added.`);
    }

    /**
     * Removes a source deck from the master deck.
     * @param {string} deckId - The ID of the source deck to remove.
     */
    removeDeck(deckId) {
        this.deck.removeSourceDeck(deckId);
        Logger.message(`T13NECardsAPI: Deck '${deckId}' removed.`);
    }

    /**
     * Loads card spread definitions from a JSON file.
     * @param {string} [path='/plugins/t13ne/data/cardspreads.json'] - The path to the spread definitions file.
     * @returns {Promise<boolean>} True if successful, false otherwise.
     * @async
     */
    async loadSpreadDefinitions(path = '/plugins/t13ne/data/cardspreads.json') {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data && Array.isArray(data.spreads)) {
                data.spreads.forEach(spread => {
                    this.spreadDefinitions[spread.id] = spread;
                });
                Logger.message(`T13NECardsAPI: Loaded ${data.spreads.length} spread definitions.`);
            } else {
                Logger.warn('T13NECardsAPI: No "spreads" array found in cardspreads.json.');
            }
            return true;
        } catch (error) {
            Logger.error(`T13NECardsAPI: Error loading cardspreads.json: ${error}`);
            return false;
        }
    }

    /**
     * Draws cards for a specific spread defined in cardspreads.json.
     * @param {string} spreadId - The ID of the spread to use (e.g., "three-card-past-present-future").
     * @returns {{cards: {card: Card, position: object}[], diceRoll: number|null, topDiscard: Card|null, spreadDefinition: object|null}|null} An object containing drawn cards, dice roll, top discard, and the spread definition.
     */
    getCardSpread(spreadId) {
        if (!this.isInitialized || !this.deck) {
            Logger.error('T13NECardsAPI: Not initialized or deck not loaded. Call initialize() first.');
            return null;
        }

        const spreadDef = this.spreadDefinitions[spreadId];
        if (!spreadDef) {
            Logger.error(`T13NECardsAPI: Spread definition for ID "${spreadId}" not found.`);
            return null;
        }

        const { numCards, shufflePatterns, includeDiceRoll, cardPositions } = spreadDef;

        this.deck.reset(shufflePatterns); // Reset and reshuffle for each new spread with specified patterns
        const drawnCards = this.deck.draw(numCards);
        Logger.message(`T13NECardsAPI: Drawn ${drawnCards.length} cards for spread "${spreadId}".`);

        let diceResult = null;
        if (includeDiceRoll) {
            diceResult = dice.RNG(1, 6); // Example: Roll a d6
            Logger.message(`T13NECardsAPI: Dice Roll: ${diceResult}`);
        }

        // Combine drawn cards with their position definitions
        const spreadResultCards = drawnCards.map((card, index) => ({
            card: card,
            position: cardPositions[index] || null // Attach the position definition
        }));

        return {
            cards: spreadResultCards,
            diceRoll: diceResult,
            topDiscard: this.deck.getTopDiscard(), // Include the top card of the discard pile
            spreadDefinition: spreadDef
        };
    }

    /**
     * Plays a card, triggering its onPlay commands if any.
     * @param {Card} card - The card to play.
     * @param {object} context - The context for command execution.
     * @async
     */
    async playCard(card, context = {}) {
        if (!card) return;

        Logger.message(`T13NECardsAPI: Playing card: ${card.name}`);

        // TODO: Trigger onPlay commands if card.commands.onPlay exists
        if (card.commands && card.commands.onPlay) {
            const Commands = this.t13ne?.getModule('Commands');
            if (Commands) {
                Logger.message(`T13NECardsAPI: Executing onPlay command for ${card.name}: ${card.commands.onPlay}`);
                await Commands.execute(card.commands.onPlay, context);
            }
        }

        this.deck.discard(card);
    }

    /**
     * Delegates to the master deck's discard method.
     * @param {Card|Card[]} cards - A single card or an array of cards to discard.
     */
    discard(cards) {
        if (!this.isInitialized || !this.deck) {
            Logger.error('T13NECardsAPI: Not initialized or deck not loaded. Call initialize() first.');
            return;
        }
        const cardsArray = Array.isArray(cards) ? cards : [cards];

        // TODO: Trigger onDiscard commands
        for (const card of cardsArray) {
            if (card.commands && card.commands.onDiscard) {
                const Commands = this.t13ne?.getModule('Commands');
                if (Commands) {
                    Logger.message(`T13NECardsAPI: Executing onDiscard command for ${card.name}: ${card.commands.onDiscard}`);
                    Commands.execute(card.commands.onDiscard, {}); // Pass appropriate context
                }
            }
        }
        this.deck.discard(cardsArray);
    }

    /**
     * Delegates to the master deck's getTopDiscard method.
     * @returns {Card|null} The top card of the discard pile, or null if empty.
     */
    getTopDiscard() {
        if (!this.isInitialized || !this.deck) {
            Logger.error('T13NECardsAPI: Not initialized or deck not loaded. Call initialize() first.');
            return null;
        }
        return this.deck.getTopDiscard();
    }

    /**
     * Generates a composite spread made of multiple smaller spreads.
     * @param {string} spreadId - The ID of the composite spread (e.g., 'frame-act').
     * @returns {object|null} An object containing the named sub-spreads.
     */
    getCompositeSpread(spreadId, options = {}) {
        // This is a proof-of-concept. A more robust system would use definitions.
        if (spreadId === 'frame-act') {
            const numSides = options.sides || 2; // Example for a simple conflict
            const hooks = [];
            for (let i = 0; i < numSides; i++) {
                hooks.push({ name: `Hook for Side ${i + 1}`, spread: this.getCardSpread('hook') });
            }
            const revelation = this.getCardSpread('revelation');

            return {
                name: 'Frame Act Spread',
                components: {
                    hooks: hooks,
                    revelation: revelation
                },
                description: "The Frame Act introduces the conflict by Hooking the participants and providing an initial Revelation."
            };
        }

        if (spreadId === 'loom-act') {
            const numPairs = options.pairs || options.sides || 2;
            const pairs = [];
            for (let i = 0; i < numPairs; i++) {
                pairs.push({
                    name: `Warp/Weft Pair ${i + 1}`,
                    warp: this.getCardSpread('warp'),
                    weft: this.getCardSpread('weft')
                });
            }
            return {
                name: 'Loom Act Spread',
                components: { pairs },
                description: "The Loom Act develops the conflict through a series of actions (Warps) and reactions (Wefts)."
            };
        }

        if (spreadId === 'zenith-act') {
            return {
                name: 'Zenith Act Spread',
                components: {
                    ordeal: this.getCardSpread('ordeal'),
                    gain: this.getCardSpread('gain')
                },
                description: "The Zenith Act is the climax, featuring a final Ordeal and a resulting Gain or loss."
            };
        }

        if (spreadId === 'logue-act') {
            const components = {
                revelation: this.getCardSpread('revelation')
            };
            if (options.includeWarp) components.warp = this.getCardSpread('warp');
            if (options.includeWeft) components.weft = this.getCardSpread('weft');
            return {
                name: 'Logue Act Spread',
                components,
                description: "A Logue (Prologue/Epilogue) provides exposition or resolution, centered around a Revelation."
            };
        }

        if (spreadId === 'story-3-act') {
            return {
                name: '3 Act Story Spread',
                components: {
                    frame: this.getCompositeSpread('frame-act', options),
                    loom: this.getCompositeSpread('loom-act', options),
                    zenith: this.getCompositeSpread('zenith-act', options)
                },
                description: "A standard 3-Act story structure, comprising a Frame (setup), Loom (confrontation), and Zenith (resolution)."
            };
        }

        if (spreadId === 'arc') {
            const numStories = options.stories || 2; // Default to 2 stories per arc
            const stories = [];
            for (let i = 0; i < numStories; i++) {
                stories.push({
                    name: `Story line ${i + 1}`,
                    spread: this.getCompositeSpread('story-3-act', options)
                });
            }
            return {
                name: 'Story Arc',
                components: { stories },
                description: `An Arc, composed of ${numStories} interwoven story lines.`
            };
        }

        if (spreadId === 'volume') {
            const numArcs = options.arcs || 3;
            const arcs = [];
            for (let i = 0; i < numArcs; i++) {
                arcs.push({
                    name: `Arc ${i + 1}`,
                    spread: this.getCompositeSpread('arc', options)
                });
            }
            return {
                name: 'Volume',
                components: { arcs },
                description: `A Volume, a major narrative block composed of ${numArcs} Arcs.`
            };
        }

        if (spreadId === 'epic') {
            const numVolumes = options.volumes || 3;
            const volumes = [];
            for (let i = 0; i < numVolumes; i++) {
                volumes.push({
                    name: `Volume ${i + 1}`,
                    spread: this.getCompositeSpread('volume', options)
                });
            }
            return {
                name: 'Epic',
                components: { volumes },
                description: `An Epic, a grand narrative composed of ${numVolumes} Volumes.`
            };
        }

        if (spreadId === 'cycle') {
            const numEpics = options.epics || 3;
            const epics = [];
            for (let i = 0; i < numEpics; i++) {
                epics.push({ name: `Epic ${i + 1}`, spread: this.getCompositeSpread('epic', options) });
            }
            return {
                name: 'Cycle',
                components: { epics },
                description: `A Cycle, the largest narrative structure, composed of ${numEpics} Epics.`
            };
        }
        // Add logic for 'loom', 'zenith', 'logue' here if needed.
        Logger.error(`Composite spread '${spreadId}' is not implemented.`);
        return null;
    }

    /**
     * Extracts relevant text from a card for AI prompt generation, based on specified options.
     * @param {Card} card - The card object.
     * @param {object} [options] - Options to control which fields are included and how the text is formatted.
     * @param {string[]} [options.fieldsToInclude=['name', 'suit', 'pips', 'type', 'description', 'ability']] - Array of card properties to include.
     * @param {string[]} [options.suitFieldsToInclude=['Ordeal_Text', 'Tarot_Text']] - Array of suit properties to include.
     * @param {string} [options.prefix=''] - String to prepend to the extracted text.
     * @param {string} [options.suffix=''] - String to append to the extracted text.
     * @returns {string} A formatted string containing key information about the card.
     */
    extractCardTextForAI(card, options = {}) {
        if (!(card instanceof Card)) {
            Logger.warn('T13NECardsAPI: Provided object is not a Card instance for AI text extraction.');
            return '';
        }

        const position = options.position || { role: 'Card' };
        return this.getCartomancyInterpretation(card, position);
    }

    /**
     * Generates a narrative interpretation of a card in a specific spread position for AI consumption.
     * @param {Card} card The card object.
     * @param {object} position The position definition from the spread.
     * @returns {string} A descriptive string for an AI prompt.
     */
    getCartomancyInterpretation(card, position) {
        if (!card || !position) return '';

        const role = position.role || 'This card';
        const description = position.description || '';
        const cardName = card.name;
        const tarot = card.data.Tarot_Text || '';
        const narrative = card.data.Narrative_Meaning || '';

        // Build a sentence.
        let interpretation = `${role} is represented by '${cardName}'.`;
        if (description) {
            interpretation += ` This position signifies: ${description}`;
        }
        if (tarot) {
            interpretation += ` In cartomancy, this suggests themes of '${tarot}'.`;
        }
        if (narrative) {
            interpretation += ` Narratively, it points towards '${narrative}'.`;
        }

        return interpretation;
    }

    /**
     * Finds a value within a card's data structure, including nested objects.
     * @private
     */
    _findValueInCard(card, key) {
        if (!(card instanceof Card)) {
            Logger.warn('T13NECardsAPI: Provided object is not a Card instance.');
            return '';
        }

        const defaultFields = ['name', 'suit', 'pips', 'type', 'description', 'ability', 'sourceDeckId'];

        let cardDetails = [];

        // Helper to find value in data structure
        const findValue = (obj, key) => {
            if (!obj) return undefined;
            if (obj.hasOwnProperty(key)) return obj[key];

            // Search specific sub-objects known in the system
            const subObjects = ['Yarn', 'Ordeal', 'Obstacle', 'Tarot', 'Revelation', 'Lea', 'Stress', 'Trauma', 'Age'];
            for (const sub of subObjects) {
                if (obj[sub] && typeof obj[sub] === 'object' && obj[sub].hasOwnProperty(key)) {
                    return obj[sub][key];
                }
            }
            return undefined;
        };

        let value = undefined;
        if (card.hasOwnProperty(key)) {
            value = card[key];
        } else if (card.data) {
            value = findValue(card.data, key);
        }
        if (value === undefined && card.suitData) {
            value = findValue(card.suitData, key);
        }
        return value;
    }

    /**
     * Extracts relevant text from a spread result for AI prompt generation, applying specific options per card position.
     * @param {{card: Card, position: object}[]} spreadResultCards - Array of objects, each containing a Card and its position definition.
     * @returns {string[]} An array of formatted strings, one for each card.
     */
    extractCardsTextForAI(spreadResultCards) {
        if (!Array.isArray(spreadResultCards)) {
            Logger.warn('T13NECardsAPI: Provided object is not an array of spread result cards.');
            return [];
        }
        return spreadResultCards.map(item => {
            const card = item.card;
            const position = item.position || { role: 'Card' };
            return this.getCartomancyInterpretation(card, position);
        }).filter(text => text !== '');
    }
}

export default new T13NECardsAPI();





