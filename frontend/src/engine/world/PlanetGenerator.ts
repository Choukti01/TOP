import * as THREE from "three";

import { PlanetNoise } from "./PlanetNoise";

export class PlanetGenerator {

    private noise = new PlanetNoise();

    public generate(mesh: THREE.Mesh): void {

        const geometry =
            mesh.geometry as THREE.SphereGeometry;

        const position =
            geometry.attributes.position;

        const colors: number[] = [];

        for (let i = 0; i < position.count; i++) {

            let x = position.getX(i);
            let y = position.getY(i);
            let z = position.getZ(i);

            const length = Math.sqrt(
                x * x +
                y * y +
                z * z
            );

            x /= length;
            y /= length;
            z /= length;

            const elevation =
                this.noise.sample(x, y, z);

            // -------------------------------------------------
            // Planet Shape
            // -------------------------------------------------

            const radius =
                5 + elevation * 0.45;

            position.setXYZ(

                i,

                x * radius,
                y * radius,
                z * radius

            );

            // -------------------------------------------------
            // Planet Colours
            // -------------------------------------------------

            let color: THREE.Color;

            // Oceans
            if (elevation < -0.12) {

                color = new THREE.Color(0x11184a);

            }

            // Beaches
            else if (elevation < -0.04) {

                color = new THREE.Color(0x4d66bd);

            }

            // Grasslands
            else if (elevation < 0.15) {

                color = new THREE.Color(0x2f7e9c);

            }

            // Mountains
            else if (elevation < 0.32) {

                color = new THREE.Color(0x513a9b);

            }

            // Snow
            else {

                color = new THREE.Color(0xb9e9ff);

            }

            colors.push(
                color.r,
                color.g,
                color.b
            );

        }

        geometry.setAttribute(

            "color",

            new THREE.Float32BufferAttribute(
                colors,
                3
            )

        );

        position.needsUpdate = true;

        geometry.computeVertexNormals();

    }

}
