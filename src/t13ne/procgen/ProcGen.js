import PRNG from "../modules/systems/t13ne-prng.js";

// --- Noise Constants and Utility Functions ---
const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
const F3 = 1.0 / 3.0;
const G3 = 1.0 / 6.0;
const F4 = (Math.sqrt(5.0) - 1.0) / 4.0;
const G4 = (5.0 - Math.sqrt(5.0)) / 20.0;

const grad3 = new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1]);
const grad4 = new Float32Array([0, 1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1, 0, -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1, 1, 0, 1, 1, 1, 0, 1, -1, 1, 0, -1, 1, 1, 0, -1, -1, -1, 0, 1, 1, -1, 0, 1, -1, -1, 0, -1, 1, -1, 0, -1, -1, 1, 1, 0, 1, 1, 1, 0, -1, 1, -1, 0, 1, 1, -1, 0, -1, -1, 1, 0, 1, -1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, -1, 1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1, 0, -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1, 0]);

/**
 * Builds a permutation table for noise generation.
 * @param {object} prng The PRNG instance to use.
 * @returns {Uint8Array} The permutation table.
 */
function buildPermutationTable(prng) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
        p[i] = i;
    }
    for (let i = 0; i < 255; i++) {
        const r = i + prng.nextInt(0, 256 - i - 1);
        const aux = p[i];
        p[i] = p[r];
        p[r] = aux;
    }
    return p;
}

/**
 * @class ProcGen
 * @description Main class for procedural generation.
 */
class ProcGen {
    /**
     * @param {number|string|bigint|null} seed The seed for the main PRNG. If null, uses global PRNG.
     */
    constructor(seed = null) {
        this.prng = seed ? PRNG.create(seed) : PRNG;
        this.p = buildPermutationTable(this.prng);
        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }
    }

    /**
     * Reseeds the main PRNG and rebuilds the permutation table.
     * @param {number|string|bigint} seed The seed to use.
     */
    setSeed(seed) {
        this.prng.setSeed(seed);
        this.p = buildPermutationTable(this.prng);
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }
    }

    /**
     * Creates a new, independent PRNG instance.
     * @param {number|string|bigint} seed The seed for the new PRNG.
     * @returns {object} A new PRNG instance.
     */
    createPRNG(seed) {
        return PRNG.create(seed);
    }

    /**
     * Creates a new, independent 32-bit PRNG instance (Mulberry32).
     * @param {number|string} seed The seed for the new PRNG.
     * @returns {object} A new PRNG instance.
     */
    create32PRNG(seed) {
        return PRNG.create32(seed);
    }

    /**
     * Synchronizes the internal permutation table with the PRNG's current sequence.
     * Call this after a pushSeed() to ensure noise functions follow the new seed.
     */
    sync() {
        this.p = buildPermutationTable(this.prng);
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }
    }

    /**
     * @returns {number} The next float from the main PRNG, in the range [0, 1).
     */
    nextDouble() {
        return this.prng.nextDouble();
    }

    /**
     * @param {number} min The minimum integer value (inclusive).
     * @param {number} max The maximum integer value (inclusive).
     * @returns {number} The next integer from the main PRNG, in the specified range.
     */
    nextInt(min, max) {
        return this.prng.nextInt(min, max);
    }

    /**
     * Returns a random float in range [0, 1) cast to 32-bit precision.
     * Useful for ensuring compatibility with WebGL buffers and preventing precision drift.
     * @returns {number}
     */
    nextFloat() {
        return this.prng.nextFloat();
    }

    /**
     * Returns a random point on a sphere of given radius.
     * Handles the spherical distribution correctly and safely to avoid NaNs.
     * @param {number} radius The radius of the sphere.
     * @returns {{x: number, y: number, z: number}} The point coordinates.
     */
    nextSpherePoint(radius) {
        return this.prng.nextSpherePoint(radius);
    }

    // --- Simplex Noise Methods ---
    simplex2D(xin, yin) {
        let n0 = 0, n1 = 0, n2 = 0;
        const s = (xin + yin) * F2;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = xin - X0;
        const y0 = yin - Y0;
        let i1, j1;
        if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2;
        const y2 = y0 - 1.0 + 2.0 * G2;
        const ii = i & 255;
        const jj = j & 255;
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) {
            const gi0 = this.permMod12[ii + this.perm[jj]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0);
        }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) {
            const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
        }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) {
            const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
        }
        return 70.0 * (n0 + n1 + n2);
    }

    simplex3D(xin, yin, zin) {
        let n0, n1, n2, n3;
        const s = (xin + yin + zin) * F3;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const k = Math.floor(zin + s);
        const t = (i + j + k) * G3;
        const X0 = i - t;
        const Y0 = j - t;
        const Z0 = k - t;
        const x0 = xin - X0;
        const y0 = yin - Y0;
        const z0 = zin - Z0;
        let i1, j1, k1;
        let i2, j2, k2;
        if (x0 >= y0) {
            if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
            else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
            else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
        } else {
            if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
            else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
            else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
        }
        const x1 = x0 - i1 + G3;
        const y1 = y0 - j1 + G3;
        const z1 = z0 - k1 + G3;
        const x2 = x0 - i2 + 2.0 * G3;
        const y2 = y0 - j2 + 2.0 * G3;
        const z2 = z0 - k2 + 2.0 * G3;
        const x3 = x0 - 1.0 + 3.0 * G3;
        const y3 = y0 - 1.0 + 3.0 * G3;
        const z3 = z0 - 1.0 + 3.0 * G3;
        const ii = i & 255;
        const jj = j & 255;
        const kk = k & 255;
        let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if (t0 < 0) n0 = 0.0;
        else {
            const gi0 = this.permMod12[ii + this.perm[jj + this.perm[kk]]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
        }
        let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if (t1 < 0) n1 = 0.0;
        else {
            const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
        }
        let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if (t2 < 0) n2 = 0.0;
        else {
            const gi2 = this.permMod12[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
        }
        let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if (t3 < 0) n3 = 0.0;
        else {
            const gi3 = this.permMod12[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] * 3;
            t3 *= t3;
            n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
        }
        return 32.0 * (n0 + n1 + n2 + n3);
    }

    simplex4D(x, y, z, w) {
        let n0, n1, n2, n3, n4;
        const s = (x + y + z + w) * F4;
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        const k = Math.floor(z + s);
        const l = Math.floor(w + s);
        const t = (i + j + k + l) * G4;
        const X0 = i - t;
        const Y0 = j - t;
        const Z0 = k - t;
        const W0 = l - t;
        const x0 = x - X0;
        const y0 = y - Y0;
        const z0 = z - Z0;
        const w0 = w - W0;
        let rankx = 0;
        let ranky = 0;
        let rankz = 0;
        let rankw = 0;
        if (x0 > y0) rankx++; else ranky++;
        if (x0 > z0) rankx++; else rankz++;
        if (x0 > w0) rankx++; else rankw++;
        if (y0 > z0) ranky++; else rankz++;
        if (y0 > w0) ranky++; else rankw++;
        if (z0 > w0) rankz++; else rankw++;
        const i1 = rankx >= 3 ? 1 : 0;
        const j1 = ranky >= 3 ? 1 : 0;
        const k1 = rankz >= 3 ? 1 : 0;
        const l1 = rankw >= 3 ? 1 : 0;
        const i2 = rankx >= 2 ? 1 : 0;
        const j2 = ranky >= 2 ? 1 : 0;
        const k2 = rankz >= 2 ? 1 : 0;
        const l2 = rankw >= 2 ? 1 : 0;
        const i3 = rankx >= 1 ? 1 : 0;
        const j3 = ranky >= 1 ? 1 : 0;
        const k3 = rankz >= 1 ? 1 : 0;
        const l3 = rankw >= 1 ? 1 : 0;
        const x1 = x0 - i1 + G4;
        const y1 = y0 - j1 + G4;
        const z1 = z0 - k1 + G4;
        const w1 = w0 - l1 + G4;
        const x2 = x0 - i2 + 2.0 * G4;
        const y2 = y0 - j2 + 2.0 * G4;
        const z2 = z0 - k2 + 2.0 * G4;
        const w2 = w0 - l2 + 2.0 * G4;
        const x3 = x0 - i3 + 3.0 * G4;
        const y3 = y0 - j3 + 3.0 * G4;
        const z3 = z0 - k3 + 3.0 * G4;
        const w3 = w0 - l3 + 3.0 * G4;
        const x4 = x0 - 1.0 + 4.0 * G4;
        const y4 = y0 - 1.0 + 4.0 * G4;
        const z4 = z0 - 1.0 + 4.0 * G4;
        const w4 = w0 - 1.0 + 4.0 * G4;
        const ii = i & 255;
        const jj = j & 255;
        const kk = k & 255;
        const ll = l & 255;
        let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
        if (t0 < 0) n0 = 0.0;
        else {
            const gi0 = (this.perm[ii + this.perm[jj + this.perm[kk + this.perm[ll]]]] % 32) * 4;
            t0 *= t0;
            n0 = t0 * t0 * (grad4[gi0] * x0 + grad4[gi0 + 1] * y0 + grad4[gi0 + 2] * z0 + grad4[gi0 + 3] * w0);
        }
        let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
        if (t1 < 0) n1 = 0.0;
        else {
            const gi1 = (this.perm[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1 + this.perm[ll + l1]]]] % 32) * 4;
            t1 *= t1;
            n1 = t1 * t1 * (grad4[gi1] * x1 + grad4[gi1 + 1] * y1 + grad4[gi1 + 2] * z1 + grad4[gi1 + 3] * w1);
        }
        let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
        if (t2 < 0) n2 = 0.0;
        else {
            const gi2 = (this.perm[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2 + this.perm[ll + l2]]]] % 32) * 4;
            t2 *= t2;
            n2 = t2 * t2 * (grad4[gi2] * x2 + grad4[gi2 + 1] * y2 + grad4[gi2 + 2] * z2 + grad4[gi2 + 3] * w2);
        }
        let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
        if (t3 < 0) n3 = 0.0;
        else {
            const gi3 = (this.perm[ii + i3 + this.perm[jj + j3 + this.perm[kk + k3 + this.perm[ll + l3]]]] % 32) * 4;
            t3 *= t3;
            n3 = t3 * t3 * (grad4[gi3] * x3 + grad4[gi3 + 1] * y3 + grad4[gi3 + 2] * z3 + grad4[gi3 + 3] * w3);
        }
        let t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
        if (t4 < 0) n4 = 0.0;
        else {
            const gi4 = (this.perm[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1 + this.perm[ll + 1]]]] % 32) * 4;
            t4 *= t4;
            n4 = t4 * t4 * (grad4[gi4] * x4 + grad4[gi4 + 1] * y4 + grad4[gi4 + 2] * z4 + grad4[gi4 + 3] * w4);
        }
        return 27.0 * (n0 + n1 + n2 + n3 + n4);
    }

    // --- Perlin Noise Methods ---
    perlin2D(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        const u = this._fade(x);
        const v = this._fade(y);
        const A = this.perm[X] + Y;
        const B = this.perm[X + 1] + Y;
        return this._lerp(v, this._lerp(u, this._grad(this.perm[A], x, y), this._grad(this.perm[B], x - 1, y)), this._lerp(u, this._grad(this.perm[A + 1], x, y - 1), this._grad(this.perm[B + 1], x - 1, y - 1)));
    }

    perlin3D(x, y, z) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        const u = this._fade(x);
        const v = this._fade(y);
        const w = this._fade(z);
        const A = this.perm[X] + Y;
        const AA = this.perm[A] + Z;
        const AB = this.perm[A + 1] + Z;
        const B = this.perm[X + 1] + Y;
        const BA = this.perm[B] + Z;
        const BB = this.perm[B + 1] + Z;
        return this._lerp(w, this._lerp(v, this._lerp(u, this._grad(this.perm[AA], x, y, z), this._grad(this.perm[BA], x - 1, y, z)), this._lerp(u, this._grad(this.perm[AB], x, y - 1, z), this._grad(this.perm[BB], x - 1, y - 1, z))), this._lerp(v, this._lerp(u, this._grad(this.perm[AA + 1], x, y, z - 1), this._grad(this.perm[BA + 1], x - 1, y, z - 1)), this._lerp(u, this._grad(this.perm[AB + 1], x, y - 1, z - 1), this._grad(this.perm[BB + 1], x - 1, y - 1, z - 1))));
    }

    _fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    _lerp(t, a, b) { return a + t * (b - a); }
    _grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    // --- Worley Noise ---
    worley2D(x, y) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;

        let minDist = 1.0;
        for (let j = -1; j <= 1; j++) {
            for (let i = -1; i <= 1; i++) {
                const prng = this.createPRNG((ix + i) + "," + (iy + j));
                const rx = i + prng.nextDouble();
                const ry = j + prng.nextDouble();
                const d = Math.sqrt(Math.pow(rx - fx, 2) + Math.pow(ry - fy, 2));
                if (d < minDist) {
                    minDist = d;
                }
            }
        }
        return minDist;
    }

    worley3D(x, y, z) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const iz = Math.floor(z);
        const fx = x - ix;
        const fy = y - iy;
        const fz = z - iz;

        let minDist = 1.0;
        for (let k = -1; k <= 1; k++) {
            for (let j = -1; j <= 1; j++) {
                for (let i = -1; i <= 1; i++) {
                    const prng = this.createPRNG((ix + i) + "," + (iy + j) + "," + (iz + k));
                    const rx = i + prng.nextDouble();
                    const ry = j + prng.nextDouble();
                    const rz = k + prng.nextDouble();
                    const d = Math.sqrt(Math.pow(rx - fx, 2) + Math.pow(ry - fy, 2) + Math.pow(rz - fz, 2));
                    if (d < minDist) {
                        minDist = d;
                    }
                }
            }
        }
        return minDist;
    }

    // --- FBM ---
    fbm2D(x, y, octaves = 6, lacunarity = 2.0, gain = 0.5) {
        let total = 0;
        let frequency = 1.0;
        let amplitude = 1.0;
        let maxValue = 0;
        for (let i = 0; i < octaves; i++) {
            total += this.simplex2D(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= gain;
            frequency *= lacunarity;
        }
        return total / maxValue;
    }

    fbm3D(x, y, z, octaves = 6, lacunarity = 2.0, gain = 0.5) {
        let total = 0;
        let frequency = 1.0;
        let amplitude = 1.0;
        let maxValue = 0;
        for (let i = 0; i < octaves; i++) {
            total += this.simplex3D(x * frequency, y * frequency, z * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= gain;
            frequency *= lacunarity;
        }
        return total / maxValue;
    }

    // --- 12D Noise ---
    noise12D(coords, dimensions = [0, 1, 2, 3], rotation = [0, 0, 0, 0, 0, 0]) {
        const c = dimensions.map(d => coords[d]);
        // simple rotation for now, can be expanded
        const x = c[0] * Math.cos(rotation[0]) - c[1] * Math.sin(rotation[0]);
        const y = c[0] * Math.sin(rotation[0]) + c[1] * Math.cos(rotation[0]);
        const z = c[2] * Math.cos(rotation[1]) - c[3] * Math.sin(rotation[1]);
        const w = c[2] * Math.sin(rotation[1]) + c[3] * Math.cos(rotation[1]);
        return this.simplex4D(x, y, z, w);
    }
}

export default new ProcGen(null);
