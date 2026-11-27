import { FORMATION_MATERIALS } from '../avatar/AvatarFacetBody.js';
import { UHPP_PROP_TYPES, toVttPropTokenSpec } from './UHPPPropBuilder.js';
import { EventBus } from '../../core/EventBus.js';

/**
 * @module UHPP/UHPPEditorUI
 * @description UI components for configuring the UHPP pipeline and placing Formation-styled
 * 3D terrain blocks and Item Descendants directly onto the VTT scene.
 */
export class UHPPEditorUI {
    constructor(workbench, options = {}) {
        this.workbench = workbench;
        this.onPlaceOnVTT = options.onPlaceOnVTT ?? null;
    }

    /**
     * Renders the UHPP configuration + VTT prop/terrain studio in the inspector.
     * @param {object} entity - The selected Descendant or Location.
     * @param {HTMLElement} container - The container to render into.
     */
    renderInspector(entity, container) {
        const div = document.createElement('div');
        div.className = 'uhpp-inspector-panel card';
        div.style.marginTop = '1rem';
        div.style.borderTop = '2px solid var(--accent-purple)';

        const title = document.createElement('h4');
        title.textContent = 'Universal Hybrid Procedural Pipeline & Prop Studio';
        title.style.marginBottom = '0.75rem';
        div.appendChild(title);

        const size = entity.masterAnnex?.size || 10;
        const dims = this.getGridDimensionsForSize(size);

        const dimsInfo = document.createElement('p');
        dimsInfo.innerHTML = `<strong>Grid Size:</strong> ${dims.x} x ${dims.y} x ${dims.z} (Sway Chi: ${size})`;
        dimsInfo.style.fontSize = '0.8rem';
        div.appendChild(dimsInfo);

        const propOpts = UHPP_PROP_TYPES.map(t => `<option value="${t}">${t}</option>`).join('');
        const formationOpts = Object.keys(FORMATION_MATERIALS).map(f =>
            `<option value="${f}" ${(entity.incarna || 'Burden') === f ? 'selected' : ''}>${f} (${FORMATION_MATERIALS[f]})</option>`
        ).join('');

        const form = document.createElement('div');
        form.innerHTML = `
            <div class="form-group">
                <label>Prop / Terrain Archetype</label>
                <select id="uhpp-prop-type">${propOpts}</select>
            </div>
            <div class="form-group">
                <label>Formation Incarna Material</label>
                <select id="uhpp-formation">${formationOpts}</select>
            </div>
            <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
                <label>W <input type="number" id="uhpp-width" value="1.0" min="0.3" max="6" step="0.1"></label>
                <label>H <input type="number" id="uhpp-height" value="1.2" min="0.3" max="6" step="0.1"></label>
                <label>D <input type="number" id="uhpp-depth" value="1.0" min="0.3" max="6" step="0.1"></label>
            </div>
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
            <div style="display:flex;gap:8px;margin-top:0.75rem;">
                <button class="btn btn-primary" style="flex:1;" id="uhpp-run">Run Pipeline</button>
                <button class="btn btn-secondary" style="flex:1;" id="uhpp-place-vtt">Place on VTT</button>
            </div>
        `;
        div.appendChild(form);
        container.appendChild(div);

        div.querySelector('#uhpp-run').onclick = () => this.runPipeline(entity, {
            noiseScale: parseFloat(div.querySelector('#uhpp-noise-scale').value),
            lsIter: parseInt(div.querySelector('#uhpp-ls-iter').value, 10),
            caIter: parseInt(div.querySelector('#uhpp-ca-iter').value, 10),
            surfaceMethod: div.querySelector('#uhpp-surface-method').value,
            gridDimensions: dims
        });

        div.querySelector('#uhpp-place-vtt').onclick = () => {
            const spec = {
                name: entity.name || div.querySelector('#uhpp-prop-type').value,
                propType: div.querySelector('#uhpp-prop-type').value,
                incarna: div.querySelector('#uhpp-formation').value,
                width: parseFloat(div.querySelector('#uhpp-width').value),
                height: parseFloat(div.querySelector('#uhpp-height').value),
                depth: parseFloat(div.querySelector('#uhpp-depth').value),
                seed: entity.id ?? entity.name ?? 'uhpp-prop'
            };
            const tokenSpec = toVttPropTokenSpec(spec);
            this.placePropOnVTT(tokenSpec);
        };
    }

    placePropOnVTT(tokenSpec) {
        if (this.onPlaceOnVTT) {
            this.onPlaceOnVTT(tokenSpec);
        }
        EventBus.emit('vtt:place-prop', tokenSpec);
        this.workbench?.log?.(`UHPP: Dispatched '${tokenSpec.name}' (${tokenSpec.incarna}) to VTT.`, 'success');
        return tokenSpec;
    }

    getGridDimensionsForSize(chi) {
        const base = Math.max(5, Math.floor(Math.pow(chi, 1.2)));
        return {
            x: base,
            y: Math.max(5, Math.floor(base * 0.5)),
            z: base
        };
    }

    async runPipeline(entity, config) {
        this.workbench?.log?.(`UHPP: Starting pipeline for ${entity.name || 'Unnamed Entity'}...`);

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

        const rules = [
            [0, 2, 2], [1, 2, 2], [2, 2, 2],
            [0, 0, 0], [1, 0, 0], [2, 0, 0],
            [0, 2, 0], [1, 2, 0], [2, 2, 0],
            [0, 1, 2], [1, 1, 2], [2, 1, 2],
            [0, 1, 0], [1, 1, 0], [2, 1, 0]
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
            this.workbench?.log?.('UHPP: Pipeline execution successful.', 'success');
            entity.uhppOutput = { config: initialContext };
            if (typeof window !== 'undefined' && window.gameEngine && window.gameEngine.scene) {
                const { RenderBridge } = await import('./RenderBridge.js');
                const bridge = new RenderBridge(window.gameEngine.scene.threeScene);
                bridge.render(result);
            }
            return result;
        } catch (error) {
            console.error(error);
            this.workbench?.log?.(`UHPP Error: ${error.message}`, 'error');
            throw error;
        }
    }
}
