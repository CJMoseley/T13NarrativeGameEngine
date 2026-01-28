import Logger from "@/src/t13ne/core/Logger.js";
import T13NECardsAPI from "@/src/t13ne/modules/mechanics/t13ne-cards-api.js";
import AIService from "@/src/t13ne/modules/ai/AIService.js";

/**
 * Base class for all AI nodes. Defines the basic structure and execution flow.
 */
class AINode {
    constructor(id) {
        this.id = id;
        this.inputs = {};
        this.output = null;
    }

    /**
     * Executes the node's logic.
     * @param {object} context - The shared context/data passed through the node graph.
     * @returns {Promise<object>} The updated context.
     */
    async execute(context) {
        throw new Error("Execute method must be implemented by subclasses.");
    }
}

/**
 * An AI node that extracts data from a game object and prepares it for a prompt.
 * This node leverages the existing `extract...ForAI` functions.
 */
class DataExtractorNode extends AINode {
    /**
     * @param {string} id - A unique identifier for the node.
     * @param {string} extractorMethod - The name of the method to call on the T13NECardsAPI (e.g., 'extractCardTextForAI').
     * @param {object} options - Options to pass to the extractor method.
     */
    constructor(id, extractorMethod, options = {}) {
        super(id);
        this.extractorMethod = extractorMethod;
        this.options = options;
    }

    async execute(context) {
        const { inputData } = context;
        if (!inputData) {
            Logger.error(`DataExtractorNode (${this.id}): No inputData found in context.`);
            return context;
        }

        if (typeof T13NECardsAPI[this.extractorMethod] === 'function') {
            const extractedText = T13NECardsAPI[this.extractorMethod](inputData, this.options);
            context[this.id] = extractedText; // Add the output to the context using the node's ID
        } else {
            Logger.error(`DataExtractorNode (${this.id}): Method ${this.extractorMethod} not found on T13NECardsAPI.`);
        }
        return context;
    }
}

/**
 * An AI node that formats a prompt using data from the context.
 */
class PromptFormatterNode extends AINode {
    /**
     * @param {string} id - A unique identifier for the node.
     * @param {string} template - A template string with placeholders (e.g., "Describe a scene based on {card1} and {card2}").
     */
    constructor(id, template) {
        super(id);
        this.template = template;
    }

    async execute(context) {
        let prompt = this.template;
        // Replace placeholders like {nodeId} with the output from other nodes
        for (const key in context) {
            const placeholder = `{${key}}`;
            if (prompt.includes(placeholder)) {
                prompt = prompt.replace(new RegExp(placeholder, 'g'), context[key]);
            }
        }
        context[this.id] = prompt;
        return context;
    }
}

/**
 * An AI node that calls the AI service with a prompt.
 */
class AIGenerationNode extends AINode {
    async execute(context) {
        const prompt = context.prompt; // Assumes a previous node created a 'prompt' property
        if (!prompt) {
            Logger.error(`AIGenerationNode (${this.id}): No prompt found in context.`);
            return context;
        }
        const aiResponse = await AIService.generateText(prompt);
        context[this.id] = aiResponse;
        return context;
    }
}

/**
 * An AI node that interprets a card spread (Wyrd Tarot/Yarn) within a narrative structure.
 */
class SpreadInterpreterNode extends AINode {
    /**
     * @param {string} id - Unique identifier.
     * @param {string} [spreadNameField='spreadName'] - Context field for spread name.
     * @param {string} [cardsField='cards'] - Context field for cards array.
     * @param {string} [contextField='narrativeContext'] - Context field for narrative context.
     */
    constructor(id, spreadNameField = 'spreadName', cardsField = 'cards', contextField = 'narrativeContext') {
        super(id);
        this.spreadNameField = spreadNameField;
        this.cardsField = cardsField;
        this.contextField = contextField;
    }

    async execute(context) {
        const spreadName = context[this.spreadNameField] || 'Spread';
        const cards = context[this.cardsField] || [];
        const narrativeContext = context[this.contextField] || '';

        let prompt = `Interpret the following '${spreadName}' spread`;
        if (narrativeContext) prompt += ` regarding: "${narrativeContext}"`;
        prompt += ".\n\nCards:\n";

        if (Array.isArray(cards)) {
            cards.forEach((card, index) => {
                const position = card.position || `Position ${index + 1}`;
                const name = card.name || card.toString();
                const meaning = card.meaning ? ` (${card.meaning})` : "";
                prompt += `- ${position}: ${name}${meaning}\n`;
            });
        }

        prompt += "\nProvide a concise and thematic interpretation.";

        const response = await AIService.generateText(prompt);
        context[this.id] = response;
        return context;
    }
}

/**
 * Manages and executes a graph of AI nodes.
 */
class AIManager {
    constructor() {
        this.nodes = [];
    }

    /**
     * Adds a node to the execution graph. The order of addition defines the execution order.
     * @param {AINode} node - An instance of a class that extends AINode.
     */
    addNode(node) {
        this.nodes.push(node);
    }

    /**
     * Executes the node graph sequentially.
     * @param {object} initialContext - The initial data to process, typically including `inputData`.
     * @returns {Promise<object>} The final context after all nodes have been executed.
     */
    async run(initialContext) {
        let context = { ...initialContext };
        for (const node of this.nodes) {
            context = await node.execute(context);
        }
        return context;
    }
}

export { AIManager, AINode, DataExtractorNode, PromptFormatterNode, AIGenerationNode, SpreadInterpreterNode };






