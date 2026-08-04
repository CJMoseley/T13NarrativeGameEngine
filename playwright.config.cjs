const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run sequentially for predictable state updates
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5714',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  webServer: [
    {
      command: 'node server/index.js',
      url: 'http://localhost:5713/health',
      reuseExistingServer: true,
      timeout: 15000,
    },
    {
      command: 'npx vite -c ttrpg-companion/vite.config.js --port 5714 --mode player',
      url: 'http://localhost:5714',
      reuseExistingServer: true,
      timeout: 20000,
    }
  ]
});
