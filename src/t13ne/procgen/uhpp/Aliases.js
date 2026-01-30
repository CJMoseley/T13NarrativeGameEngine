/**
 * @module UHPP/Aliases
 * @description Shared constants and aliases for the UHPP pipeline.
 */

export const GRID_EMPTY = 0; // Represents an uncollapsed or empty cell
export const TILE_OFFSET = 1; // Offset applied to tile IDs when stored in TypedArrays

/**
 * Converts a Tile ID to a Grid Value
 * @param {number} tileID
 * @returns {number}
 */
export function tileToGrid(tileID) {
    return tileID + TILE_OFFSET;
}

/**
 * Converts a Grid Value to a Tile ID
 * @param {number} gridValue
 * @returns {number}
 */
export function gridToTile(gridValue) {
    return gridValue - TILE_OFFSET;
}
