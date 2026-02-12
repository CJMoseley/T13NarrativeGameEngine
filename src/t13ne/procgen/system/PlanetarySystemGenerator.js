import { LoreData } from '../lore/LoreData.js';
import ProcGen from '../ProcGen.js';
import Logger from '../../core/Logger.js';
import { ResourceFactory } from '../lore/factories/ResourceFactory.js';
import { PlanetGenerator } from './PlanetGenerator.js';

export class PlanetarySystemGenerator {
    constructor(pluginManager, nameGenerator) {
        const funcName = 'PlanetarySystemGenerator.constructor';
        Logger.start(funcName);
        this.pluginManager = pluginManager;
        this.nameGenerator = nameGenerator;
        this.resourceFactory = new ResourceFactory(pluginManager);
        this.planet3DGenerator = new PlanetGenerator(null); // Pass physxProvider if available
        Logger.end(funcName);
    }

    generatePlanets(systemData) {
        const funcName = 'PlanetarySystemGenerator.generatePlanets';
        if (!systemData) {
            Logger.error(`${funcName}: systemData is undefined.`);
            return [];
        }
        Logger.start(funcName, { numPlanets: systemData.numPlanets });

        const planets = [];
        // Ensure seeds exist to prevent crash if systemData is incomplete
        const seeds = (systemData.seeds && Array.isArray(systemData.seeds)) ? systemData.seeds : [Math.random(), Math.random(), Math.random(), Math.random()];
        const numPlanets = systemData.numPlanets || 0;
        const homeWorldIndex = systemData.homeWorldIndex !== undefined ? systemData.homeWorldIndex : -1;

        let lastDistance = 0.2; // Start at 0.2 AU for realistic inner planets
        
        // T13 Harmonics for Orbital Resonance
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const T13Geometry = T13NE?.getModule('T13Geometry');
        let harmonics = [];
        let chordNotes = [];
        if (T13Geometry && systemData.name) {
            const geo = T13Geometry.calculateFullGeo(systemData.name);
            if (geo && geo.GeoHarmonics) {
                if (Array.isArray(geo.GeoHarmonics.Harmonic)) harmonics = geo.GeoHarmonics.Harmonic;
                if (Array.isArray(geo.GeoHarmonics.corrected)) chordNotes = geo.GeoHarmonics.corrected;
            }
        }

        const BASE_ORBIT_SPEED = 0.0000005;
        const PLANET_SPEED_FACTOR = 3;
        const BASE_SPIN_SPEED = 0.000005;

        let totalMoonsGenerated = 0;
        const MAX_MOONS_PER_SYSTEM = 100;
        
        // Calculate initial period for the starting distance (0.2 AU)
        // Kepler's 3rd Law: T^2 = a^3 / M (T in years, a in AU, M in Solar Masses)
        const starMass = this.getStarMass(systemData.star?.starClass);
        let currentPeriod = Math.sqrt(Math.pow(lastDistance, 3) / starMass);
            

        for (let i = 0; i < numPlanets; i++) {
            const planetPRNG = ProcGen.createPRNG([...seeds, i].join(','));
            const innerSeed = planetPRNG.nextDouble();
            const outerSeed = planetPRNG.nextDouble();
            const moonSeed = planetPRNG.nextDouble();
            const nameSeed = planetPRNG.nextDouble();

            // Calculate Orbital Period Ratio
            let periodRatio = 1.618; // Default Golden Ratio
            
            if (chordNotes.length > 0) {
                // Use Chord intervals for natural harmonic ratios
                // We map the sequence of planets to the sequence of notes in the chord
                const noteIndex = i % chordNotes.length;
                const octave = Math.floor(i / chordNotes.length);
                
                // Current note value (absolute semitones from root)
                const currentNoteVal = chordNotes[noteIndex] + (octave * 12);
                
                // Previous note value (relative to the sequence start)
                let prevNoteVal = 0;
                if (i > 0) {
                    const prevIndex = (i - 1) % chordNotes.length;
                    const prevOctave = Math.floor((i - 1) / chordNotes.length);
                    prevNoteVal = chordNotes[prevIndex] + (prevOctave * 12);
                }
                
                let interval = currentNoteVal - prevNoteVal;
                if (interval <= 0) interval += 12; // Ensure outward movement
                
                // Ratio for equal temperament semitones: 2^(n/12)
                periodRatio = Math.pow(2, interval / 12);
            } else if (harmonics.length > 0) {
                // Fallback to Harmonics table if no chord
                const stableResonances = [
                    1.5, 2.0, 1.333, 1.5, 2.5, 2.0, 1.6, 1.5, 3.0, 1.25, 2.0, 1.5, 1.666
                ];
                const harmonicIndex = i % harmonics.length;
                const hVal = harmonics[harmonicIndex];
                periodRatio = stableResonances[(hVal - 1) % stableResonances.length] || 1.6;
            }

            // Update Period
            currentPeriod = currentPeriod * periodRatio;
            
            // Calculate Distance from Period: a = (T^2 * M)^(1/3)
            let orbitalDistance = Math.pow(currentPeriod * currentPeriod * starMass, 1/3);

            // Safety check for NaN or infinite values
            if (!Number.isFinite(orbitalDistance) || isNaN(orbitalDistance)) {
                Logger.warn(`${funcName}: Calculated orbital distance was NaN for planet ${i}. Using fallback.`);
                orbitalDistance = lastDistance + 0.5;
            }
            
            // Enforce minimum separation from previous planet
            if (orbitalDistance < lastDistance + 0.15) orbitalDistance = lastDistance + 0.15;

            const planetRadius = outerSeed * 0.5 + 0.5;
            lastDistance = orbitalDistance;

            const classificationData = this.determinePlanetClassification(
                i,
                orbitalDistance,
                planetRadius,
                planetPRNG,
                systemData
            );
            Logger.message(`${funcName}: Planet ${i} classified as ${classificationData.type}`);

            // Generate Orbital Inclination and Axial Tilt
            // Inclination: Mostly flat (0-5 degrees), occasional outliers
            const inclination = (planetPRNG.nextDouble() * 5) * (planetPRNG.nextDouble() > 0.5 ? 1 : -1);
            
            // Axial Tilt: Mostly stable (0-30), rare extreme/retrograde
            let axialTilt = planetPRNG.nextDouble() * 30;
            if (planetPRNG.nextDouble() > 0.9) axialTilt += 90; // Extreme tilt
            if (planetPRNG.nextDouble() > 0.95) axialTilt += 90; // Retrograde

            let planetName;
            let statusText;
            let isHomeworld = i === homeWorldIndex;

            if (isHomeworld) {
                planetName = systemData.homeWorldName;
                statusText = `Home World (${systemData.tech.split(' ')[0]})`;
            } else {
                planetName = this.generateGenericPlanetName(nameSeed, innerSeed);
                statusText = classificationData.type.includes('Giant') ? 'Gas Giant' : 'Uncolonized World';

                if (systemData.speciesKey === 'SPECIES_FIRST_RELIC' && classificationData.description) {
                    statusText = 'Relic Artifact Site';
                }
            }
   
            // Calculate Hill Sphere (Gravitational dominance region)
            // r_Hill = a * cbrt(m_planet / 3 * M_star)
            const planetMass = this.getPlanetMass(classificationData.type, planetRadius);
            const planetMassSolar = planetMass * 3.003e-6; // Convert Earth masses to Solar masses
            const hillSphereRadius = orbitalDistance * Math.pow(planetMassSolar / (3 * starMass), 1/3);
            
            // Roche Limit (Fluid) approx 2.44 * Radius. 1 Earth Radius approx 4.26e-5 AU
            const rocheLimit = (planetRadius * 0.0000426) * 2.44;

            const moons = this.generateMoons(planetRadius, orbitalDistance, [...seeds, i], hillSphereRadius, rocheLimit, planetName, MAX_MOONS_PER_SYSTEM - totalMoonsGenerated);
            const moonCount = moons.length;
            totalMoonsGenerated += moonCount;

            // Ensure homeworld giants have at least one moon to live on (if none generated by harmonics)
            if (isHomeworld && classificationData.type.includes('Giant') && moonCount === 0) {
                // Force generate a moon if it's a homeworld giant
                const forcedMoon = {
                    name: `${planetName} Prime`,
                    type: 'Habitable Moon',
                    isRing: false,
                    atmosphere: 'Breathable',
                    biosphere: 'Microbial',
                    description: 'A large moon serving as the homeworld.',
                    radius: planetRadius * 0.2,
                    orbitalDistance: rocheLimit * 2,
                    color: { h: 0.5, s: 0.5, l: 0.5 }
                };
                moons.push(forcedMoon);
            }

            Logger.message(`${funcName}: Planet ${i} generated ${moons.length} moons`);

            // Handle Gas Giant Homeworlds (Moon Colony)
            if (isHomeworld && classificationData.type.includes('Giant') && moons.length > 0) {
                const targetMoon = moons[0];
                targetMoon.isHomeworld = true;
                targetMoon.name = systemData.homeWorldName;
                targetMoon.description = (targetMoon.description || "") + " This moon serves as the species' homeworld.";
                
                planetName = `${systemData.homeWorldName} Prime`;
                statusText = `${classificationData.type} (Homeworld System)`;
                isHomeworld = false; // The planet itself is not the homeworld
            }

            const society = this.generateSociety(planetPRNG, systemData.speciesKey);

            // T13 Geometry Descriptions for Society (Soul) and Place (Facade)
            const T13NE = this.pluginManager ? this.pluginManager.getApi('T13', 'T13NE') : null;
            const T13Geometry = T13NE ? T13NE.getModule('T13Geometry') : null;
            
            if (T13Geometry) {
                const geo = T13Geometry.calculateFullGeo(planetName);
                const soulGeo = T13Geometry.Geometries[geo.Soul];
                const facadeGeo = T13Geometry.Geometries[geo.Facade];

                if (soulGeo && soulGeo.Social_Description) {
                    classificationData.description += ` ${soulGeo.Social_Description}`;
                }
                if (facadeGeo && facadeGeo.Descendant_Description) {
                    classificationData.description += ` ${facadeGeo.Descendant_Description}`;
                }
            }

            // Generate Individual Story for the Planet
            const planetStory = this.generatePlanetStory(planetName, classificationData, society, planetPRNG);

            // Adjust color based on resources
            let planetColor = {
                h: innerSeed,
                s: 0.7,
                l: 0.5 + outerSeed * 0.3
            };
            planetColor = this.adjustPlanetColorByResources(planetColor, classificationData.resources);

            // Generate 3D Mesh Data (or the mesh itself if running in a context that supports it)
            // We store the config to generate the mesh later to avoid heavy processing here if not needed immediately
            const meshConfig = {
                radius: planetRadius,
                type: classificationData.type,
                resources: classificationData.resources,
                atmosphere: classificationData.atmosphere,
                moons: moons,
                name: planetName
            };

            planets.push({
                index: i,
                name: planetName,
                status: statusText,
                society: society,
                type: classificationData.type,
                radius: planetRadius,
                orbitalDistance,
                biosphere: classificationData.biosphere,
                resources: classificationData.resources,
                description: classificationData.description,
                atmosphere: classificationData.atmosphere,
                temperature: classificationData.temperature.toFixed(2),
                gravity: classificationData.gravity.toFixed(2),
                isHomeworld,
                moons: moons,
                moonCount: moonCount,
                color: planetColor,
                orbitSpeed: (BASE_ORBIT_SPEED * PLANET_SPEED_FACTOR) / orbitalDistance,
                spinSpeed: BASE_SPIN_SPEED * (1 - innerSeed),
                axialTilt: axialTilt.toFixed(1),
                inclination: inclination.toFixed(2),
                story: planetStory,
                meshConfig: meshConfig
            });
        }

        Logger.end(funcName, `Generated ${planets.length} planets.`);
        return planets;
    }

    getStarMass(starClass) {
        if (!starClass) return 1.0;
        const c = starClass.charAt(0).toUpperCase();
        // Approximate mass in Solar Masses
        const masses = { 'O': 16, 'B': 6, 'A': 2, 'F': 1.4, 'G': 1, 'K': 0.8, 'M': 0.5 };
        return masses[c] || 1.0;
    }

    getStarLuminosity(starClass) {
        if (!starClass) return 1.0;
        const c = starClass.charAt(0).toUpperCase();
        // Approximate luminosity relative to Sol
        const lums = { 'O': 30000, 'B': 1000, 'A': 20, 'F': 4, 'G': 1, 'K': 0.4, 'M': 0.04 };
        return lums[c] || 1.0;
    }

    getPlanetMass(type, radius) {
        // Approximate mass in Earth Masses based on type and radius
        // Radius is roughly 0.5 - 1.5 relative scale in generator
        if (type.includes('Gas Giant')) return 318 * radius; // Jupiter is ~318 Earths
        if (type.includes('Ice Giant')) return 15 * radius; // Neptune is ~17 Earths
        if (type.includes('Dwarf')) return 0.01 * radius;
        if (type.includes('Super-Earth')) return 5 * radius;
        return 1.0 * radius; // Standard Terrestrial
    }

    adjustPlanetColorByResources(baseColor, resources) {
        if (!resources || resources.length === 0) return baseColor;

        let h = baseColor.h;
        let s = baseColor.s;
        let l = baseColor.l;

        // Simple keyword matching to shift hue/saturation
        // Handle object array from ResourceFactory
        const resourceString = resources.map(r => r.name).join(' ').toLowerCase();

        if (resourceString.includes('water') || resourceString.includes('ice')) {
            h = (h + 0.6) / 2; // Shift towards blue (0.6)
            s = Math.min(1, s + 0.1);
        }
        if (resourceString.includes('iron') || resourceString.includes('rust') || resourceString.includes('copper')) {
            h = (h + 0.05) / 2; // Shift towards red/orange (0.05)
            s = Math.min(1, s + 0.2);
        }
        if (resourceString.includes('gold') || resourceString.includes('sulfur')) {
            h = (h + 0.15) / 2; // Shift towards yellow (0.15)
        }
        if (resourceString.includes('vegetation') || resourceString.includes('algae') || resourceString.includes('emerald')) {
            h = (h + 0.33) / 2; // Shift towards green (0.33)
        }
        if (resourceString.includes('carbon') || resourceString.includes('coal') || resourceString.includes('obsidian')) {
            l = Math.max(0.1, l - 0.3); // Darken
        }
        if (resourceString.includes('diamond') || resourceString.includes('crystal') || resourceString.includes('quartz')) {
            l = Math.min(0.9, l + 0.2); // Lighten/Sparkle
        }

        return {
            h: h % 1.0,
            s: s,
            l: l
        };
    }

    determinePlanetClassification(i, orbitalDistance, planetRadius, prng, systemData) {
        const funcName = 'PlanetarySystemGenerator.determinePlanetClassification';
        Logger.start(funcName, { planetIndex: i, distance: orbitalDistance });
        const specialSeed = prng.nextDouble();
        let classification = {
            type: '',
            biosphere: '',
            resources: [],
            description: null,
            atmosphere: 'None',
            temperature: 0,
            gravity: 0
        };

        const innerSeed = prng.nextDouble();
        const outerSeed = prng.nextDouble();

        // --- 1. Determine Base Type ---
        Logger.message(`${funcName}: Step 1 - Base Type`);
        let isSpecial = false;
        if (specialSeed > 0.9 && i !== systemData.homeWorldIndex) {
            const specialTypes = (LoreData.planet && LoreData.planet.SPECIAL_PLANET_TYPES) ? LoreData.planet.SPECIAL_PLANET_TYPES : [];
            if (specialTypes && specialTypes.length > 0) {
                const index = Math.min(Math.floor(innerSeed * specialTypes.length), specialTypes.length - 1);
                const specialType = specialTypes[index];
                if (specialType) {
                    classification.type = specialType.name;
                    classification.description = specialType.desc;
                    classification.biosphere = 'None';
                    isSpecial = true;
                }
            }
        }

        if (!isSpecial) {
            const prefixes = (LoreData.planet && LoreData.planet.PLANET_PREFIXES) ? LoreData.planet.PLANET_PREFIXES : ['Unknown'];
            const index = Math.min(Math.floor(innerSeed * prefixes.length), prefixes.length - 1);
            let prefix = prefixes[index] || 'Unknown';
            let suffix = 'World';

            // Calculate Zones based on Star Luminosity
            const luminosity = this.getStarLuminosity(systemData.star?.starClass);
            const frostLine = 4.85 * Math.sqrt(luminosity);
            const hotZone = 0.5 * Math.sqrt(luminosity);

            if (planetRadius > 0.8 && orbitalDistance > frostLine) {
                prefix = (outerSeed > 0.5) ? 'Gas' : 'Ice';
                suffix = 'Giant';
            } else if (orbitalDistance < frostLine) {
                prefix = (innerSeed < 0.4) ? 'Volcanic' : 'Barren';
                suffix = (planetRadius < 0.6) ? 'Rock' : 'World';
            } else if (orbitalDistance > frostLine * 2.5) {
                prefix = (outerSeed > 0.6) ? 'Ice' : 'Crystalline';
                suffix = (planetRadius < 0.7) ? 'Dwarf' : 'World';
            }
            classification.type = `${prefix} ${suffix}`;
        }

        // --- 2. Generate Physical Properties Based on Type ---
        Logger.message(`${funcName}: Step 2 - Physical Properties`);
        const tempSeed = prng.nextDouble();
        const luminosity = this.getStarLuminosity(systemData.star?.starClass);
        
        // Calculate Blackbody temperature approximation: T = 278 * (L^0.25) / (d^0.5)
        // This gives a baseline temperature in Kelvin
        const baseTemp = 278 * Math.pow(luminosity, 0.25) / Math.sqrt(orbitalDistance);
        
        // Revised Gravity Calculation: More realistic scaling
        classification.gravity = planetRadius * (0.8 + innerSeed * 0.4); // 0.4 - 1.2 G roughly for terrestrials

        if (classification.type.includes('Gas') || classification.type.includes('Giant')) {
            classification.atmosphere = 'Dense Hydrogen, Helium';
            classification.temperature = baseTemp + (tempSeed * 50); // Internal heat
            classification.gravity = planetRadius * (1.5 + tempSeed * 1.5); // 0.75 - 2.5 G roughly
        } else if (classification.type.includes('Volcanic')) {
            classification.atmosphere = 'Sulphuric, Carbon Dioxide';
            classification.temperature = baseTemp + 200 + (tempSeed * 200);
        } else if (classification.type.includes('Ice')) {
            classification.atmosphere = 'Thin Nitrogen, Methane';
            classification.temperature = Math.min(baseTemp, 150); // Cap at freezing
        } else if (classification.type.includes('Barren')) {
            classification.atmosphere = 'Trace, Argon';
            classification.temperature = baseTemp + (tempSeed * 20 - 10);
        } else {
            classification.atmosphere = 'Nitrogen, Oxygen';
            classification.temperature = baseTemp + (tempSeed * 30 - 15); // Greenhouse effect variance
        }

        // --- 3. Determine Biosphere ---
        Logger.message(`${funcName}: Step 3 - Biosphere`);
        const biosphereSeed = prng.nextDouble();
        if (classification.biosphere === '') {
            const biospheres = (LoreData.planet && LoreData.planet.BIOSPHERE_STATUSES) ? LoreData.planet.BIOSPHERE_STATUSES : ['None'];
            const index = Math.min(Math.floor(biosphereSeed * biospheres.length), biospheres.length - 1);
            classification.biosphere = biospheres[index] || 'None';
        }

        // Ensure type is defined before resource generation
        if (!classification.type) {
            classification.type = 'Unknown World';
        }

        // --- 4. Logical Resource Allocation ---
        Logger.message(`${funcName}: Step 4 - Resources`);
        classification.resources = this.resourceFactory.generateResources(classification.type, orbitalDistance, systemData.star, prng);
        Logger.message(`${funcName}: Generated ${classification.resources.length} resources.`);

        // --- 5. Apply Homeworld & Lore Overrides ---
        Logger.message(`${funcName}: Step 5 - Overrides`);
        if (i === systemData.homeWorldIndex) {
            classification.biosphere = 'Complex Flora/Fauna';
            classification.type = 'Terrestrial World';
            classification.atmosphere = 'Standard Terran (Nitrogen-Oxygen)';
            classification.temperature = 288;
            classification.gravity = 1.0;

            // Use planetAffinity from species lore if it exists
            const affinity = systemData.speciesCore?.planetAffinity;
            if (affinity) {
                if (affinity.includes('aquatic')) {
                    classification.type = 'Ocean World';
                } else if (affinity.includes('jungle') || affinity.includes('forest') || affinity.includes('insectoid')) {
                    classification.type = 'Jungle World';
                } else if (affinity.includes('desert') || affinity.includes('reptilian')) {
                    classification.type = 'Desert World';
                } else if (affinity.includes('avian') || affinity.includes('mountain')) {
                    classification.type = 'Mountainous World';
                }
            }
            // Add resources appropriate for a homeworld
            classification.resources.push(
                { name: "Water", grade: "Abundant", value: 20, description: "Abundant Water" },
                { name: "Soil", grade: "Rich", value: 15, description: "Rich Soil" },
                { name: "Metals", grade: "Common", value: 10, description: "Common Metals" }
            );
        } else if (systemData.speciesKey === 'SPECIES_FIRST_RELIC') {
            classification.type = 'Relic World';
            classification.biosphere = 'None';
            classification.resources = [
                { name: "Artifacts", grade: "First-Tier", value: 30, description: "First-Tier Artifacts" },
                { name: "Exotic Matter", grade: "Trace", value: 5, description: "Exotic Matter Traces" }
            ];
        } else if (systemData.speciesCore && systemData.speciesCore.archetype && systemData.speciesCore.archetype.includes('SYNTHETIC')) {
            classification.type = 'Forge World';
            classification.biosphere = 'Engineered Ecosystem';
            classification.resources.push(
                { name: "Rare Earths", grade: "Major", value: 15, description: "Rare Earths" },
                { name: "Heavy Metals", grade: "Major", value: 15, description: "Heavy Metals" }
            );
        }

        // --- 6. T13 Sway Population & Biosphere ---
        const T13NE = this.pluginManager ? this.pluginManager.getApi('T13', 'T13NE') : null;
        const Sway = T13NE ? T13NE.getModule('Sway') : null;
        if (Sway && classification.biosphere !== 'None') {
            // Map planet radius (0.5 - 1.5) to Chi (21 - 24)
            const planetChi = Math.floor(21 + (planetRadius - 0.5) * 3);
            const carryingCapacity = Sway.calculateCarryingCapacity(planetChi, classification.biosphere === 'Complex Flora/Fauna' ? 1.0 : 0.1);
            
            // Determine population if inhabited
            if (systemData.speciesKey && systemData.speciesKey !== 'None' && classification.biosphere !== 'None') {
                const successRate = 0.8; // High success for spacefaring
                const biomassPercent = 0.001; // Dominant species biomass
                const pop = Sway.calculatePopulation(carryingCapacity, successRate, biomassPercent);
                classification.population = pop;
                classification.carryingCapacity = carryingCapacity;
                classification.description += ` Supports a population of ${pop.toLocaleString()} (Capacity: ${carryingCapacity.toLocaleString()}).`;
            }
        }

        classification.description = `A ${classification.type} with a biosphere classification of '${classification.biosphere}'.`;

        Logger.end(funcName, classification);
        return classification;
    }

    generateGenericPlanetName(n1, n2) {
        const funcName = 'PlanetarySystemGenerator.generateGenericPlanetName';
        Logger.start(funcName);
        // Use the new, robust name generator to create a planet name.
        // We combine the noise values to create a seed.
        const seed = `${n1}-${n2}`;
        const name = this.nameGenerator.generate('PLANET_NAMES', seed);
        Logger.end(funcName, name);
        return name;
    }

    generateSociety(prng, speciesKey) {
        const funcName = 'PlanetarySystemGenerator.generateSociety';
        Logger.start(funcName, { speciesKey });
        if (speciesKey === 'SPECIES_FIRST_RELIC') {
            return 'None (Relic Site)';
        }

        // Fallback lists in case LoreData is missing or incomplete
        const fallbackAdjectives = ["Industrial", "Agrarian", "Feudal", "Corporate", "Nomadic", "Spiritual", "Militaristic", "Peaceful", "High-Tech", "Primitive"];
        const fallbackNouns = ["Hegemony", "Republic", "Empire", "Collective", "Federation", "Union", "Syndicate", "Order", "Dominion", "State"];

        let adjList = fallbackAdjectives;
        let nounList = fallbackNouns;

        if (LoreData.society && Array.isArray(LoreData.society.SOCIAL_ADJECTIVES) && Array.isArray(LoreData.society.SOCIAL_NOUN)) {
            if (LoreData.society.SOCIAL_ADJECTIVES.length > 0) adjList = LoreData.society.SOCIAL_ADJECTIVES;
            if (LoreData.society.SOCIAL_NOUN.length > 0) nounList = LoreData.society.SOCIAL_NOUN;
        }

        const adjIndex = Math.min(Math.floor(prng.nextDouble() * adjList.length), adjList.length - 1);
        const nounIndex = Math.min(Math.floor(prng.nextDouble() * nounList.length), nounList.length - 1);

        const adjective = adjList[adjIndex];
        const noun = nounList[nounIndex];

        const society = `${adjective.charAt(0).toUpperCase() + adjective.slice(1)} ${noun}`;
        Logger.end(funcName, society);
        return society;
    }

    generatePlanetStory(name, classification, society, prng) {
        // Simple story generator based on planet type and society
        const themes = ['Conflict', 'Discovery', 'Mystery', 'Trade', 'Survival'];
        const theme = themes[Math.floor(prng.nextDouble() * themes.length)];
        
        let plotHook = `The ${society} on ${name} is facing a ${theme}.`;
        if (classification.resources.length > 0) {
            const resource = classification.resources[0];
            plotHook += ` Control of the ${resource.name} deposits is a key factor.`;
        }
        
        return {
            title: `${theme} on ${name}`,
            hook: plotHook,
            theme: theme
        };
    }

    generateMoons(planetRadius, parentOrbitalDistance, seeds, hillSphere, rocheLimit, planetName, maxMoons) {
        const funcName = 'PlanetarySystemGenerator.generateMoons';
        
        // T13 Harmonics for Moon Orbits based on Planet Name
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const T13Geometry = T13NE?.getModule('T13Geometry');
        let harmonics = [];
        
        if (T13Geometry && planetName) {
            const geo = T13Geometry.calculateFullGeo(planetName);
            if (geo && geo.GeoHarmonics && Array.isArray(geo.GeoHarmonics.Harmonic)) {
                harmonics = geo.GeoHarmonics.Harmonic;
            }
        }
        
        // Fallback if no harmonics available (e.g. T13 not loaded)
        if (harmonics.length === 0) {
             const moonPRNG = ProcGen.createPRNG(seeds.join(','));
             // Generate pseudo-harmonics
             const count = Math.floor(moonPRNG.nextDouble() * 5) + 1;
             for(let k=0; k<count; k++) harmonics.push(Math.floor(moonPRNG.nextDouble() * 13) + 1);
        }

        Logger.start(funcName, { planetName, harmonics });

        const moons = [];
        const moonPRNG = ProcGen.createPRNG(seeds.join(','));

        // Start generating from just inside Roche limit to allow for rings
        let currentOrbit = rocheLimit * 0.8;

        for (let i = 0; i < harmonics.length; i++) {
            if (moons.length >= maxMoons) break;

            const moonSeed1 = moonPRNG.nextDouble();
            const moonSeed2 = moonPRNG.nextDouble();
            const nameSeed = moonPRNG.nextDouble();
            
            // Ensure harmonic is a valid number and clamped to prevent massive orbits
            let hVal = Number(harmonics[i]);
            if (!Number.isFinite(hVal)) {
                // Logger.warn(`PlanetarySystemGenerator: Invalid harmonic at index ${i}: ${harmonics[i]}. Defaulting to 1.`);
                hVal = 1;
            }
            
            const harmonic = Math.min(Math.max(1, hVal), 24);

            // Radius: Influenced by harmonic
            const sizeScale = 0.01 + (harmonic / 13) * 0.2; // 0.01 to 0.21 planet radius
            const moonRadius = sizeScale * planetRadius;
            
            // Calculate Distance using Harmonic Resonance
            // Resonance factor: 1.1 to 2.4 based on harmonic
            const resonance = 1.1 + (harmonic * 0.1); 
            
            // Keplerian spacing: a_next = a_prev * (resonance)^(2/3)
            let moonDistance = currentOrbit * Math.pow(resonance, 2/3) * (0.95 + moonSeed2 * 0.1);
            
            if (!Number.isFinite(moonDistance)) {
                Logger.warn(`PlanetarySystemGenerator: Moon distance NaN for moon ${i}. Aborting moon generation.`);
                break;
            }
            
            currentOrbit = moonDistance;
            
            // Generate Name
            let moonName = `Moon ${i + 1}`;
            if (this.nameGenerator && typeof this.nameGenerator.generate === 'function') {
                 // Use a distinct seed for the name
                 moonName = this.nameGenerator.generate('PLANET_NAMES', nameSeed);
            }

            // Determine Characteristics
            let type = 'Barren Moon';
            let isRing = false;

            if (moonDistance < rocheLimit) {
                type = 'Ring System';
                isRing = true;
            } else if (moonDistance > hillSphere) {
                // Lost moon - skip
                // Logger.message(`Moon lost over Hill limit: ${moonDistance.toFixed(4)} > ${hillSphere.toFixed(4)}`);
                break;
            } else if (moonDistance > hillSphere * 0.8) {
                // Quasi-satellite at edge
                type = 'Quasi-Satellite';
            }

            let atmosphere = 'None';
            let biosphere = 'None';
            let description = 'A small, barren rock.';

            // Thresholds
            const HABITABLE_SIZE_MIN = 0.2; 
            const HABITABLE_ZONE_MIN = 0.8; // AU
            const HABITABLE_ZONE_MAX = 1.6; // AU

            if (!isRing && type !== 'Quasi-Satellite' && moonRadius >= 0.15) {
                 if (moonRadius >= HABITABLE_SIZE_MIN && parentOrbitalDistance >= HABITABLE_ZONE_MIN && parentOrbitalDistance <= HABITABLE_ZONE_MAX) {
                     if (moonSeed2 > 0.6) {
                         type = 'Habitable Moon';
                         atmosphere = 'Breathable';
                         biosphere = 'Microbial';
                         description = 'A large moon with a breathable atmosphere and simple life.';
                     }
                 } else if (parentOrbitalDistance > HABITABLE_ZONE_MAX) {
                     type = 'Ice Moon';
                     if (moonSeed2 > 0.5) {
                         biosphere = 'Subsurface Ocean';
                         description = 'An icy moon potentially harboring a subsurface ocean.';
                     }
                 }
            }

            moons.push({
                name: moonName,
                type: type,
                isRing: isRing,
                atmosphere: atmosphere,
                biosphere: biosphere,
                description: description,
                radius: moonRadius,
                orbitalDistance: moonDistance,
                color: { h: moonSeed1, s: 0.2, l: 0.6 + moonSeed2 * 0.2 }
            });
        }

        Logger.end(funcName, `Generated ${moons.length} moons.`);
        return moons;
    }
}