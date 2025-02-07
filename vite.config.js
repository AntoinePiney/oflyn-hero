import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

export default defineConfig({
  plugins: [glsl()],
  assetsInclude: ["**/*.gltf", "**/*.glb"],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
