/**
 * @module Avatar/AvatarFacetBody
 * @description Maps a character's T13 Facet Boons onto procedural body proportions.
 *
 * Burden sets corpulence (build), Nature sets size (height), Gossamer sets musculature,
 * and Zeal against Inertia sets litheness (quick, slender limbs) versus momentum (heavier, stockier limbs).
 * Pure data with no three.js, so it runs in Node and in workers.
 */

import burdenData from '../../data/facets/burden.js';
import gossamerData from '../../data/facets/gossamer.js';
import natureData from '../../data/facets/nature.js';
import zealData from '../../data/facets/zeal.js';
import inertiaData from '../../data/facets/inertia.js';
import aweData from '../../data/facets/awe.js';
import miasmaData from '../../data/facets/miasma.js';

export const FACET_INDEX = Object.freeze({ AWE: 0, BURDEN: 1, INERTIA: 8, GOSSAMER: 6, NATURE: 13, ZEAL: 23, MIASMA: 12 });

const FACET_DATA = Object.freeze({
    [FACET_INDEX.AWE]: aweData,
    [FACET_INDEX.BURDEN]: burdenData,
    [FACET_INDEX.GOSSAMER]: gossamerData,
    [FACET_INDEX.NATURE]: natureData,
    [FACET_INDEX.ZEAL]: zealData,
    [FACET_INDEX.INERTIA]: inertiaData,
    [FACET_INDEX.MIASMA]: miasmaData
});

const DESCRIPTOR_FACETS = Object.freeze([
    ['awe', FACET_INDEX.AWE],
    ['burden', FACET_INDEX.BURDEN],
    ['nature', FACET_INDEX.NATURE],
    ['gossamer', FACET_INDEX.GOSSAMER],
    ['zeal', FACET_INDEX.ZEAL],
    ['inertia', FACET_INDEX.INERTIA],
    ['miasma', FACET_INDEX.MIASMA]
]);

const SICKLY_TINT = 0x7d8a3c;

// Material family per Formation (the Incarna facet). Unlisted Incarna fall back to flesh.
export const FORMATION_MATERIALS = Object.freeze({
    Nature: 'flesh',
    Trial: 'metal',
    Quiet: 'wood',
    Rook: 'armour',
    Phoenix: 'fire',
    Liberty: 'dream',
    Sin: 'vice',
    Yonder: 'structure',
    Virtue: 'energy',
    Wyrd: 'arcane',
    Key: 'thought',
    Miasma: 'toxin',
    Jeer: 'illusion',
    Enigma: 'cryptic',
    Dominion: 'society',
    Orthodox: 'data',
    Inertia: 'clockwork'
});

/**
 * @param {string|null|undefined} incarna - FacetName of the Descendant's Incarna.
 * @returns {string} Material family key.
 */
export function materialForFormation(incarna) {
    return FORMATION_MATERIALS[incarna] ?? FORMATION_MATERIALS.Nature;
}

// Boon 13 is the neutral Archetype value. Each 13 points away from it reaches the full range.
export const NEUTRAL_BOON = 13;
const BOON_SPAN = 13;

const clampSigned = (t) => Math.max(-1, Math.min(1, t));

const signedBoon = (boon) => {
    const value = Number.isFinite(boon) ? boon : NEUTRAL_BOON;
    return clampSigned((value - NEUTRAL_BOON) / BOON_SPAN);
};

/**
 * Converts Facet Boons into body values.
 * @param {Object<number, number>} [boons] - Boon keyed by FacetIndex. Missing facets count as neutral.
 * @returns {{height: number, build: number, musculature: number, litheness: number}}
 *   height and build are scale factors around 1. musculature and litheness run from -1 to 1.
 */
export function bodyFromFacets(boons = {}) {
    const burden = signedBoon(boons[FACET_INDEX.BURDEN]);
    const nature = signedBoon(boons[FACET_INDEX.NATURE]);
    const gossamer = signedBoon(boons[FACET_INDEX.GOSSAMER]);
    const zeal = signedBoon(boons[FACET_INDEX.ZEAL]);
    const inertia = signedBoon(boons[FACET_INDEX.INERTIA]);
    return {
        height: 1 + 0.1 * nature,
        build: 1 + 0.2 * burden,
        musculature: gossamer,
        litheness: clampSigned((zeal - inertia) / 2)
    };
}

/**
 * Reads Boons from a character's facetweb Stats, where each entry is an opposed pair.
 * @param {Array<{Facet: number, Antifacet: number, Facet_Boon: number, Antifacet_Boon: number}>} [stats]
 * @returns {Object<number, number>} Boon keyed by FacetIndex.
 */
export function facetBoonsFromStats(stats = []) {
    const boons = {};
    for (const pair of stats) {
        boons[pair.Facet] = pair.Facet_Boon;
        boons[pair.Antifacet] = pair.Antifacet_Boon;
    }
    return boons;
}

/**
 * The adjective rung for a facet at a boon: the highest rung whose Boon is at or below the value.
 * @param {number} facetIndex
 * @param {number} [boon]
 * @returns {{Boon: number, Adjective: string, Desc_Adjective: string, Location_Adjective: string}|null}
 */
export function adjectiveForBoon(facetIndex, boon) {
    const ladder = FACET_DATA[facetIndex]?.FacetAdjectives;
    if (!ladder || ladder.length === 0) return null;
    const value = Number.isFinite(boon) ? boon : NEUTRAL_BOON;
    let match = ladder[0];
    for (const rung of ladder) {
        if (rung.Boon <= value) match = rung;
    }
    return match;
}

/**
 * Appearance values from Awe (colour vividness) and Miasma (skin tint and mottling), plus the adjective for each facet used.
 * @param {Object<number, number>} [boons]
 * @returns {{clothingVividness: number, skinTint: number, mottle: number, descriptors: Object<string, string>}}
 */
export function appearanceFromFacets(boons = {}) {
    const awe = signedBoon(boons[FACET_INDEX.AWE]);
    const miasma = signedBoon(boons[FACET_INDEX.MIASMA]);
    const descriptors = {};
    for (const [key, index] of DESCRIPTOR_FACETS) {
        descriptors[key] = adjectiveForBoon(index, boons[index])?.Adjective ?? null;
    }
    return {
        clothingVividness: 1 + 0.5 * awe,
        skinTint: miasma,
        mottle: Math.max(0, miasma),
        descriptors
    };
}

const toRgb = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
const clampByte = (v) => Math.max(0, Math.min(255, Math.round(v)));
const fromRgb = (r, g, b) => (clampByte(r) << 16) | (clampByte(g) << 8) | clampByte(b);
const mixHex = (hex, target, t) => {
    const from = toRgb(hex);
    const to = toRgb(target);
    return fromRgb(...from.map((c, i) => c + (to[i] - c) * t));
};

/**
 * Pushes a colour away from (vividness > 1) or toward (vividness < 1) its luma grey.
 * @param {number} hex
 * @param {number} vividness
 * @returns {number}
 */
export function applyVividness(hex, vividness) {
    const [r, g, b] = toRgb(hex);
    const grey = 0.299 * r + 0.587 * g + 0.114 * b;
    return fromRgb(grey + (r - grey) * vividness, grey + (g - grey) * vividness, grey + (b - grey) * vividness);
}

/**
 * Shifts skin toward a sickly olive for positive Miasma and toward pale for negative Miasma.
 * @param {number} hex
 * @param {number} skinTint - Signed Miasma, -1 to 1.
 * @returns {number}
 */
export function tintSkin(hex, skinTint) {
    if (skinTint > 0) return mixHex(hex, SICKLY_TINT, 0.25 * skinTint);
    if (skinTint < 0) return mixHex(hex, 0xffffff, -0.1 * skinTint);
    return hex;
}
