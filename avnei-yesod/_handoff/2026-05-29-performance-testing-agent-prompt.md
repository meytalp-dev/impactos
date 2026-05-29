# Handoff — סוכן 24: Performance Testing לפיילוט

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש. סוכן זה בודק שאבני יסוד מחזיק עומס מציאותי של פיילוט (4-5 ילדות · ~8 חודשים של data).

---

## משימה

בדיקת performance של אבני יסוד תחת תנאי פיילוט אמיתיים:
1. **BKT עם 1000+ events** (4 ילדות × 30 ניסיונות × 8 חודשים = ~1000)
2. **localStorage limits** (כמה state ניתן לאחסן לפני שמגיעים לתקרה של 5MB / 10MB)
3. **Mobile responsive** (מורה פותחת teacher-action.html בטלפון בדרך לבית ספר)
4. **RTL rendering** (כל המסכים — אותיות סופיות, ניקוד, brackets, ASCII)
5. **Accessibility** (a11y check — screen reader · keyboard navigation · color contrast)

## הקשר

הפיילוט = 4-5 ילדות · 1 מורה · ~3 חודשים ראשונים (ספטמבר → נובמבר 2026). data שיצטבר:
- Events: ~30/יום פר ילדה × 5 ילדות × 60 ימי לימודים = ~9,000 events
- Assessments: MOY + BOY = 2 פר ילדה = 10
- Interventions: 5-10 קבוצות חודש = 15-30 פר חודש = ~90

localStorage עומס: ~9000 events × 500 bytes/event = ~4.5MB → **קרוב לתקרה של chrome (5MB).**

## קבצי-מקור — חובה לקרוא לפני עבודה

1. **Performance-critical engines:**
   - `avnei-yesod/underwater-app/js/shared/bkt.js`
   - `avnei-yesod/underwater-app/js/shared/event-logger.js`
   - `avnei-yesod/underwater-app/js/shared/epa.js`
2. **Screens to stress-test:**
   - `teacher-action.html` (F.21E)
   - `teacher-rama.html` (F.21A)
   - `moy-screener.html`
   - `data-export.html`
3. **Existing tests (לעיון בסגנון):**
   - `scripts/test-bkt-letters.js` (53/53 — בודק 22 אותיות)
   - `scripts/test-event-logger-fields.js` (23/23)

## משימות (להריץ ברצף)

### Phase A — BKT Performance (2h)

1. ☐ צרי `scripts/test-bkt-performance.js`:
   - Mock state עם 9,000 events distributed across 5 students × 22 letters
   - מדידה: `BKT.calculate(studentId, letter)` x 1000 — average time?
   - ספי קבילות: < 50ms פר calculation
   - aggregation: כל 22 האותיות פר 5 ילדות — < 1 שניה total
2. ☐ אם איטי — לזהות bottleneck (filter events? lookup?) ולהציע fix.
3. ☐ הוסיפי fixture של 9000 events לקובץ test.

### Phase B — localStorage Stress (1h)

4. ☐ צרי `scripts/test-localstorage-limits.js`:
   - שמירה איטרטיבית של state עם events גוברים
   - מדידה: מתי `setItem` זורק `QuotaExceededError`?
   - דיווח: כמה events ניתן לאחסן לפני התקרה?
5. ☐ אם < 9000 → להציע strategy לחיתוך (archive old events to IndexedDB? clear after 90 days?).

### Phase C — Mobile Responsive Audit (2h)

6. ☐ פתחי כל מסך ב-Chrome DevTools mobile mode (iPhone 12, 390×844):
   - `teacher-action.html` — האם 4 KPI tiles נכנסים? המסך scrollable? touch targets ≥ 44px?
   - `teacher-rama.html` — הטבלה גלילה אופקית? sticky column מימין עובד?
   - `moy-screener.html` — האם פריט נקרא בגודל סביר? כפתורים נגישים?
   - `stage-3-*.html` (sample 3 משחקונים) — האם המכניקה עובדת ב-touch? animations חלקות?
7. ☐ דיווח: רשימת issues + screenshots (אם אפשר).

### Phase D — RTL Audit (1h)

8. ☐ בדיקת ניקוד באותיות סופיות (ך/ם/ן/ף/ץ) — האם מוצג נכון בכל הfonts הנוכחיים?
9. ☐ בדיקת mixed content (עברית + מספרים/אנגלית) — האם הסדר נכון?
10. ☐ בדיקת brackets, רכיבי UI (slider, button), modal headers.
11. ☐ דיווח: רשימת issues.

### Phase E — Accessibility Audit (1h)

12. ☐ Chrome Lighthouse Accessibility audit על 3 מסכים מרכזיים (`teacher-action`, `moy-screener`, sample `stage-3-*`):
    - score (יעד: ≥ 90)
    - issues מסומנים
13. ☐ Manual checks:
    - keyboard navigation (Tab order) — האם מורה יכולה לנווט עם מקלדת בלבד?
    - color contrast (WCAG AA) — האם כל הטקסט פוס ≥ 4.5:1?
    - aria labels בכפתורי icon-only
14. ☐ דיווח: רשימת issues + recommended fixes.

### Phase F — סיכום

15. ☐ צרי `_handoff/2026-05-XX-performance-audit-report.md`:
    - Phase A-E findings
    - Critical issues (must-fix לפני פיילוט)
    - Important (nice-to-fix לפני פיילוט)
    - Post-pilot (לדחות)
16. ☐ דווחי למיטל סיכום + 3 הbugs הקריטיים ביותר אם יש.

## Acceptance Criteria

- [ ] 2 test files חדשים (`test-bkt-performance.js` · `test-localstorage-limits.js`).
- [ ] Report בקובץ `_handoff/`.
- [ ] BKT calculations < 50ms פר קריאה.
- [ ] localStorage strategy אם < 9000 events.
- [ ] Lighthouse a11y ≥ 90 ב-3 מסכים.
- [ ] רשימת issues עם severity (critical/important/nice-to-have).

## אסור לך

- ❌ לערוך bkt.js / event-logger.js / epa.js — קריאה בלבד.
- ❌ לערוך teacher-action.html / teacher-rama.html — קריאה בלבד.
- ❌ לדחוף ל-git.
- ❌ לתקן issues שאת מוצאת — רק לדווח. fix = סוכן אחר.
- ❌ "תכונות חכמות" (להחליף localStorage ב-IndexedDB עכשיו — רק להמליץ אם נדרש).

## בספק

שאלי את מיטל. במיוחד אם:
- BKT איטי — האם לעצור ולחבר fix או להמשיך לפאזה הבאה?
- Lighthouse score נמוך משמעותית — איזה issues חוסמים את הפיילוט?
- localStorage limit מתחת ל-9000 — אסטרטגיה חירומית?

## תיאום עם סוכנים פעילים

יכול לרוץ במקביל לכל סוכן אחר — קריאה בלבד של מסכים, לא נוגע ב-state production. לפני push, לוודא: `git fetch origin && git status`.
