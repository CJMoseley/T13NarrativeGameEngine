import * as THREE from 'three';
import { SceneTools } from '/src/t13ne/core/SceneTools.js';

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
        const material = new THREE.MeshBasicMaterial({ color: color });
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
}