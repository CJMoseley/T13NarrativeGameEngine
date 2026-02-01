import Logger from '@/src/t13ne/core/Logger.js';
import AIService from '../modules/AIService.js';
import T13NE_PRNG from '../modules/t13ne-prng.js';
import CodexLoader from '../modules/CodexLoader.js';

/**
 * A generic, context-driven name generator that uses an AI service and procedural techniques.
 * It is designed to generate names in the T13NE standard format:
 * ["common name", "fullname", "aliases"]
 */
export class T13NameGenerator {
    constructor(t13GeometryApi) {
        this.t13Api = t13GeometryApi;
        this.contextTemplates = {};

        this.defaultTemplate = {
            prompt: `Generate a name for an entity based on the following context and seed.
Context: {context}
Seed: {seed}
Please respond with ONLY a valid JSON object in the following format:
{
  "common": "A creative, evocative, and short name (at least 2 characters. a nickname)",
  "full": "The full, formal, or descriptive name, often based on legal, scientific, astronomical or formal conventions",
  "aliases": "A comma-separated string of alternative names, nicknames, aliases, codenames, or designations from different cultures"
}`
        };

        AIService.configure({ provider: 'mock' }); // Default to mock, can be reconfigured
        Logger.message("T13NameGenerator: Instantiated.");
    }

    /**
     * Asynchronously loads the naming context templates.
     * This must be called before the generate method is used.
     */
    async initialize() {
        try {
            this.contextTemplates = await CodexLoader.getData('contexts');
            if (!this.contextTemplates) throw new Error("Naming contexts not found in Codex.");
            Logger.message("T13NameGenerator: Naming contexts loaded successfully.");
        } catch (error) {
            Logger.error(`T13NameGenerator: Failed to load naming contexts: ${error}`);
            this.contextTemplates = {};
        }

        // Ensure default template exists
        if (!this.contextTemplates['default']) {
            this.contextTemplates['default'] = this.defaultTemplate;
        }
    }

    /**
     * Orchestrates AI and procedural generation to create a high-quality, context-aware name.
     * @param {object} context - An object describing the context for the name generation.
     * @param {any} seed - A seed value to ensure deterministic or varied results.
     * @returns {Promise<[string, string, string]>} A promise that resolves to the standard T13NE name array.
     */
    async generate(context, seed) {
        let aiResponse = null;
        let attempts = 0;
        const maxAttempts = 3;

        // 1. Attempt to generate a name using the AI service, with retries for quality control.
        while (attempts < maxAttempts) {
            attempts++;
            const prompt = this._buildPrompt(context, seed);
            try {
                const rawResponse = await AIService.generateText(prompt);
                const parsed = this._parseAIResponse(rawResponse);
                // Basic quality check: ensure the common name is reasonably long.
                if (parsed.common && parsed.common.length > 2) {
                    aiResponse = parsed;
                    break; // Exit loop on success
                }
                Logger.warn(`T13NameGenerator: AI returned low-quality name (attempt ${attempts}). Retrying...`);
            } catch (error) {
                Logger.error(`T13NameGenerator: AI generation failed (attempt ${attempts}): ${error.message}`);
            }
        }

        // 2. Handle AI failure or persistent low-quality output.
        if (!aiResponse) {
            Logger.error(`T13NameGenerator: AI failed to produce a valid name after ${maxAttempts} attempts. Using procedural fallback.`);
            const fallbackSeed = context.speciesKey || context.type || 'Fallback';
            const commonName = this._proceduralTranslate(fallbackSeed, fallbackSeed);
            aiResponse = {
                common: commonName,
                full: `${commonName} Sector`,
                aliases: ''
            };
        }

        // 3. Use the procedural generator to create an additional "alien" alias.
        const proceduralAliasSeed = context.speciesKey || seed.toString();
        const proceduralAlias = this._proceduralTranslate(aiResponse.common, proceduralAliasSeed);

        // 4. Combine results and return the final, standardized name array.
        const finalAliases = [aiResponse.aliases, proceduralAlias].filter(Boolean).join(', ');

        return [
            aiResponse.common,
            aiResponse.full,
            finalAliases
        ];
    }

    /**
     * Sends a raw prompt to the AI service and formats the response.
     * Bypasses the context-building and procedural generation steps.
     * @param {string} prompt - The raw prompt string to send to the AI.
     * @returns {Promise<[string, string, string]>} A promise that resolves to the standard T13NE name array.
     */
    async generateRaw(prompt) {
        try {
            const rawResponse = await AIService.generateText(prompt);
            const parsed = this._parseAIResponse(rawResponse);
            return [
                parsed.common || 'Unnamed',
                parsed.full || 'Unnamed Entity',
                parsed.aliases || ''
            ];
        } catch (error) {
            Logger.error(`T13NameGenerator.generateRaw: Error processing AI response. ${error.message}`);
            return ['Fallback Name', 'Fallback Full Name', ''];
        }
    }

    /**
     * Adapter method for LoreGenerator.generateSystemName compatibility.
     * @param {number} n1 - Noise value 1.
     * @param {number} n2 - Noise value 2.
     * @param {number} n3 - Noise value 3.
     * @param {Array} [nearbySpecies=[]] - List of nearby species.
     * @returns {Promise<string>} The generated system name.
     */
    async generateSystemName(n1, n2, n3, nearbySpecies = []) {
        const context = { 
            type: 'System',
            nearbySpecies: nearbySpecies
        };
        // Create a deterministic seed from noise values
        const seed = (n1 * 10000 + n2 * 100 + n3).toString();
        const result = await this.generate(context, seed);
        return result; // Return full array [common, full, aliases]
    }

    /**
     * Adapter method for LoreGenerator.generateHomeworldName compatibility.
     * @param {Array} [nearbySpecies=[]] - List of nearby species.
     * @returns {Promise<string>} The generated homeworld name.
     */
    async generateHomeworldName(systemName, speciesName, speciesKey, techLevelKey, n3, star, nearbySpecies = []) {
        const context = {
            type: 'Homeworld',
            systemName,
            speciesName,
            speciesKey,
            techLevelKey,
            star,
            nearbySpecies
        };
        // Use n3 as seed
        const result = await this.generate(context, n3);
        return result; // Return full array [common, full, aliases]
    }

    /**
     * Adapter method for SpeciesGenerator compatibility.
     * @param {string} speciesKey - The species key or archetype.
     * @param {object|string|number} seed - Seed for generation.
     * @returns {Promise<Array>} The generated species name array [common, full, aliases].
     */
    async generateSpeciesName(speciesKey, seed) {
        const context = {
            type: 'Species',
            speciesKey: speciesKey
        };
        return await this.generate(context, seed);
    }

    /**
     * Generates a placeholder name immediately using procedural generation.
     * @param {object} context 
     * @param {any} seed 
     * @returns {string}
     */
    generatePlaceholder(context, seed) {
        const fallbackSeed = context.speciesKey || context.type || 'Fallback';
        return this._proceduralTranslate(fallbackSeed.toString(), seed ? seed.toString() : Date.now().toString());
    }

    /**
     * Generates a procedural Latin-sounding name.
     * Compatibility method for SpeciesGenerator.
     * @param {string|number} seed 
     * @returns {string}
     */
    generateProceduralLatinName(seed) {
        let seedNum = 0;
        if (typeof seed === 'string') {
            for (let i = 0; i < seed.length; i++) {
                seedNum += seed.charCodeAt(i) * (i + 1);
            }
        } else {
            seedNum = seed || Date.now();
        }
        
        const prng = T13NE_PRNG.create(seedNum);
        const prefixes = ['A', 'E', 'I', 'O', 'U', 'Ae', 'Ia', 'Au', 'Cae', 'Vio'];
        const consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'x', 'z'];
        const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
        const suffixes = ['us', 'um', 'a', 'is', 'ii', 'ae', 'orum', 'ia', 'ius', 'ax'];
        
        let name = '';
        
        // Start
        if (prng.nextDouble() > 0.7) {
            name += prefixes[Math.floor(prng.nextDouble() * prefixes.length)];
        } else {
            name += consonants[Math.floor(prng.nextDouble() * consonants.length)].toUpperCase();
            name += vowels[Math.floor(prng.nextDouble() * vowels.length)];
        }
        
        // Middle
        const length = Math.floor(prng.nextDouble() * 2) + 1;
        for (let i = 0; i < length; i++) {
            name += consonants[Math.floor(prng.nextDouble() * consonants.length)];
            name += vowels[Math.floor(prng.nextDouble() * vowels.length)];
        }
        
        // End
        name += suffixes[Math.floor(prng.nextDouble() * suffixes.length)];
        
        // Capitalize first letter just in case
        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    /**
     * Builds the AI prompt from a context object and seed using loaded templates.
     * @private
     */
    _buildPrompt(context, seed) {
        const templateKey = context.type || 'default';
        let template = this.contextTemplates[templateKey];

        if (!template) {
            Logger.warn(`T13NameGenerator: No prompt template found for context type "${templateKey}". Using default fallback.`);
            template = this.contextTemplates['default'] || this.defaultTemplate;
        }

        const richContext = { ...context };
        if(richContext.nearbySpecies) {
            richContext.regionalContext = `The local region is known to be inhabited by the following species: ${richContext.nearbySpecies.join(', ')}. The generated names, especially aliases, should reflect the cultures and languages associated with these species.`;
            delete richContext.nearbySpecies; // Clean up the direct list
        }

        const contextString = JSON.stringify(richContext, null, 2);
        const seedString = JSON.stringify(seed, null, 2);

        return template.prompt
            .replace('{context}', contextString)
            .replace('{seed}', seedString);
    }

    /**
     * Parses the potentially messy JSON response from the AI.
     * @private
     */
    _parseAIResponse(rawResponse) {
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No valid JSON object found in the AI's response.");
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            throw new Error(`Failed to parse JSON from AI response: ${error.message}`);
        }
    }

    /**
     * Procedurally translates a name into a consistent "alien" language based on a seed.
     * @private
     */
    _proceduralTranslate(text, seed) {
        if (!text || !seed) return text;
        let seedNum = 0;
        for (let i = 0; i < seed.length; i++) {
            seedNum += seed.charCodeAt(i) * (i + 1);
        }
        const prng = T13NE_PRNG.create(seedNum);
        const substitutions = {'a':'o','e':'a','i':'e','o':'u','u':'y','s':'ss','sh':'k\'t','th':'z','ch':'tch','ph':'f','ck':'k','tion':'shu'};
        let translatedText = text.toLowerCase();
        for (const [key, value] of Object.entries(substitutions)) {
            if (prng.nextDouble() > 0.4) {
                translatedText = translatedText.replace(new RegExp(key, 'g'), value);
            }
        }
        let words = translatedText.split(' ');
        if (words.length > 1 && prng.nextDouble() > 0.5) {
            words.reverse();
        }
        let finalText = words.join(' ');
        return finalText.charAt(0).toUpperCase() + finalText.slice(1);
    }

    /**
     * Allows adding or updating a context template dynamically.
     * @param {string} key - The context type key (e.g., 'System', 'Ship').
     * @param {object} template - The template object { prompt: "..." }.
     */
    addTemplate(key, template) {
        this.contextTemplates[key] = template;
        Logger.message(`T13NameGenerator: Added/Updated template for '${key}'.`);
    }
}