import Logger from '../core/Logger.js';

/**
 * Generates a procedural wormhole ambiance sound.
 */
export class WormholeAmbiance {
    constructor(audioContext, outputGain) {
        const funcName = 'WormholeAmbiance.constructor';
        Logger.start(funcName);
        this.audioContext = audioContext;
        this.output = outputGain;
        this.noise = null;
        this.filter = null;
        this.isStarted = false;
        this.modulationTimeout = null;
        Logger.end(funcName);
    }

    /**
     * Starts the ambiance sound.
     */
    start() {
        if (this.isStarted) return;
        const funcName = 'WormholeAmbiance.start';
        Logger.start(funcName);

        // Create a buffer for white noise
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        this.noise = this.audioContext.createBufferSource();
        this.noise.buffer = noiseBuffer;
        this.noise.loop = true;

        this.filter = this.audioContext.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.setValueAtTime(100, this.audioContext.currentTime);

        this.noise.connect(this.filter);
        this.filter.connect(this.output);

        this.noise.start();
        this.isStarted = true;
        this.startModulation();
        Logger.message("WormholeAmbiance: Started.");
        Logger.end(funcName);
    }

    /**
     * Stops the ambiance sound.
     */
    stop() {
        const funcName = 'WormholeAmbiance.stop';
        Logger.start(funcName);
        if (!this.isStarted) return;

        if (this.modulationTimeout) {
            clearTimeout(this.modulationTimeout);
        }

        this.noise.stop();
        this.isStarted = false;
        Logger.message("WormholeAmbiance: Stopped.");
        Logger.end(funcName);
    }

    /**
     * Modulates the filter frequency to create an evolving soundscape.
     */
    startModulation() {
        const funcName = 'WormholeAmbiance.startModulation';
        Logger.start(funcName);
        if (!this.isStarted) return;

        const now = this.audioContext.currentTime;
        this.filter.frequency.setValueAtTime(this.filter.frequency.value, now);
        this.filter.frequency.linearRampToValueAtTime(100 + Math.random() * 200, now + 5 + Math.random() * 5);

        this.modulationTimeout = setTimeout(() => this.startModulation(), 5000 + Math.random() * 5000);
        Logger.end(funcName);
    }
}
