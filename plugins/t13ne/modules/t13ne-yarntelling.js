import Logger from '@plugins/t13ne/core/Logger.js';
import AIService from '../modules/AIService.js';
import T13NECardsAPI from '../modules/t13ne-cards-api.js';

/**
 * T13YarnTeller
 * Implements the "Yarn-tellers, Weavers and Plots" rules.
 * Acts as a narrator and storyteller using AI.
 */
class T13YarnTeller {
    constructor(character = null, voice = 'The Pantser') {
        this.character = character; // The character acting as Yarn-Teller (null for Referee)
        this.customStyles = {};
        this.voice = voice;
        this.narrativeStyle = this._getStyleFromVoice(voice);
    }

    /**
     * Sets the narrative voice for this Yarn-Teller.
     * @param {string} voice - The name of the voice (e.g., 'The Grim', 'random', '2-Blended').
     */
    setVoice(voice) {
        const styles = this._getAllStyles();
        let selectedVoice = voice;
        let styleData = styles[voice];
        let styleDescription = "";
        let styleTemp = 0.7;

        if (voice === 'random') {
            const keys = Object.keys(styles);
            selectedVoice = keys[Math.floor(Math.random() * keys.length)];
            styleData = styles[selectedVoice];
            styleDescription = styleData.description;
            styleTemp = styleData.temperature;
        } else if (typeof voice === 'string' && voice.includes('+')) {
            const voiceNames = voice.split('+').map(v => v.trim());
            const pickedStyles = voiceNames.map(k => styles[k]).filter(Boolean); // filter out invalid names

            if (pickedStyles.length > 1) {
                selectedVoice = voiceNames.join(' + ');
                styleDescription = pickedStyles.map(s => s.description).join(' ');
                const totalTemp = pickedStyles.reduce((sum, s) => sum + s.temperature, 0);
                styleTemp = totalTemp / pickedStyles.length;
            } else if (pickedStyles.length === 1) {
                // If only one valid voice was passed after trimming/splitting, just use that one
                selectedVoice = voiceNames.find(k => styles[k]);
                styleData = pickedStyles[0];
                styleDescription = styleData.description;
                styleTemp = styleData.temperature;
            }
        } else if (typeof voice === 'string' && voice.endsWith('-Blended')) {
            const match = voice.match(/^(\d+)-Blended$/);
            if (match) {
                const n = Math.max(2, parseInt(match[1], 10));
                const keys = Object.keys(styles);
                const picked = [];
                for (let i = 0; i < n && keys.length > 0; i++) {
                    const idx = Math.floor(Math.random() * keys.length);
                    picked.push(keys[idx]);
                    keys.splice(idx, 1);
                }
                selectedVoice = picked.join(' + ');
                const pickedStyles = picked.map(k => styles[k]);
                styleDescription = pickedStyles.map(s => s.description).join(' ');
                const totalTemp = pickedStyles.reduce((sum, s) => sum + s.temperature, 0);
                styleTemp = totalTemp / pickedStyles.length;
            }
        } else {
             if (styleData) {
                 styleDescription = styleData.description;
                 styleTemp = styleData.temperature;
             }
        }

        if (!styleDescription) {
            styleDescription = styles['Default'].description;
            styleTemp = styles['Default'].temperature;
        }

        this.voice = selectedVoice;
        this.narrativeStyle = styleDescription;
        this.temperature = styleTemp;
        Logger.message(`YarnTeller: Voice set to '${this.voice}' (Temp: ${this.temperature.toFixed(2)})`);
    }

    _getAllStyles() {
        const styles = {
            'The Bedlamite': { description: 'Blurring reality and fantasy, favoring prophecies, dream scenes, monsters, fringe science, and conspiracy theories.', temperature: 0.9 },
            'The Blowhard': { description: 'Self-aggrandizing, focusing on the narrator\'s own character\'s gains, appearance, and importance.', temperature: 0.6 },
            'The Borrowed Bard': { description: 'Retelling classic stories with a new spin, often formulaic and trope-heavy.', temperature: 0.5 },
            'The Builder': { description: 'Focused on exploration, maps, tactical details, and the physical environment.', temperature: 0.3 },
            'The Clown': { description: 'Humorous, absurd, playing with conventions and truth, seeking to amuse or confuse.', temperature: 0.85 },
            'The Daredevil': { description: 'Action-oriented, fast-paced, high stakes, focusing on physical feats and danger.', temperature: 0.75 },
            'The Fabulist': { description: 'Lying, ignoring established facts, whimsical, creating complex fantasies.', temperature: 0.9 },
            'The Grim': { description: 'Gritty realism, negative consequences, moral ambiguity, and the darker side of life.', temperature: 0.6 },
            'The Historian': { description: 'Dense, politically charged, drawn from history, focusing on cause and effect.', temperature: 0.4 },
            'The Journalist': { description: 'Detail-oriented, recording and reusing facts, woven deeply into the world lore.', temperature: 0.3 },
            'The Kid': { description: 'Simple, black and white morality, monster-of-the-week, ignoring complex consequences.', temperature: 0.6 },
            'The Noire': { description: 'Metaphorical, dark themes, simple plots with tropes, cynical and atmospheric.', temperature: 0.65 },
            'The Pantser': { description: 'Improvised, reactive, spontaneous, sometimes inconsistent but energetic.', temperature: 0.8 },
            'The Purple Poet': { description: 'Verbose, descriptive, complex vocabulary, focusing on imagery and emotion.', temperature: 0.75 },
            'The Thespian': { description: 'Focused on NPC interactions and dialogue, show-don\'t-tell, dramatic flair.', temperature: 0.7 },
            'The Train Driver': { description: 'Linear, focused on the plot track, resistant to deviation.', temperature: 0.2 },
            'The Visionary': { description: 'Visual, cinematic, symbolic, focusing on the "shot" and symbolism.', temperature: 0.7 },
            'The Watson': { description: 'Supportive, grounded, focusing on observing powerful NPCs or other characters.', temperature: 0.5 },
            'The Sportscaster': { description: 'Energetic, play-by-play narration, focusing on action and key moments.', temperature: 0.6 },
            'The Scientist': { description: 'Logical, analytical, focusing on cause and effect, puzzles, and problem-solving.', temperature: 0.3 },
            'The Murderer': { description: 'Complex plots, deceptions, plot twists and revelations galore', temperature: 0.8 },
            'The Vague': { description: 'Nebulous difficult to underrstand descriptions, unfocused conversation, meandering narration.', temperature: 0.85 },
            'The Logger': { description: 'Quick Exposition dump in the form of a character\'s journal or captain\'s log entry.', temperature: 0.4 },
            'The Chorus': { description: 'Adds commentary and opinions about the actions of the main characters, may directly address the audience for laughs.', temperature: 0.7 },
            'The Philosopher': { description: 'Makes philosphical points with metaphor, dialogue and theme, these are often crucial insights into characters and situations.', temperature: 0.6 },
            'The Fauxlosopher': { description: 'Makes philosphical points with metaphor, dialogue and theme, however these are never pertinent to the situation at hand and act to create an illusion of depth.', temperature: 0.75 },
            'The Auteur': { description: 'Likes to hide details, clues and revelations in descriptions, handouts, and dialogue. Favours shorter words and punchier dialogue.', temperature: 0.6 },
            'The Mirror': { description: 'Tells fantasy and science-fiction stories that reflect on real world issues and tries to offer new solutions', temperature: 0.6 },
            'The Planner': { description: 'Merticulously detailed, sparkling and witty plots, well crafted dialogue, but all a little overworked, a little try hard.', temperature: 0.4 },
            'The Vamp': { description: 'Seductive, mysterious, sensual, charming, often uses hypnotic language patterns, or inuendo, and typically morally ambiguous.', temperature: 0.7 },
            'The Romantic': { description: 'Bold adventurers seeking sublime experiences, driven by feelings and emotions, imaginative language, and emotional reactions.', temperature: 0.75 },
            'The Neoclassical': { description: 'Empirical and formal, typically drawing on Roman and Greek history and mythology, clean narrative and often quite formal dialogue.', temperature: 0.4 },
            'The Guttersnipe': { description: 'Fast paced narration, dialogue very slang and dialect driven, dialogue should be almost impenetrable sometimes.', temperature: 0.8 },
            'The Handwaver': { description: 'Balanced, emotive descriptions and dialogue, but light on details, motivations and very light on exposition.', temperature: 0.6 },'The Horror Host': { description: 'Creepy, unsettling, taking sadistic glee in the events unfolding. Slightly morbid humour.', temperature: 0.75 },
            'The Stoic': { description: 'Suppressed emotions, brusque characters, avoids emotional dialogue and scenes, or offers detached interest.', temperature: 0.3 },
            'The Quiet': { description: 'Dialogue is short and to the point, characters will often answer questions with an enigmatic non-answer, or gesture.', temperature: 0.4 },
            'The Motormouth': { description: 'Dialogue is long, dense and only sometimes sesquipedalian in its loquaciousness and babbling, circumlocution is often employed.', temperature: 0.8 },
            'The Rhymer': { description: 'Dialogue and narration will often contain half-rhymes and use of specific meter, full rhymes should be used to emphasise points.', temperature: 0.7 },
            'The Mechanic': { description: 'Concise and terse descriptions, more focus on details and explanations, dialogue is conversational, detail-orientated, pedantic.', temperature: 0.3 },
            'The Noncommital': { description: 'Half-hearted and indecisive, dialogue often vaccilates and doubles back, narration and descriptions are agnostic, undogmatic, and open-minded.', temperature: 0.6 },
            'The Hatemonger': { description: 'Dialogue is somewhat rough, harsh, and hate-filled, usually targeting a particular group or character, descriptions are also similarly coloured by this perpsective', temperature: 0.8 },
            'The Third': { description: 'All dialogue, narration and descriptions are described in 3rd person, regardless of who is talking to whom.', temperature: 0.5 },
            'The Oracle': { description: 'Focused on omens, destiny, and cryptic metaphors. Solemn and portentous.', temperature: 0.8 },
            'The Gossip': { description: 'Focuses on social connections, reputation, hearsay, and the "word on the street".', temperature: 0.75 },
            'The Tactician': { description: 'Focuses on military precision, logistics, angles, and strategic advantage.', temperature: 0.4 },
            'The Minimalist': { description: 'Uses short, punchy sentences. Avoids adjectives. Focuses purely on immediate action and sensory facts.', temperature: 0.2 },
            'The Stream of Consciousness': { description: 'Deeply internal, focusing on the raw flow of thought, sensory association, and memory.', temperature: 0.85 },
            'The Diplomat': { description: 'Formal, polite, seeking consensus, avoiding offense, using soft power.', temperature: 0.5 },
            'The Interrogator': { description: 'Question-heavy, aggressive, seeking truth, skeptical, demanding answers.', temperature: 0.6 },
            'The Jargonist': { description: 'Uses heavy technical, magical, or specific jargon, often impenetrable to outsiders.', temperature: 0.65 },
            'The Hard-Boiled Detective': { description: 'Gritty, cynical, first-person narration, focusing on the underbelly of society and moral ambiguity.', temperature: 0.6 },
            'The Investigator': { description: 'Methodical, questioning, seeking clues and connections, focusing on the "who, what, where, when, and why".', temperature: 0.4 },
            'The Satirist': { description: 'Uses irony, sarcasm, and ridicule to expose and criticize foolishness or corruption.', temperature: 0.75 },
            'The Creep': { description: 'Unsettling, voyeuristic, focusing on uncomfortable details and crossing personal boundaries.', temperature: 0.8 },
            'The Punster': { description: 'Compulsive wordplay, dad jokes, and linguistic humor, often at inappropriate times.', temperature: 0.85 },
            'The Liar': { description: 'Unreliable, contradictory, self-serving, prone to exaggeration and fabrication.', temperature: 0.9 },
            'The Fearmonger': { description: 'Focuses on threats, dangers, paranoia, and worst-case scenarios.', temperature: 0.7 },
            'The Fear': { description: 'Focuses on psychological horror, inducing anxiety, anguish, tension and suspense.', temperature: 0.7 },
            'The Idiot': { description: 'Simple, confused, missing the point, focusing on irrelevant details, uses long words incorrectly in dialogue.', temperature: 0.85 },
            'The Academic': { description: 'Pedantic, referencing obscure texts, theoretical, detached, and verbose.', temperature: 0.4 },
            'The Lawyer': { description: 'Prone to pedantry, legalese and verbosity, but personable, communicative, and persuasive.', temperature: 0.4 },
            'Default': { description: 'Balanced, descriptive, and reactive to the current situation.', temperature: 0.7 }
        };
        return { ...styles, ...this.customStyles };
    }

    /**
     * Returns a list of all available voice names.
     * @returns {string[]} Array of voice names.
     */
    getAvailableVoices() {
        return Object.keys(this._getAllStyles());
    }

    /**
     * Adds a new custom voice style dynamically.
     * @param {string} name - The name of the voice.
     * @param {string} description - The description of the narrative style.
     * @param {number} [temperature=0.7] - The temperature for AI generation.
     */
    addCustomVoice(name, description, temperature = 0.7) {
        this.customStyles[name] = { description, temperature };
        Logger.message(`YarnTeller: Added custom voice '${name}'`);
    }

    _getStyleFromVoice(voice) {
        const styles = this._getAllStyles();
        const style = styles[voice] || styles['Default'];
        return style.description;
    }

    /**
     * Generates narration for a scene or event.
     * @param {object} context - Context data for the narration.
     * @param {string} [context.type='Scene'] - Type of narration ('Scene', 'Action', 'Dialogue', 'Summary').
     * @param {object} [context.plot] - The current plot object.
     * @param {object} [context.location] - The location object.
     * @param {Array} [context.characters] - List of characters present.
     * @param {string} [context.action] - Description of an action taking place.
     * @param {Array} [context.cards] - Yarn/Ordeal cards involved.
     * @param {number} [temperature=null] - Controls the creativity of the AI (0.0 to 1.0). If null, uses voice default.
     * @returns {Promise<string>} The generated narration text.
     */
    async narrate(context, temperature = null) {
        const prompt = this._buildNarrationPrompt(context);
        const temp = temperature !== null ? temperature : (this.temperature || 0.7);
        try {
            const response = await AIService.generateText(prompt, { temperature: temp });
            return response;
        } catch (error) {
            Logger.error("YarnTeller: Failed to generate narration.", error);
            return "The Yarn-Teller falls silent, struggling to find the words.";
        }
    }

    _buildNarrationPrompt(context) {
        let prompt = `You are a Narrator.
Your Narrative Voice is: "${this.voice}".
Style Guide: ${this.narrativeStyle}

Context:
`;
        if (context.genre) prompt += `Genre: ${context.genre}\n`;
        if (context.era) prompt += `Era: ${context.era}\n`;

        if (this.character) {
            prompt += `You are narrating as the character: ${this.character.name}.
Perspective: 1st Person ("I saw...", "I did...").
Limitations: You can only describe what your character perceives. You cannot compel other player characters' thoughts or actions, but you can describe their external reactions or the environment's response to them.
`;
        } else {
            prompt += `You are the Referee/System Narrator.
Perspective: 3rd Person Omniscient or Limited as appropriate.
`;
        }

        if (context.plot) {
            prompt += `Current Plot: ${context.plot.Name} (Tension: ${context.plot.tensionLevel || 'Unknown'}).\n`;
            if (context.plot.Conflict) {
                prompt += `Conflict: ${JSON.stringify(context.plot.Conflict)}\n`;
            }
        }

        if (context.location) {
            prompt += `Location: ${context.location.Name || 'Unknown Location'}. ${context.location.Description || ''}\n`;
        }

        if (context.characters) {
            prompt += `Characters Present: ${context.characters.map(c => c.name).join(', ')}.\n`;
        }

        if (context.cards && context.cards.length > 0) {
            prompt += `Cards in Play: ${context.cards.map(c => T13NECardsAPI.extractCardTextForAI(c)).join('; ')}.\n`;
        }

        if (context.action) {
            prompt += `Action/Event to Narrate: ${context.action}\n`;
        }

        prompt += `\nTask: Generate a narrative description of the event/scene based on your Voice and the Context provided. Keep it evocative.`;

        return prompt;
    }

    /**
     * Generates dialogue for the Yarn-Teller character or an NPC.
     * @param {string} targetName - Name of the character being spoken to.
     * @param {string} topic - The topic of conversation.
     * @param {string} [tone] - Optional tone (e.g., 'Angry', 'Secretive').
     * @returns {Promise<string>} The generated dialogue.
     */
    async speak(targetName, topic, tone = 'Neutral') {
        const speakerName = this.character ? this.character.name : 'Narrator';
        
        let prompt = `Generate dialogue for ${speakerName}.
Voice/Style: ${this.voice} (${this.narrativeStyle}).
Speaking to: ${targetName}.
Topic: ${topic}.
Tone: ${tone}.

Output only the dialogue text, in character.`;

        try {
            return await AIService.generateText(prompt);
        } catch (error) {
            Logger.error("YarnTeller: Failed to generate dialogue.", error);
            return "...";
        }
    }

    /**
     * Handles the "Seize The Spotlight" technique.
     * @param {string} intent - What the Yarn-Teller intends to narrate.
     * @returns {Promise<string>} The narration.
     */
    async seizeSpotlight(intent) {
        // In a full game, this would deduct Yarn points.
        Logger.message(`YarnTeller (${this.character ? this.character.name : 'Ref'}) seizes the spotlight!`);
        return this.narrate({ type: 'Action', action: intent });
    }
    
    /**
     * Handles "Retcon" technique.
     * @param {string} originalEvent - What happened.
     * @param {string} newEvent - What actually happened (the retcon).
     * @returns {Promise<string>} The retcon narration.
     */
    async retcon(originalEvent, newEvent) {
         const prompt = `You are performing a Retcon (Retroactive Continuity).
Original Event: ${originalEvent}
New Reality: ${newEvent}
Narrate the shift or revelation that changes the perception of the event to the new reality, maintaining your narrative voice (${this.voice}).`;
         
         try {
            return await AIService.generateText(prompt);
        } catch (error) {
            Logger.error("YarnTeller: Failed to generate retcon.", error);
            return `Actually, it happened like this: ${newEvent}`;
        }
    }

    /**
     * Bends a scene by replacing a card.
     * @param {object} scene - The scene object.
     * @param {object} card - The card to insert.
     * @param {string} position - 'Beat', 'Significator', or specific detail key.
     */
    async sceneBend(scene, card, position = 'Significator') {
        Logger.message(`YarnTeller: Bending scene '${scene.Type}' with card ${card.name} in position ${position}.`);
        
        // Logic to replace the card in the scene structure
        if (scene.Spread) {
            // Assuming Spread has a way to hold cards, e.g., scene.Spread.cards
            // This is abstract without the exact Scene object structure, but we simulate the effect.
            scene.bent = true;
            scene.bentCard = card;
            return `The scene shifts as ${card.name} influences the ${position}.`;
        }
        return "Scene bending failed.";
    }

    /**
     * Places a bet on a narrative detail ("I Bet It's...").
     * @param {string} statement - The detail being asserted.
     * @param {number} yarnWager - Amount of Yarn wagered.
     * @returns {object} The bet object.
     */
    makeBet(statement, yarnWager) {
        Logger.message(`YarnTeller: Betting ${yarnWager} Yarn that "${statement}".`);
        return {
            type: 'Edit',
            statement,
            wager: yarnWager,
            resolved: false,
            resolve: (accepted) => {
                if (accepted) return `Edit accepted. Yarn returned. Detail: ${statement}`;
                else return `Edit rejected. ${yarnWager} Yarn lost.`;
            }
        };
    }

    /**
     * Initiates a Narrative Showdown.
     * @param {object} challenger - The challenging YarnTeller/Character.
     * @param {object} defendant - The defending YarnTeller/Character.
     * @param {object} scene - The contested scene.
     */
    async narrativeShowdown(challenger, defendant, scene) {
        Logger.message(`YarnTeller: Narrative Showdown initiated between ${challenger.name} and ${defendant.name} over scene ${scene.Type}.`);
        
        // 1. Draw Cards
        const cards = T13NECardsAPI.deck.draw(2);
        const cardC = cards[0];
        const cardD = cards[1];
        
        Logger.message(`Showdown: Challenger drew ${cardC.name}, Defendant drew ${cardD.name}.`);
        
        // 2. Bidding (Simplified)
        // In a real UI this would be interactive. Here we simulate a result or return data for UI.
        return {
            state: 'Bidding',
            challengerCard: cardC,
            defendantCard: cardD,
            scene: scene,
            resolve: (winnerName) => {
                Logger.message(`Showdown: ${winnerName} wins the narration.`);
                return `${winnerName} rewrites the scene.`;
            }
        };
    }

    /**
     * Initiates a Yarn-Tangling Ordeal for moderated retcons.
     * @param {Array} participants - List of YarnTellers/Characters involved.
     * @param {object} plot - The plot context.
     */
    async startYarnTangling(participants, plot) {
        Logger.message(`YarnTeller: Initiating Yarn-Tangling Ordeal.`);
        
        // Dynamic import to avoid circular dependency issues if any
        const { default: T13NE_YarnTangling } = await import('./ordeals/t13ne-yarntangling.js');
        
        const ordeal = new T13NE_YarnTangling({
            participants: participants,
            plot: plot
        });
        
        return ordeal;
    }

    /**
     * Engages in collaborative storytelling ("Yes, And...", "Yes, But...", "No, But...").
     * @param {string} type - 'YesAnd', 'YesBut', 'NoBut'.
     * @param {string} contribution - The added narrative detail.
     * @param {object} [targetYarnTeller] - The YarnTeller being interrupted/supported.
     */
    async collaborate(type, contribution, targetYarnTeller = null) {
        let prefix = "";
        let logMsg = "";

        switch (type) {
            case 'YesAnd':
                prefix = "Yes, and...";
                logMsg = "uses Yes, And... (Gains 1 Yarn)";
                // Logic to add Yarn to self would go here
                break;
            case 'YesBut':
                prefix = "Yes, but...";
                logMsg = "uses Yes, But... (Costs 1 Yarn)";
                // Logic to spend Yarn would go here
                break;
            case 'NoBut':
                prefix = "No, but...";
                logMsg = "uses No, But... (Costs 1 Yarn, Target gains 1 Yarn)";
                // Logic to spend Yarn and give to target would go here
                break;
            default:
                prefix = "";
        }

        Logger.message(`YarnTeller: ${this.character ? this.character.name : 'Ref'} ${logMsg}`);
        return this.narrate({ type: 'Action', action: `${prefix} ${contribution}` });
    }

    /**
     * Initiates a Quantum Contest.
     * @param {Array} otherParticipants - List of other YarnTellers involved.
     * @param {object} scene - The scene being contested.
     */
    async quantumContest(otherParticipants, scene) {
        Logger.message(`YarnTeller: Initiating Quantum Contest.`);
        // In a real implementation, this would interface with T13NE_Drama.createQuantumContest
        return {
            type: 'QuantumContest',
            initiator: this.character,
            participants: [this.character, ...otherParticipants],
            scene: scene
        };
    }
}

export default T13YarnTeller;