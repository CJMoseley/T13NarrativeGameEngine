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
            instruments: {}
        };
        this.basePath = ''; // Will be detected upon load
    }

    async loadManifest() {
        try {
            // Prioritize the standard media/audio path where the generation script outputs
            let response = await fetch('/media/audio/audio_assets_manifest.json');
            if (!response.ok) {
                response = await fetch('/data/media/audio/audio_assets_manifest.json');
            }

            if (response.ok) {
                const loaded = await response.json();
                this.manifest = { ...this.manifest, ...loaded };
                
                // Detect base path from the successful URL to ensure assets are loaded relative to it
                const url = new URL(response.url, window.location.origin);
                // Remove the filename (audio_assets_manifest.json) to get the directory
                let path = url.pathname.substring(0, url.pathname.lastIndexOf('/'));
                this.basePath = path.startsWith('/') ? path.substring(1) : path;
                
                Logger.message(`AudioManifestManager: Manifest loaded from /${this.basePath}`);
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

        // If the manifest has a direct web path, use it.
        if (item.path) return item.path;

        let url = item.filename || id;

        // Normalize start
        if (url.startsWith('/')) url = url.substring(1);

        if (!url.match(/^(http|https|blob|data):/)) {
            // Force standard media/audio path if not present.
            // We ignore this.basePath because the manifest might be in /data/ while assets are in /media/
            if (!url.startsWith('media/audio/') && !url.startsWith('data/')) {
                // If it starts with media/ but not media/audio/, we assume it's relative to root media/
                if (!url.startsWith('media/')) {
                    url = `media/audio/${url}`;
                }
            }
            url = '/' + url;
        }

        // Heuristic: If no extension is present, assume .wav to prevent 404s on extensionless IDs
        if (!url.split('/').pop().includes('.')) {
            if (item.format) {
                url += `.${item.format}`;
            } else {
                url += '.wav';
            }
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
