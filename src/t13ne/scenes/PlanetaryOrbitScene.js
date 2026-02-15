import * as THREE from 'three';
import Logger from '../core/Logger.js';
import { Scene } from '../core/Scene.js';
import { PlanetGenerator } from '../procgen/system/PlanetGenerator.js';
import { SceneTools } from '../core/SceneTools.js';
import ProcGen from '../procgen/ProcGen.js';
import { PlanetSurfaceEnvironment } from '../procgen/planet/PlanetSurfaceEnvironment.js';
import { PlanetaryRenderer } from '../rendering/PlanetaryRenderer.js';

export class PlanetaryOrbitScene extends Scene {
    constructor(viewManager, sceneData) {
        super(viewManager, sceneData);
        // Expect sceneData to be the planet object or contain it
        this.planetData = sceneData.planet || sceneData || {};
        this.systemData = sceneData.system || {};
        
        this.planetGenerator = new PlanetGenerator(null);
        this.objects = [];
        
        // Configuration for cinematic feel
        this.scales = {
            planetRadius: 100, // Visual radius for the main planet
            moonScale: 0.2     // Scale of moons relative to planet
        };
        
        // Sun position for dramatic lighting
        if (sceneData.sunDirection) {
            this.sunPosition = sceneData.sunDirection.clone().normalize().multiplyScalar(1000);
        } else if (!this.sunPosition) {
            this.sunPosition = new THREE.Vector3(-800, 200, -500); 
        }
        
        this.asteroidObj = null;
        this.moons = [];
        this.planetMesh = null;
        this.atmosphereMesh = null;
        
        this.introActive = true;
        this.introTime = 0;
        this.infoPanel = null;
        this.shipSceneReady = false;
    }

    async prepare(onProgress) {
        this.scene.background = new THREE.Color(0x000000);
        this.setupLighting();
        this.setupCamera();
        // Defer heavy generation to onLoad to prevent hanging the previous scene's transition
        if (onProgress) onProgress({ status: 'Orbit Achieved', percent: 1.0 });
    }

    setupLighting() {
        const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
        sunLight.position.copy(this.sunPosition);
        sunLight.castShadow = true;
        this.scene.add(sunLight);
        
        const ambient = new THREE.AmbientLight(0x111111, 0.4); // Increased ambient to prevent pitch black shadows
        this.scene.add(ambient);
        
        const rimLight = new THREE.DirectionalLight(0x445566, 0.8);
        rimLight.position.set(-1, 0, -1).normalize();
        this.scene.add(rimLight);
    }

    setupCamera() {
        this.activeCamera.position.set(0, 200, 800);
        this.activeCamera.lookAt(0, 0, 0);
        this.activeCamera.near = 0.1;
        this.activeCamera.far = 20000;
        this.activeCamera.updateProjectionMatrix();
        this.scene.add(this.activeCamera);
        
        const camLight = new THREE.PointLight(0xffffff, 0.4);
        this.activeCamera.add(camLight);
        
        this.setupControls('orbit', {
            target: new THREE.Vector3(0, 0, 0),
            enableDamping: true,
            dampingFactor: 0.05,
            minDistance: 120,
            maxDistance: 1000,
            autoRotate: true,
            autoRotateSpeed: 0.2
        });
    }

    async onLoad() {
        const funcName = 'PlanetaryOrbitScene.onLoad';
        Logger.start(funcName);
        
        if (!this.planetData) {
            Logger.error("PlanetaryOrbitScene: No planet data provided.");
        }

        this.createSkybox();
        await new Promise(r => setTimeout(r, 0)); // Yield to event loop
        
        this.createSunVisual();
        await new Promise(r => setTimeout(r, 0)); // Yield
        
        this.createMainPlanet();
        await new Promise(r => setTimeout(r, 0)); // Yield
        
        this.createMoons();
        await new Promise(r => setTimeout(r, 0)); // Yield
        
        this.createCinematicAsteroid();
        this.createPlanetInfoPanel();

        super.onLoad();
        Logger.end(funcName);
    }

    createSkybox() {
        const r = 20000; // Increased radius for better depth
        const starsGeometry = new THREE.BufferGeometry();
        const starsVertices = [];
        const starsColors = [];

        // Try to use actual galaxy stars if available via systemData
        const galaxy = this.viewManager?.gameEngine?.galaxyGenerator?.galaxy;
        const currentStar = this.systemData.star;

        if (galaxy && galaxy.stars && currentStar) {
            const currentPos = new THREE.Vector3(currentStar.x || 0, currentStar.y || 0, currentStar.z || 0);
            
            galaxy.stars.forEach(star => {
                const dx = star.x - currentPos.x;
                const dy = star.y - currentPos.y;
                const dz = star.z - currentPos.z;
                const distSq = dx*dx + dy*dy + dz*dz;
                
                if (distSq < 100) return; // Skip self

                const dist = Math.sqrt(distSq);
                const scale = r / dist;
                
                starsVertices.push(dx * scale, dy * scale, dz * scale);
                
                const brightness = Math.min(1.0, 5000 / Math.max(1, dist)); 
                const c = new THREE.Color(star.color);
                starsColors.push(c.r * brightness, c.g * brightness, c.b * brightness);
            });
            Logger.message(`PlanetaryOrbitScene: Generated skybox from galaxy data.`);
        } else {
            // Fallback
            const prng = ProcGen.createPRNG(this.planetData.name || 'skybox');
            for (let i = 0; i < 5000; i++) {
                const v = new THREE.Vector3(
                    (prng.nextDouble() - 0.5) * 2,
                    (prng.nextDouble() - 0.5) * 2,
                    (prng.nextDouble() - 0.5) * 2
                ).normalize().multiplyScalar(r);
                starsVertices.push(v.x, v.y, v.z);
                starsColors.push(1, 1, 1);
            }
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starsColors, 3));
        const starsMaterial = new THREE.PointsMaterial({ vertexColors: true, size: 2, sizeAttenuation: false, transparent: true });
        const starField = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(starField);

        // Add Nebulae (Copy of StellarSystemScene logic for consistency)
        if (this.viewManager?.gameEngine?.galaxyGenerator && SceneTools && SceneTools.createCloudTexture && currentStar) {
            const galaxyParams = this.viewManager.gameEngine.galaxyGenerator.params;
            const galPrng = ProcGen.create32PRNG(galaxyParams.seed || 'galaxy-visuals');
            const sysPos = new THREE.Vector3(currentStar.x || 0, currentStar.y || 0, currentStar.z || 0);
            
            let galaxyRadius = galaxyParams.galaxyRadius || 2000000;
            const armCount = Math.max(2, galaxyParams.armCount);
            const winding = galaxyParams.winding || 0.35;
            const WINDING_SCALE = 8.0;
            const NEBULA_COLORS = [0x6699ff, 0xff33cc, 0x33ffcc, 0xffcc33, 0xff3333, 0x9966ff, 0x33ff66];
            const cloudTex = SceneTools.createCloudTexture();
            const nebulaGroup = new THREE.Group();

            for (let i = 0; i < 1000; i++) { // Reduced count for performance
                const effectiveRadius = galaxyRadius * (0.85 + galPrng.nextDouble() * 0.3);
                const rNorm = Math.pow(galPrng.nextDouble(), 0.5); 
                const rad = rNorm * effectiveRadius;
                const armIndex = Math.floor(galPrng.nextDouble() * armCount);
                const armOffset = (Math.PI * 2 / armCount) * armIndex;
                const A = 100;
                let theta = -Math.log((rad + A) / A) * winding * WINDING_SCALE + armOffset + (galPrng.nextDouble() - 0.5) * 1.5;
                const z = (galPrng.nextDouble() + galPrng.nextDouble() - 1.0) * galaxyRadius * 0.01;
                const x = rad * Math.cos(theta);
                const y = rad * Math.sin(theta);

                const nebulaPos = new THREE.Vector3(x, y, z);
                const dist = nebulaPos.distanceTo(sysPos);
                const dir = new THREE.Vector3().subVectors(nebulaPos, sysPos).normalize();
                
                const spriteScale = Math.min((300 / Math.max(dist, 50)) * r * 1.5, r * 1.5);
                if (spriteScale < 20) continue;

                const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                    map: cloudTex, color: NEBULA_COLORS[Math.floor(galPrng.nextDouble() * NEBULA_COLORS.length)],
                    transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false
                }));
                sprite.position.copy(dir.multiplyScalar(r * 0.9));
                sprite.scale.set(spriteScale, spriteScale, 1);
                nebulaGroup.add(sprite);
            }
            this.scene.add(nebulaGroup);
        }
    }

    createSunVisual() {
        const stars = this.systemData.stars && this.systemData.stars.length > 0 
            ? this.systemData.stars 
            : [{ color: this.systemData.starColor || 0xffffee, radius: 1.0 }];

        // Calculate a basis for offsetting stars perpendicular to the sun direction
        const sunDir = this.sunPosition.clone().normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(sunDir, up).normalize();
        if (right.lengthSq() < 0.01) right.set(1, 0, 0); // Handle vertical sun
        
        let map = null;
        if (SceneTools && typeof SceneTools.createGlowTexture === 'function') {
             map = SceneTools.createGlowTexture();
        }
        
        if (!map) {
            const canvas = document.createElement('canvas');
            canvas.width = 32; canvas.height = 32;
            const context = canvas.getContext('2d');
            const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            context.fillStyle = gradient;
            context.fillRect(0, 0, 32, 32);
            map = new THREE.CanvasTexture(canvas);
        }

        stars.forEach((star, i) => {
            const starColor = star.color || 0xffffee;
            const radius = (star.radius || 1.0) * 50; 
            
            const sunGeo = new THREE.SphereGeometry(radius, 32, 32);
            const sunMat = new THREE.MeshBasicMaterial({ color: starColor });
            const sunMesh = new THREE.Mesh(sunGeo, sunMat);
            
            // Offset multiple stars slightly
            const offset = right.clone().multiplyScalar((i - (stars.length - 1) / 2) * 300);
            sunMesh.position.copy(this.sunPosition).add(offset);
            
            this.scene.add(sunMesh);

            const spriteMat = new THREE.SpriteMaterial({ 
                map: map,
                color: starColor,
                transparent: true, 
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(radius * 12, radius * 12, 1);
            sunMesh.add(sprite);
        });
    }

    createMainPlanet() {
        Logger.message(`PlanetaryOrbitScene: Generating planet ${this.planetData.name || 'Unknown'}`);

        // Ensure we have some data to work with
        const pData = {
            name: this.planetData.name || 'Unknown World',
            radius: this.planetData.radius || 1.0,
            type: this.planetData.type || 'Terrestrial',
            resources: this.planetData.resources || [],
            atmosphere: this.planetData.atmosphere || 'Nitrogen-Oxygen',
            color: this.planetData.color
        };

        let planetGroup = new THREE.Group();
        
        // 1. Surface Sphere with Generated Texture
        const geometry = new THREE.SphereGeometry(10, 64, 64);
        let surfaceMap;
        try {
            surfaceMap = this.createPlanetTexture(pData.color);
        } catch (e) {
            Logger.warn("PlanetaryOrbitScene: Failed to generate texture, using fallback.", e);
            surfaceMap = null;
        }
        
        // Robust Color Handling
        let baseColor = 0x228833;
        if (pData.color) {
            if (pData.color.isColor) baseColor = pData.color;
            else if (pData.color.h !== undefined) baseColor = new THREE.Color().setHSL(pData.color.h, pData.color.s, pData.color.l);
            else baseColor = new THREE.Color(pData.color);
        }

        const material = new THREE.MeshStandardMaterial({
            map: surfaceMap,
            color: surfaceMap ? 0xffffff : baseColor,
            roughness: 0.8,
            metalness: 0.1
        });
        const surfaceMesh = new THREE.Mesh(geometry, material);
        planetGroup.add(surfaceMesh);

        // 2. Cloud Sphere
        this.createAtmosphere(planetGroup);

        // Scale Logic:
        // Base geometry radius is 10.
        // We want final radius to be this.scales.planetRadius (100).
        const generatedRadius = 10;
        const targetRadius = this.scales.planetRadius * (this.planetData.radius || 1.0);
        const scale = targetRadius / generatedRadius;
        
        planetGroup.scale.setScalar(scale);
        planetGroup.position.set(0, 0, 0);
        
        // Ensure shadows are cast/received
        planetGroup.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        this.scene.add(planetGroup);
        this.planetMesh = planetGroup;
    }

    createPlanetTexture(colorData) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Base Color
        const baseColor = new THREE.Color();
        if (colorData && colorData.h !== undefined) {
            baseColor.setHSL(colorData.h, colorData.s, colorData.l);
        } else if (colorData) {
            baseColor.set(colorData);
        } else {
            baseColor.setHex(0x228833);
        }
        
        ctx.fillStyle = `#${baseColor.getHexString()}`;
        ctx.fillRect(0, 0, 512, 256);
        
        const prng = ProcGen.createPRNG(this.planetData.name || 'texture');

        // Add Bands/Noise for patterning
        for (let i = 0; i < 40; i++) {
            const y = prng.nextDouble() * 256;
            const h = prng.nextDouble() * 40 + 5;
            ctx.fillStyle = `rgba(255, 255, 255, ${prng.nextDouble() * 0.15})`;
            ctx.fillRect(0, y, 512, h);
            
            ctx.fillStyle = `rgba(0, 0, 0, ${prng.nextDouble() * 0.15})`;
            ctx.fillRect(0, prng.nextDouble() * 256, 512, prng.nextDouble() * 40 + 5);
        }
        
        return new THREE.CanvasTexture(canvas);
    }

    createAtmosphere(group) {
        const cloudGeo = new THREE.SphereGeometry(10.15, 64, 64);
        let cloudMap = null;
        if (SceneTools && typeof SceneTools.createCloudTexture === 'function') {
             cloudMap = SceneTools.createCloudTexture();
        }
        
        const cloudMat = new THREE.MeshStandardMaterial({
            map: cloudMap,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        this.atmosphereMesh = new THREE.Mesh(cloudGeo, cloudMat);
        group.add(this.atmosphereMesh);
    }

    createMoons() {
        if (!this.planetData.moons || this.planetData.moons.length === 0) return;

        Logger.message(`PlanetaryOrbitScene: Creating ${this.planetData.moons.length} moons.`);
        this.moons = [];

        const prng = ProcGen.createPRNG(this.planetData.name || 'moons');
        
        // Ensure at least one moon for the cinematic shot
        if (this.planetData.moons.length === 0) {
            this.planetData.moons.push({ name: 'Cinematic Moon', radius: 0.2 });
        }

        this.planetData.moons.forEach((moonData, index) => {
            let moonMesh;
            const isRound = (moonData.radius && moonData.radius > 0.1); 
            
            try {
                if (isRound) {
                    moonMesh = this.planetGenerator.generatePlanetMesh(moonData);
                } else {
                    const moonSeed = this._stringToSeed(moonData.name || `moon_${index}`);
                    moonMesh = this.planetGenerator.generateAsteroidMesh(moonSeed, 5);
                }
            } catch (e) {
                moonMesh = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 16), new THREE.MeshStandardMaterial({ color: 0x888888 }));
            }
            
            // Scale moon
            const moonVisualRadius = this.scales.planetRadius * (moonData.radius || 0.2);
            const genRadius = isRound ? (moonData.radius || 0.2) * 10 : 5; 
            const scale = moonVisualRadius / genRadius;
            
            moonMesh.scale.setScalar(scale);
            
            // Position moon in a cinematic orbit (closer than reality)
            // Stagger distances
            const distance = this.scales.planetRadius * 1.8 + (index * 60);
            // Position the first moon to be between camera and planet roughly, or to the side
            const angle = index === 0 ? Math.PI * 0.8 : prng.nextDouble() * Math.PI * 2;
            const inclination = (prng.nextDouble() - 0.5) * 0.5; // Radians
            
            moonMesh.position.set(
                Math.cos(angle) * distance,
                Math.sin(angle) * distance * Math.sin(inclination),
                Math.sin(angle) * distance * Math.cos(inclination)
            );
            
            moonMesh.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.scene.add(moonMesh);
            
            this.moons.push({
                mesh: moonMesh,
                distance: distance,
                angle: angle,
                inclination: inclination,
                speed: 0.1 / (index + 1) // Slower for outer moons
            });
            
            // Set camera to the first moon for cinematic view
            if (index === 0) {
                const moonPos = moonMesh.position.clone();
                const planetPos = new THREE.Vector3(0, 0, 0);
                const dir = new THREE.Vector3().subVectors(planetPos, moonPos).normalize();
                
                // Position camera on surface facing planet
                const camPos = moonPos.clone().add(dir.multiplyScalar(scale * 6)); // Slightly above surface
                this.activeCamera.position.copy(camPos);
                this.activeCamera.lookAt(planetPos);
                
                // Update controls target to planet
                if (this.cameraControls.has('orbit')) {
                    this.cameraControls.get('orbit').target.copy(planetPos);
                }
            }
        });
    }

    createCinematicAsteroid() {
        // A cinematic asteroid passing by in the foreground
        const prng = ProcGen.createPRNG(this.planetData.name || 'asteroid');
        const asteroid = this.planetGenerator.generateAsteroidMesh(prng.nextDouble(), 3);
        asteroid.scale.setScalar(3.0); 
        
        // Start position: Off screen to the left
        this.asteroidObj = {
            mesh: asteroid,
            velocity: new THREE.Vector3(15, 2, 5), // Moving right and slightly up/forward
            rotation: new THREE.Vector3(0.2, 0.3, 0.1)
        };
        
        asteroid.position.set(-400, -50, 200); 
        asteroid.castShadow = true;
        asteroid.receiveShadow = true;
        this.scene.add(asteroid);
    }
    
    async preloadShipScene() {
        // Wait a few seconds for the user to settle in and read the panel
        // This ensures the initial transition and animations are smooth
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        Logger.message("PlanetaryOrbitScene: Pre-loading ShipShowcaseScene in background...");
        try {
            // Prepare the scene (heavy lifting happens here)
            const shipScene = await this.viewManager.sceneManager.prepareScene('ShipShowcaseScene', {}, (p) => {});
            
            if (shipScene) {
                this.viewManager.addSceneToCache('ShipShowcaseScene', shipScene);
                Logger.message("PlanetaryOrbitScene: ShipShowcaseScene cached and ready.");
                this.shipSceneReady = true;
            }
        } catch (e) {
            Logger.warn("PlanetaryOrbitScene: Failed to preload ship scene.", e);
        }
    }

    async createPlanetInfoPanel() {
        // Yield to allow frame render before generating UI
        await new Promise(r => setTimeout(r, 100));

        const seed = this.planetData.name ? this._stringToSeed(this.planetData.name) : 12345;
        const prng = ProcGen.createPRNG(seed);

        // Generate Lore Data
        // Use actual system data if available, otherwise fallback
        const species = this.systemData.species || this.planetData.species || "Unknown Species";
        const society = this.systemData.society || "Unknown Society";
        
        const description = this.planetData.description || "A mysterious world.";

        // Define POI (Point of Interest) for the UI
        let poi = "Unknown Anomaly";
        if (this.planetData.resources && this.planetData.resources.length > 0) {
            poi = `Resource Deposit: ${this.planetData.resources[0].name}`;
        } else if (this.planetData.biosphere && this.planetData.biosphere !== 'None') {
            poi = `Life Sign: ${this.planetData.biosphere}`;
        } else if (this.planetData.type) {
            poi = `Geological Feature: ${this.planetData.type}`;
        }

        // Create Panel Container
        const panel = document.createElement('div');
        Object.assign(panel.style, {
            position: 'absolute',
            top: '15%',
            right: '5%',
            width: '320px',
            padding: '20px',
            backgroundColor: 'rgba(0, 15, 30, 0.85)',
            border: '1px solid #00aaff',
            boxShadow: '0 0 15px rgba(0, 170, 255, 0.3)',
            color: '#e0f0ff',
            fontFamily: '"Orbitron", "Courier New", monospace',
            zIndex: '100',
            borderRadius: '5px',
            backdropFilter: 'blur(5px)',
            transition: 'opacity 1s'
        });

        // Header
        panel.innerHTML = `
            <h2 style="margin: 0 0 10px 0; color: #00ffff; text-transform: uppercase; font-size: 1.2em; border-bottom: 1px solid #005588; padding-bottom: 5px;">
                ${this.planetData.name || 'Unknown World'}
            </h2>
            <div style="font-size: 0.9em; margin-bottom: 15px; color: #aaccff;">
                <div><strong>Type:</strong> ${this.planetData.type || 'Terrestrial'}</div>
                <div><strong>Atmosphere:</strong> ${this.planetData.atmosphere || 'Breathable'}</div>
                <div><strong>Gravity:</strong> ${(0.5 + prng.nextDouble()).toFixed(2)} G</div>
            </div>
        `;

        // Species Section
        const speciesDiv = document.createElement('div');
        speciesDiv.style.marginBottom = '15px';
        speciesDiv.innerHTML = `<div style="color:#00ffff; font-size:0.9em; margin-bottom:5px;">DOMINANT SPECIES: ${species}</div>
                                <div style="color:#aaccff; font-size:0.8em; margin-bottom:5px;">SOCIETY: ${society}</div>`;
        
        // Procedural Avatar Canvas
        const avCanvas = document.createElement('canvas');
        avCanvas.width = 64; avCanvas.height = 64;
        avCanvas.style.border = '1px solid #005588';
        avCanvas.style.float = 'left';
        avCanvas.style.marginRight = '10px';
        avCanvas.style.backgroundColor = '#000';
        const avCtx = avCanvas.getContext('2d');
        
        // Draw Alien Face
        const skinHue = Math.floor(prng.nextDouble() * 360);
        avCtx.fillStyle = `hsl(${skinHue}, 60%, 40%)`;
        avCtx.beginPath();
        avCtx.ellipse(32, 32, 20, 28, 0, 0, Math.PI * 2);
        avCtx.fill();
        // Eyes
        avCtx.fillStyle = '#000'; // Sclera
        avCtx.beginPath(); avCtx.ellipse(24, 28, 6, 4, 0.2, 0, Math.PI*2); avCtx.fill();
        avCtx.beginPath(); avCtx.ellipse(40, 28, 6, 4, -0.2, 0, Math.PI*2); avCtx.fill();
        avCtx.fillStyle = '#fff'; // Pupil
        avCtx.beginPath(); avCtx.arc(24, 28, 2, 0, Math.PI*2); avCtx.fill();
        avCtx.beginPath(); avCtx.arc(40, 28, 2, 0, Math.PI*2); avCtx.fill();
        
        speciesDiv.insertBefore(avCanvas, speciesDiv.firstChild);
        speciesDiv.innerHTML += `<div style="clear:both;"></div>`; // Clear float
        panel.appendChild(speciesDiv);

        // POI Section
        const poiDiv = document.createElement('div');
        poiDiv.innerHTML = `<div style="color:#00ffff; font-size:0.9em; margin-bottom:5px;">SCAN DETECTED: ${poi}</div>`;
        
        // Procedural Landscape Canvas
        const landCanvas = document.createElement('canvas');
        landCanvas.width = 280; landCanvas.height = 100;
        landCanvas.style.border = '1px solid #005588';
        landCanvas.style.width = '100%';
        const lCtx = landCanvas.getContext('2d');
        
        // Sky
        const skyGrad = lCtx.createLinearGradient(0,0,0,100);
        skyGrad.addColorStop(0, '#001133');
        skyGrad.addColorStop(1, '#003366');
        lCtx.fillStyle = skyGrad;
        lCtx.fillRect(0,0,280,100);
        
        // Terrain
        lCtx.fillStyle = '#112211';
        lCtx.beginPath();
        lCtx.moveTo(0, 100);
        for(let x=0; x<=280; x+=10) {
            lCtx.lineTo(x, 60 + Math.sin(x * 0.05 + seed) * 20);
        }
        lCtx.lineTo(280, 100);
        lCtx.fill();
        
        // Structure
        lCtx.fillStyle = '#000';
        lCtx.fillRect(120, 40, 40, 60); // Silhouette
        lCtx.fillStyle = '#00ffff'; // Windows/Lights
        lCtx.fillRect(130, 50, 5, 5);
        lCtx.fillRect(145, 60, 5, 5);

        poiDiv.appendChild(landCanvas);
        panel.appendChild(poiDiv);

        // Progress Bar / Status
        const statusDiv = document.createElement('div');
        statusDiv.style.marginTop = '15px';
        statusDiv.style.fontSize = '0.8em';
        statusDiv.style.color = '#00ff00';
        statusDiv.innerText = "ORBITAL SCAN COMPLETE. PREPARING LANDING...";
        panel.appendChild(statusDiv);

        document.body.appendChild(panel);
        this.infoPanel = panel;
        
        // Trigger ship preload now that UI is up
        this.preloadShipScene();
        
        // Trigger Surface Generation
        setTimeout(() => this.generateSurfaceSnapshot(landCanvas), 100);
    }

    async generateSurfaceSnapshot(container) {
        const width = 280;
        const height = 150;
        
        // Create a separate scene for the snapshot
        const surfaceScene = new THREE.Scene();
        surfaceScene.background = new THREE.Color(0x1a2b34);
        
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 50, 100);
        camera.lookAt(0, 0, 0);
        
        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        surfaceScene.add(ambient);
        const dir = new THREE.DirectionalLight(0xffffff, 1.0);
        dir.position.set(50, 100, 50);
        surfaceScene.add(dir);
        
        try {
            // Ensure seeds exist for surface generation
            if (!this.planetData.seeds || !Array.isArray(this.planetData.seeds)) {
                const seed = this._stringToSeed(this.planetData.name || 'surface');
                // Normalize to 0-1 range
                const n = (seed % 100000) / 100000;
                this.planetData.seeds = [n, (n * 1.5) % 1, (n * 2.5) % 1, (n * 3.5) % 1];
            }

            // Generate Environment
            const env = new PlanetSurfaceEnvironment(surfaceScene, this.planetData);
            env.generate();
            
            // Use PlanetaryRenderer to populate scene if needed
            const rendererHelper = new PlanetaryRenderer(surfaceScene);
            rendererHelper.render(env);
            
            // Render to offscreen target
            const renderer = this.viewManager.renderer;
            const rt = new THREE.WebGLRenderTarget(width, height);
            const currentRt = renderer.getRenderTarget();
            
            renderer.setRenderTarget(rt);
            renderer.render(surfaceScene, camera);
            renderer.setRenderTarget(currentRt);
            
            // Read pixels
            const buffer = new Uint8Array(width * height * 4);
            renderer.readRenderTargetPixels(rt, 0, 0, width, height, buffer);
            
            // Flip Y and put into canvas
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            const imgData = ctx.createImageData(width, height);
            
            // WebGL reads upside down relative to canvas
            for (let y = 0; y < height; y++) {
                const srcRow = (height - 1 - y) * width * 4;
                const dstRow = y * width * 4;
                imgData.data.set(buffer.subarray(srcRow, srcRow + width * 4), dstRow);
            }
            ctx.putImageData(imgData, 0, 0);
            
            container.innerHTML = '';
            const img = document.createElement('img');
            img.src = canvas.toDataURL();
            img.style.width = '100%'; img.style.height = '100%';
            container.appendChild(img);
            
            rt.dispose();
            // Cleanup
            surfaceScene.traverse(o => {
                if (o.geometry) o.geometry.dispose();
                if (o.material) o.material.dispose();
            });
        } catch (e) {
            Logger.warn("PlanetaryOrbitScene: Surface snapshot failed", e);
            container.innerHTML = '<span style="color:#ff0000;">Scan Failed</span>';
        }
    }

    _stringToSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    update(time, delta) {
        super.update(time, delta);
        const dt = delta * 0.001;

        // Rotate Planet
        if (this.planetMesh) {
            this.planetMesh.rotation.y += 0.02 * dt;
        }
        
        // Rotate Atmosphere independently
        if (this.atmosphereMesh) {
            this.atmosphereMesh.rotation.y += 0.01 * dt;
        }

        // Orbit Moons
        if (this.moons) {
            this.moons.forEach(moon => {
                moon.angle += moon.speed * dt;
                moon.mesh.position.x = Math.cos(moon.angle) * moon.distance;
                moon.mesh.position.y = Math.sin(moon.angle) * moon.distance * Math.sin(moon.inclination);
                moon.mesh.position.z = Math.sin(moon.angle) * moon.distance * Math.cos(moon.inclination);
                moon.mesh.rotation.y += 0.1 * dt;
            });
        }

        // Move Asteroid
        if (this.asteroidObj) {
            this.asteroidObj.mesh.position.add(this.asteroidObj.velocity.clone().multiplyScalar(dt));
            this.asteroidObj.mesh.rotation.x += this.asteroidObj.rotation.x * dt;
            this.asteroidObj.mesh.rotation.y += this.asteroidObj.rotation.y * dt;
            this.asteroidObj.mesh.rotation.z += this.asteroidObj.rotation.z * dt;
            
            // Reset if too far to loop the cinematic effect
            const prng = ProcGen.createPRNG(this.planetData.name || 'asteroid_loop');
            if (this.asteroidObj.mesh.position.x > 400) {
                 this.asteroidObj.mesh.position.set(-400, -50 + (prng.nextDouble()*100), 200);
                 // Randomize velocity slightly
                 this.asteroidObj.velocity.set(15 + prng.nextDouble()*5, (prng.nextDouble()-0.5)*5, 5);
            }
        }

        // Intro Sequence Transition Logic
        if (this.introActive) {
            this.introTime += dt;
            // Transition after 10 seconds
            if (this.introTime > 10.0 && this.shipSceneReady) {
                this.introActive = false;
                if (this.infoPanel) {
                    this.infoPanel.style.opacity = '0';
                }
                Logger.message("PlanetaryOrbitScene: Intro complete. Transitioning to Ship Generation.");
                this.viewManager.transitionToScene('ShipShowcaseScene', {}, { type: 'fade', duration: 1000 });
            }
        }
    }

    onUnload() {
        super.onUnload();
        if (this.infoPanel && this.infoPanel.parentNode) {
            this.infoPanel.parentNode.removeChild(this.infoPanel);
        }
    }
}
