// AdditiveProcessor.js
class AdditiveProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    // wavetable is a Float32Array of pre-summed sine partials
    this.wavetable = options.processorOptions.wavetable;
    this.tableLen = this.wavetable.length;
    this.phase = 0;
  }

  static get parameterDescriptors() {
    return [{ name: 'frequency', defaultValue: 440, automationRate: 'a-rate' }];
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0][0];
    const freq = parameters.frequency;

    for (let i = 0; i < output.length; i++) {
      const f = freq.length > 1 ? freq[i] : freq[0];
      const phaseIncrement = (f * this.tableLen) / sampleRate;

      // Wavetable Lookup with Linear Interpolation
      const i0 = Math.floor(this.phase) % this.tableLen;
      const i1 = (i0 + 1) % this.tableLen;
      const frac = this.phase - Math.floor(this.phase);
      
      output[i] = this.wavetable[i0] * (1 - frac) + this.wavetable[i1] * frac;

      this.phase = (this.phase + phaseIncrement) % this.tableLen;
    }
    return true;
  }
}

registerProcessor('additive-processor', AdditiveProcessor);
