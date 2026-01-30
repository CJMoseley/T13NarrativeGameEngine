import { AvatarEngine } from '../avatar/AvatarEngine.js';
import { BODY_PLANS } from '../avatar/BodyPlanSchema.js';

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
     */
    async execute(context) {
        const plan = context.bodyPlan || BODY_PLANS[this.bodyPlanName];
        console.log(`AvatarStage: Generating avatar for plan ${plan.name}`);

        const avatar = this.engine.generate(plan);
        context.avatar = avatar;

        // Add to scene if needed or just keep in context
        if (context.scene) {
            context.scene.add(avatar);
        }

        return context;
    }
}
