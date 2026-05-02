import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';
import { ModelLoader } from './ModelLoader';
import { ClippingManager } from './tools/ClippingManager';
import { ExplodeManager } from './tools/ExplodeManager';
import { MeasurementManager } from './tools/MeasurementManager';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

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
  private onMouseMove: (e: MouseEvent) => void = () => { };
  private onWheel: (e: WheelEvent) => void = () => { };

  public onNodeSelected?: (nodeId: string | null) => void;
  public onMeasurementComplete?: (dist: number, p1: number[], p2: number[]) => void;

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
    this.scene.background = new THREE.Color(0x090d16);

    const gridHelper = new THREE.GridHelper(200, 50, 0x312e81, 0x1e1b4b);
    gridHelper.position.y = -10;
    this.scene.add(gridHelper);

    const width = container.clientWidth;
    const height = container.clientHeight;
    console.log(`[ThreeEngine] Container dimensions measured: ${width}x${height}`);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100000);
    this.camera.position.set(50, 50, 50);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance", stencil: false, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    container.appendChild(this.renderer.domElement);
    console.log('[ThreeEngine] WebGL renderer appended to DOM element');

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = true;
    this.controls.rotateSpeed = 1.0;
    this.controls.panSpeed = 1.2;
    this.controls.zoomSpeed = 1.5;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 1000;
    this.controls.maxPolarAngle = Math.PI - 0.01;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
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
      color: 0xffaa00, emissive: 0x332200, roughness: 0.2, metalness: 0.8,
      depthTest: false, transparent: true, opacity: 0.95
    });

    // Isolation "ghost" material
    this.isolateMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc, transparent: true, opacity: 0.1, depthWrite: false
    });

    this.onMouseMove = (event: MouseEvent) => {
      if (!this.container) return;
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);

    this.onWheel = (event: WheelEvent) => {
      if (!this.modelLoader.currentModel) return;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObject(this.modelLoader.currentModel, true).filter(
        i => i.object.visible && (i.object as any).material !== this.isolateMaterial
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
    const intersects = this.raycaster.intersectObject(this.modelLoader.currentModel, true).filter(i => i.object.visible && (i.object as any).material !== this.isolateMaterial);

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
        let mesh = intersects[0].object as THREE.Mesh | THREE.InstancedMesh;
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
    this.modelLoader.currentModel.traverse((child: any) => {
      if (child.isMesh && !(child instanceof THREE.InstancedMesh) && child.userData.nodeId === nodeId) {
        this.selectedMesh = child;
        this.originalMaterial = child.material;
        child.material = this.highlightMaterial;
        this.clipping.applyToMaterial(child.material);
      }
    });
  }

  public setHiddenNodes(hiddenIds: string[]) {
    if (!this.modelLoader.currentModel) return;
    // Visbility Culling: Turning off visible=false skips frustum tests completely for those subtrees.
    this.modelLoader.currentModel.traverse((child: any) => {
      if (child.isMesh && !(child instanceof THREE.InstancedMesh) && child.userData.nodeId) {
        child.visible = !hiddenIds.includes(child.userData.nodeId);
      }
    });
  }

  public setIsolatedNodes(isolatedIds: string[]) {
    if (!this.modelLoader.currentModel) return;

    // Reset to normal if no isolated nodes
    if (isolatedIds.length === 0) {
      this.modelLoader.currentModel.traverse((child: any) => {
        if (child.isMesh && !(child instanceof THREE.InstancedMesh) && child.userData.originalMaterial) {
          child.material = child.userData.originalMaterial;
        }
      });
      return;
    }

    // Ghost non-isolated branches
    this.modelLoader.currentModel.traverse((child: any) => {
      if (child.isMesh && !(child instanceof THREE.InstancedMesh)) {
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material;
        }
        if (isolatedIds.includes(child.userData.nodeId)) {
          child.material = child.userData.originalMaterial;
        } else {
          child.material = this.isolateMaterial;
        }
        this.clipping.applyToMaterial(child.material);
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

  public dispose() {
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.domElement.removeEventListener('click', this.onClick);
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.removeEventListener('wheel', this.onWheel);
    cancelAnimationFrame(this.animationId);

    this.modelLoader.dispose();

    this.scene.traverse((object: any) => {
      if (!object.isMesh) return;
      const mesh = object as THREE.Mesh;
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
