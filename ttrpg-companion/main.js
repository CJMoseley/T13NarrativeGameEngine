import T13NE from '/src/t13ne/T13NE.js';
import Logger from '/src/t13ne/core/Logger.js';
import P2PNetworkManager from '/src/t13ne/core/P2PNetworkManager.js';
import { VOIPManager } from '/src/t13ne/core/VOIPManager.js';
import { EventBus } from '/src/t13ne/core/EventBus.js';

import '/src/components/T13VttCanvas.js';
import '/src/components/T13CharacterSheet.js';
import '/src/components/T13PlotWidget.js';
import '/src/components/T13ProficiencyWidget.js';
import '/src/components/T13AnnexWidget.js';
import '/src/components/T13EntityInspector.js';

console.log("Bootstrap: Initializing TTRPG Companion client...");

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

        setupNetworking();
        setupPlotSystem();
        setupCharacterCreator();
        setupVttControls();
        setupInspector();

        EventBus.on('p2p:peer-connected', ({ peerId }) => {
            console.log(`P2P: Connected to peer ${peerId}`);
            if (voipManager) voipManager.callPeer(peerId);
            const vttCanvas = document.querySelector('t13-vtt-canvas');
            if (vttCanvas) vttCanvas.addToken(peerId, `Player ${peerId.substring(0,4)}`, 0xef4444);
        });

    } catch (error) {
        console.error("App Init: Narrative Engine failed to start", error);
        document.getElementById('connectionStatus').textContent = "Init Failed";
    }
}

function setupPlotSystem() {
    const btnGenerate = document.getElementById('btnGeneratePlot');
    const plotOutput = document.getElementById('activePlotOutput');

    btnGenerate.addEventListener('click', async () => {
        // Correct hierarchy: Plot is the master
        const plotData = {
            id: `plot_${Date.now()}`,
            Name: "The Breaking of the Third Seal",
            Rank: "Story",
            goal: "Prevent the emergence of the Archfiend at the Sector 7 gateway.",
            tensionLevel: 4,
            subPlots: [{ Name: "Infiltrate the Gateway", Rank: "Act" }],
            Hooked_Characters: [
                { id: 'char_kaelen', name: 'Kaelen Weaver', charType: 'Hero' },
                { id: 'npc_vex', name: 'The Silent Warden', charType: 'Vex' }
            ]
        };

        renderPlot(plotData);
        P2PNetworkManager.broadcast({ type: 'PLOT_SYNC', plot: plotData });
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
        // In a real session, we'd fetch the full entity from the engine cache
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

            creatorContent.style.display = 'none';
            statsOutput.style.display = 'block';
            statsOutput.innerHTML = '';
            const sheet = document.createElement('t13-character-sheet');
            statsOutput.appendChild(sheet);
            sheet.setCharacter(charData);

            P2PNetworkManager.broadcast({ type: 'CHARACTER_SYNC', character: charData });
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
            P2PNetworkManager.broadcast({ type: 'DICE_ROLL', rolls, total });
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
