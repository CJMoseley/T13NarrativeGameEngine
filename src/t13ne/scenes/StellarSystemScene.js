import * as THREE from 'three';
import Logger from '../core/Logger.js';
import { Scene } from '../core/Scene.js';
import { PlanetGenerator } from '../procgen/system/PlanetGenerator.js';
import { SceneTools } from '../core/SceneTools.js';
import { UI } from '../core/ui/UI.js';
import { OrreryScene } from './OrreryScene.js';
import { Controls } from '../core/Controls.js';
import ProcGen from '../procgen/ProcGen.js';

export class StellarSystemScene extends Scene {
    constructor(viewManager, sceneData) {
        super(viewManager, sceneData);
        this.systemData = sceneData.systemDetails || {};
        this.planets = sceneData.planets || [];
        this.starData = sceneData.star || {};
        
        this.planetGenerator = new PlanetGenerator(null);
        this.objects = []; 
        
        // Configuration for "Big Space" feel
        // Real Space Scales (Simulation Units)
        this.scales = {
            orbit: 20000,      // Increased to 20,000 to spread planets out more
            planetSize: 100,   // Base visual size for planets (Radius)
            starSize: 1000,    // Base visual size for star (Radius)
            moonOrbit: 500     // Visual orbit size for moons
        };

        // Intro Sequence State
        this.introActive = true;
        this.introPhase = 0; // 0: Flyby, 1: Homeworld
        this.introTime = 0;
        this.homeWorldObj = null;
        this.flybyObj = null;
        this.phaseStartPos = null; // Track start position for curves
        this.introStartPos = new THREE.Vector3(0, 40000, 150000); // Higher Y for better initial overview
        // Floating Origin: The Virtual Camera tracks the "Real" position in the simulation
        this.virtualCameraPosition = new THREE.Vector3(0, 5000, 50000); // Start far out
        this.virtualCameraTarget = new THREE.Vector3(0, 0, 0);
        this.currentLookAt = new THREE.Vector3(0, 0, -1); // Track current look direction for smoothing
        this.COMPRESSION_C = 1000.0; // Compression constant. Larger = less compression close up.
        
        this.hudElement = null;
        
        // Controls state
        this.inputState = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            speed: 100.0 // Base movement speed
        };

        this.introPath = []; // Store precalculated path
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.onMouseClick = this.onMouseClick.bind(this);
        this.orreryScene = null;
    }

    async prepare(onProgress) {
        // If no specific system data is provided (e.g. during attract mode/sequence), generate a random one.
        if ((!this.planets || this.planets.length === 0) && this.gameEngine && this.gameEngine.loreMaster) {
            Logger.message("StellarSystemScene: No system data provided. Generating random system...");
            try {
                const star = { x: 0, y: 0, z: 0, id: `random_star_${Date.now()}`, starClass: 'G', r: Math.random() };
                const noise = { n1: Math.random(), n2: Math.random(), n3: Math.random(), n4: Math.random() };
                const galaxyParams = this.gameEngine.galaxyGenerator ? this.gameEngine.galaxyGenerator.params : { galaxyRadius: 10000, coreRadius: 2000 };
                
                const systemLore = await this.gameEngine.loreMaster.generateSystemLore(star, noise, galaxyParams);
                this.systemData = systemLore;
                
                if (this.gameEngine.loreMaster.stellarSystemGenerator) {
                    this.planets = this.gameEngine.loreMaster.stellarSystemGenerator.generatePlanets(systemLore);
                    Logger.message(`StellarSystemScene: Generated ${this.planets.length} random planets.`);
                }
                this.starData = star;
            } catch (e) {
                Logger.error("StellarSystemScene: Failed to generate random system.", e);
            }
        }
        this.init();
        if (onProgress) onProgress({ status: 'System Ready', percent: 1.0 });
    }

    onActive() {
        // Override base Scene.onActive to prevent GameEngine.seedPlayerShip crash
        // if it's being called from there. This ensures the scene renders even if the ship fails.
        this.isActive = true;
        Logger.message("StellarSystemScene active.");
        // We do NOT call super.onActive() if it triggers the broken ship generation.
    }

    init() {
        const funcName = 'StellarSystemScene.init';
        Logger.start(funcName);

        // CLEANUP: Remove existing objects to prevent stacking if init is called twice
        this.objects.forEach(obj => {
            if (obj.mesh) this.scene.remove(obj.mesh);
            if (obj.orbitLine) this.scene.remove(obj.orbitLine);
        });
        this.objects = [];
        
        // Safer cleanup: Remove specific types we know we added, preserve camera/lights
        // Iterate backwards to safely remove
        for (let i = this.scene.children.length - 1; i >= 0; i--) {
            const child = this.scene.children[i];
            if (child.isMesh || child.isLine || child.isPoints || child.isSprite || child.isGroup) {
                // Don't remove the camera if it happens to be a child (it shouldn't be a Mesh, but just in case)
                if (!child.isCamera && !child.isLight) {
                    this.scene.remove(child);
                }
            }
        }

        this.scene.background = new THREE.Color(0x000000);
        
        // Lighting
        const ambient = new THREE.AmbientLight(0x404040); // Moderate ambient
        this.scene.add(ambient);
        
        // Camera Headlamp (ensure planets are visible from all angles)
        // Use PointLight attached to camera for consistent illumination
        const headlamp = new THREE.PointLight(0xffffff, 0.3, 0, 0); // No decay
        this.activeCamera.add(headlamp);

        // Camera Setup
        // The actual Three.js camera stays locked at origin (0,0,0)
        // We move the world around it.
        this.activeCamera.position.set(0, 0, 0);
        this.activeCamera.lookAt(0, 0, -1); // Look down Z initially
        this.activeCamera.near = 0.1; // Reset to a standard near plane
        this.activeCamera.far = 100000; // Standard far plane is fine with compression
        this.activeCamera.updateProjectionMatrix();
        this.scene.add(this.activeCamera); // Ensure camera is in scene for skybox attachment
        
        // Use TrackballControls as requested to avoid gimbal lock
        this.setupControls('trackball', {
            rotateSpeed: 2.0,
            zoomSpeed: 1.2,
            panSpeed: 0.8,
            noZoom: false,
            noPan: true, // Keep camera at origin, we move the world
            staticMoving: false,
            dynamicDampingFactor: 0.1
        });

        this.sanitizeData(); // Fix NaNs before creation
        this.createStars();
        this.createPlanets();
        this.createSkybox(); 
        this.setupInteraction();

        // Identify Homeworld for the Intro
        if (this.objects.length > 0) {
            const hwIndex = this.systemData.homeWorldIndex !== undefined ? this.systemData.homeWorldIndex : 0;
            const planets = this.objects.filter(o => o.type === 'planet');
            // Fallback to the first star if no planets exist
            this.homeWorldObj = planets[hwIndex] || planets[0] || this.objects.find(o => o.type === 'star');
            
            if (this.homeWorldObj) {
                Logger.message(`StellarSystemScene: Target identified as ${this.homeWorldObj.data.name}`);
                
                // Recalculate start position based on system scale
                // Find the furthest planet to ensure we start outside the system
                let maxDist = this.objects.reduce((max, obj) => Math.max(max, obj.orbitRadius || 0), 0);
                if (maxDist < 20000) maxDist = 50000; // Force minimum scale to ensure we start outside
                this.introStartPos.set(0, maxDist * 0.5, maxDist * 1.2); // Higher angle, slightly closer
                
                // Adjust Compression Constant based on scale to prevent stacking at distance
                this.COMPRESSION_C = Math.max(10000, maxDist / 5);
                this.virtualCameraPosition.copy(this.introStartPos); // Set initial position
                
                // Identify Flyby Target (Random planet that isn't homeworld)
                // Use deterministic seed based on system name
                const prng = ProcGen.createPRNG(this.systemData.name || 'flyby');
                const candidates = this.objects.filter(o => o.type === 'planet' && o !== this.homeWorldObj);
                if (candidates.length > 0) {
                    this.flybyObj = candidates[Math.floor(prng.nextDouble() * candidates.length)];
                }
            } else {
                Logger.warn("StellarSystemScene: No targets found. Defaulting to origin.");
                this.introStartPos.set(0, 10000, 20000);
            }
        }

        // Precalculate the flight path for stability and visualization
        this.introPath = this.generateIntroPath();

        // Setup Orrery for PiP (Picture in Picture)
        this.orreryScene = new OrreryScene(this.viewManager, {
            systemDetails: this.systemData,
            planets: this.planets,
            star: this.starData
        });
        this.orreryScene.init();
        // Pass the path to the Orrery to draw the "Flight Plan"
        if (this.introPath.length > 0) this.orreryScene.setIntroPath(this.introPath, this.scales.orbit);
        
        // Force an update of the camera marker immediately to ensure it's visible at start
        this.orreryScene.updateCameraMarker(this.virtualCameraPosition, this.scales.orbit);
        
        // Disable controls on the PiP so it doesn't conflict with main view
        if (this.orreryScene.cameraControls.has('orbit')) this.orreryScene.cameraControls.get('orbit').enabled = false;

        Logger.end(funcName);
    }

    generateIntroPath() {
        const points = [];
        const fps = 60;
        const dt = 1 / fps;
        
        // Clone objects for simulation so we don't mess up the main scene state
        const simObjects = this.objects.map(o => ({
            ...o,
            orbitAngle: o.orbitAngle, 
            realPosition: o.realPosition.clone()
        }));
        
        // Safe lookup for simulation objects
        const flybyObj = this.flybyObj ? simObjects.find(o => o.data === this.flybyObj.data) : null;
        const homeObj = this.homeWorldObj ? simObjects.find(o => o.data === this.homeWorldObj.data) : null;
        const defaultTarget = { realPosition: new THREE.Vector3(0,0,0), baseRadius: 1000 };
        
        let currentPos = this.introStartPos.clone();
        let phaseStartPos = this.introStartPos.clone();
        
        // Total duration logic matches update loop
        const totalDuration = (flybyObj) ? 22.0 : 20.0; 
        const totalSteps = Math.ceil(totalDuration * fps);

        for (let i = 0; i <= totalSteps; i++) {
            const time = i * dt;
            
            // 1. Simulate Orbits
            simObjects.forEach(obj => {
                if (obj.orbitSpeed && obj.orbitRadius) {
                    obj.orbitAngle += obj.orbitSpeed * dt;
                    obj.realPosition.x = Math.cos(obj.orbitAngle) * obj.orbitRadius;
                    obj.realPosition.z = Math.sin(obj.orbitAngle) * obj.orbitRadius;
                }
            });

            // 2. Determine Target & Phase
            let targetObj = homeObj || defaultTarget;
            let duration = 20.0;
            let phaseTime = time;
            let startPos = this.introStartPos;
            let phase = 0;

            if (flybyObj) {
                if (time < 12.0) { // Extend flyby phase slightly
                    targetObj = flybyObj;
                    duration = 12.0;
                    phaseTime = time;
                    startPos = this.introStartPos; // Start from wide view
                    phase = 0;
                } else {
                    targetObj = homeObj || defaultTarget;
                    duration = 10.0;
                    phaseTime = time - 12.0;
                    // Start pos for phase 2 is the end of phase 1 (approx)
                    // We capture it when we switch phases, or just use the last calculated point
                    if (points.length > 0 && Math.abs(time - 12.0) < dt * 1.5) {
                        phaseStartPos.copy(points[points.length - 1]);
                    }
                    startPos = phaseStartPos;
                    phase = 1;
                }
            }

            const t = Math.min(phaseTime / duration, 1.0);
            
            // Easing
            let ease;
            if (phase === 1 && flybyObj) {
                ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            } else {
                ease = 1 - Math.pow(1 - t, 3);
            }

            // Target Position
            const targetRealPos = targetObj.realPosition || new THREE.Vector3(0,0,0);
            const targetRadius = targetObj.baseRadius || 1000;
            // Match locked offset: (0, 200, 800) relative to planet. baseRadius is typically 100.
            const targetCamPos = new THREE.Vector3(
                targetRealPos.x, 
                targetRealPos.y + targetRadius * 2.0, 
                targetRealPos.z + targetRadius * 8.0
            );

            // Bezier Curve
            const p0 = startPos;
            const p2 = targetCamPos;
            const dist = p0.distanceTo(p2);
            
            // Midpoint + Arc
            const mid = new THREE.Vector3().addVectors(p0, p2).multiplyScalar(0.5);
            const p1 = mid.clone().setY(mid.y + (dist * 0.1));

            const invT = 1 - ease;
            const x = invT * invT * p0.x + 2 * invT * ease * p1.x + ease * ease * p2.x;
            const y = invT * invT * p0.y + 2 * invT * ease * p1.y + ease * ease * p2.y;
            const z = invT * invT * p0.z + 2 * invT * ease * p1.z + ease * ease * p2.z;

            currentPos.set(x, y, z);
            points.push(currentPos.clone());
        }
        
        return points;
    }

    onLoad() {
        super.onLoad();
        this.createHUD();
    }

    setupInteraction() {
        window.addEventListener('click', this.onMouseClick);
    }

    onUnload() {
        super.onUnload();
        window.removeEventListener('click', this.onMouseClick);
        if (this.viewManager) this.viewManager.setHUD(null);

        // Reset renderer state to ensure next scene uses full canvas
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

    sanitizeData() {
        // Ensure planets have valid numbers to prevent invisible objects
        if (this.planets) {
            this.planets.forEach((p, i) => {
                if (!Number.isFinite(p.orbitalDistance)) p.orbitalDistance = (i + 1) * 0.5;
                if (!Number.isFinite(p.radius)) p.radius = 1.0;
                if (!Number.isFinite(p.orbitSpeed)) p.orbitSpeed = 0.001;
                
                if (p.moons) {
                    p.moons.forEach((m, j) => {
                        if (!Number.isFinite(m.orbitalDistance)) m.orbitalDistance = 0.005 + (j * 0.002);
                        if (!Number.isFinite(m.radius)) m.radius = 0.2;
                    });
                }
            });
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
             name = `${common} | ${formal}`;
             if (aka) name += ` | ${aka}`;
        }
        this.hudElement.innerText = `SYSTEM: ${name} (${total} Bodies)`;
        
        if (this.viewManager) {
            this.viewManager.setHUD(this.hudElement);
        }
    }

    createStars() {
        // Handle single or multiple stars
        let stars = [];
        if (this.systemData.stars && Array.isArray(this.systemData.stars) && this.systemData.stars.length > 0) {
            stars = this.systemData.stars;
        } else {
            // Fallback to single star from basic data
            stars = [{
                radius: 1.0,
                color: this.systemData.starColor || 0xffffaa,
                type: this.systemData.starClass || 'G',
                offset: 0
            }];
        }
        const baseStarSize = this.scales.starSize; // 1000

        stars.forEach((starData, index) => {
            const radius = baseStarSize * (starData.radius || 1.0);
            const geometry = new THREE.SphereGeometry(radius, 64, 64);
            const material = new THREE.MeshBasicMaterial({ 
                color: starData.color || 0xffffaa 
            });
            const starMesh = new THREE.Mesh(geometry, material);
            
            // Calculate Real Position for Star
            let realPos = new THREE.Vector3(0, 0, 0);
            if (stars.length > 1) {
                if (index > 0 || stars.length > 1) { // Offset all stars if binary to orbit center of mass
                    const dist = (baseStarSize * 5) + (starData.offset || 0);
                    const angle = (index - 1) * (Math.PI * 2 / (stars.length - 1));
                    realPos.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
                }
            }

            // Store metadata for update loop
            const starObj = {
                mesh: starMesh,
                realPosition: realPos,
                baseRadius: radius,
                type: 'star',
                data: starData
            };
            this.objects.push(starObj);

            this.scene.add(starMesh);
            this.addStarGlow(starMesh, radius, material.color);

            // Add light source to every star
            const intensity = index === 0 ? 2.0 : 1.0; 
            // Decay 0 ensures light reaches planets despite logarithmic compression distances
            const light = new THREE.PointLight(starData.color || 0xffffaa, intensity, 0, 0); 
            starMesh.add(light);
        });
    }

    addStarGlow(mesh, radius, color) {
        if (SceneTools && SceneTools.createGlowTexture) {
             const spriteMat = new THREE.SpriteMaterial({ 
                map: SceneTools.createGlowTexture(), 
                color: color, 
                transparent: true, 
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                opacity: 0.8
            });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(radius * 12, radius * 12, 1);
            mesh.add(sprite);
        }
    }

    createPlanets() {
        if (!this.planets || !Array.isArray(this.planets)) {
            Logger.warn("StellarSystemScene: No planets data to create.");
            return;
        }
        Logger.message(`StellarSystemScene: Creating ${this.planets.length} planets.`);

        const prng = ProcGen.createPRNG(this.systemData.name || 'planets');

        this.planets.forEach((planetData, index) => {
            // Calculate Distance
            const distance = (planetData.orbitalDistance || 1) * this.scales.orbit;
            
            // Planet Physical Radius (1 Earth Radius = 100 units approx for visibility)
            const planetRadius = this.scales.planetSize * (planetData.radius || 1); 
            
            // Simple Sphere for Stellar System View
            // Ensure color is valid
            let color = new THREE.Color(0x888888);
            if (planetData.color) {
                if (planetData.color.isColor) color = planetData.color;
                else if (planetData.color.h !== undefined) color.setHSL(planetData.color.h, planetData.color.s, planetData.color.l);
                else color.setHex(planetData.color);
            } else {
                color.setHSL(prng.nextDouble(), 0.6, 0.5);
            }

            const geometry = new THREE.SphereGeometry(planetRadius, 32, 32);
            const material = new THREE.MeshStandardMaterial({ 
                color: color,
                roughness: 0.7,
                metalness: 0.1
            });
            const planetMesh = new THREE.Mesh(geometry, material);
            this.scene.add(planetMesh);

            // Add Atmosphere Glow
            if (planetData.atmosphere && planetData.atmosphere !== 'None') {
                const atmoGeo = new THREE.SphereGeometry(planetRadius * 1.2, 32, 32);
                const atmoMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.3, side: THREE.BackSide });
                const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
                planetMesh.add(atmoMesh);
            }

            // Orbit Line Setup
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

            // Store metadata for updates
            const planetObj = {
                mesh: planetMesh,
                orbitLine: orbitLine,
                orbitPointsReal: orbitPoints, // Store real-space points for re-projection
                data: planetData,
                orbitRadius: distance,
                orbitSpeed: (planetData.orbitSpeed || 0.0001) * 5,
                orbitAngle: prng.nextDouble() * Math.PI * 2,
                realPosition: new THREE.Vector3(distance, 0, 0), // Initial
                baseRadius: planetRadius,
                type: 'planet',
                moons: []
            };
            
            // Set initial real position based on random angle
            planetObj.realPosition.set(Math.cos(planetObj.orbitAngle) * distance, 0, Math.sin(planetObj.orbitAngle) * distance);
            
            this.objects.push(planetObj);

            // Moons
            if (planetData.moons) {
                planetData.moons.forEach(moonData => {
                    const moonLOD = new THREE.LOD();
                    this.scene.add(moonLOD);

                    const moonRadius = (moonData.radius || 0.2) * (this.scales.planetSize * 0.3);
                    const moonMeshScale = moonRadius / 2; // Asteroid gen size approx 2

                    let detailedMoonMesh;
                    try {
                         detailedMoonMesh = this.planetGenerator.generateAsteroidMesh(prng.nextDouble(), 2);
                         detailedMoonMesh.scale.setScalar(moonMeshScale);
                    } catch(e) {
                         detailedMoonMesh = new THREE.Mesh(new THREE.SphereGeometry(moonRadius, 8, 8), new THREE.MeshStandardMaterial({color: 0x888888}));
                    }
                    moonLOD.addLevel(detailedMoonMesh, 0);

                    let simpleMoonMesh;
                    try {
                        simpleMoonMesh = new THREE.Mesh(new THREE.SphereGeometry(moonRadius, 8, 8), new THREE.MeshBasicMaterial({color: 0xaaaaaa}));
                    } catch(e) {
                        simpleMoonMesh = new THREE.Mesh(new THREE.SphereGeometry(moonRadius, 4, 4), new THREE.MeshBasicMaterial({color: 0x888888}));
                    }
                    moonLOD.addLevel(simpleMoonMesh, 1000);

                    const moonObj = {
                        mesh: moonLOD,
                        data: moonData,
                        orbitRadius: (moonData.orbitalDistance || 0.002) * 5000 + (planetRadius * 3), // Local orbit
                        orbitSpeed: (moonData.orbitSpeed || 0.01),
                        orbitAngle: prng.nextDouble() * Math.PI * 2,
                        realPosition: new THREE.Vector3(),
                        baseRadius: moonRadius,
                        type: 'moon'
                    };
                    
                    planetObj.moons.push(moonObj);
                    this.objects.push(moonObj);
                });
            }
        });
    }

    createSkybox() {
        const r = 60000; // Within the far plane
        
        // 1. Stars
        const starsGeometry = new THREE.BufferGeometry();
        const starsVertices = [];
        const starsColors = [];
        
        const galaxy = this.gameEngine?.galaxyGenerator?.galaxy;

        if (galaxy && galaxy.stars && galaxy.stars.length > 0) {
            // Use actual galaxy stars for skybox
            const currentPos = new THREE.Vector3(this.starData.x || 0, this.starData.y || 0, this.starData.z || 0);
            
            galaxy.stars.forEach(star => {
                // Skip self (approximate check)
                const dx = star.x - currentPos.x;
                const dy = star.y - currentPos.y;
                const dz = star.z - currentPos.z;
                const distSq = dx*dx + dy*dy + dz*dz;
                
                if (distSq < 100) return; // Skip if too close (self or binary companion handled by scene objects)

                // Project to skybox radius
                const dist = Math.sqrt(distSq);
                const scale = r / dist;
                
                starsVertices.push(dx * scale, dy * scale, dz * scale);
                
                // Color & Brightness
                // Simple distance attenuation for brightness to give depth
                const brightness = Math.min(1.0, 5000 / Math.max(1, dist)); 
                const c = new THREE.Color(star.color);
                starsColors.push(c.r * brightness, c.g * brightness, c.b * brightness);
            });
            
            Logger.message(`StellarSystemScene: Generated skybox from ${galaxy.stars.length} galactic stars.`);
        } else {
            // Fallback: Procedural Random Stars
            const prng = ProcGen.createPRNG(this.systemData.name || 'skybox');
            for (let i = 0; i < 15000; i++) {
                const v = new THREE.Vector3(
                    (prng.nextDouble() - 0.5) * 2,
                    (prng.nextDouble() - 0.5) * 2,
                    (prng.nextDouble() - 0.5) * 2
                ).normalize().multiplyScalar(r);
                starsVertices.push(v.x, v.y, v.z);
                
                // Star Colors (White, Blue, Yellow, Red)
                const colorRoll = prng.nextDouble();
                const color = new THREE.Color();
                if (colorRoll > 0.9) color.setHex(0xffaa88); // Red/Orange
                else if (colorRoll > 0.7) color.setHex(0xffffaa); // Yellow
                else if (colorRoll > 0.5) color.setHex(0xaaddff); // Blue
                else color.setHex(0xffffff); // White
                
                // Randomize brightness slightly
                color.multiplyScalar(0.5 + prng.nextDouble() * 0.5);
                
                starsColors.push(color.r, color.g, color.b);
            }
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starsColors, 3));
        
        const starsMaterial = new THREE.PointsMaterial({ 
            vertexColors: true, 
            size: 3.0, 
            sizeAttenuation: false,
            transparent: true,
            opacity: 1.0
        });
        const starField = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(starField);

        // 2. Background Nebulae (Galactic Match)
        if (this.gameEngine && this.gameEngine.galaxyGenerator && SceneTools && SceneTools.createCloudTexture) {
            const galaxyParams = this.gameEngine.galaxyGenerator.params;
            const galaxySeed = galaxyParams.seed || 'galaxy-visuals';
            // Use 32-bit PRNG to match GalaxyMapScene's visual generation
            const galPrng = ProcGen.create32PRNG(galaxySeed); 

            const sysPos = new THREE.Vector3(this.starData.x || 0, this.starData.y || 0, this.starData.z || 0);
            
            let galaxyRadius = galaxyParams.galaxyRadius;
            if (!Number.isFinite(galaxyRadius) || galaxyRadius < 100000) galaxyRadius = 2000000;
            
            const armCount = Math.max(2, galaxyParams.armCount);
            const winding = galaxyParams.winding;
            const WINDING_SCALE = 8.0;
            let safeWinding = Number(winding);
            if (!Number.isFinite(safeWinding)) safeWinding = 0.35;
            safeWinding = Math.max(-10, Math.min(10, safeWinding));

            const nebulaCount = 2000; 
            const NEBULA_COLORS = [0x6699ff, 0xff33cc, 0x33ffcc, 0xffcc33, 0xff3333, 0x9966ff, 0x33ff66];
            
            const nebulaGroup = new THREE.Group();
            const cloudTex = SceneTools.createCloudTexture();

            for (let i = 0; i < nebulaCount; i++) {
                const effectiveRadius = galaxyRadius * (0.85 + galPrng.nextDouble() * 0.3);
                const rNorm = Math.pow(galPrng.nextDouble(), 0.5); 
                const rad = rNorm * effectiveRadius;

                const armIndex = Math.floor(galPrng.nextDouble() * armCount);
                const armOffset = (Math.PI * 2 / armCount) * armIndex;
                const A = 100;
                let theta = -Math.log((rad + A) / A) * safeWinding * WINDING_SCALE;
                theta += armOffset;
                theta += (galPrng.nextDouble() - 0.5) * 1.5;

                const flare = 1.0 + (rNorm * rNorm * 0.25);
                const z = (galPrng.nextDouble() + galPrng.nextDouble() - 1.0) * galaxyRadius * 0.01 * flare;
                const x = rad * Math.cos(theta);
                const y = rad * Math.sin(theta);

                // Clustering check
                const clusterNoise = ProcGen.simplex2D(x * 0.003, y * 0.003);
                if (clusterNoise < 0.0) continue;

                const nebulaPos = new THREE.Vector3(x, y, z);
                const dist = nebulaPos.distanceTo(sysPos);
                
                // Project onto skybox
                const dir = new THREE.Vector3().subVectors(nebulaPos, sysPos).normalize();
                
                const realSize = (galPrng.nextDouble() * 300 + 150);
                const safeDist = Math.max(dist, 50); 
                
                let spriteScale = (realSize / safeDist) * r * 1.5; 
                if (spriteScale < 20) continue;
                spriteScale = Math.min(spriteScale, r * 1.5);

                const colorInt = NEBULA_COLORS[Math.floor(galPrng.nextDouble() * NEBULA_COLORS.length)];
                const color = new THREE.Color(colorInt);
                const opacity = (0.1 + galPrng.nextDouble() * 0.2) * Math.min(1.0, 50000 / safeDist);

                const spriteMat = new THREE.SpriteMaterial({
                    map: cloudTex,
                    color: color,
                    transparent: true,
                    opacity: opacity,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    rotation: galPrng.nextDouble() * Math.PI * 2
                });

                const sprite = new THREE.Sprite(spriteMat);
                sprite.position.copy(dir.multiplyScalar(r * 0.9)); // Behind local stars
                sprite.scale.set(spriteScale, spriteScale, 1);
                nebulaGroup.add(sprite);
            }
            this.scene.add(nebulaGroup);
        }
    }

    update(time, delta) {
        super.update(time, delta);
        const dt = delta * 0.001;
        const C = this.COMPRESSION_C;
        const camera = this.activeCamera;
        
        // --- 1. Update Real Positions (Simulation) ---
        this.objects.forEach(obj => {
            // Orbit Animation (Real Space)
            if (obj.orbitSpeed && obj.orbitRadius) {
                obj.orbitAngle += obj.orbitSpeed * dt;
                obj.realPosition.x = Math.cos(obj.orbitAngle) * obj.orbitRadius;
                obj.realPosition.z = Math.sin(obj.orbitAngle) * obj.orbitRadius;
            }
        });

        // --- 2. Intro Sequence Logic (Camera Movement) ---
        if (this.introActive && this.homeWorldObj && this.homeWorldObj.realPosition) {
            this.introTime += dt;
            
            // Sample from Precalculated Path
            if (this.introPath.length > 0) {
                const fps = 60;
                const maxIndex = this.introPath.length - 1;
                const exactIndex = this.introTime * fps;
                const index = Math.floor(exactIndex);
                const alpha = exactIndex - index;
                
                if (index < maxIndex) {
                    const pA = this.introPath[index];
                    const pB = this.introPath[index + 1];
                    this.virtualCameraPosition.lerpVectors(pA, pB, alpha);
                } else {
                    this.virtualCameraPosition.copy(this.introPath[maxIndex]);
                }
            }
            
            // Determine LookAt Target (Dynamic)
            const targetObj = (this.flybyObj && this.introTime < 10.0) ? this.flybyObj : this.homeWorldObj;
            const targetRealPos = targetObj.realPosition; // No clone needed, read directly
            
            // Orient Camera to look at the target (Planet)
            // Since Camera is at 0,0,0, we look in the direction of (PlanetReal - VirtualCam)
            const targetLookVec = new THREE.Vector3().subVectors(targetRealPos, this.virtualCameraPosition).normalize();
            // Smoothly interpolate look direction
            this.currentLookAt.lerp(targetLookVec, dt * 2.0);
            const lookAtPoint = this.currentLookAt.clone().multiplyScalar(100); 
            this.activeCamera.lookAt(lookAtPoint);
            
            // Phase Transition / End Intro
            // Check time thresholds instead of 't'
            if (this.flybyObj && this.introPhase === 0 && this.introTime >= 12.0) {
                    this.introPhase = 1;
                    Logger.message(`StellarSystemScene: Flyby of ${this.flybyObj.data.name} complete. Heading to ${this.homeWorldObj.data.name}.`);
            } 
            
            // Check for end of intro independently to handle large time jumps (lag spikes)
            if (this.introTime >= (this.flybyObj ? 22.0 : 20.0)) {
                    this.introActive = false;
                    // Do NOT enable orbit lines here, as we are transitioning away immediately.
                    
                    // Calculate Sun Direction relative to the planet for continuity
                    let sunDirection = null;
                    const starObj = this.objects.find(o => o.type === 'star');
                    if (starObj && this.homeWorldObj) {
                        sunDirection = new THREE.Vector3().subVectors(starObj.realPosition, this.homeWorldObj.realPosition).normalize();
                    }

                    Logger.message("StellarSystemScene: Intro complete. Transitioning to Planetary Orbit.");
                    if (this.viewManager) {
                        this.viewManager.transitionToScene('PlanetaryOrbitScene', { 
                            planet: this.homeWorldObj.data, 
                            system: this.systemData,
                            sunDirection: sunDirection
                        }, { type: 'crossDissolve', duration: 2000 });
                    }
                }
        } else if (this.homeWorldObj && !this.introActive) {
             // LOCK VIRTUAL CAMERA TO PLANET
             // This ensures the planet is always rendered at (0,0,0) Visual Space (or close to it)
             // allowing TrackballControls to rotate around it naturally.
             // Match PlanetaryOrbitScene camera position (0, 200, 800) relative to planet
             const offset = new THREE.Vector3(0, 200, 800);
             this.virtualCameraPosition.copy(this.homeWorldObj.realPosition).add(offset);
        }

        // Update Orrery if active
        if (this.orreryScene) {
            this.orreryScene.update(time, delta);
            this.orreryScene.updateCameraMarker(this.virtualCameraPosition, this.scales.orbit);
        }

        // --- 3. Spatial Compression & Rendering ---
        // Map Real Positions to Visual Positions relative to (0,0,0)

        this.objects.forEach(obj => {
            // 1. Update Planet Mesh Position
            if (obj.mesh) {
                const relVec = new THREE.Vector3().subVectors(obj.realPosition, this.virtualCameraPosition);
                const realDist = relVec.length();

                // Special case: If this is the homeworld and we are locked, skip compression to match next scene
                if (!this.introActive && obj === this.homeWorldObj) {
                    obj.mesh.position.copy(relVec);
                    obj.mesh.scale.setScalar(1.0);
                    return; // Skip compression logic
                }

                // Logarithmic Compression: visualDist = C * log(1 + realDist / C)
                const visualDist = C * Math.log(1 + realDist / C);

                const visualPos = relVec.normalize().multiplyScalar(visualDist);
                obj.mesh.position.copy(visualPos);

                // Scaling to preserve angular size
                let scale = 1.0;
                if (realDist > 0.001) {
                    scale = visualDist / realDist;
                }
                
                // Visibility Boost
                const minAngularSize = 0.001; // Reduced to prevent distant planets from looking too large/clumped
                const minScale = (visualDist * minAngularSize) / (obj.baseRadius || 1);
                if (scale < minScale) scale = minScale;

                obj.mesh.scale.setScalar(scale);
            }

            // 2. Update Orbit Line (Apply Spatial Compression to every point)
            if (obj.orbitLine && obj.orbitPointsReal) {
                obj.orbitLine.visible = !this.introActive; // Hide lines during intro
                const positions = obj.orbitLine.geometry.attributes.position.array;
                const tempVec = new THREE.Vector3();
                
                for (let i = 0; i < obj.orbitPointsReal.length; i++) {
                    const realPt = obj.orbitPointsReal[i];
                    
                    // Calculate relative vector from virtual camera
                    tempVec.subVectors(realPt, this.virtualCameraPosition);
                    const rDist = tempVec.length();
                    
                    // Apply compression
                    const vDist = C * Math.log(1 + rDist / C);
                    
                    // Normalize and scale
                    tempVec.normalize().multiplyScalar(vDist);
                    
                    positions[i * 3] = tempVec.x;
                    positions[i * 3 + 1] = tempVec.y;
                    positions[i * 3 + 2] = tempVec.z;
                }
                obj.orbitLine.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    onMouseClick(event) {
        // Raycast against visual meshes
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.activeCamera);

        // Collect meshes
        const meshes = this.objects.map(o => o.mesh).filter(m => m);
        const intersects = this.raycaster.intersectObjects(meshes, true);

        if (intersects.length > 0) {
            // Find the object belonging to this mesh
            // Note: LOD children are intersected, so we look up the parent LOD
            const hit = intersects[0].object;
            // Traverse up to find the object in our list
            const targetObj = this.objects.find(o => o.mesh === hit || o.mesh.children.includes(hit));
            
            if (targetObj) {
                Logger.message(`Clicked on ${targetObj.data.name}`);
                // Fly to it? Or just select?
                // For now, let's just log it.
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

        // Update Active Camera Controls
        if (this.shouldUpdateControls && this.activeCameraName && this.cameraControls.has(this.activeCameraName)) {
            const controls = this.cameraControls.get(this.activeCameraName);
            if (controls.enabled) {
                controls.update();
            }
        }

        this.update(time, delta);

        if (this.activeCamera && this.renderer) {
            // 1. Render Main Scene
            this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
            this.renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
            this.renderer.setScissorTest(false);
            this.renderer.render(this.scene, this.activeCamera);

            // 2. Render Orrery PiP (Bottom Left) during Intro
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
}
