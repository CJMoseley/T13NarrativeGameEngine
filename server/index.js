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

// Connected clients: clientId -> { ws, info }
const clients = new Map();

function broadcast(obj) {
  const s = JSON.stringify(obj);
  for (const [, c] of clients) {
    try { c.ws.send(s); } catch (e) { }
  }
}

wss.on('connection', (ws) => {
  let clientId = null;
  Logger.info('New WebSocket connection initiated.');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'register') {
        clientId = msg.clientId || `client_${Math.floor(Math.random()*10000)}`;
        clients.set(clientId, { ws, info: msg.info || {} });
        Logger.info(`Registered client ${clientId} with info: ${JSON.stringify(msg.info || {})}`);
        ws.send(JSON.stringify({ type: 'registered', clientId }));
      } else if (msg.type === 'benchmark') {
        // store capability metrics
        if (clientId && clients.has(clientId)) {
          clients.get(clientId).info.benchmark = msg.benchmark;
          Logger.info(`Received benchmark data from ${clientId}`);
        }
      } else if (msg.type === 'taskResult') {
        Logger.info(`Task result from ${clientId || 'unknown'}: taskId=${msg.taskId}, size=${msg.size || 'n/a'}`);
        // TODO: Verification and anti-cheat
        // - Implement Merkle-chunked digests for large blobs and request random leaf proofs
        // - Stochastically re-compute small random samples on the server or on trusted nodes
        // - Maintain a record of node performance and demote/blacklist nodes that fail checks
        // For now, acknowledge receipt and broadcast availability
        ws.send(JSON.stringify({ type: 'taskAccepted', taskId: msg.taskId }));
      }
    } catch (err) {
      Logger.warn('Invalid WS message received.');
      Logger.error('Error parsing message:', err);
    }
  });

  ws.on('close', () => {
    if (clientId && clients.has(clientId)) clients.delete(clientId);
    Logger.info(`WebSocket closed for client: ${clientId}`);
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
