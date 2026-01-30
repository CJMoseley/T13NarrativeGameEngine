import { THREE } from 'enable3d';

export const WormholeShader = {
  uniforms: {
    u_time: { value: 0.0 },
    u_freqs: { value: new THREE.Vector4(300, 400, 150, 250) },
    u_env1: { value: new THREE.Vector4(15, 0.2, 600.0, 0.05) },
    u_noiseStrength: { value: 0.5 },
  },
  vertexShader: `
    uniform float u_time;
    uniform vec4 u_freqs;
    uniform vec4 u_env1;
    uniform float u_noiseStrength;


    varying vec3 v_color;
    varying float v_stripes;
    varying float v_ribs;

    float hash13(vec3 p3) {
        p3  = fract(p3 * .1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
    }

    float valueNoise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);

        return mix(
            mix(mix(hash13(i + vec3(0,0,0)), hash13(i + vec3(1,0,0)), f.x),
                mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x),
                mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z
        );
    }

    vec3 hue2rgb(float h) {
        float s = 1.0;
        float v = 1.0;
        float c = v * s;
        float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
        vec3 rgb;
        if (h < 1.0/6.0) rgb = vec3(c, x, 0.0);
        else if (h < 2.0/6.0) rgb = vec3(x, c, 0.0);
        else if (h < 3.0/6.0) rgb = vec3(0.0, c, x);
        else if (h < 4.0/6.0) rgb = vec3(0.0, x, c);
        else if (h < 5.0/6.0) rgb = vec3(x, 0.0, c);
        else rgb = vec3(c, 0.0, x);
        return rgb + (v - c);
    }

    void main() {
        float noiseScale = 0.05;
        float timeScale = 0.5;
        float raw = valueNoise(position * noiseScale + vec3(0.0, 0.0, u_time * timeScale));
        
        float radiusFactor = 1.0 + (raw - 0.5) * u_noiseStrength;
        float baseRadius = 40.0; 
        float radius = baseRadius * radiusFactor;

        vec3 displacedPosition = position + normal * (radius - length(position.xy));

        float hue = fract(0.6 + raw * 0.15);
        v_color = hue2rgb(hue);

        // Calculate motion stripes (axial rings)
        float stripeScale = 0.5;
        float stripeSpeed = 5.0;
        v_stripes = 0.5 + 0.5 * sin(position.z * stripeScale - u_time * stripeSpeed);
        
        // Calculate longitudinal "ribs"
        float angle = atan(position.y, position.x);
        float ribCount = 12.0;
        v_ribs = 0.5 + 0.5 * sin(angle * ribCount);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 v_color;
    varying float v_stripes;
    varying float v_ribs;

    void main() {
      // Create a pattern of bright energy stripes
      float pattern = pow(v_stripes, 8.0) * 0.8; // Sharp scrolling rings
      pattern += pow(v_ribs, 4.0) * 0.2; // Softer longitudinal ribs
      
      vec3 finalColor = mix(v_color, vec3(0.0, 0.8, 1.0), pattern);
      
      // Add "energy" glow to the stripes
      finalColor += vec3(0.0, 0.4, 0.8) * pattern;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};
