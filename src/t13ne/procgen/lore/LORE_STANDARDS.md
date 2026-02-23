# T13NE Lore & Narrative Standards

## Diegetic Principle
All text presented to the player must be **purely diegetic**. The player should never see raw game mechanics, RPG statistics, or engine-level descriptors. The goal is to maintain immersion in the science fiction setting.

## Prohibited Terms
The following terms (and their variants) should **NEVER** appear in player-facing lore or descriptions:
- **Mechanics**: Chi, Boon, Stress, Gain, Loss, Pool, Draw, Pips, Phase, Test, Action, Difficulty, Success Level.
- **T13 Structures**: Knot, Annex, Hitch, Yarn, Sway, Tangle, Facet, Proficiencies, Geometry Number.
- **Technical/Numerology**: Gematria, I-Ching, Hexagram, Yin, Yang, Soul Gift, Key/Pitch (when used as a mechanic).

## Handling Technical Data
When procedural systems generate technical values (e.g., a planet's Chi level or a species' Facet scores), these must be processed before being shown to the player:

1.  **AI Enrichment (Primary)**: Pass the technical context to `T13Descriptions.generate()`. The AI is instructed to "absorb" these values and translate them into atmospheric descriptions (e.g., instead of "High Chi Gain", describe "a palpable spiritual resonance in the air").
2.  **Thematic Aliasing**: Map technical tiers to thematic names. For example, use "Technological Era" instead of "Tech Level", and names like "Primitive Chemistry" or "Post-Scarcity" instead of numbers.
3.  **Sanitization (Fallback)**: Use the `_sanitizeLore` helper (found in `PlanetaryOrbitScene.js` and similar UI components) to strip out accidental mechanical leaks, especially parenthetical data like `(Boon: ...)` or `(Geometry: ...)`.

## Systems to Watch
Future developers should be particularly careful with the following systems which are prone to "leaking" non-diegetic text:
- **Card Spreads**: The interpretations of card draws often contain raw game terms that must be rewritten.
- **Social Eras/Ages**: Derived from cards; ensure the Age name and description are evocative, not mechanical.
- **Species Traits**: Procedural physical/cultural descriptions derived from geometries must be rewritten by AI to avoid "Geometry 4 says..." style output.

## AI Helpers
- **`T13Descriptions`**: The central module for converting technical T13 context into immersive prose.
- **`AIService`**: Lower-level service for direct text generation/rewriting.

---
*Remember: If it looks like a game stat, it doesn't belong in the lore.*
