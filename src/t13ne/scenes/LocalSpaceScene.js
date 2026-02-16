import * as THREE from 'three';
import Logger from '/src/t13ne/core/Logger.js';
import { Scene } from '/src/t13ne/core/Scene.js';
import { OrreryScene } from '/src/t13ne/scenes/OrreryScene.js';
import { Controls } from '/src/t13ne/core/Controls.js';
import ProcGen from '/src/t13ne/procgen/ProcGen.js';
import { Starbox } from '/src/t13ne/scenes/scenecomponents/Starbox.js';
import { PlanetGenerator } from '/src/t13ne/procgen/system/PlanetGenerator.js';
import { Planet } from '/src/t13ne/scenes/scenecomponents/Planet.js';
import { Star } from '/src/t13ne/scenes/scenecomponents/Star.js';
import { Asteroid } from '/src/t13ne/scenes/scenecomponents/Asteroid.js';
import { SceneTools } from '/src/t13ne/core/SceneTools.js';

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
        this.introActive = true;
        this.introPhase = 0; 
        this.introTime = 0;
        this.homeWorldObj = null;
        this.flybySequenceActive = false;
        this.flybyObj = null;
        this.phaseStartPos = null; 
        this.introStartPos = new THREE.Vector3(0, 1000, 2000); // Default, updated in init
        
        this.virtualCameraPosition = new THREE.Vector3(0, 0, 0); 
        this.virtualCameraTarget = new THREE.Vector3(0, 0, 0);
        this.currentLookAt = new THREE.Vector3(0, 0, -1); 
        this.COMPRESSION_C = 1000.0; 
        
        this.hudElement = null;
        
        this.inputState = {
            forward: false, backward: false, left: false, right: false, up: false, down: false, speed: 100.0
        };

        this.introPath = []; 
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.onMouseClick = this.onMouseClick.bind(this);
        this.orreryScene = null;
        this.starbox = null;
        this.glowTexture = null;
    }

    updateSceneData(data) {
        if (data.systemDetails) this.systemData = data.systemDetails;
        if (data.planets) this.planets = data.planets;
        if (data.star) this.starData = data.star;
        if (data.playIntro !== undefined) this.introActive = data.playIntro;
        
        // Re-initialize the scene with the new data
        this.init();
    }

    async prepare(onProgress) {
        // Removed fallback generation logic. The View expects valid data.
        this.init();
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
        this.activeCamera.near = 10.0; // Increased to prevent Z-fighting on clouds at distance
        this.activeCamera.far = 10000000; // Increased far plane for realistic scales
        this.activeCamera.updateProjectionMatrix();
        this.scene.add(this.activeCamera); 
        
        this.setupControls('trackball', {
            rotateSpeed: 2.0,
            zoomSpeed: 1.2,
            panSpeed: 0.8,
            noZoom: false,
            noPan: true, 
            staticMoving: false,
            dynamicDampingFactor: 0.1
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

        // Identify Homeworld for the Intro
        if (this.objects.length > 0) {
            const hwIndex = this.systemData.homeWorldIndex !== undefined ? this.systemData.homeWorldIndex : 0;
            const planets = this.objects.filter(o => o.type === 'planet');
            this.homeWorldObj = planets[hwIndex] || planets[0] || this.objects.find(o => o.type === 'star');
            
            if (this.homeWorldObj) {
                Logger.message(`LocalSpaceScene: Target identified as ${this.homeWorldObj.data.name}`);
                
                // Determine System Hierarchy for Flyby Logic
                const allPlanets = this.objects.filter(o => o.type === 'planet').sort((a, b) => a.orbitRadius - b.orbitRadius);
                const systemRadius = allPlanets.length > 0 ? allPlanets[allPlanets.length - 1].orbitRadius : 20000;
                const startDist = Math.max(systemRadius * 1.2, 30000); // Ensure we start outside the system
                
                // 1. Handle Moon Homeworlds
                if (this.homeWorldObj.type === 'moon' && this.homeWorldObj.parent) {
                    // Flyby the parent planet first
                    this.flybyObj = this.homeWorldObj.parent;
                    
                    // Start outside the planet's local system, incoming from the star's direction
                    // Vector from Planet to Star is -PlanetPos
                    const planetPos = this.flybyObj.realPosition || new THREE.Vector3(10000, 0, 0);
                    const dirToStar = planetPos.clone().negate().normalize();
                    
                    // Start far out in direction of star
                    this.introStartPos.copy(planetPos).add(dirToStar.multiplyScalar(startDist)).setY(5000);
                
                } else {
                    // 2. Handle Planet Homeworlds
                    const hwIndex = allPlanets.indexOf(this.homeWorldObj);
                    const isOuter = hwIndex >= allPlanets.length / 2;
                    
                    if (isOuter) {
                        // Homeworld is Outer -> Enter from opposite side, Flyby Inner Planet/Star -> Homeworld
                        const innerPlanets = allPlanets.filter(p => p.orbitRadius < this.homeWorldObj.orbitRadius && p !== this.homeWorldObj);
                        
                        if (innerPlanets.length > 0) {
                            // Pick a random inner planet
                            this.flybyObj = innerPlanets[Math.floor(ProcGen.createPRNG(this.systemData.name).nextDouble() * innerPlanets.length)];
                        } else {
                            // Fallback to Star
                            this.flybyObj = this.objects.find(o => o.type === 'star');
                        }

                        // Start Position: Opposite side of system relative to Homeworld
                        // Vector from HW to Center is -HWPos. Continue that vector to edge.
                        const dir = this.homeWorldObj.realPosition.clone().negate().normalize();
                        if (dir.lengthSq() === 0) dir.set(0, 0, 1);
                        this.introStartPos.copy(dir.multiplyScalar(startDist)).setY(5000);

                    } else {
                        // Homeworld is Inner -> Enter from Rim, Flyby Outer Planet -> Homeworld
                        const outerPlanets = allPlanets.filter(p => p.orbitRadius > this.homeWorldObj.orbitRadius && p !== this.homeWorldObj);
                        
                        if (outerPlanets.length > 0) {
                            this.flybyObj = outerPlanets[Math.floor(ProcGen.createPRNG(this.systemData.name).nextDouble() * outerPlanets.length)];
                            
                            if (this.flybyObj) {
                                // Start near the flyby object (Outer Rim) but further out
                                const flybyPos = this.flybyObj.realPosition;
                                const dir = flybyPos.clone().normalize();
                                this.introStartPos.copy(flybyPos).add(dir.multiplyScalar(15000)).setY(5000).setLength(Math.max(startDist, flybyPos.length() + 10000));
                            }
                        } else {
                            // No outer planets? Just start far out
                            this.introStartPos.set(0, 5000, startDist);
                            this.flybyObj = null;
                        }
                    }
                }
                
                this.virtualCameraPosition.copy(this.introStartPos); 
            } else {
                this.introStartPos.set(0, 10000, 20000);
            }
        }

        this.flybySequenceActive = !!this.flybyObj;

        // Reset intro time
        this.introTime = 0;

        this.orreryScene = new OrreryScene(this.viewManager, {
            systemDetails: this.systemData,
            planets: this.planets,
            star: this.starData
        });
        this.orreryScene.init();
        
        this.orreryScene.updateCameraMarker(this.virtualCameraPosition, this.scales.orbit);
        
        if (this.orreryScene.cameraControls.has('orbit')) this.orreryScene.cameraControls.get('orbit').enabled = false;

        Logger.end(funcName);
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
             name = `${common} | ${formal}`;
             if (aka) name += ` | ${aka}`;
        }
        this.hudElement.innerText = `SYSTEM: ${name} (${total} Bodies)`;
        
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
                    const dist = (baseStarSize * 5) + (starData.offset || 0);
                    const angle = (index - 1) * (Math.PI * 2 / (stars.length - 1));
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
            
            const planetMesh = new Planet(planetData, planetRadius, true);
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

    createAsteroids() {
        const count = 400;
        const beltRadius = this.scales.orbit * 2.5; 
        const beltWidth = this.scales.orbit * 0.8;
        
        for(let i=0; i<count; i++) {
            const mesh = new Asteroid(15);
            this.scene.add(mesh);
            
            const angle = Math.random() * Math.PI * 2;
            const dist = beltRadius + (Math.random() - 0.5) * beltWidth;
            const y = (Math.random() - 0.5) * 400; 
            
            const asteroidObj = {
                mesh: mesh,
                realPosition: new THREE.Vector3(Math.cos(angle)*dist, y, Math.sin(angle)*dist),
                orbitRadius: dist,
                orbitSpeed: (0.0002 + Math.random() * 0.0001) * 5, 
                orbitAngle: angle,
                baseRadius: 15,
                type: 'asteroid',
                parent: null
            };
            this.objects.push(asteroidObj);
        }
    }

    createSkybox() {
        const r = 60000; 
        this.starbox = new Starbox(this.gameEngine);
        this.starbox.generate(this.scene, this.starData, r);
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
            depthTest: false, // Always visible behind physical objects if close, but we manage visibility
            depthWrite: false
        });
        obj.sprite = new THREE.Sprite(material);
        this.scene.add(obj.sprite);
    }

    update(time, delta) {
        super.update(time, delta);
        const dt = delta * 0.001;
        const C = this.COMPRESSION_C;

        if (this.starbox) {
            this.starbox.update(time * 0.001);
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
            this.introTime += dt;
            this.updateIntroCamera(this.introTime);

            // Safety Check: Ensure camera isn't inside any object
            this.objects.forEach(obj => {
                const dist = this.virtualCameraPosition.distanceTo(obj.realPosition);
                const minSafe = (obj.baseRadius || 100) * 2.0; // 2x radius safety buffer
                if (dist < minSafe) {
                    const pushDir = this.virtualCameraPosition.clone().sub(obj.realPosition).normalize();
                    if (pushDir.lengthSq() === 0) pushDir.set(0, 1, 0);
                    this.virtualCameraPosition.copy(obj.realPosition).add(pushDir.multiplyScalar(minSafe));
                }
            });
            
            const targetObj = (this.flybyObj && this.introTime < 10.0) ? this.flybyObj : this.homeWorldObj;
            const targetRealPos = targetObj.realPosition; 
            
            const targetLookVec = new THREE.Vector3().subVectors(targetRealPos, this.virtualCameraPosition).normalize();
            this.currentLookAt.lerp(targetLookVec, dt * 2.0);
            const lookAtPoint = this.currentLookAt.clone().multiplyScalar(100); 
            this.activeCamera.lookAt(lookAtPoint);
            
            if (this.flybyObj && this.introPhase === 0 && this.introTime >= 12.0) {
                    this.introPhase = 1;
            } 
            
            if (this.introTime >= (this.flybyObj ? 22.0 : 20.0)) {
                    this.introActive = false;
                    
                    let sunDirection = null;
                    const starObj = this.objects.find(o => o.type === 'star');
                    if (starObj && this.homeWorldObj) {
                        sunDirection = new THREE.Vector3().subVectors(starObj.realPosition, this.homeWorldObj.realPosition).normalize();
                    }

                    Logger.message("LocalSpaceScene: Intro complete. Transitioning to Planetary Orbit.");
                    if (this.viewManager) {
                        this.viewManager.transitionToScene('PlanetaryOrbitScene', { 
                            planet: this.homeWorldObj.data, 
                            system: this.systemData,
                            sunDirection: sunDirection
                        }, { type: 'crossDissolve', duration: 2000 });
                    }
                }
        } else if (this.homeWorldObj && !this.introActive) {
             const offset = new THREE.Vector3(0, 200, 800); 
             if (!this.homeWorldObj.realPosition) {
                 this.homeWorldObj.realPosition = new THREE.Vector3(0,0,0);
             }
             this.virtualCameraPosition.copy(this.homeWorldObj.realPosition).add(offset);
        }

        if (this.orreryScene) {
            this.orreryScene.update(time, delta);
            this.orreryScene.updateCameraMarker(this.virtualCameraPosition, this.scales.orbit);
        }

        // --- 3. Spatial Compression & Rendering ---
        this.objects.forEach(obj => {
            if (obj.mesh) {
                const relVec = new THREE.Vector3().subVectors(obj.realPosition, this.virtualCameraPosition);
                const realDist = relVec.length();

                if (!this.introActive && obj === this.homeWorldObj) {
                    obj.mesh.position.copy(relVec);
                    obj.mesh.scale.setScalar(1.0);
                    return; 
                }

                const visualDist = C * Math.log(1 + realDist / C);
                const visualPos = relVec.normalize().multiplyScalar(visualDist);
                obj.mesh.position.copy(visualPos);

                let scale = 1.0;
                if (realDist > 0.001) {
                    scale = visualDist / realDist;
                }
                
                if (obj.type === 'star' || obj.type === 'planet' || obj.type === 'moon' ) {
                    const minAngularSize = 0.005; 
                    const minScale = (visualDist * minAngularSize) / (obj.baseRadius || 1);
                    if (scale < minScale) scale = minScale;
                }

                obj.mesh.scale.setScalar(scale);

                // LOD / Sprite Switching
                if (obj.sprite) {
                    // If visual distance is very far, show sprite instead of mesh
                    // Threshold: When object is small on screen. 
                    // Simple distance check:
                    const LOD_THRESHOLD = 2000; // Visual units
                    
                    if (visualDist > LOD_THRESHOLD && obj !== this.homeWorldObj) {
                        obj.mesh.visible = false;
                        obj.sprite.visible = true;
                        obj.sprite.position.copy(visualPos);
                        obj.sprite.scale.setScalar(visualDist * 0.02); // Scale sprite to be visible dot
                    } else {
                        obj.mesh.visible = true;
                        obj.sprite.visible = false;
                    }
                }
            }

            if (obj.orbitLine && obj.orbitPointsReal) {
                obj.orbitLine.visible = !this.introActive; 
                const positions = obj.orbitLine.geometry.attributes.position.array;
                const tempVec = new THREE.Vector3();
                
                for (let i = 0; i < obj.orbitPointsReal.length; i++) {
                    const realPt = obj.orbitPointsReal[i];
                    tempVec.subVectors(realPt, this.virtualCameraPosition);
                    const rDist = tempVec.length();
                    const vDist = C * Math.log(1 + rDist / C);
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
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.activeCamera);

        const meshes = this.objects.map(o => o.mesh).filter(m => m);
        const intersects = this.raycaster.intersectObjects(meshes, true);

        if (intersects.length > 0) {
            const hit = intersects[0].object;
            const targetObj = this.objects.find(o => o.mesh === hit || o.mesh.children.includes(hit));
            
            if (targetObj) {
                Logger.message(`Clicked on ${targetObj.data.name}`);
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

    updateIntroCamera(time) {
        const t_flyby_approach = 8.0;
        const t_flyby_exit = 12.0;
        const totalDuration = (this.flybyObj) ? 22.0 : 20.0;
        
        const homePos = this.homeWorldObj ? this.homeWorldObj.realPosition : new THREE.Vector3();
        const homeRadius = (this.homeWorldObj ? this.homeWorldObj.baseRadius : 1000) || 1000;

        if (this.flybySequenceActive) {
            // If flybyObj is null (unloaded), use the last known position or a safe default
            const flybyPos = (this.flybyObj && this.flybyObj.realPosition) ? this.flybyObj.realPosition : (this.phaseStartPos || new THREE.Vector3(10000, 0, 0));
            const flybyRadius = (this.flybyObj && this.flybyObj.baseRadius) ? this.flybyObj.baseRadius : 500;
            const safetyRadius = flybyRadius * 4.0 + 500;

            const toHome = homePos.clone().sub(flybyPos).normalize();
            if (toHome.lengthSq() === 0) toHome.set(1,0,0);
            
            const up = new THREE.Vector3(0, 1, 0);
            const side = new THREE.Vector3().crossVectors(toHome, up).normalize().multiplyScalar(safetyRadius);
            
            // Dynamic Waypoints relative to the moving planet
            const approachPoint = flybyPos.clone().add(side).add(toHome.clone().multiplyScalar(-safetyRadius));
            const exitPoint = flybyPos.clone().add(side).add(toHome.clone().multiplyScalar(safetyRadius));

            if (time < t_flyby_approach) {
                // Phase 1: Approach
                const t = time / t_flyby_approach;
                const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                this.virtualCameraPosition.lerpVectors(this.introStartPos, approachPoint, ease);
                
                // Save state for smooth transition to next phase
                if (!this.phaseStartPos) this.phaseStartPos = new THREE.Vector3();
                this.phaseStartPos.copy(approachPoint);

            } else if (time < t_flyby_exit) {
                // Phase 2: Orbit
                const t = (time - t_flyby_approach) / (t_flyby_exit - t_flyby_approach);
                
                // Linear move alongside planet
                const baseLerp = new THREE.Vector3().lerpVectors(approachPoint, exitPoint, t);
                // Add arc
                const arc = Math.sin(t * Math.PI) * safetyRadius * 0.5;
                const outward = side.clone().normalize().multiplyScalar(arc);
                
                this.virtualCameraPosition.copy(baseLerp).add(outward);
                this.phaseStartPos.copy(this.virtualCameraPosition); // Update for next phase start

            } else {
                // Phase 3: Transit to Homeworld
                // Unload Flyby Object as we have passed it
                if (this.flybyObj.mesh) {
                    this.scene.remove(this.flybyObj.mesh);
                    if (this.flybyObj.orbitLine) this.scene.remove(this.flybyObj.orbitLine);
                    this.flybyObj = null; // Clear reference so we don't try to unload again
                }

                // Calculate offset from HOMWORLD to camera at start of phase
                if (!this.transitStartOffset) {
                    this.transitStartOffset = this.phaseStartPos.clone().sub(homePos);
                }
                const finalOffset = new THREE.Vector3(0, homeRadius * 2.0, homeRadius * 5.0);
                
                const t = Math.max(0, Math.min(1, (time - t_flyby_exit) / (totalDuration - t_flyby_exit)));
                const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // Smooth ease
                
                const currentOffset = new THREE.Vector3().lerpVectors(this.transitStartOffset, finalOffset, ease);
                this.virtualCameraPosition.copy(homePos).add(currentOffset);
            }
        } else {
            // Direct approach
            const finalCamPos = homePos.clone().add(new THREE.Vector3(0, homeRadius * 2.0, homeRadius * 5.0));
            const t = Math.min(1, time / totalDuration);
            const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            
            const mid = this.introStartPos.clone().add(finalCamPos).multiplyScalar(0.5).setY(this.introStartPos.y * 0.5);
            const invT = 1 - ease;
            
            this.virtualCameraPosition.copy(this.introStartPos.clone().multiplyScalar(invT*invT).add(mid.multiplyScalar(2*invT*ease)).add(finalCamPos.multiplyScalar(ease*ease)));
        }
    }
}