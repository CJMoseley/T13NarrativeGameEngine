// src/t13ne/modules/audio/core/MusicWorker.js
import { ThemeGenerator } from '/src/t13ne/modules/audio/core/ThemeGenerator.js';
import { MusicRNG } from '/src/t13ne/modules/audio/core/MusicUtils.js';

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
                const { codexData, geometryData, manifest, performanceMode } = data;

                for (const [key, val] of Object.entries(codexData || {})) {
                    const parts = key.split(':');
                    const cat = parts[0];
                    const file = parts[1];
                    mockCodexLoader.setData(cat, file, val);
                }

                if (manifest) {
                    mockMusicModule.manifestManager.manifest = manifest;
                }

                if (geometryData) {
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
                if (performanceMode) themeGenerator.performanceMode = performanceMode;
                await themeGenerator.loadAssets();
            })();
            await initPromise;
            self.postMessage({ type: 'initialized', requestId });
        }
        else if (type === 'generateMainTheme') {
            if (!themeGenerator) throw new Error("ThemeGenerator not initialized in worker");

            const { activeComponents, forceRegeneration, tensionLevel } = data;
            const track = await themeGenerator.createMainTheme(activeComponents, null, forceRegeneration, tensionLevel);
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
