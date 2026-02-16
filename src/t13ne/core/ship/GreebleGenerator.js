// d:\GIthubreps\t13nge\T13NarrativeGameEngine\src\t13ne\core\ship\GreebleGenerator.js

import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { mulberry32 } from './ShipUtils.js';

export class GreebleGenerator {
    constructor(modelLoader) {
        this.modelLoader = modelLoader;
        this.raycaster = new THREE.Raycaster();
        
        // Materials
        this.rivetMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7, metalness: 0.6 });
        this.ventMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.4 });
        this.antennaMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.4, metalness: 0.8 });
        // Lit from within look: High emissive, low roughness
        this.glassMat = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            emissive: 0xaaddff,
            emissiveIntensity: 2.0,
            roughness: 0.2,
            metalness: 0.8
        });
        this.canopyMat = new THREE.MeshStandardMaterial({ 
            color: 0x3366ff, 
            emissive: 0x000000,
            roughness: 0.1,
            metalness: 0.9,
            envMapIntensity: 1.0
        });
        this.supportMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7, metalness: 0.4 });
        this.decalMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.9, roughness: 0.8, metalness: 0.2, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, alphaTest: 0.1 });
        this.lightRedMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.lightGreenMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.lightWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Red/Orange for collectors
		this.lightAmberMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

        // More distinctive engine indicator lights

        this.lightBlueMat = new THREE.MeshBasicMaterial({ color: 0x00aaff });
        this.solarMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.2, metalness: 1.0, emissive: 0x111111, emissiveIntensity: 0.1 });
        this.warpGlowMat = new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.9 }); // Blue glow for strips
        this.bussardMat = new THREE.MeshBasicMaterial({ color: 0xff3300, transparent: true, opacity: 0.9 }); // Red/Orange for collectors

        // Geometries
        this.ventGeo = new THREE.BoxGeometry(0.8, 0.1, 0.4);
        this.panelGeo = new THREE.BoxGeometry(0.8, 0.05, 0.8);

        this.occupiedZones = []; // Track placed greebles {pos, radius}
        this.avoidanceZones = []; // Track areas to avoid (cockpits) {pos, radius}
    }

	createAntennaArray() {
        const group = new THREE.Group();
        // Construct the antenna such that its base is at (0,0,0) and its "up" is (0,1,0)
        // The blade and glow will be children of a sub-group that can be rotated.

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.2, 6), this.ventMat);
        base.position.y = 0.1; // This is fine, it's relative to the group's origin

        const bladeContainer = new THREE.Group(); // Container for blade and glow
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 0.4), this.antennaMat);
        blade.position.y = 0.6; // Relative to bladeContainer
        bladeContainer.add(blade);
        
        const glow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.05), this.lightGreenMat);
        glow.position.set(0, 0.6, 0.2); // Relative to bladeContainer
        bladeContainer.add(glow);

        bladeContainer.rotation.x = -Math.PI / 4; // Apply the tilt here
        bladeContainer.position.y = 0.2; // Position the blade container above the base
        group.add(base);
        group.add(bladeContainer);

        return group;
    }

    createRivet() {
        // Try to create variable rivet shape for variety
        const roll = Math.random();
        let rivetGeo;
        if (roll < 0.33) {
            rivetGeo = new THREE.SphereGeometry(0.08, 4, 4);
        } else if (roll < 0.66) {
            rivetGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6);
        } else {
            rivetGeo = new THREE.TetrahedronGeometry(0.1);
        }
		return rivetGeo;
    }

	
    getOrCreateRivetGeo() {
		return this.rivetGeo = this.rivetGeo || this.createRivet();
    }

    createPipe(length) {
        const geo = new THREE.CylinderGeometry(0.05, 0.05, length, 6);
        const mesh = new THREE.Mesh(geo, this.ventMat);
        mesh.rotation.z = Math.PI / 2; // Lay flat
        return mesh;
    }

    createLadder(length) {
        const group = new THREE.Group();
        const railGeo = new THREE.CylinderGeometry(0.03, 0.03, length, 4);
        const rail1 = new THREE.Mesh(railGeo, this.rivetMat);
        rail1.position.x = -0.15;
        const rail2 = new THREE.Mesh(railGeo, this.rivetMat);
        rail2.position.x = 0.15;
        group.add(rail1);
        group.add(rail2);

        const rungs = Math.floor(length / 0.2);
        const rungGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4);
        rungGeo.rotateZ(Math.PI/2);
        for(let i=0; i<rungs; i++) {
            const rung = new THREE.Mesh(rungGeo, this.rivetMat);
            rung.position.y = (i - rungs/2) * 0.2;
            group.add(rung);
        }
        return group;
    }

    createSolarPanel() {
        const group = new THREE.Group();
        
        // Attachment stem
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4), this.ventMat);
        stem.position.y = 0.2;
        group.add(stem);

        // Panel Array (Antenna style)
        const width = 0.6;
        const length = 1.2;
        const panelGeo = new THREE.BoxGeometry(width, 0.05, length);
        // Translate so corner is at origin (attachment point)
        panelGeo.translate(width / 2, 0, length / 2);

        const panel = new THREE.Mesh(panelGeo, this.solarMat);
        panel.position.set(0, 0.4, 0); // Top of stem
        // Rotate to stand out vertically and angled
        panel.rotation.set(-Math.PI / 2 + 0.3, Math.PI / 4, 0);
        group.add(panel);
        
        return group;
    }

    createLandingGear() {
        const group = new THREE.Group();
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5), this.rivetMat);
        leg.position.y = -0.75;
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.8), this.ventMat);
        foot.position.y = -1.5;
        group.add(leg);
        group.add(foot);
        return group;
    }

    createRoundedRectShape(width, height, radius) {
        const shape = new THREE.Shape();
        const x = -width / 2;
        const y = -height / 2;
        shape.moveTo(x + radius, y);
        shape.lineTo(x + width - radius, y);
        shape.quadraticCurveTo(x + width, y, x + width, y + radius);
        shape.lineTo(x + width, y + height - radius);
        shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        shape.lineTo(x + radius, y + height);
        shape.quadraticCurveTo(x, y + height, x, y + height - radius);
        shape.lineTo(x, y + radius);
        shape.quadraticCurveTo(x, y, x + radius, y);
        return shape;
    }

    placeOnSurface(hullMesh, greebleGroup, origin, direction, objectToPlace, alignToNormal = true, offset = 0, applySymmetry = true, symmetryType, radialAxis, radialCount = 3, constrainNormalAxis = null, alignment = 'center', scaleToFit = false) {
        this.raycaster.set(origin, direction);
        
        let intersects = [];
        if (hullMesh.isGroup) {
            intersects = this.raycaster.intersectObjects(hullMesh.children, true);
        } else {
            intersects = this.raycaster.intersectObject(hullMesh);
        }
        
        let placed = false;

        if (intersects.length > 0) {
            // Prevent placing greebles too close to the symmetry axis to avoid overlapping duplicates
            if (applySymmetry && symmetryType === 'REFLECTIVE' && Math.abs(intersects[0].point.x) < 0.1) {
                applySymmetry = false;
            }
            if (applySymmetry && symmetryType === 'RADIAL' && new THREE.Vector2(intersects[0].point.x, intersects[0].point.z).length() < 0.1) {
                applySymmetry = false;
            }

            const hit = intersects[0];
            if (!hit.face) return false; // Safety check for non-mesh hits

            const pos = hit.point;

            // --- Occupancy Check ---
            // Calculate approximate radius of object being placed
            const bbox = new THREE.Box3().setFromObject(objectToPlace);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            const radius = Math.max(size.x, size.z) * 0.75; // Increased safety radius to prevent intersections

            // Check against occupied zones
            for (const zone of this.occupiedZones) {
                if (pos.distanceTo(zone.pos) < (radius + zone.radius)) {
                    return false;
                }
            }
            // Check against avoidance zones (e.g. cockpits)
            for (const zone of this.avoidanceZones) {
                if (pos.distanceTo(zone.pos) < (radius + zone.radius)) {
                    return false;
                }
            }
            // -----------------------

            const normal = hit.face.normal.clone();
            normal.transformDirection(hit.object.matrixWorld).normalize();

            if (constrainNormalAxis === 'x') {
                normal.x = 0;
                normal.normalize();
            }

            const instance = objectToPlace.clone();
            
            if (scaleToFit) {
                // Advanced Footprint Check: Ensure corners of the object are on the surface
                // This handles CSG meshes where face size is unreliable
                const bbox = new THREE.Box3().setFromObject(instance);
                const width = bbox.max.x - bbox.min.x;
                const depth = bbox.max.z - bbox.min.z;
                
                // Create a basis for the placement
                const up = normal.clone();
                const right = new THREE.Vector3(1, 0, 0).cross(up).normalize();
                if (right.lengthSq() < 0.01) right.set(1, 0, 0); // Handle case where normal is X
                const fwd = new THREE.Vector3().crossVectors(up, right).normalize();

                // Check 4 corners
                const corners = [
                    new THREE.Vector3().addScaledVector(right, width/2).addScaledVector(fwd, depth/2),
                    new THREE.Vector3().addScaledVector(right, -width/2).addScaledVector(fwd, depth/2),
                    new THREE.Vector3().addScaledVector(right, width/2).addScaledVector(fwd, -depth/2),
                    new THREE.Vector3().addScaledVector(right, -width/2).addScaledVector(fwd, -depth/2)
                ];

                let allOnSurface = true;
                const checkRay = new THREE.Raycaster();
                
                for (const cornerOffset of corners) {
                    const cornerOrigin = pos.clone().add(cornerOffset).add(normal.clone().multiplyScalar(1.0)); // Start slightly above
                    checkRay.set(cornerOrigin, normal.clone().negate());
                    const hits = checkRay.intersectObject(hit.object, false);
                    if (hits.length === 0 || hits[0].distance > 2.0) { // If miss or too far (gap)
                        instance.scale.multiplyScalar(0.7); // Scale down significantly if overhang detected
                        break; // Only need to scale once per check cycle (simplified)
                    }
                }
            }

            instance.position.copy(pos).add(normal.clone().multiplyScalar(offset));
            if (alignToNormal) {
                // Default orientation: object's local Y-axis points along the normal
                const upVector = new THREE.Vector3(0, 1, 0);
                instance.quaternion.setFromUnitVectors(upVector, normal);
                
                // Secondary Alignment to prevent twisting
                if (alignment !== 'none') {
                    let targetDir;
                    if (alignment instanceof THREE.Vector3) {
                        // Custom alignment vector passed in
                        targetDir = alignment.clone();
                    } else if (alignment === 'forward') {
                        // Align Z to Ship Forward (0,0,1) projected on surface
                        targetDir = new THREE.Vector3(0, 0, 1);
                    } else {
                        // Default 'center': Align Z to point Inward (towards spine)
                        if (radialAxis === 'z') targetDir = new THREE.Vector3(0, 0, pos.z).sub(pos).normalize();
                        else targetDir = new THREE.Vector3(0, pos.y, 0).sub(pos).normalize();
                    }

                    // Project targetDir onto the plane defined by 'normal'
                    // v_proj = v - (v . n) * n
                    let projected = targetDir.clone().sub(normal.clone().multiplyScalar(targetDir.dot(normal))).normalize();

                    if (projected.lengthSq() < 0.001) {
                        // Fallback: If targetDir is parallel to normal (e.g. aligning 'forward' on the nose)
                        // we need an alternative vector to define the orientation.
                        let fallback = new THREE.Vector3(0, 1, 0);
                        if (Math.abs(normal.y) > 0.9) fallback = new THREE.Vector3(0, 0, 1);
                        projected = fallback.sub(normal.clone().multiplyScalar(fallback.dot(normal))).normalize();
                    }

                    if (projected.lengthSq() > 0.001) {
                        const yAxis = normal; // Up
                        const zAxis = projected; // Forward/In
                        const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize(); // Right
                        instance.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
                    }
                }
            }
            greebleGroup.add(instance);
            placed = true;

            // Register occupied zone
            this.occupiedZones.push({ pos: instance.position.clone(), radius: radius });

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
                         if (!symHit.face) return placed;

                         const symNormal = symHit.face.normal.clone();
                         symNormal.transformDirection(symHit.object.matrixWorld).normalize();
                         
                         const symInstance = objectToPlace.clone();
                         symInstance.position.copy(symHit.point).add(symNormal.clone().multiplyScalar(offset));
                         if (alignToNormal) {
                             const upVector = new THREE.Vector3(0, 1, 0);
                             symInstance.quaternion.setFromUnitVectors(upVector, symNormal);

                             if (alignment !== 'none') {
                                const symPos = symHit.point;
                                let targetDir;
                                if (alignment === 'forward') targetDir = new THREE.Vector3(0, 0, 1);
                                else if (radialAxis === 'z') targetDir = new THREE.Vector3(0, 0, symPos.z).sub(symPos).normalize();
                                else targetDir = new THREE.Vector3(0, symPos.y, 0).sub(symPos).normalize();
                                
                                let projectedZ = targetDir.clone().sub(symNormal.clone().multiplyScalar(targetDir.dot(symNormal))).normalize();

                                if (projectedZ.lengthSq() < 0.001) {
                                    let fallback = new THREE.Vector3(0, 1, 0);
                                    if (Math.abs(symNormal.y) > 0.9) fallback = new THREE.Vector3(0, 0, 1);
                                    projectedZ = fallback.sub(symNormal.clone().multiplyScalar(fallback.dot(symNormal))).normalize();
                                }
                                
                                if (projectedZ.lengthSq() > 0.001) {
                                    const yAxis = symNormal;
                                    const zAxis = projectedZ;
                                    const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();
                                    symInstance.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
                                }
                             }
                         }
                         greebleGroup.add(symInstance);
                         // Register symmetry occupied zone
                         this.occupiedZones.push({ pos: symInstance.position.clone(), radius: radius });
                     }
                } else if (symmetryType === 'RADIAL') {
                    const count = radialCount;
                    for (let i = 1; i < count; i++) {
                        const angle = (Math.PI * 2 / count) * i;
                        const rOrigin = origin.clone();
                        const rDir = direction.clone();
                        let rAlignment = alignment;
                        
                        if (radialAxis === 'z') {
                            rOrigin.applyAxisAngle(new THREE.Vector3(0,0,1), angle);
                            rDir.applyAxisAngle(new THREE.Vector3(0,0,1), angle);
                            // Rotate alignment vector if it's 'forward' or a vector
                            if (alignment === 'forward') {
                                // For Z-axis ships, 'forward' is Z, which doesn't change with Z-rotation
                                rAlignment = 'forward'; 
                            }
                        } else {
                            rOrigin.applyAxisAngle(new THREE.Vector3(0,1,0), angle);
                            rDir.applyAxisAngle(new THREE.Vector3(0,1,0), angle);
                            // Rotate alignment vector for Y-axis (Saucer) symmetry
                            if (alignment === 'forward') {
                                // 'Forward' is Z. Rotating around Y changes Z.
                                rAlignment = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
                            }
                        }
                        
                        this.placeOnSurface(hullMesh, greebleGroup, rOrigin, rDir, objectToPlace, alignToNormal, offset, false, symmetryType, radialAxis, radialCount, constrainNormalAxis, rAlignment, scaleToFit);
                    }
                }
            }
        }
        return placed;
    }

    getLocalBasis(rot) {
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot));
        return {
            right: new THREE.Vector3(1, 0, 0).applyQuaternion(q),
            up: new THREE.Vector3(0, 1, 0).applyQuaternion(q),
            forward: new THREE.Vector3(0, 0, 1).applyQuaternion(q),
            quaternion: q
        };
    }

    generate(hullMesh, components, styleConfig, symmetryType, radialAxis, radialCount = 3, hullType = 'SPINE', seed = 0) {
        const random = mulberry32(seed >>> 0);
        if (!hullMesh) return new THREE.Group();

        // Reset tracking arrays
        this.occupiedZones = [];
        this.avoidanceZones = [];

        // Identify Cockpits for avoidance
        components.forEach(c => {
            if (c.usage && (c.usage.includes('cockpit') || c.usage.includes('bridge'))) {
                // Estimate radius
                const s = c.scale || [1,1,1];
                const d = c.dims || {};
                // Use max dimension as exclusion radius
                const r = Math.max((d.width||0)*s[0], (d.height||0)*s[1], (d.depth||0)*s[2], (d.radius||0)*s[0]) * 0.8;
                this.avoidanceZones.push({ pos: new THREE.Vector3(...c.pos), radius: r });
            }
        });

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
        const globalOrientToCenter = (symmetryType === 'RADIAL' || symmetryType === 'REFLECTIVE');

        components.forEach(comp => {
            const usage = (comp.stats && (comp.stats.usage || comp.stats.name)) ? (comp.stats.usage || comp.stats.name).toLowerCase() : (comp.type || '');
            const pos = comp.position;
            const scale = comp.scale;
            const rot = comp.rotation;

            // Check for component-specific symmetry override (e.g. wings on an asymmetrical ship)
            const effectiveSymmetry = (comp.stats && comp.stats.forceSymmetry) ? comp.stats.forceSymmetry : symmetryType;
            const effectiveRadialCount = (comp.stats && comp.stats.radialCount) ? comp.stats.radialCount : radialCount;

            let isCentral = false;
            if (symmetryType === 'REFLECTIVE') {
                isCentral = Math.abs(pos.x) < 0.1;
            } else if (symmetryType === 'RADIAL') {
                if (radialAxis === 'z') isCentral = new THREE.Vector2(pos.x, pos.y).length() < 0.1;
                else isCentral = new THREE.Vector2(pos.x, pos.z).length() < 0.1;
            } else {
                isCentral = true; 
            }

            // Determine primary axis for greebling (forward/exhaust) and the component's length along that axis.
            const compQuaternion = new THREE.Quaternion().setFromEuler(rot);
            let exhaustDir, forwardDir, lengthDim;
            if (['cylinder', 'cone', 'truncatedCone', 'capsule', 'prism'].includes(comp.type)) {
                // For these shapes, length is along the local Y axis.
                exhaustDir = new THREE.Vector3(0, -1, 0).applyQuaternion(compQuaternion);
                forwardDir = new THREE.Vector3(0, 1, 0).applyQuaternion(compQuaternion);
                lengthDim = scale.y;
            } else {
                // For boxes, length is along local Z.
                exhaustDir = new THREE.Vector3(0, 0, -1).applyQuaternion(compQuaternion);
                forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(compQuaternion);
                lengthDim = scale.z;
            }

            // 1. Structural Riveting (Grid/Seam Logic)
            if (styleConfig.method !== 'ORGANIC' && (usage.includes('fuselage') || usage.includes('chassis') || usage.includes('hull'))) {
                const basis = this.getLocalBasis(rot);
                let lengthDir, radialDir1, radialDir2, radiusDim;

                if (['cylinder', 'cone', 'truncatedCone', 'capsule', 'prism'].includes(comp.type)) {
                    lengthDir = basis.up; // Y is length
                    radialDir1 = basis.right;
                    radialDir2 = basis.forward;
                    radiusDim = (comp.dims.radius || comp.dims.radiusTop || 1) * Math.max(scale.x, scale.z);
                } else {
                    lengthDir = basis.forward; // Z is length
                    radialDir1 = basis.right;
                    radialDir2 = basis.up;
                    radiusDim = Math.max((comp.dims.width||1)*scale.x, (comp.dims.height||1)*scale.y) * 0.5;
                }

                const rivetPitch = 0.5; // Spacing between rivets
                const panelSpacing = 5.0; // Spacing between structural seams
                
                // A. Ring Seams (Radial)
                const numRings = Math.floor(lengthDim / panelSpacing);
                const startLocal = -lengthDim / 2;
                
                for (let i = 0; i <= numRings; i++) {
                    const localPos = startLocal + (i * panelSpacing);
                    if (i === 0 || i === numRings) continue; // Skip ends

                    const ringCenter = pos.clone().add(lengthDir.clone().multiplyScalar(localPos));
                    const circumference = 2 * Math.PI * radiusDim;
                    const rivetsInRing = Math.floor(circumference / rivetPitch);
                    
                    for (let r = 0; r < rivetsInRing; r++) {
                        const angle = (r / rivetsInRing) * Math.PI * 2;
                        const offset = radialDir1.clone().multiplyScalar(Math.cos(angle))
                            .add(radialDir2.clone().multiplyScalar(Math.sin(angle)))
                            .multiplyScalar(radiusDim + 5.0);
                        
                        const rayOrigin = ringCenter.clone().add(offset);
                        const rayDir = offset.clone().negate().normalize();
                        this.placeOnSurface(hullMesh, greebleGroup, rayOrigin, rayDir, new THREE.Mesh(this.rivetGeo, this.rivetMat), true, 0, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'up');
                    }
                }

                // B. Longitudinal Seams (Along length)
                const numLongLines = Math.max(4, Math.floor((2 * Math.PI * radiusDim) / panelSpacing));
                for (let l = 0; l < numLongLines; l++) {
                    const angle = (l / numLongLines) * Math.PI * 2;
                    const offsetDir = radialDir1.clone().multiplyScalar(Math.cos(angle))
                        .add(radialDir2.clone().multiplyScalar(Math.sin(angle))).normalize();
                    
                    const rivetsInLine = Math.floor(lengthDim / rivetPitch);
                    for (let r = 0; r < rivetsInLine; r++) {
                        const t = r / rivetsInLine;
                        let localPos = startLocal + t * lengthDim;
                        
                        // Zig-Zag offset for odd lines
                        if (l % 2 !== 0) localPos += (rivetPitch * 0.5);
                        if (localPos > lengthDim/2) continue;

                        const linePoint = pos.clone().add(lengthDir.clone().multiplyScalar(localPos));
                        const rayOrigin = linePoint.clone().add(offsetDir.clone().multiplyScalar(radiusDim + 5.0));
                        const rayDir = offsetDir.clone().negate();
                        this.placeOnSurface(hullMesh, greebleGroup, rayOrigin, rayDir, new THREE.Mesh(this.rivetGeo, this.rivetMat), true, 0, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'up');
                    }
                }

                const offsetDist = radiusDim + 5.0;

                if (usage.includes('fuselage')) {
                    const antenna = this.createAntennaArray();
                    antenna.scale.setScalar(1.0);
                    // FIX: Use pos.x instead of 0 to support asymmetrical ships
                    this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(pos.x, pos.y + offsetDist, pos.z - scale.z * 0.4), new THREE.Vector3(0, -1, 0), antenna, true, 0, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'forward');
                }

                // Pipes and Ladders on industrial ships
                if (styleConfig.method === 'INDUSTRIAL' && random() > 0.6) {
                    const pipe = this.createPipe(lengthDim * 0.8);
                    this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(pos.x + offsetDist, pos.y, pos.z), new THREE.Vector3(-1, 0, 0), pipe, true, 0.1, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'forward');
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

                // Use new variable vent sizes for more diverse outputs
                const ventWidth = Math.max(0.6, minDim * (0.4 + random() * 0.3));
                const ventHeight = ventWidth * (0.4 + random()*0.6);
                const ventDepth = 0.1;
				
                const ventShape = this.getOrCreateRivetGeo();

                // Create a frame/base
                const frameGeo = new THREE.BoxGeometry(ventWidth, ventHeight, ventDepth)
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
                ventGroup.rotation.x = -Math.PI / 2;

                const offsetDist = Math.max(scale.x, scale.y) + 5; // Start just outside to avoid hitting other components
                this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(pos.x, pos.y + offsetDist, pos.z), new THREE.Vector3(0, -1, 0), container, true, 0, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'forward', true);
                // Removed side placement to avoid fins

                // Engine Intakes
                const intake = new THREE.Mesh(new THREE.BoxGeometry(ventWidth, ventHeight, ventWidth), this.ventMat);
                // Place at front of engine
                this.placeOnSurface(hullMesh, greebleGroup, pos.clone().add(forwardDir.multiplyScalar(lengthDim/2 + 5)), forwardDir.clone().negate(), intake, true, 0, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'forward');
            }

            // 3. Cockpit (Canopy)
            if (usage.includes('cockpit') || usage.includes('bridge')) {
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
                let cockpitSeed;
                if (symmetryType === 'RADIAL') {
                    if (radialAxis === 'y') { // Saucer
                        cockpitSeed = new THREE.Vector2(pos.x, pos.z).length();
                    } else { // Rocket
                        cockpitSeed = new THREE.Vector2(pos.x, pos.y).length();
                    }
                } else { // Reflective or ASYMMETRICAL
                    cockpitSeed = Math.abs(pos.x) + pos.y + pos.z;
                }
                const seed = cockpitSeed * 13.1;
                const shapeType = Math.floor(Math.abs(Math.sin(seed) * 6));

                // FIX: Calculate dimensions based on component type to prevent oversized cockpits
                // Use dims if available, otherwise scale
                let refLength, refWidth, refDepth;
                const d = comp.dims || {};
                const s = comp.scale || new THREE.Vector3(1,1,1);

                if (['cylinder', 'cone', 'capsule', 'prism', 'truncatedCone'].includes(comp.type)) {
                    refLength = (d.height || d.length || 1) * s.y;
                    refWidth = (d.radiusTop !== undefined ? d.radiusTop : (d.radius || 0.5)) * 1.0 * s.x;
                    refDepth = (d.radiusBottom !== undefined ? d.radiusBottom : (d.radius || 0.5)) * 2 * s.z;
                } else {
                    refLength = (d.length || d.rootChord || d.depth || 1) * s.z;
                    refWidth = (d.width || d.span || 1) * s.x;
                    refDepth = (d.height || 1) * s.y;
                }

                let canopyLength = refLength * 0.4; 
                let canopyWidth = refWidth * 0.5;
                let canopyHeight = Math.min(refDepth * 0.4, 0.8); // Stricter cap on height

                if (radialAxis === 'y') {
                    const dim = Math.min(canopyWidth, canopyLength);
                    canopyWidth = dim;
                    canopyLength = dim;
                }

                const bands = [];

                if (!isPrimaryCockpit) {
                    // Observation Windows / Skylights (Flat)
                    domeGeo = new THREE.BoxGeometry(1, 1, 1);
                    canopyHeight = 0.15; 
                    canopyWidth *= 0.8;
                    canopyLength *= 0.8;
                } else if (['dodecahedron', 'icosahedron', 'octahedron', 'tetrahedron'].includes(comp.type)) {
                    domeGeo = new THREE.DodecahedronGeometry(1, 0);
                    // Add simple ring bands
                    bands.push(new THREE.TorusGeometry(0.9, 0.03, 8, 24).rotateX(Math.PI/2).translate(0, 0.3, 0));
                    bands.push(new THREE.TorusGeometry(0.6, 0.03, 8, 24).rotateX(Math.PI/2).translate(0, 0.7, 0));
                } else {
                    // Variation in bridge shapes
                    switch (shapeType) {
                        case 0: // Wide Flat Cylinder (Star Trek style)
                            domeGeo = new THREE.CylinderGeometry(1, 1, 0.4, 16);
                            domeGeo.translate(0, 0.2, 0);
                            canopyWidth *= 1.5;
                            canopyLength *= 1.2;
                            // Bands
                            bands.push(new THREE.TorusGeometry(1.01, 0.03, 8, 32).rotateX(Math.PI/2).translate(0, 0.1, 0));
                            bands.push(new THREE.TorusGeometry(1.01, 0.03, 8, 32).rotateX(Math.PI/2).translate(0, 0.3, 0));
                            break;
                        case 1: // Cone
                            domeGeo = new THREE.ConeGeometry(1, 1, 16);
                            domeGeo.translate(0, 0.5, 0);
                            // Bands at different heights/radii
                            bands.push(new THREE.TorusGeometry(0.7, 0.03, 8, 24).rotateX(Math.PI/2).translate(0, 0.3, 0));
                            bands.push(new THREE.TorusGeometry(0.4, 0.03, 8, 24).rotateX(Math.PI/2).translate(0, 0.6, 0));
                            break;
                        case 2: // Truncated Cone
                            domeGeo = new THREE.CylinderGeometry(0.6, 1, 0.8, 16);
                            domeGeo.translate(0, 0.4, 0);
                            // Bands
                            bands.push(new THREE.TorusGeometry(0.9, 0.03, 8, 24).rotateX(Math.PI/2).translate(0, 0.2, 0));
                            bands.push(new THREE.TorusGeometry(0.7, 0.03, 8, 24).rotateX(Math.PI/2).translate(0, 0.6, 0));
                            break;
                        case 3: // Box / Rectangular Cuboid
                            domeGeo = new THREE.BoxGeometry(1.2, 0.8, 1.5);
                            domeGeo.translate(0, 0.4, 0);
                            // Adding a frame box
                            const frame = new THREE.BoxGeometry(1.22, 0.05, 1.52);
                            frame.translate(0, 0.4, 0);
                            bands.push(frame);
                            break;
                        case 4: // Capsule
                            domeGeo = new THREE.CapsuleGeometry(0.8, 1, 4, 8);
                            domeGeo.rotateX(Math.PI / 2);
                            domeGeo.translate(0, 0.4, 0);
                            // Bands along the length
                            bands.push(new THREE.TorusGeometry(0.81, 0.03, 8, 24).rotateX(Math.PI/2).translate(0, 0.4 - 0.3, 0));
                            bands.push(new THREE.TorusGeometry(0.81, 0.03, 8, 24).rotateX(Math.PI/2).translate(0, 0.4 + 0.3, 0));
                            break;
                        default: // Classic Dome
                            // Faceted Geodesic Dome
                            domeGeo = new THREE.IcosahedronGeometry(1, 1);
                            // Bands
                            bands.push(new THREE.TorusGeometry(0.85, 0.03, 8, 32).rotateX(Math.PI/2).translate(0, 0.5, 0));
                            bands.push(new THREE.TorusGeometry(0.5, 0.03, 8, 32).rotateX(Math.PI/2).translate(0, 0.86, 0));
                            break;
                    }
                }
                const scaleMat = new THREE.Matrix4().makeScale(canopyWidth, canopyHeight, canopyLength);
                domeGeo.applyMatrix4(scaleMat);
                
                const dome = new THREE.Mesh(domeGeo, this.canopyMat);
                bands.forEach(geo => {
                    geo.applyMatrix4(scaleMat);
                    dome.add(new THREE.Mesh(geo, this.supportMat));
                });
                
                let offset = -scale.y * 0.1; // Sink slightly
                if (['dodecahedron', 'icosahedron', 'octahedron', 'tetrahedron'].includes(comp.type)) {
                    offset = 0.0;
                }
                if (!isPrimaryCockpit) {
                    offset = 0.0; // Flush windows
                }

                // FIX: Ensure window placement by trying Top, then Front, then Local Up
                let placed = false;
                
                // 1. Try Top (World Y) - Best for most ships
                placed = this.placeOnSurface(hullMesh, greebleGroup, pos.clone().add(new THREE.Vector3(0, 100, 0)), new THREE.Vector3(0, -1, 0), dome, true, offset - 0.2, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'forward', true);
                
                 // 2. Try Front (World Z) - Good for forward facing cockpits
                if (!placed) {
                    placed = this.placeOnSurface(hullMesh, greebleGroup, pos.clone().add(new THREE.Vector3(0, 0, 100)), new THREE.Vector3(0, 0, -1), dome, true, offset - 0.2, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'up', true);
                }

                // 3. Fallback: Component Local Up
                if (!placed) {
                    const compQuaternion = new THREE.Quaternion().setFromEuler(rot);
                    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(compQuaternion);
                    // Cast from far away
                    const rayOrigin = pos.clone().add(up.clone().multiplyScalar(100));
                    const rayDir = up.clone().negate();
                    this.placeOnSurface(hullMesh, greebleGroup, rayOrigin, rayDir, dome, true, offset - 0.2, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'forward', true);
                }

                // 4. Fallback: Windows if Canopy failed
                if (!placed) {
                    const winGeo = new THREE.CircleGeometry(0.15, 8);
                    winGeo.rotateX(-Math.PI / 2);
                    const winMat = this.glassMat;
                    
                    // Forward
                    const fwdPos = pos.clone().add(forwardDir.clone().multiplyScalar(scale.z * 0.5 + 5.0));
                    this.placeOnSurface(hullMesh, greebleGroup, fwdPos, forwardDir.clone().negate(), new THREE.Mesh(winGeo, winMat), true, 0.02, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'up');
                    
                    // Angled Left/Right
                    const angle = Math.PI / 4;
                    const leftDir = forwardDir.clone().applyAxisAngle(new THREE.Vector3(0,1,0), angle).normalize();
                    const rightDir = forwardDir.clone().applyAxisAngle(new THREE.Vector3(0,1,0), -angle).normalize();
                    
                    const leftPos = pos.clone().add(leftDir.clone().multiplyScalar(scale.z * 0.5 + 5.0));
                    this.placeOnSurface(hullMesh, greebleGroup, leftPos, leftDir.clone().negate(), new THREE.Mesh(winGeo, winMat), true, 0.02, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'up');
                    
                    const rightPos = pos.clone().add(rightDir.clone().multiplyScalar(scale.z * 0.5 + 5.0));
                    this.placeOnSurface(hullMesh, greebleGroup, rightPos, rightDir.clone().negate(), new THREE.Mesh(winGeo, winMat), true, 0.02, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'up');
                }
            }

            // 3b. Windows (Revised: Clustered at Front, Non-overlapping)
            if (usage.includes('fuselage') || usage.includes('hull') || usage.includes('quarters') || usage.includes('engine_room') || usage.includes('bridge')) {
                if (random() > 0.4) {
                    // Determine "Front" relative to Ship (+Z)
                    const dot = forwardDir.dot(new THREE.Vector3(0,0,1));
                    const isAligned = Math.abs(dot) > 0.5;
                    const frontSign = Math.sign(dot); // +1 if aligned with Z, -1 if opposed
                    
                    // Window Geometry
                    let windowGeo;
                    const winType = random();
                    if (winType < 0.3) {
                        windowGeo = new THREE.CircleGeometry(0.15, 16);
                    } else if (winType < 0.6) {
                        windowGeo = new THREE.ShapeGeometry(this.createRoundedRectShape(0.25, 0.4, 0.05));
                    } else if (winType < 0.8) {
                        windowGeo = new THREE.PlaneGeometry(0.8, 0.15);
                    } else {
                        windowGeo = new THREE.CircleGeometry(0.18, 6);
                    }
                    windowGeo.rotateX(-Math.PI / 2);

                    const windowMat = this.glassMat;
                    
                    // Grid placement
                    const spacing = 1.0;
                    // Cluster in front 40%
                    const startRatio = 0.1;
                    const endRatio = 0.5;
                    const segmentLength = lengthDim * (endRatio - startRatio);
                    const numRows = Math.floor(segmentLength / spacing);
                    
                    // Place on sides relative to component orientation
                    // Use basis.right (local X) for sides
                    const basis = this.getLocalBasis(rot);
                    const sideDirs = [basis.right, basis.right.clone().negate()];

                    // For bridges, also add forward direction for windows
                    if (usage.includes('bridge')) {
                        // Forward is usually local Z (basis.forward) or local Y (basis.up) depending on orientation
                        sideDirs.push(forwardDir);
                    }
                    
                    sideDirs.forEach(dir => {
                        if (random() > 0.3) {
                            const isForward = dir === forwardDir;

                            for (let r = 0; r < numRows; r++) {
                                // Position along length, biased to front
                                const offsetFromFront = startRatio * lengthDim + (r * spacing);
                                // Local Y runs -L/2 to +L/2. Front is +L/2 (if aligned)
                                const localY = (lengthDim / 2) - offsetFromFront;
                                const effectiveLocalY = localY * (isAligned ? frontSign : 1); // If not aligned, just use top
                                
                                // Center point on axis
                                let centrePoint;
                                if (isForward) {
                                    // For forward windows, place on the front face and spread horizontally
                                    const frontDist = lengthDim / 2 * (isAligned ? frontSign : 1);
                                    const spread = (r - (numRows - 1) / 2) * spacing;
                                    const baseVec = ['cylinder', 'cone', 'capsule'].includes(comp.type) ? basis.up : basis.forward;
                                    
                                    centrePoint = pos.clone().add(baseVec.clone().multiplyScalar(frontDist)).add(basis.right.clone().multiplyScalar(spread));
                                } else {
                                    if (['cylinder', 'cone', 'capsule'].includes(comp.type)) {
                                        centrePoint = pos.clone().add(basis.up.clone().multiplyScalar(effectiveLocalY));
                                    } else {
                                        centrePoint = pos.clone().add(basis.forward.clone().multiplyScalar(effectiveLocalY));
                                    }
                                }
                                
                                // Raycast inward from side
                                const radius = Math.max(scale.x, scale.z) * (comp.dims.radius || 1);
                                const rayOrigin = centrePoint.clone().add(dir.clone().multiplyScalar(radius + 5.0));
                                const rayDir = dir.clone().negate();
                                
                                this.placeOnSurface(hullMesh, greebleGroup, rayOrigin, rayDir, new THREE.Mesh(windowGeo, windowMat), true, 0.02, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'up');
                            }
                        }
                    });
                }
            }

            // 3c. Warp Nacelle Lighting
            if (usage.includes('warp_nacelle')) {
                // Add glowing strips along the side
                // Width 0.2, Height (Length) scale.y * 0.8.
                // Rotate X -90 to face Y. Height becomes Z (Length).
                const stripGeo = new THREE.PlaneGeometry(0.2, scale.y * 0.8);
                stripGeo.rotateX(-Math.PI / 2);

                const stripMesh = new THREE.Mesh(stripGeo, this.warpGlowMat);
                
                // Raycast to sides
                const sideDir = new THREE.Vector3(1, 0, 0).applyEuler(rot);
                this.placeOnSurface(hullMesh, greebleGroup, pos.clone().add(sideDir.multiplyScalar(scale.x + 5)), sideDir.negate(), stripMesh, true, 0.01, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'forward');

                // Bussard Collector (Front Cap)
                // Assuming front is +Y in local space (which is usually +Z in world for nacelles rotated 90 X)
                const frontDir = new THREE.Vector3(0, 1, 0).applyEuler(rot);
                const collectorGeo = new THREE.CircleGeometry(scale.x * 0.6, 16);
                collectorGeo.rotateX(-Math.PI / 2); // Face Y
                const collectorMesh = new THREE.Mesh(collectorGeo, this.bussardMat);
                
                this.placeOnSurface(hullMesh, greebleGroup, pos.clone().add(frontDir.multiplyScalar(scale.y/2 + 5)), frontDir.negate(), collectorMesh, true, 0.01, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'up');
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

                // Let's assume the light should be at the "outermost" point of the wing.
                // For a wedge, this is typically at (span, 0, Z_tip) in its local space.
                // We need to transform this local point to world space.
                const span = comp.dims.span || 1;
                const rootChord = comp.dims.rootChord || 1;
                const sweep = comp.dims.sweep || 0;
                const tipChord = comp.dims.tipChord || 0;
                
                // Tip center in local wedge space (before rotation)
                const localTip = new THREE.Vector3(span, 0, rootChord / 2 - sweep - tipChord / 2);
                
                // Apply component's local rotation (which is around Y for wings in ShipGenerator)
                const compLocalRot = new THREE.Euler().setFromVector3(comp.rotation); // Assuming comp.rotation is [0, Y_rot, 0]
                localTip.applyEuler(compLocalRot);

                // Now apply world position
                const worldTip = localTip.add(pos);

                const light = new THREE.Mesh(lightGeo, mat);
                
                // Add actual PointLight to cast glow
                const pointLight = new THREE.PointLight(mat.color, 1.0, 10);
                light.add(pointLight);

                // Raycast to find hull surface near tip to prevent burying
                // Direction from root (pos) to tip (worldTip)
                const dir = new THREE.Vector3().subVectors(worldTip, pos).normalize();
                // Start outside and cast back
                const rayOrigin = worldTip.clone().add(dir.multiplyScalar(5.0));
                const rayDir = dir.clone().negate();

                // Use placeOnSurface to handle placement and symmetry
                this.placeOnSurface(hullMesh, greebleGroup, rayOrigin, rayDir, light, true, 0.0, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'forward');
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
                let shapeSeed;
                if (symmetryType === 'RADIAL') {
                    // Use main ship seed for radial engines to ensure they are all the same style
                    shapeSeed = seed;
                } else { // Reflective or ASYMMETRICAL
                    shapeSeed = Math.abs(pos.x) + pos.y + pos.z;
                }
                const shapeType = Math.floor(Math.abs(Math.sin(shapeSeed * 100)) * 3);

                const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.8, side: THREE.DoubleSide });
                let nozzle;

                if (radialAxis === 'y') {
                    // Special handling for Y-radial ships (saucers)
                    exhaustDir.set(0, -1, 0); // Down
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
                
                // Orient the nozzle to point in the exhaust direction
                // The nozzle geometry is typically Y-up. We want its Y-axis to align with exhaustDir.
                const defaultUp = new THREE.Vector3(0, 1, 0);
                nozzle.quaternion.setFromUnitVectors(defaultUp, exhaustDir);
                
                // Raycast from "behind" the engine (in exhaust direction) back towards the ship to find the hull surface
                // We start far out and cast opposite to exhaust
                // The component extends lengthDim/2 from its center, so start 5 units behind that to avoid hitting other ship parts.
                const rayOrigin = new THREE.Vector3().copy(pos).add(exhaustDir.clone().multiplyScalar(lengthDim/2 + 5));
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
                    // Place the nozzle such that its "front" (where it attaches) is at the hit point
                    // and its "back" (exhaust) is facing outwards.
                    // The nozzle's local origin is at its center. So offset by half its length along its local Y-axis.
                    const placePos = hit.point.clone().add(exhaustDir.clone().multiplyScalar(nozzleLen / 2)); // Offset along the normal
                    nozzle.position.copy(placePos);
                } else {
                    // Fallback: If no intersection, place it at the component's position, but slightly offset in the exhaust direction.
                    // Offset by half length + half nozzle length to ensure it sits ON the surface, not half-buried.
                    const offset = (lengthDim * 0.5) + (nozzleLen * 0.5);
                    nozzle.position.copy(pos).add(exhaustDir.clone().multiplyScalar(offset));
                    console.warn(`GreebleGenerator: No hull surface found for thruster at ${pos.x},${pos.y},${pos.z}. Placing at calculated rear offset.`);
                }

                // Register thruster position to prevent other greebles from intersecting it
                this.occupiedZones.push({ pos: nozzle.position.clone(), radius: rearRadius * 1.2 });
                
                if (shapeType !== 2) {
                    const glowGeo = new THREE.SphereGeometry(rearRadius * 0.25, 16, 16);
                    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
                    const glow = new THREE.Mesh(glowGeo, glowMat);
                    glow.position.y = nozzleLen * 0.2;
                    glow.name = "engine_glow";
                    
                    // Add PointLight for engine thrust
                    const engineLight = new THREE.PointLight(0x00ffff, 2.0, 15);
                    glow.add(engineLight);
                    
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
                
                if (radialAxis === 'y') {
                    const radius = comp.scale.x * 0.8;
                    const angle = random() * Math.PI * 2;
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius;
                    this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(x, pos.y + 5, z), new THREE.Vector3(0, -1, 0), barrel, true, scale.x * 0.5, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, new THREE.Vector3(x, 0, z).normalize());
                } else {
                    const offsetDist = scale.y + 5;
                    this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(pos.x, pos.y + offsetDist, pos.z), new THREE.Vector3(0, -1, 0), barrel, true, scale.x * 0.5, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'forward');
                }
            }

            // 7. Solar Panels (Wings)
            if (usage.includes('wing') && random() > 0.6) {
                const panel = this.createSolarPanel();
                
                // Calculate tip position to place panels at the ends
                const span = comp.dims.span || 1;
                const rootChord = comp.dims.rootChord || 1;
                const sweep = comp.dims.sweep || 0;
                const tipChord = comp.dims.tipChord || 0;
                
                // Target the top surface near the tip
                const localTip = new THREE.Vector3(span * 0.85, 0, rootChord / 2 - sweep - tipChord / 2);
                const compLocalRot = new THREE.Euler().setFromVector3(rot);
                const worldTip = localTip.applyEuler(compLocalRot).add(pos);
                const up = new THREE.Vector3(0, 1, 0).applyEuler(compLocalRot);

                this.placeOnSurface(hullMesh, greebleGroup, worldTip.add(up.multiplyScalar(2)), up.negate(), panel, true, 0.0, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount, null, 'forward');
            }

            // 8. Landing Gear (Freighters/Belly)
            if (hullType === 'FREIGHTER' && pos.y < 0 && random() > 0.8) {
                const gear = this.createLandingGear();
                this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(pos.x, pos.y - 2, pos.z), new THREE.Vector3(0, 1, 0), gear, true, 0, isCentral, effectiveSymmetry, radialAxis, effectiveRadialCount);
            }
        });

        return greebleGroup;
    }

    generateDecals(hullMesh, components, glyphGenerator, shipName, corporation, seed, livery) {
        const decalGroup = new THREE.Group();
        decalGroup.name = "decals";
        const random = mulberry32(seed);

        // Helper to extract usage safely
        const getUsage = (comp) => (comp.stats && (comp.stats.usage || comp.stats.name)) ? (comp.stats.usage || comp.stats.name).toLowerCase() : (comp.type || '');

        const getContrastColor = (baseColorHex) => {
            if (baseColorHex === undefined) return new THREE.Color(0xffffff);
            const color = new THREE.Color(baseColorHex);
            const hsl = { h: 0, s: 0, l: 0 };
            color.getHSL(hsl);
            return hsl.l > 0.5 ? new THREE.Color(0x111111) : new THREE.Color(0xffffff);
        };

        const placeDecal = (texture, width, height, origin, direction, checkSymmetry = true) => {
            this.raycaster.set(origin, direction);
            let intersects = [];
            if (hullMesh.isGroup) {
                intersects = this.raycaster.intersectObjects(hullMesh.children, true);
            } else {
                intersects = this.raycaster.intersectObject(hullMesh);
            }

            if (intersects.length > 0) {
                const hit = intersects[0];
                const pos = hit.point;
                
                // --- Occupancy Check for Decals ---
                // Check if we are placing on top of a greeble
                const radius = Math.max(width, height) * 0.6;
                for (const zone of this.occupiedZones) {
                    if (pos.distanceTo(zone.pos) < (radius + zone.radius)) {
                        return; // Don't place decal on greeble
                    }
                }
                // ----------------------------------

                const n = hit.face.normal.clone();
                n.transformDirection(hit.object.matrixWorld).normalize();
                
                // Create orientation: Z axis points along the normal (outwards)
                const dummy = new THREE.Object3D();
                dummy.position.copy(pos);
                dummy.lookAt(pos.clone().add(n));
                
                const size = new THREE.Vector3(width, height, 2.0); // Depth to capture curvature
                const decalGeo = new DecalGeometry(hit.object, pos, dummy.rotation, size);
                
                const mat = this.decalMat.clone();
                mat.map = texture;
                mat.color = new THREE.Color(0xffffff);
                // mat.polygonOffset = true; // Already set in base material
                mat.polygonOffsetFactor = -2; // Reduced offset to look more painted on
                
                const mesh = new THREE.Mesh(decalGeo, mat);
                decalGroup.add(mesh);
                
                // Register occupied zone for decal
                this.occupiedZones.push({ pos: pos.clone(), radius: radius });

                if (checkSymmetry && components.symmetryType === 'REFLECTIVE' && Math.abs(pos.x) > 0.5) {
                    const symOrigin = new THREE.Vector3(-origin.x, origin.y, origin.z);
                    const symDir = new THREE.Vector3(-direction.x, direction.y, direction.z);
                    placeDecal(texture, width, height, symOrigin, symDir, false);
                }
            }
        };

        // 1. Corporation Logo
        if (corporation) {
            const primaryColor = getContrastColor(livery ? livery.color1 : undefined);
            const secondaryColor = new THREE.Color(livery && livery.color2 !== undefined ? livery.color2 : 0xffaa00);
            
            const logoTex = glyphGenerator.generateLogo(seed, corporation.name, primaryColor, secondaryColor);
            if (logoTex) {
                const fuselage = components.find(c => getUsage(c).includes('fuselage') && c.scale.x > 3);
                if (fuselage) {
                    const pos = fuselage.position.clone();
                    const sideDir = new THREE.Vector3(1, 0, 0).applyEuler(fuselage.rotation);
                    const rayOrigin = pos.clone().add(sideDir.multiplyScalar(10));
                    placeDecal(logoTex, 3, 3, rayOrigin, sideDir.negate());
                }
            }
        }

        // 2. Ship Name / ID
        if (shipName) {
            const textColor = getContrastColor(livery ? livery.color1 : undefined);

            const textTex = glyphGenerator.generateTextDecal(shipName, textColor);
            if (textTex) {
                // Find largest component (likely the main hull)
                let targetComp = components[0];
                let maxVol = 0;
                components.forEach(c => {
                    const s = c.scale;
                    const vol = s.x * s.y * s.z; // Approximate volume factor
                    const u = getUsage(c);
                    if (vol > maxVol && (u.includes('fuselage') || u.includes('hull'))) {
                        maxVol = vol;
                        targetComp = c;
                    }
                });
                
                if (targetComp) {
                    // Try to place on the flank (side)
                    const sideDir = new THREE.Vector3(1, 0, 0).applyEuler(targetComp.rotation);
                    const rayOrigin = targetComp.position.clone().add(sideDir.multiplyScalar(10));
                    placeDecal(textTex, 4, 1, rayOrigin, new THREE.Vector3(-1, 0, 0));
                }
            }
        }
        return decalGroup;
    }
}
