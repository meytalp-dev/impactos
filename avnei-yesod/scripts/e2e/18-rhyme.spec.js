// משחקון החריזה (שַׁרְשֶׁרֶת הַחֲרוּזִים) — stage-rhyme.html · M4 (4.7.2026)
// מאמת: טעינה נקייה · 🔴 דפוס two-tap (נגיעה 1 = האזנה בלבד, לא נרשמת;
// נגיעה 2 = בחירה שנרשמת) · ניקוי סימון-האזנה אחרי טעות · מעבר מלא של 8
// סבבים → שרשרת שלמה · אירועים עם primary_island_id=1 + characteristic_id
// (EPA unitKey) + activity_variant=pick_rhyming_word.
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

// האירועים נשמרים ב-state הראשי (state.js appendEvent → underwater-app:v1 .events)
const STATE_KEY = 'underwater-app:v1';

async function readEvents(page) {
  return page.evaluate((k) => {
    try { return (JSON.parse(localStorage.getItem(k) || '{}').events) || []; } catch (e) { return []; }
  }, STATE_KEY);
}
async function eventCount(page) {
  return (await readEvents(page)).length;
}
async function lastEvent(page) {
  const a = await readEvents(page);
  return a[a.length - 1] || null;
}

test.describe('משחקון חריזה · שַׁרְשֶׁרֶת הַחֲרוּזִים (stage-rhyme)', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
    });
  });

  test('loads clean: rounds fetched, start veil, no critical JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
    });
    await page.goto('/underwater-app/stage-rhyme.html?skipintro=1');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('.start-card h1')).toHaveText(/שַׁרְשֶׁרֶת הַחֲרוּזִים/);
    // 8 חרוזים ריקים בשרשרת ההתקדמות (נטענו מ-rhyme-rounds.json)
    await expect(page.locator('.bead')).toHaveCount(8);
    const ready = await page.evaluate(() =>
      !!(window.AvneiMechanics && window.AvneiMechanics['mcq']));
    expect(ready).toBe(true);

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });

  test('two-tap: first tap = listening only (not measured), second tap = choice; wrong clears preview', async ({ page }) => {
    await page.goto('/underwater-app/stage-rhyme.html?skipintro=1&cid=feb-w4-d1-c2');
    await page.locator('#startBtn').click();

    // הסבב הראשון עלה: מילת-יעד מנוקדת + 3 רמקולים זהים-מראה
    await expect(page.locator('.mcq-stem-card--text')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.mcq-option--audio')).toHaveCount(3);

    const before = await eventCount(page);
    const wrong = page.locator('.mcq-option--audio[data-correct="0"]').first();

    // נגיעה 1 על מסיח = האזנה בלבד: מסומן "listening", שום אירוע לא נרשם
    await wrong.click();
    await expect(wrong).toHaveClass(/mcq-option--listening/);
    expect(await eventCount(page)).toBe(before);

    // נגיעה 2 על אותו אריח = בחירה — נרשמת כטעות עם EPA + characteristic_id
    await wrong.click();
    await expect.poll(() => eventCount(page)).toBe(before + 1);
    const evt = await lastEvent(page);
    expect(evt.is_correct).toBe(false);
    expect(evt.characteristic_id).toBe('feb-w4-d1-c2');
    expect(evt.primary_island_id).toBe(1);
    expect(evt.strand_id).toBe(1);
    expect(evt.activity_variant).toBe('pick_rhyming_word');
    expect(evt.failure_type).toBe('Sound');

    // אחרי טעות — סימון ההאזנה נוקה: חייבים להקשיב שוב לפני בחירה חוזרת
    await expect(page.locator('.mcq-option--listening')).toHaveCount(0);

    // התשובה הנכונה: נגיעה 1 = האזנה (לא מקדמת), נגיעה 2 = בחירה נכונה
    const correct = page.locator('.mcq-option--audio[data-correct="1"]').first();
    await correct.click();
    await expect(correct).toHaveClass(/mcq-option--listening/);
    expect(await eventCount(page)).toBe(before + 1);
    await correct.click();
    await expect.poll(() => eventCount(page)).toBe(before + 2);
    const win = await lastEvent(page);
    expect(win.is_correct).toBe(true);
    expect(win.failure_type).toBeNull();

    // חרוז ראשון נכנס לשרשרת
    await expect(page.locator('.bead.filled')).toHaveCount(1, { timeout: 5_000 });
  });

  test('full playthrough: 8 rounds → necklace complete + events per round', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/underwater-app/stage-rhyme.html?skipintro=1&cid=apr-w1-d4-c1');
    await page.locator('#startBtn').click();

    for (let r = 0; r < 8; r++) {
      // מחכים שהסבב באמת התחלף (המונה מתעדכן ב-mountNext) — בלי זה הלחיצות
      // נוחתות על האריח הנעול של הסבב הקודם בזמן ה-inter-item delay (1.1s).
      await expect(page.locator('#counter')).toHaveText((r + 1) + ' / 8', { timeout: 15_000 });
      const correct = page.locator('.mcq-option--audio[data-correct="1"]').first();
      await correct.waitFor({ state: 'visible', timeout: 10_000 });
      if (r === 0) {
        await page.screenshot({ path: 'screenshots/rhyme-round.png', fullPage: true });
      }
      await correct.click();               // האזנה
      await correct.click();               // בחירה
      // מחכים שהסבב הבא יעלה (או שמסך הסיום יופיע בסבב האחרון)
      await expect(page.locator('.bead.filled')).toHaveCount(r + 1, { timeout: 8_000 });
    }

    await expect(page.locator('.finish h2')).toHaveText(/הַשַּׁרְשֶׁרֶת שְׁלֵמָה/, { timeout: 10_000 });
    await page.screenshot({ path: 'screenshots/rhyme-finish.png', fullPage: true });

    // 8 בחירות נכונות נרשמו תחת characteristic_id של יום אפריל
    const events = await readEvents(page);
    const rhymeEvents = events.filter((e) => e.activity_variant === 'pick_rhyming_word');
    expect(rhymeEvents.length).toBe(8);
    for (const e of rhymeEvents) {
      expect(e.is_correct).toBe(true);
      expect(e.characteristic_id).toBe('apr-w1-d4-c1');
      expect(e.primary_island_id).toBe(1);
    }
  });
});
