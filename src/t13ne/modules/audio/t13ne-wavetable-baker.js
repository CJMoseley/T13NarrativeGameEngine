
import Logger from "../../core/Logger.js";

/**
 * WebGPUWavetableBaker
 * Uses WebGPU Compute Shaders to "bake" complex additive synthesis waveforms
 * into PCM buffers, running purely on the GPU.
 */
export class WavetableBaker {
    constructor() {
        this.device = null;
        this.initialized = false;
        this.InitializePromise = this.initWebGPU();
    }

    async initWebGPU() {
        if (!navigator.gpu) {
            Logger.warn("WebGPU not supported on this browser. Falling back to CPU.");
            return false;
        }

        try {
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                Logger.warn("No WebGPU adapter found.");
                return false;
            }
            this.device = await adapter.requestDevice();
            this.initialized = true;
            Logger.message("WavetableBaker: WebGPU Initialized.");
            return true;
        } catch (e) {
            Logger.error("WavetableBaker: WebGPU initialization failed.", e);
            return false;
        }
    }

    /**
     * Bakes a waveform from a list of partials.
     * @param {Array<{freq: number, amp: number}>} partials 
     * @param {number} duration 
     * @param {number} sampleRate 
     * @returns {Promise<Float32Array>}
     */
    async bake(partials, duration = 1.0, sampleRate = 44100) {
        await this.InitializePromise;

        const numSamples = Math.floor(duration * sampleRate);

        if (!this.initialized) {
            return this.bakeCPU(partials, numSamples, sampleRate);
        }

        try {
            return await this.bakeGPU(partials, numSamples, sampleRate);
        } catch (e) {
            Logger.error("WebGPU Bake failed, falling back to CPU.", e);
            return this.bakeCPU(partials, numSamples, sampleRate);
        }
    }

    async bakeGPU(partials, numSamples, sampleRate) {
        const device = this.device;
        const numPartials = partials.length;

        // 1. Prepare Data
        // Structure: Each partial is 2 floats (freq, amp). But WGSL structs need alignment.
        // struct Partial { freq: f32, amp: f32 } is 8 bytes. nice.
        const partialsData = new Float32Array(numPartials * 2);
        for (let i = 0; i < numPartials; i++) {
            partialsData[i * 2] = partials[i].freq;
            partialsData[i * 2 + 1] = partials[i].amp;
        }

        // 2. Create Buffers
        // Input: Partials
        const partialsBuffer = device.createBuffer({
            size: partialsData.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });
        new Float32Array(partialsBuffer.getMappedRange()).set(partialsData);
        partialsBuffer.unmap();

        // Output: Samples
        const outputBufferSize = numSamples * 4; // f32
        const outputBuffer = device.createBuffer({
            size: outputBufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });

        // Uniform: Params [sampleRate, numPartials]
        const paramsData = new Float32Array([sampleRate, numPartials]);
        const paramsBuffer = device.createBuffer({
            size: paramsData.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(paramsBuffer, 0, paramsData);

        // 3. Shader Module
        const shaderModule = device.createShaderModule({
            code: `
                struct Partial {
                    freq: f32,
                    amp: f32,
                };
                struct PartialsBuffer {
                    partials: array<Partial>,
                };
                struct OutputBuffer {
                    samples: array<f32>,
                };
                struct Params {
                    sampleRate: f32,
                    numPartials: f32,
                };

                @group(0) @binding(0) var<storage, read> input : PartialsBuffer;
                @group(0) @binding(1) var<storage, read_write> output : OutputBuffer;
                @group(0) @binding(2) var<uniform> params : Params;

                const PI = 3.14159265359;

                @compute @workgroup_size(64)
                fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
                    let index = global_id.x;
                    // Array length check implicitly handled by buffer bounds in robust access, 
                    // but manual check is safer for logic
                    let totalSamples = arrayLength(&output.samples);
                    if (index >= totalSamples) {
                        return;
                    }

                    let t = f32(index) / params.sampleRate;
                    let count = u32(params.numPartials);
                    var sum = 0.0;

                    for (var i = 0u; i < count; i = i + 1u) {
                        let p = input.partials[i];
                        sum = sum + sin(2.0 * PI * p.freq * t) * p.amp;
                    }

                    output.samples[index] = sum;
                }
            `
        });

        // 4. Pipeline & Bind Group
        const computePipeline = device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: shaderModule,
                entryPoint: 'main'
            }
        });

        const bindGroup = device.createBindGroup({
            layout: computePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: partialsBuffer } },
                { binding: 1, resource: { buffer: outputBuffer } },
                { binding: 2, resource: { buffer: paramsBuffer } }
            ]
        });

        // 5. Dispatch
        const commandEncoder = device.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(computePipeline);
        passEncoder.setBindGroup(0, bindGroup);
        // Workgroup size 64. Dispatch needed: ceil(numSamples / 64)
        passEncoder.dispatchWorkgroups(Math.ceil(numSamples / 64));
        passEncoder.end();

        // 6. Readback
        // Need a buffer with MAP_READ usage to read back to CPU
        const readBuffer = device.createBuffer({
            size: outputBufferSize,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
        });
        commandEncoder.copyBufferToBuffer(outputBuffer, 0, readBuffer, 0, outputBufferSize);

        device.queue.submit([commandEncoder.finish()]);

        await readBuffer.mapAsync(GPUMapMode.READ);
        const copyArray = new Float32Array(readBuffer.getMappedRange());
        const result = new Float32Array(copyArray); // Copy so we can unmap
        readBuffer.unmap();

        return this.normalize(result);
    }

    bakeCPU(partials, numSamples, sampleRate) {
        Logger.message("WavetableBaker: Baking on CPU...");
        const result = new Float32Array(numSamples);
        const twoPi = Math.PI * 2;

        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            let sum = 0;
            for (let p = 0; p < partials.length; p++) {
                sum += Math.sin(twoPi * partials[p].freq * t) * partials[p].amp;
            }
            result[i] = sum;
        }
        return this.normalize(result);
    }

    normalize(buffer) {
        let max = 0;
        for (let i = 0; i < buffer.length; i++) {
            const abs = Math.abs(buffer[i]);
            if (abs > max) max = abs;
        }
        if (max > 0) {
            const scale = 0.9 / max;
            for (let i = 0; i < buffer.length; i++) {
                buffer[i] *= scale;
            }
        }
        return buffer;
    }

    destroy() {
        // WebGPU resources mostly auto-GC, but maybe destroy device if needed
        if (this.device) {
            // this.device.destroy(); // Optional, depending on lifecycle
        }
    }
}
