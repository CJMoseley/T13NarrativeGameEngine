import Logger from '@plugins/t13ne/core/Logger.js';
import CodexLoader from '@plugins/t13ne/modules/CodexLoader.js';

/**
 * T13NE Codex Library UI Module
 */
class LibraryUI {
    constructor() {}

    async refresh() {
        const container = document.getElementById('codex-explorer');
        if (!container) return;

        container.innerHTML = '';
        try {
            const manifest = await CodexLoader._getOrBuildProficiencyManifest();
            const sections = [
                { name: 'Proficiencies', count: Object.keys(manifest.paths).length },
                { name: 'Names', count: Object.keys(manifest.indexes.name).length },
                { name: 'Facets', count: Object.keys(manifest.indexes.facet).length }
            ];

            sections.forEach(s => {
                const row = document.createElement('div');
                row.className = 'card';
                row.style.cursor = 'pointer';
                row.innerHTML = `<div style="display:flex; justify-content:space-between;"><strong>${s.name}</strong> <span>${s.count} items</span></div>`;
                row.onclick = () => this.browseCategory(s.name);
                container.appendChild(row);
            });
        } catch (e) {
            container.innerHTML = `<p style="color: var(--danger)">Failed to load library: ${e.message}</p>`;
        }
    }

    async browseCategory(category) {
        const container = document.getElementById('codex-explorer');
        if (!container) return;
        
        container.innerHTML = '<div style="padding:1rem; color:var(--text-dim);">Loading...</div>';
        
        try {
            const manifest = await CodexLoader._getOrBuildProficiencyManifest();
            let items = [];
            
            if (category === 'Proficiencies') {
                const names = Object.keys(manifest.indexes.name).sort();
                items = names.map(n => ({ name: n, ids: manifest.indexes.name[n] }));
            } else if (category === 'Facets') {
                const facets = Object.keys(manifest.indexes.facet).sort();
                items = facets.map(f => ({ name: f, ids: manifest.indexes.facet[f] }));
            } else {
                items = [{ name: 'Category not browsable yet', ids: [] }];
            }

            let html = `
                <div style="margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem;">
                    <button class="btn" onclick="LibraryUI.refresh()">← Back</button>
                    <h3 style="margin:0;">${category}</h3>
                </div>
                <div class="codex-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem;">
            `;

            items.slice(0, 200).forEach(item => {
                const displayName = item.name.charAt(0).toUpperCase() + item.name.slice(1);
                html += `
                    <div class="card" style="padding: 0.5rem; cursor: pointer; font-size: 0.9rem;" 
                         onclick="LibraryUI.inspectItem('${item.ids[0]}')">
                        ${displayName}
                    </div>
                `;
            });
            
            if (items.length > 200) html += `<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); margin-top: 1rem;">...and ${items.length - 200} more</div>`;
            html += `</div>`;
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = `<p style="color:var(--danger)">Error: ${e.message}</p><button class="btn" onclick="LibraryUI.refresh()">Back</button>`;
        }
    }

    async inspectItem(id) {
        const data = await CodexLoader.getProficiency(id);
        if (data) {
            const prof = data.prof || data;
            this.showJsonModal(prof.Name?.[0] || prof.Name || 'Item', prof);
        }
    }

    showJsonModal(title, data) {
        const jsonStr = JSON.stringify(data, null, 2);
        const html = `<pre style="background: #111; padding: 1rem; overflow: auto; max-height: 60vh; font-size: 0.8rem; color: #ccc;">${jsonStr}</pre>`;
        
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const modal = document.getElementById('modal-overlay');
        const submitBtn = document.getElementById('modal-submit');
        
        if (modalBody && modal) {
            modalTitle.textContent = title;
            modalBody.innerHTML = html;
            modal.classList.add('active');
            if (submitBtn) submitBtn.style.display = 'none';
            
            // Add close handler to reset button
            const closeBtn = document.querySelector('.modal .btn:first-child'); // Cancel button
            if (closeBtn) closeBtn.onclick = () => { modal.classList.remove('active'); if (submitBtn) submitBtn.style.display = 'block'; };
        }
    }
}

const libraryUI = new LibraryUI();
window.LibraryUI = libraryUI;
export default libraryUI;
