# Handoff — סוכן 31: אי 14 — הבנת הנשמע

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש. אי עצמאי — לא תלוי באיים אחרים. אומדן 20-25 שעות.

---

## משימה

לבנות **אי 14 — הבנת הנשמע** באבני יסוד. שלב פדגוגי חשוב שאינו תלוי בקריאה: ילדה מקשיבה לטקסט (AvriNeural / Web Speech) ועונה על שאלות.

לדוגמה: ילדה שומעת סיפור קצר → "מי הגיבור?" / "מה קרה בסוף?"

**אומדן:** 20-25 שעות.

## הקשר פדגוגי

- **אי 14 = "הבנת הנשמע"** — strand 3 (שפה דבורה) · רכיב 1+3 משה"ח
- שלבי תוכנית הלימודים: 3→5
- **מתחבר ישירות ל-MOY משימה 3 של ראמ"ה** (הבנת טקסט מושמע) — שכבר עובד ב-`engine/moy-screener.html?task=3`!
- מאחר ש-MOY כבר בודק את זה — אי 14 הוא **התרגול**, MOY הוא **המבחן**.

**רצף מומלץ:**
1. סיפור קצר (3-4 משפטים) + 1 שאלה
2. סיפור בינוני (5-7 משפטים) + 2-3 שאלות
3. סיפור עם פרטים (8-10 משפטים) + שאלת היסק

## קבצי-מקור — חובה לקרוא לפני עבודה

1. **Pedagogy:** `curriculum/pedagogy-integration-framework.md` §5 (line 158)
2. **MOY-Lite למשען:** `engine/moy-screener.html` + `engine/moy-items.json` task_3 (30 passages קיימים — אותו מבנה!)
3. **MOY spec:** `_handoff/2026-05-28-MOY-diagnostic-spec.md` — מבנה item
4. **Architecture:** `architecture-mvp.md`
5. **Skill Units:** `js/shared/skill-units.js` — `oral-skill` type ממתין ל-adapter
6. **Memory:**
   - `project-moy-lite-item-structure` — מבנה 1 passage × 1 question
   - `reference-hebrew-niqud-rules` — ניקוד מלא ל-passages

## מה לבנות

### Phase A — Setup + Adapter (4h)

1. ☐ קרא קבצי המקור.
2. ☐ צור `js/shared/oral-skill-adapter.js`:
   - `getListeningItems(level)` → סיפורים + שאלות
   - `getTopWeakSkills(sid, n=3)` → איזה skills חלשים (זיהוי גיבור · רצף · היסק)
   - integration עם MOY-Lite structure
3. ☐ עדכן `skill-units.js` — חבר `oral-skill` ל-oral-skill-adapter.

### Phase B — Game Files (10h)

4. ☐ צור 3 משחקונים תחת `stage-14-*.html`:
   - `stage-14-island.html` (map · 12 quests)
   - `stage-14-listen-and-answer.html` (mechanic=listen-mcq · 4 options פר שאלה)
   - `stage-14-story-sequence.html` (mechanic=sequence · גרור משפטים בסדר נכון)
5. ☐ Data files תחת `data/island-14-listening/`:
   - `_schema.md`
   - `passages-level-1.json` (10 סיפורים קצרים + 1 שאלה כ"א)
   - `passages-level-2.json` (10 בינוניים + 2-3 שאלות כ"א)
   - `passages-level-3.json` (5 ארוכים + שאלת היסק)
6. ☐ Mechanic ב-`js/templates/`:
   - `mechanic-listen-mcq.js` (similar to MOY-screener · אבל לתרגול לא assessment)
   - `mechanic-story-sequence.js`

### Phase C — Audio Strategy (3h)

7. ☐ אודיו: AvriNeural MP3 אם קיים, אחרת Web Speech he-IL fallback (כמו ב-MOY).
8. ☐ צור `tools/generate-island-14-audio.js` (אם יש מנגנון דומה לקיים).
9. ☐ Auto-fallback ב-html אם MP3 חסר.

### Phase D — Integration + Tests (5h)

10. ☐ עדכן `map.html` להוסיף אי 14.
11. ☐ עדכן ISLAND_TO_STRAND — אי 14 → strand 3.
12. ☐ mastery-check לאי 14 — 70%+ accuracy ב-3 רמות.
13. ☐ MOY × אי 14 link — אם ילדה נכשלת ב-MOY task 3 → אי 14 ייפתח כ-intervention.
14. ☐ `scripts/test-oral-skill-adapter.js` (25+ assertions).
15. ☐ הריצי 17+ test suites.
16. ☐ בדיקה ידנית.

## Acceptance Criteria

- [ ] `oral-skill-adapter.js` + 25+ tests
- [ ] 3 משחקוני stage-14-*.html
- [ ] ≥ 25 passages ב-data (10+10+5)
- [ ] Web Speech fallback אם MP3 חסר
- [ ] ניקוד מלא ב-passages
- [ ] MOY × אי 14 integration
- [ ] 0 רגרסיות

## אסור לך

- ❌ לערוך moy-screener.html / moy-items.json (אחרי שינויי סוכן 26 — לא לגעת)
- ❌ אי 3 (22 letter games) · אי 4 · אי 5 · interventions · packs
- ❌ מסמכי-אם
- ❌ דחיפה
- ❌ להמציא passages — לבקש ממיטל או לתאם עם vocab-bank

## תיאום עם סוכנים אחרים

- סוכן 28 (E2E) — אין חפיפה (scripts/e2e/)
- סוכן 29 (אי 4) + סוכן 30 (אי 5) — לא חופף (stage-4/5 vs stage-14)

**לפני edit:** `git fetch origin && git status`.

---

*Bootstrap סוכן 31 — אי 14 בנוי = MOY task 3 לא רק בודק, גם מתרגל.*
