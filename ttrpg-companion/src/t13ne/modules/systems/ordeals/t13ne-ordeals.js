﻿/**
 * @module Plugins/T13Ne/Ordeals
 * @description
 * This module defines the structure and logic for "Ordeals" in the T13NE system.
 * Ordeals are multi-stage, multi-round challenges that characters can face.
 */

import CodexLoader from "../../codex/CodexLoader.js";
import Logger from "../../../core/Logger.js";
import T13NECardsAPI from "../../mechanics/t13ne-cards-api.js";
import T13NE_Stakes from "./t13ne-stakes.js";
import T13NE from "../../../T13NE.js";
import T13NE_NarrativeTricks from "./t13ne-narrative-tricks.js";
import { Ordeal, OrdealRound, OrdealStage } from './t13ne-ordeals-core.js';

/**
 * @class T13NE_Ordeals
 * @description
 * Module for handling T13NE Ordeals.
 * Acts as a master system for OrdealRounds and OrdealStages.
 */
class T13NE_Ordeals {
    constructor() {
        this.ordealTypes = [];
        this.terrains = [];
        this.activeOrdeals = [];
        this.initialized = false;
    }

    /**
     * Initializes the Ordeals module by loading data.
     * @async
     */
    async initialize() {
        if (this.initialized) return;
        try {
            this.ordealTypes = await CodexLoader.getData('ordealTypes');
            this.terrains = await CodexLoader.getData('ordealTerrain');
            this.initialized = true;
            Logger.message('T13NE_Ordeals: Initialized successfully.');
        } catch (error) {
            Logger.error(`T13NE_Ordeals: Initialization failed: ${error}`);
        }
    }

    /**
     * Creates and starts a new Ordeal.
     * @param {string} type - The type of Ordeal (e.g., 'Chase').
     * @param {string} stakes - The stakes level (e.g., 'High').
     * @param {Array} participants - Array of Character objects.
     * @param {object} plot - The Plot object overseeing this.
     * @returns {Ordeal} The created Ordeal instance.
     */
    createOrdeal(type, stakes, participants, plot) {
        const ordeal = new Ordeal({
            type,
            stakes,
            participants,
            plot,
            gameEngine: T13NE // Pass the game engine instance to avoid circular dependency in core
        });

        // Start the VTT for the Ordeal
        const vttManager = T13NE.getVTTManager();
        if (vttManager) {
            vttManager.startOrdeal(ordeal);
        }

        // Start the ordeal process
        ordeal.start();

        this.activeOrdeals.push(ordeal);
        return ordeal;
    }

    /**
     * Retrieves an active Ordeal by ID.
     * @param {number} id 
     * @returns {Ordeal|null}
     */
    getOrdeal(id) {
        return this.activeOrdeals.find(o => o.id === id) || null;
    }
}

export { Ordeal, OrdealRound, OrdealStage };
export default new T13NE_Ordeals();
