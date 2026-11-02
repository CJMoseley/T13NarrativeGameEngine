# Proficiency data for ship Descendants

This inventory identifies candidates, not approved Annex definitions or proof
that a complete ship-to-Descendant integration already exists.

## Data sources

- [Public game data](../../public/data/proficiencies.json) contains 12
  material-oriented entries, such as Methane, Iron and Silicon, with a
  Facet and physical potentials. The
  [lore manifest](../../public/data/lore-manifest.json) registers it, and
  `TechGenerator` reads it. It is not the complete T13 Proficiency catalogue.
- The [T13 Proficiency bundles](../../src/t13ne/data/json/proficiencies/Profs/)
  contain 80 JSON files and 3,899 unique IDs in the current root dataset.
  Their records include a name, description and numeric Facet tags.
- [Proficiency master](../../src/t13ne/data/json/proficiencies/proficiencies-master.json)
  is an incomplete index, not the list itself. The sampled candidate IDs
  below are not individual keys in it. The
  [CodexLibrarian](../../src/t13ne/modules/codex/CodexLibrarian.js) now
  builds its exact-ID index from bundles and accepts relative paths.
  A browser test against the development server indexed 3,899 entries and
  resolved Engine and Shield. The companion librarian also passes the
  filesystem-backed catalogue tests.

The librarian now uses an explicit bundle inventory, rejects missing or
incorrectly sized bundles and duplicate IDs, and shares concurrent manifest
initialization. The root inventory contains 80 bundles; the companion's own
source data contains 78. The companion development configuration currently
serves the root data instead. Inventories must be updated whenever bundles
are added or their record counts change; stale IndexedDB or localStorage
data can also require cache invalidation.

Do not rely on the suggested next ID for creating records yet. In particular,
the scribe infers bundle locations from ID arithmetic, which does not match
every existing bundle, and custom-record persistence and cross-client ID
allocation need a coordinated design.

## Core and game data policy

The Omniversal Core is immutable during play and cannot be overridden by
game or universe packages. Authorized maintainers may revise the canonical
Core as a new version. Genre, era and scope tags describe applicability;
they do not authorize a package to replace an existing identity. The
librarian now recognizes the numeric Core, Timeless and Omniversal tags
in wrapped Proficiency records when filtering.

This policy is not yet enforced by the scribe or a layered package loader.
The existing localStorage manifest version does not identify a Core data
release, and the companion still uses its own engine source copy. These
must be addressed before treating the policy as implemented.

The [command module](../../src/t13ne/modules/systems/t13ne-commands.js)
delegates Proficiency creation to the Codex, so command-driven creation
inherits those same limitations. Its optional-rule settings also need
separate review: the command module passes them to `setConfig`, but the
engine configuration setter currently only persists Codex and AI settings.

## Annex and Descendant implementation

[AnnexFactory](../../src/t13ne/modules/narrative/t13ne-annexes.js) resolves
proficiencies to ID and TIE-mask pairs; [Annex](../../src/t13ne/modules/mechanics/t13ne-knots.js)
receives those pairs as Knot data. [Descendant.generate](../../src/t13ne/modules/characters/t13ne-descendants.js)
creates a master Annex, with separate paths for Pacts, Locations and other
Descendants. This is a starting point, not verified ship integration: the
generated item path chooses Facet-based entries without an authored ship
mapping, and the fallback can create an Annex without those entries.

Bundle records wrap their fields under `prof`, while the Knot narrative
display currently reads flat fields. The lookup fix alone therefore does not
establish correct presentation or a working end-to-end character or ship
workflow.

## Existing candidate threads

Numeric Facet tags below were matched to the
[Facet Folio](../rules/Facet-Folio.md) index. Names alone are insufficient:
read the full record, context, applicable tags and rules before selecting
threads for an Annex.

| Candidate | ID | Facet tags | Source | Caution |
| --- | ---: | --- | --- | --- |
| Engine | 1960 | Zeal, Craft | [bundle 39](../../src/t13ne/data/json/proficiencies/Profs/0/profs39.json) | Name includes an engine/Descendant usage. |
| Shield | 3613 | Rook | [bundle 72](../../src/t13ne/data/json/proficiencies/Profs/1/profs72.json) | Annex channel candidate; assess intended defensive application. |
| Sensor | 918 | Key, Nature | [bundle 18](../../src/t13ne/data/json/proficiencies/Profs/0/profs18.json) | Its expanded name identifies it as a Core Proficiency; suitability for a device is not established. |
| Pilot | 3802 | Zeal | [bundle 76](../../src/t13ne/data/json/proficiencies/Profs/1/profs76.json) | Could describe a pilot's activity; not automatically a component. |
| Repair | 2689 | Craft | [bundle 53](../../src/t13ne/data/json/proficiencies/Profs/1/profs53.json) | Annex channel candidate; another Repair entry has different Facets. |
| Drive | 3765 | Zeal | [bundle 75](../../src/t13ne/data/json/proficiencies/Profs/1/profs75.json) | Synonyms suggest motivation or momentum; do not assume it means an engine. |
| Fuel | 1353 | Phoenix | [bundle 27](../../src/t13ne/data/json/proficiencies/Profs/0/profs27.json) | Expanded name says Umbral; description is medical. |
| Thrust | 3180 | Key | [bundle 63](../../src/t13ne/data/json/proficiencies/Profs/1/profs63.json) | Description is not clearly propulsion; do not assume the name proves suitability. |

A name search for `propulsion`, `navigation`, `spaceship` and `wormhole`
found no exact word matches in these 3,899 names. This is not proof that
suitable synonyms, related descriptions or author-defined Proficiencies
do not exist. Some descriptions appear generic and need quality review.

## Next steps

1. Verify the catalogue's provenance, full tag semantics and loading/index
   behaviour; check alternate copies and the legacy PHP as a historical
   reference without assuming the public material list supersedes them.
2. Select root and channel Proficiencies using their actual meanings and
   Facet roles, not just string matches. Identify genuine missing threads
   before proposing additions; preserve existing IDs and entries.
3. Trace the existing Annex/Descendant constructors and define one
   author-reviewed ship system, including how its Boon is determined and
   how its simulation counterpart is linked and persisted.
4. Verify its dice/Value/Draw behaviour and relevant enabled/disabled
   configurations before generalizing to all components.
