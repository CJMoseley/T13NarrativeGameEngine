import * as THREE from 'three';
import ProcGen from '/src/t13ne/procgen/ProcGen.js';
import { SceneTools } from '/src/t13ne/core/SceneTools.js';

export class Starbox {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.starMaterial = null;
    }

    generate(scene, starData, radius = 50000) {
        this._createStars(scene, new THREE.Vector3(0,0,0), radius, false);
        this._createNebulae(scene, new THREE.Vector3(0,0,0), radius);
    }

    _createStars(scene, currentPos, radius, twinkling = false) {
        const starsGeometry = new THREE.BufferGeometry();
        const starsVertices = [];
        const starsColors = [];
        const starsSizes = [];
        
        const galaxy = this.gameEngine?.galaxyGenerator?.galaxy;

        if (galaxy && galaxy.stars && galaxy.stars.length > 0) {
            galaxy.stars.forEach(star => {
                const dx = star.x - currentPos.x;
                const dy = star.y - currentPos.y;
                const dz = star.z - currentPos.z;
                const distSq = dx*dx + dy*dy + dz*dz;
                if (distSq < 100) return; 
                const dist = Math.sqrt(distSq);
                const scale = radius / dist;
                starsVertices.push(dx * scale, dy * scale, dz * scale);
                const c = new THREE.Color(star.color);
                starsColors.push(c.r, c.g, c.b);
                starsSizes.push(Math.random() * 2.0 + 1.0);
            });
        } else {
            // Fallback
            const prng = ProcGen.createPRNG('skybox-fallback');
            for (let i = 0; i < 5000; i++) {
                const v = new THREE.Vector3(
                    (prng.nextDouble() - 0.5) * 2,
                    (prng.nextDouble() - 0.5) * 2,
                    (prng.nextDouble() - 0.5) * 2
                ).normalize().multiplyScalar(radius);
                starsVertices.push(v.x, v.y, v.z);
                starsColors.push(1, 1, 1);
                starsSizes.push(Math.random() * 2.0 + 1.0);
            }
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starsColors, 3));
        starsGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starsSizes, 1));
        
        let material;
        if (twinkling) {
            material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 }
                },
                vertexShader: `
                    attribute float size;
                    attribute vec3 color;
                    varying vec3 vColor;
                    uniform float time;
                    void main() {
                        vColor = color;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        
                        // Twinkle effect based on position and time
                        float twinkle = sin(time * 3.0 + position.x * 0.01 + position.y * 0.02) * 0.5 + 0.5;
                        float finalSize = size * (0.7 + 0.6 * twinkle);
                        
                        gl_PointSize = finalSize * (500.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    varying vec3 vColor;
                    void main() {
                        vec2 coord = gl_PointCoord - vec2(0.5);
                        if(length(coord) > 0.5) discard;
                        gl_FragColor = vec4(vColor, 1.0);
                    }
                `,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            this.starMaterial = material;
        } else {
            material = new THREE.PointsMaterial({ 
                vertexColors: true, 
                size: 2.5, 
                sizeAttenuation: false,
                transparent: true
            });
        }
        
        const starField = new THREE.Points(starsGeometry, material);
        starField.name = "SkyboxStars";
        starField.renderOrder = -2; // Furthest back
        scene.add(starField);
    }

    _createNebulae(scene, currentPos, radius) {
        if (!this.gameEngine?.galaxyGenerator || !SceneTools || !SceneTools.createCloudTexture) return;

        const galaxyParams = this.gameEngine.galaxyGenerator.params;
        const galaxySeed = galaxyParams.seed || 'galaxy-visuals';
        const galPrng = ProcGen.create32PRNG(galaxySeed); 

        let galaxyRadius = galaxyParams.galaxyRadius;
        if (!Number.isFinite(galaxyRadius) || galaxyRadius < 100000) galaxyRadius = 2000000;
        
        const armCount = Math.max(2, galaxyParams.armCount);
        const winding = galaxyParams.winding;
        const WINDING_SCALE = 8.0;
        let safeWinding = Number(winding);
        if (!Number.isFinite(safeWinding)) safeWinding = 0.35;

        const nebulaCount = 1000; 
        const NEBULA_COLORS = [0x6699ff, 0xff33cc, 0x33ffcc, 0xffcc33, 0xff3333, 0x9966ff, 0x33ff66];
        
        const nebulaGroup = new THREE.Group();
        nebulaGroup.name = "SkyboxNebulae";
        const cloudTex = SceneTools.createCloudTexture();

        for (let i = 0; i < nebulaCount; i++) {
            const effectiveRadius = galaxyRadius * (0.85 + galPrng.nextDouble() * 0.3);
            const rNorm = Math.pow(galPrng.nextDouble(), 0.5); 
            const rad = rNorm * effectiveRadius;

            const armIndex = Math.floor(galPrng.nextDouble() * armCount);
            const armOffset = (Math.PI * 2 / armCount) * armIndex;
            const A = 100;
            let theta = -Math.log((rad + A) / A) * safeWinding * WINDING_SCALE;
            theta += armOffset;
            theta += (galPrng.nextDouble() - 0.5) * 1.5;

            const flare = 1.0 + (rNorm * rNorm * 0.25);
            const z = (galPrng.nextDouble() + galPrng.nextDouble() - 1.0) * galaxyRadius * 0.01 * flare;
            const x = rad * Math.cos(theta);
            const y = rad * Math.sin(theta);

            const clusterNoise = ProcGen.simplex2D(x * 0.003, y * 0.003);
            if (clusterNoise < 0.0) continue;

            const nebulaPos = new THREE.Vector3(x, y, z);
            const dist = nebulaPos.distanceTo(currentPos);
            const dir = new THREE.Vector3().subVectors(nebulaPos, currentPos).normalize();
            
            const realSize = (galPrng.nextDouble() * 300 + 150);
            const safeDist = Math.max(dist, 50); 
            
            let spriteScale = (realSize / safeDist) * radius * 1.5; 
            if (spriteScale < 20) continue;
            spriteScale = Math.min(spriteScale, radius * 1.5);

            const colorInt = NEBULA_COLORS[Math.floor(galPrng.nextDouble() * NEBULA_COLORS.length)];
            const color = new THREE.Color(colorInt);
            const opacity = (0.1 + galPrng.nextDouble() * 0.2) * Math.min(1.0, 50000 / safeDist);

            const spriteMat = new THREE.SpriteMaterial({
                map: cloudTex,
                color: color,
                transparent: true,
                opacity: opacity,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                rotation: galPrng.nextDouble() * Math.PI * 2
            });

            const sprite = new THREE.Sprite(spriteMat);
            sprite.position.copy(dir.multiplyScalar(radius * 0.95)); 
            sprite.scale.set(spriteScale, spriteScale, 1);
            nebulaGroup.add(sprite);
        }
        scene.add(nebulaGroup);
    }

    update(time) {
        if (this.starMaterial && this.starMaterial.uniforms) {
            this.starMaterial.uniforms.time.value = time;
        }
    }
}