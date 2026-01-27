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
 * Predefined Body Plans
 */
export const BODY_PLANS = {
    HUMANOID: {
        name: 'Humanoid',
        components: [
            { id: 'hips', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 1, 0] },
            { id: 'spine', type: COMPONENT_TYPES.TORSO, parent: 'hips', pos: [0, 0.3, 0] },
            { id: 'neck', type: COMPONENT_TYPES.TORSO, parent: 'spine', pos: [0, 0.4, 0] },
            { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'neck', pos: [0, 0.1, 0] },
            { id: 'arm_l', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'spine', mixin: MIXINS.ARM, side: 'left', pos: [-0.2, 0.3, 0], joints: 3 },
            { id: 'arm_r', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'spine', mixin: MIXINS.ARM, side: 'right', pos: [0.2, 0.3, 0], joints: 3 },
            { id: 'leg_l', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'hips', mixin: MIXINS.LEG, side: 'left', pos: [-0.15, -0.1, 0], joints: 3 },
            { id: 'leg_r', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'hips', mixin: MIXINS.LEG, side: 'right', pos: [0.15, -0.1, 0], joints: 3 }
        ]
    },
    QUADRUPED: {
        name: 'Quadruped',
        components: [
            { id: 'body_rear', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 0.5, -0.5] },
            { id: 'body_front', type: COMPONENT_TYPES.TORSO, parent: 'body_rear', pos: [0, 0, 1.0] },
            { id: 'neck', type: COMPONENT_TYPES.TORSO, parent: 'body_front', pos: [0, 0.2, 0.2] },
            { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'neck', pos: [0, 0.1, 0.1] },
            { id: 'leg_fl', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'body_front', mixin: MIXINS.LEG, side: 'left', pos: [-0.2, -0.1, 0], joints: 3 },
            { id: 'leg_fr', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'body_front', mixin: MIXINS.LEG, side: 'right', pos: [0.2, -0.1, 0], joints: 3 },
            { id: 'leg_rl', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'body_rear', mixin: MIXINS.LEG, side: 'left', pos: [-0.2, -0.1, 0], joints: 3 },
            { id: 'leg_rr', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'body_rear', mixin: MIXINS.LEG, side: 'right', pos: [0.2, -0.1, 0], joints: 3 },
            { id: 'tail', type: COMPONENT_TYPES.TAIL, parent: 'body_rear', pos: [0, 0.1, -0.1], joints: 5 }
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
            { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'head_segment', pos: [0, 0.1, 0.2] },
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
            { id: 'hips', type: COMPONENT_TYPES.TORSO, root: true, pos: [0, 1, 0] },
            { id: 'spine', type: COMPONENT_TYPES.TORSO, parent: 'hips', pos: [0, 0.3, 0] },
            { id: 'head', type: COMPONENT_TYPES.HEAD, parent: 'spine', pos: [0, 0.5, 0] },
            { id: 'leg_l', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'hips', mixin: MIXINS.LEG, side: 'left', pos: [-0.15, -0.1, 0], joints: 3 },
            { id: 'leg_r', type: COMPONENT_TYPES.LIMB_CHAIN, parent: 'hips', mixin: MIXINS.LEG, side: 'right', pos: [0.15, -0.1, 0], joints: 3 },
            { id: 'wing_l', type: COMPONENT_TYPES.WING, parent: 'spine', mixin: MIXINS.WING_MEMBRANE, side: 'left', pos: [-0.1, 0.4, -0.1], joints: 3 },
            { id: 'wing_r', type: COMPONENT_TYPES.WING, parent: 'spine', mixin: MIXINS.WING_MEMBRANE, side: 'right', pos: [0.1, 0.4, -0.1], joints: 3 }
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
