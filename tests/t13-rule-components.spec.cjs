const { test, expect } = require('@playwright/test');

test('rule component drafts survive an IndexedDB upgrade and reload', async ({ page }) => {
    await page.goto('/src/t13ne/data/json/other/rules.json');
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            const request = indexedDB.open('T13Codex', 2);
            request.onupgradeneeded = () => {
                const db = request.result;
                db.createObjectStore('files', { keyPath: 'path' }).put({ path: 'preserved', data: 'existing' });
                db.createObjectStore('knots', { keyPath: 'id' });
                db.createObjectStore('customProficiencies', { keyPath: 'id' });
            };
            request.onsuccess = () => { request.result.close(); resolve(); };
            request.onerror = () => reject(request.error);
        });
    });
    const id = await page.evaluate(async () => {
        const { default: db } = await import('/src/t13ne/modules/codex/CodexDB.js');
        const { default: facets } = await import('/src/t13ne/modules/mechanics/t13ne-facets.js');
        const { RuleCatalog } = await import('/src/t13ne/modules/mechanics/RuleCatalog.js');
        const pages = await (await fetch('/src/t13ne/data/json/other/rules.json')).json();
        const catalog = new RuleCatalog({ facets, codex: { async getData() { return pages; } }, components: db });
        const result = await catalog.createComponent({
            name: 'Numerology', description: 'Optional numerology test modifier.', requirement: 'optional',
            source: { pageId: 'T13-NE-RULE-23', excerpt: 'Optional Rule: If the digits are added together' }
        });
        const updated = await catalog.updateComponent(result.id, {
            description: 'Revised numerology rule.', contexts: ['Dice Test']
        }, result.revision);
        if (updated.revision !== 2) throw new Error('Revision did not advance');
        let conflict = false;
        try {
            await catalog.updateComponent(result.id, { name: 'Stale edit' }, result.revision);
        } catch (error) {
            conflict = /changed/.test(error.message);
        }
        if (!conflict) throw new Error('Stale edit was accepted');
        const concurrent = await catalog.createComponent({
            name: 'Concurrent draft', description: 'Concurrency check.', requirement: 'unclassified',
            source: { pageId: 'T13-NE-RULE-23', excerpt: 'Optional Rule: If the digits are added together' }
        });
        const outcomes = await Promise.allSettled([
            catalog.updateComponent(concurrent.id, { name: 'First edit' }, 1),
            catalog.updateComponent(concurrent.id, { name: 'Second edit' }, 1)
        ]);
        if (outcomes.filter(outcome => outcome.status === 'fulfilled').length !== 1 ||
            outcomes.filter(outcome => outcome.status === 'rejected').length !== 1) {
            throw new Error('Concurrent edits were not checked atomically');
        }
        if (await db.getFile('preserved') !== 'existing') throw new Error('Upgrade lost existing data');
        return result.id;
    });
    await page.reload();
    const saved = await page.evaluate(async id => {
        const { default: db } = await import('/src/t13ne/modules/codex/CodexDB.js');
        return (await db.listRuleComponents()).find(component => component.id === id);
    }, id);
    expect(saved).toMatchObject({
        name: 'Numerology', requirement: 'optional', status: 'draft', verification: 'unverified',
        description: 'Revised numerology rule.', contexts: ['Dice Test'], revision: 2,
        source: { pageId: 'T13-NE-RULE-23', excerpt: 'Optional Rule: If the digits are added together' }
    });
});
