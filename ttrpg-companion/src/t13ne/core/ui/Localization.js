import Logger from '../Logger.js';

/**
 * Localization Service
 * Handles loading language files and providing translations.
 */
class Localization {
    constructor() {
        this.currentLanguage = 'en-gb';
        this.translations = {};
        this.fallbackLanguage = 'en-int';
        this.isLoaded = false;
    }

    /**
     * Initializes the localization service by loading the current language file.
     * @param {string} [lang] - Optional language code to load.
     */
    async initialize(lang) {
        if (lang) this.currentLanguage = lang;
        await this.loadLanguage(this.currentLanguage);
        this.isLoaded = true;
        Logger.message(`Localization: Initialized for language '${this.currentLanguage}'.`);
    }

    /**
     * Loads a translation JSON file from the public data directory.
     * @param {string} lang - The language code (e.g., 'en-gb', 'es').
     */
    async loadLanguage(lang) {
        try {
            const response = await fetch(`/data/languages/${lang}.json`);
            if (!response.ok) throw new Error(`Failed to load language file: ${lang}`);
            this.translations = await response.json();
            this.currentLanguage = lang;
        } catch (error) {
            Logger.error(`Localization: Error loading language '${lang}':`, error);
            if (lang !== this.fallbackLanguage) {
                Logger.message(`Localization: Falling back to '${this.fallbackLanguage}'.`);
                await this.loadLanguage(this.fallbackLanguage);
            }
        }
    }

    /**
     * Translates a key into the current language.
     * @param {string} key - The translation key.
     * @param {object} [placeholders] - Optional placeholders to replace in the string.
     * @returns {string} The translated string or the key itself if not found.
     */
    __(key, placeholders = {}) {
        let translation = this.translations[key] || key;

        // Replace placeholders (e.g., {name})
        Object.keys(placeholders).forEach(p => {
            translation = translation.replace(new RegExp(`{${p}}`, 'g'), placeholders[p]);
        });

        return translation;
    }

    /**
     * Sets the current language and reloads translations.
     * @param {string} lang - The language code.
     */
    async setLanguage(lang) {
        await this.loadLanguage(lang);
        // We could emit an event here to notify UI components to refresh
        // EventBus.emit('language:changed', lang);
    }
}

export default new Localization();
