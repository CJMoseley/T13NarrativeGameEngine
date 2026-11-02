import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('Required runtime assets and configurations are present and valid', async () => {
    // 1. Verify Ammo physics WASM binaries
    const ammoJsPath = path.join(root, 'public/ammo/ammo.wasm.js');
    const ammoWasmPath = path.join(root, 'public/ammo/ammo.wasm.wasm');

    await assert.doesNotReject(access(ammoJsPath, constants.R_OK), 'ammo.wasm.js must be readable in public/ammo/');
    await assert.doesNotReject(access(ammoWasmPath, constants.R_OK), 'ammo.wasm.wasm must be readable in public/ammo/');

    const ammoJsStat = await stat(ammoJsPath);
    const ammoWasmStat = await stat(ammoWasmPath);
    assert.ok(ammoJsStat.size > 100000, 'ammo.wasm.js should be non-trivial binary loader');
    assert.ok(ammoWasmStat.size > 500000, 'ammo.wasm.wasm should be non-trivial wasm binary');

    // 2. Verify Codex Library Master & Bundles
    const bundlesPath = path.join(root, 'src/t13ne/data/json/proficiencies/Profs/bundles.json');
    const masterProfPath = path.join(root, 'src/t13ne/data/json/proficiencies/proficiencies-master.json');

    await assert.doesNotReject(access(bundlesPath, constants.R_OK));
    await assert.doesNotReject(access(masterProfPath, constants.R_OK));

    const bundles = JSON.parse(await readFile(bundlesPath, 'utf8'));
    assert.ok(bundles.bundles && bundles.bundles.length > 0, 'bundles.json must define bundle paths');

    const firstBundlePath = path.join(root, 'src/t13ne/data/json', bundles.bundles[0].path);
    await assert.doesNotReject(access(firstBundlePath, constants.R_OK), 'First proficiency bundle must exist and be readable');

    // 3. Verify Isolated Build Configurations
    const viteConfig = await readFile(path.join(root, 'vite.config.js'), 'utf8');
    assert.ok(viteConfig.includes('dist-build'), 'vite.config.js must direct builds to dist-build');

    const companionViteConfig = await readFile(path.join(root, 'ttrpg-companion/vite.config.js'), 'utf8');
    assert.ok(companionViteConfig.includes('dist-ttrpg'), 'ttrpg-companion vite config must direct builds to dist-ttrpg');
});
