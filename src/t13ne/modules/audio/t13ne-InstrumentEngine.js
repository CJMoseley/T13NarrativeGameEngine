import Logger from "../../core/Logger.js";
import { WavetableBaker } from "./t13ne-wavetable-baker.js";

/**
 * Handles Complex Additive Synthesis.
 */
export class AdditiveProcessor {
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
    playAdditiveTone(frequency, time, duration, destination, partials, params = {}) {
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

        const envelope = params.envelope || 'percussive';
        const attack = params.attack || (envelope === 'sustained' ? 0.1 : 0.01);
        const decay = params.decay || 0.1;
        const sustain = params.sustain !== undefined ? params.sustain : 1.0; // 0-1 multiplier of peakGain
        const release = params.release || 0.2;

        // Limit partials for CPU fallback to prevent "warbling" / overload
        const activePartials = partials.slice(0, 4); 

        activePartials.forEach(p => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.frequency.value = frequency * p.freq;
            osc.connect(gain);
            gain.connect(destination);

            const peakGain = p.amp * 0.2;

            if (envelope === 'sustained') {
                // Sustained Envelope (ADSR)
                // Attack
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(peakGain, time + attack);
                
                // Decay -> Sustain
                if (duration > attack + decay) {
                    const sustainLevel = peakGain * sustain;
                    gain.gain.linearRampToValueAtTime(sustainLevel, time + attack + decay);
                    gain.gain.setValueAtTime(sustainLevel, time + duration);
                } else {
                    gain.gain.setValueAtTime(peakGain, time + duration);
                }

                // Release
                gain.gain.exponentialRampToValueAtTime(0.001, time + duration + release);
                gain.gain.linearRampToValueAtTime(0, time + duration + release + 0.05); // Ensure silence
                
                osc.start(time);
                osc.stop(time + duration + release + 0.1);
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
export class InstrumentEngine {
    constructor(audioContext) {
        this.ctx = audioContext;
        this.instruments = new Map();
        this.samples = new Map();
        this.additive = new AdditiveProcessor(audioContext);
        this.baker = new WavetableBaker();
        this.workletReady = false;
    }

    /**
     * Initializes the AudioWorklet module.
     */
    async init() {
        if (this.workletReady) return;
        try {
            await this.ctx.audioWorklet.addModule('/src/t13ne/modules/audio/t13ne-additiveProcessor.js');
            this.workletReady = true;
            Logger.message("InstrumentEngine: AdditiveProcessor Worklet loaded.");
        } catch (e) {
            Logger.warn("InstrumentEngine: Failed to load AdditiveProcessor Worklet. Falling back to PeriodicWave.", e);
        }

        // Default Instruments
        // Replaced pure waves with additive approximations to avoid harshness
        this.defineInstrument('sine', { 
            type: 'additive', 
            algorithm: 'custom', 
            partials: [{freq:1, amp:1}, {freq:2, amp:0.05}, {freq:3, amp:0.02}] 
        });
        this.defineInstrument('saw', { 
            type: 'additive', 
            algorithm: 'custom', 
            partials: [{freq:1, amp:1}, {freq:2, amp:0.5}, {freq:3, amp:0.33}, {freq:4, amp:0.25}] 
        });
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
            if (!url) {
                Logger.error(`InstrumentEngine: Cannot load sample '${id}', URL is missing/null.`);
                return false;
            }

            // Candidate paths to try
            let candidates = [url];
            if (!url.match(/^(http|https|blob|data):/)) {
                let relative = url.startsWith('/') ? url : '/' + url;

                // Fix: Files in public are served at root, so strip /public prefix if present
                if (relative.startsWith('/public/')) {
                    relative = relative.substring(7);
                }

                candidates = [
                    relative,
                    '/data' + relative
                ];
            }
            // Deduplicate
            candidates = [...new Set(candidates)];

            let response = null;
            let loadedPath = null;

            for (const path of candidates) {
                try {
                    // Robust encoding for filenames with parens/spaces
                    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
                    const res = await fetch(encodedPath);
                    const contentType = res.headers.get('content-type');
                    if (res.ok && (!contentType || !contentType.includes('text/html'))) {
                        response = res;
                        loadedPath = path;
                        break;
                    }
                } catch (e) { /* continue */ }
            }

            if (!response) {
                Logger.error(`InstrumentEngine: Failed to load sample '${id}'. Checked: ${candidates.join(', ')}. Run 'node scripts/generate_audio_manifest.js' to fix paths.`);
                return false;
            }

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
            Logger.message(`InstrumentEngine: Loaded sample '${id}' from ${loadedPath} (Key: ${analysis.note})`);
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
        
        // If it's an additive instrument, try to bake a wavetable for the Worklet
        if (definition.type === 'additive' && definition.partials) {
            // Check if harmonic (all freqs are integers)
            const isHarmonic = definition.partials.every(p => Math.abs(p.freq - Math.round(p.freq)) < 0.001);
            definition.isHarmonic = isHarmonic;

            // Bake in background (Restored to 1.5s for quality/looping stability)
            this.baker.bake(definition.partials, 1.5, this.ctx.sampleRate).then(wavetable => {
                definition.wavetable = wavetable;
                // Logger.message(`InstrumentEngine: Baked wavetable for '${id}'`);
            }).catch(e => Logger.warn(`InstrumentEngine: Failed to bake '${id}'`, e));
        }
    }

    playNote(instrumentId, frequency, time, duration, velocity = 0.5, destination) {
        const inst = this.instruments.get(instrumentId);
        if (!inst) {
            Logger.warn(`InstrumentEngine: Instrument '${instrumentId}' not found. Note skipped.`);
            return;
        }

        switch (inst.type) {
            case 'sampler':
                this.playSampleNote(inst.sampleId, frequency, time, duration, velocity, destination);
                break;
            case 'additive':
                // OPTIMIZATION: Use Native PeriodicWave for harmonic instruments (Stable, no crackle)
                if (inst.isHarmonic) {
                    this.playPeriodicNote(inst, frequency, time, duration, velocity, destination);
                } 
                // Use Worklet for inharmonic/complex textures
                else if (this.workletReady && inst.wavetable) {
                    // Use High-Performance AudioWorklet
                    this.playWorkletTone(inst, frequency, time, duration, velocity, destination);
                } else if (inst.algorithm === 'bell') {
                    // Fallback to PeriodicWave
                    this.additive.playAdditiveTone(frequency, time, duration, destination, null, inst); // partials will default
                } else if (inst.partials) {
                    this.additive.playAdditiveTone(frequency, time, duration, destination, inst.partials, inst);
                } else {
                    // Fallback for additive if no algorithm or partials specified
                    this.additive.playAdditiveTone(frequency, time, duration, destination, null, inst);
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

    playPeriodicNote(inst, frequency, time, duration, velocity, destination) {
        if (!Number.isFinite(frequency) || frequency <= 0) return;

        // Create or reuse PeriodicWave
        if (!inst.periodicWave) {
            const maxHarmonic = Math.max(...inst.partials.map(p => Math.round(p.freq)));
            const real = new Float32Array(maxHarmonic + 1);
            const imag = new Float32Array(maxHarmonic + 1);
            
            // Web Audio PeriodicWave: real=cosine terms, imag=sine terms
            inst.partials.forEach(p => {
                const idx = Math.round(p.freq);
                if (idx < real.length) {
                    imag[idx] = p.amp; // Sine components
                }
            });
            inst.periodicWave = this.ctx.createPeriodicWave(real, imag);
        }

        const osc = this.ctx.createOscillator();
        osc.setPeriodicWave(inst.periodicWave);
        osc.frequency.value = frequency;

        const env = this.ctx.createGain();
        osc.connect(env);
        env.connect(destination);

        this.applyEnvelope(env, osc, inst, time, duration, velocity);
    }

    playWorkletTone(inst, frequency, time, duration, velocity, destination) {
        const node = new AudioWorkletNode(this.ctx, 'additive-processor', {
            processorOptions: { wavetable: inst.wavetable }
        });

        const paramFreq = node.parameters.get('frequency');
        paramFreq.setValueAtTime(frequency, time);

        const env = this.ctx.createGain();
        node.connect(env);
        env.connect(destination);

        this.applyEnvelope(env, null, inst, time, duration, velocity, node);
    }

    applyEnvelope(env, osc, inst, time, duration, velocity, workletNode = null) {
        // Safety scaling to prevent clipping with additive synthesis
        const gainScale = 0.2; 
        const scaledVelocity = velocity * gainScale;

        // Envelope Logic (Simplified ADSR)
        const attack = inst.attack || 0.02;
        const release = inst.release || 0.1;
        const safeDuration = Math.max(duration, attack + 0.05);
        const endTime = time + safeDuration + release;

        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(scaledVelocity, time + attack);
        
        if (inst.envelope === 'sustained') {
            const decay = inst.decay || 0.1;
            const sustain = inst.sustain || 0.8;
            const sustainLevel = scaledVelocity * sustain;
            
            env.gain.linearRampToValueAtTime(sustainLevel, time + attack + decay);
            env.gain.setValueAtTime(sustainLevel, time + duration);
            env.gain.exponentialRampToValueAtTime(0.001, time + duration + release);
        } else {
            // Percussive decay
            env.gain.exponentialRampToValueAtTime(0.001, time + safeDuration + release);
        }
        
        // Ensure absolute silence at end to prevent DC offset accumulation
        env.gain.linearRampToValueAtTime(0, endTime);
        
        // Cleanup
        // Use an OscillatorNode as a precise timer on the audio thread.
        // This ensures cleanup happens exactly when the sound ends, preventing
        // node buildup even if the main JS thread is busy/lagging.
        const timerOsc = this.ctx.createOscillator();
        timerOsc.onended = () => {
            if (osc) { osc.stop(); osc.disconnect(); }
            if (workletNode) { workletNode.disconnect(); }
            env.disconnect();
        };
        timerOsc.start(time);
        if (osc) osc.start(time);
        timerOsc.stop(endTime + 0.1);
    }

    playSynthNote(frequency, time, duration, type, velocity, destination, params = {}) {
        if (!Number.isFinite(frequency) || frequency <= 0) return;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();

        osc.type = type || 'triangle';
        
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
