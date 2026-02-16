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
        this.init();
    }

    init() {
        const prng = ProcGen.createPRNG(this.data.name || 'planet');
        
        // 1. Surface
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        
        let material;
        if (this.highDetail) {
            // Procedural Texture Generation for Orbit View
            const textures = this._createProceduralTextures(this.data, prng);
            material = new THREE.MeshStandardMaterial({
                map: textures.map,
                roughnessMap: textures.roughness,
                bumpMap: textures.map,
                bumpScale: this.radius * 0.005, // Reduced bump scale to avoid "scribbles"
                color: 0xffffff, 
                metalness: 0.1,
                roughness: 1.0
            });
        } else {
            // Simple Color for System View
            let color = new THREE.Color(0x888888);
            if (this.data.color) {
                if (this.data.color.isColor) color = this.data.color;
                else if (this.data.color.h !== undefined) color.setHSL(this.data.color.h, this.data.color.s, this.data.color.l);
                else color.setHex(this.data.color);
            } else {
                color.setHSL(prng.nextDouble(), 0.6, 0.5);
            }
            material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7 });
        }

        const surface = new THREE.Mesh(geometry, material);
        surface.castShadow = true;
        surface.receiveShadow = true;
        this.add(surface);

        // 2. Clouds (Separate Layer)
        if (this.highDetail && this.data.atmosphere && this.data.atmosphere !== 'None') {
            const cloudGeo = new THREE.SphereGeometry(this.radius * 1.01, 64, 64);
            const cloudTex = this._createCloudTexture(prng);
            const cloudMat = new THREE.MeshStandardMaterial({
                map: cloudTex,
                transparent: true,
                opacity: 0.8,
                blending: THREE.NormalBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const clouds = new THREE.Mesh(cloudGeo, cloudMat);
            this.add(clouds);
        }

        // 3. Atmosphere Glow (Separate Layer)
        if (this.data.atmosphere && this.data.atmosphere !== 'None') {
            const atmoGeo = new THREE.SphereGeometry(this.radius * 1.025, 64, 64);
            // Determine atmosphere color based on type
            let atmoColor = 0x88ccff; // Default Blue
            if (this.data.type.includes('Gas')) atmoColor = 0xffcc88;
            if (this.data.type.includes('Volcanic')) atmoColor = 0xffaa88;
            if (this.data.type.includes('Ice')) atmoColor = 0xaaccff;
            
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

        // 3. Rings (if applicable)
        // Logic for rings can be added here based on data.type containing 'Ring'
    }

    _createProceduralTextures(planetData, prng) {
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
        
        // Base Color
        const baseColor = new THREE.Color();
        const colorData = planetData.color;

        if (colorData && colorData.h !== undefined) { // Prioritize HSL
            baseColor.setHSL(colorData.h, colorData.s, colorData.l);
        } else if (colorData) { // Fallback to any other valid THREE.Color format
            baseColor.set(colorData);
        } else if (planetData.name) {
            // Generate from Name Frequency if no color provided
            let freq = 0;
            for(let i=0; i<planetData.name.length; i++) freq += planetData.name.charCodeAt(i);
            freq = (freq % 300) + 400; // 400-700Hz range (Visible spectrum)
            baseColor.set(ColourUtils.curvedFrequencyToHex(freq));
        } else {
            baseColor.setHex(0x228833);
        }

        // Enforce Vibrancy check
        const hsl = {};
        baseColor.getHSL(hsl);
        if (hsl.s < 0.6) hsl.s = 0.6 + prng.nextDouble() * 0.4; // Force high saturation
        if (hsl.l < 0.2) hsl.l = 0.3 + prng.nextDouble() * 0.4; // Avoid too dark
        baseColor.setHSL(hsl.h, hsl.s, hsl.l);
        
        // Secondary color for variation (analogous)
        const secColor = baseColor.clone().offsetHSL(0.1, 0, -0.1);

        // Generate Coherent Noise Texture
        const imageData = ctx.createImageData(1024, 512);
        const data = imageData.data;
        const roughImageData = roughCtx.createImageData(1024, 512);
        const rData = roughImageData.data;

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
                waterDeep: new THREE.Color(0x110000), // Magma
                waterShallow: new THREE.Color(0xff4400), // Bright lava
                land1: new THREE.Color(0x222222), // Black rock
                land2: new THREE.Color(0x444444), // Grey rock
                landHigh: new THREE.Color(0x111111),
                ice: new THREE.Color(0x555555) // Ash/soot
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

        // --- TEXTURE GENERATION LOOP ---
        const noiseScale = 4.0;
        const detailScale = 12.0;
        const warpScale = 0.5;

        for (let y = 0; y < 512; y++) {
            for (let x = 0; x < 1024; x++) {
                const u = x / 1024;
                const v = y / 512;
                const theta = u * Math.PI * 2;
                const phi = v * Math.PI;

                let sx = Math.sin(phi) * Math.cos(theta);
                let sy = Math.sin(phi) * Math.sin(theta);
                let sz = Math.cos(phi);

                // FBM for terrain features
                let n = 0;
                let amp = 1.0;
                let freq = noiseScale;
                for (let i = 0; i < 5; i++) {
                    n += amp * ProcGen.simplex3D(sx * freq, sy * freq, sz * freq);
                    amp *= 0.5;
                    freq *= 2.0;
                }
                n = (n + 1.0) / 2.0; // Normalize to 0-1

                // Determine final color based on noise value (height)
                let finalColor = new THREE.Color();
                let roughness = 0.8;

                // Water Threshold (if terrestrial)
                const isWater = (planetData.type.includes('Terrestrial') || planetData.type.includes('Ocean')) && n < 0.45;
                
                if (isWater) {
                    // Ocean Color (Deep Blue/Green)
                    finalColor.lerpColors(p.waterDeep, p.waterShallow, (n / 0.45));
                    roughness = 0.1; // Shiny
                } else {
                    // Land Color
                    const landHeight = (n - 0.45) / 0.55; // Remap 0.45-1.0 to 0-1
                    finalColor.lerpColors(p.land1, p.land2, landHeight);
                    if (landHeight > 0.7) {
                        finalColor.lerp(p.landHigh, (landHeight - 0.7) / 0.3);
                    }
                    roughness = 0.9; // Rough
                }

                const idx = (y * 1024 + x) * 4;
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
        
        // Add Ice Caps (Procedural)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(0, 0, 1024, 60); // Top (Larger)
        ctx.fillRect(0, 452, 1024, 60); // Bottom (Larger)

        // Ice is smooth
        roughCtx.fillStyle = 'rgba(20, 20, 20, 1.0)'; // Low roughness
        roughCtx.fillRect(0, 0, 1024, 60);
        roughCtx.fillRect(0, 452, 1024, 60);
        
        return {
            map: new THREE.CanvasTexture(canvas),
            roughness: new THREE.CanvasTexture(roughCanvas)
        };
    }

    _createCloudTexture(prng) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Transparent background
        ctx.clearRect(0, 0, 1024, 512);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for(let i=0; i<200; i++) {
            const x = prng.nextDouble() * 1024;
            const y = prng.nextDouble() * 512;
            const r = prng.nextDouble() * 40 + 10;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
        }
        return new THREE.CanvasTexture(canvas);
    }
}