import * as THREE from 'three';

/**
 * @module UHPP/MaterialRegistry
 * @description Registry for materials used in procedural generation.
 * Caches materials and textures to improve performance and reduce memory churn.
 */
export class MaterialRegistry {
    constructor() {
        this.materialCache = new Map();
        this.textureLoader = new THREE.TextureLoader();
        this.textureCache = new Map();
    }

    /**
     * Gets or creates a material based on parameters.
     * @param {object} params
     * @returns {THREE.Material}
     */
    getMaterial(params = {}) {
        const key = JSON.stringify(params);
        if (this.materialCache.has(key)) return this.materialCache.get(key);

        const materialParams = {
            color: params.color !== undefined ? params.color : 0xcccccc,
            roughness: params.roughness !== undefined ? params.roughness : 0.5,
            metalness: params.metalness !== undefined ? params.metalness : 0.5,
            wireframe: params.wireframe || false,
            transparent: params.transparent || false,
            opacity: params.opacity !== undefined ? params.opacity : 1.0
        };

        if (params.map) {
            materialParams.map = this.getTexture(params.map);
        }
        if (params.normalMap) {
            materialParams.normalMap = this.getTexture(params.normalMap);
        }

        const material = new THREE.MeshStandardMaterial(materialParams);
        this.materialCache.set(key, material);
        return material;
    }

    /**
     * Gets or loads a texture.
     * @param {string} url
     * @returns {THREE.Texture}
     */
    getTexture(url) {
        if (this.textureCache.has(url)) return this.textureCache.get(url);

        const texture = this.textureLoader.load(url);
        this.textureCache.set(url, texture);
        return texture;
    }

    /**
     * Clears all cached materials and textures.
     */
    clear() {
        this.materialCache.forEach(m => m.dispose());
        this.materialCache.clear();
        this.textureCache.forEach(t => t.dispose());
        this.textureCache.clear();
    }
}

export const materialRegistry = new MaterialRegistry();
