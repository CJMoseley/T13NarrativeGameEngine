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
    { id: 'hips', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.95, 0], box: { size: [0.30, 0.16, 0.20], center: [0, -0.01, 0] } },
    { id: 'spine', type: COMPONENT_TYPES.TORSO, parent: 'hips', pos: [0, 0.08, 0], box: { size: [0.32, 0.42, 0.19], center: [0, 0.21, 0] } },
    { id: 'neck', type: COMPONENT_TYPES.TORSO, parent: 'spine', pos: [0, 0.42, 0], box: { size: [0.10, 0.09, 0.10], center: [0, 0.045, 0] } },
    { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'neck', pos: [0, 0.09, 0], box: { size: [0.20, 0.26, 0.21], center: [0, 0.13, 0] }, features: ['eyes', 'brows', 'nose', 'mouth', 'earsSide', 'hair'] },
    { id: 'arm_l', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'spine', mixin: MIXINS.ARM, side: 'left', pos: [-0.19, 0.38, 0], thickness: 0.09, segments: [[-0.05, -0.30, 0], [-0.03, -0.26, 0.09]], extremity: { size: [0.08, 0.12, 0.06], center: [0, -0.06, 0.02] } },
    { id: 'arm_r', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'spine', mixin: MIXINS.ARM, side: 'right', pos: [0.19, 0.38, 0], thickness: 0.09, segments: [[0.05, -0.30, 0], [0.03, -0.26, 0.09]], extremity: { size: [0.08, 0.12, 0.06], center: [0, -0.06, 0.02] } },
    { id: 'leg_l', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'hips', mixin: MIXINS.LEG, side: 'left', pos: [-0.09, 0, 0], thickness: 0.13, segments: [[0, -0.44, 0], [0, -0.44, 0]], extremity: { size: [0.11, 0.07, 0.24], center: [0, -0.035, 0.05], tone: 'dark' } },
    { id: 'leg_r', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'hips', mixin: MIXINS.LEG, side: 'right', pos: [0.09, 0, 0], thickness: 0.13, segments: [[0, -0.44, 0], [0, -0.44, 0]], extremity: { size: [0.11, 0.07, 0.24], center: [0, -0.035, 0.05], tone: 'dark' } }
];

/**
 * Predefined Body Plans
 */
export const BODY_PLANS = {
    HUMANOID: {
        name: 'Humanoid',
        components: HUMANOID_PARTS
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
            { id: 'cephalothorax', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.3, 0] },
            { id: 'abdomen', type: COMPONENT_TYPES.TORSO, parent: 'cephalothorax', pos: [0, 0.1, -0.6] },
            { id: 'leg_1l', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'cephalothorax', mixin: MIXINS.SPIDER_LEG, pos: [-0.2, 0, 0.2], joints: 4 },
            { id: 'leg_1r', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'cephalothorax', mixin: MIXINS.SPIDER_LEG, pos: [0.2, 0, 0.2], joints: 4 },
            { id: 'leg_2l', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'cephalothorax', mixin: MIXINS.SPIDER_LEG, pos: [-0.3, 0, 0], joints: 4 },
            { id: 'leg_2r', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'cephalothorax', mixin: MIXINS.SPIDER_LEG, pos: [0.3, 0, 0], joints: 4 },
            { id: 'leg_3l', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'cephalothorax', mixin: MIXINS.SPIDER_LEG, pos: [-0.3, 0, -0.2], joints: 4 },
            { id: 'leg_3r', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'cephalothorax', mixin: MIXINS.SPIDER_LEG, pos: [0.3, 0, -0.2], joints: 4 },
            { id: 'leg_4l', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'cephalothorax', mixin: MIXINS.SPIDER_LEG, pos: [-0.2, 0, -0.4], joints: 4 },
            { id: 'leg_4r', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'cephalothorax', mixin: MIXINS.SPIDER_LEG, pos: [0.2, 0, -0.4], joints: 4 }
        ]
    },
    CENTIPEDE: {
        name: 'Centipede',
        components: [
            { id: 'head_segment', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.2, 1.0] },
            { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'head_segment', pos: [0, 0.1, 0.2], features: ['eyes', 'snout'] },
            // Segments will be added programmatically or expanded in a specialized generator
            ...Array.from({ length: 10 }).map((_, i) => ({
                id: `segment_${i}`,
                type: COMPONENT_TYPES.TORSO,
                parent: i === 0 ? 'head_segment' : `segment_${i - 1}`,
                pos: [0, 0, -0.3]
            })),
            ...Array.from({ length: 10 }).flatMap((_, i) => [
                { id: `leg_${i}l`, type: COMPONENT_TYPES.LIMB_CHAIN, parent: `segment_${i}`, mixin: MIXINS.LEG, pos: [-0.2, 0, 0], joints: 2 },
                { id: `leg_${i}r`, type: COMPONENT_TYPES.LIMB_CHAIN, parent: `segment_${i}`, mixin: MIXINS.LEG, pos: [0.2, 0, 0], joints: 2 }
            ])
        ]
    },
    RADIAL: {
        name: 'Radial',
        components: [
            { id: 'center', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.1, 0] },
            ...Array.from({ length: 5 }).map((_, i) => {
                const angle = (i / 5) * Math.PI * 2;
                return {
                    id: `arm_${i}`,
                    type: COMPONENT_TYPES.LIMB_CHAIN,
                    parent: 'center',
                    mixin: MIXINS.TENTACLE,
                    pos: [Math.cos(angle) * 0.2, 0, Math.sin(angle) * 0.2],
                    rot: [0, -angle, 0],
                    joints: 5
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
export function normalizeBodyPlan(plan) {
    // Ensure all components have IDs and types
    // Resolve parent references
    return plan;
}
