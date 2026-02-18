import Logger from '@/src/t13ne/core/Logger.js';
import ProcGen from '@/src/t13ne/procgen/ProcGen.js';
import { ColourUtils } from '@/src/t13ne/utils/ColourUtils.js';

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
    }

    /**
     * Generates the stars for the galaxy based on the provided parameters.
     * This method populates the `this.stars` array.
     * Async implementation to prevent UI hangs.
     */
    async generateStars() {
        this.stars = [];
        const { armCount, densityMultiplier, haloRatio, bulgeRatio, winding, galaxyRadius } = this.params;
        const currentArmCount = Math.max(2, armCount);
        const baseStarCount = 10000;
        const starCount = Math.floor(baseStarCount * densityMultiplier * (armCount / 2));

        // Ensure galaxyRadius is a valid number to prevent coordinate explosion
        // Fix: Check for small radius values that might be unscaled (e.g. 2000 instead of 2000000)
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
        const SCALE = 0.001; // Scale down coordinates to avoid floating point precision issues

        // Pre-validate parameters to prevent NaN propagation
        let safeWinding = Number(winding);
        if (!Number.isFinite(safeWinding)) safeWinding = 0.35;
        safeWinding = Math.max(-10, Math.min(10, safeWinding)); // Clamp to prevent extreme theta

        let safeLag = Number(this.params.lag);
        if (!Number.isFinite(safeLag)) safeLag = 0.5;

        // Initialize PRNG with seed for deterministic generation
        const prng = ProcGen.create32PRNG(this.params.seed || 'wormhole-galaxy');

        const yieldEvery = 500;

        for (let i = 0; i < haloCount; i++) {
            if (i % yieldEvery === 0) await new Promise(r => setTimeout(r, 0));
          const isYoung = false;
          const rNorm = Math.pow(prng.nextDouble(), 0.3);
          const r = rNorm * safeGalaxyRadius * 1.5;

          // Inline spherical distribution to ensure correctness and avoid external dependency issues
          const phi = prng.nextDouble() * Math.PI * 2;
          let costheta = 2 * prng.nextDouble() - 1;
          // Clamp costheta to [-1, 1] to prevent NaN in sqrt due to floating point epsilon
          costheta = Math.max(-1, Math.min(1, costheta));
          const sintheta = Math.sqrt(1 - costheta * costheta);

          // Apply scale immediately
          let x = r * sintheta * Math.cos(phi) * SCALE;
          let y = r * sintheta * Math.sin(phi) * SCALE;
          let z = r * costheta * SCALE;
          let theta = Math.atan2(y, x);

          if (isNaN(x)) x = 0;
          if (isNaN(y)) y = 0;
          if (isNaN(z)) z = 0;
          if (isNaN(theta)) theta = 0;

          const starDetails = ColourUtils.getStarColorAndClassFromParams(isYoung, rNorm, 0.4, () => prng.nextDouble());

          this.stars.push({
            x, y, z,
            r: rNorm,
            angle: theta,
            isYoung,
            color: starDetails.color,
            starClass: starDetails.starClass,
            size: 4
          });
        }

        for (let i = 0; i < bulgeCount; i++) {
          if (i % yieldEvery === 0) await new Promise(r => setTimeout(r, 0));
          const isYoung = false;
          // Use spherical distribution for a proper Bulge (Ellipsoid), not a cone
          // Power of 0.6 concentrates stars in the center (approx 1/r density falloff)
          const r = Math.pow(prng.nextDouble(), 0.6) * safeGalaxyRadius * 0.5;
          const theta = prng.nextDouble() * Math.PI * 2;
          const phi = Math.acos(2 * prng.nextDouble() - 1);

          let x = r * Math.sin(phi) * Math.cos(theta);
          let y = r * Math.sin(phi) * Math.sin(theta);
          let z = r * Math.cos(phi) * 0.3; // More flattened (0.3 aspect ratio)

          if (isNaN(x)) x = 0;
          if (isNaN(y)) y = 0;
          if (isNaN(z)) z = 0;

          const starDetails = ColourUtils.getStarColorAndClassFromParams(isYoung, r / (safeGalaxyRadius * 0.5), 1.0, () => prng.nextDouble());

          this.stars.push({
            x: x * SCALE,
            y: y * SCALE,
            z: z * SCALE,
            r: r / safeGalaxyRadius, // Normalized radius for color calc
            angle: theta,
            isYoung,
            color: starDetails.color,
            starClass: starDetails.starClass,
            size: 4
          });
        }

        for (let i = 0; i < discCount; i++) {
          if (i % yieldEvery === 0) await new Promise(r => setTimeout(r, 0));
          // Feathering the edge:
          // Randomize the cutoff radius slightly per star to avoid a hard edge
          const effectiveRadius = safeGalaxyRadius * (0.9 + prng.nextDouble() * 0.2);
          const rNorm = Math.pow(prng.nextDouble(), 0.5); // Standard disk distribution
          const r = rNorm * effectiveRadius;

          const armIndex = Math.floor(prng.nextDouble() * currentArmCount);
          const armOffset = (Math.PI * 2 / currentArmCount) * armIndex;
          const A = 100;

          let thetaBase = -Math.log((r + A) / A) * safeWinding * WINDING_SCALE;

          thetaBase += armOffset;

          // Immediate validation for thetaBase
          if (isNaN(thetaBase) || !isFinite(thetaBase)) {
            thetaBase = armOffset;
          }

          let ageNoise = 0.5;
          let spurNoise = 0.5;

          // Safe noise generation
          try {
            const rawAgeNoise = ProcGen.simplex2D(r * 0.01, thetaBase);
            if (Number.isFinite(rawAgeNoise)) ageNoise = (rawAgeNoise + 1) / 2;

            const rawSpurNoise = ProcGen.simplex2D(thetaBase * 8, r * 0.05);
            if (Number.isFinite(rawSpurNoise)) spurNoise = (rawSpurNoise + 1) / 2;
          } catch (e) {
            // Fallback to random if noise fails or is missing
            ageNoise = prng.nextDouble();
            spurNoise = prng.nextDouble();
          }

          let theta = thetaBase;
          let isYoung = false;
          let scatter = (prng.nextDouble() - 0.5) + (prng.nextDouble() - 0.5);
          // Gentle taper: Arms are defined at center, slightly tighter at edge
          scatter *= (1.0 - rNorm * 0.4);

          if (ageNoise > 0.7 && spurNoise > 0.5) {
            isYoung = true;
            scatter *= 0.3;
            theta += (safeLag * 0.3);
          } else if (ageNoise > 0.4) {
            isYoung = true;
            scatter *= 0.7;
            theta += (safeLag * 0.1);
          } else {
            isYoung = false;
            scatter *= 0.8;
          }

          theta += scatter;
          // Final coordinate calculation
          let x = r * Math.cos(theta);
          let y = r * Math.sin(theta);

          // Fix: Thin disk with slight flare at edges
          const zBase = safeGalaxyRadius * 0.02;
          const flare = 1.0 + (rNorm * rNorm * 0.25); // Reduced flare for a thinner edge profile
          // Gaussian-ish distribution (Sum of randoms) to eliminate "cylinder" look
          let z = (prng.nextDouble() + prng.nextDouble() - 1.0) * zBase * flare;

          // Final safety validation before push
          if (isNaN(x)) x = 0;
          if (isNaN(y)) y = 0;
          if (isNaN(z)) z = 0;
          if (isNaN(theta)) theta = 0;

          const starDetails = ColourUtils.getStarColorAndClassFromParams(isYoung, rNorm, 1.0, () => prng.nextDouble());

          this.stars.push({
            x: x * SCALE,
            y: y * SCALE,
            z: z * SCALE,
            r: rNorm,
            angle: theta,
            isYoung,
            color: starDetails.color,
            starClass: starDetails.starClass,
            size: 3
          });
        }

        Logger.message(`Generated ${this.stars.length} stars.`);
        return this.stars;
    }
}
