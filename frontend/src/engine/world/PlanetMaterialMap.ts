import * as THREE from "three";

import { TerrainType } from "./TerrainType";

export class PlanetMaterialMap {

    public color(
        terrain: TerrainType
    ): THREE.Color {

        switch (terrain) {

            case TerrainType.Ocean:

                return new THREE.Color(
                    0x1d4ed8
                );

            case TerrainType.Beach:

                return new THREE.Color(
                    0xe9d8a6
                );

            case TerrainType.Plains:

                return new THREE.Color(
                    0x4caf50
                );

            case TerrainType.Forest:

                return new THREE.Color(
                    0x2e7d32
                );

            case TerrainType.Hills:

                return new THREE.Color(
                    0x7cb342
                );

            case TerrainType.Mountain:

                return new THREE.Color(
                    0x757575
                );

            case TerrainType.Snow:

                return new THREE.Color(
                    0xffffff
                );

            default:

                return new THREE.Color(
                    0xff00ff
                );

        }

    }

}
