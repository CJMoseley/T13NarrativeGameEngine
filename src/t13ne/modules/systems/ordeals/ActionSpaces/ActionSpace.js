import T13NE from '@plugins/t13ne/T13NE.js';
import Logger from "@/src/t13ne/core/Logger.js";

/**
 * Represents a generic Action Space in the T13NE system.
 * Can be physical (Theatre of the Mind, Battle-board) or abstract.
 */
export class ActionSpace {
    constructor(config = {}) {
        this.id = config.id || Date.now().toString();
        this.name = config.name || 'Unknown Space';
        this.type = config.type || 'Theatre of the Mind';
        this.terrain = config.terrain || 'Open';
        this.scale = config.scale || 1; // Metres per unit
        this.entities = new Map(); // Map of ID -> { x, y, z, entity }
        this.dimensions = config.dimensions || { x: 100, y: 100, z: 0 };
    }

    /**
     * Adds an entity to the action space.
     * @param {object} entity - The character or object.
     * @param {object} position - { x, y, z } coordinates.
     */
    addEntity(entity, position = { x: 0, y: 0, z: 0 }) {
        const id = entity.id || entity.name;
        this.entities.set(id, { ...position, entity });
    }

    /**
     * Removes an entity from the action space.
     * @param {object} entity 
     */
    removeEntity(entity) {
        const id = entity.id || entity.name;
        this.entities.delete(id);
    }

    /**
     * Gets the position of an entity.
     * @param {object} entity 
     * @returns {object|null}
     */
    getPosition(entity) {
        const id = entity.id || entity.name;
        return this.entities.get(id) || null;
    }

    /**
     * Calculates the distance between two entities.
     * @param {object} entity1 
     * @param {object} entity2 
     * @returns {number} Distance in metres.
     */
    getDistance(entity1, entity2) {
        const pos1 = this.getPosition(entity1);
        const pos2 = this.getPosition(entity2);
        
        if (!pos1 || !pos2) {
            // Fallback for Theatre of the Mind or abstract spaces
            return 0; 
        }

        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        
        return Math.sqrt(dx*dx + dy*dy + dz*dz) * this.scale;
    }

    /**
     * Calculates the difficulty to traverse or act across a distance.
     * @param {number} distance - Distance in metres.
     * @param {string} actionType - 'Move', 'Shoot', etc.
     * @returns {number} Difficulty in Pips.
     */
    calculateDifficulty(distance, actionType = 'Move') {
        const ActionSpacesModule = T13NE.getModule('ActionSpaces');
        if (!ActionSpacesModule) return 0;

        const terrainData = ActionSpacesModule.getTerrainData(this.terrain);
        let multiplier = 1;
        
        if (terrainData && terrainData.Difficulty_Multiplier) {
            multiplier = terrainData.Difficulty_Multiplier;
        }

        // Basic T13 logic: Difficulty often scales with distance/range bands
        // Placeholder logic: 1 Pip per 2 metres * multiplier
        return Math.ceil((distance / 2) * multiplier);
    }
}







