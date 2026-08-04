const { test, expect } = require('@playwright/test');

test('Debug Console Logs', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[BROWSER PAGE ERROR] ${err.toString()}`));

  console.log('[TEST] Navigating to http://localhost:5714 ...');
  await page.goto('/');
  console.log('[TEST] Navigated. Waiting 12 seconds...');
  await page.waitForTimeout(12000);

  const authPanelExists = await page.locator('#authPanel').count();
  console.log(`[TEST] #authPanel count: ${authPanelExists}`);
});
