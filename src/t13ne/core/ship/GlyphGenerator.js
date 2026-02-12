import * as THREE from 'three';
import { mulberry32 } from './ShipUtils.js';

export class GlyphGenerator {
    constructor() {
        // Create a shared canvas for texture generation to save memory
        if (typeof document !== 'undefined') {
            this.canvas = document.createElement('canvas');
            this.canvas.width = 512;
            this.canvas.height = 512;
            this.ctx = this.canvas.getContext('2d');
        }
    }

    /**
     * Generates a procedural corporation logo.
     * @param {number} seed 
     * @param {string} name - Corporation name
     * @param {THREE.Color} primaryColor 
     * @param {THREE.Color} secondaryColor 
     * @returns {THREE.CanvasTexture}
     */
    generateLogo(seed, name, primaryColor, secondaryColor) {
        if (!this.ctx) return null;
        const random = mulberry32(seed);
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const cx = width / 2;
        const cy = height / 2;

        // Clear and set background
        ctx.clearRect(0, 0, width, height);
        // Optional: Semi-transparent background for the decal plate
        ctx.fillStyle = 'rgba(20, 20, 20, 0.1)'; 
        ctx.fillRect(0, 0, width, height);

        // Draw Base Shape
        ctx.fillStyle = '#' + primaryColor.getHexString();
        ctx.strokeStyle = '#' + secondaryColor.getHexString();
        ctx.lineWidth = 20;

        const shapeType = Math.floor(random() * 6);
        const size = 180;

        ctx.beginPath();
        if (shapeType === 0) { // Circle
            ctx.arc(cx, cy, size, 0, Math.PI * 2);
        } else if (shapeType === 1) { // Square
            ctx.rect(cx - size, cy - size, size * 2, size * 2);
        } else if (shapeType === 2) { // Triangle
            ctx.moveTo(cx, cy - size);
            ctx.lineTo(cx + size, cy + size);
            ctx.lineTo(cx - size, cy + size);
        } else if (shapeType === 3) { // Diamond
            ctx.moveTo(cx, cy - size);
            ctx.lineTo(cx + size, cy);
            ctx.lineTo(cx, cy + size);
            ctx.lineTo(cx - size, cy);
        } else if (shapeType === 4) { // Shield
            ctx.moveTo(cx - size, cy - size * 0.5);
            ctx.lineTo(cx + size, cy - size * 0.5);
            ctx.lineTo(cx, cy + size);
        } else { // Hexagon
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const x = cx + Math.cos(angle) * size;
                const y = cy + Math.sin(angle) * size;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner Detail / Icon
        ctx.fillStyle = '#' + secondaryColor.getHexString();
        const innerType = Math.floor(random() * 4);
        const iSize = size * 0.5;

        ctx.beginPath();
        if (innerType === 0) { // Ring
            ctx.arc(cx, cy, iSize, 0, Math.PI * 2);
        } else if (innerType === 1) { // Cross
            ctx.fillRect(cx - iSize, cy - 20, iSize * 2, 40);
            ctx.fillRect(cx - 20, cy - iSize, 40, iSize * 2);
        } else if (innerType === 2) { // Star
            for(let i=0; i<5; i++){
                const angle = (i * 4 * Math.PI) / 5 - Math.PI/2;
                const x = cx + Math.cos(angle) * iSize;
                const y = cy + Math.sin(angle) * iSize;
                if(i===0) ctx.moveTo(x,y);
                else ctx.lineTo(x,y);
            }
        } else { // Initial
            const initial = name ? name.charAt(0).toUpperCase() : 'C';
            ctx.font = 'bold 180px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(initial, cx, cy + 10);
        }
        ctx.fill();

        // Create Texture
        const texture = new THREE.CanvasTexture(this.canvas);
        texture.needsUpdate = true;
        // Clone canvas content to texture so we can reuse the canvas
        const image = new Image();
        image.src = this.canvas.toDataURL();
        texture.image = image;
        
        return texture;
    }

    /**
     * Generates a text decal (Ship Name or ID).
     * @param {string} text 
     * @param {THREE.Color} color 
     * @returns {THREE.CanvasTexture}
     */
    generateTextDecal(text, color) {
        if (!this.ctx) return null;
        const ctx = this.ctx;
        const width = 512;
        const height = 128; // Wider aspect ratio for text
        this.canvas.width = width;
        this.canvas.height = height;

        ctx.clearRect(0, 0, width, height);
        
        // Stencil effect
        ctx.fillStyle = '#' + color.getHexString();
        ctx.font = 'bold 80px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add a border/box
        ctx.strokeStyle = '#' + color.getHexString();
        ctx.lineWidth = 5;
        ctx.strokeRect(10, 10, width - 20, height - 20);

        ctx.fillText(text.toUpperCase(), width / 2, height / 2);

        const texture = new THREE.CanvasTexture(this.canvas);
        texture.needsUpdate = true;
        const image = new Image();
        image.src = this.canvas.toDataURL();
        texture.image = image;

        // Reset canvas size
        this.canvas.width = 512;
        this.canvas.height = 512;

        return texture;
    }

    /**
     * Generates alien glyphs for species markings.
     * @param {number} seed 
     * @param {THREE.Color} color 
     * @returns {THREE.CanvasTexture}
     */
    generateGlyphs(seed, color) {
        if (!this.ctx) return null;
        const random = mulberry32(seed);
        const ctx = this.ctx;
        const width = 512;
        const height = 512;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#' + color.getHexString();
        ctx.strokeStyle = '#' + color.getHexString();
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';

        const cols = 4;
        const rows = 4;
        const cellW = width / cols;
        const cellH = height / rows;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cx = x * cellW + cellW / 2;
                const cy = y * cellH + cellH / 2;
                const r = cellW * 0.3;

                ctx.save();
                ctx.translate(cx, cy);
                
                // Procedural Glyph Logic
                const glyphType = Math.floor(random() * 3);
                ctx.beginPath();
                if (glyphType === 0) { // Dot and Line
                    ctx.arc(0, 0, 5, 0, Math.PI*2);
                    ctx.moveTo(0,0);
                    ctx.lineTo((random()-0.5)*r*2, (random()-0.5)*r*2);
                } else if (glyphType === 1) { // Curves
                    ctx.arc(0, 0, r, random()*Math.PI, random()*Math.PI + Math.PI);
                } else { // Angular
                    ctx.moveTo((random()-0.5)*r, (random()-0.5)*r);
                    ctx.lineTo((random()-0.5)*r, (random()-0.5)*r);
                    ctx.lineTo((random()-0.5)*r, (random()-0.5)*r);
                }
                ctx.stroke();
                ctx.restore();
            }
        }

        const texture = new THREE.CanvasTexture(this.canvas);
        texture.needsUpdate = true;
        const image = new Image();
        image.src = this.canvas.toDataURL();
        texture.image = image;
        return texture;
    }
}
