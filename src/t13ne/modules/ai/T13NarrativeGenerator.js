import Logger from "../../core/Logger.js";
import AIService from "./AIService.js";

/**
 * T13NarrativeGenerator
 * Helper class to generate narrative structures like Ratchets, Atmospherics, and Drama elements
 * using the AI Service.
 */
class T13NarrativeGenerator {
    /**
     * Generates prepared drama elements for a Plot.
     * @param {T13Plot} plot - The plot to generate drama for.
     * @returns {Promise<object>} The generated drama object containing ratchets, atmospherics, etc.
     */
    static async generatePreparedDrama(plot) {
        const context = {
            name: plot.Name,
            conflict: plot.Conflict,
            genre: plot.genre || 'General',
            era: plot.era || 'Timeless',
            tone: plot.tone || 'Dramatic',
            tension: plot.tensionLevel || 0
        };

        Logger.message(`T13NarrativeGenerator: Generating drama elements for '${context.name}'...`);

        const prompt = `Generate a set of narrative drama elements for a T13NE Plot.
Context:
Name: ${context.name}
Genre: ${context.genre}
Era: ${context.era}
Conflict: ${JSON.stringify(context.conflict)}
Current Tension: ${context.tension}

Requirements:
1. **Ratchet**: A specific narrative mechanism that increases tension or stakes. Describe it and provide an appropriate number of levels of escalation (1-6 typically) that match rising tension.
2. **Atmospherics**: 5 sensory details (sights, sounds, smells) that reinforce the mood. Include suggested SFX or VFX keywords if applicable.
3. **Narrative Moments**: 3 character-focused moments or beats relevant to the theme.
4. **Hazards**: 3 dangers or complications relevant to the plot conflict.
5. **Prods**: 3 events to push characters back on track or increase urgency.
6. **Breaks**: 1 event to lower tension or give respite.

Output ONLY valid JSON in this format:
{
  "ratchet": {
    "name": "Name of Ratchet",
    "description": "Brief description of the mechanism or stuation that serves as the ratchet.",
    "levels": [
      { "level": 1, "description": "A low tension state for the plot" },
      { "level": 2, "description": "..." },
      { "level": 3, "description": "..." },
      { "level": 4, "description": "..." },
      { "level": 5, "description": "..." },
      { "level": 6, "description": "High tension state for the plot" }
    ]
  },
  "atmospherics": [ 
    { "text": "Description of atmosphere", "sfx": "sound_keyword", "vfx": "visual_keyword" } 
  ],
  "narrativeMoments": [ "Description..." ],
  "hazards": [ "Description..." ],
  "prods": [ "Description..." ],
  "breaks": [ "Description..." ]
}`;

        try {
            const response = await AIService.generateText(prompt, { temperature: 0.8 });
            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                Logger.message(`T13NarrativeGenerator: Successfully generated drama for '${plot.Name}'.`);
                return data;
            } else {
                Logger.warn("T13NarrativeGenerator: No valid JSON found in AI response.");
            }
        } catch (error) {
            Logger.error("T13NarrativeGenerator: Failed to generate drama.", error);
        }

        return null;
    }
}

export default T13NarrativeGenerator;