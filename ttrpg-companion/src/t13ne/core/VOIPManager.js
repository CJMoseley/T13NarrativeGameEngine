import Logger from './Logger.js';
import { EventBus } from './EventBus.js';

/**
 * Manages the VOIP system, including microphone access and audio streams.
 */
export class VOIPManager {
    constructor(webRTCManager, soundEngine) {
        const funcName = 'VOIPManager.constructor';
        Logger.start(funcName);
        this.webRTCManager = webRTCManager;
        this.soundEngine = soundEngine;
        this.localStream = null;
        this.remoteStreams = new Map(); // peerId -> { stream: MediaStream, audio: HTMLAudioElement }

        // Voice Activity Detection
        this.analyser = null;
        this.vadInterval = null;
        this.isSpeaking = false;
        this.speakingThreshold = 10; // Tweak this value
        Logger.end(funcName);
    }

    /**
     * Initializes the VOIP manager, requesting microphone access.
     */
    async init() {
        const funcName = 'VOIPManager.init';
        Logger.start(funcName);
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            Logger.message("VOIPManager: Microphone access granted.");

            const audioTrack = this.localStream.getAudioTracks()[0];
            this.webRTCManager.addTrack(audioTrack);

        } catch (e) {
            Logger.message(`ERROR: VOIPManager: Could not get microphone access. ${e}`);
        }
        Logger.end(funcName);
    }

    /**
     * Sets up the voice activity detection.
     */
    setupVAD() {
        if (!this.localStream || !this.soundEngine.audioContext) {
            Logger.message("WARN: VOIPManager: Cannot setup VAD, no local stream or audio context.");
            return;
        }
        const funcName = 'VOIPManager.setupVAD';
        Logger.start(funcName);

        const audioContext = this.soundEngine.audioContext;
        this.analyser = audioContext.createAnalyser();
        this.analyser.fftSize = 512;
        const source = audioContext.createMediaStreamSource(this.localStream);
        source.connect(this.analyser);
    }


    /**
     * Starts the VOIP system.
     */
    start() {
        const funcName = 'VOIPManager.start';
        Logger.start(funcName);

        if (!this.localStream) {
            Logger.message("WARN: VOIPManager: Cannot start, no local stream.");
            return;
        }

        // Listen for incoming tracks
        for (const [peerId, pc] of this.webRTCManager.peers.entries()) {
            pc.ontrack = (event) => {
                this._handleRemoteTrack(peerId, event.track);
            };
        }

        // Start VAD
        this.vadInterval = setInterval(() => this._checkVoiceActivity(), 100);

        Logger.message("VOIPManager: Started.");
        Logger.end(funcName);
    }

    /**
     * Stops the VOIP system.
     */
    stop() {
        const funcName = 'VOIPManager.stop';
        Logger.start(funcName);

        if (this.vadInterval) {
            clearInterval(this.vadInterval);
            this.vadInterval = null;
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        for (const remote of this.remoteStreams.values()) {
            remote.stream.getTracks().forEach(track => track.stop());
        }
        this.remoteStreams.clear();

        Logger.message("VOIPManager: Stopped.");
        Logger.end(funcName);
    }

    /**
     * Toggles the mute state of the local audio stream.
     * @param {boolean} isMuted - True to mute, false to unmute.
     */
    setMuted(isMuted) {
        const funcName = 'VOIPManager.setMuted';
        Logger.start(funcName);
        Logger.logVariables({ isMuted });

        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
        Logger.end(funcName);
    }

    /**
     * Handles an incoming remote audio track.
     * @param {string} peerId - The ID of the peer the track is from.
     * @param {MediaStreamTrack} track - The incoming audio track.
     * @private
     */
    /**
     * Sets the volume for a specific peer.
     * @param {string} peerId - The ID of the peer.
     * @param {number} volume - The volume level from 0 to 1.
     */
    setPeerVolume(peerId, volume) {
        const funcName = 'VOIPManager.setPeerVolume';
        Logger.start(funcName);
        Logger.logVariables({ peerId, volume });

        if (this.remoteStreams.has(peerId)) {
            const remote = this.remoteStreams.get(peerId);
            remote.audio.volume = volume;
        }
        Logger.end(funcName);
    }

    /**
     * Handles an incoming remote audio track.
     * @param {string} peerId - The ID of the peer the track is from.
     * @param {MediaStreamTrack} track - The incoming audio track.
     * @private
     */
    _handleRemoteTrack(peerId, track) {
        const funcName = 'VOIPManager._handleRemoteTrack';
        Logger.start(funcName);

        const stream = new MediaStream([track]);
        const audio = new Audio();
        audio.srcObject = stream;
        audio.play();

        this.remoteStreams.set(peerId, { stream, audio });

        EventBus.emit('voip:peer-connected', { peerId });
        Logger.message(`VOIPManager: Playing audio from ${peerId}`);
        Logger.end(funcName);
    }

    /**
     * Checks for voice activity on the local stream.
     * @private
     */
    _checkVoiceActivity() {
        const funcName = 'VOIPManager._checkVoiceActivity';
        Logger.start(funcName);
        if (!this.analyser) return;

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (const amplitude of dataArray) {
            sum += amplitude * amplitude;
        }
        const volume = Math.sqrt(sum / dataArray.length);

        const previouslySpeaking = this.isSpeaking;
        if (volume > this.speakingThreshold && !this.isSpeaking) {
            this.isSpeaking = true;
            EventBus.emit('voip:speaking-started');
        } else if (volume <= this.speakingThreshold && this.isSpeaking) {
            this.isSpeaking = false;
            EventBus.emit('voip:speaking-stopped');
        }

        if (previouslySpeaking !== this.isSpeaking) {
            Logger.logVariables({ isSpeaking: this.isSpeaking, volume });
        }
        Logger.end(funcName);
    }
}
