/**
 * @module Plugins/T13Ne/Ordeals
 * @description
 * This module defines the structure and logic for "Ordeals" in the T13NE system.
 * Ordeals are multi-stage, multi-round challenges that characters can face.
 */

import CodexLoader from '@plugins/t13ne/modules/CodexLoader.js';
import Logger from '@/src/t13ne/core/Logger.js';
import T13NECardsAPI from '@plugins/t13ne/modules/t13ne-cards-api.js';
import T13NE_Stakes from '@plugins/t13ne/modules//ordeals/t13ne-stakes.js';
import T13NE from '@plugins/t13ne/T13NE.js';
import T13NE_NarrativeTricks from '@plugins/t13ne/modules/ordeals/t13ne-narrative-tricks.js';

/**
 * @class OrdealStage
 * @description
 * Represents a single Stage within an Ordeal.
 * Stages act as narrative or physical steps that must be overcome.
 */
class OrdealStage {
    constructor(data, index) {
        this.index = index;
        this.type = data.Type || 'Generic';
        this.description = data.Description || `Stage ${index + 1}`;
        this.difficulty = 0;
        this.cards = [];
        this.obstacles = [];
        this.isComplete = false;
    }

    /**
     * Initializes the stage by drawing cards to determine difficulty and obstacles.
     * @param {number} baseDifficulty - Base difficulty from the Ordeal.
     * @param {string} [stakes='Low'] - The stakes of the ordeal.
     */
    initialize(baseDifficulty, stakes = 'Low') {
        // Draw cards to define the stage difficulty
        if (T13NECardsAPI.isInitialized) {
            const spread = T13NECardsAPI.getCardSpread('stage'); // Assuming a 'stage' spread exists or we draw manually
            if (spread && spread.cards) {
                this.cards = spread.cards.map(c => c.card);
                // Calculate difficulty from cards (sum of pips)
                this.difficulty = this.cards.reduce((sum, card) => sum + (parseInt(card.pips) || 0), 0);
            } else {
                // Fallback draw
                const cards = T13NECardsAPI.deck.draw(2);
                this.cards = cards;
                this.difficulty = cards.reduce((sum, card) => sum + (parseInt(card.pips) || 0), 0);
            }
        } else {
            this.difficulty = baseDifficulty || 10;
        }
        
        // Add Obstacles based on difficulty or random chance
        this.generateObstacles(stakes);
    }

    /**
     * Generates random obstacles based on difficulty and stakes.
     * @param {string} stakes 
     */
    generateObstacles(stakes) {
        const stakeData = T13NE_Stakes.getStake(stakes);
        const multiplier = stakeData ? (stakeData.Cost_Multiplier || 1) : 1;
        
        // Determine number of obstacles: roughly 1 per 15 difficulty points, minimum 1
        const numObstacles = Math.max(1, Math.floor(this.difficulty / 15));

        for (let i = 0; i < numObstacles; i++) {
            let obstacleDiff = Math.floor(Math.random() * 10) + 5; // Base 5-14
            obstacleDiff = Math.ceil(obstacleDiff * multiplier);
            
            let name = `Obstacle ${i + 1}`;
            let type = 'Generic';
            let description = 'A challenge to overcome.';

            if (T13NECardsAPI.isInitialized) {
                const card = T13NECardsAPI.deck.draw(1)[0];
                if (card) {
                    name = card.name;
                    obstacleDiff += (parseInt(card.pips) || 0);
                    
                    // Flavor based on suit (1=Diamonds, 2=Hearts, 3=Clubs, 4=Spades)
                    const s = String(card.suit);
                    if (s === '1' || s === 'Diamonds') type = 'Mental';
                    else if (s === '2' || s === 'Hearts') type = 'Social';
                    else if (s === '3' || s === 'Clubs') type = 'Physical';
                    else if (s === '4' || s === 'Spades') type = 'Mystical';
                    
                    description = card.description || card.data?.Narrative_Meaning || description;
                }
            }

            this.obstacles.push({
                name,
                type,
                description,
                difficulty: obstacleDiff,
                resolved: false
            });
        }
        Logger.message(`OrdealStage ${this.index}: Generated ${this.obstacles.length} obstacles (Stakes: ${stakes}).`);
    }
}

/**
 * @class OrdealRound
 * @description
 * Represents a single Round of time/action within an Ordeal.
 * Manages the Wild Pool and Phase sequence.
 */
class OrdealRound {
    constructor(number, stakesName) {
        this.number = number;
        this.stakesName = stakesName;
        this.wildPool = [];
        this.phases = [];
        this.isComplete = false;
        this.tideStats = {
            tricks: {},
            maxWound: {},
            soaked: {},
            prepMove: {},
            woundsTaken: {},
            carnageTaken: {}
        };
    }

    /**
     * Starts the round by dealing the Wild Pool.
     */
    start() {
        const poolSize = T13NE_Stakes.getWildPoolSize(this.stakesName) || 3;
        if (T13NECardsAPI.isInitialized) {
            this.wildPool = T13NECardsAPI.deck.draw(poolSize);
            Logger.message(`OrdealRound ${this.number}: Wild Pool dealt (${this.wildPool.length} cards).`);
        }
    }

    /**
     * Ends the round, clearing the pool.
     */
    end() {
        if (T13NECardsAPI.isInitialized && this.wildPool.length > 0) {
            T13NECardsAPI.discard(this.wildPool);
        }
        this.wildPool = [];
        this.isComplete = true;
    }

    /**
     * Records a statistic for Tide of Battle calculations.
     * @param {string} charId 
     * @param {string} type - 'tricks', 'maxWound', 'soaked', 'prepMove', 'woundsTaken', 'carnageTaken'
     * @param {number} value 
     */
    recordStat(charId, type, value) {
        if (!this.tideStats[type]) return;
        if (type === 'maxWound') {
            this.tideStats[type][charId] = Math.max(this.tideStats[type][charId] || 0, value);
        } else {
            this.tideStats[type][charId] = (this.tideStats[type][charId] || 0) + value;
        }
    }

    /**
     * Checks for potential tricks using the current wild pool.
     * @param {Array} playedCards - Cards played by a character.
     * @returns {Array} List of possible tricks.
     */
    checkTricks(playedCards) {
        return T13NE_NarrativeTricks.checkAvailableTricks(playedCards, this.wildPool);
    }
}

/**
 * @class Ordeal
 * @description
 * Represents an active Ordeal instance.
 * Manages the state of the "mini-game".
 */
class Ordeal {
    /**
     * @constructor
     * @param {object} config - The configuration for the Ordeal.
     * @param {string} [config.id] - The ID of the Ordeal.
     * @param {string} [config.type='Generic'] - The type of the Ordeal.
     * @param {string} [config.stakes='Low'] - The stakes level of the Ordeal.
     * @param {object} [config.plot=null] - The plot associated with the Ordeal.
     * @param {Array<object>} [config.participants=[]] - The characters participating in the Ordeal.
     * @param {number} [config.numStages=3] - The number of stages in the Ordeal.
     */
    constructor(config) {
        this.id = config.id || Date.now();
        this.type = config.type || 'Generic';
        this.stakes = config.stakes || 'Low';
        this.plot = config.plot || null;
        this.participants = config.participants || []; // Array of Character objects
        
        this.stages = [];
        this.rounds = []; // Rounds for the current stage
        this.currentStageIndex = 0;
        this.currentRoundIndex = 0;
        this.isActive = true;

        // Initialize State Machine
        const StateMachine = T13NE.getModule('StateMachine');
        this.stateMachine = StateMachine ? StateMachine.createOrdealMachine(this) : null;
        
        this.setupStages(config.numStages || 3);
    }

    /**
     * Sets up the stages for the Ordeal.
     * @param {number} numStages 
     */
    setupStages(numStages) {
        for (let i = 0; i < numStages; i++) {
            const stage = new OrdealStage({ Type: 'Standard' }, i);
            stage.initialize(10, this.stakes); // Base difficulty, pass stakes
            this.stages.push(stage);
        }
    }

    /**
     * Starts the ordeal.
     */
    start() {
        if (this.stateMachine && this.stateMachine.getState() === 'Pending') {
            this.stateMachine.transition('START');
        }
    }

    /**
     * Starts a new Round.
     * @returns {OrdealRound} The new round.
     */
    nextRound() {
        if (this.rounds.length > 0) {
            this.rounds[this.rounds.length - 1].end();
        }
        
        this.currentRoundIndex++;
        const round = new OrdealRound(this.currentRoundIndex, this.stakes);
        round.start();
        this.rounds.push(round);
        
        Logger.message(`Ordeal ${this.id}: Started Round ${this.currentRoundIndex} at ${this.stakes} Stakes.`);
        return round;
    }

    /**
     * Gets the current active stage.
     * @returns {OrdealStage}
     */
    getCurrentStage() {
        return this.stages[this.currentStageIndex];
    }

    /**
     * Gets the current active round.
     * @returns {OrdealRound}
     */
    getCurrentRound() {
        return this.rounds[this.rounds.length - 1];
    }

    /**
     * Resolves an action taken by a participant.
     * @param {object} character - The character acting.
     * @param {string} actionType - The type of action (e.g., 'Attack', 'Move').
     * @param {object} options - Additional options.
     * @returns {Promise<object>} The result of the action.
     * @async
     */
    async resolveAction(character, actionType, options = {}) {
        const Tests = T13NE.getModule('Tests');
        if (!Tests) return { success: false, message: 'Tests module not found.' };

        const currentStage = this.getCurrentStage();
        const currentRound = this.getCurrentRound();

        // Logic to determine difficulty based on Stage, Stakes, and Action
        let difficulty = currentStage.difficulty;
        let appliedTricks = [];

        // Check for Narrative Tricks if cards are played
        if (options.playedCards && currentRound) {
            const tricks = currentRound.checkTricks(options.playedCards);
            if (tricks.length > 0) {
                Logger.message(`Ordeal ${this.id}: Potential Narrative Tricks found: ${tricks.map(t => t.description).join(', ')}`);
                
                // Apply trick effects (Difficulty Reduction)
                tricks.forEach(trick => {
                    let reduction = trick.modifier || 0;
                    
                    if (!reduction) {
                        if (trick.type === 'Pair') reduction = 2;
                        else if (trick.type === 'Set') reduction = 5;
                    }
                    
                    if (reduction > 0) {
                        difficulty = Math.max(0, difficulty - reduction);
                        Logger.message(`Ordeal ${this.id}: Applied trick '${trick.type}' - Difficulty reduced by ${reduction}.`);
                    }
                });
                appliedTricks = tricks;
            }
        }

        // Perform the test using 'Ordeal' type to apply Stakes multipliers
        const result = await Tests.performTest('Ordeal', character, { 
            difficulty: difficulty,
            stakes: this.stakes,
            ...options 
        });

        // Check if the action resolved the final obstacle
        const stage = this.getCurrentStage();
        if (stage && stage.obstacles.every(o => o.resolved)) {
            this.stateMachine.transition('STAGE_CLEARED');
        }

        if (appliedTricks.length > 0) {
            result.tricks = appliedTricks;
            this.recordTideStat(character.id || character.name, 'tricks', appliedTricks.length);
        }

        // Handle success/failure logic specific to Ordeals
        if (result.success) {
            Logger.message(`Ordeal ${this.id}: ${character.name} succeeded in ${actionType}.`);
            // Check if stage is complete (simplified logic)
            if (actionType === 'Move' || actionType === 'Progress') {
                this.advanceStage();
            }
        } else {
            Logger.message(`Ordeal ${this.id}: ${character.name} failed in ${actionType}.`);
            // Handle failure consequences (Stress, Wounds, etc.)
        }

        return result;
    }

    /**
     * Resolves a specific obstacle in the current stage.
     * @param {object} character - The character attempting the resolution.
     * @param {number} obstacleIndex - Index of the obstacle in the current stage.
     * @param {string} method - 'test', 'resource', 'annex'.
     * @param {object} options - { facet, resourceType, amount, annexId, ... }
     * @returns {Promise<object>} The result of the resolution attempt.
     * @async
     */
    async resolveObstacle(character, obstacleIndex, method, options = {}) {
        const currentStage = this.getCurrentStage();
        if (!currentStage) return { success: false, message: 'No active stage.' };

        const obstacle = currentStage.obstacles[obstacleIndex];
        if (!obstacle) return { success: false, message: 'Obstacle not found.' };
        if (obstacle.resolved) return { success: true, message: 'Obstacle already resolved.' };

        let swayTotal = 0;
        let details = [];
        const Resources = T13NE.getModule('Resources');
        const Tests = T13NE.getModule('Tests');

        // 1. Handle Resource Payment (Spending Sway)
        if (method === 'resource' || options.paySway) {
            if (Resources) {
                const resourceType = options.resourceType || 'Chi';
                // If paying specifically, amount is the limit. If method is resource, amount defaults to difficulty.
                const amountToPay = options.amount || (method === 'resource' ? obstacle.difficulty : 0);
                
                if (amountToPay > 0) {
                    if (Resources.makePayment(character, resourceType, amountToPay)) {
                        swayTotal += amountToPay;
                        details.push(`Paid ${amountToPay} ${resourceType}`);
                    } else {
                        details.push(`Failed to pay ${amountToPay} ${resourceType}`);
                    }
                }
            }
        }

        // 2. Handle Tests (Generating Sway)
        const isTest = ['test', 'annex', 'dice', 'card', 'value', 'ordeal'].includes(method) || options.performTest;
        
        if (isTest) {
            if (Tests) {
                const testType = (method === 'test' || method === 'annex') ? 'Dice' : (method === 'ordeal' ? 'Ordeal' : method);
                const testOptions = {
                    difficulty: obstacle.difficulty, // Pass difficulty for success check context
                    facet: options.facet || 'Awe', 
                    ...options
                };

                if (!options.facet && obstacle.type) {
                    if (obstacle.type === 'Mental') testOptions.facet = 'Key';
                    else if (obstacle.type === 'Social') testOptions.facet = 'Dominion';
                    else if (obstacle.type === 'Physical') testOptions.facet = 'Zeal';
                    else if (obstacle.type === 'Mystical') testOptions.facet = 'Wyrd';
                }

                const testResult = await Tests.performTest(testType, character, testOptions);
                
                // Extract Sway/Score from result
                let generatedSway = testResult.total || testResult.actorValue || 0;
                swayTotal += generatedSway;
                details.push(`Generated ${generatedSway} Sway via ${testType} Test`);
                if (testResult.details) details.push(...(Array.isArray(testResult.details) ? testResult.details : [testResult.details]));
            }
        }

        // 3. Check Resolution
        if (swayTotal >= obstacle.difficulty) {
            obstacle.resolved = true;
            Logger.message(`Ordeal ${this.id}: Obstacle ${obstacleIndex} (${obstacle.name}) resolved by ${character.name}.`);
            return { success: true, message: 'Obstacle resolved.', details: details, totalSway: swayTotal };
        } else {
            return { success: false, message: 'Insufficient Sway to resolve obstacle.', details: details, totalSway: swayTotal, required: obstacle.difficulty };
        }
    }

    /**
     * Advances to the next stage.
     */
    advanceStage() {
        if (this.stateMachine.getState() === 'StageEnd') {
            if (this.currentStageIndex < this.stages.length - 1) {
                this.stages[this.currentStageIndex].isComplete = true;
                this.currentStageIndex++;
                this.rounds = []; // Clear rounds for the new stage
                this.currentRoundIndex = 0;
                this.stateMachine.transition('ADVANCE');
            } else {
                this.stateMachine.transition('FINISH');
            }
        } else {
            Logger.warn(`Ordeal ${this.id}: Cannot advance stage from state '${this.stateMachine.getState()}'.`);
        }
    }

    /**
     * Completes the Ordeal.
     * @param {boolean} fromStateMachine - Flag to prevent recursive calls.
     */
    completeOrdeal(fromStateMachine = false) {
        if (this.stateMachine && !fromStateMachine) this.stateMachine.transition('FINISH');
        this.isActive = false;
        Logger.message(`Ordeal ${this.id}: Completed successfully.`);
        // Trigger rewards/resolution
    }

    /**
     * Records a statistic for Tide of Battle calculations.
     * @param {string} charId 
     * @param {string} type - 'tricks', 'maxWound', 'soaked', 'prepMove', 'woundsTaken', 'carnageTaken'
     * @param {number} value 
     */
    recordTideStat(charId, type, value) {
        const round = this.getCurrentRound();
        if (round) round.recordStat(charId, type, value);
    }

    /**
     * Calculates the Tide of Battle for the current round.
     * @returns {object} Result with flowing, ebbing, and card.
     */
    calculateTideOfBattle() {
        const round = this.getCurrentRound();
        if (!round) return null;

        const participants = this.participants.map(p => p.id || p.name);
        
        // Calculate Flowing (Tricks > Max Wound > Soaked > Prep/Move)
        const flowSorted = [...participants].sort((a, b) => {
            const stats = round.tideStats;
            const diffTricks = (stats.tricks[b] || 0) - (stats.tricks[a] || 0);
            if (diffTricks !== 0) return diffTricks;
            
            const diffWound = (stats.maxWound[b] || 0) - (stats.maxWound[a] || 0);
            if (diffWound !== 0) return diffWound;

            const diffSoak = (stats.soaked[b] || 0) - (stats.soaked[a] || 0);
            if (diffSoak !== 0) return diffSoak;

            return (stats.prepMove[b] || 0) - (stats.prepMove[a] || 0);
        });

        // Calculate Ebbing (Wounds Taken > Carnage Taken)
        const ebbSorted = [...participants].sort((a, b) => {
            const stats = round.tideStats;
            const diffWounds = (stats.woundsTaken[b] || 0) - (stats.woundsTaken[a] || 0);
            if (diffWounds !== 0) return diffWounds;

            return (stats.carnageTaken[b] || 0) - (stats.carnageTaken[a] || 0);
        });

        const flowing = flowSorted[0];
        const ebbing = ebbSorted[0];

        // Draw Tide Card
        let tideCard = null;
        if (T13NECardsAPI.isInitialized) {
            const drawn = T13NECardsAPI.deck.draw(1);
            if (drawn.length > 0) tideCard = drawn[0];
        }
        
        Logger.message(`Ordeal ${this.id}: Tide of Battle - Flowing: ${flowing}, Ebbing: ${ebbing}, Card: ${tideCard ? tideCard.name : 'None'}`);

        return { flowing, ebbing, card: tideCard };
    }
}

/**
 * @class T13NE_Ordeals
 * @description
 * Module for handling T13NE Ordeals.
 * Acts as a master system for OrdealRounds and OrdealStages.
 */
class T13NE_Ordeals {
    constructor() {
        this.ordealTypes = [];
        this.terrains = [];
        this.activeOrdeals = [];
        this.initialized = false;
    }

    /**
     * Initializes the Ordeals module by loading data.
     * @async
     */
    async initialize() {
        if (this.initialized) return;
        try {
            this.ordealTypes = await CodexLoader.getData('ordealTypes');
            this.terrains = await CodexLoader.getData('ordealTerrain');
            this.initialized = true;
            Logger.message('T13NE_Ordeals: Initialized successfully.');
        } catch (error) {
            Logger.error(`T13NE_Ordeals: Initialization failed: ${error}`);
        }
    }

    /**
     * Creates and starts a new Ordeal.
     * @param {string} type - The type of Ordeal (e.g., 'Chase').
     * @param {string} stakes - The stakes level (e.g., 'High').
     * @param {Array} participants - Array of Character objects.
     * @param {object} plot - The Plot object overseeing this.
     * @returns {Ordeal} The created Ordeal instance.
     */
    createOrdeal(type, stakes, participants, plot) {
        const ordeal = new Ordeal({
            type,
            stakes,
            participants,
            plot
        });
        
        // Start the ordeal process
        ordeal.start();
        
        this.activeOrdeals.push(ordeal);
        return ordeal;
    }

    /**
     * Retrieves an active Ordeal by ID.
     * @param {number} id 
     * @returns {Ordeal|null}
     */
    getOrdeal(id) {
        return this.activeOrdeals.find(o => o.id === id) || null;
    }
}

export { Ordeal, OrdealRound, OrdealStage };
export default new T13NE_Ordeals();