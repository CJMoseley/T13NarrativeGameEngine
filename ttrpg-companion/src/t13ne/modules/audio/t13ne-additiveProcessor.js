// AdditiveProcessor.js
import audioModule from '../../wasm/audio.js';

let wasmAudio = null;
let wasmInitialized = false;

class AdditiveProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    // Default tiny silent wavetable to prevent null checks in hot loop
    this.wavetable = new Float32Array(2);
    this.tableLen = 2;
    this.phase = 0;
    this.active = false;

    if (options.processorOptions && options.processorOptions.wavetable) {
      this.wavetable = options.processorOptions.wavetable;
      this.tableLen = this.wavetable.length;
      this.active = true;
    }

    this.port.onmessage = async (event) => {
      const data = event.data;
      if (data.type === 'init-wasm') {
          if (!wasmInitialized) {
              try {
                  wasmAudio = await audioModule();
                  wasmInitialized = true;
                  console.log('AdditiveProcessor: WASM initialized in worklet.');
              } catch (e) {
                  console.error('AdditiveProcessor: WASM init failed in worklet.', e);
              }
          }
      }
      if (data.type === 'update') {
        if (data.wavetable && data.wavetable.length > 0) {
          this.wavetable = data.wavetable;
          this.tableLen = this.wavetable.length;
        }
        if (data.active !== undefined) this.active = data.active;
        if (data.resetPhase) this.phase = 0;
      }
    };
  }

  static get parameterDescriptors() {
    return [{ name: 'frequency', defaultValue: 440, automationRate: 'a-rate' }];
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || output.length === 0) return true;

    const channelCount = output.length;
    const bufferSize = output[0].length;

    // Fast path for inactive voices: silence the output and return
    if (!this.active || this.tableLen < 2) {
      for (let ch = 0; ch < channelCount; ch++) {
        output[ch].fill(0);
      }
      return true;
    }

    const freqArray = parameters.frequency;

    // TODO: When WASM is fully stable in Worklets, call wasmAudio.AdditiveSynth.process(...)
    // For now, we keep the JS loop as a primary/fallback but with optimized access.

    // Generate the signal for the block
    for (let i = 0; i < bufferSize; i++) {
      const f = freqArray.length > 1 ? freqArray[i] : freqArray[0];
      const phaseIncrement = (f * this.tableLen) / sampleRate;

      // Wavetable Lookup with Linear Interpolation
      const i0 = Math.floor(this.phase) % this.tableLen;
      const i1 = (i0 + 1) % this.tableLen;
      const frac = this.phase - Math.floor(this.phase);

      const sample = this.wavetable[i0] * (1 - frac) + this.wavetable[i1] * frac;

      // Write to all output channels
      for (let ch = 0; ch < channelCount; ch++) {
        output[ch][i] = sample;
      }

      this.phase = (this.phase + phaseIncrement) % this.tableLen;
    }
    return true;
  }
}

registerProcessor('additive-processor', AdditiveProcessor);
