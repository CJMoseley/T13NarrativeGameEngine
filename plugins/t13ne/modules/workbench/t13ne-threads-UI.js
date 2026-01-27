import Logger from '@plugins/t13ne/core/Logger.js';
import T13NE from '@plugins/t13ne/T13NE.js';
import CodexLoader from '@plugins/t13ne/modules/CodexLoader.js';
import UI from './t13ne-UI.js';

/**
 * T13NE Threads UI Module
**/
class ThreadsUI {
    constructor() {
        this.candidates = [];
        this.genreFilter = ['All'];
        this.eraFilter = ['All'];
        this.scopeFilter = ['All'];
        this.facetFilter = ['All'];
    }

    async refresh() {
        const list = document.getElementById('prof-library-list');
        if (!list) return;
        list.innerHTML = '';

        // --- Unified Toolbar (Analysis + Filters) ---
        const toolbar = document.createElement('div');
        toolbar.style.cssText = 'background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid var(--glass-border);';

        // 1. Facet Analysis Section
        const analysisHeader = document.createElement('h4');
        analysisHeader.textContent = 'Facet Analysis & Extraction';
        analysisHeader.style.cssText = 'margin-top: 0; color: var(--accent-blue); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;';
        toolbar.appendChild(analysisHeader);

        const analysisRow = document.createElement('div');
        analysisRow.style.cssText = 'display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap;';
        
        const facetSelect = document.createElement('select');
        facetSelect.className = 'input-control';
        facetSelect.style.minWidth = '200px';
        
        // Populate Facets dynamically
        const Facets = T13NE.getModule('Facets');
        if (Facets) {
            const facetsArr = await Facets.getFacetsArr();
            facetsArr.forEach((f, i) => {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = f.FacetName;
                facetSelect.appendChild(opt);
            });
        }

        const analyzeBtn = document.createElement('button');
        analyzeBtn.className = 'btn btn-primary';
        analyzeBtn.textContent = 'Analyze Facet';
        analyzeBtn.onclick = () => this.analyzeFacet(facetSelect.value);

        analysisRow.appendChild(facetSelect);
        analysisRow.appendChild(analyzeBtn);
        toolbar.appendChild(analysisRow);

        // Candidate Results Container (Hidden until used)
        const candidateContainer = document.createElement('div');
        candidateContainer.id = 'candidate-section-dynamic';
        candidateContainer.style.display = 'none';
        candidateContainer.style.marginBottom = '1rem';
        candidateContainer.style.padding = '0.5rem';
        candidateContainer.style.background = 'rgba(0,0,0,0.2)';
        candidateContainer.style.borderRadius = '4px';
        candidateContainer.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;"><strong style="color:var(--accent-green)">Candidates Found: <span id="candidate-count-dynamic">0</span></strong> <button class="btn" onclick="ThreadsUI.processAll()">Process All</button></div><div id="candidate-list-dynamic" style="max-height: 300px; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 0.5rem;"></div>`;
        toolbar.appendChild(candidateContainer);

        // 2. Filters Section
        const filterHeader = document.createElement('h4');
        filterHeader.textContent = 'Library Filters';
        filterHeader.style.cssText = 'margin-top: 1rem; border-top: 1px solid var(--glass-border); padding-top: 1rem; color: var(--text-dim); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;';
        toolbar.appendChild(filterHeader);

        const filterRow = document.createElement('div');
        filterRow.style.cssText = 'display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;';

        const createFilter = (label, options, selectedValues, onChange) => {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            
            const lbl = document.createElement('label');
            lbl.textContent = label;
            lbl.style.color = '#fff';
            lbl.style.fontSize = '0.8rem';
            lbl.style.marginBottom = '0.2rem';
            
            const sel = document.createElement('select');
            sel.multiple = true;
            sel.style.background = 'rgba(0,0,0,0.5)';
            sel.style.color = '#fff';
            sel.style.padding = '0.2rem 0.5rem';
            sel.style.borderRadius = '4px';
            sel.style.border = '1px solid rgba(255,255,255,0.2)';
            sel.style.height = '6rem';
            
            options.forEach(opt => {
                const o = document.createElement('option');
                // Handle objects {value, label} or simple strings
                const val = typeof opt === 'object' ? opt.value : opt;
                const txt = typeof opt === 'object' ? opt.label : opt;
                o.value = val;
                o.textContent = txt;
                if (selectedValues.includes(String(val))) o.selected = true;
                sel.appendChild(o);
            });
            
            sel.onchange = onChange;
            wrapper.appendChild(lbl);
            wrapper.appendChild(sel);
            return wrapper;
        };

        // Load full lists from Codex using helper
        const [genres, eras, scopes] = await Promise.all([
            CodexLoader.getTags('genres'),
            CodexLoader.getTags('eras'),
            CodexLoader.getTags('scopes')
        ]);

        // Prepare Facet Options for Filter
        const facetOptions = [{value: 'All', label: 'All'}];
        if (Facets) {
            const facetsArr = await Facets.getFacetsArr();
            facetsArr.forEach((f, i) => {
                facetOptions.push({ value: String(i), label: f.FacetName });
            });
        }

        const getSelected = (select) => Array.from(select.selectedOptions).map(o => o.value);

        // Add Facet Filter
        filterRow.appendChild(createFilter('Facet', facetOptions, this.facetFilter, (e) => { this.facetFilter = getSelected(e.target); this.refresh(); }));
        
        filterRow.appendChild(createFilter('Genre', genres, this.genreFilter, (e) => { this.genreFilter = getSelected(e.target); this.refresh(); }));
        filterRow.appendChild(createFilter('Era', eras, this.eraFilter, (e) => { this.eraFilter = getSelected(e.target); this.refresh(); }));
        filterRow.appendChild(createFilter('Scope', scopes, this.scopeFilter, (e) => { this.scopeFilter = getSelected(e.target); this.refresh(); }));

        toolbar.appendChild(filterRow);
        list.appendChild(toolbar);

        try {
            const Threads = T13NE.getModule('Threads');
            const annexes = Threads?.getAnnexes().getAllAnnexes() || [];
            annexes.forEach(a => {
                if (!CodexLoader.matchesFilter(a, {
                    genre: this.genreFilter,
                    era: this.eraFilter,
                    scope: this.scopeFilter,
                    facet: this.facetFilter
                })) return;

                const div = document.createElement('div');
                div.className = 'card';
                div.style.borderLeft = '4px solid var(--accent-purple)';
                div.style.background = '#222'; // High contrast bg
                div.style.color = '#ffffff'; // High contrast text
                div.style.marginBottom = '0.5rem';
                div.style.padding = '0.75rem';

                div.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="font-size:1rem;">${a.name}</strong>
                        <span class="status-badge" style="background:#4f46e5; color:#fff; font-size:0.7rem; padding: 2px 6px; border-radius: 4px;">${a.type}</span>
                    </div>
                    <div style="font-size: 0.85rem; color: #ddd; margin-top: 0.4rem;">${a.description}</div>
                `;
                list.appendChild(div);
            });

            const manifest = await CodexLoader._getOrBuildProficiencyManifest();
            let count = 0;
            for (const id of Object.keys(manifest.paths)) {
                if (count >= 30) break; // Display limit
                const data = await CodexLoader.getProficiency(id);
                if (data) {
                    const prof = data.prof || data;
                    if (CodexLoader.matchesFilter(prof, {
                        genre: this.genreFilter,
                        era: this.eraFilter,
                        scope: this.scopeFilter,
                        facet: this.facetFilter
                    })) {
                        const div = document.createElement('div');
                        div.className = 'card';
                        div.style.background = '#222';
                        div.style.color = '#ffffff';
                        div.style.marginBottom = '0.5rem';
                        div.style.padding = '0.75rem';
                        div.style.border = '1px solid #444';

                        div.innerHTML = `
                            <div style="font-weight: 600; font-size: 0.95rem;">${prof.Name?.[0] || prof.Name}</div>
                            <div style="font-size: 0.85rem; color: #ddd; margin-top: 0.2rem;">${prof.Description?.substring(0, 80)}...</div>
                        `;
                        list.appendChild(div);
                        count++;
                    }
                }
            }
        } catch (e) {
            Logger.error("ThreadsUI: Failed refresh.", e);
        }
    }

    async analyzeFacet(facetIndex) {
        const Facets = T13NE.getModule('Facets');
        const facets = await Facets.getFacetsArr();
        
        const facet = facets[facetIndex];
        UI.notify(`Threads: Extracting from "${facet.FacetName}"...`);

        const Extractor = T13NE.getModule('ProficiencyExtractor');
        this.candidates = Extractor.extractCandidates(facet);

        document.getElementById('candidate-section-dynamic').style.display = 'block';
        document.getElementById('candidate-count-dynamic').textContent = `${this.candidates.length}`;

        const list = document.getElementById('candidate-list-dynamic');
        list.innerHTML = '';
        this.candidates.forEach((c, i) => {
            const div = document.createElement('div');
            div.className = 'card';
            div.style.padding = '0.5rem';
            div.style.background = '#222';
            div.style.color = '#fff';
            div.style.marginBottom = '0.5rem';

            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.9rem;">${c.name}</span>
                    <div id="can-btn-${i}">
                        <button class="btn" style="padding: 0.2rem 0.5rem; font-size: 0.7rem; background: #444; color: #fff; border: 1px solid #666;" onclick="ThreadsUI.processSingle(${i})">Analyze</button>
                    </div>
                </div>
            `;
            list.appendChild(div);
        });
    }

    async processSingle(idx) {
        const btnRow = document.getElementById(`can-btn-${idx}`);
        btnRow.innerHTML = '<span style="font-size: 0.7rem; color: #60a5fa;">Busy...</span>';

        const Extractor = T13NE.getModule('ProficiencyExtractor');
        const res = (await Extractor.processBatch([this.candidates[idx]]))[0];

        btnRow.innerHTML = `<button class="btn btn-primary" style="padding: 0.2rem 0.5rem; font-size: 0.7rem; background: #4f46e5; color: #fff;" onclick="ThreadsUI.commit(${idx})">Commit</button>`;
        this.candidates[idx] = res;
        UI.notify(`Threads: Formalised "${res.name}" as "${res.generatedName[0]}".`, 'info');
    }

    async commit(idx) {
        const res = this.candidates[idx];
        const id = await CodexLoader.createProficiency({
            prof: {
                Name: res.generatedName,
                Description: res.generatedDescription,
                Tags: res.tags
            }
        });
        UI.notify(`Threads: Committed "${res.generatedName[0]}" as ID ${id}.`, 'success');
        this.refresh();
        document.getElementById(`can-btn-${idx}`).innerHTML = '<span style="color: #4ade80;">Done</span>';
    }

    async processAll() {
        UI.notify("Processing all candidates with AI...");
        for (let i = 0; i < this.candidates.length; i++) {
            await this.processSingle(i);
        }
    }
}

const threadsUI = new ThreadsUI();
// Expose to window for inline onclicks in the short term, or refactor onclicks later
window.ThreadsUI = threadsUI;
export default threadsUI;
