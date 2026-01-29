/**
 * Modular Instrument Engine for JULES
 * Includes FFT Analysis, Pre-generated Wavetable Synthesis, and AudioWorklet Management.
 */

// 1. Define the AudioWorkletProcessor as a String for easy module injection
const processorCode = `
class WavetableProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.table = options.processorOptions.wavetable;
    this.tableSize = this.table.length;
    this.phase = 0;
  }

  static get parameterDescriptors() {
    return [{ name: 'frequency', defaultValue: 440, automationRate: 'a-rate' }];
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const freq = parameters.frequency;

    for (let i = 0; i < output[0].length; i++) {
      const currentFreq = freq.length > 1 ? freq[i] : freq[0];
      const phaseIncrement = (currentFreq * this.tableSize) / sampleRate;

      // Linear Interpolation for high-fidelity pitch shifting
      const i0 = Math.floor(this.phase) % this.tableSize;
      const i1 = (i0 + 1) % this.tableSize;
      const frac = this.phase - Math.floor(this.phase);

      const sample = this.table[i0] * (1 - frac) + this.table[i1] * frac;

      for (let channel = 0; channel < output.length; channel++) {
        output[channel][i] = sample;
      }

      this.phase = (this.phase + phaseIncrement) % this.tableSize;
    }
    return true;
  }
}
registerProcessor('wavetable-processor', WavetableProcessor);
`;

export class InstrumentEngine {
  constructor() {
    this.audioCtx = new AudioContext();
    this.isInitialized = false;
  }

  /**
   * Initializes the AudioWorklet from the embedded processor code.
   */
  async init() {
    const blob = new Blob([processorCode], { type: 'application/javascript' });
    const moduleUrl = URL.createObjectURL(blob);
    await this.audioCtx.audioWorklet.addModule(moduleUrl);
    this.isInitialized = true;
  }

  /**
   * Analyzes an audio sample and returns a pre-generated wavetable.
   * Uses FFT to find the fundamental and harmonic partials.
   */
  async analyzeAndBake(audioBuffer, tableSize = 4096) {
    const fftSize = 2048;
    const channelData = audioBuffer.getChannelData(0);
    
    // In a real implementation, you'd use a dedicated FFT library like FFT.js here.
    // This example uses the native AnalyserNode for profile extraction.
    const analyser = this.audioCtx.createAnalyser();
    analyser.fftSize = fftSize;
    
    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);
    
    const freqData = new Float32Array(analyser.frequencyBinCount);
    source.start(0);
    analyser.getFloatFrequencyData(freqData);
    source.stop();

    // Create the wavetable buffer
    const wavetable = new Float32Array(tableSize);
    const numPartials = 32;

    for (let i = 0; i < tableSize; i++) {
      let sum = 0;
      for (let h = 1; h <= numPartials; h++) {
        // Simple mapping: frequency bin to harmonic amplitude
        const bin = Math.floor(h * (freqData.length / 50));
        const mag = Math.pow(10, freqData[bin] / 20); // dB to Linear
        sum += mag * Math.sin((2 * Math.PI * h * i) / tableSize);
      }
      wavetable[i] = sum;
    }

    // Normalise to avoid clipping
    const maxVal = Math.max(...wavetable.map(Math.abs));
    return wavetable.map(v => v / (maxVal || 1));
  }

  /**
   * Spawns a new synthesizer node for the given wavetable.
   */
  createInstrumentNode(wavetable) {
    if (!this.isInitialized) throw new Error("Engine not initialized");
    return new AudioWorkletNode(this.audioCtx, 'wavetable-processor', {
      processorOptions: { wavetable }
    });
  }
}
export class InstrumentEngine {
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.wavetableSize = 4096; // Resolution of the pre-generated cycle
  }

  /**
   * Analyzes an audio file to extract its harmonic partials.
   */
  async analyzeSample(audioUrl) {
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

    // Perform FFT on a stable segment of the sample
    const channelData = audioBuffer.getChannelData(0);
    const fftSize = 2048;
    const analyser = this.audioCtx.createAnalyser();
    analyser.fftSize = fftSize;

    // We use a temporary buffer source to pump data into the analyser
    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);
    
    const freqData = new Float32Array(analyser.frequencyBinCount);
    // In a real scenario, you'd analyze the sustain portion of the sample
    analyser.getFloatFrequencyData(freqData);

    return this.generateWavetable(freqData);
  }

  /**
   * Pre-generates (bakes) a single cycle of the instrument.
   * This "samples" the FFT results into a reusable buffer.
   */
  generateWavetable(freqData) {
    const table = new Float32Array(this.wavetableSize);
    const numPartials = 64; // Limits complexity for performance

    for (let n = 0; n < this.wavetableSize; n++) {
      let sample = 0;
      for (let h = 1; h <= numPartials; h++) {
        // Map harmonic index to frequency bin
        const binIndex = Math.floor(h * (freqData.length / 20)); // Simplified mapping
        const magnitude = Math.pow(10, freqData[binIndex] / 20); // dB to linear
        
        // Summing the sine waves (Additive Synthesis)
        sample += magnitude * Math.sin((2 * Math.PI * h * n) / this.wavetableSize);
      }
      table[n] = sample;
    }

    // Normalise to prevent digital clipping
    const max = Math.max(...table.map(Math.abs));
    return table.map(s => s / (max || 1));
  }

  async initSynthesizer(wavetable) {
    await this.audioCtx.audioWorklet.addModule('AdditiveProcessor.js');
    const synthNode = new AudioWorkletNode(this.audioCtx, 'additive-processor', {
      processorOptions: { wavetable }
    });
    
    synthNode.connect(this.audioCtx.destination);
    return synthNode;
  }
}
