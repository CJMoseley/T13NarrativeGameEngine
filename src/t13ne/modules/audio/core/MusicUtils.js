// src/t13ne/modules/audio/core/MusicUtils.js

export class MusicRNG {
    constructor(seed) {
        this.seed = this._hash(seed);
    }

    _hash(str) {
        let hash = 0;
        if (str === undefined || str === null) return hash;
        if (typeof str !== 'string') str = JSON.stringify(str);
        if (!str || str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    next() {
        // Mulberry32 PRNG
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    pick(array) {
        if (!array || array.length === 0) return null;
        return array[Math.floor(this.next() * array.length)];
    }

    range(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}
