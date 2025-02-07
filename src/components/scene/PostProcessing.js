import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { PixelShader } from "../effects/PixelEffect.js";

export function setupPostProcessing(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);

  // Render Pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // FXAA Pass
  const fxaaPass = new ShaderPass(FXAAShader);
  const pixelRatio = renderer.getPixelRatio();
  fxaaPass.material.uniforms["resolution"].value.x =
    1 / (window.innerWidth * pixelRatio);
  fxaaPass.material.uniforms["resolution"].value.y =
    1 / (window.innerHeight * pixelRatio);
  composer.addPass(fxaaPass);

  // Pixel Effect Pass
  const pixelPass = new ShaderPass(PixelShader);
  pixelPass.uniforms.uResolution.value.set(
    window.innerWidth,
    window.innerHeight
  );
  pixelPass.renderToScreen = true;
  composer.addPass(pixelPass);

  // Mouse handling
  // Mouse handling
  let prevMousePos = new THREE.Vector2(0.5, 0.5);
  document.addEventListener("mousemove", (e) => {
    const x = e.clientX / window.innerWidth;
    const y = 1.0 - e.clientY / window.innerHeight; // Inversé Y pour correspondre à l'espace UV

    pixelPass.uniforms.uMouse.value.set(x, y);
    pixelPass.uniforms.uPrevMouse.value.copy(prevMousePos);
    prevMousePos.set(x, y);
  });

  // Animation update function
  const update = () => {
    if (pixelPass) {
      pixelPass.uniforms.uTime.value += 0.01;
    }
  };

  return { composer, update };
}
