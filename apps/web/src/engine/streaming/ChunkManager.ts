import { _any } from '@/types/viewer';
import * as THREE from 'three';
import { FrustumManager } from './FrustumManager';
import { MemoryManager } from './MemoryManager';
import { LODManager } from './LODManager';
import { ChunkLoader } from './ChunkLoader';

export interface ChunkManifest {
  id: string;
  bounds: number[][];
  instances: number;
}

export interface StreamingManifest {
  modelId: string;
  rootBounds: number[][];
  chunks: ChunkManifest[];
  format: string;
}

export class ChunkManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  
  public manifest: StreamingManifest | null = null;
  private basePath: string = '';
  
  private frustumManager = new FrustumManager();
  private memoryManager = new MemoryManager();
  private lodManager = new LODManager();
  private loader = new ChunkLoader();

  public activeMeshes: Map<string, { group: THREE.Group, lod: string }> = new Map();
  private loadingStates: Map<string, boolean> = new Map();

  // Callbacks for global optimizations (Clipping, Instancing)
  public onChunkLoaded?: (_group: THREE.Group) => void;
  public onMetricsUpdate?: (_metrics: _any) => void;

  public metrics = { loaded: 0, loading: 0, visible: 0, lod0: 0, lod1: 0, lod2: 0 };

  private rootGroup: THREE.Group;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);
  }

  public initialize(manifest: StreamingManifest, basePath: string) {
    this.manifest = manifest;
    this.basePath = basePath;
  }

  public setLODThresholds(lod0: number, lod1: number) {
    this.lodManager.setThresholds(lod0, lod1);
  }

  private updateFrameCounter = 0;

  public update() {
    if (!this.manifest) return;
    this.updateFrameCounter++;
    if (this.updateFrameCounter % 10 !== 0) return;

    this.frustumManager.update(this.camera);

    const visibleChunks: string[] = [];
    let lod0 = 0, lod1 = 0, lod2 = 0;

    for (const chunk of this.manifest.chunks) {
      const isVisible = this.frustumManager.isBoxVisible(chunk.bounds[0], chunk.bounds[1]);
      
      if (isVisible) {
        visibleChunks.push(chunk.id);
        const distance = this.frustumManager.getDistanceToBox(this.camera, chunk.bounds[0], chunk.bounds[1]);
        const targetLOD = this.lodManager.determineLOD(distance);
        
        if (targetLOD === 'LOD0') lod0++;
        if (targetLOD === 'LOD1') lod1++;
        if (targetLOD === 'LOD2') lod2++;

        this.requestChunk(chunk.id, targetLOD);
      }
    }

    // Run GPU Eviction to protect browser memory
    const toEvict = this.memoryManager.getEvictionCandidates(visibleChunks);
    for (const id of toEvict) {
      this.evictChunk(id);
    }

    this.metrics = {
      loaded: this.activeMeshes.size,
      loading: this.loadingStates.size,
      visible: visibleChunks.length,
      lod0, lod1, lod2
    };
    
    if (this.onMetricsUpdate) this.onMetricsUpdate(this.metrics);
  }

  private async requestChunk(chunkId: string, lod: string) {
    const cacheKey = `${chunkId}_${lod}`;
    
    // Check if the correct LOD is already physically loaded
    if (this.activeMeshes.has(chunkId) && this.activeMeshes.get(chunkId)!.lod === lod) {
      this.memoryManager.markUsed(chunkId);
      return;
    }

    // Prevent duplicate network calls
    if (this.loadingStates.has(cacheKey)) return;

    this.loadingStates.set(cacheKey, true);
    
    try {
      const url = `${this.basePath}/${chunkId}_${lod}.glb`;
      const group = await this.loader.loadChunk(url);
      
      // If a different LOD of this exact chunk exists, hotswap it cleanly
      if (this.activeMeshes.has(chunkId)) {
        const old = this.activeMeshes.get(chunkId)!;
        this.rootGroup.remove(old.group);
        this.disposeGroup(old.group);
      }

      // Execute global integrations (Instancing, Clipping, BVH)
      if (this.onChunkLoaded) this.onChunkLoaded(group);

      this.rootGroup.add(group);
      this.activeMeshes.set(chunkId, { group, lod });
      this.memoryManager.markUsed(chunkId);

    } catch (e) {
      // Chunk might not have geometries for this LOD
      console.warn(`[Streaming] Skipped empty chunk/LOD or errored: ${cacheKey}`);
      console.error(e);
    } finally {
      this.loadingStates.delete(cacheKey);
    }
  }

  private evictChunk(chunkId: string) {
    const data = this.activeMeshes.get(chunkId);
    if (data) {
      this.rootGroup.remove(data.group);
      this.disposeGroup(data.group);
      this.activeMeshes.delete(chunkId);
      this.memoryManager.remove(chunkId);
    }
  }

  private disposeGroup(group: THREE.Group) {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mesh = child;
        const geom = mesh.geometry as THREE.BufferGeometry & { disposeBoundsTree?: () => void };
        if (geom.disposeBoundsTree) geom.disposeBoundsTree();
        mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) mesh.material.dispose();
        else if (Array.isArray(mesh.material)) mesh.material.forEach((m: THREE.Material) => m.dispose());
      }
    });
  }

  public getRootGroup(): THREE.Group {
      return this.rootGroup;
  }

  public dispose() {
    for (const id of Array.from(this.activeMeshes.keys())) {
      this.evictChunk(id);
    }
  }
}
