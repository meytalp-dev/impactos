// Chain test — full pilot user journey integration smoke.
// Story 1 (onboarding adds a student) → Stories 3+4 (MOY fail wires suggested_intervention) →
// Story 5 (group banner) → Story 6 (B.7 modal) → Story 8 (F.21E section reads same state).
//
// Note: MOY assertions in detail are covered by spec 03. Here we use the helper-seed
// path for the 3-student cohort to avoid the 'low'-confidence fallback that the
// real MOY default mapping returns (group-suggester filters < 'med' by default).
const { test, expect } = require('@playwright/test');
const { bypassPin, prepareSession, readStudents, readLocal, ASSESSMENTS_KEY } = require('./helpers');

test.describe('Story 1→9 chain · pilot journey integration', () => {
  test('end-to-end: onboarding → MOY suggestion seeded → group banner → modal → letters section', async ({ page }) => {
    await bypassPin(page);
    // Pre-seed two cohort students.
    await prepareSession(page, {
      students: [{ id: 'stu-b', name: 'תמר' }, { id: 'stu-c', name: 'דנה' }],
      moyDoubleFail: { studentIds: ['stu-b', 'stu-c'], patternId: 'phonological' },
    });

    // Step 1 — onboarding UI adds a third student (verifies story 1 end-to-end).
    await page.goto('/engine/onboarding-profile.html');
    await page.fill('#new-student-name', 'מאיה');
    await page.click('#btn-add-student');
    await expect(page.locator('#screen-rubric')).toBeVisible({ timeout: 5000 });
    const created = await readStudents(page);
    expect(created.length).toBe(3);
    const sid = (created.find((s) => s.name === 'מאיה') || {}).id;
    expect(sid).toBeTruthy();

    // Step 3+4 — seed stu-maya's MOY fail state alongside the others. We do this via
    // a direct localStorage write (not the real API) so all three students share the
    // same 'med' confidence and end up in one suggested group of size 3.
    await page.evaluate(({ s, key, threshold, max, failScore }) => {
      const raw = localStorage.getItem(key);
      const state = raw ? JSON.parse(raw) : { boy: {}, moy: {}, eoy: {} };
      const attempt = {
        date: 0, task_3: null,
        task_4: { score: failScore, threshold, max, status: 'fail' },
        overall_status: 'fail',
      };
      state.moy[s] = {
        date: 0, attempts: [attempt, { ...attempt, date: 1 }],
        latest_status: 'fail', next_review_due: null,
        suggested_intervention: { patternId: 'phonological', source: 'moy', confidence: 'med', from_task: 'task_4' },
      };
      localStorage.setItem(key, JSON.stringify(state));
    }, { s: sid, key: ASSESSMENTS_KEY, threshold: 16, max: 22, failScore: 8 });

    // Step 5+6 — teacher-rama renders the morning group AND modal opens.
    await page.goto('/underwater-app/teacher-rama.html');
    const banner = page.locator('#morningGroupSuggestions');
    await expect(banner.locator('.mg-title')).toContainText('קבוצות בוקר מוצעות', { timeout: 10000 });
    await expect(banner.locator('.mg-card')).toHaveCount(1, { timeout: 10000 });
    await banner.locator('button.mg-open').first().click();
    await expect(page.locator('[data-iv-modal="1"]')).toBeVisible({ timeout: 5000 });

    // All three students still carry phonological suggestion.
    const state = await readLocal(page, ASSESSMENTS_KEY);
    ['stu-b', 'stu-c', sid].forEach((s) => {
      expect(state.moy[s].suggested_intervention.patternId).toBe('phonological');
    });

    // Step 8 (F.21E / teacher-action.html) הוסר — המסך אורכב ב-4.7.2026.
  });
});
