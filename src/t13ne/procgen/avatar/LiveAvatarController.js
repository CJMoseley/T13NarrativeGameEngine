import { AnimationBlender } from '../avatar/AnimationBlender.js';
import { VTuberBridge } from '../avatar/VTuberBridge.js';
import { MorphManager } from '../avatar/MorphManager.js';

/**
 * @module Avatar/LiveAvatarController
 * @description Orchestrates the live update loop for a procedural avatar.
 */
export class LiveAvatarController {
    constructor(avatarMesh, bodyPlanType = 'humanoid') {
        this.mesh = avatarMesh;
        this.blender = new AnimationBlender(avatarMesh, bodyPlanType);
        this.vtuber = new VTuberBridge();
        this.morph = new MorphManager(avatarMesh);

        this.isLive = false;
    }

    async init() {
        this.vtuber.onUpdate = (data) => {
            this.isLive = true;
            this.blender.setLiveData(data);
            this.morph.update(data.blendShapes);
        };
    }

    async startLive() {
        await this.vtuber.start();
    }

    update(delta, velocity) {
        this.blender.state.velocity.copy(velocity);
        this.blender.update(delta);
    }
}
