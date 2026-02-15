﻿import T13NE from '@/srct13ne/T13NE.js';
import T13Dice from '/src/t13ne/modules/mechanics/t13ne-dice.js';

/**
 * T13NE FacetWeb UI Module
 * Handles rendering and manipulation of Facet Webs.
 */
class FacetWebUI {
    constructor() {
        this.dragSrcEl = null;
    }

    getFacetName(idx) {
        const map = {
            0: 'Awe', 1: 'Burden', 2: 'Craft', 3: 'Dominion', 4: 'Enigma', 5: 'Fury',
            6: 'Gossamer', 7: 'Heresy', 8: 'Inertia', 9: 'Jeer', 10: 'Key', 11: 'Liberty',
            12: 'Miasma', 13: 'Nature', 14: 'Orthodox', 15: 'Phoenix', 16: 'Quiet',
            17: 'Rook', 18: 'Sin', 19: 'Trial', 20: 'Virtue', 21: 'Wyrd', 22: 'Yonder', 23: 'Zeal'
        };
        return map[idx] || 'Unknown';
    }

    /**
     * Renders the Facet Web grid for forms.
     */
    renderGrid(stats) {
        if (!stats) return 'No stats available';

        let html = '<div class="facet-web-grid" style="display:flex; flex-direction:column; gap: 5px; user-select:none; width: 100%;">';
        html += `<div style="display:grid; grid-template-columns: 1fr 40px 1fr; gap:5px; text-align:center; font-weight:bold; font-size:0.8rem;">
            <span style="color:var(--accent-blue); cursor:pointer;" onclick="Workbench.sortFacets('yang')" title="Sort by Yang">Yang</span>
            <span></span>
            <span style="color:var(--accent-purple); cursor:pointer;" onclick="Workbench.sortFacets('yin')" title="Sort by Yin">Yin</span>
        </div>`;

        stats.forEach((pair, idx) => {
            const joined = pair.Joined !== false; // Default to true
            html += `
            <div class="facet-pair-row" data-idx="${idx}" data-joined="${joined}" style="display:grid; grid-template-columns: 1fr 40px 1fr; gap: 5px; align-items:center;">
                ${this._renderFacetItem(pair.Facet, pair.Facet_Boon, idx, 'facet')}
                <button class="btn-icon join-toggle" onclick="Workbench.toggleJoin(${idx}, this)" style="padding:0; border:none; background:none; cursor:pointer; color:#666; font-size:1rem;">${joined ? '🔗' : '🔓'}</button>
                ${this._renderFacetItem(pair.Antifacet, pair.Antifacet_Boon, idx, 'antifacet')}
            </div>`;
        });

        html += '</div>';

        // Calculate and append I-Ching
        const IChing = T13NE.getModule('IChing');
        if (IChing) {
            const hex = IChing.calculateIChing(stats);
            html += `<div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--accent-green); text-align: center;">I-Ching: ${hex[0]} / ${hex[1]}</div>`;
        }

        return html;
    }

    _renderFacetItem(facetId, boon, idx, side) {
        const name = this.getFacetName(facetId);
        return `
            <div class="facet-item" draggable="true" 
                data-idx="${idx}" data-side="${side}" data-id="${facetId}"
                ondragstart="FacetWebUI.drag(event)" ondrop="FacetWebUI.drop(event)" ondragover="FacetWebUI.allowDrop(event)"
                style="background:rgba(0,0,0,0.5); color:#fff; padding:4px 8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center; border:1px solid transparent; cursor:grab; transition:all 0.2s;">
                <span class="facet-name" style="font-size:0.8rem; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100px;">${name}</span>
                <input type="number" class="m-boon" value="${boon}" data-idx="${idx}" data-side="${side}" 
                    oninput="Workbench.syncBoon(${idx}, '${side}', this.value)"
                    style="width:40px; text-align:center; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.5); color:#fff; border-radius:3px; padding:2px;">
            </div>
        `;
    }

    drag(ev) {
        ev.dataTransfer.setData("text/plain", JSON.stringify({
            idx: ev.target.dataset.idx,
            side: ev.target.dataset.side,
            id: ev.target.dataset.id,
            boon: ev.target.querySelector('input').value
        }));
        ev.target.style.opacity = '0.4';
        ev.target.style.borderColor = 'var(--accent-blue)';
        this.dragSrcEl = ev.target;
    }

    allowDrop(ev) {
        ev.preventDefault();
    }

    drop(ev) {
        ev.preventDefault();
        if (this.dragSrcEl) {
            this.dragSrcEl.style.opacity = '1';
            this.dragSrcEl.style.borderColor = 'transparent';
        }

        const target = ev.target.closest('.facet-item');
        if (!target || target === this.dragSrcEl) return;

        const srcData = JSON.parse(ev.dataTransfer.getData("text/plain"));
        const tgtData = {
            idx: target.dataset.idx,
            side: target.dataset.side,
            id: target.dataset.id,
            boon: target.querySelector('input').value
        };

        // Swap IDs and Boons to fully swap the facet positions
        this._updateElement(this.dragSrcEl, tgtData.id, tgtData.boon);
        this._updateElement(target, srcData.id, srcData.boon);
    }

    _updateElement(el, id, boon) {
        el.dataset.id = id;
        el.querySelector('.facet-name').textContent = this.getFacetName(id);
        el.querySelector('input').value = boon;
    }

    randomize(type, gridElement) {
        if (!gridElement) return;
        const boons = gridElement.querySelectorAll('.m-boon');
        const items = Array.from(gridElement.querySelectorAll('.facet-item'));

        if (type === 'boons') {
            const rows = gridElement.querySelectorAll('.facet-pair-row');
            rows.forEach(row => {
                const joined = row.dataset.joined === 'true';
                const yangInput = row.querySelector('input[data-side="facet"]');
                const yinInput = row.querySelector('input[data-side="antifacet"]');

                if (joined) {
                    const val = T13Dice.RNG(1, 25);
                    if (yangInput) yangInput.value = val;
                    if (yinInput) yinInput.value = 26 - val;
                } else {
                    if (yangInput) yangInput.value = T13Dice.RNG(1, 25);
                    if (yinInput) yinInput.value = T13Dice.RNG(1, 25);
                }
            });
        } else if (type === 'web') {
            const allFacets = Array.from({ length: 24 }, (_, i) => i);
            // Fisher-Yates shuffle
            for (let i = allFacets.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allFacets[i], allFacets[j]] = [allFacets[j], allFacets[i]];
            }

            items.forEach((item, i) => {
                const newId = allFacets[i];
                const currentBoon = item.querySelector('input').value;
                this._updateElement(item, newId, currentBoon);
            });
        }
    }
}

const facetWebUI = new FacetWebUI();
window.FacetWebUI = facetWebUI;
export default facetWebUI;
