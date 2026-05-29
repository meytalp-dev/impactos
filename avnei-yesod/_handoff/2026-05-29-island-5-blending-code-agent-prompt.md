# Handoff — סוכן 30: אי 5 — מיזוג צירופים למילים

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש. **דרישה מקדימה: אי 4 (סוכן 29) חייב להיות בנוי לפני** — אי 5 בונה על CV pairs.

---

## הוראות תזמורת — מיטל · 29.5.2026 (חובה לפני Phase A)

> **3 decisions שמיטל אישרה. אלה לא "בספק" — אלה הוראות.**

1. **Vocab = מ-`curriculum/vocab-bank.json` בלבד.** אסור להמציא מילים. אם חסר vocab למילה שאתה חושב שצריכה להיות — **לעצור · לרשום ב-handoff · לשאול את מיטל** לפני שמוסיף אותה.
2. **אודיו = Web Speech he-IL בלבד.** לא להפיק MP3 למילים בשלב זה. AvriNeural = post-pilot.
3. **Sub-BKT level (תואם להחלטה באי 4) = פר אורך-מילה** (2cv / 3cv / 4cv) — לא פר מילה. זה כבר ההמלצה ב-Phase A.4, אושר.

---

## משימה

לבנות **אי 5 — מיזוג צירופים למילים** באבני יסוד. שלב טבעי אחרי אי 4 (CV): ילדה לומדת לחבר 2+ CV pairs למילה.

לדוגמה: מַ + ם = "מַם" · בּ + ַ + יִ + ת = "בַּיִת" · אַ + בָּ + א = "אַבָּא"

**אומדן:** 25-30 שעות.

## הקשר פדגוגי

- **אי 5 = "מיזוג צירופים למילים"** — strand 1 (פונולוגיה+דקודינג)
- שלב 4 בתוכנית הלימודים תשפ"ו
- רכיב 2 (רכישה) של משה"ח
- מתחבר למשימה 6 (קריאת 20 מילים מוכרות) ומשימה 7 (לא-מוכרות) של ראמ"ה

**רצף מומלץ:**
1. מילים 2-CV (מַם · בָּא · נֵר)
2. מילים 3-CV (בַּיִת · יֶלֶד · אַבָּא)
3. מילים 4-CV (פֶּרַח · גֶּשֶׁר)

## קבצי-מקור — חובה לקרוא לפני עבודה

1. **Pedagogy:** `curriculum/pedagogy-integration-framework.md` §5 (line 149)
2. **Vocab-bank:** `curriculum/vocab-bank.json` — סדר מילים בחוברות מטח
3. **Architecture:** `architecture-mvp.md`
4. **Skill Units:** `js/shared/skill-units.js` — `word` type ממתין ל-adapter
5. **אי 4 כתשתית:** `js/shared/vowel-adapter.js` + `stage-4-*.html` (מהסוכן 29)
6. **Packs:** `curriculum/packs/grade1-tashpaz/february-2027.json` + `march-2027.json` — מילים תלת-הברתיות (שיכולים לשמש כדוגמה)
7. **Memory:**
   - `feedback-avnei-yesod-niqud-on-student-screens`
   - `reference-hebrew-niqud-rules`
   - `project-moy-lite-item-structure`

## מה לבנות

### Phase A — Setup + Adapter (5h)

1. ☐ קרא קבצי המקור.
2. ☐ צור `js/shared/word-adapter.js`:
   - `getWords(level)` → מילים 2/3/4 CV
   - `getTopWeakWords(sid, n=3)` → מילים חלשות
   - `decomposeWord(word)` → [{letter, vowel}, ...]
   - integration עם `vowel-adapter.js` (CV pairs)
3. ☐ עדכן `skill-units.js` — חבר `word` ל-word-adapter.
4. ☐ Sub-BKT extension ב-`bkt.js`:
   - sub-BKT פר מילה? פר אורך-מילה? **לשאול מיטל.**
   - **המלצה:** sub-BKT פר word-length (2cv / 3cv / 4cv).

### Phase B — Game Files (12h)

5. ☐ צור 3-4 משחקונים תחת `stage-5-*.html`:
   - `stage-5-island.html` (map · 15 quests · מאוצר מילים יומיומי)
   - `stage-5-word-merge.html` (mechanic=merge · גרור CV pairs ליצור מילה)
   - `stage-5-word-tap.html` (mechanic=tap-word · קרא את המילה הנכונה)
   - `stage-5-word-pair.html` (mechanic=memory-pair · מילה ↔ תמונה)
6. ☐ Data files תחת `data/island-05-words/`:
   - `_schema.md`
   - `words-level-1.json` (20 מילים 2-CV)
   - `words-level-2.json` (30 מילים 3-CV)
   - `words-level-3.json` (15 מילים 4-CV)
7. ☐ Mechanic ב-`js/templates/`:
   - `mechanic-word-merge.js`
   - `mechanic-tap-word.js`

### Phase C — Integration (5h)

8. ☐ עדכן `map.html` להוסיף אי 5.
9. ☐ עדכן mastery-check — אי 5 ייפתח אחרי 70%+ באי 4.
10. ☐ עדכן ISLAND_TO_STRAND — אי 5 → strand 1.
11. ☐ Pack × BKT integration — האם packs יציעו מילים מאי 5? **שאלה למיטל.**

### Phase D — Tests + Manual (5h)

12. ☐ `scripts/test-word-adapter.js` (30+ assertions).
13. ☐ `scripts/test-island-5-integration.js`.
14. ☐ הריצי 17+ test suites — 0 רגרסיות.
15. ☐ בדיקה ידנית.
16. ☐ עדכן `agent-completion-log.md`.

## Acceptance Criteria

- [ ] `word-adapter.js` + 30+ tests
- [ ] 3-4 משחקוני stage-5-*.html
- [ ] ≥ 65 מילים ב-data (20 + 30 + 15)
- [ ] integration עם vowel-adapter
- [ ] mastery-check טופל
- [ ] 0 רגרסיות

## אסור לך

- ❌ לערוך אי 3 (stage-3-*.html) או אי 4 (stage-4-*.html)
- ❌ moy-items · interventions · packs
- ❌ מסמכי-אם
- ❌ דחיפה
- ❌ להמציא vocab (לקרוא מ-vocab-bank.json או לשאול)

## תיאום

- **תלוי באי 4** — אם סוכן 29 עוד לא סיים → להמתין.
- סוכנים 28 (E2E) ו-31 (אי 14) — אין חפיפה.

---

*Bootstrap סוכן 30 — אי 5 בנוי = ילדה שמיצתה את CV pairs ממשיכה למילים מורכבות.*
