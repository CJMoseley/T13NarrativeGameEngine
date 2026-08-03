# JULES Prompt: T13 Narrative Game Engine Architecture

## Overview and Goal
The primary objective is to build a modular, multi-role platform—the **T13 Engine**—that serves as the core framework for multiple narrative experiences. This engine must be designed not as a single application, but as an API-driven system capable of hosting distinct, self-contained game projects (like Wormhole Racers) and specialized companion tools (TTRPG Companion Mode).

The T13 Engine is *not* a video game itself; it is the underlying technology layer. The core principle guiding all development must be **separation of concerns** and **API contract adherence**.

### Core Components & Roles
1.  **Engine Core:** The foundational framework providing universal services (e.g., state management, logging, asset loading, API endpoints).
2.  **Game Project (Example: Wormhole Racers):** A specific application built *on top* of the Engine Core. It uses the core modules but is self-contained and has its own game loop/rendering logic.
3.  **TTRPG System:** A specialized, API-driven client experience that allows human players to interact with the narrative system (VTT). This includes:
    *   **Referee/Authoring Role:** The primary write access point. Can author adventures, create locations, build models, and manage character sheets. It is responsible for defining the game state and exposing APIs.
    *   **Player Role:** A read-only client that consumes the API endpoints exposed by the Referee server to display rules and facilitate gameplay.
4.  **Story Mode:** A high-level workflow module (using Yarn/AI systems) that generates narrative content (novels, sequences). This must use existing modules and APIs; it is a *functionality*, not a scope change.

### Architectural Constraints & Principles
*   **API First:** All interactions between the Game Project, Companion Mode, and Story Mode must pass through well-defined API endpoints exposed by the Engine Core/Referee backend.
*   **Modularity:** The system must be built using independent modules that can be loaded and unloaded dynamically (Plugin System).
*   **State Authority:** The Referee role is the single source of truth for game state changes, preventing conflicts between client roles.

---
*(Continue with API Definition)*