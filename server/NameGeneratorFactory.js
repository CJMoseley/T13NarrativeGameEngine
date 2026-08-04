/**
 * NameGeneratorFactory.js
 *
 * Factory managing three distinct name generation strategies:
 * 1. Grammar (Stable) - Clean template-based generation.
 * 2. Procedural (Local Variation) - Seeded randomized/phoneme generation.
 * 3. AI Service (External/Risky) - Ollama/LLM fallback name solver.
 */

// ==========================================
// 1. Grammar Strategy (Stable)
// ==========================================
class GrammarNameStrategy {
  constructor() {
    this.prefixes = ['Ael', 'Bryn', 'Cyn', 'Dax', 'Ela', 'Fay', 'Gyr', 'Hesper', 'Ira', 'Jor', 'Kael', 'Lyr', 'Morg'];
    this.suffixes = ['en', 'on', 'or', 'eth', 'is', 'ia', 'us', 'yn', 'ard', 'ian', 'wen', 'wood', 'gale', 'weaver'];
    this.titles = ['The Seeker', 'Sovereign of Sector 7', 'Void Walker', 'Keeper of Knots', 'Star Gazer', 'Fallen Warden'];
  }

  generate(params = {}) {
    const seed = params.seed || Math.floor(Math.random() * 10000);
    const prefIdx = seed % this.prefixes.length;
    const suffIdx = (seed + 7) % this.suffixes.length;
    const titleIdx = (seed + 13) % this.titles.length;

    const name = this.prefixes[prefIdx] + this.suffixes[suffIdx];
    return [name, `${name} ${this.titles[titleIdx]}`, `Grammar-Generated Seed: ${seed}`];
  }
}

// ==========================================
// 2. Procedural Strategy (Local Variation)
// ==========================================
class ProceduralNameStrategy {
  constructor() {
    this.vowels = ['a', 'e', 'i', 'o', 'u', 'ae', 'ea', 'io'];
    this.consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'z', 'th', 'ch', 'sh'];
  }

  generate(params = {}) {
    const seed = params.seed || Math.floor(Math.random() * 10000);
    let name = '';

    // Simple seeded LCG for procedural variations
    let currentSeed = seed;
    const nextRand = () => {
      currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
      return currentSeed / 4294967296;
    };

    const syllables = Math.floor(nextRand() * 2) + 2; // 2 to 3 syllables
    for (let i = 0; i < syllables; i++) {
      const c = this.consonants[Math.floor(nextRand() * this.consonants.length)];
      const v = this.vowels[Math.floor(nextRand() * this.vowels.length)];
      if (i === 0) {
        name += c.toUpperCase() + v;
      } else {
        name += c + v;
      }
    }

    return [name, `${name} of the ${params.facet || 'Quiet'} Facet`, `Procedural-Generated Seed: ${seed}`];
  }
}

// ==========================================
// 3. AI Service Strategy (External/Risky)
// ==========================================
class AIServiceNameStrategy {
  constructor() {
    // Falls back to Grammar Strategy if the Risky AI connection fails
    this.fallback = new GrammarNameStrategy();
  }

  async generate(params = {}) {
    console.log('[AIServiceNameStrategy] Querying external/risky LLM Service for name generation...');

    try {
      // Simulate external API call with short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);

      // Hypothetical Ollama/LLM name endpoint
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: params.model || 'llama3',
          prompt: `Generate one mysterious sci-fi name based on the concept: ${params.facet || 'Void'}. Return only the name.`,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.status === 200) {
        const data = await res.json();
        const aiName = data.response.trim();
        return [aiName, `${aiName} (AI Channeled)`, 'AI-Generated'];
      }
    } catch (e) {
      console.warn('[AIServiceNameStrategy] AI connection timed out or failed. Utilizing Grammar (Stable) fallback.');
    }

    // Graceful fallback
    return this.fallback.generate(params);
  }
}

// ==========================================
// 🏭 Central NameGeneratorFactory
// ==========================================
class NameGeneratorFactory {
  constructor() {
    this.strategies = {
      grammar: new GrammarNameStrategy(),
      procedural: new ProceduralNameStrategy(),
      ai: new AIServiceNameStrategy()
    };
    this.activeStrategy = 'grammar'; // default strategy
  }

  /**
   * Swap out strategies seamlessly.
   * @param {'grammar' | 'procedural' | 'ai'} strategyName
   */
  setStrategy(strategyName) {
    if (this.strategies[strategyName.toLowerCase()]) {
      this.activeStrategy = strategyName.toLowerCase();
      console.log(`[NameGeneratorFactory] Active strategy changed to: '${this.activeStrategy}'`);
      return true;
    }
    console.warn(`[NameGeneratorFactory] Strategy '${strategyName}' not found. Defaulting to '${this.activeStrategy}'`);
    return false;
  }

  /**
   * Generates a name based on the active strategy.
   * @param {object} params - Options like { seed, facet, model }
   * @returns {Promise<string[]> | string[]} Name array [ShortName, FullName, Description]
   */
  generate(params = {}) {
    const strategy = this.strategies[this.activeStrategy];
    return strategy.generate(params);
  }
}

module.exports = new NameGeneratorFactory();
