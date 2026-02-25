import { LoreData } from '/src/t13ne/procgen/lore/LoreData.js';
import ProcGen from '../ProcGen.js';
import Logger from '/src/t13ne/core/Logger.js';
import { ColourUtils } from '/src/t13ne/utils/ColourUtils.js';
import { Galaxy } from '/src/t13ne/procgen/galaxy/Galaxy.js';
import CodexLoader from '/src/t13ne/modules/codex/CodexLoader.js';

export class GalaxyGenerator {
  constructor(loreMaster, params = {}) {
    this.stars = [];
    const defaults = {
      armCount: 4,
      densityMultiplier: 3.5,
      haloRatio: 0.02,
      bulgeRatio: 0.25, // Significantly increased density for the core
      winding: 0.35,
      galaxyRadius: 2000000, // Default to 2M to work with 0.001 scale
      lag: 0.5
    };
    this.params = { ...defaults, ...LoreData.galacticDefinition, ...params };
    this.NEBULA_COLORS = [0x6699ff, 0xff33cc, 0x33ffcc, 0xffcc33, 0xff3333, 0x9966ff, 0x33ff66];
    this.loreMaster = loreMaster;
    this.galaxy = null; // To hold the canonical galaxy instance
  }

  updateParams(newParams) {
    Object.assign(this.params, newParams);
  }

  async generateGalaxy() {
    this.galaxy = new Galaxy(this.params);
    await this.galaxy.generateStars();
    return this.galaxy;
  }

  _findClosestSystems(centerStar, starList, count) {
    const distances = starList.map(star => {
      const dx = star.x - centerStar.x;
      const dy = star.y - centerStar.y;
      const dz = star.z - centerStar.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return { star, distance };
    });

    distances.sort((a, b) => a.distance - b.distance);
    return distances.slice(0, count).map(d => d.star);
  }

  async getSystemDetails(star, options = {}) {
    if (!this.galaxy || !this.galaxy.stars || this.galaxy.stars.length === 0) {
      Logger.error("GalaxyGenerator: Galaxy not generated. Cannot get system details.");
      return null;
    }

    const systemId = `${Math.round(star.x)},${Math.round(star.y)},${Math.round(star.z)}`;
    const cachedSystem = await CodexLoader.getCache('systems', systemId);
    if (cachedSystem && !options.force) {
      Logger.message(`GalaxyGenerator: Returning cached system for ${systemId}`);
      return cachedSystem;
    }

    // 1. Find nearby systems to gather context for name generation
    const nearbySystems = this._findClosestSystems(star, this.galaxy.stars, 12);
    const nearbySpeciesSet = new Set();

    // To avoid async operations in a loop, we can't get full details here.
    // We'll rely on the species determination logic which is deterministic.
    for (const system of nearbySystems) {
      const noiseScale = 5.0;
      const n1 = ProcGen.simplex2D(system.x * noiseScale, system.y * noiseScale);
      const n2 = ProcGen.simplex2D(system.y * noiseScale, system.z * noiseScale);
      const n3 = ProcGen.simplex2D(system.z * noiseScale, system.x * noiseScale);
      const n4 = ProcGen.simplex2D(system.x * noiseScale, system.z * noiseScale);

      // This deterministically re-calculates the species for a nearby star
      const speciesKey = this.loreMaster.determineSpecies(system, { n1, n2, n3, n4 }, this.params);
      if (speciesKey && speciesKey !== 'FirstRelic') {
        nearbySpeciesSet.add(speciesKey);
      }

      // Yield every few systems to keep UI responsive
      await new Promise(r => setTimeout(r, 0));
    }
    const nearbySpecies = Array.from(nearbySpeciesSet);

    // 2. Generate the lore for the target star, now with enriched context
    const noiseScale = 5.0;
    const n1 = ProcGen.simplex2D(star.x * noiseScale, star.y * noiseScale);
    const n2 = ProcGen.simplex2D(star.y * noiseScale, star.z * noiseScale);
    const n3 = ProcGen.simplex2D(star.z * noiseScale, star.x * noiseScale);
    const n4 = ProcGen.simplex2D(star.x * noiseScale, star.z * noiseScale);

    const seeds = [star.x, star.y, star.z, n1, n2, n3, n4].join(',');
    const localPRNG = ProcGen.create32PRNG(seeds);

    const planetCountSeed = localPRNG.nextDouble();
    const numPlanets = Math.floor(planetCountSeed * 5) + 3;

    const lore = await this.loreMaster.generateSystemLore(
      star,
      { n1, n2, n3, n4 },
      { ...this.params, numPlanets },
      nearbySpecies, // Pass the new context
      options
    );

    const homeWorldSelectionSeed = localPRNG.nextDouble();
    const preferredIndex = Math.min(Math.floor(homeWorldSelectionSeed * 3), numPlanets - 1);
    const homeWorldIndex = (lore.speciesKey === 'SPECIES_KATHORRI' || lore.speciesKey === 'SPECIES_THFTHF')
      ? Math.min(Math.floor(homeWorldSelectionSeed * numPlanets) + 1, numPlanets - 1)
      : preferredIndex;

    return {
      ...lore,
      starClass: star.starClass,
      starColor: star.color,
      coords: `${Math.round(star.x)}, ${Math.round(star.y)}, ${Math.round(star.z)}`,
      numPlanets,
      homeWorldIndex,
      seeds: seeds
    };

    await CodexLoader.storeCache('systems', systemId, result);
    return result;
  }
}
