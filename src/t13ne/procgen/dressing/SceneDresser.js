import Logger from '../../core/Logger.js';
import CodexLoader from '../../modules/codex/CodexLoader.js';

/**
 * SceneDresser handles the procedural placement of props and details within a T13Scene.
 * It uses Dressing Profiles and AI motifs to create immersive environments.
 */
export class SceneDresser {
    constructor(t13ne) {
        this.t13ne = t13ne;
        this.profiles = null;
    }

    async loadProfiles() {
        if (this.profiles) return;
        try {
            this.profiles = await CodexLoader.getData('dressing', 'profiles.json');
            Logger.message('SceneDresser: Dressing profiles loaded.');
        } catch (e) {
            Logger.warn('SceneDresser: Failed to load dressing profiles.', e);
        }
    }

    /**
     * Dresses a scene based on a profile and plot context.
     * @param {T13Scene} scene 
     * @param {object} plot - The active T13Plot
     */
    async dressScene(scene, plot) {
        await this.loadProfiles();
        if (!this.profiles) return;

        const prng = this.t13ne.getModule('PRNG');
        const random = (max) => prng ? Math.floor(prng.nextDouble() * max) : 0;
        const randomRange = (min, max) => min + random(max - min + 1);

        // Determine profile from plot or scene type
        let profileKey = plot?.SceneProfile || this._guessProfile(scene);
        const profile = this.profiles[profileKey];

        if (!profile) {
            Logger.warn(`SceneDresser: No profile found for '${profileKey}'`);
            return;
        }

        Logger.message(`SceneDresser: Dressing scene '${scene.constructor.name}' with profile '${profile.Name}'`);

        const era = plot?.Era || profile.Era;
        const genre = plot?.Genre || profile.Genre;
        const motifs = plot?.Motifs || [];

        // 1. Process Motif Overrides
        const propList = [...profile.Props];
        motifs.forEach(motif => {
            if (profile.Motifs && profile.Motifs[motif]) {
                const motifDef = profile.Motifs[motif];
                propList.push({
                    Category: motifDef.Category || profile.Category,
                    Tags: motifDef.Tags,
                    Count: motifDef.Count || [1, 3],
                    Era: motifDef.Era,
                    Genre: motifDef.Genre
                });
            }
        });

        // 2. Query AI for additional "Plot Pertinent" details if available
        const aiDetails = await this._getAIDetails(plot);
        if (aiDetails && aiDetails.length > 0) {
            aiDetails.forEach(detail => {
                propList.push({
                    Category: detail.Category || 'misc',
                    Tags: detail.Tags || [],
                    Count: [1, 1],
                    SpecificName: detail.Name
                });
            });
        }

        // 3. Apply Hard-Tuning Rules if present
        if (profile.Rules) {
            for (const rule of profile.Rules) {
                await this._applyHardTuningRule(scene, rule, { era, genre });
            }
        }

        // 4. Place remaining general props
        for (const propDef of propList) {
            const count = randomRange(propDef.Count[0], propDef.Count[1]);
            for (let i = 0; i < count; i++) {
                const model = this._pickBestModel(propDef.Category, {
                    tags: propDef.Tags,
                    era: propDef.Era || era,
                    genre: propDef.Genre || genre,
                    specificName: propDef.SpecificName
                });

                if (model && typeof scene.addProp === 'function') {
                    const position = this._calculatePropPosition(scene, propDef);
                    await scene.addProp(model.path, position);
                }
            }
        }
    }

    _guessProfile(scene) {
        const type = scene.constructor.name;
        if (type.includes('Space')) return 'ship_interior';
        if (type.includes('Surface')) return 'mine';
        if (type.includes('Orbit')) return 'junkyard';
        return 'ship_interior';
    }

    async _applyHardTuningRule(scene, rule, context) {
        const librarian = CodexLoader.media;
        if (!librarian) return;

        const count = rule.Count || 1;
        const models = librarian.findModels(rule.Category || 'furniture', { tags: rule.Tags, ...context });
        if (models.length === 0) return;

        const prng = this.t13ne.getModule('PRNG');
        const random = () => prng ? prng.nextDouble() : Math.random();

        for (let i = 0; i < count; i++) {
            const model = models[Math.floor(random() * models.length)];
            let pos = { x: 0, y: 0, z: 0 };

            if (rule.Type === 'Line') {
                pos.x = (i - (count - 1) / 2) * (rule.Spacing || 10);
            } else if (rule.Type === 'Center') {
                pos = { x: 0, y: 0, z: 0 };
            } else if (rule.Type === 'Cluster') {
                pos = { 
                    x: (random() - 0.5) * 15, 
                    z: (random() - 0.5) * 15 
                };
            }

            if (typeof scene.addProp === 'function') {
                await scene.addProp(model.path, pos);
            }
        }
    }

    _pickBestModel(category, options) {
        const librarian = CodexLoader.media;
        if (!librarian) return null;

        const prng = this.t13ne.getModule('PRNG');
        const random = () => prng ? prng.nextDouble() : Math.random();

        if (options.specificName) {
            const exact = librarian.findModels(category, { tags: [options.specificName], era: options.era, genre: options.genre });
            if (exact.length > 0) return exact[Math.floor(random() * exact.length)];
        }

        let models = librarian.findModels(category, options);
        let currentTags = [...(options.tags || [])];
        
        while (models.length === 0 && currentTags.length > 0) {
            currentTags.pop();
            models = librarian.findModels(category, { ...options, tags: currentTags });
        }

        if (models.length === 0) {
            models = librarian.findModels(category, { era: options.era, genre: options.genre });
        }

        if (models.length === 0) return null;
        return models[Math.floor(random() * models.length)];
    }

    _calculatePropPosition(scene, propDef) {
        const prng = this.t13ne.getModule('PRNG');
        const spread = 50;
        return {
            x: (prng ? (prng.nextDouble() - 0.5) : (Math.random() - 0.5)) * spread,
            y: 0,
            z: (prng ? (prng.nextDouble() - 0.5) : (Math.random() - 0.5)) * spread
        };
    }

    async _getAIDetails(plot) {
        const AIService = this.t13ne.getModule('AIService');
        if (!plot || !AIService) return null;

        const description = plot.Diegetic_Description || plot.Description;
        const motifs = plot.Motifs?.join(', ') || 'none';
        
        const prompt = `Based on this plot description: "${description}" and motifs: [${motifs}], 
        suggest 2 specific decorative props for the scene. 
        Return ONLY valid JSON array: [{"Category": "furniture|industrial|environment|avatar", "Tags": ["tag1", "tag2"], "Name": "Short Name"}]`;

        try {
            const response = await AIService.generateText(prompt);
            const jsonMatch = response.match(/\[[\s\S]*]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            Logger.warn('SceneDresser: AI details query failed.', e);
        }
        return null;
    }
}
