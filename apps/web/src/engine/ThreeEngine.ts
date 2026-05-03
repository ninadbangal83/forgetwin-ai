import { _any } from '@/types/viewer';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';
import { ModelLoader } from './ModelLoader';
import { ClippingManager } from './tools/ClippingManager';
import { ExplodeManager } from './tools/ExplodeManager';
import { MeasurementManager } from './tools/MeasurementManager';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { VIEWER_COLORS, VIEWER_CAMERA, VIEWER_CONTROLS, VIEWER_LIGHTING } from '@/constants/viewer';

// Inject BVH globally to massively accelerate raycasting on millions of polygons
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export class ThreeEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  public modelLoader: ModelLoader;
  public stats: Stats;

  public clipping: ClippingManager;
  public explode: ExplodeManager;
  public measurement: MeasurementManager;

  private activeTool: 'select' | 'measure' | 'clip' | 'explode' = 'select';
  private container: HTMLElement;
  private animationId: number = 0;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private highlightMaterial: THREE.MeshStandardMaterial;
  private isolateMaterial: THREE.MeshStandardMaterial;
  private selectedMesh: THREE.Mesh | null = null;
  private originalMaterial: THREE.Material | null = null;
  private onMouseMove: (_e: MouseEvent) => void = () => { };
  private onWheel: (_e: WheelEvent) => void = () => { };

  public onNodeSelected?: (_nodeId: string | null) => void;
  public onMeasurementComplete?: (_dist: number, _p1: number[], _p2: number[]) => void;

  constructor(container: HTMLElement) {
    console.log('[ThreeEngine] Initializing WebGL instance and attaching container...');
    this.container = container;

    this.stats = new Stats();
    this.stats.dom.style.position = 'absolute';
    this.stats.dom.style.top = '10px';
    this.stats.dom.style.left = '10px';
    this.stats.dom.style.zIndex = '100';
    container.appendChild(this.stats.dom);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(VIEWER_COLORS.BACKGROUND);

    const gridHelper = new THREE.GridHelper(200, 50, VIEWER_COLORS.GRID_MAJOR, VIEWER_COLORS.GRID_MINOR);
    gridHelper.position.y = -10;
    this.scene.add(gridHelper);

    const width = container.clientWidth;
    const height = container.clientHeight;
    console.log(`[ThreeEngine] Container dimensions measured: ${width}x${height}`);

    this.camera = new THREE.PerspectiveCamera(VIEWER_CAMERA.FOV, width / height, VIEWER_CAMERA.NEAR, VIEWER_CAMERA.FAR);
    this.camera.position.set(VIEWER_CAMERA.DEFAULT_POS.x, VIEWER_CAMERA.DEFAULT_POS.y, VIEWER_CAMERA.DEFAULT_POS.z);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance", stencil: false, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    container.appendChild(this.renderer.domElement);
    console.log('[ThreeEngine] WebGL renderer appended to DOM element');

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = VIEWER_CONTROLS.DAMPING_FACTOR;
    this.controls.screenSpacePanning = true;
    this.controls.rotateSpeed = VIEWER_CONTROLS.ROTATE_SPEED;
    this.controls.panSpeed = VIEWER_CONTROLS.PAN_SPEED;
    this.controls.zoomSpeed = VIEWER_CONTROLS.ZOOM_SPEED;
    this.controls.minDistance = VIEWER_CONTROLS.MIN_DISTANCE;
    this.controls.maxDistance = VIEWER_CONTROLS.MAX_DISTANCE;
    this.controls.maxPolarAngle = Math.PI - 0.01;

    const ambientLight = new THREE.AmbientLight(VIEWER_COLORS.LIGHT_DEFAULT, VIEWER_LIGHTING.AMBIENT_INTENSITY);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(VIEWER_COLORS.LIGHT_DEFAULT, VIEWER_LIGHTING.DIRECTIONAL_INTENSITY);
    directionalLight.position.set(100, 200, 100);
    this.scene.add(directionalLight);

    // Initialize Engineering Tools
    this.clipping = new ClippingManager(this.renderer, this.scene);
    this.explode = new ExplodeManager();
    this.measurement = new MeasurementManager(this.scene);

    this.modelLoader = new ModelLoader(this.scene, this.camera, this.controls, this.clipping, this.explode);

    this.raycaster = new THREE.Raycaster();
    this.raycaster.firstHitOnly = true; // BVH extreme optimization
    this.mouse = new THREE.Vector2();

    this.highlightMaterial = new THREE.MeshStandardMaterial({
      color: VIEWER_COLORS.HIGHLIGHT, emissive: VIEWER_COLORS.HIGHLIGHT_EMISSIVE, roughness: 0.2, metalness: 0.8,
      depthTest: false, transparent: true, opacity: 0.95
    });

    // Isolation "ghost" material
    this.isolateMaterial = new THREE.MeshStandardMaterial({
      color: VIEWER_COLORS.ISOLATE, transparent: true, opacity: 0.1, depthWrite: false
    });

    this.onMouseMove = (event: MouseEvent) => {
      if (!this.container) return;
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);

    this.onWheel = (_event: WheelEvent) => {
      if (!this.modelLoader.currentModel) return;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObject(this.modelLoader.currentModel, true).filter(
        i => i.object.visible && (i.object as unknown as THREE.Mesh).material !== this.isolateMaterial
      );
      if (intersects.length > 0) {
        const hitPoint = intersects[0].point;
        // Shift camera focus smoothly towards the point under the mouse
        this.controls.target.lerp(hitPoint, 0.05);
      }
    };
    this.renderer.domElement.addEventListener('wheel', this.onWheel, { passive: true });

    window.addEventListener('resize', this.onWindowResize);
    this.renderer.domElement.addEventListener('click', this.onClick);

    console.log('[ThreeEngine] Successfully completed constructor initialization, launching animation tick.');
    this.animate();
  }

  public setActiveTool(tool: 'select' | 'measure' | 'clip' | 'explode') {
    this.activeTool = tool;
    if (tool !== 'measure') {
      this.measurement.clear();
    }
  }

  public home() {
    this.modelLoader.fitToView();
  }

  public setOrbitMode() {
    this.controls.enableRotate = true;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    this.controls.update();
  }

  public setPanMode() {
    this.controls.enableRotate = false;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    this.controls.update();
  }

  public setWalkMode() {
    this.controls.enableRotate = true;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.dampingFactor = 0.2;
    this.controls.screenSpacePanning = true;
    this.controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    this.controls.update();
  }

  public setZoomMode() {
    this.controls.enableRotate = false;
    this.controls.enablePan = false;
    this.controls.enableZoom = true;
    this.controls.mouseButtons.LEFT = THREE.MOUSE.DOLLY;
    this.controls.update();
  }

  public fitToView() {
    this.modelLoader.fitToView();
  }

  private onClick = (event: MouseEvent) => {
    if (!this.container || !this.modelLoader.currentModel) return;

    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    // Ignore invisible/ghosted objects during raycasting interaction
    const intersects = this.raycaster.intersectObject(this.modelLoader.currentModel, true).filter(i => i.object.visible && (i.object as unknown as THREE.Mesh).material !== this.isolateMaterial);

    if (intersects.length > 0) {
      if (this.activeTool === 'measure') {
        const pt = intersects[0].point;
        const res = this.measurement.addPoint(pt);
        if (res && this.onMeasurementComplete) {
          this.onMeasurementComplete(res.distance!, res.p1, res.p2);
        }
        return;
      }

      if (this.activeTool === 'select' || this.activeTool === 'clip') {
        const mesh = intersects[0].object as THREE.Mesh | THREE.InstancedMesh;
        let nodeId = mesh.userData.nodeId;
        if (mesh instanceof THREE.InstancedMesh && intersects[0].instanceId !== undefined) {
          nodeId = mesh.userData.instanceNodeIds[intersects[0].instanceId];
        }
        if (nodeId && this.onNodeSelected) {
          this.onNodeSelected(nodeId);
        }
      }
    } else {
      if (this.onNodeSelected && this.activeTool === 'select') this.onNodeSelected(null);
    }
  };

  public selectNode(nodeId: string | null) {
    if (this.selectedMesh && this.originalMaterial) {
      this.selectedMesh.material = this.originalMaterial;
      this.selectedMesh = null;
      this.originalMaterial = null;
    }
    if (!nodeId || !this.modelLoader.currentModel) return;
    this.modelLoader.currentModel.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && !(mesh instanceof THREE.InstancedMesh) && mesh.userData.nodeId === nodeId) {
        this.selectedMesh = mesh;
        this.originalMaterial = mesh.material as THREE.Material;
        mesh.material = this.highlightMaterial;
        this.clipping.applyToMaterial(mesh.material);
      }
    });
  }

  public setHiddenNodes(hiddenIds: string[]) {
    if (!this.modelLoader.currentModel) return;
    // Visbility Culling: Turning off visible=false skips frustum tests completely for those subtrees.
    this.modelLoader.currentModel.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && !(mesh instanceof THREE.InstancedMesh) && mesh.userData.nodeId) {
        mesh.visible = !hiddenIds.includes(mesh.userData.nodeId as string);
      }
    });
  }

  public setIsolatedNodes(isolatedIds: string[]) {
    if (!this.modelLoader.currentModel) return;

    // Reset to normal if no isolated nodes
    if (isolatedIds.length === 0) {
      this.modelLoader.currentModel.traverse((child: THREE.Object3D) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && !(mesh instanceof THREE.InstancedMesh) && mesh.userData.originalMaterial) {
          mesh.material = mesh.userData.originalMaterial as THREE.Material;
        }
      });
      return;
    }

    // Ghost non-isolated branches
    this.modelLoader.currentModel.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && !(mesh instanceof THREE.InstancedMesh)) {
        if (!mesh.userData.originalMaterial) {
          mesh.userData.originalMaterial = mesh.material;
        }
        if (isolatedIds.includes(mesh.userData.nodeId as string)) {
          mesh.material = mesh.userData.originalMaterial as THREE.Material;
        } else {
          mesh.material = this.isolateMaterial;
        }
        this.clipping.applyToMaterial(mesh.material);
      }
    });
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    this.stats.begin();
    this.controls.update();

    // Core Streaming Engine Tick
    if (this.modelLoader.chunkManager) {
      this.modelLoader.chunkManager.update();
    }

    this.renderer.render(this.scene, this.camera);
    this.renderer.info.reset();
    this.stats.end();
  };

  private annotationMarkers: THREE.Mesh[] = [];

  public addAnnotationMarker(id: string, position: { x: number, y: number, z: number }, note: string) {
    const geom = new THREE.SphereGeometry(2, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0xaa0033,
      roughness: 0.1,
    });
    const sphere = new THREE.Mesh(geom, mat);
    sphere.position.set(position.x, position.y, position.z);
    sphere.userData = { id, note, type: 'annotation' };
    this.scene.add(sphere);
    this.annotationMarkers.push(sphere);
  }

  public clearAnnotationMarkers() {
    this.annotationMarkers.forEach(m => {
      this.scene.remove(m);
      m.geometry.dispose();
      if (m.material instanceof THREE.Material) m.material.dispose();
    });
    this.annotationMarkers = [];
  }

  public restoreSnapshot(snapshot: any) {
    if (!snapshot) return;

    this.clearAnnotationMarkers();
    this.measurement.clear();

    if (snapshot.camera) {
      this.camera.position.set(snapshot.camera.x, snapshot.camera.y, snapshot.camera.z);
    }
    if (snapshot.orbitTarget) {
      this.controls.target.set(snapshot.orbitTarget.x, snapshot.orbitTarget.y, snapshot.orbitTarget.z);
    }
    this.controls.update();

    if (snapshot.hiddenNodeIds) {
      this.setHiddenNodes(snapshot.hiddenNodeIds);
    }

    if (snapshot.isolatedNodeIds) {
      this.setIsolatedNodes(snapshot.isolatedNodeIds);
    }

    if (typeof snapshot.explodeFactor === 'number') {
      this.explode.setExplodeFactor(snapshot.explodeFactor, this.modelLoader.currentModel);
    }

    if (snapshot.clipPlanes) {
      this.clipping.setPlanes(snapshot.clipPlanes.x, snapshot.clipPlanes.y, snapshot.clipPlanes.z);
      this.clipping.setEnabled(snapshot.clipPlanes.enabled);
    }

    if (snapshot.measurements) {
      this.measurement.restoreMeasurements(snapshot.measurements);
    }
  }

  public highlightDiff(diff: { addedParts: any[], removedParts: any[], modifiedParts: any[] }) {
    if (!this.modelLoader.currentModel) return;

    const addedIds = (diff.addedParts || []).map(p => p.id);
    const removedIds = (diff.removedParts || []).map(p => p.id);
    const modifiedIds = (diff.modifiedParts || []).map(p => p.id);

    const addMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x005500 });
    const remMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x550000 });
    const modMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0x555500 });

    this.modelLoader.currentModel.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && !(mesh instanceof THREE.InstancedMesh)) {
        const nid = mesh.userData.nodeId;
        if (addedIds.includes(nid)) {
          mesh.material = addMat;
        } else if (removedIds.includes(nid)) {
          mesh.material = remMat;
        } else if (modifiedIds.includes(nid)) {
          mesh.material = modMat;
        }
      }
    });
  }

  public dispose() {

    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.domElement.removeEventListener('click', this.onClick);
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.removeEventListener('wheel', this.onWheel);
    cancelAnimationFrame(this.animationId);

    this.modelLoader.dispose();

    this.scene.traverse((object: THREE.Object3D) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) mesh.material.dispose();
      else if (Array.isArray(mesh.material)) mesh.material.forEach(mat => mat.dispose());
    });

    this.highlightMaterial.dispose();
    this.isolateMaterial.dispose();
    this.renderer.dispose();
    this.controls.dispose();
    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
