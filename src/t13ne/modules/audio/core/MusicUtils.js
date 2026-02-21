// src/t13ne/modules/audio/core/MusicUtils.js

import PRNG from '/src/t13ne/modules/systems/t13ne-prng.js';

export class MusicRNG {
    constructor(seed) {
        this.engine = PRNG.create32(seed);
    }

    next() {
        return this.engine.nextDouble();
    }

    pick(array) {
        if (!array || array.length === 0) return null;
        return array[Math.floor(this.next() * array.length)];
    }

    range(min, max) {
        return this.engine.nextInt(min, max);
    }
}
