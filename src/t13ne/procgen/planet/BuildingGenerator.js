import Logger from '../../core/Logger.js';
import ProcGen from '../ProcGen.js';

export class BuildingGenerator {
    constructor(planetData, procGen) {
        const funcName = 'BuildingGenerator.constructor';
        Logger.start(funcName);
        this.planetData = planetData;
        this.procGen = procGen || ProcGen;
        Logger.end(funcName);
    }

    _getSeededRandom(seedParts) {
        // This is a low-level utility, so logging start/end might be too verbose.
        // We'll skip detailed logging here to avoid clutter.
        const prng = this.procGen.createPRNG(seedParts.join(','));
        return prng.nextDouble();
    }

    generateBuildings(count, densityMap, terrainGenerator) {
        const funcName = 'BuildingGenerator.generateBuildings';
        Logger.start(funcName, { count });
        const buildings = [];
        const seeds = (this.planetData && this.planetData.seeds) ? this.planetData.seeds : [0.1, 0.2, 0.3, 0.4];
        for (let i = 0; i < count; i++) {
            const x = this._getSeededRandom([...seeds, i, 0.8]) * 500 - 250;
            const z = this._getSeededRandom([...seeds, i, 0.9]) * 500 - 250;
            if (densityMap.getDensity(x, z) < -0.5) {
                buildings.push(this.generateBuilding(x, z, terrainGenerator));
            }
        }
        Logger.end(funcName, `Generated ${buildings.length} buildings.`);
        return buildings;
    }
    generateBuilding(x, z, terrainGenerator) {
        const funcName = 'BuildingGenerator.generateBuilding';
        Logger.start(funcName, { x, z });

        const y = terrainGenerator.getTerrainHeight(x, z);
        const position = { x, y, z };
        const seeds = (this.planetData && this.planetData.seeds) ? this.planetData.seeds : [0.1, 0.2, 0.3, 0.4];
        const size = {
            x: this._getSeededRandom([...seeds, x, 0.1]) * 10 + 5,
            y: this._getSeededRandom([...seeds, y, 0.2]) * 20 + 10,
            z: this._getSeededRandom([...seeds, z, 0.3]) * 10 + 5,
        };
        const type = this._getSeededRandom([...seeds, x, y, z, 0.4]) > 0.5 ? 'prism' : 'cylinder';
        const building = { position, size, type };
        Logger.end(funcName, building);
        return building;
    }
}
