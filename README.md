# T13 Narrative Game Engine & TTRPG Companion

A comprehensive, procedurally-driven narrative engine and 3D Virtual Tabletop (VTT) for the T13 TTRPG system.

## Key Features
- **Narrative Loom**: Procedural plot generation and tracking using the T13 Yarn card system.
- **3D VTT**: Full 3D tabletop with physics-based dice rolls (Ammo.js) and spatial audio.
- **Author Mode**: Integrated workbench for creating Characters, Proficiencies, Annexes, and Plots.
- **AI-Powered**: Context-aware narration and name generation via Ollama/Bitnet.
- **Serverless P2P**: Low-latency networking using PeerJS.
- **Multi-Platform**: PWA support for installability on Desktop and Mobile.

## Project Structure
- `/src/t13ne/`: Core Narrative Engine modules and logic.
- `/ttrpg-companion/`: The player and referee-facing companion application.
- `/rulebook/`: Searchable static rule handbook compiled from JSON data.
- `/docs/guides/`: Comprehensive user and developer guides.

## Quick Start
1. `npm install`
2. `npm run dev`
3. Open `http://localhost:5173` for the Companion app.

## Documentation
- [Standard Player's Guide](docs/guides/PlayersGuide.md)
- [Hero's Player Guide](docs/guides/HeroGuide.md)
- [Yarn-Teller's Guide](docs/guides/YarnTellerGuide.md)
- [Referee's Guide](docs/guides/RefereesGuide.md)
- [Author's Guide](docs/guides/AuthorsGuide.md)
- [Developer's Guide](docs/guides/DevelopersGuide.md)
