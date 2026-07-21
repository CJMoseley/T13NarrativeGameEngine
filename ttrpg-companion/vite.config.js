import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: __dirname,
  base: './', // Relative paths for easy hosting on GitHub Pages subfolders
  publicDir: path.resolve(__dirname, '../public'),
  plugins: [
    viteStaticCopy({
      targets: [
        {
          // Copy physics binary helper from main node_modules
          src: path.resolve(__dirname, '../node_modules/three/examples/jsm/libs/ammo.wasm.js'),
          dest: 'libs'
        },
        {
          src: path.resolve(__dirname, '../node_modules/three/examples/jsm/libs/ammo.wasm.wasm'),
          dest: 'libs'
        }
      ]
    })
  ],
  resolve: {
    alias: {
      'three': path.resolve(__dirname, '../node_modules/three'),
      '@': path.resolve(__dirname, '..'),
      '/src/t13ne': path.resolve(__dirname, 'src/t13ne')
    }
  },
  server: {
    port: 5174, // Separate port so they can run concurrently
    hmr: {
      host: 'localhost',
      port: 5174,
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
    outDir: '../dist-ttrpg',
    emptyOutDir: true
  }
});
