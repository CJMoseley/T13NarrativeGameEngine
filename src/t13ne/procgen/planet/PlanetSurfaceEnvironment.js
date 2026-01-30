import Logger from '../../core/Logger.js';
import { PlanetSurfaceGenerator } from './PlanetSurfaceGenerator.js';
import { VegetationGenerator } from './VegetationGenerator.js';
import { BuildingGenerator } from './BuildingGenerator.js';
import ProcGen from '../ProcGen.js';

export class PlanetSurfaceEnvironment {
    constructor(planetData) {
        const funcName = 'PlanetSurfaceEnvironment.constructor';
        Logger.start(funcName);
        this.planetData = planetData;
        this.procGen = ProcGen;
        this.generator = new PlanetSurfaceGenerator(planetData, this.procGen);
        this.vegetationGenerator = new VegetationGenerator(planetData, this.procGen);
        this.buildingGenerator = new BuildingGenerator(planetData, this.procGen);

        this.trees = this.vegetationGenerator.generateTrees(100, this.generator, this.generator);
        this.buildings = this.buildingGenerator.generateBuildings(50, this.generator, this.generator);
        this.mass = this.planetData?.mass || 5.972e24; // Earth mass as default
        this.gravity = { x: 0, y: -9.8 * (this.mass / 5.972e24), z: 0 };
        this.groundLevel = 0;
        this.skyColor = { r: 0.5, g: 0.7, b: 1.0 };
        this.globalTime = 0;
        Logger.message(`PlanetSurfaceEnvironment created for planet with mass ${this.mass}.`);
        Logger.end(funcName);
    }

    update(deltaTime) {
        // Logging every frame in update is too noisy, so we'll skip it.
        this.globalTime += deltaTime;
    }

    getTerrainHeight(x, z) {
        // This can be called frequently, so we avoid logging here to prevent spam.
        return this.generator.getTerrainHeight(x, z);
    }
}
