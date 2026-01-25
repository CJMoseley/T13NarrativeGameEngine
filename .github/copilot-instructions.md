# Copilot Instructions for WormholeRacersJS

## Overview
This project is a prototype for a browser-based wormhole racing visualization and simulation. It utilizes modern web technologies, including ES modules and WebAssembly, to create an interactive experience.

## Architecture
- **Core Components**: The main components include the physics engine, rendering engine, and networking modules. Key files to understand the architecture are:
  - `js/core/` - Contains the core functionalities like `GameEngine.js`, `PhysicsEngine.js`, and `Logger.js`.
  - `js/net/` - Handles signaling and communication between clients and servers, particularly through `signaling.js` and `computeWorker.js`.
  - `wasm/` - Contains WebAssembly modules for performance-critical tasks.

## Developer Workflows
- **Development Server**: Use the following command to start a local server:
  ```powershell
  python -m http.server 8000
  # or
  npx http-server . -p 8000
  ```
  Access the application at `http://localhost:8000`.

- **Building the Project**: Use Vite for building and previewing the project:
  ```bash
  npm run build
  npm run preview
  ```

## Project Conventions
- **Resource Loading**: All resources should be loaded using module-relative URLs. For example:
  ```javascript
  fetch(new URL('../wasm/module.wasm', import.meta.url));
  ```

- **Plugin System**: Plugins are located in the `plugins/` directory and should export an `install(engine)` function. Refer to `plugins/README.md` for more details.

## Integration Points
- **WebSocket Signaling**: The `createSignaling` function in `js/net/signaling.js` establishes a WebSocket connection for client registration and task assignment.
- **Compute Workers**: The `computeWorker.js` file demonstrates how to handle tasks in a web worker, processing data in parallel to improve performance.

## External Dependencies
- The project relies on several libraries, including `three.js` for 3D rendering and `enable3d` for physics. These are specified in `package.json` under dependencies.

## Conclusion
This document serves as a guide for AI agents to navigate and understand the WormholeRacersJS codebase effectively. For further details, refer to the specific files mentioned above.