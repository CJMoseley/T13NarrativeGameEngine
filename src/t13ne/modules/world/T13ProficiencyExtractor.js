import Logger from "/src/t13ne/core/Logger.js";

/**
 * T13ProficiencyExtractor
 *
 * Logic to extract proficiency candidates from Facet data and process them
 * using AI services (T13Names, T13Descriptions).
 */
export default class T13ProficiencyExtractor {
    constructor(t13, codexLoader) {
        this.t13 = t13;
        this.codexLoader = codexLoader;
        this.nameGenerator = null;
        this.descriptionGenerator = null;
    }

    async initialize() {
        this.nameGenerator = this.t13.getModule('T13Names');
        this.descriptionGenerator = this.t13.getModule('T13Descriptions');

        if (this.nameGenerator && typeof this.nameGenerator.initialize === 'function') {
            await this.nameGenerator.initialize();
        }
    }

    /**
     * Extracts candidates from a facet data object
     * @param {object} facetData
     * @returns {Array<object>}
     */
    extractCandidates(facetData) {
        const candidates = [];

        // 1. Criticals & Fumbles
        if (facetData.Critical) candidates.push(this._createCandidate(facetData.Critical, 'Critical', facetData, facetData));
        if (facetData.Fumble) candidates.push(this._createCandidate(facetData.Fumble, 'Fumble', facetData, facetData));

        // 2. Emotions (Jeer, Awe, Fury etc)
        const emotionFields = ['Jeer', 'Awe', 'Fury', 'Gloom', 'Fear', 'Pride', 'Hope', 'Love'];
        emotionFields.forEach(field => {
            if (facetData[field]) {
                this._splitAndAdd(facetData[field], `Emotion ${field}`, facetData, facetData, candidates);
            }
        });

        // 3. Rule Text analysis
        if (facetData.Rule_Text) {
            this._extractFromText(facetData.Rule_Text, 'Rule', facetData, candidates);
        }

        // 4. Persona data
        if (facetData.Persona_Details) {
            const p = facetData.Persona_Details;
            if (p.Name) candidates.push(this._createCandidate(p.Name, 'Persona', p, facetData));
            if (p.Motivation) this._splitAndAdd(p.Motivation, 'Persona Motivation', p, facetData, candidates);
            if (p.Avoid) this._splitAndAdd(p.Avoid, 'Persona Avoid', p, facetData, candidates);
            if (p.Shadow) this._splitAndAdd(p.Shadow, 'Persona Shadow', p, facetData, candidates);
            if (p.Gain_Chi) this._splitAndAdd(p.Gain_Chi, 'Persona Gain_Chi', p, facetData, candidates);
        }

        // 5. Hitch Rules
        if (facetData.Hitch_Rules) {
            Object.entries(facetData.Hitch_Rules).forEach(([tier, text]) => {
                this._extractFromText(text, `Hitch_${tier}`, facetData, candidates);
            });
        }

        // Final cleanup: unique candidates by name within this batch
        return this._deduplicateLocal(candidates);
    }

    _createCandidate(name, field, sourceData, facetData) {
        // Strip HTML if present (e.g. in Criticals or Fumbles)
        let cleanName = name.replace(/<\/?[^>]+(>|$)/g, "").trim();
        // Decode some basic entities
        cleanName = cleanName.replace(/&diams;/g, 'â™¦').replace(/&hearts;/g, 'â™¥').replace(/&clubs;/g, 'â™£').replace(/&spades;/g, 'â™ ');
        return {
            name: cleanName,
            field: field,
            context: `${field} of ${facetData.FacetName}`,
            facetIndex: facetData.FacetIndex,
            sourceData: sourceData,
            suggestedTags: null // Will be populated by generateTags
        };
    }

    _splitAndAdd(text, field, sourceData, facetData, candidates) {
        if (!text) return;
        // Split by comma or semicolon
        const parts = text.split(/[,;]/).map(p => p.trim()).filter(p => p && p.length > 2 && !p.includes('<'));
        parts.forEach(p => candidates.push(this._createCandidate(p, field, sourceData, facetData)));
    }

    _extractFromText(text, field, facetData, candidates) {
        // Look for quoted strings or specific keywords as per guide
        // "Dishonoured", "Entranced", "Shunned" etc from Rule_Text
        const quoted = text.match(/"([^"]+)"/g);
        if (quoted) {
            quoted.forEach(q => {
                const name = q.replace(/"/g, '');
                if (name.length > 2) {
                    candidates.push(this._createCandidate(name, `${field} Suggestion`, { text }, facetData));
                }
            });
        }

        // Specific keywords extraction: [Something] Phobia, [Something] Mania, etc.
        const keywords = ['phobia', 'mania', 'philia', 'vision', 'intuition', 'instinct'];
        const words = text.split(/\s+/);

        words.forEach((word, index) => {
            const lowerWord = word.toLowerCase().replace(/[^a-z]/g, '');
            if (keywords.includes(lowerWord)) {
                // Try to capture the preceding word if it's likely a qualifier (capitalized or just preceding)
                let name = word;
                if (index > 0) {
                    const prev = words[index - 1].replace(/[^A-Za-z]/g, '');
                    if (prev.length > 2 && prev[0] === prev[0].toUpperCase()) {
                        name = `${prev} ${word}`;
                    }
                }
                candidates.push(this._createCandidate(name, `${field} Keyword`, { text }, facetData));
            }
        });
    }

    _deduplicateLocal(candidates) {
        const seen = new Set();
        return candidates.filter(c => {
            const key = c.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    /**
     * Generates tags for a candidate proficiency
     * @param {object} candidate
     * @param {object} facetData
     * @returns {object}
     */
    generateTags(candidate, facetData) {
        const facetIndex = facetData.FacetIndex;
        const field = candidate.field;

        const tags = {
            Facets: [facetIndex],
            Scopes: ["1"], // Omniversal
            Genres: ["1"], // T13 Core
            Eras: ["1"],   // Timeless
            Types: ["32"]  // Proficiency
        };

        // Rule-based additional facet tagging
        if (field.startsWith('Emotion')) {
            // All Emotions get Awe(0), Jeer(9), Fury(5)
            [0, 9, 5].forEach(id => {
                if (!tags.Facets.includes(id)) tags.Facets.push(id);
            });
        }

        if (field.includes('Descendant')) {
            if (!tags.Facets.includes(2)) tags.Facets.push(2); // Craft
        }

        if (field.includes('Location')) {
            if (!tags.Facets.includes(22)) tags.Facets.push(22); // Yonder
        }

        if (field === 'Style' || field === 'Persona') {
            if (!tags.Facets.includes(0)) tags.Facets.push(0); // Awe
        }

        if (['Attack', 'Ordeal', 'Test'].includes(field)) {
            if (!tags.Facets.includes(19)) tags.Facets.push(19); // Trial
        }

        if (field === 'Monster') {
            if (!tags.Facets.includes(12)) tags.Facets.push(12); // Miasma
        }

        if (field === 'Action' || field.includes('Motivation')) {
            if (!tags.Facets.includes(23)) tags.Facets.push(23); // Zeal
        }

        if (['Critical', 'Fumble'].includes(field)) {
            if (!tags.Facets.includes(11)) tags.Facets.push(11); // Liberty
        }

        if (['Failure', 'Success'].includes(field)) {
            if (!tags.Facets.includes(20)) tags.Facets.push(20); // Virtue
        }

        if (['Rule', 'Quest'].includes(field)) {
            if (!tags.Facets.includes(21)) tags.Facets.push(21); // Wyrd
        }

        if (field === 'Question') {
            if (!tags.Facets.includes(4)) tags.Facets.push(4); // Enigma
        }

        if (['Gnarl', 'Tangle'].includes(field)) {
            if (!tags.Facets.includes(6)) tags.Facets.push(6); // Gossamer
        }

        if (field === 'Lore') {
            if (!tags.Facets.includes(14)) tags.Facets.push(14); // Orthodox
        }

        if (field === 'Hurdle') {
            if (!tags.Facets.includes(8)) tags.Facets.push(8); // Inertia
        }

        if (field === 'Sway') {
            if (!tags.Facets.includes(1)) tags.Facets.push(1); // Burden
        }

        if (['Incarna', 'Core'].includes(field)) {
            if (!tags.Facets.includes(13)) tags.Facets.push(13); // Nature
        }

        if (field.includes('Avoid')) {
            if (!tags.Facets.includes(17)) tags.Facets.push(17); // Rook
        }

        if (field === 'Psychosocial') {
            if (!tags.Facets.includes(3)) tags.Facets.push(3); // Dominion
        }

        if (field === 'Herald') {
            if (!tags.Facets.includes(10)) tags.Facets.push(10); // Key
        }

        if (field === 'Twisted') {
            if (!tags.Facets.includes(18)) tags.Facets.push(18); // Sin
        }

        // Sort Facets for consistency
        tags.Facets.sort((a, b) => a - b);

        return tags;
    }

    /**
     * Checks if a proficiency with given name or AKAs already exists
     * @param {string} name
     * @param {string} akas
     * @returns {Promise<object|null>}
     */
    async findExistingProficiency(name, akas = '') {
        const manifest = await this.codexLoader._getOrBuildProficiencyManifest();
        const lowerName = name.toLowerCase();

        // Check by exact name in manifest index
        if (manifest.indexes.name[lowerName]) {
            const id = manifest.indexes.name[lowerName][0];
            return await this.codexLoader.getProficiency(id);
        }
        return null;
    }

    /**
     * Processes a batch of candidates through AI services
     * @param {Array<object>} candidates
     * @returns {Promise<Array<object>>}
     */
    async processBatch(candidates) {
        if (!this.nameGenerator || !this.descriptionGenerator) {
            await this.initialize();
        }

        const facetsModule = this.t13.getModule('Facets');
        const results = [];

        for (const candidate of candidates) {
            try {
                Logger.message(`[T13NE Extractor] Processing AI for: ${candidate.name}`);

                // 1. Prepare Context
                const facetData = facetsModule ? await facetsModule.getFacet(candidate.facetIndex) : null;

                // 2. Generate Standard Name Array ["common", "full", "aliases"]
                const nameResult = await this.nameGenerator.generate({
                    type: 'Proficiency',
                    name: candidate.name,
                    context: candidate.context,
                    facetName: facetData ? facetData.FacetName : ''
                }, Math.random());

                // 3. Generate Flavored Description
                const descContext = {
                    name: nameResult,
                    type: 'Proficiency',
                    field: candidate.field,
                    facetDetails: facetData ? [facetData] : [],
                    sourceText: candidate.sourceData?.text || candidate.sourceData?.Description || ''
                };

                // The guide has very specific rules for descriptions:
                descContext.sourceText += `\n\nREQUIRED FORMAT:
- Start with a direct dictionary-like definition.
- Describe the concept itself (the quanta of knowledge), NOT "the knowledge of" the concept.
- Use a tone flavored by the ${facetData ? facetData.FacetName : 'relevant'} facet.
- Avoid phrases like "This proficiency represents..." or "A character with this..."`;

                const description = await this.descriptionGenerator.generate(descContext);

                results.push({
                    ...candidate,
                    generatedName: nameResult,
                    generatedDescription: description,
                    tags: this.generateTags(candidate, facetData || { FacetIndex: candidate.facetIndex })
                });
            } catch (error) {
                Logger.error(`[T13NE Extractor] Failed to process ${candidate.name}:`, error);
                results.push({
                    ...candidate,
                    error: error.message
                });
            }
        }
        return results;
    }
}







