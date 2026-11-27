/**
 * @module Games/WormholeRacers/WormholeRacersAdapter
 * @description Game adapter mounting Wormhole Racers simulation (GameEngine, LoreData, GalacticHistory)
 * onto the genre-agnostic T13 Engine only when running the space-racing game.
 */

import { GameEngine } from '../../core/GameEngine.js';
import { LoreData } from '../../procgen/lore/LoreData.js';
import { GalacticHistory } from '../../procgen/galaxy/GalacticHistory.js';
import { sharedAvatarCache } from '../../procgen/avatar/AvatarCache.js';

export class WormholeRacersAdapter {
    constructor() {
        this.id = 'wormhole-racers';
        this.name = 'Wormhole Racers';
    }

    createGameEngine(engine) {
        return new GameEngine(engine);
    }

    getLoreData() {
        return LoreData;
    }

    getGalacticHistory() {
        return GalacticHistory;
    }

    /**
     * Builds Wormhole Racers-specific loading tasks so core T13 Engine / VTT Companion
     * modes never need to initialize galaxies, ships, or race rosters.
     * @param {object} context - { viewManager, engine, gameEngine, loreDataManager, pluginManager, reportProgress }
     * @returns {Array<{name: string, action: Function}>}
     */
    buildLoaderTasks(context) {
        const { viewManager, engine, gameEngine, loreDataManager } = context;
        const tasks = [];

        if (gameEngine?.physicsEngine) {
            tasks.push({ name: 'Physics Engine', action: () => gameEngine.physicsEngine.init() });
        }
        if (loreDataManager) {
            tasks.push({ name: 'Lore Data', action: () => loreDataManager.load() });
        }
        if (gameEngine) {
            tasks.push({ name: 'Core Game Data', action: () => gameEngine.initializeBaseData() });
        }

        tasks.push({
            name: 'Prewarm Avatars',
            action: async () => {
                const roster = viewManager.pendingRaceRoster ?? {
                    crew: gameEngine?.playerCrew ?? (gameEngine?.playerCharacter ? [gameEngine.playerCharacter] : ['pilot-default']),
                    ships: gameEngine?.raceShips ?? [],
                    racers: gameEngine?.raceParticipants ?? []
                };
                if (viewManager.pendingRaceRoster) viewManager.pendingRaceRoster = null;
                await sharedAvatarCache.prewarmRoster(roster);
            }
        });

        tasks.push({
            name: 'Initialize Audio',
            action: async () => {
                let music = engine.getModule('Music');
                if (!music) {
                    const mod = await import('../../modules/audio/t13ne-music.js');
                    music = mod.default;
                    engine.registerModule?.('Music', music);
                }
                if (music) {
                    if (!music.initialized) {
                        await music.initialize(engine);
                    }
                    music.injectThemeComponents({ galaxy: gameEngine?.galaxy ?? null });
                    context.reportProgress?.('Priming Acoustic Harmonics...');
                    const theme = await music.createMainTheme(gameEngine);
                    if (theme) music.updateTrack(theme);
                }
            }
        });

        tasks.push({
            name: 'Building World',
            action: async () => {
                context.reportProgress?.('Initializing narrative sequence...');
                if (viewManager.sceneManager) {
                    viewManager.sceneManager.startIntro().catch(() => {});
                }
            }
        });

        return tasks;
    }
}

export default new WormholeRacersAdapter();
