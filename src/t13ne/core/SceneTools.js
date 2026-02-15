import * as THREE from 'three';
import ProcGen from '/src/t13ne/procgen/ProcGen.js';

export const SceneTools = {
    /**
     * Creates a radial gradient texture for stars or glows.
     * @param {number} size - Width/Height of the texture.
     * @param {string} color - CSS color string.
     * @returns {THREE.CanvasTexture}
     */
    createStarTexture: (size = 128, color = 'rgba(255, 255, 255, 1)') => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const center = size / 2;

        ctx.clearRect(0, 0, size, size);

        const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
        grad.addColorStop(0, color);
        // Hacky alpha adjustment for inner glow
        grad.addColorStop(0.2, color.replace('1)', '0.8)').replace('1)', '0.8)'));
        grad.addColorStop(0.5, color.replace('1)', '0.2)').replace('1)', '0.2)'));
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    },

    /**
     * Creates a soft glow texture (white).
     * @returns {THREE.CanvasTexture}
     */
    createGlowTexture: () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(canvas);
    },

    /**
     * Creates a cloud-like texture for nebulae.
     * @returns {THREE.CanvasTexture}
     */
    createCloudTexture: () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Draw multiple soft puffs to create an irregular cloud shape
        for (let i = 0; i < 8; i++) {
            const x = 64 + (Math.random() - 0.5) * 40;
            const y = 64 + (Math.random() - 0.5) * 40;
            const r = 10 + Math.random() * 20;

            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 128, 128);
        }
        return new THREE.CanvasTexture(canvas);
    },

    /**
     * Creates a particle system starfield.
     * @param {number} radius - The radius of the starfield sphere.
     * @param {number} count - Number of stars.
     * @param {number} size - Size of the particles.
     * @param {boolean} sizeAttenuation - Whether size scales with distance.
     * @returns {THREE.Points}
     */
    createStarfield: (radius, count = 10000, size = 1, sizeAttenuation = false) => {
        const starsGeo = new THREE.BufferGeometry();
        const starsPos = [];
        const starsCol = [];

        for (let i = 0; i < count; i++) {
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);
            const r = radius * (0.8 + Math.random() * 0.4);

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            starsPos.push(x, y, z);

            const color = new THREE.Color();
            color.setHSL(Math.random(), 0.5, Math.random() * 0.5 + 0.5);
            starsCol.push(color.r, color.g, color.b);
        }

        starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starsPos, 3));
        starsGeo.setAttribute('color', new THREE.Float32BufferAttribute(starsCol, 3));

        const starsMat = new THREE.PointsMaterial({
            size: size,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: sizeAttenuation,
            depthWrite: false,
            fog: false
        });

        return new THREE.Points(starsGeo, starsMat);
    },

    /**
     * Generates a procedural planet texture using Simplex noise.
     * @param {object} planet - The planet data object.
     * @param {number} size - Texture resolution.
     * @returns {THREE.CanvasTexture}
     */
    generatePlanetTexture: (planet, size = 512) => {
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(size, size);
        const data = imgData.data;
        const h = planet.color ? planet.color.h : Math.random();
        const s = planet.color ? planet.color.s : 0.5;
        const l = planet.color ? planet.color.l : 0.5;
        const baseColor = new THREE.Color().setHSL(h, s, l);
        const secondaryColor = new THREE.Color().setHSL((h + 0.1) % 1, s * 0.8, l * 0.8);
        const noiseScale = 5.0;
        const seed = Math.random() * 100;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const u = x / size; const v = y / size;
                const nx = Math.cos(u * Math.PI * 2) * noiseScale;
                const ny = Math.sin(u * Math.PI * 2) * noiseScale;
                const nz = v * noiseScale;
                const n = ProcGen.simplex2D(nx + seed, ny + nz);
                const mix = (n + 1) / 2;
                const index = (x + y * size) * 4;
                data[index] = (baseColor.r * mix + secondaryColor.r * (1 - mix)) * 255;
                data[index + 1] = (baseColor.g * mix + secondaryColor.g * (1 - mix)) * 255;
                data[index + 2] = (baseColor.b * mix + secondaryColor.b * (1 - mix)) * 255;
                data[index + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
        if (planet.atmosphere && planet.atmosphere !== 'None') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            for(let i=0; i<20; i++) {
                ctx.beginPath(); ctx.arc(Math.random() * size, Math.random() * size, Math.random() * size / 4, 0, Math.PI * 2); ctx.fill();
            }
        }
        return new THREE.CanvasTexture(canvas);
    },

    /**
     * Calculates normalized mouse coordinates from a mouse event.
     * @param {MouseEvent} event - The mouse event.
     * @param {HTMLElement} domElement - The renderer's DOM element.
     * @returns {THREE.Vector2} Normalized coordinates (-1 to +1).
     */
    getMouseVector: (event, domElement) => {
        const rect = domElement.getBoundingClientRect();
        return new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
    }
};
