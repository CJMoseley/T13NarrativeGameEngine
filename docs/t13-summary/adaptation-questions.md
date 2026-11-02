# Adaptation principles and unresolved questions

The following are design guidance and questions, not additional T13 rules.
They follow the Author's clarification that T13 systems can be enabled or
disabled independently in principle; this is not a claim that the existing
implementation already supports every combination.

## Preserve the distinction between rules and games

- The tabletop rules, an authored videogame's intent, and the simulation's
  available actions are related but distinct. An automated Yarn-Telling
  system should consider all three when interpreting a narrative opportunity.
- Preserve player and referee agency where the selected mode requires it.
  Do not treat a Plot's pressure or a Character's tendencies as unconditional
  commands to a player.
- Do not impose conventional XP, fixed skill trees, quest checklists or
  combat-only encounters as T13 rules. If a particular game wants such a
  presentation, define it as an adaptation and check its consequences.
- Record authored constraints and capabilities explicitly. A narrative
  suggestion is not proof that the simulation can execute it or that a
  generated result is appropriate.

## Configuration and integration questions

1. For each optional subsystem and interaction, what are the intended
   consequences when it is off? Which behaviours remain available, and which
   become manual or are omitted? Avoid inventing zero values or hidden
   defaults.
2. How are tabletop Referee, player Yarn-Teller, videogame author and runtime
   narrative system responsibilities mapped for each game mode?
3. Which facts, affordances and constraints can a game simulation expose to
   narrative decision-making, and how does it report the actual outcome?
4. How are applicable Proficiencies and Crisis Annex choices selected by a
   player, referee or automated controller in each mode?
5. How do Quest spreads create Quest Hexagrams, and how do changing lines
   influence their development? Inspect the source card and hexagram data.
6. How do the two Character Arc source records differ, and which variants and
   composition rules are intended for new games?
7. Which revision of each rule is authoritative, and how should generated
   Markdown and dynamic shortcode data be kept in sync? Compare the
   [source inventory](source-inventory.md), including the older PHP as a
   guide and newer substantive revisions where their provenance is clear.

## Next validation slice

Trace one Conflict and Medium-Tension Pull Stress event against the source
rules. Include applicable lower-level triggers, controller choice of an
eligible die, and any Author/Referee-configured allocation policy. Test Drama
separately instead of assuming the Stress event automatically triggers it.
Before implementing system-off cases, identify and confirm their intended
behaviour; the rules inventory alone does not establish those answers.
