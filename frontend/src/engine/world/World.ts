import * as THREE from "three";

import { StarField } from "./StarField";
import { Planet } from "./Planet";
import { Atmosphere } from "./Atmosphere";
import { Clouds } from "./Clouds";

export class World {

    private stars: StarField;

    private planet: Planet;

    private atmosphere: Atmosphere;

    private clouds: Clouds;

    constructor(scene: THREE.Scene) {

        // =====================================================
        // Stars
        // =====================================================

        this.stars = new StarField();

        scene.add(
            this.stars.points
        );

        // =====================================================
        // Planet
        // =====================================================

        this.planet = new Planet(scene);

        // =====================================================
        // Clouds
        // =====================================================

        this.clouds = new Clouds();

        scene.add(
            this.clouds.mesh
        );

        // =====================================================
        // Atmosphere
        // =====================================================

        this.atmosphere = new Atmosphere();

        scene.add(
            this.atmosphere.mesh
        );

    }

    // =========================================================
    // Update
    // =========================================================

    public update(delta: number): void {

        this.stars.update(delta);

        this.planet.update(delta);

        this.clouds.update(delta);

        this.atmosphere.update(delta);

    }

}
