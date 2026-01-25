import { Character } from '../t13ne-chars.js';
import { Grunt, Hero, YarnTeller } from './t13ne-char-types.js';
import { Annex, Hitch, SizeAnnex, TIE } from '../t13ne-knots.js';
import Logger from '@/js/core/Logger.js';

// Helper functions for common traits
function ensureWoe(character, codexLoader, name) {
    if (!character.hitches) character.hitches = [];
    const hasWoe = character.hitches.some(h => h.bane >= 20);
    if (!hasWoe) {
        const woe = new Hitch(codexLoader, {
            name: name || 'Woe',
            description: 'A source of Twists.',
            bane: 25,
            tags: { facets: ['Wyrd'] },
            root: 'prof_woe_root',
            channel: 'prof_woe_channel'
        });
        character.hitches.push(woe);
    }
}

function ensureSize(character, codexLoader, size, name) {
    if (!character.subAnnexes) character.subAnnexes = [];
    const hasSize = character.subAnnexes.some(a => a.annexType === 'Size') || (character.masterAnnex && character.masterAnnex.annexType === 'Size');
    if (!hasSize) {
        const sizeAnnex = new SizeAnnex(codexLoader, {
            name: name || 'Size',
            description: 'Increased scale and mass.',
            size: size,
            proficiencies: [
                { profId: 'prof_size_root', knot: TIE.ROOT | TIE.THREAD },
                { profId: 'prof_size_channel', knot: TIE.CHANNEL | TIE.THREAD }
            ]
        });
        character.subAnnexes.push(sizeAnnex);
    }
}

export class Neechie extends Character {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Neechie';
        // Neechies are non-beings, often without standard Annexes
    }
}

export class Monster extends Character {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = data.charType || 'Monster';
        if (!this.tags.types) this.tags.types = [];
        if (!this.tags.types.includes('Monster')) this.tags.types.push('Monster');
    }
}

export class Goblin extends Grunt {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Goblin';
        ensureWoe(this, codexLoader, 'Goblin Nature');
    }
}

export class Hobgoblin extends Hero {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Hobgoblin';
        this.canUseTwists = true;
    }
}

export class Ogre extends Hobgoblin {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Ogre';
        this.canUseYarn = true;
    }
}

export class Demon extends Hero {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Demon';
        ensureWoe(this, codexLoader, 'Demonic Nature');
    }
}

export class Demoniac extends Hero {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Demoniac';
        // Possessed heroes
    }
}

export class Wyrdchilde extends Hero {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Wyrdchilde';
    }
}

export class DemonLord extends YarnTeller {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Demon-Lord';
        ensureWoe(this, codexLoader, 'Archfiend Nature');
    }
}

export class GestaltMercari extends YarnTeller {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Gestalt Mercari';
    }
}

export class Kaiju extends Character {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Kaiju';
        ensureSize(this, codexLoader, 20, 'Kaiju Size');
        if (!this.tags.genres) this.tags.genres = [];
        this.tags.genres.push('Kaiju');
    }
}

export class Increated extends Character {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Increated';
        this.canUseTwists = true;
        ensureWoe(this, codexLoader, 'Increated Nature');
    }
}

export class PatronDaemon extends Increated {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Patron Dæmon';
    }
}

export class Fae extends YarnTeller {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Fae';
        this.canUseWyrdTarot = true;
        this.canUseFaeYarn = true;
    }
}

export class FaeCommoner extends Hero {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Fae Commoner';
        this.canUseWyrdTarot = true;
        this.handSizeModifier = (this.handSizeModifier || 0) + 2;
    }
}

export class HybridFae extends Hero {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Eelafin';
        this.canUseWyrdTarot = true;
        this.handSizeModifier = (this.handSizeModifier || 0) + 1;
    }
}

export class Elane extends HybridFae {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Eelané';
        this.canUseTwists = true;
    }
}

export class Renegade extends Hero {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Renegade';
        this.canUseTwists = true;
        ensureWoe(this, codexLoader, 'Renegade Nature');
    }
}

export class Cambion extends Hero {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Cambion';
        this.canUseTwists = true;
        this.canConvertChiToTwists = true;
    }
}

export class Archmage extends Cambion {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Archmage';
        this.canUseYarn = true;
    }
}

export class Toon extends Character {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Toon';
        this.isToon = true;
        
        const toonPhysics = new Annex(codexLoader, {
            name: 'Toon Physics',
            description: 'Bend reality for comedic effect.',
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

export class BattleToon extends Toon {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Battle Toon';
        this.canUseTwists = true;
        this.canUseYarn = true;
        ensureSize(this, codexLoader, 10, 'Battle Toon Size');
    }
}

export class Bulmas extends Character {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Bulmas';
        this.path = data.path || 'Herd'; // Default path
        this.canWalkLea = true;
        this.canEatSouls = true;
        
        this.ensureLeaWalking(codexLoader);
    }

    getLeaCapabilities() {
        const caps = {
            'Herd': 'Can walk migratory paths of herbivores. Limited to group travel.',
            'Hunter': 'Can walk predatory paths. Tracking and pursuit bonuses.',
            'Broccen': 'Territorial paths. Can create new paths within territory.',
            'Vermis': 'Paths of decay and rebirth. Can access the Underworld.',
            'Labyrinthine': 'Urban and complex paths. Can navigate the Labyrinth and find lost things.',
            'All-Walker': 'Can walk any path. Soul duplication and manipulation.',
            'Hell-Walker': 'Increated/Twisted paths. Hunting souls for masters.'
        };
        return caps[this.path] || caps['Herd'];
    }

    ensureLeaWalking(codexLoader) {
        const hasLea = this.subAnnexes.some(a => a.name.toLowerCase().includes('lea'));
        if (!hasLea) {
            const leaWalk = new Annex(codexLoader, {
                name: 'Lea Walking',
                description: `Travel through the spirit paths of the Lea (${this.path}). ${this.getLeaCapabilities()}`,
                tags: { facets: ['Yonder', 'Nature'] },
                proficiencies: [
                    { profId: `prof_lea_root_${this.path.toLowerCase()}`, knot: TIE.ROOT | TIE.THREAD },
                    { profId: `prof_lea_channel_${this.path.toLowerCase()}`, knot: TIE.CHANNEL | TIE.THREAD }
                ]
            });
            leaWalk.annexType = 'Talent';
            this.subAnnexes.push(leaWalk);
        }
    }
}

export class Immortal extends Hero {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Immortal';
        this.isImmortal = true;
    }
}

export class Eternal extends Immortal {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Eternal';
        this.canUseYarn = true;
        this.canDoomWeave = true;
    }
}

export class Paragon extends Character {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Paragon';
        this.scaleModifier = 13;
    }
}

export class LesserDivinity extends YarnTeller {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Lesser Divinity';
        this.isImmuneToSway = true;
    }
}

export class God extends LesserDivinity {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'God';
        this.isImmuneToChi = true;
    }
}

export class SupremeGod extends God {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Supreme God';
        this.canUseTwists = true;
    }
}
