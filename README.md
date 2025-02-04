# Oflyn Hero

A Three.js-based interactive 3D scene with advanced visual effects.

## Project Structure

```
src/
├── components/
│   ├── scene/
│   │   ├── Banc.js           # Bench object component
│   │   ├── Cables.js         # Cable system component
│   │   ├── Ground.js         # Ground plane component
│   │   ├── Mirror.js         # Mirror reflection component
│   │   ├── VideoPlane.js     # Video display surface
│   │   └── Wall.js           # Wall structure component
│   └── effects/
│       ├── CableEffect.js    # Cable glow/animation effect
│       └── PostProcessing.js # Post-processing effects
├── core/
│   ├── Camera.js            # Camera setup and controls
│   ├── Lighting.js          # Scene lighting setup
│   ├── Renderer.js          # WebGL renderer configuration
│   └── SceneManager.js      # Main scene orchestration
├── shaders/
│   └── AwwwardsShader.js    # Custom shader effects
├── utils/
│   ├── LoaderUtils.js       # Asset loading utilities
│   ├── ResizeHandler.js     # Window resize management
│   └── Stats.js             # Performance monitoring
├── config/
│   └── constants.js         # Global configuration
└── main.js                  # Application entry point
```

## Technologies

- Three.js
- WebGL
- GLSL Shaders
