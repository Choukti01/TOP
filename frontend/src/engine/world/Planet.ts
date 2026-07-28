import * as THREE from "three";

import { Surface } from "./Surface";
import { PlanetGenerator } from "./PlanetGenerator";

export class Planet {

    private surface: Surface;

    private generator: PlanetGenerator;

    constructor(scene: THREE.Scene) {

        this.surface = new Surface();

        this.generator = new PlanetGenerator();

        this.generator.generate(
            this.surface.mesh
        );

        scene.add(
            this.surface.mesh
        );

    }

    public update(delta: number): void {

        this.surface.mesh.rotation.y += delta * 0.03;

    }

}
