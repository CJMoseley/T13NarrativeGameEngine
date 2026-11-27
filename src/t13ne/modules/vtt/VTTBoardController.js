/**
 * @module Modules/VTT/VTTBoardController
 * @description Unified 2D Top-Down / 3D Orbit / Psychosocial ActionSpace tabletop controller
 * shared by <t13-vtt-canvas> and VTTScene, with square/hex snapping, Reach ruler,
 * raycast token drag-and-drop, zone overlays, backdrop maps, and role-aware fog-of-war.
 */

import * as THREE from 'three';

export const VIEW_MODES = Object.freeze(['2d-topdown', '3d-orbit', 'psychosocial']);
export const GRID_TYPES = Object.freeze(['square', 'hex', 'none']);

const ZONE_COLOURS = Object.freeze({
    Open: 0x10b981,
    Closed: 0xef4444,
    Difficult: 0xa855f7,
    Hazard: 0xf59e0b,
    Custom: 0x38bdf8
});

/**
 * Maps tabletop world distance (in grid units) to T13 Reach bands.
 */
export function classifyReachBand(gridUnits) {
    if (gridUnits <= 1.5) return 'Close';
    if (gridUnits <= 5) return 'Near';
    if (gridUnits <= 12) return 'Far';
    return 'Distant';
}

/**
 * Snaps a world XZ coordinate onto square or pointy-top hex centers.
 */
export function snapBoardPosition(pos, { gridType = 'square', gridSize = 1, snapEnabled = true } = {}) {
    const x = Number(pos?.x ?? 0);
    const y = Number(pos?.y ?? 0);
    const z = Number(pos?.z ?? 0);
    if (!snapEnabled || gridType === 'none' || !Number.isFinite(gridSize) || gridSize <= 0) {
        return { x, y, z };
    }
    if (gridType === 'hex') {
        const size = gridSize * 0.6;
        const q = (Math.sqrt(3) / 3 * x - 1 / 3 * z) / size;
        const r = (2 / 3 * z) / size;
        const s = -q - r;
        let rq = Math.round(q);
        let rr = Math.round(r);
        let rs = Math.round(s);
        const dq = Math.abs(rq - q);
        const dr = Math.abs(rr - r);
        const ds = Math.abs(rs - s);
        if (dq > dr && dq > ds) rq = -rr - rs;
        else if (dr > ds) rr = -rq - rs;
        const wx = size * (Math.sqrt(3) * rq + Math.sqrt(3) / 2 * rr);
        const wz = size * (3 / 2 * rr);
        return { x: Number(wx.toFixed(4)), y, z: Number(wz.toFixed(4)) };
    }
    // Square grid: snap to cell centers or intersections at gridSize increments
    return {
        x: Math.round(x / gridSize) * gridSize,
        y,
        z: Math.round(z / gridSize) * gridSize
    };
}

/**
 * Measures Euclidean world distance, grid steps, and T13 Reach band.
 */
export function measureBoardDistance(start, end, { gridSize = 1 } = {}) {
    const dx = Number(end?.x ?? 0) - Number(start?.x ?? 0);
    const dz = Number(end?.z ?? 0) - Number(start?.z ?? 0);
    const worldUnits = Math.hypot(dx, dz);
    const safeGrid = gridSize > 0 ? gridSize : 1;
    const gridUnits = worldUnits / safeGrid;
    return {
        worldUnits: Number(worldUnits.toFixed(3)),
        gridUnits: Number(gridUnits.toFixed(2)),
        reachBand: classifyReachBand(gridUnits)
    };
}

export class VTTBoardController {
    /**
     * @param {object} [options]
     * @param {THREE.Scene} [options.scene]
     * @param {number} [options.aspect=1.6]
     * @param {number} [options.orthoSize=12]
     * @param {Function} [options.onTokenMoveCommit]
     * @param {Function} [options.onFogToggle]
     * @param {Function} [options.onMeasure]
     * @param {Function} [options.onViewModeChange]
     */
    constructor(options = {}) {
        this.scene = options.scene ?? new THREE.Scene();
        this.aspect = options.aspect ?? 1.6;
        this.orthoSize = options.orthoSize ?? 12;

        this.perspectiveCamera = new THREE.PerspectiveCamera(55, this.aspect, 0.1, 500);
        this.perspectiveCamera.position.set(0, 14, 14);
        this.perspectiveCamera.lookAt(0, 0, 0);

        const halfH = this.orthoSize;
        const halfW = halfH * this.aspect;
        this.orthoCamera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 500);
        this.orthoCamera.position.set(0, 30, 0.001);
        this.orthoCamera.lookAt(0, 0, 0);

        this.viewMode = '3d-orbit';
        this.activeCamera = this.perspectiveCamera;
        this.activeTool = 'move'; // 'move' | 'ruler' | 'fog'
        this.boardConfig = {
            width: 20,
            height: 20,
            gridType: 'square',
            gridSize: 1,
            snapEnabled: true,
            backdropUrl: null
        };

        this.tokenObjects = new Map(); // tokenId -> THREE.Object3D
        this.zoneGroup = new THREE.Group();
        this.zoneGroup.name = 'vtt-zones';
        this.fogGroup = new THREE.Group();
        this.fogGroup.name = 'vtt-fog';
        this.rulerGroup = new THREE.Group();
        this.rulerGroup.name = 'vtt-ruler';
        this.boardGroup = new THREE.Group();
        this.boardGroup.name = 'vtt-board';

        this.scene.add(this.boardGroup);
        this.scene.add(this.zoneGroup);
        this.scene.add(this.fogGroup);
        this.scene.add(this.rulerGroup);

        this.gridHelper = null;
        this.tableMesh = null;
        this.backdropPlane = null;
        this.rulerLine = null;

        this.raycaster = new THREE.Raycaster();
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.draggingTokenId = null;
        this.dragStartPos = null;
        this.rulerStart = null;
        this.lastMeasurement = null;

        this.onTokenMoveCommit = options.onTokenMoveCommit ?? null;
        this.onFogToggle = options.onFogToggle ?? null;
        this.onMeasure = options.onMeasure ?? null;
        this.onViewModeChange = options.onViewModeChange ?? null;
        this.spaceVisualizer = options.spaceVisualizer ?? null;

        this._rebuildBoardVisuals();
    }

    setAspect(aspect) {
        if (!Number.isFinite(aspect) || aspect <= 0) return;
        this.aspect = aspect;
        this.perspectiveCamera.aspect = aspect;
        this.perspectiveCamera.updateProjectionMatrix();
        const halfH = this.orthoSize;
        const halfW = halfH * aspect;
        this.orthoCamera.left = -halfW;
        this.orthoCamera.right = halfW;
        this.orthoCamera.top = halfH;
        this.orthoCamera.bottom = -halfH;
        this.orthoCamera.updateProjectionMatrix();
    }

    setViewMode(mode) {
        if (!VIEW_MODES.includes(mode)) {
            throw new Error(`Unsupported VTT viewMode '${mode}'.`);
        }
        this.viewMode = mode;
        this.activeCamera = mode === '2d-topdown' ? this.orthoCamera : this.perspectiveCamera;
        if (this.spaceVisualizer) {
            if (mode === 'psychosocial') this.spaceVisualizer.show?.();
            else this.spaceVisualizer.hide?.();
        }
        this.onViewModeChange?.(mode, this.activeCamera);
        return this.activeCamera;
    }

    setTool(tool) {
        if (['move', 'ruler', 'fog'].includes(tool)) {
            this.activeTool = tool;
        }
    }

    configureBoard(config = {}) {
        this.boardConfig = { ...this.boardConfig, ...config };
        this._rebuildBoardVisuals();
    }

    _rebuildBoardVisuals() {
        while (this.boardGroup.children.length) {
            const child = this.boardGroup.children.pop();
            child.geometry?.dispose?.();
            child.material?.dispose?.();
        }
        const width = this.boardConfig.width || 20;
        const depth = this.boardConfig.height || 20;
        const tableGeo = new THREE.PlaneGeometry(width, depth);
        const tableMat = new THREE.MeshLambertMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
        this.tableMesh = new THREE.Mesh(tableGeo, tableMat);
        this.tableMesh.rotation.x = -Math.PI / 2;
        this.tableMesh.position.y = -0.02;
        this.tableMesh.name = 'vtt-table-plane';
        this.boardGroup.add(this.tableMesh);

        if (this.boardConfig.gridType !== 'none') {
            const divisions = Math.max(2, Math.round(Math.max(width, depth) / (this.boardConfig.gridSize || 1)));
            // Keep GridHelper horizontal on XZ plane (no X rotation!)
            this.gridHelper = new THREE.GridHelper(Math.max(width, depth), divisions, 0x475569, 0x263449);
            this.gridHelper.position.y = 0.002;
            this.boardGroup.add(this.gridHelper);
        } else {
            this.gridHelper = null;
        }
    }

    setBackdropImage(url, loader = null) {
        this.boardConfig.backdropUrl = url || null;
        if (this.backdropPlane) {
            this.boardGroup.remove(this.backdropPlane);
            this.backdropPlane.geometry?.dispose?.();
            this.backdropPlane.material?.map?.dispose?.();
            this.backdropPlane.material?.dispose?.();
            this.backdropPlane = null;
        }
        if (!url || typeof THREE.TextureLoader === 'undefined') return null;
        const texLoader = loader ?? new THREE.TextureLoader();
        const texture = texLoader.load(url);
        const mapGeo = new THREE.PlaneGeometry(this.boardConfig.width || 20, this.boardConfig.height || 20);
        const mapMat = new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide });
        this.backdropPlane = new THREE.Mesh(mapGeo, mapMat);
        this.backdropPlane.rotation.x = -Math.PI / 2;
        this.backdropPlane.position.y = -0.005;
        this.boardGroup.add(this.backdropPlane);
        return this.backdropPlane;
    }

    registerTokenObject(tokenId, object3D) {
        object3D.userData.tokenId = tokenId;
        object3D.traverse?.(node => {
            node.userData.tokenId = tokenId;
        });
        this.tokenObjects.set(tokenId, object3D);
    }

    unregisterTokenObject(tokenId) {
        this.tokenObjects.delete(tokenId);
    }

    syncZones(zones = {}) {
        while (this.zoneGroup.children.length) {
            const child = this.zoneGroup.children.pop();
            child.geometry?.dispose?.();
            child.material?.dispose?.();
        }
        for (const zone of Object.values(zones || {})) {
            if (!zone?.bounds) continue;
            const zoneGeo = new THREE.PlaneGeometry(zone.bounds.width || 4, zone.bounds.depth || 4);
            const zoneMat = new THREE.MeshLambertMaterial({
                color: zone.color ?? ZONE_COLOURS[zone.kind] ?? 0x38bdf8,
                transparent: true,
                opacity: 0.28,
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(zoneGeo, zoneMat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(zone.bounds.x || 0, 0.006, zone.bounds.z || 0);
            mesh.userData.zoneId = zone.id;
            mesh.userData.zoneKind = zone.kind;
            this.zoneGroup.add(mesh);
        }
    }

    syncFogOfWar(fogState = { enabled: false, hiddenCells: [] }, viewerRole = 'player') {
        while (this.fogGroup.children.length) {
            const child = this.fogGroup.children.pop();
            child.geometry?.dispose?.();
            child.material?.dispose?.();
        }
        if (!fogState?.enabled || !Array.isArray(fogState.hiddenCells)) return;
        const cellSize = this.boardConfig.gridSize || 1;
        const isReferee = viewerRole === 'referee';
        for (const cell of fogState.hiddenCells) {
            const fogGeo = new THREE.BoxGeometry(cellSize * 0.98, 0.08, cellSize * 0.98);
            const fogMat = new THREE.MeshLambertMaterial({
                color: 0x050814,
                transparent: isReferee,
                opacity: isReferee ? 0.35 : 1.0
            });
            const tile = new THREE.Mesh(fogGeo, fogMat);
            tile.position.set(cell.x * cellSize, 0.04, cell.z * cellSize);
            tile.userData.fogCell = { x: cell.x, z: cell.z };
            this.fogGroup.add(tile);
        }
    }

    raycastGround(ndc) {
        this.raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), this.activeCamera);
        const point = new THREE.Vector3();
        const hit = this.raycaster.ray.intersectPlane(this.groundPlane, point);
        return hit ? { x: point.x, y: 0, z: point.z } : null;
    }

    raycastToken(ndc) {
        this.raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), this.activeCamera);
        const targets = Array.from(this.tokenObjects.values());
        if (!targets.length) return null;
        const hits = this.raycaster.intersectObjects(targets, true);
        if (!hits.length) return null;
        let obj = hits[0].object;
        while (obj && !obj.userData?.tokenId) obj = obj.parent;
        return obj?.userData?.tokenId ?? null;
    }

    handlePointerDown(ndc) {
        const ground = this.raycastGround(ndc);
        if (this.activeTool === 'ruler') {
            if (!ground) return null;
            this.rulerStart = ground;
            this._updateRulerVisual(ground, ground);
            return { action: 'ruler-start', point: ground };
        }
        if (this.activeTool === 'fog') {
            if (!ground) return null;
            const snapped = snapBoardPosition(ground, this.boardConfig);
            const cell = { x: Math.round(snapped.x / (this.boardConfig.gridSize || 1)), z: Math.round(snapped.z / (this.boardConfig.gridSize || 1)) };
            this.onFogToggle?.(cell);
            return { action: 'fog-cell', cell };
        }
        const tokenId = this.raycastToken(ndc);
        if (!tokenId) return null;
        const obj = this.tokenObjects.get(tokenId);
        this.draggingTokenId = tokenId;
        this.dragStartPos = obj ? { x: obj.position.x, y: obj.position.y, z: obj.position.z } : ground;
        return { action: 'drag-start', tokenId, position: this.dragStartPos };
    }

    handlePointerMove(ndc) {
        const ground = this.raycastGround(ndc);
        if (!ground) return null;

        if (this.activeTool === 'ruler' && this.rulerStart) {
            this._updateRulerVisual(this.rulerStart, ground);
            this.lastMeasurement = measureBoardDistance(this.rulerStart, ground, this.boardConfig);
            this.onMeasure?.(this.lastMeasurement);
            return { action: 'ruler-move', measurement: this.lastMeasurement };
        }

        if (this.draggingTokenId) {
            const snapped = snapBoardPosition(ground, this.boardConfig);
            const obj = this.tokenObjects.get(this.draggingTokenId);
            if (obj) obj.position.set(snapped.x, 0, snapped.z);
            return { action: 'drag-move', tokenId: this.draggingTokenId, position: snapped };
        }
        return null;
    }

    handlePointerUp(ndc) {
        if (this.activeTool === 'ruler' && this.rulerStart) {
            const ground = this.raycastGround(ndc) ?? this.rulerStart;
            const measurement = measureBoardDistance(this.rulerStart, ground, this.boardConfig);
            this.lastMeasurement = measurement;
            this.onMeasure?.(measurement);
            this.rulerStart = null;
            return { action: 'ruler-end', measurement };
        }

        if (this.draggingTokenId) {
            const tokenId = this.draggingTokenId;
            const ground = this.raycastGround(ndc);
            const obj = this.tokenObjects.get(tokenId);
            const rawPos = ground ?? (obj ? { x: obj.position.x, y: 0, z: obj.position.z } : this.dragStartPos);
            const snapped = snapBoardPosition(rawPos, this.boardConfig);
            if (obj) obj.position.set(snapped.x, 0, snapped.z);
            this.draggingTokenId = null;
            this.dragStartPos = null;
            this.onTokenMoveCommit?.(tokenId, snapped);
            return { action: 'drag-end', tokenId, position: snapped };
        }
        return null;
    }

    _updateRulerVisual(start, end) {
        while (this.rulerGroup.children.length) {
            const child = this.rulerGroup.children.pop();
            child.geometry?.dispose?.();
            child.material?.dispose?.();
        }
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(start.x, 0.05, start.z),
            new THREE.Vector3(end.x, 0.05, end.z)
        ]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xfacc15 });
        this.rulerLine = new THREE.Line(lineGeo, lineMat);
        this.rulerGroup.add(this.rulerLine);
    }

    dispose() {
        for (const grp of [this.boardGroup, this.zoneGroup, this.fogGroup, this.rulerGroup]) {
            while (grp.children.length) {
                const c = grp.children.pop();
                c.geometry?.dispose?.();
                c.material?.map?.dispose?.();
                c.material?.dispose?.();
            }
        }
        this.tokenObjects.clear();
    }
}
