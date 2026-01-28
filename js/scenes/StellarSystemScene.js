import { LoreData } from '../procgen/lore/LoreData.js';
import { TechGenerator } from '../procgen/lore/factories/TechGenerator.js';
import * as THREE from 'three';
import Logger from '@plugins/t13ne/core/Logger.js';
import { Scene } from '@plugins/t13ne/core/Scene.js';
import { Controls } from '@plugins/t13ne/core/Controls.js';
import { OrreryScene } from './OrreryScene.js';
import { SceneTools } from '@plugins/t13ne/core/SceneTools.js';

export class StellarSystemScene extends Scene {
  constructor(viewManager, sceneData) {
    super(viewManager, sceneData);

    this.galaxy = sceneData.galaxy;
    this.systemData = sceneData.systemDetails;
    this.starLocation = sceneData.star;
    this.planets = sceneData.planets;
    this.playIntro = sceneData.playIntro;

    this.techGenerator = new TechGenerator(this.gameEngine.procGen);
    this.starTexture = null;
    this.camera = null; // This will be our rendering camera
    this.planetMeshes = [];
    this.homeworldMesh = null;
    this.raycaster = new THREE.Raycaster();
    this.mouseVector = new THREE.Vector2();
    this.planetSystems = []; // Track the container groups
    this.dustSystem = null;
    this.snapshotCamera = null;
    this.spectatorCameras = new Map();
    this.trailingCameras = new Map();
    this.onPlanetSelected = null;
    
    this.showOrrery = true;
    this.scanHoverTime = 0;
    this.currentScanTarget = null;
    this.scanTriggered = false;
    this.hudElement = null;
    
    this.AU_TO_UNITS = 5000; // Increased scale to prevent moon/star overlap
    this.STAR_RADIUS = 100; // Star size relative to new AU scale
    
    // Spectator Camera Settings
    this.spectatorSpeed = 2000; // Increased speed for large scale
    this.spectatorLookSpeed = 0.002; // Radians per pixel
    this.spectatorZoomSpeed = 200; // Units per scroll tick
    
    // Smoothing Vectors
    this.spectatorVelocity = new THREE.Vector3();
    this.spectatorRotationVelocity = new THREE.Vector2();
    this.damping = 0.95; // Inertia factor (0.0 - 1.0)
    
    // Intro Animation State
    this.isIntroPlaying = false;
    this.introStartTime = 0;
    this.introDuration = 20000; // Match LoaderManager duration to prevent HUD flicker
    this.introCurve = null;
    this.introTargets = [];
    this.introResolve = null;
    this.introPromise = null;
    this.introStartPos = new THREE.Vector3();
    this.introStarFlybyPos = new THREE.Vector3();

    // Floating Origin System
    this.worldGroup = new THREE.Group();
    this.virtualCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5e7);
    this.orreryCamera = null;
    this.pathLine = null;
    this.pathPoints = [];
    this.starRadius = 1000;

    // Bind interaction methods to prevent DOM errors
    this.onMouseClick = this.onMouseClick.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    
    // Initialize keys for spectator movement
    this.keys = { w: false, a: false, s: false, d: false, q: false, e: false, shift: false };
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    this.sanitizePlanetData();
    // Sort planets by distance to ensure consistent order with Orrery and correct camera pathing
    if (this.planets) {
        this.planets.sort((a, b) => (a.orbitalDistance || 0) - (b.orbitalDistance || 0));
    }
  }

  async prepare(onProgress) {
    this.init();
    onProgress({ status: 'System generated', percent: 1.0 });
  }

  sanitizePlanetData() {
      if (!this.planets) return;
      this.planets.forEach((p, i) => {
          // Ensure orbitalDistance is a valid number
          if (typeof p.orbitalDistance !== 'number' || !Number.isFinite(p.orbitalDistance)) {
              p.orbitalDistance = (i + 1) * 0.5; // Fallback: 0.5 AU spacing
              Logger.warn(`StellarSystemScene: Sanitized planet ${i} distance to ${p.orbitalDistance}`);
          }
          // Synchronize start angles for Orrery alignment
          if (p.startAngle === undefined) {
              p.startAngle = Math.random() * Math.PI * 2;
          }
      });
  }

  init() {
    const funcName = 'SolarSystemScene.init';
    Logger.start(funcName, { systemName: this.systemData.name });

    this.scene.add(this.worldGroup);
    this.starTexture = SceneTools.createStarTexture(128, 'rgba(255, 255, 255, 1)');
    
    // Setup Orrery for PiP FIRST so we can use its scale for the camera
    this.orrery = new OrreryScene(this.viewManager, {
        systemDetails: this.systemData,
        planets: this.planets,
        star: this.starLocation
    });
    this.orrery.init();
    // Disable orrery controls so they don't interfere
    this.orrery.cameraControls.forEach(c => c.enabled = false);

    this.setupThreeJS();
    this.setupExtraCameras();
    this.createScene();
    this.createHUD();

    // Generate icons after a short delay to ensure scene is ready
    // In a real app, this might be triggered by a specific event or user action
    setTimeout(() => this.generatePlanetIcons(), 1000);
  }

  setupThreeJS() {
    const funcName = 'SolarSystemView.setupThreeJS';
    Logger.start(funcName);
    this.scene.background = new THREE.Color(0x000000);

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Calculate system radius
    let maxDist = 1000;
    if (this.planets && this.planets.length > 0) {
        maxDist = this.planets.reduce((max, p) => {
            const d = this.STAR_RADIUS + ((p.orbitalDistance || 1) * this.AU_TO_UNITS);
            return d > max ? d : max;
        }, 0);
    }
    
    // NaN Safety Check
    if (isNaN(maxDist) || maxDist <= 0) maxDist = 2000;
    
    this.systemRadius = Math.max(maxDist, this.STAR_RADIUS * 20, 500); // Reduced minimum radius for small systems
    Logger.message(`StellarSystemScene: System Radius calculated as ${this.systemRadius}`);

    // Massive far plane for space
    const skyboxDistance = Math.max(this.systemRadius * 100, 10000000); 

    // 1. Rendering Camera (Fixed at origin for floating origin effect)
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, skyboxDistance);
    this.scene.add(this.camera);

    // 2. Virtual Camera (Logical position for controls)
    // 15 degrees above ecliptic
    const elevation = 15 * (Math.PI / 180);
    // Ensure we are far enough back to see the system but not inside the star
    const startDist = this.playIntro ? this.systemRadius * 1.2 : this.systemRadius * 1.5;
    const startY = startDist * Math.sin(elevation);
    const startZ = startDist * Math.cos(elevation);

    this.virtualCamera.fov = 60;
    this.virtualCamera.aspect = width / height;
    this.virtualCamera.near = 0.1;
    this.virtualCamera.far = skyboxDistance;
    this.virtualCamera.position.set(0, startY, startZ);
    this.virtualCamera.lookAt(0, 0, 0);
    this.virtualCamera.updateProjectionMatrix();

    // Register the VIRTUAL camera for controls, but we render with the static camera
    this.addCamera('systemMain', this.virtualCamera);
    this.setActiveCamera('systemMain');
    
    // 3. Cinematic Camera
    this.cinematicCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, skyboxDistance);
    this.cinematicCamera.position.copy(this.virtualCamera.position); // Init to safe spot
    this.addCamera('cinematic', this.cinematicCamera);
    const cinLight = new THREE.PointLight(0xffffff, 1.5, 0);
    this.cinematicCamera.add(cinLight);
    this.scene.add(this.cinematicCamera);

    // 4. Orrery Camera
    // Calculate distance based on Orrery Scale (Toy Scale)
    let orreryMaxRadius = 1000;
    if (this.orrery && typeof this.orrery.getVisualDistance === 'function' && this.planets.length > 0) {
        // Get the visual distance of the furthest planet
        orreryMaxRadius = this.orrery.getVisualDistance(this.planets.length - 1);
    }
    
    const orreryAspect = 1.0; // Square PiP
    const orreryDist = orreryMaxRadius * 3.5; // Distance to fit radius with 45 deg FOV + buffer
    
    this.orreryCamera = new THREE.PerspectiveCamera(45, orreryAspect, 0.1, orreryDist * 5);
    const orreryElevation = 45 * (Math.PI / 180); // Steeper angle for better view of rings
    this.orreryCamera.position.set(0, orreryDist * Math.sin(orreryElevation), orreryDist * Math.cos(orreryElevation));
    this.orreryCamera.lookAt(0, 0, 0);
    this.addCamera('orrery', this.orreryCamera);

    // Note: We are NOT setting up TrackballControls here. 
    // We will use custom Spectator controls in the update loop.

    Logger.end(funcName);
  }

  setupExtraCameras() {
      // Snapshot Camera for UI Icons
      this.snapshotCamera = new THREE.PerspectiveCamera(30, 1, 0.1, 100000);
      this.scene.add(this.snapshotCamera);
      this.addCamera('snapshot', this.snapshotCamera);
  }

  createHUD() {
      this.hudElement = document.createElement('div');
      this.hudElement.style.position = 'absolute';
      this.hudElement.style.top = '10px';
      this.hudElement.style.left = '10px';
      this.hudElement.style.color = '#00ff00';
      this.hudElement.style.fontFamily = 'monospace';
      this.hudElement.style.fontSize = '14px';
      this.hudElement.style.pointerEvents = 'none';
      this.hudElement.style.zIndex = '1000';
      this.hudElement.style.whiteSpace = 'pre';
      this.hudElement.innerHTML = 'Spectator Mode<br>WASD: Move | Q/E: Up/Down | Shift: Boost<br>Mouse Wheel: Adjust Speed';
      if (this.playIntro) {
          this.hudElement.style.display = 'none';
      }
      // HUD is attached in onLoad to prevent it showing during pre-loading
  }

  createScene() {
    const funcName = 'SolarSystemView.createScene';
    Logger.start(funcName);
    
    // Global Light in World
    const hemiLight = new THREE.HemisphereLight(0xeeeeff, 0x080820, 0.3);
    this.worldGroup.add(hemiLight);

    // Headlight on rendering camera
    const camLight = new THREE.PointLight(0xffffff, 0.5, 0);
    this.camera.add(camLight);

    // Star Light in World
    const starLight = new THREE.PointLight(this.systemData.starColor, 2.0, 0, 0); // No decay for infinite range
    starLight.position.set(0, 0, 0);
    this.worldGroup.add(starLight);

    this.systemGroup = new THREE.Group();
    this.worldGroup.add(this.systemGroup); // systemGroup is child of worldGroup
    
    if (this.starLocation) {
        const angleToCenter = Math.atan2(this.starLocation.x, this.starLocation.z);
        this.systemGroup.rotation.y = angleToCenter;
        this.systemGroup.rotation.x = (Math.random() - 0.5) * 0.5; 
    }

    this.createStar();
    this.createPlanets();
    this.createSkybox();
    this.createSpaceDust();
    Logger.end(funcName);
  }

  createSpaceDust() {
      const particleCount = 8000; // Increased count
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      
      // Initial random positions in a box around origin
      const range = 4000; // Increased range to reduce "tunnel" effect
      for (let i = 0; i < particleCount; i++) {
          positions[i * 3] = (Math.random() - 0.5) * range;
          positions[i * 3 + 1] = (Math.random() - 0.5) * range;
          positions[i * 3 + 2] = (Math.random() - 0.5) * range;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const sprite = SceneTools.createGlowTexture(); // Use a soft texture
      const material = new THREE.PointsMaterial({
          color: 0xffffff,
          size: 2, // Further reduced size
          map: sprite,
          transparent: true,
          opacity: 0.6,
          sizeAttenuation: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending
      });
      
      this.dustSystem = new THREE.Points(geometry, material);
      this.dustSystem.frustumCulled = false;
      this.worldGroup.add(this.dustSystem);
  }

  createSkybox() {
      const funcName = 'StellarSystemScene.createSkybox';
      Logger.start(funcName);
      
      const bgRadius = this.systemRadius * 50; 
      // Use fixed pixel size (2) instead of scaled size to avoid "large squares"
      const starField = SceneTools.createStarfield(bgRadius, 15000, 1.5, false);
      this.scene.add(starField);

      // Add distant stars from galaxy data if available
      if (this.galaxy && this.galaxy.stars) {
          const starGeometry = new THREE.BufferGeometry();
          const positions = [];
          const colors = [];
          const currentPos = new THREE.Vector3(0,0,0);
          if (this.starLocation) currentPos.set(this.starLocation.x, this.starLocation.y, this.starLocation.z);

          this.galaxy.stars.forEach(star => {
              const starPos = new THREE.Vector3(star.x, star.y, star.z);
              const dist = starPos.distanceTo(currentPos);
              if (dist < 1) return;
              
              const distance = (this.systemRadius || 5000) * 20; 
              const dir = starPos.clone().sub(currentPos).normalize();
              const pos = dir.multiplyScalar(distance);
              positions.push(pos.x, pos.y, pos.z);

              // Dimmer, milkier galaxy background
              let brightness = 8000 / (dist + 500); 
              if (brightness > 0.8) brightness = 0.8;
              if (brightness < 0.05) brightness = 0.05;
              const c = new THREE.Color(star.color);
              c.multiplyScalar(brightness);
              colors.push(c.r, c.g, c.b);
          });
          starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
          starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
          const starMaterial = new THREE.PointsMaterial({ size: 1.5, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false });
          const starPoints = new THREE.Points(starGeometry, starMaterial);
          this.scene.add(starPoints);
      }
      Logger.end(funcName);
  }

  createStar() {
    const funcName = 'SolarSystemView.createStar';
    Logger.start(funcName);
    const starColor = new THREE.Color(this.systemData.starColor);
    const starRadius = this.STAR_RADIUS;

    // Core
    const starGeometry = new THREE.SphereGeometry(starRadius, 64, 64);
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.starMesh = new THREE.Mesh(starGeometry, starMaterial);
    this.systemGroup.add(this.starMesh);

    // Corona
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: this.starTexture, 
        color: starColor, 
        transparent: true, 
        blending: THREE.AdditiveBlending,
        opacity: 0.6,
        depthWrite: false
    });
    const corona = new THREE.Sprite(spriteMaterial);
    corona.scale.set(starRadius * 4, starRadius * 4, 1.0);
    this.starMesh.add(corona); 

    // Glow
    const glowGeo = new THREE.SphereGeometry(starRadius * 1.2, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: starColor,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.starMesh.add(glowMesh);

    // Distant Star Sprite (Visible from far away)
    const distantMat = new THREE.SpriteMaterial({
        map: this.starTexture,
        color: starColor,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: true, // Allow depth testing so it doesn't draw over the core
        depthWrite: false
    });
    const distantSprite = new THREE.Sprite(distantMat);
    // Scale it huge so it's visible from the outer system
    distantSprite.scale.set(starRadius * 50, starRadius * 50, 1.0); // Increased scale to match Galaxy View better
    this.starMesh.add(distantSprite);

    Logger.end(funcName);
  }

  createPlanets() {
    const funcName = 'SolarSystemView.createPlanets';
    Logger.start(funcName);
    this.planetMeshes = [];
    this.planetSystems = [];

    if (!this.planets || this.planets.length === 0) Logger.warn("StellarSystemScene: No planets to create.");

    this.planets.forEach((planet) => {
      // Ensure distance includes Star Radius to prevent clipping
      const dist = this.STAR_RADIUS + ((planet.orbitalDistance || (Math.random() * 5 + 1)) * this.AU_TO_UNITS);
      const radius = Math.max(25, (planet.radius || 1) * 60); // Drastically increased size for visibility

      const orbitGeometry = new THREE.BufferGeometry();
      const orbitPoints = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        orbitPoints.push(dist * Math.cos(angle), 0, dist * Math.sin(angle));
      }
      orbitGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(orbitPoints), 3));

      // Orbit Color based on Temperature/Distance (AU)
      let orbitColor = 0x0088ff; // Default Blue (Frigid)
      const au = planet.orbitalDistance;
      if (au < 0.8) {
          orbitColor = 0xff3333; // Red (Hot)
      } else if (au >= 0.8 && au <= 1.6) {
          orbitColor = 0x33ff33; // Green (Habitable)
      }
      const lineMaterial = new THREE.LineBasicMaterial({ color: orbitColor, transparent: true, opacity: 0.3 });
      const orbitLine = new THREE.Line(orbitGeometry, lineMaterial);
      this.systemGroup.add(orbitLine);

      // Planet Container Group (Moves around star, does not rotate on axis)
      const planetSystem = new THREE.Group();
      const startAngle = planet.startAngle !== undefined ? planet.startAngle : Math.random() * Math.PI * 2;
      planetSystem.position.set(dist * Math.cos(startAngle), 0, dist * Math.sin(startAngle));
      
      planetSystem.userData = {
          planet,
          scaledDistance: dist,
          angle: startAngle,
          orbitSpeed: (planet.orbitSpeed || 0.0001)
      };
      this.systemGroup.add(planetSystem);
      this.planetSystems.push(planetSystem);

      // Planet Mesh
      let texture;
      try {
          texture = SceneTools.generatePlanetTexture(planet);
      } catch (e) { }
      
      // Only Brown Dwarfs or specific Giants get emissive
      const isEmissive = planet.type.includes('Dwarf') || (planet.type.includes('Giant') && Math.random() > 0.7);

      // Reflectivity based on type and atmosphere
      let roughness = 0.9;
      let metalness = 0.1;
      const pType = planet.type || '';
      
      if (pType.includes('Water') || pType.includes('Ocean') || pType.includes('Ice')) {
          roughness = 0.2; // Very reflective
          metalness = 0.5;
      } else if (planet.atmosphere && planet.atmosphere !== 'None') {
          roughness = 0.4; // Atmosphere adds some sheen/scattering
      }

      const planetGeometry = new THREE.SphereGeometry(radius, 64, 64);
      const planetMaterial = new THREE.MeshStandardMaterial({ 
          map: texture || null,
          color: texture ? 0xffffff : (planet.color ? new THREE.Color().setHSL(planet.color.h, planet.color.s, planet.color.l) : 0x888888),
          roughness: roughness,
          metalness: metalness,
          emissive: isEmissive ? 0x111111 : 0x000000
      });
      const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);

      // Add a local light to the planet to simulate star reflection/edge light more strongly
      // Positioned towards the star (local 0,0,0 is planet center, parent is at distance from star)
      // We need it in the scene, not child of planet, to avoid rotation issues, or child of planetSystem
      const localLight = new THREE.PointLight(this.systemData.starColor, 1.0, radius * 10, 1);
      localLight.position.set(-dist, 0, 0).normalize().multiplyScalar(radius * 3); // Towards star
      planetMesh.add(localLight);

      // Add mesh to container
      planetSystem.add(planetMesh);
      this.planetMeshes.push(planetMesh);
      planetSystem.userData.visualMesh = planetMesh; // Reference for rotation
      
      if (planet.isHomeworld) this.homeworldMesh = planetMesh;

      if (planet.atmosphere && planet.atmosphere !== 'None') {
          const atmoGeo = new THREE.SphereGeometry(radius * 1.1, 64, 64);
          const atmoMat = new THREE.MeshPhongMaterial({ color: 0x88ccff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending });
          planetMesh.add(new THREE.Mesh(atmoGeo, atmoMat));
      }

      if (planet.type.includes('Giant') && Math.random() > 0.5) {
          const ringGeo = new THREE.RingGeometry(radius * 1.4, radius * 2.2, 64);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = Math.PI / 2;
          planetMesh.add(ringMesh);
      }

      if (planet.moons) {
        planet.moons.forEach((moon, mIdx) => {
            const MOON_ORBIT_SCALE = 300000; // Further increased scale
            
            const moonRadius = Math.max(0.5, radius * 0.2);
            // Ensure moon starts outside planet: Radius + MoonRadius + Buffer + Scaled Distance
            let moonDist = radius + moonRadius + 40 + (moon.orbitalDistance * MOON_ORBIT_SCALE); // Increased buffer
            
            // Clamp rings close
            if (moon.isRing) {
                moonDist = radius * 1.5 + (mIdx * 2);
            }

            let moonGeometry;
            if (moon.isRing) {
                moonGeometry = new THREE.RingGeometry(moonDist - 1, moonDist + 1, 32);
                moonGeometry.rotateX(-Math.PI / 2);
            } else {
                moonGeometry = new THREE.SphereGeometry(moonRadius, 32, 32);
            }
            
            const moonMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
            const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
            
            const moonAngle = Math.random() * Math.PI * 2;
            moonMesh.userData = { 
                moon: moon,
                distance: moonDist,
                angle: moonAngle,
                orbitSpeed: 0.5 + (Math.random() * 0.5) // Relative speed around planet
            };
            if (moon.isHomeworld) {
                moonMesh.userData.isHomeworld = true;
                this.homeworldMesh = moonMesh;
            }
            
            if (moon.isRing) {
                moonMesh.position.set(0, 0, 0); // Rings centered on planet
            } else {
                moonMesh.position.set(moonDist * Math.cos(moonAngle), 0, moonDist * Math.sin(moonAngle));
            }
            
            // Moon Orbit
            if (!moon.isRing && moon.type !== 'Quasi-Satellite') {
                const moonOrbitGeo = new THREE.BufferGeometry();
                const moonOrbitPoints = [];
                const mSegments = 64;
                for (let j = 0; j <= mSegments; j++) {
                    const mAngle = (j / mSegments) * Math.PI * 2;
                    moonOrbitPoints.push(moonDist * Math.cos(mAngle), 0, moonDist * Math.sin(mAngle));
                }
                moonOrbitGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(moonOrbitPoints), 3));
                // Bright yellow orbit line for visibility
                const moonOrbitLine = new THREE.Line(moonOrbitGeo, new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 }));
                planetSystem.add(moonOrbitLine);
            }
            
            planetSystem.add(moonMesh);
        });
      }
    });
    Logger.end(funcName);
  }

  // ... (playIntroSequence remains largely the same, but uses virtualCamera/cinematicCamera)

  playIntroSequence() {
      Logger.message("StellarSystemScene: Playing intro sequence...");
      if (!this.playIntro) return Promise.resolve();
      if (this.isIntroPlaying && this.introPromise) return this.introPromise;

      this.isIntroPlaying = true;
      this.shouldUpdateControls = false;
      this.pathPoints = [];
      
      this.introStartPos.set(0, this.systemRadius * 10, this.systemRadius * 5);
      this.introStarFlybyPos.set(this.starRadius * 3, this.starRadius, this.starRadius * 3);
      
      this.cinematicCamera.fov = 60;
      this.cinematicCamera.updateProjectionMatrix();
      this.cinematicCamera.position.copy(this.introStartPos);
      this.cinematicCamera.lookAt(0, 0, 0);

      this.introStartTime = performance.now();
      
      this.introPromise = new Promise(resolve => {
          this.introResolve = resolve;
          // Reset Orrery Path to avoid "jump" lines
          if (this.orrery) {
              this.orrery.resetPath();
          }
          
          // Switch to cinematic camera
          this.setActiveCamera('cinematic');
          const controls = this.cameraControls.get('systemMain');
          if (controls) controls.enabled = false;

          this.systemGroup.updateMatrixWorld(true);

          const getWorldPos = (obj) => {
              const vec = new THREE.Vector3();
              obj.getWorldPosition(vec);
              return vec;
          };

          // Targets
          const starPos = new THREE.Vector3(0, 0, 0);
          
          // 1. Find Homeworld Target (Planet or Moon)
          let homeworld = null;
          let homeSystem = this.planetSystems.find(s => s.userData.planet && s.userData.planet.isHomeworld) || this.planetSystems[0];

          // Fallback if no planets exist at all
          if (!homeSystem) {
              Logger.warn("StellarSystemScene: No planets found. Creating virtual homeworld for intro.");
              homeSystem = new THREE.Object3D();
              homeSystem.position.set(this.systemRadius * 0.3, 0, 0); // Place it somewhere
              homeSystem.userData = { planet: { radius: 10 }, visualMesh: homeSystem };
          }

          if (homeSystem) {
              homeworld = homeSystem.userData.visualMesh;
              if (homeSystem.children && homeSystem.children.length > 0) {
                  // Check for homeworld moon
                  const hwMoon = homeSystem.children.find(c => c.userData.isHomeworld);
                  if (hwMoon) {
                      homeworld = hwMoon;
                  } else {
                      homeworld = homeSystem.userData.visualMesh;
                  }
              }
          }

          // 2. Find Flyby Target (Outer Planet)
          // Look for a planet further out than the homeworld to fly past
          let flybySystem = null;
          if (this.planetSystems && this.planetSystems.length > 0) {
              const outerSystems = this.planetSystems.filter(s => 
                  s !== homeSystem && 
                  s.userData.planet && 
                  s.userData.planet.orbitalDistance > (homeSystem.userData.planet.orbitalDistance || 0)
              );
              
              // Pick the largest outer planet, or just any other system if none are outer
              if (outerSystems.length > 0) {
                  flybySystem = outerSystems.sort((a, b) => (b.userData.planet.radius || 0) - (a.userData.planet.radius || 0))[0];
              } else {
                  // If homeworld is the outermost, try to find an inner planet to fly by
                  const otherSystems = this.planetSystems.filter(s => s !== homeSystem);
                  if (otherSystems.length > 0) {
                      flybySystem = otherSystems[otherSystems.length - 1]; // Furthest other planet
                  } else {
                      flybySystem = homeSystem;
                  }
              }
          }
          Logger.message(`StellarSystemScene: Flyby Target selected: ${flybySystem.userData.planet.name || 'Unknown'}`);

          // 3. Calculate Path Points in Local Space
          // We calculate in Local Space to ensure the path aligns with the orbital plane (XZ)
          // regardless of how the systemGroup is rotated in World Space.
          
          // End Position: Inside orbit of homeworld, facing it.
          const hwWorld = getWorldPos(homeworld);
          const hwLocal = hwWorld.clone();
          this.systemGroup.worldToLocal(hwLocal);
          
          const hwRadius = (homeworld.geometry && homeworld.geometry.parameters.radius) || 10;
          const vecStarToHW = hwLocal.clone().normalize(); // Star is at 0,0,0 local
          
          // Position: HW Position minus vector from star (placing it "inside" the orbit, facing planet)
          const endPos = hwLocal.clone().sub(vecStarToHW.multiplyScalar(hwRadius * 4.0)).add(new THREE.Vector3(0, hwRadius * 1.0, 0));

          // Flyby Position
          let flybyPos;
          let flybyRadius = 20;
          if (flybySystem) {
              const fbMesh = flybySystem.userData.visualMesh || flybySystem; 
              const fbWorld = getWorldPos(fbMesh);
              const fbLocal = fbWorld.clone();
              this.systemGroup.worldToLocal(fbLocal);
              
              flybyRadius = (fbMesh.geometry && fbMesh.geometry.parameters.radius) || 20;
              
              // Calculate a safe flyby point:
              // Perpendicular to the path towards homeworld to create a nice curve
              let vecToHW = hwLocal.clone().sub(fbLocal);
              if (vecToHW.lengthSq() < 1) {
                  // Fallback vector if start/end are same (e.g. single planet system)
                  vecToHW = new THREE.Vector3(1, 0, 0);
              }
              vecToHW.normalize();
              const up = new THREE.Vector3(0, 1, 0); // Local Up
              const side = new THREE.Vector3().crossVectors(vecToHW, up).normalize();
              
              // Pass 3 radii to the side and 1.5 radii up for a closer, more dramatic flyby
              flybyPos = fbLocal.clone().add(side.multiplyScalar(flybyRadius * 3)).add(new THREE.Vector3(0, flybyRadius * 1.5, 0));
          } else {
              // Fallback: Midpoint with offset
              flybyPos = hwLocal.clone().multiplyScalar(0.5).add(new THREE.Vector3(200, 100, 0));
          }

          // Start Position: Outside system, 20 degrees above ecliptic
          // Vector from Star -> Flyby Planet
          const outwardVec = flybyPos.clone().normalize();

          // Calculate start distance relative to the Flyby target, rather than the system edge
          // This ensures we start "outside" the flyby event, but not necessarily at the edge of the Oort cloud
          const flybyDistFromStar = new THREE.Vector3(flybyPos.x, 0, flybyPos.z).length();
          const startDist = Math.max(flybyDistFromStar * 1.4, this.STAR_RADIUS * 10, 200); 

          const elevationAngle = 15 * (Math.PI / 180); 
          
          // Position: Along the outward vector (projected to XZ), but elevated
          const flatOutward = new THREE.Vector3(outwardVec.x, 0, outwardVec.z).normalize();
          const startPos = flatOutward.clone().multiplyScalar(startDist * Math.cos(elevationAngle));
          startPos.y = startDist * Math.sin(elevationAngle); 

          // Add an intermediate point to create an arc
          // Midpoint between Start and Flyby, but pushed "up" to create a cinematic arc
          const distStartToFlyby = startPos.distanceTo(flybyPos);
          const midPoint = startPos.clone().lerp(flybyPos, 0.5);
          midPoint.y += distStartToFlyby * 0.05; // Reduced arc height for smoother path

          const localPoints = [startPos, midPoint, flybyPos, endPos];
          
          // Create Curve
          const validLocalPoints = localPoints.filter(p => p instanceof THREE.Vector3 && !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z));
          if (validLocalPoints.length < 2) {
              Logger.error("StellarSystemScene: Not enough valid points for intro curve.", localPoints);
              this.isIntroPlaying = false;
              this.shouldUpdateControls = true;
              this.setActiveCamera('systemMain');
              if (controls) {
                  controls.enabled = true;
              }
              return;
          }
          
          // Create Local Curve for Orrery
          this.introCurve = new THREE.CatmullRomCurve3(validLocalPoints);
          this.introCurve.curveType = 'catmullrom';
          this.introCurve.tension = 0.1; // Low tension for straighter lines

          // Set Intro Path on Orrery immediately
          if (this.orrery) {
              const pathPoints = this.introCurve.getPoints(2000); // High resolution path
              this.orrery.setIntroPath(pathPoints, this.AU_TO_UNITS);
          }

          // Convert Local Points to World Space for Camera Animation
          const worldPoints = validLocalPoints.map(p => {
              const wp = p.clone();
              this.systemGroup.localToWorld(wp);
              return wp;
          });
          this.introCurveWorld = new THREE.CatmullRomCurve3(worldPoints);
          this.introCurveWorld.curveType = 'catmullrom';
          this.introCurveWorld.tension = 0.1;

          // Set initial camera position to start of curve immediately
          this.cinematicCamera.position.copy(worldPoints[0]);
          
          // Look at the first target (Flyby Planet) in World Space
          const flybyWorld = flybyPos.clone();
          this.systemGroup.localToWorld(flybyWorld);
          this.cinematicCamera.lookAt(flybyWorld); 

          // Force update Orrery Marker to start position immediately (in Local Space)
          if (this.orrery) {
              const localCamPos = this.cinematicCamera.position.clone();
              this.systemGroup.worldToLocal(localCamPos);
              this.orrery.updateCameraMarker(localCamPos, this.AU_TO_UNITS);
          }
          
          // LookAt Curve (Interpolate between targets)
          this.introTargets = [
              { target: flybySystem ? (flybySystem.userData.visualMesh || flybySystem) : this.starMesh, time: 0.0 }, 
              { target: flybySystem ? (flybySystem.userData.visualMesh || flybySystem) : this.starMesh, time: 0.5 }, 
              { target: homeworld, time: 0.85 }, 
              { target: homeworld, time: 1.0 }    
          ];

          this.introStartTime = performance.now();
      });
      return this.introPromise;
  }

  onLoad() {
    super.onLoad();
    this.renderer.domElement.addEventListener('click', this.onMouseClick);
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    Controls.setLockingEnabled(true);
    
    if (this.hudElement) {
        this.viewManager.setHUD(this.hudElement);
    }

    if (this.playIntro) {
        this.playIntroSequence();
    }
  }

  onUnload() {
    super.onUnload();
    this.renderer.domElement.removeEventListener('click', this.onMouseClick);
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    Controls.setLockingEnabled(false);
    
    // Reset Renderer State to ensure subsequent scenes (like ShipShowcase) use the full canvas
    this.renderer.setScissorTest(false);
    this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    this.renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);

    if (this.viewManager) {
        this.viewManager.setHUD(null);
    }

    if (this.viewManager && this.viewManager.uiMessage) {
        this.viewManager.uiMessage.closeMessage('planet_scan');
    }
  }

  onKeyDown(event) {
      const key = event.key.toLowerCase();
      if (this.keys.hasOwnProperty(key)) this.keys[key] = true;
      if (event.key === 'Shift') this.keys.shift = true;
  }

  onKeyUp(event) {
      const key = event.key.toLowerCase();
      if (this.keys.hasOwnProperty(key)) this.keys[key] = false;
      if (event.key === 'Shift') this.keys.shift = false;
  }

  onMouseClick(event) {
    // Left click is now reserved for Pointer Lock / Taking Control
    // Planet scanning is handled by Gaze (center screen) or Right Click on Orrery
  }

  onContextMenu(event) {
    event.preventDefault(); // Prevent default browser context menu

    // Check if clicking in Orrery PiP
    if (!this.showOrrery || !this.orrery || !this.orreryCamera) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // PiP Dimensions (must match render loop)
    const pipSize = Math.min(width, height) * 0.25; 
    const margin = 20;

    // Calculate PiP bounds in DOM coordinates (Top-Left origin)
    // Renderer viewport (Bottom-Left origin): x = width - pipSize - margin, y = margin
    // DOM Rect:
    // Left: width - pipSize - margin
    // Top: height - margin - pipSize
    // Right: width - margin
    // Bottom: height - margin

    if (mouseX >= width - pipSize - margin && mouseX <= width - margin &&
        mouseY >= height - margin - pipSize && mouseY <= height - margin) {
        
        // Calculate normalized device coordinates for PiP
        const pipLeft = width - pipSize - margin;
        const pipTop = height - margin - pipSize;
        
        const ndcX = ((mouseX - pipLeft) / pipSize) * 2 - 1;
        const ndcY = -((mouseY - pipTop) / pipSize) * 2 + 1;
        
        const mouseVector = new THREE.Vector2(ndcX, ndcY);
        this.raycaster.setFromCamera(mouseVector, this.orreryCamera);
        
        // Intersect with Orrery planets
        const intersects = this.raycaster.intersectObjects(this.orrery.planetMeshes);
        
        if (intersects.length > 0) {
            const mesh = intersects[0].object;
            // In OrreryScene, mesh is child of planetGroup. planetGroup has userData.planet
            const planet = mesh.parent.userData.planet;
            if (planet) this.showPlanetScan(planet);
        }
    }
  }

  onMouseMove(event) {
    const mouse = SceneTools.getMouseVector(event, this.renderer.domElement);
    this.raycaster.setFromCamera(mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.planetMeshes);
    this.planetMeshes.forEach(m => { if (m.userData.isHovered) { m.scale.set(1, 1, 1); m.userData.isHovered = false; } });
    if (intersects.length > 0) { intersects[0].object.userData.isHovered = true; intersects[0].object.scale.set(1.2, 1.2, 1.2); }
  }

  animate() {
    if (!this.isActive) return;

    const time = performance.now();
    const delta = (time - (this.lastTime || time));
    this.lastTime = time;

    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    // Update Global Controls
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
        const renderer = this.renderer;
        const size = new THREE.Vector2();
        renderer.getSize(size);
        renderer.autoClear = false;
        renderer.clear();

        // Floating Origin Sync
        // Move the world opposite to the active (virtual) camera's position
        this.worldGroup.position.copy(this.activeCamera.position).negate();
        
        // Sync rendering camera rotation with active virtual camera
        this.camera.quaternion.copy(this.activeCamera.quaternion);
        this.camera.updateMatrixWorld();

        // 1. Main Viewport
        renderer.setViewport(0, 0, size.x, size.y);
        renderer.setScissor(0, 0, size.x, size.y);
        renderer.setScissorTest(false);
        // Render using the static rendering camera (at 0,0,0)
        renderer.render(this.scene, this.camera);

        // 2. PiP Orrery (Only during intro)
        if ((this.isIntroPlaying || this.showOrrery) && this.orrery && this.orreryCamera) {
            const pipSize = Math.min(size.x, size.y) * 0.25; 
            const margin = 20;

            renderer.setViewport(size.x - pipSize - margin, margin, pipSize, pipSize);
            renderer.setScissor(size.x - pipSize - margin, margin, pipSize, pipSize);
            renderer.setScissorTest(true);
            renderer.clearDepth(); 
            
            // Render Orrery Scene
            renderer.render(this.orrery.scene, this.orreryCamera);
            
            renderer.setScissorTest(false);
        }
    }
  }

  update(time, delta) {
    super.update(time, delta);

    if (this.isIntroPlaying) {
        this.updateIntroAnimation(time);
        // Hide HUD during intro
        if (this.hudElement) this.hudElement.style.display = 'none';
    } else if (this.activeCameraName === 'systemMain') {
        this.updateSpectatorControls(delta);
        this.updateGazeScan(delta);
        // Show HUD during gameplay
        if (this.hudElement) this.hudElement.style.display = 'block';
    }

    this.updateSpaceDust();
    this.updateCameras(delta);

    // Update HUD
    if (this.hudElement && this.virtualCamera && !this.isIntroPlaying) {
        const pos = this.virtualCamera.position;
        this.hudElement.innerHTML = `SPECTATOR CAM<br>----------------<br>SPEED: ${Math.round(this.spectatorSpeed)} u/s<br>POS: ${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}<br><br>Controls:<br>WASD: Move<br>Q/E: Up/Down<br>Shift: Boost (x5)<br>Scroll: Adjust Speed`;
    }

    // Failsafe: Prevent camera from being stuck at origin
    if (this.activeCamera.position.lengthSq() < 50) {
        this.activeCamera.position.set(0, 100, 300);
    }

    // 2. Planet Rotation & Orbit
    this.planetSystems.forEach((system, index) => {
      const dist = system.userData.scaledDistance;
      const speed = system.userData.orbitSpeed;
      const angle = (Date.now() * speed * 0.0001) + system.userData.angle;
      system.position.x = dist * Math.cos(angle);
      system.position.z = dist * Math.sin(angle);

      if (system.userData.visualMesh) {
          system.userData.visualMesh.rotation.y += system.userData.planet.spinSpeed || 0.001;
      }

      // Sync Orrery Planet Angle to match Main System exactly
      if (this.orrery && this.orrery.planetGroups && this.orrery.planetGroups[index]) {
          this.orrery.planetGroups[index].userData.angle = angle;
      }

      // Animate Moons
      system.children.forEach(child => {
          if (child.userData.moon && child.userData.orbitSpeed) {
              child.userData.angle += child.userData.orbitSpeed * delta * 0.001;
              child.position.x = child.userData.distance * Math.cos(child.userData.angle);
              child.position.z = child.userData.distance * Math.sin(child.userData.angle);
          }
      });
    });

    // 3. Collision Avoidance (Prevent camera clipping)
    const activeCam = this.activeCamera;
    const safeDistance = 100; // Minimum distance from surface
    
    // Check Star
    if (this.starMesh) {
        const dist = activeCam.position.distanceTo(this.starMesh.position);
        const min = this.starMesh.geometry.parameters.radius + safeDistance;
        if (dist < min) {
            const dir = activeCam.position.clone().sub(this.starMesh.position).normalize();
            activeCam.position.copy(this.starMesh.position).add(dir.multiplyScalar(min));
        }
    }

    // Check Planets
    this.planetSystems.forEach(system => {
        // Need world position as planets move
        const worldPos = new THREE.Vector3();
        system.getWorldPosition(worldPos);
        const dist = activeCam.position.distanceTo(worldPos);
        const min = (system.userData.visualMesh ? system.userData.visualMesh.geometry.parameters.radius : 10) + safeDistance;
        if (dist < min) {
            const dir = activeCam.position.clone().sub(worldPos).normalize();
            activeCam.position.copy(worldPos).add(dir.multiplyScalar(min));
        }
    });

    // 4. Update Orrery PiP
    if (this.orrery) {
        this.orrery.update(time, delta);
        
        // Convert camera position to Local Space for Orrery update
        const localCamPos = this.activeCamera.position.clone();
        if (this.systemGroup) this.systemGroup.worldToLocal(localCamPos);
        this.orrery.updateCameraMarker(localCamPos, this.AU_TO_UNITS);
    }
  }

  updateSpectatorControls(delta) {
      const dt = delta / 1000;
      // Acceleration based movement
      const acceleration = this.spectatorSpeed * (this.keys.shift ? 5 : 1); 
      const drag = 2.0; // Drag coefficient
      
      // Calculate target velocity based on input
      const inputVector = new THREE.Vector3();

      // WASD Movement (Relative to camera orientation)
      if (this.keys.w) inputVector.z -= 1;
      if (this.keys.s) inputVector.z += 1;
      if (this.keys.a) inputVector.x -= 1;
      if (this.keys.d) inputVector.x += 1;
      
      // Vertical Movement (Q/E)
      if (this.keys.q) inputVector.y += 1;
      if (this.keys.e) inputVector.y -= 1;

      inputVector.normalize().multiplyScalar(acceleration * dt);
      
      // Apply input to velocity (relative to camera rotation)
      inputVector.applyQuaternion(this.virtualCamera.quaternion);
      this.spectatorVelocity.add(inputVector);
      
      // Apply Drag
      this.spectatorVelocity.multiplyScalar(1 - Math.min(1, drag * dt));
      
      // Apply velocity to camera
      this.virtualCamera.position.add(this.spectatorVelocity.clone().multiplyScalar(dt));
      
      const mouseDeltas = Controls.consumeMouseMovement();

      // Mouse Rotation (Pointer Lock)
      if (document.pointerLockElement) { 
           const { x, y } = mouseDeltas;
           
           // Quaternion based rotation (Free look / Trackball style)
           const sensitivity = this.spectatorLookSpeed * 0.5;
           const qx = new THREE.Quaternion();
           qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -x * sensitivity);
           const qy = new THREE.Quaternion();
           qy.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -y * sensitivity);
           
           this.virtualCamera.quaternion.multiply(qx);
           this.virtualCamera.quaternion.multiply(qy);
           this.virtualCamera.quaternion.normalize();
      }
      
      // Speed Adjustment (Mouse Wheel)
      const wheel = mouseDeltas.wheel;
      if (wheel !== 0) {
          const factor = wheel < 0 ? 1.2 : 0.8; // Scroll Up (neg) to increase, Down (pos) to decrease
          this.spectatorSpeed *= factor;
          this.spectatorSpeed = Math.max(10, Math.min(this.spectatorSpeed, 1000000)); // Clamp speed
      }
  }

  updateGazeScan(delta) {
      // Raycast from center of screen (0,0) using the rendering camera
      // The rendering camera is fixed at 0,0,0 but rotates with the virtual camera
      // However, the world moves around it. 
      // Raycasting from (0,0) in camera space works because the camera is the eye.
      
      this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
      const intersects = this.raycaster.intersectObjects(this.planetMeshes);
      
      if (intersects.length > 0) {
          const planet = intersects[0].object.parent?.userData?.planet;
          
          if (planet && this.currentScanTarget !== planet) {
              this.currentScanTarget = planet;
              this.scanHoverTime = 0;
              this.scanTriggered = false; // Reset trigger when target changes
          } else if (planet && !this.scanTriggered) {
              this.scanHoverTime += delta;
              if (this.scanHoverTime > 500) { // 0.5s hover to trigger
                  this.showPlanetScan(planet);
                  this.scanTriggered = true; // Mark as triggered so it doesn't spam/reopen
              }
          }
      } else {
          if (this.currentScanTarget) {
              // Lost target
              this.scanHoverTime = 0;
              this.currentScanTarget = null;
              this.scanTriggered = false;
              // Close the scan window if it's open
              if (this.viewManager.uiMessage && typeof this.viewManager.uiMessage.closeMessage === 'function') {
                  this.viewManager.uiMessage.closeMessage('planet_scan');
              }
          }
      }
  }

  updateSpaceDust() {
      if (!this.dustSystem || !this.activeCamera) return;
      
      const positions = this.dustSystem.geometry.attributes.position.array;
      const camPos = this.activeCamera.position;
      const range = 4000; // Match creation range
      const halfRange = range / 2;
      
      let needsUpdate = false;
      
      for (let i = 0; i < positions.length / 3; i++) {
          const ix = i * 3;
          const iy = i * 3 + 1;
          const iz = i * 3 + 2;
          
          // Calculate distance from camera in World Space
          const dx = positions[ix] - camPos.x;
          const dy = positions[iy] - camPos.y;
          const dz = positions[iz] - camPos.z;
          
          // If too far, wrap around to the other side to create infinite field illusion
          // We wrap to the opposite edge (e.g., if > 500, move to -500 relative to camera)
          if (Math.abs(dx) > halfRange) { 
              positions[ix] = camPos.x - Math.sign(dx) * (halfRange - 10); 
              needsUpdate = true; 
          }
          if (Math.abs(dy) > halfRange) { 
              positions[iy] = camPos.y - Math.sign(dy) * (halfRange - 10); 
              needsUpdate = true; 
          }
          if (Math.abs(dz) > halfRange) { 
              positions[iz] = camPos.z - Math.sign(dz) * (halfRange - 10); 
              needsUpdate = true; 
          }
      }
      
      if (needsUpdate) {
          this.dustSystem.geometry.attributes.position.needsUpdate = true;
      }
  }

  updateIntroAnimation(time) {
      const elapsed = time - this.introStartTime;
      const progress = Math.min(elapsed / this.introDuration, 1);

      const homeworld = this.homeworldMesh || this.planetMeshes[0];
      if (!homeworld) return;

      // Calculate Dynamic Target Position in World Space (relative to worldGroup)
      const worldPos = new THREE.Vector3();
      homeworld.getWorldPosition(worldPos);
      worldPos.sub(this.worldGroup.position);

      const targetRadius = homeworld.geometry.parameters.radius || 1;
      const offsetDist = targetRadius * 2.5;
      const planetToStar = worldPos.clone().negate().normalize();
      const endPos = worldPos.clone().add(planetToStar.multiplyScalar(offsetDist)).add(new THREE.Vector3(0, targetRadius * 0.5, 0));

      let currentTargetPos = new THREE.Vector3();
      let currentLookAt = new THREE.Vector3();

      // Use the pre-calculated world curve if available
      if (this.introCurveWorld) {
          const camPos = this.introCurveWorld.getPointAt(progress);
          this.cinematicCamera.position.copy(camPos);
          
          // LookAt Interpolation
          // Find current segment
          for (let i = 0; i < this.introTargets.length - 1; i++) {
              if (progress >= this.introTargets[i].time && progress <= this.introTargets[i+1].time) {
                  const t = (progress - this.introTargets[i].time) / (this.introTargets[i+1].time - this.introTargets[i].time);
                  // Ease the lookAt transition
                  const easeT = t * t * (3 - 2 * t); 
                  
                  const getWorldPos = (obj) => {
                      const vec = new THREE.Vector3();
                      obj.getWorldPosition(vec);
                      return vec;
                  };
                  const posA = getWorldPos(this.introTargets[i].target);
                  const posB = getWorldPos(this.introTargets[i+1].target);
                  currentLookAt.lerpVectors(posA, posB, easeT);
                  break;
              }
          }
          this.cinematicCamera.lookAt(currentLookAt);
      } else {
          // Fallback simple lerp if curve failed
          if (progress < 0.4) {
              const p = progress / 0.4;
              const t = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
              currentTargetPos.lerpVectors(this.introStartPos, this.introStarFlybyPos, t);
              currentLookAt.set(0, 0, 0);
          } else {
              const p = (progress - 0.4) / 0.6;
              const t = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
              currentTargetPos.lerpVectors(this.introStarFlybyPos, endPos, t);
              currentLookAt.lerpVectors(new THREE.Vector3(0,0,0), worldPos, t);
          }
          this.cinematicCamera.position.copy(currentTargetPos);
          this.cinematicCamera.lookAt(currentLookAt);
      }

      if (progress >= 1) {
          this.isIntroPlaying = false;
          this.shouldUpdateControls = true;
          const mainControls = this.cameraControls.get('systemMain');
          
          // Sync virtual camera to cinematic end position
          this.virtualCamera.position.copy(this.cinematicCamera.position);
          this.virtualCamera.quaternion.copy(this.cinematicCamera.quaternion);

          // If we were using standard controls, we'd update target here.
          // Since we are using custom spectator controls, we just set the position/rotation.
          
          this.setActiveCamera('systemMain');
          
          if (this.introResolve) {
              this.introResolve();
              this.introResolve = null;
              this.introPromise = null;
          }
      }
  }

  showPlanetScan(planet) {
      this.viewManager.uiMessage.showMessage({
          key: 'planet_scan',
          title: `Planetary Scan: ${planet.name}`,
          template: 'planet_lore',
          data: { ...planet, techProfile: { techLevel: 'Unknown', specialization: 'None', knownProficiencies: [] } },
          actions: [{ label: 'Land on Surface', callback: () => this.viewManager.showPlanetSurface(planet) }]
      });
  }

  // --- Camera Management ---

  addSpectatorCamera(id, targetObject) {
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100000);
      this.scene.add(camera);
      this.spectatorCameras.set(id, { camera, target: targetObject });
      this.addCamera(`spectator_${id}`, camera);
      return camera;
  }

  addTrailingCamera(id, targetObject, distance = 50, height = 20) {
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100000);
      this.scene.add(camera);
      this.trailingCameras.set(id, { camera, target: targetObject, distance, height });
      this.addCamera(`trail_${id}`, camera);
      return camera;
  }

  updateCameras(delta) {
      // Update Spectator Cameras (LookAt)
      this.spectatorCameras.forEach((data) => {
          if (data.target) {
              data.camera.lookAt(data.target.position);
          }
      });

      // Update Trailing Cameras
      this.trailingCameras.forEach((data) => {
          if (data.target) {
              const targetPos = data.target.position;
              // Calculate desired position behind ship
              // Assuming standard object orientation where +Z is forward
              const offset = new THREE.Vector3(0, data.height, -data.distance);
              offset.applyEuler(data.target.rotation); 
              offset.add(targetPos);
              
              // Smoothly interpolate camera position
              data.camera.position.lerp(offset, 0.1);
              data.camera.lookAt(targetPos);
          }
      });
  }

  async generatePlanetIcons() {
      if (!this.snapshotCamera || !this.renderer) return;
      
      Logger.message("StellarSystemScene: Generating planet icons...");

      const size = 256;
      const renderTarget = new THREE.WebGLRenderTarget(size, size);
      const originalTarget = this.renderer.getRenderTarget();
      const originalAspect = this.snapshotCamera.aspect;
      
      this.snapshotCamera.aspect = 1;
      this.snapshotCamera.updateProjectionMatrix();

      this.planetSystems.forEach(system => {
          const planetMesh = system.userData.visualMesh;
          const planetData = system.userData.planet;
          
          if (planetMesh && planetData) {
              // Get World Position
              const worldPos = new THREE.Vector3();
              planetMesh.getWorldPosition(worldPos);
              
              const radius = planetMesh.geometry.parameters.radius;
              const dist = radius * 2.5;
              
              // Position camera: Offset from planet towards the star (to catch the lit side)
              // Star is at worldGroup.position (0,0,0 in local space, but worldGroup moves)
              // Actually, Star Light is at 0,0,0 in worldGroup.
              // So vector from Planet to Star (in world space)
              const starWorldPos = new THREE.Vector3();
              this.starMesh.getWorldPosition(starWorldPos);
              
              const dirToStar = starWorldPos.clone().sub(worldPos).normalize();
              
              // Place camera along this vector, but slightly elevated to see features
              const camPos = worldPos.clone().add(dirToStar.multiplyScalar(dist));
              camPos.y += radius * 0.5;
              
              this.snapshotCamera.position.copy(camPos);
              this.snapshotCamera.lookAt(worldPos);
              
              // Render
              this.renderer.setRenderTarget(renderTarget);
              this.renderer.render(this.scene, this.snapshotCamera);
              
              // Extract image
              const canvas = document.createElement('canvas');
              canvas.width = size; canvas.height = size;
              const context = canvas.getContext('2d');
              context.drawImage(this.renderer.domElement, 0, 0, size, size); // Fallback if readPixels is complex
              // Note: Proper readPixels implementation is verbose, using toDataURL from renderer is easier if preserveDrawingBuffer is on.
              // But since we are rendering to a target, we can use renderer.domElement if we rendered to screen, but we didn't.
              // For simplicity in this snippet, we'll assume the renderer can output the target or we skip the complex buffer read for now.
              // Ideally: planetData.icon = ... (Buffer read logic)
          }
      });

      this.renderer.setRenderTarget(originalTarget);
      this.snapshotCamera.aspect = originalAspect;
      this.snapshotCamera.updateProjectionMatrix();
      renderTarget.dispose();
  }

  dispose() {
    this.renderer.domElement.removeEventListener('click', this.onMouseClick);
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    const funcName = 'SolarSystemView.dispose';
    Logger.start(funcName);
    super.dispose();
  }
}
