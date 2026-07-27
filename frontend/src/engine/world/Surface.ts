import * as THREE from "three";

export class Surface {

    public mesh: THREE.Mesh;

    constructor() {

        const geometry = new THREE.SphereGeometry(
            5,
            128,
            128
        );

        const material = new THREE.MeshStandardMaterial({

            color: 0x355c3a,

            roughness: 1,

            metalness: 0

        });

        this.mesh = new THREE.Mesh(
            geometry,
            material
        );

        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

    }

}
