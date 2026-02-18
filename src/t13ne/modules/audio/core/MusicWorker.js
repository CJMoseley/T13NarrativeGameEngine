// src/t13ne/modules/audio/core/MusicWorker.js
import { ThemeGenerator } from './ThemeGenerator.js';
import { MusicRNG } from './MusicUtils.js';

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
            _freqFromNote: (note) => 440
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
    codex: mockCodexLoader
};

self.onmessage = async (e) => {
    const { type, data, requestId } = e.data;

    if (type !== 'init' && initPromise) {
        await initPromise;
    }

    try {
        if (type === 'init') {
            initPromise = (async () => {
                for (const [key, val] of Object.entries(data.codexData || {})) {
                    const parts = key.split(':');
                    const cat = parts[0];
                    const file = parts[1];
                    mockCodexLoader.setData(cat, file, val);
                }

                if (data.geometryData) {
                    mockMusicModule.geometry = {
                        RomanChords: data.geometryData.romanChords,
                        keys: data.geometryData.keys,
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
                if (data.performanceMode) themeGenerator.performanceMode = data.performanceMode;
                await themeGenerator.loadAssets();
            })();
            await initPromise;
            self.postMessage({ type: 'initialized', requestId });
        }
        else if (type === 'generateMainTheme') {
            if (!themeGenerator) throw new Error("ThemeGenerator not initialized in worker");

            const { activeComponents, forceRegeneration } = data;
            const track = await themeGenerator.createMainTheme(activeComponents, null, forceRegeneration);
            self.postMessage({ type: 'trackGenerated', track, requestId });
        }
        else if (type === 'generateWormholeTheme') {
            const { ship, origin, target } = data;
            const track = await themeGenerator.createWormholeTheme(ship, origin, target);
            self.postMessage({ type: 'trackGenerated', track, requestId });
        }
        else if (type === 'setPerformanceMode') {
            if (themeGenerator) themeGenerator.performanceMode = data;
            self.postMessage({ type: 'performanceModeSet', requestId });
        }
    } catch (error) {
        self.postMessage({ type: 'error', error: error.message, requestId });
    }
};
