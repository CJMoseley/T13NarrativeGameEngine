// Use the full URL for the ES module build of TensorFlow.js so the browser can resolve it.
import Logger from '../../../core/Logger.js';
import * as tf from 'https://esm.sh/@tensorflow/tfjs@4.20.0';

/**
 * An advanced procedural name generator powered by a pre-trained word vector model (e.g., GloVe).
 * This system leverages TensorFlow.js to find semantically related words and combine them
 * into new, plausible names, providing massive permutation without requiring custom model training.
 */
export class MLNameGenerator {
    constructor() {
        // Updated to use a direct, stable URL for the pre-trained model assets.
        this.modelPath = 'https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/model.json';
        this.metadataPath = 'https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/metadata.json';

        this.wordVectors = null; // The main tensor of word vectors
        this.vocabulary = {}; // A map of word-to-index
        this.wordIndex = {}; // A map for quick word-to-index lookups
        this.modelLoaded = false;
    }

    /**
     * Asynchronously loads the pre-trained word vector model and its vocabulary.
     * @returns {Promise<void>}
     */
    async initialize() {
        Logger.start('MLNameGenerator.initialize');
        try {
            // Load the vocabulary from the metadata file.
            const metadataResponse = await fetch(this.metadataPath);
            if (!metadataResponse.ok) {
                throw new Error(`Failed to fetch metadata: ${metadataResponse.statusText}`);
            }
            const metadata = await metadataResponse.json();
            this.vocabulary = metadata.word_index;

            // Create the reverse mapping (index-to-word) for quick lookups
            // The loaded vocabulary is {word: index}, we need {index: word}
            for (const word of Object.keys(this.vocabulary)) {
                const index = this.vocabulary[word];
                this.wordIndex[index] = word;
            }

            // Load the model which contains the word vectors as a layer weight.
            const model = await tf.loadLayersModel(this.modelPath);
            // Dynamically find the embedding layer to be robust against model version changes
            const embeddingLayer = model.layers.find(l => l.getClassName() === 'Embedding');
            
            if (!embeddingLayer) {
                throw new Error("No embedding layer found in the loaded model.");
            }
            this.wordVectors = embeddingLayer.getWeights()[0];

            tf.dispose(model); // We only need the weights, so we can dispose the rest of the model.

            this.modelLoaded = true;
            Logger.message(`Word Vector Name Generator: Model loaded with ${Object.keys(this.vocabulary).length} words.`);
            Logger.end('MLNameGenerator.initialize', 'Success');
        } catch (error) {
            Logger.message(`ERROR: Word Vector Name Generator: Failed to load model from ${this.modelPath}. Error: ${error}`);
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
    findSimilarWords(word, count = 10) {
        if (!this.modelLoaded || !this.vocabulary.hasOwnProperty(word)) {
            return [];
        }

        return tf.tidy(() => {
            const seedIndex = this.vocabulary[word];
            const seedVector = this.wordVectors.slice([seedIndex, 0], [1]);

            // Calculate cosine similarity between the wordVector and all other vectors.
            // Cosine Similarity = (A . B) / (||A|| * ||B||)
            const similarities = tf.matMul(this.wordVectors, seedVector.transpose()).squeeze();

            // Find the indices of the top N+1 most similar words (the +1 is for the word itself).
            const { values, indices } = tf.topk(similarities, count + 1, true);

            const topIndices = indices.dataSync();
            const similarWords = [];
            for (const currentIndex of topIndices) {
                // Exclude the original word from the results
                if (currentIndex !== seedIndex) {
                    similarWords.push(this.wordIndex[currentIndex]);
                }
            }
            return similarWords;
        });
    }

    /**
     * Generates a name by finding words related to a seed concept and combining them.
     * @param {number} n1 - Noise value for word selection.
     * @param {number} n2 - Noise value for word selection.
     * @param {number} n3 - Noise value for template selection.
     * @returns {string} The generated name.
     */
    generateSystemName(n1, n2, n3) {
        if (!this.modelLoaded) {
            return `Cognition-Offline-${Math.floor(n1 * 1000)}`;
        }

        // 1. Define seed concepts for different name types.
        const seeds = ['technology', 'systems', 'science', 'energy', 'data', 'power'];
        const seedWord = seeds[Math.floor(n3 * seeds.length)];

        // 2. Find a pool of related words.
        const similarWords = this.findSimilarWords(seedWord, 50);
        if (similarWords.length < 2) {
            return `${seedWord.charAt(0).toUpperCase() + seedWord.slice(1)} Dynamics`; // Fallback
        }

        // 3. Use noise to pick two different words from the pool.
        const word1 = similarWords[Math.floor(n1 * similarWords.length)];
        const word2 = similarWords[Math.floor(n2 * similarWords.length)];

        // 4. Combine and format them.
        const finalName = `${word1} ${word2}`;
        // A more robust title-casing
        return finalName.replace(/\b\w/g, char => char.toUpperCase());
    }

    /**
     * Generates a homeworld name using semantic similarity.
     * @param {string} systemName - The name of the system.
     * @param {string} speciesName - The name of the species.
     * @param {string} speciesKey - The key for the species.
     * @param {string} techLevelKey - The tech level key.
     * @param {number} n3 - A noise value for selection.
     * @param {object} star - The star object.
     * @returns {string} The generated homeworld name.
     */
    async generateHomeworldName(systemName, speciesName, speciesKey, techLevelKey, n3, star) {
        if (!this.modelLoaded) {
            return `${speciesName} Prime`; // Fallback
        }

        const seeds = ['home', 'origin', 'cradle', 'foundation', 'sanctuary', 'world'];
        const seedWord = seeds[Math.floor(n3 * seeds.length)];

        const similarWords = this.findSimilarWords(seedWord, 20);
        if (similarWords.length < 1) {
            return `${speciesName} Prime`;
        }

        const descriptiveWord = similarWords[Math.floor(n3 * 100 % similarWords.length)];
        const speciesRoot = speciesName.split(' ')[0];

        return `${speciesRoot}'s ${descriptiveWord.charAt(0).toUpperCase() + descriptiveWord.slice(1)}`;
    }
}