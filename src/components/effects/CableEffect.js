// cableEffect.js
import * as THREE from "three";

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
uniform float time;
uniform vec3 energyColor;
uniform float pulseSpeed;
uniform float numberOfPulses;
uniform float pulseWidth;
uniform float glowStrength;
uniform float glowSpread;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    // Pulse modifié avec une meilleure gestion de l'alpha
    float pulsePhase = fract(vUv.x * numberOfPulses - time * pulseSpeed);
    
    // Fonction de pulse modifiée pour éviter les transitions brusques
    float pulse = smoothstep(0.0, pulseWidth, pulsePhase) * 
                 smoothstep(pulseWidth * 2.0, pulseWidth, pulsePhase);
    
    // Modification de l'effet Fresnel
    vec3 viewDirection = normalize(vViewPosition);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDirection)), glowSpread);
    
    // Calcul amélioré de l'alpha pour éviter les artefacts
    float alpha = max(pulse * 0.8, fresnel * 0.3);
    alpha = smoothstep(0.1, 1.0, alpha); // Seuil plus élevé pour éviter les valeurs trop faibles
    
    // Couleur finale avec une meilleure gestion de l'intensité
    vec3 finalColor = energyColor * (pulse + fresnel * 0.5) * glowStrength;
    
    gl_FragColor = vec4(finalColor, alpha);
}
`;

class CableEnergyEffect {
  constructor(cables, params = {}) {
    this.params = {
      color: params.color || new THREE.Color(1, 1, 1),
      pulseSpeed: params.pulseSpeed || 0.5,
      numberOfPulses: params.numberOfPulses || 3.0,
      pulseWidth: params.pulseWidth || 0.1,
      glowStrength: params.glowStrength || 1.5,
      glowSpread: params.glowSpread || 2.0,
    };

    this.clock = new THREE.Clock();
    this.init(cables);
  }

  init(cables) {
    this.cable = cables;
    if (!this.cable) {
      console.warn("No cable mesh provided");
      return;
    }

    // Créer le matériau shader avec les paramètres optimisés
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        energyColor: { value: this.params.color },
        pulseSpeed: { value: this.params.pulseSpeed },
        numberOfPulses: { value: this.params.numberOfPulses },
        pulseWidth: { value: this.params.pulseWidth },
        glowStrength: { value: this.params.glowStrength },
        glowSpread: { value: this.params.glowSpread },
      },
      transparent: true,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendEquation: THREE.AddEquation,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      alphaTest: 0.2,
    });

    // Sauvegarder le matériau d'origine
    this.originalMaterial = this.cable.material;

    // Configurer le rendu
    this.cable.renderOrder = 2000;
    if (this.cable.parent) {
      this.cable.parent.renderOrder = 1999;
    }

    // Parcourir tous les enfants pour s'assurer qu'ils ont le bon ordre de rendu
    this.cable.traverse((child) => {
      if (child.isMesh) {
        child.renderOrder = 2000;
      }
    });

    // Appliquer le nouveau matériau
    this.cable.material = this.material;

    // Démarrer l'animation
    this.startAnimation();

    return this.cable;
  }

  startAnimation() {
    if (!this.material || !this.material.uniforms) return;

    const animate = () => {
      if (this.material && this.material.uniforms) {
        this.material.uniforms.time.value = this.clock.getElapsedTime();
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    animate();
  }

  updateParams(params = {}) {
    if (!this.material || !this.material.uniforms) return;

    const uniforms = this.material.uniforms;

    if (params.color !== undefined) {
      uniforms.energyColor.value = new THREE.Color(params.color);
      this.params.color = params.color;
    }
    if (params.pulseSpeed !== undefined) {
      uniforms.pulseSpeed.value = params.pulseSpeed;
      this.params.pulseSpeed = params.pulseSpeed;
    }
    if (params.numberOfPulses !== undefined) {
      uniforms.numberOfPulses.value = params.numberOfPulses;
      this.params.numberOfPulses = params.numberOfPulses;
    }
    if (params.pulseWidth !== undefined) {
      uniforms.pulseWidth.value = params.pulseWidth;
      this.params.pulseWidth = params.pulseWidth;
    }
    if (params.glowStrength !== undefined) {
      uniforms.glowStrength.value = params.glowStrength;
      this.params.glowStrength = params.glowStrength;
    }
    if (params.glowSpread !== undefined) {
      uniforms.glowSpread.value = params.glowSpread;
      this.params.glowSpread = params.glowSpread;
    }
  }

  dispose() {
    // Arrêter l'animation
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Disposer du matériau
    if (this.material) {
      this.material.dispose();
    }

    // Restaurer le matériau d'origine
    if (this.cable && this.originalMaterial) {
      this.cable.material = this.originalMaterial;
    }

    // Nettoyer les références
    this.material = null;
    this.cable = null;
    this.originalMaterial = null;
  }
}

export function createCableEffect(cables, params = {}) {
  return new CableEnergyEffect(cables, params);
}
