import * as THREE from "three";

import { PlanetHeightMap } from "./PlanetHeightMap";
import { PlanetMaterialMap } from "./PlanetMaterialMap";

export class PlanetGenerator {

    private heightmap =
        new PlanetHeightMap();

    private materials =
        new PlanetMaterialMap();

    public generate(
        mesh: THREE.Mesh
    ): void {

        const geometry =
            mesh.geometry as THREE.SphereGeometry;

        const position =
            geometry.attributes.position;

        // ----------------------------------------------------
        // Vertex Colours
        // ----------------------------------------------------

        const colors: number[] = [];

        for (
            let i = 0;
            i < position.count;
            i++
        ) {

            let x = position.getX(i);
            let y = position.getY(i);
            let z = position.getZ(i);

            const length =
                Math.sqrt(
                    x * x +
                    y * y +
                    z * z
                );

            x /= length;
            y /= length;
            z /= length;

            const sample =
                this.heightmap.sample(
                    x,
                    y,
                    z
                );

            const radius =
                5 + sample.height;

            position.setXYZ(

                i,

                x * radius,
                y * radius,
                z * radius

            );

            const color =
                this.materials.color(
                    sample.terrain
                );

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
