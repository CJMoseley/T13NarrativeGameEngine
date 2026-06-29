import { ActionSpace } from './ActionSpace.js';

/**
 * Represents a Psychosocial Action Space.
 * Extends ActionSpace to handle mental, social, and spiritual landscapes.
 */
export class PsychosocialSpace extends ActionSpace {
    constructor(config = {}) {
        super(config);
        this.type = 'Psychosocial';
        this.subType = config.subType || 'Private'; // Private, Clique, Underworld, Mercurial
        this.owner = config.owner || null; // Character ID for Private spaces
        this.eidolon = config.eidolon || null; // The Genius Loci of the space
        
        // Graph structure for psychosocial states
        this.states = new Map(); // id -> State Object
        this.links = []; // Array of { from, to, type, strength }
    }

    /**
     * Adds a psychosocial state (node) to the space.
     * @param {object} state - { id, name, description, facets: [], position: {x,y,z} }
     */
    addState(state) {
        if (!state.id) state.id = state.name.replace(/\s+/g, '_').toLowerCase();
        this.states.set(state.id, state);
        
        // Add as an entity to the base ActionSpace for positioning/distance logic
        this.addEntity({
            id: state.id,
            name: state.name,
            type: 'PsychosocialState',
            description: state.description,
            facets: state.facets || []
        }, state.position || { x: 0, y: 0, z: 0 });
    }

    /**
     * Connects two states.
     * @param {string} fromId 
     * @param {string} toId 
     * @param {string} type - e.g., 'Drive', 'Association', 'Memory'
     * @param {number} strength 
     */
    connectStates(fromId, toId, type = 'Association', strength = 1) {
        this.links.push({ from: fromId, to: toId, type, strength });
    }

    /**
     * Moves an entity (e.g., Inner Self) to a specific state.
     * @param {object} entity 
     * @param {string} stateId 
     */
    moveToState(entity, stateId) {
        const state = this.states.get(stateId);
        if (state) {
            // Update position in the ActionSpace
            const pos = this.getPosition({ id: stateId });
            if (pos) {
                this.addEntity(entity, pos);
            }
        }
    }
}





