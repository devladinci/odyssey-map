import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// Relative base, so the built site works at any address (for example a GitHub Pages sub-path).
export default defineConfig({
  base: './',
  plugins: [preact()],
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
  server: { port: Number(process.env.PORT) || 5173, strictPort: false },
});
