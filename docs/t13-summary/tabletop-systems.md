# T13 tabletop systems: initial reading

This is an explanatory map, not a complete rules reference. The systems
interact, but the Author has clarified that T13 should also support simplified
play with individual systems disabled. The exact behaviour of each such
configuration remains to be established.

## Facets, Boons and names

[Core Concepts](../rules/Core-Concepts.md) describes Facets as aspects used to
model reality and Characters. The usual [Facet Folio](../rules/Facet-Folio.md)
describes 24 Facets in 12 opposed pairs; it also describes optional changes to
oppositions and alignment. Boons relate real-world values to game usefulness,
including dice and card draws; they are not simply conventional RPG attributes
([Boons](../rules/Boons.md)).

[Geometry, Gematria and Numerology](../rules/Geometry-Gematria-and-Numerology.md)
connects names to Character Geometry and other numbers, with implications for
behaviour, Stress, gifts and relationships. The exact calculations and
optional interactions require further parity work; a name-derived tendency
should not be mistaken for permission to override a player's decisions.

## Knowledge, abilities and change

[Proficiencies](../rules/Proficiencies.md) are named threads of knowledge or
ability associated with Facets. Applicability to the present task matters:
additional applicable Proficiencies can add Proficiency Dice, while no
applicable Proficiency affects the result. A particularly applicable
Proficiency may count twice.

[Annexes](../rules/Annexes.md) combine Proficiencies into knots: Skills,
Talents and Powers. Their root and channel Proficiencies matter. A
Proficiency Crisis may let a Character combine relevant Proficiencies into
an Annex, subject to the applicable rules and available slots. It can also
affect the result, cards and saves. This is a concrete progression mechanism,
not evidence that advancement is universally automatic or that there is no
other advancement.

[Hitches](../rules/Hitches.md) model restrictions and responses to triggers;
their role in a Character is more than a generic debuff.
[Patterns](../rules/Patterns-Extras-Descendants.md) include Extras and
Descendants, which can represent more than characters or inventory items.
See also [Character creation](../rules/Creating-Characters.md), which includes
experience tiers; do not infer a conventional XP or level system from that
terminology.

## Plots, Quests and the I-Ching

[Plots](../rules/Plots-in-T13.md) are character-like narrative daemons. Their
Conflicts may be internal, social, romantic or physical; they need not be
combat. Plots have ranks and can contain or spawn other Plots. Player decisions
take precedence over the Plot's direction. [Subplots](../rules/Subplots.md)
describes Scenes and Acts as Plots and discusses interaction between Plots.

The [I-Ching rules](../rules/I-Ching.md) describe deriving two Character
Hexagrams from the 12 Yin/Yang Facet pairs. Equal Boons allow a player choice
or random choice. Changing lines relate the Hexagrams; matching Hexagrams
have an unchanging ability. The same page explicitly distinguishes **Quest
Hexagrams**, associated with card Quest spreads, from Character Hexagrams.
The Quest procedure and changing-line effects have not yet been traced.
[Trigram data](../../src/t13ne/data/json/iching/trigrams.json) includes
Quest themes, complications and steps; related legacy PHP data offers a
historical guide, but its complete parity and current authority are unverified.
[Card Spreads](../rules/Card-Spreads.md) describes Quests as situations to
complete for various reasons, including duty or devotion, and describes a
six-card Quest spread and a Geas spread. Do not equate this with a conventional
objective checklist or assume a reward is required.

## Character Arcs and storytelling

The two Character Arc records in the
[rules dataset](../../src/t13ne/data/json/other/rules.json) distinguish an
Arc-level Plot approach from Character-driven **Compositions**. The latter
uses musical concepts such as tuning, pitch, rhythm, beats, bars and chords
to model Character relationships and drama; it can work alongside or instead
of plotted drama. The detailed timing and differences between the two source
records remain to be checked.

In tabletop play [Yarn-Tellers](../rules/Yarn-Tellers-Weavers-and-Plots.md)
can be player Characters with narrative authority, while the Referee has
additional responsibilities. Their narration does not permit compelling
another player Character's decisions by narration alone. A videogame's
authored and automated Yarn-Telling must be adapted to its game context;
it is not necessarily identical to any single tabletop role.

## Tension, Stress and Drama

[Tension](../rules/Tension.md) applies to Scenes, Acts and Plots, and
influences Embodiments and narrative possibilities. Its six levels include
Stress events; the listed events at lower levels also apply. Stress can come
from other sources. [Stress](../rules/Stress.md), Strains, Shocks and Trauma
have distinct rules and should not be collapsed into one generic meter.

[Drama](../rules/Drama.md) offers several categories of narrative
developments. Drama Dice and pool types determine matching thresholds;
Latent Drama is a distinct pool-limit mechanism. Suggested results are
interpreted in context and can be rejected or adjusted. This does not imply
every Stress event creates Drama or that every T13 game must enable all
these systems.

## Resolution and resources

[Tests](../rules/Test-Dice.md) and [Ordeals](../rules/Ordeals.md) offer
different ways to handle actions. Ordeals break complex situations into
smaller Tests, often using cards; they are not limited to combat. Stakes
describe what is at risk and can change the applicable rules. The rules also
describe [alternative Ordeals](../rules/Alternate-Ordeals.md).

[Sway](../rules/Sway.md), [Chi](../rules/Chi.md),
[Yarn](../rules/Yarn.md) and [Twists](../rules/Twists.md) are related but
distinct forms of power or influence. The Sway table contains concrete
costs and effects; a full interpretation must account for context and
optional rules, not treat them all as interchangeable currencies.
