import * as THREE from "three";

export class Atmosphere {

    public mesh: THREE.Mesh;

    constructor() {

        const geometry = new THREE.SphereGeometry(
            5.18,
            128,
            128
        );

        const material = new THREE.MeshBasicMaterial({

            color: 0x62e6ff,

            transparent: true,

            opacity: 0.08,

            side: THREE.BackSide,

            depthWrite: false

        });

        this.mesh = new THREE.Mesh(
            geometry,
            material
        );

    }

    public update(delta: number): void {

        this.mesh.rotation.y += delta * 0.01;

    }

}
