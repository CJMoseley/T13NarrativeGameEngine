import { Scene } from './Scene.js';

/**
 * T13Scene
 * Deprecated: Functionality has been merged into the base Scene class.
 * Kept for backward compatibility.
 */
export class T13Scene extends Scene {
    constructor(viewManager, sceneData = {}) {
        super(viewManager, sceneData);
    }
}
