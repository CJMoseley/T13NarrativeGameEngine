import * as THREE from 'three';
import T13NE from '/src/t13ne/T13NE.js';
import Logger from '/src/t13ne/core/Logger.js';
import P2PNetworkManager from '/src/t13ne/core/P2PNetworkManager.js';
import { VOIPManager } from '/src/t13ne/core/VOIPManager.js';
import { EventBus } from '/src/t13ne/core/EventBus.js';
import { createHumanSpeciesDescendant, createSpeciesDescendant } from '/src/t13ne/modules/characters/T13SpeciesDescendant.js';
import T13NE_AudioDirector from '/src/t13ne/modules/audio/t13ne-audio-director.js';
import { LiveAvatarController } from '/src/t13ne/procgen/avatar/LiveAvatarController.js';
import { AvatarEngine } from '/src/t13ne/procgen/avatar/AvatarEngine.js';

import '/src/components/T13VttCanvas.js';
import '/src/components/T13CharacterSheet.js';
import '/src/components/T13PlotWidget.js';
import '/src/components/T13YarnCardWidget.js';
import '/src/components/T13ProficiencyWidget.js';
import '/src/components/T13AnnexWidget.js';
import '/src/components/T13EntityInspector.js';
import './src/components/T13CardOrdealHud.js';
import { buildMinimalHexagramTable } from './src/components/T13RefereeConsole.js';
import './src/components/T13RefereeConsole.js';
import { SessionCompanionBridge } from './src/services/SessionCompanionBridge.js';

console.log("Bootstrap: Initializing TTRPG Companion client...");

// ==========================================
// 🛡️ Client Mode & Authorization Logic
// ==========================================

const CLIENT_MODE = import.meta.env.VITE_CLIENT_MODE || 'player';
const SERVER_URL = 'http://localhost:5713';
const WS_URL = 'ws://localhost:5713';

function getTabActorId() {
  if (typeof sessionStorage === 'undefined') return `${CLIENT_MODE}-${Math.random().toString(36).slice(2, 8)}`;
  let id = sessionStorage.getItem('t13ne_actor_id');
  if (!id) {
    id = `${CLIENT_MODE}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('t13ne_actor_id', id);
  }
  return id;
}

const storedRefToken = typeof localStorage !== 'undefined' ? localStorage.getItem('t13ne_referee_token') : null;
window.T13NE_Auth = {
  mode: CLIENT_MODE,
  isAuthorized: CLIENT_MODE === 'referee' && Boolean(storedRefToken),
  token: CLIENT_MODE === 'referee' ? storedRefToken : (typeof localStorage !== 'undefined' ? localStorage.getItem('t13ne_player_token') : null)
};

window.getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  if (window.T13NE_Auth.token) {
    headers['Authorization'] = `Bearer ${window.T13NE_Auth.token}`;
  }
  return headers;
};

const bridge = new SessionCompanionBridge({
  apiBase: SERVER_URL,
  wsUrl: WS_URL,
  sessionId: (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('t13ne_session_id')) || 'default',
  actorId: getTabActorId(),
  mode: CLIENT_MODE
});

// Mode & Navigation Control (Play Mode vs Author Mode)
const navLinks = document.querySelectorAll('.nav-link');
const panelViews = document.querySelectorAll('.panel-view');
const btnModePlay = document.getElementById('btnModePlay');
const btnModeAuthor = document.getElementById('btnModeAuthor');
const playNavLinks = document.getElementById('playNavLinks');
const authorNavLinks = document.getElementById('authorNavLinks');
const sessionConnPanel = document.getElementById('sessionConnPanel');
const vtuberWidget = document.getElementById('vtuberWidget');

function activatePanel(panelId) {
    panelViews.forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(`view-${panelId}`);
    if (panel) panel.classList.add('active');
}

function activateWorkbenchPane(viewKey) {
    const panes = {
        narrative: document.getElementById('wb-pane-narrative'),
        knots: document.getElementById('wb-pane-knots'),
        chars: document.getElementById('wb-pane-chars')
    };
    for (const [k, el] of Object.entries(panes)) {
        if (el) el.style.display = k === viewKey ? 'block' : 'none';
    }
    document.querySelectorAll('.wb-nav-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-wb-view') === viewKey);
    });
}

function setAppMode(mode) {
    const isAuthor = mode === 'author';
    btnModePlay?.classList.toggle('active', !isAuthor);
    btnModeAuthor?.classList.toggle('active', isAuthor);
    btnModePlay?.setAttribute('aria-selected', String(!isAuthor));
    btnModeAuthor?.setAttribute('aria-selected', String(isAuthor));
    if (playNavLinks) playNavLinks.style.display = isAuthor ? 'none' : '';
    if (authorNavLinks) authorNavLinks.style.display = isAuthor ? '' : 'none';
    if (sessionConnPanel) sessionConnPanel.style.display = isAuthor ? 'none' : '';
    if (vtuberWidget) vtuberWidget.style.display = isAuthor ? 'none' : '';

    const activeNavList = isAuthor ? authorNavLinks : playNavLinks;
    const defaultLink = activeNavList?.querySelector('.nav-link');
    navLinks.forEach(l => l.classList.remove('active'));
    if (defaultLink) {
        defaultLink.classList.add('active');
        activatePanel(defaultLink.getAttribute('data-panel'));
        const wbView = defaultLink.getAttribute('data-wb-view');
        if (wbView) activateWorkbenchPane(wbView);
    } else {
        activatePanel(isAuthor ? 'author' : 'vtt');
    }
}

btnModePlay?.addEventListener('click', () => setAppMode('play'));
btnModeAuthor?.addEventListener('click', () => setAppMode('author'));

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const targetPanel = link.getAttribute('data-panel');
        activatePanel(targetPanel);
        const wbView = link.getAttribute('data-wb-view');
        if (wbView) activateWorkbenchPane(wbView);
    });
});

document.querySelectorAll('.wb-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const wbView = btn.getAttribute('data-wb-view');
        if (wbView) activateWorkbenchPane(wbView);
    });
});

let voipManager = null;
let liveAvatarController = null;
let activeCharacterSheet = null;
let activeCharacterId = null;

window.__T13_COMPANION__ = {
  bridge,
  getAuth: () => window.T13NE_Auth,
  getClient: () => bridge.client,
  getVoipManager: () => voipManager,
  getLiveAvatarController: () => liveAvatarController,
  getActiveCharacterId: () => activeCharacterId
};

async function initApp() {
    try {
        console.log("App Init: Starting T13 Narrative Engine (companion mode)...");
        await T13NE.start({ mode: 'companion' });

        const soundEngine = T13NE.getModule('SoundEngine');
        voipManager = new VOIPManager(P2PNetworkManager, soundEngine);
        await voipManager.init();
        voipManager.setupVAD();

        try {
            const avatarEngine = new AvatarEngine();
            const previewMesh = avatarEngine.createAvatarMesh({ gender: 'neutral', height: 1.75 });
            liveAvatarController = new LiveAvatarController(previewMesh, 'humanoid', {
                onPuppetPacket: (packet) => bridge.client?.sendPuppetFrame(packet)
            });
            await liveAvatarController.init();
            liveAvatarController.attachVOIP(voipManager);
            mountLiveAvatarPreview(previewMesh, liveAvatarController);
        } catch (avatarErr) {
            console.warn('LiveAvatarController init deferred:', avatarErr);
        }

        setupAuthUI();
        setupNetworking();
        setupPlotSystem();
        setupCharacterCreator();
        setupVttControls();
        setupVTuberWidget();
        setupInspector();

        const vttCanvas = document.querySelector('t13-vtt-canvas');
        const cardHud = document.getElementById('cardOrdealHud');
        const refereeConsole = document.getElementById('refereeConsole');

        bridge.attachComponents({
            vttCanvas,
            characterSheet: activeCharacterSheet,
            cardHud,
            refereeConsole,
            audioDirector: T13NE_AudioDirector,
            voipManager,
            liveAvatarController
        });

        const connInfo = await bridge.connect({
            sessionId: bridge.sessionId,
            actorId: bridge.actorId,
            storedRefereeToken: window.T13NE_Auth.token
        });

        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            statusEl.textContent = connInfo.transportMode === 'websocket'
                ? `Connected (${bridge.sessionId})`
                : `Local Engine (${bridge.sessionId})`;
            statusEl.style.color = "#10b981";
        }
        syncAuthPanelFromBridge();
    } catch (error) {
        console.error("App Init: Narrative Engine failed to start", error);
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) statusEl.textContent = "Init Failed";
    }
}

function syncAuthPanelFromBridge() {
    const isRef = bridge.role === 'referee';
    window.T13NE_Auth.isAuthorized = Boolean(isRef);
    window.T13NE_Auth.token = bridge.token || window.T13NE_Auth.token;
    const authStatusText = document.getElementById('authStatusText');
    const authForm = document.getElementById('authForm');
    const deElevateContainer = document.getElementById('deElevateContainer');
    const authModeLabel = document.getElementById('authModeLabel');
    const refereeConsole = document.getElementById('refereeConsole');

    if (authModeLabel) authModeLabel.textContent = isRef ? 'referee' : window.T13NE_Auth.mode;
    if (authStatusText) {
        authStatusText.textContent = isRef ? 'Authorized (Referee Elevated)' : 'Restricted (Read-Only Player)';
        authStatusText.style.color = isRef ? '#10b981' : '#94a3b8';
    }
    if (authForm) authForm.style.display = isRef ? 'none' : 'flex';
    if (deElevateContainer) deElevateContainer.style.display = isRef ? 'block' : 'none';
    if (refereeConsole?.setAuthorized) refereeConsole.setAuthorized(Boolean(isRef));
}

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
      ${window.T13NE_Auth.isAuthorized ? 'Authorized (Referee Elevated)' : 'Restricted (Read-Only Player)'}
    </div>
    <div id="authForm" style="display: ${window.T13NE_Auth.isAuthorized ? 'none' : 'flex'}; flex-direction: column; gap: 6px;">
      <input type="password" id="authSecretInput" placeholder="Referee Passphrase"
             style="background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 6px; font-size: 0.8rem; color: #f8fafc;"
             value="">
      <button class="btn" id="btnElevateAuth" style="font-size: 0.75rem; padding: 6px;">Elevate to Referee</button>
    </div>
    <div id="deElevateContainer" style="display: ${window.T13NE_Auth.isAuthorized ? 'block' : 'none'};">
      <button class="btn btn-secondary" id="btnDeElevateAuth" style="font-size: 0.75rem; padding: 6px; width: 100%;">Relinquish Credentials</button>
    </div>
  `;

  sidebar.appendChild(authPanel);

  const btnElevate = document.getElementById('btnElevateAuth');
  const btnDeElevate = document.getElementById('btnDeElevateAuth');
  const secretInput = document.getElementById('authSecretInput');
  const authStatusText = document.getElementById('authStatusText');

  btnElevate.addEventListener('click', async () => {
    const passphrase = secretInput.value.trim();
    if (!passphrase) return alert("Please input a Referee passphrase.");
    try {
      await bridge.elevateWithPassphrase(passphrase);
      syncAuthPanelFromBridge();
    } catch (e) {
      if (authStatusText) {
        authStatusText.textContent = "Elevation Failed (Unauthorized)";
        authStatusText.style.color = "#ef4444";
      }
      alert(`PermissionService rejection: ${e.message}`);
    }
  });

  btnDeElevate.addEventListener('click', async () => {
    window.T13NE_Auth.isAuthorized = false;
    window.T13NE_Auth.token = null;
    await bridge.deElevate();
    if (secretInput) secretInput.value = '';
    syncAuthPanelFromBridge();
  });
}

function adaptPlotForWidget(plot) {
    if (!plot) return null;
    const rawQuests = Array.isArray(plot.quests) ? plot.quests : [];
    const widgetQuests = rawQuests.map((q, idx) => ({
        name: q.name || `Line ${q.line ?? idx + 1} Quest`,
        description: q.description || q.quest || 'Active changing line quest',
        reward: q.reward || '1 Chi',
        steps: Array.isArray(q.steps) ? q.steps : [{ text: q.quest || 'Complete quest step', complete: Boolean(q.completed) }]
    }));
    return {
        ...plot,
        Name: plot.Name || plot.title || 'Active Plot',
        Rank: plot.Rank || (plot.status === 'PendingConfirmation' ? 'Pending Spread' : 'Story'),
        goal: plot.goal || `Hexagram #${plot.situationHexagram ?? '?'} -> #${plot.solutionHexagram ?? '?'}`,
        tensionLevel: plot.tensionLevel ?? 1,
        Conflict: plot.Conflict || {
            NoSides: 2,
            Sides: {
                Dominant: { Expressions: [`Hexagram #${plot.situationHexagram ?? '?'}`] },
                Pressed: { Expressions: [`Hexagram #${plot.solutionHexagram ?? '?'}`] }
            }
        },
        quests: widgetQuests
    };
}

function setupPlotSystem() {
    const btnGenerate = document.getElementById('btnGeneratePlot');
    const plotOutput = document.getElementById('activePlotOutput');
    if (!btnGenerate || !plotOutput) return;

    function renderPlotsFromProjection(proj) {
        const list = Object.values(proj?.plots || {});
        if (!list.length) return;
        plotOutput.innerHTML = '';
        for (const p of list.slice().reverse()) {
            const widget = document.createElement('t13-plot-widget');
            plotOutput.appendChild(widget);
            widget.setPlot(adaptPlotForWidget(p));
        }
    }

    bridge.onSessionEvent((evt) => {
        if (evt?.type?.startsWith('Plot:') || evt?.type === 'Spread:Interpreted') {
            if (bridge.client?.projection) renderPlotsFromProjection(bridge.client.projection);
        }
    });

    btnGenerate.addEventListener('click', async () => {
        if (!window.T13NE_Auth.isAuthorized) {
          alert("PermissionService Restrict: Writing a Plot requires Referee credentials.");
          return;
        }
        if (!bridge.client) return;

        const seedBit = (Date.now() >> 2) & 1;
        const spread = {
            spreadDefinition: { id: 'quest-6-card' },
            cards: [
                { position: 'Line 1', card: { data: { Tao: [1, seedBit] } } },
                { position: 'Line 2', card: { data: { Tao: [0, 0] } } },
                { position: 'Line 3', card: { data: { Tao: [1, 1] } } },
                { position: 'Line 4', card: { data: { Tao: [seedBit, 1] } } },
                { position: 'Line 5', card: { data: { Tao: [0, 1] } } },
                { position: 'Line 6', card: { data: { Tao: [1, 1] } } }
            ]
        };

        bridge.client.sendCommand('Spread:InterpretQuest', {
            title: `Plot #${(Object.keys(bridge.client.projection?.plots || {}).length) + 1}`,
            spread,
            hexagrams: buildMinimalHexagramTable()
        });
        setTimeout(() => {
            if (bridge.client?.projection) renderPlotsFromProjection(bridge.client.projection);
        }, 120);
    });
}

function setupInspector() {
    const inspector = document.createElement('t13-entity-inspector');
    document.body.appendChild(inspector);

    window.addEventListener('inspect-character', (e) => {
        const entityId = e.detail;
        inspector.inspect({ id: entityId, name: entityId, description: "A hooked entity in this narrative plot." });
    });
}

function buildSpeciesPreset(speciesKey) {
    switch (speciesKey) {
        case 'Insectoid':
            return createSpeciesDescendant({
                id: 't13-species-insectoid',
                name: 'Insectoid',
                incarna: 'Trial',
                bodyPlan: 'insectoid',
                scaleModifier: 0,
                voiceProfile: { preset: 'chitin-click' }
            });
        case 'Mech':
            return createSpeciesDescendant({
                id: 't13-species-mech',
                name: 'Mech',
                incarna: 'Craft',
                bodyPlan: 'humanoid',
                scaleModifier: 1,
                voiceProfile: { preset: 'synth-vocoder' }
            });
        case 'Giant':
            return createSpeciesDescendant({
                id: 't13-species-giant',
                name: 'Giant',
                incarna: 'Burden',
                bodyPlan: 'humanoid',
                scaleModifier: 4,
                voiceProfile: { preset: 'giant-kaiju' }
            });
        case 'Fae':
            return createSpeciesDescendant({
                id: 't13-species-fae',
                name: 'Fae',
                incarna: 'Gossamer',
                bodyPlan: 'winged',
                scaleModifier: -3,
                voiceProfile: { preset: 'fae-small' }
            });
        default:
            return createHumanSpeciesDescendant();
    }
}

function setupCharacterCreator() {
    const btnCalculate = document.getElementById('btnGenerateCatalyst');
    const btnShowCreator = document.getElementById('btnShowCreator');
    const creatorContent = document.getElementById('characterCreatorContent');
    const statsOutput = document.getElementById('characterStatsOutput');
    const rosterEl = document.getElementById('characterRoster');

    const mountCharacterSheet = (charData) => {
        if (!charData) return;
        activeCharacterId = charData.id;
        creatorContent.style.display = 'none';
        statsOutput.style.display = 'block';
        statsOutput.innerHTML = '';
        const sheet = document.createElement('t13-character-sheet');
        statsOutput.appendChild(sheet);
        activeCharacterSheet = sheet;
        sheet.bindSessionClient(bridge.client);
        sheet.setAudioHooks({ voipManager, liveAvatarController });
        sheet.setCharacter(charData);
        if (bridge.client?.projection) {
            sheet.setSessionState(bridge.client.projection);
        }
        bridge.attachComponents({ characterSheet: sheet });
        document.getElementById('cardOrdealHud')?.setActiveCharacterId?.(charData.id);
        voipManager?.setLocalVoiceProfile?.(charData);
    };

    const renderRoster = (proj) => {
        if (!rosterEl) return;
        const chars = Object.values(proj?.characters || {});
        rosterEl.innerHTML = '';
        for (const c of chars) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `btn ${c.id === activeCharacterId ? '' : 'btn-secondary'}`;
            btn.style.cssText = 'padding:5px 10px; font-size:0.78rem;';
            btn.dataset.charRosterId = c.id;
            const cName = Array.isArray(c.name) ? c.name[0] : (c.name || c.id);
            btn.textContent = `${cName} (${c.creationModel || 'Detailed'} • ${c.species?.name || 'Human'})`;
            btn.addEventListener('click', () => mountCharacterSheet(c));
            rosterEl.appendChild(btn);
        }
        if (chars.length && !activeCharacterSheet) {
            const mine = chars.find(c => c.ownerActorId === bridge.actorId) || chars[0];
            mountCharacterSheet(mine);
        }
    };

    bridge.onSessionEvent((evt) => {
        if (evt?.type?.startsWith('Character:') && bridge.client?.projection) {
            renderRoster(bridge.client.projection);
        }
    });
    const origProjSync = bridge.client?.on?.('projection', renderRoster);
    if (!origProjSync) {
        setTimeout(() => {
            if (bridge.client?.projection) renderRoster(bridge.client.projection);
            bridge.client?.on?.('projection', renderRoster);
        }, 250);
    }

    if (btnShowCreator) {
        btnShowCreator.addEventListener('click', () => {
            creatorContent.style.display = 'block';
            statsOutput.style.display = 'none';
        });
    }

    btnCalculate.addEventListener('click', async () => {
        const name = document.getElementById('inputCharName').value.trim();
        const charType = document.getElementById('selectCharType').value;
        const creationModel = document.getElementById('selectCreationModel')?.value || 'Detailed';
        const speciesKey = document.getElementById('selectSpeciesDescendant')?.value || 'Human';

        if (!name) return alert("Enter character name.");

        try {
            const geometryModule = T13NE.getModule('T13Geometry');
            const ichingModule = T13NE.getModule('IChing');

            const geoResult = geometryModule?.getGeometryFromString
                ? geometryModule.getGeometryFromString(name)
                : { full: Array.from(name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) };
            const geoVal = geoResult?.full || 13;
            const hexagramNum = (geoVal % 64) || 1;
            const hexagramData = ichingModule?.getHexagramData
                ? await ichingModule.getHexagramData(hexagramNum).catch(() => null)
                : (ichingModule?.getHexagram ? await ichingModule.getHexagram(hexagramNum).catch(() => null) : null);
            const hexagramName = hexagramData?.Hexagram?.Name || hexagramData?.name || `Hexagram ${hexagramNum}`;

            const speciesDescendant = buildSpeciesPreset(speciesKey);
            const boons = {
                Awe: 10 + (name.length % 5),
                Trial: 12 + (geoVal % 6),
                Craft: 8 + (name.charCodeAt(0) % 8),
                Wyrd: 9 + ((geoVal + name.length) % 7)
            };

            const OPPOSED_PAIRS = [
                [0, 9], [2, 13], [3, 22], [5, 16], [6, 1], [7, 14],
                [10, 4], [11, 21], [15, 12], [18, 20], [19, 17], [23, 8]
            ];
            const stats = OPPOSED_PAIRS.map(([facet, antifacet], idx) => {
                const delta = ((geoVal + idx * 7 + name.charCodeAt(idx % name.length)) % 9) - 4;
                const facetBoon = 13 + delta;
                return {
                    Facet: facet,
                    Facet_Boon: facetBoon,
                    Facet_Sway: 0,
                    Facet_Mutation_Matrix: 0,
                    Joined: true,
                    Antifacet_Mutation_Matrix: 0,
                    Antifacet: antifacet,
                    Antifacet_Boon: 26 - facetBoon,
                    AntiFacet_Sway: 0
                };
            });

            const charId = `char_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36)}`;
            const charData = {
                id: charId,
                ownerActorId: bridge.actorId,
                name,
                charType,
                creationModel,
                speciesDescendantId: speciesDescendant.id,
                species: speciesDescendant,
                incarna: speciesDescendant.incarna || 'Nature',
                scaleModifier: speciesDescendant.scaleModifier || 0,
                boons,
                facetweb: { Scale: speciesDescendant.scaleModifier || 0, Stats: stats },
                sway: { Chi: 3, 'Tao:Yin': 1, 'Tao:Yang': 1, Karma: 0, Renown: 0 },
                wounds: [],
                stressState: {},
                hexagram: { number: hexagramNum, name: hexagramName },
                significator: { name: "The Hierophant", suit: "Spades", pips: "V" },
                features: [
                    { name: "Resonant Harmony", description: "Your boons are perfectly aligned with the Cycle's current state." },
                    { name: "Unyielding Resolve", description: "Ignore 1 Stress per Act when pursuing your primary Catalyst." }
                ],
                descendants: [
                    {
                        id: `desc_${Date.now().toString(36)}`,
                        name: `${name}'s Field Gear`,
                        descendantType: 'Item',
                        incarna: 'Trial'
                    }
                ],
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
                hitches: []
            };

            if (bridge.client) {
                if (bridge.role === 'referee' && speciesKey !== 'Human') {
                    bridge.client.sendCommand('Species:Register', { species: speciesDescendant });
                }
                bridge.client.sendCommand('Character:Register', { character: charData });
            }
            mountCharacterSheet(charData);
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

    if (btnRoll) {
        btnRoll.addEventListener('click', () => {
            if (bridge.client && activeCharacterId) {
                bridge.client.sendCommand('Test:Perform', {
                    characterId: activeCharacterId,
                    testType: 'dice',
                    options: { facet: 'Trial', difficulty: 2 }
                });
            } else if (bridge.client) {
                bridge.client.sendCommand('RNG:Draw', { count: 3, min: 1, max: 6 });
            } else {
                const rolls = [Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1];
                vttCanvas.spawnDice(rolls);
            }
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            vttCanvas.clearDice();
            if (bridge.client && bridge.role === 'referee') {
                bridge.client.sendCommand('VTT:ClearTable', {});
            }
        });
    }
}

function mountLiveAvatarPreview(mesh, controller) {
    const canvas = document.getElementById('vtuberCanvas');
    if (!canvas || !mesh) return;
    try {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0b0f19);
        scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 1.8));
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
        keyLight.position.set(1.5, 2.5, 3);
        scene.add(keyLight);
        scene.add(mesh);

        const box = new THREE.Box3().setFromObject(mesh);
        const size = box.getSize(new THREE.Vector3());
        const upperY = box.min.y + size.y * 0.72;
        const w = canvas.clientWidth || 240;
        const h = canvas.clientHeight || 220;
        const camera = new THREE.PerspectiveCamera(32, w / h, 0.05, 30);
        camera.position.set(0, upperY, Math.max(size.y * 0.72, 0.75));
        camera.lookAt(0, upperY - size.y * 0.04, 0);

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(w, h, false);

        let lastTime = performance.now();
        const tick = (now) => {
            const dt = Math.min(0.1, (now - lastTime) / 1000);
            lastTime = now;
            controller?.blender?.update?.(dt);
            renderer.render(scene, camera);
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    } catch (err) {
        console.warn('Live Avatar WebGL preview unavailable:', err?.message);
    }
}

function setupVTuberWidget() {
    const btnWebcam = document.getElementById('toggleWebcam');
    const btnProcedural = document.getElementById('btnProceduralAvatar');
    const btnLoadVRM = document.getElementById('btnLoadVRM');

    if (btnWebcam) {
        btnWebcam.addEventListener('click', async () => {
            if (!liveAvatarController) return;
            const nextMode = liveAvatarController.mode === 'webcam' ? 'audio' : 'webcam';
            try {
                await liveAvatarController.setMode(nextMode, voipManager);
                btnWebcam.textContent = nextMode === 'webcam' ? 'Webcam Live (On)' : 'Enable Webcam';
            } catch (err) {
                console.warn('Webcam mode unavailable, switching to audio puppeting:', err?.message);
                await liveAvatarController.setMode('audio', voipManager);
                btnWebcam.textContent = 'Audio Puppet Mode';
            }
        });
    }
    if (btnProcedural) {
        btnProcedural.addEventListener('click', async () => {
            if (!liveAvatarController) return;
            await liveAvatarController.setMode('audio', voipManager);
        });
    }
    if (btnLoadVRM) {
        btnLoadVRM.addEventListener('click', () => {
            const charSheet = activeCharacterSheet || document.querySelector('t13-character-sheet');
            charSheet?.openAvatarMaker?.();
        });
    }
}

function setupNetworking() {
    const btnHost = document.getElementById('btnHostRoom');
    const btnJoin = document.getElementById('btnJoinRoom');
    const roomInput = document.getElementById('roomIdInput');
    const status = document.getElementById('connectionStatus');

    const connectRoom = async (isHost) => {
        const roomId = roomInput.value.trim();
        if (!roomId) return;
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('t13ne_session_id', roomId);
        }
        status.textContent = isHost ? 'Hosting...' : 'Joining...';
        try {
            if (isHost) await P2PNetworkManager.createRoom(roomId);
            else await P2PNetworkManager.joinRoom(roomId);
        } catch (p2pErr) {
            console.warn('PeerJS signaling unavailable; continuing via WebSocket/authoritative session:', p2pErr?.message);
        }
        const info = await bridge.connect({
            sessionId: roomId,
            actorId: bridge.actorId,
            storedRefereeToken: window.T13NE_Auth.token
        });
        status.textContent = `${isHost ? 'Hosting' : 'Joined'}: ${roomId} (${info.transportMode})`;
        status.style.color = "#10b981";
        syncAuthPanelFromBridge();
        voipManager?.start?.();
    };

    btnHost?.addEventListener('click', () => connectRoom(true));
    btnJoin?.addEventListener('click', () => connectRoom(false));
}

initApp();
