// אי 8 · גַּן אַצּוֹת הַמִּלִּים הַקְּטַנּוֹת (stage-8-island.html + 3 משחקוני בנק).
// מאמת: דף-האי נטען נקי (רקע-שונית, נוני, 3 כרטיסי quest) · ריצה מלאה של
// "זיהוי בזק" (9 סבבים מהבנק) עם אירועים primary_island_id=8 + characteristic_id ·
// טעות מדווחת EPA (failure_type מהמסיח) · טאבלט-לרוחב · מצב guest=1.
// המשחקונים ניזונים מ-curriculum/questions-grade1.json דרך js/shared/island8-game.js.
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

async function readEvents(page) {
  return page.evaluate(() => (window.__avneiYesod ? window.__avneiYesod.events() : []));
}

// אחרי "מתחילים" מתנגן קליפ-משימה של נוני ורק אז עולה הסבב הראשון —
// לכן ההמתנה לאריח הראשון נדיבה (עד ~12 שניות fallback של המריץ).
async function startAndWaitFirstRound(page) {
  await page.locator('#startBtn').click();
  await page.locator('.mcq-option').first().waitFor({ state: 'visible', timeout: 20_000 });
}

async function clickCorrect(page) {
  const tile = page.locator('.mcq-option[data-correct="1"]').first();
  await tile.waitFor({ state: 'visible', timeout: 15_000 });
  await tile.click();
}

test.describe('אי 8 · גן אצות המילים הקטנות', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-noa', name: 'נועה' }],
      currentStudent: 'stu-noa',
    });
  });

  test('island page loads clean: reef bg, noni, 3 quest cards', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
    });
    await page.goto('/underwater-app/stage-8-island.html');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('.island-title')).toHaveText(/אִי 8/);
    await expect(page.locator('.island-title')).toHaveText(/הַמִּלִּים הַקְּטַנּוֹת/);

    // חוקי העולם: רקע השונית המשותף + נוני-תמנון (PNG קיים, נטען בפועל)
    await expect(page.locator('.scene-bg')).toHaveAttribute('src', /scene-stage-3-bg\.png/);
    const noniLoaded = await page.locator('.noni-fixed').evaluate(
      (img) => img.complete && img.naturalWidth > 0);
    expect(noniLoaded).toBe(true);

    const hrefs = await page.locator('.quest-card').evaluateAll(
      (els) => els.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual([
      'stage-8-flash-words.html',
      'stage-8-sentence-catch.html',
      'stage-8-word-write.html',
    ]);

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });

  test('tablet landscape: quest cards visible and tappable (>=56px)', async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.goto('/underwater-app/stage-8-island.html');
    for (const card of await page.locator('.quest-card').all()) {
      await expect(card).toBeVisible();
      const box = await card.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(56);
    }
  });

  test('flash-words: full 9-round run, events carry primary=8 + characteristic_id', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/underwater-app/stage-8-flash-words.html');
    await startAndWaitFirstRound(page);

    for (let i = 0; i < 9; i++) {
      await clickCorrect(page);
      // בין סבבים: או האריח הבא או מסך הסיום
      await page.waitForTimeout(1500);
    }
    await expect(page.locator('.finish h2')).toHaveText(/כָּל הַכָּבוֹד/);

    const events = (await readEvents(page)) || [];
    const mine = events.filter((e) => e.activity_type === 'mcq');
    expect(mine.length).toBe(9);
    for (const e of mine) {
      expect(e.primary_island_id).toBe(8);
      expect(String(e.characteristic_id || '')).toMatch(/^(nov-w3-d1|jun-w1-d1)/);
      expect(e.is_correct).toBe(true);
    }
  });

  test('sentence-catch: wrong tap logs EPA (failure_type from distractor)', async ({ page }) => {
    await page.goto('/underwater-app/stage-8-sentence-catch.html');
    await startAndWaitFirstRound(page);

    // מקישים על מסיח (שגוי) ואז על הנכון
    await page.locator('.mcq-option[data-correct="0"]').first().click();
    await clickCorrect(page);

    await expect.poll(async () => {
      const events = (await readEvents(page)) || [];
      const wrong = events.find((e) => e.activity_type === 'mcq' && e.is_correct === false);
      if (!wrong) return null;
      return [wrong.primary_island_id, !!wrong.failure_type,
        String(wrong.characteristic_id || '').startsWith('nov-w3-d')].join('|');
    }).toBe('8|true|true');
  });

  test('word-write: round 1 mounts with 3 text options >=56px + stem audio replay button', async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.goto('/underwater-app/stage-8-word-write.html');
    await startAndWaitFirstRound(page);

    const tiles = await page.locator('.mcq-option').all();
    expect(tiles.length).toBe(3);
    for (const t of tiles) {
      const box = await t.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(56);
    }
    // stem שמיעתי: כפתור "הַקְשִׁיבוּ" זמין להשמעה חוזרת
    await expect(page.locator('.mcq-stem-audio')).toBeVisible();
  });

  test('guest mode smoke: island + all 3 games load with ?guest=1', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/underwater-app/stage-8-island.html?guest=1');
    await expect(page.locator('.island-title')).toBeVisible();
    for (const g of ['flash-words', 'sentence-catch', 'word-write']) {
      await page.goto(`/underwater-app/stage-8-${g}.html?guest=1`);
      await expect(page.locator('#startBtn')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
});
