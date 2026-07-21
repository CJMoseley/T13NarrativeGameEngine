// TensorFlow.js is loaded dynamically in the initialize method to prevent initial load blocking.
import Logger from '../../../core/Logger.js';

/**
 * An advanced procedural name generator powered by a pre-trained word vector model (e.g., GloVe).
 * This system leverages TensorFlow.js to find semantically related words and combine them
 * into new, plausible names, providing massive permutation without requiring custom model training.
 */
export class MLNameGenerator {
    constructor() {
        this.modelPath = 'https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/model.json';
        this.metadataPath = 'https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/metadata.json';

        this.wordVectors = null; // The main tensor of word vectors
        this.vocabulary = {}; // A map of word-to-index
        this.wordIndex = {}; // A map for quick word-to-index lookups
        this.modelLoaded = false;
        this.tf = null; // Cache the tensorflow instance

        // Caches for the seed pools to avoid matrix math during generation loops
        this.pools = new Map();
        this.seeds = ['technology', 'systems', 'science', 'energy', 'data', 'power', 'home', 'origin', 'cradle', 'foundation', 'sanctuary', 'world'];
    }

    /**
     * Asynchronously loads the pre-trained word vector model and its vocabulary.
     * @returns {Promise<void>}
     */
    async initialize() {
        Logger.start('MLNameGenerator.initialize');
        try {
            Logger.message("MLNameGenerator: Importing TensorFlow.js...");
            this.tf = await import('https://esm.sh/@tensorflow/tfjs@4.20.0');
            const tf = this.tf;

            // Explicitly hint that we are in a browser environment to avoid Node.js detection warnings
            if (tf.env) {
                tf.env().set('IS_NODE', false);
            }

            // Force CPU backend
            await tf.setBackend('cpu');
            Logger.message(`MLNameGenerator: Using backend: ${tf.getBackend()}`);

            // Load the vocabulary
            Logger.message("MLNameGenerator: Fetching metadata (approx 1.2MB)...");
            const metadataResponse = await fetch(this.metadataPath);
            if (!metadataResponse.ok) throw new Error(`Failed to fetch metadata: ${metadataResponse.statusText}`);
            const metadata = await metadataResponse.json();
            this.vocabulary = metadata.word_index;

            for (const word of Object.keys(this.vocabulary)) {
                this.wordIndex[this.vocabulary[word]] = word;
            }

            // Load the model
            Logger.message("MLNameGenerator: Loading layers model...");
            const model = await tf.loadLayersModel(this.modelPath);
            const embeddingLayer = model.layers.find(l => l.getClassName() === 'Embedding');
            if (!embeddingLayer) throw new Error("No embedding layer found.");

            Logger.message("MLNameGenerator: Extracting word vectors...");
            this.wordVectors = embeddingLayer.getWeights()[0].clone();
            model.dispose();

            // PRE-CALCULATION PHASE
            // We calculate the pools now while things are quiet so we don't hang later
            Logger.message("MLNameGenerator: Pre-calculating semantic pools to prevent UI hangs...");
            for (const seed of this.seeds) {
                if (this.vocabulary.hasOwnProperty(seed)) {
                    const pool = await this.findSimilarWords(seed, 60);
                    this.pools.set(seed, pool);
                }
            }

            this.modelLoaded = true;
            Logger.message(`Word Vector Name Generator: Fully cached and ready.`);
            Logger.end('MLNameGenerator.initialize', 'Success');
        } catch (error) {
            Logger.message(`ERROR: Word Vector Name Generator: Failed to initialize. Error: ${error}`);
            this.modelLoaded = false;
            Logger.end('MLNameGenerator.initialize', 'Failure');
        }
    }

    /**
     * Finds the N most semantically similar words to a given word.
     * @param {string} word The seed word.
     * @param {number} count The number of similar words to find.
     * @returns {Array<string>} An array of the most similar words.
     */
    async findSimilarWords(word, count = 10) {
        // Return cached pool if available
        if (this.pools.has(word)) {
            return this.pools.get(word).slice(0, count);
        }

        if (!this.modelLoaded && !this.wordVectors) return [];

        const tf = this.tf;
        if (!tf) return [];

        return tf.tidy(() => {
            const seedIndex = this.vocabulary[word];
            if (seedIndex === undefined || seedIndex >= this.wordVectors.shape[0]) return [];

            const seedVector = this.wordVectors.slice([seedIndex, 0], [1]);
            const similarities = tf.matMul(this.wordVectors, seedVector.transpose()).squeeze();
            const { indices } = tf.topk(similarities, count + 1, true);

            const topIndices = indices.dataSync();
            const similarWords = [];
            for (const currentIndex of topIndices) {
                if (currentIndex !== seedIndex) {
                    similarWords.push(this.wordIndex[currentIndex]);
                }
            }
            return similarWords;
        });
    }

    async _yield() {
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    async generateSystemName(n1, n2, n3) {
        if (!this.modelLoaded) {
            return `Cognition-Offline-${Math.floor(n1 * 1000)}`;
        }

        const systemSeeds = ['technology', 'systems', 'science', 'energy', 'data', 'power'];
        const seedWord = systemSeeds[Math.floor(n3 * systemSeeds.length)];

        // This is now an instant O(1) lookup since it's cached!
        const similarWords = await this.findSimilarWords(seedWord, 50);
        if (similarWords.length < 2) return `${seedWord.toUpperCase()} DYNAMICS`;

        const word1 = similarWords[Math.floor(n1 * similarWords.length)];
        const word2 = similarWords[Math.floor(n2 * similarWords.length)];

        const finalName = `${word1} ${word2}`;
        return finalName.replace(/\b\w/g, char => char.toUpperCase());
    }

    async generateHomeworldName(systemName, speciesName, speciesKey, techLevelKey, n3, star) {
        if (!this.modelLoaded) return `${speciesName} Prime`;

        const hwSeeds = ['home', 'origin', 'cradle', 'foundation', 'sanctuary', 'world'];
        const seedWord = hwSeeds[Math.floor(n3 * hwSeeds.length)];

        // Instant lookup!
        const similarWords = await this.findSimilarWords(seedWord, 20);
        if (similarWords.length < 1) return `${speciesName} Prime`;

        const descriptiveWord = similarWords[Math.floor(n3 * 100 % similarWords.length)];
        const speciesRoot = speciesName.split(' ')[0];

        return `${speciesRoot}'s ${descriptiveWord.charAt(0).toUpperCase() + descriptiveWord.slice(1)}`;
    }
}