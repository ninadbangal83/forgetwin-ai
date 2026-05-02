import * as THREE from 'three';

export class FrustumManager {
  private frustum = new THREE.Frustum();
  private projScreenMatrix = new THREE.Matrix4();

  public update(camera: THREE.PerspectiveCamera) {
    this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
  }

  private scratchMin = new THREE.Vector3();
  private scratchMax = new THREE.Vector3();
  private scratchBox = new THREE.Box3();
  private scratchCenter = new THREE.Vector3();

  public isBoxVisible(min: number[], max: number[]): boolean {
    this.scratchMin.set(min[0], min[1], min[2]);
    this.scratchMax.set(max[0], max[1], max[2]);
    this.scratchBox.set(this.scratchMin, this.scratchMax);
    return this.frustum.intersectsBox(this.scratchBox);
  }

  public getDistanceToBox(camera: THREE.PerspectiveCamera, min: number[], max: number[]): number {
    this.scratchMin.set(min[0], min[1], min[2]);
    this.scratchMax.set(max[0], max[1], max[2]);
    this.scratchBox.set(this.scratchMin, this.scratchMax);
    this.scratchBox.getCenter(this.scratchCenter);
    return camera.position.distanceTo(this.scratchCenter);
  }
}
