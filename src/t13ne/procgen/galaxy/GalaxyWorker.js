// src/t13ne/procgen/galaxy/GalaxyWorker.js
import workerpool from 'workerpool';
import ProcGen from '/src/t13ne/procgen/ProcGen.js';
import { ColourUtils } from '/src/t13ne/utils/ColourUtils.js';

function generateStars(data) {
    const { armCount, densityMultiplier, haloRatio, bulgeRatio, winding, galaxyRadius, seed, lag } = data;

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

    const prng = ProcGen.create32PRNG(seed || 'wormhole-galaxy');
    const stars = [];

    // Halo
    for (let i = 0; i < haloCount; i++) {
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

      if (isNaN(x)) x = 0;
      if (isNaN(y)) y = 0;
      if (isNaN(z)) z = 0;
      if (isNaN(theta)) theta = 0;

      const starDetails = ColourUtils.getStarColorAndClassFromParams(isYoung, rNorm, 0.4, () => prng.nextDouble());

      stars.push({
        x, y, z,
        r: rNorm,
        angle: theta,
        isYoung,
        color: starDetails.color,
        starClass: starDetails.starClass,
        size: 4
      });
    }

    // Bulge
    for (let i = 0; i < bulgeCount; i++) {
      const isYoung = false;
      const r = Math.pow(prng.nextDouble(), 0.6) * safeGalaxyRadius * 0.5;
      const theta = prng.nextDouble() * Math.PI * 2;
      const phi = Math.acos(2 * prng.nextDouble() - 1);

      let x = r * Math.sin(phi) * Math.cos(theta);
      let y = r * Math.sin(phi) * Math.sin(theta);
      let z = r * Math.cos(phi) * 0.3;

      if (isNaN(x)) x = 0;
      if (isNaN(y)) y = 0;
      if (isNaN(z)) z = 0;

      const starDetails = ColourUtils.getStarColorAndClassFromParams(isYoung, r / (safeGalaxyRadius * 0.5), 1.0, () => prng.nextDouble());

      stars.push({
        x: x * SCALE,
        y: y * SCALE,
        z: z * SCALE,
        r: r / safeGalaxyRadius,
        angle: theta,
        isYoung,
        color: starDetails.color,
        starClass: starDetails.starClass,
        size: 4
      });
    }

    // Disc
    for (let i = 0; i < discCount; i++) {
      const effectiveRadius = safeGalaxyRadius * (0.9 + prng.nextDouble() * 0.2);
      const rNorm = Math.pow(prng.nextDouble(), 0.5);
      const r = rNorm * effectiveRadius;

      const armIndex = Math.floor(prng.nextDouble() * currentArmCount);
      const armOffset = (Math.PI * 2 / currentArmCount) * armIndex;
      const A = 100;

      let thetaBase = -Math.log((r + A) / A) * safeWinding * WINDING_SCALE;
      thetaBase += armOffset;

      if (isNaN(thetaBase) || !isFinite(thetaBase)) {
        thetaBase = armOffset;
      }

      let ageNoise = 0.5;
      let spurNoise = 0.5;

      try {
        const rawAgeNoise = ProcGen.simplex2D(r * 0.01, thetaBase);
        if (Number.isFinite(rawAgeNoise)) ageNoise = (rawAgeNoise + 1) / 2;

        const rawSpurNoise = ProcGen.simplex2D(thetaBase * 8, r * 0.05);
        if (Number.isFinite(rawSpurNoise)) spurNoise = (rawSpurNoise + 1) / 2;
      } catch (e) {
        ageNoise = prng.nextDouble();
        spurNoise = prng.nextDouble();
      }

      let theta = thetaBase;
      let isYoung = false;
      let scatter = (prng.nextDouble() - 0.5) + (prng.nextDouble() - 0.5);
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
      let x = r * Math.cos(theta);
      let y = r * Math.sin(theta);

      const zBase = safeGalaxyRadius * 0.02;
      const flare = 1.0 + (rNorm * rNorm * 0.25);
      let z = (prng.nextDouble() + prng.nextDouble() - 1.0) * zBase * flare;

      if (isNaN(x)) x = 0;
      if (isNaN(y)) y = 0;
      if (isNaN(z)) z = 0;
      if (isNaN(theta)) theta = 0;

      const starDetails = ColourUtils.getStarColorAndClassFromParams(isYoung, rNorm, 1.0, () => prng.nextDouble());

      stars.push({
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

    return { stars };
}

// create a worker and register public functions
workerpool.worker({
  generateStars: generateStars
});
