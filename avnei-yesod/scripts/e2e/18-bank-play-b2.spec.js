// נגן הבנק (stage-bank-play) — אימות מדיה B2 (4.7.2026).
// B1 דילג על שאלות בלי נכסים; B2 השלים: bank-w-hivhil + bank-w-on (QA Whisper)
// + תמונות stem לילד/ילדה (reuse assets/vocab דרך questions-grade1.json).
// מאמת: jan-w2-d1 = 9/9 (הִבְהִיל חזר) · jan-w2-d3 = 6/6 עם stem-תמונה ·
// יום יֵשׁ/אֵין = 9/9 מאז B3ב: המסיח יָשׁ הוחלף ב-יוֹשׁ (מיטל 4.7.2026 —
// /yash/ ו-/yesh/ לא מובחנים גם לאוזן אנושית) ו-apr-w4-d1-c2-L1 חזרה לנגן.
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

async function startRound(page, unitKey, expectTotal) {
  await page.goto('/underwater-app/stage-bank-play.html?unitKey=' + unitKey + '&tag=בדיקה');
  await page.locator('#startBtn').click();
  await expect(page.locator('#counter')).toHaveText('1 / ' + expectTotal, { timeout: 10_000 });
}

async function playThrough(page, expectTotal) {
  for (let i = 1; i <= expectTotal; i++) {
    const tile = page.locator('.mcq-option[data-correct="1"]').first();
    await tile.waitFor({ state: 'visible', timeout: 10_000 });
    await tile.click();
    // אריח שמע = two-tap: הקשה 1 האזנה, הקשה 2 בחירה
    const isAudio = await tile.evaluate((el) => el.classList.contains('mcq-option--audio'));
    if (isAudio) await tile.click();
    if (i < expectTotal) {
      await expect(page.locator('#counter')).toHaveText((i + 1) + ' / ' + expectTotal, { timeout: 15_000 });
    }
  }
  await expect(page.locator('.finish h2')).toHaveText(/כָּל הַכָּבוֹד/, { timeout: 15_000 });
}

test.describe('נגן הבנק · מדיה B2', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
    });
  });

  test('jan-w2-d1: כל 9 השאלות נטענות (הִבְהִיל חזר) + סבב מלא', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

    await startRound(page, 'jan-w2-d1', 9);
    await playThrough(page, 9);

    // אירועי BKT/EPA נרשמו תחת characteristic_id (חוזה G4)
    const logged = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('underwater-app:v1') || '{}');
      const evts = (s.events || []).filter((e) =>
        String(e.characteristic_id || '').indexOf('jan-w2-d1') === 0);
      return { total: evts.length, correct: evts.filter((e) => e.is_correct).length };
    });
    expect(logged.total).toBeGreaterThanOrEqual(9);
    expect(logged.correct).toBeGreaterThanOrEqual(9);
    expect(errors).toEqual([]);
  });

  test('jan-w2-d3: תמונות stem מ-assets/vocab + סבב מלא 6/6', async ({ page }) => {
    test.setTimeout(120_000);
    await startRound(page, 'jan-w2-d3', 6);
    // השאלה הראשונה (L1, image_to_word) — stem תמונה אמיתית, לא כרטיס טקסט
    await expect(page.locator('img[src*="assets/vocab/"]').first()).toBeVisible({ timeout: 10_000 });
    await playThrough(page, 6);
  });

  test('יום יֵשׁ/אֵין: יוֹשׁ החליף את יָשׁ — ‏9 מתוך 9', async ({ page }) => {
    test.setTimeout(120_000);
    await startRound(page, 'apr-w4-d1-c2,apr-w4-d2-c1,apr-w4-d2-c2', 9);
    await playThrough(page, 9);
  });
});
