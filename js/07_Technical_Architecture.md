# Engine Technical Architecture

## Overview
The T13NE Narrative Game Engine is built on a modular, event-driven architecture designed for high performance and a seamless user experience. It leverages Three.js for 3D rendering and a custom "Backstage" scene management system.

## Core Components

### 1. ViewManager (`plugins/t13ne/core/ViewManager.js`)
The "Front of House" manager. It orchestrates scene transitions, manages the camera/renderer, and coordinates between the 3D world and the 2D UI.
- **Scene Caching:** Keeps frequently used scenes in memory for instant transitions.
- **Z-Layer Management:** Centralized control of DOM element layering (HUD, Menus, Transitions).
- **Transitions:** Supports various visual transition effects (fades, wipes, cross-dissolves) by capturing the current frame before swapping scenes.

### 2. Scene Manager (`plugins/t13ne/core/SceneManager.js`)
The "Backstage" worker. It handles the dynamic loading and preparation of scene modules.
- **Dynamic Imports:** Uses Vite's `import.meta.glob` to discover and load scene files on demand.
- **Preparation Lifecycle:** Manages the asynchronous `prepare()` phase where assets are loaded and procedural generation occurs.

### 3. Base Scene (`plugins/t13ne/core/Scene.js`)
The foundation for all game environments. It provides a standardized lifecycle:
- `constructor()`: Basic initialization.
- `prepare(onProgress)`: Async asset loading and generation.
- `onLoad()`: Called when the scene becomes active; starts the animation loop.
- `onUnload()`: Stops animations and cleans up temporary listeners.
- `dispose()`: Full cleanup of Three.js resources.
- **Standardized Interface:** Provides `addObject()` and `removeObject()` for managed interaction with 3D entities and physics.

### 4. LoaderManager (`plugins/t13ne/core/LoaderManager.js`)
Orchestrates the application boot sequence.
- **Non-Blocking Boot:** Designed for "Asynchronous Production." It triggers visual transitions (e.g., Galaxy pan) as soon as the core engine is ready, allowing heavy data tasks (like Galactic History) to continue loading in the background.
- **Visual Sequencing:** Uses the `ViewManager`'s cue system to create cinematic intro sequences that keep the user engaged during the initial load.

### 5. ShipFactory (`plugins/t13ne/core/ship/ShipFactory.js`)
A persistent system for procedural ship assembly.
- **Scene-Awareness:** Automatically hooks into the active scene via `EventBus` to render procedural hulls and components.
- **UHPP Integration:** Leverages the Universal Hybrid Procedural Pipeline for advanced generation (SDF hulls, L-Systems, WFC).

## Development Guidelines

- **Standardize on `scene`:** Use `this.scene` for the Three.js scene object. For compatibility with external tools, a `threeScene` getter is provided.
- **Asynchronous Feedback:** Never block the main thread or show a static loader without visual progress. Prefer starting a "safe" visual scene (like a starfield) while background data loads.
- **Managed Lifecycle:** Always use `addObject` and `removeObject` on the scene instance to ensure physics and memory are handled correctly.
