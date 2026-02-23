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
                { part: 'hull_box_cargo', weight: 1 }
            ],
            [SOCKET_TYPES.SAUCER_VENTRAL]: [
                { part: 'neck_upright', weight: 4 },
                { part: 'neck_swept', weight: 2 },
                { part: 'hull_cylindrical_standard', weight: 1 } // Direct connect
            ],
            [SOCKET_TYPES.PYLON_MOUNT]: [
                { part: 'pylon_straight', weight: 3 },
                { part: 'pylon_angled', weight: 3 }
            ],
            [SOCKET_TYPES.NACELLE_MOUNT]: [
                { part: 'nacelle_cylindrical', weight: 5 },
                { part: 'nacelle_rectangular', weight: 1 }
            ],
            [SOCKET_TYPES.BRIDGE_MOUNT]: [
                { part: 'bridge_dome', weight: 5 },
                { part: 'bridge_block', weight: 1 }
            ],
            [SOCKET_TYPES.FUSELAGE_AFT]: [
                { part: 'nacelle_cylindrical', weight: 1 }, // Single nacelle?
                { part: 'hull_box_cargo', weight: 1 }
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
        // Usually a Secondary Hull or a Saucer depending on ship class
        let rootPartId = 'hull_cylindrical_standard';
        if (rng() > 0.7) rootPartId = 'saucer_elliptical';
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

        return components;
    }

    addComponent(list, socketQueue, partDef, pos, rot, rng) {
        const id = `${partDef.id}_${list.length}`;
        
        // Allow parts to define their own style overrides (e.g. for bio components skinned differently)
        // This supports the requirement for sub-assemblies to have distinct skinning/hull generation parameters.
        const componentStyle = partDef.style || null;
        
        // Handle Composite Parts (expand them into individual primitives)
        if (partDef.type === 'composite' && partDef.components) {
            partDef.components.forEach((sub, idx) => {
                // Transform sub-component relative to the main part's pos/rot
                const subPos = new THREE.Vector3(...sub.pos);
                subPos.applyEuler(new THREE.Euler(...rot));
                subPos.add(new THREE.Vector3(...pos));
                
                const subRot = new THREE.Euler(
                    rot[0] + sub.rot[0],
                    rot[1] + sub.rot[1],
                    rot[2] + sub.rot[2]
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
                rot: rot,
                usage: partDef.usage,
                scale: partDef.scale || [1,1,1],
                styleConfig: componentStyle
            });
        }

        // Add this part's sockets to the queue
        if (partDef.sockets) {
            partDef.sockets.forEach(s => {
                socketQueue.push({
                    ...s,
                    parentId: id,
                    parentPos: pos,
                    parentRot: rot
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
