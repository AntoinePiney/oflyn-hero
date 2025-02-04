import * as THREE from "three";

export const AwwwardsShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    fogColor: { value: new THREE.Color(0x111111) }, // Fog plus clair
    fogDensity: { value: 0.05 }, // Densité réduite
    resolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    vignetteStrength: { value: 0.3 }, // Vignette moins intense
    vignetteRadius: { value: 0.85 }, // Rayon plus large
    mouse: { value: new THREE.Vector2(0.5, 0.5) },
    brightness: { value: 1.2 }, // Contrôle la luminosité générale
    glowStrength: { value: 0.4 }, // Contrôle l'intensité de la lueur
    glowRadius: { value: 2.0 }, // Contrôle la taille de la lueur
    glowIntensity: { value: 0.4 }, // Nouveau paramètre pour contrôler l'intensité
  },

  vertexShader: `
    varying vec2 vUv;
    varying float fogDepth;

    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vec4 viewPosition = viewMatrix * worldPosition;
      fogDepth = -viewPosition.z;
      gl_Position = projectionMatrix * viewPosition;
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec3 fogColor;
    uniform float fogDensity;
    uniform vec2 resolution;
    uniform float time;
    uniform float vignetteStrength;
    uniform float vignetteRadius;
    uniform vec2 mouse;
    uniform float brightness;
    uniform float glowStrength;
    uniform float glowRadius;

    varying vec2 vUv;
    varying float fogDepth;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    // Fonction pour créer un effet de lueur
    vec3 glow(vec2 uv, vec3 color) {
      vec3 glow = vec3(0.0);
      float total = 0.0;
      
      // Échantillonnage pour créer l'effet de lueur
      for(float i = -glowRadius; i <= glowRadius; i++) {
        for(float j = -glowRadius; j <= glowRadius; j++) {
          vec2 offset = vec2(i, j) / resolution.xy;
          float weight = 1.0 - length(offset) * 0.0;
          if(weight > 0.0) {
            glow += texture2D(tDiffuse, uv + offset).rgb * weight;
            total += weight;
          }
        }
      }
      
      glow = glow / total;
      return mix(color, glow, glowStrength);
    }

    void main() {
      vec2 uv = vUv;

      // Effet de vignette amélioré
      float dist = length(uv - 0.5);
      float vignette = 1.0 - smoothstep(vignetteRadius, vignetteRadius + vignetteStrength, dist);

      // Récupération et amélioration de la couleur de base
      vec3 color = texture2D(tDiffuse, uv).rgb;
      color *= brightness; // Augmentation de la luminosité

      // Application de la lueur
      color = glow(uv, color);

      // Effet de brouillard atténué
      float fogFactor = exp(-fogDepth * fogDensity);
      color = mix(fogColor, color, fogFactor);

      // Grain de film subtil
      float filmGrain = random(uv + time) * 0.05;
      color += filmGrain;

      // Distorsion chromatique influencée par la souris
      float mouseDist = length(uv - mouse) * 0.08;
      vec2 distortion = dist * 0.008 * vec2(cos(time + mouseDist), sin(time + mouseDist));

      vec3 distortedColor = vec3(
        texture2D(tDiffuse, uv + distortion).r,
        texture2D(tDiffuse, uv).g,
        texture2D(tDiffuse, uv - distortion).b
      );

      // Mélange final avec plus de luminosité
      vec3 finalColor = vignette * mix(color, distortedColor, 0.3);
      finalColor = pow(finalColor, vec3(0.95)); // Correction gamma pour plus de luminosité

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};
