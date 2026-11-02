# Tracked Assets Inventory, Migration Proposal & Asset Baseline

## 1. Inventory of Tracked Files in `dist/`

The repository currently tracks 57 files under `dist/`. In a standard web architecture, `dist/` is the generated artifact output directory, while source files reside in `public/` and `src/`.

### Tracked Categories:
1. **Physics WASM Binaries:**
   - `dist/ammo/ammo.wasm.js` (identical copy in `public/ammo/ammo.wasm.js`)
   - `dist/ammo/ammo.wasm.wasm` (identical copy in `public/ammo/ammo.wasm.wasm`)
2. **Procedural & Data Definitions:**
   - `dist/manifest.json` (identical copy in `public/manifest.json`)
   - 19 JSON files in `dist/data/` (including `corporations.json`, `naming.json`, `planet.json`, `proficiencies.json`, etc.; identical copies in `public/data/`)
   - Component & dressing JSONs: `dist/data/components/example_component.json`, `dist/data/dressing/profiles.json`, `dist/data/languages/*.json`
3. **Audio Manifests & Presets:**
   - `dist/media/audio/audio_assets_manifest.json`
   - `dist/media/audio/audio_assets_manifest_original.json`
   - ModeAudio / Crystalline / BMOP preset sidecars (`.asd`, `.fxp`, `.als`, `.adg`, `.cst`, `.plist`, `.url`, `.txt`)

### Safe Migration Proposal:
- All canonical static files already exist under `public/`.
- Once verified across build targets, a dedicated maintenance pass will:
  1. Ensure any unique data files in `dist/` are mirrored in `public/`.
  2. Untrack `dist/` files via `git rm -r --cached dist/`.
  3. Add `dist/` to `.gitignore`.
  4. Build directly to `dist/` without polluting git tracking.
- For this pass (J01+), `dist/` tracked files are kept completely untouched and isolated by directing builds to `dist-build/` and `dist-ttrpg/`.

---

## 2. Asset Taxonomy: Runtime Requirements vs Non-Committed Media

| Asset Type | Location | Required for Runtime / Tests | Committed Status | Provisioning / Behavior if Missing |
|------------|----------|------------------------------|------------------|------------------------------------|
| **Physics WASM** | `public/ammo/ammo.wasm.{js,wasm}` | Yes (VTT 3D physics scenes) | Committed in `public/ammo/` | Bundled via `viteStaticCopy` to target output; served statically. |
| **Codex & Data JSONs** | `src/t13ne/data/json/` & `public/data/` | Yes (CodexLibrary, rulebook, game state) | Committed in git | Loaded at runtime via fetch; missing files raise actionable errors in `CodexLibrary`. |
| **Card / Facet Art** | `public/media/images/` | Optional (Visual cards / iconography) | Partially committed (SVGs/PNGs) | Card component falls back to Unicode/ASCII symbols if image unavailable. |
| **3D Models** | `public/data/models/` | Optional (detailed ship & environment meshes) | Non-committed (gitignored) | Procedural geometries generated in Three.js fallback gracefully. |
| **Audio Samples / Loops**| `public/media/audio/loops/` | Optional (ambient music & procedural audio) | Non-committed / gitignored | Synthesizers/Markov generator fallback gracefully; manifests index available files. |

---

## 3. Investigation of Windows `EPERM` During Sample Copying

### Cause Analysis:
During Vite builds (`viteStaticCopy`), `public/media/audio/loops` and `src/t13ne/data` are copied to build output targets.
On Windows environments:
1. **File System Locks & Antivirus Scanners:** Windows file locks prevent overwriting or deleting files currently opened by running dev server processes or background indexers.
2. **Special Characters in Filenames:** Several audio sample sidecar directories contain hash marks (`#`) and brackets (`[ABLETON]`, `[LOGIC]`, `MA_Aerofoil_80_A#_TapeGuitar.wav.asd`). In Windows node environments, certain path-copying routines fail with `EPERM` when encountering locked handles or unescaped path characters.
3. **Overlapping Output Directories:** Building into the same output directory while Vite is serving or watching locks destination files.

### Resolution & Prevention:
- Use isolated, non-overlapping build output directories (`dist-build/` and `dist-ttrpg/`) with `emptyOutDir: true`.
- Never attempt to copy non-committed media directories (`public/media/audio/samples/`) during standard builds.
- Configure `viteStaticCopy` targets explicitly with normalized paths.
