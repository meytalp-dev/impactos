// Story 9 — Pack × BKT weakness targeting.
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

const STUDENT_ID = 'stu-pack';
const WEAK_LETTERS = ['מ', 'ש', 'ק'];

test.describe('Story 9 · Pack × BKT weakness targeting', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: STUDENT_ID, name: 'אורי', profile: 'B' }],
      currentStudent: STUDENT_ID,
      weakBkt: { studentId: STUDENT_ID, letters: WEAK_LETTERS },
    });
  });

  test('AvneiPackBridge.selectItemsForStudent exists and is callable', async ({ page }) => {
    await page.goto('/underwater-app/teacher-rama.html');
    await page.waitForFunction(() => typeof window.AvneiPackBridge !== 'undefined', null, { timeout: 10000 });
    const ok = await page.evaluate(() => typeof window.AvneiPackBridge.selectItemsForStudent === 'function');
    expect(ok).toBe(true);
  });

  test('selectItemsForStudent returns an array (smoke)', async ({ page }) => {
    await page.goto('/underwater-app/teacher-rama.html');
    await page.waitForFunction(() => typeof window.AvneiPackBridge !== 'undefined', null, { timeout: 10000 });
    const result = await page.evaluate(({ sid }) => {
      try {
        const r = window.AvneiPackBridge.selectItemsForStudent(sid);
        return { ok: true, isArray: Array.isArray(r), length: Array.isArray(r) ? r.length : -1 };
      } catch (e) { return { ok: false, err: String(e) }; }
    }, { sid: STUDENT_ID });
    expect(result.ok).toBe(true);
    expect(result.isArray).toBe(true);
  });

  test('AvneiBKT.getWeakestLetters returns the seeded weak Hebrew letters', async ({ page }) => {
    await page.goto('/underwater-app/teacher-rama.html');
    await page.waitForFunction(() => typeof window.AvneiBKT !== 'undefined', null, { timeout: 10000 });
    const weak = await page.evaluate(({ sid }) => {
      try {
        const r = window.AvneiBKT.getWeakestLetters(sid, 5);
        return { ok: true, letters: r };
      } catch (e) { return { ok: false, err: String(e) }; }
    }, { sid: STUDENT_ID });
    expect(weak.ok).toBe(true);
    expect(Array.isArray(weak.letters)).toBe(true);
    const chars = (weak.letters || []).map((x) => (typeof x === 'string') ? x : x.letter);
    const hit = chars.some((l) => WEAK_LETTERS.includes(l));
    expect(hit).toBe(true);
  });
});
