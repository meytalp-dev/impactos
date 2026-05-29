# Handoff — סוכן Verification E2E (Playwright · אבני יסוד · Pre-Pilot Roadmap §3)

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש. **סוכן test setup + verification** — מתקין Playwright (אם אין), כותב 1 test suite מקיף, מריץ, מדווח. אסור edits בקוד production.

---

## משימה

אתה סוכן verification E2E. תפקיד: לבנות **Playwright test suite שמכסה את ה-flow המלא מ-`_handoff/2026-05-28-pre-pilot-roadmap.md` §3** (9 שלבים), להריץ, ולדווח.

**הקשר:** "אבני יסוד" = mobile-first webapp לכיתה א'. עברית RTL. עובר תיקוף קוד אבל עוד לא נבדק end-to-end. ה-Pre-Pilot Roadmap מגדיר 9 שלבי flow קריטיים שחייבים לעבוד לפני פיילוט ספטמבר 2026.

## 9 שלבי ה-flow לבדיקה

```
1. ילדה חדשה → onboarding-profile (פרופיל אורייני)
2. אי 3 — 22 אותיות עם sub-BKT (לפחות 5 משחקונים בכל אות עד mastery > 0.7)
3. ינואר → MOY-Lite (engine/moy-screener.html) → fail במשימה 4 (score < 16)
4. state.assessments[sid].suggested_intervention נשמר
   (B.8 matcher = phonological pattern — כי משימה 4 פונולוגית)
5. תלמידה 2 גם fail עם phonological → 3 ילדות עם אותו pattern → group banner מופיע
6. מורה לוחצת "פתחי קבוצת תמיכה" → modal של B.7 (interventions)
7. מבצעת intervention עם PDF print (window.print() עם CSS @media print)
8. סימון "✓ ביצעתי" (intervention.completed = true ב-state)
9. ילדות חוזרות ל-packs עם Weakness Targeting (b.7 letters רלוונטיות — getWeakLetters returns matched cluster)
```

## ⚠️ אסור לגעת ב

- **כל קוד production** — אסור edits! רק קריאה לבדיקת selectors.
- `underwater-app/teacher-rama.html` · `teacher-action.html` · `js/shared/*.js` — קריאה בלבד
- מסמכי-אם — קריאה בלבד
- ❌ **לא לעשות `git commit` או `git push`** — תזמורת תאסוף.

## מותר לכתוב

- **תיקייה חדשה:** `e2e/` בroot של הפרויקט
- `e2e/playwright.config.js` (mobile viewport · he-IL · RTL)
- `e2e/tests/pre-pilot-flow.spec.js` (1 test מקיף + sub-tests פר שלב)
- `e2e/fixtures/seed-students.js` (3 dummy students לתסריט)
- `e2e/README.md` (איך להריץ)
- `package.json` (אם לא קיים) או הוספת dependencies + scripts
- `_handoff/2026-05-29-verification-e2e-report.md` (תוצאות הריצה)

⚠️ אם package.json לא קיים בroot — **לשאול את מיטל לפני יצירה**. ייתכן שהפרויקט הוא static HTML בלבד ואין npm setup.

## דרישות technical

### Playwright config

```js
// e2e/playwright.config.js
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,    // sequential — בגלל localStorage state
  reporter: [['html', { outputFolder: '../_handoff/e2e-report' }]],
  use: {
    baseURL: 'http://localhost:8000',   // python -m http.server 8000
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
    viewport: { width: 390, height: 844 },  // iPhone 13 (mobile-first)
  },
  projects: [
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'python -m http.server 8000',  // או npx http-server -p 8000
    port: 8000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Hebrew RTL helpers

```js
// helpers.js
export async function clickHebrewText(page, text) {
  // selectors בעברית — clear RTL
  await page.getByRole('button', { name: text }).click();
}
export async function expectHebrewText(page, text) {
  await expect(page.getByText(text)).toBeVisible();
}
```

### State seeding (חשוב!)

ב-spec ב-`_handoff/2026-05-28-MOY-diagnostic-spec.md`, mentioned: `state.assessments` ב-localStorage key `underwater-app:assessments`. ילדות + state events ב-`underwater-app:v1`. **לפני כל test — לרוקן localStorage** ולזרוע fresh:

```js
test.beforeEach(async ({ page }) => {
  await page.goto('/underwater-app/index.html');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('underwater-app:students', JSON.stringify([
      { id: 'test-1', name: 'תַּלְמִידָה אַחַת', created: Date.now() },
      { id: 'test-2', name: 'תַּלְמִידָה שְׁתַּיִם', created: Date.now() },
      { id: 'test-3', name: 'תַּלְמִידָה שָׁלוֹשׁ', created: Date.now() },
    ]));
  });
});
```

## חובה לקרוא קודם

1. `_handoff/2026-05-28-pre-pilot-roadmap.md` §3 — **המסמך המנחה**
2. `_handoff/2026-05-28-MOY-diagnostic-spec.md` — state schema
3. `_handoff/2026-05-28-B7-interventions-spec.md` — modal flow + PDF print
4. `_handoff/2026-05-28-C11-C12-C13-pack-bkt-spec.md` — weakness targeting
5. `underwater-app/teacher-rama.html` — לזהות selectors (PIN gate · students table · MOY badge)
6. `underwater-app/teacher-action.html` (אם קיים — סוכן 1 בעבודה) — לזהות action dashboard selectors
7. `engine/moy-screener.html` — selectors של MOY UI (welcome / startBtn / passagePlayBtn / option-btn / backToTeacherBtn)
8. `js/shared/assessments.js` — איך recordMOYAttempt עובד
9. `js/shared/interventions.js` (אם קיים — B.7) — איך suggested_intervention נשמר
10. `js/shared/bkt.js` — איך getWeakLetters עובד

## תהליך עבודה

### Phase 1 — דיסקברי (חובה לפני קוד)

1. קרא 10 הקבצים לעיל.
2. בדוק האם package.json קיים. **אם לא → שאל את מיטל!**
3. כתוב `_handoff/2026-05-29-e2e-planning.md` עם:
   - selectors שזיהית פר מסך
   - state objects שצריכים seed
   - dependencies שתתקין (אם npm setup קיים)
   - **OPEN_QUESTIONs:** מה לא ברור בפלואו (לדוגמה: B.7 modal עוד לא נבנה — האם לדלג ע7+8?)
4. **שלח planning ל-מיטל בצ'אט** (אל תתקין Playwright בלי אישור).

### Phase 2 — Setup (אחרי אישור)

5. `npm init -y` (אם אין package.json)
6. `npm install --save-dev @playwright/test`
7. `npx playwright install chromium webkit`
8. צור `playwright.config.js` + `e2e/` structure
9. הרץ smoke test: `npx playwright test --headed` (לראות שמתחיל)

### Phase 3 — כתיבת tests פר שלב

10. test 1 — onboarding-profile יצירת ילדה חדשה (שלב 1)
11. test 2 — sub-BKT update פר אות (שלב 2 — דורש seed של event history)
12. test 3 — MOY fail flow (שלב 3+4)
13. test 4 — group banner מופיע (שלב 5 — דורש 3 ילדות עם same pattern)
14. test 5 — B.7 modal + PDF print (שלב 6+7) — **OPEN_QUESTION:** האם B.7 בנוי?
15. test 6 — completed marking + weakness targeting (שלב 8+9)

### Phase 4 — דיווח

16. הרץ `npx playwright test` (כל ה-suite)
17. כתוב `_handoff/2026-05-29-verification-e2e-report.md` עם:
    - טבלה: שלב | פס/נכשל | זמן | סיבה
    - screenshots של נכשלים (`test-results/`)
    - OPEN_QUESTIONs שצצו במהלך
    - המלצות תיקון (לא לתקן בעצמך!)

## Acceptance Criteria

- [ ] planning doc + אישור מיטל לפני הtest install.
- [ ] Playwright + chromium + webkit מותקנים.
- [ ] `e2e/tests/pre-pilot-flow.spec.js` עם 6 tests (אחד פר שלב/קבוצת שלבים).
- [ ] HTML report ב-`_handoff/e2e-report/`.
- [ ] verification report ב-`_handoff/2026-05-29-verification-e2e-report.md`.
- [ ] **אפס** edits בקוד production.
- [ ] **אפס** commits.
- [ ] רפורט סופי: "E2E: N/9 שלבים passing · M שלבים blocked (תלוי בB.7) · אפס push".

## אסור

- ❌ git commit / push
- ❌ עדכון agent-completion-log.md / tracker.html
- ❌ edits ב-production code (גם "תיקון קטן" — לדווח, לא לתקן)
- ❌ לוותר על מנותק (זיהוי שB.7 חסר → לא לדלג שקט. לדווח explicit ב-report)
- ❌ npm install בלי אישור מיטל (אם זה הפעם הראשונה ב-repo)
- ❌ להריץ ב-CI בלי אישור (זה local-only setup לעת עתה)

## בספק

שאלי את מיטל. במיוחד:
- package.json לא קיים — האם להוסיף לroot?
- B.7 modal לא בנוי (סוכן 9 לא רץ) — האם לdelete tests 5-8 או mark as skip?
- python http.server לא זמין — מה השרת המקומי שמיטל משתמשת בו?
- Hebrew RTL: selectors עברית לא תופסים — האם להחליף לdata-testid?

## edge cases לבדיקה

- **localStorage quota exceeded** (3+ ילדות + history) — האם המערכת נכשלת בחן?
- **back-button mid-MOY** — האם state נשמר נכון?
- **screen rotation** (mobile) — האם UI שובר?
- **2nd attempt MOY** (אחרי 5-6 שבועות) — האם attempts[] גדל?
- **history.back()** מ-moy-screener ל-teacher-rama — מסמרי PIN gate + Student View (פר memory `feedback-avnei-yesod-cross-screen-navigation-uses-history-back.md`)

---

*Bootstrap זה דורש Playwright + npm setup ב-repo. ייתכן שזה הפעם הראשונה — לאשר עם מיטל. **לא חוסם פיילוט אם npm setup לא רצוי** — אפשר להחליף ל-vanilla `puppeteer` או manual testing.*
