import Logger from '@/js/core/Logger.js';

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
        const funcName = 'EventBusManager.on';
        Logger.start(funcName);
        Logger.logVariables({ eventName });
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(listener);
        Logger.end(funcName);
    }

    emit(eventName, ...args) {
        const funcName = 'EventBusManager.emit';
        Logger.start(funcName);
        Logger.logVariables({ eventName });
        if (this.events[eventName]) {
            this.events[eventName].forEach(listener => listener(...args));
        }
        Logger.end(funcName);
    }
}

export const EventBus = new EventBusManager();