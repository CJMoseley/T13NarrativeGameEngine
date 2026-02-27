import { LoreData } from '../LoreData.js';
import Logger from '/src/t13ne/core/Logger.js';
import ProcGen from '/src/t13ne/procgen/ProcGen.js';

export class ResourceFactory {
    constructor(pluginManager) {
        const funcName = 'ResourceFactory.constructor';
        this.pluginManager = pluginManager;
        Logger.start(funcName);
        // Define material categories based on astronomical abundance and formation zones
        this.categories = {
            // Refractory materials (high melting point), common in inner system
            metals: ['Iron', 'Nickel', 'Copper', 'Titanium', 'Aluminum', 'Cobalt', 'Tungsten'],
            heavyMetals: ['Gold', 'Platinum', 'Lead', 'Uranium', 'Plutonium', 'Iridium', 'Osmium'],
            rareEarths: ['Neodymium', 'Lanthanum', 'Yttrium', 'Scandium'],
            
            // Minerals and Silicates
            minerals: ['Silicates', 'Quartz', 'Feldspar', 'Basalt', 'Olivine', 'Pyroxene', 'Graphite'],
            gemstones: ['Diamond', 'Ruby', 'Sapphire', 'Emerald', 'Opals'],
            
            // Volatiles (low melting point), common in outer system
            ices: ['Water Ice', 'Dry Ice (CO2)', 'Ammonia Ice', 'Methane Ice', 'Nitrogen Ice'],
            gases: ['Hydrogen', 'Helium', 'Methane', 'Ammonia', 'Nitrogen', 'Helium-3'],
            liquids: ['Water', 'Liquid Methane', 'Liquid Ammonia', 'Hydrocarbons'],
            
            // Special
            exotic: ['Dark Matter Traces', 'Exotic Matter', 'Zero-Point Residue', 'Void Crystals', 'Hyper-dense Alloys']
        };
        
        // Ensure all categories are valid arrays to prevent runtime errors
        for (const key in this.categories) {
            if (!Array.isArray(this.categories[key])) {
                this.categories[key] = [];
            }
        }
        Logger.end(funcName);
    }

    generateResources(planetType, orbitalDistance, starData, prng) {
        const funcName = 'ResourceFactory.generateResources';
        Logger.start(funcName, { planetType, orbitalDistance, starClass: starData?.starClass });
        
        if (!prng || typeof prng.nextDouble !== 'function') {
            Logger.warn(`${funcName}: Invalid PRNG provided. Using deterministic fallback.`);
            prng = ProcGen.createPRNG(planetType + orbitalDistance + (starData?.starClass || ''));
        }

        if (!planetType) {
            Logger.warn(`${funcName}: planetType is undefined. Defaulting to 'Terrestrial'.`);
            planetType = 'Terrestrial';
        }

        const T13NE = this.pluginManager ? this.pluginManager.getApi('T13', 'T13NE') : null;
        const Sway = T13NE ? T13NE.getModule('Sway') : null;

        const resources = [];
        const usedMaterials = new Set(); // Prevent duplicate materials on the same planet

        // 1. Analyze System Context
        const FROST_LINE = 25;
        const isInnerSystem = orbitalDistance < FROST_LINE;
        const isOuterSystem = orbitalDistance >= FROST_LINE;
        const starClass = starData ? starData.starClass : 'G';
        const isHighMetallicity = ['O', 'B', 'A', 'G'].some(c => starClass.startsWith(c));
        Logger.message(`${funcName}: Context - Inner System: ${isInnerSystem}, High Metallicity: ${isHighMetallicity}`);

        // 2. Determine Deposit Counts
        // Clamp counts to reasonable values to prevent runaway loops if PRNG is broken
        const numMajor = Math.min(5, Math.floor(prng.nextDouble() * 2.5)); 
        const numMinor = Math.min(10, Math.floor(prng.nextDouble() * 3) + 1);
        const numTrace = Math.min(15, Math.floor(prng.nextDouble() * 4) + 1);
        Logger.message(`${funcName}: Deposit counts - Major: ${numMajor}, Minor: ${numMinor}, Trace: ${numTrace}`);

        // 3. Build Weighted Pools based on Planet Type
        let primaryPool = [], secondaryPool = [], tracePool = [];

        if (planetType.includes('Gas') || planetType.includes('Giant')) {
            primaryPool = [...this.categories.gases];
            secondaryPool = [...this.categories.ices, ...this.categories.liquids];
            tracePool = [...this.categories.metals, ...this.categories.exotic];
        } else if (planetType.includes('Ice')) {
            primaryPool = [...this.categories.ices];
            secondaryPool = [...this.categories.liquids, ...this.categories.gases];
            tracePool = [...this.categories.minerals, ...this.categories.metals];
        } else if (planetType.includes('Volcanic') || planetType.includes('Lava')) {
            primaryPool = [...this.categories.metals, 'Sulfur'];
            secondaryPool = [...this.categories.minerals, ...this.categories.heavyMetals];
            tracePool = [...this.categories.gemstones, ...this.categories.rareEarths];
        } else if (planetType.includes('Ocean')) {
            primaryPool = ['Water'];
            secondaryPool = ['Salt', ...this.categories.minerals];
            tracePool = [...this.categories.metals, ...this.categories.gases];
        } else if (planetType.includes('Desert') || planetType.includes('Barren')) {
            primaryPool = [...this.categories.minerals, ...this.categories.metals];
            secondaryPool = [...this.categories.rareEarths];
            tracePool = isInnerSystem ? [] : [...this.categories.ices];
        } else if (planetType.includes('Asteroid') || planetType.includes('Trojan')) {
            primaryPool = [...this.categories.metals, ...this.categories.minerals];
            secondaryPool = [...this.categories.heavyMetals, ...this.categories.rareEarths];
            tracePool = [...this.categories.ices, ...this.categories.gemstones];
        } else {
            // Terrestrial / Generic
            primaryPool = [...this.categories.minerals, ...this.categories.metals];
            secondaryPool = [...this.categories.liquids, ...this.categories.gases];
            tracePool = [...this.categories.rareEarths, ...this.categories.heavyMetals];
        }
        Logger.message(`${funcName}: Initial Pools - Primary: ${primaryPool.length}, Secondary: ${secondaryPool.length}, Trace: ${tracePool.length}`);

        // 4. Apply Astronomical Modifiers
        if (isInnerSystem) {
            if (!planetType.includes('Gas')) {
                primaryPool = primaryPool.filter(m => !this.categories.ices.includes(m) && !this.categories.gases.includes(m));
                secondaryPool = secondaryPool.filter(m => !this.categories.ices.includes(m));
            }
            if (isHighMetallicity) {
                secondaryPool.push(...this.categories.heavyMetals);
            }
            Logger.message(`${funcName}: Applied Inner System modifiers.`);
        } else if (isOuterSystem) {
            if (!planetType.includes('Star')) {
                secondaryPool.push(...this.categories.ices);
            }
            Logger.message(`${funcName}: Applied Outer System modifiers.`);
        }

        // 5. Selection Helper
        const selectResources = (pool, count, label) => {
            const selectionFuncName = `${funcName}.selectResources`;
            Logger.start(selectionFuncName, { label, count, poolSize: pool.length });

            // Filter out undefined/null from the start to prevent selection errors
            let available = pool.filter(m => m && !usedMaterials.has(m));
            Logger.message(`${selectionFuncName}: Initial pool size: ${pool.length}, Available after filter: ${available.length}`);
            
            if (available.length === 0) {
                Logger.warn(`${selectionFuncName}: Pool for '${label}' is empty or exhausted. Using fallback.`);
                available = ['Common Rock', 'Silicates'].filter(m => !usedMaterials.has(m));
            }

            let attempts = 0;
            const maxAttempts = count * 5 + 20; // Safety break to prevent infinite loops

            for (let i = 0; i < count; i++) {
                attempts++;
                if (attempts > maxAttempts) {
                    Logger.error(`${selectionFuncName}: Max attempts reached. Breaking loop to prevent hang.`);
                    break;
                }

                if (available.length === 0) {
                    Logger.message(`${selectionFuncName}: No more unique materials available in pool.`);
                    break;
                }
                
                let rand = prng.nextDouble();
                if (typeof rand !== 'number' || isNaN(rand)) {
                     Logger.warn(`${selectionFuncName}: PRNG returned invalid value ${rand}. Using fixed fallback.`);
                     rand = 0.5;
                }

                // Ensure index is valid
                let index = Math.floor(rand * available.length);
                if (index >= available.length) index = available.length - 1; // Strictly clamp

                const material = available[index];
                
                if (!material) {
                    // This implies available array has holes or logic error, but we must not loop forever
                    Logger.error(`${selectionFuncName}: CRITICAL: Undefined material at index ${index} (len: ${available.length}). Available: ${JSON.stringify(available)}`);
                    break; 
                }

                let resourceObj = {
                    name: material,
                    grade: label,
                    value: 1, // Default Chi value
                    description: `${material} (${label})`
                };
                
                if (Sway) {
                    const amount = Math.floor(prng.nextDouble() * 100) || 1;
                    const grade = Sway.gradeResource(amount);
                    resourceObj.grade = grade.grade;
                    resourceObj.value = grade.chi;
                    // Description keeps the name clean, value is hidden
                    resourceObj.description = `${material} - ${grade.grade}`; 
                }
                
                resources.push(resourceObj);
                usedMaterials.add(material);
                available.splice(index, 1);
                Logger.message(`${selectionFuncName}: Selected '${material}' (Chi: ${resourceObj.value}) for ${label} deposit.`);
            }
            Logger.end(selectionFuncName);
        };

        // 6. Generate
        selectResources(primaryPool, numMajor, 'Major');
        selectResources(secondaryPool, numMinor, 'Minor');
        selectResources(tracePool, numTrace, 'Trace');

        Logger.end(funcName, resources);
        return resources;
    }
}