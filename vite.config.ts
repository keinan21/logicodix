import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Satu server menyajikan web + Socket.IO (ARCHITECTURE §1).
 * Saat dev: Vite melayani web di 5173, memproksi /socket.io + /health ke Express di 3000 (§10).
 * Saat produksi: npm run build → dist/, lalu npm start melayani semuanya dari satu port.
 */
export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
      '/health': {
        target: 'http://localhost:3000',
      },
    },
  },
});
