import T13NE from '@/src/t13ne/T13NE.js';
import Logger from '@/src/t13ne/core/Logger.js';
import IntroSequence from '@/src/t13ne/core/ui/IntroSequence.js';

/**
 * @module Main
 * @description
 * Main application entry point. This script initializes the core components of the game,
 * manages the loading sequence, and handles any fatal errors during the bootstrap process.
 */

/**
 * Initializes and bootstraps the entire application.
 * @async
 */
async function bootstrap() {
    Logger.message("main.js: Bootstrapping application via T13NE...");
    try {
        // T13NE handles ViewManager, LoaderManager, and initialization
        await T13NE.start();

        Logger.message("main.js: Bootstrap sequence complete.");

    } catch (error) {
        // If any part of the loading fails, display a fatal error.
        Logger.error(`FATAL: Application bootstrap failed.`, error);
        IntroSequence.updateStatus(`FATAL ERROR: Application failed to start. Check console.`);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position: absolute; top: 10px; left: 10px; padding: 20px; background: #800; color: #fff; border: 2px solid #f00; z-index: 9999;';
        errorDiv.innerHTML = `<h1>FATAL ERROR</h1><p>Application failed to start. Please check the console (F12) for details.</p><pre>${error.stack}</pre>`;
        document.body.appendChild(errorDiv);
        console.error(error);
    }
}

// Start the game initialization process.
bootstrap();
