import * as THREE from "three";

export class Lighting {

    constructor(scene: THREE.Scene) {

        const ambient =

            new THREE.AmbientLight(

                0xffffff,

                0.15

            );

        scene.add(ambient);

        const hemisphere =

            new THREE.HemisphereLight(

                0x87ceeb,

                0x202020,

                0.55

            );

        scene.add(hemisphere);

        const sun =

            new THREE.DirectionalLight(

                0xffffff,

                2.4

            );

        sun.position.set(

            40,

            20,

            25

        );

        sun.castShadow = true;

        scene.add(sun);

    }

}
