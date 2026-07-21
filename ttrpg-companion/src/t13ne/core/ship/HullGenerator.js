import * as THREE from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { PRIMITIVE_TYPES } from './ComponentFactory.js';

// Worker-safe logger fallback
const SafeLogger = {
    message: (msg) => {
        try {
            // Check if we are in a worker and if Logger is available via global scope or similar
            if (typeof Logger !== 'undefined') Logger.message(msg);
            else console.log(`[MSG] ${msg}`);
        } catch (e) { console.log(`[MSG] ${msg}`); }
    },
    warn: (msg) => {
        try {
            if (typeof Logger !== 'undefined') Logger.warn(msg);
            else console.warn(`[WARN] ${msg}`);
        } catch (e) { console.warn(`[WARN] ${msg}`); }
    }
};

export class HullGenerator {
    constructor(physxProvider) {
        this.physxProvider = physxProvider;
        this.componentFactory = null; // Can be injected if needed for convex hull proxies
        this.performanceMode = 'high';
    }

    setPerformanceMode(mode) {
        this.performanceMode = mode;
        SafeLogger.message(`HullGenerator: Performance mode set to ${mode}`);
    }

    generate(components, styleConfig) {
        // 1. Pre-process Symmetry
        const fullComponentList = this.expandSymmetry(components);

        let geometry;

        // SKELETON style does not generate a wrapper hull
        if (styleConfig.method === 'SKELETON') return null;

        if (styleConfig.method === 'ORGANIC') {
            geometry = this.generateSDFHull(fullComponentList, styleConfig.blendStrength, styleConfig.padding);
        } else if (styleConfig.method === 'INDUSTRIAL') {
            geometry = this.generateConvexHull(fullComponentList);
        }

        // 2. Apply Plating (Optional)
        if (styleConfig.plating) {
            geometry = this.applyVoronoiPlating(geometry, styleConfig.platingType);
        }

        return geometry;
    }

    // Async version to prevent UI blocking
    async generateAsync(components, styleConfig) {
        const fullComponentList = this.expandSymmetry(components);
        let geometry;

        if (styleConfig.method === 'SKELETON') return null;

        if (styleConfig.method === 'ORGANIC') {
            geometry = await this.generateSDFHullAsync(fullComponentList, styleConfig.blendStrength, styleConfig.padding);
        } else if (styleConfig.method === 'INDUSTRIAL') {
            // Convex hull is fast enough to run sync, or we can wrap it
            geometry = this.generateConvexHull(fullComponentList);
        }

        return geometry;
    }

    // Pipeline A: The "Melty" Look
    generateSDFHull(components, k = 0.5, padding = 0.1) {
        // Define the Signed Distance Function for the whole ship
        // padding passed from config
        
        const sceneSDF = (x, y, z) => {
            return this.evaluateSceneSDF(x, y, z, components, k, padding);
        };

        // Calculate bounds to determine appropriate resolution
        const worldBounds = new THREE.Box3();
        const tempMesh = new THREE.Mesh();
        const tempBox = new THREE.Box3();
        const boxGeom = new THREE.BoxGeometry(1, 1, 1);

        components.forEach(c => {
            tempMesh.geometry = boxGeom;
            tempMesh.position.copy(c.position);
            tempMesh.quaternion.setFromEuler(c.rotation);
            // c.scale is the full dimension, BoxGeometry is unit size.
            // FIX: For radius-based primitives, c.scale holds the radius, but BoxGeometry needs full diameter (2*r).
            const s = c.scale.clone();
            if (['sphere', 'capsule', 'cylinder', 'cone', 'truncatedCone', 'torus', 'prism', 'dodecahedron', 'icosahedron', 'octahedron', 'tetrahedron', 'compound_eye'].includes(c.sdfType)) {
                // For these, x and z are usually radii. y is height/length (full dim) for cyl/cone/capsule, but radius for sphere/polyhedra.
                s.x *= 2;
                s.z *= 2;
                // Sphere/Polyhedra/Torus(tube) use uniform radius or specific mapping, but generally if it's a radius it needs doubling for the box.
                if (['sphere', 'dodecahedron', 'icosahedron', 'octahedron', 'tetrahedron', 'compound_eye'].includes(c.sdfType)) s.y *= 2;
            }
            tempMesh.scale.copy(s);
            tempMesh.updateMatrixWorld();
            tempBox.setFromObject(tempMesh);
            worldBounds.union(tempBox);
        });
        boxGeom.dispose();
        worldBounds.expandByScalar(padding * 4 + 2.0); // Increased padding to prevent clipping

        const boundsSize = new THREE.Vector3();
        worldBounds.getSize(boundsSize);
        const boundsCentre = new THREE.Vector3();
        worldBounds.getCenter(boundsCentre);

        const maxBoundDim = Math.max(boundsSize.x, boundsSize.y, boundsSize.z);

        // Adaptive Resolution Calculation
        let minFeatureSize = Infinity;
        components.forEach(c => {
            let dims = [c.scale.x, c.scale.y, c.scale.z];
            if (c.sdfType === 'torus') dims = [c.scale.y]; 
            if (c.sdfType === 'wedge') dims = [c.scale.y];
            const minDim = Math.min(...dims);
            if (minDim < minFeatureSize) minFeatureSize = minDim;
        });

        // Clamp minFeatureSize to avoid extreme resolution
        minFeatureSize = Math.max(minFeatureSize, 0.25);

        // Target ~3 voxels per smallest feature
        let targetRes = Math.ceil(maxBoundDim / (minFeatureSize / 3.0));
        
        // Clamp resolution based on performance mode
        let maxRes = 180;
        if (this.performanceMode === 'low') maxRes = 64;
        else if (this.performanceMode === 'medium') maxRes = 100;

        const res = Math.min(Math.max(targetRes, 64), maxRes);

        if (typeof MarchingCubes === 'undefined') {
            SafeLogger.warn("HullGenerator: MarchingCubes not available. Falling back to convex hull.");
            return this.generateConvexHull(components);
        }

        const mc = new MarchingCubes(res, new THREE.MeshStandardMaterial(), true, true, 1000000);
        mc.isolation = 0.0;

        // Manually populate the field
        const field = mc.field;
        for (let k = 0; k < res; k++) {
            for (let j = 0; j < res; j++) {
                for (let i = 0; i < res; i++) {
                    const x = i / (res - 1);
                    const y = j / (res - 1);
                    const z = k / (res - 1);
                    
                    // Map grid coordinate (0..1) to World Coordinate
                    const val = -sceneSDF(
                        worldBounds.min.x + x * boundsSize.x,
                        worldBounds.min.y + y * boundsSize.y,
                        worldBounds.min.z + z * boundsSize.z
                    );
                    // MarchingCubes index mapping: x + y*res + z*res*res
                    field[i + j * res + k * res * res] = val;
                }
            }
        }

        mc.update();

        if (mc.count === 0) {
            return this.generateConvexHull(components);
        }

        const geometry = mc.geometry; // MarchingCubes extends Mesh, geometry is a property

        // Scale to match world bounds
        // Marching Cubes generates within a normalized volume, we map that volume to worldBounds
        // We need to map this to [worldBounds.min, worldBounds.max]
        // The geometry size might be slightly smaller than 2.0 (or 1.0) depending on isosurface, 
        // but we want to map the full marching cubes volume to the world bounds.
        // Standard MarchingCubes usually spans -1 to 1 (size 2) or -0.5 to 0.5 (size 1).
        // Let's assume the volume is size 2 (based on Three.js examples usually).
        // But to be safe, we scale based on the boundsSize directly.
        
        // Actually, simpler: The MC field corresponds to worldBounds.
        // The MC geometry vertices are in the range of the grid coordinates usually normalized.
        // If we assume the MC geometry vertices are in [-1, 1] (which they are in standard Three.js MC),
        // then we scale by boundsSize/2 and translate to center.
        
        // Re-applying the logic but ensuring we start from a known state (0,0,0 center)
        // If the geometry was not centered (e.g. [0, 1]), centering it first fixes that.
        // Now we scale. If the original range was [-1, 1] (size 2), we scale by size/2.
        // If it was [0, 1] (size 1), we scale by size.
        // Let's assume standard [-1, 1] behavior but check size.
        
        let scaleFactor = 0.5;
        // If the geometry is tiny (normalized), scale it up.
        
        // Correct approach:
        // The MarchingCubes algorithm generates vertices. We want to map the grid volume to worldBounds.
        // We don't rely on the geometry bounding box because the hull might be smaller than the bounds.
        // We rely on the fact that MC generates in [-1, 1].
        
        // Reset any previous transforms (just in case)
        // geometry.center(); // This centers the *vertices*, but we want to center the *volume*.
        // If MC generates [-1, 1], the volume center is 0,0,0.
        
        const halfSize = boundsSize.clone().multiplyScalar(0.5);

        // If MC output is [-1, 1], scaling by halfSize makes it [-halfSize, halfSize] which is correct size.
        // Apply a slight over-scale to prevent Z-fighting with internal components
        const zFightBuffer = 1.001; // Reduced from 1.02 to prevent huge inflation
        geometry.scale(halfSize.x * zFightBuffer, halfSize.y * zFightBuffer, halfSize.z * zFightBuffer);
        geometry.translate(boundsCentre.x, boundsCentre.y, boundsCentre.z);
        return geometry;
    }

    // Async version of SDF Hull Generation
    async generateSDFHullAsync(components, k = 0.5, padding = 0.1) {
        const sceneSDF = (x, y, z) => this.evaluateSceneSDF(x, y, z, components, k, padding);

        // Calculate bounds
        const worldBounds = new THREE.Box3();
        const tempMesh = new THREE.Mesh();
        const tempBox = new THREE.Box3();
        const boxGeom = new THREE.BoxGeometry(1, 1, 1);

        components.forEach(c => {
            tempMesh.geometry = boxGeom;
            tempMesh.position.copy(c.position);
            tempMesh.quaternion.setFromEuler(c.rotation);
            const s = c.scale.clone();
            if (['sphere', 'capsule', 'cylinder', 'cone', 'truncatedCone', 'torus', 'prism', 'dodecahedron', 'icosahedron', 'octahedron', 'tetrahedron', 'compound_eye'].includes(c.sdfType)) {
                s.x *= 2; s.z *= 2;
                if (['sphere', 'dodecahedron', 'icosahedron', 'octahedron', 'tetrahedron', 'compound_eye'].includes(c.sdfType)) s.y *= 2;
            }
            tempMesh.scale.copy(s);
            tempMesh.updateMatrixWorld();
            tempBox.setFromObject(tempMesh);
            worldBounds.union(tempBox);
        });
        boxGeom.dispose();
        worldBounds.expandByScalar(padding * 4 + 2.0);

        const boundsSize = new THREE.Vector3();
        worldBounds.getSize(boundsSize);
        const boundsCentre = new THREE.Vector3();
        worldBounds.getCenter(boundsCentre);
        const maxBoundDim = Math.max(boundsSize.x, boundsSize.y, boundsSize.z);

        let minFeatureSize = Infinity;
        components.forEach(c => {
            let dims = [c.scale.x, c.scale.y, c.scale.z];
            if (c.sdfType === 'torus') dims = [c.scale.y]; 
            if (c.sdfType === 'wedge') dims = [c.scale.y];
            const minDim = Math.min(...dims);
            if (minDim < minFeatureSize) minFeatureSize = minDim;
        });
        minFeatureSize = Math.max(minFeatureSize, 0.25);
        let targetRes = Math.ceil(maxBoundDim / (minFeatureSize / 3.0));

        let maxRes = 180;
        if (this.performanceMode === 'low') maxRes = 64;
        else if (this.performanceMode === 'medium') maxRes = 100;

        const res = Math.min(Math.max(targetRes, 64), maxRes);

        if (typeof MarchingCubes === 'undefined') {
            SafeLogger.warn("HullGenerator: MarchingCubes not available. Falling back to convex hull.");
            return this.generateConvexHull(components);
        }

        const mc = new MarchingCubes(res, new THREE.MeshStandardMaterial(), true, true, 1000000);
        mc.isolation = 0.0;

        const field = mc.field;
        
        // Async Loop with Yield
        for (let k = 0; k < res; k++) {
            // Yield every slice to keep UI responsive
            await new Promise(r => setTimeout(r, 0));
            
            for (let j = 0; j < res; j++) {
                for (let i = 0; i < res; i++) {
                    const x = i / (res - 1);
                    const y = j / (res - 1);
                    const z = k / (res - 1);
                    const val = -sceneSDF(
                        worldBounds.min.x + x * boundsSize.x,
                        worldBounds.min.y + y * boundsSize.y,
                        worldBounds.min.z + z * boundsSize.z
                    );
                    field[i + j * res + k * res * res] = val;
                }
            }
        }

        mc.update();
        if (mc.count === 0) return this.generateConvexHull(components);

        const geometry = mc.geometry;
        const halfSize = boundsSize.clone().multiplyScalar(0.5);
        const zFightBuffer = 1.001;
        geometry.scale(halfSize.x * zFightBuffer, halfSize.y * zFightBuffer, halfSize.z * zFightBuffer);
        geometry.translate(boundsCentre.x, boundsCentre.y, boundsCentre.z);
        return geometry;
    }

    // SDF primitive helpers
    sdPolygon(p, vertices) {
        let d = (p.x - vertices[0].x) ** 2 + (p.y - vertices[0].y) ** 2;
        let s = 1.0;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i, i++) {
            const e = vertices[j].clone().sub(vertices[i]);
            const w = p.clone().sub(vertices[i]);
            const b = w.clone().sub(e.clone().multiplyScalar(Math.max(0, Math.min(1, w.dot(e) / e.dot(e)))));
            d = Math.min(d, b.lengthSq());
            const c1 = p.y >= vertices[i].y; const c2 = p.y < vertices[j].y; const c3 = e.x * w.y > e.y * w.x;
            if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
        }
        return s * Math.sqrt(d);
    }

    sdOctahedron(p, s) {
        const pAbs = new THREE.Vector3(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
        const m = pAbs.x + pAbs.y + pAbs.z - s;
        let q;
        if (3.0 * pAbs.x < m) q = pAbs;
        else if (3.0 * pAbs.y < m) q = new THREE.Vector3(pAbs.y, pAbs.x, pAbs.z);
        else if (3.0 * pAbs.z < m) q = new THREE.Vector3(pAbs.z, pAbs.y, pAbs.x);
        else return m * 0.57735027;
        const k = Math.min(0, q.x - q.y) * 0.5;
        q.x -= k; q.y += k;
        const k2 = Math.min(0, q.z - q.y) * 0.5;
        q.z -= k2; q.y += k2;
        return new THREE.Vector3(q.x, q.y - s, q.z).length();
    }

    sdTetrahedron(p, r) {
        const md = Math.max(Math.max(-p.x - p.y - p.z, p.x + p.y - p.z),
                            Math.max(-p.x + p.y + p.z, p.x - p.y + p.z));
        return (md - r) / Math.sqrt(3.0);
    }

    // Helper to evaluate SDF (extracted for reuse in async/sync)
    evaluateSceneSDF(x, y, z, components, k, padding) {
        let d = Infinity;
        const p = new THREE.Vector3(x, y, z);

        for (const c of components) {
            const q = new THREE.Quaternion().setFromEuler(c.rotation);
            q.invert();
            const localP = p.clone().sub(c.position).applyQuaternion(q);
            
            const scale = c.scale.clone();
            if (scale.x < 0) { localP.x = -localP.x; scale.x = Math.abs(scale.x); }
            if (scale.y < 0) { localP.y = -localP.y; scale.y = Math.abs(scale.y); }
            if (scale.z < 0) { localP.z = -localP.z; scale.z = Math.abs(scale.z); }
            
            let localPadding = padding;
            const minDim = Math.min(scale.x, scale.y, scale.z);
            if (minDim < padding * 4.0) localPadding = minDim * 0.25; 

            let dist = 0;
            if (c.sdfType === 'sphere') {
                dist = localP.length() - (scale.x + localPadding);
            } else if (c.sdfType === 'box') {
                const absLocalP = new THREE.Vector3(Math.abs(localP.x), Math.abs(localP.y), Math.abs(localP.z));
                const qVec = absLocalP.sub(scale.clone().multiplyScalar(0.5).addScalar(localPadding));
                dist = qVec.clone().max(new THREE.Vector3(0, 0, 0)).length() +
                    Math.min(Math.max(qVec.x, Math.max(qVec.y, qVec.z)), 0.0);
            } else if (c.sdfType === 'capsule') {
                const h = scale.y; 
                const r = scale.x;
                const py = Math.max(-h/2, Math.min(h/2, localP.y));
                const qVec = new THREE.Vector3(localP.x, localP.y - py, localP.z);
                dist = qVec.length() - (r + localPadding);
            } else if (c.sdfType === 'cylinder') {
                const h = scale.y;
                const r = scale.x;
                const d2 = new THREE.Vector2(new THREE.Vector2(localP.x, localP.z).length() - (r + localPadding), Math.abs(localP.y) - h/2 - localPadding);
                dist = Math.min(Math.max(d2.x, d2.y), 0.0) + d2.max(new THREE.Vector2(0, 0)).length();
            } else if (c.sdfType === 'truncatedCone') {
                const r1 = scale.z; const r2 = scale.x; const h = scale.y;
                const q_len = new THREE.Vector2(localP.x, localP.z).length();
                const q_vec = new THREE.Vector2(q_len, localP.y);
                const ka = new THREE.Vector2(r2, h/2);
                const kb = new THREE.Vector2(r2 - r1, h);
                const ka_sub_q = ka.clone().sub(q_vec);
                const dot_kb = kb.dot(kb);
                const t_clamp = Math.max(0.0, Math.min(1.0, ka_sub_q.dot(kb) / dot_kb));
                const cb = q_vec.clone().sub(ka).add(kb.clone().multiplyScalar(t_clamp));
                const ca_x = q_len - Math.min(q_len, (q_vec.y < 0.0) ? r1 : r2);
                const ca_y = Math.abs(q_vec.y) - h/2;
                const ca = new THREE.Vector2(ca_x, ca_y);
                const s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
                dist = s * Math.sqrt(Math.min(ca.lengthSq(), cb.lengthSq())) - localPadding;
            } else if (c.sdfType === 'torus') {
                const t = new THREE.Vector2(scale.x, scale.y);
                const q2 = new THREE.Vector2(new THREE.Vector2(localP.x, localP.y).length() - t.x, localP.z);
                dist = q2.length() - (t.y + localPadding);
            } else if (c.sdfType === 'cone') {
                const r = scale.x; const h = scale.y;
                const hyp = Math.sqrt(r * r + h * h);
                const vecR = new THREE.Vector2(localP.x, localP.z).length();
                const vecY = localP.y - h / 2;
                const distCone = (vecR * h + vecY * r) / hyp;
                const distY = Math.max(localP.y - h / 2, -h / 2 - localP.y);
                dist = Math.max(distCone, distY) - localPadding;
            } else if (c.sdfType === 'prism') {
                const h = scale.y; const r = scale.x; const n = c.dims.segments || 3;
                const verts = [];
                for (let i = 0; i < n; i++) {
                    const theta = (i / n) * Math.PI * 2;
                    verts.push(new THREE.Vector2(Math.cos(theta) * r, Math.sin(theta) * r));
                }
                const dist2D = this.sdPolygon(new THREE.Vector2(localP.x, localP.z), verts);
                const distY = Math.abs(localP.y) - h/2;
                const dVec = new THREE.Vector2(dist2D, distY);
                dist = Math.min(Math.max(dVec.x, dVec.y), 0.0) + dVec.max(new THREE.Vector2(0, 0)).length() - localPadding;
            } else if (c.sdfType === 'wedge') {
                const span = c.dims.span || c.scale.x;
                const rootChord = c.dims.rootChord || c.scale.z;
                const tipChord = c.dims.tipChord !== undefined ? c.dims.tipChord : rootChord * 0.2;
                const sweep = c.dims.sweep !== undefined ? c.dims.sweep : 0;
                const thickness = scale.y;
                const centered = c.dims.centered !== false;
                let verts = [
                    new THREE.Vector2(0, rootChord/2),
                    new THREE.Vector2(span, rootChord/2 - sweep),
                    new THREE.Vector2(span, rootChord/2 - sweep - tipChord),
                    new THREE.Vector2(0, -rootChord/2)
                ];
                if (centered) {
                    const maxY = rootChord/2;
                    const minY = Math.min(-rootChord/2, rootChord/2 - sweep - tipChord);
                    const centerY = (maxY + minY) / 2;
                    const centerX = span / 2;
                    verts = verts.map(v => new THREE.Vector2(v.x - centerX, v.y - centerY));
                }
                const p2 = new THREE.Vector2(localP.x, localP.z);
                const dist2D = this.sdPolygon(p2, verts);
                const distY = Math.abs(localP.y) - thickness / 2;
                const dVec = new THREE.Vector2(dist2D, distY);
                dist = Math.min(Math.max(dVec.x, dVec.y), 0.0) + dVec.max(new THREE.Vector2(0, 0)).length() - localPadding;
            } else if (c.sdfType === 'ellipsoid') {
                const r = scale.clone().multiplyScalar(0.5);
                const k0 = localP.clone().divide(r).length();
                const k1 = localP.clone().divide(r.clone().multiply(r)).length();
                dist = (k0 * (k0 - 1.0) / k1) - localPadding;
            } else if (c.sdfType === 'octahedron') {
                dist = this.sdOctahedron(localP, scale.x) - localPadding;
            } else if (c.sdfType === 'tetrahedron') {
                dist = this.sdTetrahedron(localP, scale.x) - localPadding;
            } else if (c.sdfType === 'dodecahedron' || c.sdfType === 'icosahedron') {
                dist = localP.length() - (scale.x + localPadding);
            } else if (c.sdfType === 'model') {
                // For models, use a box SDF based on their scale (bounding box approx)
                const absLocalP = new THREE.Vector3(Math.abs(localP.x), Math.abs(localP.y), Math.abs(localP.z));
                const qVec = absLocalP.sub(scale.clone().multiplyScalar(0.5).addScalar(localPadding));
                dist = qVec.clone().max(new THREE.Vector3(0, 0, 0)).length() +
                    Math.min(Math.max(qVec.x, Math.max(qVec.y, qVec.z)), 0.0);
            } else {
                const absLocalP = new THREE.Vector3(Math.abs(localP.x), Math.abs(localP.y), Math.abs(localP.z));
                const qVec = absLocalP.sub(scale.clone().multiplyScalar(0.5).addScalar(localPadding));
                dist = qVec.clone().max(new THREE.Vector3(0, 0, 0)).length() +
                    Math.min(Math.max(qVec.x, Math.max(qVec.y, qVec.z)), 0.0);
            }

            if (c.stats && c.stats.usage && c.stats.usage.includes('carve')) {
                const negativeDist = -dist;
                const h = Math.max(k - Math.abs(d - negativeDist), 0.0) / k;
                d = Math.max(d, negativeDist) + h * h * k * 0.25;
            } else {
                const h = Math.max(k - Math.abs(d - dist), 0.0) / k;
                d = Math.min(d, dist) - h * h * k * 0.25;
            }
        }
        return d;
    }

    // Pipeline B: The "Faceted" Look (PhysX)
    generateConvexHull(components) {
        // Fallback to showing individual components is now the default behavior.
        // Returning null achieves this in the ShipAssembler.
        return null;
    }

    applyVoronoiPlating(baseGeometry, type) {
        return baseGeometry;
    }

    expandSymmetry(components) {
        let expanded = [];
        for (const c of components) {
            expanded.push(c);
            if (c.symmetry === 'REFLECT_X') {
                let mirror = Object.assign({}, c);
                mirror.position = c.position.clone();
                mirror.position.x *= -1;
                // Clone scale to avoid reference issues
                mirror.scale = c.scale.clone();
                mirror.scale.x *= -1; // Mirror scale
                // Rotation mirroring is complex, simplified here
                mirror.rotation = c.rotation.clone();
                mirror.rotation.y *= -1;
                mirror.rotation.z *= -1;
                expanded.push(mirror);
            }
        }
        return expanded;
    }

    applyHullNoise(geometry) {
        if (!geometry || !geometry.attributes) return geometry;
        const posAttribute = geometry.attributes.position;
        const normalAttribute = geometry.attributes.normal;
        if (!posAttribute || !normalAttribute) return geometry;

        const vertex = new THREE.Vector3();
        const normal = new THREE.Vector3();

        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);
            normal.fromBufferAttribute(normalAttribute, i);

            const noise = Math.sin(vertex.x * 2.5) * Math.cos(vertex.y * 2.5) * Math.sin(vertex.z * 2.5);
            
            if (noise > 0.6) {
                vertex.add(normal.multiplyScalar(-0.15 * (noise - 0.5)));
                posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
            }
        }
        geometry.computeVertexNormals();
        return geometry;
    }
}