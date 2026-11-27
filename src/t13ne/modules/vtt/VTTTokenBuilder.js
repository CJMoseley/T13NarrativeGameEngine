/**
 * @module Modules/VTT/VTTTokenBuilder
 * @description Builds 3D VTT miniature tokens from AvatarStage + sharedAvatarCache
 * (for Characters, Extras, Creatures, and Descendants) or UHPP props, mounted on an
 * interactive tabletop base with allegiance ring, facing arrow, VOIP speaking ring,
 * nameplate metadata, and compact Wound/Stress pips.
 */

import * as THREE from 'three';
import { AvatarStage } from '../../procgen/uhpp/AvatarStage.js';
import { sharedAvatarCache } from '../../procgen/avatar/AvatarCache.js';
import { BODY_PLANS, resolveBodyPlan } from '../../procgen/avatar/BodyPlanSchema.js';
import { buildUHPPPropMesh } from '../../procgen/uhpp/UHPPPropBuilder.js';

export const ALLEGIANCE_COLOURS = Object.freeze({
    ally: 0x38bdf8,
    enemy: 0xef4444,
    neutral: 0xf59e0b,
    prop: 0x94a3b8
});

function createBaseRing(color, scale = 1) {
    const baseGroup = new THREE.Group();
    baseGroup.name = 'vtt-token-base';

    const discGeo = new THREE.CylinderGeometry(0.46 * scale, 0.50 * scale, 0.06, 16);
    const discMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = 0.03;
    baseGroup.add(disc);

    const ringGeo = new THREE.TorusGeometry(0.47 * scale, 0.035, 6, 20);
    const ringMat = new THREE.MeshLambertMaterial({ color });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.name = 'vtt-allegiance-ring';
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.06;
    baseGroup.add(ring);

    const speakGeo = new THREE.TorusGeometry(0.54 * scale, 0.025, 6, 20);
    const speakMat = new THREE.MeshLambertMaterial({
        color: 0x22d3ee,
        emissive: 0x0891b2,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.0
    });
    const speakRing = new THREE.Mesh(speakGeo, speakMat);
    speakRing.name = 'vtt-speaking-ring';
    speakRing.rotation.x = Math.PI / 2;
    speakRing.position.y = 0.065;
    speakRing.visible = false;
    baseGroup.add(speakRing);

    // Facing wedge pointing +Z
    const arrowGeo = new THREE.ConeGeometry(0.10 * scale, 0.18 * scale, 4);
    const arrowMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.name = 'vtt-facing-arrow';
    arrow.rotation.x = Math.PI / 2;
    arrow.position.set(0, 0.07, 0.52 * scale);
    baseGroup.add(arrow);

    const pipsGroup = new THREE.Group();
    pipsGroup.name = 'vtt-status-pips';
    baseGroup.add(pipsGroup);

    return { baseGroup, speakRing, pipsGroup };
}

export function updateTokenStatusPips(tokenGroup, status = {}) {
    const pipsGroup = tokenGroup?.getObjectByName?.('vtt-status-pips');
    if (!pipsGroup) return;
    while (pipsGroup.children.length) {
        const c = pipsGroup.children.pop();
        c.geometry?.dispose?.();
        c.material?.dispose?.();
    }
    const wounds = Math.min(8, Math.max(0, Math.trunc(status?.wounds ?? 0)));
    const stress = Math.min(8, Math.max(0, Math.trunc(status?.stress ?? 0)));
    const total = wounds + stress;
    if (total === 0) return;

    const pipGeo = new THREE.BoxGeometry(0.07, 0.07, 0.07);
    for (let i = 0; i < total; i++) {
        const isWound = i < wounds;
        const pipMat = new THREE.MeshLambertMaterial({ color: isWound ? 0xef4444 : 0xa855f7 });
        const pip = new THREE.Mesh(pipGeo.clone(), pipMat);
        const angle = (-Math.PI * 0.65) + (i / Math.max(1, total - 1)) * (Math.PI * 1.3);
        pip.position.set(Math.sin(angle) * 0.44, 0.11, -Math.cos(angle) * 0.44);
        pipsGroup.add(pip);
    }
    pipGeo.dispose();
}

export function setTokenSpeakingState(tokenGroup, active = false, level = 1) {
    const speakRing = tokenGroup?.getObjectByName?.('vtt-speaking-ring');
    if (!speakRing) return;
    speakRing.visible = Boolean(active);
    if (speakRing.material) {
        speakRing.material.opacity = active ? Math.max(0.4, Math.min(1, level)) : 0;
    }
}

/**
 * Builds a complete 3D VTT token group with AvatarStage / UHPP model + tabletop base.
 */
export async function buildVttToken(tokenSpec = {}, options = {}) {
    const tokenId = String(tokenSpec.id ?? 'token');
    const tokenType = tokenSpec.tokenType ?? 'character';
    const allegiance = tokenSpec.allegiance ?? (tokenType === 'prop' || tokenType === 'terrain' ? 'prop' : 'ally');
    const ringColor = tokenSpec.color ?? ALLEGIANCE_COLOURS[allegiance] ?? 0x38bdf8;
    const tokenScale = Number.isFinite(tokenSpec.scale) && tokenSpec.scale > 0 ? tokenSpec.scale : 1;

    const group = new THREE.Group();
    group.name = `vtt-token-${tokenId}`;
    group.userData.tokenId = tokenId;
    group.userData.nameplate = {
        text: String(tokenSpec.name ?? tokenId),
        allegiance,
        tokenType
    };

    const { baseGroup } = createBaseRing(ringColor, Math.min(2, tokenScale));
    group.add(baseGroup);

    let modelObject = null;
    if ((tokenType === 'prop' || tokenType === 'terrain') && tokenSpec.propSpec) {
        modelObject = buildUHPPPropMesh({
            ...tokenSpec.propSpec,
            incarna: tokenSpec.incarna ?? tokenSpec.propSpec.incarna ?? 'Burden'
        });
        modelObject.position.y = 0.06;
    } else {
        const stage = options.stage ?? new AvatarStage(
            'HUMANOID',
            { cache: options.cache ?? sharedAvatarCache }
        );
        const bodyPlan = tokenSpec.bodyPlan
            ? resolveBodyPlan(tokenSpec.bodyPlan)
            : (options.species?.bodyPlan ? resolveBodyPlan(options.species.bodyPlan) : BODY_PLANS.HUMANOID);

        const isDescendant = tokenType === 'prop' || tokenType === 'creature' || Boolean(options.descendant);
        const context = await stage.execute({
            bodyPlan,
            ...(options.character ? { character: options.character } : {}),
            ...(options.descendant ? { descendant: options.descendant } : isDescendant && !options.character ? {
                descendant: {
                    id: tokenSpec.descendantId ?? tokenId,
                    name: tokenSpec.name ?? tokenId,
                    incarna: tokenSpec.incarna ?? 'Nature',
                    bodyPlan: bodyPlan.name
                }
            } : {}),
            ...(!options.character && !options.descendant && !isDescendant ? {
                character: {
                    id: tokenSpec.characterId ?? tokenId,
                    name: tokenSpec.name ?? tokenId,
                    incarna: tokenSpec.incarna ?? 'Nature'
                }
            } : {}),
            ...(options.species ? { species: options.species } : {}),
            ...(options.skinDocument ?? tokenSpec.skinDocument ? { skinDocument: options.skinDocument ?? tokenSpec.skinDocument } : {}),
            ...(options.skinStore ? { skinStore: options.skinStore } : {}),
            avatarSeed: tokenSpec.avatarSeed ?? tokenSpec.name ?? tokenId
        });
        modelObject = context.avatar;
        if (modelObject) {
            modelObject.name = 'vtt-token-avatar';
            // Miniature scale (~1.25 world units for ~1.7m character)
            const miniScale = 0.72 * tokenScale;
            modelObject.scale.setScalar(miniScale);
            modelObject.position.y = 0.06;
        }
    }

    if (modelObject) {
        group.add(modelObject);
    }

    if (tokenSpec.position) {
        group.position.set(tokenSpec.position.x || 0, tokenSpec.position.y || 0, tokenSpec.position.z || 0);
    }
    if (Number.isFinite(tokenSpec.facing)) {
        group.rotation.y = tokenSpec.facing;
    }

    updateTokenStatusPips(group, tokenSpec.status);
    setTokenSpeakingState(group, false);
    return group;
}

export function disposeVttToken(tokenGroup) {
    if (!tokenGroup) return;
    tokenGroup.traverse?.(obj => {
        obj.geometry?.dispose?.();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
            m?.map?.dispose?.();
            m?.dispose?.();
        }
    });
}
