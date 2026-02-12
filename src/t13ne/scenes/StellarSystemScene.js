import * as THREE from 'three';
import Logger from '../core/Logger.js';
import { Scene } from '../core/Scene.js';
import { PlanetGenerator } from '../procgen/system/PlanetGenerator.js';
import { SceneTools } from '../core/SceneTools.js';
import { UI } from '../core/ui/UI.js';

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
            planetSize: 1,     // 1:1 Scale multiplier for planets
            starSize: 100,     // Base star radius
            moonOrbit: 200     // Moon orbit scale
        };

        // Intro Sequence State
        this.introActive = true;
        this.introTime = 0;
        this.homeWorldObj = null;
        this.introStartPos = new THREE.Vector3(0, 2000, 80000); // Defined start position
        // Floating Origin & Compression
        this.virtualCameraPosition = new THREE.Vector3(0, 5000, 50000); // Start far out
        this.virtualCameraTarget = new THREE.Vector3(0, 0, 0);
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

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.onMouseClick = this.onMouseClick.bind(this);
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
        const ambient = new THREE.AmbientLight(0x333333);
        this.scene.add(ambient);
        
        // Sun Light
        const sunLight = new THREE.PointLight(0xffffff, 2.0, 0, 0); // Infinite range, no decay
        this.scene.add(sunLight);

        // Camera Headlamp (ensure planets are visible from all angles in orrery view)
        const headlamp = new THREE.DirectionalLight(0xffffff, 0.5);
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
        
        // Disable controls initially for the intro sequence
        this.setupControls('none');

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
            
            // Set initial virtual position relative to homeworld for the "Fly-in"
            // Start high above the system plane
            this.virtualCameraPosition.copy(this.introStartPos);
        }

        this.createHUD();

        Logger.end(funcName);
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
        const baseStarSize = this.scales.starSize;

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
            
            // Generate Planet Mesh
            const lod = new THREE.LOD();
            this.scene.add(lod);

            // Planet Physical Radius (1 Earth Radius = 100 units approx for visibility)
            const planetRadius = (planetData.radius || 1) * 100; 
            
            // High-LOD (close-up view)
            // Generator output is ~10 units. Scale to planetRadius.
            const meshScale = planetRadius / 10;

            // 1. High-LOD (close-up view) - Normalize to Radius 1.0
            let detailedMesh;
            try {
                detailedMesh = this.planetGenerator.generatePlanetMesh(planetData);
                detailedMesh.scale.setScalar(meshScale);
            } catch (e) {
                Logger.warn(`Failed to generate planet mesh for ${planetData.name}. Using fallback.`, e);
                const color = planetData.color ? new THREE.Color().setHSL(planetData.color.h, planetData.color.s, planetData.color.l) : 0x888888;
                detailedMesh = new THREE.Mesh(new THREE.SphereGeometry(planetRadius, 32, 32), new THREE.MeshBasicMaterial({ color: color }));
            }
            lod.addLevel(detailedMesh, 0);

            // 2. Low-LOD (distant orrery view) - Normalize to Radius 1.0
            const color = planetData.color ? new THREE.Color().setHSL(planetData.color.h, planetData.color.s, planetData.color.l) : 0x888888;
            const simpleSphereGeo = new THREE.SphereGeometry(planetRadius, 16, 16);
            const simpleSphereMat = new THREE.MeshBasicMaterial({ 
                color: color
            });
            const simpleMesh = new THREE.Mesh(simpleSphereGeo, simpleSphereMat);
            lod.addLevel(simpleMesh, 2000); // Switch distance

            // Store metadata for updates
            const planetObj = {
                mesh: lod,
                data: planetData,
                orbitRadius: distance,
                orbitSpeed: (planetData.orbitSpeed || 0.0001) * 5,
                orbitAngle: Math.random() * Math.PI * 2,
                realPosition: new THREE.Vector3(distance, 0, 0), // Initial
                baseRadius: planetRadius,
                type: 'planet',
                moons: []
            };
            this.createLabel(planetObj);
            this.objects.push(planetObj);

            // Moons
            if (planetData.moons) {
                planetData.moons.forEach(moonData => {
                    const moonLOD = new THREE.LOD();
                    this.scene.add(moonLOD);

                    const moonRadius = (moonData.radius || 0.2) * 100;
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
                        orbitRadius: (moonData.orbitalDistance || 0.002) * this.scales.orbit + (planetRadius * 2), // Distance from planet
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

        // --- 1. Update Real Positions (Simulation) ---
        this.objects.forEach(obj => {
            // Orbit Animation
            if (obj.orbitGroup && obj.speed) {
                obj.orbitGroup.rotation.y += obj.speed * dt;
            }

            // Update LOD objects
            if (obj.lod) {
                obj.lod.update(this.activeCamera);
            }
        });

        // --- 2. Intro Sequence Logic (Camera Movement) ---
        if (this.introActive && this.homeWorldObj) {
            this.introTime += dt;
            const duration = 12.0; // 12 seconds flyby
            const t = Math.min(this.introTime / duration, 1.0);
            
            // Ease out cubic for smooth arrival
            const ease = 1 - Math.pow(1 - t, 3);
            
            // Target Position: Near the homeworld
            const targetRealPos = this.homeWorldObj.realPosition.clone();
            // Offset: Position camera to look at planet from a nice angle
            const offset = new THREE.Vector3(200, 100, 200).normalize().multiplyScalar(this.homeWorldObj.baseRadius * 4.0);
            const targetCamPos = targetRealPos.clone().add(offset);
            
            // Interpolate Virtual Camera Position
            this.virtualCameraPosition.lerpVectors(this.introStartPos, targetCamPos, ease);
            
            // Look at the planet
            // Calculate direction from virtual camera to real planet position
            const lookDir = new THREE.Vector3().subVectors(targetRealPos, this.virtualCameraPosition).normalize();
            // Apply that direction to the actual camera (which is at 0,0,0)
            const lookAtPos = new THREE.Vector3().addVectors(this.activeCamera.position, lookDir);
            this.activeCamera.lookAt(lookAtPos);
            
            // End Intro
            if (t >= 1.0) {
                this.introActive = false;
                Logger.message("StellarSystemScene: Intro complete. Handing over controls.");
                
                // Enable orbit controls around the planet
                // Note: OrbitControls target needs to be updated in the loop as the planet moves
                this.setupControls('orbit', {
                    target: new THREE.Vector3(0,0,0), // Will be updated in loop
                    maxDistance: 50000, 
                    minDistance: this.homeWorldObj.baseRadius * 1.2,
                    zoomSpeed: 1.0,
                    enableDamping: true
                });
            }
        } else if (this.homeWorldObj && !this.introActive) {
             // Keep the camera controls target locked on the moving planet
             // In Floating Origin, the planet is visually at 'mesh.position'.
             // But OrbitControls moves the camera. 
             // Actually, for OrbitControls to work in Floating Origin, we usually lock the camera to 0,0,0 
             // and rotate the world. But standard OrbitControls moves the camera.
             // For now, let's just let OrbitControls work normally relative to the visual position.
             const controls = this.cameraControls.get(this.activeCameraName);
             if (controls && this.homeWorldObj.mesh) {
                 controls.target.copy(this.homeWorldObj.mesh.position);
             }
        }

        // --- 3. Spatial Compression & Rendering ---
        // Map Real Positions to Visual Positions relative to (0,0,0)
        // const cameraPos = this.activeCamera.position; // Should be 0,0,0 usually

        this.objects.forEach(obj => {
            if (!obj.mesh) return;

            // Vector from Virtual Camera to Object
            // If OrbitControls moved the actual camera, we must account for that, 
            // but ideally we keep actual camera at 0,0,0 and move virtual camera.
            // For simplicity in this hybrid mode:
            // Real Vector = ObjectRealPos - VirtualCamPos
            const relVec = new THREE.Vector3().subVectors(obj.realPosition, this.virtualCameraPosition);
            const realDist = relVec.length();

            // Logarithmic Compression
            // visualDist = C * log(1 + realDist / C)
            const visualDist = C * Math.log(1 + realDist / C);

            // Direction is preserved
            const visualPos = relVec.normalize().multiplyScalar(visualDist);
            
            // Apply to mesh
            obj.mesh.position.copy(visualPos);

            // Scaling
            // To preserve angular size: scale = visualDist / realDist
            let scale = 1.0;
            if (realDist > 0.001) {
                scale = visualDist / realDist;
            }
            
            // Visibility Boost (Orrery Effect) for distant objects
            const minAngularSize = 0.005; // Increased for visibility
            const minScale = (visualDist * minAngularSize) / (obj.baseRadius || 1);
            if (scale < minScale) scale = minScale;

            obj.mesh.scale.setScalar(scale);
            
            // Update LOD
            if (obj.mesh.update) obj.mesh.update(camera);

            // Update Label
            if (obj.label) {
                // Project visual position to screen
                const tempV = visualPos.clone();
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
}
