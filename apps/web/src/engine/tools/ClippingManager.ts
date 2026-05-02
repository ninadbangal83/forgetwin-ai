import * as THREE from 'three';
import { CLIPPING } from '@/constants/viewer';

export class ClippingManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  public clipPlanes: THREE.Plane[];
  public planeMeshes: THREE.Mesh[];
  private invert: boolean = false;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.renderer.localClippingEnabled = true;

    // X, Y, Z planes initialized at origin
    this.clipPlanes = [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    ];

    // Build solid, custom double-sided planes instead of wireframes with diagonal lines
    this.planeMeshes = [
      new THREE.Mesh(
        new THREE.PlaneGeometry(CLIPPING.SIZE, CLIPPING.SIZE),
        new THREE.MeshBasicMaterial({
          color: CLIPPING.COLORS.X, // Indigo
          side: THREE.DoubleSide,
          transparent: true,
          opacity: CLIPPING.OPACITY,
          depthWrite: false
        })
      ),
      new THREE.Mesh(
        new THREE.PlaneGeometry(CLIPPING.SIZE, CLIPPING.SIZE),
        new THREE.MeshBasicMaterial({
          color: CLIPPING.COLORS.Y, // Teal
          side: THREE.DoubleSide,
          transparent: true,
          opacity: CLIPPING.OPACITY,
          depthWrite: false
        })
      ),
      new THREE.Mesh(
        new THREE.PlaneGeometry(CLIPPING.SIZE, CLIPPING.SIZE),
        new THREE.MeshBasicMaterial({
          color: CLIPPING.COLORS.Z, // Rose
          side: THREE.DoubleSide,
          transparent: true,
          opacity: CLIPPING.OPACITY,
          depthWrite: false
        })
      )
    ];

    this.planeMeshes.forEach(m => {
        m.visible = false;
        this.scene.add(m);
    });

    this.updatePlaneMeshes();
  }

  public setEnabled(enabled: boolean) {
    this.renderer.localClippingEnabled = enabled;
    this.planeMeshes.forEach(m => m.visible = enabled);
  }

  public setPlanes(x: number, y: number, z: number) {
    this.clipPlanes[0].constant = this.invert ? -x : x;
    this.clipPlanes[1].constant = this.invert ? -y : y;
    this.clipPlanes[2].constant = this.invert ? -z : z;
    this.updatePlaneMeshes();
  }

  public setInvert(invert: boolean) {
    this.invert = invert;
    this.clipPlanes[0].normal.set(invert ? -1 : 1, 0, 0);
    this.clipPlanes[1].normal.set(0, invert ? -1 : 1, 0);
    this.clipPlanes[2].normal.set(0, 0, invert ? -1 : 1);
    this.updatePlaneMeshes();
  }

  private updatePlaneMeshes() {
    this.clipPlanes.forEach((plane, i) => {
      const mesh = this.planeMeshes[i];
      if (!mesh) return;
      mesh.position.copy(plane.normal).multiplyScalar(-plane.constant);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), plane.normal);
    });
  }

  public applyToMaterial(material: THREE.Material) {
    material.clippingPlanes = this.clipPlanes;
    material.clipIntersection = false;
    material.needsUpdate = true;
  }
}
