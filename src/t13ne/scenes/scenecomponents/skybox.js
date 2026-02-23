import * as THREE from 'three';
import ProcGen from '/src/t13ne/procgen/ProcGen.js';
import { SceneTools } from '/src/t13ne/core/SceneTools.js';
import Logger from '/src/t13ne/core/Logger.js';

export class Skybox {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.starMaterial = null;
        this.atmosphereMaterial = null;
    }

    /**
     * Generates an atmospheric skybox for planetary surface views.
     * @param {THREE.Scene} scene 
     * @param {object} planetData - Data about the planet (atmosphere color, etc).
     * @param {object} starData - Data about the local star.
     * @param {THREE.Vector3} sunPosition - The position of the sun in the sky.
     * @param {number} radius - Radius of the skybox.
     */
    createAtmosphericSkybox(scene, planetData, starData, sunPosition, radius = 5000) {
        const funcName = 'Skybox.createAtmosphericSkybox';
        Logger.start(funcName);

        // 1. Stars (Background)
        // We create stars but they will be behind the atmosphere.
        // In a full implementation, we'd fade them based on daylight.
        this._createStars(scene, new THREE.Vector3(0,0,0), radius, true);

        // 2. Atmosphere Sphere (Shader based)
        const atmosphereRadius = radius * 0.9;
        const atmosphereGeometry = new THREE.SphereGeometry(atmosphereRadius, 64, 64);
        
        // Simple scattering approximation shader
        const vertexShader = `
            varying vec3 vWorldPosition;
            varying vec3 vSunDirection;
            uniform vec3 sunPosition;
            
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                vSunDirection = normalize(sunPosition);
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
        `;

        const fragmentShader = `
            uniform vec3 sunPosition;
            uniform vec3 atmosphereColor;
            uniform vec3 sunsetColor;
            uniform vec3 horizonColor;
            
            varying vec3 vWorldPosition;
            varying vec3 vSunDirection;

            void main() {
                vec3 viewDirection = normalize(vWorldPosition);
                
                // Calculate sun height (0 at horizon, 1 at zenith)
                float sunHeight = normalize(sunPosition).y;
                
                // Calculate view angle relative to horizon (0 at horizon, 1 at zenith)
                float viewHeight = viewDirection.y;
                
                // Sun Halo
                float sunDot = dot(viewDirection, normalize(sunPosition));
                float sunHalo = pow(max(0.0, sunDot), 200.0) * 2.0;
                
                // Basic Gradient
                vec3 skyColor = mix(horizonColor, atmosphereColor, max(0.0, pow(viewHeight, 0.5)));
                
                // Sunset mixing based on sun height
                if (sunHeight < 0.2) {
                    float sunsetFactor = 1.0 - (sunHeight * 5.0);
                    skyColor = mix(skyColor, sunsetColor, sunsetFactor * 0.8);
                }
                
                // Add Sun
                skyColor += vec3(1.0, 0.9, 0.7) * sunHalo;
                
                // Night darkening (if sun is low/negative)
                if (sunHeight < 0.0) {
                    skyColor *= max(0.0, 1.0 + sunHeight * 3.0); // Fade to black quickly
                }

                // Alpha for stars to show through at night/zenith?
                // For now, opaque skybox.
                gl_FragColor = vec4(skyColor, 1.0);
            }
        `;
        
        // Determine colors from planet data
        let baseColor = new THREE.Color(0x4488ff); // Earth Blue
        let sunsetColor = new THREE.Color(0xffaa66); // Orange
        let horizonColor = new THREE.Color(0xaaccff); // Hazy Blue

        if (planetData && planetData.atmosphereColor) {
             // If planetData has color info, use it
             // Assuming planetData.atmosphereColor is a hex or object
             // This logic would need to parse the specific data structure
        }

        this.atmosphereMaterial = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                sunPosition: { value: sunPosition },
                atmosphereColor: { value: baseColor },
                sunsetColor: { value: sunsetColor },
                horizonColor: { value: horizonColor }
            },
            side: THREE.BackSide,
            depthWrite: false,
            depthTest: false // Render behind everything else (except stars?)
            // Actually, stars are further out. Atmosphere should be drawn after stars but before terrain?
            // Or just use renderOrder.
        });

        const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, this.atmosphereMaterial);
        atmosphereMesh.name = "SkyboxAtmosphere";
        atmosphereMesh.renderOrder = -1; // Ensure it renders as background
        scene.add(atmosphereMesh);

        // 3. Clouds (Procedural)
        this._createClouds(scene, radius * 0.85, planetData);

        Logger.end(funcName);
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

    _createClouds(scene, radius, planetData) {
        if (!SceneTools || !SceneTools.createCloudTexture) return;
        
        const cloudCount = 20;
        const cloudGroup = new THREE.Group();
        const cloudTex = SceneTools.createCloudTexture();
        
        for(let i=0; i<cloudCount; i++) {
            const spriteMat = new THREE.SpriteMaterial({
                map: cloudTex,
                color: 0xffffff,
                transparent: true,
                opacity: 0.4,
                depthWrite: false
            });
            const sprite = new THREE.Sprite(spriteMat);
            
            // Random position on sphere
            const phi = Math.acos( -1 + ( 2 * Math.random() ) );
            const theta = Math.sqrt( Math.PI * cloudCount ) * phi;
            
            sprite.position.setFromSphericalCoords( radius, phi, theta );
            const scale = radius * 0.2 + Math.random() * radius * 0.1;
            sprite.scale.set(scale, scale, 1);
            
            cloudGroup.add(sprite);
        }
        cloudGroup.name = "SkyboxClouds";
        scene.add(cloudGroup);
    }

    update(time) {
        if (this.starMaterial && this.starMaterial.uniforms) {
            this.starMaterial.uniforms.time.value = time;
        }
        // Could also update sun position here if it moves
    }
}
