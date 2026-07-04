// אי ת (תיבת האוצר) — stage-3-tav.html · smoke + מעבר סבב מלא.
// מאמת: טעינה בלי שגיאות JS · 5 סבבים (אות + 4 צירופי CV) · completion ·
// אירועי rescue/cv-tap נכתבים (cv-tap עם target_phoneme_group — חובה ל-BKT פר-צירוף).
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

test.describe('אי ת · תיבת האוצר (stage-3-tav)', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
    });
  });

  test('loads clean: no critical JS errors, config + mechanic ready', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
    });
    await page.goto('/underwater-app/stage-3-tav.html');
    await page.waitForLoadState('domcontentloaded');

    // הקונפיג נטען והכותרת התעדכנה מה-JSON
    await expect(page.locator('#tapToStart h2')).toHaveText(/תֵּבַת הָאוֹצָר/);
    // המכניקה החדשה רשומה + vowel-adapter נטען
    const ready = await page.evaluate(() =>
      !!(window.AvneiMechanics && window.AvneiMechanics['pick-cv']) &&
      !!(window.AvneiVowelAdapter && window.AvneiVowelAdapter.buildCV('ת', 'kamatz')));
    expect(ready).toBe(true);

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });

  test('full playthrough: 5 rounds → completion + BKT events', async ({ page }) => {
    // 5 סבבים × INTER_ROUND_DELAY 2800ms + פינאלה ~4.7s — צפוף ל-30s
    // באמולציית מובייל. הזרימה עצמה מהירה יותר אצל ילד.ה אמיתי.ת.
    test.setTimeout(90_000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
    });

    await page.goto('/underwater-app/stage-3-tav.html');
    await page.locator('#startBtn').click();

    for (let i = 0; i < 5; i++) {
      const target = page.locator('.pick-pod[data-target="true"]').first();
      await target.waitFor({ state: 'visible', timeout: 10_000 });
      await target.click();
      // just-done: המנעול של הסבב התמלא
      await expect(page.locator(`[data-shell-slot="${i}"]`)).toHaveClass(/filled/);
      if (i < 4) {
        // המתנה לסבב הבא (INTER_ROUND_DELAY 2800ms) — פודים טריים בלי .picked
        await page.waitForFunction(() => {
          const pods = document.querySelectorAll('.pick-pod');
          return pods.length > 0 &&
            ![...pods].some((p) => p.classList.contains('picked'));
        }, { timeout: 10_000 });
      }
    }

    // finale (praise+finale audio ~4s) → completion overlay
    await expect(page.locator('#completion')).toHaveClass(/show/, { timeout: 15_000 });

    // אירועים: סבב 1 = rescue (דפוס stage-3-lamed), סבבים 2-5 = cv-tap
    // עם target_phoneme_group (בלעדיו BKT פר-צירוף מדלג).
    const summary = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('underwater-app:v1') || '{}');
      const evts = (s.events || []).filter((e) => e.target_letter === 'ת');
      return {
        rescue: evts.filter((e) => e.activity_type === 'rescue').length,
        cvTap: evts.filter((e) => e.activity_type === 'cv-tap').length,
        cvWithGroup: evts.filter((e) =>
          e.activity_type === 'cv-tap' && !!e.target_phoneme_group).length,
        correct: evts.filter((e) => e.is_correct).length,
      };
    });
    expect(summary.rescue).toBeGreaterThanOrEqual(1);
    expect(summary.cvTap).toBeGreaterThanOrEqual(4);
    expect(summary.cvWithGroup).toBe(summary.cvTap);
    expect(summary.correct).toBeGreaterThanOrEqual(5);

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });
});
