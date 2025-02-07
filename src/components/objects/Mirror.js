// components/wall.js
import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js"; // Import path updated

export function createMirror(model) {
  const mirror = model.getObjectByName("Reflector");
  if (mirror) {
    mirror.castShadow = true;
    mirror.receiveShadow = true;

    // Ajouter un Reflector au mesh principal avec des options personnalisées
    const reflectorOptions = {
      size: { width: 2, height: 2.2 }, // Taille du Reflector
      positionOffset: { x: -2, y: 0.1, z: 1 }, // Ajustement manuel de la position
      rotationOffset: { x: 0, y: 0, z: 0 }, // Ajustement manuel de la rotation
    };

    addReflectiveFace(mirror, reflectorOptions);

    // Créer le Reflector symétrique
    const symmetricalReflectorOptions = {
      size: { width: 2, height: 2.2 }, // Taille identique pour le Reflector symétrique
      positionOffset: { x: -2, y: 0.1, z: -1 }, // Inversion de la position pour la symétrie
      rotationOffset: { x: 0, y: Math.PI, z: 0 }, // Rotation de 180° pour inverser l'orientation
    };

    addReflectiveFace(mirror, symmetricalReflectorOptions);

    // Créer un troisième Reflector
    const thirdReflectorOptions = {
      size: { width: 2, height: 2 }, // Taille du troisième Reflector
      positionOffset: { x: -2, y: 1.12, z: 0 }, // Position différente pour créer une nouvelle perspective
      rotationOffset: { x: Math.PI / 2, y: Math.PI, z: 0 }, // Rotation pour orienter le reflector différemment
    };

    addReflectiveFace(mirror, thirdReflectorOptions);
  }
  return mirror;
}

function addReflectiveFace(mirror, options = {}) {
  // Créez une géométrie plane avec la taille spécifiée

  const reflectorSize = options.size || { width: 0.3, height: 0.3 };
  const geometry = new THREE.PlaneGeometry(
    reflectorSize.width,
    reflectorSize.height
  );

  // Configuration du Reflector
  const reflector = new Reflector(geometry, {
    color: 0x7f7f7f, // Couleur du reflet
    textureWidth: window.innerWidth * window.devicePixelRatio * 0.5, // Réduire la résolution pour les performances
    textureHeight: window.innerHeight * window.devicePixelRatio * 0.5,
    clipBias: 0.003,
    recursion: 0,
  });

  // Ajuster la position et la rotation avec des offsets personnalisés
  const positionOffset = options.positionOffset || { x: 0, y: 0, z: 0 };
  const rotationOffset = options.rotationOffset || { x: 0, y: 0, z: 0 };

  // Placer le reflector sur la face correspondante avec les ajustements
  reflector.position
    .copy(mirror.position)
    .add(
      new THREE.Vector3(positionOffset.x, positionOffset.y, positionOffset.z)
    );

  reflector.rotation.set(
    mirror.rotation.x + rotationOffset.x,
    mirror.rotation.y + rotationOffset.y,
    mirror.rotation.z + rotationOffset.z
  );

  // Ajouter le reflector au mesh d'origine
  mirror.add(reflector);
}
