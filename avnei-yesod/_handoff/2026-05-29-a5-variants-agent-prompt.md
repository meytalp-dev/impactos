# Handoff — סוכן A.5 Variants (אבני יסוד · 3 משימות פתוחות)

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש. **דורש החלטות פר אות ממיטל לפני הפעלה** — יש OPEN_QUESTIONs מסומנים מפורש בbootstrap.

---

## משימה

אתה סוכן קוד שמטפל ב-3 משימות פתוחות של A.5 variants (Cold-start enhancements לאי 3 — D.15 v2 שלב C).

**הקשר:** A.5 = "ילדה חדשה" cold-start (3 ימים + 30 ניסיונות = badge "חדשה" + cohort banner). הקוד כבר ב-origin (commit `a171a74`). variants = enhancements ויזואליים פר אות כדי שאות לא תרגיש "זהה" לאחרות בקבוצה תמטית.

**עקרון:** כל variant הוא ב-JSON ב-`underwater-app/data/island-03-letters/{letter}.json` ובHTML matching. אסור לערוך מסמכי-אם או קוד JS חי. השינויים הם תוכן + 1-2 שורות HTML.

## 3 המשימות

### 1. imagePool לאות נ/ו/צ

**מצב נוכחי:** האותיות **ה ו ז י** (קבוצת כוכבים) ו-**א ל נ ש** (קבוצת בועות) ו-**ס ע צ ט** (קבוצת צדפים) משתמשות **בתמונה יחידה** (`imagePool: [...]` עם פריט אחד). זה גורם לכל אות בקבוצה להרגיש זהה.

**הפתרון (מתבנית "ח'"):** אות **ח'** (`het`) קיבלה 3 תמונות שונות בזוגות memory (חתול / חלב / חום). זה הופך כל ניסיון לזוכר את הזיווג ל-distinct.

**עכשיו:** להחיל את אותו דפוס על **נ ו צ** (3 אותיות נבחרות פר קבוצה):

| אות | קבוצה | mechanic נוכחי | imagePool יחיד נוכחי | הצעת הרחבה (דורש אישור מיטל!) |
|---|---|---|---|---|
| **נ** (`nun`) | בועות | memory-pair | [single] | OPEN_QUESTION: 3 מילים שמתחילות ב-נ מתאימות לכיתה א'? (הצעות: נֵר · נָמֵר · נַעַל) |
| **ו** (`vav`) | כוכבים | memory-pair | [single] | OPEN_QUESTION: 3 מילים שמתחילות ב-ו? (הצעות: וֶרֶד · וִילוֹן · וָוִים) |
| **צ** (`tzadi`) | צדפים | memory-pair | [single] | OPEN_QUESTION: 3 מילים שמתחילות ב-צ? (הצעות: צִפּוֹר · צַב · צַלָּחַת) |

**⚠️ OPEN_QUESTION למיטל:** האם 3 המילים שהוצעו מתאימות? צריך לעבור פדגוגית (כל מילה מנוקדת + תואמת לכיתה א' + תמונה איכותית קיימת ב-assets).

### 2. wrapping 3 אותיות נוספות ל-amateur (אחת פר קבוצה)

**מצב נוכחי:** 6 אותיות "אמנותיות" (אצל ראש sequence עם narrative): מ (shell) · ק (rescue) · ב (house) · ר (trail-resh) · ת (storm) · ד (deep-sea). אחת בכל קבוצה תמטית **כפילופ** אבל אין כיסוי מלא של "אות אמנותית פר קבוצה".

**הצעת ההרחבה:**

| קבוצה | אותיות נוכחיות | אמנותית קיימת | wrapping מוצע (אחת חדשה) |
|---|---|---|---|
| בועות | ש ל נ א | (אין — קבוצה generic בלבד) | OPEN_QUESTION: ש או א? (נדרש concept narrative) |
| כוכבים | ז י ו ה | (אין) | OPEN_QUESTION: ז עם narrative "אסיף הכוכבים בלילה"? |
| צדפים | ס ע צ ט | (אין) | OPEN_QUESTION: ע עם narrative "עין הים"? |
| דגים | ג ח פ כ + **ד (אמנותית)** | ד | ✓ קבוצה זו כבר עם אמנותית. wrap אחת נוספת? |

**⚠️ OPEN_QUESTION למיטל:** איזו אות פר קבוצה (3 קבוצות בלי אמנותית) צריכה לקבל narrative wrapping? נדרש:
- קונספט narrative (כמו "ים הדגיגים האבודים" של ד')
- ~20-30 קבצי MP3 חדשים (intro / find / word / finale) ב-AvriNeural
- 17 אנימציות SVG אסוציאטיביות (לפחות 1-2)
- כתיבת JSON + HTML matching

**אומדן:** 4-6 שעות פר אות אמנותית חדשה. **לא חוסם פיילוט** — nice-to-have.

### 3. אות נ — "יש עוד על מה לעבוד"

**⚠️ OPEN_QUESTION למיטל:** הbootstrap המקורי ציין "אות נ — יש עוד על מה לעבוד" אבל **חסר פירוט מיטל**. לא ברור מה בדיוק נדרש:

- שינוי mechanic? (כיום memory-pair)
- שינוי imagePool? (חופף עם משימה 1 לעיל)
- שינוי distractors? (כיום 8 — ש ת מ ר ב ק ל ס)
- bug שמיטל ראתה בtesting?
- enhancement פדגוגי (כמו audio נוסף לdifferentiation)?

**אין להתחיל לפני שמיטל מפרטת.** הסוכן ימתין למסר ממיטל לפני שום פעולה ב-אות נ.

## ⚠️ אסור לגעת ב

- `underwater-app/teacher-rama.html` / `teacher-action.html` / `js/shared/f21e-helpers.js` (סוכן 1 פעיל!)
- כל קוד JS חי שאינו טוען את ה-JSON של האות (`bkt.js · epa.js · interventions.js · mastery-check.js`)
- מסמכי-אם (architecture-mvp.md · pedagogy-integration-framework.md · literacy-grade1-2-yearly.md · llm-pitfalls.md)
- 5 קבצי `interventions/*.json` (סוכן 21 פדגוגי)
- 60 פריטי MOY ב-`engine/moy-items.json`
- 22 משחקוני stage-3 **אחרים** (רק 3 שאתה עובד עליהם — נ ו צ)
- ❌ **לא לעשות `git commit` או `git push`** — תזמורת תאסוף.

## מותר לעדכן

- `underwater-app/data/island-03-letters/nun.json` (imagePool הרחבה)
- `underwater-app/data/island-03-letters/vav.json` (imagePool הרחבה)
- `underwater-app/data/island-03-letters/tzadi.json` (imagePool הרחבה)
- `underwater-app/stage-3-nun.html` (if needed for imagePool wiring — בדיקה הכרחית קודם)
- `underwater-app/stage-3-vav.html` (same)
- `underwater-app/stage-3-tzadi.html` (same)
- (אם משימה 2 — אחרי החלטת מיטל) קבצים מתאימים פר אות אמנותית
- (אם משימה 3 — אחרי פירוט מיטל) קובץ JSON של נ' עם השינוי הספציפי

## חובה לקרוא קודם

1. `underwater-app/data/island-03-letters/het.json` — הdofnance של "ח" עם 3 תמונות. **תבנית ל-imagePool הרחבה.**
2. `underwater-app/data/island-03-letters/{nun,vav,tzadi}.json` — מצב נוכחי
3. `underwater-app/data/island-03-letters/_schema.md` — לוודא תקינות מבנה
4. `underwater-app/stage-3-het.html` + `stage-3-nun.html` + `stage-3-vav.html` + `stage-3-tzadi.html` — לראות איך imagePool נטען
5. (אם משימה 2) `underwater-app/data/island-03-letters/dalet.json` + `stage-3-dalet.html` — תבנית אות אמנותית קיימת
6. `assets/audio/` (לוודא איזה MP3 כבר קיימים)
7. `assets/images/` (לוודא איזה תמונות זמינות לכל מילה מוצעת)

## תהליך עבודה

### תחילה (חובה — לפני קוד)

1. **קרא את 5 הקבצים ב-"חובה לקרוא קודם".**
2. **כתוב planning doc** ב-`_handoff/2026-05-29-a5-variants-planning.md` עם:
   - מצב נוכחי פר אות (mechanic + imagePool + distractors)
   - הצעת השינוי המפורטת
   - רשימת אסטים (תמונות + audio) שצריכים להיווצר (אם בכלל)
   - אומדן שעות פר משימה
3. **שלח planning ל-מיטל בצ'אט** (אל תתחיל קוד עד שמיטל אישרה).

### אחרי אישור מיטל

4. עדכן JSONs פר אות (1 קובץ פר commit מקומי).
5. עדכן HTMLs רק אם נדרש (preferably לא — imagePool טוען מJSON).
6. הרץ test smoke ב-browser (`stage-3-{letter}.html` לכל אות).
7. תיעוד ב-`_handoff/2026-05-29-a5-variants-completion.md` עם screenshots (אם אפשרי).

## Acceptance Criteria

- [ ] planning doc ב-`_handoff/2026-05-29-a5-variants-planning.md` נכתב **לפני** קוד.
- [ ] אישור מיטל בצ'אט להחלטות (3 מילים לכל אות).
- [ ] עדכון 3 JSONs (nun · vav · tzadi) עם imagePool הרחבה (אם משימה 1 אושרה).
- [ ] משימות 2 ו-3 — **רק אם מיטל אישרה מפורש**.
- [ ] **אפס** edits בקובץ של סוכן 1 (teacher-action / f21e-helpers / pack-bkt-bridge).
- [ ] **אפס** commits בלי אישור מיטל.
- [ ] רפורט סופי: "A.5 variants — N משימות הושלמו · M ממתינות לאישור · אפס push".

## אסור

- ❌ git commit / push
- ❌ עדכון agent-completion-log.md
- ❌ עדכון tracker.html
- ❌ עריכת קוד JS חי (רק קריאה)
- ❌ עריכת קבצי האותיות **האחרות** (16/22) — רק נ · ו · צ
- ❌ להתחיל בלי planning doc + אישור מיטל
- ❌ להמציא מילים לimagePool — חייב פדגוגי (מנוקד + לכיתה א' + תמונה זמינה)

## בספק

שאלי את מיטל בכל מקרה. במיוחד:
- אם 3 המילים שהוצעו לא מתאימות (פדגוגית / תמונה לא קיימת)
- אם מצאת stage-3 שבור או mechanic לא matching (לדווח, לא לתקן בלי אישור)
- משימה 3 (אות נ' עם פרטים חסרים) — לא להתחיל!

---

*Bootstrap זה דורש 3 החלטות פדגוגיות ממיטל לפני הפעלה. **לא חוסם פיילוט ספטמבר 2026** — nice-to-have polishing.*
