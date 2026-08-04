import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const clientMode = mode === 'player' ? 'player' : mode === 'referee' ? 'referee' : 'development';
  return {
    root: __dirname,
    base: './', // Relative paths for easy hosting on GitHub Pages subfolders
    publicDir: path.resolve(__dirname, '../public'),
    define: {
      'import.meta.env.VITE_CLIENT_MODE': JSON.stringify(clientMode)
    },
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
          },
          {
            // Copy the T13NE engine data directory so that the companion dev server can load the library codex
            src: path.resolve(__dirname, '../src/t13ne/data'),
            dest: 'plugins/t13ne'
          }
        ]
      })
    ],
    resolve: {
      alias: {
        'three': path.resolve(__dirname, '../node_modules/three'),
        '@': path.resolve(__dirname, '..'),
        '/src/t13ne': path.resolve(__dirname, 'src/t13ne'),
        '@plugins': path.resolve(__dirname, '../plugins')
      }
    },
    server: {
      port: 5714, // Changed to 5714 to avoid collision with 5713
      hmr: {
        host: 'localhost',
        port: 5714,
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
      outDir: mode === 'player' ? '../dist-ttrpg/player' : mode === 'referee' ? '../dist-ttrpg/referee' : '../dist-ttrpg',
      emptyOutDir: true
    }
  };
});
