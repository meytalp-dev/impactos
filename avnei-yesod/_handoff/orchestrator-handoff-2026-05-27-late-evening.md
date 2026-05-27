# Orchestrator Handoff — אבני יסוד
## 27.5.2026 לילה · סוף סשן מסיבי של תיקוני "9 מיומנויות → 5 סטרנדים"

> **מה זה המסמך הזה:** מצב מלא של הפרויקט אחרי סשן בן 4-5 שעות שתיקן בעיה מערכתית — מסמכי-אם מעודכנים שלא היו ב-origin גרמו לסוכנים לחזור על "9 מיומנויות" ועוד טעויות. **הפרויקט עכשיו במצב הגנה מקסימלית מ-LLM hallucinations.**
> **זמן קריאה:** 10-12 דקות.
> **handoff קודם:** `orchestrator-handoff-2026-05-27-evening.md` — חלקיו תקפים, אבל **המסמך הזה גובר**.

---

## 1. השינויים הקריטיים שנעשו בסשן הזה (27.5 ערב-לילה)

### 🚨 הבעיה שזוהתה
מיטל קראה לסוכן אחר לבנות מצגת, והוא נתן תוכן ישן ("9 מיומנויות" + "6 שלבי בר-און/Share" שגוי). חקירה גילתה שורש הבעיה:
- 6 מסמכי-אם מעודכנים ישבו 5-7 ימים ב-local שלה בלי push
- ב-`origin/main` היה רק תוכן v1 (לפני 21.5.2026 pivot)
- 23 קבצים ציבוריים (sales, engine, index, README) עוד עם "9 מיומנויות"
- הזיכרון של `project-avnei-yesod-architecture-mvp` הכיל סתירה — שורה אחת אמרה "9 מיומנויות = הסקופ" ושורה אחרת "5 סטרנדים = לא ב-MVP"

### ✅ 8 קומיטים שנדחפו לתיקון

| # | קומיט | מה |
|---|---|---|
| 1 | `36d566f` | `llm-pitfalls.md` + `pedagogy-integration-framework.md` — חדשים ב-origin |
| 2 | `03ea678` | `diagnostic-axes-by-island.md` — תיקון "בר-און/Share" → "משה"ח תשפ"ו + Triplex Phase" |
| 3 | `5d09b11` | `architecture-mvp.md` — סנכרון v2.0 + תיקון 3 סתירות בטבלת "החלטות סגורות" |
| 4 | `4c9482a` | `literacy-grade1-2-yearly.md` — callout בסעיף 0 + תיקון "6 שלבי Share & Bar-On" |
| 5 | `266cb0b` | `spec.html` (banner DEPRECATED + 4 תיקוני TOC/H2) + `agent-bootstraps.md` (סעיף DEPRECATED) |
| 6 | `10f6a33` | קבוצה L — F.21A-spec + D.15-spec |
| 7 | `604355e` | pending-commits.md — קבוצה L נדחפה |
| 8 | (עכשיו) | `agent-bootstraps.md` — הוספת `teacher-live.html` ל-DEPRECATED + handoff חדש זה |

### ✅ זיכרון Claude עודכן
- `project-avnei-yesod-architecture-mvp` — תוקנו 2 שורות סותרות (9 מיומנויות vs 5 סטרנדים). עכשיו אומר במפורש: "5 סטרנדים = הסקופ הפדגוגי (BKT-per-strand). מיושם A.1 ב-b4c0145 ב-27.5.2026".

---

## 2. מצב המשימות (A0-D)

### ✅ נסגרו ונדחפו במלואן (4 משימות גדולות)
- **A.1** — BKT-per-strand (5 מודלים) · `b4c0145` · `bkt.js` 491→797 שורות
- **A.3** — EPA (Failure × Context × Task) · `3c063bb` · `epa.js` 261 שורות
- **A.4** — Sub-BKT פר 22 אותיות · `1582a96` · `bkt.js` 797→1030 שורות · 53/53 smoke tests
- **A0** פאזה (A0.1, A0.2, A0.3, A0.4) — כולן נדחפו לפני הסשן הזה

### 🟢 spec מוכנים, ממתינים לסוכן ביצוע (2)
- **F.21A** — מסך מורה בשפת ראמ"ה (teacher-rama.html חדש)
  - spec: `_handoff/2026-05-27-F21A-ux-spec.md` (~700 שורות)
  - 5 החלטות UX סגורות: פעימה 1=1.9.2026 · PIN cosmetic · קובץ נפרד · checkRamaTaskStatus aggregation=Min · Practice gap=Downgrade Confidence
  - תלויות שנסגרו: A.1+A.3+A.4+A0.3
- **D.15** — שכפול ל-17 אותיות באי 3
  - spec: `_handoff/2026-05-27-d15-spec.md` (~190 שורות, P0 חוסם פיילוט)
  - 4 קבוצות נושאיות: בועות (קיים) · כוכבים · צדפים · דגים
  - אומדן 12-15 שעות לסוכן ביצוע
  - **תיקון iOS Safari כלול:** intro-X-quest + intro-X-mission → intro-X (קובץ אחד)

### 🟡 קוד מוכן, ממתין לבדיקה ידנית של מיטל (1)
- **D.14** — תבנית גנרית מ-5 משחקוני אי 3
  - קבוצה J ב-pending-commits.md — **חוסם על בדיקת מיטל ב-demo**
  - 9 קבצי קוד מוכנים: `game-shell.js` + 3 mechanics + `game-shell.css` + 2 data + `stage-3-template-demo.html` + `audio.js modified`
  - 3 באגי אודיו מ-demo קודם — תוקנו ([[feedback-avnei-yesod-correct-answer-audio-pattern]])
  - **לפני push:** מיטל צריכה לבדוק 5-10 דק' — `stage-3-template-demo.html` עם shin.json + 5 משחקוני אי 3 הקיימים (לוודא בלי רגרסיה)

### ⏳ פתוחות (לא התחילו)
- **F.21A קוד** — סוכן חדש יכול להתחיל מיד (spec ב-origin)
- **D.15 קוד** — תלוי ב-D.14 שיידחף
- **A.5** Cold-start protocol · **A.6** Confidence indicators · **B.7** 5 אינטרבנציות · **C.11/12/13** Pack × BKT · **E.17/18** Event Logger + Data export
- **F.21** Specialist Flag (משימה אחרת, לא F.21A!)

---

## 3. סטטוס מסמכי-אם — כולם ב-origin

| מסמך | סטטוס | תוכן |
|---|---|---|
| `architecture-mvp.md` | ✅ ב-origin (v2.0) | 5 סטרנדים · BKT · EPA · sub-BKT · mastery משולש |
| `pedagogy-integration-framework.md` | ✅ ב-origin (v2.3) | 3 שכבות · משה"ח+SoR+Triplex · "משה"ח קובע, ראמ"ה בודקת" |
| `literacy-grade1-2-yearly.md` | ✅ ב-origin | callout מסביר "9 מיומנויות = פדגוגיה של מטח, המערכת = 5 BKT-ים" |
| `llm-pitfalls.md` | ✅ ב-origin | תיעוד 3 הטעויות (Shatil/Bar-On/18 אותיות) + ציטוטים מ-PDF |
| `diagnostic-axes-by-island.md` | ✅ ב-origin | פרמטרים פר אי + EPA · ניסוח "משה"ח תשפ"ו + Triplex Phase" |
| `spec.html` | ✅ ב-origin (עם banner) | טיוטה v1 — banner צהוב מפנה למסמכי-אם החדשים |

---

## 4. אזהרות אסור-לחזור-עליהן (קריטי לסוכן הבא)

### 3 טעויות LLM מתועדות ב-`llm-pitfalls.md`
- ❌ **Shatil & Share 2003 לא הציעו שלבים** — המאמר עוסק במנבאי קריאה (modularity hypothesis), לא בשלבים. ייחוס "3 שלבים sublexical/lexical/supralexical" למאמר הוא הזיה
- ❌ **Share & Bar-On 2018 = 3 פאזות Triplex, לא 6 שלבים** — 6 השלבים שייכים למשה"ח תשפ"ו (סינתזה של 4 מקורות: בר-און 2011 + Share & Bar-On 2018 + לוין-אמסטרדמר-קורת 1997 + Ravid 2012)
- ❌ **"18 אותיות מ-22" = רף "תקין" של ראמ"ה, לא ממוצע אמפירי**

### "9 מיומנויות" — מתי בסדר ומתי שגוי
- ✅ **בסדר:** בהקשר תיעוד פדגוגי של מטח/קסם וחברים ("המודל הפדגוגי של מטח מתאר 9 מיומנויות")
- ❌ **שגוי:** כסקופ ארכיטקטוני של המערכת ("המערכת מבוססת על 9 מיומנויות") — הסקופ הוא **5 סטרנדים BKT**

### קבצים שאסור לבסס עליהם תוכן חדש
ראה רשימה מלאה ב-`agent-bootstraps.md` סעיף "קבצים DEPRECATED". בעיקר:
- כל קבצי `sales/*.html` · `engine/*.html`
- `spec.html` · `index.html` · `README.md` · `partners-qa.html`
- `curriculum/pedagogy-master.md` · `curriculum/literacy-grade1-2-yearly.html`
- **`underwater-app/teacher-live.html`** ⚠️ — קוד פעיל אבל ארכיטקטורה v1. אם סוכן מתבקש "דשבורד מורה" — חובה לקרוא F.21A-spec קודם

---

## 5. בקשה פתוחה ממיטל — ארכוב v1 (לדיון בסשן הבא)

מיטל ביקשה: *"אי אפשר להחביא את הדברים הישנים?"*

יש 3 אופציות שצריך להציג לה:
1. **ארכוב מלא** ל-`_archive/v1-legacy/` — git mv של 11 קבצי v1. סיכון: שבירת URL-ים ב-Pages.
2. **Banner DEPRECATED על כל קובץ** (כמו ב-spec.html) — לא מחביא אבל מסמן. לא דורש מעבר קבצים.
3. **עדכון בלבד של index.html + README.md** (החזית) + ארכוב הפנימיים — פיתרון מאוזן.

**ההמלצה שלי:** אופציה 3 — אבל לדבר עם מיטל לפני שמבצעים.

---

## 6. כללי עבודה לתזמורת חדשה

1. **לפני כל push:** `git fetch origin && git status` (סביבת ריבוי-סוכנים)
2. **לא לדחוף בלי אישור מפורש של מיטל**
3. **לא להחליט פדגוגית עצמאית** — בספק לשאול אותה
4. **לא לעדכן מסמכי-אם** בלי אישור פר-קובץ
5. **commit סלקטיבי בלבד** — `git add` מפורש לכל קובץ. ❌ אסור: `git add . / -A / -u / commit -a`
6. **לתעד הכל ב-handoff docs** — `agent-completion-log.md` · `meytal-pending.md` · `pending-commits.md`

### אזהרה ספציפית מהסשן הזה
**סוכן אחר עלול לדווח על "מוכן ל-push" של קבצים שכבר ב-origin** — כי הוא רץ על snapshot ישן. תמיד לאמת עם `git diff origin/main -- <files>` לפני שמאשרים push.

---

## 7. קבצים חשובים ל-quick reference

```
avnei-yesod/
├── _handoff/
│   ├── orchestrator-handoff-2026-05-27-late-evening.md   ← המסמך הזה (גובר)
│   ├── orchestrator-handoff-2026-05-27-evening.md        ← מיושן
│   ├── 2026-05-26-architecture-tasks-tracker.html        ← tracker חי
│   ├── 2026-05-25-architecture-tasks.md                  ← spec משימות
│   ├── 2026-05-26-partners-review-v3.md                  ← המסמך הפדגוגי המלא
│   ├── 2026-05-27-F21A-ux-spec.md                        ← spec מסך מורה החדש
│   ├── 2026-05-27-d15-spec.md                            ← spec שכפול 17 אותיות
│   ├── agent-bootstraps.md                                ← prompts לסוכני עבודה (עם DEPRECATED list)
│   ├── agent-completion-log.md                            ← מי עשה מה
│   ├── meytal-pending.md                                  ← משימות ידניות של מיטל
│   └── pending-commits.md                                 ← קומיטים ממתינים (J=D.14 חי, L=נדחפה)
│
├── architecture-mvp.md                                    ← מסמך-אם טכני (v2.0)
├── curriculum/
│   ├── pedagogy-integration-framework.md                  ← מסמך-אם פדגוגי (v2.3)
│   ├── literacy-grade1-2-yearly.md                        ← תוכנית שנתית (עם callout)
│   ├── llm-pitfalls.md                                    ← תיעוד 3 הטעויות
│   └── diagnostic-axes-by-island.md                       ← פרמטרים + EPA פר אי
│
├── spec.html                                              ← v1 + banner DEPRECATED
│
└── underwater-app/
    ├── teacher-live.html                                  ← דשבורד v1 (DEPRECATED לדשבורד חדש)
    ├── js/shared/
    │   ├── bkt.js          ← 1030 שורות · BKT-per-strand + sub-BKT 22 אותיות
    │   ├── epa.js          ← 261 שורות · 3 צירים
    │   ├── event-logger.js ← + EPA hook
    │   ├── mastery-check.js ← Mastery משולש
    │   └── profile-classifier.js ← A0.1
    └── scripts/
        ├── test-bkt.js          ← legacy A.1 (4 פערים)
        └── test-bkt-letters.js  ← A.4 (53 assertions, 12 בלוקים)
```

---

## 8. תמונה כללית — איפה הפרויקט עומד

**מצב טכני:** המנוע (BKT + EPA + mastery משולש + sub-BKT) **כולו ב-origin ועובד.** כל ה-API מוכן לרכיב F.21A code.

**מצב פדגוגי:** כל מסמכי-האם מסונכרנים. ההגנה מ-LLM hallucinations במקסימום (llm-pitfalls + agent-bootstraps DEPRECATED list + banner ב-spec).

**מה חוסם פיילוט (P0):**
1. D.14 — בדיקת demo של מיטל → push
2. D.15 — שכפול 17 אותיות (חוסם רף ראמ"ה 18+/22)
3. F.21A code — מסך מורה בשפת ראמ"ה (deliverable מרכזי ללקוחות)

**הצעד הבא הטבעי:** D.14 demo בדיקה (5-10 דק') → push → לשגר סוכן F.21A code במקביל לסוכן D.15 code.

---

## 9. Bootstrap prompt לסוכן תזמורת חדש

**הדבק בשיחת Claude חדשה:**

```
שיחה חדשה — סוכן תזמורת לאבני יסוד · continuity מסוכן 27.5.2026 לילה

מטרה: סוכן-תזמורת ראשי לפרויקט אבני יסוד. אני (מיטל פלג) מנהלת פיתוח.
תפקיד התזמורת = אינטגרציה ותרגום בין סוכנים, לא יוזמה פדגוגית עצמאית.

צעדים מיידיים (חובה לפני שאלות):

1. קרא את הזיכרון (נטען אוטומטית): 
   - avnei-yesod-master
   - project-avnei-yesod-architecture-mvp (תוקן 27.5.2026 לילה — 5 סטרנדים = הסקופ, לא 9 מיומנויות)
   - project-avnei-yesod-pedagogy-integration

2. קרא את ה-handoff התזמורתי החדש (קריטי — גובר על קודמים):
   avnei-yesod/_handoff/orchestrator-handoff-2026-05-27-late-evening.md
   זמן: 10-12 דקות.

3. קרא את agent-bootstraps.md (סעיף "קבצים DEPRECATED") — מציין אילו קבצי v1 לא לבסס עליהם.

4. פתח את ה-tracker ב-Pages:
   https://impact-os.app/avnei-yesod/_handoff/2026-05-26-architecture-tasks-tracker.html

מצב נוכחי (27.5.2026 לילה — סוף סשן מסיבי):
- ✅ A.1+A.3+A.4 נדחפו (BKT engine מלא: per-strand + EPA + sub-BKT פר 22 אותיות)
- ✅ 6 מסמכי-אם פדגוגיים מסונכרנים ב-origin (תוקנו טעויות "9 מיומנויות" + "6 שלבי בר-און")
- ✅ agent-bootstraps עם DEPRECATED list מלא (כולל teacher-live.html)
- ✅ F.21A-spec + D.15-spec נדחפו (10f6a33) עם כל ההחלטות סגורות
- 🟡 D.14 — קוד מוכן, חוסם על בדיקת demo של מיטל (5-10 דק')
- ⏳ F.21A code · D.15 code · המצגת למנח"י+אינקלו — ממתינים

אזהרות אסור-לחזור-עליהן:
- ❌ Shatil & Share 2003 לא הציעו שלבים (הזיה)
- ❌ Share & Bar-On 2018 = 3 פאזות Triplex, לא 6 שלבים (6 שייכים למשה"ח)
- ❌ "18 אותיות מ-22" = רף ראמ"ה, לא ממוצע אמפירי
- ❌ "9 מיומנויות" כסקופ ארכיטקטוני (זה תיעוד פדגוגי של מטח, המערכת = 5 BKT-ים פר סטרנד)

כללי עבודה:
- לא להחליט פדגוגית עצמאית
- לא לדחוף בלי אישור מפורש של מיטל
- לא לעדכן מסמכי-אם בלי אישור פר-קובץ
- לפני כל push: git fetch origin && git status
- אזהרה מהסשן הקודם: סוכן אחר עלול לדווח "מוכן ל-push" של קבצים שכבר ב-origin (snapshot ישן). תמיד לאמת עם git diff origin/main -- <files>.

יש בקשה פתוחה ממיטל — ארכוב v1 (סעיף 5 ב-handoff). 3 אופציות, ההמלצה: אופציה 3 (מעודכן index/README + ארכוב פנימיים).

עכשיו אני (מיטל) על המסך — חכה לשאלה ממני.
```

---

## 10. log שינויים במסמך זה

| תאריך | מה השתנה | על-ידי |
|---|---|---|
| 27.5.2026 לילה | יצירה (מחליף את handoff מ-27.5 ערב) | סוכן-תזמורת (Claude Opus 4.7 · סשן ארוך של תיקוני "9→5") |

*— סוף מסמך התזמורת. עדכן בכל שינוי מהותי.*
