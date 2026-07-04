// משחקון הבחנה בין דומים — stage-discrimination.html · smoke לכל הזוגות + מעבר מלא.
// מאמת: כל ?pair= נטען עם תור שאלות (מהבנק, לא מומצאות) · promptLine בלשון רבים
// (הַקְשִׁיבוּ, לא הַקְשִׁיבִי) · מעבר מלא של צ/ץ (mcq + odd-one-out + fill) עם
// אירועי characteristic_id + primary_island_id · two-tap באפשרויות-שמע: נגיעה
// ראשונה = האזנה בלבד (לא נכתב אירוע!), נגיעה שנייה = בחירה שנרשמת ל-BKT.
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

const PAIRS = [
  { id: 'tav-resh',        min: 3 },
  { id: 'bet-kaf',         min: 6 },
  { id: 'hey-het',         min: 5 },
  { id: 'dalet-resh',      min: 3 },
  { id: 'tzadi-final',     min: 5 },
  { id: 'shin-sin',        min: 6 },
  { id: 'shin-sin-words',  min: 6 },
  { id: 'shin-sin-listen', min: 3 },
];

async function readMcqEvents(page) {
  return page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('underwater-app:v1') || '{}');
    return (s.events || []).filter((e) =>
      e.activity_type === 'mcq' || e.activity_type === 'odd-one-out');
  });
}

// פותר שאלה אחת: אריחי טקסט — לוחץ על הנכון; אריחי-שמע — two-tap על הנכון.
async function solveCurrent(page) {
  const correct = page.locator('.mcq-option[data-correct="1"]').first();
  await correct.waitFor({ state: 'visible', timeout: 10_000 });
  const isAudio = await correct.evaluate((el) => el.classList.contains('mcq-option--audio'));
  await correct.click();
  if (isAudio) await correct.click();   // נגיעה 1 = האזנה, נגיעה 2 = בחירה
}

test.describe('משחקון הבחנה בין דומים (stage-discrimination)', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
    });
  });

  test('smoke: כל זוג נטען עם תור שאלות מהבנק ובלי שגיאות JS', async ({ page }) => {
    test.setTimeout(90_000);
    for (const p of PAIRS) {
      const errors = [];
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      await page.goto(`/underwater-app/stage-discrimination.html?pair=${p.id}`);
      await expect(page.locator('#startBtn')).toBeVisible({ timeout: 10_000 });
      await page.locator('#startBtn').click();
      // התור נבנה — המונה מציג סה"כ בגודל סביר לזוג
      const counter = await page.locator('#counter').textContent();
      const total = parseInt(counter.split('/')[1], 10);
      expect(total, `${p.id}: queue size`).toBeGreaterThanOrEqual(p.min);
      expect(total, `${p.id}: capped`).toBeLessThanOrEqual(12);
      // אריחים על המסך (מנגנון עלה)
      await expect(page.locator('.mcq-option').first()).toBeVisible({ timeout: 5_000 });
      // לשון רבים — אין פנייה בנקבה-יחידה בבועת נוני
      const prompt = await page.locator('#promptText').textContent();
      expect(prompt, `${p.id}: plural`).not.toMatch(/הַקְשִׁיבִי|הִסְתַּכְּלִי|בְחַרִי/);
      expect(errors, `${p.id}: js errors`).toEqual([]);
    }
  });

  test('מעבר מלא צ/ץ: mcq + odd-one-out + השלמת עֵץ → אירועים תקינים', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/underwater-app/stage-discrimination.html?pair=tzadi-final');
    await page.locator('#startBtn').click();
    const counter = await page.locator('#counter').textContent();
    const total = parseInt(counter.split('/')[1], 10);

    for (let i = 0; i < total; i++) {
      if (i === 0) {
        // טעות מכוונת בשאלה הראשונה — נרשמת עם EPA של המסיח, המשחק ממשיך
        const wrong = page.locator('.mcq-option[data-correct="0"]').first();
        await wrong.waitFor({ state: 'visible', timeout: 10_000 });
        await wrong.click();
      }
      await solveCurrent(page);
      // פנינה התמלאה (או שהגענו לסיום)
      if (i < total - 1) {
        await expect(page.locator('.pearl.filled')).toHaveCount(i + 1, { timeout: 10_000 });
      }
    }
    await expect(page.locator('.finish h2')).toHaveText(/כָּל הַכָּבוֹד/, { timeout: 15_000 });

    const evts = await readMcqEvents(page);
    // כל אירוע נושא characteristic_id של צ/ץ (מפתח-EPA G4) + אי 5 (פונולוגיה)
    expect(evts.length).toBeGreaterThanOrEqual(total + 1);   // total נכונות + טעות אחת
    expect(evts.every((e) => /^jan-w4-d1/.test(e.characteristic_id || ''))).toBe(true);
    expect(evts.every((e) => e.primary_island_id === 5)).toBe(true);
    expect(evts.filter((e) => e.is_correct).length).toBe(total);
    const wrongEvts = evts.filter((e) => !e.is_correct);
    expect(wrongEvts.length).toBeGreaterThanOrEqual(1);
    // הטעות נושאת EPA מהמסיח שנלחץ (failure_type מהבנק)
    expect(wrongEvts[0].failure_type).toBeTruthy();
  });

  test('two-tap באפשרויות-שמע: נגיעה 1 = האזנה בלבד, נגיעה 2 = בחירה', async ({ page }) => {
    test.setTimeout(60_000);
    // shin-sin-listen: כל האפשרויות אריחי-שמע (sound-shin/samekh/mem/resh)
    await page.goto('/underwater-app/stage-discrimination.html?pair=shin-sin-listen');
    await page.locator('#startBtn').click();

    const tile = page.locator('.mcq-option[data-correct="0"]').first();
    await tile.waitFor({ state: 'visible', timeout: 10_000 });
    expect(await tile.evaluate((el) => el.classList.contains('mcq-option--audio'))).toBe(true);

    // נגיעה ראשונה — מצב האזנה, שום אירוע לא נכתב (ניחוש-מיקום לא נמדד)
    await tile.click();
    await expect(tile).toHaveClass(/mcq-option--listening/);
    expect((await readMcqEvents(page)).length).toBe(0);

    // מעבר לאריח אחר — עדיין רק האזנה, עדיין אפס אירועים
    const other = page.locator('.mcq-option[data-correct="1"]').first();
    await other.click();
    await expect(other).toHaveClass(/mcq-option--listening/);
    expect((await readMcqEvents(page)).length).toBe(0);

    // נגיעה שנייה על אותו אריח = בחירה — עכשיו נרשם אירוע (נכון)
    await other.click();
    await expect
      .poll(async () => (await readMcqEvents(page)).length, { timeout: 5_000 })
      .toBe(1);
    const evt = (await readMcqEvents(page))[0];
    expect(evt.is_correct).toBe(true);
    expect(evt.characteristic_id).toMatch(/^feb-w1-d4/);
    expect(evt.primary_island_id).toBe(14);   // שפה דבורה → אי 14
  });
});
