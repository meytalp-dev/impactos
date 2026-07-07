// אי 6 · לְהָקַת דְּגֵי הַמִּלִּים (stage-6-island.html + 2 משחקוני שטף-מילה).
// מאמת: דף-האי נטען נקי (רקע-שונית, נוני, 2 כרטיסי quest) · "דָּג מָהִיר" ריצה
// מלאה עם אירועים primary_island_id=6 + item_id נושא-המילה + response_time_ms על
// נכון (המדידה = זמן-תגובה למגע, לא הקראה) · "דְּגִיגוֹן חוֹזֵר" repeated reading ·
// טעות לא "מכשילה" (הזדמנות נוספת) · יעדי-מגע ≥56px · טאבלט-לרוחב · מצב guest=1.
// התוכן = anchor words עם word-<key>.mp3 קיים (js/shared/island6-game.js).
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

async function readEvents(page) {
  return page.evaluate(() => (window.__avneiYesod ? window.__avneiYesod.events() : []));
}

// אחרי "מתחילים" מתנגן קליפ-משימה (fallback ~10ש') ורק אז עולה הסבב הראשון.
async function startGame(page) {
  await page.locator('#startBtn').click();
  await page.locator('.fw-options.is-revealed').first().waitFor({ state: 'visible', timeout: 20_000 });
}

// מקישים על המילה הנכונה — רק אחרי שהאופציות נחשפו (pointer-events).
async function clickCorrect(page) {
  await page.locator('.fw-options.is-revealed').first().waitFor({ state: 'visible', timeout: 15_000 });
  await page.locator('.fw-option[data-correct="1"]').first().click();
}

// מריץ סבבים עד שמסך-הסיום מופיע (עד maxRounds ליתר ביטחון).
async function runToFinish(page, maxRounds) {
  for (let i = 0; i < maxRounds; i++) {
    if (await page.locator('.finish h2').count()) break;
    await clickCorrect(page);
    await page.waitForTimeout(1400);
  }
}

test.describe('אי 6 · להקת דגי המילים', () => {
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

    await page.goto('/underwater-app/stage-6-island.html');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('.island-title')).toHaveText(/אִי 6/);
    await expect(page.locator('.island-title')).toHaveText(/דְּגֵי הַמִּלִּים/);

    // חוקי העולם: רקע-שונית משותף + נוני-תמנון PNG שנטען בפועל
    await expect(page.locator('.scene-bg')).toHaveAttribute('src', /scene-stage-3-bg\.png/);
    const noniLoaded = await page.locator('.noni-fixed').evaluate((img) => img.complete && img.naturalWidth > 0);
    expect(noniLoaded).toBe(true);

    const hrefs = await page.locator('.quest-card').evaluateAll((els) => els.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual(['stage-6-fast-fish.html', 'stage-6-repeat-fish.html']);

    const jsErrors = errors.filter((e) => !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });

  test('tablet landscape: quest cards visible and tappable (>=56px)', async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.goto('/underwater-app/stage-6-island.html');
    for (const card of await page.locator('.quest-card').all()) {
      await expect(card).toBeVisible();
      const box = await card.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(56);
    }
  });

  test('fast-fish: full run, events carry flash-word + primary=6 + item_id + response_time_ms', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/underwater-app/stage-6-fast-fish.html');
    await startGame(page);
    await runToFinish(page, 8);

    await expect(page.locator('.finish h2')).toBeVisible();

    const events = (await readEvents(page)) || [];
    const mine = events.filter((e) => e.activity_type === 'flash-word' && e.is_correct === true);
    expect(mine.length).toBeGreaterThanOrEqual(5);
    for (const e of mine) {
      expect(e.primary_island_id).toBe(6);
      expect(e.activity_variant).toBe('flash');
      expect(String(e.item_id || '')).toMatch(/^isl6-flash-/);
      // 🔴 עקרון-מדידה: זמן-תגובה נשמר על תשובה נכונה
      expect(typeof e.response_time_ms).toBe('number');
      expect(e.response_time_ms).toBeGreaterThan(0);
      expect(e.target_letter).toBeTruthy();
    }
  });

  test('fast-fish: three text options, each >=56px, replay audio button present', async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.goto('/underwater-app/stage-6-fast-fish.html');
    await startGame(page);
    const tiles = await page.locator('.fw-option').all();
    expect(tiles.length).toBe(3);
    for (const t of tiles) {
      const box = await t.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(56);
    }
    await expect(page.locator('.fw-replay')).toBeVisible();
  });

  test('fast-fish: wrong tap never fails — round stays open, no wrong event blocks completion', async ({ page }) => {
    await page.goto('/underwater-app/stage-6-fast-fish.html');
    await startGame(page);

    // מקישים על מסיח (שגוי) — הסבב לא ננעל, אפשר עדיין לבחור נכון
    await page.locator('.fw-option[data-correct="0"]').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('.fw-option[data-correct="1"]').first()).toBeVisible();
    await page.locator('.fw-option[data-correct="1"]').first().click();

    await expect.poll(async () => {
      const events = (await readEvents(page)) || [];
      const wrong = events.find((e) => e.activity_type === 'flash-word' && e.is_correct === false);
      if (!wrong) return null;
      // טעות: primary=6, בלי response_time_ms (שטף נמדד רק על נכון)
      return [wrong.primary_island_id, wrong.response_time_ms].join('|');
    }).toBe('6|');
  });

  test('repeat-fish: repeated reading run, events carry variant=repeat + occurrence in item_id', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/underwater-app/stage-6-repeat-fish.html');
    await startGame(page);
    await runToFinish(page, 11);

    await expect(page.locator('.finish h2')).toBeVisible();

    const events = (await readEvents(page)) || [];
    const mine = events.filter((e) => e.activity_type === 'flash-word' && e.is_correct === true);
    expect(mine.length).toBeGreaterThanOrEqual(6);
    for (const e of mine) {
      expect(e.primary_island_id).toBe(6);
      expect(e.activity_variant).toBe('repeat');
      expect(String(e.item_id || '')).toMatch(/^isl6-repeat-.*-r\d+$/);
      expect(typeof e.response_time_ms).toBe('number');
    }
    // חשיפה חוזרת: אותה מילה מופיעה יותר מפעם אחת (repeated reading)
    const byWord = {};
    mine.forEach((e) => {
      const base = String(e.item_id).replace(/-r\d+$/, '');
      byWord[base] = (byWord[base] || 0) + 1;
    });
    expect(Math.max(...Object.values(byWord))).toBeGreaterThanOrEqual(2);
  });

  test('guest mode smoke: island + both games load with ?guest=1', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/underwater-app/stage-6-island.html?guest=1');
    await expect(page.locator('.island-title')).toBeVisible();
    for (const g of ['fast-fish', 'repeat-fish']) {
      await page.goto(`/underwater-app/stage-6-${g}.html?guest=1`);
      await expect(page.locator('#startBtn')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
});
