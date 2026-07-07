// אי 10 · C10b — שני משחקוני-ההמשך של "מִפְרַץ אַבְנֵי הַבְּנִיָּה" (זכר/נקבה · ה' הידיעה).
// מאמת: דף-האי נטען נקי עם 4 כרטיסי-quest · "הוּא אוֹ הִיא?" ריצת 6 סבבים מלאה
// (stem=טקסט, options=טקסט, נגיעה יחידה) עם primary_island_id=10 +
// characteristic_id=isl10-gender-adj · טעות מדווחת EPA failure_type=GenderMismatch ·
// "הַהַתְחָלָה שֶׁל הַ" two-tap לאפשרויות-שמע (נגיעה 1 preview, נגיעה 2 בחירה) +
// טעות מדווחת EPA · primary=10 + isl10-hey-hayedia · טאבלט-לרוחב · מצב guest=1.
// התוכן מוגדר inline ב-js/shared/island10b-game.js (אין פריט-בנק בעל המבנה הזה).
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

// אופציית-טקסט (הוּא אוֹ הִיא?) = נגיעה יחידה.
async function clickCorrectText(page) {
  const tile = page.locator('.mcq-option[data-correct="1"]').first();
  await tile.waitFor({ state: 'visible', timeout: 15_000 });
  await tile.click();
}

// אופציית-שמע (ה' הידיעה) = two-tap: נגיעה 1 preview, נגיעה 2 בחירה.
async function pickCorrectAudio(page) {
  const tile = page.locator('.mcq-option[data-correct="1"]').first();
  await tile.waitFor({ state: 'visible', timeout: 15_000 });
  await tile.click();                 // preview (לא נמדד)
  await page.waitForTimeout(120);
  await tile.click();                 // בחירה (נמדדת)
}

test.describe('אי 10 · C10b — זכר/נקבה + ה׳ הידיעה', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-noa', name: 'נועה' }],
      currentStudent: 'stu-noa',
    });
  });

  test('island page loads clean: reef bg, noni, 4 quest cards', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

    await page.goto('/underwater-app/stage-10-island.html');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('.island-title')).toHaveText(/אִי 10/);
    await expect(page.locator('.island-title')).toHaveText(/אַבְנֵי הַבְּנִיָּה/);
    await expect(page.locator('.scene-bg')).toHaveAttribute('src', /scene-stage-3-bg\.png/);

    const noniLoaded = await page.locator('.noni-fixed').evaluate(
      (img) => img.complete && img.naturalWidth > 0);
    expect(noniLoaded).toBe(true);

    const hrefs = await page.locator('.quest-card').evaluateAll(
      (els) => els.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual([
      'stage-10-one-or-many.html',
      'stage-10-little-start.html',
      'stage-10-he-or-she.html',
      'stage-10-hey-hayedia.html',
    ]);

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });

  test('tablet landscape: all 4 quest cards visible and tappable (>=56px)', async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.goto('/underwater-app/stage-10-island.html');
    const cards = await page.locator('.quest-card').all();
    expect(cards.length).toBe(4);
    for (const card of cards) {
      await expect(card).toBeVisible();
      const box = await card.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(56);
    }
  });

  test('he-or-she: full 6-round run, events primary=10 + isl10-gender-adj', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/underwater-app/stage-10-he-or-she.html');
    await startAndWaitFirstRound(page);

    // אופציות = טקסט (זוג צורות תואר) — 2 אריחים, נגיעה יחידה
    const first = await page.locator('.mcq-option').all();
    expect(first.length).toBe(2);
    for (const t of first) {
      expect((await t.boundingBox()).height).toBeGreaterThanOrEqual(56);
    }

    for (let i = 0; i < 6; i++) {
      await clickCorrectText(page);
      await page.waitForTimeout(1400);
    }
    await expect(page.locator('.finish h2')).toHaveText(/מְצֻיָּן/);

    const events = (await readEvents(page)) || [];
    const mine = events.filter((e) => e.activity_type === 'mcq');
    expect(mine.length).toBe(6);
    for (const e of mine) {
      expect(e.primary_island_id).toBe(10);
      expect(e.characteristic_id).toBe('isl10-gender-adj');
      expect(e.is_correct).toBe(true);
    }
  });

  test('he-or-she: wrong pick logs EPA (GenderMismatch), primary=10 + isl10-gender-adj', async ({ page }) => {
    await page.goto('/underwater-app/stage-10-he-or-she.html');
    await startAndWaitFirstRound(page);

    await page.locator('.mcq-option[data-correct="0"]').first().click();

    await expect.poll(async () => {
      const events = (await readEvents(page)) || [];
      const e = events.find((x) => x.activity_type === 'mcq' && x.is_correct === false);
      if (!e) return null;
      return [e.primary_island_id, e.failure_type, e.characteristic_id].join('|');
    }).toBe('10|GenderMismatch|isl10-gender-adj');
  });

  test('hey-hayedia: audio options are two-tap (first tap previews, no measure)', async ({ page }) => {
    await page.goto('/underwater-app/stage-10-hey-hayedia.html');
    await startAndWaitFirstRound(page);

    const tiles = await page.locator('.mcq-option').all();
    expect(tiles.length).toBe(2);
    for (const t of tiles) {
      expect((await t.boundingBox()).height).toBeGreaterThanOrEqual(56);
    }

    // נגיעה ראשונה על אופציה = preview בלבד → אין אירוע נמדד
    await page.locator('.mcq-option').first().click();
    await page.waitForTimeout(300);
    const events = (await readEvents(page)) || [];
    expect(events.filter((e) => e.activity_type === 'mcq').length).toBe(0);
  });

  test('hey-hayedia: wrong pick logs EPA, primary=10 + isl10-hey-hayedia', async ({ page }) => {
    await page.goto('/underwater-app/stage-10-hey-hayedia.html');
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
        String(e.characteristic_id || '') === 'isl10-hey-hayedia'].join('|');
    }).toBe('10|true|true');
  });

  test('hey-hayedia: full 5-round run via two-tap reaches finish', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/underwater-app/stage-10-hey-hayedia.html');
    await startAndWaitFirstRound(page);
    for (let i = 0; i < 5; i++) {
      await pickCorrectAudio(page);
      await page.waitForTimeout(1400);
    }
    await expect(page.locator('.finish h2')).toHaveText(/מְעֻלֶּה/);

    const events = (await readEvents(page)) || [];
    const correct = events.filter((e) => e.activity_type === 'mcq' && e.is_correct === true);
    expect(correct.length).toBe(5);
    for (const e of correct) {
      expect(e.primary_island_id).toBe(10);
      expect(e.characteristic_id).toBe('isl10-hey-hayedia');
    }
  });

  test('guest mode smoke: island + both new games load with ?guest=1', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/underwater-app/stage-10-island.html?guest=1');
    await expect(page.locator('.island-title')).toBeVisible();
    for (const g of ['he-or-she', 'hey-hayedia']) {
      await page.goto(`/underwater-app/stage-10-${g}.html?guest=1`);
      await expect(page.locator('#startBtn')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
});
