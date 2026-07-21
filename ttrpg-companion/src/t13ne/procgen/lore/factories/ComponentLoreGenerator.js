import { ComponentDefs } from '../../ships/components/ComponentDefs.js';
import Logger from '../../../core/Logger.js';

export class ComponentLoreGenerator {
    constructor() {
        // No dependencies on LoreData for now, but structure allows for it
    }

    generateIdentity(corpName, usage, techLevel, shape, traits, prng) {
        const funcName = 'ComponentLoreGenerator.generateIdentity';
        // Generate Name
        const modelNum = Math.floor(prng.nextDouble() * 9000) + 1000;
        const suffixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'X', 'Prime', 'Max', 'Pro'];
        const suffix = suffixes[Math.floor(prng.nextDouble() * suffixes.length)];
        const name = `${corpName} ${usage} ${modelNum}-${suffix}`;

        // Generate Description
        let materialDesc = "standard materials";
        if (traits & ComponentDefs.MATERIALS.DARK_MATTER) materialDesc = "containment fields holding dark matter";
        else if (traits & ComponentDefs.MATERIALS.HYPERDENSE) materialDesc = "hyperdense collapsed matter";
        else if (traits & ComponentDefs.MATERIALS.NANO_ALLOYS) materialDesc = "high-grade nano-alloys";
        else if (traits & ComponentDefs.MATERIALS.POLYMER) materialDesc = "reinforced polymers";
        else if (traits & ComponentDefs.MATERIALS.METAL) materialDesc = "industrial steel";

        let functionDesc = "general purpose use";
        if (traits & ComponentDefs.TASKS.THRUSTERS) functionDesc = "high-thrust propulsion";
        else if (traits & ComponentDefs.TASKS.WEAPON) functionDesc = "offensive engagement";
        else if (traits & ComponentDefs.TASKS.SHIELD) functionDesc = "energy deflection";
        else if (traits & ComponentDefs.TASKS.SENSORS) functionDesc = "long-range detection";
        else if (traits & ComponentDefs.TASKS.GENERATION) functionDesc = "power output";
        else if (traits & ComponentDefs.TASKS.LIFE_SUPPORT) functionDesc = "crew habitation";
        else if (traits & ComponentDefs.TASKS.WORMHOLE) functionDesc = "wormhole navigation";
        else if (traits & ComponentDefs.TASKS.PHYSICAL_STABILIZATION) functionDesc = "structural integrity";

        const description = `A ${shape}-configured ${usage.toLowerCase()} module manufactured by ${corpName}. Constructed from ${materialDesc}, this unit is optimized for ${functionDesc} at Tech Level ${techLevel}.`;

        return { name, description };
    }
}