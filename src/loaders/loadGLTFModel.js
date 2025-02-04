import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function loadGLTFModel(path, scene, videoTexture) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    // Chargement du modèle GLTF
    loader.load(
      path,
      (gltf) => {
        scene.add(gltf.scene);

        // Applique la texture vidéo si un plan "VideoPlane" est trouvé
        const videoPlane = gltf.scene.getObjectByName("VideoPlane");
        if (videoPlane) {
          videoPlane.material = new THREE.MeshBasicMaterial({
            map: videoTexture,
          });
          videoPlane.rotation.y = Math.PI; // Ajuste la rotation si nécessaire

          // Log des positions et rotations du VideoPlane pour le débogage
          console.log("VideoPlane position:", videoPlane.position);
          console.log("VideoPlane rotation:", videoPlane.rotation);
        }

        // Résout la promesse avec le modèle GLTF
        resolve(gltf);
      },
      undefined,
      (error) => {
        console.error("GLTF load error:", error);
        reject(error); // Rejette la promesse en cas d'erreur
      }
    );
  });
}
