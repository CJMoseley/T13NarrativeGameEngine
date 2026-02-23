// Module worker that computes per-segment wormhole samples using existing PerlinNoise implementation.
import workerpool from 'workerpool';
import { PerlinNoise } from '/src/t13ne/utils/PerlinNoise.js';
import { ColourUtils } from '/src/t13ne/utils/ColourUtils.js';

async function computeSamples(task) {
    const segments = task.segments || 32;
    const radii = new Float32Array(segments);
    const colors = new Float32Array(segments * 3);

    const start = task.startPoint;
    const end = task.endPoint;
    const freqs = task.freqs || { f1: 300, f2: 400, f3: 150, f4: 250 };
    const env = task.env || { techLevel: 15, criminality: 0.2, localColourFreq: 600.0, darkMatter: 0.05 };
    const baseRadius = task.baseRadius || 20;
    const timeOffset = task.timeOffset || 0;

    for (let i = 0; i < segments; i++) {
        const t = segments === 1 ? 0 : i / (segments - 1);
        const center = {
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t,
            z: start.z + (end.z - start.z) * t
        };

        const d1 = center.x * 0.01;
        const d2 = center.y * 0.01;
        const d3 = center.z * 0.01;
        const d4 = timeOffset * 0.1;
        const d5 = freqs.f1;
        const d6 = freqs.f2;
        const d7 = freqs.f3;
        const d8 = freqs.f4;
        const d9 = env.techLevel;
        const d10 = env.criminality;
        const d11 = env.localColourFreq;
        const d12 = env.darkMatter;

        const rawNoise = PerlinNoise.calculate12DNoise(d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12);
        const radiusFactor = 1.0 + rawNoise * 0.5;
        const radius = baseRadius * radiusFactor;
        radii[i] = radius;

        const hex = ColourUtils.curvedFrequencyToHex(env.localColourFreq + rawNoise * 100);
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        colors[i * 3 + 0] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
    }

    let digestHex = null;
    try {
        const buf = radii.buffer;
        const hash = await crypto.subtle.digest('SHA-256', buf);
        const hashArray = Array.from(new Uint8Array(hash));
        digestHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        digestHex = 'nodigest';
    }

    return {
        taskId: task.taskId,
        radii: Array.from(radii),
        colors: Array.from(colors),
        digest: digestHex,
        size: radii.length
    };
}

// create a worker and register public functions
workerpool.worker({
    computeSamples: computeSamples
});
