import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { AwwwardsShader } from "../shaders/shader.js"; // Import du shader mis à jour
import * as THREE from "three";

export function setupPostProcessing(renderer, scene, camera) {
  // Configuration de base du composer
  const composer = new EffectComposer(renderer);

  // Passe de rendu principale
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Anti-aliasing FXAA
  const fxaaPass = new ShaderPass(FXAAShader);
  const pixelRatio = renderer.getPixelRatio();
  fxaaPass.material.uniforms["resolution"].value.x =
    1 / (window.innerWidth * pixelRatio);
  fxaaPass.material.uniforms["resolution"].value.y =
    1 / (window.innerHeight * pixelRatio);
  composer.addPass(fxaaPass);

  // Ajout du shader custom "Awwwards"
  const awwwardsShaderPass = new ShaderPass(AwwwardsShader);
  composer.addPass(awwwardsShaderPass);

  // S'assurer que la dernière passe effectue le rendu
  awwwardsShaderPass.renderToScreen = true;

  // Mise à jour de la position de la souris
  document.addEventListener("mousemove", function (e) {
    let x = e.clientX / window.innerWidth;
    let y = 1.0 - e.clientY / window.innerHeight; // Inverser y pour correspondre au système de coordonnées de WebGL
    awwwardsShaderPass.uniforms.mouse.value = new THREE.Vector2(x, y);

    console.log("Mouse position uniform updated:", x, y);
  });

  return composer;
}
