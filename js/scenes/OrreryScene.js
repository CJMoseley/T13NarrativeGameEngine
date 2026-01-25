import * as THREE from 'three';
import Logger from '../core/Logger.js';
import { Scene } from '../core/Scene.js';
import { SceneTools } from '../core/SceneTools.js';

export class OrreryScene extends Scene {
    constructor(viewManager, sceneData) {
        super(viewManager, sceneData);
        
        this.systemData = sceneData.systemDetails || {};
        this.planets = sceneData.planets || [];
        this.starLocation = sceneData.star;
        
        // Orrery specific settings: Toy Scale
        this.STAR_RADIUS = 80; // Fixed large size for the star
        this.planetMeshes = [];
        this.orbitLines = [];
        
        this.onMouseClick = this.onMouseClick.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.raycaster = new THREE.Raycaster();
        this.mouseVector = new THREE.Vector2();
        
        this.cameraPathPoints = [];
    }

    async prepare(onProgress) {
        this.init();
        if (onProgress) onProgress({ status: 'Orrery generated', percent: 1.0 });
    }

    init() {
        const funcName = 'OrreryScene.init';
        Logger.start(funcName);
        
        // Debug Data
        Logger.message(`Orrery Init: System ${this.systemData.name || 'Unknown'}, Planets: ${this.planets.length}`);
        this.planets.forEach((p, i) => {
            Logger.message(`- Planet ${i}: ${p.name} (${p.type}) Dist: ${p.orbitalDistance} AU`);
        });
        
        this.sanitizeData();

        this.scene.background = new THREE.Color(0x111111); // Slightly lighter background to see black planets
        
        this.setupCamera();
        this.setupLighting();
        this.createStar();
        this.createPlanets(); // This now uses getScaledDistance
        this.createGrid(); // Helper grid to establish the orbital plane
        this.createCameraMarker(); 
        
        // Body Count Display
        this.createBodyCountDisplay();

        Logger.end(funcName);
    }

    sanitizeData() {
        if (!this.planets) return;
        this.planets.forEach((p, i) => {
            let dist = parseFloat(p.orbitalDistance);
            if (isNaN(dist)) {
                dist = (i + 1) * 5.0; // Fallback distribution
            }
            p.orbitalDistance = dist;
        });
    }

    // Helper to place planets at even intervals for visibility
    getVisualDistance(index) {
        // Explicitly add Star Radius to ensure we start outside
        const gap = this.STAR_RADIUS * 2.5; // Reduced gap significantly to keep camera closer
        return this.STAR_RADIUS + (this.STAR_RADIUS * 2) + (index * gap);
    }

    // Helper to map real AU back to the visual index-based scale for the camera marker
    getVisualDistanceForAU(au) {
        if (!this.planets || this.planets.length === 0) return 0;
        
        // 1. Find the two planets this AU falls between
        // Assumes planets are sorted by distance (which we do in createPlanets)
        for (let i = 0; i < this.planets.length - 1; i++) {
            const p1 = this.planets[i];
            const p2 = this.planets[i+1];
            if (au >= p1.orbitalDistance && au <= p2.orbitalDistance) {
                // Interpolate
                const range = p2.orbitalDistance - p1.orbitalDistance;
                const progress = (au - p1.orbitalDistance) / range;
                const v1 = this.getVisualDistance(i);
                const v2 = this.getVisualDistance(i+1);
                return v1 + (progress * (v2 - v1));
            }
        }
        
        // 2. Handle out of bounds
        if (au < this.planets[0].orbitalDistance) {
            return (au / this.planets[0].orbitalDistance) * this.getVisualDistance(0);
        }
        
        // Beyond the last planet - Extrapolate linearly
        const lastPlanet = this.planets[this.planets.length - 1];
        const lastVisual = this.getVisualDistance(this.planets.length - 1);
        // Remove clamp to allow tracking from deep space
        return (au / lastPlanet.orbitalDistance) * lastVisual;
    }

    setupCamera() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Calculate extent of system to position camera
        let maxDist = 500;
        if (this.planets.length > 0) {
            // Use the visual distance of the last planet
            maxDist = this.getVisualDistance(this.planets.length - 1);
        }
        
        // Calculate distance required to fit the system in view based on FOV
        const fov = 45; // Use a slightly narrower FOV for a better "diagram" look
        const aspect = width / height;
        const vFov = fov * (Math.PI / 180);
        
        // Calculate distance needed to fit maxDist vertically and horizontally
        const distV = (maxDist * 1.2) / Math.tan(vFov / 2);
        const distH = (maxDist * 1.2) / (Math.tan(vFov / 2) * aspect);
        const fitDist = Math.max(distV, distH, 300); // Ensure minimum distance
        
        // NaN Safety
        if (isNaN(fitDist)) fitDist = 500;

        // Fixed view, 45 degrees above plane for better orbital visibility
        const angle = 30 * (Math.PI / 180);
        const y = fitDist * Math.sin(angle);
        const z = fitDist * Math.cos(angle);
        
        this.activeCamera.fov = fov;
        this.activeCamera.position.set(0, y, z);
        this.activeCamera.lookAt(0, 0, 0);
        this.activeCamera.far = fitDist * 5; // Ensure far plane covers the whole system
        this.activeCamera.updateProjectionMatrix();

        this.setupControls('orbit', {
            target: new THREE.Vector3(0, 0, 0),
            maxDistance: fitDist * 2,
            minDistance: 10,
            enableDamping: true
        });
    }

    setupLighting() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.4); 
        this.scene.add(ambient);
        
        // Star light (Point light at center) - 0 decay for infinite range in this view
        const point = new THREE.PointLight(0xffffff, 1.2, 0, 0);
        point.position.set(0, 0, 0);
        this.scene.add(point);

        // Camera Headlamp to ensure planets are visible regardless of angle
        const headlamp = new THREE.DirectionalLight(0xffffff, 0.6);
        headlamp.position.set(0, 0, 1);
        this.activeCamera.add(headlamp);
        this.scene.add(this.activeCamera);
    }

    createStar() {
        const radius = this.STAR_RADIUS; 
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        
        // Simple emissive material for the star
        const starColor = this.systemData.starColor || 0xffff00;
        const starMat = new THREE.MeshStandardMaterial({
            color: starColor,
            emissive: starColor,
            emissiveIntensity: 0.8
        });
        
        this.starMesh = new THREE.Mesh(geometry, starMat);
        this.scene.add(this.starMesh);
    }

    createCameraMarker() {
        const geometry = new THREE.SphereGeometry(25, 16, 16); // Even larger for visibility
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff00ff,
            depthTest: false, // Always render on top
            transparent: true
        }); 
        this.cameraMarker = new THREE.Mesh(geometry, material);
        this.cameraMarker.renderOrder = 999;
        this.scene.add(this.cameraMarker);

        // Camera Path Line - Pre-allocate buffer for dynamic updates
        const maxPoints = 10000; // Increased buffer size
        const pathGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(maxPoints * 3);
        pathGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        pathGeo.setDrawRange(0, 0);

        const pathMat = new THREE.LineBasicMaterial({ 
            color: 0xff00ff, // Magenta
            depthTest: false, // Always draw on top
            transparent: false, 
            opacity: 1.0
        }); 
        this.cameraPathLine = new THREE.Line(pathGeo, pathMat);
        this.cameraPathLine.frustumCulled = false;
        this.cameraPathLine.renderOrder = 999; // Ensure it renders last
        this.scene.add(this.cameraPathLine);

        // Add Points for visibility (since Lines can be thin)
        const pointsMat = new THREE.PointsMaterial({ color: 0xff00ff, size: 5, sizeAttenuation: false, depthTest: false });
        this.cameraPathPointsMesh = new THREE.Points(pathGeo, pointsMat);
        this.cameraPathPointsMesh.frustumCulled = false;
        this.cameraPathPointsMesh.renderOrder = 999;
        this.scene.add(this.cameraPathPointsMesh);
        
        this.cameraPathPoints = []; // Reset points
    }

    resetPath() {
        this.cameraPathPoints = [];
        this.isStaticPath = false;
        if (this.cameraPathLine) {
            this.cameraPathLine.geometry.setDrawRange(0, 0);
            const positions = this.cameraPathLine.geometry.attributes.position.array;
            positions.fill(0); // Clear buffer
            this.cameraPathLine.geometry.attributes.position.needsUpdate = true;
            if (this.cameraPathPointsMesh) this.cameraPathPointsMesh.geometry.attributes.position.needsUpdate = true;
        }
    }

    setIntroPath(points, mainScale = 100) {
        if (!points || points.length === 0 || !this.cameraPathLine) return;
        
        this.resetPath();
        this.isStaticPath = true;

        Logger.message(`OrreryScene: Setting intro path with ${points.length} points.`);

        const positions = this.cameraPathLine.geometry.attributes.position.array;
        let count = 0;
        const maxPoints = positions.length / 3;
        let maxVisualDist = 0;
        
        // Frustum check prep
        const frustum = new THREE.Frustum();
        const projScreenMatrix = new THREE.Matrix4();
        if (this.activeCamera) {
            this.activeCamera.updateMatrixWorld();
            projScreenMatrix.multiplyMatrices(this.activeCamera.projectionMatrix, this.activeCamera.matrixWorldInverse);
            frustum.setFromProjectionMatrix(projScreenMatrix);
        }
        let outsideCount = 0;

        for (let i = 0; i < points.length; i++) {
            if (count >= maxPoints) break;
            
            const p = points[i];
            // Convert main scene position to AU, then to Visual Scale
            const dist = p.length();
            const au = Math.max(0, (dist - 25) / mainScale); // 25 is STAR_RADIUS in StellarSystemScene
            let orreryDist = this.getVisualDistanceForAU(au);
            
            if (orreryDist < this.STAR_RADIUS + 5) orreryDist = this.STAR_RADIUS + 5;

            const newPos = p.clone().normalize().multiplyScalar(orreryDist);
            
            if (!isNaN(newPos.x) && !isNaN(newPos.y) && !isNaN(newPos.z)) {
                positions[count * 3] = newPos.x;
                positions[count * 3 + 1] = newPos.y;
                positions[count * 3 + 2] = newPos.z;
                
                if (this.activeCamera && !frustum.containsPoint(newPos)) {
                    outsideCount++;
                }
                if (orreryDist > maxVisualDist) maxVisualDist = orreryDist;

                count++;
            }
        }
        
        Logger.message(`OrreryScene: Path points outside frustum: ${outsideCount} / ${count}. Max Dist: ${maxVisualDist}`);

        this.cameraPathLine.geometry.setDrawRange(0, count);
        this.cameraPathLine.geometry.attributes.position.needsUpdate = true;
        if (this.cameraPathPointsMesh) this.cameraPathPointsMesh.geometry.setDrawRange(0, count);
        this.cameraPathLine.computeLineDistances();
        
        // Auto-fit camera to include the path
        // this.fitCameraToDist(maxVisualDist);
    }

    fitCameraToDist(targetMaxDist) {
        // Ensure we include planets
        let maxDist = 500;
        if (this.planets.length > 0) {
            maxDist = this.getVisualDistance(this.planets.length - 1);
        }
        maxDist = Math.max(maxDist, targetMaxDist);
        
        // Assume Square Aspect for PiP
        const aspect = 1.0; 
        const fov = 45;
        const vFov = fov * (Math.PI / 180);
        // Tighter fit (1.1 buffer instead of 1.2)
        const distV = (maxDist * 1.1) / Math.tan(vFov / 2);
        const distH = (maxDist * 1.1) / (Math.tan(vFov / 2) * aspect);
        const fitDist = Math.max(distV, distH, 300);
        
        if (this.activeCamera) {
            const angle = 45 * (Math.PI / 180);
            const y = fitDist * Math.sin(angle);
            const z = fitDist * Math.cos(angle);
            
            this.activeCamera.position.set(0, y, z);
            this.activeCamera.lookAt(0, 0, 0);
            this.activeCamera.far = fitDist * 5;
            this.activeCamera.aspect = aspect; // Force square aspect
            this.activeCamera.updateProjectionMatrix();
            
            Logger.message(`OrreryScene: Adjusted camera to fit dist ${maxDist}. New Pos: ${y.toFixed(0)}, ${z.toFixed(0)}`);
        }
    }

    updateCameraMarker(position, mainScale = 100) {
        if (this.cameraMarker && position) {
            // Convert main scene position to AU, then to Visual Scale
            // Note: StellarSystemScene adds STAR_RADIUS (25) to distance, so we subtract it to get raw AU distance
            const dist = position.length();
            const au = Math.max(0, (dist - 25) / mainScale);
            
            let orreryDist = this.getVisualDistanceForAU(au);
            
            // Ensure marker is visible (not inside star)
            if (orreryDist < this.STAR_RADIUS + 5) orreryDist = this.STAR_RADIUS + 5;
            
            // Clamp to camera far plane to prevent clipping
            if (this.activeCamera && orreryDist > this.activeCamera.far * 0.9) orreryDist = this.activeCamera.far * 0.9;

            const newPos = position.clone().normalize().multiplyScalar(orreryDist);
            if (newPos.lengthSq() === 0) newPos.set(0, 0, this.STAR_RADIUS + 5); // Handle 0,0,0 input
            this.cameraMarker.position.copy(newPos);

            // If path is static (pre-calculated intro), do not update it incrementally
            if (this.isStaticPath) return;

            // Update Path
            // Only add point if it has moved sufficiently to avoid buffer spam
            const lastPoint = this.cameraPathPoints.length > 0 ? this.cameraPathPoints[this.cameraPathPoints.length - 1] : null;
            
            // Check for NaN to prevent corrupting the buffer
            if (isNaN(newPos.x) || isNaN(newPos.y) || isNaN(newPos.z)) return;

            // If this is the first point, just add it and return (don't draw line from 0,0,0)
            if (!lastPoint) {
                this.cameraPathPoints.push(newPos.clone());
                return;
            }

            // Update if moved or if it's the first point. Reduced threshold for smoother lines.
            if (!lastPoint || lastPoint.distanceTo(newPos) > 1.0) { 
                this.cameraPathPoints.push(newPos.clone());
                
                const maxPoints = 10000;
                if (this.cameraPathPoints.length > maxPoints) { 
                    this.cameraPathPoints.shift();
                }
                
                // Update BufferGeometry
                const positions = this.cameraPathLine.geometry.attributes.position.array;
                for (let i = 0; i < this.cameraPathPoints.length; i++) {
                    positions[i * 3] = this.cameraPathPoints[i].x;
                    positions[i * 3 + 1] = this.cameraPathPoints[i].y;
                    positions[i * 3 + 2] = this.cameraPathPoints[i].z;
                }
                
                this.cameraPathLine.geometry.attributes.position.needsUpdate = true;
                this.cameraPathLine.geometry.setDrawRange(0, this.cameraPathPoints.length);
                if (this.cameraPathPointsMesh) this.cameraPathPointsMesh.geometry.setDrawRange(0, this.cameraPathPoints.length);
                this.cameraPathLine.computeLineDistances(); // Helpful for some line types
            }
        }
    }

    createPlanets() {
        this.planetMeshes = [];
        this.orbitLines = [];
        this.planetGroups = []; // Track groups for animation

        if (!this.planets || this.planets.length === 0) {
            Logger.warn("OrreryScene: No planets to render.");
            return;
        }
        
        // Sort planets by distance to ensure linear spacing works visually
        this.planets.sort((a, b) => a.orbitalDistance - b.orbitalDistance);

        this.planets.forEach((planet, index) => {
            // Use index-based distance for visibility
            const dist = this.getVisualDistance(index);
            
            // Toy Scale: Planets are huge relative to orbits for visibility
            let size = 50; // Increased base size
            if (planet.type && planet.type.includes('Giant')) {
                size = 80;
            } else if (planet.type && planet.type.includes('Dwarf')) {
                size = 30;
            }
            
            // 1. Orbit Line
            const orbitGeo = new THREE.BufferGeometry();
            const points = [];
            const segments = 128;
            for(let i=0; i<=segments; i++) {
                const th = (i/segments) * Math.PI * 2;
                points.push(dist * Math.cos(th), 0, dist * Math.sin(th));
            }
            orbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
            
            // Orbit Color based on Temperature/Distance
            let orbitColor = 0x0088ff; // Default Blue (Frigid)
            const au = planet.orbitalDistance;
            if (au < 0.8) {
                orbitColor = 0xff3333; // Red (Hot)
            } else if (au >= 0.8 && au <= 1.6) {
                orbitColor = 0x33ff33; // Green (Habitable)
            }

            const orbitMat = new THREE.LineBasicMaterial({ color: orbitColor, transparent: true, opacity: 0.4 });
            const orbit = new THREE.Line(orbitGeo, orbitMat);
            this.scene.add(orbit);
            this.orbitLines.push(orbit);
            
            // 2. Planet Group (Holds Mesh + Moons)
            const planetGroup = new THREE.Group();
            const angle = planet.startAngle !== undefined ? planet.startAngle : Math.random() * Math.PI * 2;
            planetGroup.position.set(dist * Math.cos(angle), 0, dist * Math.sin(angle));
            
            planetGroup.userData = {
                planet: planet,
                distance: dist,
                angle: angle,
                speed: (planet.orbitSpeed || 0.01) * 20
            };
            this.scene.add(planetGroup);
            this.planetGroups.push(planetGroup);

            // 3. Planet Mesh (Visual Sphere)
            const geometry = new THREE.SphereGeometry(size, 32, 32);
            let color = new THREE.Color(0x888888);
            if (planet.color) {
                color.setHSL(planet.color.h, planet.color.s, planet.color.l);
            }
            
            const material = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.7,
                metalness: 0.1
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.userData.isPlanetBody = true; // Tag for rotation logic
            // Add mesh to group (at 0,0,0 relative to group)
            planetGroup.add(mesh);
            this.planetMeshes.push(mesh); // Keep track for raycasting
            
            // 3. Moons (Simplified)
            if (planet.moons && planet.moons.length > 0) {
                // Calculate visual limit for moons in Orrery (half the gap between planets)
                // Use a local scale for moons similar to StellarSystemScene but adapted for Orrery
                const MOON_ORBIT_SCALE = 100000; // Increased scale for visibility

                planet.moons.forEach((moon, mIdx) => {
                    // if (moon.type === 'Quasi-Satellite') return; // User wants them generated, just not lines

                    const moonSize = 12; 
                    // Ensure visual clearance: Planet Size + Moon Size + Buffer + Scaled Distance
                    let moonDist = size + moonSize + 4 + (moon.orbitalDistance * MOON_ORBIT_SCALE);
                    
                    if (moon.isRing) {
                        moonDist = size + 5 + (mIdx * 2);
                    }

                    let moonGeo;
                    const moonMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
                    
                    if (moon.isRing) {
                        moonGeo = new THREE.RingGeometry(moonDist - 1, moonDist + 1, 32);
                        moonGeo.rotateX(-Math.PI / 2);
                    } else {
                        moonGeo = new THREE.SphereGeometry(moonSize, 8, 8);
                    }

                    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
                    
                    const mAngle = Math.random() * Math.PI * 2;
                    moonMesh.userData = {
                        distance: moonDist,
                        angle: mAngle,
                        speed: 1.5 + (Math.random() * 1.0) // Fast orbit for visibility
                    };
                    
                    if (moon.isRing) {
                        moonMesh.position.set(0, 0, 0);
                    } else {
                        moonMesh.position.set(moonDist * Math.cos(mAngle), 0, moonDist * Math.sin(mAngle));
                    }
                    
                    // Moon Orbit Line
                    if (!moon.isRing && moon.type !== 'Quasi-Satellite') {
                        const mOrbitGeo = new THREE.BufferGeometry();
                        const mPts = [];
                        const mSeg = 32;
                        for(let k=0; k<=mSeg; k++) {
                            const phi = (k/mSeg)*Math.PI*2;
                            mPts.push(moonDist*Math.cos(phi), 0, moonDist*Math.sin(phi));
                        }
                        mOrbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(mPts, 3));
                        // Yellow orbit lines for moons
                        const mOrbit = new THREE.Line(mOrbitGeo, new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.6 }));
                        planetGroup.add(mOrbit);
                    }

                    // Add moon to planet group
                    planetGroup.add(moonMesh);
                });
            }
        });
    }

    createBodyCountDisplay() {
        const planetCount = this.planets.length;
        const moonCount = this.planets.reduce((acc, p) => acc + (p.moons ? p.moons.length : 0), 0);
        const total = 1 + planetCount + moonCount; // +1 for Star

        const canvas = document.createElement('canvas');
        canvas.width = 1024; // Higher resolution
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, 1024, 256);
        
        ctx.font = 'bold 80px Arial'; // Larger font
        ctx.fillStyle = '#00ff00';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`TRACKING: ${total} BODIES`, 40, 128);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        
        // Position in top left of the 3D view (relative to camera)
        // We attach it to the camera so it stays in view
        // Adjusted for visibility in PiP (z=-30, FOV 45 => visible height ~24.8, width ~24.8)
        sprite.position.set(-6, 9, -30); 
        sprite.scale.set(12, 3, 1); // Scaled down to fit
        this.activeCamera.add(sprite);
        this.scene.add(this.activeCamera); // Ensure camera is in scene for children to render
    }

    createGrid() {
        // Create a grid helper to visualize the ecliptic plane
        let size = 200;
        if (this.planets.length > 0) {
             // Use visual distance of last planet
             size = this.getVisualDistance(this.planets.length - 1) * 2.5;
        }
        
        const grid = new THREE.GridHelper(size, 40, 0x333333, 0x111111);
        this.scene.add(grid);
    }

    update(time, delta) {
        super.update(time, delta);
        
        // Animate orbits
        const dt = delta / 1000;
        
        // Move Planet Groups (Orbit)
        this.planetGroups.forEach(group => {
            group.userData.angle += group.userData.speed * dt;
            group.position.x = group.userData.distance * Math.cos(group.userData.angle);
            group.position.z = group.userData.distance * Math.sin(group.userData.angle);
            
            // Rotate Planet Mesh on Axis (Day/Night cycle)
            const planetBody = group.children.find(c => c.userData.isPlanetBody);
            if (planetBody) {
                planetBody.rotation.y += 0.5 * dt;
            }

            // Animate Moons
            group.children.forEach(child => {
                if (child.userData.speed && child.userData.distance) {
                    child.userData.angle += child.userData.speed * dt;
                    child.position.x = child.userData.distance * Math.cos(child.userData.angle);
                    child.position.z = child.userData.distance * Math.sin(child.userData.angle);
                }
            });
        });
        
        // Rotate Star
        if (this.starMesh) {
            this.starMesh.rotation.y += 0.1 * dt;
        }

        // Pulse Camera Marker
        if (this.cameraMarker) {
            const scale = 1 + Math.sin(time * 0.005) * 0.3;
            this.cameraMarker.scale.setScalar(scale);
            this.cameraMarker.material.opacity = 0.5 + Math.sin(time * 0.01) * 0.5;
        }
    }
    
    onLoad() {
        super.onLoad();
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.addEventListener('click', this.onMouseClick);
            this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
        }
    }

    onUnload() {
        super.onUnload();
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.removeEventListener('click', this.onMouseClick);
            this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
        }
    }

    onMouseClick(event) {
        const mouse = SceneTools.getMouseVector(event, this.renderer.domElement);
        
        this.raycaster.setFromCamera(mouse, this.activeCamera);
        const intersects = this.raycaster.intersectObjects(this.planetMeshes);
        
        if (intersects.length > 0) {
            const planet = intersects[0].object.parent.userData.planet; // Data is on the Group now
            Logger.message(`Orrery: Clicked ${planet.name}`);
            
            // Trigger UI Message
             this.viewManager.uiMessage.showMessage({
                key: 'orrery_scan',
                title: `Orrery Scan: ${planet.name}`,
                template: 'planet_lore',
                data: {
                    name: planet.name,
                    type: planet.type,
                    description: planet.description,
                    resources: planet.resources || []
                }
            });
        }
    }

    onMouseMove(event) {
        const mouse = SceneTools.getMouseVector(event, this.renderer.domElement);
        
        this.raycaster.setFromCamera(mouse, this.activeCamera);
        const intersects = this.raycaster.intersectObjects(this.planetMeshes);
        
        // Reset scales of previously hovered
        this.planetMeshes.forEach(m => {
            if (m.userData.hovered) {
                m.scale.set(1,1,1);
                m.userData.hovered = false;
            }
        });
        
        if (intersects.length > 0) {
            const mesh = intersects[0].object;
            mesh.scale.set(1.5, 1.5, 1.5); // Pop effect
            mesh.userData.hovered = true;
        }
    }
}
