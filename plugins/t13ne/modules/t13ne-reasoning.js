import Logger from '@/js/core/Logger.js';
import AIService from '../modules/AIService.js';

/**
 * T13NE Reasoning Module ("The Loom Logic")
 * Evaluates narrative states and proposed events against the "Rules of the Loom".
 */
class T13NE_Reasoning {
    constructor() {
        this.loomRules = [
            "The Believable Loom (Suspension of Disbelief)",
            "The Logical Loom (Narrative Logic)",
            "The Surprise Loom (Subverted Expectations)",
            "The Automatic Loom (Flow)",
            "The Wyrd Loom (Fate/Prophecy)",
            "The Glorious Loom (Rule of Cool)",
            "The Comedic Loom (Rule of Funny)",
            "The Tonal Loom (Genre Consistency)",
            "The Numeric Loom (Respect the Dice)",
            "The Doomed Loom (Respect the Cards)",
            "The Collaborative Loom (Cooperation)",
            "The Entertaining Loom (Rule of Fun)",
            "The Tensioned Loom (Respect Tension / Suspense Levels)"
        ];
    }

    /**
     * Evaluates a proposed narrative event against the Rules of the Loom.
     * @param {object} context - Current game state (Plot, Tension, recent events).
     * @param {string} proposedEvent - The event to evaluate.
     * @returns {Promise<object>} Evaluation result with score and feedback.
     */
    async evaluateNarrative(context, proposedEvent) {
        const prompt = `Evaluate the following proposed narrative event for a T13NE game against the "Rules of the Loom".
        
        Context:
        Plot: ${context.plotName || 'Unknown'}
        Tension Level: ${context.tensionLevel || 'Unknown'}
        Recent Events: ${context.recentEvents || 'None'}
        Genre: ${context.genre || 'Generic'}

        Proposed Event: ""

        Rules of the Loom:
        ${this.loomRules.map(r => `- `).join('\n')}

        Analyze how well this event fits. 
        1. Identify the primary Rule it supports (e.g., Rule of Cool, Logical Loom).
        2. Identify any Rules it might break (e.g., Believable Loom).
        3. Give a score (1-10) on suitability.

        Respond with JSON: { "primaryRule": "", "conflicts": [], "score": 0, "feedback": "" }`;

        try {
            const response = await AIService.generateText(prompt);
            const jsonMatch = response.match(/\{[\s\S]*}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            Logger.error("T13NE_Reasoning: Evaluation failed", e);
        }
        return { score: 5, feedback: "AI Evaluation failed." };
    }

    /**
     * Suggests the next narrative beat based on the current context and active Loom Rules.
     * @param {object} context 
     * @returns {Promise<string>} Suggested beat.
     */
    async suggestNextBeat(context) {
        const prompt = `You are the Weaver. Suggest the next narrative beat for this T13NE game.
        
        Context:
        Plot: ${context.plotName}
        Current Act: ${context.act || 'Loom'}
        Tension: ${context.tensionLevel}
        
        Prioritize "The Tensioned Loom" (Higher tension = more conflict) and "The Surprise Loom" (Subvert expectations).
        
        Suggestion:`;

        return await AIService.generateText(prompt);
    }
}

export default new T13NE_Reasoning();
