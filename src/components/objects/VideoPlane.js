import * as THREE from "three";

// Constants
const PLAYER_STYLES = {
  container: {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "black",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: "1000",
    transform: "translateZ(0)",
    backfaceVisibility: "hidden",
  },
  video: {
    maxWidth: "80%",
    maxHeight: "80%",
    outline: "none",
    transform: "translateZ(0)",
    backfaceVisibility: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: "20px",
    right: "20px",
    fontSize: "24px",
    color: "white",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "10px",
    zIndex: "1001",
  },
};

class VideoHandler {
  constructor(camera) {
    this.camera = camera;
    this.customPlayer = null;
    this.activeVideo = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clickHandler = this.handleClick.bind(this);
    this.videoPlane = null;
    this.interactionPlane = null;
  }

  createVideoElement(options = {}) {
    const video = document.createElement("video");
    Object.assign(video, {
      src: "/video/videocompress.mp4",
      muted: true,
      loop: true,
      autoplay: true,
      playsInline: true,
      preload: "auto",
      playbackRate: 1.0,
      defaultPlaybackRate: 1.0,
      ...options,
    });

    video.setAttribute("webkit-playsinline", "true");
    video.setAttribute("x-webkit-airplay", "allow");
    video.setAttribute("disablePictureInPicture", "true");

    // S'assurer que la vidéo joue dans le plane
    video.addEventListener("loadeddata", () => {
      if (video.readyState >= 3) {
        video
          .play()
          .catch((error) => console.error("Error playing video:", error));
      }
    });

    return video;
  }

  createVideoTexture(video) {
    const texture = new THREE.VideoTexture(video);
    Object.assign(texture, {
      encoding: THREE.sRGBEncoding,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
      flipY: false,
    });
    return texture;
  }

  createCustomPlayer() {
    const container = document.createElement("div");
    Object.assign(container.style, PLAYER_STYLES.container);

    const video = this.createVideoElement({
      controls: true,
      muted: false,
    });
    Object.assign(video.style, PLAYER_STYLES.video);

    const closeButton = document.createElement("button");
    Object.assign(closeButton.style, PLAYER_STYLES.closeButton);
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => this.closePlayer());

    container.appendChild(video);
    container.appendChild(closeButton);
    document.body.appendChild(container);

    return { container, video };
  }

  setupVideoPlane(model) {
    const videoPlane = model.getObjectByName("VideoPlane");
    if (!videoPlane) return null;

    const video = this.createVideoElement();
    const videoTexture = this.createVideoTexture(video);

    videoPlane.material = new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.DoubleSide,
      toneMapped: false,
    });

    videoPlane.position.set(-5, 0, 0);
    videoPlane.rotation.set(Math.PI / 2, 0, -Math.PI / 2);

    videoPlane.matrixAutoUpdate = false;
    videoPlane.updateMatrix();

    this.activeVideo = video;
    this.videoPlane = videoPlane;
    this.setupInteraction(videoPlane);

    return videoPlane;
  }

  setupInteraction(videoPlane) {
    this.interactionPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 5),
      new THREE.MeshBasicMaterial({ visible: false })
    );

    this.interactionPlane.position.copy(videoPlane.position);
    this.interactionPlane.rotation.copy(videoPlane.rotation);
    videoPlane.parent.add(this.interactionPlane);

    window.addEventListener("click", this.clickHandler);
  }

  handleClick(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Vérifier l'intersection avec les deux plans
    const intersects = this.raycaster.intersectObjects([
      this.videoPlane,
      this.interactionPlane,
    ]);

    if (intersects.length > 0) {
      this.openPlayer();
    }
  }

  openPlayer() {
    if (!this.customPlayer) {
      this.customPlayer = this.createCustomPlayer();
    }

    const playerVideo = this.customPlayer.video;
    playerVideo.src = this.activeVideo.src;
    playerVideo.currentTime = this.activeVideo.currentTime;

    this.customPlayer.container.style.display = "flex";

    // Attendre que la vidéo soit prête
    playerVideo.addEventListener("canplay", function onCanPlay() {
      playerVideo.play().catch(console.error);
      playerVideo.removeEventListener("canplay", onCanPlay);
    });
  }

  closePlayer() {
    if (this.customPlayer) {
      this.customPlayer.video.pause();
      this.customPlayer.container.style.display = "none";
    }
  }

  dispose() {
    if (this.customPlayer) {
      this.customPlayer.video.pause();
      this.customPlayer.container.remove();
      this.customPlayer = null;
    }

    if (this.activeVideo) {
      this.activeVideo.pause();
      this.activeVideo = null;
    }

    if (this.interactionPlane) {
      this.interactionPlane.geometry.dispose();
      this.interactionPlane.material.dispose();
      this.interactionPlane.parent?.remove(this.interactionPlane);
      this.interactionPlane = null;
    }

    window.removeEventListener("click", this.clickHandler);
  }
}

let handler = null;

export function createVideoPlane(model, camera) {
  // S'assurer qu'il n'y a qu'une seule instance
  if (handler) {
    handler.dispose();
  }
  handler = new VideoHandler(camera);
  return handler.setupVideoPlane(model);
}
