// Story 5 — Group suggester: 3 students with phonological → 1 morning group banner.
const { test, expect } = require('@playwright/test');
const { bypassPin, prepareSession } = require('./helpers');

const STUDENT_IDS = ['stu-a', 'stu-b', 'stu-c'];

test.describe('Story 5 · Morning group suggestions (B.9)', () => {
  test.beforeEach(async ({ page }) => {
    await bypassPin(page);
    await prepareSession(page, {
      students: STUDENT_IDS.map((id, i) => ({ id, name: `ילדה ${i + 1}` })),
      moyDoubleFail: { studentIds: STUDENT_IDS, patternId: 'phonological' },
    });
  });

  test('suggestGroups returns 1 group of 3 phonological students', async ({ page }) => {
    await page.goto('/underwater-app/teacher-rama.html');
    await page.waitForFunction(() => typeof window.AvneiGroupSuggester !== 'undefined', null, { timeout: 10000 });
    const groups = await page.evaluate((ids) => {
      try { return window.AvneiGroupSuggester.suggestGroups(ids) || []; }
      catch (e) { return { error: String(e) }; }
    }, STUDENT_IDS);
    expect(Array.isArray(groups)).toBe(true);
    expect(groups.length).toBe(1);
    expect(groups[0].pattern_id).toBe('phonological');
    expect(groups[0].students.length).toBe(3);
  });

  test('teacher-rama renders "🌅 קבוצות בוקר מוצעות" banner with 1 card · 3 ילדות', async ({ page }) => {
    await page.goto('/underwater-app/teacher-rama.html');
    const banner = page.locator('#morningGroupSuggestions');
    await expect(banner).toBeVisible();
    await expect(banner.locator('.mg-title')).toContainText('קבוצות בוקר מוצעות', { timeout: 10000 });
    const cards = banner.locator('.mg-card');
    await expect(cards).toHaveCount(1, { timeout: 10000 });
    await expect(cards.first()).toContainText('3 ילדות');
  });
});
