import * as THREE from 'three';

/**
 * @module Avatar/SkinSystem
 * @description Manages PNG and SVG skins for procedural avatars.
 */
export class SkinSystem {
    constructor() {
        this.loader = new THREE.TextureLoader();
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Loads and applies a skin to a mesh.
     * @param {THREE.Mesh} mesh
     * @param {string|SVGElement} skinSource
     */
    async applySkin(mesh, skinSource) {
        let texture;
        if (typeof skinSource === 'string' && skinSource.endsWith('.svg')) {
            texture = await this._loadSVG(skinSource);
        } else if (skinSource instanceof SVGElement) {
            texture = await this._renderSVG(skinSource);
        } else {
            texture = await this.loader.loadAsync(skinSource);
        }

        mesh.material.map = texture;
        mesh.material.needsUpdate = true;
    }

    /**
     * Creates a layered skin from multiple sources.
     * @param {Array<{src: string, type: string}>} layers
     * @param {number} width
     * @param {number} height
     */
    async createLayeredSkin(layers, width = 1024, height = 1024) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.clearRect(0, 0, width, height);

        for (const layer of layers) {
            const img = await this._loadImage(layer.src);
            this.ctx.drawImage(img, 0, 0, width, height);
        }

        const texture = new THREE.CanvasTexture(this.canvas);
        return texture;
    }

    /**
     * @private
     */
    async _loadSVG(url) {
        const response = await fetch(url);
        const svgText = await response.text();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        return this._renderSVG(svgDoc.documentElement);
    }

    /**
     * @private
     */
    async _renderSVG(svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        return new Promise((resolve) => {
            img.onload = () => {
                const texture = new THREE.Texture(img);
                texture.needsUpdate = true;
                URL.revokeObjectURL(url);
                resolve(texture);
            };
            img.src = url;
        });
    }

    _loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }
}
