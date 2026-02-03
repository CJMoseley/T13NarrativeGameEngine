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

export const industrialLiveryShader = {
    uniforms: {
        time: { value: 0 },
        opacity: { value: 1.0 },
        baseColor: { value: new THREE.Color(0x888888) },
        noiseSeed: { value: Math.random() * 100 },
        scale: { value: 1.0 }
    },
    vertexShader: `
        varying vec3 vPos;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        
        void main() {
            vPos = position;
            vNormal = normalize(normalMatrix * normal);
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            vUv = uv;
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
    `,
    fragmentShader: `
        varying vec3 vPos;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        uniform vec3 baseColor;
        uniform float noiseSeed;

        // --- Noise Functions ---
        float hash(float n) { return fract(sin(n) * 1e4); }
        float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }

        float noise(vec2 x) {
            vec2 i = floor(x);
            vec2 f = fract(x);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        float fbm(vec2 x) {
            float v = 0.0;
            float a = 0.5;
            vec2 shift = vec2(100.0);
            mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
            for (int i = 0; i < 5; ++i) {
                v += a * noise(x);
                x = rot * x * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }

        // Voronoi for panels: returns vec3(minDist, cellID, distanceToEdge)
        vec3 voronoi(in vec2 x) {
            vec2 n = floor(x);
            vec2 f = fract(x);
            vec2 mg, mr;
            float md = 8.0;
            for (int j = -1; j <= 1; j++) {
                for (int i = -1; i <= 1; i++) {
                    vec2 g = vec2(float(i), float(j));
                    vec2 o = vec2(hash(n + g), hash(n + g + vec2(13.0))); 
                    vec2 r = g + o - f;
                    float d = dot(r, r);
                    if (d < md) {
                        md = d;
                        mr = r;
                        mg = g;
                    }
                }
            }
            
            // Second pass for distance to edge
            float md2 = 8.0;
            for (int j = -1; j <= 1; j++) {
                for (int i = -1; i <= 1; i++) {
                    vec2 g = vec2(float(i), float(j));
                    vec2 o = vec2(hash(n + g), hash(n + g + vec2(13.0)));
                    vec2 r = g + o - f;
                    if (dot(mr - r, mr - r) > 0.00001) {
                        md2 = min(md2, dot(0.5 * (mr + r), normalize(r - mr)));
                    }
                }
            }
            return vec3(md, hash(n + mg), md2);
        }

        void main() {
            // Triplanar mapping to avoid UV seams on procedural geometry
            vec3 blend = abs(vNormal);
            blend /= dot(blend, vec3(1.0));
            
            // Scale for panels
            float panelScale = 0.3; // Slightly larger panels to reduce visual noise
            vec3 vX = voronoi(vPos.yz * panelScale + noiseSeed);
            vec3 vY = voronoi(vPos.xz * panelScale + noiseSeed + 10.0);
            vec3 vZ = voronoi(vPos.xy * panelScale + noiseSeed + 20.0);
            
            // Blend voronoi results
            vec3 vor = vX * blend.x + vY * blend.y + vZ * blend.z;
            float distToEdge = vor.z;
            float cellID = vor.y;

            // 1. Metalness (Stepped Noise)
            // Use cellID to vary material slightly per panel
            float panelMetal = 0.8 + 0.2 * hash(cellID * 10.0);
            // Paint mask: High contrast noise
            float paintNoise = fbm(vPos.xy * 0.15); // Lower frequency for larger paint patches
            float isPainted = step(0.6, paintNoise); 
            float metalness = mix(panelMetal, 0.0, isPainted); // 0.0 is painted, 1.0 is metal

            // 2. Roughness (Storyteller)
            float baseRough = 0.4 + 0.3 * hash(cellID * 20.0);
            // Scratches: Stretched noise
            float scratchNoise = noise(vec2(vPos.x * 1.0, vPos.y * 20.0)); // Reduced stretch frequency
            float roughness = baseRough + 0.2 * scratchNoise;
            if (isPainted > 0.5) roughness = 0.8; // Paint is rougher

            // 3. Occlusion (Depth)
            // Darken edges of panels
            float panelEdge = smoothstep(0.02, 0.05, distToEdge);
            float occlusion = panelEdge;
            
            // Rust/Grime (Musgrave-ish via FBM)
            float rust = fbm(vPos.xy * 1.0 + noiseSeed); // Reduced frequency
            rust = smoothstep(0.4, 0.8, rust);
            
            // 4. Color
            vec3 finalColor = baseColor;
            // Vary panel color slightly
            finalColor *= (0.9 + 0.2 * hash(cellID));
            
            // Apply paint color (e.g., orange/white industrial)
            vec3 paintColor = vec3(0.9, 0.4, 0.1); // Industrial Orange
            if (hash(cellID) > 0.8) paintColor = vec3(0.9, 0.9, 0.9); // Some white panels
            finalColor = mix(finalColor, paintColor, isPainted);

            // Apply Rust
            vec3 rustColor = vec3(0.35, 0.25, 0.2); // Desaturated rust to reduce orange glare
            finalColor = mix(finalColor, rustColor, rust * 0.8);
            roughness = mix(roughness, 1.0, rust);
            metalness = mix(metalness, 0.0, rust);

            // 5. Normal/Bump (Rivets)
            // Simple fake lighting based on normal
            vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
            float NdotL = max(dot(vNormal, lightDir), 0.0);
            
            // Rivets at corners (where distToEdge is small but not too small?)
            // Simplified: just use voronoi centers or corners
            // Actually, let's just use the panel edge for a bevel highlight
            float edgeHighlight = 1.0 - smoothstep(0.0, 0.02, distToEdge);
            
            vec3 lighting = vec3(0.1) + vec3(1.0) * NdotL; // Ambient + Diffuse
            
            // Specular
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            vec3 halfDir = normalize(lightDir + viewDir);
            float NdotH = max(dot(vNormal, halfDir), 0.0);
            float spec = pow(NdotH, (1.0 - roughness) * 128.0) * metalness;

            gl_FragColor = vec4(finalColor * lighting * occlusion + vec3(spec), 1.0);
        }
    `
};
