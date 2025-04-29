import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    host: true,
    open: true,
    hmr: {
      clientPort: 5173,
      timeout: 120000
    }
  },
  preview: {
    port: 5173,
    host: '0.0.0.0',
    open: true
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'map-vendor': ['leaflet', 'react-leaflet']
        }
      }
    },
    target: 'esnext',
    minify: 'esbuild'
  }
});