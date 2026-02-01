import Logger from "../../core/Logger.js";
import T13NE from '../../T13NE.js';
import CodexLoader from "../codex/CodexLoader.js";
import { InstrumentEngine } from "./t13ne-InstrumentEngine.js";

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

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
 * Manages the loading and tracking of audio assets via a manifest.
 */
class AudioManifestManager {
    constructor() {
        this.manifest = {
            samples: {},
            sequences: {},
            tracks: {},
            midi: {},
            loops: {},
            stems: {},
            instruments: {}
        };
        this.basePath = '/data/media/audio';
    }

    async loadManifest() {
        try {
            const response = await fetch(`${this.basePath}/audio_assets_manifest.json`);
            if (response.ok) {
                this.manifest = await response.json();
                Logger.message("AudioManifestManager: Manifest loaded.");
            } else {
                Logger.warn("AudioManifestManager: No manifest found, starting fresh.");
            }
        } catch (e) {
            Logger.warn("AudioManifestManager: Failed to load manifest.", e);
        }
    }

    addToManifest(category, id, metadata) {
        if (!this.manifest[category]) this.manifest[category] = {};
        this.manifest[category][id] = metadata;
        // In a real backend, we would save the manifest here.
        // Since this is client-side, we can only log the updated JSON for the user to save.
        Logger.message(`Updated Manifest: \n${JSON.stringify(this.manifest, null, 2)}`);
    }

    getAssetPath(category, id) {
        const item = this.manifest[category]?.[id];
        return item ? `${this.basePath}/${category}/${item.filename}` : null;
    }

    getAssetAnalysis(category, id) {
        return this.manifest[category]?.[id]?.analysis || null;
    }

    updateAssetAnalysis(category, id, analysis) {
        if (this.manifest[category]?.[id]) {
            this.manifest[category][id].analysis = analysis;
        }
    }
}

/**
 * A lightweight synthesizer for procedural playback with transition capabilities.
 */
class T13Synth {
    constructor(audioContext) {
        this.ctx = audioContext;
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        
        // Add Compressor to tame peaks and prevent clipping
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -10;
        this.compressor.knee.value = 40;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0;
        this.compressor.release.value = 0.25;

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);

        this.buffers = new Map(); // Store loaded AudioBuffers
        this.layers = new Map(); // To manage active layers { source, gainNode }
        this.channels = new Map(); // Channel routing for visualization

        // Sub-Engines
        this.instrumentEngine = new InstrumentEngine(this.ctx);
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

    playNote(frequency, startTime, duration, type = 'sine', detune = 0, instrument = null, channelId = null) {
        let dest = this.masterGain;

        if (channelId) {
            if (!this.channels.has(channelId)) {
                const gain = this.ctx.createGain();
                const analyser = this.ctx.createAnalyser();
                analyser.fftSize = 256;
                gain.connect(analyser);
                analyser.connect(this.masterGain);
                this.channels.set(channelId, { gain, analyser });
            }
            dest = this.channels.get(channelId).gain;
        }

        // Delegate to InstrumentEngine for unified handling
        // If 'instrument' is a string key for a loaded sample or defined instrument
        if (instrument) {
            this.instrumentEngine.playNote(instrument, frequency, startTime, duration, 0.3, dest);
            return;
        }

        // Fallback to basic synth if no instrument specified (or use default synth type)
        this.instrumentEngine.playNote(type, frequency, startTime, duration, 0.3, dest);
    }

    playSample(name, frequency, startTime, duration, detune) {
        // Forwarding legacy calls to InstrumentEngine
        this.instrumentEngine.playNote(name, frequency, startTime, duration, 0.3, this.masterGain);
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
        this.themeComponents = {};

        this.manifestManager = new AudioManifestManager();
    }

    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;
        this.geometry = t13ne.getModule('T13Geometry');
        this.soundEngine = t13ne.soundEngine; // Access core sound engine

        await this.manifestManager.loadManifest();

        if (this.soundEngine && this.soundEngine.audioContext) {
            this.synth = new T13Synth(this.soundEngine.audioContext);
            // Attach manifest manager to instrument engine so it can access analysis data
            this.synth.instrumentEngine.manifestManager = this.manifestManager;
            
            // Initialize the Instrument Engine (loads AudioWorklets)
            await this.synth.instrumentEngine.init();
        } else {
            Logger.warn("T13NE_Music: SoundEngine AudioContext not available. Playback disabled.");
        }

        // Load data required for generation
        this.tonalModes = await CodexLoader.getData('geometry', 'tonalModes.json') || [];

        this.initialized = true;
        Logger.message("T13NE_Music: Initialized.");

        // Auto-generate high-fidelity instruments from manifest samples if available
        this._generateOrchestralInstruments();
    }

    _generateOrchestralInstruments() {
        if (!this.synth) return;
        
        const mappings = {
            'Cello': 'pad_acoustic/low_string',
            'Violin': 'melody_acoustic/hi_string',
            'Viola': 'melody_acoustic/mid_string',
            'Flute': 'melody_acoustic/flute_c1',
            'Trumpet': 'melody_acoustic/trumpet_solo',
            'French Horn': 'melody_acoustic/brite_horn',
            'Clarinet': 'melody_acoustic/clarinet_c1',
            'Piano': 'melody_acoustic/piano_c4',
            'Harp': 'melody_acoustic/harp'
        };

        for (const [instName, sampleId] of Object.entries(mappings)) {
            // Create a synthetic instrument derived from the sample analysis
            // This uses the AdditiveProcessor to recreate the timbre
            this.synth.instrumentEngine.createSyntheticInstrument(sampleId, instName, 'high', 'sustained');
        }
    }

    /**
     * Loads a sample and registers it in the manifest and instrument engine.
     */
    async loadSample(name, url) {
        if (this.synth) {
            const success = await this.synth.instrumentEngine.loadSample(name, url);
            if (success) {
                this.manifestManager.addToManifest('samples', name, { filename: url.split('/').pop(), loaded: true });
            }
        }
    }

    /**
     * Inject components for theme generation if they are created asynchronously.
     * @param {Object} components - { playerCharacter, playerShip, galaxy }
     */
    injectThemeComponents(components) {
        this.themeComponents = { ...this.themeComponents, ...components };
        Logger.message("T13NE_Music: Theme components injected.");
    }

    /**
     * Selects an appropriate instrument based on the Role and Geometry.
     * Roles:
     * - Lead: The main melody voice.
     * - Bass: The low-frequency rhythm/harmony foundation.
     * - Pad: Harmonic Fill. Sustained background chords that "pad" the mix (e.g. Strings, Choir).
     * - Drum: Percussive rhythm.
     */
    _getInstrumentForRole(role, geo) {
        const palettes = {
            bass: ['Tuba', 'Cello', 'Piano'], 
            lead: ['Violin', 'Flute', 'Oboe', 'Trumpet', 'Clarinet'], 
            pad: ['French Horn', 'Viola', 'Cello', 'Harp'], 
            drum: ['wr_kick', 'wr_snare', 'wr_hat']
        };

        const palette = palettes[role] || palettes.lead;
        // Use Geometry Number (1-13) to deterministically pick an instrument
        const index = ((geo?.GeometryNumber || 1) - 1) % palette.length;
        return palette[index];
    }

    /**
     * generating the Wormhole Racers Main Theme.
     */
    async createWormholeTheme(gameEngine) {
        if (!this.synth) return;

        const trackName = 'track_wormhole_main_theme';
        Logger.message("T13NE_Music: generating Wormhole Racers Theme from components...");

        // 1. Determine Context from Game Engine or Injected Components
        const components = this.themeComponents || {};
        
        // Prefer injected, then gameEngine, then fail (no hardcoded fallbacks)
        const pcSource = components.playerCharacter || gameEngine?.playerCharacter;
        const shipSource = components.playerShip || gameEngine?.playerShip;
        const galaxySource = components.galaxy || gameEngine?.galaxy;

        if (!pcSource || !shipSource || !galaxySource) {
             Logger.warn("T13NE_Music: Missing components for Wormhole Theme (PC, Ship, or Galaxy). Waiting for injection.");
             return null;
        }

        // Helper to ensure geometry is calculated if missing
        const ensureGeometry = (source) => {
             if (source.geometry && source.geometry.GeoHarmonics) return source;
             // Calculate if missing using the mandatory T13Geometry module
             const geo = this.geometry.calculateFullGeo(source.name);
             return { ...source, geometry: geo };
        };

        const pc = ensureGeometry(pcSource);
        const ship = ensureGeometry(shipSource);
        const galaxy = ensureGeometry(galaxySource);

        // 2. Generate Motifs (Patterns) for each entity
        const leadMotif = this.getCharacterComposition(pc);
        const bassMotif = this.getCharacterComposition(ship);
        const padMotif = this.getCharacterComposition(galaxy);

        // 3. Determine Instruments based on Role and Geometry
        const leadInst = this._getInstrumentForRole('lead', pc.geometry);
        const bassInst = this._getInstrumentForRole('bass', ship.geometry);
        const padInst = this._getInstrumentForRole('pad', galaxy.geometry);

        // 4. Generate Track Events
        const bpm = 120;
        const beatTime = 60 / bpm;

        // Helper to shift motif to target range
        const getShift = (motif, targetFreq) => {
            if (!motif || !motif.baseFreq) return 0;
            return 12 * Math.log2(targetFreq / motif.baseFreq);
        };

        // Lead: Keep original pitch or center around C4 (261Hz)
        const leadEvents = this._motifToTrackEvents(leadMotif, 'v_lead', beatTime, 0);
        
        // Bass: Shift to ~C2 (65Hz)
        const bassShift = getShift(bassMotif, 65);
        const bassEvents = this._motifToTrackEvents(bassMotif, 'v_bass', beatTime, bassShift);
        
        // Pad: Shift to ~C3 (130Hz)
        const padShift = getShift(padMotif, 130);
        const padEvents = this._motifToTrackEvents(padMotif, 'v_pad', beatTime, padShift);

        // Drums: Procedural based on ship
        const drumSequence = this._generateDrumSequence(16, ship);

        // 5. Assemble Sequence
        const fullSequence = [];
        const measures = 4;
        const totalSteps = measures * 16;

        const fillTrack = (events, voiceId) => {
            if (!events.length) return;
            let currentStep = 0;
            const motifLength = events[events.length - 1].step + (events[events.length - 1].duration / beatTime * 4);
            const loopLength = Math.ceil(motifLength / 16) * 16 || 16;

            while (currentStep < totalSteps) {
                events.forEach(evt => {
                    if (currentStep + evt.step < totalSteps) {
                        fullSequence.push({
                            ...evt,
                            step: currentStep + evt.step,
                            voice: voiceId
                        });
                    }
                });
                currentStep += loopLength;
            }
        };

        fillTrack(leadEvents, 'v_lead');
        fillTrack(bassEvents, 'v_bass');
        fillTrack(padEvents, 'v_pad');
        
        // Drums
        fillTrack(drumSequence.filter(e => e.voice === 'v_kick'), 'v_kick');
        fillTrack(drumSequence.filter(e => e.voice === 'v_snare'), 'v_snare');
        fillTrack(drumSequence.filter(e => e.voice === 'v_hat'), 'v_hat');

        // Define Drum Instruments (Standard)
        this.synth.instrumentEngine.defineInstrument('wr_kick', { type: 'synth', oscType: 'sine', pitchEnv: { startMult: 4.0, time: 0.1 }, attack: 0.001, release: 0.2 });
        this.synth.instrumentEngine.defineInstrument('wr_snare', { type: 'noise', filterType: 'lowpass', filterFreq: 2000 });
        this.synth.instrumentEngine.defineInstrument('wr_hat', { type: 'noise', filterType: 'bandpass', filterFreq: 4000, filterQ: 1.0 });

        const trackData = {
            name: 'Wormhole Racers Theme',
            bpm: bpm,
            timeSignature: [4, 4],
            measures: measures,
            voices: [
                { id: 'v_bass', name: 'Bass', instrument: bassInst, sequence: [], mute: false },
                { id: 'v_lead', name: 'Lead', instrument: leadInst, sequence: [], mute: false },
                { id: 'v_pad', name: 'Pad', instrument: padInst, sequence: [], mute: false },
                { id: 'v_kick', name: 'Kick', instrument: 'wr_kick', sequence: [], mute: false },
                { id: 'v_snare', name: 'Snare', instrument: 'wr_snare', sequence: [], mute: false },
                { id: 'v_hat', name: 'Hat', instrument: 'wr_hat', sequence: [], mute: false }
            ]
        };

        // Distribute
        fullSequence.forEach(note => {
            const v = trackData.voices.find(voice => voice.id === note.voice);
            if (v) v.sequence.push(note);
        });

        this.saveTrack(trackName, trackData);
        return trackData;
    }

    _motifToTrackEvents(motif, voiceId, beatTime, pitchShiftSemitones = 0) {
        const events = [];
        let currentStep = 0;
        motif.sequence.forEach(note => {
            // note.duration is in beats (e.g. 0.25, 0.5, 1.0)
            // step is 16th note (0.25 beat)
            const durationSteps = note.duration * 4; 
            
            // Pitch shift freq
            let freq = note.freq;
            if (pitchShiftSemitones !== 0) {
                freq = freq * Math.pow(2, pitchShiftSemitones / 12);
            }

            events.push({
                voice: voiceId,
                step: currentStep,
                freq: freq,
                duration: note.duration * beatTime, // Seconds
                velocity: 0.7
            });
            currentStep += durationSteps;
        });
        return events;
    }

    _addLoopToSequence(targetSeq, sourceEvents, offsetStep, loopLengthSteps) {
        sourceEvents.forEach(evt => {
            // Wrap event step within loop length
            const loopStep = evt.step % loopLengthSteps;
            // Add to target
            targetSeq.push({
                ...evt,
                step: offsetStep + loopStep
            });
        });
    }

    _generateDrumSequence(lengthSteps, ship = null) {
        const events = [];
        const rng = new MusicRNG(ship ? ship.name : 'default');
        
        // Pick a rhythm style based on ship name hash
        const kickPattern = rng.pick(['four-on-floor', 'breakbeat', 'driving']);

        for (let i = 0; i < lengthSteps; i++) {
            // Kick
            let kick = false;
            if (kickPattern === 'four-on-floor' && i % 4 === 0) kick = true;
            else if (kickPattern === 'driving' && i % 2 === 0) kick = true;
            else if (kickPattern === 'breakbeat' && (i % 8 === 0 || i % 8 === 5)) kick = true;

            if (kick) events.push({ voice: 'v_kick', step: i, freq: 100, duration: 0.1, velocity: 0.8 });

            // Snare
            if (i % 8 === 4) events.push({ voice: 'v_snare', step: i, freq: 100, duration: 0.1, velocity: 0.7 });
            
            // Hats - influenced by component count (more components = busier hats)
            const hatDensity = ship && ship.components ? 0.5 + (ship.components.length * 0.05) : 0.5;
            if (i % 2 === 0 || (rng.next() < hatDensity && i % 2 !== 0)) events.push({ voice: 'v_hat', step: i, freq: 1000, duration: 0.05, velocity: 0.5 });
        }
        return events;
    }

    /**
     * Plays a tracked composition.
     */
    playTrack(trackId) {
        const track = this.manifestManager.manifest.tracks[trackId] || null;
        if (!track) {
            // It might be a raw object if we just created it and haven't reloaded
            // Check if we can find it in saved JSONs? 
            // Since we save to manifest structure in memory:
            // The saveTrack method puts it in manifest.tracks[name]
        }

        // Actually, saveTrack uses 'name' as key. 
        // Let's ensure we can retrieve it.
        const data = this.manifestManager.manifest.tracks[trackId];
        // If data is just metadata {filename...} we need to load it. 
        // But if we just created it in memory, we might need a way to play the raw object or auto-load.

        // For this immediate flow, let's assume we play the Object we just built if passed, or load from ID.
        // ... (This needs a proper track scheduler, which MusicEditorUI has, but T13NE_Music needs its own playback logic)

        // Implementing simple sequencer playback here for the engine/intro:
        if (data) {
            // If it has a filename, strictly we should fetch it. 
            // But saveTrack updates the manifest with just metadata.
            // But we likely still have the object in memory if we just made it?
            // Not currently stored in a 'loadedTracks' cache.

            // Quick fix: If we are calling playTrack immediately after create, we can pass the object or we need to 'load' the track JSON.
            // Given limitations, let's just make createWormholeTheme return the Track Object.
        }
    }

    playTrackObject(track) {
        if (!this.synth) return;
        Logger.message(`Playing Track: ${track.name}`);

        // Simple Interval Scheduler
        // 16th notes
        const stepTime = (60 / track.bpm) / 4;
        const lookahead = 1.5; // Increased from 0.1 to 1.5s to prevent chopping during heavy load
        let currentStep = 0;
        let nextStepTime = this.synth.ctx.currentTime + 0.1;

        // Stop previous
        if (this.currentSequenceTimer) clearTimeout(this.currentSequenceTimer);

        const schedule = () => {
            const now = this.synth.ctx.currentTime;
            while (nextStepTime < now + lookahead) {
                // Play notes for current step
                track.voices.forEach(voice => {
                    if (voice.mute) return;
                    voice.sequence.forEach(note => {
                        if (note.step === currentStep) {
                            this.synth.playNote(
                                note.freq || this.synth.instrumentEngine._freqFromNote(note.note), // frequency (ignored for noise)
                                nextStepTime, // startTime
                                note.duration, // duration
                                'sine', // type (fallback)
                                0, // detune
                                voice.instrument, // instrument
                                voice.id // channelId
                            );
                        }
                    });
                });

                nextStepTime += stepTime;
                currentStep++;

                // Loop
                const totalSteps = track.measures * 16;
                if (currentStep >= totalSteps) currentStep = 0;
            }
            this.currentSequenceTimer = setTimeout(schedule, 100); // Increased interval to reduce main thread load
        };

        // Auto-create visualizer if missing
        if (!document.getElementById('audio-debug-viz')) {
            this.createDebugVisualizer();
        }

        schedule();
    }

    createDebugVisualizer() {
        const canvas = document.createElement('canvas');
        canvas.id = 'audio-debug-viz';
        canvas.width = 300;
        canvas.height = 300;
        canvas.style.cssText = 'position:fixed; bottom:10px; right:10px; z-index:10000; background:rgba(0,0,0,0.9); border:1px solid #444; pointer-events:none;';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        const draw = () => {
            if (!this.synth) return;
            requestAnimationFrame(draw);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const channels = Array.from(this.synth.channels.entries());
            if (channels.length === 0) return;
            
            const h = canvas.height / channels.length;
            
            channels.forEach(([name, ch], i) => {
                const data = new Uint8Array(ch.analyser.frequencyBinCount);
                ch.analyser.getByteTimeDomainData(data);
                
                const y = i * h;
                
                ctx.fillStyle = '#0f0';
                ctx.font = '10px monospace';
                ctx.fillText(name, 2, y + 10);
                
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#0f0';
                ctx.beginPath();
                
                for (let j = 0; j < data.length; j++) {
                    const v = data[j] / 128.0;
                    const yPos = y + (v * h / 2);
                    if (j === 0) ctx.moveTo(0, yPos);
                    else ctx.lineTo(j / data.length * canvas.width, yPos);
                }
                ctx.stroke();
            });
        };
        draw();
    }

    stopTrack() {
        if (this.currentSequenceTimer) clearTimeout(this.currentSequenceTimer);
    }
    saveSequence(name, sequence) {
        const data = { name, sequence, timestamp: Date.now() };
        this.manifestManager.addToManifest('sequences', name, { filename: `${name}.json` });
        Logger.message(`T13NE_Music: Sequence '${name}' ready for export.`);
        return JSON.stringify(data, null, 2);
    }

    /**
     * Export a track configuration.
     */
    saveTrack(name, trackData) {
        const data = { name, ...trackData, timestamp: Date.now() };
        this.manifestManager.addToManifest('tracks', name, { filename: `${name}.json` });
        return JSON.stringify(data, null, 2);
    }

    /**
     * Export MIDI-like data (notes array).
     */
    saveMidi(name, notes) {
        const data = { name, notes, timestamp: Date.now() };
        this.manifestManager.addToManifest('midi', name, { filename: `${name}.json` });
        return JSON.stringify(data, null, 2);
    }

    /**
     * Export a loop definition.
     */
    saveLoop(name, loopData) {
        const data = { name, ...loopData, timestamp: Date.now() };
        this.manifestManager.addToManifest('loops', name, { filename: `${name}.json` });
        return JSON.stringify(data, null, 2);
    }

    /**
     * Loads a single audio file for use as a sampled instrument or a one-shot effect.
     * @param {string} name - A unique name for the instrument/effect.
     * @param {string} url - The URL of the audio file.
     */
    async loadInstrument(name, url) {
        if (this.synth) {
            await this.loadSample(name, url);
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
        const found = this.tonalModes.find(m => {
            const type = m.data ? m.data.Type : m.Type;
            return type === modeName;
        });
        return found ? (found.data || found) : null;
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

        // Lazy load geometry if not linked during init
        if (!this.geometry && this.t13ne) {
            this.geometry = this.t13ne.getModule('T13Geometry');
        }

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
        
        if (!this.geometry) {
            Logger.warn("T13NE_Music: Geometry module missing, cannot generate composition.");
            return null;
        }
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
        const preferredInstrument = instrument || this._getInstrumentForRole('lead', character.geometry) || 'Piano';

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
    /**
     * Plays a defined Track (Instrument + Sequence).
     * @param {object} track - The track definition { instrument, sequence, bpm, ... }
     */
    playTrack(track) {
        if (!this.synth || !track) return;

        Logger.message(`T13NE_Music: Playing Track '${track.name}'`);

        const bpm = track.bpm || 120;
        const beatTime = 60 / bpm; // Quarter note time
        // If the sequence is 16th notes based (tracker style), stepTime is beatTime / 4
        const stepTime = beatTime / 4;

        const now = this.soundEngine.audioContext.currentTime;

        track.sequence.forEach(evt => {
            // evt: { step, note, duration, velocity }
            const startTime = now + (evt.step * stepTime);
            // Convert note name (e.g. "C4") to frequency if needed, or if stored as freq
            let freq = evt.freq;
            if (!freq && evt.note) {
                freq = this._noteToFreq(evt.note);
            }

            // duration in sequence is often in 'steps' or 'beats'? 
            // In editor it was normalized. Let's assume duration is in 'beats' for playback consistency
            // or if stored from editor, it was 0.25 (16th note).
            const durationSecs = evt.duration * 4 * stepTime; // Duration is relative to beat?

            this.synth.playNote(freq, startTime, durationSecs, 'sine', 0, track.instrument);
        });
    }

    _noteToFreq(note) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = parseInt(note.slice(-1));
        const keyNumber = notes.indexOf(note.slice(0, -1));
        if (keyNumber < 0) return 440;
        return 440 * Math.pow(2, ((keyNumber + ((octave - 4) * 12)) - 9) / 12);
    }

    /**
     * Export a track configuration (Instrument + Sequence + Settings).
     */
    saveTrack(name, instrumentId, sequence, settings = {}) {
        const data = {
            name,
            instrument: instrumentId,
            sequence,
            bpm: settings.bpm || 120,
            timeSignature: settings.timeSignature || [4, 4],
            measures: settings.measures || 2,
            timestamp: Date.now()
        };
        this.manifestManager.addToManifest('tracks', name, { filename: `${name}.json` });
        return JSON.stringify(data, null, 2);
    }

    /**
     * Export a stem (Single Voice configuration).
     */
    saveStem(name, voiceData) {
        const data = {
            name,
            instrument: voiceData.instrument,
            sequence: voiceData.sequence,
            timestamp: Date.now()
        };
        this.manifestManager.addToManifest('stems', name, { filename: `${name}.json` });
        return JSON.stringify(data, null, 2);
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
