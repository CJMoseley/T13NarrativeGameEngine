import Logger from "../../core/Logger.js";
import { WavetableBaker } from "./t13ne-wavetable-baker.js";
import { T13Effects } from "./t13ne-effects.js";

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

    createSynthFromAnalysis(analysis, depth = 'medium', role = 'lead', instrumentId = '') {
        const fundamental = (analysis && analysis.freq) ? analysis.freq : 440;

        let partialCount = 5;
        if (depth === 'low') partialCount = 3;
        if (depth === 'high') partialCount = 12;
        if (depth === 'full') partialCount = 32;

        let partials = [];

        // CHECK 1: Do we have real FFT data?
        if (analysis && analysis.peaks && analysis.peaks.length > 0) {
            const usedPeaks = analysis.peaks.slice(0, partialCount);
            partials = usedPeaks.map(p => ({
                freq: p.freq / fundamental,
                amp: p.amp,
                decay: 1.0 / Math.pow(p.freq / fundamental, 0.5)
            }));
        } else {
            // Fallback: Rich Waveform Synthesis (Square/Sawtooth like Harmonic Series)
            // Use a stable seed based on the fundamental pitch AND the instrument ID to ensure uniqueness
            let idHash = 0;
            if (instrumentId) {
                for (let i = 0; i < instrumentId.length; i++) {
                    idHash = ((idHash << 5) - idHash) + instrumentId.charCodeAt(i);
                    idHash |= 0;
                }
            }

            const stableSeed = Math.abs(Math.floor(fundamental * 0.1337) ^ idHash);
            const pseudoRand = (i) => {
                const x = Math.sin(stableSeed + i) * 12345.6789;
                return x - Math.floor(x);
            };

            const targetPartials = (depth === 'high' || depth === 'full') ? 24 : 12;
            for (let i = 1; i <= targetPartials; i++) {
                let freq = i;
                let amp = 0;
                let decay = 1.0;

                if (role === 'pad') {
                    // Warm pad (Subtle detuning for thickness without the previous warbles)
                    freq = i + (pseudoRand(i) * 0.008 - 0.004);
                    amp = (1.0 / Math.pow(i, 0.8));
                    decay = 1.0 / Math.pow(i, 0.2);
                } else if (role === 'bass') {
                    // Deep, heavy bass (Mostly odd harmonics for square-like feel)
                    freq = i;
                    if (i % 2 === 1) {
                        amp = 1.0 / i;
                    } else {
                        amp = (1.0 / i) * 0.3; // Suppressed evens
                    }
                    decay = 1.0 / Math.sqrt(i);
                } else if (role === 'hat' || role === 'snare') {
                    // Noisy/Cymbal-like (High frequencies, high density)
                    freq = i * (4 + pseudoRand(i) * 10);
                    amp = Math.exp(-0.2 * i);
                    decay = 0.2 / i;
                } else if (role === 'kick' || role === 'perc') {
                    // Percussive (Non-harmonic clang)
                    freq = i * (1 + pseudoRand(i) * 2.5);
                    amp = Math.exp(-0.15 * i);
                    decay = 0.4 / i;
                } else { // lead, rhythm, etc.
                    // Lead: Bright Sawtooth-like (All harmonics)
                    freq = i + (pseudoRand(i) * 0.01);
                    amp = 1.0 / i;
                    decay = 1.0 / Math.pow(i, 0.5);
                }

                // Add slight randomness to individual amps for "life"
                amp *= (0.8 + pseudoRand(i + 100) * 0.4);

                partials.push({ freq, amp, decay });
            }

            // Normalize amps by SUM to ensure total energy <= 100%
            const sumAmp = partials.reduce((sum, p) => sum + p.amp, 0);
            if (sumAmp > 1.0) partials.forEach(p => p.amp /= sumAmp);
        }

        // Depth-based filtering instead of manual detuned layers (rely on effects for complexity)
        if (partials.length > partialCount) {
            partials = partials.slice(0, partialCount);
        }

        // Re-normalize to ensure total sum is safe
        const totalSum = partials.reduce((sum, p) => sum + p.amp, 0);
        if (totalSum > 0.001) partials.forEach(p => p.amp /= totalSum);

        // Check for harmonicity (lenient tolerance to allow slight drift)
        const isHarmonic = partials.every(p => Math.abs(p.freq - Math.round(p.freq)) < 0.02);

        return {
            type: 'additive',
            algorithm: 'custom',
            depth: depth,
            partials: partials,
            role: role,
            instrumentId: instrumentId,
            isHarmonic: isHarmonic
        };
    }

    // Updated createBellTone to be more generic 'playAdditiveTone'
    playAdditiveTone(frequency, time, duration, destination, partials, velocity = 1.0, params = {}, onCleanup = null) {
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
        const sustain = params.sustain !== undefined ? params.sustain : 1.0;
        const release = params.release || 0.2;

        const activePartials = partials.slice(0, 32);
        const totalAmp = activePartials.reduce((s, p) => s + p.amp, 0);
        const ampScale = totalAmp > 1.0 ? 1.0 / totalAmp : 1.0;

        const masterScale = 0.1 * velocity; // Standardized with Subtractive path

        // Determine the master partial (the one that lasts the longest) to trigger final cleanup
        let maxStop = 0;
        let masterIdx = 0;
        const partialData = activePartials.map((p, i) => {
            const stop = (envelope === 'sustained') ? (time + duration + release + 0.1) : (time + (Math.max(0.05, duration * (p.decay || 1.0))) + 0.2);
            if (stop > maxStop) {
                maxStop = stop;
                masterIdx = i;
            }
            return { p, stop };
        });

        activePartials.forEach((p, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.frequency.value = frequency * p.freq;
            osc.connect(gain);
            gain.connect(destination);

            // Register source for potential kill stopping
            if (params.sources) params.sources.push(osc);

            const peakGain = p.amp * ampScale * masterScale;
            const stopTime = partialData[idx].stop;

            osc.onended = () => {
                osc.disconnect();
                gain.disconnect();
                // ONLY trigger master cleanup when the longest-living partial finishes
                if (idx === masterIdx) {
                    if (params.onCleanup) params.onCleanup();
                    if (onCleanup) onCleanup();
                }
            };

            if (envelope === 'sustained') {
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(peakGain, time + attack);

                if (duration > attack + decay) {
                    const sustainLevel = peakGain * sustain;
                    gain.gain.linearRampToValueAtTime(sustainLevel, time + attack + decay);
                    gain.gain.setValueAtTime(sustainLevel, time + duration);
                } else {
                    gain.gain.setValueAtTime(peakGain, time + duration);
                }

                gain.gain.exponentialRampToValueAtTime(0.001, time + duration + release);
                gain.gain.linearRampToValueAtTime(0, time + duration + release + 0.05);
            } else {
                const attackTime = 0.01;
                const decayDuration = Math.max(0.05, duration * (p.decay || 1.0));
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(peakGain, time + attackTime);
                gain.gain.exponentialRampToValueAtTime(0.001, time + attackTime + decayDuration);
                gain.gain.linearRampToValueAtTime(0, time + attackTime + decayDuration + 0.05);
            }

            osc.start(time);
            osc.stop(stopTime);
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
        this.effects = new T13Effects(audioContext);
        this.workletReady = false;
        this.allowRuntimeAnalysis = false;

        // Voice Management & Performance
        this.activeVoices = []; // Tracker for all currently playing nodes
        this.MAX_GLOBAL_VOICES = 128; // Increased for full orchestral arrangements
        this.polyphonyLimits = {
            'Synth_Pad': 12,
            'Synth_SpacePad': 10,
            'Piano': 16,
            'v_pad': 12,
            'v_bass': 6,
            'v_lead': 12
        };

        // Worklet Pooling
        this.MAX_WORKLET_VOICES = 64; // Doubled pool
        this.workletPool = []; // Array of { node: AudioWorkletNode, env: GainNode, inUse: boolean }
        this.wavetableCache = new Map(); // Cache for baked wavetables
    }

    setPerformanceMode(mode) {
        if (mode === 'low') {
            this.MAX_GLOBAL_VOICES = 32;
            this.MAX_WORKLET_VOICES = 16;
            this.polyphonyLimits = {
                'Synth_Pad': 4,
                'Synth_SpacePad': 4,
                'Piano': 8,
                'v_pad': 4,
                'v_bass': 2,
                'v_lead': 4
            };
        } else if (mode === 'medium') {
            this.MAX_GLOBAL_VOICES = 64;
            this.MAX_WORKLET_VOICES = 32;
            this.polyphonyLimits = {
                'Synth_Pad': 8,
                'Synth_SpacePad': 6,
                'Piano': 12,
                'v_pad': 8,
                'v_bass': 4,
                'v_lead': 8
            };
        } else {
            this.MAX_GLOBAL_VOICES = 128;
            this.MAX_WORKLET_VOICES = 64;
            this.polyphonyLimits = {
                'Synth_Pad': 12,
                'Synth_SpacePad': 10,
                'Piano': 16,
                'v_pad': 12,
                'v_bass': 6,
                'v_lead': 12
            };
        }
        Logger.message(`InstrumentEngine: Performance mode set to ${mode}. Polyphony limited to ${this.MAX_GLOBAL_VOICES} voices.`);
    }

    /**
     * Initializes the AudioWorklet module.
     */
    async init() {
        if (this.workletReady) return;
        try {
            await this.ctx.audioWorklet.addModule('/src/t13ne/modules/audio/t13ne-additiveProcessor.js');
            this.workletReady = true;
            Logger.message("InstrumentEngine: AudioWorklet module loaded.");

            // Pre-warm the worklet pool for performance
            for (let i = 0; i < this.MAX_WORKLET_VOICES; i++) {
                const node = new AudioWorkletNode(this.ctx, 'additive-processor');
                const env = this.ctx.createGain();
                node.connect(env);
                env.gain.value = 0;
                this.workletPool.push({ node, env, inUse: false });
            }
            Logger.message(`InstrumentEngine: Worklet pool initialized with ${this.MAX_WORKLET_VOICES} persistent voices.`);

        } catch (e) {
            Logger.warn("InstrumentEngine: Failed to load AudioWorklet module. Falling back to PeriodicWave.", e);
        }

        // Minimal Base Instruments
        this.defineInstrument('sine', { type: 'additive', algorithm: 'custom', partials: [{ freq: 1, amp: 1 }, { freq: 2, amp: 0.1 }, { freq: 3, amp: 0.05 }] });
        this.defineInstrument('saw', { type: 'additive', algorithm: 'custom', partials: [{ freq: 1, amp: 1 }, { freq: 2, amp: 0.5 }, { freq: 3, amp: 0.33 }, { freq: 4, amp: 0.25 }, { freq: 5, amp: 0.2 }, { freq: 6, amp: 0.17 }] });
        this.defineInstrument('bell', { type: 'additive', algorithm: 'bell', partials: [{ freq: 1, amp: 1 }, { freq: 2, amp: 0.6 }, { freq: 2.4, amp: 0.4 }, { freq: 3, amp: 0.3 }, { freq: 4.1, amp: 0.2 }] });

        // Piano fallback (Rich harmonic series)
        this.defineInstrument('Piano', {
            type: 'additive',
            algorithm: 'custom',
            envelope: 'percussive',
            isHarmonic: true,
            partials: [
                { freq: 1, amp: 1, decay: 2.5 },
                { freq: 2, amp: 0.6, decay: 2.0 },
                { freq: 3, amp: 0.4, decay: 1.5 },
                { freq: 4.01, amp: 0.2, decay: 1.0 },
                { freq: 5.02, amp: 0.15, decay: 0.8 }
            ]
        });

        // Create a noise buffer for percussion
        const bufferSize = this.ctx.sampleRate * 2.0; // 2 seconds of noise
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    createSyntheticInstrument(sourceId, newId, depth = 'medium', envelope = 'percussive', role = 'lead') {
        // 1. Get Analysis (with fallback if missing)
        let analysis = this.manifestManager.getAssetAnalysis('samples', sourceId);
        if (!analysis) {
            analysis = { freq: 440, note: 'A4', peaks: [] };
        }

        // 2. Generate Definition via Additive Processor
        const def = this.additive.createSynthFromAnalysis(analysis, depth, role, newId);
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
                    relative
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
                if (this.allowRuntimeAnalysis) {
                    if (!this.analyzer) {
                        analysis = this.inlineAnalyze(audioBuffer);
                    } else {
                        analysis = await this.analyzer.analyze(audioBuffer);
                    }
                    // Save back to manifest runtime cache
                    this.manifestManager.updateAssetAnalysis('samples', id, analysis);
                } else {
                    // Fallback to default analysis if runtime analysis is disabled
                    analysis = { freq: 261.63, note: 'C4', peaks: [] };
                    Logger.warn(`InstrumentEngine: Analysis missing for '${id}' and runtime analysis is disabled. Using C4 fallback.`);
                }
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
            // Check if harmonic (relaxed threshold to 0.1 to allow high-performance PeriodicWave for most sounds)
            const isHarmonic = definition.partials.every(p => Math.abs(p.freq - Math.round(p.freq)) < 0.1);
            definition.isHarmonic = isHarmonic;

            // Bake in background (Restored to 1.5s for quality/looping stability)
            this.baker.bake(definition.partials, 1.5, this.ctx.sampleRate).then(wavetable => {
                definition.wavetable = wavetable;
                // Logger.message(`InstrumentEngine: Baked wavetable for '${id}'`);
            }).catch(e => Logger.warn(`InstrumentEngine: Failed to bake '${id}'`, e));
        }
    }

    playNote(instrumentId, frequency, time, duration, velocity = 0.5, destination, pan = 0) {
        const inst = this.instruments.get(instrumentId);
        if (!inst) {
            Logger.warn(`InstrumentEngine: Instrument '${instrumentId}' not found. Note skipped.`);
            return;
        }

        // 0. Voice Management / Polyphony Limiting
        this._managePolyphony(instrumentId, time);

        // 1. Create Effect Chain
        let effectNodes = [];
        let chainHead = this.ctx.createGain(); // Dry output of the note
        let chainTail = chainHead;

        if (inst.effects && Array.isArray(inst.effects)) {
            inst.effects.forEach(fx => {
                let fxNode = null;
                switch (fx.type) {
                    case 'distortion':
                        fxNode = this.effects.createDistortion(fx.amount);
                        break;
                    case 'reverb':
                        fxNode = this.effects.createReverb(fx.duration, fx.decay);
                        break;
                    case 'phaser':
                        const phaser = this.effects.createPhaser(fx.stages, fx.feedback, fx.rate);
                        fxNode = { input: phaser.input, output: phaser.output, extra: [phaser.lfo] };
                        break;
                    case 'chorus':
                        const chorus = this.effects.createChorus(fx.rate, fx.depth, fx.delay);
                        fxNode = { input: chorus.input, output: chorus.output, extra: [chorus.lfo] };
                        break;
                    case 'filter':
                        fxNode = this.ctx.createBiquadFilter();
                        fxNode.type = fx.filterType || 'lowpass';
                        fxNode.frequency.value = fx.frequency || 1000;
                        fxNode.Q.value = fx.q || 1;
                        break;
                    case 'noisegate':
                        fxNode = this.effects.createNoiseGate(fx.threshold, fx.ratio);
                        break;
                }

                if (fxNode) {
                    const input = fxNode.input || fxNode;
                    const output = fxNode.output || fxNode;
                    chainTail.connect(input);
                    chainTail = output;
                    effectNodes.push(fxNode);
                }
            });
        }

        // 2. Stereo Panning Stage
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = pan;
        chainTail.connect(panner);
        panner.connect(destination);

        // Cleanup helper for the chain
        const releaseTime = inst.release || 0.1;
        const endTime = time + duration + releaseTime;

        const masterCleanup = () => {
            if (voiceObj.cleanedUp) return;
            voiceObj.cleanedUp = true;

            const idx = this.activeVoices.indexOf(voiceObj);
            if (idx !== -1) this.activeVoices.splice(idx, 1);

            try {
                chainHead.disconnect();
                effectNodes.forEach(node => {
                    const n = node.input || node;
                    const out = node.output || node;
                    if (n && n.disconnect) n.disconnect();
                    if (out && out.disconnect) out.disconnect();
                    if (node.extra) node.extra.forEach(e => { try { e.stop(); e.disconnect(); } catch (err) { } });
                });
                panner.disconnect();
            } catch (e) { }
        };

        const masterKill = () => {
            if (voiceObj.ended) return;
            voiceObj.ended = true; // Mark immediately to free up polyphony slot

            const now = this.ctx.currentTime;
            chainHead.gain.cancelScheduledValues(now);
            chainHead.gain.setValueAtTime(chainHead.gain.value, now);
            // Linear ramp to zero to avoid DC offset click
            chainHead.gain.linearRampToValueAtTime(0, now + 0.05);

            // CRITICAL RESOURCE FIX: Stop all oscillators/sources associated with this voice immediately
            voiceObj.sources.forEach(src => {
                try {
                    if (src.stop) src.stop(now + 0.06);
                } catch (e) { }
            });

            setTimeout(masterCleanup, 100); // Wait for fade then clean up nodes
        };

        const voiceObj = {
            id: instrumentId,
            time: time,
            ended: false,
            cleanedUp: false,
            sources: [], // Track sources for rigorous cleanup
            cleanup: masterCleanup,
            kill: masterKill
        };
        this.activeVoices.push(voiceObj);

        const playerParams = { ...inst, sources: voiceObj.sources };

        // 3. Trigger Note with chainHead as destination
        switch (inst.type) {
            case 'sampler':
                this.playSampleNote(inst.sampleId, frequency, time, duration, velocity, chainHead, masterCleanup, voiceObj.sources);
                break;
            case 'additive':
                // PREFER PeriodicWave for stability if harmonic (covers Piano/Standard Synths)
                if (inst.isHarmonic || !this.workletReady) {
                    this.playPeriodicNote(inst, frequency, time, duration, velocity, chainHead, masterCleanup, voiceObj.sources);
                }
                else {
                    // Use worklet for ALL other additive types if ready
                    if (!inst.wavetable && (inst.partials || inst.algorithm === 'bell')) {
                        const partials = inst.partials || (inst.algorithm === 'bell' ? this.additive.createSynthFromAnalysis(null, 'medium', 'lead').partials : null);
                        if (partials) inst.wavetable = this.getWavetableForPartials(partials, instrumentId);
                    }
                    this.playWorkletTone(inst, frequency, time, duration, velocity, chainHead, masterCleanup, voiceObj.sources);
                }
                break;
            case 'noise':
                this.playNoiseNote(time, duration, velocity, chainHead, playerParams, masterCleanup, voiceObj.sources);
                break;
            case 'synth':
            default:
                this.playSynthNote(frequency, time, duration, inst.oscType, velocity, chainHead, playerParams, masterCleanup, voiceObj.sources);
                break;
        }
    }

    playNoiseLayer(destination, time, duration, velocity, params, sources) {
        if (!params.noise || !this.noiseBuffer) return;
        
        const noiseGain = params.noise.level || 0.1;
        // Future: support 'pink' via filter or different buffer
        
        const source = this.ctx.createBufferSource();
        source.buffer = this.noiseBuffer;
        source.loop = true;
        // Randomize start position to avoid phasing artifacts on repeated notes
        source.loopStart = Math.random() * (this.noiseBuffer.duration - 0.1);
        source.loopEnd = this.noiseBuffer.duration;
        
        if (sources) sources.push(source);

        const env = this.ctx.createGain();
        
        // Optional filter for the noise
        let output = env;
        if (params.noise.filterCutoff) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = params.noise.filterType || 'lowpass';
            filter.frequency.value = params.noise.filterCutoff;
            env.connect(filter);
            output = filter;
        }

        source.connect(env);
        output.connect(destination);

        // Envelope matching the main note or custom
        const attack = params.noise.attack || params.attack || 0.01;
        const release = params.noise.release || params.release || 0.1;
        const safeDuration = Math.max(duration, attack + 0.01);
        
        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(velocity * noiseGain, time + attack);
        env.gain.setValueAtTime(velocity * noiseGain, time + safeDuration);
        env.gain.exponentialRampToValueAtTime(0.001, time + safeDuration + release);
        
        source.start(time, source.loopStart);
        source.stop(time + safeDuration + release + 0.1);
    }

    getWavetableForPartials(partials, instrumentId = 'temp') {
        // Use a stable key for caching: instrumentId if provided, otherwise a JSON string of partials
        const key = instrumentId !== 'temp' ? instrumentId : JSON.stringify(partials);
        if (this.wavetableCache.has(key)) return this.wavetableCache.get(key);

        const tableSize = 2048;
        const wavetable = new Float32Array(tableSize);
        const twoPi = Math.PI * 2;

        for (let i = 0; i < tableSize; i++) {
            let sum = 0;
            const t = i / tableSize;
            partials.forEach(p => {
                sum += Math.sin(twoPi * p.freq * t) * p.amp;
            });
            wavetable[i] = sum;
        }

        // Normalize
        let max = 0;
        for (let i = 0; i < wavetable.length; i++) {
            const a = Math.abs(wavetable[i]);
            if (a > max) max = a;
        }
        if (max > 0) {
            for (let i = 0; i < wavetable.length; i++) wavetable[i] /= max;
        }

        this.wavetableCache.set(key, wavetable);
        return wavetable;
    }

    playPeriodicNote(inst, frequency, time, duration, velocity, destination, onCleanup = null, sources = null) {
        if (!Number.isFinite(frequency) || frequency <= 0) {
            if (onCleanup) onCleanup();
            return;
        }

        if (!inst.periodicWave) {
            const hasPartials = inst.partials && inst.partials.length > 0;
            const maxHarmonic = hasPartials ? Math.max(1, ...inst.partials.map(p => Math.round(p.freq))) : 1;
            const real = new Float32Array(maxHarmonic + 1);
            const imag = new Float32Array(maxHarmonic + 1);

            if (hasPartials) {
                inst.partials.forEach(p => {
                    const idx = Math.round(p.freq);
                    if (idx < real.length && idx > 0) {
                        imag[idx] = p.amp;
                    }
                });
                // Normalized Fundamental if empty
                if (imag.every(v => v === 0)) imag[1] = 1;
            } else {
                imag[1] = 1.0;
            }
            inst.periodicWave = this.ctx.createPeriodicWave(real, imag);
        }

        const osc = this.ctx.createOscillator();
        if (sources) sources.push(osc);
        osc.setPeriodicWave(inst.periodicWave);
        osc.frequency.value = frequency;

        const env = this.ctx.createGain();
        osc.connect(env);
        env.connect(destination);

        // Add Noise Layer
        this.playNoiseLayer(destination, time, duration, velocity, inst, sources);

        this.applyEnvelope(env, osc, inst, time, duration, velocity, null, onCleanup);
    }

    playWorkletTone(inst, frequency, time, duration, velocity, destination, onCleanup = null, sources = null) {
        if (!this.workletReady) {
            if (onCleanup) onCleanup();
            return;
        }

        // Find an idle voice in the pool
        let poolItem = this.workletPool.find(item => !item.inUse);

        // If pool is full, STEAL the oldest (first) voice to avoid silence or oscillator spikes
        if (!poolItem) {
            poolItem = this.workletPool[0];
            // Rotate the pool so we don't keep stealing the same one if multiple needed
            this.workletPool.push(this.workletPool.shift());
        }

        poolItem.inUse = true;
        const node = poolItem.node;
        const env = poolItem.env;

        // Reset hardware state immediately to prevent "ghost" tails or pops
        const now = this.ctx.currentTime;
        env.gain.cancelScheduledValues(now);
        env.gain.setValueAtTime(0, now);

        try { env.disconnect(); } catch (e) { }
        env.connect(destination);

        // Update worklet node with new wavetable
        node.port.postMessage({
            type: 'update',
            wavetable: inst.wavetable,
            active: true,
            resetPhase: true
        });

        const paramFreq = node.parameters.get('frequency');
        paramFreq.cancelScheduledValues(time);
        paramFreq.setValueAtTime(frequency, time);

        if (sources) sources.push(node);

        const wrapCleanup = () => {
            // Deactivate worklet processing
            node.port.postMessage({ type: 'update', active: false });
            poolItem.inUse = false;
            try { env.disconnect(); } catch (e) { }
            if (onCleanup) onCleanup();
        };

        // Add Noise Layer
        this.playNoiseLayer(destination, time, duration, velocity, inst, sources);

        this.applyEnvelope(env, null, inst, time, duration, velocity, node, wrapCleanup);
    }

    applyEnvelope(env, osc, inst, time, duration, velocity, workletNode = null, onCleanup = null) {
        const gainScale = 0.25; // Reduced to prevent mix overcrowding and ducking
        const scaledVelocity = velocity * gainScale;

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

            const sustainTime = Math.min(time + attack + decay, time + duration);
            env.gain.linearRampToValueAtTime(sustainLevel, sustainTime);

            if (time + duration > sustainTime) {
                env.gain.setValueAtTime(sustainLevel, time + duration);
            }
            env.gain.exponentialRampToValueAtTime(0.001, time + duration + release);
        } else {
            env.gain.exponentialRampToValueAtTime(0.001, time + safeDuration + release);
        }

        env.gain.linearRampToValueAtTime(0, endTime);

        const cleanup = () => {
            try {
                if (osc) { osc.disconnect(); }
                if (workletNode) { try { workletNode.stop(); } catch (e) { } workletNode.disconnect(); }
                env.disconnect();
            } catch (e) { }
            if (onCleanup) onCleanup();
        };

        if (osc) {
            osc.onended = cleanup;
            osc.start(time);
            osc.stop(endTime + 0.1);
        } else {
            const timerOsc = this.ctx.createOscillator();
            timerOsc.onended = cleanup;
            timerOsc.start(time);
            timerOsc.stop(endTime + 0.1);
        }
    }

    playSynthNote(frequency, time, duration, type, velocity, destination, params = {}, onCleanup = null, sources = null) {
        if (!Number.isFinite(frequency) || frequency <= 0) return;
        const osc = this.ctx.createOscillator();
        if (sources) sources.push(osc);
        const env = this.ctx.createGain();

        osc.type = type || 'triangle';

        if (params.pitchEnv) {
            const startFreq = params.pitchEnv.startMult ? frequency * params.pitchEnv.startMult : frequency;
            const dropTime = params.pitchEnv.time || 0.1;
            osc.frequency.setValueAtTime(startFreq, time);
            osc.frequency.exponentialRampToValueAtTime(frequency, time + dropTime);
        } else {
            osc.frequency.value = frequency;
        }

        let sourceNode = osc;
        if (params.filterType) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = params.filterType;
            filter.frequency.value = params.filterFreq || 1000;
            if (params.filterQ) filter.Q.value = params.filterQ;
            osc.connect(filter);
            sourceNode = filter;
        }

        // Add Noise Layer
        this.playNoiseLayer(destination, time, duration, velocity, params, sources);

        sourceNode.connect(env);
        env.connect(destination);

        const attack = params.attack || 0.01;
        const release = params.release || 0.1;
        const safeDuration = Math.max(duration, attack + 0.01);
        const scaledVelocity = velocity * 0.5; // Boosted from 0.1

        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(scaledVelocity, time + attack);
        env.gain.setValueAtTime(scaledVelocity, time + safeDuration);
        env.gain.exponentialRampToValueAtTime(0.001, time + safeDuration + release);
        env.gain.linearRampToValueAtTime(0, time + safeDuration + release + 0.01);

        const cleanup = () => {
            osc.disconnect();
            env.disconnect();
            if (params.filterType) sourceNode.disconnect();
            if (onCleanup) onCleanup();
        };
        osc.onended = cleanup;

        osc.start(time);
        osc.stop(time + safeDuration + release + 0.05);
    }

    playSampleNote(sampleId, frequency, time, duration, velocity, destination, onCleanup = null, sources = null) {
        const buffer = this.samples.get(sampleId);
        if (!buffer) {
            if (onCleanup) onCleanup();
            return;
        }

        const source = this.ctx.createBufferSource();
        if (sources) sources.push(source);
        source.buffer = buffer;

        const rate = frequency / 261.63; // Assume C4 base
        source.playbackRate.value = rate;

        const env = this.ctx.createGain();
        source.connect(env);
        env.connect(destination);

        const scaledVelocity = velocity * 0.5; // Boosted from 0.1
        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(scaledVelocity, time + 0.005);
        env.gain.setValueAtTime(scaledVelocity, time + duration);
        env.gain.linearRampToValueAtTime(0, time + duration + 0.1);

        const cleanup = () => {
            source.disconnect();
            env.disconnect();
            if (onCleanup) onCleanup();
        };
        source.onended = cleanup;

        source.start(time);
        source.stop(time + duration + 0.2);
    }

    playNoiseNote(time, duration, velocity, destination, params = {}, onCleanup = null, sources = null) {
        const source = this.ctx.createBufferSource();
        if (sources) sources.push(source);
        source.buffer = this.noiseBuffer;

        const loopStart = Math.random() * (this.noiseBuffer.duration - duration - 0.1);
        source.loop = true;
        source.loopStart = loopStart > 0 ? loopStart : 0;
        source.loopEnd = this.noiseBuffer.duration;

        const env = this.ctx.createGain();
        let outputNode = source;
        if (params.filterType) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = params.filterType;
            filter.frequency.value = params.filterFreq || 1000;
            if (params.filterQ) filter.Q.value = params.filterQ;
            source.connect(filter);
            outputNode = filter;
        }

        outputNode.connect(env);
        env.connect(destination);

        const safeDuration = Math.max(duration, 0.05);
        const scaledVelocity = velocity * 0.6; // Boosted from 0.15 for punchier drums
        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(scaledVelocity, time + 0.005);
        env.gain.exponentialRampToValueAtTime(0.001, time + safeDuration);
        env.gain.linearRampToValueAtTime(0, time + safeDuration + 0.05);

        const cleanup = () => {
            source.disconnect();
            env.disconnect();
            if (params.filterType) outputNode.disconnect();
            if (onCleanup) onCleanup();
        };
        source.onended = cleanup;

        source.start(time, source.loopStart);
        source.stop(time + safeDuration + 0.1);
    }

    stopAll(immediate = false) {
        Logger.message(`InstrumentEngine: Stopping all voices (immediate: ${immediate}).`);
        const voices = [...this.activeVoices];
        this.activeVoices = [];

        voices.forEach(v => {
            if (immediate) v.cleanup();
            else v.kill();
        });
    }

    stopVoices(id) {
        const toKill = this.activeVoices.filter(v => v.id === id);
        toKill.forEach(v => v.kill());
    }

    _managePolyphony(id, now) {
        const playing = this.activeVoices.filter(v => !v.ended);
        const limit = this.polyphonyLimits[id] || 16;
        const instrumentVoices = playing.filter(v => v.id === id);

        if (instrumentVoices.length >= limit) {
            const oldest = instrumentVoices.sort((a, b) => a.time - b.time)[0];
            if (oldest) oldest.kill();
        }

        if (playing.length >= this.MAX_GLOBAL_VOICES) {
            const oldest = playing.sort((a, b) => a.time - b.time)[0];
            if (oldest) oldest.kill();
        }
    }
}
