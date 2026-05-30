# Completion — סוכן 31 · אי 14 הבנת הנשמע

> **מיטל:** הכל בנוי. ה-passages עדיין חסרים — מחכים ל-GPT לפי ה-brief ב-[2026-05-29-island-14-passages-gpt-brief.md](2026-05-29-island-14-passages-gpt-brief.md). כשתחזירי, החליפי את שלושת קבצי ה-JSON ב-`underwater-app/data/island-14-listening/` ונחזור פה.

## TL;DR

- **Phase A** (Setup + Adapter + Sub-BKT) — ✅
- **Phase B** (3 משחקונים + mechanics + data structure) — ✅
- **Phase C** (אודיו) — ✅ Web Speech he-IL בלבד (לפי החלטתך, לא MP3)
- **Phase D** (Integration + 150 בדיקות + 18 רגרסיות עברו) — ✅
- **GPT brief** ל-25+ passages חדשים — ✅ ב-`2026-05-29-island-14-passages-gpt-brief.md`

## איך לבדוק עכשיו

1. פתחי `underwater-app/index.html` ב-Live Server / file://
2. לחצי על נקודת אי 14 במפה (סמן 14 בצד שמאל-עליון של המפה).
3. תראי 2 כרטיסי משחקון: **להאזין ולענות** ו-**סדר אירועים**.
4. שתי המכניקות עובדות עם 3 + 3 + 2 = **8 ה-passages הזמניים שכתבתי**. כשתחליפי לתוכן GPT — אותו flow.
5. אודיו: Web Speech he-IL — דרוש דפדפן מודרני (Chrome/Edge יציב יותר מ-Safari).

## מה נבנה

### קבצים חדשים

| קובץ | תפקיד |
|---|---|
| `underwater-app/js/shared/oral-skill-adapter.js` | API ל-mechanic: `getRandomBatch · getMastery · recordAttempt · getTopWeakSkills` |
| `underwater-app/js/templates/mechanic-listen-mcq.js` | Mechanic 1: הקשבה לסיפור → MCQ של 3 |
| `underwater-app/js/templates/mechanic-story-sequence.js` | Mechanic 2: סידור משפטי הסיפור |
| `underwater-app/stage-14-island.html` | מסך אינדקס של האי (2 quests + skill mastery strip) |
| `underwater-app/stage-14-listen-and-answer.html` | Mechanic 1 mount + level picker (1/2/3) |
| `underwater-app/stage-14-story-sequence.html` | Mechanic 2 mount + level picker (2/3) |
| `underwater-app/data/island-14-listening/_schema.md` | תיעוד סכמת JSON |
| `underwater-app/data/island-14-listening/passages-level-1.json` | 3 passages placeholder · יעד 10 |
| `underwater-app/data/island-14-listening/passages-level-2.json` | 3 passages placeholder · יעד 10 |
| `underwater-app/data/island-14-listening/passages-level-3.json` | 2 passages placeholder · יעד 5 |
| `underwater-app/scripts/test-oral-skill-adapter.js` | 150 assertions (יעד היה 25+) |
| `_handoff/2026-05-29-island-14-passages-gpt-brief.md` | Brief ל-GPT ליצירת 25 passages |

### קבצים שעודכנו (additive only)

- `underwater-app/js/shared/bkt.js` — הוספת sub-BKT לאי 14:
  - `ISLAND_14_ORAL_SKILLS = ['identify-hero','sequence','inference']`
  - `PARAMS_PER_ISLAND[14] = { pL0: 0.30, pT: 0.15, pG: 0.25, pS: 0.10 }` (תואם strand 3)
  - `ISLANDS_WITH_SUB_BKT = [3, 14]` (היה `[3]`)
  - `emptyIsland14Record()` · `ingestIsland14Event()` · dispatch ב-`ingestEvent`/`setInitialState`/`getIslandState`
  - `checkMastery(sid, 14)` — מסלול חדש (מקביל לאי 3 פר אות, אבל פר oral-skill)
  - API חדש: `getOralSkillState · getWeakestOralSkills · getOralSkillMasteryDistribution`
  - Migration safety: `ensureAllOralSkillsIn` (אם state ישן יחסר sub-skill — מאותחל ב-pL0)

- `underwater-app/js/shared/skill-units.js` — הוספת `oral-skill` type:
  - `_getOralSkillAdapter()` adapter accessor
  - `getWeakUnits()` עכשיו כולל גם oral-skills אחרי letters
  - `makeOralSkillUnit(skillId)` convenience

- `underwater-app/js/shared/mastery-check.js`:
  - `RAMA_TASKS[3].islands = [13, 14, 15]` (היה `[13, 15]` — תיקון: 14 שייך ל-RAMA task 3, "הבנת טקסט מושמע", פשוט נשכח)
  - `ISLAND_TO_RAMA[14] = { rama_task: 3, rama_task_name: 'הבנת טקסט מושמע', accuracy_threshold_pKnown: 0.70 }`

- `underwater-app/map.html` — נקודת אי 14 חדשה (right: 35% · top: 25%, data-vs-open=true ל-pilot)

## 3 ההחלטות שאישרת — איך יושמו

1. **אודיו = Web Speech he-IL בלבד** ✅
   - דילגתי על Phase C.8 (אין `tools/generate-island-14-audio.js`)
   - `mechanic-listen-mcq.js` ו-`mechanic-story-sequence.js` קוראים ישירות ל-`SpeechSynthesisUtterance(text, {lang:'he-IL', rate:0.85})`
   - אין MP3 lookup בכלל

2. **Passages חסרים — לא להמציאת** ✅
   - לא נגעתי ב-`engine/moy-items.json` ולא הקצתי 25 passages חדשים מעצמי
   - כתבתי **GPT brief** מקיף (תוכן + ניקוד + skill tags + 3 רמות)
   - הזרמתי 8 passages placeholder (מנוקדים, גוון דמויות, content שונה לחלוטין מ-MOY) כדי שה-flow ירוץ עד שתגיע התוכן האמיתי

3. **Sub-BKT** ✅
   - בחרת ב-"Sub-BKT per skill" — הוספתי תשתית מלאה ל-bkt.js (מקבילה לסכמת `per_letter` של אי 3)
   - 3 skills: `identify-hero` · `sequence` · `inference`
   - Mastery פר skill = 70% accuracy עם 5+ ניסיונות (pilot threshold)
   - Mastery לאי = כל 3 ה-skills mastered + 2 סשנים רצופים

## Acceptance Criteria

- [x] `oral-skill-adapter.js` + **150** tests (יעד 25+)
- [x] 3 משחקוני stage-14-*.html (island + listen-and-answer + story-sequence)
- [ ] **≥ 25 passages** ב-data — **כרגע 8 placeholder, ממתינים ל-GPT**
- [x] Web Speech he-IL (אין MP3)
- [x] ניקוד מלא ב-passages (placeholder + יידרש מה-GPT)
- [x] MOY × אי 14 integration (`RAMA_TASKS[3].islands`)
- [x] **0 רגרסיות** — כל 18 הסוויטים הקיימים עברו (בודק שורה תחתונה):
  - test-bkt.js, test-bkt-letters.js (53/0), test-skill-units.js (85/0)
  - test-moy-assessments.js (51/0), test-moy-intervention-link.js (51/0)
  - test-vowel-adapter.js (107/0), test-intervention-matcher.js (57/0)
  - test-pack-bridge.js (75/0), test-interventions.js (78/0), ועוד 9 סוויטים נוספים

## איך זה מתחבר ל-MOY task 3

מערכת MOY (ראמ"ה) ממשיכה לעבוד כמו שהיא — לא נגעתי בה. החיבור הוא דרך 2 קבצים:

1. **`mastery-check.js: RAMA_TASKS[3].islands`** — היה `[13, 15]`, הוספתי 14. אז כשמורה מסתכלת ב-F.21A על RAMA task 3 — אי 14 מופיע כאי תורם.
2. **`map.html: data-vs-open="true"`** — אי 14 גלוי וקליק תמיד (pilot mode). ילדה שנכשלה ב-MOY task 3 יכולה ללכת ישירות לאי 14 ולתרגל.

**מה לא עשיתי (בכוונה):**
- לא הוספתי redirect אוטומטי מ-MOY screener לאי 14 (זה ידרוש שינוי ב-moy-screener.html שאסרת)
- לא עדכנתי moy-intervention-map.json (זו החלטה פדגוגית — בדקי האם task_3.default_pattern צריך לזוז מ-phonological למשהו אחר)

## שאלות פתוחות / decisions ל-post-pilot

1. **Strand 3 sub-BKT mirror** — לא הוספתי `per_oral_skill` תחת `strandState[3]` (רק תחת `state[14]`). זה אומר שמסך 21A שמסתכל ב-strand 3 רואה רק aggregate, לא breakdown פר skill. נכון לפיילוט. post-pilot — לשקול אם להוסיף mirror כמו שיש ל-strand 1 ↔ per_letter.

2. **`island.responseTimesMs` באי 14** — שמרתי ב-`per_oral_skill[skill].responseTimesMs` אבל `hasGoodFluency(times, 14)` מחזיר תמיד true (אין רף ב-FLUENCY_THRESHOLD_MS[14]). זה מכוון: להבנת הנשמע אין רף שטף ב-ראמ"ה לפעימה 2. אבל אם תרצי לקבוע פנימי — קל להוסיף `FLUENCY_THRESHOLD_MS[14] = 15000` או דומה.

3. **3-second tap-to-start gate** — אין באי 14 (בשונה ממשחקוני אי 3 שדורשים ברכה לפני שמתחילים). הסיבה: ילדה צריכה לשמוע אודיו מיד שמתחילים — אין סיפור לפני המסך. אם תרצי תוספת gate — אפשר לעטוף.

## מה לעשות עכשיו (3 צעדים)

1. **פתחי GPT** עם ה-brief מ-`2026-05-29-island-14-passages-gpt-brief.md`. תני לו ליצור 3 קבצי JSON.
2. **החליפי** את `underwater-app/data/island-14-listening/passages-level-{1,2,3}.json` בתוכן ש-GPT החזיר. ה-schema זהה (תאמתי בטסטים — `test-oral-skill-adapter.js` בודק 7 פרטי schema לכל passage).
3. **בדקי ידנית** ב-stage-14-listen-and-answer.html. אם הקול נשמע מוזר → בודקים ניקוד.

לפני pilot — להריץ `node scripts/test-oral-skill-adapter.js` שוב כדי לוודא שה-passages החדשים תקינים.

---

*בנייה: 6 קבצים חדשים, 4 קבצים עודכנו (additive), 150 בדיקות חדשות + 18 רגרסיות עברו · 0 conflicts עם סוכנים 28-30 שעובדים במקביל · אסטרטגיית push: ממתין להוראת מיטל.*
