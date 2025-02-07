# Three.js 3D Scene Project

> Interactive 3D scene with dynamic effects and optimized performance

## Setup

```bash
git clone [repository-url]
cd project-name
npm install
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── scene/              # Core scene components
│   │   ├── Camera.js       # Camera configuration
│   │   ├── Lights.js       # Scene lighting
│   │   └── PostProcessing.js
│   ├── objects/            # 3D scene objects
│   │   ├── Banc.js
│   │   ├── Cables.js
│   │   ├── Ground.js
│   │   ├── Mirror.js
│   │   ├── Reflector.js
│   │   ├── VideoPlane.js
│   │   └── Wall.js
│   └── effects/
│       ├── CableEffect.js  # Energy visualization
│       └── PixelEffect.js  # Custom shaders
├── utils/
│   ├── ModelLoader.js
│   ├── ResizeHandler.js
│   └── Stats.js
├── shaders/
│   └── pixel/
│       ├── vertex.glsl
│       └── fragment.glsl
└── SceneManager.js
```

## Features

- Dynamic GLTF model loading
- Real-time FPS monitoring
- Post-processing effects
- Video texture mapping
- Custom shader implementations
- Memory management
- Responsive design

## Development Guide

### Adding Objects

```javascript
// 1. Create component (objects/NewObject.js)
export function createNewObject(model) {
  const object = model.getObjectByName("ObjectName");
  if (object) {
    object.castShadow = true;
    object.receiveShadow = true;
  }
  return object;
}

// 2. Register in SceneManager.js
import { createNewObject } from "./components/objects/NewObject";
```

### Shader Development

```glsl
// shaders/custom/vertex.glsl
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

### Required Assets

- `./model/model.gltf`
- `./video/videocompress.mp4`

## Configuration

```javascript
// Camera settings
fov: 15,
near: 0.01,
far: 1000

// Controls
minDistance: 5,
maxDistance: 100
maxPolarAngle: Math.PI / 2
```

## Build

```bash
npm run build
npm run preview
```

## Troubleshooting

- Model loading: Verify file paths in ModelLoader.js
- Performance: Monitor FPS via Stats component
- Memory: Check cleanup() implementation
- WebGL: Verify browser compatibility

## Contributing

1. Branch: `feature/`, `fix/`, `refactor/`
2. Test shaders and effects
3. Verify cleanup
4. Update docs

## License

[Your License]
