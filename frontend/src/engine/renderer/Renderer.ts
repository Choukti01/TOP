import * as THREE from "three";

export class Renderer {
    public renderer: THREE.WebGLRenderer;

    constructor(container: HTMLElement) {

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });

        this.renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

        this.renderer.setPixelRatio(
            window.devicePixelRatio
        );

        this.renderer.setClearColor(0x000000);

        container.appendChild(this.renderer.domElement);

        window.addEventListener(
            "resize",
            () => this.resize()
        );
    }

    private resize() {

        this.renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }

    public render(
        scene: THREE.Scene,
        camera: THREE.Camera
    ) {

        this.renderer.render(scene, camera);

    }

}