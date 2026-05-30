# Handoff — סוכן Fix A/G-1: כפתור הדפסה במודל B.7 (Intervention Script)

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש. אומדן 1-2 שעות בלבד · משימה ממוקדת.

---

## הוראות תזמורת — מיטל · 29.5.2026

> finding A/G-1 שדווח ע"י סוכן 28 (E2E Verification). story 7 נכשלה כי B.7 modal חסר כפתור Print/PDF. אתה התיקון.

## משימה

להוסיף **כפתור הדפסה** במודל ה-Intervention Script (B.7) בשני המקומות בהם הוא נפתח, + **RTL print stylesheet** כך שמורה תוכל להדפיס את ה-script לכיתה.

## הקשר

- **סוכן 28 גילה:** טסט `[scripts/e2e/06-pdf-print.spec.js](../scripts/e2e/06-pdf-print.spec.js)` כרגע **skipped** עם annotation `app-gap`. אין כפתור הדפסה במודל.
- **השלכה פדגוגית:** המורה רואה את ה-script (stages · materials · evidence · cues) רק על המסך. בכיתה היא צריכה דף מודפס.
- **מיקום היעד:** Modal עם selector `[data-iv-modal="1"]`. נפתח ב-2 דפים:
  - [avnei-yesod/underwater-app/teacher-action.html](../underwater-app/teacher-action.html) — line 1509-1524 (פונקציית פתיחת modal)
  - [avnei-yesod/underwater-app/teacher-rama.html](../underwater-app/teacher-rama.html) — line ~2945 (modal דומה)

## מה לבנות

### Phase A — Print button בשני המסכים (45 דק')

1. ☐ קרא [teacher-action.html](../underwater-app/teacher-action.html#L1504-L1525) (block `iv-actions` + פתיחת `backdrop`).
2. ☐ הוסף ב-`iv-actions` כפתור חדש **לפני** `iv-btn-done`:
   ```html
   <button type="button" class="iv-btn-print" data-iv-print aria-label="הדפיסי את הסקריפט">🖨️ הדפיסי</button>
   ```
3. ☐ הוסף event listener: `backdrop.querySelectorAll('[data-iv-print]').forEach(...)` → `window.print()`.
4. ☐ חזור על 1-3 ב-[teacher-rama.html](../underwater-app/teacher-rama.html) (block דומה סביב line 2945).

### Phase B — Print stylesheet ל-RTL (30 דק')

5. ☐ הוסף ל-`<style>` של teacher-action.html (ובאופן זהה ל-teacher-rama.html):
   ```css
   @media print {
     body * { visibility: hidden; }
     [data-iv-modal], [data-iv-modal] * { visibility: visible; }
     [data-iv-modal] {
       position: absolute; inset: 0;
       background: white; padding: 1cm;
       direction: rtl; font-family: 'Heebo', sans-serif;
     }
     .iv-close, .iv-btn-print, .iv-btn-done, .iv-btn-cancel { display: none !important; }
     .iv-modal-backdrop { background: transparent; }
     @page { size: A4; margin: 1.5cm; }
   }
   ```
6. ☐ ודא ש-RTL נשמר בהדפסה (Heebo · direction: rtl).
7. ☐ ודא שלא מודפסים: ×, כפתורי action, רקע backdrop.

### Phase C — Verify + Test (15 דק')

8. ☐ הסר את `test.skip(...)` מ-[scripts/e2e/06-pdf-print.spec.js](../scripts/e2e/06-pdf-print.spec.js) — וודא שה-test עובר (יחפש כפתור `[data-iv-print]` או טקסט "הדפיסי").
9. ☐ הריצי `cd avnei-yesod/scripts/e2e && npm test` — וודאי **22/22 ירוקים** (היה 21/21 + 1 skipped).
10. ☐ הריצי גם 16 test suites הקיימים — `cd avnei-yesod/underwater-app/scripts && node test-*.js` — 0 רגרסיות.
11. ☐ בדיקה ידנית:
    - פתחי teacher-action.html, לחצי על intervention button → modal נפתח עם כפתור 🖨️.
    - לחצי על הכפתור → Print Preview עולה ברווידוי RTL, ללא כפתורים.
12. ☐ עדכן `agent-completion-log.md` (בלוק חדש לסוכן fix).

## Acceptance Criteria

- [ ] כפתור הדפסה ב-modal · נראה במסך · מוסתר בהדפסה
- [ ] `window.print()` עובד · Preview RTL נקי
- [ ] test 06-pdf-print.spec.js לא skipped · עובר ב-2 projects (desktop + mobile)
- [ ] 22/22 E2E tests ירוקים
- [ ] 0 רגרסיות ב-16 test suites
- [ ] בדיקה ידנית עברה בשני המסכים (teacher-action + teacher-rama)
- [ ] agent-completion-log.md עודכן

## אסור לך

- ❌ לערוך מודלים אחרים (B.6 · MOY screens · stage games) — רק B.7
- ❌ להוסיף jsPDF / ספריות חיצוניות — `window.print()` + CSS בלבד
- ❌ לשנות את ה-bodyHtml או logic של recordIntervention — רק כפתור + listener + print CSS
- ❌ לערוך מסמכי-אם · interventions/*.json · moy-items.json · packs/*
- ❌ לדחוף ל-git בלי אישור מיטל
- ❌ "תכונות חכמות" שלא ב-spec (לא להוסיף כפתור PDF export · לא לעשות download · לא לעשות email)

## תיאום עם סוכנים אחרים

- סוכן 29 (אי 4 · vowel-adapter) — פעיל במקביל · אין חפיפה (הוא ב-js/shared/ · stage-4-*)
- סוכן 31 (אי 14 · oral-skill) — פעיל במקביל · אין חפיפה (הוא ב-js/shared/ · stage-14-*)
- סוכן 28 (E2E) — סיים · push ב-origin (91e6106) · אתה משחרר את ה-skipped שלו

**לפני edit:** `git fetch origin && git status`. אם תראה M ב-teacher-action.html שלא ערכת — תפסיק ותודיע למיטל.

---

*Bootstrap סוכן Fix A/G-1 — תיקון ממוקד · 1-2h · מסיים את story 7 לפיילוט.*
