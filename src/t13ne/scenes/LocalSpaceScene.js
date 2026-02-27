import * as THREE from 'three';
import Logger from '/src/t13ne/core/Logger.js';
import { Scene } from '/src/t13ne/core/Scene.js';
import { OrreryScene } from '/src/t13ne/scenes/OrreryScene.js';
import { Controls } from '/src/t13ne/core/Controls.js';
import ProcGen from '../procgen/ProcGen.js';
import { Starbox } from '/src/t13ne/scenes/scenecomponents/starbox.js';
import { PlanetGenerator } from '/src/t13ne/procgen/system/PlanetGenerator.js';
import { Planet } from '/src/t13ne/scenes/scenecomponents/Planet.js';
import { Star } from '/src/t13ne/scenes/scenecomponents/Star.js';
import { Asteroid } from '/src/t13ne/scenes/scenecomponents/Asteroid.js';
import { SceneTools } from '/src/t13ne/core/SceneTools.js';
import CodexLoader from '/src/t13ne/modules/codex/CodexLoader.js';

export class LocalSpaceScene extends Scene {
    constructor(viewManager, sceneData) {
        super(viewManager, sceneData);
        this.systemData = sceneData.systemDetails || {};
        this.planets = sceneData.planets || [];
        this.starData = sceneData.star || {};
        this.planetGenerator = new PlanetGenerator(null);

        this.objects = [];

        // View Settings: Default to visible scales if not provided
        this.scales = sceneData.scales || {
            orbit: 10000.0,      // 1 AU = 10,000 units
            planetSize: 50.0,    // Planets are visible
            starSize: 500.0,     // Star is large
            moonOrbit: 300.0     // Moons orbit at visible distance
        };

        // Intro Sequence State
        this.introConfig = sceneData.introConfig || null;
        this.introActive = !!this.introConfig;
        this.introPhase = 0;
        this.introTime = 0;
        this.introProgress = 0; // Track progress 0.0 to 1.0
        this.cameraSpeed = 5000.0; // Units per second
        this.introStartTime = performance.now();
        this.homeWorldObj = null;
        this.flybySequenceActive = false;
        this.flybyObj = null;
        this.phaseStartPos = null;
        this.introStartPos = new THREE.Vector3(0, 1000, 2000); // Default, updated in init

        this.virtualCameraPosition = new THREE.Vector3(0, 0, 0);
        this.virtualCameraTarget = new THREE.Vector3(0, 0, 0);
        this.currentLookAt = new THREE.Vector3(0, 0, -1);
        this.COMPRESSION_C = 1000.0;

        // Pre-allocate for performance in update loop
        this._dummyMatrix = new THREE.Matrix4();
        this._dummyVector = new THREE.Vector3();

        this.hudElement = null;

        this._introResolve = null;

        this.introPath = [];
        this.introPathLength = null; // Cache for path length
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.onMouseClick = this.onMouseClick.bind(this);
        this.orreryScene = null;
        this.starbox = null;
        this.glowTexture = null;

        this.asteroidMesh = null;
        this._asteroidNeedsUpdate = false;
        this.lockedTarget = null;
    }

    updateContext(context) {
        this.updateSceneData(context);
    }

    updateSceneData(data) {
        if (data.systemDetails) this.systemData = data.systemDetails;
        if (data.planets) this.planets = data.planets;
        if (data.star) this.starData = data.star;
        if (data.introConfig) {
            this.introConfig = data.introConfig;
            this.introActive = true;
        }
        this.init();
    }

    onLoad() {
        super.onLoad();
        this.createHUD();
        // Only play intro if we have PLANETS (data loaded). If not, updateSceneData will trigger it later.
        if (this.introActive && this.planets && this.planets.length > 0) {
            this.playIntroSequence();
        } else if (this.introActive) {
            Logger.message("LocalSpaceScene: Deferring intro sequence until planets are loaded.");
        }
    }

    async _prepare(onProgress) {
        // DO NOT call init() here. It will be called by updateSceneData when data is ready.
        // Calling it here with empty data causes "0 planets" state.
        if (onProgress) onProgress({ status: 'System Ready', percent: 1.0 });
    }
    onActive() {
        this.isActive = true;
        Logger.message("LocalSpaceScene active.");
    }

    init() {
        const funcName = 'LocalSpaceScene.init';
        Logger.start(funcName);

        // CLEANUP
        this.objects.forEach(obj => {
            if (obj.mesh) this.scene.remove(obj.mesh);
            if (obj.orbitLine) this.scene.remove(obj.orbitLine);
        });
        this.objects = [];

        if (this.orreryScene) {
            this.orreryScene.onUnload();
            this.orreryScene = null;
        }

        for (let i = this.scene.children.length - 1; i >= 0; i--) {
            const child = this.scene.children[i];
            if (child.isMesh || child.isLine || child.isPoints || child.isSprite || child.isGroup) {
                if (!child.isCamera && !child.isLight) {
                    this.scene.remove(child);
                }
            }
        }

        this.scene.background = new THREE.Color(0x000000);

        const ambient = new THREE.AmbientLight(0x404040);
        this.scene.add(ambient);

        const headlamp = new THREE.PointLight(0xffffff, 0.3, 0, 0);
        this.activeCamera.add(headlamp);

        this.activeCamera.position.set(0, 0, 0);
        this.activeCamera.lookAt(0, 0, -1);
        this.activeCamera.up.set(0, 1, 0); // Reset UP vector in case previous scene changed it
        this.activeCamera.fov = 60; // Reset FOV
        this.activeCamera.near = 10.0; // Increased to prevent Z-fighting on clouds at distance
        this.activeCamera.far = 10000000; // Increased far plane for realistic scales
        this.activeCamera.updateProjectionMatrix();
        this.scene.add(this.activeCamera);

        // Use system controls (Fly) for local space navigation
        this.setupControls('fly', {
            movementSpeed: 100.0,
            rollSpeed: 0.5,
            dragToLook: false,
            autoForward: false
        });

        if (SceneTools && SceneTools.createGlowTexture) {
            this.glowTexture = SceneTools.createGlowTexture();
        }

        // Removed sanitizeData() - View should not alter model data
        this.createStars();
        this.createPlanets();
        this.createAsteroids();
        this.createSkybox();
        this.setupInteraction();

        this.orreryScene = new OrreryScene(this.viewManager, {
            systemDetails: this.systemData,
            planets: this.planets,
            star: this.starData
        });
        this.orreryScene.init();

        Logger.end(funcName);
    }

    /**
     * Sets a custom path for the intro sequence.
     * @param {THREE.Vector3[]} points 
     */
    setIntroPath(points) {
        if (!points || points.length < 2) return;
        this.introPathSpline = new THREE.CatmullRomCurve3(points);
        this.introPath = this.introPathSpline.getPoints(200);
        this.introPathLength = null; // Reset length cache
        this.introStartPos.copy(points[0]);

        if (this.orreryScene) {
            this.orreryScene.setIntroPath(this.introPath, this.scales.orbit);
        }
        this.introActive = true;
    }

    /**
     * Generates a procedural intro path based on the system layout.
     * Preserves the original logic but fixes collision detection.
     */
    generateIntroPath() {
        if (!this.homeWorldObj) return;

        const waypoints = [];
        const allPlanets = this.objects.filter(o => o.type === 'planet').sort((a, b) => a.orbitRadius - b.orbitRadius);
        const systemRadius = allPlanets.length > 0 ? allPlanets[allPlanets.length - 1].orbitRadius : 20000;
        const startDist = Math.max(systemRadius * 2.5, 120000); // Start MUCH further out

        // 1. Start Point: Outer Edge
        const angle = Math.random() * Math.PI * 2;
        this.introStartPos.set(
            Math.cos(angle) * startDist,
            startDist * 0.4, // Higher elev
            Math.sin(angle) * startDist
        );
        waypoints.push(this.introStartPos.clone());

        // 2. Flyby Waypoint
        if (this.flybyObj && this.flybyObj.realPosition) {
            const flybyPos = this.flybyObj.realPosition.clone();
            const flybyRadius = (this.flybyObj.baseRadius || 100) * (this.flybyObj.type === 'star' ? 40.0 : 15.0);

            // Calculate a safe flyby offset: Outward (away from star) and Up
            // This prevents the "side" calculation from accidentally pointing into the path or the star
            const fromStar = flybyPos.clone().normalize();
            if (fromStar.lengthSq() === 0) fromStar.set(1, 0, 0); // Handle star itself (0,0,0)
            const safeDir = new THREE.Vector3().addVectors(fromStar, new THREE.Vector3(0, 1, 0)).normalize();
            
            const flybyWaypoint = flybyPos.clone().add(safeDir.multiplyScalar(flybyRadius));
            waypoints.push(flybyWaypoint);
        }

        // 3. Final approach point to homeworld
        const homePos = this.homeWorldObj.realPosition.clone();
        const homeRadius = this.homeWorldObj.baseRadius || 1000;

        const prevPoint = waypoints[waypoints.length - 1];
        let approachDir = new THREE.Vector3().subVectors(homePos, prevPoint).normalize();

        // If it's a moon, adjust approach to try and keep the parent in view
        if (this.homeWorldObj.type === 'moon' && this.homeWorldObj.parent) {
            const parentPos = this.homeWorldObj.parent.realPosition;
            const parentToMoon = new THREE.Vector3().subVectors(homePos, parentPos).normalize();

            // Cross product to find a "side" approach that sees both
            const sideDir = new THREE.Vector3().crossVectors(parentToMoon, new THREE.Vector3(0, 1, 0)).normalize();
            if (sideDir.lengthSq() > 0.1) {
                // Bias the approach to be slightly from the side of the parent-moon axis
                approachDir.lerp(sideDir, 0.4).normalize();
            }
        }

        const finalWaypoint = homePos.clone().sub(approachDir.multiplyScalar(homeRadius * 5.0));
        finalWaypoint.y += homeRadius * 1.5;

        waypoints.push(finalWaypoint);

        // --- SAFETY CHECK: Avoid Star Collision ---
        // Ensure the camera never flies through the star (at 0,0,0)
        let maxStarRadius = (this.scales.starSize || 500);
        this.objects.forEach(o => {
            if (o.type === 'star' && o.baseRadius > maxStarRadius) {
                maxStarRadius = o.baseRadius;
            }
        });
        // Fix: Reduced buffer to prevent enveloping inner planets (e.g. at 2000 units)
        const starSafeRadius = maxStarRadius * 1.2; 
        const origin = new THREE.Vector3(0, 0, 0);

        let safetyIterations = 0;
        const MAX_SAFETY_ITERATIONS = 50;

        for (let i = 0; i < waypoints.length - 1; i++) {
            if (safetyIterations++ > MAX_SAFETY_ITERATIONS) {
                Logger.warn("LocalSpaceScene: Safety path generation hit iteration limit. Stopping checks.");
                break;
            }

            const p1 = waypoints[i];
            const p2 = waypoints[i + 1];

            const line = new THREE.Line3(p1, p2);
            const closest = new THREE.Vector3();
            line.closestPointToPoint(origin, true, closest);

            if (closest.distanceTo(origin) < starSafeRadius) {
                // Path cuts too close to the star. Insert a diversion point.
                const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

                // Lift the path "up" (Y+) to fly over the star
                const divertHeight = starSafeRadius * 1.5;
                if (mid.y < divertHeight) mid.y = divertHeight;

                // Also push out horizontally if it's still too close (e.g. vertical dive)
                if (mid.distanceTo(origin) < starSafeRadius) {
                    const pushDir = mid.clone().setY(0).normalize();
                    if (pushDir.lengthSq() === 0) pushDir.set(1, 0, 0);
                    mid.add(pushDir.multiplyScalar(starSafeRadius));
                }

                waypoints.splice(i + 1, 0, mid);
                // in the next iteration to ensure it is also safe.
                Logger.message("LocalSpaceScene: Inserted safety waypoint to avoid star collision.");
            }
        }

        if (waypoints.length > 1) {
            this.introPathSpline = new THREE.CatmullRomCurve3(waypoints);
            this.introPath = this.introPathSpline.getPoints(200);
            this.introPathLength = null; // Reset length cache
            this.orreryScene.setIntroPath(this.introPath, this.scales.orbit);
        } else {
            Logger.warn("LocalSpaceScene: Failed to generate valid intro path.");
            this.introActive = false;
        }

        // Set initial camera position if intro is active
        if (this.introActive) {
            this.virtualCameraPosition.copy(this.introStartPos);
        }
    }

    setupInteraction() {
        window.addEventListener('click', this.onMouseClick);
    }

    onUnload() {
        super.onUnload();
        window.removeEventListener('click', this.onMouseClick);
        if (this.viewManager) this.viewManager.setHUD(null);

        if (this.renderer) {
            this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
            this.renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
            this.renderer.setScissorTest(false);
        }

        if (this.orreryScene) {
            this.orreryScene.onUnload();
            this.orreryScene = null;
        }
    }

    createHUD() {
        const planetCount = this.planets.length;
        const moonCount = this.planets.reduce((acc, p) => acc + (p.moons ? p.moons.length : 0), 0);
        const total = 1 + planetCount + moonCount;

        this.hudElement = document.createElement('div');
        Object.assign(this.hudElement.style, {
            position: 'absolute',
            top: '20px',
            right: '20px',
            color: '#00ff00',
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            fontWeight: 'bold',
            textShadow: '0 0 5px #000',
            pointerEvents: 'none',
            zIndex: '100'
        });

        let name = this.systemData.name || 'Unknown';
        if (this.systemData.systemNameFull && Array.isArray(this.systemData.systemNameFull)) {
            const [common, formal, aka] = this.systemData.systemNameFull;
            name = `${common} | `;
            if (aka) name += ` | `;
        }
        this.hudElement.innerText = `SYSTEM:  ( Bodies)`;

        if (this.viewManager) {
            this.viewManager.setHUD(this.hudElement);
        }
    }

    createStars() {
        let stars = [];
        if (this.systemData.stars && Array.isArray(this.systemData.stars) && this.systemData.stars.length > 0) {
            stars = this.systemData.stars;
        } else {
            stars = [{
                radius: 1.0,
                color: this.systemData.starColor || 0xffffaa,
                type: this.systemData.starClass || 'G',
                offset: 0
            }];
        }

        // Use scale from data or default 1
        const baseStarSize = this.scales.starSize;

        stars.forEach((starData, index) => {
            const radius = baseStarSize * (starData.radius || 1.0);

            let realPos = new THREE.Vector3(0, 0, 0);
            if (stars.length > 1) {
                if (index > 0 || stars.length > 1) {
                    const dist = (baseStarSize * 1.5) + (starData.offset || 0);
                    const angle = index * (Math.PI * 2 / stars.length);
                    realPos.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
                }
            }

            const starMesh = new Star(starData, radius);

            const starObj = {
                mesh: starMesh,
                realPosition: realPos,
                baseRadius: radius,
                type: 'star',
                data: starData
            };
            // Ensure stars have a sprite for distant visibility
            this.createDistantSprite(starObj, starData.color || 0xffffaa);
            this.objects.push(starObj);
            this.scene.add(starMesh);
        });
    }

    createPlanets() {
        if (!this.planets || !Array.isArray(this.planets)) {
            Logger.warn("LocalSpaceScene: No planets data to create.");
            return;
        }
        Logger.message(`LocalSpaceScene: Creating ${this.planets.length} planets.`);

        const prng = ProcGen.createPRNG(this.systemData.name || 'planets');

        this.planets.forEach((planetData, index) => {
            // Use raw data values scaled by the provided scale factor (default 1)
            const distance = (planetData.orbitalDistance || 0) * this.scales.orbit;
            const planetRadius = (planetData.radius || 1) * this.scales.planetSize;

            // Default to low detail (false) to prevent massive lag spike. We enable high detail for specific targets later.
            const planetMesh = new Planet(planetData, planetRadius, false);
            this.scene.add(planetMesh);

            const orbitPoints = [];
            const segments = 128;
            for (let i = 0; i <= segments; i++) {
                const theta = (i / segments) * Math.PI * 2;
                orbitPoints.push(new THREE.Vector3(Math.cos(theta) * distance, 0, Math.sin(theta) * distance));
            }
            const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
            const orbitMat = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.3 });
            const orbitLine = new THREE.Line(orbitGeo, orbitMat);
            this.scene.add(orbitLine);

            const planetObj = {
                mesh: planetMesh,
                orbitLine: orbitLine,
                orbitPointsReal: orbitPoints,
                data: planetData,
                orbitRadius: distance,
                orbitSpeed: (planetData.orbitSpeed || 0.0001) * 5,
                orbitAngle: prng.nextDouble() * Math.PI * 2,
                realPosition: new THREE.Vector3(distance, 0, 0),
                baseRadius: planetRadius,
                type: 'planet',
                parent: null,
                moons: []
            };

            planetObj.realPosition.set(Math.cos(planetObj.orbitAngle) * distance, 0, Math.sin(planetObj.orbitAngle) * distance);

            // Sync angle back to data for Orrery
            planetData.startAngle = planetObj.orbitAngle;

            this.createDistantSprite(planetObj, planetData.color);
            this.objects.push(planetObj);

            if (planetData.moons) {
                planetData.moons.forEach(moonData => {
                    const moonLOD = new THREE.LOD();
                    this.scene.add(moonLOD);

                    const moonRadius = (moonData.radius || 0.2) * (this.scales.planetSize || 1);
                    const moonMeshScale = moonRadius / 2;

                    let detailedMoonMesh;
                    try {
                        detailedMoonMesh = this.planetGenerator.generateAsteroidMesh(prng.nextDouble(), 2, moonData.color);
                        detailedMoonMesh.scale.setScalar(moonMeshScale);
                    } catch (e) {
                        detailedMoonMesh = new THREE.Mesh(new THREE.SphereGeometry(moonRadius, 8, 8), new THREE.MeshStandardMaterial({ color: 0x888888 }));
                    }
                    moonLOD.addLevel(detailedMoonMesh, 0);

                    let simpleMoonMesh;
                    try {
                        simpleMoonMesh = new THREE.Mesh(new THREE.SphereGeometry(moonRadius, 8, 8), new THREE.MeshBasicMaterial({ color: 0xaaaaaa }));
                    } catch (e) {
                        simpleMoonMesh = new THREE.Mesh(new THREE.SphereGeometry(moonRadius, 4, 4), new THREE.MeshBasicMaterial({ color: 0x888888 }));
                    }
                    moonLOD.addLevel(simpleMoonMesh, 1000);

                    const moonObj = {
                        mesh: moonLOD,
                        data: moonData,
                        orbitRadius: (moonData.orbitalDistance || 0.002) * (this.scales.moonOrbit || 1) + (planetRadius * 3),
                        orbitSpeed: (moonData.orbitSpeed || 0.01),
                        orbitAngle: prng.nextDouble() * Math.PI * 2,
                        realPosition: new THREE.Vector3(),
                        baseRadius: moonRadius,
                        parent: planetObj,
                        type: 'moon'
                    };

                    this.createDistantSprite(moonObj, moonData.color);
                    planetObj.moons.push(moonObj);
                    this.objects.push(moonObj);
                });
            }
        });
    }

    async createAsteroids() {
        const count = 400;
        const beltRadius = this.scales.orbit * 2.5;
        const beltWidth = this.scales.orbit * 0.8;

        let geometry, material;

        // Try to load a high-poly asteroid model from the manifest
        if (CodexLoader.media) {
            const asteroidModels = CodexLoader.media.findModels('asteroid');
            if (asteroidModels.length > 0) {
                try {
                    const ModelLoader = (await import('/src/t13ne/core/ModelLoader.js')).default;
                    const loader = new ModelLoader();
                    const model = await loader.loadModel(asteroidModels[0].path);

                    // Extract geometry and material from the first mesh found in the model
                    model.traverse(child => {
                        if (child.isMesh && !geometry) {
                            geometry = child.geometry;
                            material = child.material;
                        }
                    });
                } catch (e) {
                    Logger.warn("LocalSpaceScene: Failed to load asteroid model, falling back to procedural.", e);
                }
            }
        }

        if (!geometry) {
            const dummyAsteroid = new Asteroid(15);
            geometry = dummyAsteroid.geometry;
            material = dummyAsteroid.material;
        }

        this.asteroidMesh = new THREE.InstancedMesh(geometry, material, count);
        this.asteroidMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.asteroidMesh);

        const matrix = new THREE.Matrix4();

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = beltRadius + (Math.random() - 0.5) * beltWidth;
            const y = (Math.random() - 0.5) * 400;

            const asteroidObj = {
                mesh: null, // No individual mesh
                instanceIndex: i,
                realPosition: new THREE.Vector3(Math.cos(angle) * dist, y, Math.sin(angle) * dist),
                orbitRadius: dist,
                orbitSpeed: (0.0002 + Math.random() * 0.0001) * 5,
                orbitAngle: angle,
                baseRadius: 15,
                type: 'asteroid',
                parent: null
            };

            // Set initial position
            matrix.setPosition(asteroidObj.realPosition);
            this.asteroidMesh.setMatrixAt(i, matrix);

            this.objects.push(asteroidObj);
        }
        this.asteroidMesh.instanceMatrix.needsUpdate = true;
    }

    async createSkybox() {
        const r = 60000;
        this.starbox = new Starbox(this.gameEngine);
        await this.starbox.generate(this.scene, this.starData, r);
    }

    createDistantSprite(obj, colorData) {
        if (!this.glowTexture) return;

        let color = new THREE.Color(0xffffff);
        if (colorData) {
            if (colorData.isColor) color.copy(colorData);
            else if (colorData.h !== undefined) color.setHSL(colorData.h, colorData.s, colorData.l);
            else color.set(colorData);
        }

        const material = new THREE.SpriteMaterial({
            map: this.glowTexture,
            color: color,
            transparent: true,
            depthTest: true, // Allow depth testing so it doesn't shine through planets
            depthWrite: false
        });
        obj.sprite = new THREE.Sprite(material);
        this.scene.add(obj.sprite);
    }

    update(time, delta) {
        super.update(time, delta);
        const dt = delta * 0.001;
        const compression = this.COMPRESSION_C;

        // --- 0. Input Handling (Local Controls) ---
        if (!this.introActive) {
            // Transfer movement from activeCamera (moved by system controls) to virtualCameraPosition
            // This maintains the floating origin for the logarithmic depth buffer
            if (this.activeCamera.position.lengthSq() > 0) {
                this.virtualCameraPosition.add(this.activeCamera.position);
                this.activeCamera.position.set(0, 0, 0);
            }
        }

        if (this.starbox) {
            // Starbox is static, no update needed unless camera moves within it
            // this.starbox.update(time * 0.001);
        }

        // --- 1. Update Real Positions (Simulation) ---
        this.objects.forEach(obj => {
            if (obj.orbitSpeed && obj.orbitRadius) {
                obj.orbitAngle += obj.orbitSpeed * dt;

                const lx = Math.cos(obj.orbitAngle) * obj.orbitRadius;
                const lz = Math.sin(obj.orbitAngle) * obj.orbitRadius;

                if (obj.parent && obj.parent.realPosition) {
                    obj.realPosition.copy(obj.parent.realPosition).add(new THREE.Vector3(lx, 0, lz));
                } else {
                    obj.realPosition.set(lx, 0, lz);
                }
            }
        });

        // --- 2. Intro Sequence Logic (Camera Movement) ---
        if (this.introActive && this.homeWorldObj && this.homeWorldObj.realPosition) {
            const finished = this.updateIntroCamera(dt);

            // Transition condition
            if (finished && !this.isComplete) {
                // Do NOT set introActive = false here. 
                // We want to keep the logarithmic view active until the scene unloads
                // to prevent the camera snapping to the linear "gameplay" view during the transition.
                Logger.message("LocalSpaceScene: Intro complete. Calling this.complete().");
                this.complete();
            }
        } else if (this.homeWorldObj && !this.introActive) {
            // Gameplay Mode: Do NOT lock virtualCameraPosition to homeworld every frame.
            // Allow external controls or ship logic to update it.
            // If no other system is updating it, we might want to initialize it once.
            if (this.virtualCameraPosition.lengthSq() === 0 && this.homeWorldObj.realPosition) {
                this.virtualCameraPosition.copy(this.homeWorldObj.realPosition).add(new THREE.Vector3(0, 200, 800));
            }
        }

        if (this.orreryScene) {
            // The orrery's internal animation (planet orbits) should be driven by its own update loop
            // which is called by the main animate() function when the PIP is visible.
            // We only need to update the marker position from here.
            this.orreryScene.updateCameraMarker(this.virtualCameraPosition, this.scales.orbit);
        }

        // --- 3. Spatial Compression & Rendering ---
        let CameraSubject = new THREE.Vector3(0, 0, -100); // Default look-at
        this.objects.forEach(obj => {
            if (obj.mesh) {
                const relVec = new THREE.Vector3().subVectors(obj.realPosition, this.virtualCameraPosition);
                const realDist = relVec.length();

                if (!this.introActive && obj === this.homeWorldObj) {
                    obj.mesh.position.copy(relVec);
                    obj.mesh.scale.setScalar(1.0);
                } else {
                    const visualDist = compression * Math.log(1 + realDist / compression);
                    const visualPos = relVec.clone();
                    if (realDist > 0.01) {
                        visualPos.normalize().multiplyScalar(visualDist);
                    } else {
                        visualPos.set(0, 0, 0);
                    }
                    obj.mesh.position.copy(visualPos);

                    // If this object is our look-at target, store its visual position
                    if (this.introActive && (obj === this.flybyObj || obj === this.homeWorldObj)) {
                        const targetObj = (this.flybyObj && this.introPhase === 0) ? this.flybyObj : this.homeWorldObj;
                        if (obj === targetObj) {
                            CameraSubject.copy(visualPos);

                            // If targeting a moon homeworld, slightly bias the look-at towards the parent
                            if (targetObj === this.homeWorldObj && targetObj.type === 'moon' && targetObj.parent && targetObj.parent.mesh) {
                                const parentVisual = targetObj.parent.mesh.position;
                                CameraSubject.lerp(parentVisual, 0.15); // Subtle bias to keep giant in frame
                            }
                        }
                    }

                    let scale = 1.0;
                    if (realDist > 0.001) {
                        scale = visualDist / realDist;
                    }

                    if (obj.type === 'star' || obj.type === 'planet' || obj.type === 'moon') {
                        const minAngularSize = 0.005;
                        const minScale = (visualDist * minAngularSize) / (obj.baseRadius || 1);
                        if (scale < minScale) scale = minScale;
                    }

                    obj.mesh.scale.setScalar(scale);

                    // LOD / Sprite Switching
                    if (obj.sprite) {
                        const physicalScale = (obj.baseRadius || 100) * scale;
                        const minPixelScale = visualDist * 0.005;

                        obj.sprite.scale.setScalar(Math.max(physicalScale * 2.0, minPixelScale));
                        obj.sprite.position.copy(visualPos);

                        const isFinalPhase = this.introActive && this.introPhase === 1;
                        const canShowMesh = scale > 0.005 || (obj === this.homeWorldObj && isFinalPhase) || (obj.type === 'star');

                        if (canShowMesh) {
                            obj.mesh.visible = !this.introActive || (obj === this.homeWorldObj && isFinalPhase) || (obj.type === 'star');
                            obj.sprite.material.opacity = Math.max(0, 1.0 - (scale * 100));
                            obj.sprite.visible = obj.sprite.material.opacity > 0.01;
                        } else {
                            obj.mesh.visible = false;
                            obj.sprite.visible = true;
                            obj.sprite.material.opacity = 1.0;
                        }
                    }
                }
            } else if (obj.type === 'asteroid' && this.asteroidMesh) {
                // Instanced Asteroid update
                const relVec = new THREE.Vector3().subVectors(obj.realPosition, this.virtualCameraPosition);
                const realDist = relVec.length();
                const visualDist = compression * Math.log(1 + realDist / compression);
                const visualPos = relVec.clone();
                if (realDist > 0.01) {
                    visualPos.normalize().multiplyScalar(visualDist);
                } else {
                    visualPos.set(0, 0, 0);
                }

                this._dummyMatrix.identity();
                this._dummyMatrix.setPosition(visualPos);
                // Scale asteroid based on compression
                let scale = realDist > 0.001 ? (visualDist / realDist) : 1.0;
                this._dummyVector.set(scale, scale, scale);
                this._dummyMatrix.scale(this._dummyVector);
                this.asteroidMesh.setMatrixAt(obj.instanceIndex, this._dummyMatrix);
                this._asteroidNeedsUpdate = true;
            }


            if (obj.orbitLine && obj.orbitPointsReal && obj.orbitLine.geometry?.attributes?.position?.array) {
                obj.orbitLine.visible = !this.introActive;
                const positions = obj.orbitLine.geometry.attributes.position.array;
                const tempVec = new THREE.Vector3();

                for (let i = 0; i < obj.orbitPointsReal.length; i++) {
                    const realPt = obj.orbitPointsReal[i];
                    tempVec.subVectors(realPt, this.virtualCameraPosition);
                    const rDist = tempVec.length();
                    const vDist = compression * Math.log(1 + rDist / compression);
                    tempVec.normalize().multiplyScalar(vDist);

                    positions[i * 3] = tempVec.x;
                    positions[i * 3 + 1] = tempVec.y;
                    positions[i * 3 + 2] = tempVec.z;
                }
                obj.orbitLine.geometry.attributes.position.needsUpdate = true;
            }
        });

        if (this._asteroidNeedsUpdate && this.asteroidMesh) {
            this.asteroidMesh.instanceMatrix.needsUpdate = true;
            this._asteroidNeedsUpdate = false;
        }

        // --- 4. Update Camera LookAt ---
        if (this.introActive) {
            this.activeCamera.lookAt(CameraSubject);
        } else if (this.lockedTarget && this.lockedTarget.mesh) {
            // Target Lock Logic: Smoothly rotate camera to face the target
            const targetPos = this.lockedTarget.mesh.position;
            const targetQuaternion = new THREE.Quaternion();
            const m = new THREE.Matrix4();
            // Calculate the rotation required to look at the target from (0,0,0)
            // We use the camera's up vector to maintain orientation (or level the horizon)
            m.lookAt(new THREE.Vector3(0, 0, 0), targetPos, this.activeCamera.up);
            targetQuaternion.setFromRotationMatrix(m);

            // Slerp (Spherical Linear Interpolation) towards the target rotation
            // 5.0 * dt provides a snappy but smooth lock-on feel
            this.activeCamera.quaternion.slerp(targetQuaternion, 5.0 * dt);
        }
    }

    onMouseClick(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.activeCamera);

        const meshes = this.objects.map(o => o.mesh).filter(m => m);
        const intersects = this.raycaster.intersectObjects(meshes, true);

        if (intersects.length > 0) {
            const hit = intersects[0].object;
            const targetObj = this.objects.find(o => o.mesh === hit || o.mesh.children.includes(hit));

            if (targetObj) {
                this.lockedTarget = targetObj;
                Logger.message(`LocalSpaceScene: Target Locked on ${targetObj.data.name}`);
            }
        } else {
            // Clicked on empty space, disengage lock
            if (this.lockedTarget) {
                this.lockedTarget = null;
                Logger.message("LocalSpaceScene: Target Lock disengaged.");
            }
        }
    }

    animate() {
        if (!this.isActive) return;

        const time = performance.now();
        const delta = (time - (this.lastTime || time));
        this.lastTime = time;

        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

        Controls.update();

        if (this.shouldUpdateControls && this.activeCameraName && this.cameraControls.has(this.activeCameraName)) {
            const controls = this.cameraControls.get(this.activeCameraName);
            if (controls.enabled) {
                controls.update();
            }
        }

        this.update(time, delta);

        if (this.activeCamera && this.renderer) {
            this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
            this.renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
            this.renderer.setScissorTest(false);
            this.renderer.render(this.scene, this.activeCamera);

            if (this.introActive && this.orreryScene) {
                const pipSize = Math.min(window.innerWidth, window.innerHeight) * 0.25;
                this.renderer.setViewport(20, 20, pipSize, pipSize);
                this.renderer.setScissor(20, 20, pipSize, pipSize);
                this.renderer.setScissorTest(true);
                this.renderer.render(this.orreryScene.scene, this.orreryScene.activeCamera);
                this.renderer.setScissorTest(false);
            }
        }
    }

    playIntroSequence() {
        // This logic is now deferred until onLoad to ensure all data is present.
        this.homeWorldObj = this.objects.find(o => o.data?.isHomeworld === true);

        if (!this.homeWorldObj) {
            const planets = this.objects.filter(o => o.type === 'planet');
            const hwIndex = this.systemData.homeWorldIndex !== undefined ? this.systemData.homeWorldIndex : 0;
            this.homeWorldObj = planets[hwIndex] || planets[0] || null;
        }

        if (this.homeWorldObj) {
            Logger.message(`LocalSpaceScene: Homeworld identified as ${this.homeWorldObj.data.name || 'Body ' + (this.homeWorldObj.index || '')} (${this.homeWorldObj.type})`);

            const candidates = this.objects.filter(o => (o.type === 'planet' || o.type === 'moon') && o !== this.homeWorldObj && o.mesh);
            this.flybyObj = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : this.objects.find(o => o.type === 'star');
            Logger.message(`LocalSpaceScene: Fly-by object identified as ${this.flybyObj?.data?.name || this.flybyObj?.type || 'the star'}`);

            if (this.homeWorldObj.mesh && typeof this.homeWorldObj.mesh.enableHighDetail === 'function') this.homeWorldObj.mesh.enableHighDetail();
            if (this.flybyObj && this.flybyObj.mesh && typeof this.flybyObj.mesh.enableHighDetail === 'function') this.flybyObj.mesh.enableHighDetail();

            this.flybySequenceActive = !!this.flybyObj;

            if (this.introConfig && this.introConfig.path) {
                this.setIntroPath(this.introConfig.path);
            } else {
                this.generateIntroPath();
            }

            this.virtualCameraPosition.copy(this.introStartPos);
        } else {
            Logger.warn("LocalSpaceScene: Could not identify a homeworld on load. Completing intro step immediately.");
            this.introActive = false;
            this.complete();
            return;
        }

        this.introStartTime = performance.now();
        this.introTime = 0;
        this.introProgress = 0;
    }

    updateIntroCamera(dt) {
        if (!this.introPathSpline) return true;

        if (!this.introPathLength) {
            this.introPathLength = this.introPathSpline.getLength();
        }

        // Calculate progress based on speed and distance
        const speed = this.introConfig?.speed || this.cameraSpeed || 5000;
        const dist = speed * dt;
        const progressDelta = dist / this.introPathLength;

        this.introProgress += progressDelta;

        const progress = Math.min(this.introProgress, 1.0);
        const ease = 1 - Math.pow(1 - progress, 3); // Ease-out

        // Move camera along the spline
        this.introPathSpline.getPointAt(ease, this.virtualCameraPosition);

        // Determine current phase of the intro (for LOD and look-at target)
        // If we have a flyby object, we switch phase halfway through the path (at the flyby point)
        if (this.flybyObj) {
            // Assuming 3 points: Start(0), Flyby(0.5), Home(1)
            // Switch focus after passing the flyby point
            this.introPhase = ease < 0.55 ? 0 : 1; // 0.55 to give a bit of time after passing
        } else {
            this.introPhase = 1; // Direct approach
        }

        return progress >= 1.0;
    }
}
