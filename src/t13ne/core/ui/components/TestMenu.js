import Logger from '../../Logger.js';

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
                                    planets = await systemGen.generatePlanets(systemDetails);
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
                text: 'Narrative & Lore',
                isSubmenu: true,
                options: [
                    {
                        text: 'Open Chronicle',
                        onClick: () => this._showChronicle(() => this.show())
                    },
                    {
                        text: 'Lore Database',
                        onClick: () => this._showLoreExplorer(() => this.show())
                    },
                    {
                        text: 'Referee Controls',
                        isSubmenu: true,
                        options: [
                            {
                                text: 'Start Heartbeat (5s)',
                                onClick: () => {
                                    const Ref = this.viewManager.engine.getModule('Referee');
                                    if (Ref) Ref.startHeartbeat(5000);
                                }
                            },
                            {
                                text: 'Start Heartbeat (1s)',
                                onClick: () => {
                                    const Ref = this.viewManager.engine.getModule('Referee');
                                    if (Ref) Ref.startHeartbeat(1000);
                                }
                            },
                            {
                                text: 'Stop Heartbeat',
                                onClick: () => {
                                    const Ref = this.viewManager.engine.getModule('Referee');
                                    if (Ref) Ref.stopHeartbeat();
                                }
                            },
                            {
                                text: 'Process Single Turn',
                                onClick: () => {
                                    const Ref = this.viewManager.engine.getModule('Referee');
                                    if (Ref) Ref.processTurn();
                                }
                            }
                        ]
                    }
                ]
            },
            {
                text: 'Authoring Tools',
                isSubmenu: true,
                options: [
                    {
                        text: 'Open Control Panel',
                        onClick: () => {
                            window.open('/src/t13ne/t13ne-control-panel.html', '_blank');
                        }
                    },
                    {
                        text: 'Open Proficiency Manager',
                        onClick: () => {
                            window.open('/src/t13ne/proficiency-manager.html', '_blank');
                        }
                    },
                    {
                        text: 'Author Mode Dashboard',
                        onClick: () => {
                            window.open('/src/t13ne/index.html', '_blank');
                        }
                    }
                ]
            },
            {
                text: 'Procedural Generation',
                isSubmenu: true,
                options: [
                    {
                        text: 'Test Galaxy Generation', onClick: () => {
                            const engine = this.viewManager.gameEngine;
                            if (engine.galaxyGenerator) {
                                engine.galaxy = engine.galaxyGenerator.generateGalaxy();
                                this.viewManager.showGalaxyMap();
                            }
                        }
                    },
                    {
                        text: 'Test Lore Generation', onClick: async () => {
                            const engine = this.viewManager.gameEngine;
                            if (!engine.galaxyGenerator) return;

                            if (!engine.galaxyGenerator.stars || engine.galaxyGenerator.stars.length === 0) {
                                engine.galaxyGenerator.generateStars();
                            }

                            const star = engine.galaxyGenerator.stars[Math.floor(Math.random() * engine.galaxyGenerator.stars.length)];
                            const noise = { n1: Math.random(), n2: Math.random(), n3: Math.random(), n4: Math.random() };
                            const params = engine.galaxyGenerator.params;
                            const lore = await engine.loreMaster.generateSystemLore(star, noise, params);
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

    _showChronicle(parentMenuFn) {
        this._clear();
        const titleElement = document.createElement('h2');
        titleElement.textContent = 'Narrative Chronicle';
        this.menuOptionsElement.appendChild(titleElement);

        const Ref = this.viewManager.engine.getModule('Referee');
        const chronicleContainer = document.createElement('div');
        chronicleContainer.style.cssText = 'max-height: 400px; overflow-y: auto; background: rgba(0,0,0,0.5); padding: 10px; border: 1px solid #337ab7; text-align: left; font-family: monospace; font-size: 0.8rem; margin-bottom: 10px; pointer-events: auto;';

        const updateChronicle = () => {
            if (!Ref) {
                chronicleContainer.textContent = 'Referee module not found.';
                return;
            }
            chronicleContainer.innerHTML = '';
            Ref.chronicle.slice().reverse().forEach(entry => {
                const item = document.createElement('div');
                item.style.marginBottom = '8px';
                item.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
                item.style.paddingBottom = '4px';

                const time = new Date(entry.timestamp).toLocaleTimeString();
                const color = entry.type === 'Mechanical' ? '#818cf8' : (entry.type === 'Diegetic' ? '#34d399' : '#94a3b8');

                item.innerHTML = `
                    <div style="color: #666; font-size: 0.7rem;">[${time}] ${entry.source}</div>
                    <div style="color: ${color}; font-weight: bold;">${entry.type}:</div>
                    <details>
                        <summary style="cursor: pointer; color: #eee;">${entry.message}</summary>
                        ${entry.details ? `<pre style="font-size: 0.6rem; color: #888;">${JSON.stringify(entry.details, null, 2)}</pre>` : ''}
                    </details>
                `;
                chronicleContainer.appendChild(item);
            });
        };

        updateChronicle();
        this.menuOptionsElement.appendChild(chronicleContainer);

        // Auto-refresh interval while viewing
        const intervalId = setInterval(updateChronicle, 2000);

        this._addOption({
            text: 'Refresh',
            onClick: updateChronicle
        });

        this._addOption({
            text: 'Back',
            onClick: () => {
                clearInterval(intervalId);
                parentMenuFn();
            }
        });
    }

    _showLoreExplorer(parentMenuFn) {
        this._clear();
        const titleElement = document.createElement('h2');
        titleElement.textContent = 'Lore Database';
        this.menuOptionsElement.appendChild(titleElement);

        const Game = this.viewManager.engine.getModule('Game');
        if (!Game) {
            const err = document.createElement('p');
            err.textContent = 'Game module not loaded.';
            this.menuOptionsElement.appendChild(err);
            this._addOption({ text: 'Back', onClick: parentMenuFn });
            return;
        }

        const entities = Game.getAllEntities();
        const categories = {
            'Plots': entities.filter(e => e.constructor.name === 'T13Plot' || e.Rank),
            'Characters': entities.filter(e => e.constructor.name === 'Character' || e.model),
            'Lores': entities.filter(e => e.topic && e.content),
            'Locations': entities.filter(e => e.descendantType === 'Location' || (e.Type === 'Location')),
            'Descendants': entities.filter(e => e.constructor.name === 'Descendant' && e.Type !== 'Location')
        };

        const explorerContainer = document.createElement('div');
        explorerContainer.style.cssText = 'max-height: 450px; overflow-y: auto; padding: 10px; pointer-events: auto;';

        Object.entries(categories).forEach(([name, list]) => {
            if (list.length === 0) return;

            const section = document.createElement('details');
            section.style.marginBottom = '10px';
            section.innerHTML = `<summary style="cursor: pointer; font-weight: bold; color: #38bdf8; font-size: 1.1rem;">${name} (${list.length})</summary>`;

            const listDiv = document.createElement('div');
            listDiv.style.paddingLeft = '15px';
            list.forEach(ent => {
                const item = document.createElement('details');
                item.style.margin = '5px 0';
                item.style.fontSize = '0.85rem';
                const itemName = ent.Name || ent.name || ent.topic || 'Unnamed';
                item.innerHTML = `
                    <summary style="cursor: pointer; color: #eee;">${itemName} <span style="font-size: 0.7rem; color: #666;">(${ent.Rank || ent.charType || ent.type || ''})</span></summary>
                    <div style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 4px; margin-top: 5px;">
                        <p style="margin: 0 0 5px 0;">${ent.Description || ent.description || ent.content || 'No description.'}</p>
                        <pre style="font-size: 0.6rem; color: #888; overflow-x: auto;">${JSON.stringify(ent, (k, v) => (k === 't13ne' || k === 'parentPlot' ? undefined : v), 2)}</pre>
                    </div>
                `;
                listDiv.appendChild(item);
            });
            section.appendChild(listDiv);
            explorerContainer.appendChild(section);
        });

        this.menuOptionsElement.appendChild(explorerContainer);

        this._addOption({ text: 'Back', onClick: parentMenuFn });
    }

    hide() {
        this.element.style.display = 'none';
        this.element.classList.remove('menu-reveal');
        Logger.message("TestMenu component hidden.");
    }
}
