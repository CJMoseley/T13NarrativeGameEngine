// src/t13ne/modules/audio/core/AudioManifestManager.js
import Logger from "../../../core/Logger.js";

export class AudioManifestManager {
    constructor() {
        this.manifest = {
            samples: {},
            tracks: {},
            sequences: {},
            loops: {},
            midi: {},
            stems: {},
            instruments: {}
        };
    }

    async loadManifest() {
        try {
            const response = await fetch('/media/audio/audio_assets_manifest.json');
            if (response.ok) {
                const loaded = await response.json();
                this.manifest = { ...this.manifest, ...loaded };
                Logger.message("AudioManifestManager: Manifest loaded from disk.");
            } else {
                Logger.warn("AudioManifestManager: Could not load audio_assets_manifest.json");
            }
        } catch (e) {
            Logger.warn("AudioManifestManager: Error loading manifest", e);
        }
    }

    addToManifest(category, id, data) {
        if (!this.manifest[category]) this.manifest[category] = {};
        this.manifest[category][id] = data;
    }

    getAssetAnalysis(category, id) {
        return this.manifest[category]?.[id]?.analysis || null;
    }

    updateAssetAnalysis(category, id, analysis) {
        if (this.manifest[category] && this.manifest[category][id]) {
            this.manifest[category][id].analysis = analysis;
        }
    }

    getAssetPath(category, id) {
        const item = this.manifest[category]?.[id];
        if (!item) return null;

        if (item.path) return item.path;

        let url = item.filename || id;

        // Robust path normalization
        if (!url.match(/^(http|https|blob|data):/)) {
            // Remove leading slash for consistent checking
            let cleanUrl = url.startsWith('/') ? url.substring(1) : url;

            // Ensure it starts with media/audio/ if it doesn't already (and isn't in public/)
            if (!cleanUrl.startsWith('media/') && !cleanUrl.startsWith('public/')) {
                cleanUrl = `media/audio/${cleanUrl}`;
            }

            // Add root slash
            url = '/' + cleanUrl;
        }

        // Heuristic: If no extension is present, assume .wav to prevent 404s on extensionless IDs
        if (!url.split('/').pop().includes('.')) {
            url += '.wav';
        }

        return url;
    }

    saveAnalysis(category, id, analysis, isNew = false) {
        if (!this.manifest[category]) this.manifest[category] = {};
        if (!this.manifest[category][id]) this.manifest[category][id] = {};

        this.manifest[category][id].analysis = analysis;
        if (isNew) this.manifest[category][id].type = 'synthetic';
    }
}
