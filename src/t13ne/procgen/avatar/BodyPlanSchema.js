/**
 * @module Avatar/BodyPlanSchema
 * @description Defines the evolutionary mixin-based schema for procedural avatars.
 */

export const COMPONENT_TYPES = {
    TORSO: 'Torso',
    LIMB_CHAIN: 'LimbChain',
    HEAD: 'Head',
    WING: 'Wing',
    TAIL: 'Tail'
};

export const MIXINS = {
    ARM: 'Arm',
    LEG: 'Leg',
    TENTACLE: 'Tentacle',
    SPIDER_LEG: 'SpiderLeg',
    FIN: 'Fin',
    WING_FEATHERED: 'WingFeathered',
    WING_MEMBRANE: 'WingMembrane',
    MANDIBLE: 'Mandible',
    ANTENNA: 'Antenna',
    PROBOSCIS: 'Proboscis'
};

/**
 * Trait definitions that can be applied to components
 */
export const TRAITS = {
    GRACILE: 'Gracile',     // Thin, long limbs
    ROBUST: 'Robust',       // Thick, heavy limbs
    SEGMENTED: 'Segmented', // Highly visible joint separation
    VESTIGIAL: 'Vestigial', // Shrunken, non-functional (visual only)
    HYPERTROPHIED: 'Hypertrophied' // Oversized
};

/**
 * Humanoid parts in metres for an figure about 1.8 m tall, feet on y = 0.
 * Boxes are centred at their offset from the bone origin. Limb segments are joint offsets.
 * Arms hang at rest with a slight outward splay and a forward forearm bend (not a T-pose).
 */
const HUMANOID_PARTS = [
    { id: 'hips', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.95, 0], box: { size: [0.34, 0.14, 0.20], center: [0, 0.005, 0] } },
    { id: 'spine', type: COMPONENT_TYPES.TORSO, parent: 'hips', pos: [0, 0.065, 0], box: { size: [0.32, 0.42, 0.19], center: [0, 0.21, 0] } },
    { id: 'neck', type: COMPONENT_TYPES.TORSO, parent: 'spine', pos: [0, 0.42, 0], box: { size: [0.10, 0.09, 0.11], center: [0, 0.045, 0] } },
    { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'neck', pos: [0, 0.09, 0], box: { size: [0.19, 0.235, 0.20], center: [0, 0.1175, 0] }, features: ['eyes', 'brows', 'nose', 'mouth', 'earsSide', 'hair'] },
    { id: 'arm_l', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'spine', mixin: MIXINS.ARM, side: 'left', pos: [-0.19, 0.38, 0], thickness: 0.09, segments: [[-0.05, -0.30, 0], [-0.03, -0.26, 0.09]], extremity: { size: [0.08, 0.18, 0.035], center: [0, -0.09, 0.02] } },
    { id: 'arm_r', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'spine', mixin: MIXINS.ARM, side: 'right', pos: [0.19, 0.38, 0], thickness: 0.09, segments: [[0.05, -0.30, 0], [0.03, -0.26, 0.09]], extremity: { size: [0.08, 0.18, 0.035], center: [0, -0.09, 0.02] } },
    { id: 'leg_l', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'hips', mixin: MIXINS.LEG, side: 'left', pos: [-0.09, 0, 0], thickness: 0.16, segments: [[0, -0.44, 0], [0, -0.44, 0]], extremity: { size: [0.11, 0.07, 0.24], center: [0, -0.035, 0.05], tone: 'dark' } },
    { id: 'leg_r', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'hips', mixin: MIXINS.LEG, side: 'right', pos: [0.09, 0, 0], thickness: 0.16, segments: [[0, -0.44, 0], [0, -0.44, 0]], extremity: { size: [0.11, 0.07, 0.24], center: [0, -0.035, 0.05], tone: 'dark' } }
];

/**
 * Predefined Body Plans
 */
export const BODY_PLANS = {
    HUMANOID: {
        name: 'Humanoid',
        components: HUMANOID_PARTS,
        clothingCoverage: {
            spine: 'top', arm_l: 'top', arm_r: 'top',
            hips: 'bottom', leg_l: 'bottom', leg_r: 'bottom'
        }
    },
    QUADRUPED: {
        name: 'Quadruped',
        components: [
            // One continuous trunk. Legs and neck attach to its front and rear faces.
            { id: 'body', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.60, 0], box: { size: [0.28, 0.22, 0.84], center: [0, 0, 0] } },
            { id: 'neck', type: COMPONENT_TYPES.TORSO, parent: 'body', pos: [0, 0.08, 0.40], box: { size: [0.14, 0.20, 0.16], center: [0, 0.07, 0.06] } },
            { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'neck', pos: [0, 0.16, 0.06], box: { size: [0.17, 0.18, 0.22], center: [0, 0.04, 0.09] }, features: ['eyes', 'earsUpright', 'snout'] },
            { id: 'leg_fl', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'body', mixin: MIXINS.LEG, side: 'left', pos: [-0.10, -0.09, 0.28], thickness: 0.08, segments: [[0, -0.24, 0], [0, -0.22, 0]], extremity: { size: [0.09, 0.05, 0.12], center: [0, -0.025, 0.02], tone: 'dark' } },
            { id: 'leg_fr', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'body', mixin: MIXINS.LEG, side: 'right', pos: [0.10, -0.09, 0.28], thickness: 0.08, segments: [[0, -0.24, 0], [0, -0.22, 0]], extremity: { size: [0.09, 0.05, 0.12], center: [0, -0.025, 0.02], tone: 'dark' } },
            { id: 'leg_rl', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'body', mixin: MIXINS.LEG, side: 'left', pos: [-0.10, -0.09, -0.28], thickness: 0.08, segments: [[0, -0.24, 0], [0, -0.22, 0]], extremity: { size: [0.09, 0.05, 0.12], center: [0, -0.025, 0.02], tone: 'dark' } },
            { id: 'leg_rr', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'body', mixin: MIXINS.LEG, side: 'right', pos: [0.10, -0.09, -0.28], thickness: 0.08, segments: [[0, -0.24, 0], [0, -0.22, 0]], extremity: { size: [0.09, 0.05, 0.12], center: [0, -0.025, 0.02], tone: 'dark' } },
            { id: 'tail', type: COMPONENT_TYPES.TAIL, parent: 'body', pos: [0, 0.05, -0.42], thickness: 0.06, segments: [[0, 0.05, -0.13], [0, 0.05, -0.13], [0, 0.04, -0.12], [0, 0.03, -0.10]] }
        ]
    },
    SPIDER: {
        name: 'Spider',
        components: [
            { id: 'cephalothorax', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.28, 0.08], box: { size: [0.26, 0.15, 0.28], center: [0, 0, 0] } },
            { id: 'abdomen', type: COMPONENT_TYPES.TORSO, parent: 'cephalothorax', pos: [0, 0.06, -0.32], box: { size: [0.34, 0.26, 0.42], center: [0, 0.04, 0] } },
            ...[0.10, 0.02, -0.06, -0.14].flatMap((z, i) => [-1, 1].map(side => ({
                id: `leg_${i + 1}${side < 0 ? 'l' : 'r'}`,
                type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'cephalothorax', mixin: MIXINS.SPIDER_LEG,
                pos: [side * 0.11, 0, z], thickness: 0.045,
                segments: [[side * 0.20, 0.16, z * 0.5], [side * 0.22, -0.14, z * 0.5], [side * 0.14, -0.30, z * 0.35]]
            })))
        ]
    },
    CENTIPEDE: {
        name: 'Centipede',
        components: [
            { id: 'head_segment', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.2, 1.0], box: { size: [0.30, 0.14, 0.26], center: [0, 0, 0] } },
            { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'head_segment', pos: [0, 0.04, 0.16], box: { size: [0.22, 0.14, 0.18], center: [0, 0, 0.04] }, features: ['eyes', 'snout'] },
            // Segments will be added programmatically or expanded in a specialized generator
            ...Array.from({ length: 10 }).map((_, i) => ({
                id: `segment_${i}`,
                type: COMPONENT_TYPES.TORSO,
                parent: i === 0 ? 'head_segment' : `segment_${i - 1}`,
                pos: [0, 0, -0.26],
                box: { size: [0.28, 0.13, 0.24], center: [0, 0, 0] }
            })),
            ...Array.from({ length: 10 }).flatMap((_, i) => [
                { id: `leg_${i}l`, type: COMPONENT_TYPES.LIMB_CHAIN, parent: `segment_${i}`, mixin: MIXINS.LEG, pos: [-0.14, -0.02, 0], thickness: 0.04, segments: [[-0.14, -0.04, 0], [-0.08, -0.14, 0]] },
                { id: `leg_${i}r`, type: COMPONENT_TYPES.LIMB_CHAIN, parent: `segment_${i}`, mixin: MIXINS.LEG, pos: [0.14, -0.02, 0], thickness: 0.04, segments: [[0.14, -0.04, 0], [0.08, -0.14, 0]] }
            ])
        ]
    },
    RADIAL: {
        name: 'Radial',
        components: [
            { id: 'center', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.1, 0], box: { size: [0.42, 0.16, 0.42], center: [0, 0, 0] } },
            ...Array.from({ length: 5 }).map((_, i) => {
                const angle = (i / 5) * Math.PI * 2;
                return {
                    id: `arm_${i}`,
                    type: COMPONENT_TYPES.LIMB_CHAIN,
                    parent: 'center',
                    mixin: MIXINS.TENTACLE,
                    pos: [Math.cos(angle) * 0.2, 0, Math.sin(angle) * 0.2],
                    rot: [0, -angle, 0],
                    thickness: 0.10,
                    segments: [[0.22, 0, 0], [0.20, -0.02, 0], [0.18, -0.02, 0], [0.15, -0.02, 0]]
                };
            })
        ]
    },
    WINGED: {
        name: 'Winged',
        components: [
            ...HUMANOID_PARTS,
            { id: 'wing_l', type: COMPONENT_TYPES.WING, parent: 'spine', mixin: MIXINS.WING_MEMBRANE, side: 'left', pos: [-0.16, 0.34, -0.08], thickness: 0.04, segments: [[-0.22, 0.10, -0.04], [-0.20, 0.02, -0.06]] },
            { id: 'wing_r', type: COMPONENT_TYPES.WING, parent: 'spine', mixin: MIXINS.WING_MEMBRANE, side: 'right', pos: [0.16, 0.34, -0.08], thickness: 0.04, segments: [[0.22, 0.10, -0.04], [0.20, 0.02, -0.06]] }
        ]
    }
};

/**
 * Validates and normalizes a body plan.
 * @param {object} plan
 * @returns {object}
 */
Object.assign(BODY_PLANS, {
    AVIAN: {
        name: 'Avian',
        components: [
            { id: 'body', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.52, 0], box: { size: [0.22, 0.24, 0.34], center: [0, 0, 0] } },
            { id: 'neck', type: COMPONENT_TYPES.TORSO, parent: 'body', pos: [0, 0.12, 0.14], box: { size: [0.09, 0.14, 0.09], center: [0, 0.06, 0.02] } },
            { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'neck', pos: [0, 0.12, 0.04], box: { size: [0.13, 0.13, 0.16], center: [0, 0.04, 0.04] }, features: ['eyes', 'beak'] },
            { id: 'wing_l', type: COMPONENT_TYPES.WING, parent: 'body', mixin: MIXINS.WING_MEMBRANE, side: 'left', pos: [-0.11, 0.08, 0.04], thickness: 0.035, segments: [[-0.26, 0.12, -0.04], [-0.24, -0.04, -0.08]] },
            { id: 'wing_r', type: COMPONENT_TYPES.WING, parent: 'body', mixin: MIXINS.WING_MEMBRANE, side: 'right', pos: [0.11, 0.08, 0.04], thickness: 0.035, segments: [[0.26, 0.12, -0.04], [0.24, -0.04, -0.08]] },
            { id: 'leg_l', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'body', mixin: MIXINS.LEG, side: 'left', pos: [-0.07, -0.10, -0.02], thickness: 0.055, segments: [[0, -0.20, -0.04], [0, -0.22, 0.04]], extremity: { size: [0.09, 0.04, 0.14], center: [0, -0.02, 0.03], tone: 'dark' } },
            { id: 'leg_r', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'body', mixin: MIXINS.LEG, side: 'right', pos: [0.07, -0.10, -0.02], thickness: 0.055, segments: [[0, -0.20, -0.04], [0, -0.22, 0.04]], extremity: { size: [0.09, 0.04, 0.14], center: [0, -0.02, 0.03], tone: 'dark' } },
            { id: 'tail', type: COMPONENT_TYPES.TAIL, parent: 'body', pos: [0, 0.02, -0.17], thickness: 0.07, segments: [[0, 0.04, -0.18], [0, 0.03, -0.16]] }
        ]
    },
    SERPENTINE: {
        name: 'Serpentine',
        components: [
            { id: 'body_0', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.22, 0.35], box: { size: [0.18, 0.16, 0.26], center: [0, 0, 0] } },
            { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'body_0', pos: [0, 0.08, 0.15], box: { size: [0.16, 0.12, 0.20], center: [0, 0.02, 0.06] }, features: ['eyes', 'snout'] },
            ...Array.from({ length: 4 }).map((_, i) => ({
                id: `body_${i + 1}`,
                type: COMPONENT_TYPES.TORSO,
                parent: `body_${i}`,
                pos: [i % 2 === 0 ? 0.05 : -0.05, -0.02, -0.22],
                box: { size: [0.17 - i * 0.015, 0.15 - i * 0.012, 0.24], center: [0, 0, 0] }
            })),
            { id: 'tail', type: COMPONENT_TYPES.TAIL, parent: 'body_4', pos: [0, -0.02, -0.12], thickness: 0.10, segments: [[0.04, -0.02, -0.20], [-0.04, -0.02, -0.20], [0, 0, -0.18]] }
        ]
    },
    INSECTOID: {
        name: 'Insectoid',
        components: [
            { id: 'thorax', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.32, 0.06], box: { size: [0.22, 0.18, 0.28], center: [0, 0, 0] } },
            { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'thorax', pos: [0, 0.04, 0.18], box: { size: [0.18, 0.16, 0.16], center: [0, 0.02, 0.04] }, features: ['eyes'] },
            { id: 'abdomen', type: COMPONENT_TYPES.TORSO, parent: 'thorax', pos: [0, -0.02, -0.28], box: { size: [0.26, 0.22, 0.38], center: [0, 0, -0.06] } },
            ...[0.10, 0, -0.10].flatMap((z, i) => [-1, 1].map(side => ({
                id: `leg_${i + 1}${side < 0 ? 'l' : 'r'}`,
                type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'thorax', mixin: MIXINS.SPIDER_LEG,
                pos: [side * 0.10, -0.02, z], thickness: 0.04,
                segments: [[side * 0.16, 0.10, z * 0.4], [side * 0.16, -0.14, z * 0.4], [side * 0.08, -0.28, z * 0.2]]
            })))
        ]
    },
    AQUATIC: {
        name: 'Aquatic',
        components: [
            { id: 'body', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.40, 0.05], box: { size: [0.22, 0.26, 0.64], center: [0, 0, 0] } },
            { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'body', pos: [0, 0.02, 0.34], box: { size: [0.18, 0.20, 0.22], center: [0, 0, 0.06] }, features: ['eyes', 'snout'] },
            { id: 'dorsal_fin', type: COMPONENT_TYPES.WING, parent: 'body', mixin: MIXINS.FIN, pos: [0, 0.13, -0.04], thickness: 0.03, segments: [[0, 0.14, -0.06], [0, 0.10, -0.08]] },
            { id: 'fin_l', type: COMPONENT_TYPES.WING, parent: 'body', mixin: MIXINS.FIN, side: 'left', pos: [-0.11, -0.04, 0.14], thickness: 0.03, segments: [[-0.16, -0.04, -0.06], [-0.12, -0.02, -0.06]] },
            { id: 'fin_r', type: COMPONENT_TYPES.WING, parent: 'body', mixin: MIXINS.FIN, side: 'right', pos: [0.11, -0.04, 0.14], thickness: 0.03, segments: [[0.16, -0.04, -0.06], [0.12, -0.02, -0.06]] },
            { id: 'tail', type: COMPONENT_TYPES.TAIL, parent: 'body', pos: [0, 0, -0.32], thickness: 0.10, segments: [[0, 0, -0.20], [0, 0.04, -0.18]] }
        ]
    },
    AMORPHOUS: {
        name: 'Amorphous',
        components: [
            { id: 'core', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.28, 0], box: { size: [0.38, 0.26, 0.38], center: [0, 0, 0] } },
            { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'core', pos: [0, 0.14, 0.08], box: { size: [0.22, 0.18, 0.22], center: [0, 0.06, 0.02] }, features: ['eyes'] },
            { id: 'lobe_l', type: COMPONENT_TYPES.TORSO, parent: 'core', pos: [-0.16, -0.02, -0.04], box: { size: [0.22, 0.20, 0.24], center: [0, 0, 0] } },
            { id: 'lobe_r', type: COMPONENT_TYPES.TORSO, parent: 'core', pos: [0.16, -0.02, -0.04], box: { size: [0.22, 0.20, 0.24], center: [0, 0, 0] } },
            ...Array.from({ length: 4 }).map((_, i) => {
                const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
                return {
                    id: `tentacle_${i}`,
                    type: COMPONENT_TYPES.LIMB_CHAIN,
                    parent: 'core',
                    mixin: MIXINS.TENTACLE,
                    pos: [Math.cos(angle) * 0.18, -0.06, Math.sin(angle) * 0.18],
                    rot: [0, -angle, 0],
                    thickness: 0.08,
                    segments: [[0.18, -0.04, 0], [0.16, -0.06, 0], [0.14, -0.04, 0]]
                };
            })
        ]
    },
    CRYSTALLINE: {
        name: 'Crystalline',
        components: [
            { id: 'core', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.45, 0], box: { size: [0.24, 0.50, 0.24], center: [0, 0, 0] } },
            { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'core', pos: [0, 0.28, 0], box: { size: [0.18, 0.24, 0.18], center: [0, 0.10, 0] }, features: ['eyes'] },
            ...Array.from({ length: 4 }).map((_, i) => {
                const angle = (i / 4) * Math.PI * 2;
                return {
                    id: `shard_${i}`,
                    type: COMPONENT_TYPES.LIMB_CHAIN,
                    parent: 'core',
                    mixin: MIXINS.TENTACLE,
                    pos: [Math.cos(angle) * 0.14, 0.06, Math.sin(angle) * 0.14],
                    rot: [0, -angle, 0],
                    thickness: 0.07,
                    segments: [[0.18, 0.12, 0], [0.14, 0.14, 0]]
                };
            })
        ]
    },
    NETWORKED: {
        name: 'Networked',
        components: [
            { id: 'core', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.55, 0], box: { size: [0.26, 0.26, 0.26], center: [0, 0, 0] } },
            { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'core', pos: [0, 0.18, 0], box: { size: [0.18, 0.18, 0.18], center: [0, 0.08, 0] }, features: ['eyes'] },
            ...Array.from({ length: 4 }).map((_, i) => {
                const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
                return {
                    id: `node_${i}`,
                    type: COMPONENT_TYPES.LIMB_CHAIN,
                    parent: 'core',
                    mixin: MIXINS.ARM,
                    pos: [Math.cos(angle) * 0.18, 0.04, Math.sin(angle) * 0.18],
                    rot: [0, -angle, 0],
                    thickness: 0.035,
                    segments: [[0.18, 0.06, 0], [0.14, -0.04, 0]],
                    extremity: { size: [0.10, 0.10, 0.10], center: [0, 0, 0] }
                };
            })
        ]
    },
    SWARM: {
        name: 'Swarm',
        components: [
            { id: 'hub', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.48, 0], box: { size: [0.24, 0.22, 0.24], center: [0, 0, 0] } },
            { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'hub', pos: [0, 0.16, 0.04], box: { size: [0.16, 0.14, 0.16], center: [0, 0.05, 0] }, features: ['eyes'] },
            ...Array.from({ length: 6 }).map((_, i) => {
                const angle = (i / 6) * Math.PI * 2;
                const yOff = (i % 2 === 0 ? 1 : -1) * 0.10;
                return {
                    id: `drone_${i}`,
                    type: COMPONENT_TYPES.LIMB_CHAIN,
                    parent: 'hub',
                    mixin: MIXINS.WING,
                    pos: [Math.cos(angle) * 0.22, yOff, Math.sin(angle) * 0.22],
                    rot: [0, -angle, 0],
                    thickness: 0.025,
                    segments: [[0.14, 0.04, 0]],
                    extremity: { size: [0.09, 0.07, 0.11], center: [0, 0, 0] }
                };
            })
        ]
    },
    SESSILE: {
        name: 'Sessile',
        components: [
            { id: 'stalk', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.25, 0], box: { size: [0.24, 0.44, 0.24], center: [0, 0, 0] } },
            { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'stalk', pos: [0, 0.24, 0], box: { size: [0.22, 0.18, 0.22], center: [0, 0.08, 0] }, features: ['eyes'] },
            ...Array.from({ length: 4 }).map((_, i) => {
                const angle = (i / 4) * Math.PI * 2;
                return {
                    id: `frond_${i}`,
                    type: COMPONENT_TYPES.LIMB_CHAIN,
                    parent: 'stalk',
                    mixin: MIXINS.TENTACLE,
                    pos: [Math.cos(angle) * 0.14, 0.12, Math.sin(angle) * 0.14],
                    rot: [0, -angle, 0],
                    thickness: 0.06,
                    segments: [[0.16, 0.14, 0], [0.14, 0.12, 0]]
                };
            })
        ]
    },
    OCTOPOD: {
        name: 'Octopod',
        components: [
            { id: 'core', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.30, 0], box: { size: [0.30, 0.22, 0.36], center: [0, 0.02, 0] } },
            { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'core', pos: [0, 0.12, 0.12], box: { size: [0.20, 0.16, 0.20], center: [0, 0.04, 0.04] }, features: ['eyes', 'beak'] },
            ...Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
                return {
                    id: `limb_${i}`,
                    type: COMPONENT_TYPES.LIMB_CHAIN,
                    parent: 'core',
                    mixin: MIXINS.TENTACLE,
                    pos: [Math.cos(angle) * 0.09, -0.09, Math.sin(angle) * 0.11],
                    rot: [0, -angle, 0],
                    thickness: 0.055,
                    segments: [[0.15, 0.38, 0], [0.14, -0.34, 0], [0.08, -0.22, 0], [0.10, 0.14, 0]]
                };
            })
        ]
    }
});

/**
 * Resolves a species body plan string or species lore object to a BODY_PLANS entry.
 * Covers all speciesfoundations.json, naming.json, and SpeciesGenerator body plans.
 * @param {string|object} input - A body plan name/description or species lore object.
 * @returns {object} A BODY_PLANS entry (defaults to BODY_PLANS.HUMANOID).
 */
export function resolveBodyPlan(input) {
    const raw = typeof input === 'string'
        ? input
        : (input?.bodyPlan || input?.planetAffinity || '');
    const bp = String(raw).toLowerCase();
    if (!bp) return BODY_PLANS.HUMANOID;

    if (bp.includes('quadruped')) return BODY_PLANS.QUADRUPED;
    if (bp.includes('avian') || bp.includes('bird') || bp.includes('therios')) return BODY_PLANS.AVIAN;
    if (bp.includes('winged') || bp.includes('glider')) return BODY_PLANS.WINGED;
    if (bp.includes('serpent') || bp.includes('draconic') || bp.includes('reptil') || bp.includes('snake')) return BODY_PLANS.SERPENTINE;
    if (bp.includes('octopod')) return BODY_PLANS.OCTOPOD;
    if (bp.includes('spider') || bp.includes('arachnid') || bp.includes('climber')) return BODY_PLANS.SPIDER;
    if (bp.includes('centipede') || bp.includes('myriapod')) return BODY_PLANS.CENTIPEDE;
    if (bp.includes('insect') || bp.includes('hexapod') || bp.includes('digger')) return BODY_PLANS.INSECTOID;
    if (bp.includes('aquatic') || bp.includes('fish') || bp.includes('mer-person')) return BODY_PLANS.AQUATIC;
    if (bp.includes('crystal') || bp.includes('lattice')) return BODY_PLANS.CRYSTALLINE;
    if (bp.includes('network') || bp.includes('synthetic')) return BODY_PLANS.NETWORKED;
    if (bp.includes('swarm')) return BODY_PLANS.SWARM;
    if (bp.includes('sessile') || bp.includes('colony')) return BODY_PLANS.SESSILE;
    if (bp.includes('amorphous') || bp.includes('floater')) return BODY_PLANS.AMORPHOUS;
    if (bp.includes('radial') || bp.includes('tentacle')) return BODY_PLANS.RADIAL;

    if (typeof input === 'object' && input?.planetAffinity) {
        return resolveBodyPlan(input.planetAffinity);
    }
    return BODY_PLANS.HUMANOID;
}

export function normalizeBodyPlan(plan) {
    // Ensure all components have IDs and types
    // Resolve parent references
    return plan;
}
