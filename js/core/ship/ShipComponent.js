/* LEGACY CODE - MOVED TO src/t13ne/core/

import * as THREE from 'three';

export class ShipComponent {
    constructor(type, position, rotation, scale, stats, sdfType = 'box', dims = {}, harmonics = {}) {
        this.type = type; // e.g., "box", "capsule"
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
        this.stats = stats; // JSON data for gameplay
        this.sdfType = sdfType; // Simplified shape for SDF math
        this.dims = dims;
        this.harmonics = harmonics; // Harmonic frequency response data
    }
}

*/