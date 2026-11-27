import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import P2PNetworkManager from '/src/t13ne/core/P2PNetworkManager.js';
import { EventBus } from '/src/t13ne/core/EventBus.js';
import { VTTBoardController } from '/src/t13ne/modules/vtt/VTTBoardController.js';
import { buildVttToken, disposeVttToken, setTokenSpeakingState, updateTokenStatusPips } from '/src/t13ne/modules/vtt/VTTTokenBuilder.js';
import { decodeSkinSyncPayload } from '/src/t13ne/procgen/avatar/AvatarSkinDocument.js';

export class T13VttCanvas extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.scene = null;
        this.renderer = null;
        this.controls = null;
        this.boardController = null;
        this.sessionClient = null;
        this.viewerRole = 'player';
        this.tokens = new Map();
        this._tokenSpecs = new Map();
        this.dice = [];
        this._frameId = null;
        this._resizeObserver = null;
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; position: relative; width: 100%; height: 100%; min-height: 420px; }
                .vtt-shell { position: relative; width: 100%; height: 100%; overflow: hidden; background: #0f172a; }
                .vtt-toolbar {
                    position: absolute; top: 10px; left: 10px; right: 10px; z-index: 20;
                    display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
                    background: rgba(15, 23, 42, 0.85); border: 1px solid #334155; border-radius: 8px;
                    padding: 6px 10px; color: #e2e8f0; font: 12px/1.2 system-ui, sans-serif;
                }
                .vtt-toolbar button, .vtt-toolbar select, .vtt-toolbar input {
                    background: #1e293b; color: #f8fafc; border: 1px solid #475569; border-radius: 4px;
                    padding: 4px 8px; font-size: 12px; cursor: pointer;
                }
                .vtt-toolbar button.active { background: #2563eb; border-color: #60a5fa; }
                .vtt-measure { margin-left: auto; color: #facc15; font-family: monospace; font-weight: 700; }
                #container { width: 100%; height: 100%; }
                #psychosocial-overlay { position: absolute; inset: 0; pointer-events: none; z-index: 15; display: none; }
            </style>
            <div class="vtt-shell">
                <div class="vtt-toolbar">
                    <button type="button" data-view="3d-orbit" class="active">3D Orbit</button>
                    <button type="button" data-view="2d-topdown">2D Top-Down</button>
                    <button type="button" data-view="psychosocial">Psychosocial</button>
                    <span style="opacity:0.4">|</span>
                    <button type="button" data-tool="move" class="active">Move</button>
                    <button type="button" data-tool="ruler">Reach Ruler</button>
                    <button type="button" data-tool="fog">Fog</button>
                    <select id="vtt-grid-mode" aria-label="Grid type">
                        <option value="square">Square Snap</option>
                        <option value="hex">Hex Snap</option>
                        <option value="none">Free</option>
                    </select>
                    <input type="text" id="vtt-backdrop-input" placeholder="Map backdrop URL..." style="width:150px;">
                    <button type="button" id="vtt-backdrop-apply">Map</button>
                    <span class="vtt-measure" id="vtt-measure-readout">Reach: —</span>
                </div>
                <div id="container"></div>
                <div id="psychosocial-overlay"></div>
            </div>
        `;
        this.initThree();
        this.setupToolbar();
        this.setupEventListeners();
        this.animate();
    }

    disconnectedCallback() {
        if (this._frameId) cancelAnimationFrame(this._frameId);
        this._resizeObserver?.disconnect();
        this.controls?.dispose();
        this.boardController?.dispose();
        this.renderer?.dispose();
    }

    initThree() {
        const container = this.shadowRoot.getElementById('container');
        const width = Math.max(container.clientWidth || 800, 320);
        const height = Math.max(container.clientHeight || 500, 320);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a);
        this.scene.add(new THREE.HemisphereLight(0xe2e8f0, 0x334155, 1.3));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
        dirLight.position.set(6, 12, 8);
        this.scene.add(dirLight);

        this.boardController = new VTTBoardController({
            scene: this.scene,
            aspect: width / height,
            onTokenMoveCommit: (tokenId, pos) => {
                if (this.sessionClient) {
                    this.sessionClient.sendCommand('VTT:MoveToken', { tokenId, position: pos });
                } else {
                    P2PNetworkManager.broadcast({ type: 'TOKEN_MOVE', tokenId, position: pos });
                }
            },
            onMeasure: (m) => {
                const el = this.shadowRoot?.getElementById('vtt-measure-readout');
                if (el) el.textContent = `Reach: ${m.gridUnits}u (${m.reachBand})`;
            },
            onFogToggle: (cell) => {
                if (!this.sessionClient || this.viewerRole !== 'referee') return;
                const fog = this.sessionClient.projection?.table?.fogOfWar || { enabled: true, hiddenCells: [] };
                const exists = fog.hiddenCells.some(c => c.x === cell.x && c.z === cell.z);
                const nextCells = exists
                    ? fog.hiddenCells.filter(c => !(c.x === cell.x && c.z === cell.z))
                    : [...fog.hiddenCells, cell];
                this.sessionClient.sendCommand('VTT:SetFog', { enabled: true, hiddenCells: nextCells });
            }
        });

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.boardController.activeCamera, this.renderer.domElement);
        this.controls.maxPolarAngle = Math.PI * 0.47;

        const toNdc = (event) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            return {
                x: ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1,
                y: -((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1
            };
        };

        this.renderer.domElement.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            const res = this.boardController.handlePointerDown(toNdc(e));
            if (res && this.controls) this.controls.enabled = false;
        });
        this.renderer.domElement.addEventListener('pointermove', (e) => {
            this.boardController.handlePointerMove(toNdc(e));
        });
        this.renderer.domElement.addEventListener('pointerup', (e) => {
            this.boardController.handlePointerUp(toNdc(e));
            if (this.controls) this.controls.enabled = true;
        });

        this._resizeObserver = new ResizeObserver(() => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            if (!w || !h) return;
            this.boardController.setAspect(w / h);
            this.renderer.setSize(w, h);
        });
        this._resizeObserver.observe(container);
    }

    setupToolbar() {
        const viewBtns = this.shadowRoot.querySelectorAll('[data-view]');
        viewBtns.forEach(btn => btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-view');
            viewBtns.forEach(b => b.classList.toggle('active', b === btn));
            this.setViewMode(mode);
        }));

        const toolBtns = this.shadowRoot.querySelectorAll('[data-tool]');
        toolBtns.forEach(btn => btn.addEventListener('click', () => {
            const tool = btn.getAttribute('data-tool');
            toolBtns.forEach(b => b.classList.toggle('active', b === btn));
            this.boardController?.setTool(tool);
        }));

        const gridSelect = this.shadowRoot.getElementById('vtt-grid-mode');
        gridSelect?.addEventListener('change', () => {
            const gridType = gridSelect.value;
            this.boardController?.configureBoard({ gridType, snapEnabled: gridType !== 'none' });
            if (this.sessionClient && this.viewerRole === 'referee') {
                this.sessionClient.sendCommand('VTT:SetBoardConfig', { gridType, snapEnabled: gridType !== 'none' });
            }
        });

        const mapBtn = this.shadowRoot.getElementById('vtt-backdrop-apply');
        const mapInput = this.shadowRoot.getElementById('vtt-backdrop-input');
        mapBtn?.addEventListener('click', () => {
            const url = mapInput?.value?.trim() || null;
            this.boardController?.setBackdropImage(url);
            if (this.sessionClient && this.viewerRole === 'referee') {
                this.sessionClient.sendCommand('VTT:SetBoardConfig', { backdropUrl: url });
            }
        });
    }

    setViewMode(mode) {
        if (!this.boardController) return;
        const cam = this.boardController.setViewMode(mode);
        if (this.controls) {
            this.controls.object = cam;
            this.controls.enableRotate = mode === '3d-orbit';
            this.controls.update();
        }
        const overlay = this.shadowRoot.getElementById('psychosocial-overlay');
        if (overlay) {
            overlay.style.display = mode === 'psychosocial' ? 'block' : 'none';
            if (mode === 'psychosocial') {
                this._renderPsychosocialGraph(overlay);
            }
        }
    }

    _renderPsychosocialGraph(container) {
        container.innerHTML = '';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        const cx = (container.clientWidth || 600) / 2;
        const cy = (container.clientHeight || 400) / 2;
        const tokens = Array.from(this.tokens.entries());
        tokens.forEach(([id, obj], i) => {
            const x = cx + (obj.position.x || (i * 2 - 2)) * 28;
            const y = cy + (obj.position.z || 0) * 28;
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('cx', String(x));
            c.setAttribute('cy', String(y));
            c.setAttribute('r', '18');
            c.setAttribute('fill', '#1e293b');
            c.setAttribute('stroke', '#38bdf8');
            c.setAttribute('stroke-width', '2');
            const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            t.setAttribute('x', String(x));
            t.setAttribute('y', String(y + 4));
            t.setAttribute('text-anchor', 'middle');
            t.setAttribute('fill', '#f8fafc');
            t.setAttribute('font-size', '10');
            t.textContent = obj.userData?.nameplate?.text || id;
            g.append(c, t);
            svg.appendChild(g);
        });
        container.appendChild(svg);
    }

    bindSessionClient(client, viewerRole = 'player') {
        this.sessionClient = client;
        this.viewerRole = viewerRole;
        if (!client) return;
        client.on('projection', (proj) => this.syncFromProjection(proj, this.viewerRole));
        client.on('event', (evt) => {
            if (evt.type === 'Test:Resolved' || evt.type === 'Test:Performed' || evt.type === 'RNG:Drawn') {
                const rolls = evt.payload?.result?.diceRolls
                    ?? evt.payload?.result?.rolls
                    ?? evt.payload?.rolls
                    ?? evt.payload?.results
                    ?? evt.payload?.dice?.rolls;
                if (Array.isArray(rolls) && rolls.length) this.spawnDice(rolls.slice(0, 12));
            }
        });
        if (client.projection) {
            this.syncFromProjection(client.projection, this.viewerRole);
        }
    }

    async syncFromProjection(projection, viewerRole = 'player') {
        if (!projection?.table) return;
        this.viewerRole = viewerRole;
        const table = projection.table;
        if (table.board) {
            this.boardController?.configureBoard(table.board);
            if (table.board.backdropUrl && this.boardController.boardConfig.backdropUrl !== table.board.backdropUrl) {
                this.boardController.setBackdropImage(table.board.backdropUrl);
            }
        }
        this.boardController?.syncZones(table.zones || {});
        this.boardController?.syncFogOfWar(table.fogOfWar || { enabled: false, hiddenCells: [] }, viewerRole);

        const nextTokens = table.tokens || {};
        for (const existingId of Array.from(this.tokens.keys())) {
            if (!nextTokens[existingId]) {
                const obj = this.tokens.get(existingId);
                this.scene.remove(obj);
                disposeVttToken(obj);
                this.tokens.delete(existingId);
                this._tokenSpecs.delete(existingId);
                this.boardController?.unregisterTokenObject(existingId);
            }
        }
        for (const [tokenId, spec] of Object.entries(nextTokens)) {
            const rawSkin = table.skins?.[spec.characterId ?? tokenId];
            const skinDocument = rawSkin ? (rawSkin.rlePixels ? decodeSkinSyncPayload(rawSkin) : rawSkin) : null;
            const prev = this.tokens.get(tokenId);
            if (!prev) {
                const char = projection.characters?.[spec.characterId];
                const species = projection.speciesDescendants?.[spec.speciesId];
                await this.addToken(tokenId, spec.name, spec.color, { ...spec, skinDocument, character: char, species });
            } else {
                prev.position.set(spec.position?.x || 0, spec.position?.y || 0, spec.position?.z || 0);
                if (Number.isFinite(spec.facing)) prev.rotation.y = spec.facing;
                updateTokenStatusPips(prev, spec.status);
            }
        }
    }

    setupEventListeners() {
        EventBus.on('p2p:msg:TOKEN_MOVE', ({ message }) => this.updateTokenPosition(message.tokenId, message.position, false));
        EventBus.on('p2p:msg:DICE_ROLL', ({ message }) => this.spawnDice(message.rolls));
        EventBus.on('p2p:msg:PLOT_SYNC', ({ message }) => this.updatePlotContext(message.plot));
        EventBus.on('p2p:msg:CLEAR_TABLE', () => this.clearDice());
        EventBus.on('vtt:place-prop', (tokenSpec) => {
            if (this.sessionClient) {
                this.sessionClient.sendCommand('VTT:SpawnToken', tokenSpec);
            } else {
                this.addToken(tokenSpec.id, tokenSpec.name, tokenSpec.color, tokenSpec);
            }
        });
    }

    updatePlotContext(plot) {
        const tension = plot?.tensionLevel || 0;
        if (this.scene?.background) {
            this.scene.background.setHex(0x0f172a).lerp(new THREE.Color(0x2a0a0a), tension / 11);
        }
    }

    async addToken(id, name, color = 0x3b82f6, spec = {}) {
        if (this.tokens.has(id)) {
            return this.tokens.get(id);
        }
        const tokenSpec = {
            id,
            name: name ?? id,
            color,
            ...spec
        };
        const group = await buildVttToken(tokenSpec, {
            character: spec.character ?? null,
            species: spec.species ?? null,
            skinDocument: spec.skinDocument ?? null
        });
        this.scene.add(group);
        this.tokens.set(id, group);
        this._tokenSpecs.set(id, tokenSpec);
        this.boardController?.registerTokenObject(id, group);
        return group;
    }

    setActorSpeaking(actorId, active, level = 1) {
        for (const [id, spec] of this._tokenSpecs.entries()) {
            if (spec.ownerActorId === actorId || id === actorId) {
                const grp = this.tokens.get(id);
                if (grp) setTokenSpeakingState(grp, active, level);
            }
        }
    }

    async updateTokenPosition(id, pos, broadcast = true) {
        const t = this.tokens.get(id) || await this.addToken(id, id);
        t.position.set(pos.x, pos.y || 0, pos.z);
        if (broadcast) {
            if (this.sessionClient) {
                this.sessionClient.sendCommand('VTT:MoveToken', { tokenId: id, position: pos });
            } else {
                P2PNetworkManager.broadcast({ type: 'TOKEN_MOVE', tokenId: id, position: pos });
            }
        }
    }

    spawnDice(rolls) {
        rolls.forEach((v, i) => {
            const dieGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
            const dieMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });
            const die = new THREE.Mesh(dieGeo, dieMat);
            die.position.set((i % 4) - 1.5, 4 + i * 0.6, Math.floor(i / 4) - 0.5);
            die.userData.rollValue = v;
            this.scene.add(die);
            this.dice.push(die);
        });
    }

    clearDice() {
        this.dice.forEach(d => {
            this.scene.remove(d);
            d.geometry?.dispose?.();
            d.material?.dispose?.();
        });
        this.dice = [];
    }

    animate() {
        this._frameId = requestAnimationFrame(() => this.animate());
        this.dice.forEach(d => { if (d.position.y > 0.25) d.position.y -= 0.12; });
        this.controls?.update();
        if (this.renderer && this.scene && this.boardController?.activeCamera) {
            this.renderer.render(this.scene, this.boardController.activeCamera);
        }
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('t13-vtt-canvas')) {
    customElements.define('t13-vtt-canvas', T13VttCanvas);
}
