// F.21E presentation screenshots — 3 images לטליה/מנח״י via Liron's deck.
// Captures the LATEST v1 state (Assistant font · "פתחי תרגול לכיתה" ·
// "פתחי תרגול אישי (איתך)" · 🖨️ הדפיסי pill in modal header).
//
// Run from c:/Users/meyta/Downloads/impactos/avnei-yesod/scripts/e2e:
//   npx playwright test 12-f21e-presentation-screenshots.spec.js --project=desktop-chrome
//
// Requires the local server (python -m http.server 8765 in underwater-app/) to be running.
//
// Outputs to c:/Users/meyta/Downloads/ (so user can drag straight to orchestrator).

const { test } = require('@playwright/test');
const path = require('path');
const { bypassPin } = require('./helpers');

const OUT = 'c:/Users/meyta/Downloads';

test.describe('F.21E v1 presentation screenshots', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ page }) => {
    // Seed via the in-app demo-seeder (same data shown in earlier screenshots).
    await page.goto('/seed-demo.html');
    await page.click('#seedOnlyBtn');
    await page.waitForTimeout(400);
    // Now register PIN bypass for subsequent navigations.
    await bypassPin(page);
  });

  test('1) dashboard overview — F21E-dashboard.png', async ({ page }) => {
    await page.goto('/teacher-action.html');
    await page.waitForLoadState('networkidle');
    // Wait for action list to populate (render() finishes).
    await page.waitForSelector('button[data-open-group="0"]', { timeout: 10_000 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(OUT, 'F21E-dashboard.png'),
      fullPage: true,
    });
  });

  test('2) modal top — F21E-modal-top.png (🖨️ הדפיסי pill in header)', async ({ page }) => {
    await page.goto('/teacher-action.html');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('button[data-open-group="0"]', { timeout: 10_000 });
    await page.click('button[data-open-group="0"]');
    await page.waitForSelector('.iv-modal-backdrop', { timeout: 5_000 });
    // Ensure scrolled to top inside the modal.
    await page.evaluate(() => {
      const m = document.querySelector('.iv-modal');
      if (m) m.scrollTop = 0;
    });
    await page.waitForTimeout(400);
    // Screenshot just the modal element — clean isolation, no dim backdrop noise.
    await page.locator('.iv-modal').screenshot({
      path: path.join(OUT, 'F21E-modal-top.png'),
    });
  });

  test('3) modal bottom — F21E-modal-bottom.png (clean iv-actions row)', async ({ page }) => {
    await page.goto('/teacher-action.html');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('button[data-open-group="0"]', { timeout: 10_000 });
    await page.click('button[data-open-group="0"]');
    await page.waitForSelector('.iv-modal-backdrop', { timeout: 5_000 });
    // Scroll modal internal scrollbar to its bottom.
    await page.evaluate(() => {
      const m = document.querySelector('.iv-modal');
      if (m) m.scrollTop = m.scrollHeight;
    });
    await page.waitForTimeout(400);
    await page.locator('.iv-modal').screenshot({
      path: path.join(OUT, 'F21E-modal-bottom.png'),
    });
  });
});
