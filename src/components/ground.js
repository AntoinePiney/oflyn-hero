// components/ground.js
import * as THREE from "three";

export function createGround(model) {
  const ground = model.getObjectByName("Ground");
  if (ground) {
    ground.castShadow = true;
    ground.receiveShadow = true;

    // Vérifiez si le matériau est un tableau ou un objet unique
    if (Array.isArray(ground.material)) {
      ground.material = ground.material.map((material) => material.clone()); // Clone chaque matériau si c'est un tableau
    } else {
      ground.material = ground.material.clone(); // Clone le matériau unique
    }
  }
  return ground;
}
