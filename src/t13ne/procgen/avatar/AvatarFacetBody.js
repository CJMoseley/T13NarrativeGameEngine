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
import T13Boons from '../../modules/mechanics/t13ne-boon.js';

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

// Material family per Formation (the Incarna facet), taken from each facet's Incarna_Text.
export const FORMATION_MATERIALS = Object.freeze({
    Nature: 'flesh',
    Awe: 'spirit',
    Burden: 'stone',
    Craft: 'artifice',
    Dominion: 'society',
    Enigma: 'cryptic',
    Fury: 'liquid',
    Gossamer: 'gas',
    Heresy: 'simulacrum',
    Inertia: 'clockwork',
    Jeer: 'illusion',
    Key: 'thought',
    Liberty: 'dream',
    Miasma: 'toxin',
    Orthodox: 'data',
    Phoenix: 'fire',
    Quiet: 'wood',
    Rook: 'armour',
    Sin: 'vice',
    Trial: 'metal',
    Virtue: 'energy',
    Wyrd: 'arcane',
    Yonder: 'structure',
    Zeal: 'belief'
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
export const INCHES_TO_CM = 2.54;

export const HUMAN_NEUTRAL_HEIGHT_CM = T13Boons.getBoonValue(NEUTRAL_BOON) * INCHES_TO_CM; // 167.64 cm

export const HUMAN_SIZE_MATRIX = Object.freeze({
    mode: 'natureValueInchesToCm',
    facetIndex: FACET_INDEX.NATURE,
    referenceHeightCm: HUMAN_NEUTRAL_HEIGHT_CM,
    adjustments: Object.freeze([])
});

/**
 * Resolves effective Formation (Incarna facet) and material family.
 * A Character's or Descendant's Formation takes precedence over the species Formation.
 * @param {object|null} [entity]
 * @param {object|null} [species]
 * @returns {{formation: string, material: string}}
 */
export function resolveFormation(entity = null, species = null) {
    const tagFacet = entity?.tags?.facets?.find(f => Object.hasOwn(FORMATION_MATERIALS, f));
    const raw = entity?.incarna || entity?.formation || tagFacet || species?.incarna || species?.formation || 'Nature';
    const formation = Object.hasOwn(FORMATION_MATERIALS, raw) ? raw : 'Nature';
    return { formation, material: materialForFormation(raw) };
}

/**
 * Checks whether a character's phenotype attributes match a species adjustment rule's criteria.
 * No universal sex, caste, or race modifiers are assumed.
 * @param {object} [phenotype]
 * @param {object} [match]
 * @returns {boolean}
 */
export function matchesPhenotype(phenotype = {}, match = {}) {
    if (!match || typeof match !== 'object') return true;
    for (const [key, expected] of Object.entries(match)) {
        const actual = phenotype?.[key];
        if (actual == null) return false;
        const actualNorm = String(actual).trim().toLowerCase();
        if (Array.isArray(expected)) {
            if (!expected.some(v => String(v).trim().toLowerCase() === actualNorm)) return false;
        } else if (actualNorm !== String(expected).trim().toLowerCase()) {
            return false;
        }
    }
    return true;
}

/**
 * Applies the species size adjustment matrix when configured (or the initial Human rule for Human species),
 * retaining the existing Nature-to-height scale behavior when no species size rule is configured.
 * Matching phenotype entries apply in configured order as:
 *   (currentHeightCm + offsetBeforeCm) * multiplier + offsetAfterCm
 * @param {object} [options]
 * @param {Object<number, number>} [options.boons]
 * @param {object} [options.phenotype]
 * @param {object|null} [options.species]
 * @param {object|null} [options.character]
 * @returns {{heightCm: number|null, heightScale: number, formation: string, material: string, ruleApplied: boolean}}
 */
export function calculateSpeciesSize({ boons = {}, phenotype = {}, species = null, character = null } = {}) {
    const { formation, material } = resolveFormation(character, species);
    const speciesIdentity = String(
        species?.id ?? species?.commonName ?? species?.scientificName ?? species?.name ?? character?.species ?? ''
    ).trim().toLowerCase();
    const isHuman = speciesIdentity === 'human' || speciesIdentity === 'humans';
    const matrix = species?.sizeMatrix ?? (isHuman ? HUMAN_SIZE_MATRIX : null);

    if (!matrix) {
        return {
            heightCm: null,
            heightScale: bodyFromFacets(boons).height,
            formation,
            material,
            ruleApplied: false
        };
    }

    const effectivePhenotype = {
        ...(character?.caste != null ? { caste: character.caste } : {}),
        ...(character?.race != null ? { race: character.race } : {}),
        ...(character?.sex != null ? { sex: character.sex } : {}),
        ...(character?.phenotype && typeof character.phenotype === 'object' ? character.phenotype : {}),
        ...(phenotype && typeof phenotype === 'object' ? phenotype : {})
    };

    const facetIndex = matrix.facetIndex ?? FACET_INDEX.NATURE;
    const rawBoon = Number.isFinite(boons[facetIndex]) ? boons[facetIndex] : NEUTRAL_BOON;

    let heightCm;
    if (matrix.mode === 'natureValueInchesToCm' || (!matrix.mode && matrix.baseHeightCm == null)) {
        heightCm = T13Boons.getBoonValue(Math.max(1, rawBoon)) * INCHES_TO_CM;
    } else if (typeof matrix.baseHeightCm === 'number' && Number.isFinite(matrix.baseHeightCm) && matrix.baseHeightCm > 0) {
        if (typeof matrix.valueMultiplierCm === 'number') {
            heightCm = T13Boons.getBoonValue(Math.max(1, rawBoon)) * matrix.valueMultiplierCm;
        } else {
            const spanCm = typeof matrix.boonSpanCm === 'number' ? matrix.boonSpanCm : matrix.baseHeightCm * 0.1;
            heightCm = matrix.baseHeightCm + signedBoon(rawBoon) * spanCm;
        }
    } else {
        throw new TypeError('Species sizeMatrix requires mode "natureValueInchesToCm" or a positive baseHeightCm.');
    }

    const adjustments = matrix.adjustments ?? [];
    if (!Array.isArray(adjustments)) {
        throw new TypeError('Species sizeMatrix.adjustments must be an array.');
    }
    for (const entry of adjustments) {
        if (!entry || typeof entry !== 'object') {
            throw new TypeError('Each species sizeMatrix adjustment must be an object.');
        }
        if (!matchesPhenotype(effectivePhenotype, entry.match)) continue;
        const offsetBeforeCm = entry.offsetBeforeCm ?? 0;
        const multiplier = entry.multiplier ?? 1;
        const offsetAfterCm = entry.offsetAfterCm ?? 0;
        if (!Number.isFinite(offsetBeforeCm) || !Number.isFinite(multiplier) || multiplier <= 0 || !Number.isFinite(offsetAfterCm)) {
            throw new RangeError('Species sizeMatrix adjustment values must be finite with a positive multiplier.');
        }
        heightCm = (heightCm + offsetBeforeCm) * multiplier + offsetAfterCm;
    }

    if (!Number.isFinite(heightCm) || heightCm <= 0) {
        throw new RangeError(`Calculated species height must be positive (got ${heightCm} cm).`);
    }

    const referenceHeightCm = matrix.referenceHeightCm ?? matrix.baseHeightCm ?? HUMAN_NEUTRAL_HEIGHT_CM;
    if (!Number.isFinite(referenceHeightCm) || referenceHeightCm <= 0) {
        throw new RangeError('Species sizeMatrix.referenceHeightCm must be a positive number.');
    }

    return {
        heightCm: Math.round(heightCm * 100) / 100,
        heightScale: heightCm / referenceHeightCm,
        formation,
        material,
        ruleApplied: true
    };
}

/**
 * Formats a centimetre height measurement for UI display.
 * @param {number|null|undefined} heightCm
 * @returns {string|null}
 */
export function formatHeightCm(heightCm) {
    if (!Number.isFinite(heightCm) || heightCm <= 0) return null;
    return `${(Math.round(heightCm * 10) / 10).toFixed(1)} cm`;
}

/**
 * Extracts avatar-relevant Formation, material, and Facet boons from a T13 Descendant.
 * @param {object} descendant
 * @returns {{seed: string, incarna: string, formation: string, material: string, facetBoons: Object<number, number>|null}}
 */
export function descendantAvatarData(descendant) {
    if (!descendant || typeof descendant !== 'object') {
        throw new TypeError('descendantAvatarData requires a Descendant object.');
    }
    const rawName = descendant.name;
    const seed = (Array.isArray(rawName) ? rawName[0] : rawName) || descendant.id || 'descendant';
    const { formation, material } = resolveFormation(descendant, null);
    let facetBoons = null;
    if (Array.isArray(descendant.facetweb?.Stats)) {
        facetBoons = facetBoonsFromStats(descendant.facetweb.Stats);
    } else if (descendant.boons && typeof descendant.boons === 'object') {
        const numeric = Object.entries(descendant.boons).filter(([k, v]) => /^\d+$/.test(k) && Number.isFinite(v));
        if (numeric.length > 0) facetBoons = Object.fromEntries(numeric.map(([k, v]) => [Number(k), v]));
    }
    if (Number.isFinite(descendant.masterAnnex?.size)) {
        facetBoons = { ...(facetBoons || {}), [FACET_INDEX.NATURE]: NEUTRAL_BOON + descendant.masterAnnex.size };
    }
    return { seed: String(seed), incarna: formation, formation, material, facetBoons };
}

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
