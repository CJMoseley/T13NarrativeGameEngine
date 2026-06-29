# T13 TTRPG Companion & 3D VTT: Developer Handover Specification

This specification document outlines the exact architecture, data structures, and implementation steps required to complete the T13 TTRPG Companion and 3D Virtual Tabletop (VTT). It is designed to enable a developer or another agentic coding AI (such as Google Jules) to build and integrate all features in a first-pass, framework-free Vanilla JS structure.

---

## 1. System Overview & Core Stack

The system is a fully static client-side web application capable of running from **GitHub Pages** (or as a custom subdomain under `cjmoseley.co.uk`) and establishing a serverless **Peer-to-Peer** network using **PeerJS**.

### Technology Stack:
1. **Core Language:** ES6 Vanilla JavaScript (Strictly modules).
2. **UI Architecture:** Native Web Components (Custom Elements) with reactive `Proxy`-based state.
3. **Styling:** Vanilla CSS3 (Custom Variables, Flexbox/Grid, Glassmorphic effects).
4. **3D Graphics & Physics:** Three.js (`^0.174.0`), `@pixiv/three-vrm` (`^3.4.5`), and Ammo.js (via the copied `BasicPhysicsEngine` and `AdvancedPhysicsEngine` wrappers).
5. **C++ WebAssembly:** Copied Emscripten modules (`prng`, `core`, `audio`) for safe plot tracking, repeatable random rolls, and music synthesis.
6. **P2P Networking:** `peerjs` library communicating via the free PeerJS cloud broker (`0.peerjs.com`) for WebRTC session negotiation.

---

## 2. Directory Structure Blueprint

The development continues within `/ttrpg-companion/` on the `ttrpg-companion` branch:

```
ttrpg-companion/
├── index.html                   # Core application layout
├── main.js                      # Application bootstrapper
├── vite.config.js               # Dev server configuration
├── DEVSPEC.md                   # This specification file
├── css/
│   └── styles.css               # Main glassmorphism stylesheet
├── scripts/
│   └── extract_rules.js         # NodeJS compiler script for rulebook
├── rulebook/
│   └── index.html               # Compiled static rule pages output
├── src/
│   └── t13ne/                   # Engine implementation
│       ├── core/                # Logger, SoundEngine, P2PNetworkManager, VOIPManager
│       ├── wasm/                # WebAssembly (prng.js, core.js, audio.js)
│       ├── data/                # Copied JSON sheets
│       └── procgen/
│           └── avatar/          # VRMModelLoader, VTuberBridge, AvatarEngine
└── components/                  # Custom Web Components
    ├── T13VttCanvas.js          # Three.js 3D tabletop rendering & dice physics
    ├── T13CharacterSheet.js     # Character stats, knots, and hexagrams
    ├── T13VtuberPanel.js        # Webcam panel, MediaPipe solver, & 3D avatar viewport
    └── T13RuleBook.js           # Integrated rules reader UI
```

---

## 3. WebRTC Peer-to-Peer Architecture (PeerJS)

To bypass VPS hosting requirements, we use **PeerJS** for serverless room signaling.

### A. Network Topology
The app uses a hybrid mesh. When a GM opens a room, they act as the **Room Host**. Players connect to the host. Voice (VOIP) is meshed (each peer sends audio to other peers), while VTT and game state are routed through the host to ensure authority.

```
       [ Player B ]
        ^       \
 (Audio Mesh)   (Data Sync)
      /           v
[ Player A ] <===> [ Room Host / GM ]
      ^           /
 (Audio Mesh)   (Data Sync)
        \       v
       [ Player C ]
```

### B. Connection Protocol (`P2PNetworkManager.js`)
Create `ttrpg-companion/src/t13ne/core/P2PNetworkManager.js` implementing:
- **`constructor()`**: Initialize `new Peer(null, { host: '0.peerjs.com', port: 443, secure: true })` to get a random Peer ID.
- **`createRoom(roomId)`**: Host registers a Peer ID named `t13-room-${roomId}`. Listens for incoming data/media connections.
- **`joinRoom(roomId)`**: Client connects to `t13-room-${roomId}`.
- **`broadcast(message)`**: Host forwards a data payload to all connected peers.

### C. Sync Data Schema
Data transmitted over `RTCDataChannel` must be JSON objects with a `type` header:

```json
// Example: Dice Roll Sync
{
  "type": "DICE_ROLL",
  "peerId": "client_9482",
  "actor": "Kaelen the Weaver",
  "result": {
    "diceCount": 3,
    "scores": [6, 4, 11],
    "total": 21
  }
}

// Example: VTT Token Drag Sync
{
  "type": "TOKEN_MOVE",
  "tokenId": "token_char_103",
  "position": { "x": 1.5, "y": 0.0, "z": -4.2 }
}
```

---

## 4. 3D VTT Tabletop & Dice Physics

The 3D VTT handles loading a tabletop deck, rendering tokens, and rolling physical 3D dice.

### A. Tabletop Rendering
- Initialize a `THREE.Scene`, `THREE.PerspectiveCamera`, and a renderer outputting to a `<canvas>` inside `<t13-vtt-canvas>`.
- Set up orbit controls (`three/examples/jsm/controls/OrbitControls.js`) restricting vertical rotations so players stay above the table.
- Renders a wood or felt grid plane. Allow the host to set a texture (VTT background map).

### B. 3D Dice physics
- Use the copied `BasicPhysicsEngine` (built on Ammo.js).
- When a player triggers a roll:
  1. Instantiate a 3D geometry representing the die (e.g. `THREE.IcosahedronGeometry` for a d20, `THREE.BoxGeometry` for a d6).
  2. Create a matching rigid body in the physics engine (box or sphere shape).
  3. Apply a random force vector and angular torque at the starting position (above the table):
     ```javascript
     rigidBody.setLinearVelocity(new Ammo.btVector3(xForce, yForce, zForce));
     rigidBody.setAngularVelocity(new Ammo.btVector3(xTorque, yTorque, zTorque));
     ```
  4. Run the physics loop. Once the rigid body velocity falls to 0, calculate which face is pointing upwards (dot product of face normal and global UP vector `(0, 1, 0)`) to determine the value.
  5. Sync the result and final positions to other players over the `RTCDataChannel`.

---

## 5. Vtuber Avatar Panel Integration

Renders a 3D canvas alongside a webcam feed tracking the player.

### A. VRM Loading
Create `ttrpg-companion/src/t13ne/procgen/avatar/VRMModelLoader.js`:
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';

export class VRMModelLoader {
    constructor(scene) {
        this.scene = scene;
        this.loader = new GLTFLoader();
        this.loader.register((parser) => new VRMLoaderPlugin(parser));
    }

    async load(url) {
        return new Promise((resolve, reject) => {
            this.loader.load(url, (gltf) => {
                const vrm = gltf.userData.vrm;
                // Add model to scene
                this.scene.add(vrm.scene);
                vrm.scene.rotation.y = Math.PI; // Face the camera
                resolve(vrm);
            }, undefined, reject);
        });
    }
}
```

### B. Landmark Solver (VTuberBridge & Kalidokit)
- The webcam captures frames and feeds them to MediaPipe Holistic:
  ```javascript
  this.holistic.onResults((results) => {
      const face = results.faceLandmarks;
      const pose = results.poseLandmarks;
      // Solve rotations via Kalidokit
      const riggedFace = Kalidokit.Face.solve(face, { runtime: 'mediapipe', video: this.videoElement });
      const riggedPose = Kalidokit.Pose.solve(pose, face, { runtime: 'mediapipe', video: this.videoElement });
      
      this.updateAvatar(vrmModel, riggedFace, riggedPose);
  });
  ```
- **Mapping to VRM Bones:**
  Apply solved rotations directly to the VRM Humanoid bones:
  ```javascript
  const head = vrmModel.humanoid.getNormalizedBoneNode('head');
  if (head && riggedFace) {
      head.quaternion.slerp(new THREE.Quaternion().setFromEuler(
          new THREE.Euler(riggedFace.head.x, riggedFace.head.y, riggedFace.head.z)
      ), 0.3); // Smooth transition
  }
  ```
- **Mapping to VRM Blendshapes:**
  Apply facial morphs (eye blink, mouth open) to the VRM blendshape proxy:
  ```javascript
  const expressionManager = vrmModel.expressionManager;
  if (expressionManager && riggedFace) {
      expressionManager.setValue('blinkLeft', riggedFace.eye.l);
      expressionManager.setValue('blinkRight', riggedFace.eye.r);
      expressionManager.setValue('aa', riggedFace.mouth.shape.y); // Open mouth
  }
  ```

---

## 6. Static Rules Extraction Script (`extract_rules.js`)

We compile the JSON data sheets in `/src/t13ne/data/json/rules/` into lightweight, searchable, responsive static HTML pages.

### Extraction Logic:
1. Load all `.json` files in the directory.
2. Read the `RulePage` field for the title and the `Description` field for the raw HTML rule contents.
3. Parse and sanitize the HTML description.
4. Inject the rule HTML into a template containing:
   - Sidebar containing links to all other 53 rules (enabling fast offline browsing).
   - Search bar (fully client-side utilizing basic keyword scanning).
   - Clean, readable typography using HSL dark values and high-contrast text.
5. Save the output files to `/ttrpg-companion/rulebook/`.
6. Compile a master `index.html` inside `rulebook/` acting as the table of contents.

---

## 7. Implementation Milestones for Future Development

1.  **Boilerplate & Routing:** Run the rule extraction script `node scripts/extract_rules.js` to build the readable handbook. Establish the main dashboard shell with navigation.
2.  **P2P Communication:** Wire `P2PNetworkManager.js` with PeerJS. Test text and voice chat between two open browser tabs.
3.  **VTT 3D Render:** Mount Three.js into the VTT component. Drag simple blocks around the board, synchronizing coordinates via data channel.
4.  **Physics Rolls:** Connect Ammo.js. Implement clicking "Roll Dice" which spawns 3D shapes falling onto the table, reporting their resulting face values.
5.  **Vtuber Mount:** Create the camera tracking panel. Load a default `.vrm` character model and verify head tracking works.
