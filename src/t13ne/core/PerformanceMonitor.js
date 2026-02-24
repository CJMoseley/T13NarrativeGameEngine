import Logger from '/src/t13ne/core/Logger.js';
import { EventBus } from '/src/t13ne/core/EventBus.js';

export class PerformanceMonitor {
    constructor(viewManager) {
        this.viewManager = viewManager;
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fps = 60;
        this.tier = 'high'; // high, medium, low
        this.isRunning = false;

        this.fpsHistory = [];
        this.HISTORY_SIZE = 10;
        this.CHECK_INTERVAL = 1000; // ms
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.update();

        this.checkTimer = setInterval(() => this.checkTier(), this.CHECK_INTERVAL);
        Logger.message("PerformanceMonitor started.");
    }

    stop() {
        this.isRunning = false;
        if (this.checkTimer) clearInterval(this.checkTimer);
    }

    update() {
        if (!this.isRunning) return;

        this.frameCount++;
        const now = performance.now();
        const delta = now - this.lastTime;

        if (delta >= 1000) {
            this.fps = (this.frameCount * 1000) / delta;
            this.frameCount = 0;
            this.lastTime = now;

            this.fpsHistory.push(this.fps);
            if (this.fpsHistory.length > this.HISTORY_SIZE) this.fpsHistory.shift();
        }

        requestAnimationFrame(() => this.update());
    }

    checkTier() {
        if (this.fpsHistory.length < 3) return;

        const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        let newTier = this.tier;

        if (avgFps < 25) newTier = 'low';
        else if (avgFps < 45) newTier = 'medium';
        else newTier = 'high';

        if (newTier !== this.tier) {
            this.tier = newTier;
            this.applyTierSettings();
            EventBus.emit('performance:tier_change', this.tier);
            Logger.message(`Performance tier changed to: ${this.tier} (Avg FPS: ${avgFps.toFixed(1)})`);
        }
    }

    applyTierSettings() {
        try {
            const music = this.viewManager.engine.getModule('Music');
            if (music && typeof music.setPerformanceMode === 'function') {
                music.setPerformanceMode(this.tier);
            }

            const gameEngine = this.viewManager.gameEngine;
            if (gameEngine && gameEngine.shipFactory && typeof gameEngine.shipFactory.setPerformanceMode === 'function') {
                gameEngine.shipFactory.setPerformanceMode(this.tier);
            }

            // Update current scene if it supports it
            if (this.viewManager.currentScene && typeof this.viewManager.currentScene.setPerformanceMode === 'function') {
                this.viewManager.currentScene.setPerformanceMode(this.tier);
            }
        } catch (e) {
            Logger.warn("PerformanceMonitor: Failed to apply tier settings.", e);
        }
    }
}
