import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prepare optional static copy targets only if the source files exist (avoid build failure when ammo not present)
const staticCopyTargets = [];
const ammoJsPath = path.resolve(__dirname, '../node_modules/three/examples/jsm/libs/ammo.wasm.js');
const ammoWasmPath = path.resolve(__dirname, '../node_modules/three/examples/jsm/libs/ammo.wasm.wasm');
if (fs.existsSync(ammoJsPath) && fs.existsSync(ammoWasmPath)) {
  staticCopyTargets.push({ src: ammoJsPath, dest: 'libs' });
  staticCopyTargets.push({ src: ammoWasmPath, dest: 'libs' });
}

export default defineConfig({
  root: __dirname,
  base: './', // Relative paths for easy hosting on GitHub Pages subfolders
  publicDir: path.resolve(__dirname, '../public'),
  plugins: [
    ...(staticCopyTargets.length ? [viteStaticCopy({ targets: staticCopyTargets })] : [])
  ],
  resolve: {
    alias: {
      'three': path.resolve(__dirname, '../node_modules/three'),
      '@': path.resolve(__dirname, '..'),
      '/src': path.resolve(__dirname, 'src'),
      '/src/t13ne': path.resolve(__dirname, 'src/t13ne'),
      '@plugins': path.resolve(__dirname, '../plugins')
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
