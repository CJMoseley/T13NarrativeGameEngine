import Logger from './Logger.js';
import { EventBus } from './EventBus.js';
import { VoiceFXChain } from '../modules/audio/VoiceFXChain.js';
import { T13Effects } from '../modules/audio/t13ne-effects.js';

/**
 * Pure VAD hysteresis evaluator using both RMS level and speech-band FFT energy.
 */
export function evaluateVADFrame(freqBins, state = {}, {
    startThreshold = 14,
    stopThreshold = 9,
    attackFrames = 1,
    releaseFrames = 3
} = {}) {
    let sumSq = 0;
    const len = freqBins?.length || 0;
    for (let i = 0; i < len; i++) {
        const v = freqBins[i];
        sumSq += v * v;
    }
    const rms = len > 0 ? Math.sqrt(sumSq / len) : 0;

    let isSpeaking = Boolean(state.isSpeaking);
    let aboveCount = state.aboveCount ?? 0;
    let belowCount = state.belowCount ?? 0;
    let transition = null;

    if (!isSpeaking) {
        if (rms >= startThreshold) {
            aboveCount += 1;
            belowCount = 0;
            if (aboveCount >= attackFrames) {
                isSpeaking = true;
                aboveCount = 0;
                transition = 'started';
            }
        } else {
            aboveCount = 0;
        }
    } else {
        if (rms <= stopThreshold) {
            belowCount += 1;
            aboveCount = 0;
            if (belowCount >= releaseFrames) {
                isSpeaking = false;
                belowCount = 0;
                transition = 'stopped';
            }
        } else {
            belowCount = 0;
        }
    }

    return { rms, isSpeaking, aboveCount, belowCount, transition };
}

/**
 * Manages VOIP across WebRTCManager and PeerJS, routing microphone capture through
 * a WebAudio Noise Gate -> VoiceFXChain (T13 Species/Formation modulation) -> outbound track,
 * and routing remote peer streams into SoundEngine's `voip` bus (with optional 3D spatialization).
 */
export class VOIPManager {
    constructor(transportManager, soundEngine) {
        this.webRTCManager = transportManager; // WebRTCManager or P2PNetworkManager
        this.soundEngine = soundEngine;
        this.localStream = null;
        this.outboundStream = null;
        this.remoteStreams = new Map(); // peerId -> { stream, source, gainNode, panner, analyser, muted, volume }

        this.localSource = null;
        this.noiseGate = null;
        this.voiceFXChain = null;
        this.destinationNode = null;
        this.monitorGain = null;
        this.analyser = null;

        this.vadInterval = null;
        this.isSpeaking = false;
        this.vadState = { isSpeaking: false, aboveCount: 0, belowCount: 0 };
        this.speakingThreshold = 14;
        this.pushToTalkMode = false;
        this.pushToTalkActive = false;
        this.isMuted = false;
        this.localMonitorEnabled = false;
        this.accessibilityBypass = false;

        this._eventUnsubs = [];
    }

    async init(customStream = null) {
        const funcName = 'VOIPManager.init';
        Logger.start(funcName);
        try {
            if (customStream) {
                this.localStream = customStream;
            } else if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
                this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            }
            if (!this.localStream) {
                Logger.message('WARN: VOIPManager: No microphone stream available.');
                Logger.end(funcName);
                return false;
            }

            this._buildLocalProcessingGraph();
            const outboundTrack = this.outboundStream?.getAudioTracks?.()[0] ?? this.localStream.getAudioTracks?.()[0];
            if (outboundTrack && typeof this.webRTCManager?.addTrack === 'function') {
                this.webRTCManager.addTrack(outboundTrack);
            }
            Logger.message('VOIPManager: Microphone & VoiceFX pipeline initialized.');
            Logger.end(funcName);
            return true;
        } catch (e) {
            Logger.message(`ERROR: VOIPManager: Could not get microphone access. ${e}`);
            Logger.end(funcName);
            return false;
        }
    }

    _buildLocalProcessingGraph() {
        const ctx = this.soundEngine?.audioContext;
        if (!ctx || !this.localStream || typeof ctx.createMediaStreamSource !== 'function') {
            this.outboundStream = this.localStream;
            return;
        }

        this.localSource = ctx.createMediaStreamSource(this.localStream);
        const effects = new T13Effects(ctx);
        this.noiseGate = effects.createNoiseGate(-45, 16);
        this.voiceFXChain = new VoiceFXChain(ctx);
        this.voiceFXChain.setAccessibilityBypass(this.accessibilityBypass);

        this.analyser = typeof ctx.createAnalyser === 'function' ? ctx.createAnalyser() : null;
        if (this.analyser) this.analyser.fftSize = 512;

        this.monitorGain = ctx.createGain();
        this.monitorGain.gain.value = this.localMonitorEnabled ? 1.0 : 0.0;

        this.localSource.connect(this.noiseGate);
        this.noiseGate.connect(this.voiceFXChain.input);

        if (this.analyser) {
            this.voiceFXChain.output.connect(this.analyser);
        }
        const voipBus = this.soundEngine?.getBus?.('voip');
        if (voipBus) {
            this.voiceFXChain.output.connect(this.monitorGain);
            this.monitorGain.connect(voipBus);
        }

        if (typeof ctx.createMediaStreamDestination === 'function') {
            this.destinationNode = ctx.createMediaStreamDestination();
            this.voiceFXChain.output.connect(this.destinationNode);
            this.outboundStream = this.destinationNode.stream;
        } else {
            this.outboundStream = this.localStream;
        }
    }

    setupVAD() {
        if (!this.analyser && this.localStream && this.soundEngine?.audioContext) {
            const ctx = this.soundEngine.audioContext;
            this.analyser = ctx.createAnalyser();
            this.analyser.fftSize = 512;
            if (!this.localSource && typeof ctx.createMediaStreamSource === 'function') {
                this.localSource = ctx.createMediaStreamSource(this.localStream);
                this.localSource.connect(this.analyser);
            }
        }
    }

    getLocalAnalyser() {
        return this.analyser;
    }

    setLocalVoiceProfile(characterOrSpecies, overrides = {}) {
        if (this.voiceFXChain) {
            return this.voiceFXChain.applyProfile(characterOrSpecies, overrides);
        }
        return null;
    }

    setAccessibilityBypass(enabled) {
        this.accessibilityBypass = Boolean(enabled);
        this.voiceFXChain?.setAccessibilityBypass(this.accessibilityBypass);
    }

    setLocalMonitor(enabled) {
        this.localMonitorEnabled = Boolean(enabled);
        if (this.monitorGain) {
            this.monitorGain.gain.value = this.localMonitorEnabled ? 1.0 : 0.0;
        }
    }

    setPushToTalkMode(enabled) {
        this.pushToTalkMode = Boolean(enabled);
        this._syncOutboundTrackEnabled();
    }

    setPushToTalkActive(active) {
        this.pushToTalkActive = Boolean(active);
        this._syncOutboundTrackEnabled();
    }

    setMuted(isMuted) {
        this.isMuted = Boolean(isMuted);
        this._syncOutboundTrackEnabled();
    }

    _syncOutboundTrackEnabled() {
        const allow = !this.isMuted && (!this.pushToTalkMode || this.pushToTalkActive);
        for (const stream of [this.localStream, this.outboundStream]) {
            if (!stream?.getAudioTracks) continue;
            for (const track of stream.getAudioTracks()) {
                track.enabled = allow;
            }
        }
    }

    callPeer(peerId) {
        const stream = this.outboundStream ?? this.localStream;
        if (!stream || typeof this.webRTCManager?.callPeer !== 'function') return null;
        const call = this.webRTCManager.callPeer(peerId, stream);
        if (call && typeof call.on === 'function') {
            call.on('stream', (remoteStream) => {
                const track = remoteStream?.getAudioTracks?.()[0];
                if (track) this._handleRemoteTrack(peerId, track, remoteStream);
            });
            call.on('close', () => this.removePeer(peerId));
        }
        return call;
    }

    start() {
        this.stopDynamicListeners();
        if (this.webRTCManager?.peers instanceof Map) {
            for (const [peerId, pc] of this.webRTCManager.peers.entries()) {
                pc.ontrack = (event) => {
                    this._handleRemoteTrack(peerId, event.track, event.streams?.[0] ?? null);
                };
            }
        }

        // Dynamic listeners for peers joining/leaving AFTER start()
        this._eventUnsubs.push(
            EventBus.on('webrtc:remote-track', ({ peerId, track, stream }) => {
                this._handleRemoteTrack(peerId, track, stream);
            }),
            EventBus.on('webrtc:peer-closed', ({ peerId }) => {
                this.removePeer(peerId);
            }),
            EventBus.on('p2p:peer-disconnected', ({ peerId }) => {
                this.removePeer(peerId);
            }),
            EventBus.on('p2p:incoming-call', ({ call, peerId }) => {
                const answerStream = this.outboundStream ?? this.localStream;
                if (typeof call?.answer === 'function') {
                    call.answer(answerStream || undefined);
                }
                if (typeof call?.on === 'function') {
                    call.on('stream', (remoteStream) => {
                        const track = remoteStream?.getAudioTracks?.()[0];
                        if (track) this._handleRemoteTrack(peerId, track, remoteStream);
                    });
                    call.on('close', () => this.removePeer(peerId));
                }
            })
        );

        if (!this.vadInterval) {
            this.vadInterval = setInterval(() => this._checkVoiceActivity(), 80);
            if (typeof this.vadInterval?.unref === 'function') {
                this.vadInterval.unref();
            }
        }
    }

    stopDynamicListeners() {
        for (const unsub of this._eventUnsubs) {
            if (typeof unsub === 'function') {
                try { unsub(); } catch (e) {}
            }
        }
        this._eventUnsubs = [];
    }

    stop() {
        this.stopDynamicListeners();
        if (this.vadInterval) {
            clearInterval(this.vadInterval);
            this.vadInterval = null;
        }
        if (this.localStream?.getTracks) {
            this.localStream.getTracks().forEach(track => track.stop?.());
        }
        this.localStream = null;
        this.outboundStream = null;
        this.voiceFXChain?.dispose();
        this.voiceFXChain = null;

        for (const peerId of Array.from(this.remoteStreams.keys())) {
            this.removePeer(peerId);
        }
        this.isSpeaking = false;
        this.vadState = { isSpeaking: false, aboveCount: 0, belowCount: 0 };
    }

    setPeerVolume(peerId, volume) {
        const remote = this.remoteStreams.get(peerId);
        if (!remote) return;
        remote.volume = Math.max(0, Math.min(2, Number(volume) || 0));
        const effective = remote.muted ? 0 : remote.volume;
        if (remote.gainNode?.gain) remote.gainNode.gain.value = effective;
        if (remote.audio) remote.audio.volume = Math.min(1, effective);
    }

    setPeerMuted(peerId, muted) {
        const remote = this.remoteStreams.get(peerId);
        if (!remote) return;
        remote.muted = Boolean(muted);
        const effective = remote.muted ? 0 : remote.volume;
        if (remote.gainNode?.gain) remote.gainNode.gain.value = effective;
        if (remote.audio) remote.audio.muted = remote.muted;
    }

    setPeerPosition(peerId, pos = { x: 0, y: 0, z: 0 }) {
        const remote = this.remoteStreams.get(peerId);
        if (!remote?.panner) return;
        if (typeof remote.panner.positionX !== 'undefined') {
            remote.panner.positionX.value = Number(pos.x ?? 0);
            remote.panner.positionY.value = Number(pos.y ?? 0);
            remote.panner.positionZ.value = Number(pos.z ?? 0);
        } else if (typeof remote.panner.setPosition === 'function') {
            remote.panner.setPosition(Number(pos.x ?? 0), Number(pos.y ?? 0), Number(pos.z ?? 0));
        }
    }

    removePeer(peerId) {
        const remote = this.remoteStreams.get(peerId);
        if (!remote) return;
        try {
            remote.source?.disconnect?.();
            remote.gainNode?.disconnect?.();
            remote.panner?.disconnect?.();
            remote.analyser?.disconnect?.();
            remote.stream?.getTracks?.().forEach(t => t.stop?.());
            if (remote.audio) {
                remote.audio.pause?.();
                remote.audio.srcObject = null;
            }
        } catch (e) {}
        this.remoteStreams.delete(peerId);
        EventBus.emit('voip:peer-disconnected', { peerId });
    }

    _handleRemoteTrack(peerId, track, providedStream = null) {
        if (this.remoteStreams.has(peerId)) {
            this.removePeer(peerId);
        }
        const stream = providedStream ?? (typeof MediaStream !== 'undefined' && track ? new MediaStream([track]) : { getTracks: () => (track ? [track] : []) });
        const ctx = this.soundEngine?.audioContext;
        const voipBus = this.soundEngine?.getBus?.('voip');

        let source = null;
        let gainNode = null;
        let panner = null;
        let analyser = null;
        let audio = null;

        if (ctx && voipBus && typeof ctx.createMediaStreamSource === 'function') {
            source = ctx.createMediaStreamSource(stream);
            gainNode = ctx.createGain();
            gainNode.gain.value = 1.0;
            analyser = typeof ctx.createAnalyser === 'function' ? ctx.createAnalyser() : null;
            if (analyser) analyser.fftSize = 256;

            if (typeof ctx.createPanner === 'function') {
                panner = ctx.createPanner();
                panner.panningModel = 'HRTF';
                panner.distanceModel = 'inverse';
            }

            let node = source;
            if (analyser) { node.connect(analyser); node = analyser; }
            node.connect(gainNode);
            node = gainNode;
            if (panner) { node.connect(panner); node = panner; }
            node.connect(voipBus);
        } else if (typeof Audio !== 'undefined') {
            audio = new Audio();
            audio.srcObject = stream;
            audio.play?.().catch?.(() => {});
        }

        this.remoteStreams.set(peerId, {
            stream,
            source,
            gainNode,
            panner,
            analyser,
            audio,
            volume: 1.0,
            muted: false
        });
        EventBus.emit('voip:peer-connected', { peerId });
    }

    _checkVoiceActivity() {
        if (!this.analyser) return null;
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        return this.processVADBins(dataArray);
    }

    processVADBins(dataArray) {
        const next = evaluateVADFrame(dataArray, this.vadState, {
            startThreshold: this.speakingThreshold,
            stopThreshold: Math.max(4, this.speakingThreshold * 0.65)
        });
        this.vadState = next;
        this.isSpeaking = next.isSpeaking;
        if (next.transition === 'started') {
            EventBus.emit('voip:speaking-started', { rms: next.rms });
        } else if (next.transition === 'stopped') {
            EventBus.emit('voip:speaking-stopped', { rms: next.rms });
        }
        return next;
    }
}
