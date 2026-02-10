// src/t13ne/modules/audio/core/ThemeGenerator.js
import Logger from "../../../core/Logger.js";
import CodexLoader from "../../codex/CodexLoader.js";
import { MusicRNG } from "./MusicUtils.js";
import { AudioAnalyzer } from "../t13ne-audio-analyzer.js";

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export class ThemeGenerator {
    constructor(musicModule) {
        this.music = musicModule;
        this.drumPatterns = null;
        this.harmonicPatterns = null;
        this.bassPatterns = null;
        this.progressions = null;
        this.tonalModes = [];
        this.compositionCache = new Map();
        this.instrumentPalette = { bass: [], pad: [], lead: [], rhythm: [], kick: [], snare: [], hat: [], perc: [] };
        
        this.currentProgression = null;
    }

    get synth() { return this.music.synth; }
    get manifestManager() { return this.music.manifestManager; }
    get geometry() { return this.music.geometry; }

    async loadAssets() {
        this.tonalModes = await CodexLoader.getData('geometry', 'tonalModes.json') || [];
        this.progressions = await CodexLoader.getData('geometry', 'progressions.json') || [];
        await this._loadDrumPatterns();
        await this._loadHarmonicPatterns();
        await this._loadBassPatterns();
        await this._processManifestInstruments();
    }

    async _processManifestInstruments() {
        if (!this.synth) return;
        const samples = this.manifestManager.manifest.samples;
        for (const [key, data] of Object.entries(samples)) {
            const lowerKey = key.toLowerCase();
            let category = 'lead';
            if (lowerKey.includes('bass')) category = 'bass';
            else if (lowerKey.includes('pad') || lowerKey.includes('atmos') || lowerKey.includes('texture')) category = 'pad';
            else if (lowerKey.includes('kick')) category = 'kick';
            else if (lowerKey.includes('snare')) category = 'snare';
            else if (lowerKey.includes('hat')) category = 'hat';
            else if (lowerKey.includes('perc') || lowerKey.includes('drum')) category = 'perc';
            else if (lowerKey.includes('guitar') || lowerKey.includes('pluck') || lowerKey.includes('clav') || lowerKey.includes('piano')) category = 'rhythm';
            this.instrumentPalette[category].push(key);
        }
        Logger.message(`ThemeGenerator: Instrument Palette Built. Bass: ${this.instrumentPalette.bass.length}, Pad: ${this.instrumentPalette.pad.length}, Lead: ${this.instrumentPalette.lead.length}`);
    }

    async _loadDrumPatterns() {
        try {
            const data = await CodexLoader.getData('music', 'drumpatterns.json');
            if (!data) throw new Error("No data returned from CodexLoader");
            this.drumPatterns = {};
            for (const category in data) {
                if (Array.isArray(data[category])) {
                    data[category].forEach(pattern => this.drumPatterns[pattern.name] = pattern);
                }
            }
            Logger.message("ThemeGenerator: Drum patterns loaded.");
        } catch (e) {
            Logger.warn("ThemeGenerator: Failed to load drumpatterns.json via Codex.", e);
        }
    }

    async _loadHarmonicPatterns() {
        try {
            const data = await CodexLoader.getData('music', 'harmonic_patterns.json');
            if (!data) throw new Error("No data returned from CodexLoader");
            this.harmonicPatterns = data.patterns;
            Logger.message("ThemeGenerator: Harmonic patterns loaded.");
        } catch (e) {
            Logger.warn("ThemeGenerator: Failed to load harmonic_patterns.json via Codex.", e);
        }
    }

    async _loadBassPatterns() {
        try {
            const data = await CodexLoader.getData('music', 'basspatterns.json');
            if (!data) throw new Error("No data returned from CodexLoader");
            this.bassPatterns = data.patterns;
            Logger.message("ThemeGenerator: Bass patterns loaded.");
        } catch (e) {
            Logger.warn("ThemeGenerator: Failed to load bass patterns via Codex.", e);
        }
    }

    _getInstrumentForRole(role, geo, usedInstruments = new Set()) {
        if (!this.synth) return 'Piano';
        let palette = this.instrumentPalette[role];
        if (!palette || palette.length === 0) palette = this.instrumentPalette.lead;

        if (palette && palette.length > 0) {
            const rng = new MusicRNG(geo?.name || role);
            const available = palette.filter(inst => !usedInstruments.has(inst));
            const pool = available.length > 0 ? available : palette;
            const instrument = rng.pick(pool);
            usedInstruments.add(instrument);
            return instrument;
        }

        const fallbacks = { 'bass': 'Synth_Bass', 'pad': 'Synth_Pad', 'lead': 'Synth_Lead', 'rhythm': 'Synth_Lead' };
        return fallbacks[role] || 'Piano';
    }

    _getProceduralInstrument(category, seed) {
        const rng = new MusicRNG(seed);
        const palette = this.instrumentPalette[category];
        if (palette && palette.length > 0) return rng.pick(palette);
        const fallbackMap = { 'kick': 'Drum_Kick', 'snare': 'Drum_Snare', 'hat': 'Drum_HiHat_Closed', 'perc': 'Drum_Cowbell' };
        return fallbackMap[category] || 'Piano';
    }

    async _ensureInstrumentDefined(instrumentId, aliasId = null, forceEnvelope = null, geoParams = {}) {
        const targetId = aliasId || instrumentId;
        if (!this.synth || this.synth.instrumentEngine.instruments.has(targetId)) return;

        const standard = ['Drum_Kick', 'Drum_Snare', 'Drum_HiHat_Closed', 'Drum_HiHat_Open', 'Drum_Crash', 'Drum_Ride', 'Drum_Tom_High', 'Drum_Tom_Low', 'Drum_Cowbell', 'Synth_Bass', 'Synth_Lead', 'Synth_Pad', 'Tuba', 'Oboe', 'Guitar', 'Harpsichord', 'Piano', 'Cello', 'Violin', 'Viola', 'Flute', 'Trumpet', 'French Horn', 'Clarinet', 'Harp'];
        if (standard.includes(instrumentId)) return;

        const data = this.manifestManager.manifest.samples[instrumentId];
        if (!data) {
            Logger.warn(`ThemeGenerator: Sample data missing for ''.`);
            return;
        }

        const lowerKey = instrumentId.toLowerCase();
        let role = 'lead';
        if (lowerKey.includes('bass')) role = 'bass';
        else if (lowerKey.includes('pad') || lowerKey.includes('atmos') || lowerKey.includes('texture') || lowerKey.includes('string')) role = 'pad';
        else if (lowerKey.includes('kick')) role = 'kick';
        else if (lowerKey.includes('snare')) role = 'snare';
        else if (lowerKey.includes('hat')) role = 'hat';
        else if (lowerKey.includes('perc')) role = 'perc';

        let envelope = forceEnvelope || (role === 'pad' ? 'sustained' : 'percussive');
        const depth = geoParams.chi > 7 ? 'high' : 'medium';

        if (data.analysis && data.analysis.freq) {
            this.synth.instrumentEngine.createSyntheticInstrument(instrumentId, targetId, depth, envelope, role);
        } else {
            if (this.synth.instrumentEngine.allowRuntimeAnalysis) {
                const url = this.manifestManager.getAssetPath('samples', instrumentId);
                if (url) {
                    await this.music.loadSample(instrumentId, url);
                    const analysis = await this.music.analyzeSample(instrumentId);
                    if (analysis) {
                        this.music.saveAnalysis(instrumentId, analysis);
                        this.synth.instrumentEngine.createSyntheticInstrument(instrumentId, targetId, 'high', envelope);
                        return;
                    }
                }
            }
            this.synth.instrumentEngine.createSyntheticInstrument(instrumentId, targetId, 'low', envelope, role);
        }
    }

    _getInstrumentFromGeometry(geo, usedInstruments = new Set()) {
        let octave = geo.Octave !== undefined ? geo.Octave : 4;
        const chi = geo.Chi || 5;
        let role = 'lead';
        if (chi > 7 || octave <= 3) role = 'bass';
        else if (octave >= 6) role = 'lead';
        else if (chi < 4) role = 'rhythm';
        else role = 'pad';

        const rng = new MusicRNG(geo.name || JSON.stringify(geo));
        let palette = this.instrumentPalette[role];
        let instrument = 'Piano';

        if (palette && palette.length > 0) {
            const available = palette.filter(inst => !usedInstruments.has(inst));
            const pool = available.length > 0 ? available : palette;
            instrument = rng.pick(pool);
            usedInstruments.add(instrument);
        } else {
            if (role === 'bass') instrument = 'Synth_Bass';
            else if (role === 'pad') instrument = 'Synth_Pad';
            else instrument = 'Synth_Lead';
        }
        return { instrument: instrument, role: role, chi: chi };
    }

    ensureGeometry(source) {
        if (!source) return null;
        if (source.geometry && source.geometry.GeoHarmonics) return source;
        if (!this.geometry) {
            Logger.warn("ThemeGenerator: Geometry module missing.");
            return source;
        }
        const geo = this.geometry.calculateFullGeo(source.name);
        return { ...source, geometry: geo };
    }

    async createMainTheme(activeComponents, gameEngine, forceRegeneration) {
        if (!this.synth) return null;

        const trackName = 'track_main_theme';
        Logger.message("ThemeGenerator: generating Main Theme...");

        const componentsList = [...activeComponents];
        if (componentsList.length === 0 && gameEngine) {
            if (gameEngine.playerCharacter) componentsList.push(gameEngine.playerCharacter);
            if (gameEngine.playerShip) componentsList.push(gameEngine.playerShip);
            if (gameEngine.galaxy) componentsList.push(gameEngine.galaxy);
        }

        const reversedComponents = [...componentsList].reverse();
        let rhythmEntity = reversedComponents.find(c => c.constructor && c.constructor.name === 'Ship');
        if (!rhythmEntity) rhythmEntity = reversedComponents.find(c => c.role);
        if (!rhythmEntity) rhythmEntity = reversedComponents[0];

        const rhythmEntityGeo = this.ensureGeometry(rhythmEntity);
        if (!rhythmEntityGeo) return null;
        const rhythm = this._generateRhythm(rhythmEntityGeo);
        const stepsPerBar = parseInt(rhythm.stepsPerMeasure || 16, 10);

        const baseKeyData = this.geometry.getKey(rhythmEntityGeo.geometry.GeoHarmonics.key);
        const baseFreq = baseKeyData.Key.Frequency;

        if (!this.currentProgression || forceRegeneration) {
            const uniqueFreqs = [];
            const seenKeys = new Set();
            componentsList.forEach(comp => {
                const geo = this.ensureGeometry(comp);
                if (geo && geo.geometry && geo.geometry.GeoHarmonics) {
                    const keyData = this.geometry.getKey(geo.geometry.GeoHarmonics.key);
                    if (keyData && !seenKeys.has(keyData.Key.Key)) {
                        seenKeys.add(keyData.Key.Key);
                        uniqueFreqs.push(keyData.Key.Frequency);
                    }
                }
            });
            if (uniqueFreqs.length === 0) uniqueFreqs.push(baseFreq);

            let fullProgression = [];
            uniqueFreqs.forEach(freq => {
                fullProgression = fullProgression.concat(this._generateProgression(freq, stepsPerBar));
            });
            if (uniqueFreqs.length === 1) {
                fullProgression = fullProgression.concat(this._generateProgression(uniqueFreqs[0] * 1.5, stepsPerBar));
            }
            fullProgression = fullProgression.concat(this._generateProgression(uniqueFreqs[0], stepsPerBar));
            this.currentProgression = fullProgression;
            Logger.message(`ThemeGenerator: Progression regenerated with ${uniqueFreqs.length} unique keys.`);
        }
        const progression = this.currentProgression;

        const bpm = 120;
        const beatTime = 60 / bpm;
        const voices = [];

        const drumSeed = (rhythmEntityGeo.name || 'default') + (rhythmEntityGeo.origin || '');
        const drumKit = {
            'v_kick': this._getProceduralInstrument('kick', drumSeed),
            'v_snare': this._getProceduralInstrument('snare', drumSeed + '_snare'),
            'v_hat': this._getProceduralInstrument('hat', drumSeed + '_hat'),
            'v_crash': this._getProceduralInstrument('perc', drumSeed + '_crash'),
            'v_ride': this._getProceduralInstrument('perc', drumSeed + '_ride'),
            'v_perc': this._getProceduralInstrument('perc', drumSeed + '_perc')
        };

        for (const id of Object.values(drumKit)) {
            await this._ensureInstrumentDefined(id);
        }

        rhythm.events.forEach(evt => {
            let v = voices.find(v => v.id === evt.voice);
            if (!v) {
                // Robust drum detection: Force isDrum if ID suggests it
                v = { id: evt.voice, name: evt.voice, instrument: drumKit[evt.voice], sequence: [], mute: false, isDrum: true };
                voices.push(v);
            }
            v.sequence.push(evt);
        });

        const components = reversedComponents;
        let bassAssigned = false;
        let rhythmAssigned = false;
        const usedInstruments = new Set();

        for (let index = 0; index < Math.min(components.length, 6); index++) {
            await new Promise(r => setTimeout(r, 0));
            const source = components[index];
            if (!source || !source.name) continue;

            const entity = this.ensureGeometry(source);
            let { role: naturalRole, chi } = this._getInstrumentFromGeometry(entity.geometry, usedInstruments);
            
            let finalRole = naturalRole;

            if (index === 0) {
                finalRole = 'lead';
            } else {
                if (!bassAssigned && naturalRole !== 'bass') {
                     if (index < 3 && (naturalRole === 'pad' || naturalRole === 'lead')) finalRole = 'bass';
                }
                if (!rhythmAssigned && naturalRole !== 'rhythm') {
                    if (index < 3 && naturalRole === 'pad') finalRole = 'rhythm';
                }
            }

            if (finalRole === 'lead' && index > 0) finalRole = 'pad';
            if (finalRole === 'bass') {
                if (bassAssigned) finalRole = 'pad';
                else bassAssigned = true;
            }
            if (finalRole === 'rhythm') rhythmAssigned = true;

            const instrument = this._getInstrumentForRole(finalRole, entity.geometry, usedInstruments);
            const geoParams = { chi };
            await this._ensureInstrumentDefined(instrument, null, null, geoParams);

            const voiceId = `v_${source.name.replace(/[^a-zA-Z0-9]/g, '_')}_`;
            let events = [];

            if (finalRole === 'bass') {
                events = this._generateBassline(rhythm, entity, progression, baseFreq / 4, beatTime);
            } else if (finalRole === 'pad') {
                const h = this._generateHarmonics(rhythm, entity, progression, baseFreq);
                events = h.pad;
            } else if (finalRole === 'rhythm') {
                const h = this._generateHarmonics(rhythm, entity, progression, baseFreq);
                events = h.guitar;
            } else {
                const motif = this.getCharacterComposition(entity);
                if (motif) events = this._motifToHarmonizedEvents(motif, voiceId, beatTime, progression, baseFreq);
            }

            if (events.length > 0) {
                voices.push({
                    id: voiceId,
                    name: `${entity.name} ()`,
                    instrument: instrument,
                    sequence: events,
                    mute: false,
                    isDrum: false
                });
            }
        }

        const measures = Math.max(4, progression.length);
        const totalSteps = measures * stepsPerBar;

        voices.forEach(v => {
            if (!v.isDrum && (v.id.includes('kick') || v.id.includes('snare') || v.id.includes('hat') || v.id.includes('perc') || v.id.includes('ride') || v.id.includes('crash'))) {
                v.isDrum = true;
            }
            if (v.isDrum) v.loopLength = stepsPerBar || 16; // Explicitly set loop length with fallback

            if (!v.isDrum && v.sequence && v.sequence.length > 0) {
                const motifEvents = [...v.sequence];
                v.sequence = [];
                if (motifEvents.length === 0) return;

                const lastEventStep = motifEvents[motifEvents.length - 1].step;
                const loopLength = Math.ceil((lastEventStep + 1) / stepsPerBar) * stepsPerBar;

                let currentStep = 0;
                while (currentStep < totalSteps) {
                    motifEvents.forEach(evt => {
                        if (currentStep + evt.step < totalSteps) {
                            v.sequence.push({ ...evt, step: currentStep + evt.step });
                        }
                    });
                    currentStep += loopLength;
                }
            }
        });

        return {
            name: 'Main Theme',
            bpm: bpm,
            timeSignature: rhythm.timeSignature,
            measures: measures,
            totalSteps: totalSteps,
            patternLength: stepsPerBar,
            voices: voices
        };
    }

    _motifToTrackEvents(motif, voiceId, beatTime, pitchShiftSemitones = 0) {
        const events = [];
        let currentStep = 0;
        motif.sequence.forEach(note => {
            const durationSteps = note.duration * 4;
            let freq = note.freq;
            if (pitchShiftSemitones !== 0) {
                freq = freq * Math.pow(2, pitchShiftSemitones / 12);
            }
            events.push({
                voice: voiceId,
                step: currentStep,
                freq: freq,
                duration: note.duration * beatTime,
                velocity: 0.7
            });
            currentStep += durationSteps;
        });
        return events;
    }

    _motifToHarmonizedEvents(motif, voiceId, beatTime, progression, globalBaseFreq) {
        const events = [];
        let currentStep = 0;
        const totalProgressionSteps = progression.reduce((sum, chord) => sum + chord.durationSteps, 0);
        const chordMap = [];
        let stepAccumulator = 0;
        for (const chord of progression) {
            chordMap.push({ start: stepAccumulator, end: stepAccumulator + chord.durationSteps, chord });
            stepAccumulator += chord.durationSteps;
        }
        let chordIndex = 0;

        while (currentStep < totalProgressionSteps) {
            for (const note of motif.sequence) {
                if (currentStep >= totalProgressionSteps) break;
                while (chordIndex < chordMap.length && currentStep >= chordMap[chordIndex].end) {
                    chordIndex++;
                }
                if (chordIndex >= chordMap.length) chordIndex = 0;
                const activeChord = chordMap[chordIndex].chord;
                const harmonizedPitch = activeChord.rootOffset + note.interval;
                const freq = globalBaseFreq * Math.pow(2, harmonizedPitch / 12);
                const durationSteps = Math.ceil(note.duration * 4);

                events.push({
                    voice: voiceId,
                    step: currentStep,
                    freq: freq,
                    duration: note.duration * beatTime,
                    velocity: 0.7
                });
                currentStep += durationSteps;
            }
        }
        return events;
    }

    _addLoopToSequence(targetSeq, sourceEvents, offsetStep, loopLengthSteps) {
        sourceEvents.forEach(evt => {
            const loopStep = evt.step % loopLengthSteps;
            targetSeq.push({
                ...evt,
                step: offsetStep + loopStep
            });
        });
    }

    _countSyllables(word) {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        const match = word.match(/[aeiouy]{1,2}/g);
        return match ? match.length : 1;
    }

    _countSyllablesInPhrase(phrase) {
        if (!phrase) return 4;
        const words = phrase.split(/[^a-zA-Z]+/);
        let count = 0;
        for (const w of words) {
            if (w) count += this._countSyllables(w);
        }
        return count || 4;
    }

    _generateRhythm(ship = null) {
        const name = ship ? ship.name : 'default';
        const rng = new MusicRNG(name);
        const targetBeats = this._countSyllablesInPhrase(name);

        if (this.drumPatterns) {
            const targetGenre = ship ? (ship.origin === 'Core' ? "6" : "3") : "3";
            const targetEra = ship ? (ship.techLevel > 5 ? "3" : "2") : "2";
            let matchingKeys = Object.keys(this.drumPatterns).filter(k => {
                const p = this.drumPatterns[k];
                // Prioritize matching the beat count (time signature numerator)
                const tsNumerator = p.timeSignature ? p.timeSignature[0] : 4;
                if (tsNumerator === targetBeats) return true;
                
                if (!p.tags) return false;
                return (p.tags.genres && p.tags.genres.includes(targetGenre)) || (p.tags.eras && p.tags.eras.includes(targetEra));
            });
            const pool = matchingKeys.length > 0 ? matchingKeys : Object.keys(this.drumPatterns);
            const patternKey = rng.pick(pool);
            const pattern = this.drumPatterns[patternKey];
            if (pattern) {
                const events = [];
                const tracks = pattern.tracks || {};
                const getTrack = (name) => {
                    const key = Object.keys(tracks).find(k => k.toLowerCase() === name.toLowerCase());
                    return key ? tracks[key] : [];
                };
                getTrack('kick').forEach(step => events.push({ voice: 'v_kick', step: parseInt(step, 10), freq: 100, duration: 0.1, velocity: 0.9 }));
                getTrack('snare').forEach(step => events.push({ voice: 'v_snare', step: parseInt(step, 10), freq: 261.63, duration: 0.1, velocity: 0.8 }));
                getTrack('hat').forEach(step => events.push({ voice: 'v_hat', step: parseInt(step, 10), freq: 261.63, duration: 0.05, velocity: 0.6 }));
                if (pattern.style === 'Rock' || pattern.style === 'Action') {
                    events.push({ voice: 'v_crash', step: 0, freq: 100, duration: 1.5, velocity: 0.8 });
                }
                return {
                    events,
                    style: pattern.style,
                    timeSignature: pattern.timeSignature || [4, 4],
                    stepsPerMeasure: parseInt(pattern.length || 16, 10)
                };
            }
        }
        const events = [];
        const kickPattern = rng.pick(['four-on-floor', 'breakbeat', 'driving']);
        
        // Procedural fallback: Use targetBeats to determine length (4 steps per beat)
        const lengthSteps = Math.max(16, targetBeats * 4); 
        
        for (let i = 0; i < lengthSteps; i++) {
            let kick = false;
            if (kickPattern === 'four-on-floor' && i % 4 === 0) kick = true;
            else if (kickPattern === 'driving' && (i % 2 === 0 || i % 8 === 7)) kick = true;
            else if (kickPattern === 'breakbeat' && (i % 8 === 0 || i % 8 === 5)) kick = true;
            if (kick) events.push({ voice: 'v_kick', step: i, freq: 100, duration: 0.1, velocity: 0.8 });
            if (i % 8 === 4) events.push({ voice: 'v_snare', step: i, freq: 100, duration: 0.1, velocity: 0.7 });
            const hatDensity = ship && ship.components ? 0.5 + (ship.components.length * 0.05) : 0.5;
            if (i % 2 === 0 || (rng.next() < hatDensity && i % 2 !== 0)) events.push({ voice: 'v_hat', step: i, freq: 261.63, duration: 0.05, velocity: 0.5 });
            if (kickPattern === 'driving' && i % 2 !== 0) events.push({ voice: 'v_ride', step: i, freq: 100, duration: 0.8, velocity: 0.6 });
        }
        events.push({ voice: 'v_crash', step: 0, freq: 100, duration: 1.5, velocity: 0.9 });
        return { events, style: 'Electronic', timeSignature: [targetBeats, 4], stepsPerMeasure: lengthSteps };
    }

    _generateProgression(baseFreq, stepsPerBar = 16) {
        const progressions = [
            ['I', 'V', 'vi', 'IV'], ['I', 'vi', 'IV', 'V'], ['ii', 'V', 'I', 'vi'], ['vi', 'IV', 'I', 'V'], ['I', 'IV', 'V', 'IV']
        ];
        const romanChords = this.geometry && this.geometry.RomanChords ? this.geometry.RomanChords : [];
        if (!romanChords.length) return [{ rootOffset: 0, intervals: [0, 4, 7], durationSteps: 64 }];
        const rng = new MusicRNG(baseFreq);
        const sourceProgressions = (this.progressions && this.progressions.length > 0) ? this.progressions : progressions.map(p => ({ data: { Progression: p } }));
        const selectedItem = rng.pick(sourceProgressions);
        const progChords = selectedItem.data ? selectedItem.data.Progression : selectedItem;
        return progChords.map(name => {
            const chordDef = romanChords.find(c => c.Name === name) || romanChords[0];
            return { name: chordDef.Name, rootOffset: chordDef.Notes[0], intervals: chordDef.Notes, durationSteps: stepsPerBar };
        });
    }

    _generateBassline(rhythm, ship, progression, keyRootFreq, beatTime) {
        const events = [];
        if (!this.bassPatterns || Object.keys(this.bassPatterns).length === 0) {
            let currentStepOffset = 0;
            progression.forEach(chord => {
                const chordRootFreq = keyRootFreq * Math.pow(2, chord.rootOffset / 12);
                for (let i = 0; i < chord.durationSteps; i += 4) {
                    events.push({ voice: 'v_bass', step: currentStepOffset + i, freq: chordRootFreq, duration: 0.2, velocity: 0.9 });
                }
                currentStepOffset += chord.durationSteps;
            });
            return events;
        }
        const rng = new MusicRNG(ship ? ship.name : 'bass');
        let style = rhythm.style || 'Rock';
        if (style === 'Driving') style = 'Action';
        if (style === 'BasicRock') style = 'Rock';
        if (style === 'FourOnFloor') style = 'Electronic';
        let patternKey = Object.keys(this.bassPatterns).find(k => this.bassPatterns[k].style === style) || 'Rock';
        const pattern = this.bassPatterns[patternKey];
        const intervals = pattern.intervals || [0];
        let currentStepOffset = 0;
        progression.forEach(chord => {
            const chordRootFreq = keyRootFreq * Math.pow(2, chord.rootOffset / 12);
            const stepsInChord = chord.durationSteps;
            const getFreq = (interval) => chordRootFreq * Math.pow(2, interval / 12);
            if (pattern.strategy === 'kick_lock') {
                const kickSteps = rhythm.events.filter(e => e.voice === 'v_kick' && e.step < stepsInChord).map(e => e.step);
                kickSteps.forEach(step => {
                    events.push({ voice: 'v_bass', step: currentStepOffset + step, freq: getFreq(0), duration: 0.2, velocity: 0.9 });
                });
                for (let i = 0; i < stepsInChord; i++) {
                    if (!kickSteps.includes(i) && rng.next() < 0.3) {
                        const interval = rng.pick(intervals);
                        const octave = rng.next() > 0.7 ? 1 : 0;
                        events.push({ voice: 'v_bass', step: currentStepOffset + i, freq: getFreq(interval + (octave * 12)), duration: 0.1, velocity: 0.6 });
                    }
                }
            } else if (pattern.strategy === 'walking') {
                const walkSteps = [0, 4, 8, 12];
                walkSteps.forEach((step, index) => {
                    if (step >= stepsInChord) return;
                    const currentInterval = (index === 0) ? 0 : rng.pick(intervals);
                    events.push({ voice: 'v_bass', step: currentStepOffset + step, freq: getFreq(currentInterval), duration: beatTime * 0.9, velocity: 0.8 });
                });
            } else if (pattern.strategy === 'root_fifth') {
                if (stepsInChord >= 8) {
                    events.push({ voice: 'v_bass', step: currentStepOffset + 0, freq: getFreq(0), duration: beatTime * 1.5, velocity: 0.9 });
                    events.push({ voice: 'v_bass', step: currentStepOffset + 8, freq: getFreq(7), duration: beatTime * 1.5, velocity: 0.8 });
                }
            } else if (pattern.strategy === 'root_pump') {
                for (let i = 0; i < stepsInChord; i += 2) {
                    events.push({ voice: 'v_bass', step: currentStepOffset + i, freq: getFreq(0), duration: 0.15, velocity: i % 4 === 0 ? 0.9 : 0.7 });
                }
            } else if (pattern.strategy === 'offbeat') {
                for (let i = 2; i < stepsInChord; i += 4) {
                    events.push({ voice: 'v_bass', step: currentStepOffset + i, freq: getFreq(0), duration: 0.2, velocity: 0.8 });
                }
            } else {
                for (let i = 0; i < stepsInChord; i += 2) {
                    if (rng.next() < pattern.density) {
                        const interval = rng.pick(intervals);
                        events.push({ voice: 'v_bass', step: currentStepOffset + i, freq: getFreq(interval), duration: 0.2, velocity: 0.8 });
                    }
                }
                if (!events.find(e => e.step === currentStepOffset)) {
                    events.push({ voice: 'v_bass', step: currentStepOffset, freq: getFreq(0), duration: 0.4, velocity: 1.0 });
                }
            }
            currentStepOffset += stepsInChord;
        });
        return events;
    }

    _generateHarmonics(rhythm, ship, progression, keyRootFreq) {
        const guitarEvents = [];
        const padEvents = [];
        if (!this.harmonicPatterns) return { guitar: [], pad: [] };
        const patternKey = Object.keys(this.harmonicPatterns).find(k => this.harmonicPatterns[k].style === rhythm.style) || 'Electronic';
        const pattern = this.harmonicPatterns[patternKey];
        if (!pattern) return { guitar: [], pad: [] };
        let currentStepOffset = 0;
        progression.forEach(chord => {
            const stepsInChord = chord.durationSteps;
            const chordFreqs = chord.intervals.map(semitone => keyRootFreq * Math.pow(2, semitone / 12));
            if (pattern.guitar) {
                pattern.guitar.steps.forEach(step => {
                    if (step >= stepsInChord) return;
                    const noteFreq = chordFreqs[step % chordFreqs.length];
                    guitarEvents.push({ voice: 'v_guitar', step: currentStepOffset + step, freq: noteFreq, duration: pattern.guitar.duration, velocity: pattern.guitar.velocity });
                });
            }
            if (pattern.pad) {
                if (pattern.pad.behavior === 'sidechain') {
                    padEvents.push({ voice: 'v_pad', step: currentStepOffset, freq: chordFreqs[0], duration: 4.0, velocity: 0.6 });
                } else if (pattern.pad.behavior === 'snare_mirror') {
                    const snareSteps = rhythm.events.filter(e => e.voice === 'v_snare' && e.step < stepsInChord).map(e => e.step);
                    snareSteps.forEach(step => {
                        const noteFreq = chordFreqs[1] || chordFreqs[0];
                        padEvents.push({ voice: 'v_pad', step: currentStepOffset + step, freq: noteFreq, duration: pattern.pad.duration, velocity: pattern.pad.velocity });
                    });
                } else if (pattern.pad.behavior === 'kick_lock') {
                    const kickSteps = rhythm.events.filter(e => e.voice === 'v_kick' && e.step < stepsInChord).map(e => e.step);
                    kickSteps.forEach(step => {
                        const noteFreq = chordFreqs[0] / 2;
                        padEvents.push({ voice: 'v_pad', step: currentStepOffset + step, freq: noteFreq, duration: pattern.pad.duration, velocity: pattern.pad.velocity });
                    });
                } else {
                    pattern.pad.steps.forEach(step => {
                        if (step >= stepsInChord) return;
                        const noteFreq = chordFreqs[0];
                        padEvents.push({ voice: 'v_pad', step: currentStepOffset + step, freq: noteFreq, duration: pattern.pad.duration, velocity: pattern.pad.velocity });
                    });
                }
            }
            currentStepOffset += stepsInChord;
        });
        return { guitar: guitarEvents, pad: padEvents };
    }

    _parseTonalPattern(patternString = '') {
        const intervals = [];
        if (!patternString) return [2, 2, 1, 2, 2, 2, 1];
        const re = /(\d+)\((\d+)\)/;
        const match = patternString.match(re);
        if (match) patternString = match[1] + match[2];
        for (const char of patternString) {
            if (char === 'S') intervals.push(1);
            else if (char === 'T') intervals.push(2);
            else if (!isNaN(parseInt(char, 10))) intervals.push(parseInt(char, 10));
        }
        return intervals;
    }

    _getTonalMode(characterGeo) {
        if (!this.tonalModes.length || !characterGeo) return null;
        const modeName = characterGeo.GeoHarmonics?.Mode || 'Ionian/Major';
        const found = this.tonalModes.find(m => {
            const type = m.data ? m.data.Type : m.Type;
            return type === modeName;
        });
        return found ? (found.data || found) : null;
    }

    _getMelodicIntervalDistribution(scaleIntervals) {
        const distribution = {};
        if (scaleIntervals.length < 2) return distribution;
        for (let i = 0; i < scaleIntervals.length - 1; i++) {
            const interval = scaleIntervals[i + 1] - scaleIntervals[i];
            if (interval > 0) distribution[interval] = (distribution[interval] || 0) + 1;
        }
        const lastInterval = 12 - scaleIntervals[scaleIntervals.length - 1];
        if (lastInterval > 0) distribution[lastInterval] = (distribution[lastInterval] || 0) + 1;
        return distribution;
    }

    _generateMarkovTransitions(scaleIntervals, harmonicStepDistribution = {}) {
        const matrix = [];
        const preferredIntervals = new Map();
        for (const interval in harmonicStepDistribution) {
            const i = parseInt(interval, 10);
            const count = harmonicStepDistribution[interval];
            preferredIntervals.set(i, (preferredIntervals.get(i) || 0) + count);
            const descending = (12 - i) % 12;
            if (descending !== 0) preferredIntervals.set(descending, (preferredIntervals.get(descending) || 0) + count);
        }
        for (let i = 0; i < scaleIntervals.length; i++) {
            const fromInterval = scaleIntervals[i];
            const weights = [];
            let totalWeight = 0;
            for (let j = 0; j < scaleIntervals.length; j++) {
                const toInterval = scaleIntervals[j];
                const melodicInterval = (toInterval - fromInterval + 12) % 12;
                let weight = 1.0;
                if (melodicInterval === 0) weight += 1.5;
                else if (melodicInterval === 1 || melodicInterval === 2 || melodicInterval === 10 || melodicInterval === 11) weight += 2.0;
                if (preferredIntervals.has(melodicInterval)) weight += 4.0 * preferredIntervals.get(melodicInterval);
                if (melodicInterval === 6 && !preferredIntervals.has(6)) weight *= 0.1;
                weights.push(weight);
                totalWeight += weight;
            }
            matrix[i] = weights.map(w => w / totalWeight);
        }
        return matrix;
    }

    getCharacterComposition(character, options = {}) {
        if (!character || !character.name) return null;
        const useCharacterHarmonics = options.useCharacterHarmonics !== false;
        const cacheKey = `${character.id || character.name}_`;
        if (this.compositionCache.has(cacheKey)) return this.compositionCache.get(cacheKey);
        let geo = character.geometry;
        if (!geo && this.geometry) geo = this.geometry.calculateFullGeo(character.name);
        if (!geo) return null;
        const rng = new MusicRNG(character.name);
        const keyNum = geo.GeoHarmonics ? geo.GeoHarmonics.key : geo.GeometryNumber;
        if (!this.geometry) {
            Logger.warn("ThemeGenerator: Geometry module missing, cannot generate composition.");
            return null;
        }
        const keyData = this.geometry.getKey(keyNum);
        const baseFreq = keyData.Key.Frequency;
        const rootKeyIndex = CHROMATIC_SCALE.indexOf(keyData.Key.Key);
        const tonalMode = this._getTonalMode(geo);
        const tonalPattern = this._parseTonalPattern(tonalMode?.Pattern);
        const allowedScaleIntervals = [0];
        let cumulativeInterval = 0;
        for (const step of tonalPattern) {
            cumulativeInterval += step;
            if (cumulativeInterval < 12) allowedScaleIntervals.push(cumulativeInterval);
        }
        let harmonicStepDistribution = {};
        if (useCharacterHarmonics) {
            const harmonics = geo.GeoHarmonics ? geo.GeoHarmonics.Harmonic : [1, 3, 5, 8];
            const harmonicIntervals = [...new Set(harmonics.map(h => (h - 1) % 12))];
            if (!harmonicIntervals.includes(0)) harmonicIntervals.push(0);
            harmonicIntervals.sort((a, b) => a - b);
            harmonicStepDistribution = this._getMelodicIntervalDistribution(harmonicIntervals);
        }
        const transitionMatrix = this._generateMarkovTransitions(allowedScaleIntervals, harmonicStepDistribution);
        const length = rng.range(8, 16);
        const sequence = [];
        const noteDurations = [0.25, 0.5, 1.0];
        let currentNoteIndex = 0;
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
            sequence.push({ freq: freq, duration: rng.pick(noteDurations), interval: interval, pitchName: pitchName });
            currentNoteIndex = nextNoteIndex;
        }
        const composition = { name: `${character.name}'s Theme`, key: keyData.Key.Key, baseFreq: baseFreq, scale: allowedScaleIntervals, sequence: sequence, tempo: 100 + (geo.Facade * 2) };
        this.compositionCache.set(cacheKey, composition);
        return composition;
    }

    getComposition(entity) {
        if (!entity || !entity.name) return null;
        const entityType = entity.constructor.name;
        const cacheKey = `_${entity.id || entity.name}`;
        if (this.compositionCache.has(cacheKey)) return this.compositionCache.get(cacheKey);
        let compositionData = null;
        if (entity.geometry && entity.type) {
            switch (entity.type) {
                case 'Extra': compositionData = this._generateChant(entity); break;
                case 'Grunt': compositionData = this._generateMarch(entity); break;
                case 'Hero': compositionData = this._generateAria(entity); break;
                case 'Yarn-Teller': compositionData = this._generateSolo(entity); break;
                case 'Lite': compositionData = this._generateLeitmotif(entity); break;
                case 'Archetype': compositionData = this._generateAnthem(entity); break;
                default: compositionData = this.getCharacterComposition(entity); break;
            }
        } else if (entity.isLocation) {
            compositionData = this._generateSymphony(entity);
        } else if (entity.isPact) {
            compositionData = this._generateOpera(entity);
        } else if (entity.isDescendant) {
            compositionData = entity.isUnique ? this._generateRefrain(entity) : this._generateJingle(entity);
        }
        if (compositionData) {
            Logger.message(`ThemeGenerator: Generated composition '${compositionData.name}' for ${entity.name}`);
            this.compositionCache.set(cacheKey, compositionData);
        }
        return compositionData;
    }

    _generateChant(character) {
        const composition = this.getCharacterComposition(character);
        composition.name = `${character.name}'s Chant`;
        composition.sequence = composition.sequence.map(note => ({ ...note, freq: composition.baseFreq, duration: 1.0 }));
        composition.type = 'Chant';
        return composition;
    }

    _generateMarch(character) {
        const composition = this.getCharacterComposition(character);
        composition.name = `${character.name}'s March`;
        composition.tempo = 120;
        composition.sequence = composition.sequence.map(note => ({ ...note, duration: 0.5 }));
        composition.type = 'March';
        return composition;
    }

    _generateAria(hero) {
        const composition = this.getCharacterComposition(hero);
        composition.name = `${hero.name}'s Aria`;
        composition.tempo = 80;
        composition.type = 'Aria';
        return composition;
    }

    _generateSolo(yarnTeller) {
        const composition = this.getCharacterComposition(yarnTeller);
        composition.name = `${yarnTeller.name}'s Solo`;
        composition.tempo = 160;
        const extraNotes = this.getCharacterComposition({ ...yarnTeller, name: yarnTeller.name + '_extra' }).sequence;
        composition.sequence = composition.sequence.concat(extraNotes);
        composition.type = 'Solo';
        return composition;
    }

    _generateLeitmotif(character) {
        const composition = this.getCharacterComposition(character);
        composition.name = `${character.name}'s Leitmotif`;
        composition.sequence = composition.sequence.slice(0, 4);
        composition.type = 'Leitmotif';
        return composition;
    }

    _generateAnthem(character) {
        const composition = this.getCharacterComposition(character);
        composition.name = `${character.name}'s Anthem`;
        composition.tempo = 70;
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
            key: 'C',
            themes: {}
        };
        pact.members.forEach(member => {
            composition.themes[member.name] = this.getCharacterComposition(member);
        });
        return composition;
    }

    _generateRefrain(descendant) {
        const composition = this.getCharacterComposition({ name: descendant.name }, { useCharacterHarmonics: false });
        composition.name = `${descendant.name}'s Refrain`;
        composition.type = 'Refrain';
        return composition;
    }

    _generateJingle(descendant) {
        const composition = this.getCharacterComposition({ name: descendant.name }, { useCharacterHarmonics: false });
        composition.name = `${descendant.name}'s Jingle`;
        composition.type = 'Jingle';
        composition.sequence = composition.sequence.slice(0, 3);
        composition.tempo = 130;
        return composition;
    }

    _noteToFreq(note) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = parseInt(note.slice(-1));
        const keyNumber = notes.indexOf(note.slice(0, -1));
        if (keyNumber < 0) return 440;
        return 440 * Math.pow(2, ((keyNumber + ((octave - 4) * 12)) - 9) / 12);
    }
}
