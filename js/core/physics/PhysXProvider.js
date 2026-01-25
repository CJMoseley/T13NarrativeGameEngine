import Logger from '../Logger.js';
import * as THREE from 'three';

/**
 * A simplified provider for the PhysX physics engine.
 * It dynamically loads the PhysX module.
 */
export class PhysXProvider {
    constructor() {
        const funcName = 'PhysXProvider.constructor';
        Logger.start(funcName);
        this.physx = null;
        this.version = null;
        this.foundation = null;
        this.physics = null;
        this.scene = null;
        this.cpuDispatcher = null;
        this.initialized = false;
        this.cookingAvailable = false;
        this.bodies = new Map();
        this.softBodies = new Map();
        this.gravityMode = 'none';
        this.gravityCenter = { x: 0, y: 0, z: 0 };
        this.gravityStrength = 9.81;
        Logger.end(funcName);
    }

    /**
     * Initializes the PhysX simulation world by calling the library's factory function
     * and then creating the necessary core components.
     */
    async init() {
        const funcName = 'PhysXProvider.init';
        Logger.start(funcName);

        if (this.initialized) {
            Logger.message("PhysXProvider already initialized.");
            return;
        }

        try {
            // Dynamically import the PhysX module.
            // This relies on the bundler (e.g. Vite) to resolve the path and handle the .wasm asset referenced within.
            const mod = await import('@plugins/physx/physx-js-webidl.mjs');
            
            const factory = mod.default || mod;
            if (typeof factory !== 'function') {
                throw new Error('PhysX factory not found in module export.');
            }

            // Initialize PhysX. The module uses import.meta.url to find the wasm file in the same directory.
            const physx = await factory();
            Logger.message('PhysX factory resolved.');

            // Normalize common API names so the rest of the code can rely on Px* naming... also not sure that this is isn't breaking everything
            const map = (targetName, candidates) => {
                if (physx[targetName]) return true;
                for (const c of candidates) {
                    if (physx[c]) { 
                        physx[targetName] = physx[c]; 
                        return true; 
                    }
                }
                return false;
            };

            if (!map('PxCreateFoundation', ['CreateFoundation', 'CreateFoundationModule', 'PxCreateFoundation'])) Logger.warn("PhysXProvider: PxCreateFoundation could not be mapped.");
            if (!map('PxCreatePhysics', ['CreatePhysics', 'CreatePhysicsModule', 'PxCreatePhysics'])) Logger.warn("PhysXProvider: PxCreatePhysics could not be mapped.");
            if (!map('CreateConvexMesh', ['CreateConvexMesh', 'PxCreateConvexMesh'])) Logger.warn("PhysXProvider: CreateConvexMesh could not be mapped. Convex hull generation will fail.");
            if (!map('PxCookingParams', ['PxCookingParams', 'CookingParams'])) Logger.warn("PhysXProvider: PxCookingParams could not be mapped.");
            if (!map('PX_PHYSICS_VERSION', ['PHYSICS_VERSION', 'PX_PHYSICS_VERSION'])) Logger.warn("PhysXProvider: PX_PHYSICS_VERSION could not be mapped.");
            if (!map('PxDefaultAllocator', ['PxDefaultAllocator', 'DefaultAllocator'])) Logger.warn("PhysXProvider: PxDefaultAllocator could not be mapped.");
            if (!map('PxDefaultErrorCallback', ['PxDefaultErrorCallback', 'DefaultErrorCallback'])) Logger.warn("PhysXProvider: PxDefaultErrorCallback could not be mapped.");
            if (!map('PxTolerancesScale', ['PxTolerancesScale', 'TolerancesScale'])) Logger.warn("PhysXProvider: PxTolerancesScale could not be mapped.");
            if (!map('PxSceneDesc', ['PxSceneDesc', 'SceneDesc'])) Logger.warn("PhysXProvider: PxSceneDesc could not be mapped.");
            if (!map('PxDefaultCpuDispatcherCreate', ['DefaultCpuDispatcherCreate', 'PxDefaultCpuDispatcherCreate'])) Logger.warn("PhysXProvider: PxDefaultCpuDispatcherCreate could not be mapped.");
            if (!map('PxDefaultSimulationFilterShader', ['DefaultFilterShader', 'DefaultSimulationFilterShader', 'PxDefaultSimulationFilterShader'])) Logger.warn("PhysXProvider: PxDefaultSimulationFilterShader could not be mapped.");
            if (!map('PxSceneFlag', ['PxSceneFlag', 'PxSceneFlagEnum', 'SceneFlag', 'SceneFlagEnum'])) Logger.warn("PhysXProvider: PxSceneFlag could not be mapped.");
            if (!map('PxBroadPhaseType', ['PxBroadPhaseType', 'BroadPhaseType', 'PxBroadPhaseTypeEnum'])) Logger.warn("PhysXProvider: PxBroadPhaseType could not be mapped.");
            if (!map('PxRigidBodyExt', ['PxRigidBodyExt'])) Logger.warn("PhysXProvider: PxRigidBodyExt could not be mapped.");
            if (!map('PxForceMode', ['PxForceMode', 'ForceMode', 'PxForceModeEnum'])) Logger.warn("PhysXProvider: PxForceMode could not be mapped.");
            if (!map('PxConvexMeshDesc', ['PxConvexMeshDesc', 'ConvexMeshDesc'])) Logger.warn("PhysXProvider: PxConvexMeshDesc could not be mapped.");
            if (!map('PxConvexFlag', ['PxConvexFlag', 'ConvexFlag', 'PxConvexFlagEnum', 'ConvexFlagEnum'])) Logger.warn("PhysXProvider: PxConvexFlag could not be mapped.");
            if (!map('PxHullPolygon', ['PxHullPolygon', 'HullPolygon'])) Logger.warn("PhysXProvider: PxHullPolygon could not be mapped.");

            this.physx = physx;

            // Verification: ensure we have minimal required API
            if (!this.physx.PxCreateFoundation || !this.physx.PxCreatePhysics) {
                throw new Error('PhysX API initialization failed: CreateFoundation/CreatePhysics missing.');
            }
            
            // Specific verification for cooking, which is causing the error.
            if (!this.physx.CreateConvexMesh) {
                Logger.warn('PhysXProvider: CreateConvexMesh is missing. Convex hull generation will be disabled. Using fallback shapes.');
                this.cookingAvailable = false;
            } else {
                this.cookingAvailable = true;
            }

            // --- Standard PhysX Setup ---
            this.version = this.physx.PX_PHYSICS_VERSION || this.physx.PHYSICS_VERSION || this.physx.PX_PHYSICS_VERSION;
            if (!this.version) this.version = this.physx.PX_PHYSICS_VERSION = this.physx.PHYSICS_VERSION || this.physx.PX_PHYSICS_VERSION;
            Logger.message(`PhysX Version: ${this.version}`);

            this.foundation = this.physx.PxCreateFoundation(this.version, new this.physx.PxDefaultAllocator(), new this.physx.PxDefaultErrorCallback());
            this.physics = this.physx.PxCreatePhysics(this.version, this.foundation, new this.physx.PxTolerancesScale(), false, null);

            // Create scene descriptor robustly to handle either WebIDL set_* methods or plain properties
            const sceneDesc = new this.physx.PxSceneDesc(this.physics.getTolerancesScale ? this.physics.getTolerancesScale() : (new this.physx.PxTolerancesScale()));
            // set gravity using whichever API is present
            if (typeof sceneDesc.set_gravity === 'function' && this.physx.PxVec3) {
                sceneDesc.set_gravity(new this.physx.PxVec3(0, 0, 0));
            } else if ('gravity' in sceneDesc) {
                sceneDesc.gravity = { x: 0, y: 0, z: 0 };
            }

            // cpu dispatcher
            this.cpuDispatcher = (this.physx.PxDefaultCpuDispatcherCreate || this.physx.DefaultCpuDispatcherCreate) ? (this.physx.PxDefaultCpuDispatcherCreate ? this.physx.PxDefaultCpuDispatcherCreate(0) : this.physx.DefaultCpuDispatcherCreate(0)) : null;
            if (this.cpuDispatcher) sceneDesc.cpuDispatcher = this.cpuDispatcher;

            // filter shader
            const filterShaderFn = this.physx.PxDefaultSimulationFilterShader || this.physx.DefaultFilterShader || this.physx.DefaultSimulationFilterShader;
            if (filterShaderFn) sceneDesc.filterShader = filterShaderFn();

            // flags: handle both object with set() and numeric flags
            try {
                if (sceneDesc.flags && typeof sceneDesc.flags.set === 'function' && this.physx.PxSceneFlag) {
                    sceneDesc.flags.set(this.physx.PxSceneFlag.eENABLE_STABILIZATION || (this.physx.PxSceneFlag && this.physx.PxSceneFlagEnum && this.physx.PxSceneFlagEnum.eENABLE_STABILIZATION));
                } else if (typeof sceneDesc.flags === 'number' && this.physx.PxSceneFlag) {
                    sceneDesc.flags |= this.physx.PxSceneFlag.eENABLE_STABILIZATION;
                }
            } catch (e) {
                // non-fatal
                Logger.warn('Could not set scene flags: ' + e);
            }

            if (this.physx.PxBroadPhaseType) {
                sceneDesc.broadPhaseType = this.physx.PxBroadPhaseType.ePABP || sceneDesc.broadPhaseType;
            }

            this.scene = this.physics.createScene ? this.physics.createScene(sceneDesc) : (this.physics.createScene && this.physics.createScene(sceneDesc));

            this.initialized = true;
            Logger.message('PhysXProvider initialized successfully.');

        } catch (error) {
            Logger.error(`Failed to initialize PhysX via provider: ${error.message}`, error.stack);
            throw error;
        } finally {
            Logger.end(funcName);
        }
    }

    _getBuffer() {
        if (!this.physx) return null;
        if (this.physx.HEAPU8 && this.physx.HEAPU8.buffer) return this.physx.HEAPU8.buffer;
        if (this.physx.HEAP8 && this.physx.HEAP8.buffer) return this.physx.HEAP8.buffer;
        if (this.physx.buffer) return this.physx.buffer;
        try { if (this.physx.wasmMemory) return this.physx.wasmMemory.buffer; } catch (e) {}
        return null;
    }

    _getHeapF32() {
        const buffer = this._getBuffer();
        return buffer ? new Float32Array(buffer) : null;
    }

    // --- All other helper functions (update, addBox, addTriMesh, dispose, etc.) remain the same ---
    // They rely on `this.physx`, `this.physics`, and `this.scene`, which are set in the new `init`.
    
    update(delta) {
        if (!this.initialized) return;
        this.applyCustomGravity();
        const timestep = Math.min(delta, 0.033);
        this.scene.simulate(timestep);
        this.scene.fetchResults(true);
        this.bodies.forEach((data, mesh) => {
            if (data.isStatic) return;
            const transform = data.body.getGlobalPose();
            mesh.position.set(transform.p.x, transform.p.y, transform.p.z);
            mesh.quaternion.set(transform.q.x, transform.q.y, transform.q.z, transform.q.w);
        });
    }

    setGravity(mode, strength = 9.81, center = { x: 0, y: 0, z: 0 }) {
        this.gravityMode = mode;
        this.gravityStrength = strength;
        this.gravityCenter = center;
    }

    applyCustomGravity() {
        if (this.gravityMode === 'none' || !this.initialized) return;
        this.bodies.forEach((data, mesh) => {
            if (data.isStatic) return;
            const pos = data.body.getGlobalPose().p;
            let gravityForce = { x: 0, y: 0, z: 0 };
            if (this.gravityMode === 'radial') {
                const dir = { x: pos.x - this.gravityCenter.x, y: pos.y - this.gravityCenter.y, z: 0 };
                const dist = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
                if (dist > 0.001) {
                    gravityForce = { x: (dir.x / dist) * this.gravityStrength, y: (dir.y / dist) * this.gravityStrength, z: 0 };
                }
            } else if (this.gravityMode === 'central') {
                const dir = { x: this.gravityCenter.x - pos.x, y: this.gravityCenter.y - pos.y, z: this.gravityCenter.z - pos.z };
                const dist = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
                if (dist > 0.001) {
                    gravityForce = { x: (dir.x / dist) * this.gravityStrength, y: (dir.y / dist) * this.gravityStrength, z: (dir.z / dist) * this.gravityStrength };
                }
            }
            data.body.addForce(gravityForce, this.physx.PxForceMode.eACCELERATION);
        });
    }
    
    createMaterial(staticFriction, dynamicFriction, restitution) {
        if (!this.initialized) return null;
        return this.physics.createMaterial(staticFriction, dynamicFriction, restitution);
    }
    
    addBox(mesh, mass = 1, material) {
        // This function and others below would need to be updated if they have issues,
        // but they seem to rely on a correctly initialized `this.physx` which should now be fixed.
        if (!this.initialized) return null;
        const size = new THREE.Vector3();
        mesh.geometry.boundingBox.getSize(size);
        const geometry = new this.physx.PxBoxGeometry(size.x / 2, size.y / 2, size.z / 2);
        if (!material) material = this.physics.createMaterial(0.5, 0.5, 0.6);
        const transform = { p: mesh.position, q: mesh.quaternion };
        let body;
        if (mass > 0) {
            body = this.physics.createRigidDynamic(transform);
            // PxRigidBodyExt is now directly on physx
            this.physx.PxRigidBodyExt.updateMassAndInertia(body, mass);
        } else {
            body = this.physics.createRigidStatic(transform);
        }
        const shape = this.physics.createShape(geometry, material, true);
        body.attachShape(shape);
        this.scene.addActor(body);
        this.bodies.set(mesh, { body, isStatic: mass === 0 });
        return body;
    }

    addTriMesh(mesh, material) {
        if (!this.initialized) return null;
        const geometry = mesh.geometry;
        if (!geometry || !geometry.attributes.position || !geometry.index) return null;
        
        const positions = geometry.attributes.position.array;
        const indices = geometry.index.array;

        // Using a helper function to avoid memory leaks
        const [pointsPtr, indicesPtr] = (() => {
            const heapF32 = this._getHeapF32();
            if (!heapF32) return [0, 0]; // Should handle error better but this prevents crash
            const posPtr = this.physx._malloc(positions.length * 4);
            heapF32.set(positions, posPtr / 4);
            const indPtr = this.physx._malloc(indices.length * 4);
            // Triangle meshes can use 16 or 32 bit indices. Check the array type.
            if(indices instanceof Uint16Array) {
                 new Uint16Array(this._getBuffer()).set(indices, indPtr / 2);
            } else {
                 new Uint32Array(this._getBuffer()).set(indices, indPtr / 4);
            }
            return [posPtr, indPtr];
        })();

        const triangleMeshDesc = new this.physx.PxTriangleMeshDesc();
        triangleMeshDesc.points.count = positions.length / 3;
        triangleMeshDesc.points.stride = 12; // 3 floats * 4 bytes
        triangleMeshDesc.points.data = pointsPtr;

        triangleMeshDesc.triangles.count = indices.length / 3;
        // Adjust stride based on index format
        triangleMeshDesc.triangles.stride = (indices instanceof Uint16Array) ? 6 : 12;
        triangleMeshDesc.triangles.data = indicesPtr;
         if (indices instanceof Uint16Array) {
            triangleMeshDesc.flags.raise(this.physx.PxMeshFlag.e16_BIT_INDICES);
        }

        const cooking = this.physx.PxCreateCooking(this.version, this.foundation, new this.physx.PxCookingParams(new this.physx.PxTolerancesScale()));
        const cookedMesh = cooking.createTriangleMesh(triangleMeshDesc, this.physics.getPhysicsInsertionCallback());

        if (typeof this.physx._free === 'function') {
            this.physx._free(pointsPtr);
            this.physx._free(indicesPtr);
        }
        cooking.release();
        
        const body = this.physics.createRigidStatic({ p: mesh.position, q: mesh.quaternion });
        if (!material) material = this.physics.createMaterial(0.5, 0.5, 0.6);
        const shape = this.physics.createShape(new this.physx.PxTriangleMeshGeometry(cookedMesh), material, true);
        body.attachShape(shape);
        this.scene.addActor(body);
        this.bodies.set(mesh, { body, isStatic: true });
        return body;
    }

    createConvexHull(vertices) {
        if (!this.initialized || !this.cookingAvailable) return null;

        try {
            const physx = this.physx;
            // In the WASM IDL, cooking functions are top-level statics, not a class instance.
            const params = new physx.PxCookingParams(new physx.PxTolerancesScale());

            const desc = new physx.PxConvexMeshDesc();
            const pointsPtr = physx._malloc(vertices.length * 4);
            
            const heapF32 = this._getHeapF32();
            if (!heapF32) throw new Error("Cannot access WASM memory.");
            heapF32.set(vertices, pointsPtr >> 2);

            desc.points.count = vertices.length / 3;
            desc.points.stride = 12; // 3 floats * 4 bytes
            desc.points.data = pointsPtr;
            desc.flags.raise(physx.PxConvexFlag.eCOMPUTE_CONVEX);

            // Use the static function mapped from IDL
            const cookedMesh = physx.CreateConvexMesh(params, desc);
            
            if (typeof physx._free === 'function') {
                physx._free(pointsPtr);
            }
            // params is a struct, likely GC'd or lightweight, no release() method on PxCookingParams in IDL usually.

            if (!cookedMesh) {
                Logger.warn("Failed to cook convex mesh.");
                return null;
            }

            // Extract vertices and indices from the cooked mesh
            const nbVerts = cookedMesh.getNbVertices();
            const vertBuffer = cookedMesh.getVertices();
            const hullVertices = new Float32Array(nbVerts * 3);
            
            // Refresh heap view for reading back
            const heapF32Vertices = this._getHeapF32();
            const vertOffset = vertBuffer >> 2;

            for (let i = 0; i < nbVerts; i++) {
                hullVertices[i * 3 + 0] = heapF32Vertices[vertOffset + i * 3 + 0];
                hullVertices[i * 3 + 1] = heapF32Vertices[vertOffset + i * 3 + 1];
                hullVertices[i * 3 + 2] = heapF32Vertices[vertOffset + i * 3 + 2];
            }

            const nbPolygons = cookedMesh.getNbPolygons();
            const indicesBufferPtr = cookedMesh.getIndexBuffer();
            const hullIndices = [];
            const polygonData = new physx.PxHullPolygon();

            // PhysX uses 8-bit indices for vertex counts <= 256, 16-bit otherwise
            const useU16 = nbVerts > 256;
            const heapIndices = useU16 ? new Uint16Array(this._getBuffer()) : new Uint8Array(this._getBuffer());

            for(let i = 0; i < nbPolygons; i++) {
                cookedMesh.getPolygonData(i, polygonData);
                const nbVertsInPolygon = polygonData.get_mNbVerts();
                const indexBase = polygonData.get_mIndexBase();
                
                // Calculate index into the Heap array based on type width
                // If U16, pointer is byte address, so divide by 2 to get array index
                // If U8, pointer is byte address, so use directly
                const heapIndex = useU16 ? (indicesBufferPtr >> 1) + indexBase : indicesBufferPtr + indexBase;
                
                // Triangulate the polygon
                for (let j = 0; j < nbVertsInPolygon - 2; j++) {
                    hullIndices.push(heapIndices[heapIndex + 0]);
                    hullIndices.push(heapIndices[heapIndex + j + 1]);
                    hullIndices.push(heapIndices[heapIndex + j + 2]);
                }
            }
            physx.destroy(polygonData);

            cookedMesh.release();

            return {
                vertices: hullVertices,
                indices: new Uint16Array(hullIndices)
            };
        } catch (error) {
            Logger.warn(`PhysXProvider: Convex Hull generation failed: ${error.message}`);
            return null;
        }
    }

    dispose() {
        if (!this.initialized) return;
        this.initialized = false;
        this.bodies.clear();
        this.softBodies.clear();
        if (this.scene) this.scene.release();
        if (this.cpuDispatcher) this.cpuDispatcher.release();
        if (this.physics) this.physics.release();
        if (this.foundation) this.foundation.release();
        this.physx = null;
        Logger.message("PhysXProvider disposed.");
    }
}