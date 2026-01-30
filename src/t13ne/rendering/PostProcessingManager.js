import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { LuminosityShader } from 'three/examples/jsm/shaders/LuminosityShader.js';
import { SobelOperatorShader } from 'three/examples/jsm/shaders/SobelOperatorShader.js';

/**
 * @module Rendering/PostProcessingManager
 * @description Manages post-processing effects like Sobel Edge Detection.
 */
export class PostProcessingManager {
    constructor(renderer, scene, camera) {
        this.composer = new EffectComposer(renderer);
        this.composer.addPass(new RenderPass(scene, camera));

        // 1. Luminosity pass (needed for Sobel)
        this.effectGrayScale = new ShaderPass(LuminosityShader);
        this.composer.addPass(this.effectGrayScale);

        // 2. Sobel pass
        this.effectSobel = new ShaderPass(SobelOperatorShader);
        this.effectSobel.uniforms['resolution'].value.set(
            window.innerWidth * window.devicePixelRatio,
            window.innerHeight * window.devicePixelRatio
        );
        this.composer.addPass(this.effectSobel);
    }

    render() {
        this.composer.render();
    }

    setSize(width, height) {
        this.composer.setSize(width, height);
        this.effectSobel.uniforms['resolution'].value.set(
            width * window.devicePixelRatio,
            height * window.devicePixelRatio
        );
    }
}
