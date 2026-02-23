import CodexLoader from "../codex/CodexLoader.js";
import Logger from "../../core/Logger.js";
import T13Tapestry from "../world/T13Tapestry.js";
import T13NE_Facets from "../mechanics/t13ne-facets.js";
import T13Boons from '../mechanics/t13ne-boon.js';
import T13NE_Tension from '../mechanics/t13ne-tension.js';
import T13NE_NarrativeWeaving from "./t13ne-narrative-weaving.js";
import T13NECardsAPI from "../mechanics/t13ne-cards-api.js";
import AIService from "../ai/AIService.js";
import T13YarnTeller from "./t13ne-yarntelling.js";
import T13Name from "../characters/t13ne-names.js";
import T13NE_Reasoning from '../ai/t13ne-reasoning.js';
import T13NE_StateMachine from '../systems/t13ne-state-machine.js';
import T13LoreManager from "./t13ne-lore.js"; // Import Lore Manager
import PRNG from "../systems/t13ne-prng.js";
import ProcGen from "../../procgen/ProcGen.js";


import { SuperKnot } from "../mechanics/t13ne-knots.js";

/**
 * Represents a single Plot instance.
 * Acts as a "Narrative Director" or "DM", guiding narrative events.
 */
class T13Plot extends SuperKnot {
    constructor(data, t13ne = null) {
        // Ensure lowercase 'name' is present for the SuperKnot/KnotWork constructor
        if (!data.name && data.Name) data.name = data.Name;

        super(t13ne?.getModule('Codex'), data);

        this.t13ne = t13ne; // Reference to main system for commands

        // Register with Plots module if available
        const PlotsModule = this.t13ne?.getModule('Plots');
        if (PlotsModule && !PlotsModule.plots.includes(this)) {
            PlotsModule.plots.push(this);
        }

        this.Name = this.name || data.Name || data.name || "Unnamed Plot";
        this.memory = data.memory || { events: [] };
        this.subPlots = [];
        this.plotDescendants = [];
        this.characterArcs = data.characterArcs || []; // Linked Character Arcs
        this.tensionLevel = data.TensionLevel || 2; // Default Low/Medium
        this.dramaPool = [];
        this.yarnCards = data.yarnCards || [];
        this.characters = data.Hooked_Characters || [];
        this.motifs = data.Motifs || [];
        this.ratchets = data.Ratchets || []; // Array of ratchet definitions
        this.significator = data.Significator || null;
        this.conflictBoons = {}; // Stores calculated boons for the conflict sides
        this.location = data.Location || null;
        this.goal = data.Goal || "To resolve the conflict.";
        this.narrativeStructure = null;
        this.currentAtmosphere = null; // Stores current atmospheric effects

        // Subplot & Resource properties
        this.yarnPoints = data.yarnPoints || 5;
        this.reports = [];
        this.parentPlot = data.parentPlot || null;
        this.isActive = data.isActive !== undefined ? data.isActive : true;

        // State Machine
        // Initialize appropriate machine based on Rank
        this.stateMachine = (this.Rank === 'Scene') ? T13NE_StateMachine.createWarpMachine(this) : T13NE_StateMachine.createPlotMachine(this);
        this.actStateMachine = null; // Tracks scenes within the current Act
        this.isResolved = false;
        this.isHooked = false;

        this.genre = data.genre || 'T13 Core';
        this.era = data.era || 'Timeless';
        this.variety = data.variety || data.actType || 'Unknown';

        // Hierarchy & Spread Data
        this.index = data.index || 0;
        this.spread = data.spread || data.Spread || null;
        this.scenes = data.scenes || null;
        this.sceneType = data.sceneType || null;

        // Narrative Role Stacking & Importance
        this.importance = data.importance || 5; // 1-10 level for AI focus
        this.narrativeRoles = data.narrativeRoles || [this.Rank]; // Stackable roles (e.g., ['Story', 'Arc-Act'])
        this.tags = data.tags || []; // e.g., ['HISTORICAL', 'CURRENT_ACTIVE']

        if (this.isActive && !this.tags.includes('HISTORICAL')) {
            if (!this.tags.includes('CURRENT_ACTIVE')) this.tags.push('CURRENT_ACTIVE');
        }

        this.yarnTeller = new T13YarnTeller(null, data.voice || this.generateComplexVoice());

        // Ensure at least one ratchet is present
        this.ensureRatchet();

        Logger.message(`T13Plot: Created plot '${this.Name}' (Rank: ${this.Rank}, Variety: ${this.variety}, Importance: ${this.importance}, Tags: ${this.tags.join(', ')})`);

        // Automatically save on creation
        this.save();
    }

    /**
     * Saves the plot to the Codex storage.
     */
    async save() {
        if (CodexLoader) {
            await CodexLoader.saveEntityToStore(this);
        }
    }

    /**
     * Ensures the plot has at least one ratchet.
     */
    ensureRatchet() {
        if (this.ratchets.length === 0) {
            // Add a default ratchet based on variety or genre
            const defaultRatchets = {
                'Security': 'Infiltration',
                'Conflict': 'Dominance',
                'Disaster': 'Volcanic'
            };
            const type = defaultRatchets[this.variety] || 'General';
            this.ratchets.push({ type: type, name: `${this.Name} ${type} Ratchet` });
        }
    }

    get currentState() {
        if (this.isResolved) return 'Resolved';
        if (this.actStateMachine) return this.actStateMachine.getState();
        return this.stateMachine ? this.stateMachine.getState() : 'uninitialized';
    }

    /**
     * Gets the scale of the plot, derived from its statblock.
     * @returns {number} The scale of the plot.
     */
    getScale() {
        if (this.Conflict && this.Conflict.Statblock) {
            const stats = T13Tapestry.loadStatsFromSC(this.Conflict.Statblock);
            return stats.Scale;
        }
        return 0;
    }

    /**
     * Generates a complex voice string based on plot context.
     * @returns {string} A blended voice string (e.g., "The Historian + The Grim + The Tactician").
     */
    generateComplexVoice() {
        const tension = this.tensionLevel || 2;
        const genre = this.genre || '';
        const era = this.era || 'Timeless';

        let structure = ['The Pantser', 'The Thespian', 'The Auteur', 'The Third'];
        let mood = ['The Noncommital', 'The Quiet', 'The Stoic'];
        let flavor = ['The Thespian', 'The Pantser'];

        // Structure (Era)
        if (era.match(/Ancient|Mythic|Past|Medieval/i)) structure = ['The Historian', 'The Oracle', 'The Borrowed Bard', 'The Neoclassical'];
        else if (era.match(/Victorian|Romantic|Edwardian/i)) structure = ['The Purple Poet', 'The Romantic', 'The Historian', 'The Gossip', 'The Academic'];
        else if (era.match(/Modern|Contemporary/i)) structure = ['The Journalist', 'The Pantser', 'The Thespian', 'The Sportscaster', 'The Gossip', 'The Hard-Boiled Detective', 'The Investigator', 'The Satirist'];
        else if (era.match(/Future|Sci-?Fi|Cyberpunk|Space/i)) structure = ['The Scientist', 'The Tactician', 'The Mechanic', 'The Minimalist', 'The Logger', 'The Academic'];

        // Mood (Tension)
        if (tension >= 7) mood = ['The Daredevil', 'The Grim', 'The Hatemonger', 'The Murderer', 'The Bedlamite', 'The Fearmonger', 'The Creep'];
        else if (tension >= 4) mood = ['The Interrogator', 'The Diplomat', 'The Gossip', 'The Blowhard', 'The Jargonist', 'The Liar', 'The Satirist'];
        else mood = ['The Romantic', 'The Quiet', 'The Stoic', 'The Noncommital', 'The Vague', 'The Idiot', 'The Punster'];

        // Flavor (Genre)
        const genreVoices = [];
        if (genre.match(/Horror/i)) genreVoices.push('The Horror Host', 'The Grim', 'The Bedlamite', 'The Creep', 'The Fearmonger');
        if (genre.match(/Sci-?Fi/i)) genreVoices.push('The Scientist', 'The Tactician', 'The Mechanic', 'The Academic');
        if (genre.match(/Fantasy/i)) genreVoices.push('The Borrowed Bard', 'The Oracle', 'The Neoclassical');
        if (genre.match(/Comedy/i)) genreVoices.push('The Clown', 'The Blowhard', 'The Motormouth', 'The Punster', 'The Idiot', 'The Satirist');
        if (genre.match(/Noir/i)) genreVoices.push('The Noire', 'The Interrogator', 'The Hard-Boiled Detective', 'The Liar');
        if (genre.match(/Action/i)) genreVoices.push('The Daredevil', 'The Sportscaster', 'The Hard-Boiled Detective');
        if (genre.match(/Romance/i)) genreVoices.push('The Romantic', 'The Vamp');
        if (genre.match(/Mystery/i)) genreVoices.push('The Interrogator', 'The Journalist', 'The Noire', 'The Investigator', 'The Academic');
        if (genreVoices.length > 0) flavor = genreVoices;

        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const v1 = pick(structure);
        const v2 = pick(mood);
        const v3 = pick(flavor);

        return Array.from(new Set([v1, v2, v3])).join(' + ');
    }

    /**
     * Updates the plot's voice based on current state.
     */
    updateVoice() {
        if (this.yarnTeller) {
            const newVoice = this.generateComplexVoice();
            this.yarnTeller.setVoice(newVoice);
        }
    }

    /**
     * Hooks a character to a specific side and facet of the conflict.
     * Updates the plot's conflict boons based on the character's stats.
     * @param {object} character - The character to hook.
     * @param {string} side - 'Dominant', 'Pressed', etc.
     * @param {string} [facet] - Optional specific facet name.
     */
    async hookCharacter(character, side, facet = null, hookSpread = null) {
        if (!character) return;

        // Check if already hooked
        const existingIndex = this.characters.findIndex(c => c.id === character.id || c.name === character.name);

        const hookData = {
            ...character, // Store reference or shallow copy depending on architecture 
            hookSide: side,
            hookFacet: facet,
            hookedAt: Date.now(),
            hookSpread: hookSpread || character.hookSpread || null // Store the hook that was used
        };

        if (existingIndex !== -1) {
            this.characters[existingIndex] = hookData;
            Logger.message(`Plot ${this.Name}: Updated hook for ${character.name} to ${side}.`);
        } else {
            this.characters.push(hookData);
            Logger.message(`Plot ${this.Name}: Hooked ${character.name} to ${side}.`);
        }

        // Recalculate Plot Boons based on the new character
        await this.calculateConflictBoons();
    }

    /**
     * Recalculates the Plot's Conflict Boons based on Hooked Characters.
     * Rules:
     * 1. Plots get Facet Boons from Hooked Characters (Highest Facet).
     * 2. Dominant side must be at least one Boon Higher than Pressed Facet (Min 13).
     */
    async calculateConflictBoons() {
        if (!this.Conflict || !this.Conflict.Sides) return;

        const sideBoons = {};

        // 1. Determine highest boon for each side from hooked characters
        for (const [sideName, sideData] of Object.entries(this.Conflict.Sides)) {
            let maxBoon = 0;

            // Find characters hooked to this side
            const sideChars = this.characters.filter(c => c.hookSide === sideName);

            for (const char of sideChars) {
                if (char.facetweb) {
                    // If a specific facet is targeted, check that, otherwise check all conflict facets
                    const facetsToCheck = sideData.Facets || [];
                    for (const facetId of facetsToCheck) {
                        // Assuming facetId is name or index, T13Tapestry handles retrieval
                        // We need the facet name to query the character's web
                        const facetObj = await T13NE_Facets.getFacet(facetId);
                        if (facetObj) {
                            const charBoonData = await char.facetweb.getFacetBoon(facetObj.FacetName);
                            const totalBoon = (charBoonData.Boon || 0) + (char.scaleModifier || 0);
                            if (totalBoon > maxBoon) maxBoon = totalBoon;
                        }
                    }
                }
            }

            // Default minimum if no characters or low stats
            sideBoons[sideName] = Math.max(13, maxBoon);
        }

        // 2. Enforce Dominant > Pressed Rule
        if (sideBoons['Dominant'] && sideBoons['Pressed']) {
            if (sideBoons['Dominant'] <= sideBoons['Pressed']) {
                sideBoons['Dominant'] = sideBoons['Pressed'] + 1;
                Logger.message(`Plot ${this.Name}: Adjusted Dominant Boon to ${sideBoons['Dominant']} to exceed Pressed side.`);
            }
        }

        this.conflictBoons = sideBoons;
        Logger.message(`Plot ${this.Name}: Conflict Boons updated.`, this.conflictBoons);
    }

    /**
     * Creates an NPC for the plot and gains Yarn.
     * Rule: "Plots gain Yarn from every Character that they create."
     * @param {string} type - 'Extra', 'Vex', 'Chorus', 'Cast', 'Force-of-Nature'.
     * @param {object} options - Additional options for generation.
     */
    async createNPC(type, options = {}) {
        if (!this.t13ne) return null;

        // Determine Yarn Gain (Cost) based on type
        let yarnGain = 1; // Default Vex/Extra
        if (type === 'Chorus') yarnGain = 2;
        else if (type === 'Cast') yarnGain = 3;
        else if (type === 'Force-of-Nature') yarnGain = 4;

        // Generate the Character
        const { Character } = await import("/src/t13ne/modules/characters/t13ne-chars.js");
        const Codex = this.t13ne.getModule('Codex');
        const npc = await Character.generate(Codex, { ...options, model: type });

        if (npc) {
            this.characters.push(npc); // Add to plot characters (implicitly hooked to plot, side needs assignment)
            this.feed(yarnGain); // Plot gains Yarn
            Logger.message(`Plot ${this.Name}: Created NPC ${npc.name} (${type}). Gained ${yarnGain} Yarn.`);
            return npc;
        }
        return null;
    }







    /**
     * Adds a Motif to the plot.
     */
    addMotif(motif) {
        if (!this.motifs.includes(motif)) {
            this.motifs.push(motif);
            Logger.message(`Plot ${this.Name}: Added Motif '${motif}'.`);
        }
    }

    /**
     * Uses a Motif, granting Yarn to the plot.
     */
    useMotif(motif) {
        if (this.motifs.includes(motif)) {
            this.feed(1);
            Logger.message(`Plot ${this.Name}: Used Motif '${motif}'. Gained 1 Yarn.`);
            return true;
        }
        return false;
    }

    /**
     * Sets the Plot Significator.
     */
    setSignificator(card) {
        this.significator = card;
        Logger.message(`Plot ${this.Name}: Significator set to ${card.name}.`);
    }

    /**
     * Adds a Character Arc to this plot.
     * @param {object} arc 
     */
    addCharacterArc(arc) {
        this.characterArcs.push(arc);
    }

    /**
     * Creates sub-plots based on the current plot's rank.
     * @param {Array} plotRanks - Array of plot rank definitions.
     */
    createSubPlots(plotRanks) {
        if (!this.PlotRank && !this.Rank) return;

        // Determine current rank name
        let currentRankName = this.Rank;
        const hierarchy = ['Cycle', 'Epic', 'Volume', 'Arc', 'Chapter', 'Story', 'Act', 'Scene'];

        // Normalize current rank if it's a number (PlotRank)
        if (!currentRankName && typeof this.PlotRank === 'number') {
            // Assuming PlotRank 7 is Cycle, 0 is Scene based on T13 structure
            const ranks = ['Scene', 'Act', 'Story', 'Chapter', 'Arc', 'Volume', 'Epic', 'Cycle'];
            if (this.PlotRank >= 0 && this.PlotRank < ranks.length) {
                currentRankName = ranks[this.PlotRank];
            }
        }

        if (!currentRankName) return;

        const currentIndex = hierarchy.indexOf(currentRankName);

        if (currentIndex !== -1 && currentIndex < hierarchy.length - 1) {
            const subPlotRank = hierarchy[currentIndex + 1];

            // Create a sub-plot (simplified logic: create 1-3 sub-plots)
            const numSubPlots = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numSubPlots; i++) {
                const subPlotData = {
                    Name: `${this.Name} -  ${i + 1}`,
                    Rank: subPlotRank,
                    Conflict: this.Conflict, // Inherit conflict for now
                    TensionLevel: this.tensionLevel,
                    Hooked_Characters: this.characters, // Pass down characters
                    genre: this.genre,
                    era: this.era
                };
                const subPlot = new T13Plot(subPlotData, this.t13ne);
                this.subPlots.push(subPlot);
            }
        }
    }

    /**
     * Creates plot descendants based on the conflict.
     * Generates Locations, Props, and Lores.
     */
    async createPlotDescendants() {
        // "Plots create Descendants... Locations... MacGuffins... Pacts... Lores"

        // 1. Create Location
        if (!this.location) {
            this.plotDescendants.push({
                Type: 'Location',
                Name: `${this.Name} Location`,
                Description: 'A location relevant to the plot.'
            });
        }

        // 2. Create MacGuffin/Device (50% chance)
        if (Math.random() > 0.5) {
            this.plotDescendants.push({
                Type: 'Prop',
                Name: 'Plot Device',
                Description: 'An item of importance to the conflict.'
            });
        }

        // 3. Generate Lore (New System)
        // Plots always generate at least one piece of Lore related to their conflict
        const loreContext = {
            topic: `${this.Name} Mystery`,
            source: 'Plot Generation',
            relatedTo: this.Conflict ? 'Conflict' : 'Unknown'
        };
        const lore = T13LoreManager.generateLore('Secret', loreContext);
        this.plotDescendants.push({ Type: 'Lore', ...lore });

        // 4. Historical Protagonist Check
        // If no Hooked Characters exist (e.g., Backstory generation), create a Historical Protagonist
        if (this.characters.length === 0) {
            await this.createNPC('Cast', { role: 'Historical Protagonist' });
            Logger.message(`Plot ${this.Name}: Created Historical Protagonist.`);
        }
    }

    /**
     * Generates sub-plots using Card Spreads.
     * @param {object|string} [options={}] - Options or startRank string (legacy support).
     */
    async cascadePlot(options = {}) {
        if (typeof options === 'string') options = { startRank: options };

        if (!T13NECardsAPI.isInitialized) {
            Logger.warn("T13CardAPI not initialized, cannot cascade plot.");
            return;
        }

        const currentRank = options.startRank || this.Rank;
        const recursive = options.recursive !== undefined ? options.recursive : true;
        const singleLine = options.singleLine || false;

        const hierarchy = ['Cycle', 'Epic', 'Volume', 'Arc', 'Chapter', 'Story', 'Act', 'Scene'];
        const rankIndex = hierarchy.indexOf(currentRank);

        if (rankIndex === -1 || rankIndex >= hierarchy.length - 1) {
            return; // Lowest rank or invalid
        }

        // Determine the correct spread ID. 
        // Acts and Epics can use variety-based spreads.
        let spreadId = currentRank.toLowerCase();
        if (currentRank === 'Story') {
            spreadId = 'story-3-act';
        } else if (currentRank === 'Act' && this.variety) {
            spreadId = `${this.variety.toLowerCase()}-act`;
        }

        // For historical plots, we use a deterministic seed based on location/id to ensure repeatability
        const seed = options.seed || (this.tags.includes('HISTORICAL') ? `${this.location || this.id}_${currentRank}` : null);

        if (seed) {
            PRNG.pushSeed(seed);
            ProcGen.sync();
        }
        const compositeSpread = T13NECardsAPI.getCompositeSpread(spreadId, { ...options, seed, singleLine });

        if (!compositeSpread || !compositeSpread.components) {
            Logger.warn(`No composite spread found for rank ${currentRank} (spreadId: ${spreadId}).`);
            if (seed) {
                PRNG.popSeed();
                ProcGen.sync();
            }
            return;
        }

        Logger.message(`Cascading Plot ${this.Name} (${currentRank}, Variety: ${this.variety})${seed ? ` [Seeding: ${seed}]` : ''}${singleLine ? ' [Single Line]' : ''}...`);

        // Iterate through components defined in the spread (e.g., 'epics', 'volumes')
        for (const [key, component] of Object.entries(compositeSpread.components)) {
            // Check if component is an array of children (e.g., 'epics': [...])
            if (Array.isArray(component)) {
                for (const childDef of component) {
                    const childName = `${this.Name} - ${childDef.name}`;
                    const childRank = hierarchy[rankIndex + 1];

                    // Create the sub-plot
                    const subPlot = this.spawnSubPlot(childName, {
                        Rank: childRank,
                        variety: childDef.variety || 'Unknown',
                        Description: `Generated from ${currentRank} Cascade.`,
                        spread: childDef.spread || null
                    });

                    // Conditionally cascade recursively
                    if (recursive) await subPlot.cascadePlot({ ...options, startRank: childRank, recursive: true });

                    // If single line, we only process the first child of the first component that yields children
                    if (singleLine) break;
                }
            }
            // Handle single child components (e.g. 'frame', 'loom', 'zenith' in Story)
            else if (typeof component === 'object' && component.name) {
                const childName = `${this.Name} - ${component.name}`;
                const childRank = hierarchy[rankIndex + 1];

                // Special handling for Story -> Act or explicit sub-objects
                const subPlot = this.spawnSubPlot(childName, {
                    Rank: childRank,
                    variety: component.variety || 'Unknown',
                    Description: component.description || `Generated from ${currentRank} Cascade.`,
                    spread: component.spread || null
                });

                // Conditionally cascade recursively
                if (recursive) await subPlot.cascadePlot({ ...options, startRank: childRank, recursive: true });
            }

            if (singleLine && Array.isArray(component) && component.length > 0) break;
        }
        if (seed) {
            PRNG.popSeed();
            ProcGen.sync();
        }
    }

    /**
     * Ensures this plot has a parent hierarchy leading up to the Galactic Cycle.
     * Generates parents "upwards" if they do not exist.
     */
    async ensureParentage() {
        const hierarchy = ['Cycle', 'Epic', 'Volume', 'Arc', 'Chapter', 'Story', 'Act', 'Scene'];
        const currentIdx = hierarchy.indexOf(this.Rank);

        if (currentIdx <= 0) return; // Already at top or invalid

        if (!this.parentPlot) {
            const parentRank = hierarchy[currentIdx - 1];
            const PlotsModule = this.t13ne?.getModule('Plots');

            // Try to find a suitable parent in the system
            let parent = PlotsModule?.plots.find(p => p.Rank === parentRank && p.isActive);

            if (!parent) {
                Logger.message(`Plot ${this.Name}: No parent ${parentRank} found. Generating up...`);
                parent = new T13Plot({
                    Name: `Parent ${parentRank} of ${this.Name}`,
                    Rank: parentRank,
                    Description: `Automatically generated parent for ${this.Name}.`,
                    genre: this.genre,
                    era: this.era
                }, this.t13ne);

                if (PlotsModule) PlotsModule.plots.push(parent);

                // Recursively ensure parent's parentage
                await parent.ensureParentage();
            }

            this.parentPlot = parent;
            if (!parent.subPlots.includes(this)) {
                parent.subPlots.push(this);
            }
            Logger.message(`Plot ${this.Name}: Parented to ${parent.Name} (${parentRank}).`);
        }
    }

    /**
     * Defines the scene parameters if this is a Scene rank plot.
     * @param {Array} availableCharacters - Characters available to be in the scene.
     * @param {object} location - The location for the scene.
     */
    defineScene(availableCharacters, location) {
        if (this.Rank !== 'Scene') return;

        this.characters = availableCharacters || this.characters || [];
        this.location = location || this.plotDescendants.find(d => d.Type === 'Location') || { Name: "Unknown Location" };

        // "what the Scene would like the characters to achieve"
        this.goal = "To advance the narrative by resolving the local conflict.";
    }

    /**
     * Triggers the rendering of this plot as a game scene.
     */
    async play() {
        if (this.Rank !== 'Scene') {
            Logger.warn(`Plot ${this.Name}: Cannot play non-Scene rank plot.`);
            return;
        }

        const ViewManager = this.t13ne?.getModule('ViewManager');
        if (ViewManager) {
            const sceneName = this.sceneType || 'DialogueScene';
            Logger.message(`Plot ${this.Name}: Requesting transition to scene '${sceneName}'.`);
            await ViewManager.transitionToScene(sceneName, { plot: this });
        }
    }

    /**
     * Updates the tension level and affects characters.
     * @param {number} newLevel - The new tension level.
     */
    updateTension(newLevel) {
        const oldLevel = this.tensionLevel;
        this.tensionLevel = newLevel;
        const tensionData = T13NE_Tension.getSuspenseData(this.tensionLevel);

        Logger.message(`Plot ${this.Name}: Tension updated to Level ${this.tensionLevel} (${tensionData ? tensionData.Type : 'Unknown'}).`);

        // Sync with global Tension system based on Rank
        if (this.Rank === 'Scene') {
            T13NE_Tension.setSceneSuspense(this.tensionLevel);
        } else if (this.Rank === 'Act') {
            T13NE_Tension.setActSuspense(this.tensionLevel);
        } else {
            // Assume higher ranks affect Plot tension
            T13NE_Tension.setPlotSuspense(this.tensionLevel);
        }

        // Trigger Music Transition (Bridge/Crossfade)
        if (this.t13ne) {
            const Music = this.t13ne.getModule('Music');
            if (Music && typeof Music.updateAmbience === 'function') {
                Music.updateAmbience(this);
            }
        }

        // Check for significant change (crossing thresholds 4 or 7) to update voice
        const getTier = (l) => {
            if (l >= 7) return 2;
            if (l >= 4) return 1;
            return 0;
        };
        if (getTier(oldLevel) !== getTier(newLevel)) this.updateVoice();

        // "Plot will not cause Characters to fight, but it will PUSH characters who are oppossed together"
        if (this.tensionLevel >= 4) { // Medium Tension or higher
            this.pushOpposedCharacters();
        }
    }

    /**
     * Pushes opposed characters together.
     */
    pushOpposedCharacters() {
        // Logic to find opposed characters in this.characters and ensure they are in the same scene/location
        if (this.characters.length >= 2) {
            Logger.message(`Plot ${this.Name}: Pushing opposed characters together due to Tension ${this.tensionLevel}.`);
        }
    }

    /**
     * Adds drama to the plot's drama pool.
     * @param {object} dramaDie - The drama die to add.
     */
    addDrama(dramaDie) {
        this.dramaPool.push(dramaDie);
    }

    /**
     * Applies an atmospheric event to the plot/scene.
     * Handles logging and potential integration with frontend systems via T13NE.
     * @param {object} atmospheric - The atmospheric event object { text, sfx, lighting, etc. }
     */
    applyAtmospheric(atmospheric) {
        this.currentAtmosphere = atmospheric;
        const text = typeof atmospheric === 'string' ? atmospheric : atmospheric.text;
        Logger.message(`Plot ${this.Name}: Atmosphere changed to "${text}"`);

        if (!this.t13ne) return;

        // Connect to Audio System
        const SoundEngine = this.t13ne.getModule('SoundEngine');
        if (SoundEngine && typeof SoundEngine.playSFX === 'function' && atmospheric.sfx) {
            SoundEngine.playSFX(atmospheric.sfx);
        }

        // Connect to Scene System via ViewManager
        const ViewManager = this.t13ne.getModule('ViewManager');
        if (ViewManager && ViewManager.currentScene) {
            const scene = ViewManager.currentScene;
            if (atmospheric.lighting && typeof scene.setLighting === 'function') {
                scene.setLighting(atmospheric.lighting);
            }
            if (atmospheric.vfx && typeof scene.triggerVFX === 'function') {
                scene.triggerVFX(atmospheric.vfx);
            }
        }
    }



    /**
     * Generates the narrative structure for this plot using Narrative Weaving.
     */
    generateStructure() {
        this.narrativeStructure = T13NE_NarrativeWeaving.generateStandardStructure(this);

        // Weave linked arcs into the structure
        if (this.characterArcs.length > 0) {
            this.narrativeStructure = T13NE_NarrativeWeaving.weaveCharacterArcs(this.narrativeStructure, this.characterArcs);
        }
        Logger.message(`Plot ${this.Name}: Narrative structure generated.`);
    }

    /**
     * Updates the plot's state based on current progress.
     */
    updateState() {
        if (this.isResolved) return;

        // 1. SCENE RANK LOGIC
        if (this.Rank === 'Scene') {
            // Use WarpStateMachine (Ends -> Fray -> Snag -> Complete)
            // Logic to advance based on card play or yarn points would go here
            // For now, we assume external actions (card plays) drive the transitions
            if (this.stateMachine.getState() === 'Complete') {
                this.isResolved = true;
                Logger.message(`Scene Plot ${this.Name}: Resolved.`);
            }
            return;
        }

        // 2. ACT RANK LOGIC
        if (this.Rank === 'Act') {
            if (!this.actStateMachine && this.scenes) {
                this.actStateMachine = T13NE_StateMachine.createActMachine({
                    scenes: this.scenes,
                    currentSceneIndex: 0,
                    plotName: this.Name
                });
                this.actStateMachine.transition('START');
            }

            if (this.actStateMachine) {
                const actState = this.actStateMachine.getState();
                const ctx = this.actStateMachine.context;

                if (actState === 'NextScene') {
                    if (ctx.currentSceneIndex < ctx.scenes.length) {
                        this.actStateMachine.transition('SCENE_STARTED');
                    } else {
                        this.actStateMachine.transition('NO_MORE_SCENES');
                        this.isResolved = true;
                        Logger.message(`Act Plot ${this.Name}: Resolved.`);
                    }
                } else if (actState === 'SceneActive') {
                    // Spawn/Monitor Scene Plot (Granddaughter of Story)
                    const sceneData = ctx.scenes[ctx.currentSceneIndex];
                    let scenePlot = this.subPlots.find(p => p.Rank === 'Scene' && p.index === ctx.currentSceneIndex && p.isActive);

                    if (!scenePlot) {
                        scenePlot = this.spawnSubPlot(`${this.Name}: Scene ${ctx.currentSceneIndex + 1}`, {
                            Rank: 'Scene',
                            index: ctx.currentSceneIndex,
                            goal: sceneData.Description,
                            sceneType: sceneData.Type,
                            components: sceneData.Components,
                            spread: sceneData.Spread || null
                        });
                    }

                    if (scenePlot && scenePlot.isResolved) {
                        this.actStateMachine.transition('SCENE_RESOLVED');
                    }
                } else if (actState === 'SceneDone') {
                    this.actStateMachine.transition('NEXT');
                }
            }
            return;
        }

        // 3. STORY/HIGHER RANK LOGIC (Frame -> Loom -> Zenith)
        if (!this.narrativeStructure && this.Rank !== 'Scene' && this.Rank !== 'Act') {
            this.generateStructure();
        }

        const state = this.stateMachine.getState(); // Frame, Loom, Zenith

        // Find or Spawn Act Plot (Child of Story)
        let actPlot = this.subPlots.find(p => p.Rank === 'Act' && p.actType === state && p.isActive);

        if (!actPlot && this.narrativeStructure && this.narrativeStructure[state]) {
            const actData = this.narrativeStructure[state];
            actPlot = this.spawnSubPlot(`${this.Name}: ${state}`, {
                Rank: 'Act',
                actType: state,
                goal: actData.Description,
                scenes: actData.Scenes // Pass scenes to Act Plot
            });
        }

        // Wait for Act Plot to resolve
        if (actPlot && actPlot.isResolved) {
            if (state === 'Frame') this.stateMachine.transition('HOOKS_SET');
            else if (state === 'Loom') this.stateMachine.transition('CLIMAX_APPROACHING');
            else if (state === 'Zenith') this.stateMachine.transition('RESOLUTION');
        }

        if (state === 'Frame') {
            // Check if hooks are established.
            // In T13, Hooks are Yarn events. If we have characters hooked, we can proceed.
            if (this.characters.length > 0) {
                this.isHooked = true;
                // Transition handled by Act Plot resolution above
            }
        } else if (state === 'Loom') {
            // Check tension or scene count to move to Zenith
            if (this.tensionLevel >= 5) {
                // Transition handled by Act Plot resolution above
            }
        }
    }

    /**
     * Checks and refills the Plot Hand based on Rank.
     */
    async checkHandSize() {
        if (!T13NECardsAPI.isInitialized) return;

        let minSize = 5;
        let maxSize = 26;

        // Retrieve rank data if available
        const PlotsModule = this.t13ne ? this.t13ne.getModule('Plots') : null;
        if (PlotsModule && PlotsModule.plotRanks) {
            const rankData = PlotsModule.plotRanks.find(r => r.Rank === this.Rank);
            if (rankData) {
                minSize = parseInt(rankData.Minimum_Plot_Hand_Size, 10) || 5;
                maxSize = parseInt(rankData.Maximum_Plot_Hand_Size, 10) || 26;
            }
        }

        // Draw up to minimum
        if (this.yarnCards.length < minSize) {
            const needed = minSize - this.yarnCards.length;
            const drawn = T13NECardsAPI.deck.draw(needed);
            this.yarnCards.push(...drawn);
            Logger.message(`Plot ${this.Name}: Refilled hand to minimum ${minSize} (Drew ${drawn.length}).`);
        }

        // Discard down to maximum (if needed, though usually plots play cards)
        if (this.yarnCards.length > maxSize) {
            const excess = this.yarnCards.length - maxSize;
            const discarded = this.yarnCards.splice(0, excess);
            T13NECardsAPI.discard(discarded);
            Logger.message(`Plot ${this.Name}: Discarded ${excess} cards to match max hand size ${maxSize}.`);
        }
    }

    /**
     * Resolves the Plot (ends it, changes its rank, handles success/failure).
     * @param {string} type - The resolution type (e.g., 'Resolution', 'Revolution').
     * NOTE: For 'Revelation' (Lore gains), use reveal() instead.
     */
    async resolve(type) {
        if (type === 'Revelation') {
            Logger.warn(`Plot ${this.Name}: 'Revelation' is not a resolution type. Use reveal() for Lore gains.`);
            return;
        }

        const Resolutions = await CodexLoader.getData('plotResolutions');
        const resData = Resolutions.find(r => r.Type === type);

        if (!resData) {
            Logger.warn(`Plot ${this.Name}: Unknown resolution type '${type}'.`);
            return;
        }

        Logger.message(`Plot ${this.Name}: Resolving via ${type}.`);

        let payoutMultiplier = 1;
        let rankChange = 0;
        let returnPlot = false;
        let spawnSubplotType = null;
        let conflictReversal = false;

        switch (type) {
            case 'Revolution':
                payoutMultiplier = 1;
                rankChange = 0;
                returnPlot = true;
                conflictReversal = true;
                break;
            // Revelation removed - uses reveal()

            case 'Rejection':
                payoutMultiplier = 0;
                rankChange = 1; // Promotes (harder)
                returnPlot = true;
                spawnSubplotType = 'Rejection';
                break;
            case 'Reversion':
                payoutMultiplier = 0;
                rankChange = -1; // Demotes
                returnPlot = true;
                break;
            case 'Revocation':
                payoutMultiplier = 0.5;
                rankChange = 0;
                returnPlot = true;
                break;
            case 'Reconciliation':
                payoutMultiplier = 1;
                rankChange = -1;
                returnPlot = true; // Returns as sub-plot (handled by rank reduction usually)
                break;
            case 'Resolution':
                payoutMultiplier = 2; // High payout
                returnPlot = false; // Ends
                break;
        }

        // 1. Handle Payout
        if (payoutMultiplier > 0) {
            await this.payout(payoutMultiplier);
        }

        // 2. Handle Plot Return / Evolution
        if (returnPlot) {
            const newRank = this.adjustRank(rankChange);
            Logger.message(`Plot ${this.Name}: Will return at Rank ${newRank}.`);

            // In a real system, this might schedule the plot to return or mutate it immediately
            this.Rank = newRank;
            this.yarnPoints = 5; // Reset Yarn
            this.yarnCards = []; // Clear hand

            if (conflictReversal && this.Conflict && this.Conflict.Sides) {
                // Swap Dominant and Pressed
                // Simplified: Just log it for now
                Logger.message(`Plot ${this.Name}: Conflict reversed.`);
            }

            // Promote/Demote
            if (rankChange !== 0) {
                if (rankChange > 0) this.promotePlot();
                // Demotion logic would go here if needed, usually just reduces scope
            }
        } else {
            Logger.message(`Plot ${this.Name}: Defeated/Resolved. Removing from active plots.`);
            this.isActive = false; // Mark for removal

            // Tag as Historical on resolution
            if (!this.tags.includes('HISTORICAL')) this.tags.push('HISTORICAL');
            const activeIdx = this.tags.indexOf('CURRENT_ACTIVE');
            if (activeIdx !== -1) this.tags.splice(activeIdx, 1);

            // Generate Resolution Lore
            const lore = T13LoreManager.generateLore('History', {
                topic: `${this.Name} Resolution`,
                content: `How the conflict of ${this.Name} was resolved.`,
                relatedTo: 'Plot History'
            });
            // Grant to all hooked characters
            this.characters.forEach(char => T13LoreManager.gainLore(char, lore));
        }

        // 3. Spawn specific subplots if needed
        if (spawnSubplotType) {
            this.spawnSubPlot(`${this.Name} - ${spawnSubplotType}`, { description: `Generated from ${type} resolution.` });
        }

        // Transition state machine to final state
        this.stateMachine.transition('RESOLUTION');

        // Save final state
        await this.save();
    }

    /**
     * Calculates and distributes payout to Hooked Characters.
     * @param {number} multiplier 
     */
    async payout(multiplier) {
        // Base payout based on Rank
        const ranks = ['Scene', 'Act', 'Story', 'Chapter', 'Arc', 'Volume', 'Epic', 'Cycle'];
        const rankIndex = ranks.indexOf(this.Rank) !== -1 ? ranks.indexOf(this.Rank) : 0;

        // Arbitrary base value: (Rank Index + 1) * 5 Chi? Or Yarn?
        // Rules say "Pays out according to Plot Rank".
        // Let's assume a Yarn payout to Characters (which converts to Chi/Sway).
        const baseAmount = (rankIndex + 1) * 2;
        const totalAmount = Math.floor(baseAmount * multiplier);

        Logger.message(`Plot ${this.Name}: Payout ${totalAmount} Yarn (Multiplier ${multiplier}) to hooked characters.`);

        for (const char of this.characters) {
            if (char.swayAccount) {
                // Characters gain Yarn (or Chi equivalent)
                // 1 Yarn = 10 Chi roughly in value for payout? 
                // Or just add to a 'Yarn' balance if they have it.
                // For now, add as Chi (x10)
                char.swayAccount.add('Chi', totalAmount * 10);
                Logger.message(`Character ${char.name} gained ${totalAmount * 10} Chi from Plot Resolution.`);
            }
        }
    }

    /**
     * Promotes the plot to the next higher rank.
     */
    promotePlot() {
        const ranks = ['Scene', 'Act', 'Story', 'Chapter', 'Arc', 'Volume', 'Epic', 'Cycle'];
        const currentIdx = ranks.indexOf(this.Rank);

        if (currentIdx !== -1 && currentIdx < ranks.length - 1) {
            const oldRank = this.Rank;
            this.Rank = ranks[currentIdx + 1];
            Logger.message(`Plot ${this.Name}: Promoted from ${oldRank} to ${this.Rank}.`);
            // Trigger cascading for new rank expectations?
            // Usually promotion means it becomes a larger threat, spawns children.
            // this.cascadePlot(); // Optional: Immediately cascade? Better to wait for next Act cycle.
        }
    }

    /**
     * Adjusts the plot's rank up or down.
     * @param {number} steps 
     * @returns {string} New Rank
     */
    adjustRank(steps) {
        const hierarchy = ['Scene', 'Act', 'Story', 'Chapter', 'Arc', 'Volume', 'Epic', 'Cycle'];
        let idx = hierarchy.indexOf(this.Rank);
        if (idx === -1) idx = hierarchy.indexOf('Story');

        let newIdx = idx + steps;
        newIdx = Math.max(0, Math.min(newIdx, hierarchy.length - 1));

        return hierarchy[newIdx];
    }

    /**
     * The main loop for the Plot to act.
     * @param {object} aiService 
     */
    async act(aiService) {
        // Subplots are now handled individually by the Referee's flattened loop.
        // We just collect reports from our children to inform our own AI decision.
        this.collectReports();

        this.updateState();

        // Ensure Music/Ambience is active and matches current state
        if (this.t13ne) {
            const Music = this.t13ne.getModule('Music');
            if (Music && typeof Music.updateAmbience === 'function') {
                Music.updateAmbience(this);
            }
        }

        // Card play and Narrative generation logic
        const hasActiveSubplots = this.subPlots.some(p => p.isActive && !p.isResolved);
        const isHistorical = this.tags.includes('HISTORICAL');
        const isInactive = this.tags.includes('CURRENT_INACTIVE');

        if (T13NECardsAPI.isInitialized && !hasActiveSubplots && !isInactive) {
            // Historical plots skip the Yarn card hand management
            if (!isHistorical) {
                await this.checkHandSize();
            }

            // AI Decision (uses Historical mode if tagged)
            const decision = await this.decideCardPlay(aiService);

            if (decision) {
                // Execute card plays only for active session plots
                if (decision.cardsToPlay && decision.cardsToPlay.length > 0 && !isHistorical) {
                    await this.executePlay(decision);
                }

                // Allow both Active and Historical plots to spawn sub-plots 
                // to flesh out the narrative or history.
                if (decision.spawnSubPlot) {
                    const spData = decision.spawnSubPlot;
                    this.spawnSubPlot(spData.name, {
                        Description: spData.intent,
                        tags: isHistorical ? ['HISTORICAL'] : []
                    });
                }

                if (!decision.cardsToPlay && !decision.spawnSubPlot) {
                    Logger.message(`Plot ${this.Name}: Decided to wait.`);
                }
            }
        } else if (hasActiveSubplots) {
            Logger.message(`Plot ${this.Name}: Waiting for subplots to resolve.`);
        }
    }

    /**
     * Uses AI to decide which cards to play.
     * @param {object} aiService 
     */
    async decideCardPlay(aiService) {
        if (!aiService) return null;

        // Integrate Reasoning Module for narrative guidance
        let loomSuggestion = '';
        if (T13NE_Reasoning) {
            loomSuggestion = await T13NE_Reasoning.suggestNextBeat({
                plotName: this.Name,
                act: this.currentState,
                tensionLevel: this.tensionLevel,
                genre: this.genre
            });
        }

        const handDescriptions = this.yarnCards.map(c => T13NECardsAPI.extractCardTextForAI(c)).join('\n');
        const reportSummaries = this.reports.map(r => `${r.name}: ${r.summary}`).join('; ');

        const tensionData = T13NE_Tension.getSuspenseData(this.tensionLevel);
        const tensionContext = tensionData ? `${tensionData.Type}: ${tensionData.Description}` : 'Unknown';

        const isHistorical = this.tags.includes('HISTORICAL');
        const roleDesc = isHistorical ? "Historical Chronicler" : "Plot Director";

        const handContext = !isHistorical ? `Your Hand of Yarn Cards:\n${handDescriptions}\n` : '';
        const directive = isHistorical ?
            `- Your goal is to Draft the Galactic History. Determine if this period needs more detailed sub-plots (Stories, Arcs, Chapters) to feel "rich".
             - Use 'spawnSubPlot' to identify missing historical beats that should be explored.` :
            `- Determine which cards (if any) to play to advance the plot.
             - In 'Frame', focus on Hooks (Aces) and Revelations (Queens, 5s). You MUST Hook characters before moving on.
             - Aces can be played as Hooks to spawn new Subplots if the narrative requires branching.
             - In 'Loom', focus on Warps (Conflict/Action) and Wefts (Recovery/Social).
             - In 'Zenith', focus on High Stakes and Resolution.`;

        const prompt = `You are the ${roleDesc} for "${this.Name}".
        Rank: ${this.Rank}
        Narrative Roles: ${this.narrativeRoles.join(', ')}
        Importance: ${this.importance} / 10
        Tags: ${this.tags.join(', ')}
        Current State: ${this.currentState}
        Tension Level: ${this.tensionLevel} (${tensionContext})
        Goal: ${this.goal}
        Conflict: ${JSON.stringify(this.Conflict || 'Unknown')}
        Loom Guidance: ${loomSuggestion || 'None'}
        
        Yarn Points: ${this.yarnPoints}
        Subplot Reports: ${reportSummaries || 'None'}

        ${handContext}
        
        ${directive}
        
        Respond with a JSON object:
        {
            "rationale": "Why you are taking this action",
            "cardsToPlay": ["Card Name 1", "Card Name 2"], (Optional - Only for non-historical plots)
            "narrativeEffect": "Description of the event or historical discovery",
            "spawnSubPlot": { "name": "Optional Name", "intent": "Why spawn this subplot" } (Optional)
        }
        Return empty fields if no action is needed.`;

        try {
            const response = await aiService.generateText(prompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            Logger.error(`Plot ${this.Name}: AI decision failed`, e);
        }
        return null;
    }

    /**
     * Executes the play decided by the AI.
     * @param {object} decision 
     */
    async executePlay(decision) {
        Logger.message(`Plot ${this.Name} plays cards: ${decision.cardsToPlay.join(', ')}`);

        // Handle Subplot Spawning
        if (decision.spawnSubPlot) {
            this.spawnSubPlot(decision.spawnSubPlot.name, { description: decision.spawnSubPlot.intent });
        }

        const playedCards = [];
        for (const cardName of decision.cardsToPlay) {
            const index = this.yarnCards.findIndex(c => c.name === cardName || c.toString().includes(cardName));
            if (index !== -1) {
                playedCards.push(this.yarnCards[index]);
                this.yarnCards.splice(index, 1);
            }
        }

        if (playedCards.length > 0) {
            T13NECardsAPI.discard(playedCards);
            // Feeding the plot
            this.feed(playedCards.length);

            // Narrate the event
            if (this.yarnTeller) {
                const tensionData = T13NE_Tension.getSuspenseData(this.tensionLevel);
                const narration = await this.yarnTeller.narrate({
                    type: 'Action',
                    plot: this,
                    location: this.location,
                    characters: this.characters,
                    action: decision.narrativeEffect,
                    cards: playedCards,
                    genre: this.genre,
                    era: this.era,
                    tensionName: tensionData ? tensionData.Type : '',
                    tensionDescription: tensionData ? tensionData.Description : ''
                });
                Logger.message(`Plot ${this.Name} Narration: ${narration}`);
                this.logEvent(`Narration: ${narration}`);
            }

            // Here we would trigger actual game effects based on narrativeEffect or card types
            // For now, we just log it.
            if (this.currentState === 'Frame' && decision.narrativeEffect.toLowerCase().includes('hook')) {
                // If this plot has a spread (e.g. it's a Hook scene), use its cards for the hook
                const hookSpread = (this.sceneType === 'Hook' || this.variety === 'Hook') ? this.spread : null;

                if (this.characters.length === 0) {
                    Logger.message(`Plot ${this.Name}: Hooks established via card play.`);
                    // In a real system, we'd add characters here. 
                    // This logic would pull from the current context/location.
                }

                // If we have characters and cards, ensure we store the hook
                for (const char of this.characters) {
                    if (!char.hookSpread) {
                        char.hookSpread = hookSpread || playedCards;
                    }
                }
            }

            // Execute T13NEC commands if present in decision
            if (decision.command && this.t13ne) {
                const Commands = this.t13ne.getModule('Commands');
                if (Commands) {
                    await Commands.execute(decision.command, { plot: this });
                }
            }
        }
    }

    /**
     * Spawns a new subplot.
     * @param {string} name 
     * @param {object} context 
     */
    spawnSubPlot(name, context = {}) {
        const ranks = ['Cycle', 'Epic', 'Volume', 'Arc', 'Chapter', 'Story', 'Act', 'Scene'];
        const currentRankIdx = ranks.indexOf(this.Rank || 'Story');
        const nextRank = (currentRankIdx !== -1 && currentRankIdx < ranks.length - 1) ? ranks[currentRankIdx + 1] : 'Scene';

        const subPlot = new T13Plot({
            Name: name || `${this.Name} Subplot`,
            Rank: nextRank,
            Conflict: this.Conflict,
            TensionLevel: this.tensionLevel,
            parentPlot: this,
            yarnPoints: 5,
            genre: this.genre,
            era: this.era,
            importance: this.importance,
            tags: this.tags.includes('HISTORICAL') ? ['HISTORICAL'] : [],
            ...context
        }, this.t13ne);

        this.subPlots.push(subPlot);
        this.logEvent(`Spawned subplot: ${subPlot.Name}`);
        Logger.message(`Plot ${this.Name}: Spawned subplot ${subPlot.Name}`);

        // Ensure children are saved and parent is updated
        subPlot.save();
        this.save();

        return subPlot;
    }

    /**
     * Collects reports from all subplots.
     */
    collectReports() {
        this.reports = this.subPlots.map(p => p.generateReport());
    }

    /**
     * Generates a status report for the parent plot.
     * @returns {object}
     */
    generateReport() {
        const lastEvent = this.memory.events.length > 0 ? this.memory.events[this.memory.events.length - 1].description : 'None';
        return {
            name: this.Name,
            state: this.currentState,
            yarn: this.yarnPoints,
            summary: `State: ${this.currentState}, Yarn: ${this.yarnPoints}, Last Event: ${lastEvent}`
        };
    }

    feed(amount = 1) {
        this.yarnPoints += amount;
        this.logEvent(`Fed ${amount} Yarn. Total: ${this.yarnPoints}`);
    }

    decay() {
        this.yarnPoints -= 1;
        if (this.yarnPoints <= 0) {
            this.goRogue();
        }
    }

    goRogue() {
        this.isRogue = true;
        this.logEvent("Plot went Rogue due to lack of Yarn.");
        Logger.warn(`Plot ${this.Name} has gone Rogue!`);
    }

    logEvent(desc) {
        this.memory.events.push({ timestamp: Date.now(), description: desc });
        if (this.memory.events.length > 50) this.memory.events.shift();
    }

    /**
     * Serializes the Plot instance for saving.
     * @returns {object} A serializable data object.
     */
    serialize() {
        const data = {
            id: this.id,
            Name: this.Name,
            name: this.name,
            Rank: this.Rank,
            RankIndex: this.RankIndex,
            Description: this.Description,
            Goal: this.goal,
            TensionLevel: this.tensionLevel,
            yarnPoints: this.yarnPoints,
            isActive: this.isActive,
            isResolved: this.isResolved,
            isRogue: this.isRogue || false,
            genre: this.genre,
            era: this.era,
            parentPlotId: this.parentPlot ? this.parentPlot.id : null,
            Conflict: this.Conflict,
            Location: this.location,
            Motifs: this.motifs,
            Significator: this.significator,
            spread: this.spread,
            index: this.index,
            scenes: this.scenes,
            sceneType: this.sceneType,
            memory: this.memory,
            characterArcs: this.characterArcs.map(a => a.id || a),
            Hooked_Characters: this.characters.map(c => {
                if (c.hookSide || c.hookSpread) {
                    const cleanChar = {
                        id: c.id,
                        name: c.name || c.Name,
                        charType: c.charType,
                        hookSide: c.hookSide,
                        hookFacet: c.hookFacet,
                        hookedAt: c.hookedAt,
                        hookSpread: null
                    };
                    if (c.hookSpread) {
                        try {
                            cleanChar.hookSpread = typeof c.hookSpread.serialize === 'function'
                                ? c.hookSpread.serialize()
                                : JSON.parse(JSON.stringify(c.hookSpread));
                        } catch (e) {
                            cleanChar.hookSpread = { error: "Uncloneable spread" };
                        }
                    }
                    return cleanChar;
                }
                return c.id || c.name || c;
            }),
            importance: this.importance,
            narrativeRoles: this.narrativeRoles,
            tags: this.tags,
            variety: this.variety,
            subPlots: this.subPlots.map(sp => sp.serialize())
        };

        if (this.stateMachine && typeof this.stateMachine.serialize === 'function') {
            data.stateMachine = this.stateMachine.serialize();
        }
        if (this.actStateMachine && typeof this.actStateMachine.serialize === 'function') {
            data.actStateMachine = this.actStateMachine.serialize();
        }

        return data;
    }
}

/**
 * Manager for T13 Plots.
 * Handles loading plot data and managing plot instances.
 */
class T13NE_Plots {
    constructor() {
        this.plots = [];
        this.plotRanks = [];
        this.corePlots = [];
        this.embodimentTypes = [];
        this.conflictEmbodiments = [];
        this.initialized = false;
    }

    /**
     * Initializes the Plots module by loading data from the codex.
     */
    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;

        try {
            this.plotRanks = await CodexLoader.getData('plotRanks') || [];
            this.corePlots = await CodexLoader.getData('plots', 'corePlots.json') || [];
            this.embodimentTypes = await CodexLoader.getData('embodimentTypes') || [];
            this.conflictEmbodiments = await CodexLoader.getData('conflictEmbodiments') || [];

            // Initialize core plots as T13Plot instances
            if (this.corePlots && Array.isArray(this.corePlots)) {
                this.plots = this.corePlots.map(plotData => new T13Plot(plotData, this.t13ne));
            }

            // Ensure the Galactic Cycle exists as the root of the hierarchy
            let cycle = this.plots.find(p => p.Rank === 'Cycle');
            if (!cycle) {
                cycle = new T13Plot({
                    Name: "Galactic Cycle",
                    Rank: "Cycle",
                    Description: "The overarching narrative framework of the galaxy."
                }, this.t13ne);
                this.plots.push(cycle);

                // Trigger non-recursive cascade to create the Historical Frame and Current Loom Epics
                await cycle.cascadePlot({ recursive: false });
            }

            this.initialized = true;
            Logger.message('T13NE_Plots: Initialized successfully.');
        } catch (error) {
            Logger.error(`T13NE_Plots: Initialization failed: `);
        }
    }

    /**
     * Returns a random embodiment type from the loaded data.
     * @returns {object|null}
     */
    getRandomEmbodimentType() {
        if (!this.embodimentTypes || this.embodimentTypes.length === 0) return null;
        return this.embodimentTypes[Math.floor(Math.random() * this.embodimentTypes.length)];
    }

    /**
     * Returns a random conflict embodiment from the loaded data.
     * @returns {object|null}
     */
    getRandomConflictEmbodiment() {
        if (!this.conflictEmbodiments || this.conflictEmbodiments.length === 0) return null;
        return this.conflictEmbodiments[Math.floor(Math.random() * this.conflictEmbodiments.length)];
    }

    /**
     * Returns valid embodiment types for a given conflict embodiment type.
     * @param {string} conflictType - The type of conflict embodiment (Hidden, Pulled, Pushed, External).
     * @returns {Array} Array of valid embodiment type objects.
     */
    getEmbodimentTypesForConflict(conflictType) {
        if (!this.embodimentTypes) return [];

        const characterTypes = ['Incarna', 'Persona', 'Core', 'Hitch', 'Proficiency', 'Annex', 'Quest/Hurdle'];
        const externalTypes = ['Monster', 'Tone', 'Ordeal/Test/Hurdle', 'Obstacle', 'Descendant', 'Location', 'Pact-Descendant', 'Quest/Hurdle', 'Lore', 'Emotions', 'Failure', 'Turn', 'Success', 'Fumble', 'Critical'];

        if (['Hidden', 'Pulled', 'Pushed'].includes(conflictType)) {
            return this.embodimentTypes.filter(e => characterTypes.includes(e.Type));
        } else if (conflictType === 'External') {
            return this.embodimentTypes.filter(e => externalTypes.includes(e.Type));
        }

        return this.embodimentTypes;
    }

    /**
     * Displays conflict details for a given plot or conflict object.
     * Ported from PHP displayConflict.
     * @param {object} conflict - The conflict object.
     * @param {object} terms - Additional terms/context.
     * @returns {Promise<object>} An object containing the HTML text and conflict stats.
     */
    async displayConflict(conflict, terms) {
        if (!conflict) return { Text: 'No conflict data', ConflictBoon: 0, ConflictFacets: 0 };

        let html = `<section class="t13ne-conflict"><h3>Conflict</h3><strong>Number of Sides:</strong> ${conflict.NoSides}`;
        const boonValues = [];
        let conflictFacets = 0;

        if (conflict.Sides) {
            for (const [side, data] of Object.entries(conflict.Sides)) {
                const css = side.toLowerCase();
                let sideValue = 0;

                html += `<div class="t13ne--facets" data-='${JSON.stringify(data.Facets)}'><h4> Side</h4><h5>Named Entities (Characters and Pacts) </h5><ul class="t13ne-conflict-expressions">`;

                if (data.Expressions) {
                    data.Expressions.forEach(charent => {
                        html += `<li></li>`;
                    });
                } else {
                    html += `<li>No expressions defined for </li>`;
                }

                html += `</ul><h5> Facets</h5><details><summary></summary><ul class="t13ne-facet-list" style="display:inline-block;">`;

                // We need to calculate boons. In PHP this used T13Statblock::getBoonForFacet.
                // We'll use a temporary tapestry created from the conflict statblock.
                const tapestry = new T13Tapestry(conflict.Statblock);

                for (const facetId of data.Facets) {
                    // Assuming facetId is an index or name. T13Tapestry handles both.
                    // We need to render the facet shortcode/component. For now, just a placeholder string.
                    // In a real Vue/React app, this would be a component.
                    const facetObj = await T13NE_Facets.getFacet(facetId);
                    const facetName = facetObj ? facetObj.FacetName : facetId;

                    html += `<li class="t13ne--facet">[t13ne type="facet" facet="" mode="jscript" /]</li>`; // Keeping shortcode format for now

                    const boo = await tapestry.getFacetBoon(facetId);
                    sideValue += T13Boons.getBoonValue(boo.Scale + boo.Boon);
                    conflictFacets++;
                }

                const sideBoon = T13Boons.getBoonReduced(sideValue);
                boonValues.push(sideValue);
                const boonText = T13Boons.writeFullBoon(sideBoon, true);

                html += `</ul></details><p class="t13ne-annex"><strong> Annex</strong> â€” </p></div>`;
            }
        }

        if (conflict.Titles) {
            // In PHP: ='conflict'.md5();
            // In JS we can't easily do inline script vars like that safely/easily without context.
            // We'll just render the list.
            html += '<h3>Suggested Titles</h3><ul>';
            for (const [titleKey, titleData] of Object.entries(conflict.Titles)) {
                if (typeof titleData === 'string') {
                    // It's a simple title string (though PHP logic implies titleKey is num and titleData is title)
                    // PHP: foreach(['Titles'] as =>)
                    html += `<li><span class="t13ne-create-subplot"></span></li>`;
                } else {
                    // It's a sub-conflict
                    html += `<li>`;
                    const subConf = await this.displayConflict(titleData, terms);
                    html += subConf.Text;
                    html += '</li>';
                }
            }
            html += "</ul>";
        }

        const totalValue = boonValues.reduce((a, b) => a + b, 0);
        const totalBoon = T13Boons.getBoonReduced(totalValue);
        const totalBoonText = T13Boons.writeFullBoon(totalBoon, true);

        html += `<p class="t13ne-conflict-boon"><strong>Conflict Total</strong> â€” </p>`;

        // Statblock display
        if (conflict.StatHTML) {
            html += conflict.StatHTML;
        } else if (conflict.Statblock) {
            // In PHP: =T13Statblock::writeStatblockSC(['post_id']);
            // We'll just output the statblock string for now or a placeholder.
            html += `<div class="t13ne-statblock-display">${conflict.Statblock}</div>`;
        }

        html += '</section>';

        return { Text: html, ConflictBoon: totalBoon, ConflictFacets: conflictFacets, Conflict: conflict };
    }

    /**
     * Displays yarn events.
     * Ported from PHP displayYarnEvents.
     * @param {object} yarnData - The yarn events data.
     * @param {number} handSize - The size of the hand to deal.
     * @param {object} conflict - The conflict object.
     * @returns {string} HTML string of yarn events.
     */
    displayYarnEvents(yarnData = {}, handSize = 5, conflict = []) {
        let html = '<section class="t13ne-yarn-events"><h3>Yarn Events</h3>';
        const cardData = [];

        if (T13NECardsAPI.isInitialized) {
            let cards = yarnData.cards || [];

            // If no cards provided, draw them
            if (cards.length === 0 && handSize > 0) {
                cards = T13NECardsAPI.deck.draw(handSize);
                // Update the passed object so the caller retains the cards
                yarnData.cards = cards;
            }

            cards.forEach(card => {
                if (card && typeof card.render === 'function') {
                    cardData.push(card.render());
                } else {
                    // Fallback for raw data objects
                    const name = card.Card || card.name || 'Unknown';
                    const suit = card.Suit || card.suit || '';
                    const pips = card.Pips || card.pips || '';
                    cardData.push(`<div class="card"><div class="card-pips">${pips}</div><div class="card-suit">${suit}</div><div class="card-name">${name}</div></div>`);
                }
            });
        } else {
            Logger.warn("T13NE_Plots.displayYarnEvents: T13Cards module is missing or not initialized.");
            html += '<p>Yarn Events (Cards module not ready)</p>';
        }

        html += `<div class="t13ne-card-hand">${cardData.join('')}</div>`;
        html += '</section>';
        return html;
    }

    /**
     * Generates a full plot outline using Tapestry data and Facets.
     * @param {T13Plot|object} plot - The plot object to generate an outline for.
     * @param {object} aiService - The AI Service for text generation.
     * @returns {Promise<string>} The generated plot outline.
     */
    async generatePlotOutline(plot, aiService) {
        if (!plot || !aiService) {
            Logger.warn("T13NE_Plots.generatePlotOutline: Invalid plot or AI service missing.");
            return "Unable to generate outline.";
        }

        let context = `Plot Entity: ${plot.Name}\n`;
        context += `Intent: ${plot.Description || 'To weave a narrative.'}\n`;
        context += `Rank: ${plot.PlotRank || 'Unknown'}\n`;

        // Add Conflict Embodiment Definitions
        context += `\nReference - Conflict Embodiments (How conflict manifests):\n`;
        if (this.conflictEmbodiments && this.conflictEmbodiments.length > 0) {
            this.conflictEmbodiments.forEach(ce => {
                context += `- ${ce.Type}: ${ce.Description}\n`;
            });
        }

        // Add Embodiment Type Definitions
        context += `\nReference - Embodiment Types (Form of manifestation):\n`;
        if (this.embodimentTypes && this.embodimentTypes.length > 0) {
            this.embodimentTypes.forEach(et => {
                context += `- ${et.Type}: ${et.Description}\n`;
            });
        }

        if (plot.Conflict) {
            context += `\nConflict Structure (${plot.Conflict.NoSides} Sides):\n`;

            // Parse Statblock if available
            if (plot.Conflict.Statblock) {
                const tapestry = T13Tapestry.loadStatsFromSC(plot.Conflict.Statblock);
                context += `Conflict Scale: ${tapestry.Scale}\n`;
            }

            if (plot.Conflict.Sides) {
                for (const [sideName, sideData] of Object.entries(plot.Conflict.Sides)) {
                    context += `\nSide: \n`;
                    if (sideData.Expressions && sideData.Expressions.length > 0) {
                        // In T13, Expressions are the specific Embodiments (Characters, Pacts, etc.) of a Conflict Side
                        context += `  Expressions (Potential Embodiments): ${sideData.Expressions.join(', ')}\n`;
                    }

                    if (sideData.Facets && sideData.Facets.length > 0) {
                        context += `  Thematic Facets (Reflected Details):\n`;
                        for (const facetId of sideData.Facets) {
                            const facet = await T13NE_Facets.getFacet(facetId);
                            if (facet) {
                                context += `    * ${facet.FacetName}: ${facet.Description}\n`;
                                if (facet.Yang) context += `      (Active - Source of Prods)\n`;
                                else context += `      (Passive - Source of Breaks)\n`;
                            }
                        }
                    }
                }
            }
        }

        const prompt = `You are the Plot, a narrative generating entity.
        Your goal is to tell the story defined by the following parameters.
        
        
        
        Describe how you will generate this narrative.
        1. Assign a 'Conflict Embodiment' style (e.g., Hidden, Pulled) to each Side based on the plot description.
        2. Select specific 'Embodiment Types' (e.g., Persona, Monster, Location) for the Expressions/Facets that best fit the narrative intent.
        3. Explain how you will Prod (encourage action/conflict) the narrative forward using Active elements.
        4. Explain how you will Break (pause/reflect) the narrative using Passive elements.
        5. Outline the intended trajectory of the story.`;

        return await aiService.generateText(prompt);
    }

    /**
     * Draws Yarn cards for a specific plot.
     * @param {T13Plot} plot - The plot instance.
     * @param {number} count - Number of cards to draw.
     * @returns {Array} The drawn cards.
     */
    drawYarnForPlot(plot, count = 1) {
        if (!T13NECardsAPI.isInitialized) return [];
        const cards = T13NECardsAPI.deck.draw(count);
        if (!plot.yarnCards) plot.yarnCards = [];
        plot.yarnCards.push(...cards);
        return cards;
    }

    /**
     * Retrieves a plot by name or ID.
     * @param {string|number} identifier - The plot name or ID.
     * @returns {T13Plot|null} The found plot or null.
     */
    getPlot(identifier) {
        if (!this.initialized) {
            Logger.warn("T13NE_Plots: Not initialized. Call initialize() first.");
            return null;
        }

        if (typeof identifier === 'string') {
            return this.plots.find(p => p.id === identifier || p.Name === identifier || p.name === identifier) || null;
        }
        return null;
    }

    /**
     * Generates the full hierarchy of sub-plots and descendants for a given plot.
     * @param {T13Plot} plot - The root plot.
     */
    generateFullHierarchy(plot) {
        if (!plot) return;
        plot.createSubPlots(this.plotRanks);
        plot.createPlotDescendants();
        plot.generateStructure();

        // Recursively generate for sub-plots
        if (plot.subPlots && plot.subPlots.length > 0) {
            plot.subPlots.forEach(subPlot => this.generateFullHierarchy(subPlot));
        }
    }

    /**
     * Ensures a plot has a parent of the appropriate rank, creating it if necessary.
     * Supports "bottom-up" piecemeal generation of history.
     * @param {T13Plot} plot - The plot needing a parent.
     * @returns {T13Plot} The parent plot.
     */
    async ensureParent(plot) {
        const hierarchy = ['Cycle', 'Epic', 'Volume', 'Arc', 'Chapter', 'Story', 'Act', 'Scene'];
        const currentRankIdx = hierarchy.indexOf(plot.Rank);
        if (currentRankIdx <= 0) return plot; // Root or unknown

        if (plot.parentPlot) return plot.parentPlot;

        const parentRank = hierarchy[currentRankIdx - 1];

        // Find or create a suitable parent
        let parent = this.plots.find(p => p.Rank === parentRank && !p.isResolved);
        if (!parent) {
            parent = new T13Plot({
                Name: `Generated ${parentRank} for ${plot.Name}`,
                Rank: parentRank,
                Description: "Auto-generated to support narrative hierarchy."
            }, this.t13ne);
            this.plots.push(parent);
            Logger.message(`T13NE_Plots: Bottom-up generation: Created ${parentRank} parent for '${plot.Name}'`);
        }

        plot.parentPlot = parent;
        if (!parent.subPlots.includes(plot)) {
            parent.subPlots.push(plot);
        }

        // Recurse upwards to ensure the full chain to the Cycle
        await this.ensureParent(parent);
        return parent;
    }

    /**
     * Runs the AI logic for all active plots.
     * @param {object} aiService 
     */
    async runPlots(aiService) {
        if (!this.initialized) return;
        Logger.message("T13NE_Plots: Running Plot AI cycles...");
        for (const plot of this.plots) {
            await plot.act(aiService);
        }
    }
}

const plotsModule = new T13NE_Plots();
plotsModule.T13Plot = T13Plot;

export { T13Plot };
export default plotsModule;
