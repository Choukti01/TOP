import * as THREE from "three";

import { Surface } from "./Surface";
import { PlanetGenerator } from "./PlanetGenerator";

export class Planet {

    private surface: Surface;
    private generator: PlanetGenerator;

    constructor(scene: THREE.Scene) {

        // =====================================================
        // Surface
        // =====================================================

        this.surface = new Surface();

        // =====================================================
        // Planet Generator
        // =====================================================

        this.generator = new PlanetGenerator();

        this.generator.generate(
            this.surface.mesh
        );

        // =====================================================
        // Add to Scene
        // =====================================================

        scene.add(
            this.surface.mesh
        );

    }

    public update(delta: number): void {

        // Slow planet rotation
        this.surface.mesh.rotation.y += delta * 0.03;

    }

}
