// js/core/ModelLoader.js

import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { TDSLoader } from 'three/examples/jsm/loaders/TDSLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// USDALoader is more complex and might require additional dependencies or a custom build,
// so we'll leave it as a lower priority/future enhancement for now.
// import { USDZLoader } from 'three/addons/loaders/USDZLoader.js'; // For USD files

/**
 * Manages the loading of 3D models from various formats.
 * Leverages Three.js loaders to support OBJ, 3DS, PLY, and JSON.
 * Future support for USD can be added if needed.
 */
class ModelLoader {
    constructor() {
        this.loadingManager = new THREE.LoadingManager();
        this.loaders = {
            'obj': new OBJLoader(this.loadingManager),
            '3ds': new TDSLoader(this.loadingManager),
            'ply': new PLYLoader(this.loadingManager),
            'json': new THREE.ObjectLoader(this.loadingManager), // For Three.js JSON format
            'fbx': new FBXLoader(this.loadingManager),
            'gltf': new GLTFLoader(this.loadingManager),
            'glb': new GLTFLoader(this.loadingManager)
            // 'usdz': new USDZLoader(this.loadingManager) // Uncomment and add if USDZ support is implemented
        };

        this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
            console.log(`Started loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
        };
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            console.log(`Loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
        };
        this.loadingManager.onLoad = () => {
            console.log('Loading complete!');
        };
        this.loadingManager.onError = (url) => {
            console.error('There was an error loading ' + url);
        };
    }

    /**
     * Loads a 3D model from the specified URL.
     * @param {string} url The URL of the model file.
     * @returns {Promise<THREE.Object3D>} A promise that resolves with the loaded 3D object.
     */
    async loadModel(url) {
        const extension = url.split('.').pop().toLowerCase();
        
        if (extension === 'obj') {
            return this.loadOBJWithMaterials(url);
        }

        const loader = this.loaders[extension];
        if (!loader) {
            console.error(`No loader found for file extension: ${extension}`);
            return Promise.reject(new Error(`Unsupported model format: ${extension}`));
        }

        return new Promise((resolve, reject) => {
            loader.load(
                url,
                (object) => {
                    console.log(`Successfully loaded model from: ${url}`);
                    resolve(object);
                },
                null,
                (error) => {
                    console.error(`Error loading model ${url}:`, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Specialized loader for OBJ files that attempts to load associated MTL files.
     */
    async loadOBJWithMaterials(url) {
        const mtlUrl = url.replace('.obj', '.mtl');
        const mtlLoader = new MTLLoader(this.loadingManager);
        
        return new Promise((resolve) => {
            mtlLoader.load(mtlUrl, (materials) => {
                materials.preload();
                const objLoader = new OBJLoader(this.loadingManager);
                objLoader.setMaterials(materials);
                objLoader.load(url, (object) => {
                    console.log(`Loaded OBJ with materials: ${url}`);
                    resolve(object);
                }, null, () => {
                    // Fallback to no materials if loading fails
                    this.loaders['obj'].load(url, resolve);
                });
            }, null, () => {
                // Fallback to no materials if MTL missing
                this.loaders['obj'].load(url, resolve);
            });
        });
    }

    /**
     * Loads a JSON model that might not be in the standard Three.js ObjectLoader format.
     * This is for custom simple JSON structures.
     * @param {string} url The URL of the JSON model file.
     * @returns {Promise<object>} A promise that resolves with the parsed JSON object.
     */
    async loadJSONModel(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log(`Successfully loaded custom JSON model from: ${url}`);
            // For simple JSON models, we might just return the data directly
            // or convert it into a basic Three.js object if structure is known.
            // For now, just return raw data.
            return data;
        } catch (error) {
            console.error(`Error loading custom JSON model ${url}:`, error);
            throw error;
        }
    }
}

export default ModelLoader;
