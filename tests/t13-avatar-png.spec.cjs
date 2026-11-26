const { test, expect } = require('@playwright/test');

test('model maker exports and imports a PNG without claiming layout compatibility', async ({ page }) => {
    await page.goto('/src/t13ne/procgen/avatar/AvatarAtlasIO.js');
    const png = await page.evaluate(async () => {
        const { AvatarModelMaker } = await import('/src/t13ne/procgen/avatar/AvatarModelMaker.js');
        const { atlasToPngBlob } = await import('/src/t13ne/procgen/avatar/AvatarAtlasIO.js');
        document.body.innerHTML = '';
        const maker = new AvatarModelMaker();
        maker.open();
        window.maker = maker;
        const rect = maker.mesh.userData.avatarAtlas.regions['head:skin'];
        const offset = ((rect.y + 4) * 512 + rect.x + 4) * 4;
        maker.mesh.userData.avatarAtlas.pixels.set([18, 52, 86, 255], offset);
        const blob = await atlasToPngBlob(maker.mesh.userData.avatarAtlas.pixels);
        maker.mesh.userData.avatarAtlas.pixels.fill(0);
        return Array.from(new Uint8Array(await blob.arrayBuffer()));
    });

    let warning = '';
    page.on('dialog', async dialog => {
        warning = dialog.message();
        await dialog.accept();
    });
    await page.locator('input[accept=".png,image/png"]').setInputFiles({
        name: 'skin.png', mimeType: 'image/png', buffer: Buffer.from(png)
    });
    await expect(page.getByRole('status')).toHaveText('Skin imported.');
    expect(warning).toContain('do not contain body-plan or atlas layout information');
    expect(await page.evaluate(() => {
        const atlas = window.maker.mesh.userData.avatarAtlas;
        const rect = atlas.regions['head:skin'];
        const offset = ((rect.y + 4) * 512 + rect.x + 4) * 4;
        return { pixel: Array.from(atlas.pixels.slice(offset, offset + 4)), dirty: window.maker.dirty };
    })).toEqual({ pixel: [18, 52, 86, 255], dirty: true });

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save skin PNG' }).click();
    expect((await download).suggestedFilename()).toBe('avatar-skin.png');
    await expect(page.getByRole('status')).toContainText('preserve layout information');
    expect(await page.evaluate(() => window.maker.dirty)).toBe(true);
    await page.evaluate(() => window.maker.close(true));
});

test('default drag orbits, paint reaches the back, and undo restores the stroke', async ({ page }) => {
    await page.goto('/src/t13ne/procgen/avatar/AvatarAtlasIO.js');
    await page.evaluate(async () => {
        const { AvatarModelMaker } = await import('/src/t13ne/procgen/avatar/AvatarModelMaker.js');
        document.body.innerHTML = '';
        window.maker = new AvatarModelMaker();
        window.maker.open();
    });
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    const before = await page.evaluate(() => window.maker.camera.position.toArray());
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + box.width * 0.49, y, { steps: 20 });
    await page.mouse.up();
    const after = await page.evaluate(() => window.maker.camera.position.toArray());
    expect(after[2]).toBeLessThan(before[2]);
    expect(await page.evaluate(() => window.maker.mesh.userData.avatarAtlas.pixels.slice())).toBeDefined();
    await page.getByRole('button', { name: 'Paint', exact: true }).click();
    await page.locator('input[type=color]').fill('#ff00ff');
    const previous = await page.evaluate(() => Array.from(window.maker.mesh.userData.avatarAtlas.pixels));
    await page.mouse.click(x, y);
    expect(await page.evaluate(old => window.maker.mesh.userData.avatarAtlas.pixels.some((p, i) => p !== old[i]), previous)).toBe(true);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    expect(await page.evaluate(old => window.maker.mesh.userData.avatarAtlas.pixels.every((p, i) => p === old[i]), previous)).toBe(true);
    await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
    await page.evaluate(() => window.maker.close(true));
});
