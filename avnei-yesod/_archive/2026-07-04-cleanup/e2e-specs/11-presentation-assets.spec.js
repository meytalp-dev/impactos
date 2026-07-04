// Presentation assets — capture 4 high-res screenshots for Liron's presentation slide.
// Outputs straight to /c/Users/meyta/Downloads/impactso/site/avnei-board-assets/
// Runs desktop project only (presentation viewer is desktop). Run with:
//   npx playwright test 11-presentation-assets.spec.js --project=desktop-chrome
const { test } = require('@playwright/test');
const path = require('path');
const { bypassPin } = require('./helpers');

// Absolute output dir in Liron's repo
const OUT = 'c:/Users/meyta/Downloads/impactso/site/avnei-board-assets';

test.describe('Presentation assets — 4 screenshots for Liron presentation', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  // Helper: skip the intro/welcome screen of a stage-3 game to land on actual gameplay
  async function enterGameplay(page) {
    // Try common intro CTA texts; whichever matches first wins
    const intro = page.locator('button:has-text("נתחיל"), button:has-text("התחילו"), button:has-text("נחזור"), a:has-text("נתחיל"), a:has-text("התחילו"), a:has-text("נחזור")').first();
    try {
      await intro.click({ timeout: 3000 });
      await page.waitForTimeout(800);
    } catch (e) {
      // No intro — already on gameplay
    }
  }

  test('1) game-phonological.png · stage-3-trail-resh gameplay (אות ר · bubbles)', async ({ page }) => {
    await page.goto('/underwater-app/stage-3-trail-resh.html');
    await page.waitForLoadState('networkidle');
    await enterGameplay(page);
    await page.waitForTimeout(1000); // let bubbles animate in
    await page.screenshot({
      path: path.join(OUT, 'game-phonological.png'),
      fullPage: false,
    });
  });

  test('2) game-shell.png · stage-3-shell gameplay (אות מ · cards)', async ({ page }) => {
    await page.goto('/underwater-app/stage-3-shell.html');
    await page.waitForLoadState('networkidle');
    await enterGameplay(page);
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUT, 'game-shell.png'),
      fullPage: false,
    });
  });

  test('3) teacher-day-groups-main.png · teacher-action.html?presentation=1 (auto-seed)', async ({ page }) => {
    await bypassPin(page);
    // Visit seed-demo with autoseed → it redirects to teacher-action.html?presentation=1
    await page.goto('/underwater-app/seed-demo.html?autoseed=1');
    // Wait for the redirect to land
    await page.waitForURL(/teacher-action\.html\?presentation=1/, { timeout: 10_000 });
    await page.waitForLoadState('networkidle');
    // Allow render() to populate cards
    await page.locator('#kpiGrid .ta-kpi').first().waitFor({ timeout: 8_000 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(OUT, 'teacher-day-groups-main.png'),
      fullPage: true,
    });
  });

  test('4) rama-dashboard-clean.png · teacher-rama.html (post-seed)', async ({ page }) => {
    await bypassPin(page);
    // Seed first (reuses seedDemo from autoseed flow), then navigate to teacher-rama
    await page.goto('/underwater-app/seed-demo.html?autoseed=1');
    await page.waitForURL(/teacher-action\.html\?presentation=1/, { timeout: 10_000 });
    // Now navigate to teacher-rama (data is already seeded)
    await page.goto('/underwater-app/teacher-rama.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(OUT, 'rama-dashboard-clean.png'),
      fullPage: true,
    });
  });
});
