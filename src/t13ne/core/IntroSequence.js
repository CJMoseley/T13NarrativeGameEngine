// src/t13ne/core/IntroSequence.js
import Logger from './Logger.js';
import { EventBus } from './EventBus.js';

export class IntroSequence {
    constructor(viewManager) {
        this.viewManager = viewManager;
        this.sceneManager = viewManager.sceneManager;
        this.active = false;
        
        // Check for seed in URL parameters to allow reproducibility
        const urlParams = new URLSearchParams(window.location.search);
        const seed = urlParams.get('seed') || Math.random().toString(36).substring(2, 15);
        Logger.message(`IntroSequence: Initialized with seed: ${seed}`);

        // Shared Data Context (Accumulates data as we go)
        this.context = {
            seed: seed,
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
                sceneName: 'BootScene',
                description: "Booting up. Generating Galaxy Stars...",
                minDuration: 500,
                action: () => {
                    // 1. Generate Galaxy Stars
                    Logger.message("IntroSequence: Requesting Galaxy Generation...");
                    EventBus.emit('request:generate:galaxy', this.context.seed);
                },
                waitFor: 'galaxy:generated',
                saveData: (data) => { this.context.galaxy = data; }
            },
            {
                id: 'galaxy',
                sceneName: 'GalaxyMapScene',
                description: "Showing Galaxy. Generating History & System...",
                minDuration: 2000,
                action: () => {
                    // 2. Show Galaxy, Generate History & System
                    Logger.message("IntroSequence: Requesting History & System Generation...");
                    EventBus.emit('request:generate:history', this.context.galaxy, this.context.seed);
                    EventBus.emit('request:generate:system', this.context.galaxy, this.context.seed);
                },
                waitFor: ['history:generated', 'system:generated'],
                saveData: (data, evt) => {
                    if (evt === 'history:generated') this.context.history = data;
                    if (evt === 'system:generated') this.context.system = data;
                }
            },
            {
                id: 'system',
                sceneName: 'LocalSpaceScene',
                description: "Showing System. Generating Planet & Species...",
                minDuration: 2000,
                sceneData: {
                    introMode: true,
                    showOrrery: true,
                    cameraPath: 'intro_sweep'
                },
                action: () => {
                    // 3. Show System, Generate Planet & Species (Homeworld)
                    Logger.message("IntroSequence: Requesting Homeworld Generation...");
                    EventBus.emit('request:generate:homeworld', this.context.system, this.context.seed);
                },
                waitFor: 'homeworld:generated',
                saveData: (data) => {
                    this.context.homeworld = data.planet;
                    this.context.species = data.species;
                    if (this.viewManager.currentScene && typeof this.viewManager.currentScene.updateContext === 'function') {
                        this.viewManager.currentScene.updateContext(this.context);
                    }
                }
            },
            {
                id: 'orbit',
                sceneName: 'PlanetaryOrbitScene',
                description: "Showing Orbit (Lore). Seeding Ship...",
                minDuration: 3000, // Time to read lore
                action: () => {
                    // 4. Show Orbit, Seed/Generate Ship
                    Logger.message("IntroSequence: Requesting Ship Generation...");
                    EventBus.emit('request:generate:ship', {
                        homeworld: this.context.homeworld,
                        species: this.context.species,
                        seed: this.context.seed
                    });
                },
                waitFor: 'ship:generated',
                saveData: (data) => {
                    this.context.ship = data;
                    if (this.viewManager.currentScene && typeof this.viewManager.currentScene.updateContext === 'function') {
                        this.viewManager.currentScene.updateContext(this.context);
                    }
                }
            },
            {
                id: 'showcase',
                sceneName: 'ShipShowcaseScene',
                description: "Showing Ship Showcase.",
                minDuration: 3000,
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

        // 1. Setup Data Waiter (Generation)
        // We create this promise BEFORE triggering actions to ensure we catch events
        let dataReadyPromise = Promise.resolve();
        const dataWaiters = [];

        if (step.waitFor) {
            const events = Array.isArray(step.waitFor) ? step.waitFor : [step.waitFor];
            events.forEach(evt => {
                dataWaiters.push(new Promise(resolve => {
                    // Listen once for the specific event
                    EventBus.once(evt, (data) => {
                        Logger.message(`IntroSequence: Received event ${evt}`);
                        if (step.saveData) step.saveData(data, evt);
                        resolve();
                    });
                }));
            });
            dataReadyPromise = Promise.all(dataWaiters);
        }

        // Merge step-specific data into context for this scene
        const stepContext = { ...this.context, ...(step.sceneData || {}) };

        // 2. Get/Prepare the scene for THIS step
        // It should have been preloaded by the previous step, but we ensure it here.
        let sceneInstance = this.sceneManager.getPreparedScene(step.sceneName);
        
        if (!sceneInstance) {
            Logger.warn(`IntroSequence: Scene ${step.sceneName} was not preloaded. Loading now...`);
            sceneInstance = await this.sceneManager.prepareScene(step.sceneName, stepContext);
        } else {
            // Inject the accumulated context into the already-prepared scene
            if (typeof sceneInstance.updateContext === 'function') {
                sceneInstance.updateContext(stepContext);
            } else {
                // Fallback for scenes without updateContext
                Object.assign(sceneInstance.sceneData, stepContext);
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

        // 5. Wait for Data, THEN Preload Next Scene
        // This ensures the next scene is prepared with the data generated in this step.
        const preloadNextPromise = dataReadyPromise.then(async () => {
            const nextStep = this.steps[this.currentStepIndex + 1];
            if (nextStep && nextStep.sceneName) {
                Logger.message(`IntroSequence: Data ready. Preloading next scene: ${nextStep.sceneName}`);
                await this.sceneManager.prepareScene(nextStep.sceneName, this.context, () => {}, true);
            }
        });

        // 6. Wait for EVERYTHING (Min Duration AND Preloading)
        if (!step.stop) {
            const minDurationPromise = step.minDuration ? new Promise(r => setTimeout(r, step.minDuration)) : Promise.resolve();
            
            // We wait for the visual duration AND the next scene to be fully ready
            await Promise.all([minDurationPromise, preloadNextPromise]);
            this.next();
        } else {
            this.active = false;
            Logger.message("IntroSequence: Sequence complete.");
        }
    }
}
