import { Renderer } from "../renderer/Renderer";
import { SceneManager } from "../scene/Scene";
import { CameraManager } from "../camera/Camera";
import { AnimationLoop } from "../animation/AnimationLoop";
import { Lighting } from "../lighting/Lighting";
import { World } from "../world/World";

export class Engine {

    private renderer: Renderer;
    private scene: SceneManager;
    private camera: CameraManager;
    private lighting: Lighting;
    private world: World;
    private animation: AnimationLoop;

    constructor(container: HTMLElement) {

        console.log("🚀 Initializing TOP Engine...");

        // =====================================================
        // Core Systems
        // =====================================================

        this.renderer = new Renderer(container);

        this.scene = new SceneManager();

        this.camera = new CameraManager();

        // =====================================================
        // Lighting
        // =====================================================

        this.lighting = new Lighting(
            this.scene.scene
        );

        // =====================================================
        // World
        // =====================================================

        this.world = new World(
            this.scene.scene
        );

        // =====================================================
        // Animation Loop
        // =====================================================

        this.animation = new AnimationLoop(

            this,

            this.renderer,

            this.scene,

            this.camera

        );

        console.log("✅ TOP Engine initialized.");

    }

    // =========================================================
    // Frame Update
    // =========================================================

    public update(delta: number): void {

        // ---------------------------------------------
        // Camera
        // ---------------------------------------------

        this.camera.update(delta);

        // ---------------------------------------------
        // World
        // ---------------------------------------------

        this.world.update(delta);

    }

    // =========================================================
    // Engine Start
    // =========================================================

    public start(): void {

        console.log("▶ Starting TOP Engine...");

        this.animation.start();

    }

}
