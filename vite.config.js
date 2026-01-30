import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: '/',
  publicDir: 'public',
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/three/examples/jsm/libs/ammo.wasm.js',
          dest: 'plugins/enable3d/dist'
        },
        {
          src: 'node_modules/three/examples/jsm/libs/ammo.wasm.wasm',
          dest: 'plugins/enable3d/dist'
        },
        {
          src: 'plugins/t13ne/data',
          dest: 'plugins/t13ne'
        }
      ]
    })
  ],
  resolve: {
    alias: {
      'three': path.resolve(__dirname, 'node_modules/three'),
      '@': path.resolve(__dirname),
      '@plugins': path.resolve(__dirname, 'plugins')
    }
  },
  server: {
    port: 5173,
    hmr: {
      host: 'localhost',
      port: 5173,
    },
    fs: {
      allow: ['..']
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  },
  build: {
    outDir: '../dist'
  }
});