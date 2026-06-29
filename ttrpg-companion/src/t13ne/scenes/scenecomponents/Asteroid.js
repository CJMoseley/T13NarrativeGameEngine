import * as THREE from 'three';

export class Asteroid extends THREE.Mesh {
    constructor(size = 5) {
        const geometry = new THREE.DodecahedronGeometry(size, 0); // Low poly rock
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x888888, 
            roughness: 0.9, 
            metalness: 0.2 
        });
        super(geometry, material);
        this.castShadow = true;
        this.receiveShadow = true;
    }
}