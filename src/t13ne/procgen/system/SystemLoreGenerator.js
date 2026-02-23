import { LoreData } from '/src/t13ne/procgen/lore/LoreData.js';
import { NameGenerator } from '/src/t13ne/procgen/lore/factories/NameGenerator.js';
import { SpeciesGenerator } from '/src/t13ne/procgen/lore/factories/SpeciesGenerator.js';
import { CorporationGenerator } from '/src/t13ne/procgen/corporations/CorporationGenerator.js';
import Logger from '/src/t13ne/core/Logger.js';

export class SystemLoreGenerator {
    constructor(pluginManager, loreData) { // Accept pluginManager and loreData
        const funcName = 'SystemLoreGenerator.constructor';
        Logger.start(funcName);
        this.pluginManager = pluginManager;
        this.nameGenerator = new NameGenerator(pluginManager);
        this.speciesGenerator = new SpeciesGenerator(pluginManager, this.nameGenerator);
        this.corporationGenerator = new CorporationGenerator(); // This is used to determine presence
        Logger.end(funcName);
    }

    async generateSystemLore(star, noiseValues, galaxyParams, nearbySpecies = []) {
        const funcName = 'SystemLoreGenerator.generateSystemLore';
        Logger.start(funcName, { starId: star.id });
        let { n1, n2, n3, n4 } = noiseValues || { n1: Math.random(), n2: Math.random(), n3: Math.random(), n4: Math.random() };

        // Normalize noise values to [0, 1]
        n1 = Math.abs(n1) % 1;
        n2 = Math.abs(n2) % 1;
        n3 = Math.abs(n3) % 1;
        n4 = Math.abs(n4) % 1;

        // 1. Species Determination
        Logger.message(`${funcName}: Step 1 - Species Determination`);
        let primarySpeciesKey = this.speciesGenerator.determineSpecies(star, noiseValues, galaxyParams);
        Logger.message(`${funcName}: Primary Species: ${primarySpeciesKey}`);

        // 2. Tech Level
        Logger.message(`${funcName}: Step 2 - Tech Level`);
        const baseTech = (1 - star.r) * 0.5 + n2 * 0.5;
        const techLevelKeys = Object.keys(LoreData.tech.TECH_LEVELS);
        const techDistributionCurve = Math.pow(baseTech, 0.75);
        const techIndex = Math.floor(techDistributionCurve * (techLevelKeys.length - 1));
        const techLevelKey = techLevelKeys[techIndex];
        Logger.message(`${funcName}: Tech Level: ${techLevelKey}`);

        // 3. Narrative Generation
        Logger.message(`${funcName}: Step 3 - Narrative Generation`);
        let speciesLore;
        const template = LoreData.speciesFoundations.find(s => s.type === 'template' && s.name === primarySpeciesKey);

        if (primarySpeciesKey === 'Progenitor') {
            speciesLore = this.speciesGenerator.generateProceduralSpecies(noiseValues);
            if (!speciesLore) {
                ({ primarySpeciesKey, speciesLore } = this.fallbackToRandomNonHumanTemplate(noiseValues));
            }
        } else {
            speciesLore = {
                commonName: template.name,
                descTemplate: template.desc,
                isUplifter: template.isUplifter || false,
                isCreator: template.isCreator || false,
                archetype: template.derivesFrom,
                bodyPlanHint: template.bodyPlanHint
            };
        }

        let secondarySpeciesLore = null;
        let eventDescription = '';

        if (template.uplifts && template.uplifts.length > 0 && n4 > 0.7) {
            const secondarySpeciesKey = template.uplifts[Math.floor((n4 - 0.7) / 0.3 * template.uplifts.length)];
            const secondaryTemplate = LoreData.speciesFoundations.find(s => s.type === 'template' && s.name === secondarySpeciesKey);
            if (secondaryTemplate) {
                secondarySpeciesLore = {
                    commonName: secondaryTemplate.name,
                    scientificName: this.speciesGenerator.generateScientificName(secondarySpeciesKey, {}, noiseValues),
                    descTemplate: secondaryTemplate.desc
                };
            }
        } else if (speciesLore.isCreator && n4 > 0.95) {
            const newSpecies = this.speciesGenerator.generateProceduralSpecies({ n1: n2, n2: n3, n3: n1, n4: n4 });
            secondarySpeciesLore = newSpecies;
            eventDescription = `This system is the cradle of the ${newSpecies.commonName}, a newly emerged species created by the system's primary inhabitants.`;
        }

        const scientificName = this.speciesGenerator.generateScientificName(primarySpeciesKey, speciesLore, noiseValues);
        const namesToAnalyze = [scientificName, speciesLore.commonName].filter(Boolean);
        speciesLore = this.speciesGenerator.deriveTraitsFromHarmonics(namesToAnalyze, speciesLore);
        speciesLore.scientificName = scientificName;

        const corporatePresence = this.corporationGenerator.determineCorporatePresence(star, n4);
        let description = this.generateDescription(speciesLore, secondarySpeciesLore, eventDescription, corporatePresence);

        // Try to enrich with AI if available
        const T13NE_Module = this.pluginManager ? this.pluginManager.getApi('T13', 'T13NE') : null;
        if (T13NE_Module) {
            const descGen = T13NE_Module.getModule('DescriptionGenerator');
            if (descGen) {
                try {
                    // Enrich main description
                    const context = {
                        name: speciesLore.commonName + ' System',
                        type: 'Star System',
                        description: description,
                        species: speciesLore.commonName,
                        tech: techLevelKey
                    };
                    const aiDesc = await descGen.generate(context);
                    if (aiDesc) description = aiDesc;

                    // Also enrich Species physical/cultural descriptions individually if they are procedural
                    if (speciesLore.physicalDescription) {
                        const physAi = await descGen.generate({
                            name: speciesLore.commonName,
                            type: 'Species Physiology',
                            description: speciesLore.physicalDescription
                        });
                        if (physAi) speciesLore.physicalDescription = physAi;
                    }
                    if (speciesLore.culturalDescription) {
                        const cultAi = await descGen.generate({
                            name: speciesLore.commonName,
                            type: 'Species Culture',
                            description: speciesLore.culturalDescription
                        });
                        if (cultAi) speciesLore.culturalDescription = cultAi;
                    }

                } catch (e) {
                    Logger.warn("SystemLoreGenerator: AI Description enrichment failed.", e);
                }
            }
        }

        // Society & Era Generation via T13 Cards
        let societyType = "Unknown Society";
        let societyDesc = "";
        const CardsAPI = this.pluginManager?.getApi('T13', 'CardsAPI');

        if (CardsAPI) {
            // Draw a card to determine the Age/Era of the society
            const spread = CardsAPI.getCardSpread('gain'); // Single card draw
            if (spread && spread.cards.length > 0) {
                const card = spread.cards[0].card;
                const ageData = card.data?.Age || card.Age;

                if (ageData) {
                    societyType = `a society currently shaped by ${ageData.Type.toLowerCase()}`;
                    societyDesc = this._sanitizeLore(ageData.Description);
                    description += ` ${societyDesc}`;
                } else {
                    // Fallback if card has no Age data
                    societyType = `${card.name} Era`;
                }
            }
        }

        // Fallback to old method if CardsAPI failed or returned nothing useful
        if (societyType === "Unknown Society") {
            if (primarySpeciesKey === 'FirstRelic') {
                societyType = 'None (Relic Site)';
            } else {
                const adjective = LoreData.society.SOCIAL_ADJECTIVES[Math.floor(n3 * LoreData.society.SOCIAL_ADJECTIVES.length)];
                const noun = LoreData.society.SOCIAL_NOUN[Math.floor(n4 * LoreData.society.SOCIAL_NOUN.length)];
                societyType = `${adjective.charAt(0).toUpperCase() + adjective.slice(1)} ${noun}`;
            }
        }

        const systemNameArray = await this.nameGenerator.generateSystemName(n1, n2, n3, nearbySpecies);
        const homeWorldNameArray = await this.nameGenerator.generateHomeworldName(systemNameArray[0], speciesLore.commonName, primarySpeciesKey, techLevelKey, n3, star, nearbySpecies);

        // Add Geometry-based Society Description
        const T13NE = this.pluginManager ? this.pluginManager.getApi('T13', 'T13NE') : null;
        const T13Geometry = T13NE ? T13NE.getModule('T13Geometry') : null;
        if (T13Geometry) {
            const geo = T13Geometry.calculateFullGeo(systemNameArray[0]);
            const soulGeo = T13Geometry.Geometries[geo.Soul];
            // Use preGeneratedLore for a more diegetic and jargon-free description
            if (soulGeo && soulGeo.preGeneratedLore) {
                description += ` ${soulGeo.preGeneratedLore}`;
            } else if (soulGeo && soulGeo.Social_Description) {
                description += ` ${soulGeo.Social_Description}`;
            }
        }

        // Generate T13 Conflict Plot
        let systemPlot = {
            title: `The ${systemNameArray[0]} Arc`,
            type: "T13 System Plot",
            description: `The spirit of the ${systemNameArray[0]} system is restless. A struggle defined by the ${societyType} permeates the system.`,
            conflict: null
        };

        if (CardsAPI) {
            // Generate a proper T13 Conflict using cards for Dominant and Pressed sides
            const domSpread = CardsAPI.getCardSpread('gain');
            const pressSpread = CardsAPI.getCardSpread('gain');

            if (domSpread && pressSpread) {
                const domCard = domSpread.cards[0].card;
                const pressCard = pressSpread.cards[0].card;

                systemPlot.conflict = {
                    dominant: {
                        name: domCard.name,
                        facet: domCard.Facet,
                        suit: domCard.suit,
                        theme: domCard.data?.Yarn?.Significator?.Description || domCard.data?.Yarn?.Significator?.Side || "Dominant Force",
                        card: domCard
                    },
                    pressed: {
                        name: pressCard.name,
                        facet: pressCard.Facet,
                        suit: pressCard.suit,
                        theme: pressCard.data?.Yarn?.Significator?.Description || pressCard.data?.Yarn?.Significator?.Side || "Pressed Resistance",
                        card: pressCard
                    },
                    tension: 2 // Default starting tension
                };

                // Append conflict flavor to description - DIEGETIC VERSION
                const domTheme = (domCard.data?.Yarn?.Significator?.Description || domCard.data?.Yarn?.Yarn_Name || domCard.name).toLowerCase();
                const pressTheme = (pressCard.data?.Yarn?.Significator?.Description || pressCard.data?.Yarn?.Yarn_Name || pressCard.name).toLowerCase();
                description += ` The system is currently gripped by a struggle between those driven by ${domTheme} and those resisting with ${pressTheme}.`;
            }
        }

        const result = {
            name: systemNameArray[0], // Common name
            systemNameFull: systemNameArray, // Full name object
            tech: LoreData.tech.TECH_LEVELS[techLevelKey],
            species: speciesLore.commonName,
            speciesKey: primarySpeciesKey,
            speciesCore: speciesLore,
            society: societyType,
            description: description,
            corporatePresence: corporatePresence,
            homeWorldName: homeWorldNameArray[0], // Common name
            homeWorldNameFull: homeWorldNameArray, // Full name object
            seeds: [n1, n2, n3, n4], // Pass noise values as seeds
            plot: systemPlot
        };
        Logger.end(funcName, `Generated lore for system ${result.name}`);
        return result;
    }

    /**
     * Handles procedural generation failure by selecting a random, non-human template species.
     * This prevents "Humans" from becoming an overly common default species.
     * @param {object} noiseValues - The noise values for the system to ensure deterministic selection.
     * @returns {{primarySpeciesKey: string, speciesLore: object}} The key and lore for the fallback species.
     */
    fallbackToRandomNonHumanTemplate(noiseValues) {
        const funcName = 'SystemLoreGenerator.fallbackToRandomNonHumanTemplate';
        Logger.start(funcName);

        // Get all available template species, explicitly excluding 'Humans' and other special types.
        const availableTemplates = LoreData.speciesFoundations.filter(s =>
            s.type === 'template' && s.name !== 'Humans' && s.name !== 'Progenitor' && s.name !== 'FirstRelic'
        );

        let result;
        if (availableTemplates.length > 0) {
            // Use one of the noise values to deterministically pick a fallback from the filtered list.
            const fallbackIndex = Math.floor(noiseValues.n4 * availableTemplates.length);
            const fallbackTemplate = availableTemplates[fallbackIndex];

            Logger.message(`Fell back to: ${fallbackTemplate.name}`);
            result = {
                primarySpeciesKey: fallbackTemplate.name,
                speciesLore: { commonName: fallbackTemplate.name, descTemplate: fallbackTemplate.desc }
            };
        } else {
            // Absolute last resort if no other non-human templates exist. This indicates a larger data configuration issue.
            Logger.message("ERROR: CRITICAL FALLBACK: No non-human templates found for fallback. Defaulting to a placeholder.");
            result = {
                primarySpeciesKey: 'Unknown',
                speciesLore: { commonName: 'Unknown Species', descTemplate: 'A species of unknown origin, a sign of data misconfiguration.' }
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

    generateDescription(loreObject, secondaryLore, eventDescription, corporatePresence) {
        const funcName = 'SystemLoreGenerator.generateDescription';
        Logger.start(funcName, {
            primarySpecies: loreObject.commonName,
            secondarySpecies: secondaryLore ? secondaryLore.commonName : 'None'
        });
        const traits = loreObject.derivedTraits;
        let proceduralDesc = '';

        const template = LoreData.speciesFoundations.find(s => s.type === 'template' && s.name === loreObject.commonName);
        if (traits && !template?.baseTraits) {
            let physDescParts = [];
            physDescParts.push(`Physiologically, the ${loreObject.commonName} are a ${loreObject.bodyPlan} species, possessing ${traits.limbCount} limbs in total.`);

            if (traits.locomotiveLimbs > 0) {
                physDescParts.push(`Their primary mode of locomotion is handled by ${traits.locomotiveLimbs} of these limbs.`);
            } else {
                physDescParts.push("They appear to be sessile or free-floating, lacking dedicated limbs for locomotion.");
            }

            if (traits.dominantLimbs > 0) {
                physDescParts.push(`Up to ${traits.dominantLimbs} of their limbs can function as primary manipulators, noted for their dexterity.`);
            }
            if (traits.specializedLimbs > 0) {
                physDescParts.push(`Furthermore, ${traits.specializedLimbs} of their limbs are specialized into wings, granting them flight.`);
            }

            const facadeGeo = LoreData.speciesFoundations.find(s => s.type === 'descriptive_geometry' && s.category === 'FACADE');
            if (facadeGeo && facadeGeo.data[traits.facadeNumber]) {
                physDescParts.push(this._sanitizeLore(facadeGeo.data[traits.facadeNumber]));
            }

            const soulGeo = LoreData.speciesFoundations.find(s => s.type === 'descriptive_geometry' && s.category === 'SOUL');
            if (soulGeo && soulGeo.data[traits.soulNumber]) {
                physDescParts.push(this._sanitizeLore(soulGeo.data[traits.soulNumber]));
            }

            proceduralDesc = physDescParts.join(' ');
        }

        let culturalDesc = loreObject.descTemplate || '';
        if (loreObject.animalBase) {
            culturalDesc = culturalDesc.replace('{animalBase}', loreObject.animalBase);
        }

        const impressionDesc = this._sanitizeLore(traits?.impressionSummary || '');
        let secondaryDesc = '';

        if (secondaryLore) {
            secondaryDesc = `This system is also notable for the presence of the ${secondaryLore.commonName}, a species known to have a complex relationship with the primary inhabitants.`;
        }

        const corporateDesc = corporatePresence ? `The system shows significant influence from the ${corporatePresence.name}, a major corporate entity in the galaxy.` : '';

        let prostheticDesc = '';
        if (loreObject.prosthetics && loreObject.prosthetics.length > 0) {
            prostheticDesc = `They are distinguished by features such as ${loreObject.prosthetics.join(', ')}.`;
        }

        const description = [proceduralDesc, culturalDesc, prostheticDesc, secondaryDesc, this._sanitizeLore(eventDescription), impressionDesc, corporateDesc].filter(Boolean).join(' ');
        Logger.end(funcName, description);
        return description;
    }
}
