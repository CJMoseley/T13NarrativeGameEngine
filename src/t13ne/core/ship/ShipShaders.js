import * as THREE from 'three';

export const racingLiveryShader = {
    uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.lights,
        {
            time: { value: 0 },
            opacity: { value: 1.0 },
            color1: { value: new THREE.Color(0xd40000) }, // Racing Red
            color2: { value: new THREE.Color(0xffffff) }, // White Stripe
            color3: { value: new THREE.Color(0x333333) },  // Dark Grey Detail (Lighter than black)
            noiseSeed: { value: Math.random() * 100 },
            patternType: { value: 0 } // 0: Stripe, 1: Camo, 2: Checker
        }
    ]),
    vertexShader: `
        varying vec3 vPos;
        varying vec3 vNormal;
        void main() {
            vPos = position;
            vNormal = normalize( mat3( modelMatrix ) * normal ); // Use world normal
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        #include <common>
        #include <lights_pars_begin>
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
            
            // Cell Shading Lighting
            vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
            #if NUM_DIR_LIGHTS > 0
                lightDir = normalize(directionalLights[0].direction);
            #endif
            float NdotL = max(dot(vNormal, lightDir), 0.0);
            
            float levels = 3.0;
            float diffuse = floor(NdotL * levels + 0.5) / levels;
            vec3 lighting = vec3(0.5) + vec3(0.5) * diffuse; // Ambient + Diffuse
            
            // Specular (Glossy clear coat)
            vec3 viewDir = vec3(0.0, 0.0, 1.0); // Approximate view from front/top
            vec3 reflectDir = reflect(-lightDir, vNormal);
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0) * 0.5; // Quantized spec? No, keep smooth for gloss

            // Combine
            vec3 finalColor = color * lighting + vec3(spec);

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

export const industrialLiveryShader = {
    uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.lights,
        {
            time: { value: 0 },
            opacity: { value: 1.0 },
            baseColor: { value: new THREE.Color(0x667788) }, // Blue-ish grey
            noiseSeed: { value: Math.random() * 100 },
            scale: { value: 1.0 }
        }
    ]),
    vertexShader: `
        varying vec3 vPos;
        varying vec3 vNormal;
        varying vec3 vObjectNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        
        void main() {
            vPos = position;
            vNormal = normalize( mat3( modelMatrix ) * normal ); // Pass world normal
            vObjectNormal = normalize(normal); // Object space normal for triplanar
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            vUv = uv;
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
    `,
    fragmentShader: `
        #include <common>
        #include <lights_pars_begin>
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        uniform vec3 baseColor;
        uniform float opacity;

        void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
            #if NUM_DIR_LIGHTS > 0
                lightDir = normalize(directionalLights[0].direction);
            #endif

            float NdotL = max(dot(normal, lightDir), 0.0);
            
            // Cell Shading
            float levels = 4.0;
            float diffuse = floor(NdotL * levels + 0.5) / levels;
            vec3 lighting = vec3(0.4) + vec3(0.6) * diffuse;
            
            vec3 halfDir = normalize(lightDir + viewDir);
            float NdotH = max(dot(normal, halfDir), 0.0);
            float spec = pow(NdotH, 32.0) * 0.2;

            gl_FragColor = vec4(baseColor * lighting + vec3(spec), opacity);
        }
    `
};

export const boxyLiveryShader = {
    uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.lights,
        {
            time: { value: 0 },
            opacity: { value: 1.0 },
            baseColor: { value: new THREE.Color(0x667788) },
            noiseSeed: { value: Math.random() * 100 },
            scale: { value: 1.0 }
        }
    ]),
    vertexShader: industrialLiveryShader.vertexShader, // Reuse vertex shader
    fragmentShader: `
        #include <common>
        #include <lights_pars_begin>
        varying vec3 vNormal;
        uniform vec3 baseColor;
        uniform float opacity;

        void main() {
            vec3 normal = normalize(vNormal);
            vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
            #if NUM_DIR_LIGHTS > 0
                lightDir = normalize(directionalLights[0].direction);
            #endif
            
            float NdotL = max(dot(normal, lightDir), 0.0);
            
            // Cell Shading
            float levels = 3.0;
            float diffuse = floor(NdotL * levels + 0.5) / levels;
            vec3 lighting = vec3(0.5) + vec3(0.5) * diffuse;

            gl_FragColor = vec4(baseColor * lighting, opacity);
        }
    `
};

export const organicLiveryShader = {
    uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.lights,
        {
            time: { value: 0 },
            opacity: { value: 1.0 },
            baseColor: { value: new THREE.Color(0x88aa88) }, // Organic Green/Grey
            noiseSeed: { value: Math.random() * 100 },
            scale: { value: 1.0 }
        }
    ]),
    vertexShader: `
        varying vec3 vPos;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
            vPos = position;
            vNormal = normalize( mat3( modelMatrix ) * normal );
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        #include <common>
        #include <lights_pars_begin>
        varying vec3 vPos;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        uniform vec3 baseColor;
        uniform float noiseSeed;
        uniform float opacity;

        // Simple 3D Noise
        float hash(vec3 p) {
            p = fract(p * 0.3183099 + .1);
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise(vec3 x) {
            vec3 i = floor(x);
            vec3 f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                           mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                       mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                           mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
        }

        void main() {
            vec3 normal = normalize(vNormal);
            
            // Organic Texture (Cellular/Veiny)
            float n = noise(vPos * 0.5 + noiseSeed);
            float n2 = noise(vPos * 2.0 + noiseSeed);
            
            vec3 col = baseColor;
            col = mix(col, col * 0.8, n * 0.5); // Base variation
            col = mix(col, col * 1.2, n2 * 0.2); // Detail

            // Cell Shading
            vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
            #if NUM_DIR_LIGHTS > 0
                lightDir = normalize(directionalLights[0].direction);
            #endif
            float NdotL = max(dot(normal, lightDir), 0.0);
            float levels = 3.0;
            float diffuse = floor(NdotL * levels + 0.5) / levels;
            vec3 lighting = vec3(0.4) + vec3(0.6) * diffuse; // High ambient for organic

            // Rim Light (Subsurface scattering fake)
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            float rim = 1.0 - max(dot(viewDir, normal), 0.0);
            rim = smoothstep(0.6, 1.0, rim);
            vec3 rimColor = baseColor * 1.5; // Glowing edge

            // Specular (Wet look)
            vec3 halfDir = normalize(lightDir + viewDir);
            float NdotH = max(dot(normal, halfDir), 0.0);
            float spec = pow(NdotH, 32.0) * 0.5; // Broad, wet highlight

            gl_FragColor = vec4((col * lighting) + (rimColor * rim * 0.5) + vec3(spec), opacity);
        }
    `
};

export const miningLiveryShader = {
    uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.lights,
        {
            time: { value: 0 },
            opacity: { value: 1.0 },
            baseColor: { value: new THREE.Color(0x8B4513) }, // Rust/Brown default
            secondaryColor: { value: new THREE.Color(0x5F7F7F) }, // Lighter Slate
            noiseSeed: { value: Math.random() * 100 },
            scale: { value: 1.0 }
        }
    ]),
    vertexShader: industrialLiveryShader.vertexShader,
    fragmentShader: `
        #include <common>
        #include <lights_pars_begin>
        varying vec3 vPos;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        uniform vec3 baseColor;
        uniform vec3 secondaryColor;
        uniform float noiseSeed;
        uniform float opacity;

        float hash(vec3 p) {
            p = fract(p * 0.3183099 + .1);
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        void main() {
            vec3 normal = normalize(vNormal);
            vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
            #if NUM_DIR_LIGHTS > 0
                lightDir = normalize(directionalLights[0].direction);
            #endif

            // Grime and Rust Noise
            float n = hash(floor(vPos * 2.0 + noiseSeed));
            float dirt = hash(vPos * 5.0 + noiseSeed);
            
            vec3 col = baseColor;
            
            // Hazard Stripes or Industrial Blocks
            if (n > 0.7) col = secondaryColor;
            if (n > 0.9) col = vec3(0.8, 0.6, 0.1); // Safety Yellow/Orange patches

            // Heavy Wear
            float wear = smoothstep(0.4, 0.8, dirt);
            col = mix(col, vec3(0.2), wear * 0.8); // Grime
            
            // Lighting (Rough, Matte)
            float NdotL = max(dot(normal, lightDir), 0.0);
            float levels = 3.0;
            float diffuse = floor(NdotL * levels + 0.5) / levels;
            vec3 lighting = vec3(0.3) + vec3(0.7) * diffuse;

            gl_FragColor = vec4(col * lighting, opacity);
        }
    `
};

export const metallicLiveryShader = {
    uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.lights,
        {
            time: { value: 0 },
            opacity: { value: 1.0 },
            baseColor: { value: new THREE.Color(0xCCCCCC) }, // Silver/Chrome
            roughness: { value: 0.3 },
            metalness: { value: 1.0 },
            noiseSeed: { value: Math.random() * 100 },
            scale: { value: 1.0 }
        }
    ]),
    vertexShader: industrialLiveryShader.vertexShader,
    fragmentShader: `
        #include <common>
        #include <lights_pars_begin>
        varying vec3 vPos;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        uniform vec3 baseColor;
        uniform float roughness;
        uniform float metalness;
        uniform float noiseSeed;
        uniform float opacity;

        float hash(vec3 p) {
            p = fract(p * 0.3183099 + .1);
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
            #if NUM_DIR_LIGHTS > 0
                lightDir = normalize(directionalLights[0].direction);
            #endif

            // Panel variation in shininess
            float panel = hash(floor(vPos * 0.5 + noiseSeed));
            float localRough = roughness + (panel * 0.2);
            
            // Lighting
            float NdotL = max(dot(normal, lightDir), 0.0);
            
            // Specular (High for metallic)
            vec3 halfDir = normalize(lightDir + viewDir);
            float NdotH = max(dot(normal, halfDir), 0.0);
            float spec = pow(NdotH, (1.0 - localRough) * 128.0) * metalness;

            // Reflection approximation (Environment map would be better, but simple rim for now)
            float rim = 1.0 - max(dot(viewDir, normal), 0.0);
            vec3 reflection = baseColor * pow(rim, 2.0) * 0.5;

            vec3 finalColor = baseColor * (0.2 + 0.8 * NdotL) + vec3(spec) + reflection;
            gl_FragColor = vec4(finalColor, opacity);
        }
    `
};
