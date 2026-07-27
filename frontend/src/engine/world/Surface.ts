import * as THREE from "three";

export class Surface {

    public mesh: THREE.Mesh;

    constructor() {

        const geometry = new THREE.SphereGeometry(
            5,
            192,
            192
        );

        const material = new THREE.MeshStandardMaterial({

            color: new THREE.Color("#355C3A"),

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
