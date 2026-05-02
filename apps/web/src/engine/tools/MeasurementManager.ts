import * as THREE from 'three';
import { MEASUREMENT } from '@/constants/viewer';

export class MeasurementManager {
    private scene: THREE.Scene;
    private points: THREE.Vector3[] = [];
    private line: THREE.Line | null = null;
    private spheres: THREE.Mesh[] = [];

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    public addPoint(point: THREE.Vector3): { distance: number | null, p1: number[], p2: number[] } | null {
        if (this.points.length >= 2) {
            this.clear();
        }

        this.points.push(point.clone());

        const sphereGeo = new THREE.SphereGeometry(MEASUREMENT.SPHERE_RADIUS, MEASUREMENT.SPHERE_SEGMENTS, MEASUREMENT.SPHERE_SEGMENTS);
        const sphereMat = new THREE.MeshBasicMaterial({ color: MEASUREMENT.COLOR, depthTest: false });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.copy(point);
        this.scene.add(sphere);
        this.spheres.push(sphere);

        if (this.points.length === 2) {
            const mat = new THREE.LineBasicMaterial({ color: MEASUREMENT.COLOR, linewidth: MEASUREMENT.LINE_WIDTH, depthTest: false });
            const geo = new THREE.BufferGeometry().setFromPoints(this.points);
            this.line = new THREE.Line(geo, mat);
            this.scene.add(this.line);

            const dist = this.points[0].distanceTo(this.points[1]);
            return {
                distance: dist,
                p1: [this.points[0].x, this.points[0].y, this.points[0].z],
                p2: [this.points[1].x, this.points[1].y, this.points[1].z]
            };
        }

        return null;
    }

    public clear() {
        if (this.line) {
            this.scene.remove(this.line);
            this.line.geometry.dispose();
            (this.line.material as THREE.Material).dispose();
            this.line = null;
        }
        this.spheres.forEach(s => {
            this.scene.remove(s);
            s.geometry.dispose();
            (s.material as THREE.Material).dispose();
        });
        this.spheres = [];
        this.points = [];
    }
}
