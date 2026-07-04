// תרגול בית ("נוני בבית") — spec: _handoff/2026-07-04-home-practice-spec.md §11.
// מאמת: תיוג context/calendar_date · חלון-שעות (פונקציה טהורה) · מכסה יומית
// ("זֶהוּ לְהַיּוֹם", אתחול ביום חדש, לא בכיתה) · משימת היום (המלצת BKT, דילוג
// אחרי השלמה, אין משימה בלי היסטוריה) · מסך הורה (חיובי בלבד, בלי צבעי-סטטוס).
//
// הערה: context נכפה עם ?context=home|school (override, ספק §7) — בדיקות לא
// תלויות בשעת-הריצה. ה-override נשמר ב-sessionStorage, לכן prepareSession
// (שמנקה storage) חייב לרוץ לפני כל goto.
const { test, expect } = require('@playwright/test');
const { prepareSession } = require('./helpers');

const STATE_KEY = 'underwater-app:v1';

function todayKey(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

// כתיבת state ישירות ל-localStorage (אחרי prepareSession, לפני goto למסך הנבדק)
async function seedState(page, statePatch) {
  await page.evaluate(({ key, patch }) => {
    const cur = JSON.parse(localStorage.getItem(key) || '{}');
    localStorage.setItem(key, JSON.stringify(Object.assign(cur, patch)));
  }, { key: STATE_KEY, patch: statePatch });
}

function homeEvents(n, { date = todayKey(), letter = 'ש' } = {}) {
  return Array.from({ length: n }, (_, i) => ({
    student_id: 'stu-maya',
    activity_type: 'soundMatch',
    target_letter: letter,
    primary_island_id: 3,
    is_correct: true,
    context: 'home',
    calendar_date: date,
    timestamp: Date.now() - (n - i) * 60000,
  }));
}

test.describe('תרגול בית · context + calendar_date', () => {
  test('אירוע עם ?context=home מתויג home + calendar_date של היום', async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
    });
    await page.goto('/underwater-app/stage-3-shin.html?context=home');
    await page.waitForLoadState('domcontentloaded');
    // event-logger + autoload של home-context
    await page.waitForFunction(() => window.AvneiEventLogger && window.AvneiHomeContext);

    const evt = await page.evaluate(() =>
      window.AvneiEventLogger.logActivityResult({
        activity_type: 'soundMatch', target_letter: 'ש',
        primary_island_id: 3, is_correct: true,
      }));
    expect(evt.context).toBe('home');
    expect(evt.calendar_date).toBe(todayKey());

    // נשמר גם ב-state
    const last = await page.evaluate((key) => {
      const s = JSON.parse(localStorage.getItem(key) || '{}');
      return (s.events || []).slice(-1)[0];
    }, STATE_KEY);
    expect(last.context).toBe('home');
    expect(last.calendar_date).toBe(todayKey());
  });

  test('?context=school גובר, וחלון-השעות הטהור מחשב נכון (שבת/בוקר/ערב)', async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
    });
    await page.goto('/underwater-app/stage-3-shin.html?context=school');
    await page.waitForFunction(() => window.AvneiEventLogger && window.AvneiHomeContext);

    const evt = await page.evaluate(() =>
      window.AvneiEventLogger.logActivityResult({
        activity_type: 'soundMatch', target_letter: 'ש',
        primary_island_id: 3, is_correct: true,
      }));
    expect(evt.context).toBe('school');

    // הפונקציה הטהורה — לא תלויה בשעת הריצה של ה-CI
    const computed = await page.evaluate(() => {
      const f = window.AvneiHomeContext.computeContextForDate;
      return {
        saturday: f(new Date('2026-07-04T10:00:00')),   // שבת בבוקר
        weekdayMorning: f(new Date('2026-07-01T10:00:00')), // רביעי 10:00
        weekdayEvening: f(new Date('2026-07-01T18:00:00')), // רביעי 18:00
        weekdayEarly: f(new Date('2026-07-01T07:00:00')),   // רביעי 07:00 לפני ביה"ס
      };
    });
    expect(computed.saturday).toBe('home');
    expect(computed.weekdayMorning).toBe('school');
    expect(computed.weekdayEvening).toBe('home');
    expect(computed.weekdayEarly).toBe('home');
  });
});

test.describe('תרגול בית · מכסה יומית', () => {
  test('מכסה מוצתה בבית → "זֶהוּ לְהַיּוֹם" חוסם את המפה', async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
    });
    await seedState(page, {
      dailyUsage: { date: todayKey(), home_active_seconds: 20 * 60 },
    });
    await page.goto('/underwater-app/map.html?context=home');
    const overlay = page.locator('#avneiHomeCapOverlay');
    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText('זֶהוּ לְהַיּוֹם');
    // הכפתור מוביל למסך ההורה
    await expect(overlay.locator('a.cap-parents')).toHaveAttribute('href', 'parent-today.html');
    // ואין משימה מעל המכסה
    await expect(page.locator('#homeMissionOverlay')).toHaveCount(0);
  });

  test('אותה מכסה בכיתה (context=school) → אין חסימה', async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
    });
    await seedState(page, {
      dailyUsage: { date: todayKey(), home_active_seconds: 20 * 60 },
    });
    await page.goto('/underwater-app/map.html?context=school');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#avneiHomeCapOverlay')).toHaveCount(0);
  });

  test('יום מתחלף → המונה מאתחל ואין חסימה', async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
    });
    await seedState(page, {
      dailyUsage: { date: todayKey(-1), home_active_seconds: 20 * 60 }, // אתמול
    });
    await page.goto('/underwater-app/map.html?context=home');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#avneiHomeCapOverlay')).toHaveCount(0);
    const used = await page.evaluate(() => window.AvneiHomeContext.getUsedSeconds());
    expect(used).toBeLessThan(60); // אתחול (ייתכן tick ראשון)
  });
});

test.describe('תרגול בית · משימת היום', () => {
  test('אות חלשה ב-BKT → נוני ממליץ עליה והקישור מוביל לאי שלה', async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
      weakBkt: { studentId: 'stu-maya', letters: ['ש'] },
    });
    await page.goto('/underwater-app/map.html?context=home');
    const overlay = page.locator('#homeMissionOverlay');
    await expect(overlay).toBeVisible();
    await expect(overlay.locator('h2')).toContainText('ש');
    await expect(overlay.locator('#homeMissionGo'))
      .toHaveAttribute('href', 'stage-3-shin.html?mission=1');
  });

  test('משימה הושלמה (10 אירועי-בית היום) → אין משימה, משחק חופשי', async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
    });
    await seedState(page, { events: homeEvents(10) });
    await page.goto('/underwater-app/map.html?context=home');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#homeMissionOverlay')).toHaveCount(0);
    const progress = await page.evaluate(() => window.AvneiHomeContext.getMissionProgress());
    expect(progress.completed).toBe(true);
  });

  test('אין שום היסטוריה → אין משימה (בבית לא לומדים חדש, ספק §4.1)', async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
    });
    await page.goto('/underwater-app/map.html?context=home');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#homeMissionOverlay')).toHaveCount(0);
    await expect(page.locator('#avneiHomeCapOverlay')).toHaveCount(0);
  });
});

test.describe('תרגול בית · דשבורד מורה', () => {
  test('כפתור "תרגול בית" פותח מודאל: שורות פעילות (דמו) + שליטה במכסה שנקראת אצל הילד.ה', async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
    });
    await page.goto('/underwater-app/teacher-dashboard.html?guest=1');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('#homePracticeBtn').click();
    const modal = page.locator('#hpBackdrop');
    await expect(modal).toBeVisible();
    // עיקרון "בונוס לא חובה" מנוסח במודאל, ושורות הדמו מוצגות
    await expect(modal).toContainText('בונוס — לא חובה');
    await expect(modal).toContainText('השבוע');
    // שליטה במכסה: שינוי ל-10 נשמר במפתח שהילד.ה קורא
    const firstCap = modal.locator('select[data-hp-cap]').first();
    const sid = await firstCap.getAttribute('data-hp-cap');
    await firstCap.selectOption('10');
    const caps = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('avnei-yesod-home-caps') || '{}'));
    expect(caps[sid]).toBe(10);

    // צד הילד.ה: home-context מכבד את המכסה שהמורה קבעה
    await page.evaluate((sid) => {
      localStorage.setItem('avnei-yesod-current-student', sid);
    }, sid);
    await page.goto('/underwater-app/map.html?context=home');
    await page.waitForFunction(() => window.AvneiHomeContext);
    const cap = await page.evaluate(() => window.AvneiHomeContext.getCapMinutes());
    expect(cap).toBe(10);
  });
});

test.describe('תרגול בית · מסך הורה', () => {
  test('מציג אותיות ותרגילים של היום — בלי אחוזים ובלי צבעי-סטטוס', async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
    });
    await seedState(page, {
      events: homeEvents(12),
      dailyUsage: { date: todayKey(), home_active_seconds: 9 * 60 },
    });
    await page.goto('/underwater-app/parent-today.html');
    await expect(page.locator('#title')).toContainText('מאיה');
    await expect(page.locator('#headline')).toContainText('ש');
    await expect(page.locator('#headline')).toContainText('משימת היום');
    await expect(page.locator('.letter-chip')).toHaveText(['ש']);
    await expect(page.locator('#factsRow')).toContainText('12 תרגילים');
    await expect(page.locator('#factsRow')).toContainText('דקות');
    // חיובי בלבד: אין אחוזים ואין מילות סטטוס
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/%|ציון|טעויות|נכשל|חלש/);
    // המכסה מוצתה למעשה? גם אז אין חסימה במסך ההורה
    await expect(page.locator('#avneiHomeCapOverlay')).toHaveCount(0);
  });

  test('יום בלי תרגול → מצב ריק חיובי, בלי לחץ', async ({ page }) => {
    await prepareSession(page, {
      students: [{ id: 'stu-maya', name: 'מאיה' }],
      currentStudent: 'stu-maya',
    });
    await page.goto('/underwater-app/parent-today.html');
    await expect(page.locator('#headline')).toContainText('נוני מחכה');
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/חשוב לתרגל|חובה/);
  });
});
