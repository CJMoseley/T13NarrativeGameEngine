import ProcGen from '/src/t13ne/procgen/ProcGen.js';
import { MusicGenerator } from '/src/t13ne/procgen/audio/MusicGenerator.js';
import Logger from '/src/t13ne/core/Logger.js';
import { ColourUtils } from '/src/t13ne/utils/ColourUtils.js';
import { LoreData } from '/src/t13ne/procgen/lore/LoreData.js';

// WormholeEnvironment.js
// This class defines a basic wormhole environment for testing races.
// The wormole is meant to open with a funnel shape at the start, then stabilize into a tube, and then close with a funnel shape at the end. These are like the mouths of the tunnel, much wider than the tunnel.
// The wormhole is meant to vibrate and have turbulance based of fthe ship components and the frequencies that they induce into the tunnel (causing the tunnel to vionrate like a complex guitar string)
// The wormhole is also meant to be affected by both the perlin noise near the entrace and exit of the wormhole as well as the middle of the realspace the wormhole is traverseing past.
// The perlin noise is sampled for only the first 3 dimensions and then rotated through higher dimensions to create a loop of noise that affects the vertices of the wormhole surface, as well as the tunnel positions (again also combining with the ship component frequencies)
// The noise cycle is stepped through with each tick of the game loop (actually it might be every 23 ticks or so) to create a dynamic, evolving wormhole environment that reacts to both the ship's configuration and the galactic conditions.
// multiple ships each have individual effects on the wormhole environment based on their component frequencies, and the actions they are taking, creating a complex interplay of forces within the tunnel.
// The presence of a ship on the wall should push the wall, and the tunnel in that direction, with a corresponding reaction force beyond the nearest node of the string (treating the tunnel as a guitar string) 
export class BasicWormholeEnvironment { // Renamed from WormholeEnvironment
    /**
     * @param {object} startSystem - The system data object for the start point. Can be a simple {x,y,z} or a full system object.
     * @param {object} endSystem - The system data object for the end point.
     * @param {string} raceType - The type of race, e.g., 'Straight Line' or 'Orbital'.
     */
    constructor(startSystem, endSystem, raceType = 'Straight Line') {
        this.startSystem = startSystem;
        this.endSystem = endSystem;

        // Handle both simple {x,y,z} and full system objects for flexibility
        this.startPoint = startSystem.coords ? this.parseCoords(startSystem.coords) : startSystem;
        this.destinationPoint = endSystem.coords ? this.parseCoords(endSystem.coords) : endSystem;

        this.raceType = raceType;
        this.globalTime = 0; // The simulation time
        this.obstacles = [];
        this.wormholes = [];

        // ENFORCEMENT: Check for orbital definition
        if (raceType === 'Orbital') {
            // An orbital race requires the start and destination to be the same, 
            // defining a loop around the central body.
            if (this.startPoint.x !== this.destinationPoint.x || this.startPoint.y !== this.destinationPoint.y || this.startPoint.z !== this.destinationPoint.z) {
                Logger.message("WARN: WormholeEnvironment: Orbital race requires start and destination to match. Setting destination to start point.");
                this.destinationPoint = this.startPoint;
            }
            this.length = this.calculateOrbitalLength();
        } else {
            this.length = this.calculateStraightLineLength();
        }

        switch (raceType) {
            case 'Obstacles':
                for (let i = 0; i < 10; i++) {
                    this.obstacles.push({
                        position: {
                            x: Math.random() * 500 - 250,
                            y: Math.random() * 500 - 250,
                            z: Math.random() * this.length,
                        },
                        radius: Math.random() * 50 + 10,
                    });
                }
                break;
            case 'Wormholes':
                for (let i = 0; i < 3; i++) {
                    this.wormholes.push({
                        entry: {
                            x: Math.random() * 400 - 200,
                            y: Math.random() * 400 - 200,
                            z: Math.random() * this.length * 0.8,
                        },
                        exit: {
                            x: Math.random() * 400 - 200,
                            y: Math.random() * 400 - 200,
                            z: Math.random() * this.length * 0.8 + this.length * 0.2,
                        },
                        radius: Math.random() * 30 + 20,
                    });
                }
                break;
        }

        // Global environmental parameters that feed into the 12D noise (d5-d12) Not sure what the heck this was meant to be 
        // these seem to be set across the whole galaxy rather than per wormhole, which is not what was asked for, as this was meant to 
        // be part of the perlin noise.

        // --- MUSIC GENERATION INTEGRATION ---
        this.musicGenerator = new MusicGenerator();
        this.song = this.defineWormholeSong();
        this.chordProgression = this.musicGenerator.generateChordProgression(this.song);

        this.galacticState = {
            techLevel: 15,
            safety: 0.8,
            criminality: 0.2,
            localTrade: 1.0,
            aggression: 0.1,
            darkMatter: 0.05,
            localColourFreq: 600.0, // Used as a frequency input
            localColourPhase: 0.1  // Used as a phase input
        };

        Logger.message(`Wormhole Environment created: ${this.raceType}. Length: ${this.length.toFixed(2)}.`);
        Logger.message(`Wormhole Song Defined: ${this.song.key} ${this.song.scaleName}`);
        Logger.logVariables({ 'Chord Progression': this.chordProgression });
    }

    /**
     * Helper to parse coordinate strings from system data into {x,y,z} objects.
     * @param {string} coordString - The coordinate string, e.g., "10, 20, 30".
     * @returns {{x: number, y: number, z: number}}
     */
    parseCoords(coordString) {
        const parts = coordString.split(',').map(s => parseInt(s.trim(), 10));
        return { x: parts[0] || 0, y: parts[1] || 0, z: parts[2] || 0 };
    };

    calculateStraightLineLength() {
        const dx = this.destinationPoint.x - this.startPoint.x;
        const dy = this.destinationPoint.y - this.startPoint.y;
        const dz = this.destinationPoint.z - this.startPoint.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    calculateOrbitalLength() {
        // Placeholder for a more complex calculation based on system bodies.
        const assumedRadius = 500;
        return 2 * Math.PI * assumedRadius;
    }

    // This method calculates the GLOBAL characteristic of the race course at any point.
    // It does NOT calculate the physical wall geometry, but the complexity/difficulty.
    // not sure what the fuck the AI thought this was mean to be, each ship is meant to add a whole bunch of wobbles that have nothing to do with perlin noise to the tunnel
    getGlobalCourseComplexity(position, shipFrequencies) {
        // ShipFrequencies is an object: { f1, f2, f3, f4 }
        const { f1, f2, f3, f4 } = shipFrequencies;

        // --- 1. Map Ship Position to Distance Along Course ---
        // For a 'Straight Line' race, this is simple. For 'Orbital', it would be a curve calculation. 
        // not really sure what it thought this was for either. This isn't a measure of distance but a single length (not much use on a flexible waving course this)
        const currentDistance = Math.sqrt(
            Math.pow(position.x - this.startPoint.x, 2) +
            Math.pow(position.y - this.startPoint.y, 2) +
            Math.pow(position.z - this.startPoint.z, 2)
        );

        // --- 2. Define the 12 Independent Inputs for the Noise ---
        // d1-d4: Spatial (using a scaled position and time for core geometry)
        // no idea why it decided when I stated in was a 12 dimensional space that one of the 12 spatial dimensions would be time. 

        const d1 = position.x * 0.01;
        const d2 = position.y * 0.01;
        const d3 = position.z * 0.01;
        const d4 = this.globalTime * 0.1; // Time evolution of the noise field

        // d5-d8: Ship Component Frequencies/Phases (Racer-specific influence)
        // this is utter bollocks, ships don't affect the galaxy at all. Not sure why it implemented this this way at all. 
        // These were meant to be calculated frequencies of vibration and phase for the wormhole based on length, width and the masses in the tunnel.
        // has nothing to do with the ship components at all.
        const d5 = f1;
        const d6 = f2;
        const d7 = f3;
        const d8 = f4;

        // d9-d12: Global Environmental Factors (Map-specific influence)
        // not sure why these are being seeded the way they are. They are meant to vary across the whole galaxy, not be set to a default.
        const d9 = this.galacticState.techLevel;
        const d10 = this.galacticState.criminality;
        const d11 = this.galacticState.localColourFreq;
        const d12 = this.galacticState.darkMatter;

        // --- 3. Calculate 12D Noise for the Global Complexity ---
        const rawNoise = ProcGen.noise12D(
            [d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12]
        );

        // --- 4. Translate Noise into Environmental Metrics ---

        // Noise determines the size/radius of the wormhole (e.g., if noise > 0, the tube is wider)
        // not sure why this was set this way. the tunnel width is meant to be based on the numbe rof ships inside the tunnel
        // and the power they supplied to the darkenergy vortex generator at the start of the tunnel.  This makes no sense at all.
        const wormholeRadiusFactor = 1.0 + rawNoise * 0.5;

        // Noise determines the turbulence/drag at this point on the map
        // no noise should not be used to detirming drag at all. Drag is meant to be based on the ship componets and the vibration frequencies they induce into the tunnel
        // and the turbulance is meant to vary as a sine across the length of the tunnel with the highest turnbulance in the middle of the tunnel.
        // so yeah copilot fucked this up too
        const turbulenceFactor = Math.abs(rawNoise * 1.5);

        // Noise determines the base colour of the energy field at this point
        // no the colour is meant to be used as a "local colour" for the aliens and corporations in the area of the galaxy.
        // the wormhoole does not change colour at all.
        const baseColour = ColourUtils.curvedFrequencyToHex(
            this.galacticState.localColourFreq + rawNoise * 100
        );

        return {
            distance: currentDistance,
            totalLength: this.length,
            radiusFactor: wormholeRadiusFactor,
            turbulence: turbulenceFactor,
            baseColour: baseColour
        };
    }

    // Method to advance the state of the wormhole (e.g., global turbulence changes)
    update(deltaTime) {
        this.globalTime += deltaTime;
        // In a real system, environmental states (galacticState) would also slowly evolve here. No it wouldn't what rot. The galactic state doesn't change, because you have misunderstood what the galactic state is menat to be and conflated the entire fucking thing together.

    }

    /**
     * Uses the MusicGenerator to determine the musical scale and key for this wormhole.
     * The key is determined by the destination, making the arrival feel like a resolution.
     * @returns {object} The generated song data.
     */
    defineWormholeSong() {
        // Re-uses the startPoint and destinationPoint already parsed in the constructor
        return this.musicGenerator.getWormholeSong(this.startPoint, this.destinationPoint);
    }

    /**
     * Gets the current state of the wormhole at a specific point.
     * This will eventually include the tunnel's geometry, color, etc.
     * @param {number} progress - A value from 0 (start) to 1 (end) along the wormhole.
     * @returns {object} The state of the wormhole at that point.
     */
    getStateAt(progress) {
        // Placeholder for future physics and rendering logic.
        // This is where we would use the this.song and this.chordProgression
        // to influence the visual and physical properties of the tunnel.
        const state = {
            color: this.musicGenerator.curvedFrequencyToHex(440 + progress * 200), // Example color shift
            radius: 50 + ProcGen.simplex2D(progress * 10, this.startPoint.x) * 10, // Use a seed value
            // ... other properties like wall texture, turbulence, etc.
        };
        return state;
    }

    /**
     * Determines the current target chord based on the race progress.
     * @param {number} progress - A value from 0 to 1.
     * @returns {string} The current chord (e.g., "I", "V", "vi").
     */
    getCurrentChord(progress) {
        const sectionIndex = Math.floor(progress * this.chordProgression.length);
        return this.chordProgression[sectionIndex % this.chordProgression.length];
    }

    /**
     * Gets the root note of a given chord within the wormhole's song.
     * @param {string} chord - The chord identifier (e.g., "I", "ii", "V").
     * @returns {string} The note name (e.g., "C", "G", "Am").
     */
    getNoteFromChord(chord) {
        const triads = this.song.scaleData.triads;
        const chordIndex = triads.findIndex(c => c.toLowerCase() === chord.toLowerCase());
        const semitoneOffset = this.song.scaleData.semitones[chordIndex % triads.length];
        const keyIndex = LoreData.music.TONE_COLOR_MAP.findIndex(n => n.note === this.song.key);
        return LoreData.music.TONE_COLOR_MAP[(keyIndex + semitoneOffset) % 12].note;
    }
}
