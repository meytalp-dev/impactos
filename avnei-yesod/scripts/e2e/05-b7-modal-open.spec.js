// Story 6 — Open the B.7 intervention modal from a morning-group card.
const { test, expect } = require('@playwright/test');
const { bypassPin, prepareSession } = require('./helpers');

const STUDENT_IDS = ['stu-a', 'stu-b', 'stu-c'];

test.describe('Story 6 · B.7 modal open + FULL phonological script', () => {
  test.beforeEach(async ({ page }) => {
    await bypassPin(page);
    await prepareSession(page, {
      students: STUDENT_IDS.map((id, i) => ({ id, name: `ילדה ${i + 1}` })),
      moyDoubleFail: { studentIds: STUDENT_IDS, patternId: 'phonological' },
    });
  });

  test('phonological.json is FULL (≥5K chars, has hook+check stages)', async ({ request }) => {
    const res = await request.get('/underwater-app/interventions/phonological.json');
    expect(res.ok()).toBe(true);
    const text = await res.text();
    expect(text.length).toBeGreaterThanOrEqual(5000);
    const data = JSON.parse(text);
    expect(data.pattern_id || data.patternId).toBe('phonological');
    const flat = JSON.stringify(data).toLowerCase();
    expect(flat).toContain('hook');
    expect(flat).toContain('check');
  });

  test('clicking morning-group "פתחי קבוצה" opens B.7 modal', async ({ page }) => {
    await page.goto('/underwater-app/teacher-rama.html');
    const openBtn = page.locator('#morningGroupSuggestions button.mg-open').first();
    await expect(openBtn).toBeVisible({ timeout: 10000 });
    await openBtn.click();
    const modal = page.locator('[data-iv-modal="1"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('.iv-body')).toBeVisible();
  });
});
