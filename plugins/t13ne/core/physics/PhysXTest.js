import { PhysXProvider } from './PhysXProvider.js';

export class PhysXTest {
    static async run() {
        // Create a visual log overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '10px';
        overlay.style.right = '10px';
        overlay.style.width = '450px';
        overlay.style.height = '600px';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
        overlay.style.color = '#0f0';
        overlay.style.fontFamily = 'monospace';
        overlay.style.padding = '10px';
        overlay.style.zIndex = '9999';
        overlay.style.overflowY = 'auto';
        overlay.style.border = '1px solid #0f0';
        document.body.appendChild(overlay);

        const log = (msg, color = '#0f0') => {
            const line = document.createElement('div');
            line.textContent = `> ${msg}`;
            line.style.color = color;
            line.style.marginBottom = '4px';
            overlay.appendChild(line);
            console.log(`[PhysXTest] ${msg}`);
        };

        const logStatus = (label, value) => {
            const color = value ? '#0f0' : '#f00';
            const status = value ? 'OK' : 'FAIL';
            log(`${label}: ${status}`, color);
        };

        log("STARTING PHYSX TEST VIA PROVIDER...");

        const provider = new PhysXProvider();

        try {
            // 1. Initialize Provider
            log("Calling provider.init()...");
            await provider.init();
            log("provider.init() finished.");

            // 2. Verify Initialization
            log("\n--- VERIFICATION ---");
            logStatus("Provider Initialized", provider.initialized);
            logStatus("PhysX Module (physx)", provider.physx);
            logStatus("Foundation (foundation)", provider.foundation);
            logStatus("Physics (physics)", provider.physics);
            logStatus("Scene (scene)", provider.scene);

            if (provider.initialized) {
                log(`\nPhysX Version: ${provider.version}`, '#0ff');
                log("SUCCESS: PhysXProvider initialized all core components.", '#0f0');
            } else {
                throw new Error("Provider reported initialization failed.");
            }

            // 3. Test a simple operation (e.g., creating a material)
            log("\n--- FUNCTIONALITY TEST ---");
            const material = provider.createMaterial(0.5, 0.5, 0.5);
            logStatus("Create Material", material);
            if(material) {
                log("SUCCESS: PhysX API is responsive.", '#0f0');
            }


        } catch (e) {
            log(`\nCRITICAL ERROR: ${e.message}`, '#f00');
            console.error(e);
        } finally {
             // Add a close button to the overlay
            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close Log';
            closeButton.style.marginTop = '15px';
            closeButton.style.padding = '8px';
            closeButton.style.backgroundColor = '#333';
            closeButton.style.color = '#fff';
            closeButton.style.border = '1px solid #555';
            closeButton.style.cursor = 'pointer';
            closeButton.onclick = () => {
                overlay.remove();
                if (provider && provider.initialized) {
                    provider.dispose();
                    log('Provider disposed.');
                }
            };
            overlay.appendChild(closeButton);
        }
    }
}
