import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const clientMode = mode === 'player' ? 'player' : mode === 'referee' ? 'referee' : 'development';
  return {
    base: './',
    publicDir: 'public',
    define: {
      'import.meta.env.VITE_CLIENT_MODE': JSON.stringify(clientMode)
    },
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
            src: 'src/t13ne/data',
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
      port: 5713, // Changed to standard T13 port 5713
      hmr: {
        host: 'localhost',
        port: 5713,
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
      outDir: mode === 'player' ? 'dist/player' : mode === 'referee' ? 'dist/referee' : 'dist'
    }
  };
});
