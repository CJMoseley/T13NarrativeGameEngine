import * as THREE from 'three';
import { mulberry32 } from './ShipUtils.js';

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
        this.solarMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.2, metalness: 1.0, emissive: 0x111111, emissiveIntensity: 0.1 });

        // Geometries
        this.rivetGeo = new THREE.SphereGeometry(0.1, 4, 4);
        this.ventGeo = new THREE.BoxGeometry(0.8, 0.1, 0.4);
        this.panelGeo = new THREE.BoxGeometry(0.8, 0.05, 0.8);
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
        const panelGeo = new THREE.BoxGeometry(0.6, 0.05, 1.2);
        const panel = new THREE.Mesh(panelGeo, this.solarMat);
        panel.position.set(0, 0.5, 0);
        // Tilt to catch "sun"
        panel.rotation.x = Math.PI / 6;
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
            const pos = hit.point;
            const normal = hit.face.normal.clone();
            normal.transformDirection(hit.object.matrixWorld).normalize();

            if (constrainNormalAxis === 'x') {
                normal.x = 0;
                normal.normalize();
            }

            const instance = objectToPlace.clone();
            
            if (scaleToFit && hit.object.geometry && hit.object.geometry.attributes.position) {
                // Calculate face dimensions to prevent overhang
                const face = hit.face;
                const posAttr = hit.object.geometry.attributes.position;
                const va = new THREE.Vector3().fromBufferAttribute(posAttr, face.a);
                const vb = new THREE.Vector3().fromBufferAttribute(posAttr, face.b);
                const vc = new THREE.Vector3().fromBufferAttribute(posAttr, face.c);
                
                // Transform to world to match scale of object
                va.applyMatrix4(hit.object.matrixWorld);
                vb.applyMatrix4(hit.object.matrixWorld);
                vc.applyMatrix4(hit.object.matrixWorld);

                // Get max edge length of the face
                const ab = va.distanceTo(vb);
                const bc = vb.distanceTo(vc);
                const ca = vc.distanceTo(va);
                const maxEdge = Math.max(ab, bc, ca);
                
                // Get size of object to place
                const bbox = new THREE.Box3().setFromObject(instance);
                const size = new THREE.Vector3();
                bbox.getSize(size);
                const maxObjDim = Math.max(size.x, size.y, size.z);
                
                // Scale down if object is larger than 80% of the face
                if (maxObjDim > maxEdge * 0.8) {
                    const scaleFactor = (maxEdge * 0.8) / maxObjDim;
                    instance.scale.multiplyScalar(scaleFactor);
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

    generate(hullMesh, components, styleConfig, symmetryType, radialAxis, radialCount = 3, hullType = 'SPINE', seed = 0) {
        const random = mulberry32(seed >>> 0);
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
        const globalOrientToCenter = (symmetryType === 'RADIAL' || symmetryType === 'REFLECTIVE');

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
                    this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(0, pos.y + offsetDist, z), new THREE.Vector3(0, -1, 0), new THREE.Mesh(currentRivetGeo, this.rivetMat), true, 0, isCentral, symmetryType, radialAxis, radialCount, null, 'forward');
                    // Raycast from positive X and positive Y towards the component
                    this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(pos.x + offsetDist, pos.y, z), new THREE.Vector3(-1, 0, 0), new THREE.Mesh(currentRivetGeo, this.rivetMat), true, 0, isCentral, symmetryType, radialAxis, radialCount, null, 'forward');
                }
                // Dispose of the geometry after use
                currentRivetGeo.dispose();

                if (usage.includes('fuselage')) {
                    const antenna = this.createAntennaArray();
                    antenna.scale.setScalar(rivetScale);
                    this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(0, pos.y + offsetDist, pos.z - scale.z * 0.4), new THREE.Vector3(0, -1, 0), antenna, true, 0, isCentral, symmetryType, radialAxis, radialCount, null, 'forward');
                }

                // Pipes and Ladders on industrial ships
                if (styleConfig.method === 'INDUSTRIAL' && random() > 0.6) {
                    const pipe = this.createPipe(scale.z * 0.8);
                    this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(pos.x + offsetDist, pos.y, pos.z), new THREE.Vector3(-1, 0, 0), pipe, true, 0.1, isCentral, symmetryType, radialAxis, radialCount, null, 'forward');
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
                ventGroup.rotation.x = -Math.PI / 2;

                const offsetDist = Math.max(scale.x, scale.y) + 2;
                this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(pos.x, pos.y + offsetDist, pos.z), new THREE.Vector3(0, -1, 0), container, true, 0, isCentral, symmetryType, radialAxis, radialCount, null, 'forward', true);
                // Removed side placement to avoid fins

                // Engine Intakes
                const intake = new THREE.Mesh(new THREE.BoxGeometry(ventWidth, ventHeight, ventWidth), this.ventMat);
                // Place at front of engine
                const forward = new THREE.Vector3(0, 0, 1).applyEuler(rot);
                this.placeOnSurface(hullMesh, greebleGroup, pos.clone().add(forward.multiplyScalar(scale.y/2 + 2)), forward.negate(), intake, true, 0, isCentral, symmetryType, radialAxis, radialCount, null, 'forward');
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
                    refWidth = (d.radiusTop !== undefined ? d.radiusTop : (d.radius || 0.5)) * 2 * s.x;
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

                if (!isPrimaryCockpit) {
                    // Observation Windows / Skylights (Flat)
                    domeGeo = new THREE.BoxGeometry(1, 1, 1);
                    canopyHeight = 0.15; 
                    canopyWidth *= 0.8;
                    canopyLength *= 0.8;
                } else if (['dodecahedron', 'icosahedron', 'octahedron', 'tetrahedron'].includes(comp.type)) {
                    domeGeo = new THREE.DodecahedronGeometry(1, 0);
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

                // Add Window Frame (Struts)
                const frameMat = this.ventMat; // Use dark metal for frame
                // Create a slightly larger version of the dome geometry for the frame
                const frameGeo = new THREE.WireframeGeometry(domeGeo);
                const frame = new THREE.LineSegments(frameGeo, frameMat);
                // Scale it up just a tiny bit to sit on top of the glass
                frame.scale.setScalar(1.02);
                dome.add(frame);
                
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
                placed = this.placeOnSurface(hullMesh, greebleGroup, pos.clone().add(new THREE.Vector3(0, 20, 0)), new THREE.Vector3(0, -1, 0), dome, true, offset - 0.2, isCentral, symmetryType, radialAxis, radialCount, null, 'forward', true);
                
                // 2. Try Front (World Z) - Good for forward facing cockpits
                if (!placed) {
                    placed = this.placeOnSurface(hullMesh, greebleGroup, pos.clone().add(new THREE.Vector3(0, 0, 20)), new THREE.Vector3(0, 0, -1), dome, true, offset - 0.2, isCentral, symmetryType, radialAxis, radialCount, null, 'up', true);
                }

                // 3. Fallback: Component Local Up
                if (!placed) {
                    const compQuaternion = new THREE.Quaternion().setFromEuler(rot);
                    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(compQuaternion);
                    // Cast from far away
                    const rayOrigin = pos.clone().add(up.clone().multiplyScalar(20));
                    const rayDir = up.clone().negate();
                    this.placeOnSurface(hullMesh, greebleGroup, rayOrigin, rayDir, dome, true, offset - 0.2, isCentral, symmetryType, radialAxis, radialCount, null, 'forward', true);
                }
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
                const rayOrigin = worldTip.clone().add(dir.multiplyScalar(3.0));
                const rayDir = dir.clone().negate();

                // Use placeOnSurface to handle placement and symmetry
                this.placeOnSurface(hullMesh, greebleGroup, rayOrigin, rayDir, light, true, 0.0, isCentral, symmetryType, radialAxis, radialCount, null, 'forward');
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

                // Determine direction "out" - should be based on component's rotation and type
                const compQuaternion = new THREE.Quaternion().setFromEuler(rot);
                let exhaustDir;

                // Convention: For primitives with a clear length axis (like cylinders), that axis is Y.
                // We define the exhaust to come from the -Y end of the local geometry.
                if (['cylinder', 'cone', 'truncatedCone', 'capsule', 'prism'].includes(comp.type)) {
                    exhaustDir = new THREE.Vector3(0, -1, 0).applyQuaternion(compQuaternion);
                } else {
                    // For other shapes like boxes, we assume the length is along Z.
                    exhaustDir = new THREE.Vector3(0, 0, -1).applyQuaternion(compQuaternion);
                }

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
                    // Place the nozzle such that its "front" (where it attaches) is at the hit point
                    // and its "back" (exhaust) is facing outwards.
                    // The nozzle's local origin is at its center. So offset by half its length along its local Y-axis.
                    const placePos = hit.point.clone().add(exhaustDir.clone().multiplyScalar(nozzleLen / 2)); // Offset along the normal
                    nozzle.position.copy(placePos);
                } else {
                    // Fallback: If no intersection, place it at the component's position, but slightly offset in the exhaust direction.
                    nozzle.position.copy(pos).add(exhaustDir.clone().multiplyScalar(scale.y * 0.5)); // This is still a fallback, but better than floating far away.
                    console.warn(`GreebleGenerator: No hull surface found for thruster at ${pos.x},${pos.y},${pos.z}. Placing at component origin.`);
                }
                
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
                    this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(x, pos.y + 5, z), new THREE.Vector3(0, -1, 0), barrel, true, scale.x * 0.5, isCentral, symmetryType, radialAxis, radialCount, null, new THREE.Vector3(x, 0, z).normalize());
                } else {
                    const offsetDist = scale.y + 2;
                    this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(pos.x, pos.y + offsetDist, pos.z), new THREE.Vector3(0, -1, 0), barrel, true, scale.x * 0.5, isCentral, symmetryType, radialAxis, radialCount, null, 'forward');
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

                this.placeOnSurface(hullMesh, greebleGroup, worldTip.add(up.multiplyScalar(2)), up.negate(), panel, true, 0.0, isCentral, symmetryType, radialAxis, radialCount, null, 'forward');
            }

            // 8. Landing Gear (Freighters/Belly)
            if (hullType === 'FREIGHTER' && pos.y < 0 && random() > 0.8) {
                const gear = this.createLandingGear();
                this.placeOnSurface(hullMesh, greebleGroup, new THREE.Vector3(pos.x, pos.y - 2, pos.z), new THREE.Vector3(0, 1, 0), gear, true, 0, isCentral, symmetryType, radialAxis, radialCount);
            }
        });

        return greebleGroup;
    }
}
