import * as THREE from 'three';

/**
 * @module UHPP/PrimitiveModelRegistry
 * @description Registers and creates Three.js primitives as models for the UHPP.
 */
export class PrimitiveModelRegistry {
    constructor() {
        this.primitives = new Map();
        this._registerDefaults();
    }

    _registerDefaults() {
        this.register('Box', (p) => new THREE.BoxGeometry(p.width || 1, p.height || 1, p.depth || 1));
        this.register('Sphere', (p) => new THREE.SphereGeometry(p.radius || 0.5, p.widthSegments || 16, p.heightSegments || 16));
        this.register('Cylinder', (p) => new THREE.CylinderGeometry(p.radiusTop || 0.5, p.radiusBottom || 0.5, p.height || 1, p.radialSegments || 16));
        this.register('Cone', (p) => new THREE.ConeGeometry(p.radius || 0.5, p.height || 1, p.radialSegments || 16));
        this.register('Torus', (p) => new THREE.TorusGeometry(p.radius || 0.5, p.tube || 0.2, p.radialSegments || 16, p.tubularSegments || 32));
        this.register('Plane', (p) => new THREE.PlaneGeometry(p.width || 1, p.height || 1));
    }

    register(name, factory) {
        this.primitives.set(name.toLowerCase(), factory);
    }

    createMesh(name, params = {}, material = new THREE.MeshStandardMaterial({ color: 0xcccccc })) {
        const factory = this.primitives.get(name.toLowerCase());
        if (!factory) {
            console.warn(`PrimitiveModelRegistry: Primitive '${name}' not found.`);
            return new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
        }
        const geometry = factory(params);
        return new THREE.Mesh(geometry, material);
    }

    getGeometry(name, params = {}) {
        const factory = this.primitives.get(name.toLowerCase());
        return factory ? factory(params) : new THREE.BoxGeometry(1, 1, 1);
    }
}

export const primitiveRegistry = new PrimitiveModelRegistry();
