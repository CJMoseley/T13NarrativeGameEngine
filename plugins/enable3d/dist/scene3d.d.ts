/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|LGPL-3.0}
 */
import { ThreeGraphics } from '@enable3d/three-graphics';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { Clock, WebGLRenderer } from 'three';
import { ExtendedMesh } from '@enable3d/common/dist/types.js';
import { AmmoPhysics, ExtendedGroup } from '@enable3d/ammo-physics';
import { CSG } from '@enable3d/three-graphics/dist/csg/index.js';
import * as Plugins from '@enable3d/three-graphics/dist/plugins/index.js';
export declare class Scene3D implements Partial<ThreeGraphics> {
    private sceneConfig;
    scenes: Map<string, Scene3D>;
    scene: ThreeGraphics['scene'];
    camera: ThreeGraphics['camera'];
    cache: ThreeGraphics['cache'];
    physics: AmmoPhysics;
    renderer: WebGLRenderer;
    composer: EffectComposer;
    parent: HTMLElement;
    canvas: HTMLCanvasElement;
    clock: Clock;
    load: Plugins.Loaders;
    lights: Plugins.Lights;
    transform: Plugins.Transform;
    heightMap: Plugins.HeightMap;
    webXR: Plugins.WebXR;
    misc: Plugins.Misc;
    cameras: Plugins.Cameras;
    csg: typeof CSG;
    private factories;
    private ws;
    private mixers;
    __config: any;
    private _isRunning;
    private _deconstructor;
    constructor(sceneConfig?: {
        key?: string;
        enableXR?: boolean;
    });
    /** Pass all objects you want to destroy on scene restart or stop. */
    get deconstructor(): {
        /**
         * Pass an your objects.
         * @example
         * // this is what the deconstructor does on
         * // scene restart or stop to all objects added:
         * await object.dispose?.()
         * await object.destroy?.()
         * if (typeof object === 'function') await object?.()
         * object = null
         */
        add: (...object: any[]) => void;
    };
    initializeScene(plugins: any): void;
    get sceneKey(): any;
    /** Destroys a object and its body. */
    destroy(obj: ExtendedMesh | ExtendedGroup): void;
    warpSpeed(...features: Plugins.WarpedStartFeatures[]): Promise<Plugins.WarpSpeedOptions>;
    get animationMixers(): import("@enable3d/three-graphics/dist/plugins/mixers.js").GetMixers;
    get make(): {
        extrude: import("@enable3d/common/dist/types.js").ExtrudeObject;
        plane: import("@enable3d/common/dist/types.js").PlaneObject;
        box: import("@enable3d/common/dist/types.js").BoxObject;
        sphere: import("@enable3d/common/dist/types.js").SphereObject;
        capsule: import("@enable3d/common/dist/types.js").CapsuleObject;
        cylinder: import("@enable3d/common/dist/types.js").CylinderObject;
        cone: import("@enable3d/common/dist/types.js").ConeObject;
        torus: (torusConfig?: import("@enable3d/common/dist/types.js").TorusConfig, materialConfig?: import("@enable3d/common/dist/types.js").MaterialConfig) => ExtendedMesh;
    };
    get add(): {
        mesh: any;
        material: import("@enable3d/common/dist/types.js").AddMaterial;
        extrude: import("@enable3d/common/dist/types.js").ExtrudeObject;
        existing: any;
        plane: import("@enable3d/common/dist/types.js").PlaneObject;
        ground: import("@enable3d/common/dist/types.js").GroundObject;
        box: import("@enable3d/common/dist/types.js").BoxObject;
        sphere: import("@enable3d/common/dist/types.js").SphereObject;
        capsule: import("@enable3d/common/dist/types.js").CapsuleObject;
        cylinder: import("@enable3d/common/dist/types.js").CylinderObject;
        cone: import("@enable3d/common/dist/types.js").ConeObject;
        torus: (torusConfig?: import("@enable3d/common/dist/types.js").TorusConfig, materialConfig?: import("@enable3d/common/dist/types.js").MaterialConfig) => ExtendedMesh;
    };
    haveSomeFun(numberOfElements?: number): void;
    isRunning(): boolean;
    start(key?: string, data?: any): Promise<void>;
    private _start;
    restart(data?: any): Promise<void>;
    stop(): Promise<void>;
    setSize(width: number, height: number): void;
    setPixelRatio(ratio: number): void;
    init(data?: any): void;
    preload(): void;
    create(): void;
    update(_time: number, _delta: number): void;
    /** Will be called before THREE.WebGLRenderer.render() */
    preRender(): void;
    /** Will be called after THREE.WebGLRenderer.render() */
    postRender(): void;
    private _preload;
    private _create;
    private _update;
}
//# sourceMappingURL=scene3d.d.ts.map