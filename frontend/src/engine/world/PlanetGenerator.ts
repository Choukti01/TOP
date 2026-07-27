import * as THREE from "three";
import { PlanetNoise } from "./PlanetNoise";

export class PlanetGenerator {

    private noise = new PlanetNoise();

    public generate(mesh: THREE.Mesh): void {

        const geometry =
            mesh.geometry as THREE.SphereGeometry;

        const position =
            geometry.attributes.position;

        for (let i = 0; i < position.count; i++) {

            let x = position.getX(i);
            let y = position.getY(i);
            let z = position.getZ(i);

            const length =
                Math.sqrt(
                    x * x +
                    y * y +
                    z * z
                );

            // Normalize vertex
            x /= length;
            y /= length;
            z /= length;

            const elevation =
                this.noise.sample(
                    x,
                    y,
                    z
                );

            const radius =
                5 + elevation;

            position.setXYZ(

                i,

                x * radius,
                y * radius,
                z * radius

            );

        }

        position.needsUpdate = true;

        geometry.computeVertexNormals();

    }

}
