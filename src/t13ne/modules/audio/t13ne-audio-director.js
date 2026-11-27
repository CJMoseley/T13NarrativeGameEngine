import Logger from '../../core/Logger.js';

/**
 * T13NE Audio Director Module
 * Bridges T13Session events (Tension, Ordeals, Tests, Cards, Hitches, Wounds, VTT Boards)
 * into SoundEngine buses (`music`, `sfx`, `ambience`), procedural Foley, and rhythm patterns.
 */
class T13NE_AudioDirector {
    constructor() {
        this.t13ne = null;
        this.music = null;
        this.soundEngine = null;
        this.initialized = false;
        this.currentMood = 'Neutral';
        this.activeSceneType = null;
        this.activePattern = null;
        this.sfxLog = [];
        this._boundUnsubs = [];
    }

    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;
        this.music = t13ne?.getModule?.('Music') ?? null;
        this.soundEngine = t13ne?.soundEngine ?? t13ne?.getModule?.('SoundEngine') ?? null;

        if (!this.music) {
            Logger.warn('T13NE_AudioDirector: Music module not found. Audio Director functionality limited.');
        }

        this.initialized = true;
        Logger.message('T13NE_AudioDirector: Initialized and ready to direct.');
    }

    setMood(mood, intensity = 0.5) {
        this.currentMood = mood;
        Logger.message(`T13NE_AudioDirector: Setting mood to ${mood} (Intensity: ${intensity})`);

        if (this.music) {
            let tension = 0;
            switch (String(mood).toLowerCase()) {
                case 'action': tension = 8 + (intensity * 2); break;
                case 'tense': tension = 5 + (intensity * 3); break;
                case 'eerie': tension = 3 + (intensity * 2); break;
                case 'calm': tension = 1; break;
                default: tension = intensity * 5;
            }
            const mockPlot = { tensionLevel: Math.min(10, Math.floor(tension)) };
            this.music.updateAmbience?.(mockPlot);
        }
    }

    /**
     * Synthesizes or triggers Foley on SoundEngine's `sfx` or `ambience` bus.
     */
    playSFX(type, name) {
        const entry = { type, name, ts: Date.now() };
        this.sfxLog.push(entry);
        if (this.sfxLog.length > 50) this.sfxLog.shift();

        const ctx = this.soundEngine?.audioContext ?? this.music?.synth?.ctx;
        const sfxBus = this.soundEngine?.getBus?.('sfx') ?? this.music?.synth?.sfxGain ?? ctx?.destination;
        if (!ctx || !sfxBus) return entry;

        try {
            const now = ctx.currentTime ?? 0;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const lower = String(name).toLowerCase();

            if (lower.includes('dice')) {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(520, now + 0.12);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
                osc.connect(gain);
                gain.connect(sfxBus);
                osc.start(now);
                osc.stop(now + 0.18);
            } else if (lower.includes('card')) {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(680, now);
                osc.frequency.exponentialRampToValueAtTime(340, now + 0.08);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.connect(gain);
                gain.connect(sfxBus);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (lower.includes('hitch') || lower.includes('wound') || lower.includes('impact')) {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(55, now + 0.3);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.connect(gain);
                gain.connect(sfxBus);
                osc.start(now);
                osc.stop(now + 0.36);
            } else {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.connect(gain);
                gain.connect(sfxBus);
                osc.start(now);
                osc.stop(now + 0.16);
            }
        } catch (e) {
            Logger.warn(`T13NE_AudioDirector: Foley playback skipped (${e.message})`);
        }
        return entry;
    }

    /**
     * Hot-swaps the active drum/rhythm pattern in the music engine.
     */
    playPattern(patternName) {
        this.activePattern = patternName;
        if (!this.music) return;
        if (typeof this.music.setRhythm === 'function') {
            this.music.setRhythm(patternName);
        }
    }

    /**
     * Subscribes to a VTTSessionClient (or EventBus-style emitter) for live VTT audio cues.
     */
    bindSession(sessionClient) {
        this.unbindSession();
        if (!sessionClient || typeof sessionClient.on !== 'function') return;

        const unsub = sessionClient.on('event', (evt) => this.handleSessionEvent(evt));
        if (typeof unsub === 'function') this._boundUnsubs.push(unsub);
    }

    unbindSession() {
        for (const u of this._boundUnsubs) {
            try { u(); } catch (e) {}
        }
        this._boundUnsubs = [];
    }

    handleSessionEvent(evt) {
        if (!evt?.type) return;
        const p = evt.payload || {};
        switch (evt.type) {
            case 'Drama:PoolRolled':
            case 'Plot:Updated': {
                const tension = Number(p.tensionLevel ?? p.plot?.tensionLevel ?? 3);
                const mood = tension >= 7 ? 'Action' : tension >= 4 ? 'Tense' : 'Calm';
                this.setMood(mood, Math.min(1, tension / 10));
                break;
            }
            case 'Ordeal:Started':
                this.setMood('Action', 0.85);
                this.playPattern('Driving');
                this.playSFX('OneShot', 'ordeal-start');
                break;
            case 'Ordeal:StageDrawn':
                this.playSFX('OneShot', 'card-stage');
                break;
            case 'Ordeal:Resolved':
                this.setMood('Calm', 0.35);
                this.playPattern('BasicRock');
                break;
            case 'Test:Resolved':
            case 'Test:Performed':
            case 'RNG:Drawn':
                this.playSFX('OneShot', 'dice-roll');
                break;
            case 'Card:Drawn':
            case 'Card:DrawnPrivate':
            case 'Hand:DealtPrivate':
            case 'Card:Prepared':
            case 'Card:Played':
            case 'Yarn:Played':
            case 'Yarn:CardsPlayed':
            case 'Ordeal:CardsPlayed':
                this.playSFX('OneShot', 'card-play');
                break;
            case 'Hitch:Evaluated':
                this.playSFX('OneShot', 'hitch-sting');
                break;
            case 'Wound:Applied':
                this.playSFX('OneShot', 'wound-impact');
                break;
            default:
                break;
        }
    }

    injectSceneData(sceneData = {}) {
        this.activeSceneType = sceneData.type;
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

        if (sceneData.characters && this.music?.playCharacterComposition) {
            const prominent = sceneData.characters[0];
            if (prominent) {
                setTimeout(() => {
                    this.music.playCharacterComposition(prominent);
                }, 2000);
            }
        }
    }
}

export { T13NE_AudioDirector };
export default new T13NE_AudioDirector();
