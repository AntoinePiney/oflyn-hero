uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uPrevMouse;
uniform vec2 uResolution;
uniform float uFluidRadius;
uniform float uFluidIntensity;
uniform float uDissipation;
uniform float uVorticity;
uniform float uColorShift;
uniform float uNoiseScale;
varying vec2 vUv;

vec3 hash33(vec3 p) {
  p = fract(p * vec3(443.8975, 397.2973, 491.1871));
  p += dot(p.zxy, p.yxz + 19.19);
  return fract(vec3(p.x * p.y, p.z * p.x, p.y * p.z));
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  mat2 rotation = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  
  for(int i = 0; i < 5; i++) {
    value += amplitude * (
      sin(p.x * frequency + uTime * 0.2) * 
      sin(p.y * frequency + uTime * 0.1)
    );
    p = rotation * p * 2.0;
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

vec2 vorticityField(vec2 uv) {
  float angle = fbm(uv * uNoiseScale + uTime * 0.1) * 6.28318;
  return vec2(cos(angle), sin(angle)) * uVorticity;
}

void main() {
  vec2 uv = vUv;
  vec2 mouseVel = (uMouse - uPrevMouse) * 2.0;
  float dist = length(uv - uMouse);
  
  float organicFalloff = exp(-dist * 2.5) * 
    (1.0 + 0.3 * fbm(uv * 2.0 + uTime * 0.05));
  
  float fluid = smoothstep(uFluidRadius, 0.0, dist);
  fluid *= (length(mouseVel) + 0.1) * uFluidIntensity;
  
  vec2 flowOffset = vec2(
    fbm(uv * uNoiseScale + uTime * 0.2),
    fbm(uv * uNoiseScale + vec2(2.0) + uTime * 0.2)
  ) * 0.008;
  
  vec2 vortex = vorticityField(uv) * fluid * 1.5;
  
  vec2 offset = (mouseVel * fluid + vortex) * organicFalloff + flowOffset;
  
  vec2 rOffset = offset * (1.0 + uColorShift);
  vec2 bOffset = offset * (1.0 - uColorShift);
  
  vec4 color;
  color.r = texture2D(tDiffuse, uv - rOffset).r;
  color.g = texture2D(tDiffuse, uv - offset).g;
  color.b = texture2D(tDiffuse, uv - bOffset).b;
  color.a = 1.0;
  
  float noiseFade = fbm(uv * 2.0 + uTime * 0.05) * 0.1 + 0.9;
  color.rgb *= mix(uDissipation * noiseFade, 1.0, fluid * 0.2);
  
  gl_FragColor = color;
}