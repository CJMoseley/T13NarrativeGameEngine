import * as THREE from 'three';

/**
 * @module Rendering/CelShader
 * @description Custom Cel-Shader with configurable quantization and painterly effects.
 */
export const CelShader = {
    uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.common,
        THREE.UniformsLib.lights,
        {
            uTones: { value: 3 },
            uColor: { value: new THREE.Color(0xaaaaaa) },
            uHalftone: { value: 0.0 }, // 0 to 1
            uPointillism: { value: 0.0 },
            uEdgeThreshold: { value: 0.1 }
        }
    ]),

    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;
        #include <common>
        #include <skinning_pars_vertex>

        void main() {
            #include <skinning_vertex>
            #include <begin_vertex>
            #include <project_vertex>

            vNormal = normalize(normalMatrix * normal);
            vUv = uv;
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
        }
    `,

    fragmentShader: `
        uniform vec3 uColor;
        uniform float uTones;
        uniform float uHalftone;
        uniform float uPointillism;

        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;

        #include <common>
        #include <lights_pars_begin>

        void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);

            // Standard N dot L lighting
            float dotNL = 0.0;
            if (directionalLights.length() > 0) {
                dotNL = dot(normal, directionalLights[0].direction);
            }
            float lightIntensity = smoothstep(0.0, 0.01, dotNL);

            // Quantize light intensity for cel-shading
            if (uTones > 1.0) {
                lightIntensity = floor(lightIntensity * uTones) / (uTones - 1.0);
            }

            vec3 finalColor = uColor * lightIntensity;

            // Painterly Effect: Halftone
            if (uHalftone > 0.0) {
                float size = 50.0;
                vec2 nearest = floor(gl_FragCoord.xy / size) * size;
                float dist = distance(gl_FragCoord.xy, nearest + size * 0.5);
                float radius = uHalftone * size * 0.5 * lightIntensity;
                if (dist > radius) finalColor *= 0.8;
            }

            // Painterly Effect: Pointillism
            if (uPointillism > 0.0) {
                float noise = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
                if (noise < uPointillism) finalColor *= 1.2;
                else finalColor *= 0.9;
            }

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
};

/**
 * Creates a Cel-Shaded Material
 * @param {object} params
 * @returns {THREE.ShaderMaterial}
 */
export function createCelMaterial(params = {}) {
    const material = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone(CelShader.uniforms),
        vertexShader: CelShader.vertexShader,
        fragmentShader: CelShader.fragmentShader,
        lights: true
    });

    if (params.color) material.uniforms.uColor.value.set(params.color);
    if (params.tones) material.uniforms.uTones.value = params.tones;

    return material;
}
