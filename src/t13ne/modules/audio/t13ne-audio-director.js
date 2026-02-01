import Logger from "../../core/Logger.js";

/**
 * T13NE Audio Director Module
 * Acts as the "Audio Director" for the game.
 * It interprets high-level narrative states (Mood, Scene Type) into low-level music commands.
 * It also handles Foley, SFX, and atmospheric injection.
 */
class T13NE_AudioDirector {
    constructor() {
        this.t13ne = null;
        this.music = null;
        this.initialized = false;
        this.currentMood = 'Neutral';
        this.activeSceneType = null;
    }

    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;
        this.music = t13ne.getModule('Music');
        
        if (!this.music) {
            Logger.warn("T13NE_AudioDirector: Music module not found. Audio Director functionality limited.");
        }

        this.initialized = true;
        Logger.message("T13NE_AudioDirector: Initialized and ready to direct.");
    }

    /**
     * Sets the narrative mood, adjusting music tension and layers.
     * @param {string} mood - e.g., 'Tense', 'Calm', 'Action', 'Eerie'.
     * @param {number} [intensity=0.5] - 0.0 to 1.0
     */
    setMood(mood, intensity = 0.5) {
        this.currentMood = mood;
        Logger.message(`T13NE_AudioDirector: Setting mood to ${mood} (Intensity: ${intensity})`);

        if (this.music) {
            // Map mood to tension levels for the music engine
            let tension = 0;
            switch (mood.toLowerCase()) {
                case 'action': tension = 8 + (intensity * 2); break;
                case 'tense': tension = 5 + (intensity * 3); break;
                case 'eerie': tension = 3 + (intensity * 2); break;
                case 'calm': tension = 1; break;
                default: tension = intensity * 5;
            }

            // Create a mock plot object to drive the updateAmbience method
            const mockPlot = { tensionLevel: Math.min(10, Math.floor(tension)) };
            this.music.updateAmbience(mockPlot);
        }
    }

    /**
     * Plays a sound effect (Foley/Atmosphere).
     * @param {string} type - 'OneShot' or 'Loop'
     * @param {string} name - Name of the sound asset.
     */
    playSFX(type, name) {
        if (!this.music || !this.music.synth) return;

        // This assumes assets are loaded or can be generated.
        // For now, we delegate to the synth's FX capability if available,
        // or log it for future implementation of a dedicated SFX bank.
        Logger.message(`T13NE_AudioDirector: Playing SFX '${name}' (${type})`);
        
        // Example: Trigger a procedural noise if it's a generic foley request
        if (name.includes('hit') || name.includes('impact')) {
            this.music.synth.instrumentEngine.playNoiseNote(this.music.soundEngine.audioContext.currentTime, 0.2, 0.8, this.music.synth.masterGain);
        }
    }

    /**
     * Forces the music engine to switch to a specific drum pattern.
     * @param {string} patternName - The key of the pattern in drumbeats.json (e.g., 'Trap', 'Waltz').
     */
    playPattern(patternName) {
        if (!this.music || !this.music.drumPatterns) return;
        
        const pattern = this.music.drumPatterns[patternName];
        if (pattern) {
            Logger.message(`T13NE_AudioDirector: Switching rhythm to '${patternName}'`);
            // This requires the music engine to support hot-swapping rhythm, 
            // which might require a re-generation or a dedicated method.
            // For now, we'll log it as a directive for the music engine's next update cycle.
            // Ideally: this.music.setRhythm(pattern);
        }
    }

    /**
     * Injects data from the current scene to adapt the audio.
     * @param {object} sceneData - { type, location, characters }
     */
    injectSceneData(sceneData) {
        this.activeSceneType = sceneData.type;
        
        // Auto-adjust mood based on scene type
        if (sceneData.type === 'Combat' || sceneData.type === 'Ordeal') {
            this.setMood('Action', 0.8);
            this.playPattern('Driving');
        } else if (sceneData.type === 'Mystery' || sceneData.type === 'Investigation') {
            this.setMood('Eerie', 0.6);
            this.playPattern('Ambient');
        } else {
            this.setMood('Calm', 0.3);
            this.playPattern('BasicRock');
        }

        // If characters are present, maybe weave their leitmotifs?
        if (sceneData.characters && this.music) {
            // Play the leitmotif of the most prominent character
            const prominent = sceneData.characters[0];
            if (prominent) {
                // Slight delay to let the scene settle
                setTimeout(() => {
                    this.music.playCharacterComposition(prominent);
                }, 2000);
            }
        }
    }
}

export default new T13NE_AudioDirector();