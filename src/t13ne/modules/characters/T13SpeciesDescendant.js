/**
 * @module Modules/Characters/T13SpeciesDescendant
 * @description Canonical schema and helpers for T13 Species represented as Descendant patterns
 * (typically Natural Nature Descendants paired with Formation Incarna).
 *
 * Distinct from Wormhole Racers' sci-fi species catalog: Wormhole Racers species map into this
 * schema as a setting subset inside T13's 'human' and 'alien' categories via WormholeSpeciesAdapter.
 */

import {
    FORMATION_MATERIALS,
    HUMAN_SIZE_MATRIX,
    calculateSpeciesSize,
    materialForFormation,
    resolveFormation
} from '../../procgen/avatar/AvatarFacetBody.js';

export const T13_SPECIES_CATEGORIES = Object.freeze([
    'human',
    'alien',
    'fantasy',
    'construct',
    'spirit',
    'mythic',
    'custom'
]);

const DEFAULT_VOICE_PROFILE = Object.freeze({
    preset: 'neutral',
    pitchSemitones: 0,
    formantShift: 0,
    dryWet: 0
});

/**
 * Normalizes a Formation Incarna name against the canonical 24 Facets.
 * @param {string|null|undefined} incarna
 * @param {string} [fallback='Nature']
 * @returns {string}
 */
export function normalizeFormation(incarna, fallback = 'Nature') {
    if (typeof incarna === 'string') {
        const trimmed = incarna.trim();
        if (Object.hasOwn(FORMATION_MATERIALS, trimmed)) return trimmed;
        const matched = Object.keys(FORMATION_MATERIALS).find(
            key => key.toLowerCase() === trimmed.toLowerCase()
        );
        if (matched) return matched;
    }
    return Object.hasOwn(FORMATION_MATERIALS, fallback) ? fallback : 'Nature';
}

/**
 * Creates a normalized T13 Species Descendant record.
 * @param {object} [spec]
 * @returns {object}
 */
export function createSpeciesDescendant(spec = {}) {
    const name = String(spec.name ?? spec.commonName ?? 'Unnamed Species').trim() || 'Unnamed Species';
    const rawId = spec.id ?? `species-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
    const id = String(rawId).trim() || 'species-unnamed';
    const rawCategory = String(spec.category ?? (name.toLowerCase() === 'human' || name.toLowerCase() === 'humans' ? 'human' : 'custom')).trim().toLowerCase();
    const category = T13_SPECIES_CATEGORIES.includes(rawCategory) ? rawCategory : 'custom';

    const incarna = normalizeFormation(spec.incarna ?? spec.formation, 'Nature');
    const formationMaterial = materialForFormation(incarna);

    const voiceProfile = {
        ...DEFAULT_VOICE_PROFILE,
        ...(spec.voiceProfile && typeof spec.voiceProfile === 'object' ? spec.voiceProfile : {})
    };

    const masterAnnex = spec.masterAnnex && typeof spec.masterAnnex === 'object'
        ? { ...spec.masterAnnex }
        : {
            name: `${name} Lineage`,
            annexType: 'Descendant',
            facet: incarna,
            description: `Natural lineage Descendant for ${name}.`
        };

    return {
        id,
        name,
        commonName: spec.commonName ?? name,
        scientificName: spec.scientificName ?? null,
        description: spec.description ?? '',
        descendantType: 'Species',
        category,
        incarna,
        formation: incarna,
        formationMaterial,
        bodyPlan: spec.bodyPlan ?? 'humanoid',
        sizeMatrix: spec.sizeMatrix ?? (category === 'human' ? HUMAN_SIZE_MATRIX : null),
        voiceProfile,
        masterAnnex,
        naturalAnnexes: Array.isArray(spec.naturalAnnexes) ? spec.naturalAnnexes.map(a => ({ ...a })) : [],
        naturalHitches: Array.isArray(spec.naturalHitches) ? spec.naturalHitches.map(h => ({ ...h })) : [],
        avatarSkins: Array.isArray(spec.avatarSkins) ? spec.avatarSkins.map(s => ({ ...s })) : [],
        tags: {
            ...(spec.tags && typeof spec.tags === 'object' ? spec.tags : {}),
            facets: Array.isArray(spec.tags?.facets) && spec.tags.facets.length > 0
                ? [...spec.tags.facets]
                : [incarna]
        },
        sourceMetadata: spec.sourceMetadata && typeof spec.sourceMetadata === 'object'
            ? { ...spec.sourceMetadata }
            : { source: 't13-core', sourceId: id }
    };
}

/**
 * Creates the baseline canonical T13 Human Species Descendant.
 * @param {object} [overrides]
 * @returns {object}
 */
export function createHumanSpeciesDescendant(overrides = {}) {
    return createSpeciesDescendant({
        id: 't13-species-human',
        name: 'Human',
        commonName: 'Humans',
        scientificName: 'Homo Sapiens',
        description: 'Canonical baseline T13 Human lineage Descendant (Nature Incarna / Flesh).',
        category: 'human',
        incarna: 'Nature',
        bodyPlan: 'humanoid',
        sizeMatrix: HUMAN_SIZE_MATRIX,
        voiceProfile: {
            preset: 'neutral',
            pitchSemitones: 0,
            formantShift: 0,
            dryWet: 0
        },
        ...overrides
    });
}

/**
 * Validates a T13 Species Descendant specification.
 * @param {object} spec
 * @returns {{valid: boolean, errors: string[], normalized: object|null}}
 */
export function validateSpeciesDescendant(spec) {
    const errors = [];
    if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
        return { valid: false, errors: ['Species Descendant spec must be a plain object.'], normalized: null };
    }
    const name = String(spec.name ?? spec.commonName ?? '').trim();
    if (!name) {
        errors.push('Species Descendant requires a non-empty name.');
    }
    if (spec.descendantType !== undefined && spec.descendantType !== 'Species') {
        errors.push(`Expected descendantType 'Species', received '${spec.descendantType}'.`);
    }
    if (spec.incarna !== undefined && spec.incarna !== null) {
        const raw = String(spec.incarna).trim();
        const exists = Object.keys(FORMATION_MATERIALS).some(k => k.toLowerCase() === raw.toLowerCase());
        if (!exists) {
            errors.push(`Unknown Formation Incarna '${spec.incarna}'.`);
        }
    }
    if (spec.category !== undefined && !T13_SPECIES_CATEGORIES.includes(String(spec.category).toLowerCase())) {
        errors.push(`Unknown T13 species category '${spec.category}'.`);
    }
    if (spec.sizeMatrix !== undefined && spec.sizeMatrix !== null) {
        if (typeof spec.sizeMatrix !== 'object' || Array.isArray(spec.sizeMatrix)) {
            errors.push('sizeMatrix must be an object or null.');
        } else if (spec.sizeMatrix.adjustments !== undefined && !Array.isArray(spec.sizeMatrix.adjustments)) {
            errors.push('sizeMatrix.adjustments must be an array when provided.');
        }
    }

    if (errors.length > 0) {
        return { valid: false, errors, normalized: null };
    }
    return { valid: true, errors: [], normalized: createSpeciesDescendant(spec) };
}

/**
 * Resolves a character's effective species Descendant, Formation (Character takes precedence),
 * physical height in cm, and VOIP voice profile.
 * @param {object|null} character
 * @param {object|Map|null} [speciesInput] - Either a single species object or an id/name lookup registry.
 * @returns {object}
 */
export function resolveCharacterSpecies(character = null, speciesInput = null) {
    let species = null;
    if (speciesInput instanceof Map) {
        const key = character?.speciesDescendantId ?? character?.speciesId ?? character?.species ?? null;
        if (key != null) species = speciesInput.get(key) ?? null;
    } else if (speciesInput && typeof speciesInput === 'object') {
        if (speciesInput.descendantType === 'Species' || speciesInput.sizeMatrix || speciesInput.name || speciesInput.commonName) {
            species = speciesInput;
        } else {
            const key = character?.speciesDescendantId ?? character?.speciesId ?? character?.species ?? null;
            if (key != null && Object.hasOwn(speciesInput, key)) species = speciesInput[key];
        }
    }

    if (!species && character?.speciesDescendant && typeof character.speciesDescendant === 'object') {
        species = character.speciesDescendant;
    }

    const { formation, material } = resolveFormation(character, species);
    const boons = character?.facetweb?.Stats ?? character?.boons ?? {};
    const size = calculateSpeciesSize({
        boons,
        phenotype: character?.phenotype ?? {},
        species,
        character
    });

    const voiceProfile = {
        ...DEFAULT_VOICE_PROFILE,
        ...(species?.voiceProfile && typeof species.voiceProfile === 'object' ? species.voiceProfile : {}),
        ...(character?.voiceProfile && typeof character.voiceProfile === 'object' ? character.voiceProfile : {})
    };

    return {
        species,
        formation,
        material,
        size,
        voiceProfile
    };
}
