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
     * Finds models by category and optional tags.
     * @param {string} category - e.g., 'ship', 'plant', 'weapon'
     * @param {Array<string>} tags - Optional tags to filter by
     * @returns {Array<object>} List of matching models
     */
    findModels(category, tags = []) {
        return this.manifest.models.filter(m => {
            const catMatch = !category || m.category === category;
            const tagMatch = tags.length === 0 || tags.every(t => m.path.includes(t) || m.name.includes(t));
            return catMatch && tagMatch;
        });
    }

    /**
     * Gets a random model from a category.
     * @param {string} category
     * @param {Function} random - PRNG function (should be a seeded procedural random)
     * @returns {object|null}
     */
    getRandomModel(category, random) {
        if (!random) {
            console.warn('MediaLibrarian: getRandomModel called without a procedural random function.');
            return null;
        }
        const models = this.findModels(category);
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
