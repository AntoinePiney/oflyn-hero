import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { RectAreaLightHelper } from "three/examples/jsm/helpers/RectAreaLightHelper.js";

export class SceneLights {
  constructor(scene) {
    this.scene = scene;
    this.init();
  }

  init() {
    RectAreaLightUniformsLib.init();

    // RectArea Light
    this.rectAreaLight = new THREE.RectAreaLight(0xffffff, 2, 10, 15);
    this.rectAreaLight.position.set(-10, 0, 0);
    this.rectAreaLight.rotation.set(Math.PI / 2, Math.PI / -2, 0);
    this.scene.add(this.rectAreaLight);

    // RectArea Light Helper
    const rectAreaLightHelper = new RectAreaLightHelper(this.rectAreaLight);
    this.rectAreaLight.add(rectAreaLightHelper);

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 3.0);
    this.scene.add(mainLight);
  }

  dispose() {
    this.rectAreaLight.dispose();
    this.scene.remove(this.rectAreaLight);
  }
}
