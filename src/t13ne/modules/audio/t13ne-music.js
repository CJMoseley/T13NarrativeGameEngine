import Logger from "/src/t13ne/core/Logger.js";
import T13NE from '/src/t13ne/T13NE.js';
import CodexLoader from "/src/t13ne/modules/codex/CodexLoader.js";
import { InstrumentEngine } from "/src/t13ne/modules/audio/t13ne-InstrumentEngine.js";
import { AudioAnalyzer } from "/src/t13ne/modules/audio/t13ne-audio-analyzer.js";
import { ThemeGenerator } from "/src/t13ne/modules/audio/core/ThemeGenerator.js";
import { AudioManifestManager } from "/src/t13ne/modules/audio/core/AudioManifestManager.js";
import { T13Synth } from "/src/t13ne/modules/audio/core/T13Synth.js";

/**
 * T13NE Music Module
 * Procedurally generates music based on Character Geometry and Narrative Arcs.
 */
class T13NE_Music {
    constructor() {
        this.t13ne = null;
        this.worker = null;
        this.geometry = null;
        this.soundEngine = null;
        this.synth = null;
        this.initialized = false;
        this.tonalModes = [];
        this.compositionCache = new Map();
        this.musicPack = null;
        this.currentLayers = new Set();
        this.lastTension = -1;
        this.themeComponents = {};
        this.activeComponents = [];
        this.currentTrackName = null;
        this.currentTrack = null; // Store active track object for live updates
        this.currentStep = 0;
        this.trackCache = new Map(); // Cache for generated tracks to prevent hitches

        this.manifestManager = new AudioManifestManager();
        this.themeGenerator = new ThemeGenerator(this);
        this.useWorker = true;
    }

    async initialize(t13ne) {
        if (this.initialized) {
            if (this.synth) this.synth.stopAll(true); // Hard stop on re-init
            return;
        }
        this.t13ne = t13ne;
        this.geometry = t13ne.getModule('T13Geometry');
        this.soundEngine = t13ne.soundEngine;

        await this.manifestManager.loadManifest();

        let ctx = this.soundEngine?.audioContext;
        let output = this.soundEngine?.masterGain;

        if (!ctx) {
            Logger.message("T13NE_Music: Legacy SoundEngine context missing. Initializing independent AudioContext.");
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
                output = ctx.destination;

                // Ensure we have a soundEngine object to hold the context for other modules (like AudioDirector)
                if (!this.soundEngine) this.soundEngine = {};
                this.soundEngine.audioContext = ctx;
                this.soundEngine.masterGain = output;
            } catch (e) {
                Logger.error("T13NE_Music: Failed to create AudioContext.", e);
            }
        }

        if (ctx) {
            this.synth = new T13Synth(ctx, output);
            this.synth.instrumentEngine.manifestManager = this.manifestManager;

            // Enable runtime analysis only if in Author Mode (detected by URL or explicit author mode flags)
            const isAuthorMode = window.location.pathname.includes('t13ne-control-panel.html') ||
                window.location.pathname.includes('proficiency-manager.html') ||
                window.location.search.includes('author=true');

            if (isAuthorMode) {
                this.synth.instrumentEngine.allowRuntimeAnalysis = true;
                Logger.message("T13NE_Music: Author Mode detected. Runtime analysis enabled.");
            }

            await this.synth.instrumentEngine.init();

            const config = this.t13ne.getConfig().audio || {};
            this.synth.setMusicVolume(config.musicVolume !== undefined ? config.musicVolume : 0.4); // Safer orchestral default
            this.synth.setSFXVolume(config.sfxVolume !== undefined ? config.sfxVolume : 0.8);
            this.synth.setDialogueVolume(config.dialogueVolume !== undefined ? config.dialogueVolume : 1.0);
        } else {
            Logger.warn("T13NE_Music: No AudioContext available. Playback disabled.");
        }

        this.tonalModes = await CodexLoader.getData('geometry', 'tonalModes.json') || [];
        await this.themeGenerator.loadAssets();

        if (this.useWorker) {
            this.initWorker();
        }

        this.initialized = true;
        Logger.message("T13NE_Music: Initialized.");

        this._registerStandardInstruments();
        await this._generateOrchestralInstruments();
    }

    /**
     * Triggers the AudioBaker to analyze all samples in the manifest.
     * Intended for Author Mode.
     */
    async bakeAssets() {
        if (!this.synth) return;
        this.synth.instrumentEngine.allowRuntimeAnalysis = true;
        const analyzer = new AudioAnalyzer(this.synth.ctx);
        await analyzer.processManifest(this.manifestManager);
    }

    _registerStandardInstruments() {
        if (!this.synth) return;
        const engine = this.synth.instrumentEngine;

        // Standard placeholders (will be replaced by manifest samples if available)
        engine.defineInstrument('Drum_Kick', { type: 'synth', oscType: 'sine', pitchEnv: { startMult: 4.0, time: 0.1 }, attack: 0.001, release: 0.2 });
        engine.defineInstrument('Drum_Snare', { type: 'noise', filterType: 'lowpass', filterFreq: 2000, envelope: 'percussive', decay: 0.2 });
        engine.defineInstrument('Drum_HiHat_Closed', { type: 'noise', filterType: 'highpass', filterFreq: 5000, envelope: 'percussive', decay: 0.05 });
        engine.defineInstrument('Drum_Cowbell', { type: 'additive', partials: [{ freq: 1, amp: 1 }, { freq: 1.5, amp: 0.5 }], envelope: 'percussive', decay: 0.1 });

        engine.defineInstrument('Synth_Bass', { type: 'additive', isHarmonic: true, envelope: 'sustained', sustain: 0.7, partials: [{ freq: 1, amp: 1 }, { freq: 2, amp: 0.6 }, { freq: 3, amp: 0.4 }, { freq: 4, amp: 0.2 }, { freq: 5, amp: 0.1 }] });
        engine.defineInstrument('Synth_Lead', { type: 'additive', isHarmonic: true, envelope: 'percussive', partials: [{ freq: 1, amp: 1 }, { freq: 2, amp: 0.5 }, { freq: 3, amp: 0.4 }, { freq: 4, amp: 0.3 }, { freq: 5, amp: 0.2 }, { freq: 6, amp: 0.15 }] });
        engine.defineInstrument('Synth_Pad', { type: 'additive', isHarmonic: true, envelope: 'sustained', sustain: 0.9, attack: 1.0, release: 2.0, partials: [{ freq: 1, amp: 1 }, { freq: 1.002, amp: 0.8 }, { freq: 1.998, amp: 0.5 }, { freq: 3.003, amp: 0.2 }] });

        // FX-Rich Instruments
        engine.defineInstrument('Synth_WarpLead', {
            type: 'additive',
            envelope: 'percussive',
            partials: [{ freq: 1, amp: 1 }, { freq: 1.5, amp: 0.5 }, { freq: 2, amp: 0.2 }],
            effects: [
                { type: 'distortion', amount: 40 },
                { type: 'phaser', stages: 8, rate: 0.5, feedback: 0.7 }
            ]
        });

        engine.defineInstrument('Synth_SpacePad', {
            type: 'additive',
            envelope: 'sustained',
            sustain: 0.9,
            attack: 1.0,
            partials: [{ freq: 1, amp: 1 }, { freq: 2, amp: 0.3 }],
            effects: [
                { type: 'reverb', duration: 2.5, decay: 3.5 },
                { type: 'chorus', rate: 0.5, depth: 5.0, delay: 0.04 }
            ]
        });
    }

    async _generateOrchestralInstruments() {
        if (!this.synth) return;

        const mappings = {
            'Cello': 'samples/pad_acoustic/low_string',
            'Violin': 'samples/pad_acoustic/hi_string',
            'Viola': 'samples/pad_acoustic/mid_string',
            'Flute': 'samples/melody_acoustic/flute_c1',
            'Trumpet': 'samples/melody_acoustic/trumpet_solo',
            'French Horn': 'samples/melody_acoustic/brite_horn',
            'Clarinet': 'samples/melody_acoustic/clarinet_c1',
            'Piano': 'samples/melody_acoustic/piano_c4',
            'Harp': 'samples/melody_acoustic/harp'
        };

        for (const [instName, sampleId] of Object.entries(mappings)) {
            await this.themeGenerator._ensureInstrumentDefined(sampleId, instName, 'sustained');
        }
    }

    async loadSample(name, url) {
        if (this.synth) {
            const success = await this.synth.instrumentEngine.loadSample(name, url);
            if (success) {
                this.manifestManager.addToManifest('samples', name, { filename: url.split('/').pop(), loaded: true });
                return true;
            }
        }
        return false;
    }

    async analyzeSample(id, options = {}) {
        if (!this.synth) return null;
        const buffer = this.synth.instrumentEngine.samples.get(id);
        if (!buffer) {
            Logger.warn(`T13NE_Music: Sample '${id}' not loaded in memory for analysis.`);
            return null;
        }

        const analyzer = new AudioAnalyzer(this.synth.ctx);
        const analysis = await analyzer.analyze(buffer, options);
        return analysis;
    }

    saveAnalysis(id, analysis, asNew = false) {
        if (asNew) {
            const newId = `_syn`;
            const original = this.manifestManager.manifest.samples[id];
            const entry = { ...original, analysis: analysis, type: 'synthetic', sourceId: id };
            this.manifestManager.addToManifest('samples', newId, entry);
            Logger.message(`T13NE_Music: Saved new synthetic instrument ''`);
        } else {
            this.manifestManager.updateAssetAnalysis('samples', id, analysis);
            Logger.message(`T13NE_Music: Updated analysis for ''`);
        }
    }

    injectThemeComponents(components) {
        let changed = false;
        Object.values(components).forEach(entity => {
            if (!entity) return;

            const existingIndex = this.activeComponents.findIndex(c => c.name === entity.name);
            if (existingIndex !== -1) {
                const existing = this.activeComponents.splice(existingIndex, 1)[0];
                this.activeComponents.push({ ...existing, lastUpdate: Date.now() });
            } else {
                this.activeComponents.push({ ...entity, lastUpdate: Date.now() });
                changed = true;
            }
        });

        if (this.activeComponents.length > 5) {
            this.activeComponents.shift();
            changed = true;
        }

        if (changed) {
            this.needsRegeneration = true;
        }
        Logger.message(`T13NE_Music: Active components updated. Focal Influence: ${this.activeComponents[this.activeComponents.length - 1].name}`);
    }

    async createMainTheme(gameEngine) {
        if (!this.synth) return;

        const tensionModule = this.t13ne ? this.t13ne.getModule('Tension') : null;
        const currentTension = tensionModule ? tensionModule.getTensionLevel() : (this.lastTension >= 0 ? this.lastTension : 2);

        // Generate a unique hash for the current components to enable caching
        const componentHash = this.activeComponents
            .map(c => c.name || c.id || 'unknown')
            .sort()
            .join('|');
        
        let hash = 0;
        for (let i = 0; i < componentHash.length; i++) {
            hash = ((hash << 5) - hash) + componentHash.charCodeAt(i);
            hash |= 0;
        }
        const trackId = `theme_${Math.abs(hash)}`;

        if (this.trackCache.has(trackId) && !this.needsRegeneration) {
            Logger.message(`T13NE_Music: Using cached theme '${trackId}'`);
            return this.trackCache.get(trackId);
        }

        Logger.message("T13NE_Music: Generating Main Theme (Async)...");

        let trackData;
        if (this.useWorker && this.worker) {
            // Sanitize components to plain objects for cloning to Worker
            const sanitizedComponents = this.activeComponents.map(c => ({
                name: c.name,
                id: c.id,
                type: c.type,
                geometry: c.geometry ? {
                    GeometryNumber: c.geometry.GeometryNumber,
                    GeoHarmonics: c.geometry.GeoHarmonics,
                    Soul: c.geometry.Soul,
                    Facade: c.geometry.Facade,
                    Nascent: c.geometry.Nascent,
                    Chi: c.geometry.Chi,
                    Octave: c.geometry.Octave
                } : null
            }));

            trackData = await this.callWorker('generateMainTheme', {
                activeComponents: sanitizedComponents,
                tensionLevel: currentTension,
                forceRegeneration: this.needsRegeneration
            });

            // Ensure main thread has all instruments defined
            if (trackData && trackData.voices) {
                for (const voice of trackData.voices) {
                    if (voice.instrument && !this.synth.instrumentEngine.instruments.has(voice.instrument)) {
                        await this.themeGenerator._ensureInstrumentDefined(voice.instrument);
                    }
                }
            }
        } else {
            trackData = await this.themeGenerator.createMainTheme(this.activeComponents, gameEngine, this.needsRegeneration, currentTension);
        }

        if (!trackData) return;
        
        this.trackCache.set(trackId, trackData);
        this.saveTrack(trackId, trackData);
        this.needsRegeneration = false;
        return trackData;
    }

    async createWormholeTheme(ship, origin, target) {
        if (!this.synth) return;
        const trackName = `track_wormhole_${origin.name}_${target.name}`;

        let trackData;
        if (this.useWorker && this.worker) {
            trackData = await this.callWorker('generateWormholeTheme', { ship, origin, target });
        } else {
            trackData = await this.themeGenerator.createWormholeTheme(ship, origin, target);
        }

        if (!trackData) return;
        this.saveTrack(trackName, trackData);
        return trackData;
    }

    async createWormholeRacersTheme() {
        if (!this.synth) return;
        const trackName = 'track_wormhole_racers';
        Logger.message("T13NE_Music: generating Wormhole Racers Theme...");
        const trackData = await this.themeGenerator.createWormholeRacersTheme();
        if (!trackData) return;
        this.saveTrack(trackName, trackData);
        Logger.message(`T13NE_Music: Saved track ''.`);
        return trackData;
    }

    async createT13NETheme() {
        if (!this.synth) return;
        const trackName = 'track_t13ne_main';
        Logger.message("T13NE_Music: generating T13NE Main Theme...");
        const trackData = await this.themeGenerator.createT13NETheme();
        if (!trackData) return;
        this.saveTrack(trackName, trackData);
        Logger.message(`T13NE_Music: Saved track ''.`);
        return trackData;
    }

    async createPactTheme(pact) {
        if (!this.synth) return;
        const trackName = `track_pact_${pact.name}`;
        const trackData = await this.themeGenerator.createPactTheme(pact);
        if (!trackData) return;
        this.saveTrack(trackName, trackData);
        return trackData;
    }

    getCharacterComposition(character, options = {}) {
        return this.themeGenerator.getCharacterComposition(character, options);
    }

    async loadMidi(name, url) {
        if (!this.manifestManager.manifest.midi[name]) {
             try {
                const response = await fetch(url);
                if (response.ok) {
                    const midiData = await response.json(); // Assuming JSON MIDI format
                    this.manifestManager.addToManifest('midi', name, { data: midiData, url: url });
                    Logger.message(`T13NE_Music: Loaded MIDI data for ''.`);
                    return midiData;
                }
             } catch (e) {
                Logger.error(`T13NE_Music: Failed to load MIDI '' from `, e);
                return null;
             }
        }
        return this.manifestManager.manifest.midi[name].data;
    }

    playCharacterComposition(character, listener = null, instrument = null) {
        if (!this.synth) return;
        const motif = this.getCharacterComposition(character);
        if (!motif) return;

        const preferredInstrument = instrument || this.themeGenerator._getInstrumentForRole('lead', character.geometry) || 'Piano';

        Logger.message(`T13NE_Music: Playing leitmotif for ${character.name}`);
        let dissonance = 0;

        if (listener && this.geometry) {
            const charGeo = character.geometry?.GeometryNumber || 0;
            const harmonics = listener.geometry?.GeoHarmonics;
            if (harmonics) {
                if (harmonics.Dissonant.includes(charGeo)) dissonance = 15;
                else if (harmonics.Nemesis === charGeo) dissonance = 50;
            }
        }

        const now = this.soundEngine.audioContext.currentTime;
        let timeCursor = now;
        const beatTime = 60 / motif.tempo;

        motif.sequence.forEach(note => {
            const duration = note.duration * beatTime;
            const detune = (Math.random() - 0.5) * dissonance;
            const type = dissonance > 10 ? 'sawtooth' : 'triangle';
            this.synth.playNote(note.freq, timeCursor, duration, type, detune, preferredInstrument);
            timeCursor += duration;
        });
    }

    getComposition(entity) {
        return this.themeGenerator.getComposition(entity);
    }

    playTrack(track) {
        if (!this.synth || !track) return;

        if (track.voices) {
            this.playTrackObject(track);
            return;
        }

        if (!track.sequence) {
            Logger.warn(`T13NE_Music: Track '${track.name}' has no sequence data.`);
            return;
        }

        Logger.message(`T13NE_Music: Playing Track '${track.name}'`);

        const bpm = track.bpm || 120;
        const beatTime = 60 / bpm;
        const stepTime = beatTime / 4;

        const now = this.soundEngine.audioContext.currentTime;

        track.sequence.forEach(evt => {
            const startTime = now + (evt.step * stepTime);
            let freq = evt.freq;
            if (!freq && evt.note) {
                freq = this.themeGenerator._noteToFreq(evt.note);
            }

            const durationSecs = evt.duration * 4 * stepTime;

            this.synth.playNote(freq, startTime, durationSecs, 'sine', 0, track.instrument);
        });
    }

    playTrackObject(track) {
        if (!this.synth) return;

        if (this.currentTrackName && this.currentTrackName !== track.name) {
            this.stopTrack();
        }
        
        this.synth.pruneChannels(track.voices.map(v => v.id));

        this.currentTrack = track;
        this.currentTrackName = track.name;
        Logger.message(`Playing Track: ${track.name}`);

        if (!track.bpm || track.bpm <= 0) {
            Logger.error(`T13NE_Music: Invalid BPM (${track.bpm}) in track ${track.name}. Playback aborted.`);
            return;
        }

        const stepTime = (60 / track.bpm) / 4;
        const lookahead = 0.8; 
        this.currentStep = 0;
        let nextStepTime = this.synth.ctx.currentTime + 0.05;

        if (this.currentSequenceTimer) clearTimeout(this.currentSequenceTimer);

        const schedule = () => {
            const activeTrack = this.currentTrack;
            if (!activeTrack || !this.currentTrackName || activeTrack.name !== this.currentTrackName) return;

            if (this.synth.ctx.state === 'suspended') this.synth.ctx.resume();

            const now = this.synth.ctx.currentTime;
            
            const ts = activeTrack.timeSignature || [4, 4];
            const stepsPerMeasure = Math.floor(ts[0] * (16 / ts[1]));
            const totalSteps = activeTrack.totalSteps || (activeTrack.measures * stepsPerMeasure);
            
            const safeTotalSteps = (!totalSteps || isNaN(totalSteps)) ? 64 : totalSteps;

            // Fix: Ensure currentStep is within bounds if track length changed during update
            if (this.currentStep >= safeTotalSteps) {
                this.currentStep = this.currentStep % safeTotalSteps;
            }

            if (nextStepTime < now - 0.1) {
                const missedSeconds = now - nextStepTime;
                
                // FIX: If gap is huge (e.g. > 2s), assume tab backgrounding/pause and just reset without warning/catchup
                if (missedSeconds > 2.0) {
                     nextStepTime = now + 0.02;
                     this.currentStep = (this.currentStep + 1) % safeTotalSteps; // Just move to next
                     Logger.message(`T13NE_Music: Large time gap detected (${missedSeconds.toFixed(2)}s). Resyncing scheduler.`);
                } else {
                    const missedSteps = Math.floor(missedSeconds / stepTime);
                    nextStepTime = now + 0.02;
                    this.currentStep = (this.currentStep + missedSteps) % safeTotalSteps;
                    Logger.warn(`T13NE_Music: Sync jump! Advanced  steps to recover from lag.`);
                }
            }

            let iterations = 0;
            while (nextStepTime < now + lookahead) {
                if (iterations++ > 32) break; 

                activeTrack.voices.forEach(voice => {
                    if (voice.mute) return;

                    const loopLen = voice.loopLength || safeTotalSteps;
                    const loopStep = this.currentStep % loopLen;
                    const notesOnStep = voice.sequence.filter(n => n.step === loopStep);
                    notesOnStep.forEach(note => {
                        const freq = note.freq || this.synth.instrumentEngine._freqFromNote(note.note);
                        const dynamicVelocity = (note.velocity || 1.0) * (voice.id.includes('pad') ? 0.4 : 0.8);

                        this.synth.playNote(
                            freq,
                            nextStepTime,
                            note.duration,
                            'Piano',
                            0,
                            voice.instrument,
                            voice.id,
                            0,
                            dynamicVelocity
                        );
                    });
                });

                nextStepTime += stepTime;
                this.currentStep = (this.currentStep + 1) % safeTotalSteps;
            }

            this.currentSequenceTimer = setTimeout(schedule, 30);
        };

        if (!document.getElementById('audio-debug-viz')) {
            this.createDebugVisualizer();
        }

        schedule();
    }

    updateTrack(track) {
        if (this.currentTrack && this.currentTrack.name === track.name) {
            this.currentTrack.voices = track.voices;
            this.currentTrack.bpm = track.bpm;
            this.currentTrack.timeSignature = track.timeSignature;
            this.currentTrack.measures = track.measures;
            this.currentTrack.totalSteps = track.totalSteps;
            // this.currentStep = 0; // Removed to allow music to evolve/extend without restarting
            this.synth.pruneChannels(track.voices.map(v => v.id));
            Logger.message(`T13NE_Music: Updated track '${track.name}' with new voices.`);
        } else {
            this.playTrackObject(track);
        }
    }

    createDebugVisualizer() {
        const canvas = document.createElement('canvas');
        canvas.id = 'audio-debug-viz';
        canvas.width = 300;
        canvas.height = 300;
        canvas.style.cssText = 'position:fixed; bottom:10px; right:10px; z-index:10000; background:rgba(0,0,0,0.9); border:1px solid #444; pointer-events:none;';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        const draw = () => {
            if (!this.synth) return;
            requestAnimationFrame(draw);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const channels = Array.from(this.synth.channels.entries());
            if (channels.length === 0) return;

            const h = canvas.height / channels.length;

            channels.forEach(([name, ch], i) => {
                const data = new Uint8Array(ch.analyser.frequencyBinCount);
                ch.analyser.getByteTimeDomainData(data);

                let sum = 0;
                for (let k = 0; k < data.length; k++) {
                    const val = (data[k] - 128) / 128.0;
                    sum += val * val;
                }
                const rms = Math.sqrt(sum / data.length);

                const y = i * h;

                ctx.fillStyle = '#0f0';
                ctx.font = '10px monospace';
                ctx.fillText(name, 2, y + 10);

                if (rms > 0.01) {
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = '#0f0';
                    ctx.beginPath();

                    for (let j = 0; j < data.length; j++) {
                        const v = data[j] / 128.0;
                        const yPos = y + (v * h / 2);
                        if (j === 0) ctx.moveTo(0, yPos);
                        else ctx.lineTo(j / data.length * canvas.width, yPos);
                    }
                    ctx.stroke();
                } else {
                    ctx.strokeStyle = '#004400';
                    ctx.beginPath();
                    ctx.moveTo(0, y + h / 2);
                    ctx.lineTo(canvas.width, y + h / 2);
                    ctx.stroke();
                }
            });
        };
        draw();
    }

    stopTrack() {
        if (this.currentSequenceTimer) clearTimeout(this.currentSequenceTimer);
        this.currentTrackName = null;
    }
    saveSequence(name, sequence) {
        const data = { name, sequence, timestamp: Date.now() };
        this.manifestManager.addToManifest('sequences', name, { filename: `.json` });
        Logger.message(`T13NE_Music: Sequence '' ready for export.`);
        return JSON.stringify(data, null, 2);
    }

    saveTrack(name, trackData) {
        const data = { name, ...trackData, timestamp: Date.now() };
        this.manifestManager.addToManifest('tracks', name, { filename: `.json` });
        return JSON.stringify(data, null, 2);
    }

    saveMidi(name, notes) {
        const data = { name, notes, timestamp: Date.now() };
        this.manifestManager.addToManifest('midi', name, { filename: `.json` });
        return JSON.stringify(data, null, 2);
    }

    saveLoop(name, loopData) {
        const data = { name, ...loopData, timestamp: Date.now() };
        this.manifestManager.addToManifest('loops', name, { filename: `.json` });
        return JSON.stringify(data, null, 2);
    }

    async loadInstrument(name, url) {
        if (this.synth) {
            await this.loadSample(name, url);
        }
    }

    async loadMusicPack(packData) {
        if (this.synth) {
            this.musicPack = {};
            for (const key in packData) {
                this.musicPack[key] = await this.synth.loadAudio(key, packData[key]);
            }
            Logger.message("T13NE_Music: Music pack loaded.");
        }
    }

    updateAmbience(plot, gameParams = {}) {
        if (!this.synth || !this.musicPack || !plot) return;

        const tension = plot.tensionLevel || 0;
        if (this.lastTension === tension && !gameParams.playerHealth) return;

        const newLayers = new Set();

        if (tension >= 0 && this.musicPack.base) {
            newLayers.add('base');
        }
        if (tension >= 3 && this.musicPack.percussion_low) {
            newLayers.add('percussion_low');
        }
        if (tension >= 6) {
            if (this.musicPack.percussion_high) newLayers.add('percussion_high');
            if (this.musicPack.harmony) newLayers.add('harmony');
        }
        if (tension >= 8 && this.musicPack.melody) {
            newLayers.add('melody');
        }

        if (gameParams.playerHealth < 0.3 && this.musicPack.danger) {
            newLayers.add('danger');
        }

        const layersToStart = [...newLayers].filter(x => !this.currentLayers.has(x));
        const layersToStop = [...this.currentLayers].filter(x => !newLayers.has(x));

        if (layersToStart.length > 0 || layersToStop.length > 0) {
            Logger.message(`T13NE_Music: Updating layers. Tension: . Start: [${layersToStart.join(', ')}]. Stop: [${layersToStop.join(', ')}]`);
        }

        layersToStart.forEach(layerName => {
            this.synth.playLayer(layerName, this.musicPack[layerName], 0.2, true, 4.0); // Reduced to 0.2 from 0.5
        });

        layersToStop.forEach(layerName => {
            this.synth.stopLayer(layerName, 4.0);
        });

        this.currentLayers = newLayers;
        this.lastTension = tension;
    }

    stop() {
        if (!this.synth) return;
        this.synth.stopAll();
        this.currentLayers.clear();
        this.lastTension = -1;
    }

    setPerformanceMode(mode) {
        if (this.synth && this.synth.instrumentEngine && typeof this.synth.instrumentEngine.setPerformanceMode === 'function') {
            this.synth.instrumentEngine.setPerformanceMode(mode);
        }
        if (this.themeGenerator) {
            this.themeGenerator.performanceMode = mode;
        }
        if (this.useWorker && this.worker) {
            this.callWorker('setPerformanceMode', mode);
        }
        Logger.message(`T13NE_Music: Performance mode set to ${mode}`);
    }

    initWorker() {
        if (this.worker) return;

        try {
            this.worker = new Worker(new URL('./core/MusicWorker.js', import.meta.url), { type: 'module' });
            this.worker.onmessage = (e) => this.handleWorkerMessage(e.data);

            if (!this._pendingRequests) this._pendingRequests = new Map();
            const requestId = 'init_' + Math.random().toString(36).substring(7);

            this._pendingRequests.set(requestId, {
                resolve: () => Logger.message("T13NE_Music: Worker initialized."),
                reject: (err) => Logger.error("T13NE_Music: Worker failed to initialize.", err)
            });

            // Send initial data to worker
            const codexData = {};
            // We need to pass the loaded patterns to the worker
            const patterns = {
                'music:drumpatterns.json': this.themeGenerator.drumPatterns,
                'music:harmonic_patterns.json': { patterns: this.themeGenerator.harmonicPatterns },
                'music:basspatterns.json': { patterns: this.themeGenerator.bassPatterns },
                'geometry:progressions.json': this.themeGenerator.progressions,
                'geometry:tonalModes.json': this.tonalModes
            };

            // Also need RomanChords
            const geometryData = {
                romanChords: this.geometry?.RomanChords || [],
                keys: this.geometry?.keys || {}
            };

            this.worker.postMessage({
                type: 'init',
                data: {
                    codexData: patterns,
                    geometryData: geometryData,
                    manifest: this.manifestManager.manifest
                },
                requestId
            });
        } catch (e) {
            Logger.error("T13NE_Music: Failed to initialize worker.", e);
            this.useWorker = false;
        }
    }

    handleWorkerMessage(data) {
        const { type, track, requestId, error } = data;

        if (this._pendingRequests && this._pendingRequests.has(requestId)) {
            const { resolve, reject } = this._pendingRequests.get(requestId);
            this._pendingRequests.delete(requestId);

            if (type === 'error') {
                reject(new Error(error));
            } else {
                console.log(`T13NE_Music: Resolving request ${requestId} (${type})`);
                resolve(track || data);
            }
        } else {
            if (type !== 'initialized' && type !== 'performanceModeSet') {
                console.warn(`T13NE_Music: Received worker message for unknown requestId ${requestId}`, data);
            }
        }
    }

    async callWorker(type, data) {
        if (!this.worker) return null;

        if (!this._pendingRequests) this._pendingRequests = new Map();
        const requestId = Math.random().toString(36).substring(7);

        return new Promise((resolve, reject) => {
            this._pendingRequests.set(requestId, { resolve, reject });
            this.worker.postMessage({ type, data, requestId });

            // Timeout after 10s
            setTimeout(() => {
                if (this._pendingRequests.has(requestId)) {
                    this._pendingRequests.delete(requestId);
                    reject(new Error("Worker request timed out"));
                }
            }, 10000);
        });
    }
}

export default new T13NE_Music();
