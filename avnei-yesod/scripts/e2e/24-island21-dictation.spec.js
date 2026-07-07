// אי 21 · לְגוּנַת הַבַּקְבּוּקִים (stage-21-island.html + stage-21-dictation.html).
// "דיקטה בבנייה": שומעים משפט (isl21-sent-*.mp3) בלי לראותו → בונים אותו מאריחי-
// מילים מנוקדים לפי הסדר (mechanic-sentence-build). מאמת: דף-אי נקי (רקע-שונית,
// נוני, CTA→dictation) · בניית משפט: כל אירוע primary_island_id=21 + strand_id=4 +
// characteristic_id (מזהה-משפט) + activity_variant='placed' · שני צירי-כישלון
// מובחנים (word-order-error מול word-choice-error, failure_type=Comprehension) ·
// המסיח נשאר במאגר · מגע ≥56px · זרימת 6 סבבים עד מסך-סיום · guest=1.
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

async function readEvents(page) {
  return page.evaluate(() => (window.__avneiYesod ? window.__avneiYesod.events() : []));
}

// מרכיב משחקון עם משפט מוכר-מראש ישירות ל-#mountRoot (עוקף את בורר-הסבבים האקראי),
// כדי לשלוט בסדר המילים ובמסיחים. מחזיר את אובייקט-המשפט שנבחר.
async function mountFixed(page, sentenceId) {
  return page.evaluate((sid) => {
    const SB = window.AvneiIsland21Sentences;
    const s = SB.SENTENCES.find((x) => x.id === sid);
    const root = document.getElementById('mountRoot');
    window.__isl21done = false;
    window.AvneiMechanics['sentence-build'].mount(root, {
      sentence: s,
      islandId: 21,
      questId: 'test-' + s.id,
      onComplete: function () { window.__isl21done = true; },
    });
    return { id: s.id, words: s.words.map((w) => w.text) };
  }, sentenceId);
}

// לוחץ אריח לפי טקסט מדויק מבין הלא-מונחים; מחזיר האם נמצא.
async function clickTile(page, text) {
  return page.evaluate((t) => {
    const tiles = Array.from(document.querySelectorAll('.sb-tile:not(.placed)'));
    const el = tiles.find((x) => x.textContent === t);
    if (!el) return false;
    el.click();
    return true;
  }, text);
}

test.describe('אי 21 · לגונת הבקבוקים', () => {
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

    await page.goto('/underwater-app/stage-21-island.html?guest=1');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('.island-title')).toHaveText(/אִי 21/);
    await expect(page.locator('.island-title')).toHaveText(/לְגוּנַת הַבַּקְבּוּקִים/);
    await expect(page.locator('.scene-bg')).toHaveAttribute('src', /scene-stage-3-bg\.png/);

    const noniLoaded = await page.locator('.island-hero-noni').evaluate(
      (img) => img.complete && img.naturalWidth > 0);
    expect(noniLoaded).toBe(true);

    await expect(page.locator('.cta-primary#startBtn')).toHaveAttribute('href', 'stage-21-dictation.html');

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });

  test('בניית משפט תקין: כל אירוע primary=21 + strand=4 + characteristic_id + variant=placed', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

    await page.goto('/underwater-app/stage-21-dictation.html?guest=1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => !!(window.AvneiMechanics && window.AvneiMechanics['sentence-build'] && window.AvneiIsland21Sentences));

    const s = await mountFixed(page, 'hadag-shat-bayam'); // הַדָּג · שָׁט · בַּיָּם
    for (const w of s.words) {
      const ok = await clickTile(page, w);
      expect(ok, `אריח "${w}" נמצא ולחיץ`).toBe(true);
      await page.waitForTimeout(120);
    }

    await expect(page.locator('.sb-build.complete')).toBeVisible({ timeout: 4000 });
    await page.waitForFunction(() => window.__isl21done === true, null, { timeout: 4000 });

    const events = await readEvents(page);
    const placed = events.filter((e) => e.activity_type === 'sentence-build' && e.activity_variant === 'placed');
    expect(placed.length).toBe(3); // 3 מילים הונחו
    for (const e of placed) {
      expect(e.island_id_current).toBe(21); // → BKT אי 21
      expect(e.primary_island_id).toBe(21);
      expect(e.strand_id).toBe(4);
      expect(e.characteristic_id).toBe('hadag-shat-bayam'); // יחידת-EPA פר-משפט
      expect(e.is_correct).toBe(true);
      expect(typeof e.item_id).toBe('string');
    }

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });

  test('שני צירי-כישלון: word-order מול word-choice; המסיח נשאר; מגע ≥56px', async ({ page }) => {
    await page.goto('/underwater-app/stage-21-dictation.html?guest=1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => !!(window.AvneiMechanics && window.AvneiMechanics['sentence-build'] && window.AvneiIsland21Sentences));

    const s = await mountFixed(page, 'hadag-shat-bayam'); // words[0]=הַדָּג

    // מגע — כל אריח ≥56px
    const minSize = await page.locator('.sb-tile').first().evaluate((el) => {
      const r = el.getBoundingClientRect();
      return Math.min(r.width, r.height);
    });
    expect(minSize).toBeGreaterThanOrEqual(56);

    // (1) word-order: הקשה על מילה נכונה שאינה הראשונה (שָׁט, מיקום 2)
    const orderClicked = await clickTile(page, s.words[1]);
    expect(orderClicked).toBe(true);
    await page.waitForTimeout(80);

    // (2) word-choice: הקשה על מסיח = אריח שאינו אחת ממילות המשפט
    const distractorText = await page.evaluate((sentWords) => {
      const tiles = Array.from(document.querySelectorAll('.sb-tile'));
      const d = tiles.find((el) => sentWords.indexOf(el.textContent) < 0);
      if (!d) return null;
      d.click();
      return d.textContent;
    }, s.words);
    expect(distractorText, 'קיים מסיח לחיץ').toBeTruthy();

    // המסיח נשאר במאגר (לא הונח)
    const stillThere = await page.evaluate((txt) => {
      const t = Array.from(document.querySelectorAll('.sb-tile')).find((el) => el.textContent === txt);
      return !!t && !t.classList.contains('placed');
    }, distractorText);
    expect(stillThere).toBe(true);

    const events = await readEvents(page);
    const order = events.filter((e) => e.activity_variant === 'word-order-error');
    const choice = events.filter((e) => e.activity_variant === 'word-choice-error');
    expect(order.length).toBeGreaterThanOrEqual(1);
    expect(choice.length).toBeGreaterThanOrEqual(1);
    for (const e of order.concat(choice)) {
      expect(e.is_correct).toBe(false);
      expect(e.failure_type).toBe('Comprehension'); // ערך-EPA נעול; ההבחנה הדקה ב-variant
      expect(e.primary_island_id).toBe(21);
    }
  });

  test('זרימת 6 סבבים מלאה עד מסך-סיום (בורר-הסבבים האמיתי)', async ({ page }) => {
    // 6 סבבים × ~1.8ש' מעבר מובנה (onComplete 1.4 + 0.4) + פתרון = ~25–35ש' במובייל.
    test.setTimeout(75_000);
    await page.goto('/underwater-app/stage-21-dictation.html?guest=1');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('#startBtn').click();
    await page.locator('.sb-tile').first().waitFor({ state: 'visible', timeout: 15_000 });

    // פתרון חמדני: בכל צעד לוחצים אריחים עד שמשבצת נוספת מתמלאת; אריח שגוי נשאר
    // במאגר (לא מזיק). חוזרים עד שהמשפט הושלם, ואז ממתינים לסבב הבא.
    for (let round = 0; round < 6; round++) {
      let solved = false;
      for (let guard = 0; guard < 30 && !solved; guard++) {
        solved = await page.evaluate(() => {
          if (document.querySelector('.sb-build.complete')) return true;
          const filled = document.querySelectorAll('.sb-slot.filled').length;
          const tiles = Array.from(document.querySelectorAll('.sb-tile:not(.placed)'));
          for (const t of tiles) {
            t.click();
            if (document.querySelectorAll('.sb-slot.filled').length > filled) return false;
          }
          return false;
        });
        if (!solved) {
          solved = await page.evaluate(() => !!document.querySelector('.sb-build.complete'));
        }
        await page.waitForTimeout(60);
      }
      await expect(page.locator('.sb-build.complete, .finish h2').first()).toBeVisible({ timeout: 5000 });
      if (round < 5) {
        // ממתינים שהסבב הבא ייטען (שדה חדש בלי .complete)
        await page.waitForFunction(() => {
          return !document.querySelector('.sb-build.complete') &&
                 document.querySelectorAll('.sb-tile:not(.placed)').length > 0;
        }, null, { timeout: 8000 }).catch(() => {});
      }
    }

    await expect(page.locator('.finish h2')).toBeVisible({ timeout: 6000 });

    const events = await readEvents(page);
    const sb = events.filter((e) => e.activity_type === 'sentence-build');
    expect(sb.length).toBeGreaterThanOrEqual(12); // ≥2 מילים × 6 סבבים
    for (const e of sb) expect(e.primary_island_id).toBe(21);
  });
});
