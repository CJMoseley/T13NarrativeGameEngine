import FacetWebUI from './t13ne-facetweb-UI.js';
import T13NE from '/src/t13ne/T13NE.js';
import T13Tapestry from "/src/t13ne/modules/world/T13Tapestry.js";
import GeometryUI from './t13ne-geometry-ui.js';

/**
 * T13NE Tapestry UI Module
 * Handles rendering of Tapestry metrics and details.
 */
class TapestryUI {
    constructor() { }

    renderInspector(obj) {
        let stats = obj.Stats || obj.facetweb?.Stats || (obj.data && obj.data.Stats) || (obj.knot && obj.knot.Stats) || (obj.proficiencies && obj.proficiencies.Stats);

        // Fallback for old data format (Boons array but no Stats)
        if ((!stats || stats.length === 0) && (obj.Boons || obj.facetweb?.Boons)) {
            const boons = obj.Boons || obj.facetweb?.Boons;
            stats = T13Tapestry.buildStats(boons, obj.Sways || obj.facetweb?.Sways);
        }

        if (!stats || stats.length === 0) return '';
        const scale = obj.Scale !== undefined ? obj.Scale : (obj.facetweb?.Scale || 0);

        return `
            <div class="form-group" style="background: rgba(0,0,0,0.2); padding: 0.8rem; border-radius: 0.4rem; border: 1px solid #f9731644;">
                <label style="color: #f97316">Tapestry Metrics</label>
                <div style="font-size: 0.8rem; margin-bottom: 0.5rem;">
                    <strong>Scale:</strong> ${scale}
                </div>
                <div style="font-size: 0.75rem;">
                    <strong>Facets:</strong>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; margin-top: 0.4rem;">
                        ${stats.map(s => `
                            <div style="display:flex; justify-content:space-between; border-bottom: 1px solid rgba(255,255,255,0.05)">
                                <span>${FacetWebUI.getFacetName(s.Facet)}:</span> <span>${s.Facet_Boon}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; border-bottom: 1px solid rgba(255,255,255,0.05)">
                                <span>${FacetWebUI.getFacetName(s.Antifacet)}:</span> <span>${s.Antifacet_Boon}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    getWizardConfig() {
        return {
            steps: [
                {
                    title: 'Identity',
                    render: (data) => `
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" id="m-name" value="${data.Name || data.name || ''}" placeholder="Name">
                        </div>
                        <div id="geometry-display"></div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="m-desc" style="min-height: 100px;">${data.Description || data.description || ''}</textarea>
                        </div>
                    `,
                    onRender: (dom, data) => {
                        const nameInput = dom.querySelector('#m-name');
                        const updateGeo = () => {
                            dom.querySelector('#geometry-display').innerHTML = GeometryUI ? GeometryUI.render(nameInput.value) : '';
                        };
                        nameInput.addEventListener('input', updateGeo);
                        updateGeo();
                    },
                    onSave: (dom, data) => {
                        data.name = dom.querySelector('#m-name').value;
                        data.description = dom.querySelector('#m-desc').value;
                    }
                },
                {
                    title: 'Facet Web',
                    render: (data) => {
                        let stats = data.stats || data.facetweb?.Stats || data.Stats;
                        if (!stats) {
                            const Tapestry = T13NE.getModule('Tapestry');
                            stats = JSON.parse(JSON.stringify(Tapestry.defaultStatblock.Stats));
                        }
                        let scale = data.scale !== undefined ? data.scale : (data.facetweb?.Scale || data.Scale || 13);
                        return `
                            <div class="form-group">
                                <label>Scale</label>
                                <input type="number" id="m-scale" value="${scale}">
                            </div>
                            <div class="form-group">
                                <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem;">
                                    <label>Facets</label>
                                    <div>
                                        <button class="btn" onclick="Workbench.randomizeFacets('boons')">Rand Boons</button>
                                        <button class="btn" onclick="Workbench.standardizeFacets()">Reset</button>
                                    </div>
                                </div>
                                <div id="m-facet-grid">${FacetWebUI.renderGrid(stats)}</div>
                            </div>
                        `;
                    },
                    onSave: (dom, data) => {
                        data.scale = parseInt(dom.querySelector('#m-scale').value);
                        const grid = dom.querySelector('#m-facet-grid');
                        if (grid) {
                            const rows = Array.from(grid.querySelectorAll('.facet-pair-row'));
                            data.stats = rows.map(row => {
                                const yangItem = row.querySelector('.facet-item[data-side="facet"]');
                                const yinItem = row.querySelector('.facet-item[data-side="antifacet"]');
                                const yangInput = yangItem.querySelector('input');
                                const yinInput = yinItem.querySelector('input');
                                return {
                                    Facet: parseInt(yangItem.dataset.id),
                                    Facet_Boon: parseInt(yangInput.value) || 0,
                                    Facet_Sway: 0,
                                    Facet_Mutation_Matrix: 0,
                                    Joined: row.dataset.joined === 'true',
                                    Antifacet_Mutation_Matrix: 0,
                                    Antifacet: parseInt(yinItem.dataset.id),
                                    Antifacet_Boon: parseInt(yinInput.value) || 0,
                                    AntiFacet_Sway: 0
                                };
                            });
                        }
                    }
                }
            ]
        };
    }
}

const tapestryUI = new TapestryUI();
window.TapestryUI = tapestryUI;
export default tapestryUI;







