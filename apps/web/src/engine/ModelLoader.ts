import { _any } from '@/types/viewer';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ChunkManager, StreamingManifest } from './streaming/ChunkManager';
import { apiClient } from '@/lib/apiClient';
import { ClippingManager } from './tools/ClippingManager';
import { ExplodeManager } from './tools/ExplodeManager';
import { LOD_THRESHOLDS, CAMERA_FITTING } from '@/constants/viewer';

export class ModelLoader {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private clippingManager?: ClippingManager;
  private explodeManager?: ExplodeManager;
  
  // Streaming Subsystem
  public chunkManager: ChunkManager;
  public onStreamingMetrics?: (_metrics: _any) => void;
  private lastBox: THREE.Box3 | null = null;
  public onFitToView?: (box: THREE.Box3) => void;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, controls: OrbitControls, clipping?: ClippingManager, explode?: ExplodeManager) {
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

        group.traverse((child) => {
            const mesh = child as THREE.Mesh & { geometry: { computeBoundsTree?: () => void } };
            if (mesh.isMesh) {
                mesh.userData.nodeId = mesh.name;
                mesh.frustumCulled = true; 
                if (mesh.geometry && mesh.geometry.computeBoundsTree) mesh.geometry.computeBoundsTree();
                if (this.clippingManager && mesh.material) {
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach((mat) => this.clippingManager!.applyToMaterial(mat));
                    } else {
                        this.clippingManager.applyToMaterial(mesh.material);
                    }
                }
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

  public async loadFromManifest(manifestUrl: string, onProgress?: (_progress: number) => void): Promise<void> {
    try {
        if (onProgress) onProgress(10);
        
        const isManifest = manifestUrl.includes('manifest.json') || manifestUrl.split('?')[0].endsWith('.json');
        
        if (!isManifest) {
            // Fallback for legacy GLBs
            console.warn("Legacy GLB loaded. Streaming disabled.");
            return;
        }

        const res = await apiClient.get(manifestUrl);
        const manifest: StreamingManifest = res.data;
        
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
        const maxDim = Math.max(size.x, size.y, size.z) || LOD_THRESHOLDS.DEFAULT_MAX_DIM;
        this.chunkManager.setLODThresholds(maxDim * LOD_THRESHOLDS.NEAR_MULTIPLIER, maxDim * LOD_THRESHOLDS.FAR_MULTIPLIER);

        this.lastBox = box;
        this.fitCameraToBox(box);
        
        // Force immediate first update
        this.chunkManager.update();

        if (onProgress) onProgress(100);

        let autoFitAttempts = 0;
        const intervalId = setInterval(() => {
            const currentBox = new THREE.Box3();
            currentBox.setFromObject(this.chunkManager.getRootGroup());
            
            const isValidBox = !currentBox.isEmpty() && 
                               isFinite(currentBox.min.x) && isFinite(currentBox.min.y) && isFinite(currentBox.min.z) &&
                               isFinite(currentBox.max.x) && isFinite(currentBox.max.y) && isFinite(currentBox.max.z);
            
            autoFitAttempts++;
            if (isValidBox || autoFitAttempts > 12) {
                this.fitToView();
                for (let i = 0; i < 11; i++) {
                    this.chunkManager.update();
                }
                clearInterval(intervalId);
            }
        }, 500);



    } catch(err) {
        console.error("Failed to load streaming manifest", err);
        throw err;
    }
  }

  private optimizeToInstancedMeshes(group: THREE.Group) {
      const geometryMap = new Map<string, { geometry: THREE.BufferGeometry, material: THREE.Material, instances: { matrix: THREE.Matrix4, nodeId: string, mesh?: THREE.Mesh }[] }>();

      group.traverse((child) => {
          if (child instanceof THREE.Mesh && !(child instanceof THREE.InstancedMesh)) {
              const mesh = child;
              if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
              const posCount = mesh.geometry.attributes.position ? mesh.geometry.attributes.position.count : 0;
              const radius = mesh.geometry.boundingSphere ? mesh.geometry.boundingSphere.radius.toFixed(4) : '0';
              const hash = `${posCount}_${radius}`;
              
              if (!geometryMap.has(hash)) geometryMap.set(hash, { geometry: mesh.geometry, material: mesh.material as THREE.Material, instances: [] });
              
              const worldMatrix = new THREE.Matrix4();
              mesh.updateWorldMatrix(true, false);
              worldMatrix.copy(mesh.matrixWorld);
              
              geometryMap.get(hash)!.instances.push({ matrix: worldMatrix, nodeId: mesh.name, mesh: mesh });
          }
      });

      geometryMap.forEach((data, _hash) => {
          if (data.instances.length > 1) {
              data.instances.forEach(inst => {
                  if (inst.mesh) inst.mesh.visible = false;
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
                  if (inst.mesh) inst.mesh.visible = true;
              });
          }
      });
  }

  private fitCameraToBox(box: THREE.Box3) {
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = Math.max(1000, maxDim * 4);
    
    this.controls.panSpeed = 1.0;
    this.controls.zoomSpeed = 1.2;

    const fov = this.camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * CAMERA_FITTING.CAMERA_Z_MULTIPLIER;
    
    this.camera.position.set(
        center.x + cameraZ * CAMERA_FITTING.CAMERA_POS_OFFSET,
        center.y + cameraZ * CAMERA_FITTING.CAMERA_POS_OFFSET,
        center.z + cameraZ
    );
    
    this.camera.lookAt(center);
    this.controls.target.copy(center);
    this.controls.update();
  }

  public fitToView() {
    const box = new THREE.Box3();
    const modelGroup = this.chunkManager.getRootGroup();
    
    try {
        box.setFromObject(modelGroup);
    } catch (err) {
        console.warn("Could not compute box from scene object", err);
    }

    const isValidBox = !box.isEmpty() && 
                       isFinite(box.min.x) && isFinite(box.min.y) && isFinite(box.min.z) &&
                       isFinite(box.max.x) && isFinite(box.max.y) && isFinite(box.max.z);

    if (!isValidBox && this.lastBox) {
        box.copy(this.lastBox);
    } else if (!isValidBox) {
        box.set(new THREE.Vector3(-100, -100, -100), new THREE.Vector3(100, 100, 100));
    }

    if (this.onFitToView) {
        this.onFitToView(box);
    }

    this.fitCameraToBox(box);
    for (let i = 0; i < 11; i++) {
        this.chunkManager.update();
    }
  }




  public dispose() {
    this.chunkManager.dispose();
  }
}
