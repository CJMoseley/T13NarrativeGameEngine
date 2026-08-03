# JULES Prompt: T13 Narrative Game Engine Architecture (MASTER BLUEPRINT)

## 🚀 Overview and Goal
The primary objective is to build a modular, multi-role platform—the **T13 Engine**—that serves as the core framework for multiple narrative experiences. This engine must be designed not as a single application, but as an API-driven system capable of hosting distinct, self-contained game projects (like Wormhole Racers) and specialized companion tools (TTRPG Companion Mode).

The T13 Engine is *not* a video game itself; it is the underlying technology layer. The core principle guiding all development must be **separation of concerns** and **API contract adherence**.

### Core Components & Roles
1.  **Engine Core:** The foundational framework providing universal services (e.g., state management, logging, asset loading, API endpoints).
2.  **Game Project (Example: Wormhole Racers):** A specific application built *on top* of the Engine Core. It uses the core modules but is self-contained and has its own game loop/rendering logic.
3.  **TTRPG System:** A specialized, API-driven client experience that allows human players to interact with the narrative system (VTT). This includes:
    *   **Referee/Authoring Role:** The primary write access point. Can author adventures, create locations, build models, and manage character sheets. It is responsible for defining the game state and exposing APIs.
    *   **Player Role:** A read-only client that consumes the API endpoints exposed by the Referee server to display rules and facilitate gameplay.
4.  **Story Mode:** A high-level workflow module (using Yarn/AI systems) that generates narrative content (novels, sequences). This must use existing modules and APIs; it is a *functionality*, not a scope change.

### 🛠️ API Contract Definition
All interactions between the Game Project, Companion Mode, and Story Mode must pass through well-defined, versioned API endpoints exposed by the Engine Core/Referee backend.

**Key Endpoints & Functions:**
*   `/api/v1/state`: Manages the global game state (e.g., current location, active scene). Must support read-only access for Players and full write access for Referees.
*   `/api/v1/characters`: CRUD operations for characters. Requires validation against existing T13 rulesets. Used by both Player and Companion Mode to display character sheets.
*   `/api/v1/modules/{moduleName}`: The primary endpoint for accessing specialized functionality (e.g., `/api/v1/modules/card-spreads`). This must be the gateway for all module-specific logic.
*   `/api/v1/story`: Handles story generation requests, accepting parameters like desired tone, length, and starting prompt.

**Data Structures:** Define comprehensive JSON schemas for key objects: `Character`, `Location`, `Skill`, `Proficiency`, etc., specifying required fields, data types, and validation rules.

**Communication Protocols:**
*   **WebSockets:** Must be used for real-time updates (e.g., when a Referee changes the state, all connected Players must receive an immediate update).
*   **REST/HTTP:** Used for initial setup, large data fetches, and non-real-time operations.

### 🧩 Modules & Systems Integration
The system relies on modular components that are loaded via the Plugin Manager. Key modules include:
*   `t13ne-facets`: Manages fundamental aspects of reality/themes.
*   `t13ne-sway`: Handles resource conversion and potency levels.
*   `t13ne-cards-api`: Provides API for card spreads and drawing mechanics.
*   `t13ne-ordeals`: Defines structure and logic for multi-stage challenges.

### 📜 Development Workflow Summary
The development process must follow this hierarchy: **Engine Core $\rightarrow$ Modules $\rightarrow$ Role-Specific Application.** All changes must be implemented by updating the configuration files (`vite.config.js`, `package.json`) to enforce mode-specific builds (e.g., `--mode player`, `--mode referee`).

---
*This document serves as the definitive, single source of truth for the T13 Engine architecture.*