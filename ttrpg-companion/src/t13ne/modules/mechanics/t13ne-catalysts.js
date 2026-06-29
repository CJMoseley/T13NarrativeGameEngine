import CodexLoader from "/src/t13ne/modules/codex/CodexLoader.js";
import Logger from "/src/t13ne/core/Logger.js";
import AIService from "/src/t13ne/modules/ai/AIService.js";

export class CharacterCatalyst {
    constructor(data) {
        this.id = data.id || `cat_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        this.type = data.type || 'Ambition'; // e.g. Ambition, Duty, Greed
        this.name = data.name || this.type;
        this.factor = data.factor || ''; // The situation/requirement
        this.carrot = data.carrot || ''; // Incentive/Gain
        this.carrotValue = data.carrotValue || 1; // Numeric value of incentive (1-10)
        this.carrotCommand = data.carrotCommand || ''; // Command to execute on success
        this.stick = data.stick || data.peril || ''; // Consequence/Peril
        this.stickValue = data.stickValue || 1; // Numeric severity of peril (1-10)
        this.stickCommand = data.stickCommand || ''; // Command to execute on failure/ignore
        this.bluff = data.bluff || ''; // Hidden info
        // Score defaults to sum of carrot and stick values if not explicit
        this.score = data.score || (this.carrotValue + this.stickValue);
        this.source = data.source || 'Internal'; // Internal, Plot, Pact, Event
    }
}

class T13NE_Catalysts {
    constructor() {
        this.catalystTypes = [];
        this.initialized = false;
        this.t13ne = null;
        this.prng = Math; // Could use T13Dice.RNG if imported, but Math is fine for simple selection

        // Component-based library for assembling catalysts
        this.catalystComponents = {
            "Self-Preservation": {
                factors: ["Immediate physical danger", "Starvation or Exposure", "Routine Hunger or Thirst", "Life-threatening accident", "Predator pursuit"],
                carrots: [
                    { text: "Survival", value: 5, command: "Stress:Relieve(amount=5)" },
                    { text: "Sustenance", value: 3, command: "Stress:Relieve(amount=3)" },
                    { text: "Safety", value: 4, command: "Stress:Relieve(amount=4)" },
                    { text: "Gone to Ground (Break)", value: 4, command: "Drama:Break(type=Gone to Ground)" }
                ],
                sticks: [
                    { text: "Death", value: 5, command: "Wound:Apply(type=Carnage)" },
                    { text: "Severe Injury", value: 4, command: "Wound:Apply(type=Mortal)" },
                    { text: "Debilitation", value: 3, command: "Stress:Add(amount=3)" },
                    { text: "Ratchet: Danger Increases", value: 3, command: "Drama:Prod(type=Ratchet)" }
                ],
                bluffs: ["The danger is a distraction for a theft occurring elsewhere.", "The threat is not as real as it appears.", "Safety lies in the most dangerous looking direction."]
            },
            "Social Pressures": {
                factors: ["Peer expectation to conform", "Demand from Authority", "Routine Social Etiquette", "Family Obligation", "Cultural Taboo"],
                carrots: [
                    { text: "Acceptance and Status", value: 2, command: "Resources:Harvest(sway=Dominion)" },
                    { text: "Promotion or Favor", value: 3, command: "Resources:Harvest(sway=Chi)" },
                    { text: "Reputation Boost", value: 2, command: "Descendant:Create(type=Lore)" },
                    { text: "Comic Relief (Break)", value: 3, command: "Drama:Break(type=Comic Relief)" }
                ],
                sticks: [
                    { text: "Ostracization", value: 3, command: "Stress:Add(amount=4)" },
                    { text: "Punishment or Imprisonment", value: 4, command: "Drama:Prod(type=Threats)" },
                    { text: "Social Faux Pas", value: 2, command: "Stress:Add(amount=2)" },
                    { text: "Ratchet: Social Stigma", value: 3, command: "Drama:Prod(type=Ratchet)" }
                ],
                bluffs: ["The group is planning to scapegoat the Character later.", "The promotion is to a department being set up to fail.", "Maintaining status requires compromising personal values."]
            },
            "Economic Stimulus": {
                factors: ["Financial opportunity", "Job offer", "Market fluctuation", "Scarcity", "Debt Call", "Day Job"],
                carrots: [
                    { text: "Wealth gain", value: 3, command: "Resources:Harvest(sway=Burden)" },
                    { text: "Profit", value: 2, command: "Resources:Harvest(sway=Burden)" },
                    { text: "Steady Income", value: 1, command: "Resources:Harvest(sway=Burden)" },
                    { text: "Gain (Break)", value: 3, command: "Drama:Break(type=Gain)" }
                ],
                sticks: [
                    { text: "Poverty or Debt", value: 2, command: "Resources:Pay(resource=Wealth, amount=5)" },
                    { text: "Bankruptcy", value: 3, command: "Resources:Pay(resource=Wealth, amount=10)" },
                    { text: "Unemployment", value: 2, command: "Resources:Pay(resource=Wealth, amount=2)" },
                    { text: "Ratchet: Debt Call", value: 3, command: "Drama:Prod(type=Ratchet)" }
                ],
                bluffs: ["The opportunity is a Ponzi scheme.", "The scarcity is artificial.", "The company is secretly bankrupt."]
            },
            "Dark Impulses": {
                factors: ["Forbidden desire", "Intrusive thought", "Call of the Void", "Opportunity for Theft", "Lust"],
                carrots: [
                    { text: "Immediate gratification", value: 3, command: "Stress:Relieve(amount=5)" },
                    { text: "Secret Thrill", value: 2, command: "Stress:Relieve(amount=2)" },
                    { text: "Stressed-Out (Break)", value: 4, command: "Drama:Break(type=Stressed-Out)" }
                ],
                sticks: [
                    { text: "Guilt and Shame", value: 2, command: "Stress:Add(amount=3)" },
                    { text: "Arrest", value: 4, command: "Drama:Prod(type=Threats)" },
                    { text: "Ratchet: Obsession Grows", value: 3, command: "Drama:Prod(type=Ratchet)" }
                ],
                bluffs: ["The object of desire is cursed.", "You are being watched.", "The thrill will fade immediately."]
            },
            "Quest Spurs": {
                factors: ["Call to adventure", "Plea for Help", "Prophecy of Doom", "Mission Assignment", "Treasure Map"],
                carrots: [
                    { text: "Glory and Reward", value: 4, command: "Resources:Harvest(sway=Chi, amount=5)" },
                    { text: "Experiences / Growth", value: 3, command: "Resources:Harvest(sway=Chi)" },
                    { text: "Sweeping (Break)", value: 3, command: "Drama:Break(type=Sweeping)" }
                ],
                sticks: [
                    { text: "Failure and Doom", value: 5, command: "Drama:Prod(type=Threats)" },
                    { text: "World End", value: 5, command: "Drama:Prod(type=Diabolus ex Machina)" },
                    { text: "Ratchet: Time Runs Out", value: 4, command: "Drama:Prod(type=Ratchet)" }
                ],
                bluffs: ["The Quest Giver is the Villain.", "The treasure is a metaphor.", "The prophecy refers to someone else."]
            },
            "Chaos Cause": {
                factors: ["Random Event", "Accident", "Misunderstanding", "Prank", "Glitch"],
                carrots: [
                    { text: "Curiosity satisfied", value: 1, command: "Resources:Harvest(sway=Key)" },
                    { text: "Amusement", value: 1, command: "Stress:Relieve(amount=1)" },
                    { text: "Cow Drop (Break)", value: 3, command: "Drama:Break(type=Cow Drop)" }
                ],
                sticks: [
                    { text: "Unintended Disaster", value: 4, command: "Drama:Prod(type=Murphy's Law)" },
                    { text: "Confusion", value: 2, command: "Stress:Add(amount=2)" },
                    { text: "Ratchet: Chaos Escalates", value: 3, command: "Drama:Prod(type=Ratchet)" }
                ],
                bluffs: ["The chaotic element is actually a controlled test.", "It wasn't an accident.", "The glitch is a message."]
            },
            "Conflict Incitements": {
                factors: ["Drafted", "Collateral Damage", "Forced to Choose Sides", "Pressure to join", "Insult to Honor"],
                carrots: [
                    { text: "Ally Support", value: 3, command: "Descendant:Create(type=Pact)" },
                    { text: "Protection", value: 2, command: "Resources:Harvest(sway=Rook)" },
                    { text: "Reversal (Break)", value: 4, command: "Drama:Break(type=Reversal)" }
                ],
                sticks: [
                    { text: "Targeted by Enemy", value: 3, command: "Drama:Prod(type=Threats)" },
                    { text: "Labelled Traitor", value: 3, command: "Stress:Add(amount=3)" },
                    { text: "Ratchet: Conflict Escalates", value: 3, command: "Drama:Prod(type=Ratchet)" }
                ],
                bluffs: ["Both sides are manipulated by the same hand.", "The war is already over.", "Your side is going to lose."]
            },
            "Environmental Encouragements": {
                factors: ["Heavy Rain", "Extreme Heat", "Dense Fog", "Difficult Terrain", "Bitter Cold", "Pleasant Sunshine"],
                carrots: [
                    { text: "Comfort", value: 2, command: "Stress:Relieve(amount=3)" },
                    { text: "Vitamin D / Health", value: 1, command: "Stress:Relieve(amount=2)" },
                    { text: "Postpone (Break)", value: 3, command: "Drama:Break(type=Postpone)" }
                ],
                sticks: [
                    { text: "Exposure", value: 3, command: "Wound:Apply(type=Flesh)" },
                    { text: "Getting Lost", value: 2, command: "Drama:Prod(type=Obstacle)" },
                    { text: "Ratchet: Weather Worsens", value: 3, command: "Drama:Prod(type=Ratchet)" }
                ],
                bluffs: ["The weather forecast was completely wrong.", "The terrain hides a shortcut.", "The fog conceals a lurking danger."]
            },
            "Hitch Desires": {
                factors: ["Addiction Trigger", "Compulsion", "Bad Habit", "Obsession"],
                carrots: [
                    { text: "Satiation", value: 3, command: "Stress:Relieve(amount=5)" },
                    { text: "Relief", value: 2, command: "Stress:Relieve(amount=3)" },
                    { text: "Stressed-Out (Break)", value: 4, command: "Drama:Break(type=Stressed-Out)" }
                ],
                sticks: [
                    { text: "Withdrawal", value: 4, command: "Stress:Add(amount=5)" },
                    { text: "Distraction", value: 2, command: "Drama:Prod(type=Snag)" },
                    { text: "Ratchet: Withdrawal Symptoms", value: 3, command: "Drama:Prod(type=Ratchet)" }
                ],
                bluffs: ["The supplier is using the addiction to gather blackmail.", "You can quit anytime.", "Just one won't hurt."]
            },
            "Immediate Incentives": {
                factors: ["Bribe offered", "Threat issued", "Trade proposed", "Ultimatum"],
                carrots: [
                    { text: "Immediate Gain", value: 2, command: "Resources:Harvest(sway=Chi)" },
                    { text: "Safety", value: 2, command: "Stress:Relieve(amount=2)" },
                    { text: "Interrupt (Break)", value: 3, command: "Drama:Break(type=Interrupt)" }
                ],
                sticks: [
                    { text: "Immediate Violence", value: 3, command: "Wound:Apply(type=Maiming)" },
                    { text: "Stressed", value: 2, command: "Stress:Add(amount=2)" },
                    { text: "Ratchet: Immediate Threat", value: 3, command: "Drama:Prod(type=Ratchet)" }
                ],
                bluffs: ["The NPC intends to betray the Character immediately.", "The bribe is counterfeit.", "The threat is a bluff."]
            },
            "Oracular Encouragement": {
                factors: [
                    "Hexagram Gain Condition Met",
                    "Character's Hexagram Line 1 is active",
                    "Character's Hexagram Line 2 is active",
                    "Character's Hexagram Line 3 is active",
                    "Character's Hexagram Line 4 is active",
                    "Character's Hexagram Line 5 is active",
                    "Character's Hexagram Line 6 is active",
                    "Character's Unchanging Power is triggered",
                    "A Changing Line transforms the Hexagram"
                ],
                carrots: [
                    { text: "Hexagram Gain (Variable)", value: 6, command: "Resources:Harvest(method=CharacterType)" },
                    { text: "Line Gain (Variable)", value: 2, command: "Resources:Harvest(sway=Tao)" },
                    { text: "Unchanging Power Benefit", value: 4, command: "Resources:Harvest(sway=Chi, amount=2)" },
                    { text: "Narrative Break (Gain)", value: 3, command: "Drama:Break(type=Gain)" }
                ],
                sticks: [
                    { text: "Hexagram Stress (Variable)", value: 4, command: "Stress:Add(method=CharacterType)" },
                    { text: "Line Quest Complication", value: 3, command: "Drama:Prod(type=Obstacle)" },
                    { text: "Hexagram Constraint", value: 4, command: "Stress:Add(amount=3)" },
                    { text: "Ratchet: Tension Rises", value: 3, command: "Drama:Prod(type=Ratchet)" }
                ],
                bluffs: ["The omen is misinterpreted.", "The destiny belongs to another.", "The I-Ching is being manipulated."]
            },
            "Personal Proclivities": {
                factors: ["Persona Motivation", "Persona Avoidance", "Core Value challenged", "Hobby interest"],
                carrots: [
                    { text: "Persona Gain (Variable)", value: 6, command: "Resources:Harvest(method=CharacterType)" },
                    { text: "Self-Actualization", value: 3, command: "Resources:Harvest(sway=Chi)" },
                    { text: "Satisfaction", value: 2, command: "Stress:Relieve(amount=2)" },
                    { text: "Exposition (Break)", value: 3, command: "Drama:Break(type=Exposition)" }
                ],
                sticks: [
                    { text: "Persona Stress (Variable)", value: 4, command: "Stress:Add(method=CharacterType)" },
                    { text: "Self-Loathing", value: 2, command: "Stress:Add(amount=3)" },
                    { text: "Boredom", value: 1, command: "Stress:Add(amount=1)" },
                    { text: "Ratchet: Self-Doubt", value: 2, command: "Drama:Prod(type=Ratchet)" }
                ],
                bluffs: ["The opportunity is a setup to mock you.", "You don't really want this.", "It's a trap for your ego."]
            },
            "Psychosocial Pushes and Pulls": {
                factors: ["A strong memory surfaces", "An urge becomes undeniable", "A principle is challenged", "Emotional demand"],
                carrots: [
                    { text: "Emotional Stability", value: 2, command: "Stress:Relieve(amount=3)" },
                    { text: "Enter Desired State", value: 2, command: "Stress:Relieve(amount=2)" },
                    { text: "Consequences (Break)", value: 3, command: "Drama:Break(type=Consequences)" }
                ],
                sticks: [
                    { text: "Mental Anguish", value: 3, command: "Stress:Add(amount=3)" },
                    { text: "Cognitive Dissonance", value: 2, command: "Stress:Add(amount=2)" },
                    { text: "Ratchet: Mental Anguish", value: 3, command: "Drama:Prod(type=Ratchet)" }
                ],
                bluffs: ["The repulsion feels artificial, like a conditioned response.", "The memory is false.", "Leaving the state will cause more harm than staying."]
            },
            "Shadow Impulses": {
                factors: ["Shadow Self whispers", "Dark urge", "Self-destructive impulse", "Intrusive thought"],
                carrots: [
                    { text: "Power/Knowledge", value: 3, command: "Descendant:Create(type=Lore)" },
                    { text: "Release", value: 2, command: "Stress:Relieve(amount=2)" },
                    { text: "Reversal (Break)", value: 4, command: "Drama:Break(type=Reversal)" }
                ],
                sticks: [
                    { text: "Corruption", value: 5, command: "Trauma:Apply(type=Corruption)" },
                    { text: "Loss of Control", value: 4, command: "Stress:Add(amount=4)" },
                    { text: "Ratchet: Shadow Takes Control", value: 5, command: "Drama:Prod(type=Ratchet)" }
                ],
                bluffs: ["The voice belongs to a malevolent entity.", "You are not yourself.", "Giving in will fix everything."]
            }
        };
    }

    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;
        try {
            this.catalystTypes = await CodexLoader.getData('characters', 'characterCatalysts.json') || [];
            this.initialized = true;
            Logger.message('T13NE_Catalysts: Initialized.');
        } catch (error) {
            Logger.error(`T13NE_Catalysts: Initialization failed: ${error}`);
        }
    }

    createCatalyst(data) {
        // Apply component-based assembly if type matches and fields are missing
        if (data.type && this.catalystComponents[data.type]) {
            const components = this.catalystComponents[data.type];

            // Pick a random Factor if not provided
            if (!data.factor) data.factor = this.getRandomElement(components.factors);

            // Randomly decide structure: Carrot only, Stick only, or Both.
            // Bias towards having at least one.
            const hasCarrot = data.carrot || Math.random() > 0.3;
            const hasStick = data.stick || (!hasCarrot) || Math.random() > 0.3;

            if (hasCarrot && !data.carrot) {
                const c = this.getRandomElement(components.carrots);
                data.carrot = c.text;
                data.carrotValue = c.value;
                data.carrotCommand = c.command;
            }

            if (hasStick && !data.stick) {
                const s = this.getRandomElement(components.sticks);
                data.stick = s.text;
                data.stickValue = s.value;
                data.stickCommand = s.command;
            }

            // Bluffs are strictly optional (30% chance if not specified)
            if (!data.bluff && Math.random() > 0.7) {
                data.bluff = this.getRandomElement(components.bluffs);
            }
        }
        return new CharacterCatalyst(data);
    }

    /**
     * Triggers the catalyst's effect based on outcome.
     * @param {object} character 
     * @param {CharacterCatalyst} catalyst 
     * @param {string} outcome - 'Carrot' or 'Stick'
     */
    async trigger(character, catalyst, outcome) {
        const command = outcome === 'Stick' ? catalyst.stickCommand : catalyst.carrotCommand;
        if (command && this.t13ne) {
            const Commands = this.t13ne.getModule('Commands');
            if (Commands) {
                Logger.message(`Catalyst ${catalyst.name} triggering ${outcome}: ${command}`);
                await Commands.execute(command, { character, catalyst });
            }
        } else {
            Logger.warn(`Catalyst ${catalyst.name} has no command for ${outcome}.`);
        }
    }

    getRandomElement(arr) {
        if (!arr || arr.length === 0) return null;
        return arr[Math.floor(this.prng.random() * arr.length)];
    }

    /**
     * Generates a catalyst using AI based on character context.
     * @param {string} type - The type of catalyst.
     * @param {object} character - The character object.
     * @returns {Promise<CharacterCatalyst>}
     */
    async generateCatalystAI(type, character) {
        const prompt = `Generate a T13NE Character Catalyst for ${character.name}.
        Type: ${type}
        Character Archetype: ${character.personaDetails?.Name || 'Unknown'}
        Motivation: ${character.personaDetails?.Motivation || 'Unknown'}
        
        Create a specific:
        - Factor: The situation or requirement.
        - Carrot: The incentive (Gain).
        - CarrotValue: 1-10 score of incentive.
        - Stick: The consequence (Peril).
        - StickValue: 1-10 score of peril.
        - Bluff: What is hidden or lied about.
        
        Respond with JSON only.`;

        try {
            const response = await AIService.generateText(prompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                return this.createCatalyst({ type, ...data });
            }
        } catch (e) {
            Logger.warn("T13NE_Catalysts: AI generation failed, using defaults.", e);
        }
        return this.createCatalyst({ type });
    }

    /**
     * Populates a character's Psychosocial Space with Internalized Characters and Catalysts.
     * @param {object} character 
     */
    populatePsychosocial(character) {
        if (!character || !character.psychosocialSpace) return;
        const space = character.psychosocialSpace;

        // 1. Internalized Characters
        // Ego/Core
        space.addEntity({
            id: 'ego_core',
            name: 'Ego (Core)',
            type: 'InternalizedCharacter',
            description: 'The conscious self and core identity.',
            facets: character.personalityAnnex?.cores || []
        }, { x: 0, y: 0, z: 0 });

        // Persona
        if (character.personaDetails) {
            space.addEntity({
                id: 'persona_mask',
                name: `Persona: ${character.personaDetails.Name}`,
                type: 'InternalizedCharacter',
                description: `Motivation: ${character.personaDetails.Motivation}`,
                facets: [character.personaDetails.Name]
            }, { x: 5, y: 5, z: 0 });
        }

        // Shadow
        if (character.personaDetails && character.personaDetails.Shadow) {
            space.addEntity({
                id: 'shadow_self',
                name: 'The Shadow',
                type: 'InternalizedCharacter',
                description: character.personaDetails.Shadow,
                facets: ['Shadow']
            }, { x: -5, y: -5, z: 0 });
        }

        // 2. Catalysts as Entities
        if (character.catalysts && Array.isArray(character.catalysts)) {
            character.catalysts.forEach((cat, index) => {
                // Position catalysts around the space
                const angle = (index / character.catalysts.length) * Math.PI * 2;
                const radius = 8;
                space.addEntity({
                    id: cat.id,
                    name: `Catalyst: ${cat.name}`,
                    type: 'CatalystEntity',
                    description: `Factor: ${cat.factor}\nCarrot: ${cat.carrot} (${cat.carrotValue})\nStick: ${cat.stick} (${cat.stickValue})`,
                    facets: [cat.type],
                    catalystData: cat
                }, {
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius,
                    z: 0
                });
            });
        }

        Logger.message(`T13NE_Catalysts: Populated Psychosocial Space for ${character.name}.`);
    }

    /**
     * Resolves a collision between two catalysts.
     * @param {CharacterCatalyst} cat1 
     * @param {CharacterCatalyst} cat2 
     * @returns {object} Result of collision { winner, action, description }
     */
    resolveCollision(cat1, cat2) {
        // Calculate effective scores based on Carrot and Stick values
        // High stick values (Peril) often outweigh Carrots in immediate collisions (Self-preservation)
        // But high Carrots (Ambition) can override low Sticks.

        const getEffectiveScore = (cat) => {
            let s = cat.score || (cat.carrotValue + cat.stickValue);
            // Bluffs might inflate perceived score, or deflate if known? 
            // For now, assume score reflects the character's perception.
            return s;
        };

        let score1 = getEffectiveScore(cat1);
        let score2 = getEffectiveScore(cat2);

        const diff = score1 - score2;
        let result = { winner: null, action: '', description: '' };

        if (Math.abs(diff) >= 5) {
            const winner = diff > 0 ? cat1 : cat2;
            const loser = diff > 0 ? cat2 : cat1;
            result.winner = winner;
            result.action = 'Remove Loser';
            result.description = `${winner.name} (Score ${Math.max(score1, score2)}) completely overwhelms ${loser.name} (Score ${Math.min(score1, score2)}). The loser is ignored.`;
        } else if (Math.abs(diff) >= 1) {
            const winner = diff > 0 ? cat1 : cat2;
            result.winner = winner;
            result.action = 'Prioritize Winner';
            result.description = `${winner.name} takes precedence, but ${diff > 0 ? cat2.name : cat1.name} remains a nagging concern.`;
        } else {
            // Tie or close
            if (score1 > 10) { // High stakes collision
                result.action = 'Internal Conflict';
                result.description = `Major internal conflict between ${cat1.name} and ${cat2.name}. Both demands are high. Creates Stress.`;
            } else {
                result.action = 'Merge';
                result.description = `${cat1.name} and ${cat2.name} merge into a complex motivation.`;
            }
        }

        // Append command info to description for debugging/narrative use
        if (result.winner) {
            result.description += ` Potential Outcome: ${result.winner.carrot} (Carrot) or ${result.winner.stick} (Stick).`;
        }

        return result;
    }
}

export default new T13NE_Catalysts();







