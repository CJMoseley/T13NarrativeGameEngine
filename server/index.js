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
app.use(bodyParser.json({ limit: '1mb' }));

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

// Lazy-loaded canonical ESM T13Session runtime
const sessionModulePromise = import('../src/t13ne/modules/systems/T13Session.js');
const sessions = new Map();

async function getOrCreateSession(sessionId = 'default') {
  const id = String(sessionId || 'default').trim() || 'default';
  if (!sessions.has(id)) {
    const { T13Session } = await sessionModulePromise;
    sessions.set(id, new T13Session({ sessionId: id, seed: `server-${id}` }));
  }
  return sessions.get(id);
}

// Connected clients: clientId -> { ws, info, role, sessionId, actorId, lastSeq }
const clients = new Map();
const wsPuppetRateState = new Map();

function allowWsPuppetFrame(clientId) {
  const now = Date.now();
  const cutoff = now - 1000;
  const list = (wsPuppetRateState.get(clientId) || []).filter(ts => ts >= cutoff);
  if (list.length >= 25) {
    wsPuppetRateState.set(clientId, list);
    return false;
  }
  list.push(now);
  wsPuppetRateState.set(clientId, list);
  return true;
}

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

/**
 * Fans out role-filtered session events and projection updates to clients in a session.
 */
async function fanOutSessionSince(session, afterSeq) {
  const { T13Session } = await sessionModulePromise;
  for (const [, c] of clients.entries()) {
    if (c.sessionId !== session.sessionId || c.ws.readyState !== WebSocket.OPEN) continue;
    const viewer = { role: c.role || 'player', actorId: c.actorId || c.clientId };
    const visible = session.getEventsSince(afterSeq, viewer);
    for (const event of visible) {
      if (!T13Session.isEventVisibleTo(event.visibility, viewer)) continue;
      c.ws.send(JSON.stringify({ type: 'SESSION_EVENT', sessionId: session.sessionId, event }));
      c.lastSeq = Math.max(c.lastSeq || 0, event.seq);
    }
    if (visible.length > 0) {
      c.ws.send(JSON.stringify({
        type: 'STATE_PROJECTION',
        sessionId: session.sessionId,
        projection: session.getProjection(viewer),
        lastSeq: c.lastSeq || 0
      }));
    }
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
// 🔐 Auth & JWKS Endpoints (ES256 JWT + Salted Challenge-Response)
// ==========================================

app.get('/.well-known/jwks.json', (req, res) => {
  res.json(PermissionService.getPublicJWKS());
});

app.get('/api/v1/auth/jwks', (req, res) => {
  res.json(PermissionService.getPublicJWKS());
});

app.post('/api/v1/auth/challenge', (req, res) => {
  res.json(PermissionService.createChallenge());
});

app.post('/api/v1/auth/verify', (req, res) => {
  const { challengeId, response, actorId, sessionId } = req.body || {};
  const result = PermissionService.verifyChallengeAndIssueJWT({
    challengeId,
    response,
    actorId: actorId || 'referee',
    sessionId: sessionId || 'default'
  });
  if (!result.ok) {
    return res.status(401).json({ ok: false, error: result.error });
  }
  res.json(result);
});

app.post('/api/v1/auth/player-token', (req, res) => {
  const { actorId, sessionId } = req.body || {};
  const issued = PermissionService.issuePlayerJWT({ actorId, sessionId });
  res.json({ ok: true, ...issued });
});

// ==========================================
// 🎲 Authoritative T13Session VTT Endpoints
// ==========================================

app.get('/api/v1/sessions/:sessionId/projection', async (req, res) => {
  try {
    const session = await getOrCreateSession(req.params.sessionId);
    const auth = PermissionService.getAuthContext(req);
    const actorId = req.query.actorId ? String(req.query.actorId) : auth.actorId;
    const projection = session.getProjection({ role: auth.role, actorId });
    res.json({ ok: true, role: auth.role, projection });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/v1/sessions/:sessionId/command', async (req, res) => {
  try {
    const session = await getOrCreateSession(req.params.sessionId);
    const auth = PermissionService.getAuthContext(req);
    const cmd = req.body?.command ?? req.body;
    if (!cmd || typeof cmd !== 'object') {
      return res.status(400).json({ ok: false, error: 'INVALID_COMMAND', message: 'Command object is required.' });
    }
    const actorId = String(cmd.actorId || auth.actorId || '');
    if (!actorId) {
      return res.status(400).json({ ok: false, error: 'INVALID_COMMAND', message: 'actorId is required.' });
    }
    if (auth.authMethod === 'jwt-es256' && auth.actorId && auth.role !== 'referee' && actorId !== auth.actorId) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN', message: 'actorId does not match authenticated token.' });
    }
    // Ensure server-authenticated role governs Session:Join and privileged commands
    if (cmd.type === 'Session:Join' && auth.role !== 'referee' && cmd.payload?.role === 'referee') {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN', message: 'Cannot self-elevate to referee.' });
    }
    if (!session.getActorRole(actorId) && cmd.type !== 'Session:Join') {
      session.dispatch({
        id: `srv-autojoin-${actorId}-${session.revision}`,
        sessionId: session.sessionId,
        actorId: session.refereeId,
        type: 'Session:Join',
        payload: { actorId, role: auth.role }
      });
    }
    const prevEvents = session.getEventsSince(0, { role: 'referee', actorId: session.refereeId });
    const prevSeq = prevEvents.length ? prevEvents[prevEvents.length - 1].seq : 0;

    const outcome = session.dispatch({
      ...cmd,
      sessionId: session.sessionId,
      actorId
    });
    if (!outcome.ok) {
      return res.status(outcome.error === 'FORBIDDEN' ? 403 : 400).json(outcome);
    }
    if (!outcome.duplicate) {
      await fanOutSessionSince(session, prevSeq);
    }
    const viewer = { role: auth.role, actorId };
    const { T13Session } = await sessionModulePromise;
    const filteredEvents = (outcome.events || []).filter(e => T13Session.isEventVisibleTo(e.visibility, viewer));
    res.json({
      ...outcome,
      events: filteredEvents,
      projection: session.getProjection(viewer)
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/v1/sessions/:sessionId/snapshot', PermissionService.refereeMiddleware('session', 'read'), async (req, res) => {
  try {
    const session = await getOrCreateSession(req.params.sessionId);
    res.json({ ok: true, snapshot: session.snapshot() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/v1/sessions/:sessionId/restore', PermissionService.refereeMiddleware('session', 'update'), async (req, res) => {
  try {
    const { T13Session } = await sessionModulePromise;
    const snap = req.body?.snapshot ?? req.body;
    const restored = T13Session.fromSnapshot(snap);
    sessions.set(restored.sessionId, restored);
    for (const [, c] of clients.entries()) {
      if (c.sessionId === restored.sessionId && c.ws.readyState === WebSocket.OPEN) {
        const viewer = { role: c.role || 'player', actorId: c.actorId || c.clientId };
        c.ws.send(JSON.stringify({
          type: 'STATE_PROJECTION',
          sessionId: restored.sessionId,
          projection: restored.getProjection(viewer),
          lastSeq: 0
        }));
      }
    }
    res.json({ ok: true, sessionId: restored.sessionId, revision: restored.revision });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// ==========================================
// 🛡️ API v1 Legacy Route Implementations
// ==========================================

app.get('/api/v1/state', (req, res) => {
  res.json(StateStore.getState());
});

app.post('/api/v1/state', (req, res) => {
  const role = PermissionService.getRole(req);
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

app.get('/api/v1/characters', (req, res) => {
  res.json(StateStore.getCharacters());
});

app.get('/api/v1/characters/:id', (req, res) => {
  const character = StateStore.getCharacter(req.params.id);
  if (!character) {
    return res.status(404).json({ error: `Character with ID ${req.params.id} not found.` });
  }
  res.json(character);
});

app.post('/api/v1/characters', (req, res) => {
  const role = PermissionService.getRole(req);
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

app.post('/api/v1/story', PermissionService.refereeMiddleware('story', 'progress'), (req, res) => {
  const { prompt, tone, context } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing required "prompt" parameter in story request.' });
  }

  const activeTone = tone || 'mysterious';
  const segmentId = `story_segment_${Math.floor(Math.random() * 1000000)}`;
  const narrativeText = `[Narrative Engine - ${activeTone.toUpperCase()} MODE] Inside the T13 matrix, your prompt '${prompt}' echoes. ${context ? `Under the context of: ${context}.` : ''} The weave tightens. Tension escalates.`;

  const storySegment = {
    segmentId,
    tone: activeTone,
    prompt,
    narrative: narrativeText,
    activePlots: [],
    tensionDelta: 0.15,
    timestamp: new Date().toISOString()
  };

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

app.all('/api/v1/modules/:moduleName', PermissionService.refereeMiddleware('modules', 'execute'), (req, res) => {
  const moduleName = req.params.moduleName;
  const body = req.body || {};

  Logger.info(`Gateway relay called for module: ${moduleName}`);

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

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'register' || msg.type === 'SESSION_JOIN') {
        const auth = PermissionService.resolveTokenAuth(msg.token);
        clientId = msg.clientId || `client_${Math.floor(Math.random() * 100000)}`;
        const sessionId = msg.sessionId ? String(msg.sessionId) : (auth.sessionId || 'default');
        const actorId = String(msg.actorId || auth.actorId || clientId);
        const role = auth.role === 'referee' ? 'referee' : 'player';

        clients.set(clientId, { clientId, ws, info: msg.info || {}, role, sessionId, actorId, lastSeq: 0 });
        Logger.info(`Registered client ${clientId} (${actorId}) in session ${sessionId} [ROLE: ${role}, auth: ${auth.authMethod}]`);

        const session = await getOrCreateSession(sessionId);
        if (!session.getActorRole(actorId)) {
          session.dispatch({
            id: `ws-join-${actorId}-${session.revision}`,
            sessionId: session.sessionId,
            actorId: session.refereeId,
            type: 'Session:Join',
            payload: { actorId, role, name: msg.name || actorId }
          });
        } else if (role === 'referee' && session.getActorRole(actorId) !== 'referee') {
          session.dispatch({
            id: `ws-elevate-${actorId}-${session.revision}`,
            sessionId: session.sessionId,
            actorId: session.refereeId,
            type: 'Session:Join',
            payload: { actorId, role: 'referee', name: msg.name || actorId }
          });
        }

        const viewer = { role, actorId };
        const events = session.getEventsSince(0, viewer);
        const latestSeq = events.length ? events[events.length - 1].seq : 0;
        clients.get(clientId).lastSeq = latestSeq;

        ws.send(JSON.stringify({
          type: 'registered',
          clientId,
          actorId,
          sessionId: session.sessionId,
          role,
          state: StateStore.getState(),
          characters: StateStore.getCharacters()
        }));

        ws.send(JSON.stringify({
          type: 'STATE_PROJECTION',
          sessionId: session.sessionId,
          projection: session.getProjection(viewer),
          lastSeq: latestSeq
        }));
      } else if (msg.type === 'SESSION_SYNC_REQUEST') {
        const client = clientId ? clients.get(clientId) : null;
        if (!client) return;
        const session = await getOrCreateSession(msg.sessionId || client.sessionId);
        const viewer = { role: client.role, actorId: client.actorId };
        const afterSeq = Number.isFinite(msg.afterSeq) ? msg.afterSeq : 0;
        if (afterSeq > 0) {
          const missed = session.getEventsSince(afterSeq, viewer);
          for (const event of missed) {
            ws.send(JSON.stringify({ type: 'SESSION_EVENT', sessionId: session.sessionId, event }));
            client.lastSeq = Math.max(client.lastSeq || 0, event.seq);
          }
        }
        ws.send(JSON.stringify({
          type: 'STATE_PROJECTION',
          sessionId: session.sessionId,
          projection: session.getProjection(viewer),
          lastSeq: client.lastSeq || 0
        }));
      } else if (msg.type === 'SESSION_COMMAND') {
        const client = clientId ? clients.get(clientId) : null;
        if (!client) return;
        const cmd = msg.command;
        if (!cmd || typeof cmd !== 'object') {
          ws.send(JSON.stringify({ type: 'SESSION_ERROR', error: 'INVALID_COMMAND', message: 'Missing command.' }));
          return;
        }
        if (cmd.actorId !== client.actorId && client.role !== 'referee') {
          ws.send(JSON.stringify({
            type: 'SESSION_ERROR',
            commandId: cmd.id,
            error: 'FORBIDDEN',
            message: `Client bound to '${client.actorId}' cannot spoof '${cmd.actorId}'.`
          }));
          return;
        }
        const session = await getOrCreateSession(cmd.sessionId || client.sessionId);
        const prevEvents = session.getEventsSince(0, { role: 'referee', actorId: session.refereeId });
        const prevSeq = prevEvents.length ? prevEvents[prevEvents.length - 1].seq : 0;

        const outcome = session.dispatch(cmd);
        if (!outcome.ok) {
          ws.send(JSON.stringify({
            type: 'SESSION_ERROR',
            sessionId: session.sessionId,
            commandId: cmd.id,
            error: outcome.error,
            message: outcome.message,
            currentRevision: outcome.revision
          }));
          if (outcome.error === 'REVISION_CONFLICT') {
            ws.send(JSON.stringify({
              type: 'STATE_PROJECTION',
              sessionId: session.sessionId,
              projection: session.getProjection({ role: client.role, actorId: client.actorId }),
              lastSeq: client.lastSeq || 0
            }));
          }
          return;
        }
        if (!outcome.duplicate) {
          await fanOutSessionSince(session, prevSeq);
        }
      } else if (msg.type === 'SKIN_SYNC') {
        const client = clientId ? clients.get(clientId) : null;
        if (!client) return;
        const session = await getOrCreateSession(client.sessionId);
        const prevEvents = session.getEventsSince(0, { role: 'referee', actorId: session.refereeId });
        const prevSeq = prevEvents.length ? prevEvents[prevEvents.length - 1].seq : 0;
        const outcome = session.dispatch({
          id: `ws-skin-${client.actorId}-${Date.now()}`,
          sessionId: session.sessionId,
          actorId: client.actorId,
          type: 'VTT:SyncSkin',
          payload: { entityId: msg.entityId, skinDocument: msg.skinDocument }
        });
        if (outcome.ok && !outcome.duplicate) {
          await fanOutSessionSince(session, prevSeq);
        }
      } else if (msg.type === 'AVATAR_PUPPET') {
        const client = clientId ? clients.get(clientId) : null;
        if (!client || !allowWsPuppetFrame(clientId) || !msg.frame || typeof msg.frame !== 'object') return;
        for (const [otherId, other] of clients.entries()) {
          if (otherId === clientId || other.sessionId !== client.sessionId || other.ws.readyState !== WebSocket.OPEN) continue;
          other.ws.send(JSON.stringify({
            type: 'AVATAR_PUPPET',
            actorId: client.actorId,
            frame: msg.frame
          }));
        }
      } else if (msg.type === 'benchmark') {
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
    if (clientId) wsPuppetRateState.delete(clientId);
    Logger.info(`WebSocket closed for client: ${clientId}`);
  });
});

// ==========================================
// 🔌 Original Signaling/Task Endpoints
// ==========================================

app.post('/assign', (req, res) => {
  const body = req.body || {};
  const task = body.task;
  if (!task || !task.taskId) {
    const errorMsg = 'task.taskId is required in assignment request.';
    Logger.warn(`Bad request to /assign: ${errorMsg}`);
    return res.status(400).json({ error: errorMsg });
  }

  const targets = [];
  for (const [id, c] of clients.entries()) {
    const b = c.info && c.info.benchmark;
    if (b && b.computeCapable) targets.push(id);
  }

  const recipients = targets.length ? targets : Array.from(clients.keys());
  const msg = { type: 'taskAssign', task };
  for (const id of recipients) {
    const c = clients.get(id);
    try { c.ws.send(JSON.stringify(msg)); } catch (e) { }
  }

  Logger.info(`Assigned task ${task.taskId} to ${recipients.length} clients.`);
  res.json({ assignedTo: recipients, taskId: task.taskId });
});

app.get('/health', (req, res) => res.json({ ok: true, clients: clients.size, sessions: sessions.size }));

server.listen(PORT, () => {
  Logger.info(`Signaling/task/API server listening on http://localhost:${PORT}`);
});
