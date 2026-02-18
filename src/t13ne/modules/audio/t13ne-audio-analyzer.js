import Logger from '/src/t13ne/core/Logger.js';
import { WavetableBaker } from '/src/t13ne/modules/audio/t13ne-wavetable-baker.js';

/**
 * AudioAnalyzer Module
 * Integrated client-side audio analysis for T13NE.
 * Handles FFT, Pitch Detection, and Key/Chord Estimation.
 */
export class AudioAnalyzer {
    constructor(audioContext) {
        this.ctx = audioContext;
        this.baker = new WavetableBaker();
    }

    /**
     * Batch processes the manifest to generate .asd analysis data for samples.
     * @param {AudioManifestManager} manifestManager 
     */
    async processManifest(manifestManager) {
        Logger.message("AudioAnalyzer: Starting batch analysis of samples...");
        const samples = manifestManager.manifest.samples;
        let count = 0;

        for (const [key, data] of Object.entries(samples)) {
            // Skip if we already have valid analysis data
            if (data.analysis && data.analysis.freq) continue;

            try {
                const url = manifestManager.getAssetPath('samples', key);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

                const analysis = await this.analyze(audioBuffer);

                manifestManager.updateAssetAnalysis('samples', key, analysis);
                Logger.message(`AudioAnalyzer: Analyzed ${key} -> Freq: ${analysis.freq}Hz`);
                count++;

            } catch (e) {
                Logger.warn(`AudioAnalyzer: Failed to analyze '${key}'`, e);
            }
        }
        Logger.message(`AudioAnalyzer: Batch complete. Processed ${count} samples.`);
    }

    /**
     * One-shot method to analyze a sample and return a synthetic, GPU-baked version of it.
     * @param {AudioBuffer} buffer 
     * @returns {Promise<AudioBuffer>} Synthetic AudioBuffer
     */
    async analyzeAndBake(buffer) {
        // 1. Analyze to get Spectral Peaks
        const analysis = await this.analyze(buffer);
        const peaks = analysis.peaks || [];

        if (peaks.length === 0) {
            console.warn("No peaks found for baking.");
            return buffer; // Fallback to original
        }

        // 2. Bake using GPU
        // Normalize frequencies for the bake? 
        // The baker expects absolute {freq, amp}. Our Peaks are absolute. perfect.

        // Bake a duration equal to original or fixed? 
        // For a looping synth wave, we might want just 1-2 seconds loopable.
        // Let's use original duration for now to match envelope approx.
        const duration = Math.min(buffer.duration, 2.0); // Cap at 2s for efficiency

        const rawData = await this.baker.bake(peaks, duration, buffer.sampleRate);

        // 3. Convert Float32Array to AudioBuffer
        const newBuffer = this.ctx.createBuffer(1, rawData.length, buffer.sampleRate);
        newBuffer.copyToChannel(rawData, 0);

        return newBuffer;
    }

    /**
     * Analyzes an AudioBuffer to extract musical features including spectral peaks.
     * @param {AudioBuffer} buffer 
     * @param {object} options - { fftSize, smoothing, durationPercent }
     * @returns {Promise<object>} { freq, note, peaks }
     */
    async analyze(buffer, options = {}) {
        const data = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;

        // 1. Pitch Detection (Time Domain)
        const freq = this._autoCorrelate(data, sampleRate);
        const note = this._freqToNote(freq);

        // 2. Spectral Analysis (Frequency Domain)
        const peaks = await this.getSpectralPeaks(buffer, 32, options);

        return { freq: parseFloat(freq.toFixed(2)), note, peaks };
    }

    /**
     * Extracts spectral peaks (harmonics) using OfflineAudioContext and AnalyserNode.
     * @param {AudioBuffer} buffer 
     * @param {number} maxPeaks 
     * @param {object} options
     * @returns {Promise<Array<{freq: number, amp: number}>>}
     */
    async getSpectralPeaks(buffer, maxPeaks = 32, options = {}) {
        const sampleRate = buffer.sampleRate;
        const fftSize = options.fftSize || 4096; // Default or tweaked

        // We only need a short slice to analyze the timbre
        // Take a slice from 20% to avoid attack, ~0.2s long
        const analysisStart = Math.min(0.1, buffer.duration * (options.startPercent || 0.2));
        const analysisDuration = fftSize / sampleRate;

        const offlineCtx = new OfflineAudioContext(1, fftSize, sampleRate);

        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;

        const analyser = offlineCtx.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = options.smoothing !== undefined ? options.smoothing : 0.0;

        source.connect(analyser);
        analyser.connect(offlineCtx.destination);

        // Schedule sound
        source.start(0, analysisStart);

        // Mid-way through our short slice
        const suspendTime = analysisDuration / 2;

        // Use promise structure to capture data during suspend
        return new Promise((resolve, reject) => {
            offlineCtx.suspend(suspendTime).then(() => {
                const freqData = new Float32Array(analyser.frequencyBinCount);
                analyser.getFloatFrequencyData(freqData);

                const foundPeaks = this._findPeaksInSpectrum(freqData, sampleRate, fftSize, maxPeaks);
                resolve(foundPeaks); // Resolve promise with peaks

                // No need to resume really, as we have data, but good practice
                offlineCtx.resume();
            }).catch(reject);

            offlineCtx.startRendering().catch(reject);
        });
    }

    _findPeaksInSpectrum(dbData, sampleRate, fftSize, maxCount) {
        const binWidth = sampleRate / fftSize;
        const peaks = [];
        const thresholdDb = -70; // Noise floor

        for (let i = 1; i < dbData.length - 1; i++) {
            const v = dbData[i];
            if (v > thresholdDb) {
                // Local maxima
                if (v > dbData[i - 1] && v > dbData[i + 1]) {
                    // Convert dB to linear amplitude (0-1 approx)
                    // dB = 20 * log10(amp) => amp = 10^(dB/20)
                    const amp = Math.pow(10, v / 20);
                    const freq = i * binWidth;
                    peaks.push({ freq, amp });
                }
            }
        }

        // Sort by amplitude desc
        peaks.sort((a, b) => b.amp - a.amp);

        // Normalize amplitudes to largest peak
        if (peaks.length > 0) {
            const maxAmp = peaks[0].amp;
            if (maxAmp > 0) {
                peaks.forEach(p => p.amp /= maxAmp);
            }
        }

        return peaks.slice(0, maxCount);
    }

    _autoCorrelate(buf, sampleRate) {
        // Optimized time-domain autocorrelation
        let size = buf.length;
        // Focus on the "meat" of the sample (ignore silence at start/end)
        // ... (Simplified logic similar to the CJS script but optimized for browser JS)

        const maxSamples = Math.min(size, 4096);
        const slice = buf.slice(0, maxSamples);
        let rms = 0;
        for (let i = 0; i < maxSamples; i++) {
            rms += slice[i] * slice[i];
        }
        rms = Math.sqrt(rms / maxSamples);
        if (rms < 0.01) return -1;

        let bestOffset = -1;
        let maxCorr = 0;

        // Search range for musical freqs (e.g. 20Hz - 4000Hz)
        // Offset at 44100Hz: 20Hz ~= 2200 samples, 4000Hz ~= 11 samples

        for (let offset = 10; offset < maxSamples / 2; offset++) {
            let corr = 0;
            // Optimization: Skip every 2nd sample to reduce main-thread load during analysis
            // Optimization: Skip samples to reduce main-thread load during analysis (4x skipping)
            for (let i = 0; i < maxSamples - offset; i += 4) {
                corr += slice[i] * slice[i + offset];
            }
            if (corr > maxCorr) {
                maxCorr = corr;
                bestOffset = offset;
            }
        }

        if (bestOffset > 0) {
            return sampleRate / bestOffset;
        }
        return -1;
    }

    _freqToNote(freq) {
        if (!freq || freq <= 0) return 'Unknown';
        const A4 = 440;
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const semitones = 12 * Math.log2(freq / (A4 * Math.pow(2, -4.75)));
        const noteIndex = Math.round(semitones) % 12;
        const octave = Math.floor(semitones / 12);
        return notes[noteIndex] + octave;
        // Fix octaves: The formula gives octave relative to C0. 
        // 440Hz -> A4.
        // C0 is ~16.35Hz.
    }
}
