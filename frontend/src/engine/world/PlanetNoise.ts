export class PlanetNoise {

    /**
     * Large continents
     */
    private continent(
        x: number,
        y: number,
        z: number
    ): number {

        return (

            Math.sin(x * 0.6)
            + Math.cos(y * 0.5)
            + Math.sin(z * 0.7)

        ) / 3;

    }

    /**
     * Mountain ranges
     */
    private mountains(
        x: number,
        y: number,
        z: number
    ): number {

        return (

            Math.sin(x * 4)
            * Math.cos(y * 4)
            * Math.sin(z * 4)

        );

    }

    /**
     * Small terrain details
     */
    private detail(
        x: number,
        y: number,
        z: number
    ): number {

        return (

            Math.sin(x * 18)
            + Math.cos(y * 16)
            + Math.sin(z * 17)

        ) / 3;

    }

    /**
     * Final terrain height
     */
    public sample(
        x: number,
        y: number,
        z: number
    ): number {

        const continents =
            this.continent(x, y, z) * 0.8;

        const mountains =
            this.mountains(x, y, z) * 0.15;

        const detail =
            this.detail(x, y, z) * 0.03;

        return (
            continents +
            mountains +
            detail
        );

    }

}
