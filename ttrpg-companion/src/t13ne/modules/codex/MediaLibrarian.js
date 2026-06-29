/**
 * MediaLibrarian is responsible for managing the media manifest.
 * It provides methods to find and filter models and images for use in the game.
 */
export class MediaLibrarian {
    constructor() {
        this.manifest = {
            models: [],
            images: []
        };
        this.isLoaded = false;
    }

    async load() {
        try {
            const response = await fetch('/media/media_manifest.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.manifest = await response.json();
            this.isLoaded = true;
            console.log(`MediaLibrarian: Loaded manifest with ${this.manifest.models.length} models and ${this.manifest.images.length} images.`);
        } catch (error) {
            console.error('MediaLibrarian: Failed to load media manifest.', error);
        }
    }

    /**
     * Finds models by category and optional tags/metadata.
     * @param {string} category - e.g., 'ship', 'plant', 'weapon'
     * @param {object} options - Filter options
     * @param {Array<string>} options.tags - Specific tags to match
     * @param {string} options.era - T13 Era to match
     * @param {string} options.genre - T13 Genre to match
     * @returns {Array<object>} List of matching models
     */
    findModels(category, options = {}) {
        const tags = Array.isArray(options) ? options : (options.tags || []);
        const era = options.era;
        const genre = options.genre;

        return this.manifest.models.filter(m => {
            const catMatch = !category || m.category === category;
            const eraMatch = !era || m.era === era || m.era === 'timeless';
            const genreMatch = !genre || m.genre === genre || m.genre === 'core';
            
            const itemTags = m.tags || [];
            const tagMatch = tags.length === 0 || tags.every(t => 
                itemTags.includes(t) || 
                m.path.toLowerCase().includes(t.toLowerCase()) || 
                m.name.toLowerCase().includes(t.toLowerCase())
            );
            
            return catMatch && eraMatch && genreMatch && tagMatch;
        });
    }

    /**
     * Gets a random model from a category.
     * @param {string} category
     * @param {Function} random - PRNG function (should be a seeded procedural random)
     * @param {object} options - Filter options
     * @returns {object|null}
     */
    getRandomModel(category, random, options = {}) {
        if (!random) {
            console.warn('MediaLibrarian: getRandomModel called without a procedural random function.');
            return null;
        }
        const models = this.findModels(category, options);
        if (models.length === 0) return null;
        return models[Math.floor(random() * models.length)];
    }

    /**
     * Finds images by category.
     * @param {string} category - e.g., 'landscape', 'portrait'
     * @returns {Array<object>}
     */
    findImages(category) {
        return this.manifest.images.filter(i => !category || i.category === category);
    }
}
