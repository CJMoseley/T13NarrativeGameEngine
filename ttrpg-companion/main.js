import T13NE from '/src/t13ne/T13NE.js';
import Logger from '/src/t13ne/core/Logger.js';

console.log("Bootstrap: Initializing TTRPG Companion client...");

// Navigation Control
const navLinks = document.querySelectorAll('.nav-link');
const panelViews = document.querySelectorAll('.panel-view');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all links and panels
        navLinks.forEach(l => l.classList.remove('active'));
        panelViews.forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked link
        link.classList.add('active');
        
        // Show corresponding panel
        const targetPanel = link.getAttribute('data-panel');
        const panel = document.getElementById(`view-${targetPanel}`);
        if (panel) panel.classList.add('active');
        
        console.log(`Navigation: Switched to panel "${targetPanel}"`);
    });
});

// App Bootstrapper
async function initApp() {
    try {
        console.log("App Init: Starting T13 Narrative Engine...");
        
        // Bootstraps WASM modules, Codex databases, and narrative registers
        await T13NE.start();
        
        console.log("App Init: Narrative Engine running successfully.");
        document.getElementById('connectionStatus').textContent = "Engine Ready";
        document.getElementById('connectionStatus').style.color = "#10b981"; // Success green

        // Setup Character Creator Button Listener
        setupCharacterCreator();

        // Setup VTT Buttons Listener
        setupVttControls();

    } catch (error) {
        console.error("App Init: Narrative Engine failed to start", error);
        document.getElementById('connectionStatus').textContent = "Initialization Failed";
        document.getElementById('connectionStatus').style.color = "#ef4444"; // Error red
    }
}

// Interactive Character Sheet Calculations using T13 Modules
function setupCharacterCreator() {
    const btnCalculate = document.getElementById('btnGenerateCatalyst');
    if (!btnCalculate) return;

    btnCalculate.addEventListener('click', async () => {
        const name = document.getElementById('inputCharName').value.trim();
        const facetFocus = document.getElementById('selectCoreFacet').value;
        const statsOutput = document.getElementById('characterStatsOutput');

        if (!name) {
            alert("Please enter a character name.");
            return;
        }

        try {
            console.log(`Character Creator: Generating stats for "${name}" with focus "${facetFocus}"`);

            // Use the copied Gematria/Geometry module
            const geometryModule = T13NE.getModule('T13Geometry');
            const ichingModule = T13NE.getModule('IChing');

            if (!geometryModule || !ichingModule) {
                throw new Error("Required modules (Geometry or IChing) not loaded.");
            }

            // Calculate Numerological Gemantria values from name
            const geoResult = geometryModule.getGeometryFromString(name) || { full: 13, impressions: [1, 3] };
            const geoVal = geoResult.full || 13;

            // Generate I-Ching Hexagram
            const hexagramNum = (geoVal % 64) || 1;
            const hexagram = await ichingModule.getHexagram(hexagramNum) || { name: "The Creative", meaning: "Initiating force" };

            // Calculate core Boons (T13 attributes) based on name length and gematria
            const boons = {
                Incarna: Math.min(24, Math.max(5, 10 + (name.length % 5))),
                Persona: Math.min(24, Math.max(5, 12 + (geoVal % 6))),
                Umbral: Math.min(24, Math.max(5, 8 + (name.charCodeAt(0) % 8))),
                Nimbed: Math.min(24, Math.max(5, 9 + ((geoVal + name.length) % 7)))
            };

            // Boost the focused facet
            boons[facetFocus] += 2;

            // Display Results in DOM
            statsOutput.style.display = 'block';
            statsOutput.innerHTML = `
                <h3 style="font-family: var(--font-header); font-size: 1.3rem; color: var(--text-accent); margin-bottom: 12px; text-transform: uppercase;">
                    Results for ${name}
                </h3>
                <p style="margin-bottom: 16px; font-size: 0.95rem;">
                    <strong>Numerological Value (Gematria):</strong> <code>${geoVal}</code>
                </p>
                <div style="background: rgba(10, 7, 20, 0.4); padding: 16px; border-radius: 8px; border: 1px solid var(--border-glass); margin-bottom: 16px;">
                    <h4 style="color: var(--text-accent); margin-bottom: 6px; font-size: 1rem;">
                        I-Ching Catalyst Hexagram #${hexagramNum}: ${hexagram.name || 'Hexagram'}
                    </h4>
                    <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.5;">
                        ${hexagram.meaning || 'No description available for this cosmic gateway.'}
                    </p>
                </div>
                <h4 style="font-family: var(--font-header); font-size: 1.1rem; color: var(--text-accent); margin-bottom: 8px; text-transform: uppercase;">
                    Calculated Facet Boons
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div style="padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px;">
                        <strong>Incarna (Body):</strong> Boon ${boons.Incarna}
                    </div>
                    <div style="padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px;">
                        <strong>Persona (Mind):</strong> Boon ${boons.Persona}
                    </div>
                    <div style="padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px;">
                        <strong>Umbral (Spirit):</strong> Boon ${boons.Umbral}
                    </div>
                    <div style="padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px;">
                        <strong>Nimbed (Aura):</strong> Boon ${boons.Nimbed}
                    </div>
                </div>
            `;
            
            console.log("Character Creator: Stats and gateway successfully rendered.");
        } catch (err) {
            console.error("Character Creator: Generation error", err);
            alert("Error generating character stats. Check console.");
        }
    });
}

// VTT Controls and Dice Rolls
function setupVttControls() {
    const btnRoll = document.getElementById('btnRollDice');
    const btnClear = document.getElementById('btnClearDice');
    
    if (btnRoll) {
        btnRoll.addEventListener('click', () => {
            // Trigger local dice roll calculation via T13NE.PRNG
            const prng = T13NE.getModule('PRNG');
            
            // Defaulting to Mulberry32 or simple seed math
            const rolls = [];
            for (let i = 0; i < 3; i++) {
                rolls.push(Math.floor(Math.random() * 6) + 1);
            }
            const total = rolls.reduce((a, b) => a + b, 0);
            
            console.log(`VTT Dice Roll: Rolled 3d6 -> [${rolls.join(', ')}] = ${total}`);
            alert(`Rolled 3d6 on the Table: [${rolls.join(', ')}] = ${total}`);
            
            // In a fully configured pass, this would spawn 3D objects in the three.js container
        });
    }
    
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            console.log("VTT Dice Roll: Cleared board.");
        });
    }
}

// Launch the application bootstrap
initApp();
