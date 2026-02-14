import * as THREE from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { PRIMITIVE_TYPES } from './ComponentFactory.js';

export class HullGenerator {
    constructor(physxProvider) {
        this.physxProvider = physxProvider;
        this.componentFactory = null; // Can be injected if needed for convex hull proxies
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
        
        // Helper for 2D polygon SDF (for Wedge)
        const sdPolygon = (p, vertices) => {
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
        };

        // Helper for Octahedron SDF (Exact)
        const sdOctahedron = (p, s) => {
            p = new THREE.Vector3(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
            const m = p.x + p.y + p.z - s;
            let q;
            if (3.0 * p.x < m) q = p;
            else if (3.0 * p.y < m) q = new THREE.Vector3(p.y, p.x, p.z);
            else if (3.0 * p.z < m) q = new THREE.Vector3(p.z, p.y, p.x);
            else return m * 0.57735027;
            const k = Math.min(0, q.x - q.y) * 0.5;
            q.x -= k; q.y += k;
            const k2 = Math.min(0, q.z - q.y) * 0.5;
            q.z -= k2; q.y += k2;
            return new THREE.Vector3(q.x, q.y - s, q.z).length();
        };

        // Helper for Tetrahedron SDF
        const sdTetrahedron = (p, r) => {
            const md = Math.max(Math.max(-p.x - p.y - p.z, p.x + p.y - p.z),
                                Math.max(-p.x + p.y + p.z, p.x - p.y + p.z));
            return (md - r) / Math.sqrt(3.0);
        };

        const sceneSDF = (x, y, z) => {
            let d = Infinity;
            const p = new THREE.Vector3(x, y, z);

            for (const c of components) {
                // Transform point into component local space
                const q = new THREE.Quaternion().setFromEuler(c.rotation);
                q.invert();
                const localP = p.clone().sub(c.position).applyQuaternion(q);
                
                const scale = c.scale.clone();
                if (scale.x < 0) { localP.x = -localP.x; scale.x = Math.abs(scale.x); }
                if (scale.y < 0) { localP.y = -localP.y; scale.y = Math.abs(scale.y); }
                if (scale.z < 0) { localP.z = -localP.z; scale.z = Math.abs(scale.z); }
                
                // Dynamic padding for thin components to prevent "puffiness"
                // If a component is very thin (like a wing feather), reduce padding to preserve detail
                let localPadding = padding;
                const minDim = Math.min(scale.x, scale.y, scale.z);
                if (minDim < padding * 4.0) {
                    localPadding = minDim * 0.25; 
                }

                let dist = 0;
                // Expanded SDF primitives
                if (c.sdfType === 'sphere') {
                    dist = localP.length() - (scale.x + localPadding);
                } else if (c.sdfType === 'box') {
                    const absLocalP = new THREE.Vector3(Math.abs(localP.x), Math.abs(localP.y), Math.abs(localP.z));
                    const qVec = absLocalP.sub(scale.clone().multiplyScalar(0.5).addScalar(localPadding));
                    dist = qVec.clone().max(new THREE.Vector3(0, 0, 0)).length() +
                        Math.min(Math.max(qVec.x, Math.max(qVec.y, qVec.z)), 0.0);
                } else if (c.sdfType === 'capsule') {
                    const h = scale.y; 
                    const r = scale.x; // radius
                    const py = Math.max(-h/2, Math.min(h/2, localP.y));
                    const qVec = new THREE.Vector3(localP.x, localP.y - py, localP.z);
                    dist = qVec.length() - (r + localPadding);
                } else if (c.sdfType === 'cylinder') {
                    const h = scale.y;
                    const r = scale.x;
                    const d2 = new THREE.Vector2(new THREE.Vector2(localP.x, localP.z).length() - (r + localPadding), Math.abs(localP.y) - h/2 - localPadding);
                    dist = Math.min(Math.max(d2.x, d2.y), 0.0) + d2.max(new THREE.Vector2(0, 0)).length();
                } else if (c.sdfType === 'truncatedCone') {
                    const r1 = scale.z; // radiusBottom
                    const r2 = scale.x; // radiusTop
                    const h = scale.y;  // Height
                    
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
                    const t = new THREE.Vector2(scale.x, scale.y); // major radius, minor radius
                    const q2 = new THREE.Vector2(new THREE.Vector2(localP.x, localP.y).length() - t.x, localP.z);
                    dist = q2.length() - (t.y + localPadding);
                } else if (c.sdfType === 'cone') {
                    // Check for pyramid (low segments)
                    if (c.dims && c.dims.radialSegments && c.dims.radialSegments <= 4) {
                        // Pyramid SDF (Square base approximation using Octahedron logic or similar)
                        // For simplicity, use Octahedron logic but scaled
                        // Or simple pyramid:
                        const h = scale.y;
                        const r = scale.x; // Base width approx
                        // Simple pyramid approximation: max(abs(x), abs(z))*h/r + y
                        // This is rough. Let's stick to Cone for now but maybe sharpen it?
                        // Actually, let's just use the Cone SDF but with a box-fold for 4 sides?
                        // For now, standard cone is safer to avoid artifacts, but we can reduce padding to make it sharper.
                        const hyp = Math.sqrt(r * r + h * h);
                        const vecR = new THREE.Vector2(localP.x, localP.z).length();
                        const vecY = localP.y - h / 2;
                        const distCone = (vecR * h + vecY * r) / hyp;
                        const distY = Math.max(localP.y - h / 2, -h / 2 - localP.y);
                        dist = Math.max(distCone, distY) - localPadding;
                    } else {
                        const r = scale.x;
                        const h = scale.y;
                        const hyp = Math.sqrt(r * r + h * h);
                        const vecR = new THREE.Vector2(localP.x, localP.z).length();
                        const vecY = localP.y - h / 2;
                        const distCone = (vecR * h + vecY * r) / hyp;
                        const distY = Math.max(localP.y - h / 2, -h / 2 - localP.y);
                        dist = Math.max(distCone, distY) - localPadding;
                    }
                } else if (c.sdfType === 'prism') {
                    // Correct SDF for n-sided prism
                    const h = scale.y;
                    const r = scale.x;
                    const n = c.dims.segments || 3;
                    // Generate vertices for the polygon
                    const verts = [];
                    for (let i = 0; i < n; i++) {
                        const theta = (i / n) * Math.PI * 2;
                        verts.push(new THREE.Vector2(Math.cos(theta) * r, Math.sin(theta) * r));
                    }
                    const dist2D = sdPolygon(new THREE.Vector2(localP.x, localP.z), verts);
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

                    // Vertices in XZ plane relative to component origin (Root Center)
                    // Matches ComponentFactory shape definition:
                    // Root Front: (0, rootChord/2)
                    // Tip Front: (span, rootChord/2 - sweep)
                    // Tip Rear: (span, rootChord/2 - sweep - tipChord)
                    // Root Rear: (0, -rootChord/2)
                    
                    let verts = [
                        new THREE.Vector2(0, rootChord/2),
                        new THREE.Vector2(span, rootChord/2 - sweep),
                        new THREE.Vector2(span, rootChord/2 - sweep - tipChord),
                        new THREE.Vector2(0, -rootChord/2)
                    ];

                    // If centered (default), shift vertices to match geometry.center()
                    if (centered) {
                        // Calculate bounding box center of the shape
                        const maxY = rootChord/2;
                        const minY = Math.min(-rootChord/2, rootChord/2 - sweep - tipChord);
                        const centerY = (maxY + minY) / 2;
                        const centerX = span / 2;
                        
                        verts = verts.map(v => new THREE.Vector2(v.x - centerX, v.y - centerY));
                    }

                    const p2 = new THREE.Vector2(localP.x, localP.z);
                    // Handle symmetry flip if scale.x is negative (HullGenerator flips localP.x for us)
                    const dist2D = sdPolygon(p2, verts);
                    const distY = Math.abs(localP.y) - thickness / 2;
                    const dVec = new THREE.Vector2(dist2D, distY);
                    dist = Math.min(Math.max(dVec.x, dVec.y), 0.0) + dVec.max(new THREE.Vector2(0, 0)).length() - localPadding;
                } else if (c.sdfType === 'ellipsoid') {
                    const r = scale.clone().multiplyScalar(0.5);
                    const k0 = localP.clone().divide(r).length();
                    const k1 = localP.clone().divide(r.clone().multiply(r)).length();
                    dist = (k0 * (k0 - 1.0) / k1) - localPadding;
                } else if (c.sdfType === 'octahedron') {
                    dist = sdOctahedron(localP, scale.x) - localPadding;
                } else if (c.sdfType === 'tetrahedron') {
                    dist = sdTetrahedron(localP, scale.x) - localPadding;
                } else if (c.sdfType === 'dodecahedron' || c.sdfType === 'icosahedron') {
                    // Approximate with Sphere as they are fairly round
                    dist = localP.length() - (scale.x + localPadding);
                } else {
                    // Fallback to box
                    const absLocalP = new THREE.Vector3(Math.abs(localP.x), Math.abs(localP.y), Math.abs(localP.z));
                    const qVec = absLocalP.sub(scale.clone().multiplyScalar(0.5).addScalar(localPadding));
                    dist = qVec.clone().max(new THREE.Vector3(0, 0, 0)).length() +
                        Math.min(Math.max(qVec.x, Math.max(qVec.y, qVec.z)), 0.0);
                }

                // Check for carving (Subtraction)
                if (c.stats && c.stats.usage && c.stats.usage.includes('carve')) {
                    // Polynomial Smooth Max (Subtraction)
                    const negativeDist = -dist;
                    const h = Math.max(k - Math.abs(d - negativeDist), 0.0) / k;
                    d = Math.max(d, negativeDist) + h * h * k * 0.25;
                } else {
                    // Polynomial Smooth Min (Union)
                    const h = Math.max(k - Math.abs(d - dist), 0.0) / k;
                    d = Math.min(d, dist) - h * h * k * 0.25;
                }
            }
            return d;
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
        
        // Clamp resolution (64 to 180)
        const res = Math.min(Math.max(targetRes, 64), 180);

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
        // ... (Reuse SDF definitions from generateSDFHull - duplicated for scope access)
        // Ideally, refactor SDF logic to a shared method, but for now we duplicate the setup
        // to ensure the async method is self-contained and safe.
        
        // Helper for 2D polygon SDF (for Wedge)
        const sdPolygon = (p, vertices) => {
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
        };

        // ... (Include other SDF helpers: sdOctahedron, sdTetrahedron) ...
        // For brevity, assuming they are available or copied. 
        // To avoid massive code duplication in this diff, I will assume `sceneSDF` logic 
        // is extracted or I'll use `this.evaluateSceneSDF(x,y,z, components, k, padding)` pattern.
        
        // Let's assume we refactor the SDF evaluation to a method:
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
        const res = Math.min(Math.max(targetRes, 64), 180);

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

    // Helper to evaluate SDF (extracted for reuse in async/sync)
    evaluateSceneSDF(x, y, z, components, k, padding) {
        // ... (Copy the body of sceneSDF from generateSDFHull here) ...
        // For the sake of the diff, I will assume the logic is duplicated or moved.
        // Since I cannot modify the original generateSDFHull in this diff easily without replacing the whole file,
        // I will rely on the fact that I'm adding a new method. 
        // In a real refactor, I would extract this. 
        // For this patch, I will duplicate the logic inside generateSDFHullAsync above or assume it calls this.
        // To make this valid code, I'll paste the logic here.
        
        // Helper for 2D polygon SDF (for Wedge)
        const sdPolygon = (p, vertices) => {
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
        };

        const sdOctahedron = (p, s) => {
            p = new THREE.Vector3(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
            const m = p.x + p.y + p.z - s;
            let q;
            if (3.0 * p.x < m) q = p;
            else if (3.0 * p.y < m) q = new THREE.Vector3(p.y, p.x, p.z);
            else if (3.0 * p.z < m) q = new THREE.Vector3(p.z, p.y, p.x);
            else return m * 0.57735027;
            const k = Math.min(0, q.x - q.y) * 0.5;
            q.x -= k; q.y += k;
            const k2 = Math.min(0, q.z - q.y) * 0.5;
            q.z -= k2; q.y += k2;
            return new THREE.Vector3(q.x, q.y - s, q.z).length();
        };

        const sdTetrahedron = (p, r) => {
            const md = Math.max(Math.max(-p.x - p.y - p.z, p.x + p.y - p.z),
                                Math.max(-p.x + p.y + p.z, p.x - p.y + p.z));
            return (md - r) / Math.sqrt(3.0);
        };

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
                const dist2D = sdPolygon(new THREE.Vector2(localP.x, localP.z), verts);
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
                const dist2D = sdPolygon(p2, verts);
                const distY = Math.abs(localP.y) - thickness / 2;
                const dVec = new THREE.Vector2(dist2D, distY);
                dist = Math.min(Math.max(dVec.x, dVec.y), 0.0) + dVec.max(new THREE.Vector2(0, 0)).length() - localPadding;
            } else if (c.sdfType === 'ellipsoid') {
                const r = scale.clone().multiplyScalar(0.5);
                const k0 = localP.clone().divide(r).length();
                const k1 = localP.clone().divide(r.clone().multiply(r)).length();
                dist = (k0 * (k0 - 1.0) / k1) - localPadding;
            } else if (c.sdfType === 'octahedron') {
                dist = sdOctahedron(localP, scale.x) - localPadding;
            } else if (c.sdfType === 'tetrahedron') {
                dist = sdTetrahedron(localP, scale.x) - localPadding;
            } else if (c.sdfType === 'dodecahedron' || c.sdfType === 'icosahedron') {
                dist = localP.length() - (scale.x + localPadding);
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
        const posAttribute = geometry.attributes.position;
        const normalAttribute = geometry.attributes.normal;
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