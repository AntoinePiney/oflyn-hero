/**
 * 
 * 
 ▒█████    █████▒██▓   ▓██   ██▓ ███▄    █ 
▒██▒  ██▒▓██   ▒▓██▒    ▒██  ██▒ ██ ▀█   █ 
▒██░  ██▒▒████ ░▒██░     ▒██ ██░▓██  ▀█ ██▒
▒██   ██░░▓█▒  ░▒██░     ░ ▐██▓░▓██▒  ▐▌██▒
░ ████▓▒░░▒█░   ░██████▒ ░ ██▒▓░▒██░   ▓██░
░ ▒░▒░▒░  ▒ ░   ░ ▒░▓  ░  ██▒▒▒ ░ ▒░   ▒ ▒ 
  ░ ▒ ▒░  ░     ░ ░ ▒  ░▓██ ░▒░ ░ ░░   ░ ▒░
░ ░ ░ ▒   ░ ░     ░ ░   ▒ ▒ ░░     ░   ░ ░ 
    ░ ░             ░  ░░ ░              ░ 
                        ░ ░                
 * 
 * 
 */

/**
 * =========================================
 * THREE.JS CORE DEPENDENCIES
 * =========================================
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

/**
 * =========================================
 * SCENE OPTIMIZATIONS & LOADERS
 * =========================================
 */
import OptimizedModelLoader from "./utils/OptimizedModelLoader";

/**
 * =========================================
 * SCENE SETUP & ENVIRONMENT
 * =========================================
 */
import { SceneLights } from "./components/scene/Lights";
import { setupCamera } from "./components/scene/Camera";
import { setupPostProcessing } from "./components/scene/PostProcessing";

/**
 * =========================================
 * SCENE OBJECTS & EFFECTS
 * =========================================
 */
import { createBanc } from "./components/objects/Banc";
import { createMirror } from "./components/objects/Mirror";
import { createGround } from "./components/objects/Ground";
import { createVideoPlane } from "./components/objects/VideoPlane";
import { createWall } from "./components/objects/Wall";
import { createCables } from "./components/objects/Cables";
import { createCableEffect } from "./components/effects/CableEffect";

/**
 * =========================================
 * OPTINAL COMPONENTS
 * =========================================
 */

import Konami from "./components/konami/Konami";

/**
 * =========================================
 * SCENE MANAGER
 * =========================================
 * Main class to handle 3D scene management
 */
export class SceneManager {
  constructor() {
    // Ajouter un cache pour les ressources
    this.resourceCache = new Map();
    // Ajouter un système de gestion des ressources
    this.disposables = new Set();
    // État de base
    this.state = {
      isLoading: false,
      loadingProgress: 0,
      isOrbitControlEnabled: true,
      error: null,
    };

    // Initialisation
    this.init();
    this.initStats();
    this.setupEventListeners();

    // Composants spéciaux
    this.cableEffect = null;
    this.konami = new Konami();

    console.log("SceneManager: Construction complete");
  }
  // Ajouter une méthode de gestion des ressources
  trackDisposable(resource) {
    if (resource && typeof resource.dispose === "function") {
      this.disposables.add(resource);
    }
    return resource;
  }

  async init() {
    try {
      // Scene setup
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000000);

      // Camera setup
      this.camera = new THREE.PerspectiveCamera(
        15,
        window.innerWidth / window.innerHeight,
        0.01,
        1000
      );
      setupCamera(this.camera);

      // Renderer setup
      this.setupRenderer();

      // Post-processing
      const postProcess = setupPostProcessing(
        this.renderer,
        this.scene,
        this.camera
      );
      this.composer = postProcess.composer;
      this.postProcessUpdate = postProcess.update;

      // Controls
      this.setupControls();

      // Lights
      this.lights = new SceneLights(this.scene);

      // Load model
      await this.loadModel();

      // Start animation loop
      this.animate();
    } catch (error) {
      console.error("Initialization error:", error);
      this.state.error = error;
    }
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.isMobile() ? false : true,
      powerPreference: "high-performance",
      alpha: false, // Désactiver si non nécessaire
      stencil: false, // Désactiver si non nécessaire
      depth: true,
    });

    // Ajouter la gestion des FPS
    this.targetFPS = this.isMobile() ? 30 : 60;
    this.frameTime = 1000 / this.targetFPS;
    this.lastFrameTime = 0;

    this.updateRendererSettings();
    document.body.appendChild(this.renderer.domElement);
  }

  updateRendererSettings() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    if (this.isMobile()) {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
    }
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.target.set(0, 0, 0);
  }

  initStats() {
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);
    this.stats.dom.style.position = "absolute";
    this.stats.dom.style.top = "0px";
    this.stats.dom.style.left = "0px";
  }

  async loadModel() {
    this.state.isLoading = true;
    const loader = OptimizedModelLoader.getInstance();

    try {
      const gltf = await loader.load("./model/model.gltf", {
        onProgress: (progress) => {
          this.state.loadingProgress = progress;
          this.updateLoadingUI(progress);
        },
        optimizationLevel: this.isMobile() ? "low" : "medium",
        useCache: true,
        maxRetries: 3,
      });

      const model = gltf.scene;
      await this.setupModelComponents(model);

      this.state.isLoading = false;
      this.hideLoadingUI();
    } catch (error) {
      console.error("Error loading model:", error);
      this.state.error = error;
      this.state.isLoading = false;
      this.showErrorUI(error);
    }
  }

  async setupModelComponents(model) {
    try {
      const [banc, mirror, ground, wall, cables] = await Promise.all([
        createBanc(model),
        createMirror(model),
        createGround(model),
        createWall(model),
        createCables(model),
      ]);

      // Create video plane with camera and controls access
      const videoPlane = createVideoPlane(model, this.camera, this.controls);

      // Add components to scene
      [banc, mirror, ground, videoPlane, wall].forEach((component) => {
        if (component) {
          this.scene.add(component);
          this.optimizeComponent(component);
        }
      });

      // Special setup for cables
      if (cables) {
        cables.renderOrder = 1;
        this.scene.add(cables);
        this.setupCableEffect(cables);
      }
    } catch (error) {
      console.error("Error setting up model components:", error);
      throw error;
    }
  }

  optimizeComponent(component) {
    if (!component) return;

    component.traverse((node) => {
      if (node.isMesh) {
        // Optimisation des géométries
        const geometry = node.geometry;
        if (geometry) {
          geometry.attributes.position.usage = THREE.StaticDrawUsage;
          if (geometry.index) geometry.index.usage = THREE.StaticDrawUsage;
        }

        // Optimisation des matériaux
        if (node.material) {
          const materials = Array.isArray(node.material)
            ? node.material
            : [node.material];
          materials.forEach((material) => {
            material.precision = this.isMobile() ? "lowp" : "mediump";
            if (material.map) {
              material.map.anisotropy = 1;
              material.map.minFilter = THREE.LinearFilter;
            }
          });
        }

        // Optimisations générales
        node.frustumCulled = true;
        node.matrixAutoUpdate = false;
        node.updateMatrix();
      }
    });
  }

  setupCableEffect(cables) {
    this.cableEffect = createCableEffect(cables, {
      color: new THREE.Color(0.0, 0.5, 1.0),
      pulseSpeed: 0.5,
      numberOfPulses: this.isMobile() ? 3 : 5,
      pulseWidth: 0.1,
      glowStrength: this.isMobile() ? 2.5 : 3.5,
      glowSpread: this.isMobile() ? 2.0 : 3.0,
    });
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    this.stats.begin();

    // Update post-processing si disponible
    if (this.postProcessUpdate) {
      this.postProcessUpdate();
    }

    // Update controls si activés
    if (this.state.isOrbitControlEnabled) {
      this.controls.update();
    }

    // Render
    this.composer.render();

    this.stats.end();
  }

  toggleOrbitControls() {
    this.state.isOrbitControlEnabled = !this.state.isOrbitControlEnabled;
    this.controls.enabled = this.state.isOrbitControlEnabled;
    console.log(
      `OrbitControls ${
        this.state.isOrbitControlEnabled ? "enabled" : "disabled"
      }`
    );
  }

  setupEventListeners() {
    // Gestion du resize
    window.addEventListener("resize", this.handleResize.bind(this));

    // Gestion du nettoyage
    window.addEventListener("beforeunload", this.cleanup.bind(this));

    // Controls toggle
    window.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === "m") {
        this.toggleOrbitControls();
      }
    });

    // Touch events pour mobile
    if (this.isMobile()) {
      this.setupTouchEvents();
    }
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Update camera
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Update composer
    this.composer.setSize(width, height);
  }

  cleanup() {
    // Remove event listeners
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("beforeunload", this.cleanup);
    window.removeEventListener("keydown", this.toggleOrbitControls);

    // Cleanup Konami
    if (this.konami) {
      this.konami.destroy();
    }

    // Cleanup effects
    if (this.cableEffect) {
      this.cableEffect.dispose();
    }

    // Dispose of scene objects
    this.scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => this.disposeMaterial(material));
        } else {
          this.disposeMaterial(object.material);
        }
      }
    });

    // Cleanup core components
    this.lights.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    if (this.composer) {
      this.composer.dispose();
    }

    // Remove stats
    if (this.stats && this.stats.dom && this.stats.dom.parentElement) {
      this.stats.dom.parentElement.removeChild(this.stats.dom);
    }

    // Cleanup model loader
    OptimizedModelLoader.getInstance().cleanup();
  }

  disposeMaterial(material) {
    material.dispose();
    Object.values(material).forEach((value) => {
      if (value && typeof value.dispose === "function") {
        value.dispose();
      }
    });
  }

  // UI Methods
  updateLoadingUI(progress) {
    console.log(`Loading: ${progress.toFixed(1)}%`);
  }

  hideLoadingUI() {
    // Implementation de la suppression de l'UI de chargement
  }

  showErrorUI(error) {
    console.error("Scene loading error:", error);
  }

  // Utility Methods
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  setupTouchEvents() {
    let touchStartX = 0;
    let touchStartY = 0;

    this.renderer.domElement.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true }
    );

    this.renderer.domElement.addEventListener(
      "touchmove",
      (e) => {
        if (!this.state.isOrbitControlEnabled) return;

        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        this.camera.position.x += deltaX * 0.01;
        this.camera.position.y -= deltaY * 0.01;

        touchStartX = touchEndX;
        touchStartY = touchEndY;
      },
      { passive: true }
    );
  }
}

// Export singleton instance
const sceneManager = new SceneManager();
export default sceneManager;
export const cleanup = () => sceneManager.cleanup();
