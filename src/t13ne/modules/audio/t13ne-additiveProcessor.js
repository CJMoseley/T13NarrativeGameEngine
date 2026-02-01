// AdditiveProcessor.js
class AdditiveProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    // wavetable is a Float32Array of pre-summed sine partials
    this.wavetable = options.processorOptions ? options.processorOptions.wavetable : null;
    this.tableLen = this.wavetable ? this.wavetable.length : 0;
    this.phase = 0;
  }

  static get parameterDescriptors() {
    return [{ name: 'frequency', defaultValue: 440, automationRate: 'a-rate' }];
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!this.wavetable || this.tableLen === 0) return true;

    const freq = parameters.frequency;
    const channelCount = output.length;
    const bufferSize = output[0].length;

    // Generate the signal for the block
    for (let i = 0; i < bufferSize; i++) {
      const f = freq.length > 1 ? freq[i] : freq[0];
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
