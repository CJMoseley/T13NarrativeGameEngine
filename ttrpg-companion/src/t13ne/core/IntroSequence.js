import Logger from './Logger.js';
import { EventBus } from './EventBus.js';
import IntroSequenceUI from './ui/IntroSequence.js';
import GalacticEpic from "/src/t13ne/procgen/galaxy/GalacticEpic.js";

export class IntroSequence {
    constructor(viewManager) {
        this.viewManager = viewManager;
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
            systemDetails: null, // Renamed from system to match Scene expectations
            planet: null,        // Renamed from homeworld to match Scene expectations
            species: null,
            ship: null
        };

        // The Sequence Definition based on the correct order of operations
        this.steps = [
            {
                id: 'boot',
                sceneName: null,
                description: "Booting up. Generating Galaxy Stars...",
                minDuration: 500,
                tensionLevel: 1,
                action: () => {
                    // 1. Generate Galaxy Stars
                    Logger.message("IntroSequence: Requesting Galaxy Generation...");
                    EventBus.emit('request:generate:galaxy', this.context.seed);
                    EventBus.emit('tension:update', { level: 1 });
                },
                waitFor: 'galaxy:generated',
                saveData: (data) => { this.context.galaxy = data; }
            },
            {
                id: 'galaxy',
                sceneName: 'GalaxyMapScene',
                description: "Showing Galaxy. Generating History & System...",
                minDuration: 2000,
                tensionLevel: 2,
                transition: { type: 'fade', duration: 1000 },
                action: async () => {
                    const referee = this.viewManager.engine.getModule('Referee');
                    // 2. Generate Epic Slice, then request History & System
                    Logger.message("IntroSequence: Generating Galactic Epic Slice...");
                    if (referee) {
                        try {
                            const Epic = new GalacticEpic(referee.t13ne.pluginManager);
                            const fullEpic = await Epic.getFullEpic();
                            const sliceCount = fullEpic.length;
                            await Epic.generateVerticalSlice(referee.t13ne.getModule('PRNG').deriveSeed(this.context.seed, 'epic', sliceCount));
                            Logger.message("IntroSequence: Galactic Epic Slice generated.");
                        } catch (e) {
                            Logger.warn("IntroSequence: Failed to generate Galactic Epic Slice.", e);
                        }
                    }

                    Logger.message("IntroSequence: Requesting History & System Generation...");
                    EventBus.emit('request:generate:history', this.context.galaxy, this.context.seed);
                    EventBus.emit('request:generate:system', this.context.galaxy, this.context.seed);
                    EventBus.emit('tension:update', { level: 2 });
                },
                waitFor: ['history:generated', 'system:generated'],
                saveData: (data, evt) => {
                    if (evt === 'history:generated') this.context.history = data;
                    if (evt === 'system:generated') {
                        this.context.systemDetails = data.system;
                        this.context.planets = data.planets;
                        
                        // Inject data into LocalSpaceScene (queued or cached)
                        Logger.message("IntroSequence: Injecting generated system data into LocalSpaceScene.");
                        this.viewManager.updateSceneData('LocalSpaceScene', this.context);
                    }
                }
            },
            {
                id: 'system',
                sceneName: 'LocalSpaceScene',
                description: "Showing System. Generating Planet & Species...",
                minDuration: 2000,
                tensionLevel: 3,
                transition: { type: 'crossDissolve', duration: 2500 },
                sceneData: {
                    introMode: true,
                    showOrrery: true,
                    cameraPath: 'intro_sweep'
                },
                action: () => {
                    // 3. Show System, Generate Planet & Species (Homeworld)
                    Logger.message("IntroSequence: Requesting Homeworld Generation...");
                    EventBus.emit('request:generate:homeworld', this.context.systemDetails, this.context.seed);
                    EventBus.emit('tension:update', { level: 3 });
                },
                waitFor: 'homeworld:generated',
                saveData: (data) => {
                    this.context.planet = data.planet; // Map to planet
                    this.context.species = data.species;
                    
                    // Inject data into PlanetaryOrbitScene (queued or cached)
                    Logger.message("IntroSequence: Injecting generated homeworld data into PlanetaryOrbitScene.");
                    this.viewManager.updateSceneData('PlanetaryOrbitScene', this.context);

                    if (this.viewManager.currentScene && typeof this.viewManager.currentScene.updateContext === 'function') {
                        this.viewManager.currentScene.updateContext(this.context);
                    }
                },
                // This scene's intro sequence has an internal timer, after which it calls complete().
                // We don't need a `waitFor` here, as the scene's completion will trigger the next step
                // in the ViewManager/IntroSequence logic.
                autoComplete: false
            },
            {
                id: 'orbit',
                sceneName: 'PlanetaryOrbitScene',
                description: "Showing Orbit (Lore). Seeding Ship...",
                minDuration: 3000, // Time to read lore
                tensionLevel: 4,
                transition: { type: 'fade', duration: 1500 },
                action: () => {
                    // 4. Show Orbit, Seed/Generate Ship
                    Logger.message("IntroSequence: Requesting Ship Generation...");
                    EventBus.emit('request:generate:ship', {
                        homeworld: this.context.planet,
                        species: this.context.species,
                        seed: this.context.seed
                    });
                    EventBus.emit('tension:update', { level: 4 });
                },
                waitFor: 'ship:generated',
                saveData: (data) => {
                    this.context.ship = data;
                    if (this.viewManager.currentScene && typeof this.viewManager.currentScene.updateContext === 'function') {
                        this.viewManager.currentScene.updateContext(this.context);
                    }
                },
                autoComplete: false
            },
            {
                id: 'showcase',
                sceneName: 'ShipShowcaseScene',
                description: "Showing Ship Showcase.",
                minDuration: 8000,
                tensionLevel: 5,
                transition: { type: 'wipe', duration: 1200, direction: 'up' },
                action: () => {
                    // 5. Show Ship Showcase
                    Logger.message("IntroSequence: Displaying Ship Showcase.");
                    EventBus.emit('tension:update', { level: 5 });
                },
                // This scene calls this.complete() internally when its animation is done.
                autoComplete: false
            },
            {
                id: 'menu',
                description: "Main Menu",
                stop: true,
                // This is a final action, not a scene transition.
                action: () => {
                    this.viewManager.showMainMenu();
                }
            }
        ];

        this.onSequenceComplete = null;
        this.currentStepIndex = -1;
    }

    async start() {
        if (this.active) {
            Logger.warn("IntroSequence: Start called while already active.");
            return;
        }
        this.active = true;
        Logger.message("IntroSequence: Enqueueing all steps and starting sequence.");

        // 1. BOOT: Handle initial data generation before any scenes are cued.
        const bootStep = this.steps.find(s => s.id === 'boot');
        if (bootStep) {
            // Check if galaxy is already generated (e.g. by LoaderManager) to avoid hanging
            if (this.viewManager.gameEngine && this.viewManager.gameEngine.galaxy) {
                this.context.galaxy = this.viewManager.gameEngine.galaxy;
                Logger.message("IntroSequence: Galaxy already present, skipping boot wait.");
            } else {
                if (bootStep.action) bootStep.action();
                await new Promise(resolve => EventBus.once(bootStep.waitFor, (data) => {
                    if (bootStep.saveData) bootStep.saveData(data);
                    resolve();
                }));
            }
        }

        // 2. ENQUEUE SCENES: Loop through steps and cue them with async onActive handlers.
        for (const step of this.steps) {
            if (!step.sceneName) continue; // Skip non-visual steps

            // Merge context with specific step scene data (e.g. introConfig)
            const sceneData = { ...this.context };
            if (step.sceneData) {
                // Pass as introConfig for scenes that expect it (like LocalSpaceScene)
                sceneData.introConfig = step.sceneData;
                // Also merge directly for scenes that check properties directly
                Object.assign(sceneData, step.sceneData);
            }

            this.viewManager.cueScene(step.sceneName, sceneData, {
                minDuration: step.minDuration,
                autoComplete: step.autoComplete,
                transition: step.transition,
                onActive: async (scene) => {
                    // Hide loading UI when the first visual scene starts
                    if (step.id === 'galaxy') {
                        IntroSequenceUI.hide();
                    }

                    if (scene && typeof scene.updateContext === 'function') {
                        scene.updateContext(this.context);
                    }

                    // Setup listeners BEFORE action to prevent race conditions
                    const waiters = [];
                    if (step.waitFor) {
                        const events = Array.isArray(step.waitFor) ? step.waitFor : [step.waitFor];
                        events.forEach(evt => waiters.push(new Promise(res => EventBus.once(evt, data => {
                            if (step.saveData) step.saveData(data, evt);
                            res();
                        }))));
                    }

                    if (step.action) {
                        await step.action();
                    }

                    if (waiters.length > 0) {
                        await Promise.all(waiters);

                        // After waiting for data, if this is the galaxy step, focus the camera.
                        if (step.id === 'galaxy' && scene && typeof scene.focusOnSystem === 'function') {
                            const startSystem = this.viewManager.gameEngine.playerStartSystem;
                            if (startSystem) {
                                Logger.message("IntroSequence: Focusing camera on start system.");
                                // Await this to ensure the camera animation completes before transitioning
                                await scene.focusOnSystem(startSystem);
                            }
                        }
                    }
                }
            });
        }

        // 3. PLAY: Tell the ViewManager to start playing the sequence we just built.
        await this.viewManager.playSequence();

        // 4. FINAL STEP: After the sequence is done, show the main menu.
        const menuStep = this.steps.find(s => s.id === 'menu');
        if (menuStep && menuStep.action) {
            menuStep.action();
        }

        this.active = false;
        Logger.message("IntroSequence: Sequence finished.");
    }
}
