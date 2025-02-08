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
 * SCENE COMPONENTS & UTILS
 * =========================================
 */
import OptimizedModelLoader from "./utils/OptimizedModelLoader";
import { SceneLights } from "./components/scene/Lights";
import { setupCamera } from "./components/scene/Camera";
import { setupPostProcessing } from "./components/scene/PostProcessing";
import { createBanc } from "./components/objects/Banc";
import { createMirror } from "./components/objects/Mirror";
import { createGround } from "./components/objects/Ground";
import { createVideoPlane } from "./components/objects/VideoPlane";
import { createWall } from "./components/objects/Wall";
import { createCables } from "./components/objects/Cables";
import { createCableEffect } from "./components/effects/CableEffect";
import Konami from "./components/konami/Konami";

/**
 * Performance configuration based on device capability
 */
const PERFORMANCE_CONFIG = {
  mobile: {
    targetFPS: 30,
    shadowMapType: THREE.BasicShadowMap,
    pixelRatio: 1,
    materialPrecision: "lowp",
    anisotropy: 1,
    pulseCount: 3,
    glowStrength: 2.5,
    glowSpread: 2.0,
  },
  desktop: {
    targetFPS: 60,
    shadowMapType: THREE.PCFSoftShadowMap,
    pixelRatio: window.devicePixelRatio,
    materialPrecision: "mediump",
    anisotropy: 4,
    pulseCount: 5,
    glowStrength: 3.5,
    glowSpread: 3.0,
  },
};

export class SceneManager {
  #resourceCache = new Map();
  #disposables = new Set();
  #frameTime;
  #lastFrameTime = 0;
  #perfConfig;

  constructor() {
    this.state = {
      isLoading: false,
      loadingProgress: 0,
      isOrbitControlEnabled: true,
      error: null,
    };

    this.#perfConfig = this.#detectDeviceCapabilities();
    this.konami = new Konami();
    this.#init();
  }

  async #init() {
    try {
      this.#setupScene();
      this.#setupRenderer();
      this.#setupCamera();
      this.#setupPostProcessing();
      this.#setupControls();
      this.#setupLights();
      this.#setupEventListeners();
      this.#setupStats();

      await this.#loadModel();
      this.#startAnimationLoop();
    } catch (error) {
      console.error("Initialization error:", error);
      this.state.error = error;
      this.showErrorUI(error);
    }
  }

  #detectDeviceCapabilities() {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    return isMobile ? PERFORMANCE_CONFIG.mobile : PERFORMANCE_CONFIG.desktop;
  }

  #setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
  }

  #setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.#isMobile(),
      powerPreference: "high-performance",
      alpha: false,
      stencil: false,
      depth: true,
    });

    this.#frameTime = 1000 / this.#perfConfig.targetFPS;
    this.#updateRendererSettings();
    document.body.appendChild(this.renderer.domElement);
  }

  #updateRendererSettings() {
    const { width, height } = this.#getViewportSize();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.#perfConfig.pixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.#perfConfig.shadowMapType;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
  }

  #setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      15,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );
    setupCamera(this.camera);
  }

  #setupPostProcessing() {
    const { composer, update } = setupPostProcessing(
      this.renderer,
      this.scene,
      this.camera
    );
    this.composer = composer;
    this.postProcessUpdate = update;
  }

  #setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    Object.assign(this.controls, {
      enableDamping: true,
      dampingFactor: 0.05,
      screenSpacePanning: false,
      minDistance: 5,
      maxDistance: 100,
      maxPolarAngle: Math.PI / 2,
    });
    this.controls.target.set(0, 0, 0);
  }

  #setupLights() {
    this.lights = new SceneLights(this.scene);
  }

  #setupStats() {
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);
    Object.assign(this.stats.dom.style, {
      position: "absolute",
      top: "32px",
      left: "32px",
    });
  }

  async #loadModel() {
    this.state.isLoading = true;
    const loader = OptimizedModelLoader.getInstance();

    try {
      const gltf = await loader.load("./model/model.gltf", {
        onProgress: (progress) => {
          this.state.loadingProgress = progress;
          this.updateLoadingUI(progress);
        },
        optimizationLevel: this.#isMobile() ? "low" : "medium",
        useCache: true,
        maxRetries: 3,
      });

      await this.#setupModelComponents(gltf.scene);

      this.state.isLoading = false;
      this.hideLoadingUI();
    } catch (error) {
      this.state.error = error;
      this.state.isLoading = false;
      this.showErrorUI(error);
      throw error;
    }
  }

  async #setupModelComponents(model) {
    try {
      const components = await Promise.all([
        createBanc(model),
        createMirror(model),
        createGround(model),
        createWall(model),
        createCables(model),
        createVideoPlane(model, this.camera, this.controls),
      ]);

      components.forEach((component) => {
        if (component) {
          this.scene.add(component);
          this.#optimizeComponent(component);
        }
      });

      const cables = components[4];
      if (cables) {
        cables.renderOrder = 1;
        this.#setupCableEffect(cables);
      }
    } catch (error) {
      console.error("Error setting up model components:", error);
      throw error;
    }
  }

  #optimizeComponent(component) {
    if (!component) return;

    component.traverse((node) => {
      if (!node.isMesh) return;

      if (node.geometry) {
        const { position, index } = node.geometry.attributes;
        position.usage = THREE.StaticDrawUsage;
        if (index) index.usage = THREE.StaticDrawUsage;
      }

      if (node.material) {
        const materials = Array.isArray(node.material)
          ? node.material
          : [node.material];

        materials.forEach((material) => {
          material.precision = this.#perfConfig.materialPrecision;
          if (material.map) {
            material.map.anisotropy = this.#perfConfig.anisotropy;
            material.map.minFilter = THREE.LinearFilter;
          }
        });
      }

      // Performance optimizations
      node.frustumCulled = true;
      node.matrixAutoUpdate = false;
      node.updateMatrix();
    });
  }

  #setupCableEffect(cables) {
    this.cableEffect = createCableEffect(cables, {
      color: new THREE.Color(0.0, 0.5, 1.0),
      pulseSpeed: 0.5,
      numberOfPulses: this.#perfConfig.pulseCount,
      pulseWidth: 0.1,
      glowStrength: this.#perfConfig.glowStrength,
      glowSpread: this.#perfConfig.glowSpread,
    });
  }

  #startAnimationLoop() {
    const animate = () => {
      requestAnimationFrame(animate);
      const currentTime = performance.now();

      if (currentTime - this.#lastFrameTime < this.#frameTime) {
        return;
      }

      this.stats.begin();

      if (this.postProcessUpdate) {
        this.postProcessUpdate();
      }

      if (this.state.isOrbitControlEnabled) {
        this.controls.update();
      }

      this.composer.render();
      this.stats.end();

      this.#lastFrameTime = currentTime;
    };

    animate();
  }

  #setupEventListeners() {
    window.addEventListener("resize", this.#handleResize.bind(this));
    window.addEventListener("beforeunload", this.cleanup.bind(this));
    window.addEventListener("keydown", this.#handleKeyPress.bind(this));

    if (this.#isMobile()) {
      this.#setupTouchEvents();
    }
  }

  #handleResize = () => {
    const { width, height } = this.#getViewportSize();

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  };

  #handleKeyPress = (event) => {
    if (event.key.toLowerCase() === "m") {
      this.toggleOrbitControls();
    }
  };

  #setupTouchEvents() {
    let touchStartX = 0;
    let touchStartY = 0;

    const touchHandlers = {
      start: (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      move: (e) => {
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
    };

    this.renderer.domElement.addEventListener(
      "touchstart",
      touchHandlers.start,
      { passive: true }
    );
    this.renderer.domElement.addEventListener("touchmove", touchHandlers.move, {
      passive: true,
    });
  }

  #getViewportSize() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  #isMobile() {
    return this.#perfConfig === PERFORMANCE_CONFIG.mobile;
  }

  // Public methods
  toggleOrbitControls() {
    this.state.isOrbitControlEnabled = !this.state.isOrbitControlEnabled;
    this.controls.enabled = this.state.isOrbitControlEnabled;
  }

  updateLoadingUI(progress) {
    console.log(`Loading: ${progress.toFixed(1)}%`);
  }

  hideLoadingUI() {
    // Implementation for hiding loading UI
  }

  showErrorUI(error) {
    console.error("Scene loading error:", error);
  }

  cleanup() {
    // Remove event listeners
    window.removeEventListener("resize", this.#handleResize);
    window.removeEventListener("beforeunload", this.cleanup);
    window.removeEventListener("keydown", this.#handleKeyPress);

    // Cleanup Konami
    if (this.konami) {
      this.konami.destroy();
    }

    // Cleanup resources
    [this.lights, this.controls, this.renderer, this.composer, this.cableEffect]
      .filter(Boolean)
      .forEach((resource) => resource.dispose?.());

    // Cleanup scene
    this.scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];

        materials.forEach((material) => {
          Object.values(material)
            .filter((value) => value?.dispose instanceof Function)
            .forEach((value) => value.dispose());
          material.dispose();
        });
      }
    });

    // Remove stats
    this.stats?.dom?.parentElement?.removeChild(this.stats.dom);

    // Cleanup model loader
    OptimizedModelLoader.getInstance().cleanup();

    // Clear caches
    this.#resourceCache.clear();
    this.#disposables.clear();
  }
}

// Export singleton instance
const sceneManager = new SceneManager();
export default sceneManager;
export const cleanup = () => sceneManager.cleanup();
