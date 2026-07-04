// Story 8 — F.21E "🎯 נקודות לחיזוק" + mark intervention done via SkillUnits API.
const { test, expect } = require('@playwright/test');
const { bypassPin, prepareSession } = require('./helpers');

const STUDENT_ID = 'stu-done';
const WEAK_LETTERS = ['מ', 'ש', 'ק'];

test.describe('Story 8 · F.21E letters section + markFrozen API', () => {
  test.beforeEach(async ({ page }) => {
    await bypassPin(page);
    await prepareSession(page, {
      students: [{ id: STUDENT_ID, name: 'דנה', profile: 'B' }],
      currentStudent: STUDENT_ID,
      weakBkt: { studentId: STUDENT_ID, letters: WEAK_LETTERS },
    });
  });

  test('teacher-action exposes #lettersSection + AvneiSkillUnits global', async ({ page }) => {
    await page.goto(`/underwater-app/teacher-action.html?student=${STUDENT_ID}`);
    await expect(page.locator('#lettersSection')).toBeAttached({ timeout: 10000 });
    const skillUnitsOk = await page.evaluate(() => {
      return typeof window.AvneiSkillUnits === 'object' &&
             typeof window.AvneiSkillUnits.addTarget === 'function' &&
             typeof window.AvneiSkillUnits.markFrozen === 'function';
    });
    expect(skillUnitsOk).toBe(true);
  });

  test('letters section header "נקודות לחיזוק" is rendered', async ({ page }) => {
    await page.goto(`/underwater-app/teacher-action.html?student=${STUDENT_ID}`);
    const header = page.locator('h2.ta-section-title', { hasText: 'נקודות לחיזוק' });
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('markFrozen API can be called for a letter unit without throwing', async ({ page }) => {
    await page.goto(`/underwater-app/teacher-action.html?student=${STUDENT_ID}`);
    const result = await page.evaluate(({ sid }) => {
      try {
        const unit = { type: 'letter', key: 'מ' };
        const r = window.AvneiSkillUnits.markFrozen(sid, unit, 'e2e-test');
        return { ok: true, result: r };
      } catch (e) { return { ok: false, err: String(e) }; }
    }, { sid: STUDENT_ID });
    expect(result.ok).toBe(true);
  });
});
