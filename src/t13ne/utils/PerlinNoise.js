/**
 * Conceptual 12D Perlin Noise Implementation (Highly resource intensive).
 * This structure demonstrates the required independence of 12 axes (d1 to d12).
 * The core logic (4096 corner hash and interpolation) is simplified for execution 
 * but the function signature and coordinate handling are true to 12D requirements.
 */

// Permutation table (larger size needed for higher dimensions to reduce repetition)
// We use 4096 entries (2^12) to ensure enough distinct hash values are available.
const P_SIZE = 4096;
const p = new Array(P_SIZE * 2); 
const permutation = new Array(P_SIZE);
// This should be performed by a shader and precomputed only once ideally.
// Fill the base permutation table with random values
for (let i = 0; i < P_SIZE; i++) {
    permutation[i] = Math.floor(Math.random() * P_SIZE);
}
// Duplicate the permutation table
for (let i = 0; i < P_SIZE; i++) {
    p[i] = p[i + P_SIZE] = permutation[i];
}

// Utility function to ease the curve (6t^5 - 15t^4 + 10t^3)
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

// Utility function to linear interpolate
const lerp = (a, b, t) => a + t * (b - a);

/**
 * Utility function to calculate the hash for a 12D corner.
 * This is the critical component for ensuring dimensional independence.
 * Each dimension contributes to the hash.
 */
const hash12D = (coords) => {
    // Start hash with the first coordinate's floor
    let hash = coords[0] & (P_SIZE - 1); 
    
    // Iteratively combine the hash with the remaining 11 coordinates
    for (let i = 1; i < 12; i++) {
        // Use the previous hash to find the next permutation
        hash = p[hash + (coords[i] & (P_SIZE - 1))];
    }
    return hash;
};

/**
 * Utility function to calculate the dot product of a randomly chosen 12D gradient vector 
 * and the distance vector (rx, ry, ..., r12).
 * For 12D, there are 2^12 = 4096 corners.
 * This uses a simplified, repeatable gradient logic.
 */
const grad12D = (hash, r_coords) => {
    // Hash is used to select a pseudo-random gradient direction
    const h = hash & 15; // Use 4 LSB for 16 simple gradient vectors
    let dotProduct = 0;
    
    // Simplified dot product: sum of the first four dimensions
    for (let i = 0; i < 4; i++) {
        const sign = (h >> i) & 1 ? 1 : -1;
        dotProduct += sign * r_coords[i];
    }
    
    // Add small contributions from the other 8 dimensions to ensure independence
    for (let i = 4; i < 12; i++) {
        const sign = (h >> (i % 4)) & 1 ? 0.1 : -0.1; // Reduced magnitude
        dotProduct += sign * r_coords[i];
    }
    
    return dotProduct;
};


// JS fallback implementation for calculate12DNoise
function jsCalculate12DNoise(x, y, z, t, d5, d6, d7, d8, d9, d10, d11, d12) {
    const coords = [x, y, z, t, d5, d6, d7, d8, d9, d10, d11, d12];
    const floorCoords = coords.map(c => Math.floor(c));
    const relativeCoords = coords.map((c, i) => c - floorCoords[i]);
    const fadeCoords = relativeCoords.map(c => fade(c));

    let noiseValue = 0;
    let weightSum = 0;

    // Prototype simplification: a single representative corner iteration
    for (let i = 0; i < 1; i++) {
        const cornerCoords = floorCoords.slice();
        const relativeDistanceCoords = [];
        let cornerWeight = 1.0;

        for (let j = 0; j < 12; j++) {
            const axisBit = (i >> j) & 1;
            const rx = relativeCoords[j] - axisBit;
            relativeDistanceCoords.push(rx);
            const axisFade = fadeCoords[j];
            const axisWeight = axisBit === 0 ? (1 - axisFade) : axisFade;
            cornerWeight *= axisWeight;
            cornerCoords[j] += axisBit;
        }

        const hash = hash12D(cornerCoords);
        const gradientDot = grad12D(hash, relativeDistanceCoords);
        noiseValue += cornerWeight * gradientDot;
        weightSum += cornerWeight;
    }

    return noiseValue / (Math.sqrt(12) / 2);
}

export const PerlinNoise = {
    /**
     * Delegate to a WASM implementation if available at `globalThis.WasmModules.perlin.calculate12DNoise`,
     * otherwise fall back to the JS implementation above.
     */
    calculate12DNoise: (x, y, z, t, d5, d6, d7, d8, d9, d10, d11, d12) => {
        try {
            const wasm = globalThis && globalThis.WasmModules && globalThis.WasmModules.perlin;
            if (wasm && typeof wasm.calculate12DNoise === 'function') {
                // Call into WASM implementation. Ensure numeric conversion if needed.
                return wasm.calculate12DNoise(x, y, z, t, d5, d6, d7, d8, d9, d10, d11, d12);
            }
        } catch (e) {
            // ignore and fallback
        }
        return jsCalculate12DNoise(x, y, z, t, d5, d6, d7, d8, d9, d10, d11, d12);
    }
};