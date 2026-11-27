import test from 'node:test';
import assert from 'node:assert/strict';

import { SoundEngine, AUDIO_BUS_NAMES } from '../src/t13ne/core/SoundEngine.js';
import { VOIPManager, evaluateVADFrame } from '../src/t13ne/core/VOIPManager.js';
import { WebRTCManager } from '../src/t13ne/net/WebRTCManager.js';
import { EventBus } from '../src/t13ne/core/EventBus.js';
import { T13NE_AudioDirector } from '../src/t13ne/modules/audio/t13ne-audio-director.js';
import {
    ARRANGEMENT_REGISTERS,
    chooseSmoothVoicing,
    isPitchClassInMode,
    snapNoteToMode,
    voiceLeadProgression,
    voiceLeadingCost
} from '../src/t13ne/modules/audio/core/MusicCompositionRules.js';
import {
    FORMATION_VOICE_OVERLAYS,
    SPECIES_VOICE_PRESETS,
    VoiceFXChain,
    processSamplesOffline,
    resolveVoiceFXConfig
} from '../src/t13ne/modules/audio/VoiceFXChain.js';
import { createHumanSpeciesDescendant, createSpeciesDescendant } from '../src/t13ne/modules/characters/T13SpeciesDescendant.js';
import { adaptWormholeSpeciesToT13Descendant } from '../src/t13ne/games/wormhole-racers/WormholeSpeciesAdapter.js';

function createMockAudioContext() {
    const makeGain = () => ({
        gain: {
            value: 1,
            setValueAtTime(v) { this.value = v; },
            setTargetAtTime(v) { this.value = v; },
            linearRampToValueAtTime(v) { this.value = v; },
            exponentialRampToValueAtTime(v) { this.value = v; }
        },
        connect() {},
        disconnect() {}
    });
    const makeAnalyser = () => ({
        fftSize: 256,
        frequencyBinCount: 128,
        mockTimeByte: 128,
        connect() {},
        disconnect() {},
        getByteTimeDomainData(arr) { arr.fill(this.mockTimeByte); },
        getByteFrequencyData(arr) { arr.fill(0); }
    });
    return {
        currentTime: 0,
        sampleRate: 44100,
        state: 'running',
        destination: { connect() {} },
        createGain: makeGain,
        createAnalyser: makeAnalyser,
        createBiquadFilter: () => ({ type: 'bandpass', frequency: { value: 950, setTargetAtTime(v) { this.value = v; } }, Q: { value: 1 }, connect() {}, disconnect() {} }),
        createDelay: () => ({ delayTime: { value: 0 }, connect() {}, disconnect() {} }),
        createWaveShaper: () => ({ curve: null, oversample: '4x', connect() {}, disconnect() {} }),
        createDynamicsCompressor: () => ({ threshold: { value: -3 }, knee: { value: 0 }, ratio: { value: 20 }, attack: { value: 0.01 }, release: { value: 0.1 }, connect() {}, disconnect() {} }),
        createPanner: () => ({ panningModel: 'HRTF', distanceModel: 'inverse', positionX: { value: 0 }, positionY: { value: 0 }, positionZ: { value: 0 }, connect() {}, disconnect() {} }),
        createOscillator: () => ({ type: 'sine', frequency: { value: 440, setValueAtTime(v) { this.value = v; }, exponentialRampToValueAtTime(v) { this.value = v; } }, connect() {}, start() {}, stop() {}, disconnect() {} }),
        createMediaStreamSource: () => ({ connect() {}, disconnect() {} }),
        createMediaStreamDestination: () => {
            const outTrack = { kind: 'audio', enabled: true, stop() {} };
            return { stream: { getAudioTracks: () => [outTrack] }, connect() {}, disconnect() {} };
        },
        resume: async () => {},
        suspend: async () => {}
    };
}

test('SoundEngine initializes 5-bus mixer with mute, volume, metering, and headless safety', () => {
    const headless = new SoundEngine();
    headless.init(); // Should not throw without window/AudioContext
    assert.equal(headless.getBusLevel('master'), 0);

    const ctx = createMockAudioContext();
    const se = new SoundEngine();
    se.init(ctx);
    assert.equal(se.isInitialized, true);
    for (const bus of AUDIO_BUS_NAMES) {
        assert.ok(se.getBus(bus), `Bus '${bus}' exists`);
    }

    se.setBusVolume('voip', 0.75);
    assert.equal(se.getBusVolume('voip'), 0.75);
    se.setBusMuted('sfx', true);
    assert.equal(se.isBusMuted('sfx'), true);
    assert.equal(se.getBus('sfx').gain.value, 0);
    se.setBusMuted('sfx', false);
    assert.equal(se.getBus('sfx').gain.value, 1);

    // Simulate non-zero signal on voip analyser
    se.buses.get('voip').analyser.mockTimeByte = 192;
    assert.ok(se.getBusLevel('voip') > 0.4);
});

test('MusicCompositionRules enforces strict Mode adherence and smooth voice leading', () => {
    const dorianSnapped = snapNoteToMode(64, 0, 'Dorian', ARRANGEMENT_REGISTERS.pad); // E4 -> Eb4 (63) in C Dorian
    assert.equal(isPitchClassInMode(dorianSnapped, 0, 'Dorian'), true);
    assert.equal(dorianSnapped, 63);

    const prog = voiceLeadProgression(
        [[0, 4, 7], [5, 9, 0], [7, 11, 2], [0, 4, 7]],
        'Ionian',
        0,
        'pad'
    );
    assert.equal(prog.length, 4);
    for (const chord of prog) {
        for (const note of chord) {
            assert.equal(isPitchClassInMode(note, 0, 'Ionian'), true);
            assert.ok(note >= ARRANGEMENT_REGISTERS.pad.minMidi && note <= ARRANGEMENT_REGISTERS.pad.maxMidi);
        }
    }
    const cost = voiceLeadingCost(prog[0], prog[1]);
    assert.ok(cost <= 9, `Smooth voice leading keeps total semitone motion compact (got ${cost})`);
    const raw = chooseSmoothVoicing([60, 64, 67], [5, 9, 0], ARRANGEMENT_REGISTERS.pad);
    assert.deepEqual(raw, [60, 65, 69]);
});

test('T13NE_AudioDirector responds to live session events with mood, rhythm hot-swapping, and Foley', async () => {
    const ctx = createMockAudioContext();
    const se = new SoundEngine();
    se.init(ctx);

    const patternsSet = [];
    const ambienceUpdates = [];
    const mockMusic = {
        synth: { ctx, sfxGain: se.getBus('sfx') },
        setRhythm(name) { patternsSet.push(name); return true; },
        updateAmbience(plot) { ambienceUpdates.push(plot.tensionLevel); }
    };
    const director = new T13NE_AudioDirector();
    await director.initialize({
        soundEngine: se,
        getModule: (name) => (name === 'Music' ? mockMusic : null)
    });

    const listeners = [];
    const mockClient = {
        on(evt, fn) { if (evt === 'event') listeners.push(fn); return () => {}; }
    };
    director.bindSession(mockClient);

    for (const fn of listeners) {
        fn({ type: 'Ordeal:Started', payload: {} });
        fn({ type: 'Test:Performed', payload: { rolls: [6, 5] } });
        fn({ type: 'Card:Played', payload: {} });
        fn({ type: 'Hitch:Evaluated', payload: {} });
        fn({ type: 'Wound:Applied', payload: {} });
        fn({ type: 'Ordeal:Resolved', payload: {} });
    }

    assert.deepEqual(patternsSet, ['Driving', 'BasicRock']);
    assert.ok(ambienceUpdates.length >= 2);
    assert.ok(director.sfxLog.some(e => e.name === 'dice-roll'));
    assert.ok(director.sfxLog.some(e => e.name === 'card-play'));
    assert.ok(director.sfxLog.some(e => e.name === 'hitch-sting'));
    assert.ok(director.sfxLog.some(e => e.name === 'wound-impact'));
});

test('VOIPManager handles VAD hysteresis, dynamic peer join/leave after start(), PTT, spatialization, and cleanup', async () => {
    const ctx = createMockAudioContext();
    const se = new SoundEngine();
    se.init(ctx);

    // Mock global RTCPeerConnection for WebRTCManager
    globalThis.RTCPeerConnection = class {
        constructor() { this.senders = []; this.closed = false; }
        addTrack(t) { this.senders.push({ track: t }); }
        close() { this.closed = true; }
    };
    const rtc = new WebRTCManager(null, {});
    const voip = new VOIPManager(rtc, se);

    const fakeTrack = { kind: 'audio', enabled: true, stopped: false, stop() { this.stopped = true; } };
    const fakeStream = { getTracks: () => [fakeTrack], getAudioTracks: () => [fakeTrack] };
    try {
        await voip.init(fakeStream);
        voip.start();

        // VAD hysteresis: requires attack frame and release frames (doesn't flicker on 1 quiet frame)
        const loud = new Uint8Array(64).fill(35);
        const quiet = new Uint8Array(64).fill(2);
        let vad = voip.processVADBins(loud);
        assert.equal(vad.isSpeaking, true);
        assert.equal(vad.transition, 'started');
        vad = voip.processVADBins(quiet);
        assert.equal(vad.isSpeaking, true, 'Hysteresis holds speaking across 1 quiet frame');
        voip.processVADBins(quiet);
        vad = voip.processVADBins(quiet);
        assert.equal(vad.isSpeaking, false, 'Hysteresis stops after sustained quiet frames');
        assert.equal(vad.transition, 'stopped');

        // Push-to-talk gating
        voip.setPushToTalkMode(true);
        assert.equal(voip.outboundStream.getAudioTracks()[0].enabled, false);
        voip.setPushToTalkActive(true);
        assert.equal(voip.outboundStream.getAudioTracks()[0].enabled, true);

        // Peer joins AFTER start() -> receives existing local tracks and dynamic remote stream routes into voip bus
        const pcLate = rtc.createPeerConnection('late-peer');
        assert.equal(pcLate.senders.length, 1);
        const remoteTrack = { kind: 'audio', stopped: false, stop() { this.stopped = true; } };
        EventBus.emit('webrtc:remote-track', {
            peerId: 'late-peer',
            track: remoteTrack,
            stream: { getTracks: () => [remoteTrack] }
        });
        assert.ok(voip.remoteStreams.has('late-peer'));
        voip.setPeerPosition('late-peer', { x: 4, y: 0, z: -3 });
        assert.equal(voip.remoteStreams.get('late-peer').panner.positionX.value, 4);
        voip.setPeerMuted('late-peer', true);
        assert.equal(voip.remoteStreams.get('late-peer').gainNode.gain.value, 0);

        // Leaving cleans up peer track and entry
        rtc.close('late-peer');
        assert.equal(voip.remoteStreams.has('late-peer'), false);
        assert.equal(remoteTrack.stopped, true);
    } finally {
        voip.stop();
        delete globalThis.RTCPeerConnection;
    }
    assert.equal(fakeTrack.stopped, true);
});

test('VoiceFXChain resolves T13 Species Descendant + Formation + Wormhole Racers profiles, transforms spectrum safely, and supports dry bypass', () => {
    const sampleRate = 44100;
    const len = 4096;
    const input = new Float32Array(len);
    for (let i = 0; i < len; i++) {
        // Synthetic speech-like complex tone (180 Hz fundamental + 600 Hz + 1900 Hz formants)
        input[i] = 0.45 * Math.sin(2 * Math.PI * 180 * i / sampleRate)
            + 0.3 * Math.sin(2 * Math.PI * 600 * i / sampleRate)
            + 0.25 * Math.sin(2 * Math.PI * 1900 * i / sampleRate);
    }

    const human = createHumanSpeciesDescendant();
    const humanCfg = resolveVoiceFXConfig(human);
    assert.equal(humanCfg.preset, 'neutral');
    const humanOut = processSamplesOffline(input, sampleRate, humanCfg);
    assert.deepEqual(Array.from(humanOut), Array.from(input));

    // Giant/Kaiju + Burden Formation vs Fae + Gossamer Formation produce distinct spectral transformations
    const kaiju = createSpeciesDescendant({
        id: 'sp-kaiju',
        name: 'Titan',
        incarna: 'Burden',
        voiceProfile: { ...SPECIES_VOICE_PRESETS['giant-kaiju'], preset: 'giant-kaiju' }
    });
    const fae = createSpeciesDescendant({
        id: 'sp-fae',
        name: 'Sylph',
        incarna: 'Gossamer',
        voiceProfile: { ...SPECIES_VOICE_PRESETS['fae-small'], preset: 'fae-small' }
    });
    const kaijuCfg = resolveVoiceFXConfig(kaiju);
    const faeCfg = resolveVoiceFXConfig(fae);
    const kaijuOut = processSamplesOffline(input, sampleRate, kaijuCfg);
    const faeOut = processSamplesOffline(input, sampleRate, faeCfg);

    const rmsDiff = (a, b) => Math.sqrt(a.reduce((acc, v, i) => acc + (v - b[i]) ** 2, 0) / a.length);
    assert.ok(rmsDiff(kaijuOut, input) > 0.05, 'Kaiju FX alters signal');
    assert.ok(rmsDiff(faeOut, kaijuOut) > 0.05, 'Fae and Kaiju FX differ measurably');

    // Safety limiter bounds even with hot input
    const hotInput = input.map(v => v * 4);
    const hotOut = processSamplesOffline(hotInput, sampleRate, { ...kaijuCfg, dryWet: 1, drive: 50 });
    for (let i = 0; i < hotOut.length; i++) {
        assert.ok(Math.abs(hotOut[i]) <= 0.9801, `Sample ${i} clamped by safety limiter (${hotOut[i]})`);
    }

    // Accessibility dry-bypass produces exact identity
    const bypassed = processSamplesOffline(input, sampleRate, { ...kaijuCfg, accessibilityBypass: true });
    assert.deepEqual(Array.from(bypassed), Array.from(input));

    // Wormhole Racers compatibility via adapter + live WebAudio VoiceFXChain
    const kathorri = adaptWormholeSpeciesToT13Descendant({ id: 'SPECIES_KATHORRI', name: 'Kathorri' });
    const kCfg = resolveVoiceFXConfig(kathorri);
    assert.equal(kCfg.preset, 'hive-chorus');
    assert.equal(kCfg.formation, 'Burden');

    // All 24 Formations have defined overlays
    assert.equal(Object.keys(FORMATION_VOICE_OVERLAYS).length, 24);

    const ctx = createMockAudioContext();
    const chain = new VoiceFXChain(ctx, kaiju);
    assert.ok(chain.dryGain.gain.value < 1 && chain.wetGain.gain.value > 0);
    chain.setAccessibilityBypass(true);
    assert.equal(chain.dryGain.gain.value, 1);
    assert.equal(chain.wetGain.gain.value, 0);
    chain.dispose();
});
