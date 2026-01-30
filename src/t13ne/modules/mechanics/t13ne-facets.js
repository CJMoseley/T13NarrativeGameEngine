/**
 * @module Plugins/T13Ne/Facets
 * @description
 * This module manages the loading and querying of "Facets", a core concept in the T13NE system.
 * Facets represent fundamental aspects of reality, character traits, and narrative themes.
 * This module provides functions to get facets, their aspects, and generate descriptions based on them.
 */

const facets = [
    'awe', 'burden', 'craft', 'dominion', 'enigma', 'fury', 'gossamer', 'heresy',
    'inertia', 'jeer', 'key', 'liberty', 'miasma', 'nature', 'orthodox', 'phoenix',
    'quiet', 'rook', 'sin', 'trial', 'virtue', 'wyrd', 'yonder', 'zeal'
];

let loadedFacets = new Map();
let allFacetsLoaded = false;

/**
 * Pre-loads all facet data from the data files for quicker access.
 * @async
 */
const loadAllFacets = async () => {
    if (allFacetsLoaded) return;
    const promises = facets.map(facetName => {
        console.log(`Loading facet: ${facetName}`);
        return import(`../../data/facets/${facetName}.js`).then(module => {
            loadedFacets.set(facetName, module.default);
            loadedFacets.set(module.default.FacetIndex, module.default);
            loadedFacets.set(module.default.FacetName.toLowerCase(), module.default);
        });
    });
    await Promise.all(promises);
    allFacetsLoaded = true;
};

/**
 * Retrieves a facet by its name, index, or other properties.
 * @param {string|number} identifier - The name or index of the facet to retrieve.
 * @returns {Promise<object|null>} A promise that resolves to the facet object, or null if not found.
 * @async
 */
const getFacet = async (identifier) => {
    let facetIdentifier = typeof identifier === 'string' ? identifier.toLowerCase() : identifier;

    if (loadedFacets.has(facetIdentifier)) {
        return loadedFacets.get(facetIdentifier);
    }

    // If it's a number, find by index name
    if (typeof facetIdentifier === 'number' && facets[facetIdentifier]) {
        const facetName = facets[facetIdentifier];
        const module = await import(`../../data/facets/${facetName}.js`);
        loadedFacets.set(facetName, module.default);
        loadedFacets.set(module.default.FacetIndex, module.default);
        loadedFacets.set(module.default.FacetName.toLowerCase(), module.default);
        return module.default;
    }

    // If it's a string that matches a file name
    if (typeof facetIdentifier === 'string' && facets.includes(facetIdentifier)) {
        const module = await import(`../../data/facets/${facetIdentifier}.js`);
        loadedFacets.set(facetIdentifier, module.default);
        loadedFacets.set(module.default.FacetIndex, module.default);
        loadedFacets.set(module.default.FacetName.toLowerCase(), module.default);
        return module.default;
    }

    // If it's not a direct name or index, we need to search.
    // This requires loading all facets.
    await loadAllFacets();
    for (const [key, facet] of loadedFacets.entries()) {
        if (typeof key !== 'number') continue; // Only iterate over facet objects

        for (const prop in facet) {
            if (typeof facet[prop] === 'string' && facet[prop].toLowerCase() === facetIdentifier) {
                return facet;
            }
            if (prop === 'Persona' && typeof facet.Persona === 'object' && facet.Persona.Name.toLowerCase() === facetIdentifier) {
                return facet;
            }
        }
    }

    return null; // Not found
};

/**
 * Retrieves an array of all facet objects.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of all facet objects.
 * @async
 */
const getFacetsArr = async () => {
    await loadAllFacets();
    // Return unique facets sorted by FacetIndex
    const uniqueFacets = Array.from(loadedFacets.values()).filter((f, i, self) =>
        self.findIndex(t => t.FacetIndex === f.FacetIndex) === i
    );
    return uniqueFacets.sort((a, b) => a.FacetIndex - b.FacetIndex);
};

/**
 * Retrieves the anti-facet of a given facet.
 * @param {string|number} identifier - The name or index of the facet.
 * @returns {Promise<object|null>} A promise that resolves to the anti-facet object, or null if not found.
 * @async
 */
const getAntiFacet = async (identifier) => {
    const facet = await getFacet(identifier);
    if (facet && facet.AntiFacet !== undefined) {
        return getFacet(facet.AntiFacet);
    }
    return null;
};

/**
 * Retrieves a specific aspect of a facet.
 * @param {string|number} facetIdentifier - The name or index of the facet.
 * @param {string} aspect - The name of the aspect to retrieve.
 * @param {string|null} [subaspect=null] - The name of the sub-aspect to retrieve, if any.
 * @returns {Promise<any|null>} A promise that resolves to the aspect's value, or null if not found.
 * @async
 */
const getFacetAspect = async (facetIdentifier, aspect, subaspect = null) => {
    const facet = await getFacet(facetIdentifier);
    if (!facet) return null;

    if (["Name", "Motivation", "Avoid", "Gain_Chi"].includes(aspect)) {
        subaspect = aspect;
        aspect = "Persona";
    }

    if (facet[aspect]) {
        if (subaspect && typeof facet[aspect] === 'object' && facet[aspect] !== null) {
            return facet[aspect][subaspect] || null;
        }
        return facet[aspect];
    }
    return null;
};

/**
 * Retrieves the adjective associated with a facet for a given boon value.
 * @param {string|number} facetIdentifier - The name or index of the facet.
 * @param {number} boonVal - The boon value.
 * @param {string} [type='Character'] - The type of entity the adjective is for (e.g., 'Character', 'Descendant', 'Location').
 * @returns {Promise<string|null>} A promise that resolves to the adjective, or null if not found.
 * @async
 */
const getAdjective = async (facetIdentifier, boonVal, type = 'Character') => {
    const facet = await getFacet(facetIdentifier);
    if (!facet || !facet.FacetAdjectives) return null;

    // Sort adjectives by Boon descending to find the highest threshold met
    const sortedAdjectives = [...facet.FacetAdjectives].sort((a, b) => b.Boon - a.Boon);

    let selectedAdj = sortedAdjectives.find(adj => adj.Boon <= boonVal);

    // Fallback to lowest if none found (e.g. boonVal is very low)
    if (!selectedAdj) selectedAdj = sortedAdjectives[sortedAdjectives.length - 1];

    if (!selectedAdj) return null;

    if (type === 'Descendant' && selectedAdj.Desc_Adjective) return selectedAdj.Desc_Adjective;
    if (type === 'Location' && selectedAdj.Location_Adjective) return selectedAdj.Location_Adjective;

    return selectedAdj.Adjective;
};

/**
 * Generates a description for an entity based on its facet stats.
 * @param {object} statsObj - An object containing the entity's facet stats.
 * @param {string} [type='Character'] - The type of entity.
 * @param {number} [count=7] - The number of adjectives to include in the description.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of descriptive strings.
 * @async
 */
const generateDescription = async (statsObj, type = 'Character', count = 7) => {
    const facets = await getFacetsArr();
    const deviations = [];

    for (const facet of facets) {
        let boonVal = 13; // Default average

        // Try to get boon from stats object
        if (statsObj && typeof statsObj.getFacetBoon === 'function') {
            const b = statsObj.getFacetBoon(facet.FacetIndex);
            if (typeof b === 'object' && b !== null) {
                boonVal = (b.Boon || 0) + (b.Scale || 0);
            } else {
                boonVal = Number(b) || 0;
            }
        } else if (statsObj && statsObj.Stats && Array.isArray(statsObj.Stats)) {
            const stat = statsObj.Stats.find(s => s.Facet === facet.FacetIndex);
            if (stat) boonVal = stat.Facet_Boon;
        }

        const deviation = Math.abs(boonVal - 13);
        deviations.push({ facet, boonVal, deviation });
    }

    // Sort by deviation descending to find most extreme traits
    deviations.sort((a, b) => b.deviation - a.deviation);

    // Take top 'count'
    const topDeviations = deviations.slice(0, count);
    const descriptions = [];

    for (const item of topDeviations) {
        const adj = await getAdjective(item.facet.FacetIndex, item.boonVal, type);
        if (adj) {
            descriptions.push(`${adj} (${item.facet.FacetName})`);
        }
    }

    return descriptions;
};

/**
 * Retrieves the Tao (Yin or Yang) of a facet.
 * @param {string|number} identifier - The name or index of the facet.
 * @param {object|null} [source=null] - An optional source object (e.g., a character) to get the Tao from.
 * @returns {Promise<string>} A promise that resolves to 'Yin', 'Yang', or 'Balance'.
 * @async
 */
const getTao = async (identifier, source = null) => {
    let web = source;
    // Handle Character object passed instead of FacetWeb
    if (source && source.facetweb) {
        web = source.facetweb;
    }

    if (web && typeof web.getFacetTao === 'function') {
        return web.getFacetTao(identifier);
    }

    const facet = await getFacet(identifier);
    if (facet) {
        return facet.Yang ? 'Yang' : 'Yin';
    }
    return 'Balance';
};

/**
 * @namespace T13NE_Facets
 * @description
 * An object containing all the functions for managing and querying facets.
 */
const T13NE_Facets = {
    loadAllFacets,
    getFacet,
    getFacetsArr,
    getAntiFacet,
    getFacetAspect,
    getAdjective,
    generateDescription,
    getTao
};

/* if (!window.T13NE) { window.T13NE = {}; }
window.T13NE.Facets = T13NE_Facets; */

export default T13NE_Facets;




