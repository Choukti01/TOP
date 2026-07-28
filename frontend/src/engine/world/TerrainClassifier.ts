import { TerrainType } from "./TerrainType";

export class TerrainClassifier {

    public classify(height: number): TerrainType {

        if (height < -0.30)
            return TerrainType.Ocean;

        if (height < -0.10)
            return TerrainType.Beach;

        if (height < 0.15)
            return TerrainType.Plains;

        if (height < 0.35)
            return TerrainType.Forest;

        if (height < 0.55)
            return TerrainType.Hills;

        if (height < 0.80)
            return TerrainType.Mountain;

        return TerrainType.Snow;

    }

}
