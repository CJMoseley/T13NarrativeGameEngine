import Logger from './Logger.js';

export const AUDIO_BUS_NAMES = Object.freeze(['master', 'music', 'sfx', 'ambience', 'voip']);

function clamp01(v) {
    return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 1));
}

/**
 * Multi-bus Web Audio mixer (`master`, `music`, `sfx`, `ambience`, `voip`)
 * with clean headless/suspended fallbacks and per-bus metering/mute/volume controls.
 */
export class SoundEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.buses = new Map();
        this.busState = new Map();
        for (const name of AUDIO_BUS_NAMES) {
            this.busState.set(name, {
                volume: name === 'music' ? 0.5 : 1.0,
                muted: false
            });
        }
        this.isInitialized = false;
    }

    /**
     * Initializes the AudioContext and 5-bus mixer graph.
     * Accepts an optional injected AudioContext/OfflineAudioContext/mock for tests.
     */
    init(customContext = null) {
        if (this.isInitialized && !customContext) return;
        const funcName = 'SoundEngine.init';
        Logger.start(funcName);

        try {
            const Ctor = typeof window !== 'undefined'
                ? (window.AudioContext || window.webkitAudioContext)
                : globalThis.AudioContext;
            const ctx = customContext ?? (Ctor ? new Ctor() : null);
            if (!ctx) {
                Logger.message('WARN: SoundEngine: AudioContext unavailable (headless fallback active).');
                Logger.end(funcName);
                return;
            }

            this.audioContext = ctx;
            this.buses.clear();

            const masterGain = ctx.createGain();
            const masterAnalyser = typeof ctx.createAnalyser === 'function' ? ctx.createAnalyser() : null;
            if (masterAnalyser) masterAnalyser.fftSize = 256;

            const masterCfg = this.busState.get('master');
            masterGain.gain.value = masterCfg.muted ? 0 : masterCfg.volume;
            if (masterAnalyser) {
                masterGain.connect(masterAnalyser);
                masterAnalyser.connect(ctx.destination);
            } else {
                masterGain.connect(ctx.destination);
            }

            this.masterGain = masterGain;
            this.buses.set('master', { gain: masterGain, analyser: masterAnalyser });

            for (const name of AUDIO_BUS_NAMES) {
                if (name === 'master') continue;
                const gain = ctx.createGain();
                const analyser = typeof ctx.createAnalyser === 'function' ? ctx.createAnalyser() : null;
                if (analyser) analyser.fftSize = 256;
                const cfg = this.busState.get(name);
                gain.gain.value = cfg.muted ? 0 : cfg.volume;
                if (analyser) {
                    gain.connect(analyser);
                    analyser.connect(masterGain);
                } else {
                    gain.connect(masterGain);
                }
                this.buses.set(name, { gain, analyser });
            }

            this.isInitialized = true;
            Logger.message('SoundEngine: 5-bus AudioContext initialized successfully.');
        } catch (e) {
            Logger.message(`ERROR: SoundEngine: Could not initialize AudioContext. ${e}`);
        }
        Logger.end(funcName);
    }

    getBus(name = 'master') {
        return this.buses.get(name)?.gain ?? this.masterGain ?? null;
    }

    setBusVolume(name, volume) {
        if (!this.busState.has(name)) {
            throw new Error(`Unknown audio bus '${name}'.`);
        }
        const cfg = this.busState.get(name);
        cfg.volume = clamp01(volume);
        const bus = this.buses.get(name);
        if (bus?.gain && this.audioContext) {
            const effective = cfg.muted ? 0 : cfg.volume;
            if (typeof bus.gain.gain?.setValueAtTime === 'function') {
                bus.gain.gain.setValueAtTime(effective, this.audioContext.currentTime ?? 0);
            } else if (bus.gain.gain) {
                bus.gain.gain.value = effective;
            }
        }
        return cfg.volume;
    }

    getBusVolume(name) {
        return this.busState.get(name)?.volume ?? 0;
    }

    setBusMuted(name, muted) {
        if (!this.busState.has(name)) {
            throw new Error(`Unknown audio bus '${name}'.`);
        }
        const cfg = this.busState.get(name);
        cfg.muted = Boolean(muted);
        const bus = this.buses.get(name);
        if (bus?.gain && this.audioContext) {
            const effective = cfg.muted ? 0 : cfg.volume;
            if (typeof bus.gain.gain?.setValueAtTime === 'function') {
                bus.gain.gain.setValueAtTime(effective, this.audioContext.currentTime ?? 0);
            } else if (bus.gain.gain) {
                bus.gain.gain.value = effective;
            }
        }
        return cfg.muted;
    }

    isBusMuted(name) {
        return Boolean(this.busState.get(name)?.muted);
    }

    /**
     * Returns normalized RMS meter level in [0, 1] for the given bus.
     */
    getBusLevel(name = 'master') {
        const bus = this.buses.get(name);
        if (!bus?.analyser || typeof bus.analyser.getByteTimeDomainData !== 'function') {
            return 0;
        }
        const len = bus.analyser.frequencyBinCount || 128;
        const data = new Uint8Array(len);
        bus.analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            const norm = (data[i] - 128) / 128;
            sum += norm * norm;
        }
        return Math.min(1, Math.sqrt(sum / Math.max(1, data.length)));
    }

    getMixerState() {
        const state = {};
        for (const name of AUDIO_BUS_NAMES) {
            const cfg = this.busState.get(name);
            state[name] = {
                volume: cfg.volume,
                muted: cfg.muted,
                level: this.getBusLevel(name)
            };
        }
        return state;
    }

    start() {
        const funcName = 'SoundEngine.start';
        Logger.start(funcName);
        if (!this.isInitialized || !this.audioContext) {
            Logger.message('WARN: SoundEngine: Cannot start, not initialized.');
            Logger.end(funcName);
            return Promise.resolve(false);
        }
        if (this.audioContext.state === 'suspended' && typeof this.audioContext.resume === 'function') {
            return this.audioContext.resume().then(() => {
                Logger.message('SoundEngine: AudioContext resumed.');
                Logger.end(funcName);
                return true;
            });
        }
        Logger.end(funcName);
        return Promise.resolve(true);
    }

    stop() {
        const funcName = 'SoundEngine.stop';
        Logger.start(funcName);
        if (!this.isInitialized || !this.audioContext) return Promise.resolve(false);
        if (this.audioContext.state === 'running' && typeof this.audioContext.suspend === 'function') {
            return this.audioContext.suspend().then(() => {
                Logger.message('SoundEngine: AudioContext suspended.');
                Logger.end(funcName);
                return true;
            });
        }
        Logger.end(funcName);
        return Promise.resolve(false);
    }

    setMasterVolume(volume) {
        return this.setBusVolume('master', volume);
    }
}
