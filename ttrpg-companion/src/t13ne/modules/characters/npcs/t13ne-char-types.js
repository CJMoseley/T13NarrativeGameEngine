// d:\GoogleDrive\Games\wormholeracersJS\WormholeRacersJS\plugins\t13ne\modules\npcs\t13ne-types.js
﻿// d:\GoogleDrive\Games\wormholeracersJS\WormholeRacersJS\plugins\t13ne\modules\npcs\t13ne-types.js

import { Character } from "/src/t13ne/modules/characters/t13ne-chars.js";
import { Character } from "../t13ne-chars.js";
import { Detailed } from './t13ne-detailed.js';
import * as Mixins from './t13ne-char-mixins.js';
import { Descendant } from "/src/t13ne/modules/characters/t13ne-descendants.js";
import { Annex, TIE } from "/src/t13ne/modules/mechanics/t13ne-knots.js";
import { Descendant } from "../t13ne-descendants.js";
import { Annex, TIE } from "../../mechanics/t13ne-knots.js";

// --- Base Detailed Types ---

export class Grunt extends Detailed {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Grunt';
        this.canSpendChi = false;
    }
}

export class Hero extends Mixins.ChiUser(Detailed) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Hero';
    }
}

export class YarnTeller extends Mixins.YarnUser(Mixins.ChiUser(Detailed)) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Yarn-Teller';
    }
}

// --- Specific Character Types ---

export class Neechie extends Character {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Neechie';
    }
}

export class Vex extends Character {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Vex';
    }
}

export class Chorus extends Character {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Chorus';
    }
}

export class Cast extends Character {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Cast';
    }
}

export class ForceOfNature extends Mixins.Sized(Character) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Force-of-Nature';
    }
}

export class Mercari extends Mixins.WyrdUser(Hero) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Mercari';
    }
}

export class Wyrdchilde extends Mixins.WyrdUser(Hero) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Wyrdchilde';
        this.canGainMagic = true;
    }
}

export class ParadoxWarrior extends Hero {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Paradox Warrior';
    }
}

export class Goblin extends Mixins.TwistUser(Mixins.WoeUser(Grunt)) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Goblin';
        this.ensureWoe(codexLoader, 'Goblin Nature');
    }
}

export class Bulmas extends Mixins.LeaWalker(Hero) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Bulmas';
        this.path = data.path || 'Herd';
    }
}

export class Monster extends Mixins.MonsterFacetUser(Character) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = data.charType || 'Monster';
        // Level handling would go here or in generation
    }
}

export class Renegade extends Mixins.TwistUser(Mixins.WoeUser(Hero)) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Renegade';
        this.ensureWoe(codexLoader, 'Renegade Nature');
    }
}

export class Demoniac extends Mixins.TwistUser(Hero) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Demoniac';
    }
}

export class Cambion extends Mixins.TwistUser(Mixins.WoeUser(Hero)) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Cambion';
        this.canConvertChiToTwists = true;
        this.ensureWoe(codexLoader, 'Cambion Nature');
    }
}

export class Hobgoblin extends Mixins.TwistUser(Mixins.WoeUser(Hero)) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Hobgoblin';
        this.ensureWoe(codexLoader, 'Hobgoblin Nature');
    }
}

export class Daemon extends Mixins.TwistUser(Mixins.WoeUser(Character)) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'DÃ¦mon';
        this.ensureWoe(codexLoader, 'Increated Nature');
    }
}

export class FaeCommoner extends Mixins.FaeNature(Mixins.WyrdUser(Hero)) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'FÃ¦ Commoner';
        this.handSizeModifier = (this.handSizeModifier || 0) + 2;
    }
}

export class HybridFae extends Mixins.WyrdUser(Hero) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Eelafin';
        this.handSizeModifier = (this.handSizeModifier || 0) + 1;
        this.canMultiTask = true;
        
        const tribes = [
            'Void',       // 0
            'Royalle',    // 1 (Leaders)
            'Secunui',    // 2 (Defenders)
            'Gyzini',     // 3 (Water)
            'Terinni',    // 4 (Earth)
            'Nardani',    // 5 (Flame)
            'Eeluilah',   // 6 (Way)
            'Septimus',   // 7 (Mages)
            'Deude',      // 8 (Wood)
            'Seli',       // 9 (Silver)
            'Auri',       // 10 (Gold)
            'Felumi',     // 11 (Loom)
            'Verssinla',  // 12 (Verses)
            'Rivven'      // 13 (Rift)
        ];

        if (this.geometry && typeof this.geometry.GeometryNumber === 'number') {
            this.tribe = tribes[this.geometry.GeometryNumber] || 'Unknown';
            this.ensureTribalAnnex(codexLoader);
        }
    }

    ensureTribalAnnex(codexLoader) {
        if (!this.subAnnexes) this.subAnnexes = [];
        
        const getFID = (name) => {
            const map = {
                'Awe': 0, 'Burden': 1, 'Craft': 2, 'Dominion': 3, 'Enigma': 4, 'Fury': 5,
                'Gossamer': 6, 'Heresy': 7, 'Inertia': 8, 'Jeer': 9, 'Key': 10, 'Liberty': 11,
                'Miasma': 12, 'Nature': 13, 'Orthodox': 14, 'Phoenix': 15, 'Quiet': 16,
                'Rook': 17, 'Sin': 18, 'Trial': 19, 'Virtue': 20, 'Wyrd': 21, 'Yonder': 22, 'Zeal': 23
            };
            return map[name] !== undefined ? map[name] : -1;
        };

        const addAnnex = (name, desc, facets) => {
             if (this.subAnnexes.some(a => a.name === name)) return;
             if (codexLoader) {
                 const profs = [];
                 if (facets.length > 0) {
                     const rootId = getFID(facets[0]);
                     if (rootId !== -1) profs.push({ profId: rootId, knot: TIE.ROOT | TIE.THREAD });
                     
                     const channelId = facets.length > 1 ? getFID(facets[1]) : rootId;
                     if (channelId !== -1) profs.push({ profId: channelId, knot: TIE.CHANNEL | TIE.THREAD });
                 }

                 const annex = new Annex(codexLoader, {
                    name: name,
                    description: desc,
                    tags: { facets: facets },
                    proficiencies: profs
                });
                this.subAnnexes.push(annex);
             }
        };

        switch (this.tribe) {
            case 'Royalle':
                addAnnex(`${this.tribe} Ability`, 'Natural command and authority.', ['Dominion']);
                break;
            case 'Secunui':
                addAnnex(`${this.tribe} Ability`, 'Defensive capabilities and road protection.', ['Yonder', 'Rook']);
                break;
            case 'Gyzini':
                addAnnex(`${this.tribe} Ability`, 'Water gazing and foresight.', ['Fury', 'Key']);
                break;
            case 'Terinni':
                addAnnex(`${this.tribe} Ability`, 'Great physical strength and toughness.', ['Gossamer', 'Rook']);
                break;
            case 'Nardani':
                addAnnex('Fire Shaping', 'Shaping fire.', ['Craft', 'Phoenix']);
                addAnnex('Illusions', 'Creating illusions.', ['Craft', 'Jeer']);
                break;
            case 'Eeluilah':
                addAnnex(`${this.tribe} Ability`, 'Gate creation and Lea travel.', ['Craft', 'Yonder']);
                break;
            case 'Septimus':
                addAnnex(`${this.tribe} Ability`, 'Innate magical ability.', ['Heresy', 'Wyrd']);
                break;
            case 'Deude':
                addAnnex(`${this.tribe} Ability`, 'Wood shaping.', ['Craft', 'Quiet']);
                break;
            case 'Seli':
                addAnnex(`${this.tribe} Ability`, 'Psychic sensitivity and empathy.', ['Quiet', 'Key']);
                break;
            case 'Auri':
                addAnnex(`${this.tribe} Ability`, 'Inspirational leadership and presence.', ['Awe', 'Dominion']);
                break;
            case 'Felumi':
                addAnnex(`${this.tribe} Ability`, 'Doom reading and fate weaving.', ['Gossamer', 'Wyrd']);
                break;
            case 'Verssinla':
                addAnnex(`${this.tribe} Ability`, 'Perfect pitch and total recall of anything heard.', ['Quiet', 'Orthodox']);
                break;
            case 'Rivven':
                addAnnex(`${this.tribe} Ability`, 'Shape-shifting into animal forms.', ['Nature', 'Jeer']);
                break;
        }
    }
}

export class GestaltMercari extends YarnTeller {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Gestalt Mercari';
    }
}

export class Solo extends YarnTeller {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Solo';
    }
}

export class Brass extends YarnTeller {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Brass';
    }
}

export class Archfiend extends Mixins.TwistUser(Mixins.WoeUser(YarnTeller)) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Archfiend'; // or Demon-Lord
        this.ensureWoe(codexLoader, 'Archfiend Nature');
    }
}

export class Ogre extends Mixins.TwistUser(Mixins.WoeUser(Hero)) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Ogre';
        this.canUseYarn = true; // Ogres can manipulate Yarn
    }
}

export class Archmage extends Mixins.YarnUser(Cambion) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Archmage';
    }
}

export class FaeNoble extends Mixins.FaeNature(Mixins.MonsterFacetUser(YarnTeller)) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'FÃ¦ Noble';
        this.handSizeModifier = (this.handSizeModifier || 0) + 2;
        this.ensureMonsterFacets(1); // Wyrd Monster Facet
    }
}

export class Eelane extends Mixins.YarnUser(HybridFae) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'EelanÃ©';
    }
}

export class BattleToon extends Mixins.Sized(Mixins.ToonPhysics(Mixins.TwistUser(Mixins.YarnUser(Character)))) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Battle Toon';
        this.ensureToonPhysics(codexLoader);
        this.ensureSize(10, codexLoader, 'Battle Toon Size');
    }
}

export class Giant extends Mixins.Sized(FaeCommoner) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Giant';
        this.ensureSize(10, codexLoader, 'Giant Size');
    }
}

export class Ettin extends Mixins.WyrdUser(Mixins.Sized(Ogre)) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Ettin';
        this.ensureSize(12, codexLoader, 'Ettin Size');
    }
}

export class Immortal extends Hero {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Immortal';
        this.isImmortal = true;
    }
}

export class Eternal extends Mixins.YarnUser(Immortal) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Eternal';
    }
}

export class Kaiju extends Mixins.Sized(Mixins.MonsterFacetUser(Mixins.TwistUser(Mixins.YarnUser(Character)))) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Kaiju';
        this.ensureSize(20, codexLoader, 'Kaiju Size');
    }
}

export class Paragon extends Character {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Paragon';
        this.scaleModifier = 13;
    }
}

export class Avatar extends Grunt {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Avatar';
        this.ensureAvatarLore(codexLoader);
    }

    ensureAvatarLore(codexLoader) {
        if (!this.descendants) this.descendants = [];
        const hasLore = this.descendants.some(d => {
            const n = d.name || '';
            return (Array.isArray(n) ? n[0] : n).includes('Avatar of');
        });

        if (!hasLore && codexLoader) {
            // Define knot structure for a valid Annex
            const knotData = [
                { profId: 'prof_avatar_root', knot: TIE.ROOT | TIE.THREAD },
                { profId: 'prof_avatar_channel', knot: TIE.CHANNEL | TIE.THREAD },
                { profId: 'prof_avatar_aura', knot: TIE.NIMBED | TIE.THREAD }
            ];
            
            const divinity = this.personaDetails?.Name || 'Unknown Divinity';
            const loreAnnex = new Annex(codexLoader, { name: `Avatar of ${divinity}`, description: `The lore and power of being an Avatar of ${divinity}. Allows channelling of divine form.`, tags: { facets: ['Wyrd', 'Awe'] }, proficiencies: knotData });
            const loreDescendant = new Descendant(codexLoader, { name: `Avatar of ${divinity}`, description: `A Lore Descendant representing the Avatar status.`, descendantType: 'Lore', masterAnnex: loreAnnex });
            this.descendants.push(loreDescendant);
        }
    }
}

export class DaemonPrince extends Mixins.MonsterFacetUser(Daemon) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'DÃ¦mon-Prince';
        this.ensureMonsterFacets(6); // Arbitrary high level
    }
}

export class LesserDivinity extends Mixins.MonsterFacetUser(YarnTeller) {
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

export class PatronDaemon extends Mixins.TwistUser(DaemonPrince) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Patron DÃ¦mon';
    }
}

export class SupremeGod extends Mixins.TwistUser(God) {
    constructor(codexLoader, data) {
        super(codexLoader, data);
        this.charType = 'Supreme God';
    }
}







