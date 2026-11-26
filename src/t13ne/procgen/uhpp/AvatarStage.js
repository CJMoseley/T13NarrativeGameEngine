import { makeHumanoidVariant, makeFaceVariant } from '../avatar/AvatarEngine.js';
import { sharedAvatarEngine, sharedAvatarCache } from '../avatar/AvatarCache.js';
import { facetBoonsFromStats, descendantAvatarData, resolveFormation } from '../avatar/AvatarFacetBody.js';
import { BODY_PLANS, resolveBodyPlan } from '../avatar/BodyPlanSchema.js';
import { speciesSkin } from '../avatar/SpeciesSkins.js';
import { importSkinDocument } from '../avatar/AvatarSkinDocument.js';
import { CharacterSkinStore } from '../avatar/CharacterSkinStore.js';

/**
 * @module UHPP/AvatarStage
 * @description UHPP Stage for generating procedural avatars for Characters and Descendants.
 */
export class AvatarStage {
    constructor(bodyPlanName = 'HUMANOID', { cache = sharedAvatarCache } = {}) {
        // Delegate to sharedAvatarEngine via prototype so no per-stage AvatarEngine/ModelLoader is allocated,
        // while still isolating instance-level `stage.engine.generate = ...` overrides in tests.
        this.engine = Object.create(sharedAvatarEngine);
        this.cache = cache;
        this.bodyPlanName = bodyPlanName;
    }

    /**
     * @param {object} context
     * @param {object} [context.character] - Character with optional facetweb.Stats, incarna, species, phenotype.
     * @param {object} [context.descendant] - Descendant with optional incarna, masterAnnex, facetweb.Stats, bodyPlan.
     * @param {string} [context.avatarSeed] - Stable seed for character/descendant appearance.
     * @param {object} [context.avatarOptions] - Options passed to AvatarEngine.generate.
     * @param {object} [context.species] - Species lore with an id or name, optional avatarSkins, and optional sizeMatrix.
     * @param {object} [context.phenotype] - Optional phenotype map for species size adjustments.
     * @param {string} [context.skinId] - Authored skin id, defaulting to the first skin.
     * @param {object} [context.skinDocument] - Saved skin document for the generated atlas layout.
     * @param {CharacterSkinStore} [context.skinStore] - Override the default browser character skin store.
     */
    async execute(context) {
        const entity = context.character ?? context.descendant ?? null;
        const entityId = entity?.id;
        let skinStore = context.skinStore;
        if (context.skinDocument == null && !skinStore && entityId != null && typeof indexedDB !== 'undefined') {
            const { default: CodexDB } = await import('/src/t13ne/modules/codex/CodexDB.js');
            skinStore = new CharacterSkinStore(CodexDB);
        }
        const saved = context.skinDocument == null && skinStore && entityId != null
            ? await skinStore.load(entityId) : null;
        const skinDocument = context.skinDocument ?? saved?.document;
        const savedPlan = skinDocument && Object.values(BODY_PLANS).find(plan => plan.name === skinDocument.bodyPlan);
        if (skinDocument && !context.bodyPlan && !savedPlan) throw new Error('The saved skin uses an unknown body plan.');

        const inferredDescendantPlan = !context.character && context.descendant?.bodyPlan
            ? resolveBodyPlan(context.descendant.bodyPlan)
            : null;
        const plan = context.bodyPlan || savedPlan || inferredDescendantPlan || BODY_PLANS[this.bodyPlanName];
        console.log(`AvatarStage: Generating avatar for plan ${plan.name}`);

        const options = { ...context.avatarOptions };
        if (context.descendant != null && context.character == null) {
            if (typeof context.descendant !== 'object' || Array.isArray(context.descendant)) {
                throw new TypeError('AvatarStage: descendant must be an object.');
            }
            const descStats = context.descendant.facetweb?.Stats;
            if (descStats != null && !Array.isArray(descStats)) {
                throw new TypeError('AvatarStage: descendant.facetweb.Stats must be an array.');
            }
            const descInfo = descendantAvatarData(context.descendant);
            const seed = context.avatarSeed ?? descInfo.seed;
            if (!options.variant) {
                options.seed = seed;
                options.variant = plan.name === 'Humanoid'
                    ? makeHumanoidVariant(seed, {
                        facetBoons: descInfo.facetBoons,
                        incarna: descInfo.incarna,
                        character: context.descendant,
                        species: context.species ?? null,
                        phenotype: context.phenotype ?? null
                    })
                    : {
                        face: makeFaceVariant(seed),
                        incarna: descInfo.incarna,
                        formation: descInfo.formation,
                        material: descInfo.material,
                        ...(descInfo.facetBoons ? { facetBoons: descInfo.facetBoons } : {})
                    };
                if (context.species) {
                    const { id, ...skin } = speciesSkin(context.species, context.skinId);
                    Object.assign(options.variant, skin);
                }
            }
        } else {
            const stats = context.character?.facetweb?.Stats;
            if (stats != null && !Array.isArray(stats)) {
                throw new TypeError('AvatarStage: character.facetweb.Stats must be an array.');
            }
            if (!options.variant && (stats || context.character || context.avatarSeed != null || context.species)) {
                const name = context.character?.name;
                const seed = context.avatarSeed ?? (Array.isArray(name) ? name[0] : name) ?? 'avatar';
                const speciesForSize = context.species
                    ?? (typeof context.character?.species === 'object' ? context.character.species
                        : (typeof context.character?.species === 'string' ? { name: context.character.species } : null));
                options.seed = seed;
                options.variant = makeHumanoidVariant(seed, {
                    facetBoons: stats ? facetBoonsFromStats(stats) : null,
                    incarna: context.character?.incarna ?? null,
                    character: context.character ?? null,
                    species: speciesForSize,
                    phenotype: context.phenotype ?? null
                });
                const skinSource = context.species ?? (typeof context.character?.species === 'object' ? context.character.species : null);
                if (skinSource) {
                    const { id, ...skin } = speciesSkin(skinSource, context.skinId);
                    Object.assign(options.variant, skin);
                }
            }
        }

        const hasCustomGenerator = Object.hasOwn(this.engine, 'generate') || !this.cache;
        const avatar = hasCustomGenerator
            ? await this.engine.generate(plan, options)
            : await this.cache.generate(plan, options);

        if (skinDocument != null) {
            try {
                importSkinDocument(avatar, skinDocument);
            } catch (error) {
                avatar.traverse(object => {
                    object.geometry?.dispose();
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    for (const material of materials) {
                        material?.map?.dispose();
                        material?.dispose();
                    }
                });
                throw error;
            }
        }
        const resolvedForm = resolveFormation(entity, context.species);
        context.avatarMeasurements = {
            heightCm: options.variant?.heightCm ?? null,
            formation: options.variant?.formation ?? resolvedForm.formation,
            material: options.variant?.material ?? resolvedForm.material
        };
        context.avatar = avatar;

        // Add to scene if needed or just keep in context
        if (context.scene) {
            context.scene.add(avatar);
        }

        return context;
    }
}
