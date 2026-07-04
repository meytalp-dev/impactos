// אי ב (הבית של הדג הקטן) — stage-3-bet.html · smoke + מעבר סבב מלא בגרירה.
// מאמת: טעינה בלי שגיאות JS · 5 סבבים (אות + 3 בנייה + השלמת מילה) · completion ·
// אירועי rescue/cv-build-task נכתבים (cv-build-task עם target_phoneme_group —
// חובה ל-BKT פר-צירוף) · הצירוף הבנוי כולל דגש קל (בַּ=/ba/, כלל בגד-כפת).
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

// סדר סבבי הבנייה מ-bet.json: patach → kamatz → hiriq → build-word (patach).
const BUILD_TARGETS = ['patach', 'kamatz', 'hiriq', 'patach'];
const DAGESH = 'ּ';

// גרירת אבן-ניקוד אל חריץ הבנייה (pointer events דרך mouse).
async function dragStoneToSlot(page, vowelId) {
  const stone = page.locator(`.bdrag-stone[data-vowel="${vowelId}"]`);
  await stone.waitFor({ state: 'visible', timeout: 10_000 });
  const slot = page.locator('#bdragSlot');
  const sBox = await stone.boundingBox();
  const tBox = await slot.boundingBox();
  await page.mouse.move(sBox.x + sBox.width / 2, sBox.y + sBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(tBox.x + tBox.width / 2, tBox.y + tBox.height / 2, { steps: 12 });
  await page.mouse.up();
}

test.describe('אי ב · הבית של הדג הקטן (stage-3-bet)', () => {
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
    await page.goto('/underwater-app/stage-3-bet.html');
    await page.waitForLoadState('domcontentloaded');

    // הקונפיג נטען והכותרת התעדכנה מה-JSON
    await expect(page.locator('#tapToStart h2')).toHaveText(/הַבַּיִת שֶׁל הַדָּג הַקָּטָן/);
    // המכניקה החדשה רשומה + vowel-adapter בונה בַּ עם דגש קל (בגד-כפת)
    const built = await page.evaluate(() =>
      (window.AvneiMechanics && !!window.AvneiMechanics['cv-build-drag']) &&
      window.AvneiVowelAdapter ? window.AvneiVowelAdapter.buildCV('ב', 'patach') : '');
    expect(built).toContain('ב');
    expect(built).toContain(DAGESH);

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });

  test('full playthrough: pick + 4 drag-builds → completion + BKT events', async ({ page }) => {
    // 5 סבבים × INTER_ROUND_DELAY 1900ms + פינאלה ~4.7s
    test.setTimeout(90_000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
    });

    await page.goto('/underwater-app/stage-3-bet.html');
    await page.locator('#startBtn').click();

    // סבב 1 — זיהוי האות (pick פשוט)
    const target = page.locator('.pick-pod[data-target="true"]').first();
    await target.waitFor({ state: 'visible', timeout: 10_000 });
    await target.click();
    await expect(page.locator('[data-shell-slot="0"]')).toHaveClass(/filled/);

    // סבבים 2-5 — בנייה בגרירה (pack mode: יעד שונה פר סבב)
    for (let i = 0; i < BUILD_TARGETS.length; i++) {
      await dragStoneToSlot(page, BUILD_TARGETS[i]);
      // הצירוף "נדבק" — עמדת הבנייה במצב built והאות מציגה צירוף עם דגש
      await expect(page.locator('#bdragAnvil')).toHaveClass(/built/, { timeout: 5_000 });
      const cvText = await page.locator('.bdrag-anvil__letter').textContent();
      expect(cvText).toContain(DAGESH); // בגד-כפת: בַּ לא בַ
      await expect(page.locator(`[data-shell-slot="${i + 1}"]`)).toHaveClass(/filled/);
      if (i < BUILD_TARGETS.length - 1) {
        // המתנה לסבב הבא — עמדת בנייה טרייה (לא built)
        await page.waitForFunction(() => {
          const anvil = document.getElementById('bdragAnvil');
          return anvil && !anvil.classList.contains('built');
        }, { timeout: 10_000 });
      }
    }

    // סבב המילה הציג את בַּיִת המושלמת
    await expect(page.locator('#bdragBuilt')).toContainText('בַּיִת');

    // finale (praise+finale audio ~4s) → completion overlay
    await expect(page.locator('#completion')).toHaveClass(/show/, { timeout: 15_000 });

    // אירועים: סבב 1 = rescue (דפוס stage-3-lamed), סבבים 2-5 = cv-build-task
    // עם target_phoneme_group (בלעדיו BKT פר-צירוף מדלג) + primary_island_id 4.
    const summary = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('underwater-app:v1') || '{}');
      const evts = (s.events || []).filter((e) => e.target_letter === 'ב');
      return {
        rescue: evts.filter((e) => e.activity_type === 'rescue').length,
        cvBuild: evts.filter((e) => e.activity_type === 'cv-build-task').length,
        cvWithGroup: evts.filter((e) =>
          e.activity_type === 'cv-build-task' && !!e.target_phoneme_group).length,
        island4: evts.filter((e) =>
          e.activity_type === 'cv-build-task' && e.primary_island_id === 4).length,
        correct: evts.filter((e) => e.is_correct).length,
      };
    });
    expect(summary.rescue).toBeGreaterThanOrEqual(1);
    expect(summary.cvBuild).toBeGreaterThanOrEqual(4);
    expect(summary.cvWithGroup).toBe(summary.cvBuild);
    expect(summary.island4).toBe(summary.cvBuild);
    expect(summary.correct).toBeGreaterThanOrEqual(5);

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });
});
