// אי 16 · שַׁרְשֶׁרֶת הָאַלְמוֹגִים (stage-16-island.html + stage-16-paragraph.html).
// שרשור משפטים לפסקה — מבוסס-קריאה: הילד.ה קורא.ת 3 משפטים מנוקדים בעצמו.ה
// (אֵין הקראת-משפטים) ומסדר.ת אותם בסדר הגיוני (tap-to-place).
// מאמת: primary_island_id=16 + strand 4 + characteristic_id (isl16-para-*) ·
//   activity_type=paragraph-build · טעות → EPA failure_type · פידבק ויזואלי
//   בלבד (אין <audio> אוטומטי למשפטים) · מגע ≥56px · guest=1 · טאבלט-לרוחב.
// התוכן inline ב-stage-16-paragraph.html (2 סטים built נגזרים מ-passages-read
// המאושר; 3 סטים ASK ב-built:false, לא בשימוש) → אין תלות ב-build-embedded-data.
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

// סדרי-האמת של הסטים ה-built (חייבים להיות זהים ל-ITEMS_BUILT בדף).
const BUILT = [
  { char: 'isl16-para-shuk', order: [
    'תָּמָר הָלְכָה לַשּׁוּק עִם סַל גָּדוֹל.',
    'הִיא קָנְתָה תַּפּוּחַ אָדֹם וְלֶחֶם חַם.',
    'בַּסּוֹף תָּמָר חָזְרָה הַבַּיְתָה שְׂמֵחָה.',
  ] },
  { char: 'isl16-para-bees', order: [
    'הַדְּבוֹרָה עָפָה מִפֶּרַח לְפֶרַח.',
    'הִיא אוֹסֶפֶת צוּף מָתוֹק מֵהַפְּרָחִים.',
    'הַדְּבוֹרָה עוֹשָׂה דְּבַשׁ מֵהַצּוּף.',
  ] },
];

async function readEvents(page) {
  return page.evaluate(() => (window.__avneiYesod ? window.__avneiYesod.events() : []));
}

// זיהוי הסט הנוכחי לפי סט-המשפטים המוצג, והחזרת הסדר הנכון.
async function currentOrder(page) {
  const shown = await page.locator('.mpb-choice').evaluateAll(
    (els) => els.map((e) => e.dataset.sentence));
  const item = BUILT.find((it) =>
    it.order.length === shown.length && it.order.every((s) => shown.includes(s)));
  if (!item) throw new Error('unknown round; shown=' + JSON.stringify(shown));
  return item.order;
}

// לחיצה על המשפטים בסדר נתון (לפי data-sentence), ואז בדיקה.
async function placeAndCheck(page, order) {
  for (const sentence of order) {
    const btn = page.locator(`.mpb-choice[data-sentence="${cssEscape(sentence)}"]`).first();
    await btn.click();
  }
  await page.locator('#mpbCheckBtn').click();
}

// escape למירכאות בתוך attribute-selector (הטקסט מכיל ניקוד אך לא מירכאות).
function cssEscape(s) { return s.replace(/"/g, '\\"'); }

async function solveCorrect(page) {
  const order = await currentOrder(page);
  await placeAndCheck(page, order);
}

test.describe('אי 16 · שרשרת האלמוגים', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-noa', name: 'נועה' }],
      currentStudent: 'stu-noa',
    });
  });

  test('island page: reef bg, noni, correct name, quest → paragraph screen', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

    await page.goto('/underwater-app/stage-16-island.html');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('.island-title')).toHaveText(/אִי 16/);
    await expect(page.locator('.island-title')).toHaveText(/שַׁרְשֶׁרֶת הָאַלְמוֹגִים/);
    await expect(page.locator('.scene-bg')).toHaveAttribute('src', /scene-stage-3-bg\.png/);

    const noniLoaded = await page.locator('.noni-fixed').evaluate(
      (img) => img.complete && img.naturalWidth > 0);
    expect(noniLoaded).toBe(true);

    const hrefs = await page.locator('.quest-card').evaluateAll(
      (els) => els.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual(['stage-16-paragraph.html']);

    // כפתור הקראת-הסיפור קיים (ידני)
    await expect(page.locator('#storyBtn')).toBeVisible();

    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });

  test('tablet landscape: quest card + story button tappable (>=56px)', async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.goto('/underwater-app/stage-16-island.html');
    for (const sel of ['.quest-card', '#storyBtn']) {
      const el = page.locator(sel);
      await expect(el).toBeVisible();
      expect((await el.boundingBox()).height).toBeGreaterThanOrEqual(56);
    }
  });

  test('paragraph screen: sentences shown (no auto-audio), full run → primary=16 + bank char', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/underwater-app/stage-16-paragraph.html?auto=1');

    // המשפטים מוצגים כאריחי-טקסט; אין <audio> מתנגן אוטומטית למשפטים.
    await page.locator('.mpb-choice').first().waitFor({ state: 'visible', timeout: 20_000 });
    expect(await page.locator('audio').count()).toBe(0);

    // מגע ≥56px על האריחים
    for (const c of await page.locator('.mpb-choice').all()) {
      expect((await c.boundingBox()).height).toBeGreaterThanOrEqual(56);
    }

    // 2 סבבים (built) — פותרים נכון עד מסך-הסיום
    for (let i = 0; i < BUILT.length; i++) {
      await solveCorrect(page);
      await page.waitForTimeout(2100);
    }
    await expect(page.locator('.summary-title')).toBeVisible();

    const mine = (await readEvents(page)).filter((e) => e.activity_type === 'paragraph-build');
    expect(mine.length).toBe(BUILT.length);
    for (const e of mine) {
      expect(e.primary_island_id).toBe(16);
      expect(e.strand_id).toBe(4);
      expect(String(e.characteristic_id || '')).toMatch(/^isl16-para-/);
      expect(e.is_correct).toBe(true);
    }
  });

  test('wrong order logs EPA (failure_type), primary=16 + bank char', async ({ page }) => {
    await page.goto('/underwater-app/stage-16-paragraph.html?auto=1');
    await page.locator('.mpb-choice').first().waitFor({ state: 'visible', timeout: 20_000 });

    // סדר הפוך (בוודאות שגוי לסטים בעלי סדר קשיח)
    const order = await currentOrder(page);
    await placeAndCheck(page, order.slice().reverse());

    await expect.poll(async () => {
      const e = (await readEvents(page)).find(
        (x) => x.activity_type === 'paragraph-build' && x.is_correct === false);
      if (!e) return null;
      return [e.primary_island_id, e.strand_id, !!e.failure_type,
        String(e.characteristic_id || '').startsWith('isl16-para-')].join('|');
    }).toBe('16|4|true|true');
  });

  test('guest mode smoke: island + paragraph screen load with ?guest=1', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/underwater-app/stage-16-island.html?guest=1');
    await expect(page.locator('.island-title')).toBeVisible();
    await page.goto('/underwater-app/stage-16-paragraph.html?guest=1');
    await expect(page.locator('#startBtn')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
