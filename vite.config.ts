import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    rollupOptions: { output: { manualChunks: (id: string) => {
      // Keep Vite's shared lazy-import helper out of the wallet group. Otherwise
      // the public entry imports that helper from the whole crypto bundle.
      if (id.includes('vite/preload-helper')) return 'preload-helper';
      return id.includes('node_modules/phaser') ? 'phaser' : id.includes('node_modules/viem') ? 'wallet' : undefined;
    } } },
  },
});
