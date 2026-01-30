import * as THREE from 'three';
import { Holistic } from '@mediapipe/holistic';
import { Camera } from '@mediapipe/camera_utils';
import * as Kalidokit from 'kalidokit';

/**
 * @module Avatar/VTuberBridge
 * @description Bridges camera/mic input to the avatar via MediaPipe and Kalidokit.
 */
export class VTuberBridge {
    constructor() {
        this.holistic = null;
        this.camera = null;
        this.videoElement = document.createElement('video');
        this.videoElement.style.display = 'none';
        document.body.appendChild(this.videoElement);

        this.onUpdate = null; // Callback for tracked data

        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.jawValue = 0;
    }

    /**
     * Initializes camera and MediaPipe
     */
    async start() {
        this.holistic = new Holistic({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
        });

        this.holistic.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.holistic.onResults((results) => this._processResults(results));

        this.camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.holistic.send({ image: this.videoElement });
            },
            width: 640,
            height: 480
        });

        await this.camera.start();
        this._startAudioCapture();
    }

    /**
     * @private
     */
    _processResults(results) {
        if (!results.faceLandmarks && !results.poseLandmarks) return;

        // Use Kalidokit to solve rotations
        const face = results.faceLandmarks;
        const pose = results.poseLandmarks;
        const leftHand = results.leftHandLandmarks;
        const rightHand = results.rightHandLandmarks;

        const riggedFace = face ? Kalidokit.Face.solve(face, { runtime: 'mediapipe', video: this.videoElement }) : null;
        const riggedPose = pose ? Kalidokit.Pose.solve(pose, face, { runtime: 'mediapipe', video: this.videoElement }) : null;
        const riggedHandL = leftHand ? Kalidokit.Hand.solve(leftHand, 'Left') : null;
        const riggedHandR = rightHand ? Kalidokit.Hand.solve(rightHand, 'Right') : null;

        const data = {
            rotations: {},
            blendShapes: {},
            jawOpen: this.jawValue // Fallback audio jaw
        };

        if (riggedFace) {
            data.rotations['head'] = this._toQuaternion(riggedFace.head);
            data.rotations['neck'] = this._toQuaternion(riggedFace.neck);
            // Blendshapes
            data.blendShapes = riggedFace.eye;
            data.blendShapes.jawOpen = Math.max(riggedFace.mouth.y, this.jawValue);
        }

        if (riggedPose) {
            data.rotations['spine'] = this._toQuaternion(riggedPose.spine);
            data.rotations['hips'] = this._toQuaternion(riggedPose.hips);
            data.rotations['arm_l'] = this._toQuaternion(riggedPose.leftUpperArm);
            data.rotations['arm_r'] = this._toQuaternion(riggedPose.rightUpperArm);
        }

        if (this.onUpdate) this.onUpdate(data);
    }

    /**
     * @private
     */
    async _startAudioCapture() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            this.analyser.fftSize = 256;

            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateAudio = () => {
                this.analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
                const average = sum / bufferLength;
                this.jawValue = Math.min(average / 128, 1.0); // Normalize to 0-1
                requestAnimationFrame(updateAudio);
            };
            updateAudio();
        } catch (e) {
            console.warn("Audio capture failed", e);
        }
    }

    _toQuaternion(euler) {
        return new THREE.Quaternion().setFromEuler(new THREE.Euler(euler.x, euler.y, euler.z));
    }
}
