/* LEGACY CODE - MOVED TO src/t13ne/core/

import * as THREE from 'three';

export const racingLiveryShader = {
    uniforms: {
        time: { value: 0 },
        opacity: { value: 1.0 },
        color1: { value: new THREE.Color(0xd40000) }, // Racing Red
        color2: { value: new THREE.Color(0xffffff) }, // White Stripe
        color3: { value: new THREE.Color(0x111111) },  // Carbon/Black Detail
        noiseSeed: { value: Math.random() * 100 },
        patternType: { value: 0 } // 0: Stripe, 1: Camo, 2: Checker
    },
    vertexShader: `
        varying vec3 vPos;
        varying vec3 vNormal;
        void main() {
            vPos = position;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vPos;
        varying vec3 vNormal;
        uniform float time;
        uniform float opacity;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        uniform float noiseSeed;
        uniform int patternType;

        float rand(vec2 co){
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            // Local coordinates
            float x = vPos.x;
            float y = vPos.y;
            float z = vPos.z;

            // Base body color
            vec3 color = color1;

            if (patternType == 0) {
                // 1. Central Racing Stripe (White)
                // Width 1.0 centered on 0
                float stripeWidth = 0.6;
                float edge = 0.05;
                float centerStripe = smoothstep(stripeWidth + edge, stripeWidth, abs(x));
                
                // 2. Pin stripes bordering the center (Black)
                float pinWidth = 0.1;
                float pinPos = stripeWidth + pinWidth;
                float pinStripe = smoothstep(pinPos + edge, pinPos, abs(x)) - smoothstep(stripeWidth + edge, stripeWidth, abs(x));

                // Apply stripes
                color = mix(color, color3, pinStripe); // Apply black pin stripes
                color = mix(color, color2, centerStripe); // Apply white center stripe
            } else if (patternType == 1) {
                // Camo / Noise
                float n = rand(floor(vPos.xz * 2.0 + noiseSeed));
                if (n > 0.5) color = color2;
                if (n > 0.8) color = color3;
            } else if (patternType == 2) {
                // Checker
                float c = mod(floor(x * 2.0) + floor(z * 2.0), 2.0);
                if (c < 0.5) color = color2;
            }

            // 3. "Sponsor" or Decal areas (Procedural shapes)
            // Circle on the wing/side?
            // Let's put a number circle on the side fuselage
            // Fuselage is roughly x +/- 1.5, z 0
            float circleDist = distance(vec2(abs(x), z), vec2(1.5, 0.0));
            float circle = 1.0 - smoothstep(0.6, 0.65, circleDist);
            // Only apply if on top/side (y > 0)
            if (y > 0.0) {
                color = mix(color, color2, circle);
            }
            
            // Simple lighting
            vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
            float diff = max(dot(vNormal, lightDir), 0.0);
            
            // Specular (Glossy clear coat)
            vec3 viewDir = vec3(0.0, 0.0, 1.0); // Approximate view from front/top
            vec3 reflectDir = reflect(-lightDir, vNormal);
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), 64.0);

            // Rim lighting (Fresnel)
            float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
            rim = pow(rim, 3.0);

            // Combine
            vec3 finalColor = color * (diff * 0.7 + 0.3);
            finalColor += vec3(1.0) * spec * 0.8; // White specular highlight
            finalColor += color * rim * 0.5; // Rim glow

            // Animation: "Showroom Shine"
            // A band of light moving across the ship
            float shineSpeed = 5.0;
            float shinePos = mod(time * shineSpeed, 30.0) - 15.0; // Sweep from back to front
            float shineWidth = 1.5;
            float shine = smoothstep(shinePos - shineWidth, shinePos, z) - smoothstep(shinePos, shinePos + shineWidth, z);
            shine = max(0.0, shine);
            finalColor += vec3(1.0) * shine * 0.4;
            
            gl_FragColor = vec4(finalColor, opacity);
        }
    `
};

*/