const { test, expect } = require('@playwright/test');

test('custom Proficiencies migrate, survive reload and cannot overwrite Core', async ({ page }) => {
    await page.goto('/plugins/t13ne/data/json/proficiencies/Profs/bundles.json');
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            const request = indexedDB.open('T13Codex', 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                db.createObjectStore('files', { keyPath: 'path' });
                const knots = db.createObjectStore('knots', { keyPath: 'id' });
                knots.createIndex('type', 'type');
                knots.createIndex('tags', 'tags', { multiEntry: true });
                knots.put({ id: '9999', type: 'Proficiency', name: 'Legacy custom' });
                knots.put({ id: 'old_engine', type: 'Proficiency', name: 'Legacy named custom' });
                knots.put({ id: '1960', type: 'Proficiency', name: 'Conflicting legacy record' });
            };
            request.onsuccess = () => { request.result.close(); resolve(); };
            request.onerror = () => reject(request.error);
        });

    });

    const ids = await page.evaluate(async () => {
        const { default: codex } = await import('/src/t13ne/modules/codex/CodexLoader.js');
        const legacy = await codex.getProficiency('9999');
        if (legacy?.name !== 'Legacy custom') throw new Error('Legacy custom not migrated');
        if ((await codex.getProficiency('old_engine'))?.name !== 'Legacy named custom') {
            throw new Error('Named legacy custom not migrated');
        }
        const { default: db } = await import('/src/t13ne/modules/codex/CodexDB.js');
        let incompleteRejected = false;
        try {
            await codex.createProficiency({ name: 'Incomplete' }, 'incomplete');
        } catch (error) {
            incompleteRejected = /description/.test(error.message);
        }
        if (!incompleteRejected || await db.getCustomProficiency('incomplete')) {
            throw new Error('Incomplete Proficiency was not rejected cleanly');
        }
        if ((await db.getKnot('1960'))?.name !== 'Conflicting legacy record') {
            throw new Error('Conflicting legacy record was lost');
        }
        if ((await codex.getProficiency('1960'))?.prof?.Name?.[0] !== 'Engine') {
            throw new Error('Legacy conflict replaced Core');
        }
        const [first, second] = await Promise.all([
            codex.createProficiency({ name: 'First custom', description: 'First description', tags: { facets: ['1'] } }),
            codex.createProficiency({ prof: { Name: ['Second custom'], Description: 'Second description', Tags: { Facets: ['1', '2'] } } })
        ]);
        if (first === second) throw new Error('Concurrent IDs collided');
        if (!/^custom-[0-9a-f]{32}$/.test(first)) throw new Error('Expected opaque identifier');
        await codex.createProficiency({ name: 'Named custom', description: 'Description', tags: { facets: ['1'] } }, 'engine_custom');
        await codex.updateProficiency('9999', { name: 'Updated legacy', description: 'Recovered description', tags: { facets: ['1'] } });
        await codex.updateProficiency('engine_custom', { name: 'Updated named custom' });
        await codex.updateProficiency(first, { name: 'Updated custom' });
        await codex.updateProficiency(second, { prof: { Name: ['Updated wrapped'] } });
        let invalid = false;
        try { await codex.updateProficiency(first, { tags: { facets: [] } }); } catch { invalid = true; }
        if (!invalid) throw new Error('Empty Facets were accepted');
        const preserved = await codex.getProficiency(first);
        if (preserved.tags.facets[0] !== '1') throw new Error('Invalid update modified stored data');
        let blocked = false;
        try { await codex.updateProficiency('1960', { name: 'Modified Core' }); } catch { blocked = true; }
        if (!blocked) throw new Error('Core update was accepted');
        return { first, second };
    });

    await page.reload();
    const names = await page.evaluate(async ({ first, second }) => {
        const { default: codex } = await import('/src/t13ne/modules/codex/CodexLoader.js');
        return Promise.all(['9999', 'old_engine', 'engine_custom', first, second].map(async id => {
            const record = await codex.getProficiency(id);
            return record?.name || record?.prof?.Name?.[0];
        }));
    }, ids);
    expect(names).toEqual(['Updated legacy', 'Legacy named custom', 'Updated named custom', 'Updated custom', 'Updated wrapped']);
});

test('independent tabs allocate distinct custom Proficiency IDs', async ({ context }) => {
    const first = await context.newPage();
    const second = await context.newPage();
    const url = '/plugins/t13ne/data/json/proficiencies/Profs/bundles.json';
    await Promise.all([first.goto(url), second.goto(url)]);
    const create = (page, name) => page.evaluate(async name => {
        const { default: codex } = await import('/src/t13ne/modules/codex/CodexLoader.js');
        return codex.createProficiency({ name, description: 'Tab description', tags: { facets: ['1'] } });
    }, name);
    const [a, b] = await Promise.all([create(first, 'Tab one'), create(second, 'Tab two')]);
    expect(a).not.toBe(b);
    await first.reload();
    const names = await first.evaluate(async ids => {
        const { default: codex } = await import('/src/t13ne/modules/codex/CodexLoader.js');
        return Promise.all(ids.map(async id => (await codex.getProficiency(id))?.name));
    }, [a, b]);
    expect(names).toEqual(['Tab one', 'Tab two']);
});

test('Annex Proficiency preserves Facets from wrapped Core records', async ({ page }) => {
    await page.goto('/plugins/t13ne/data/json/proficiencies/Profs/bundles.json');
    const saved = await page.evaluate(async () => {
        const { default: codex } = await import('/src/t13ne/modules/codex/CodexLoader.js');
        const { Annex, TIE } = await import('/src/t13ne/modules/mechanics/t13ne-knots.js');
        const annex = new Annex(codex, {
            name: 'Engine fixture',
            description: 'An engine Annex',
            proficiencies: [{ profId: 1960, knot: TIE.ROOT | TIE.THREAD }]
        });
        const id = await annex.saveAsProficiency();
        return { id, record: await codex.getProficiency(id), associations: annex.knot.serialize() };
    });
    expect(saved.record.tags.facets.length).toBeGreaterThan(0);
    expect(saved.associations.some(([id]) => id === saved.id)).toBe(true);
});
