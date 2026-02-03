// src/t13ne/modules/audio/t13ne-music.js

import Logger from "../../core/Logger.js";
import T13NE from '../../T13NE.js';
import CodexLoader from "../codex/CodexLoader.js";
import { InstrumentEngine } from "./t13ne-InstrumentEngine.js";
import { AudioAnalyzer } from "./t13ne-audio-analyzer.js";

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

class MusicRNG {
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

class AudioManifestManager {
    constructor() {
        this.manifest = {
            samples: {},
            tracks: {},
            sequences: {},
            loops: {},
            midi: {},
            stems: {},
            instruments: {}
        };
    }

    async loadManifest() {
        try {
            const response = await fetch('/media/audio/audio_assets_manifest.json');
            if (response.ok) {
                const loaded = await response.json();
                this.manifest = { ...this.manifest, ...loaded };
                Logger.message("AudioManifestManager: Manifest loaded from disk.");
            } else {
                Logger.warn("AudioManifestManager: Could not load audio_assets_manifest.json");
            }
        } catch (e) {
            Logger.warn("AudioManifestManager: Error loading manifest", e);
        }
    }

    addToManifest(category, id, data) {
        if (!this.manifest[category]) this.manifest[category] = {};
        this.manifest[category][id] = data;
    }

    getAssetAnalysis(category, id) {
        return this.manifest[category]?.[id]?.analysis || null;
    }

    updateAssetAnalysis(category, id, analysis) {
        if (this.manifest[category] && this.manifest[category][id]) {
            this.manifest[category][id].analysis = analysis;
        }
    }

    getAssetPath(category, id) {
        const item = this.manifest[category]?.[id];
        if (!item) return null;
        
        if (item.path) return item.path;

        let url = item.filename || id;
        
        // Robust path normalization
        if (!url.match(/^(http|https|blob|data):/)) {
            // Remove leading slash for consistent checking
            let cleanUrl = url.startsWith('/') ? url.substring(1) : url;

            // Ensure it starts with media/audio/ if it doesn't already (and isn't in public/)
            if (!cleanUrl.startsWith('media/') && !cleanUrl.startsWith('public/')) {
                cleanUrl = `media/audio/${cleanUrl}`;
            }
            
            // Add root slash
            url = '/' + cleanUrl;
        }

        // Heuristic: If no extension is present, assume .wav to prevent 404s on extensionless IDs
        if (!url.split('/').pop().includes('.')) {
            url += '.wav';
        }

        return url;
    }

    saveAnalysis(category, id, analysis, isNew = false) {
        if (!this.manifest[category]) this.manifest[category] = {};
        if (!this.manifest[category][id]) this.manifest[category][id] = {};
        
        this.manifest[category][id].analysis = analysis;
        if (isNew) this.manifest[category][id].type = 'synthetic';
    }
}

/**
 * A lightweight synthesizer for procedural playback with transition capabilities.
 */
class T13Synth {
    // ... (T13Synth class remains unchanged) ...
    constructor(audioContext, outputNode) {
        this.ctx = audioContext;
        this.outputNode = outputNode || this.ctx.destination;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 1.0; 

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.8;
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 1.0;
        this.sfxGain.connect(this.masterGain);

        this.dialogueGain = this.ctx.createGain();
        this.dialogueGain.gain.value = 1.0;
        this.dialogueGain.connect(this.masterGain);
        
        // Add Compressor to tame peaks and prevent clipping
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -10;
        this.compressor.knee.value = 40;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0;
        this.compressor.release.value = 0.25;

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.outputNode);

        this.buffers = new Map(); 
        this.layers = new Map(); 
        this.channels = new Map(); 

        // Sub-Engines
        this.instrumentEngine = new InstrumentEngine(this.ctx);
    }
    
    // ... (rest of T13Synth methods remain unchanged) ...

    setMusicVolume(val) {
        this.musicGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.1);
    }

    setSFXVolume(val) {
        this.sfxGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.1);
    }

    setDialogueVolume(val) {
        this.dialogueGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.1);
    }

    async loadAudio(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.buffers.set(name, audioBuffer);
            Logger.message(`T13Synth: Loaded audio '${name}'`);
            return audioBuffer;
        } catch (e) {
            Logger.error(`T13Synth: Failed to load audio '${name}'`, e);
            return null;
        }
    }

    playNote(frequency, startTime, duration, type = 'Piano', detune = 0, instrument = null, channelId = null) {
        if (!Number.isFinite(frequency) || frequency <= 0) return; // Safety check

        let dest = this.musicGain; 

        if (channelId) {
            if (!this.channels.has(channelId)) {
                const gain = this.ctx.createGain();
                const analyser = this.ctx.createAnalyser();
                analyser.fftSize = 256;
                gain.connect(analyser);
                analyser.connect(this.musicGain); 
                this.channels.set(channelId, { gain, analyser });
            }
            dest = this.channels.get(channelId).gain;
        }

        if (instrument) {
            this.instrumentEngine.playNote(instrument, frequency, startTime, duration, 0.3, dest);
            return;
        }

        this.instrumentEngine.playNote(type, frequency, startTime, duration, 0.3, dest);
    }

    playSample(name, frequency, startTime, duration, detune) {
        this.instrumentEngine.playNote(name, frequency, startTime, duration, 0.3, this.musicGain);
    }

    playLayer(layerName, buffer, volume = 1.0, loop = true, fadeTime = 2.0) {
        if (this.layers.has(layerName)) return; 

        const now = this.ctx.currentTime;
        const source = this.ctx.createBufferSource();
        const gainNode = this.ctx.createGain();

        source.buffer = buffer;
        source.loop = loop;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + fadeTime);

        source.connect(gainNode);
        gainNode.connect(this.musicGain); 
        source.start(now);

        this.layers.set(layerName, { source, gainNode });
        Logger.message(`T13Synth: Started layer '${layerName}'`);
    }

    stopLayer(layerName, fadeTime = 2.0) {
        if (!this.layers.has(layerName)) return;

        const layer = this.layers.get(layerName);
        const now = this.ctx.currentTime;

        layer.gainNode.gain.cancelScheduledValues(now);
        layer.gainNode.gain.setValueAtTime(layer.gainNode.gain.value, now);
        layer.gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);

        layer.source.stop(now + fadeTime + 0.1);

        this.layers.delete(layerName);
        Logger.message(`T13Synth: Stopped layer '${layerName}'`);
    }

    playFX(buffer, volume = 0.5) {
        if (!buffer) return;
        const now = this.ctx.currentTime;
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        gain.gain.value = volume;

        source.buffer = buffer;
        source.connect(gain);
        gain.connect(this.sfxGain); 
        source.start(now);
    }

    playBridge(baseFreq, direction) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.musicGain); 

        osc.type = direction === 'rising' ? 'sawtooth' : 'sine';

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 1.0);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

        osc.frequency.setValueAtTime(baseFreq, now);
        if (direction === 'rising') {
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 3.0);
        } else {
            osc.frequency.setValueAtTime(baseFreq * 1.5, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 3.0);
        }

        osc.start(now);
        osc.stop(now + 3.0);
    }

    stopAll() {
        this.layers.forEach((layer, name) => {
            this.stopLayer(name, 0.5);
        });
        
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.1);
    }
}

/**
 * T13NE Music Module
 * Procedurally generates music based on Character Geometry and Narrative Arcs.
 */
class T13NE_Music {
    // ... (constructor and initialize remain unchanged) ...
    constructor() {
        this.t13ne = null;
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
        this.drumPatterns = null;
        this.harmonicPatterns = null;
        this.bassPatterns = null;
        this.progressions = null;
        this.activeComponents = [];
        this.currentTrackName = null;
        this.currentProgression = null;
        this.needsRegeneration = true;
        this.currentTrack = null; // Store active track object for live updates

        this.manifestManager = new AudioManifestManager();
        this.instrumentPalette = { bass: [], pad: [], lead: [], rhythm: [], kick: [], snare: [], hat: [], perc: [] };
    }

    async initialize(t13ne) {
        if (this.initialized) return;
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
            this.synth.setMusicVolume(config.musicVolume !== undefined ? config.musicVolume : 0.8);
            this.synth.setSFXVolume(config.sfxVolume !== undefined ? config.sfxVolume : 1.0);
            this.synth.setDialogueVolume(config.dialogueVolume !== undefined ? config.dialogueVolume : 1.0);
        } else {
            Logger.warn("T13NE_Music: No AudioContext available. Playback disabled.");
        }

        this.tonalModes = await CodexLoader.getData('geometry', 'tonalModes.json') || [];
        this.progressions = await CodexLoader.getData('geometry', 'progressions.json') || [];

        this.initialized = true;
        Logger.message("T13NE_Music: Initialized.");

        this._registerStandardInstruments();
        await this._generateOrchestralInstruments();
        
        // New: Process manifest to build dynamic instrument palette
        await this._processManifestInstruments();
        
        await this._loadDrumPatterns();
        await this._loadHarmonicPatterns();
        await this._loadBassPatterns();
    }

    async _processManifestInstruments() {
        if (!this.synth) return;
        
        const samples = this.manifestManager.manifest.samples;
        
        for (const [key, data] of Object.entries(samples)) {
            // Skip if not loaded or analyzed yet (lazy loading handled elsewhere, but we need ID)
            
            // Categorize
            const lowerKey = key.toLowerCase();
            let category = 'lead'; // Default
            
            if (lowerKey.includes('bass')) category = 'bass';
            else if (lowerKey.includes('pad') || lowerKey.includes('atmos') || lowerKey.includes('texture')) category = 'pad';
            else if (lowerKey.includes('kick')) category = 'kick';
            else if (lowerKey.includes('snare')) category = 'snare';
            else if (lowerKey.includes('hat')) category = 'hat';
            else if (lowerKey.includes('perc') || lowerKey.includes('drum')) category = 'perc';
            
            this.instrumentPalette[category].push(key);
            if (category === 'kick' || category === 'snare' || category === 'hat' || category === 'perc') {
                this.instrumentPalette.rhythm.push(key);
            }

            // Lazy registration: We no longer define 13,000+ instruments on boot.
            // Instruments will be defined on-demand when picked for a track.
        }

        Logger.message(`T13NE_Music: Instrument Palette Built. Bass: ${this.instrumentPalette.bass.length}, Pad: ${this.instrumentPalette.pad.length}, Lead: ${this.instrumentPalette.lead.length}`);
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

        engine.defineInstrument('Drum_Kick', { type: 'synth', oscType: 'sine', pitchEnv: { startMult: 4.0, time: 0.1 }, attack: 0.001, release: 0.2 });
        engine.defineInstrument('Drum_Snare', { type: 'noise', filterType: 'lowpass', filterFreq: 2000, envelope: 'percussive', decay: 0.2 });
        engine.defineInstrument('Drum_HiHat_Closed', { type: 'noise', filterType: 'highpass', filterFreq: 5000, envelope: 'percussive', decay: 0.05 });
        engine.defineInstrument('Drum_HiHat_Open', { type: 'noise', filterType: 'highpass', filterFreq: 5000, envelope: 'percussive', decay: 0.2 });
        engine.defineInstrument('Drum_Crash', { type: 'noise', filterType: 'highpass', filterFreq: 3000, envelope: 'percussive', decay: 1.5 });
        engine.defineInstrument('Drum_Ride', { type: 'additive', partials: [{freq:1, amp:1}, {freq:2.1, amp:0.5}, {freq:3.5, amp:0.3}, {freq:5.2, amp:0.2}], envelope: 'percussive', decay: 1.0 });
        engine.defineInstrument('Drum_Tom_High', { type: 'synth', oscType: 'sine', pitchEnv: { startMult: 1.5, time: 0.1 }, attack: 0.001, release: 0.3, freq: 200 });
        engine.defineInstrument('Drum_Tom_Low', { type: 'synth', oscType: 'sine', pitchEnv: { startMult: 1.5, time: 0.1 }, attack: 0.001, release: 0.4, freq: 100 });
        engine.defineInstrument('Drum_Cowbell', { type: 'additive', partials: [{freq:1, amp:1}, {freq:1.5, amp:0.5}], envelope: 'percussive', decay: 0.1 });

        engine.defineInstrument('Synth_Bass', { 
            type: 'additive', 
            envelope: 'sustained',
            attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.2,
            partials: [{freq:1, amp:1}, {freq:2, amp:0.5}, {freq:3, amp:0.25}, {freq:4, amp:0.12}] 
        });
        engine.defineInstrument('Synth_Lead', { 
            type: 'additive', 
            envelope: 'percussive',
            attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.1,
            partials: [
                {freq:1, amp:0.5}, 
                {freq:2, amp:0.3}, 
                {freq:3, amp:0.15}, 
                {freq:4, amp:0.1}
            ] 
        });
        engine.defineInstrument('Synth_Pad', { 
            type: 'additive', 
            envelope: 'sustained',
            attack: 0.5, decay: 0.5, sustain: 0.8, release: 1.0,
            partials: [{freq:1, amp:1}, {freq:2, amp:0.1}, {freq:3, amp:0.05}] 
        });

        engine.defineInstrument('Tuba', { type: 'additive', envelope: 'sustained', attack: 0.1, decay: 0.2, sustain: 0.8, release: 0.3, partials: [{freq:1, amp:1}, {freq:2, amp:0.7}, {freq:3, amp:0.4}, {freq:4, amp:0.2}] });
        engine.defineInstrument('Oboe', { type: 'additive', envelope: 'sustained', attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.1, partials: [{freq:1, amp:0.4}, {freq:2, amp:0.1}, {freq:3, amp:1.0}, {freq:4, amp:0.1}, {freq:5, amp:0.5}] });
        engine.defineInstrument('Guitar', { type: 'additive', envelope: 'percussive', attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.1, partials: [{freq:1, amp:1}, {freq:2, amp:0.5}, {freq:3, amp:0.3}, {freq:4, amp:0.2}] });
        engine.defineInstrument('Harpsichord', { type: 'additive', envelope: 'percussive', attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.1, partials: [{freq:1, amp:0.6}, {freq:2, amp:1.0}, {freq:3, amp:0.5}, {freq:4, amp:0.3}] });
    }

    async _generateOrchestralInstruments() {
        if (!this.synth) return;
        
        const mappings = {
            'Cello': 'pad_acoustic/low_string',
            'Violin': 'pad_acoustic/hi_string',
            'Viola': 'pad_acoustic/mid_string',
            'Flute': 'melody_acoustic/flute_c1',
            'Trumpet': 'melody_acoustic/trumpet_solo',
            'French Horn': 'melody_acoustic/brite_horn',
            'Clarinet': 'melody_acoustic/clarinet_c1',
            'Piano': 'melody_acoustic/piano_c4',
            'Harp': 'melody_acoustic/harp'
        };

        for (const [instName, sampleId] of Object.entries(mappings)) {
            // Ensure sample is loaded and analyzed before synthesizing
            const url = this.manifestManager.getAssetPath('samples', sampleId);
            if (url) await this.loadSample(sampleId, url);
            
            this.synth.instrumentEngine.createSyntheticInstrument(sampleId, instName, 'high', 'sustained');
        }
    }

    async _loadDrumPatterns() {
        try {
            const data = await CodexLoader.getData('music', 'drumpatterns.json');
            if (!data) throw new Error("No data returned from CodexLoader");
            this.drumPatterns = {};
            for (const category in data) {
                if (Array.isArray(data[category])) {
                    data[category].forEach(pattern => this.drumPatterns[pattern.name] = pattern);
                }
            }
            
            Logger.message("T13NE_Music: Drum patterns loaded.");
        } catch (e) {
            Logger.warn("T13NE_Music: Failed to load drumpatterns.json via Codex. Using procedural fallback.", e);
        }
    }

    async _loadHarmonicPatterns() {
        try {
            const data = await CodexLoader.getData('music', 'harmonic_patterns.json');
            if (!data) throw new Error("No data returned from CodexLoader");
            this.harmonicPatterns = data.patterns;
            Logger.message("T13NE_Music: Harmonic patterns loaded.");
        } catch (e) {
            Logger.warn("T13NE_Music: Failed to load harmonic_patterns.json via Codex.", e);
        }
    }

    async _loadBassPatterns() {
        try {
            const data = await CodexLoader.getData('music', 'basspatterns.json');

            if (!data) throw new Error("No data returned from CodexLoader");
            this.bassPatterns = data.patterns;
            Logger.message("T13NE_Music: Bass patterns loaded.");
        } catch (e) {
            Logger.warn("T13NE_Music: Failed to load bass patterns via Codex.", e);
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
            const newId = `${id}_syn`;
            // Create a new entry that references the original filename but has new analysis
            const original = this.manifestManager.manifest.samples[id];
            const entry = { ...original, analysis: analysis, type: 'synthetic', sourceId: id };
            this.manifestManager.addToManifest('samples', newId, entry);
            Logger.message(`T13NE_Music: Saved new synthetic instrument '${newId}'`);
        } else {
            this.manifestManager.updateAssetAnalysis('samples', id, analysis);
            Logger.message(`T13NE_Music: Updated analysis for '${id}'`);
        }
    }

    injectThemeComponents(components) {
        let changed = false;
        Object.values(components).forEach(entity => {
            const exists = this.activeComponents.some(c => c.name === entity.name); // Check by name
            if (entity && !exists) {
                this.activeComponents.push(entity);
                changed = true;
            }
        });
        if (changed) {
            this.needsRegeneration = true;
        }
        Logger.message(`T13NE_Music: Active components updated. Total: ${this.activeComponents.length}`);
    }

    _getProceduralInstrument(category, seed) {
        const rng = new MusicRNG(seed);
        const palette = this.instrumentPalette[category];
        if (palette && palette.length > 0) {
            const instId = rng.pick(palette);
            this._ensureInstrumentDefined(instId);
            return instId;
        }
        // Fallback to standard
        const fallbackMap = {
            'kick': 'Drum_Kick',
            'snare': 'Drum_Snare',
            'hat': 'Drum_HiHat_Closed',
            'perc': 'Drum_Cowbell'
        };
        return fallbackMap[category] || 'Piano';
    }

    _ensureInstrumentDefined(instrumentId) {
        if (!this.synth || this.synth.instrumentEngine.instruments.has(instrumentId)) return;

        // Skip if it's one of the hardcoded standard instruments
        const standard = ['Drum_Kick', 'Drum_Snare', 'Drum_HiHat_Closed', 'Drum_HiHat_Open', 'Drum_Crash', 'Drum_Ride', 'Drum_Tom_High', 'Drum_Tom_Low', 'Drum_Cowbell', 'Synth_Bass', 'Synth_Lead', 'Synth_Pad', 'Tuba', 'Oboe', 'Guitar', 'Harpsichord', 'Piano', 'Cello', 'Violin', 'Viola', 'Flute', 'Trumpet', 'French Horn', 'Clarinet', 'Harp'];
        if (standard.includes(instrumentId)) return;

        const data = this.manifestManager.manifest.samples[instrumentId];
        if (!data) return;

        if (data.analysis && data.analysis.freq) {
            // Determine category for envelope
            const lowerKey = instrumentId.toLowerCase();
            let envelope = 'percussive';
            if (lowerKey.includes('pad') || lowerKey.includes('atmos') || lowerKey.includes('texture')) envelope = 'sustained';
            
            this.synth.instrumentEngine.createSyntheticInstrument(instrumentId, instrumentId, 'high', envelope);
        } else {
            this.synth.instrumentEngine.defineInstrument(instrumentId, {
                type: 'sampler',
                sampleId: instrumentId,
                baseFreq: 261.63 
            });
        }
    }

    _getInstrumentFromGeometry(geo) {
        // Map Key and Octave to Role
        let octave = 4;
        if (geo.Octave !== undefined) octave = geo.Octave;
        
        let role = 'rhythm';
        if (octave <= 3) role = 'bass';
        else if (octave >= 5) role = 'lead';
        else role = 'pad';

        // Select random instrument from the palette for this role
        // Seed RNG with geometry name/ID so the choice is consistent for this entity
        const rng = new MusicRNG(geo.name || JSON.stringify(geo));
        
        const palette = this.instrumentPalette[role];
        let instrument = 'Piano'; // Fallback
        
        if (palette && palette.length > 0) {
            instrument = rng.pick(palette);
        } else {
            // Fallback to standard instruments if palette is empty
            if (role === 'bass') instrument = 'Synth_Bass';
            else if (role === 'pad') instrument = 'Synth_Pad';
            else instrument = 'Synth_Lead';
        }
        
        return { instrument: instrument, role: role };
    }

    // ... (createWormholeTheme, ensureGeometry, _motifToTrackEvents, _addLoopToSequence, _generateRhythm, _generateProgression, _generateBassline, _generateHarmonics, playTrack remain unchanged) ...
    async createMainTheme(gameEngine) {
        if (!this.synth) return;

        const trackName = 'track_main_theme';
        Logger.message("T13NE_Music: generating Main Theme from components...");
        
        if (this.activeComponents.length === 0 && gameEngine) {
             if (gameEngine.playerCharacter) this.activeComponents.push(gameEngine.playerCharacter);
             if (gameEngine.playerShip) this.activeComponents.push(gameEngine.playerShip);
             if (gameEngine.galaxy) this.activeComponents.push(gameEngine.galaxy);
        }

        // 1. Determine Rhythm Source (Prioritize Ship -> Character -> Galaxy)
        // This ensures the drums/meter change when the ship is added
        let rhythmEntity = this.activeComponents.find(c => c.constructor && c.constructor.name === 'Ship');
        if (!rhythmEntity) rhythmEntity = this.activeComponents.find(c => c.role); // Character
        if (!rhythmEntity) rhythmEntity = this.activeComponents[0];

        const rhythmEntityGeo = this.ensureGeometry(rhythmEntity);
        if (!rhythmEntityGeo) return null;
        const rhythm = this._generateRhythm(rhythmEntityGeo);
        
        // Base frequency for fallback/initialization
        const baseKeyData = this.geometry.getKey(rhythmEntityGeo.geometry.GeoHarmonics.key);
        const baseFreq = baseKeyData.Key.Frequency;
        
        // Only regenerate progression if components changed or first run
        if (!this.currentProgression || this.needsRegeneration) {
            const uniqueFreqs = [];
            const seenKeys = new Set();

            // Collect unique keys from ALL active components to build the progression
            this.activeComponents.forEach(comp => {
                const geo = this.ensureGeometry(comp);
                if (geo && geo.geometry && geo.geometry.GeoHarmonics) {
                    const keyData = this.geometry.getKey(geo.geometry.GeoHarmonics.key);
                    if (keyData && !seenKeys.has(keyData.Key.Key)) {
                        seenKeys.add(keyData.Key.Key);
                        uniqueFreqs.push(keyData.Key.Frequency);
                    }
                }
            });
            if (uniqueFreqs.length === 0) uniqueFreqs.push(baseFreq);

            let fullProgression = [];
            // Weave a progression that visits every component's key
            uniqueFreqs.forEach(freq => {
                fullProgression = fullProgression.concat(this._generateProgression(freq));
            });
            
            // If only one key (e.g. just Galaxy), add a modulation for variety
            if (uniqueFreqs.length === 1) {
                fullProgression = fullProgression.concat(this._generateProgression(uniqueFreqs[0] * 1.5));
            }
            // Return to root
            fullProgression = fullProgression.concat(this._generateProgression(uniqueFreqs[0]));

            this.currentProgression = fullProgression;
            Logger.message(`T13NE_Music: Progression regenerated with ${uniqueFreqs.length} unique keys.`);
        }
        const progression = this.currentProgression;

        const bpm = 120;
        const beatTime = 60 / bpm;
        const voices = [];
        
        // Assemble Procedural Drumkit from rhythm source (Ship components)
        const drumSeed = rhythmEntityGeo.name || 'default_rhythm';
        const drumKit = {
            'v_kick': this._getProceduralInstrument('kick', drumSeed),
            'v_snare': this._getProceduralInstrument('snare', drumSeed + '_snare'),
            'v_hat': this._getProceduralInstrument('hat', drumSeed + '_hat'),
            'v_crash': this._getProceduralInstrument('perc', drumSeed + '_crash'),
            'v_ride': this._getProceduralInstrument('perc', drumSeed + '_ride'),
            'v_perc': this._getProceduralInstrument('perc', drumSeed + '_perc')
        };

        rhythm.events.forEach(evt => {
            let v = voices.find(v => v.id === evt.voice);
            if (!v) {
                v = { id: evt.voice, name: evt.voice, instrument: drumKit[evt.voice], sequence: [], mute: false };
                voices.push(v);
            }
            v.sequence.push(evt);
        });

        // Use for...of loop to allow awaiting/yielding
        const componentsToProcess = [...this.activeComponents];
        for (let index = 0; index < componentsToProcess.length; index++) {
            // Yield to event loop to prevent blocking audio scheduler (fixes hitching)
            await new Promise(r => setTimeout(r, 0));

            const source = componentsToProcess[index];
            if (!source || !source.name) return;
            
            // Sanitize name to prevent "v_undefinedundefinedundefined" IDs
            let safeName = source.name.replace(/[^a-zA-Z0-9]/g, '_');
            if (safeName.includes('undefined') || safeName.length === 0) safeName = `Entity_${index}`;

            const entity = this.ensureGeometry(source);
            const { instrument, role } = this._getInstrumentFromGeometry(entity.geometry);
            this._ensureInstrumentDefined(instrument);
            const motif = this.getCharacterComposition(entity);
            
            let events = [];
            if (role === 'bass') {
                events = this._generateBassline(rhythm, entity, progression, baseFreq / 4, beatTime);
            } else if (role === 'pad' || role === 'rhythm') {
                const h = this._generateHarmonics(rhythm, entity, progression, baseFreq);
                events = role === 'pad' ? h.pad : h.guitar;
            } else {
                if (motif) events = this._motifToHarmonizedEvents(motif, `v_${safeName}_${index}`, beatTime, progression, baseFreq);
            }

            voices.push({
                id: `v_${safeName}_${index}`,
                name: `${entity.name} (${role})`,
                instrument: instrument,
                sequence: events,
                mute: false
            });
        }

        const measures = progression.length || 4;
        const totalSteps = measures * rhythm.stepsPerMeasure;

        voices.forEach(v => {
            if (v.id.startsWith('v_kick') || v.id.startsWith('v_snare') || v.id.startsWith('v_hat') || v.id.startsWith('v_crash') || v.id.startsWith('v_ride') || v.id.startsWith('v_perc')) {
                 const measureEvents = [...v.sequence];
                 v.sequence = [];
                 for (let m = 0; m < measures; m++) {
                     const offset = m * rhythm.stepsPerMeasure;
                     measureEvents.forEach(evt => {
                         v.sequence.push({ ...evt, step: evt.step + offset });
                     });
                 }
            } 
            // Leads are now pre-harmonized and looped to the full progression length in _motifToHarmonizedEvents
            else if (!v.sequence || v.sequence.length === 0 || v.sequence[v.sequence.length-1].step < totalSteps) {
                const motifEvents = [...v.sequence];
                v.sequence = [];
                if (motifEvents.length === 0) return;

                const lastEventStep = motifEvents[motifEvents.length-1].step;
                const loopLength = Math.ceil((lastEventStep + 1) / 16) * 16;
                
                let currentStep = 0;
                while (currentStep < totalSteps) {
                    motifEvents.forEach(evt => {
                        if (currentStep + evt.step < totalSteps) {
                            v.sequence.push({ ...evt, step: currentStep + evt.step });
                        }
                    });
                    currentStep += loopLength; 
                }
            }
        });

        const trackData = {
            name: 'Main Theme',
            bpm: bpm,
            timeSignature: rhythm.timeSignature,
            measures: measures,
            totalSteps: totalSteps,
            voices: voices
        };

        this.saveTrack(trackName, trackData);
        this.needsRegeneration = false;
        return trackData;
    }

    ensureGeometry(source) {
         if (!source) return null;
         if (source.geometry && source.geometry.GeoHarmonics) return source;
         
         if (!this.geometry && this.t13ne) {
             this.geometry = this.t13ne.getModule('T13Geometry');
         }
         
         if (!this.geometry) {
             Logger.warn("T13NE_Music: Geometry module missing, cannot calculate geometry.");
             return source;
         }

         const geo = this.geometry.calculateFullGeo(source.name);
         return { ...source, geometry: geo };
    }

    _motifToTrackEvents(motif, voiceId, beatTime, pitchShiftSemitones = 0) {
        const events = [];
        let currentStep = 0;
        motif.sequence.forEach(note => {
            const durationSteps = note.duration * 4; 
            
            let freq = note.freq;
            if (pitchShiftSemitones !== 0) {
                freq = freq * Math.pow(2, pitchShiftSemitones / 12);
            }

            events.push({
                voice: voiceId,
                step: currentStep,
                freq: freq,
                duration: note.duration * beatTime, 
                velocity: 0.7
            });
            currentStep += durationSteps;
        });
        return events;
    }

    _motifToHarmonizedEvents(motif, voiceId, beatTime, progression, globalBaseFreq) {
        const events = [];
        let currentStep = 0;
        
        // Calculate total duration of the progression in steps
        const totalProgressionSteps = progression.reduce((sum, chord) => sum + chord.durationSteps, 0);
        
        // Optimization: Pre-calculate chord start/end steps for faster lookup
        const chordMap = [];
        let stepAccumulator = 0;
        for (const chord of progression) {
            chordMap.push({ start: stepAccumulator, end: stepAccumulator + chord.durationSteps, chord });
            stepAccumulator += chord.durationSteps;
        }
        let chordIndex = 0;

        // Loop the motif until we fill the progression
        while (currentStep < totalProgressionSteps) {
            for (const note of motif.sequence) {
                if (currentStep >= totalProgressionSteps) break;

                // Find the active chord efficiently
                // Since currentStep increases monotonically, we only need to check forward
                while (chordIndex < chordMap.length && currentStep >= chordMap[chordIndex].end) {
                    chordIndex++;
                }
                // Safety wrap
                if (chordIndex >= chordMap.length) chordIndex = 0;

                const activeChord = chordMap[chordIndex].chord;

                // Harmonize: Transpose motif interval to Global Key + Chord Root
                // We ignore the motif's original 'freq' and use its 'interval' (scale degree)
                // to map it onto the current harmonic context.
                const harmonizedPitch = activeChord.rootOffset + note.interval;
                const freq = globalBaseFreq * Math.pow(2, harmonizedPitch / 12);
                
                const durationSteps = Math.ceil(note.duration * 4); // Convert beats to 16th steps

                events.push({
                    voice: voiceId,
                    step: currentStep,
                    freq: freq,
                    duration: note.duration * beatTime, 
                    velocity: 0.7
                });
                currentStep += durationSteps;
            }
        }
        return events;
    }

    _addLoopToSequence(targetSeq, sourceEvents, offsetStep, loopLengthSteps) {
        sourceEvents.forEach(evt => {
            const loopStep = evt.step % loopLengthSteps;
            targetSeq.push({
                ...evt,
                step: offsetStep + loopStep
            });
        });
    }

    _generateRhythm(ship = null) {
        const rng = new MusicRNG(ship ? ship.name : 'default');
        
        if (this.drumPatterns) {
            const targetGenre = ship ? (ship.origin === 'Core' ? "6" : "3") : "3"; 
            const targetEra = ship ? (ship.techLevel > 5 ? "3" : "2") : "2"; 
            
            let matchingKeys = Object.keys(this.drumPatterns).filter(k => {
                const p = this.drumPatterns[k];
                if (!p.tags) return false;
                const genreMatch = p.tags.genres && p.tags.genres.includes(targetGenre);
                const eraMatch = p.tags.eras && p.tags.eras.includes(targetEra);
                return genreMatch || eraMatch;
            });
            
            const pool = matchingKeys.length > 0 ? matchingKeys : Object.keys(this.drumPatterns);
            
            const patternKey = rng.pick(pool);

            const pattern = this.drumPatterns[patternKey];
            if (pattern) {
                const events = [];
                if (pattern.tracks.kick) pattern.tracks.kick.forEach(step => events.push({ voice: 'v_kick', step, freq: 100, duration: 0.1, velocity: 0.9 }));
                if (pattern.tracks.snare) pattern.tracks.snare.forEach(step => events.push({ voice: 'v_snare', step, freq: 100, duration: 0.1, velocity: 0.8 }));
                if (pattern.tracks.hat) pattern.tracks.hat.forEach(step => events.push({ voice: 'v_hat', step, freq: 1000, duration: 0.05, velocity: 0.6 }));
                
                if (pattern.style === 'Rock' || pattern.style === 'Action') {
                    events.push({ voice: 'v_crash', step: 0, freq: 100, duration: 1.5, velocity: 0.8 });
                }
                
                return {
                    events,
                    style: pattern.style, 
                    timeSignature: pattern.timeSignature || [4, 4],
                    stepsPerMeasure: pattern.length || 16
                };
            }
        }

        const events = [];
        const kickPattern = rng.pick(['four-on-floor', 'breakbeat', 'driving']);
        const lengthSteps = 16;

        for (let i = 0; i < lengthSteps; i++) {
            let kick = false;
            if (kickPattern === 'four-on-floor' && i % 4 === 0) kick = true;
            else if (kickPattern === 'driving' && (i % 2 === 0 || i % 8 === 7)) kick = true;
            else if (kickPattern === 'breakbeat' && (i % 8 === 0 || i % 8 === 5)) kick = true;

            if (kick) events.push({ voice: 'v_kick', step: i, freq: 100, duration: 0.1, velocity: 0.8 });

            if (i % 8 === 4) events.push({ voice: 'v_snare', step: i, freq: 100, duration: 0.1, velocity: 0.7 });
            const hatDensity = ship && ship.components ? 0.5 + (ship.components.length * 0.05) : 0.5;
            if (i % 2 === 0 || (rng.next() < hatDensity && i % 2 !== 0)) events.push({ voice: 'v_hat', step: i, freq: 1000, duration: 0.05, velocity: 0.5 });
            
            if (kickPattern === 'driving' && i % 2 !== 0) events.push({ voice: 'v_ride', step: i, freq: 100, duration: 0.8, velocity: 0.6 });
        }
        
        events.push({ voice: 'v_crash', step: 0, freq: 100, duration: 1.5, velocity: 0.9 });
        
        return {
            events,
            style: 'Electronic',
            timeSignature: [4, 4],
            stepsPerMeasure: 16
        };
    }

    _generateProgression(baseFreq) {
        const progressions = [
            ['I', 'V', 'vi', 'IV'], 
            ['I', 'vi', 'IV', 'V'], 
            ['ii', 'V', 'I', 'vi'], 
            ['vi', 'IV', 'I', 'V'], 
            ['I', 'IV', 'V', 'IV']  
        ];
        
        const romanChords = this.geometry && this.geometry.RomanChords ? this.geometry.RomanChords : [];
        if (!romanChords.length) return [{ rootOffset: 0, intervals: [0, 4, 7], durationSteps: 64 }];

        const rng = new MusicRNG(baseFreq); 
        
        const sourceProgressions = (this.progressions && this.progressions.length > 0) ? this.progressions : progressions.map(p => ({ data: { Progression: p } }));
        
        const selectedItem = rng.pick(sourceProgressions);
        const progChords = selectedItem.data ? selectedItem.data.Progression : selectedItem;
        
        return progChords.map(name => {
            const chordDef = romanChords.find(c => c.Name === name) || romanChords[0];
            return {
                name: chordDef.Name,
                rootOffset: chordDef.Notes[0], 
                intervals: chordDef.Notes, 
                durationSteps: 16 
            };
        });
    }

    _generateBassline(rhythm, ship, progression, keyRootFreq, beatTime) {
        const events = [];
        
        // Fallback pattern if none loaded
        if (!this.bassPatterns || Object.keys(this.bassPatterns).length === 0) {
            let currentStepOffset = 0;
            progression.forEach(chord => {
                const chordRootFreq = keyRootFreq * Math.pow(2, chord.rootOffset / 12);
                for (let i = 0; i < chord.durationSteps; i += 4) {
                    events.push({ voice: 'v_bass', step: currentStepOffset + i, freq: chordRootFreq, duration: 0.2, velocity: 0.9 });
                }
                currentStepOffset += chord.durationSteps;
            });
            return events;
        }

        const rng = new MusicRNG(ship ? ship.name : 'bass');
        
        let style = rhythm.style || 'Rock';
        if (style === 'Driving') style = 'Action';
        if (style === 'BasicRock') style = 'Rock';
        if (style === 'FourOnFloor') style = 'Electronic';

        let patternKey = Object.keys(this.bassPatterns).find(k => this.bassPatterns[k].style === style) || 'Rock';
        const pattern = this.bassPatterns[patternKey];
        
        const intervals = pattern.intervals || [0];
        
        let currentStepOffset = 0;

        progression.forEach(chord => {
            const chordRootFreq = keyRootFreq * Math.pow(2, chord.rootOffset / 12);
            const stepsInChord = chord.durationSteps;

            const getFreq = (interval) => chordRootFreq * Math.pow(2, interval / 12);

        if (pattern.strategy === 'kick_lock') {
            const kickSteps = rhythm.events
                .filter(e => e.voice === 'v_kick' && e.step < stepsInChord)
                .map(e => e.step);

            kickSteps.forEach(step => {
                events.push({ voice: 'v_bass', step: currentStepOffset + step, freq: getFreq(0), duration: 0.2, velocity: 0.9 });
            });

            for (let i = 0; i < stepsInChord; i++) {
                if (!kickSteps.includes(i) && rng.next() < 0.3) {
                    const interval = rng.pick(intervals);
                    const octave = rng.next() > 0.7 ? 1 : 0;
                    events.push({ 
                        voice: 'v_bass', 
                        step: currentStepOffset + i, 
                        freq: getFreq(interval + (octave * 12)), 
                        duration: 0.1, 
                        velocity: 0.6 
                    });
                }
            }
        } 
        else if (pattern.strategy === 'walking') {
            const walkSteps = [0, 4, 8, 12];
            
            walkSteps.forEach((step, index) => {
                if (step >= stepsInChord) return;
                const currentInterval = (index === 0) ? 0 : rng.pick(intervals);
                
                events.push({ voice: 'v_bass', step: currentStepOffset + step, freq: getFreq(currentInterval), duration: beatTime * 0.9, velocity: 0.8 });
            });
        }
        else if (pattern.strategy === 'root_fifth') {
            if (stepsInChord >= 8) {
                events.push({ voice: 'v_bass', step: currentStepOffset + 0, freq: getFreq(0), duration: beatTime * 1.5, velocity: 0.9 });
                events.push({ voice: 'v_bass', step: currentStepOffset + 8, freq: getFreq(7), duration: beatTime * 1.5, velocity: 0.8 });
            }
        }
        else if (pattern.strategy === 'root_pump') {
            for (let i = 0; i < stepsInChord; i += 2) {
                events.push({ voice: 'v_bass', step: currentStepOffset + i, freq: getFreq(0), duration: 0.15, velocity: i % 4 === 0 ? 0.9 : 0.7 });
            }
        }
        else if (pattern.strategy === 'offbeat') {
            for (let i = 2; i < stepsInChord; i += 4) {
                events.push({ voice: 'v_bass', step: currentStepOffset + i, freq: getFreq(0), duration: 0.2, velocity: 0.8 });
            }
        }
        else {
            for (let i = 0; i < stepsInChord; i += 2) {
                if (rng.next() < pattern.density) {
                    const interval = rng.pick(intervals);
                    events.push({ voice: 'v_bass', step: currentStepOffset + i, freq: getFreq(interval), duration: 0.2, velocity: 0.8 });
                }
            }
            if (!events.find(e => e.step === currentStepOffset)) {
                events.push({ voice: 'v_bass', step: currentStepOffset, freq: getFreq(0), duration: 0.4, velocity: 1.0 });
            }
        }

            currentStepOffset += stepsInChord;
        });

        return events;
    }

    _generateHarmonics(rhythm, ship, progression, keyRootFreq) {
        const guitarEvents = [];
        const padEvents = [];
        
        if (!this.harmonicPatterns) return { guitar: [], pad: [] };

        const patternKey = Object.keys(this.harmonicPatterns).find(k => 
            this.harmonicPatterns[k].style === rhythm.style
        ) || 'Electronic';
        
        const pattern = this.harmonicPatterns[patternKey];
        if (!pattern) return { guitar: [], pad: [] };

        let currentStepOffset = 0;

        progression.forEach(chord => {
            const stepsInChord = chord.durationSteps;
            const chordFreqs = chord.intervals.map(semitone => keyRootFreq * Math.pow(2, semitone / 12));
            
        if (pattern.guitar) {
            pattern.guitar.steps.forEach(step => {
                if (step >= stepsInChord) return;
                const noteFreq = chordFreqs[step % chordFreqs.length]; 
                guitarEvents.push({
                    voice: 'v_guitar',
                    step: currentStepOffset + step,
                    freq: noteFreq,
                    duration: pattern.guitar.duration,
                    velocity: pattern.guitar.velocity
                });
            });
        }

        if (pattern.pad) {
            if (pattern.pad.behavior === 'sidechain') {
                padEvents.push({
                    voice: 'v_pad',
                    step: currentStepOffset,
                    freq: chordFreqs[0], 
                    duration: 4.0, 
                    velocity: 0.6,
                });
            } 
            else if (pattern.pad.behavior === 'snare_mirror') {
                const snareSteps = rhythm.events.filter(e => e.voice === 'v_snare' && e.step < stepsInChord).map(e => e.step);
                snareSteps.forEach(step => {
                    const noteFreq = chordFreqs[1] || chordFreqs[0]; 
                    padEvents.push({
                        voice: 'v_pad',
                        step: currentStepOffset + step,
                        freq: noteFreq,
                        duration: pattern.pad.duration,
                        velocity: pattern.pad.velocity
                    });
                });
            }
            else if (pattern.pad.behavior === 'kick_lock') {
                const kickSteps = rhythm.events.filter(e => e.voice === 'v_kick' && e.step < stepsInChord).map(e => e.step);
                kickSteps.forEach(step => {
                    const noteFreq = chordFreqs[0] / 2; 
                    padEvents.push({
                        voice: 'v_pad',
                        step: currentStepOffset + step,
                        freq: noteFreq,
                        duration: pattern.pad.duration,
                        velocity: pattern.pad.velocity
                    });
                });
            }
            else {
                pattern.pad.steps.forEach(step => {
                    if (step >= stepsInChord) return;
                    const noteFreq = chordFreqs[0];
                    padEvents.push({
                        voice: 'v_pad',
                        step: currentStepOffset + step,
                        freq: noteFreq,
                        duration: pattern.pad.duration,
                        velocity: pattern.pad.velocity
                    });
                });
            }
        }
            currentStepOffset += stepsInChord;
        });

        return { guitar: guitarEvents, pad: padEvents };
    }

    playTrack(trackId) {
        const track = this.manifestManager.manifest.tracks[trackId] || null;
        if (!track) {
        }

        const data = this.manifestManager.manifest.tracks[trackId];
        if (data) {
        }
    }

    playTrackObject(track) {
        if (!this.synth) return;
        
        // If we are already playing this track name, we might just want to update it
        // But playTrackObject implies starting fresh.
        if (this.currentTrackName && this.currentTrackName !== track.name) {
             this.stopTrack();
        }
        
        this.currentTrack = track;
        this.currentTrackName = track.name;
        Logger.message(`Playing Track: ${track.name}`);

        if (!track.bpm || track.bpm <= 0) {
            Logger.error(`T13NE_Music: Invalid BPM (${track.bpm}) in track ${track.name}. Playback aborted.`);
            return;
        }

        const timeSignature = track.timeSignature || [4, 4];
        const measures = track.measures || 1;
        const stepTime = (60 / track.bpm) / 4;
        const lookahead = 3.0; // Increased to 3.0s to prevent stalling during heavy procgen
        let currentStep = 0;
        let nextStepTime = this.synth.ctx.currentTime + 0.1;

        if (this.currentSequenceTimer) clearTimeout(this.currentSequenceTimer);

        const schedule = () => {
            // Ensure AudioContext is running (auto-resume if suspended)
            if (this.synth.ctx.state === 'suspended') {
                this.synth.ctx.resume();
            }

            const now = this.synth.ctx.currentTime;
            let iterations = 0;

            while (nextStepTime < now + lookahead) {
                if (iterations++ > 200) {
                    Logger.warn("T13NE_Music: Scheduler loop limit reached. Resyncing.");
                    nextStepTime = now + 0.1;
                    break;
                }
                // Use this.currentTrack so updates are reflected immediately
                this.currentTrack.voices.forEach(voice => {
                    if (voice.mute) return;
                    voice.sequence.forEach(note => {
                        if (note.step === currentStep) {
                            this.synth.playNote(
                                note.freq || this.synth.instrumentEngine._freqFromNote(note.note), 
                                nextStepTime, 
                                note.duration, 
                                'Piano', 
                                0, 
                                voice.instrument, 
                                voice.id 
                            );
                        }
                    });
                });

                nextStepTime += stepTime;
                currentStep++;

                const totalSteps = track.totalSteps || (measures * timeSignature[0] * 4);
                if (totalSteps > 0 && currentStep >= totalSteps) currentStep = 0;
            }
            this.currentSequenceTimer = setTimeout(schedule, 100); 
        };

        if (!document.getElementById('audio-debug-viz')) {
            this.createDebugVisualizer();
        }

        schedule();
    }

    /**
     * Updates the currently playing track with new data (e.g. new voices)
     * without stopping playback.
     */
    updateTrack(track) {
        if (this.currentTrack && this.currentTrack.name === track.name) {
            this.currentTrack.voices = track.voices;
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
                
                // Calculate RMS to detect silence
                let sum = 0;
                for(let k = 0; k < data.length; k++) {
                    const val = (data[k] - 128) / 128.0;
                    sum += val * val;
                }
                const rms = Math.sqrt(sum / data.length);

                const y = i * h;
                
                ctx.fillStyle = '#0f0';
                ctx.font = '10px monospace';
                ctx.fillText(name, 2, y + 10);
                
                // Only draw waveform if there is signal
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
                    // Draw flat line for silence
                    ctx.strokeStyle = '#004400';
                    ctx.beginPath();
                    ctx.moveTo(0, y + h/2);
                    ctx.lineTo(canvas.width, y + h/2);
                    ctx.stroke();
                }
            });
        };
        draw();
    }

    // ... (rest of the file remains unchanged) ...
    stopTrack() {
        if (this.currentSequenceTimer) clearTimeout(this.currentSequenceTimer);
        this.currentTrackName = null;
    }
    saveSequence(name, sequence) {
        const data = { name, sequence, timestamp: Date.now() };
        this.manifestManager.addToManifest('sequences', name, { filename: `${name}.json` });
        Logger.message(`T13NE_Music: Sequence '${name}' ready for export.`);
        return JSON.stringify(data, null, 2);
    }

    saveTrack(name, trackData) {
        const data = { name, ...trackData, timestamp: Date.now() };
        this.manifestManager.addToManifest('tracks', name, { filename: `${name}.json` });
        return JSON.stringify(data, null, 2);
    }

    saveMidi(name, notes) {
        const data = { name, notes, timestamp: Date.now() };
        this.manifestManager.addToManifest('midi', name, { filename: `${name}.json` });
        return JSON.stringify(data, null, 2);
    }

    saveLoop(name, loopData) {
        const data = { name, ...loopData, timestamp: Date.now() };
        this.manifestManager.addToManifest('loops', name, { filename: `${name}.json` });
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

    _parseTonalPattern(patternString = '') {
        const intervals = [];
        if (!patternString) return [2, 2, 1, 2, 2, 2, 1]; 

        const re = /(\d+)\((\d+)\)/;
        const match = patternString.match(re);

        if (match) {
            patternString = match[1] + match[2];
        }

        for (const char of patternString) {
            if (char === 'S') intervals.push(1);
            else if (char === 'T') intervals.push(2);
            else if (!isNaN(parseInt(char, 10))) intervals.push(parseInt(char, 10));
        }
        return intervals;
    }

    _getTonalMode(characterGeo) {
        if (!this.tonalModes.length || !characterGeo) return null;
        const modeName = characterGeo.GeoHarmonics?.Mode || 'Ionian/Major';
        const found = this.tonalModes.find(m => {
            const type = m.data ? m.data.Type : m.Type;
            return type === modeName;
        });
        return found ? (found.data || found) : null;
    }

    _getMelodicIntervalDistribution(scaleIntervals) {
        const distribution = {};
        if (scaleIntervals.length < 2) return distribution;

        for (let i = 0; i < scaleIntervals.length - 1; i++) {
            const interval = scaleIntervals[i + 1] - scaleIntervals[i];
            if (interval > 0) {
                distribution[interval] = (distribution[interval] || 0) + 1;
            }
        }
        const lastInterval = 12 - scaleIntervals[scaleIntervals.length - 1];
        if (lastInterval > 0) {
            distribution[lastInterval] = (distribution[lastInterval] || 0) + 1;
        }

        return distribution;
    }

    _generateMarkovTransitions(scaleIntervals, harmonicStepDistribution = {}) {
        const matrix = [];
        const preferredIntervals = new Map();
        for (const interval in harmonicStepDistribution) {
            const i = parseInt(interval, 10);
            const count = harmonicStepDistribution[interval];
            preferredIntervals.set(i, (preferredIntervals.get(i) || 0) + count);
            const descending = (12 - i) % 12;
            if (descending !== 0) {
                preferredIntervals.set(descending, (preferredIntervals.get(descending) || 0) + count);
            }
        }

        for (let i = 0; i < scaleIntervals.length; i++) {
            const fromInterval = scaleIntervals[i];
            const weights = [];
            let totalWeight = 0;

            for (let j = 0; j < scaleIntervals.length; j++) {
                const toInterval = scaleIntervals[j];
                const melodicInterval = (toInterval - fromInterval + 12) % 12;

                let weight = 1.0;

                if (melodicInterval === 0) { 
                    weight += 1.5;
                } else if (melodicInterval === 1 || melodicInterval === 2 || melodicInterval === 10 || melodicInterval === 11) { 
                    weight += 2.0;
                }

                if (preferredIntervals.has(melodicInterval)) {
                    weight += 4.0 * preferredIntervals.get(melodicInterval);
                }

                if (melodicInterval === 6 && !preferredIntervals.has(6)) {
                    weight *= 0.1;
                }
                weights.push(weight);
                totalWeight += weight;
            }

            matrix[i] = weights.map(w => w / totalWeight);
        }
        return matrix;
    }

    getCharacterComposition(character, options = {}) {
        if (!character || !character.name) return null;

        if (!this.geometry && this.t13ne) {
            this.geometry = this.t13ne.getModule('T13Geometry');
        }

        const useCharacterHarmonics = options.useCharacterHarmonics !== false; 

        const cacheKey = `${character.id || character.name}_${useCharacterHarmonics}`;
        if (this.compositionCache.has(cacheKey)) return this.compositionCache.get(cacheKey);

        let geo = character.geometry;
        if (!geo && this.geometry) {
            geo = this.geometry.calculateFullGeo(character.name);
        }
        if (!geo) return null;

        const rng = new MusicRNG(character.name);
        const keyNum = geo.GeoHarmonics ? geo.GeoHarmonics.key : geo.GeometryNumber;
        
        if (!this.geometry) {
            Logger.warn("T13NE_Music: Geometry module missing, cannot generate composition.");
            return null;
        }
        const keyData = this.geometry.getKey(keyNum);
        const baseFreq = keyData.Key.Frequency;
        const rootKeyIndex = CHROMATIC_SCALE.indexOf(keyData.Key.Key);

        const tonalMode = this._getTonalMode(geo);
        const tonalPattern = this._parseTonalPattern(tonalMode?.Pattern); 
        const allowedScaleIntervals = [0];
        let cumulativeInterval = 0;
        for (const step of tonalPattern) {
            cumulativeInterval += step;
            if (cumulativeInterval < 12) {
                allowedScaleIntervals.push(cumulativeInterval);
            }
        }

        let harmonicStepDistribution = {};
        if (useCharacterHarmonics) {
            const harmonics = geo.GeoHarmonics ? geo.GeoHarmonics.Harmonic : [1, 3, 5, 8];
            const harmonicIntervals = [...new Set(harmonics.map(h => (h - 1) % 12))];
            if (!harmonicIntervals.includes(0)) {
                harmonicIntervals.push(0);
            }
            harmonicIntervals.sort((a, b) => a - b);
            harmonicStepDistribution = this._getMelodicIntervalDistribution(harmonicIntervals);
        }

        const transitionMatrix = this._generateMarkovTransitions(allowedScaleIntervals, harmonicStepDistribution);

        const length = rng.range(8, 16);
        const sequence = [];
        const noteDurations = [0.25, 0.5, 1.0];
        let currentNoteIndex = 0; 

        for (let i = 0; i < length; i++) {
            const probabilities = transitionMatrix[currentNoteIndex];
            const random = rng.next();
            let cumulativeProb = 0;
            let nextNoteIndex = 0;
            for (let j = 0; j < probabilities.length; j++) {
                cumulativeProb += probabilities[j];
                if (random < cumulativeProb) {
                    nextNoteIndex = j;
                    break;
                }
            }

            const interval = allowedScaleIntervals[nextNoteIndex];
            const finalPitchIndex = (rootKeyIndex + interval) % 12;
            const pitchName = CHROMATIC_SCALE[finalPitchIndex];
            const octaveOffset = rng.pick([0, 0, 1]);
            const freq = baseFreq * Math.pow(2, (interval + (octaveOffset * 12)) / 12);

            sequence.push({
                freq: freq,
                duration: rng.pick(noteDurations),
                interval: interval,
                pitchName: pitchName
            });
            currentNoteIndex = nextNoteIndex;
        }

        const composition = {
            name: `${character.name}'s Theme`,
            key: keyData.Key.Key,
            baseFreq: baseFreq,
            scale: allowedScaleIntervals,
            sequence: sequence,
            tempo: 100 + (geo.Facade * 2)
        };

        this.compositionCache.set(cacheKey, composition);
        return composition;
    }

    playCharacterComposition(character, listener = null, instrument = null) {
        if (!this.synth) return;
        const motif = this.getCharacterComposition(character);
        if (!motif) return;

        const preferredInstrument = instrument || this._getInstrumentForRole('lead', character.geometry) || 'Piano';

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
        if (!entity || !entity.name) return null;

        const entityType = entity.constructor.name; 
        const cacheKey = `${entityType}_${entity.id || entity.name}`;
        if (this.compositionCache.has(cacheKey)) {
            return this.compositionCache.get(cacheKey);
        }

        let compositionData = null;

        if (entity.geometry && entity.type) { 
            switch (entity.type) {
                case 'Extra':
                    compositionData = this._generateChant(entity);
                    break;
                case 'Grunt':
                    compositionData = this._generateMarch(entity);
                    break;
                case 'Hero':
                    compositionData = this._generateAria(entity);
                    break;
                case 'Yarn-Teller':
                    compositionData = this._generateSolo(entity);
                    break;
                case 'Lite':
                    compositionData = this._generateLeitmotif(entity);
                    break;
                case 'Archetype':
                    compositionData = this._generateAnthem(entity);
                    break;
                default:
                    compositionData = this.getCharacterComposition(entity);
                    break;
            }
        } else if (entity.isLocation) { 
            compositionData = this._generateSymphony(entity);
        } else if (entity.isPact) { 
            compositionData = this._generateOpera(entity);
        } else if (entity.isDescendant) { 
            compositionData = entity.isUnique ? this._generateRefrain(entity) : this._generateJingle(entity);
        }

        if (compositionData) {
            Logger.message(`T13NE_Music: Generated composition '${compositionData.name}' for ${entity.name}`);
            this.compositionCache.set(cacheKey, compositionData);
        }

        return compositionData;
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
                freq = this._noteToFreq(evt.note);
            }

            const durationSecs = evt.duration * 4 * stepTime; 

            this.synth.playNote(freq, startTime, durationSecs, 'sine', 0, track.instrument);
        });
    }

    _noteToFreq(note) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = parseInt(note.slice(-1));
        const keyNumber = notes.indexOf(note.slice(0, -1));
        if (keyNumber < 0) return 440;
        return 440 * Math.pow(2, ((keyNumber + ((octave - 4) * 12)) - 9) / 12);
    }

    saveTrack(name, instrumentId, sequence, settings = {}) {
        const data = {
            name,
            instrument: instrumentId,
            sequence,
            bpm: settings.bpm || 120,
            timeSignature: settings.timeSignature || [4, 4],
            measures: settings.measures || 2,
            timestamp: Date.now()
        };
        this.manifestManager.addToManifest('tracks', name, { filename: `${name}.json` });
        return JSON.stringify(data, null, 2);
    }

    saveStem(name, voiceData) {
        const data = {
            name,
            instrument: voiceData.instrument,
            sequence: voiceData.sequence,
            timestamp: Date.now()
        };
        this.manifestManager.addToManifest('stems', name, { filename: `${name}.json` });
        return JSON.stringify(data, null, 2);
    }

    _generateChant(character) {
        const composition = this.getCharacterComposition(character);
        composition.name = `${character.name}'s Chant`;
        composition.sequence = composition.sequence.map(note => ({ ...note, freq: composition.baseFreq, duration: 1.0 }));
        composition.type = 'Chant';
        return composition;
    }

    _generateMarch(character) {
        const composition = this.getCharacterComposition(character);
        composition.name = `${character.name}'s March`;
        composition.tempo = 120;
        composition.sequence = composition.sequence.map(note => ({ ...note, duration: 0.5 }));
        composition.type = 'March';
        return composition;
    }

    _generateAria(hero) {
        const composition = this.getCharacterComposition(hero);
        composition.name = `${hero.name}'s Aria`;
        composition.tempo = 80; 
        composition.type = 'Aria';
        return composition;
    }

    _generateSolo(yarnTeller) {
        const composition = this.getCharacterComposition(yarnTeller);
        composition.name = `${yarnTeller.name}'s Solo`;
        composition.tempo = 160; 
        const extraNotes = this.getCharacterComposition({ ...yarnTeller, name: yarnTeller.name + '_extra' }).sequence;
        composition.sequence = composition.sequence.concat(extraNotes);
        composition.type = 'Solo';
        return composition;
    }

    _generateLeitmotif(character) {
        const composition = this.getCharacterComposition(character);
        composition.name = `${character.name}'s Leitmotif`;
        composition.sequence = composition.sequence.slice(0, 4); 
        composition.type = 'Leitmotif';
        return composition;
    }

    _generateAnthem(character) {
        const composition = this.getCharacterComposition(character);
        composition.name = `${character.name}'s Anthem`;
        composition.tempo = 70; 
        composition.type = 'Anthem';
        return composition;
    }

    _generateSymphony(location) {
        const geo = this.geometry.calculateFullGeo(location.name);
        const keyData = this.geometry.getKey(geo.GeoHarmonics.key);
        return {
            name: `${location.name} Symphony`,
            type: 'Symphony',
            key: keyData.Key.Key,
            tempo: 90,
            stems: {
                base: `path/to/music/${location.name}_base.ogg`,
                percussion_low: `path/to/music/${location.name}_perc_low.ogg`,
                percussion_high: `path/to/music/${location.name}_perc_high.ogg`,
                harmony: `path/to/music/${location.name}_harmony.ogg`,
                melody: `path/to/music/${location.name}_melody.ogg`,
                danger: `path/to/music/${location.name}_danger.ogg`,
            }
        };
    }

    _generateOpera(pact) {
        const composition = {
            name: `${pact.name}'s Opera`,
            type: 'Opera',
            tempo: 110,
            key: 'C', 
            themes: {}
        };

        pact.members.forEach(member => {
            composition.themes[member.name] = this.getCharacterComposition(member);
        });

        return composition;
    }

    _generateRefrain(descendant) {
        const composition = this.getCharacterComposition({ name: descendant.name }, { useCharacterHarmonics: false }); 
        composition.name = `${descendant.name}'s Refrain`;
        composition.type = 'Refrain';
        return composition;
    }

    _generateJingle(descendant) {
        const composition = this.getCharacterComposition({ name: descendant.name }, { useCharacterHarmonics: false });
        composition.name = `${descendant.name}'s Jingle`;
        composition.type = 'Jingle';
        composition.sequence = composition.sequence.slice(0, 3); 
        composition.tempo = 130;
        return composition;
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
            Logger.message(`T13NE_Music: Updating layers. Tension: ${tension}. Start: [${layersToStart.join(', ')}]. Stop: [${layersToStop.join(', ')}]`);
        }

        layersToStart.forEach(layerName => {
            this.synth.playLayer(layerName, this.musicPack[layerName], 0.5, true, 4.0);
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
}


export default new T13NE_Music();