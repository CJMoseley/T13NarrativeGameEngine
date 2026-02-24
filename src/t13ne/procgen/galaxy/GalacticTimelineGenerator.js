import PRNG from '/src/t13ne/modules/systems/t13ne-prng.js';
import { LoreData } from '/src/t13ne/procgen/lore/LoreData.js';
import Logger from '/src/t13ne/core/Logger.js';
import { ComponentDefs } from '/src/t13ne/procgen/ships/components/ComponentDefs.js';
import { NameGenerator as FallbackNameGenerator } from '/src/t13ne/procgen/lore/factories/NameGenerator.js';

/**
 * Procedurally generates a galactic history timeline.
 */
export class GalacticTimelineGenerator {
    constructor(seed, pluginManager, loreMaster) {
        this.pluginManager = pluginManager;
        this.loreMaster = loreMaster;
        this.prng = PRNG.create(seed);

        this.swayEvents = null;
        this.cardsApi = this.pluginManager?.getApi('T13', 'CardsAPI');
    }

    async generate() {
        const funcName = 'GalacticTimelineGenerator.generate';
        Logger.start(funcName);
        const params = await this._loadParams();

        // Load Sway Events
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const Codex = T13NE?.getModule('Codex');
        if (Codex) {
            this.swayEvents = await Codex.getData('sway', 'sway_events.json');
        }

        const timeline = [];
        let currentTime = -params.galaxyAge;
        let activeSpecies = [];
        let corporations = [];
        let ageCounter = 1;

        while (currentTime < params.gameStartTime) { // Corrected from this.prng.int
            const ageDuration = Math.floor(this.prng.nextDouble() * (params.ageDurationRange[1] - params.ageDurationRange[0] + 1)) + params.ageDurationRange[0];
            const ageStart = currentTime;
            const ageEnd = Math.min(ageStart + ageDuration, params.gameStartTime);

            // Determine Age Type using Sway Events or Cards
            let ageType = "Age";
            let ageDesc = "An era of galactic history.";

            if (this.swayEvents && this.swayEvents.length > 0) {
                // Pick an event type based on a "Chi" roll for the age's significance
                const chiRoll = Math.floor(this.prng.nextDouble() * 100) + 1;
                // Find closest event type
                const eventType = this.swayEvents.reduce((prev, curr) =>
                    Math.abs(curr.Chi - chiRoll) < Math.abs(prev.Chi - chiRoll) ? curr : prev
                );
                ageType = eventType.Type;
                ageDesc = eventType.Sway_Type_Description;
            }

            const age = {
                age: `The ${ageCounter++} Age (${ageType})`,
                start: ageStart,
                end: ageEnd,
                description: ageDesc,
                events: []
            };

            // Yield control to UI thread before event generation
            await new Promise(r => setTimeout(r, 0));

            // Seed the age with some initial events
            await this._generateEventsForPeriod(age, activeSpecies, corporations, params);

            timeline.push(age);
            currentTime = ageEnd;
        }

        Logger.end(funcName);
        return { timeline, corporations, activeSpecies };
    }

    async _generateEventsForPeriod(age, activeSpecies, corporations, params) {
        // Simple event generation for now, can be expanded. We use nextDouble() for probabilities.
        // Let's ensure at least one species emerges if none exist.
        if (activeSpecies.length === 0 && this.prng.nextDouble() < 0.8) {
            await this._createEmergenceEvent(age, activeSpecies, params);
        }

        // Roll for other events using random()
        if (activeSpecies.length > 0 && this.prng.nextDouble() < params.eventProbabilities.UPLIFT_EVENT) {
            await this._createUpliftEvent(age, activeSpecies, params);
        }

        if (this.prng.nextDouble() < params.eventProbabilities.EXTINCTION_EVENT && activeSpecies.length > 1) {
            await this._createExtinctionEvent(age, activeSpecies, params);
        }

        if (activeSpecies.length > 0 && this.prng.nextDouble() < params.eventProbabilities.CORPORATION_FOUNDING) {
            await this._createCorporationFoundingEvent(age, activeSpecies, corporations, params);
        }

        if (corporations.filter(c => c.status === 'Active').length > 1 && this.prng.nextDouble() < params.eventProbabilities.CORPORATION_MERGER) {
            await this._createCorporationMergerEvent(age, corporations, params);
        }

        if (corporations.filter(c => c.status === 'Active').length > 0 && this.prng.nextDouble() < params.eventProbabilities.CORPORATION_COLLAPSE) {
            await this._createCorporationCollapseEvent(age, corporations, params);
        }
    }

    async _createEmergenceEvent(age, activeSpecies, params) {
        const allSpecies = LoreData.speciesFoundations.filter(s => s.type === 'template');
        if (!allSpecies || allSpecies.length === 0) return;

        // Filter out species that are already active
        const availableSpecies = allSpecies.filter(s => !activeSpecies.some(as => as.id === s.id));
        if (availableSpecies.length === 0) return;

        // Simple random selection for now
        const newSpecies = availableSpecies[Math.floor(this.prng.nextDouble() * availableSpecies.length)];
        const newSpeciesKey = newSpecies.name;

        if (!activeSpecies.includes(newSpeciesKey)) {
            // Use Cards to flavor the emergence if available
            let flavor = "";
            if (this.cardsApi) {
                // Simulate drawing a card
                // Since we can't easily get a deck instance here without async init issues, we skip or mock
                // Ideally: const card = this.cardsApi.deck.draw(1)[0];
            }

            // Generate the full lore for this new species at the time of its emergence
            const noiseValues = {
                n1: this.prng.nextDouble(),
                n2: this.prng.nextDouble(),
                n3: this.prng.nextDouble(),
                n4: this.prng.nextDouble()
            };
            // We pass a mock star and galaxyParams since we're not in a specific system yet
            const speciesLore = await this.loreMaster.generateSystemLore({ r: this.prng.nextDouble(), z: 0 }, noiseValues, {});

            activeSpecies.push(speciesLore); // Store the full lore object
            age.events.push({
                type: "SPECIES_EMERGENCE",
                species: speciesLore,
                time: age.start,
                position: { x: this.prng.nextDouble() * 4000 - 2000, y: this.prng.nextDouble() * 4000 - 2000 },
                description: `The ${speciesLore.commonName} emerged as a significant power in the galaxy.`
            });
        }
    }

    async _createUpliftEvent(age, activeSpecies, params) {
        const creator = activeSpecies[Math.floor(this.prng.nextDouble() * activeSpecies.length)];
        const creatorLore = LoreData.speciesFoundations.find(s => s.name === creator.commonName);

        if (creatorLore && creatorLore.uplifts && creatorLore.uplifts.length > 0) {
            const createdOptions = creatorLore.uplifts;
            const createdName = createdOptions[Math.floor(this.prng.nextDouble() * createdOptions.length)];
            if (!activeSpecies.some(s => s.commonName === createdName)) {
                // Generate the full lore for this uplifted species
                const noiseValues = {
                    n1: this.prng.nextDouble(),
                    n2: this.prng.nextDouble(),
                    n3: this.prng.nextDouble(),
                    n4: this.prng.nextDouble()
                };
                const speciesLore = await this.loreMaster.generateSystemLore({ r: this.prng.nextDouble(), z: 0 }, noiseValues, {});

                // Override commonName to match the historical uplift name if it's already defined
                speciesLore.commonName = createdName;

                activeSpecies.push(speciesLore);
                age.events.push({
                    type: "UPLIFT_EVENT",
                    creator: creator.commonName,
                    created: speciesLore,
                    time: age.start + 10000,
                    position: { x: this.prng.nextDouble() * 4000 - 2000, y: this.prng.nextDouble() * 4000 - 2000 },
                    description: `The ${creator.commonName} uplifted the ${createdName}, welcoming them into the galactic community.`
                });
            }
        }
    }

    _createExtinctionEvent(age, activeSpecies, params) {
        const extinctIndex = Math.floor(this.prng.nextDouble() * activeSpecies.length);
        const extinctSpecies = activeSpecies.splice(extinctIndex, 1)[0];
        age.events.push({
            type: "EXTINCTION_EVENT",
            species: extinctSpecies,
            time: age.end - 10000,
            cause: "Unknown",
            position: { x: this.prng.nextDouble() * 4000 - 2000, y: this.prng.nextDouble() * 4000 - 2000 },
            description: `The ${extinctSpecies.commonName} have faded from the galaxy, their era coming to an end.`
        });
    }

    _createCorporationFoundingEvent(age, activeSpecies, corporations, params) {
        const foundingSpecies = activeSpecies[Math.floor(this.prng.nextDouble() * activeSpecies.length)];
        const archetypes = Object.keys(LoreData.corporations.ARCHETYPES);
        const archetype = archetypes[Math.floor(this.prng.nextDouble() * archetypes.length)];

        let corpName;
        do {
            const template = LoreData.corporations.NAMING.TEMPLATES[Math.floor(this.prng.nextDouble() * LoreData.corporations.NAMING.TEMPLATES.length)];
            const prefix = LoreData.corporations.NAMING.PREFIXES[Math.floor(this.prng.nextDouble() * LoreData.corporations.NAMING.PREFIXES.length)];
            const suffix = LoreData.corporations.NAMING.SUFFIXES[Math.floor(this.prng.nextDouble() * LoreData.corporations.NAMING.SUFFIXES.length)];
            const modifier = LoreData.corporations.NAMING.MODIFIERS[Math.floor(this.prng.nextDouble() * LoreData.corporations.NAMING.MODIFIERS.length)];
            corpName = template.replace('{PREFIX}', prefix).replace('{SUFFIX}', suffix).replace('{MODIFIER}', modifier);
        } while (LoreData.corporations.BANNED_WORDS.includes(corpName.toLowerCase()));

        const archetypeData = LoreData.corporations.ARCHETYPES[archetype];
        const focusableTech = [...(archetypeData.techFocus || []), ...Object.keys(ComponentDefs.TASKS), ...Object.keys(ComponentDefs.MATERIALS)];
        const specialization = focusableTech[Math.floor(this.prng.nextDouble() * focusableTech.length)];

        const corporation = {
            id: corporations.length,
            name: corpName,
            archetype: archetype,
            founder: foundingSpecies.speciesKey,
            founded: age.start + Math.floor(this.prng.nextDouble() * (age.end - age.start)),
            status: 'Active',
            specialization: specialization,
            // Assign a home region for later lookup
            homeRegion: {
                r: this.prng.nextDouble(), // 0 to 1 (core to edge)
                theta: this.prng.nextDouble() * Math.PI * 2 // 0 to 2PI
            }
        };

        corporations.push(corporation);
        age.events.push({
            type: "CORPORATION_FOUNDING",
            corporation: corporation,
            time: corporation.founded,
            position: { x: corporation.homeRegion.r * 2000 * Math.cos(corporation.homeRegion.theta), y: corporation.homeRegion.r * 2000 * Math.sin(corporation.homeRegion.theta) },
            description: `The ${corporation.name}, who identify as a ${corporation.archetype}, were founded by the ${foundingSpecies.commonName}.`
        });
    }

    _createCorporationMergerEvent(age, corporations, params) {
        const activeCorps = corporations.filter(c => c.status === 'Active');
        if (activeCorps.length < 2) return;

        const acquiringIndex = Math.floor(this.prng.nextDouble() * activeCorps.length);
        const acquiringCorp = activeCorps[acquiringIndex];

        let targetIndex;
        do {
            targetIndex = Math.floor(this.prng.nextDouble() * activeCorps.length);
        } while (targetIndex === acquiringIndex);
        const targetCorp = activeCorps[targetIndex];

        // Mark the target corporation as merged
        targetCorp.status = 'Merged';
        targetCorp.mergedInto = acquiringCorp.id;

        age.events.push({
            type: "CORPORATION_MERGER",
            acquiringCorp: acquiringCorp,
            targetCorp: targetCorp,
            time: age.start + Math.floor(this.prng.nextDouble() * (age.end - age.start)),
            position: { x: acquiringCorp.homeRegion.r * 2000 * Math.cos(acquiringCorp.homeRegion.theta), y: acquiringCorp.homeRegion.r * 2000 * Math.sin(acquiringCorp.homeRegion.theta) },
            description: `The ${acquiringCorp.name} have acquired the ${targetCorp.name} in a major corporate merger.`
        });
    }

    _createCorporationCollapseEvent(age, corporations, params) {
        const activeCorps = corporations.filter(c => c.status === 'Active');
        if (activeCorps.length === 0) return;

        const collapsingCorp = activeCorps[Math.floor(this.prng.nextDouble() * activeCorps.length)];
        collapsingCorp.status = 'Defunct';

        age.events.push({
            type: "CORPORATION_COLLAPSE",
            corporation: collapsingCorp,
            time: age.start + Math.floor(this.prng.nextDouble() * (age.end - age.start)),
            position: { x: collapsingCorp.homeRegion.r * 2000 * Math.cos(collapsingCorp.homeRegion.theta), y: collapsingCorp.homeRegion.r * 2000 * Math.sin(collapsingCorp.homeRegion.theta) },
            description: `The once-mighty ${collapsingCorp.name} have collapsed due to internal strife and market pressures.`
        });
    }

    async _loadParams() {
        try {
            const response = await fetch('/data/historyParams.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            Logger.message(`ERROR: Failed to load history parameters: ${error}`);
            // Return a default object to prevent crashes if the file is missing.
            return {
                "galaxyAge": 13000000000,
                "gameStartTime": -50000,
                "ageDurationRange": [500000000, 1500000000],
                "eventProbabilities": {
                    "UPLIFT_EVENT": 0.1,
                    "EXTINCTION_EVENT": 0.05,
                    "CORPORATION_FOUNDING": 0.2,
                    "CORPORATION_MERGER": 0.05,
                    "CORPORATION_COLLAPSE": 0.02
                }
            };
        }
    }
}