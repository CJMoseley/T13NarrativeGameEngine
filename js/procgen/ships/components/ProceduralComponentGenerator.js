import Logger from '@/js/core/Logger.js';
import { ComponentDefs } from '@/js/procgen/ships/components/ComponentDefs.js';
import ProcGen from '@/js/procgen/ProcGen.js';
import { ComponentLoreGenerator } from '@/js/procgen/lore/factories/ComponentLoreGenerator.js';

const SHAPE_OPTIONS = {
    'fuselage': ['box', 'cylinder', 'capsule'],
    'engine': ['capsule', 'cone', 'cylinder', 'box'],
    'wing': ['wedge', 'box'],
    'cockpit': ['ellipsoid', 'sphere', 'box'],
    'weapon': ['cylinder', 'box'],
    'sensor': ['sphere', 'dodecahedron', 'icosahedron'],
    'shield': ['torus', 'sphere'],
    'generator': ['box', 'cylinder', 'sphere'],
    'vortex': ['torus', 'dodecahedron', 'cone'],
    'default': ['box', 'sphere', 'tetrahedron']
};

export class ProceduralComponentGenerator {
    constructor(pluginManager = null) {
        this.pluginManager = pluginManager;
        this.loreGenerator = new ComponentLoreGenerator();
    }

    async generateComponent(template, corporation, species, techLevel, usage, seed = Date.now()) {
        const funcName = 'ProceduralComponentGenerator.generateComponent';
        const effectiveUsage = usage || template.usage || 'default';
        const corpName = corporation.name || corporation || 'Generic Systems';

        Logger.start(funcName, { templateName: template.name, corporation: corpName, techLevel, usage: effectiveUsage, seed });

        // Initialize PRNG
        const prng = ProcGen.createPRNG(seed);

        // 1. Determine Shape
        const possibleShapes = SHAPE_OPTIONS[effectiveUsage] || SHAPE_OPTIONS['default'];
        const shapeType = possibleShapes[Math.floor(prng.nextDouble() * possibleShapes.length)];

        // 2. Determine Dimensions (Procedural variation)
        // Generate a numeric seed for noise functions from the provided seed if it's a string
        let noiseSeed = typeof seed === 'number' ? seed : 0;
        if (typeof seed === 'string') {
            for (let i = 0; i < seed.length; i++) noiseSeed += seed.charCodeAt(i);
        }

        // Vary all dimensions by a variable amount using Galactic Noise (ProcGen)
        const getNoiseScale = (offset) => {
            // Combine 2 noise values together for each dimension
            const n1 = ProcGen.simplex2D(noiseSeed * 0.01 + offset, techLevel);
            const n2 = ProcGen.simplex2D(noiseSeed * 0.05 + offset + 100, techLevel * 2);
            const combined = (n1 + n2) * 0.5; 
            return 1.0 + (combined * 0.25); // +/- 25% variation
        };

        const scaleX = getNoiseScale(0);
        const scaleY = getNoiseScale(1000);
        const scaleZ = getNoiseScale(2000);

        const dims = this._generateDims(shapeType, effectiveUsage, scaleX, scaleY, scaleZ, prng);

        // 3. Generate Harmonic Profile
        const harmonics = this._generateHarmonics(techLevel, effectiveUsage, shapeType, prng);

        // 4. Determine Traits (idBits) based on usage and techLevel
        const traits = this._determineTraits(effectiveUsage, techLevel);

        // 5. Generate Name and Description
        const { name, description } = this.loreGenerator.generateIdentity(corpName, effectiveUsage, techLevel, shapeType, traits, prng);

        let finalDescription = description;
        if (this.pluginManager) {
            const T13NE = this.pluginManager.getApi('T13', 'T13NE');
            const T13Geometry = T13NE ? T13NE.getModule('T13Geometry') : null;
            if (T13Geometry) {
                const geo = T13Geometry.calculateFullGeo(name);
                const facadeGeo = T13Geometry.Geometries[geo.Facade];
                if (facadeGeo && facadeGeo.Descendant_Description) {
                    finalDescription += ` ${facadeGeo.Descendant_Description}`;
                }
            }
        }

        // 6. Calculate Physics Properties
        const volume = this._calculateVolume(shapeType, dims);
        const density = this._calculateDensity(traits);
        const integrityMult = this._calculateIntegrityMultiplier(traits);

        const component = {
            name: name,
            description: finalDescription,
            proxyShape: shapeType,
            dims: dims,
            harmonics: harmonics,
            wiringNodes: Math.floor(prng.nextDouble() * 3) + 1, // 1-3 connection points
            stats: {
                integrity: 100 * ((scaleX + scaleY + scaleZ) / 3) * integrityMult,
                mass: volume * density,
                efficiency: 0.8 + (techLevel * 0.02)
            },
            idBits: traits
        };

        Logger.end(funcName, component);
        return component;
    }

    _determineTraits(usage, techLevel) {
        let traits = 0n;
        const u = usage.toLowerCase();

        // Material Traits based on Tech Level (Simplified logic)
        if (techLevel >= 9) traits |= ComponentDefs.MATERIALS.DARK_MATTER;
        else if (techLevel >= 7) traits |= ComponentDefs.MATERIALS.HYPERDENSE;
        else if (techLevel >= 5) traits |= ComponentDefs.MATERIALS.NANO_ALLOYS;
        else if (techLevel >= 3) traits |= ComponentDefs.MATERIALS.POLYMER;
        else traits |= ComponentDefs.MATERIALS.METAL;

        // Task Traits based on Usage
        if (u.includes('engine') || u.includes('thruster')) traits |= ComponentDefs.TASKS.THRUSTERS | ComponentDefs.TASKS.ACCELERATOR;
        if (u.includes('fuselage') || u.includes('hull')) traits |= ComponentDefs.TASKS.PHYSICAL_STABILIZATION;
        if (u.includes('wing') || u.includes('fin')) traits |= ComponentDefs.TASKS.GIMBAL | ComponentDefs.TASKS.PHYSICAL_STABILIZATION;
        if (u.includes('cockpit') || u.includes('bridge')) traits |= ComponentDefs.TASKS.LIFE_SUPPORT | ComponentDefs.TASKS.COMPUTATION;
        if (u.includes('weapon') || u.includes('turret')) traits |= ComponentDefs.TASKS.WEAPON;
        if (u.includes('sensor') || u.includes('radar')) traits |= ComponentDefs.TASKS.SENSORS;
        if (u.includes('shield')) traits |= ComponentDefs.TASKS.SHIELD | ComponentDefs.TASKS.DEFENCE;
        if (u.includes('generator') || u.includes('reactor')) traits |= ComponentDefs.TASKS.GENERATION | ComponentDefs.TASKS.ELECTRICAL;
        if (u.includes('vortex')) traits |= ComponentDefs.TASKS.WORMHOLE | ComponentDefs.TASKS.FREQUENCY_CHANGING;

        return traits;
    }

    _generateDims(type, usage, scaleX, scaleY, scaleZ, prng) {
        const baseSize = (usage === 'fuselage') ? 3 : 1;
        const d = {};
        
        switch (type) {
            case 'box':
                d.width = baseSize * scaleX * (0.5 + prng.nextDouble());
                d.height = baseSize * scaleY * (0.5 + prng.nextDouble());
                d.depth = baseSize * scaleZ * (0.5 + prng.nextDouble());
                break;
            case 'capsule':
            case 'cylinder':
            case 'cone':
                // Average X and Z for radius to maintain some symmetry, Y for length
                const avgRadScale = (scaleX + scaleZ) / 2;
                d.radius = (baseSize / 2) * avgRadScale * (0.8 + prng.nextDouble() * 0.4);
                d.length = baseSize * scaleY * (1.0 + prng.nextDouble());
                d.height = d.length; // Cone uses height
                d.radiusTop = d.radius;
                d.radiusBottom = d.radius; // Cylinder
                break;
            case 'ellipsoid':
                d.width = baseSize * scaleX;
                d.height = baseSize * scaleY * 0.6;
                d.length = baseSize * scaleZ * 1.2;
                break;
            case 'torus':
                d.radius = baseSize * ((scaleX + scaleY) / 2);
                d.tube = baseSize * scaleZ * 0.2;
                break;
            case 'wedge':
                d.width = baseSize * scaleX;
                d.length = baseSize * scaleZ;
                d.depth = baseSize * scaleY * 0.2;
                break;
            default:
                d.radius = (baseSize / 2) * ((scaleX + scaleY + scaleZ) / 3);
        }
        return d;
    }

    _generateHarmonics(techLevel, usage, shape, prng) {
        // Base resonance frequency (Hz)
        let baseResonance = 50 + prng.nextDouble() * 400;
        
        // Shape influence
        if (shape === 'sphere' || shape === 'icosahedron') baseResonance *= 1.5; // Higher resonance
        if (shape === 'box') baseResonance *= 0.8; // Damping

        // Usage influence
        if (usage === 'engine') baseResonance *= 2.0; // High energy
        if (usage === 'fuselage') baseResonance *= 0.5; // Structural damping
        if (usage === 'generator') baseResonance *= 0.9; // Low hum
        if (usage === 'vortex') baseResonance *= 3.0; // High frequency instability

        return {
            resonanceFrequency: baseResonance,
            damping: 0.1 + (prng.nextDouble() * 0.2),
            conductivity: 0.5 + (techLevel * 0.05),
            noiseFloor: prng.nextDouble() * 0.1
        };
    }

    _calculateVolume(shape, dims) {
        // Returns volume in cubic meters (approximate)
        switch (shape) {
            case 'box':
                return (dims.width || 1) * (dims.height || 1) * (dims.depth || 1);
            case 'sphere':
            case 'icosahedron':
            case 'dodecahedron':
            case 'octahedron':
            case 'tetrahedron':
                return (4 / 3) * Math.PI * Math.pow(dims.radius || 1, 3);
            case 'ellipsoid':
                // Volume of ellipsoid = 4/3 * PI * a * b * c (where a,b,c are radii)
                // dims are diameters/lengths, so divide by 2
                return (4 / 3) * Math.PI * ((dims.width || 1) / 2) * ((dims.height || 1) / 2) * ((dims.length || 1) / 2);
            case 'cylinder':
            case 'cone':
            case 'truncatedCone':
            case 'prism':
                // V = 1/3 * PI * h * (r1^2 + r2^2 + r1*r2) for general frustum
                // For cylinder r1=r2, becomes PI*r^2*h
                const r1 = dims.radiusTop !== undefined ? dims.radiusTop : (dims.radius || 0.5);
                const r2 = dims.radiusBottom !== undefined ? dims.radiusBottom : (dims.radius || 0.5);
                const h = dims.height || dims.length || 1;
                return (1 / 3) * Math.PI * h * (r1 * r1 + r2 * r2 + r1 * r2);
            case 'capsule':
                // Cylinder + Sphere (2 hemispheres)
                const rc = dims.radius || 0.5;
                const len = dims.length || dims.height || 1;
                // Assuming length is total length, cylinder part is len - 2*r
                const cylH = Math.max(0, len - 2 * rc);
                return (Math.PI * rc * rc * cylH) + ((4 / 3) * Math.PI * rc * rc * rc);
            case 'torus':
                // V = (PI * r^2) * (2 * PI * R)
                // dims.radius is major radius R, dims.tube is minor radius r
                return (Math.PI * Math.pow(dims.tube || 0.2, 2)) * (2 * Math.PI * (dims.radius || 1));
            case 'wedge':
                // Triangular prism approx: 0.5 * b * h * l
                return 0.5 * (dims.width || 1) * (dims.length || 1) * (dims.depth || 1);
            default:
                return 1;
        }
    }

    _calculateDensity(traits) {
        // Density in kg/m^3
        if (traits & ComponentDefs.MATERIALS.DARK_MATTER) return 1000000; // Extremely heavy
        if (traits & ComponentDefs.MATERIALS.HYPERDENSE) return 50000; // Sci-fi heavy
        if (traits & ComponentDefs.MATERIALS.NANO_ALLOYS) return 3500; // Strong but light
        if (traits & ComponentDefs.MATERIALS.CRYSTALLINE) return 2600;
        if (traits & ComponentDefs.MATERIALS.METAL) return 7800; // Steel
        if (traits & ComponentDefs.MATERIALS.POLYMER) return 1200;
        return 1000; // Organic/Default
    }

    _calculateIntegrityMultiplier(traits) {
        if (traits & ComponentDefs.MATERIALS.DARK_MATTER) return 20.0;
        if (traits & ComponentDefs.MATERIALS.HYPERDENSE) return 10.0;
        if (traits & ComponentDefs.MATERIALS.NANO_ALLOYS) return 3.0;
        if (traits & ComponentDefs.MATERIALS.METAL) return 1.5;
        return 1.0;
    }
}
