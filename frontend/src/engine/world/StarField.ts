import * as THREE from "three";

export class StarField {
    public points: THREE.Points;

    constructor(count: number = 12000) {

        const geometry = new THREE.BufferGeometry();

        const positions: number[] = [];
        const colors: number[] = [];

        const color = new THREE.Color();

        for (let i = 0; i < count; i++) {

            positions.push(
                (Math.random() - 0.5) * 5000,
                (Math.random() - 0.5) * 5000,
                (Math.random() - 0.5) * 5000
            );

            const t = Math.random();

            if (t < 0.6) {
                color.setRGB(1.0, 1.0, 1.0);
            } else if (t < 0.85) {
                color.setRGB(0.8, 0.9, 1.0);
            } else {
                color.setRGB(1.0, 0.95, 0.8);
            }

            colors.push(color.r, color.g, color.b);
        }

        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(positions, 3)
        );

        geometry.setAttribute(
            "color",
            new THREE.Float32BufferAttribute(colors, 3)
        );

        const material = new THREE.PointsMaterial({
            size: 1.6,
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

    update(delta: number) {

        this.points.rotation.y += delta * 0.01;

    }

}
