import CodexLoader from "@/src/t13ne/modules/codex/CodexLoader.js";
import Logger from "@/src/t13ne/core/Logger.js";
import T13NE from '@/src/t13ne/T13NE.js';

/**
 * Module for handling T13NE Social Ordeals.
 * Manages Impressions, Social Actions, and Psychosocial interactions.
 */
class T13NE_SocialOrdeals {
    constructor() {
        this.actions = [];
        this.levels = [];
        this.interactionTypes = [];
        this.initialized = false;
    }

    /**
     * Initializes the Social Ordeals module by loading data from the codex.
     */
    async initialize() {
        if (this.initialized) return;
        try {
            this.actions = await CodexLoader.getData('socialOrdealActions') || [];
            this.levels = await CodexLoader.getData('socialOrdealLevels') || [];
            this.interactionTypes = await CodexLoader.getData('interactionTypes') || [];
            this.initialized = true;
            Logger.message('T13NE_SocialOrdeals: Initialized successfully.');
        } catch (error) {
            Logger.error(`T13NE_SocialOrdeals: Initialization failed: ${error}`);
        }
    }

    /**
     * Calculates the Zeroth Impression between two characters based on Geometry.
     * @param {object} observer - The character forming the impression.
     * @param {object} subject - The character being observed.
     * @returns {object} Impression data { level: number, description: string }
     */
    calculateZerothImpression(observer, subject) {
        let impressionLevel = 0; 
        let description = "Neutral";

        if (observer.geometry && subject.geometry) {
            const subGeoNum = subject.geometry.Geo ? subject.geometry.Geo.Number : null;
            const harmonics = observer.geometry.GeoHarmonics;

            if (subGeoNum && harmonics) {
                // Check Harmonics
                if (harmonics.Harmonic && harmonics.Harmonic.includes(subGeoNum)) {
                    impressionLevel += 1;
                }
                // Check Dissonants
                 if (harmonics.Dissonant && harmonics.Dissonant.includes(subGeoNum)) {
                    impressionLevel -= 1;
                }
                
                // Special Harmonics
                if (harmonics.Perfect === subGeoNum) impressionLevel += 2;
                if (harmonics.Wolf === subGeoNum) impressionLevel += 1;
                if (harmonics.Sustained === subGeoNum) impressionLevel -= 1;
                if (harmonics.Nemesis === subGeoNum) impressionLevel -= 2;
            }
        }

        // Map level to Social Ordeal Levels
        const levelData = this.getSocialLevel(impressionLevel);
        if (levelData) {
            description = levelData.Impression || description;
        }

        return { level: impressionLevel, description };
    }

    /**
     * Calculates Social Modifiers (Success/Failure Levels) based on Geometry.
     * @param {object} actor 
     * @param {object} target 
     */
    getSocialModifiers(actor, target) {
        let successLevels = 0;
        let failureLevels = 0;
        const details = [];

        if (actor.geometry && target.geometry) {
            const targetGeoNum = target.geometry.Geo ? target.geometry.Geo.Number : null;
            
            // Soul Geometry Attraction
            if (actor.geometry.Soul === targetGeoNum) {
                successLevels++;
                details.push("Soul Geometry Attraction (+1 Success Level)");
            }

            // Facade / Masking
            if (actor.geometry.Facade !== actor.geometry.GeometryNumber) {
                failureLevels++;
                details.push("Geometry Masking Discomfort (+1 Failure Level)");
            }

            // Harmonics
            const harmonics = actor.geometry.GeoHarmonics;
            if (harmonics) {
                if (harmonics.Perfect === targetGeoNum) {
                    successLevels++;
                    details.push("Perfect Harmony (+1 Success Level)");
                }
                if (harmonics.Nemesis === targetGeoNum) {
                    failureLevels++;
                    details.push("Nemesis Dissonance (+1 Failure Level)");
                }
            }
        }

        return { successLevels, failureLevels, details };
    }

    /**
     * Retrieves the Social Level definition for a given numeric level.
     * @param {number} levelIndex 
     * @returns {object|null}
     */
    getSocialLevel(levelIndex) {
        // Assuming levels are sorted or we find the closest match
        return this.levels.find(l => l.Level == levelIndex) || null;
    }

    /**
     * Performs a Social Action.
     * @param {object} actor - The character performing the action.
     * @param {object} target - The target character.
     * @param {string} actionName - The name of the social action (e.g., 'Charm').
     * @param {object} options - Additional options for the test.
     */
    async performSocialAction(actor, target, actionName, options = {}) {
        const actionData = this.actions.find(a => a.Name === actionName);
        
        const Tests = T13NE.getModule('Tests');
        if (!Tests) return { success: false, message: "Tests module not loaded." };

        // Determine Facet from actionData or options, default to Dominion
        const facet = options.facet || (actionData ? actionData.Facet : 'Dominion');
        
        // Difficulty might be based on Target's Social Defence or Impression
        // Default difficulty 10 if not specified
        let difficulty = options.difficulty || 10;
        
        // Apply Social Modifiers
        const modifiers = this.getSocialModifiers(actor, target);
        
        // Perform Test
        const result = await Tests.performTest('Dice', actor, {
            facet: facet,
            difficulty: difficulty,
            successLevels: (options.successLevels || 0) + modifiers.successLevels,
            failureLevels: (options.failureLevels || 0) + modifiers.failureLevels,
            ...options
        });

        // Update Impressions based on result
        if (result.success) {
            this.updateImpression(target, actor, 1);
        } else {
            this.updateImpression(target, actor, -1);
        }

        // Append modifier details to result
        if (modifiers.details.length > 0) result.details.push(...modifiers.details);

        return result;
    }

    updateImpression(observer, subject, change) {
        if (!observer.impressions) observer.impressions = {};
        const subjectId = subject.id || subject.name;
        
        if (observer.impressions[subjectId] === undefined) {
            const zeroth = this.calculateZerothImpression(observer, subject);
            observer.impressions[subjectId] = {
                current: zeroth.level,
                first: zeroth.level,
                history: []
            };
        }
        
        // Handle legacy format if it exists (just a number)
        if (typeof observer.impressions[subjectId] === 'number') {
             const val = observer.impressions[subjectId];
             observer.impressions[subjectId] = { current: val, first: val, history: [] };
        }

        const record = observer.impressions[subjectId];
        record.current += change;
        // Clamp between -10 and 10
        record.current = Math.max(-10, Math.min(10, record.current));
        
        Logger.message(`T13NE_SocialOrdeals: ${observer.name}'s impression of ${subject.name} is now ${record.current}.`);
    }

    /**
     * Transfers stress from a Histrionic character to another.
     * @param {object} actor - The Histrionic character.
     * @param {object} target - The target character.
     */
    async transferStress(actor, target) {
        const Stress = T13NE.getModule('Stress');
        if (!Stress) return;

        // Check if actor is Histrionic (has Overstressed or Fully Strained die)
        let isHistrionic = false;
        let overstressedCount = 0;
        if (actor.stressState) {
            for (const dieId in actor.stressState) {
                const state = actor.stressState[dieId];
                if (state.stress >= state.maxStress || state.strains >= state.stressStrainLimit) {
                    isHistrionic = true;
                    if (state.stress >= state.maxStress) overstressedCount++;
                }
            }
        }

        if (isHistrionic) {
            const reliefAmount = overstressedCount + 1;
            // Relieve from actor (generic or specific?)
            // Rule says "Relieve 1 Stress for each Overstressed Die +1 additional Stress"
            // We'll relieve from Generic or spread it.
            // For simplicity, relieve from highest stressed die.
            // And target gains +1 additional (so reliefAmount + 1? No, rule says target gains +1 additional stress)
            // Wait, "target... will Gain an additional +1 Stress".
            // Implies target gains (reliefAmount + 1).
            
            // Relieve actor
            // Simplified: relieve from first available overstressed die
            if (actor.stressState) {
                 for (const dieId in actor.stressState) {
                     if (reliefAmount <= 0) break;
                     await Stress.relieveStress(actor, dieId, reliefAmount);
                 }
            }

            // Add to target
            await Stress.addStress(target, 'Generic', reliefAmount + 1, 13);
            Logger.message(`T13NE_SocialOrdeals: ${actor.name} transferred stress to ${target.name}.`);
        }
    }

    /**
     * Applies a Psychological Defence to an incoming emotional attack.
     * @param {object} character - The defending character.
     * @param {string} defenceType - The type of defence (e.g., 'Denial', 'Projection').
     * @param {object} attack - The incoming attack data (cards, pips, emotion).
     */
    applyPsychologicalDefence(character, defenceType, attack) {
        Logger.message(`T13NE_SocialOrdeals: ${character.name} uses ${defenceType} against ${attack.emotion || 'Attack'}.`);
        
        let result = { mitigated: false, stressCost: 0, narrative: '' };

        switch (defenceType) {
            case 'Denial':
                // Ignore Active Psych Defence
                result.mitigated = true;
                result.narrative = `${character.name} refuses to accept the reality of the situation.`;
                break;
            case 'Avoidance':
                // Dodge action
                result.narrative = `${character.name} tries to avoid the source of the emotion.`;
                break;
            case 'Projection':
                // Redirects negative self-thought onto others.
                result.mitigated = true;
                result.narrative = `${character.name} projects their feelings onto ${attack.source || 'others'}.`;
                break;
            case 'Rationalization':
                // Focus Active Psych Defence
                result.mitigated = true;
                result.narrative = `${character.name} explains away the event logically.`;
                break;
            case 'Repression':
                // Moves emotion to unconscious. Gains 1 Stress/day.
                result.mitigated = true;
                result.narrative = `${character.name} buries the feeling deep inside.`;
                if (!character.repressedEmotions) character.repressedEmotions = [];
                character.repressedEmotions.push({ ...attack, timestamp: Date.now() });
                break;
            default:
                result.narrative = `${character.name} attempts ${defenceType}.`;
        }
        
        return result;
    }

    // --- Psychosocial Space Factories ---

    createTriangularMap(character) {
        return {
            name: `${character.name}'s Empathic Map`,
            type: 'Triangular',
            owner: character.id,
            currentState: 'Thoughts and Feelings',
            states: [
                { id: 'Thoughts and Feelings', name: 'Thoughts and Feelings', description: 'Internal state, unaware of surroundings.' },
                { id: 'Intentions and Reactions', name: 'Intentions and Reactions', description: 'Acting, reacting, moving towards goals.' },
                { id: 'Beliefs and Education', name: 'Beliefs and Education', description: 'Communicating beliefs, learning, arguing.' }
            ],
            moveToState: (char, stateId) => { char.psychosocialSpace.currentState = stateId; }
        };
    }

    createHexagonalMap(character) {
        return {
            name: `${character.name}'s Empathic Map`,
            type: 'Hexagonal',
            owner: character.id,
            currentState: 'Socializing',
            states: [
                { id: 'Socializing', name: 'Socializing', description: 'Making friends, chatting.' },
                { id: 'Mood', name: 'Mood', description: 'Experiencing specific emotion or mood.' },
                { id: 'Considering', name: 'Considering', description: 'Thinking, weighing consequences.' },
                { id: 'Aware', name: 'Aware', description: 'Sensing and aware of something.' },
                { id: 'Focused', name: 'Focused', description: 'Focused on task at hand.' },
                { id: 'Yearning', name: 'Yearning', description: 'Driven by motivation, goal or desire.' }
            ],
            moveToState: (char, stateId) => { char.psychosocialSpace.currentState = stateId; }
        };
    }
}

export default new T13NE_SocialOrdeals();







