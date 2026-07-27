import * as THREE from "three";

export class Lighting {

    constructor(scene: THREE.Scene) {

        const ambient = new THREE.AmbientLight(
            0xffffff,
            0.25
        );

        scene.add(ambient);

        const sun = new THREE.DirectionalLight(
            0xffffff,
            3.5
        );

        sun.position.set(
            25,
            18,
            12
        );

        scene.add(sun);

    }

}
