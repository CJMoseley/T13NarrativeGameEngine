// src/t13ne/modules/audio/core/T13Synth.js
import Logger from "@/src/t13ne/core/Logger.js";
import { InstrumentEngine } from "@/src/t13ne/modules/audio/t13ne-InstrumentEngine.js";

/**
 * A lightweight synthesizer for procedural playback with transition capabilities.
 */
export class T13Synth {
    constructor(audioContext, outputNode) {
        this.ctx = audioContext;
        this.outputNode = outputNode || this.ctx.destination;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 1.0;

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.2; // Reduced to prevent compressor pumping/ducking
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 1.0;
        this.sfxGain.connect(this.masterGain);

        this.dialogueGain = this.ctx.createGain();
        this.dialogueGain.gain.value = 1.0;
        this.dialogueGain.connect(this.masterGain);

        // Add Main Bus Compressor (Acts as an Glue/Limiter)
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -3.0; // Brick wall style threshold
        this.compressor.knee.value = 0.0;
        this.compressor.ratio.value = 20.0; // High ratio for limiting
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.1;

        // Final Master Safety Stage: Brick wall gain
        this.limiter = this.ctx.createGain();
        this.limiter.gain.value = 1.0;

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.limiter);
        this.limiter.connect(this.outputNode);

        this.buffers = new Map();
        this.layers = new Map();
        this.channels = new Map();

        // Sub-Engines
        this.instrumentEngine = new InstrumentEngine(this.ctx);
    }

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
            Logger.error(`T13Synth: Failed to load audio ''`, e);
            return null;
        }
    }

    playNote(frequency, startTime, duration, type = 'Piano', detune = 0, instrument = null, channelId = null, pan = 0, velocity = 0.3) {
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
            this.instrumentEngine.playNote(instrument, frequency, startTime, duration, velocity, dest, pan);
            return;
        }

        const safeVelocity = Math.max(0, Math.min(1.0, velocity));
        this.instrumentEngine.playNote(type, frequency, startTime, duration, safeVelocity, dest, pan);
    }

    pruneChannels(activeIds) {
        const activeSet = new Set(activeIds);
        for (const [id, ch] of this.channels) {
            if (!activeSet.has(id)) {
                if (this.instrumentEngine && this.instrumentEngine.stopVoices) {
                    this.instrumentEngine.stopVoices(id);
                }
                try {
                    ch.gain.disconnect();
                    ch.analyser.disconnect();
                } catch (e) {}
                this.channels.delete(id);
            }
        }
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
        Logger.message(`T13Synth: Started layer ''`);
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
        Logger.message(`T13Synth: Stopped layer ''`);
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

    stopAll(immediate = false) {
        this.layers.forEach((layer, name) => {
            if (immediate) {
                layer.source.stop();
                layer.gainNode.disconnect();
                this.layers.delete(name);
            } else {
                this.stopLayer(name, 0.5);
            }
        });

        // Kill all procedurally generated instrument voices
        this.instrumentEngine.stopAll(immediate);

        const now = this.ctx.currentTime;
        // Reset sub-buses to safe defaults
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setValueAtTime(0.5, now);
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(1.0, now);
    }
}
