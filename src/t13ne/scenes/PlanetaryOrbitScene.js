import * as THREE from 'three';
import Logger from '/src/t13ne/core/Logger.js';
import { Scene } from '/src/t13ne/core/Scene.js';
import { PlanetGenerator } from '/src/t13ne/procgen/system/PlanetGenerator.js';
import { SceneTools } from '/src/t13ne/core/SceneTools.js';
import ProcGen from '/src/t13ne/procgen/ProcGen.js';
import { PlanetSurfaceEnvironment } from '/src/t13ne/procgen/planet/PlanetSurfaceEnvironment.js';
import { PlanetaryRenderer } from '/src/t13ne/rendering/PlanetaryRenderer.js';
import { Starbox } from '/src/t13ne/scenes/scenecomponents/starbox.js';
import { Planet } from '/src/t13ne/scenes/scenecomponents/Planet.js';
import { Asteroid } from '/src/t13ne/scenes/scenecomponents/Asteroid.js';
import { AvatarEngine } from '/src/t13ne/procgen/avatar/AvatarEngine.js';
import { BODY_PLANS } from '/src/t13ne/procgen/avatar/BodyPlanSchema.js';

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
            // Default to front-right-up lighting for good visibility if no direction provided
            this.sunPosition = new THREE.Vector3(500, 300, 500); 
        }
        
        this.asteroidObj = null;
        this.moons = [];
        this.planetMesh = null;
        this.atmosphereMesh = null;
        
        this.introActive = true;
        this.introTime = 0;
        this.infoPanel = null;
        this.infoPanels = [];
        this.updatablePanels = [];
        this.raycaster = new THREE.Raycaster();
        this.shipSceneReady = false;
        this.starbox = null;
    }

    /**
     * Updates the scene data with new context (e.g. passed from IntroSequence).
     * This ensures the scene has the latest generated data before loading.
     */
    updateSceneData(data) {
        if (data.planet) this.planetData = data.planet;
        if (data.systemDetails) this.systemData = data.systemDetails;
        
        // If we received valid data, rebuild the scene visuals
        if (this.planetData && this.planetData.name && this.planetData.name !== 'Unknown World') {
            Logger.message("PlanetaryOrbitScene: Received updated planet data. Rebuilding scene.");
            this.buildScene();
            if (this.isActive) {
                this.createPlanetInfoPanels();
            }
        }
    }

    async _prepare(onProgress) {
        this.scene.background = new THREE.Color(0x000000);
        this.setupLighting();
        this.setupCamera();
        
        // If we already have data (unlikely if preloaded early, but possible), build now.
        if (this.planetData && this.planetData.name && this.planetData.name !== 'Unknown World') {
            await this.buildScene();
        }
        
        if (onProgress) onProgress({ status: 'Orbit Achieved', percent: 1.0 });
    }

    async buildScene() {
        // Clear existing objects to prevent duplicates on rebuild
        if (this.planetMesh) { this.scene.remove(this.planetMesh); this.planetMesh = null; }
        if (this.atmosphereMesh) { this.scene.remove(this.atmosphereMesh); this.atmosphereMesh = null; }
        this.moons.forEach(m => this.scene.remove(m.mesh));
        this.moons = [];
        if (this.asteroidObj) { this.scene.remove(this.asteroidObj.mesh); this.asteroidObj = null; }

        await this.createSkybox();
        this.createSunVisual();
        this.createMainPlanet();
        this.createMoons();
        this.createCinematicAsteroid();
        this.fitCameraToPlanet();
    }

    setupLighting() {
        const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
        sunLight.position.copy(this.sunPosition);
        sunLight.castShadow = true;
        this.scene.add(sunLight);
        
        // Add Hemisphere Light for vibrant sci-fi look (Sky color, Ground color, Intensity)
        const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 0.6); 
        this.scene.add(hemiLight);

        const ambient = new THREE.AmbientLight(0x111111, 0.2); 
        this.scene.add(ambient);
        
        const rimLight = new THREE.DirectionalLight(0x445566, 0.8);
        rimLight.position.set(-1, 0, -1).normalize();
        this.scene.add(rimLight);
    }

    setupCamera() {
        this.activeCamera.position.set(0, 200, 800);
        this.activeCamera.lookAt(0, 0, 0);

        // Adjust FOV to make planet fill ~50% of the view
        // Smaller FOV = More Zoom
        this.activeCamera.fov = 35;
        this.activeCamera.updateProjectionMatrix();

        this.activeCamera.near = 0.1;
        this.activeCamera.far = 100000; // Increased far plane to ensure skybox visibility
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

    fitCameraToPlanet() {
        if (!this.planetMesh) return;
        
        const radius = this.scales.planetRadius * (this.planetData.radius || 1.0);
        
        // Calculate distance to fill ~60% of vertical FOV (leaving room for UI and offset)
        const fov = this.activeCamera.fov * (Math.PI / 180);
        const fillPercentage = 0.6; 
        const dist = radius / Math.sin((fov * fillPercentage) / 2);
        
        // Position: Fixed angle (0, 0.2, 1.0)
        const offsetDir = new THREE.Vector3(0, 0.25, 1.0).normalize();
        const camPos = offsetDir.multiplyScalar(dist);
        
        this.activeCamera.position.copy(camPos);
        this.activeCamera.lookAt(0, 0, 0);
        
        // Update controls
        if (this.cameraControls.has('orbit')) {
            const controls = this.cameraControls.get('orbit');
            controls.target.set(0, 0, 0);
            controls.minDistance = radius * 1.2;
            controls.maxDistance = dist * 3;
            controls.update();
        }
    }

    async onLoad() {
        const funcName = 'PlanetaryOrbitScene.onLoad';
        Logger.start(funcName);
        
       if (!this.planetData || !this.planetData.name) {
            Logger.error("PlanetaryOrbitScene: No planet data provided.");
        }

        // Ensure scene is built if it wasn't in prepare
        if (!this.planetMesh) {
            await this.buildScene();
        }
        this.createPlanetInfoPanels();

        super.onLoad();
        Logger.end(funcName);
    }

    async createSkybox() {
        const r = 60000; // Increased radius to be well within far plane but background
        this.starbox = new Starbox(this.viewManager.gameEngine);
        await this.starbox.generate(this.scene, this.systemData.star, r);
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
        
        const targetRadius = this.scales.planetRadius * (this.planetData.radius || 1.0);
        
        // Use Planet class with highDetail = true and position the planet to the left
        // Note: Planet class defaults to radius 10, so we pass targetRadius directly
        const planetGroup = new Planet(pData, targetRadius, true);
        planetGroup.position.set(-targetRadius * 0.35, 0, 0); // Offset to the left
        this.scene.add(planetGroup);
        this.planetMesh = planetGroup; // Store ref to group for rotation
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
                    moonMesh = new Asteroid(5);
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
            
        });
    }

    createCinematicAsteroid() {
        // A cinematic asteroid passing by in the foreground
        const prng = ProcGen.createPRNG(this.planetData.name || 'asteroid');
        const asteroid = new Asteroid(3);
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

    async createPlanetInfoPanels() {
        // Cleanup existing panels
        this.infoPanels.forEach(p => {
            if (p.parentNode) p.parentNode.removeChild(p);
        });
        this.infoPanels = [];

        // --- 1. Data Gathering ---
        const {
            species, society, description, gravity, temperature,
            atmosphere, techInfo, resourcesHtml, speciesLoreHtml, poi
        } = this._getInfoPanelData();

        const sections = [
            { title: "Anomaly Analysis", pos: { top: '5%', right: '2%' }, content: `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.85em; margin-bottom: 15px; color: #aaccff; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px;">
                    <div><strong>Class:</strong> ${this.planetData.type || 'Terrestrial'}</div>
                    <div><strong>Gravity:</strong> ${gravity}</div>
                    <div><strong>Atmosphere:</strong> ${atmosphere}</div>
                    <div><strong>Surface Temp:</strong> ${temperature}</div>
                    <div style="grid-column: span 2;"><strong>Biosphere:</strong> ${this.planetData.biosphere || 'None'}</div>
                    <div style="grid-column: span 2;"><strong>Technological Era:</strong> ${techInfo}</div>
                </div>
                <div style="font-size: 0.9em; line-height: 1.4; margin-bottom: 15px; color: #ffffff;">
                    ${description}
                </div>`,
                id: 'anomaly-analysis'
            },
            { title: "Species Profile", pos: { bottom: '5%', right: '2%' }, content: ``, id: 'species-profile', customCreate: (container) => {
                const speciesPanel = this._createSpeciesPanel(species, society, speciesLoreHtml);
                container.appendChild(speciesPanel);
                this.generateAvatarSnapshot(speciesPanel.querySelector('.avatar-container'));
            }},
            { title: "Resource Scan", pos: { top: '5%', left: '2%' }, content: `
                <div style="color:#00ffff; font-size:0.9em; margin-bottom:5px;">STRATEGIC RESOURCES</div>
                <div style="font-size:0.8em; line-height:1.4;">${resourcesHtml}</div>`,
                id: 'resource-scan'
            },
            { title: "Surface Snapshot", pos: { bottom: '5%', left: '2%' }, content: ``, id: 'surface-snapshot', customCreate: async (container) => {
                const landCanvasContainer = this._createSurfaceScanPanel(poi, container);
                await this.generateSurfaceSnapshot(landCanvasContainer);
            }}
        ];

        let currentDelay = 500;
        const totalRevealTime = 12000;
        const delayPerSection = (totalRevealTime - currentDelay) / sections.length;

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];

            // Create a separate panel for each section
            const panel = document.createElement('div');
            this._styleInfoPanel(panel);

            // Reset position from default styles then apply section-specific position
            panel.style.top = section.pos.top || 'auto';
            panel.style.bottom = section.pos.bottom || 'auto';
            panel.style.left = section.pos.left || 'auto';
            panel.style.right = section.pos.right || 'auto';
            panel.style.width = '350px'; // Slightly smaller to reduce clutter

            panel.style.opacity = '0';
            panel.style.transform = section.pos.left ? 'translateX(-50px)' : 'translateX(50px)';

            panel.innerHTML = `
                <h2 style="margin: 0 0 10px 0; color: #00ffff; text-transform: uppercase; font-size: 1.1em; border-bottom: 1px solid #005588; padding-bottom: 5px; text-shadow: 0 0 5px #00ffff;">
                    ${this.planetData.name || 'Scanning...'} | ${section.title}
                </h2>
                <div class="panel-content">${section.content}</div>`;

            document.body.appendChild(panel);
            this.infoPanels.push(panel);

            if (section.customCreate) {
                const contentContainer = panel.querySelector('.panel-content');
                await section.customCreate(contentContainer);
            }

            // Staged reveal
            setTimeout(() => {
                if (!this.isActive) return;
                panel.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
                panel.style.opacity = '1';
                panel.style.transform = 'translateX(0)';
            }, currentDelay);

            currentDelay += delayPerSection;
        }

        // Notify that the intro is complete after everything is revealed
        setTimeout(() => {
            if (this.isActive && !this.isComplete) this.complete();
        }, currentDelay + 2000);
    }


    _styleInfoPanel(panel) {
        Object.assign(panel.style, {
            position: 'absolute', top: '10%', right: '2%', width: '400px',
            maxHeight: '80%', overflowY: 'auto', padding: '20px',
            backgroundColor: 'rgba(0, 10, 20, 0.9)', border: '1px solid #00aaff',
            boxShadow: '0 0 20px rgba(0, 170, 255, 0.4)', color: '#e0f0ff',
            fontFamily: '"Orbitron", "Courier New", monospace', zIndex: '100',
            borderRadius: '8px', backdropFilter: 'blur(8px)',
            transition: 'opacity 1s', scrollbarWidth: 'thin'
        });
    }

    _getInfoPanelData() {
        const species = this._sanitizeLore(this.systemData.species || this.planetData.species || "Unknown Species");
        let society = this._sanitizeLore(this.systemData.society || "Unknown Society");
        if (this.planetData.population) {
            society += ` (Pop: ${this.planetData.population.toLocaleString()})`;
        }
        const description = this._sanitizeLore(this.planetData.description || "A mysterious world.");
        const gravity = this.planetData.gravity ? `${parseFloat(this.planetData.gravity).toFixed(2)} G` : 'Unknown';
        const temperature = this.planetData.temperature ? `${Math.round(this.planetData.temperature)} K` : 'Unknown';
        const atmosphere = this.planetData.atmosphere || 'None';
        let techInfo = "Unknown";
        if (this.systemData.tech) {
            techInfo = this._sanitizeLore(typeof this.systemData.tech === 'string' ? this.systemData.tech : (this.systemData.tech.Type || "Unknown"));
        }
        let resourcesHtml = '<span style="color:#888;">None detected</span>';
        if (this.planetData.resources && this.planetData.resources.length > 0) {
            resourcesHtml = this.planetData.resources.map(r => `<span style="color:#aaffaa;">${r.name}</span> <span style="color:#88aa88; font-size:0.8em;">(${r.grade})</span>`).join(', ');
        }
        let speciesLoreHtml = "";
        if (this.systemData.speciesCore) {
            const core = this.systemData.speciesCore;
            if (core.physicalDescription) speciesLoreHtml += `<div style="margin-top:5px; font-style:italic; color:#aaccff;">"${this._sanitizeLore(core.physicalDescription)}"</div>`;
            if (core.culturalDescription) speciesLoreHtml += `<div style="margin-top:5px; color:#ccccff;">${this._sanitizeLore(core.culturalDescription)}</div>`;
        }
        let poi = "Unknown Anomaly";
        if (this.planetData.resources && this.planetData.resources.length > 0) {
            poi = `Resource Deposit: ${this.planetData.resources[0].name}`;
        } else if (this.planetData.biosphere && this.planetData.biosphere !== 'None') {
            poi = `Life Sign: ${this.planetData.biosphere}`;
        } else if (this.planetData.type) {
            poi = `Geological Feature: ${this.planetData.type}`;
        }
        return { species, society, description, gravity, temperature, atmosphere, techInfo, resourcesHtml, speciesLoreHtml, poi };
    }
    
    _createSpeciesPanel(species, society, speciesLoreHtml) {
        const speciesDiv = document.createElement('div');
        speciesDiv.style.marginBottom = '15px';
        speciesDiv.style.borderTop = '1px solid #005588';
        speciesDiv.style.paddingTop = '10px';
        speciesDiv.innerHTML = `
            <div style="color:#00ffff; font-size:1.0em; margin-bottom:5px; font-weight:bold;">DOMINANT SPECIES: ${species}</div>
            <div style="color:#aaccff; font-size:0.85em; margin-bottom:10px;">SOCIETY: ${society}</div>`;
            
        const avContainer = document.createElement('div');
        avContainer.className = 'avatar-container'; // Add class for easy selection
        Object.assign(avContainer.style, {
            width: '80px', height: '80px', border: '1px solid #005588', float: 'left',
            marginRight: '15px', marginBottom: '5px', backgroundColor: '#050510',
            borderRadius: '4px', overflow: 'hidden', textAlign: 'center', lineHeight: '80px',
            color: '#00ffff', fontSize: '10px'
        });
        avContainer.innerText = 'Scanning...';
        speciesDiv.insertBefore(avContainer, speciesDiv.children[2] || null);

        const loreTextDiv = document.createElement('div');
        loreTextDiv.style.fontSize = '0.85em';
        loreTextDiv.innerHTML = speciesLoreHtml;
        speciesDiv.appendChild(loreTextDiv);

        const clearDiv = document.createElement('div');
        clearDiv.style.clear = 'both';
        speciesDiv.appendChild(clearDiv);
        return speciesDiv;
    }

    _createSurfaceScanPanel(poi, parentDiv) {
        parentDiv.style.borderTop = '1px solid #005588';
        parentDiv.style.paddingTop = '10px';
        parentDiv.innerHTML = `<div style="color:#00ffff; font-size:0.9em; margin-bottom:5px;">SURFACE SCAN: ${poi}</div>`;
        
        const landCanvasContainer = document.createElement('div');
        landCanvasContainer.style.border = '1px solid #005588';
        landCanvasContainer.style.width = '100%';
        landCanvasContainer.style.height = '120px';
        landCanvasContainer.style.borderRadius = '4px';
        landCanvasContainer.style.backgroundColor = '#000';
        landCanvasContainer.style.position = 'relative'; // For scanline overlay
        
        const placeholder = document.createElement('div');
        placeholder.style.color = '#004488';
        placeholder.style.font = "12px monospace";
        placeholder.innerText = "Acquiring Satellite Feed...";
        placeholder.style.padding = '10px';
        landCanvasContainer.appendChild(placeholder);
        
        parentDiv.appendChild(landCanvasContainer);
        return landCanvasContainer;
    }

    _sanitizeLore(text) {
        if (!text || typeof text !== 'string') return text;
        // Remove patterns like "Geometry: ...", "Chi Gain: ...", "(Boon ...)", "Success Level", etc.
        // This regex removes parenthetical technical data often found in raw dumps
        let clean = text.replace(/\([^)]*(Boon|Geometry|Chi|Facet|Hitch|Gematria|Success|Difficulty|Pips|Draw|Pool|Phase|Test|Action)[^)]*\)/gi, '');
        // Remove explicit labels if they appear outside parens
        clean = clean.replace(/(Geometry Number|Chi Gain|Boon|Facet Score|Success Level|Difficulty Rating|Pip Gain|Draw Count|Pool Size):?\s*[\w\d\+\-\s]*/gi, '');
        // Remove common mechanical sentences
        clean = clean.replace(/They add \+\d+ Success Level on any Action [^.]*\./gi, '');
        clean = clean.replace(/Add \+\d+ Success Level to any Action [^.]*\./gi, '');
        clean = clean.replace(/Each additional [^.]* adds a [^.]* Success Level\./gi, '');
        return clean.trim();
    }

    async generateSurfaceSnapshot(container, attempt = 0) {
        const width = 280;
        const height = 150;
        
        // Create a separate scene for the snapshot
        const surfaceScene = new THREE.Scene();
        surfaceScene.background = new THREE.Color(0x1a2b34);
        
        const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
        camera.position.set(0, 50, 100);
        camera.lookAt(0, 0, 0);
        
        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        surfaceScene.add(ambient);
        const dir = new THREE.DirectionalLight(0xffffff, 1.0);
        dir.position.set(50, 100, 50);
        surfaceScene.add(dir);
        
        try {
            if (!this.isActive) return;

            // Ensure seeds exist for surface generation, use fallback
            if (!this.planetData.seeds || !Array.isArray(this.planetData.seeds)) {
                // Check if seeds are stored in the meshConfig (common pattern)
                if (this.planetData.meshConfig && this.planetData.meshConfig.seeds) {
                    this.planetData.seeds = this.planetData.meshConfig.seeds;
                }
                
                const seed = this._stringToSeed(this.planetData.name || 'surface');
                // Normalize to 0-1 range
                const n = Math.abs(seed % 100000) / 100000;
                this.planetData.seeds = [n, (n * 1.5) % 1, (n * 2.5) % 1, (n * 3.5) % 1];
            }

            // Generate Environment
            const env = new PlanetSurfaceEnvironment(this.planetData);
            
            // Use PlanetaryRenderer to populate scene if needed
            const rendererHelper = new PlanetaryRenderer(surfaceScene);
            rendererHelper.render(env);
            
            // Render to offscreen target
            const renderer = this.viewManager.renderer;
            
            if (!renderer) throw new Error("Renderer not available");

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
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.display = 'block';
            container.appendChild(img);

            // Add Scanline Overlay
            const scanlineCanvas = document.createElement('canvas');
            scanlineCanvas.width = width;
            scanlineCanvas.height = height;
            Object.assign(scanlineCanvas.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
            });
            container.appendChild(scanlineCanvas);

            const sctx = scanlineCanvas.getContext('2d');
            const drawScanlines = () => {
                if (!this.isActive || !scanlineCanvas.parentNode) return;
                sctx.clearRect(0, 0, width, height);
                sctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
                const offset = (performance.now() / 50) % 8;
                for (let y = offset; y < height; y += 4) {
                    sctx.fillRect(0, y, width, 1);
                }
                requestAnimationFrame(drawScanlines);
            };
            drawScanlines();
            
            rt.dispose();
            // Cleanup
            surfaceScene.traverse(o => {
                if (o.geometry) o.geometry.dispose();
                if (o.material) o.material.dispose();
            });
        } catch (e) {
            Logger.warn(`PlanetaryOrbitScene: Surface snapshot failed (Attempt ${attempt + 1})`, e);
            
            // Cleanup scene even on failure
            surfaceScene.traverse(o => {
                if (o.geometry) o.geometry.dispose();
                if (o.material) o.material.dispose();
            });

            if (attempt < 2) {
                setTimeout(() => this.generateSurfaceSnapshot(container, attempt + 1), 500);
            } else {
                container.innerHTML = '<span style="color:#ff0000;">Scan Failed</span>';
            }
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

    async generateAvatarSnapshot(container) {
        const width = 80;
        const height = 80;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050510);

        const camera = new THREE.PerspectiveCamera(25, width / height, 0.1, 100);
        camera.position.set(0, 0.15, 0.8);
        camera.lookAt(0, 0.15, 0);

        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambient);
        const spot = new THREE.DirectionalLight(0xffffff, 1.0);
        spot.position.set(1, 1, 2);
        scene.add(spot);

        try {
            if (!this.isActive) return;

            const avatarEngine = new AvatarEngine();
            // Determine body plan from lore
            let planName = 'HUMANOID';
            const speciesCore = this.systemData.speciesCore || {};
            
            if (speciesCore.bodyPlan) {
                const bp = speciesCore.bodyPlan.toLowerCase();
                if (bp.includes('quadruped')) planName = 'QUADRUPED';
                else if (bp.includes('spider') || bp.includes('arachnid')) planName = 'SPIDER';
                else if (bp.includes('centipede') || bp.includes('myriapod')) planName = 'CENTIPEDE';
                else if (bp.includes('radial') || bp.includes('tentacle')) planName = 'RADIAL';
                else if (bp.includes('winged') || bp.includes('avian')) planName = 'WINGED';
            }

            const bodyPlan = BODY_PLANS[planName] || BODY_PLANS.HUMANOID;
            const avatarMesh = avatarEngine.generate(bodyPlan);
            
            if (speciesCore.color) {
                try {
                    const c = new THREE.Color(speciesCore.color);
                    avatarMesh.material.color.copy(c);
                } catch (e) {
                    Logger.warn(`PlanetaryOrbitScene: Invalid species color '${speciesCore.color}', defaulting to random.`);
                }
            } else {
                 const prng = ProcGen.createPRNG(this.planetData.name || 'avatar-color');
                 const hue = prng.nextDouble();
                 avatarMesh.material.color.setHSL(hue, 0.6, 0.5);
            }

            // Center and scale to ensure it fits in the camera view
            const box = new THREE.Box3().setFromObject(avatarMesh);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            // Fit to view (Camera is at z=0.8)
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0) {
                const scale = 0.5 / maxDim; 
                avatarMesh.scale.setScalar(scale);
                // Re-center after scaling
                const newBox = new THREE.Box3().setFromObject(avatarMesh);
                avatarMesh.position.sub(newBox.getCenter(new THREE.Vector3()));
            }
            avatarMesh.position.y -= 0.1; 

            scene.add(avatarMesh);

            const renderer = this.viewManager.renderer;
            if (!renderer) throw new Error("Renderer not available");

            const rt = new THREE.WebGLRenderTarget(width, height);
            const currentRt = renderer.getRenderTarget();
            
            renderer.setRenderTarget(rt);
            renderer.render(scene, camera);
            renderer.setRenderTarget(currentRt);

            const buffer = new Uint8Array(width * height * 4);
            renderer.readRenderTargetPixels(rt, 0, 0, width, height, buffer);
            
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            const imgData = ctx.createImageData(width, height);
            
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
            avatarMesh.geometry.dispose();
            avatarMesh.material.dispose();

        } catch (e) {
            Logger.warn("PlanetaryOrbitScene: Avatar generation failed", e);
            container.innerHTML = '<div style="color:red;font-size:10px;text-align:center;line-height:80px;">No Data</div>';
        }
    }

    update(time, delta) {
        super.update(time, delta);
        const dt = delta * 0.001;

        if (this.starbox) {
            this.starbox.update(time * 0.001);
        }

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
            // The intro remains active until the staged reveal is complete or user interacts
            if (this._stagedRevealComplete && this.introTime > 15.0) {
                 this.introActive = false;
            }
        }

        // Update dynamic UI panels
        if (this.updatablePanels && this.updatablePanels.length > 0 && this.planetMesh) {
            this.updatablePanels.forEach(poi => {
                const screenPos = this.getScreenPosition(poi.position3D, this.activeCamera);
                
                const camToPoi = poi.position3D.clone().sub(this.activeCamera.position);
                this.raycaster.set(this.activeCamera.position, camToPoi.normalize());
                
                const intersects = this.raycaster.intersectObject(this.planetMesh, true);
                
                if (intersects.length > 0 && intersects[0].distance < camToPoi.length()) {
                    poi.panel.style.display = 'none';
                } else {
                    poi.panel.style.display = 'block';
                    poi.panel.style.left = `${screenPos.x}px`;
                    poi.panel.style.top = `${screenPos.y}px`;
                }
            });
        }
    }

    getScreenPosition(position3D, camera) {
        const vector = position3D.clone().project(camera);
        const x = (vector.x + 1) / 2 * window.innerWidth;
        const y = -(vector.y - 1) / 2 * window.innerHeight;
        return { x, y };
    }

    onUnload() {
        super.onUnload();
        this.infoPanels.forEach(p => {
            if (p.parentNode) p.parentNode.removeChild(p);
        });
        this.infoPanels = [];
        this.updatablePanels = [];
    }
}
