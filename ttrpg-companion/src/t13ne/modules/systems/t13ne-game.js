import Logger from "../../core/Logger.js";
import T13Name from "../characters/t13ne-names.js";
import PRNG from "./t13ne-prng.js";
import ProcGen from "../../procgen/ProcGen.js";
import WasmManager from "../../wasm/WasmManager.js";

/**
 * Represents a T13 Game instance.
 * Games act as the top-level container for all narrative entities.
 */
export class T13Game {
    constructor(data = {}) {
        this.id = data.id || `game-${Date.now()}-${Math.floor(PRNG.nextDouble() * 1000)}`;

        const t13n = new T13Name(data.Name || data.name || 'New Game');
        this.name = t13n.common;
        this.Name = t13n.common;
        this.fullName = data.FullName || data.fullName || (t13n.full !== this.name ? t13n.full : `Game: ${this.name}`);
        this.altName = data.Alt_Name || data.altName || t13n.aliases;
        this.t13Name = t13n.asArray;

        this.type = data.type || 'Campaign';
        this.description = data.description || '';
        this.seed = data.seed || `seed-${this.name}-${this.id}`;

        // Members of the game (IDs)
        this.plots = data.plots || [];
        this.characters = data.characters || [];
        this.descendants = data.descendants || [];
        this.annexes = data.annexes || [];
        this.tapestries = data.tapestries || [];
        this.threads = data.threads || [];

        this.created = data.created || Date.now();
        this.lastModified = data.lastModified || Date.now();

        // Card System State
        this.cardState = data.cardState || {
            decks: [], // Array of simplified card objects
            discard: [],
            hands: {}, // ownerId -> []
            spreads: [], // { id, spreadId, cards: [] }
            pools: {} // poolId -> []
        };

        // HARDENING: Register with WASM Core if available
        if (WasmManager.initialized && WasmManager.core) {
            try {
                this._hardened = new WasmManager.core.HardenedGame(this.serialize());
                console.log(`T13Game: Hardened instance created for "${this.name}"`);
            } catch (e) {
                Logger.warn("T13Game: Failed to create hardened WASM instance.", e);
            }
        }
    }

    addPlot(plotId) {
        if (!this.plots.includes(plotId)) {
            this.plots.push(plotId);
            this.lastModified = Date.now();
        }
    }

    addCharacter(charId) {
        if (!this.characters.includes(charId)) {
            this.characters.push(charId);
            this.lastModified = Date.now();
        }
    }

    addDescendant(id) {
        if (!this.descendants.includes(id)) {
            this.descendants.push(id);
            this.lastModified = Date.now();
        }
    }

    addAnnex(id) {
        if (!this.annexes.includes(id)) {
            this.annexes.push(id);
            this.lastModified = Date.now();
        }
    }

    addTapestry(id) {
        if (!this.tapestries.includes(id)) {
            this.tapestries.push(id);
            this.lastModified = Date.now();
        }
    }

    addThread(id) {
        if (!this.threads.includes(id)) {
            this.threads.push(id);
            this.lastModified = Date.now();
        }
    }

    addEntity(obj) {
        if (!obj || !obj.id) return;
        const typeName = obj.constructor.name;

        if (typeName === 'T13Plot' || !!obj.rank) this.addPlot(obj.id);
        else if (typeName === 'Character' || !!obj.model) this.addCharacter(obj.id);
        else if (typeName === 'Annex' || !!obj.proficiencyIds) this.addAnnex(obj.id);
        else if (obj.id.startsWith('tap-')) this.addTapestry(obj.id);
        else if (obj.id.startsWith('desc-')) this.addDescendant(obj.id);
        else if (obj.id.startsWith('prof-')) this.addThread(obj.id);
        else {
            // Generic fallback
            if (!this.descendants.includes(obj.id)) this.addDescendant(obj.id);
        }
    }

    serialize() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            description: this.description,
            seed: this.seed,
            plots: this.plots,
            characters: this.characters,
            descendants: this.descendants,
            annexes: this.annexes,
            tapestries: this.tapestries,
            threads: this.threads,
            created: this.created,
            lastModified: this.lastModified,
            cardState: this.cardState
        };
    }
}

/**
 * T13NE_Game Module
 * Manages active games within the engine.
 */
class T13NE_Game {
    constructor() {
        this.initialized = false;
        this.t13ne = null;
        this.games = [];
        this.activeGameId = null;
        this.entityVault = new Map(); // Global registry for all entities
    }

    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;

        // Create default games if none exist
        if (this.games.length === 0) {
            this.createGame({ name: 'T13 Core', type: 'Core', description: 'T13 Narrative Engine official core content.', seed: 't13core-v1' });
            this.createGame({ name: 'Wormhole Racers', type: 'Campaign', description: 'Official Wormhole Racers campaign.', seed: 'wormhole-v1' });
        }

        this.initialized = true;
        this.syncGameSeed();
        Logger.message("T13NE_Game: Initialized.");
    }

    createGame(data) {
        const game = new T13Game(data);
        this.games.push(game);
        if (!this.activeGameId) this.activeGameId = game.id;
        this.entityVault.set(game.id, game);
        Logger.message(`T13NE_Game: Created game "${game.name}"`);
        return game;
    }

    registerEntity(obj) {
        if (!obj || !obj.id) return;
        this.entityVault.set(obj.id, obj);
        const activeGame = this.getActiveGame();
        if (activeGame) {
            activeGame.addEntity(obj);
        } else {
            Logger.warn(`T13NE_Game: No active game found to register entity ${obj.name || obj.id}. Entity stored in vault.`);
        }
    }

    getEntity(id) {
        if (!id) return null;
        if (this.entityVault.has(id)) return this.entityVault.get(id);

        // Search in other modules as fallback
        const Plots = this.t13ne?.getModule('Plots');
        if (Plots) {
            const plot = Plots.getPlot(id);
            if (plot) return plot;
        }

        const Referee = this.t13ne?.getModule('Referee');
        if (Referee) {
            const char = Referee.getCharacter(id);
            if (char) return char;
        }

        const Threads = this.t13ne?.getModule('Threads');
        if (Threads) {
            const annex = Threads.getAnnexes().getAnnex(id);
            if (annex) return annex;
        }

        return null;
    }

    getAllEntities() {
        return Array.from(this.entityVault.values());
    }

    recoverOrphans() {
        const Referee = this.t13ne.getModule('Referee');
        const Plots = this.t13ne.getModule('Plots');
        let recovered = 0;

        for (const entity of this.entityVault.values()) {
            const type = entity.constructor.name;

            // Recover Characters
            if ((type === 'Character' || entity.charType) && Referee) {
                if (!Referee.getCharacter(entity.id)) {
                    Referee.addCharacter(entity);
                    recovered++;
                }
            }

            // Recover Plots
            if ((type === 'T13Plot' || entity.rank) && Plots) {
                if (!Plots.getPlot(entity.id)) {
                    Plots.plots.push(entity);
                    recovered++;
                }
            }
        }

        if (recovered > 0) {
            Logger.message(`T13NE_Game: Recovered ${recovered} orphaned entities.`);
        }
        return recovered;
    }

    getGame(id) {
        return this.games.find(g => g.id === id);
    }

    getActiveGame() {
        return this.getGame(this.activeGameId) || this.games[0];
    }

    setActiveGame(id) {
        const game = this.getGame(id);
        if (game) {
            this.activeGameId = id;
            this.syncGameSeed();
            return true;
        }
        return false;
    }

    /**
     * Synchronizes the global PRNG and ProcGen systems with the active game's seed.
     */
    syncGameSeed() {
        const activeGame = this.getActiveGame();
        if (activeGame && activeGame.seed) {
            Logger.message(`T13NE_Game: Syncing global seed to active game: "${activeGame.seed}"`);
            PRNG.setSeed(activeGame.seed);
            ProcGen.sync();
        }
    }

    getAllGames() {
        return this.games;
    }

    /**
     * Loads a game from a definition file in the codex.
     * @param {string} definitionKey - The key/name of the definition file.
     */
    async loadGameFromDefinition(definitionKey) {
        const Codex = this.t13ne.getModule('Codex');
        if (!Codex) return null;

        const defData = await Codex.getData('definitions', definitionKey);
        if (defData) {
            const game = this.createGame(defData);
            Logger.message(`T13NE_Game: Loaded game "${game.name}" from definition "${definitionKey}".`);
            return game;
        }
        return null;
    }

    /**
     * Finds which game an entity belongs to.
     */
    findEntityGame(entityId) {
        if (!entityId) return null;
        return this.games.find(g =>
            (g.plots && g.plots.includes(entityId)) ||
            (g.characters && g.characters.includes(entityId)) ||
            (g.descendants && g.descendants.includes(entityId)) ||
            (g.annexes && g.annexes.includes(entityId)) ||
            (g.tapestries && g.tapestries.includes(entityId)) ||
            (g.threads && g.threads.includes(entityId))
        );
    }

    serialize() {
        return {
            activeGameId: this.activeGameId,
            games: this.games.map(g => g.serialize())
        };
    }

    deserialize(data) {
        if (!data) return;
        this.games = (data.games || []).map(g => new T13Game(g));
        this.activeGameId = data.activeGameId || (this.games[0]?.id || null);
    }
}

export default new T13NE_Game();






