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
        if ((this as any).savedLines && Array.isArray((this as any).savedLines)) {
            (this as any).savedLines.forEach((l: THREE.Line) => {
                this.scene.remove(l);
                l.geometry.dispose();
                (l.material as THREE.Material).dispose();
            });
            (this as any).savedLines = [];
        }
        this.spheres.forEach(s => {
            this.scene.remove(s);
            s.geometry.dispose();
            (s.material as THREE.Material).dispose();
        });
        this.spheres = [];
        this.points = [];
    }

    public restoreMeasurements(measurements: { startPoint: [number, number, number]; endPoint: [number, number, number] }[]) {
        this.clear();
        if (!measurements || !Array.isArray(measurements)) return;

        measurements.forEach(m => {
            const p1 = new THREE.Vector3(m.startPoint[0], m.startPoint[1], m.startPoint[2]);
            const p2 = new THREE.Vector3(m.endPoint[0], m.endPoint[1], m.endPoint[2]);

            const sphereGeo = new THREE.SphereGeometry(MEASUREMENT.SPHERE_RADIUS, MEASUREMENT.SPHERE_SEGMENTS, MEASUREMENT.SPHERE_SEGMENTS);
            const sphereMat = new THREE.MeshBasicMaterial({ color: MEASUREMENT.COLOR, depthTest: false });

            const s1 = new THREE.Mesh(sphereGeo, sphereMat);
            s1.position.copy(p1);
            this.scene.add(s1);
            this.spheres.push(s1);

            const s2 = new THREE.Mesh(sphereGeo, sphereMat);
            s2.position.copy(p2);
            this.scene.add(s2);
            this.spheres.push(s2);

            const lineMat = new THREE.LineBasicMaterial({ color: MEASUREMENT.COLOR, linewidth: MEASUREMENT.LINE_WIDTH, depthTest: false });
            const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
            const line = new THREE.Line(lineGeo, lineMat);
            this.scene.add(line);
            
            // Store reference to lines if multiple line clearing is needed
            (this as any).savedLines = (this as any).savedLines || [];
            (this as any).savedLines.push(line);
        });
    }
}
