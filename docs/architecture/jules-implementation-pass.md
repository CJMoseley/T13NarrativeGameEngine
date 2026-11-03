# Jules implementation pass

Status: proposed work packages, not evidence that the features are complete.
These are intended as separate Jules tasks or pull requests, not one
unbounded refactor. Reconcile each task with the actual branch before work:
some referenced changes may be uncommitted locally and therefore unavailable
to a remote agent. Do not copy private files, credentials, local saves, or
personal data into prompts, issues, logs, or test fixtures.

## Shared brief for every task

Build a reusable T13 engine for video games, the TTRPG companion/VTT and
future games. The Omniversal Core is immutable during play and cannot be
overridden by game or universe content. Authorized maintainers may release
a new canonical Core version. Genre, era, scope and Facet tags describe
applicability, not permission to overwrite an identity.

Use the current rules and data and compare substantive revisions against the
original PHP and JavaScript; treat PHP as important evidence, not automatically
correct, and do not execute it. Ask the Author when
rules conflict or when simplified behavior is unspecified. T13 subsystems
can be enabled or disabled independently; do not invent fallback rules.
Preserve existing data and saves, record migrations, and never delete a
duplicate tree until its unique content and consumers are accounted for.
Do not treat simulated physics, a Boon, Value, Score and Draw as equivalent.

For each PR: state prerequisites, exact scope, implementation and migration
decisions, tests run and results, known limitations, and any Author decisions
still needed. Preserve unrelated work and use non-destructive build output;
do not overwrite tracked `dist/` or user assets. Record baseline failures
separately from regressions. Use deterministic synthetic fixtures, not real
player data. Do not claim security or rules conformance from UI smoke tests.

## Dependency order

| ID | Work package | Prerequisites | Roadmap |
| --- | --- | --- | --- |
| J01 | Reproducible builds and migration baseline | None | B01, B04 |
| J02 | Single shared engine and companion compatibility | J01 | C01, C02 |
| J03 | Versioned Core and layered content manifests | J01; coordinate integration with J02 | B03, A01 |
| J04 | Proficiency identity, persistence and immutability | J03 | C03, C04 |
| J05 | Peer trust boundary and safe in-game transfers | J01; integrate with J02 and J04 | T01, T02, T05 |
| J06 | Annex and Descendant creation contract | J02, J04; rules review | B02, C05 |
| J07 | Ship and component Descendants | J06 | R01, R03 |
| J08 | Race-to-Ordeal vertical slice | J07; Ordeal rules and authority decisions | R02, R03, R04 |
| J09 | Rules parity, optional systems and geometry | J01; independent investigations, integrate with J02 | B02, C05, C06 |
| J10 | Asset and audio pipeline | J01; authoring integration after J03 | A04-A08 |

J02, J03, J05, J09 and J10 may be investigated in parallel, but their PRs
must coordinate shared files and be rebased and retested before integration.
J05 does not make multiplayer trusted until its authority and privacy
acceptance criteria are verified. J07/J08 must not fabricate mechanics to
avoid unresolved decisions.

## J01 — Reproducible builds and migration baseline

**Objective:** establish safe, reproducible root and companion validation.
Inspect [package scripts](../../package.json), both Vite configurations,
the existing lockfile, generated outputs and asset provenance.

- Establish clean-install instructions and both player/referee companion
  builds plus the main build. Use an isolated output directory; do not clean
  the user's existing output. Verify the actual Ammo assets and their runtime
  URLs, rather than assuming a dependency contains them.
- Investigate the observed Windows `EPERM` while copying a sample; determine
  whether output reuse, permissions, locks or another cause is responsible.
  Do not remove samples or work around errors by omitting required assets.
- Capture baseline warnings, missing dependencies and browser startup failures.
  Add focused automated smoke coverage and document commands for CI.

**Acceptance:** clean build commands produce runnable artifacts for all
supported modes, or an actionable external blocker is recorded without
claiming success. Smoke tests assert correct asset responses, not just HTTP
200 HTML fallbacks. Existing Node tests are runnable via
`node --test tests/t13-proficiency-catalog.test.js tests/t13-codex-initialization.test.js tests/t13-gematria.test.js`.

## J02 — Shared engine and companion compatibility

**Objective:** one canonical engine implementation, with the companion as a
consumer. Compare [shared source](../../src/t13ne/) with the
[companion copy](../../ttrpg-companion/src/t13ne/) including relative imports,
untracked/ignored files, data and build paths. The current companion Vite
alias has been redirected towards the root engine, but complete production
build and runtime parity are not established.

- Inventory and classify differences before migration. Preserve independently
  useful companion behavior, including the tension-sensitive Plot voice
  behavior where it is intended; test any intentional change to root behavior.
  Keep companion-only UI helpers in an appropriate client-owned location.
- Replace runtime imports of the duplicate engine with the canonical source,
  including indirect relative and dynamic imports. Preserve public APIs and
  save compatibility; isolate browser/UI concerns rather than introducing a
  second rules implementation.
- Do not delete the old copy until its remaining data, assets, unique modules,
  deployment paths and historical differences are reviewed and migrated.

**Acceptance:** root and companion run the same engine modules and data in
development and production builds; no unintended duplicate engine is bundled.
Test representative Facets, Proficiency lookups, Plot behavior and
save/restore through both consumers. Prove a headless rules scenario does not
require VTT startup. List any remaining duplicate files and why they remain.

## J03 — Versioned Core and layered content manifests

**Objective:** implement an explicit, versioned data-package contract for
T13 Core plus game/universe additions, not separate companion rules.
Review [CodexLibrary](../../src/t13ne/modules/codex/CodexLibrary.js),
[CodexLibrarian](../../src/t13ne/modules/codex/CodexLibrarian.js), the
existing bundle inventory and tagging data.

- Define package identity, schema version, Core dependency/version, declared
  resources, provenance and content revision. Validate manifests and paths;
  reject traversal, unexpected origins and malformed or unsupported content.
  Never execute code from data manifests. Distinguish an unavailable package
  from an absent optional package or invalid data.
- Resolve Core and explicitly selected game/universe packages deterministically.
  A package cannot replace Core identities. Reject duplicate identities and
  report their source; do not infer identity from a name or genre tag.
  Define how package identity scopes non-Core IDs and how clients agree on
  package versions before sharing state. Numeric IDs are a legacy catalogue
  convention, not a T13 rule; preserve existing numeric references while
  supporting nonnumeric identifiers.
- Reuse genre, era and scope tags, including numeric `1` for Core genre,
  Timeless era and Omniversal scope as defined in the current tag data.
  Preserve provenance and distinguish content selection from authorization.
- Ensure async initialization is shared by concurrent callers; failures are
  visible and retryable. Cache keys and invalidation must reflect actual
  content/package versions and not accept incomplete cached indexes.

**Acceptance:** tests cover Core-only, Core plus one synthetic game package,
selection by genre/era, mismatched versions, duplicate IDs, malicious paths,
missing/corrupt bundles, cache upgrade/invalidation, concurrent calls and
offline failure. Load all current Core IDs, including irregular final bundles,
without inferring a bundle from an ID. Verify a real browser-served path.
Core updates are a maintainer release process, not a client-side override.

## J04 — Proficiency identity, persistence and immutability

**Objective:** make create, update, reload and lookup safe without mutating
Core. Inspect [CodexScribe](../../src/t13ne/modules/codex/CodexScribe.js),
[CodexDB](../../src/t13ne/modules/codex/CodexDB.js), commands, AnnexFactory
and existing saved data before modifying their contracts.

- A Proficiency needs a Name, Description and tags including at least one
  Facet. Core Proficiencies are typically single-Facet; Core Skills, Talents
  and Powers can use multiple Facets. A complete Core list is not a goal.
- Prevent runtime writes to Core records and bundles; preserve a separate,
  versioned maintainer workflow. Reject Core-ID collisions before mutation.
- Replace ID-to-bundle arithmetic and success-shaped missing-file fallbacks
  with verified provenance and durable custom storage. Preserve both wrapped
  and flat records, old references and actual bundle paths.
- Define and implement transactional creation/update and collision handling,
  including concurrent creation, reload, failed writes and index rebuilding.
  Local transactions alone do not solve cross-device identity; use the J03
  package identity contract and document migration of existing local records.
- Fix coupled name/Facet lookups and Annex narrative presentation of wrapped
  records without silently creating a new Proficiency on failed lookup.

**Acceptance:** tests exercise IDs 1960, 3613 and final irregular bundles;
Core modification is rejected with no partial state change; custom create,
update, restart, export/import and cache rebuild preserve identity and data;
duplicate/collision and interrupted-write cases fail safely. Exercise the
same path through commands and Annex consumers. No real user database is
cleared during tests.

## J05 — Peer trust boundary and safe in-game transfers

**Objective:** allow authorized sharing of in-game entities, including a
Character giving a crafted Descendant to another Character, while keeping
personal files, credentials, private state and referee-only information out
of peer traffic.

Inspect the shared [P2P manager](../../src/t13ne/core/P2PNetworkManager.js),
[companion entry point](../../ttrpg-companion/main.js), VTT handlers and
server authority. Current broadcast and inbound event paths are prototypes,
not a validated sandbox. PeerJS provides transport/signaling, not authority,
privacy policy or distributed scheduling.

- Define a threat model and explicit session authority and role/visibility
  rules before implementation. Specify which machine enforces ownership,
  transfer permission, idempotency, ordering and accepted package versions.
  Explain signaling metadata exposure and configurable server trust.
- Establish a capability-limited boundary: explicit outbound projections;
  versioned, bounded, allowlisted data messages; schema and semantic
  validation; safe rendering; and authorized commands applied by the session
  authority. Incoming data must not invoke code, reach arbitrary local files,
  alter Core, or write privileged state directly. Isolation primitives must
  be justified; calling a plain object or Worker a sandbox is insufficient.
- Define explicit sharing/consent and role-filtered views. Do not broadcast
  entire local object graphs or referee-only data. Fail closed for invalid,
  unauthorized, oversized, replayed or incompatible messages.

**Acceptance:** two-client tests demonstrate an authorized Descendant
transfer and persistence; rejected unauthorized transfers leave both clients
unchanged. Test malformed messages, unknown commands, injection attempts,
oversized payloads, duplicate delivery, disconnect/reconnect, private-field
non-disclosure and Core immutability. Document remaining trust limitations;
request a dedicated security review before declaring the boundary secure.

## J06 — Annex and Descendant creation contract

**Objective:** establish a rules-grounded, reusable creation and persistence
path. Trace [AnnexFactory](../../src/t13ne/modules/narrative/t13ne-annexes.js),
[Knots](../../src/t13ne/modules/mechanics/t13ne-knots.js),
[Descendants](../../src/t13ne/modules/characters/t13ne-descendants.js), and
the current [Patterns and Descendants rules](../rules/Patterns-Extras-Descendants.md).

- Verify Root, Channel and TIE semantics, Master Annex requirements and
  construction from explicit data. Preserve stable identities, ownership,
  condition, nested Annexes, Proficiencies and serialization.
- Distinguish a missing ID from a requested creation. Invalid input must
  produce an actionable error, not a silently empty Annex or random substitute.
  Trace whether numeric and string IDs retain identical associations.
- Include Character and item consumers; support existing simpler Character
  forms without requiring every optional T13 system.

**Acceptance:** owner-reviewed examples round-trip through create, lookup,
save and restore with the same associations and rule-relevant state. Tests
cover flat/wrapped records, explicit Root/Channel roles, invalid references
and disabled-system configurations whose behavior has been agreed.

## J07 — Ship and component Descendants

**Objective:** connect an authored engine component to a real Descendant,
then represent a ship and its installed components without conflating the
simulation model and T13 rules. Read the
[Proficiency inventory](../t13-summary/ship-proficiency-inventory.md) and
[Descendant investigation](../t13-summary/descendants-values-yarn-events.md).

- Trace [Ship](../../src/t13ne/procgen/ships/Ship.js), component generation,
  installation/removal, persistence and use in Tests. Keep stable component
  instance identity, owner/installation relation, condition and provenance.
- Engine ID 1960 is a candidate, not an approved complete Annex. Obtain
  Author review for Root/Channel choices and how Boon and applicable Facets
  are determined; do not derive them arbitrarily from physical measurements.
- Define when a component supports a Character versus acts independently;
  avoid applying the same contribution twice. Preserve physical units and
  T13 quantities separately. Support a whole ship and installed systems
  without assuming each mesh or primitive must be an independent Descendant.

**Acceptance:** a deterministic engine-component fixture and ship survive
create/install/use/remove/save/reload with correct links and no duplicated
effects. An applicable Test uses verified T13 rules and shows its inputs;
invalid or unresolved authoring data is surfaced explicitly.

## J08 — Race-to-Ordeal vertical slice

**Objective:** demonstrate one playable, point-to-point race and a meaningful
T13 consequence. An orbital event may have laps; a wormhole rally need not.
Follow the [racing investigation](../t13-summary/racing-ordeal-investigation.md).

- Separate Ordeal mechanics from VTT startup. Model Stages as social,
  procedural or geographic situations and allow Stage/Round relationships
  supported by the rules, including multiple Stages in a Round.
- Capture attributed, time-bounded simulation observations and translate them
  only via an Author-approved mapping with units and provenance. Choose
  explicitly between Value Tests, Dice Tests, Card Draw Tests and Ordeal Pool
  draws; use Score-to-Draw only when the input is actually a Score.
- Apply an authorized consequence once, observe the real simulation outcome,
  and persist/replay it with seeded randomness and stable event identities.

**Acceptance:** a start-to-finish rally fixture and headless integration test
show observation -> approved T13 resolution -> applied visible consequence ->
save/reload/replay. Include duplicate events, failed consequence application,
disabled optional systems, multiple Stage/Round configurations and no VTT.
If mapping rules remain undecided, deliver the boundary and tests without
inventing a conversion.

## J09 — Rules, optional systems and geometry

**Objective:** produce testable rule traceability and repair confirmed gaps.
Use [rule sources](../rules/), [T13 summaries](../t13-summary/), legacy PHP
as static historical evidence and [updated geometry](../../updatedgeometry/).

- Trace Facets, Boons, Sway, Tests, Ordeals, Drama, Tension, Pushes/Pulls,
  Plots, Yarn and Character progression to sources and executable tests.
  Flag disputed source precedence and ask the Author instead of importing
  conventional RPG assumptions. Review optional-rule persistence and
  independent subsystem behavior.
- Complete geometry/gematria comparison, including the selected overlapping
  digraph convention, harmonics, impressions and actual decision/language
  consumers; identify unresolved discrepancies before changing behavior.

**Acceptance:** each implemented behavior has cited source, fixtures and
edge-case tests; unresolved rules remain explicit. Verify optional systems
on/off only against approved semantics, and demonstrate geometry effects
through real consumers rather than an isolated helper alone.

## J10 — Asset and audio pipeline

**Objective:** inventory and improve asset discovery without modifying source
media or assuming redistribution rights. Cover model and audio metadata,
provenance, licenses, unsupported files and reproducible indexes.

Inspect [audio worklet](../../src/t13ne/modules/audio/t13ne-additiveProcessor.js)
and its consumers before proposing changes. The current worklet uses the JS
oscillator while WASM initialization is experimental; do not claim WASM
audio is active merely because initialization succeeds.

**Acceptance:** non-destructive index/profiling tests cover malformed,
unsupported and duplicate assets; authoring surfaces missing dependencies
and unknown rights. Any audio changes test initialization, silence, phase,
parameter behavior and explicit failure reporting in an actual worklet.
Benchmarks and compatibility claims must be measured and reproducible.
