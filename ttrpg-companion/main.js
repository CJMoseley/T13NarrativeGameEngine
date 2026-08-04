import T13NE from '/src/t13ne/T13NE.js';
import Logger from '/src/t13ne/core/Logger.js';
import P2PNetworkManager from '/src/t13ne/core/P2PNetworkManager.js';
import { VOIPManager } from '/src/t13ne/core/VOIPManager.js';
import { EventBus } from '/src/t13ne/core/EventBus.js';

import '/src/components/T13VttCanvas.js';
import '/src/components/T13CharacterSheet.js';
import '/src/components/T13PlotWidget.js';
import '/src/components/T13YarnCardWidget.js';
import '/src/components/T13ProficiencyWidget.js';
import '/src/components/T13AnnexWidget.js';
import '/src/components/T13EntityInspector.js';

console.log("Bootstrap: Initializing TTRPG Companion client...");

// ==========================================
// 🛡️ Client Mode & Authorization Logic
// ==========================================

// Enforce standard client modes (player or referee) via environment variables
const CLIENT_MODE = import.meta.env.VITE_CLIENT_MODE || 'player'; // default to restricted player state
const SERVER_URL = 'http://localhost:5713'; // Changed to standard T13 port 5713
const WS_URL = 'ws://localhost:5713'; // Changed to standard T13 port 5713

window.T13NE_Auth = {
  mode: CLIENT_MODE,
  isAuthorized: CLIENT_MODE === 'referee', // referee starts elevated
  token: CLIENT_MODE === 'referee' ? (localStorage.getItem('t13ne_referee_token') || 'DEV_SUPER_SECRET_KEY') : (localStorage.getItem('t13ne_player_token') || null)
};

// Global helper to get request headers with Authorization
window.getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  if (window.T13NE_Auth.token) {
    headers['Authorization'] = `Bearer ${window.T13NE_Auth.token}`;
  }
  return headers;
};

// Navigation Control
const navLinks = document.querySelectorAll('.nav-link');
const panelViews = document.querySelectorAll('.panel-view');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        panelViews.forEach(p => p.classList.remove('active'));
        link.classList.add('active');
        const targetPanel = link.getAttribute('data-panel');
        const panel = document.getElementById(`view-${targetPanel}`);
        if (panel) panel.classList.add('active');
        console.log(`Navigation: Switched to panel "${targetPanel}"`);
    });
});

let voipManager = null;
let apiWs = null;

async function initApp() {
    try {
        console.log("App Init: Starting T13 Narrative Engine...");
        await T13NE.start();
        
        console.log("App Init: Narrative Engine running successfully.");
        document.getElementById('connectionStatus').textContent = "Engine Ready";
        document.getElementById('connectionStatus').style.color = "#10b981";

        const soundEngine = T13NE.getModule('SoundEngine');
        voipManager = new VOIPManager(P2PNetworkManager, soundEngine);
        await voipManager.init();
        voipManager.setupVAD();

        // Initialize UI panels and connection
        setupAuthUI();
        setupNetworking();
        setupPlotSystem();
        setupCharacterCreator();
        setupVttControls();
        setupInspector();

        // Connect to centralized WebSocket server
        connectToCentralServer();

        EventBus.on('p2p:peer-connected', ({ peerId }) => {
            console.log(`P2P: Connected to peer ${peerId}`);
            if (voipManager) voipManager.callPeer(peerId);
            const vttCanvas = document.querySelector('t13-vtt-canvas');
            if (vttCanvas) vttCanvas.addToken(peerId, `Player ${peerId.substring(0,4)}`, 0xef4444);

            if (P2PNetworkManager.isHost) {
                Logger.message(`Referee: Sending initial sync to player ${peerId}`);
                P2PNetworkManager.sendTo(peerId, {
                    type: 'SESSION_SYNC',
                    ts: Date.now(),
                    welcome: "Welcome to the T13 Session."
                });
            }
        });

    } catch (error) {
        console.error("App Init: Narrative Engine failed to start", error);
        document.getElementById('connectionStatus').textContent = "Init Failed";
    }
}

/**
 * Creates and injects the permission & auth panel into the sidebar.
 */
function setupAuthUI() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  const authPanel = document.createElement('div');
  authPanel.className = 'conn-panel';
  authPanel.style.marginTop = '15px';
  authPanel.id = 'authPanel';

  authPanel.innerHTML = `
    <div class="conn-title" style="margin-bottom: 8px;">
      Mode: <span id="authModeLabel" style="text-transform: uppercase; color: var(--text-accent);">${window.T13NE_Auth.mode}</span>
    </div>
    <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px;" id="authStatusText">
      ${window.T13NE_Auth.isAuthorized ? 'Authorized (Referee Admin)' : 'Restricted (Read-Only Player)'}
    </div>
    <div id="authForm" style="display: ${window.T13NE_Auth.isAuthorized ? 'none' : 'flex'}; flex-direction: column; gap: 6px;">
      <input type="password" id="authSecretInput" placeholder="Referee Bearer Token"
             style="background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 6px; font-size: 0.8rem; color: #f8fafc;"
             value="${window.T13NE_Auth.token || ''}">
      <button class="btn" id="btnElevateAuth" style="font-size: 0.75rem; padding: 6px;">Elevate to Referee</button>
    </div>
    <div id="deElevateContainer" style="display: ${window.T13NE_Auth.isAuthorized ? 'block' : 'none'};">
      <button class="btn btn-secondary" id="btnDeElevateAuth" style="font-size: 0.75rem; padding: 6px; width: 100%;">Relinquish Credentials</button>
    </div>
  `;

  sidebar.appendChild(authPanel);

  // Hook elevation action
  const btnElevate = document.getElementById('btnElevateAuth');
  const btnDeElevate = document.getElementById('btnDeElevateAuth');
  const secretInput = document.getElementById('authSecretInput');
  const authStatusText = document.getElementById('authStatusText');
  const authForm = document.getElementById('authForm');
  const deElevateContainer = document.getElementById('deElevateContainer');

  const verifyAndElevate = async (token) => {
    try {
      // Validate credentials against the unified PermissionService via a simple fetch
      const res = await fetch(`${SERVER_URL}/api/v1/state`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 200) {
        window.T13NE_Auth.isAuthorized = true;
        window.T13NE_Auth.token = token;
        localStorage.setItem(window.T13NE_Auth.mode === 'referee' ? 't13ne_referee_token' : 't13ne_player_token', token);

        authStatusText.textContent = "Authorized (Referee Elevated)";
        authStatusText.style.color = "#10b981";
        authForm.style.display = 'none';
        deElevateContainer.style.display = 'block';

        console.log("PermissionService: Elevated client state to authorized Referee.");
        // Re-establish WebSocket connection with updated auth token
        connectToCentralServer();
      } else {
        alert("PermissionService rejection: Invalid Referee secret token.");
        authStatusText.textContent = "Elevation Failed (Unauthorized)";
        authStatusText.style.color = "#ef4444";
      }
    } catch (e) {
      console.error("Auth verification failed", e);
      alert("Failed connecting to permission validation endpoint. Operating in fallback offline state.");
    }
  };

  btnElevate.addEventListener('click', () => {
    const token = secretInput.value.trim();
    if (!token) return alert("Please input a Referee token.");
    verifyAndElevate(token);
  });

  btnDeElevate.addEventListener('click', () => {
    window.T13NE_Auth.isAuthorized = false;
    window.T13NE_Auth.token = null;
    localStorage.removeItem('t13ne_referee_token');
    localStorage.removeItem('t13ne_player_token');

    authStatusText.textContent = "Restricted (Read-Only Player)";
    authStatusText.style.color = "#94a3b8";
    authForm.style.display = 'flex';
    secretInput.value = '';
    deElevateContainer.style.display = 'none';

    console.log("PermissionService: Relinquished authorization. Client state set to Restricted Player.");
    connectToCentralServer();
  });

  // If we already have a token stored on load for player mode, auto-verify it
  if (window.T13NE_Auth.token && !window.T13NE_Auth.isAuthorized) {
    verifyAndElevate(window.T13NE_Auth.token);
  }
}

/**
 * Connects to the centralized websocket server and handles state synchronizations.
 */
function connectToCentralServer() {
  if (apiWs) {
    try { apiWs.close(); } catch (e) {}
  }

  console.log("WS Init: Connecting to central API signaling server...");
  apiWs = new WebSocket(WS_URL);

  apiWs.onopen = () => {
    console.log("WS Sync: Connected. Sending client registration message.");
    apiWs.send(JSON.stringify({
      type: 'register',
      clientId: `client_ui_${Math.floor(Math.random() * 100000)}`,
      token: window.T13NE_Auth.token, // Sends token to establish WS connection role
      info: {
        mode: window.T13NE_Auth.mode,
        isAuthorized: window.T13NE_Auth.isAuthorized
      }
    }));
  };

  apiWs.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      console.log(`WS Sync received: ${msg.type}`, msg);

      if (msg.type === 'sync_event') {
        handleServerSyncEvent(msg.event, msg.data);
      } else if (msg.type === 'registered') {
        console.log(`WS Sync: Registered as [ROLE: ${msg.role}]`);
        // Use server-provided global state
        if (msg.state) {
          syncGlobalStateToUI(msg.state);
        }
      }
    } catch (err) {
      console.error("WS Parse Error", err);
    }
  };

  apiWs.onerror = (e) => {
    console.warn("WS Sync: Offline / connection refused. State changes will operate locally.");
  };
}

/**
 * Sync server-side events back to client UI components dynamically.
 */
function handleServerSyncEvent(event, data) {
  if (event === 'stateUpdated') {
    syncGlobalStateToUI(data);
  } else if (event === 'characterCreated' || event === 'characterUpdated') {
    const characterSheet = document.querySelector('t13-character-sheet');
    if (characterSheet && data) {
      characterSheet.setCharacter(data);
    }
  }
}

function syncGlobalStateToUI(state) {
  console.log("UI Sync: Applying server state to interface:", state);
  const statusEl = document.getElementById('connectionStatus');
  if (statusEl && state.currentLocation) {
    statusEl.textContent = `Active: ${state.currentLocation.toUpperCase()} (Tension: ${state.tension})`;
  }
}

function setupPlotSystem() {
    const btnGenerate = document.getElementById('btnGeneratePlot');
    const plotOutput = document.getElementById('activePlotOutput');

    btnGenerate.addEventListener('click', async () => {
        // Enforce PermissionService checks before allowing write paths
        if (!window.T13NE_Auth.isAuthorized) {
          alert("PermissionService Restrict: Writing a Plot requires Referee credentials.");
          return;
        }

        const plotData = {
            id: `plot_${Date.now()}`,
            Name: "The Breaking of the Third Seal",
            Rank: "Story",
            goal: "Prevent the emergence of the Archfiend at the Sector 7 gateway.",
            tensionLevel: 4,
            Conflict: {
                NoSides: 2,
                Sides: {
                    Dominant: { Expressions: ["Archfiend Malphas", "The Void Gate"] },
                    Pressed: { Expressions: ["The Last Wardens", "Ancient Sigils"] }
                }
            },
            subPlots: [{ Name: "Infiltrate the Gateway", Rank: "Act" }],
            plotDescendants: [
                { Type: 'Location', Name: 'Sector 7 Gateway' },
                { Type: 'Prop', Name: 'Shattered Seal' }
            ],
            Hooked_Characters: [
                { id: 'char_kaelen', name: 'Kaelen Weaver', charType: 'Hero' },
                { id: 'npc_vex', name: 'The Silent Warden', charType: 'Vex' }
            ],
            quests: [
                {
                    name: "Secure the Perimeter",
                    description: "Establish a defensive line around the Sector 7 rift.",
                    reward: "5 Chi",
                    steps: [
                        { text: "Deploy sensor drones", complete: true },
                        { text: "Neutralize vanguard scouts", complete: false }
                    ]
                }
            ],
            hand: [
                { name: "The Catalyst", suit: "Spades", pips: "A", meaning: "A sudden event triggers a cascade." },
                { name: "Broken Vow", suit: "Diamonds", pips: "5", meaning: "A betrayal or failed oath complicates the path." }
            ]
        };

        try {
          // POST plot through the authorized /api/v1/story endpoint
          const res = await fetch(`${SERVER_URL}/api/v1/story`, {
            method: 'POST',
            headers: window.getAuthHeaders(),
            body: JSON.stringify({
              prompt: plotData.goal,
              tone: 'dark',
              length: 'medium',
              context: plotData.Name
            })
          });

          if (res.status === 200) {
            const resultData = await res.json();
            console.log("REST API: Story segment created:", resultData);

            // Render locally
            renderPlot(plotData);
            P2PNetworkManager.broadcast({ type: 'PLOT_SYNC', plot: plotData });
          } else {
            const errResult = await res.json();
            alert(`Failed creating narrative thread: ${errResult.error}`);
          }
        } catch (e) {
          console.warn("Server offline, executing local plot generator fallback...");
          renderPlot(plotData);
          P2PNetworkManager.broadcast({ type: 'PLOT_SYNC', plot: plotData });
        }
    });

    EventBus.on('p2p:msg:PLOT_SYNC', ({ message }) => {
        renderPlot(message.plot);
    });

    function renderPlot(data) {
        plotOutput.innerHTML = '';
        const widget = document.createElement('t13-plot-widget');
        plotOutput.appendChild(widget);
        widget.setPlot(data);
    }
}

function setupInspector() {
    const inspector = document.createElement('t13-entity-inspector');
    document.body.appendChild(inspector);

    window.addEventListener('inspect-character', (e) => {
        const entityId = e.detail;
        console.log(`Inspecting entity: ${entityId}`);
        inspector.inspect({ id: entityId, name: entityId, description: "A hooked entity in this narrative plot." });
    });
}

function setupCharacterCreator() {
    const btnCalculate = document.getElementById('btnGenerateCatalyst');
    const btnShowCreator = document.getElementById('btnShowCreator');
    const creatorContent = document.getElementById('characterCreatorContent');
    const statsOutput = document.getElementById('characterStatsOutput');

    if (btnShowCreator) {
        btnShowCreator.addEventListener('click', () => {
            creatorContent.style.display = 'block';
            statsOutput.style.display = 'none';
        });
    }

    btnCalculate.addEventListener('click', async () => {
        // Enforce PermissionService checks before allowing write paths
        if (!window.T13NE_Auth.isAuthorized) {
          alert("PermissionService Restrict: Creating a Character requires Referee credentials.");
          return;
        }

        const name = document.getElementById('inputCharName').value.trim();
        const charType = document.getElementById('selectCharType').value;

        if (!name) return alert("Enter character name.");

        try {
            const geometryModule = T13NE.getModule('T13Geometry');
            const ichingModule = T13NE.getModule('IChing');

            const geoResult = geometryModule.getGeometryFromString(name);
            const geoVal = geoResult.full;
            const hexagramNum = (geoVal % 64) || 1;
            const hexagram = await ichingModule.getHexagram(hexagramNum);

            const boons = {
                Incarna: 10 + (name.length % 5),
                Persona: 12 + (geoVal % 6),
                Umbral: 8 + (name.charCodeAt(0) % 8),
                Nimbed: 9 + ((geoVal + name.length) % 7)
            };

            const charData = {
                id: `char_${Date.now()}`,
                name: name,
                charType: charType,
                boons: boons,
                hexagram: { number: hexagramNum, name: hexagram.name },
                significator: { name: "The Hierophant", suit: "Spades", pips: "V" },
                features: [
                    { name: "Resonant Harmony", description: "Your boons are perfectly aligned with the Cycle's current state." },
                    { name: "Unyielding Resolve", description: "Ignore 1 Stress per Act when pursuing your primary Catalyst." }
                ],
                descendants: [],
                annexes: [
                    {
                        name: "Astrogation System",
                        type: "Talent",
                        description: "Standard navigation and path-finding patterns.",
                        proficiencies: [
                            { name: "Void Mapping", knot: 16 },
                            { name: "Sway Compensation", knot: 32 },
                            { name: "Calculated Jump", knot: 1 }
                        ]
                    }
                ],
                proficiencies: [
                    { name: "Zero-G Combat", facet: "Trial" }
                ],
                plots: ["The Breaking of the Third Seal"],
                hitches: []
            };

            try {
              // POST character to authorized REST API
              const res = await fetch(`${SERVER_URL}/api/v1/characters`, {
                method: 'POST',
                headers: window.getAuthHeaders(),
                body: JSON.stringify(charData)
              });

              if (res.status === 210 || res.status === 200) {
                const createdResult = await res.json();
                console.log("REST API: Character saved to central StateStore:", createdResult);

                creatorContent.style.display = 'none';
                statsOutput.style.display = 'block';
                statsOutput.innerHTML = '';
                const sheet = document.createElement('t13-character-sheet');
                statsOutput.appendChild(sheet);
                sheet.setCharacter(charData);

                P2PNetworkManager.broadcast({ type: 'CHARACTER_SYNC', character: charData });
              } else {
                const errResult = await res.json();
                alert(`Failed creating character on server: ${errResult.error}`);
              }
            } catch (e) {
              console.warn("Server offline, executing local character generator fallback...");
              creatorContent.style.display = 'none';
              statsOutput.style.display = 'block';
              statsOutput.innerHTML = '';
              const sheet = document.createElement('t13-character-sheet');
              statsOutput.appendChild(sheet);
              sheet.setCharacter(charData);

              P2PNetworkManager.broadcast({ type: 'CHARACTER_SYNC', character: charData });
            }
        } catch (err) {
            console.error(err);
        }
    });
}

function setupVttControls() {
    const btnRoll = document.getElementById('btnRollDice');
    const btnClear = document.getElementById('btnClearDice');
    const vttContainer = document.getElementById('vtt-canvas');

    const vttCanvas = document.createElement('t13-vtt-canvas');
    vttContainer.appendChild(vttCanvas);
    vttCanvas.addToken('local-player', 'Me', 0x10b981);
    
    if (btnRoll) {
        btnRoll.addEventListener('click', () => {
            const rolls = [Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1];
            const total = rolls.reduce((a,b)=>a+b, 0);

            P2PNetworkManager.broadcast({
                type: 'DICE_ROLL',
                rolls,
                total,
                target: 'plot_active'
            });
            vttCanvas.spawnDice(rolls);
        });
    }
    
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            vttCanvas.clearDice();
            P2PNetworkManager.broadcast({ type: 'CLEAR_TABLE' });
        });
    }
}

function setupNetworking() {
    const btnHost = document.getElementById('btnHostRoom');
    const btnJoin = document.getElementById('btnJoinRoom');
    const roomInput = document.getElementById('roomIdInput');
    const status = document.getElementById('connectionStatus');

    btnHost.addEventListener('click', async () => {
        const roomId = roomInput.value.trim();
        if (!roomId) return;
        status.textContent = "Hosting...";
        await P2PNetworkManager.createRoom(roomId);
        status.textContent = `Hosting: ${roomId}`;
        status.style.color = "#10b981";
        voipManager.start();

        // If authorized, also sync state to central server
        if (window.T13NE_Auth.isAuthorized) {
          try {
            await fetch(`${SERVER_URL}/api/v1/state`, {
              method: 'POST',
              headers: window.getAuthHeaders(),
              body: JSON.stringify({ currentLocation: roomId })
            });
          } catch(e) {}
        }
    });

    btnJoin.addEventListener('click', async () => {
        const roomId = roomInput.value.trim();
        if (!roomId) return;
        status.textContent = "Joining...";
        await P2PNetworkManager.joinRoom(roomId);
        status.textContent = `Joined: ${roomId}`;
        status.style.color = "#10b981";
        voipManager.start();
    });
}

initApp();
