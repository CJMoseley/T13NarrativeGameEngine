import * as THREE from 'three';
import { ShipFactory, COMPONENT_COLORS } from '../core/ship/ShipFactory.js';
import { TECH_SPECS, QUALITIES, FALLBACK_MANUFACTURERS } from '../core/ship/ShipUtils.js';
import { GalacticHistory } from '../procgen/galaxy/GalacticHistory.js';
import { Scene } from '../core/Scene.js';

export class ShipShowcaseScene extends Scene {
    constructor(viewManager) {
        super(viewManager);

        this.shipFactory = null;
        
        this.componentGroups = []; // List of component groups
        this.componentMeshes = []; // List of created meshes
        this.hullMesh = null;
        this.shipName = "Unknown Prototype";
        
        this.currentIndex = 0;
        this.uiContainer = null;
        this.labelElement = null;
        this.descElement = null;
        
        // Configuration
        this.componentDisplayDuration = 4000; // ms per component
        this.typingSpeed = 50; // ms per char (approx 100 wpm)

        this.revealTimeout = null;
        this.textInterval = null;
        this.fadeIntervals = new Set();
    }

    onLoad() {
        super.onLoad(); // This starts the animation loop
        this.prepareRevealSequence();
    }

    async prepare(onProgress) {
        this.scene.background = new THREE.Color(0x050510); // Dark space blue
        this.activeCamera.position.set(15, 10, 15);

        // 4. Lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);
        const pointLight = new THREE.PointLight(0x00ffff, 0.5);
        pointLight.position.set(-10, 0, -10);
        this.scene.add(pointLight);

        // 5. Controls
        this.setupControls('orbit', {
            enableDamping: true,
            autoRotate: true,
            autoRotateSpeed: 2.0
        });

        // 6. UI Setup
        this.createUI();
        onProgress({ status: 'Initializing Ship Factory...', percent: 0.2 });

        // 7. Initialize Factory
        this.shipFactory = new ShipFactory(this.viewManager.gameEngine, null);

        // 8. Generate Ship Data Procedurally
        onProgress({ status: 'Designing random ship...', percent: 0.4 });
        // Use a random seed or one based on the home system if available
        const seed = Math.floor(Math.random() * 4294967296);
        
        // Determine style to ensure name matches visual
        const styles = ['ORGANIC', 'INDUSTRIAL', 'SKELETON'];
        const style = styles[Math.floor(Math.random() * styles.length)];
        
        const sizes = ['small', 'medium', 'large'];
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        
        const shipComponents = await this.shipFactory.createRandomShip(seed, { size: size, techLevel: 2, style: style });

        // Generate Ship Name
        if (this.viewManager.gameEngine.loreMaster && this.viewManager.gameEngine.loreMaster.nameGenerator) {
            try {
                const genName = await this.viewManager.gameEngine.loreMaster.nameGenerator.generate('SHIP_NAMES', seed);
                // Fix: Check for the repetitive placeholder name and generate a fallback if found
                if (genName && genName !== "G'nathuun") {
                    this.shipName = genName;
                } else {
                    let manu = FALLBACK_MANUFACTURERS[Math.floor(Math.random() * FALLBACK_MANUFACTURERS.length)];
                    const activeCorps = GalacticHistory.getCorporations()?.filter(c => c.status === 'Active');
                    if (activeCorps && activeCorps.length > 0) {
                        manu = activeCorps[Math.floor(Math.random() * activeCorps.length)].name;
                    }
                    const tech = TECH_SPECS[Math.floor(Math.random() * TECH_SPECS.length)];
                    const qual = QUALITIES[Math.floor(Math.random() * QUALITIES.length)];
                    const type = style === 'ORGANIC' ? "Bio-Craft" : (style === 'SKELETON' ? "Frame" : "Racer");
                    this.shipName = `${manu} ${tech} ${type} ${qual}`;
                }
            } catch (e) {
                console.warn("ShipShowcaseScene: Failed to generate ship name.", e);
            }
        }
        

        // Start hull generation in background immediately
        onProgress({ status: 'Generating procedural hull...', percent: 0.6 });
        const styleConfig = { method: style, plating: (style === 'INDUSTRIAL'), blendStrength: (style === 'ORGANIC' ? 1.5 : 0.1) };
        // Pass 'this.scene' so wireframes appear immediately
        this.hullGenerationPromise = this.shipFactory.generateProceduralShipAsync(shipComponents, styleConfig, null, this.scene);
    }

    createUI() {
        this.uiContainer = document.createElement('div');
        this.uiContainer.style.position = 'absolute';
        this.uiContainer.style.bottom = '120px'; // Raised to avoid Continue button
        this.uiContainer.style.left = '50%';
        this.uiContainer.style.transform = 'translateX(-50%)';
        this.uiContainer.style.textAlign = 'center';
        this.uiContainer.style.color = '#00ffff';
        this.uiContainer.style.fontFamily = 'Orbitron, sans-serif';
        this.uiContainer.style.textShadow = '0 0 10px #00ffff';
        this.uiContainer.style.pointerEvents = 'none';
        this.uiContainer.style.zIndex = '100'; // Ensure text is above canvas
        this.uiContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'; // Semi-transparent background
        this.uiContainer.style.padding = '20px';
        this.uiContainer.style.borderRadius = '10px';
        this.uiContainer.style.transition = 'left 0.1s, top 0.1s'; // Smooth movement
        document.body.appendChild(this.uiContainer);

        this.labelElement = document.createElement('h2');
        this.labelElement.style.fontSize = '24px';
        this.labelElement.style.marginBottom = '5px';
        this.uiContainer.appendChild(this.labelElement);

        this.descElement = document.createElement('p');
        this.descElement.style.fontSize = '16px';
        this.descElement.style.maxWidth = '600px';
        this.uiContainer.appendChild(this.descElement);
    }

    async prepareRevealSequence() {
        // Wait for the ship group to be generated (it contains the meshes)
        const shipGroup = await this.hullGenerationPromise;
        
        if (!this.isActive) return; // Stop if scene unloaded

        // shipGroup is likely already in the scene from generateProceduralShipAsync, but ensure it's added/referenced
        if (shipGroup.parent !== this.scene) this.scene.add(shipGroup);
        this.shipGroup = shipGroup; // Store reference for later use
        this.hullMesh = shipGroup.getObjectByName("procedural_hull");
        
        // Hide everything initially
        shipGroup.traverse(child => {
            if (child.isMesh) {
                child.visible = false;
                child.material.transparent = true;
                child.material.opacity = 0;
            }
        });

        // Organize meshes into groups for the reveal
        const groups = new Map();

        shipGroup.traverse(child => {
            if (child.userData.isComponent) {
                const name = child.userData.componentName || "Unknown Component";
                if (!groups.has(name)) groups.set(name, []);
                groups.get(name).push(child);
            } else if (child.userData.isWire) {
                // Group all wires together to avoid "installing EVERYTHING" fatigue
                const name = "Internal Wiring";
                if (!groups.has(name)) groups.set(name, []);
                groups.get(name).push(child);
            }
        });

        // Convert map to array for sequencing
        this.componentGroups = [];
        for (const [name, meshes] of groups) {
            this.componentGroups.push({
                name: name,
                description: `Installing ${name}...`,
                meshes: meshes
            });
        }

        // Start the reveal
        this.revealNextComponent();
    }

    async revealNextComponent() {
        if (!this.isActive) return;

        if (this.currentIndex >= this.componentGroups.length) {
            this.showHull();
            return;
        }
        const group = this.componentGroups[this.currentIndex];
        
        group.meshes.forEach(mesh => {
            mesh.visible = true;
            this.componentMeshes.push(mesh); // Track for later hiding
            let opacity = 0;
            const fadeInterval = setInterval(() => { 
                if (!this.isActive) { clearInterval(fadeInterval); return; }
                opacity += 0.05; 
                mesh.material.opacity = opacity; 
                if (opacity >= 1) {
                    clearInterval(fadeInterval); 
                    this.fadeIntervals.delete(fadeInterval);
                }
            }, 50);
            this.fadeIntervals.add(fadeInterval);
        });

        this.labelElement.innerText = group.name;
        
        // Check for pending name update
        if (group.meshes.length > 0 && group.meshes[0].userData.namePromise) {
            const promise = group.meshes[0].userData.namePromise;
            promise.then(result => {
                if (!this.isActive) return;
                const newName = Array.isArray(result) ? result[0] : result;
                // Update group name for future reference
                group.name = newName;
                // If this group is still active, update the label
                if (this.activeGroup === group) {
                    this.labelElement.innerText = newName;
                    this.typeText(`Installing ${newName}...`);
                }
            }).catch(e => console.warn("Name resolution failed", e));
        }

        this.typeText(group.description);
        this.activeGroup = group; // Track active group for label positioning
        
        this.revealTimeout = setTimeout(() => { 
            this.currentIndex++; 
            this.revealNextComponent(); 
        }, this.componentDisplayDuration);
    }

    typeText(text) {
        if (this.textInterval) clearInterval(this.textInterval);
        this.descElement.innerText = "";
        let currentText = "";
        let i = 0;
        this.textInterval = setInterval(() => { 
            if (!this.isActive) { clearInterval(this.textInterval); return; }
            currentText += text.charAt(i); 
            this.descElement.innerText = currentText; 
            i++; 
            if (i >= text.length) clearInterval(this.textInterval); 
        }, this.typingSpeed);
    }

    async showHull() {
        if (!this.isActive) return;

        // Hull mesh is already in the scene from prepareRevealSequence, just hidden
        const shipGroup = this.shipGroup;
        if (!shipGroup) {
            console.warn("ShipShowcaseScene: shipGroup not found in showHull");
            return;
        }

        // NEW: Change component meshes from wireframe to solid before fading in the hull
        if (this.componentMeshes && this.componentMeshes.length > 0) {
            this.componentMeshes.forEach(mesh => {
                // Dispose of old basic material
                if (mesh.material) {
                    mesh.material.dispose();
                }
                if (this.hullMesh && this.hullMesh.material) {
                    // Use the hull's shader material for a unified look
                    mesh.material = this.hullMesh.material;
                } else {
                    // Fallback to a standard solid material if no hull was generated
                    mesh.material = new THREE.MeshStandardMaterial({
                        color: 0x888888, // A neutral grey
                        roughness: 0.8,
                        metalness: 0.5
                    });
                }
            });
        }

        // Prepare for fade-in
        shipGroup.traverse(child => {
            if (child.isMesh) {
                // Only affect hull and greebles (things not already revealed/tracked)
                if (!this.componentMeshes.includes(child)) {
                    child.visible = true;
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(mat => {
                        if (mat) {
                            mat.transparent = true;
                            mat.opacity = 0;
                            if (mat.uniforms && mat.uniforms.opacity) {
                                mat.uniforms.opacity.value = 0;
                            }
                        }
                    });
                }
            }
        });

        let opacity = 0;
        const fadeInterval = setInterval(() => { 
            if (!this.isActive) { clearInterval(fadeInterval); return; }
            opacity += 0.02; 
            shipGroup.traverse(child => { 
                if (child.isMesh) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(mat => {
                        if (mat) {
                            mat.opacity = opacity;
                            if (mat.uniforms && mat.uniforms.opacity) {
                                mat.uniforms.opacity.value = opacity;
                            }
                        }
                    });
                }
            });
            
            if (opacity >= 1) { 
                clearInterval(fadeInterval);
                this.fadeIntervals.delete(fadeInterval);
                shipGroup.traverse(child => {
                    if (child.isMesh) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach(mat => { if (mat) mat.transparent = false; });
                    }
                });
                if (this.hullMesh) {
                    // this.hideInternals(); // DISABLED: Keep internals visible for industrial look/fallback
                }
                this.labelElement.innerText = this.shipName;
                this.descElement.innerText = "Ready for the Wormhole."; 

            } 
        }, 50);
        this.fadeIntervals.add(fadeInterval);
    }

    hideInternals() { this.componentMeshes.forEach(mesh => { mesh.visible = false; }); }

    update(time, delta) {
        super.update(time, delta);
        if (this.hullMesh && this.hullMesh.material && this.hullMesh.material.uniforms && this.hullMesh.material.uniforms.time) {
            this.hullMesh.material.uniforms.time.value = time * 0.001;
        }
        
        // Update label position to follow the active component
        if (this.activeGroup && this.activeGroup.meshes.length > 0) {
            // Find center of the group
            const center = new THREE.Vector3();
            const box = new THREE.Box3();
            this.activeGroup.meshes.forEach(mesh => box.expandByObject(mesh));
            box.getCenter(center);

            // Project to 2D screen space
            center.project(this.activeCamera);
            
            const x = (center.x * .5 + .5) * window.innerWidth;
            const y = (-(center.y * .5) + .5) * window.innerHeight;

            // Update UI position (offset slightly)
            this.uiContainer.style.left = `${x}px`;
            this.uiContainer.style.top = `${y + 50}px`; // Below the component
            this.uiContainer.style.bottom = 'auto'; // Clear bottom constraint
            this.uiContainer.style.transform = 'translate(-50%, 0)';
        }
    }

    onUnload() { 
        super.onUnload();
        
        if (this.revealTimeout) clearTimeout(this.revealTimeout);
        if (this.textInterval) clearInterval(this.textInterval);
        this.fadeIntervals.forEach(interval => clearInterval(interval));
        this.fadeIntervals.clear();

        if (this.uiContainer && this.uiContainer.parentNode) {
            this.uiContainer.parentNode.removeChild(this.uiContainer);
        }
        // Base class dispose will handle geometry/material cleanup
    }
}