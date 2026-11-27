const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

function getEphemeralSecret() {
  if (process.env.REFREE_SECRET) return process.env.REFREE_SECRET;
  const secretPath = path.resolve(__dirname, '..', 'test-results', '.pw-secret');
  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, 'utf8').trim();
  }
  throw new Error('No REFREE_SECRET or test-results/.pw-secret found for Playwright auth test.');
}

test.describe('TTRPG Companion App', () => {
  test('should verify security gating, challenge-response elevation, and interactive panels', async ({ page }) => {
    await page.goto('/');

    const modeLabel = page.locator('#authModeLabel');
    await expect(modeLabel).toHaveText('player', { ignoreCase: true });

    const authStatusText = page.locator('#authStatusText');
    await expect(authStatusText).toContainText('Restricted');

    let alertMessage = '';
    page.once('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.dismiss();
    });

    await page.locator('#btnGeneratePlot').click();
    await page.waitForTimeout(300);
    expect(alertMessage).toContain('Writing a Plot requires Referee credentials');

    const secret = getEphemeralSecret();
    await page.locator('#authSecretInput').fill(secret);
    await page.locator('#btnElevateAuth').click();
    await expect(authStatusText).toContainText('Authorized (Referee Elevated)', { timeout: 10000 });

    await expect(page.locator('#btnDeElevateAuth')).toBeVisible();
    await page.locator('#btnDeElevateAuth').click();
    await expect(authStatusText).toContainText('Restricted');

    await page.locator('a[data-panel="vtt"]').click();
    await expect(page.locator('#vtt-canvas t13-vtt-canvas')).toBeAttached();
    await expect(page.locator('#cardOrdealHud')).toBeAttached();

    await page.locator('a[data-panel="character"]').click();
    await expect(page.locator('#btnShowCreator')).toBeVisible();
  });
});
