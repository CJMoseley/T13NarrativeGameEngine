import * as THREE from 'three';
import { SHIP_PARTS, SOCKET_TYPES } from './ShipChassis.js';
import { mulberry32 } from '/src/t13ne/core/ship/ShipUtils.js';

export class ShipSynthesizer {
    constructor() {
        // Define connection probabilities (The Markov Chain)
        // Key: Socket Type -> Value: Array of { partId, weight }
        this.connectionRules = {
            [SOCKET_TYPES.NECK_TOP]: [
                { part: 'saucer_classic', weight: 5 },
                { part: 'saucer_elliptical', weight: 2 },
                { part: 'saucer_wedge', weight: 1 }
            ],
            [SOCKET_TYPES.NECK_BOTTOM]: [
                { part: 'hull_cylindrical_standard', weight: 5 },
                { part: 'hull_box_cargo', weight: 1 },
                { part: 'hull_section_engineering', weight: 3 }
            ],
            [SOCKET_TYPES.SAUCER_VENTRAL]: [
                { part: 'neck_upright', weight: 4 },
                { part: 'neck_swept', weight: 2 },
                { part: 'hull_cylindrical_standard', weight: 1 }, // Direct connect
                { part: 'hull_section_engineering', weight: 2 }
            ],
            [SOCKET_TYPES.PYLON_MOUNT]: [
                { part: 'pylon_straight', weight: 3 },
                { part: 'pylon_angled', weight: 3 },
                { part: 'pylon_battlestar', weight: 2 }
            ],
            [SOCKET_TYPES.NACELLE_MOUNT]: [
                { part: 'nacelle_cylindrical', weight: 5 },
                { part: 'nacelle_rectangular', weight: 1 }
            ],
            [SOCKET_TYPES.BRIDGE_MOUNT]: [
                { part: 'bridge_dome', weight: 5 },
                { part: 'bridge_block', weight: 1 },
                { part: 'bridge_cockpit', weight: 2 }
            ],
            [SOCKET_TYPES.FUSELAGE_AFT]: [
                { part: 'nacelle_cylindrical', weight: 1 }, // Single nacelle?
                { part: 'hull_box_cargo', weight: 1 },
                { part: 'engine_thruster', weight: 2 }
            ],
            [SOCKET_TYPES.WING_MOUNT]: [
                { part: 'wing_delta', weight: 3 },
                { part: 'wing_swept_back', weight: 3 },
                { part: 'wing_forward_swept', weight: 1 },
                { part: 'wing_blocky', weight: 1 }
            ],
            [SOCKET_TYPES.FUSELAGE_FRONT]: [
                { part: 'deflector_dish', weight: 1 }
            ],
            [SOCKET_TYPES.ENGINE_MOUNT]: [
                { part: 'engine_thruster', weight: 1 }
            ],
            [SOCKET_TYPES.FUSELAGE_SIDE]: [
                { part: 'cargo_pod', weight: 1 }
            ],
            [SOCKET_TYPES.THRUSTER_MOUNT]: [
                { part: 'engine_thruster', weight: 1 }
            ]
        };
    }

    /**
     * Synthesizes a ship based on a seed and configuration.
     * @param {number|string} seed 
     * @param {object} config 
     */
    generate(seed, config = {}) {
        const rng = mulberry32(typeof seed === 'number' ? seed : this.hashString(seed));
        const components = [];
        const openSockets = []; // Queue of { socket, parentPos, parentRot, parentId }

        // 1. Select Root Component
        const rootOptions = [
            { part: 'hull_cylindrical_standard', weight: 40 },
            { part: 'saucer_elliptical', weight: 20 },
            { part: 'saucer_classic', weight: 15 },
            { part: 'hull_box_cargo', weight: 15 },
            { part: 'saucer_radial', weight: 5 },
            { part: 'hull_star', weight: 5 }
        ];
        let rootPartId = this.weightedSelect(rootOptions, rng);
        if (config.style === 'INDUSTRIAL') rootPartId = 'hull_box_cargo';

        const rootDef = SHIP_PARTS[rootPartId];
        if (!rootDef) {
            console.error(`ShipSynthesizer: Root part ${rootPartId} not found.`);
            return [];
        }

        // Add Root
        this.addComponent(components, openSockets, rootDef, [0, 0, 0], [0, 0, 0], rng);

        // 2. Iterative Assembly
        let safety = 0;
        while (openSockets.length > 0 && safety < 50) {
            safety++;
            const currentSocket = openSockets.shift(); // Breadth-first
            
            // Find compatible parts
            const options = this.connectionRules[currentSocket.type];
            if (!options || options.length === 0) continue;

            // Filter options by tags if config requires (e.g. only 'federation')
            const validOptions = options.filter(opt => {
                const partDef = SHIP_PARTS[opt.part];
                if (!partDef) return false;
                if (config.tags && config.tags.length > 0) {
                    return config.tags.some(t => partDef.tags.includes(t));
                }
                return true;
            });

            if (validOptions.length === 0) continue;

            // Weighted Random Selection
            const selectedPartId = this.weightedSelect(validOptions, rng);
            const partDef = SHIP_PARTS[selectedPartId];

            // Calculate Position & Rotation
            // We need to align the part's "attach point" to the socket.
            // For simplicity, we assume parts attach at their origin (0,0,0) unless specified otherwise.
            // Ideally, parts would have "male" sockets (plugs) defined, but here we just attach origin to socket.
            
            // Socket pos is relative to parent.
            // World Pos = ParentPos + (SocketPos rotated by ParentRot)
            const parentPosVec = new THREE.Vector3(...currentSocket.parentPos);
            const parentRotEuler = new THREE.Euler(...currentSocket.parentRot);
            const socketOffsetVec = new THREE.Vector3(...currentSocket.pos);
            socketOffsetVec.applyEuler(parentRotEuler);
            
            const newPos = parentPosVec.add(socketOffsetVec);
            
            // Rotation: Inherit parent rotation + socket rotation
            // This is a simplification. Real alignment requires quaternions.
            const socketRotEuler = new THREE.Euler(...currentSocket.rot);
            const newRotEuler = new THREE.Euler(
                parentRotEuler.x + socketRotEuler.x,
                parentRotEuler.y + socketRotEuler.y,
                parentRotEuler.z + socketRotEuler.z
            );

            // Add the component
            this.addComponent(components, openSockets, partDef, [newPos.x, newPos.y, newPos.z], [newRotEuler.x, newRotEuler.y, newRotEuler.z], rng);

            // Handle Symmetry
            // If the socket was a "port" socket (e.g. pylon_port), we should look for a "starboard" socket on the parent
            // and attach the same part there immediately to ensure symmetry.
            // Current simplified logic: The socket definition in ShipChassis should handle symmetry pairs?
            // Or we just rely on the fact that if we attach to 'pylon_port', the 'pylon_starboard' socket is still in the queue.
            // But we want the SAME part.
            
            // Better approach: If the socket name implies a side (port/starboard, left/right), 
            // find its pair in the openSockets list and force the same selection.
            if (currentSocket.id.includes('port')) {
                const mirrorId = currentSocket.id.replace('port', 'starboard');
                const mirrorIndex = openSockets.findIndex(s => s.parentId === currentSocket.parentId && s.id === mirrorId);
                if (mirrorIndex !== -1) {
                    const mirrorSocket = openSockets.splice(mirrorIndex, 1)[0];
                    // Calculate mirror pos
                    const mParentPos = new THREE.Vector3(...mirrorSocket.parentPos);
                    const mParentRot = new THREE.Euler(...mirrorSocket.parentRot);
                    const mOffset = new THREE.Vector3(...mirrorSocket.pos);
                    mOffset.applyEuler(mParentRot);
                    const mPos = mParentPos.add(mOffset);
                    
                    // Mirror rotation is tricky, usually flip Z or Y depending on axis.
                    // For now, just use the socket's defined rotation + parent
                    const mSocketRot = new THREE.Euler(...mirrorSocket.rot);
                    const mRot = new THREE.Euler(
                        mParentRot.x + mSocketRot.x,
                        mParentRot.y + mSocketRot.y,
                        mParentRot.z + mSocketRot.z
                    );

                    // Add the mirror component
                    this.addComponent(components, openSockets, partDef, [mPos.x, mPos.y, mPos.z], [mRot.x, mRot.y, mRot.z], rng);
                }
            }
        }

        // 3. Post-Process: Deformation
        const deformedComponents = this.deformShip(components, rng, config);

        return deformedComponents;
    }

    addComponent(list, socketQueue, partDef, pos, rot, rng) {
        const id = `${partDef.id}_${list.length}`;
        
        // Allow parts to define their own style overrides (e.g. for bio components skinned differently)
        // This supports the requirement for sub-assemblies to have distinct skinning/hull generation parameters.
        const componentStyle = partDef.style || null;
        
        // Combine rotation: passed rotation (from socket) + intrinsic part rotation
        let finalRot = [...rot];
        if (partDef.rot) {
            finalRot[0] += partDef.rot[0];
            finalRot[1] += partDef.rot[1];
            finalRot[2] += partDef.rot[2];
        }

        // Handle Composite Parts (expand them into individual primitives)
        if (partDef.type === 'composite' && partDef.components) {
            partDef.components.forEach((sub, idx) => {
                // Transform sub-component relative to the main part's pos/rot
                // Note: We use finalRot here so sub-components align with the corrected part orientation
                const subPos = new THREE.Vector3(...sub.pos);
                subPos.applyEuler(new THREE.Euler(...finalRot));
                subPos.add(new THREE.Vector3(...pos));
                
                const subRot = new THREE.Euler(
                    finalRot[0] + sub.rot[0],
                    finalRot[1] + sub.rot[1],
                    finalRot[2] + sub.rot[2]
                );

                list.push({
                    id: `${id}_sub_${idx}`,
                    type: sub.type,
                    dims: sub.dims,
                    pos: [subPos.x, subPos.y, subPos.z],
                    rot: [subRot.x, subRot.y, subRot.z],
                    usage: partDef.usage, // Inherit usage
                    scale: partDef.scale || [1,1,1],
                    styleConfig: componentStyle // Pass style to sub-components
                });
            });
        } else {
            // Single Primitive
            list.push({
                id: id,
                type: partDef.type,
                dims: partDef.dims,
                pos: pos,
                rot: finalRot, // Use corrected rotation
                usage: partDef.usage,
                scale: partDef.scale || [1,1,1],
                styleConfig: componentStyle
            });
        }

        // Add this part's sockets to the queue
        if (partDef.sockets) {
            partDef.sockets.forEach(s => {
                // Prevent saucers from growing necks if they are not the root (i.e. attached to a hull)
                if (partDef.usage === 'hull_primary' && list.length > 1 && s.type === SOCKET_TYPES.SAUCER_VENTRAL) {
                    return;
                }

                socketQueue.push({
                    ...s,
                    parentId: id,
                    parentPos: pos,
                    parentRot: finalRot // Sockets move with the corrected part rotation
                });
            });
        }
    }

    weightedSelect(options, rng) {
        const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
        let random = rng() * totalWeight;
        for (const opt of options) {
            random -= opt.weight;
            if (random <= 0) return opt.part;
        }
        return options[0].part;
    }

    /**
     * Applies global deformations to the ship structure to create variations.
     * e.g. Stretching the hull, flattening the profile, or scaling wings.
     */
    deformShip(components, rng, config) {
        // Determine global deformation factors
        // 1.0 is normal.
        const stretchZ = 0.8 + rng() * 0.6; // 0.8x to 1.4x length
        const widthX = 0.8 + rng() * 0.4;   // 0.8x to 1.2x width
        const flatY = 0.7 + rng() * 0.6;    // 0.7x to 1.3x height (flatten or bulk up)

        // Apply to all components
        components.forEach(comp => {
            // 1. Scale Position
            comp.pos[0] *= widthX;
            comp.pos[1] *= flatY;
            comp.pos[2] *= stretchZ;

            // 2. Scale Dimensions/Scale
            // We modify the component's scale vector to deform the mesh itself
            if (!comp.scale) comp.scale = [1, 1, 1];
            
            // Be careful with rotation. If a component is rotated 90deg, scaling X might visually scale Z.
            // For a robust deformation, we usually just scale the position (spacing) and 
            // lightly scale the components themselves to match, or we rely on the HullGenerator's SDF 
            // to smooth out the gaps.
            
            // Simple approach: Apply the same scale factors to the component's local scale.
            // This works well for "organic" or "sdf" hulls. For rigid mechanical parts, it might distort circles into ovals.
            // Given the user wants "variations", distorting shapes is likely desired.
            
            // Note: comp.scale is [x, y, z].
            // We need to apply the deformation in WORLD space, but comp.scale is LOCAL space.
            // For now, we apply a uniform scaler to keep it simple, or just rely on position spacing.
            // Let's apply a slight randomization to component size to add variety.
            const localVar = 0.9 + rng() * 0.2;
            comp.scale[0] *= localVar;
            comp.scale[1] *= localVar;
            comp.scale[2] *= localVar;
        });

        return components;
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0;
        }
        return hash;
    }
}
