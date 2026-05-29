// Stories 3+4 — MOY-Lite task 4 fail flow + suggested_intervention auto-save.
const { test, expect } = require('@playwright/test');
const { prepareSession, readLocal, ASSESSMENTS_KEY } = require('./helpers');

const STUDENT_ID = 'stu-tamar';

test.describe('Stories 3+4 · MOY task 4 + suggested_intervention', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: STUDENT_ID, name: 'תמר' }],
      currentStudent: STUDENT_ID,
    });
  });

  // The MOY screener starts on a welcome screen. Clicking #startBtn triggers startTasks(),
  // which populates session.task4Items via balancedSelectTask4 (reads item.type, not sub_type).
  async function startTask4(page) {
    await page.waitForFunction(() => window.__moy && typeof __moy.session === 'function', null, { timeout: 10000 });
    await page.locator('#startBtn').click();
    await page.waitForFunction(() => window.__moy.session().task4Items.length === 22, null, { timeout: 5000 });
  }

  test('story 3a · ?task=4 loads with 22 items balanced (7+8+7)', async ({ page }) => {
    await page.goto(`/engine/moy-screener.html?student=${STUDENT_ID}&task=4`);
    await startTask4(page);
    const t4Items = await page.evaluate(() => __moy.session().task4Items);
    expect(t4Items.length).toBe(22);
    const byType = t4Items.reduce((acc, item) => {
      const k = item.type || 'unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    expect(Object.values(byType).sort()).toEqual([7, 7, 8]);
  });

  test('story 3b · finishing with all-wrong answers yields task_4 fail status', async ({ page }) => {
    await page.goto(`/engine/moy-screener.html?student=${STUDENT_ID}&task=4`);
    await startTask4(page);
    await page.evaluate(() => {
      const s = __moy.session();
      s.results.task_4.score = 0;
      __moy.finishNow();
    });
    await page.waitForFunction(() => {
      const raw = localStorage.getItem('underwater-app:assessments');
      if (!raw) return false;
      try { return !!(JSON.parse(raw).moy && Object.keys(JSON.parse(raw).moy).length); }
      catch (e) { return false; }
    }, null, { timeout: 5000 });

    const state = await readLocal(page, ASSESSMENTS_KEY);
    const rec = state.moy[STUDENT_ID];
    expect(rec).toBeTruthy();
    expect(rec.attempts.length).toBe(1);
    const att = rec.attempts[0];
    expect(att.overall_status).toBe('fail');
    expect(att.task_4.status).toBe('fail');
    expect(att.task_4.score).toBe(0);
  });

  test('story 4 · second consecutive fail sets suggested_intervention.phonological', async ({ page }) => {
    // First attempt (directly via the assessments API to avoid losing state between two MOY navs).
    await page.goto(`/engine/moy-screener.html?student=${STUDENT_ID}&task=4`);
    await page.waitForFunction(() => typeof window.AvneiAssessments !== 'undefined', null, { timeout: 10000 });
    await page.evaluate(({ sid }) => {
      AvneiAssessments.recordMOYAttempt(sid, { task_4: { score: 0 } });
    }, { sid: STUDENT_ID });

    // Verify first attempt recorded with no suggestion yet (attempts.length === 1).
    const after1 = await readLocal(page, ASSESSMENTS_KEY);
    expect(after1.moy[STUDENT_ID].attempts.length).toBe(1);
    expect(after1.moy[STUDENT_ID].suggested_intervention).toBeNull();

    // Second attempt — through the actual UI flow (this is the integration check).
    await startTask4(page);
    await page.evaluate(() => { __moy.session().results.task_4.score = 0; __moy.finishNow(); });
    await page.waitForFunction(() => {
      const raw = localStorage.getItem('underwater-app:assessments');
      if (!raw) return false;
      try {
        const st = JSON.parse(raw);
        return st.moy && st.moy['stu-tamar'] && st.moy['stu-tamar'].attempts &&
               st.moy['stu-tamar'].attempts.length >= 2;
      } catch (e) { return false; }
    }, null, { timeout: 5000 });

    const state = await readLocal(page, ASSESSMENTS_KEY);
    const rec = state.moy[STUDENT_ID];
    expect(rec.attempts.length).toBe(2);
    expect(rec.latest_status).toBe('fail');
    expect(rec.suggested_intervention).toBeTruthy();
    expect(rec.suggested_intervention.patternId).toBe('phonological');
  });
});
