export class LODManager {
  // Configurable thresholds for geometric switching
  public lod0Threshold = 600; // Close distance
  public lod1Threshold = 2000; // Medium distance

  public setThresholds(lod0: number, lod1: number) {
    this.lod0Threshold = lod0;
    this.lod1Threshold = lod1;
  }

  public determineLOD(distance: number): 'LOD0' | 'LOD1' | 'LOD2' {
    if (distance < this.lod0Threshold) return 'LOD0';
    if (distance < this.lod1Threshold) return 'LOD1';
    return 'LOD2';
  }
}
