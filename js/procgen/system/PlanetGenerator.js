import * as THREE from 'three';
import { PlanetShader } from './PlanetShader.js';
import { HullGenerator } from '../../core/ship/HullGenerator.js';
import { ShipComponent } from '../../core/ship/ShipComponent.js';
import ProcGen from '../ProcGen.js';
import Logger from '../../core/Logger.js';

export class PlanetGenerator {
    constructor(physxProvider) {
        this.hullGenerator = new HullGenerator(physxProvider);
    }

    /**
     * Generates a 3D mesh for a planet based on its data.
     * @param {object} planetData - The planet data object.
     * @returns {THREE.Group} The planet group containing surface, water, and atmosphere.
     */
    generatePlanetMesh(planetData) {
        const group = new THREE.Group();
        const radius = planetData.radius * 10; // Scale up for visibility
        const seed = this._stringToSeed(planetData.name || 'planet');
        const prng = ProcGen.createPRNG(seed);

        // 1. Base Planet Sphere (Oblate Spheroid)
        const geometry = new THREE.SphereGeometry(radius, 64, 64);
        // Flatten slightly for oblate shape
        geometry.scale(1, 0.95, 1); 

        // Determine colors based on resources/type
        const colors = this._getPlanetColors(planetData, prng);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                color1: { value: new THREE.Color(colors.c1) },
                color2: { value: new THREE.Color(colors.c2) },
                color3: { value: new THREE.Color(colors.c3) },
                seed: { value: prng.nextDouble() * 100 },
                waterLevel: { value: planetData.type.includes('Ocean') ? 0.1 : -0.1 },
                mountainHeight: { value: 0.2 },
                atmosphereDensity: { value: 0.5 }
            },
            vertexShader: PlanetShader.vertexShader,
            fragmentShader: PlanetShader.fragmentShader
        });

        const planetMesh = new THREE.Mesh(geometry, material);
        group.add(planetMesh);

        // 2. Water Surface (if applicable)
        if (planetData.type.includes('Terrestrial') || planetData.type.includes('Ocean')) {
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
        if (planetData.type.includes('Ring') || (planetData.moons && planetData.moons.some(m => m.isRing))) {
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
     * Uses HullGenerator to wrap random primitives.
     * @param {number} seed - Seed for generation.
     * @param {number} size - Approximate size.
     * @returns {THREE.Mesh} The asteroid mesh.
     */
    generateAsteroidMesh(seed, size = 5) {
        const prng = ProcGen.createPRNG(seed);
        const components = [];
        const numBlobs = Math.floor(prng.nextDouble() * 4) + 3;

        for (let i = 0; i < numBlobs; i++) {
            const s = size * (0.5 + prng.nextDouble() * 0.5);
            const pos = new THREE.Vector3(
                (prng.nextDouble() - 0.5) * size,
                (prng.nextDouble() - 0.5) * size,
                (prng.nextDouble() - 0.5) * size
            );
            // Use simple shapes for the hull generator
            components.push(new ShipComponent('sphere', pos, new THREE.Euler(), new THREE.Vector3(s, s, s), {}, 'sphere'));
        }

        // Generate Hull
        // Use INDUSTRIAL style for faceted rock look
        const styleConfig = { method: 'INDUSTRIAL', plating: false };
        let geometry = this.hullGenerator.generate(components, styleConfig);

        if (!geometry) {
            // Fallback
            geometry = new THREE.DodecahedronGeometry(size, 1);
        }

        // Apply noise to vertices for roughness
        const posAttribute = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);
            const noise = (prng.nextDouble() - 0.5) * size * 0.1;
            vertex.addScalar(noise);
            posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            color: 0x666666,
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
