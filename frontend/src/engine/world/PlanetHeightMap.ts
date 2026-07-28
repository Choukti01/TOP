import { PlanetNoise } from "./PlanetNoise";
import type { PlanetSample } from "./PlanetData";
import { TerrainClassifier } from "./TerrainClassifier";

export class PlanetHeightMap {

    private noise = new PlanetNoise();

    private classifier = new TerrainClassifier();

    public sample(

        x: number,

        y: number,

        z: number

    ): PlanetSample {

        const height =

            this.noise.sample(

                x,

                y,

                z

            );

        const temperature =

            1 - Math.abs(y);

        const moisture =

            (height + 1) * 0.5;

        const terrain =

            this.classifier.classify(

                height

            );

        return {

            height,

            temperature,

            moisture,

            terrain

        };

    }

}
