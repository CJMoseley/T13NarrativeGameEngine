/**
 * T13NE Drama Module
 * Handles Drama, Tension, and Stress relief systems.
 * Implements logic for Atmospherics, Hazards, Prods, Breaks, and Ratchets.
 */
import CodexLoader from "../codex/CodexLoader.js";
import Logger from "../../core/Logger.js";
import T13Dice from '../mechanics/t13ne-dice.js';
import T13NECardsAPI from "../mechanics/t13ne-cards-api.js";
import T13NE_Facets from "../mechanics/t13ne-facets.js";

/**
 * Module for handling T13NE Drama, Tension, and Stress relief systems.
 */
class T13NE_Drama {
    constructor() {
        this.dramaPool = []; // Array of { value: number|null, source: string, type: string }
        this.latentLimit = 6; // Default Latent Drama Pool Limit
        this.tensionLevel = 0; // Current Tension Level (0-6+)
        this.initialized = false;

        this.data = {
            diceTypes: [],
            poolTypes: [],
            hazards: [],
            prods: [],
            breaks: [],
            ratchets: [],
            atmospherics: [] // Placeholder for atmospheric descriptions
        };

        // Mapping of die roll (doubles) to Drama Type
        this.DRAMA_TYPES = {
            1: 'Atmospheric',
            2: 'Narrative Moment',
            3: 'Hazard',
            4: 'Prod',
            5: 'Break',
            6: 'Ratchet'
        };
    }

    /**
     * Initializes the Drama module by loading data from the codex.
     * @param {object} t13ne - The main T13NE instance.
     */
    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;
        try {
            // Load configuration and narrative data
            const [diceTypes, poolTypes, hazards, prods, breaks] = await Promise.all([
                CodexLoader.getData('dramaDice'),
                CodexLoader.getData('dramaPools'),
                CodexLoader.getData('NarrativeHazards'),
                CodexLoader.getData('NarrativeProds'),
                CodexLoader.getData('NarrativeBreaks')
            ]);

            this.data.diceTypes = diceTypes || [];
            this.data.poolTypes = poolTypes || [];
            this.data.hazards = hazards || [];
            this.data.prods = prods || [];
            this.data.breaks = breaks || [];
            this.data.ratchets = await CodexLoader.getData('drama', 'NarrativeRatchets.json') || [];
            this._loadDefaultAtmospherics();

            this.initialized = true;
            Logger.message('T13NE_Drama: Initialized successfully.');
        } catch (error) {
            Logger.error(`T13NE_Drama: Initialization failed: ${error}`);
        }
    }

    _loadDefaultAtmospherics() {
        // Defaults based on T13NE Rules "Drama" page
        this.data.atmospherics = {
            'Contemporary': [
                { text: "Social media notifications ping incessantly.", sfx: "notification_ping", vfx: "screen_glare" },
                { text: "Distant sirens wail.", sfx: "siren_wail_dist" },
                { text: "Traffic noise swells.", sfx: "traffic_city" },
                { text: "A phone vibrates on a table.", sfx: "phone_vibrate", vfx: "shake_small" },
                { text: "Neon signs buzz and flicker.", sfx: "neon_buzz", lighting: { type: "flicker", color: "#FF00FF", duration: 1000 } }
            ],
            'Horror': [
                { text: "A wolf howls in the distance.", sfx: "wolf_howl" },
                { text: "A candle gutters and dims.", lighting: { type: "dim_flicker", intensity: 0.3, duration: 2500 } },
                { text: "Strange knocking on the walls.", sfx: "knocking_wood_3" },
                { text: "A floorboard creaks behind you.", sfx: "creak_wood" },
                { text: "The wind whistles through a crack.", sfx: "wind_whistle" },
                { text: "Shadows lengthen unnaturally.", lighting: { type: "shadow_grow", duration: 5000 } }
            ],
            'Fantasy': [
                { text: "Weird tracks found in the mud.", vfx: "highlight_tracks" },
                { text: "Strange noises from a bush.", sfx: "rustle_bush" },
                { text: "Enchanted mushrooms glow softly.", lighting: { type: "pulse", color: "#00FF00", intensity: 0.4 } },
                { text: "Distant thunder rolls.", sfx: "thunder_dist" }
            ],
            'Sci-Fi': [
                { text: "Two suns setting cast long shadows.", lighting: { type: "sunset_double", color: "#FF4400" } },
                { text: "Holographic advertising drones glitch.", sfx: "static_burst", vfx: "hologram_glitch" },
                { text: "A ship engine rumbles overhead.", sfx: "spaceship_flyby" }
            ],
            'Cyberpunk': [
                { text: "Flickering LEDs illuminate the rain.", lighting: { type: "strobe", color: "#00FFFF" }, vfx: "rain_overlay" },
                { text: "Pink noise music thumps nearby.", sfx: "music_muffled_bass" },
                { text: "Surveillance drones hum past.", sfx: "drone_hover" }
            ]
        };
    }

    /**
     * Sets the current Tension Level of the Scene/Plot.
     * @param {number} level - The tension level (usually 0-6).
     */
    setTensionLevel(level) {
        this.tensionLevel = level;
        // Latent limit might adjust based on tension rules, typically 6 or determined by Plot
        Logger.message(`T13NE_Drama: Tension Level set to ${this.tensionLevel}.`);
    }

    /**
     * Adds a Drama Die to the pool.
     * @param {string} [type='Standard'] - The type of drama die (e.g., 'Character', 'Atmospheric').
     * @param {string} [source='Unknown'] - The source of the die (e.g., Character Name).
     * @returns {object|null} Returns a Latent Drama object if triggered, otherwise null.
     */
    addDramaDie(type = 'Standard', source = 'Unknown') {
        const die = { type, source, value: null };
        this.dramaPool.push(die);
        Logger.message(`T13NE_Drama: Added  die from . Pool size: ${this.dramaPool.length}`);

        if (this.dramaPool.length >= this.latentLimit) {
            return this.triggerLatentDrama();
        }
        return null;
    }

    /**
     * Rolls the current Drama Pool and checks for Drama (doubles).
     * @returns {Array<object>|null} An array of triggered Drama events, or null if none.
     */
    rollDramaPool() {
        if (this.dramaPool.length === 0) return null;

        const counts = {};
        const diceByValue = {};

        // Roll all dice that haven't been rolled or re-roll all? 
        // Typically the whole pool is rolled when checked.
        this.dramaPool.forEach(die => {
            die.value = T13Dice.RNG(1, 6);
            counts[die.value] = (counts[die.value] || 0) + 1;
            if (!diceByValue[die.value]) diceByValue[die.value] = [];
            diceByValue[die.value].push(die);
        });

        Logger.message(`T13NE_Drama: Rolled Pool: ${this.dramaPool.map(d => d.value).join(', ')}`);

        const triggeredDramas = [];

        // Check for doubles or more
        // Optional Rule: Remove additional dice?
        const removeExtra = this.t13ne?.getModule('Commands')?.isRuleEnabled('Drama:RemoveExtraDice');

        for (const [value, count] of Object.entries(counts)) {
            if (count >= 2) {
                const dramaType = this.DRAMA_TYPES[value];
                triggeredDramas.push({
                    type: dramaType,
                    roll: parseInt(value),
                    count: count,
                    dice: diceByValue[value]
                });
            }
        }

        if (triggeredDramas.length > 0) {
            // Remove the dice that triggered drama to prevent immediate re-triggering (Drama Storm prevention)
            const diceToRemove = triggeredDramas.flatMap(d => d.dice);

            // If optional rule is NOT enabled, we might keep some? 
            // Standard rule says remove them. Optional rule says remove *additional*.
            // For now, standard behavior:
            this.dramaPool = this.dramaPool.filter(d => !diceToRemove.includes(d));
            Logger.message(`T13NE_Drama: Triggered ${triggeredDramas.length} Drama(s). Removed ${diceToRemove.length} dice.`);
            return triggeredDramas;
        }

        return null;
    }

    /**
     * Triggers Latent Drama, emptying the pool and returning a Latent Drama event.
     * @returns {object} The Latent Drama event.
     */
    triggerLatentDrama() {
        Logger.message("T13NE_Drama: Latent Drama Triggered! Pool emptied.");
        const poolSize = this.dramaPool.length;
        this.dramaPool = []; // Empty the pool

        // Latent Drama always includes Atmospheric/Narrative Moment + Hazard + (Prod/Break/Ratchet)
        return {
            type: 'Latent Drama',
            poolSize: poolSize,
            components: [
                { type: 'Atmospheric', description: 'A moment of atmosphere or character reflection.' },
                { type: 'Hazard', description: 'A complication or danger arises.' },
                { type: 'Choice', options: ['Prod', 'Break', 'Ratchet'], description: 'The Yarn-Teller chooses to Prod, Break, or Ratchet.' }
            ]
        };
    }

    /**
     * Resolves the stress relief for a specific Drama type.
     * @param {string} dramaType - The type of drama (e.g., 'Hazard', 'Break').
     * @returns {number} The amount of stress to relieve.
     */
    getStressRelief(dramaType) {
        switch (dramaType) {
            case 'Atmospheric': return 1;
            case 'Narrative Moment': return T13Dice.RNG(1, 6); // Variable based on Facet usually
            case 'Hazard': return Math.max(2, T13Dice.RNG(1, 6));
            case 'Prod': return 2;
            case 'Break': return 999; // Relieves all stress
            case 'Ratchet': return T13Dice.RNG(2, 10); // Variable (Rule: 2-10)
            default: return 0;
        }
    }

    /**
     * Triggers an Atmospheric event based on genre.
     * @param {string} [genre='Contemporary'] 
       * @param {object} [character=null] - The character experiencing the atmospheric (for stress relief).
       * @returns {object} The atmospheric event object { type, text, stressRelief, appliedTo }.
     */
    triggerAtmospheric(genre = 'Contemporary', character = null) {
        const list = this.data.atmospherics[genre] || this.data.atmospherics['Contemporary'];
        const entry = list[Math.floor(Math.random() * list.length)];

        // Handle both string (legacy) and object formats
        const atmosphericText = typeof entry === 'string' ? entry : entry.text;
        const effects = typeof entry === 'object' ? entry : {};

        const stressRelief = this.getStressRelief('Atmospheric');

        let result = {
            type: 'Atmospheric',
            text: atmosphericText,
            stressRelief: stressRelief,
            appliedTo: null,
            ...effects // Spread sfx, vfx, lighting into the result
        };

        if (character && typeof character.relieveStress === 'function') {
            character.relieveStress(stressRelief);
            result.appliedTo = character.name;
        }

        Logger.message(`T13NE_Drama: Triggered Atmospheric (${genre}): ${atmosphericText}`);
        return result;
    }

    /**
     * Triggers a Narrative Moment for a character based on their highest Facet.
     * @param {object} character 
     * @returns {Promise<string>} The narrative moment description.
     */
    async triggerNarrativeMoment(character) {
        if (!character || !character.facetweb) return "A moment of introspection.";

        // Find highest facet
        let highestFacet = null;
        let maxBoon = -1;

        if (character.facetweb.Stats) {
            character.facetweb.Stats.forEach(stat => {
                if (stat.Facet_Boon > maxBoon) {
                    maxBoon = stat.Facet_Boon;
                    highestFacet = stat.Facet;
                }
            });
        }

        if (highestFacet !== null) {
            const facetName = (await T13NE_Facets.getFacet(highestFacet)).FacetName;
            const moment = await T13NE_Facets.getFacetAspect(highestFacet, 'Narrative_Moment');
            Logger.message(`T13NE_Drama: Triggered Narrative Moment for ${character.name} (${facetName}): ${moment}`);
            return moment || `A moment defined by ${facetName}.`;
        }
        return "A quiet character moment.";
    }

    /**
     * Retrieves a random entry from the loaded data for a specific drama type.
     * @param {string} type - 'Hazard', 'Prod', 'Break'.
     * @returns {object|string}
     */
    async getRandomDramaEntry(type) {
        let list = [];
        if (type === 'Hazard') list = this.data.hazards;
        else if (type === 'Prod') list = this.data.prods;
        else if (type === 'Break') list = this.data.breaks;

        if (list && list.length > 0) {
            const entry = list[Math.floor(Math.random() * list.length)];

            // Check for T13NEC command replacement
            // If entry has a RULES key, we might need to execute it via Commands module
            if (entry && entry.RULES && this.t13ne) {
                const Commands = this.t13ne.getModule('Commands');
                if (Commands) {
                    // Execute the command found in RULES (or T13NEC if updated data)
                    // Assuming the RULES string is the command for now
                    const result = await Commands.execute(entry.RULES, { type });
                    if (result) {
                        // Return the result or modified entry
                        return { ...entry, executed: true, result };
                    }
                }
            }
            return entry;
        }
        return `Generic `;
    }

    /**
     * Triggers a Ratchet event based on the current Tension Level and Plot context.
     * Ratchets progress based on tension or sequential activation.
     * @param {object} plot - The plot triggering the ratchet.
     * @param {string} [type='General'] - The type of ratchet (e.g., 'Security', 'Dominance').
     * @returns {object} The ratchet event.
     */
    triggerRatchet(plot, type = 'General') {
        const tension = plot?.tensionLevel ?? this.tensionLevel;

        // 1. Identify valid ratchet for the plot
        let ratchet = null;
        if (plot && plot.ratchets && plot.ratchets.length > 0) {
            ratchet = plot.ratchets.find(r => r.type === type) || plot.ratchets[0];
        }

        if (!ratchet) {
            ratchet = this.data.ratchets.find(r => r.type === type) || this.data.ratchets[0];
        }

        if (!ratchet) {
            // Fallback generic Ratchet if no data
            const levels = [
                { description: "Strange smells on the air.", stressRelief: 10, tension: 0 },
                { description: "Animals behave strangely.", stressRelief: 8, tension: 1 },
                { description: "Rumbling noises, but no lightning.", stressRelief: 6, tension: 2 },
                { description: "Birds leave the area.", stressRelief: 5, tension: 3 },
                { description: "Strange auras around the mountain at night.", stressRelief: 4, tension: 4 },
                { description: "Volcano erupts!", stressRelief: 3, tension: 5 },
                { description: "Pyroclastic flow!", stressRelief: 2, tension: 6 }
            ];
            const idx = Math.min(tension, levels.length - 1);
            const entry = levels[idx];
            return { ...entry, ratchetName: 'Volcanic (Fallback)', level: tension };
        }

        // 2. Ladder Progression Logic
        // If the ratchet has a current level tracked on the plot, we might increment it
        let currentIdx = 0;
        if (plot) {
            if (!plot._ratchetStates) plot._ratchetStates = {};
            const rId = ratchet.id || ratchet.name;
            currentIdx = plot._ratchetStates[rId] || 0;

            // Advance the ladder if tension is high enough or if triggered sequentially
            // Rule: "each time the Ratchet is 'activated' the Ratchet will climb or fall a layer"
            // We'll advance it but cap it by tension level if the ratchet is tension-bound
            if (ratchet.tensionBound) {
                currentIdx = Math.min(tension, ratchet.levels.length - 1);
            } else {
                currentIdx = Math.min(currentIdx + 1, ratchet.levels.length - 1);
            }
            plot._ratchetStates[rId] = currentIdx;
        } else {
            currentIdx = Math.min(tension, ratchet.levels.length - 1);
        }

        const entry = ratchet.levels[currentIdx];
        const result = {
            ...entry,
            ratchetName: ratchet.name,
            level: currentIdx,
            tension: tension,
            stressRelief: entry.stressRelief || this.getStressRelief('Ratchet')
        };

        Logger.message(`T13NE_Drama: Triggered Ratchet (${ratchet.name}) at Index ${currentIdx} (Tension ${tension}): ${entry.description}`);
        return result;
    }

    /**
     * Initiates a Dramatic Challenge between Yarn-Tellers.
     * @param {Array<object>} participants - Array of { name, currentStress }.
     * @param {string} dramaType - The drama being narrated.
     * @returns {object} A new DramaticChallenge instance.
     */
    createChallenge(participants, dramaType) {
        return new DramaticChallenge(participants, dramaType);
    }

    /**
     * Initiates a Narrative Showdown.
     * @param {object} challenger 
     * @param {object} defendant 
     * @param {object} scene 
     * @returns {object} A new NarrativeShowdown instance.
     */
    createShowdown(challenger, defendant, scene) {
        return new NarrativeShowdown(challenger, defendant, scene);
    }

    /**
     * Initiates a Quantum Contest.
     * @param {Array} participants 
     * @param {object} scene 
     * @returns {object} A new QuantumContest instance.
     */
    createQuantumContest(participants, scene) {
        return new QuantumContest(participants, scene);
    }
}

/**
 * Helper class to manage a Dramatic Challenge bidding war.
 */
class DramaticChallenge {
    constructor(participants, dramaType) {
        this.participants = participants.map(p => ({ ...p, bid: 0, shocked: false }));
        this.dramaType = dramaType;
        this.currentHighBid = 0;
        this.winner = null;
        this.log = [];
    }

    /**
     * Places a bid for a participant.
     * @param {string} participantName 
     * @param {number} bidAmount - Stress willing to take.
     * @returns {boolean} True if bid accepted (must be higher than current).
     */
    placeBid(participantName, bidAmount) {
        const p = this.participants.find(p => p.name === participantName);
        if (!p || p.shocked) return false;

        if (bidAmount > this.currentHighBid) {
            this.currentHighBid = bidAmount;
            p.bid = bidAmount;
            this.log.push(` bids  Stress.`);
            return true;
        }
        return false;
    }

    /**
     * Resolves the challenge. The highest bidder takes the stress.
     * If they shock, they drop out and the next highest is considered (simplified here).
     * @returns {object} Result { winner, shockedParticipants }.
     */
    resolve() {
        // Sort by bid descending
        const sorted = [...this.participants].sort((a, b) => b.bid - a.bid);

        for (const p of sorted) {
            if (p.bid > 0 && !p.shocked) {
                // Check if taking this stress shocks them
                // (Simplified logic: assuming max stress is known or passed, here we just return the stress to apply)
                this.winner = p;
                this.log.push(`${p.name} wins with ${p.bid} Stress.`);
                return {
                    winner: p.name,
                    stressCost: p.bid,
                    losersRelief: true // Losers "lose" stress equal to their bids (relieve it)
                };
            }
        }
        return { winner: null, message: "No valid bids." };
    }
}

/**
 * Helper class to manage a Narrative Showdown.
 */
class NarrativeShowdown {
    constructor(challenger, defendant, scene) {
        this.challenger = challenger;
        this.defendant = defendant;
        this.scene = scene;
        this.cards = { challenger: null, defendant: null, judgement: null };
        this.bid = { amount: 0, currency: 'Yarn', aspect: 'Warp', bidder: null, currentTurn: challenger };
        this.state = 'Initiated';
        this.log = [];
    }

    async start() {
        if (!T13NECardsAPI.isInitialized) return;
        const drawn = T13NECardsAPI.deck.draw(2);
        this.cards.challenger = drawn[0];
        this.cards.defendant = drawn[1];
        this.state = 'Bidding';
        this.bid.currentTurn = this.challenger;
        this.log.push(`Showdown started. Challenger (${this.challenger.name}) drew ${this.cards.challenger.name}. Defendant (${this.defendant.name}) drew ${this.cards.defendant.name}.`);
        return this.cards;
    }

    placeOpeningBid(amount, currency, aspect) {
        if (this.state !== 'Bidding' || this.bid.currentTurn !== this.challenger) return false;
        this.bid.amount = amount;
        this.bid.currency = currency;
        this.bid.aspect = aspect;
        this.bid.bidder = this.challenger;
        this.bid.currentTurn = this.defendant;
        this.log.push(`${this.challenger.name} opens bid: ${amount} ${currency} on ${aspect}.`);
        return true;
    }

    respond(action, newAmount = 0) {
        if (this.state !== 'Bidding') return false;

        const actor = this.bid.currentTurn;
        const other = actor === this.challenger ? this.defendant : this.challenger;

        if (action === 'Fold') {
            this.state = 'Resolution';
            this.winner = other;
            this.log.push(`${actor.name} folds. ${other.name} wins.`);
            return { state: 'Resolved', winner: other };
        }

        if (action === 'Call') {
            this.state = 'Narration';
            this.narrator = actor;
            this.log.push(`${actor.name} calls.`);
            return { state: 'Narration', narrator: actor };
        }

        if (action === 'Raise') {
            if (newAmount <= this.bid.amount) return false;
            this.bid.amount = newAmount;
            this.bid.bidder = actor;
            this.bid.currentTurn = other;
            this.log.push(`${actor.name} raises to ${newAmount}.`);
            return { state: 'Bidding', currentBid: this.bid };
        }
        return false;
    }

    async drawJudgement() {
        if (this.state !== 'Narration') return;
        const drawn = T13NECardsAPI.deck.draw(1);
        this.cards.judgement = drawn[0];
        this.state = 'Judgement';
        this.log.push(`Judgement card drawn: ${this.cards.judgement.name}.`);
        return this.cards.judgement;
    }

    resolve(winner) {
        this.winner = winner;
        this.state = 'Complete';
        this.log.push(`${winner.name} wins the Showdown.`);
        return { winner, bid: this.bid };
    }
}

/**
 * Helper class to manage a Quantum Contest.
 * Allows multiple YarnTellers to narrate a scene, with all versions considered true.
 */
class QuantumContest {
    constructor(participants, scene) {
        this.participants = participants;
        this.scene = scene;
        this.narrations = [];
        this.state = 'Initiated';
        this.log = [];
    }

    start() {
        this.state = 'Active';
        this.log.push(`Quantum Contest started. ${this.participants.length} timelines diverging.`);
        return true;
    }

    submitNarration(participant, narration) {
        if (this.state !== 'Active') return false;
        this.narrations.push({
            author: participant.name,
            text: narration,
            timestamp: Date.now()
        });
        this.log.push(`${participant.name} adds a timeline.`);
        return true;
    }

    resolve() {
        this.state = 'Resolved';
        this.log.push('Quantum Contest resolved. Multiple realities persist.');
        return {
            outcome: 'Ambiguous',
            narrations: this.narrations,
            mechanic: 'All versions are true for their respective observers.'
        };
    }
}

export default new T13NE_Drama();
