// camera.js
import * as THREE from "three";

export function setupCamera(camera) {
  // Set initial camera position slightly back
  camera.position.set(5, 10, 0); // Position de départ plus en arrière

  // Set initial camera rotation (converting degrees to radians)
  camera.rotation.set(
    THREE.MathUtils.degToRad(-90),
    THREE.MathUtils.degToRad(90),
    THREE.MathUtils.degToRad(90)
  );

  // Set camera to look at the center of the scene
  camera.lookAt(0, 0, 0);

  // Optional: Set custom camera parameters
  camera.fov = 17;
  camera.near = 0.01;
  camera.far = 1000;

  // Make sure to update the projection matrix after changing parameters
  camera.updateProjectionMatrix();

  // Animation function
  const animateCamera = () => {
    const targetPosition = new THREE.Vector3(27, 0.5, 0); // Position finale souhaitée
    const duration = 2000; // Durée en millisecondes
    const startPosition = camera.position.clone();
    const startTime = Date.now();

    function update() {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1.5);

      // Fonction d'easing pour une animation plus fluide
      const easeProgress = easeInOutQuad(progress);

      // Interpolation de la position
      camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
      camera.updateProjectionMatrix();

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    update();
  };

  // Démarrer l'animation après un court délai
  setTimeout(animateCamera, 900);

  return camera;
}

// Fonction d'easing pour une animation plus fluide
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
