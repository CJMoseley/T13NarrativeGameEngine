/**
 * @module Games/WormholeRacers/WormholeSpeciesAdapter
 * @description Adapts Wormhole Racers' sci-fi species templates and procedural SpeciesGenerator records
 * onto canonical T13 Species Descendant objects.
 *
 * Wormhole Racers species form a setting-specific subset within T13's 'human' and 'alien' categories.
 */

import {
    createHumanSpeciesDescendant,
    createSpeciesDescendant
} from '../../modules/characters/T13SpeciesDescendant.js';

const WORMHOLE_TEMPLATE_PROFILES = Object.freeze({
    SPECIES_HUMANS: {
        category: 'human',
        incarna: 'Nature',
        bodyPlan: 'humanoid',
        voiceProfile: { preset: 'neutral', pitchSemitones: 0, formantShift: 0, dryWet: 0 }
    },
    SPECIES_THERIOS: {
        category: 'alien',
        incarna: 'Nature',
        bodyPlan: 'humanoid',
        voiceProfile: { preset: 'subharmonic-growl', pitchSemitones: -1.5, formantShift: -0.1, dryWet: 0.35 }
    },
    SPECIES_DRONES: {
        category: 'alien',
        incarna: 'Trial',
        bodyPlan: 'humanoid',
        voiceProfile: { preset: 'metallic-ring', pitchSemitones: 0, formantShift: 0.15, dryWet: 0.55 }
    },
    SPECIES_FIRST_RELIC: {
        category: 'alien',
        incarna: 'Enigma',
        bodyPlan: 'spider',
        sizeMatrix: {
            mode: 'fixedCm',
            baseHeightCm: 500,
            boonSpanCm: 40,
            adjustments: []
        },
        voiceProfile: { preset: 'deep-resonator', pitchSemitones: -6, formantShift: -0.35, dryWet: 0.65 }
    },
    SPECIES_DRACO: {
        category: 'alien',
        incarna: 'Nature',
        bodyPlan: 'humanoid',
        voiceProfile: { preset: 'subharmonic-growl', pitchSemitones: -3, formantShift: -0.2, dryWet: 0.45 }
    },
    SPECIES_GRENK: {
        category: 'alien',
        incarna: 'Nature',
        bodyPlan: 'humanoid',
        voiceProfile: { preset: 'deep-resonator', pitchSemitones: -2, formantShift: -0.15, dryWet: 0.3 }
    },
    SPECIES_VEMLEK: {
        category: 'alien',
        incarna: 'Trial',
        bodyPlan: 'humanoid',
        voiceProfile: { preset: 'synth-vocoder', pitchSemitones: -1, formantShift: 0.2, dryWet: 0.7 }
    },
    SPECIES_VEMLEKO: {
        category: 'alien',
        incarna: 'Trial',
        bodyPlan: 'humanoid',
        voiceProfile: { preset: 'synth-vocoder', pitchSemitones: 1, formantShift: 0.1, dryWet: 0.5 }
    },
    SPECIES_CONVERGENT: {
        category: 'alien',
        incarna: 'Orthodox',
        bodyPlan: 'humanoid',
        voiceProfile: { preset: 'synth-vocoder', pitchSemitones: 0, formantShift: 0, dryWet: 0.75 }
    },
    SPECIES_KATHORRI: {
        category: 'alien',
        incarna: 'Burden',
        bodyPlan: 'quadruped',
        voiceProfile: { preset: 'hive-chorus', pitchSemitones: 2, formantShift: 0.25, dryWet: 0.65 }
    },
    SPECIES_THFTHF: {
        category: 'alien',
        incarna: 'Gossamer',
        bodyPlan: 'humanoid',
        voiceProfile: { preset: 'ethereal-shimmer', pitchSemitones: 3, formantShift: 0.3, dryWet: 0.6 }
    }
});

const ARCHETYPE_TO_INCARNA = Object.freeze({
    ARCHETYPE_PRIMORDIAL: 'Enigma',
    ARCHETYPE_BIOLOGICAL_CARBON: 'Nature',
    BIOLOGICAL_CARBON: 'Nature',
    ARCHETYPE_BIOLOGICAL_CRYSTALLINE: 'Burden',
    ARCHETYPE_SYNTHETIC: 'Orthodox',
    ARCHETYPE_BIOLOGICAL_PLASMA: 'Phoenix',
    ARCHETYPE_BIOLOGICAL_ENERGETIC: 'Virtue',
    ARCHETYPE_BIOLOGICAL_SILICON: 'Burden',
    ARCHETYPE_BIOLOGICAL_GASEOUS: 'Gossamer'
});

function inferBodyPlan(wrSpecies) {
    const raw = String(wrSpecies?.bodyPlan ?? wrSpecies?.baseTraits?.bodyPlan ?? '').toLowerCase();
    if (raw.includes('octopod') || raw.includes('spider') || raw.includes('arachnid')) return 'spider';
    if (raw.includes('quadruped') || wrSpecies?.baseTraits?.locomotiveLimbs === 4) return 'quadruped';
    return 'humanoid';
}

function inferVoiceProfile(incarna, wrSpecies) {
    const bodyText = `${wrSpecies?.bodyPlan ?? ''} ${(wrSpecies?.traits ?? []).join(' ')}`.toLowerCase();
    if (bodyText.includes('insect') || bodyText.includes('hexapod')) {
        return { preset: 'chitin-click', pitchSemitones: 2, formantShift: 0.25, dryWet: 0.55 };
    }
    if (incarna === 'Trial' || incarna === 'Orthodox') {
        return { preset: 'metallic-ring', pitchSemitones: 0, formantShift: 0.15, dryWet: 0.6 };
    }
    if (incarna === 'Gossamer' || incarna === 'Virtue') {
        return { preset: 'ethereal-shimmer', pitchSemitones: 2, formantShift: 0.2, dryWet: 0.55 };
    }
    if (incarna === 'Burden') {
        return { preset: 'deep-resonator', pitchSemitones: -3, formantShift: -0.25, dryWet: 0.5 };
    }
    if (incarna === 'Phoenix') {
        return { preset: 'subharmonic-growl', pitchSemitones: -1, formantShift: 0.1, dryWet: 0.45 };
    }
    return { preset: 'neutral', pitchSemitones: 0, formantShift: 0, dryWet: 0 };
}

/**
 * Adapts a Wormhole Racers species template or procedural species lore object into
 * a canonical T13 Species Descendant.
 * @param {object} wrSpecies
 * @returns {object}
 */
export function adaptWormholeSpeciesToT13Descendant(wrSpecies = {}) {
    const rawId = String(wrSpecies.id ?? wrSpecies.templateId ?? '').trim();
    const rawName = String(wrSpecies.name ?? wrSpecies.commonName ?? '').trim();
    const profile = WORMHOLE_TEMPLATE_PROFILES[rawId]
        || (rawName.toLowerCase() === 'humans' || rawName.toLowerCase() === 'human' ? WORMHOLE_TEMPLATE_PROFILES.SPECIES_HUMANS : null);

    if (rawId === 'SPECIES_HUMANS' || profile?.category === 'human') {
        return createHumanSpeciesDescendant({
            id: rawId || 'wr-species-humans',
            name: 'Humans',
            commonName: wrSpecies.commonName ?? 'Humans',
            scientificName: wrSpecies.scientificNaming?.name ?? wrSpecies.scientificName ?? 'Homo Sapiens Sapiens',
            description: wrSpecies.desc ?? wrSpecies.description ?? 'Wormhole Racers Humans adapted as a T13 Human Species Descendant.',
            avatarSkins: wrSpecies.avatarSkins ?? [],
            sourceMetadata: {
                source: 'wormhole-racers',
                sourceId: rawId || 'SPECIES_HUMANS',
                color: wrSpecies.color ?? null,
                derivedTraits: wrSpecies.derivedTraits ?? null
            }
        });
    }

    const archetypeKey = wrSpecies.derivesFrom ?? wrSpecies.archetype ?? wrSpecies.baseTraits?.archetype;
    const incarna = profile?.incarna ?? ARCHETYPE_TO_INCARNA[archetypeKey] ?? 'Nature';
    const bodyPlan = profile?.bodyPlan ?? inferBodyPlan(wrSpecies);
    const voiceProfile = profile?.voiceProfile ?? inferVoiceProfile(incarna, wrSpecies);
    const name = rawName || rawId || 'Unknown Alien Species';

    return createSpeciesDescendant({
        id: rawId || `wr-species-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
        name,
        commonName: wrSpecies.commonName ?? name,
        scientificName: wrSpecies.scientificNaming?.name ?? wrSpecies.scientificName ?? null,
        description: wrSpecies.desc ?? wrSpecies.description ?? '',
        category: profile?.category ?? 'alien',
        incarna,
        bodyPlan,
        sizeMatrix: profile?.sizeMatrix ?? wrSpecies.sizeMatrix ?? null,
        voiceProfile,
        avatarSkins: wrSpecies.avatarSkins ?? [],
        sourceMetadata: {
            source: 'wormhole-racers',
            sourceId: rawId || name,
            archetype: wrSpecies.archetype ?? wrSpecies.derivesFrom ?? null,
            wormholeBodyPlan: wrSpecies.bodyPlan ?? null,
            traits: Array.isArray(wrSpecies.traits) ? [...wrSpecies.traits] : [],
            color: wrSpecies.color ?? null,
            derivedTraits: wrSpecies.derivedTraits ?? null
        }
    });
}
