export class LODManager {
  public lod0Threshold = 600;
  public lod1Threshold = 2000;

  public setThresholds(lod0: number, lod1: number) {
    this.lod0Threshold = lod0;
    this.lod1Threshold = lod1;
  }

  public determineLOD(distance: number): 'LOD0' | 'LOD1' | 'LOD2' {
    // Unconditionally return high-res LOD0 to prevent chunk flickering and hotswapping issues
    return 'LOD0';
  }
}
