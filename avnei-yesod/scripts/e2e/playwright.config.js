// Playwright config — Avnei Yesod E2E (Agent 28)
// Tests run sequentially (fullyParallel: false) because localStorage state is shared per origin.

const { devices } = require('@playwright/test');

module.exports = {
  testDir: '.',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:8765',
    headless: true,
    viewport: { width: 1280, height: 720 },
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-iphone',
      use: { ...devices['iPhone 12'] },
    },
  ],
};
