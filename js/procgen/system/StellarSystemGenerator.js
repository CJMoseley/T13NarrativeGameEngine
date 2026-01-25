import { LoreData } from '../lore/LoreData.js';
import Logger from '../../core/Logger.js';
import { PlanetarySystemGenerator } from './PlanetarySystemGenerator.js';

export class StellarSystemGenerator {
    constructor(pluginManager, nameGenerator) {
        const funcName = 'StellarSystemGenerator.constructor';
        Logger.start(funcName);
        this.pluginManager = pluginManager;
        this.nameGenerator = nameGenerator;
        this.planetaryGenerator = new PlanetarySystemGenerator(this.pluginManager, this.nameGenerator);
        Logger.end(funcName);
    }

  generatePlanets(systemData) {
        return this.planetaryGenerator.generatePlanets(systemData);
    }
}
