import { defineConfig, normalizePath } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const canonicalEngineDir = normalizePath(path.resolve(__dirname, '../src/t13ne'));
const legacyCompanionEngineDir = normalizePath(path.resolve(__dirname, 'src/t13ne'));

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
      {
        name: 'canonical-t13ne-resolver',
        enforce: 'pre',
        resolveId(source, importer) {
          if (source.startsWith('/src/t13ne/')) {
            return `${canonicalEngineDir}${source.slice('/src/t13ne'.length)}`;
          }
          const cleanImporter = importer ? importer.split('?')[0] : null;
          const candidate = source.startsWith('.') && cleanImporter && !cleanImporter.startsWith('\0')
            ? normalizePath(path.resolve(path.dirname(cleanImporter), source))
            : normalizePath(source);
          if (candidate.startsWith(`${legacyCompanionEngineDir}/`)) {
            return `${canonicalEngineDir}${candidate.slice(legacyCompanionEngineDir.length)}`;
          }
          return null;
        }
      },
      viteStaticCopy({
        targets: [
          {
            // Copy the project's physics binary helper.
            src: normalizePath(path.resolve(__dirname, '../public/ammo/ammo.wasm.js')),
            dest: 'libs'
          },
          {
            src: normalizePath(path.resolve(__dirname, '../public/ammo/ammo.wasm.wasm')),
            dest: 'libs'
          },
          {
            // Copy the T13NE engine data directory so that the companion dev server can load the library codex
            src: normalizePath(path.resolve(__dirname, '../src/t13ne/data')),
            dest: 'plugins/t13ne'
          }
        ]
      })
    ],
    resolve: {
      alias: [
        // Regex alias runs before Vite's root-slash file lookup so '/src/t13ne/*' always resolves
        // to the canonical root '../src/t13ne' rather than any legacy copy under ttrpg-companion/src/t13ne.
        { find: /^\/src\/t13ne(\/.*)?$/, replacement: `${normalizePath(path.resolve(__dirname, '../src/t13ne'))}$1` },
        { find: 'three', replacement: path.resolve(__dirname, '../node_modules/three') },
        { find: '@plugins', replacement: path.resolve(__dirname, '../plugins') },
        { find: '@', replacement: path.resolve(__dirname, '..') }
      ]
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
