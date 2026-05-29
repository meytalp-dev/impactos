// Story 2 — Island 3 letter quest smoke. Page loads, JS globals available, no console errors.
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

test.describe('Story 2 · Stage-3 letter quest (אי 3)', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
    });
  });

  test('shell quest page loads with no critical JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
    });
    await page.goto('/underwater-app/stage-3-shell.html');
    await page.waitForLoadState('domcontentloaded');
    const jsErrors = errors.filter((e) =>
      !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
    expect(jsErrors).toEqual([]);
  });

  test('alef letter game loads + exposes AvneiBKT global', async ({ page }) => {
    await page.goto('/underwater-app/stage-3-alef.html');
    await page.waitForLoadState('domcontentloaded');
    const hasBkt = await page.evaluate(() =>
      typeof window.AvneiBKT === 'object' && typeof AvneiBKT.ingestEvent === 'function');
    expect(hasBkt).toBe(true);
  });

  test('BKT.ingestEvent accepts a synthetic event without throwing', async ({ page }) => {
    await page.goto('/underwater-app/stage-3-alef.html');
    await page.waitForLoadState('domcontentloaded');
    const ingestOk = await page.evaluate(() => {
      try {
        AvneiBKT.ingestEvent({
          student_id: 'stu-maya',
          island_id: 3,
          target_letter: 'א',
          is_correct: true,
          timestamp: 1000,
        });
        return true;
      } catch (e) { return false; }
    });
    expect(ingestOk).toBe(true);
  });
});
