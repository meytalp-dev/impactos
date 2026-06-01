# Bootstrap — סוכן השלמת אי 5 · 31.5.2026

> **סוכן זה ירוץ ב-VS Code נפרד מהתזמורת.** התזמורת תאסוף push בסוף לפי tests-as-signal.

---

## מטרה

להשלים את אי 5 (blending · מילים מצדפים) מ-WIP מקומי ל-pilot-ready, כך שהתזמורת תוכל לדחוף בבטחה ל-origin.

**ההתערבות שלך = 4 פעולות מובחנות:**

1. ✅ **לאשר עם מיטל החלטה פדגוגית קטנה** (B1 או B2 — מסומן למטה) — בלי זה לא להתחיל.
2. הוספת 2-4 מילים ל-L3 + עדכון JSON + adapter + tests.
3. **הפקת 60-64 MP3** דרך `generate-island-05-word-audio.py` (Python 3.14 + edge-tts 7.2.8 כבר מותקנים על המכונה).
4. הוספת **map node לאי 5** (6 שורות ב-`underwater-app/map.html`) — קואורדינטות `right:48%; top:30%` (סוכן 30 כתב את הקוד ב-completion-report וההסרה הייתה זמנית).

**אסור לך לדחוף.** התזמורת עושה את ה-push. אתה רק קומיט מקומי.

---

## מצב בכניסה (snapshot 31.5.2026)

### Branch
- main · HEAD = `af1ff93` (PIN bypass · 31.5)
- working tree: 3 M files + ~22 untracked, מתוכם 13 קבצים של סוכן 30 (אי 5)

### Tests עוברים — 0 regressions
13 test suites, סה"כ 1100+ assertions עוברים. ביניהם:
- `test-word-adapter.js` — 121 ✓
- `test-island-5-integration.js` — 49 ✓
- כל ה-regressions של איים 1-4, 14, F.21E ✓

### Vocab בקבצים
- L1 (2cv) = **19 מילים** ✓ יעד היה 20
- L2 (3cv) = **30 מילים** ✓ יעד היה 30
- L3 (4cv) = **11 מילים** — יעד היה 15. **חסרות 2-4** (תלוי החלטה B1/B2).

### חסר
- ❌ MP3 audio (60-64 קבצים) — Python + edge-tts מותקנים, חסר רק להריץ.
- ❌ Map node ב-map.html — 6 שורות.
- ❌ 2-4 מילים ב-L3 — תלוי החלטה.
- ❌ בדיקה ידנית בדפדפן — מיטל תעשה אחרי שתסיים.

---

## 🔴 החלטה פדגוגית — לאשר עם מיטל לפני התחלה

מיטל אישרה ב-29-30.5 "אופציה A · 12 מילים נוספות". 11 כבר נוספו. נשארו 4 מילים מ-vocab-gaps.md, אבל **2 מהן הן 5 אותיות**, לא 4. ה-classification של אי 5 הוא `base_letter_count = stripNiqud(text).length` (Architecture Decision #1 של סוכן 30).

| מילה | base letters | התאמה ל-L3 (4cv) |
|---|---|---|
| צִינוֹר | צ-י-נ-ר = 4 | ✅ |
| מִכְתָּב | מ-כ-ת-ב = 4 | ✅ |
| תְּמוּנָה | ת-מ-ו-נ-ה = 5 | ❌ זה L4 |
| חֲנֻכִּיָּה | ח-נ-כ-י-ה = 5 | ❌ זה L4 |

### אפשרות B1 — מסלול קצר (מומלץ ל-pilot)
- להוסיף רק `צִינוֹר` + `מִכְתָּב` → L3 = 13 → סה"כ **62 מילים**
- 2 ה-5-letter words ידחו ל-Post-Pilot כשנפתח L4 bucket
- מתאים ל-pilot של 4-5 ילדות
- **זמן עבודה: ~30 דקות**

### אפשרות B2 — מסלול מלא (post-pilot work)
- להוסיף את כל 4 + **לפתוח L4 (5cv) bucket חדש**
- דורש שינוי infrastructure:
  - `data/island-05-words/words-level-4.json` חדש (2 מילים)
  - `word-adapter.js` — `WORDS_5CV` constant + `getWords(level=4)` + 8 פונקציות עזר
  - `bkt.js` — `ISLAND_5_WORD_LENGTHS = [2,3,4,5]` (היה [2,3,4]) + `per_word_length.4cv,5cv`
  - תוספת ~50 שורות test ב-`test-word-adapter.js`
- **זמן עבודה: ~2-3 שעות**
- סיכון: יוצר infrastructure debt לפני שיש לנו data לאמת mastery thresholds לרמה 4.

**⚠️ אל תתחיל בלי אישור מפורש של מיטל על B1 או B2.**

---

## רשימת אסור-לגעת בלי אישור פר-קובץ

### מסמכי-אם — לעולם לא לעדכן
- `_handoff/architecture-mvp.md`
- `_handoff/pedagogy-integration-framework.md`
- `_handoff/literacy-grade1-2-yearly.md`
- `_handoff/llm-pitfalls.md`

### Curriculum מאושר פדגוגית
- 5 קבצי `data/interventions/*.json`
- 60 פריטי `data/moy-items.json`
- 7 packs ב-`data/curriculum/packs/grade1-tashpaz/`
- 25 passages ב-`data/island-14-passages.json` (v2 מאושר)
- 49 מילים שכבר ב-`words-level-{1,2,3}.json` — להוסיף בלי לשנות existing entries

### Infrastructure של איים אחרים (קוד יציב — לחפש "where to add", לא לדרוס)
- `js/shared/bkt.js` — סוכן 30 כבר הוסיף בלוק אי 5. אם B2 → עוד תוספות אדיטיביות בלבד, אסור לגעת בקוד של אי 3/14/strand.
- `js/shared/skill-units.js` — `WORD` type כבר wired. אם B2 → להוסיף `makeWord5Unit` אם נדרש.
- `js/shared/mastery-check.js` — `mastery-check אי 5 → RAMA task 6` כבר עובד (line 77). לא לגעת.
- `js/shared/word-adapter.js` — סוכן 30 כתב את הקובץ. אם B2 → להוסיף constants + functions בסוף, לא לדרוס שום פונקציה קיימת.

### קבצים של סוכנים אחרים — לא לגעת
- כל מה שב-`english-chativa/` — פרויקט אחר
- כל מה שב-`inclusion/` — פרויקט אחר
- `_tmp_doc.txt`, `_tmp_doc.xml` — סוכן פדגוגי אחר, B.7 interventions
- `teacher-action-v2.html`, `_voice-diag.html`, `flow-slides-mockup.html`, `scripts/e2e/11/12-*.spec.js` — לא של אי 5

---

## פעולות מסודרות

### שלב 0 · sanity
```bash
cd /c/Users/meyta/Downloads/impactos
git fetch origin && git status --short
git log --oneline -3
```
אם HEAD ≠ `af1ff93` או יש diff חדש בקבצי infrastructure — **לעצור ולשאול את התזמורת**. ייתכן push חדש בעודך עובד.

### שלב 1 · הוספת מילים (לפי B1 או B2)

**אם B1 (2 מילים):**
1. ערוך `underwater-app/data/island-05-words/words-level-3.json` — הוסף 2 entries (צִינוֹר · מִכְתָּב) בסוף ה-array של `words`.
2. ערוך `underwater-app/js/shared/word-adapter.js` — הוסף את אותן 2 מילים ל-`WORDS_4CV` constant.
3. אמת:
   ```bash
   cd avnei-yesod/underwater-app
   node scripts/test-word-adapter.js
   ```
   צריך לראות `level 3: JSON.words.length (13) === adapter.length (13)`.

**אם B2 (4 מילים + L4 bucket):**
ראה appendix B2 בסוף המסמך הזה.

### שלב 2 · הפקת אודיו

```bash
cd avnei-yesod/underwater-app
python scripts/generate-island-05-word-audio.py
```

הסקריפט יודע לדלג על MP3 שכבר קיימים. ~5-10 דק' להרצה ראשונה. אחרי הוספת מילים — יוצר רק את החדשות.

**ולידציה ב/כ/פ דגש:** הסקריפט כולל BKP validation. אם רואים `BKP missing dagesh` warning — לעצור ולתקן את ה-JSON entry (תחילית ב/כ/פ צריכה דגש קל בתחילת CV).

**אחרי הרצה:** ספור את ה-MP3:
```bash
ls underwater-app/assets/audio/island-05-words/*.mp3 | wc -l
```
צריך להיות 60 (B1: 62) או 64 (B2).

### שלב 3 · Map node

ערוך `underwater-app/map.html`. חפש את ה-node של אי 4. הוסף אחריו block של אי 5:
- HTML: 1 div של node + 1 img + 1 label
- coords: `right: 48%; top: 30%` (בין אי 4 ל-14)
- href: `stage-5-island.html`
- בדוק שה-emoji/icon תואם ל-theme של "צדפים" (לא "דגים" של אי 4)

המקור המדויק לcode-snippet נמצא בצוין completion-report של סוכן 30 (line 67-69) — או חפש ב-map.html איך אי 4 הוגדר ועקוב אותו 1:1.

### שלב 4 · regression suite מלא

```bash
cd avnei-yesod/underwater-app
for t in scripts/test-{word-adapter,island-5-integration,vowel-adapter,skill-units,oral-skill-adapter,bkt,bkt-letters,letter-targets,event-logger-fields,cold-start,rama-task-status,pack-bridge,weakness-targeting,f21e-helpers}.js; do
  echo "=== $t ==="; node "$t" 2>&1 | tail -2;
done
```

**דרישת קבלה:** 0 failures בכל 13 הסוויטות. אם נכשל → לעצור, לתקן root cause, **אסור לסמן fail-as-known**.

### שלב 5 · קומיט מקומי

⚠️ **selective commit בלבד.** הקובץ הזה משתמש ב-`git add` ספציפי, **לא** `git add .` או `-A`:

```bash
cd /c/Users/meyta/Downloads/impactos

# Modified files of agent 30 + this agent
git add avnei-yesod/underwater-app/js/shared/bkt.js
git add avnei-yesod/underwater-app/js/shared/skill-units.js
git add avnei-yesod/underwater-app/js/shared/word-adapter.js
git add avnei-yesod/underwater-app/map.html

# JSON content
git add avnei-yesod/underwater-app/data/island-05-words/

# Mechanics
git add avnei-yesod/underwater-app/js/templates/mechanic-word-merge.js
git add avnei-yesod/underwater-app/js/templates/mechanic-tap-word.js
git add avnei-yesod/underwater-app/js/templates/mechanic-word-vs-word.js
git add avnei-yesod/underwater-app/js/templates/mechanic-match-word-to-image.js
git add avnei-yesod/underwater-app/js/templates/mechanic-word-build.js

# Stage HTMLs
git add avnei-yesod/underwater-app/stage-5-island.html
git add avnei-yesod/underwater-app/stage-5-word-merge.html
git add avnei-yesod/underwater-app/stage-5-word-build.html

# Scripts
git add avnei-yesod/underwater-app/scripts/generate-island-05-word-audio.py
git add avnei-yesod/underwater-app/scripts/test-word-adapter.js
git add avnei-yesod/underwater-app/scripts/test-island-5-integration.js

# Audio (assets are large but content)
git add avnei-yesod/underwater-app/assets/audio/island-05-words/

# Handoff docs
git add avnei-yesod/_handoff/agent-completion-log.md
git add avnei-yesod/_handoff/2026-05-30-island-05-completion-report.md
git add avnei-yesod/_handoff/2026-05-30-island-05-vocab-gaps.md
git add avnei-yesod/_handoff/2026-05-31-island-05-completion-agent-bootstrap.md

git status --short
```

**אחרי `git status`:** ה-staged area צריך להכיל את כל הנ"ל. ה-unstaged area צריך להכיל רק את הקבצים הלא-של-אי-5 (`_tmp_doc.*`, `_voice-diag.html`, `teacher-action-v2.html`, `flow-slides-mockup.html`, `scripts/e2e/11-12`, `inclusion/`).

**אם יש משהו של אי 5 ב-unstaged או משהו שלא-של-אי-5 ב-staged → לעצור ולשאול.**

### שלב 6 · קומיט

```bash
git commit -m "$(cat <<'EOF'
island 5 (blending · words from shells): completion · 62 words · audio · map node

- Added [B1: 2 / B2: 4 + L4 bucket] words to L3 closing vocab gap (49→62/64)
- Generated [60/64] MP3 via edge-tts AvriNeural (BKP dagesh validated)
- Map node restored — island 5 accessible from main map
- 13 test suites · 1100+ assertions · 0 regressions
- Mechanics: word-merge (primary) · tap-word · vs-word · match-image · word-build
- sub-BKT per word-length (3 buckets) wired in bkt.js
- WORD skill type wired in skill-units.js (no regressions to LETTER/VOWEL/ORAL_SKILL)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### שלב 7 · דיווח לתזמורת

צור `_handoff/2026-05-31-island-05-completion-agent-report.md`:

```markdown
# Completion Report — סוכן השלמת אי 5 · 31.5.2026

## Status
✅ Committed locally · Awaiting orchestrator push

## Decision taken
- B1 / B2 (סמן)

## What was done
1. Added X words to L3 (list them)
2. Generated Y MP3 files (list new ones)
3. Added map node at right:48% top:30%
4. 13 test suites passing · 0 regressions

## What's NOT in the commit (intentionally left for other agents/decisions)
- _tmp_doc.txt/xml (B.7 work, agent פדגוגי)
- teacher-action-v2.html (UI experiment, ?)
- _voice-diag.html (debug page, ?)
- scripts/e2e/11/12-*.spec.js (presentation work, ?)
- inclusion/ (different project)
- flow-slides-mockup.html (presentation work)

## For Meytal — manual test before pilot
1. פתח map.html — אי 5 נראה במיקום?
2. לחץ אי 5 → stage-5-word-merge.html
3. עבור 5 סבבים — האם:
   - אודיו ב/כ/פ נשמע עם דגש קל (לא /va/)?
   - ה-celebration נורה רק אחרי mastery אמיתי?
   - נוני קבועה ב-scene-bg של underwater?
   - ניקוד מלא בכל הטקסט?
4. אם נכשל ב-1-4 → דווח לתזמורת לתקן.

## Files in commit
[list of files]
```

ואז מקרא לתזמורת:
> "🐚 סוכן השלמת אי 5 סיים. commit מקומי `<hash>`. 0 regressions. ראה `2026-05-31-island-05-completion-agent-report.md`. ממתין ל-push."

**אסור לדחוף בעצמך.**

---

## Memory חובה לסוכן זה

- `reference-avnei-yesod-island-build-checklist` — **MUST READ.** 11 הלקחים מאי 4. ההפקה של MP3 + map node צריכה להיות consistent איתם.
- `reference-hebrew-bgd-kpt-dagesh-rule` — חובה לוודא ש-`generate-island-05-word-audio.py` validation עובד. מילים עם ב/כ/פ דגש כמו `בָּת`, `בָּא`, `בְּרֵכָה` חייבות /b/, לא /v/.
- `feedback-avnei-yesod-noni-narrative-and-visuals-consistency` — map node של אי 5 בעולם תת-מימי. theme = "צדפים".
- `feedback-avnei-yesod-niqud-on-student-screens` — אם נדרש לשנות UI strings, ניקוד מלא חובה.
- `feedback-orchestrator-multi-vscode-parallel-pattern` — אתה רץ במקביל לתזמורת. אסור לדרוס קבצים שלא ערכת.

---

## Appendix B2 — אם נבחר L4 bucket (post-pilot scope)

אם מיטל בחרה B2 (לא מומלץ ל-pilot), פעולות נוספות:

1. **JSON:**
   ```
   data/island-05-words/words-level-4.json   # 2 entries: תְּמוּנָה · חֲנֻכִּיָּה
   ```
   עדכן `_schema.md` להוסיף "5cv = 5 base letters" sections.

2. **word-adapter.js:**
   - הוסף `WORDS_5CV` constant
   - הוסף 'תְּמוּנָה' ו-'חֲנֻכִּיָּה' עם מפתחות `tav-mem-vav-nun-hey-tmuna` ו-`het-nun-kaf-yud-hey-chanukia`
   - עדכן `getWords(level)` ל-`level <= 4`
   - הוסף ל-`classifyWordLevel()`: `if (count === 5) return 4`
   - תוודא ש-`decompose()` מתפקד עם 5 אותיות

3. **bkt.js:**
   - `ISLAND_5_WORD_LENGTHS = [2, 3, 4, 5]` (היה `[2, 3, 4]`)
   - `WORD_LENGTH_DISPLAY_HE[5] = "מילה של 5 אותיות"` (או דומה — לא להמציא ניסוח פדגוגי)
   - `emptyIsland5Record()` — לוודא `per_word_length` יוצר גם entry ל-5cv
   - `ensureAllWordLengthsIn()` — להוסיף 5cv אם חסר
   - `getWordLengthMasteryDistribution()` — לכלול 5cv

4. **tests:**
   - הוסף 4 קטגוריות ב-`test-word-adapter.js` (level 4 file exists · classify · decompose · sync with adapter)
   - הוסף קטגוריה ב-`test-island-5-integration.js` (sub-BKT 4 buckets)

5. **audio:**
   - הסקריפט יזהה אוטומטית את ה-2 מילים החדשות אם הוסיפו אותן ל-WORDS_5CV.

---

## Verification checklist (מה התזמורת תבדוק לפני push)

- [ ] git diff מראה רק תוספות לאי 5 — אפס שינויים בקבצי curriculum מאושרים
- [ ] 13 test suites passing
- [ ] MP3 count = 62 (B1) או 64 (B2)
- [ ] map.html יש 1 node חדש לאי 5 בלבד
- [ ] `_handoff/2026-05-31-island-05-completion-agent-report.md` קיים
- [ ] commit message מציין מספר מילים + decision (B1/B2)

---

*Bootstrap זה נכתב ע"י סוכן התזמורת ב-31.5.2026. עודכן לפי מצב אמיתי של working tree, לא לפי ה-completion-report של 30.5 שהיה תוחלת זמן.*
