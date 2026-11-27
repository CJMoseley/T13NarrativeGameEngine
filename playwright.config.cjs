const { defineConfig, devices, chromium } = require('@playwright/test');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function resolveChromiumExecutable() {
  const defaultExe = chromium.executablePath();
  if (defaultExe && fs.existsSync(defaultExe)) return undefined;
  const cacheRoot = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (fs.existsSync(cacheRoot)) {
    const dirs = fs.readdirSync(cacheRoot)
      .filter((d) => /^chromium_headless_shell-\d+$/.test(d))
      .sort()
      .reverse();
    for (const d of dirs) {
      const candidate = path.join(cacheRoot, d, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe');
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  return fs.existsSync(chromeExe) ? chromeExe : undefined;
}

const fallbackExecutablePath = resolveChromiumExecutable();

const secretFile = path.resolve(__dirname, 'test-results', '.pw-secret');
fs.mkdirSync(path.dirname(secretFile), { recursive: true });
let refSecret = process.env.REFREE_SECRET;
if (!refSecret) {
  if (process.env.TEST_WORKER_INDEX !== undefined && fs.existsSync(secretFile)) {
    refSecret = fs.readFileSync(secretFile, 'utf8').trim();
  } else {
    refSecret = crypto.randomBytes(24).toString('hex');
    fs.writeFileSync(secretFile, refSecret, 'utf8');
  }
}
process.env.REFREE_SECRET = refSecret;

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'line',
  timeout: 45000,
  use: {
    baseURL: 'http://localhost:5714',
    trace: 'on-first-retry',
    headless: true
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(fallbackExecutablePath ? { launchOptions: { executablePath: fallbackExecutablePath } } : {})
      }
    }
  ],
  webServer: [
    {
      command: 'node server/index.js',
      url: 'http://localhost:5713/health',
      reuseExistingServer: false,
      env: {
        ...process.env,
        REFREE_SECRET: refSecret
      },
      timeout: 20000
    },
    {
      command: 'npx vite -c ttrpg-companion/vite.config.js --port 5714 --mode player',
      url: 'http://localhost:5714',
      reuseExistingServer: false,
      timeout: 30000
    }
  ]
});
