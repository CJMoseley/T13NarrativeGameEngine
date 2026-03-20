// src/t13ne/modules/audio/core/MusicWorker.js
import workerpool from 'workerpool';
import { ThemeGenerator } from '/src/t13ne/modules/audio/core/ThemeGenerator.js';
import { MusicRNG } from '/src/t13ne/modules/audio/core/MusicUtils.js';
import WasmManager from '/src/t13ne/wasm/WasmManager.js';
import PRNG from '/src/t13ne/modules/systems/t13ne-prng.js';

let themeGenerator = null;
let initPromise = null;

const mockCodexLoader = {
    dataCache: new Map(),
    async getData(category, file) {
        const key = `${category}/${file}`;
        return this.dataCache.get(key) || null;
    },
    setData(category, file, data) {
        const key = `${category}/${file}`;
        this.dataCache.set(key, data);
    }
};

const mockMusicModule = {
    synth: {
        instrumentEngine: {
            instruments: new Map(),
            samples: new Map(),
            _freqFromNote: (note) => 440,
            createSyntheticInstrument: (sourceId, newId, depth, envelope, role) => {
                mockMusicModule.synth.instrumentEngine.instruments.set(newId, {
                    type: 'additive',
                    envelope: envelope,
                    role: role,
                    partials: []
                });
                return newId;
            },
            defineInstrument: (id, def) => {
                mockMusicModule.synth.instrumentEngine.instruments.set(id, def);
            }
        },
        ctx: { currentTime: 0, sampleRate: 44100 },
        pruneChannels: () => {}
    },
    manifestManager: {
        manifest: { samples: {} },
        getAssetAnalysis: () => null,
        getAssetPath: () => null
    },
    geometry: null,
    codex: mockCodexLoader,
    loadSample: async (id, url) => {
        // Mock loadSample to prevent crash in ThemeGenerator
        return false; 
    }
};

async function init(data) {
    initPromise = (async () => {
        const { codexData, geometryData, manifest, performanceMode } = data;

        await WasmManager.initialize();
        await PRNG.ready();

        for (const [key, val] of Object.entries(codexData || {})) {
            const parts = key.split(':');
            const cat = parts[0];
            const file = parts[1];
            mockCodexLoader.setData(cat, file, val);
        }

        if (manifest) {
            mockMusicModule.manifestManager.manifest.samples = manifest.samples || {};
            mockMusicModule.manifestManager.manifest.instruments = manifest.instruments || {};
        }

        if (geometryData) {
            mockMusicModule.geometry = {
                RomanChords: geometryData.romanChords,
                keys: geometryData.keys,
                getKey: function(tone) {
                    let t = Number(tone);
                    const toneInt = Math.trunc(t);
                    const noteIndex = toneInt % 12;
                    const octave = Math.floor(toneInt / 12);

                    const baseKey = this.keys[noteIndex] || { Key: 'C', Frequency: 261.63 };
                    const octaveOffset = octave - 4;
                    const freq = (baseKey.Frequency || 261.63) * Math.pow(2, octaveOffset);

                    return {
                        Key: { ...baseKey, Frequency: freq },
                        KeyNo: octave,
                        T13NEDescription: baseKey.T13NEDescription || ''
                    };
                },
                calculateFullGeo: function(name) {
                    return {
                        name: name,
                        GeometryNumber: 1,
                        GeoHarmonics: {
                            key: 1,
                            Harmonic: [1, 3, 5, 8],
                            corrected: [0, 4, 7],
                            Ghost: 1,
                            Perfect: 1,
                            Nemesis: 2
                        },
                        Soul: 1,
                        Facade: 1,
                        Nascent: 1
                    };
                }
            };
        }

        themeGenerator = new ThemeGenerator(mockMusicModule);
        if (performanceMode) themeGenerator.performanceMode = performanceMode;
        await themeGenerator.loadAssets();
        console.log('[MusicWorker] ThemeGenerator assets loaded.');
    })();
    await initPromise;
    console.log('[MusicWorker] Initialization complete.');
    return { status: 'initialized' };
}

async function generateMainTheme(data) {
    console.log('[MusicWorker] generateMainTheme called.');
    if (initPromise) await initPromise;
    if (!themeGenerator) throw new Error("ThemeGenerator not initialized in worker");

    const { activeComponents, forceRegeneration, tensionLevel } = data;
    console.log(`[MusicWorker] Generating theme with ${activeComponents ? activeComponents.length : 0} components.`);
    const track = await themeGenerator.createMainTheme(activeComponents, null, forceRegeneration, tensionLevel);
    console.log('[MusicWorker] Theme generated:', track ? track.name : 'null');
    return track;
}

async function generateWormholeTheme(data) {
    if (initPromise) await initPromise;
    const { ship, origin, target } = data;
    const track = await themeGenerator.createWormholeTheme(ship, origin, target);
    return track;
}

function setPerformanceMode(data) {
    if (themeGenerator) themeGenerator.performanceMode = data;
    return { success: true };
}

// create a worker and register public functions
workerpool.worker({
    init,
    generateMainTheme,
    generateWormholeTheme,
    setPerformanceMode
});
