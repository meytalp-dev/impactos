# Handoff — סוכן 28: Verification E2E (Fresh Context · שיחה חדשה)

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code **חדש לחלוטין** (Opus 4.7 · 1M context). הסוכן הזה לא יודע כלום מההיסטוריה של היום — הוא יקבל את כל ההקשר מ-handoff documents.

---

# שיחה חדשה — סוכן 28: Verification E2E לאבני יסוד

## מטרה

לבנות **Playwright E2E test suite** שמוודא את ה-pilot user journey המלא של אבני יסוד (מערכת תרגול אדפטיבית לכיתה א'). לאחר זה — להריץ + לאתר bugs לפני soft launch (ספטמבר 2026).

**אומדן:** 4-6 שעות (1h setup + 3-5h tests).

## אזהרה ראשונה: לא מסונכרן עם איזה סוכן אחר

זה ה-fresh context הראשון שלך. **חובה לפני כל פעולה:**
1. `git fetch origin && git status` — ודא שהענף שלך עם origin.
2. `git log --oneline -20` — קרא את 20 ה-commits האחרונים של היום (29.5.2026).
3. **לפני** edits — ודא ש-`teacher-rama.html` · `teacher-action.html` · `moy-screener.html` · `moy-items.json` · `interventions/*.json` לא מודיפיים פעילים (סוכנים אחרים סיימו, אבל לאמת).

## הקשר מלא — מצב המערכת ב-29.5.2026 ערב

### מנועי ליבה (100% חיים · 15+ test suites ✓)
- **BKT-per-strand** (`js/shared/bkt.js`) — 5 סטרנדים
- **Sub-BKT 22 letters** — אות-פר-אות, עם sub-BKT לכל אחת מ-22 אותיות עברית
- **EPA** (`js/shared/epa.js`) — Failure × Context × Task axes
- **Cold-start** (`js/shared/mastery-check.js`) — תלמידה חדשה, badge "ילדה חדשה"
- **Mastery משולש** — BKT + fluency + ראמ"ה threshold
- **MOY-Lite** (`engine/moy-screener.html` · `engine/moy-items.json`) — 60 items diagnostic
- **B.7 Interventions** (`js/shared/interventions.js` + `interventions/*.json`) — 5 patterns
- **B.8 Intervention Matcher** (`js/shared/intervention-matcher.js`)
- **B.9 Group Suggester** (`js/shared/group-suggester.js`) — 3-5 קבוצות
- **F.21A teacher-rama** (`underwater-app/teacher-rama.html`) — תצפית
- **F.21E teacher-action** (`underwater-app/teacher-action.html` · `f21e-helpers.js`) — דשבורד פעולת בוקר
- **Skill Units** (`js/shared/skill-units.js`) + **Letter Targets** (`js/shared/letter-targets.js`) — מורה דוחפת תרגול מותאם
- **Pack × BKT** (`js/shared/pack-bkt-bridge.js`) — 7 packs חודשיים (sep-mar)
- **Weakness Targeting** (`js/shared/weakness-targeting`) — top-3 weak letters
- **Event Logger** (`js/shared/event-logger.js`) — 20 שדות פר אירוע
- **Data Export** (`underwater-app/data-export.html`) — CSV ייצוא

### תוכן Pilot-Ready (29.5.2026)
- **22 משחקוני אי 3** (`stage-3-*.html`) — 22 אותיות עברית · 4 mechanics · 4 themed groups
- **7 packs** (`curriculum/packs/grade1-tashpaz/{sep-mar}-2026/2027.json`) — 280 items
- **60 MOY items** (אחרי תיקון IPA→עברית · ראה למטה)
- **5 intervention scripts FULL** (`interventions/*.json`) — עם examples_to_use · differentiation · troubleshooting

### תיקונים שנעשו היום (29.5)
- F.21E V1 (`d7e86ec`) + V2 (`3e8b3c4`) — UI + skill units abstraction
- 7 packs items (סוכן 23) — `79b1540` · `673b63e` · `a75e4cc`
- a11y fixes (סוכן 25) — `07e7261` — user-scalable=no הוסר, aria-label, contrast
- performance audit (סוכן 24) — `a234da1` — BKT scaling OK · localStorage 11%
- MOY niqud bug fixes (line 280 הַמְשִׁיכִי) — `d056d8d`
- noni image fix — תמונת noni-idle.png במקום emoji
- test-weakness-targeting fix — `c611a92` — Tier 3: 4→10
- MOY IPA→עברית (סוכן 26) — *ייתכן עוד פעיל · בדוק `git log`*
- Interventions PARTIAL→FULL (סוכן 27) — *ייתכן עוד פעיל · בדוק*

## קבצי-מקור — חובה לקרוא לפני עבודה

### Specs פדגוגיים
1. `avnei-yesod/_handoff/2026-05-28-pre-pilot-roadmap.md` — מסלול 5 שלבי לפיילוט
2. `avnei-yesod/_handoff/2026-05-28-MOY-diagnostic-spec.md` — מבנה MOY
3. `avnei-yesod/_handoff/2026-05-28-B7-interventions-spec.md` — 5 patterns
4. `avnei-yesod/_handoff/2026-05-27-F21A-ux-spec.md` — תצפית
5. `avnei-yesod/_handoff/2026-05-29-F21E-ux-spec-v2.md` — דשבורד פעולה
6. `avnei-yesod/curriculum/pedagogy-integration-framework.md` — מסגרת פדגוגית v2.3

### Memory חובה (גלובלי · יטען אוטומטית)
- `feedback-avnei-yesod-teacher-language-simplicity` — שפה פשוטה למורה
- `feedback-avnei-yesod-niqud-on-student-screens` — ניקוד מלא ב-UI לתלמידות
- `feedback-avnei-yesod-cross-screen-navigation-uses-history-back` — `history.back()` ולא `location.href`
- `feedback-orchestrator-multi-vscode-parallel-pattern` — single ownership פר working unit
- `project-avnei-yesod-f21a-vs-f21e-split` — F.21A=תצפית · F.21E=פעולה
- `project-moy-lite-item-structure` — מבנה 1:1 (passage × question per item)
- `reference-hebrew-niqud-rules` — כללי ניקוד שעלו ב-validation

### דוחות פעילים
- `avnei-yesod/_handoff/2026-05-29-performance-audit-report.md` — סוכן 24
- `avnei-yesod/_handoff/2026-05-29-orchestrator-handoff-evening.md` — סטטוס סוף יום 29.5
- `avnei-yesod/_handoff/agent-completion-log.md` — היסטוריה של כל הסוכנים
- `avnei-yesod/_handoff/2026-05-29-post-pilot-review-list.md` — loose ends לאחרי פיילוט

## משימה מפורטת — 9 User Stories לבדיקה

ה-pilot user journey המלא מ-Pre-Pilot Roadmap §3:

```
1. ילדה חדשה ↗ onboarding-profile (פרופיל אורייני · 4 רמות)
   Expected: entry_profile נשמר ב-localStorage · cold-start badge פעיל

2. אי 3 ↗ stage-3-shell.html (אות מ) · 5+ ניסיונות
   Expected: sub-BKT של מ מתעדכן · events נשמרים · letter_quest קיים

3. ינואר ↗ moy-screener.html?student=X&task=4
   Expected: 22 פריטים נשלפו מאוזן (7+8+7 לפי sub_type) · ניקוד מלא
   Expected: ילדה נכשלת (תשובה לא נכונה ב-≥7) → status=fail

4. state.assessments[sid].suggested_intervention נשמר
   Expected: pattern_id="phonological" (אם MOY=task_4 fail) · auto-save אחרי 2 attempts

5. תלמידה 2 גם נכשלת עם phonological → 3 ילדות → group banner
   Expected: AvneiGroupSuggester.suggestGroups → 1 group {pattern: phonological, n: 3}
   Expected: F.21A class view מציג "🌅 קבוצות בוקר מוצעות" banner

6. מורה לוחצת "פתחי קבוצת תמיכה" → modal B.7
   Expected: modal פותח · 5 stages (hook → check) מוצגים · examples_to_use נראים
   Expected: ה-script מ-phonological.json הוא הגרסה FULL (≥5K chars · אחרי סוכן 27)

7. מבצעת intervention עם PDF print
   Expected: print button → PDF נוצר עם כל ה-script
   Expected: jsPDF + RTL עובד · ניקוד שמור

8. סימון "✓ ביצעתי" → state.interventions עודכן
   Expected: recordIntervention נקרא · letter-targets auto-push (סוכן 1 V2)
   Expected: F.21E "🎯 נקודות לחיזוק" Section מתעדכן עם letters

9. ילדות חוזרות ל-packs עם Weakness Targeting (b.7 letters)
   Expected: AvneiPackBridge.selectItemsForStudent מחזיר items עם תיגעים החלשות
   Expected: stage-3-* יציג את האותיות שמורה דחפה
```

## משימות (להריץ ברצף)

### Phase A — Setup (1h)

1. ☐ `git fetch origin && git status` + `git log --oneline -20`.
2. ☐ קרא את כל קבצי המקור לעיל.
3. ☐ בדוק: `node -v` (Node ≥ 16) · `npm -v`.
4. ☐ אם אין Playwright מותקן: `npm install -D playwright @playwright/test` + `npx playwright install chromium`.
5. ☐ צור `avnei-yesod/scripts/e2e/playwright.config.js`:
   ```js
   module.exports = {
     testDir: './',
     timeout: 30000,
     fullyParallel: false,  // sequential — localStorage נגוע
     use: {
       baseURL: 'http://localhost:8765',
       headless: true,
       viewport: { width: 1280, height: 720 },
       locale: 'he-IL',
     },
     projects: [
       { name: 'desktop-chrome', use: { browserName: 'chromium' } },
       { name: 'mobile-iphone', use: { ...require('@playwright/test').devices['iPhone 12'] } },
     ],
   };
   ```
6. ☐ ודא שיש HTTP server רץ: `cd avnei-yesod && python -m http.server 8765` (background).
7. ☐ פתח `http://localhost:8765/underwater-app/teacher-rama.html` ב-browser ידני — וודא load + PIN gate (4521).

### Phase B — Tests Writing (3-4h)

8. ☐ צור 9 test files תחת `scripts/e2e/`:
   - `01-onboarding.spec.js` — story 1
   - `02-stage-3-game.spec.js` — story 2
   - `03-moy-task-4-fail.spec.js` — story 3+4
   - `04-group-suggester.spec.js` — story 5
   - `05-b7-modal-open.spec.js` — story 6
   - `06-pdf-print.spec.js` — story 7
   - `07-intervention-mark-done.spec.js` — story 8
   - `08-weakness-targeting-pack.spec.js` — story 9
   - `09-e2e-full-flow.spec.js` — כל ה-9 ברצף (chain test · בודק integration)
9. ☐ Helper file: `scripts/e2e/helpers.js`:
   - `setupMockStudent(page, name)` — מוסיף student ל-localStorage
   - `setupMockEvents(page, sid, count)` — מוסיף events
   - `bypassPin(page)` — `sessionStorage.setItem('avnei-rama-auth', '1')`
   - `clearAll(page)` — `localStorage.clear()` + sessionStorage
10. ☐ דוגמת test:
    ```js
    test('story 1: onboarding creates entry_profile', async ({ page }) => {
      await page.goto('/engine/onboarding-profile.html');
      await page.fill('#studentName', 'מאיה');
      // ... interact with 3 quick tasks
      await page.click('#submitProfile');
      const profile = await page.evaluate(() =>
        JSON.parse(localStorage.getItem('underwater-app:students')));
      expect(profile['stu-maya'].entry_profile).toBeGreaterThan(0);
    });
    ```

### Phase C — Run + Debug (1-2h)

11. ☐ `npx playwright test scripts/e2e/`.
12. ☐ פר failure — לקרוא error · לבדוק אם זה bug ב-application או ב-test.
13. ☐ **אם bug ב-application:** לדווח למיטל ולא לתקן (אסור-לגעת בקוד production).
14. ☐ **אם bug ב-test:** לתקן + להריץ שוב.
15. ☐ Report: `npx playwright test --reporter=html` → פותח HTML report.

### Phase D — Mobile + RTL Visual Check (30 דק')

16. ☐ הריצי גם בproject `mobile-iphone` — וודא ש-flow עובד במובייל.
17. ☐ screenshots לכל story — שמירה ב-`scripts/e2e/screenshots/`.

### Phase E — Handoff (15 דק')

18. ☐ עדכן `_handoff/agent-completion-log.md` — בלוק חדש סוכן 28.
19. ☐ צור `_handoff/2026-05-XX-e2e-verification-report.md`:
    - 9 stories → pass/fail
    - bugs שמצאת (severity: critical/important/minor)
    - screenshots
20. ☐ דווחי למיטל: "סוכן 28 סיים · X/9 stories ✓ · Y bugs · ממתין לאישור push".

## Acceptance Criteria

- [ ] Playwright מותקן + playwright.config.js קיים.
- [ ] 9 test files חיים + helpers.js + 1 chain test.
- [ ] Tests עוברים על desktop-chrome.
- [ ] Tests עוברים על mobile-iphone (אם UI עובד מובייל).
- [ ] report HTML עם 9 stories pass/fail.
- [ ] bugs מצוינים ב-report בנפרד (לא תוקנו ע"י סוכן 28).
- [ ] **0 רגרסיות** ב-15+ test suites הקיימים.

## אסור לך

- ❌ לערוך **שום קוד production** (HTML / CSS / JS חיים).
- ❌ לערוך JSON תוכן (packs · interventions · moy-items).
- ❌ לערוך מסמכי-אם (architecture-mvp · pedagogy-integration-framework · וכו').
- ❌ "לתקן" bugs שמצאת — רק לדווח. fix = סוכן אחר.
- ❌ לדחוף ל-git. רק מיטל דוחפת.
- ❌ "תכונות חכמות" שלא בסקופ — לא להוסיף accessibility-testing, performance-testing, security-testing (אלה דורשים סוכנים נפרדים).

## בספק

שאלי את מיטל. במיוחד אם:
- bug ב-application נראה חמור — לעצור + לדווח · לא להמשיך.
- Story לא ניתנת לבדיקה כי חסר UI הכרחי — לדווח + לדלג זמנית.
- Playwright לא מצליח להתקין → אולי תקלה בסביבה — לבדוק עם מיטל.

## פעולות בסיום

1. דווח: "סוכן 28 סיים · X/9 stories pass · Y bugs · report ב-_handoff/".
2. **אל תדחוף.** מיטל תאשר ותדחוף.
3. סגור את הסשן אחרי אישור מיטל.

---

*Bootstrap סוכן 28 — Verification E2E בFresh context. אחרי הסיום: pilot-ready עם evidence of functionality.*
