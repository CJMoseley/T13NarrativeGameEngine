import Logger from '../core/Logger.js';

/**
 * Generates a procedural engine sound that can be modulated.
 */
export class EngineSoundGenerator {
    constructor(audioContext, outputGain) {
        const funcName = 'EngineSoundGenerator.constructor';
        Logger.start(funcName);
        this.audioContext = audioContext;
        this.output = outputGain;
        this.oscillator = null;
        this.gain = null;
        this.isStarted = false;
        Logger.end(funcName);
    }

    /**
     * Starts the engine sound.
     */
    start() {
        if (this.isStarted) return;
        const funcName = 'EngineSoundGenerator.start';
        Logger.start(funcName);

        this.oscillator = this.audioContext.createOscillator();
        this.gain = this.audioContext.createGain();

        this.oscillator.type = 'sawtooth';
        this.oscillator.frequency.setValueAtTime(50, this.audioContext.currentTime); // Low base frequency

        this.gain.gain.setValueAtTime(0, this.audioContext.currentTime); // Start silent

        this.oscillator.connect(this.gain);
        this.gain.connect(this.output);

        this.oscillator.start();
        this.isStarted = true;
        Logger.message("EngineSoundGenerator: Started.");
        Logger.end(funcName);
    }

    /**
     * Stops the engine sound.
     */
    stop() {
        const funcName = 'EngineSoundGenerator.stop';
        Logger.start(funcName);
        if (!this.isStarted) return;

        this.oscillator.stop();
        this.isStarted = false;
        Logger.message("EngineSoundGenerator: Stopped.");
        Logger.end(funcName);
    }

    /**
     * Updates the engine sound based on the ship's thrust.
     * @param {number} thrust - A value representing the current thrust, typically between 0 and 1.
     */
    update(thrust) {
        if (!this.isStarted) return;

        // Modulate gain and frequency based on thrust
        const targetGain = thrust * 0.1; // Keep volume low
        const targetFrequency = 50 + (thrust * 100);

        this.gain.gain.linearRampToValueAtTime(targetGain, this.audioContext.currentTime + 0.1);
        this.oscillator.frequency.linearRampToValueAtTime(targetFrequency, this.audioContext.currentTime + 0.1);
    }
}
