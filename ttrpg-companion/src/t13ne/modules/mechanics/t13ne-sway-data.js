import CodexLoader from "/src/t13ne/modules/codex/CodexLoader.js";
import Logger from "/src/t13ne/core/Logger.js";

let swayTable = null;
let _allSwayTypes = []; // Renamed and initialized to an empty array

/**
 * Loads all necessary data for the Sway module using the CodexLoader.
 */
async function loadSwayData() {
    Logger.message("T13NE_SwayData: Loading sway data from Codex...");
    try {
        [swayTable, _allSwayTypes] = await Promise.all([
            CodexLoader.getData('sway'),
            CodexLoader.loadSwayTypesData() // Use the new method to load all sway types
        ]);

        if (!swayTable || _allSwayTypes.length === 0) {
            throw new Error('One or more sway data files failed to load or returned no data.');
        }

        Logger.message(`T13NE_SwayData: Sway data loaded successfully. Loaded ${_allSwayTypes.length} sway types.`);
    } catch (error) {
        Logger.error(`T13NE_SwayData: Failed to load sway data: ${error}`);
        swayTable = null;
        _allSwayTypes = [];
    }
}

/**
 * Returns all sway types that match a given Chi value.
 * @param {number} chiValue - The Chi value to search for.
 * @returns {Array<object>} An array of sway type objects matching the Chi value.
 */
function getSwayTypesByChi(chiValue) {
    if (_allSwayTypes.length === 0) {
        Logger.warn('T13NE_SwayData: Sway types not loaded. Call loadSwayData() first.');
        return [];
    }
    return _allSwayTypes.filter(type => type.Chi === chiValue);
}


const T13NE_SwayData = {
    loadSwayData,
    getSwayTable: () => swayTable,
    getSwayTypes: () => _allSwayTypes, // Expose the consolidated array
    getSwayTypesByChi // Expose the new lookup function
};

export default T13NE_SwayData;






