// src/t13ne/modules/audio/core/MusicUtils.js
import PRNG from '../../systems/t13ne-prng.js';

export class MusicRNG {
    constructor(seed) {
        this._localPRNG = PRNG.create32(seed);
    }

    next() {
        return this._localPRNG.nextDouble();
    }

    pick(array) {
        if (!array || array.length === 0) return null;
        return array[Math.floor(this.next() * array.length)];
    }

    range(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}
