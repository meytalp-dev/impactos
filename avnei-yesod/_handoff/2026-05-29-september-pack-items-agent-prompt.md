# Handoff — סוכן 19: 40 פריטי september-2026 pack (השלמת 21 חסרים)

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש.

---

## משימה

`september-2026.json` חי ב-`engine/packs` עם **19/40 פריטים**. החסרים = 21 פריטים בקבוצת ש·ל·נ·א ("אותיות בועות"). זה חוסם פיילוט ספטמבר 2026.

**המטרה:** להגיע ל-40 פריטים מאוזנים, 10 פר tier (1-4), 2-3 פריטים פר אות פר tier — לפי הסכמה הקיימת.

## הקשר

"אבני יסוד" = מערכת תרגול אדפטיבית בעברית לכיתה א'. **Pack× BKT** = הליבת הדיפרנציאליות: לכל ילדה ניתן pack מותאם רמה (`AvneiPackBridge.getNextPackForStudent`).

ספטמבר = החודש הראשון של הפיילוט. הקבוצה התמטית = "בועות" (ש·ל·נ·א — 4 אותיות ראשונות של אי 3, ראה D.15 v2 spec).

## קבצי-מקור — חובה לקרוא לפני עבודה

1. **Pack-stub קיים:** `avnei-yesod/curriculum/packs/grade1-tashpaz/september-2026.json` — 19/40 פריטים, סכמה מלאה.
2. **Pack שני לעיון:** `avnei-yesod/curriculum/packs/grade1-tashpaz/january-2026.json` — strand-focused, דוגמה אחרת.
3. **Schema:** `avnei-yesod/curriculum/packs/_schema.md` — מבנה מאומת.
4. **Bridge API:** `avnei-yesod/underwater-app/js/shared/pack-bkt-bridge.js` (קריאה בלבד).
5. **Tests:** `avnei-yesod/underwater-app/scripts/test-pack-bridge.js` — חייב לעבור (75/75 ✓) אחרי השינוי.
6. **C.11+C.12+C.13 spec:** `avnei-yesod/_handoff/2026-05-28-C11-C12-C13-pack-bkt-spec.md` — תיעוד החלטות.
7. **Memory גלובלי:**
   - `feedback-avnei-yesod-teacher-language-simplicity` (לא רלוונטי כאן, אבל אזכור)

## מצב נוכחי

| Tier | שם | קיים | חסר | יעד |
|---|---|---|---|---|
| 1 | בסיסי | 5 (ש×2, ל, נ, א) | +5 | 10 |
| 2 | ליבה | 5 (ש×2, ל, נ, א) | +5 | 10 |
| 3 | מתקדם | 4 (ש, ל, נ, א) | +6 | 10 |
| 4 | מאסטר | 5 (ש×2, ל, נ, א) | +5 | 10 |
| **סה"כ** | | **19** | **+21** | **40** |

## החלטות ארכיטקטורה (לא לפתוח מחדש)

### 1. שמירה על איזון אותיות פר tier
ב-tier מלא (10 פריטים) → **2-3 פריטים פר אות** מ-4 האותיות (ש·ל·נ·א). לא יותר מ-3 פר אות.

### 2. mechanic + challenge פר tier (לפי הקיים)

| Tier | mechanics | challenges |
|---|---|---|
| 1 | `tap-all` | `no-distractors` |
| 2 | `tap-all` או `pick` | `1-distractor` |
| 3 | `pick` או `memory-pair` | `2-distractors` |
| 4 | `memory-pair` או `sort-by-letter` | `cross-content` (משלב אותיות מ-D.15 אחרות) |

(לוודא לפי הקיימים — אם יש סטייה, להעדיף את מה שכבר ב-tier הקיים.)

### 3. שדות חובה פר פריט

```json
{
  "item_id": "pack9-t{TIER}-{LETTER_KEY}-{NN}",   // e.g., "pack9-t2-lamed-03"
  "tier": 1-4,
  "letter": "ש"|"ל"|"נ"|"א",
  "mechanic": "tap-all"|"pick"|"memory-pair"|"sort-by-letter",
  "challenge": "no-distractors"|"1-distractor"|"2-distractors"|"cross-content",
  "letters_involved": ["ש"],   // לרוב אות אחת. ב-tier 4 cross-content — 2-3 אותיות.
  "rama_task_alignment": 1,    // ספטמבר = משימה 1 ראמ"ה
  "peima_target": 1            // ספטמבר = פעימה 1
}
```

### 4. `recommended_items_by_tier` — להוסיף בסיום
שדה לא קיים — להוסיף אחרי `tiers`:

```json
"recommended_items_by_tier": {
  "1": 10, "2": 10, "3": 10, "4": 10
}
```

## משימות (להריץ ברצף)

1. ☐ קרא את כל קבצי המקור לעיל.
2. ☐ ספור איזה ילדה איפה: לכל אות (ש·ל·נ·א), לכל tier (1-4) — כמה פריטים יש כיום וכמה צריך להוסיף.
3. ☐ הוסף 21 פריטים — מאוזן פר אות:
   - Tier 1: +5 פריטים (אות א נוסף ×1, ל ×1, נ ×1, ש ×1, +1 אחת)
   - Tier 2: +5 פריטים (אותו עיקרון)
   - Tier 3: +6 פריטים (זה Tier עם פחות פריטים — לאזן ל-2-3 פר אות)
   - Tier 4: +5 פריטים
4. ☐ הוסף `recommended_items_by_tier: {"1":10,"2":10,"3":10,"4":10}` אחרי block של `tiers`.
5. ☐ הריצי `node underwater-app/scripts/test-pack-bridge.js` — חייב **75/75 ✓**. אם יש שבר — לדבג ולא לשנות API.
6. ☐ עדכן `_meta` (אם קיים) — `items_count: 40`, `version: 1.0`, `last_updated`.
7. ☐ עדכן את ה-tracker: `avnei-yesod/_handoff/2026-05-26-architecture-tasks-tracker.html` — אם יש שורה רלוונטית לpack ספטמבר.
8. ☐ הוסף בלוק חדש בראש `_handoff/agent-completion-log.md` (פורמט בתחתית הקובץ).
9. ☐ דווחי למיטל סיכום של 21 פריטים שנוספו (פר אות פר tier) + תוצאת tests.
10. ☐ **אל תדחוף בלי אישור מפורש של מיטל.**

## Acceptance Criteria

- [ ] `september-2026.json` מכיל בדיוק 40 items (10 פר tier).
- [ ] 2-3 פריטים פר אות (ש·ל·נ·א) פר tier.
- [ ] `letters_involved` תקין (אות אחת ב-tier 1-3, 2-3 אותיות ב-tier 4 cross-content).
- [ ] `recommended_items_by_tier` קיים ושווה ל-{1:10, 2:10, 3:10, 4:10}.
- [ ] `test-pack-bridge.js` עובר 75/75 ✓.
- [ ] `_meta.items_count: 40`.
- [ ] בלוק חדש ב-`agent-completion-log.md`.

## אסור לך

- ❌ לערוך את `pack-bkt-bridge.js` או שום קובץ JS — תוכן בלבד.
- ❌ לערוך `teacher-rama.html` (סוכן אחר עליו).
- ❌ לדחוף ל-git בלי אישור.
- ❌ לחדש את הסכמה (item_id format, שדות חדשים) — לעקוב אחרי הקיים.
- ❌ להוסיף אותיות מחוץ ל-`letters_in_focus` (ש·ל·נ·א) — זה pack ספטמבר.
- ❌ להוסיף "תכונות חכמות" שלא ב-spec.

## בספק

שאלי את מיטל — היא קוראת פעיל. במיוחד אם:
- הסכמה הקיימת לא ברורה (יש items שלא מתאימים לטבלת mechanic/challenge פר tier).
- ה-test-pack-bridge.js נשבר אחרי השינוי — לא לחבר fix קוד, **לעצור ולשאול**.
