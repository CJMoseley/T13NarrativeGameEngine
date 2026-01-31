import Logger from "../../core/Logger.js";
import T13NE from '../../T13NE.js';
import CodexLoader from "../codex/CodexLoader.js";

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const KEY_INSTRUMENT_MAP = {
    'C': 'Cello', 'C#': 'Tuba', 'D': 'Oboe', 'D#': 'Flute',
    'E': 'Trumpet', 'F': 'French Horn', 'F#': 'Clarinet', 'G': 'Violin',
    'G#': 'Viola', 'A': 'Piano', 'A#': 'Harpsichord', 'B': 'Harp'
};

/**
 * Simple Seeded RNG for deterministic music generation.
 */
class MusicRNG {
    constructor(seed) {
        this.seed = typeof seed === 'string' ? this._hashString(seed) : (seed || Date.now());
    }

    _hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }

    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }

    pick(array) {
        return array[Math.floor(this.next() * array.length)];
    }

    range(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}

/**
 * Manages the loading and tracking of audio assets via a manifest.
 */
class AudioManifestManager {
    constructor() {
        this.manifest = {
            samples: {},
            sequences: {},
            tracks: {},
            midi: {},
            loops: {},
            stems: {},
            instruments: {}
        };
        this.basePath = '/data/media/audio';
    }

    async loadManifest() {
        try {
            const response = await fetch(`${this.basePath}/audio_assets_manifest.json`);
            if (response.ok) {
                this.manifest = await response.json();
                Logger.message("AudioManifestManager: Manifest loaded.");
            } else {
                Logger.warn("AudioManifestManager: No manifest found, starting fresh.");
            }
        } catch (e) {
            Logger.warn("AudioManifestManager: Failed to load manifest.", e);
        }
    }

    addToManifest(category, id, metadata) {
        if (!this.manifest[category]) this.manifest[category] = {};
        this.manifest[category][id] = metadata;
        // In a real backend, we would save the manifest here.
        // Since this is client-side, we can only log the updated JSON for the user to save.
        Logger.message(`Updated Manifest: \n${JSON.stringify(this.manifest, null, 2)}`);
    }

    getAssetPath(category, id) {
        const item = this.manifest[category]?.[id];
        return item ? `${this.basePath}/${category}/${item.filename}` : null;
    }

    getAssetAnalysis(category, id) {
        return this.manifest[category]?.[id]?.analysis || null;
    }

    updateAssetAnalysis(category, id, analysis) {
        if (this.manifest[category]?.[id]) {
            this.manifest[category][id].analysis = analysis;
        }
    }
}

/**
 * Handles Complex Additive Synthesis.
 */
class AdditiveProcessor {
    constructor(audioContext) {
        this.ctx = audioContext;
    }

    /**
     * Creates a custom periodic wave from partials.
     * @param {Array<{real: number, imag: number}>} partials - Fourier coefficients.
     */
    createCustomWave(partials) {
        const real = new Float32Array(partials.length + 1);
        const imag = new Float32Array(partials.length + 1);

        partials.forEach((p, i) => {
            real[i + 1] = p.real || 0;
            imag[i + 1] = p.imag || 0;
        });

        return this.ctx.createPeriodicWave(real, imag);
    }

    createSynthFromAnalysis(analysis, depth = 'medium') {
        const fundamental = analysis.freq || 440;

        let partialCount = 5;
        if (depth === 'low') partialCount = 3;
        if (depth === 'high') partialCount = 12;
        if (depth === 'full') partialCount = 32;

        let partials = [];

        // CHECK 1: Do we have real FFT data?
        if (analysis.peaks && analysis.peaks.length > 0) {
            // Use real peaks!
            // We need to normalize them relative to fundamental?
            // Ideally we express them as harmonic ratios for wavetable synthesis

            // Take top N peaks (sorted by amp in analyzer)
            const usedPeaks = analysis.peaks.slice(0, partialCount);

            // Convert absolute freq to harmonic multiple of fundamental
            partials = usedPeaks.map(p => ({
                freq: p.freq / fundamental, // e.g. 440/440=1, 880/440=2
                amp: p.amp,
                decay: 1.0 / Math.pow(p.freq / fundamental, 0.5) // Guess decay
            }));

        } else {
            // Fallback: Procedural generation
            for (let i = 1; i <= partialCount; i++) {
                let amp = 1.0 / i;
                if (depth === 'full' && i % 2 === 0) amp *= 0.5;

                partials.push({
                    freq: i,
                    amp: amp,
                    decay: 1.0 / Math.pow(i, 0.5)
                });
            }
        }

        return {
            type: 'additive',
            algorithm: 'custom',
            depth: depth,
            partials: partials
        };
    }

    // Updated createBellTone to be more generic 'playAdditiveTone'
    playAdditiveTone(frequency, time, duration, destination, partials, envelope = 'percussive') {
        if (!Number.isFinite(frequency) || frequency <= 0) return;
        if (!partials) {
            // Default bell if no partials
            partials = [
                { freq: 1.0, amp: 1.0, decay: 1.0 },
                { freq: 2.0, amp: 0.6, decay: 0.9 },
                { freq: 3.0, amp: 0.4, decay: 0.8 },
                { freq: 4.2, amp: 0.25, decay: 0.7 },
                { freq: 5.4, amp: 0.2, decay: 0.6 }
            ];
        }

        partials.forEach(p => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.frequency.value = frequency * p.freq;
            osc.connect(gain);
            gain.connect(destination);

            const peakGain = p.amp * 0.2;

            if (envelope === 'sustained') {
                // Sustained Envelope (Attack - Sustain - Release)
                const attackTime = Math.min(0.1, duration * 0.4); // Safety: Ensure attack fits within duration
                const releaseTime = 0.2;
                
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(peakGain, time + attackTime);
                gain.gain.setValueAtTime(peakGain, time + duration);
                gain.gain.exponentialRampToValueAtTime(0.001, time + duration + releaseTime);
                gain.gain.linearRampToValueAtTime(0, time + duration + releaseTime + 0.05); // Ensure silence
                
                osc.start(time);
                osc.stop(time + duration + releaseTime + 0.1);
            } else {
                // Percussive Envelope (Attack - Decay) with minimum duration check
                const attackTime = 0.01;
                const decayDuration = Math.max(0.05, duration * (p.decay || 1.0)); // Minimum 50ms to avoid clicks
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(peakGain, time + attackTime);
                gain.gain.exponentialRampToValueAtTime(0.001, time + attackTime + decayDuration);
                gain.gain.linearRampToValueAtTime(0, time + attackTime + decayDuration + 0.05); // Ensure silence
                
                osc.start(time);
                osc.stop(time + attackTime + decayDuration + 0.1);
            }
        });
    }
}

/**
 * Manages Instrument Definitions and Playback.
 * Supports Sample-based, Subtractive, and Additive instruments.
 */
class InstrumentEngine {
    constructor(audioContext) {
        this.ctx = audioContext;
        this.instruments = new Map();
        this.samples = new Map();
        this.additive = new AdditiveProcessor(audioContext);

        // Default Instruments
        this.defineInstrument('sine', { type: 'synth', oscType: 'sine' });
        this.defineInstrument('saw', { type: 'synth', oscType: 'sawtooth' });
        this.defineInstrument('bell', { type: 'additive', algorithm: 'bell' });

        // Orchestral Definitions (Approximations)
        // Cello: Rich, warm, with emphasis on lower harmonics
        this.defineInstrument('Cello', { 
            type: 'additive', 
            algorithm: 'custom', 
            envelope: 'sustained',
            partials: [
                { freq: 1, amp: 1.0, decay: 1.5 },
                { freq: 2, amp: 0.8, decay: 1.2 },
                { freq: 3, amp: 0.6, decay: 1.0 },
                { freq: 4, amp: 0.4, decay: 0.8 },
                { freq: 5, amp: 0.3, decay: 0.6 }
            ] 
        });

        // Tuba: Deep, brassy
        this.defineInstrument('Tuba', { 
            type: 'additive', 
            algorithm: 'custom', 
            envelope: 'sustained',
            partials: [
                { freq: 1, amp: 1.0, decay: 0.8 },
                { freq: 2, amp: 0.7, decay: 0.6 },
                { freq: 3, amp: 0.4, decay: 0.4 },
                { freq: 4, amp: 0.2, decay: 0.3 }
            ] 
        });

        // Oboe: Nasal, rich in odd harmonics
        this.defineInstrument('Oboe', { 
            type: 'additive', 
            algorithm: 'custom', 
            envelope: 'sustained',
            partials: [
                { freq: 1, amp: 0.4, decay: 0.5 },
                { freq: 2, amp: 0.1, decay: 0.5 },
                { freq: 3, amp: 1.0, decay: 0.5 }, // Strong 3rd harmonic
                { freq: 4, amp: 0.1, decay: 0.5 },
                { freq: 5, amp: 0.5, decay: 0.4 }
            ] 
        });

        this.defineInstrument('Flute', { type: 'additive', algorithm: 'custom', envelope: 'sustained', partials: [{freq:1, amp:1, decay:0.5}, {freq:2, amp:0.2, decay:0.3}] });
        this.defineInstrument('Trumpet', { type: 'additive', algorithm: 'custom', envelope: 'sustained', partials: [{freq:1, amp:1, decay:0.2}, {freq:2, amp:0.8, decay:0.2}, {freq:3, amp:0.6, decay:0.2}, {freq:4, amp:0.4, decay:0.2}] });
        this.defineInstrument('French Horn', { type: 'additive', algorithm: 'custom', envelope: 'sustained', partials: [{freq:1, amp:1, decay:0.8}, {freq:2, amp:0.5, decay:0.7}, {freq:3, amp:0.3, decay:0.6}] });
        this.defineInstrument('Clarinet', { type: 'additive', algorithm: 'custom', envelope: 'sustained', partials: [{freq:1, amp:1, decay:0.6}, {freq:3, amp:0.5, decay:0.5}, {freq:5, amp:0.3, decay:0.4}] }); // Odd harmonics
        
        this.defineInstrument('Violin', { 
            type: 'additive', 
            algorithm: 'custom', 
            envelope: 'sustained',
            partials: [
                { freq: 1, amp: 1.0, decay: 1.0 },
                { freq: 2, amp: 0.5, decay: 0.9 },
                { freq: 3, amp: 0.3, decay: 0.8 },
                { freq: 4, amp: 0.2, decay: 0.7 },
                { freq: 5, amp: 0.2, decay: 0.6 },
                { freq: 6, amp: 0.1, decay: 0.5 }
            ] 
        });

        this.defineInstrument('Viola', { type: 'additive', algorithm: 'custom', envelope: 'sustained', partials: [{freq:1, amp:1, decay:1.2}, {freq:2, amp:0.6, decay:1.0}, {freq:3, amp:0.4, decay:0.8}] });
        this.defineInstrument('Piano', { type: 'additive', algorithm: 'custom', envelope: 'percussive', partials: [{freq:1, amp:1, decay:2.0}, {freq:2, amp:0.4, decay:1.5}, {freq:3, amp:0.2, decay:1.0}, {freq:4, amp:0.1, decay:0.8}] });
        this.defineInstrument('Harpsichord', { type: 'additive', algorithm: 'custom', partials: [{freq:1, amp:0.6, decay:0.5}, {freq:2, amp:1.0, decay:0.4}, {freq:3, amp:0.5, decay:0.3}, {freq:4, amp:0.3, decay:0.2}] });
        this.defineInstrument('Harp', { type: 'additive', algorithm: 'custom', partials: [{freq:1, amp:1, decay:3.0}, {freq:2, amp:0.5, decay:2.5}, {freq:3, amp:0.2, decay:2.0}] });

        // Create a noise buffer for percussion
        const bufferSize = this.ctx.sampleRate * 2.0; // 2 seconds of noise
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    createSyntheticInstrument(sourceId, newId, depth = 'medium', envelope = 'percussive') {
        // 1. Get Analysis
        const analysis = this.manifestManager.getAssetAnalysis('samples', sourceId);
        if (!analysis) {
            Logger.warn(`Cannot synthesize '${sourceId}': no analysis data.`);
            return;
        }

        // 2. Generate Definition via Additive Processor
        const def = this.additive.createSynthFromAnalysis(analysis, depth);
        def.envelope = envelope;

        // 3. Register locally
        this.defineInstrument(newId, def);

        // 4. Save to Manifest (instruments category)
        // We add a new category 'instruments' to manifest for these synthetic definitions
        this.manifestManager.addToManifest('instruments', newId, {
            definition: def,
            source: sourceId,
            timestamp: Date.now()
        });

        Logger.message(`Created Synthetic Instrument '${newId}' (Depth: ${depth})`);
        return newId;
    }

    async loadSample(id, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.samples.set(id, audioBuffer);

            // Detect Pitch/Key if not already present in manifest
            let analysis = this.manifestManager.getAssetAnalysis('samples', id);

            if (!analysis) {
                if (!this.analyzer) {
                    // Lazy load analyzer (assuming it's imported or globally avail, or simple inline fallback)
                    // For now, use the inline logic we just replaced or import the module
                    analysis = this.inlineAnalyze(audioBuffer);
                } else {
                    analysis = await this.analyzer.analyze(audioBuffer);
                }
                // Save back to manifest runtime cache
                this.manifestManager.updateAssetAnalysis('samples', id, analysis);
            }

            this.defineInstrument(id, {
                type: 'sampler',
                sampleId: id,
                baseFreq: analysis.freq,
                key: analysis.note
            });
            Logger.message(`InstrumentEngine: Loaded sample '${id}' (Key: ${analysis.note})`);
            return true;
        } catch (e) {
            Logger.error(`InstrumentEngine: Failed to load sample '${id}'`, e);
            return false;
        }
    }

    // Renaming old analyzeBuffer to inlineAnalyze for fallback
    inlineAnalyze(buffer) {
        // Simple time-domain zero-crossing or auto-correlation for fundamental freq
        // For short samples, simple autocorrelation is often enough.
        const data = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;

        // Analyze first 0.5s or full buffer
        const size = Math.min(data.length, sampleRate * 0.5);
        const slice = data.slice(0, size);

        const freq = this._autoCorrelate(slice, sampleRate);
        const note = this._freqToNote(freq);
        return { freq, note };
    }

    _autoCorrelate(buf, sampleRate) {
        let size = buf.length;
        let rms = 0;
        for (let i = 0; i < size; i++) {
            const val = buf[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / size);
        if (rms < 0.01) return -1; // Too quiet

        let r1 = 0, r2 = size - 1, thres = 0.2;
        for (let i = 0; i < size / 2; i++) {
            if (Math.abs(buf[i]) < thres) { r1 = i; break; }
        }
        for (let i = 1; i < size / 2; i++) {
            if (Math.abs(buf[size - i]) < thres) { r2 = size - i; break; }
        }

        buf = buf.slice(r1, r2);
        size = buf.length;

        const c = new Array(size).fill(0);
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size - i; j++) {
                c[i] = c[i] + buf[j] * buf[j + i];
            }
        }

        let d = 0;
        while (c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < size; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        let T0 = maxpos;

        // Parabolic interpolation
        // ... (simplified for now, just return sampleRate / T0)
        return sampleRate / T0;
    }

    _freqToNote(freq) {
        if (!freq || freq <= 0) return 'Unknown';
        const A4 = 440;
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const c0 = A4 * Math.pow(2, -4.75);
        const name = notes[Math.round(12 * Math.log2(freq / c0)) % 12];
        const oct = Math.floor(12 * Math.log2(freq / c0) / 12);
        return name + oct;
    }

    _freqFromNote(note) {
        if (!note) return 0;
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const matches = note.match(/([A-G][#b]?)(\d+)/);
        if (!matches) return 440; // Default fallback

        let name = matches[1];
        const octave = parseInt(matches[2]);

        // Handle flats by converting to previous sharp
        if (name.endsWith('b')) {
            const base = name.charAt(0);
            const baseIndex = notes.indexOf(base);
            // Move down one semitone, wrapping around
            const sharpIndex = (baseIndex - 1 + 12) % 12;
            name = notes[sharpIndex];
        }

        const semitone = notes.indexOf(name);

        // C0 is 16.35, A4 is 440
        // A4 = index 9 in octave 4.
        // steps from A4 = (octave - 4)*12 + (semitone - 9)
        const steps = (octave - 4) * 12 + (semitone - 9);
        return 440 * Math.pow(2, steps / 12);
    }

    defineInstrument(id, definition) {
        this.instruments.set(id, definition);
    }

    playNote(instrumentId, frequency, time, duration, velocity = 0.5, destination) {
        const inst = this.instruments.get(instrumentId);
        if (!inst) {
            // Fallback
            return this.playSynthNote(frequency, time, duration, 'sine', velocity, destination);
        }

        switch (inst.type) {
            case 'sampler':
                this.playSampleNote(inst.sampleId, frequency, time, duration, velocity, destination);
                break;
            case 'additive':
                // If algorithm is 'bell', use the default bell partials, otherwise use custom partials
                if (inst.algorithm === 'bell') {
                    this.additive.playAdditiveTone(frequency, time, duration, destination, null, inst.envelope); // partials will default
                } else if (inst.partials) {
                    this.additive.playAdditiveTone(frequency, time, duration, destination, inst.partials, inst.envelope);
                } else {
                    // Fallback for additive if no algorithm or partials specified
                    this.additive.playAdditiveTone(frequency, time, duration, destination, null, inst.envelope);
                }
                break;
            case 'noise':
                this.playNoiseNote(time, duration, velocity, destination, inst);
                break;
            case 'synth':
            default:
                this.playSynthNote(frequency, time, duration, inst.oscType, velocity, destination, inst);
                break;
        }
    }

    playSynthNote(frequency, time, duration, type, velocity, destination, params = {}) {
        if (!Number.isFinite(frequency) || frequency <= 0) return;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();

        osc.type = type || 'sine';
        
        // Pitch Envelope (Crucial for Kicks/Drums)
        if (params.pitchEnv) {
            const startFreq = params.pitchEnv.startMult ? frequency * params.pitchEnv.startMult : frequency;
            const dropTime = params.pitchEnv.time || 0.1;
            osc.frequency.setValueAtTime(startFreq, time);
            osc.frequency.exponentialRampToValueAtTime(frequency, time + dropTime);
        } else {
            osc.frequency.value = frequency;
        }

        osc.connect(env);
        // Filter Support
        let source = osc;
        if (params.filterType) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = params.filterType;
            filter.frequency.value = params.filterFreq || 1000;
            if (params.filterQ) filter.Q.value = params.filterQ;
            osc.connect(filter);
            source = filter;
        }

        source.connect(env);
        env.connect(destination);

        // ADSR / Envelope
        const attack = params.attack || 0.01;
        const release = params.release || 0.1;
        const safeDuration = Math.max(duration, attack + 0.01);

        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(velocity, time + attack);
        
        // Sustain -> Release
        env.gain.setValueAtTime(velocity, time + safeDuration);
        env.gain.exponentialRampToValueAtTime(0.001, time + safeDuration + release);
        // Force silence to avoid DC offset or click at stop
        env.gain.linearRampToValueAtTime(0, time + safeDuration + release + 0.01);

        osc.start(time);
        osc.stop(time + safeDuration + release + 0.02);
    }

    playSampleNote(sampleId, frequency, time, duration, velocity, destination) {
        const buffer = this.samples.get(sampleId);
        if (!buffer) return;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        // Pitch shifting (Assuming C4 base)
        const rate = frequency / 261.63;
        source.playbackRate.value = rate;

        const env = this.ctx.createGain();
        source.connect(env);
        env.connect(destination);

        // Fix: Add small attack to prevent start click
        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(velocity, time + 0.005);

        // Simple decay if duration is short, else let sample play
        // But preventing click at end:
        env.gain.setValueAtTime(velocity, time + duration);
        env.gain.linearRampToValueAtTime(0, time + duration + 0.1);

        source.start(time);
        source.stop(time + duration + 0.2);
    }

    playNoiseNote(time, duration, velocity, destination, params = {}) {
        const source = this.ctx.createBufferSource();
        source.buffer = this.noiseBuffer;
        const env = this.ctx.createGain();

        // Apply Filter if specified (Essential for Hats to avoid clicking)
        let outputNode = source;
        if (params.filterType) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = params.filterType;
            filter.frequency.value = params.filterFreq || 1000;
            if (params.filterQ) filter.Q.value = params.filterQ;
            source.connect(filter);
            outputNode = filter;
            // outputNode.connect(this.ctx.destination); // DEBUG: Direct out to check filter
        }

        outputNode.connect(env);
        env.connect(destination);

        const safeDuration = Math.max(duration, 0.05); // Ensure minimum duration to avoid clicks
        
        // Fix: Add attack and release ramps to prevent clicks/crackles
        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(velocity, time + 0.005);
        env.gain.exponentialRampToValueAtTime(0.001, time + safeDuration);
        env.gain.linearRampToValueAtTime(0, time + safeDuration + 0.05); // Ensure full silence

        source.start(time);
        source.stop(time + safeDuration + 0.1);
    }
}

/**
 * A lightweight synthesizer for procedural playback with transition capabilities.
 */
class T13Synth {
    constructor(audioContext) {
        this.ctx = audioContext;
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        
        // Add Compressor to tame peaks and prevent clipping
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -10;
        this.compressor.knee.value = 40;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0;
        this.compressor.release.value = 0.25;

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);

        this.buffers = new Map(); // Store loaded AudioBuffers
        this.layers = new Map(); // To manage active layers { source, gainNode }
        this.channels = new Map(); // Channel routing for visualization

        // Sub-Engines
        this.instrumentEngine = new InstrumentEngine(this.ctx);
    }

    /**
     * Loads an audio file into a buffer.
     * @param {string} name - A unique name for the audio.
     * @param {string} url - URL to the audio file.
     */
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

    playNote(frequency, startTime, duration, type = 'sine', detune = 0, instrument = null, channelId = null) {
        let dest = this.masterGain;

        if (channelId) {
            if (!this.channels.has(channelId)) {
                const gain = this.ctx.createGain();
                const analyser = this.ctx.createAnalyser();
                analyser.fftSize = 256;
                gain.connect(analyser);
                analyser.connect(this.masterGain);
                this.channels.set(channelId, { gain, analyser });
            }
            dest = this.channels.get(channelId).gain;
        }

        // Delegate to InstrumentEngine for unified handling
        // If 'instrument' is a string key for a loaded sample or defined instrument
        if (instrument) {
            this.instrumentEngine.playNote(instrument, frequency, startTime, duration, 0.3, dest);
            return;
        }

        // Fallback to basic synth if no instrument specified (or use default synth type)
        this.instrumentEngine.playNote(type, frequency, startTime, duration, 0.3, dest);
    }

    playSample(name, frequency, startTime, duration, detune) {
        // Forwarding legacy calls to InstrumentEngine
        this.instrumentEngine.playNote(name, frequency, startTime, duration, 0.3, this.masterGain);
    }

    /**
     * Plays a pre-loaded audio buffer as a persistent layer.
     * @param {string} layerName - A unique name for this layer.
     * @param {AudioBuffer} buffer - The audio buffer to play.
     * @param {number} volume - The target volume for the layer.
     * @param {boolean} loop - Whether the audio should loop.
     * @param {number} fadeTime - The time in seconds to fade in.
     */
    playLayer(layerName, buffer, volume = 1.0, loop = true, fadeTime = 2.0) {
        if (this.layers.has(layerName)) return; // Already playing

        const now = this.ctx.currentTime;
        const source = this.ctx.createBufferSource();
        const gainNode = this.ctx.createGain();

        source.buffer = buffer;
        source.loop = loop;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + fadeTime);

        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        source.start(now);

        this.layers.set(layerName, { source, gainNode });
        Logger.message(`T13Synth: Started layer '${layerName}'`);
    }

    /**
     * Stops a persistent layer with a fade out.
     * @param {string} layerName - The name of the layer to stop.
     * @param {number} fadeTime - The time in seconds to fade out.
     */
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

    /**
     * Plays a one-shot sound effect that is not looped.
     * @param {AudioBuffer} buffer - The audio buffer to play.
     * @param {number} volume - The volume to play at.
     */
    playFX(buffer, volume = 0.5) {
        if (!buffer) return;
        const now = this.ctx.currentTime;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.masterGain);
        source.start(now);
    }

    /**
     * Plays a transitional "bridge" or "fill" sound.
     * @param   {number} baseFreq - Root frequency.
     * @param {string} direction - 'rising' (tension up) or 'falling' (tension down).
     */
    playBridge(baseFreq, direction) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = direction === 'rising' ? 'sawtooth' : 'sine';

        // Envelope
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 1.0);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

        // Frequency Sweep
        osc.frequency.setValueAtTime(baseFreq, now);
        if (direction === 'rising') {
            // Tension rising: Pitch up, adding dissonance
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 3.0);
        } else {
            // Tension falling: Pitch down, resolving
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
        this.masterGain.disconnect();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.ctx.destination);
    }
}

/**
 * T13NE Music Module
 * Procedurally generates music based on Character Geometry and Narrative Arcs.
 */
class T13NE_Music {
    constructor() {
        this.t13ne = null;
        this.geometry = null;
        this.soundEngine = null;
        this.synth = null;
        this.initialized = false;
        this.tonalModes = [];
        this.compositionCache = new Map(); // Caches generated composition data
        this.musicPack = null; // Holds buffers for the current musical context
        this.currentLayers = new Set(); // Tracks active layer names
        this.lastTension = -1;

        this.manifestManager = new AudioManifestManager();
    }

    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;
        this.geometry = t13ne.getModule('T13Geometry');
        this.soundEngine = t13ne.soundEngine; // Access core sound engine

        await this.manifestManager.loadManifest();

        if (this.soundEngine && this.soundEngine.audioContext) {
            this.synth = new T13Synth(this.soundEngine.audioContext);
            // Attach manifest manager to instrument engine so it can access analysis data
            this.synth.instrumentEngine.manifestManager = this.manifestManager;
        } else {
            Logger.warn("T13NE_Music: SoundEngine AudioContext not available. Playback disabled.");
        }

        // Load data required for generation
        this.tonalModes = await CodexLoader.getData('geometry', 'tonalModes.json') || [];

        this.initialized = true;
        Logger.message("T13NE_Music: Initialized.");

        // Auto-generate high-fidelity instruments from manifest samples if available
        this._generateOrchestralInstruments();
    }

    _generateOrchestralInstruments() {
        if (!this.synth) return;
        
        const mappings = {
            'Cello': 'pad_acoustic/low_string',
            'Violin': 'melody_acoustic/hi_string',
            'Viola': 'melody_acoustic/mid_string',
            'Flute': 'melody_acoustic/flute_c1',
            'Trumpet': 'melody_acoustic/trumpet_solo',
            'French Horn': 'melody_acoustic/brite_horn',
            'Clarinet': 'melody_acoustic/clarinet_c1',
            'Piano': 'melody_acoustic/piano_c4',
            'Harp': 'melody_acoustic/harp'
        };

        for (const [instName, sampleId] of Object.entries(mappings)) {
            // Create a synthetic instrument derived from the sample analysis
            // This uses the AdditiveProcessor to recreate the timbre
            this.synth.instrumentEngine.createSyntheticInstrument(sampleId, instName, 'high', 'sustained');
        }
    }

    /**
     * Loads a sample and registers it in the manifest and instrument engine.
     */
    async loadSample(name, url) {
        if (this.synth) {
            const success = await this.synth.instrumentEngine.loadSample(name, url);
            if (success) {
                this.manifestManager.addToManifest('samples', name, { filename: url.split('/').pop(), loaded: true });
            }
        }
    }

    /**
     * generating the Wormhole Racers Main Theme.
     */
    async createWormholeTheme(gameEngine) {
        if (!this.synth) return;

        const trackName = 'track_wormhole_main_theme';
        Logger.message("T13NE_Music: generating Wormhole Racers Theme from components...");

        // 1. Determine Context from Game Engine
        const pc = gameEngine?.playerCharacter || { name: 'Racer', geometry: { GeometryNumber: 5, Facade: 5 } };
        const ship = gameEngine?.playerShip || { name: 'Ship', geometry: { GeometryNumber: 1, Facade: 1 } };

        // 2. Generate Stems using Generators
        // Lead Melody from Player Character
        const leadMotif = this.getCharacterComposition(pc);
        
        // Bass from Ship (or Plot)
        const bassMotif = this.getCharacterComposition(ship);
        
        // Pad/Harmony derived from Lead Scale
        const padSequence = this._generatePadSequence(leadMotif, 16); // 16 beats length
        const drumSequence = this._generateDrumSequence(16, ship); 

        // 1. Create Instruments
        const bassPatch = {
            type: 'additive',
            algorithm: 'custom',
            envelope: 'sustained',
            partials: [
                { freq: 0.5, amp: 0.7 }, // Underharmonic (Sub-bass)
                { freq: 1.0, amp: 0.8 }, // Fundamental
                { freq: 2.0, amp: 0.4 }, // 1st Overtone
                { freq: 3.0, amp: 0.2 }, // 2nd Overtone
                { freq: 4.0, amp: 0.1 }  // 3rd Overtone
            ]
        };
        const leadPatch = {
            type: 'additive',
            algorithm: 'custom',
            envelope: 'sustained',
            partials: [
                { freq: 1, amp: 1, decay: 0.1 },
                { freq: 2, amp: 0.5, decay: 0.2 },
                { freq: 3, amp: 0.2, decay: 0.3 }
            ]
        };
        const padPatch = {
            type: 'additive',
            algorithm: 'custom',
            envelope: 'sustained',
            partials: [
                { freq: 1, amp: 0.8, decay: 2.0 },
                { freq: 1.01, amp: 0.8, decay: 2.0 }, // Detune
                { freq: 2, amp: 0.4, decay: 1.5 },
                { freq: 3, amp: 0.2, decay: 1.5 }
            ]
        };

        this.synth.instrumentEngine.defineInstrument('wr_bass', bassPatch);
        this.synth.instrumentEngine.defineInstrument('wr_lead', leadPatch);
        this.synth.instrumentEngine.defineInstrument('wr_pad', padPatch);

        this.synth.instrumentEngine.defineInstrument('wr_kick', { 
            type: 'synth', 
            oscType: 'sine',
            pitchEnv: { startMult: 4.0, time: 0.1 }, // Drop pitch 4x -> 1x to create "thump"
            attack: 0.001,
            release: 0.2
        }); 
        this.synth.instrumentEngine.defineInstrument('wr_snare', { type: 'noise', filterType: 'lowpass', filterFreq: 2000 }); // Snare body - softer
        this.synth.instrumentEngine.defineInstrument('wr_hat', { type: 'noise', filterType: 'bandpass', filterFreq: 4000, filterQ: 1.0 }); // Hats - lower freq to avoid crackle

        // 3. Assemble Song Structure
        const structures = {
            'Pop': [
                { type: 'Intro', bars: 4, voices: ['v_pad'] },
                { type: 'Verse', bars: 8, voices: ['v_bass', 'v_pad', 'v_hat'] },
                { type: 'Chorus', bars: 8, voices: ['v_bass', 'v_pad', 'v_lead', 'v_kick', 'v_snare', 'v_hat'] },
                { type: 'Bridge', bars: 4, voices: ['v_pad', 'v_lead'] },
                { type: 'Chorus', bars: 8, voices: ['v_bass', 'v_pad', 'v_lead', 'v_kick', 'v_snare', 'v_hat'] },
                { type: 'Outro', bars: 4, voices: ['v_pad'] }
            ],
            'Cinematic': [
                { type: 'Atmosphere', bars: 8, voices: ['v_pad'] },
                { type: 'Tension', bars: 8, voices: ['v_pad', 'v_bass', 'v_hat'] },
                { type: 'Build', bars: 8, voices: ['v_pad', 'v_bass', 'v_hat', 'v_snare'] },
                { type: 'Climax', bars: 16, voices: ['v_bass', 'v_pad', 'v_lead', 'v_kick', 'v_snare', 'v_hat'] },
                { type: 'Resolution', bars: 8, voices: ['v_pad', 'v_lead'] }
            ],
            'Symphony': [
                { type: 'Exposition', bars: 8, voices: ['v_lead', 'v_pad'] },
                { type: 'Counter-Theme', bars: 8, voices: ['v_bass', 'v_pad', 'v_hat'] },
                { type: 'Development', bars: 16, voices: ['v_bass', 'v_lead', 'v_kick', 'v_snare'] },
                { type: 'Recapitulation', bars: 8, voices: ['v_lead', 'v_pad', 'v_bass', 'v_kick', 'v_snare', 'v_hat'] },
                { type: 'Coda', bars: 4, voices: ['v_lead', 'v_pad'] }
            ]
        };

        const structureKeys = Object.keys(structures);
        const selectedKey = structureKeys[Math.floor(Math.random() * structureKeys.length)];
        const songStructure = structures[selectedKey];
        
        Logger.message(`T13NE_Music: Selected structure '${selectedKey}'`);

        const fullSequence = [];
        let currentBarOffset = 0;
        const bpm = 120;
        const beatTime = 60 / bpm;

        // Helper to convert motifs to track events
        const leadEvents = this._motifToTrackEvents(leadMotif, 'v_lead', beatTime);
        const bassEvents = this._motifToTrackEvents(bassMotif, 'v_bass', beatTime, -24); // Shift bass down 2 octaves
        const padEvents = padSequence.map(e => ({ ...e, voice: 'v_pad' }));
        const drumEvents = drumSequence;

        songStructure.forEach(section => {
            for (let b = 0; b < section.bars; b++) {
                const barStepOffset = (currentBarOffset + b) * 16;
                
                // Add parts if voice is active in section
                if (section.voices.includes('v_lead')) this._addLoopToSequence(fullSequence, leadEvents, barStepOffset, 16);
                if (section.voices.includes('v_bass')) this._addLoopToSequence(fullSequence, bassEvents, barStepOffset, 16);
                if (section.voices.includes('v_pad')) this._addLoopToSequence(fullSequence, padEvents, barStepOffset, 16);
                
                // Drums
                if (section.voices.includes('v_kick')) this._addLoopToSequence(fullSequence, drumEvents.filter(e=>e.voice==='v_kick'), barStepOffset, 16);
                if (section.voices.includes('v_snare')) this._addLoopToSequence(fullSequence, drumEvents.filter(e=>e.voice==='v_snare'), barStepOffset, 16);
                if (section.voices.includes('v_hat')) this._addLoopToSequence(fullSequence, drumEvents.filter(e=>e.voice==='v_hat'), barStepOffset, 16);
            }
            currentBarOffset += section.bars;
        });

        // 3. Assemble Track
        const trackData = {
            name: 'Wormhole Racers Theme',
            bpm: bpm,
            timeSignature: [4, 4],
            measures: currentBarOffset,
            voices: [
                { id: 'v_bass', name: 'Bass', instrument: 'wr_bass', sequence: [], mute: false },
                { id: 'v_lead', name: 'Lead', instrument: 'wr_lead', sequence: [], mute: false },
                { id: 'v_pad', name: 'Pad', instrument: 'wr_pad', sequence: [], mute: false },
                { id: 'v_kick', name: 'Kick', instrument: 'wr_kick', sequence: [], mute: false },
                { id: 'v_snare', name: 'Snare', instrument: 'wr_snare', sequence: [], mute: false },
                { id: 'v_hat', name: 'Hat', instrument: 'wr_hat', sequence: [], mute: false }
            ]
        };

        // Distribute notes to voices
        fullSequence.forEach(note => {
            const v = trackData.voices.find(voice => voice.id === note.voice);
            if (v) v.sequence.push(note);
        });

        // 4. Save
        this.saveTrack(trackName, trackData);

        // Also register instruments to manifest so they persist
        // (Skipping full instrument save logic for brevity, they are active in engine now)

        return trackData;
    }

    _motifToTrackEvents(motif, voiceId, beatTime, pitchShiftSemitones = 0) {
        const events = [];
        let currentStep = 0;
        motif.sequence.forEach(note => {
            // note.duration is in beats (e.g. 0.25, 0.5, 1.0)
            // step is 16th note (0.25 beat)
            const durationSteps = note.duration * 4; 
            
            // Pitch shift freq
            let freq = note.freq;
            if (pitchShiftSemitones !== 0) {
                freq = freq * Math.pow(2, pitchShiftSemitones / 12);
            }

            events.push({
                voice: voiceId,
                step: currentStep,
                freq: freq,
                duration: note.duration * beatTime, // Seconds
                velocity: 0.7
            });
            currentStep += durationSteps;
        });
        return events;
    }

    _addLoopToSequence(targetSeq, sourceEvents, offsetStep, loopLengthSteps) {
        sourceEvents.forEach(evt => {
            // Wrap event step within loop length
            const loopStep = evt.step % loopLengthSteps;
            // Add to target
            targetSeq.push({
                ...evt,
                step: offsetStep + loopStep
            });
        });
    }

    _generatePadSequence(leadMotif, lengthSteps) {
        // Generate a chord progression based on lead scale
        const baseFreq = leadMotif.baseFreq;
        const events = [];
        
        // Simple 1 chord per bar (16 steps)
        // Root chord: Root, 3rd, 5th of scale
        // Simplified: Just drone the root and 5th
        events.push({ step: 0, freq: baseFreq, duration: 2.0, velocity: 0.4 });
        events.push({ step: 0, freq: baseFreq * 1.5, duration: 2.0, velocity: 0.4 });
        
        return events;
    }

    _generateDrumSequence(lengthSteps, ship = null) {
        const events = [];
        const rng = new MusicRNG(ship ? ship.name : 'default');
        
        // Pick a rhythm style based on ship name hash
        const kickPattern = rng.pick(['four-on-floor', 'breakbeat', 'driving']);

        for (let i = 0; i < lengthSteps; i++) {
            // Kick
            let kick = false;
            if (kickPattern === 'four-on-floor' && i % 4 === 0) kick = true;
            else if (kickPattern === 'driving' && i % 2 === 0) kick = true;
            else if (kickPattern === 'breakbeat' && (i % 8 === 0 || i % 8 === 5)) kick = true;

            if (kick) events.push({ voice: 'v_kick', step: i, freq: 100, duration: 0.1, velocity: 0.8 });

            // Snare
            if (i % 8 === 4) events.push({ voice: 'v_snare', step: i, freq: 100, duration: 0.1, velocity: 0.7 });
            
            // Hats - influenced by component count (more components = busier hats)
            const hatDensity = ship && ship.components ? 0.5 + (ship.components.length * 0.05) : 0.5;
            if (i % 2 === 0 || (rng.next() < hatDensity && i % 2 !== 0)) events.push({ voice: 'v_hat', step: i, freq: 1000, duration: 0.05, velocity: 0.5 });
        }
        return events;
    }

    /**
     * Plays a tracked composition.
     */
    playTrack(trackId) {
        const track = this.manifestManager.manifest.tracks[trackId] || null;
        if (!track) {
            // It might be a raw object if we just created it and haven't reloaded
            // Check if we can find it in saved JSONs? 
            // Since we save to manifest structure in memory:
            // The saveTrack method puts it in manifest.tracks[name]
        }

        // Actually, saveTrack uses 'name' as key. 
        // Let's ensure we can retrieve it.
        const data = this.manifestManager.manifest.tracks[trackId];
        // If data is just metadata {filename...} we need to load it. 
        // But if we just created it in memory, we might need a way to play the raw object or auto-load.

        // For this immediate flow, let's assume we play the Object we just built if passed, or load from ID.
        // ... (This needs a proper track scheduler, which MusicEditorUI has, but T13NE_Music needs its own playback logic)

        // Implementing simple sequencer playback here for the engine/intro:
        if (data) {
            // If it has a filename, strictly we should fetch it. 
            // But saveTrack updates the manifest with just metadata.
            // But we likely still have the object in memory if we just made it?
            // Not currently stored in a 'loadedTracks' cache.

            // Quick fix: If we are calling playTrack immediately after create, we can pass the object or we need to 'load' the track JSON.
            // Given limitations, let's just make createWormholeTheme return the Track Object.
        }
    }

    playTrackObject(track) {
        if (!this.synth) return;
        Logger.message(`Playing Track: ${track.name}`);

        // Simple Interval Scheduler
        // 16th notes
        const stepTime = (60 / track.bpm) / 4;
        const lookahead = 1.5; // Increased from 0.1 to 1.5s to prevent chopping during heavy load
        let currentStep = 0;
        let nextStepTime = this.synth.ctx.currentTime + 0.1;

        // Stop previous
        if (this.currentSequenceTimer) clearTimeout(this.currentSequenceTimer);

        const schedule = () => {
            const now = this.synth.ctx.currentTime;
            while (nextStepTime < now + lookahead) {
                // Play notes for current step
                track.voices.forEach(voice => {
                    if (voice.mute) return;
                    voice.sequence.forEach(note => {
                        if (note.step === currentStep) {
                            this.synth.playNote(
                                note.freq || this.synth.instrumentEngine._freqFromNote(note.note), // frequency (ignored for noise)
                                nextStepTime, // startTime
                                note.duration, // duration
                                'sine', // type (fallback)
                                0, // detune
                                voice.instrument, // instrument
                                voice.id // channelId
                            );
                        }
                    });
                });

                nextStepTime += stepTime;
                currentStep++;

                // Loop
                const totalSteps = track.measures * 16;
                if (currentStep >= totalSteps) currentStep = 0;
            }
            this.currentSequenceTimer = setTimeout(schedule, 100); // Increased interval to reduce main thread load
        };

        // Auto-create visualizer if missing
        if (!document.getElementById('audio-debug-viz')) {
            this.createDebugVisualizer();
        }

        schedule();
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
                
                const y = i * h;
                
                ctx.fillStyle = '#0f0';
                ctx.font = '10px monospace';
                ctx.fillText(name, 2, y + 10);
                
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
            });
        };
        draw();
    }

    stopTrack() {
        if (this.currentSequenceTimer) clearTimeout(this.currentSequenceTimer);
    }
    saveSequence(name, sequence) {
        const data = { name, sequence, timestamp: Date.now() };
        this.manifestManager.addToManifest('sequences', name, { filename: `${name}.json` });
        Logger.message(`T13NE_Music: Sequence '${name}' ready for export.`);
        return JSON.stringify(data, null, 2);
    }

    /**
     * Export a track configuration.
     */
    saveTrack(name, trackData) {
        const data = { name, ...trackData, timestamp: Date.now() };
        this.manifestManager.addToManifest('tracks', name, { filename: `${name}.json` });
        return JSON.stringify(data, null, 2);
    }

    /**
     * Export MIDI-like data (notes array).
     */
    saveMidi(name, notes) {
        const data = { name, notes, timestamp: Date.now() };
        this.manifestManager.addToManifest('midi', name, { filename: `${name}.json` });
        return JSON.stringify(data, null, 2);
    }

    /**
     * Export a loop definition.
     */
    saveLoop(name, loopData) {
        const data = { name, ...loopData, timestamp: Date.now() };
        this.manifestManager.addToManifest('loops', name, { filename: `${name}.json` });
        return JSON.stringify(data, null, 2);
    }

    /**
     * Loads a single audio file for use as a sampled instrument or a one-shot effect.
     * @param {string} name - A unique name for the instrument/effect.
     * @param {string} url - The URL of the audio file.
     */
    async loadInstrument(name, url) {
        if (this.synth) {
            await this.loadSample(name, url);
        }
    }

    /**
     * Loads a collection of audio stems for adaptive layering.
     */
    async loadMusicPack(packData) {
        if (this.synth) {
            this.musicPack = {};
            for (const key in packData) {
                this.musicPack[key] = await this.synth.loadAudio(key, packData[key]);
            }
            Logger.message("T13NE_Music: Music pack loaded.");
        }
    }

    /**
     * Parses a tonal pattern string (e.g., "43(5)" or "TST") into an array of intervals.
     * @param {string} patternString 
     * @returns {number[]} An array of semitone intervals.
     */
    _parseTonalPattern(patternString = '') {
        const intervals = [];
        if (!patternString) return [2, 2, 1, 2, 2, 2, 1]; // Default to Major scale pattern

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

    /**
     * Finds the Tonal Mode object for a given character's geometry.
     * @param {object} characterGeo - The character's full geometry object.
     * @returns {object|null} The tonal mode object from the codex.
     */
    _getTonalMode(characterGeo) {
        if (!this.tonalModes.length || !characterGeo) return null;
        const modeName = characterGeo.GeoHarmonics?.Mode || 'Ionian/Major';
        const found = this.tonalModes.find(m => {
            const type = m.data ? m.data.Type : m.Type;
            return type === modeName;
        });
        return found ? (found.data || found) : null;
    }

    /**
     * Analyzes the intervals between notes in a scale to find the frequency of melodic steps.
     * @param {number[]} scaleIntervals - A sorted array of semitone intervals from the root (e.g., [0, 2, 4, 5, 7, 9, 11]).
     * @returns {object} A map of interval sizes to their frequency (e.g., { '1': 2, '2': 5 }).
     */
    _getMelodicIntervalDistribution(scaleIntervals) {
        const distribution = {};
        if (scaleIntervals.length < 2) return distribution;

        for (let i = 0; i < scaleIntervals.length - 1; i++) {
            const interval = scaleIntervals[i + 1] - scaleIntervals[i];
            if (interval > 0) {
                distribution[interval] = (distribution[interval] || 0) + 1;
            }
        }
        // Also consider the interval from the last note back to the octave (root)
        const lastInterval = 12 - scaleIntervals[scaleIntervals.length - 1];
        if (lastInterval > 0) {
            distribution[lastInterval] = (distribution[lastInterval] || 0) + 1;
        }

        return distribution;
    }

    /**
     * Generates a Markov transition matrix based on musical rules and preferred intervals.
     * @param {number[]} scaleIntervals - The allowed intervals of the scale.
     * @param {object} [harmonicStepDistribution={}] - A map of preferred melodic intervals (from harmonics) to their frequency.
     * @returns {number[][]} A 2D array representing the transition probabilities.
     */
    _generateMarkovTransitions(scaleIntervals, harmonicStepDistribution = {}) {
        const matrix = [];
        // Create a map of weights for both ascending and descending preferred intervals.
        const preferredIntervals = new Map();
        for (const interval in harmonicStepDistribution) {
            const i = parseInt(interval, 10);
            const count = harmonicStepDistribution[interval];
            // Give higher weight to more frequent intervals in the harmonic structure
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

                // Start with a base weight for any valid note in the scale.
                let weight = 1.0;

                // Add weight for standard musical rules (predictability)
                if (melodicInterval === 0) { // Repetition
                    weight += 1.5;
                } else if (melodicInterval === 1 || melodicInterval === 2 || melodicInterval === 10 || melodicInterval === 11) { // Stepwise motion
                    weight += 2.0;
                }

                // Add character-specific flavor from harmonics (uniqueness)
                if (preferredIntervals.has(melodicInterval)) {
                    weight += 4.0 * preferredIntervals.get(melodicInterval);
                }

                // Penalize dissonant intervals unless they are harmonically preferred by the character
                if (melodicInterval === 6 && !preferredIntervals.has(6)) {
                    weight *= 0.1;
                }
                weights.push(weight);
                totalWeight += weight;
            }

            // Normalize weights to probabilities for the current state
            matrix[i] = weights.map(w => w / totalWeight);
        }
        return matrix;
    }

    /**
     * Generates a Leitmotif for a character.
     * This is the base melodic generator for various composition types.
     */
    getCharacterComposition(character, options = {}) {
        if (!character || !character.name) return null;

        // Lazy load geometry if not linked during init
        if (!this.geometry && this.t13ne) {
            this.geometry = this.t13ne.getModule('T13Geometry');
        }

        const useCharacterHarmonics = options.useCharacterHarmonics !== false; // Default to true

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

        // 1. Determine the allowed notes from the Tonal Mode
        const tonalMode = this._getTonalMode(geo);
        const tonalPattern = this._parseTonalPattern(tonalMode?.Pattern); // e.g., [2, 2, 1, 2, 2, 2, 1]
        const allowedScaleIntervals = [0];
        let cumulativeInterval = 0;
        for (const step of tonalPattern) {
            cumulativeInterval += step;
            if (cumulativeInterval < 12) {
                allowedScaleIntervals.push(cumulativeInterval);
            }
        }

        // 2. Determine the preferred melodic intervals from the Character's Harmonics (if applicable)
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

        // 3. Generate Markov Chain transition matrix
        const transitionMatrix = this._generateMarkovTransitions(allowedScaleIntervals, harmonicStepDistribution);

        const length = rng.range(8, 16);
        const sequence = [];
        const noteDurations = [0.25, 0.5, 1.0];
        let currentNoteIndex = 0; // Start at the root of the scale

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

        // Use the character's preferred instrument if none is specified.
        const preferredInstrument = instrument || KEY_INSTRUMENT_MAP[motif.key] || 'piano';

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

    /**
     * Generic composition factory. Gets/generates a musical composition for any T13NE entity.
     * @param {object} entity - The entity (Character, Location, Pact, Descendant)
     * @returns {object|null} The generated composition data.
     */
    getComposition(entity) {
        if (!entity || !entity.name) return null;

        const entityType = entity.constructor.name; // A simple way to get type
        const cacheKey = `${entityType}_${entity.id || entity.name}`;
        if (this.compositionCache.has(cacheKey)) {
            return this.compositionCache.get(cacheKey);
        }

        let compositionData = null;

        // Determine entity type and call the appropriate generator
        if (entity.geometry && entity.type) { // Likely a Character
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
        } else if (entity.isLocation) { // Fictional property for type checking
            compositionData = this._generateSymphony(entity);
        } else if (entity.isPact) { // Fictional property
            compositionData = this._generateOpera(entity);
        } else if (entity.isDescendant) { // Fictional property
            // Jingles are for generic descendants, Refrains for specific ones.
            // This logic would need a way to differentiate, e.g., based on a descendant property.
            compositionData = entity.isUnique ? this._generateRefrain(entity) : this._generateJingle(entity);
        }

        if (compositionData) {
            Logger.message(`T13NE_Music: Generated composition '${compositionData.name}' for ${entity.name}`);
            this.compositionCache.set(cacheKey, compositionData);
        }

        return compositionData;
    }

    /**
     * Plays a generated composition object.
     * @param {object} composition - The composition data object from getComposition.
     * @param {object} [listener=null] - An optional listener character to determine dissonance.
     */
    /**
     * Plays a defined Track (Instrument + Sequence).
     * @param {object} track - The track definition { instrument, sequence, bpm, ... }
     */
    playTrack(track) {
        if (!this.synth || !track) return;

        Logger.message(`T13NE_Music: Playing Track '${track.name}'`);

        const bpm = track.bpm || 120;
        const beatTime = 60 / bpm; // Quarter note time
        // If the sequence is 16th notes based (tracker style), stepTime is beatTime / 4
        const stepTime = beatTime / 4;

        const now = this.soundEngine.audioContext.currentTime;

        track.sequence.forEach(evt => {
            // evt: { step, note, duration, velocity }
            const startTime = now + (evt.step * stepTime);
            // Convert note name (e.g. "C4") to frequency if needed, or if stored as freq
            let freq = evt.freq;
            if (!freq && evt.note) {
                freq = this._noteToFreq(evt.note);
            }

            // duration in sequence is often in 'steps' or 'beats'? 
            // In editor it was normalized. Let's assume duration is in 'beats' for playback consistency
            // or if stored from editor, it was 0.25 (16th note).
            const durationSecs = evt.duration * 4 * stepTime; // Duration is relative to beat?

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

    /**
     * Export a track configuration (Instrument + Sequence + Settings).
     */
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

    /**
     * Export a stem (Single Voice configuration).
     */
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

    // Private generators for each composition type
    _generateChant(character) {
        const composition = this.getCharacterComposition(character);
        composition.name = `${character.name}'s Chant`;
        // Make it monotone and rhythmic
        composition.sequence = composition.sequence.map(note => ({ ...note, freq: composition.baseFreq, duration: 1.0 }));
        composition.type = 'Chant';
        return composition;
    }

    _generateMarch(character) {
        const composition = this.getCharacterComposition(character);
        composition.name = `${character.name}'s March`;
        composition.tempo = 120;
        // Make rhythm more rigid and on-beat
        composition.sequence = composition.sequence.map(note => ({ ...note, duration: 0.5 }));
        composition.type = 'March';
        return composition;
    }

    _generateAria(hero) {
        const composition = this.getCharacterComposition(hero);
        composition.name = `${hero.name}'s Aria`;
        composition.tempo = 80; // Slower, more expressive
        composition.type = 'Aria';
        return composition;
    }

    _generateSolo(yarnTeller) {
        const composition = this.getCharacterComposition(yarnTeller);
        composition.name = `${yarnTeller.name}'s Solo`;
        composition.tempo = 160; // Faster, more intense
        // Add more notes to make it feel more virtuosic
        const extraNotes = this.getCharacterComposition({ ...yarnTeller, name: yarnTeller.name + '_extra' }).sequence;
        composition.sequence = composition.sequence.concat(extraNotes);
        composition.type = 'Solo';
        return composition;
    }

    _generateLeitmotif(character) {
        const composition = this.getCharacterComposition(character);
        composition.name = `${character.name}'s Leitmotif`;
        composition.sequence = composition.sequence.slice(0, 4); // Shorter for a motif
        composition.type = 'Leitmotif';
        return composition;
    }

    _generateAnthem(character) {
        const composition = this.getCharacterComposition(character);
        composition.name = `${character.name}'s Anthem`;
        composition.tempo = 70; // Stately and grand
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
            // This structure tells the scene loader which audio stems to load into the musicPack
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
            key: 'C', // Could be derived from pact name or dominant member
            themes: {}
        };

        pact.members.forEach(member => {
            composition.themes[member.name] = this.getCharacterComposition(member);
        });

        return composition;
    }

    _generateRefrain(descendant) {
        const composition = this.getCharacterComposition({ name: descendant.name }, { useCharacterHarmonics: false }); // Use descendant name for seed
        composition.name = `${descendant.name}'s Refrain`;
        composition.type = 'Refrain';
        return composition;
    }

    _generateJingle(descendant) {
        const composition = this.getCharacterComposition({ name: descendant.name }, { useCharacterHarmonics: false });
        composition.name = `${descendant.name}'s Jingle`;
        composition.type = 'Jingle';
        composition.sequence = composition.sequence.slice(0, 3); // Very short
        composition.tempo = 130;
        return composition;
    }

    /**
     * Uses vertical remixing (layering) to adapt the music to game state.
     * @param {object} plot - The current plot object, containing tensionLevel.
     * @param {object} [gameParams={}] - Additional game state like player health.
     */
    updateAmbience(plot, gameParams = {}) {
        if (!this.synth || !this.musicPack || !plot) return;

        const tension = plot.tensionLevel || 0;
        if (this.lastTension === tension && !gameParams.playerHealth) return; // No change

        const newLayers = new Set();

        // Define which layers play at which tension level
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

        // Connect to other game parameters
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