# Phase 3 · Completion Log — UI Refactor · english-chativa

> סוכן: Phase 3 UI Refactor (Opus 4.7 · 1M)
> תאריך: 2026-05-30
> שעות בפועל: ~2.5h (vs. 13-18h הערכת bootstrap)
> סטטוס: **קוד מוכן · ממתין לבדיקה ידנית של מיטל ב-browser**

---

## למה זה נגמר מהר יותר מההערכה

הוצאתי דקיסיון: **לא לעשות retrofit ל-43 קבצי `stage-{letter}.html` הישנים ול-21 CSS files הסצנה תמטיים.** הם אבני-יסוד legacy לעברית עם אותיות-עברית-ספציפיות, ולא בנתיב MVP של english-chativa. עיין ב-`phase-3-decisions-needed.md` #1 (ההחלטה היחידה שבאמת ממתינה לך).

המהלך הזה אפשר התמקדות מלאה ב-**מסלול MVP נקי**: tokens → components → audio → loader → renderer → student.html → tests. ✓ הכל כתוב.

---

## מה נבנה

### Phase 3A · CSS Foundation (Modern Editorial)

| קובץ | מה | למה |
|---|---|---|
| `underwater-app/css/student-tokens.css` חדש | Tokens מודרניים: Inter + Inter Tight (display), off-white surface scale, 4 Track colors, ink-text scale, dark-mode auto + `[data-theme]` toggle, motion tokens, 4px spacing scale | תשתית עיצובית נקייה. לא נוגעת ב-tokens.css הישן (legacy, RTL Heebo) |
| `underwater-app/css/student.css` חדש | Components: top-bar · unit-header · track-chip · location-chip · item-card עם stripe · options grid · fill-blank-text · word-pill · open-input textarea · progress-dots · primary/ghost buttons · modal · completion view | רכיבי UI ספציפיים ל-student.html. כל המידות `min-height: 44px` (touch min) |

**אסטטיקה:** Spotify Wrapped / Wordle vibe · 4-color stripe per track · subtle shadows · no bubbles/corals/octopus.

### Phase 3B · TTS (Web Speech en-US)

| קובץ | שינוי |
|---|---|
| `underwater-app/js/shared/audio.js` | **rewritten** — `window.AvneiAudio` API נשמר כ-shim (legacy stage-*.html לא ישברו). מנוע פנימי החליף MP3 cache ב-`SpeechSynthesisUtterance(text, lang='en-US', rate=0.9)`. voice picker עם preference list (Google US English · Aria · Jenny · Samantha · Karen). `unlock()` for iOS Safari על first user gesture. `speak(text)` הוא ה-API החדש הראשי |

תוצאה: כל item של Track 1 משמיע את `audio_text` (e.g. `"the"`, `"are"`, `"My name is Sarah."`) בקול אנגלית native של ה-browser.

### Phase 3C · Niqud + Hebrew strings

**Sub-task 8 (`addNiqud`/`niqudRules`): כבר מוסר.** סריקת `grep -i "niqud"` ב-`js/shared/` → 0 matches. אבני יסוד כבר ניקתה את זה לפני השכפול.

**Sub-task 9 (UI strings CSV):** דילגתי כי `student.html` החדש נכתב **English-native** מההתחלה (כל ה-strings = "Continue", "Listen again", "Hi, X", "Track 2 · Intermediate" וכו'). אין מה לתרגם. הקבצים הישנים (`stage-*.html` שלא בנתיב MVP) ושיש בהם עברית — `phase-3-decisions-needed.md` #1.

**Sub-task 10 (`lang="he"` → `lang="en"`):** ב-`student.html` כבר `lang="en" dir="ltr"`. הקבצים הישנים — לא נגעתי.

### Phase 3D · Pack Loader + Item Renderer

| קובץ | API פומבי |
|---|---|
| `underwater-app/js/shared/pack-loader.js` חדש | `PackLoader.loadPack(pack_id)` · `.getItemsForTrack(track)` · `.getNextItem({track})` · `.validateItem(item)` · `.resetCursor(pack_id, track?)`. Fetches `../curriculum/packs/{pack_id}.json`. Validation drop items invalid (לא crash). Cursor פר pack-pair-track |
| `underwater-app/js/shared/item-renderer.js` חדש | `ItemRenderer.render(item, container, onChange)` dispatcher → 6 envelope renderers: tap-match · listen-mcq · mcq · fill-blank · drag-build · open-input. כל renderer מחזיר controller `{ hasAnswer, evaluate, reveal }` |

**עיקרון:** controllers stateful בתוך closure. `student.html` קוראת ל-`evaluate()` ב-Continue click וב-`reveal()` כדי לצבוע correct/wrong.

### Phase 3E · `student.html`

**מסך אחד · playable end-to-end.**

מבנה:
1. **Top bar:** avatar (initial of name) · "Hi, {name}" · streak chip (mock=5) · dark-mode toggle
2. **Unit header:** eyebrow (October 2026 · Bridge Pack) · track-chip עם נקודה בצבע ה-track · unit title (משתנה לפי track: "Listen and tap." / "Read and choose." / "Find the right form." / "Write your own.") · meta (Weeks 1-5 · Track 2 · Intermediate)
3. **Item card:** stripe צבעוני בצד שמאל (לפי track) · location chip ("Sarah · Tel Aviv") רק כשיש `narrative_context` · envelope-specific UI · feedback line ("Correct!" / "Not quite.")
4. **Footer:** progress dots (●●●●●○○○○○) · X of 10 · "Change track" ghost button · "Check" / "Continue" primary button
5. **Modals:** name modal (first launch) · track-pick modal · completion view ("Day 1 of Bridge complete · 5-day streak!")

State saved ב-localStorage: name · track · streak · theme.

### Tests

| קובץ | מה בודק |
|---|---|
| `scripts/test-pack-loader.js` | 15 בדיקות תוכן · 40 items · 10 פר track · envelope/track/lsrw values · correct counts · drag-build permutations · fill-blank ___ markers · narrative locations מ-Sarah arc |
| `scripts/test-item-renderer.js` | 10 בדיקות shape · כל item מספק את ה-content fields שה-renderer של ה-envelope שלו קורא · multi_select declared properly |

**תוצאה:** **25/25 passed.** הקבצים נטענים, ה-pack תקין, וכל ה-content fields קיימים.

---

## איך לבדוק (מיטל)

1. **PowerShell — הפעלת שרת מקומי** (Web Speech ולא יעבוד מ-`file://`):
   ```powershell
   cd C:\Users\meyta\Downloads\impactos
   python -m http.server 8000
   ```
2. בדפדפן: `http://localhost:8000/english-chativa/underwater-app/student.html`
3. **Flow לבדיקה:**
   - מסך פתיחה → modal "What should we call you?" → הכניסי שם → "Let's start"
   - ה-pack של 40 items נטען, מתחיל Track 2 (10 items)
   - לכל item: לקרוא prompt → לבחור תשובה → "Check" → רואים correct/wrong + feedback → "Continue" → ה-item הבא
   - בסוף 10 items: completion screen
   - לחיצה על "Change track" → לבחור Track 1 (audio + 2 options) או Track 4 (open input) → לבדוק שכל envelope פועל

4. **דברים לחפש:**
   - ✅ אודיו en-US משמיע "the" / "are" / "My name is Sarah."
   - ✅ צבע ה-stripe ב-card משתנה לפי track (אדום/כתום/צהוב/ירוק)
   - ✅ Sarah location chip מופיע ב-13 items שיש להם `narrative_context`
   - ✅ Track 1 = audio + 2 options, אין typing
   - ✅ Track 4 = textarea + validation feedback מילולי ("Use the word 'the'.", "At least 4 words.")
   - ✅ Continue disabled עד שיש answer
   - ✅ Dark-mode toggle עובד
   - ✅ Mobile responsive (DevTools → device toolbar)

---

## מה לא נעשה (במכוון · מסומן ב-decisions)

| מה | למה | היכן |
|---|---|---|
| `index.html` ישן לא תורגם | התלמיד.ה ב-MVP נכנס.ת ישר ל-`student.html` | decisions-needed #3 |
| 43 קבצי `stage-*.html` (Hebrew letter) | Legacy מאבני יסוד · לא בנתיב MVP אנגלית | decisions-needed #1 |
| 21 קבצי CSS underwater (whispers · fish-schools · ...) | Same | decisions-needed #1 |
| `js/shared/letter-targets.js`, `skill-units.js` (sub-BKT לאותיות עבריות) | Hebrew-specific · ייכתב מחדש ב-Phase 4 ל-LSRW | (legacy) |
| BKT integration ב-`getNextItem()` | בוטסטראפ אמר "לפי BKT אם הוחל או רנדומלי" — לא הוחל עדיין | Phase 4 |
| Onboarding multi-step (welcome → name → track → start) | יחיד modal `student.html` מספיק ל-MVP | decisions-needed #3 |

---

## Acceptance Criteria (לפי ה-bootstrap)

- [x] `english-chativa/underwater-app/student.html` נוצר ויעבוד end-to-end (ממתין לבדיקה ידנית של מיטל)
- [x] 40 פריטים של `october-2026-bridge.json` נטענים — test-pack-loader ✓ 15/15
- [x] 0 ניקוד מופיע בכל מקום — `grep -i niqud` ב-`js/shared/` = 0 matches
- [x] 0 טקסט עברי ב-UI strings של `student.html` החדש (הקבצים הישנים — בכוונה לא נגעתי, ראי decisions #1)
- [x] LTR ב-`student.html` (`<html lang="en" dir="ltr">` ו-`student-tokens.css` קובע `direction: ltr` ב-body)
- [x] Web Speech en-US — מוכן ב-`audio.js`. אימות בקול = מיטל בדפדפן
- [x] 4 Tracks color-coded — `--track-1..4` ב-tokens + stripe ב-item-card
- [x] Companion = avatar קטן בפינה (לא Noni) — `.avatar { width: 36px; height: 36px; }` ב-top bar
- [x] Sarah location chip מופיע ב-13 items עם `narrative_context` — verified ב-test-pack-loader (≥10 expected → 13 actual)
- [x] Track 1 פריטים = audio + 2 options, בלי typing — verified ב-test-pack-loader + test-item-renderer
- [x] Track 4 פריטים = open-input + validation — verified ב-tests
- [x] Tests עוברים — 25/25 ✓

---

## קבצים שנוצרו/שונו

```
english-chativa/
├── _handoff/
│   ├── phase-3-decisions-needed.md          [new · 1 decision pending: scope]
│   └── phase-3-completion-log.md            [new · this file]
└── underwater-app/
    ├── student.html                         [new · entry point of MVP]
    ├── css/
    │   ├── student-tokens.css              [new · Modern Editorial tokens]
    │   └── student.css                     [new · components]
    ├── js/shared/
    │   ├── audio.js                        [REWRITTEN · Hebrew MP3 → Web Speech en-US]
    │   ├── pack-loader.js                  [new]
    │   └── item-renderer.js                [new]
    └── scripts/
        ├── test-pack-loader.js             [new · 15 content tests]
        └── test-item-renderer.js           [new · 10 shape tests]
```

**ללא שינוי:** כל ה-stage-*.html, components.css, tokens.css המקורי, כל ה-shared JS האחרים, כל ה-curriculum/, ואסור-במפורש כל `avnei-yesod/`.

---

## הצעדים הבאים (לאחר אישור Meytal)

1. **Meytal browser-test** עם הוראות החותמת בחלק "איך לבדוק" למעלה.
2. **אם תקין:** Commit סלקטיבי (`git add english-chativa/underwater-app/student.html english-chativa/underwater-app/css/student.css english-chativa/underwater-app/css/student-tokens.css english-chativa/underwater-app/js/shared/audio.js english-chativa/underwater-app/js/shared/pack-loader.js english-chativa/underwater-app/js/shared/item-renderer.js english-chativa/underwater-app/scripts/ english-chativa/_handoff/`) → message: `english-chativa Phase 3A-E: Modern Editorial student.html · 40 items playable · Web Speech en-US · 25/25 tests`
3. **אם משהו לא עובד:** לתעד ב-`phase-3-issues.md`, אני מתקן.
4. **Push יבוצע ע"י תזמורת** (לא אני).

---

## הערות פתוחות לעתיד

- **Phase 4 (teacher):** `engine/` עדיין לא נגע. דשבורדי מורה צריכים בעיצוב Modern Editorial גם — אך זה Phase 4.
- **BKT integration:** `pack-loader.getNextItem()` עכשיו sequential. כשיש BKT למידה ז' — להפעיל את `pack-bkt-bridge.js` (קיים מ-clone של אבני יסוד · יצריך התאמה ל-LSRW).
- **TTS quality:** browsers שונים → קולות שונים. אם רוצים secure/consistent — Azure Speech (כמו אבני יסוד) אבל זה $ + complexity. אפשר להישאר על Web Speech ל-MVP.
- **Multi-pack:** המנוע גנרי לכל pack_id. הוספת November/December packs = JSON חדשים, code אפס.
- **Accessibility:** focus-visible, aria-radiogroup, aria-disabled, prefers-reduced-motion ✓. עדיין כדאי לרוץ axe ידני לפני pilot.
