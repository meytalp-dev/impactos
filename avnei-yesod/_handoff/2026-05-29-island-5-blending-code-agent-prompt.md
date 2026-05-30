# Handoff — סוכן 30: אי 5 — מיזוג צירופים למילים

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש. **דרישה מקדימה: אי 4 (סוכן 29) חייב להיות בנוי לפני** — אי 5 בונה על CV pairs.

> **גרסה 2 · 30.5.2026** — עודכן לפי הלקחים של סוכן 29 (אי 4): welcome buffer · session-runner pattern · AvriNeural MP3 (לא Web Speech) · ב/כ/פ דגש קל · 11-point checklist.

---

## הוראות תזמורת — מיטל · 30.5.2026 (חובה לפני Phase A)

> **5 decisions שמיטל אישרה. אלה לא "בספק" — אלה הוראות.**

1. **Vocab = מ-`curriculum/vocab-bank.json` בלבד.** אסור להמציא מילים. אם חסר vocab למילה שאתה חושב שצריכה להיות — **לעצור · לרשום ב-handoff · לשאול את מיטל** לפני שמוסיף אותה.
2. **אודיו = AvriNeural MP3** (לא Web Speech · שונה מה-bootstrap המקורי). הפק MP3 פר מילה דרך `generate-island-05-word-audio.py` (תבנית: `scripts/generate-island-04-cv-audio.py` של סוכן 29).
3. **Sub-BKT level = פר אורך-מילה** (2cv / 3cv / 4cv) — לא פר מילה. דורש הוספה ל-`ISLANDS_WITH_SUB_BKT` ב-`bkt.js` (כיום `[3, 14]` → יעבור ל-`[3, 5, 14]`). פתח בלוק חדש בעקבות הpattern של אי 14 — **אל תדרוס** את עבודת 29/31.
4. **🔴 ב/כ/פ דגש קל ב-CV של תחילת הברה** — חובה: `בַּיִת` (/bayit/), לא `בַיִת` (/vayit/). אם מילה ב-vocab-bank לא מנוקדת נכון → לעצור ולתעד. AvriNeural מבטא ללא דגש = /va·xa·fa/ = bug. ראה [[reference-hebrew-bgd-kpt-dagesh-rule]].
5. **🟢 stage-5-island.html = welcome buffer קצר** (לא map · 15 quests). pattern דומה ל-`stage-4-island.html` של סוכן 29: hero noni + narrative card + 2 CTAs (session-runner + standalone build). ילדה פוגשת חוויה אחידה — לא בחירה מורכבת.

---

## משימה

לבנות **אי 5 — מיזוג צירופים למילים** באבני יסוד. שלב טבעי אחרי אי 4 (CV): ילדה לומדת לחבר 2+ CV pairs למילה.

לדוגמה: מַ + ם = "מַם" · בַּ + יִ + ת = "בַּיִת" · אַ + בָּ + א = "אַבָּא"

**אומדן:** 15-20 שעות (פחות מאומדן המקורי 25-30h בזכות תבניות מאי 4 של סוכן 29).

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
4. **🔴 Checklist:** [[reference-avnei-yesod-island-build-checklist]] — **MUST READ** · 11 לקחים מאי 4
5. **🔴 ב/כ/פ דגש:** [[reference-hebrew-bgd-kpt-dagesh-rule]] — חובה לכל מילה שמתחילה ב-ב/כ/פ
6. **Skill Units:** `js/shared/skill-units.js` — `word` type ממתין ל-adapter
7. **אי 4 כתשתית (תבנית):**
   - `js/shared/vowel-adapter.js` — תבנית ל-word-adapter
   - `stage-4-island.html` — תבנית ל-welcome buffer
   - `stage-4-cv-tap.html` — **תבנית ל-session-runner** (5 סבבים · רוטציה של 4 mechanics · נרטיב דגים · נוני · journey strip)
   - `stage-4-cv-build.html` — תבנית ל-standalone build screen
   - `js/templates/mechanic-tap-cv.js` · `mechanic-listen-cv.js` · `mechanic-cv-vs-cv.js` · `mechanic-match-cv-to-word.js` · `mechanic-cv-build.js` — תבניות mechanic
   - `scripts/generate-island-04-cv-audio.py` — תבנית לפקת MP3
8. **Packs:** `curriculum/packs/grade1-tashpaz/february-2027.json` + `march-2027.json` — מילים תלת-הברתיות (יכולים לשמש כדוגמה)
9. **Memory חובה:**
   - [[reference-avnei-yesod-island-build-checklist]]
   - [[reference-hebrew-bgd-kpt-dagesh-rule]]
   - [[feedback-avnei-yesod-noni-narrative-and-visuals-consistency]]
   - [[feedback-avnei-yesod-niqud-on-student-screens]]
   - [[reference-hebrew-niqud-rules]]
   - [[feedback-kid-block-letters-not-handwriting]]
   - [[project-moy-lite-item-structure]]

## מה לבנות

### Phase A — Setup + Adapter + BKT (4h)

1. ☐ קרא קבצי המקור (במיוחד checklist + ב/כ/פ rule + vowel-adapter כתבנית).
2. ☐ צור `js/shared/word-adapter.js`:
   - `getWords(level)` → מילים 2/3/4 CV
   - `getTopWeakWords(sid, n=3)` → מילים חלשות
   - `decomposeWord(word)` → [{letter, vowel}, ...]
   - `validateBgdkptDagesh(word)` → אזהרה אם ב/כ/פ בתחילה ללא דגש
   - integration עם `vowel-adapter.js` (CV pairs)
3. ☐ עדכן `skill-units.js` — חבר `word` ל-word-adapter. **אל תיגע ב-vowel-adapter wire (סוכן 29) ו-oral-skill wire (סוכן 31).**
4. ☐ עדכן `bkt.js`:
   - `ISLANDS_WITH_SUB_BKT` = `[3, 5, 14]` (לוודא שלא דורס את 14 של סוכן 31)
   - הוסף `emptyIsland5Record()` + `ingestIsland5Event()` — pattern של `emptyIsland14Record` + `ingestIsland14Event`
   - sub-BKT פר 3 buckets: `'2cv' · '3cv' · '4cv'`
   - constants: `ISLAND_5_WORD_LENGTHS = Object.freeze(['2cv', '3cv', '4cv'])`

### Phase B — Game Files (8h)

5. ☐ Data files תחת `data/island-05-words/`:
   - `_schema.md`
   - `words-level-1.json` (20 מילים 2-CV)
   - `words-level-2.json` (30 מילים 3-CV)
   - `words-level-3.json` (15 מילים 4-CV)
   - **כל מילה עם בּ/כּ/פּ בתחילה — דגש קל חובה** (validation בעת build)

6. ☐ צור 3 משחקונים תחת `stage-5-*.html`:
   - **`stage-5-island.html`** = welcome buffer קצר (תבנית: stage-4-island.html):
     - hero noni + narrative card עם 3 פסקאות מנוקדות
     - 2 CTAs: "בּוֹאוּ נַתְחִיל" → stage-5-word-merge.html · "🛠 הַרְכִּיבוּ מִילָה" → stage-5-word-build.html
     - scene-bg PNG + tokens.css + noni-hero-transparent.png
     - intro-isl05.mp3 (AvriNeural)
   - **`stage-5-word-merge.html`** = **session-runner שלם** (תבנית: stage-4-cv-tap.html):
     - 5 סבבים על אותה word family (למשל: מילים שמתחילות ב-מ)
     - רוטציה של 3-4 mechanics: `word-merge` · `tap-word` · `word-vs-word` · `match-word-to-image`
     - נרטיב דגים + נוני + journey strip
     - phoneme group accept (אם רלוונטי למילים דומות)
   - **`stage-5-word-build.html`** = standalone constructive (תבנית: stage-4-cv-build.html):
     - בחירת CV pairs (מ-vowel-adapter) → בנייה ידנית של מילה
     - השמע MP3 של המילה הבנויה
     - מצב exploration pure (אין correct/wrong)

7. ☐ Mechanics ב-`js/templates/`:
   - `mechanic-word-merge.js` (גרור CV pairs ליצור מילה)
   - `mechanic-tap-word.js` (קרא נכון מתוך 4 אופציות)
   - `mechanic-word-vs-word.js` (השוואה — מילים דומות סגולה)
   - `mechanic-match-word-to-image.js` (מילה ↔ תמונה anchor)
   - `mechanic-word-build.js` (standalone למסך build)

### Phase C — Audio Generation (2h)

8. ☐ צור `scripts/generate-island-05-word-audio.py` (תבנית: `generate-island-04-cv-audio.py`):
   - 65 MP3 (אחת פר מילה): `assets/audio/word-<word-key>.mp3`
   - intro narration: `assets/audio/intro-isl05.mp3`
   - completion: `assets/audio/completion-isl05.mp3`
   - AvriNeural · he-IL
   - **חובה: לבדוק שכל מילה מנוקדת עם ב/כ/פ דגש** לפני השמעה

### Phase D — Integration (2h)

9. ☐ עדכן `map.html` — הוסף נקודת אי 5 (אחרי אי 4):
   ```html
   <a href="stage-5-island.html" class="map-node" data-island-id="5" data-vs-open="true" style="right: 50%; top: 30%;">
   ```
   (התאם `right/top` שלא יחפוף עם 1·2·3·4·14)
10. ☐ עדכן `mastery-check.js` — אי 5 ייפתח אחרי 70%+ באי 4 (אם לא מוגדר כבר). אישור: שורה 77 כבר מוגדרת RAMA_TASKS לאי 5 (rama_task=6).
11. ☐ עדכן `event-logger.js` ISLAND_TO_STRAND — אי 5 → strand 1.

### Phase E — Tests + Manual + Report (2h)

12. ☐ `scripts/test-word-adapter.js` (30+ assertions).
13. ☐ `scripts/test-island-5-integration.js`.
14. ☐ הריצי 20+ test suites (הוסיפו אי 5 · אי 14) — `node scripts/test-*.js` — 0 רגרסיות.
15. ☐ בדיקה ידנית בbrowser:
    - `map.html` → נקודת אי 5 נראית · לחיצה → `stage-5-island.html`
    - "בואו נתחיל" → `stage-5-word-merge.html` (session-runner) · 5 סבבים פועלים
    - "הרכיבו מילה" → `stage-5-word-build.html` (standalone) · בנייה עובדת
    - בכל מילה עם ב/כ/פ בתחילה — לוודא הגייה /b·k·p/ (לא /v·x·f/)
16. ☐ עדכן `_handoff/agent-completion-log.md` — בלוק חדש "סוכן 30 — אי 5 completion".
17. ☐ צור `_handoff/2026-05-30-island-05-completion-report.md` — דיווח מלא + findings אם יש.

## Acceptance Criteria

- [ ] `word-adapter.js` + 30+ tests
- [ ] `bkt.js` ISLANDS_WITH_SUB_BKT = [3, 5, 14] + island-5 functions (לא דורס 14)
- [ ] 3 משחקוני stage-5-*.html (island buffer + session-runner + standalone build)
- [ ] ≥ 65 מילים ב-data (20 + 30 + 15) · ב/כ/פ דגש מאומת
- [ ] 65+ MP3 ב-`assets/audio/word-*.mp3` + intro + completion
- [ ] 5 mechanics חדשים ב-`js/templates/`
- [ ] integration עם vowel-adapter (CV pairs)
- [ ] mastery-check + ISLAND_TO_STRAND טופלו
- [ ] map.html כולל data-island-id="5"
- [ ] 0 רגרסיות ב-20+ test suites
- [ ] בדיקה ידנית: 3 stage-5-*.html פועלים · ב/כ/פ נכון
- [ ] completion report ב-_handoff/

## אסור לך

- ❌ לערוך אי 3 (stage-3-*.html) · אי 4 (stage-4-*.html · vowel-adapter · mechanic-tap-cv · etc) · אי 14 (stage-14-*.html · oral-skill-adapter)
- ❌ לערוך mechanics קיימים של אי 4 (tap-cv · listen-cv · cv-vs-cv · match-cv-to-word · cv-build)
- ❌ moy-items · interventions · packs · מסמכי-אם
- ❌ לדרוס חלקי bkt.js / skill-units.js / mastery-check.js / map.html של סוכנים 29+31 — להוסיף בלוקים חדשים בלבד
- ❌ לדחוף בלי אישור מיטל
- ❌ Web Speech — להשתמש **רק** ב-AvriNeural MP3
- ❌ להמציא vocab — לקרוא מ-vocab-bank.json או לשאול

## תיאום עם סוכנים אחרים

- סוכן 29 (אי 4) — סיים · ב-origin (8d71465) · אתה בונה על ה-vowel-adapter שלו
- סוכן 31 (אי 14) — סיים · ב-origin · אין חפיפה
- סוכן 28 (E2E) — סיים · אם תהיה הוספה ל-E2E suite לאי 5, ה-test 09-e2e-full-flow אולי יצטרך עדכון

**לפני edit:** `git fetch origin && git status`. אם תראה M בקבצים שלא ערכת → להפסיק ולשאול את מיטל.

---

*Bootstrap סוכן 30 v2 · 30.5.2026 · אי 5 בנוי = ילדה שמיצתה את CV pairs ממשיכה למילים מורכבות · 15-20h.*
