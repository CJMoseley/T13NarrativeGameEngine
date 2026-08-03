# JULES Prompt: T13 Engine API Contract

## Goal
Define the comprehensive, versioned API contract that all client roles (Player, Companion Mode) must adhere to when interacting with the central Referee/Authoring Backend. This section defines *how* data is exchanged, not *what* the data is.

### Core API Endpoints & Functions
1.  **`/api/v1/state`**: Manages the global game state (e.g., current location, active scene). Must support read-only access for Players and full write access for Referees.
2.  **`/api/v1/characters`**: CRUD operations for characters.
    *   *Write:* Requires validation against existing T13 rulesets.
    *   *Read:* Used by both Player and Companion Mode to display character sheets.
3.  **`/api/v1/modules/{moduleName}`**: The primary endpoint for accessing specialized functionality (e.g., `/api/v1/modules/card-spreads`). This must be the gateway for all module-specific logic.
4.  **`/api/v1/story`**: Handles story generation requests, accepting parameters like desired tone, length, and starting prompt.

### Data Structures (Schema Definition)
*   Define JSON schemas for key objects: `Character`, `Location`, `Skill`, `Proficiency`, etc.
*   Specify required fields, data types, and validation rules for each schema.

### Communication Protocols
*   **WebSockets:** Must be used for real-time updates (e.g., when a Referee changes the state, all connected Players must receive an immediate update).
*   **REST/HTTP:** Used for initial setup, large data fetches, and non-real-time operations (e.g., fetching a full character sheet).

---
*(Continue with Modules Definition)*