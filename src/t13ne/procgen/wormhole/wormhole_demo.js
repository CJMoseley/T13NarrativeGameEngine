import * as THREE from 'three';

// --- CONFIGURATION & SAFETY CONSTANTS ---
const CONFIG = {
    tubeRadius: 15,
    maxVibe: 6.0,          // Absolute safety buffer for vibrations
    trackLength: 4000,     // 4 Kilometres total
    resolution: 1500,      // Mesh density for smooth wobbles
    safetyBuffer: 50       // Min spacing between loops to prevent intersection
};

class IntegratedWormhole {
    constructor(scene) {
        this.clock = new THREE.Clock();
        this.ship = { progress: 0, angle: 0, frequency: 440, grip: 1.0 };
        this.init(scene);
    }

    // --- SHARED MATH KERNEL: The Spine & Path Logic ---
    // This function defines the "DNA" of every section. 
    // Both CPU (Physics) and GPU (Shader) use this exact logic.
    getSpinePoint(t) {
        let x = 0, y = 0, z = t * CONFIG.trackLength;
        const localT = t * 10.0; // Scaled for higher frequency math

        if (t < 0.2) { // SECTION 1: THE CHUTE (Corkscrew)
            x = Math.cos(localT * 4.0) * 30.0;
            y = Math.sin(localT * 4.0) * 30.0;
        } 
        else if (t < 0.4) { // SECTION 2: THE CALDERA (Large Swells)
            x = Math.cos(localT) * 70.0;
            y = Math.sin(localT * 1.5) * 70.0;
        }
        else if (t < 0.6) { // SECTION 3: THE KINK (Gravitational Bow)
            const bow = Math.exp(-Math.pow(t - 0.5, 2.0) * 200.0);
            x = 200.0 * bow; y = 50.0 * bow;
        }
        else if (t < 0.8) { // SECTION 4: THE EVENT LOOP (Slingshot)
            const loopT = (t - 0.6) * 40.0;
            x = Math.cos(loopT) * 120.0;
            y = Math.sin(loopT) * 120.0;
            z -= (t - 0.6) * 1000.0; // Slow down Z to compress the loop
        }
        else { // SECTION 5: THE SHUDDER (Unstable Straight)
            x = Math.sin(localT * 20.0) * 1.5;
            y = Math.cos(localT * 20.0) * 1.5;
        }
        return new THREE.Vector3(x, y, z);
    }

    // --- CPU PHYSICS: THE VECTOR FIELD ---
    // Ships use this to calculate "Wall Grip" and "Dark Energy" forces.
    getVectorField(shipPos, time) {
        const t = Math.max(0, Math.min(1, shipPos.z / CONFIG.trackLength));
        const spine = this.getSpinePoint(t);
        
        // Dark Energy Repulsion (Ribbon Force)
        const toShip = new THREE.Vector3().subVectors(shipPos, spine);
        const distFromSpine = toShip.length();
        const repulsion = toShip.normalize().multiplyScalar(1.0 / (distFromSpine + 1.0));

        // Resonance Grip: Friction is high if ship matches the 'vibe' frequency
        const wallVibe = Math.sin(t * 1000 + time) * 2.0; 
        const resonance = Math.abs(Math.sin(this.ship.frequency * 0.01 + wallVibe));

        return { 
            repulsion, 
            grip: resonance, 
            wallDist: CONFIG.tubeRadius + wallVibe 
        };
    }

    init(scene) {
        // 1. GENERATE THE GEOMETRY
        // A straight cylinder that we "Bend" in the shader using our Spine Math
        const geometry = new THREE.CylinderGeometry(CONFIG.tubeRadius, CONFIG.tubeRadius, CONFIG.trackLength, 64, CONFIG.resolution, true);
        geometry.rotateX(Math.PI / 2);
        geometry.translate(0, 0, CONFIG.trackLength / 2);

        this.material = new THREE.ShaderMaterial({
            uniforms: { 
                uTime: { value: 0 }, 
                uShipZ: { value: 0 },
                uShipFreq: { value: 440.0 }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uShipZ;
                uniform float uShipFreq;
                varying float vVibe;
                varying float vRes;
                varying vec2 vUv;

                // SHARED MATH: REPLICATED SPINE LOGIC
                vec3 getSpine(float t) {
                    float x = 0.0; float y = 0.0; float z = t * ${CONFIG.trackLength.toFixed(1)};
                    float localT = t * 10.0;
                    if (t < 0.2) { x = cos(localT * 4.0) * 30.0; y = sin(localT * 4.0) * 30.0; }
                    else if (t < 0.4) { x = cos(localT) * 70.0; y = sin(localT * 1.5) * 70.0; }
                    else if (t < 0.6) { float bow = exp(-pow(t - 0.5, 2.0) * 200.0); x = 200.0 * bow; y = 50.0 * bow; }
                    else if (t < 0.8) { float lt = (t - 0.6) * 40.0; x = cos(lt) * 120.0; y = sin(lt) * 120.0; z -= (t - 0.6) * 1000.0; }
                    else { x = sin(localT * 20.0) * 1.5; y = cos(localT * 20.0) * 1.5; }
                    return vec3(x, y, z);
                }

                void main() {
                    vUv = uv;
                    float t = uv.y;
                    vec3 spine = getSpine(t);
                    
                    // 3-OCTAVE VIBRATION (Swell, Ripple, Chatter)
                    float angle = atan(position.y, position.x);
                    float swell = sin(t * 20.0 + uTime * 0.5) * 3.5;
                    float ripple = sin(angle * 4.0 - uTime * 3.0) * 1.8;
                    float chatter = sin(t * 1000.0 + uTime * 15.0) * 0.5;
                    
                    float totalVibe = clamp(swell + ripple + chatter, -${CONFIG.maxVibe.toFixed(1)}, ${CONFIG.maxVibe.toFixed(1)});
                    
                    // RESONANCE: Lock-in effect near the ship
                    float distToShip = abs(t - uShipZ);
                    float resonance = sin(uShipFreq * 0.01 + totalVibe) * smoothstep(0.05, 0.0, distToShip);
                    vRes = resonance;

                    // Apply deformation and move to spine
                    vec3 pos = position;
                    pos.xy *= (1.0 + (totalVibe + resonance * 2.0) / ${CONFIG.tubeRadius.toFixed(1)});
                    pos += spine;

                    vVibe = totalVibe;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying float vVibe;
                varying float vRes;
                varying vec2 vUv;
                void main() {
                    vec3 base = vec3(0.02, 0.0, 0.1);
                    vec3 resonanceColor = mix(vec3(0.0, 0.8, 1.0), vec3(1.0, 0.1, 0.5), abs(vRes));
                    float scan = sin(vUv.y * 1000.0) * 0.1 + 0.9;
                    gl_FragColor = vec4(base + resonanceColor * (0.5 + vVibe * 0.1) * scan, 0.85);
                }
            `,
            transparent: true, side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        scene.add(this.mesh);
    }

    update() {
        const time = this.clock.getElapsedTime();
        this.material.uniforms.uTime.value = time;
        
        // Ship Logic: Rolling down the track
        this.ship.progress += 0.0005; // Advance along spline
        this.material.uniforms.uShipZ.value = this.ship.progress;
    }
}
export default IntegratedWormhole;