import Logger from '../Logger.js';
import * as THREE from 'three';

class IntroSequence {
    static element = null;
    static statusElement = null;

    static init() {
        // Try to find elements if we haven't yet
        if (!this.element) this.element = document.getElementById('intro-sequence');
        if (!this.statusElement) this.statusElement = document.getElementById('loading-status');

        if (!this.element) {
            // Don't log error yet, might be too early. We'll check in show/hide.
            return false;
        }
        return true;
    }

    static show() {
        this.init();
        if (this.element) {
            this.element.style.display = 'flex';
            this.element.style.zIndex = '9999'; // Ensure it's on top when shown
        }
    }

    static hide() {
        this.init();
        if (this.element) {
            this.element.style.display = 'none';
        }
    }

    static updateStatus(message) {
        this.init();
        if (this.statusElement) {
            this.statusElement.textContent = message;
        }
        Logger.message(`Loading Status: ${message}`);
    }

    /**
     * Prompts the user to interact with the page to enable audio.
     * @param {Function} callback - Function to call after interaction.
     */
    static promptForInteraction(callback) {
        this.init();
        if (!this.element) {
            // Fallback: just call callback if we can't show UI
            if (callback) callback();
            return;
        }

        const storedName = localStorage.getItem('t13_player_name') || '';

        const overlay = document.createElement('div');
        overlay.id = 'audio-prompt-overlay';
        overlay.style.cssText = 'position:fixed; top: 50%; left: 20px; transform: translateY(-50%); width: auto; max-width: 400px; background:rgba(0, 10, 20, 0.8); border: 1px solid #337ab7; border-radius: 10px; z-index:10001; display:flex; justify-content:center; align-items:center; flex-direction:column; font-family: "Jura", sans-serif; padding: 20px 40px; box-shadow: 0 0 25px rgba(0, 128, 255, 0.6); backdrop-filter: blur(5px);';
        overlay.innerHTML = `
            <h1 style="color:#66aaff; margin-bottom:10px; text-transform:uppercase; letter-spacing:4px;">Wormhole Racers</h1>
            <p style="color:#889; margin-bottom:30px;">[ SENSORS LOCALIZING ... ]</p>
            
            <div style="margin-bottom: 20px;">
                <input type="text" id="player-name-input" value="${storedName}" placeholder="Enter Pilot Name" 
                    style="padding: 10px; background: rgba(0,0,0,0.5); border: 1px solid #337ab7; color: #cce; font-family: 'Jura', sans-serif; text-align: center; font-size: 1.2em;">
            </div>

            <div id="init-btn" style="padding:20px 40px; border:1px solid #337ab7; color:#66aaff; text-transform:uppercase; letter-spacing:2px; background: rgba(51, 122, 183, 0.1); transition: all 0.3s; cursor: pointer;">
                Initialize Engine
            </div>
            <p style="color:#445; margin-top:40px; font-size: 0.8em;">(Requires User Gesture for Audio)</p>
        `;

        const onInteract = (e) => {
            if (e.target.id === 'player-name-input') { e.stopPropagation(); return; } // Don't close if clicking input
            const nameInput = document.getElementById('player-name-input');
            if (nameInput) localStorage.setItem('t13_player_name', nameInput.value.trim() || 'Racer');

            document.body.removeChild(overlay);
            window.removeEventListener('keydown', onInteract);
            if (callback) callback();
        };

        const btn = overlay.querySelector('#init-btn');
        btn.onclick = onInteract;
        
        // Allow Enter key to submit
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') onInteract({ target: btn });
        }, { once: true });

        document.body.appendChild(overlay);
    }

    /**
     * Plays the main visual intro sequence.
     * @param {ViewManager} viewManager 
     */
    static async play(viewManager) {
        const gameEngine = viewManager.gameEngine;
        this.hide(); // Hide the loading UI

        // 1. Galaxy View
        viewManager.cueScene('GalaxyMapScene', { attractMode: true }, {
            duration: 4000,
            onActive: async (scene) => {
                // Generate System in background
                const music = viewManager.engine.getModule('Music');
                await gameEngine.generateSystem();
                
                if (music && gameEngine.currentSystemDetails) {
                    music.injectThemeComponents({ currentSystem: gameEngine.currentSystemDetails });
                    const theme = await music.createMainTheme(gameEngine);
                    music.updateTrack(theme);
                }

                // Update queued scenes with new data
                const localSpaceItem = viewManager.sceneQueue.find(i => i.name === 'LocalSpaceScene');
                if (localSpaceItem) {
                    localSpaceItem.data.systemDetails = gameEngine.currentSystemDetails;
                    localSpaceItem.data.planets = gameEngine.currentPlanets;
                }
                const orbitItem = viewManager.sceneQueue.find(i => i.name === 'PlanetaryOrbitScene');
                if (orbitItem) {
                    orbitItem.data.system = gameEngine.currentSystemDetails;
                    orbitItem.data.planet = gameEngine.currentPlanets ? gameEngine.currentPlanets[0] : null;
                }

                // Focus camera
                await new Promise(r => setTimeout(r, 1000));
                if (scene && typeof scene.focusOnSystem === 'function' && gameEngine.playerStartSystem) {
                    await scene.focusOnSystem(gameEngine.playerStartSystem);
                }
            }
        });

        // 2. System View (Local Space)
        if (gameEngine.playerStartSystem) {
            viewManager.cueScene('LocalSpaceScene', {
                systemDetails: gameEngine.currentSystemDetails,
                planets: gameEngine.currentPlanets,
                star: gameEngine.playerStartSystem,
                galaxy: gameEngine.galaxy,
                introConfig: { mode: 'flyby', duration: 25.0 } // Increased duration for smoother flyby
            }, {
                duration: 0, 
                transition: { type: 'crossDissolve', duration: 2000 },
                onActive: async (scene) => {
                    if (typeof scene.playIntroSequence === 'function') {
                        await scene.playIntroSequence();
                    }
                }
            });

            // 3. Planetary Orbit
            viewManager.cueScene('PlanetaryOrbitScene', {
                planet: gameEngine.currentPlanets ? gameEngine.currentPlanets[0] : null,
                system: gameEngine.currentSystemDetails,
                sunDirection: new THREE.Vector3(1, 0.5, 1).normalize()
            }, {
                duration: 10000,
                transition: { type: 'fade', duration: 1500 },
                onActive: async (scene) => {
                    // Generate Ship
                    await gameEngine.seedPlayerShip();
                    const music = viewManager.engine.getModule('Music');
                    if (music && gameEngine.playerShip) {
                        music.injectThemeComponents({ playerShip: gameEngine.playerShip });
                        const theme = await music.createMainTheme(gameEngine);
                        if (theme) music.updateTrack(theme);
                    }
                }
            });
        }

        // 4. Ship Showcase
        viewManager.cueScene('ShipShowcaseScene', {}, {
            duration: 0,
            onActive: async () => {
                this.hide(); 
            },
            transition: { type: 'wipe', duration: 1200, direction: 'up' }
        });

        // Execute
        await viewManager.playSequence();
    }
}

// Initialize on script load
IntroSequence.init();

export default IntroSequence;