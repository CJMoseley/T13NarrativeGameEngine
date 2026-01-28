import { SuperKnot } from "@/src/t13ne/modules/mechanics/t13ne-knots.js";
import Logger from "@/src/t13ne/core/Logger.js";

/**
 * T13Location
 * Represents a logical and visual location in the T13NE engine.
 * Links T13 Narrative Engine properties with visual scene definitions.
 */
export class T13Location extends SuperKnot {
    constructor(codexLoader, data) {
        super(codexLoader, data);

        // Logical Definition (Specific T13 properties)
        this.logicalDefinition = data.logicalDefinition || {
            type: 'Urban',
            facets: data.tags?.facets || [],
            iching: data.iching || null
        };

        // Visual Definition (For T13Scene)
        this.sceneDefinition = data.sceneDefinition || {
            renderMode: data.renderMode || '3d', // '3d', '2d', 'dual'
            modelPath: data.modelPath || '',    // Path to GLB/OBJ
            mapPath: data.mapPath || '',      // Path to SVG/Image
            background: data.background || '',
            environment: data.environment || null
        };

        // Procedural Scripts
        this.proceduralScripts = data.proceduralScripts || [];
    }

    /**
     * Serializes the location for storage.
     */
    serialize() {
        const base = super.serialize ? super.serialize() : {};
        return {
            ...base,
            logicalDefinition: this.logicalDefinition,
            sceneDefinition: this.sceneDefinition,
            proceduralScripts: this.proceduralScripts
        };
    }
}







