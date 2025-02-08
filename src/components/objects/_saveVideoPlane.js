import * as THREE from "three";

export function createVideoPlane(model) {
  const videoPlane = model.getObjectByName("VideoPlane");
  if (videoPlane) {
    // Configure shadows
    videoPlane.castShadow = true;
    videoPlane.receiveShadow = true;
    videoPlane.needsUpdate = true;

    // Create and set up video texture
    const videoTexture = setupVideoTexture();

    // Apply texture to a new material
    videoPlane.material = new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.DoubleSide,
    });

    // Set initial position and rotation
    videoPlane.position.set(-5, 0, 0);
    // Rotation à 90 degrés (π/2 radians) autour de l'axe Z
    videoPlane.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  }
  return videoPlane;
}

function setupVideoTexture() {
  const video = document.createElement("video");
  video.src = "/video/videocompress.mp4";
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;

  video.addEventListener("loadeddata", function () {
    if (video.readyState >= 3) {
      video
        .play()
        .catch((error) => console.error("Error playing the video:", error));
    }
  });

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.encoding = THREE.sRGBEncoding;
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.flipY = false;

  return videoTexture;
}
