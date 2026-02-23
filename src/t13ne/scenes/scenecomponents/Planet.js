import * as THREE from 'three';
import ProcGen from '/src/t13ne/procgen/ProcGen.js';
import { SceneTools } from '/src/t13ne/core/SceneTools.js';
import { ColourUtils } from '/src/t13ne/utils/ColourUtils.js';

export class Planet extends THREE.Group {
    constructor(data, radius = 10, highDetail = false) {
        super();
        this.data = data;
        this.radius = radius;
        this.highDetail = highDetail;
        this.texturesGenerated = false;
        this.init();
    }

    init() {
        const prng = ProcGen.createPRNG(this.data.name || 'planet');
        
        // 1. Surface
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        
        // Initial simple material to prevent blocking
        let color = new THREE.Color(0x888888);
        if (this.data.color) {
            if (this.data.color.isColor) color = this.data.color;
            else if (this.data.color.h !== undefined) color.setHSL(this.data.color.h, this.data.color.s, this.data.color.l);
            else color.setHex(this.data.color);
        } else {
            color.setHSL(prng.nextDouble(), 0.6, 0.5);
        }
        this.baseColor = color.clone(); // Store determined color for consistency
        
        const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7 });
        const surface = new THREE.Mesh(geometry, material);
        surface.castShadow = true;
        surface.receiveShadow = true;
        this.add(surface);
        this.surfaceMesh = surface;

        if (this.highDetail) {
            this.generateTextures();
        }

        // 3. Atmosphere Glow (Separate Layer) - Always add low cost glow
        if (this.data.atmosphere && this.data.atmosphere !== 'None') {
            const atmoGeo = new THREE.SphereGeometry(this.radius * 1.025, 64, 64);
            // Determine atmosphere color based on type
            let atmoColor = 0x88ccff; // Default Blue
            const type = this.data.type || '';
            if (type.includes('Gas')) atmoColor = 0xffcc88;
            if (type.includes('Volcanic')) atmoColor = 0xffaa88;
            if (type.includes('Ice')) atmoColor = 0xaaccff;
            
            const atmoMat = new THREE.MeshBasicMaterial({
                color: atmoColor,
                transparent: true,
                opacity: 0.2,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending
            });
            const atmo = new THREE.Mesh(atmoGeo, atmoMat);
            this.add(atmo);
        }
    }

    enableHighDetail() {
        if (!this.highDetail || !this.texturesGenerated) {
            this.highDetail = true;
            this.generateTextures();
        }
    }

    generateTextures() {
        if (this.texturesGenerated) return;
        this.texturesGenerated = true;

        const prng = ProcGen.createPRNG(this.data.name || 'planet');

        // 1. Surface Textures
        this._generateTexturesAsync(this.data, prng).then(textures => {
            if (!this.surfaceMesh) return;
            
            const oldMat = this.surfaceMesh.material;
            this.surfaceMesh.material = new THREE.MeshStandardMaterial({
                map: textures.map,
                roughnessMap: textures.roughness,
                emissiveMap: textures.emissive,
                emissive: 0xffffff,
                emissiveIntensity: 1.0,
                bumpMap: textures.map,
                bumpScale: this.radius * 0.02,
                color: 0xffffff, 
                metalness: 0.1,
                roughness: 1.0
            });
            if (oldMat) oldMat.dispose();
        });

        // 2. Clouds (Separate Layer)
        if (this.data.atmosphere && this.data.atmosphere !== 'None') {
            const cloudGeo = new THREE.SphereGeometry(this.radius * 1.01, 64, 64);
            // Start invisible
            const cloudMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0, 
                blending: THREE.NormalBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const clouds = new THREE.Mesh(cloudGeo, cloudMat);
            this.add(clouds);
            
            this._createCloudTextureAsync(prng, this.data.type).then(tex => {
                if (clouds) {
                    clouds.material.map = tex;
                    clouds.material.opacity = 0.8;
                    clouds.material.needsUpdate = true;
                }
            });
        }

        // 3. Orbital Station (Signs of Habitation)
        const hasCities = (this.data.population > 0) || 
                          (this.data.biosphere && !['None', 'Extinct', 'Microbial'].some(s => this.data.biosphere.includes(s))) ||
                          (this.data.type && (this.data.type.includes('Terrestrial') || this.data.type.includes('Ocean')));

        if (hasCities && prng.nextDouble() > 0.3) {
             this._createOrbitalStation(prng);
        }
    }

    async _generateTexturesAsync(planetData, prng) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        // DEBUG: Add to body to see texture
        // canvas.style.position = 'fixed';
        // canvas.style.top = '0';
        // canvas.style.left = '0';
        // document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        const roughCanvas = document.createElement('canvas');
        roughCanvas.width = 1024;
        roughCanvas.height = 512;
        const roughCtx = roughCanvas.getContext('2d');

        const emissiveCanvas = document.createElement('canvas');
        emissiveCanvas.width = 1024;
        emissiveCanvas.height = 512;
        const emissiveCtx = emissiveCanvas.getContext('2d');
        
        // Base Color
        // Use the stored baseColor to ensure it matches the low-detail mesh
        const baseColor = this.baseColor ? this.baseColor.clone() : new THREE.Color(0x228833);
        
        // If we somehow don't have a baseColor (legacy), we skip the old fallback logic 
        // to avoid the mismatch described.

        // Enforce Vibrancy check
        const hsl = {};
        baseColor.getHSL(hsl);
        hsl.s = 0.8 + prng.nextDouble() * 0.2; // Force very high saturation for cartoon look
        hsl.l = 0.4 + prng.nextDouble() * 0.3; // Bright and vibrant
        baseColor.setHSL(hsl.h, hsl.s, hsl.l);
        
        // Secondary color for variation (analogous)
        const secColor = baseColor.clone().offsetHSL(0.1, 0, -0.1);

        // Generate Coherent Noise Texture
        const imageData = ctx.createImageData(1024, 512);
        const data = imageData.data;
        const roughImageData = roughCtx.createImageData(1024, 512);
        const rData = roughImageData.data;
        const emissiveImageData = emissiveCtx.createImageData(1024, 512);
        const eData = emissiveImageData.data;

        // Fill emissive with black initially
        for (let i = 0; i < eData.length; i += 4) { eData[i] = 0; eData[i+1] = 0; eData[i+2] = 0; eData[i+3] = 255; }


        // --- BIOME COLOR PALETTES ---
        const palettes = {
            'Terrestrial': {
                waterDeep: new THREE.Color(0x003366),
                waterShallow: new THREE.Color(0x006699),
                land1: baseColor,
                land2: secColor,
                landHigh: new THREE.Color(0x997755), // Brownish mountains
                ice: new THREE.Color(0xf0f8ff)
            },
            'Ocean': {
                waterDeep: new THREE.Color(0x002255),
                waterShallow: new THREE.Color(0x0055aa),
                land1: baseColor.clone().offsetHSL(0.1, 0.1, -0.2), // Small, dark islands
                land2: secColor.clone().offsetHSL(0.1, 0.1, -0.2),
                landHigh: new THREE.Color(0x444444),
                ice: new THREE.Color(0xddeeff)
            },
            'Volcanic': {
                waterDeep: new THREE.Color(0x220000), // Dark Magma
                waterShallow: new THREE.Color(0xff2200), // Bright lava
                land1: new THREE.Color(0x222222), // Black rock
                land2: new THREE.Color(0x444444), // Grey rock
                landHigh: new THREE.Color(0x111111),
                ice: new THREE.Color(0x333333) // Ash/soot
            },
            'Ice': {
                waterDeep: new THREE.Color(0x6699cc), // Sub-glacial ocean
                waterShallow: new THREE.Color(0x99ccff),
                land1: new THREE.Color(0xe0e8f0),
                land2: new THREE.Color(0xffffff),
                landHigh: new THREE.Color(0xcccccc),
                ice: new THREE.Color(0xf8f8ff)
            },
            'Gas': {
                waterDeep: baseColor, // Bands
                waterShallow: secColor,
                land1: baseColor.clone().offsetHSL(0.05, 0.1, 0.1),
                land2: secColor.clone().offsetHSL(-0.05, -0.1, -0.1),
                landHigh: new THREE.Color(0xffffff), // Storms
                ice: baseColor.clone().offsetHSL(0, 0, 0.2)
            },
            'Barren': {
                waterDeep: baseColor.clone().multiplyScalar(0.5), // Darker shade for "seas"
                waterShallow: baseColor.clone().multiplyScalar(0.8),
                land1: baseColor,
                land2: secColor,
                landHigh: baseColor.clone().offsetHSL(0, -0.1, 0.1),
                ice: baseColor.clone().offsetHSL(0, 0.1, 0.2)
            }
        };

        let pType = Object.keys(palettes).find(k => planetData.type.includes(k)) || 'Barren';
        const p = palettes[pType];

        // Algae color for Ice worlds
        let algaeColor = new THREE.Color();
        if (pType === 'Ice') {
            const algaeHues = [0.0, 0.8, 0.3]; // Red, Purple, Green
            algaeColor.setHSL(algaeHues[Math.floor(prng.nextDouble() * algaeHues.length)], 1.0, 0.5);
        }

        // Habitation Check
        const hasCities = (planetData.population > 0) || 
                          (planetData.biosphere && !['None', 'Extinct', 'Microbial'].some(s => planetData.biosphere.includes(s))) ||
                          (pType === 'Terrestrial' || pType === 'Ocean');

        // --- NOISE FUNCTIONS ---
        const fbm = (x, y, z, octaves, persistence, scale) => {
            const n = ProcGen.fbm3D(x * scale, y * scale, z * scale, Math.min(octaves, 4), 2.0, persistence);
            return (n + 1) * 0.5; // Normalize -1..1 to 0..1
        };

        const ridged = (x, y, z, octaves, persistence, scale) => {
            let total = 0;
            let frequency = scale;
            let amplitude = 1;
            let maxVal = 0;
            for(let i = 0; i < Math.min(octaves, 4); i++) {
                let n = ProcGen.simplex3D(x * frequency, y * frequency, z * frequency);
                n = 1.0 - Math.abs(n);
                n = n * n; // Sharpen ridges
                total += n * amplitude;
                maxVal += amplitude;
                amplitude *= persistence;
                frequency *= 2;
            }
            return total / maxVal;
        };

        const domainWarp = (x, y, z, octaves, scale) => {
            const qx = ProcGen.fbm3D(x * scale, y * scale, z * scale, 3, 2.0, 0.5);
            const qy = ProcGen.fbm3D((x + 5.2) * scale, (y + 1.3) * scale, (z + 2.8) * scale, 3, 2.0, 0.5);
            const qz = ProcGen.fbm3D((x + 9.2) * scale, (y + 2.3) * scale, (z + 4.8) * scale, 3, 2.0, 0.5);
            
            const n = ProcGen.fbm3D(
                (x + 4.0 * qx) * scale, 
                (y + 4.0 * qy) * scale, 
                (z + 4.0 * qz) * scale, 
                3, 2.0, 0.5
            );
            return (n + 1) * 0.5;
        };

        const worley = (x, y, z, scale) => {
            return Math.min(1, ProcGen.worley3D(x * scale, y * scale, z * scale));
        };

        // --- TEXTURE GENERATION LOOP ---
        const noiseScale = 2.0;
        const bands = 5.0; // Number of color bands for cartoon look

        for (let y = 0; y < 512; y++) {
            // Yield every 4 rows to prevent UI freeze (High complexity noise needs frequent yields)
            if (y % 4 === 0) await new Promise(resolve => setTimeout(resolve, 0));

            for (let x = 0; x < 1024; x++) {
                const idx = (y * 1024 + x) * 4;
                const u = x / 1024;
                const v = y / 512;
                const theta = u * Math.PI * 2;
                const phi = v * Math.PI;

                let sx = Math.sin(phi) * Math.cos(theta);
                let sy = Math.sin(phi) * Math.sin(theta);
                let sz = Math.cos(phi);

                let n = 0;

                // Select noise algorithm based on planet type
                if (pType === 'Gas') {
                    // Gas giants get domain warping for fluid look
                    n = domainWarp(sx, sy, sz, 6, noiseScale);
                } else if (pType === 'Volcanic') {
                    // Rocky worlds get ridged noise for mountains/craters
                    n = ridged(sx, sy, sz, 8, 0.5, noiseScale);
                } else if (pType === 'Barren' || pType === 'Ice') {
                    // Mix FBM with Worley for craters/shattered ice look
                    const base = fbm(sx, sy, sz, 4, 0.5, noiseScale);
                    const cell = worley(sx, sy, sz, noiseScale * 2.0);
                    // Invert worley for craters/cells
                    n = base * 0.6 + (1.0 - cell) * 0.4; 
                } else {
                    // Terrestrial/Ocean/Ice get standard FBM but with more octaves
                    n = fbm(sx, sy, sz, 8, 0.5, noiseScale);
                }
                
                n = Math.max(0, Math.min(1, n)); // Clamp

                // Determine final color based on noise value (height)
                let finalColor = new THREE.Color();
                let roughness = 0.8;

                // Water Threshold (if terrestrial)
                let waterLevel = 0.45;
                if (pType === 'Ocean') waterLevel = 0.75; // Ocean worlds are mostly water

                const isWater = (planetData.type.includes('Terrestrial') || planetData.type.includes('Ocean')) && n < waterLevel;
                
                if (isWater) {
                    // Ocean Color (Deep Blue/Green)
                    finalColor.lerpColors(p.waterDeep, p.waterShallow, (n / waterLevel));
                    roughness = 0.2; // Shiny
                } else {
                    // Land Color
                    const landHeight = (n - waterLevel) / (1.0 - waterLevel); // Remap waterLevel-1.0 to 0-1
                    
                    // Cartoony Stepping
                    const steppedHeight = Math.floor(landHeight * bands) / bands;
                    
                    finalColor.lerpColors(p.land1, p.land2, steppedHeight);
                    if (landHeight > 0.7) {
                        finalColor.lerp(p.landHigh, (landHeight - 0.7) / 0.3);
                    }

                    // Ice Algae
                    if (pType === 'Ice') {
                        // Secondary noise for algae patches
                        let algaeN = ProcGen.simplex3D(sx * 10, sy * 10, sz * 10);
                        if (algaeN > 0.4) {
                            finalColor.lerp(algaeColor, (algaeN - 0.4) * 1.5);
                        }
                    }

                    // Volcanic Features
                    if (pType === 'Volcanic') {
                        if (n < 0.55) {
                            // Lava Veins (Emissive)
                            eData[idx] = 255; // Red
                            eData[idx + 1] = 100 + Math.floor(n * 200); // Orange variation
                            eData[idx + 2] = 0;
                        } else {
                            // Sulphur/Chemical Stains (Io-like "Moldy Pizza")
                            let chemN = ProcGen.simplex3D(sx * 6.0, sy * 6.0, sz * 6.0);
                            if (chemN > -0.2) {
                                const chemColor = new THREE.Color();
                                if (chemN > 0.5) chemColor.setHex(0xf5e050); // Sulphur Yellow
                                else if (chemN > 0.2) chemColor.setHex(0xcb7520); // Orange/Red
                                else if (chemN > 0.0) chemColor.setHex(0x654321); // Dark Brown
                                else chemColor.setHex(0x556b2f); // Olive Green
                                
                                finalColor.lerp(chemColor, (chemN + 0.2) * 0.7);
                            }
                        }
                    }

                    // City Lights (Emissive)
                    if (hasCities && !isWater && pType !== 'Volcanic' && pType !== 'Gas') {
                        // Use Worley noise for city clusters
                        let cityN = worley(sx, sy, sz, noiseScale * 15.0); 
                        // Invert and threshold for sparse cities
                        if (cityN > 0.85) { 
                             // Mask with land height to avoid underwater cities and high peaks
                             if (n < 0.8) {
                                 eData[idx] = 255; // Warm Light
                                 eData[idx + 1] = 220;
                                 eData[idx + 2] = 150;
                             }
                        }
                    }

                    roughness = 0.9; // Rough
                }

                data[idx] = finalColor.r * 255;
                data[idx + 1] = finalColor.g * 255;
                data[idx + 2] = finalColor.b * 255;
                data[idx + 3] = 255;

                rData[idx] = roughness * 255;
                rData[idx + 1] = roughness * 255;
                rData[idx + 2] = roughness * 255;
                rData[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        roughCtx.putImageData(roughImageData, 0, 0);
        emissiveCtx.putImageData(emissiveImageData, 0, 0);
        
        // Add Ice Caps (Procedural)
        if (pType !== 'Volcanic' && pType !== 'Gas') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(0, 0, 1024, 40); // Top
            ctx.fillRect(0, 472, 1024, 40); // Bottom

            // Ice is smooth
            roughCtx.fillStyle = 'rgba(20, 20, 20, 1.0)'; // Low roughness
            roughCtx.fillRect(0, 0, 1024, 40);
            roughCtx.fillRect(0, 472, 1024, 40);
        }
        
        return {
            map: new THREE.CanvasTexture(canvas),
            roughness: new THREE.CanvasTexture(roughCanvas),
            emissive: new THREE.CanvasTexture(emissiveCanvas)
        };
    }

    async _createCloudTextureAsync(prng, type) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(1024, 512);
        const data = imgData.data;
        
        const isVolcanic = type && type.includes('Volcanic');
        const cloudOpacity = isVolcanic ? 0.9 : 0.6;
        const scale = 3.0;
        
        for (let y = 0; y < 512; y++) {
            // Yield every 8 rows
            if (y % 8 === 0) await new Promise(resolve => setTimeout(resolve, 0));

            for (let x = 0; x < 1024; x++) {
                const idx = (y * 1024 + x) * 4;
                
                // Spherical mapping for seamless clouds
                const u = x / 1024;
                const v = y / 512;
                const theta = u * Math.PI * 2;
                const phi = v * Math.PI;
                
                const sx = Math.sin(phi) * Math.cos(theta);
                const sy = Math.sin(phi) * Math.sin(theta);
                const sz = Math.cos(phi);

                // 3D FBM
                let n = ProcGen.fbm3D(sx * scale, sy * scale, sz * scale, 4, 2.0, 0.5);
                n = (n + 1) * 0.5; // 0..1

                let alpha = 0;
                if (n > 0.45) { // Cloud threshold
                    alpha = (n - 0.45) / 0.55;
                    alpha = Math.min(1, alpha * 1.2);
                }

                let r = 255, g = 255, b = 255;

                if (isVolcanic) {
                    // Mix Ash (Dark Grey) and Sulphur (Yellow)
                    let mixN = ProcGen.simplex3D(sx * 6.0, sy * 6.0, sz * 6.0);
                    mixN = (mixN + 1) * 0.5; 
                    
                    if (mixN > 0.6) {
                        // Sulphur
                        r = 210; g = 190; b = 90;
                    } else if (mixN > 0.4) {
                        // Blend
                        const t = (mixN - 0.4) / 0.2;
                        r = 50 + (210 - 50) * t;
                        g = 50 + (190 - 50) * t;
                        b = 50 + (90 - 50) * t;
                    } else {
                        // Ash
                        r = 50; g = 50; b = 50;
                    }
                }

                data[idx] = Math.floor(r);
                data[idx+1] = Math.floor(g);
                data[idx+2] = Math.floor(b);
                data[idx+3] = Math.floor(alpha * 255 * cloudOpacity);
            }
        }
        
        ctx.putImageData(imgData, 0, 0);
        return new THREE.CanvasTexture(canvas);
    }

    _createOrbitalStation(prng) {
        const stationGroup = new THREE.Group();
        
        // Main Hub
        const hullGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
        const hullMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.rotation.z = Math.PI / 2;
        stationGroup.add(hull);
        
        // Ring
        const ringGeo = new THREE.TorusGeometry(0.8, 0.1, 8, 16);
        const ring = new THREE.Mesh(ringGeo, hullMat);
        stationGroup.add(ring);
        
        // Solar Panels
        const panelGeo = new THREE.BoxGeometry(2.5, 0.05, 0.5);
        const panelMat = new THREE.MeshStandardMaterial({ color: 0x112244, emissive: 0x001133, roughness: 0.2 });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        stationGroup.add(panel);
        
        // Position in orbit (Geostationary relative to surface for now)
        const orbitRadius = this.radius * (1.2 + prng.nextDouble() * 0.5);
        const angle = prng.nextDouble() * Math.PI * 2;
        const inclination = (prng.nextDouble() - 0.5) * 0.5;
        
        stationGroup.position.set(
            Math.cos(angle) * orbitRadius,
            Math.sin(angle) * orbitRadius * Math.sin(inclination),
            Math.sin(angle) * orbitRadius * Math.cos(inclination)
        );
        
        stationGroup.lookAt(0, 0, 0);
        
        // Add a beacon light
        const beacon = new THREE.PointLight(0xff0000, 1, 5);
        stationGroup.add(beacon);

        this.add(stationGroup);
    }
}