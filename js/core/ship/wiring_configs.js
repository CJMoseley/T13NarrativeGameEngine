/* LEGACY CODE - MOVED TO src/t13ne/core/

// js/core/wiring_configs.js

/**
 * Defines the properties and characteristics for different types of wiring and conduits.
 * These properties will influence how harmonics are calculated.
 * Scientific accuracy is aimed for, but simplified for game mechanics.
 */
const WiringConfigs = {
    electrical: {
        type: "electrical",
        baseResistancePerUnitLength: 0.01, // Ohms/meter
        baseCapacitancePerUnitLength: 10e-12, // Farads/meter
        baseInductancePerUnitLength: 1e-6, // Henrys/meter
        frequencyResponse: {
            low: 0.8, // Factor for low frequencies
            mid: 1.0, // Factor for mid frequencies
            high: 0.9  // Factor for high frequencies (attenuates faster)
        },
        harmonicMultiplier: 1.0, // Base multiplier for harmonic complexity
        color: 0xffff00 // Yellow
    },
    plasma_conduit: {
        type: "plasma_conduit",
        baseResistancePerUnitLength: 0.001, // Lower resistance for plasma flow
        baseCapacitancePerUnitLength: 5e-12, // Different capacitance
        baseInductancePerUnitLength: 2e-6, // Different inductance
        frequencyResponse: {
            low: 0.6, // Plasma attentuates at lower frequencies
            mid: 1.0, //    standard response
            high: 1.6  // Significant resonance for very high frequencies
        },
        harmonicMultiplier: 1.5, // Plasma conduits might inherently have more complex harmonics
        color: 0x00ffff // Cyan
    },
    fiber_optic: { // Suitable for data transmission and control lines
        type: "fiber_optic",
        baseResistancePerUnitLength: 0.00001, // Very low resistance
        baseCapacitancePerUnitLength: 1e-15,
        baseInductancePerUnitLength: 1e-10,
        frequencyResponse: {
            low: 1.0, // standard response
            mid: 1.3, // enhanced response at mid frequencies
            high: 1.0 // standard response
        },
        harmonicMultiplier: 0.8, // Maybe less complex harmonics due to digital nature
        color: 0x00ff00 // Green
    },
    bio_neural: { // Organic or semi-sentient ships
        type: "bio_neural",
        baseResistancePerUnitLength: 0.05,
        baseCapacitancePerUnitLength: 50e-12,
        baseInductancePerUnitLength: 0.1e-6,
        frequencyResponse: {
            low: 1.2,
            mid: 0.8,
            high: 0.4
        },
        harmonicMultiplier: 2.0, // Highly complex, chaotic harmonics
        color: 0xff00ff // Magenta
    },
    superconductor: { // High-tech, efficient
        type: "superconductor",
        baseResistancePerUnitLength: 0.0000001,
        baseCapacitancePerUnitLength: 1e-12,
        baseInductancePerUnitLength: 1e-6,
        frequencyResponse: {
            low: 1.0,
            mid: 1.0,
            high: 1.0
        },
        harmonicMultiplier: 0.1, // Very pure signal
        color: 0xaaaaff // Pale Blue
    },
    fuel_pipe: { // Chemical fuel transport
        type: "fuel_pipe",
        baseResistancePerUnitLength: 0.05, // Fluid resistance/viscosity
        baseCapacitancePerUnitLength: 0,
        baseInductancePerUnitLength: 0,
        frequencyResponse: {
            low: 1.0,
            mid: 1.0,
            high: 1.0
        },
        harmonicMultiplier: 0.5, // Mechanical vibration mostly
        color: 0xffaa00 // Orange
    },
    data: { // General data interconnects
        type: "data",
        baseResistancePerUnitLength: 0.005,
        baseCapacitancePerUnitLength: 2e-12,
        baseInductancePerUnitLength: 1e-7,
        frequencyResponse: {
            low: 1.0,
            mid: 1.2,
            high: 1.1
        },
        harmonicMultiplier: 0.9,
        color: 0x0088ff // Azure
    },
    power: { // General power distribution
        type: "power",
        baseResistancePerUnitLength: 0.002,
        baseCapacitancePerUnitLength: 5e-11,
        baseInductancePerUnitLength: 5e-7,
        frequencyResponse: {
            low: 1.1,
            mid: 1.0,
            high: 0.8
        },
        harmonicMultiplier: 1.1,
        color: 0xff4400 // Red-Orange
    }
};

export default WiringConfigs;

*/