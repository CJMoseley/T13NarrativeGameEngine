import Logger from "../../core/Logger.js";

/**
 * T13NE GameState Module
 * Handles the serialization (saving) and deserialization (loading) of the entire game state.
 */
class T13NE_GameState {
    constructor() {
        this.initialized = false;
        this.t13ne = null;
    }

    initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;
        this.initialized = true;
        Logger.message('T13NE_GameState: Initialized.');
    }

    /**
     * Captures the entire game state and saves it into decentralized storage if possible.
     * @returns {Promise<string>} A JSON string representing the game state (for legacy/local use).
     */
    async save() {
        if (!this.initialized) {
            Logger.error("GameState module not initialized.");
            return null;
        }

        Logger.message("GameState: Starting save process...");

        const Plots = this.t13ne.getModule('Plots');
        const CardsAPI = this.t13ne.getModule('CardsAPI');
        const Tension = this.t13ne.getModule('Tension');
        const Drama = this.t13ne.getModule('Drama');
        const Referee = this.t13ne.getModule('Referee');
        const Codex = this.t13ne.getModule('Codex');
        const GameModule = this.t13ne.getModule('Game');

        // 1. If there's an active game, save into the decentralized Store
        const activeGame = GameModule?.getActiveGame();
        if (activeGame && Codex.saveGame) {
            const entityIds = [
                ...(activeGame.plots || []),
                ...(activeGame.characters || []),
                ...(activeGame.descendants || []),
                ...(activeGame.annexes || []),
                ...(activeGame.tapestries || []),
                ...(activeGame.threads || [])
            ];
            const entitiesToSave = entityIds
                .map(id => GameModule.getEntity(id))
                .filter(ent => !!ent);

            await Codex.saveGame(activeGame, entitiesToSave);
        }

        // 2. Prepare the full state object (Legacy Blob/LocalStorage)
        const state = {
            timestamp: Date.now(),
            plots: Plots.plots.map(p => this._serializeSuperKnot(p)),
            characters: Referee.getCharacters().map(c => this._serializeSuperKnot(c)),
            deckState: {
                currentDeck: CardsAPI.deck.currentDeck.map(c => c.id),
                discardPile: CardsAPI.deck.discardPile.map(c => c.id),
                sourceDeckIds: Array.from(CardsAPI.deck.sourceDecks.keys())
            },
            tensionState: {
                scene: Tension.getSceneSuspense(),
                act: Tension.currentActSuspense,
                plot: Tension.currentPlotSuspense
            },
            dramaState: {
                pool: Drama.dramaPool
            },
            gameState: GameModule?.serialize(),
            codexChanges: Codex.getUnsavedChanges()
        };

        const tapestries = [];
        if (GameModule) {
            GameModule.getAllGames().forEach(game => {
                game.tapestries.forEach(id => {
                    const ent = GameModule.getEntity(id);
                    if (ent && ent.id?.startsWith('tap-')) {
                        tapestries.push(ent);
                    }
                });
            });
        }
        state.tapestries = tapestries;

        Logger.message("GameState: Save process complete.");
        return JSON.stringify(state, null, 2);
    }

    /**
     * A helper to serialize SuperKnot objects (Characters, Plots, Descendants).
     * This is a simplified version. A real implementation would be more robust.
     * @param {SuperKnot} knot - The object to serialize.
     * @returns {object} A plain, serializable object.
     */
    _serializeSuperKnot(knot) {
        // This would recursively serialize annexes, hitches, etc.
        // For now, we'll just grab the data that is already mostly primitive.
        const data = { ...knot };

        // Convert complex objects to IDs or serializable data
        data.knot = knot.knot.serialize(); // Use the Knot's own serializer
        data.swayAccount = knot.swayAccount.getAllBalances();
        data.facetweb = knot.facetweb; // Assumes T13Tapestry is serializable
        data.psychosocialSpace = knot.psychosocialSpace; // Assumes this is serializable

        // Replace object references with IDs
        data.masterAnnex = knot.masterAnnex ? knot.masterAnnex.proficiencyId || knot.masterAnnex.name : null;
        data.subAnnexes = knot.subAnnexes.map(a => a.proficiencyId || a.name);
        data.hitches = knot.hitches.map(h => h.proficiencyId || h.name);
        data.descendants = knot.descendants.map(d => d.proficiencyId || d.name);
        data.characterArcs = knot.characterArcs.map(a => a.id);

        // Serialize State Machines
        if (knot.stateMachine && typeof knot.stateMachine.serialize === 'function') {
            data.stateMachine = knot.stateMachine.serialize();
        }
        if (knot.actStateMachine && typeof knot.actStateMachine.serialize === 'function') {
            data.actStateMachine = knot.actStateMachine.serialize();
        }

        // Remove non-serializable parts
        delete data.codexLoader;
        delete data.t13ne;
        delete data.yarnTeller;

        return data;
    }

    /**
     * Loads a game state from a JSON string or a URL.
     * @param {string} source - The JSON string or a URL to a JSON file.
     * @returns {Promise<boolean>} True if successful.
     */
    async load(source) {
        if (!this.initialized) {
            Logger.error("GameState module not initialized.");
            return false;
        }

        let state;
        try {
            if (source.trim().startsWith('{') || source.trim().startsWith('[')) {
                state = JSON.parse(source);
            } else {
                Logger.message(`GameState: Fetching state from ${source}...`);
                const response = await fetch(source);
                if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
                state = await response.json();
            }
        } catch (e) {
            Logger.error(`GameState: Failed to parse/fetch state: ${e.message}`);
            return false;
        }

        Logger.message("GameState: Starting reconstruction...");

        const Plots = this.t13ne.getModule('Plots');
        const Referee = this.t13ne.getModule('Referee');
        const Tension = this.t13ne.getModule('Tension');
        const Drama = this.t13ne.getModule('Drama');
        const StateMachine = this.t13ne.getModule('StateMachine');

        // 1. Reset current game state
        if (Plots) Plots.plots = [];
        if (Referee) Referee.characters = [];

        // 2. Restore module states
        if (state.gameState) {
            this.t13ne.getModule('Game')?.deserialize(state.gameState);
        }

        if (state.tensionState && Tension) {
            Tension.setSceneSuspense(state.tensionState.scene);
            Tension.setActSuspense(state.tensionState.act);
            Tension.setPlotSuspense(state.tensionState.plot);
        }
        if (state.dramaState && Drama) {
            Drama.dramaPool = state.dramaState.pool;
        }

        // 3. Reconstruct Plots
        if (state.plots && Plots) {
            for (const pData of state.plots) {
                try {
                    // Check if T13Plot is exported from Plots module
                    const T13Plot = Plots.T13Plot;
                    if (!T13Plot) throw new Error("T13Plot class not found in Plots module.");

                    const plot = new T13Plot(pData, this.t13ne);

                    // Reconstruct State Machines
                    if (pData.stateMachine && StateMachine) {
                        plot.stateMachine = StateMachine.reconstruct(pData.stateMachine, plot);
                    }
                    if (pData.actStateMachine && StateMachine) {
                        plot.actStateMachine = StateMachine.reconstruct(pData.actStateMachine, plot);
                    }

                    Plots.plots.push(plot);
                    GameModule?.registerEntity(plot);
                } catch (e) {
                    Logger.error(`GameState: Failed to reconstruct plot '${pData.Name}': ${e.message}`);
                }
            }
        }

        // 4. Reconstruct Characters
        if (state.characters && Referee) {
            for (const cData of state.characters) {
                try {
                    const { Character } = await import("../characters/t13ne-chars.js");
                    const char = new Character(this.t13ne.getModule('Codex'), cData);
                    Referee.addCharacter(char);
                    GameModule?.registerEntity(char);
                } catch (e) {
                    Logger.error(`GameState: Failed to reconstruct character '${cData.name}': ${e.message}`);
                }
            }
        }

        // 5. Reconstruct Tapestries
        const GameModule = this.t13ne.getModule('Game');
        if (state.tapestries && GameModule) {
            const T13Tapestry = (await import("../world/T13Tapestry.js")).default;
            for (const tData of state.tapestries) {
                try {
                    const tap = new T13Tapestry(tData);
                    GameModule.registerEntity(tap);
                } catch (e) {
                    Logger.error(`GameState: Failed to reconstruct tapestry '${tData.id}': ${e.message}`);
                }
            }
        }

        Logger.message(`GameState: Load complete. Reconstructed ${(Plots ? Plots.plots.length : 0)} plots, ${(Referee ? Referee.getCharacters().length : 0)} characters, and ${(state.tapestries ? state.tapestries.length : 0)} tapestries.`);
        return true;
    }

    /**
     * Exports the current state as a 'Narrative Glob' JSON string.
     */
    async exportGlob() {
        return await this.save();
    }
}

export default new T13NE_GameState();





