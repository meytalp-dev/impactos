# Agent Completion Log — אבני יסוד

> **מטרת הקובץ:** מעקב מי עבד על איזו משימה, מה נמסר, ומה השאלות הפתוחות.
> כל סוכן שמסיים משימה — מוסיף בלוק חדש בראש הקובץ (החדש ביותר למעלה).
>
> **פורמט:** ראה תבנית בתחתית הקובץ.

---

## F.21A-spec — wireframe + UX spec למסך מורה בשפת ראמ"ה (שלב א' — לפני קוד)

**סטטוס:** ✅ הסתיים · מסמך spec יחיד · ממתין לאישור push
**תאריך:** 2026-05-27 ערב
**שיחה:** Claude Code (Opus 4.7 · VS Code · ort-presentation-builder)
**Commit:** טרם נדחף
**יחס למשימת-אם F.21A:** מיטל בחרה לפצל — `F.21A-spec ✅` (זה) נוסף ל-tracker כשורה נפרדת, ו-`F.21A` נשארת פתוחה לסוכן קוד בשלב ב'.

**מה נעשה:**
מסמך wireframe + UX spec מלא של F.21A — המסך החדש שמציג את הכיתה דרך עדשת **משרד החינוך + ראמ"ה** (10 משימות × 3 פעימות) במקום עדשת "המשחקונים של אבני יסוד". המסמך יחסום את שלב הקוד כך שסוכן הקוד יוכל לפעול מתוך החלטות סגורות בלבד.

**5 ההחלטות שנסגרו עם מיטל (לפני כתיבת ה-spec):**

| # | החלטה | תשובה | מי המליצה |
|---|---|---|---|
| 1 | מבנה תצוגה ראשי | **טבלה** (תלמידות × משימות, צבע פר תא) | מיטל ביקשה דעה → סוכן המליץ טבלה (5 נימוקים: יחיד שעונה ל-2 השאלות הקריטיות תוך 5 שניות · שפה מוכרת · drill-down דו-כיווני · רטרו-פיט עם סקציה 6 · פעימה כצבע-רקע) |
| 2 | View ראשי בכניסה | **שני כפתורים שווי-משקל** `[מבט כיתה]` + `[מבט תלמידה]` | מיטל |
| 3 | רמת פירוט פר תלמידה | **הכל + Confidence indicators (✅🟡⚫)** — 5 strands + 22 letters + EPA + 10 RAMA + per-task confidence | מיטל |
| 4 | תצוגת פעימה | **שניהם** — Daily mode + Snapshot mode (toggle/tabs) | מיטל |
| 5 | פרטיות תלמידים | **URL נפרד (`teacher-rama.html`) + PIN ב-sessionStorage** | מיטל ביקשה דעה → סוכן המליץ אופציה 1 (נימוק: 2 התקנים פיזיים נפרדים בכיתה אמיתית, "שער נפילה" מספיק ל-MVP, roadmap לתוקן חתום בשלב ב') |

**מבנה ה-spec (12 סקציות + 2 נספחים):**

| § | סקציה | תוכן |
|---|---|---|
| 1 | הקשר | איזה מסך מחליף (סקציה 6 ב-teacher-live כ"תצוגת בדיקה למפתחים") · קהל יעד · עקרון 5 שניות |
| 2 | 5 החלטות שנסגרו | טבלה מסכמת + נימוקים |
| 3 | Wireframe ראשי | 4 mockups בASCII: Class View · Student View · Pulse Snapshot · Privacy Gate |
| 4 | זרימות "מה קורה כש..." | 7 use cases (בוקר רגיל · drill לתלמידה · דגל אוטומטי · סוף פעימה · cold-start · parent view · תלמידה לא תורגלה) |
| 5 | מיפוי data → UI | טבלה מלאה: כל אלמנט במסך → פונקציית API שמזינה אותו · **מציין פונקציה חדשה שדרושה:** `AvneiMasteryCheck.checkRamaTaskStatus(studentId, ramaTaskId)` |
| 6 | Privacy Implementation | חתימת PIN gate · אילו edge cases מטופלים · מה לא בונים (שלב ב') |
| 7 | Confidence Indicators | אלגוריתם הסיווג: <10 → ⚫ · <30 → 🟡 · >7 ימים → 🟡 · רגרלי → ✅ |
| 8 | Pulse Toggle | חוקי מעבר Daily↔Snapshot + טווחי תאריכי הפעימות + פתרון מוצע ל-replay (לא snapshot file) |
| 9 | מה משאירים לקוד | החלטות עיצוביות שסוכן הקוד יוכל לפתור בעצמו + 5 שאלות פדגוגיות שדורשות שיחה עם מיטל לפני קוד |
| 10 | Open Items שדורשים אישור מיטל | 5 פריטים לפני שסוכן הקוד מתחיל (תחילת פעימה 1 · PIN default · F.21A inline vs קובץ נפרד · ...) |
| 11 | תוצרי המשך (לא בסקופ) | F.21B (Parent view) · F.21C (Inspector view) · E.18 · F.21D · B.10 |
| 12 | Acceptance Criteria | 12 קריטריונים שסוכן הקוד צריך לעבור |
| נספח A | מיפוי משימה ראמ"ה ↔ איים | טבלה מלאה: 10 משימות → איים מאבני יסוד + רפים |
| נספח B | ASCII mockup לבדיקה ידנית | 1 תלמידה, פעימה 1 פעילה — לבדיקת קריאות |

**החלטות אסטרטגיות מתועדות (לא רק decisions):**

- **F.21A הוא קובץ חדש (`teacher-rama.html`)**, לא inline-replace של סקציה 6 ב-teacher-live (סעיף 10.5 ב-spec). הסיבה: מאפשר A/B testing עם מורות, לא מערבב "תצוגת בדיקה" עם המסך הסופי, ופותר את חלק הפרטיות (URL נפרד מ-teacher-live).
- **`checkRamaTaskStatus` היא פונקציה חדשה שלא קיימת היום.** היא הכרחית כי `AvneiMasteryCheck.checkMastery` עובד per-island אבל F.21A דורש per-RAMA-task (1 משימה → 1+ איים). מיקום מוצע: הרחבה של `mastery-check.js` הקיים. **חתימה מלאה מתועדת בסעיף 5 של ה-spec.**
- **Snapshot mode = Replay של state.events** (לא snapshot file). יקר אבל מדויק. אם איטי בפיילוט — להחליף ל-snapshot file בפיילוט הבא.
- **Confidence indicator הוא מינימום על-פני 5 סטרנדים** — אם סטרנד אחד ⚫, הסימן הכללי 🟡 (לא ✅).

**תלויות שכבר סגורות (כל ה-API מוכן):**

| תלות | סטטוס | API נצרך ב-F.21A |
|---|---|---|
| A.1 — BKT-per-strand | ✅ נדחפה 27.5 (`b4c0145`) | `AvneiBKT.getStudentStrands(studentId)` · `getStrandState` · `checkStrandMastery` |
| A.3 — EPA module | ✅ נדחפה 27.5 (`3c063bb`) | `AvneiEPA.getDominantPattern(studentId, islandId?, threshold?)` |
| A.4 — Sub-BKT 22 אותיות | ✅ הסתיים 27.5 ערב (ממתין ל-push, `1582a96`) | `AvneiBKT.getLetterState(studentId, letter)` · `getLetterMasteryDistribution(studentId)` |
| A0.3 — Mastery משולש | ✅ נדחפה 27.5 (`299f9b4` · `666acca`) | `AvneiMasteryCheck.checkMastery(studentId, islandId)` כבסיס ל-`checkRamaTaskStatus` החדש |

**קבצים שנוצרו/שונו:**

| קובץ | שינוי |
|---|---|
| `_handoff/2026-05-27-F21A-ux-spec.md` | **חדש** · ~700 שורות · spec מלא לסוכן הקוד |
| `_handoff/2026-05-26-architecture-tasks-tracker.html` | הוספת שורת `F.21A-spec ✅` לפני שורת `F.21A` בפאזה F · עדכון "מוכן להתחיל" (F.21A-spec ✅ · F.21A ⏳) · עדכון header מ-40 ל-41 משימות |
| `_handoff/agent-completion-log.md` | בלוק חדש בראש (זה) |
| `_handoff/pending-commits.md` | בלוק חדש בראש — קבוצה L |

**קבצים שלא נגעתי בהם (לפי כללי ריבוי-סוכנים):**
- `teacher-live.html` — לא משנים עד שלב הקוד (F.21A יחיה כקובץ חדש `teacher-rama.html`, לפי החלטה 5 ב-spec)
- `mastery-check.js` — תיווסף הפונקציה `checkRamaTaskStatus` רק בשלב הקוד, לא עכשיו
- כל קבצי js/shared/* — סוכן הקוד יקרא את ה-API כפי שתועד ב-§5

**שאלות פדגוגיות-עיצוביות — כולן נסגרו עם מיטל ב-27.5.2026 ערב:**

| # | שאלה | החלטה |
|---|---|---|
| 1 | תחילת פעימה 1 | ✅ 1.9.2026 |
| 2 | PIN ברירת מחדל | ✅ PIN cosmetic לפיילוט · מיטל תחלק ידנית למורה |
| 3 | F.21A inline או קובץ נפרד | ✅ קובץ נפרד `teacher-rama.html` (אישור על המלצת סוכן UX) |
| 4 | checkRamaTaskStatus כשמשימה נשענת על 2+ סטרנדים | ✅ **Min — החלש מנצח** (אישור על המלצת סוכן UX · קונסרבטיבי · עקבי עם Mastery המשולש · חוסם False Positives) |
| 5 | ילדה לא תורגלה 3+ ימים — מה הסטטוס? | ✅ **Downgrade של Confidence, לא של BKT.** סכמה: 0-7 ימים ✅ · 7-14 ימים 🟡 + תווית "נמדד לפני X ימים" · 14+ ימים 🟡 + אזהרה בולטת בראש Student View. (אישור על המלצת סוכן UX) |

**עדכון ל-spec בעקבות סגירת השאלות:** סעיפים §9 ו-§10 נכתבו מחדש כדי לתעד את ההחלטות סגורות עם נימוקים. סוכן הקוד יכול לפתוח את ה-spec ולקבל מסמך שלם בלי "TBD".

**מה לא בסקופ ה-spec (לזכור לעתיד):**
- Parent view (F.21B) · Inspector view (F.21C) · Export ל-PDF/Excel (E.18) · Trend graph (F.21D) · Group Suggestion Engine (B.10) · Push notifications

**בדיקה ידנית של ה-spec לפני handoff לקוד:**
לא רלוונטי — זה מסמך עיצובי, לא קוד. בדיקת איכות = קריאה של מיטל + סוכן הקוד.

**הצעת המשך:**
לאחר אישור מיטל ל-spec + פתרון 5 השאלות הפתוחות (סעיף 10) → להוציא פרומפט לסוכן קוד F.21A. הפרומפט יצביע על המסמך כקריאה חובה.

---

## A.4 — Sub-BKT פר 22 אותיות (הרחבה מ-5 ל-22 בסטרנד פונולוגיה)

**סטטוס:** ✅ הסתיים · קוד כתוב + 2 בדיקות עברו (53/53 בחדש + 0 רגרסיה בישן) · ממתין לאישור push
**תאריך:** 2026-05-27 ערב
**שיחה:** Claude Code (Opus 4.7 · VS Code · ort-presentation-builder)
**Commit:** טרם נדחף

**מה נעשה:**
`underwater-app/js/shared/bkt.js` הורחב כך ש-Sub-BKT פר-אות מכסה את כל 22 האותיות העבריות (עד עכשיו רק 5: מ/ק/ב/ר/ת — מ-5 המשחקונים הקיימים). זה אבן-בסיס ל-F.21A (מסך מורה בשפת ראמ"ה — צריך להראות חולשה פר אות) ול-D.15 (שכפול ל-17 אותיות באי 3 — כל אות צריכה sub-BKT משלה).

**אסטרטגיה — הרחבה ב-3 שכבות (state + ingest + API):**

| החלטה | תוצאה |
|---|---|
| **רשימת 22 אותיות** | קבוע חדש `ALL_HEBREW_LETTERS_22` — סדר אלפבתי קנוני, תואם בדיוק את `data/island-03-letters/_schema.md` של D.14 (אותו מקור אמת — מנע פיצול עתידי) |
| **pL0/pT/pG/pS פר אות** | אישור מיטל לפני קוד: **ברירת מחדל אחידה** (0.12 ב-strand 1, 0.10 ב-island 3 PARAMS_PER_ISLAND[3]). אין דאטה אמפירי לפיצול כרגע; הפיצול דחוי לכיול אחרי פיילוט |
| **ISLAND_3_LETTERS = 5** | נשאר במצב הקיים. mastery של "אי 3 נסגר" עדיין דורש את 5 האותיות עם משחקון פעיל. כש-D.15 ישלים את 17 המשחקונים — לעדכן ל-22 גם כאן |
| **מיגרציה non-destructive** | פונקציה `ensureAllLettersIn(perLetter, pL0)` נקראת ב-getIslandState/getStrandState/getPerLetterState/ingestIsland3Event. ילדות עם state ישן (5 אותיות) מקבלות 17 נוספות בלי לאבד נתונים קיימים |
| **Backfill strand 1 ← island 3** | פונקציה `backfillStrand1FromIsland3` — לילדות שהיו במערכת לפני A.1 (יש להן רק `avnei-bkt-v1`, לא `avnei-bkt-strand-v1`). מועתק חד-פעמי כשהן נכנסות ל-strand 1 הפעם הראשונה |
| **side-effect-free reads** | `getPerLetterState` בודק קיום ב-localStorage לפני קריאה ל-getStrandState (שיוצר state). תלמידה לא-קיימת → null, לא state ריק |

**API חדש שנחשף:**

```js
AvneiBKT.getLetterState(studentId, letter)
  // → {letter, pKnown, attempts, correct, wrong, accuracy, median_response_time_ms, mastered, masteryAchievedAt}
  // → null אם האות לא ב-22 או אם אין דאטה לתלמידה

AvneiBKT.getWeakestLetters(studentId, n=3, opts={includeUntouched: false})
  // → [{letter, pKnown, attempts, accuracy}, ...]  ממוין pKnown עולה (החלש ראשון)
  // ברירת מחדל: רק אותיות תורגלו (attempts ≥ 3) ושלא נשלטו
  // {includeUntouched: true} → כולל אותיות לא-תורגלו (לדשבורד F.21A "מה לא נגעו בו עדיין")

AvneiBKT.getLetterMasteryDistribution(studentId)
  // → {mastered, in_progress, weak, untouched, by_bucket: {...}, total: 22}
  // לכל דלי גם רשימת האותיות. סך הקבוצות = 22 תמיד.
  // הגדרות:
  //   mastered:    masteryAchievedAt !== null
  //   in_progress: attempts ≥ 3 AND pKnown ≥ 0.70 AND לא mastered
  //   weak:        attempts ≥ 3 AND pKnown < 0.70
  //   untouched:   attempts < 3

AvneiBKT.ALL_HEBREW_LETTERS_22              // קבוע — סדר א..ת
AvneiBKT.LETTER_WEAK_THRESHOLD              // 0.70
AvneiBKT.LETTER_MIN_ATTEMPTS_FOR_BUCKET     // 3 (תואם getWeakLettersIn3 הקיים)
```

**קבצים שנוצרו/שונו:**

| קובץ | שינוי |
|---|---|
| `underwater-app/js/shared/bkt.js` | הרחבה — נוספו `ALL_HEBREW_LETTERS_22`, `LETTER_WEAK_THRESHOLD`, `LETTER_MIN_ATTEMPTS_FOR_BUCKET`, `ensureAllLettersIn`, `backfillStrand1FromIsland3`, `getLetterState`, `getWeakestLetters`, `getLetterMasteryDistribution`. שונה: `emptyIsland3Record` (22), `emptyStrandRecord` strand 1 (22), `getIslandState`/`getStrandState`/`getPerLetterState` (מיגרציה+backfill), `ingestIsland3Event` (קבל את 22), `setInitialState` (aggregate על האותיות שהוזנו) |
| `underwater-app/scripts/test-bkt-letters.js` | חדש · 12 בלוקי-בדיקה · 53 assertions · 12 תרחישים (אתחול 22, ingest על אות חדשה, getWeakest ברירת-מחדל+includeUntouched, distribution, validation, backwards compat A0.1+checkMastery, מיגרציה non-destructive, dual-write) |
| `_handoff/2026-05-26-architecture-tasks-tracker.html` | A.4 ✅ + עדכון טבלת "מוכן להתחיל" |

**קבצים שלא נגעתי בהם (לפי כללי ריבוי-סוכנים):**
- `epa.js` (A.3), `event-logger.js` (A.3 הוסיף לו), `mastery-check.js` (A0.3), `profile-classifier.js` (A0.1)
- `js/templates/*`, `css/game-shell.css`, `audio.js` (D.14 רץ במקביל)
- כל stage-*.html

**בדיקות שעברו:**

1. **`scripts/test-bkt.js`** (test legacy A.1+פערים — לא נגעתי בו) — כל 4 הפערים עוברים זהים: sub-BKT פר-אות באי 3 · setInitialState · per-letter cold-start · recommendInitialTier. `Noa pre-set per letter aggregate = 52.0%` (זהה לפני A.4, אחרי תיקון setInitialState aggregate שיחושב על האותיות שהוזנו במפורש, לא על כל 22).

2. **`scripts/test-bkt-letters.js`** (חדש · 53 assertions ב-12 בלוקים):
   - 22 אותיות מאותחלות נכון ב-island 3 וב-strand 1 (8/8)
   - ingestEvent על ש (אות חדשה) — לא מחזיר null, sub-BKT מתעדכן (5/5)
   - getWeakestLetters ברירת מחדל — רק תורגלו (3/3)
   - getWeakestLetters includeUntouched — כולל לא-תורגלו (2/2)
   - getLetterMasteryDistribution — 4 דליים מסתכמים ל-22 (4/4)
   - getLetterState — input validation, null על תלמידה לא-קיימת (2/2)
   - A0.1 backwards compat — Object.entries(per_letter) עוד עובד 1:1 (5/5)
   - checkMastery legacy — per_letter עם 5 ISLAND_3_LETTERS שמור (3/3)
   - מיגרציה non-destructive — state ישן עם 5 → 22, ערכים קיימים נשמרים (8/8)
   - ingestEvent על אות חדשה אחרי מיגרציה — לא דורס דאטה קיים (4/4)
   - Dual-write — שני המפתחות מתעדכנים (3/3)
   - קבועים חשופים (6/6)
   - **סיכום: 53/53 ✅**

**עקרונות עיצוב שיושמו:**
- **A0.1 + A0.3 לא נשברים.** `Object.entries(per_letter)` עם `.filter(attempts >= 3)` עובד 1:1 — A0.1 פשוט רואה 22 entries במקום 5, וה-17 הלא-תורגלות פליטרות החוצה. checkMastery עדיין משתמש ב-ISLAND_3_LETTERS=5 ל-mastery של אי 3 (A0.3 ידרוש את 5).
- **AvneiBKT.ALL_HEBREW_LETTERS_22 חשוף לציבור** — D.14's `_schema.md` משתמש בסדר זה. עתידי D.15/F.21A — לא לכתוב את 22 האותיות אלא לקרוא מהקבוע (single source of truth).
- **מיגרציה אוטומטית בכל קריאה** — `ensureAllLettersIn` רץ ב-getIslandState/getStrandState/ingestIsland3Event/getPerLetterState. אין צורך ב-script מיגרציה חיצוני.
- **Backfill חד-פעמי** — `backfillStrand1FromIsland3` רץ ב-getStrandState. ילדות לפני A.1 (יש להן רק island state) מקבלות mirror ל-strand 1 בקריאה הראשונה.
- **getPerLetterState נעדף strand 1 על island 3** (אחרי backfill) — strand 1 הוא המקור-אמת החדש (A.1).
- **side-effect-free reads** — getLetterState/getWeakestLetters/getLetterMasteryDistribution לא יוצרים state חדש לתלמידה לא-קיימת. מחזירים null/dist ריק.

**שאלות פדגוגיות + מענה ממיטל (לפני קוד):**

1. ❓ pL0/pT/pG/pS פר אות — האם שונים מ-strand 1 default? → ✅ **ברירת מחדל אחידה**. אין דאטה אמפירי לפיצול. אחרי פיילוט נכייל לפי דאטה אמיתי.
2. ❓ getWeakestLetters — האם לכלול אותיות שלא תורגלו עדיין? → ✅ **flag opt-in**. ברירת מחדל = רק `attempts ≥ 3` (תואם partners-review §6). `{includeUntouched: true}` למי שצריך — F.21A או D.15 עשויים להשתמש.
3. ❓ Smoke test — קובץ קבוע או אינליין? → ✅ **קובץ קבוע `scripts/test-bkt-letters.js` + git**. נדרש לרגרסיה ב-22 אותיות + לעתיד (D.15, F.21A, פיילוט).

**שאלות שלא נשאלו ונסגרו פנימית (כי לא קריטיות פדגוגית):**
- ספי mastery distribution (`LETTER_WEAK_THRESHOLD=0.70`, `LETTER_MIN_ATTEMPTS_FOR_BUCKET=3`) — תואם `getWeakLettersIn3` הקיים מ-A.1 (לפני שינוי). שמרני.
- Backfill — לא נשאל אם זה רצוי, אבל אחרת ילדות עם state לפני A.1 לא יראו את הדאטה ב-API החדש. בחירה טכנית, לא פדגוגית.
- `setInitialState` — תוקן: aggregate מחושב על האותיות שהוזנו במפורש (`updatedLetters`), לא על כל 22. שמרני — Noa aggregate נשאר 52% כמו לפני A.4.

**מה זה פתח להמשך:**
- ✅ **F.21A** (מסך מורה בשפת ראמ"ה) — עכשיו יכול לקרוא `getLetterMasteryDistribution(student)` כדי להציג "X ילדות שולטות 18+/22" + `getWeakestLetters` לתת רשימה למורה. תיאום עם A.1+A.3 — שלושתם פתוחים.
- ✅ **D.15** (שכפול ל-17 אותיות באי 3) — כל אות חדשה כבר תקבל sub-BKT אוטומטית (ingestEvent יזהה את האות, ensureAllLettersIn יוודא קיום). D.14 חתם את ה-template, A.4 חתם את ה-tracking — D.15 יכולה להתחיל.
- ✅ **E.19** (calibration) — getLetterMasteryDistribution.by_bucket.mastered.length מעניק עוגן ל"מבדק ראמ"ה משימה 1 — האם 18+/22 ילדות שולטות?"

**ממתין ממיטל (בעדיפות):**
1. **אישור push** של bkt.js + scripts/test-bkt-letters.js + tracker.html.
2. **בדיקה ידנית (אופציונלי):** map.html → picker → תלמידה אמיתית → DevTools console:
   ```js
   AvneiBKT.getLetterMasteryDistribution(localStorage.getItem('avnei-yesod-current-student'))
   // צפוי: {mastered: 5 (אם סגרו את אי 3), in_progress: 0, weak: 0, untouched: 17, total: 22}
   AvneiBKT.getWeakestLetters(localStorage.getItem('avnei-yesod-current-student'), 5)
   // צפוי: רשימה ריקה אם כל 5 השליטו, או מצביעות לחלשות
   AvneiBKT.getLetterState(localStorage.getItem('avnei-yesod-current-student'), 'מ')
   // צפוי: {letter: 'מ', pKnown: ~1.00, attempts: ~10, mastered: true, ...}
   ```
3. **אם נמצא קונפליקט עם D.14 או A.3 בדחיפה:** `git fetch origin` לפני push — D.14 עוד לא נדחף, A.3 כן.

**הערה אופרציונלית:** הסוכן השני שעובד על D.14 (תבנית גנרית) — לא נגעתי ב-`js/templates/*`, `css/game-shell.css`, או `audio.js`. הסכמה של D.14 (`_schema.md`) משתמשת באותה רשימת 22 אותיות — אם D.14 דוחף ראשון, רשימת ALL_HEBREW_LETTERS_22 שלי תואמת לחלוטין.

---

## D.14 — חילוץ תבנית גנרית מ-5 משחקוני אי 3

**סטטוס:** 🟡 קוד מוכן · ממתין לבדיקה ידנית ב-demo + אישור push
**תאריך:** 2026-05-27
**שיחה:** Claude Code (Opus 4.7 · VS Code · ort-presentation-builder)
**Commit:** טרם נדחף

**אסטרטגיה מאושרת ע"י מיטל לפני שכתבתי קוד (4 החלטות):**
1. ארכיטקטורה = **"בסיס משותף + 3 plug-ins"** — game-shell.js נושא overlay+top-bar+noni+audio+completion+mastery hook; כל ז'אנר משחקון נשאר קובץ נפרד אבל קטן יותר
2. פלט = **קובץ HTML פר אות** (לא URL פרמטרי)
3. אסטים = **תבנית גנרית + slot ל-hero PNG אופציונלי** (לא חוסם D.15 על אסטים)
4. דאטה = **קובץ JSON פר אות** ב-`data/island-03-letters/<letter>.json`

**3 הז'אנרים שזוהו ב-5 המשחקונים הקיימים:**

| ז'אנר | משחקונים מקור | מאפיין |
|---|---|---|
| **quest** (5-stage polymorphic) | shell (מ) · house (ב) | 5 שלבים שונים מ-`js/activities/*` |
| **pick** (round-based) | rescue (ק) | 5 סיבובים × 4 פודים, 1 נכון פר סיבוב |
| **tap-all** (single-screen) | trail-resh (ר) · storm (ת) | 12 אריחים, 5 מטרות, סדר חופשי |

**קבצים שנוצרו (8 חדשים):**
- `underwater-app/js/templates/game-shell.js` — shell משותף (217 שורות) · API: `AvneiGameShell.start(config)`
- `underwater-app/js/templates/mechanic-tap-all.js` — plug-in מ-storm/trail (184 שורות) · רושם תחת `window.AvneiMechanics['tap-all']`
- `underwater-app/js/templates/mechanic-pick.js` — plug-in מ-rescue (172 שורות) · `window.AvneiMechanics['pick']`
- `underwater-app/js/templates/mechanic-quest.js` — plug-in מ-shell/house (171 שורות) · משתמש ב-`js/activities/*` הקיימים
- `underwater-app/css/game-shell.css` — סגנונות משותפים (243 שורות) · `.unit-counter`, `.shell-slots`, `.tap-tile`, `.pick-pod`, confetti, kisses
- `underwater-app/data/island-03-letters/_schema.md` — סכמת הדאטה פר אות + מיפוי 22 letter-keys
- `underwater-app/data/island-03-letters/shin.json` — קובץ demo (אות ש) להוכחת מקצה לקצה
- `underwater-app/stage-3-template-demo.html` — HTML demo שטוען את shin.json ומריץ את התבנית

**קבצים שנוגעים (1 קיים):**
- `underwater-app/js/shared/audio.js` — הרחבת `LETTER_TO_SOUND_FILE` מ-5 ל-22 אותיות (תוספת בלבד, לא משבר את 5 המשחקונים הקיימים — כל `sound-X.mp3` כבר קיים ב-AvriNeural)

**קבצים שלא נגעתי בהם (לפי כללי ריבוי-סוכנים):**
- `bkt.js`, `epa.js`, `event-logger.js`, `mastery-check.js`, `profile-classifier.js` — שייכים ל-A.1/A.3 שרצים במקביל
- 5 קבצי HTML המשחקונים הקיימים (shell/rescue/house/trail-resh/storm) — נשארים כלשונם, התבנית **אדיטיבית בלבד**

**עקרונות עיצוב שיושמו:**
- התבנית **לא משבשת את 5 הקיימים** — הם ממשיכים לעבוד כקודם
- 3 ה-plug-ins רושמים את עצמם ב-`window.AvneiMechanics[name]`, ה-shell בוחר לפי `config.mechanic`
- שמירה על הקונבנציות מ-23.5.2026: 5 הבעות נוני, feedback bubble מוסתר, support model 3-שלבי (visual → hint → press-here), `INTER_ROUND_DELAY_MS=2400`
- שימוש ב-`activity_type` קיימים ב-event-logger (`'storm-quest'`, `'rescue'`) כדי לא לדרוש שינוי ב-event-logger.js (קובץ אסור)
- `markQuestCompleted` כותב ל-`island3-quests:completed` כמו 5 הקיימים → stage-3-island.html יראה את המשחקון החדש אוטומטית
- `AvneiMasteryCheck.checkAndShowIslandCelebration(null, 3)` נקרא בסיום, כמו 5 הקיימים — מתחבר ל-A0.3

**שאלות פתוחות + מענה ממיטל (4 ענתה בהתחלה לפני קוד):**
1. ❓ ז'אנר אחד או יותר? → ✅ **בסיס משותף + 3 plug-ins**
2. ❓ קובץ HTML פר אות, או פרמטרי? → ✅ **קובץ פר אות**
3. ❓ אסטים? → ✅ **גנרי + slot ל-hero PNG אופציונלי**
4. ❓ דאטה? → ✅ **JSON פר אות ב-`data/island-03-letters/`**

**🎯 עדכון מאוחר ב-יום (27.5.2026 ערב) — אסטרטגית D.15 הוסכמה:**
אחרי שמיטל בדקה את shin demo, ראתה מקרוב את הויזואל ("בועות"), ביקשה אודיו מלא (לא רק צליל אות), זיהתה שאם כל 17 האותיות יהיו "בועות" זה יהיה מונוטוני — דנו ב-3 חלופות (A/C-קל/C-מלא) ובחרה **Full C: 4 קבוצות נושאיות עם ויזואל שונה לכל קבוצה**:
- 🫧 בועות (ש·ל·נ·א), ⭐ כוכבים (ז·י·ו·ה), 🐚 צדפים (ס·ע·צ·ט), 🐟 דגים (ד·ג·ח·פ·כ)
- כל הויזואלים = SVG inline (לא PNG מ-ChatGPT, אז סוכן D.15 יכול לבנות לבד)
- כל האותיות החדשות = mechanic tap-all (אין צורך ב-quest/pick לאותיות חדשות)
- אומדן עבודה ל-D.15: 12-15 שעות
- ספק מלא: `_handoff/2026-05-27-d15-spec.md`
- זיכרון: [[project-avnei-yesod-d14-template-theme-decision]]

**גילויי TTS תוך כדי בדיקה (נשמרו לזיכרון):**
- 🎙️ AvriNeural קורא קמץ-קטן כ-"kal" — כותבים **כֹּל** בחולם. נשמר ב-[[feedback-tts-hebrew-niqud-pitfalls]]
- 📢 ניסוח טבעי לילדים בני 6: "ה-X עם האות Y" — לא "X-י Y" (סמיכות אקדמית)
- 🔊 ילד בן 6 לא קורא — האודיו חייב לומר את המשימה במלואה, לא רק את צליל האות

**גילוי ויזואלי (נשמר):**
- mechanic-tap-all הראשון השתמש ב-CSS grid `aspect-ratio: 1` ללא תקרת רוחב → במסך רחב 12 הכדורים נדחפו לשורה אחת. תיקון: גריד 4×3 עם `clamp(64px, 14vw, 110px)` פר תא.
- intro-speaker לא היה מעוצב כי .intro-speaker חי בקבצי per-game CSS (house-quest.css וכו') — חולץ ל-game-shell.css.

**שאלות שנותרו פתוחות ל-D.15:**
- 🟡 קבצי `finale-<letter-key>-*.mp3` אופציונליים — סוכן D.15 יחליט אם להקליט (התבנית מסתדרת עם finale-found-treasure גנרי).
- 🟡 אישור ויזואלי של "כוכבי הים" אחרי קבוצה ראשונה — חוסם המשך ל-2 הקבוצות הנותרות. רשום ב-`meytal-pending.md`.

**מה זה פתח / ממתין לפעולה:**
- ✅ D.15 יכולה להתחיל — יש לה shell + 3 mechanics + schema לעבוד מולם
- 🟡 דרוש החלטה פדגוגית פר אות לפני D.15 (איזה mechanic)
- 🟡 דרושות הקלטות AvriNeural פר אות אם רוצים intro+finale דרמטיים (אחרת התבנית סבלנית)

**בדיקת ידנית ל-demo שאני מציע למיטל לעשות (5 דק'):**
1. שרת מקומי: `cd c:/Users/meyta/Downloads/impactos/avnei-yesod/underwater-app && python -m http.server 8765`
2. פתח: `http://localhost:8765/stage-3-template-demo.html`
3. צפוי: overlay "מסע השמש" → לחצי "בוא/י נתחיל" → 12 אריחים בים (5 ש׳, 7 דיסטרקטורים) → הקש על כל ה-ש׳-ים → אנימציות → completion
4. ?reset=1 מנקה localStorage לטעימה חוזרת

---

## A.1 — BKT-per-strand (5 מודלים) · dual-write + compat layer

**סטטוס:** ✅ הסתיים · קוד כתוב + 2 בדיקות עברו · ממתין לאישור push
**תאריך:** 2026-05-27
**שיחה:** Claude Code (Opus 4.7 · VS Code · ort-presentation-builder)
**Commit:** טרם נדחף

**מה נעשה:**
`underwater-app/js/shared/bkt.js` שוכתב כך שמנוע BKT מחזיק כעת **5 BKT-ים פר ילדה** (סטרנד), בנוסף ל-state ה-per-island הקיים. API חיצוני נשמר 1:1 כדי לא לשבור את A0.1 (suggestFromBKT) ו-A0.3 (mastery-check).

**אסטרטגיה — dual-write + compat layer:**

| החלטה | תוצאה |
|---|---|
| **state פנימי** | dual-write: `avnei-bkt-v1` (legacy per-island) **+** `avnei-bkt-strand-v1` (חדש per-strand). שניהם מתעדכנים בכל `ingestEvent`. |
| **תאימות לאחור** | `getIslandState`, `checkMastery`, `getStudentState`, `setInitialState`, `recommendInitialTier`, `getWeakLettersIn3` — חוזרים בדיוק כמו לפני. A0.3 ו-A0.1 לא דורשים שינוי. |
| **per_letter ב-A0.1** | A0.1's `suggestFromBKT` קורא ישירות מ-localStorage `state[sourceId][3].per_letter` — זה ממשיך לעבוד כי `avnei-bkt-v1` נשמר חי. בנוסף, יש mirror של per_letter תחת `strand[1].per_letter` (החדש). הוסף API חדש `getPerLetterState(studentId)` שמחזיר את per_letter מ-strand 1 (עם fallback ל-island 3). |
| **דאטה קיים** | לא ניזוק — "מיטל פלג" עם 25 attempts באי 3 נשמרת ב-`avnei-bkt-v1`. ה-strand state פשוט יתחיל למלא את עצמו מ-events חדשים מכאן והלאה. |

**מיפוי `ISLAND_TO_STRAND`** (מבוסס `curriculum/knowledge-base/sources/22-islands-validated-2026-05-21.json#strands_distribution`):

| Strand | שם | איים |
|---|---|---|
| 1 | פונולוגיה (phonology) | 1, 2, 3, 4, 5, 6, 7, 8 |
| 2 | מורפולוגיה (morphology) | 9, 10, 11 |
| 3 | שפה דבורה (oral_language) | 12, 13, 14 |
| 4 | קריאה והבנה (reading_comprehension) | 15, 16, 17, 18 |
| 5 | כתיבה (writing) | 19, 20, 21, 22 |

**API חדש שנחשף:**

```js
AvneiBKT.getStrandState(studentId, strandId)       // state גולמי של סטרנד
AvneiBKT.getStudentStrands(studentId)              // כל 5 הסטרנדים של ילדה
AvneiBKT.checkStrandMastery(studentId, strandId)   // p, fluency, consolidation + per_letter ב-strand 1
AvneiBKT.getPerLetterState(studentId)              // per_letter (compat: strand 1 → fallback island 3)
AvneiBKT.STRAND_IDS                                // [1,2,3,4,5]
AvneiBKT.STRAND_NAMES                              // {1:'phonology',...}
AvneiBKT.ISLAND_TO_STRAND                          // מיפוי 22→5
AvneiBKT.PARAMS_PER_STRAND                         // pL0/pT/pG/pS פר סטרנד
AvneiBKT.FLUENCY_THRESHOLD_PER_STRAND_MS           // ספי שטף — TBD פדגוגית
AvneiBKT.STORAGE_KEY_STRAND                        // 'avnei-bkt-strand-v1'
```

**מבנה state-strand:**
```js
{
  studentId: {
    1: {                                  // strand 1 = phonology
      pKnown, attempts, correct, wrong,
      responseTimesMs, sessionsAtMastery,
      lastSessionId, masteryAchievedAt,
      per_island_attempts: { 3: 25, ... },  // לקליברציה ודיבאג
      per_letter: { 'מ': {pKnown, attempts, ...}, ... }   // רק ב-strand 1
    },
    2: { ... },  // strand 2 = morphology
    3: { ... },  // strand 3 = oral_language
    4: { ... },  // strand 4 = reading_comprehension
    5: { ... },  // strand 5 = writing
  }
}
```

**קבצים שנוצרו/שונו:**

| קובץ | שינוי |
|---|---|
| `underwater-app/js/shared/bkt.js` | שיכתוב — נוספו: `STRAND_IDS`, `STRAND_NAMES`, `ISLAND_TO_STRAND`, `PARAMS_PER_STRAND`, `FLUENCY_THRESHOLD_PER_STRAND_MS`, `STORAGE_KEY_STRAND`, `emptyStrandRecord`, `ingestStrandEvent`, `getStrandState`, `getStudentStrands`, `checkStrandMastery`, `getPerLetterState`. `ingestEvent` כותב כעת ל-2 stores. `reset` מנקה גם strand state. |
| `_handoff/2026-05-26-architecture-tasks-tracker.html` | `A.1` ✅ + הערת השלמה |

**בדיקות שעברו:**

1. **`scripts/test-bkt.js`** (test legacy שלא נגעתי בו) — כל 4 הפערים עוברים: sub-BKT פר אות באי 3 · setInitialState · per-letter cold-start · recommendInitialTier. כל הציוני pKnown זהים למצב לפני השיכתוב.
2. **Smoke test פר-strand** (אינליין דרך node) —
   - 22 איים ממופים ל-5 סטרנדים
   - ingestEvent על אי 3 → `island[3].per_letter.מ` + `strand[1].per_letter.מ` שניהם 1.0 אחרי 6 נכונים
   - ingestEvent על אי 9 → סטרנד 2 פעיל בלבד (לא 1 או 3)
   - `getPerLetterState` מחזיר את per_letter ממקור strand 1 (compat layer)
   - `localStorage` מחזיק את **שני** המפתחות אחרי events

**עקרונות עיצוב שיושמו:**
- **לא לשבור A0.1 ו-A0.3.** ה-API החיצוני נשמר 1:1. הסוכן הקודם ב-A0.3 בנה את mastery-check.js על `AvneiBKT.checkMastery(id, 3)` וקבועים `ISLAND_3_LETTERS`. כל אלה זמינים בלי שינוי.
- **לא לגעת ב-event-logger.js.** הסוכן השני (A.3 / EPA) עובד שם — שמרתי גישה minimum-touch (רק bkt.js שונה).
- **per_letter בשני המקומות** — strand 1 (חדש, קנוני) + island 3 (legacy, נשמר חי) — לקריאה ע"י A0.1 או כל קוד אחר שעדיין מצפה לסכמה הישנה.
- **ספי שטף פר-סטרנד נשמרים רכים** — לא קובע פדגוגיה בלי אישור. ערכי ברירת מחדל כתובים בקוד עם הערה "TBD פדגוגית, נשמרים רכים עד A.6 + 21A".
- **pL0 פר-סטרנד** — `phonology=0.12`, `morphology=0.10`, `oral=0.30` (שפה דבורה קיימת בכניסה), `reading=0.10`, `writing=0.08`. ניתנים לשינוי כשפדגוגית נקבעת.

**שאלות פתוחות + מענה ממיטל (לפני קוד):**
1. ❓ מה לעשות עם state קיים ב-localStorage (תלמידות עם דאטה אמיתי)? → ✅ **Dual-write.** legacy נשמר חי, חדש מצטרף בצד.
2. ❓ A0.1 קורא ישירות state[3].per_letter — איך לא לשבור? → ✅ **Compat-Layer.** mirror של per_letter תחת strand 1 + `getPerLetterState` API חדש + state[3].per_letter ממשיך לחיות.

**שאלות שלא נשאלו ונסגרו פנימית (כי לא קריטיות פדגוגית):**
- pL0 ערכים פר-סטרנד — ערכי ברירת מחדל סבירים, ניתנים לשינוי כשפדגוגית נקבעת.
- ספי שטף פר-סטרנד — `4s/6s/8s/5s/10s` — TBD פדגוגית, לא חוסם.
- האם setInitialState מעדכן גם strand state? → **לא בפאזה הזו.** רק island state. strand state יושב על pL0 ויתעדכן מ-events. אבחון פתיחה ל-strand = משימה עתידית.

**מה זה פתח להמשך:**
- ✅ **A.4** (Sub-BKT פר 22 אותיות) — אפשר להרחיב את `per_letter` ב-`strand[1]` מ-5 ל-22 אותיות בלי לגעת ב-API החיצוני.
- ✅ **A.6** (Confidence indicators) — יוכל לקרוא `getStrandState().attempts` ולהציג ✅/🟡/⚫ פר סטרנד.
- ✅ **21A** (מסך מורה בשפת ראמ"ה) — יוכל לחתוך לפי `getStudentStrands()` + `ISLAND_TO_STRAND` כדי להראות 5 BKT-ים פר ילדה.
- ✅ **E.19** (calibration) — `per_island_attempts` בתוך כל strand מאפשר קליברציה פר-אי מתוך אותו strand.

**ממתין ממיטל (בעדיפות):**
1. **אישור push** של bkt.js + tracker.html.
2. **בדיקה ידנית (אופציונלי):** map.html → picker → תלמידה → 5+ אירועים באי 3 → DevTools → `localStorage.getItem('avnei-bkt-strand-v1')` — לוודא שהדאטה זוהר נכון.
3. **אם משהו נשבר בבדיקת מיטל ב-A0.3 או A0.1:** לדווח — אני בעבירת compat וזה לא צפוי, אבל אם קרה — ניתן לחזור.

**הערה אופרציונלית:** הסוכן השני שעובד על A.3 (EPA) — לא נגעתי ב-`event-logger.js`. כשנמזג, שני הקבצים אמורים לחיות יחד בלי קונפליקט. לפני push: `git fetch origin && git status` כדי לוודא.

---

## A.3 — מודול EPA (Error Pattern Analysis · 3 צירים)

**סטטוס:** ✅ הסתיים · קוד כתוב + smoke tests עברו · ממתין לאישור push
**תאריך:** 2026-05-27
**שיחה:** Claude Code (סוכן עבודה ב-VS Code · ort-presentation-builder)
**Commit:** טרם נדחף

**קבצים שנוצרו/שונו:**
- `underwater-app/js/shared/epa.js` (חדש · 234 שורות) — `AvneiEPA` עם API מלא: `ingestEvent` · `getEPA` · `getDominantPattern` · `dump` · `reset`. localStorage key נפרד `avnei-epa-v1`. מבנה: `state[studentId][islandId][letter][axis][value] = count`.
- `underwater-app/js/shared/event-logger.js` — נוסף בלוק `if (window.AvneiEPA)` אחרי בלוק BKT (12 שורות). לא נגעתי ב-5 הדגלים האוטומטיים.
- 10 קבצי HTML — הוספת `<script src="js/shared/epa.js"></script>` לפני `event-logger.js`:
  - אי 3: `stage-3-shell.html` · `stage-3-house.html` · `stage-3-storm.html` · `stage-3-rescue.html` · `stage-3-trail-resh.html` · `stage-3.html`
  - אי 2: `stage-2-whispers.html` · `stage-2-twin-seaweeds.html` · `stage-2-fish-schools.html`
  - דשבורד: `teacher-live.html`

**עקרונות עיצוב שיושמו:**
- **ספירה תיאורית בלבד** — אין pKnown, אין Bayesian, אין מודל סטטיסטי. רק counts מצטברים על 3 צירים אורתוגונליים (orchestrator §3).
- **לא נגעתי ב-bkt.js ולא ב-5 הדגלים האוטומטיים** (אזהרת orchestrator §1) — EPA היא שכבה חדשה ונפרדת, נצרכת ע"י B.8/B.9/21A בעתיד.
- **EPA נקרא רק על is_correct=false** — הצלחה לא רושמת. שונה מ-BKT שמתעדכן על כל אירוע.
- **3 צירים** (partners-review-v3 §4ד): `failure` (Shape/Sound/Name/Direction) · `context` (isolation/initial/medial/final/font) · `task` (recognition/find/name/write).
- **גזירה מ-activity_type + override אופציונלי** (לפי החלטת מיטל) — טבלת `ACTIVITY_TO_FAILURE` ו-`ACTIVITY_TO_TASK` ברירת-מחדל; `evt.failure_type`/`evt.task_type`/`evt.letter_position` עוקפים. Context: ברירת-מחדל `isolation` כשאין `letter_position`.
- **סף "דפוס דומיננטי"** (partners-review-v3 §6, לא ערך קסם): 40% default, override 30% ל-Direction (נדיר יותר מטבעו).
- **MIN_FAILURES_FOR_PATTERN = 3** — מונע "100% Shape" על מדגם של 1; עקבי עם הסף ב-`detectAndRecordFlags`.
- **integration גנרי** — כל קריאה ל-`AvneiEPA` ב-event-logger עטופה ב-`if (window.AvneiEPA)` + `try/catch`, כך שאם הקובץ לא נטען, אין שבירה. דפוס זהה ל-AvneiBKT.

**2 ההחלטות שאישרה מיטל לפני שכתבתי קוד:**
1. ✅ **Failure derivation** — טבלת מיפוי פר activity_type + override אופציונלי. ה-event-logger לא משתנה. בעתיד פריטים יכולים להעביר `evt.failure_type` מפורש.
2. ✅ **Context source** — קורא מ-`evt.letter_position` אם קיים, ברירת-מחדל `'isolation'`. non-breaking; משחקונים נוכחיים יישארו ב-isolation עד שיוסיפו position לפריטים.

**Smoke tests (Node):**
14 בדיקות עברו —
- is_correct=true לא רושם · is_correct=false רושם · 3 הצירים מאוכלסים נכון
- override פר ציר עובד · ערך לא חוקי ב-override נופל למיפוי
- חסר target_letter/island → דילוג בטוח
- getDominantPattern: מעל הסף → מחזיר {axis, value, percent, count, total} · מתחת ל-MIN → null
- threshold override (קריאה ידנית עם threshold ספציפי) · threshold בלתי-אפשרי (1.01) → null
- Direction מובדל מ-Sound (30% sufficient) · החזק ביותר זוכה כשיש ריבוי דפוסים
- aggregation across letters עובד · reset(studentId) ו-reset() עובדים

**שאלות פתוחות + מענה ממיטל:**
1. ❓ איך לגזור Failure? → ✅ **טבלת מיפוי + override** (מומלץ)
2. ❓ Context source? → ✅ **evt.letter_position אם קיים, ברירת-מחדל isolation** (מומלץ)

**מה זה פתח להמשך:**
- ✅ **B.8** (intervention matcher) — יכול לקרוא `AvneiEPA.getDominantPattern(student, island)` כדי להחזיר את האינטרבנציה הנכונה (סקריפט מילולי) לפי דפוס הכשל.
- ✅ **B.9** (group suggester) — יכול לאסוף `dominant pattern` פר ילדה ולקבץ ילדות עם דפוס זהה לקבוצה מוצעת.
- ✅ **21A** (מסך מורה בשפת ראמ"ה) — יכול להציג "מאיה: דפוס Shape ≥40% בולט באי 3" + להמליץ אינטרבנציה מתאימה.
- 🟡 **שדה `letter_position` בפריטים** — דורש החלטה עתידית האם להעשיר את `data/island-*.json` בשדה position פר פריט. כרגע כל אירועי אי 3 נספרים כ-`isolation` (לא משקר — רוב המשחקונים באמת בבידוד), אבל פעילויות `findLetter` ב-LX מגלים אות באמצע מילה — שם יהיה רווח אמיתי כשיוסיפו position.

**שלב בדיקה ידנית (בלוק לבדיקת מיטל לפני push):**
```powershell
cd c:/Users/meyta/Downloads/impactos/avnei-yesod
python -m http.server 8765
```
1. `http://localhost:8765/underwater-app/map.html` → picker → תלמידה אמיתית → לבחור משחקון אי 3 (למשל הצדף, שמשחק על מ').
2. לטעות בכוונה 3-5 פעמים (להמתין לתמיכות עד "הקש פה").
3. ב-DevTools console:
```js
window.AvneiEPA.getEPA(localStorage.getItem('avnei-yesod-current-student'), 3)
// אמור להציג: {"מ": {failure: {Sound: N}, context: {isolation: N}, task: {recognition: N}}}
window.AvneiEPA.getDominantPattern(localStorage.getItem('avnei-yesod-current-student'), 3)
// אם N >= 3 → אמור להחזיר דפוס (Sound 100%/recognition 100%/isolation 100% — כולם 1.0)
```

**ממתין ממיטל:**
1. בדיקה ידנית קצרה ב-localhost (אופציונלי — smoke tests כבר עברו)
2. אישור push של 12 הקבצים שצוינו

---

## A0.1 — תיקון buggy של suggestFromBKT + debug panel (27.5.2026)

**סטטוס:** ✅ הסתיים · אומת end-to-end ע"י מיטל · ממתין ל-push
**תאריך:** 2026-05-27
**שיחה:** Claude Code (סוכן תזמורת ב-VS Code · ort-presentation-builder)

**בעיה שזוהתה באימות:**
- מיטל הוסיפה תלמידה ("מיטל פלג"), שיחקה 25 פריטים באי 3 (5 פריטים × 5 אותיות), p=0.9987.
- BKT engine רשם תקין (25 attempts). Event logger רשם תקין (25 events על התלמידה).
- אבל ה-onboarding-profile הציג "אין עדיין הצעה אוטומטית · מנוע BKT לא נטען".
- **שורש הבעיה:** `engine/onboarding-profile.html` לא טוען את `bkt.js` כ-script tag. רק את `profile-classifier.js` כ-ES module. `window.AvneiBKT` היה `undefined` ו-`suggestFromBKT()` יצא מיד בשורה 379.

**התיקון (אופציה B מההמלצה):**
| קובץ | שינוי |
|---|---|
| `underwater-app/js/shared/profile-classifier.js` | `suggestFromBKT()` קוראת BKT state ישירות מ-localStorage (`avnei-bkt-v1`) דרך `readJson()` — לא דורשת יותר `window.AvneiBKT` |
| `engine/onboarding-profile.html` | `buildDebugInfo()` קוראת BKT state ישירות מ-localStorage — לא דורשת `window.AvneiBKT` |

**אימות לאחר תיקון (צילום מיטל):**
- ✅ דיבאג פאנל: "אי 3 = 25 אירועי BKT · סה"כ 25 (סף: 10)"
- ✅ באנר צהוב: "המערכת אספה 25 אירועי תרגול ויכולה להציע 2 סימונים"
- ✅ ידע אותיות: "שליטה מצוינת" (5/5 אותיות מתורגלות שולטת BKT ≥ 0.70)
- ✅ קשרי אות-צליל: "שליטה מצוינת" (aggregate BKT = 1.00, 25 ניסיונות)
- ✅ באנר ירוק אישור: "החלו 2 סימונים אוטומטיים"

**הערה:** אופציה B (במקום A — להוסיף script tag ב-HTML) נבחרה כי profile-classifier הוא ES module עצמאי שאמור להיות autarki. אם בעתיד תוסיף קריאות אחרות ל-AvneiBKT מ-engine/, צריך לשקול אופציה A או C.

---

## A0.3 — קריטריון Mastery משולש (BKT + שטף + רף ראמ"ה)

**סטטוס:** ✅ הסתיים · ב-git · נבדק קצה-לקצה ע"י מיטל לפני push
**תאריך:** 2026-05-27
**שיחה:** Claude Code (סוכן תזמורת ב-VS Code · ort-presentation-builder)
**Commit:** ייכתב לאחר push

**רקע:** מיטל הקצתה את A0.3 לסוכן מקביל בשיחה אחרת. כשהסוכן ההוא התחיל לשאול הרבה שאלות פתוחות, מיטל הפסיקה אותו והעבירה את המשימה לסוכן הנוכחי שכבר היה רחוק יותר (כתב את mastery-check.js לאחר ש-4 שאלות פדגוגיות מרכזיות נסגרו).

**קבצים שנוצרו/שונו:**
- `underwater-app/js/shared/mastery-check.js` (חדש · 376 שורות) — `ISLAND_TO_RAMA` (9 איים) · `checkMastery` · `checkAndShowIslandCelebration` עם overlay + קונפטי + אודיו · `getClosedIslands` · `markIslandClosed` · אירוע `island_closed` ל-event-logger
- `underwater-app/stage-3-shell.html` — script tag + קריאה ל-checkAndShowIslandCelebration ב-showCompletion
- `underwater-app/stage-3-house.html` — אותו דבר
- `underwater-app/stage-3-storm.html` — אותו דבר
- `underwater-app/stage-3-trail-resh.html` — אותו דבר
- `underwater-app/stage-3-rescue.html` — script tag בלבד (חיבור בקובץ controller)
- `underwater-app/js/rescue-controller.js` — קריאה ל-checkAndShowIslandCelebration ב-showCompletion
- `underwater-app/teacher-live.html` — סקציה חדשה "6. אבני יסוד נסגרות" + CSS + renderMasteryStatus() + טעינה של state.js + bkt.js + event-logger.js + mastery-check.js
- `_handoff/2026-05-26-architecture-tasks-tracker.html` — A0.3 ✅

**עקרונות עיצוב שיושמו:**
- **לא להחליף את `bkt.js`** — bkt.js עדיין מתעדכן אוטומטית מאירועים ומחזיק את ה-mastery הפנימי שלו. mastery-check.js מוסיף שכבה עליונה עם רף ראמ"ה כתנאי שלישי.
- **סשן = יום** (לא session_id) — לפי החלטה פדגוגית של מיטל. מינ' 5 פריטים תקפים ביום כדי שהיום ייחשב לסשן.
- **3 התנאים מודלים בנפרד** — `conditions.bkt`, `conditions.fluency`, `conditions.rama` — לדשבורד מורה ולדיבאג.
- **אנטי-חגיגה כפולה** — `localStorage['avnei-yesod-closed-islands']` שומר פר-תלמידה.
- **JS inline-style ל-overlay** — לפי [[feedback-css-to-js-inline-fallback]].
- **`fluency_source: 'rama-derived' | 'internal'`** — שקיפות לכל סף שטף.

**4 ההחלטות הפדגוגיות שאישרה מיטל לפני שכתבתי קוד:**
1. **9 איים פעילים** — `ISLAND_TO_RAMA` מכסה איים 1-9. איים 7-9 מסומנים `rama_task: null` עד החלטה.
2. **MVP + חגיגה לילדה** — overlay מלא-מסך עם נוני רוקד + 60 חלקיקי קונפטי פסטל + אודיו + כפתור "המשך".
3. **שטף — סף פר אי, גזור מראמ"ה איפה שניתן:**
   - איים 1-3 (פעימה 1) — ראמ"ה לא נותנת זמן ⇒ ספים פנימיים: 5/4/4 שנ'
   - אי 4 (ניקוד) → רף ראמ"ה 90÷45 = **2.0שנ'**
   - אי 5 (מילים מוכרות) → 70÷20 = **3.5שנ'**
   - אי 6 (שטף) → 195÷77 = **2.5שנ'**
   - איים 7-9 → 4.0שנ' default פנימי, TBD
4. **סשן = יום (YYYY-MM-DD מקומי), עם ≥5 פריטים תקפים.** שני הימים-תקפים האחרונים חייבים שניהם להיות מתחת לסף השטף. פערי ימי לא-משחק או סשנים-לא-תקפים מותרים.

**שאלות פתוחות + מענה:**
1. ❓ MVP proxy לרף "18+/22 אותיות" באי 3 → 🟡 **מטופל זמנית.** כל 5 האותיות המתורגלות (ת,מ,ר,ב,ק) חייבות ב-p ≥ 0.85. השדה `note_for_full_22` מסביר איך לעבור לסף המוחלט כשיתווספו 22.
2. ❓ baseline לאי 2 (5+/6 פותח · 4+/6 סוגר) → 🟡 **proxy זמני:** accuracy ratio ≥ 0.83 + מינ' 12 ניסיונות. כש-`activity_variant` יבחין בין פותח/סוגר במפורש — לעבור לבדיקה ספציפית פר תת-משימה.
3. ❓ ספי שטף לאיים 7-9 → 🔴 **TBD פדגוגית.** נשמרו כ-default 4.0שנ' עד אישור מיטל.

**מה זה פתח להמשך:**
- ✅ A0.3 → 21A (מסך מורה בשפת ראמ"ה): סקציה 6 ב-teacher-live היא הבסיס למסך 21A המורחב.
- ✅ A0.3 → E.19 (calibration): אירוע `island_closed` עם BKT/fluency/rama metadata = הקלט ל-calibration מול ציוני ראמ"ה אמיתיים.

**ממתין ממיטל (בעדיפות):**
1. **בדיקת flow קצה-לקצה ב-Pages או מקומית:** map.html → picker → תלמידה אמיתית → 5+ פריטים באי 3 ביום שונה משני הימים האחרונים → teacher-live → סקציה 6 → לוודא שמופיע "קרוב" או "נסגר" בהתאם.
2. **החלטה על baseline פר אי 7-9** (TBD פדגוגית — לא חוסם MVP, רק את האיים האלה).
3. **אישור push** של כל הקבצים שצוינו.

**✅ באג צד שתוקן בקומיט הזה (נדרש ל-A0.3):**
- `underwater-app/teacher-live.html` הצהיר `const STATE_KEY = 'avnei-state-v1';` — והתנגש ב-`const STATE_KEY = 'underwater-app:v1';` שב-state.js (שנטען על-ידי A0.3). התנגשות זו גרמה ל-SyntaxError ש**עצר את כל הקוד שאחריו** → סקציה 6 הופיעה ריקה גם אחרי תיקון render(). הפתרון: הסרת ההצהרה הכפולה — הקובץ משתמש כעת ב-STATE_KEY מ-state.js. בונוס: סקציות 1-5 שהציגו "אין נתונים" גם כשיש (בגלל המפתח השגוי) עכשיו עובדות נכון.

**הפעלה לבדיקה מקומית:**
```powershell
cd c:/Users/meyta/Downloads/impactos/avnei-yesod
python -m http.server 8765
```
- http://localhost:8765/underwater-app/map.html → picker → תלמידה אמיתית → 5+ סיבובים באי 3
- http://localhost:8765/underwater-app/teacher-live.html → סקציה 6 (מטה)

---

## A0.2 — שדות `rama_task_alignment` + `peima_target` ב-schema פריט

**סטטוס:** ✅ הסתיים · ב-git · ב-origin/main
**תאריך:** 2026-05-26
**שיחה:** Claude Code (VS Code · ort-presentation-builder)
**קומיטים:**
| commit | מה |
|---|---|
| `d5d9599` | A0.2 ליבה — item-schema.js + add-rama-tagging.py + 86 פריטים תוייגו ב-7 קבצי data |
| `e00ec7d` | בונוס: חיזוק L3+L4 ב-island-03-items.json (Option D — מסיחי-מיקום) — 20 פריטים שונו |
| `98a49e2` | תיקוני פידבק מיטל — חֲלוֹם→לֶחֶם, החלפת צָב↔כֶּלֶב בין L3 ו-L4 |

**קבצים שנוצרו/שונו:**
- `underwater-app/js/shared/item-schema.js` — חדש · `RAMA_TASKS` (10 משימות) · `PEIMAS` (3) · `validateRamaTagging` · `filterByRamaTask` · `filterByPeima`
- `underwater-app/scripts/add-rama-tagging.py` — חדש · bulk tagging script ניתן להריץ מחדש בהוספת איים
- `underwater-app/scripts/harden-l3-l4-distractors.py` — חדש · 20 פריטים L3+L4 לפי Option D
- `underwater-app/data/island-01-words.json` — 15 מילים תוייגו (task=2, peima=1)
- `underwater-app/data/island-02-fish-schools.json` — 8 רנדים תוייגו (task=2, peima=1)
- `underwater-app/data/island-02-twin-seaweeds.json` — 8 רנדים תוייגו (task=2, peima=1)
- `underwater-app/data/island-03-items.json` — 50 פריטים תוייגו (task=2, peima=1) + 20 שכתובי L3/L4
- `underwater-app/data/island-03-find-letter.json` — 3 פריטים תוייגו (task=1, peima=1)
- `underwater-app/data/island-03-letter-shape.json` — 2 פריטים תוייגו (task=1, peima=1)
- `underwater-app/data/island-03-trace-paths.json` — meta-level תיוג (task=1, peima=1)
- `_handoff/2026-05-26-A0.2-rama-tagging.md` — תיעוד החלטות מיפוי
- `_handoff/2026-05-26-L3-L4-hardening.md` — תיעוד חיזוק L3+L4

**עקרונות עיצוב שיושמו:**
- `rama_task_alignment` כ-int יחיד (1-10) — single primary task, לא array
- `peima_target` כ-int יחיד (1-3) עם בדיקת עקביות מול `TASK_TO_PEIMA`
- שדות נוספים גם ב-meta של כל קובץ data (default) וגם פר-פריט (granular)
- חיזוק L3+L4 לפי Option D = מסיחי-מיקום (האות-יעד באמצע/סוף מילה, לא בהתחלה) — תואם `perplexity-island2-mechanics-2026-05-23` שאסר זוגות קוליים בשלב מוקדם

**שאלות פתוחות + מענה ממיטל:**
1. ❓ `island-03-items.json` (hear-sound-choose-image) → task 1 או 2? → ✅ נשמר כ-2 (פונולוגית, לא קריאת שם אות)
2. ❓ `trace-paths` → task 1 בלבד או גם task 9 (הכתבה)? → 🟡 נשמר כ-1, secondary לא נוסף
3. ❓ שדה משני `rama_task_alignment_secondary`? → 🟡 לא נוסף — נחכה לדשבורד 21A לבדוק אם נחוץ
4. ❓ L4 = 2 אפשרויות (50% ניחוש) → להעלות ל-4? → ✅ הועלה ל-4 עם מסיחי-מיקום
5. ❓ בחירת מסיחים: זוגות קוליים? → ❌ נדחה כי סותר אימות קיים, אומצה אפשרות D (מסיחי-מיקום)
6. ❓ חֲלוֹם / שָׁמַיִם / בַּקְבּוּק / צָב? → ✅ חֲלוֹם הוחלף ל-לֶחֶם; שאר 3 נשמרו; צָב הועבר ל-L3

**מה זה פתח / ממתין לפעולה:**
- ✅ **A0.3** (Mastery משולש) — יכול לקרוא `rama_task_alignment` כדי לבדוק רף ראמ"ה
- ✅ **21A** (מסך מורה בשפת ראמ"ה) — יכול לחתוך לפי משימה ופעימה
- ✅ **19** (calibration analytics) — דורש את השדה הזה לקורלציה פר-משימה
- 🟡 ממתין לבדיקת מיטל בכיתה אמיתית של פריטי L3+L4 המחוזקים (האם 6yo באמת תופסת את "מתחיל ב-" מול "מכיל"?)

---

## A0.1 — פרופיל אורייני (כלי המורה) + suggestFromBKT

**סטטוס:** 🟡 קוד נדחף ב-7 קומיטים · ממתין לאימות end-to-end ע"י מיטל
**תאריך:** 2026-05-26 ערב
**שיחה:** סוכן A0.1
**קומיטים:**
| commit | מה |
|---|---|
| `4b876a4` | engine/onboarding-profile.html + js/shared/profile-classifier.js — UI 3-מסכי + סיווג |
| `299216e` | suggestFromBKT — הצעה אוטומטית מ-BKT לרכיב 2 (אלפא_1/2/3) |
| `07c9af3` | underwater-app/student-picker.html + event-logger דינמי + map.html redirect |
| `d57fad4` | הסרת onboarding.html מזרימת הכניסה |
| `a5e41c8` | picker · שיפור empty-state |
| `f99161f` | classifier · חיבור אי 1 (mastery.js) לפרופיל |
| `c5cd49a` | onboarding-profile · debug panel בבאנר ההצעה |

**הזרימה הסופית:**
```
1. מורה: engine/onboarding-profile.html → הוסיפי תלמידות לכיתה
2. ילדה: map.html → picker → בוחרת את עצמה → משחקת
3. event-logger כותב לפי localStorage['avnei-yesod-current-student']
4. BKT שומר state נפרד פר תלמידה
5. מורה: engine/onboarding-profile.html → פתחי תלמידה →
   suggestFromBKT(id) → באנר צהוב 🤖 עם הצעה אישית
6. מורה מאשרת/משנה → AssessmentsStore.save עם row_overrides
```

**החלטות פדגוגיות שנסגרו:**
| החלטה | תוצאה |
|---|---|
| מי ממלא? | היברידי: מערכת מציעה לרכיב 2, מורה ידני ברכיבים 1+3 |
| מתי? | המורה מתי שרוצה — אחרי 10+ אירועי תרגול. אין אבחון מחייב בהתחלה |
| המסע הראשון בים? | הוצא מהזרימה — לא נחוץ אחרי הקלסיפיקטור החדש |
| בתיקו בסיווג? | בוחר הפרופיל הזהיר (נמוך יותר) |
| שורות שהמקור לא תיאר? | "לא תואר במפורש במקור" — לא להמציא |
| סף הצעה? | 10+ אירועים (אי 1 mastery + BKT אי 2 + BKT אי 3) |

**מיפוי alpha_1/2/3 לרכיב 2:**
- **alpha_1 (מודעות פונולוגית):** רצף הברה→פונמה לפי קולן. יש BKT אי 2 → לפי הסתברות (יכול להגיע ל"מצוינת"). אין אי 2 אבל יש אי 1 → תקרה "חלקית" (הברה בלבד)
- **alpha_2 (ידע אותיות):** יחס known/practiced ב-Sub-BKT אי 3
- **alpha_3 (קשרי אות-צליל):** BKT אי 3 aggregate
- **alpha_4 (ניצני קריאה), alpha_5 (כתיב פונטי):** אין מקור — נשאר ידני

**🚨 לא נסגר — לבדוק מחר:**

1. **אימות end-to-end:** מיטל ביקרה בכלי המורה אחרי משחק וכתבה "**לא מופיע**" (הבאנר הצהוב). debug panel נוסף ב-`c5cd49a` שיציג מצב מפורט (current-student תואם? ספירה פר אי). **לא התקבל משוב מה ה-panel הראה.** 4 תרחישים אפשריים:

   | תרחיש | סימן ב-debug panel | פתרון |
   |---|---|---|
   | תלמידה ב-picker שונה מתלמידה שפתחה בכלי | ⚠️ אדום + שמות שונים | לבחור אותה תלמידה ב-picker |
   | בחרה "אורחת" → current-student = 'local' | current-student = 'local' | לבחור תלמידה אמיתית |
   | תלמידה נכונה, אבל פחות מ-10 אירועים | ✅ ירוק, סה"כ < 10 | לשחק עוד |
   | הכל נכון, עדיין לא מופיע | ✅ ירוק, סה"כ ≥ 10 | באג אמיתי — לאבחן |

2. **mastery.js לא פר-תלמידה (פער ארכיטקטוני):** `underwater-app/js/shared/mastery.js` שומר ב-`localStorage['avnei-yesod-island1-mastery']` **גלובלית, לא פר student_id**. שני ילדים על אותו טאבלט = ערבוב דאטה ברכיב 1. דגלתי `i1_is_global: true` בתשובת `suggestFromBKT` אבל ה-UI לא משתמש בו עדיין. **תיקון ~1 שעה:** עדכון mastery.js לקבל student_id.

3. **שאר משחקונים:** לבדוק שאי 2 (twin-seaweeds, fish-schools, whispers) ומשחקוני אי 3 האחרים (rescue, house, trail, storm) כותבים ל-event-logger עם `island_id` נכון.

4. **תזכורת בדשבורד המורה:** לא נבנתה — חלק ממשימה 21A. תזכורת אוטומטית "מאיה תרגלה 14 פריטים, אפשר לעשות פרופיל".

**מה לעשות מחר (בסדר עדיפויות):**
1. **5 דק':** לפתוח map.html → picker → לבחור תלמידה (לא אורחת!) → לשחק 5+ סיבובים באי 3.
2. **2 דק':** לפתוח onboarding-profile → לפתוח אותה תלמידה → **לקרוא את ה-debug panel** ולשלוח לסוכן.
3. **לפי המצב:** אם הבאנר הצהוב הופיע + הצעה הגיונית → 🎉 A0.1 אומת. עוברים למשימה הבאה (A0.3 / 21A / picker למשחקוני אי 3 האחרים). אם לא → לפי ה-debug, לתקן את הבעיה הספציפית.

**הפעלה מקומית (אם Pages לא עלה):**
```powershell
cd c:/Users/meyta/Downloads/impactos/avnei-yesod
python -m http.server 8765
```
- http://localhost:8765/underwater-app/map.html
- http://localhost:8765/engine/onboarding-profile.html

או דרך Pages: https://impact-os.app/avnei-yesod/underwater-app/map.html

**ממתין ממיטל:** בדיקה מחר ע"פ המסלול למעלה.

---

## A0.4 — משחקון "ים השמועות" (memory-pair לעיצור-סוגר באי 2)

**סטטוס:** 🟡 קוד מוכן · ממתין לאימות מילים + push
**תאריך:** 2026-05-26
**שיחה:** Cursor (סוכן Claude)
**Commit:** טרם נדחף

**קבצים שנוצרו:**
- `underwater-app/stage-2-whispers.html` — המשחקון
- `underwater-app/css/whispers.css` — עיצוב SVG וקטורי פנימי
- `underwater-app/data/island-02-whispers.json` — 30 מילים · 5 סיומות (-ם/-ן/-ש/-ר/-ל) · 6 פר סיומת · 4 סיבובים
- `_handoff/2026-05-26-architecture-tasks-tracker.html` — A0.4 סומן ✅ + תיקון `initCheckboxes`

**עקרונות עיצוב שיושמו:**
- מנגנון: memory-pair ("ים השמועות") — לא שכפול של אצות התאומות
- ויזואל: SVG וקטורי פנימי בלבד (לא PNG מ-ChatGPT)
- מודל תמיכות: micro 3-שלבי (רעידה → רמז → "הקש פה")
- 33 קבצי MP3 חדשים נדרשים (AvriNeural בלבד) — תפקיד מיטל

**שאלות פתוחות + מענה מהאורקסטרטור:**
1. ❓ "תיש" ו"מגדל" באוצר מילים של כיתה א'? → 🟡 לאמת מול `vocab-bank.json` + Perplexity (sonar-pro) לפני MP3. חלופות אם נכשל: תיש → רעש/דובש · מגדל → חבל/כלב.
2. ❓ חיבור map.html לאי 2? → ❌ לא בסקופ A0.4. הוסף משימה F.22 ל-tracker: "דף אינדקס לאי 2 (3 משחקונים), P1/M".

**ממתין מהמתמרצת:**
- מיטל מאשרת את התשובות → סוכן מאמת מילים → push.

---

## A0.2 — שדות `rama_task_alignment` + `peima_target` ב-Schema

**סטטוס:** ✅ הסתיים · ב-git
**תאריך:** 2026-05-26
**שיחה:** Cursor (סוכן Claude)
**Commit:** `d5d9599`

**קבצים שנוצרו/שונו:**
- `underwater-app/js/shared/item-schema.js` — `RAMA_TASKS` (10) + `PEIMAS` (3) + `validateRamaTagging` + `filterByRamaTask` + `filterByPeima`
- `underwater-app/scripts/add-rama-tagging.py` — סקריפט תיוג רב-שימושי
- `_handoff/2026-05-26-A0.2-rama-tagging.md` — תיעוד החלטות מיפוי
- 7 קבצי data תויגו: `island-01-words.json` · `island-02-fish-schools.json` · `island-02-twin-seaweeds.json` · `island-03-items.json` · `island-03-find-letter.json` · `island-03-letter-shape.json` · `island-03-trace-paths.json`
- סה"כ 86 פריטים תויגו.

**שאלות פתוחות + מענה מהאורקסטרטור:**
1. ❓ `hear-sound-choose-image` תויג למשימה 2 (פונולוגית), לא 1 (אותיות). תקין? → ✅ **תקין.** ה-prompt: "באיזו תמונה שומעים את הצליל ת' בהתחלה?" — זה זיהוי צליל פותח = משימה 2 ראמ"ה. אי 3 מכיל פעילויות שתורמות גם למשימה 2 — זה יתרון.
2. ❓ `trace-paths` קיבל רק משימה 1, לא 9 (הכתבה). תקין? → ✅ **תקין.** trace-paths תורם ישירות למשימה 1 (motor memory · Bara & Gentaz 2011). תורם בעקיפין למשימה 9, אבל זה לא הכתבה אמיתית.
3. ❓ שדה משני `rama_task_alignment_secondary` — להוסיף עכשיו? → 🟡 **לחכות.** אין צרכן (משימה 21A טרם נבנית). הוסף הערה ב-`item-schema.js` ששדה זה שמור לעתיד.

**מה זה פתח:**
- ✅ A0.3 (Mastery משולש) — יכול לבדוק רף ראמ"ה פר ילדה
- ✅ 21A (מסך מורה בשפת ראמ"ה) — חיתוך לפי משימה/פעימה
- ✅ E.19 (calibration) — correlation פר משימה

---

## A0.1 — פרופיל אורייני ב-Onboarding (4 רמות, ד"ר קולן 2025)

**סטטוס:** ✅ הסתיים · ממתין לאישור push
**תאריך:** 2026-05-26
**שיחה:** Cursor (סוכן Claude)
**Commit:** טרם נדחף

**קבצים שנוצרו:**
- `engine/onboarding-profile.html` — מסך כניסה למורה
- `underwater-app/js/shared/profile-classifier.js` (354 שורות) — `classifyProfile` + `StudentsStore` + `AssessmentsStore`

**בסיס פדגוגי:**
- ציטוטים מילוליים מ-PDF רשמי של ד"ר לימור קולן (`c:/tmp/profile-oryani-1.txt`)
- 4 פרופילים: שליטה מצוינת · טובה · חלקית · פערים משמעותיים
- 3 רכיבים: כשירות תקשורתית · ידע אלפביתי · מפגש עם ספר
- 12 שורות תצפית — שורות שהמסמך לא הגדיר התנהגות = `null` (אנטי-הזיה)

**שאלות פתוחות + מענה מהאורקסטרטור:**
1. ❓ Placement מחייב vs הכוונה רכה vs דואלי? → ✅ **דואלי (אופציה 3).** המסע ההיסטורי בים נשאר לילדה (soft priors). הפרופיל האורייני = כלי למורה.
2. ❓ יחס למסע הקיים `onboarding.html`? → ✅ **מסך מקביל למורה (אופציה 3).** המסע נשאר לילדה, הפרופיל למורה — נפרדים.
3. ❓ לוגיקת classifier? → ✅ **הצעה אוטומטית + אישור מורה.** הקלסיפיקטור עזר, לא שולט.
4. ❓ מקור תלמידות? → ✅ **המורה מוסיפה בתוך המסך.** localStorage key: `avnei-yesod-students`.
5. ❓ תצוגה בדשבורד עכשיו? → ✅ **רק הכלי.** אינטגרציה לדשבורד = משימה 21A.

**מפתחות localStorage:**
- `avnei-yesod-students` — רשימת תלמידות
- `avnei-yesod-literacy-profile` — היסטוריית הערכות פר ילדה

---

## תבנית לסוכן הבא

```markdown
## [TASK_ID] — [שם המשימה]

**סטטוס:** ✅ הסתיים · ב-git  /  🟡 קוד מוכן · ממתין ל-X  /  ❌ נכשל · סיבה
**תאריך:** YYYY-MM-DD
**שיחה:** [Cursor / VS Code / API / זהות]
**Commit:** `[hash או "טרם נדחף"]`

**קבצים שנוצרו/שונו:**
- `path/to/file.js` — תיאור קצר
- ...

**עקרונות עיצוב שיושמו** (אם רלוונטי):
- ...

**שאלות פתוחות + מענה מהאורקסטרטור:**
1. ❓ [השאלה] → ✅/❌/🟡 [התשובה]
2. ...

**מה זה פתח / ממתין לפעולה:**
- ...
```

---

*כלל: בלוק חדש בראש הקובץ, לא בסוף. שנה את חוצץ ה-tracker בסיום משימה.*
