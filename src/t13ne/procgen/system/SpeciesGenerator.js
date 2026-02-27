import { LoreData } from '/src/t13ne/procgen/lore/LoreData.js';
import { NameGenerator } from '/src/t13ne/procgen/lore/factories/NameGenerator.js';
import Logger from '/src/t13ne/core/Logger.js';

export class SpeciesGenerator {
    constructor(pluginManager, nameGenerator) {
        if (!LoreData.isLoaded()) {
            throw new Error("SpeciesGenerator cannot be instantiated before LoreData is loaded.");
        }
        this.pluginManager = pluginManager;
        this.nameGenerator = nameGenerator || new NameGenerator(pluginManager);
    }

    async generateProceduralSpecies(noiseValues) {
        const { n1, n2, n3, n4 } = noiseValues;
        const archetypes = LoreData.speciesFoundations.filter(s => s.type === 'archetype' && s.id !== 'ARCHETYPE_PRIMORDIAL');

        if (archetypes.length === 0) {
            Logger.message("ERROR: No non-PRIMORDIAL archetypes found. Returning null for procedural species.");
            return null;
        }

        // 1. Select an archetype
        const archetype = archetypes[Math.floor(n1 * archetypes.length)];

        // 3. Generate a procedural name, ensuring it's not on the banned list
        let speciesName, scientificName, rawName;
        let attempts = 0;
        do {
            // Modify the seed slightly on each attempt to ensure we don't get the same banned name forever
            // Await the generator (T13 is async, Fallback is sync but await handles both)
            const seedStr = `${n3 + (attempts * 0.01)}-${n4}-${n2}`;
            rawName = await this.nameGenerator.generateSpeciesName('Progenitor', seedStr);
            
            // Handle T13 array format vs Fallback string format
            speciesName = Array.isArray(rawName) ? rawName[0] : rawName;
            
            attempts++;
        } while (this.isNameBanned(speciesName) && attempts < 10);

        scientificName = this.nameGenerator.generateProceduralLatinName(`${n1}-`);

        // 4. Construct the description
        // The description is now fully procedural, so we don't need a template here.
        const descTemplate = archetype.desc;

        // 5. Create the base species object
        const speciesLore = {
            commonName: speciesName,
            scientificName: scientificName,
            descTemplate: descTemplate,
            archetype: archetype.name,
            traits: archetype.traits || [],
            // The bodyPlan will now be determined later in _deriveTraitsFromHarmonics
            bodyPlan: null,
        };

        // Generate descriptions immediately for procedural species
        this.enrichSpeciesLore(speciesLore);
        return speciesLore;
    }

    evaluateCondition(condition, context) {
        if (!condition) return true;

        if (condition.startsWith('!')) {
            const prop = condition.substring(1);
            return prop.split('.').reduce((obj, key) => obj && obj[key], context);
        }

        const affinityMatch = condition.match(/affinity\((.+?)\)/);
        if (affinityMatch) {
            const affinity = affinityMatch[1];
            const { star } = context;
            if (!star) return true;
            if (affinity === 'ICE_WORLD' && star.starClass.includes('M-Type')) return true;
            if (affinity === 'GAS_GIANT_SYSTEM' && context.star.r > 0.4) return true;
            if (affinity === 'VOLCANIC_WORLD' && star.isYoung) return true;
            
            // Deterministic fallback based on star coordinates
            if (context.star) {
                const seed = (context.star.x || 0) + (context.star.y || 0) + (context.star.z || 0);
                const pseudoRandom = Math.abs(Math.sin(seed * 12.9898));
                return pseudoRandom < 0.1;
            }
            return false;
        }

        const parts = condition.match(/(\w+)\s*>\s*([\d.]+)/);
        if (parts && parts.length === 3) {
            const [, key, value] = parts;
            return (context[key] || 0) > parseFloat(value);
        }

        const containsParts = condition.match(/(\w+\.\w+)\.includes\('(.+?)'\)/);
        if (containsParts && containsParts.length === 3) {
            const [obj, key] = containsParts[1].split('.');
            return (context[obj] && context[obj][key] !== undefined && context[obj][key] || '').includes(containsParts[2]);
        }
        Logger.message(`WARN: Unknown condition format: `);
        return true;
    }

    determineSpecies(star, noiseValues, galaxyParams) {
        const { r, z } = star;
        const { n3 } = noiseValues;
        const zRatio = Math.abs(z / galaxyParams.galaxyRadius);
        let zone;

        if (r < galaxyParams.coreRadius) {
            zone = 'Core';
        } else if (r > 0.7 || zRatio > 0.03) {
            zone = 'Rim';
        } else {
            zone = 'Disk';
        }

        const allSpecies = LoreData.speciesFoundations.filter(s => s.type === 'template' && s.distribution);
        const evaluationContext = { star, zRatio };

        const possibleSpecies = allSpecies
            .map(s => ({
                ...s,
                dist: s.distribution[zone]
            }))
            .filter(s => s.dist && this.evaluateCondition(s.dist.condition, evaluationContext));

        const totalWeight = possibleSpecies.reduce((sum, s) => sum + s.dist.weight, 0);
        let roll = n3 * totalWeight;

        for (const species of possibleSpecies) {
            roll -= species.dist.weight;
            if (roll <= 0) {
                return species.id;
            }
        }
        if (possibleSpecies.length > 0) {
            return possibleSpecies[possibleSpecies.length - 1].id;
        }
        return 'Progenitor';
    }

    generateHarmonicBases(speciesName) {
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const T13Geometry = T13NE?.getModule('T13Geometry');
        if (!T13Geometry) {
            Logger.error("T13Geometry not loaded. Cannot calculate harmonics.");
            return null;
        }
        const geoAnalysis = T13Geometry.calculateFullGeo(speciesName) || {};
        return geoAnalysis.GeoHarmonics;
    }

    deriveTraitsFromHarmonics(speciesNames, loreObject) {
        const names = Array.isArray(speciesNames) ? speciesNames : [speciesNames];
        if (names.length === 0) return loreObject;

        const scientificName = names[0];
        const commonName = names[1] || names[0];

        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const T13Geometry = T13NE?.getModule('T13Geometry');
        if (!T13Geometry) {
             if (!this.pluginManager) {
                 Logger.warn("SpeciesGenerator: PluginManager not available.");
             } else if (!T13NE) {
                 Logger.warn("SpeciesGenerator: T13NE API not found. T13 Plugin might not be loaded yet.");
             } else {
                 Logger.warn("SpeciesGenerator: T13Geometry module missing in T13NE.");
             }
             return loreObject;
        }

        const scientificAnalysis = T13Geometry.calculateFullGeo(scientificName) || { GeoHarmonics: {}, Facade: 0, Soul: 0, Initial: 0, GeometryNumber: 0 };
        const commonAnalysis = T13Geometry.calculateFullGeo(commonName) || { GeoHarmonics: {}, Facade: 0, Soul: 0, Initial: 0, GeometryNumber: 0 };

        const scientificHarmonics = scientificAnalysis.GeoHarmonics;
        const commonHarmonics = commonAnalysis.GeoHarmonics;

        Logger.message(`--- Library Harmonic Analysis for ${loreObject.commonName} ---`);
        Logger.logVariables({ [`Scientific Harmonics for ''`]: scientificHarmonics });
        Logger.logVariables({ [`Common Harmonics for ''`]: commonHarmonics });

        const keyData = T13Geometry.getKey(scientificAnalysis.GeoHarmonics.key);

        const majorSpecies = ["Humans", "The Draco", "The Kathorri", "The Vemleki", "The First"];
        const impressionNames = [names[1] || names[0], ...majorSpecies.filter(s => s !== loreObject.commonName)];
        const impressions = T13Geometry.calculateImpressions(impressionNames);

        // Map harmonic numbers to names
        const harmonicNames = (scientificHarmonics.Harmonic || []).map(h => {
            const geo = T13Geometry.Geometries[h];
            return geo ? geo.Name : null;
        }).filter(Boolean);

        const traits = {
            keyFrequency: keyData.Key.Frequency,
            keyNote: keyData.Key.Key,
            harmonicSignature: scientificHarmonics.Harmonic,
            harmonicNames: harmonicNames,
            impressions: impressions,
            traitDescription: '',
            impressionSummary: '',
            perfectHarmonic: scientificHarmonics.Perfect,
            nemesisHarmonic: scientificHarmonics.Nemesis,
            ghostHarmonic: scientificHarmonics.Ghost,
            primaryGeometry: scientificAnalysis.GeometryNumber,
            facadeNumber: scientificAnalysis.Facade,
            soulNumber: scientificAnalysis.Soul,
            initialNumber: scientificAnalysis.Initial,
            specificFrequency:keyData.Key.Frequency+commonAnalysis.GeometryNumber+commonAnalysis.Facade+commonAnalysis.Soul+commonAnalysis.Initial,
        };

        const impressionsGrid = impressions.grid;
        if (impressionsGrid && impressionsGrid.length > 1) {
            const self = impressions.geolist[0].Name;
            const other = impressions.geolist[1].Name;
            const value = impressionsGrid[0][1].Value;
            if (value > 2) {
                traits.impressionSummary = `They are generally friendly towards .`;
            } else if (value < -2) {
                traits.impressionSummary = `They feel a deep-seated animosity towards .`;
            }
        }

        const template = LoreData.speciesFoundations.find(s => s.type === 'template' && s.name === loreObject.commonName);
        const baseTraits = template?.baseTraits;

        if (baseTraits) {
            traits.limbCount = baseTraits.limbCount;
            traits.locomotiveLimbs = baseTraits.locomotiveLimbs;
            traits.dominantLimbs = baseTraits.dominantLimbs;
            traits.specializedLimbs = baseTraits.specializedLimbs;
            loreObject.archetype = baseTraits.archetype;
            loreObject.bodyPlan = baseTraits.bodyPlan || 'bipedal humanoid';
        } else {
            const correctedTones = commonHarmonics.corrected || [];
            // Safety check: Ensure correctedTones is an array and has length
            const totalLimbs = (correctedTones && correctedTones.length > 0) 
                ? correctedTones[Math.floor(correctedTones.length / 2)] 
                : 4;

            const scientificCorrectedTones = scientificHarmonics.corrected || [];
            const dominantLimbs = (scientificCorrectedTones && scientificCorrectedTones.length > 0)
                ? scientificCorrectedTones[Math.floor(scientificCorrectedTones.length / 2)]
                : 1;

            const locomotiveLimbs = (commonHarmonics.Dissonant && commonHarmonics.Dissonant.length > 0) ? commonHarmonics.Dissonant[0] : 2;
            const specializedLimbs = (scientificHarmonics.Sustained || 0) % 3 * 2;

            const roleSpecialized = Math.min(specializedLimbs, totalLimbs);
            const roleLocomotive = Math.min(locomotiveLimbs, totalLimbs);
            const roleDominant = Math.min(dominantLimbs, totalLimbs);

            traits.limbCount = totalLimbs;
            traits.dominantLimbs = roleDominant;
            traits.locomotiveLimbs = roleLocomotive;
            traits.specializedLimbs = roleSpecialized;

            const archetypes = LoreData.speciesFoundations ? LoreData.speciesFoundations.filter(s => s.type === 'archetype') : [];
            let derivedArchetype = null;
            
            if (archetypes.length > 0) {
                const archetypeIndex = (traits.perfectHarmonic || 0) % archetypes.length;
                derivedArchetype = archetypes[archetypeIndex];
                loreObject.archetype = derivedArchetype ? derivedArchetype.id : 'Unknown';
            } else {
                loreObject.archetype = 'Unknown';
            }

            // Specific archetypes have fixed body plans that override procedural ones.
            if (derivedArchetype && (derivedArchetype.id === 'ARCHETYPE_BIOLOGICAL_CRYSTALLINE' || derivedArchetype.id === 'ARCHETYPE_SYNTHETIC')) {
                loreObject.bodyPlan = 'networked intelligence';
            } else {
                // Attempt to generate a body plan from Lea cards first.
                const leaData = this._generateBodyPlanFromLeaCards();
                if (leaData) {
                    loreObject.bodyPlan = leaData.bodyPlan;
                    loreObject.planetAffinity = leaData.animalCategory; // Store the affinity
                } else {
                    // Fallback to harmonic-based description if card generation fails.
                    let bodyPlanStr = '';
                    if (roleSpecialized > 0) bodyPlanStr += 'Winged ';
                    if (roleLocomotive <= 2) bodyPlanStr += 'Biped';
                    else if (roleLocomotive <= 4) bodyPlanStr += 'Quadruped';
                    else if (roleLocomotive <= 6) bodyPlanStr += 'Hexapod';
                    else if (roleLocomotive <= 8) bodyPlanStr += 'Octopod';
                    else bodyPlanStr += 'Myriapod';
                    if (roleDominant > 0) bodyPlanStr += ` with ${roleDominant} primary manipulator${roleDominant > 1 ? 's' : ''}`;
                    loreObject.bodyPlan = bodyPlanStr.trim();
                }
            }
        }

        const colorRef = (keyData && keyData.Key && keyData.Key.Colour && keyData.Key.Colour[1]) || '#808080';
        loreObject.color = '0x' + colorRef.substring(1);

        loreObject.derivedTraits = traits;
        
        // Generate descriptions after traits are derived
        this.enrichSpeciesLore(loreObject);
        
        return loreObject;

    }

    /**
     * Generates a body plan description by drawing Lea cards.
     * This creates a chimeric creature by combining features from multiple cards.
     * @returns {{bodyPlan: string, animalCategory: string}|null} An object with the body plan and category, or null.
     */
    _generateBodyPlanFromLeaCards() {
        const CardsAPI = this.pluginManager.getApi('T13', 'CardsAPI');
        if (!CardsAPI || !CardsAPI.isInitialized) {
            Logger.warn("SpeciesGenerator: CardsAPI not available for Lea-based body plan generation.");
            return null;
        }

        // Use the 'species' spread which draws 3 cards.
        const spread = CardsAPI.getCardSpread('species');
        if (!spread || !spread.cards || spread.cards.length < 3) {
            Logger.warn("SpeciesGenerator: Failed to draw enough cards for body plan generation.");
            return null;
        }

        const bodyParts = new Set();
        const categories = new Set();
        const categoryCounts = {};
        const affinityCounts = {};

        const affinityKeywords = {
            aquatic: ['fish', 'shark', 'turtle', 'plankton', 'aquatic', 'shrimp', 'catfish', 'ray', 'skate', 'mer-person', 'eel'],
            avian: ['bird', 'avian', 'eagle', 'hawk', 'owl', 'corvid', 'albatross', 'condor', 'goose', 'cassowary', 'pterosaur'],
            insectoid: ['insect', 'ant', 'wasp', 'beetle', 'fly', 'moth', 'greenfly', 'midge', 'maggot', 'woodlouse', 'spider', 'scorpion', 'centipede'],
            jungle: ['primate', 'monkey', 'gorilla', 'jungle'],
            desert: ['desert', 'scorpion', 'lizard', 'snake'],
            reptilian: ['reptile', 'snake', 'lizard', 'dinosaur', 'crocodile', 'alligator', 'turtle'],
            mountain: ['goat', 'eagle', 'condor']
        };

        // Take one feature from each of the 3 cards
        for (const item of spread.cards) {
            const card = item.card;
            if (card?.data?.Lea?.Bodypart) {
                bodyParts.add(card.data.Lea.Bodypart.toLowerCase());
            }
            if (card?.data?.Lea?.AnimalCategory) {
                const category = card.data.Lea.AnimalCategory.replace('Megafauna – ', '').toLowerCase();
                categories.add(category);
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            }
            // New logic to parse 'Example' for affinities
            if (card?.data?.Lea?.Example) {
                const exampleText = card.data.Lea.Example.toLowerCase();
                for (const affinity in affinityKeywords) {
                    for (const keyword of affinityKeywords[affinity]) {
                        if (exampleText.includes(keyword)) {
                            affinityCounts[affinity] = (affinityCounts[affinity] || 0) + 1;
                        }
                    }
                }
            }
        }

        if (bodyParts.size === 0) {
            return null; // Not enough data to build a plan
        }
        
        // Determine the most common category to set an affinity
        let dominantCategory = null;
        let maxCount = 0;
        // Prioritize specific affinities from 'Example' over general 'AnimalCategory'
        for (const affinity in affinityCounts) {
            if (affinityCounts[affinity] > maxCount) {
                maxCount = affinityCounts[affinity];
                dominantCategory = affinity;
            }
        }

        // If no affinity found from examples, fall back to animal category
        if (!dominantCategory) {
            for (const category in categoryCounts) {
                if (categoryCounts[category] > maxCount) {
                    maxCount = categoryCounts[category];
                    dominantCategory = category;
                }
            }
        }

        const features = Array.from(bodyParts);
        let bodyPlan = `a chimeric being with ${features.join(', ')}`;

        return { bodyPlan, animalCategory: dominantCategory };
    }

    /**
     * Generates physical and cultural descriptions for the species.
     * @param {object} loreObject - The species lore object to enrich.
     */
    enrichSpeciesLore(loreObject) {
        loreObject.physicalDescription = this.generatePhysicalDescription(loreObject);
        loreObject.culturalDescription = this.generateCulturalDescription(loreObject);
    }

    generatePhysicalDescription(loreObject) {
        const traits = loreObject.derivedTraits;
        if (!traits) return '';

        const foundations = LoreData.speciesFoundations || [];
        const template = foundations.find(s => s.type === 'template' && s.name === loreObject.commonName);
        if (template?.baseTraits) return ''; // Don't generate procedural descriptions for templated species with defined traits.

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

        const facadeGeo = foundations.find(s => s.type === 'descriptive_geometry' && s.category === 'FACADE');
        if (facadeGeo && facadeGeo.data[traits.facadeNumber]) {
            const facadeData = facadeGeo.data[traits.facadeNumber];
            if (facadeData?.Diegetic_Description) {
                physDescParts.push(facadeData.Diegetic_Description);
            } else if (facadeData?.diegetic_text) {
                physDescParts.push(facadeData.diegetic_text);
            } else if (facadeData?.preGeneratedLore) {
                physDescParts.push(facadeData.preGeneratedLore);
            } else if (typeof facadeData === 'string') {
                physDescParts.push(facadeData);
            }
            if (facadeData?.Diegetic_Goal) physDescParts.push(facadeData.Diegetic_Goal);
            if (facadeData?.Diegetic_Gift) physDescParts.push(facadeData.Diegetic_Gift);
        }

        return physDescParts.join(' ');
    }

    generateCulturalDescription(loreObject) {
        const traits = loreObject.derivedTraits;
        if (!traits) return "Their culture is enigmatic and difficult for outsiders to comprehend.";

        const foundations = LoreData.speciesFoundations || [];
        let cultureParts = [];

        // Use Soul Geometry for inner nature/character
        const soulGeo = foundations.find(s => s.type === 'descriptive_geometry' && s.category === 'SOUL');
        if (soulGeo && soulGeo.data[traits.soulNumber]) {
            const soulData = soulGeo.data[traits.soulNumber];
            if (soulData?.Diegetic_Description) {
                cultureParts.push(soulData.Diegetic_Description);
            } else if (soulData?.diegetic_text) {
                cultureParts.push(soulData.diegetic_text);
            } else if (soulData?.preGeneratedLore) {
                cultureParts.push(soulData.preGeneratedLore);
            } else if (typeof soulData === 'string') {
                cultureParts.push(soulData);
            }
            if (soulData?.Diegetic_Goal) cultureParts.push(soulData.Diegetic_Goal);
            if (soulData?.Diegetic_Gift) cultureParts.push(soulData.Diegetic_Gift);
        }

        // Use Harmonic Signature for general disposition
        if (traits.harmonicNames && traits.harmonicNames.length > 0) {
            const names = traits.harmonicNames.join(', ');
            cultureParts.push(`They are often characterized by a ${names.toLowerCase()} disposition.`);
        }

        if (traits.impressionSummary) {
            cultureParts.push(traits.impressionSummary);
        }

        return cultureParts.join(' ');
    }

    async generateApexSpeciesForBiosphere(biosphere, seeds) {
        const funcName = 'SpeciesGenerator.generateApexSpeciesForBiosphere';
        Logger.start(funcName, { biosphere });

        const { n1, n2, n3, n4 } = seeds;
        
        // Generate a name
        let name;
        if (this.nameGenerator && typeof this.nameGenerator.generateAlienName === 'function') {
             name = await this.nameGenerator.generateAlienName(`${n1}-${n2}`);
        } else {
             name = this.nameGenerator.generateProceduralLatinName(n1, n2);
        }
        
        // Basic species generation logic
        const species = {
            commonName: name,
            scientificName: this.nameGenerator.generateProceduralLatinName(n3, n4),
            biosphere: biosphere,
            description: `The dominant species of the ${biosphere}.`,
            bodyPlan: 'Unknown',
            derivedTraits: {
                limbCount: 4,
                locomotiveLimbs: 2,
                dominantLimbs: 2,
                specializedLimbs: 0
            }
        };
        
        // Enrich with traits
        this.enrichSpeciesLore(species);

        Logger.end(funcName, species);
        return species;
    }

    generateScientificName(speciesKey, loreObject, noiseValues) {
        const { n1, n2 } = noiseValues;
        const namingData = LoreData.naming;
        const template = LoreData.speciesFoundations.find(s => s.type === 'template' && s.name === speciesKey);
        const scientificNamingRules = template?.scientificNaming;

        if (!scientificNamingRules) {
            return this.nameGenerator.generateProceduralLatinName(n1, n2);
        }

        if (scientificNamingRules.name) {
            return scientificNamingRules.name;
        }
        
        if (scientificNamingRules.type === "hybrid") {
            const parent1Template = LoreData.speciesFoundations.find(s => s.type === 'template' && s.name === scientificNamingRules.parent1Key);
            if (!parent1Template || !parent1Template.scientificNaming?.name) {
                return "Nomen Hybridus Incognitus";
            }
            const parent1ScientificName = parent1Template.scientificNaming.name;
            const parent1Words = parent1ScientificName.split(' ');
            let parent1_part1, parent1_part2;

            if (parent1Words.length > 1) {
                const splitIndex = 1 + Math.floor(n1 * (parent1Words.length - 1));
                parent1_part1 = parent1Words.slice(0, splitIndex).join(' ');
                parent1_part2 = parent1Words.slice(splitIndex).join(' ');
            } else {
                parent1_part1 = parent1Words[0];
                parent1_part2 = '';
            }

            let parent2_part1 = '';
            let parent2_part2 = '';
            let parent2_latin = '';

            if (scientificNamingRules.parent2Key) {
                const parent2Template = LoreData.speciesFoundations.find(s => s.type === 'template' && s.name === scientificNamingRules.parent2Key);
                if (!parent2Template || !parent2Template.scientificNaming?.name) {
                    Logger.message(`WARN: Hybrid scientific naming for  failed: Parent2 scientific name not found for ${scientificNamingRules.parent2Key}`);
                    return "Nomen Hybridus Incognitus";
                }
                const parent2ScientificName = parent2Template.scientificNaming.name;
                const parent2Words = parent2ScientificName.split(' ');
                if (parent2Words.length > 1) {
                    const splitIndex = 1 + Math.floor(n2 * (parent2Words.length - 1));
                    parent2_part1 = parent2Words.slice(0, splitIndex).join(' ');
                    parent2_part2 = parent2Words.slice(splitIndex).join(' ');
                } else {
                    parent2_part1 = parent2Words[0];
                    parent2_part2 = '';
                }

            } else if (scientificNamingRules.parent2Source) {
                const parent2SourceArray = namingData[scientificNamingRules.parent2Source];
                if (!parent2SourceArray) {
                    Logger.message(`WARN: Hybrid scientific naming for  failed: Parent2 source array not found for ${scientificNamingRules.parent2Source}`);
                    return "Nomen Hybridus Incognitus";
                }
                const selectedAnimalBase = parent2SourceArray[Math.floor(n1 * parent2SourceArray.length)];
                parent2_latin = selectedAnimalBase;
 if (scientificNamingRules.name) {
            return scientificNamingRules.name;
        }
                if (scientificNamingRules.parent2Mapping) {
                    const mapping = namingData[scientificNamingRules.parent2Mapping];
                    parent2_latin = mapping[selectedAnimalBase] || selectedAnimalBase;
                }
                if (scientificNamingRules.storeAnimalBaseAs) {
                    loreObject[scientificNamingRules.storeAnimalBaseAs] = selectedAnimalBase;
                }
            }

            let totalWeight = scientificNamingRules.formatOptions.reduce((sum, opt) => sum + (opt.weight || 1), 0);
            let roll = n2 * totalWeight;
            let chosenFormat = scientificNamingRules.formatOptions[0].pattern;
            for (const option of scientificNamingRules.formatOptions) {
                roll -= (option.weight || 1);
                if (roll <= 0) {
                    chosenFormat = option.pattern;
                    break;
                }
            }

            return chosenFormat
                .replace('{parent1_part1}', parent1_part1)
                .replace('{parent1_part2}', parent1_part2)
                .replace('{parent2_part1}', parent2_part1)
                .replace('{parent2_part2}', parent2_part2)
                .replace('{parent2_latin}', parent2_latin);
        }

        return "Nomen Dubium";
    }

    isNameBanned(name) {
        return false;
    }
}
