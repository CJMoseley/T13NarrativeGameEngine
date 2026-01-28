import * as THREE from 'three';
import Logger from '@/src/t13ne/core/Logger.js';
import { ProceduralComponentGenerator } from '@/js/procgen/ships/components/ProceduralComponentGenerator.js';

export const PRIMITIVE_TYPES = {
    BOX: 'box',
    CAPSULE: 'capsule',
    CONE: 'cone',
    CYLINDER: 'cylinder',
    ELLIPSOID: 'ellipsoid',
    SPHERE: 'sphere',
    TORUS: 'torus',
    WEDGE: 'wedge',
    PRISM: 'prism',
    DODECAHEDRON: 'dodecahedron',
    ICOSAHEDRON: 'icosahedron',
    OCTAHEDRON: 'octahedron',
    TETRAHEDRON: 'tetrahedron'
};

export class ComponentFactory {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        // Standard material for the skeleton (bones of the ship)
        this.material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            wireframe: false,
            flatShading: true // Better for industrial looks
        });
        this.geometryCache = new Map();
        this.generator = new ProceduralComponentGenerator();
    }

    /**
     * Generates a mesh based on the proxy type and dimensions.
     * @param {string} type - One of PRIMITIVE_TYPES
     * @param {Object} dims - Dimensions {x, y, z, radius, etc}
     * @returns {THREE.Mesh}
     */
    createProxy(type, dims = {}) {
        const cacheKey = `${type}_${JSON.stringify(dims)}`;
        if (this.geometryCache.has(cacheKey)) {
            const cachedGeometry = this.geometryCache.get(cacheKey);
            const mesh = new THREE.Mesh(cachedGeometry.clone(), this.material);
            mesh.userData = { isComponent: true, primitiveType: type, originalDims: dims };
            return mesh;
        }

        let geometry;

        switch (type) {
            case PRIMITIVE_TYPES.BOX:
                geometry = new THREE.BoxGeometry(
                    dims.width || 1,
                    dims.height || 1,
                    dims.depth || 1
                );
                break;

            case PRIMITIVE_TYPES.CAPSULE:
                const rad = dims.radius || 0.5;
                const len = dims.length || 1;
                geometry = new THREE.CapsuleGeometry(rad, len, 4, 16);
                break;

            case PRIMITIVE_TYPES.CONE:
                geometry = new THREE.ConeGeometry(
                    dims.radius || 0.5,
                    dims.height || 1,
                    16
                );
                break;

            case PRIMITIVE_TYPES.CYLINDER:
                geometry = new THREE.CylinderGeometry(dims.radiusTop || 0.5, dims.radiusBottom || 0.5, dims.height || 1, 16);
                break;

            case PRIMITIVE_TYPES.PRISM:
                geometry = new THREE.CylinderGeometry(dims.radius || 0.5, dims.radius || 0.5, dims.height || 1, dims.segments || 3);
                break;

            case PRIMITIVE_TYPES.ELLIPSOID:
                geometry = new THREE.SphereGeometry(1, 16, 16);
                geometry.scale(
                    dims.width || 1,
                    dims.height || 0.5,
                    dims.length || 1
                );
                break;

            case PRIMITIVE_TYPES.SPHERE:
                geometry = new THREE.SphereGeometry(dims.radius || 1, 16, 16);
                break;

            case PRIMITIVE_TYPES.TORUS:
                geometry = new THREE.TorusGeometry(
                    dims.radius || 1,
                    dims.tube || 0.2,
                    8,
                    24
                );
                break;

            case PRIMITIVE_TYPES.WEDGE:
                const shape = new THREE.Shape();
                const w = dims.span || dims.width || 1;
                const l = dims.rootChord || dims.length || 1;
                const tipWidth = dims.tipChord !== undefined ? dims.tipChord : l * 0.1;
                const sweep = dims.sweep !== undefined ? dims.sweep : 0;

                // Define shape relative to Root Center (0,0)
                // Y is Chord axis (maps to Z in world), X is Span axis
                // +Y is Front (if +Z is Front), -Y is Rear
                shape.moveTo(0, l / 2); // Root Front
                shape.lineTo(w, l / 2 - sweep); // Tip Front
                shape.lineTo(w, l / 2 - sweep - tipWidth); // Tip Rear
                shape.lineTo(0, -l / 2); // Root Rear
                shape.lineTo(0, l / 2); // Close

                const extrudeSettings = { steps: 1, depth: dims.depth || 0.2, bevelEnabled: false };
                geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

                if (dims.centered !== false) geometry.center();
                else geometry.translate(0, 0, -(dims.depth || 0.2) / 2); // Center depth only

                geometry.rotateX(Math.PI / 2); // Rotate so Y (Chord) becomes Z, Z (Depth) becomes -Y

                const posAttribute = geometry.attributes.position;
                const vertex = new THREE.Vector3();
                const bbox = new THREE.Box3().setFromBufferAttribute(posAttribute);
                const zRange = bbox.max.z - bbox.min.z;
                const xRange = bbox.max.x - bbox.min.x;

                for (let i = 0; i < posAttribute.count; i++) {
                    vertex.fromBufferAttribute(posAttribute, i);
                    const zFactor = (vertex.z - bbox.min.z) / zRange;
                    const xFactor = (vertex.x - bbox.min.x) / xRange;
                    const trailTaper = 0.2 + 0.8 * zFactor;
                    const tipTaper = 1.0 - 0.7 * xFactor;
                    vertex.y *= trailTaper * tipTaper;
                    posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
                }
                geometry.computeVertexNormals();
                break;

            case PRIMITIVE_TYPES.DODECAHEDRON:
                geometry = new THREE.DodecahedronGeometry(dims.radius || 1);
                break;

            case PRIMITIVE_TYPES.ICOSAHEDRON:
                geometry = new THREE.IcosahedronGeometry(dims.radius || 1);
                break;

            case PRIMITIVE_TYPES.OCTAHEDRON:
                geometry = new THREE.OctahedronGeometry(dims.radius || 1);
                break;

            case PRIMITIVE_TYPES.TETRAHEDRON:
                geometry = new THREE.TetrahedronGeometry(dims.radius || 1);
                break;

            default:
                console.warn(`Unknown primitive type: ${type}`);
                geometry = new THREE.BoxGeometry(1, 1, 1);
        }

        this.geometryCache.set(cacheKey, geometry);
        const mesh = new THREE.Mesh(geometry.clone(), this.material);

        mesh.userData = {
            isComponent: true,
            primitiveType: type,
            originalDims: dims
        };

        return mesh;
    }

    /**
     * Returns the SDF configuration (type and scale) for a given component type and dimensions.
     * This ensures consistency between the mesh generation and the hull generation.
     * @param {string} type 
     * @param {object} dims 
     * @returns {object} { sdfType, scale }
     */
    getSDFConfig(type, dims) {
        let scale = new THREE.Vector3(1, 1, 1);
        let sdfType = 'box';

        switch (type) {
            case PRIMITIVE_TYPES.BOX:
                scale.set(dims.width || 1, dims.height || 1, dims.depth || 1);
                sdfType = 'box';
                break;
            case PRIMITIVE_TYPES.WEDGE:
                // Wedge: Width (x), Thickness/Depth (y), Length (z)
                // ComponentFactory creates shape (w, l) extruded by depth, then rotated X 90.
                scale.set(dims.span || dims.width || 1, dims.depth || 0.2, dims.rootChord || dims.length || 1);
                sdfType = 'wedge';
                break;
            case PRIMITIVE_TYPES.CAPSULE:
                scale.set(dims.radius || 1, dims.length || 1, dims.radius || 1);
                sdfType = 'capsule';
                break;
            case PRIMITIVE_TYPES.CONE:
                scale.set(dims.radius || 1, dims.height || 1, dims.radius || 1);
                sdfType = 'cone';
                break;
            case PRIMITIVE_TYPES.CYLINDER:
                scale.set(dims.radiusTop || 1, dims.height || 1, dims.radiusBottom || 1);
                if (Math.abs((dims.radiusTop || 1) - (dims.radiusBottom || 1)) > 0.001) {
                    sdfType = 'truncatedCone';
                } else {
                    sdfType = 'cylinder';
                }
                break;
            case PRIMITIVE_TYPES.PRISM:
                scale.set(dims.radius || 1, dims.height || 1, dims.radius || 1);
                sdfType = 'prism';
                break;
            case PRIMITIVE_TYPES.ELLIPSOID:
                scale.set(dims.width || 1, dims.height || 1, dims.length || 1);
                sdfType = 'ellipsoid';
                break;
            case PRIMITIVE_TYPES.TORUS:
                scale.set(dims.radius || 1, dims.tube || 0.2, dims.radius || 1);
                sdfType = 'torus';
                break;
            case PRIMITIVE_TYPES.SPHERE:
            case PRIMITIVE_TYPES.DODECAHEDRON:
            case PRIMITIVE_TYPES.ICOSAHEDRON:
            case PRIMITIVE_TYPES.OCTAHEDRON:
            case PRIMITIVE_TYPES.TETRAHEDRON:
                scale.set(dims.radius || 1, dims.radius || 1, dims.radius || 1);
                sdfType = type;
                break;
            default:
                scale.set(1, 1, 1);
                sdfType = 'box';
        }
        return { sdfType, scale };
    }

    /**
     * Generates a full component object with lore, stats, and a 3D mesh.
     * Combines procedural data generation with mesh creation.
     * @param {Object|string} templateOrName - The template object or name.
     * @param {Object} generationParams - { corporation, species, techLevel }
     * @param {...BigInt} flags - Bitwise flags for component traits.
     * @returns {Promise<Object>} The generated component data object with attached .mesh
     */
    async create(templateOrName, generationParams, ...flags) {
        const funcName = 'ComponentFactory.create';
        Logger.start(funcName, { templateOrName });

        let template;
        if (typeof templateOrName === 'string') {
            template = { name: templateOrName, usage: 'default' };
        } else {
            template = templateOrName;
        }

        const { corporation, species, techLevel } = generationParams;

        // 1. Generate Procedural Data
        const procComponent = await this.generator.generateComponent(
            template,
            corporation,
            species,
            techLevel,
            template.usage || 'default'
        );

        // 2. Combine bitwise flags
        let combinedBits = 0n;
        flags.forEach(flag => {
            combinedBits |= flag;
        });
        procComponent.idBits = combinedBits;

        // 3. Calculate T13NE Geometry frequency
        const T13Geometry = this.gameEngine?.pluginManager?.getApi('T13', 'T13Geometry');
        if (T13Geometry && T13Geometry.calculateGeoKey) {
            const geoKey = T13Geometry.calculateGeoKey(procComponent.name);
            if (procComponent.frequency_characteristics) {
                procComponent.frequency_characteristics.t13ne_frequency = geoKey.Key.Frequency;
            }
        }

        procComponent.hasTrait = (flag) => (procComponent.idBits & flag) === flag;

        // 4. Create 3D Mesh Proxy
        // Map the procedural shape string to our PRIMITIVE_TYPES
        const primitiveType = Object.values(PRIMITIVE_TYPES).includes(procComponent.proxyShape)
            ? procComponent.proxyShape
            : PRIMITIVE_TYPES.BOX;

        const mesh = this.createProxy(primitiveType, procComponent.dims);

        // Link them
        procComponent.mesh = mesh;
        mesh.userData.componentData = procComponent;

        Logger.end(funcName, procComponent);
        return procComponent;
    }
}