import Logger from '../core/Logger.js';

// Simple WebSocket signaling client for the WormholeRacersJS prototype
export function createSignaling(url, clientId, handlers = {}) {
    const ws = new WebSocket(url);
    ws.addEventListener('open', () => {
        ws.send(JSON.stringify({ type: 'register', clientId, info: handlers.info || {} }));
    });

    ws.addEventListener('message', (ev) => {
        try {
            const msg = JSON.parse(ev.data);
            if (msg.type === 'registered' && handlers.onRegistered) handlers.onRegistered(msg.clientId);
            if (msg.type === 'taskAssign' && handlers.onTaskAssign) handlers.onTaskAssign(msg.task);
            if (handlers.onMessage) handlers.onMessage(msg);
        } catch (e) {
            Logger.message(`WARN: Invalid signaling message: ${e}`);
        }
    });

    return {
        send: (obj) => ws.send(JSON.stringify(obj)),
        close: () => ws.close(),
        ws
    };
}
