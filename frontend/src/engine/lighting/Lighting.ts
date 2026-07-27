import * as THREE from "three";

export class Lighting {

    constructor(scene: THREE.Scene) {

        const ambient = new THREE.AmbientLight(
            0xffffff,
            0.2
        );

        scene.add(ambient);

        const sun = new THREE.DirectionalLight(
            0xffffff,
            3
        );

        sun.position.set(
            30,
            20,
            20
        );

        scene.add(sun);

    }

}
