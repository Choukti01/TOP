import * as THREE from "three";

export class StarField {

    public points: THREE.Points;

    constructor(count: number = 25000) {

        const geometry = new THREE.BufferGeometry();

        const positions: number[] = [];
        const colors: number[] = [];

        const color = new THREE.Color();

        for (let i = 0; i < count; i++) {

            // =====================================================
            // Star Position
            // =====================================================

            positions.push(

                (Math.random() - 0.5) * 12000,
                (Math.random() - 0.5) * 12000,
                (Math.random() - 0.5) * 12000

            );

            // =====================================================
            // Star Color
            // =====================================================

            const t = Math.random();

            if (t < 0.60) {

                // White star
                color.setRGB(1.0, 1.0, 1.0);

            } else if (t < 0.85) {

                // Blue star
                color.setRGB(0.75, 0.87, 1.0);

            } else {

                // Warm star
                color.setRGB(1.0, 0.94, 0.80);

            }

            colors.push(
                color.r,
                color.g,
                color.b
            );

        }

        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(
                positions,
                3
            )
        );

        geometry.setAttribute(
            "color",
            new THREE.Float32BufferAttribute(
                colors,
                3
            )
        );

        const material = new THREE.PointsMaterial({

            size: 1.8,
            vertexColors: true,
            transparent: true,
            opacity: 0.95,
            sizeAttenuation: true

        });

        this.points = new THREE.Points(
            geometry,
            material
        );

    }

    public update(delta: number): void {

        // Slow galaxy rotation
        this.points.rotation.y += delta * 0.004;

    }

}
