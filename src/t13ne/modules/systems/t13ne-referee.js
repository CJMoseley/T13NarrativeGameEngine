// d:\GoogleDrive\Games\wormholeracersJS\WormholeRacersJS\plugins\t13ne\modules\t13ne-referee.js

import Logger from "@/src/t13ne/core/Logger.js";
import { T13Plot } from "../narrative/t13ne-plots.js";
import T13LoreManager from "../narrative/t13ne-lore.js";

/**
 * T13NE Referee Module
 * Acts as the central coordinator for the game engine, handling high-level logic,
 * arc generation, and game flow control.
 */
class T13NE_Referee {
    constructor() {
        this.initialized = false;
        this.t13ne = null; // Will hold the main T13NE instance
        this.characters = []; // Master list of all active characters (PCs and key NPCs)
    }


    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;
        this.initialized = true;
        Logger.message('T13NE_Referee: Initialized.');
    }

    /**
     * Adds a character to the master list.
     * @param {Character} character 
     */
    addCharacter(character) {
        if (!this.characters.some(c => c.id === character.id)) {
            this.characters.push(character);
        }
    }

    getCharacters() {
        return this.characters;
    }

    /**
     * Gets a character by ID or Name.
     * @param {string} identifier 
     * @returns {Character|null}
     */
    getCharacter(identifier) {
        if (!identifier) return null;
        return this.characters.find(c => c.id === identifier || c.name === identifier || c.Name === identifier) || null;
    }

    /**
     * Generates a Character Arc for a character (PC or NPC).
     * Uses AI to flesh out narrative beats based on character details.
     * @param {object} character - The character object.
     * @param {string} [type='Solo'] - Composition type (Solo, Duet, Trio, Ensemble).
     * @param {object} [options={}] - Additional options for generation.
     * @returns {Promise<object>} The created Arc.
     */
    async generateCharacterArc(character, type = 'Solo', options = {}) {
        const CharacterArc = this.t13ne.getModule('CharacterArc');
        const AIService = this.t13ne.getModule('AIService');

        if (!CharacterArc) {
            Logger.error("T13NE_Referee: CharacterArc module not loaded.");
            return null;
        }

        const arcName = options.name || `${character.name}'s ${type} Arc`;
        const arc = CharacterArc.createArc(character, type, arcName);

        // Determine Key from Geometry if available
        if (character.geometry && character.geometry.Geo && character.geometry.Geo.Key) {
            arc.key = character.geometry.Geo.Key;
        }

        // Use AI to flesh out the arc if available
        if (AIService) {
            const prompt = `Generate a ${type} Character Arc for ${character.name}.
            Role: ${character.charType || 'Character'}
            Archetype: ${character.personaDetails?.Name || 'Unknown'}
            Motivation: ${character.personaDetails?.Motivation || 'Unknown'}
            Key: ${arc.key}
            
            Create 3 major narrative beats (Beginning, Middle, End) for this arc.
            Respond with ONLY valid JSON: { "beats": [{ "name": "Beat Name", "description": "Description" }] }`;

            try {
                const response = await AIService.generateText(prompt);
                const jsonMatch = response.match(/\{[\s\S]*}/);
                if (jsonMatch) {
                    const data = JSON.parse(jsonMatch[0]);
                    if (data.beats) {
                        data.beats.forEach(beat => {
                            // Add these as Story Notes to the Arc
                            CharacterArc.addNote(character, arc.id, 'Story', `${beat.name}: ${beat.description}`);
                        });
                    }
                }
            } catch (e) {
                Logger.warn("T13NE_Referee: AI Arc generation failed.", e);
            }
        }

        return arc;
    }

    /**
     * Weaves a Character Arc into a Plot.
     * @param {object} plot - The plot object.
     * @param {object} arc - The arc object.
     */
    weaveArcIntoPlot(plot, arc) {
        if (!plot || !arc) return;

        if (typeof plot.addCharacterArc === 'function') {
            plot.addCharacterArc(arc);
        } else {
            if (!plot.characterArcs) plot.characterArcs = [];
            plot.characterArcs.push(arc);
        }

        Logger.message(`T13NE_Referee: Wove arc '${arc.name}' into plot '${plot.Name}'.`);
    }

    /**
     * Issues a command to the engine via the Commands module.
     * @param {string} commandString 
     * @param {object} context 
     */
    async issueCommand(commandString, context = {}) {
        const Commands = this.t13ne.getModule('Commands');
        if (Commands) {
            return await Commands.execute(commandString, context);
        }
        return null;
    }

    /**
     * Runs the main game loop / processing step.
     * Triggers Plot AI cycles and potentially other periodic checks.
     */
    async processTurn() {
        const Plots = this.t13ne.getModule('Plots');
        const AIService = this.t13ne.getModule('AIService');

        Logger.message("T13NE_Referee: Processing Turn...");

        if (Plots) {
            // Gather all active plots (flattening hierarchy for processing)
            const allPlots = [];
            const gather = (plotList) => {
                plotList.forEach(p => {
                    if (p.isActive && !p.isResolved) {
                        allPlots.push(p);
                        if (p.subPlots) gather(p.subPlots);
                    }
                });
            };
            gather(Plots.plots);

            // Prioritize Plots
            // Rules: Zenith > Loom > Frame. High Tension > Low Tension.
            const stateScore = { 'Zenith': 3, 'Loom': 2, 'Frame': 1, 'SceneActive': 2, 'NextScene': 1 };

            allPlots.sort((a, b) => {
                const scoreA = (stateScore[a.currentState] || 0) + (a.tensionLevel || 0);
                const scoreB = (stateScore[b.currentState] || 0) + (b.tensionLevel || 0);
                return scoreB - scoreA; // Descending
            });

            Logger.message(`T13NE_Referee: Found ${allPlots.length} active plots. Top priority: ${allPlots[0]?.Name}`);

            // Execute Plots
            // We act on them in priority order.
            // Note: Act() calls updateState(), which may spawn new subplots.
            for (const plot of allPlots) {
                await plot.act(AIService);
            }
        }

        // Future expansion: Check active Arcs, trigger Latent Drama, etc.
    }

    /**
     * Generates a full Narrative Cycle.
     * @param {string} name - Name of the cycle.
     * @param {object} options - Options for generation.
     */
    async generateCycle(name, options = {}) {
        const Plots = this.t13ne.getModule('Plots');
        if (!Plots) return null;

        Logger.message(`Referee: Generating Cycle '${name}'...`);

        const cyclePlot = new T13Plot({
            Name: name,
            Rank: 'Cycle',
            Description: options.description || 'A procedurally generated narrative cycle.',
            ...options
        }, this.t13ne);

        // 1. Cascade the plot to generate structure down to Scenes
        await cyclePlot.cascadePlot('Cycle');

        // 2. Register the plot
        Plots.plots.push(cyclePlot);

        Logger.message(`Referee: Cycle '${name}' generated with ${cyclePlot.subPlots.length} Epics.`);
        return cyclePlot;
    }

    /**
     * Generates a Backstory for a character.
     * This creates a 'Story' rank plot, populates it with historical context,
     * resolves it, and grants Lore/Boons to the character.
     * @param {object} character - The character to generate backstory for.
     */
    async generateBackstory(character) {
        if (!character) return;

        Logger.message(`Referee: Generating Backstory for ${character.name}...`);

        // 1. Create a Story Plot representing their past
        const storyName = `The Origin of ${character.name}`;
        const backstoryPlot = new T13Plot({
            Name: storyName,
            Rank: 'Story',
            Description: `The backstory of ${character.name}.`,
            isBackstory: true,
            Hooked_Characters: [] // Initially empty, will add historical protagonist or self
        }, this.t13ne);

        // 2. Cascade it (Generate Acts, Hooks, etc.)
        await backstoryPlot.cascadePlot('Story');

        // 3. Hook the character (conceptually, likely as a younger version or purely narrative)
        // For backstory, we might just assume they were the protagonist.
        // We simulate the plot "running" instantly.

        // 4. Trigger a Revelation to generate Lore (Narrative Rewarding)
        // This grants Lore to the character via the plot's internal logic if they were hooked,
        // but for backstory we might need to force it if they aren't 'in' the plot yet.
        const lore = await backstoryPlot.reveal(storyName, {
            content: `Narrative details of ${character.name}'s past.`,
            relatedTo: character.name,
            source: 'Backstory Generation'
        });

        // Ensure character gets it even if not hooked
        T13LoreManager.gainLore(character, lore);

        // 5. Mark as fully resolved (Mechanical Cleanup)
        backstoryPlot.isActive = false;
        backstoryPlot.isResolved = true; // Mark as done

        T13LoreManager.gainLore(character, lore);

        // Add to character's history log if exists
        if (!character.history) character.history = [];
        character.history.push({
            event: 'Backstory Generated',
            plot: backstoryPlot.Name,
            lore: lore.topic
        });

        Logger.message(`Referee: Backstory generated for ${character.name}. Gained Lore: ${lore.topic}`);
        return backstoryPlot;
    }

    /**
     * Saves the current game state to localStorage.
     * @param {string} slotName - The name of the save slot.
     * @returns {Promise<boolean>} Success status.
     */
    async saveGame(slotName = 'default') {
        const GameState = this.t13ne.getModule('GameState');
        if (!GameState) return false;

        const jsonState = await GameState.save();
        if (jsonState) {
            localStorage.setItem(`T13NE_SAVE_${slotName}`, jsonState);
            Logger.message(`Referee: Game saved to slot '${slotName}'.`);
            return true;
        }
        return false;
    }

    /**
     * Loads a game state from localStorage.
     * @param {string} slotName - The name of the save slot.
     * @returns {Promise<boolean>} Success status.
     */
    async loadGame(slotName = 'default') {
        const GameState = this.t13ne.getModule('GameState');
        if (!GameState) return false;

        const jsonState = localStorage.getItem(`T13NE_SAVE_${slotName}`);
        if (jsonState) {
            Logger.message(`Referee: Loading game from slot '${slotName}'.`);
            return await GameState.load(jsonState);
        }
        Logger.warn(`Referee: No save game found in slot '${slotName}'.`);
        return false;
    }
}

export default new T13NE_Referee();







