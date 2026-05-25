# קומיטים ממתינים — אבני יסוד
**נוצר:** 26.5.2026 · אחרי קומיט `bb8754a` (סגירת 5 סטרנדים)

---

## איך עוברים על המסמך

לכל קבוצה למטה — תגידי אחת מהשתיים:
- **"דחוף עכשיו"** → קלוד יוצר קומיט נפרד לקבוצה ודוחף.
- **"השאר"** → לא נוגעים. הקבצים נשארים על העץ.

קבוצות מסומנות 🔴 לא יוצעו לדחיפה. הן מחכות להחלטה ידנית פר קובץ.

**סיכום ספירה:** 11 קבצים מעודכנים + 108 קבצים לא מנוהלים. מתוכם 70 PNG של אי 3.

---

## קבוצה 1 — 🟢 אי 2 · שונית גלי הצליל (whispers)

**קבצים (3):**
- `underwater-app/data/island-02-whispers.json`
- `underwater-app/css/whispers.css`
- `underwater-app/stage-2-whispers.html`

**תיאור:** משחקון memory-pair באי 2 (5 עיצורי-סוגר continuants, 30 מילים, 4 סיבובים). אומת פדגוגית ב-26.5.2026 (חתימת מיטל פלג בקובץ הדאטה: `"אומת פדגוגית 26.5.2026 — מיטל פלג"`).

**מצב:** ✅ מוכן

**המלצתי:** push עכשיו · קומיט יחיד.

---

## קבוצה 2 — 🟢 A0.1 · onboarding profile + classifier

**קבצים (2):**
- `engine/onboarding-profile.html`
- `underwater-app/js/shared/profile-classifier.js`

**תיאור:** משימה A0.1 — מסך פרופיל אורייני בכניסה + מסווג ל-4 רמות (קולן, משה"ח 2025). תשתית למיון "באיזה אי הילדה מתחילה".

**מצב:** ✅ מוכן (לפי דירוג העדיפויות שלך).

**המלצתי:** push עכשיו · קומיט יחיד.

---

## קבוצה 3 — 🟢 אסטים PNG של אי 3 + CSS אנדרווטר

**קבצים (73):**
- 70 PNG ב-`engine/content/images/island-03/` (balon, banana, bayit, kof, mem, resh, tet ועוד — 70 אסטים)
- 3 CSS מעודכנים: `underwater-app/css/{house-quest,shell-quest,stage-3}.css`

**תיאור:** האסטים שיצרת ב-ChatGPT ועברו PIL crop+center. ה-CSS עודכן בהתאם (probably positioning של האסטים החדשים). הקבצים כבר משולבים במשחקונים החיים של אי 3 (`stage-3-house.html`, `stage-3-trail-resh.html`, `stage-3-rescue.html` וכו').

**מצב:** ✅ מוכן.

**המלצתי:** push עכשיו · קומיט יחיד גדול. (קומיט אחד הגיוני כי האסטים וה-CSS משלימים זה את זה.)

---

## קבוצה 4 — 🟢 _handoff · מסמכי תיעוד פנימי

**קבצים (7):**
- `_handoff/agent-completion-log.md` *(חדש)*
- `_handoff/agent-bootstraps.md` *(חדש)*
- `_handoff/2026-05-26-engine-tech-brief.md` *(חדש)*
- `_handoff/orchestrator-handoff-2026-05-25-evening.md` *(חדש)*
- `_handoff/2026-05-22-letters-review.md` *(חדש)*
- `_handoff/2026-05-26-architecture-tasks-tracker.html` *(מעודכן)*
- `_handoff/2026-05-26-partners-review-v3.html` *(מעודכן — תואם ל-MD שכבר נדחף ב-`bb8754a`)*

**תיאור:** מסמכי handoff/לוג/tracker. לא משפיעים על המוצר עצמו — תיעוד פנימי.

**מצב:** ✅ מוכן.

**המלצתי:** push עכשיו · קומיט יחיד. (חשוב במיוחד לדחוף את ה-v3.html כי הוא תואם את ה-MD שכבר ב-main.)

---

## קבוצה 5 — 🟡 spec/index/research/demo + טיוטות שותפים ישנות

**קבצים (16):**

*מעודכנים:*
- `README.md`
- `index.html`
- `spec.html`
- `curriculum/vocab-bank.json`

*חדשים — demo:*
- `engine/demo-day2/{index.html, student-view.html, teacher-dashboard.html, day2-state.json}`

*חדשים — research/blueprint:*
- `curriculum/blueprint/islands/{island-1-research, island-2-research, island-3-research, island-2-parameters-proposal}.md`
- `curriculum/diagnostic-axes-by-island.md`
- `curriculum/open-questions-for-experts.md`
- `docs/interventions/library-v1.md`
- `docs/interventions/library-v1-island1.md`

*חדשים — טיוטות שותפים שהוחלפו:*
- `_handoff/2026-05-25-partners-review.{md,html,pdf}`
- `_handoff/2026-05-26-partners-review-v2.{md,html}`

**תיאור:** ערבוב. ה-spec/README/index עודכנו (לא ראיתי את ה-diff). ה-research mds במסלול blueprint — תיעוד מחקרי שמלווה את הבנייה. demo-day2 = ויזואלי לדמו של היום השני (לא בטוח אם תואם את ההחלטה החדשה של 5 סטרנדים). הטיוטות הישנות של שותפים — הוחלפו ב-v3.

**מצב:** 🟡 בדיקה נדרשת. סיבות:
- ה-research mds **לא נסרקו** — ייתכן שמצטטים את "6 שלבי בר-און" השגוי.
- demo-day2/teacher-dashboard.html — ייתכן שמציג שפה ישנה (סטרנדים בלבד, בלי שכבת ראמ"ה).
- ה-`spec.html` הוא מסמך משני שעודכן — לפי ה-memory, ב"סתירה" architecture-mvp.md גובר. כדאי לוודא שהעדכון תואם.
- הטיוטות הישנות של שותפים — לארכיון או להשמטה?

**המלצתי:** push אחרי שמיטל סוקרת לפחות את:
1. `demo-day2/teacher-dashboard.html` (האם השפה תואמת 5 סטרנדים + 3 שכבות תצוגה?)
2. אחד מה-research mds (לוודא שלא מצטט "6 שלבי בר-און")
3. החלטה על הטיוטות הישנות של השותפים (להשאיר לארכיון או למחוק)

אם רוצה — אוכל לפצל את הקבוצה הזו לתת-קבוצות ולסרוק תוכן מעמיק.

---

## קבוצה 6 — 🔴 דורש בדיקה ידנית של מיטל

**אסור לדחוף בלי אישור פר קובץ. סיבות מפורטות למטה.**

### 6א — מסמכי-אם (4 קבצים)
- `architecture-mvp.md` *(מעודכן)*
- `curriculum/literacy-grade1-2-yearly.md` *(מעודכן)*
- `curriculum/llm-pitfalls.md` *(חדש)*
- `curriculum/pedagogy-integration-framework.md` *(חדש)*

**למה 🔴:** הנחיה שלך — מסמכי-אם דורשים אישור פר קובץ. גם אם השינויים נראים "קוסמטיים" — שינוי במסמך-אם משנה את מקור האמת לכל הסוכנים הבאים.

### 6ב — פאקים חודשיים שמצטטים בר-און (7 קבצים)
- `curriculum/packs/grade1-tashpaz/september.json`
- `curriculum/packs/grade1-tashpaz/october.json`
- `curriculum/packs/grade1-tashpaz/november.json`
- `curriculum/packs/grade1-tashpaz/december.json`
- `curriculum/packs/grade1-tashpaz/january.json`
- `curriculum/packs/grade1-tashpaz/february.json`
- `curriculum/packs/grade1-tashpaz/march.json`

**למה 🔴:** **כל 7 הפאקים מכילים את המילה "בר-און"** (אומת ב-grep). חלקם — ככל הנראה כולם — מצטטים את "6 שלבי בר-און" השגוי שעודכן ב-`llm-pitfalls`. דורשים תיקון לפני push.

### 6ג — Validation JSON שסומן INVALIDATED (1 קובץ)
- `curriculum/knowledge-base/sources/perplexity-shatil-share-2003-validation-2026-05-25.json` — מכיל `"_INVALIDATED": true` בשורה 2.

**למה 🔴:** הקובץ עצמו הכריז על עצמו לא-תקף. צריך החלטה: למחוק (וגם להוסיף ל-.gitignore?) או לשמור כראיה היסטורית עם הסבר.

---

## סיכום כמותי

| קבוצה | קבצים | סטטוס | המלצה |
|---|---|---|---|
| 1 — whispers | 3 | ✅ | push |
| 2 — onboarding A0.1 | 2 | ✅ | push |
| 3 — אסטי island-03 + CSS | 73 | ✅ | push |
| 4 — handoff docs | 7 | ✅ | push |
| 5 — spec/research/demo | 16 | 🟡 | בדיקה |
| 6 — מסמכי-אם + פאקים + INVALIDATED | 12 | 🔴 | ידני |
| **סה"כ** | **113** | | |

---

**ממתינה להחלטה שלך, קבוצה-קבוצה.**
