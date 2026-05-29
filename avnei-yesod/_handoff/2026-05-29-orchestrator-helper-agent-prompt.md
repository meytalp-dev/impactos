# Handoff — סוכן 22: Orchestrator Helper (8 משימות תיעוד וסקירה)

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש. **הסוכן הזה לא נוגע בקוד production** — רק תיעוד, סקירה, וכתיבת bootstraps. בטוח להריץ במקביל לסוכן 1 (F.21E) ולסוכן 19 (september items) שהסתיים.

---

## משימה

אתה helper agent לסוכן התזמורת הראשי. **8 משימות תיעוד וסקירה** בלי לגעת בקוד פעיל. רץ במקביל לסוכן 1 (F.21E עוד בעבודה).

**הקשר:** "אבני יסוד" = מערכת תרגול אדפטיבית לכיתה א'. נכון להפעלה: **4 commits מקומיים לא דחופים** ל-origin:
```
c611a92 test-weakness-targeting fix — Tier 3 expectation 4 → 10
7316272 orchestrator: archive demo + F.21E pedagogical handoff trail + interventions bootstrap
79b1540 september-2026 pack — 19 → 40 items (סוכן 19)
d7e86ec F.21E — Action Dashboard (UI + helpers + tests · code agent) ⚠️ עוד בעבודה
```

**12/12 tests passing** אחרי הfix של c611a92.

## ⚠️ אסור לגעת ב

- `underwater-app/teacher-rama.html` (סוכן 1 עליו)
- `underwater-app/teacher-action.html` (סוכן 1 עליו)
- `underwater-app/js/shared/f21e-helpers.js` (סוכן 1 עליו)
- `_handoff/agent-completion-log.md` (סוכן 1 ידחוף עדכון — conflict)
- `_handoff/2026-05-26-architecture-tasks-tracker.html` (סוכן 1 ידחוף עדכון)
- כל קוד JS חי (bkt.js · epa.js · interventions.js · וכו') — קריאה בלבד
- מסמכי-אם (architecture-mvp.md · pedagogy-integration-framework.md · literacy-grade1-2-yearly.md · llm-pitfalls.md)
- 5 קבצי `interventions/*.json` — תוכן פדגוגי (סוכן 21 פדגוגי יטפל)
- 60 פריטי MOY ב-`engine/moy-items.json` — תוכן פדגוגי
- 22 משחקוני stage-3 — קוד פעיל
- ❌ **לא לעשות `git commit` או `git push`** — תזמורת תאסוף את התוצרים שלך וtcommit בעצמה
- ❌ **לא להפעיל סוכנים אחרים** דרך bash

## מותר לכתוב (קבצים חדשים בלבד, ב-_handoff/)

- `_handoff/2026-05-29-orchestrator-helper-report.md` (תוצרי A2-A5)
- `_handoff/2026-05-29-orchestrator-handoff-evening.md` (תוצר B1)
- `_handoff/2026-05-29-eoy-spec-agent-prompt.md` (תוצר C1)
- `_handoff/2026-05-29-a5-variants-agent-prompt.md` (תוצר C2)
- `_handoff/2026-05-29-verification-e2e-agent-prompt.md` (תוצר C3)

## 8 המשימות (להריץ ברצף · אחת אחרי השנייה · רפורט בסוף)

### A2 — Interventions Depth Map (15 דק')

קרא את 5 הקבצים: `avnei-yesod/underwater-app/interventions/{phonological,letter-knowledge,decoding,fluency,letter-cluster}.json`.

לכל אחד — לכל אחד מ-5 ה-stages (hook · model · guided · independent · check):
- ספור chars של teacher_say + teacher_do + notes + success_criterion
- בדוק אם יש examples_to_use · differentiation · troubleshooting (כפי שהציע bootstrap סוכן 21)
- דרג: STUB (<500) / PARTIAL (500-1500) / FULL (1500+)

**Deliverable:** טבלה ב-`_handoff/2026-05-29-orchestrator-helper-report.md` עם:
```
| pattern | stage | base_chars | enhanced_chars | grade | חסר |
```

### A3 — Niqud Audit ל-MOY-Lite (20 דק')

קרא את `avnei-yesod/engine/moy-items.json` (60 items · task_3 + task_4).

לכל item ב-task_3:
- בדוק `passage_text` · `question_text` — כל מילה עברית עם 3+ אותיות צריכה ניקוד
- ערוך רשימת items שבהם חסר ניקוד

לכל item ב-task_4:
- בדוק `word` · `instruction_text` · options — ניקוד מלא
- ערוך רשימה

קרא את `avnei-yesod/engine/moy-screener.html` — חיפוש כל string עברי שילדה תראה (כפתורים · הוראות · הודעות).
- אם חסר ניקוד — לציין שורה ספציפית.

**Deliverable:** סעיף ב-report:
```
A3 Niqud Audit
- MOY items issues: N (פירוט בסעיף)
- moy-screener UI issues: N (פירוט בסעיף + line refs)
```

### A4 — MEMORY.md Review (10 דק')

קרא את `c:\Users\meyta\.claude\projects\c--Users-meyta-Downloads-impactos\memory\MEMORY.md` + 4 קבצי memory הקיימים תחת `memory/`.

הצע ב-report:
- memories חדשים שכדאי ליצור לאור הסבב היום (לדוגמה: "סוכן 1 + סוכן 19 רצו במקביל ב-2 VS Codes — זה pattern שעובד")
- memories קיימים שצריך לעדכן (לדוגמה: F.21A vs F.21E split — עכשיו F.21E code קיים, לעדכן status)
- memories שכדאי למחוק (אם משהו לא רלוונטי יותר)

⚠️ **אל תיצור או תעדכן memories בעצמך** — רק להציע. תזמורת תאשר ותכתוב.

### A5 — 22 stage-3-*.html Audit (30 דק')

ב-`avnei-yesod/underwater-app/`, חפש את כל `stage-3-*.html` (22 קבצים).

לכל קובץ:
- קרא רק את ה-`<head>` + ה-script tag הראשון + מבנה ה-`<body>` (לא יותר מ-100 שורות פר קובץ)
- בדוק:
  - האם `intro_audio_keys` מתאים לקובץ MP3 שקיים ב-`assets/audio/` (אם אפשר לבדוק עם Glob)
  - האם `mechanic` ב-JSON תואם למשחקון
  - האם distractors קיימים (לפחות 4)
  - האם `rama_task_alignment: 1` · `peima_target: 1`
  - האם title עם ניקוד

**Deliverable:** טבלה ב-report:
```
| letter | file | mechanic | issues | severity |
```

### B1 — Orchestrator Handoff Evening (15 דק')

כתוב `_handoff/2026-05-29-orchestrator-handoff-evening.md` בסגנון `2026-05-28-day.md` הקיים:

- §1 ההישגים של היום (4 commits מקומיים + 1 דחוף בoriginA)
- §2 מצב מסלולים (סוכן 1 / 19 / 21 פדגוגי / 22 helper)
- §3 untracked + פתוחות
- §4 מסלולים פתוחים לסוכן תזמורת מחר
- §5 7 שאלות פתוחות מה-Roadmap (סטטוס מעודכן: מה נסגר, מה פתוח)
- §6 Bootstrap prompt לסוכן תזמורת חדש בסשן הבא

### C1 — EOY Spec Bootstrap (20 דק')

כתוב `_handoff/2026-05-29-eoy-spec-agent-prompt.md` — bootstrap לסוכן ספק שיכתוב spec ל-**EOY diagnostic**.

מודל מנחה: MOY spec הקיים `_handoff/2026-05-28-MOY-diagnostic-spec.md`. הבדלים:
- EOY = אחרי פעימה 3 (אפריל-מאי 2027)
- משימות ראמ"ה הרלוונטיות: 5-10 (פעימה 3)
- לא חוסם פיילוט ספטמבר 2026 — post-MOY (= post-pilot data)
- אומדן: S spec, M dummy items

### C2 — A.5 Variants Bootstrap (20 דק')

כתוב `_handoff/2026-05-29-a5-variants-agent-prompt.md` — bootstrap לסוכן שיטפל ב-3 הפתוחות של A.5 variants:

1. **imagePool לאות נ/ו/צ** (כיום תמונה יחידה — דומה ל-ח עם 3 תמונות)
2. **wrapping 3 אותיות נוספות** ל-amateur (אחת פר קבוצה: כוכבים/צדפים/דגים)
3. **אות נ — "יש עוד על מה לעבוד"** (חסר פירוט ממיטל — לסמן כ-OPEN_QUESTION בbootstrap)

⚠️ דורש החלטות פר אות ממיטל לפני הפעלה.

### C3 — Verification E2E Bootstrap (25 דק')

כתוב `_handoff/2026-05-29-verification-e2e-agent-prompt.md` — bootstrap לסוכן Playwright שיבדוק את ה-flow המלא מ-Pre-Pilot Roadmap §3:

1. ילדה חדשה → onboarding-profile (פרופיל אורייני)
2. אי 3 — 22 אותיות עם sub-BKT
3. ינואר → MOY-Lite → fail במשימה 4
4. `state.assessments[sid].suggested_intervention` נשמר (B.8 matcher = phonological)
5. תלמידה 2 גם fail עם phonological → 3 ילדות → group banner מופיע
6. מורה לוחצת "פתחי קבוצת תמיכה" → modal של B.7
7. מבצעת intervention עם PDF print
8. סימון "✓ ביצעתי"
9. ילדות חוזרות ל-packs עם Weakness Targeting (b.7 letters)

קבצים מעורבים: כל המסכים. דרישות: Playwright + Hebrew RTL support + mobile viewport.

## Acceptance Criteria

- [ ] 5 קבצים חדשים ב-`_handoff/` (report + handoff + 3 bootstraps).
- [ ] **אפס** edits בקבצי production.
- [ ] **אפס** commits.
- [ ] רפורט סופי 1-2 פסקאות במסר האחרון של הסוכן: "8/8 done · 5 קבצים נכתבו ב-_handoff · ממתין לאישור push של תזמורת".

## אסור

- ❌ git commit / push
- ❌ עדכון agent-completion-log.md (תזמורת תעשה)
- ❌ עדכון tracker.html (תזמורת תעשה)
- ❌ עריכת interventions/*.json (סוכן 21 פדגוגי יעשה)
- ❌ עריכת moy-items.json (תוכן פדגוגי של מיטל)
- ❌ עריכת stage-3-*.html (קוד פעיל)
- ❌ ספציפית — לערוך teacher-rama / teacher-action / f21e-helpers (סוכן 1 פעיל)
- ❌ להמציא נתונים — אם לא מוצא מידע, סמן `[unknown — לבדוק עם מיטל]`

## בספק

שאלי את מיטל. במיוחד אם:
- A5: מצאת stage-3 שבור (audio_key חסר / mechanic שלא תואם) — לדווח, לא לתקן.
- A3: ניקוד חסר במקום שמצריך החלטה פדגוגית (לדוגמה: שם פרטי בלי ניקוד מקובל).
- A2: stage שנראה ריק לחלוטין — לציין ב-report.

---

*Bootstrap זה מובנה ל-helper agent של 29.5 ערב. אחרי שהוא מסיים — תזמורת מאשרת push של 4 commits + commit נוסף לתוצרי helper.*
