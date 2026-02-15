import * as THREE from 'three';
import { VectorMaths } from '/src/t13ne/utils/VectorMaths.js';
import { ComponentDefs } from '/src/t13ne/procgen/ships/components/ComponentDefs.js';
import { PlanetSurfaceEnvironment } from '/src/t13ne/procgen/planet/PlanetSurfaceEnvironment.js';
import { WormholeShader } from '/src/t13ne/rendering/WormholeShader.js';
import { PlanetaryRenderer } from '/src/t13ne/rendering/PlanetaryRenderer.js';
import { Controls } from '/src/t13ne/core/Controls.js';
import Logger from '/src/t13ne/core/Logger.js';
import { HUD } from '/src/t13ne/core/ui/components/HUD.js';

export class BasicPhysicsEngine {
    constructor(gameEngine) {
        const funcName = 'BasicPhysicsEngine.constructor';
        Logger.start(funcName);
        this.engine = gameEngine;
        this.playerShip = null;
        this.wormholeMesh = null;
        this.shieldMesh = null;
        this.scene = null;
        this.physics = null;
        this.camera = null;
        this.input = null;
        this.renderer = null;
        this.planetaryRenderer = null;

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
        this.input = scene.input;
        this.renderer = scene.renderer;
        this.time = scene.time;
        this.planetaryRenderer = new PlanetaryRenderer(this.scene);
    }

    async init() {
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    async create() {
        const funcName = 'BasicPhysicsEngine.create';
        Logger.start(funcName);

        // 0. Manual Scene Setup
        // Add robust lighting to ensure visibility even if shader fails
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0); // Increased intensity
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(10, 50, 20);
        this.scene.add(dirLight);

        // 1. Setup Player Ship Visuals
        this.playerShip = this.engine.playerShip;
        if (this.playerShip) {
            const geometry = new THREE.BoxGeometry(2, 1, 4);
            const material = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Metallic Red
            this.playerShip.mesh = new THREE.Mesh(geometry, material);

            // Add a "nose" to indicate facing
            const noseGeo = new THREE.ConeGeometry(0.5, 1, 4);
            noseGeo.rotateX(Math.PI / 2);
            noseGeo.translate(0, 0, 2);
            const noseMesh = new THREE.Mesh(noseGeo, new THREE.MeshPhongMaterial({ color: 0xffffff }));
            this.playerShip.mesh.add(noseMesh);

            this.scene.add(this.playerShip.mesh);
        }

        // 2. Setup Shield Visuals
        const shieldGeo = new THREE.SphereGeometry(3, 32, 32);
        const shieldMat = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        this.scene.add(this.shieldMesh);

        // 3. Setup Wormhole Visuals
        // INCREASED RESOLUTION: 32 -> 128 radial, 10 -> 200 height to prevent vertex swimming
        // INCREASED RADIUS: 40, and LENGTH: 5000 for sense of depth
        const raceLength = 5000;
        const wormholeGeometry = new THREE.CylinderGeometry(40, 40, raceLength, 128, 500, true);
        wormholeGeometry.rotateX(-Math.PI / 2);

        // Centering the tunnel so it starts at Z=0 and goes forward
        wormholeGeometry.translate(0, 0, raceLength / 2);

        // Use the Shader Material (Blue Plasma)
        const wormholeMaterial = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.clone(WormholeShader.uniforms),
            vertexShader: WormholeShader.vertexShader,
            fragmentShader: WormholeShader.fragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        });
        wormholeMaterial.uniforms.u_freqs.value = new THREE.Vector4(300, 400, 150, 250);
        wormholeMaterial.uniforms.u_env1.value = new THREE.Vector4(15, 0.2, 600.0, 0.05);
        wormholeMaterial.uniforms.u_noiseStrength.value = 0.5; // Restored visible noise

        this.wormholeMesh = new THREE.Mesh(wormholeGeometry, wormholeMaterial);
        this.scene.add(this.wormholeMesh);

        // 4. Initialize HUD
        this.hud = new HUD();
        if (this.sceneContext && this.sceneContext.viewManager) {
            this.sceneContext.viewManager.setHUD(this.hud.element);
        }

        this.initKeys();
        this.setupEnvironment();

        // 4. Force Initial Camera Position
        if (this.camera) {
            this.camera.position.set(0, 5, -15);
            this.camera.lookAt(0, 0, 10);
        }

        // 5. Ensure Canvas Visibility (CSS Fix)
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.style.position = 'absolute';
            this.renderer.domElement.style.top = '0';
            this.renderer.domElement.style.left = '0';
            this.renderer.domElement.style.width = '100%';
            this.renderer.domElement.style.height = '100%';
            this.renderer.domElement.style.zIndex = '1';
        }

        Logger.end(funcName);
    }

    setupEnvironment() {
        const funcName = 'BasicPhysicsEngine.setupEnvironment';
        Logger.start(funcName);

        // Update planetary renderer reference if scene wasn't ready in constructor
        if (this.planetaryRenderer && !this.planetaryRenderer.scene) {
            this.planetaryRenderer.scene = this.scene;
        }

        if (this.engine.activeEnvironment instanceof PlanetSurfaceEnvironment) {
            // Planet Mode
            if (this.wormholeMesh) this.wormholeMesh.visible = false;
            if (this.shieldMesh) this.shieldMesh.visible = false;
            // Ensure gravity is down
            // this.physics.setGravity(0, -9.81, 0); // Logic only, no physics engine
        } else {
            // Wormhole Mode
            if (this.wormholeMesh) this.wormholeMesh.visible = true;
            if (this.shieldMesh) this.shieldMesh.visible = true;
            // Ensure 0 gravity
        }
        Logger.end(funcName);
    }

    initKeys() {
        this.keys = {
            w: { isDown: false },
            a: { isDown: false },
            s: { isDown: false },
            d: { isDown: false },
            space: { isDown: false },
            q: { isDown: false },
        };

        const onKey = (key, isDown) => {
            let k = key.toLowerCase();
            if (k === ' ') k = 'space';
            if (this.keys[k]) this.keys[k].isDown = isDown;
        };

        window.addEventListener('keydown', (e) => onKey(e.key, true));
        window.addEventListener('keyup', (e) => onKey(e.key, false));
    }

    // --- Core physics logic ---
    update(time, delta) {
        const funcName = 'BasicPhysicsEngine.update';
        Logger.start(funcName);
        this.events.emit('preupdate', time, delta);

        const ship = this.engine.playerShip;
        const environment = this.engine.activeEnvironment;
        const deltaTime = delta / 1000;

        if (!ship || !environment) return;

        if (!ship.physics) ship.physics = {};

        // Ensure all required physics properties exist
        if (!ship.physics.position) ship.physics.position = { x: 0, y: 0, z: 0 };
        if (!ship.physics.velocity) ship.physics.velocity = { x: 0, y: 0, z: 0 };
        if (!ship.physics.direction) ship.physics.direction = { x: 0, y: 0, z: 1 };
        if (!ship.physics.angularVelocity) ship.physics.angularVelocity = { x: 0, y: 0, z: 0 };
        if (ship.physics.rollAngle === undefined) ship.physics.rollAngle = 0;
        if (ship.physics.harmonyFactor === undefined) ship.physics.harmonyFactor = 0;
        if (ship.physics.mass === undefined) ship.physics.mass = 1;

        // Initialize Polar Coordinates if missing
        if (ship.physics.theta === undefined) {
            // Calculate theta from existing position if possible
            const radius = Math.sqrt(ship.physics.position.x ** 2 + ship.physics.position.y ** 2);
            ship.physics.theta = Math.atan2(ship.physics.position.y, ship.physics.position.x);
            ship.physics.radius = radius || 38; // Default to near wall
        }

        if (environment instanceof PlanetSurfaceEnvironment) {
            this.updatePlanetSurface(deltaTime, ship, environment);
        } else {
            this.updateWormhole(deltaTime, ship, environment);
        }

        this.updateVisuals(time);
        this.updateCamera();

        // Update HUD
        if (this.hud) {
            const speed = Math.sqrt(ship.physics.velocity.x ** 2 + ship.physics.velocity.y ** 2 + ship.physics.velocity.z ** 2);
            const shieldIntegrity = ship.shieldIntegrity || 100;
            const shipFreq = ship.physics.effectiveFrequency || 440;
            const targetFreq = ship.physics.targetFrequency || 440;
            const harmony = ship.physics.harmonyFactor || 0;

            this.hud.update(speed, shieldIntegrity, shipFreq, targetFreq, harmony);
        }
        // Logger.end(funcName);
    }

    updateVisuals(time) {
        const ship = this.engine.playerShip;
        if (!ship || !ship.mesh || !ship.physics) return;

        // 1. Sync Ship Position
        ship.mesh.position.set(
            ship.physics.position.x,
            ship.physics.position.y,
            ship.physics.position.z
        );

        // 2. Mouse Steering (Nose Pointing)
        const mouseDeltas = Controls.consumeMouseMovement();
        if (mouseDeltas.x !== 0 || mouseDeltas.y !== 0) {
            const sensitivity = 0.002;
            ship.physics.direction.x += mouseDeltas.x * sensitivity;
            ship.physics.direction.y -= mouseDeltas.y * sensitivity;

            // Clamp direction to reasonable forward-ish cone
            ship.physics.direction.x = Math.max(-0.5, Math.min(0.5, ship.physics.direction.x));
            ship.physics.direction.y = Math.max(-0.5, Math.min(0.5, ship.physics.direction.y));
            ship.physics.direction.z = 1.0;

            // Normalize
            const len = Math.sqrt(ship.physics.direction.x ** 2 + ship.physics.direction.y ** 2 + ship.physics.direction.z ** 2);
            ship.physics.direction.x /= len;
            ship.physics.direction.y /= len;
            ship.physics.direction.z /= len;
        }

        // 3. Update Ship Mesh Rotation
        // Look at the direction vector offset from current position
        ship.mesh.lookAt(
            ship.physics.position.x + ship.physics.direction.x,
            ship.physics.position.y + ship.physics.direction.y,
            ship.physics.position.z + ship.physics.direction.z
        );
        // Apply the roll based on theta (polar steering/rolling)
        ship.mesh.rotateZ(ship.physics.theta || 0);

        // 4. Sync Shield Mesh
        if (this.shieldMesh) {
            this.shieldMesh.position.copy(ship.mesh.position);

            if (ship.physics.isSlidingVisual) {
                // FLATTEN: Scale along radial axis
                this.shieldMesh.rotation.set(0, 0, ship.physics.theta || 0);
                this.shieldMesh.scale.set(1.4, 0.4, 1.4);
            } else {
                // NORMAL: Spherical
                this.shieldMesh.rotation.set(0, 0, 0);
                this.shieldMesh.scale.set(1, 1, 1);
            }
        }

        // 5. Sync Wormhole Material Time and Position
        if (this.wormholeMesh && this.wormholeMesh.visible) {
            this.wormholeMesh.material.uniforms.u_time.value = time * 0.001;
            // Keep wormhole centered on ship's Z block
            this.wormholeMesh.position.z = ship.physics.position.z;
        }

        // 6. Update Engine Glows
        if (ship.mesh) {
            const isThrusting = Controls.isPressed(this.keys, 'flight_air', 'THRUST') || this.keys.w.isDown;
            ship.mesh.traverse((child) => {
                if (child.name === "engine_glow" && child.material) {
                    if (isThrusting) {
                        child.material.color.setHex(0x00ffff); // Cyan boost
                        child.material.opacity = 1.0;
                        child.scale.setScalar(1.2 + Math.random() * 0.2); // Flicker
                    } else {
                        child.material.color.setHex(0x0033aa); // Dim blue
                        child.material.opacity = 0.5;
                        child.scale.setScalar(1.0);
                    }
                    // Ensure material update if needed (though basic material usually updates)
                    child.material.needsUpdate = true;
                }
            });
        }
    }

    updateCamera() {
        if (!this.engine.playerShip || !this.camera) return;

        const ship = this.engine.playerShip;
        const shipPos = new THREE.Vector3(ship.physics.position.x, ship.physics.position.y, ship.physics.position.z);

        // 1. Unified Wormhole Camera Geometry
        // Based on user spec: Variable radius from center (1/4 of total radius), locked behind and ABOVE.
        const wormholeRadius = ship.physics.currentWormholeRadius || 40.0;
        const cameraRadius = wormholeRadius * 0.25;
        const camZOffset = 25.0; // Distance behind

        // Use ship's current angular position for camera placement
        const theta = Math.atan2(shipPos.y, shipPos.x);

        // Target Camera Position: Fixed radius 10, locked to ship's theta, but behind in Z
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

        // To prevent "falling back" at high speeds, we track Z more aggressively
        // while smoothing the radial/angular transition.
        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamPos.z, 0.8);
        this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamPos.x, 0.1);
        this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamPos.y, 0.1);

        // 3. Dynamic Look-At
        // User wants to move by pointing ship's yaw/pitch.
        // We look at a target ahead of the ship in its direction.
        const direction = new THREE.Vector3(
            ship.physics.direction.x || 0,
            ship.physics.direction.y || 0,
            ship.physics.direction.z || 1
        ).normalize();

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

    updateWormhole(deltaTime, ship, environment) {
        const funcName = 'BasicPhysicsEngine.updateWormhole';

        // 0. Update state
        ship.physics.theta = Math.atan2(ship.physics.position.y, ship.physics.position.x);
        const currentRadius = Math.sqrt(ship.physics.position.x ** 2 + ship.physics.position.y ** 2);
        const radialDir = { x: Math.cos(ship.physics.theta), y: Math.sin(ship.physics.theta) };
        const tangentDir = { x: -Math.sin(ship.physics.theta), y: Math.cos(ship.physics.theta) };

        // --- CONTEXT DETECTION ---
        const baseRadius = 40;
        let noiseVal = 0;
        let noiseStrength = 0;
        if (this.wormholeMesh) {
            const uniforms = this.wormholeMesh.material.uniforms;
            const noiseLookupPos = { x: radialDir.x * baseRadius, y: radialDir.y * baseRadius, z: 0 };
            noiseStrength = uniforms.u_noiseStrength.value;
            noiseVal = this.noise12D(noiseLookupPos, uniforms.u_time.value, uniforms.u_freqs.value, uniforms.u_env1.value);
        }
        const dynamicMaxRadius = baseRadius * (1.0 + noiseVal * noiseStrength);
        ship.physics.currentWormholeRadius = dynamicMaxRadius;
        const safeRadius = dynamicMaxRadius - 2.5;
        const isOnWall = currentRadius > (safeRadius - 1.0);
        const isSpaceHeld = Controls.isPressed(this.keys, 'rolling_mode', 'SLIDE') || Controls.isPressed(this.keys, 'sliding_mode', 'JUMP');
        const isSliding = isOnWall && isSpaceHeld;

        // Initialize state for jump cancel tracking if not present
        if (ship.physics.lastJumpTime === undefined) ship.physics.lastJumpTime = 0;
        if (ship.physics.wasSpaceHeld === undefined) ship.physics.wasSpaceHeld = false;

        let totalAcceleration = { x: 0, y: 0, z: 0 };
        let currentFriction = 0.995; // Global velocity dampening to reduce floatiness

        // --- JUMP CANCEL BOOST LOGIC ---
        // "Can be jump cancelled to create a slight speed boost. There should be an ideal speed... where you can generate good acceleration by pulsing the shield slide and jump cancel."
        const currentTime = Date.now();
        if (isSpaceHeld && !ship.physics.wasSpaceHeld) {
            // Space was JUST pressed (Sliding started)
            const timeSinceLastJump = currentTime - ship.physics.lastJumpTime;
            if (timeSinceLastJump < 300) { // 300ms window for "Pulse" boost
                const boostMag = 50.0;
                ship.physics.velocity.z += boostMag;
                Logger.message("PULSE BOOST! Jump Cancel acceleration applied.");
            }
        }
        ship.physics.wasSpaceHeld = isSpaceHeld;

        if (isSliding) {
            // --- SLIDING MODE ---
            const slideSteerForce = 50.0;
            if (Controls.isPressed(this.keys, 'sliding_mode', 'STEER_LEFT')) {
                totalAcceleration.x += tangentDir.x * slideSteerForce / ship.physics.mass;
                totalAcceleration.y += tangentDir.y * slideSteerForce / ship.physics.mass;
            }
            if (Controls.isPressed(this.keys, 'sliding_mode', 'STEER_RIGHT')) {
                totalAcceleration.x -= tangentDir.x * slideSteerForce / ship.physics.mass;
                totalAcceleration.y -= tangentDir.y * slideSteerForce / ship.physics.mass;
            }

            ship.physics.isSlidingVisual = true;
            ship.physics.isChargingJump = true;

            const pressForce = 60.0;
            totalAcceleration.x += radialDir.x * pressForce / ship.physics.mass;
            totalAcceleration.y += radialDir.y * pressForce / ship.physics.mass;

            currentFriction = 0.995;

        } else if (isOnWall) {
            // --- ROLLING MODE ---
            if (Controls.isPressed(this.keys, 'rolling_mode', 'ACCEL_ROLL')) {
                const rollAccel = 250.0;
                totalAcceleration.z += rollAccel / ship.physics.mass;
                ship.physics.angularVelocity.z += 10.0 * deltaTime;
            }

            const rollSteerForceMag = 200.0;
            if (Controls.isPressed(this.keys, 'rolling_mode', 'STEER_LEFT')) {
                totalAcceleration.x += tangentDir.x * rollSteerForceMag / ship.physics.mass;
                totalAcceleration.y += tangentDir.y * rollSteerForceMag / ship.physics.mass;
            }
            if (Controls.isPressed(this.keys, 'rolling_mode', 'STEER_RIGHT')) {
                totalAcceleration.x -= tangentDir.x * rollSteerForceMag / ship.physics.mass;
                totalAcceleration.y -= tangentDir.y * rollSteerForceMag / ship.physics.mass;
            }

            if (ship.physics.isChargingJump) {
                ship.physics.velocity.x -= radialDir.x * 50.0;
                ship.physics.velocity.y -= radialDir.y * 50.0;
                ship.physics.isChargingJump = false;
                ship.physics.lastJumpTime = Date.now(); // Track for Jump Cancel
            }

            ship.physics.isSlidingVisual = false;

            const gravityMag = 25.0;
            totalAcceleration.x += radialDir.x * gravityMag / ship.physics.mass;
            totalAcceleration.y += radialDir.y * gravityMag / ship.physics.mass;

            currentFriction = 0.97;

        } else {
            // --- FLIGHT MODE (Air) ---
            const baseThrust = 50.0; // Small base forward motion
            totalAcceleration.z += baseThrust / ship.physics.mass;

            if (Controls.isPressed(this.keys, 'flight_air', 'THRUST')) {
                const thrustMag = 180.0;
                totalAcceleration.z += thrustMag / ship.physics.mass;
            }

            const strafeForce = 100.0;
            if (Controls.isPressed(this.keys, 'flight_air', 'STEER_LEFT')) {
                totalAcceleration.x += tangentDir.x * strafeForce / ship.physics.mass;
                totalAcceleration.y += tangentDir.y * strafeForce / ship.physics.mass;
            }
            if (Controls.isPressed(this.keys, 'flight_air', 'STEER_RIGHT')) {
                totalAcceleration.x -= tangentDir.x * strafeForce / ship.physics.mass;
                totalAcceleration.y -= tangentDir.y * strafeForce / ship.physics.mass;
            }

            // --- CENTRAL REPULSION (Dark Energy Beam) ---
            const beamRepulsionK = 2000.0;
            const beamWidth = 2.0;
            const repulsionMag = beamRepulsionK / ((currentRadius + beamWidth) ** 2);
            totalAcceleration.x += radialDir.x * repulsionMag / ship.physics.mass;
            totalAcceleration.y += radialDir.y * repulsionMag / ship.physics.mass;

            ship.physics.isSlidingVisual = false;
            ship.physics.isChargingJump = false;
        }

        // Apply Movement
        this.integrateMovement(ship, totalAcceleration, deltaTime);

        // --- WALL COLLISION & CRASH DETECTION ---
        if (currentRadius > safeRadius) {
            const scale = safeRadius / currentRadius;
            ship.physics.position.x *= scale;
            ship.physics.position.y *= scale;

            const radialSpeed = ship.physics.velocity.x * (ship.physics.position.x / safeRadius) + ship.physics.velocity.y * (ship.physics.position.y / safeRadius);
            const totalSpeed = Math.sqrt(ship.physics.velocity.x ** 2 + ship.physics.velocity.y ** 2 + ship.physics.velocity.z ** 2);

            // Crash Logic
            const CRASH_SPEED_THRESHOLD = 500.0;
            const IMPACT_ANGLE_THRESHOLD = 80.0;

            if (totalSpeed > CRASH_SPEED_THRESHOLD || radialSpeed > IMPACT_ANGLE_THRESHOLD) {
                Logger.message(`CRASH! Speed: ${Math.round(totalSpeed)}, Impact: ${Math.round(radialSpeed)}. Dropping out of race.`);
                if (this.gameEngine && typeof this.gameEngine.returnToSolarSystem === 'function') {
                    this.gameEngine.returnToSolarSystem();
                    return;
                }
            }

            if (radialSpeed > 0) {
                // If sliding, we "stick" more (coefficient < 1.0 means we lose energy and stay on wall)
                const bounce = isSliding ? 0.98 : 1.05;
                ship.physics.velocity.x -= (ship.physics.position.x / safeRadius) * radialSpeed * bounce;
                ship.physics.velocity.y -= (ship.physics.position.y / safeRadius) * radialSpeed * bounce;
            }
            // Apply calculated friction/dampening
            ship.physics.velocity.x *= currentFriction;
            ship.physics.velocity.y *= currentFriction;
            ship.physics.velocity.z *= currentFriction;

            // Also dampen angular velocity
            if (ship.physics.angularVelocity) {
                ship.physics.angularVelocity.x *= 0.98;
                ship.physics.angularVelocity.y *= 0.98;
                ship.physics.angularVelocity.z *= 0.98;
            }
        }

        const harmonyBoost = this.handleShieldInteraction(ship, environment, deltaTime);
        ship.physics.velocity = VectorMaths.add(ship.physics.velocity, harmonyBoost);
    }

    updatePlanetSurface(deltaTime, ship, environment) {
        const funcName = 'BasicPhysicsEngine.updatePlanetSurface';
        // Logger.start(funcName);

        const totalForce = this.calculateThrustForce(ship);
        this.calculateTorque(ship);
        const gravity = this.calculatePlanetaryGravity(ship, environment);
        const totalAcceleration = VectorMaths.add(VectorMaths.scale(totalForce, 1 / Math.max(1, ship.physics.mass)), gravity);
        this.integrateMovement(ship, totalAcceleration, deltaTime);
        this.handleGroundCollision(ship, environment);

        // Render terrain if needed
        if (this.planetaryRenderer) {
            this.planetaryRenderer.render(environment);
        }
        Logger.end(funcName);
    }

    calculatePlanetaryGravity(ship, environment) {
        // Simple down gravity
        return { x: 0, y: -9.8, z: 0 };
    }

    handleGroundCollision(ship, environment) {
        const funcName = 'BasicPhysicsEngine.handleGroundCollision';
        Logger.start(funcName);

        const terrainHeight = environment.getTerrainHeight ? environment.getTerrainHeight(ship.physics.position.x, ship.physics.position.z) : 0;
        if (ship.physics.position.y < terrainHeight) {
            ship.physics.position.y = terrainHeight;
            ship.physics.velocity.y = Math.max(0, ship.physics.velocity.y);
            // Logger.logVariables({
            //     'ship.physics.position.y': ship.physics.position.y,
            //     'ship.physics.velocity.y': ship.physics.velocity.y
            // });
        }
        Logger.end(funcName);
    }

    calculateThrustForce(ship) {
        let thrustMagnitude = 0;
        // Use flight_air as fallback for planet thrust for now
        if (Controls.isPressed(this.keys, 'flight_air', 'THRUST')) {
            thrustMagnitude = 200;
        } else if (Controls.isPressed(this.keys, 'galaxy', 'BRAKE')) { // galaxy has brake usually? No, check schemes
            thrustMagnitude = -100;
        }

        const forwardVector = { x: 0, y: 0, z: 1 };
        return VectorMaths.scale(forwardVector, thrustMagnitude);
    }

    handleShieldInteraction(ship, environment, deltaTime) {
        const funcName = 'BasicPhysicsEngine.handleShieldInteraction';
        Logger.start(funcName);

        const shipBaseFrequency = ship.currentTuning ? ship.currentTuning.frequency : 440;
        // Safe check for length
        const len = environment.length || 1000;
        const progress = (ship.physics.position.z / len);

        // Mock harmony boost if environment not fully ready
        if (!environment.getCurrentChord) return { x: 0, y: 0, z: 0 };

        const currentChord = environment.getCurrentChord(progress);

        let targetNote;
        try {
            targetNote = environment.getNoteFromChord(currentChord);
        } catch (e) {
            // Fallback if WormholeEnvironment fails (e.g. missing LoreData)
            if (Array.isArray(currentChord) && currentChord.length > 0) {
                targetNote = currentChord[0];
            } else if (currentChord && currentChord.notes && Array.isArray(currentChord.notes)) {
                targetNote = currentChord.notes[0];
            } else {
                targetNote = environment.song ? environment.song.key : 'A';
            }
        }

        const targetFrequency = this.getFrequencyForNote(targetNote, environment.song ? environment.song.key : 'A');
        const rollSemitoneOffset = (ship.physics.rollAngle / (2 * Math.PI)) * 12;
        const shipEffectiveFrequency = shipBaseFrequency * Math.pow(2, rollSemitoneOffset / 12);

        // Store frequencies for HUD
        ship.physics.targetFrequency = targetFrequency;
        ship.physics.effectiveFrequency = shipEffectiveFrequency;

        const harmonyFactor = this.calculateHarmonyFactor(shipEffectiveFrequency, targetFrequency);
        // Logger.logVariables({ harmonyFactor });
        ship.physics.harmonyFactor = harmonyFactor;
        const maxBoost = 50;
        const boostMagnitude = maxBoost * harmonyFactor;
        const boostForce = VectorMaths.scale(ship.physics.direction, boostMagnitude * deltaTime);
        Logger.end(funcName, boostForce);
        return boostForce;
    }

    calculateHarmonyFactor(freq1, freq2) {
        const ratio = Math.max(freq1, freq2) / Math.min(freq1, freq2);
        const perfectRatios = [
            { ratio: 1, quality: 1.0 }, { ratio: 2, quality: 1.0 },
            { ratio: 1.5, quality: 0.9 }, { ratio: 1.333, quality: 0.8 }
        ];
        let bestQuality = 0;
        const tolerance = 0.05;
        for (const pRatio of perfectRatios) {
            if (Math.abs(ratio - pRatio.ratio) < tolerance || Math.abs(ratio - (1 / pRatio.ratio)) < tolerance) {
                bestQuality = Math.max(bestQuality, pRatio.quality);
            }
        }
        return bestQuality;
    }

    getFrequencyForNote(noteName, key) {
        const noteOffsets = { 'A': 0, 'A#': 1, 'B': 2, 'C': 3, 'C#': 4, 'D': 5, 'D#': 6, 'E': 7, 'F': 8, 'F#': 9, 'G': 10, 'G#': 11 };
        const baseFrequency = 440;
        const targetNote = noteName ? noteName.substring(0, noteName.length > 1 && (noteName[1] === '#' || noteName[1] === 'b') ? 2 : 1) : 'A';
        const targetOffset = noteOffsets[targetNote] || 0;
        const keyNote = key ? key.substring(0, key.length > 1 && (key[1] === '#' || key[1] === 'b') ? 2 : 1) : 'A';
        const keyOffset = noteOffsets[keyNote] || 0;
        let semitonesFromA4 = targetOffset - keyOffset;
        const frequency = baseFrequency * Math.pow(2, semitonesFromA4 / 12);
        return frequency;
    }

    calculateWormholeGravity(position, environment) {
        // User requested: "gravity pushes away from the centre of the tunnel"
        // Tunnel center is (0, 0, z) for Straight Line race
        const centerX = 0;
        const centerY = 0;

        const distVector = { x: (position.x || 0) - centerX, y: (position.y || 0) - centerY };
        const distSq = distVector.x * distVector.x + distVector.y * distVector.y;

        if (distSq < 0.001) return { x: 0, y: 0, z: 0 };

        const dist = Math.sqrt(distSq);
        const invDist = 1 / dist;
        const magnitude = 2.0; // Adjusted for better feel

        // Radial repulsion vector
        return {
            x: distVector.x * invDist * magnitude,
            y: distVector.y * invDist * magnitude,
            z: 0
        };
    }

    integrateMovement(ship, accelerationVector, deltaTime) {
        const funcName = 'BasicPhysicsEngine.integrateMovement';
        // Logger.start(funcName);

        ship.physics.velocity = VectorMaths.add(
            ship.physics.velocity,
            VectorMaths.scale(accelerationVector, deltaTime)
        );
        ship.physics.position = VectorMaths.add(
            ship.physics.position,
            VectorMaths.scale(ship.physics.velocity, deltaTime)
        );
        // Logger.end(funcName);
    }

    calculateTorque(ship) {
        // Placeholder
    }

    // --- CPU-Side Noise for Collision Matching ---
    // Ported from WormholeShader.js GLSL
    hash_vec(v) { // v is {x,y,z,w} (Vector4)
        // fract(sin(dot(v, vec4(12.9898, 78.233, 45.164, 94.673))) * 43758.5453)
        const dot = v.x * 12.9898 + v.y * 78.233 + v.z * 45.164 + v.w * 94.673;
        const sin = Math.sin(dot);
        // Math.sin range [-1, 1], scaled by big number.
        // JS % 1 retains sign. fract() in GLSL is always positive (x - floor(x)).
        const scaled = sin * 43758.5453;
        const fract = scaled - Math.floor(scaled); // GLSL fract
        return fract;
    }

    // pos: {x,y,z}, time: float, freqs: Vector4, env: Vector4
    noise12D(pos, time, freqs, env) {
        // vec4 p1 = vec4(pos, time) * 0.01;
        const p1 = { x: pos.x * 0.01, y: pos.y * 0.01, z: pos.z * 0.01, w: time * 0.01 };

        // vec4 p2 = vec4(pos * 0.02, freqs.x * 0.001); -> pos.x, pos.y, pos.z, freqs.x
        const p2 = { x: pos.x * 0.02, y: pos.y * 0.02, z: pos.z * 0.02, w: freqs.x * 0.001 };

        // vec4 p3 = vec4(freqs.y * 0.001, freqs.z * 0.001, freqs.w * 0.001, env.x * 0.01);
        const p3 = { x: freqs.y * 0.001, y: freqs.z * 0.001, z: freqs.w * 0.001, w: env.x * 0.01 };

        // vec4 p4 = vec4(env.y * 0.1, env.z * 0.001, env.w * 0.01, time * 0.05);
        const p4 = { x: env.y * 0.1, y: env.z * 0.001, z: env.w * 0.01, w: time * 0.05 };

        // p1 + p3
        const p1p3 = { x: p1.x + p3.x, y: p1.y + p3.y, z: p1.z + p3.z, w: p1.w + p3.w };
        const h1 = this.hash_vec(p1p3);

        // p2 + p4
        const p2p4 = { x: p2.x + p4.x, y: p2.y + p4.y, z: p2.z + p4.z, w: p2.w + p4.w };
        const h2 = this.hash_vec(p2p4);

        // p1 + p4
        const p1p4 = { x: p1.x + p4.x, y: p1.y + p4.y, z: p1.z + p4.z, w: p1.w + p4.w };
        const h3 = this.hash_vec(p1p4);

        // p2 + p3
        const p2p3 = { x: p2.x + p3.x, y: p2.y + p3.y, z: p2.z + p3.z, w: p2.w + p3.w };
        const h4 = this.hash_vec(p2p3);

        const n = (h1 + h2 * 0.8 + h3 * 0.6 + h4 * 0.4) / 2.8;
        return n * 2.0 - 1.0;
    }
}
