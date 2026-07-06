// אי 12 · מְעָרַת הָאוֹצָרוֹת (stage-12-island.html) — דף-אי מעל stage-vocab-match.
// מאמת: דף-האי נטען נקי (רקע-שונית, נוני, 3 כרטיסים עם ?island=12) · ניווט
// מכרטיס → משחקון · דיווח עם ?island=12: primary_island_id=12 + האי ההיסטורי
// של המצב (word→5, image→14, sort→9) עובר ל-secondary_island_ids · בלי
// הפרמטר ההתנהגות הקיימת נשמרת (מכוסה ב-18-vocab-match.spec.js).
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

const MODE_SECONDARY = { word: 5, image: 14, sort: 9 };
const MODE_CID = { word: 'nov-w4-d1-c1', image: 'dec-w1-d4-c1', sort: 'feb-w4-d3-c2' };

async function clickCorrect(page) {
  const tile = page.locator('.mcq-option[data-correct="1"]').first();
  await tile.waitFor({ state: 'visible', timeout: 10_000 });
  await tile.click();
}

// יומן האירועים חי ב-state.js תחת underwater-app:v1 → state.events
async function readEvents(page) {
  return page.evaluate(() => (window.__avneiYesod ? window.__avneiYesod.events() : []));
}

test.describe('אי 12 · מערת האוצרות (stage-12-island)', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
    });
  });

  test('island page loads clean: reef bg, noni, 3 quest cards with island=12', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
    });
    await page.goto('/underwater-app/stage-12-island.html');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('.island-title')).toHaveText(/אִי 12/);
    await expect(page.locator('.island-title')).toHaveText(/הָאוֹצָרוֹת/);

    // חוקי העולם: רקע השונית המשותף + נוני-תמנון (PNG קיים, נטען בפועל)
    await expect(page.locator('.scene-bg')).toHaveAttribute('src', /scene-stage-3-bg\.png/);
    const noniLoaded = await page.locator('.noni-fixed').evaluate(
      (img) => img.complete && img.naturalWidth > 0);
    expect(noniLoaded).toBe(true);

    // 3 כרטיסים — מצב אחד לכל אחד, כולם עם ?island=12
    const hrefs = await page.locator('.quest-card').evaluateAll(
      (els) => els.map((a) => a.getAttribute('href')));
    expect(hrefs.length).toBe(3);
    for (const mode of ['word', 'image', 'sort']) {
      expect(hrefs.some((h) => h.includes(`mode=${mode}`) && h.includes('island=12'))).toBe(true);
    }

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });

  test('tablet landscape: cards visible and tappable (>=56px)', async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.goto('/underwater-app/stage-12-island.html');
    for (const card of await page.locator('.quest-card').all()) {
      await expect(card).toBeVisible();
      const box = await card.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(56);
    }
  });

  test('quest card navigates into vocab-match with island=12', async ({ page }) => {
    await page.goto('/underwater-app/stage-12-island.html');
    await page.locator('.quest-card[href*="mode=word"]').click();
    await expect(page).toHaveURL(/stage-vocab-match\.html\?mode=word&island=12/);
    await expect(page.locator('.start-card h1')).toHaveText(/אוֹצַר הַמִּלִּים/);
  });

  for (const mode of ['word', 'image', 'sort']) {
    test(`?island=12&mode=${mode}: events carry primary=12, secondary=[${MODE_SECONDARY[mode]}]`, async ({ page }) => {
      await page.goto(`/underwater-app/stage-vocab-match.html?mode=${mode}&island=12`);
      await page.locator('#startBtn').click();
      await clickCorrect(page);

      await expect.poll(async () => {
        const events = (await readEvents(page)) || [];
        const mine = events.find((e) =>
          String(e.item_id || '').startsWith(`vocab-match-${mode}-`));
        if (!mine) return null;
        return [
          mine.primary_island_id,
          JSON.stringify(mine.secondary_island_ids),
          mine.characteristic_id,
          typeof mine.strand_id,
        ].join('|');
      }).toBe(`12|[${MODE_SECONDARY[mode]}]|${MODE_CID[mode]}|number`);
    });
  }

  test('guest mode smoke: stage-12-island + vocab-match?island=12 load with ?guest=1', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/underwater-app/stage-12-island.html?guest=1');
    await expect(page.locator('.island-title')).toBeVisible();
    await page.goto('/underwater-app/stage-vocab-match.html?mode=word&island=12&guest=1');
    await expect(page.locator('#startBtn')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
