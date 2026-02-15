// verify_tapestry.mjs
import T13NE from '@/plugins/t13ne/T13NE.js';
import { promises as fs } from 'fs';
import path from 'path';

// Mock Logger to prevent it from trying to access browser-specific things
global.Logger = {
    message: (msg) => console.log(`[LOG] ${msg}`),
    error: (msg, err) => console.error(`[ERROR] ${msg}`, err),
};

/**
 * Mocking the global fetch function for Node.js environment.
 */
global.fetch = async (url) => {
    const filePath = path.join(process.cwd(), url.startsWith('/') ? url.substring(1) : url);
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return {
            ok: true,
            json: async () => JSON.parse(data),
        };
    } catch (error) {
        return {
            ok: false,
            status: 404,
        };
    }
};

async function runVerification() {
    console.log('[TEST] Starting verification...');
    let originalSwayJS, originalSwayDataJS;
    const swayPath = '@/plugins/t13ne/modules/t13ne-sway.js';
    const swayDataPath = '@/plugins/t13ne/modules/t13ne-sway-data.js';

    try {
        // --- Temporarily patch files for Node.js environment ---
        originalSwayJS = await fs.readFile(swayPath, 'utf8');
        let patchedSwayJS = originalSwayJS.replace("import Logger from '/src/t13ne/core/Logger.js';", "const Logger = global.Logger;");
        await fs.writeFile(swayPath, patchedSwayJS);

        originalSwayDataJS = await fs.readFile(swayDataPath, 'utf8');
        let patchedSwayDataJS = originalSwayDataJS.replace("import Logger from '/src/t13ne/core/Logger.js';", "const Logger = global.Logger;");
        await fs.writeFile(swayDataPath, patchedSwayDataJS);
        // --- End Patch ---

        await T13NE.loadModules();
        const swayModule = T13NE.getModule('Sway');

        if (!swayModule) {
            throw new Error('Could not retrieve Sway module.');
        }

        // 1. Set a custom tapestry
        const customTapestry = {
            'craft': 5,  // Banal
            'awe': 18, // Bold
            'zeal': 13  // Intrepid (default, but explicit)
        };
        swayModule.setTapestry(customTapestry);

        // 2. Test conversions
        const amount = 100;
        const banalResult = swayModule.convertSway({ from: 'FacetSway', to: 'Chi', amount: amount, facetName: 'craft' });
        const boldResult = swayModule.convertSway({ from: 'FacetSway', to: 'Chi', amount: amount, facetName: 'awe' });
        const intrepidResult = swayModule.convertSway({ from: 'FacetSway', to: 'Chi', amount: amount, facetName: 'zeal' });
        const defaultResult = swayModule.convertSway({ from: 'FacetSway', to: 'Chi', amount: amount, facetName: 'heresy' }); // Unset, should default to Intrepid

        console.log(`[TEST] Banal conversion for ${amount} should be reduced:`, banalResult);
        console.log(`[TEST] Bold conversion for ${amount} should be equal:`, boldResult);
        console.log(`[TEST] Intrepid conversion for ${amount} should be halved:`, intrepidResult);
        console.log(`[TEST] Unset facet conversion for ${amount} should default to Intrepid (halved):`, defaultResult);

        // 3. Verify results
        // Note: The boon reduction for Banal is complex, we just check it's not the same as others.
        if (banalResult < 50 && boldResult === 100 && intrepidResult === 50 && defaultResult === 50) {
            console.log('[TEST] SUCCESS: All conversions behaved as expected.');
        } else {
            console.error('[TEST] FAILURE: Conversion results did not match expectations.');
        }

    } catch (error) {
        console.error('[TEST] An error occurred during verification:', error);
    } finally {
        // --- Restore original files ---
        if (originalSwayJS) await fs.writeFile(swayPath, originalSwayJS);
        if (originalSwayDataJS) await fs.writeFile(swayDataPath, originalSwayDataJS);
        console.log('[TEST] Verification finished and files restored.');
    }
}

runVerification();
