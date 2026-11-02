# Roadmap and prioritized backlog

Status: proposed. Dependencies are explicit; priorities are sequencing guidance, not time estimates. Checkboxes represent planned work, not completed features. Split items into smaller tracked issues as contracts and ownership are agreed.

For bounded agent-ready work packages, dependencies, and acceptance criteria,
see the [Jules implementation pass](jules-implementation-pass.md).

## Milestones and gates

| Milestone | Outcome | Gate |
|---|---|---|
| M0 Baseline | Repeatable builds and known starting behavior. | Fresh dependency restore, both app builds and documented smoke checks; failures recorded, no user data destroyed. |
| M1 Shared core | One tested rules/session core usable without rendering by both apps. | Same seeded scenario, state, events and save/restore across two consumers; legacy behavior differences reviewed. |
| M2 Tabletop vertical slice | Referee and player complete a shared T13 action and resume it. | Two independent clients, role-filtered views, disconnect/reconnect, deterministic resolution and save restore pass. |
| M3 Racing vertical slice | One real-time race produces a meaningful T13 consequence. | Start-to-finish race plus observed simulation → T13 → visible consequence, replay/restore and a headless integration test. |
| M4 Creator workflow | Author, validate, preview and publish a small reusable scenario/game package. | Package made in tools runs in both appropriate host contexts and reopens without data loss. |
| M5 Platform hardening | A second small game demonstrates reuse; reliability, security and performance targets are approved. | Independent adapter/package, no fork of core, release matrix and operational gates pass. |

## P0: baseline and decisions

- [ ] **B01** Inventory entry points, build modes, runtime dependencies, tracked/generated assets and local modifications; document setup for clean environments. Check lockfile/manifest consistency, restore missing PeerJS, run main and companion builds without overwriting tracked `dist` unexpectedly. Depends: none.
- [ ] **B02** Create a subsystem inventory and rule traceability matrix: authoritative rule text, legacy PHP, JS implementation, test, behavior gaps and owner decision. Include dice, cards/spreads and triggers, facets/boons/sway/resources, tests/stakes, ordeal rounds/stages, plots/yarn/tension, characters/annexes/wounds, geometry and permissions. Depends: B01 for reproducible execution; rules authority decision.
- [ ] **B03** Record architecture decisions: canonical source, save compatibility, tabletop and real-time authority, offline trust, privacy, and scope of first release. Depends: B01 and B02 findings.
- [ ] **B04** Add CI for dependency restore, focused rules tests, both builds, browser smoke and artifact handling. Track existing failures separately from regressions. Depends: B01.

## P1: shared rules and state

- [ ] **C01** Diff the root and companion engine trees and map consumers/import roots. Establish parity tests for representative data and rules before extracting a canonical package. Depends: B01, B03.
- [ ] **C02** Separate session construction and rule services from global browser state behind adapters. Preserve current public entry points as compatibility shims; test two isolated headless sessions. Depends: C01.
- [ ] **C03** Define versioned commands, validation, ordered results, stable IDs, seeded RNG and explicit errors. Add contract tests and replay/idempotency tests. Depends: B02, B03, C02.
- [ ] **C04** Specify complete snapshot coverage and migrations; test nested entities, cards, RNG, active ordeals and plots through save/load/continue, including corrupt and unsupported versions. Depends: C03.
- [ ] **C05** Implement/verify missing rule behaviors identified by B02, including card play/discard triggers and editor operations. Do not equate module coverage with rules coverage. Depends: B02 and relevant decisions.
- [ ] **C06** Complete geometry comparison against PHP and updated assets: scoring, aliases, accented names, harmonics, key/pitch, impressions and directional relationships; resolve conflicting sources and exclude unexplained special-case bias unless approved. Test effects on character decisions and language in real consumers. Depends: B02 and geometry authority decision.

## P1: tabletop and network

- [ ] **T01** Specify session authority, identity, roles, visibility, commands, reconnection and failure handling. Compare current WebSocket and PeerJS paths and choose or explicitly bridge them. Depends: B03, C03.
- [ ] **T02** Implement two-client referee/player session and command path, with player-visible projections and referee-only data never distributed to unauthorized peers. Validate actual permissions at authority. Depends: T01, C03.
- [ ] **T03** Connect VTT action, dice, token movement and ordeal state to authoritative commands; test duplicates, rejected actions, concurrent edits and disconnect/reconnect. Depends: T02 and relevant C05 rule cases.
- [ ] **T04** Provide versioned save/export, resume and recovery with a clearly stated storage and trust model. Depends: C04, T02.
- [ ] **T05** Add multi-client browser integration tests, including private data and network failure cases; do not use UI-only permission checks as proof. Depends: T02–T04.

## P2: racing and platform creation

- [ ] **R01** Trace existing playable scenes, controls, ships and physics at runtime; define one small point-to-point course, completion conditions, participants, checkpoint logic and failure states. Orbital lap events are a separate course type. Depends: B01, B03.
- [ ] **R02** Implement and test a single-player playable race slice without assuming network or AI. Depends: R01.
- [ ] **R03** Define game-specific simulation observations, ordeal mapping, outcome application and referee overrides with golden scenarios. Depends: B02, C03, R01.
- [ ] **R04** Wire a race event through the T13 session and back to visible simulation/narrative state; add idempotent integration and end-to-end tests. Depends: R02, R03.
- [ ] **A01** Inventory editor/workbench workflows and define versioned game/content package and validation rules. Depends: B03, C01.
- [ ] **A02** Ship draft/edit/validate/preview/publish/import/export for a minimal scenario using the same validators as runtime. Depends: A01, C03, C04.
- [ ] **A03** Demonstrate one additional small game using the package and adapter contracts, without copying the engine. Depends: A02, R04 lessons.
- [ ] **A04** Inventory model assets in the public directories and existing asset-browser/loaders; distinguish source assets from generated or duplicated copies, and record provenance and license status without assuming reuse rights. Depends: B01.
- [ ] **A05** Build a separate, non-destructive model indexer and profiler for inventoried formats. Produce a versioned, reproducible searchable manifest and an explicit diagnostics report, covering dependencies, geometry, materials, animation and estimated resource costs where measurable. Test unsupported, broken and duplicate assets; never modify originals. Depends: A04.
- [ ] **A06** Integrate the validated model index into authoring and VTT asset discovery, preview and package validation; surface missing dependencies and unknown rights rather than silently publishing them. Define device budgets from measurements. Depends: A05, A01.
- [ ] **A07** Inventory audio samples, loops and existing audio loaders; build a separate non-destructive audio indexer/profiler or a shared indexing framework with format-specific analyzers. Record technical properties, provenance and license status, and distinguish verified metadata from estimates. Depends: B01.
- [ ] **A08** Integrate the audio catalog into authoring and sound/music tools with auditioning, search, licensing warnings and package validation; establish performance budgets from measurements. Depends: A07, A01.

## P3: hardening and optional features

- [ ] **H01** Establish accessibility, browser support, runtime budgets, observability and deployment targets from measured baselines. Test long sessions, large content, malformed saves and unavailable assets.
- [ ] **H02** Perform a dedicated security and privacy review of content, sessions, networking, AI and extension execution; resolve findings according to agreed threat model.
- [ ] **H03** Implement optional distributed compute only after a local job protocol is proven: consent/capability advertisement, bounded typed jobs, retries, validation and fallback. Never make core correctness depend on untrusted peer results. Depends: T01 and measured need.
- [ ] **H04** Evaluate optional AI-assisted authoring and dialogue with explicit consent, provider failure handling, recorded outputs and referee control. Depends: C03 and product decisions.

## Definition of done for every item

Identify the authoritative rule or approved decision; preserve compatibility or document migration; implement explicit error handling; add automated acceptance and regression tests; update directly relevant user/developer documentation; and record what remains unverified. A screen, stub, or passing build alone is not a completed workflow.
