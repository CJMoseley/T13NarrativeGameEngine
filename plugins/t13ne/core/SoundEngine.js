import Logger from '@/js/core/Logger.js';

/**
 * Manages the Web Audio API context and master volume.
 */
export class SoundEngine {
    constructor() {
        const funcName = 'SoundEngine.constructor';
        Logger.start(funcName);
        this.audioContext = null;
        this.masterGain = null;
        this.isInitialized = false;
        Logger.end(funcName);
    }

    /**
     * Initializes the AudioContext. This must be called after a user gesture.
     */
    init() {
        if (this.isInitialized) return;
        const funcName = 'SoundEngine.init';
        Logger.start(funcName);

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.isInitialized = true;
            Logger.message("SoundEngine: AudioContext initialized successfully.");
        } catch (e) {
            Logger.message(`ERROR: SoundEngine: Could not initialize AudioContext. ${e}`);
        }
        Logger.end(funcName);
    }

    /**
     * Resumes the AudioContext.
     */
    start() {
        const funcName = 'SoundEngine.start';
        Logger.start(funcName);
        if (!this.isInitialized) {
            Logger.message("WARN: SoundEngine: Cannot start, not initialized.");
            Logger.end(funcName);
            return;
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                Logger.message("SoundEngine: AudioContext resumed.");
                Logger.end(funcName);
            });
        } else {
            Logger.end(funcName);
        }
    }

    /**
     * Suspends the AudioContext to save resources.
     */
    stop() {
        const funcName = 'SoundEngine.stop';
        Logger.start(funcName);
        if (!this.isInitialized) return;
        if (this.audioContext.state === 'running') {
            this.audioContext.suspend().then(() => {
                Logger.message("SoundEngine: AudioContext suspended.");
                Logger.end(funcName);
            });
        } else {
            Logger.end(funcName);
        }
    }

    /**
     * Sets the master volume.
     * @param {number} volume - A value between 0 and 1.
     */
    setMasterVolume(volume) {
        const funcName = 'SoundEngine.setMasterVolume';
        Logger.start(funcName);
        if (!this.isInitialized) return;
        this.masterGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        Logger.logVariables({ volume });
        Logger.end(funcName);
    }

    /**
     * Plays a sound effect.
     * @param {string} sfx - The name or identifier of the SFX to play.
     */
    playSFX(sfx) {
        const funcName = 'SoundEngine.playSFX';
        Logger.start(funcName);
        Logger.message(`SoundEngine: Playing SFX: ${sfx}`);
        // TODO: Implement actual audio playback (e.g., asset registry lookup)
        Logger.end(funcName);
    }
}
