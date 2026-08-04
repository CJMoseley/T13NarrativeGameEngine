const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');

// Import Centralized Services
const PermissionService = require('./PermissionService');
const StateStore = require('./StateStore');
const NarrativeWriteFlowHandler = require('./NarrativeWriteFlowHandler');
const NameGeneratorFactory = require('./NameGeneratorFactory');

const app = express();
app.use(bodyParser.json());

// Robust, dependency-free CORS middleware for seamless cross-origin communication
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Centralized T13 port 5713 as standard
const PORT = process.env.PORT || 5713;

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

// Connected clients: clientId -> { ws, info, role }
const clients = new Map();

/**
 * Broadcasts an object to all connected WebSocket clients.
 */
function broadcast(obj) {
  const s = JSON.stringify(obj);
  for (const [, c] of clients) {
    try {
      if (c.ws.readyState === WebSocket.OPEN) {
        c.ws.send(s);
      }
    } catch (e) { }
  }
}

// Hook StateStore events to broadcast changes automatically
StateStore.addListener((event, data) => {
  Logger.info(`StateStore event fired: ${event}`);
  broadcast({
    type: 'sync_event',
    event,
    data
  });
});

// ==========================================
// 🛡️ API v1 Route Implementations
// ==========================================

/**
 * GET /api/v1/state
 * Public read access to global game state
 */
app.get('/api/v1/state', (req, res) => {
  res.json(StateStore.getState());
});

/**
 * POST /api/v1/state
 * Intercepted by NarrativeWriteFlowHandler to enforce raw intent translation and PermissionService check.
 */
app.post('/api/v1/state', (req, res) => {
  const role = PermissionService.getRole(req);

  // RAW INTENT -> STRUCTURED PAYLOAD -> PERMISSION CHECK -> STATE MUTATION
  const flowResult = NarrativeWriteFlowHandler.handleNarrativeIntent(role, req.body);

  if (flowResult.success) {
    res.json({
      success: true,
      message: 'Global game state updated successfully via NarrativeWriteFlowHandler.',
      state: flowResult.mutationsResult.state,
      structuredPayload: flowResult.structuredPayload
    });
  } else {
    res.status(403).json({
      error: flowResult.error,
      structuredPayload: flowResult.structuredPayload
    });
  }
});

/**
 * GET /api/v1/characters
 * Public read access to all characters
 */
app.get('/api/v1/characters', (req, res) => {
  res.json(StateStore.getCharacters());
});

/**
 * GET /api/v1/characters/:id
 * Public read access to a specific character
 */
app.get('/api/v1/characters/:id', (req, res) => {
  const character = StateStore.getCharacter(req.params.id);
  if (!character) {
    return res.status(404).json({ error: `Character with ID ${req.params.id} not found.` });
  }
  res.json(character);
});

/**
 * POST /api/v1/characters
 * Intercepted by NarrativeWriteFlowHandler to enforce raw intent translation and PermissionService check.
 */
app.post('/api/v1/characters', (req, res) => {
  const role = PermissionService.getRole(req);

  // RAW INTENT -> STRUCTURED PAYLOAD -> PERMISSION CHECK -> STATE MUTATION
  const flowResult = NarrativeWriteFlowHandler.handleNarrativeIntent(role, req.body);

  if (flowResult.success) {
    res.status(210).json({
      success: true,
      message: 'Character created successfully via NarrativeWriteFlowHandler.',
      character: flowResult.mutationsResult.character,
      structuredPayload: flowResult.structuredPayload
    });
  } else {
    res.status(403).json({
      error: flowResult.error,
      structuredPayload: flowResult.structuredPayload
    });
  }
});

/**
 * PUT /api/v1/characters/:id
 * Referee-restricted update access for characters
 */
app.put('/api/v1/characters/:id', PermissionService.refereeMiddleware('characters', 'update'), (req, res) => {
  const updatedChar = StateStore.updateCharacter(req.params.id, req.body);
  if (!updatedChar) {
    return res.status(404).json({ error: `Character with ID ${req.params.id} not found.` });
  }
  res.json({
    success: true,
    message: 'Character updated successfully.',
    character: updatedChar
  });
});

/**
 * DELETE /api/v1/characters/:id
 * Referee-restricted deletion access for characters
 */
app.delete('/api/v1/characters/:id', PermissionService.refereeMiddleware('characters', 'delete'), (req, res) => {
  const success = StateStore.deleteCharacter(req.params.id);
  if (!success) {
    return res.status(404).json({ error: `Character with ID ${req.params.id} not found.` });
  }
  res.json({
    success: true,
    message: `Character ${req.params.id} deleted successfully.`
  });
});

/**
 * POST /api/v1/story
 * Referee-restricted narrative/story generation gateway
 */
app.post('/api/v1/story', PermissionService.refereeMiddleware('story', 'progress'), (req, res) => {
  const { prompt, tone, length, context } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing required "prompt" parameter in story request.' });
  }

  const activeTone = tone || 'mysterious';
  const activeLength = length || 'medium';

  // Construct standard narrative segment object
  const segmentId = `story_segment_${Math.floor(Math.random() * 1000000)}`;
  const narrativeText = `[Narrative Engine - ${activeTone.toUpperCase()} MODE] Inside the T13 matrix, your prompt '${prompt}' echoes. ${context ? `Under the context of: ${context}.` : ''} The weave tightens. Tension escalates.`;

  // Standardized story segment object returned to client
  const storySegment = {
    segmentId,
    tone: activeTone,
    prompt,
    narrative: narrativeText,
    activePlots: [],
    tensionDelta: 0.15,
    timestamp: new Date().toISOString()
  };

  // Optionally trigger a state tension increase
  const currentState = StateStore.getState();
  StateStore.updateState({
    tension: Math.min(1.0, (currentState.tension || 0) + storySegment.tensionDelta)
  });

  res.json({
    success: true,
    message: 'Story segment generated successfully.',
    storySegment
  });
});

/**
 * POST /api/v1/name-generator
 * Generates a name utilizing the abstract NameGeneratorFactory
 */
app.post('/api/v1/name-generator', (req, res) => {
  const { strategy, seed, facet, model } = req.body;

  if (strategy) {
    NameGeneratorFactory.setStrategy(strategy);
  }

  const result = NameGeneratorFactory.generate({ seed, facet, model });
  res.json({
    success: true,
    activeStrategy: NameGeneratorFactory.activeStrategy,
    nameArray: result,
    shortName: result[0],
    fullName: result[1],
    description: result[2]
  });
});

/**
 * ANY /api/v1/modules/:moduleName
 * Referee-restricted module execution and instruction relay gateway
 */
app.all('/api/v1/modules/:moduleName', PermissionService.refereeMiddleware('modules', 'execute'), (req, res) => {
  const moduleName = req.params.moduleName;
  const body = req.body || {};

  Logger.info(`Gateway relay called for module: ${moduleName}`);

  // Core structured execution instructions
  const relayResponse = {
    success: true,
    module: moduleName,
    executionType: 'client_relay_directive',
    directive: {
      action: 'EXECUTE_ON_CLIENT_WORKER',
      targetModule: moduleName,
      params: body,
      authorizedRole: 'referee'
    }
  };

  // Provide high-fidelity responses for core modules described in JULES documentation
  if (moduleName === 'card-spreads' || moduleName === 't13ne-cards-api') {
    relayResponse.message = 'Card spreads module accessed. Dispatching standard spread parameters.';
    relayResponse.payload = {
      spreadType: body.spreadType || 'hook_spread',
      cardsRequested: body.cardsRequested || 3,
      hardenedSeed: body.seed || Math.floor(Math.random() * 100000),
      positions: ['Hook Aspect', 'Rising Tension', 'Resolution Seed']
    };
  } else if (moduleName === 't13ne-facets') {
    relayResponse.message = 'Facets mapping module active.';
    relayResponse.payload = {
      facetsAvailable: 24,
      action: 'RETRIEVE_FACET_BOONS'
    };
  } else {
    relayResponse.message = `Module ${moduleName} gateway active. Instructions dispatched to client wrapper.`;
  }

  res.json(relayResponse);
});

// ==========================================
// 🔌 WebSocket Server Implementation
// ==========================================

wss.on('connection', (ws) => {
  let clientId = null;
  Logger.info('New WebSocket connection initiated.');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'register') {
        clientId = msg.clientId || `client_${Math.floor(Math.random()*10000)}`;

        // Determine role via token registration if available
        const isReferee = PermissionService.isWSClientReferee(msg);
        const role = isReferee ? 'referee' : 'player';

        clients.set(clientId, { ws, info: msg.info || {}, role });
        Logger.info(`Registered client ${clientId} [ROLE: ${role}] with info: ${JSON.stringify(msg.info || {})}`);

        ws.send(JSON.stringify({
          type: 'registered',
          clientId,
          role,
          state: StateStore.getState(),
          characters: StateStore.getCharacters()
        }));
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
    if (clientId && clients.has(clientId)) clients.delete(clientId);
    Logger.info(`WebSocket closed for client: ${clientId}`);
  });
});

// ==========================================
// 🔌 Original Signaling/Task Endpoints
// ==========================================

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
  Logger.info(`Signaling/task/API server listening on http://localhost:${PORT}`);
});
