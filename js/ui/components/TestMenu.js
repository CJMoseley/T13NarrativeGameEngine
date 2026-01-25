import Logger from '../../core/Logger.js';

/**
 * TestMenu Component
 *
 * Renders the test menu options for debugging and development.
 */
export class TestMenu {
    constructor(uiManager) {
        const funcName = 'TestMenu.constructor';
        Logger.start(funcName);
        this.uiManager = uiManager;
        this.viewManager = uiManager.viewManager;
        this.element = document.getElementById('testMenu');
        this.menuOptionsElement = document.getElementById('testMenuOptions');
        Logger.end(funcName);
    }

    _clear() {
        this.menuOptionsElement.innerHTML = '';
    }

    _addOption(option) {
        const button = document.createElement('button');
        button.className = 'menu-button';
        button.textContent = option.text;
        button.onclick = option.onClick;
        this.menuOptionsElement.appendChild(button);
    }

    _showSubMenu(title, options, parentMenuFn) {
        this._clear();
        const titleElement = document.createElement('h2');
        titleElement.textContent = title;
        this.menuOptionsElement.appendChild(titleElement);

        options.forEach(option => {
            if (option.isSubmenu) {
                this._addOption({
                    text: option.text,
                    onClick: () => this._showSubMenu(option.text, option.options, () => this._showSubMenu(title, options, parentMenuFn))
                });
            } else {
                this._addOption(option);
            }
        });

        this._addOption({ text: 'Back', onClick: parentMenuFn });
    }

    show() {
        const testOptions = [
            {
                text: 'Scene Management',
                isSubmenu: true,
                options: this.viewManager.sceneManager.getAvailableScenes().map(sceneName => ({
                    text: `Load ${sceneName}`,
                    onClick: async () => {
                        this.hide();
                        let sceneData = {};
                        const engine = this.viewManager.gameEngine;

                        if (sceneName === 'StellarSystemScene') {
                            if (engine.galaxyGenerator) {
                                if (!engine.galaxy) engine.galaxy = engine.galaxyGenerator.generateGalaxy();
                                
                                // Reuse existing system data if available (e.g. from Intro)
                                let star = engine.playerStartSystem;
                                let systemDetails = engine.currentSystemDetails;
                                let planets = engine.currentPlanets;

                                if (!star || !systemDetails || !planets) {
                                    star = star || engine.galaxy.stars[Math.floor(Math.random() * engine.galaxy.stars.length)];
                                    // Ensure star has a color property if missing (fallback for raw generation)
                                    if (!star.color) star.color = 0xffaa00;
                                    if (!star.starClass) star.starClass = "G-Type";

                                    systemDetails = await engine.galaxyGenerator.getSystemDetails(star);
                                    const systemGen = engine.loreMaster.stellarSystemGenerator;
                                    planets = systemGen.generatePlanets(systemDetails);
                                }

                                sceneData = { systemDetails, planets, star, galaxy: engine.galaxy, playIntro: false };
                            }
                        } else if (sceneName === 'GalaxyMapScene') {
                            if (engine.galaxyGenerator && !engine.galaxy) engine.galaxy = engine.galaxyGenerator.generateGalaxy();
                            sceneData = { galaxy: engine.galaxy, startLocation: engine.playerStartSystem };
                        } else if (sceneName === 'PlanetSurfaceScene') {
                            // Use first planet of current system or mock
                            if (engine.currentPlanets && engine.currentPlanets.length > 0) {
                                sceneData = engine.currentPlanets[0];
                            } else {
                                sceneData = {
                                    name: "Test Planet",
                                    seeds: [Math.random(), Math.random(), Math.random(), Math.random()],
                                    type: "Terrestrial",
                                    radius: 1,
                                    atmosphere: "Breathable"
                                };
                            }
                        }

                        this.viewManager.transitionToScene(sceneName, sceneData);
                    }
                }))
            },
            {
                text: 'Core Engine',
                isSubmenu: true,
                options: [
                    {
                        text: 'Test Hyperphysics Engine', onClick: () => {
                            Logger.message('Testing Hyperphysics Engine...');
                            this.viewManager.gameEngine.hyperphysicsEngine.test();
                        }
                    },
                ]
            },
            {
                text: 'Procedural Generation',
                isSubmenu: true,
                options: [
                    {
                        text: 'Test Galaxy Generation', onClick: () => {
                            this.viewManager.gameEngine.galaxyGenerator.generateStars();
                            this.uiManager.showGalaxyMap();
                        }
                    },
                    {
                        text: 'Test Lore Generation', onClick: async () => {
                            const star = this.viewManager.gameEngine.galaxyGenerator.stars[Math.floor(Math.random() * this.viewManager.gameEngine.galaxyGenerator.stars.length)];
                            const noise = { n1: Math.random(), n2: Math.random(), n3: Math.random(), n4: Math.random() };
                            const params = this.viewManager.gameEngine.galaxyGenerator.params;
                            const lore = await this.viewManager.gameEngine.loreMaster.generateSystemLore(star, noise, params);
                            Logger.message(`Generated Lore: ${JSON.stringify(lore)}`);
                        }
                    },
                ]
            },
        ];

        this._showSubMenu('Test Menu', testOptions, () => this.uiManager.showMainMenu());
        this.element.style.display = 'block';
        this.element.classList.add('menu-reveal');
        Logger.message("TestMenu component shown.");
    }

    hide() {
        this.element.style.display = 'none';
        this.element.classList.remove('menu-reveal');
        Logger.message("TestMenu component hidden.");
    }
}
