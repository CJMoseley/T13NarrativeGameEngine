import Logger from '../../core/Logger.js';
import ProcGen  from '../ProcGen.js';

export class VegetationGenerator {
    constructor(planetData, procGen) {
        const funcName = 'VegetationGenerator.constructor';
        Logger.start(funcName);
        this.planetData = planetData;
        this.procGen = procGen || ProcGen;
        Logger.end(funcName);
    }

    _getSeededRandom(seedParts) {
        // Low-level utility, skipping logging to avoid noise.
        const prng = this.procGen.createPRNG(seedParts.join(','));
        return prng.nextDouble();
    }

    generateTrees(count, densityMap, terrainGenerator) {
        const funcName = 'VegetationGenerator.generateTrees';
        Logger.start(funcName, { count });
        const trees = [];
        const seeds = (this.planetData && this.planetData.seeds) ? this.planetData.seeds : [0.1, 0.2, 0.3, 0.4];
        for (let i = 0; i < count; i++) {
            const x = this._getSeededRandom([...seeds, i, 0.1]) * 500 - 250;
            const z = this._getSeededRandom([...seeds, i, 0.2]) * 500 - 250;
            if (densityMap.getDensity(x, z) > 0.5) {
                trees.push(this.generateTree(x, z, terrainGenerator));
            }
        }
        Logger.end(funcName, `Generated ${trees.length} trees.`);
        return trees;
    }

    generateTree(x, z, terrainGenerator) {
        const funcName = 'VegetationGenerator.generateTree';
        Logger.start(funcName, { x, z });
        const y = terrainGenerator.getTerrainHeight(x, z);
        const position = { x, y, z };
        const seeds = (this.planetData && this.planetData.seeds) ? this.planetData.seeds : [0.1, 0.2, 0.3, 0.4];
        const height = this._getSeededRandom([...seeds, x, z, 0.3]) * 10 + 5;
        const branches = this.generateBranches(position, height, 3);
        const tree = { position, height, branches };
        Logger.end(funcName, `Tree generated at y=${y.toFixed(2)}`);
        return tree;
    }

    generateBranches(position, height, depth) {
        // Recursive and potentially noisy, so we'll skip logging here for now.
        if (depth === 0) {
            return [];
        }

        const branches = [];
        const seeds = (this.planetData && this.planetData.seeds) ? this.planetData.seeds : [0.1, 0.2, 0.3, 0.4];
        const numBranches = Math.floor(this._getSeededRandom([...seeds, position.x, position.y, position.z, 0.4]) * 3) + 2;

        for (let i = 0; i < numBranches; i++) {
            const newHeight = height * (this._getSeededRandom([...seeds, position.x, i, 0.5]) * 0.4 + 0.4);
            const newPosition = {
                x: position.x + (this._getSeededRandom([...seeds, i, 0.6]) - 0.5) * height,
                y: position.y + height * 0.5,
                z: position.z + (this._getSeededRandom([...seeds, i, 0.7]) - 0.5) * height,
            };
            branches.push({
                position: newPosition,
                height: newHeight,
                branches: this.generateBranches(newPosition, newHeight, depth - 1),
            });
        }
        return branches;
    }
}
