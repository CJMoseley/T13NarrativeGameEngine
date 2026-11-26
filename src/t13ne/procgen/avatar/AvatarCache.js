import * as THREE from 'three';
import { AvatarEngine, makeHumanoidVariant, makeFaceVariant } from './AvatarEngine.js';
import { createAtlasTexture } from './AvatarAtlas.js';
import { BODY_PLANS, resolveBodyPlan } from './BodyPlanSchema.js';
import { hashSeed } from './avatarRandom.js';
import { facetBoonsFromStats, descendantAvatarData } from './AvatarFacetBody.js';
import { speciesSkin } from './SpeciesSkins.js';

/**
 * Shared singleton engine so callers do not allocate a new AvatarEngine + ModelLoader per character.
 */
export const sharedAvatarEngine = new AvatarEngine();

function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    const keys = Object.keys(value).filter(k => value[k] !== undefined && k !== 'atlasPixels').sort();
    return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

/**
 * Computes a deterministic cache key from a body plan, seed, and variant (including facetBoons).
 * Returns null if raw custom atlasPixels are injected directly (those should not be shared in the template cache).
 * @param {object} bodyPlan
 * @param {object} [options]
 * @returns {string|null}
 */
export function avatarCacheKey(bodyPlan, options = {}) {
    if (options?.uncached || options?.variant?.atlasPixels != null) return null;
    const planName = bodyPlan?.name ?? 'Humanoid';
    const style = options?.style ?? 'procedural';
    if (style === 'fbx') return null;
    const variantJson = stableStringify(options?.variant ?? {});
    const seedPart = options?.seed != null ? String(options.seed) : '';
    const h1 = hashSeed(`${planName}|${style}|${seedPart}|${variantJson}`);
    const h2 = hashSeed(`rev:${variantJson}|${planName}`);
    return `${planName}:${style}:${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

/**
 * Clones a cached procedural SkinnedMesh with its own Skeleton, geometry, texture, and atlas pixel buffer
 * so scene attachment, posing, direct painting, skin import, or disposal on one avatar never mutates another.
 * @param {THREE.SkinnedMesh} template
 * @returns {THREE.SkinnedMesh}
 */
export function cloneAvatarMesh(template) {
    const templateRoot = template.children.find(c => c.isBone);
    const clonedRoot = templateRoot.clone(true);
    const boneByName = new Map();
    clonedRoot.traverse(node => {
        if (node.isBone) boneByName.set(node.name, node);
    });
    const bones = template.skeleton.bones.map(b => boneByName.get(b.name));
    const boneInverses = template.skeleton.boneInverses.map(m => m.clone());
    const skeleton = new THREE.Skeleton(bones, boneInverses);

    const geometry = template.geometry.clone();
    const srcAtlas = template.userData.avatarAtlas;
    const pixels = new Uint8Array(srcAtlas.pixels);
    const material = new THREE.MeshLambertMaterial({ color: 0xffffff, map: createAtlasTexture(pixels) });

    const mesh = new THREE.SkinnedMesh(geometry, material);
    mesh.add(clonedRoot);
    mesh.updateMatrixWorld(true);
    mesh.bind(skeleton, template.bindMatrix.clone());

    mesh.morphTargetDictionary = { ...template.morphTargetDictionary };
    mesh.morphTargetInfluences = new Array(template.morphTargetInfluences.length).fill(0);

    for (const child of template.children) {
        if (child.name !== 'avatar-face-feature' || !child.isSkinnedMesh) continue;
        const featureGeo = child.geometry.clone();
        const feature = new THREE.SkinnedMesh(featureGeo, material);
        feature.name = 'avatar-face-feature';
        mesh.add(feature);
        feature.bind(skeleton, mesh.bindMatrix);
        feature.morphTargetDictionary = mesh.morphTargetDictionary;
        feature.morphTargetInfluences = mesh.morphTargetInfluences;
    }

    mesh.userData.avatarAtlas = {
        version: srcAtlas.version,
        bodyPlan: srcAtlas.bodyPlan,
        material: srcAtlas.material ?? 'flesh',
        regions: structuredClone(srcAtlas.regions),
        legacyRegions: structuredClone(srcAtlas.legacyRegions),
        legacyRegionKeys: { ...srcAtlas.legacyRegionKeys },
        pixels
    };

    return mesh;
}

function disposeTemplate(mesh) {
    if (!mesh) return;
    mesh.geometry?.dispose();
    mesh.traverse(obj => {
        if (obj !== mesh && obj.isMesh) obj.geometry?.dispose();
    });
    mesh.material?.map?.dispose();
    mesh.material?.dispose();
}

/**
 * Normalizes a race/ship roster (ships with multiple crew, standalone crew, and ~100 racers)
 * into flat avatar prewarm entries.
 * @param {object|Array} input
 * @returns {Array<object>}
 */
export function flattenRaceAvatarRoster(input = {}) {
    if (Array.isArray(input)) return input;
    const entries = [];
    if (Array.isArray(input.crew)) entries.push(...input.crew);
    if (Array.isArray(input.ships)) {
        for (const ship of input.ships) {
            if (Array.isArray(ship?.crew)) entries.push(...ship.crew);
            else if (ship?.pilot) entries.push(ship.pilot);
        }
    }
    if (Array.isArray(input.racers)) entries.push(...input.racers);
    if (Array.isArray(input.characters)) entries.push(...input.characters);
    return entries;
}

/**
 * Resolves a roster entry (string seed, Character, Descendant, or options descriptor) into { bodyPlan, options }.
 * @param {string|object} entry
 * @returns {{bodyPlan: object, options: object}}
 */
export function resolveRosterAvatarSpec(entry) {
    if (typeof entry === 'string') {
        return {
            bodyPlan: BODY_PLANS.HUMANOID,
            options: { seed: entry, variant: makeHumanoidVariant(entry) }
        };
    }
    if (!entry || typeof entry !== 'object') {
        throw new TypeError('Avatar roster entry must be a seed string or an object.');
    }

    const character = entry.character ?? ((entry.facetweb || entry.charType) ? entry : null);
    const descendant = entry.descendant ?? (entry.descendantType ? entry : null);
    const species = entry.species ?? (typeof character?.species === 'object' ? character.species : null);
    const bodyPlan = entry.bodyPlan
        ?? (species ? resolveBodyPlan(species) : null)
        ?? (descendant?.bodyPlan ? resolveBodyPlan(descendant.bodyPlan) : null)
        ?? BODY_PLANS.HUMANOID;

    if (entry.variant) {
        return { bodyPlan, options: { style: entry.style ?? 'procedural', seed: entry.seed, variant: entry.variant } };
    }

    let variant;
    let seed = entry.seed ?? entry.avatarSeed;
    if (descendant) {
        const desc = descendantAvatarData(descendant);
        seed = seed ?? desc.seed;
        variant = bodyPlan.name === 'Humanoid'
            ? makeHumanoidVariant(seed, { facetBoons: desc.facetBoons, incarna: desc.incarna, character: descendant, species })
            : { face: makeFaceVariant(seed), incarna: desc.incarna, material: desc.material, ...(desc.facetBoons ? { facetBoons: desc.facetBoons } : {}) };
    } else {
        const rawName = character?.name ?? entry.name;
        seed = seed ?? (Array.isArray(rawName) ? rawName[0] : rawName) ?? 'avatar';
        const stats = character?.facetweb?.Stats;
        const facetBoons = Array.isArray(stats) ? facetBoonsFromStats(stats) : (entry.facetBoons ?? null);
        const speciesForSize = species ?? (typeof character?.species === 'string' ? { name: character.species } : null);
        variant = bodyPlan.name === 'Humanoid'
            ? makeHumanoidVariant(seed, { facetBoons, incarna: character?.incarna, character, species: speciesForSize })
            : { face: makeFaceVariant(seed), ...(facetBoons ? { facetBoons } : {}), ...(character?.incarna ? { incarna: character.incarna } : {}) };
    }

    if (species && (species.avatarSkins || species.color != null || species.id || species.scientificName || species.commonName || species.name)) {
        const { id, ...skin } = speciesSkin(species, entry.skinId);
        Object.assign(variant, skin);
    }

    return { bodyPlan, options: { style: entry.style ?? 'procedural', seed, variant } };
}

/**
 * Bounded LRU cache of procedural avatar templates keyed by body plan + seed + facet-boon/variant hash.
 */
export class AvatarCache {
    constructor({ engine = sharedAvatarEngine, maxEntries = 160 } = {}) {
        this.engine = engine;
        this.maxEntries = maxEntries;
        this.entries = new Map();
        this.hits = 0;
        this.misses = 0;
    }

    get size() {
        return this.entries.size;
    }

    stats() {
        return { size: this.entries.size, maxEntries: this.maxEntries, hits: this.hits, misses: this.misses };
    }

    has(key) {
        return this.entries.has(key);
    }

    async generate(bodyPlan, options = {}) {
        const key = avatarCacheKey(bodyPlan, options);
        if (!key) {
            return this.engine.generate(bodyPlan, options);
        }
        const cached = this.entries.get(key);
        if (cached) {
            this.hits++;
            // Refresh LRU position
            this.entries.delete(key);
            this.entries.set(key, cached);
            return cloneAvatarMesh(cached);
        }
        this.misses++;
        const template = await this.engine.generate(bodyPlan, options);
        if (!template?.isSkinnedMesh || !template.userData?.avatarAtlas) {
            return template;
        }
        this._store(key, template);
        return cloneAvatarMesh(template);
    }

    /**
     * Prewarms the cache for a roster of crew/racers/characters (e.g. during a loading screen).
     * Does not clone meshes for scene insertion until requested, minimizing memory and CPU overhead.
     * @param {Array|object} roster
     * @returns {Promise<{total: number, warmed: number, cacheHits: number, durationMs: number}>}
     */
    async prewarmRoster(roster) {
        const list = flattenRaceAvatarRoster(roster);
        const start = performance.now();
        let warmed = 0;
        let cacheHits = 0;
        for (const item of list) {
            const { bodyPlan, options } = resolveRosterAvatarSpec(item);
            const key = avatarCacheKey(bodyPlan, options);
            if (!key) continue;
            if (this.entries.has(key)) {
                cacheHits++;
                const existing = this.entries.get(key);
                this.entries.delete(key);
                this.entries.set(key, existing);
                continue;
            }
            const template = await this.engine.generate(bodyPlan, options);
            if (template?.isSkinnedMesh && template.userData?.avatarAtlas) {
                this._store(key, template);
                warmed++;
            }
        }
        return {
            total: list.length,
            warmed,
            cacheHits,
            durationMs: performance.now() - start
        };
    }

    _store(key, template) {
        if (this.entries.has(key)) {
            disposeTemplate(this.entries.get(key));
            this.entries.delete(key);
        }
        while (this.entries.size >= this.maxEntries) {
            const oldestKey = this.entries.keys().next().value;
            disposeTemplate(this.entries.get(oldestKey));
            this.entries.delete(oldestKey);
        }
        this.entries.set(key, template);
    }

    clear() {
        for (const template of this.entries.values()) {
            disposeTemplate(template);
        }
        this.entries.clear();
        this.hits = 0;
        this.misses = 0;
    }
}

export const sharedAvatarCache = new AvatarCache();
