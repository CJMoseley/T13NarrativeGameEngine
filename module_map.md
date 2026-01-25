# T13NE Module Responsibility Map

This document maps the core T13NE modules to the concepts and rules they are responsible for.

| Module | Responsibilities | Relevant Rule Keywords |
|---|---|---|
| `t13ne-boon.js` | All calculations related to Boons, including converting them to values, scores, and draws. Renders the boon table. | `boon` |
| `t13ne-sway.js` | Handles conversions between different sway types and potencies. Depends on `t13ne-boon.js`. | `sway`, `chi`, `yarn`, `twist` |
| `t13ne-knots.js` | Defines the core data structures for `Annex` and `Hitch`, and how proficiencies are bound together. | `annex`, `hitch`, `proficiency`, `pattern` |
| `t13ne-cards.js` | Provides the `Card` and `Deck` classes for all card-related operations. | `card`, `spread` |
| `t13ne-ordeals.js` | Intended home for all logic related to ordeals, challenges, and conflicts. | `ordeal`, `action-space`, `social-ordeal` |
| `t13ne-plots.js` | Manages the narrative structure of the game, including loading and managing plot data. | `plot`, `subplot`, `narrative` |
| `t13ne-chars.js` | Handles character creation and management. | `character`, `player` |
| `t13ne-dice.js` | Provides random number generation capabilities. | `dice`, `test` |
| `t13ne-facets.js` | Manages all data related to the 24 core facets of the T13NE system. | `facet`, `tapestry` |
| `t13ne-geometry.js` | Handles the numerological and music theory aspects of the system. | `geometry`, `gematria`, `numerology` |

---

## Rule to Module Mapping

| Rule Title | Associated Module | Justification |
|---|---|---|
| Boons | `t13ne-boon.js` | Rule is explicitly about Boons. |
| Geometry, Gematria and Numerology | `t13ne-geometry.js` | Rule is explicitly about Geometry. |
| Facet Folio | `t13ne-facets.js` | Rule is explicitly about Facets. |
| I-Ching | `t13ne-geometry.js` | I-Ching is a system related to geometry and character creation. |
| Tao Sway | `t13ne-sway.js` | Rule is explicitly about Sway. |
| Facet Sway | `t13ne-sway.js` | Rule is explicitly about Sway. |
| Chi | `t13ne-sway.js` | Rule is explicitly about Chi, a type of Sway. |
| Yarn | `t13ne-sway.js` | Rule is explicitly about Yarn, a type of Sway. |
| Twists | `t13ne-sway.js` | Rule is explicitly about Twists, a type of Sway. |
| Sway | `t13ne-sway.js` | Rule is explicitly about Sway. |
| Card Guide | `t13ne-cards.js` | Rule is explicitly about Cards. |
| Card Spreads | `t13ne-cards.js` | Rule is explicitly about Card Spreads. |
| Proficiencies | `t13ne-knots.js` | Proficiencies are the base components of Knots. |
| Hitches | `t13ne-knots.js` | Hitches are a type of Knot. |
| Annexes | `t13ne-knots.js` | Annexes are a type of Knot. |
| Patterns (Extras & Descendants) | `t13ne-knots.js` | Patterns are a type of Knot. |
| Character Catalysts | `t13ne-chars.js` | Character Catalysts are a character-specific mechanic. |
| Modelling Resources | `t13ne-dice.js` | This rule is about dice and tests. |
| Test Value | `t13ne-dice.js` | This rule is about dice and tests. |
| Test Card Draw | `t13ne-cards.js` | This rule is about card draws as tests. |
| Test Dice | `t13ne-dice.js` | This rule is explicitly about dice tests. |
| Stakes | `t13ne-ordeals.js` | Stakes are a component of Ordeals. |
| Success and Failure Levels | `t13ne-ordeals.js` | These are outcomes of Ordeals and tests. |
| Wounds | `t13ne-chars.js` | Wounds are a character-specific mechanic. |
| Death and Immortality | `t13ne-chars.js` | Character-specific mechanic. |
| Ordeals | `t13ne-ordeals.js` | Rule is explicitly about Ordeals. |
| Ordeal Rounds | `t13ne-ordeals.js` | A component of Ordeals. |
| Ordeal Stages | `t13ne-ordeals.js` | A component of Ordeals. |
| Narrative Tricks | `t13ne-plots.js` | A plot-related mechanic. |
| Social Ordeals | `t13ne-ordeals.js` | A type of Ordeal. |
| Alternate Ordeals | `t13ne-ordeals.js` | A type of Ordeal. |
| Action Spaces | `t13ne-ordeals.js` | A component of Ordeals. |
| Psychosocial Action Spaces | `t13ne-ordeals.js` | A component of Ordeals. |
| Tapestries | `t13ne-facets.js` | Tapestries are composed of Facets. |
| Subplots | `t13ne-plots.js` | A type of Plot. |
| Character Arcs | `t13ne-chars.js` | A character-specific mechanic. |
| Drama | `t13ne-plots.js` | A plot-related mechanic. |
| Stress | `t13ne-chars.js` | A character-specific mechanic. |
| Strains and Straining Dice | `t13ne-dice.js` | A dice-related mechanic. |
| Shocks and Shocked Dice | `t13ne-dice.js` | A dice-related mechanic. |
| Distress and Traumas | `t13ne-chars.js` | A character-specific mechanic. |
| Tension | `t13ne-plots.js` | A plot-related mechanic. |
| Narrative Weaving | `t13ne-plots.js` | A plot-related mechanic. |
| Characters and Plots | `t13ne-plots.js` | A plot-related mechanic. |
| Plot Descendants | `t13ne-plots.js` | A plot-related mechanic. |
| Plots in T13 | `t13ne-plots.js` | Rule is explicitly about Plots. |
| Coping With Players | **None** | This is a meta-rule for the GM. |
| Creating Characters | `t13ne-chars.js` | Rule is explicitly about Character creation. |
| Yarn-Tellers, Weavers, and Plots | `t13ne-plots.js` | A plot-related mechanic. |
| Embedded Facet Conflicts | `t13ne-facets.js` | A facet-related mechanic. |
| Types of Games | **None** | This is a meta-rule for the GM. |
| Referee's Rules | **None** | This is a meta-rule for the GM. |
| Core Concepts | **None** | This is a meta-rule for the GM. |
