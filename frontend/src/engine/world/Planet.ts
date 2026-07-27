import * as THREE from "three";
import { Surface } from "./Surface";

export class Planet {

    private surface: Surface;

    constructor(scene: THREE.Scene) {

        this.surface = new Surface();

        scene.add(
            this.surface.mesh
        );

    }

    update(delta: number) {

        this.surface.mesh.rotation.y += delta * 0.03;

    }

}
