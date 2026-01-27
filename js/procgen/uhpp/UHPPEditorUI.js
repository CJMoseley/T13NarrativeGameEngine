import T13NE_Sway from '../../plugins/t13ne/modules/t13ne-sway.js';

/**
 * @module UHPP/UHPPEditorUI
 * @description UI components for configuring the UHPP pipeline in the T13NE Workbench.
 */
export class UHPPEditorUI {
    constructor(workbench) {
        this.workbench = workbench;
    }

    /**
     * Renders the UHPP configuration panel in the inspector.
     * @param {object} entity - The selected Descendant or Location.
     * @param {HTMLElement} container - The container to render into.
     */
    renderInspector(entity, container) {
        const div = document.createElement('div');
        div.className = 'uhpp-inspector-panel card';
        div.style.marginTop = '1rem';
        div.style.borderTop = '2px solid var(--accent-purple)';

        const title = document.createElement('h4');
        title.textContent = 'Universal Hybrid Procedural Pipeline';
        title.style.marginBottom = '1rem';
        div.appendChild(title);

        // Grid Dimensions based on Sway Size
        const size = entity.masterAnnex?.size || 10;
        const dims = this.getGridDimensionsForSize(size);

        const dimsInfo = document.createElement('p');
        dimsInfo.innerHTML = `<strong>Grid Size:</strong> ${dims.x} x ${dims.y} x ${dims.z} (Sway Chi: ${size})`;
        dimsInfo.style.fontSize = '0.8rem';
        div.appendChild(dimsInfo);

        // Pipeline Configuration
        const form = document.createElement('div');
        form.innerHTML = `
            <div class="form-group">
                <label>Noise Scale</label>
                <input type="range" id="uhpp-noise-scale" min="0.01" max="0.5" step="0.01" value="0.05">
            </div>
            <div class="form-group">
                <label>L-System Iterations</label>
                <input type="number" id="uhpp-ls-iter" value="2" min="0" max="5">
            </div>
            <div class="form-group">
                <label>CA Iterations</label>
                <input type="number" id="uhpp-ca-iter" value="3" min="0" max="10">
            </div>
            <div class="form-group">
                <label>Surface Method</label>
                <select id="uhpp-surface-method">
                    <option value="INSTANCED">Discrete (Instanced)</option>
                    <option value="MARCHING_CUBES">Continuous (Marching Cubes)</option>
                </select>
            </div>
            <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" id="uhpp-run">Run Pipeline</button>
        `;
        div.appendChild(form);

        container.appendChild(div);

        // Handler
        div.querySelector('#uhpp-run').onclick = () => this.runPipeline(entity, {
            noiseScale: parseFloat(div.querySelector('#uhpp-noise-scale').value),
            lsIter: parseInt(div.querySelector('#uhpp-ls-iter').value),
            caIter: parseInt(div.querySelector('#uhpp-ca-iter').value),
            surfaceMethod: div.querySelector('#uhpp-surface-method').value,
            gridDimensions: dims
        });
    }

    /**
     * Maps Sway Chi size to grid dimensions.
     */
    getGridDimensionsForSize(chi) {
        // Logarithmic scaling for grid dimensions
        const base = Math.max(5, Math.floor(Math.pow(chi, 1.2)));
        // Locations are often flatter than they are wide (e.g. rooms, planets)
        return {
            x: base,
            y: Math.max(5, Math.floor(base * 0.5)),
            z: base
        };
    }

    async runPipeline(entity, config) {
        this.workbench.log(`UHPP: Starting pipeline for ${entity.name || 'Unnamed Entity'}...`);

        // Dynamic imports to avoid circular dependencies
        const { UniversalPipeline } = await import('./UniversalPipeline.js');
        const { NoiseHeuristic } = await import('./NoiseHeuristic.js');
        const { LSystemBridge } = await import('./LSystemBridge.js');
        const { WFCManager } = await import('./WFCManager.js');
        const { CellularAutomata } = await import('./CellularAutomata.js');
        const { SurfaceSynth } = await import('./SurfaceSynth.js');

        const pipeline = new UniversalPipeline();
        pipeline
            .addStage(new NoiseHeuristic())
            .addStage(new LSystemBridge())
            .addStage(new WFCManager())
            .addStage(new CellularAutomata())
            .addStage(new SurfaceSynth());

        // Mock TileSet for demonstration
        const tileSet = {
            tiles: [
                { type: 'Void', weight: 1, primitive: 'Box', color: 0x000000 },
                { type: 'Path', weight: 1, primitive: 'Box', color: 0x5555ff },
                { type: 'Wall', weight: 5, primitive: 'Box', color: 0x888888 },
                { type: 'Peak', weight: 1, primitive: 'Cone', color: 0xffaa00 }
            ],
            weights: [1, 1, 5, 1],
            tileTypes: ['Void', 'Path', 'Wall', 'Peak']
        };

        // Standard WFC rules for a 3D grid
        // Axis 0: Y, 1: X, 2: Z
        const rules = [
            [0, 2, 2], [1, 2, 2], [2, 2, 2], // Walls can be next to walls
            [0, 0, 0], [1, 0, 0], [2, 0, 0], // Void can be next to void
            [0, 2, 0], [1, 2, 0], [2, 2, 0], // Walls can be next to void
            [0, 1, 2], [1, 1, 2], [2, 1, 2], // Path can be next to walls
            [0, 1, 0], [1, 1, 0], [2, 1, 0]  // Path can be next to void
        ];

        const initialContext = {
            gridDimensions: config.gridDimensions,
            noiseScale: config.noiseScale,
            lsystemConfig: {
                axiom: 'F',
                productions: { 'F': 'F[+F]F[-F]F' },
                iterations: config.lsIter
            },
            tileSet,
            weights: tileSet.weights,
            rules,
            caIterations: config.caIter,
            surfaceMethod: config.surfaceMethod
        };

        try {
            const result = await pipeline.execute(initialContext);
            this.workbench.log("UHPP: Pipeline execution successful.", "success");

            // Store result in entity
            entity.uhppOutput = {
                config: initialContext,
                // In a real scenario, we might bake the grid or store the mesh data
            };

            // In a real engine integration, we'd pass the result.mesh to the Three.js scene
            if (window.gameEngine && window.gameEngine.scene) {
                const { RenderBridge } = await import('./RenderBridge.js');
                const bridge = new RenderBridge(window.gameEngine.scene.threeScene);
                bridge.render(result);
            }

        } catch (error) {
            console.error(error);
            this.workbench.log(`UHPP Error: ${error.message}`, "error");
        }
    }
}
