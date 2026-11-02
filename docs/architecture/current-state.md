# Current-state assessment

Date: 2026-11-02. This is a targeted static assessment, not an exhaustive audit or proof of runtime behavior. The working tree contained existing uncommitted changes, including rules documentation, plots, geometry data and an untracked updated-geometry implementation. Those sources must be considered when continuing this work; do not overwrite them. Some geometry changes and tests from the preceding investigation are also uncommitted.

Status vocabulary: **Present** means code or data exists, not that it is production-ready. **Partial** means an inspected path has an explicit limitation. **Unverified** means the path needs an end-to-end test or closer rules review.

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
