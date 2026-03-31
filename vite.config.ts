import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
// https://vite.dev/config/
export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        manualChunks(moduleId) {
          if (!moduleId.includes('/node_modules/three/')) {
            return undefined;
          }

          if (moduleId.includes('/examples/jsm/controls/')) {
            return 'three-controls';
          }

          if (moduleId.includes('/src/renderers/')) {
            return 'three-renderer';
          }

          if (
            moduleId.includes('/src/materials/') ||
            moduleId.includes('/src/textures/') ||
            moduleId.includes('/src/loaders/')
          ) {
            return 'three-surface';
          }

          return 'three-stage';
        },
      },
    },
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
});
