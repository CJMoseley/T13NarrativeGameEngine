import Logger from "../../core/Logger.js";

/**
 * T13NE Audio Effects System
 * Provides modular effects nodes for the synth and instrument engine.
 */
export class T13Effects {
    constructor(ctx) {
        this.ctx = ctx;
        this.bufferCache = new Map();
        this.curveCache = new Map();
    }

    /**
     * Creates a Distortion effect using a WaveShaperNode.
     * @param {number} amount - Distortion amount (0 to 100)
     */
    createDistortion(amount = 50) {
        const node = this.ctx.createWaveShaper();
        const cacheKey = Math.round(amount);

        if (!this.curveCache.has(cacheKey)) {
            this.curveCache.set(cacheKey, this._makeDistortionCurve(amount));
        }

        node.curve = this.curveCache.get(cacheKey);
        node.oversample = '4x';
        return node;
    }

    _makeDistortionCurve(amount) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            // Sigmoid-style distortion curve
            curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    /**
     * Creates an Algorithmic Reverb using a generated Impulse Response.
     * @param {number} duration - Reverb length in seconds
     * @param {number} decay - Decay rate (higher is faster)
     */
    createReverb(duration = 1.5, decay = 2.0, reverse = false) {
        const node = this.ctx.createConvolver();
        const cacheKey = `${duration.toFixed(2)}_${decay.toFixed(2)}_${reverse}`;

        if (!this.bufferCache.has(cacheKey)) {
            this.bufferCache.set(cacheKey, this._buildImpulse(duration, decay, reverse));
        }

        node.buffer = this.bufferCache.get(cacheKey);
        return node;
    }

    _buildImpulse(duration, decay, reverse) {
        const sampleRate = this.ctx.sampleRate;
        const length = Math.floor(sampleRate * duration);
        const impulse = this.ctx.createBuffer(2, length, sampleRate);
        const impulseL = impulse.getChannelData(0);
        const impulseR = impulse.getChannelData(1);

        // Seeded impulse generation for deterministic reverb
        let seedL = 0x12345;
        let seedR = 0x6789A;
        const pseudoRand = (s) => {
            let t = s += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
        };

        for (let i = 0; i < length; i++) {
            const n = reverse ? length - i : i;
            const envelope = Math.pow(1 - n / length, decay);
            // White noise modulated by an exponential decay envelope
            impulseL[i] = pseudoRand(seedL + i) * envelope;
            impulseR[i] = pseudoRand(seedR + i) * envelope;
        }
        return impulse;
    }

    /**
     * Creates a Phaser effect using a series of All-pass filters modulated by an LFO.
     */
    createPhaser(stages = 4, feedback = 0.5, rate = 0.5) {
        const input = this.ctx.createGain();
        const output = this.ctx.createGain();
        const feedbackGain = this.ctx.createGain();
        feedbackGain.gain.value = feedback;

        const allPassFilters = [];
        for (let i = 0; i < stages; i++) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'allpass';
            filter.frequency.value = 1000 + (i * 200);
            allPassFilters.push(filter);
        }

        // LFO
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = rate;
        lfoGain.gain.value = 800;
        lfo.connect(lfoGain);

        // Chain filters
        input.connect(allPassFilters[0]);
        for (let i = 0; i < stages - 1; i++) {
            allPassFilters[i].connect(allPassFilters[i + 1]);
            lfoGain.connect(allPassFilters[i].frequency);
        }
        lfoGain.connect(allPassFilters[stages - 1].frequency);

        allPassFilters[stages - 1].connect(output);
        allPassFilters[stages - 1].connect(feedbackGain);
        feedbackGain.connect(allPassFilters[0]);

        // Mix dry signal
        const dryGain = this.ctx.createGain();
        dryGain.gain.value = 1.0;
        input.connect(dryGain);
        dryGain.connect(output);

        lfo.start();

        return {
            input,
            output,
            lfo,
            setRate: (val) => lfo.frequency.setTargetAtTime(val, this.ctx.currentTime, 0.1),
            setFeedback: (val) => feedbackGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.1)
        };
    }

    /**
     * Creates a Noise Gate using a DynamicsCompressor with aggressive settings.
     */
    createNoiseGate(threshold = -40, ratio = 20) {
        const gate = this.ctx.createDynamicsCompressor();
        gate.threshold.value = threshold;
        gate.knee.value = 0;
        gate.ratio.value = ratio;
        gate.attack.value = 0.01;
        gate.release.value = 0.1;
        return gate;
    }

    /**
     * Creates a Stereo Chorus effect.
     */
    createChorus(rate = 1.5, depth = 3.5, delay = 0.03) {
        const input = this.ctx.createGain();
        const output = this.ctx.createGain();

        const delayNode = this.ctx.createDelay();
        delayNode.delayTime.value = delay;

        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.value = rate;
        lfoGain.gain.value = 0.002 * depth;

        lfo.connect(lfoGain);
        lfoGain.connect(delayNode.delayTime);
        lfo.start();

        input.connect(delayNode);
        delayNode.connect(output);
        input.connect(output); // Mix dry

        return { input, output, lfo };
    }
}
