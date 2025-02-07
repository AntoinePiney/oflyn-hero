// components/banc.js
import * as THREE from "three";

export function createBanc(model) {
  const banc = model.getObjectByName("banc");
  if (banc) {
    banc.castShadow = true;
    banc.receiveShadow = true;
  }
  return banc;
}
