# T13 Developer & Maintenance Guide

This guide is for engineers maintaining the T13 Narrative Engine or developing new games on top of it.

## Architecture Overview
- **Core**: Vanilla JS modules with Native Web Components.
- **Engine Hub**: `src/t13ne/T13NE.js` centralizes all narrative and mechanical modules.
- **Persistence**: `PersistenceManager.js` handles IndexedDB and JSON exports.
- **WASM Acceleration**: Heavy calculations (PRNG, Gematria, Audio) are handled by C++ compiled to WASM in `src/t13ne/wasm/`.
- **Networking**: `P2PNetworkManager.js` uses PeerJS for serverless WebRTC.

## Development Workflow
1. **Modules**: New features should be implemented as modules in `src/t13ne/modules/` and registered in `T13NE.js`.
2. **UI**: Use Custom Elements for reusable UI components.
3. **Rules**: Rule data is stored in `src/t13ne/data/json/rules/` and compiled using `scripts/extract_rules.js`.

## Maintenance
- **WASM**: C++ source is in `src/cpp/`. Use the root `Makefile` to recompile.
- **Dependencies**: Managed via `package.json`. Key deps include Three.js, PeerJS, and MediaPipe.
- **Deployment**: automated via GitHub Actions to GitHub Pages.
