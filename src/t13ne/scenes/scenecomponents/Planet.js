import * as THREE from 'three';
import ProcGen from '/src/t13ne/procgen/ProcGen.js';
import { SceneTools } from '/src/t13ne/core/SceneTools.js';

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
            const texture = this._createProceduralTexture(this.data.color, prng);
            material = new THREE.MeshStandardMaterial({
                map: texture,
                color: 0xffffff, // Ensure base color is white so texture shows
                roughness: 0.8,
                metalness: 0.1
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

        // 2. Atmosphere (if applicable)
        if (this.data.atmosphere && this.data.atmosphere !== 'None') {
            const atmoGeo = new THREE.SphereGeometry(this.radius * 1.02, 64, 64);
            let atmoMat;
            
            if (this.highDetail && SceneTools.createCloudTexture) {
                atmoMat = new THREE.MeshStandardMaterial({
                    map: SceneTools.createCloudTexture(),
                    transparent: true,
                    opacity: 0.4,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide
                });
            } else {
                atmoMat = new THREE.MeshBasicMaterial({
                    color: surface.material.color,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.BackSide
                });
            }
            const atmo = new THREE.Mesh(atmoGeo, atmoMat);
            this.add(atmo);
        }

        // 3. Rings (if applicable)
        // Logic for rings can be added here based on data.type containing 'Ring'
    }

    _createProceduralTexture(colorData, prng) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Base Color
        const baseColor = new THREE.Color();
        if (colorData && colorData.h !== undefined) {
            baseColor.setHSL(colorData.h, colorData.s, Math.max(0.2, colorData.l)); // Ensure visibility
        } else if (colorData && colorData.r !== undefined && colorData.g !== undefined && colorData.b !== undefined) {
            baseColor.setRGB(colorData.r, colorData.g, colorData.b);
        } else if (colorData) {
            baseColor.set(colorData);
        } else {
            baseColor.setHex(0x228833);
        }
        
        ctx.fillStyle = `#${baseColor.getHexString()}`;
        ctx.fillRect(0, 0, 512, 256);

        // Add Noise/Texture
        const imageData = ctx.getImageData(0, 0, 512, 256);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (prng.nextDouble() - 0.5) * 30;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
            data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
        }
        ctx.putImageData(imageData, 0, 0);
        
        // Add Bands
        for (let i = 0; i < 10; i++) {
            const y = prng.nextDouble() * 256;
            const h = prng.nextDouble() * 20 + 5;
            ctx.fillStyle = `rgba(255, 255, 255, ${prng.nextDouble() * 0.1})`;
            ctx.fillRect(0, y, 512, h);
        }

        // Add Craters/Features
        for (let i = 0; i < 15; i++) {
            const x = prng.nextDouble() * 512;
            const y = prng.nextDouble() * 256;
            const r = prng.nextDouble() * 15 + 2;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fill();
        }
        
        return new THREE.CanvasTexture(canvas);
    }
}