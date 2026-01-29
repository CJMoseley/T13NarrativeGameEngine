import Logger from "@/src/t13ne/core/Logger.js";
import T13NE from '@/src/t13ne/T13NE.js';
import CodexLoader from "@/src/t13ne/modules/codex/CodexLoader.js";

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
 * A lightweight synthesizer for procedural playback with transition capabilities.
 */
class T13Synth {
    constructor(audioContext) {
        this.ctx = audioContext;
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.ctx.destination);
        this.buffers = new Map(); // Store loaded AudioBuffers
        this.layers = new Map(); // To manage active layers { source, gainNode }
    }

    /**
     * Loads an audio file into a buffer.
     * @param {string} name - A unique name for the audio.
     * @param {string} url - URL to the audio file.
     */
    async loadAudio(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.buffers.set(name, audioBuffer);
            Logger.message(`T13Synth: Loaded audio '${name}'`);
            return audioBuffer;
        } catch (e) {
            Logger.error(`T13Synth: Failed to load audio '${name}'`, e);
            return null;
        }
    }

    playNote(frequency, startTime, duration, type = 'sine', detune = 0, instrument = null) {
        // 1. Try to play sample if instrument is specified and loaded
        if (instrument && this.buffers.has(instrument)) {
            this.playSample(instrument, frequency, startTime, duration, detune);
            return;
        }

        // 2. Fallback to Enhanced Subtractive Synthesis
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = type;
        osc.frequency.value = frequency;
        osc.detune.value = detune;

        // Filter Envelope (Wah effect)
        filter.type = 'lowpass';
        filter.Q.value = 1;
        filter.frequency.setValueAtTime(frequency, startTime);
        filter.frequency.exponentialRampToValueAtTime(frequency * 4, startTime + 0.05);
        filter.frequency.exponentialRampToValueAtTime(frequency, startTime + duration);

        // Amp Envelope (ADSR-like)
        env.gain.setValueAtTime(0, startTime);
        env.gain.linearRampToValueAtTime(0.3, startTime + 0.02); // Attack
        env.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Decay/Release

        osc.connect(filter);
        filter.connect(env);
        env.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    playSample(name, frequency, startTime, duration, detune) {
        const buffer = this.buffers.get(name);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        
        // Pitch shifting: Assume base sample is C4 (approx 261.63 Hz)
        // Calculate playback rate ratio
        const baseFreq = 261.63; 
        const rate = frequency / baseFreq;
        
        source.playbackRate.value = rate;
        source.detune.value = detune;

        const env = this.ctx.createGain();
        source.connect(env);
        env.connect(this.masterGain);

        // Simple envelope to prevent clicking
        env.gain.setValueAtTime(0, startTime);
        env.gain.linearRampToValueAtTime(1, startTime + 0.01);
        env.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        source.start(startTime);
        source.stop(startTime + duration + 0.1);
    }

    /**
     * Plays a pre-loaded audio buffer as a persistent layer.
     * @param {string} layerName - A unique name for this layer.
     * @param {AudioBuffer} buffer - The audio buffer to play.
     * @param {number} volume - The target volume for the layer.
     * @param {boolean} loop - Whether the audio should loop.
     * @param {number} fadeTime - The time in seconds to fade in.
     */
    playLayer(layerName, buffer, volume = 1.0, loop = true, fadeTime = 2.0) {
        if (this.layers.has(layerName)) return; // Already playing

        const now = this.ctx.currentTime;
        const source = this.ctx.createBufferSource();
        const gainNode = this.ctx.createGain();

        source.buffer = buffer;
        source.loop = loop;

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + fadeTime);

        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        source.start(now);

        this.layers.set(layerName, { source, gainNode });
        Logger.message(`T13Synth: Started layer '${layerName}'`);
    }

    /**
     * Stops a persistent layer with a fade out.
     * @param {string} layerName - The name of the layer to stop.
     * @param {number} fadeTime - The time in seconds to fade out.
     */
    stopLayer(layerName, fadeTime = 2.0) {
        if (!this.layers.has(layerName)) return;

        const layer = this.layers.get(layerName);
        const now = this.ctx.currentTime;

        layer.gainNode.gain.cancelScheduledValues(now);
        layer.gainNode.gain.setValueAtTime(layer.gainNode.gain.value, now);
        layer.gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);

        layer.source.stop(now + fadeTime + 0.1);

        this.layers.delete(layerName);
        Logger.message(`T13Synth: Stopped layer '${layerName}'`);
    }

    /**
     * Plays a one-shot sound effect that is not looped.
     * @param {AudioBuffer} buffer - The audio buffer to play.
     * @param {number} volume - The volume to play at.
     */
    playFX(buffer, volume = 0.5) {
        if (!buffer) return;
        const now = this.ctx.currentTime;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.masterGain);
        source.start(now);
    }

    /**
     * Plays a transitional "bridge" or "fill" sound.
     * @param   {number} baseFreq - Root frequency.
     * @param {string} direction - 'rising' (tension up) or 'falling' (tension down).
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
            // Tension rising: Pitch up, adding dissonance
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 3.0);
        } else {
            // Tension falling: Pitch down, resolving
            osc.frequency.setValueAtTime(baseFreq * 1.5, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 3.0);
        }

        osc.start(now);
        osc.stop(now + 3.0);
    }

    stopAll() {
        this.layers.forEach((layer, name) => {
            this.stopLayer(name, 0.5);
        });
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
        this.tonalModes = [];
        this.compositionCache = new Map(); // Caches generated composition data
        this.musicPack = null; // Holds buffers for the current musical context
        this.currentLayers = new Set(); // Tracks active layer names
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

        // Load data required for generation
        this.tonalModes = await CodexLoader.getData('geometry', 'tonalModes.json') || [];

        this.initialized = true;
        Logger.message("T13NE_Music: Initialized.");
    }

    /**
     * Loads a single audio file for use as a sampled instrument or a one-shot effect.
     * @param {string} name - A unique name for the instrument/effect.
     * @param {string} url - The URL of the audio file.
     */
    async loadInstrument(name, url) {
        if (this.synth) {
            await this.synth.loadAudio(name, url);
        }
    }

    /**
     * Loads a collection of audio stems for adaptive layering.
     */
    async loadMusicPack(packData) {
        if (this.synth) {
            this.musicPack = {};
            for (const key in packData) {
                this.musicPack[key] = await this.synth.loadAudio(key, packData[key]);
            }
            Logger.message("T13NE_Music: Music pack loaded.");
        }
    }

    /**
     * Parses a tonal pattern string (e.g., "43(5)" or "TST") into an array of intervals.
     * @param {string} patternString 
     * @returns {number[]} An array of semitone intervals.
     */
    _parseTonalPattern(patternString = '') {
        const intervals = [];
        if (!patternString) return [2, 2, 1, 2, 2, 2, 1]; // Default to Major scale pattern

        const re = /(\d+)\((\d+)\)/;
        const match = patternString.match(re);

        if (match) {
            patternString = match[1] + match[2];
        }

        for (const char of patternString) {
            if (char === 'S') intervals.push(1);
            else if (char === 'T') intervals.push(2);
            else if (!isNaN(parseInt(char, 10))) intervals.push(parseInt(char, 10));
        }
        return intervals;
    }

    /**
     * Finds the Tonal Mode object for a given character's geometry.
     * @param {object} characterGeo - The character's full geometry object.
     * @returns {object|null} The tonal mode object from the codex.
     */
    _getTonalMode(characterGeo) {
        if (!this.tonalModes.length || !characterGeo) return null;
        const modeName = characterGeo.GeoHarmonics?.Mode || 'Ionian/Major';
        return this.tonalModes.find(m => m.data.Type === modeName)?.data || null;
    }

    /**
     * Analyzes the intervals between notes in a scale to find the frequency of melodic steps.
     * @param {number[]} scaleIntervals - A sorted array of semitone intervals from the root (e.g., [0, 2, 4, 5, 7, 9, 11]).
     * @returns {object} A map of interval sizes to their frequency (e.g., { '1': 2, '2': 5 }).
     */
    _getMelodicIntervalDistribution(scaleIntervals) {
        const distribution = {};
        if (scaleIntervals.length < 2) return distribution;

        for (let i = 0; i < scaleIntervals.length - 1; i++) {
            const interval = scaleIntervals[i + 1] - scaleIntervals[i];
            if (interval > 0) {
                distribution[interval] = (distribution[interval] || 0) + 1;
            }
        }
        // Also consider the interval from the last note back to the octave (root)
        const lastInterval = 12 - scaleIntervals[scaleIntervals.length - 1];
        if (lastInterval > 0) {
            distribution[lastInterval] = (distribution[lastInterval] || 0) + 1;
        }

        return distribution;
    }

    /**
     * Generates a Markov transition matrix based on musical rules and preferred intervals.
     * @param {number[]} scaleIntervals - The allowed intervals of the scale.
     * @param {object} [harmonicStepDistribution={}] - A map of preferred melodic intervals (from harmonics) to their frequency.
     * @returns {number[][]} A 2D array representing the transition probabilities.
     */
    _generateMarkovTransitions(scaleIntervals, harmonicStepDistribution = {}) {
        const matrix = [];
        // Create a map of weights for both ascending and descending preferred intervals.
        const preferredIntervals = new Map();
        for (const interval in harmonicStepDistribution) {
            const i = parseInt(interval, 10);
            const count = harmonicStepDistribution[interval];
            // Give higher weight to more frequent intervals in the harmonic structure
            preferredIntervals.set(i, (preferredIntervals.get(i) || 0) + count);
            const descending = (12 - i) % 12;
            if (descending !== 0) {
                 preferredIntervals.set(descending, (preferredIntervals.get(descending) || 0) + count);
            }
        }

        for (let i = 0; i < scaleIntervals.length; i++) {
            const fromInterval = scaleIntervals[i];
            const weights = [];
            let totalWeight = 0;

            for (let j = 0; j < scaleIntervals.length; j++) {
                const toInterval = scaleIntervals[j];
                const melodicInterval = (toInterval - fromInterval + 12) % 12;

                // Start with a base weight for any valid note in the scale.
                let weight = 1.0;

                // Add weight for standard musical rules (predictability)
                if (melodicInterval === 0) { // Repetition
                    weight += 1.5;
                } else if (melodicInterval === 1 || melodicInterval === 2 || melodicInterval === 10 || melodicInterval === 11) { // Stepwise motion
                    weight += 2.0;
                }

                // Add character-specific flavor from harmonics (uniqueness)
                if (preferredIntervals.has(melodicInterval)) {
                    weight += 4.0 * preferredIntervals.get(melodicInterval);
                }

                // Penalize dissonant intervals unless they are harmonically preferred by the character
                if (melodicInterval === 6 && !preferredIntervals.has(6)) {
                    weight *= 0.1;
                }
                weights.push(weight);
                totalWeight += weight;
            }

            // Normalize weights to probabilities for the current state
            matrix[i] = weights.map(w => w / totalWeight);
        }
        return matrix;
    }

    /**
     * Generates a Leitmotif for a character.
     * This is the base melodic generator for various composition types.
     */
    getCharacterComposition(character, options = {}) {
        if (!character || !character.name) return null;

        const useCharacterHarmonics = options.useCharacterHarmonics !== false; // Default to true

        const cacheKey = `${character.id || character.name}_${useCharacterHarmonics}`;
        if (this.compositionCache.has(cacheKey)) return this.compositionCache.get(cacheKey);

        let geo = character.geometry;
        if (!geo && this.geometry) {
            geo = this.geometry.calculateFullGeo(character.name);
        }
        if (!geo) return null;

        const rng = new MusicRNG(character.name);
        const keyNum = geo.GeoHarmonics ? geo.GeoHarmonics.key : geo.GeometryNumber;
        const keyData = this.geometry.getKey(keyNum);
        const baseFreq = keyData.Key.Frequency;
        const rootKeyIndex = CHROMATIC_SCALE.indexOf(keyData.Key.Key);

        // 1. Determine the allowed notes from the Tonal Mode
        const tonalMode = this._getTonalMode(geo);
        const tonalPattern = this._parseTonalPattern(tonalMode?.Pattern); // e.g., [2, 2, 1, 2, 2, 2, 1]
        const allowedScaleIntervals = [0];
        let cumulativeInterval = 0;
        for (const step of tonalPattern) {
            cumulativeInterval += step;
            if (cumulativeInterval < 12) {
                allowedScaleIntervals.push(cumulativeInterval);
            }
        }

        // 2. Determine the preferred melodic intervals from the Character's Harmonics (if applicable)
        let harmonicStepDistribution = {};
        if (useCharacterHarmonics) {
            const harmonics = geo.GeoHarmonics ? geo.GeoHarmonics.Harmonic : [1, 3, 5, 8];
            const harmonicIntervals = [...new Set(harmonics.map(h => (h - 1) % 12))];
            if (!harmonicIntervals.includes(0)) {
                harmonicIntervals.push(0);
            }
            harmonicIntervals.sort((a, b) => a - b);
            harmonicStepDistribution = this._getMelodicIntervalDistribution(harmonicIntervals);
        }

        // 3. Generate Markov Chain transition matrix
        const transitionMatrix = this._generateMarkovTransitions(allowedScaleIntervals, harmonicStepDistribution);

        const length = rng.range(8, 16);
        const sequence = [];
        const noteDurations = [0.25, 0.5, 1.0];
        let currentNoteIndex = 0; // Start at the root of the scale
        
        for (let i = 0; i < length; i++) {
            const probabilities = transitionMatrix[currentNoteIndex];
            const random = rng.next();
            let cumulativeProb = 0;
            let nextNoteIndex = 0;
            for (let j = 0; j < probabilities.length; j++) {
                cumulativeProb += probabilities[j];
                if (random < cumulativeProb) {
                    nextNoteIndex = j;
                    break;
                }
            }

            const interval = allowedScaleIntervals[nextNoteIndex];
            const finalPitchIndex = (rootKeyIndex + interval) % 12;
            const pitchName = CHROMATIC_SCALE[finalPitchIndex];
            const octaveOffset = rng.pick([0, 0, 1]);
            const freq = baseFreq * Math.pow(2, (interval + (octaveOffset * 12)) / 12);
            
            sequence.push({
                freq: freq,
                duration: rng.pick(noteDurations),
                interval: interval,
                pitchName: pitchName
            });
            currentNoteIndex = nextNoteIndex;
        }

        const composition = {
            name: `${character.name}'s Theme`,
            key: keyData.Key.Key,
            baseFreq: baseFreq,
            scale: allowedScaleIntervals,
            sequence: sequence,
            tempo: 100 + (geo.Facade * 2)
        };

        this.compositionCache.set(cacheKey, composition);
        return composition;
    }

    playCharacterComposition(character, listener = null, instrument = null) {
        if (!this.synth) return;
        const motif = this.getCharacterComposition(character);
        if (!motif) return;
        
        // Use the character's preferred instrument if none is specified.
        const preferredInstrument = instrument || KEY_INSTRUMENT_MAP[motif.key] || 'piano';
        
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
            this.synth.playNote(note.freq, timeCursor, duration, type, detune, preferredInstrument);
            timeCursor += duration;
        });
    }

    /**
     * Generic composition factory. Gets/generates a musical composition for any T13NE entity.
     * @param {object} entity - The entity (Character, Location, Pact, Descendant)
     * @returns {object|null} The generated composition data.
     */
    getComposition(entity) {
        if (!entity || !entity.name) return null;

        const entityType = entity.constructor.name; // A simple way to get type
        const cacheKey = `${entityType}_${entity.id || entity.name}`;
        if (this.compositionCache.has(cacheKey)) {
            return this.compositionCache.get(cacheKey);
        }

        let compositionData = null;

        // Determine entity type and call the appropriate generator
        if (entity.geometry && entity.type) { // Likely a Character
            switch (entity.type) {
                case 'Extra':
                    compositionData = this._generateChant(entity);
                    break;
                case 'Grunt':
                    compositionData = this._generateMarch(entity);
                    break;
                case 'Hero':
                    compositionData = this._generateAria(entity);
                    break;
                case 'Yarn-Teller':
                    compositionData = this._generateSolo(entity);
                    break;
                case 'Lite':
                    compositionData = this._generateLeitmotif(entity);
                    break;
                case 'Archetype':
                    compositionData = this._generateAnthem(entity);
                    break;
                default:
                    compositionData = this.getCharacterComposition(entity);
                    break;
            }
        } else if (entity.isLocation) { // Fictional property for type checking
            compositionData = this._generateSymphony(entity);
        } else if (entity.isPact) { // Fictional property
            compositionData = this._generateOpera(entity);
        } else if (entity.isDescendant) { // Fictional property
            // Jingles are for generic descendants, Refrains for specific ones.
            // This logic would need a way to differentiate, e.g., based on a descendant property.
            compositionData = entity.isUnique ? this._generateRefrain(entity) : this._generateJingle(entity);
        }

        if (compositionData) {
            Logger.message(`T13NE_Music: Generated composition '${compositionData.name}' for ${entity.name}`);
            this.compositionCache.set(cacheKey, compositionData);
        }

        return compositionData;
    }

    /**
     * Plays a generated composition object.
     * @param {object} composition - The composition data object from getComposition.
     * @param {object} [listener=null] - An optional listener character to determine dissonance.
     */
    playComposition(composition, listener = null) {
        if (!this.synth || !composition) return;

        Logger.message(`T13NE_Music: Playing composition '${composition.name}'`);

        if (composition.type === 'Opera') {
            // Play all character themes simultaneously on different instruments
            const instruments = ['piano', 'triangle', 'sawtooth', 'sine']; // Example instruments
            let i = 0;
            for (const characterName in composition.themes) {
                const theme = composition.themes[characterName];
                const instrument = instruments[i % instruments.length];
                this.playCharacterComposition({ name: characterName, geometry: theme.geometry, ...theme }, listener, instrument);
                i++;
            }
        } else if (composition.sequence) {
            // For simpler, single-melody compositions
            this.playCharacterComposition({ ...composition, name: composition.name.split("'")[0] }, listener);
        }
        // Note: 'Symphony' type is not played directly but used by updateAmbience to load stems.
    }

    // Private generators for each composition type
    _generateChant(character) {
        const composition = this.getCharacterComposition(character);
        composition.name = `${character.name}'s Chant`;
        // Make it monotone and rhythmic
        composition.sequence = composition.sequence.map(note => ({ ...note, freq: composition.baseFreq, duration: 1.0 }));
        composition.type = 'Chant';
        return composition;
    }

    _generateMarch(character) {
        const composition = this.getCharacterComposition(character);
        composition.name = `${character.name}'s March`;
        composition.tempo = 120;
        // Make rhythm more rigid and on-beat
        composition.sequence = composition.sequence.map(note => ({ ...note, duration: 0.5 }));
        composition.type = 'March';
        return composition;
    }

    _generateAria(hero) {
        const composition = this.getCharacterComposition(hero);
        composition.name = `${hero.name}'s Aria`;
        composition.tempo = 80; // Slower, more expressive
        composition.type = 'Aria';
        return composition;
    }

    _generateSolo(yarnTeller) {
        const composition = this.getCharacterComposition(yarnTeller);
        composition.name = `${yarnTeller.name}'s Solo`;
        composition.tempo = 160; // Faster, more intense
        // Add more notes to make it feel more virtuosic
        const extraNotes = this.getCharacterComposition({ ...yarnTeller, name: yarnTeller.name + '_extra' }).sequence;
        composition.sequence = composition.sequence.concat(extraNotes);
        composition.type = 'Solo';
        return composition;
    }

    _generateLeitmotif(character) {
        const composition = this.getCharacterComposition(character);
        composition.name = `${character.name}'s Leitmotif`;
        composition.sequence = composition.sequence.slice(0, 4); // Shorter for a motif
        composition.type = 'Leitmotif';
        return composition;
    }

    _generateAnthem(character) {
        const composition = this.getCharacterComposition(character);
        composition.name = `${character.name}'s Anthem`;
        composition.tempo = 70; // Stately and grand
        composition.type = 'Anthem';
        return composition;
    }

    _generateSymphony(location) {
        const geo = this.geometry.calculateFullGeo(location.name);
        const keyData = this.geometry.getKey(geo.GeoHarmonics.key);
        return {
            name: `${location.name} Symphony`,
            type: 'Symphony',
            key: keyData.Key.Key,
            tempo: 90,
            // This structure tells the scene loader which audio stems to load into the musicPack
            stems: {
                base: `path/to/music/${location.name}_base.ogg`,
                percussion_low: `path/to/music/${location.name}_perc_low.ogg`,
                percussion_high: `path/to/music/${location.name}_perc_high.ogg`,
                harmony: `path/to/music/${location.name}_harmony.ogg`,
                melody: `path/to/music/${location.name}_melody.ogg`,
                danger: `path/to/music/${location.name}_danger.ogg`,
            }
        };
    }

    _generateOpera(pact) {
        const composition = {
            name: `${pact.name}'s Opera`,
            type: 'Opera',
            tempo: 110,
            key: 'C', // Could be derived from pact name or dominant member
            themes: {}
        };

        pact.members.forEach(member => {
            composition.themes[member.name] = this.getCharacterComposition(member);
        });

        return composition;
    }

    _generateRefrain(descendant) {
        const composition = this.getCharacterComposition({ name: descendant.name }, { useCharacterHarmonics: false }); // Use descendant name for seed
        composition.name = `${descendant.name}'s Refrain`;
        composition.type = 'Refrain';
        return composition;
    }

    _generateJingle(descendant) {
        const composition = this.getCharacterComposition({ name: descendant.name }, { useCharacterHarmonics: false });
        composition.name = `${descendant.name}'s Jingle`;
        composition.type = 'Jingle';
        composition.sequence = composition.sequence.slice(0, 3); // Very short
        composition.tempo = 130;
        return composition;
    }

    /**
     * Uses vertical remixing (layering) to adapt the music to game state.
     * @param {object} plot - The current plot object, containing tensionLevel.
     * @param {object} [gameParams={}] - Additional game state like player health.
     */
    updateAmbience(plot, gameParams = {}) {
        if (!this.synth || !this.musicPack || !plot) return;

        const tension = plot.tensionLevel || 0;
        if (this.lastTension === tension && !gameParams.playerHealth) return; // No change

        const newLayers = new Set();

        // Define which layers play at which tension level
        if (tension >= 0 && this.musicPack.base) {
            newLayers.add('base');
        }
        if (tension >= 3 && this.musicPack.percussion_low) {
            newLayers.add('percussion_low');
        }
        if (tension >= 6) {
            if (this.musicPack.percussion_high) newLayers.add('percussion_high');
            if (this.musicPack.harmony) newLayers.add('harmony');
        }
        if (tension >= 8 && this.musicPack.melody) {
            newLayers.add('melody');
        }

        // Connect to other game parameters
        if (gameParams.playerHealth < 0.3 && this.musicPack.danger) {
            newLayers.add('danger');
        }

        const layersToStart = [...newLayers].filter(x => !this.currentLayers.has(x));
        const layersToStop = [...this.currentLayers].filter(x => !newLayers.has(x));

        if (layersToStart.length > 0 || layersToStop.length > 0) {
            Logger.message(`T13NE_Music: Updating layers. Tension: ${tension}. Start: [${layersToStart.join(', ')}]. Stop: [${layersToStop.join(', ')}]`);
        }

        layersToStart.forEach(layerName => {
            this.synth.playLayer(layerName, this.musicPack[layerName], 0.5, true, 4.0);
        });

        layersToStop.forEach(layerName => {
            this.synth.stopLayer(layerName, 4.0);
        });

        this.currentLayers = newLayers;
        this.lastTension = tension;
    }

    stop() {
        if (!this.synth) return;
        this.synth.stopAll();
        this.currentLayers.clear();
        this.lastTension = -1;
    }
}


export default new T13NE_Music();