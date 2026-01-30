/**
 * @module Avatar/BoneMapper
 * @description Maps procedural bone names to VRM and other standards.
 */

export const VRM_BONE_MAP = {
    'hips': 'hips',
    'spine': 'spine',
    'chest': 'chest',
    'neck': 'neck',
    'head': 'head',
    'leftUpperArm': 'arm_l',
    'rightUpperArm': 'arm_r',
    'leftLowerArm': 'arm_l_joint_1',
    'rightLowerArm': 'arm_r_joint_1',
    'leftHand': 'arm_l_joint_2',
    'rightHand': 'arm_r_joint_2',
    'leftUpperLeg': 'leg_l',
    'rightUpperLeg': 'leg_r',
    'leftLowerLeg': 'leg_l_joint_1',
    'rightLowerLeg': 'leg_r_joint_1',
    'leftFoot': 'leg_l_joint_2',
    'rightFoot': 'leg_r_joint_2'
};

/**
 * Gets the standard VRM bone name for a procedural bone ID.
 * @param {string} boneId
 * @returns {string|null}
 */
export function getVRMBoneName(boneId) {
    for (const [vrmName, procId] of Object.entries(VRM_BONE_MAP)) {
        if (procId === boneId) return vrmName;
    }
    return null;
}

/**
 * Maps a procedural skeleton to VRM required bones.
 * @param {THREE.Skeleton} skeleton
 * @returns {Object} Mapping of VRM human bone names to Three.js Bones.
 */
export function mapToVRMHumanoid(skeleton) {
    const humanBones = {};
    skeleton.bones.forEach(bone => {
        const vrmName = getVRMBoneName(bone.name);
        if (vrmName) {
            humanBones[vrmName] = { node: bone };
        }
    });
    return humanBones;
}
