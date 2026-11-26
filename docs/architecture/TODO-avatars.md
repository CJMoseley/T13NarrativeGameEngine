# Deferred TODO: Procedural Avatars, Sculpting, and Expressions

Deferred on: 2026-11-26 (put aside while completing the core T13 Engine, VTT, and Wormhole Racers; see [TODO.md](./TODO.md) for active staged work).

Note: Several items originally listed here have been **promoted into the active VTT pass in [TODO.md](./TODO.md)**:
- **Stage 1.2:** Formalizing the distinction between **T13 Species** (specified as `Descendant` patterns + Formation `Incarna`) and **Wormhole Racers species** (`SpeciesGenerator` as a subset within T13's `"Humans"` and `"Aliens"`).
- **Stage 3.3 & 3.4:** 3D VTT Avatar/Descendant tokens, skin/model sync, and upgrading `AvatarModelMaker` + `UHPPEditorUI` into low-poly sculpting, procedural texture brushes, UV inspection, and accessory slots.
- **Stage 4.4 & 4.5:** Speech viseme morphs, non-humanoid moving mandibles/mouthparts, speaking/token Avatar puppeting (`LiveAvatarController`, `VTuberBridge`, `MorphManager`), VOIP integration, and automated puppeting tests.

Items remaining parked here for the dedicated follow-up Avatar pass include the 24-facet adjective/body-language role confirmations (§2, §3a, §3b), authored cultural outfit catalogs (§4), torso/pelvis continuous-mesh polish, and standalone Playwright visual render diffs (§5).

Standing rules:
- The rulebook in `docs/rules/` is authoritative.
- Use "Mode" for the musical key-set concept, not "Scale". Scale is reserved for T13.
- Keep dynamic lighting (`MeshLambertMaterial`). Do not bake lighting unless it is a user setting.
- Target PS1/PS2-era detail. Morph sets may go above PS1. Model detail stays PS1-like, with simple animation and bend morphs.
- Keep the Node suite green, import canonical modules from `src/t13ne/` directly (`ttrpg-companion` is a view, not a separate app — never mirror engine files into `ttrpg-companion/src/t13ne/`), and update `docs/architecture/current-state.md`.
- Do not commit unless asked.

---

## 1. Completed Avatar baseline (as of 2026-11-26)

- [x] Re-run `npm run test:node` and confirm the baseline passes (179 tests).
- [x] Run syntax checks on `AvatarFacetBody.js`, `AvatarEngine.js`, `AvatarAtlas.js`, and `tests/t13-avatar-facets.test.js`.
- [x] Confirm the Formation tests in `tests/t13-avatar-facets.test.js` cover `Trial`→metal, `Quiet`→wood, `Rook`→armour, and unknown or null→flesh.

## 2. Decisions needed from the user (when resuming Avatars)

- [ ] **Confirm proposed facet roles.** Roles are proposed from the adjective ladders in section 3a. Confirm them before implementing.
- [x] **Nature and height.** Species can define different size mappings; retain the existing Nature-to-height behavior when no species rule is configured.
- [ ] **Amplitudes.** Confirm the body ranges: height ±10%, build ±20%, thickness ±15%, length ±6%, litheness ±10%.
- [ ] **Litheness reading.** Confirm Zeal vs Inertia as litheness versus momentum, with `litheness = (zeal - inertia) / 2`.
- [ ] **Trilal.** Confirm this means Trial (index 19).
- [x] **Species tint vs atlas.** Species colours now affect atlas skin rather than tinting painted clothing.

## 3. Avatar: facet-driven appearance

Author direction (initial species size matrix, Formation palettes, and neutral painted clothing are in place; motion rules remain open):
- Begin the species adjustment matrix with size. A Character's Formation takes precedence over the species Formation; each species can define its own mapping and phenotype adjustments. The matrix may later cover other properties, including structural density.
- For the initial human rule, convert the selected Nature Boon's T13 Value from inches to centimetres (`Value * 2.54`). Calculate and display measurements in centimetres.
- Species-defined entries can match caste, race, sex or other phenotypes. Apply matching entries in configured order, each as `(current height + offsetBeforeCm) * multiplier + offsetAfterCm`. Do not assume universal sex modifiers.
- Define motion mappings separately for species or cultures; the proposed table below is not a universal default.
- Render clothing as colours and patterns painted on the body skin, not as separate clothing meshes. Use a neutral configurable outfit when no culture is configured; culture-specific rules can override it. Hats, armour plates and helmets may eventually be separate accessories.

Done (mapping, wiring, and tests):
- [x] `bodyFromFacets` (Burden → build, Nature → height, Gossamer → musculature, Zeal/Inertia → litheness)
- [x] `calculateSpeciesSize` (using `T13Boons.getBoonValue`), `resolveFormation`, `formatHeightCm` (Human Nature Boon Value × 2.54 cm, ordered phenotype adjustment matrix without universal sex modifiers, Character Formation precedence over species Formation, fallback to existing Nature-to-height ratio when no species rule is configured)
- [x] `appearanceFromFacets` (Awe → vividness, Miasma → skin tint and mottle, adjective descriptors)
- [x] `applyVividness`, `tintSkin`
- [x] `FORMATION_MATERIALS` and `materialForFormation` (default flesh). All 24 facets are mapped from each facet's `Incarna_Text`: Awe spirit, Burden stone, Craft artifice, Dominion society, Enigma cryptic, Fury liquid, Gossamer gas, Heresy simulacrum, Inertia clockwork, Jeer illusion, Key thought, Liberty dream, Miasma toxin, Orthodox data, Phoenix fire, Quiet wood, Rook armour, Sin vice, Trial metal, Virtue energy, Wyrd arcane, Yonder structure, Zeal belief.
- [x] `makeHumanoidVariant(seed, {prosthetics, facetBoons, incarna, species, character, phenotype})` uses facet body, appearance, Formation, and species size values while preserving seeded draw order.
- [x] `_limbScale(comp)` applies length and thickness to `LIMB_CHAIN` only
- [x] Wire `appearanceFromFacets` into `AvatarEngine.js` and `AvatarAtlas.js`: vividness on clothing, `tintSkin` on skin, and blotchy mottle on the atlas.
- [x] Wire `materialForFormation` into the atlas palette (`FORMATION_PALETTES` across all 24 Formation families).
- [x] Connect the `AvatarStage` Character `facetweb.Stats` path to the companion `T13CharacterSheet` workflow (and Workbench `CharacterUI` inspector), and establish the corresponding `Descendant` data path (`context.descendant`, `descendantAvatarData`, `buildDescendantSheetAvatar`).
- [x] Add tests for the Formation wiring, the appearance wiring, the species size matrix, and the end-to-end facet → avatar path.

To do:
- [ ] Connect `AvatarStage` Character and Descendant previews to future in-game Wormhole Racers crew/station character screens once those screens exist.

## 3a. Facet roles from the adjective ladders

Each facet has a ladder of Boons 0–37 with three adjective axes: persona (`Adjective`), physical description (`Desc_Adjective`), and setting (`Location_Adjective`). The physical axis drives avatar roles. Boon 13 is neutral.

Proposed roles (confirm in section 2):

| Facet | Physical axis, low → high | Proposed avatar role | Confidence |
|---|---|---|---|
| Burden | Insubstantial → Tiny → Small → Delicate → Firm → Heavy → Large → Expensive → Luxury → Prized | Build and bulk. Also adornment and fabric richness at high Burden. | High |
| Gossamer | Useless → Fragile → Old → Standard → Efficient → Hard → Potent → Magnificent | Musculature (Flabby → Sinewy → Mighty) | High |
| Zeal | Inert → Slack → Lazy → Loose → Ready → Animated → Devoted → Divine | Litheness (eagerness). Devotion at high adds religious motifs. | High |
| Inertia | Weightless → Handy → Fast → Swift → Modest → Slow → Passive → Antique → Primeval | Momentum (heavy and slow at high). Age and wear at high. | High |
| Awe | Plain → Bland → Remarkable → Impressive → Stylish → Inspired → Majestic | Clothing vividness | High |
| Miasma | Purified → Clean → Marked → Modified → Filthy → Tainted → Rotten | Skin mottle and grime. "Modified" at 14–16 suggests physical modification. | High |
| Craft | Raw → Primitive → Rough-hewn → Crude → Planned → Well-made → Sculpted → Stylish → Superb → Magical | Clothing finish: seams, tailoring, mending, ornament | High |
| Trial | Greasy → Genteel → Sharp → Competitive → Tough → Militant → Martial → Warlike | Combat bearing: squared posture, hard edges. Distinct from Fury. | High |
| Rook | Weak → Casual → Lax → Prudent → Toughened → Hardened → Fortified → Crenelated | Armour coverage: how many plates and guards | High |
| Fury | Blank → Feeble → Humble → Quiet → Whining → Assertive → Fierce → Brutal → Military → War | Resting expression (scowl and frown) and battle scars. Distinct from Trial. | High |
| Jeer | Musty → Proper → Serious → Entertaining → Fun → Keen → Noisy → Silly → Kooky → Absurd | Resting smile and exaggerated, cartoon-like features (Toon) | Medium-high |
| Quiet | Chaotic → Wild → Noisy → Untidy → Homey → Quiet → Subdued → Silent | Stillness of pose and restraint. Unkempt (low) to tidy (high) grooming. | Medium |
| Dominion | Uncontrollable → Rude → Tricky → Sophisticated → Sociable → Authoritative → Commanding → Sovereign | Bearing (upright and commanding at high). Formality of dress. | Medium-high |
| Enigma | Obvious → Clear → Assured → Puzzling → Obscure → Secretive → Mysterious → Shadowy → Impenetrable | Concealment: veils, masks, hoods, shadow. Faint or partly transparent at high. | Medium-high |
| Wyrd | Chaotic → Chimerical → Mutable → Unstable → Odd → Accessible → Ideal → Menacing → Mythic → Bewitched | Uncanny marks and mutable forms. Mythic sigils at high. | Medium |
| Heresy | Transparent → Sincere → Realistic → Guileless → Sneaky → Subtle → Cunning → Insidious | Simulacrum: realism at low, uncanny or seamed artifacts at high | Low-medium |
| Sin | Irreproachable → Seemly → Intriguing → Shady → Salacious → Illegal → Heinous → Unholy | Vice markings, tattoos, seductive or sinister dress | Medium |
| Virtue | Damned → Wicked → Decent → Fair → Grand → Holy → Flawless | Radiance: glow, bright eyes, clean light. Energy Formation. | Medium |
| Phoenix | Icy → Cool → Sober → Charged → Warm → Hot → Fiery → Purifying | Body heat: skin warmth and flush, ember glow. Fire Formation. | Medium |
| Yonder | Frozen → Affiliated → Mellow → Withdrawn → Detached → Staid → Exotic → Alien | Alienness: distant, exotic features at high. Non-human feature tier. | Medium-low |
| Key | Idiotic → Dim → Gullible → Rational → Curious → Analytical → Observant → Brilliant → Original | Eye alertness and gaze | Medium |
| Orthodox | Counter-factual → Obtuse → Faulty → Benighted → Barbarian → Polished → Scholarly → Academic → Discerning | Grooming and refinement. Weak evidence. | Low |
| Liberty | Constrained → Cruel → Inhibited → Cursed → Glitchy → Autonomous → Benign → Charmed → Free → Sacred | Dream translucency or glitch artifacts. Weak evidence. | Low |
| Nature | Psychic → Contrived → Odd → Risky → Unsuitable → Instinctive → Proper → Robust → Heartfelt → Rustic → Hardy → Barbarian | Vitality and health (skin and posture). Conflicts with the height mapping. See section 2. | Medium |

Data checks found while cross-referencing (verified against legacy PHP, awaiting Author decision before editing canonical data):
- [ ] Duplicate Boon rungs: verified verbatim in `wordpress_legacy/includes/class-t13-ne-facets.php` — Phoenix has two Boon 12 rungs (`Excitable`/`Temperamental` then `Eager`/`Charged`, skipping 14), Enigma has two Boon 16 rungs (`Unreliable`/`Irregular` then `Ambiguous`/`Ambiguous`, skipping 14), Liberty has two Boon 32 rungs (`Felicitous`/`Appropriate` then `Fortuitous`/`Fluky`), and Trial at Boon 14 uses `Competitive` in both `Adjective` and `Location_Adjective` (`Antagonistic` in `Desc_Adjective`). `adjectiveForBoon` iterates with `<=`, so it deterministically returns the second entry (`Eager`, `Ambiguous`, `Fortuitous`). Confirm with the Author whether the duplicate Boon numbers were intended or typos (e.g. 14 / 14 / 34).

## 3b. Body language and animation from facets

Some facets are better expressed as motion than as static morphs. Each one below sets a parameter of the idle, gait, or gesture layer. The values come from the physical axis in section 3a.

| Facet | Motion parameter | Low → high |
|---|---|---|
| Quiet | Idle sway amplitude and frequency | Chaotic jitter → Serene stillness |
| Dominion | Carriage: chest height, head level | Slouched → Upright and commanding |
| Trial | Stance: squared shoulders, wide base | Loose → Hard and combat-ready |
| Fury | Resting tension: brow, jaw, shoulder hunch | Blank and slack → Scowling and braced |
| Jeer | Gait bounce, head bob, resting grin | Solemn → Bouncing and grinning |
| Zeal | Forward lean, idle tempo | Dormant → Eager and leaning in |
| Inertia | Gait tempo and weight-shift timing | Quick and light → Slow and ponderous |
| Gossamer | Idle tension in limbs (not morphs) | Limp → Taut |
| Key | Gaze and head scan rate | Vacant → Quick, observant scanning |
| Phoenix | Gesture frequency and restless movement | Still → Fidgety and gesturing |
| Enigma | Hooded or lowered head, slow turns | Open → Withdrawn and watchful |
| Rook | Guarded stance, hands raised | Open → Braced and shielded |
| Sin | Hip sway and lean | Upright → Languid and swaying |
| Wyrd | Irregular timing, noise-driven motion | Regular → Uncanny and erratic |
| Yonder | Non-human gait and stillness, blink rate | Human → Alien and unblinking |

To do:
- [ ] Decide which facets go into motion and which stay as morphs. Each facet should drive one layer only, to avoid double-counting.
- [ ] Define the motion parameters as a small set (sway, tempo, lean, tension, gaze rate, blink rate), set from facet boons. Keep them seeded and deterministic.
- [ ] Route the parameters through the existing `bend_<joint>` morphs and simple clip playback. Keep animation very simple, per the PS1 target.
- [ ] Apply the same parameters to portrait, speaking, and token outputs (section 10).
- [ ] Add tests: the same boons produce the same motion parameters, and the bounds hold at the extremes.

## 4. Avatar: atlas, clothing, and skins

Done:
- [x] `avatarRandom.js` (`hashSeed`, `mulberry32`), used by `AvatarEngine.js`
- [x] `AvatarAtlas.js`: 512 px atlas, 16 px tiles, 48×32 regions, capacity 160, `top:cloth` and `bottom:cloth` reserved, `mapUVsToRegion`, `paintAtlas`, `createAtlasTexture` (Nearest, no mipmaps, manual row flip).
- [x] `AvatarAtlasIO.js`: browser PNG export and import (`atlasToPngBlob`, `pngBlobToAtlasPixels`), used by the model maker.
- [x] Procedural body meshes use a lit atlas, with configurable painted clothing coverage and a neutral humanoid outfit; no clothing meshes are added.
- [x] `AvatarSkinPainter` paints a raycast UV and updates the live texture. PNG round-trip was checked in a browser.
- [x] Atlas pixels, body-plan name, version and regions are available on generated avatars; injected atlas pixels are copied.
- [x] The model maker opens from the game main menu and companion character sheet. It paints on the model, supports body plans and saves/loads a layout-checked skin document.
- [x] Species can supply named skin variants; otherwise their identity generates a stable default. Seeded facial feature proportions vary without changing atlas layout.
- [x] `AvatarStage` can restore compatible skin documents; version 1 (256 px) documents migrate to version 2 independent geometry regions when their original layout matches.
- [x] Character sheets can save a skin to the local Codex database, reload it by character ID, and detect conflicting edits. Browser `AvatarStage` loads that saved skin.
- [x] Replace the remaining cuboid humanoid body, ears and hair-side primitives with deliberately designed low-poly anatomy; facial surface markings are a first step, not a completed model.
- [x] Improve humanoid hand anatomy to a sculpted PS1 low-poly mitten/blade with an integrated thumb (no separated finger geometry needed for PS1 detail).
- [x] Give each generated geometry an independent atlas region and confine painting to the hit face tile.
- [x] Check that `mergeGeometries` gets identical attribute sets.
- [x] Check that `BoxGeometry` survives `applyMatrix4` as `geo.type === 'BoxGeometry'`.
- [x] Update rig tests for atlas colours.
- [x] Add tests for limb scaling, UV remap correctness, and the box geometry type. Atlas bounds and painted clothing coverage have tests.
- [x] Verify the PNG round-trip in the browser.
- [x] Use `AvatarAtlasIO.js` in the model maker's PNG import/export controls.

To do:
- [ ] Author cultural coverage and appearance data for individual body plans; hats, armour plates and helmets may eventually be separate accessories.
- [ ] Author species-specific skins and culture-specific clothing; generated defaults are placeholders. Add richer facial variation and improve facial animation.
- [ ] Refine the humanoid torso, pelvis and limb transitions in animated poses; overlapping primitives avoid the initial waist gap but are not a continuous anatomical mesh.
- [ ] Include associated skins in character exports and synchronization; storage is local to the browser origin (including port), and downloadable skin documents are the portable backup and transfer mechanism.

## 5. Avatar: visual validation

- [ ] Re-render the humanoids and quadruped with a temporary Playwright harness into a new folder (e.g. `files\avatar-renders-v3\`). Compare against `files\avatar-renders-v2\`.
- [ ] Check that portraits show skin, not blank surfaces.
- [ ] Check that portraits use a natural pose, not a T-pose.
- [ ] Check that humanoids have correct proportions: head size, arm length, leg length, and body height.
- [ ] Check that quadrupeds are not split laterally.
- [ ] Delete the temporary harness after validation.

## 6. Creatures

- [x] Spider: legs currently drop straight down. Fix the leg layout.
- [x] Spider: the winged membrane is not built. Add it.
- [x] Confirm the quadruped body is a single root torso.

## 7. Morph, rig, and animation

- [x] Confirm morph sets stay within the stated budget: higher than PS1 for morphs, PS1-like for model detail (humanoid body mesh verified under 2,500 triangles).
- [x] Keep the 10 face morphs and the `bend_<joint>` morphs. These give Minecraft-style limb bending.
- [ ] Keep animation very simple (apply when implementing facet-driven motion in section 3b).
- [x] Re-test the `bend_<joint>` morphs after the limb scaling changes.

## 8. Performance: cache, prewarm, and loading screen

- [x] Build an avatar cache (`AvatarCache`) keyed by body plan + seed + facet-boon/variant hash (`avatarCacheKey`).
- [x] Replace `new AvatarEngine()` per character in `PlanetaryOrbitScene.js` and `AvatarStage.js` with `sharedAvatarEngine` and `sharedAvatarCache`.
- [x] Add a prewarm step to the loading screen (`ViewManager.toggleLoadingScreen` and `LoaderManager`).
- [x] Create the race/ship roster prewarm hook (`ViewManager.queueRaceRosterPrewarm`, `flattenRaceAvatarRoster`, `AvatarCache.prewarmRoster`) supporting ships with multiple crew and races with ~100 characters.
- [ ] Measure browser WebGL render and GPU upload time for 100 characters on screen.
- [ ] Decide on web workers after browser rendering measurements.
- [ ] Keep WASM out unless measurements show it is needed.

## 9. Paint tool and skin editor

- [x] Paint skins directly on the model (UV-based paint).
- [x] Add an initial skin editor within the model maker, accessible from the main menu and character sheet.
- [x] Default to rotate mode; provide paint mode, stroke/import undo and expression previews.
- [x] Support PNG import and export for skins (uses `AvatarAtlasIO.js`).
- [x] Use the generated avatar atlas layout for direct painting and validate layout compatibility on skin document import.
- [ ] Add procedural texture tools. Current state: the atlas painter only.
- [ ] Extend the initial editor into the requested model maker/sculptor; direct painting does not yet provide model sculpting or UV-layout editing.
- [ ] Improve facial expression quality and animation beyond the current separate feature meshes and simple neutral/smile/frown previews.

## 10. Output types: portrait, speaking, and VTT token

Definitions (from the user):
- **Portrait.** A static picture of the avatar facing the camera. Frame the face and upper body where possible. Pose is neutral and upright, not a T-pose.
- **Speaking image.** Used for racing-scene characters. The avatar is turned slightly away from the camera, with natural body language. Include some hand gestures and head motion. Include mouth animation and emotional expression where possible.
- **VTT token.** A 3D model, not a 2D image.

Expression requirements (speaking and portrait):
- [ ] Blinks.
- [ ] Smiles and frowns. Blend shapes must be able to combine with mouth shapes.
- [ ] Mouth shapes for speech (viseme set), built as morphs on the head.
- [ ] Insects and other non-human mouths: moving mouth parts (mandibles or similar), not morphs on a human-style mouth.
- [ ] Head motion and a turned-away pose for speaking images.
- [ ] Hand gestures for speaking images, driven by the existing bend morphs.

To do:
- [ ] Add a portrait renderer: front-facing camera, face and upper-body framing, neutral pose.
- [ ] Add a speaking renderer: three-quarter turn, natural pose, expression and mouth controls.
- [ ] Add a 3D VTT token renderer, using the definition above (initial VTT token integration is in active Stage 3 of `TODO.md`).
- [ ] Confirm the same avatar pipeline drives all three.
- [ ] Decide whether `PortraitGenerator` (SVG) is kept for any use, or retired.
