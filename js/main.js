import { ViewManager } from '@/js/core/ViewManager.js';
import LoaderManager from '@/js/core/LoaderManager.js';
import Logger from '@/js/core/Logger.js';
import IntroSequence from '@/js/ui/IntroSequence.js';

/**
 * @module Main
 * @description
 * Main application entry point. This script initializes the core components of the game,
 * manages the loading sequence, and handles any fatal errors during the bootstrap process.
 */

/**
 * Initializes and bootstraps the entire application.
 * This function orchestrates the startup sequence:
 * 1. Initializes the ViewManager.
 * 2. Instantiates the LoaderManager to handle the loading sequence of all game assets and modules.
 * 3. Starts the loading process and waits for it to complete.
 * 4. Handles any fatal errors that might occur during this process.
 * @async
 */
async function bootstrap() {
    Logger.message("main.js: Bootstrapping application...");
    try {
        // 1. Initialize managers that don't have heavy async tasks
        Logger.message("main.js: Instantiating ViewManager...");
        const viewManager = new ViewManager();
        Logger.message("main.js: ViewManager instantiated.");
        await viewManager.initialize(); // Keep this for any synchronous setup in ViewManager

        // 2. Instantiate the LoaderManager to handle the loading sequence
        const loaderManager = new LoaderManager(viewManager);

        // 3. Start the loading process and wait for it to complete
        await loaderManager.loadAll();
        
        // The LoaderManager now handles showing the main menu.
        Logger.message("main.js: Bootstrap sequence complete.");

    } catch (error) {
        // If any part of the loading fails, display a fatal error.
        Logger.error(`FATAL: Application bootstrap failed.`, error);
        IntroSequence.updateStatus(`FATAL ERROR: Application failed to start. Check console.`);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position: absolute; top: 10px; left: 10px; padding: 20px; background: #800; color: #fff; border: 2px solid #f00; z-index: 9999;';
        errorDiv.innerHTML = `<h1>FATAL ERROR</h1><p>Application failed to start. Please check the console (F12) for details.</p><pre>${error.stack}</pre>`;
        document.body.appendChild(errorDiv);
    }
}

// Start the game initialization process.
bootstrap();
