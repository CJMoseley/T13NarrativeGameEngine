import CodexLoader from '@plugins/t13ne/modules/CodexLoader.js';
import Logger from '@/src/t13ne/core/Logger.js';

class T13NE_NarrativeTricks {
    constructor() {
        this.tricksData = [];
        this.trickTypesData = [];
        this.initialized = false;
        
        this.narrativeMeanings = {
            '2': 'Conflict, opposition and choices.',
            '3': 'Creativity and communication.',
            '4': 'Stability and foundations.',
            '5': 'Change and challenges.',
            '6': 'Harmony and adaptation.',
            '7': 'Surprises and secrets.',
            '8': 'Karma and retribution.',
            '9': 'Fortune and rewards.',
            '10': 'Completion and endings.',
            'Jack': 'Youth, high spirits, quarrels.',
            'Queen': 'Matriarchy, scandals, curiosity.',
            'King': 'Patriarchy, business, wisdom.',
            'Ace': 'Beginnings, meetings, unions.'
        };
    }

    async initialize() {
        if (this.initialized) return;
        try {
            this.tricksData = await CodexLoader.getData('narrativeTricks') || [];
            this.trickTypesData = await CodexLoader.getData('narrativeTrickTypes') || [];
            this.initialized = true;
            Logger.message('T13NE_NarrativeTricks: Initialized successfully.');
        } catch (error) {
            Logger.error(`T13NE_NarrativeTricks: Initialization failed: ${error}`);
        }
    }

    /**
     * Checks for available tricks given a set of played cards and the wild pool.
     * @param {Array} playedCards 
     * @param {Array} wildPool 
     * @returns {Array} List of identified tricks.
     */
    checkAvailableTricks(playedCards, wildPool) {
        const combined = [...(playedCards || []), ...(wildPool || [])];
        if (combined.length < 2) return [];

        const tricks = [];
        const rankCounts = {};

        // Count ranks
        combined.forEach(card => {
            // Use card name (e.g., 'Ace', '2') or pips if name not available
            let rank = card.name;
            if (!rank && card.pips) rank = String(card.pips);
            
            if (rank) {
                if (!rankCounts[rank]) rankCounts[rank] = [];
                rankCounts[rank].push(card);
            }
        });

        // Identify Sets
        for (const [rank, cards] of Object.entries(rankCounts)) {
            const meaning = this.narrativeMeanings[rank] || 'Unknown significance.';
            
            if (cards.length === 2) {
                tricks.push({
                    type: 'Pair',
                    rank: rank,
                    cards: cards,
                    description: `A Pair of ${rank}s. ${meaning}`,
                    modifier: 2 // Difficulty reduction
                });
            } else if (cards.length >= 3) {
                const type = cards.length === 3 ? 'Set' : 'Quad';
                const mod = cards.length === 3 ? 5 : 8;
                tricks.push({ type, rank, cards, description: `A ${type} of ${rank}s. ${meaning}`, modifier: mod });
            }
        }

        return tricks;
    }
}

export default new T13NE_NarrativeTricks();