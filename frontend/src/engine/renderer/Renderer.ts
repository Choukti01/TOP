import * as THREE from "three";

export class Renderer {

    public renderer: THREE.WebGLRenderer;

    constructor(container: HTMLElement) {

        this.renderer = new THREE.WebGLRenderer({

            antialias: true

        });

        this.renderer.setPixelRatio(
            window.devicePixelRatio
        );

        this.renderer.setSize(

            window.innerWidth,

            window.innerHeight

        );

        this.renderer.outputColorSpace =
            THREE.SRGBColorSpace;

        this.renderer.toneMapping =
            THREE.ACESFilmicToneMapping;

        this.renderer.toneMappingExposure = 1.1;

        this.renderer.shadowMap.enabled = true;

        container.appendChild(
            this.renderer.domElement
        );

        window.addEventListener(
            "resize",
            () => this.resize()
        );

    }

    private resize(): void {

        this.renderer.setSize(

            window.innerWidth,

            window.innerHeight

        );

    }

    public render(

        scene: THREE.Scene,

        camera: THREE.Camera

    ): void {

        this.renderer.render(

            scene,

            camera

        );

    }

}
