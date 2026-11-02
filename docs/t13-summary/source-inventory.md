# Rules source inventory

## Datasets examined

- [Main rules dataset](../../src/t13ne/data/json/other/rules.json): an array of
  54 records. Each has an ID, a page title and a WordPress HTML description.
  Dynamic shortcodes in descriptions may refer to data not included inline.
- [Per-page rules dataset](../../src/t13ne/data/json/rules/): 53 JSON files.
  Each record exactly matches an ID in the main dataset. The corresponding
  53 files in the companion and deprecated-plugin directories were
  byte-identical to these files when checked. The per-page Character Arcs
  file contains record 47, not record 36.
- [Companion copy](../../ttrpg-companion/src/t13ne/data/json/other/rules.json)
  and [deprecated plugin copy](../../plugins/t13ne-deprecated-plugin/data/json/other/rules.json):
  byte-identical to the main dataset when surveyed.
- [Sway rules table](../../src/t13ne/data/json/sway/sway_rules.json): 82
  records with Chi, element type, type and description fields. Its companion,
  legacy public and deprecated-plugin copies were byte-identical at the time
  of the survey. This table was inventoried, not fully interpreted.
- [Readable rules index](../rules/README.md): Markdown pages useful for
  navigation. Some dynamic blocks are placeholders, so consult the original
  dataset and referenced data rather than assuming every rendered table or
  card is present in Markdown.

The main dataset includes **two records named Character Arcs**, IDs
`T13-NE-RULE-36` and `T13-NE-RULE-47`. Their descriptions are different
lengths but begin alike. Their differences and relationship to the single
Markdown page have not yet been assessed; do not silently discard either.
Identical files are evidence of matching copies, not proof of which version
is authoritative or newest. A comparison found substantive differences:
for example, record 36 calls the slowest Tempo "heavy", while 47 calls it
"grave"; the records also differ in how they describe Composition types.
The current [Markdown page](../rules/Character-Arcs.md) uses "grave" and
matches record 47 on those passages, but a full comparison is still needed.

## Dates and legacy PHP

Observed filesystem modification times are UTC and describe these local
copies, not necessarily when their contents were authored:

| Source | Local modification time | Repository history evidence |
| --- | --- | --- |
| Main combined `rules.json` | 2026-01-08 11:02:58 | Initial engine commit: 2026-01-28 |
| Main per-page JSON files | 2026-01-20 17:17:37 for sampled files | Individual content history not yet checked |
| Companion combined `rules.json` | 2026-07-21 16:51:59 | Last listed commit: 2026-06-29; content is identical to main copy |
| [Legacy PHP rules](../../wordpress_legacy/includes/class-t13-ne-rules.php) | 2026-07-21 16:52:26 | Added to this repository 2026-07-06 |
| [Character Arcs Markdown](../rules/Character-Arcs.md) | 2026-10-27 00:30:50 | Tracked history includes July changes; current file has uncommitted changes |

Git dates show when these copies entered this repository, not when the rules
were originally written. Copying, checkout and generation can change
filesystem times without changing rule content. Prefer demonstrated
authorship or revision history and substantive comparisons over timestamps
alone. In line with the Author's guidance, newer substantive revisions are
generally candidates to supersede older rules, but record uncertainty where
the order cannot be established.

The PHP rules source contains both Character Arcs entries and substantive
content not present in the combined JSON's Boons entry: for example, it adds
an explanation and table for combined Boon-13 Characters. The PHP source
also uses different introductory wording in Facet Folio. These observations
do not establish that the PHP version as a whole is newer or should replace
JSON; compare each rule and its data before choosing.

[Legacy Quest code](../../wordpress_legacy/includes/class-t13-ne-quests.php)
lists Quest element roles and includes an explicitly exploratory comment
about constructing Trigrams. That comment is not a finished rule.
[Legacy I-Ching data](../../wordpress_legacy/includes/class-t13-ne-iching.php)
describes Quest themes, complications and steps for Trigrams. The current
[Trigram JSON](../../src/t13ne/data/json/iching/trigrams.json) also contains
these fields; the Heaven example matches the PHP wording. This is a useful
lead for the Quest trace, not yet a full parity comparison.

## Survey map

These ranges are navigation aids, not declarations of independent modules.

| IDs | Topics |
| --- | --- |
| 1-4 | Boons, geometry and names, Facets, I-Ching |
| 5-10 | Tao and Facet Sway, Chi, Yarn and Twists |
| 11-18 | Cards and spreads, Proficiencies, Hitches, Annexes, Patterns, catalysts and resources |
| 19-25 | Tests, Stakes, success and failure, Wounds, death and immortality |
| 26-33 | Ordeals, stages and rounds, narrative tricks, alternatives and action spaces |
| 34-36 | Tapestries, Subplots, Character Arcs |
| 37-43 | Drama, Stress and related states, Tension, narrative weaving |
| 44-50 | Characters and Plots, Plot Descendants, Plots, Character Arcs, players and Yarn-Tellers |
| 51-54 | Embedded Facet Conflicts, game types, referee rules and core concepts |

## Reading limitations

The summaries are an orientation, not a complete transcription. In
particular, card spread definitions and shortcode-generated tables require
their underlying data; optional rules and conflicting or missing definitions
need separate investigation. Existing Markdown is useful evidence but its
generation and completeness have not been independently verified.
