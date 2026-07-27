import * as THREE from "three";

export class Clouds {

    public mesh: THREE.Mesh;

    constructor() {

        // =====================================================
        // Geometry
        // =====================================================

        const geometry = new THREE.SphereGeometry(

            5.08,

            128,

            128

        );

        // =====================================================
        // Material
        // =====================================================

        const material = new THREE.MeshPhongMaterial({

            color: 0xffffff,

            transparent: true,

            opacity: 0.18,

            depthWrite: false,

            side: THREE.DoubleSide

        });

        this.mesh = new THREE.Mesh(

            geometry,

            material

        );

    }

    // =========================================================
    // Animation
    // =========================================================

    public update(delta: number): void {

        // Clouds rotate slightly faster
        // than the planet.

        this.mesh.rotation.y += delta * 0.05;

    }

}
