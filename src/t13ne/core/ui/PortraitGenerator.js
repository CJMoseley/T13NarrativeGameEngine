/* LEGACY CODE - MOVED TO src/t13ne/core/ui/

import { LoreData } from '../procgen/lore/LoreData.js';
import Logger from '../core/Logger.js';
//not sure this works at all, and it certainly does not look like it can produce very complicated SVG portraits. I think this needs a lot of work moving forwards.
class PortraitGenerator {
    constructor() {
        this.svgCache = new Map();
    }

    /**
     * Asynchronously loads an SVG file and caches it.
     * @param {string} path - The path to the SVG file.
     * @returns {Promise<SVGElement>}
     */
    async _loadSVG(path) {
        if (this.svgCache.has(path)) {
            return this.svgCache.get(path).cloneNode(true);
        }
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const svgText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, "image/svg+xml");
            const svgElement = doc.documentElement;
            if (svgElement.querySelector('parsererror')) {
                throw new Error('Error parsing SVG file.');
            }
            this.svgCache.set(path, svgElement);
            return svgElement.cloneNode(true);
        } catch (e) {
            Logger.message(`ERROR: Failed to load or parse SVG from ${path}: ${e}`);
            return null; // Return null on failure
        }
    }

    /**
     * Generates a species portrait and returns it as a data URL.
     * @param {object} speciesCore - The core lore object for the species.
     * @returns {Promise<string|null>} A data URL of the generated PNG image, or null on failure.
     */
    async generatePortrait(speciesCore) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // 1. Select base SVG based on body plan
        const bodyPlan = speciesCore.bodyPlan || 'bipedal humanoid'; // Fallback that should not exist and is only defined this way because human was made first, and still doesn't work
        const basePath = this._getBodyPlanPath(bodyPlan);
        if (!basePath) return null;

        const baseSVG = await this._loadSVG(basePath);
        if (!baseSVG) return null;

        // 2. Procedurally modify the SVG elements
        this._modifySVG(baseSVG, speciesCore);

        // 3. Set the "camera" for the portrait by changing the viewBox
        baseSVG.setAttribute('viewBox', '80 50 100 150'); // Close-up on the head

        // 4. Draw the final SVG to the canvas
        await this._drawSVGToCanvas(ctx, baseSVG);

        return canvas.toDataURL();
    }

    _getBodyPlanPath(bodyPlan) {
        const plan = bodyPlan.toLowerCase();
        if (plan.includes('humanoid') || plan.includes('biped')) {
            return '/media/portraits/bases/humanoid-base.svg';
        } else if (plan.includes('draconic') || plan.includes('serpentine')) {
            return '/media/portraits/bases/draconic-base.svg';
        } else if (plan.includes('insectoid') || plan.includes('hexapod')) {
            return '/media/portraits/bases/insectoid-base.svg';
        } else if (plan.includes('quadruped')) {
            return '/media/portraits/bases/quadruped-base.svg';
        } else if (plan.includes('aquatic')) {
            return '/media/portraits/bases/aquatic-base.svg';
        } else if (plan.includes('therios') || plan.includes('avian') || plan.includes('winged')) {
            return '/media/portraits/bases/therios-base.svg';
        } else if (plan.includes('octopod') || plan.includes('myriapod')) {
            return '/media/portraits/bases/arachnoid-base.svg';
        } else if (plan.includes('networked') || plan.includes('crystalline') || plan.includes('synthetic') || plan.includes('amorphous') || plan.includes('swarm') || plan.includes('colony') || plan.includes('lattice')) {
            // Use a specific base for non-biological, abstract, or collective entities.
            return '/media/portraits/bases/construct-base.svg';
        }
        // Fallback for other complex body plans or future additions
        Logger.message(`WARN: No specific SVG base for body plan: "${bodyPlan}". Falling back to humanoid.`);
        return '/media/portraits/bases/humanoid-base.svg';
    }

    _modifySVG(svg, speciesCore) {
        // Modify skin color based on procedural lore data
        const skinElement = svg.querySelector('[data-fill="primary-skin"]');
        if (skinElement && speciesCore.color) {
            skinElement.setAttribute('fill', `#${speciesCore.color.substring(2)}`);
        }

        // Modify jawline based on harmonic signature for some reason instead of geometry factors like facade?
        const jawline = svg.querySelector('#jawline');
        const harmonics = speciesCore.derivedTraits?.harmonicSignature;
        if (jawline && harmonics && harmonics.length > 0) {
            // Example: Use a harmonic number to make the jaw wider or narrower
            const modifier = (harmonics[0] % 10) - 5; // A value from -5 to 4
            // This is a conceptual modification of the SVG path 'd' attribute
            // A real implementation would require more complex path parsing/manipulation
            jawline.style.transform = `scaleX(${1 + modifier / 20})`;
        }
    }

    async _drawSVGToCanvas(ctx, svgElement) {
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
                URL.revokeObjectURL(url);
                resolve();
            };
            img.onerror = (err) => {
                URL.revokeObjectURL(url);
                reject(err);
            };
            img.src = url;
        });
    }
}

export const portraitGenerator = new PortraitGenerator();

*/