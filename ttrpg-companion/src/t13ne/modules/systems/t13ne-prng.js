/**
 * @module Plugins/T13Ne/PRNG
 * @description
 * This module provides a seedable pseudo-random number generator (PRNG) using the xoshiro256** algorithm.
 * It now prioritizes the WASM implementation for performance and unification.
 */

import prngModule from '../../wasm/prng.js';

let wasmPRNG = null;
let _globalXoshiro = null;
const _seedStack = [];

async function initWasm() {
  if (wasmPRNG) return wasmPRNG;
  try {
    wasmPRNG = await prngModule();
    _globalXoshiro = new wasmPRNG.Xoshiro256ss('t13ne-v1-master');
    console.log('T13NE_PRNG: WASM module initialized.');
    return wasmPRNG;
  } catch (e) {
    console.warn('T13NE_PRNG: Failed to initialize WASM module, falling back to JS.', e);
    return null;
  }
}

// Ensure initialization starts immediately
const initPromise = initWasm();

// JS Fallback Implementations
const MASK64 = (1n << 64n) - 1n;
function rotl(x, k) { return ((x << BigInt(k)) | (x >> (64n - BigInt(k)))) & MASK64; }
function splitmix64(seed) {
  let z = (BigInt(seed) + 0x9E3779B97f4A7C15n) & MASK64;
  z = (z ^ (z >> 30n)) * 0xBF58476D1CE4E5B9n & MASK64;
  z = (z ^ (z >> 27n)) * 0x94D049BB133111EBn & MASK64;
  return (z ^ (z >> 31n)) & MASK64;
}

class JS_Xoshiro256ss {
  constructor(seed) { this.s = [0n, 0n, 0n, 0n]; this.seed(seed); }
  seed(seed) {
    let h;
    if (typeof seed === 'bigint') h = seed;
    else if (typeof seed === 'number') h = BigInt(Math.floor(seed));
    else if (typeof seed === 'string') {
      let v = 1469598103934665603n;
      for (let i = 0; i < seed.length; i++) {
        v ^= BigInt(seed.charCodeAt(i));
        v = (v * 1099511628211n) & MASK64;
      }
      h = v;
    } else h = BigInt(Date.now());
    let sm = h & MASK64;
    for (let i = 0; i < 4; i++) this.s[i] = splitmix64(sm + BigInt(i));
  }
  nextUint64() {
    const result = rotl(this.s[1] * 5n & MASK64, 7) * 9n & MASK64;
    const t = (this.s[1] << 17n) & MASK64;
    this.s[2] ^= this.s[0]; this.s[3] ^= this.s[1]; this.s[1] ^= this.s[2]; this.s[0] ^= this.s[3];
    this.s[2] ^= t; this.s[3] = rotl(this.s[3], 45);
    return result & MASK64;
  }
  nextDouble() { return Number(this.nextUint64() >> 11n) / 9007199254740992; }
  nextInt(min = 0, max = 1) {
    if (max < min) [min, max] = [max, min];
    const range = BigInt(max - min + 1);
    return Number(this.nextUint64() % range) + min;
  }
  getState() { return [...this.s]; }
  setState(s) { if (Array.isArray(s) && s.length === 4) this.s = [...s]; }
}

class JS_Mulberry32 {
    constructor(seed) {
        this.state = 0;
        this.seed(seed);
    }
    seed(seed) {
        let h;
        if (typeof seed === 'string') {
            h = 2166136261;
            for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
        } else if (typeof seed === 'number') h = seed | 0;
        else h = Date.now();
        this.state = h >>> 0;
    }
    nextDouble() {
        this.state = (this.state + 0x6D2B79F5) | 0;
        let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) | 0;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

const _fallbackXoshiro = new JS_Xoshiro256ss('t13ne-v1-master');

export default {
  async ready() { return initPromise; },
  setSeed(seed) {
    if (_globalXoshiro) _globalXoshiro.seed(String(seed));
    else _fallbackXoshiro.seed(seed);
  },
  nextUint64() {
    if (_globalXoshiro) return _globalXoshiro.nextUint64();
    return _fallbackXoshiro.nextUint64();
  },
  nextDouble() {
    if (_globalXoshiro) return _globalXoshiro.nextDouble();
    return _fallbackXoshiro.nextDouble();
  },
  nextInt(min, max) {
    if (_globalXoshiro) return _globalXoshiro.nextInt(min, max);
    return _fallbackXoshiro.nextInt(min, max);
  },
  getState() {
    if (_globalXoshiro) {
        const state = _globalXoshiro.getState();
        const res = [state.get(0), state.get(1), state.get(2), state.get(3)];
        state.delete();
        return res;
    }
    return _fallbackXoshiro.getState();
  },
  setState(s) {
    if (_globalXoshiro) {
        const vec = new wasmPRNG.VectorUint64();
        s.forEach(v => vec.push_back(v));
        _globalXoshiro.setState(vec);
        vec.delete();
    } else _fallbackXoshiro.setState(s);
  },
  pushSeed(seed) {
    _seedStack.push(this.getState());
    this.setSeed(seed);
  },
  popSeed() {
    if (_seedStack.length > 0) this.setState(_seedStack.pop());
  },
  create(seed) {
    if (wasmPRNG) return new wasmPRNG.Xoshiro256ss(String(seed));
    return new JS_Xoshiro256ss(seed);
  },
  create32(seed) {
    // Correctly handle hashing the seed for WASM constructor which expects uint32_t
    let h;
    if (typeof seed === 'string') {
        h = 2166136261;
        for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    } else if (typeof seed === 'number') h = seed | 0;
    else h = Date.now();

    if (wasmPRNG) return new wasmPRNG.Mulberry32(h >>> 0);
    return new JS_Mulberry32(seed);
  },
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
