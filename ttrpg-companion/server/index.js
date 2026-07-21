const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Simple server-side logger for consistency
const Logger = {
  info: (message) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
  },
  warn: (message) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
  },
  error: (message, error) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  }
};

// Connected clients: clientId -> { ws, roomId, info }
const clients = new Map();

function broadcastToRoom(roomId, obj, excludeId = null) {
  const s = JSON.stringify(obj);
  for (const [id, c] of clients) {
    if (c.roomId === roomId && id !== excludeId) {
      try { c.ws.send(s); } catch (e) { }
    }
  }
}

wss.on('connection', (ws) => {
  let clientId = null;
  let clientRoomId = null;
  Logger.info('New WebSocket connection initiated.');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'register') {
        clientId = msg.clientId || `client_${Math.floor(Math.random()*10000)}`;
        clientRoomId = msg.roomId || 'lobby';
        clients.set(clientId, { ws, roomId: clientRoomId, info: msg.info || {} });
        Logger.info(`Registered client ${clientId} in room ${clientRoomId} with info: ${JSON.stringify(msg.info || {})}`);
        
        // Acknowledge registration
        ws.send(JSON.stringify({ type: 'registered', clientId }));

        // Notify existing peers and sync peer listing
        for (const [id, c] of clients.entries()) {
          if (id !== clientId && c.roomId === clientRoomId) {
            // Notify existing peer about the new peer
            try {
              c.ws.send(JSON.stringify({
                type: 'peerJoined',
                peerId: clientId,
                info: msg.info || {}
              }));
            } catch (e) {}

            // Send existing peer info to the joining client
            ws.send(JSON.stringify({
              type: 'peerExists',
              peerId: id,
              info: c.info || {}
            }));
          }
        }
      } else if (msg.to) {
        // Relays signaling offers, answers, and candidates
        const target = clients.get(msg.to);
        const sender = clients.get(clientId);
        if (target && sender && target.roomId === sender.roomId) {
          target.ws.send(JSON.stringify({
            ...msg,
            from: clientId
          }));
        }
      } else if (msg.type === 'benchmark') {
        // store capability metrics
        if (clientId && clients.has(clientId)) {
          clients.get(clientId).info.benchmark = msg.benchmark;
          Logger.info(`Received benchmark data from ${clientId}`);
        }
      } else if (msg.type === 'taskResult') {
        Logger.info(`Task result from ${clientId || 'unknown'}: taskId=${msg.taskId}, size=${msg.size || 'n/a'}`);
        ws.send(JSON.stringify({ type: 'taskAccepted', taskId: msg.taskId }));
      }
    } catch (err) {
      Logger.warn('Invalid WS message received.');
      Logger.error('Error parsing message:', err);
    }
  });

  ws.on('close', () => {
    if (clientId && clients.has(clientId)) {
      const client = clients.get(clientId);
      clients.delete(clientId);
      Logger.info(`WebSocket closed for client: ${clientId} from room ${client.roomId}`);
      
      // Notify other clients in the same room
      broadcastToRoom(client.roomId, {
        type: 'peerLeft',
        peerId: clientId
      });
    }
  });
});

// Simple assign endpoint to request compute-capable clients perform a task.
// POST /assign { taskId, task } -> broadcasts taskAssign to compute clients
app.post('/assign', (req, res) => {
  const body = req.body || {};
  const task = body.task;
  if (!task || !task.taskId) {
    const errorMsg = 'task.taskId is required in assignment request.';
    Logger.warn(`Bad request to /assign: ${errorMsg}`);
    return res.status(400).json({ error: errorMsg });
  }

  // Find compute-capable clients
  const targets = [];
  for (const [id, c] of clients.entries()) {
    const b = c.info && c.info.benchmark;
    if (b && b.computeCapable) targets.push(id);
  }

  // If none marked compute-capable, broadcast to all clients as fallback
  const recipients = targets.length ? targets : Array.from(clients.keys());
  const msg = { type: 'taskAssign', task };
  for (const id of recipients) {
    const c = clients.get(id);
    try { c.ws.send(JSON.stringify(msg)); } catch (e) { }
  }

  Logger.info(`Assigned task ${task.taskId} to ${recipients.length} clients.`);
  res.json({ assignedTo: recipients, taskId: task.taskId });
});

app.get('/health', (req, res) => res.json({ ok: true, clients: clients.size }));

server.listen(PORT, () => {
  Logger.info(`Signaling/task server listening on http://localhost:${PORT}`);
});
