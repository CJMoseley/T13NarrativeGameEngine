import * as THREE from 'three';
import Logger from '../core/Logger.js';
import { Scene } from '../core/Scene.js';
import { PlanetGenerator } from '../procgen/system/PlanetGenerator.js';
import { SceneTools } from '../core/SceneTools.js';
import { UI } from '../core/ui/UI.js';
import { OrreryScene } from './OrreryScene.js';
import { Controls } from '../core/Controls.js';

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
            orbit: 10000,      // 1 AU = 10,000 units.
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
        this.introStartPos = new THREE.Vector3(0, 5000, 200000); // Start much further out
        // Floating Origin: The Virtual Camera tracks the "Real" position in the simulation
        this.virtualCameraPosition = new THREE.Vector3(0, 5000, 50000); // Start far out
        this.virtualCameraTarget = new THREE.Vector3(0, 0, 0);
        this.currentLookAt = new THREE.Vector3(0, 0, -1); // Track current look direction for smoothing
        this.COMPRESSION_C = 1000.0; // Compression constant. Larger = less compression close up.
        
        this.hudElement = null;
        this.labels = [];
        
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

        this.scene.background = new THREE.Color(0x000000);
        
        // Lighting
        const ambient = new THREE.AmbientLight(0x666666); // Increased ambient to prevent grey/black planets
        this.scene.add(ambient);
        
        // Sun Light - Will be positioned in update to match Star visual position
        this.sunLight = new THREE.PointLight(0xffffff, 2.0, 0, 0); // Infinite range, no decay
        this.scene.add(this.sunLight);

        // Camera Headlamp (ensure planets are visible from all angles in orrery view)
        // Reduced intensity significantly to allow for proper day/night cycles and matching transition
        const headlamp = new THREE.DirectionalLight(0xffffff, 0.05);
        headlamp.position.set(0, 0, 1);
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
            this.homeWorldObj = planets[hwIndex] || planets[0];
            Logger.message(`StellarSystemScene: Homeworld identified as ${this.homeWorldObj.data.name}`);
            
            // Recalculate start position based on system scale
            // Find the furthest planet to ensure we start outside the system
            const maxDist = this.objects.reduce((max, obj) => Math.max(max, obj.orbitRadius || 0), 0);
            this.introStartPos.set(0, maxDist * 0.2, maxDist * 1.5); // Start well outside
            this.virtualCameraPosition.copy(this.introStartPos); // Set initial position
            
            // Identify Flyby Target (Random planet that isn't homeworld)
            const candidates = this.objects.filter(o => o.type === 'planet' && o !== this.homeWorldObj);
            if (candidates.length > 0) {
                this.flybyObj = candidates[Math.floor(Math.random() * candidates.length)];
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
        
        const flybyObj = this.flybyObj ? simObjects.find(o => o.data === this.flybyObj.data) : null;
        const homeObj = simObjects.find(o => o.data === this.homeWorldObj.data);
        
        let currentPos = this.introStartPos.clone();
        let phaseStartPos = this.introStartPos.clone();
        
        // Total duration logic matches update loop
        const totalDuration = (flybyObj) ? 20.0 : 20.0; 
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
            let targetObj = homeObj;
            let duration = 20.0;
            let phaseTime = time;
            let startPos = this.introStartPos;
            let phase = 0;

            if (flybyObj) {
                if (time < 10.0) {
                    targetObj = flybyObj;
                    duration = 10.0;
                    phaseTime = time;
                    startPos = this.introStartPos;
                    phase = 0;
                } else {
                    targetObj = homeObj;
                    duration = 10.0;
                    phaseTime = time - 10.0;
                    // Start pos for phase 2 is the end of phase 1 (approx)
                    // We capture it when we switch phases, or just use the last calculated point
                    if (points.length > 0 && Math.abs(time - 10.0) < dt * 1.5) {
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
            const targetRealPos = targetObj.realPosition;
            const arrivalDist = targetObj.baseRadius * 8.0;
            const targetCamPos = new THREE.Vector3(
                targetRealPos.x, 
                targetRealPos.y + arrivalDist * 0.3, 
                targetRealPos.z + arrivalDist * 0.9
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
        this.labels.forEach(l => l.remove());
        this.labels = [];
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
        this.hudElement.innerText = `SYSTEM: ${this.systemData.name || 'Unknown'} (${total} Bodies)`;
        
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
                if (index > 0) {
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
                type: 'star'
            };
            this.objects.push(starObj);

            this.scene.add(starMesh);
            this.addStarGlow(starMesh, radius, material.color);
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
        if (!this.planets) return;
        Logger.message(`StellarSystemScene: Creating ${this.planets.length} planets.`);

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
                color.setHSL(Math.random(), 0.6, 0.5);
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
                orbitAngle: Math.random() * Math.PI * 2,
                realPosition: new THREE.Vector3(distance, 0, 0), // Initial
                baseRadius: planetRadius,
                type: 'planet',
                moons: []
            };
            
            // Set initial real position based on random angle
            planetObj.realPosition.set(Math.cos(planetObj.orbitAngle) * distance, 0, Math.sin(planetObj.orbitAngle) * distance);
            
            this.createLabel(planetObj);
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
                         detailedMoonMesh = this.planetGenerator.generateAsteroidMesh(Math.random(), 2);
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
                        orbitAngle: Math.random() * Math.PI * 2,
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

    createLabel(obj) {
        const label = document.createElement('div');
        label.className = 'planet-label';
        label.textContent = obj.data.name;
        Object.assign(label.style, {
            position: 'absolute',
            color: '#00ffff',
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            pointerEvents: 'none',
            textShadow: '0 0 2px black',
            display: 'none' // Hidden initially
        });
        document.body.appendChild(label);
        obj.label = label;
        this.labels.push(label);
    }

    createSkybox() {
        const r = 60000; // Within the far plane
        const starsGeometry = new THREE.BufferGeometry();
        const starsVertices = [];
        for (let i = 0; i < 10000; i++) {
            const x = (Math.random() - 0.5) * 2;
            const y = (Math.random() - 0.5) * 2;
            const z = (Math.random() - 0.5) * 2;
            const v = new THREE.Vector3(x, y, z).normalize().multiplyScalar(r);
            starsVertices.push(v.x, v.y, v.z);
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2.0, sizeAttenuation: false });
        const starField = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(starField); // Add to scene so it stays fixed while camera rotates
    }

    update(time, delta) {
        super.update(time, delta);
        const dt = delta * 0.001;
        const C = this.COMPRESSION_C;
        const camera = this.activeCamera;

        // --- 0. Update Sun Light Position ---
        // Move sun light to the visual position of the star so lighting direction is correct
        const starObj = this.objects.find(o => o.type === 'star');
        if (starObj && this.sunLight) {
            const relVec = new THREE.Vector3().subVectors(starObj.realPosition, this.virtualCameraPosition);
            const realDist = relVec.length();
            // Apply same compression as meshes
            const visualDist = C * Math.log(1 + realDist / C);
            const visualPos = relVec.normalize().multiplyScalar(visualDist);
            this.sunLight.position.copy(visualPos);
        }
        
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
            if (this.flybyObj && this.introPhase === 0 && this.introTime >= 10.0) {
                    this.introPhase = 1;
                    Logger.message(`StellarSystemScene: Flyby of ${this.flybyObj.data.name} complete. Heading to ${this.homeWorldObj.data.name}.`);
            } 
            
            // Check for end of intro independently to handle large time jumps (lag spikes)
            if (this.introTime >= (this.flybyObj ? 20.0 : 20.0)) {
                    this.introActive = false;
                    // Ensure orbit lines are visible again
                    this.objects.forEach(obj => {
                        if (obj.orbitLine) obj.orbitLine.visible = true;
                    });
                    
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
             // We offset slightly so we aren't inside it.
             const offset = new THREE.Vector3(0, this.homeWorldObj.baseRadius * 0.5, this.homeWorldObj.baseRadius * 4.0);
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
                const minAngularSize = 0.002; 
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

            // Update Label
            if (obj.label) {
                // Project visual position to screen
                const tempV = obj.mesh.position.clone();
                tempV.project(camera);
                
                // Check if in front of camera
                if (tempV.z < 1) {
                    const x = (tempV.x * .5 + .5) * window.innerWidth;
                    const y = (-(tempV.y * .5) + .5) * window.innerHeight;
                    obj.label.style.left = `${x}px`;
                    obj.label.style.top = `${y}px`;
                    obj.label.style.display = 'block';
                } else {
                    obj.label.style.display = 'none';
                }
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
