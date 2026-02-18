const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const logFilePath = path.join('C:\\Users\\chris\\.gemini\\tmp\\ff16040508f1dd9d8e4dd48d67076840d58ef9cf522e340764273e8ecd0a4833', 'console_logs.txt');

// Clear the log file at the beginning of the test run
if (fs.existsSync(logFilePath)) {
  fs.unlinkSync(logFilePath);
}

test('Verify Full Application Flow', async ({ page }) => {
  // Listen for all console events and append them to the log file
  page.on('console', msg => {
    const logMessage = `[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}\n`;
    fs.appendFileSync(logFilePath, logMessage);
  });

  // 1. Go to the application
  await page.goto('http://localhost:5173');

  // 2. Wait for the main menu to appear, confirming the initial load is successful
  const mainMenuLocator = page.locator('#mainMenu'); // CORRECTED ID
  await expect(mainMenuLocator).toBeVisible({ timeout: 15000 });

  // 3. Click the "Galaxy Map" button
  await page.click('button:has-text("Galaxy Map")');

  // 4. Wait for the galaxy map canvas to be present in the DOM.
  const galaxyCanvasLocator = page.locator('#galaxy-map-view canvas');
  await expect(galaxyCanvasLocator).toBeVisible({ timeout: 10000 });

  // 5. Take a screenshot for final visual verification.
  await page.screenshot({ path: 'test-results/verification.png' });
});
