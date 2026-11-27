import * as THREE from 'three';

function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : 0));
}

/**
 * Extracts speech visemes (`viseme_aa`, `viseme_ee`, `viseme_oh`, `viseme_oo`, `jawOpen`),
 * subtle conversational head bob/lean, and procedural blink cadence from FFT frequency bins.
 * Zero DOM dependencies — runs identically in Node tests and browsers.
 */
export function extractAudioPuppetFrame(freqBins, {
    timeSec = 0,
    sampleRate = 48000,
    fftSize = 512
} = {}) {
    const len = freqBins?.length || 0;
    const nyquist = sampleRate / 2;
    const binHz = len > 0 ? nyquist / len : nyquist / (fftSize / 2);

    let lowSum = 0, lowCount = 0;   // 250 - 750 Hz (fundamental + F1 -> aa/oh/oo)
    let midSum = 0, midCount = 0;   // 750 - 2400 Hz (F2 -> ee/aa)
    let highSum = 0, highCount = 0; // 2400 - 4500 Hz (fricatives/clarity)

    for (let i = 0; i < len; i++) {
        const hz = i * binHz;
        const val = freqBins[i] / 255;
        if (hz >= 200 && hz < 750) { lowSum += val; lowCount++; }
        else if (hz >= 750 && hz < 2400) { midSum += val; midCount++; }
        else if (hz >= 2400 && hz <= 4500) { highSum += val; highCount++; }
    }

    const lowE = lowCount ? lowSum / lowCount : 0;
    const midE = midCount ? midSum / midCount : 0;
    const highE = highCount ? highSum / highCount : 0;
    const energy = clamp(lowE * 0.55 + midE * 0.35 + highE * 0.1, 0, 1);

    const jawOpen = clamp(energy * 1.4, 0, 1);
    const viseme_aa = clamp((lowE * 0.8 + midE * 0.5) * 1.1, 0, 1);
    const viseme_ee = clamp(Math.max(0, midE - lowE * 0.4) * 1.5, 0, 1);
    const viseme_oh = clamp(Math.max(0, lowE - midE * 0.3) * 1.3, 0, 1);
    const viseme_oo = clamp(Math.max(0, lowE * 0.9 - (midE + highE) * 0.45) * 1.4, 0, 1);

    // Natural blink every ~3.7 seconds
    const blinkCycle = timeSec % 3.7;
    const blink = blinkCycle < 0.14 ? Math.sin((blinkCycle / 0.14) * Math.PI) : 0;

    // Subtle conversational head motion when speaking
    const headPitch = energy > 0.05 ? Math.sin(timeSec * 5.2) * 0.08 * energy : Math.sin(timeSec * 1.1) * 0.02;
    const headYaw = energy > 0.05 ? Math.cos(timeSec * 3.1) * 0.07 * energy : 0;

    return {
        jawOpen,
        viseme_aa,
        viseme_ee,
        viseme_oh,
        viseme_oo,
        blink,
        headPitch,
        headYaw,
        energy
    };
}

/**
 * Encodes a puppet frame into compact quantized integers (< 200 bytes JSON) for VTT sync.
 */
export function encodePuppetPacket(frame = {}) {
    const q01 = (v) => Math.round(clamp(v, 0, 1) * 100);
    const qAngle = (v) => Math.round(clamp(v, -1.5, 1.5) * 100);
    return {
        j: q01(frame.jawOpen),
        aa: q01(frame.viseme_aa),
        ee: q01(frame.viseme_ee),
        oh: q01(frame.viseme_oh),
        oo: q01(frame.viseme_oo),
        bl: q01(frame.blink),
        sm: Math.round(clamp(frame.smile, -1, 1) * 100),
        fr: q01(frame.frown),
        hp: qAngle(frame.headPitch),
        hy: qAngle(frame.headYaw),
        hr: qAngle(frame.headRoll)
    };
}

export function decodePuppetPacket(packet = {}) {
    return {
        jawOpen: clamp((packet.j ?? 0) / 100, 0, 1),
        viseme_aa: clamp((packet.aa ?? 0) / 100, 0, 1),
        viseme_ee: clamp((packet.ee ?? 0) / 100, 0, 1),
        viseme_oh: clamp((packet.oh ?? 0) / 100, 0, 1),
        viseme_oo: clamp((packet.oo ?? 0) / 100, 0, 1),
        blink: clamp((packet.bl ?? 0) / 100, 0, 1),
        smile: clamp((packet.sm ?? 0) / 100, -1, 1),
        frown: clamp((packet.fr ?? 0) / 100, 0, 1),
        headPitch: clamp((packet.hp ?? 0) / 100, -1.5, 1.5),
        headYaw: clamp((packet.hy ?? 0) / 100, -1.5, 1.5),
        headRoll: clamp((packet.hr ?? 0) / 100, -1.5, 1.5)
    };
}

/**
 * Bridges optional webcam tracking (MediaPipe + Kalidokit) and shared VOIP audio-driven
 * formant puppeting without touching document.body on import or construction.
 */
export class VTuberBridge {
    constructor(options = {}) {
        this.assetBaseUrl = options.assetBaseUrl ?? '/mediapipe/holistic';
        this.analyser = options.analyser ?? null;
        this.sampleRate = options.sampleRate ?? 48000;
        this.holistic = null;
        this.camera = null;
        this.videoElement = null;
        this.onUpdate = null;
        this.jawValue = 0;
        this.mode = 'idle'; // 'idle' | 'audio' | 'webcam'
        this._rafId = null;
        this._startTime = Date.now();
    }

    setSharedAnalyser(analyser, sampleRate = 48000) {
        this.analyser = analyser;
        this.sampleRate = sampleRate;
    }

    /**
     * Starts zero-webcam audio-driven puppeting using a shared VOIPManager analyser.
     */
    startAudioOnly(sharedAnalyser = null) {
        if (sharedAnalyser) this.analyser = sharedAnalyser;
        this.mode = 'audio';
        if (typeof requestAnimationFrame === 'function' && !this._rafId) {
            const loop = () => {
                if (this.mode !== 'audio' && this.mode !== 'webcam') return;
                this.tickAudio((Date.now() - this._startTime) / 1000);
                this._rafId = requestAnimationFrame(loop);
            };
            this._rafId = requestAnimationFrame(loop);
        }
        return true;
    }

    /**
     * Synchronous audio-frame step (also directly callable in headless tests).
     */
    tickAudio(timeSec = (Date.now() - this._startTime) / 1000, explicitBins = null) {
        let bins = explicitBins;
        if (!bins && this.analyser?.frequencyBinCount) {
            bins = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(bins);
        }
        if (!bins) return null;

        const audioFrame = extractAudioPuppetFrame(bins, {
            timeSec,
            sampleRate: this.sampleRate,
            fftSize: this.analyser?.fftSize ?? bins.length * 2
        });
        this.jawValue = audioFrame.jawOpen;

        const data = {
            rotations: {
                head: new THREE.Quaternion().setFromEuler(new THREE.Euler(audioFrame.headPitch, audioFrame.headYaw, 0))
            },
            blendShapes: {
                jawOpen: audioFrame.jawOpen,
                viseme_aa: audioFrame.viseme_aa,
                viseme_ee: audioFrame.viseme_ee,
                viseme_oh: audioFrame.viseme_oh,
                viseme_oo: audioFrame.viseme_oo,
                blink: audioFrame.blink
            },
            jawOpen: audioFrame.jawOpen,
            frame: audioFrame
        };
        this.onUpdate?.(data);
        return data;
    }

    /**
     * Opt-in webcam + MediaPipe Holistic tracking (only creates hidden <video> when called).
     */
    async startWebcam() {
        if (typeof document === 'undefined') {
            throw new Error('Webcam puppeting requires a browser DOM.');
        }
        const [{ Holistic }, { Camera }] = await Promise.all([
            import('@mediapipe/holistic'),
            import('@mediapipe/camera_utils')
        ]);

        if (!this.videoElement) {
            this.videoElement = document.createElement('video');
            this.videoElement.style.display = 'none';
            document.body.appendChild(this.videoElement);
        }

        const base = this.assetBaseUrl.replace(/\/$/, '');
        this.holistic = new Holistic({
            locateFile: (file) => `${base}/${file}`
        });
        this.holistic.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        this.holistic.onResults((results) => this.processLandmarkFixture(results));

        this.camera = new Camera(this.videoElement, {
            onFrame: async () => {
                if (this.holistic && this.videoElement) {
                    await this.holistic.send({ image: this.videoElement });
                }
            },
            width: 640,
            height: 480
        });

        this.mode = 'webcam';
        await this.camera.start();
        return true;
    }

    async start() {
        return this.startAudioOnly();
    }

    stop() {
        this.mode = 'idle';
        if (this._rafId && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        try { this.camera?.stop?.(); } catch (e) {}
        if (this.videoElement?.parentNode) {
            this.videoElement.parentNode.removeChild(this.videoElement);
        }
        this.videoElement = null;
    }

    /**
     * Processes MediaPipe/Kalidokit landmarks or deterministic test fixtures.
     */
    processLandmarkFixture(results = {}) {
        if (!results.face && !results.pose && !results.faceLandmarks && !results.poseLandmarks) return null;

        const riggedFace = results.face ?? null;
        const riggedPose = results.pose ?? null;

        const data = {
            rotations: {},
            blendShapes: {},
            jawOpen: this.jawValue
        };

        if (riggedFace) {
            if (riggedFace.head) data.rotations.head = this._toQuaternion(riggedFace.head, 0.7);
            if (riggedFace.neck) data.rotations.neck = this._toQuaternion(riggedFace.neck, 0.45);
            const eyeL = clamp(1 - (riggedFace.eye?.l ?? 1), 0, 1);
            const eyeR = clamp(1 - (riggedFace.eye?.r ?? 1), 0, 1);
            const mouthY = clamp(riggedFace.mouth?.y ?? riggedFace.mouth?.shape?.y ?? 0, 0, 1);
            data.blendShapes = {
                eyeBlinkLeft: eyeL,
                eyeBlinkRight: eyeR,
                jawOpen: Math.max(mouthY, this.jawValue),
                viseme_aa: mouthY,
                viseme_ee: clamp(riggedFace.mouth?.shape?.x ?? 0, 0, 1)
            };
            data.jawOpen = data.blendShapes.jawOpen;
        }

        if (riggedPose) {
            if (riggedPose.spine) data.rotations.spine = this._toQuaternion(riggedPose.spine, 0.45);
            if (riggedPose.hips) data.rotations.hips = this._toQuaternion(riggedPose.hips, 0.35);
            if (riggedPose.leftUpperArm) data.rotations.arm_l = this._toQuaternion(riggedPose.leftUpperArm, 1.2);
            if (riggedPose.rightUpperArm) data.rotations.arm_r = this._toQuaternion(riggedPose.rightUpperArm, 1.2);
        }

        this.onUpdate?.(data);
        return data;
    }

    _toQuaternion(euler, maxRad = 0.8) {
        const x = clamp(euler?.x ?? 0, -maxRad, maxRad);
        const y = clamp(euler?.y ?? 0, -maxRad, maxRad);
        const z = clamp(euler?.z ?? 0, -maxRad, maxRad);
        return new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
    }
}
