// אי 15 · מִפְרַץ הַתְּמוּנוֹת (stage-15-island.html + stage-15-sentence.html).
// הבנת משפט בודד כתוב. שני מצבים במסך אחד (?mode=image | ?mode=question):
//   image    — משפט (טקסט, לא מוקרא) → בחירת תמונה מבין 3 (assets/vocab/).
//   question — משפט (נשאר על המסך) → שאלה קצרה (מי/מה/איפה) + 3 תשובות טקסט;
//              רמקול-עזרה משמיע את השאלה בלבד, ידני.
// מאמת: primary_island_id=15 + characteristic_id מהבנק + strand 4 · activity_type
// mcq (מבחין מ-read_aloud של stage-read-aloud) · טעות → EPA failure_type ·
// אין <audio> אוטומטי למשפט · מגע ≥56px · guest=1 · טאבלט-לרוחב. התוכן inline
// ב-js/shared/island15-game.js, נאמן ל-questions-grade1 reading_comprehension.
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

async function readEvents(page) {
  return page.evaluate(() => (window.__avneiYesod ? window.__avneiYesod.events() : []));
}

async function startAndWaitFirstRound(page) {
  await page.locator('#startBtn').click();
  await page.locator('.mcq-option').first().waitFor({ state: 'visible', timeout: 20_000 });
}

async function clickCorrect(page) {
  const tile = page.locator('.mcq-option[data-correct="1"]').first();
  await tile.waitFor({ state: 'visible', timeout: 15_000 });
  await tile.click();
}

test.describe('אי 15 · מפרץ התמונות', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-noa', name: 'נועה' }],
      currentStudent: 'stu-noa',
    });
  });

  test('island page loads clean: reef bg, noni, 2 quest cards, correct name', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

    await page.goto('/underwater-app/stage-15-island.html');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('.island-title')).toHaveText(/אִי 15/);
    await expect(page.locator('.island-title')).toHaveText(/הַתְּמוּנוֹת/);
    await expect(page.locator('.scene-bg')).toHaveAttribute('src', /scene-stage-3-bg\.png/);

    const noniLoaded = await page.locator('.noni-fixed').evaluate(
      (img) => img.complete && img.naturalWidth > 0);
    expect(noniLoaded).toBe(true);

    const hrefs = await page.locator('.quest-card').evaluateAll(
      (els) => els.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual([
      'stage-15-sentence.html?mode=image',
      'stage-15-sentence.html?mode=question',
    ]);

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });

  test('tablet landscape: quest cards visible and tappable (>=56px)', async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.goto('/underwater-app/stage-15-island.html');
    for (const card of await page.locator('.quest-card').all()) {
      await expect(card).toBeVisible();
      const box = await card.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(56);
    }
  });

  test('image mode: sentence shown (not auto-read), full 6-round run, primary=15 + bank char', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/underwater-app/stage-15-sentence.html?mode=image');
    await startAndWaitFirstRound(page);

    // המשפט מוצג ככרטיס-טקסט (stem) — לא כפתור-שמע, ואין <audio> מתנגן.
    await expect(page.locator('.mcq-stem-card--text')).toBeVisible();
    expect(await page.locator('.mcq-stem-audio').count()).toBe(0);

    // כל אופציה = תמונה שנטענה בפועל מ-assets/vocab/
    const imgsOk = await page.locator('.mcq-option img').evaluateAll(
      (imgs) => imgs.length > 0 && imgs.every((i) => i.complete && i.naturalWidth > 0));
    expect(imgsOk).toBe(true);

    for (let i = 0; i < 6; i++) {
      await clickCorrect(page);
      await page.waitForTimeout(1400);
    }
    await expect(page.locator('.finish h2')).toHaveText(/כָּל הַכָּבוֹד/);

    const events = (await readEvents(page)) || [];
    const mine = events.filter((e) => e.activity_type === 'mcq');
    expect(mine.length).toBe(6);
    for (const e of mine) {
      expect(e.primary_island_id).toBe(15);
      expect(e.strand_id).toBe(4);
      expect(String(e.characteristic_id || '')).toMatch(/^(dec|apr)-/);
      expect(e.is_correct).toBe(true);
    }
  });

  test('question mode: sentence stays on screen + question + manual help-speaker', async ({ page }) => {
    await page.goto('/underwater-app/stage-15-sentence.html?mode=question');
    await startAndWaitFirstRound(page);

    // המשפט = כרטיס passage (נשאר על המסך), השאלה = כרטיס-טקסט, 3 תשובות טקסט.
    await expect(page.locator('.mcq-passage-text')).toBeVisible();
    await expect(page.locator('.mcq-stem-card--text')).toBeVisible();
    const tiles = await page.locator('.mcq-option').all();
    expect(tiles.length).toBe(3);
    for (const t of tiles) {
      expect((await t.boundingBox()).height).toBeGreaterThanOrEqual(56);
    }
    // רמקול-עזרה לשאלה קיים; אין השמעה אוטומטית (הכפתור ידני)
    await expect(page.locator('.q-help-spk')).toBeVisible();
    expect(await page.locator('.mcq-stem-audio').count()).toBe(0);
  });

  test('question mode: wrong pick logs EPA (failure_type), primary=15 + bank char', async ({ page }) => {
    await page.goto('/underwater-app/stage-15-sentence.html?mode=question');
    await startAndWaitFirstRound(page);

    const wrong = page.locator('.mcq-option[data-correct="0"]').first();
    await wrong.click();

    await expect.poll(async () => {
      const events = (await readEvents(page)) || [];
      const e = events.find((x) => x.activity_type === 'mcq' && x.is_correct === false);
      if (!e) return null;
      return [e.primary_island_id, e.strand_id, !!e.failure_type,
        !!e.characteristic_id].join('|');
    }).toBe('15|4|true|true');
  });

  test('question mode: full 6-round run reaches finish, all primary=15', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/underwater-app/stage-15-sentence.html?mode=question');
    await startAndWaitFirstRound(page);
    for (let i = 0; i < 6; i++) {
      await clickCorrect(page);
      await page.waitForTimeout(1400);
    }
    await expect(page.locator('.finish h2')).toHaveText(/כָּל הַכָּבוֹד/);

    const events = (await readEvents(page)) || [];
    const correct = events.filter((e) => e.activity_type === 'mcq' && e.is_correct === true);
    expect(correct.length).toBe(6);
    for (const e of correct) expect(e.primary_island_id).toBe(15);
  });

  test('guest mode smoke: island + both modes load with ?guest=1', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/underwater-app/stage-15-island.html?guest=1');
    await expect(page.locator('.island-title')).toBeVisible();
    for (const m of ['image', 'question']) {
      await page.goto(`/underwater-app/stage-15-sentence.html?mode=${m}&guest=1`);
      await expect(page.locator('#startBtn')).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
});
