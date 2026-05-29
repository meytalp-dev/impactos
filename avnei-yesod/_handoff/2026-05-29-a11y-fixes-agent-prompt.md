# Handoff — סוכן 25: UI Accessibility Fixes (4 issues · ~1.5h)

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש. סוגר 4 issues של a11y שזיהה סוכן 24 ב-`_handoff/2026-05-29-performance-audit-report.md`.

---

## משימה

תיקון 4 issues של a11y לפני פיילוט ספטמבר 2026. **לא חוסם פיילוט** אבל מומלץ פדגוגית — ילדה עם קצרי-ראייה / מורה שמשתמשת ב-screen reader יקבלו חוויה תקינה.

**אומדן:** ~1.5 שעות סה"כ.

## הקשר

סוכן 24 הריץ performance + a11y audit (Phase A-E) ב-29.5.2026 ערב. תוצאה: **0 critical · 4 important · 3 post-pilot.** הוא לא תיקן — רק דיווח. המשימה שלך = לתקן את 4 ה-important.

קריאה חובה: `avnei-yesod/_handoff/2026-05-29-performance-audit-report.md` — דו"ח מלא עם line numbers ופרטים.

## 4 ה-fixes (להריץ ברצף)

### Fix 1 — `user-scalable=no` ב-30 מסכי תלמיד.ה (15 דק')

**הבעיה:** WCAG 1.4.4 violation — מונע zoom. הילדה לא יכולה להגדיל text.

**איפה:** כל קובץ HTML תחת `avnei-yesod/underwater-app/` שמכיל `<meta name="viewport">` עם `maximum-scale=1.0, user-scalable=no`.

**איך לזהות:**
```bash
grep -rl "user-scalable=no" avnei-yesod/underwater-app/
```

**התיקון (פר קובץ):**
- מ-`<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`
- ל-`<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">`

(להסיר `maximum-scale=1.0, user-scalable=no` בלבד · לשמור viewport-fit אם קיים)

**Acceptance:**
- [ ] `grep -r "user-scalable=no" avnei-yesod/underwater-app/` → אפס results (חוץ מ-`stage-3-*-old.html` אם יש).
- [ ] בדיקה ידנית: פתיחה ב-Chrome mobile mode + pinch-zoom → עובד.

### Fix 2 — `moy-screener.html` — aria + @media (45 דק')

**הבעיה:** 0 aria attributes + 0 @media queries · screener קצר אבל פנימי לטכניקה צריך לכוון.

**איפה:** `avnei-yesod/engine/moy-screener.html`

**התיקונים:**

**A. aria additions:**
- כל `<button>` של `audio-btn` (🔊 — להקראה) → הוסף `aria-label="הקראת השאלה"` או `aria-label="הקראת הקטע"`.
- אזור תגובה דינמי (אחרי שילדה עונה) → הוסף `aria-live="polite"` על div ההורה.
- noni-bubble → הוסף `role="region" aria-label="הוראות נוני"`.
- כפתורי תשובה (4 אופציות) → ודא ש-`<button>` סמנטי (כן), הוסף `aria-pressed` כשנבחר.

**B. @media query:**
- הוסף לפני ה-`</style>`:
```css
@media (max-width: 480px) {
  .page { padding: 20px 12px; }
  h1, .h1 { font-size: 22px !important; }
  .passage-text { font-size: 17px; line-height: 1.6; }
  .audio-btn { min-height: 44px; }
}
```

**Acceptance:**
- [ ] `grep -c "aria-" avnei-yesod/engine/moy-screener.html` → לפחות 6.
- [ ] `grep -c "@media" avnei-yesod/engine/moy-screener.html` → לפחות 1.
- [ ] בדיקה ב-Chrome DevTools mobile (iPhone 12, 390px) — padding סביר, font קריא.

### Fix 3 — aria-label על כפתורי icon-only (20 דק')

**הבעיה:** 2-4 aria attrs ב-`teacher-action.html` + `teacher-rama.html` כשיש 10+ כפתורים.

**איפה:** `avnei-yesod/underwater-app/teacher-action.html` + `avnei-yesod/underwater-app/teacher-rama.html`

**איך לזהות כפתורי icon-only:**
- חיפוש `<button>` שמכיל רק emoji (🔄 · 🌅 · ← · ⚙ · 📋 · 📲 · ✓ · etc.) ללא text.
- חיפוש `<button>` שמכיל רק `<svg>` או `<img>`.

**התיקון (פר כפתור):**
- מ-`<button class="..." onclick="...">🔄</button>`
- ל-`<button class="..." onclick="..." aria-label="רענן">🔄</button>`

**רשימה מומלצת:**
- 🔄 → `aria-label="רענן"`
- 🌅 → `aria-label="עברי לפעולה"`
- ← → `aria-label="חזרה"`
- × → `aria-label="סגור"`
- 📲 → `aria-label="שלחי לתרגול"`
- ✓ → `aria-label="סמני שבוצע"`
- ⚙ → `aria-label="הגדרות / שינוי ידני"`
- 📋 → `aria-label="פתחי תרגול"`

**Acceptance:**
- [ ] בדיקה ידנית: כל `<button>` icon-only יש לו `aria-label`.
- [ ] `grep -c "aria-label" avnei-yesod/underwater-app/teacher-action.html` → גדל מ-2 ל-12+.
- [ ] `grep -c "aria-label" avnei-yesod/underwater-app/teacher-rama.html` → גדל מ-4 ל-14+.

### Fix 4 — `#a0aec0` text contrast (10 דק')

**הבעיה:** `#a0aec0` על רקע לבן = contrast ratio 2.5:1. WCAG AA דורש 4.5:1.

**איפה:** `avnei-yesod/underwater-app/teacher-action.html` + `avnei-yesod/underwater-app/data-export.html`

**התיקון:**
- חיפוש `#a0aec0` (אותיות קטנות) או `#A0AEC0` (גדולות) → replace ל-`#718096` (כבר בשימוש במקומות אחרים, ratio 4.6:1 ✓).
- ⚠️ **לא להחליף `replace_all`** — קודם לראות איפה זה, ייתכן שיש מקום שכן מתאים (decorative shadow / border).

**איך:**
```bash
grep -n "#a0aec0\|#A0AEC0" avnei-yesod/underwater-app/teacher-action.html
grep -n "#a0aec0\|#A0AEC0" avnei-yesod/underwater-app/data-export.html
```

לכל instance — לבדוק context (text? border? shadow?) ולהחליף **רק text colors**.

**Acceptance:**
- [ ] כל text color שהיה `#a0aec0` עכשיו `#718096`.
- [ ] borders/shadows ב-`#a0aec0` נשארים אם מתאימים.
- [ ] בדיקה ידנית: hints קריאים יותר.

## משימות סופיות (אחרי 4 ה-fixes)

5. ☐ הריצי כל ה-12 test suites — וודאי 0 רגרסיות.
   ```bash
   for f in test-bkt test-bkt-letters test-cold-start test-event-logger-fields test-group-suggester test-interventions test-intervention-matcher test-moy-assessments test-moy-intervention-link test-pack-bridge test-rama-task-status test-weakness-targeting test-f21e-helpers test-letter-targets test-skill-units test-bkt-performance test-localstorage-limits; do
     node avnei-yesod/underwater-app/scripts/${f}.js 2>&1 | tail -1
   done
   ```
6. ☐ עדכון `_handoff/2026-05-29-performance-audit-report.md` — להוסיף סעיף "Fixed by סוכן 25" בסוף עם 4 ה-fixes.
7. ☐ בלוק חדש בראש `_handoff/agent-completion-log.md`.
8. ☐ דווחי למיטל: "סוכן 25 סיים · 4 fixes · 0 רגרסיות · ממתין לאישור push".

## Acceptance Criteria

- [ ] Fix 1: אפס `user-scalable=no` בקבצי תלמיד.ה (חוץ מ-old).
- [ ] Fix 2: aria + @media ב-moy-screener (≥6 aria, ≥1 @media).
- [ ] Fix 3: כל כפתור icon-only ב-2 המסכים יש לו aria-label.
- [ ] Fix 4: `#a0aec0` → `#718096` ב-text colors בלבד.
- [ ] **0 רגרסיות** בכל test suites.
- [ ] תיעוד ב-agent-completion-log + performance-audit-report.

## אסור לך

- ❌ לערוך קוד JS (bkt.js · interventions.js · וכו') — רק HTML/CSS inline.
- ❌ לערוך JSON תוכן (interventions/*.json · moy-items.json · packs/*).
- ❌ לדחוף ל-git בלי אישור.
- ❌ "תכונות חכמות" שלא ב-4 ה-fixes (אל תוסיפי skip-link · אל תרפקטרי CSS · אל תכתבי styled-component).
- ❌ לערוך `teacher-rama.html` אם יש שינויים פעילים — `git fetch && git status` תחילה.
- ❌ לערוך `teacher-action.html` אם סוכן 1 חזר — אותו דבר.
- ❌ לשנות ה-emoji עצמו — רק להוסיף aria-label לידו.

## בספק

שאלי את מיטל. במיוחד אם:
- מצאת `<button>` icon-only שלא ברור מה הוא עושה (איזה aria-label?).
- `#a0aec0` בstructure שזה לא text (border/shadow) — להשאיר או להחליף?
- test נשבר אחרי שינוי HTML — תיעדי + לדבג, **לא לחבר fix של קוד**.

## תיאום עם סוכנים פעילים

- סוכן 1 (F.21E): סיים. אם חזר → conflict פוטנציאלי ב-teacher-action.html / teacher-rama.html.
- סוכן 23 (6 packs): רץ ב-VS Code אחר. אין חפיפת קבצים (הוא ב-curriculum/packs/).
- סוכן 21 (interventions): רץ ב-ChatGPT/Claude. אין חפיפת קבצים.

**לפני כל edit:** `git fetch origin && git status`. אם יש M ב-teacher-rama/teacher-action — לעצור ולשאול את מיטל.

---

*Bootstrap סוכן 25 — נסיים את ה-a11y לפני פיילוט. אם הכל עובר → 0 issues important נשארים.*
