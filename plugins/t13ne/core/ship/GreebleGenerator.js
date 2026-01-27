import * as THREE from 'three';

export class GreebleGenerator {
    constructor(modelLoader) {
        this.modelLoader = modelLoader;
        this.raycaster = new THREE.Raycaster();

        // Materials
        this.rivetMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7, metalness: 0.6 });
        this.ventMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.4 });
        this.antennaMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.4, metalness: 0.8 });
        this.glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            metalness: 0.9,
            roughness: 0.1,
            transmission: 0.2,
            emissive: 0x002244,
            emissiveIntensity: 0.5,
            transparent: true
        });
        this.lightRedMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.lightGreenMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.lightWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.lightAmberMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        this.lightBlueMat = new THREE.MeshBasicMaterial({ color: 0x00aaff });

        // Geometries
        this.rivetGeo = new THREE.SphereGeometry(0.1, 4, 4);
        this.ventGeo = new THREE.BoxGeometry(0.8, 0.1, 0.4);
    }

    createAntennaArray() {
        const group = new THREE.Group();
        const bladeGroup = new THREE.Group();
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 0.4), this.antennaMat);
        blade.position.y = 0.6;
        bladeGroup.add(blade);

        const glow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.05), this.lightGreenMat);
        glow.position.set(0, 0.6, 0.2);
        bladeGroup.add(glow);

        bladeGroup.rotation.x = -Math.PI / 4;
        group.add(bladeGroup);

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.2, 6), this.ventMat);
        base.position.y = 0.1;
        group.add(base);

        return group;
    }

    placeOnSurface(hullMesh, greebleGroup, origin, direction, objectToPlace, alignToNormal = true, offset = 0, applySymmetry = true, symmetryType, radialAxis, radialCount = 3, constrainNormalAxis = null, orientToCenter = false) {
        this.raycaster.set(origin, direction);

        let intersects = [];
        if (hullMesh.isGroup) {
            intersects = this.raycaster.intersectObjects(hullMesh.children, true);
        } else {
            intersects = this.raycaster.intersectObject(hullMesh);
        }

        if (intersects.length > 0) {
            // Prevent placing greebles too close to the symmetry axis to avoid overlapping duplicates
            if (applySymmetry && symmetryType === 'REFLECTIVE' && Math.abs(intersects[0].point.x) < 0.1) {
                applySymmetry = false;
            }
            if (applySymmetry && symmetryType === 'RADIAL' && new THREE.Vector2(intersects[0].point.x, intersects[0].point.z).length() < 0.1) {
                applySymmetry = false;
            }

            const hit = intersects[0];
            const pos = hit.point;
            const normal = hit.face.normal.clone();
            normal.transformDirection(hit.object.matrixWorld).normalize();

            if (constrainNormalAxis === 'x') {
                normal.x = 0;
                normal.normalize();
            }

            const instance = objectToPlace.clone();
            instance.position.copy(pos).add(normal.clone().multiplyScalar(offset));
            if (alignToNormal) {
                instance.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

                if (orientToCenter) {
                    let center;
                    if (radialAxis === 'z') center = new THREE.Vector3(0, 0, pos.z);
                    else center = new THREE.Vector3(0, pos.y, 0);

                    const toCenter = new THREE.Vector3().subVectors(center, pos).normalize();
                    const projectedZ = toCenter.clone().sub(normal.clone().multiplyScalar(toCenter.dot(normal))).normalize();

                    if (projectedZ.lengthSq() > 0.001) {
                        const yAxis = normal;
                        const zAxis = projectedZ;
                        const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();
                        instance.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
                    }
                }
            }
            greebleGroup.add(instance);

            if (applySymmetry) {
                if (symmetryType === 'REFLECTIVE' && Math.abs(pos.x) > 0.1) {
                     const symOrigin = new THREE.Vector3(-origin.x, origin.y, origin.z);
                     const symDir = new THREE.Vector3(-direction.x, direction.y, direction.z);
                     this.raycaster.set(symOrigin, symDir);

                     let symIntersects = [];
                     if (hullMesh.isGroup) {
                        symIntersects = this.raycaster.intersectObjects(hullMesh.children, true);
                     } else {
                        symIntersects = this.raycaster.intersectObject(hullMesh);
                     }

                     if (symIntersects.length > 0) {
                         const symHit = symIntersects[0];
                         const symNormal = symHit.face.normal.clone();
                         symNormal.transformDirection(symHit.object.matrixWorld).normalize();

                         const symInstance = objectToPlace.clone();
                         symInstance.position.copy(symHit.point).add(symNormal.clone().multiplyScalar(offset));
                         if (alignToNormal) {
                             symInstance.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), symNormal);

                             if (orientToCenter) {
                                const symPos = symHit.point;
                                let center;
                                if (radialAxis === 'z') center = new THREE.Vector3(0, 0, symPos.z);
                                else center = new THREE.Vector3(0, symPos.y, 0);

                                const toCenter = new THREE.Vector3().subVectors(center, symPos).normalize();
                                const projectedZ = toCenter.clone().sub(symNormal.clone().multiplyScalar(toCenter.dot(symNormal))).normalize();

                                if (projectedZ.lengthSq() > 0.001) {
                                    const yAxis = symNormal;
                                    const zAxis = projectedZ;
                                    const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();
                                    symInstance.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
                                }
                             }
                         }
                         greebleGroup.add(symInstance);
                     }
                } else if (symmetryType === 'RADIAL') {
                    const count = radialCount;
                    for (let i = 1; i < count; i++) {
                        const angle = (Math.PI * 2 / count) * i;
                        const rOrigin = origin.clone();
                        const rDir = direction.clone();

                        if (radialAxis === 'z') {
                            rOrigin.applyAxisAngle(new THREE.Vector3(0,0,1), angle);
                            rDir.applyAxisAngle(new THREE.Vector3(0,0,1), angle);
                        } else {
                            rOrigin.applyAxisAngle(new THREE.Vector3(0,1,0), angle);
                            rDir.applyAxisAngle(new THREE.Vector3(0,1,0), angle);
                        }
                        this.placeOnSurface(hullMesh, greebleGroup, rOrigin, rDir, objectToPlace, alignToNormal, offset, false, symmetryType, radialAxis, radialCount, constrainNormalAxis, orientToCenter);
                    }
                }
            }
        }
    }

    generate(hullMesh, components, styleConfig, symmetryType, radialAxis, radialCount = 3) {
        if (!hullMesh) return new THREE.Group();

        // Handle both single Mesh (Hull) and Group (Skeleton/Proxies)
        let bbox;
        if (hullMesh.geometry) {
            hullMesh.geometry.computeBoundingBox();
            bbox = hullMesh.geometry.boundingBox;
        } else {
            bbox = new THREE.Box3().setFromObject(hullMesh);
        }

        hullMesh.updateMatrixWorld();

        const cog = new THREE.Vector3();
        bbox.getCenter(cog);

        const greebleGroup = new THREE.Group();
        greebleGroup.name = "greebles";

        // Determine global orientation preference for radial ships
        const globalOrientToCenter = (symmetryType === 'RADIAL');

        components.forEach(comp => {
            const usage = (comp.stats && (comp.stats.usage || comp.stats.name)) ? (comp.stats.usage || comp.stats.name).toLowerCase() : (comp.type || '');
            const pos = comp.position;
            const scale = comp.scale;
            const rot = comp.rotation;

            let isCentral = false;
            if (symmetryType === 'REFLECTIVE') {
                isCentral = Math.abs(pos.x) < 0.1;
            } else if (symmetryType === 'RADIAL') {
                if (radialAxis === 'z') isCentral = new THREE.Vector2(pos.x, pos.y).length() < 0.1;
                else isCentral = new THREE.Vector2(pos.x, pos.z).length() < 0.1;
            } else {
                isCentral = true;
            }

            // 1. Rivet Lines
            if (styleConfig.method !== 'ORGANIC' && (usage.includes('fuselage') || usage.includes('chassis') || usage.includes('hull'))) {
                let length = scale.z;
                if (['cylinder', 'prism', 'capsule', 'cone', 'truncatedCone'].includes(comp.type)) {
                    length = scale.y;
                }

                const steps = Math.floor(length * 2);
                const startZ = pos.z - length / 2;
                const offsetDist = Math.max(scale.x, scale.y) + 2; // Ensure we start outside
                const rivetScale = Math.max(0.5, Math.min(1.5, scale.x * 0.5));
                const currentRivetGeo = this.rivetGeo.clone();
                currentRivetGeo.scale(rivetScale, rivetScale, rivetScale);

                for (let i = 1; i < steps; i++) {
                    const z = startZ + (i / steps) * length;
                    this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(0, pos.y + offsetDist, z), new THREE.Vector3(0, -1, 0), new THREE.Mesh(currentRivetGeo, this.rivetMat), true, 0, isCentral, symmetryType, radialAxis, radialCount, null, globalOrientToCenter);
                    this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(pos.x + offsetDist, pos.y, z), new THREE.Vector3(-1, 0, 0), new THREE.Mesh(currentRivetGeo, this.rivetMat), true, 0, isCentral, symmetryType, radialAxis, radialCount, null, globalOrientToCenter);
                }
                currentRivetGeo.dispose();

                if (usage.includes('fuselage')) {
                    const antenna = this.createAntennaArray();
                    antenna.scale.setScalar(rivetScale);
                    this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(0, pos.y + offsetDist, pos.z - scale.z * 0.4), new THREE.Vector3(0, -1, 0), antenna, true, 0, isCentral, symmetryType, radialAxis, radialCount, null, globalOrientToCenter);
                }
            }

            // 2. Vents
            if (usage.includes('engine') || usage.includes('reactor') || usage.includes('generator')) {
                const ventGroup = new THREE.Group();

                // Calculate size based on component dimensions, keeping it smaller to fit surfaces better
                let minDim = Math.min(scale.x, scale.y, scale.z);
                // For cylinders/prisms, scale.y is length, x/z are radius. Use radius as constraint.
                if (['cylinder', 'prism', 'capsule', 'cone', 'truncatedCone'].includes(comp.type)) {
                    minDim = Math.min(scale.x, scale.z);
                }

                const ventWidth = Math.max(0.5, minDim * 0.5);
                const ventHeight = ventWidth * 0.6;
                const ventDepth = 0.1;

                // Create a frame/base
                const frameGeo = new THREE.BoxGeometry(ventWidth, ventHeight, ventDepth);
                const frame = new THREE.Mesh(frameGeo, this.ventMat);
                ventGroup.add(frame);

                // Add slats
                const numSlats = 4;
                const slatGeo = new THREE.BoxGeometry(ventWidth * 0.9, ventHeight / (numSlats * 2.5), ventDepth * 0.5);

                for(let k=0; k<numSlats; k++) {
                    const slat = new THREE.Mesh(slatGeo, this.rivetMat); // Lighter material for contrast
                    const y = (k - (numSlats - 1) / 2) * (ventHeight / numSlats);
                    slat.position.set(0, y, ventDepth * 0.6); // Stick out slightly
                    slat.rotation.x = Math.PI / 6;
                    ventGroup.add(slat);
                }

                // Fix orientation: Rotate so the face (Z) points along the normal (Y of container)
                const container = new THREE.Group();
                container.add(ventGroup);
                ventGroup.rotation.x = Math.PI / 2;

                const offsetDist = Math.max(scale.x, scale.y) + 2;
                this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(pos.x, pos.y + offsetDist, pos.z), new THREE.Vector3(0, -1, 0), container, true, 0, isCentral, symmetryType, radialAxis, radialCount, null, globalOrientToCenter);
                // Removed side placement to avoid fins
            }

            // 3. Cockpit / Bridge
            if (usage.includes('bridge') || usage.includes('cockpit')) {
                let isPrimaryCockpit = true;
                if (symmetryType === 'RADIAL' && radialAxis === 'y') {
                    // Limit cockpits to front 1/3 (120 degrees)
                    // Forward is +Z. atan2(x, z) gives 0 at +Z.
                    const angle = Math.atan2(pos.x, pos.z);
                    if (Math.abs(angle) > (Math.PI / 3)) {
                        isPrimaryCockpit = false;
                    }
                }

                let domeGeo;
                // Deterministic seed for shape variation
                const seed = (pos.x + pos.y + pos.z) * 13.1;
                const shapeType = Math.floor(Math.abs(Math.sin(seed) * 6));

                // FIX: Calculate dimensions based on component type to prevent oversized cockpits
                let refLength, refWidth, refDepth;

                if (['cylinder', 'cone', 'capsule', 'prism', 'truncatedCone'].includes(comp.type)) {
                    refLength = scale.y; // Long axis
                    refWidth = scale.x;  // Radius/Width
                    refDepth = scale.x;  // Radius/Depth
                } else {
                    refLength = scale.z; // Length
                    refWidth = scale.x;  // Width
                    refDepth = scale.y;  // Height
                }

                let canopyLength = refLength * 0.4;
                let canopyWidth = refWidth * 0.5;
                let canopyHeight = Math.min(refDepth * 0.4, 1.2); // Cap height to avoid sticking out too much

                if (radialAxis === 'y') {
                    const dim = Math.min(canopyWidth, canopyLength);
                    canopyWidth = dim;
                    canopyLength = dim;
                }

                if (!isPrimaryCockpit) {
                    // Observation Windows / Skylights (Flat)
                    domeGeo = new THREE.BoxGeometry(1, 1, 1);
                    canopyHeight = 0.15;
                    canopyWidth *= 0.8;
                    canopyLength *= 0.8;
                } else if (['dodecahedron', 'icosahedron', 'octahedron', 'tetrahedron'].includes(comp.type)) {
                    domeGeo = new THREE.DodecahedronGeometry(1, 0);
                } else if (['box', 'prism', 'wedge'].includes(comp.type)) {
                    domeGeo = new THREE.BoxGeometry(1, 1, 1);
                    domeGeo.translate(0, 0.5, 0);
                } else {
                    // Variation in bridge shapes
                    switch (shapeType) {
                        case 0: // Wide Flat Cylinder (Star Trek style)
                            domeGeo = new THREE.CylinderGeometry(1, 1, 0.4, 16);
                            domeGeo.translate(0, 0.2, 0);
                            canopyWidth *= 1.5;
                            canopyLength *= 1.2;
                            break;
                        case 1: // Cone
                            domeGeo = new THREE.ConeGeometry(1, 1, 16);
                            domeGeo.translate(0, 0.5, 0);
                            break;
                        case 2: // Truncated Cone
                            domeGeo = new THREE.CylinderGeometry(0.6, 1, 0.8, 16);
                            domeGeo.translate(0, 0.4, 0);
                            break;
                        case 3: // Box / Rectangular Cuboid
                            domeGeo = new THREE.BoxGeometry(1.2, 0.8, 1.5);
                            domeGeo.translate(0, 0.4, 0);
                            break;
                        case 4: // Capsule
                            domeGeo = new THREE.CapsuleGeometry(0.8, 1, 4, 8);
                            domeGeo.rotateX(Math.PI / 2);
                            domeGeo.translate(0, 0.4, 0);
                            break;
                        default: // Classic Dome
                            domeGeo = new THREE.SphereGeometry(1, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
                            break;
                    }
                }
                domeGeo.applyMatrix4(new THREE.Matrix4().makeScale(canopyWidth, canopyHeight, canopyLength));

                const dome = new THREE.Mesh(domeGeo, this.glassMat);

                let offset = -scale.y * 0.1; // Sink slightly
                if (['dodecahedron', 'icosahedron', 'octahedron', 'tetrahedron'].includes(comp.type)) {
                    offset = 0.0;
                }
                if (!isPrimaryCockpit) {
                    offset = 0.0; // Flush windows
                }

                // FIX: Use component's local UP vector for raycasting to ensure we hit the top of the component
                const up = new THREE.Vector3(0, 1, 0).applyEuler(rot);
                const forward = new THREE.Vector3(0, 0, 1).applyEuler(rot);

                let rayOrigin, rayDir;

                // Determine constraint. Standard ships (Z-axis) benefit from X-constraint to keep cockpits upright.
                // Saucers (Y-axis) might have cockpits on the rim or radially, so we should not constrain X.
                let constraint = 'x';
                let orientToCenter = false;

                if (symmetryType === 'RADIAL') {
                    constraint = null;
                    orientToCenter = true; // Always orient to center for radial ships (Saucers or Rockets)
                }

                if (radialAxis === 'y') {
                    rayOrigin = pos.clone().add(up.clone().multiplyScalar(scale.y + 5));
                    rayDir = up.clone().negate();
                } else {
                    if (Math.floor((pos.x + pos.y + pos.z) * 100) % 2 === 0) {
                        rayOrigin = pos.clone().add(up.clone().multiplyScalar(scale.y + 5));
                        rayDir = up.clone().negate();
                    } else {
                        rayOrigin = pos.clone().add(forward.clone().multiplyScalar(scale.z + 5));
                        rayDir = forward.clone().negate();
                        if (!isCentral) constraint = null;
                    }
                }

                // Use a slightly larger offset to sink it, and ensure we don't constrain normal too strictly if the hull is curved
                this.placeOnSurface(hullMesh, greebleGroup, rayOrigin, rayDir, dome, true, offset - 0.2, isCentral, symmetryType, radialAxis, radialCount, constraint, orientToCenter);
            }

            // 4. Nav Lights
            if (usage.includes('wing') || usage.includes('fin')) {
                const lightGeo = new THREE.SphereGeometry(0.15, 8, 8);

                let mat = this.lightRedMat;
                if (symmetryType === 'RADIAL') {
                    // Radial ships (Saucers or Rockets) get amber/blue lights as they rotate/have no fixed port/starboard
                    mat = (pos.x + pos.z) > 0 ? this.lightAmberMat : this.lightBlueMat;
                } else {
                    // Port (Left) is -X (Red), Starboard (Right) is +X (Green)
                    mat = pos.x > 0 ? this.lightGreenMat : this.lightRedMat; // Fixed: +X is Right (Green), -X is Left (Red)
                }

                const w = comp.dims.width || 1;
                const l = comp.dims.length || 1;
                const tipWidth = l * 0.1;
                // Calculate tip offset based on side. If Left (-X), tip is at -w/2. If Right (+X), tip is at +w/2.
                const localTip = new THREE.Vector3((pos.x >= 0 ? 1 : -1) * w / 2, 0, -l/2 + tipWidth/2);
                const worldTip = localTip.clone().applyEuler(rot);
                worldTip.add(pos);

                const light = new THREE.Mesh(lightGeo, mat);
                light.position.copy(worldTip);
                greebleGroup.add(light);
            }

            // 5. Thrusters
            if (usage.includes('thruster') || usage.includes('engine')) {
                let refDim = Math.min(scale.x, scale.y, scale.z);
                let radiusFactor = 0.35;

                if (['cylinder', 'cone', 'truncatedCone', 'capsule'].includes(comp.type)) {
                    refDim = Math.max(scale.x, scale.z);
                    radiusFactor = 0.75;
                }

                const nozzleLen = refDim * 0.5;
                const rearRadius = refDim * radiusFactor;

                // Determine shape based on position for consistency
                const shapeType = Math.floor((Math.abs(pos.x) + Math.abs(pos.y) + Math.abs(pos.z)) * 100) % 3;

                const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.8, side: THREE.DoubleSide });
                let nozzle;

                // Determine direction "out"
                // For main engines, we want them pointing BACK (-Z) regardless of component rotation
                let exhaustDir = new THREE.Vector3(0, 0, -1);

                if (radialAxis === 'y') {
                    exhaustDir.set(0, -1, 0);
                }

                if (shapeType === 0) {
                    // Standard Truncated Cone
                    // Narrow radius in direction of travel (+Z). Wide at exhaust (-Z).
                    // Aligned to exhaustDir (-Z), so Y+ is -Z (Wide), Y- is +Z (Narrow).
                    const nozzleGeo = new THREE.CylinderGeometry(rearRadius, rearRadius * 0.5, nozzleLen, 16, 1, true);
                    nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
                } else if (shapeType === 1) {
                    // Rectangular / Boxy Nozzle
                    const nozzleGeo = new THREE.CylinderGeometry(rearRadius, rearRadius * 0.7, nozzleLen, 4, 1, true);
                    nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
                    nozzle.rotation.y = Math.PI / 4; // Align sides
                } else {
                    // Cluster of small cones
                    nozzle = new THREE.Group();
                    const subRadius = rearRadius * 0.4;
                    const subGeo = new THREE.CylinderGeometry(subRadius * 0.9, subRadius * 0.6, nozzleLen, 12, 1, true);

                    const offsets = [
                        [0, subRadius * 0.8],
                        [subRadius * 0.7, -subRadius * 0.4],
                        [-subRadius * 0.7, -subRadius * 0.4]
                    ];

                    offsets.forEach(off => {
                        const subMesh = new THREE.Mesh(subGeo, nozzleMat);
                        subMesh.position.set(off[0], 0, off[1]);

                        const subGlowGeo = new THREE.SphereGeometry(subRadius * 0.25, 8, 8);
                        const subGlow = new THREE.Mesh(subGlowGeo, new THREE.MeshBasicMaterial({ color: 0x00ffff }));
                        subGlow.position.y = nozzleLen * 0.2;
                        subMesh.add(subGlow);

                        nozzle.add(subMesh);
                    });
                }

                // Fix rotation for 180 degree flip (Up to Down) which setFromUnitVectors handles poorly
                if (exhaustDir.y === -1 && exhaustDir.x === 0 && exhaustDir.z === 0) {
                    nozzle.rotation.x = Math.PI;
                } else {
                    nozzle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), exhaustDir);
                }

                // Raycast from "behind" the engine (in exhaust direction) back towards the ship to find the hull surface
                // We start far out and cast opposite to exhaust
                const rayOrigin = new THREE.Vector3().copy(pos).add(exhaustDir.clone().multiplyScalar(scale.y + 2));
                const rayDir = exhaustDir.clone().negate();

                this.raycaster.set(rayOrigin, rayDir);

                let intersects = [];
                if (hullMesh.isGroup) {
                    intersects = this.raycaster.intersectObjects(hullMesh.children, true);
                } else {
                    intersects = this.raycaster.intersectObject(hullMesh);
                }

                if (intersects.length > 0) {
                    const hit = intersects[0];
                    const placePos = hit.point.clone().add(exhaustDir.clone().multiplyScalar(nozzleLen / 2));
                    nozzle.position.copy(placePos);
                } else {
                    // Fallback: Place at the component's position, offset by half its height in the exhaust direction
                    // This assumes the component is roughly aligned with the exhaust
                    nozzle.position.copy(pos).add(exhaustDir.clone().multiplyScalar(scale.y * 0.5));
                }

                if (shapeType !== 2) {
                    const glowGeo = new THREE.SphereGeometry(rearRadius * 0.25, 16, 16);
                    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
                    const glow = new THREE.Mesh(glowGeo, glowMat);
                    glow.position.y = nozzleLen * 0.2;
                    glow.name = "engine_glow";
                    nozzle.add(glow);
                }

                greebleGroup.add(nozzle);
            }

            // 6. Weapons
            if (usage.includes('turret') || usage.includes('weapon')) {
                const barrelGeo = new THREE.CylinderGeometry(scale.x * 0.2, scale.x * 0.2, scale.y * 2.0, 8);
                barrelGeo.rotateX(Math.PI / 2);
                const barrelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
                const barrel = new THREE.Mesh(barrelGeo, barrelMat);

                const offsetDist = scale.y + 2;
                this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(pos.x, pos.y + offsetDist, pos.z), new THREE.Vector3(0, -1, 0), barrel, true, scale.x * 0.5, isCentral, symmetryType, radialAxis, radialCount, null, globalOrientToCenter);
            }
        });

        return greebleGroup;
    }
}
