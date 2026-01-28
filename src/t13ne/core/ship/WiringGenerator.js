import * as THREE from 'three';
import WiringConfigs from './wiring_configs.js';

export class WiringGenerator {
    constructor() {
    }

    /**
     * Adds a bidirectional connection to the wiring graph.
     * @param {Object} graph - The adjacency list graph.
     * @param {string} idA - ID of the first component.
     * @param {string} idB - ID of the second component.
     * @param {string} type - Type of wiring (e.g., 'electrical', 'fuel_pipe').
     * @param {number} length - Length of the connection.
     */
    addConnection(graph, idA, idB, type, length) {
        if (!graph[idA]) graph[idA] = [];
        if (!graph[idB]) graph[idB] = [];
        
        // Check for duplicates to avoid double wiring
        if (!graph[idA].find(c => c.targetId === idB)) {
            graph[idA].push({ targetId: idB, wiringType: type, length });
        }
        if (!graph[idB].find(c => c.targetId === idA)) {
            graph[idB].push({ targetId: idA, wiringType: type, length });
        }
    }

    /**
     * Generates the complete wiring graph for a set of components.
     * Combines explicit connections (e.g. symmetry) with procedural routing.
     * @param {Array} components - The list of component definitions.
     * @param {Object} existingGraph - Optional existing graph with pre-defined connections.
     * @returns {Object} The complete wiring graph.
     */
    generateLogicalGraph(components, existingGraph = {}) {
        const wiringGraph = JSON.parse(JSON.stringify(existingGraph)); // Deep copy

        // Use a Prim-like expansion to route wiring through structural components
        const roots = components.filter(c => c.id.startsWith('spine') || c.id.startsWith('fuselage') || c.id === 'saucer_hull' || c.id.includes('ring'));
        const pool = components.filter(c => !roots.includes(c));
        const connected = [...roots];
        
        // Helper to get distance between components
        const getDist = (c1, c2) => {
            const p1 = Array.isArray(c1.pos) ? new THREE.Vector3(...c1.pos) : c1.pos;
            const p2 = Array.isArray(c2.pos) ? new THREE.Vector3(...c2.pos) : c2.pos;
            return p1.distanceTo(p2);
        };

        // Sort pool by distance to any root (approximate "centrality")
        pool.sort((a, b) => {
            let distA = Infinity;
            let distB = Infinity;
            roots.forEach(r => {
                distA = Math.min(distA, getDist(a, r));
                distB = Math.min(distB, getDist(b, r));
            });
            return distA - distB;
        });

        pool.forEach(comp => {
            // If already connected (e.g. via symmetry logic), skip procedural connection
            if (wiringGraph[comp.id] && wiringGraph[comp.id].length > 0) {
                connected.push(comp);
                return;
            }

            let nearest = null;
            let minDist = Infinity;
            
            // Find nearest already-connected component
            connected.forEach(candidate => {
                const dist = getDist(comp, candidate);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = candidate;
                }
            });

            if (nearest) {
                // Determine wiring type based on usage
                let type = 'electrical'; 
                const u = comp.usage ? comp.usage.toLowerCase() : '';
                
                if (u.includes('engine') || u.includes('thruster') || u.includes('fuel')) type = 'fuel_pipe';
                else if (u.includes('cockpit') || u.includes('bridge') || u.includes('sensor') || u.includes('computer')) type = 'fiber_optic';
                else if (u.includes('generator') || u.includes('shield') || u.includes('reactor')) type = 'superconductor';
                else if (u.includes('vortex') || u.includes('weapon')) type = 'plasma_conduit';

                this.addConnection(wiringGraph, comp.id, nearest.id, type, minDist);
                connected.push(comp);
            }
        });

        return wiringGraph;
    }

    /**
     * Generates visual meshes for the wiring graph.
     * @param {Object} wiringGraph 
     * @param {Map} componentPositions - Map of component ID to THREE.Vector3 position.
     * @param {Map} componentData - Map of component ID to component data (type, dims, rotation).
     * @returns {THREE.Group} Group containing wire meshes.
     */
    createVisuals(wiringGraph, componentPositions, componentData = null) {
        const group = new THREE.Group();
        const processedEdges = new Set();

        for (const [sourceId, connections] of Object.entries(wiringGraph)) {
            const startPos = componentPositions.get(sourceId);
            if (!startPos) continue;

            for (const conn of connections) {
                const edgeKey = [sourceId, conn.targetId].sort().join('-');
                if (processedEdges.has(edgeKey)) continue;
                processedEdges.add(edgeKey);

                const endPos = componentPositions.get(conn.targetId);
                if (!endPos) continue;

                let targetPos = endPos.clone();

                // Handle connections to Torus (Ring) components specially
                if (componentData && componentData.has(conn.targetId)) {
                    const endComp = componentData.get(conn.targetId);
                    if (endComp.type === 'torus') {
                        // Calculate nearest point on the ring
                        // Transform startPos to local space of Torus
                        const localStart = startPos.clone().sub(endPos);
                        const q = new THREE.Quaternion().setFromEuler(endComp.rotation);
                        const invQ = q.clone().invert();
                        localStart.applyQuaternion(invQ);
                        
                        // Project to XY plane (Torus plane) and scale to radius
                        const pXY = new THREE.Vector3(localStart.x, localStart.y, 0);
                        if (pXY.lengthSq() > 0.0001) {
                            pXY.normalize().multiplyScalar(endComp.dims.radius || 1);
                            pXY.applyQuaternion(q);
                            targetPos.copy(endPos).add(pXY);
                        }
                    }
                }

                // Create a tube/cylinder for the wire
                const distance = startPos.distanceTo(targetPos);
                const wireGeo = new THREE.CylinderGeometry(0.05, 0.05, distance, 4); 
                wireGeo.rotateX(Math.PI / 2); 
                wireGeo.translate(0, 0, distance / 2); 

                const wireColor = WiringConfigs[conn.wiringType] ? WiringConfigs[conn.wiringType].color : 0xffffff;
                const wireMat = new THREE.MeshBasicMaterial({ color: wireColor });
                const wireMesh = new THREE.Mesh(wireGeo, wireMat);
                
                wireMesh.position.copy(startPos);
                wireMesh.lookAt(targetPos);
                wireMesh.userData = { isWire: true, wiringType: conn.wiringType };
                group.add(wireMesh);
            }
        }
        return group;
    }
}