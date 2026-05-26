# Orchestrator Handoff — אבני יסוד
## 27.5.2026 ערב · סוף סשן תזמורת ארוך · 2 סוכני עבודה רצים במקביל

> **מה זה המסמך הזה:** מצב התזמורת ברגע ההעברה. סוכן-תזמורת חדש קורא אותו ראשון יחד עם הזיכרון.
> **זמן קריאה:** 7-10 דקות.
> **handoff קודם:** `orchestrator-handoff-2026-05-26-evening.md` — חלקיו תקפים, אבל **המסמך הזה גובר** במקרה של סתירה.

---

## 1. מה השתנה ב-27.5.2026 (יום אחד, הרבה תזוזה)

### 8 קומיטים נדחפו ל-origin/main היום

| Hash | מה | מי |
|---|---|---|
| `299f9b4` · `666acca` | A0.3 — Mastery משולש מלא (mastery-check.js + hooks ב-5 משחקונים + סקציה 6 ב-teacher-live + תיקון STATE_KEY) | תזמורת (סוכן יצא לעבודה ל-A0.3) |
| `e3715bf` | קבוצה C נדחפה — research + KB + library + vocab + ארכיון partners-review v1/v2 עם באנרי DEPRECATED | סוכן אחר |
| `9d058d7` | A0.1 — תיקון suggestFromBKT + debug panel — קוראים BKT מ-localStorage ישירות (אבחנו שאין `window.AvneiBKT` ב-onboarding-profile) | תזמורת |
| `f9f5576` · `139da39` · `9bb983c` | A1 closure — pending-commits.md + tracker banner | סוכן אחר |
| `c49e479` | סגירת 4 החלטות תזמורתיות + out_of_scope איים 17/18/22 ב-blueprint | תזמורת |
| `af68177` | tracker — עדכון 3 הערות "החלטה פתוחה" לירוק ("נסגר") | תזמורת |
| `61f03d7` | tracker — טבלת "מוכן להתחיל" + הבהרת A.2 כחלקי | תזמורת |

### 4 החלטות שנסגרו רשמית

| # | החלטה | תוצאה |
|---|---|---|
| 1 | רדיקליות שינוי גישה | **B — הדרגתי** (כבר מיושם ב-A0.2+A0.3) |
| 2 | איים 17/18/22 | **B — `out_of_scope: true`** ב-blueprint |
| 3 | פרופיל אורייני | **B — אופציונלי** (כבר מיושם ב-A0.1) |
| 5 | גלגול לכיתה ב' | **B — להמתין עד אחרי פיילוט בא'** |

החלטה 4 (5 vs 8 סטרנדים) נסגרה כבר ב-26.5: **5 סטרנדים סופי**.

### A1 review session נסגר

100 קבצים נדחפו ב-3 קומיטים: A (אי 3 PNG+CSS) · B (handoff docs) · C (research+KB+library+vocab+ארכיון).
נשארו פתוחים: **D 🟡** (6 קבצים — README/index/demo-day2) · **F 🔴** (14 קבצים — מסמכי-אם).

---

## 2. **כרגע** — 2 סוכני עבודה פעילים במקביל

### סוכן 1: A.3 — מודול EPA (Failure × Context × Task)
- **סטטוס:** רץ. מיטל שלחה פרומפט מורחב עם 5 הערות תזמורת.
- **קבצים שייגע:** `js/shared/epa.js` (חדש) + אולי `event-logger.js` + script tags ב-HTML
- **API שצריך להיחשף:** `AvneiEPA.ingestEvent`, `getEPA`, `getDominantPattern`, `dump`, `reset`
- **אחסון:** `avnei-epa-v1` (נפרד מ-bkt)
- **אזהרות שניתנו לו:** ❌ לא לגעת ב-bkt.js · ❌ לא להחליף את 5 הדגלים האוטומטיים ב-event-logger

### סוכן 2: A.1 — BKT-per-strand (5 מודלים במקום 9 פר-אי)
- **סטטוס:** רץ. מיטל שלחה פרומפט מורחב עם 7 הערות תזמורת.
- **קבצים שייגע:** `js/shared/bkt.js` (שינוי מבני)
- **API שחייב להישמר (backwards compat):** `AvneiBKT.getStudentState`, `checkMastery`, `ISLAND_3_LETTERS`, `getIslandState` (כדי לא לשבור A0.1+A0.3)
- **אחסון:** ימשיך להיות `avnei-bkt-v1` אבל מבנה פנימי משתנה (state[student][strand_id] במקום state[student][island_id])
- **תאימות קריטית:** Sub-BKT אי 3 חייב להישאר (A0.1 משתמש בו)
- **אזהרות שניתנו לו:** ❌ אל תיגע ב-mastery-check.js / profile-classifier.js / event-logger.js / 5 משחקוני אי 3

### נקודות חיכוך אפשריות בין הסוכנים

1. **event-logger.js** — A.3 רוצה להוסיף קריאה ל-AvneiEPA. A.1 אולי יוסיף island→strand mapping. **מי שיגיע שני ל-push יעשה git fetch ויראה התנגשות.**
2. **bkt.js** — רק A.1 ייגע. A.3 לא נוגע.
3. **localStorage קיים של ילדות** — A.1 משנה את מבנה `avnei-bkt-v1`. צריך מיגרציה או reset.

---

## 3. אזהרות חזקות — אסור-לחזור-עליהן

⚠️ **לא להזכיר את הציטוטים השגויים:**
- ❌ Shatil & Share 2003 ≠ שלבים (זו הזיה — המאמר עוסק במנבאים בלבד)
- ❌ Share & Bar-On 2018 = **3 פאזות (Triplex)**, לא 6 שלבים (6 שלבים שייכים למשה"ח תשפ"ו)
- ❌ "18 אותיות מ-22" = רף "תקין" של ראמ"ה, **לא** ממוצע אמפירי

⚠️ **לא לעדכן מסמכי-אם:** `architecture-mvp.md`, `pedagogy-integration-framework.md`, `literacy-grade1-2-yearly.md`, `llm-pitfalls.md` — בלי אישור מפורש של מיטל. **architecture-mvp.md modified ב-F1 — אל תיגע בו עכשיו (יערבב עם תיקונים שעוד לא נסקרו).**

⚠️ **לא לדחוף ל-git בלי אישור מפורש של מיטל.**

⚠️ **תפקיד התזמורת = אינטגרציה ותרגום, לא יוזמה פדגוגית.** ככל ספק על תוכן פדגוגי — לשאול את מיטל.

---

## 4. מצב המסכים והקוד אחרי 27.5

### A0 (פאזת ראמ"ה) — סגורה במלואה
- ✅ A0.1 — פרופיל אורייני · אומת end-to-end (25 events, 2 הצעות "שליטה מצוינת")
- ✅ A0.2 — שדות `rama_task_alignment` + `peima_target` ב-86 פריטים
- ✅ A0.3 — Mastery משולש · אומת קצה-לקצה (BKT 95%, שטף 6.1שנ', ראמ"ה 1/5)
- ✅ A0.4 — ים השמועות (memory-pair לאי 2 P2) · 29 MP3 AvriNeural

### 5 משחקונים חיים באי 3
- shell (מ) · rescue (ק) · house (ב) · trail-resh (ר) · storm (ת)
- כולם עם hook ל-`AvneiMasteryCheck.checkAndShowIslandCelebration` בסיום
- 17 אותיות נוספות חסרות (חוסם רף 18+/22 של ראמ"ה — משימה D.15)

### 3 משחקונים חיים באי 2
- twin-seaweeds · fish-schools · whispers (חדש, A0.4)
- דף אינדקס: `stage-2-island.html` (F.22 — נדחף)

### Engine שיש
- `bkt.js` — מנוע BKT (per-island, A.1 הולך להחליף ל-per-strand)
- `event-logger.js` — לוגינג + 5 דגלים אוטומטיים
- `mastery-check.js` — A0.3 — שכבת mastery משולש (BKT + שטף + ראמ"ה) — **לא לגעת**
- `profile-classifier.js` — A0.1 — פרופיל אורייני (קורא BKT מ-localStorage) — **לא לגעת**
- `item-schema.js` — A0.2 — RAMA_TASKS + validateRamaTagging

### Engine שעוד אין (חוסמי פיילוט)
- ❌ EPA (A.3 רץ עכשיו)
- ❌ BKT-per-strand (A.1 רץ עכשיו)
- ❌ Sub-BKT פר אות עבור 22 אותיות (A.4 — כרגע יש רק 5)
- ❌ Cold-start protocol (A.5)
- ❌ Pack schema + Pack × BKT (C.11+12+13)
- ❌ 21A (מסך מורה בשפת ראמ"ה — חוסם פיילוט, תלוי ב-A.1+A.3+A.4)
- ❌ שכפול תבנית ל-17 אותיות (D.15 — חוסם רף ראמ"ה)

---

## 5. מה נשאר לעשות (לפי דחיפות)

### לאחר A.1 + A.3 ישובו (יעדים מיידיים)
- **F.21A** — מסך מורה בשפת ראמ"ה (הופך את "תצוגת הבדיקה" שב-teacher-live סקציה 6 למסך אמיתי). דורש: A.1 ✓ + A.3 ✓ + A.4 → תכנן רק אחרי שכל 3 חוזרים.
- **D.14 → D.15** — חילוץ תבנית גנרית ושכפול ל-17 אותיות באי 3. **הערה אסטרטגית:** D.14 הוא P1 אבל חוסם את D.15 שזה P0 — לשקול קידום של D.14 ל-P0.

### חוסמי פיילוט נוספים (אחרי A.1+A.3 חוזרים)
- A.4 (Sub-BKT פר 22 אותיות) · A.5 (Cold-start) · A.6 (Confidence indicators)
- B.7 (5 אינטרבנציות named — דורש עבודה פדגוגית של מיטל, לא רק קוד)
- C.11 (Pack schema — גם פדגוגי) → C.12 (Pack × BKT integration — "הלב של הדיפרנציאליות")
- E.17 (Event Logger ל-7 תיוגים) → E.18 (Data export ל-Sheet)

### Group F (מסמכי-אם — דורש סקירת מיטל פר קובץ)
14 קבצים שעדיין modified locally (לא נדחפו):
- `architecture-mvp.md` · `curriculum/literacy-grade1-2-yearly.md` · `curriculum/llm-pitfalls.md` · `curriculum/pedagogy-integration-framework.md`
- `spec.html` (5 הופעות של "בר-און") · `curriculum/diagnostic-axes-by-island.md` (2 הופעות)
- 7 פאקים חודשיים `curriculum/packs/grade1-tashpaz/*.json` שמצטטים בר-און
- `perplexity-shatil-share-2003-validation-2026-05-25.json` (לסמן `_INVALIDATED: true`)

### Group D (תיעוד — דורש מסמכי-אם קודם)
6 קבצים: README.md · index.html · 4 קבצים ב-engine/demo-day2/

---

## 6. כללי עבודה לתזמורת חדשה

1. **לפני כל push:** `git fetch origin && git status` (יש 2 סוכנים אחרים פעילים)
2. **לא לדחוף בלי אישור מפורש של מיטל**
3. **לא להחליט פדגוגית עצמאית** — בספק לשאול אותה
4. **לא לעדכן מסמכי-אם** בלי אישור פר-קובץ
5. **לתעד הכל ב-handoff docs** — `agent-completion-log.md` (מי עבד על מה), `meytal-pending.md` (משימות שלה), `pending-commits.md` (סטטוס push)
6. **לכוון את הסוכנים** עם פרומפטים מורחבים שכוללים הערות תזמורת, לא רק את האוטו-פרומפט מה-tracker

---

## 7. קבצים חשובים ל-quick reference

```
avnei-yesod/
├── _handoff/
│   ├── orchestrator-handoff-2026-05-27-evening.md   ← המסמך הזה (גובר)
│   ├── orchestrator-handoff-2026-05-26-evening.md   ← מיושן חלקית
│   ├── 2026-05-26-architecture-tasks-tracker.html   ← tracker עם טבלת "מוכן להתחיל"
│   ├── 2026-05-25-architecture-tasks.md             ← spec מלא של כל המשימות
│   ├── agent-completion-log.md                       ← מי עשה מה
│   ├── meytal-pending.md                             ← משימות ידניות של מיטל
│   ├── pending-commits.md                            ← A1 סגור (closed file)
│   ├── 2026-05-26-partners-review-v3.md             ← הספק הפדגוגי המלא + תרחישים
│   └── agent-bootstraps.md                           ← prompts לסוכני עבודה
│
├── underwater-app/js/shared/
│   ├── bkt.js                ← A.1 ישנה כרגע — לא לגעת בעוד
│   ├── mastery-check.js      ← A0.3 — לא לגעת
│   ├── profile-classifier.js ← A0.1 — לא לגעת
│   ├── event-logger.js       ← A.3 אולי ישנה — לא לגעת בעוד
│   ├── item-schema.js        ← A0.2
│   └── (audio, noni, feedback, scaffolding, shell, instruction)
│
└── curriculum/
    ├── blueprint/22-islands.json                            ← out_of_scope_islands נוסף
    └── knowledge-base/sources/22-islands-validated-...json  ← strand mapping (immutable)
```

---

## 8. מצב כללי — תמונה לעיני התזמורת החדשה

**הפרויקט במצב טוב מתמיד.** A0 פאזה סגורה לחלוטין, 2 סוכני עבודה רצים על משימות מרכזיות, יש tracker עם טבלת "מוכן להתחיל" שמראה בדיוק מה הלאה. מיטל מודעת לסטטוס ולא צריכה תזכורות על דברים שעשתה.

**הסיכון העיקרי כרגע:** התנגשות push בין A.1 ו-A.3 ב-event-logger.js. אם זה קורה — הסוכן שיגיע שני יראה ויעצור, מיטל תהיה צריכה להחליט.

**הצעד הבא הטבעי אחרי A.1+A.3 חוזרים:** שיחת UX קצרה (15-30 דק') לעיצוב 21A — מסך מורה בשפת ראמ"ה. זה יחליף את "תצוגת הבדיקה" של A0.3 בסקציה 6 של teacher-live.

---

## 9. Bootstrap prompt לסוכן-תזמורת חדש

**הדבק בשיחת Claude חדשה:**

```
שיחה חדשה — סוכן תזמורת לאבני יסוד · continuity מסוכן 27.5.2026 ערב

מטרה: לשמש סוכן-תזמורת ראשי לפרויקט. אני (מיטל פלג) מנהלת פיתוח של אבני יסוד.
תפקיד התזמורת = אינטגרציה ותרגום בין סוכנים, לא יוזמה פדגוגית עצמאית.

צעדים מיידיים (חובה לפני שאלות):
1. קרא את הזיכרון: avnei-yesod-master + project-avnei-yesod-architecture-mvp + project-avnei-yesod-pedagogy-integration
2. קרא את ה-handoff התזמורתי החדש: avnei-yesod/_handoff/orchestrator-handoff-2026-05-27-evening.md (גובר על handoff קודם מ-26.5)
3. פתח את ה-tracker ב-Pages כדי לראות סטטוס חי:
   https://impact-os.app/avnei-yesod/_handoff/2026-05-26-architecture-tasks-tracker.html
   טבלת "מוכן להתחיל" בראש הדף.

מצב נוכחי (27.5.2026 ערב):
- A0 פאזה סגורה במלואה (A0.1+A0.2+A0.3+A0.4 — כולן אומתו ונדחפו)
- A1 review session נסגר (3 קבוצות נדחפו · 100 קבצים)
- 4 החלטות תזמורתיות נסגרו (1, 2, 3, 5) + החלטה 4 כבר נסגרה ב-26.5
- 2 סוכני עבודה פעילים: A.1 (BKT-per-strand) ו-A.3 (EPA module)

אזהרות אסור-לחזור-עליהן:
- Shatil & Share 2003 לא הציעו שלבים (זו הזיה)
- Share & Bar-On 2018 = 3 פאזות Triplex, לא 6 שלבים
- "18 אותיות מ-22" = רף "תקין" של ראמ"ה, לא ממוצע אמפירי

כללי עבודה:
- לא להחליט פדגוגית עצמאית
- לא לדחוף ל-git בלי אישור מפורש של מיטל
- לא לעדכן מסמכי-אם בלי אישור פר-קובץ
- לפני כל push: git fetch origin && git status

עכשיו אני (מיטל) על המסך — חכה לשאלה ממני.
```

---

## 10. log שינויים במסמך זה

| תאריך | מה השתנה | על-ידי |
|---|---|---|
| 27.5.2026 ערב | יצירה (מחליף את handoff מ-26.5 ערב) | סוכן-תזמורת (Claude Opus 4.7) |

*— סוף מסמך התזמורת. עדכן אותי בכל שינוי מהותי.*
