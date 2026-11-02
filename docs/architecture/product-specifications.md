# Product and implementation specifications

Status: proposed first slices. They are intentionally narrow and prove reuse before larger feature expansion. The exact T13 rules, UI layout and authoritative data sources require owner approval.

## 1. Rules conformance and character behavior

**Actors:** player, referee, rules author. **Preconditions:** versioned rules/content and a seeded session.

1. Create a character with common/full name, aliases and relevant T13 attributes; preserve user-authored traits.
2. Resolve a representative action using the approved dice/cards, facets, boons, sway, stakes and ordeal transitions. Return intermediate facts, final outcome, and applied state changes with rule references.
3. Record character goals, gifts, geometry and explicit traits as contextual influences. A stubborn trait may bias a character toward holding a position and affect word choice, but must not be an unconditional command, hidden numerical bonus or replacement for player choice. Referee and player agency take precedence.
4. Dialogue and agent decision consumers receive role-appropriate context; shadow traits are not exposed to unauthorized players. When AI is absent, the rules and play loop still work.

**Acceptance:** owner-approved worked examples match results; seeded tests cover normal/boundary/error cases and all relevant source versions; same input produces same rules results; prompts are tested separately from deterministic rules; player-authored choice is not overridden. Complete geometry parity requires harmonics, impressions, aliases and Unicode cases, not only name scoring.

## 2. Online tabletop slice

**Actors:** one referee, one player, optionally observers. **Preconditions:** each has a browser, compatible package and session invitation.

1. Referee creates a session and imports or authors a simple scene, character and challenge; player joins and receives only authorized state.
2. Player proposes an action. Authority checks identity, role, ownership and current revision, then resolves it through the shared T13 core. Referee can adjudicate or override using an auditable action.
3. Both see the approved public outcome; only referee sees private notes and hidden stakes. The VTT shows the relevant token/scene changes.
4. Save, disconnect one client, reconnect and restore at the same revision; retrying the same command does not apply the outcome twice. Offline play remains available with a clear trust and storage warning.

**Acceptance:** automated two-browser test verifies state convergence, rejected unauthorized action, data filtering at transport boundary, duplicate command, invalid revision, disconnect/rejoin and save/restore. Exercise signaling failure and explicit error/retry behavior; do not require a public PeerJS server for deterministic CI.

## 3. Wormhole Racers slice

**Actors:** player, optional referee. **Preconditions:** one packaged point-to-point course, one ship, a seeded narrative session. Orbital events around a centre of gravitation can use laps, but most races are point-to-point.

1. Start a race with clear controls, checkpoint/finish and failure conditions; simulate and render independently of the T13 core.
2. A meaningful collision or route decision is emitted once as a stable simulation observation. The game adapter maps it to an approved T13 challenge or consequence, subject to game policy and referee settings.
3. The authority resolves it and persists resulting narrative and applicable ship/character changes. The UI shows a comprehensible consequence; the player retains direct control.
4. Complete the race and save/restore. The resulting record identifies the race, observation, command and outcome.

**Acceptance:** headless test covers duplicate observations, ordering and explicit rejection; browser test completes the course and asserts both narrative and presentation effects; replay or save/restore produces the same T13 outcomes for the same recorded inputs. Physics determinism across browsers is not assumed: record authoritative observations and define how simulation divergence is handled.

## 4. Authoring and game package slice

**Actors:** game creator, referee. **Preconditions:** a validated content schema and isolated preview session.

1. Create a small scenario with a scene, character, one challenge and outcome mapping, using existing editor components where suitable.
2. Validate missing IDs, incompatible versions and unsupported references with actionable errors; preview without altering the live campaign.
3. Publish a versioned package, export it, import into a fresh environment and run it in the appropriate product. Preserve provenance and migration data.

**Acceptance:** one automated round trip compares canonical content and references; malformed/incompatible package is rejected without partial mutation; a saved scenario is playable in the companion and a minimal separate game adapter can consume the same core without a source-tree fork.

## 5. Optional distributed compute slice

**Actors:** session host and consenting helper peers. **Preconditions:** normal local execution works first; no private data is included without explicit authorization.

1. Register peer capabilities and consent, then schedule one deterministic allowlisted non-authoritative job, such as a bounded procedural sample calculation.
2. Track job version, input hash, owner, deadline and cancellation; validate returned shape and identity, and compare or otherwise verify results as appropriate.
3. On failure, timeout, invalid result or peer departure, retry locally or report an explicit failure. Do not silently use unverified peer results for authoritative rules.

**Acceptance:** test success, duplicate/late result, timeout, disconnect, invalid result, cancellation and local fallback. Demonstrate measured benefit before expanding job types. PeerJS is a transport option, not the scheduler.

## 6. Model indexing and profiling

**Actors:** asset curator, game creator and referee. **Scope:** inventory public model directories, including OBJ, FBX, glTF and GLB examples, then establish actual supported formats and existing loaders before implementation.

1. A separate offline tool scans explicitly configured roots without modifying source files or following paths outside those roots. It records asset identity, relative path, format, size, content hash, referenced files and known source/license information; missing provenance is marked unknown, not inferred.
2. Where parsers support it, profile meshes, vertices, triangles, materials, textures, animation, bounds and estimated memory costs. Identify missing external files, parse errors and exact duplicates. Do not equate estimates with measured GPU usage; report unsupported metrics explicitly.
3. Emit a versioned, stable manifest and diagnostics suitable for browsing and package validation. Repeated scans of unchanged inputs produce equivalent output; failures are visible and do not silently make an asset appear valid.
4. The authoring and VTT tools can search and preview supported assets, show warnings and preserve source/license metadata when packaging. Actual format support, runtime budgets and usage rights are decisions to verify, not assumptions.

**Acceptance:** fixture tests cover multiple formats, missing dependencies, invalid files, duplicate content, unknown licensing and deterministic reruns. Originals remain unchanged, and an asset selected in the browser can be validated and previewed in a representative scene.

## 7. Audio sample and loop indexing

**Actors:** sound designer, asset curator and game creator. **Scope:** inventory samples and loops, including the WAV collections under `public/media/audio`; establish actual formats and existing playback paths before implementation.

1. Index configured roots without modifying originals. Record path, format, size, hash, duration, sample rate, channel count, bit depth when available, and verified provenance and license. Flag exact duplicates, invalid or unreadable files and unknown usage rights.
2. Profile signal properties such as peak, loudness, silence and clipping where supported. BPM, key, loop points, instrument and descriptive tags may be extracted from verified metadata or estimated, but identify the source and confidence; filename-derived values are hints, not facts. Do not equate file size with runtime decoded memory.
3. Emit a versioned, reproducible searchable manifest and diagnostics. Give creators a way to audition, filter, annotate and select audio for a project, while retaining attribution and surfacing unsupported formats and rights warnings.

**Acceptance:** fixture tests cover valid and corrupt audio, duplicate files, multichannel data, unknown rights, uncertain tempo/key, deterministic reruns and unchanged source files. A representative sample can be discovered, auditioned and validated for a game package.

## Cross-cutting acceptance matrix

| Concern | Required proof |
|---|---|
| Rules | Traceable examples and boundary tests approved against the chosen rules source. |
| Persistence | Versioned round trip, migrations and deterministic continuation; failures do not destroy the previous save. |
| Privacy | Per-role projections and transport-level tests for hidden material. |
| Reliability | Explicit errors, reconnect, idempotency, resource cleanup and offline behavior. |
| Compatibility | Both products consume a canonical core; legacy imports and saves have tested migration paths. |
| Creation | Authored data validates, previews, exports, imports and runs without manual repair. |
| Extensibility | A second game adapter uses documented public contracts, not game-specific internals. |
