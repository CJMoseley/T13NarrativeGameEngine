export default class T13Descriptions {
    constructor(t13, AIService) {
        this.t13 = t13;
        this.AIService = AIService;
    }

    async generate(context) {
        // PRIORITIZE PRE-GENERATED DIEGETIC DATA
        // If the context already contains high-quality pre-baked lore, use it directly
        // to avoid runtime LLM latency or failures.
        if (context.preGeneratedLore) {
            return context.preGeneratedLore;
        }

        // Enrich with geometry if name is present
        if (context.name) {
             const T13Geometry = this.t13.getModule('T13Geometry');
             if (T13Geometry) {
                 let type = 'Character';
                 if (context.type) {
                     const t = context.type.toLowerCase();
                     if (t.includes('species')) type = 'Species';
                     else if (t.includes('society')) type = 'Society';
                     else if (t.includes('location') || t.includes('planet') || t.includes('system')) type = 'Location';
                     else if (t.includes('descendant') || t.includes('item') || t.includes('object')) type = 'Descendant';
                 }
                 context.geometryLore = T13Geometry.getDiegeticLoreDescriptions(context.name, type);
             }
        }

        const prompt = await this.buildPrompt(context);
        const description = await this.AIService.generateText(prompt);
        return description;
    }

    /**
     * Generates a description for a specific Knot type.
     * @param {object} knot - The Knot object (Annex, Hitch, SuperKnot, etc.)
     * @param {string} [type] - Optional type override (e.g., 'Skill', 'Power').
     */
    async generateKnotDescription(knot, type = null) {
        const context = {
            name: knot.name,
            type: type || knot.annexType || knot.constructor.name,
            description: knot.description,
            sizeText: (typeof knot.getSizeText === 'function') ? knot.getSizeText() : null,
            proficiencies: knot.knot ? knot.knot.getTiedProficiencies() : [],
            facetDetails: []
        };

        // Extract Facet details from tags if available
        if (knot.tags && knot.tags.facets) {
            const Facets = this.t13.getModule('Facets');
            if (Facets) {
                for (const facetName of knot.tags.facets) {
                    const fData = await Facets.getFacet(facetName);
                    if (fData) context.facetDetails.push(fData);
                }
            }
        }

        const prompt = await this.buildPrompt(context);
        return await this.AIService.generateText(prompt);
    }

    async buildPrompt(context) {
        let prompt = "Generate a description for a Knot with the following characteristics:\n";

        if (context.name) {
            if (Array.isArray(context.name)) {
                const [common, full, akas] = context.name;
                prompt += `- Name: ${common}\n`;
                if (full && full !== common) prompt += `- Full Name: ${full}\n`;
                if (akas) {
                    const akaStr = Array.isArray(akas) ? akas.join(', ') : akas;
                    if (akaStr) prompt += `- Aliases: ${akaStr}\n`;
                }
            } else {
                prompt += `- Name: ${context.name}\n`;
            }
        }

        if (context.type) {
            prompt += `- Type: ${context.type}\n`;
        }

        // Add Geometry Context if available
        if (context.geometryLore) {
            prompt += `\nDiegetic Lore Context:\n`;
            
            const addLoreSection = (title, lore) => {
                if (!lore) return;
                let sectionAdded = false;
                let sectionString = `- ${title}:\n`;
                if (lore.description) {
                    sectionString += `  - Description: ${lore.description}\n`;
                    sectionAdded = true;
                }
                if (lore.goal) {
                    sectionString += `  - Goal: ${lore.goal}\n`;
                    sectionAdded = true;
                }
                if (lore.gift) {
                    sectionString += `  - Gift: ${lore.gift}\n`;
                    sectionAdded = true;
                }
                if(sectionAdded) {
                    prompt += sectionString;
                }
            }
            
            addLoreSection('Essence (Full Name)', context.geometryLore.main);
            addLoreSection('Inner Nature (Soul)', context.geometryLore.soul);
            addLoreSection('Outward Appearance (Facade)', context.geometryLore.facade);
            addLoreSection('Origin/Foundation (Nascent)', context.geometryLore.nascent);
            addLoreSection('Hidden Potential (Ghost)', context.geometryLore.hidden);
        }

        if (context.proficiencies) {
            const proficiencies = await this.getProficiencies(context.proficiencies);
            if (proficiencies.length > 0) {
                prompt += `- Proficiencies: ${proficiencies.join(', ')}\n`;
            }
        }

        if (context.boons) {
            const boons = await this.getBoons(context.boons);
            if (boons.length > 0) {
                prompt += `- Boons: ${boons.join(', ')}\n`;
            }
        }

        if (context.yarn) {
            const yarn = await this.getYarn(context.yarn);
            if (yarn.length > 0) {
                prompt += `- Yarn: ${yarn.join(', ')}\n`;
            }
        }

        if (context.sizeText) {
            prompt += `- Size/Scale: ${context.sizeText}\n`;
        }

        if (context.facetDetails && context.facetDetails.length > 0) {
            prompt += "\nFacet Context (Thematic Influences):\n";
            context.facetDetails.forEach(f => {
                prompt += `- ${f.FacetName}:\n`;
                // Use specific text if available, fallback to short name
                if (f.Annex_Root_Text || f.Annex_Root) prompt += `  * Root (Concept): ${f.Annex_Root_Text || f.Annex_Root}\n`;
                if (f.Annex_Channel_Text || f.Annex_Channel) prompt += `  * Channel (Action): ${f.Annex_Channel_Text || f.Annex_Channel}\n`;
                if (f.Tangle_Text || f.Tangle) prompt += `  * Tangle (Complication): ${f.Tangle_Text || f.Tangle}\n`;
                // Auras (Nimbed/Umbral)
                if (f.Nimbed_Text || f.Nimbed) prompt += `  * Nimbed Aura (Benefit): ${f.Nimbed_Text || f.Nimbed}\n`;
                if (f.Umbral_Text || f.Umbral) prompt += `  * Umbral Aura (Cost/Shadow): ${f.Umbral_Text || f.Umbral}\n`;
                if (f.Attack) prompt += `  * Attack Mode: ${f.Attack} (${f.Attack_Modes || ''}) - ${f.Attack_Text || ''}\n`;
                if (f.Descendants_Text || f.Descendants) prompt += `  * Descendant Type: ${f.Descendants_Text || f.Descendants}\n`;
                if (f.Location_Text || f.Location) prompt += `  * Location Context: ${f.Location_Text || f.Location}\n`;
            });
        }
        
        prompt += "\n### IMPORTANT GUIDELINES FOR THE OUTPUT ###\n";
        prompt += "1. The description must be PURELY DIEGETIC and evocative. It should read like a journal entry, a sensor scan report, or a historical record.\n";
        prompt += "2. NEVER use technical RPG or game mechanics terms in the output. This includes but is not limited to: 'Chi', 'Boon', 'Geometry Number', 'Geometry', 'Harmonics', 'Facet', 'Knot', 'Proficiency', 'Annex', 'Hitch', 'Sway', 'Gain', 'Stress', 'Soul Gift', 'Yin', 'Yang', 'I-Ching', 'Hexagram', 'Gematria'.\n";
        prompt += "3. DO NOT repeat the technical labels from the context provided above. Instead, 'absorb' their meaning into the narrative. For example, instead of 'Chi Gain', describe a feeling of spiritual replenishment or atmospheric resonance.\n";
        prompt += "4. If a 'Geometry Number' or 'Key' is provided, use it to inform the 'vibe' or 'pitch' of the description (e.g., if it's a dissonant key, make the description unsettling or chaotic).\n";
        prompt += "5. The final output should NOT contain any parenthetical technical data or explicit lists of game stats.\n";
        prompt += "6. Focus on atmosphere, sensory details, and lore-friendly explanations for technical phenomena.\n";
        prompt += "\nThe description should be evocative and suitable for a science fiction setting.";

        return prompt;
    }

    async getProficiencies(proficiencyIds) {
        const threads = this.t13.getModule('Threads');
        if (!threads) return [];
        
        const proficiencies = await Promise.all(proficiencyIds.map(async (id) => {
            const proficiency = await threads.getProficiency(id);
            return proficiency ? proficiency.name : null;
        }));

        return proficiencies.filter(Boolean);
    }

    async getBoons(boonIds) {
        const facets = this.t13.getModule('Facets');
        if (!facets) return [];

        const boons = await Promise.all(boonIds.map(async (id) => {
            const boon = await facets.getFacet(id);
            return boon ? boon.name : null;
        }));

        return boons.filter(Boolean);
    }

    async getYarn(yarnIds) {
        const cardsAPI = this.t13.getModule('CardsAPI');
        if (!cardsAPI) return [];

        const yarn = await Promise.all(yarnIds.map(async (id) => {
            const card = await cardsAPI.getYarnCard(id);
            return card ? card.name : null;
        }));

        return yarn.filter(Boolean);
    }
}





