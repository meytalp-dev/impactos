// Story 14 — Read-aloud verdict → saved BKT event (אי 15 · סטרנד 4 · קריאה).
// כלי "נוני מקשיבה" נבדק, מוצג — ועכשיו גם נשמר לפרופיל האורייני.
// Brief: _handoff/2026-06-30-read-aloud-save-to-profile-agent-brief.md
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

const URL = '/underwater-app/stage-read-aloud.html';
const ISLAND = 15;
// לאי 15 אין רשומה ב-PARAMS_PER_ISLAND → משתמש ב-DEFAULT_PARAMS.pL0 = 0.20.
const DEFAULT_PL0 = 0.20;

// pKnown של אי 15 מתוך ה-store הלגסי (avnei-bkt-v1) דרך dump().
async function islandPKnown(page, studentId) {
  return page.evaluate(({ sid, island }) => {
    const dump = window.AvneiBKT.dump().island;
    const st = dump[sid] && dump[sid][island];
    return st ? st.pKnown : null;
  }, { sid: studentId, island: ISLAND });
}

// שכבת-הדאטה כולה מקומית (state/bkt/event-logger/read-aloud-logger) — נטענת סינכרונית.
async function waitStackReady(page) {
  await page.waitForFunction(() =>
    window.AvneiReadAloudSave && window.AvneiBKT && window.AvneiEventLogger);
}

test.describe('Story 14 · שמירת הקראה לפרופיל (אי 15)', () => {

  test('ACCEPT מעלה pKnown · REJECT מוריד (verdict → כיוון BKT)', async ({ page }) => {
    // ---- ACCEPT ----
    await prepareSession(page, {
      students: [{ id: 'stu-dana', name: 'דנה' }],
      currentStudent: 'stu-dana',
    });
    await page.goto(URL);
    await waitStackReady(page);
    const accSaved = await page.evaluate(() =>
      !!window.AvneiReadAloudSave.saveVerdict({ mode: 'word', decision: 'ACCEPT', target: 'תַּפּוּחַ' }));
    expect(accSaved).toBe(true);
    const pAccept = await islandPKnown(page, 'stu-dana');
    expect(pAccept).toBeGreaterThan(DEFAULT_PL0);

    // ---- REJECT (תלמיד אחר כדי לבודד) ----
    await prepareSession(page, {
      students: [{ id: 'stu-omer', name: 'עומר' }],
      currentStudent: 'stu-omer',
    });
    await page.goto(URL);
    await waitStackReady(page);
    await page.evaluate(() =>
      window.AvneiReadAloudSave.saveVerdict({ mode: 'word', decision: 'REJECT', target: 'תַּפּוּחַ' }));
    const pReject = await islandPKnown(page, 'stu-omer');
    expect(pReject).toBeLessThan(DEFAULT_PL0);
  });

  test('REVIEW = correct רך (מעלה pKnown)', async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-noa', name: 'נועה' }],
      currentStudent: 'stu-noa',
    });
    await page.goto(URL);
    await waitStackReady(page);
    await page.evaluate(() =>
      window.AvneiReadAloudSave.saveVerdict({ mode: 'word', decision: 'REVIEW', target: 'לוּל' }));
    const p = await islandPKnown(page, 'stu-noa');
    expect(p).toBeGreaterThan(DEFAULT_PL0);
  });

  test('dual-mode · ?guest=1 שומר מקומית אבל אפס כתיבה לענן', async ({ page }) => {
    const supabaseHits = [];
    page.on('request', (req) => {
      if (/supabase\.co/.test(req.url())) supabaseHits.push(req.url());
    });
    // מצב-דמו → בלי בורר תלמידים, זהות 'local'.
    await prepareSession(page, { students: [], currentStudent: null });
    await page.goto(URL + '?guest=1');
    await waitStackReady(page);
    const canSave = await page.evaluate(() => window.AvneiReadAloudSave.canSave());
    expect(canSave).toBe(true); // זהות-אורח מותרת לשמירה מקומית
    await page.evaluate(() =>
      window.AvneiReadAloudSave.saveVerdict({ mode: 'word', decision: 'ACCEPT', target: 'לֵב' }));
    // ה-BKT המקומי התעדכן (הוכחה שהשמירה קרתה)...
    const pLocal = await islandPKnown(page, 'local');
    expect(pLocal).toBeGreaterThan(DEFAULT_PL0);
    // ...אבל שום דבר לא עזב את המכשיר.
    await page.waitForTimeout(500);
    expect(supabaseHits).toEqual([]);
  });

  test('שער זהות · בלי תלמיד (מצב-ענן) → לא נשמר, בלי מפתח-זבל', async ({ page }) => {
    await prepareSession(page, { students: [], currentStudent: null });
    await page.goto(URL); // מצב-ענן, כיתה ריקה → הכלי נטען, השמירה מנוטרלת
    await waitStackReady(page);
    const saved = await page.evaluate(() =>
      window.AvneiReadAloudSave.saveVerdict({ mode: 'word', decision: 'ACCEPT', target: 'לֵב' }));
    expect(saved).toBeNull();
    const canSave = await page.evaluate(() => window.AvneiReadAloudSave.canSave());
    expect(canSave).toBe(false);
    // אין אי-15 בשום מקום (גם לא תחת 'local').
    const anyIsland15 = await page.evaluate(() => {
      const island = window.AvneiBKT.dump().island;
      return Object.values(island).some((stu) => stu && stu[15]);
    });
    expect(anyIsland15).toBe(false);
  });

  test('T4 · שורת מורָה (?debug=1) מציגה סיכום מצטבר בשפת שורה-תחתונה', async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-dana', name: 'דנה' }],
      currentStudent: 'stu-dana',
    });
    // שומרים 4 הקראות-מילים תקינות (אותו origin) — נשמר ל-event log.
    await page.goto(URL);
    await waitStackReady(page);
    await page.evaluate(() => {
      ['תַּפּוּחַ', 'לוּל', 'לֵב', 'אִמָּא'].forEach((w) =>
        window.AvneiReadAloudSave.saveVerdict({ mode: 'word', decision: 'ACCEPT', target: w }));
    });
    // נטענים מחדש במצב מורָה — renderTeacherSummary רץ ב-load וקורא מה-event log.
    await page.goto(URL + '?debug=1');
    await waitStackReady(page);
    const txt = await page.locator('#teacherSummary').textContent();
    expect(txt).toContain('דנה');
    expect(txt).toContain('קריאת מילים');
    expect(txt).toContain('שולטת יפה'); // 4/4 → רמה גבוהה
    expect(txt).toContain('(4/4)');
  });

  test('T4 · בלי הקראות → שורת מורָה מציגה "עדיין לא קראה כאן"', async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-tal', name: 'טל' }],
      currentStudent: 'stu-tal',
    });
    await page.goto(URL + '?debug=1');
    await waitStackReady(page);
    const txt = await page.locator('#teacherSummary').textContent();
    expect(txt).toContain('טל');
    expect(txt).toContain('עדיין לא קראה כאן');
  });
});
