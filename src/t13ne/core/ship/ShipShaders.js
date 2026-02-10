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
        varying vec3 vObjectNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        
        void main() {
            vPos = position;
            vNormal = normalize(normalMatrix * normal);
            vObjectNormal = normalize(normal); // Object space normal for triplanar
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            vUv = uv;
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
    `,
    fragmentShader: `
        varying vec3 vPos;
        varying vec3 vNormal;
        varying vec3 vObjectNormal;
        varying vec3 vWorldPosition;
        uniform vec3 baseColor;
        uniform float noiseSeed;

        // --- Noise Functions ---
        // Replaced unstable hash with standard pseudo-random hash to prevent flickering
        float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
        }
        float hash(float n) { return fract(sin(n) * 43758.5453123); }

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

        // Antialiased step function for procedural lines
        float aastep(float threshold, float value) {
            float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678;
            return smoothstep(threshold - afwidth, threshold + afwidth, value);
        }

        void main() {
            // Triplanar mapping to avoid UV seams on procedural geometry
            // Use Object Normal to ensure texture sticks to ship during rotation
            vec3 blend = abs(vObjectNormal);
            blend /= dot(blend, vec3(1.0));
            
            // Scale for panels
            float panelScale = 0.02; // Large panels (50 units) to prevent moire
            
            // Simple Grid Noise instead of Voronoi/FBM to eliminate moire
            // Use World Position for continuous pattern across components
            vec3 p = vWorldPosition * panelScale;
            vec3 cell = floor(p + 0.001); // Offset to avoid 0 artifacts
            vec3 local = fract(p + 0.001);
            
            // Distance to edge (Manhattan-ish for boxy look)
            vec3 d = min(local, 1.0 - local);
            float distToEdge = min(min(d.x, d.y), d.z);
            
            float cellID = hash(cell.xy) + hash(cell.yz) + hash(cell.zx);

            // 1. Metalness (Stepped Noise)
            float baseMetal = 0.1;
            float shinyMetal = 0.7;
            
            float metalness = baseMetal + (shinyMetal - baseMetal) * step(0.8, hash(cellID));
            float roughness = 0.7 - 0.3 * metalness;

            // 3. Occlusion (Depth)
            // Darken edges of panels
            // Use aastep for stable, non-flickering edges
            float occlusion = aastep(0.03, distToEdge);
            
            // Rust/Grime (Musgrave-ish via FBM)
            // Triplanar rust to ensure it paints the surface correctly
            // Simplified rust noise
            float rustNoise = noise(vWorldPosition.xy * 0.01 + noiseSeed);
            float rust = smoothstep(0.6, 0.8, rustNoise);

            // 4. Color
            vec3 finalColor = baseColor;
            // Vary panel color slightly
            finalColor *= (0.9 + 0.2 * hash(cellID));
            
            // Industrial colors (Grey/Orange)
            vec3 accentColor = vec3(0.7, 0.7, 0.75); // Neutral Grey/White Accent (No Orange)
            if (hash(cellID + 1.0) > 0.85) finalColor = accentColor; // Occasional accent panel

            // Apply Rust
            vec3 rustColor = vec3(0.3, 0.35, 0.4); // Blue-ish oxidation/grime
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
            float edgeHighlight = 1.0 - aastep(0.01, distToEdge);
            
            vec3 lighting = vec3(0.1) + vec3(1.0) * NdotL; // Ambient + Diffuse
            // Cell Shading (Quantize lighting) to reduce flicker
            float levels = 3.0;
            lighting = floor(lighting * levels) / levels;

            // Specular
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            vec3 halfDir = normalize(lightDir + viewDir);
            float NdotH = max(dot(vNormal, halfDir), 0.0);
            float spec = pow(NdotH, (1.0 - roughness) * 128.0) * metalness;

            gl_FragColor = vec4(finalColor * lighting * occlusion + vec3(spec), 1.0);
        }
    `
};

export const boxyLiveryShader = {
    uniforms: {
        time: { value: 0 },
        opacity: { value: 1.0 },
        baseColor: { value: new THREE.Color(0x667788) },
        noiseSeed: { value: Math.random() * 100 },
        scale: { value: 1.0 }
    },
    vertexShader: industrialLiveryShader.vertexShader, // Reuse vertex shader
    fragmentShader: `
        varying vec3 vPos;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        uniform vec3 baseColor;
        uniform float noiseSeed;

        float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
        }

        float rectNoise(vec2 p, float scale) {
            vec2 grid = floor(p * scale);
            return hash(grid + noiseSeed);
        }

        // Antialiased step function for procedural lines
        float aastep(float threshold, float value) {
            float afwidth = fwidth(value) * 0.5;
            return smoothstep(threshold - afwidth, threshold + afwidth, value);
        }

        void main() {
            // Triplanar blending
            vec3 blend = abs(vNormal);
            blend /= dot(blend, vec3(1.0));

            // Generate overlapping rectangle patterns
            float scale1 = 0.5;
            float scale2 = 1.2;
            
            // Layer 1: Large blocks
            float nX1 = rectNoise(vPos.yz, scale1);
            float nY1 = rectNoise(vPos.xz, scale1);
            float nZ1 = rectNoise(vPos.xy, scale1);
            float layer1 = nX1 * blend.x + nY1 * blend.y + nZ1 * blend.z;

            // Layer 2: Small details
            float nX2 = rectNoise(vPos.yz + 10.0, scale2);
            float nY2 = rectNoise(vPos.xz + 10.0, scale2);
            float nZ2 = rectNoise(vPos.xy + 10.0, scale2);
            float layer2 = nX2 * blend.x + nY2 * blend.y + nZ2 * blend.z;

            // Combine for greyscale variation
            float pattern = mix(layer1, layer2, 0.4);
            
            // Color mapping
            vec3 col = baseColor * (0.6 + 0.8 * pattern);
            
            // Panel lines (edges of grid)
            vec2 gridUV = fract(vPos.xy * scale1); // Simplified edge check
            // Better edge check using triplanar
            float edgeX = aastep(0.95, fract(vPos.y * scale1)) + aastep(0.95, fract(vPos.z * scale1));
            float edgeY = aastep(0.95, fract(vPos.x * scale1)) + aastep(0.95, fract(vPos.z * scale1));
            float edgeZ = aastep(0.95, fract(vPos.x * scale1)) + aastep(0.95, fract(vPos.y * scale1));
            float isEdge = max(edgeX * blend.x, max(edgeY * blend.y, edgeZ * blend.z));
            
            col = mix(col, col * 0.5, aastep(0.5, isEdge));

            // Lighting
            vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
            float NdotL = max(dot(vNormal, lightDir), 0.0);
            vec3 lighting = vec3(0.2) + vec3(0.8) * NdotL;

            gl_FragColor = vec4(col * lighting, 1.0);
        }
    `
};
