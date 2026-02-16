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
        const ctx = canvas.getContext('2d');

        const roughCanvas = document.createElement('canvas');
        roughCanvas.width = 1024;
        roughCanvas.height = 512;
        const roughCtx = roughCanvas.getContext('2d');
        
        // Base Color
        const baseColor = new THREE.Color();
        const colorData = planetData.color;

        if (colorData && colorData.h !== undefined) {
            baseColor.setHSL(colorData.h, Math.max(0.6, colorData.s), Math.max(0.4, colorData.l)); // Balanced vividness
        } else if (colorData && colorData.r !== undefined && colorData.g !== undefined && colorData.b !== undefined) {
            baseColor.setRGB(colorData.r, colorData.g, colorData.b);
        } else if (typeof colorData === 'number' || typeof colorData === 'string') {
            baseColor.set(colorData);
        } else if (colorData && typeof colorData === 'object' && Object.keys(colorData).length > 0) {
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
        if (hsl.s < 0.5) hsl.s = 0.5 + prng.nextDouble() * 0.5;
        if (hsl.l < 0.3) hsl.l = 0.3 + prng.nextDouble() * 0.4;
        baseColor.setHSL(hsl.h, hsl.s, hsl.l);
        
        // Secondary color for variation (analogous)
        const secColor = baseColor.clone().offsetHSL(0.1, 0, -0.1);

        // Generate Coherent Noise Texture
        const imageData = ctx.getImageData(0, 0, 1024, 512);
        const data = imageData.data;
        const roughImageData = roughCtx.getImageData(0, 0, 1024, 512);
        const rData = roughImageData.data;
        
        const noiseScale = 3.0; // Balanced scale
        const detailScale = 16.0; // Finer detail

        for (let y = 0; y < 512; y++) {
            for (let x = 0; x < 1024; x++) {
                // Map 2D grid to 3D sphere coordinates for seamless wrapping
                const u = x / 1024;
                const v = y / 512;
                const theta = u * Math.PI * 2;
                const phi = v * Math.PI;
                
                const sx = Math.sin(phi) * Math.cos(theta);
                const sy = Math.sin(phi) * Math.sin(theta);
                const sz = Math.cos(phi);

                // Fractal Brownian Motion (FBM) for detailed terrain
                let n = 0;
                let amplitude = 1.0;
                let frequency = noiseScale;
                n += amplitude * ProcGen.simplex3D(sx * frequency, sy * frequency, sz * frequency);
                amplitude *= 0.5; frequency *= 2.0;
                n += amplitude * ProcGen.simplex3D(sx * frequency, sy * frequency, sz * frequency);
                amplitude *= 0.5; frequency *= 2.0;
                n += amplitude * ProcGen.simplex3D(sx * frequency, sy * frequency, sz * frequency);
                
                // Normalize roughly to 0-1
                n = (n + 1.8) / 3.6; // Adjusted normalization for FBM range
                n = Math.max(0, Math.min(1, n));

                let r, g, b, roughness;

                // Water Threshold (if terrestrial)
                const isWater = (planetData.type.includes('Terrestrial') || planetData.type.includes('Ocean')) && n < 0.45;
                
                if (isWater) {
                    // Ocean Color (Deep Blue/Green)
                    r = 20; g = 60; b = 140;
                    roughness = 0.1; // Shiny
                } else {
                    // Land Color
                    r = (baseColor.r * n + secColor.r * (1 - n)) * 255;
                    g = (baseColor.g * n + secColor.g * (1 - n)) * 255;
                    b = (baseColor.b * n + secColor.b * (1 - n)) * 255;
                    roughness = 0.9; // Rough
                }

                const idx = (y * 1024 + x) * 4;
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
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