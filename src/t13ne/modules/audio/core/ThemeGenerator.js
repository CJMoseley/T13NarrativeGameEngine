// src/t13ne/modules/audio/core/ThemeGenerator.js

import CodexLoader from "/src/t13ne/modules/codex/CodexLoader.js";
import { MusicRNG } from "/src/t13ne/modules/audio/core/MusicUtils.js";
import { AudioAnalyzer } from "/src/t13ne/modules/audio/t13ne-audio-analyzer.js";

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Safe Logger fallback for Worker compatibility
const SafeLogger = {
    message: (msg) => (typeof Logger !== 'undefined' && Logger !== SafeLogger) ? Logger.message(msg) : console.log(`[MSG] ${msg}`),
    warn: (msg, err) => (typeof Logger !== 'undefined' && Logger !== SafeLogger) ? Logger.warn(msg, err) : console.warn(`[WARN] ${msg}`, err || ''),
    error: (msg, err) => (typeof Logger !== 'undefined' && Logger !== SafeLogger) ? Logger.error(msg, err) : console.error(`[ERR] ${msg}`, err || '')
};

class VirtualArtist {
    constructor(entity, generator) {
        this.name = entity.name || 'Unknown';
        this.entity = entity;
        this.generator = generator;
        this.geometry = generator.ensureGeometry(entity);
        
        this.midiMotif = null; // NEW: for MIDI data
        // Determine musical identity from Geometry
        const geoKey = this.geometry && this.geometry.geometry && this.geometry.geometry.GeoHarmonics 
            ? this.geometry.geometry.GeoHarmonics.key 
            : (this.geometry ? this.geometry.GeometryNumber : 1);
            
        this.keyData = generator.geometry ? generator.geometry.getKey(geoKey) : { Key: 'C', Frequency: 261.63 };
        
        // Determine Instrument
        const instData = generator._getInstrumentFromGeometry(this.geometry ? this.geometry.geometry : { Chi: 5 });
        this.instrumentId = instData.instrument;
        this.role = instData.role;
        this.chi = instData.chi;

        // NEW: Determine rhythmic identity
        // Force 4/4 default to prevent weird temporal signatures unless explicitly overridden by a specific trait
        this.timeSignature = [4, 4]; 
        this.stepsPerBar = Math.round((this.timeSignature[0] / this.timeSignature[1]) * 16);
        
        this.determineMusicalPersonality();

        // If personality is syncopated, favor the new Accent synth for punchier variety
        if (this.personality === 'syncopated' && this.role !== 'bass') {
            if (this.instrumentId === 'Piano' || this.instrumentId === 'Synth_Lead') {
                const rng = new MusicRNG(this.name + 'accent');
                this.instrumentId = rng.next() > 0.5 ? 'Synth_Accent' : 'Synth_Pluck';
            }
        }
    }

    setRole(role) {
        this.role = role;
        if (role === 'bass') {
            this.personality = 'groove';
            this.setOctave(2);
        } else if (role === 'rhythm') {
            this.personality = 'support';
            this.setOctave(4);
        }
    }

    setOctave(octave) {
        if (!this.geometry) this.geometry = { geometry: {} };
        if (!this.geometry.geometry) this.geometry.geometry = {};
        this.geometry.geometry.Octave = octave;

        const geoKey = this.geometry.geometry.GeoHarmonics ? this.geometry.geometry.GeoHarmonics.key : (this.geometry.GeometryNumber || 1);

        if (this.generator.geometry && typeof this.generator.geometry.getKey === 'function') {
            const keyData = this.generator.geometry.getKey(geoKey);
            // Manually override frequency based on our new octave
            const baseFreq = keyData.Key.Frequency / Math.pow(2, (keyData.KeyNo || 4) - 4);
            this.keyData = {
                Key: { ...keyData.Key, Frequency: baseFreq * Math.pow(2, octave - 4) },
                KeyNo: octave,
                T13NEDescription: keyData.T13NEDescription || ''
            };
        } else {
            this.keyData = { Key: { Key: 'C', Frequency: 261.63 * Math.pow(2, octave - 4) }, KeyNo: octave };
        }
    }

    determineMusicalPersonality() {
        const geoNum = this.geometry?.geometry?.GeometryNumber || 0;
        this.geoNum = geoNum;
        
        // 1, 3, 10: Natural leads/soloists
        if ([1, 3, 10].includes(geoNum)) {
            this.personality = 'lead';
        } else if ([8, 9].includes(geoNum)) {
            this.personality = 'groove';
        } else if ([2, 4, 6, 11, 12].includes(geoNum)) {
            this.personality = 'support';
        } else if (geoNum === 5) {
            this.personality = 'arpeggiator';
        } else if (geoNum === 13) {
            this.personality = 'cascading';
        } else if (geoNum === 7) {
            this.personality = 'syncopated';
        } else {
            this.personality = 'syncopated';
        }

        // Ensure Lead personalities are in a singable octave
        if (this.personality === 'lead' || this.role === 'lead') {
            const currentOctave = this.geometry?.geometry?.Octave || 4;
            if (currentOctave < 4) this.setOctave(4);
            if (currentOctave > 6) this.setOctave(6);
        }
    }

    async prepare() {
        await this.generator._ensureInstrumentDefined(this.instrumentId, null, null, { chi: this.chi });
    }

    assimilateMidi(midiData) {
        if (!midiData || !midiData.tracks || !midiData.tracks[0] || !midiData.tracks[0].notes) {
            SafeLogger.warn(`VirtualArtist ${this.name}: Could not assimilate invalid MIDI data.`);
            return;
        }
        // Use the first track's notes as a motif
        // This is a simplification. A real implementation would be more complex.
        this.midiMotif = midiData.tracks[0].notes.map(note => ({
            // We can't use absolute pitch, we need relative intervals.
            // For now, let's just store the MIDI note number and duration.
            // The generation logic will need to transpose this to the current chord.
            midi: note.midi,
            duration: note.duration,
            velocity: note.velocity
        }));
        SafeLogger.message(`VirtualArtist ${this.name}: Assimilated a MIDI motif with ${this.midiMotif.length} notes.`);
    }
}

class VirtualDrummer extends VirtualArtist {
    constructor(entity, generator) {
        super(entity, generator);
        this.role = 'percussion';
        this.kitType = entity.kitType || 'Standard'; // Standard, Orchestral, Electronic
        // Personality traits for drumming
        this.fillFrequency = 0.25; // Chance to fill at end of phrase
        this.soloChance = 0.05; // Chance to take a solo measure
        this.dropOutChance = 0.1; // Chance to rest for a measure
        this.kit = {}; // Store the kit configuration
    }

    async prepare() {
        // Prefer picking a coherent kit from the same folder
        const rng = new MusicRNG(this.name);

        // Pieces we need
        const pieces = ['kick', 'snare', 'hat', 'perc'];
        const kitMap = {};

        // 1. Try to find a folder that has at least 3 of these
        const allSamples = Object.keys(this.generator.manifestManager.manifest.samples);
        const folderCounts = {};
        allSamples.forEach(s => {
            const folder = s.split('/')[0];
            if (!folderCounts[folder]) folderCounts[folder] = { kick: [], snare: [], hat: [], perc: [], count: 0 };
            const lower = s.toLowerCase();
            if (lower.includes('kick')) folderCounts[folder].kick.push(s);
            else if (lower.includes('snare')) folderCounts[folder].snare.push(s);
            else if (lower.includes('hat')) folderCounts[folder].hat.push(s);
            else if (lower.includes('perc') || lower.includes('clap') || lower.includes('rim')) folderCounts[folder].perc.push(s);
        });

        // Pick folders that have at least kick and snare
        const kits = Object.entries(folderCounts).filter(([name, data]) => data.kick.length > 0 && data.snare.length > 0);

        if (kits.length > 0) {
            const [folderName, folderData] = rng.pick(kits);
            kitMap.kick = rng.pick(folderData.kick);
            kitMap.snare = rng.pick(folderData.snare);
            kitMap.hat = rng.pick(folderData.hat) || this.generator._getProceduralInstrument('hat', this.name + '_hat');
            kitMap.perc = rng.pick(folderData.perc) || this.generator._getProceduralInstrument('perc', this.name + '_perc');
            SafeLogger.message(`VirtualDrummer ${this.name}: Selected coherent kit from folder '${folderName}'`);
        } else {
            // Fallback to mixed selection
            kitMap.kick = this.generator._getProceduralInstrument('kick', this.name);
            kitMap.snare = this.generator._getProceduralInstrument('snare', this.name + '_snare');
            kitMap.hat = this.generator._getProceduralInstrument('hat', this.name + '_hat');
            kitMap.perc = this.generator._getProceduralInstrument('perc', this.name + '_perc');
        }

        // Add to kit and ensure defined
        for (const [role, instId] of Object.entries(kitMap)) {
            this.kit[role] = instId;
            await this.generator._ensureInstrumentDefined(instId);
        }

        // Add extra pieces with mixed selection
        const extraPieces = { 'crash': '_crash', 'ride': '_ride', 'tom_h': '_tomh', 'tom_l': '_toml' };
        for (const [role, suffix] of Object.entries(extraPieces)) {
             const instId = this.generator._getProceduralInstrument(role, this.name + suffix);
             this.kit[role] = instId;
             await this.generator._ensureInstrumentDefined(instId);
        }
    }
}

class VirtualBand {
    constructor(generator) {
        this.generator = generator;
        this.members = [];
        this.conductor = null;
        this.baseFreq = 261.63;
        this.bpm = 120;
        this.progression = [];
        this.rhythm = null;
        this.timeSignature = [4, 4]; // Add a band-wide time signature
        this.stepsPerBar = 16;
        this.polyrhythms = new Map(); // Store artists who will play in a different meter
        this.drummers = [];
        this.tensionLevel = 2;
    }

    balanceRoles() {
        const hasBass = this.members.some(m => m.role === 'bass');
        const hasRhythm = this.members.some(m => m.role === 'rhythm' || m.role === 'pad' || m.personality === 'support');

        if (!hasBass && this.members.length > 0) {
            // Pick a member to be bass (prefer lowest octave)
            const candidate = this.members.reduce((prev, curr) => {
                const prevOct = (prev.geometry && prev.geometry.geometry) ? (prev.geometry.geometry.Octave || 4) : 4;
                const currOct = (curr.geometry && curr.geometry.geometry) ? (curr.geometry.geometry.Octave || 4) : 4;
                return (currOct < prevOct) ? curr : prev;
            });
            candidate.setRole('bass');
            SafeLogger.message(`VirtualBand: Reassigned ${candidate.name} to Bass role.`);
        }

        if (!hasRhythm && this.members.length > 1) {
             const candidate = this.members.find(m => m.role !== 'bass');
             if (candidate) {
                 candidate.setRole('rhythm');
                 SafeLogger.message(`VirtualBand: Reassigned ${candidate.name} to Rhythm role.`);
             }
        }
    }

    async addMember(entity) {
        if (!entity) return;
        
        // Check if it should be a drummer based on type or name
        const isDrummer = entity.type === 'Drummer' || (entity.name && (entity.name.includes('Drum') || entity.name.includes('Perc')));
        if (isDrummer) {
            await this.addDrummer(entity);
            return;
        }

        const artist = new VirtualArtist(entity, this.generator);
        await artist.prepare();
        this.members.push(artist);

        if (!this.conductor) {
            this.conductor = artist;
            // Snap base frequency to nearest standard note to ensure sample compatibility
            const rawFreq = artist.keyData.Frequency;
            const noteIndex = Math.round(12 * Math.log2(rawFreq / 440));
            this.baseFreq = 440 * Math.pow(2, noteIndex / 12);
            // Conductor sets the initial vibe
            this.timeSignature = [4, 4]; // Enforce 4/4 for stability
            this.stepsPerBar = 16;
        } else {
            // Subsequent artists influence the band
            const isDifferentTimeSignature = artist.timeSignature[0] !== this.timeSignature[0] || artist.timeSignature[1] !== this.timeSignature[1];

            // Removed chaotic time signature switching. 
            // Band stays in 4/4. Polyrhythms are only allowed if explicitly divergent.
            
            if (isDifferentTimeSignature) {
                SafeLogger.message(`VirtualBand: Artist ${artist.name} introduces polyrhythm (${artist.timeSignature.join('/')}) over base (${this.timeSignature.join('/')}).`);
                this.polyrhythms.set(artist.name, artist.stepsPerBar);
            }
        }
    }

    async addDrummer(entity) {
        if (!entity) return;
        const drummer = new VirtualDrummer(entity, this.generator);
        await drummer.prepare();
        this.drummers.push(drummer);
    }

    async assembleFromShip(ship) {
        // Ship acts as the band, components of name act as artists
        const nameParts = ship.name.split(/[\s-]+/);
        for (const part of nameParts) {
            // Create a virtual entity for the name component to derive geometry
            const partEntity = { name: part, type: 'Component' };
            await this.addMember(partEntity);
        }
        // Ensure the ship itself is the conductor/lead
        if (this.members.length > 0) {
            // Re-add ship as conductor if not present or just ensure influence
            const shipArtist = new VirtualArtist(ship, this.generator);
            await shipArtist.prepare();
            this.members.unshift(shipArtist); 
            this.conductor = shipArtist;
            this.baseFreq = shipArtist.keyData.Frequency;
        }
    }

    setProgression(progression) {
        this.progression = progression;
    }

    async generateTrack(name, measures = 8) {
        // Delegate back to generator with this band's state
        return await this.generator._generateTrackFromBand(this, name, measures);
    }

    generateWormholeProgression(targetKeyData) {
        // Generate a progression from Conductor's key (Origin) to Target Key
        // This is a simplified modulation logic
        const startFreq = this.baseFreq;
        const endFreq = targetKeyData.Frequency;
        
        // Standard Form: I -> ... -> V_of_Target -> I_Target
        // For now, simple interpolation of frequencies in steps
        const steps = 8;
        const progression = [];
        for(let i=0; i<steps; i++) {
            const t = i / (steps - 1);
            // Linear interpolation of log frequency (pitch)
            const freq = startFreq * Math.pow(endFreq/startFreq, t);
            progression.push({ 
                rootOffset: 0, 
                intervals: [0, 4, 7], 
                durationSteps: 16, 
                keyFreq: freq 
            });
        }
        this.progression = progression;
    }
}

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
        const loader = this.music.codex || CodexLoader;
        this.tonalModes = await loader.getData('geometry', 'tonalModes.json') || [];
        this.progressions = await loader.getData('geometry', 'progressions.json') || [];
        await this._loadDrumPatterns();
        await this._loadHarmonicPatterns();
        await this._loadBassPatterns();
        await this._processManifestInstruments();
    }

    async _processManifestInstruments() {
        if (!this.synth) return;
        const samples = this.manifestManager.manifest.samples;

        // Reset palette
        this.instrumentPalette = {
            bass: [], pad: [], lead: [], rhythm: [],
            kick: [], snare: [], hat: [], perc: [],
            loop_drum: [], loop_music: []
        };

        for (const [key, data] of Object.entries(samples)) {
            const lowerKey = key.toLowerCase();

            // Detection: Loop vs One-Shot
            const isLoop = lowerKey.includes('loop') || lowerKey.includes('bpm');

            let category = null;

            // Priority categorization
            if (lowerKey.includes('kick') || lowerKey.includes(' bd')) category = 'kick';
            else if (lowerKey.includes('snare') || lowerKey.includes(' sd')) category = 'snare';
            else if (lowerKey.includes('hat') || lowerKey.includes(' hh')) category = 'hat';
            else if (lowerKey.includes('perc') || lowerKey.includes('clap') || lowerKey.includes('rim') || lowerKey.includes('tom')) category = 'perc';
            else if (lowerKey.includes('bass')) category = 'bass';
            else if (lowerKey.includes('pad') || lowerKey.includes('atmos') || lowerKey.includes('texture') || lowerKey.includes('string')) category = 'pad';
            else if (lowerKey.includes('guitar') || lowerKey.includes('pluck') || lowerKey.includes('clav') || lowerKey.includes('piano') || lowerKey.includes('key')) category = 'rhythm';
            else category = 'lead';

            if (isLoop) {
                if (['kick', 'snare', 'hat', 'perc'].includes(category) || lowerKey.includes('drum')) {
                    this.instrumentPalette.loop_drum.push(key);
                } else {
                    this.instrumentPalette.loop_music.push(key);
                }
            } else {
                this.instrumentPalette[category].push(key);
            }
        }

        // Log findings
        const counts = Object.entries(this.instrumentPalette).map(([cat, list]) => `${cat}: ${list.length}`).join(', ');
        SafeLogger.message(`ThemeGenerator: Instrument Palette Built. ${counts}`);
    }

    async _loadDrumPatterns() {
        try {
            const loader = this.music.codex || CodexLoader;
            const data = await loader.getData('music', 'drumpatterns.json');
            if (!data) throw new Error("No data returned from CodexLoader");
            this.drumPatterns = {};
            for (const category in data) {
                if (category === 'meta') continue;
                if (Array.isArray(data[category])) {
                    data[category].forEach(pattern => this.drumPatterns[pattern.name] = pattern);
                }
            }
            SafeLogger.message("ThemeGenerator: Drum patterns loaded.");
        } catch (e) {
            SafeLogger.warn("ThemeGenerator: Failed to load drumpatterns.json via Codex.", e);
        }
    }

    async _loadHarmonicPatterns() {
        try {
            const loader = this.music.codex || CodexLoader;
            const data = await loader.getData('music', 'harmonic_patterns.json');
            if (!data) throw new Error("No data returned from CodexLoader");
            this.harmonicPatterns = data.patterns;
            SafeLogger.message("ThemeGenerator: Harmonic patterns loaded.");
        } catch (e) {
            SafeLogger.warn("ThemeGenerator: Failed to load harmonic_patterns.json via Codex.", e);
        }
    }

    async _loadBassPatterns() {
        try {
            const loader = this.music.codex || CodexLoader;
            const data = await loader.getData('music', 'basspatterns.json');
            if (!data) throw new Error("No data returned from CodexLoader");
            this.bassPatterns = data.patterns;
            SafeLogger.message("ThemeGenerator: Bass patterns loaded.");
        } catch (e) {
            SafeLogger.warn("ThemeGenerator: Failed to load bass patterns via Codex.", e);
        }
    }

    _parseNoteFromFilename(filename) {
        if (!filename) return null;
        // Search for patterns like (C2), _G#3, -a#4, Bb5
        const regex = /[\(_\- ]([A-G][#b]?\d)[\)\._\- ]/i;
        const match = filename.match(regex);
        if (match) {
            let note = match[1].toUpperCase();
            // Standardize: ensure # is before digit, if any
            return note;
        }
        return null;
    }

    _getInstrumentForRole(role, geo, usedInstruments = new Set()) {
        if (!this.synth) return 'Piano';
        let palette = this.instrumentPalette[role];

        // Smarter fallback
        if (!palette || palette.length === 0) {
            const drumRoles = ['kick', 'snare', 'hat', 'perc'];
            if (drumRoles.includes(role)) {
                // If specific drum missing, try general perc
                palette = this.instrumentPalette.perc;
                if (!palette || palette.length === 0) {
                    // Ultimate fallback for drums: hardcoded synthetic IDs
                    const syntheticDrumFallback = {
                        'kick': 'Drum_Kick',
                        'snare': 'Drum_Snare',
                        'hat': 'Drum_HiHat_Closed',
                        'perc': 'Drum_Cowbell'
                    };
                    return syntheticDrumFallback[role] || 'Drum_Cowbell';
                }
            }
        }

        if (palette && palette.length > 0) {
            const rng = new MusicRNG(geo?.name || role);

            // Smart filtering by octave if available
            const targetOctave = geo?.Octave !== undefined ? geo.Octave : 4;

            // Try to find samples that match the target octave in their name (e.g. _c4, _a2)
            let candidates = palette;
            const getMatches = (oct) => {
                const patterns = [`_c${oct}`, `_a${oct}`, `_e${oct}`, `_g${oct}`, `_d${oct}`, `_f${oct}`, `_b${oct}`];
                return palette.filter(inst => {
                    const lowerInst = inst.toLowerCase();
                    return patterns.some(p => lowerInst.includes(p));
                });
            };

            const exactMatches = getMatches(targetOctave);

            if (exactMatches.length > 0) {
                candidates = exactMatches;
            } else {
                // Best Fit: Look for nearby octaves (+/- 1 then +/- 2)
                for (let offset = 1; offset <= 2; offset++) {
                    const nearby = [...getMatches(targetOctave - offset), ...getMatches(targetOctave + offset)];
                    if (nearby.length > 0) {
                        candidates = nearby;
                        break;
                    }
                }
            }

            const available = candidates.filter(inst => !usedInstruments.has(inst));
            const pool = available.length > 0 ? available : candidates;
            const instrument = rng.pick(pool);
            usedInstruments.add(instrument);
            return instrument;
        }

        // Procedural Fallback: Generate a unique synthetic ID for this character/role
        const seedName = geo?.name || 'Anonymous';
        const cleanName = seedName.replace(/[^a-zA-Z0-9]/g, '');
        return `Voice_${cleanName}_${role}`;
    }

    _getProceduralInstrument(category, seed) {
        const rng = new MusicRNG(seed);
        let palette = this.instrumentPalette[category];

        // Fallback for drums
        if (!palette || palette.length === 0) {
            if (['kick', 'snare', 'hat'].includes(category)) {
                palette = this.instrumentPalette.perc;
            }
        }

        if (palette && palette.length > 0) return rng.pick(palette);
        
        // Ultimate hardcoded fallbacks if manifest is missing items
        const fallbacks = {
            'kick': 'Drum_Kick',
            'snare': 'Drum_Snare',
            'hat': 'Drum_HiHat_Closed',
            'perc': 'Drum_Cowbell',
            'bass': (() => {
                // Pick a random bass style if no samples available
                const basses = ['Bass_Sub808', 'Bass_Reese', 'Bass_Moog', 'Bass_Acid', 'Bass_Pluck', 'Synth_Bass'];
                // Use seed to pick consistently for the same character
                let hash = 0;
                for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
                return basses[Math.abs(hash) % basses.length];
            })(),
            'lead': 'Synth_Lead',
            'pad': 'Synth_Pad',
            'rhythm': 'Piano'
        };

        SafeLogger.warn(`ThemeGenerator: No procedural sample found for category ${category}. Using synthetic fallback.`);
        return fallbacks[category] || 'Piano';
    }

    async _ensureInstrumentDefined(instrumentId, aliasId = null, forceEnvelope = null, geoParams = {}) {
        const targetId = aliasId || instrumentId;
        if (!this.synth || this.synth.instrumentEngine.instruments.has(targetId)) return;

        const data = this.manifestManager.manifest.samples[instrumentId];

        const lowerKey = instrumentId.toLowerCase();
        let role = 'lead';
        const drumRoles = ['kick', 'snare', 'hat', 'perc'];

        if (lowerKey.includes('bass')) role = 'bass';
        else if (lowerKey.includes('pad') || lowerKey.includes('atmos') || lowerKey.includes('texture') || lowerKey.includes('string')) role = 'pad';
        else if (lowerKey.includes('kick')) role = 'kick';
        else if (lowerKey.includes('snare')) role = 'snare';
        else if (lowerKey.includes('hat')) role = 'hat';
        else if (lowerKey.includes('perc')) role = 'perc';

        let envelope = forceEnvelope || (role === 'pad' ? 'sustained' : 'percussive');
        const depth = geoParams.chi > 7 ? 'full' : 'high';

        // THEME: Samples are treated as sources for High-Fidelity Synthetic Instruments
        if (data || instrumentId.includes('/')) {
            // 1. Ensure sample is loaded first
            if (!this.synth.instrumentEngine.samples.has(instrumentId)) {
                const url = this.manifestManager.getAssetPath('samples', instrumentId);
                if (url) {
                    await this.music.loadSample(instrumentId, url);
                }
            }

            // 2. Create high-fidelity synthetic version from the sample
            if (this.synth.instrumentEngine.samples.has(instrumentId)) {
                // For loops, we keep the original sampler for timing accuracy
                const isLoop = lowerKey.includes('loop') || lowerKey.includes('bpm');
                if (isLoop) {
                     this.synth.instrumentEngine.defineInstrument(targetId, {
                        type: 'sampler',
                        sampleId: instrumentId,
                        baseFreq: 440,
                        key: 'A4',
                        envelope: envelope,
                        role: role
                    });
                } else {
                    await this.synth.instrumentEngine.createSyntheticInstrument(instrumentId, targetId, depth, envelope, role);
                }
                return;
            }
        }

        // Fallback to purely algorithmic synthetic
        await this.synth.instrumentEngine.createSyntheticInstrument(instrumentId, targetId, depth, envelope, role);
    }

    _getInstrumentFromGeometry(geo, usedInstruments = new Set()) {
        let octave = geo.Octave !== undefined ? geo.Octave : 4;
        const chi = geo.Chi || 5;
        let role = 'lead';
        if (chi > 7 || octave <= 3) role = 'bass';
        else if (octave >= 6) role = 'lead';
        else if (chi < 4) role = 'rhythm';
        else role = 'pad';

        const instrument = this._getInstrumentForRole(role, { ...geo, Octave: octave }, usedInstruments);
        
        return { instrument: instrument, role: role, chi: chi };
    }

    ensureGeometry(source) {
        if (!source) return null;
        if (source.geometry && source.geometry.GeoHarmonics) return source;
        if (!this.geometry) {
            SafeLogger.warn("ThemeGenerator: Geometry module missing.");
            return source;
        }
        const geo = this.geometry.calculateFullGeo(source.name);
        return { ...source, geometry: geo };
    }

    async createMainTheme(activeComponents, gameEngine, forceRegeneration, tensionLevel = 2) {
        if (!this.synth) return null;
        SafeLogger.message("ThemeGenerator: Assembling Virtual Band for Main Theme...");

        // Yield to main thread to prevent UI freeze
        await new Promise(r => setTimeout(r, 0));

        const band = new VirtualBand(this);
        band.tensionLevel = tensionLevel;
        
        // Add components to band
        for (const comp of activeComponents) {
            await band.addMember(comp);
        }

        band.balanceRoles();
        
        // Fallback if empty
        if (band.members.length === 0 && gameEngine) {
             if (gameEngine.playerCharacter) await band.addMember(gameEngine.playerCharacter);
             if (gameEngine.playerShip) await band.addMember(gameEngine.playerShip);
        }

        // Generate Progression if needed
        if (!this.currentProgression || forceRegeneration) {
            // Use conductor's key
            const baseFreq = band.baseFreq || 261.63;
            this.currentProgression = this._generateProgression(baseFreq, band.stepsPerBar);
        }
        
        band.setProgression(this.currentProgression);
        
        return await band.generateTrack('Main Theme');
    }

    async createWormholeRacersTheme() {
        if (!this.synth) return null;
        SafeLogger.message("ThemeGenerator: Assembling band for 'Wormhole Racers Theme'...");

        const band = new VirtualBand(this);
        band.bpm = 160; // Fast tempo

        // Create virtual artists for a synth-heavy, driving theme
        await band.addMember({ name: 'Arp Bass', type: 'Component', geometry: { Chi: 8 } }); // Bass role
        await band.addMember({ name: 'Racing Lead', type: 'Component', geometry: { GeometryNumber: 1, Chi: 6 } }); // Lead role
        await band.addMember({ name: 'Stab Chords', type: 'Component', geometry: { GeometryNumber: 7 } }); // Rhythm/Groove role
        await band.addMember({ name: 'Glitch Pad', type: 'Component', geometry: { GeometryNumber: 13 } }); // Eccentric/Support role
        await band.addDrummer({ name: 'Racer Drums', kitType: 'Electronic' });

        // Use a simple, driving progression
        const progression = this._generateProgression(band.baseFreq, 16, ['I', 'I', 'IV', 'V']);
        band.setProgression(progression);

        return await band.generateTrack('Wormhole Racers Theme', 16);
    }

    async createT13NETheme() {
        if (!this.synth) return null;
        SafeLogger.message("ThemeGenerator: Assembling orchestra for 'T13NE Theme'...");

        const band = new VirtualBand(this);
        band.bpm = 90; // Slower, more epic tempo

        // Create virtual artists from the engine name for an orchestral feel
        await band.addMember({ name: 'Terminal', type: 'Component', geometry: { GeometryNumber: 9 } }); // Bass/Groove
        await band.addMember({ name: 'Thirteen', type: 'Component', geometry: { GeometryNumber: 13 } }); // Eccentric
        await band.addMember({ name: 'Narrative', type: 'Component', geometry: { GeometryNumber: 2 } }); // Support
        await band.addMember({ name: 'Engine', type: 'Component', geometry: { GeometryNumber: 1 } }); // Lead
        await band.addDrummer({ name: 'Orchestral Percussion', kitType: 'Orchestral' });

        const progression = this._generateProgression(band.baseFreq, 32, ['I', 'V', 'vi', 'IV']);
        band.setProgression(progression);

        return await band.generateTrack('Terminal Thirteen Narrative Game Engine Theme', 8);
    }

    async createWormholeTheme(ship, originSystem, targetSystem) {
        if (!this.synth) return null;
        SafeLogger.message(`ThemeGenerator: Assembling Wormhole Band for ${ship.name}...`);

        const band = new VirtualBand(this);
        await band.assembleFromShip(ship);

        // Determine Target Key
        // Assuming system objects have geometry or we calculate it from name
        const targetGeo = this.ensureGeometry(targetSystem);
        const targetKeyData = this.geometry.getKey(targetGeo.geometry.GeoHarmonics.key);

        band.generateWormholeProgression(targetKeyData);
        
        return await band.generateTrack(`Wormhole: ${originSystem.name} to ${targetSystem.name}`);
    }

    async createPactTheme(pact) {
        if (!this.synth || !pact.members) return null;
        SafeLogger.message(`ThemeGenerator: Assembling Pact Band for ${pact.name}...`);

        const band = new VirtualBand(this);
        for (const member of pact.members) {
            await band.addMember(member);
        }

        // Pacts should have a stable progression based on the Pact's own geometry if available
        // For now, use conductor (leader)
        const baseFreq = band.baseFreq;
        band.setProgression(this._generateProgression(baseFreq, 16));

        return await band.generateTrack(`${pact.name} Theme`);
    }

    checkRouteStability(originSystem, targetSystem) {
        // Check if a valid musical progression exists between the two systems
        if (!this.geometry) return 0;
        const oGeo = this.ensureGeometry(originSystem);
        const tGeo = this.ensureGeometry(targetSystem);
        
        const oKey = this.geometry.getKey(oGeo.geometry.GeoHarmonics.key);
        const tKey = this.geometry.getKey(tGeo.geometry.GeoHarmonics.key);

        // Simple check: Are they harmonically compatible?
        // For now, return 1.0 (stable) to allow travel, but this is where 
        // circle of fifths logic would restrict routes.
        // e.g. if Math.abs(oKey.index - tKey.index) > 2 return 0.5 (Unstable)
        return 1.0; 
    }

    async _generateTrackFromBand(band, name, measures = 8) {
        // Replaces old createMainTheme logic but uses band properties
        let progression = band.progression;
        const conductor = band.conductor;

        // EXPAND PROGRESSION INTO SONG STRUCTURE (Verse-Chorus-Bridge)
        // If the provided progression is short (e.g. <= 8 bars), we assume it's a loop/motif 
        // and we want to build a song structure around it.
        if (progression && progression.length <= 8) {
             const verse = progression.map(c => ({...c, section: 'Verse'}));
             
             // Generate Chorus (different progression)
             const chorusProg = this._generateProgression(band.baseFreq, band.stepsPerBar);
             const chorus = chorusProg.map(c => ({...c, section: 'Chorus'}));
             
             // Generate Bridge
             const bridgeProg = this._generateProgression(band.baseFreq, band.stepsPerBar);
             const bridge = bridgeProg.map(c => ({...c, section: 'Bridge'}));
             
             const newProgression = [];
             
             // Structure: A A B A B C B B
             newProgression.push(...verse); // Verse 1
             newProgression.push(...verse); // Verse 2
             newProgression.push(...chorus); // Chorus 1
             newProgression.push(...verse); // Verse 3
             newProgression.push(...chorus); // Chorus 2
             newProgression.push(...bridge); // Bridge
             newProgression.push(...chorus); // Chorus 3
             newProgression.push(...chorus); // Outro
             
             progression = newProgression;
        } else if (progression) {
            // Tag existing long progression as 'Verse' by default if not tagged
            progression = progression.map(c => ({...c, section: c.section || 'Verse'}));
        }
        
        // Ensure drum patterns are loaded
        if (!this.drumPatterns || Object.keys(this.drumPatterns).length === 0) {
             // This is async in original, but we are deep in sync call now. 
             // Ideally patterns are preloaded. Assuming they are or we skip.
        }

        const seedString = band.members.map(m => m.name).join('|');
        const rng = new MusicRNG(seedString);

        // Rhythm
        const rhythmSeed = rng.next();
        const stepsPerBar = band.stepsPerBar;
        const trackMeasures = progression.length > 0 ? progression.length : measures;
        const totalSteps = trackMeasures * stepsPerBar;
        
        // Use conductor for rhythm generation base
        const rhythmEntity = conductor ? conductor.entity : { name: 'default' };
        const rhythm = this._generateRhythm(rhythmEntity, progression, stepsPerBar, rhythmSeed, trackMeasures);

        const bpm = band.bpm;
        const beatTime = 60 / bpm;
        const voices = [];
        
        // Generate Drums for each drummer
        // If no drummers, create a default one from the conductor/rhythmEntity
        if (band.drummers.length === 0) {
            const defaultDrummer = new VirtualDrummer(rhythmEntity || { name: 'Default Drummer' }, this);
            // We don't await prepare here to avoid async issues in this sync-ish flow, 
            // but ideally we should. For now, rely on lazy loading or previous ensures.
            band.drummers.push(defaultDrummer);
        }

        // Yield before processing drummers
        await new Promise(r => setTimeout(r, 0));

        for (let dIndex = 0; dIndex < band.drummers.length; dIndex++) {
            const drummer = band.drummers[dIndex];
            const drumPart = this._generateDrumPart(drummer, progression, stepsPerBar, trackMeasures, rng);
            
            // Merge drum voices
            for (const dv of drumPart.voices) {
                // Ensure loop instruments are defined (pre-prepared kit pieces already are)
                if (dv.id === 'v_drum_loop') {
                    await this._ensureInstrumentDefined(dv.instrument);
                }

                // Unique ID per drummer to allow multiple kits
                const uniqueId = `${dv.id}_${dIndex}`;
                voices.push({
                    ...dv,
                    id: uniqueId,
                    name: `${drummer.name} ${dv.name}`,
                    loopLength: drumPart.totalSteps
                });
            }
        }

        // PRE-ASSIGN ROLES FOR COHERENCE
        const assignedRoles = [];
        let bassAssigned = false;
        let leadAssigned = false;
        let leadsCount = 0;

        band.members.forEach((artist, idx) => {
            let role = artist.personality;
            if (!bassAssigned && (artist.role === 'bass' || artist.personality === 'groove' || artist.personality === 'support')) {
                role = 'bass';
                bassAssigned = true;
            } else if (artist.personality === 'lead' || artist.role === 'lead') {
                if (!leadAssigned) {
                    role = 'lead';
                    leadAssigned = true;
                    leadsCount++;
                } else {
                    role = 'solo';
                    leadsCount++;
                }
            } else if (artist.role === 'rhythm' || artist.personality === 'support') {
                role = 'rhythm';
            }
            assignedRoles[idx] = role;
        });

        // Ensure at least one bass if possible
        if (!bassAssigned && band.members.length > 0) {
            assignedRoles[0] = 'bass';
            bassAssigned = true;
        }

        // Pre-calculate which lead owns which measure for coordination
        const leadMeasures = new Map();
        if (leadsCount > 0) {
            for (let m = 0; m < trackMeasures; m++) {
                const leadOwnerIdx = Math.floor(m / 2) % leadsCount;
                let currentLead = 0;
                assignedRoles.forEach((r, artistIdx) => {
                    if (r === 'lead' || r === 'solo') {
                        if (currentLead === leadOwnerIdx) leadMeasures.set(m, artistIdx);
                        currentLead++;
                    }
                });
            }
        }

        // Limit active background layers to prevent chaos
        const maxBackgroundLayers = 3;
        let backgroundCount = 0;
        // Prioritize: Bass -> Rhythm -> Arp -> Pad
        const priorityOrder = ['bass', 'groove', 'rhythm', 'arpeggiator', 'support', 'pad', 'cascading', 'syncopated'];
        const getPriority = (role) => {
            const idx = priorityOrder.indexOf(role);
            return idx === -1 ? 99 : idx;
        };

        const bandContext = {
            baseFreq: band.baseFreq,
            beatTime: beatTime,
            rhythm: rhythm,
            progression: progression,
            rng: rng,
            tensionLevel: band.tensionLevel || 2,
            activeLeads: leadsCount,
            leadMeasures: leadMeasures,
            artistIndex: 0,
            stepsPerBar: stepsPerBar,
            conductor: conductor
        };

        // Process members asynchronously to avoid frame drops
        for (let index = 0; index < band.members.length; index++) {
            const artist = band.members[index];
            const role = assignedRoles[index];
            bandContext.artistIndex = index;

            // Skip if we have too many background layers and this isn't a lead/solo
            if (role !== 'lead' && role !== 'solo' && role !== 'bass') {
                if (backgroundCount >= maxBackgroundLayers) {
                    continue;
                }
                backgroundCount++;
            }

            // Use global steps for loop length to ensure synchronization, pass local meter preference to generator
            const artistStepsPerBar = band.polyrhythms.get(artist.name) || stepsPerBar;
            const totalArtistSteps = totalSteps; // Force lock to global track length

            // Use artist's instrument
            const instrument = artist.instrumentId;
            const voiceId = `v_${artist.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
            
            // Pass the artist's preferred meter to the generator
            const events = this._generateArtistPart(artist, { ...bandContext, artistStepsPerBar }, voiceId, role);

            if (events.length > 0) {
                voices.push({
                    id: voiceId,
                    name: `${artist.name} (${artist.personality})`,
                    instrument: instrument,
                    sequence: events,
                    mute: false,
                    isDrum: false,
                    loopLength: totalArtistSteps // Ensure all voices loop with the track
                });
            }
            
            // Yield every few members
            if (index % 2 === 0) await new Promise(r => setTimeout(r, 0));
        }

        voices.forEach(v => {
            if (!v.isDrum && (v.id.includes('kick') || v.id.includes('snare') || v.id.includes('hat') || v.id.includes('perc') || v.id.includes('ride') || v.id.includes('crash'))) {
                v.isDrum = true;
            }
            // Removed manual loop unrolling as T13NE_Music now handles loopLength
        });

        return {
            name: name,
            bpm: bpm,
            timeSignature: rhythm.timeSignature,
            measures: trackMeasures,
            totalSteps: totalSteps,
            patternLength: stepsPerBar,
            voices: voices
        };
    }

    _generateDrumPart(drummer, progression, globalStepsPerBar, measures, rng) {
        // High Tension / Complexity: Try to find a matching Drum Loop first
        const tensionLevel = drummer.generator.music.lastTension;
        const bpm = drummer.generator.music.currentTrack?.bpm || 120;

        if (tensionLevel >= 6 && drummer.generator.instrumentPalette.loop_drum.length > 0 && rng.next() > 0.5) {
             const loops = drummer.generator.instrumentPalette.loop_drum;
             // Try to find a loop with matching BPM in name
             const matchingBpm = loops.filter(l => l.includes(bpm.toString()));
             const pool = matchingBpm.length > 0 ? matchingBpm : loops;
             const loopId = rng.pick(pool);

             if (loopId) {
                 SafeLogger.message(`VirtualDrummer ${drummer.name}: Using full drum loop sample '${loopId}'`);
                 return {
                     voices: [{
                         id: 'v_drum_loop',
                         name: 'Drum Loop',
                         instrument: loopId,
                         sequence: [{ step: 0, freq: 440, duration: measures * globalStepsPerBar / 4, velocity: 0.9 }],
                         mute: false,
                         isDrum: true,
                         loopLength: measures * globalStepsPerBar
                     }],
                     totalSteps: measures * globalStepsPerBar
                 };
             }
        }

        const voices = [];
        const events = [];
        
        // Use the pre-prepared kit from the drummer instance
        const kit = drummer.kit;

        // Polyrhythm check
        const drummerStepsPerBar = drummer.stepsPerBar || globalStepsPerBar;
        const totalSteps = measures * drummerStepsPerBar;

        // Base pattern generation (reuse existing logic but adapted)
        // We generate a base rhythm for the drummer's time signature
        const baseRhythm = this._generateRhythm(drummer.entity, progression, drummerStepsPerBar, rng.next(), measures);
        
        // Apply dynamic states per measure
        for (let m = 0; m < measures; m++) {
            const measureStartStep = m * drummerStepsPerBar;
            const isFill = (m + 1) % 4 === 0; // Natural phrase end
            
            let state = 'groove';
            const roll = rng.next();
            
            if (drummer.dropOutChance > roll) state = 'rest';
            else if (drummer.soloChance > roll) state = 'solo';
            else if (isFill && drummer.fillFrequency > rng.next()) state = 'fill';

            if (state === 'rest') continue;

            // Extract events for this measure from base rhythm
            const measureEvents = baseRhythm.events.filter(e => e.step >= measureStartStep && e.step < measureStartStep + drummerStepsPerBar);

            if (state === 'groove') {
                events.push(...measureEvents);
            } else if (state === 'fill') {
                // Keep first half of groove, fill second half
                const halfBar = measureStartStep + (drummerStepsPerBar / 2);
                events.push(...measureEvents.filter(e => e.step < halfBar));
                
                // Generate fill
                const fillSteps = drummerStepsPerBar / 2;
                for (let i = 0; i < fillSteps; i++) {
                    const step = halfBar + i;
                    // Simple roll logic
                    const inst = i % 2 === 0 ? 'snare' : (i % 4 === 0 ? 'tom_l' : 'tom_h');
                    events.push({ voice: inst, step: step, freq: 200, duration: 0.1, velocity: 0.8 + (i/fillSteps)*0.2 });
                }
                // Crash on 1 of next bar (handled by next iteration or post-loop)
            } else if (state === 'solo') {
                // Generate wild solo
                for (let i = 0; i < drummerStepsPerBar; i++) {
                    if (rng.next() > 0.3) { // Density
                        const insts = ['snare', 'kick', 'tom_h', 'tom_l', 'crash'];
                        const inst = rng.pick(insts);
                        events.push({ voice: inst, step: measureStartStep + i, freq: 200, duration: 0.1, velocity: 0.7 + rng.next() * 0.3 });
                    }
                }
            }
        }

        // Map events to voices
        const voiceMap = new Map();

        // Ensure core kit voices always exist to avoid "single drum" feel even if pattern is sparse
        ['kick', 'snare', 'hat'].forEach(k => {
            if (kit[k]) {
                voiceMap.set(k, {
                    id: k,
                    name: k,
                    instrument: kit[k],
                    sequence: [],
                    mute: false,
                    isDrum: true,
                    loopLength: totalSteps
                });
            }
        });

        events.forEach(evt => {
            // Map v_kick etc from _generateRhythm to local kit keys if needed
            let kitKey = evt.voice.replace('v_', '');
            if (!kit[kitKey]) kitKey = 'perc'; // Fallback

            if (!voiceMap.has(kitKey)) {
                voiceMap.set(kitKey, {
                    id: kitKey,
                    name: kitKey,
                    instrument: kit[kitKey],
                    sequence: [],
                    mute: false,
                    isDrum: true,
                    loopLength: totalSteps
                });
            }
            voiceMap.get(kitKey).sequence.push(evt);
        });

        return {
            voices: Array.from(voiceMap.values()),
            totalSteps: totalSteps
        };
    }

    _generateArtistPart(artist, context, voiceId, roleOverride = null) {
        const { personality } = artist;
        const { rhythm, progression, baseFreq, beatTime, rng, tensionLevel, activeLeads, leadMeasures, artistIndex, artistStepsPerBar } = context;
        let events = [];

        // NEW: Check for MIDI motif first
        if (artist.midiMotif) {
            SafeLogger.message(`Artist ${artist.name} is using an assimilated MIDI motif.`);
            events = this._midiMotifToHarmonizedEvents(artist.midiMotif, voiceId, beatTime, progression, baseFreq);
            return events;
        }

        let playStyle = roleOverride || personality;

        // Check if artist is "distant" from the band's base frequency
        const bandBaseFreq = context.baseFreq;
        const artistBaseFreq = artist.keyData.Frequency;
        const ratio = artistBaseFreq / bandBaseFreq;
        const semitoneDiff = Math.abs(12 * Math.log2(ratio));
        
        // Refined Harmonic Distance: Check for dissonance against the root
        // Dissonant intervals: m2(1), M2(2), Tritone(6), m7(10), M7(11)
        const pitchClass = Math.round(semitoneDiff) % 12;
        const isDissonant = [1, 2, 6, 10, 11].includes(pitchClass);

        // Octave Distance: Check if wildly different octave (> 2.5 octaves)
        const octaveDiff = Math.abs(Math.log2(ratio));
        const isOctaveDistant = octaveDiff > 2.5;

        if ((isDissonant || isOctaveDistant) && playStyle !== 'bass') {
            // Distant/Dissonant voices focus on accents only (On Beat)
            playStyle = 'accent_specialist';
            SafeLogger.message(`Artist ${artist.name} forced to accent_specialist (Dissonant: ${isDissonant}, High/Low: ${isOctaveDistant})`);
        }

        if (playStyle === 'accent_specialist') {
            // Just return empty, the ensemble accent logic below will handle it
            events = [];
        } else if (playStyle === 'bass') {
            const titleRhythm = this._getSyllableRhythm(context.conductor?.name);
            events = this._generateBassline(rhythm, artist.entity, progression, baseFreq / 4, beatTime, artist.geoNum, tensionLevel, titleRhythm);
        } else if (playStyle === 'lead' || playStyle === 'solo') {
            const motif = this.getCharacterComposition(artist);
            if (motif) {
                const isSolo = playStyle === 'solo';
                events = this._motifToHarmonizedEvents(motif, voiceId, beatTime, progression, baseFreq, isSolo, tensionLevel);

                // Lead Trading Logic (Conversation)
                if (activeLeads > 1) {
                    const stepsPerBar = context.stepsPerBar || 16;
                    events = events.filter(e => {
                        const measure = Math.floor(e.step / stepsPerBar);
                        const owner = leadMeasures.get(measure);
                        return owner === artistIndex;
                    });
                }
            }
        } else if (artist.role === 'percussion' || artist.role === 'perc') {
            // Percussionist Logic: Generate a rhythmic pattern on a single instrument
            // We use the rhythm generator but force the voice to be the artist's instrument
            const percRhythm = this._generateRhythm(artist.entity, progression, this.music.currentTrack ? this.music.currentTrack.patternLength : 16, rng.next(), progression.length);
            
            // Filter for interesting rhythmic events (snares/percs) from the generated pattern
            // and map them to this artist's single instrument
            percRhythm.events.forEach(e => {
                if (e.voice === 'v_snare' || e.voice === 'v_perc' || (e.voice === 'v_hat' && rng.next() > 0.5)) {
                    // Ensure tonal percussion follows the chord progression if possible
                    let freq = artist.keyData.Frequency || 261.63;
                    // Find current chord to tune percussion if it's tonal
                    const currentChord = progression.find(c => {
                        // Approximate chord finding based on step (simplified)
                        // Ideally we'd map e.step to chord index, but for now use baseFreq
                        return false; 
                    });
                    
                    // Use band base frequency for tonal percussion to ensure it's in key
                    // or a fixed ratio of it (e.g. 0.5 for low tom)
                    const percFreq = (artist.keyData.Frequency && artist.keyData.Frequency < 1000) 
                        ? context.baseFreq * (artist.keyData.Frequency / 261.63) // Maintain relative pitch ratio
                        : artist.keyData.Frequency;

                    events.push({
                        voice: voiceId,
                        step: e.step,
                        freq: percFreq || 261.63, 
                        duration: 0.1,
                        velocity: e.velocity
                    });
                }
            });
        } else if (playStyle === 'support' || playStyle === 'rhythm') {
            const h = this._generateHarmonics(rhythm, artist.entity, progression, baseFreq, tensionLevel);
            const isPad = artist.instrumentId.toLowerCase().includes('pad') || artist.instrumentId.toLowerCase().includes('string');
            events = isPad ? h.pad : h.guitar;
            events.forEach(e => e.voice = voiceId);
        } else if (playStyle === 'arpeggiator') {
            events = this._generateArpeggio(rhythm, progression, baseFreq, beatTime, 'up');
            events.forEach(e => e.voice = voiceId);
        } else if (playStyle === 'cascading') {
            events = this._generateArpeggio(rhythm, progression, baseFreq, beatTime, 'down');
            events.forEach(e => e.voice = voiceId);
        } else if (playStyle === 'groove') {
            const h = this._generateHarmonics(rhythm, artist.entity, progression, baseFreq, tensionLevel);
            events = h.guitar;
            events.forEach(e => e.voice = voiceId);
        } else if (playStyle === 'syncopated') {
            let currentStepOffset = 0;
            progression.forEach(chord => {
                const stepsInChord = chord.durationSteps;
                const currentRootFreq = chord.keyFreq || baseFreq;
                // Use chord tones (3rd or 5th) one octave up for visibility
                const interval = chord.intervals.length > 1 ? chord.intervals[1] : chord.intervals[0];
                // Interval is absolute offset.
                const freq = currentRootFreq * Math.pow(2, (interval + 12) / 12);
                
                // Reduced Syncopation: Use a more structured clave-like pattern instead of random off-beats
                // Standard Son Clave (3-2) approximation in 16th notes: 0, 3, 6, 10, 12
                // This includes the downbeat (0) to keep it grounded.
                // Vary pattern slightly based on artist index to avoid phasing
                const pattern = [0, 3, 6, 10, 12]; 
                
                for (let s = 0; s < stepsInChord; s++) {
                    if (pattern.includes(s % 16) && rng.next() > 0.3) {
                        events.push({ voice: voiceId, step: currentStepOffset + s, freq: freq, duration: 0.15, velocity: 0.7 });
                    }
                }
                currentStepOffset += stepsInChord;
            });
        } else {
             const h = this._generateHarmonics(rhythm, artist.entity, progression, baseFreq, tensionLevel);
             events = h.guitar;
             events.forEach(e => e.voice = voiceId);
        }

        // Polyrhythm / Polymeter Handling
        // If the artist has a different meter (artistStepsPerBar), we mask the events
        // to create a cross-rhythm feel without breaking the loop.
        if (artistStepsPerBar && artistStepsPerBar !== context.stepsPerBar) {
            // Filter events to emphasize the artist's meter
            // e.g. if 3/4 (12 steps) over 4/4 (16 steps), accent every 12th step
            events.forEach(e => {
                const localStep = e.step % artistStepsPerBar;
                if (localStep === 0) {
                    e.velocity *= 1.2; // Accent the '1' of the polyrhythm
                } else if (e.step % context.stepsPerBar === 0) {
                    // Also keep the global '1' strong to anchor it
                    e.velocity *= 1.1; 
                }
            });
        }

        // Space-making pass (Conversation)
        const stepsPerBar = context.stepsPerBar || 16;
        events.forEach(e => {
            const measure = Math.floor(e.step / stepsPerBar);
            const owner = leadMeasures.get(measure);
            if (owner !== undefined && owner !== artistIndex) {
                // Not leading this bar.
                if (playStyle === 'bass') {
                    // Bass keeps the groove but slightly quieter
                    e.velocity *= 0.9;
                } else if (playStyle === 'lead' || playStyle === 'solo') {
                    // This artist is a lead but not currently "speaking"
                    e.mute = true;
                } else {
                    // Supporting role: reduce density
                    e.velocity *= 0.7;
                    if (rng.next() > 0.5) e.mute = true;
                }
            }
        });
        events = events.filter(e => !e.mute);

        // Ensemble Coordination: Add harmonious accents on chord changes
        const isAccentSpecialist = playStyle === 'accent_specialist';
        const accentChance = isAccentSpecialist ? 0.8 : (0.3 + (tensionLevel / 20));

        if (rng.next() < accentChance) {
            let stepAcc = 0;
            progression.forEach(chord => {
                const stepsInChord = chord.durationSteps;
                // Add a coordinated accent hit on the first beat of the chord change
                const currentRootFreq = chord.keyFreq || baseFreq;

                // Use the artist's natural octave for their accent
                const artistOctave = artist.keyData.KeyNo || 4;
                const octaveShift = (artistOctave - 4) * 12;

                const freq = currentRootFreq * Math.pow(2, (chord.rootOffset + octaveShift) / 12);

                // Don't duplicate if a note already exists exactly at this step
                if (!events.some(e => e.step === stepAcc)) {
                    events.push({
                        voice: voiceId,
                        step: stepAcc,
                        freq: freq,
                        duration: isAccentSpecialist ? 0.4 : 0.2,
                        velocity: isAccentSpecialist ? 0.7 : 0.9,
                        isAccent: true
                    });
                }
                stepAcc += stepsInChord;
            });
        }

        return events;
    }

    _generateArpeggio(rhythm, progression, keyRootFreq, beatTime, direction = 'up') {
        const events = [];
        let currentStepOffset = 0;
        
        progression.forEach(chord => {
            const stepsInChord = chord.durationSteps;
            const currentRootFreq = chord.keyFreq || keyRootFreq;
            
            // Get chord tones (frequencies) spanning 2 octaves
            let tones = [];
            const baseIntervals = chord.intervals; // e.g. [0, 4, 7]
            
            [0, 1].forEach(oct => {
                baseIntervals.forEach(interval => {
                    // Interval is absolute offset. Do not add rootOffset.
                    tones.push(currentRootFreq * Math.pow(2, (interval + (oct * 12)) / 12));
                });
            });
            
            if (direction === 'down') tones.reverse();

            // Generate 16th notes (1 step)
            // Reduce density: Play 8th notes (every 2 steps) instead of 16ths
            for (let i = 0; i < stepsInChord; i += 2) {
                const toneIndex = i % tones.length;
                const freq = tones[toneIndex];
                const velocity = (i % 4 === 0) ? 0.7 : 0.5; // Accent beats
                
                events.push({ voice: 'v_arp', step: currentStepOffset + i, freq: freq, duration: beatTime * 0.25, velocity: velocity });
            }
            
            currentStepOffset += stepsInChord;
        });
        return events;
    }

    _midiMotifToHarmonizedEvents(midiMotif, voiceId, beatTime, progression, globalBaseFreq) {
        // This is a complex task. A simple implementation:
        // 1. Find the lowest MIDI note in the motif to use as a relative root.
        // 2. For each note in the motif, calculate its interval from that root.
        // 3. For each step in our progression, transpose the motif so its root matches the chord root.
        const events = [];
        if (!midiMotif.length) return events;

        const baseMidiNote = midiMotif.reduce((min, note) => Math.min(min, note.midi), 127);
        let currentStep = 0;
        const totalProgressionSteps = progression.reduce((sum, chord) => sum + chord.durationSteps, 0);
        
        let chordIndex = 0;
        while (currentStep < totalProgressionSteps) {
            for (const note of midiMotif) {
                 if (currentStep >= totalProgressionSteps) break;

                // Find the current chord
                while (chordIndex < progression.length -1 && currentStep >= progression[chordIndex].durationSteps * (chordIndex + 1)) {
                    chordIndex++;
                }
                const activeChord = progression[chordIndex];
                const currentRootFreq = activeChord.keyFreq || globalBaseFreq;
                
                const midiInterval = note.midi - baseMidiNote;
                const chordRootInterval = activeChord.rootOffset;
                
                const finalInterval = chordRootInterval + midiInterval;
                const freq = currentRootFreq * Math.pow(2, finalInterval / 12);
                const duration = note.duration; // Assuming MIDI duration is in seconds
                
                events.push({ voice: voiceId, step: currentStep, freq: freq, duration: duration, velocity: note.velocity });
                currentStep += Math.ceil(duration / beatTime * 4); // Convert duration in seconds to steps
            }
        }
        return events;
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

    _motifToHarmonizedEvents(motif, voiceId, beatTime, progression, globalBaseFreq, isSolo = false, tensionLevel = 2) {
        const events = [];
        const rng = new MusicRNG(voiceId + tensionLevel);
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
                const currentRootFreq = activeChord.keyFreq || globalBaseFreq;
                
                // Quantize to scale to ensure togetherness
                // We assume a diatonic scale relative to the chord root
                const rawInterval = activeChord.rootOffset + note.interval;
                const octave = Math.floor(rawInterval / 12);
                const pitchClass = ((rawInterval % 12) + 12) % 12;
                
                // Simple Major Scale intervals for quantization: 0, 2, 4, 5, 7, 9, 11
                const scale = [0, 2, 4, 5, 7, 9, 11]; 
                const nearest = scale.reduce((prev, curr) => Math.abs(curr - pitchClass) < Math.abs(prev - pitchClass) ? curr : prev);
                
                const harmonizedPitch = (octave * 12) + nearest;
                const freq = currentRootFreq * Math.pow(2, harmonizedPitch / 12);
                const durationSteps = Math.ceil(note.duration * 4);

                // Tension-based filtering: lower tension means sparser notes
                const roll = rng.next();
                const densityThreshold = 0.3 + (tensionLevel / 11) * 0.7;
                if (roll > densityThreshold && !isSolo) {
                    // Sparse accents instead of full motif
                    if (rng.next() > 0.85) {
                        // Play a supportive accent hit (7th, 9th, or resonance)
                        const accentInterval = rng.pick([10, 14, 2, -5]);
                        const accentFreq = currentRootFreq * Math.pow(2, accentInterval / 12);
                        events.push({
                            voice: voiceId,
                            step: currentStep,
                            freq: accentFreq,
                            duration: 0.1,
                            velocity: 0.5
                        });
                    }
                    currentStep += durationSteps;
                    continue;
                }

                events.push({
                    voice: voiceId,
                    step: currentStep,
                    freq: freq,
                    duration: note.duration * beatTime,
                    velocity: isSolo ? 0.9 : 0.7
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

    /**
     * Converts a phrase into a rhythmic pattern of durations.
     * Long vowels or multi-syllable words get varied durations.
     */
    _getSyllableRhythm(phrase) {
        if (!phrase) return [0.5, 0.5, 0.5, 0.5];
        const words = phrase.split(/[^a-zA-Z]+/);
        const rhythm = [];

        words.forEach(word => {
            if (!word) return;
            const syllableCount = this._countSyllables(word);

            // Map syllables to durations
            // Short words/syllables: 0.25 or 0.5
            // Long words or stressed syllables: 1.0
            for (let i = 0; i < syllableCount; i++) {
                if (word.length > 6 && i === 0) {
                    rhythm.push(1.0); // Emphasis on first syllable of long words
                } else if (syllableCount === 1) {
                    rhythm.push(0.5);
                } else {
                    rhythm.push(0.25);
                }
            }
        });

        return rhythm.length > 0 ? rhythm : [0.5, 0.5, 0.5, 0.5];
    }

    _generateRhythm(ship = null, progression = [], stepsPerBar = 16, seed = null, minMeasures = 4) {
        const name = ship ? ship.name : 'default';
        const rng = new MusicRNG(seed || name);
        const targetBeats = this._countSyllablesInPhrase(name);

        const getPattern = (targetLength = null) => {
            if (!this.drumPatterns || Object.keys(this.drumPatterns).length === 0) {
                 return {
                    name: 'Default',
                    style: 'Electronic',
                    length: targetLength || 16,
                    timeSignature: [4, 4],
                    tracks: {
                        kick: [0, 8],
                        snare: [4, 12],
                        hat: [0, 2, 4, 6, 8, 10, 12, 14]
                    }
                };
            }
            const targetGenre = ship ? (ship.origin === 'Core' ? "6" : "3") : "3";
            const targetEra = ship ? (ship.techLevel > 5 ? "3" : "2") : "2";
            let matchingKeys = Object.keys(this.drumPatterns).filter(k => {
                const p = this.drumPatterns[k];
                const tsNumerator = p.timeSignature ? p.timeSignature[0] : 4;
                
                // If a target length is specified (e.g. 16 steps), filter for it.
                if (targetLength && (parseInt(p.length, 10) || 16) !== targetLength) return false;

                if (tsNumerator === targetBeats) return true;

                if (!p.tags) return false;
                return (p.tags.genres && p.tags.genres.includes(targetGenre)) || (p.tags.eras && p.tags.eras.includes(targetEra));
            });
        const pool = (matchingKeys.length > 0) ? matchingKeys : Object.keys(this.drumPatterns || {});
            const patternKey = rng.pick(pool);
        let p = patternKey ? this.drumPatterns[patternKey] : null;

        if (!p || !p.tracks) {
            p = {
                name: 'Fallback',
                style: 'Electronic',
                length: 16,
                timeSignature: [4, 4],
                tracks: {
                    kick: [0, 8],
                    snare: [4, 12],
                    hat: [0, 2, 4, 6, 8, 10, 12, 14]
                }
            };
        }
        return p;
        };

        let pattern = getPattern(stepsPerBar);
        let currentKeyFreq = null;
        let currentSection = null;
        
        const finalEvents = [];
        let currentStepOffset = 0;
        const sourceProgression = (progression && progression.length > 0) ? progression : [{ durationSteps: stepsPerBar }];
        const measuresToGenerate = Math.max(minMeasures, sourceProgression.length);

        for (let barIndex = 0; barIndex < measuresToGenerate; barIndex++) {
            const chord = sourceProgression[barIndex % sourceProgression.length];
            const oneBarEvents = [];
            const stepsInBar = chord.durationSteps || stepsPerBar;

            // Check for fill condition (end of 4-bar phrase)
            const isFill = (barIndex + 1) % 4 === 0 && barIndex > 0;

            // Change pattern on key change OR section change (Verse -> Chorus)
            if ((chord.keyFreq && chord.keyFreq !== currentKeyFreq) || (chord.section && chord.section !== currentSection)) {
                currentKeyFreq = chord.keyFreq;
                currentSection = chord.section;
                const newPattern = getPattern(stepsInBar);
                if (newPattern) pattern = newPattern;
            }

            if (pattern) {
                const tracks = pattern.tracks || {};
                const getTrack = (name) => tracks[Object.keys(tracks).find(k => k.toLowerCase() === name.toLowerCase())] || [];
                
                const kicks = getTrack('kick');
                const snares = getTrack('snare');
                const hats = getTrack('hat');

                if (kicks.length > 0 || snares.length > 0 || hats.length > 0) {
                    const patternLength = parseInt(pattern.length, 10) || 16;

                    // Loop the pattern to fill the entire duration of the bar (stepsInBar)
                    for (let i = 0; i < stepsInBar; i += patternLength) {
                        kicks.forEach(step => {
                            const s = parseInt(step, 10);
                            if (i + s < stepsInBar) {
                                oneBarEvents.push({ voice: 'v_kick', step: i + s, freq: 100, duration: 0.1, velocity: 0.9 });
                            }
                        });
                        snares.forEach(step => {
                            const s = parseInt(step, 10);
                            if (i + s < stepsInBar) {
                                oneBarEvents.push({ voice: 'v_snare', step: i + s, freq: 261.63, duration: 0.1, velocity: 0.8 });
                                // Add subtle ghost notes for snare realism
                                if (rng.next() > 0.7) {
                                    const ghostStep = (s + 2) % patternLength;
                                    if (i + ghostStep < stepsInBar) {
                                        oneBarEvents.push({ voice: 'v_snare', step: i + ghostStep, freq: 261.63, duration: 0.05, velocity: 0.3 });
                                    }
                                }
                            }
                        });
                        hats.forEach(step => {
                            const s = parseInt(step, 10);
                            if (i + s < stepsInBar) {
                                oneBarEvents.push({ voice: 'v_hat', step: i + s, freq: 261.63, duration: 0.05, velocity: 0.65 });
                            }
                        });

                        // Add consistent 8th or 16th note hats if the pattern is sparse
                        if (hats.length < 4) {
                            for (let h = 0; h < patternLength; h += 2) {
                                if (!hats.includes(h) && i + h < stepsInBar) {
                                    oneBarEvents.push({ voice: 'v_hat', step: i + h, freq: 261.63, duration: 0.03, velocity: 0.4 });
                                }
                            }
                        }
                    }

                    if ((pattern.style === 'Rock' || pattern.style === 'Action') && barIndex % 4 === 0) {
                        oneBarEvents.push({ voice: 'v_crash', step: 0, freq: 100, duration: 1.5, velocity: 0.8 });
                    }
                }
            } 
            
            // Generate Fill if needed
            if (isFill) {
                const fillStartStep = stepsInBar - (stepsInBar / 4);
                const fillSteps = stepsInBar - fillStartStep;
                for (let i = 0; i < fillSteps; i++) {
                    const step = fillStartStep + i;
                    // Simple fill: snare roll or tom run
                    if (i % 2 === 0) {
                        oneBarEvents.push({ voice: 'v_snare', step: step, freq: 150, duration: 0.1, velocity: 0.8 + (i/fillSteps)*0.2 });
                    } else {
                        oneBarEvents.push({ voice: 'v_perc', step: step, freq: 200, duration: 0.1, velocity: 0.7 + (i/fillSteps)*0.2 });
                    }
                }
            }

            oneBarEvents.forEach(evt => {
                // Apply subtle velocity variation to ensure every event is unique.
                // This prevents audio engine optimizations/bugs from dropping identical repeated notes.
                const variation = 1.0 - (rng.next() * 0.15);
                finalEvents.push({ ...evt, step: currentStepOffset + evt.step, velocity: (evt.velocity || 0.9) * variation });
            });

            currentStepOffset += stepsInBar;
        }

        const stepsPerMeasure = pattern ? parseInt(pattern.length || 16, 10) : Math.max(16, targetBeats * 4);
        const timeSig = pattern ? (pattern.timeSignature || [4, 4]) : [stepsPerMeasure / 4, 4];

        return { events: finalEvents, style: pattern ? pattern.style : 'Electronic', timeSignature: timeSig, stepsPerMeasure: stepsPerMeasure, totalSteps: currentStepOffset };
    }

    _generateProgression(baseFreq, stepsPerBar = 16, specificProgression = null) {
        const progressions = [
            ['I', 'V', 'vi', 'IV'], ['I', 'vi', 'IV', 'V'], ['ii', 'V', 'I', 'vi'], ['vi', 'IV', 'I', 'V'], ['I', 'IV', 'V', 'IV']
        ];
        // Add more complex progressions with secondary dominants or modal interchange if possible
        // e.g. I -> III7 -> vi -> IV (Radiohead creep-ish)
        // For now, stick to diatonic for safety unless geometry provides RomanChords
        const romanChords = this.geometry && this.geometry.RomanChords ? this.geometry.RomanChords : [];
        if (!romanChords.length) return [{ rootOffset: 0, intervals: [0, 4, 7], durationSteps: 64 }];
        const rng = new MusicRNG(baseFreq || 261.63);
        
        let progChords = specificProgression;
        if (!progChords) {
            const sourceProgressions = (this.progressions && this.progressions.length > 0) ? this.progressions : progressions.map(p => ({ data: { Progression: p } }));
            const selectedItem = rng.pick(sourceProgressions);
            progChords = selectedItem.data ? selectedItem.data.Progression : selectedItem;
        }

        let lastNotes = null;
        return progChords.map(name => {
            const chordDef = romanChords.find(c => c.Name === name) || romanChords[0];
            let notes = [...chordDef.Notes];

            if (lastNotes) {
                notes = this._getSmoothInversion(notes, lastNotes);
            }
            lastNotes = notes;

            return { name: chordDef.Name, rootOffset: notes[0], intervals: notes, durationSteps: stepsPerBar, keyFreq: baseFreq };
        });
    }

    _getSmoothInversion(currentNotes, lastNotes) {
        const lastAvg = lastNotes.reduce((a, b) => a + b, 0) / lastNotes.length;

        return currentNotes.map(note => {
            let bestNote = note;
            let minDiff = Math.abs(note - lastAvg);

            // Check octaves up and down to find the closest version of this note
            [-12, 12, -24, 24].forEach(offset => {
                const shifted = note + offset;
                const diff = Math.abs(shifted - lastAvg);
                if (diff < minDiff) {
                    minDiff = diff;
                    bestNote = shifted;
                }
            });
            return bestNote;
        });
    }

    _generateBassline(rhythm, ship, progression, keyRootFreq, beatTime, styleOverride = null, tensionLevel = 2, titleRhythm = null) {
        const events = [];
        const densityMultiplier = 0.5 + (tensionLevel / 11) * 1.0;
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
        if (typeof styleOverride === 'number') {
             if ([5, 7, 9].includes(styleOverride)) style = 'Funk'; 
             else if ([2, 4, 8].includes(styleOverride)) style = 'Soul';
             else style = 'Rock';
        }
        let patternKey = Object.keys(this.bassPatterns).find(k => this.bassPatterns[k].style === style) || 'Rock';
        const pattern = this.bassPatterns[patternKey];
        const intervals = pattern.intervals || [0];
        let currentStepOffset = 0;
        progression.forEach(chord => {
            const currentRootFreq = chord.keyFreq || keyRootFreq;
            // Normalize rootOffset to keep bass in the low register regardless of chord inversions
            const normalizedRoot = ((chord.rootOffset % 12) + 12) % 12;
            const chordRootFreq = currentRootFreq * Math.pow(2, normalizedRoot / 12);
            const stepsInChord = chord.durationSteps;
            const velocityBoost = (chord.section === 'Chorus' || chord.section === 'Bridge') ? 0.1 : 0.0;
            const getFreq = (interval) => chordRootFreq * Math.pow(2, interval / 12);
            if (pattern.strategy === 'kick_lock') {
                // Fix: Filter using absolute steps (currentStepOffset) then map to relative
                const kickSteps = rhythm.events.filter(e => e.voice === 'v_kick' && e.step >= currentStepOffset && e.step < currentStepOffset + stepsInChord)
                                               .map(e => e.step - currentStepOffset);
                kickSteps.forEach(step => {
                    events.push({ voice: 'v_bass', step: currentStepOffset + step, freq: getFreq(0), duration: 0.2, velocity: 0.9 });
                });
                for (let i = 0; i < stepsInChord; i++) {
                    if (!kickSteps.includes(i) && rng.next() < 0.3 * densityMultiplier) {
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
                    events.push({ voice: 'v_bass', step: currentStepOffset + i, freq: getFreq(0), duration: 0.2, velocity: 0.8 + velocityBoost });
                }
            } else if (titleRhythm && (barIndex % 4 === 2)) {
                // ECHO LOGIC: Echo the title rhythm in the bassline every few bars
                let echoStep = 0;
                titleRhythm.forEach((dur, i) => {
                    if (echoStep < stepsInChord) {
                        const interval = i === 0 ? 0 : rng.pick(intervals);
                        events.push({
                            voice: 'v_bass',
                            step: currentStepOffset + echoStep,
                            freq: getFreq(interval),
                            duration: dur * beatTime,
                            velocity: 0.85
                        });
                        echoStep += Math.ceil(dur * 4);
                    }
                });
            } else {
                for (let i = 0; i < stepsInChord; i += 2) {
                    if (rng.next() < (pattern.density || 0.5) * densityMultiplier) {
                        const interval = rng.pick(intervals);
                        events.push({ voice: 'v_bass', step: currentStepOffset + i, freq: getFreq(interval), duration: 0.2, velocity: 0.8 + velocityBoost });
                    }
                }
                if (!events.find(e => e.step === currentStepOffset)) {
                    events.push({ voice: 'v_bass', step: currentStepOffset, freq: getFreq(0), duration: 0.4, velocity: 1.0 + velocityBoost });
                }
            }
            currentStepOffset += stepsInChord;
        });
        return events;
    }

    _generateHarmonics(rhythm, ship, progression, keyRootFreq, tensionLevel = 2) {
        const guitarEvents = [];
        const padEvents = [];
        const rng = new MusicRNG((ship ? ship.name : 'harmonics') + tensionLevel);
        const densityMultiplier = 0.5 + (tensionLevel / 11) * 1.0;
        if (!this.harmonicPatterns) return { guitar: [], pad: [] };
        const patternKey = Object.keys(this.harmonicPatterns).find(k => this.harmonicPatterns[k].style === rhythm.style) || 'Electronic';
        const pattern = this.harmonicPatterns[patternKey];
        if (!pattern) return { guitar: [], pad: [] };
        let currentStepOffset = 0;
        progression.forEach(chord => {
            const stepsInChord = chord.durationSteps;
            const currentRootFreq = chord.keyFreq || keyRootFreq;
            const chordFreqs = chord.intervals.map(semitone => currentRootFreq * Math.pow(2, semitone / 12));
            const velocityBoost = (chord.section === 'Chorus') ? 0.15 : 0.0;
            if (pattern.guitar) {
                pattern.guitar.steps.forEach(step => {
                    if (step >= stepsInChord) return;
                    if (rng.next() > densityMultiplier) return; // Tension-based density
                    const noteFreq = chordFreqs[step % chordFreqs.length];
                    guitarEvents.push({ voice: 'v_guitar', step: currentStepOffset + step, freq: noteFreq, duration: pattern.guitar.duration, velocity: pattern.guitar.velocity + velocityBoost });
                });
            }
            if (pattern.pad) {
                if (pattern.pad.behavior === 'sidechain') {
                    padEvents.push({ voice: 'v_pad', step: currentStepOffset, freq: chordFreqs[0], duration: 4.0, velocity: 0.6 + velocityBoost });
                } else if (pattern.pad.behavior === 'snare_mirror') {
                    const snareSteps = rhythm.events.filter(e => e.voice === 'v_snare' && e.step >= currentStepOffset && e.step < currentStepOffset + stepsInChord)
                                                    .map(e => e.step - currentStepOffset);
                    snareSteps.forEach(step => {
                        const noteFreq = chordFreqs[1] || chordFreqs[0];
                        padEvents.push({ voice: 'v_pad', step: currentStepOffset + step, freq: noteFreq, duration: pattern.pad.duration, velocity: pattern.pad.velocity + velocityBoost });
                    });
                } else if (pattern.pad.behavior === 'kick_lock') {
                    const kickSteps = rhythm.events.filter(e => e.voice === 'v_kick' && e.step >= currentStepOffset && e.step < currentStepOffset + stepsInChord)
                                                   .map(e => e.step - currentStepOffset);
                    kickSteps.forEach(step => {
                        const noteFreq = chordFreqs[0] / 2;
                        padEvents.push({ voice: 'v_pad', step: currentStepOffset + step, freq: noteFreq, duration: pattern.pad.duration, velocity: pattern.pad.velocity + velocityBoost });
                    });
                } else {
                    pattern.pad.steps.forEach(step => {
                        if (step >= stepsInChord) return;
                        const noteFreq = chordFreqs[0];
                        padEvents.push({ voice: 'v_pad', step: currentStepOffset + step, freq: noteFreq, duration: pattern.pad.duration, velocity: pattern.pad.velocity + velocityBoost });
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

    _generateMarkovTransitions(scaleIntervals, harmonicStepDistribution = {}, artist = null) {
        const matrix = [];
        const preferredIntervals = new Map();

        const instId = artist?.instrumentId?.toLowerCase() || '';
        const isSingable = artist && (instId.includes('voice') ||
                          instId.includes('acoustic') ||
                          artist.personality === 'lead');
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

                if (isSingable) {
                    // Favor small intervals for singable melodies
                    if (melodicInterval === 0) weight += 4.0; // Repeated notes
                    else if (melodicInterval <= 2 || melodicInterval >= 10) weight += 5.0; // Steps
                    else if (melodicInterval === 5 || melodicInterval === 7) weight += 2.0; // Perfect 4th/5th
                    else if (melodicInterval > 7 || (melodicInterval > 2 && melodicInterval < 5)) weight *= 0.1; // Penalize jumps
                }

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
            SafeLogger.warn("ThemeGenerator: Geometry module missing, cannot generate composition.");
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
        const transitionMatrix = this._generateMarkovTransitions(allowedScaleIntervals, harmonicStepDistribution, character);

        // SYLLABLE RHYTHM INTEGRATION
        const syllableRhythm = this._getSyllableRhythm(character.name);
        const length = Math.max(syllableRhythm.length, 8);

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

            // Refine octave for singability (Lead voices should stay in Octave 4-5)
            let octaveOffset = rng.pick([0, 0, 1]);
            const instId = character.instrumentId?.toLowerCase() || '';
            if (instId.includes('voice') || instId.includes('lead') || instId.includes('melody')) {
                // Force into a melodic range relative to baseFreq
                // If baseFreq is already Octave 4, offset 0 or 1 is perfect.
            }

            const freq = baseFreq * Math.pow(2, (interval + (octaveOffset * 12)) / 12);

            // Use syllable rhythm for the primary phrase, then vary
            const duration = (i < syllableRhythm.length) ? syllableRhythm[i] : rng.pick(noteDurations);

            sequence.push({ freq: freq, duration: duration, interval: interval, pitchName: pitchName });
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
            SafeLogger.message(`ThemeGenerator: Generated composition '${compositionData.name}' for ${entity.name}`);
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

    async _generateLoopFromVoice(voice, loopDurationMeasures = 2) {
        if (!this.synth || !voice || !voice.sequence || !voice.sequence.length) return null;

        const bpm = 120; // Or get from track
        const beatTime = 60 / bpm;
        const stepTime = beatTime / 4;
        const stepsPerBar = 16; // Or get from track
        const loopDurationSteps = loopDurationMeasures * stepsPerBar;
        const loopDurationSeconds = loopDurationSteps * stepTime;

        const offlineCtx = new OfflineAudioContext(1, this.synth.ctx.sampleRate * loopDurationSeconds, this.synth.ctx.sampleRate);
        const loopGain = offlineCtx.createGain();
        loopGain.connect(offlineCtx.destination);

        SafeLogger.message(`Generating loop for '${voice.name}' of ${loopDurationSeconds.toFixed(2)}s...`);

        // Schedule all notes from the voice sequence that fall within the loop duration
        voice.sequence.forEach(note => {
            if (note.step < loopDurationSteps) {
                const startTime = note.step * stepTime;
                const freq = note.freq || this._noteToFreq(note.note);
                // Use the instrument engine from the main synth to play into the offline context
                this.synth.instrumentEngine.playNote(
                    voice.instrument,
                    freq,
                    offlineCtx.currentTime + startTime,
                    note.duration,
                    note.velocity,
                    loopGain // Play into the offline context's gain node
                );
            }
        });

        try {
            const renderedBuffer = await offlineCtx.startRendering();
            const loopId = `loop_${voice.id}_${Date.now()}`;
            
            this.synth.buffers.set(loopId, renderedBuffer);
            
            this.manifestManager.addToManifest('loops', loopId, { source: 'synthetic', duration: renderedBuffer.duration, bpm: bpm });

            SafeLogger.message(`Successfully generated and saved loop '${loopId}'.`);
            return { id: loopId, buffer: renderedBuffer };
        } catch (e) {
            SafeLogger.error(`Failed to render loop for voice '${voice.name}'`, e);
            return null;
        }
    }
}
