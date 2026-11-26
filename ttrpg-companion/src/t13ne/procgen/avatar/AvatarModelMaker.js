import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AvatarEngine, makeHumanoidVariant } from './AvatarEngine.js';
import { facetBoonsFromStats } from './AvatarFacetBody.js';
import { BODY_PLANS } from './BodyPlanSchema.js';
import { AvatarSkinPainter } from './AvatarSkinPainter.js';
import { exportSkinDocument, importSkinDocument } from './AvatarSkinDocument.js';
import { speciesSkin } from './SpeciesSkins.js';

/**
 * Model maker with optional character storage and portable skin documents.
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
    }

    open() {
        if (this.root) throw new Error('Model maker is already open.');
        this.root = document.createElement('section');
        this.root.setAttribute('role', 'dialog');
        this.root.setAttribute('aria-label', this.translate('AVATAR_MAKER_TITLE', 'Avatar model maker'));
        Object.assign(this.root.style, {
            position: 'fixed', inset: '0', zIndex: '10000', background: '#101827',
            color: '#edf2ff', display: 'flex', flexDirection: 'column', padding: '1rem',
            gap: '0.5rem', pointerEvents: 'auto', fontFamily: 'sans-serif'
        });
        const title = document.createElement('h2');
        title.textContent = this.translate('AVATAR_MAKER_TITLE', 'Avatar model maker');
        const instructions = document.createElement('p');
        instructions.textContent = this.translate('AVATAR_MAKER_INSTRUCTIONS', 'Paint with the left mouse button. Rotate with the right mouse button and zoom with the wheel. Some features share paint regions.');
        const toolbar = document.createElement('div');
        Object.assign(toolbar.style, { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' });
        this.planSelect = document.createElement('select');
        this.planSelect.setAttribute('aria-label', this.translate('AVATAR_MAKER_BODY_PLAN', 'Body plan'));
        for (const [key, plan] of Object.entries(BODY_PLANS)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = plan.name;
            this.planSelect.appendChild(option);
        }
        this.planSelect.addEventListener('change', () => {
            if (this.dirty && !window.confirm(this.translate('AVATAR_MAKER_DISCARD', 'Discard the current painting? Download it first to keep it.'))) {
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
        this.colour.setAttribute('aria-label', this.translate('AVATAR_MAKER_BRUSH_COLOUR', 'Brush colour'));
        this.radius = document.createElement('input');
        this.radius.type = 'range';
        this.radius.min = '0';
        this.radius.max = '8';
        this.radius.value = '1';
        this.radius.setAttribute('aria-label', this.translate('AVATAR_MAKER_BRUSH_RADIUS', 'Brush radius in texture pixels'));
        const save = this.button(this.translate('AVATAR_MAKER_DOWNLOAD', 'Download skin'), () => this.download());
        if (this.onSave) toolbar.append(this.button(this.translate('AVATAR_MAKER_SAVE_CHARACTER', 'Save to character'), () => this.saveCharacter()));
        const file = document.createElement('input');
        file.type = 'file';
        file.accept = '.json,application/json';
        file.setAttribute('aria-label', this.translate('AVATAR_MAKER_IMPORT', 'Import skin document'));
        file.addEventListener('change', async () => {
            try {
                if (!file.files?.[0]) return;
                if (this.dirty && !window.confirm(this.translate('AVATAR_MAKER_DISCARD', 'Discard the current painting? Download it first to keep it.'))) return;
                const mesh = this.mesh;
                const revision = this.editRevision;
                const data = JSON.parse(await file.files[0].text());
                if (!this.root || this.mesh !== mesh) return;
                if (revision !== this.editRevision) throw new Error('The model changed while the file was loading; import again.');
                importSkinDocument(mesh, data);
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
        const close = this.button(this.translate('AVATAR_MAKER_CLOSE', 'Close'), () => this.close());
        toolbar.append(this.planSelect, this.colour, this.radius, save, file, close);
        this.status = document.createElement('p');
        this.status.setAttribute('role', 'status');
        this.status.textContent = this.translate('AVATAR_MAKER_SAVE_NOTICE', 'Download a skin document to keep your work.');
        this.viewport = document.createElement('div');
        Object.assign(this.viewport.style, { flex: '1', minHeight: '0', position: 'relative' });
        this.root.append(title, instructions, toolbar, this.status, this.viewport);
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
            this.controls.mouseButtons.LEFT = null;
            this.controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
            this.renderer.domElement.addEventListener('pointerdown', event => {
                if (event.button !== 0) return;
                this.painting = true;
                this.renderer.domElement.setPointerCapture(event.pointerId);
                this.paint(event);
            });
            this.renderer.domElement.addEventListener('pointermove', event => {
                if (this.painting) this.paint(event);
            });
            for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
                this.renderer.domElement.addEventListener(type, () => { this.painting = false; });
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

    setPlan(name) {
        const plan = BODY_PLANS[name];
        if (!plan) throw new Error(`Unknown body plan "${name}".`);
        const nameValue = this.character?.name;
        const seed = (Array.isArray(nameValue) ? nameValue[0] : nameValue) || 'avatar';
        const stats = this.character?.facetweb?.Stats;
        if (stats != null && !Array.isArray(stats)) throw new TypeError('Character facetweb.Stats must be an array.');
        const variant = makeHumanoidVariant(seed, { facetBoons: stats ? facetBoonsFromStats(stats) : null });
        if (this.species) {
            const { id, ...skin } = speciesSkin(this.species);
            Object.assign(variant, skin);
        }
        const mesh = this.engine.generateProceduralAvatar(plan, variant);
        this.disposeMesh();
        this.mesh = mesh;
        this.planName = name;
        this.scene.add(mesh);
        this.painter = new AvatarSkinPainter(mesh);
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const distance = Math.max(size.x, size.y, size.z, 0.1) * 2.4;
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
        const hit = this.raycaster.intersectObject(this.mesh)[0];
        if (hit && this.painter.paint(hit, { colour: parseInt(this.colour.value.slice(1), 16), radius: Number(this.radius.value) })) {
            this.dirty = true;
            this.editRevision++;
        }
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
        if (!force && this.dirty && !window.confirm(this.translate('AVATAR_MAKER_DISCARD', 'Discard the current painting? Download it first to keep it.'))) return;
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
