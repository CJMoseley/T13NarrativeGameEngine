import Logger from '/src/t13ne/core/Logger.js';
import CodexLoader from '/src/t13ne/modules/codex/CodexLoader.js';
import ProcGen from '/src/t13ne/procgen/ProcGen.js';

/**
 * GalacticEpic
 * Manages the persistent, growing narrative of the galaxy.
 */
export class GalacticEpic {
    constructor(pluginManager) {
        this.pluginManager = pluginManager;
    }

    /**
     * Generates a "Vertical Slice" of historical plot for the current generation/reset.
     */
    async generateVerticalSlice(seed) {
        Logger.message("GalacticEpic: Generating vertical slice...");
        const prng = ProcGen.createPRNG(seed);

        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const CardsAPI = T13NE?.getModule('CardsAPI');

        let slice = {
            id: `slice-${prng.nextInt(0, 1000000)}`,
            title: "A New Chapter",
            description: "A period of relative calm in the sector.",
            factionsInvolved: []
        };

        if (CardsAPI && CardsAPI.isInitialized) {
            try {
                // Use cards to generate a theme for this slice
                const spread = CardsAPI.getCardSpread('gain');
                if (spread && spread.cards.length > 0) {
                    const card = spread.cards[0].card;
                    const ageData = card?.data?.Age;
                    if (ageData) {
                        slice.title = ageData.Type;
                        slice.description = ageData.Description;
                    }
                }
            } catch (e) {
                Logger.warn("GalacticEpic: Failed to use CardsAPI for slice generation.", e);
            }
        }

        const epic = await this.getFullEpic();
        epic.push(slice);
        await CodexLoader.storeCache('global', 'epic', epic);

        Logger.message(`GalacticEpic: Slice '${slice.title}' added to the persistent Epic.`);
        return slice;
    }

    /**
     * Returns the full Epic.
     */
    async getFullEpic() {
        const epic = await CodexLoader.getCache('global', 'epic');
        return epic || [];
    }
}

export default GalacticEpic;
