import { LoreData } from '../LoreData.js';
import { NameGenerator } from './NameGenerator.js';
import { GalacticHistory } from '/src/t13ne/procgen/galaxy/GalacticHistory.js';
import Logger from '../../../core/Logger.js';
import ProcGen from '/src/t13ne/procgen/ProcGen.js';

export class SpeciesGenerator {
    constructor(pluginManager, nameGenerator) {
        if (!LoreData.isLoaded()) {
            throw new Error("SpeciesGenerator cannot be instantiated before LoreData is loaded.");
        }
        this.pluginManager = pluginManager;
        this.nameGenerator = nameGenerator || new NameGenerator(pluginManager);
        this.speciesGeoData = null;
        this.registeredSpecies = new Map(); // Track all generated/discovered species
        this._initSpeciesGeoData();
    }

    _initSpeciesGeoData() {
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const T13Geometry = T13NE?.getModule('T13Geometry');

        if (!T13Geometry || !T13Geometry.Geometries || T13Geometry.Geometries.length === 0) {
            Logger.warn("SpeciesGenerator: T13Geometry data not available for pre-processing.");
            this.speciesGeoData = [];
            return;
        }

        this.speciesGeoData = T13Geometry.Geometries.map(geo => {
            const newGeo = { ...geo }; // Create a copy to avoid modifying the original plugin data

            newGeo.Geometry_Description = this._rewriteDescriptionForSpecies(geo.Geometry_Description);
            newGeo.Goal_Description = this._rewriteGoalForSpecies(geo.Goal_Description);
            newGeo.Gift_Description = this._rewriteGiftForSpecies(geo.Gift_Description, geo.Name);

            return newGeo;
        });
    }

    _rewriteDescriptionForSpecies(text) {
        if (!text) return '';
        return text
            .replace(/Characters are/g, 'they are typically')
            .replace(/natural loners/g, 'often solitary')
            .replace(/perceived as leaders/g, 'perceived as natural leaders')
            .replace(/co-operative, harmony seeking diplomats/g, 'they are a co-operative, harmony-seeking people')
            .replace(/can become manipulative and petty/g, 'they can have manipulative and petty tendencies')
            .replace(/intelligent, creative, expressive, often artistic types/g, 'they are an intelligent, creative, and expressive people, often with artistic inclinations')
            .replace(/love to talk, being entertaining/g, 'they value communication and are often entertaining')
            .replace(/it may turn gossipy and superficial/g, 'their communication may sometimes tend towards the superficial')
            .replace(/dependable, trustworthy and hard-working/g, 'they are a dependable, trustworthy, and hard-working people')
            .replace(/can be rigid and narrow-minded/g, 'they can exhibit rigid and narrow-minded traits')
            .replace(/freedom-loving risk-takers/g, 'they are a freedom-loving people of risk-takers')
            .replace(/may be fearless, or foolish/g, 'a trait that can manifest in them as either fearlessness or foolishness')
            .replace(/intellectual, but intuitive, deep — to the point of over — thinker/g, 'they are an intellectual and intuitive people of deep thinkers, sometimes to the point of over-analysis')
            .replace(/can be wise, but may become aloof/g, 'a trait that lends them wisdom, though they can sometimes become aloof')
            .replace(/powerful, ambitious, but ultimately materialistic individuals/g, 'they are a powerful, ambitious, and materialistic people')
            .replace(/deeply spiritual people, intuitive, compassionate and caring/g, 'they are a deeply spiritual, intuitive, and compassionate people')
            .replace(/natural humanitarians, and passionate fighters against injustice/g, 'they are natural humanitarians and passionate fighters against injustice')
            .replace(/mystically amplified/g, 'a mystically amplified version of their own nature')
            .replace(/can be so intuitive as to even believe themselves Psychic/g, 'they are so intuitive they are often considered psychic')
            .replace(/gifted communicators and creative types, but with strong social ties that off-set rugged independence/g, 'they are gifted communicators and creative types, with strong social ties that balance a rugged independence')
            .replace(/a sort of dark reflection of the stability and social nature/g, 'a darker reflection of their stability and social nature');
    }

    _rewriteGoalForSpecies(text) {
        if (!text) return '';
        return text
            .replace(/They define their goals/g, 'Their societal goals are defined')
            .replace(/They are dedicated to the goals of a group or pact/g, 'Their culture is dedicated to the goals of the collective')
            .replace(/They prefer social goals/g, 'Their society prioritizes social goals')
            .replace(/These Characters are only interesting in having a great story to tell/g, 'They are driven by the desire for a grand narrative')
            .replace(/They are likely to set themselves the most ambitious, grand and lofty goals/g, 'They are known for setting ambitious, grand, and lofty goals for their society')
            .replace(/They set Deep goals for themselves/g, 'Their culture is shaped by Deep goals')
            .replace(/These characters are invested in preserving the status quo/g, 'Their society is heavily invested in preserving the status quo')
            .replace(/They are driven to save human lives/g, 'Their culture is driven by a need to save lives')
            .replace(/These Characters set impossible, absurd, impractical goals/g, 'They set seemingly impossible and impractical goals for themselves')
            .replace(/The Character has secrets, and one of the things they keep secret is what their own goals are/g, 'They are secretive, and their collective goals are often shrouded in mystery')
            .replace(/The Character has Melded goals/g, 'They have Melded goals')
            .replace(/They set themselves long and complex goals/g, 'Their society is known for setting long-term, complex goals');
    }

    _rewriteGiftForSpecies(text, geoName) {
        if (!text) return '';
        return text
            .replace(/They are determined people/g, 'They are a determined people')
            .replace(new RegExp(`The ${geoName} Geometry are sensitive, diplomatic people`, 'g'), 'They are sensitive and diplomatic')
            .replace(new RegExp(`The ${geoName} Geometry makes people who are witty, quicker thinkers`, 'g'), 'They are witty and quick thinkers')
            .replace(new RegExp(`The ${geoName} Geometry makes people more stable`, 'g'), 'They have a natural inclination towards stability')
            .replace(new RegExp(`The ${geoName} Geometry are more adventurous than others`, 'g'), 'They are notably adventurous')
            .replace(new RegExp(`The ${geoName} Character is often a visionary`, 'g'), 'They often produce visionaries from among their number')
            .replace(new RegExp(`The ${geoName} Geometry makes people wise`, 'g'), 'They are known for their wisdom')
            .replace(new RegExp(`The ${geoName} Geometry makes people better at physically manifesting their dreams`, 'g'), 'They excel at physically manifesting their collective will')
            .replace(new RegExp(`The ${geoName} Geometry makes Characters more spiritual`, 'g'), 'They have a deeply spiritual nature')
            .replace(new RegExp(`The ${geoName} Geometry makes people determined`, 'g'), 'They are exceptionally determined')
            .replace(new RegExp(`The ${geoName} Geometry is so about intuition... that it makes people seem psychic`, 'g'), 'They have such a strong intuition that they often appear psychic')
            .replace(new RegExp(`The ${geoName} Geometry makes characters extremely communicative`, 'g'), 'They are extremely communicative')
            .replace(new RegExp(`The ${geoName} Geometry makes people have extreme luck`, 'g'), 'They are known for their extreme luck');
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
            archetype: archetype.id, // Store the ID for easier lookup
            archetypeName: archetype.name,
            traits: archetype.traits || [],
            // The bodyPlan will now be determined later in deriveTraitsFromHarmonics
            bodyPlan: null,
        };

        // If biological, pick an animal base from the existing dataset to influence the body plan
        if (archetype.traits.includes('BIOLOGICAL') || archetype.traits.includes('CARBON_BASED')) {
            const animalBases = LoreData.naming.ANIMAL_BASES || [];
            if (animalBases.length > 0) {
                speciesLore.animalBase = animalBases[Math.floor(n2 * animalBases.length)];

                // Update scientific name to reflect animal base using the mapping
                const mapping = LoreData.naming.ANIMAL_TO_LATIN_MAPPING || {};
                const latinBase = mapping[speciesLore.animalBase] || speciesLore.animalBase;
                const parts = scientificName.split(' ');
                speciesLore.scientificName = `${latinBase} ${parts[parts.length - 1] || 'progenitor'}`;
            }
        }

        // 6. Derive harmonic traits
        const namesToAnalyze = [speciesLore.scientificName, speciesLore.commonName].filter(Boolean);
        this.deriveTraitsFromHarmonics(namesToAnalyze, speciesLore);

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
                const prng = ProcGen.createPRNG(seed);
                return prng.nextDouble() < 0.1;
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
        // 1. Check for historical presence from the Galactic Timeline
        const historicalSpecies = GalacticHistory.getDominantSpeciesAt(star.x, star.y);
        if (historicalSpecies) {
            Logger.message(`SpeciesGenerator: Historical species ${historicalSpecies} found at coordinate ${Math.round(star.x)}, ${Math.round(star.y)}`);
            return historicalSpecies;
        }

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

        // --- T13 Tapestry Generation ---
        const T13Tapestry = T13NE?.getModule('Tapestry');
        if (T13Tapestry && !loreObject.tapestry) {
            // Create a full FacetWeb Tapestry for this species
            loreObject.tapestry = T13Tapestry.createSpeciesStatblock(loreObject.commonName);
        }

        const keyData = T13Geometry.getKey(scientificAnalysis.GeoHarmonics.key);

        const majorSpecies = ["Humans", "The Draco", "The Kathorri", "The Vemleki", "The First", "The Convergent", "The Vex"];
        const namesToCompare = names && names.length > 0 ? names : [loreObject.commonName];
        const impressionNames = [namesToCompare[0], ...majorSpecies.filter(s => s !== loreObject.commonName)].slice(0, 6);
        const impressions = T13Geometry.calculateImpressions(impressionNames);

        const traits = {
            keyFrequency: keyData.Key.Frequency,
            keyNote: keyData.Key.Key,
            harmonicSignature: scientificHarmonics.Harmonic,
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
            specificFrequency: keyData.Key.Frequency + commonAnalysis.GeometryNumber + commonAnalysis.Facade + commonAnalysis.Soul + commonAnalysis.Initial,
        };

        const impressionsGrid = impressions.grid;
        if (impressionsGrid && impressionsGrid.length > 1) {
            const self = impressions.geolist[0].Name;
            const other = impressions.geolist[1].Name;
            const value = impressionsGrid[0][1].Value;
            if (value > 2) {
                traits.impressionSummary = `They are generally friendly towards ${other}.`;
            } else if (value < -2) {
                traits.impressionSummary = `They feel a deep-seated animosity towards ${other}.`;
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
            } else if (derivedArchetype && derivedArchetype.id === 'ARCHETYPE_BIOLOGICAL_PLASMA') {
                loreObject.bodyPlan = 'coherent electromagnetic nebula';
            } else if (derivedArchetype && derivedArchetype.id === 'ARCHETYPE_BIOLOGICAL_ENERGETIC') {
                loreObject.bodyPlan = 'luminescent photonic pattern';
            } else if (derivedArchetype && derivedArchetype.id === 'ARCHETYPE_BIOLOGICAL_GASEOUS') {
                loreObject.bodyPlan = 'atmospheric filter-feeding leviathan';
            } else if (derivedArchetype && derivedArchetype.id === 'ARCHETYPE_BIOLOGICAL_SILICON' && (traits.limbCount || 0) < 2) {
                loreObject.bodyPlan = 'monolithic geological entity';
            } else {
                // Attempt to generate a body plan from Lea cards first.
                const leaData = this._generateBodyPlanFromLeaCards();
                if (leaData) {
                    loreObject.bodyPlan = leaData.bodyPlan;
                    loreObject.planetAffinity = leaData.animalCategory; // Store the affinity
                } else if (loreObject.animalBase) {
                    // Use the animal base from the existing naming dataset
                    loreObject.bodyPlan = `a sentient species with physiology reminiscent of a ${loreObject.animalBase.toLowerCase()}`;
                } else {
                    // Fallback to harmonic-based description if card generation fails.
                    let bodyPlanStr = '';
                    if (roleSpecialized > 0) bodyPlanStr += 'Winged ';
                    if (roleLocomotive <= 2) bodyPlanStr += (traits.limbCount >= 4 ? 'Centauroid' : 'Bipedal');
                    else if (roleLocomotive <= 4) bodyPlanStr += 'Quadrupedal';
                    else if (roleLocomotive <= 6) bodyPlanStr += 'Hexapedal';
                    else if (roleLocomotive <= 8) bodyPlanStr += 'Octopedal';
                    else bodyPlanStr += 'Multi-limbed';

                    if (roleDominant > 0) bodyPlanStr += ` ${roleDominant > 1 ? 'poly-dexterous' : 'dexterous'}`;
                    bodyPlanStr += ' morphology';
                    loreObject.bodyPlan = bodyPlanStr.trim();
                }
            }
        }

        const colorRef = (keyData && keyData.Key && keyData.Key.Colour && keyData.Key.Colour[1]) || '#808080';
        loreObject.color = '0x' + colorRef.substring(1);

        loreObject.derivedTraits = traits;
        this.enrichSpeciesLore(loreObject);
        return loreObject;
    }

    /**
     * Generates a species that fits a specific planetary biosphere.
     * @param {string} biosphere - The biosphere classification (e.g. "Living Plasma Intelligence").
     * @param {object} seeds - The noise values to ensure deterministic generation.
     * @returns {object} The generated species lore object.
     */
    async generateApexSpeciesForBiosphere(biosphere, seeds) {
        const { n1, n2, n3, n4 } = seeds;
        let archetypeId = 'ARCHETYPE_BIOLOGICAL_CARBON'; // Default

        // 1. Redundancy Check: If we already have an Apex species for this exact biological niche, return it.
        for (const species of this.registeredSpecies.values()) {
            if (species.originBiosphere === biosphere && species.isApex) {
                return species;
            }
        }

        // Map biosphere to archetype
        const b = biosphere.toLowerCase();
        if (b.includes('plasma')) archetypeId = 'ARCHETYPE_BIOLOGICAL_PLASMA';
        else if (b.includes('magma') || b.includes('silicon') || b.includes('hydrate')) archetypeId = 'ARCHETYPE_BIOLOGICAL_SILICON';
        else if (b.includes('energetic') || b.includes('aether')) archetypeId = 'ARCHETYPE_BIOLOGICAL_ENERGETIC';
        else if (b.includes('gaseous') || b.includes('atmospheric')) archetypeId = 'ARCHETYPE_BIOLOGICAL_GASEOUS';
        else if (b.includes('crystalline')) archetypeId = 'ARCHETYPE_BIOLOGICAL_CRYSTALLINE';

        const foundations = LoreData.speciesFoundations || [];
        const archetype = foundations.find(s => s.id === archetypeId);

        if (!archetype) {
            Logger.warn(`SpeciesGenerator: Archetype ${archetypeId} not found for biosphere ${biosphere}.`);
            return null;
        }

        // Determine animal base for biological species
        let animalBase = null;
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const T13NE_PRNG = T13NE?.getModule('PRNG');

        if (archetypeId === 'ARCHETYPE_BIOLOGICAL_CARBON') {
            const bases = LoreData.naming.ANIMAL_BASES || [];
            if (bases.length > 0) {
                const prng = T13NE_PRNG ? T13NE_PRNG.create(`${n1}-${biosphere}`) : ProcGen.createPRNG(`${n1}-${biosphere}`);
                animalBase = bases[Math.floor(prng.nextDouble() * bases.length)];
            }
        }

        const rawName = await this.nameGenerator.generateAlienName(`${n1}-${n2}-${biosphere}`);
        const speciesName = Array.isArray(rawName) ? rawName[0] : rawName;

        // Generate Scientific Name
        let scientificName = '';
        const prngName = T13NE_PRNG ? T13NE_PRNG.create(`${n3}-${n4}-${archetypeId}`) : ProcGen.createPRNG(`${n3}-${n4}-${archetypeId}`);

        if (animalBase) {
            const latinPrefix = LoreData.naming.ANIMAL_TO_LATIN_MAPPING?.[animalBase] || animalBase;
            scientificName = `${latinPrefix} Sapiens`;
        } else {
            // Specialized exotic naming
            let prefix = 'Exoticus';
            if (archetypeId === 'ARCHETYPE_BIOLOGICAL_PLASMA') prefix = 'Plasmis';
            else if (archetypeId === 'ARCHETYPE_BIOLOGICAL_ENERGETIC') prefix = 'Photis';
            else if (archetypeId === 'ARCHETYPE_BIOLOGICAL_GASEOUS') prefix = 'Vapor';
            else if (archetypeId === 'ARCHETYPE_BIOLOGICAL_SILICON') prefix = 'Crystallum';

            const suffixes = ['Cosmicus', 'Nebulae', 'Electricus', 'Astrum', 'Vagus', 'Aeturnus'];
            const suffix = suffixes[Math.floor(prngName.nextDouble() * suffixes.length)];
            scientificName = `${prefix} ${suffix}`;
        }

        const speciesLore = {
            commonName: speciesName,
            scientificName: scientificName,
            descTemplate: archetype.desc,
            archetype: archetype.id,
            archetypeName: archetype.name,
            traits: archetype.traits || [],
            originBiosphere: biosphere,
            animalBase: animalBase,
            isApex: true,
            bodyPlan: null
        };

        // Derive traits
        const namesToAnalyze = [scientificName, speciesName].filter(Boolean);
        this.deriveTraitsFromHarmonics(namesToAnalyze, speciesLore);

        this.registerSpecies(speciesLore);

        return speciesLore;
    }

    /**
     * Registers a species in the generator's internal registry.
     * @param {object} species - The species lore object.
     */
    registerSpecies(species) {
        if (!species || !species.commonName) return;
        this.registeredSpecies.set(species.commonName, species);
        Logger.message(`SpeciesGenerator: Registered species ${species.commonName} (${species.archetypeName})`);
    }

    /**
     * Gets a registered species by name.
     * @param {string} name - The common name of the species.
     * @returns {object|null}
     */
    getRegisteredSpecies(name) {
        return this.registeredSpecies.get(name) || null;
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
        }

        if (bodyParts.size === 0) {
            return null; // Not enough data to build a plan
        }

        // Determine the most common category to set an affinity
        let dominantCategory = null;
        let maxCount = 0;
        for (const category in categoryCounts) {
            if (categoryCounts[category] > maxCount) {
                maxCount = categoryCounts[category];
                dominantCategory = category;
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
            physDescParts.push(facadeGeo.data[traits.facadeNumber]);
        }

        return physDescParts.join(' ');
    }

    generateCulturalDescription(loreObject) {
        const traits = loreObject.derivedTraits;
        if (!traits) return "Their culture is enigmatic and difficult for outsiders to comprehend.";

        if (!this.speciesGeoData || this.speciesGeoData.length === 0) {
            Logger.warn("generateCulturalDescription: speciesGeoData is not initialized. Falling back to simple description.");
            return `Their disposition is often characterized as ${Array.isArray(traits.harmonicSignature) ? traits.harmonicSignature.join(', ') : traits.harmonicSignature}.`;
        }

        let cultureParts = [];

        // 1. Primary Geometry for core identity
        const primaryGeoData = this.speciesGeoData[traits.primaryGeometry];
        if (primaryGeoData) {
            if (primaryGeoData.preGeneratedLore) {
                cultureParts.push(primaryGeoData.preGeneratedLore);
            } else if (primaryGeoData.Geometry_Description) {
                cultureParts.push(primaryGeoData.Geometry_Description);
            }
        }

        // 2. Soul Geometry for inner nature (only if we didn't use a bulk pre-generated piece or if it's different)
        const soulGeoData = this.speciesGeoData[traits.soulNumber];
        if (soulGeoData && !primaryGeoData.preGeneratedLore) {
            if (soulGeoData.preGeneratedLore && traits.soulNumber !== traits.primaryGeometry) {
                cultureParts.push(soulGeoData.preGeneratedLore);
            } else if (soulGeoData.Gift_Description) {
                cultureParts.push(soulGeoData.Gift_Description);
            }
        }

        // 3. Facade Geometry for outward appearance
        const facadeGeoData = this.speciesGeoData[traits.facadeNumber];
        if (facadeGeoData && !primaryGeoData.preGeneratedLore) {
            if (facadeGeoData.Goal_Description) {
                cultureParts.push(facadeGeoData.Goal_Description);
            }
        }

        // 4. Key for emotional tone
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const T13Geometry = T13NE?.getModule('T13Geometry');
        if (T13Geometry && traits.key) {
            const keyData = T13Geometry.getKey(traits.key);
            if (keyData && keyData.Key && keyData.Key.Description) {
                cultureParts.push(`The overarching spirit of their society is ${keyData.Key.Description.toLowerCase()}.`);
            }
        }

        if (traits.impressionSummary) {
            cultureParts.push(traits.impressionSummary);
        }

        return cultureParts.filter(p => p).join(' ');
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
