# Ship Descendants, Values and Yarn events

This is a focused investigation and proposed direction, not a completed
implementation or a comprehensive rules interpretation.

## Ship systems as Descendants

The Author's direction is to model ship components and systems as T13
Descendants, able to participate in dice and card mechanics similarly to
Characters. [Patterns and Descendants](../rules/Patterns-Extras-Descendants.md)
describes Patterns built from Knots, including Annexes. The
[Dice Test rules](../rules/Test-Dice.md) allow an applicable Descendant's
Annex dice alongside a Character's Boon and Proficiency dice.

This suggests a common T13 representation for a ship's engine, shields,
sensors or other systems, while retaining their simulation-specific state.
Their identity, installation, condition, capabilities and operator
relationships need to be explicit. The rules must decide whether and when
a system acts independently or supports a Character; we should not count
the same capability twice.

The existing [Descendant class](../../src/t13ne/modules/characters/t13ne-descendants.js)
has a Master Annex, Sway account and ownership state. The
[component generator](../../src/t13ne/procgen/ships/components/ProceduralComponentGenerator.js)
produces physical properties, harmonics and traits; it does not, in the
inspected creation path, create a Descendant. A verified connection between
the two representations is still needed.
See the [ship Proficiency inventory](ship-proficiency-inventory.md) for
existing candidate threads and catalogue limitations.

## Boon, Value, Score and Draw

These are related quantities, but not interchangeable:

- A Boon can determine available dice and a corresponding Value.
  [Value Tests](../rules/Test-Value.md) give the example Boon 13 = Value 66.
  Values can be combined for applicable cooperative situations.
- A roll produces a Score. A Score may be reduced to a Draw; the
  [Ordeal table](../rules/Ordeals.md) gives Score 7 = Draw 2. This example
  does not assert that a Boon of 7 or a Value of 7 grants two cards.
- [Boon helpers](../../src/t13ne/modules/mechanics/t13ne-boon.js) implement
  `getBoonValue`, `getBoonReduced`, `getBoonScore` and `getBoonDraw`.
  Their exact domains, boundaries, rounding and parity with current rules
  require tests before their use as a simulation contract.
- [Value Tests](../rules/Test-Value.md) also permit direct comparison, with
  rule-specific complications or an optional probability method. Direct
  Value interpretation may suit continuous videogame simulation; deciding
  which comparisons and consequences are valid is a game/rules design
  decision, not a blanket substitution for card resolution.

A possible architecture is to keep a Descendant's Boon and derived T13
Value associated with the relevant system, let a validated mapping use
Values for suitable simulation comparisons, and use the relevant Annex or
Facet dice and Score-to-Draw procedure at a meaningful Ordeal moment. That
is a proposal: physical quantities, current condition and T13 Values need
an explicit mapping, and the same effect must not be applied twice.

## Sway and costs depend on context

[Tao Sway](../rules/Tao-Sway.md) describes a generated Score as Yin or Yang
according to the action and gives same-alignment Tao Sway as a +1 Score
adjustment. [Chi](../rules/Chi.md) describes Banal, Intrepid and Bold
conversion approaches, with Monstrous and Twisted contexts also described;
these depend on setting, Facet and action. For example, the Banal example
reduces 66 Yin to 13 Chi, while the Intrepid description halves the Sway.
Do not treat these as universal exchange rates.

[Sway](../rules/Sway.md) distinguishes Value, dice, card-draw and Ordeal
Difficulty calculations. [Modelling Resources](../rules/Modelling-Resources.md)
distinguishes stored Sway, temporary Style Reserves, Sway Caches and
resource-generating Annexes. A fuel tank, engine output and an Ordeal
Reserve should not automatically be represented by the same kind of
balance. Whether a specific simulation resource is Sway, a Descendant
capability, a separate physical quantity or a combination needs an authored
mapping and safeguards against double counting.

Yarn as a resource is not identical to a Yarn Card. The
[Yarn rules](../rules/Yarn.md) describe reality and narrative manipulation
and say stored Yarn is converted into Chi; the cost of spending Yarn depends
on the stored amount, not a fixed flat Chi exchange.

## Yarn Cards as structured narrative material

[Card Guide](../rules/Card-Guide.md) describes cards used in several modes:
Ordeal, Wyrd Tarot and Yarn. Yarn Cards and spreads can define narrative
structure and detail; the author or Yarn-Teller can supply known details
instead of requiring a particular card. They are more than random event
labels, and interpretation depends on the spread position.

The [card dataset](../../src/t13ne/data/cards/cards.json) includes a concrete
example: the Ace of Diamonds, **The Ambition**, has a Hook of Opportunity, a
Fray of Quest and a Snag of Falling Behind, alongside other role-specific
fields. Its Ordeal data also includes a Speed Stunt Stage and Dangerous
Vehicular Dash. These fields are alternative contextual readings; drawing
one card does not automatically apply all of them.

For an illustrative racing situation, a Yarn-Teller could use the card's
Opportunity Hook to frame a crew's ambition, or its Falling Behind Snag to
interpret a rival's advance. The game must establish the real actors and
situation, the chosen spread role, the card's permissions and costs, and
whether any requested game action is supported. A rival's actual advance
can be reported by the simulation; a proposed new development must not
silently rewrite the result of an already resolved maneuver.

The [Sway events table](../../src/t13ne/data/json/sway/sway_events.json)
also distinguishes an Action, Stage, Round and narratively significant
Yarn Event. Those entries are rule data, not evidence that every game event
is a Yarn Event or that the listed costs should be blindly charged.

## Required follow-up

1. Trace Annex and Descendant creation, dice and card operations, including
   operator-versus-equipment rules and independently acting systems.
2. Verify Boon/Value/Score/Draw conversions and boundary cases against
   current tables, then compare legacy PHP statically as a historical guide.
3. Define how ship design, simulation properties, damage and upgrades
   correspond to T13 state and persist across both representations.
4. Trace card spreads, ownership, play and Yarn costs; distinguish
   authored events, card suggestions and simulation observations.
5. Agree a concrete rally example with the Author before fixing a
   particular calibration or assuming a new mechanical rule.
