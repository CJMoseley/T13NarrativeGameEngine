import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AvatarEngine, makeHumanoidVariant } from './AvatarEngine.js';
import { facetBoonsFromStats } from './AvatarFacetBody.js';
import { BODY_PLANS } from './BodyPlanSchema.js';
import { ATLAS_SIZE } from './AvatarAtlas.js';
import { AvatarSkinPainter } from './AvatarSkinPainter.js';
import { exportSkinDocument, importSkinDocument } from './AvatarSkinDocument.js';
import { atlasToPngBlob, pngBlobToAtlasPixels } from './AvatarAtlasIO.js';
import { speciesSkin } from './SpeciesSkins.js';
import {
    ACCESSORY_PRESETS,
    EMBLEM_SHAPES,
    PROCEDURAL_BRUSH_MODES,
    applySculptProfile,
    generateUVOverlayBuffer,
    paintProceduralBrush,
    removeAccessory,
    setAccessory
} from './AvatarSculptor.js';

/**
 * Integrated PS1/PS2 low-poly sculptor, procedural texture studio, UV inspector,
 * accessory outfitter, and portable skin-document editor.
 */
export class AvatarModelMaker {
    constructor({ character = null, species = null, skinDocument = null, onSave = null, onClose = () => {}, translate = (_, fallback) => fallback } = {}) {
        this.character = character;
        this.species = species;
        this.skinDocument = skinDocument;
        this.onSave = onSave;
        this.onClose = onClose;
        this.translate = translate;
        this.engine = new AvatarEngine();
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.frame = null;
        this.mesh = null;
        this.editRevision = 0;
        this.saving = false;
        this.undoStack = [];
        this.mode = 'rotate';
        this.sculptState = { symmetry: true, parts: {} };
    }

    open() {
        if (this.root) throw new Error('Model maker is already open.');
        this.root = document.createElement('section');
        this.root.className = 'avatar-maker';
        this.root.setAttribute('role', 'dialog');
        this.root.setAttribute('aria-modal', 'true');
        this.root.setAttribute('aria-label', this.translate('AVATAR_MAKER_TITLE', 'Avatar model maker'));
        const style = document.createElement('style');
        style.textContent = `
            .avatar-maker { position: fixed; inset: 0; z-index: 10000; background: #0e1726; color: #edf2ff; display: flex; flex-direction: column; font: 14px/1.4 system-ui, sans-serif; pointer-events: auto; }
            .avatar-maker * { box-sizing: border-box; }
            .avatar-maker__header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.8rem 1.2rem; border-bottom: 1px solid #334155; }
            .avatar-maker h2 { font-size: 1.15rem; margin: 0; }
            .avatar-maker__content { display: flex; flex: 1; min-height: 0; }
            .avatar-maker__tools { width: 280px; flex: 0 0 280px; overflow-y: auto; padding: 1rem; background: #182538; display: flex; flex-direction: column; gap: 0.85rem; }
            .avatar-maker__group { display: flex; flex-direction: column; gap: 0.4rem; border-bottom: 1px solid #25364e; padding-bottom: 0.65rem; }
            .avatar-maker__label { color: #c4d2e5; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; }
            .avatar-maker select, .avatar-maker button, .avatar-maker input[type=text] { font: inherit; color: #edf2ff; background: #273950; border: 1px solid #49617e; border-radius: 5px; padding: 0.42rem 0.6rem; }
            .avatar-maker button { cursor: pointer; text-align: left; }
            .avatar-maker button:hover { background: #38536f; }
            .avatar-maker button[aria-pressed=true] { background: #2e628b; border-color: #8cc9ff; }
            .avatar-maker button:disabled { opacity: 0.5; cursor: default; }
            .avatar-maker input[type=color] { width: 100%; height: 2.1rem; border: 1px solid #49617e; border-radius: 5px; background: #273950; cursor: pointer; }
            .avatar-maker input[type=range] { width: 100%; accent-color: #80c9ff; }
            .avatar-maker input[type=file] { position: absolute; width: 1px; height: 1px; opacity: 0; overflow: hidden; }
            .avatar-maker__help, .avatar-maker__status { color: #b6c8dc; margin: 0; font-size: 0.8rem; }
            .avatar-maker__viewport { position: relative; flex: 1; min-width: 0; min-height: 0; }
            .avatar-maker__uv-preview { position: absolute; right: 12px; bottom: 12px; width: 160px; height: 160px; border: 1px solid #8cc9ff; background: #090f19; display: none; image-rendering: pixelated; }
            @media (max-width: 650px) {
                .avatar-maker__content { flex-direction: column-reverse; }
                .avatar-maker__tools { width: auto; flex: 0 1 auto; max-height: 45%; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; }
                .avatar-maker__viewport { min-height: 180px; }
            }
        `;
        const title = document.createElement('h2');
        title.textContent = this.translate('AVATAR_MAKER_TITLE', 'Avatar Sculptor & Texture Studio');
        const instructions = document.createElement('p');
        instructions.textContent = this.translate('AVATAR_MAKER_INSTRUCTIONS', 'Drag to rotate. Select Paint to apply procedural brushes; Sculpt tunes low-poly proportions.');
        const toolbar = document.createElement('div');
        toolbar.className = 'avatar-maker__tools';
        instructions.className = 'avatar-maker__help';

        this.planSelect = document.createElement('select');
        this.planSelect.setAttribute('aria-label', this.translate('AVATAR_MAKER_BODY_PLAN', 'Body plan'));
        for (const [key, plan] of Object.entries(BODY_PLANS)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = plan.name;
            this.planSelect.appendChild(option);
        }
        this.planSelect.addEventListener('change', () => {
            if (this.dirty && !window.confirm(this.translate('AVATAR_MAKER_DISCARD', 'Discard the current painting? Save it first to keep it.'))) {
                this.planSelect.value = this.planName;
                return;
            }
            try {
                this.setPlan(this.planSelect.value);
                this.dirty = true;
                this.editRevision++;
            } catch (error) {
                console.error('Unable to change avatar body plan:', error);
                this.status.textContent = error.message;
                this.planSelect.value = this.planName;
            }
        });

        this.colour = document.createElement('input');
        this.colour.type = 'color';
        this.colour.value = '#ffcc66';
        this.colour.setAttribute('aria-label', this.translate('AVATAR_MAKER_BRUSH_COLOUR', 'Primary brush colour'));

        this.secondaryColour = document.createElement('input');
        this.secondaryColour.type = 'color';
        this.secondaryColour.value = '#1e293b';
        this.secondaryColour.setAttribute('aria-label', 'Secondary brush colour');

        this.brushMode = document.createElement('select');
        this.brushMode.setAttribute('aria-label', 'Procedural brush mode');
        for (const mode of PROCEDURAL_BRUSH_MODES) {
            const opt = document.createElement('option');
            opt.value = mode;
            opt.textContent = mode;
            this.brushMode.appendChild(opt);
        }

        this.emblemSelect = document.createElement('select');
        this.emblemSelect.setAttribute('aria-label', 'Emblem stamp shape');
        for (const shape of EMBLEM_SHAPES) {
            const opt = document.createElement('option');
            opt.value = shape;
            opt.textContent = shape;
            this.emblemSelect.appendChild(opt);
        }

        this.radius = document.createElement('input');
        this.radius.type = 'range';
        this.radius.min = '0';
        this.radius.max = '8';
        this.radius.value = '2';
        this.radius.setAttribute('aria-label', this.translate('AVATAR_MAKER_BRUSH_RADIUS', 'Brush radius in texture pixels'));

        this.expression = document.createElement('select');
        this.expression.setAttribute('aria-label', this.translate('AVATAR_MAKER_EXPRESSION', 'Expression preview'));
        for (const [value, key, label] of [
            ['neutral', 'AVATAR_MAKER_NEUTRAL', 'Neutral'],
            ['smile', 'AVATAR_MAKER_SMILE', 'Smile'],
            ['frown', 'AVATAR_MAKER_FROWN', 'Frown']
        ]) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = this.translate(key, label);
            this.expression.appendChild(option);
        }
        this.expression.addEventListener('change', () => this.updateExpression());

        // Sculpt controls
        this.sculptPartSelect = document.createElement('select');
        this.sculptPartSelect.setAttribute('aria-label', 'Sculpt part');
        this.sculptSymmetry = document.createElement('input');
        this.sculptSymmetry.type = 'checkbox';
        this.sculptSymmetry.checked = true;
        this.sculptScale = document.createElement('input');
        this.sculptScale.type = 'range';
        this.sculptScale.min = '0.6';
        this.sculptScale.max = '1.6';
        this.sculptScale.step = '0.05';
        this.sculptScale.value = '1.0';
        this.sculptInflate = document.createElement('input');
        this.sculptInflate.type = 'range';
        this.sculptInflate.min = '-0.04';
        this.sculptInflate.max = '0.06';
        this.sculptInflate.step = '0.005';
        this.sculptInflate.value = '0';

        const applySculptFromUI = () => {
            if (!this.mesh) return;
            const part = this.sculptPartSelect.value;
            if (!part) return;
            const scaleVal = Number(this.sculptScale.value);
            const inflateVal = Number(this.sculptInflate.value);
            this.sculptState.symmetry = this.sculptSymmetry.checked;
            this.sculptState.parts[part] = {
                scale: [scaleVal, scaleVal, scaleVal],
                offset: [0, 0, 0],
                inflate: inflateVal
            };
            applySculptProfile(this.mesh, this.sculptState);
            this.dirty = true;
            this.editRevision++;
        };
        this.sculptScale.addEventListener('input', applySculptFromUI);
        this.sculptInflate.addEventListener('input', applySculptFromUI);
        this.sculptSymmetry.addEventListener('change', applySculptFromUI);

        // Accessory toggles
        this.accessoryList = document.createElement('div');
        this.accessoryList.style.display = 'grid';
        this.accessoryList.style.gridTemplateColumns = '1fr 1fr';
        this.accessoryList.style.gap = '4px';
        for (const [key, preset] of Object.entries(ACCESSORY_PRESETS)) {
            const label = document.createElement('label');
            label.style.fontSize = '0.75rem';
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.gap = '4px';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.dataset.accessory = key;
            cb.addEventListener('change', () => {
                if (!this.mesh) return;
                if (cb.checked) {
                    setAccessory(this.mesh, key, { colour: parseInt(this.colour.value.slice(1), 16) });
                } else {
                    removeAccessory(this.mesh, preset.slot);
                }
                this.dirty = true;
                this.editRevision++;
            });
            label.append(cb, document.createTextNode(key));
            this.accessoryList.appendChild(label);
        }

        const save = this.button(this.translate('AVATAR_MAKER_DOWNLOAD', 'Save skin'), () => this.download());
        const characterSave = this.onSave ? this.button(this.translate('AVATAR_MAKER_SAVE_CHARACTER', 'Save to character'), () => this.saveCharacter()) : null;
        const file = document.createElement('input');
        file.type = 'file';
        file.accept = '.json,application/json';
        file.setAttribute('aria-label', this.translate('AVATAR_MAKER_IMPORT', 'Load skin'));
        file.addEventListener('change', async () => {
            try {
                if (!file.files?.[0]) return;
                if (this.dirty && !window.confirm(this.translate('AVATAR_MAKER_DISCARD', 'Discard the current painting? Save it first to keep it.'))) return;
                const mesh = this.mesh;
                const revision = this.editRevision;
                const data = JSON.parse(await file.files[0].text());
                if (!this.root || this.mesh !== mesh) return;
                if (revision !== this.editRevision) throw new Error('The model changed while the file was loading; import again.');
                const previous = new Uint8Array(mesh.userData.avatarAtlas.pixels);
                importSkinDocument(mesh, data);
                this.recordUndo(previous);
                this.dirty = true;
                this.editRevision++;
                this.status.textContent = this.translate('AVATAR_MAKER_IMPORTED', 'Skin imported.');
            } catch (error) {
                console.error('Unable to import avatar skin:', error);
                this.status.textContent = `${this.translate('AVATAR_MAKER_IMPORT_ERROR', 'Unable to import skin')}: ${error.message}`;
            } finally {
                file.value = '';
            }
        });
        const pngFile = document.createElement('input');
        pngFile.type = 'file';
        pngFile.accept = '.png,image/png';
        pngFile.setAttribute('aria-label', this.translate('AVATAR_MAKER_IMPORT_PNG', 'Load skin PNG'));
        pngFile.addEventListener('change', async () => {
            try {
                if (!pngFile.files?.[0]) return;
                if (this.dirty && !window.confirm(this.translate('AVATAR_MAKER_DISCARD', 'Discard the current painting? Save it first to keep it.'))) return;
                if (!window.confirm(this.translate('AVATAR_MAKER_PNG_WARNING', 'PNG files do not contain body-plan or atlas layout information. Only import a PNG made for this exact avatar layout. Continue?'))) return;
                const mesh = this.mesh;
                const revision = this.editRevision;
                const pixels = await pngBlobToAtlasPixels(pngFile.files[0]);
                if (!this.root || this.mesh !== mesh) return;
                if (revision !== this.editRevision) throw new Error('The model changed while the file was loading; import again.');
                const skin = exportSkinDocument(mesh);
                skin.pixels = Array.from(pixels);
                const previous = new Uint8Array(mesh.userData.avatarAtlas.pixels);
                importSkinDocument(mesh, skin);
                this.recordUndo(previous);
                this.dirty = true;
                this.editRevision++;
                this.status.textContent = this.translate('AVATAR_MAKER_IMPORTED', 'Skin imported.');
            } catch (error) {
                console.error('Unable to import avatar skin PNG:', error);
                if (this.root) this.status.textContent = `${this.translate('AVATAR_MAKER_IMPORT_ERROR', 'Unable to import skin')}: ${error.message}`;
            } finally {
                pngFile.value = '';
            }
        });

        const close = this.button(this.translate('AVATAR_MAKER_CLOSE', 'Close'), () => this.close());
        const pngSave = this.button(this.translate('AVATAR_MAKER_DOWNLOAD_PNG', 'Save skin PNG'), () => this.downloadPng());
        const group = (label, ...controls) => {
            const container = document.createElement('div');
            container.className = 'avatar-maker__group';
            const heading = document.createElement('span');
            heading.className = 'avatar-maker__label';
            heading.textContent = label;
            container.append(heading, ...controls);
            return container;
        };
        const fileButton = this.button(this.translate('AVATAR_MAKER_IMPORT', 'Load skin'), () => file.click());
        const pngButton = this.button(this.translate('AVATAR_MAKER_IMPORT_PNG', 'Load skin PNG'), () => pngFile.click());
        this.rotateButton = this.button(this.translate('AVATAR_MAKER_ROTATE', 'Rotate'), () => this.setMode('rotate'));
        this.paintButton = this.button(this.translate('AVATAR_MAKER_PAINT', 'Paint'), () => this.setMode('paint'));
        this.uvOverlayButton = this.button('UV Region Overlay', () => this.toggleUVOverlay());
        this.uvOverlayVisible = false;
        this.undoButton = this.button(this.translate('AVATAR_MAKER_UNDO', 'Undo'), () => this.undo());
        this.undoButton.disabled = true;

        const symLabel = document.createElement('label');
        symLabel.style.fontSize = '0.78rem';
        symLabel.append(this.sculptSymmetry, document.createTextNode(' Symmetry'));

        toolbar.append(
            group(this.translate('AVATAR_MAKER_BODY_PLAN', 'Body plan'), this.planSelect),
            group(this.translate('AVATAR_MAKER_EXPRESSION', 'Expression preview'), this.expression),
            group(this.translate('AVATAR_MAKER_TOOL', 'Tool'), this.rotateButton, this.paintButton, this.uvOverlayButton, this.undoButton),
            group('Procedural Brush', this.brushMode, this.emblemSelect, this.colour, this.secondaryColour, this.radius),
            group('Low-Poly Sculpt', this.sculptPartSelect, symLabel, this.sculptScale, this.sculptInflate),
            group('Detachable Accessories', this.accessoryList),
            group(this.translate('AVATAR_MAKER_SKIN_FILES', 'Skin files'), ...(characterSave ? [characterSave] : []), save, fileButton, file, pngSave, pngButton, pngFile),
            instructions
        );
        this.status = document.createElement('p');
        this.status.className = 'avatar-maker__status';
        this.status.setAttribute('role', 'status');
        this.status.textContent = this.translate('AVATAR_MAKER_SAVE_NOTICE', 'Save a skin document to keep your work.');
        this.viewport = document.createElement('div');
        this.viewport.className = 'avatar-maker__viewport';
        this.uvCanvas = document.createElement('canvas');
        this.uvCanvas.className = 'avatar-maker__uv-preview';
        this.uvCanvas.width = ATLAS_SIZE;
        this.uvCanvas.height = ATLAS_SIZE;
        this.viewport.appendChild(this.uvCanvas);

        toolbar.append(this.status);
        const header = document.createElement('header');
        header.className = 'avatar-maker__header';
        header.append(title, close);
        const content = document.createElement('div');
        content.className = 'avatar-maker__content';
        content.append(toolbar, this.viewport);
        this.root.append(style, header, content);
        document.body.appendChild(this.root);

        try {
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x172638);
            this.camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            Object.assign(this.renderer.domElement.style, { width: '100%', height: '100%', touchAction: 'none' });
            this.viewport.appendChild(this.renderer.domElement);
            this.scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2));
            const light = new THREE.DirectionalLight(0xffffff, 2);
            light.position.set(2, 4, 5);
            this.scene.add(light);
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.setMode('rotate');
            this.renderer.domElement.addEventListener('pointerdown', event => {
                if (event.button !== 0 || this.mode !== 'paint' || this.painting) return;
                this.painting = true;
                this.strokeBefore = new Uint8Array(this.mesh.userData.avatarAtlas.pixels);
                this.renderer.domElement.setPointerCapture(event.pointerId);
                this.paint(event);
            });
            this.renderer.domElement.addEventListener('pointermove', event => {
                if (this.painting) this.paint(event);
            });
            for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
                this.renderer.domElement.addEventListener(type, () => {
                    this.painting = false;
                    this.strokeBefore = null;
                });
            }
            this.resizeObserver = new ResizeObserver(() => this.resize());
            this.resizeObserver.observe(this.viewport);
            const initialPlan = this.skinDocument
                ? Object.entries(BODY_PLANS).find(([, plan]) => plan.name === this.skinDocument.bodyPlan)?.[0]
                : 'HUMANOID';
            if (!initialPlan) throw new Error('The saved skin uses an unknown body plan.');
            this.planSelect.value = initialPlan;
            this.setPlan(initialPlan);
            if (this.skinDocument) importSkinDocument(this.mesh, this.skinDocument);
            this.resize();
            const render = () => {
                this.controls.update();
                this.renderer.render(this.scene, this.camera);
                this.frame = requestAnimationFrame(render);
            };
            render();
        } catch (error) {
            this.close(true);
            throw error;
        }
    }

    button(text, action) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = text;
        button.addEventListener('click', action);
        return button;
    }

    toggleUVOverlay() {
        this.uvOverlayVisible = !this.uvOverlayVisible;
        this.uvOverlayButton.setAttribute('aria-pressed', String(this.uvOverlayVisible));
        this.uvCanvas.style.display = this.uvOverlayVisible ? 'block' : 'none';
        if (this.uvOverlayVisible && this.mesh?.userData?.avatarAtlas) {
            const ctx = this.uvCanvas.getContext('2d');
            const imgData = ctx.createImageData(ATLAS_SIZE, ATLAS_SIZE);
            imgData.data.set(generateUVOverlayBuffer(this.mesh.userData.avatarAtlas));
            ctx.putImageData(imgData, 0, 0);
        }
    }

    setPlan(name) {
        const plan = BODY_PLANS[name];
        if (!plan) throw new Error(`Unknown body plan "${name}".`);
        const nameValue = this.character?.name;
        const seed = (Array.isArray(nameValue) ? nameValue[0] : nameValue) || 'model-maker';
        const stats = this.character?.facetweb?.Stats;
        if (stats != null && !Array.isArray(stats)) throw new TypeError('Character facetweb.Stats must be an array.');
        const speciesForSize = this.species
            ?? (typeof this.character?.species === 'object' ? this.character.species
                : (typeof this.character?.species === 'string' ? { name: this.character.species } : null));
        const variant = makeHumanoidVariant(seed, {
            facetBoons: stats ? facetBoonsFromStats(stats) : null,
            incarna: this.character?.incarna ?? null,
            character: this.character ?? null,
            species: speciesForSize
        });
        if (this.species) {
            const { id, ...skin } = speciesSkin(this.species);
            Object.assign(variant, skin);
        }
        const mesh = this.engine.generateProceduralAvatar(plan, variant);
        this.disposeMesh();
        this.mesh = mesh;
        this.sculptState = { symmetry: this.sculptSymmetry.checked, parts: {} };
        this.sculptPartSelect.innerHTML = '';
        for (const comp of plan.components) {
            const opt = document.createElement('option');
            opt.value = comp.id;
            opt.textContent = comp.id;
            this.sculptPartSelect.appendChild(opt);
        }
        this.undoStack = [];
        this.undoButton.disabled = true;
        this.planName = name;
        this.scene.add(mesh);
        this.painter = new AvatarSkinPainter(mesh);
        this.updateExpression();
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const aspect = this.viewport.clientWidth / Math.max(this.viewport.clientHeight, 1);
        const halfVertical = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
        const distance = Math.max(size.y / (2 * halfVertical), size.x / (2 * halfVertical * aspect), 0.1) * 1.2 + size.z / 2;
        this.controls.target.copy(center);
        this.camera.position.copy(center).add(new THREE.Vector3(0, 0, distance));
        this.camera.near = Math.max(0.001, distance / 1000);
        this.camera.far = distance * 10;
        this.camera.updateProjectionMatrix();
        this.controls.update();
    }

    paint(event) {
        const bounds = this.renderer.domElement.getBoundingClientRect();
        this.pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1,
            1 - (event.clientY - bounds.top) / bounds.height * 2);
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hit = this.raycaster.intersectObject(this.mesh, true)[0];
        if (!hit) return;

        const mode = this.brushMode?.value || 'solid';
        const colour = parseInt(this.colour.value.slice(1), 16);
        const radius = Number(this.radius.value);
        const didPaint = mode === 'solid'
            ? this.painter.paint(hit, { colour, radius })
            : paintProceduralBrush(this.mesh, hit, {
                mode,
                colour,
                secondaryColour: parseInt(this.secondaryColour.value.slice(1), 16),
                radius,
                emblem: this.emblemSelect.value,
                seed: this.planName
            });

        if (didPaint) {
            if (this.strokeBefore) {
                this.recordUndo(this.strokeBefore);
                this.strokeBefore = null;
            }
            this.dirty = true;
            this.editRevision++;
        }
    }

    setMode(mode) {
        this.mode = mode;
        this.rotateButton.setAttribute('aria-pressed', String(mode === 'rotate'));
        this.paintButton.setAttribute('aria-pressed', String(mode === 'paint'));
        if (this.controls) {
            this.controls.mouseButtons.LEFT = mode === 'rotate' ? THREE.MOUSE.ROTATE : null;
            this.controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
            this.controls.touches.ONE = mode === 'rotate' ? THREE.TOUCH.ROTATE : null;
        }
    }

    recordUndo(pixels) {
        this.undoStack.push(pixels);
        if (this.undoStack.length > 30) this.undoStack.shift();
        this.undoButton.disabled = false;
    }

    updateExpression() {
        if (!this.mesh?.morphTargetDictionary) return;
        const values = {
            mouthSmileLeft: this.expression.value === 'smile' ? 0.65 : this.expression.value === 'frown' ? -0.65 : 0,
            mouthSmileRight: this.expression.value === 'smile' ? 0.65 : this.expression.value === 'frown' ? -0.65 : 0,
            browDownLeft: this.expression.value === 'frown' ? 0.65 : 0,
            browDownRight: this.expression.value === 'frown' ? 0.65 : 0
        };
        for (const [name, value] of Object.entries(values)) {
            const index = this.mesh.morphTargetDictionary[name];
            if (index !== undefined) this.mesh.morphTargetInfluences[index] = value;
        }
    }

    undo() {
        const pixels = this.undoStack.pop();
        if (!pixels) return;
        const atlas = this.mesh.userData.avatarAtlas;
        atlas.pixels.set(pixels);
        const texture = this.mesh.material.map;
        const rowBytes = ATLAS_SIZE * 4;
        for (let y = 0; y < ATLAS_SIZE; y++) {
            texture.image.data.set(pixels.subarray(y * rowBytes, (y + 1) * rowBytes), (ATLAS_SIZE - 1 - y) * rowBytes);
        }
        texture.needsUpdate = true;
        this.undoButton.disabled = this.undoStack.length === 0;
        this.dirty = true;
        this.editRevision++;
        this.status.textContent = this.translate('AVATAR_MAKER_UNDONE', 'Last skin change undone.');
    }

    resize() {
        const { clientWidth: width, clientHeight: height } = this.viewport;
        if (!width || !height) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    download() {
        try {
            const blob = new Blob([JSON.stringify(exportSkinDocument(this.mesh))], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'avatar-skin.json';
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            this.dirty = false;
            this.status.textContent = this.translate('AVATAR_MAKER_DOWNLOADED', 'Skin download started.');
        } catch (error) {
            console.error('Unable to export avatar skin:', error);
            this.status.textContent = `${this.translate('AVATAR_MAKER_EXPORT_ERROR', 'Unable to export skin')}: ${error.message}`;
        }
    }

    async downloadPng() {
        try {
            const blob = await atlasToPngBlob(this.mesh.userData.avatarAtlas.pixels);
            if (!this.root) return;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'avatar-skin.png';
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            this.status.textContent = this.translate('AVATAR_MAKER_PNG_DOWNLOADED', 'PNG download started. Save a skin document to preserve layout information.');
        } catch (error) {
            console.error('Unable to export avatar skin PNG:', error);
            if (this.root) this.status.textContent = `${this.translate('AVATAR_MAKER_EXPORT_ERROR', 'Unable to export skin')}: ${error.message}`;
        }
    }

    async saveCharacter() {
        if (this.saving) return;
        this.saving = true;
        const revision = this.editRevision;
        try {
            await this.onSave(exportSkinDocument(this.mesh));
            if (!this.root) return;
            if (revision === this.editRevision) {
                this.dirty = false;
                this.status.textContent = this.translate('AVATAR_MAKER_CHARACTER_SAVED', 'Skin saved to character.');
            } else {
                this.status.textContent = this.translate('AVATAR_MAKER_CHANGES_REMAIN', 'Earlier painting saved; newer changes are not saved.');
            }
        } catch (error) {
            console.error('Unable to save character skin:', error);
            if (this.root) this.status.textContent = `${this.translate('AVATAR_MAKER_SAVE_ERROR', 'Unable to save character skin')}: ${error.message}`;
        } finally {
            this.saving = false;
        }
    }

    disposeMesh() {
        if (!this.mesh) return;
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.traverse(object => {
            if (object !== this.mesh && object.isMesh) {
                object.geometry?.dispose?.();
                object.material?.dispose?.();
            }
        });
        this.mesh.material.map.dispose();
        this.mesh.material.dispose();
        this.mesh = null;
    }

    close(force = false) {
        if (!this.root) return;
        if (!force && this.saving) {
            this.status.textContent = this.translate('AVATAR_MAKER_SAVE_PENDING', 'Wait for the character skin save to finish.');
            return;
        }
        if (!force && this.dirty && !window.confirm(this.translate('AVATAR_MAKER_DISCARD', 'Discard the current painting? Save it first to keep it.'))) return;
        if (this.frame != null) cancelAnimationFrame(this.frame);
        this.resizeObserver?.disconnect();
        this.controls?.dispose();
        this.disposeMesh();
        this.renderer?.dispose();
        this.root.remove();
        this.root = null;
        this.onClose();
    }
}
