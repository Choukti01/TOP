import * as THREE from "three";

export class CameraManager {

    public camera: THREE.PerspectiveCamera;

    constructor() {

        this.camera = new THREE.PerspectiveCamera(

            60,

            window.innerWidth / window.innerHeight,

            0.1,

            10000

        );

        this.camera.position.set(

            0,

            2,

            22

        );

        this.camera.lookAt(

            0,

            0,

            0

        );

        window.addEventListener(

            "resize",

            () => {

                this.camera.aspect =

                    window.innerWidth /

                    window.innerHeight;

                this.camera.updateProjectionMatrix();

            }

        );

    }

}
