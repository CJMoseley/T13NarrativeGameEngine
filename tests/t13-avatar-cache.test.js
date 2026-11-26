import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
    AvatarCache,
    avatarCacheKey,
    flattenRaceAvatarRoster,
    sharedAvatarEngine
} from '../src/t13ne/procgen/avatar/AvatarCache.js';
import { makeHumanoidVariant } from '../src/t13ne/procgen/avatar/AvatarEngine.js';
import { FACET_INDEX } from '../src/t13ne/procgen/avatar/AvatarFacetBody.js';
import { BODY_PLANS } from '../src/t13ne/procgen/avatar/BodyPlanSchema.js';
import { AvatarSkinPainter } from '../src/t13ne/procgen/avatar/AvatarSkinPainter.js';
import { ATLAS_SIZE } from '../src/t13ne/procgen/avatar/AvatarAtlas.js';

test('avatarCacheKey hashes body plan, seed, and facet boons deterministically', () => {
    const v1 = makeHumanoidVariant('pilot-1', { facetBoons: { [FACET_INDEX.BURDEN]: 20 } });
    const v2 = makeHumanoidVariant('pilot-1', { facetBoons: { [FACET_INDEX.BURDEN]: 20 } });
    const v3 = makeHumanoidVariant('pilot-1', { facetBoons: { [FACET_INDEX.BURDEN]: 8 } });
    assert.equal(avatarCacheKey(BODY_PLANS.HUMANOID, { seed: 'pilot-1', variant: v1 }), avatarCacheKey(BODY_PLANS.HUMANOID, { seed: 'pilot-1', variant: v2 }));
    assert.notEqual(avatarCacheKey(BODY_PLANS.HUMANOID, { seed: 'pilot-1', variant: v1 }), avatarCacheKey(BODY_PLANS.HUMANOID, { seed: 'pilot-1', variant: v3 }));
    assert.notEqual(avatarCacheKey(BODY_PLANS.HUMANOID, { seed: 'pilot-1', variant: v1 }), avatarCacheKey(BODY_PLANS.WINGED, { seed: 'pilot-1', variant: v1 }));
    assert.equal(avatarCacheKey(BODY_PLANS.HUMANOID, { variant: { atlasPixels: new Uint8Array(ATLAS_SIZE * ATLAS_SIZE * 4) } }), null);
});

test('AvatarCache serves isolated SkinnedMesh clones and enforces LRU maxEntries', async () => {
    for (const CacheClass of [AvatarCache]) {
        const cache = new CacheClass({ maxEntries: 3 });
        const variant = makeHumanoidVariant('crew-engineer');
        const first = await cache.generate(BODY_PLANS.HUMANOID, { seed: 'crew-engineer', variant });
        const second = await cache.generate(BODY_PLANS.HUMANOID, { seed: 'crew-engineer', variant });

        assert.equal(cache.stats().misses, 1);
        assert.equal(cache.stats().hits, 1);
        assert.notEqual(first, second);
        assert.notEqual(first.skeleton, second.skeleton);
        assert.notEqual(first.material.map, second.material.map);
        assert.notEqual(first.userData.avatarAtlas.pixels, second.userData.avatarAtlas.pixels);

        // Attaching both to scenes, painting one, and disposing one leaves the sibling intact
        const sceneA = new THREE.Scene();
        const sceneB = new THREE.Scene();
        sceneA.add(first);
        sceneB.add(second);
        assert.equal(first.parent, sceneA);
        assert.equal(second.parent, sceneB);

        const rect = first.userData.avatarAtlas.regions['head:skin'];
        const hit = { object: first, uv: new THREE.Vector2((rect.x + 2.5) / ATLAS_SIZE, 1 - (rect.y + 2.5) / ATLAS_SIZE) };
        const beforeSecond = new Uint8Array(second.userData.avatarAtlas.pixels);
        assert.equal(new AvatarSkinPainter(first).paint(hit, { colour: 0x00ff00, radius: 1 }), true);
        assert.deepEqual(second.userData.avatarAtlas.pixels, beforeSecond, 'painting first clone does not mutate second clone');

        first.geometry.dispose();
        first.material.map.dispose();
        first.material.dispose();

        // LRU eviction at maxEntries = 3
        await cache.generate(BODY_PLANS.QUADRUPED, { seed: 'q1', variant: {} });
        await cache.generate(BODY_PLANS.SPIDER, { seed: 's1', variant: {} });
        assert.equal(cache.size, 3);
        await cache.generate(BODY_PLANS.AVIAN, { seed: 'a1', variant: {} });
        assert.equal(cache.size, 3);
        cache.clear();
        assert.equal(cache.size, 0);
    }
});

test('prewarmRoster warms multi-crew ships and 100 race characters cleanly', async () => {
    const cache = new AvatarCache({ engine: sharedAvatarEngine, maxEntries: 160 });
    const ships = Array.from({ length: 5 }, (_, s) => ({
        id: `ship-${s}`,
        crew: ['pilot', 'navigator', 'engineer', 'weapons'].map(role => ({
            name: `ship-${s}-${role}`,
            charType: 'Crew',
            incarna: role === 'engineer' ? 'Craft' : 'Nature',
            facetweb: { Stats: [{ Facet: FACET_INDEX.BURDEN, Facet_Boon: 10 + s, Antifacet: FACET_INDEX.GOSSAMER, Antifacet_Boon: 16 - s }] }
        }))
    }));
    const racers = Array.from({ length: 80 }, (_, i) => ({
        name: `racer-${i}`,
        species: i % 4 === 0 ? { name: 'Arachnid', bodyPlan: 'Spider' } : { name: 'Human' },
        facetweb: { Stats: [{ Facet: 2, Facet_Boon: 13, Antifacet: FACET_INDEX.NATURE, Antifacet_Boon: 12 + (i % 4) }] }
    }));

    const flat = flattenRaceAvatarRoster({ ships, racers });
    assert.equal(flat.length, 100);

    const firstPass = await cache.prewarmRoster({ ships, racers });
    assert.equal(firstPass.total, 100);
    assert.equal(firstPass.warmed, 100);
    assert.equal(firstPass.cacheHits, 0);
    assert.equal(cache.size, 100);

    const secondPass = await cache.prewarmRoster({ ships, racers });
    assert.equal(secondPass.warmed, 0);
    assert.equal(secondPass.cacheHits, 100);
    assert.ok(secondPass.durationMs < firstPass.durationMs, `cached prewarm (${secondPass.durationMs.toFixed(2)} ms) is faster than cold generation (${firstPass.durationMs.toFixed(2)} ms)`);
    cache.clear();
});
