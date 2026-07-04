// אי ש (מִשְׁפְּחוֹת הַדְּגִיגִים) — stage-3-shin.html · smoke + מעבר מלא.
// מאמת: טעינה בלי שגיאות JS · 5 סבבים של צַיִד-בִּתְנוּעָה (2+2+3+3+3 דגי-יעד,
// אות מסיחה שונה פר סבב) · טעות = נענוע בלבד (הדג ממשיך) · completion ·
// אירועי swim-hunt נכתבים עם target_letter (חובה ל-EPA) + primary_island_id 3.
//
// הערה: הדגים בתנועה מתמדת (rAF) וייתכן שדג נמצא רגעית מחוץ למסך (wrap —
// "דג שיוצא מהמסך חוזר מהצד השני", כך מתוכנן). click רגיל של Playwright
// נתקע על "element is stable"/"outside viewport", לכן dispatchEvent —
// מפעיל את ה-listener ישירות ומאמת את הלוגיקה (הוויזואליה מאומתת ב-smoke).
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

const TARGET = 'שׁ'; // שי"ן ימנית עם נקודה — הצורה שעל דגי-היעד

async function clickNextTargetFish(page) {
  const fish = page
    .locator('.swim-fish:not(.found)', { hasText: TARGET })
    .first();
  await fish.waitFor({ state: 'attached', timeout: 10_000 });
  await fish.dispatchEvent('click');
}

test.describe('אי ש · מִשְׁפְּחוֹת הַדְּגִיגִים (stage-3-shin)', () => {
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
    await page.goto('/underwater-app/stage-3-shin.html');
    await page.waitForLoadState('domcontentloaded');

    // הקונפיג נטען והכותרת התעדכנה מה-JSON
    await expect(page.locator('#tapToStart h2')).toHaveText(/מִשְׁפְּחוֹת הַדְּגִיגִים/);
    // הכותרת העליונה מציגה שׁ עם נקודת השי"ן הימנית
    await expect(page.locator('#ucLetter')).toHaveText('שׁ');
    // המכניקה החדשה רשומה
    const ready = await page.evaluate(() =>
      !!(window.AvneiMechanics && window.AvneiMechanics['swim-hunt']));
    expect(ready).toBe(true);

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });

  test('full playthrough: 5 rounds → completion + events', async ({ page }) => {
    // 13 דגי-יעד + 4 מעברי-סבב (2s) + פינאלה (letter-anim ~2.2s + finale ~4s)
    test.setTimeout(120_000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
    });

    await page.goto('/underwater-app/stage-3-shin.html');
    await page.locator('#startBtn').click();

    // מבנה הסבבים מהקונפיג (shin-hunt.json): targets פר סבב + המסיח
    const ROUNDS = [
      { targets: 2, distractor: 'ת' },
      { targets: 2, distractor: 'מ' },
      { targets: 3, distractor: 'ר' },
      { targets: 3, distractor: 'ב' },
      { targets: 3, distractor: 'ק' },
    ];

    for (let r = 0; r < ROUNDS.length; r++) {
      // הסבב עלה — יש דגים והמסיח של הסבב נוכח (pack mode: מסיח שונה פר סבב)
      await expect(
        page.locator('.swim-fish', { hasText: ROUNDS[r].distractor }).first()
      ).toBeVisible({ timeout: 10_000 });

      if (r === 0) {
        // טעות מכוונת: נגיעה בדג מסיח — נענוע בלבד, הדג לא "נמצא" והמשחק ממשיך
        const wrong = page.locator('.swim-fish', { hasText: ROUNDS[0].distractor }).first();
        await wrong.dispatchEvent('click');
        await expect(wrong).not.toHaveClass(/found/);
      }

      for (let t = 0; t < ROUNDS[r].targets; t++) {
        await clickNextTargetFish(page);
        // הדג הנכון סומן found (שוחה אל נוני)
        await expect(page.locator('.swim-fish.found')).toHaveCount(t + 1);
      }
      // just-done: המשפחה של הסבב חזרה — ה-slot התמלא
      await expect(page.locator(`[data-shell-slot="${r}"]`)).toHaveClass(/filled/);

      if (r < ROUNDS.length - 1) {
        // המתנה לסבב הבא (INTER_ROUND 2000ms) — שדה טרי בלי דגי found
        await page.waitForFunction(() => {
          const all = document.querySelectorAll('.swim-fish');
          const found = document.querySelectorAll('.swim-fish.found');
          return all.length > 0 && found.length === 0;
        }, { timeout: 10_000 });
      }
    }

    // finale (letter-anim + praise + finale audio) → completion overlay
    await expect(page.locator('#completion')).toHaveClass(/show/, { timeout: 20_000 });

    // אירועים: swim-hunt עם target_letter='ש' (חובה ל-EPA), אי 3 מפורש,
    // strand 1 נגזר, 13 נכונים + לפחות טעות אחת (בלי response_time לשגויה).
    const summary = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('underwater-app:v1') || '{}');
      const evts = (s.events || []).filter((e) => e.activity_type === 'swim-hunt');
      return {
        total: evts.length,
        withLetter: evts.filter((e) => e.target_letter === 'ש').length,
        island3: evts.filter((e) => e.primary_island_id === 3).length,
        strand1: evts.filter((e) => e.strand_id === 1).length,
        correct: evts.filter((e) => e.is_correct).length,
        wrongNoRt: evts.filter((e) => !e.is_correct && e.response_time_ms === null).length,
      };
    });
    expect(summary.withLetter).toBe(summary.total);
    expect(summary.island3).toBe(summary.total);
    expect(summary.strand1).toBe(summary.total);
    expect(summary.correct).toBe(13);
    expect(summary.wrongNoRt).toBeGreaterThanOrEqual(1);

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });
});
