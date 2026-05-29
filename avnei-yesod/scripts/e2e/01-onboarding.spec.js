// Story 1 — Onboarding profile: teacher creates a student via the rubric.
// Expected: student record written to localStorage 'avnei-yesod-students'.
const { test, expect } = require('@playwright/test');
const { prepareSession, readStudents } = require('./helpers');

test.describe('Story 1 · Onboarding (engine/onboarding-profile.html)', () => {
  test.beforeEach(async ({ page }) => { await prepareSession(page); });

  test('page loads with PIN-less list screen + add-student input visible', async ({ page }) => {
    await page.goto('/engine/onboarding-profile.html');
    await expect(page.locator('#screen-list')).toBeVisible();
    await expect(page.locator('#new-student-name')).toBeVisible();
    await expect(page.locator('#btn-add-student')).toBeVisible();
  });

  test('adding a student via the name input writes record to avnei-yesod-students', async ({ page }) => {
    await page.goto('/engine/onboarding-profile.html');
    const studentName = 'מאיה כהן';
    await page.fill('#new-student-name', studentName);
    await page.click('#btn-add-student');
    await expect(page.locator('#screen-rubric')).toBeVisible({ timeout: 5000 });

    const students = await readStudents(page);
    expect(students.length).toBe(1);
    expect(students[0].name).toBe(studentName);
    expect(typeof students[0].id).toBe('string');
    expect(students[0].id.length).toBeGreaterThan(0);
  });

  test('rubric screen exposes radio observations + calculate button', async ({ page }) => {
    await page.goto('/engine/onboarding-profile.html');
    await page.fill('#new-student-name', 'תמר');
    await page.click('#btn-add-student');
    await expect(page.locator('#screen-rubric')).toBeVisible();
    await expect(page.locator('#btn-calculate')).toBeVisible();
    const radioGroups = await page.locator('input[type="radio"]').count();
    expect(radioGroups).toBeGreaterThanOrEqual(11 * 2);
  });
});
