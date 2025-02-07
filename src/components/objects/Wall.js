// components/wall.js
import * as THREE from "three";

export function createWall(model) {
  const wall = model.getObjectByName("Wall");
  if (wall) {
    wall.castShadow = true;
    wall.receiveShadow = true;
  }
  return wall;
}
