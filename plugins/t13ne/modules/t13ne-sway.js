/**
 * @module Plugins/T13Ne/Sway
 * @description
 * This module handles the "Sway" system in T13NE, which is related to resource conversion,
 * potency levels, and descriptive naming of facets.
 */

import T13NE_SwayData from '../modules/t13ne-sway-data.js';
import Logger from '@/src/t13ne/core/Logger.js';
import T13Tapestry from '../modules/T13Tapestry.js';

let T13Boons; // Will be imported dynamically
let currentTapestry = null;

const TAPESTRY_LEVELS = {
    BANAL: 'Banal',
    INTREPID: 'Intrepid',
    BOLD: 'Bold',
    MONSTROUS: 'Monstrous',
    TWISTED: 'Twisted'
};

const FACET_SWAY_NAMES = {
    'Awe': 'Splendour',
    'Burden': 'Wealth',
    'Craft': 'Knacks',
    'Dominion': 'Support',
    'Enigma': 'Covers',
    'Fury': 'Surges',
    'Gossamer': 'Breath',
    'Heresy': 'Guises',
    'Inertia': 'Endurance',
    'Jeer': 'Cheers',
    'Key': 'Insight',
    'Liberty': 'Hopes',
    'Miasma': 'Taint',
    'Nature': 'Health',
    'Orthodox': 'Facts',
    'Phoenix': 'Fevers',
    'Quiet': 'Serenity',
    'Rook': 'Securities',
    'Sin': 'Lapses',
    'Trial': 'Plays',
    'Virtue': 'Merits',
    'Wyrd': 'Axioms',
    'Yonder': 'Scopes',
    'Zeal': 'Verve'
};

/**
 * Initializes the Sway module and its dependencies.
 * @async
 */
async function initialize() {
    await T13NE_SwayData.loadSwayData();
    currentTapestry = new T13Tapestry();
    try {
        const { default: Boons } = await import('./t13ne-boon.js');
        T13Boons = Boons;
        Logger.message("T13NE Sway: T13Boons module loaded.");
    } catch (error) {
        Logger.error("T13NE Sway: Failed to load T13Boons module", error);
    }
}

/**
 * Sets the current tapestry for the Sway module.
 * @param {T13Tapestry} newTapestry - The new tapestry to use.
 */
function setTapestry(newTapestry) {
    if (newTapestry instanceof T13Tapestry) {
        currentTapestry = newTapestry;
        Logger.message("T13NE Sway: Tapestry updated.");
    } else {
        Logger.error("T13NE Sway: Invalid tapestry provided. Must be an instance of T13Tapestry.");
    }
}

/**
 * Gets the current tapestry.
 * @returns {T13Tapestry} The current tapestry.
 */
function getTapestry() {
    return currentTapestry;
}

/**
 * Gets the sway name for a given facet name.
 * @param {string} facetName - The name of the facet.
 * @returns {string} The sway name for the facet.
 */
function getSwayName(facetName) {
    // Future: Check currentTapestry for overrides
    return FACET_SWAY_NAMES[facetName] || facetName;
}

/**
 * Gets the facet name for a given sway name.
 * @param {string} swayName - The name of the sway.
 * @returns {string|null} The facet name, or null if not found.
 */
function getFacetFromSway(swayName) {
    // Reverse lookup
    return Object.keys(FACET_SWAY_NAMES).find(key => FACET_SWAY_NAMES[key] === swayName) || null;
}

/**
 * Gets the potency level for a given boon value.
 * @param {number} boon - The boon value.
 * @returns {string} The potency level.
 */
function getPotencyForBoon(boon) {
    if (boon === 0) return 'Threadbare';
    if (boon >= 1 && boon <= 7) return TAPESTRY_LEVELS.BANAL;
    if (boon >= 8 && boon <= 15) return TAPESTRY_LEVELS.INTREPID;
    if (boon >= 16 && boon <= 21) return TAPESTRY_LEVELS.BOLD;
    if (boon >= 22 && boon <= 25) return TAPESTRY_LEVELS.MONSTROUS;
    if (boon >= 26) return TAPESTRY_LEVELS.TWISTED;
    return TAPESTRY_LEVELS.INTREPID;
}

/**
 * Converts an amount of one sway type to another using the Sway Conversion Table.
 * @param {string} fromType - The starting sway type (e.g., 'banal', 'intrepid', 'chi').
 * @param {string} toType - The target sway type.
 * @param {number} amount - The amount of the starting sway type.
 * @returns {number} The converted amount, with fractions discarded.
 */
function convert(fromType, toType, amount) {
    const swayTable = T13NE_SwayData.getSwayTable();
    if (!swayTable) return 0;

    let closestRow = swayTable.reduce((prev, curr) => {
        return (Math.abs(curr[fromType] - amount) < Math.abs(prev[fromType] - amount) ? curr : prev);
    });

    return Math.floor(closestRow[toType]);
}

/**
 * Converts a large pool of a single sway type to another.
 * @param {string} fromType - The starting sway potency (e.g., 'Banal', 'Intrepid').
 * @param {string} toType - The target sway type (e.g., 'Chi').
 * @param {number} amount - The amount of the starting sway type.
 * @returns {number} The converted amount.
 */
function convertPool(fromType, toType, amount) {
    if (toType === 'Chi') {
        if (fromType === 'Banal') {
            return T13Boons.getBoonFromValue(amount);
        }
        if (fromType === 'Intrepid') {
            return Math.floor(amount / 2);
        }
    }
    return amount; // Default for other conversions
}

/**
 * Retrieves the size description for a given value.
 * @param {number} value - The value to look up (usually Boon/Chi).
 * @param {string} [valueType='Chi'] - The type of the value (e.g., 'Chi', 'Banal').
 * @param {string} [context='Location'] - The context for the description ('Location', 'Group', 'Small', 'Limit', 'Extend').
 * @returns {string} The size description (e.g., "Tiny", "Huge").
 */
function getSizeDescription(value, valueType = 'Chi', context = 'Location') {
    const swayTable = T13NE_SwayData.getSwayTable();
    if (!swayTable || swayTable.length === 0) return "Unknown Size";

    let closestRow = swayTable.reduce((prev, curr) => {
        const currVal = Number(curr[valueType]) || 0;
        const prevVal = Number(prev[valueType]) || 0;
        return (Math.abs(currVal - value) < Math.abs(prevVal - value) ? curr : prev);
    });

    let column = 'Location_Size';
    switch (context) {
        case 'Pact':
        case 'Group':
            column = 'Group_Size';
            break;
        case 'Small':
        case 'Creature':
        case 'Object':
            column = 'Smaller_Size';
            break;
        case 'Limit':
        case 'Limit_Duration':
            column = 'Limit_Duration';
            break;
        case 'Duration':
        case 'Extend':
        case 'Extend_Duration':
            column = 'Extend_Duration';
            break;
        case 'Location':
        default:
            column = 'Location_Size';
            break;
    }

    return closestRow[column] || closestRow['Size'] || closestRow['Location_Size'] || "Unknown Size";
}

/**
 * Calculates the carrying capacity (max population) based on planet size (Chi).
 * Uses the Sway Sizes table to map location size to group size.
 * @param {number} planetSizeChi - The Chi value representing the planet's size (e.g., 21-25).
 * @param {number} [biosphereLevel=1] - Multiplier for biosphere richness (0.0 to 1.0+).
 * @returns {number} The carrying capacity in individuals.
 */
function calculateCarryingCapacity(planetSizeChi, biosphereLevel = 1) {
    // Approximate mapping based on sway_sizes.json logic
    // Chi 21: ~5 Billion, Chi 22: ~20 Billion, Chi 23: ~100 Billion
    let baseCapacity = 0;
    if (planetSizeChi <= 15) baseCapacity = 1000;
    else if (planetSizeChi <= 18) baseCapacity = 1000000;
    else if (planetSizeChi <= 20) baseCapacity = 1000000000;
    else if (planetSizeChi <= 21) baseCapacity = 5000000000;
    else if (planetSizeChi <= 22) baseCapacity = 20000000000;
    else if (planetSizeChi <= 23) baseCapacity = 100000000000;
    else if (planetSizeChi <= 24) baseCapacity = 500000000000;
    else baseCapacity = 1000000000000; // Chi 25+

    return Math.floor(baseCapacity * biosphereLevel);
}

/**
 * Calculates actual population based on carrying capacity, species success, and biomass %.
 * @param {number} carryingCapacity - Max population.
 * @param {number} successRate - 0.0 to 1.0 (Species success/tech level).
 * @param {number} biomassPercent - 0.0 to 1.0 (Percentage of biomass achieved).
 * @returns {number} Actual population.
 */
function calculatePopulation(carryingCapacity, successRate, biomassPercent) {
    // Earth humans are a tiny % of biomass but have high success.
    // We use a formula that rewards high success but respects biomass limits.
    // successRate acts as a utilization factor of the available capacity for that biomass niche.
    return Math.floor(carryingCapacity * successRate * (biomassPercent * 100)); 
}

/**
 * Grades a resource amount using Sway Chi levels.
 * @param {number} amount - The raw amount/abundance (0-100 scale).
 * @returns {object} { grade: string, chi: number, description: string }
 */
function gradeResource(amount) {
    // Map amount (0-100) to Chi (1-32)
    let chi = Math.ceil(amount / 3.5); 
    if (chi < 1) chi = 1;
    if (chi > 32) chi = 32;
    
    let grade = 'Trace';
    if (chi > 5) grade = 'Minor';
    if (chi > 12) grade = 'Major';
    if (chi > 20) grade = 'Abundant';
    if (chi > 26) grade = 'Rich';

    const potency = getPotencyForBoon(chi);
    return { grade, chi, description: `${grade} (${potency} - Chi ${chi})` };
}

/**
 * Gets the Area of Effect description for a given Chi cost.
 * @param {number} chi - The Chi cost/power of the field or weapon.
 * @returns {string} The Location Size description.
 */
function getAoE(chi) {
    return getSizeDescription(chi, 'Chi', 'Location');
}

/**
 * Calculates the cost for Magical Technology.
 * Adds a "Sway Tax" to the base tech cost.
 * @param {number} baseChi - The base Chi cost of the tech.
 * @param {boolean} isAlien - If true, adds alien complexity cost.
 * @returns {object} { totalChi: number, swayCost: number, description: string }
 */
function getMagicalTechCost(baseChi, isAlien = false) {
    // Magical tech uses Bold Sway rules (Chi) plus an Intrepid Sway tax (Half Chi)
    let swayTax = Math.ceil(baseChi / 2);
    if (isAlien) {
        // Alien tech adds a "Mystery" tax
        swayTax += Math.ceil(baseChi / 4);
    }
    const totalChi = baseChi + swayTax;
    return { 
        totalChi, 
        swayCost: swayTax, 
        description: `Base: ${baseChi} Chi + ${swayTax} Sway Tax` 
    };
}

/**
 * @namespace T13NE_Sway
 * @description An object containing all the functions for managing the Sway system.
 */
const T13NE_Sway = {
    initialize,
    setTapestry,
    getTapestry,
    convert,
    convertPool,
    getPotencyForBoon,
    getSizeDescription,
    calculateCarryingCapacity,
    calculatePopulation,
    gradeResource,
    getAoE,
    getMagicalTechCost,
    getSwayName,
    getFacetFromSway,
    FACET_SWAY_NAMES
};

export default T13NE_Sway;
