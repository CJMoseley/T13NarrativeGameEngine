# TODO: Staged Plan — T13 Engine, VTT, and Wormhole Racers

Last updated: 2026-11-27

Baseline: `npm run test:node` passes **199 tests** (Stages 1, 2 & 3 complete on branch `feat/staged-engine-vtt-wormhole`), and both root (`vite.config.js`) and companion (`ttrpg-companion/vite.config.js`) Rollup bundles resolve cleanly against the single canonical `src/t13ne/` source tree (`ttrpg-companion/src/t13ne/` has been retired). Remaining Facet-role/body-language confirmations and authored cultural outfit catalogs stay parked in [TODO-avatars.md](./TODO-avatars.md), while **3D modelling/sculpting upgrades, audio/VOIP overhaul, T13 species voice effects, and Avatar puppeting** have been pulled directly into the active VTT pass (Stages 3–4 below).

## Standing Rules & Product Boundaries

- **Authoritative rules:** The rulebook in `docs/rules/` is authoritative. Compare legacy PHP (`wordpress_legacy/`), current JSON, and JS before encoding ambiguous mechanics; record discrepancies for Author review rather than silently guessing.
- **Terminology:** Use **"Mode"** for the musical key-set concept, never "Scale". **Scale** is reserved strictly for T13.
- **Single engine, multiple views/games:**
  - `src/t13ne/` (core mechanics, narrative, Codex, Ordeals, VTT runtime, Avatars/UHPP, modelling tools, audio/VOIP/puppeting infrastructure) is the genre-agnostic **T13 Narrative Game Engine**.
  - `ttrpg-companion/` is a **view** over `src/t13ne/`, not a separate app. Never mirror or copy engine files into `ttrpg-companion/src/t13ne/`.
  - Galaxy, galactic history, stellar system, planet, corporation, and modular ship generators—along with space/orbital/shipyard scenes and Wormhole course adapters—belong to **Wormhole Racers**, built *on top of* the T13 Engine rather than baked into core engine boot.
- **T13 Species vs. Wormhole Racers Species:**
  - **T13 species and Wormhole Racers species are not the same specification or catalog.**
  - In **T13**, species, bloodlines, and genetics are typically specified as **Descendants** (specifically Natural `Nature` Descendants per `docs/rules/Patterns-Extras-Descendants.md`, paired with Character/Pattern **Formation Incarna** when modelling non-flesh beings such as `Trial` metal/cyborgs, `Burden` stone/golems, `Phoenix` fire/plasma, `Fury` liquid, `Gossamer` gas, `Awe` spirits, `Dominion` hive minds, `Wyrd` fae, etc.).
  - **Wormhole Racers species** (`SpeciesGenerator.js` / `05_Species.md`: Humans, Theriocephalics, Drones, The First, Draco, Kathorri, Vemlek, Grenk, Thf-Thf, and procedural species) are a **setting-specific subset** within the `"Humans"` and `"Aliens"` of T13, bridged via an adapter onto T13 Species Descendants + Formation Incarna.
- **Visuals & performance:** Keep dynamic lighting (`MeshLambertMaterial`) unless baked lighting is an explicit user setting; target PS1/PS2-era low-poly model detail.
- **Workflow discipline:** Keep `npm run test:node` green at every stage, update `docs/architecture/current-state.md` as capabilities land, clean up temporary harnesses, and **do not commit unless asked**.

---

## Development Stages Overview

| Stage | Focus | Target Cadence | Exit Gate (Definition of Done) |
| :--- | :--- | :--- | :--- |
| **Stage 1** | Engine Boundary, Species Contract & Headless Session | Days 1–3 | Legacy `ttrpg-companion/src/t13ne/` retired; Wormhole Racers decoupled from T13 boot; T13 Species-as-Descendant contract defined; concurrent headless `T13Session` instances pass in Node. |
| **Stage 2** | Authoritative T13 Rules & Ordeal Execution | Days 3–6 | T13 Tests (Dice, Card Draw, Value), multi-deck Card play/prepare/discard, Ordeal Stages/Rounds/Stakes, Hitches, Wounds, Sway, and Plots execute deterministically via `T13Session`. |
| **Stage 3** | VTT Service, 2D/3D Tabletop & Modelling Tools | Week 1–2 | Role-filtered VTT transport protects private Hands/Referee secrets; `<t13-vtt-canvas>` supports Top-Down 2D + 3D Orbit, token drag/snap, 3D Avatar/Descendant tokens, and upgraded low-poly sculptor/UHPP modelling tools. |
| **Stage 4** | VTT Audio, VOIP, T13 Species Voice FX & Puppeting | Week 2 | Unified WebAudio bus + composition pass; WebRTC/PeerJS VOIP with T13 Species (`Descendant`/Formation) voice modulation FX; audio + webcam Avatar puppeting (`LiveAvatarController`) verified by automated tests. |
| **Stage 5** | Playable Companion Views & Referee Console | Week 2–3 | **Playable Tabletop Slice (M2):** Referee and Player run a live Plot, Character Sheet Tests, Card Hand/Wild Pool Ordeal, VOIP/puppeted tokens, and save/reconnect in two browser views. |
| **Stage 6** | Authoring Workbench, Packaging & Asset Catalogs | Week 3 | **Dev-Ready Engine Slice (M4):** Scenarios/characters/Descendants authored in Workbench validate, preview, export/import as versioned packages; offline model/audio indexers complete. |
| **Stage 7** | Wormhole Racers Physics & Dynamic Tunnel | Week 3–4 | `PhysXProvider` (`addCapsule`, ship hulls) and `HyperphysicsEngine` work in a live scene; rebuilt 3D `WormholeEnvironment` vibrates with ship component frequencies, 12D Perlin turbulence, and `wormholeCourse.js` Modes/forks. |
| **Stage 8** | Wormhole Racers Playable Race & Crew Consoles | Week 4–5 | **Playable Race Slice (M3):** Single-player wormhole race runs start-to-finish with Pilot flight, Engineer Mode tuning, Navigator scanner, puppeted crew comms, AI racers, and Race → T13 Ordeal consequences. |
| **Stage 9** | Campaign Loop, Multi-Crew Sync & Hardening | Week 5–6+ | Full loop (Galaxy → System/Station NPCs → Shipyard customization → League Race), networked multi-role crew + VOIP comms, 60 fps + 100-racer budgets verified, end-to-end smoke suites green. |

---

## Stage 1: Engine Boundary, T13 Species Contract & Headless Session Core (Days 1–3) — COMPLETED

Goal: Separate the genre-agnostic T13 Engine from Wormhole Racers space-generation boot paths, formalize the T13 Species (`Descendant`) vs. Wormhole Racers species boundary, eliminate the legacy duplicate companion tree, and stand up a pure headless `T13Session`.

- [x] **1.1 Retire legacy `ttrpg-companion/src/t13ne/` copy:** Diffed `ttrpg-companion/src/t13ne/` against canonical `src/t13ne/` (all differing JS/JSON files were older snapshots; `SafeDOM.js` was copied to `src/t13ne/utils/SafeDOM.js`), updated dual-tree tests (`t13-codex-initialization.test.js`, `t13-gematria.test.js`, `t13-proficiency-catalog.test.js`), and removed the duplicate directory.
- [x] **1.2 Separate T13 Core from Wormhole Racers & formalize Species boundary:**
  - Moved Wormhole Racers `GameEngine`, `LoreData`, `GalacticHistory`, and loader tasks behind `src/t13ne/games/wormhole-racers/WormholeRacersAdapter.js`; added `mode: 'headless' | 'companion' | 'full'` to `T13NE.initializeEngine` / `T13NE.start` (plus updated `ttrpg-companion/main.js` and removed the unused `GalacticEpic` leak in `t13ne-referee.js`).
  - Defined the canonical **T13 Species-as-Descendant schema** in `src/t13ne/modules/characters/T13SpeciesDescendant.js` and Wormhole Racers adapter in `src/t13ne/games/wormhole-racers/WormholeSpeciesAdapter.js` mapping Wormhole Racers templates/lore as a sci-fi subset within T13's `'human'` and `'alien'` categories.
- [x] **1.3 Remove browser/root-slash coupling in core mechanics:** Converted 135 `/src/t13ne/...` imports across 48 files in `mechanics/`, `characters/`, `narrative/`, `systems/`, `codex/`, `world/`, `ai/`, and `vtt/` to relative ESM paths, lazy-loaded `OpenAI` in `AIService.js`, and guarded `window`/`localStorage`/`crypto` in core runtime paths.
- [x] **1.4 Build `T13Session` command/event/snapshot core:** Implemented `src/t13ne/modules/systems/T13Session.js` with instance-owned mulberry32 PRNG, revisioned optimistic concurrency, idempotent deduplication with error rollback, visibility-tagged event logs (`public`, `player:<id>`, `referee`), role-filtered projections, built-in commands, and JSON `snapshot()` / `T13Session.fromSnapshot()`.
- [x] **1.5 Stage 1 tests:** Added `tests/t13-session-core.test.js` proving native Node ESM imports, headless `T13NE` boot, concurrent seeded `T13Session` isolation, role/privacy enforcement, idempotency, snapshot round-trip, and `T13SpeciesDescendant` / `WormholeSpeciesAdapter` contracts.

---

## Stage 2: Authoritative T13 Rules & Ordeal Execution (Days 3–6) — COMPLETED

Goal: Make T13 mechanics execute real, rulebook-backed state transitions inside `T13Session` instead of acting only as read-only calculators or UI stubs.

- [x] **2.1 Executable T13 Tests (`Dice`, `Card`, `Value`):** Created pure `src/t13ne/modules/mechanics/T13TestRules.js` (canonical 24-Facet metadata, Trump/Misfit alignment, Potency Chi/Difficulty scaling, Dice Tests summing Strain/Extra dice with Crisis reversal & Numerology, Card Draw Tests using `T13Boons.getBoonDraw` & Suit bonuses, and Direct/Percentage Value Tests), updated `t13ne-tests.js` with `bindSession(session)`, and wired `Test:Perform` into `T13SessionRules.js`.
- [x] **2.2 Complete `CardsAPI` & Deck triggers:** Removed duplicate `discardSpread`, added `preparedReserves` and `styleReserves`, implemented `prepareCard(...)` (`onPrepare`) and upgraded `playCard` / `discard` with location cleanup & preserved `cardContext` (`Ordeal`, `QuestSpread`, `WyrdTarot`, `Wound`, `Yarn`) in both `t13ne-cards-api.js` and `T13SessionRules.js` (`Deck:Initialize`, `Card:Draw`, `Card:Prepare`, `Card:Play`, `Card:Discard`).
- [x] **2.3 Authoritative Ordeal state machine:** Wired `Ordeal:Start`, `Ordeal:DrawStage`, `Ordeal:PlayCards` (`full`, `half-wait`, `half-quick`, Wild Pool Tricks, RT/GRT tracking & paydown), `Ordeal:AdvancePhase`, `Ordeal:AdvanceRound` (RT/GRT clear, pool reduction via `getBoonReduced`, `Fresh` -> `Untreated` wound transition), and `Ordeal:Resolve` into `T13SessionRules.js`.
- [x] **2.4 Plots, Quest Spreads, I-Ching Gains & Wounds/Hitches:**
  - Wired `Spread:InterpretQuest`, `Plot:Confirm`, and `Plot:Update` for persistent Plot & Line-Quest creation from 6-card spreads.
  - Wired `IChing:Calculate` (preserving existing saves unless `forceRecalculate`) and Referee-only adjudicated `IChing:GrantReward` with idempotent grant deduplication.
  - Wired `Hitch:Evaluate` (`Quirk`/`Flaw`/`Woe`, Marks/Ruins, synchronous Gnarl effects), Stakes-aware `Wound:Apply` / `Wound:UpdateState` (including Chi reduction & Freshness lifecycle), and overdraft-checked `Sway:Adjust` into character persistence.
- [x] **2.5 Stage 2 tests:** Added `tests/t13-stage2-rules.test.js` covering rulebook Dice/Card/Value golden examples, `CardsAPI` reserve/trigger/context handling, and an end-to-end multi-round Ordeal + Plot + I-Ching + Hitch + Wound + Snapshot replay in `T13Session`.
- [x] **2.6 Drama Systems, Wyrd Tarot, Yarn Card Play & Card Draw / Ordeal Cross-Links:**
  - Created pure `src/t13ne/modules/mechanics/T13CardPlayRules.js` covering D2–D20 Drama Dice, Water/Fire/Wood/Earth/Metal/Void pool thresholds (1-die-never-triggers, multi-plot consumption, Drama Storm prevention), Tension-level Latent limits, Card-based Drama (`Diamonds`/`Hearts`/`Spades`/`Clubs`/`Wildcard`), Chi-% Wyrd Tarot hand limits (`Grunt`/`Mercari`/`Solo`), Court persistence vs. Non-Court discard, Top-of-Chi-pool Yarn↔Chi math + Færy Yarn + reality-manipulation techniques (`Side-step`, `Quantum Swap`, `Retcon`, `Flip-Flop`), Narrative Trick detection (`Promise`, `Karmic Shift`, `Plight`, `Discord`, `Geas`, `Schism`), Suit Parry/Soak defense effects, and Competitive Card Draw Test rankings/complications.
  - Extended `T13Session` & `T13SessionRules.js` with `T13SessionDramaCards.js`: `Drama:Configure/AddDie/RollPool/PlayCard/Reject/RelieveStress` (with 3-in-a-row Latent Plot rotation and Stress-gain auto-die feedback), privacy-masked `WyrdTarot:Draw/Play/TriggerFaceDown/DiscardSlot` (including face-down Court suspension & auto-flip when acting), `Yarn:PlayCards/ManipulateReality`, `Ordeal:Defend`, `Ordeal:YarnTangleAction` (`Bust >= 32`, `Knock-Out`, 4-Suit victory), Wild Pool Trick enforcement + Narrative Trick execution inside `Ordeal:PlayCards`, and `testType: 'card-competitive'` in `Test:Perform`.
  - Added `tests/t13-stage2-drama-tarot-yarn.test.js` covering all Stage 2.6 systems and full `snapshot()` / `fromSnapshot()` round-trips.

---

## Stage 3: VTT Service, Privacy, 2D/3D Tabletop & Upgraded Modelling Tools (Week 1–2) — COMPLETED

Goal: Replace the companion's static grid and mock P2P messages with an authoritative VTT service, role-filtered privacy, Top-Down 2D + 3D views, 3D Avatar/Descendant tokens, and upgraded in-app low-poly modelling/sculpting tools.

- [x] **3.1 VTT Authority & Role-Filtered Transport:**
  - Unified session transport across Referee-hosted PeerJS (`P2PNetworkManager.js`), deterministic `InMemoryTransportHub`, and WebSocket/REST (`server/index.js`) behind `VTTSessionHost` / `VTTSessionClient` (`VTTTransportService.js`) + `T13SessionVTT.js`, with ECDSA P-256 (`ES256`) signed JWTs + salted PBKDF2/HMAC challenge-response Referee elevation (`VTTAuthService.js`, `server/PermissionService.js`).
  - Enforced **per-role state projections at the transport boundary**: Referee secrets, hidden tokens, unrevealed Plot cards, face-down Wyrd Tarot cards, and other players' private hands stay on the authority; each Player receives only public table state plus their own private Hand.
  - Expanded `P2PNetworkManager` validation schemas to cover revisioned `SESSION_COMMAND`, `SESSION_EVENT`, `STATE_PROJECTION`, `SESSION_SYNC_REQUEST`, `SESSION_ERROR`, compact PackBits `SKIN_SYNC`, and rate-limited `AVATAR_PUPPET` frames, with reconnect catch-up.
- [x] **3.2 Top-Down 2D & 3D Camera + Board Controls (`T13VttCanvas.js`, `VTTBoardController.js` & `VTTScene.js`):**
  - Fixed `VTTScene.js`'s vertical `GridHelper` rotation bug and unified the VTT scene controller (`VTTBoardController`) between `<t13-vtt-canvas>` and `VTTScene`.
  - Added **View Mode switcher**: **2D Top-Down (`OrthographicCamera`)** ↔ **3D Tactical (`PerspectiveCamera` Orbit)** ↔ **Psychosocial / Abstract Node Graph**.
  - Attached pointer raycast handlers (`pointerdown`, `pointermove`, `pointerup`) for **token drag-and-drop**, square/hex snapping, Reach/distance measurement ruler, terrain/zone overlays (`Open`, `Closed`, `Difficult`, `Hazard`), and custom map/backdrop image loading with role-aware fog-of-war masks.
- [x] **3.3 3D Avatar & Descendant VTT Tokens:**
  - Built `VTTTokenBuilder.js` replacing cylinder/sphere placeholders in `T13VttCanvas` and `VTTScene` with 3D `SkinnedMesh` miniatures via `AvatarStage` + `sharedAvatarCache` (and `UHPPPropBuilder` Formation-tinted terrain/props).
  - Mounted each 3D avatar on a readable VTT token base ring showing allegiance colour, facing arrow, speaking/VOIP indicator ring, nameplate metadata, and compact Wound/Stress pips, with portable `AvatarSkinDocument` sync.
- [x] **3.4 Upgrade Modelling, Sculpting & UHPP Prop Tools (`AvatarSculptor.js`, `AvatarModelMaker.js`, `UHPPPropBuilder.js`, `UHPPEditorUI.js`):**
  - Extended `AvatarModelMaker` with `AvatarSculptor`: per-part proportion/offset/inflate sculpting (with symmetry toggle and triangle-budget guardrails), deterministic procedural brushes (`noise`, `weathering`, `scales`, `cloth-weave`, `emblem`), UV-region overlay inspection, and detachable low-poly weirdfiction/science-fantasy accessory slots (`hat`, `helmet`, `visor`, `horns`, `crest`, `halo`, `armour_chest`, `armour_shoulder`).
  - Built `UHPPPropBuilder` and upgraded `UHPPEditorUI` so Referees and Authors can configure Formation-tinted 3D Location terrain blocks and Item Descendants and place them directly onto the VTT scene.
- [x] **3.5 Stage 3 tests:** Added `tests/t13-stage3-vtt-transport.test.js` and `tests/t13-stage3-vtt-board-sculptor.test.js` proving ECDSA P-256 JWT + salted challenge-response auth, unauthorized/spoofed command rejection, hidden token/hand/secret non-disclosure, reconnect catch-up, PackBits `SKIN_SYNC` within P2P 131 KB limit, 2D/3D/Psychosocial board controls, 3D VTT tokens, symmetric non-drifting sculpting, deterministic procedural brushes, and `UHPPPropBuilder`.

---

## Stage 4: VTT Audio System, VOIP, T13 Species Voice FX & Avatar Puppeting (Week 2)

Goal: Upgrade the engine's audio architecture while working in the VTT, wire WebRTC/PeerJS VOIP through a T13 Species/Formation voice-effects pipeline, connect live audio + optional webcam tracking to the Avatar puppeting system, and verify both with automated tests.

- [ ] **4.1 Upgrade Audio Engine, VTT Soundscape & Music Composition (`SoundEngine.js`, `src/t13ne/modules/audio/`):**
  - Upgrade `SoundEngine` into a structured multi-bus WebAudio mixer (`master`, `music`, `sfx`, `ambience`, `voip`) with clean headless/suspended fallbacks and per-bus metering/mute/volume controls.
  - Wire `T13NE_AudioDirector` and `T13Effects` to live VTT `T13Session` events: Plot tension transitions, Ordeal rhythm hot-swapping, procedural/sample Foley for T13 Dice rolls, Yarn card draws/plays, Hitch/Wound stingers, and Location Descendant ambience.
  - Complete the listening-led second pass on procedural music composition, Mode adherence, voice leading, and arrangement (`t13ne-music.js`, `t13ne-conductor.js`, `ThemeGenerator.js`).
- [ ] **4.2 VOIP Overhaul & Peer Connection Lifecycle (`VOIPManager.js`, `WebRTCManager.js`, `P2PNetworkManager.js`):**
  - Fix `VOIPManager` so peer audio tracks attach dynamically for peers joining *after* `start()`, support PeerJS media calls alongside `WebRTCManager`, and route remote streams into `SoundEngine`'s `voip` bus (with optional 3D token spatialization on the VTT board) rather than detached `HTMLAudioElement`s.
  - Route local microphone capture through a WebAudio processing graph (`MediaStreamAudioSourceNode` → Noise Gate / Compressor → `VoiceFXChain` → `MediaStreamAudioDestinationNode` → outbound WebRTC track), with push-to-talk, calibrated RMS/spectral VAD hysteresis, per-peer volume/mute, and a local voice-test ("hear myself") monitor toggle.
- [ ] **4.3 T13 Species (`Descendant`) & Formation Voice Modulation FX:**
  - Build a modular, zero-external-server WebAudio `VoiceFXChain` (pitch/formant filter banks, ring modulator, comb/karplus-strong resonator, chorus/hive doubler, waveshaper/bitcrusher, algorithmic reverb from `T13Effects`) parameterized by the speaker's **T13 Species (`Descendant`) and Formation (`Incarna`)**:
    - *T13 Species Descendant vocal profiles:* e.g., Human (neutral/bypass), Giant/Kaiju-blooded (lowered pitch + chest formant shift), Small/Fae-blooded (raised formant + airy shimmer), Insectoid/Chitinous lineage (mandible click modulation + bandpass chorus), Beast/Theriocephalic lineage (growl sub-harmonics), plus custom vocal-tract parameters stored directly on any T13 Species `Descendant`.
    - *Formation Incarna timbre overlays:* e.g., `Trial` / `Craft` (metallic resonator / robotic ring-mod), `Inertia` (clockwork/phase-locked tremolo), `Burden` (deep stone cavern convolution), `Phoenix` (warm harmonic saturation + subtle crackle), `Fury` (liquid modulated lowpass/formant), `Gossamer` / `Awe` (breathy whisper/spectral reverb), `Dominion` (multi-voice hive chorus), `Orthodox` / `Heresy` (synth/bitcrushed digital voice).
    - *Wormhole Racers compatibility:* Map Wormhole Racers' `"Humans"` and `"Aliens"` subset (`Kathorri`, `Thf-Thf`, `Vemlek`, `Draco`, `Grenk`, `Drones`, etc.) cleanly onto these T13 Species Descendant + Formation voice profiles via the Stage 1.2 adapter.
    - Include dry/wet mix sliders, output limiter protection, and a one-click **"Clean Voice / Accessibility Bypass"** per player and for the Referee.
- [ ] **4.4 Avatar Puppeting System (`LiveAvatarController.js`, `VTuberBridge.js`, `MorphManager.js`, `AnimationBlender.js`):**
  - Refactor `VTuberBridge` so it never touches `document.body` on import, supports configurable local/bundled asset paths instead of hardcoded CDN URLs, and shares `VOIPManager`'s audio analyser stream rather than opening a duplicate microphone capture.
  - Upgrade `MorphManager` and `AvatarLowPoly` head morphs with a clean **viseme + expression blend set** (`jaw_open`, `viseme_aa`, `viseme_ee`, `viseme_oh`, `viseme_oo`, `blink`, `smile`, `frown` combining cleanly) for humanoids, and **articulated mouthpart/mandible puppeting** for insectoid/non-humanoid body plans (`TODO-avatars.md` §10).
  - Support **two seamless puppeting modes** in VTT tokens, Character Sheet stages, and speaking portraits:
    1. **Audio-Driven Puppeting (default whenever VOIP/mic is active, no webcam required):** Real-time FFT formant-band + envelope extraction drives visemes/mandibles, subtle head bob/lean, and blink cadence.
    2. **Full Webcam + Audio Puppeting (opt-in):** MediaPipe/Kalidokit head, neck, torso, arm, eye-blink, and mouth tracking blended cleanly over idle animations via `AnimationBlender`, transmitted to VTT peers as compact quantized puppet states.
- [ ] **4.5 Stage 4 Automated Tests (Audio, VOIP, Species FX & Puppeting):**
  - **VOIP & Species Voice FX tests:** Deterministic WebAudio/offline-graph and synthetic-`MediaStream` tests verifying `VOIPManager` VAD start/stop events, dynamic peer join/leave track cleanup, limiter safety bounds, accessibility dry-bypass, and measurable spectral/formant transformations across distinct T13 Species Descendant + Formation presets.
  - **Avatar Puppeting tests:** Automated tests feeding synthetic speech/formant envelopes and recorded landmark fixtures through `VOIPManager` → `VTuberBridge` / `LiveAvatarController` → `MorphManager` / `AnimationBlender`, asserting humanoid viseme blending, non-humanoid mandible rotation, skeleton quaternion slerp bounds, and quantized VTT puppet-packet round-trips.

---

## Stage 5: Playable Companion Views — Character Sheet, Card Tray & Referee Console (Week 2–3)

Goal: Achieve **Milestone M2 (Playable Tabletop Vertical Slice)** so a group can run a full T13 tabletop session using the VTT, VOIP/puppeted Avatars, and Companion views.

- [ ] **5.1 Interactive Character Sheet (`T13CharacterSheet.js`):**
  - Add character roster creation, selection, import/export, and IndexedDB/server persistence (supporting `Extra`, `Lite`, `Archetype`, `Detailed`, and `Full` models from `docs/rules/Creating-Characters.md`, plus T13 Species `Descendant` selection).
  - Make Facet Boons, Annexes, Proficiencies, and Hitches clickable to configure and submit real `T13Session` Dice/Card/Value Tests (with optional Strain/Sway spend).
  - Add live interactive panels for Sway Purse (`Yin`, `Yang`, `Chi`, Facet Sway), Stress/Strain/Shock dice pools, active Wounds, equipped Descendants, and quick controls for Model Maker sculpting, VOIP Species Voice FX preview, and Avatar puppeting mode.
- [ ] **5.2 Player Card Tray & Ordeal Action Bar (`T13YarnCardWidget.js`):**
  - Upgrade `<t13-yarn-card>` from hover-only to interactive selection (`Play`, `Prepare`, `Discard`, `Use Significator`).
  - Build a persistent bottom/side **Card & Ordeal HUD** showing the player's private Hand, Prepared Reserve, Style Reserve, active Stage Difficulty, shared Wild Pool, Turn/RT tracker, VOIP peer roster/mute/FX bypass strip, and a shared **Roll & Narrative Log** feed.
- [ ] **5.3 Referee / Yarn-Teller Console:**
  - Replace the hardcoded `"Breaking of the Third Seal"` mock in `ttrpg-companion/main.js` with live `T13NE_Plots` + `QuestSpread` generation and editing.
  - Add Referee controls to spawn Extras/Monsters/Descendants onto the VTT (with Referee NPC voice-FX switching when voicing different NPCs!), set Stakes, deal/advance Ordeal Stages & Rounds, adjudicate Hitch triggers and I-Ching Gains, toggle fog/zones/mood audio, and save/load campaign snapshots.
- [ ] **5.4 Stage 5 acceptance test:** Automated two-client Playwright test (Referee + Player) executing session join, character + Species Descendant creation, token spawn/move, T13 Test roll, private card draw/play in an Ordeal round, synthetic VOIP/puppet indicator sync, disconnect/reconnect, and save/restore.

---

## Stage 6: Engine Packaging, Workbench & Asset Tooling (Week 3)

Goal: Achieve **Milestone M4 (Creator & Dev-Ready Engine)** so new settings, scenarios, and games can be authored cleanly without forking `src/t13ne/`.

- [ ] **6.1 Author Workbench & Package Validation (`src/t13ne/modules/workbench/`):**
  - Replace placeholder merge/cut logic in `t13ne-editor.js` and wire Workbench forms (`t13ne-chars-UI.js`, `t13ne-knots-UI.js`, `t13ne-narrative-UI.js`, `t13ne-codex-UI.js`) to shared runtime validators (`RuleComponent`, `CodexDB`), including authoring T13 Species Descendants (size matrices, voice FX profiles, natural Annexes, body plans).
  - Support authoring, isolated previewing, and exporting/importing versioned scenario/setting packages while enforcing Core immutability and provenance checks.
- [ ] **6.2 Non-Destructive Model & Audio Indexers:**
  - Build offline indexer scripts for `public/data/models` (OBJ/FBX/glTF/GLB) and `public/media/audio` (WAV/loops), emitting versioned manifests with mesh/audio metrics, duplicate detection, and explicit license/provenance status for VTT and Workbench asset pickers.

---

## Stage 7: Wormhole Racers Foundation — Physics & Dynamic Wormhole Tunnel (Week 3–4)

Goal: Fix the physics foundation and build the signature physics-reactive, musical 3D Wormhole tunnel.

- [ ] **7.1 Repair `PhysXProvider` & Ship Colliders (`PhysXProvider.js`, `AdvancedPhysicsEngine.js`):**
  - Implement `addCapsule` (fixing the crash in `AdvancedPhysicsEngine.create()`), validate `createConvexHull` / compound colliders from `ShipFactory`, and verify deterministic-step rigid-body sliding, collisions, and cleanup in a standalone test harness.
- [ ] **7.2 Live `HyperphysicsEngine` Coupling (`HyperphysicsEngine.js`):**
  - Replace number-only logging with real PhysX coupling: map modular ship component frequencies, resonance stress, shield friction, elasticity, and calibrated T13 `PhysicalValueTest` / Annex effects directly onto PhysX body forces and materials.
- [ ] **7.3 Rebuild 3D `WormholeEnvironment` & Shader/Collider Pipeline (`WormholeEnvironment.js`, `WormholeShader.js`):**
  - Replace the deprecated prototype with the true Wormhole specification:
    - Opening entry funnel → stabilized racing tube → closing exit funnel.
    - Driven by `wormholeCourse.js` & `wormholeSong.js` (288-beat song structure, musical Modes, root transpositions on final choruses, consonance/harmonic instability, and solid vs. unsolid/fast/slow forks).
    - Standing-wave ("guitar string") wall vibrations induced by each ship's component frequencies, wall-contact displacement with opposite-node reaction forces, and 12D-cycled Perlin realspace turbulence near entrances, mid-realspace, and exits.

---

## Stage 8: Wormhole Racers Playable Race Loop & Crew Stations (Week 4–5)

Goal: Achieve **Milestone M3 (Playable Racing Vertical Slice)** with single-player flight, crew role mechanics, puppeted comms, and T13 Ordeal integration.

- [ ] **8.1 Build `WormholeRaceScene` & Core Race Loop:**
  - Create `WormholeRaceScene` (and planet-surface course hook via `planetCourse.js`) with pre-race loading screen ship/100-avatar prewarm, countdown, spline/beat progression, checkpoint & fork traversal, shield/hull collision handling, AI opponent ships, and finish results.
  - Verify continuous camera/scene handoffs from the intro sequence (`LocalSpaceScene`, `PlanetaryOrbitScene`, `ShipShowcaseScene`).
- [ ] **8.2 Playable Multi-Role Crew Stations & Comms (Single-Player + AI Crew Assist):**
  - **Pilot:** 6-DOF / tube-riding ship flight controls, boost, and fork selection (`Controls.js`).
  - **Engineer (`EngineersConsole`):** Interactive live engine Mode and ratio tuning to match wormhole segment Modes (including transposed final choruses), component power routing, and resonance heat/strain management.
  - **Navigator:** Upcoming song-section Mode, harmonic overlap (`modeOverlap`), and fork stability readout HUD.
  - **Weapons / Tactical:** Shield friction/phase modulation and T13-backed tactical actions.
  - **Live Crew / Rival Comms:** Reuse Stage 4's speaking/puppeted 3D Avatar view and Wormhole Racers → T13 Species voice FX for rival hails and crew callouts.
- [ ] **8.3 Racing Ordeal ↔ T13 Session Bridge:**
  - Frame races as T13 Action Sequences / Ordeals: coalesce key simulation observations (out-of-mode instability spikes, wall impacts, overtakes, stage completions) into idempotent `T13Session` intents, applying resulting Component Hitches, Character Stress/Wounds, Sway/Chi rewards, and Plot updates.

---

## Stage 9: Wormhole Racers Campaign Loop, Multi-Crew Networking & Hardening (Week 5–6+)

Goal: Connect racing, exploration, ship customization, story progression, and multiplayer crew play into a cohesive release candidate.

- [ ] **9.1 Star System, Station Dialogue & Shipyard Loop:**
  - Connect `GalaxyMapScene` → `LocalSpaceScene` → `PlanetaryOrbitScene` / Station docking (`DialogueScene` using cached, puppeted 3D NPC avatars) → `ShipyardScene` (modular component fitting, bitwise tech-tree fog-of-war unlocks, CSG ship interiors) → League Race entry.
- [ ] **9.2 Multiplayer Crew, VOIP & Race Synchronization:**
  - Synchronize multi-player crew stations aboard a shared ship (Pilot, Navigator, Engineer, Weapons) and competing ships over `WebRTCManager` / authoritative session state, with ship-intercom VOIP + alien species voice FX and graceful AI-crew takeover on disconnect.
- [ ] **9.3 Performance, Security & End-to-End Release Verification:**
  - Profile browser frame times (PhysX + dynamic wormhole mesh updates + 100 prewarmed character avatars + WebAudio voice FX); offload non-Three.js math to workers only where measurements justify it.
  - Complete P2P/server security and privacy audit; run full Node + Playwright smoke suites across both the TTRPG Companion/VTT and Wormhole Racers.
