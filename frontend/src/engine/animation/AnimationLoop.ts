import { Engine } from "../core/Engine";
import { Renderer } from "../renderer/Renderer";
import { SceneManager } from "../scene/Scene";
import { CameraManager } from "../camera/Camera";

export class AnimationLoop {

    private previous = performance.now();

    constructor(

        private engine: Engine,
        private renderer: Renderer,
        private scene: SceneManager,
        private camera: CameraManager

    ) {}

    public start(): void {

        const animate = () => {

            requestAnimationFrame(animate);

            // =====================================================
            // Delta Time
            // =====================================================

            const now = performance.now();

            const delta = (now - this.previous) / 1000;

            this.previous = now;

            // =====================================================
            // Update Engine
            // =====================================================

            this.engine.update(delta);

            // =====================================================
            // Render
            // =====================================================

            this.renderer.render(

                this.scene.scene,

                this.camera.camera

            );

        };

        animate();

    }

}
