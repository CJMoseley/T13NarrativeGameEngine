// d:\GIthubreps\t13nge\T13NarrativeGameEngine\src\t13ne\core\ship\GlyphGenerator.js

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
        const random = mulberry32(seed);
        const width = 512;
        const height = 512;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const cx = width / 2;
        const cy = height / 2;

        // Clear and set background
        ctx.clearRect(0, 0, width, height);

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
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }

    /**
     * Generates a text decal (Ship Name or ID).
     * @param {string} text 
     * @param {THREE.Color} color 
     * @returns {THREE.CanvasTexture}
     */
    generateTextDecal(text, color) {
        const width = 512;
        const height = 512;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Ensure transparent background
        ctx.clearRect(0, 0, width, height);
        
        // Stencil effect
        ctx.strokeStyle = '#' + color.getHexString();
        
        // Removed border for painted look

        // Generate Alien Glyphs instead of English Text
        const random = mulberry32(text.length); // Seed with text length for consistency
        const numGlyphs = Math.min(text.length, 16); // Allow more glyphs
        
        // Grid Layout
        const cols = Math.ceil(Math.sqrt(numGlyphs));
        const rows = Math.ceil(numGlyphs / cols);
        const cellW = (width - 40) / cols;
        const cellH = (height - 40) / rows;
        
        ctx.lineWidth = 16;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < numGlyphs; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = 20 + col * cellW;
            const y = 20 + row * cellH;
            
            ctx.save();
            ctx.translate(x + cellW/2, y + cellH/2);
            
            // Draw random lines/shapes for glyph
            ctx.beginPath();
            for(let j=0; j<3; j++) {
                ctx.moveTo((random()-0.5) * cellW * 0.6, (random()-0.5) * cellH * 0.6);
                ctx.lineTo((random()-0.5) * cellW * 0.6, (random()-0.5) * cellH * 0.6);
            }
            ctx.stroke();
            ctx.restore();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        return texture;
    }
    /**
     * Generates a sigil based on the classic magic square method.
     * @param {string} text - The seed text to trace
     * @param {THREE.Color} color - The color of the sigil
     * @returns {THREE.CanvasTexture}
     */
    generateSigilDecal(text, color) {
        const width = 512;
        const height = 512;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, width, height);
        
        ctx.strokeStyle = '#' + color.getHexString();
        ctx.fillStyle = '#' + color.getHexString();
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Filter text to only letters and numbers, make uppercase
        const sanitizedText = text.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'UNKNOWN';
        
        // Define a 3x3 grid (coordinates with a margin)
        const margin = 80;
        const spanX = (width - margin * 2) / 2;
        const spanY = (height - margin * 2) / 2;
        
        const grid = [];
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                grid.push({
                    x: margin + x * spanX,
                    y: margin + y * spanY
                });
            }
        }

        // Map characters to grid indices (0-8)
        const sequence = [];
        for (let i = 0; i < sanitizedText.length; i++) {
            const charCode = sanitizedText.charCodeAt(i);
            sequence.push(charCode % 9);
        }

        // Draw the sigil path
        ctx.beginPath();
        for (let i = 0; i < sequence.length; i++) {
            const point = grid[sequence[i]];
            
            // Add a little noise to the points based on character position
            // to prevent overlapping lines if the same number repeats
            const offsetX = (Math.sin(i * 1.5) * 15);
            const offsetY = (Math.cos(i * 1.5) * 15);
            
            const px = point.x + offsetX;
            const py = point.y + offsetY;

            if (i === 0) {
                // Sigils traditionally start with a small circle
                ctx.arc(px, py, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }

            // Sigils traditionally end with a cross or dash
            if (i === sequence.length - 1) {
                ctx.stroke(); // Stroke the main path first
                
                ctx.beginPath();
                // Draw a small perpendicular line at the end
                ctx.arc(px, py, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
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
