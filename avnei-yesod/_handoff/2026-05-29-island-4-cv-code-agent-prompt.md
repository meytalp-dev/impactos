# Handoff — סוכן 29: אי 4 — אות-ניקוד-צליל (CV)

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש. אומדן 25-30 שעות (Phase A-D · split across 2-3 days possible).

---

## משימה

לבנות **אי 4 — אות-ניקוד-צליל (CV)** באבני יסוד. זה השלב הטבעי שאחרי אי 3 (22 אותיות): ילדה לומדת לחבר אות + ניקוד = צליל ראשון של מילה.

לדוגמה: מ + ַ (פתח) = "מַ" · ל + ֵ (צירי) = "לֵ" · ש + ֶ (סגול) = "שֶׁ"

**אומדן:** 25-30 שעות (קוד · 5-10 שעות תוכן מצידך).

## הקשר פדגוגי

לפי `curriculum/pedagogy-integration-framework.md` §5 (line 148):
- **אי 4 = "אות-ניקוד-צליל (CV)"** — strand 1 (פונולוגיה+דקודינג)
- שלב 4 בתוכנית הלימודים תשפ"ו (סינתזה של 4 מקורות)
- רכיב 2 (רכישה) של משה"ח
- מתחבר ישירות ל-MOY/EOY ראמ"ה (משימה 5: קריאת 45 צירופים מנוקדים)

**רצף ניקוד מומלץ** (לפי `vocab-bank.json`):
- חודש 1: קמץ + פתח (שניהם מבטאים /a/) — 9 שיעורים
- חודש 2: שווא — 5 שיעורים
- חודש 3: חיריק (/i/) — 12 שיעורים
- חודש 4: חולם (/o/) — TBD
- חודש 5: צירי + סגול (/e/) — TBD

## קבצי-מקור — חובה לקרוא לפני עבודה

1. **Pedagogy:** `avnei-yesod/curriculum/pedagogy-integration-framework.md` §5 (table) + §6.2 (parameters)
2. **Vocab-bank:** `avnei-yesod/curriculum/vocab-bank.json` (`books_sequence` · `complete_niqqud_sequence`)
3. **Architecture:** `avnei-yesod/architecture-mvp.md` — מבנה sub-BKT, EPA
4. **Skill Units (סוכן 1 V2):** `avnei-yesod/underwater-app/js/shared/skill-units.js` — יש 8 types · `vowel` ממתין ל-adapter (אתה תכתוב את ה-vowel adapter כחלק מהאי הזה)
5. **Reference - stage-3:** `avnei-yesod/underwater-app/stage-3-template-demo.html` — template למשחקון
6. **Existing letter games (לעיון):** `avnei-yesod/underwater-app/stage-3-shell.html` (אות מ · mechanic=tap-all)
7. **Memory:**
   - `feedback-avnei-yesod-niqud-on-student-screens` — ניקוד מלא
   - `reference-hebrew-niqud-rules` — כללי ניקוד
   - `feedback-avnei-yesod-teacher-language-simplicity` — שפה פשוטה למורה
8. **MOY items כמשען:** `avnei-yesod/engine/moy-items.json` task_4 — מציג ניקוד עם אותיות (sample mappings)

## מה לבנות (Phases)

### Phase A — Setup + Adapter (5h)

1. ☐ קרא קבצי המקור.
2. ☐ צור `avnei-yesod/underwater-app/js/shared/vowel-adapter.js`:
   - API דומה ל-`letter-targets.js`
   - `getVowels()` → ['קמץ', 'פתח', 'שווא', 'חיריק', 'חולם', 'צירי', 'סגול']
   - `getCVPairs(letter, vowel)` → "מַ" / "לֵ" / etc.
   - `getTopWeakCVs(sid, n=3)` → CV pairs חלשים
3. ☐ עדכן `js/shared/skill-units.js` — חבר את `vowel` ל-vowel-adapter (כיום delegate ל-`null`).
4. ☐ Sub-BKT extension ב-`bkt.js` (קריאה — לדבר עם מיטל לפני שינוי):
   - האם לעשות sub-BKT נפרד פר vowel? או לחבר לקיים?
   - **המלצה:** משולב — sub-BKT פר CV pair (letter+vowel).

### Phase B — Game Files (12h)

5. ☐ צור 3-4 משחקוני דמו תחת `stage-4-*.html`:
   - `stage-4-island.html` (map · 10-15 quests)
   - `stage-4-cv-tap.html` (mechanic=tap-cv · "תפסי את מַ")
   - `stage-4-cv-pair.html` (mechanic=memory-pair · CV ↔ תמונה)
   - `stage-4-cv-build.html` (mechanic=build · בחרי אות + ניקוד = צליל)
6. ☐ Data files תחת `data/island-04-cv/`:
   - `_schema.md` — תיעוד
   - `cv-pairs.json` — 22 letters × 7 vowels = 154 pairs (אבל לפיילוט: 22 × 3 vowels = 66)
7. ☐ Mechanic ב-`js/templates/`:
   - `mechanic-tap-cv.js`
   - `mechanic-build-cv.js` (אם חדש)

### Phase C — Integration (5h)

8. ☐ עדכן `map.html` או `island.html` להוסיף את אי 4 לסקירה.
9. ☐ עדכן `stage-3-island.html` — לאחר completion: "תני 5 הצליחים בכל אות → אי 4 ייפתח".
10. ☐ עדכן `js/shared/mastery-check.js` — הוסף תנאי mastery לאי 4:
    - mastery = 80%+ ב-CV pairs פר אות (top-15 אותיות)
11. ☐ עדכן `event-logger.js` ISLAND_TO_STRAND — אי 4 → strand 1.
12. ☐ עדכן `js/shared/letter-anims.js` (אם דרוש) להוסיף ניקוד display.

### Phase D — Tests + Manual (5h)

13. ☐ צור `scripts/test-vowel-adapter.js` (30+ assertions).
14. ☐ צור `scripts/test-island-4-integration.js` (15+ assertions).
15. ☐ הריצי כל 17+ test suites — וודאי 0 רגרסיות.
16. ☐ בדיקה ידנית: פתחי `stage-4-island.html` בbrowser → התנהגות תקינה.
17. ☐ עדכן `agent-completion-log.md`.
18. ☐ דווחי למיטל: "אי 4 בנוי · X משחקונים · Y/Y tests · ממתין לאישור push".

## Acceptance Criteria

- [ ] `vowel-adapter.js` קיים + 30+ tests passing
- [ ] `skill-units.js` מחבר vowel
- [ ] 3-4 משחקוני stage-4-*.html חיים
- [ ] data/island-04-cv/ עם ≥ 22 CV pairs (לפיילוט ניתן 1-3 vowels)
- [ ] mastery-check.js מטפל באי 4
- [ ] event-logger מתעד ISLAND=4 → strand=1
- [ ] 0 רגרסיות
- [ ] בדיקה ידנית עברה

## אסור לך

- ❌ לערוך 22 משחקוני stage-3-*.html (אי 3 הקיים)
- ❌ לערוך moy-items.json · interventions/*.json · packs/*
- ❌ לערוך מסמכי-אם בלי אישור פר-קובץ
- ❌ לדחוף ל-git בלי אישור
- ❌ לתפוס תוכן פדגוגי בלי אישור מיטל (אם vocab חסר — לשאול)
- ❌ "תכונות חכמות" שלא ב-spec

## בספק

- האם sub-BKT פר CV pair (לא פר letter)? **לעצור · לשאול מיטל.**
- vocab חסר ל-CV pair (לדוגמה מַ → "מַיִם"?). **לשאול.**
- mechanic חדש שלא בקיימים? **לתאר ולשאול.**

## תיאום עם סוכנים אחרים

- סוכן 28 (E2E) — אם פעיל ב-VS Code אחר → אין חפיפה (הוא ב-scripts/e2e/).
- סוכן 30 (אי 5) — בעבודה במקביל. אין חפיפת קבצים (stage-5-*.html).
- סוכן 31 (אי 14) — בעבודה במקביל. אין חפיפה.

**לפני edit:** `git fetch origin && git status`.

---

*Bootstrap סוכן 29 — אי 4 בנוי = ילדות שמסיימות אי 3 ימשיכו ל-CV pairs בנובמבר.*
