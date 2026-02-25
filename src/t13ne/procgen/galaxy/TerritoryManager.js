import ProcGen from '../ProcGen.js';
import Logger from '/src/t13ne/core/Logger.js';

/**
 * TerritoryManager
 * Manages 3D volume territories and layers of influence in the galaxy.
 */
export class TerritoryManager {
    constructor() {
        this.reset();
    }

    /**
     * Resets the territory layers to their default state.
     */
    reset() {
        this.layers = {
            POLITICAL: [],
            CORPORATE: [],
            ECONOMIC: [],
            RACING: []
        };
    }

    /**
     * Adds a territory to a specific layer.
     * @param {string} layer - POLITICAL, CORPORATE, ECONOMIC, RACING
     * @param {object} faction - The faction/corp object
     * @param {THREE.Vector3} center - Center of territory
     * @param {number} radius - Radius of influence
     */
    addTerritory(layer, faction, center, radius) {
        if (!this.layers[layer]) {
            this.layers[layer] = [];
        }
        this.layers[layer].push({
            faction,
            center,
            radius,
            id: faction.id || faction.name
        });
    }

    /**
     * Returns the dominant factions at a given coordinate across all layers.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {object} Map of layer to faction
     */
    getInfluenceAt(x, y, z) {
        const influence = {};
        for (const [layerName, territories] of Object.entries(this.layers)) {
            let strongest = null;
            let maxPressure = 0;

            territories.forEach(t => {
                const dx = x - t.center.x;
                const dy = y - t.center.y;
                const dz = z - t.center.z;
                const distSq = dx * dx + dy * dy + dz * dz;
                const radiusSq = t.radius * t.radius;

                if (distSq <= radiusSq) {
                    // Linear falloff pressure
                    const pressure = 1 - (Math.sqrt(distSq) / t.radius);
                    if (pressure > maxPressure) {
                        maxPressure = pressure;
                        strongest = t.faction;
                    }
                }
            });
            influence[layerName] = strongest;
        }
        return influence;
    }

    /**
     * Spreads a territory based on a "plot" or growth event.
     */
    expandTerritory(layer, factionId, amount) {
        const territory = this.layers[layer]?.find(t => t.id === factionId);
        if (territory) {
            territory.radius += amount;
        }
    }

    /**
     * Serializes layers for storage.
     */
    serialize() {
        return this.layers;
    }

    /**
     * Deserializes layers from storage.
     */
    deserialize(data) {
        if (data) this.layers = data;
    }
}

export default new TerritoryManager();
