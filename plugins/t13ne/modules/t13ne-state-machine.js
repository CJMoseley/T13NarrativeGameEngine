import Logger from '@plugins/t13ne/core/Logger.js';

/**
 * Generic State Machine for T13NE structures.
 */
class StateMachine {
    constructor(config) {
        this.states = config.states || {};
        this.initialState = config.initial || null;
        this.currentState = this.initialState;
        this.context = config.context || {};
        this.history = [];
    }

    transition(action) {
        const stateConfig = this.states[this.currentState];
        if (!stateConfig) return false;

        const nextState = stateConfig.transitions ? stateConfig.transitions[action] : null;

        if (nextState && this.states[nextState]) {
            Logger.message(`StateMachine: Transitioning from ${this.currentState} to ${nextState} via ${action}.`);

            if (stateConfig.onExit) stateConfig.onExit(this.context);

            this.history.push({ from: this.currentState, to: nextState, action, timestamp: Date.now() });
            this.currentState = nextState;

            const nextStateConfig = this.states[nextState];
            if (nextStateConfig.onEnter) nextStateConfig.onEnter(this.context);

            return true;
        }

        Logger.warn(`StateMachine: Invalid transition ${action} from ${this.currentState}.`);
        return false;
    }

    getState() {
        return this.currentState;
    }
    serialize() {
        return {
            currentState: this.currentState,
            context: this.context,
            history: this.history
        };
    }

    deserialize(data) {
        if (!data) return;
        this.currentState = data.currentState || this.initialState;
        this.context = data.context || {};
        this.history = data.history || [];
        Logger.message(`StateMachine restored to state: ${this.currentState}`);
    }
}

/**
 * Specific State Machine for T13 Plots (Frame -> Loom -> Zenith).
 */
class PlotStateMachine extends StateMachine {
    constructor(plotContext) {
        super({
            context: plotContext,
            initial: 'Frame',
            states: {
                'Frame': {
                    transitions: { 'HOOKS_SET': 'Loom' },
                    onEnter: (ctx) => Logger.message(`Plot ${ctx.Name}: Entering Frame. Establish Hooks and Revelations.`),
                    onExit: (ctx) => Logger.message(`Plot ${ctx.Name}: Frame complete. Characters Hooked.`)
                },
                'Loom': {
                    transitions: { 'CLIMAX_APPROACHING': 'Zenith', 'RELAX': 'Loom' }, // Loom loops on itself (Warp/Weft)
                    onEnter: (ctx) => Logger.message(`Plot ${ctx.Name}: Entering Loom. Weaving Warps and Wefts.`)
                },
                'Zenith': {
                    transitions: { 'RESOLUTION': 'Resolved' },
                    onEnter: (ctx) => Logger.message(`Plot ${ctx.Name}: Entering Zenith. High Stakes Resolution.`)
                },
                'Resolved': {
                    onEnter: (ctx) => Logger.message(`Plot ${ctx.Name}: Resolved.`)
                }
            }
        });
    }

    serialize() {
        // Exclude the context from serialization if it's a large circular object (like T13Plot)
        // GameState handles the context reconstruction
        return {
            type: 'PlotStateMachine',
            state: super.serialize()
        };
    }
}

/**
 * Specific State Machine for T13 Warp Scenes (Ends -> Fray -> Snag).
 */
class WarpStateMachine extends StateMachine {
    constructor(sceneContext) {
        super({
            context: sceneContext,
            initial: 'The Ends',
            states: {
                'The Ends': {
                    transitions: { 'ENGAGE': 'The Fray' },
                    onEnter: () => Logger.message("Warp: Establishing The Ends (Goals/Quests).")
                },
                'The Fray': {
                    transitions: { 'COMPLICATE': 'The Snag', 'RESOLVE': 'Complete' },
                    onEnter: () => Logger.message("Warp: Entering The Fray (Action/Conflict).")
                },
                'The Snag': {
                    transitions: { 'RESOLVE': 'Complete' },
                    onEnter: () => Logger.message("Warp: Encountering The Snag (Complication).")
                },
                'Complete': {
                    onEnter: () => Logger.message("Warp: Scene Complete.")
                }
            }
        });
    }

    serialize() {
        return {
            type: 'WarpStateMachine',
            state: super.serialize()
        };
    }
}

/**
 * State Machine for tracking Scene progression within an Act.
 */
class ActStateMachine extends StateMachine {
    constructor(actContext) {
        super({
            context: actContext, // Expected: { scenes: [], currentSceneIndex: 0, plotName: '' }
            initial: 'Pending',
            states: {
                'Pending': {
                    transitions: { 'START': 'NextScene' }
                },
                'NextScene': {
                    transitions: { 'SCENE_STARTED': 'SceneActive', 'NO_MORE_SCENES': 'ActComplete' },
                    onEnter: (ctx) => Logger.message(`Act (${ctx.plotName}): Preparing Scene ${ctx.currentSceneIndex + 1} of ${ctx.scenes.length}.`)
                },
                'SceneActive': {
                    transitions: { 'SCENE_RESOLVED': 'SceneDone' },
                    onEnter: (ctx) => Logger.message(`Act (${ctx.plotName}): Scene ${ctx.currentSceneIndex + 1} is Active.`)
                },
                'SceneDone': {
                    transitions: { 'NEXT': 'NextScene' },
                    onEnter: (ctx) => { ctx.currentSceneIndex++; }
                },
                'ActComplete': {
                    onEnter: (ctx) => Logger.message(`Act (${ctx.plotName}): Act Complete.`)
                }
            }
        });
    }

    serialize() {
        return {
            type: 'ActStateMachine',
            state: super.serialize()
        };
    }
}

/**
 * State Machine for tracking Ordeal progression through Stages.
 */
class OrdealStateMachine extends StateMachine {
    constructor(ordealContext) {
        super({
            context: ordealContext, // The Ordeal instance
            initial: 'Pending',
            states: {
                'Pending': {
                    transitions: { 'START': 'StageActive' },
                    onEnter: (ctx) => Logger.message(`Ordeal ${ctx.id}: Initialized and pending start.`)
                },
                'StageActive': {
                    transitions: { 'STAGE_CLEARED': 'StageEnd', 'ABORT': 'Aborted' },
                    onEnter: (ctx) => {
                        Logger.message(`Ordeal ${ctx.id}: Stage ${ctx.currentStageIndex + 1} is now active.`);
                        // The Ordeal object will call nextRound() upon entering this state.
                    }
                },
                'StageEnd': {
                    transitions: { 'ADVANCE': 'StageActive', 'FINISH': 'Completed' },
                    onEnter: (ctx) => Logger.message(`Ordeal ${ctx.id}: Stage ${ctx.currentStageIndex + 1} cleared.`)
                },
                'Completed': {
                    onEnter: (ctx) => ctx.completeOrdeal(true) // Pass flag to avoid loop
                },
                'Aborted': {
                    onEnter: (ctx) => {
                        ctx.isActive = false;
                        Logger.message(`Ordeal ${ctx.id}: Ordeal aborted.`);
                    }
                }
            }
        });
    }

    serialize() {
        return {
            type: 'OrdealStateMachine',
            state: super.serialize()
        };
    }
}

/**
 * Module wrapper for State Machines.
 */
class T13NE_StateMachine {
    constructor() {
        this.initialized = false;
        this.t13ne = null;
    }

    async initialize(t13ne) {
        if (this.initialized) return;
        this.t13ne = t13ne;
        this.initialized = true;
        Logger.message('T13NE_StateMachine: Initialized.');
    }

    createPlotMachine(context) {
        return new PlotStateMachine(context);
    }

    createWarpMachine(context) {
        return new WarpStateMachine(context);
    }

    createActMachine(context) {
        return new ActStateMachine(context);
    }

    createOrdealMachine(context) {
        return new OrdealStateMachine(context);
    }

    /**
     * Reconstructs a state machine from serialized data.
     * @param {object} data - Serialized data.
     * @param {object} context - The context to attach.
     * @returns {StateMachine|null}
     */
    reconstruct(data, context) {
        if (!data || !data.type) return null;

        let machine;
        switch (data.type) {
            case 'PlotStateMachine': machine = this.createPlotMachine(context); break;
            case 'WarpStateMachine': machine = this.createWarpMachine(context); break;
            case 'ActStateMachine': machine = this.createActMachine(context); break;
            case 'OrdealStateMachine': machine = this.createOrdealMachine(context); break;
            default: machine = new StateMachine({ context });
        }

        if (data.state) {
            machine.deserialize(data.state);
        }
        return machine;
    }
}

export default new T13NE_StateMachine();
