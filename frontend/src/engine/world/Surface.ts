import * as THREE from "three";

export class Surface {

    public mesh: THREE.Mesh;

    constructor() {

        const geometry =
            new THREE.SphereGeometry(
                5,
                256,
                256
            );

        const material =
            new THREE.MeshStandardMaterial({

                vertexColors: true,

                roughness: 1,

                metalness: 0,

                flatShading: false

            });

        this.mesh =
            new THREE.Mesh(
                geometry,
                material
            );

        this.mesh.castShadow = true;

        this.mesh.receiveShadow = true;

    }

}
