import { LoreData } from '../LoreData.js';
import Logger from '../../../core/Logger.js';

export class TechGenerator {
    constructor(pluginManager) {
        const funcName = 'TechGenerator.constructor';
        Logger.start(funcName);
        this.pluginManager = pluginManager;
        this.baseProficiencies = LoreData.proficiencies;
        this.facets = []; // Will be loaded from Plugin in initialize()
        this.swayTech = null;

        this.discoveryRules = [
            {
                name: 'Combustion',
                facet: 'Phoenix',
                requires: [
                    { potential: 'fuel' },
                    { potential: 'oxidizer' }
                ]
            },
            {
                name: 'Basic Electronics',
                facet: 'Craft',
                requires: [
                    { potential: 'semiconductor' },
                    { potential: 'conductive', attributes: { metal: true } }
                ]
            }
        ];
        Logger.end(funcName);
    }

    async initialize() {
        const T13NE = this.pluginManager?.getApi('T13', 'T13NE');
        const Codex = T13NE?.getModule('Codex');
        if (Codex) {
            this.swayTech = await Codex.getData('sway', 'sway_technology.json');
            Logger.message(`TechGenerator: Loaded ${this.swayTech ? this.swayTech.length : 0} Sway Tech levels.`);
        }
        
        const Facets = T13NE?.getModule('Facets');
        if (Facets) {
            this.facets = await Facets.getFacetsArr();
            Logger.message(`TechGenerator: Loaded ${this.facets.length} Facets from T13NE.`);
        }
    }

    getSwayTechLevel(chiLevel) {
        if (!this.swayTech) return { Type: "Unknown", Sway_Type_Description: "Tech data not loaded." };
        
        // Find the highest tech level with Chi <= chiLevel
        let bestMatch = this.swayTech[0];
        for (const tech of this.swayTech) {
            if (tech.Chi <= chiLevel) {
                bestMatch = tech;
            } else {
                break; // Assuming sorted by Chi
            }
        }
        return bestMatch;
    }

    developTechnology(initialResources) {
        const funcName = 'TechGenerator.developTechnology';
        Logger.start(funcName);
        let knownProficiencies = new Map();
        this.baseProficiencies.forEach(p => {
            if (initialResources.includes(p.name)) {
                const hyperspaceCoordinate = this.getHyperspaceCoordinate(p.facet);
                knownProficiencies.set(p.name, { ...p, level: 0, parents: [], hyperspaceCoordinate });
            }
        });

        let newDiscovery = true;
        let depth = 0;
        while (newDiscovery) {
            newDiscovery = false;
            depth++;

            this.discoveryRules.forEach(rule => {
                if (!knownProficiencies.has(rule.name)) {
                    const ingredients = this.findIngredients(knownProficiencies, rule.requires);
                    if (ingredients) {
                        const hyperspaceCoordinate = this.calculateChildCoordinate(ingredients.map(i => i.hyperspaceCoordinate));
                        knownProficiencies.set(rule.name, {
                            name: rule.name,
                            facet: rule.facet,
                            level: depth,
                            parents: ingredients.map(i => i.name),
                            hyperspaceCoordinate
                        });
                        newDiscovery = true;
                    }
                }
            });

            if (depth > 10) break; // Safety break
        }

        const techLevel = knownProficiencies.size;
        const specialization = this.calculateSpecialization(knownProficiencies);

        Logger.end(funcName);
        return {
            techLevel,
            specialization,
            knownProficiencies: Array.from(knownProficiencies.values())
        };
    }

    findIngredients(knownProficiencies, requirements) {
        const funcName = 'TechGenerator.findIngredients';
        Logger.start(funcName);
        const availableProficiencies = Array.from(knownProficiencies.values());
        const ingredients = [];

        for (const req of requirements) {
            const found = availableProficiencies.find(prof => {
                if (ingredients.includes(prof)) return false; // Don't reuse ingredients

                if (req.potential) {
                    if (!prof.potential || !prof.potential[req.potential]) return false;
                }
                if (req.attributes) {
                    if (!prof.attributes) return false;
                    for (const key in req.attributes) {
                        if (prof.attributes[key] !== req.attributes[key]) return false;
                    }
                }
                return true;
            });

            if (found) {
                ingredients.push(found);
            } else {
                Logger.end(funcName, null);
                return null; // Requirement not met
            }
        }
        Logger.end(funcName, ingredients);
        return ingredients;
    }


    getHyperspaceCoordinate(facetName) {
        const funcName = 'TechGenerator.getHyperspaceCoordinate';
        Logger.start(funcName);
        const coordinate = new Array(24).fill(0);
        const facetIndex = this.facets.findIndex(f => f.FacetName === facetName);
        if (facetIndex !== -1) {
            coordinate[facetIndex] = 1;
        }
        Logger.end(funcName);
        return coordinate;
    }

    calculateChildCoordinate(parentCoordinates) {
        const funcName = 'TechGenerator.calculateChildCoordinate';
        Logger.start(funcName);
        const childCoordinate = new Array(24).fill(0);
        for (let i = 0; i < 24; i++) {
            parentCoordinates.forEach(coord => {
                childCoordinate[i] += coord[i];
            });
            childCoordinate[i] /= parentCoordinates.length;
        }
        Logger.end(funcName);
        return childCoordinate;
    }


    calculateSpecialization(discoveredProficiencies) {
        const funcName = 'TechGenerator.calculateSpecialization';
        Logger.start(funcName);
        const facetCounts = {};
        discoveredProficiencies.forEach(prof => {
            facetCounts[prof.facet] = (facetCounts[prof.facet] || 0) + 1;
        });

        let maxCount = 0;
        let specialization = 'Generalist';
        for (const facet in facetCounts) {
            if (facetCounts[facet] > maxCount) {
                maxCount = facetCounts[facet];
                specialization = facet;
            }
        }
        Logger.end(funcName, specialization);
        return specialization;
    }
}
