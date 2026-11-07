/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // Tương thích cả chạy dev cục bộ, deploy GitHub Pages (/Bomber/) và tùy biến BASE_PATH
  base: process.env.BASE_PATH || (process.env.NODE_ENV === 'production' ? '/Bomber/' : '/'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
