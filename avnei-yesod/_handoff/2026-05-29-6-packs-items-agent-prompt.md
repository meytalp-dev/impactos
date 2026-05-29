# Handoff — סוכן 23: 6 packs items (october → march 2026)

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש. סוכן זה ממשיך את עבודת סוכן 19 (september) ל-6 חודשים נוספים.

---

## משימה

ספטמבר 2026 (`september-2026.json`) חי עם 40 items (סוכן 19). **6 חודשים נוספים חסרים items** — רק קבצי planning (`october.json`...`march.json` בלי `-2026`).

**המטרה:** ליצור 6 קבצי pack חדשים בפורמט `{month}-2026.json` עם 40 items כל אחד (10 פר tier · 4 tiers · 2-3 פר אות).

## הקשר

ספטמבר = חוסם פיילוט (סגור). אוקטובר ואילך = **לא חוסם פיילוט ספטמבר** אבל יידרשו ב-Q4 (אוקטובר-מרץ). לעבוד מבעוד מועד = להימנע מבולמוס בסוף הפיילוט.

## קבצי-מקור — חובה לקרוא לפני עבודה

1. **Pack-stub עובד (template-by-example):** `avnei-yesod/curriculum/packs/grade1-tashpaz/september-2026.json` — 40 items · 4 tiers · structure מאומתת.
2. **Pack שני לעיון (strand-focused):** `avnei-yesod/curriculum/packs/grade1-tashpaz/january-2026.json`.
3. **Planning packs קיימים (כל 7 החודשים)** — `september.json`, `october.json`, ..., `march.json` — **מקור-האמת לתוכן פדגוגי פר חודש:**
   - `letters_of_the_week` (אילו אותיות החודש)
   - `letters_cumulative` (האותיות שהילדות כבר יודעות)
   - `niqqud_active` (תנועות פעילות החודש)
   - `strand_intensity` (איזון 5 סטרנדים)
   - `developmental_stage` (Triplex phase)
4. **Schema:** `avnei-yesod/curriculum/packs/_schema.md`.
5. **Bridge API (קריאה בלבד):** `avnei-yesod/underwater-app/js/shared/pack-bkt-bridge.js`.
6. **Test (חובה לעבור):** `avnei-yesod/underwater-app/scripts/test-pack-bridge.js` (75/75 ✓).
7. **C.11+C.12+C.13 spec:** `avnei-yesod/_handoff/2026-05-28-C11-C12-C13-pack-bkt-spec.md`.
8. **Spec של D.15 v2** (איזה משחקונים קיימים פר אות) — `avnei-yesod/_handoff/2026-05-27-d15-v2-enhancements-spec.md`.

## 6 הpacks שצריך לבנות — מדריך פר חודש

| חודש | קובץ יעד | letters_in_focus | focus_mode | מקור |
|---|---|---|---|---|
| October 2026 | `october-2026.json` | מ-`october.json` planning | letters (קבוצת כוכבים: ז·י·ו·ה) | october.json |
| November 2026 | `november-2026.json` | מ-`november.json` | letters (קבוצת צדפים: ס·ע·צ·ט) | november.json |
| December 2026 | `december-2026.json` | מ-`december.json` | strand (שווא + חיריק) | december.json |
| January 2027 | (כבר קיים — `january-2026.json`!) | — | — | **לבדוק אם זה ינואר 2026 או 2027**, ייתכן rename |
| February 2027 | `february-2027.json` | מ-`february.json` | strand (אי 9 + אי 5) | february.json |
| March 2027 | `march-2027.json` | מ-`march.json` | strand (אי 4 + 5 + 9) | march.json |

⚠️ **קריאת year confusion:** `september-2026.json` הוא לחודש ספטמבר 2026 = תחילת שנת לימודים תשפ"ז (sept 2026 → june 2027). אז:
- ספטמבר/אוקטובר/נובמבר/דצמבר → **2026**
- ינואר/פברואר/מרץ → **2027**

קובץ `january-2026.json` הקיים (סוכן 8/12) צריך **לבדוק אם נכון**. אם הוא בעצם January 2027 — לעשות rename או ליצור חדש.

## החלטות ארכיטקטורה (לפי september-2026 שעובד)

### 1. Tier סטרוקטורה זהה לכל חודש
```
Tier 1 בסיסי: 10 items · tap-all · no-distractors
Tier 2 ליבה: 10 items · tap-all/pick · with-distractor
Tier 3 מתקדם: 10 items · pick/memory-pair · with-niqud
Tier 4 מאסטר: 10 items · memory-pair/sort-by-letter · discrimination-*/mixed-letters
```

### 2. איזון אותיות
- אותיות החודש (3-4) = 2-3 items פר tier פר אות.
- אם החודש מציג אותיות סופיות (ך/ם/ן/ף/ץ) — להוסיף ל-Tier 4 cross-content.

### 3. שדות חובה פר item (אותה schema כמו september)
```json
{
  "item_id": "pack{N}-t{TIER}-{LETTER_KEY}-{NN}",
  "tier": 1-4,
  "letter": "...",
  "mechanic": "tap-all"|"pick"|"memory-pair"|"sort-by-letter",
  "challenge": "no-distractors"|"with-distractor"|"with-niqud"|"discrimination-*"|"mixed-letters",
  "letters_involved": ["..."],
  "rama_task_alignment": <1-10 לפי חודש>,
  "peima_target": <1|2|3 לפי חודש>
}
```

### 4. `rama_task_alignment` + `peima_target` פר חודש

| חודש | rama_task_alignment | peima_target |
|---|---|---|
| October 2026 | 1, 2 | 1 |
| November 2026 | 1, 2 | 1 |
| December 2026 | 2, 3 | 2 |
| January 2027 | 3, 4, 5 (MOY) | 2 |
| February 2027 | 5, 6 | 3 |
| March 2027 | 5, 6, 7, 8 | 3 |

(ערכים מ-pedagogy-integration-framework + יומן ראמ"ה. אם לא בטוח — שאל את מיטל.)

### 5. `recommended_items_by_tier: {"1":10,"2":10,"3":10,"4":10}` — חובה.

## משימות (להריץ ברצף · 1 חודש בכל פעם · אישור פר חודש ממיטל)

1. ☐ קרא את כל קבצי המקור.
2. ☐ קרא את september-2026.json במלואו — להבין את הסכמה.
3. ☐ עבד פר חודש (בסדר הזה):
   - **october-2026.json** (קבוצת כוכבים — חדש ל-D.15) — לעצור · אישור מיטל
   - **november-2026.json** (קבוצת צדפים — חדש ל-D.15) — לעצור · אישור מיטל
   - **december-2026.json** (תחילת תנועות — מורכב יותר) — לעצור · אישור מיטל
   - **בדיקת january-2026.json** (שאלת year) — לעצור · אישור מיטל
   - **february-2027.json** — לעצור · אישור מיטל
   - **march-2027.json** — לעצור · אישור מיטל
4. ☐ אחרי כל קובץ — `node underwater-app/scripts/test-pack-bridge.js` → חייב **75/75 ✓** (או יותר אם נוספו tests).
5. ☐ עדכן את ה-tracker (אם רלוונטי).
6. ☐ בלוק חדש בראש `_handoff/agent-completion-log.md`.
7. ☐ דווחי למיטל סיכום של כל 6 הקבצים שנוצרו.
8. ☐ **אל תדחפי בלי אישור מפורש של מיטל.**

## Acceptance Criteria

- [ ] 6 קבצים חדשים: `october-2026.json` · `november-2026.json` · `december-2026.json` · `february-2027.json` · `march-2027.json` (5 + בדיקה של january).
- [ ] כל קובץ — 40 items (10 פר tier).
- [ ] איזון אותיות לפי תוכנית החודש.
- [ ] `test-pack-bridge.js` 75/75 ✓ אחרי כל קובץ.
- [ ] תיעוד מלא ב-`agent-completion-log.md`.

## אסור לך

- ❌ לערוך `pack-bkt-bridge.js` או שום JS — תוכן בלבד.
- ❌ לערוך `teacher-rama.html` / `teacher-action.html` (סוכן 1).
- ❌ לערוך `september-2026.json` (סוכן 19 סגר).
- ❌ לשנות הסכמה הקיימת.
- ❌ להמציא אותיות שלא ב-planning JSONs.
- ❌ לדחוף ל-git.
- ❌ "תכונות חכמות" שלא ב-spec.

## בספק

שאלי את מיטל. במיוחד אם:
- planning JSON של חודש מסוים לא ברור.
- `rama_task_alignment` לא ברור לחודש.
- כמה אותיות סופיות להוסיף ל-Tier 4.
- ה-test נשבר אחרי שינוי — **לעצור ולשאול**, לא לחבר fix קוד.
