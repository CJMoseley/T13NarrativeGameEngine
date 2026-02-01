import PRNG from './t13ne-prng.js';

let _prng = PRNG;

export default {
  // Set seed for deterministic output. Accepts string or number.
  setSeed(seed){
    PRNG.setSeed(seed);
    _prng = PRNG;
  },
  // Create an independent PRNG instance
  createPRNG(seed){
    return PRNG.create(seed);
  },
  // RNG mirrors T13Dice::RNG(min,max,offset)
  RNG(min=0, max=10, offset=0){
    min = Number(min) || 0; max = Number(max) || 0; offset = Number(offset) || 0;
    if (max < min){ const t = max; max = min; min = t; }
    // Use PRNG.nextInt
    const v = _prng.nextInt(min, max);
    return v + offset;
  }
};
