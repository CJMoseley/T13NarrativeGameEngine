import * as THREE from 'three';
import { AnimationBlender } from './AnimationBlender.js';
import { VTuberBridge, decodePuppetPacket, encodePuppetPacket } from './VTuberBridge.js';
import { MorphManager } from './MorphManager.js';

/**
 * @module Avatar/LiveAvatarController
 * @description Orchestrates idle, audio-driven (VOIP shared analyser), and opt-in webcam
 * puppeting for VTT tokens, Character Sheet stages, and speaking portraits.
 */
export class LiveAvatarController {
    constructor(avatarMesh, bodyPlanType = 'humanoid', options = {}) {
        this.mesh = avatarMesh;
        this.blender = new AnimationBlender(avatarMesh, bodyPlanType);
        this.vtuber = new VTuberBridge(options.bridgeOptions);
        this.morph = new MorphManager(avatarMesh);

        this.mode = 'idle'; // 'idle' | 'audio' | 'webcam'
        this.isLive = false;
        this.onPuppetPacket = options.onPuppetPacket ?? null;
        this._lastPacketSentAt = 0;
        this._minPacketIntervalMs = options.minPacketIntervalMs ?? 50; // <= 20Hz
    }

    async init() {
        this.vtuber.onUpdate = (data) => {
            this.isLive = true;
            this.blender.setLiveData(data);
            this.morph.update(data.blendShapes || {});
            this._emitPacketIfDue(data);
        };
    }

    attachVOIP(voipManager) {
        const analyser = voipManager?.getLocalAnalyser?.() ?? voipManager?.analyser ?? null;
        const rate = voipManager?.soundEngine?.audioContext?.sampleRate ?? 48000;
        this.vtuber.setSharedAnalyser(analyser, rate);
        return Boolean(analyser);
    }

    async setMode(mode = 'audio', voipManager = null) {
        if (!['idle', 'audio', 'webcam'].includes(mode)) {
            throw new Error(`Unsupported puppet mode '${mode}'.`);
        }
        this.mode = mode;
        if (mode === 'idle') {
            this.vtuber.stop();
            this.blender.clearLiveData();
            this.isLive = false;
            return 'idle';
        }
        if (!this.vtuber.onUpdate) await this.init();
        if (voipManager) this.attachVOIP(voipManager);
        if (mode === 'audio') {
            this.vtuber.startAudioOnly();
            return 'audio';
        }
        await this.vtuber.startWebcam();
        return 'webcam';
    }

    async startLive() {
        return this.setMode('audio');
    }

    /**
     * Feeds synthetic or live FFT bins directly through audio puppeting -> MorphManager + AnimationBlender.
     */
    applyAudioBins(freqBins, timeSec = 0) {
        if (!this.vtuber.onUpdate) {
            this.vtuber.onUpdate = (data) => {
                this.isLive = true;
                this.blender.setLiveData(data);
                this.morph.update(data.blendShapes || {});
                this._emitPacketIfDue(data);
            };
        }
        const data = this.vtuber.tickAudio(timeSec, freqBins);
        if (data) this.blender.update(0.016);
        return data;
    }

    /**
     * Applies a remote quantized VTT puppet packet received from a peer.
     */
    applyRemotePuppetPacket(packet) {
        const frame = decodePuppetPacket(packet);
        const headQuat = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(frame.headPitch, frame.headYaw, frame.headRoll)
        );
        const data = {
            rotations: { head: headQuat },
            blendShapes: {
                jawOpen: frame.jawOpen,
                viseme_aa: frame.viseme_aa,
                viseme_ee: frame.viseme_ee,
                viseme_oh: frame.viseme_oh,
                viseme_oo: frame.viseme_oo,
                blink: frame.blink,
                smile: frame.smile,
                frown: frame.frown
            }
        };
        this.isLive = true;
        this.blender.setLiveData(data);
        this.morph.update(data.blendShapes);
        this.blender.update(0.016);
        return frame;
    }

    _emitPacketIfDue(data) {
        if (!this.onPuppetPacket) return;
        const now = Date.now();
        if (now - this._lastPacketSentAt < this._minPacketIntervalMs) return;
        this._lastPacketSentAt = now;
        const euler = data.rotations?.head
            ? new THREE.Euler().setFromQuaternion(data.rotations.head)
            : { x: 0, y: 0, z: 0 };
        const packet = encodePuppetPacket({
            ...(data.blendShapes || {}),
            headPitch: euler.x,
            headYaw: euler.y,
            headRoll: euler.z
        });
        this.onPuppetPacket(packet);
    }

    update(delta, velocity = new THREE.Vector3()) {
        this.blender.state.velocity.copy(velocity);
        this.blender.update(delta);
    }

    dispose() {
        this.vtuber.stop();
    }
}
