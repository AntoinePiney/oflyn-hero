// Add RectAreaLight to the scene
RectAreaLightUniformsLib.init();

const rectAreaLight = new THREE.RectAreaLight(0xffffff, 2, 10, 15);
rectAreaLight.position.set(-10, 0, 0);
rectAreaLight.rotation.set(Math.PI / 2, Math.PI / -2, 0);
scene.add(rectAreaLight);

// Add RectAreaLight helper
const rectAreaLightHelper = new RectAreaLightHelper(rectAreaLight);
rectAreaLight.add(rectAreaLightHelper);
