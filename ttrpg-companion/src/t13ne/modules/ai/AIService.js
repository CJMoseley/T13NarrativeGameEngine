﻿import Logger from "/src/t13ne/core/Logger.js";
import OpenAI from 'https://esm.sh/openai';

/**
 * AIService handles interactions with external AI providers.
 * Supports: OpenAI, Gemini, Ollama (Local), and Mock.
 */
class AIService {
    constructor() {
        this.openai = null;
        this.config = {
            provider: 'mock', // 'openai', 'gemini', 'ollama', 'mock'
            apiKey: '',
            baseUrl: 'http://localhost:11434', // Default for Ollama
            model: '', // Default model
            temperature: 0.7,
            systemPrompt: 'You are a helpful AI assistant for a TTRPG system.',
            retries: 3,
            retryDelay: 1000
        };
    }

    /**
     * Configures the AI Service.
     * @param {object} config 
     */
    configure(config = {}) {
        this.config = { ...this.config, ...config };

        if (this.config.provider === 'openai' && this.config.apiKey) {
            try {
                this.openai = new OpenAI({
                    apiKey: this.config.apiKey,
                    dangerouslyAllowBrowser: true
                });
                Logger.message("AIService: OpenAI SDK initialized.");
            } catch (error) {
                Logger.error("AIService: Failed to initialize OpenAI SDK:", error);
            }
        }
        Logger.message(`AIService: Configured for provider '${this.config.provider}'`);
    }

    /**
     * Generates text based on a prompt using the configured provider.
     * @param {string} prompt 
     * @param {object} [options={}] - Optional overrides (e.g. temperature, retries, retryDelay).
     * @returns {Promise<string>}
     */
    async generateText(prompt, options = {}) {
        if (!prompt) return "";

        const retries = options.retries ?? this.config.retries ?? 3;
        const retryDelay = options.retryDelay ?? this.config.retryDelay ?? 1000;
        let attempt = 0;

        while (attempt <= retries) {
            try {
                switch (this.config.provider) {
                    case 'openai':
                        return await this._generateOpenAI(prompt, options);
                    case 'gemini':
                        return await this._generateGemini(prompt, options);
                    case 'ollama':
                        return await this._generateOllama(prompt, options);
                    case 'mock':
                    default:
                        return await this._generateMock(prompt, options);
                }
            } catch (error) {
                attempt++;
                if (attempt > retries) {
                    Logger.error(`AIService: Error generating text with ${this.config.provider} after ${attempt} attempts:`, error);
                    return `[AI Error: ${error.message}]`;
                }
                Logger.warn(`AIService: Generation failed (Attempt ${attempt}/${retries + 1}). Retrying in ${retryDelay}ms... Error: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    /**
     * Retrieves the list of available models from the Ollama instance.
     * @returns {Promise<string[]>} A list of model names.
     */
    async getAvailableModels() {
        if (this.config.provider !== 'ollama') {
            Logger.warn("AIService: getAvailableModels is only supported for 'ollama' provider.");
            return [];
        }

        const baseUrl = this.config.baseUrl || 'http://localhost:11434';
        const url = `${baseUrl}/api/tags`;

        try {
            const response = await this._fetchWithTimeout(url, {}, 3000); // 3s timeout for model list
            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.statusText}`);
            }
            const data = await response.json();
            return data.models || [];
        } catch (error) {
            Logger.error("AIService: Error fetching Ollama models:", error);
            return [];
        }
    }

    async _generateOpenAI(prompt, options = {}) {
        if (!this.openai) throw new Error("OpenAI not initialized.");
        const model = this.config.model || 'gpt-3.5-turbo';

        const completion = await this.openai.chat.completions.create({
            messages: [
                { role: "system", content: this.config.systemPrompt },
                { role: "user", content: prompt }
            ],
            model: model,
            temperature: options.temperature ?? this.config.temperature,
        });

        return completion.choices[0].message.content;
    }

    async _generateGemini(prompt, options = {}) {
        if (!this.config.apiKey) throw new Error("Gemini API Key is missing.");
        const model = this.config.model || 'gemini-pro';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`;

        const response = await this._fetchWithTimeout(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: this.config.systemPrompt + "\n\n" + prompt }] }],
                generationConfig: { temperature: options.temperature ?? this.config.temperature }
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || response.statusText);
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    async _generateOllama(prompt, options = {}) {
        const baseUrl = this.config.baseUrl || 'http://localhost:11434';
        const model = this.config.model;
        if (!model) throw new Error("AIService: Model not configured for Ollama provider.");

        const url = `${baseUrl}/api/generate`; // Use /api/generate for streaming
        Logger.message(`AIService: Calling Ollama at ${url} with model ${model}`);

        const response = await this._fetchWithTimeout(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                prompt: `${this.config.systemPrompt}\n\n${prompt}`,
                stream: false, // Set to false to get a single response object
                options: { temperature: options.temperature ?? this.config.temperature }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Ollama API Error: ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        return data.response || "";
    }

    async _generateMock(prompt, options = {}) {
        // Updated mock to return a high-quality JSON response as expected by the name generator.
        return new Promise(resolve => {
            setTimeout(() => {
                const mockResponse = {
                    common: "Praxos",
                    full: "Praxos Star System",
                    aliases: "PX-7, The Void's Lantern, G'teth"
                };
                resolve(JSON.stringify(mockResponse, null, 2));
            }, 300);
        });
    }

    /**
     * Helper to fetch with a timeout.
     * @param {string} url 
     * @param {object} options 
     * @param {number} timeout - Timeout in ms (default 10000)
     */
    async _fetchWithTimeout(url, options = {}, timeout = 10000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }
}

export default new AIService();
