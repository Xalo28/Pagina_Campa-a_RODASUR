import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El backend Express corre en :3000. En desarrollo, Vite (:5173) hace proxy
// de las llamadas al API y de las imágenes subidas hacia el backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
