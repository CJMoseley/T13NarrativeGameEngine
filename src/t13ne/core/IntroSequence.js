// src/t13ne/core/IntroSequence.js
import Logger from './Logger.js';
import { EventBus } from './EventBus.js';

export class IntroSequence {
    constructor(viewManager) {
        this.viewManager = viewManager;
        this.sceneManager = viewManager.sceneManager;
        this.active = false;
        
        // Shared Data Context (Accumulates data as we go)
        this.context = {
            galaxy: null,
            history: null,
            system: null,
            homeworld: null,
            species: null,
            ship: null
        };

        // The Sequence Definition based on the correct order of operations
        this.steps = [
            {
                id: 'boot',
                sceneName: 'BootSequence',
                description: "Booting up. Generating Galaxy Stars...",
                minDuration: 1000,
                action: () => {
                    // 1. Generate Galaxy Stars
                    Logger.message("IntroSequence: Requesting Galaxy Generation...");
                    EventBus.emit('request:generate:galaxy');
                },
                waitFor: 'galaxy:generated',
                saveData: (data) => { this.context.galaxy = data; }
            },
            {
                id: 'galaxy',
                sceneName: 'GalaxyView',
                description: "Showing Galaxy. Generating History & System...",
                minDuration: 12000,
                action: () => {
                    // 2. Show Galaxy, Generate History & System
                    Logger.message("IntroSequence: Requesting History & System Generation...");
                    EventBus.emit('request:generate:history', this.context.galaxy);
                    EventBus.emit('request:generate:system', this.context.galaxy);
                },
                waitFor: ['history:generated', 'system:generated'],
                saveData: (data, evt) => {
                    if (evt === 'history:generated') this.context.history = data;
                    if (evt === 'system:generated') this.context.system = data;
                }
            },
            {
                id: 'system',
                sceneName: 'SystemView',
                description: "Showing System. Generating Planet & Species...",
                minDuration: 10000,
                action: () => {
                    // 3. Show System, Generate Planet & Species (Homeworld)
                    Logger.message("IntroSequence: Requesting Homeworld Generation...");
                    EventBus.emit('request:generate:homeworld', this.context.system);
                },
                waitFor: 'homeworld:generated',
                saveData: (data) => {
                    this.context.homeworld = data.planet;
                    this.context.species = data.species;
                }
            },
            {
                id: 'orbit',
                sceneName: 'PlanetaryOrbit',
                description: "Showing Orbit (Lore). Seeding Ship...",
                minDuration: 15000, // Time to read lore
                action: () => {
                    // 4. Show Orbit, Seed/Generate Ship
                    Logger.message("IntroSequence: Requesting Ship Generation...");
                    EventBus.emit('request:generate:ship', {
                        homeworld: this.context.homeworld,
                        species: this.context.species
                    });
                },
                waitFor: 'ship:generated',
                saveData: (data) => {
                    this.context.ship = data;
                }
            },
            {
                id: 'showcase',
                sceneName: 'ShipShowcase',
                description: "Showing Ship Showcase.",
                minDuration: 14000,
                action: () => {
                    // 5. Show Ship Showcase
                    Logger.message("IntroSequence: Displaying Ship Showcase.");
                }
            },
            {
                id: 'menu',
                sceneName: 'MainMenu',
                description: "Main Menu",
                stop: true
            }
        ];

        this.currentStepIndex = -1;
    }

    start() {
        if (this.active) return;
        this.active = true;
        this.currentStepIndex = -1;
        Logger.message("IntroSequence: Starting sequence.");
        this.next();
    }

    async next() {
        this.currentStepIndex++;
        if (this.currentStepIndex >= this.steps.length) {
            this.active = false;
            return;
        }

        const step = this.steps[this.currentStepIndex];
        Logger.message(`IntroSequence: Playing step ${step.id} (${step.description})`);

        // 1. Setup Waiters (Listeners) FIRST to avoid race conditions
        // We do this before triggering actions so we don't miss fast events
        const waiters = [];
        
        if (step.minDuration) {
            waiters.push(new Promise(r => setTimeout(r, step.minDuration)));
        }

        if (step.waitFor) {
            const events = Array.isArray(step.waitFor) ? step.waitFor : [step.waitFor];
            events.forEach(evt => {
                waiters.push(new Promise(resolve => {
                    // Listen once for the specific event
                    EventBus.once(evt, (data) => {
                        Logger.message(`IntroSequence: Received event ${evt}`);
                        if (step.saveData) step.saveData(data, evt);
                        resolve();
                    });
                }));
            });
        }

        // 2. Get/Prepare the scene for THIS step
        // It should have been preloaded by the previous step, but we ensure it here.
        let sceneInstance = this.sceneManager.getPreparedScene(step.sceneName);
        
        if (!sceneInstance) {
            Logger.warn(`IntroSequence: Scene ${step.sceneName} was not preloaded. Loading now...`);
            sceneInstance = await this.sceneManager.prepareScene(step.sceneName, this.context);
        } else {
            // Inject the accumulated context into the already-prepared scene
            if (typeof sceneInstance.updateContext === 'function') {
                sceneInstance.updateContext(this.context);
            } else {
                // Fallback for scenes without updateContext
                Object.assign(sceneInstance.sceneData, this.context);
            }
        }

        // 3. Show the scene
        if (this.viewManager.setScene) {
            this.viewManager.setScene(sceneInstance);
        } else {
            this.viewManager.currentScene = sceneInstance;
            sceneInstance.onLoad();
        }

        // 4. Trigger Actions (Generation)
        // Small delay to ensure scene is fully mounted and listeners are active
        if (step.action) {
            setTimeout(() => {
                step.action();
            }, 100);
        }

        // 5. Start Preloading NEXT step in the background
        const nextStep = this.steps[this.currentStepIndex + 1];
        if (nextStep && nextStep.sceneName) {
            // We do NOT await this. It runs while the current scene plays.
            this.sceneManager.prepareScene(nextStep.sceneName, this.context, () => {}, true).catch(e => {
                Logger.error(`IntroSequence: Background prep of ${nextStep.sceneName} failed`, e);
            });
        }

        // 6. Wait for completion conditions
        if (!step.stop) {
            await Promise.all(waiters);
            this.next();
        } else {
            this.active = false;
            Logger.message("IntroSequence: Sequence complete.");
        }
    }
}
