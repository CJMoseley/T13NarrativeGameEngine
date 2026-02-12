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
                
                let dist = 0;
                // Expanded SDF primitives
                if (c.sdfType === 'sphere') {
                    dist = localP.length() - (scale.x + padding);
                } else if (c.sdfType === 'box') {
                    const absLocalP = new THREE.Vector3(Math.abs(localP.x), Math.abs(localP.y), Math.abs(localP.z));
                    const qVec = absLocalP.sub(scale.clone().multiplyScalar(0.5).addScalar(padding));
                    dist = qVec.clone().max(new THREE.Vector3(0, 0, 0)).length() +
                        Math.min(Math.max(qVec.x, Math.max(qVec.y, qVec.z)), 0.0);
                } else if (c.sdfType === 'capsule') {
                    const h = scale.y; 
                    const r = scale.x; // radius
                    const py = Math.max(-h/2, Math.min(h/2, localP.y));
                    const qVec = new THREE.Vector3(localP.x, localP.y - py, localP.z);
                    dist = qVec.length() - (r + padding);
                } else if (c.sdfType === 'cylinder') {
                    const h = scale.y;
                    const r = scale.x;
                    const d2 = new THREE.Vector2(new THREE.Vector2(localP.x, localP.z).length() - (r + padding), Math.abs(localP.y) - h/2 - padding);
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
                    
                    dist = s * Math.sqrt(Math.min(ca.lengthSq(), cb.lengthSq())) - padding;
                } else if (c.sdfType === 'torus') {
                    const t = new THREE.Vector2(scale.x, scale.y); // major radius, minor radius
                    const q2 = new THREE.Vector2(new THREE.Vector2(localP.x, localP.y).length() - t.x, localP.z);
                    dist = q2.length() - (t.y + padding);
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
                        dist = Math.max(distCone, distY) - padding;
                    } else {
                        const r = scale.x;
                        const h = scale.y;
                        const hyp = Math.sqrt(r * r + h * h);
                        const vecR = new THREE.Vector2(localP.x, localP.z).length();
                        const vecY = localP.y - h / 2;
                        const distCone = (vecR * h + vecY * r) / hyp;
                        const distY = Math.max(localP.y - h / 2, -h / 2 - localP.y);
                        dist = Math.max(distCone, distY) - padding;
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
                    dist = Math.min(Math.max(dVec.x, dVec.y), 0.0) + dVec.max(new THREE.Vector2(0, 0)).length() - padding;
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
                    dist = Math.min(Math.max(dVec.x, dVec.y), 0.0) + dVec.max(new THREE.Vector2(0, 0)).length() - padding;
                } else if (c.sdfType === 'ellipsoid') {
                    const r = scale.clone().multiplyScalar(0.5);
                    const k0 = localP.clone().divide(r).length();
                    const k1 = localP.clone().divide(r.clone().multiply(r)).length();
                    dist = (k0 * (k0 - 1.0) / k1) - padding;
                } else if (c.sdfType === 'octahedron') {
                    dist = sdOctahedron(localP, scale.x) - padding;
                } else if (c.sdfType === 'tetrahedron') {
                    dist = sdTetrahedron(localP, scale.x) - padding;
                } else if (c.sdfType === 'dodecahedron' || c.sdfType === 'icosahedron') {
                    // Approximate with Sphere as they are fairly round
                    dist = localP.length() - (scale.x + padding);
                } else {
                    // Fallback to box
                    const absLocalP = new THREE.Vector3(Math.abs(localP.x), Math.abs(localP.y), Math.abs(localP.z));
                    const qVec = absLocalP.sub(scale.clone().multiplyScalar(0.5).addScalar(padding));
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
        worldBounds.expandByScalar(padding * 2 + 1.0); // Add padding

        const boundsSize = new THREE.Vector3();
        worldBounds.getSize(boundsSize);
        const size = Math.max(boundsSize.x, boundsSize.y, boundsSize.z);

        // Dynamic resolution based on size to ensure detail
        let res = Math.ceil(size * 1.5); 
        res = Math.min(Math.max(res, 32), 128); // Cap at 128 for performance

        const mc = new MarchingCubes(res, new THREE.MeshStandardMaterial(), true, true);
        mc.isolation = 0.0;

        // Manually populate the field
        const field = mc.field;
        for (let k = 0; k < res; k++) {
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

        // Marching Cubes generates geometry in the range [-1, 1]
        // We need to map this to [worldBounds.min, worldBounds.max]
        const halfSize = boundsSize.clone().multiplyScalar(0.5);
        const center = new THREE.Vector3();
        worldBounds.getCenter(center);

        geometry.scale(halfSize.x, halfSize.y, halfSize.z);
        geometry.translate(center.x, center.y, center.z);
        return geometry;
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