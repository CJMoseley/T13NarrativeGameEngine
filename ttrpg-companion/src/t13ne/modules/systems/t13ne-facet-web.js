import T13NE_IChing from "/src/t13ne/modules/mechanics/t13ne-iching.js";
/**
 * FacetWeb manages the web of Facets and their relationships (Stats).
 * It defines the Yin/Yang pairs and constructs the statblock structure.
 */
class FacetWeb {
    constructor(data = {}) {
        this.Stats = [];
        Object.assign(this, data);
    }

    static getPairs() {
        return [
            { Yang: 0, Yin: 9 },   // Awe - Jeer
            { Yang: 2, Yin: 13 },  // Craft - Nature
            { Yang: 3, Yin: 22 },  // Dominion - Yonder
            { Yang: 5, Yin: 16 },  // Fury - Quiet
            { Yang: 6, Yin: 1 },   // Gossamer - Burden
            { Yang: 7, Yin: 14 },  // Heresy - Orthodox
            { Yang: 10, Yin: 4 },  // Key - Enigma
            { Yang: 11, Yin: 21 }, // Liberty - Wyrd
            { Yang: 15, Yin: 12 }, // Phoenix - Miasma
            { Yang: 18, Yin: 20 }, // Sin - Virtue
            { Yang: 19, Yin: 17 }, // Trial - Rook
            { Yang: 23, Yin: 8 }   // Zeal - Inertia
        ];
    }

    static getFacetIndex(name) {
        const map = {
            'awe': 0, 'burden': 1, 'craft': 2, 'dominion': 3, 'enigma': 4, 'fury': 5,
            'gossamer': 6, 'heresy': 7, 'inertia': 8, 'jeer': 9, 'key': 10, 'liberty': 11,
            'miasma': 12, 'nature': 13, 'orthodox': 14, 'phoenix': 15, 'quiet': 16,
            'rook': 17, 'sin': 18, 'trial': 19, 'virtue': 20, 'wyrd': 21, 'yonder': 22, 'zeal': 23
        };
        return map[String(name).toLowerCase()] ?? -1;
    }

    static buildStats(boons = [13], sways = [0]) {
        const pairs = FacetWeb.getPairs();
        const stats = [];

        const boonArr = Array.isArray(boons) ? boons : [boons];
        const swayArr = Array.isArray(sways) ? sways : [sways];

        for (let i = 0; i < 12; i++) {
            const pair = pairs[i];
            let yangBoon = 13;
            let yinBoon = 13;
            let yangSway = 0;
            let yinSway = 0;

            // Boons Logic
            if (boonArr.length >= 24) {
                // Explicit values for both Facet and Antifacet (Encoded as [Yang0..11, Yin0..11])
                yangBoon = boonArr[i] !== undefined ? boonArr[i] : 13;
                yinBoon = boonArr[i + 12] !== undefined ? boonArr[i + 12] : 13;
            } else if (boonArr.length > 1) {
                // Values for Yang Facets provided, calculate Yin Antifacet to balance to 26
                yangBoon = boonArr[i] !== undefined ? boonArr[i] : 13;
                yinBoon = 26 - yangBoon;
            } else {
                // Single value provided, apply to Yang Facet and balance Yin
                const val = boonArr[0] !== undefined ? boonArr[0] : 13;
                yangBoon = val;
                yinBoon = 26 - val;
            }

            // Sways Logic
            if (swayArr.length >= 24) {
                yangSway = swayArr[i] !== undefined ? swayArr[i] : 0;
                yinSway = swayArr[i + 12] !== undefined ? swayArr[i + 12] : 0;
            } else if (swayArr.length > 1) {
                yangSway = swayArr[i] !== undefined ? swayArr[i] : 0;
                yinSway = 0; // Sways don't auto-balance
            } else {
                const val = swayArr[0] !== undefined ? swayArr[0] : 0;
                yangSway = val;
                yinSway = val; // apply to both
            }

            stats.push({
                'Facet': pair.Yang,
                'Facet_Boon': yangBoon,
                'Facet_Sway': yangSway,
                'Facet_Mutation_Matrix': 0,
                'Joined': (yangBoon + yinBoon === 26),
                'Antifacet_Mutation_Matrix': 0,
                'Antifacet': pair.Yin,
                'Antifacet_Boon': yinBoon,
                'AntiFacet_Sway': yinSway
            });
        }
        return stats;
    }

    calculateIChing() {
        return T13NE_IChing.calculateIChing(this.Stats);
    }

    getFacetBoon(facetIdentifier) {
        if (!this.Stats) return { Boon: 13, Scale: this.Scale || 0 };

        let facetIndex = -1;
        if (typeof facetIdentifier === 'number') {
            facetIndex = facetIdentifier;
        } else if (typeof facetIdentifier === 'string') {
            facetIndex = FacetWeb.getFacetIndex(facetIdentifier);
            if (facetIndex === -1) {
                const parsed = parseInt(facetIdentifier, 10);
                if (!isNaN(parsed)) facetIndex = parsed;
            }
        }

        if (facetIndex === -1) return { Boon: 13, Scale: this.Scale || 0 };

        for (const pair of this.Stats) {
            if (pair.Facet === facetIndex) {
                return { Boon: pair.Facet_Boon, Scale: this.Scale || 0 };
            }
            if (pair.Antifacet === facetIndex) {
                return { Boon: pair.Antifacet_Boon, Scale: this.Scale || 0 };
            }
        }
        return { Boon: 13, Scale: this.Scale || 0 };
    }

    getFacetTao(facetIdentifier) {
        let facetIndex = -1;
        if (typeof facetIdentifier === 'number') {
            facetIndex = facetIdentifier;
        } else if (typeof facetIdentifier === 'string') {
            facetIndex = FacetWeb.getFacetIndex(facetIdentifier);
            if (facetIndex === -1) {
                const parsed = parseInt(facetIdentifier, 10);
                if (!isNaN(parsed)) facetIndex = parsed;
            }
        }

        if (facetIndex === -1) return 'Balance';

        for (const pair of this.Stats) {
            if (pair.Facet === facetIndex) return 'Yang';
            if (pair.Antifacet === facetIndex) return 'Yin';
        }
        return 'Balance';
    }

    static getFacetName(index) {
        const names = [
            'Awe', 'Burden', 'Craft', 'Dominion', 'Enigma', 'Fury',
            'Gossamer', 'Heresy', 'Inertia', 'Jeer', 'Key', 'Liberty',
            'Miasma', 'Nature', 'Orthodox', 'Phoenix', 'Quiet',
            'Rook', 'Sin', 'Trial', 'Virtue', 'Wyrd', 'Yonder', 'Zeal'
        ];
        return names[index] || `Facet ${index}`;
    }

    static renderGrid(stats) {
        return stats.map((s, i) => `
            <div class="facet-pair-row" data-idx="${i}" ondragover="event.preventDefault()" ondrop="Workbench.handleDrop(${i}, event)"
                 style="display: flex; align-items: center; gap: 0.5rem; border: 1px solid rgba(255,255,255,0.05); padding: 0.5rem; background: rgba(0,0,0,0.1); border-radius: 0.4rem;">
                <div class="facet-item yang" style="flex: 1; display: flex; justify-content: space-between; align-items: center;">
                    <span draggable="true" ondragstart="event.dataTransfer.setData('facetIdx', ${i}); event.dataTransfer.setData('sourceSide', 'facet')" 
                          data-facet-id="${s.Facet}"
                          style="font-size: 0.7rem; color: var(--accent-blue); cursor: grab;">${FacetWeb.getFacetName(s.Facet)}</span>
                    <input type="number" class="m-boon" data-idx="${i}" data-side="facet" 
                           oninput="Workbench.syncBoon(${i}, 'facet', this.value)"
                           style="width: 45px; font-size: 0.75rem; padding: 0.2rem;" value="${s.Facet_Boon}">
                </div>
                <button class="join-toggle" data-idx="${i}" data-joined="${s.Joined}" 
                        onclick="Workbench.toggleJoin(${i})"
                        style="background: transparent; border: none; cursor: pointer; font-size: 1rem; opacity: ${s.Joined ? '1' : '0.4'}; transition: all 0.2s;">
                    ${s.Joined ? 'ðŸ”—' : 'ðŸ”“'}
                </button>
                <div class="facet-item yin" style="flex: 1; display: flex; justify-content: space-between; align-items: center;">
                    <input type="number" class="m-boon" data-idx="${i}" data-side="antifacet" 
                           oninput="Workbench.syncBoon(${i}, 'antifacet', this.value)"
                           style="width: 45px; font-size: 0.75rem; padding: 0.2rem;" value="${s.Antifacet_Boon}">
                    <span draggable="true" ondragstart="event.dataTransfer.setData('facetIdx', ${i}); event.dataTransfer.setData('sourceSide', 'antifacet')"
                          data-facet-id="${s.Antifacet}"
                          style="font-size: 0.7rem; color: var(--accent-purple); cursor: grab; text-align: right;">${FacetWeb.getFacetName(s.Antifacet)}</span>
                </div>
            </div>
        `).join('');
    }
}

export default FacetWeb;







