import { LoreData } from '/src/t13ne/procgen/lore/LoreData.js';
import Logger from '/src/t13ne/core/Logger.js';
import { SystemHistoryGenerator } from '/src/t13ne/procgen/system/SystemHistoryGenerator.js';
import { GalacticHistory } from '/src/t13ne/procgen/galaxy/GalacticHistory.js';

export class SystemGenerator {
    constructor(pluginManager, generators) {
        const funcName = 'SystemGenerator.constructor';
        Logger.start(funcName);
        this.pluginManager = pluginManager;
        this.speciesGenerator = generators.speciesGenerator;
        this.techGenerator = generators.techGenerator;
        this.scienceGenerator = generators.scienceGenerator;
        this.corporationGenerator = generators.corporationGenerator;
        this.nameGenerator = generators.nameGenerator;
        this.characterGenerator = generators.characterGenerator;
        Logger.end(funcName);
    }

    async generateSystemLore(star, noiseValues, galaxyParams, nearbySpecies = []) {
        const funcName = 'SystemGenerator.generateSystemLore';
        Logger.start(funcName, { starId: star.id });

        let { n1, n2, n3, n4 } = noiseValues || {};
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const T13NE_PRNG = T13NE?.getModule('PRNG');
        if (n1 === undefined && T13NE_PRNG) {
            // Include galaxy seed or a salt if available to prevent "Pell Drift" repetition on fixed coordinates
            const galaxySeed = galaxyParams?.seed || '';
            const salt = galaxyParams?.salt || '';
            const uniqueId = star.id || `${star.x},${star.y},${star.z}`;
            const seed = `---system-lore`; // Removed Date.now() to ensure persistence
            const prng = T13NE_PRNG.create(seed);
            n1 = prng.nextDouble();
            n2 = prng.nextDouble();
            n3 = prng.nextDouble();
            n4 = prng.nextDouble();
        }

        if (n1 === undefined) {
            // Fallback if PRNG failed to load
            Logger.warn("T13NE_PRNG not loaded, using deterministic fallback.");
            const simpleHash = (str) => {
                let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) h ^= str.charCodeAt(i), h = Math.imul(h, 0x01000193); return (h >>> 0) / 4294967296;
            };
            const seedStr = star.id || `${star.x},${star.y},${star.z}`;
            n1 = simpleHash(seedStr + 'n1'); n2 = simpleHash(seedStr + 'n2'); n3 = simpleHash(seedStr + 'n3'); n4 = simpleHash(seedStr + 'n4');
        }

        // Normalize noise values to [0, 1] to prevent negative indices or out-of-bounds errors
        n1 = Math.abs(n1) % 1;
        n2 = Math.abs(n2) % 1;
        n3 = Math.abs(n3) % 1;
        n4 = Math.abs(n4) % 1;

        const safeNoise = { n1, n2, n3, n4 };

        // 1. Species Determination
        Logger.message(`: Step 1 - Species Determination`);
        let initialSpeciesKey = this.speciesGenerator.determineSpecies(star, safeNoise, galaxyParams);
        let primarySpeciesKey = initialSpeciesKey;
        let isRelicSystem = false;
        let inhabitants = [];

        // Handle Relic Systems - they are populated by someone else usually
        if (primarySpeciesKey === 'SPECIES_FIRST_RELIC') {
            isRelicSystem = true;
            // Reroll for inhabitants using a modified seed to get a different result
            const inhabitantNoise = { ...safeNoise, n3: (safeNoise.n3 + 0.17) % 1.0 };
            let inhabitantKey = this.speciesGenerator.determineSpecies(star, inhabitantNoise, galaxyParams);

            if (inhabitantKey === 'SPECIES_FIRST_RELIC') {
                const fallback = this.fallbackToRandomNonHumanTemplate(safeNoise);
                inhabitantKey = fallback.primarySpeciesKey;
            }
            primarySpeciesKey = inhabitantKey;
        }
        inhabitants.push(primarySpeciesKey);

        // Chance for secondary species (e.g. 30% chance)
        if (n4 > 0.7) {
            const secondaryNoise = { ...safeNoise, n3: (safeNoise.n3 + 0.43) % 1.0 };
            let secondaryKey = this.speciesGenerator.determineSpecies(star, secondaryNoise, galaxyParams);
            if (secondaryKey !== primarySpeciesKey && secondaryKey !== 'SPECIES_FIRST_RELIC') {
                inhabitants.push(secondaryKey);
            }
        }

        // Drones usually coexist with Humans
        if ((primarySpeciesKey === 'Drones' || primarySpeciesKey === 'SPECIES_DRONES') && n4 < 0.8) {
            if (!inhabitants.includes('SPECIES_HUMANS') && !inhabitants.includes('Humans')) {
                inhabitants.push('SPECIES_HUMANS');
            }
        }
        Logger.message(`: Primary Species: , Relic: , Inhabitants: ${inhabitants.join(', ')}`);

        // 2. Tech Level - Integrated with T13 Sway
        Logger.message(`: Step 2 - Tech Level`);
        const baseTech = (1 - star.r) * 0.5 + n2 * 0.5;
        // Map baseTech (0-1) to Chi (1-289 approx, though usually lower for systems)
        // Let's say max normal system tech is Chi 100 (Portal/Teleport)
        const chiLevel = Math.floor(Math.pow(baseTech, 2) * 100) + 1;

        const swayTech = this.techGenerator.getSwayTechLevel(chiLevel);
        const techLevelKey = swayTech.Type;
        const techDescription = swayTech.Sway_Type_Description;

        let techString = ` (Chi: )`;

        // Apply Magical Tech Costing if applicable (e.g. for high chi or specific species)
        const Sway = T13NE?.getModule('Sway');
        if (Sway && chiLevel > 100) {
            const magicCost = Sway.getMagicalTechCost(chiLevel, primarySpeciesKey !== 'Humans');
            techString += ` [Magical Tech Cost: ${magicCost.totalChi}]`;
        }

        Logger.message(`: Tech Level: `);

        // Generate a technobabble flavor for this system's specific tech advancement
        let techFlavor = "Unknown Tech";
        try {
            techFlavor = await this.scienceGenerator.generateTechnobabble(chiLevel, n3);
        } catch (e) {
            Logger.warn(`: ScienceGenerator failed.`, e);
        }

        // 3. Narrative Generation
        Logger.message(`: Step 3 - Narrative Generation`);
        let speciesLore;
        const foundations = LoreData.speciesFoundations || [];
        const template = foundations.find(s => s.type === 'template' && (s.id === primarySpeciesKey || s.name === primarySpeciesKey));

        if (primarySpeciesKey === 'Progenitor') {
            speciesLore = await this.speciesGenerator.generateProceduralSpecies(safeNoise);
            if (!speciesLore) {
                const fallback = this.fallbackToRandomNonHumanTemplate(safeNoise);
                primarySpeciesKey = fallback.primarySpeciesKey;
                speciesLore = fallback.speciesLore;
            }
        } else if (template) {
            // Use pre-calculated traits from LoreData if available, otherwise calculate
            let traits = template.traits;
            if (!traits) {
                const archetype = foundations.find(s => s.id === template.derivesFrom);
                const baseTraits = archetype ? (archetype.traits || []) : [];
                const mods = template.mods || [];
                traits = [...baseTraits, ...mods];
            }

            speciesLore = {
                commonName: template.name,
                descTemplate: template.desc,
                isUplifter: template.isUplifter || false,
                isCreator: template.isCreator || false,
                archetype: template.derivesFrom,
                bodyPlanHint: template.bodyPlanHint,
                traits: traits
            };
        } else {
            Logger.message(`WARN: Species template '' not found. Defaulting to Humans.`);
            primarySpeciesKey = 'SPECIES_HUMANS';
            const humansTemplate = foundations.find(s => s.id === 'SPECIES_HUMANS');
            const archetype = humansTemplate ? foundations.find(s => s.id === humansTemplate.derivesFrom) : null;
            const traits = archetype ? (archetype.traits || []) : [];
            speciesLore = {
                commonName: "Humans",
                descTemplate: humansTemplate ? humansTemplate.desc : "Standard humanoid species.",
                traits: traits
            };
        }

        let secondarySpeciesLore = null;
        let eventDescription = '';

        if (template && template.uplifts && template.uplifts.length > 0 && n4 > 0.7) {
            const secondarySpeciesKey = template.uplifts[Math.floor((n4 - 0.7) / 0.3 * template.uplifts.length)];
            // Uplifts in JSON are names (e.g. "Draco"), but we might need to find by ID or Name.
            const secondaryTemplate = foundations.find(s => s.type === 'template' && (s.id === secondarySpeciesKey || s.name === secondarySpeciesKey || s.name.includes(secondarySpeciesKey)));
            if (secondaryTemplate) {
                secondarySpeciesLore = {
                    commonName: secondaryTemplate.name,
                    scientificName: this.speciesGenerator.generateScientificName(secondarySpeciesKey, {}, safeNoise),
                    descTemplate: secondaryTemplate.desc
                };
            }
        } else if (speciesLore.isCreator && n4 > 0.95) {
            const newSpecies = await this.speciesGenerator.generateProceduralSpecies({ n1: n2, n2: n3, n3: n1, n4: n4 });
            secondarySpeciesLore = newSpecies;
            eventDescription = `This system is the cradle of the ${newSpecies.commonName}, a newly emerged species created by the system's primary inhabitants.`;
        }

        const scientificName = this.speciesGenerator.generateScientificName(primarySpeciesKey, speciesLore, safeNoise);
        const namesToAnalyze = [scientificName, speciesLore.commonName].filter(Boolean);
        speciesLore = this.speciesGenerator.deriveTraitsFromHarmonics(namesToAnalyze, speciesLore);
        speciesLore.scientificName = scientificName;

        await new Promise(r => setTimeout(r, 0)); // Yield before card operations
        // 2.5 Society Generation
        Logger.message(`: Step 4 - Society Generation`);
        let society;
        const cardSociety = this._generateSocietyFromCards(safeNoise);
        if (cardSociety) {
            society = cardSociety.name;
            eventDescription += ` ${cardSociety.description}`;
        } else {
            // Fallback to old method if card generation fails
            society = "Unknown Society";
            if (LoreData.society && LoreData.society.SOCIAL_ADJECTIVES && LoreData.society.SOCIAL_NOUN) {
                const adjList = LoreData.society.SOCIAL_ADJECTIVES;
                const nounList = LoreData.society.SOCIAL_NOUN;
                if (adjList.length > 0 && nounList.length > 0) {
                    const adjIndex = Math.min(Math.floor(n3 * adjList.length), adjList.length - 1);
                    const nounIndex = Math.min(Math.floor(n4 * nounList.length), nounList.length - 1);
                    const adj = adjList[adjIndex];
                    const noun = nounList[nounIndex];
                    if (adj && noun) {
                        society = `${adj.charAt(0).toUpperCase() + adj.slice(1)} `;
                    }
                }
            }
        }

        if (inhabitants.length > 1) {
            society += " (Multi-species)";
        }
        Logger.message(`: Society: ${society}`);

        // 2.6 Historical Event Generation
        const historicalEvent = this._generateHistoricalEventFromCards();
        if (historicalEvent) {
            const cleanAge = historicalEvent.title.replace(/^Age of /i, '');
            // Prepend a space if eventDescription already has content.
            if (eventDescription) eventDescription += " ";
            eventDescription += `History remembers this system for its era of ${cleanAge.toLowerCase()}. ${historicalEvent.description}`;
        }

        await new Promise(r => setTimeout(r, 0)); // Yield
        // 2.7 NPC Generation
        const npcData = this._generateNPCsFromCards();
        if (npcData) {
            if (eventDescription) eventDescription += " ";
            eventDescription += `The inhabitants are often characterized by ${npcData.description.toLowerCase()}`;
        }

        // 2.8 Extras Generation (Chorus/Cast for local flavor)
        const extras = [];
        let systemArchetype = null;

        if (this.characterGenerator) {
            // 1. Generate the Detailed System Archetype
            Logger.message(`: Generating System Archetype (Detailed)...`);
            try {
                const archetypeSeed = n3 * 12345;
                const speciesName = speciesLore ? speciesLore.commonName : 'Unknown Species';
                systemArchetype = await this.characterGenerator.generateCharacter('Detailed', {
                    seed: archetypeSeed,
                    species: speciesName
                });

                if (systemArchetype) {
                    // 2. Generate Extras based on the Archetype's Annexes/Facets
                    const numExtras = Math.floor(n3 * 3) + 1;
                    const sourceFacets = [];

                    // Collect facets from Personality and Hitches to seed locals
                    if (systemArchetype.personalityAnnex) {
                        if (systemArchetype.personalityAnnex.personas) sourceFacets.push(...systemArchetype.personalityAnnex.personas);
                        if (systemArchetype.personalityAnnex.cores) sourceFacets.push(...systemArchetype.personalityAnnex.cores);
                    }
                    if (systemArchetype.hitches) {
                        systemArchetype.hitches.forEach(h => {
                            if (h.tags && h.tags.facets) sourceFacets.push(...h.tags.facets);
                        });
                    }
                    if (sourceFacets.length === 0) sourceFacets.push('Awe'); // Fallback

                    Logger.message(`: Generating  extras based on archetype...`);
                    for (let i = 0; i < numExtras; i++) {
                        const extraType = n4 > 0.9 ? 'Cast' : 'Chorus';
                        const seedFacet = sourceFacets[i % sourceFacets.length];

                        try {
                            const char = await this.characterGenerator.generateCharacter(extraType, {
                                seed: archetypeSeed + i + 1,
                                facets: { root: { FacetName: seedFacet } }
                            });
                            await new Promise(r => setTimeout(r, 0)); // Yield
                            if (char) {
                                char.description += ` A local reflecting the  aspect of the system.`;
                                extras.push(char);
                            }
                        } catch (e) {
                            Logger.warn(`: CharacterGenerator failed for extra.`, e);
                        }
                    }
                }
            } catch (e) {
                Logger.warn(`: CharacterGenerator failed for archetype/extras.`, e);
            }
        }

        Logger.message(`: Step 5 - Description & Naming`);
        let corporatePresence = null;
        if (this.corporationGenerator) {
            try {
                corporatePresence = this.corporationGenerator.determineCorporatePresence(star, n4);
            } catch (e) {
                Logger.warn(`: CorporationGenerator failed.`, e);
            }
        }

        // Generate the main system description, now focusing on high-level details.
        let numPlanets = galaxyParams.numPlanets;
        if (numPlanets === undefined) {
            // Generate 1-12 planets based on noise if not specified
            numPlanets = Math.floor(n1 * 12) + 1;
        }
        const homeWorldIndex = Math.floor(n2 * numPlanets);

        let description = this.generateSystemDescription(star, numPlanets, speciesLore, secondarySpeciesLore, eventDescription, corporatePresence, isRelicSystem);

        // Force syllabic generation more often to avoid repetitive list names
        let systemNameArray;
        if (this.nameGenerator.generateSyllabicName && n4 > 0.3) { // 70% chance of unique syllabic name
            const flavor = n3 > 0.5 ? 'alien' : (n3 > 0.25 ? 'tech' : 'ancient');
            const name = this.nameGenerator.generateSyllabicName(`-`, flavor);
            systemNameArray = [name, name, ""];
        } else {
            systemNameArray = await this.nameGenerator.generateSystemName(n1, n2, n3, nearbySpecies);
        }

        if (!Array.isArray(systemNameArray)) {
            systemNameArray = [systemNameArray, systemNameArray, ""];
        }

        const homeWorldNameArray = await this.nameGenerator.generateHomeworldName(systemNameArray[0], speciesLore.commonName, primarySpeciesKey, techLevelKey, n3, star, nearbySpecies);

        // Sanitize potentially offensive or broken names
        if (homeWorldNameArray && homeWorldNameArray.length > 0) {
            if (typeof homeWorldNameArray[0] === 'string') {
                if (homeWorldNameArray[0].includes("Humans's")) homeWorldNameArray[0] = homeWorldNameArray[0].replace("Humans's", "Human");
                if (homeWorldNameArray[0].includes("Porno")) homeWorldNameArray[0] = homeWorldNameArray[0].replace("Porno", "Prime");
                // General fix for s's -> s'
                homeWorldNameArray[0] = homeWorldNameArray[0].replace(/s's/g, "s'");
            }
        }

        // Add Geometry-based Society Description
        if (T13NE) {
            const T13Geometry = T13NE.getModule('T13Geometry');
            if (T13Geometry && systemNameArray && systemNameArray[0]) {
                const geo = T13Geometry.calculateFullGeo(systemNameArray[0]);
                const soulGeo = T13Geometry.Geometries[geo.Soul];
                // Use preGeneratedLore for a more diegetic and jargon-free description
                if (soulGeo && soulGeo.preGeneratedLore) {
                    description += ` ${soulGeo.preGeneratedLore}`;
                } else if (soulGeo && soulGeo.Social_Description) {
                    description += ` ${soulGeo.Social_Description}`;
                }
            }
        }

        // --- Generate Binary/Trinary Stars ---
        // Use n1 (system seed) to determine star count
        let starCountRoll = safeNoise.n1;
        let stars = [];

        // Base Star
        stars.push({
            name: systemNameArray[0],
            t13Name: systemNameArray,
            radius: 1.0,
            color: star.color || 0xffffaa,
            type: star.starClass || 'G',
            mass: 1.0
        });

        // 60% chance of multiple stars (Binary+)
        if (starCountRoll > 0.4) {
            // Binary
            const companionColor = this.getCompanionStarColor(star.starClass, safeNoise.n2);
            stars.push({
                radius: 0.6 + safeNoise.n2 * 0.3,
                color: companionColor,
                type: 'Companion',
                offset: 400 // Visual offset
            });

            // 20% chance of Trinary (if Binary) - relative to the 60%
            if (starCountRoll > 0.8) {
                const trinaryColor = this.getCompanionStarColor(star.starClass, safeNoise.n3);
                stars.push({
                    radius: 0.4 + safeNoise.n3 * 0.3,
                    color: trinaryColor,
                    type: 'Dwarf',
                    offset: 800
                });
            }
        }

        const result = {
            name: systemNameArray[0], // Common name
            systemNameFull: systemNameArray, // Full name object
            tech: ` ()`,
            numPlanets: numPlanets,
            homeWorldIndex: homeWorldIndex,
            society: society,
            species: speciesLore.commonName,
            speciesKey: primarySpeciesKey,
            speciesCore: speciesLore,
            description: description,
            corporatePresence: corporatePresence,
            homeWorldName: homeWorldNameArray[0], // Common name
            homeWorldNameFull: homeWorldNameArray, // Full name object
            techDetails: swayTech, // Pass full sway tech object for UI
            seeds: [n1, n2, n3, n4], // Pass noise values as seeds for planetary generation
            systemArchetype: systemArchetype, // The Detailed character for the system
            extras: extras, // Attached generated extras
            star: star, // Pass star data for resource generation context
            stars: stars // Pass multi-star data for rendering
        };
        Logger.end(funcName, result);
        return result;
    }

    getCompanionStarColor(primaryClass, noise) {
        // Expanded palette based on spectral class
        const palettes = {
            'O': [0x99ccff, 0xaaddff, 0xbbccff], // Blue
            'B': [0xaaddff, 0xbbddff, 0xcceeff], // Blue-white
            'A': [0xcceeff, 0xddeeff, 0xffffff], // White
            'F': [0xffffff, 0xffffee, 0xffffdd], // Yellow-white
            'G': [0xffffee, 0xffffdd, 0xffddbb], // Yellow
            'K': [0xffddbb, 0xffccaa, 0xffbb99], // Orange
            'M': [0xffccaa, 0xffbb99, 0xffaa88], // Red-Orange
            // Brown Dwarves: Deep Red/Dark Orange Brown (L, T, Y classes)
            'L': [0xcc5522, 0xaa4400, 0x882200],
            'T': [0x882200, 0x661100, 0x550a00],
            'Y': [0x440500, 0x330000, 0x2a0000]
        };

        const spectralOrder = ['O', 'B', 'A', 'F', 'G', 'K', 'M', 'L', 'T', 'Y'];
        const primaryChar = (primaryClass || 'G').charAt(0).toUpperCase();
        let primaryIndex = spectralOrder.indexOf(primaryChar);
        if (primaryIndex === -1) primaryIndex = 4; // Default G

        // Companion is usually cooler (higher index). Shift 0 to 6 steps based on noise.
        let companionIndex = Math.min(primaryIndex + Math.floor(noise * 6), spectralOrder.length - 1);
        const companionClass = spectralOrder[companionIndex];
        const palette = palettes[companionClass] || palettes['M'];

        return palette[Math.floor((noise * 100) % palette.length)];
    }

    _generateHistoricalEventFromCards() {
        const CardsAPI = this.pluginManager.getApi('T13', 'CardsAPI');
        if (!CardsAPI || !CardsAPI.isInitialized) {
            Logger.warn("SystemGenerator: CardsAPI not available for history generation.");
            return null;
        }

        // A 'gain' spread is a single card draw.
        const spread = CardsAPI.getCardSpread('gain');
        if (!spread || !spread.cards || !spread.cards.length) {
            Logger.warn("SystemGenerator: Failed to draw a card for history generation.");
            return null;
        }

        const card = spread.cards[0].card;
        // Use Age data for historical events as requested
        const ageData = card?.data?.Age;

        if (ageData && ageData.Type && ageData.Description) {
            return {
                title: ageData.Type,
                description: this._sanitizeLore(ageData.Description)
            };
        }

        return null;
    }

    _generateNPCsFromCards() {
        const CardsAPI = this.pluginManager.getApi('T13', 'CardsAPI');
        if (!CardsAPI || !CardsAPI.isInitialized) {
            return null;
        }

        const spread = CardsAPI.getCardSpread('gain');
        if (!spread || !spread.cards || !spread.cards.length) {
            return null;
        }

        const card = spread.cards[0].card;
        const yarnData = card?.data?.Yarn;

        if (yarnData && yarnData.Significator && yarnData.Significator.Character) {
            return {
                type: yarnData.Yarn_Name || card.name,
                description: this._sanitizeLore(yarnData.Significator.Character)
            };
        }
        return null;
    }

    _generateSocietyFromCards(noiseValues) {
        const CardsAPI = this.pluginManager.getApi('T13', 'CardsAPI');
        if (!CardsAPI || !CardsAPI.isInitialized) {
            Logger.warn("SystemGenerator: CardsAPI not available for Age-based society generation.");
            return null;
        }

        // A 'gain' spread is defined in the T13NE plugin as drawing a single card.
        const spread = CardsAPI.getCardSpread('gain');
        if (!spread || !spread.cards || spread.cards.length < 1) {
            Logger.warn("SystemGenerator: Failed to draw a card for society generation.");
            return null;
        }

        const card = spread.cards[0].card;
        const ageData = card?.data?.Age;

        if (ageData && ageData.Type) {
            const adjList = LoreData.society?.SOCIAL_ADJECTIVES || [];
            const nounList = LoreData.society?.SOCIAL_NOUN || [];

            let societyName = "Unknown Society";
            if (adjList.length > 0 && nounList.length > 0) {
                const adjIndex = Math.floor(noiseValues.n3 * adjList.length);
                const nounIndex = Math.floor(noiseValues.n4 * nounList.length);
                const adj = adjList[adjIndex];
                const noun = nounList[nounIndex];
                if (adj && noun) {
                    societyName = `${adj.charAt(0).toUpperCase() + adj.slice(1)} `;
                }
            }

            return {
                name: `a society currently shaped by ${ageData.Type.toLowerCase()}`,
                description: this._sanitizeLore(ageData.Description) || ''
            };
        }

        return null;
    }

    /**
     * Handles procedural generation failure by selecting a random, non-human template species.
     * This prevents "Humans" from becoming an overly common default species.
     * @param {object} noiseValues - The noise values for the system to ensure deterministic selection.
     * @returns {{primarySpeciesKey: string, speciesLore: object}} The key and lore for the fallback species.
     */
    fallbackToRandomNonHumanTemplate(noiseValues) {
        const funcName = 'SystemGenerator.fallbackToRandomNonHumanTemplate';
        Logger.start(funcName);

        // Get all available template species, explicitly excluding 'Humans' and other special types.
        const availableTemplates = LoreData.speciesFoundations.filter(s =>
            s.type === 'template' && s.name !== 'Humans' && s.name !== 'Progenitor' && s.name !== 'FirstRelic'
        );

        let result;
        if (availableTemplates.length > 0) {
            // Use one of the noise values to deterministically pick a fallback from the filtered list.
            const n4 = (noiseValues && typeof noiseValues.n4 === 'number') ? noiseValues.n4 : Math.random();
            let fallbackIndex = Math.floor(Math.abs(n4) * availableTemplates.length);
            // Safety clamp
            if (fallbackIndex >= availableTemplates.length) fallbackIndex = availableTemplates.length - 1;

            const fallbackTemplate = availableTemplates[fallbackIndex];

            if (fallbackTemplate && fallbackTemplate.name) {
                Logger.message(`Fell back to: ${fallbackTemplate.name}`);
                result = {
                    primarySpeciesKey: fallbackTemplate.name,
                    speciesLore: { commonName: fallbackTemplate.name, descTemplate: fallbackTemplate.desc }
                };
            } else {
                Logger.error(`CRITICAL FALLBACK FAILURE: fallbackTemplate is invalid. Index: , n4: . Defaulting to first available template.`);
                // This is an absolute last resort to prevent a crash. It grabs the first valid template.
                const firstValidTemplate = availableTemplates[0];
                result = {
                    primarySpeciesKey: firstValidTemplate.name,
                    speciesLore: { commonName: firstValidTemplate.name, descTemplate: firstValidTemplate.desc }
                };
            }
        } else {
            // Absolute last resort
            Logger.message("ERROR: CRITICAL FALLBACK: No non-human templates found for fallback. Defaulting to a placeholder.");
            result = {
                primarySpeciesKey: 'Unknown',
                speciesLore: { commonName: 'Unknown Species', descTemplate: 'A species of unknown origin.' }
            };
        }
        Logger.end(funcName, result);
        return result;
    }

    /**
     * Sanitizes lore text by removing mechanical jargon and formatting for immersion.
     * @param {string} text - The raw lore text.
     * @returns {string} The sanitized, more diegetic text.
     */
    _sanitizeLore(text) {
        if (!text || typeof text !== 'string') return text;

        // 1. Remove obvious system terms in parentheses
        let clean = text.replace(/\([^)]*(Boon|Geometry|Chi|Facet|Hitch|Gematria|Success|Difficulty|Pips|Draw|Pool|Phase|Test|Action|Significator|Dominant|Pressed)[^)]*\)/gi, '');

        // 2. Remove explicit mechanical labels and their values
        clean = clean.replace(/(Geometry (Number|Name)|Chi (Gain|Level)|Boon|Facet (Score|Name)|Success Level|Difficulty Rating|Pip Gain|Draw (Count|Spread)|Pool Size|Significator|Archetype):?\s*[\w\d\+\-\s]*/gi, '');

        // 3. Remove common mechanical sentences about Success Levels
        clean = clean.replace(/(They|Individuals) add \+\d+ Success Level on any Action [^.]*\./gi, '');
        clean = clean.replace(/Add \+\d+ Success Level to any Action [^.]*\./gi, '');
        clean = clean.replace(/Each additional [^.]* adds a [^.]* Success Level\./gi, '');

        // 4. Remove geometry names if used clinically (e.g. "Nonagon Characters are...")
        // We want the description, not the label.
        clean = clean.replace(/(Void|Circle|Half-Moon|Triangle|Square|Pentagon|Hexagon|Heptagon|Octagon|Nonagon|Decagon|Undecagon|Dodecagon|Triskaidecagon) (Characters|Beings|Planets|Societies) are/gi, 'Individuals here are typically');

        // 5. Clean up "Age of" clinical phrasing
        clean = clean.replace(/An Age of ([^.]*) is occuring\./gi, 'This is a time of $1.');

        // 6. General cleanup of artifact whitespace
        clean = clean.replace(/\s+/g, ' ').trim();

        return clean;
    }

    generateSystemDescription(star, numPlanets, loreObject, secondaryLore, eventDescription, corporatePresence, isRelicSystem) {
        const funcName = 'SystemGenerator.generateSystemDescription';
        Logger.start(funcName, {
            starId: star.id,
            primarySpecies: loreObject.commonName
        });

        let relicDesc = "";
        if (isRelicSystem) {
            relicDesc = `This system holds the silent, monumental remains of The First. `;
        }

        const traits = loreObject.derivedTraits;

        let systemDesc = `The system is centered around a ${star.starClass} star and contains ${numPlanets} planets.`;
        let culturalDesc = `It is primarily inhabited by the ${loreObject.commonName}, a species with ${loreObject.descTemplate || 'a unique and burgeoning culture'}.`;

        if (loreObject.culturalDescription) {
            culturalDesc += ` ${this._sanitizeLore(loreObject.culturalDescription)}`;
        }

        if (loreObject.animalBase) {
            culturalDesc = culturalDesc.replace('{animalBase}', loreObject.animalBase);
        }

        const impressionDesc = this._sanitizeLore(traits?.impressionSummary || '');
        let secondaryDesc = '';
        if (secondaryLore) {
            secondaryDesc = `A significant community of ${secondaryLore.commonName} also calls this system home, their history deeply intertwined with the primary inhabitants.`;
        }

        const corporateDesc = corporatePresence ? `The influence of ${corporatePresence.name} is pervasive here, shaping the system's economic landscape.` : '';

        // Clean up event description
        const cleanEventDesc = this._sanitizeLore(eventDescription);

        const description = [relicDesc, systemDesc, culturalDesc, secondaryDesc, cleanEventDesc, impressionDesc, corporateDesc].filter(Boolean).join(' ');

        Logger.end(funcName, description);
        return description;
    }
}
