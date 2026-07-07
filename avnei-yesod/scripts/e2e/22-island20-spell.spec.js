// אי 20 · שׁוּנִית בּוֹנֵי הַמִּלִּים (stage-20-island.html + stage-20-spell.html).
// ההיפוך של אי 5: שומעים מילה (word-*.mp3) בלי לראותה → מרכיבים אותה מצירופים
// מנוקדים + מסיחים נגזרי-EPA (mechanic-word-spell). מאמת: דף-אי נקי (רקע-שונית,
// נוני, CTA→spell) · ריצת 6 סבבים מלאה עם primary_island_id=20 + target_word בכל
// אירוע · טעות מדווחת is_correct=false והצירוף נשאר במאגר · מגע ≥56px · guest=1.
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

const WORDS = ['בַּת', 'דַּג', 'גַּן', 'יָם', 'רַק', 'שַׁר'];

async function readEvents(page) {
  return page.evaluate(() => (window.__avneiYesod ? window.__avneiYesod.events() : []));
}

// display של כל צירוף במילה (letter+niqud+dagesh) — תואם tileText של המכניקה.
async function expectedDisplays(page, wordText) {
  return page.evaluate((t) => {
    const parts = window.AvneiWordAdapter.decomposeWord(t);
    return parts.map((p) => {
      let s = p.letter || '';
      if (p.niqud) s += p.niqud;
      if (p.dagesh) s += 'ּ';
      return s;
    });
  }, wordText);
}

// לוחץ על הצירוף הנכון (לפי טקסט מדויק) מבין האריחים שטרם הונחו.
async function clickTileByText(page, display) {
  const clicked = await page.evaluate((disp) => {
    const tiles = Array.from(document.querySelectorAll('.word-spell-tile:not(.placed)'));
    const t = tiles.find((el) => el.textContent === disp);
    if (!t) return false;
    t.click();
    return true;
  }, display);
  expect(clicked, `tile "${display}" נמצא ולחיץ`).toBe(true);
}

async function startGame(page) {
  await page.locator('#startBtn').click();
  // אחרי קליפ-המשימה עולה הסבב הראשון (fallback ~9ש')
  await page.locator('.word-spell-tile').first().waitFor({ state: 'visible', timeout: 15_000 });
}

test.describe('אי 20 · שונית בוני המילים', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-lia', name: 'ליה' }],
      currentStudent: 'stu-lia',
    });
  });

  test('דף-האי נטען נקי: רקע-שונית, נוני, CTA למשחקון', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

    await page.goto('/underwater-app/stage-20-island.html?guest=1');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('.island-title')).toHaveText(/אִי 20/);
    await expect(page.locator('.island-title')).toHaveText(/בּוֹנֵי הַמִּלִּים/);
    await expect(page.locator('.scene-bg')).toHaveAttribute('src', /scene-stage-3-bg\.png/);

    const noniLoaded = await page.locator('.island-hero-noni').evaluate(
      (img) => img.complete && img.naturalWidth > 0);
    expect(noniLoaded).toBe(true);

    await expect(page.locator('.cta-primary#startBtn')).toHaveAttribute('href', 'stage-20-spell.html');

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });

  test('ריצת 6 סבבים: כל אירוע primary=20 + target_word; המילה נבנית ומתגלה', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

    await page.goto('/underwater-app/stage-20-spell.html?guest=1');
    await page.waitForLoadState('domcontentloaded');
    await startGame(page);

    for (let r = 0; r < WORDS.length; r++) {
      const word = WORDS[r];
      // המילה לא מוצגת — רק משבצות · (לא צריך לראותה כדי לבנות).
      const displays = await expectedDisplays(page, word);
      for (const disp of displays) {
        await clickTileByText(page, disp);
        await page.waitForTimeout(120);
      }
      // בסיום המילה — שורת-הבנייה מקבלת .complete (המילה מתגלה)
      await expect(page.locator('.word-spell-build.complete')).toBeVisible({ timeout: 4000 });

      if (r < WORDS.length - 1) {
        // onComplete יורה ~1.65ש' אחרי הצירוף האחרון → מחכים שהסבב הבא ייטען
        // בפועל (אריח ראשון של המילה הבאה זמין) לפני שממשיכים.
        const nextFirst = (await expectedDisplays(page, WORDS[r + 1]))[0];
        await page.waitForFunction((disp) => {
          const tiles = Array.from(document.querySelectorAll('.word-spell-tile:not(.placed)'));
          return tiles.some((el) => el.textContent === disp) &&
                 !document.querySelector('.word-spell-build.complete');
        }, nextFirst, { timeout: 6000 });
      }
    }

    // מסך-סיום
    await expect(page.locator('.finish h2')).toBeVisible({ timeout: 5000 });

    const events = await readEvents(page);
    const spellEvents = events.filter((e) => e.activity_type === 'word-spell');
    expect(spellEvents.length).toBeGreaterThanOrEqual(12); // ≥2 צירופים × 6 מילים
    for (const e of spellEvents) {
      expect(e.island_id_current).toBe(20);   // → BKT אי 20
      expect(e.primary_island_id).toBe(20);
      // זהות-המילה נישאת ב-item_id (מפתח-המילה) ובאות-הראשונה (target_letter → EPA).
      // event-logger.js (נעול) אינו כולל שדה target_word — לכן לא נבדק כשדה עצמאי.
      expect(typeof e.item_id).toBe('string');
      expect(e.item_id).toMatch(/^isl20-word-spell-/);
      expect(typeof e.target_letter).toBe('string');
      expect(e.target_letter.length).toBeGreaterThan(0);
    }
    // כל 6 האותיות-הראשונות מדווחות (ב/ד/ג/י/ר/ש)
    const firstLetters = new Set(spellEvents.map((e) => e.target_letter));
    for (const w of WORDS) expect(firstLetters.has(w.charAt(0))).toBe(true);

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });

  test('טעות: מסיח מדווח is_correct=false ונשאר במאגר; מגע ≥56px', async ({ page }) => {
    await page.goto('/underwater-app/stage-20-spell.html?guest=1');
    await page.waitForLoadState('domcontentloaded');
    await startGame(page);

    // מגע — כל אריח ≥56px
    const minSize = await page.locator('.word-spell-tile').first().evaluate((el) => {
      const r = el.getBoundingClientRect();
      return Math.min(r.width, r.height);
    });
    expect(minSize).toBeGreaterThanOrEqual(56);

    // מצא אריח שאינו אחד הצירופים הנכונים של המילה הראשונה = מסיח
    const displays = await expectedDisplays(page, WORDS[0]);
    const distractor = await page.evaluate((correct) => {
      const tiles = Array.from(document.querySelectorAll('.word-spell-tile'));
      const d = tiles.find((el) => correct.indexOf(el.textContent) < 0);
      if (!d) return null;
      d.click();
      return d.textContent;
    }, displays);
    expect(distractor, 'קיים מסיח לחיץ').toBeTruthy();

    // המסיח נשאר במאגר (לא הונח)
    const stillThere = await page.evaluate((txt) => {
      const t = Array.from(document.querySelectorAll('.word-spell-tile')).find((el) => el.textContent === txt);
      return !!t && !t.classList.contains('placed');
    }, distractor);
    expect(stillThere).toBe(true);

    const events = await readEvents(page);
    const wrong = events.filter((e) => e.activity_type === 'word-spell' && e.is_correct === false);
    expect(wrong.length).toBeGreaterThanOrEqual(1);
    expect(wrong[0].primary_island_id).toBe(20);
  });
});
