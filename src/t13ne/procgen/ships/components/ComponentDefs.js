/**
 * Wormhole Racers Component Definition System
 * Source: [Documentation Sections: Component Definition, System Isolation, Bitwise Flags]
 * Purpose: Defines the comprehensive set of bitwise flags used to classify component 
 * requirements (Materials) and capabilities (Tasks).
 * Requirement: The full scope of component definitions must be represented for complex 
 * interactions and economic simulation.
 */
export const ComponentDefs = {
    // --- Materials/Requirements (What the component needs to operate/is made of) ---
    MATERIALS: {
        FUEL: 1n << 0n,
        METAL: 1n << 1n,
        NON_METAL: 1n << 2n,
        SEMI_CONDUCTOR: 1n << 3n,
        ELECTRICAL_CONDUCTOR: 1n << 4n,
        PLASMA_WAVEGUIDE: 1n << 5n,
        POLYMER: 1n << 6n,
        ORGANIC: 1n << 7n,
        RADIOACTIVE: 1n << 8n,
        PSYCHOACTIVE: 1n << 9n,
        CATALYST: 1n << 10n,
        NANO_ALLOYS: 1n << 11n,
        CRYSTALLINE: 1n << 12n,
        HYPERDENSE: 1n << 13n,
        DARK_MATTER: 1n << 14n // Adjusted index to avoid collision if mixed
    },

    // --- Component Task Bits (What the component does) ---
    // Shifting by 14 to continue the sequence from materials if combined in a single integer.
    TASKS: {
        GENERATION: 1n << 14n,          // Creates energy/resource
        CONSUMER: 1n << 15n,            // Uses energy/resource
        WORMHOLE: 1n << 16n,            // Necessary for wormhole travel/manipulation
        SHIELD: 1n << 17n,              // Generates a protective field
        ACCELERATOR: 1n << 18n,         // Provides forward thrust
        BRAKE: 1n << 19n,               // Provides deceleration
        GIMBAL: 1n << 20n,              // Provides rotational control
        THRUSTERS: 1n << 21n,           // Provides movement/propulsion (general)
        BIOCHEMICAL: 1n << 22n,         // Performs biological/chemical processing
        CHEMICAL: 1n << 23n,            // Performs non-biological chemical processing
        ELECTRICAL: 1n << 24n,          // Provides or uses electrical power
        PLASMA: 1n << 25n,              // Uses or generates plasma
        LASER: 1n << 26n,               // Directed energy weapon/tool
        GRAVITY: 1n << 27n,             // Generates or nullifies gravity
        LIFE_SUPPORT: 1n << 28n,        // Essential crew system
        COMPUTATION: 1n << 29n,         // Data processing/AI
        SENSORS: 1n << 30n,             // Gathers environmental data
        MAGNETIC: 1n << 31n,            // Generates magnetic fields
        BIO_PRINTER: 1n << 32n,         // Creates organic material
        THREE_D_PRINTER: 1n << 33n,     // Creates non-organic material
        SCOOP: 1n << 34n,               // Resource collection
        TELEPORTER: 1n << 35n,          // Instantaneous repositioning
        WEAPON: 1n << 36n,              // General offensive capability
        HARPOON: 1n << 37n,             // Retrieval/Tethering system
        MOMENTUM_NULLIFIER: 1n << 38n,  // Emergency stop system
        SHIELD_SLIDE: 1n << 39n,        // Shield manipulation for horizontal movement
        SHIELD_RELEASE: 1n << 40n,      // Shield manipulation for jump/bounce
        TRACTION_CONTROL: 1n << 41n,    // Shield manipulation for grip/roll control
        DARK_ENERGY: 1n << 42n,         // Utilizes dark energy source
        PROJECTOR: 1n << 43n,           // Creates persistent field/object
        DISRUPTER: 1n << 44n,           // Interferes with opponent systems
        TARGETING: 1n << 45n,           // Weapon/Sensor guidance
        DEFENCE: 1n << 46n,             // General defensive capability
        FREQUENCY_CHANGING: 1n << 47n,  // Adjusts component frequency (key to wormhole interaction)
        TACHYONS: 1n << 48n,            // Exceeds light speed/time manipulation
        PHYSICAL_STABILIZATION: 1n << 49n // Structural integrity/G-force compensation
    },

    // PLACEHOLDER: Future systems will require mapping Bitwise Flags to UI representations (icons, Colour codes).
    UI_MAP: {
        // ELECTRICAL: { icon: '⚡', colour: '#4331e2ff' }
    }
};