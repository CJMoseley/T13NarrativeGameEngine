/**
 * Wormhole Racers Rendering Engine (GPU-Optimized)
 * Source: [Documentation Sections: Graphics Requirements, Wormhole Visualization, 12D Perlin Noise]
 * Purpose: Manages the 3D scene, camera, and translates the 12D Perlin Noise
 * into a localized, visible 3D wormhole mesh using GPU shaders (GLSL/WGSL).
 * Requirement: Must use a GPU to handle the 12D noise sampling in real-time. Visualization
 * must reflect the component and galactic frequencies via ColourUtils.
 *
 * this is almost certianly incorrect and does not do what was asked for.
 * the wormhole rendering engine is meant to create a 3d model of the wormhole based on the ship conponents and a rotated corsssection of some of the 12D perlin noise
 * the wormhole is meant to be a dynamic moving tunnel, vibrating across its entire length like a guitar string, with a structure that reacts to the ship components and the galactic conditions,
 * not just a static tube with some noise applied to it. This all needs to be changed I suspect
 */
import { WormholeEnvironment } from '../procgen/system/WormholeEnvironment.js';
// PLACEHOLDER: import * as THREE from 'three'; // Placeholder for the eventual library

import Logger from '../Logger.js';
import { VectorMaths } from '../utils/VectorMaths.js';

// Minimal WebGL helper functions (matrix math)
const mat4 = {
    perspective: (out, fovy, aspect, near, far) => {
        const f = 1.0 / Math.tan(fovy / 2);
        out[0] = f / aspect;
        out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = (far + near) / (near - far); out[11] = -1;
        out[12] = 0; out[13] = 0; out[14] = (2 * far * near) / (near - far); out[15] = 0;
        return out;
    },
    lookAt: (out, eye, center, up) => {
        const z0 = eye[0] - center[0], z1 = eye[1] - center[1], z2 = eye[2] - center[2];
        let len = Math.hypot(z0, z1, z2) || 1;
        const zx = z0 / len, zy = z1 / len, zz = z2 / len;
        const ux = up[0], uy = up[1], uz = up[2];
        const xx = uy * zz - uz * zy, xy = uz * zx - ux * zz, xz = ux * zy - uy * zx;
        len = Math.hypot(xx, xy, xz) || 1;
        const rx = xx / len, ry = xy / len, rz = xz / len;
        const yx = zy * rx - zz * ry, yy = zz * rz - zx * rx, yz = zx * ry - zy * rz;
        out[0] = rx; out[1] = yx; out[2] = zx; out[3] = 0;
        out[4] = ry; out[5] = yy; out[6] = zy; out[7] = 0;
        out[8] = rz; out[9] = yz; out[10] = zz; out[11] = 0;
        out[12] = -(rx * eye[0] + ry * eye[1] + rz * eye[2]);
        out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
        out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
        out[15] = 1;
        return out;
    },
    multiply: (out, a, b) => {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                out[i * 4 + j] = 0;
                for (let k = 0; k < 4; k++) out[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
            }
        }
        return out;
    }
};

function compileShader(gl, type, source) {
    const funcName = 'compileShader';
    Logger.start(funcName);
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        Logger.message(`ERROR: Shader compile error: ${gl.getShaderInfoLog(s)}`);
        gl.deleteShader(s);
        return null;
    }
    Logger.end(funcName);
    return s;
}

function createProgram(gl, vsSrc, fsSrc) {
    const funcName = 'createProgram';
    Logger.start(funcName);
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        Logger.message(`ERROR: Program link error: ${gl.getProgramInfoLog(prog)}`);
        return null;
    }
    Logger.end(funcName);
    return prog;
}

export class Renderer {
    constructor(canvasElementId, gameEngine) {
        const funcName = 'Renderer.constructor';
        Logger.start(funcName);
        this.engine = gameEngine;
        this.canvas = document.getElementById(canvasElementId);
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {;
            Logger.message('WARN: WebGL not available - renderer will not run.');
            return;
        }

        this.mesh = null;
        this.lastEnvTime = -1;
        this.init();
        Logger.end(funcName);
    }

    init() {
        const funcName = 'Renderer.init';
        Logger.start(funcName);

        const gl = this.gl;
        // Simple vertex/fragment shaders
        // Vertex shader computes noise-based radius and color per-vertex using 12D inputs.
        // which isn't what was wanted and needs to be changed to actually do what was asked for.
        const vs = `
            precision mediump float;
            attribute vec3 a_center; // center-line position for this vertex
            attribute vec3 a_normal;
            attribute vec3 a_bitangent;
            attribute float a_angle; // ring angle
            uniform mat4 u_mvp;
            uniform float u_time;
            uniform vec4 u_freqs; // f1,f2,f3,f4
            uniform vec4 u_env1; // techLevel, criminality, localColourFreq, darkMatter
            varying vec3 v_color;

            // simple hash function
            float hash_vec(vec4 v) {
                return fract(sin(dot(v, vec4(12.9898,78.233,45.164,94.673))) * 43758.5453);
            }

            // A compact 12D-like noise approximator using several hash calls
            float noise12D(vec3 pos, float time, vec4 freqs, vec4 env) {
                // pack inputs into vec4s and combine several hashed samples
                vec4 p1 = vec4(pos, time) * 0.01;
                vec4 p2 = vec4(pos * 0.02, freqs.x * 0.001);
                vec4 p3 = vec4(freqs.y * 0.001, freqs.z * 0.001, freqs.w * 0.001, env.x * 0.01);
                vec4 p4 = vec4(env.y * 0.1, env.z * 0.001, env.w * 0.01, time * 0.05);

                float h1 = hash_vec(p1 + p3);
                float h2 = hash_vec(p2 + p4);
                float h3 = hash_vec(p1 + p4);
                float h4 = hash_vec(p2 + p3);

                // combine with smooth interpolation
                float n = (h1 + h2 * 0.8 + h3 * 0.6 + h4 * 0.4) / 2.8;
                // map to -1..1
                return n * 2.0 - 1.0;
            }

            // Convert hue to RGB (approx)
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
                float raw = noise12D(a_center, u_time, u_freqs, u_env1);
                float radiusFactor = 1.0 + raw * 0.5;
                float baseRadius = 20.0;
                float radius = baseRadius * radiusFactor;

                float ca = cos(a_angle);
                float sa = sin(a_angle);

                vec3 offset = a_normal * (ca * radius) + a_bitangent * (sa * radius);
                vec3 pos = a_center + offset;

                // Color derived from noise -> hue
                float hue = fract(0.6 + raw * 0.15);
                v_color = hue2rgb(hue);

                gl_Position = u_mvp * vec4(pos, 1.0);
            }
        `;

        const fs = `
            precision mediump float;
            varying vec3 v_color;
            void main(){ gl_FragColor = vec4(v_color,1.0); }
        `;
        this.program = createProgram(gl, vs, fs);
        gl.useProgram(this.program);

        this.a_center = gl.getAttribLocation(this.program, 'a_center');
        this.a_normal = gl.getAttribLocation(this.program, 'a_normal');
        this.a_bitangent = gl.getAttribLocation(this.program, 'a_bitangent');
        this.a_angle = gl.getAttribLocation(this.program, 'a_angle');
        this.u_mvp = gl.getUniformLocation(this.program, 'u_mvp');
        this.u_time = gl.getUniformLocation(this.program, 'u_time');
        this.u_freqs = gl.getUniformLocation(this.program, 'u_freqs');
        this.u_env1 = gl.getUniformLocation(this.program, 'u_env1');

        this.centerBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();
        this.bitangentBuffer = gl.createBuffer();
        this.angleBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();

        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.02, 0.02, 0.04, 1.0);
        Logger.end(funcName);
    }

    // Build a tubular mesh along the environment centerline, sampling complexity per segment
    buildMesh(environment, shipFreqs) {
        const funcName = 'Renderer.buildMesh';
        Logger.start(funcName);

        const start = environment.startPoint;
        const end = environment.destinationPoint;
        const segments = 128; // longitudinal subdivisions
        const sides = 12; // ring subdivisions

        const lineDir = VectorMaths.subtract(end, start);
        const lineLen = VectorMaths.magnitude(lineDir) || 1;
        const tangent = VectorMaths.scale(lineDir, 1 / lineLen);

        // pick arbitrary normal vector not parallel to tangent
        const up = Math.abs(tangent.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
        let normal = VectorMaths.cross(tangent, up);
        normal = VectorMaths.normalize(normal);
        let bitangent = VectorMaths.cross(tangent, normal);
        bitangent = VectorMaths.normalize(bitangent);

        const positions = [];
        const colors = [];
        const indices = [];

        // For GPU noise: we send per-vertex center, normal, bitangent and angle and let the
        // vertex shader compute the radius and color based on noise + uniforms.
        const centers = [];
        const normals = [];
        const bitangents = [];
        const angles = [];

        for (let i = 0; i < segments; i++) {
            const t = i / (segments - 1);
            const center = {
                x: start.x + lineDir.x * t,
                y: start.y + lineDir.y * t,
                z: start.z + lineDir.z * t
            };

            for (let j = 0; j < sides; j++) {
                const angle = (j / sides) * Math.PI * 2;
                centers.push(center.x, center.y, center.z);
                normals.push(normal.x, normal.y, normal.z);
                bitangents.push(bitangent.x, bitangent.y, bitangent.z);
                angles.push(angle);
            }
        }

        // build indices
        for (let i = 0; i < segments - 1; i++) {
            for (let j = 0; j < sides; j++) {
                const a = i * sides + j;
                const b = i * sides + ((j + 1) % sides);
                const c = (i + 1) * sides + j;
                const d = (i + 1) * sides + ((j + 1) % sides);
                // two triangles (a,c,b) and (b,c,d)
                indices.push(a, c, b);
                indices.push(b, c, d);
            }
        }

        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.centerBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(centers), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bitangentBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bitangents), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.angleBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(angles), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        // Use Uint32 if supported (most modern browsers). Fallback would require index packing.
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

        this.mesh = {
            vertexCount: indices.length,
            vertices: centers.length / 3
        };
        Logger.end(funcName);
    }

    render(ship, environment) {
        // No console logs here to avoid spamming the console on every frame.
        const gl = this.gl;
        if (!gl) return;

        // Rebuild mesh if environment has advanced (simple heuristic)
        if (!this.mesh || Math.abs(environment.globalTime - this.lastEnvTime) > 0.05) {
            const shipFreqs = (ship && ship.frequencies) ? ship.frequencies : { f1: 300, f2: 400, f3: 150, f4: 250 };
            this.buildMesh(environment, shipFreqs);
            this.lastEnvTime = environment.globalTime;
        }

        gl.viewport(0, 0, this.canvas.width = this.canvas.clientWidth, this.canvas.height = this.canvas.clientHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Setup camera
        const eye = ship && ship.physics ? [ship.physics.position.x - 60, ship.physics.position.y + 20, ship.physics.position.z - 60] : [0, 20, -60];
        const center = ship && ship.physics ? [ship.physics.position.x, ship.physics.position.y, ship.physics.position.z] : [0, 0, 0];
        const up = [0, 1, 0];

        const proj = new Float32Array(16);
        mat4.perspective(proj, Math.PI / 3, this.canvas.width / Math.max(1, this.canvas.height), 0.1, 10000);
        const view = new Float32Array(16);
        mat4.lookAt(view, eye, center, up);
        const mvp = new Float32Array(16);
        mat4.multiply(mvp, proj, view);

        gl.useProgram(this.program);

        // bind center
        gl.bindBuffer(gl.ARRAY_BUFFER, this.centerBuffer);
        gl.enableVertexAttribArray(this.a_center);
        gl.vertexAttribPointer(this.a_center, 3, gl.FLOAT, false, 0, 0);

        // bind normal
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.enableVertexAttribArray(this.a_normal);
        gl.vertexAttribPointer(this.a_normal, 3, gl.FLOAT, false, 0, 0);

        // bind bitangent
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bitangentBuffer);
        gl.enableVertexAttribArray(this.a_bitangent);
        gl.vertexAttribPointer(this.a_bitangent, 3, gl.FLOAT, false, 0, 0);

        // bind angle
        gl.bindBuffer(gl.ARRAY_BUFFER, this.angleBuffer);
        gl.enableVertexAttribArray(this.a_angle);
        gl.vertexAttribPointer(this.a_angle, 1, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.uniformMatrix4fv(this.u_mvp, false, mvp);
        // pass time and environment uniforms
        gl.uniform1f(this.u_time, environment.globalTime);
        const freqs = ship && ship.frequencies ? ship.frequencies : { f1: 300, f2: 400, f3: 150, f4: 250 };
        gl.uniform4f(this.u_freqs, freqs.f1, freqs.f2, freqs.f3, freqs.f4);
        const env = environment.galacticState || { techLevel: 15, criminality: 0.2, localColourFreq: 600.0, darkMatter: 0.05 };
        gl.uniform4f(this.u_env1, env.techLevel, env.criminality, env.localColourFreq, env.darkMatter);

        // Use 32-bit indices if supported; otherwise fallback (most browsers support Uint32)
        // Draw the tubular mesh
        // Use UNSIGNED_INT indices - requires support for OES_element_index_uint
        try {
            gl.drawElements(gl.TRIANGLES, this.mesh.vertexCount, gl.UNSIGNED_INT, 0);
        } catch (e) {
            // Fallback: if 32-bit indices aren't supported, try 16-bit (may fail if too many vertices)
            gl.drawElements(gl.TRIANGLES, this.mesh.vertexCount, gl.UNSIGNED_SHORT, 0);
        }

        // Draw a simple ship marker as a point (for debugging)
        // (Could be extended to a proper mesh)
    }
}