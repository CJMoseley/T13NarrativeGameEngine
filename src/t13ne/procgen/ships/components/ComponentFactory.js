import Logger from '../../../core/Logger.js';
import { ComponentDefs } from './ComponentDefs.js';
import { Loader } from '../../../core/Loader.js';
 
import { ProceduralComponentGenerator } from './ProceduralComponentGenerator.js';
import T13Geometry from '../../../../t13ne/public/js/t13ne-geometry.js';

// The factory now orchestrates loading a template and then handing it to the procedural generator.
export const ComponentFactory = {

    create: async (templateOrName, generationParams, ...flags) => {
        const funcName = 'ComponentFactory.create';
        Logger.start(funcName, { templateOrName });
        let template;
        // 1. Check if we were passed a template name (string) or a template object
        if (typeof templateOrName === 'string') {
            // Load the base component template from JSON
            template = await Loader.load(templateOrName);
            if (!template) {
                Logger.message(`ERROR: Failed to create component: Template '${templateOrName}' not found.`);
                return null;
            }
        } else {
            template = templateOrName; // Use the provided object directly
        }

        // 2. Use the procedural generator to create a unique instance
        const { corporation, species, techLevel, seed } = generationParams;
        const generator = new ProceduralComponentGenerator();
        let procComponent = await generator.generateComponent(template, corporation, species, techLevel, template.usage, seed);

        // 3. Combine bitwise flags
        let combinedBits = 0n;
        flags.forEach(flag => {
            combinedBits |= flag;
        });
        procComponent.idBits = combinedBits;

        // 4. Calculate T13NE Geometry frequency based on the new unique name
        const geoKey = T13Geometry.calculateGeoKey(procComponent.name);
        if (procComponent.frequency_characteristics) {
            procComponent.frequency_characteristics.t13ne_frequency = geoKey.Key.Frequency;
        }

        // 5. Add the hasTrait helper method
        procComponent.hasTrait = (flag) => {
            return (procComponent.idBits & flag) === flag;
        };

        Logger.end(funcName, procComponent);
        return procComponent;
    }
};