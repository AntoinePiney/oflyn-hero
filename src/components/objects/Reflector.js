// components/reflector.js
import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js"; // Import path updated

export function createReflector(scene, options = {}) {
  // Taille par défaut si aucune n'est spécifiée
  const size = options.size || { x: 14.98, z: 23.3 }; // Dimensions par défaut du Reflector

  // Création de la géométrie du Reflector
  const reflectorGeometry = new THREE.PlaneGeometry(size.x, size.z);

  // Configuration du Reflector
  const reflector = new Reflector(reflectorGeometry, {
    color: options.color || 0xe3e3e3,
    textureWidth:
      options.textureWidth || window.innerWidth * window.devicePixelRatio * 0.1, // Réduire la résolution pour les performances
    textureHeight:
      options.textureHeight ||
      window.innerWidth * window.devicePixelRatio * 0.1, // Réduire la résolution pour les performances
    clipBias: options.clipBias || 0.001,
    recursion: options.recursion || 0,
  });

  // Configuration des propriétés matérielles
  reflector.material.opacity = options.opacity || 0.001;
  reflector.material.transparent = true;
  reflector.material.blending = THREE.MultiplyBlending;

  // Positionnement manuel du Reflector dans la scène
  reflector.position.set(
    options.position?.x || 6,
    options.position?.y || -1.96,
    options.position?.z || 0
  );

  reflector.rotation.set(
    options.rotation?.x || -Math.PI / 2, // Rotation pour être horizontal
    options.rotation?.y || 0,
    options.rotation?.z || 0
  );

  // Ajout du Reflector à la scène
  scene.add(reflector);

  return reflector;
}
