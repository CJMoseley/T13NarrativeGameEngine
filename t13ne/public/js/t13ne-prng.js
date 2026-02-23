// Seedable PRNG using splitmix64 for seeding and xoshiro256** as the core generator.
// Uses BigInt for 64-bit arithmetic to provide high-quality randomness and repeatability.

const MASK64 = (1n << 64n) - 1n;

function rotl(x, k) {
  return ((x << BigInt(k)) | (x >> (64n - BigInt(k)))) & MASK64;
}

function splitmix64(seed) {
  // Accepts BigInt seed, returns next 64-bit BigInt
  let z = (BigInt(seed) + 0x9E3779B97f4A7C15n) & MASK64;
  z = (z ^ (z >> 30n)) * 0xBF58476D1CE4E5B9n & MASK64;
  z = (z ^ (z >> 27n)) * 0x94D049BB133111EBn & MASK64;
  return (z ^ (z >> 31n)) & MASK64;
}

class Xoshiro256ss {
  constructor(seed) {
    this.s = [0n, 0n, 0n, 0n];
    if (seed === undefined) seed = Date.now();
    this.seed(seed);
  }

  seed(seed) {
    // Accept string or number. Turn into BigInt hash then feed splitmix64.
    let h;
    if (typeof seed === 'bigint') h = seed;
    else if (typeof seed === 'number') h = BigInt(Math.floor(seed));
    else if (typeof seed === 'string') {
      // Simple string to number hash (FNV-1a 64-bit-like)
      let v = 1469598103934665603n;
      for (let i = 0; i < seed.length; i++) {
        v ^= BigInt(seed.charCodeAt(i));
        v = (v * 1099511628211n) & MASK64;
      }
      h = v;
    } else {
      h = BigInt(Date.now());
    }
    // initialize with splitmix64
    let sm = h & MASK64;
    for (let i = 0; i < 4; i++) {
      this.s[i] = splitmix64(sm + BigInt(i));
    }
    // If all zeros, perturb
    if (this.s.every(v => v === 0n)) {
      this.s[0] = 0x0123456789ABCDEFn;
      this.s[1] = 0xFEDCBA9876543210n;
      this.s[2] = 0xF0E1D2C3B4A59687n;
      this.s[3] = 0x89ABCDEF01234567n;
    }
  }

  nextUint64() {
    // xoshiro256** output
    const result = rotl(this.s[1] * 5n & MASK64, 7) * 9n & MASK64;
    const t = (this.s[1] << 17n) & MASK64;

    this.s[2] ^= this.s[0];
    this.s[3] ^= this.s[1];
    this.s[1] ^= this.s[2];
    this.s[0] ^= this.s[3];

    this.s[2] ^= t;
    this.s[3] = rotl(this.s[3], 45);

    return result & MASK64;
  }

  // Return float in [0,1)
  nextDouble() {
    const u = this.nextUint64();
    // Convert to Number by taking top 53 bits
    // Use Math.pow(2, 53) because bitwise shift << is 32-bit in JS
    const top53 = Number(u >> 11n) / Math.pow(2, 53);
    return top53;
  }

  // integer in [min, max]
  nextInt(min = 0, max = 1) {
    min = Number(min); max = Number(max);
    if (max < min) [min, max] = [max, min];
    const range = BigInt(max - min + 1);
    const v = this.nextUint64();
    // reduce modulo range (range small in our use cases)
    const r = Number(v % range) + min;
    return r;
  }
}

const _globalPRNG = new Xoshiro256ss(Date.now());

export default {
  setSeed(seed) { _globalPRNG.seed(seed); },
  nextUint64() { return _globalPRNG.nextUint64(); },
  nextDouble() { return _globalPRNG.nextDouble(); },
  nextInt(min, max) { return _globalPRNG.nextInt(min, max); },
  // helper to create local PRNG instances
  create(seed) { return new Xoshiro256ss(seed); }
};
