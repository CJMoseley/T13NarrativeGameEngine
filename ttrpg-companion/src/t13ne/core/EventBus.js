import Logger from './Logger.js';

/**
 * A simple singleton event bus for decoupled inter-module communication.
 * Allows parts of the application to subscribe to events and other parts
 * to publish them, without direct dependencies on each other.
 *
 * @example
 * // Module A (Subscriber)
 * EventBus.on('player:jumped', (system) => console.log(`Player jumped to ${system}`));
 *
 * // Module B (Publisher)
 * EventBus.emit('player:jumped', 'Alpha Centauri');
 */
class EventBusManager {
    constructor() {
        const funcName = 'EventBusManager.constructor';
        Logger.start(funcName);
        this.events = {};
        Logger.end(funcName);
    }

    on(eventName, listener) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(listener);
    }

    off(eventName, listener) {
        if (!this.events[eventName]) return;
        this.events[eventName] = this.events[eventName].filter(l => l !== listener);
    }

    once(eventName, listener) {
        const wrapper = (...args) => {
            this.off(eventName, wrapper);
            listener(...args);
        };
        this.on(eventName, wrapper);
    }

    emit(eventName, ...args) {
        if (this.events[eventName]) {
            // Use slice to avoid issues if listeners are removed during emission
            const listeners = this.events[eventName].slice();
            listeners.forEach(listener => listener(...args));
        }
    }
}

export const EventBus = new EventBusManager();