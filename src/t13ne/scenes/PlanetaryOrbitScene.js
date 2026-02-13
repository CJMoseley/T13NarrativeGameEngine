import * as THREE from 'three';
import Logger from '../core/Logger.js';
import { Scene } from '../core/Scene.js';
import { PlanetGenerator } from '../procgen/system/PlanetGenerator.js';
import { SceneTools } from '../core/SceneTools.js';
import { PlanetShader } from '../procgen/system/PlanetShader.js';

export class PlanetaryOrbitScene extends Scene {
    constructor(viewManager, sceneData) {
        super(viewManager, sceneData);
        // Expect sceneData to be the planet object or contain it
        this.planetData = sceneData.planet || sceneData || {};
        
        this.planetGenerator = new PlanetGenerator(null);
        this.objects = [];
        
        // Configuration for cinematic feel
        this.scales = {
            planetRadius: 100, // Visual radius for the main planet
            moonScale: 0.2     // Scale of moons relative to planet
        };
        
        // Sun position for dramatic lighting (top-left-back relative to camera start)
        this.sunPosition = new THREE.Vector3(-800, 200, -500); 
        
        this.asteroidObj = null;
        this.moons = [];
        this.planetMesh = null;
        this.atmosphereMesh = null;
    }

    async prepare(onProgress) {
        this.init();
        if (onProgress) onProgress({ status: 'Orbit Achieved', percent: 1.0 });
    }

    init() {
        const funcName = 'PlanetaryOrbitScene.init';
        Logger.start(funcName);

        this.scene.background = new THREE.Color(0x000000);

        // --- Lighting ---
        // 1. Main Sun Light (Directional for parallel shadows)
        const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
        sunLight.position.copy(this.sunPosition);
        sunLight.castShadow = true;
        // Ensure target is at origin
        sunLight.target.position.set(0, 0, 0);
        this.scene.add(sunLight.target);
        // Configure shadow properties for high quality
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 5000;
        const d = 500;
        sunLight.shadow.camera.left = -d;
        sunLight.shadow.camera.right = d;
        sunLight.shadow.camera.top = d;
        sunLight.shadow.camera.bottom = -d;
        this.scene.add(sunLight);

        // 2. Ambient Light (Space isn't pitch black, usually starlight/nebula fill)
        const ambient = new THREE.AmbientLight(0x050510, 0.2); 
        this.scene.add(ambient);
        
        // 3. Rim Light (Cinematic backlight to separate planet from space)
        const rimLight = new THREE.DirectionalLight(0x445566, 0.8);
        rimLight.position.set(-1, 0, -1).normalize(); // Opposite to camera roughly
        this.scene.add(rimLight);

        // --- Camera ---
        // Position camera to look at planet from a nice angle
        this.activeCamera.position.set(0, 30, 350);
        this.activeCamera.lookAt(0, 0, 0);
        this.activeCamera.near = 0.1;
        this.activeCamera.far = 20000;
        this.activeCamera.updateProjectionMatrix();
        this.scene.add(this.activeCamera);

        // Add a fill light attached to the camera to ensure the planet is never fully black
        const camLight = new THREE.PointLight(0xffffff, 0.4);
        this.activeCamera.add(camLight);

        // Controls - Orbit around the planet
        // Use OrbitControls (via setupControls abstraction in Scene)
        this.setupControls('orbit', {
            target: new THREE.Vector3(0, 0, 0),
            enableDamping: true,
            dampingFactor: 0.05,
            minDistance: 120, // Don't clip into planet (radius 100)
            maxDistance: 1000,
            autoRotate: true,
            autoRotateSpeed: 0.2 // Slow cinematic rotation
        });

        this.createSkybox();
        this.createSunVisual();
        this.createMainPlanet();
        this.createMoons();
        this.createCinematicAsteroid();

        Logger.end(funcName);
    }

    createSkybox() {
        const r = 10000;
        const starsGeometry = new THREE.BufferGeometry();
        const starsVertices = [];
        for (let i = 0; i < 8000; i++) {
            const x = (Math.random() - 0.5) * 2;
            const y = (Math.random() - 0.5) * 2;
            const z = (Math.random() - 0.5) * 2;
            const v = new THREE.Vector3(x, y, z).normalize().multiplyScalar(r);
            starsVertices.push(v.x, v.y, v.z);
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false });
        const starField = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(starField);
    }

    createSunVisual() {
        const sunGeo = new THREE.SphereGeometry(50, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
        const sunMesh = new THREE.Mesh(sunGeo, sunMat);
        sunMesh.position.copy(this.sunPosition);
        this.scene.add(sunMesh);
        
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

        const spriteMat = new THREE.SpriteMaterial({ 
            map: map,
            color: 0xffffee,
            transparent: true, 
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(600, 600, 1);
        sunMesh.add(sprite);
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

        let planetGroup;
        
        // Use Custom Shader for Continents and Water
        const geometry = new THREE.SphereGeometry(10, 128, 128);
        const material = new THREE.ShaderMaterial({
            vertexShader: PlanetShader.vertexShader,
            fragmentShader: PlanetShader.fragmentShader,
            uniforms: {
                lightDir: { value: this.sunPosition.clone().normalize() },
                colorLand: { value: new THREE.Color(0x228833) }, // Green/Land
                colorWater: { value: new THREE.Color(0x004488) }, // Blue/Water
                seed: { value: Math.random() * 100 }
            }
        });
        planetGroup = new THREE.Group();
        planetGroup.add(new THREE.Mesh(geometry, material));

        // PlanetGenerator output radius is roughly pData.radius * 10.
        // We want final radius to be this.scales.planetRadius (100).
        const generatedRadius = pData.radius * 10;
        const scale = this.scales.planetRadius / generatedRadius;
        
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

    createMoons() {
        if (!this.planetData.moons || this.planetData.moons.length === 0) return;

        Logger.message(`PlanetaryOrbitScene: Creating ${this.planetData.moons.length} moons.`);
        this.moons = [];
        
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
                    moonMesh = this.planetGenerator.generateAsteroidMesh(Math.random(), 5);
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
            const angle = index === 0 ? Math.PI * 0.8 : Math.random() * Math.PI * 2;
            const inclination = (Math.random() - 0.5) * 0.5; // Radians
            
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
        const asteroid = this.planetGenerator.generateAsteroidMesh(Math.random(), 3);
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

    update(time, delta) {
        super.update(time, delta);
        const dt = delta * 0.001;

        // Rotate Planet
        if (this.planetMesh) {
            this.planetMesh.rotation.y += 0.02 * dt;
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
            if (this.asteroidObj.mesh.position.x > 400) {
                 this.asteroidObj.mesh.position.set(-400, -50 + (Math.random()*100), 200);
                 // Randomize velocity slightly
                 this.asteroidObj.velocity.set(15 + Math.random()*5, (Math.random()-0.5)*5, 5);
            }
        }
    }
}
