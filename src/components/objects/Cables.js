// components/cables.js
import * as THREE from "three";

export function createCables(model) {
  const cables = model.getObjectByName("Cables");
  if (cables) {
    cables.castShadow = true;
    cables.receiveShadow = true;

    // Check if the material is an array or a single object
    if (Array.isArray(cables.material)) {
      cables.material = cables.material.map((material) => material.clone()); // Clone each material if it's an array
    } else {
      cables.material = cables.material.clone(); // Clone the single material
    }
  }
  return cables;
}
