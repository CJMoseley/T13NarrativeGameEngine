# TODO: Outstanding Work

Last updated: 2026-11-25

Resume point: the Node suite passed 154 tests, and game and companion builds passed (with large-chunk warnings). The model maker supports direct painting and per-character local skin saving; the browser `AvatarStage` can restore a saved skin and optionally derive a variant from a Character's `facetweb.Stats`. The facet-driven stage path is not yet wired to a character screen. Changes remain uncommitted.

Standing rules:
- The rulebook in `docs/rules/` is authoritative.
- Use "Mode" for the musical key-set concept, not "Scale". Scale is reserved for T13.
- Keep dynamic lighting (`MeshLambertMaterial`). Do not bake lighting unless it is a user setting.
- Target PS1/PS2-era detail. Morph sets may go above PS1. Model detail stays PS1-like, with simple animation and bend morphs.
- Keep the Node suite green, mirror changes to the companion, and update `docs/architecture/current-state.md`.
- Do not commit unless asked.

---

## 1. Resume checks (start here)

- [x] Re-run `npm run test:node` and confirm the 132-test baseline passes.
- [ ] Run `problems` on `AvatarFacetBody.js`, `AvatarEngine.js`, `AvatarAtlas.js`, and `tests/t13-avatar-facets.test.js`.
- [ ] Confirm the Formation tests in `tests/t13-avatar-facets.test.js` cover `Trial`→metal, `Quiet`→wood, `Rook`→armour, and unknown or null→flesh.

## 2. Decisions needed from the user

- [ ] **Confirm proposed facet roles.** Roles are proposed from the adjective ladders in section 3a. Confirm them before implementing.
- [x] **Nature and height.** Species can define different size mappings; retain the existing Nature-to-height behavior when no species rule is configured.
- [ ] **Amplitudes.** Confirm the body ranges: height ±10%, build ±20%, thickness ±15%, length ±6%, litheness ±10%.
- [ ] **Litheness reading.** Confirm Zeal vs Inertia as litheness versus momentum, with `litheness = (zeal - inertia) / 2`.
- [ ] **Trilal.** Confirm this means Trial (index 19).
- [x] **Species tint vs atlas.** Species colours now affect atlas skin rather than tinting painted clothing.

## 3. Avatar: facet-driven appearance

Author direction (size and motion rules are not implemented yet; neutral painted clothing is in place):
- Begin the species adjustment matrix with size. A Character's Formation takes precedence over the species Formation; each species can define its own mapping and phenotype adjustments. The matrix may later cover other properties, including structural density.
- For the initial human rule, convert the selected Nature Boon's T13 Value from inches to centimetres (`Value * 2.54`). Calculate and display measurements in centimetres.
- Species-defined entries can match caste, race, sex or other phenotypes. Apply matching entries in configured order, each as `(current height + offsetBeforeCm) * multiplier + offsetAfterCm`. Do not assume universal sex modifiers.
- Define motion mappings separately for species or cultures; the proposed table below is not a universal default.
- Render clothing as colours and patterns painted on the body skin, not as separate clothing meshes. Use a neutral configurable outfit when no culture is configured; culture-specific rules can override it. Hats, armour plates and helmets may eventually be separate accessories.

Done (mapping and tests):
- [x] `bodyFromFacets` (Burden → build, Nature → height, Gossamer → musculature, Zeal/Inertia → litheness)
- [x] `appearanceFromFacets` (Awe → vividness, Miasma → skin tint and mottle, adjective descriptors)
- [x] `applyVividness`, `tintSkin`
- [x] `FORMATION_MATERIALS` and `materialForFormation` (default flesh). All 24 facets are mapped from each facet's `Incarna_Text`: Awe spirit, Burden stone, Craft artifice, Dominion society, Enigma cryptic, Fury liquid, Gossamer gas, Heresy simulacrum, Inertia clockwork, Jeer illusion, Key thought, Liberty dream, Miasma toxin, Nature flesh, Orthodox data, Phoenix fire, Quiet wood, Rook armour, Sin vice, Trial metal, Virtue energy, Wyrd arcane, Yonder structure, Zeal belief.
- [x] `makeHumanoidVariant(seed, {prosthetics, facetBoons})` uses facet body values. Seeded draws keep their order.
- [x] `_limbScale(comp)` applies length and thickness to `LIMB_CHAIN` only

To do:
- [ ] Wire `appearanceFromFacets` into `AvatarEngine.js`: vividness on clothing, `tintSkin` on skin, mottle on the atlas.
- [ ] Wire `materialForFormation` into the atlas palette or the prosthetic set.
- [ ] Connect the new `AvatarStage` Character `facetweb.Stats` path to an application character workflow, and establish the corresponding Descendant data path.
- [ ] Add tests for the Formation wiring, the appearance wiring, and the end-to-end facet → avatar path.

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

Data checks found while cross-referencing (not yet fixed):
- [ ] Duplicate Boon rungs: Phoenix at 12 (Excitable and Eager), Enigma at 16 (Unreliable and Ambiguous), Liberty at 32 (Felicitous and Fortuitous), and Trial at 14 (Competitive appears in two fields). Check whether the duplicates are intended, and check which rung `adjectiveForBoon` returns.

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
- [x] `AvatarAtlas.js`: 256 px atlas, 16 px tiles, 48×32 regions, capacity 40, `top:cloth` and `bottom:cloth` reserved, `mapUVsToRegion`, `paintAtlas`, `createAtlasTexture` (Nearest, no mipmaps, manual row flip)
- [x] `AvatarAtlasIO.js`: browser PNG export and import (`atlasToPngBlob`, `pngBlobToAtlasPixels`), not yet used
- [x] Procedural body meshes use a lit atlas, with configurable painted clothing coverage and a neutral humanoid outfit; no clothing meshes are added.
- [x] `AvatarSkinPainter` paints a raycast UV and updates the live texture. PNG round-trip was checked in a browser.
- [x] Atlas pixels, body-plan name, version and regions are available on generated avatars; injected atlas pixels are copied.
- [x] The model maker opens from the game main menu and companion character sheet. It paints on the model, supports body plans and downloads/imports a layout-checked skin document.
- [x] Species can supply named skin variants; otherwise their identity generates a stable default. Seeded facial feature proportions vary without changing atlas layout.
- [x] `AvatarStage` can restore a compatible skin document, rejecting mismatched atlas versions, body plans and regions.
- [x] Character sheets can save a skin to the local Codex database, reload it by character ID, and detect conflicting edits. Browser `AvatarStage` loads that saved skin.

To do:
- [ ] Author cultural coverage and appearance data for individual body plans; hats, armour plates and helmets may eventually be separate accessories.
- [ ] Author species-specific skins and culture-specific clothing; generated defaults are placeholders. Add richer facial variation and independently paintable facial features.
- [ ] Include associated skins in character exports and synchronization; storage is local to the browser origin (including port), and downloadable skin documents are the portable backup and transfer mechanism.
- [ ] Make shared atlas regions independently paintable where needed; painting one feature can currently affect another sharing its region.
- [ ] Check that `mergeGeometries` gets identical attribute sets.
- [ ] Check that `BoxGeometry` survives `applyMatrix4` as `geo.type === 'BoxGeometry'`.
- [x] Update rig tests for atlas colours.
- [ ] Add tests for limb scaling, painted clothing coverage, atlas bounds, UV remap, and the box geometry type.
- [x] Verify the PNG round-trip in the browser.
- [ ] Decide when `AvatarAtlasIO.js` is first used: the import/export button, or the paint tool.

## 5. Avatar: visual validation

- [ ] Re-render the humanoids and quadruped with a temporary Playwright harness into a new folder (e.g. `files\avatar-renders-v3\`). Compare against `files\avatar-renders-v2\`.
- [ ] Check that portraits show skin, not blank surfaces.
- [ ] Check that portraits use a natural pose, not a T-pose.
- [ ] Check that humanoids have correct proportions: head size, arm length, leg length, and body height. The user rejected earlier renders for these.
- [ ] Check that quadrupeds are not split laterally.
- [ ] Delete the temporary harness after validation.

## 6. Creatures

- [ ] Spider: legs currently drop straight down. Fix the leg layout.
- [ ] Spider: the winged membrane is not built. Add it.
- [ ] Confirm the quadruped body is a single root torso. (Fixed in v2; verify again after changes.)

## 7. Morph, rig, and animation

- [ ] Confirm morph sets stay within the stated budget: higher than PS1 for morphs, PS1-like for model detail.
- [ ] Keep the 10 face morphs and the `bend_<joint>` morphs. These give Minecraft-style limb bending.
- [ ] Keep animation very simple.
- [ ] Re-test the `bend_<joint>` morphs after the limb scaling changes.

## 8. Performance: cache, prewarm, and loading screen

Measurements so far (Node only, 100 runs):
- Humanoid 1.73 ms, quadruped 1.89 ms, spider 3.29 ms, variant hashing under 0.01 ms
- Browser render cost is not yet measured.

To do:
- [ ] Measure browser render and atlas paint time for 100 characters.
- [ ] Build an avatar cache keyed by seed plus a facet-boon hash. The hashing already exists.
- [ ] Replace `new AvatarEngine()` per character in `PlanetaryOrbitScene.js` (~808–832) and `AvatarStage.js` (~10) with one shared engine and cache.
- [ ] Add a prewarm step to the loading screen. The likely hook is `ViewManager.toggleLoadingScreen` (~214).
- [ ] No race scene exists yet. Create the hook so a race's crew and racers can be generated during the loading screen.
- [ ] Support ships with several crew, and races with around 100 characters.
- [ ] Decide on web workers. A worker cannot return three.js objects, so it would transfer typed arrays and rebuild on the main thread. Decide only after measuring.
- [ ] Keep WASM out unless measurements show it is needed. Plain JS is fast enough for generation.

## 9. Paint tool and skin editor

- Author direction: make the skin painter a separate component of a model maker/sculptor, accessible from the main menus and the character sheet view.
- [x] Paint skins directly on the model (UV-based paint).
- [x] Add an initial skin editor within the model maker, accessible from the main menu and character sheet.
- [ ] Support PNG import and export for skins (uses `AvatarAtlasIO.js`).
- [ ] Add procedural texture tools. Current state: the atlas painter only.
- [x] Use the generated avatar atlas layout for direct painting and validate layout compatibility on skin document import.
- [ ] Extend the initial editor into the requested model maker/sculptor; direct painting does not yet provide model sculpting.

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
- [ ] Add a 3D VTT token renderer, using the definition above.
- [ ] Confirm the same avatar pipeline drives all three.
- [ ] Decide whether `PortraitGenerator` (SVG) is kept for any use, or retired.

## 11. Engine gaps (from the audit)

Current state:
- Initial model maker with direct UV painting, but no sculpting or UV-layout editor
- Procedural characters exist (humanoid, quadruped, spider), but are basic
- Procedural textures are limited to the new atlas painter

To do:
- [ ] Decide the minimum set of systems for the final product. The user asked for this and it is not yet written up.
- [ ] Build or scope the model editor.
- [ ] Build or scope UV tools.
- [ ] List the other systems still missing for release.

## 12. Earlier TTRPG and game-engine threads

Recent intro and music work:
- [x] Fix identified intro HUD, scene-completion, object-visibility and ship-showcase preparation issues.
- [ ] Verify the complete intro as a continuous experience, including camera handoffs, solar-system details and the ship showcase. Use an isolated harness where possible; run the full intro only when necessary to test the sequence itself.
- [x] Correct music key-frequency lookup and prevent prepared background scenes from replacing active scene music.
- [ ] Give the procedural music a listening-led second pass on composition and arrangement; the reliability fixes do not complete this request.

Other earlier threads need a status check:

- [ ] **Song progression comparison.** The user asked to compare standard song progressions and decide whether verses are always the same or vary. Some examples are similar or in different keys. Check whether this was done. If not, do it.
- [ ] **Wormhole Mode restriction.** Wormholes are restricted by Mode. Engineers tune the engine to match the Mode of the engine and the wormhole. Mode and transposition are implemented. The engineer tuning gameplay needs checking.
- [ ] **Ordeals and minigames.** Video game and minigame sections should be driven from the Ordeal rules where possible. The genre-neutral minigame core and the Wormhole and planet-surface adapters are done. Check the rest of the driving logic.
- [ ] **Racing ordeals as action sequences.** Check whether races are action sequences and use the rules.
- [ ] **Ordeal rule audit.** Keep checking against `docs/rules/`.

## 13. Housekeeping

- [x] Mirror the current avatar engine and new avatar helpers to `ttrpg-companion/src/t13ne/procgen/avatar/`, and verify hashes.
- [ ] Mirror `package.json` and the new test file if the companion needs them.
- [ ] Update the "Character models" row in `docs/architecture/current-state.md`: it still describes per-vertex colours and says no paint tool exists.
- [x] Add the new avatar, skin-store, music-key and system-HUD test files to the explicit `test:node` list in `package.json`.
- [ ] Remove the temporary Playwright harness (`tmp-avatar-render/`) after each use.
- [ ] Clean up temporary files at the end of each task.
- [ ] Do not commit unless asked.
