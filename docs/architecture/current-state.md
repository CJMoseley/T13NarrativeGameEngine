# Current-state assessment

Updated: 2026-11-03. This is a targeted assessment, not an exhaustive audit or proof of runtime behavior. The implementation and documentation changes described below remain uncommitted in a shared working tree. Preserve unrelated work and verify the actual branch before continuing.

Status vocabulary: **Present** means code or data exists, not that it is production-ready. **Partial** means an inspected path has an explicit limitation. **Unverified** means the path needs an end-to-end test or closer rules review.

## Current implementation handoff

The shared goal is one T13 rules and narrative engine for tabletop/VTT play,
Wormhole Racers and future games. Simulation is not merely presentation: T13
capabilities and outcomes should inform physics, and measured simulation
conditions should inform appropriate T13 decisions. Rules, simulation units
and game-specific calibration must remain distinguishable.

### Implemented foundations

| Area | Current state and evidence | Boundary |
|---|---|---|
| Codex and Proficiencies | [CodexDB](../../src/t13ne/modules/codex/CodexDB.js), validation and identity helpers support custom Proficiencies and preserve Core records. A Proficiency needs a name, description and tags including at least one Facet; numeric IDs are not universally required. | Package-wide versioning, author verification and a complete creator workflow remain open. No complete Core list of Skills, Talents or Powers is assumed. |
| Descendants and components | [Descendants](../../src/t13ne/modules/characters/t13ne-descendants.js) retain or generate Incarna; [component Facet hints](../../src/t13ne/procgen/ships/components/ComponentFacetHints.js) provide optional candidates. | Annex-derived technology, appropriate Hitches and actual component/physics behavior are not fully integrated. Hints are not mandatory classifications. |
| Hitches and Facet rules | [HitchRules](../../src/t13ne/modules/mechanics/HitchRules.js) evaluates roles, matching triggers, Marks/Ruins and tier; [FacetRuleRegistry](../../src/t13ne/modules/mechanics/FacetRuleRegistry.js) provides extensible handlers and several Gnarl proposals. Explicit difficulty effects can affect a Dice Test. | This is not automatic Hitch discovery or a complete effect pipeline. Most Facet mechanics require further source-backed encoding, choices, state or adjudication. The Author confirmed a Quirk's maximum Bane is half the relevant Facet Boon numerically. |
| Rules catalog | [RuleCatalog](../../src/t13ne/modules/mechanics/RuleCatalog.js) combines source pages, Facet pages and sections; [RuleComponent](../../src/t13ne/modules/mechanics/RuleComponent.js) defines source-linked, revision-checked drafts stored in IndexedDB. | A Facet is a page, not a component per section. Draft classification is an unverified assertion; no verification, selection, enforcement or executable-rule pipeline exists. The original source JSON remains in use, including both distinct Character Arcs records. |
| Character I-Ching | [I-Ching](../../src/t13ne/modules/mechanics/t13ne-iching.js) calculates from 12 Facet pairs, permits a caller-provided tie choice, checks data, and exposes Gain and Unchanging power text. The changing-line lookup and `%` statblock-generation marker were corrected. | UI choice, consistent species generation, save/migration review and execution of powers and Gain conditions remain open. Previously saved hexagrams are not silently recalculated. |
| Quest spreads | [QuestSpread](../../src/t13ne/modules/mechanics/QuestSpread.js) and the [Cards API](../../src/t13ne/modules/mechanics/t13ne-cards-api.js) explicitly interpret a six-card spread; `Spread:InterpretQuest` accepts it in command context. The Author confirmed each card's two Tao bits represent the corresponding lines of the two hexagrams, bottom to top. | Interpretation does not automatically create or advance a Quest or Plot, resolve card effects, or apply Quest rules. It does not replace other card contexts. |
| Physics | [PhysicalValueTest](../../src/t13ne/modules/mechanics/PhysicalValueTest.js) compares supplied Values and can apply a caller-calibrated force through [PhysXProvider](../../src/t13ne/core/physics/PhysXProvider.js); ties are left for adjudication. | Experimental explicit API, not a playable interaction or a universal conversion. Character/Descendant lookup, calibration, authority, timing and live game wiring remain open. The racing engine calls a provider capsule method that is currently absent. |
| Builds and trust | Deployment/static-copy changes and bounded P2P payload handling were made; whole Character objects are no longer broadcast by the changed path. | Payload validation is not authentication, authorization, privacy enforcement, sandboxing or a distributed compute scheduler. Both applications still need end-to-end validation. |

### Source and authority decisions already made

- Compare relevant original PHP, authored rules, current data and JavaScript
  for each substantial rules change; do not assume any one implementation is
  always correct or silently copy known defects. Record discrepancies and
  consult the Author when a rule remains ambiguous.
- The legacy I-Ching changing-line `% 63` wraps the last hexagram incorrectly;
  the Author confirmed `% 64` was intended. Current JavaScript instead
  validates indexes. The legacy Quest trigram arithmetic cannot represent all
  hexagrams; the card-to-line mapping above was confirmed by the Author.
- The Core is immutable during play but authorized maintainers can release
  canonical revisions. Verification, authorization and execution isolation
  are separate. A local trusted JavaScript handler is not a sandbox for
  downloaded code.
- Individual rule pages can contain required and optional extractable rules.
  Cards have context-dependent uses and interpretations; do not collapse
  Quest, Ordeal, Tarot, Wound and other uses into one meaning.

### Remaining work, in practical order

1. **Establish reproducible parity and state.** Trace rules against PHP and
   later authoritative sources, reconcile the root and companion consumers,
   verify save compatibility and migrations, and establish versioned session,
   authority and event contracts. Preserve source distinctions and record
   unresolved discrepancies rather than overwriting old data.
2. **Make rule components usable.** Add source/version provenance,
   authorized verification, game/referee selection, dependency validation,
   import/export and explicit execution permissions. Implement one selected
   rule through a real Test/Hitch outcome with persistence and replay tests;
   extend state machines around actual lifecycles rather than replacing them
   wholesale.
3. **Complete Character I-Ching.** Connect player tie choices to creation and
   editing; assess species and other generation paths against Facet pairing
   rules; preserve existing saves and choices. Encode and test Unchanging
   powers and changing-line effects individually against PHP and rules. Avoid
   treating display text as an executable power.
4. **Model Gains without forcing every condition into one category.** Define
   observations, contextual evidence, rule-specific matchers or explicit
   player/referee adjudication, authority, deduplication, effects and an
   audit trail. Reconcile the existing manual `IChing:GrantReward` command,
   including unsupported reward types and condition/authority checks.
5. **Connect Quest, Yarn cards and Plots.** Trace the PHP spread and Plot
   implementations and source card contexts; carry interpreted hexagrams,
   trigrams, line rules and card roles into a persistent Quest/Plot lifecycle.
   Define choices, completion, effects and role authority; test draw,
   interpretation, play, persistence and continuation. Do not equate an
   AI-generated narrative or command with an authorized rules outcome.
6. **Complete physics integration.** Verify and repair the actual PhysX
   provider and runnable scene, then connect Character and Annex/Descendant
   properties, suitable Hitches, units and author-approved calibration in
   both directions. Test a real physical interaction with recorded inputs and
   observable results; account for physics nondeterminism, repeated forces,
   authority and simulation observations. Do not claim movement from a mock
   provider test.
7. **Finish remaining rule families and products.** Encode Criticals,
   Failures, Gnarls and other cross-Facet systems with their real choices and
   timing. Then verify a tabletop/VTT session and a playable race using the
   shared engine, including multiplayer privacy and recovery.

The broader dependencies and acceptance gates are in the
[roadmap](roadmap.md). These items describe unfinished work, not a claim that
the current prototypes implement complete rules.

### Latest validation

- `npm test`: 33 Node tests passed after the Character I-Ching changes. These
  are focused tests, not complete rules, browser, multiplayer or gameplay
  validation. The physical-force test uses a mock PhysX body.
- A prior Chromium test covered IndexedDB v2-to-v3 upgrade, data preservation,
  draft persistence and concurrent revision conflicts. It did not validate
  the later Quest, I-Ching or physics paths.
- A root production build succeeded earlier into isolated output before the
  final component-store and later changes; it is not evidence that the
  current tree builds or that either application runs end to end.

## Earlier baseline assessment

The following inventory records the 2026-11-02 assessment. It may describe
issues subsequently addressed in the handoff above; retain it as historical
context rather than treating every statement as current.

## What exists

| Area | Evidence | Assessment |
|---|---|---|
| Engine composition | [T13NE](../../src/t13ne/T13NE.js) imports mechanics, narrative, AI, VTT and presentation infrastructure. | Present, but browser/application lifecycle and rule modules are closely coupled. Headless reuse and multiple independent sessions are unverified. |
| Rules and data | [Mechanics](../../src/t13ne/modules/mechanics/), [ordeals](../../src/t13ne/modules/systems/ordeals/), [rules](../rules/) and codex data exist. | Broad implementation, but file existence is not rules conformance. Map each rule and edge case to executable tests and an owner-reviewed source. |
| Cards and authoring | [Cards API](../../src/t13ne/modules/mechanics/t13ne-cards-api.js) identifies missing play/discard command triggers; [editor](../../src/t13ne/modules/systems/t13ne-editor.js) labels merge/cut logic a placeholder. | Partial; do not treat all card effects or authoring operations as implemented. |
| Persistence | [GameState](../../src/t13ne/modules/systems/t13ne-gamestate.js) saves several subsystems, but describes its character serialization as simplified and assumes some object graphs are serializable. [Referee](../../ttrpg-companion/src/t13ne/modules/systems/t13ne-referee.js) supports local save slots. | Save/load exists; completeness, migration and deterministic continuation are unverified. |
| Plugins | [PluginManager](../../src/t13ne/core/PluginManager.js) has registration and exposed APIs, but discovery is Vite-specific and named after Wormhole Racers; [engine README](../../src/t13ne/README.md) still describes T13 as a plugin while the manager treats it as core. | Present; public extension contract and documentation need reconciliation. |
| Racing | [GameEngine](../../src/t13ne/core/GameEngine.js) initializes a galaxy, narrative cycle and a prototype ship; [Wormhole Racers design](../../WormholeRacers.html) describes a race. | World and simulation scaffolding exist. A complete race loop and automated end-to-end test were not found in the inspected scene/controller paths. Runtime-loaded or unexplored components could change that conclusion. |
| Simulation and narrative | [GameEngine](../../src/t13ne/core/GameEngine.js) derives world/start context using T13. | Initialization bridge exists; a verified round trip from race events to T13 consequences and back was not found. |
| Companion | [main.js](../../ttrpg-companion/main.js) starts a companion, provides plot/character/VTT controls and networking hooks; [VTTManager](../../ttrpg-companion/src/t13ne/modules/vtt/VTTManager.js) handles ordeal scene lifecycle. | Partial. Network authority, hidden information, turn and dice arbitration, and recovery need end-to-end verification. |
| Duplicate engines | Both [root engine](../../src/t13ne/) and [companion engine](../../ttrpg-companion/src/t13ne/) exist. The companion builds with its own Vite root. | Two source trees can drift; do not assume shared runtime or parity without tests. Identify differences and migrations before choosing one canonical source. |
| Network and compute | [P2P manager](../../ttrpg-companion/src/t13ne/core/P2PNetworkManager.js) wraps PeerJS. [Server](../../server/index.js) offers benchmark registration and task assignment; [compute worker](../../src/t13ne/net/computeWorker.js) calculates wormhole samples. | Transport and compute prototypes are separate. A complete scheduler, result routing, fault handling and application consumer were not established. PeerJS does not provide scheduling by itself. |
| Geometry | [Gematria](../../src/t13ne/modules/world/t13ne-gematria.js), [geometry](../../src/t13ne/modules/world/t13ne-geometry.js), [legacy PHP](../../wordpress_legacy/includes/class-t13-ne-geometry.php) and [updated implementation](../../updatedgeometry/agenticGematria.ts) coexist. | PHP-compatible additive digraph scoring was selected and partially integrated; harmonics, impressions, agent decisions and all consumers still need comparison and behavioral tests. The updated C and TypeScript disagree about digraph scoring. |
| Validation | [Tests](../../tests/) include companion smoke and gematria tests. | Coverage is limited; tests do not establish end-to-end racing, multi-client VTT or full rules conformance. |

## Known baseline and limitations

- The previous companion build failed because `peerjs` was declared but absent from the local installation. The previous main build was stopped before completion. Neither product build is currently verified. Restore dependencies according to the lockfile only after checking manifest/lockfile consistency and without destroying local work.
- The previous gematria tests passed, but they do not prove full geometry parity. Their existence does not establish that geometry guidance reaches all decision paths.
- `dist/` had tracked and untracked changes during this assessment, including changes produced by a previously stopped build. Treat it as user work until provenance is confirmed; do not clean or overwrite it casually.
- Companion authorization includes client-side state and an offline path. This is not sufficient evidence for a secure shared-session permission model. Inspect server and peer enforcement separately; do not claim a specific exploit without a dedicated review.
- Existing documentation describes capabilities and desired design; it is not acceptance evidence. The root README's quick start and the companion's actual configuration should be verified before relying on them.

## What has not been established

This assessment has not executed a complete play session, enumerated every module, compared every T13 rule with its implementation, validated multiplayer across networks, benchmarked racing, or tested releases. It does not declare uninspected systems absent. Establish a reproducible baseline and a rule-by-rule traceability matrix before labeling a subsystem complete.

## Highest-risk uncertainties

1. What exactly is authoritative when tabletop rules, PHP, JavaScript and updated data disagree?
2. Which session state is authoritative, durable and visible to each role across reconnects?
3. Can the two engine trees be unified without changing save formats, rules behavior or application imports?
4. What observable contract translates real-time simulation events into narrative outcomes without conflating physics with rules?
5. Which authoring operations are real and round-trip safely, rather than only rendering an editor?
6. What is the minimum playable slice for both tabletop and racing that proves the shared platform is actually reusable?
