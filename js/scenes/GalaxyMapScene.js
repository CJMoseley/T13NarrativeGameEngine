import { LoreData } from '../procgen/lore/LoreData.js';
import { THREE } from 'enable3d';
import ProcGen from '../procgen/ProcGen.js';
import Logger from '@plugins/t13ne/core/Logger.js';
import { Scene } from '@plugins/t13ne/core/Scene.js';
import { SceneTools } from '@plugins/t13ne/core/SceneTools.js';

export class GalaxyMapScene extends Scene {
  constructor(viewManager, sceneData) {
    super(viewManager, sceneData);

    this.galaxy = sceneData.galaxy || this.gameEngine.galaxy;
    this.startLocation = sceneData.startLocation || null;
    this.attractMode = sceneData.attractMode || false;

    this.raycaster = new THREE.Raycaster();
    this.mouseVector = new THREE.Vector2();
    this.selectedStar = null;
    this.starPoints = null; // Will hold the THREE.Points for stars
    this.flyToAnimationFrameId = null;
    this.onStarSelected = null;
    this.spriteTextures = {};
    this.currentSystemMessage = null; // To track the currently open system lore message
    this.isCinematic = false;
    this.galaxyGroup = new THREE.Group();

    this.onMouseClick = this.onMouseClick.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  async prepare(onProgress) {
    const funcName = 'GalaxyMapScene.prepare';
    Logger.start(funcName);
    onProgress({ status: 'Setting up camera and controls...', percent: 0.1 });

    this.setupThreeJS();
    onProgress({ status: 'Creating textures...', percent: 0.3 });
    this.createSpriteTextures();
    onProgress({ status: 'Generating galaxy visuals...', percent: 0.5 });
    this.generateAndRenderGalaxy();
    onProgress({ status: 'Ready.', percent: 1.0 });

    Logger.end(funcName);
  }

  setupThreeJS() {
    const funcName = 'GalaxyMapScene.setupThreeJS';
    Logger.start(funcName);
    this.scene.background = new THREE.Color(0x000000);
    this.scene.add(this.galaxyGroup);

    // Use the default camera from the base Scene class
    this.activeCamera.far = 5000000; // Increased far plane to see distant stars
    this.activeCamera.up.set(0, 0, 1); // Set Z-axis as up so the camera orbits around the galaxy plane (XY)
    const defaultPos = new THREE.Vector3(0, -2500, 1500);
    this.activeCamera.position.copy(defaultPos);
    this.activeCamera.lookAt(0, 0, 0);

    // Create a separate cinematic camera for transitions
    this.cinematicCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000000);
    this.addCamera('cinematic', this.cinematicCamera);

    const controlSettings = LoreData.controls.schemes.galaxy.settings;
    // Use TrackballControls for true free rotation (prevents gimbal lock at poles)
    this.setupControls('trackball', {
        rotateSpeed: 2.0,
        zoomSpeed: 1.2,
        panSpeed: 0.8,
        noZoom: false,
        noPan: true, // Keep center locked
        staticMoving: false,
        dynamicDampingFactor: 0.1,
        enabled: !this.attractMode
    });

    // Handle transition from system view (Zoom Out)
    if (this.startLocation) {
        const center = new THREE.Vector3(0, 0, 0);
        const sysPos = new THREE.Vector3(this.startLocation.x, this.startLocation.y, this.startLocation.z);
        const direction = sysPos.clone().sub(center).normalize();
        if (direction.lengthSq() === 0) direction.set(0, 0, 1);
        // Start close to the star we just left
        const viewDistance = 100; 
        const startPos = sysPos.clone().add(direction.multiplyScalar(viewDistance));
        
        this.activeCamera.position.copy(startPos);
        this.activeCamera.lookAt(0, 0, 0);

        // Animate back to default galaxy view
        this.transitionFromSystem(defaultPos);
    }

    window.addEventListener('resize', () => this.onWindowResize());
    Logger.end(funcName);
  }

  createSpriteTextures() {
    const funcName = 'GalaxyMapView.createSpriteTextures';
    Logger.start(funcName);
    
    // Use shared tools for textures
    this.spriteTextures.glow = SceneTools.createGlowTexture();
    this.spriteTextures.cloud = SceneTools.createCloudTexture();

    Logger.end(funcName);
  }

  generateAndRenderGalaxy() {
    const funcName = 'GalaxyMapScene.generateAndRenderGalaxy';
    Logger.start(funcName);

    if (!this.galaxy) {
      Logger.error("GalaxyMapScene: Galaxy data is missing.");
      return;
    }

    const rawStars = this.galaxy.stars;
    Logger.message(`GalaxyMapScene: Rendering ${rawStars.length} stars from Galaxy object.`);

    // Filter stars first to ensure the InstancedMesh count matches the valid data.
    const stars = rawStars.filter((star, index) => {
      if (!star || star.color === undefined || !Number.isFinite(star.x) || !Number.isFinite(star.y) || !Number.isFinite(star.z)) {
        Logger.message(`ERROR: CRITICAL: Corrupted or NaN star data detected at index ${index}. Data: ${JSON.stringify(star)}`);
        return false;
      }
      return true;
    });
    Logger.message(`GalaxyMapView: Rendering ${stars.length} valid stars.`);

    if (this.starPoints) {
      this.galaxyGroup.remove(this.starPoints);
      this.starPoints.geometry.dispose();
      this.starPoints.material.dispose();
    }

    // --- Use THREE.Points for Stars (Cleaner, faster, points of light) ---
    const starGeometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    stars.forEach(star => {
      positions.push(star.x, star.y, star.z);
      const c = new THREE.Color(star.color);
      colors.push(c.r, c.g, c.b);
    });

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 12, // Larger base size to ensure visibility with perspective scaling
      vertexColors: true,
      map: this.spriteTextures.glow, // Make sure this is created before rendering
      blending: THREE.AdditiveBlending,
      depthWrite: false, // Disable depth write for additive blending to prevent dimming/occlusion
      transparent: true,
      sizeAttenuation: true, // Restore perspective scaling for depth
      alphaTest: 0.05 // Softer edges
    });

    this.starPoints = new THREE.Points(starGeometry, starMaterial);
    this.starPoints.userData.stars = stars; // Store data for raycasting
    this.starPoints.renderOrder = 1; // Render stars first
    this.galaxyGroup.add(this.starPoints);

    // --- Generate Nebulae and Dust ---
    this.generateNebulaeAndDust();

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    Logger.end(funcName);
  }

  generateNebulaeAndDust() {
    // --- Dust Lanes (Dark Matter/Obscuring Dust) ---
    const dustCount = 60000; // High density for visible lanes
    const dustGeometry = new THREE.BufferGeometry();
    const dustVertices = [];
    const dustColors = [];

    // Use safe radius logic here too, as params.galaxyRadius might be unscaled (e.g. 2000)
    let galaxyRadius = this.gameEngine.galaxyGenerator.params.galaxyRadius;
    if (!Number.isFinite(galaxyRadius) || galaxyRadius < 100000) galaxyRadius = 2000000;

    // Initialize PRNG for visual consistency
    const prng = ProcGen.create32PRNG(this.gameEngine.galaxyGenerator.params.seed || 'galaxy-visuals');

    // Retrieve spiral parameters to match star distribution
    const { armCount, winding } = this.gameEngine.galaxyGenerator.params;
    const currentArmCount = Math.max(2, armCount);
    const WINDING_SCALE = 8.0;
    let safeWinding = Number(winding);
    if (!Number.isFinite(safeWinding)) safeWinding = 0.35;
    safeWinding = Math.max(-10, Math.min(10, safeWinding));

    const DUST_COLORS = [
      new THREE.Color(0x332211), // Dark reddish brown
      new THREE.Color(0x222233), // Dark bluish
      new THREE.Color(0x333322), // Dark yellowish
      new THREE.Color(0x251510)  // Another dark brown
    ];

    for (let i = 0; i < dustCount; i++) {
      const effectiveRadius = galaxyRadius * (0.85 + prng.nextDouble() * 0.3); // Feathered edge
      const rNorm = Math.pow(prng.nextDouble(), 0.5); // Bias towards center
      const r = rNorm * effectiveRadius;

      // Spiral Logic: Match the stars so dust sits in the arms
      const armIndex = Math.floor(prng.nextDouble() * currentArmCount);
      const armOffset = (Math.PI * 2 / currentArmCount) * armIndex;
      const A = 100;
      let theta = -Math.log((r + A) / A) * safeWinding * WINDING_SCALE;
      theta += armOffset;

      // Scatter: Dust is concentrated in arms
      theta += (prng.nextDouble() - 0.5) * 0.6; // Increased scatter for softer lanes

      // Very thin vertical spread for the "cut" effect across the bulge
      const z = (prng.nextDouble() + prng.nextDouble() - 1.0) * galaxyRadius * 0.008;

      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);

      dustVertices.push(x, y, z);

      // Add color based on noise
      const colorNoise = (ProcGen.simplex2D(x * 0.005, y * 0.005) + 1) * 0.5; // Use a different scale for color
      const color = DUST_COLORS[Math.floor(colorNoise * DUST_COLORS.length)];
      dustColors.push(color.r, color.g, color.b);
    }
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(dustVertices), 3));
    dustGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(dustColors), 3));

    dustGeometry.computeBoundingSphere();
    if (isNaN(dustGeometry.boundingSphere.radius) || dustGeometry.boundingSphere.radius === 0) {
      dustGeometry.boundingSphere.radius = 1;
    }

    // Custom Shader to handle soft texture and fade-out near camera
    const dustMaterial = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: this.spriteTextures.cloud },
        size: { value: 80.0 }, // Reduced size to prevent massive overlap/smearing
        scale: { value: window.innerHeight / 2.0 } // Perspective scale factor
      },
      vertexShader: `
            attribute vec3 color;
            varying vec3 vColor;
            varying float vAlpha;
            uniform float size;
            uniform float scale;
            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                // Scale size by distance (perspective)
                gl_PointSize = size * (scale / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
                
                // Fade out when close (0 to 400 units)
                float dist = -mvPosition.z;
                vAlpha = smoothstep(50.0, 400.0, dist);
            }
        `,
      fragmentShader: `
            uniform sampler2D map;
            varying vec3 vColor;
            varying float vAlpha;
            void main() {
                vec4 texColor = texture2D(map, gl_PointCoord);
                if (texColor.a < 0.05) discard;
                // Combine vertex color, texture alpha, and distance fade
                gl_FragColor = vec4(vColor, texColor.a * vAlpha * 0.15); // Reduced opacity
                gl_FragColor = vec4(vColor, texColor.a * vAlpha * 0.3); 
            }
        `,
      transparent: true,
      blending: THREE.NormalBlending, // Normal blending to simulate obscuring dust lanes
      depthWrite: false,
    });

    const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
    dustPoints.renderOrder = 2; // Render after stars to allow occlusion (controlled by depth buffer)
    this.galaxyGroup.add(dustPoints);

    // --- Gas Nebulae (Sprites) ---
    const nebulaCount = 2000; // Significantly increased for better density
    const NEBULA_COLORS = [0x6699ff, 0xff33cc, 0x33ffcc, 0xffcc33, 0xff3333, 0x9966ff, 0x33ff66];

    for (let i = 0; i < nebulaCount; i++) {
      const effectiveRadius = galaxyRadius * (0.85 + prng.nextDouble() * 0.3);
      const rNorm = Math.pow(prng.nextDouble(), 0.5); // Bias towards center
      const r = rNorm * effectiveRadius;

      // Spiral Logic (matching GalaxyGenerator)
      const armIndex = Math.floor(prng.nextDouble() * currentArmCount);
      const armOffset = (Math.PI * 2 / currentArmCount) * armIndex;
      const A = 100;
      let theta = -Math.log((r + A) / A) * safeWinding * WINDING_SCALE;
      theta += armOffset;

      // Scatter: Nebulae are more diffuse than stars
      theta += (prng.nextDouble() - 0.5) * 1.5;

      // Match new flared galaxy profile
      const flare = 1.0 + (rNorm * rNorm * 0.25);
      // Tighter vertical spread for nebulae (thin disk)
      const z = (prng.nextDouble() + prng.nextDouble() - 1.0) * galaxyRadius * 0.01 * flare;

      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);

      const clusterNoise = ProcGen.simplex2D(x * 0.003, y * 0.003);
      if (clusterNoise < 0.0) continue; // Keep roughly 50% based on noise for clustering

      const color = NEBULA_COLORS[Math.floor(prng.nextDouble() * NEBULA_COLORS.length)];

      const material = new THREE.SpriteMaterial({
        map: this.spriteTextures.cloud,
        color: color,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.1 + prng.nextDouble() * 0.2,
        rotation: prng.nextDouble() * Math.PI * 2, // Random rotation for variety
        depthWrite: false
      });

      const sprite = new THREE.Sprite(material);
      // Larger, more variable size for volumetric look
      const spriteSize = (prng.nextDouble() * 300 + 150);
      sprite.scale.set(spriteSize, spriteSize, 1);
      sprite.position.set(x, y, z);
      this.galaxyGroup.add(sprite);
    }
  }


  setupInteractions() {
    const funcName = 'GalaxyMapView.setupInteractions';
    // Moved to onLoad
  }

  onLoad() {
    super.onLoad();
    this.renderer.domElement.addEventListener('click', this.onMouseClick);
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
  }

  onUnload() {
    super.onUnload();
    this.renderer.domElement.removeEventListener('click', this.onMouseClick);
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
  }

  transitionFromSystem(targetPos) {
      const duration = 2000;
      const startTime = performance.now();
      const startPos = this.activeCamera.position.clone();
      const controls = this.cameraControls.get('default');
      
      if (controls) controls.enabled = false;

      const animateZoomOut = () => {
          const now = performance.now();
          const progress = Math.min((now - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease-out

          this.activeCamera.position.lerpVectors(startPos, targetPos, ease);
          if (controls) this.activeCamera.lookAt(controls.target);

          if (progress < 1) {
              requestAnimationFrame(animateZoomOut);
          } else {
              if (controls) controls.enabled = true;
          }
      };
      requestAnimationFrame(animateZoomOut);
  }

  async onMouseClick(event) {
    const funcName = 'GalaxyMapView.onMouseClick';
    Logger.start(funcName);
    
    const mouse = SceneTools.getMouseVector(event, this.renderer.domElement);

    let closestStar = null;
    let minDistance = Infinity;
    const starPosition = new THREE.Vector3();
    const matrix = new THREE.Matrix4();

    // Use Raycaster against Points
    this.raycaster.setFromCamera(mouse, this.activeCamera);
    this.raycaster.params.Points.threshold = 5; // Adjust threshold for point selection
    const intersects = this.raycaster.intersectObject(this.starPoints);

    if (intersects.length > 0) {
      // Get the closest intersection
      const index = intersects[0].index;
      closestStar = this.starPoints.userData.stars[index];

      // Start Zoom Animation immediately
      const zoomPromise = this.focusOnSystem(closestStar);

      // --- UI Feedback: Start Loading ---
      document.body.style.cursor = 'wait';
      const loadingOverlay = document.createElement('div');
      loadingOverlay.style.position = 'absolute';
      loadingOverlay.style.top = '50%';
      loadingOverlay.style.left = '50%';
      loadingOverlay.style.transform = 'translate(-50%, -50%)';
      loadingOverlay.style.padding = '20px';
      loadingOverlay.style.background = 'rgba(0, 0, 0, 0.8)';
      loadingOverlay.style.color = '#fff';
      loadingOverlay.style.borderRadius = '8px';
      loadingOverlay.style.zIndex = '10000';
      loadingOverlay.style.fontFamily = 'monospace';
      loadingOverlay.innerText = 'Generating System...';
      document.body.appendChild(loadingOverlay);

      // Yield to the browser to allow the UI to render the loading message
      await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));

      try {
        const systemDetails = await this.gameEngine.galaxyGenerator.getSystemDetails(closestStar);

        // Safety check: Ensure the generator exists
        let systemGen = this.gameEngine.loreMaster.stellarSystemGenerator;

        if (!systemGen) {
            Logger.message("GalaxyMapScene: StellarSystemGenerator missing on LoreMaster.");
            // It should be there if LoreMaster initialized, but if not, we can't easily recover without NameGenerator
        }

        let planets = [];

        if (systemGen && typeof systemGen.generatePlanets === 'function') {
          planets = systemGen.generatePlanets(systemDetails);
        } else {
          Logger.message("WARNING: StellarSystemGenerator not found on GameEngine. Skipping planet generation.");
        }

        Logger.message(`GalaxyMapView: Lore and planets generated for star: ${systemDetails.name}`);

        this.selectedStar = { star: closestStar, systemDetails, planets };
        
        // Wait for the zoom animation to finish before switching scenes
        await zoomPromise;
        
        // Transition to the SolarSystemScene
        this.viewManager.showSolarSystem(this.selectedStar);

      } catch (error) {
        Logger.message("ERROR: Failed to generate system details or planets.", error);
        console.error(error);
        alert(`System Generation Failed: ${error.message}`);
      } finally {
        // --- UI Feedback: Cleanup ---
        document.body.style.cursor = 'default';
        if (loadingOverlay.parentNode) loadingOverlay.parentNode.removeChild(loadingOverlay);
      }
    }
    Logger.end(funcName);
  }

  onMouseMove(event) {
    const mouse = SceneTools.getMouseVector(event, this.renderer.domElement);
    this.raycaster.setFromCamera(mouse, this.activeCamera);
    // Hover effect with InstancedMesh is more complex and can be added later.
  }

  onWindowResize() {
    const funcName = 'GalaxyMapView.onWindowResize';
    Logger.start(funcName);
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.activeCamera.aspect = width / height;
    this.activeCamera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    const controls = this.cameraControls.get('default');
    if (controls) controls.handleResize();
    Logger.end(funcName);
  }

  /**
   * Moves the camera to focus on a specific star system.
   * @param {object} system - The star object to focus on.
   */
  focusOnSystem(system) {
    const funcName = 'GalaxyMapView.focusOnSystem';
    Logger.start(funcName);
    return new Promise((resolve) => {
        const controls = this.cameraControls.get('default');
        if (!system || !controls) {
            resolve();
            return;
        }

        if (this.flyToAnimationFrameId) {
          cancelAnimationFrame(this.flyToAnimationFrameId);
        }

        // 1. Stop Galaxy Rotation immediately so the target doesn't move
        this.attractMode = false;
        this.galaxyGroup.updateMatrixWorld(); // Ensure matrix is current

        // Switch to cinematic camera for the flight
        this.isCinematic = true;
        this.cinematicCamera.position.copy(this.activeCamera.position);
        this.cinematicCamera.quaternion.copy(this.activeCamera.quaternion);
        this.cinematicCamera.up.copy(this.activeCamera.up); // Sync UP vector to prevent flip
        this.setActiveCamera('cinematic');

        // 2. Calculate World Position of the star
        const localPos = new THREE.Vector3(system.x, system.y, system.z);
        const sysWorldPos = localPos.clone().applyMatrix4(this.galaxyGroup.matrixWorld);

        const startPosition = this.cinematicCamera.position.clone();
        
        const flightVector = new THREE.Vector3().subVectors(sysWorldPos, startPosition);
        const distance = flightVector.length();
        const direction = flightVector.normalize();

        // Stop short of the star (adjust distance based on scale)
        const stopDistance = 200; 
        const endPosition = sysWorldPos.clone().sub(direction.multiplyScalar(stopDistance));
        
        // Orientation
        const startQuaternion = this.cinematicCamera.quaternion.clone();
        this.cinematicCamera.lookAt(sysWorldPos);
        const endQuaternion = this.cinematicCamera.quaternion.clone();
        this.cinematicCamera.quaternion.copy(startQuaternion); // Reset to animate

        const duration = 2000; // Slower for dramatic effect
        const startTime = performance.now();

        controls.enabled = false;
        this.shouldUpdateControls = false; // Explicitly stop Scene.js from updating controls

        const animateFlyTo = () => {
          const now = performance.now();
          const progress = Math.min((now - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);

          // Fly towards star
          this.cinematicCamera.position.lerpVectors(startPosition, endPosition, ease);
          
          if (progress < 1) {
            this.flyToAnimationFrameId = requestAnimationFrame(animateFlyTo);
          } else {
            // Handover back to main camera (optional, or just stay in cinematic until scene switch)
            // For now, we stay in cinematic as we are about to switch scenes anyway.
            // Do NOT re-enable controls here, as it causes snapping before the scene transition.
            // The ViewManager will handle unloading this scene shortly.
            this.flyToAnimationFrameId = null;
            resolve();
          }
        };

        this.flyToAnimationFrameId = requestAnimationFrame(animateFlyTo);
    });
    Logger.end(funcName);
  }

  updateParams(params) {
    const funcName = 'GalaxyMapView.updateParams';
    Logger.start(funcName);
    this.gameEngine.galaxyGenerator.updateParams(params);
    this.scene.children = this.scene.children.filter(child => !(child.userData && child.userData.star));
    this.generateAndRenderGalaxy();
    Logger.end(funcName);
  }

  update(time, delta) {
    super.update(time, delta); // Call base class update if it has any logic
    
    if (this.attractMode && this.galaxyGroup) {
        this.galaxyGroup.rotation.z += 0.0005;
    }
  }

  dispose() {
    super.dispose(); // Call the base class dispose method

    if (this.flyToAnimationFrameId) {
      cancelAnimationFrame(this.flyToAnimationFrameId);
    }
    
    Logger.message("GalaxyMapScene specific resources disposed.");
  }
}
