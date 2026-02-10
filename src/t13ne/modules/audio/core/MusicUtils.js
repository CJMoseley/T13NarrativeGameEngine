// src/t13ne/modules/audio/core/MusicUtils.js

export class MusicRNG {
    constructor(seed) {
        this.seed = this._hash(seed);
    }

    _hash(str) {
        let hash = 0;
        if (typeof str !== 'string') str = JSON.stringify(str);
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    next() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    pick(array) {
        if (!array || array.length === 0) return null;
        return array[Math.floor(this.next() * array.length)];
    }

    range(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}
