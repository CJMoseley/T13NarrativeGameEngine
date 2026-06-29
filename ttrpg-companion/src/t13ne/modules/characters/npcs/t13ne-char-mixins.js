import { Annex, Hitch, SizeAnnex, TIE } from "/src/t13ne/modules/mechanics/t13ne-knots.js";
import Logger from "/src/t13ne/core/Logger.js";
﻿import { Annex, Hitch, SizeAnnex, TIE } from "../../mechanics/t13ne-knots.js";
import Logger from "../../core/Logger.js";

export const ChiUser = (Base) => class extends Base {
    constructor(...args) {
        super(...args);
        this.canSpendChi = true;
    }
};

export const TwistUser = (Base) => class extends Base {
    constructor(...args) {
        super(...args);
        this.canUseTwists = true;
    }
};

export const YarnUser = (Base) => class extends Base {
    constructor(...args) {
        super(...args);
        this.canUseYarn = true;
        this.canDoomWeave = true;
    }
};

export const WyrdUser = (Base) => class extends Base {
    constructor(...args) {
        super(...args);
        this.canUseWyrdTarot = true;
    }
};

export const MonsterFacetUser = (Base) => class extends Base {
    constructor(...args) {
        super(...args);
        this.isMonster = true;
        if (!this.tags.types) this.tags.types = [];
        if (!this.tags.types.includes('Monster')) this.tags.types.push('Monster');
    }

    ensureMonsterFacets(count = 1) {
        if (this.facetweb && typeof this.facetweb.setMonsterFacet === 'function') {
            const current = this.facetweb.getMonsterFacets().length;
            if (current < count) {
                // Logic to add monster facets could go here, or be handled during generation
                // For now, we flag it
                this.monsterFacetTarget = count;
            }
        }
    }
};

export const LeaWalker = (Base) => class extends Base {
    constructor(...args) {
        super(...args);
        this.canWalkLea = true;
        this.canEatSouls = true;
    }
};

export const ToonPhysics = (Base) => class extends Base {
    constructor(...args) {
        super(...args);
        this.isToon = true;
    }
    
    ensureToonPhysics(codexLoader) {
        if (!this.subAnnexes) this.subAnnexes = [];
        if (!this.subAnnexes.some(a => a.name === 'Toon Physics') && codexLoader) {
             const toonPhysics = new Annex(codexLoader, {
                name: 'Toon Physics',
                description: 'Programmed to obey narrative rules and bend reality (Toon Physics).',
                tags: { facets: ['Jeer', 'Liberty'] },
                proficiencies: [
                    { profId: 'prof_toon_root', knot: TIE.ROOT | TIE.THREAD },
                    { profId: 'prof_toon_channel', knot: TIE.CHANNEL | TIE.THREAD }
                ]
            });
            toonPhysics.annexType = 'Power';
            this.subAnnexes.push(toonPhysics);
        }
    }
};

export const Sized = (Base) => class extends Base {
    constructor(...args) {
        super(...args);
    }
    
    ensureSize(size, codexLoader, name = 'Size') {
        if (!this.subAnnexes) this.subAnnexes = [];
        const hasSize = this.subAnnexes.some(a => a.annexType === 'Size') || (this.masterAnnex && this.masterAnnex.annexType === 'Size');
        if (!hasSize && codexLoader) {
            const sizeAnnex = new SizeAnnex(codexLoader, {
                name: name,
                description: 'Increased scale and mass.',
                size: size,
                proficiencies: [
                    { profId: 'prof_size_root', knot: TIE.ROOT | TIE.THREAD },
                    { profId: 'prof_size_channel', knot: TIE.CHANNEL | TIE.THREAD }
                ]
            });
            this.subAnnexes.push(sizeAnnex);
        }
    }
};

export const WoeUser = (Base) => class extends Base {
    constructor(...args) {
        super(...args);
    }
    
    ensureWoe(codexLoader, name = 'Woe') {
        if (!this.hitches) this.hitches = [];
        const hasWoe = this.hitches.some(h => h.bane >= 20);
        if (!hasWoe && codexLoader) {
            const woe = new Hitch(codexLoader, {
                name: name,
                description: 'A source of Twists.',
                bane: 25,
                tags: { facets: ['Wyrd'] },
                root: 'prof_woe_root',
                channel: 'prof_woe_channel'
            });
            this.hitches.push(woe);
        }
    }
};

export const FaeNature = (Base) => class extends Base {
    constructor(...args) {
        super(...args);
        const data = args[1] || {};
        this.isFae = true;
        this.faeState = data.faeState || 'Seelie';
        this.faeCycle = data.faeCycle || 'Diurnal';
        this.updateFaeCapabilities();
    }

    setFaeState(state) {
        this.faeState = state;
        this.updateFaeCapabilities();
    }

    updateFaeCapabilities() {
        this.canUseTwists = (this.faeState === 'Unseelie');
        this.canUseGoldenYarn = (this.faeState === 'Seelie');
    }
};







