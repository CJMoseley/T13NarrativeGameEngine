/**
 * @module UHPP/UniversalPipeline
 * @description Orchestrates the 5-stage procedural generation pipeline.
 */
export class UniversalPipeline {
    constructor() {
        this.stages = [];
    }

    /**
     * Adds a stage to the pipeline.
     * @param {object} stage - An object with an execute(context) method.
     * @returns {UniversalPipeline} The pipeline instance for chaining.
     */
    addStage(stage) {
        this.stages.push(stage);
        return this;
    }

    /**
     * Executes the pipeline.
     * @param {object} initialContext - Initial data and configuration.
     * @returns {Promise<object>} The final context after all stages.
     */
    async execute(initialContext = {}) {
        let context = { ...initialContext };

        // Ensure some basic context structure
        if (!context.grid) context.grid = null;
        if (!context.weights) context.weights = [];
        if (!context.rules) context.rules = [];
        if (!context.pinnedTiles) context.pinnedTiles = new Map(); // key: "x,y,z", value: tileID

        for (const stage of this.stages) {
            console.log(`UHPP: Executing stage ${stage.constructor.name}`);
            context = (await stage.execute(context)) || context;
        }

        return context;
    }
}
