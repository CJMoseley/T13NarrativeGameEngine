const { test, expect } = require('@playwright/test');

test('Full System Integration Test', async ({ page }) => {
  test.setTimeout(120000);
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto('http://localhost:5174');
  await page.waitForSelector('.nav-link', { timeout: 30000 });

  // 1. Verify Unified VTT
  console.log('Verifying VTT Transition...');
  await page.click('a[data-panel="vtt"]');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'test-results/final_vtt_view.png' });

  // 2. Verify Story Mode Activation
  console.log('Verifying Story Mode Activation...');
  await page.click('#btnToggleStoryMode');
  await page.waitForTimeout(5000);
  const status = await page.textContent('#storyModeStatus');
  console.log('Story Mode Status:', status);

  // 3. Verify Author Mode Workbench
  console.log('Verifying Author Mode Workbench...');
  await page.click('a[data-panel="author"]');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'test-results/final_author_workbench.png' });
});
