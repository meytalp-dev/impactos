# Orchestrator Handoff — אבני יסוד
## 28.5.2026 יום מסיבי · סוף סשן של 5 משימות-מסלול-קריטי

> **מה זה המסמך:** מצב מלא של הפרויקט בסוף יום עבודה אינטנסיבי (28.5.2026). 5 משימות נסגרו ב-origin · 2 spec רשמיים נכתבו · 4 סוכני קוד עבדו במקביל · 22/22 אותיות חיות באי 3.
> **זמן קריאה:** 12-15 דקות.
> **handoff קודם:** `orchestrator-handoff-2026-05-27-late-evening.md` — חלקיו תקפים אבל **המסמך הזה גובר**.

---

## 1. ההישגים הקריטיים של היום

### 🎉 22/22 אותיות חיות באי 3 — חוסם פיילוט הוסר!

ראמ"ה דורשת רף "תקין" של 18+/22 אותיות במשימה 1. **עכשיו יש לנו 22**. ה-D.15 שהיה חוסם הגדול נסגר במלואו ב-`e36a916` + 4 קומיטים F1-F4 של תיקונים.

**6 אמנותיים** (משחקונים ייעודיים עם narrative):
- מ (shell) · ק (rescue) · ב (house) · ר (trail-resh) · ת (storm) · ד (deep-sea — חדש היום, "ים הדגיגים האבודים")

**4 קבוצות תמטיות עם 4 מכניקות מתחלפות** (rotation זהה לכולן):
- בועות (ש·ל·נ·א) · כוכבים (ז·י·ו·ה) · צדפים (ס·ע·צ·ט) · דגים (ג·ח·פ·כ — ד אמנותית)

**4 מכניקות:** tap-all · pick · memory-pair · sort-by-letter
**17 אנימציות סיום אסוציאטיביות SVG**: שמש/לב/נר/אריה/זברה/יום/ורד/הר/סבא/עץ/ציפור/טווס/דגיג/גל/חתול/פיל/כלב
**imagePool לאות ח'** — 3 תמונות שונות בזוגות memory (חתול/חלב/חום)
**~70 קבצי MP3 חדשים ב-AvriNeural** (intro / find / word / finale)

### 📊 5 משימות סגורות ב-origin

| משימה | Commit | מה |
|---|---|---|
| **D.15** | `e36a916` + F1-F4 (`a2dc50a`, `1154d63`, `e27cffe`, `a668c7a`, `b791b1b`, `9f14e87`) | 17 אותיות חדשות באי 3 + ד אמנותית |
| **F.21A code** | `54e00ec` | teacher-rama.html (1315 שורות) + `checkRamaTaskStatus` + PIN gate + Confidence indicators |
| **A.5** | `a171a74` | Cold-start: `isInColdStart(3 ימים + 30 ניסיונות)` + badge "חדשה" + banner + counter + 24 assertions |
| **A.6** | (נכלל ב-`54e00ec`) | Confidence indicators (thresholds 30+/10-29/<10) — נסגר עם F.21A |
| **E.17 + E.18** | `49df726` | Event Logger ל-3 שדות חדשים (strand_id/rama_task_alignment/peima_target) + `data-export.html` עם CSV BOM + PIN gate |

### 📋 2 ספקים רשמיים נכתבו

| Spec | Commit | אומדן ביצוע |
|---|---|---|
| **C.11+C.12+C.13** — Pack × BKT Integration | `6d5a47d` | 10-14 שעות (סוכן 8 רץ) |
| **MOY** — Middle of Year Diagnostic | `52fe991` | 6-8 שעות (סוכן 10) |
| **B.7** — Targeted Reading Interventions | `52fe991` | 8-12 שעות (סוכן 9) |

### 🤖 4 סוכני bootstraps חדשים ב-`agent-bootstraps.md`

- **סוכן 5** (F.21A — נסגר)
- **סוכן 7** (E.17+E.18 — נסגר)
- **סוכן 8** (C.11+C.12+C.13 code — בעבודה כרגע!)
- **סוכן 9** (B.7 code — מוכן להפעלה)
- **סוכן 10** (MOY code — מוכן להפעלה)

---

## 2. אזהרות אסור-לחזור-עליהן (חדשות מהיום)

### החדשות מ-28.5

- ❌ **"5 דפוסי intervention" של ההצעה המקורית** (Shape/Sound/Context/Velocity/Letter-cluster) — Shape ו-Context הם sub-cases של Decoding, לא targets עצמאיים. **המבנה המאומת:** Phonological / Letter Knowledge / Decoding / Fluency / Letter-cluster (ראה `2026-05-28-B7-interventions-spec.md` §3).

- ❌ **"7 דקות אינטרבנציה חד-פעמית"** — אין לזה בסיס מחקרי. **Tier-2 evidence-based = 10-15 דק' × 4-5 ימים שבועיים** (IES Foorman 2016).

- ❌ **MOY עצמאי דיגיטלי כתחליף למבדק ראמ"ה הרשמי** — אסור! ראמ"ה דורשת **1-on-1 פרטני**. MOY-Lite שלנו = תוסף, לא תחליף.

- ❌ **שימוש בפריטי MOY-Lite כתרגול רגיל** — אוסר ראמ"ה (`madrich-mivdak-kriah-grade1.txt:247` — "יפגע במידת הדיוק של ההערכה החוזרת").

- ✅ **קולן 2025 = מאומת!** היה חשד שזו הזיה כי Perplexity לא מצא. בפועל: **ד"ר לימור קולן = מפמ"רית עברית במשרד החינוך** (`moe-curriculum-tashpav-2026.json:20` — חברת ועדת תוכנית הלימודים תשפ"ו). השם לא ב-Perplexity כי היא לא חוקרת אקדמית טהורה — היא מפקחת.

### הקיימות (מ-handoff קודם, עוד תקפות)

- ❌ Shatil & Share 2003 לא הציעו שלבים (הזיה)
- ❌ Share & Bar-On 2018 = 3 פאזות Triplex, לא 6 שלבים (6 שייכים למשה"ח)
- ❌ "18 אותיות מ-22" = רף ראמ"ה, לא ממוצע אמפירי
- ❌ "9 מיומנויות" כסקופ ארכיטקטוני — המערכת = 5 BKT-ים פר סטרנד

---

## 3. מצב משימות (מסלול קריטי לפיילוט)

### ✅ נסגרו ונדחפו במלואן (12 משימות + spec)

- **A.1, A.3, A.4** — BKT engine
- **A0.1, A0.2, A0.3, A0.4** — פרופיל + תיוג + Mastery + פעימות
- **A.5** — Cold-start (חדש 28.5)
- **A.6** — Confidence indicators (נכלל ב-F.21A)
- **D.14** — תבנית גנרית
- **D.15** — 22/22 אותיות (חדש 28.5)
- **E.17, E.18** — Event Logger + Data Export (חדש 28.5)
- **F.21A spec + code** — מסך מורה ראמ"ה (חדש 27-28.5)

### 🟢 בעבודה (אצל מיטל)

- **C.11+C.12+C.13** — Pack × BKT Integration · **סוכן 8 בעבודה**, spec ב-origin

### ⏳ ממתינות לסוכן (spec ב-origin, code לא)

- **B.7** — 5 אינטרבנציות · מומלץ סוכן 9 (8-12 שעות)
- **MOY** — Middle of Year Diagnostic · מומלץ סוכן 10 (6-8 שעות)

### ⏳ פתוחות (עוד לא נדון)

- **A.5 variants** — שאלות פתוחות לסשן הבא:
  - ח' — לבדוק אחרי F3 cache bust שכרטיסים אומרים חתול/חלב/חום
  - נון — "יש עוד על מה לעבוד" (מיטל לא פירטה)
  - imagePool לנ/ו/צ (כרגע תמונה יחידה)
  - "wrapping" — להפוך 3 אותיות נוספות לאמנותיות (אחת פר קבוצה)
- **B.8** Intervention matcher · **B.9** Group Suggestion Engine · **F.20** 3 island modes
- **EOY** diagnostic (אחרי MOY)

---

## 4. סטטוס מסמכי-אם — כולם ב-origin

| מסמך | סטטוס | תוכן |
|---|---|---|
| `architecture-mvp.md` | ✅ v2.0 | 5 סטרנדים · BKT · EPA · sub-BKT · mastery משולש · A.5 fields |
| `pedagogy-integration-framework.md` | ✅ v2.3 | משה"ח + Triplex + SoR + Kim IDL · "משה"ח קובע, ראמ"ה בודקת" |
| `literacy-grade1-2-yearly.md` | ✅ | callout "9 מיומנויות = פדגוגיה, מערכת = 5 BKT-ים" |
| `llm-pitfalls.md` | ✅ | 3 הזיות מתועדות |
| `diagnostic-axes-by-island.md` | ✅ | פרמטרים + EPA · "משה"ח + Triplex Phase" |
| `spec.html` | ✅ עם banner | טיוטה v1 — banner צהוב מפנה למסמכי-אם |
| `2026-05-27-F21A-ux-spec.md` | ✅ | UX spec של מסך מורה |
| `2026-05-27-d15-spec.md` | ✅ | spec של 17 אותיות |
| `2026-05-27-d15-v2-enhancements-spec.md` | ✅ | spec של 4 מכניקות מתחלפות |
| **`2026-05-28-C11-C12-C13-pack-bkt-spec.md`** | ✅ **חדש** | Pack × BKT — schema + bridge + tagging |
| **`2026-05-28-MOY-diagnostic-spec.md`** | ✅ **חדש** | MOY-Lite + state.assessments + repeat 5-6 שבועות |
| **`2026-05-28-B7-interventions-spec.md`** | ✅ **חדש** | 5 דפוסי intervention + 5 שלבי script + מקורות |

---

## 5. כללי עבודה לתזמורת חדשה

### זהירות בריבוי-סוכנים (קריטי!)

ב-28.5 רצו במקביל 4 סוכנים. למדנו:
- **שלושה סוכנים עשויים לגעת ב-`teacher-rama.html`:** סוכן 8 (C.11-13 — Section 5) · סוכן 9 (B.7 — Modal) · סוכן 10 (MOY — Section 6)
- **כלל זהב:** לפני שסוכן נוגע ב-`teacher-rama.html`, חובה `git fetch origin && git pull origin main`
- **סוכן D.15 ב-28.5** עשה `git add .` (לא סלקטיבי) — אסף קבצי handoff של סוכן 5 לקומיט שלו (`a039980`). התוצאה: lo-conflict אבל קומיט "מעורב". **לכל סוכן: `git add` מפורש לקבצים שלו בלבד.**

### כללים גלובליים (לא השתנו)

1. **לפני כל push:** `git fetch origin && git status`
2. **לא לדחוף בלי אישור מפורש של מיטל**
3. **לא להחליט פדגוגית עצמאית** — בספק לשאול
4. **לא לעדכן מסמכי-אם** בלי אישור פר-קובץ
5. **commit סלקטיבי בלבד** — ❌ אסור `git add . / -A / -u`
6. **לתעד הכל** ב-handoff docs

### החדש מ-28.5 — מקורות פדגוגיים

**Perplexity לא הוא מקור הכל-יודע.** מסמכי משה"ח פנימיים (קולן, חוזרי מנכ"ל) לא תמיד באינדקס. אם Perplexity לא מצא — לפני שמסמנים "verification-pending":
1. בדוק `c:/Users/meyta/Downloads/impactos/avnei-yesod/curriculum/knowledge-base/sources/`
2. חפש ב-`tohnit-limudim-safa.pdf` הרשמי
3. רק אחרי שלא מצאת — סמן "verification-pending"

---

## 6. תיאום סוכנים — סדר הפעלה מומלץ

```
עכשיו (28.5 רטרוספקטיב):
  ✅ סוכן 5 (A.5) — נסגר
  ✅ סוכן 7 (E.17+E.18) — נסגר
  ✅ סוכן D.15 — נסגר (22/22)
  🟢 סוכן 8 (C.11+C.12+C.13) — בעבודה אצל מיטל

הצעד הבא (אחרי שסוכן 8 דחף):
  → סוכן 9 (B.7) — תיאום עם C-code (teacher-rama)
  → סוכן 10 (MOY) — תיאום עם 8 ו-9

חוסם פיילוט אחרון:
  → תוכן Pack ספטמבר אמיתי (מיטל כותבת)
  → 60 פריטי MOY-Lite אמיתיים (מיטל כותבת)
  → 5 scripts אינטרבנציה תוכן מלא (מיטל / צוות פדגוגי)
```

**📅 צפי לפיילוט:** אחרי 8+9+10 — תשתית קוד מוכנה. אחרי תוכן ידני — פיילוט אמיתי.

---

## 7. קבצים חשובים ל-quick reference

```
avnei-yesod/
├── _handoff/
│   ├── orchestrator-handoff-2026-05-28-day.md            ← זה (גובר)
│   ├── orchestrator-handoff-2026-05-27-late-evening.md   ← קודם
│   ├── 2026-05-26-architecture-tasks-tracker.html        ← tracker חי
│   ├── 2026-05-27-F21A-ux-spec.md                        ← מסך מורה
│   ├── 2026-05-27-d15-spec.md                            ← D.15
│   ├── 2026-05-27-d15-v2-enhancements-spec.md            ← D.15 v2
│   ├── 2026-05-28-C11-C12-C13-pack-bkt-spec.md           ← חדש (Pack)
│   ├── 2026-05-28-MOY-diagnostic-spec.md                 ← חדש (MOY)
│   ├── 2026-05-28-B7-interventions-spec.md               ← חדש (B.7)
│   ├── agent-bootstraps.md                                ← prompts (סוכנים 1-10)
│   ├── agent-completion-log.md                            ← מי עשה מה
│   ├── meytal-pending.md                                  ← משימות ידניות
│   └── pending-commits.md                                 ← קומיטים פר קבוצה
│
├── architecture-mvp.md                                    ← מסמך-אם טכני v2.0
├── curriculum/
│   ├── pedagogy-integration-framework.md                  ← מסמך-אם פדגוגי v2.3
│   ├── literacy-grade1-2-yearly.md                        ← תוכנית שנתית
│   ├── llm-pitfalls.md                                    ← 3 הזיות
│   ├── diagnostic-axes-by-island.md                       ← פרמטרים + EPA
│   └── knowledge-base/sources/
│       ├── moe-curriculum-tashpav-2026.json               ← קולן + ועדה
│       └── perplexity-shatil-share-2003-validation-2026-05-25.json
│
└── underwater-app/
    ├── teacher-rama.html                                  ← דשבורד מורה ראמ"ה (1315 שורות)
    ├── teacher-live.html                                  ← DEPRECATED (v1)
    ├── data-export.html                                   ← חדש 28.5
    ├── stage-3-{22 letters}.html                          ← 22 משחקונים
    ├── js/shared/
    │   ├── bkt.js          ← BKT-per-strand + sub-BKT 22 אותיות
    │   ├── epa.js          ← 3 צירים
    │   ├── event-logger.js ← + ISLAND_TO_STRAND + 3 שדות
    │   ├── mastery-check.js ← Mastery משולש + checkRamaTaskStatus + isInColdStart
    │   └── profile-classifier.js
    ├── data/island-03-letters/{22 letters}.json
    └── scripts/
        ├── test-bkt.js
        ├── test-bkt-letters.js
        ├── test-rama-task-status.js                       ← 30 assertions
        ├── test-cold-start.js                             ← 24 assertions
        └── test-event-logger-fields.js                    ← 23 assertions
```

---

## 8. בקשה פתוחה ממיטל

(אחרי A.5 / F.21A / D.15 — כלום חדש פתוח עכשיו. כל בקשות פתוחות נסגרו!)

---

## 9. תמונה כללית — איפה הפרויקט עומד

**מצב טכני:** המנוע (BKT + EPA + mastery משולש + sub-BKT + cold-start + ISLAND_TO_STRAND) **כולו ב-origin ועובד.** Event logging מלא. CSV export. דשבורד מורה ראמ"ה חי. 22 משחקונים פעילים. **הקוד למעשה מוכן לפיילוט.**

**מצב פדגוגי:** כל מסמכי-האם מסונכרנים. 3 spec רשמיים חדשים נוספו (Pack × BKT · MOY · B.7). מקורות מאומתים מ-IES + Foorman + Rosenshine + Wanzek + Elbaum + ראמ"ה PDF + משה"ח קולן.

**מה חוסם פיילוט אמיתי (P0):**
1. **C-code** (סוכן 8 בעבודה) — Pack × BKT bridge = לב הדיפרנציאליות
2. **B.7 code** (סוכן 9) — חוויית מורה כשמתגלה דפוס
3. **MOY code** (סוכן 10) — תשתית ל-פעימה 2 (ינו-פבר)
4. **תוכן ידני של מיטל:**
   - Pack ספטמבר 2026 אמיתי (40 פריטים) → מתחבר ל-C
   - 60 פריטי MOY-Lite (משימות 3+4) → מתחבר ל-MOY
   - 5 scripts אינטרבנציה תוכן פדגוגי → מתחבר ל-B.7

**הצעד הבא הטבעי:** המתנה לסוכן 8 → שיגור 9 ו-10 → תוכן ידני של מיטל → פיילוט.

---

## 10. Bootstrap prompt לסוכן תזמורת חדש

**הדבק בשיחת Claude חדשה:**

```
שיחה חדשה — סוכן תזמורת לאבני יסוד · continuity מסוכן 28.5.2026 יום

מטרה: סוכן-תזמורת ראשי לפרויקט אבני יסוד. אני (מיטל פלג) מנהלת פיתוח.
תפקיד התזמורת = אינטגרציה ותרגום בין סוכנים, לא יוזמה פדגוגית עצמאית.

צעדים מיידיים (חובה לפני שאלות):

1. קרא את הזיכרון (נטען אוטומטית):
   - avnei-yesod-master (project_avnei_yesod.md)
   - project-avnei-yesod-architecture-mvp
   - project-avnei-yesod-pedagogy-integration

2. קרא את ה-handoff התזמורתי החדש (גובר!):
   avnei-yesod/_handoff/orchestrator-handoff-2026-05-28-day.md

3. קרא את agent-bootstraps.md (10 סוכנים, סעיף DEPRECATED).

4. פתח את ה-tracker:
   https://impact-os.app/avnei-yesod/_handoff/2026-05-26-architecture-tasks-tracker.html

מצב נוכחי (28.5.2026 — סוף יום):
- ✅ 22/22 אותיות חיות באי 3 (D.15 סגור!)
- ✅ F.21A code + A.5 + A.6 + E.17 + E.18 — כולם ב-origin
- ✅ 3 spec חדשים: C.11-13, MOY, B.7
- 🟢 סוכן 8 (C-code) בעבודה
- ⏳ סוכנים 9 (B.7) + 10 (MOY) מוכנים — תיאום עם 8

אזהרות אסור-לחזור-עליהן (כולל חדשות מ-28.5):
- ❌ 5 דפוסי intervention המקוריים (Shape/Sound/Context/Velocity/Letter-cluster) — אומת כ-Phonological/Letter Knowledge/Decoding/Fluency/Letter-cluster
- ❌ 7 דק' חד-פעמית = לא Tier-2 evidence-based. 10-15 דק' × 4-5 ימים.
- ❌ MOY דיגיטלי כתחליף ל-1-on-1 — אסור
- ❌ פריטי MOY-Lite כתרגול — אסור
- ✅ קולן 2025 = מאומת (moe-curriculum-tashpav-2026.json:20)
- + 4 אזהרות ישנות תקפות

כללי עבודה:
- לא להחליט פדגוגית עצמאית
- לא לדחוף בלי אישור מפורש של מיטל
- לא לעדכן מסמכי-אם בלי אישור פר-קובץ
- לפני כל push: git fetch origin && git status
- אזהרת ריבוי-סוכנים: 8+9+10 כולם נוגעים ב-teacher-rama.html. git pull לפני edit.

עכשיו אני (מיטל) על המסך — חכה לשאלה ממני.
```

---

## 11. log שינויים במסמך זה

| תאריך | מה השתנה | על-ידי |
|---|---|---|
| 28.5.2026 יום | יצירה (אחרי 14 קומיטים + 4 sub-agents + 3 spec חדשים) | סוכן-תזמורת (Claude Opus 4.7 · סשן בוקר-ערב מסיבי) |

*— סוף מסמך התזמורת. עדכן בכל שינוי מהותי.*
