# Bootstrap — סוכן Phase 3 · UI Refactor · english-chativa

> **למיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש (Opus 4.7 · 1M). סוכן יישום (לא תזמורת). עובד **רק** תחת `english-chativa/`. אסור לגעת ב-`avnei-yesod/`. אומדן: 13-18 שעות.

---

# שיחה חדשה — סוכן Phase 3 · UI Refactor של english-chativa

## מטרה

לקחת את המנוע ששוכפל מאבני יסוד (כיתה א' עברית) ולהפוך אותו ל-**playable לכיתה ז' אנגלית**. בסוף Phase 3 — מיטל פותחת browser, רואה את 40 ה-items של `october-2026-bridge.json` רצים בעיצוב Modern Editorial לדור ז'.

**אומדן:** 13-18 שעות עבודה. **Single ownership.**

## הקשר — מצב פרויקט (סוף Day 1 · 29-30.5.2026)

ה-tzmורת (סשן קודם) השלימה:
- ✅ Phase 0: שכפול avnei-yesod → english-chativa (24M · 350 קבצים)
- ✅ Phase 1: Schema layer (5 קבצים approved · 50 sight words · 80 chunks · 14 grammar · 36 can-dos · Sarah narrative arc)
- ✅ Phase 2: First pack (40 items × 4 tracks · 6 mechanics approved)

**אתה לוקח את הקוד ששוכפל מאבני יסוד ועושה לו productization לאנגלית.**

## קבצים חובה לקרוא (לפני כל עבודה)

1. **Architecture** (אל תשנה):
   - `english-chativa/curriculum/_schema/curriculum-2020-master.md` — 3 השכבות (תוכן/מדידה/ארגון)
   - `english-chativa/curriculum/_schema/item-schema.json` — schema של item יחיד
2. **תוכן ה-MVP** (אל תשנה):
   - `english-chativa/curriculum/packs/october-2026-bridge.json` — 40 items שתציג
   - `english-chativa/curriculum/_schema/extracted/*.json` — vocab/grammar/can-dos
   - `english-chativa/curriculum/_schema/narrative-arc-grade7.json` — Sarah + 8 locations
   - `english-chativa/curriculum/cefr-targets/grade-7-pre-a1-to-a1.json` — 4 Tracks + colors
3. **קוד מקור משוכפל** (זה מה שאתה עורך):
   - `english-chativa/underwater-app/` — UI לתלמיד.ה (כל ה-HTML/CSS/JS)
   - `english-chativa/engine/` — דשבורדי מורה (later · Phase 4)
4. **Reference** (למקרי השוואה):
   - `english-chativa/_reference/avnei-yesod-architecture-mvp.md` — איך זה עובד ב-עברית
   - `english-chativa/_reference/avnei-yesod-spec.html`
5. **Memory** (יטען אוטומטית):
   - `project-english-chativa-3-layer-architecture` — ה-3 שכבות
   - `project-english-chativa-phase-1-approved` — מה אושר
   - `reference-tnufa-english-curriculum-2020` — alignment רשמי

## המשימה — 5 תת-שלבים

### Phase 3A — CSS Refactor: RTL → LTR + Font + Colors (3-4h)

הקוד המשוכפל מאבני יסוד הוא RTL בעברית. אנגלית = LTR.

1. ☐ סרוק `english-chativa/underwater-app/css/*.css` ו-`underwater-app/*.html`:
   - `dir="rtl"` → `dir="ltr"`
   - `direction: rtl` → `direction: ltr` (או הסר)
   - `text-align: right` → `text-align: left` (או start)
   - `margin-right`/`padding-right` בתפקיד "logical end" → `margin-inline-end`
   - הפוך CSS sticky positioning שמתבסס על right→left
2. ☐ החלף font:
   - Heebo (Hebrew) → **Inter** (כל ה-CSS files)
   - Rubik → **Söhne** או **Inter Display** (headings)
   - גודל בסיס 16px נשאר (universal)
3. ☐ Update color palette (לפי `cefr-targets/grade-7-pre-a1-to-a1.json`):
   - Track 1 (בסיסי): `#C03847` (אדום) — נשאר
   - Track 2 (בינוני): `#E07A2E` (כתום) — נשאר
   - Track 3 (מתקדם): `#E8A849` (צהוב) — נשאר
   - Track 4 (העמקה): `#4A9B7F` (ירוק) — נשאר
   - **Background palette** לקרר: avnei-yesod cream/teal → off-white או dark mode default
   - **Modern Editorial vibe** — לא ילדותי. Spotify Wrapped / Wordle aesthetic
4. ☐ Test ויזואלי: open `english-chativa/underwater-app/index.html` ב-browser. אם RTL spillover — תקן.

### Phase 3B — TTS: AvriNeural → Web Speech en-US (1-2h)

5. ☐ סרוק `english-chativa/underwater-app/js/shared/audio.js`:
   - הסר/דלג קוד שמשתמש ב-AvriNeural API (Azure he-IL)
   - החלף ב-`SpeechSynthesisUtterance(text, {lang: 'en-US'})` — native browser API
   - Voice selection: ברירת מחדל male/female natural
   - Speed: 0.9 (קצת איטי לתלמידי A1)
6. ☐ ב-MOY/screener/onboarding HTMLs — אם יש קריאות ישירות ל-Azure — החלף.
7. ☐ Test: item עם `audio_text: "the"` משמיע "the" בקול אנגלי native.

### Phase 3C — Niqud Removal + UI Strings Translation (3-4h)

8. ☐ סרוק `english-chativa/underwater-app/js/shared/` ל-functions של ניקוד:
   - `addNiqud()`, `niqudRules`, `withNiqud` — הסר/no-op
   - אם יש מקומות שמקבלים text + ניקוד → רק text
9. ☐ סרוק כל ה-HTML ל-UI strings בעברית — תרגם לאנגלית פשוטה (A1 level):
   - "התחל" → "Start"
   - "המשך" → "Continue"
   - "שמע שוב" → "Listen again"
   - "כל הכבוד" → "Great job!"
   - "טעות" → "Try again"
   - "בוקר טוב" → "Good morning"
   - "התקדמות" → "Progress"
   - **רשימה מלאה** — סרוק את ה-HTML, פלוט CSV שמכיל [string עברי, מיקום, תרגום מוצע], בקש אישור ממיטל.
10. ☐ Update `lang="he"` → `lang="en"` בכל ה-HTML.

### Phase 3D — Pack Loader + Item Renderer (3-4h)

11. ☐ צור `english-chativa/underwater-app/js/shared/pack-loader.js`:
    - `loadPack(pack_id)` → קורא `curriculum/packs/{pack_id}.json`
    - מחזיר `{meta, items}` — items mapped לפי track
    - `getItemsForTrack(track)` → 10 items
    - `getNextItem(student_id, pack_id)` → לפי BKT (אם BKT הוחל) או רנדומלי
12. ☐ צור `english-chativa/underwater-app/js/shared/item-renderer.js` — switcher לפי envelope:
    - `renderTapMatch(item, container)` — Track 1
    - `renderListenMcq(item, container)` — Track 1
    - `renderMcq(item, container)` — Track 2-3 (כולל multi_select)
    - `renderFillBlank(item, container)` — Track 2-3
    - `renderDragBuild(item, container)` — Track 2
    - `renderOpenInput(item, container)` — Track 4 (כולל validation)
13. ☐ Schema validation: וודא שכל item תואם `_schema/item-schema.json` לפני render. אם לא — log warning + skip.

### Phase 3E — Single Playable Screen (3-4h)

14. ☐ צור `english-chativa/underwater-app/student.html`:
    - Top bar: avatar + name ("Hi, Maya 👋") + streak counter (mock = 5)
    - Unit header: "UNIT 0 · BRIDGE" + week label
    - Item card area (מתחלף לפי item נוכחי)
    - Progress dots למטה (●●●●●○○○○○ X of 10)
    - "Continue" button
15. ☐ Logic:
    - בכניסה: בקש name → save ל-localStorage
    - load `october-2026-bridge.json`
    - בחר track default (התחל ב-Track 2 — middle ground · אופציה לשנות במסך onboarding)
    - render item 1 → click Continue → item 2 → ... → item 10
    - בסוף: "Day 1 of Bridge complete · 5-day streak!"
16. ☐ UI Style: Modern Editorial — לא mascot מקפץ. Companion = avatar קטן בפינה (לא Noni). Subtle micro-interactions. Dark mode optional toggle.
17. ☐ סיפור-על Sarah רק ב-13 items שיש להם `narrative_context`. בנה location chip קטן: "Sarah · Tel Aviv" ליד item card.

## Acceptance Criteria

- [ ] `english-chativa/underwater-app/student.html` נפתח ב-browser ועובד end-to-end
- [ ] 40 פריטים של `october-2026-bridge.json` נטענים ומוצגים נכון לפי envelope
- [ ] 0 ניקוד מופיע בכל מקום
- [ ] 0 טקסט עברי ב-UI strings (ייתכן בהערות בקוד או _handoff בלבד)
- [ ] LTR בכל המסכים
- [ ] Web Speech en-US משמיע נכון (test on `is`, `are`, `the`)
- [ ] 4 Tracks color-coded במידה ויזואלית
- [ ] Companion = subtle, Modern Editorial vibe, NOT Noni
- [ ] Sarah location chip מופיע ב-13 items עם `narrative_context`
- [ ] Track 1 פריטים = audio + 2 options · בלי typing
- [ ] Track 4 פריטים = open-input + validation
- [ ] Tests עוברים (אם קיימים — אם לא, צור: `scripts/test-pack-loader.js`, `scripts/test-item-renderer.js`)

## אסור לך

- ❌ **לערוך שום קובץ תחת `avnei-yesod/`** — היא ב-pre-pilot (ספטמבר 2026)
- ❌ לערוך `curriculum/_schema/*.json` או `_schema/extracted/*.json` — approved by Meytal
- ❌ לערוך `curriculum/packs/october-2026-bridge.json` items — Meytal אישרה את ה-mechanics
- ❌ להחליט פדגוגית עצמאית — אם חסר תוכן, שאל את מיטל
- ❌ להמציא מילים/grammar/can-dos שלא ב-extracted/
- ❌ Push בלי אישור מפורש של מיטל
- ❌ `git add -A` / `.` — commit סלקטיבי בלבד
- ❌ לעדכן `_reference/` (זה copy של אבני יסוד · context בלבד)

## מותר לך

- ✅ לערוך `english-chativa/underwater-app/` במלואו
- ✅ לערוך `english-chativa/_handoff/*.md` (לתעד את ההתקדמות שלך)
- ✅ ליצור tests תחת `english-chativa/underwater-app/scripts/`
- ✅ לערוך `english-chativa/README.md` (להוסיף status update)
- ✅ ליצור `_handoff/phase-3-completion-log.md` עם סיכום העבודה שלך

## תיאום עם סוכנים אחרים

- **סוכן 29 / 30 / 31 (avnei-yesod)** — לא חופף · אתה ב-english-chativa בלבד.
- **תזמורת** — לא פעילה כעת. אם נחוצה החלטה — bookmarki בקובץ `phase-3-decisions-needed.md`.

## הוראות עבודה

1. לפני כל change:
   ```
   git fetch origin && git status
   ```
2. אם יש שינויים בלתי-צפויים תחת english-chativa שלא שלך → STOP, log, שאל את מיטל.
3. commit סלקטיבי (`git add english-chativa/underwater-app/...`).
4. commit עם הודעה ברורה: `english-chativa Phase 3{A|B|C|D|E}: <summary>`.
5. אחרי כל sub-phase — Test ידני ב-browser + log ב-`_handoff/phase-3-completion-log.md`.
6. **לא push** — תזמורת תעשה.

## הצעד הבא

1. קרא את 4 קבצי החובה (1.1 + 2.1 + 2.4 + 3 + 5 מהרשימה).
2. ספר את הסטטוס בצ'אט (1-2 שורות).
3. התחל Phase 3A.

---

*Bootstrap זה הוא נקודת ההתחלה של Phase 3. סוף Phase 3 = MVP playable ראשון. אומדן: 13-18h.*
