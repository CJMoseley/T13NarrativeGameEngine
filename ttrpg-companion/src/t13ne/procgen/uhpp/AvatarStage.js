import { AvatarEngine, makeHumanoidVariant } from '../avatar/AvatarEngine.js';
import { facetBoonsFromStats } from '../avatar/AvatarFacetBody.js';
import { BODY_PLANS } from '../avatar/BodyPlanSchema.js';
import { speciesSkin } from '../avatar/SpeciesSkins.js';
import { importSkinDocument } from '../avatar/AvatarSkinDocument.js';
import { CharacterSkinStore } from '../avatar/CharacterSkinStore.js';

/**
 * @module UHPP/AvatarStage
 * @description UHPP Stage for generating procedural avatars.
 */
export class AvatarStage {
    constructor(bodyPlanName = 'HUMANOID') {
        this.engine = new AvatarEngine();
        this.bodyPlanName = bodyPlanName;
    }

    /**
     * @param {object} context
     * @param {object} [context.character] - Character with facetweb.Stats.
     * @param {string} [context.avatarSeed] - Stable seed for character appearance.
     * @param {object} [context.avatarOptions] - Options passed to AvatarEngine.generate.
     * @param {object} [context.species] - Species lore with an id or name and optional avatarSkins.
     * @param {string} [context.skinId] - Authored skin id, defaulting to the first skin.
     * @param {object} [context.skinDocument] - Saved skin document for the generated atlas layout.
     * @param {CharacterSkinStore} [context.skinStore] - Override the default browser character skin store.
     */
    async execute(context) {
        let skinStore = context.skinStore;
        if (context.skinDocument == null && !skinStore && context.character?.id != null && typeof indexedDB !== 'undefined') {
            const { default: CodexDB } = await import('/src/t13ne/modules/codex/CodexDB.js');
            skinStore = new CharacterSkinStore(CodexDB);
        }
        const saved = context.skinDocument == null && skinStore && context.character?.id != null
            ? await skinStore.load(context.character.id) : null;
        const skinDocument = context.skinDocument ?? saved?.document;
        const savedPlan = skinDocument && Object.values(BODY_PLANS).find(plan => plan.name === skinDocument.bodyPlan);
        if (skinDocument && !context.bodyPlan && !savedPlan) throw new Error('The saved skin uses an unknown body plan.');
        const plan = context.bodyPlan || savedPlan || BODY_PLANS[this.bodyPlanName];
        console.log(`AvatarStage: Generating avatar for plan ${plan.name}`);

        const options = { ...context.avatarOptions };
        const stats = context.character?.facetweb?.Stats;
        if (stats != null && !Array.isArray(stats)) {
            throw new TypeError('AvatarStage: character.facetweb.Stats must be an array.');
        }
        if (!options.variant && (stats || context.character || context.avatarSeed != null || context.species)) {
            const name = context.character?.name;
            const seed = context.avatarSeed ?? (Array.isArray(name) ? name[0] : name) ?? 'avatar';
            options.variant = makeHumanoidVariant(seed, { facetBoons: stats ? facetBoonsFromStats(stats) : null });
            if (context.species) {
                const { id, ...skin } = speciesSkin(context.species, context.skinId);
                Object.assign(options.variant, skin);
            }
        }

        const avatar = await this.engine.generate(plan, options);
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
        context.avatar = avatar;

        // Add to scene if needed or just keep in context
        if (context.scene) {
            context.scene.add(avatar);
        }

        return context;
    }
}
