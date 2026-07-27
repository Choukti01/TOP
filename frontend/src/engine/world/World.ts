import * as THREE from "three";

import { StarField } from "./StarField";
import { Planet } from "./Planet";

export class World {

    private stars: StarField;
    private planet: Planet;

    constructor(scene: THREE.Scene) {

        this.stars = new StarField();

        this.planet = new Planet(scene);

        scene.add(
            this.stars.points
        );

    }

    update(delta: number) {

        this.stars.update(delta);

        this.planet.update(delta);

    }

}
