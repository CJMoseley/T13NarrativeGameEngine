/**
 * @module Plugins/T13Ne/PRNG
 * @description
 * This module provides a seedable pseudo-random number generator (PRNG) using the xoshiro256** algorithm.
 * It's used for all random number generation in the T13NE plugin to ensure repeatability.
 */

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

/**
 * @class Xoshiro256ss
 * @description
 * A xoshiro256** pseudo-random number generator.
 */
class Xoshiro256ss {
  /**
   * @constructor
   * @param {string|number|bigint} [seed] - The seed for the generator.
   */
  constructor(seed) {
    this.s = [0n, 0n, 0n, 0n];
    if (seed === undefined) seed = Date.now();
    this.seed(seed);
  }

  /**
   * Seeds the generator.
   * @param {string|number|bigint} seed - The seed.
   */
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

  setSeed(seed) { this.seed(seed); }

  /**
   * Generates the next 64-bit unsigned integer.
   * @returns {bigint} The next random number.
   */
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

  /**
   * Returns the current state of the generator.
   * @returns {bigint[]}
   */
  getState() { return [...this.s]; }

  /**
   * Sets the state of the generator.
   * @param {bigint[]} s 
   */
  setState(s) { if (Array.isArray(s) && s.length === 4) this.s = [...s]; }

  /**
   * Generates a random integer in the range [min, max].
   * @param {number} [min=0] - The minimum value.
   * @param {number} [max=1] - The maximum value.
   * @returns {number} The next random integer.
   */
  nextInt(min = 0, max = 1) {
    min = Number(min); max = Number(max);
    if (max < min) [min, max] = [max, min];
    const range = BigInt(max - min + 1);
    const v = this.nextUint64();
    // reduce modulo range (range small in our use cases)
    const r = Number(v % range) + min;
    return r;
  }

  /**
   * Generates a random double in the range [0, 1).
   * @returns {number}
   */
  nextDouble() {
    return Number(this.nextUint64() >> 11n) / 9007199254740992;
  }

  /**
   * Returns a random float in range [0, 1) cast to 32-bit precision.
   * @returns {number}
   */
  nextFloat() {
    return Math.fround(this.nextDouble());
  }

  /**
   * Returns a random point on a sphere of given radius.
   * @param {number} radius 
   * @returns {{x: number, y: number, z: number}}
   */
  nextSpherePoint(radius = 1) {
    const u = this.nextDouble();
    const v = this.nextDouble();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(Math.max(-1, Math.min(1, 2 * v - 1)));
    const sinPhi = Math.sin(phi);
    return {
      x: Math.fround(radius * sinPhi * Math.cos(theta)),
      y: Math.fround(radius * sinPhi * Math.sin(theta)),
      z: Math.fround(radius * Math.cos(phi))
    };
  }
}

/**
 * @class Mulberry32
 * @description A fast, 32-bit seeded PRNG.
 */
class Mulberry32 {
  constructor(seed) {
    this.state = 0;
    this.seed(seed);
  }

  seed(seed) {
    let h;
    if (typeof seed === 'string') {
      h = 2166136261;
      for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
      }
    } else if (typeof seed === 'number') {
      h = seed | 0;
    } else {
      h = Date.now();
    }
    this.state = h >>> 0;
  }

  setSeed(seed) { this.seed(seed); }

  nextDouble() {
    this.state = (this.state + 0x6D2B79F5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) | 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min = 0, max = 1) {
    return Math.floor(this.nextDouble() * (max - min + 1)) + min;
  }

  nextFloat() {
    return Math.fround(this.nextDouble());
  }

  nextSpherePoint(radius = 1) {
    const u = this.nextDouble();
    const v = this.nextDouble();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    return {
      x: Math.fround(radius * Math.sin(phi) * Math.cos(theta)),
      y: Math.fround(radius * Math.sin(phi) * Math.sin(theta)),
      z: Math.fround(radius * Math.cos(phi))
    };
  }
}

const _globalPRNG = new Xoshiro256ss('t13ne-v1-master');
const _seedStack = [];

export default {
  setSeed(seed) { _globalPRNG.seed(seed); },
  nextUint64() { return _globalPRNG.nextUint64(); },
  nextDouble() { return _globalPRNG.nextDouble(); },
  nextInt(min, max) { return _globalPRNG.nextInt(min, max); },

  // State management
  getState() { return _globalPRNG.getState(); },
  setState(s) { _globalPRNG.setState(s); },

  /**
   * Pushes the current global state and re-seeds the generator.
   * Use popSeed() to restore.
   */
  pushSeed(seed) {
    _seedStack.push(_globalPRNG.getState());
    _globalPRNG.seed(seed);
  },

  /**
   * Restores the previous global state.
   */
  popSeed() {
    if (_seedStack.length > 0) {
      _globalPRNG.setState(_seedStack.pop());
    }
  },

  // helper to create local PRNG instances
  create(seed) { return new Xoshiro256ss(seed); },
  create32(seed) { return new Mulberry32(seed); },

  /**
   * Derives a new seed from a parent seed and one or more components.
   * Ensures a consistent and unpredictable derivation for hierarchical seeding.
   * @param {string|number|bigint} parentSeed
   * @param  {...(string|number|bigint)} components
   * @returns {string} A derived seed string.
   */
  deriveSeed(parentSeed, ...components) {
    let h = 1469598103934665603n;
    const mix = (val) => {
      let s = String(val);
      for (let i = 0; i < s.length; i++) {
        h ^= BigInt(s.charCodeAt(i));
        h = (h * 1099511628211n) & MASK64;
      }
    };
    mix(parentSeed);
    components.forEach(c => mix(c));
    return h.toString(16);
  }
};





