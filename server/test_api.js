/**
 * test_api.js
 *
 * Integrated test suite verifying:
 * 1. Centralized PermissionService (canWrite method).
 * 2. NarrativeWriteFlowHandler (Raw Intent -> Structured Payload -> PermissionCheck -> State Mutation).
 * 3. NameGeneratorFactory (Grammar, Procedural, and AI strategies).
 * 4. REST Endpoints on Port 5715.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 5715; // Isolated test port
const SECRET = 'TEST_SECRET_KEY';
const SERVER_PATH = path.resolve(__dirname, 'index.js');
const DB_FILE = path.resolve(__dirname, '../aka_db.json');

// Import modules directly for unit-level verification
const PermissionService = require('./PermissionService');
const NarrativeWriteFlowHandler = require('./NarrativeWriteFlowHandler');
const NameGeneratorFactory = require('./NameGeneratorFactory');

let serverProcess = null;

// Backup of aka_db.json to restore after test
let dbBackup = null;
if (fs.existsSync(DB_FILE)) {
  dbBackup = fs.readFileSync(DB_FILE, 'utf8');
}

function restoreDb() {
  if (dbBackup !== null) {
    fs.writeFileSync(DB_FILE, dbBackup, 'utf8');
    console.log('[TEST] Restored aka_db.json backup.');
  } else if (fs.existsSync(DB_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      delete parsed.__t13ne_state;
      delete parsed.__t13ne_characters;
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf8');
    } catch (e) {}
  }
}

async function runTests() {
  console.log('[TEST] Running direct Unit-level assertions...');

  // Unit-level 1: central PermissionService canWrite check
  console.log('[UNIT 1] Testing PermissionService.canWrite');
  if (!PermissionService.canWrite('referee', 'state', 'update')) {
    throw new Error('canWrite failed: referee was blocked from updating state');
  }
  if (!PermissionService.canWrite('player', 'characters', 'read')) {
    throw new Error('canWrite failed: player was blocked from reading characters');
  }
  if (PermissionService.canWrite('player', 'state', 'update')) {
    throw new Error('canWrite failed: player was permitted to update state');
  }
  console.log('  -> PASSED');

  // Unit-level 2: NarrativeWriteFlowHandler pipeline
  console.log('[UNIT 2] Testing NarrativeWriteFlowHandler flow');
  const flowPlayer = NarrativeWriteFlowHandler.handleNarrativeIntent('player', { tension: 0.9 });
  if (flowPlayer.authorized || flowPlayer.success) {
    throw new Error('Flow failed: Player raw intent was not blocked from state mutation');
  }

  const flowReferee = NarrativeWriteFlowHandler.handleNarrativeIntent('referee', { currentLocation: 'shipyard' });
  if (!flowReferee.authorized || !flowReferee.success || flowReferee.mutationsResult.state.currentLocation !== 'shipyard') {
    throw new Error('Flow failed: Referee raw intent was blocked or failed to mutate state');
  }
  console.log('  -> PASSED');

  // Unit-level 3: NameGeneratorFactory Strategy pattern
  console.log('[UNIT 3] Testing NameGeneratorFactory strategies');
  NameGeneratorFactory.setStrategy('grammar');
  const nameGrammar = NameGeneratorFactory.generate({ seed: 42 });
  if (!nameGrammar[2].includes('Grammar-Generated')) {
    throw new Error('Grammar strategy output format incorrect');
  }

  NameGeneratorFactory.setStrategy('procedural');
  const nameProc = NameGeneratorFactory.generate({ seed: 100, facet: 'Trial' });
  if (!nameProc[1].includes('Trial Facet')) {
    throw new Error('Procedural strategy output format incorrect');
  }

  // Swap to AI and verify fallback behavior when offline
  NameGeneratorFactory.setStrategy('ai');
  const nameAi = await NameGeneratorFactory.generate({ seed: 100 });
  if (!nameAi[0]) {
    throw new Error('AI Strategy failed to gracefully fallback to Grammar strategy');
  }
  console.log('  -> PASSED');


  console.log('[TEST] Starting API integration server on port 5715...');
  serverProcess = spawn('node', [SERVER_PATH], {
    env: {
      ...process.env,
      PORT: PORT,
      REFREE_SECRET: SECRET,
      T13NE_PERSIST_TO_FILE: 'true'
    }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[SERVER_OUT] ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[SERVER_ERR] ${data.toString().trim()}`);
  });

  // Wait 1.5 seconds for server to start
  await new Promise(resolve => setTimeout(resolve, 1500));

  let passed = true;

  try {
    const baseUrl = `http://localhost:${PORT}/api/v1`;

    // 4. GET State via REST
    console.log('[TEST 4] GET /state (Public read)');
    const resState = await fetch(`${baseUrl}/state`);
    const state = await resState.json();
    if (resState.status !== 200) {
      throw new Error(`GET /state failed: status=${resState.status}`);
    }
    console.log('  -> PASSED');

    // 5. POST State - Player raw intent block (REST flow)
    console.log('[TEST 5] POST /state (Player RAW INTENT blocked)');
    const resStatePostUnauth = await fetch(`${baseUrl}/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tension: 0.95 })
    });
    if (resStatePostUnauth.status !== 403) {
      throw new Error(`Player write raw intent was not blocked with 403: status=${resStatePostUnauth.status}`);
    }
    console.log('  -> PASSED');

    // 6. POST State - Referee raw intent accept (REST flow)
    console.log('[TEST 6] POST /state (Referee RAW INTENT accepted & mutated)');
    const resStatePostAuth = await fetch(`${baseUrl}/state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SECRET}`
      },
      body: JSON.stringify({ currentLocation: 'colony_hub', tension: 0.77 })
    });
    const statePostResult = await resStatePostAuth.json();
    if (resStatePostAuth.status !== 200 || !statePostResult.success || statePostResult.state.currentLocation !== 'colony_hub') {
      throw new Error(`Referee flow failed: status=${resStatePostAuth.status}`);
    }
    console.log('  -> PASSED');

    // 7. POST Name Generator Endpoint
    console.log('[TEST 7] POST /name-generator (Strategy Factory delegation)');
    const resNameGen = await fetch(`${baseUrl}/name-generator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        strategy: 'procedural',
        seed: 1234,
        facet: 'Jeer'
      })
    });
    const nameGenResult = await resNameGen.json();
    if (resNameGen.status !== 200 || nameGenResult.activeStrategy !== 'procedural' || !nameGenResult.fullName.includes('Jeer Facet')) {
      throw new Error(`Name generator endpoint failed: status=${resNameGen.status}`);
    }
    console.log('  -> PASSED');

    console.log('\n🌟 ALL JULES REVIEWS AND PROMPT TESTS PASSED SUCCESSFULLY! 🌟');

  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err);
    passed = false;
  } finally {
    if (serverProcess) {
      console.log('[TEST] Stopping server...');
      serverProcess.kill();
    }
    restoreDb();
    process.exit(passed ? 0 : 1);
  }
}

runTests();
