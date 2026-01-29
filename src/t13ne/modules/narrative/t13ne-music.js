import Logger from "@/src/t13ne/core/Logger.js";

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
 * A lightweight synthesizer for procedural playback.
 */
class T13Synth {
    constructor(audioContext) {
        this.ctx = audioContext;
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.ctx.destination);
    }

    playNote(frequency, startTime, duration, type = 'sine', detune = 0) {
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = frequency;
        osc.detune.value = detune;

        osc.connect(env);
        env.connect(this.masterGain);

        // Envelope
        env.gain.setValueAtTime(0, startTime);
        env.gain.linearRampToValueAtTime(1, startTime + 0.05); // Attack
        env.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Decay

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    /**
     * Plays a cluster of tones that persists until stopped (for ambience).
     * Returns a handle to control the cluster (gain node, oscillators).
     */
    playToneCluster(frequencies, type = 'sine', detune = 0, volume = 0.2) {
        const now = this.ctx.currentTime;
        const env = this.ctx.createGain();
        env.connect(this.masterGain);
        env.gain.setValueAtTime(0, now);
        // Slow fade in for ambience
        env.gain.linearRampToValueAtTime(volume, now + 4.0);

        const oscillators = frequencies.map(f => {
            const osc = this.ctx.createOscillator();
            osc.type = type;
            osc.frequency.value = f;
            osc.detune.value = detune + (Math.random() * 10 - 5); // Organic drift
            osc.connect(env);
            osc.start(now);
            return osc;
        });

        return { gain: env, oscillators };
    }

    /**
     * Fades out a sound object and stops its oscillators.
     */
    fadeOut(soundHandle, duration = 4.0) {
        if (!soundHandle) return;
        const now = this.ctx.currentTime;
        
        // Cancel any scheduled updates to prevent conflict
        soundHandle.gain.gain.cancelScheduledValues(now);
        soundHandle.gain.gain.setValueAtTime(soundHandle.gain.gain.value, now);
        soundHandle.gain.linearRampToValueAtTime(0, now + duration);

        soundHandle.oscillators.forEach(osc => osc.stop(now + duration + 0.1));
    }

    /**
     * Plays a transitional "bridge" or "fill" sound.
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
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 3.0);
        } else {
            osc.frequency.setValueAtTime(baseFreq * 1.5, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 3.0);
        }

        osc.start(now);
        osc.stop(now + 3.0);
    }

    stopAll() {
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
        this.leitmotifCache = new Map();
        
        this.currentAmbience = null;
        this.currentPlotId = null;
        this.lastTension = -1;
    }

    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;
        this.geometry = t13ne.getModule('T13Geometry');
        this.soundEngine = t13ne.soundEngine; // Access core sound engine

        if (this.soundEngine && this.soundEngine.audioContext) {
            this.synth = new T13Synth(this.soundEngine.audioContext);
        } else {
            Logger.warn("T13NE_Music: SoundEngine AudioContext not available. Playback disabled.");
        }

        this.initialized = true;
        Logger.message("T13NE_Music: Initialized.");
    }

    /**
     * Generates a Leitmotif for a character.
     */
    getLeitmotif(character) {
        if (!character || !character.name) return null;
        const cacheKey = character.id || character.name;
        if (this.leitmotifCache.has(cacheKey)) return this.leitmotifCache.get(cacheKey);

        let geo = character.geometry;
        if (!geo && this.geometry) {
            geo = this.geometry.calculateFullGeo(character.name);
        }
        if (!geo) return null;

        const rng = new MusicRNG(character.name);
        const keyNum = geo.GeoHarmonics ? geo.GeoHarmonics.key : geo.GeometryNumber;
        const keyData = this.geometry.getKey(keyNum);
        const baseFreq = keyData.Key.Frequency;
        const harmonics = geo.GeoHarmonics ? geo.GeoHarmonics.Harmonic : [1, 3, 5, 8];
        
        const scaleIntervals = harmonics.map(h => (h - 1) % 12);
        scaleIntervals.push(0);
        scaleIntervals.sort((a, b) => a - b);

        const length = rng.range(4, 8);
        const sequence = [];
        const noteDurations = [0.25, 0.5, 1.0];

        for (let i = 0; i < length; i++) {
            const interval = rng.pick(scaleIntervals);
            const octaveOffset = rng.pick([0, 0, 1]);
            const freq = baseFreq * Math.pow(2, (interval + (octaveOffset * 12)) / 12);
            
            sequence.push({
                freq: freq,
                duration: rng.pick(noteDurations),
                interval: interval
            });
        }

        const leitmotif = {
            name: `${character.name}'s Theme`,
            key: keyData.Key.Key,
            baseFreq: baseFreq,
            scale: scaleIntervals,
            sequence: sequence,
            tempo: 100 + (geo.Facade * 2)
        };

        this.leitmotifCache.set(cacheKey, leitmotif);
        return leitmotif;
    }

    playLeitmotif(character, listener = null) {
        if (!this.synth) return;
        const motif = this.getLeitmotif(character);
        if (!motif) return;

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
            this.synth.playNote(note.freq, timeCursor, duration, type, detune);
            timeCursor += duration;
        });
    }

    updateAmbience(plot) {
        if (!this.synth || !plot) return;
        if (this.currentPlotId === plot.id && this.lastTension === plot.tensionLevel) return;

        Logger.message(`T13NE_Music: Transitioning ambience for Plot ${plot.Name} (Tension: ${plot.tensionLevel})`);
        const params = this._calculateAmbienceParams(plot);

        if (this.lastTension !== -1 && this.currentAmbience) {
            const direction = plot.tensionLevel > this.lastTension ? 'rising' : 'falling';
            this.synth.playBridge(params.rootFreq, direction);
        }

        if (this.currentAmbience) this.synth.fadeOut(this.currentAmbience, 5.0);

        this.currentAmbience = this.synth.playToneCluster(
            params.frequencies, params.waveform, params.detune, params.volume
        );

        this.currentPlotId = plot.id;
        this.lastTension = plot.tensionLevel;
    }

    _calculateAmbienceParams(plot) {
        let rootFreq = 110.0;
        let scaleType = 'minor'; 
        let waveform = 'sine';
        let detune = 0;
        let volume = 0.2;

        if (this.geometry) {
            const geo = this.geometry.calculateFullGeo(plot.Name);
            const keyData = this.geometry.getKey(geo.GeoHarmonics.key);
            if (keyData && keyData.Key) rootFreq = keyData.Key.Frequency / 2;
        }

        const tension = plot.tensionLevel || 0;
        if (tension < 3) { scaleType = 'major'; waveform = 'sine'; }
        else if (tension < 6) { scaleType = 'minor'; waveform = 'triangle'; detune = 5; }
        else { scaleType = 'diminished'; waveform = 'sawtooth'; detune = 15; volume = 0.15; }

        const frequencies = [rootFreq];
        const thirdInterval = scaleType === 'major' ? 4 : 3; 
        frequencies.push(rootFreq * Math.pow(2, thirdInterval / 12));
        const fifthInterval = (tension > 6) ? 6 : 7;
        frequencies.push(rootFreq * Math.pow(2, fifthInterval / 12));
        frequencies.push(rootFreq * 2);

        return { rootFreq, frequencies, waveform, detune, volume };
    }

    stop() {
        if (this.synth) {
            this.synth.stopAll();
            this.currentAmbience = null;
            this.currentPlotId = null;
            this.lastTension = -1;
        }
    }
}

export default new T13NE_Music();