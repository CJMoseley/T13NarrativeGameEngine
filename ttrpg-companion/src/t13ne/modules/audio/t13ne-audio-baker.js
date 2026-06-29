import { AudioAnalyzer } from './t13ne-audio-analyzer.js';
import Logger from '../../core/Logger.js';

/**
 * AudioBaker
 * Automates the analysis of audio samples from the manifest.
 * Generates .asd (Audio Spectral Data) files for use by the InstrumentEngine.
 * Intended for use in Author Mode to bake assets.
 */
export class AudioBaker {
    constructor(audioContext, manifestManager) {
        this.ctx = audioContext;
        this.manifestManager = manifestManager;
        this.analyzer = new AudioAnalyzer(this.ctx);
    }

    /**
     * Runs through the manifest, analyzes samples, and generates .asd data.
     * @returns {Promise<Object>} A map of filename -> ASD data.
     */
    async bakeAll() {
        Logger.message("AudioBaker: Starting batch bake of all samples...");
        const samples = this.manifestManager.manifest.samples;
        const results = {};
        let count = 0;

        for (const [key, data] of Object.entries(samples)) {
            // Skip if we already have valid analysis data, unless forced
            if (data.analysis && data.analysis.freq) continue;

            try {
                // 1. Load the audio buffer
                const url = this.manifestManager.getAssetPath('samples', key);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

                // 2. Analyze content
                const analysis = await this.analyzer.analyze(audioBuffer);
                
                // 3. Generate .asd filename (replace extension)
                let asdName = data.filename;
                const lastDotIndex = asdName.lastIndexOf('.');
                if (lastDotIndex !== -1) {
                    asdName = asdName.substring(0, lastDotIndex) + '.asd';
                } else {
                    asdName += '.asd';
                }

                // 4. Structure the ASD file content
                const asdData = {
                    source: data.filename,
                    analysis: analysis,
                    timestamp: Date.now(),
                    version: "1.0"
                };

                results[key] = asdData;
                
                // Update runtime manifest immediately
                this.manifestManager.updateAssetAnalysis('samples', key, analysis);
                
                Logger.message(`AudioBaker: Baked ${key} -> ${asdName} (Freq: ${analysis.freq}Hz)`);
                count++;

            } catch (e) {
                Logger.warn(`AudioBaker: Failed to bake '${key}' (${data.filename})`, e);
            }
        }
        
        Logger.message(`AudioBaker: Batch complete. Processed ${count} samples.`);
        return results;
    }
}
