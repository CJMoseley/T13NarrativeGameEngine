# Racing as a T13 Ordeal: initial investigation

This is a proposed integration and a focused reading, not a finished rules
specification or an implemented race. It follows the Author's suggestion of
using a Value-based representation that can be reduced to card draws at
appropriate moments. The exact relationship between simulation measurements,
T13 Values, Scores and card play needs rule and Author validation.
See also [Ship Descendants, Values and Yarn events](descendants-values-yarn-events.md)
for the follow-up investigation into ship systems and card-driven events.

Wormhole Racers events are usually point-to-point, more like rallies than
lap races. Orbital events around a system's centre of gravitation may have
laps. The tabletop term "Racetrack" below describes the relationship between
Stages and Rounds, not a requirement for a circular course or repeated Stages.

## What the tabletop rules say

- [Character creation](../rules/Creating-Characters.md) provides several
  levels of detail: Extra, Lite, Archetype, Detailed and Full. Detailed
  Characters have Facets and can have a Personality Annex, Proficiencies,
  Skills, Talents and Powers. The same rules also describe simpler forms.
  The race should not assume all participants have equally detailed sheets.
- [Value Tests](../rules/Test-Value.md) compare Values, including combined
  Values, directly or with an optional probabilistic comparison. Tests may
  carry complications. This is not the same procedure as a card-draw Test.
- [Dice Tests](../rules/Test-Dice.md) can combine relevant Facet or Annex,
  Proficiency and Descendant dice. Applicability, possible Crisis and
  complications matter; a roll is not simply a skill-level check.
- [Card Draw Tests](../rules/Test-Card-Draw.md) can rank competitors in a
  simpler contest without a full Ordeal. They draw a card per Character,
  combine its pips with the relevant Facet or Annex Draw, and consider suits,
  Proficiencies, resources and potential complications. This is a distinct
  option, not the same as drawing an Ordeal Pool from a Score.
- [Ordeals](../rules/Ordeals.md) model complex activities through Stages,
  Phases and Rounds, usually with cards. At the start, applicable
  Proficiencies affect initial Pool formation: for example, one applicable
  Proficiency gives one card, while two call for one Proficiency die. The
  rules' Score-to-Draw table says Score 7 gives 2 cards. That example is
  specifically a **Score**, not an arbitrary simulation Value.
- [Ordeal Stages](../rules/Ordeal-Stages.md) can model geographical,
  procedural or psychosocial states and different arrangements of choices.
  A Stage is not required to be a location.
- [Ordeal Rounds](../rules/Ordeal-Rounds.md) distinguishes narrative Stages
  from mechanical Rounds. Its Racetrack example explicitly allows multiple,
  potentially repeated Stages in a single Round. Other configurations allow
  multiple Rounds within a Stage or independent progression.

## Current implementation evidence

- [GameEngine](../../src/t13ne/core/GameEngine.js) stores player Character,
  crew and ship references and has a path to generate a Detailed Character.
  The inspected event listeners cover generation, not a verified race-event
  stream. Character generation and persistence must be traced end to end.
- [Character](../../src/t13ne/modules/characters/t13ne-chars.js) represents
  Facet-related state, Hitches, Geometry, I-Ching, resources and Stress,
  among other fields. This is evidence of a model, not verification that its
  generated characters fully implement all creation rules.
- [WormholeEnvironment](../../src/t13ne/procgen/galaxy/WormholeEnvironment.js)
  has course and obstacle scaffolding, but its own comments identify major
  mismatches with the intended dynamic wormhole. Do not equate its current
  complexity metric with an approved T13 Value.
- [Ordeal core](../../src/t13ne/modules/systems/ordeals/t13ne-ordeals-core.js)
  defines Stages, Rounds and a Wild Pool, but its constructor builds generic
  Stages, action/obstacle resolution is explicitly incomplete, and
  `advanceStage` clears Rounds. That does not yet demonstrate the rules'
  Racetrack relationship between Stages and Rounds.
- [Ordeal manager](../../src/t13ne/modules/systems/ordeals/t13ne-ordeals.js)
  creates an Ordeal and attempts to start the VTT. A videogame integration
  should not require a VTT to exist; how to separate those concerns needs
  further design.
- [Boon calculations](../../src/t13ne/modules/mechanics/t13ne-boon.js)
  provide Value, reduction and Draw helpers. Their domains, rounding and
  parity with the rules have not been verified for simulation inputs.

## Proposed bridge

1. **Author the situation**, not merely the geometry: describe the race,
   stakes, participants and relevant social or competitive relationships.
   Define Stage transitions using events or states such as an overtaking
   contest, a crew disagreement, an unstable passage or the final sprint.
   Physical checkpoints can be useful triggers without being the only
   possible Stage boundaries.
2. **Observe actual simulation facts** in bounded windows: for example,
   elapsed time, relative position, maneuver outcomes, ship condition and
   crew actions, where the game actually exposes them. Preserve actor,
   ship, time, situation and source so causes are attributable.
3. **Translate through an authored, calibrated mapping** into appropriate
   T13 quantities. Specify units, aggregation, bounds, relevant Facets,
   Proficiencies and equipment, and whether a number is a Value, Score,
   Difficulty or something else. Never assume raw speed or distance already
   has T13 Value semantics.
4. **Resolve at meaningful moments**, using the appropriate configured
   mechanism: a Value Test, a Card Draw Test, or an Ordeal operation. When
   converting a validated quantity to cards, verify each conversion step and
   apply the correct Pool, draw and card rules. Repeated triggers must not
   accidentally grant the same draw twice.
5. **Interpret the result against the live situation and available game
   capabilities.** The narrative system can propose consequences; the
   game determines whether and how to realize them. Report actual outcomes
   back to T13 rather than declaring a simulation consequence successful
   before it happens.

For example, a rivalry might enter an overtaking Stage when two racers
actually contest position. An author-defined mapping could use the contest's
observations and applicable Character and ship data to prepare a T13
resolution at a suitable boundary. What quantity is computed, whether cards
are drawn or played, who chooses, and what the result changes are all
**unresolved**. The simulation's actual overtake must not be silently
rewritten by a later unrelated draw.

The bridge must support racers being in different situations concurrently,
independent Stage/Round boundaries and, where appropriate, repeated Stages
such as in an orbital event. Multiplayer ordering,
replay, seeded randomness, draw timing, duplicate events, persistence and
authority also need explicit design. If a subsystem is disabled, use only
its agreed simplified behaviour, not a fabricated zero or hidden success.

## Next investigation and acceptance targets

1. Trace the Detailed and simplified Character generators, their data
   completeness, and the player/crew-to-ship relationships.
2. Trace the actual running racing scene, controls, physics and emitted
   events. Establish what can be observed and changed before defining an
   adapter.
3. Verify Value/Score/Draw conversions and boundary cases against the
   current rules and underlying tables; separate the Ordeal draw from a
   Card Draw Test.
4. Work through one authored contest with measured inputs, stage and round
   boundaries, card ownership, choices and possible consequences. Review
   its proposed conversion and agency with the Author.
5. Build and test a slice only after that mapping is agreed. Acceptance
   should include a real race event, correct reproducible T13 resolution,
   a game-supported consequence, feedback of the actual outcome, and a
   configuration that works with optional systems disabled as specified.
