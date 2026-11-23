import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4173',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-viewport', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined :
    { command: 'npm run serve', url: 'http://localhost:4173', reuseExistingServer: false },
});
