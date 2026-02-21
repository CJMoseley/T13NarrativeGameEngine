// src/t13ne/modules/audio/core/AudioManifestManager.js
import Logger from "/src/t13ne/core/Logger.js";

export class AudioManifestManager {
    constructor() {
        this.manifest = {
            samples: {},
            tracks: {},
            sequences: {},
            loops: {},
            midi: {},
            stems: {},
            instruments: {} // This is the Synthetic Store
        };
    }

    async loadManifest() {
        // Load Sample Store (from public/media)
        try {
            const response = await fetch('/media/audio/audio_assets_manifest.json');
            if (response.ok) {
                const loaded = await response.json();
                this.manifest.samples = { ...this.manifest.samples, ...loaded.samples };
                Logger.message("AudioManifestManager: Sample manifest loaded.");
            }
        } catch (e) {
            Logger.warn("AudioManifestManager: Could not load sample manifest", e);
        }

        // Load Synthetic Store (from T13NE data)
        try {
            const response = await fetch('/plugins/t13ne/data/json/music/synthetic_instruments.json');
            if (response.ok) {
                const loaded = await response.json();
                this.manifest.instruments = { ...this.manifest.instruments, ...loaded };
                Logger.message("AudioManifestManager: Synthetic manifest loaded.");
            }
        } catch (e) {
            // It's okay if this is missing initially
            Logger.message("AudioManifestManager: Synthetic manifest missing or empty.");
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
