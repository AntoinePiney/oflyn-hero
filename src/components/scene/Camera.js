// camera.js

/*
Dans Three.js, set(x, y, z) représente les 3 axes :

                    y (+)
                     ↑
                     |
                     |
                     |
                     |
   (-) ←------------|-------------→ (+)  x
                     |
                     |
                     |
                     |
                     ↓
                    (-)

         z sort de l'écran (+)
         z rentre dans l'écran (-)

      set(0, 0, 0) = point central ici: +

Donc :
- Premier  0 = x : gauche(-) / droite(+)
- Deuxième 0 = y : bas(-)    / haut(+)
- Troisième 0 = z : fond(-)  / devant(+) (profondeur)
*/

import * as THREE from "three";

export function setupCamera(camera) {
  // État pour le suivi de la souris
  const mouse = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  };

  // Position initiale de la caméra
  camera.position.set(5, 10, 0);
  camera.rotation.set(
    THREE.MathUtils.degToRad(-90),
    THREE.MathUtils.degToRad(90),
    THREE.MathUtils.degToRad(90)
  );
  camera.lookAt(0, 0, 0);

  // Paramètres de la caméra
  camera.fov = 17;
  camera.near = 0.01;
  camera.far = 1000;
  camera.updateProjectionMatrix();

  // Gestionnaire de mouvement de souris
  function handleMouseMove(event) {
    // Normaliser les coordonnées de la souris entre -1 et 1
    mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = (event.clientY / window.innerHeight) * 2 - 1;
  }

  // Animation initiale de la caméra
  const animateCamera = () => {
    const targetPosition = new THREE.Vector3(27, 0.5, 0);
    const duration = 2000;
    const startPosition = camera.position.clone();
    const startTime = Date.now();

    function update() {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1.5);
      const easeProgress = easeInOutQuad(progress);

      camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
      camera.updateProjectionMatrix();

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    update();
  };

  // Animation continue pour le suivi de souris
  function updateMouseMovement() {
    // Interpolation fluide des valeurs de la souris
    mouse.x = THREE.MathUtils.lerp(mouse.x, mouse.targetX, 0.05);
    mouse.y = THREE.MathUtils.lerp(mouse.y, mouse.targetY, 0.05);

    // Calculer les rotations basées sur la position de la souris
    const rotationOffsetX = mouse.y * 0.3; // Réduit l'amplitude du mouvement
    const rotationOffsetY = mouse.x * 0.3;

    // Appliquer les rotations à la position de base
    camera.position.x = 27 + rotationOffsetY * 2;
    camera.position.y = 0.5 + rotationOffsetX * 2;

    // Garder la caméra orientée vers le centre
    camera.lookAt(0, 0, 0);

    requestAnimationFrame(updateMouseMovement);
  }

  // Démarrer les animations
  setTimeout(animateCamera, 900);
  setTimeout(updateMouseMovement, 2900); // Commence après l'animation initiale

  // Ajouter l'écouteur d'événements
  window.addEventListener("mousemove", handleMouseMove);

  // Nettoyer les événements lors du démontage
  return () => {
    window.removeEventListener("mousemove", handleMouseMove);
  };
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
