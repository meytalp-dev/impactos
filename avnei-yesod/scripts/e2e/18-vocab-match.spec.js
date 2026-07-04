// משחקון אוצר-מילים (stage-vocab-match.html) — smoke + מעבר מלא.
// מאמת: טעינה בלי שגיאות JS · mix = 12 סבבים (3 מילה→תמונה, 3 תמונה→מילה,
// 6 מיון-לקטגוריות) על ליבת mechanic-mcq · טעות מדווחת EPA (Comprehension)
// תחת characteristic_id אמיתי מהבנק · אירועים נושאים primary_island_id לפי
// המצב (word→5, image→14, sort→9) · מסך סיום.
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

// mix = 3 מילה→תמונה + 3 תמונה→מילה + זוג-מיון אחד (5-6 פריטים — לקטגוריית
// "אנשים" יש רק 2 פריטים במאגר, לכן האורך 11 או 12; נקרא מהפנינים בזמן ריצה).
const MIX_MIN = 11, MIX_MAX = 12;
const CIDS = ['nov-w4-d1-c1', 'dec-w1-d4-c1', 'feb-w4-d3-c2'];
const CID_ISLAND = { 'nov-w4-d1-c1': 5, 'dec-w1-d4-c1': 14, 'feb-w4-d3-c2': 9 };

async function clickCorrect(page) {
  const tile = page.locator('.mcq-option[data-correct="1"]').first();
  await tile.waitFor({ state: 'visible', timeout: 10_000 });
  await tile.click();
}

// יומן האירועים חי ב-state.js תחת underwater-app:v1 → state.events
// (לא במפתח avnei-event-log-v1 הישן שבתיעוד helpers).
async function readEvents(page) {
  return page.evaluate(() => (window.__avneiYesod ? window.__avneiYesod.events() : []));
}

test.describe('אוצר המילים של נוני (stage-vocab-match)', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
    });
  });

  test('loads clean: no critical JS errors, mcq core ready, pearls rendered', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
    });
    await page.goto('/underwater-app/stage-vocab-match.html');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('.start-card h1')).toHaveText(/אוֹצַר הַמִּלִּים/);
    const ready = await page.evaluate(() =>
      !!(window.AvneiMechanics && window.AvneiMechanics['mcq']));
    expect(ready).toBe(true);
    const pearls = await page.locator('.pearl').count();
    expect(pearls).toBeGreaterThanOrEqual(MIX_MIN);
    expect(pearls).toBeLessThanOrEqual(MIX_MAX);

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });

  test('full playthrough (mix): all rounds → finish + events per mode', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

    await page.goto('/underwater-app/stage-vocab-match.html');
    const rounds = await page.locator('.pearl').count();
    expect(rounds).toBeGreaterThanOrEqual(MIX_MIN);
    await page.locator('#startBtn').click();

    for (let r = 0; r < rounds; r++) {
      await expect(page.locator('#counter')).toHaveText(`${r + 1} / ${rounds}`);
      // סבב-מיון = 2 קבוצות, מילה/תמונה = 3 אופציות; בשניהם קליק על הנכונה
      await clickCorrect(page);
      // INTER_ITEM_DELAY_MS (1100) + מעבר-סבב (250)
      await expect(page.locator('.mcq-feedback--ok')).toHaveText(/יֵשׁ/);
    }

    await expect(page.locator('.finish h2')).toHaveText(/כָּל הַכָּבוֹד/, { timeout: 10_000 });

    const events = (await readEvents(page)) || [];
    const mine = events.filter((e) => String(e.item_id || '').startsWith('vocab-match-'));
    expect(mine.length).toBe(rounds);
    expect(mine.every((e) => e.is_correct === true)).toBe(true);
    expect(mine.every((e) => CIDS.includes(e.characteristic_id))).toBe(true);
    // האי נגזר מהמצב (word→5 · image→14 · sort→9) והסטרנד מתמלא אוטומטית
    expect(mine.every((e) => e.primary_island_id === CID_ISLAND[e.characteristic_id])).toBe(true);
    expect(mine.every((e) => typeof e.strand_id === 'number')).toBe(true);
    // mix: 3 מילה→תמונה + 3 תמונה→מילה + זוג-מיון (5-6)
    const byCid = {};
    mine.forEach((e) => { byCid[e.characteristic_id] = (byCid[e.characteristic_id] || 0) + 1; });
    expect(byCid['nov-w4-d1-c1']).toBe(3);
    expect(byCid['dec-w1-d4-c1']).toBe(3);
    expect(byCid['feb-w4-d3-c2']).toBe(rounds - 6);

    expect(errors).toEqual([]);
  });

  test('wrong tap logs Comprehension EPA under the bank characteristic', async ({ page }) => {
    await page.goto('/underwater-app/stage-vocab-match.html?mode=word');
    await page.locator('#startBtn').click();

    const wrong = page.locator('.mcq-option[data-correct="0"]').first();
    await wrong.waitFor({ state: 'visible', timeout: 10_000 });
    await wrong.click();

    await expect.poll(async () => {
      const events = (await readEvents(page)) || [];
      const bad = events.find((e) =>
        String(e.item_id || '').startsWith('vocab-match-word-') && e.is_correct === false);
      return bad ? `${bad.failure_type}|${bad.characteristic_id}` : null;
    }).toBe('Comprehension|nov-w4-d1-c1');
  });
});
