const { test, expect } = require('@playwright/test');

test.describe('T13 TTRPG Companion Portal - Mode and Authorization Flow', () => {

  test('Should load player mode, display restricted status, and allow referee elevation', async ({ page }) => {
    // 1. Navigate to the TTRPG companion client on port 5714
    await page.goto('/');

    // 2. Assert page title or major heading exists
    await expect(page).toHaveTitle(/T13 TTRPG Companion/i);

    // 3. Locate the client mode labels and check that they default to Restricted Player
    // Use an extended timeout of 15 seconds to allow the T13NE engine start and setupAuthUI compilation
    const authModeLabel = page.locator('#authModeLabel');
    await expect(authModeLabel).toHaveText(/player/i, { timeout: 15000 });

    const authStatusText = page.locator('#authStatusText');
    await expect(authStatusText).toHaveText(/Restricted \(Read-Only Player\)/i);

    // 4. Enforce write access block validation locally
    // Trigger "Cascade New Plot Thread" button and expect permission warning alert dialog
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Writing a Plot requires Referee credentials');
      await dialog.dismiss();
    });
    // Force click to bypass full-screen 3D VTT canvas hit-test interception
    await page.click('#btnGeneratePlot', { force: true });

    // 5. Elevate credentials to Referee using the Bearer Secret Token
    const secretInput = page.locator('#authSecretInput');
    await expect(secretInput).toBeVisible();
    await secretInput.fill('DEV_SUPER_SECRET_KEY');

    // Click "Elevate to Referee" (forced to bypass overlay)
    await page.click('#btnElevateAuth', { force: true });

    // 6. Assert status successfully elevates to Authorized Referee Elevated
    await expect(authStatusText).toHaveText(/Authorized \(Referee Elevated\)/i);

    // Form should hide and de-elevate button container should appear
    await expect(secretInput).not.toBeVisible();
    await expect(page.locator('#btnDeElevateAuth')).toBeVisible();

    // 7. Verify dynamic panels are correctly displayed and accessible
    const vttNavLink = page.locator('a[data-panel="vtt"]');
    await vttNavLink.click({ force: true });
    await expect(page.locator('#view-vtt')).toHaveClass(/active/);

    const charNavLink = page.locator('a[data-panel="character"]');
    await charNavLink.click({ force: true });
    await expect(page.locator('#view-character')).toHaveClass(/active/);

    // 8. Capture visual verification screenshot
    await page.screenshot({ path: 'test-results/companion_verification.png', fullPage: true });
    console.log('[PLAYWRIGHT TEST] Completed companion portal authorization elevation verification successfully.');
  });
});
