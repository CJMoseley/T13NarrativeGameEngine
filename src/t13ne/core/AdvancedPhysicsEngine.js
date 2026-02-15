import * as THREE from 'three';
import Logger from '/src/t13ne/core/Logger.js';
import { PhysXProvider } from '/src/t13ne/core/physics/PhysXProvider.js';
import { PlanetaryRenderer } from '/src/t13ne/rendering/PlanetaryRenderer.js';
import { WormholeShader } from '/src/t13ne/rendering/WormholeShader.js';
import { PlanetSurfaceEnvironment } from '/src/t13ne/procgen/planet/PlanetSurfaceEnvironment.js';
import { WormholeEnvironment } from '/src/t13ne/procgen/galaxy/WormholeEnvironment.js';
import { Controls } from '/src/t13ne/core/Controls.js';
import { ComponentDefs } from '/src/t13ne/procgen/ships/components/ComponentDefs.js';

export class AdvancedPhysicsEngine {
    constructor(gameEngine) {
        console.log("%c ADVANCED PHYSICS ENGINE CONSTRUCTOR FIRING ", "color: red; font-size: 2em; font-weight: bold;");
        const funcName = 'AdvancedPhysicsEngine.constructor';
        Logger.start(funcName);
        this.engine = gameEngine;
        this.physx = new PhysXProvider();
        this.playerShip = { physicsBody: null, pxBody: null }; // Initialize to avoid null pointer
        this.shield = null;
        this.scene = null;
        this.physics = null;
        this.camera = null;
        this.input = null;
        this.renderer = null;
        this.planetaryRenderer = null;
        this.planetGroundCollider = null; // PhysX body for the planetary ground

        this.events = {
            listeners: {},
            on: function (event, fn) {
                if (!this.listeners[event]) this.listeners[event] = [];
                this.listeners[event].push(fn);
            },
            emit: function (event, ...args) {
                if (this.listeners[event]) {
                    this.listeners[event].forEach(fn => fn(...args));
                }
            }
        };
        Logger.end(funcName);
    }

    setContext(scene) {
        this.sceneContext = scene;
        this.scene = scene.scene;
        this.physics = scene.physics;
        this.camera = scene.camera;
        this.renderer = scene.renderer;
        this.time = scene.time;
        // Instantiate planetaryRenderer only when scene is available
        if (this.scene) {
            this.planetaryRenderer = new PlanetaryRenderer(this.scene);
        }
    }

    async init() {
        const funcName = 'AdvancedPhysicsEngine.init';
        Logger.start(funcName);

        // Initialize PhysX WASM
        await this.physx.init();
        console.log("%c >>> PHYSICS ENGINE: PHYSX 5 <<<", "color: gold; font-weight: bold; background: black; padding: 10px; border: 2px solid gold; border-radius: 5px;");

        if (this.renderer) {
            this.renderer.setPixelRatio(1);
            this.renderer.setSize(window.innerWidth, window.innerHeight);

            // Ensure Canvas Visibility (CSS Fix)
            if (this.renderer.domElement) {
                this.renderer.domElement.style.position = 'absolute';
                this.renderer.domElement.style.top = '0';
                this.renderer.domElement.style.left = '0';
                this.renderer.domElement.style.width = '100%';
                this.renderer.domElement.style.height = '100%';
                this.renderer.domElement.style.zIndex = '1';
            }
        }
        Logger.end(funcName);
    }

    async create() {
        const funcName = 'AdvancedPhysicsEngine.create';
        Logger.start(funcName);
        // setup scene (light, ground, grid, sky, orbitControls)
        if (this.sceneContext && this.sceneContext.warpSpeed) {
            this.sceneContext.warpSpeed('-ground', '-orbitControls');
        }

        // Add robust lighting (mirroring BasicPhysicsEngine for consistency)
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(10, 50, 20);
        this.scene.add(dirLight);

        // Physics Material: Low friction, low restitution (bounciness)
        // This is shared between the ship and the wormhole to ensure smooth sliding.
        const slipperyMaterial = this.physx.createMaterial(0.5, 0.5, 0.0);

        // Create a physics body for the ship using PhysX
        // Use a Capsule for a smooth collider that won't snag on the wormhole's triangle mesh.
        // Dimensions: radius: 0.75, length of cylinder part: 2.5 -> total length 4.
        const shipGeometry = new THREE.CapsuleGeometry(0.75, 2.5, 8, 16);
        const shipMesh = new THREE.Mesh(shipGeometry, new THREE.MeshPhongMaterial({ color: 0xff0000, wireframe: true }));
        shipMesh.position.set(0, 10, 0); // Start higher
        this.scene.add(shipMesh);

        const shipBody = this.physx.addCapsule(shipMesh, 1, slipperyMaterial);
        this.playerShip.physicsBody = shipMesh;
        this.playerShip.pxBody = shipBody;

        // Add a small light to the ship so we can see it
        const shipLight = new THREE.PointLight(0xffffff, 2, 20);
        shipMesh.add(shipLight);

        // Add the shield
        this.createShield(slipperyMaterial);

        // Add the wormhole
        this.createWormhole(slipperyMaterial);

        this.initKeys();

        this.setupEnvironment();
        Logger.end(funcName);
    }

    createShield(material) {
        const funcName = 'AdvancedPhysicsEngine.createShield';
        Logger.start(funcName);

        try {
            // The visual representation of the shield
            const shieldGeometry = new THREE.SphereGeometry(2, 16, 16); // Reduced segments for performance
            const shieldMaterial = new THREE.MeshPhongMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.3,
                wireframe: true
            });

            this.shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
            this.scene.add(this.shield);

            const shieldComponent = this.engine.playerShip.components.find(c => c.definition.hasTrait(ComponentDefs.TASKS.SHIELD));

            let softBodyOptions = {
                mass: 0.5,
                stiffness: 50.0,
                damping: 0.2,
                stretchStiffness: 100.0,
            };

            if (shieldComponent && shieldComponent.definition.hyperphysics_interactions) {
                softBodyOptions = shieldComponent.definition.hyperphysics_interactions;
                Logger.message("Found shield component properties:", softBodyOptions);
            } else {
                Logger.message("No shield component properties found, using defaults.");
            }

            // Create the soft body representation in PhysX
            const shieldBody = this.physx.addSoftBody(this.shield, softBodyOptions);

            if (shieldBody) {
                this.shield.userData.physicsBody = shieldBody;
                Logger.message("Soft body shield created successfully.");
            } else {
                Logger.error("Failed to create soft body shield. Falling back to rigid body.");
                // Fallback to a rigid body if soft body creation fails
                const rigidShieldBody = this.physx.addBox(this.shield, 0.5, material);
                this.shield.userData.physicsBody = rigidShieldBody;
            }

        } catch (error) {
            Logger.message(`ERROR in createShield: ${error.message}`);
        }
        Logger.end(funcName);
    }

    createWormhole(material) {
        const funcName = 'AdvancedPhysicsEngine.createWormhole';
        Logger.start(funcName);

        try {
            const raceLength = 5000;
            const wormholeGeometry = new THREE.CylinderGeometry(40, 40, raceLength, 64, 500, true);
            wormholeGeometry.rotateX(-Math.PI / 2); // Bake rotation
            wormholeGeometry.translate(0, 0, raceLength / 2);

            const wormholeMaterial = new THREE.ShaderMaterial({
                uniforms: THREE.UniformsUtils.clone(WormholeShader.uniforms),
                vertexShader: WormholeShader.vertexShader,
                fragmentShader: WormholeShader.fragmentShader,
                transparent: true,
                side: THREE.DoubleSide
            });
            wormholeMaterial.uniforms.u_noiseStrength.value = 0.5;

            this.wormhole = new THREE.Mesh(wormholeGeometry, wormholeMaterial);
            this.scene.add(this.wormhole);

            // Static wormhole body for collisions
            // Use the newly added addTriMesh method to create a collider from the visual mesh
            this.wormhole.userData.physicsBody = this.physx.addTriMesh(this.wormhole, material);
            Logger.message("Wormhole mesh created visually, and PhysX triangle mesh collider added.");
        } catch (error) {
            Logger.message(`ERROR in createWormhole: ${error.message}`);
        }
        Logger.end(funcName);
    }

    initKeys() {
        const funcName = 'AdvancedPhysicsEngine.initKeys';
        Logger.start(funcName);

        // Try to get input from scene context
        const input = this.sceneContext ? this.sceneContext.input : null;
        const keyboard = input ? input.keyboard : null;

        if (!keyboard) {
            Logger.message("WARN: Input or Keyboard manager not found in scene context. Controls may not work.");
            // We set it to a dummy object so the game doesn't crash on this.keys[k]
            this.keys = {
                w: { isDown: false },
                a: { isDown: false },
                s: { isDown: false },
                d: { isDown: false },
                space: { isDown: false },
                q: { isDown: false },
            };
            this._keysInitialized = false;
            Logger.end(funcName);
            return;
        }

        this.keys = keyboard.createCursorKeys();
        this.keys.w = keyboard.addKey('W');
        this.keys.a = keyboard.addKey('A');
        this.keys.s = keyboard.addKey('S');
        this.keys.d = keyboard.addKey('D');
        this.keys.space = keyboard.addKey('SPACE');
        this.keys.q = keyboard.addKey('Q');
        this._keysInitialized = true;
        Logger.end(funcName);
    }

    applyThrust() {
        if (!this.playerShip || !this.playerShip.physicsBody) return;

        const thrust = 15.0; // Increased base thrust
        const forward = new THREE.Vector3(0, 0, thrust);
        forward.applyQuaternion(this.playerShip.physicsBody.quaternion);

        this.physx.applyForce(this.playerShip.physicsBody, forward);
    }

    applySteering(sideForce) {
        if (!this.playerShip || !this.playerShip.physicsBody) return;

        // Apply a side force for steering
        const force = new THREE.Vector3(sideForce, 0, 0);
        force.applyQuaternion(this.playerShip.physicsBody.quaternion);
        this.physx.applyForce(this.playerShip.physicsBody, force);

        // Apply a small torque to bank the ship
        const torque = new THREE.Vector3(0, 0, -sideForce * 0.2);
        // We'll need to add applyTorque to PhysXProvider
        const entry = this.physx.bodies.get(this.playerShip.physicsBody);
        if (entry && !entry.isStatic) {
            entry.body.addTorque({ x: torque.x, y: torque.y, z: torque.z }, this.physx.physx.PxForceMode.eFORCE);
        }
    }

    applyRoll(rollForce) {
        console.log(`Applying Roll. Force: ${rollForce}`);
        if (!this.playerShip || !this.playerShip.physicsBody) return;

        const entry = this.physx.bodies.get(this.playerShip.physicsBody);
        if (entry && !entry.isStatic) {
            // Apply torque around the ship's local Z-axis (forward axis)
            const localTorque = new THREE.Vector3(0, 0, rollForce);
            const worldTorque = localTorque.applyQuaternion(this.playerShip.physicsBody.quaternion);
            entry.body.addTorque({ x: worldTorque.x, y: worldTorque.y, z: worldTorque.z }, this.physx.physx.PxForceMode.eFORCE);
        }
    }

    updateCamera() {
        if (!this.playerShip || !this.playerShip.physicsBody || !this.camera) return;

        const mesh = this.playerShip.physicsBody;
        const shipPos = mesh.position;

        // Check if we are in a racing environment
        const isRacing = this.engine.activeEnvironment instanceof WormholeEnvironment;

        if (!isRacing) {
            // Auto-rotation mode for Shipyard / Loading screen
            const time = Date.now() * 0.0005;
            const dist = 25;
            this.camera.position.x = shipPos.x + Math.sin(time) * dist;
            this.camera.position.z = shipPos.z + Math.cos(time) * dist;
            this.camera.position.y = shipPos.y + 10;
            this.camera.lookAt(shipPos);
            return;
        }

        // 1. Unified Wormhole Camera Geometry
        // Based on user spec: Variable radius from center (1/4 of total radius), locked behind and ABOVE.
        // For now, base radius is 40. In the future, this can be dynamic.
        const wormholeRadius = 40.0;
        const cameraRadius = wormholeRadius * 0.25;
        const camZOffset = 25.0; // Distance behind

        // Use ship's current angular position for camera placement
        const theta = Math.atan2(shipPos.y, shipPos.x);

        // Target Camera Position: Fixed radius 10, same theta as ship, but behind in Z
        const targetCamPos = new THREE.Vector3(
            Math.cos(theta) * cameraRadius,
            Math.sin(theta) * cameraRadius,
            shipPos.z - camZOffset
        );

        // 2. Direct Z Tracking & Radial Interpolation
        if (this.camera.far < 10000) {
            this.camera.far = 10000;
            this.camera.updateProjectionMatrix();
        }

        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamPos.z, 0.8);
        this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamPos.x, 0.1);
        this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamPos.y, 0.1);

        // 3. Dynamic Look-At
        // We look at a target ahead of the ship in its direction.
        const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.quaternion);
        const lookTarget = shipPos.clone().add(direction.multiplyScalar(20));
        this.camera.lookAt(lookTarget);

        // 4. Stabilized UP Vector
        // Points towards the center of the wormhole (Inward)
        const targetUp = new THREE.Vector3(-Math.cos(theta), -Math.sin(theta), 0).normalize();

        // Stabilize up vector to prevent the 90-degree bounce
        if (targetUp.lengthSq() > 0.1) {
            this.camera.up.lerp(targetUp, 0.1);
        }
    }

    setupEnvironment() {
        const funcName = 'AdvancedPhysicsEngine.setupEnvironment';
        Logger.start(funcName);

        if (this.engine.activeEnvironment instanceof PlanetSurfaceEnvironment) {
            this.physx.setGravity('central', 9.81, { x: 0, y: 0, z: 0 });
            if (this.wormhole) this.wormhole.visible = false;
            if (this.shield) this.shield.visible = false;

            // --- NEW: Add terrain collider for PlanetSurfaceEnvironment ---
            if (!this.planetGroundCollider) { // Ensure it's added only once
                // Create a placeholder ground mesh. In a full implementation, this would come from PlanetSurfaceGenerator.
                const groundSize = 5000; // Large enough plane
                const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 10, 10);
                groundGeometry.rotateX(-Math.PI / 2); // Rotate to lie flat (Y-up is standard)
                // An invisible mesh is sufficient for collision detection
                const groundMesh = new THREE.Mesh(groundGeometry, new THREE.MeshBasicMaterial({ visible: false }));
                groundMesh.position.set(0, 0, 0); // Position at y=0, assumed ground level
                this.scene.add(groundMesh); // Add to Three.js scene (though invisible)

                this.planetGroundCollider = this.physx.addTriMesh(groundMesh);
                Logger.message("Added static terrain collider for PlanetSurfaceEnvironment.");
            }
            // --- END NEW ---

        } else if (this.engine.activeEnvironment instanceof WormholeEnvironment) {
            this.physx.setGravity('radial', 1.0, { x: 0, y: 0, z: 0 });
            if (this.wormhole) this.wormhole.visible = true;
            if (this.shield) this.shield.visible = true;
            // If switching from planet environment, remove/deactivate the ground collider
            if (this.planetGroundCollider) {
                // For a proper cleanup, would need to remove the actor from the PhysX scene
                // this.physx.removeActor(this.planetGroundCollider.physxBody); // Assuming such a method exists
                this.planetGroundCollider = null; // Mark for re-creation if re-entering planet environment
            }
        } else {
            this.physx.setGravity('none');
            // If switching from planet environment, remove/deactivate the ground collider
            if (this.planetGroundCollider) {
                // this.physx.removeActor(this.planetGroundCollider.physxBody);
                this.planetGroundCollider = null;
            }
        }
        Logger.end(funcName);
    }

    handleShieldInteraction(ship, environment) {
        const funcName = 'AdvancedPhysicsEngine.handleShieldInteraction';
        Logger.start(funcName);

        const shipBaseFrequency = ship.currentTuning ? ship.currentTuning.frequency : 440;
        const progress = (ship.physicsBody.position.z / environment.length);
        const currentChord = environment.getCurrentChord(progress);
        const targetNote = environment.getNoteFromChord(currentChord);
        const targetFrequency = this.getFrequencyForNote(targetNote, environment.song.key);
        const rollSemitoneOffset = (ship.physics.rollAngle / (2 * Math.PI)) * 12;
        const shipEffectiveFrequency = shipBaseFrequency * Math.pow(2, rollSemitoneOffset / 12);
        const harmonyFactor = this.calculateHarmonyFactor(shipEffectiveFrequency, targetFrequency);
        Logger.logVariables({ harmonyFactor });
        ship.physics.harmonyFactor = harmonyFactor;
        const maxBoost = 50;
        const boostMagnitude = maxBoost * harmonyFactor;
        const mesh = ship.physicsBody;

        const boostForce = new THREE.Vector3(0, 0, boostMagnitude);
        boostForce.applyQuaternion(mesh.quaternion);
        this.physx.applyForce(mesh, boostForce);

        Logger.end(funcName);
    }

    calculateHarmonyFactor(freq1, freq2) {
        const funcName = 'AdvancedPhysicsEngine.calculateHarmonyFactor';
        Logger.start(funcName);

        const ratio = Math.max(freq1, freq2) / Math.min(freq1, freq2);
        const perfectRatios = [
            { ratio: 1, quality: 1.0 },
            { ratio: 2, quality: 1.0 },
            { ratio: 1.5, quality: 0.9 },
            { ratio: 1.333, quality: 0.8 }
        ];
        let bestQuality = 0;
        const tolerance = 0.05;
        for (const pRatio of perfectRatios) {
            if (Math.abs(ratio - pRatio.ratio) < tolerance || Math.abs(ratio - (1 / pRatio.ratio)) < tolerance) {
                if (Math.abs((ratio / 2) - pRatio.ratio) < tolerance || Math.abs(ratio - (pRatio.ratio * 2)) < tolerance) {
                    bestQuality = Math.max(bestQuality, pRatio.quality);
                }
            }
        }
        Logger.end(funcName, bestQuality);
        return bestQuality;
    }

    getFrequencyForNote(noteName, key) {
        const funcName = 'AdvancedPhysicsEngine.getFrequencyForNote';
        Logger.start(funcName);

        const noteOffsets = { 'A': 0, 'A#': 1, 'B': 2, 'C': 3, 'C#': 4, 'D': 5, 'D#': 6, 'E': 7, 'F': 8, 'F#': 9, 'G': 10, 'G#': 11 };
        const baseFrequency = 440;
        const targetNote = noteName.substring(0, noteName.length > 1 && (noteName[1] === '#' || noteName[1] === 'b') ? 2 : 1);
        const targetOffset = noteOffsets[targetNote];
        const keyNote = key.substring(0, key.length > 1 && (key[1] === '#' || key[1] === 'b') ? 2 : 1);
        const keyOffset = noteOffsets[keyNote];
        let semitonesFromA4 = targetOffset - keyOffset;
        const frequency = baseFrequency * Math.pow(2, semitonesFromA4 / 12);
        Logger.end(funcName, frequency);
        return frequency;
    }

    update(time, delta) {
        const funcName = 'AdvancedPhysicsEngine.update';
        Logger.start(funcName);
        if (!this._keysInitialized) {
            this.initKeys();
        }

        if (this.keys.w.isDown) {
            this.applyThrust();
        }
        if (this.keys.a.isDown) {
            this.applyRoll(50.0); // Apply roll to the left
        }
        if (this.keys.d.isDown) {
            this.applyRoll(-50.0); // Apply roll to the right
        }

        // Mouse Steering (Nose Pointing) - Applying side forces
        const mouseDeltas = Controls.consumeMouseMovement();
        if (mouseDeltas.x !== 0) {
            this.applySteering(mouseDeltas.x * 0.1);
        }

        // Camera Update
        this.updateCamera();

        if (this.engine.activeEnvironment && !(this.engine.activeEnvironment instanceof PlanetSurfaceEnvironment)) {
            this.handleShieldInteraction(this.playerShip, this.engine.activeEnvironment);
        }

        if (this.wormhole) {
            // Update shader uniforms
            this.wormhole.material.uniforms.u_time.value = time / 1000;
        }

        // Update Ship Shader Time (for Voronoi animation)
        if (this.engine.playerShip && this.engine.playerShip.mesh) {
            this.engine.playerShip.mesh.traverse((child) => {
                if (child.isMesh && child.material.uniforms && child.material.uniforms.time) {
                    child.material.uniforms.time.value = time / 1000;
                }
            });
        }

        // Step PhysX simulation (convert delta to seconds)
        this.physx.update(delta / 1000);

        Logger.end(funcName);
    }
}
