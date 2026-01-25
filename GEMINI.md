# Gemini's Understanding of the Wormhole Racers Universe

This document outlines my current understanding of the procedural generation systems and the overall game concept for Wormhole Racers, based on my analysis of the code and the provided design documents.

## 1. Game Concept & Core Loop

Wormhole Racers is a multiplayer, multi-role spaceship racing game. Players form a crew (Pilot, Navigator, Engineer, Weapons) and race through dynamic, procedurally generated wormholes.

**The Core Loop:**
1.  **Race:** Compete in various leagues across the galaxy. The wormhole itself is a track that is affected by the racers' ships and their technology.
2.  **Explore & Interact:** Arrive in new star systems, dock at space stations, and interact with NPCs and story elements.
3.  **Upgrade & Customize:** The Engineer can modify the ship, fit new components, and tune its performance. Ship customization is a core feature.

## 2. Ship Design & Generation

Ships are modular and can be built from a variety of components. The visual appearance of a ship is determined by its components and a procedural generation process that can create either faceted, "industrial" hulls or smooth, "organic" ones.

### 2.1. The Generation Pipeline

1.  **Ship Layout Definition**: A ship's design starts with a layout, which is a collection of components and their positions. These layouts should be defined in a dedicated file, like `js/procgen/ships/ShipLayouts.js`.
2.  **`ProceduralComponentGenerator`**: This class takes a component's "usage" (e.g., 'fuselage', 'engine') and generates a component definition, including a `proxyShape` (e.g., 'box', 'sphere') and dimensions.
3.  **`ShipFactory`**: This is the main orchestrator for building the ship's 3D model.
    *   It uses `ComponentFactory` to create the primitive meshes for each component.
    *   It uses `HullGenerator` to create a single hull mesh from the component primitives.
    *   It can use `three-csg-ts` to carve out interior spaces like cockpits and corridors.
4.  **`HullGenerator`**:
    *   **'INDUSTRIAL' mode**: Creates a convex hull using the PhysX engine.
    *   **'ORGANIC' mode**: Creates a smooth hull using a Signed Distance Function (SDF) and the Marching Cubes algorithm. This requires the `marching-cubes-js` library.

### 2.2. Interior Spaces

Ships have explorable interiors. This is achieved by using Constructive Solid Geometry (CSG) to subtract interior spaces from the main hull mesh.

## 3. Lore and Naming

The game has a rich, procedurally generated lore.

*   **`LoreData.js`**: Loads all lore-related data from JSON files, as defined in `public/data/lore-manifest.json`. This includes `naming.json`.
*   **`LoreGenerator.js`**: The central hub for all lore generation. It contains specialized generators for species, technology, and names.
*   **`NameGenerator.js`**: Located in `js/procgen/lore/factories/`, this class uses grammars and word lists from `naming.json` to generate procedural names for everything from ships to planets.

## 4. Technology & Crafting

*   **Tech Tree**: Technology is unlocked through a "fog of a war" tech tree, with progression gated by story events.
*   **Bitwise IDs**: Components are defined by a bitwise ID that encodes their material properties and function.
*   **T13 System**: The game's design documents frequently mention a "T13" system (T13-NE, T13 Facets, T13 Sway table). This seems to be a core system for defining technology, crafting, and their interactions. It appears to be a PHP-based system, with its data being converted to JSON for use in the game. I need to be mindful of this system when working with technology and crafting.

## 5. Species

The game features a mix of pre-defined and procedurally generated alien species. The `SpeciesGenerator` in `LoreGenerator` is responsible for this.

## 6. Scene & View Management

The application's structure is managed by a trio of classes: `ViewManager`, `SceneManager`, and `Scene`.

*   **`ViewManager.js`**: The central hub of the application. It instantiates and coordinates all other major managers (`GameEngine`, `UIManager`, `SceneManager`). It holds the main game state (like the `playerShip`) and orchestrates the application startup sequence.

*   **`SceneManager.js`**: Responsible for loading, unloading, and transitioning between different scenes (e.g., `GalaxyMapScene`, `StellarSystemScene`). It dynamically imports scene modules and manages the currently active scene.

*   **`Scene.js`**: A base class for all game scenes. It manages a collection of 3D objects, their visual models (`THREE.Group`), and their physics representations. It interacts with a `PhysicsEngine` to handle simulation and updates the visual models based on the physics state.

## 7. Core Systems

### 7.1. `js/main.js`

The main entry point of the application. It initializes the `ViewManager` and `LoaderManager`, starting the entire application loading sequence. It is responsible for bootstrapping the application and handling any fatal errors during the process.

### 7.2. `js/core/LoaderManager.js`

This class manages the entire loading sequence of the application. It orchestrates the initialization of various managers, loading of assets, and the visual intro sequence. It provides feedback to the user via the `IntroSequence` UI.

### 7.3. `js/core/PluginManager.js`

This class is responsible for discovering, loading, and managing plugins. It allows for a modular architecture where functionality can be extended without modifying the core game code. It also provides a way for plugins to expose their APIs to the rest of the game.

### 7.4. `js/core/GameEngine.js`

This is a central class that manages the core game state, player data, and simulation updates. It is responsible for initializing and coordinating various core systems like physics, plugins, and sound. It also handles the generation of the galactic environment and player-related data.

## 8. Plugins

### 8.1. T13Ne Plugin

The T13Ne plugin is a core component of the game, providing a rich set of functionalities related to the game's lore, technology, and crafting systems.

#### 8.1.1. `plugins/t13ne/wormholeracers-register-plugin.js`

This file serves as the entry point for the T13Ne plugin. It is responsible for registering the main `T13Plugin` class with the `PluginManager`.

#### 8.1.2. `plugins/t13ne/T13Plugin.js`

This is the main class for the T13Ne plugin. It initializes the T13NE system and exposes its modules as APIs to the game engine.

#### 8.1.3. `plugins/t13ne/modules/t13ne-facets.js`

This module manages the loading and querying of "Facets", a core concept in the T13NE system. Facets represent fundamental aspects of reality, character traits, and narrative themes. This module provides functions to get facets, their aspects, and generate descriptions based on them.

#### 8.1.4. `plugins/t13ne/modules/t13ne-sway.js`

This module handles the "Sway" system in T13NE, which is related to resource conversion, potency levels, and descriptive naming of facets.

#### 8.1.5. `plugins/t13ne/modules/t13ne-cards-api.js`

This module provides an API for working with decks of cards, drawing spreads, and interpreting them. It uses the `CodexLoader` to get card data and `PRNG` for randomness.

#### 8.1.6. `plugins/t13ne/modules/ordeals/t13ne-ordeals.js`

This module defines the structure and logic for "Ordeals" in the T13NE system. Ordeals are multi-stage, multi-round challenges that characters can face. This module defines the `Ordeal`, `OrdealStage`, and `OrdealRound` classes.

#### 8.1.7. `plugins/t13ne/modules/t13ne-prng.js`

This module provides a seedable pseudo-random number generator (PRNG) using the xoshiro256** algorithm. It's used for all random number generation in the T13NE plugin to ensure repeatability.

## 9. Unexamined Systems

Based on the file list, I have not yet examined the following systems in detail:
*   **UI**: `js/ui/`, `css/ui-styles.css`. This includes the `UIManager`, `EngineersConsole`, and other UI components.
*   **Networking**: `js/net/`. This includes `WebRTCManager`, `signaling.js`, and `computeWorker.js`. This is likely for the multiplayer aspect of the game.
*   **Sound**: `js/sounds/`, `js/core/SoundEngine.js`. This includes generators for engine sounds and wormhole ambiance.
*   **The T13NE plugin**: I have seen references to it, but I have not examined the PHP code in the `t13ne/` directory as it is not relevant to the javascript.

My understanding of the system is now more complete. I will use this knowledge to make better decisions about where to place new code and how to integrate with existing systems.