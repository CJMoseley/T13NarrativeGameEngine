import Logger from '../../core/Logger.js';
import ProcGen from '../ProcGen.js';

export class PlanetSurfaceGenerator {
    constructor(planetData, procGen) {
        const funcName = 'PlanetSurfaceGenerator.constructor';
        Logger.start(funcName);
        this.planetData = planetData;
        this.procGen = procGen || ProcGen;
        this.waterLevel = -10;
        this.craters = this.generateCraters(20);
        this.rocks = this.generateRocks(200);
        Logger.message(`PlanetSurfaceGenerator initialized with ${this.craters.length} craters and ${this.rocks.length} rocks.`);
        Logger.end(funcName);
    }

    getTerrainHeight(x, z) {
        const scale = 0.01; // Controls the frequency of the noise
        const amplitude = 50; // Controls the height of the terrain
        let height = this.procGen.simplex2D(x * scale, z * scale) * amplitude;

        // Add craters
        for (const crater of this.craters) {
            const dx = x - crater.x;
            const dz = z - crater.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            if (distance < crater.radius) {
                height -= crater.depth * (1 - distance / crater.radius);
            }
        }

        return height;
    }

    getDensity(x, z) {
        const scale = 0.005; // Controls the frequency of the density map
        return this.procGen.simplex2D(x * scale + 1000, z * scale + 1000); // Offset to get different noise
    }

    generateCraters(count) {
        const funcName = 'PlanetSurfaceGenerator.generateCraters';
        Logger.start(funcName, { count });
        const craters = [];
        const seeds = (this.planetData && this.planetData.seeds) ? this.planetData.seeds : [0.1, 0.2, 0.3, 0.4];
        for (let i = 0; i < count; i++) {
            craters.push({
                x: (this.procGen.createPRNG([...seeds, i, 0.1].join(',')).nextDouble() - 0.5) * 500,
                z: (this.procGen.createPRNG([...seeds, i, 0.2].join(',')).nextDouble() - 0.5) * 500,
                radius: this.procGen.createPRNG([...seeds, i, 0.3].join(',')).nextDouble() * 20 + 10,
                depth: this.procGen.createPRNG([...seeds, i, 0.4].join(',')).nextDouble() * 10 + 5,
            });
        }
        Logger.end(funcName, `Generated ${craters.length} craters.`);
        return craters;
    }
    generateRocks(count) {
        const funcName = 'PlanetSurfaceGenerator.generateRocks';
        Logger.start(funcName, { count });
        const rocks = [];
        const seeds = (this.planetData && this.planetData.seeds) ? this.planetData.seeds : [0.1, 0.2, 0.3, 0.4];
        for (let i = 0; i < count; i++) {
            rocks.push({
                x: (this.procGen.createPRNG([...seeds, i, 0.5].join(',')).nextDouble() - 0.5) * 500,
                z: (this.procGen.createPRNG([...seeds, i, 0.6].join(',')).nextDouble() - 0.5) * 500,
                size: this.procGen.createPRNG([...seeds, i, 0.7].join(',')).nextDouble() * 2 + 1,
            });
        }
        Logger.end(funcName, `Generated ${rocks.length} rocks.`);
        return rocks;
    }
}
