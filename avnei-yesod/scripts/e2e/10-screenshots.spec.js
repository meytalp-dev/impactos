// Auxiliary spec — capture screenshots of the main pilot screens for the verification
// report. Each screenshot is full-page and saved to scripts/e2e/screenshots/.
const { test } = require('@playwright/test');
const { bypassPin, prepareSession } = require('./helpers');

const COHORT = ['stu-a', 'stu-b', 'stu-c'];

test.describe('Verification report screenshots', () => {
  test('onboarding-profile · screen-list', async ({ page }, testInfo) => {
    await prepareSession(page);
    await page.goto('/engine/onboarding-profile.html');
    await page.waitForSelector('#screen-list');
    await page.screenshot({
      path: `screenshots/${testInfo.project.name}-01-onboarding-list.png`,
      fullPage: true,
    });
  });

  test('moy-screener · welcome', async ({ page }, testInfo) => {
    await prepareSession(page, {
      students: [{ id: 'stu-tamar', name: 'תמר' }],
      currentStudent: 'stu-tamar',
    });
    await page.goto('/engine/moy-screener.html?student=stu-tamar&task=4');
    await page.waitForFunction(() => window.__moy && typeof __moy.session === 'function');
    await page.screenshot({
      path: `screenshots/${testInfo.project.name}-03-moy-welcome.png`,
      fullPage: true,
    });
  });

  test('teacher-rama · morning group banner', async ({ page }, testInfo) => {
    await bypassPin(page);
    await prepareSession(page, {
      students: COHORT.map((id, i) => ({ id, name: `ילדה ${i + 1}` })),
      moyDoubleFail: { studentIds: COHORT, patternId: 'phonological' },
    });
    await page.goto('/underwater-app/teacher-rama.html');
    await page.locator('#morningGroupSuggestions .mg-card').first().waitFor({ timeout: 10000 });
    await page.screenshot({
      path: `screenshots/${testInfo.project.name}-05-teacher-rama-morning-group.png`,
      fullPage: true,
    });
  });

  test('teacher-rama · B.7 modal open', async ({ page }, testInfo) => {
    await bypassPin(page);
    await prepareSession(page, {
      students: COHORT.map((id, i) => ({ id, name: `ילדה ${i + 1}` })),
      moyDoubleFail: { studentIds: COHORT, patternId: 'phonological' },
    });
    await page.goto('/underwater-app/teacher-rama.html');
    await page.locator('#morningGroupSuggestions button.mg-open').first().click();
    await page.locator('[data-iv-modal="1"]').waitFor({ timeout: 5000 });
    await page.screenshot({
      path: `screenshots/${testInfo.project.name}-06-b7-modal-open.png`,
      fullPage: true,
    });
  });

  test('teacher-action · F.21E letters section', async ({ page }, testInfo) => {
    await bypassPin(page);
    await prepareSession(page, {
      students: [{ id: 'stu-done', name: 'דנה', profile: 'B' }],
      currentStudent: 'stu-done',
      weakBkt: { studentId: 'stu-done', letters: ['מ', 'ש', 'ק'] },
    });
    await page.goto('/underwater-app/teacher-action.html?student=stu-done');
    await page.locator('#lettersSection').waitFor({ timeout: 5000 });
    await page.screenshot({
      path: `screenshots/${testInfo.project.name}-08-teacher-action-letters.png`,
      fullPage: true,
    });
  });
});
