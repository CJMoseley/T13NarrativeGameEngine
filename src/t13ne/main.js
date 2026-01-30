import T13NE from './T13NE.js';
import IntroSequence from './core/ui/IntroSequence.js';
import Logger from './core/Logger.js';

/**
 * @module T13NE/Main
 * @description
 * T13NE Engine entry point.
 */

async function bootstrap() {
    Logger.message("T13NE Engine: Bootstrapping application...");
    console.log("Bootstrap: Step 1 - Starting T13NE...");
    try {
        // Initialize and start the engine
        console.log("Bootstrap: Step 2 - Calling T13NE.start()...");
        await T13NE.start();
        console.log("Bootstrap: Step 3 - T13NE.start() completed.");

        Logger.message("T13NE Engine: Bootstrap sequence complete.");

    } catch (error) {
        Logger.error(`FATAL: T13NE Engine bootstrap failed.`, error);
        IntroSequence.updateStatus(`FATAL ERROR: Engine failed to start. Check console.`);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position: absolute; top: 10px; left: 10px; padding: 20px; background: #800; color: #fff; border: 2px solid #f00; z-index: 9999;';
        errorDiv.innerHTML = `<h1>FATAL ERROR (T13NE Engine)</h1><p>Application failed to start. Please check the console (F12) for details.</p><pre>${error.stack}</pre>`;
        document.body.appendChild(errorDiv);
    }
}

// Start the engine initialization process.
bootstrap();
