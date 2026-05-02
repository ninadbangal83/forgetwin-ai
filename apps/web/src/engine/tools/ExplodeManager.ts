import * as THREE from 'three';

export class ExplodeManager {
  private initialPositions = new Map<THREE.Object3D, THREE.Vector3>();
  private groupCenter = new THREE.Vector3();

  public initialize(model: THREE.Group) {
    this.initialPositions.clear();
    const box = new THREE.Box3().setFromObject(model);
    box.getCenter(this.groupCenter);

    model.traverse((child: any) => {
      // Store exact original local positions
      if (child.isMesh && !(child instanceof THREE.InstancedMesh)) {
        this.initialPositions.set(child, child.position.clone());
      }
    });
  }

  public setExplodeFactor(factor: number, model: THREE.Group) {
    if (this.initialPositions.size === 0) return;
    
    // factor is 0 to 100. We map it to 0 to 20x multiplier
    const multiplier = factor * 0.2;

    model.traverse((child: any) => {
      if (child.isMesh && !(child instanceof THREE.InstancedMesh)) {
        const initialPos = this.initialPositions.get(child);
        if (!initialPos) return;

        // Calculate vector from the assembly center outward
        const explodeDir = new THREE.Vector3().subVectors(initialPos, this.groupCenter).normalize();
        
        // Prevent singular collapse if exactly at center
        if (explodeDir.lengthSq() === 0) explodeDir.set(0, 1, 0);

        child.position.copy(initialPos).addScaledVector(explodeDir, multiplier);
      }
    });
  }
}
