import * as THREE from 'three';
import { SceneTools } from '/src/t13ne/core/SceneTools.js';
import ProcGen from '/src/t13ne/procgen/ProcGen.js';

export class Star extends THREE.Group {
    constructor(data, radius = 1000) {
        super();
        this.data = data;
        this.radius = radius;
        this.init();
    }

    init() {
        // 1. The Star Sphere
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        const color = this.data.color || 0xffffaa;
        
        // Generate a vibrant texture for the star
        const texture = this._createStarTexture(color);
        
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        this.add(mesh);

        // 2. The Glow Sprite
        if (SceneTools && SceneTools.createGlowTexture) {
            const spriteMat = new THREE.SpriteMaterial({ 
                map: SceneTools.createGlowTexture(), 
                color: color, 
                transparent: true, 
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                opacity: 0.8
            });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(this.radius * 12, this.radius * 12, 1);
            this.add(sprite);
        }

        // 3. The Light Source
        // Intensity and distance can be tuned based on context (system view vs orbit view)
        // For now, we add a point light with no decay for infinite reach in system view
        const light = new THREE.PointLight(color, 1.5, 0, 0);
        this.add(light);
    }

    _createStarTexture(colorVal) {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const prng = ProcGen.createPRNG('star');
        
        const baseColor = new THREE.Color(colorVal || 0xffffaa);
        const hsl = {};
        baseColor.getHSL(hsl);
        hsl.s = 1.0; // Max saturation for vibrancy
        hsl.l = 0.6; // Bright
        baseColor.setHSL(hsl.h, hsl.s, hsl.l);

        ctx.fillStyle = '#' + baseColor.getHexString();
        ctx.fillRect(0, 0, 512, 256);

        // Add some "sunspots" or surface variation for style
        for (let i = 0; i < 30; i++) {
            const x = prng.nextDouble() * 512;
            const y = prng.nextDouble() * 256;
            const r = prng.nextDouble() * 60 + 20;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
        }
        
        return new THREE.CanvasTexture(canvas);
    }
}