import * as THREE from "three";

export class CameraManager {

    public camera: THREE.PerspectiveCamera;

    // =========================================================
    // Cinematic Camera Settings
    // =========================================================

    private angle = 0;

    private readonly radius = 18;

    private readonly height = 4;

    private readonly speed = 0.12;

    constructor() {

        this.camera = new THREE.PerspectiveCamera(

            60,

            window.innerWidth / window.innerHeight,

            0.1,

            10000

        );

        this.camera.position.set(

            0,

            this.height,

            this.radius

        );

        this.camera.lookAt(

            0,

            0,

            0

        );

    }

    // =========================================================
    // Update
    // =========================================================

    public update(delta: number): void {

        this.angle += delta * this.speed;

        const x =
            Math.sin(this.angle) * this.radius;

        const z =
            Math.cos(this.angle) * this.radius;

        this.camera.position.set(

            x,

            this.height,

            z

        );

        this.camera.lookAt(

            0,

            0,

            0

        );

    }

}
