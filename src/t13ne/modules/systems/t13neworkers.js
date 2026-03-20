// t13neworkers.js
import workerpool from 'workerpool';
import PRNG from '../systems/t13ne-prng.js';
import WasmManager from '../wasm/WasmManager.js';
import { Deck } from '../mechanics/t13ne-cards.js';
import CodexLoader from '../codex/CodexLoader.js';

let aiConfig = null;

/**
 * Initializes the AI configuration and WASM for the worker.
 */
async function INITIALIZE_AI({ config }) {
    aiConfig = config;
    await WasmManager.initialize();
    await PRNG.ready();
    return 'AI and WASM Initialized';
}

/**
 * Headless AI Service for usage within the worker.
 */
const AIService = {
    async generateText(prompt, options = {}) {
        if (!aiConfig) throw new Error("Worker AI not initialized");
        const { provider, apiKey, baseUrl, model, temperature, systemPrompt } = aiConfig;

        try {
            if (provider === 'openai') {
                return await this._generateOpenAI(prompt, aiConfig, options);
            } else if (provider === 'gemini') {
                return await this._generateGemini(prompt, aiConfig, options);
            } else if (provider === 'ollama') {
                return await this._generateOllama(prompt, aiConfig, options);
            }
        } catch (e) {
            console.error("Worker AI Error:", e);
        }

        // Mock Fallback
        return JSON.stringify({
            rationale: "Mock response (Worker)",
            cardsToPlay: [],
            narrativeEffect: "The worker calculated a narrative beat.",
            spawnSubPlot: null
        });
    },

    async _generateOpenAI(prompt, config, options) {
        const url = 'https://api.openai.com/v1/chat/completions';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model || 'gpt-3.5-turbo',
                messages: [
                    { role: "system", content: config.systemPrompt },
                    { role: "user", content: prompt }
                ],
                temperature: options.temperature ?? config.temperature
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    },

    async _generateGemini(prompt, config, options) {
        const model = config.model || 'gemini-pro';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: config.systemPrompt + "\n\n" + prompt }] }],
                generationConfig: { temperature: options.temperature ?? config.temperature }
            })
        });
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    },

    async _generateOllama(prompt, config, options) {
        const url = `${config.baseUrl || 'http://localhost:11434'}/api/generate`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config.model,
                prompt: `${config.systemPrompt}\n\n${prompt}`,
                stream: false,
                options: { temperature: options.temperature ?? config.temperature }
            })
        });
        const data = await response.json();
        return data.response || "";
    }
};

/**
 * Evaluates state machine transitions based on ruleset and context.
 * Uses a stateless, data-driven approach to determine the next state.
 */
function evaluateStateMachine(currentState, context, ruleset) {
    if (!ruleset || !ruleset.states) return { state: currentState, transition: null };

    const stateConfig = ruleset.states[currentState];
    if (!stateConfig || !stateConfig.transitions) return { state: currentState, transition: null };

    // Evaluation logic for common T13 transitions
    for (const [transition, targetState] of Object.entries(stateConfig.transitions)) {
        switch (transition) {
            case 'HOOKS_SET':
                if (context.isHooked) return { state: targetState, transition };
                break;
            case 'CLIMAX_APPROACHING':
                if (context.tensionLevel >= 7) return { state: targetState, transition };
                break;
            case 'ENGAGE':
                if (context.isEngaged) return { state: targetState, transition };
                break;
            case 'RESOLUTION':
                if (context.isResolved || (context.yarnPoints && context.yarnPoints >= 20)) return { state: targetState, transition };
                break;
            case 'RELAX':
                if (context.tensionLevel < 4) return { state: targetState, transition };
                break;
            case 'COMPLICATE':
                if (context.tensionLevel > 5) return { state: targetState, transition };
                break;
            case 'RESOLVE':
                if (context.isResolved) return { state: targetState, transition };
                break;
        }
    }

    return { state: currentState, transition: null };
}

/**
 * Calculates conflict boons for a plot.
 */
function calculateConflictBoons(plot) {
    if (!plot.Conflict || !plot.Conflict.Sides) return plot.conflictBoons;

    const sideBoons = {};
    for (const [sideName, sideData] of Object.entries(plot.Conflict.Sides)) {
        let maxBoon = 0;
        const sideChars = (plot.characters || []).filter(c => c.hookSide === sideName);
        for (const char of sideChars) {
            if (char.applicableBoonScore > maxBoon) maxBoon = char.applicableBoonScore;
        }
        sideBoons[sideName] = Math.max(13, maxBoon);
    }

    if (sideBoons['Dominant'] && sideBoons['Pressed']) {
        if (sideBoons['Dominant'] <= sideBoons['Pressed']) {
            sideBoons['Dominant'] = sideBoons['Pressed'] + 1;
        }
    }
    return sideBoons;
}

/**
 * Main entry point for processing plots in the worker.
 */
async function process_plots(data) {
    const { plots, rulesets } = data;
    const deltas = [];

    if (!rulesets) return deltas;

    for (const plot of plots) {
        // 1. Calculate Conflict Boons
        const newBoons = calculateConflictBoons(plot);
        if (JSON.stringify(newBoons) !== JSON.stringify(plot.conflictBoons)) {
            deltas.push({ id: plot.id, action: 'UPDATE_BOONS', newBoons });
        }

        // 2. Evaluate State Transitions
        const machineType = plot.Rank === 'Scene' ? 'warpMachine' : 'plotMachine';
        const ruleset = rulesets[machineType];

        const context = {
            ...plot,
            isHooked: (plot.characters || []).length > 0,
            isEngaged: plot.yarnPoints > 5
        };

        const result = evaluateStateMachine(plot.currentState, context, ruleset);
        if (result.transition) {
            deltas.push({ id: plot.id, action: 'TRANSITION_STATE', transition: result.transition });
        }

        // 3. Tension & Yarn Logic
        if (plot.yarnPoints <= 0) {
            deltas.push({ id: plot.id, action: 'UPDATE_TENSION', newLevel: Math.min(11, plot.tensionLevel + 1) });
            deltas.push({ id: plot.id, action: 'LOG_EVENT', message: "Tension rose due to lack of Yarn." });
        }

        // 4. AI-Driven Decision (Optional/Piecemeal)
        // For performance, we might only do this for "Zenith" plots or high importance
        if (plot.currentState === 'Zenith' && plot.importance >= 8) {
             // ... could call AIService here if needed ...
        }
    }

    return deltas;
}

/**
 * Offloaded cascade generation.
 */
async function generate_cascade_hierarchy(data) {
    const { startRank, seed, variety, name, options = {} } = data;

    // Initialization
    await CodexLoader.initialize();
    const allCards = await CodexLoader.getAllCardData();
    const virtualDeck = new Deck(seed);
    await virtualDeck.addSourceDeck('virtual', allCards);
    virtualDeck.shuffle();

    // Load spreads
    const spreadsRes = await fetch('/plugins/t13ne/data/cardspreads.json');
    const spreadsData = await spreadsRes.json();
    const spreadDefinitions = {};
    spreadsData.spreads.forEach(s => spreadDefinitions[s.id] = s);

    /**
     * Internal getCardSpread helper.
     */
    function getCardSpread(spreadId) {
        const def = spreadDefinitions[spreadId];
        if (!def) return null;
        const drawn = virtualDeck.draw(def.numCards || 1);
        return {
            cards: drawn.map((card, i) => ({ card, position: def.cardPositions[i] || { role: "Member" } })),
            spreadDefinition: def
        };
    }

    /**
     * Ported getCompositeSpread logic.
     */
    function getCompositeSpread(spreadId, opt = {}) {
        if (spreadId === 'frame-act') {
            return { variety: 'Frame', components: { hooks: [getCardSpread('hook')], revelation: getCardSpread('revelation') } };
        }
        if (spreadId === 'loom-act') {
            return { variety: 'Loom', components: { pairs: [{ warp: getCardSpread('warp'), weft: getCardSpread('weft') }] } };
        }
        if (spreadId === 'zenith-act') {
            return { variety: 'Zenith', components: { ordeal: getCardSpread('ordeal'), gain: getCardSpread('gain') } };
        }
        if (spreadId === 'story-3-act') {
            return {
                components: {
                    frame: getCompositeSpread('frame-act', opt),
                    loom: getCompositeSpread('loom-act', opt),
                    zenith: getCompositeSpread('zenith-act', opt)
                }
            };
        }

        // Structural ranks
        const hierarchy = ['Cycle', 'Epic', 'Volume', 'Arc', 'Chapter', 'Story', 'Act', 'Scene'];
        const rankIdx = hierarchy.indexOf(spreadId.charAt(0).toUpperCase() + spreadId.slice(1));

        const childTypes = { 'cycle': 'epic', 'epic': 'volume', 'volume': 'arc', 'arc': 'chapter', 'chapter': 'story-3-act' };
        const childType = childTypes[spreadId.toLowerCase()];

        if (childType) {
            const count = (opt.singleLine) ? 1 : 3;
            const components = { children: [] };
            for (let i = 0; i < count; i++) {
                components.children.push({ name: `${spreadId} Part ${i + 1}`, childSpreadId: childType });
            }
            return { components };
        }

        return null;
    }

    /**
     * Recursive builder.
     */
    async function buildNode(rank, nodeSeed, nodeVariety, nodeName) {
        const node = {
            Name: nodeName,
            Rank: rank,
            variety: nodeVariety,
            children: []
        };

        const hierarchy = ['Cycle', 'Epic', 'Volume', 'Arc', 'Chapter', 'Story', 'Act', 'Scene'];
        const rankIndex = hierarchy.indexOf(rank);
        if (rankIndex === -1 || rankIndex >= hierarchy.length - 1) return node;

        const nextRank = hierarchy[rankIndex + 1];

        let spreadId = rank.toLowerCase();
        if (rank === 'Story') spreadId = 'story-3-act';
        else if (rank === 'Act' && nodeVariety) spreadId = `${nodeVariety.toLowerCase()}-act`;

        const composite = getCompositeSpread(spreadId, options);
        if (composite && composite.components) {
            for (const [key, component] of Object.entries(composite.components)) {
                if (Array.isArray(component)) {
                    for (const childDef of component) {
                        node.children.push(await buildNode(nextRank, `${nodeSeed}_${childDef.name}`, childDef.variety || 'Unknown', childDef.name.includes(nodeName) ? childDef.name : `${nodeName} - ${childDef.name}`));
                    }
                } else if (key === 'children' && Array.isArray(component)) {
                     for (const childDef of component) {
                        node.children.push(await buildNode(nextRank, `${nodeSeed}_${childDef.name}`, childDef.variety || 'Unknown', `${nodeName} - ${childDef.name}`));
                    }
                } else if (typeof component === 'object' && component.variety) {
                     node.children.push(await buildNode(nextRank, `${nodeSeed}_${key}`, component.variety, `${nodeName} - ${key}`));
                }
            }
        }
        return node;
    }

    return await buildNode(startRank, seed, variety, name);
}

function ping() {
    return 'pong';
}

// Register public functions
workerpool.worker({
    ping,
    INITIALIZE_AI,
    process_plots,
    generate_cascade_hierarchy
});
