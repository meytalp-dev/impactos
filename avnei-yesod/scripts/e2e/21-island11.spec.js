// אי 11 · מִפְרַץ הַגֶּשְׁרוֹנִים (stage-11-island.html + 2 משחקוני מילות-יחס).
// מאמת: דף-האי נטען נקי (רקע-שונית, נוני, 2 כרטיסי quest) · "אֵיפֹה הַדָּג?"
// ריצת 5 סבבים מלאה (stem=audio, options=image) עם primary_island_id=11 +
// characteristic_id=isl11-* · "הַמִּלָּה הַחֲסֵרָה" two-tap לאפשרויות-שמע (נגיעה 1
// preview, נגיעה 2 בחירה) + טעות מדווחת EPA · טאבלט-לרוחב · מצב guest=1.
// התוכן מוגדר inline ב-js/shared/island11-game.js (אין פריט-בנק בעל המבנה הזה).
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

async function readEvents(page) {
  return page.evaluate(() => (window.__avneiYesod ? window.__avneiYesod.events() : []));
}

// אחרי "מתחילים" מתנגן קליפ-משימה של נוני ורק אז עולה הסבב הראשון (fallback ~12ש').
async function startAndWaitFirstRound(page) {
  await page.locator('#startBtn').click();
  await page.locator('.mcq-option').first().waitFor({ state: 'visible', timeout: 20_000 });
}

// אופציית-תמונה (משחקון 1) = נגיעה יחידה.
async function clickCorrectImage(page) {
  const tile = page.locator('.mcq-option[data-correct="1"]').first();
  await tile.waitFor({ state: 'visible', timeout: 15_000 });
  await tile.click();
}

// אופציית-שמע (משחקון 2) = two-tap: נגיעה 1 preview, נגיעה 2 בחירה.
async function pickCorrectAudio(page) {
  const tile = page.locator('.mcq-option[data-correct="1"]').first();
  await tile.waitFor({ state: 'visible', timeout: 15_000 });
  await tile.click();                 // preview (לא נמדד)
  await page.waitForTimeout(120);
  await tile.click();                 // בחירה (נמדדת)
}

test.describe('אי 11 · מפרץ הגשרונים', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-noa', name: 'נועה' }],
      currentStudent: 'stu-noa',
    });
  });

  test('island page loads clean: reef bg, noni, 2 quest cards', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

    await page.goto('/underwater-app/stage-11-island.html');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('.island-title')).toHaveText(/אִי 11/);
    await expect(page.locator('.island-title')).toHaveText(/הַגֶּשְׁרוֹנִים/);

    await expect(page.locator('.scene-bg')).toHaveAttribute('src', /scene-stage-3-bg\.png/);
    const noniLoaded = await page.locator('.noni-fixed').evaluate(
      (img) => img.complete && img.naturalWidth > 0);
    expect(noniLoaded).toBe(true);

    const hrefs = await page.locator('.quest-card').evaluateAll(
      (els) => els.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual([
      'stage-11-where-fish.html',
      'stage-11-missing-word.html',
    ]);

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });

  test('tablet landscape: quest cards visible and tappable (>=56px)', async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.goto('/underwater-app/stage-11-island.html');
    for (const card of await page.locator('.quest-card').all()) {
      await expect(card).toBeVisible();
      const box = await card.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(56);
    }
  });

  test('where-fish: full 5-round run, events primary=11 + isl11-* characteristic', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/underwater-app/stage-11-where-fish.html');
    await startAndWaitFirstRound(page);

    // כל אופציה היא תמונה (סצנת SVG) — img נטען בפועל
    const imgsOk = await page.locator('.mcq-option img').evaluateAll(
      (imgs) => imgs.length > 0 && imgs.every((i) => i.complete && i.naturalWidth > 0));
    expect(imgsOk).toBe(true);

    for (let i = 0; i < 5; i++) {
      await clickCorrectImage(page);
      await page.waitForTimeout(1500);
    }
    await expect(page.locator('.finish h2')).toHaveText(/כָּל הַכָּבוֹד/);

    const events = (await readEvents(page)) || [];
    const mine = events.filter((e) => e.activity_type === 'mcq');
    expect(mine.length).toBe(5);
    for (const e of mine) {
      expect(e.primary_island_id).toBe(11);
      expect(String(e.characteristic_id || '')).toMatch(/^isl11-/);
      expect(e.is_correct).toBe(true);
    }
  });

  test('missing-word: audio options are two-tap (first tap previews, no measure)', async ({ page }) => {
    await page.goto('/underwater-app/stage-11-missing-word.html');
    await startAndWaitFirstRound(page);

    const tiles = await page.locator('.mcq-option').all();
    expect(tiles.length).toBe(3);
    for (const t of tiles) {
      expect((await t.boundingBox()).height).toBeGreaterThanOrEqual(56);
    }

    // נגיעה ראשונה על אופציה = preview בלבד → אין אירוע נמדד
    await page.locator('.mcq-option').first().click();
    await page.waitForTimeout(300);
    let events = (await readEvents(page)) || [];
    expect(events.filter((e) => e.activity_type === 'mcq').length).toBe(0);

    // stem = תמונת-סצנה (SVG) נטענת
    const stemOk = await page.locator('.mcq-stem-img').evaluate(
      (i) => i.complete && i.naturalWidth > 0);
    expect(stemOk).toBe(true);
  });

  test('missing-word: wrong pick logs EPA (failure_type), primary=11 + isl11-*', async ({ page }) => {
    await page.goto('/underwater-app/stage-11-missing-word.html');
    await startAndWaitFirstRound(page);

    // two-tap על מסיח: preview ואז בחירה
    const wrong = page.locator('.mcq-option[data-correct="0"]').first();
    await wrong.click();
    await page.waitForTimeout(120);
    await wrong.click();

    await expect.poll(async () => {
      const events = (await readEvents(page)) || [];
      const e = events.find((x) => x.activity_type === 'mcq' && x.is_correct === false);
      if (!e) return null;
      return [e.primary_island_id, !!e.failure_type,
        String(e.characteristic_id || '').startsWith('isl11-')].join('|');
    }).toBe('11|true|true');
  });

  test('missing-word: full 5-round run via two-tap reaches finish', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/underwater-app/stage-11-missing-word.html');
    await startAndWaitFirstRound(page);
    for (let i = 0; i < 5; i++) {
      await pickCorrectAudio(page);
      await page.waitForTimeout(1500);
    }
    await expect(page.locator('.finish h2')).toHaveText(/כָּל הַכָּבוֹד/);

    const events = (await readEvents(page)) || [];
    const correct = events.filter((e) => e.activity_type === 'mcq' && e.is_correct === true);
    expect(correct.length).toBe(5);
    for (const e of correct) expect(e.primary_island_id).toBe(11);
  });

  test('guest mode smoke: island + both games load with ?guest=1', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/underwater-app/stage-11-island.html?guest=1');
    await expect(page.locator('.island-title')).toBeVisible();
    for (const g of ['where-fish', 'missing-word']) {
      await page.goto(`/underwater-app/stage-11-${g}.html?guest=1`);
      await expect(page.locator('#startBtn')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
});
