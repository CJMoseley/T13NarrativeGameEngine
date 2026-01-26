System Architecture Brief: Universal Procedural Animation Engine (UPAE)
Objective: Build a JavaScript module for Three.js that drives procedural avatars (PS2/GameCube "Medium-Poly" aesthetic or "cuboid" "minecrafty" style) using a hybrid of Pre-baked Clips, Inverse Kinematics (IK), and Neural Motion Synthesis.
Final System Architecture Brief: Universal Hybrid Procedural Pipeline (UHPP) with Live-Avatar Support
Objective: Build a modular JavaScript (ES2026) procedural engine that generates organic environments (WFC/Voronoi) and "Live-Ready" avatars (VTuber/IK/AI).
1. Core Tech Stack (Updated)
Solver: ndwfc + d3-delaunay (for world and body-plan graphs).
Renderer: Three.js (r174+) with three-vrm (for humanoid metadata).
Animation Logic: Kalidokit (tracking math) + MediaPipe Holistic (vision) + AI4Animation-js (gait).
Audio: Web Audio API (for lip-sync/volume-based jaw movement).
2. Live-Ready Body Plan Specification
The AvatarEngine.js must generate skeletons with standardized Naming Conventions (VRM standard) to ensure plug-and-play compatibility with tracking libraries:
Standardized Bones: hips, spine, neck, head, leftUpperArm, etc.
VTuber Rigging Interface: Every generated head must expose a MorphTargetDictionary containing standard ARKit/VRM blend shapes: eyeBlinkLeft, eyeBlinkRight, jawOpen, mouthPucker, and mouthFunnel.
Define a "Body Plan Schema" that allows the engine to distinguish between a Minecraft-style human and an alien quadruped:
The "Core" (Root): A hierarchical stack of Torso_Upper and Torso_Lower (allows for waist twisting/breathing).
The "Joints" (Limbs): A modular LimbChain class.
Humanoid: 2 Arms, 2 Legs (3 joints each: Shoulder/Hip, Elbow/Knee, Wrist/Ankle).
Alien/Quadruped: 4+ Legs, optional tail, or multiple "Head" nodes.
Crab/Spider: 6+ Legs, segmented body.
centipede: 10+ Legs, segmented body.
Radial symmetry creatures (sea stars- etc)
Winged beings (shoulder wings, arm replacement wings, feathered, insect styles, skin flap styles, etc)
Visual Style (PS2 Aesthetic): Segmented meshes with built-in "Joint Caps" (spheres at elbows/knees). This prevents the "paper-thin" look when low-poly limbs bend sharply. PS2/GameCube "Medium-Poly" with Toon Shading. Use segmented geometry for limbs and "Texture-Swapping" for facial expressions to maintain the retro aesthetic while allowing for smooth VTuber-driven speech.
3. The "Live-Stream" Animation Bridge
Implement an AvatarController that acts as a prioritized weighting system:
Input Layer (Camera/Mic):
Vision: Map MediaPipe landmarks to Kalidokit to drive Upper-Body bones and Face blend shapes.
Audio: Use the Microphone as a fallback for jawOpen values (Lip-syncing based on volume/frequency) if the camera is off.
Procedural Layer (IK/AI):
Lower Body: While the user sits at their desk, the avatar's legs are driven by AI4Animation-js for idle weight-shifting and CCDIKSolver for procedural foot-planting on the 3D Voronoi terrain.
State Blending: Automatically transition from "Pregenerated Clips" (Layer A) to "Live Tracking" (Layer D) when a valid camera signal is detected. The engine must blend three distinct data sources into a single SkinnedMesh that is then potentially tied tot he VTuber systems:
Layer A: Pre-baked Library (The "Standard")
Use standard GLTF AnimationClips for base states (Idle, Jump, Wave).
Library: Mixamo for humanoids; custom .glb clips for quadrupeds.
Layer B: Inverse Kinematics (The "Environment")
Foot Planting: Use IK to adjust the Ankle height based on the Voronoi/Cuboid terrain generated in the previous module. Or standard collision detection.
Look-At Logic: Apply a CCDIKSolver to the neck/spine to track targets procedurally.
Layer C: AI Motion Synthesis (The "Life")
Integrate AI4Animation-js to handle Gait Blending. Instead of a "Run" loop, the AI generates the limb position based on the character's velocity and terrain slope, ensuring "Alien" body plans move with realistic weight.
4. Technical Specification for AI Assistant
Module VTuberBridge.js:
Implement a capture() method using navigator.mediaDevices.getUserMedia.
Map Kalidokit rotation outputs directly to the Three.js Object3D.quaternion of the corresponding rig bones.
Module MorphManager.js:
If the generated model is a simplified "Minecraft" style, handle expressions by shifting UV offsets on a DataTexture.
If the model is "PS2-Detailed," handle expressions via BufferGeometry morph targets.
Performance: Use OffscreenCanvas for MediaPipe processing to ensure the 3D world render loop never drops below 60fps.
Requested Code Output:
A UniversalPipeline class that orchestrates World Gen (WFC) and Avatar Gen (Procedural Rigging).
A standard BoneMapper that aliases procedural joint names to VRM-standard names.
A LiveUpdate loop that blends Neural Gait (legs), IK (feet), and VTuber tracking (head/arms/face).
A Cel-Shader setup that includes a 3-tone ramp and Sobel-edge post-processing for that classic PS2 character portrait feel.1. Core Tech Stack & Dependencies
Engine: Three.js (r174+) for rendering and skeletal management.
Kinematics: three-ik or CCDIKSolver (included in Three.js) for procedural limb-planting and aiming.
Neural Motion: AI4Animation-js for real-time physics-based gait transitions.
Shading: Three.js MeshToonMaterial with a custom OutlinePass to achieve a cel-shaded, stylized PS2-era look.
Module AvatarEngine.js: A class that accepts a BodyPlan JSON and generates a Three.js SkinnedMesh.
Module AnimationBlender.js: A controller that blends weights between clipAction, IKGoal, and neuralOutput.
Shading: Apply a Cel-Shader using MeshToonMaterial with a 3-tone gradient map and a Sobel edge-detection post-processing pass for the PS2-style "Character Portrait" look. 
Visuals: Create a low-poly "Jointed" geometry builder that separates the upper chest, lower torso, and uses distinct shoulder/knee pads as separate mesh objects for high characterization.
5. PNG or SVG "skin" systems so a standard "character skin" PNG/SVG can be edited by any player and added to a "Skins" media library. I do mean both should be supported not either.specific areas can be reserved for "eyes" "face" "mouth" for additional animation support. 
Requested Output:
A BodySchema JSON format for Humanoid vs. Quadruped.
A Three.js rigging script that builds a skeleton from the schema.
The update() loop logic that combines AnimationMixer with IK and AI4Animation weights and the VTUber systems if connected.