
// Helper class for browsing the audio manifest
export class AssetBrowser {
    constructor(containerId, musicModule, onSelect) {
        this.containerId = containerId;
        this.module = musicModule;
        this.onSelect = onSelect; // Callback(id, category)
        this.currentCategory = 'samples';
        this.currentPath = []; // For folder navigation if using nested
        this.searchTerm = '';
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const manifest = this.module.manifestManager.manifest;
        if (!manifest) return;

        const categories = Object.keys(manifest);

        let html = `
            <div style="display:flex; flex-direction:column; height:100%; font-family:monospace; color:#ccc;">
                <!-- Toolbar -->
                <div style="display:flex; gap:5px; margin-bottom:5px;">
                    <select id="ab-category-select" style="background:#222; color:#fff; border:1px solid #444;">
                        ${categories.map(c => `<option value="${c}" ${c === this.currentCategory ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                    <input type="text" id="ab-search" placeholder="Search..." style="background:#222; color:#fff; border:1px solid #444; flex:1;">
                </div>
                <div style="font-size:0.8em; color:#888; padding:2px; border-bottom:1px solid #333;">${this.currentPath.length ? this.currentPath.join('/') : '/'}</div>

                <!-- Asset List -->
                <div id="ab-list" style="flex:1; overflow-y:auto; border:1px solid #444; background:#111;">
                    ${this.renderList()}
                </div>
                
                <div style="font-size:0.8em; color:#666; padding:2px;">
                    Click to preview/select. Double-click to load.
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.bindEvents(container);
    }

    renderList() {
        const manifest = this.module.manifestManager.manifest;
        const items = manifest[this.currentCategory] || {};

        let keys = Object.keys(items);
        
        if (this.searchTerm) {
            keys = keys.filter(k => k.toLowerCase().includes(this.searchTerm.toLowerCase()));
            // Flat list for search
            const limit = 200;
            const displayKeys = keys.slice(0, limit);
            return displayKeys.map(k => {
                const item = items[k];
                const name = item.filename || k;
                return `
                    <div class="ab-item" data-id="${k}" style="padding:2px 5px; cursor:pointer; border-bottom:1px solid #222;"
                         onclick="T13NE.getModule('Editor').musicEditor.browser.select('${k}')"
                         title="${name}">
                        🎵 ${name}
                    </div>
                `;
            }).join('') + (keys.length > limit ? `<div style="padding:5px; color:#666;">...and ${keys.length - limit} more</div>` : '');
        }

        // Folder Navigation
        const prefix = this.currentPath.length > 0 ? this.currentPath.join('/') + '/' : '';
        const folders = new Set();
        const files = [];

        keys.forEach(k => {
            if (!k.startsWith(prefix)) return;
            const relative = k.substring(prefix.length);
            const parts = relative.split('/');
            if (parts.length > 1) {
                folders.add(parts[0]);
            } else {
                files.push({ id: k, name: parts[0], item: items[k] });
            }
        });

        const sortedFolders = Array.from(folders).sort();
        const sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name));

        let html = '';
        if (this.currentPath.length > 0) {
            html += `<div class="ab-item" style="padding:2px 5px; cursor:pointer; color:#88f;" onclick="T13NE.getModule('Editor').musicEditor.browser.navigateUp()">.. [Up]</div>`;
        }

        sortedFolders.forEach(f => {
            html += `<div class="ab-item" style="padding:2px 5px; cursor:pointer; color:#fbbf24;" onclick="T13NE.getModule('Editor').musicEditor.browser.navigateDown('${f}')">📁 ${f}</div>`;
        });

        sortedFiles.forEach(f => {
            html += `<div class="ab-item" data-id="${f.id}" style="padding:2px 5px; cursor:pointer; border-bottom:1px solid #222;" onclick="T13NE.getModule('Editor').musicEditor.browser.select('${f.id}')" title="${f.item.filename}">🎵 ${f.name}</div>`;
        });

        return html || '<div style="padding:5px;">Empty folder.</div>';
    }

    bindEvents(container) {
        container.querySelector('#ab-category-select').onchange = (e) => {
            this.currentCategory = e.target.value;
            this.render();
        };

        container.querySelector('#ab-search').oninput = (e) => {
            this.searchTerm = e.target.value;
            const list = container.querySelector('#ab-list');
            list.innerHTML = this.renderList();
        };
    }

    navigateDown(folder) {
        this.currentPath.push(folder);
        this.render();
    }

    navigateUp() {
        this.currentPath.pop();
        this.render();
    }

    select(id) {
        // Preview via music module
        const category = this.currentCategory;
        const item = this.module.manifestManager.manifest[category][id];

        // If it's a sample, load it and play it? 
        // Or just let parent handle selection.
        if (this.onSelect) this.onSelect(id, category, item);
    }
}
