import { LoreData } from '@/js/procgen/lore/LoreData.js';
import Logger from '@/js/core/Logger.js';
import { SystemHistoryGenerator } from '@/js/procgen/system/SystemHistoryGenerator.js';
import { GalacticHistory } from '@/js/procgen/galaxy/GalacticHistory.js';

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
             const seed = `${star.x},${star.y},${star.z}-system-lore`;
             const prng = T13NE_PRNG.create(seed);
             n1 = prng.nextDouble();
             n2 = prng.nextDouble();
             n3 = prng.nextDouble();
             n4 = prng.nextDouble();
        }
        
        if (n1 === undefined) {
             // Fallback if PRNG failed to load
             Logger.warn("T13NE_PRNG not loaded, using Math.random()");
             n1 = Math.random(); n2 = Math.random(); n3 = Math.random(); n4 = Math.random();
        }

        const safeNoise = { n1, n2, n3, n4 };

        // 1. Species Determination
        Logger.message(`${funcName}: Step 1 - Species Determination`);
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
        Logger.message(`${funcName}: Primary Species: ${primarySpeciesKey}, Relic: ${isRelicSystem}, Inhabitants: ${inhabitants.join(', ')}`);

        // 2. Tech Level - Integrated with T13 Sway
        Logger.message(`${funcName}: Step 2 - Tech Level`);
        const baseTech = (1 - star.r) * 0.5 + n2 * 0.5;
        // Map baseTech (0-1) to Chi (1-289 approx, though usually lower for systems)
        // Let's say max normal system tech is Chi 100 (Portal/Teleport)
        const chiLevel = Math.floor(Math.pow(baseTech, 2) * 100) + 1; 
        
        const swayTech = this.techGenerator.getSwayTechLevel(chiLevel);
        const techLevelKey = swayTech.Type;
        const techDescription = swayTech.Sway_Type_Description;
        
        let techString = `${techLevelKey} (Chi: ${chiLevel})`;
        
        // Apply Magical Tech Costing if applicable (e.g. for high chi or specific species)
        const Sway = T13NE?.getModule('Sway');
        if (Sway && chiLevel > 100) {
             const magicCost = Sway.getMagicalTechCost(chiLevel, primarySpeciesKey !== 'Humans');
             techString += ` [Magical Tech Cost: ${magicCost.totalChi}]`;
        }
        
        Logger.message(`${funcName}: Tech Level: ${techString}`);

        // Generate a technobabble flavor for this system's specific tech advancement
        const techFlavor = await this.scienceGenerator.generateTechnobabble(chiLevel, n3);

        // 3. Narrative Generation
        Logger.message(`${funcName}: Step 3 - Narrative Generation`);
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

        // 2.5 Society Generation
        Logger.message(`${funcName}: Step 4 - Society Generation`);
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
                        society = `${adj.charAt(0).toUpperCase() + adj.slice(1)} ${noun}`;
                    }
                }
            }
        }
        if (isRelicSystem) {
            society += " (Relic Site)";
        }
        if (inhabitants.length > 1) {
            society += " (Multi-species)";
        }
        Logger.message(`${funcName}: Society: ${society}`);

        // 2.6 Historical Event Generation
        const historicalEvent = this._generateHistoricalEventFromCards();
        if (historicalEvent) {
            // Prepend a space if eventDescription already has content.
            if (eventDescription) eventDescription += " ";
            eventDescription += `A notable historical period in this system was an 'Age of ${historicalEvent.title}', characterized by: ${historicalEvent.description}`;
        }

        // 2.7 NPC Generation
        const npcData = this._generateNPCsFromCards();
        if (npcData) {
            if (eventDescription) eventDescription += " ";
            eventDescription += `Notable individuals here often resemble the '${npcData.type}' archetype: ${npcData.description}`;
        }

        // 2.8 Extras Generation (Chorus/Cast for local flavor)
        const extras = [];
        if (this.characterGenerator) {
            // Generate a few locals based on society/tech
            const numExtras = Math.floor(n3 * 3) + 1;
            for(let i=0; i<numExtras; i++) {
                const extraType = n4 > 0.9 ? 'Cast' : 'Chorus'; // Mostly Chorus, occasional Cast
                extras.push(await this.characterGenerator.generateCharacter(extraType));
            }
        }

        Logger.message(`${funcName}: Step 5 - Description & Naming`);
        const corporatePresence = this.corporationGenerator.determineCorporatePresence(star, n4);

        // Generate the main system description, now focusing on high-level details.
        let numPlanets = galaxyParams.numPlanets;
        if (numPlanets === undefined) {
             // Generate 1-12 planets based on noise if not specified
             numPlanets = Math.floor(n1 * 12) + 1;
        }
        const homeWorldIndex = Math.floor(n2 * numPlanets);

        let description = this.generateSystemDescription(star, numPlanets, speciesLore, secondarySpeciesLore, eventDescription, corporatePresence, isRelicSystem);

        let systemNameArray = await this.nameGenerator.generateSystemName(n1, n2, n3, nearbySpecies);
        if (!Array.isArray(systemNameArray)) {
            systemNameArray = [systemNameArray, systemNameArray, ""];
        }

        const homeWorldNameArray = await this.nameGenerator.generateHomeworldName(systemNameArray[0], speciesLore.commonName, primarySpeciesKey, techLevelKey, n3, star, nearbySpecies);

        // Add Geometry-based Society Description
        if (T13NE) {
            const T13Geometry = T13NE.getModule('T13Geometry');
            if (T13Geometry && systemNameArray && systemNameArray[0]) {
                const geo = T13Geometry.calculateFullGeo(systemNameArray[0]);
                const soulGeo = T13Geometry.Geometries[geo.Soul];
                if (soulGeo && soulGeo.Social_Description) {
                    description += ` ${soulGeo.Social_Description}`;
                }
            }
        }

        const result = {
            name: systemNameArray[0], // Common name
            systemNameFull: systemNameArray, // Full name object
            tech: `${techLevelKey} (${techFlavor})`,
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
            extras: extras, // Attached generated extras
            star: star // Pass star data for resource generation context
        };
        Logger.end(funcName, result);
        return result;
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
        const historyData = card?.data?.Yarn;

        if (historyData && historyData.History && historyData.History_Description) {
            return {
                title: historyData.History,
                description: historyData.History_Description
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
                type: yarnData.Name || card.name,
                description: yarnData.Significator.Character
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
        const ageData = card?.data?.Lea?.Age;

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
                    societyName = `${adj.charAt(0).toUpperCase() + adj.slice(1)} ${noun}`;
                }
            }
            
            return {
                name: `${societyName} in an Age of ${ageData.Type}`,
                description: ageData.Description || ''
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
                Logger.error(`CRITICAL FALLBACK FAILURE: fallbackTemplate is invalid. Index: ${fallbackIndex}, n4: ${n4}. Defaulting to first available template.`);
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

    generateSystemDescription(star, numPlanets, loreObject, secondaryLore, eventDescription, corporatePresence, isRelicSystem) {
        const funcName = 'SystemGenerator.generateSystemDescription';
        Logger.start(funcName, {
            starId: star.id,
            primarySpecies: loreObject.commonName
        });

        let relicDesc = "";
        if (isRelicSystem) {
             relicDesc = `This system contains ancient ruins of The First, dominated by colossal artifacts. `;
        }

        const traits = loreObject.derivedTraits;

        let systemDesc = `The system is centered around a ${star.starClass} star and contains  planets.`;
        let culturalDesc = `It is primarily inhabited by the ${loreObject.commonName}, a species with a ${loreObject.descTemplate || 'unique culture'}.`;
        
        if (loreObject.culturalDescription) {
            culturalDesc += ` ${loreObject.culturalDescription}`;
        }

        if (loreObject.animalBase) {
            culturalDesc = culturalDesc.replace('{animalBase}', loreObject.animalBase);
        }

        const impressionDesc = traits?.impressionSummary || '';
        let secondaryDesc = '';
        if (secondaryLore) {
            secondaryDesc = `A notable minority of ${secondaryLore.commonName} are also present, maintaining a complex relationship with the primary inhabitants.`;
        }

        const corporateDesc = corporatePresence ? `The ${corporatePresence.name} has a significant presence in the system, influencing its economy and development.` : '';

        const description = [relicDesc, systemDesc, culturalDesc, secondaryDesc, eventDescription, impressionDesc, corporateDesc].filter(Boolean).join(' ');
        Logger.end(funcName, description);
        return description;
    }
}
