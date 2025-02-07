import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

// Import components
import { SceneLights } from "./components/scene/Lights";
import { createBanc } from "./components/objects/Banc";
import { createMirror } from "./components/objects/Mirror";
import { createGround } from "./components/objects/Ground";
import { createVideoPlane } from "./components/objects/VideoPlane";
import { createWall } from "./components/objects/Wall";
import { createCables } from "./components/objects/Cables";
import { createCableEffect } from "./components/effects/CableEffect";
import { setupCamera } from "./components/scene/Camera";
import { setupPostProcessing } from "./components/scene/PostProcessing";

export class SceneManager {
  constructor() {
    console.log("SceneManager: Initializing scene...");
    this.initStats();
    this.init();
    this.setupEventListeners();
    this.cableEffect = null;
    console.log("SceneManager: Construction complete");
  }

  initStats() {
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb
    document.body.appendChild(this.stats.dom);

    // Style the stats panel
    this.stats.dom.style.position = "absolute";
    this.stats.dom.style.top = "0px";
    this.stats.dom.style.left = "0px";
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    // Begin stats measurement
    this.stats.begin();

    if (this.postProcessUpdate) {
      this.postProcessUpdate();
    }

    this.controls.update();
    this.composer.render();

    // End stats measurement
    this.stats.end();
  }

  // Rest of the code remains unchanged
  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(
      15,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );
    setupCamera(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: true,
    });

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(this.renderer.domElement);

    const postProcess = setupPostProcessing(
      this.renderer,
      this.scene,
      this.camera
    );
    this.composer = postProcess.composer;
    this.postProcessUpdate = postProcess.update;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.target.set(0, 0, 0);

    this.lights = new SceneLights(this.scene);
    this.loadModel();
  }

  async loadModel() {
    const loader = new GLTFLoader();
    try {
      console.log("Starting model loading...");
      const gltf = await new Promise((resolve, reject) => {
        loader.load("./model/model.gltf", resolve, undefined, reject);
      });

      const model = gltf.scene;

      const banc = createBanc(model);
      const mirror = createMirror(model);
      const ground = createGround(model);
      const videoPlane = await createVideoPlane(model);
      const wall = createWall(model);
      const cables = createCables(model);

      [banc, mirror, ground, videoPlane, wall].forEach((component) => {
        if (component) this.scene.add(component);
      });

      if (cables) {
        cables.renderOrder = 1;
        this.scene.add(cables);

        this.cableEffect = createCableEffect(cables, {
          color: new THREE.Color(0.0, 0.5, 1.0),
          pulseSpeed: 0.5,
          numberOfPulses: 5,
          pulseWidth: 0.1,
          glowStrength: 3.5,
          glowSpread: 3.0,
        });
      }

      this.animate();
    } catch (error) {
      console.error("Error loading model:", error);
    }
  }

  setupEventListeners() {
    window.addEventListener("resize", this.handleResize.bind(this));
    window.addEventListener("beforeunload", this.cleanup.bind(this));
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  cleanup() {
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("beforeunload", this.cleanup);

    this.scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    if (this.cableEffect) {
      this.cableEffect.dispose();
    }

    this.lights.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    if (this.composer) {
      this.composer.dispose();
    }

    // Remove stats panel
    if (this.stats) {
      document.body.removeChild(this.stats.dom);
    }
  }
}

const sceneManager = new SceneManager();
export const cleanup = () => sceneManager.cleanup();
