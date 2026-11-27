/**
 * @module Modules/Audio/VoiceFXChain
 * @description Modular zero-server WebAudio & deterministic offline voice-modulation pipeline
 * parameterized by T13 Species Descendant + Formation Incarna (plus Wormhole Racers compatibility),
 * with safety limiting and one-click Accessibility Dry Bypass.
 */

import { resolveCharacterSpecies } from '../characters/T13SpeciesDescendant.js';
import { T13Effects } from './t13ne-effects.js';

export const SPECIES_VOICE_PRESETS = Object.freeze({
    neutral: { pitchSemitones: 0, formantShift: 0, ringModHz: 0, combMs: 0, chorusDepth: 0, drive: 0, reverbMix: 0, dryWet: 0 },
    'giant-kaiju': { pitchSemitones: -5.5, formantShift: -0.35, ringModHz: 0, combMs: 14, chorusDepth: 0, drive: 18, reverbMix: 0.25, dryWet: 0.7 },
    'fae-small': { pitchSemitones: 4.5, formantShift: 0.35, ringModHz: 0, combMs: 0, chorusDepth: 0.35, drive: 0, reverbMix: 0.3, dryWet: 0.65 },
    'chitin-click': { pitchSemitones: 1.5, formantShift: 0.25, ringModHz: 48, combMs: 7, chorusDepth: 0.45, drive: 10, reverbMix: 0.1, dryWet: 0.6 },
    'subharmonic-growl': { pitchSemitones: -2.5, formantShift: -0.18, ringModHz: 32, combMs: 11, chorusDepth: 0, drive: 28, reverbMix: 0.15, dryWet: 0.5 },
    'deep-resonator': { pitchSemitones: -4.0, formantShift: -0.28, ringModHz: 0, combMs: 18, chorusDepth: 0, drive: 8, reverbMix: 0.4, dryWet: 0.65 },
    'hive-chorus': { pitchSemitones: 0.5, formantShift: 0.12, ringModHz: 24, combMs: 9, chorusDepth: 0.85, drive: 6, reverbMix: 0.25, dryWet: 0.7 },
    'ethereal-shimmer': { pitchSemitones: 2.5, formantShift: 0.22, ringModHz: 0, combMs: 0, chorusDepth: 0.65, drive: 0, reverbMix: 0.55, dryWet: 0.6 },
    'metallic-ring': { pitchSemitones: 0, formantShift: 0.15, ringModHz: 110, combMs: 6, chorusDepth: 0.2, drive: 15, reverbMix: 0.15, dryWet: 0.6 },
    'synth-vocoder': { pitchSemitones: -1.0, formantShift: 0.1, ringModHz: 145, combMs: 5, chorusDepth: 0.3, drive: 35, reverbMix: 0.1, dryWet: 0.75 }
});

export const FORMATION_VOICE_OVERLAYS = Object.freeze({
    Nature: { ringModHz: 0, combMs: 0, chorusDepth: 0, drive: 0, reverbMix: 0 },
    Trial: { ringModHz: 95, combMs: 6, drive: 14, reverbMix: 0.1 },
    Craft: { ringModHz: 65, combMs: 8, drive: 10 },
    Inertia: { ringModHz: 18, combMs: 12, chorusDepth: 0.2 },
    Burden: { pitchSemitones: -2, formantShift: -0.15, combMs: 18, reverbMix: 0.35 },
    Phoenix: { drive: 26, formantShift: 0.08, reverbMix: 0.2 },
    Fury: { chorusDepth: 0.55, combMs: 10, formantShift: -0.08 },
    Gossamer: { chorusDepth: 0.45, reverbMix: 0.5, formantShift: 0.15 },
    Awe: { chorusDepth: 0.4, reverbMix: 0.45, pitchSemitones: 1 },
    Dominion: { chorusDepth: 0.9, combMs: 9, dryWet: 0.65 },
    Orthodox: { ringModHz: 135, drive: 30, combMs: 5 },
    Heresy: { ringModHz: 120, drive: 28, chorusDepth: 0.35 },
    Wyrd: { ringModHz: 52, chorusDepth: 0.55, reverbMix: 0.35 },
    Enigma: { pitchSemitones: -1.5, reverbMix: 0.45, combMs: 13 },
    Virtue: { chorusDepth: 0.5, reverbMix: 0.4, formantShift: 0.12 },
    Sin: { pitchSemitones: -1, drive: 20, combMs: 10 },
    Miasma: { ringModHz: 38, drive: 22, formantShift: -0.12 },
    Rook: { combMs: 15, drive: 12, formantShift: -0.1 },
    Quiet: { combMs: 11, reverbMix: 0.25 },
    Jeer: { pitchSemitones: 2, formantShift: 0.18, chorusDepth: 0.4 },
    Key: { ringModHz: 72, reverbMix: 0.25 },
    Liberty: { chorusDepth: 0.6, reverbMix: 0.35 },
    Yonder: { pitchSemitones: 1.5, ringModHz: 84, reverbMix: 0.4 },
    Zeal: { drive: 16, chorusDepth: 0.35 }
});

/**
 * Resolves effective VoiceFX parameters from a T13 Character, T13 Species Descendant,
 * adapted Wormhole Racers species, or explicit preset config.
 */
export function resolveVoiceFXConfig(characterOrSpecies = null, overrides = {}) {
    if (typeof characterOrSpecies === 'string') {
        const preset = SPECIES_VOICE_PRESETS[characterOrSpecies] ?? SPECIES_VOICE_PRESETS.neutral;
        return {
            preset: characterOrSpecies,
            ...preset,
            accessibilityBypass: false,
            ...overrides
        };
    }

    const resolved = characterOrSpecies ? resolveCharacterSpecies(characterOrSpecies, overrides.species ?? null) : null;
    const baseProfile = resolved?.voiceProfile ?? characterOrSpecies?.voiceProfile ?? { preset: 'neutral' };
    const presetName = overrides.preset ?? baseProfile.preset ?? 'neutral';
    const presetDefaults = SPECIES_VOICE_PRESETS[presetName] ?? SPECIES_VOICE_PRESETS.neutral;
    const formation = overrides.formation ?? resolved?.formation ?? characterOrSpecies?.incarna ?? 'Nature';
    const formationOverlay = FORMATION_VOICE_OVERLAYS[formation] ?? FORMATION_VOICE_OVERLAYS.Nature;

    const merged = {
        preset: presetName,
        formation,
        pitchSemitones: (baseProfile.pitchSemitones ?? presetDefaults.pitchSemitones ?? 0) + (formationOverlay.pitchSemitones ?? 0),
        formantShift: (baseProfile.formantShift ?? presetDefaults.formantShift ?? 0) + (formationOverlay.formantShift ?? 0),
        ringModHz: baseProfile.ringModHz ?? (presetDefaults.ringModHz || formationOverlay.ringModHz || 0),
        combMs: baseProfile.combMs ?? (presetDefaults.combMs || formationOverlay.combMs || 0),
        chorusDepth: Math.max(presetDefaults.chorusDepth || 0, formationOverlay.chorusDepth || 0),
        drive: Math.max(presetDefaults.drive || 0, formationOverlay.drive || 0),
        reverbMix: Math.max(presetDefaults.reverbMix || 0, formationOverlay.reverbMix || 0),
        dryWet: overrides.dryWet ?? baseProfile.dryWet ?? formationOverlay.dryWet ?? presetDefaults.dryWet ?? 0,
        accessibilityBypass: Boolean(overrides.accessibilityBypass)
    };

    if (formation !== 'Nature' && merged.dryWet === 0 && presetName === 'neutral') {
        merged.dryWet = 0.55;
    }
    return merged;
}

/**
 * Deterministic offline DSP simulation of VoiceFXChain for automated spectral/formant & safety tests.
 */
export function processSamplesOffline(samples, sampleRate = 44100, config = {}) {
    const out = new Float32Array(samples.length);
    if (config.accessibilityBypass || (config.dryWet ?? 0) <= 0) {
        out.set(samples);
        return out;
    }

    const mix = Math.max(0, Math.min(1, config.dryWet ?? 0.6));
    const formantFactor = Math.pow(2, (config.pitchSemitones ?? 0) / 12) * (1 + (config.formantShift ?? 0));
    const fc = Math.max(180, Math.min(4500, 900 * formantFactor));

    // Simple 1-pole resonant bandpass/lowpass formant shaping + comb + ring mod + soft limiter
    const dt = 1 / sampleRate;
    const rcLp = 1 / (2 * Math.PI * fc);
    const alphaLp = dt / (rcLp + dt);
    const combSamples = Math.max(1, Math.min(2048, Math.round(((config.combMs || 0) / 1000) * sampleRate)));
    const combBuf = new Float32Array(combSamples);
    let lpState = 0;
    let combIdx = 0;

    for (let i = 0; i < samples.length; i++) {
        const dry = samples[i];
        lpState = lpState + alphaLp * (dry - lpState);
        let wet = lpState;

        if ((config.formantShift ?? 0) > 0.05 || (config.pitchSemitones ?? 0) > 0.5) {
            // Emphasize upper formants (high-pass emphasis)
            wet = dry - lpState * 0.55 + lpState * 0.45;
        }

        if (config.ringModHz > 0) {
            const carrier = Math.sin((2 * Math.PI * config.ringModHz * i) / sampleRate);
            wet = wet * (0.45 + 0.55 * carrier);
        }

        if (config.combMs > 0) {
            const delayed = combBuf[combIdx];
            wet = wet + delayed * 0.42;
            combBuf[combIdx] = wet;
            combIdx = (combIdx + 1) % combSamples;
        }

        if (config.chorusDepth > 0) {
            const modIdx = (combIdx + Math.floor(8 * (1 + Math.sin(2 * Math.PI * 2.5 * i / sampleRate)))) % combSamples;
            wet = wet * 0.75 + combBuf[modIdx] * 0.35 * config.chorusDepth;
        }

        if (config.drive > 0) {
            const k = 1 + config.drive * 0.08;
            wet = Math.tanh(wet * k);
        }

        let mixed = dry * (1 - mix) + wet * mix;
        // Safety brick-wall soft limiter (clamped strictly <= 0.98)
        if (Math.abs(mixed) > 0.85) {
            mixed = Math.sign(mixed) * (0.85 + 0.13 * Math.tanh((Math.abs(mixed) - 0.85) / 0.13));
        }
        out[i] = Math.max(-0.98, Math.min(0.98, mixed));
    }
    return out;
}

/**
 * Live WebAudio VoiceFXChain node graph.
 */
export class VoiceFXChain {
    constructor(audioContext, config = {}) {
        this.ctx = audioContext;
        this.effects = new T13Effects(audioContext);
        this.config = resolveVoiceFXConfig(config);
        this._oscillators = [];

        this.input = audioContext.createGain();
        this.dryGain = audioContext.createGain();
        this.wetGain = audioContext.createGain();
        this.output = audioContext.createDynamicsCompressor();
        this.output.threshold.value = -3;
        this.output.knee.value = 0;
        this.output.ratio.value = 20;
        this.output.attack.value = 0.003;
        this.output.release.value = 0.1;

        this.formantFilter = audioContext.createBiquadFilter();
        this.formantFilter.type = 'bandpass';
        this.formantFilter.frequency.value = 950;
        this.formantFilter.Q.value = 1.1;

        this.combDelay = typeof audioContext.createDelay === 'function' ? audioContext.createDelay(0.1) : null;
        this.combFeedback = audioContext.createGain();
        this.combFeedback.gain.value = 0;

        this.distortion = typeof audioContext.createWaveShaper === 'function' ? this.effects.createDistortion(0) : null;

        // Wire dry path
        this.input.connect(this.dryGain);
        this.dryGain.connect(this.output);

        // Wire wet path
        this.input.connect(this.formantFilter);
        let tail = this.formantFilter;
        if (this.combDelay) {
            tail.connect(this.combDelay);
            this.combDelay.connect(this.combFeedback);
            this.combFeedback.connect(this.combDelay);
            tail.connect(this.wetGain);
            this.combDelay.connect(this.wetGain);
        }
        if (this.distortion) {
            tail.connect(this.distortion);
            this.distortion.connect(this.wetGain);
        } else {
            tail.connect(this.wetGain);
        }
        this.wetGain.connect(this.output);

        this.applyProfile(this.config);
    }

    applyProfile(characterOrSpecies, overrides = {}) {
        this.config = resolveVoiceFXConfig(characterOrSpecies, overrides);
        const now = this.ctx.currentTime ?? 0;

        const formantScale = Math.pow(2, (this.config.pitchSemitones ?? 0) / 12) * (1 + (this.config.formantShift ?? 0));
        const freq = Math.max(200, Math.min(4800, 950 * formantScale));
        if (typeof this.formantFilter.frequency?.setTargetAtTime === 'function') {
            this.formantFilter.frequency.setTargetAtTime(freq, now, 0.02);
        } else {
            this.formantFilter.frequency.value = freq;
        }

        if (this.combDelay) {
            this.combDelay.delayTime.value = Math.max(0.001, (this.config.combMs || 0) / 1000);
            this.combFeedback.gain.value = this.config.combMs > 0 ? 0.38 : 0;
        }

        this._updateMixGains();
        return this.config;
    }

    setDryWet(mix) {
        this.config.dryWet = Math.max(0, Math.min(1, Number(mix) || 0));
        this._updateMixGains();
    }

    setAccessibilityBypass(enabled) {
        this.config.accessibilityBypass = Boolean(enabled);
        this._updateMixGains();
    }

    _updateMixGains() {
        const mix = this.config.accessibilityBypass ? 0 : Math.max(0, Math.min(1, this.config.dryWet ?? 0));
        this.dryGain.gain.value = 1 - mix;
        this.wetGain.gain.value = mix;
    }

    dispose() {
        for (const osc of this._oscillators) {
            try { osc.stop(); osc.disconnect(); } catch (e) {}
        }
        this._oscillators = [];
        try {
            this.input.disconnect();
            this.dryGain.disconnect();
            this.wetGain.disconnect();
            this.output.disconnect();
        } catch (e) {}
    }
}
