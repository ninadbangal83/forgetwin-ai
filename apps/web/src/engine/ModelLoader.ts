import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ChunkManager, StreamingManifest } from './streaming/ChunkManager';

export class ModelLoader {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private clippingManager: any;
  private explodeManager: any;
  
  // Streaming Subsystem
  public chunkManager: ChunkManager;
  public onStreamingMetrics?: (metrics: any) => void;
  private lastBox: THREE.Box3 | null = null;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, controls: OrbitControls, clipping?: any, explode?: any) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.clippingManager = clipping;
    this.explodeManager = explode;
    
    this.chunkManager = new ChunkManager(scene, camera);
    
    this.chunkManager.onMetricsUpdate = (metrics) => {
        if (this.onStreamingMetrics) this.onStreamingMetrics(metrics);
    };

    // Callback fired every time a chunk streams in
    this.chunkManager.onChunkLoaded = (group) => {
        group.updateMatrixWorld(true);

        group.traverse((child: any) => {
            if (child.isMesh) {
                child.userData.nodeId = child.name;
                child.frustumCulled = true; 
                if (child.geometry.computeBoundsTree) child.geometry.computeBoundsTree();
                if (this.clippingManager) this.clippingManager.applyToMaterial(child.material);
            }
        });

        // Re-execute Explode Cache dynamically
        if (this.explodeManager) this.explodeManager.initialize(group);
        
        // Execute Instancing dynamically on the new chunk
        this.optimizeToInstancedMeshes(group);
    };
  }

  // Returns a virtual root group representing all streamed chunks for raycasting/selection
  get currentModel(): THREE.Group {
      return this.chunkManager.getRootGroup();
  }

  public async loadFromManifest(manifestUrl: string, onProgress?: (progress: number) => void): Promise<void> {
    try {
        if (onProgress) onProgress(10);
        
        const isManifest = manifestUrl.includes('manifest.json') || manifestUrl.split('?')[0].endsWith('.json');
        
        if (!isManifest) {
            // Fallback for legacy GLBs
            console.warn("Legacy GLB loaded. Streaming disabled.");
            return;
        }

        const res = await fetch(manifestUrl);
        const manifest: StreamingManifest = await res.json();
        
        if (onProgress) onProgress(50);

        const urlObj = new URL(manifestUrl);
        const basePath = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/'));
        this.chunkManager.initialize(manifest, basePath);
        
        // Setup initial camera bounds
        const rootBounds = manifest.rootBounds;
        const box = new THREE.Box3(
            new THREE.Vector3(rootBounds[0][0], rootBounds[0][1], rootBounds[0][2]),
            new THREE.Vector3(rootBounds[1][0], rootBounds[1][1], rootBounds[1][2])
        );
        
        // Dynamic LOD threshold scaling based on the model's dimensions
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1000;
        this.chunkManager.setLODThresholds(maxDim * 0.8, maxDim * 2.5);

        this.lastBox = box;
        this.fitCameraToBox(box);
        
        // Force immediate first update
        this.chunkManager.update();

        if (onProgress) onProgress(100);

    } catch(err) {
        console.error("Failed to load streaming manifest", err);
        throw err;
    }
  }

  private optimizeToInstancedMeshes(group: THREE.Group) {
      const geometryMap = new Map<string, { geometry: THREE.BufferGeometry, material: THREE.Material, instances: { matrix: THREE.Matrix4, nodeId: string, mesh?: any }[] }>();

      group.traverse((child: any) => {
          if (child.isMesh && !(child instanceof THREE.InstancedMesh)) {
              if (!child.geometry.boundingSphere) child.geometry.computeBoundingSphere();
              const posCount = child.geometry.attributes.position ? child.geometry.attributes.position.count : 0;
              const radius = child.geometry.boundingSphere ? child.geometry.boundingSphere.radius.toFixed(4) : '0';
              const hash = `${posCount}_${radius}`;
              
              if (!geometryMap.has(hash)) geometryMap.set(hash, { geometry: child.geometry, material: child.material, instances: [] });
              
              const worldMatrix = new THREE.Matrix4();
              child.updateWorldMatrix(true, false);
              worldMatrix.copy(child.matrixWorld);
              
              geometryMap.get(hash)!.instances.push({ matrix: worldMatrix, nodeId: child.name, mesh: child });
          }
      });

      geometryMap.forEach((data, hash) => {
          if (data.instances.length > 5) {
              data.instances.forEach(inst => {
                  if ((inst as any).mesh) (inst as any).mesh.visible = false;
              });
              const instancedMesh = new THREE.InstancedMesh(data.geometry, data.material, data.instances.length);
              instancedMesh.userData.instanceNodeIds = [];
              
              data.instances.forEach((inst, index) => {
                  instancedMesh.setMatrixAt(index, inst.matrix);
                  instancedMesh.userData.instanceNodeIds.push(inst.nodeId);
              });
              
              instancedMesh.instanceMatrix.needsUpdate = true;
              instancedMesh.castShadow = false; instancedMesh.receiveShadow = false;
              instancedMesh.frustumCulled = false; 
              
              if (this.clippingManager) this.clippingManager.applyToMaterial(instancedMesh.material);
              
              group.add(instancedMesh);
          } else {
              data.instances.forEach(inst => {
                  if ((inst as any).mesh) (inst as any).mesh.visible = true;
              });
          }
      });
  }

  private fitCameraToBox(box: THREE.Box3) {
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Dynamically adjust control pan and zoom speeds based on model's size
    this.controls.panSpeed = Math.max(1.2, maxDim / 100);
    this.controls.zoomSpeed = Math.max(1.5, maxDim / 50);

    const fov = this.camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
    
    this.camera.position.set(center.x + cameraZ * 0.7, center.y + cameraZ * 0.7, center.z + cameraZ);
    this.camera.lookAt(center);
    this.controls.target.copy(center);
    this.controls.update();
  }

  public fitToView() {
    if (this.lastBox) {
      this.fitCameraToBox(this.lastBox);
    }
  }

  public dispose() {
    this.chunkManager.dispose();
  }
}
