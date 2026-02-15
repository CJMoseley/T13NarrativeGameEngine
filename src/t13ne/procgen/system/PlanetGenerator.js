import * as THREE from 'three';
import ProcGen from '../ProcGen.js';
import Logger from '../../core/Logger.js';

export class PlanetGenerator {
    constructor(physxProvider) {
    }

    /**
     * Generates a 3D mesh for a planet based on its data.
     * @param {object} planetData - The planet data object.
     * @returns {THREE.Group} The planet group containing surface, water, and atmosphere.
     */
    generatePlanetMesh(planetData) {
        const group = new THREE.Group();
        const baseRadius = (typeof planetData.radius === 'number' && Number.isFinite(planetData.radius)) ? planetData.radius : 1.0;
        const radius = baseRadius * 10; // Scale up for visibility
        const seed = this._stringToSeed(planetData.name || 'planet');
        const prng = ProcGen.createPRNG(seed);

        // 1. Base Planet Sphere (Oblate Spheroid)
        const geometry = new THREE.SphereGeometry(radius, 64, 64);
        // Flatten slightly for oblate shape
        geometry.scale(1, 0.95, 1); 

        // Determine colors based on resources/type
        const colors = this._getPlanetColors(planetData, prng);

        // Use MeshStandardMaterial instead of ShaderMaterial to ensure rendering stability
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(colors.c1),
            roughness: 0.8,
            metalness: 0.1,
            map: this._generateSimplePlanetTexture(seed, colors) // Generate a simple texture
        });

        const planetMesh = new THREE.Mesh(geometry, material);
        group.add(planetMesh);

        // 2. Water Surface (if applicable)
        if (planetData.type && (planetData.type.includes('Terrestrial') || planetData.type.includes('Ocean'))) {
            const waterGeo = new THREE.SphereGeometry(radius * 0.995, 64, 64); // Slightly smaller to intersect
            const waterMat = new THREE.MeshStandardMaterial({
                color: 0x004488,
                transparent: true,
                opacity: 0.8,
                roughness: 0.1,
                metalness: 0.8
            });
            const waterMesh = new THREE.Mesh(waterGeo, waterMat);
            group.add(waterMesh);
        }

        // 3. Atmosphere / Clouds
        if (planetData.atmosphere && planetData.atmosphere !== 'None') {
            const cloudGeo = new THREE.SphereGeometry(radius * 1.02, 64, 64);
            const cloudMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.4,
                alphaMap: this._generateCloudTexture(seed), // Procedural cloud texture
                side: THREE.DoubleSide
            });
            const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
            group.add(cloudMesh);
        }

        // 4. Rings (if applicable)
        if ((planetData.type && planetData.type.includes('Ring')) || (planetData.moons && planetData.moons.some(m => m.isRing))) {
             const ringGeo = new THREE.RingGeometry(radius * 1.4, radius * 2.5, 64);
             const ringMat = new THREE.MeshBasicMaterial({ 
                 color: 0x888888, 
                 side: THREE.DoubleSide,
                 transparent: true,
                 opacity: 0.6,
                 map: this._generateRingTexture(seed)
             });
             const ringMesh = new THREE.Mesh(ringGeo, ringMat);
             ringMesh.rotation.x = Math.PI / 2;
             group.add(ringMesh);
        }

        return group;
    }

    /**
     * Generates a 3D mesh for an asteroid or small moon.
     * Uses DodecahedronGeometry to avoid HullGenerator/MarchingCubes issues.
     * @param {number} seed - Seed for generation.
     * @param {number} size - Approximate size.
     * @returns {THREE.Mesh} The asteroid mesh.
     */
    generateAsteroidMesh(seed, size = 5) {
        const prng = ProcGen.createPRNG(seed);
        
        // Optimization: Use DodecahedronGeometry directly instead of HullGenerator
        // This prevents heavy PhysX/MarchingCubes calculations and crashes if MC is broken
        const detail = 0; // Low detail for performance
        const geometry = new THREE.DodecahedronGeometry(size, detail);

        // Apply noise to vertices for roughness
        const posAttribute = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        
        // Random scale distortion
        const sx = 0.8 + prng.nextDouble() * 0.4;
        const sy = 0.8 + prng.nextDouble() * 0.4;
        const sz = 0.8 + prng.nextDouble() * 0.4;

        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);
            
            // Apply scale
            vertex.x *= sx;
            vertex.y *= sy;
            vertex.z *= sz;

            const noise = (prng.nextDouble() - 0.5) * size * 0.2;
            vertex.addScalar(noise);
            posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        geometry.computeVertexNormals();

        // Varied asteroid colors (Browns, Greys, Reddish)
        const hue = prng.nextDouble() * 0.1 + 0.05; // Orange-ish
        const sat = prng.nextDouble() * 0.2; // Low saturation
        const lit = 0.2 + prng.nextDouble() * 0.3; // Dark to Mid
        const color = new THREE.Color().setHSL(hue, sat, lit);

        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.9,
            metalness: 0.2
        });

        return new THREE.Mesh(geometry, material);
    }

    _stringToSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }

    _getPlanetColors(planetData, prng) {
        // Use pre-generated color if available (from PlanetarySystemGenerator)
        if (planetData.color) {
            const c = new THREE.Color();
            if (planetData.color.h !== undefined) {
                c.setHSL(planetData.color.h, planetData.color.s, planetData.color.l);
            } else if (planetData.color.isColor) {
                c.copy(planetData.color);
            } else {
                c.setHex(planetData.color);
            }
            // Generate complementary/analogous colors for c2/c3 based on c1
            const c2 = c.clone().offsetHSL(0.05, -0.1, -0.1); // Analogous darker
            const c3 = c.clone().offsetHSL(0, -0.2, 0.2); // Lighter/Darker variation
            return { c1: c.getHex(), c2: c2.getHex(), c3: c3.getHex() };
        }

        // Default terrestrial
        let c1 = 0x228822; // Green
        let c2 = 0x886644; // Brown
        let c3 = 0xffffff; // Snow

        const type = planetData.type || '';
        
        if (type.includes('Gas')) {
            c1 = 0xddccaa; c2 = 0xaa8866; c3 = 0xcc9988;
        } else if (type.includes('Ice')) {
            c1 = 0xaaccff; c2 = 0xffffff; c3 = 0x8899bb;
        } else if (type.includes('Volcanic')) {
            c1 = 0x330000; c2 = 0x110000; c3 = 0xff4400;
        } else if (type.includes('Desert')) {
            c1 = 0xffcc44; c2 = 0xcc8822; c3 = 0xaa6611;
        } else if (type.includes('Barren') || type.includes('Rock') || type.includes('Dwarf')) {
            // Vivid Barren: Not just grey. Reddish, bluish, purplish rock.
            const hue = prng.nextDouble();
            const sat = 0.2 + prng.nextDouble() * 0.3; // Some color
            const lit = 0.3 + prng.nextDouble() * 0.4;
            const c = new THREE.Color().setHSL(hue, sat, lit);
            c1 = c.getHex();
            c2 = c.clone().multiplyScalar(0.8).getHex(); // Darker shade
            c3 = c.clone().multiplyScalar(1.2).getHex(); // Lighter shade
        }

        // Adjust based on resources (if available in new format)
        if (planetData.resources && planetData.resources.length > 0) {
             // Simple tinting based on first resource name for now
             // In a full implementation, we'd use the resource 'value' or 'type'
             const res = planetData.resources[0];
             if (res.name && res.name.includes('Iron')) c1 = 0x883322;
             if (res.name && res.name.includes('Gold')) c3 = 0xffdd00;
             if (res.name && res.name.includes('Water')) c2 = 0x004488;
        }

        return { c1, c2, c3 };
    }

    _generateSimplePlanetTexture(seed, colors) {
        const width = 512;
        const height = 256;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const prng = ProcGen.createPRNG(seed);
        
        // Fill background
        ctx.fillStyle = '#' + new THREE.Color(colors.c1).getHexString();
        ctx.fillRect(0, 0, width, height);
        
        // Add noise bands/patches
        for (let i = 0; i < 50; i++) {
            const x = prng.nextDouble() * width;
            const y = prng.nextDouble() * height;
            const r = prng.nextDouble() * 50 + 20;
            
            ctx.fillStyle = (i % 2 === 0) ? '#' + new THREE.Color(colors.c2).getHexString() : '#' + new THREE.Color(colors.c3).getHexString();
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    _generateCloudTexture(seed) {
        // Create a canvas and draw noise
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 512, 256);
        
        // Simple random clouds
        const prng = ProcGen.createPRNG(seed);
        ctx.fillStyle = '#ffffff';
        for(let i=0; i<100; i++) {
            const x = prng.nextDouble() * 512;
            const y = prng.nextDouble() * 256;
            const r = prng.nextDouble() * 40 + 10;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI*2);
            ctx.fill();
        }
        
        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    _generateRingTexture(seed) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        
        const prng = ProcGen.createPRNG(seed);
        const gradient = ctx.createLinearGradient(0, 0, 256, 0);
        
        for(let i=0; i<5; i++) {
            gradient.addColorStop(prng.nextDouble(), `rgba(255,255,255,${prng.nextDouble()})`);
        }
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 1);
        
        return new THREE.CanvasTexture(canvas);
    }
}
