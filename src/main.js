// main.js
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { RectAreaLightHelper } from "three/examples/jsm/helpers/RectAreaLightHelper.js";

// Import components
import { createBanc } from "./components/banc";
import { createMirror } from "./components/mirror";
import { createGround } from "./components/ground";
import { createVideoPlane } from "./components/videoPlane";
import { createWall } from "./components/wall.js";
import { createCables } from "./components/cables.js";
import { createCableEffect } from "./components/cableEffect.js";
import { setupCamera } from "./components/camera.js";

// Import post-processing
import { setupPostProcessing } from "./components/postProcessing.js";

class SceneManager {
  constructor() {
    console.log("SceneManager: Initializing scene...");
    this.init();
    this.setupEventListeners();
    this.cableEffect = null;
    this.mouseEffect = {
      position: new THREE.Vector2(),
      target: new THREE.Vector2(),
      strength: 0,
    };
    console.log("SceneManager: Construction complete");
  }

  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    console.log("Scene created with black background");

    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      15,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );
    setupCamera(this.camera);
    console.log("Camera setup complete", {
      fov: this.camera.fov,
      aspect: this.camera.aspect,
      near: this.camera.near,
      far: this.camera.far,
    });

    // Create renderer
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
    console.log("Renderer initialized", {
      antialias: this.renderer.getContext().getContextAttributes().antialias,
      pixelRatio: window.devicePixelRatio,
      shadowMapEnabled: this.renderer.shadowMap.enabled,
    });

    // Setup post-processing
    this.composer = setupPostProcessing(this.renderer, this.scene, this.camera);

    // Setup controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.target.set(0, 0, 0);
    console.log("OrbitControls configured", {
      dampingFactor: this.controls.dampingFactor,
      minDistance: this.controls.minDistance,
      maxDistance: this.controls.maxDistance,
    });

    // Add mousemove listener
    this.renderer.domElement.addEventListener(
      "mousemove",
      this.onMouseMove.bind(this)
    );

    // Setup lights
    this.setupLights();

    // Load model
    this.loadModel();
  }

  onMouseMove(event) {
    // Normalize mouse coordinates
    this.mouseEffect.target.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouseEffect.target.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Calculate effect strength
    this.mouseEffect.strength = 1.0;
  }

  setupLights() {
    RectAreaLightUniformsLib.init();

    // RectArea Light
    this.rectAreaLight = new THREE.RectAreaLight(0xffffff, 2, 10, 15);
    this.rectAreaLight.position.set(-10, 0, 0);
    this.rectAreaLight.rotation.set(Math.PI / 2, Math.PI / -2, 0);
    this.scene.add(this.rectAreaLight);
    console.log("RectArea Light created", {
      color: this.rectAreaLight.color,
      intensity: this.rectAreaLight.intensity,
      width: this.rectAreaLight.width,
      height: this.rectAreaLight.height,
    });

    // RectArea Light Helper
    const rectAreaLightHelper = new RectAreaLightHelper(this.rectAreaLight);
    this.rectAreaLight.add(rectAreaLightHelper);

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.scene.add(ambientLight);
    console.log("Ambient Light added", {
      color: ambientLight.color,
      intensity: ambientLight.intensity,
    });
  }

  async loadModel() {
    const loader = new GLTFLoader();
    try {
      console.log("Starting model loading...");
      const gltf = await new Promise((resolve, reject) => {
        loader.load("./model/model.gltf", resolve, undefined, reject);
      });

      const model = gltf.scene;
      console.log("GLTF Model loaded", {
        modelChildrenCount: model.children.length,
        receiveShadow: model.receiveShadow,
        castShadow: model.castShadow,
      });

      // Create components
      const banc = createBanc(model);
      const mirror = createMirror(model);
      const ground = createGround(model);
      const videoPlane = await createVideoPlane(model);
      const wall = createWall(model);
      const cables = createCables(model);

      // Log component creation
      console.log("Components created", {
        banc: !!banc,
        mirror: !!mirror,
        ground: !!ground,
        videoPlane: !!videoPlane,
        wall: !!wall,
        cables: !!cables,
      });

      // Add components to scene
      [banc, mirror, ground, videoPlane, wall].forEach((component) => {
        if (component) this.scene.add(component);
      });

      // Add cable effect
      if (cables) {
        cables.renderOrder = 1;
        this.scene.add(cables);

        // Configuration des câbles avec une couleur bleue
        this.cableEffect = createCableEffect(cables, {
          color: new THREE.Color(0.0, 0.5, 1.0), // Electric blue (RGB)
          pulseSpeed: 0.5,
          numberOfPulses: 5,
          pulseWidth: 0.1,
          glowStrength: 3.5,
          glowSpread: 3.0,
        });
        console.log("Cable effect created", {
          color: this.cableEffect.color,
          pulseSpeed: this.cableEffect.pulseSpeed,
          numberOfPulses: this.cableEffect.numberOfPulses,
        });
      }

      // Start animation
      this.animate();
    } catch (error) {
      console.error("Error loading model:", error);
    }
  }

  setupEventListeners() {
    window.addEventListener("resize", this.handleResize.bind(this));
    window.addEventListener("beforeunload", this.cleanup.bind(this));
    console.log("Event listeners for resize and beforeunload added");
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Mettre à jour la taille du composer
    this.composer.setSize(window.innerWidth, window.innerHeight);
    console.log("Window resized", {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      pixelRatio: this.renderer.getPixelRatio(),
    });
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    // Smooth interpolation of mouse coordinates
    this.mouseEffect.position.x +=
      (this.mouseEffect.target.x - this.mouseEffect.position.x) * 0.1;
    this.mouseEffect.position.y +=
      (this.mouseEffect.target.y - this.mouseEffect.position.y) * 0.1;

    this.controls.update();
    // Utiliser le composer pour le rendu final
    this.composer.render();
  }

  cleanup() {
    console.log("Starting scene cleanup...");
    // Remove event listeners
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("beforeunload", this.cleanup);
    this.renderer.domElement.removeEventListener("mousemove", this.onMouseMove);

    // Dispose of scene objects
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
    console.log("Scene objects disposed");

    // Dispose of specific effects
    if (this.cableEffect) {
      this.cableEffect.dispose();
      console.log("Cable effect disposed");
    }

    // Dispose of controls, renderer and composer
    this.controls.dispose();
    this.renderer.dispose();
    this.composer.dispose();
    console.log("Controls, renderer and composer disposed");
  }
}

// Initialize scene
const sceneManager = new SceneManager();

// Export cleanup function if needed elsewhere
export const cleanup = () => sceneManager.cleanup();
