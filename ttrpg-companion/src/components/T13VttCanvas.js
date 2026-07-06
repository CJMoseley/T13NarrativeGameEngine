import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import T13NE from '/src/t13ne/T13NE.js';
import P2PNetworkManager from '/src/t13ne/core/P2PNetworkManager.js';
import { EventBus } from '/src/t13ne/core/EventBus.js';

export class T13VttCanvas extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.grid = null;
        this.tokens = new Map();
        this.dice = [];
        this.isDragging = false;
        this.draggedToken = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = '<style>:host { display: block; width: 100%; height: 100%; } canvas { width: 100%; height: 100%; }</style><div id="container" style="width: 100%; height: 100%;"></div>';
        this.initThree();
        this.setupEventListeners();
        this.animate();
    }

    initThree() {
        const container = this.shadowRoot.getElementById('container');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f0f1a);
        this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 10);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.grid = new THREE.GridHelper(20, 20, 0x444466, 0x222233);
        this.scene.add(this.grid);
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);
    }

    setupEventListeners() {
        EventBus.on('p2p:msg:TOKEN_MOVE', ({ message }) => this.updateTokenPosition(message.tokenId, message.position, false));
        EventBus.on('p2p:msg:DICE_ROLL', ({ message }) => this.spawnDice(message.rolls));
        EventBus.on('p2p:msg:PLOT_SYNC', ({ message }) => this.updatePlotContext(message.plot));
    }

    updatePlotContext(plot) {
        const tension = plot.tensionLevel || 0;
        this.scene.background.lerp(new THREE.Color(0x2a0a0a), tension / 11);
        if (this.grid) this.grid.material.color.setHSL(0, 0.5, 0.3 + (tension / 20));
    }

    addToken(id, name, color = 0x3b82f6) {
        const group = new THREE.Group();
        group.userData.tokenId = id;
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32), new THREE.MeshStandardMaterial({ color }));
        group.add(mesh);
        this.scene.add(group);
        this.tokens.set(id, group);
        return group;
    }

    updateTokenPosition(id, pos, broadcast = true) {
        let t = this.tokens.get(id) || this.addToken(id, id);
        t.position.set(pos.x, 0, pos.z);
        if (broadcast) P2PNetworkManager.broadcast({ type: 'TOKEN_MOVE', tokenId: id, position: pos });
    }

    spawnDice(rolls) {
        rolls.forEach((v, i) => {
            const die = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
            die.position.set(Math.random(), 5+i, Math.random());
            this.scene.add(die);
            this.dice.push(die);
        });
    }

    clearDice() { this.dice.forEach(d => this.scene.remove(d)); this.dice = []; }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.dice.forEach(d => { if(d.position.y > 0.25) d.position.y -= 0.1; });
        this.renderer.render(this.scene, this.camera);
    }
}
customElements.define('t13-vtt-canvas', T13VttCanvas);
