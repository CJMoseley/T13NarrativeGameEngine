import Logger from '/src/t13ne/core/Logger.js';
import ProcGen from '/src/t13ne/procgen/ProcGen.js';
import { ColourUtils } from '/src/t13ne/utils/ColourUtils.js';
import { WorkerPool } from '/src/t13ne/core/WorkerPool.js';

/**
 * Galaxy Class
 *
 * This class represents the entire galaxy, holding the canonical data for all
 * stars, nebulae, and other galactic features. It is the single source of truth
 * for the galaxy's structure and contents.
 */
export class Galaxy {
  constructor(params) {
    this.params = params;
    this.stars = [];
    this.prng = ProcGen.create32PRNG(this.params.seed);
    this.workerPool = new WorkerPool('galaxy', new URL('./GalaxyWorker.js', import.meta.url), 1);
  }

  /**
   * Generates the stars for the galaxy based on the provided parameters.
   * This method populates the `this.stars` array using a background worker.
   */
  async generateStars() {
    Logger.message("Galaxy: Initiating star generation sequence...");
    const startTime = performance.now();

    // Use a timeout for the worker to avoid infinite hangs
    const workerTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Worker timeout")), 5000)
    );

    try {
      Logger.message(`Galaxy: Offloading to worker [WorkerPool:${this.workerPool.poolId}]...`);

      // Race the worker against a 5s timeout
      const response = await Promise.race([
        this.workerPool.execute('generateStars', {
          ...this.params,
          seed: this.params.seed || 'wormhole-galaxy'
        }),
        workerTimeout
      ]);

      if (response && response.stars) {
        this.stars = response.stars;
        Logger.message(`Galaxy: Worker successfully generated ${this.stars.length} stars in ${(performance.now() - startTime).toFixed(2)}ms.`);
      } else {
        Logger.warn("Galaxy: Worker returned invalid result. Falling back.");
        return this.generateStarsSync();
      }
      return this.stars;
    } catch (error) {
      const duration = (performance.now() - startTime).toFixed(2);
      Logger.warn(`Galaxy: Star generation worker unavailable or timed out after ${duration}ms. Falling back to main thread.`);
      return this.generateStarsSync();
    }
  }

  /**
   * Main thread fallback for star generation.
   */
  async generateStarsSync() {
    this.stars = [];
    const { armCount, densityMultiplier, haloRatio, bulgeRatio, winding, galaxyRadius, lag } = this.params;
    const currentArmCount = Math.max(2, armCount);
    const baseStarCount = 10000;
    const starCount = Math.floor(baseStarCount * densityMultiplier * (armCount / 2));

    let safeGalaxyRadius = Number(galaxyRadius);
    if (!Number.isFinite(safeGalaxyRadius) || safeGalaxyRadius < 100000) safeGalaxyRadius = 2000000;

    let HALO_RATIO = haloRatio;
    let BULGE_RATIO = bulgeRatio;
    const DISC_RATIO = 1.0 - HALO_RATIO - BULGE_RATIO;

    if (DISC_RATIO <= 0) {
      HALO_RATIO = 0.01;
      BULGE_RATIO = 0.01;
    }

    const haloCount = Math.floor(starCount * HALO_RATIO);
    const bulgeCount = Math.floor(starCount * BULGE_RATIO);
    const discCount = starCount - haloCount - bulgeCount;

    const WINDING_SCALE = 8.0;
    const SCALE = 0.001;

    let safeWinding = Number(winding);
    if (!Number.isFinite(safeWinding)) safeWinding = 0.35;
    safeWinding = Math.max(-10, Math.min(10, safeWinding));

    let safeLag = Number(lag);
    if (!Number.isFinite(safeLag)) safeLag = 0.5;

    const prng = ProcGen.create32PRNG(this.params.seed || 'wormhole-galaxy');

    Logger.message(`Galaxy: Fallback starting. Generating ${starCount} stars on main thread...`);

    // Halo
    for (let i = 0; i < haloCount; i++) {
      if (i % 1000 === 0) await new Promise(r => setTimeout(r, 0));
      const isYoung = false;
      const rNorm = Math.pow(prng.nextDouble(), 0.3);
      const r = rNorm * safeGalaxyRadius * 1.5;
      const phi = prng.nextDouble() * Math.PI * 2;
      let costheta = 2 * prng.nextDouble() - 1;
      costheta = Math.max(-1, Math.min(1, costheta));
      const sintheta = Math.sqrt(1 - costheta * costheta);

      let x = r * sintheta * Math.cos(phi) * SCALE;
      let y = r * sintheta * Math.sin(phi) * SCALE;
      let z = r * costheta * SCALE;
      let theta = Math.atan2(y, x);

      const starDetails = ColourUtils.getStarColorAndClassFromParams(isYoung, rNorm, 0.4, () => prng.nextDouble());
      this.stars.push({ x, y, z, r: rNorm, angle: theta, isYoung, color: starDetails.color, starClass: starDetails.starClass, size: 4 });
    }

    // Bulge
    for (let i = 0; i < bulgeCount; i++) {
      if (i % 1000 === 0) await new Promise(r => setTimeout(r, 0));
      const isYoung = false;
      const r = Math.pow(prng.nextDouble(), 0.6) * safeGalaxyRadius * 0.5;
      const theta = prng.nextDouble() * Math.PI * 2;
      const phi = Math.acos(2 * prng.nextDouble() - 1);
      let x = r * Math.sin(phi) * Math.cos(theta);
      let y = r * Math.sin(phi) * Math.sin(theta);
      let z = r * Math.cos(phi) * 0.3;

      const starDetails = ColourUtils.getStarColorAndClassFromParams(isYoung, r / (safeGalaxyRadius * 0.5), 1.0, () => prng.nextDouble());
      this.stars.push({ x: x * SCALE, y: y * SCALE, z: z * SCALE, r: r / safeGalaxyRadius, angle: theta, isYoung, color: starDetails.color, starClass: starDetails.starClass, size: 4 });
    }

    // Disc
    for (let i = 0; i < discCount; i++) {
      if (i % 1000 === 0) {
        await new Promise(r => setTimeout(r, 0));
        if (i % 10000 === 0) Logger.message(`Galaxy: Processing disc... ${i}/${discCount}`);
      }
      const effectiveRadius = safeGalaxyRadius * (0.9 + prng.nextDouble() * 0.2);
      const rNorm = Math.pow(prng.nextDouble(), 0.5);
      const r = rNorm * effectiveRadius;
      const armIndex = Math.floor(prng.nextDouble() * currentArmCount);
      const armOffset = (Math.PI * 2 / currentArmCount) * armIndex;
      let thetaBase = -Math.log((r + 100) / 100) * safeWinding * WINDING_SCALE + armOffset;

      let ageNoise = 0.5;
      let spurNoise = 0.5;
      try {
        ageNoise = (ProcGen.simplex2D(r * 0.01, thetaBase) + 1) / 2;
        spurNoise = (ProcGen.simplex2D(thetaBase * 8, r * 0.05) + 1) / 2;
      } catch (e) {
        ageNoise = prng.nextDouble(); spurNoise = prng.nextDouble();
      }

      let theta = thetaBase;
      let isYoung = false;
      let scatter = (prng.nextDouble() - 0.5) + (prng.nextDouble() - 0.5);
      scatter *= (1.0 - rNorm * 0.4);

      if (ageNoise > 0.7 && spurNoise > 0.5) { isYoung = true; scatter *= 0.3; theta += (safeLag * 0.3); }
      else if (ageNoise > 0.4) { isYoung = true; scatter *= 0.7; theta += (safeLag * 0.1); }
      else { isYoung = false; scatter *= 0.8; }

      theta += scatter;
      let x = r * Math.cos(theta);
      let y = r * Math.sin(theta);
      let z = (prng.nextDouble() + prng.nextDouble() - 1.0) * safeGalaxyRadius * 0.02 * (1.0 + rNorm * rNorm * 0.25);

      const starDetails = ColourUtils.getStarColorAndClassFromParams(isYoung, rNorm, 1.0, () => prng.nextDouble());
      this.stars.push({ x: x * SCALE, y: y * SCALE, z: z * SCALE, r: rNorm, angle: theta, isYoung, color: starDetails.color, starClass: starDetails.starClass, size: 3 });
    }
    Logger.message(`Galaxy: Generation complete. Total stars: ${this.stars.length}`);
    return this.stars;
  }
}
