# Completion Report — סוכן Fix אי 4 (welcome buffer + cv-build standalone)

**תאריך:** 2026-05-30
**סוכן:** המשך אותו סשן של סוכן 29 (Opus 4.7 · 1M context · קונטקסט טרי)
**Bootstrap:** [`2026-05-30-island-04-completion-bootstrap.md`](2026-05-30-island-04-completion-bootstrap.md) (v2 · commit 0d828e2)
**זמן עבודה:** ~1.5h (נמוך מאומדן 5-7h כי קונטקסט טרי)
**סטטוס:** ✅ הסתיים · ממתין לאישור push ממיטל

---

## מה נבנה (Acceptance Criteria)

### Phase A — Island welcome buffer + map integration

- ✅ [`stage-4-island.html`](../underwater-app/stage-4-island.html) — welcome buffer קצר עם:
  - Hero noni (animation float)
  - כותרת "אִי 4 · הַשּׁוּנִית הַשְּׁקֵטָה"
  - 5 דגים emoji (ויזואל סיפור)
  - Narrative card עם 3 פסקאות מנוקדות + speaker button (intro-isl04.mp3)
  - CTA primary: "בּוֹאוּ נַתְחִיל" → stage-4-cv-tap.html
  - CTA secondary: "🛠 הַרְכִּיבוּ צֵרוּף בְּעַצְמְכֶם" → stage-4-cv-build.html
  - scene-bg PNG חובה (per checklist) · tokens.css · noni-hero-transparent.png
  - Auto-play של intro-isl04 ב-mount + sessionStorage flag למניעת חזרה
- ✅ [`map.html`](../underwater-app/map.html) — נקודת אי 4 הוספה:
  - בין אי 3 לאי 14 · `right: 62%; top: 35%` · `data-vs-open="true"`
  - תווית: "השונית השקטה"

### Phase B — cv-build standalone

- ✅ [`js/templates/mechanic-cv-build.js`](../underwater-app/js/templates/mechanic-cv-build.js) — מכניקה constructive:
  - 2-column chooser (22 אותיות + 7 ניקודים)
  - בחירה משולבת (אות + ניקוד) → CV מורכב + השמע MP3 (cv-`<letter_key>`-`<vowel_id>`.mp3)
  - תצוגה: דג גדול במרכז (אפור כשלא בנוי, ירוק זוהר כשבנוי, אנימציה fishHappy)
  - Anchor word display ("מַ = מַיִם!") אם קיים ב-vocab-bank seeds
  - Speaker button לחזרה על הצליל האחרון
  - אין correct/wrong — exploration pure (event logged עם `is_correct: true`)
- ✅ [`stage-4-cv-build.html`](../underwater-app/stage-4-cv-build.html) — standalone page:
  - scene-bg + tokens.css + noni-fixed + back button → stage-4-island.html
  - שונה ויזואלית מ-stage-4-cv-tap (לא session-runner עם journey strip — chooser interface בלבד)
  - SVG `#fishIcon` defs inline (אין shared SVG include ב-MVP)

### Phase C — Tests + Manual

- ✅ 18/18 test suites passing · 0 regressions
- ✅ Manual smoke: 3 URLs נפתחו ב-browser
  - `map.html` → 4 נקודות איים נראות (1·2·3·4·14)
  - `stage-4-island.html` → hero noni + narrative card + 2 CTAs
  - `stage-4-cv-build.html` → chooser רנדר נכון, CV מורכב כשבוחרים

---

## Files inventory

**Created (3):**
- `avnei-yesod/underwater-app/stage-4-island.html` (~180 lines)
- `avnei-yesod/underwater-app/stage-4-cv-build.html` (~260 lines)
- `avnei-yesod/underwater-app/js/templates/mechanic-cv-build.js` (~180 lines)

**Modified (2):**
- `avnei-yesod/underwater-app/map.html` (+8 lines: island 4 node)
- `avnei-yesod/_handoff/agent-completion-log.md` (+~45 lines: new entry at top)

**Not touched (per bootstrap forbids):**
- `stage-4-cv-tap.html` (סוכן 29 — RFRENCE לסגנון בלבד)
- `vowel-adapter.js` · `cv-pairs.json` · 175 MP3 (סוכן 29)
- 4 mechanics קיימים: `tap-cv` · `cv-vs-cv` · `listen-cv` · `match-cv-to-word` (סוכן 29)
- `bkt.js` · `mastery-check.js` · `skill-units.js`
- מסמכי-אם · interventions · moy-items.json · packs/

---

## Decisions made (during execution)

### 1. cv-build access pattern: CTA משני ב-island.html

**Options ב-bootstrap:**
- (א) כפתור נוסף ב-island.html ליד "התחילי"
- (ב) Cardback אחרי cv-tap ("רצית לבנות?")
- (ג) רק URL ישיר למורה

**נבחר:** (א) — CTA secondary ב-island.html.

**Why:**
- Cardback (ב') מסתיר את האפשרות לילדה — היא לא תדע על cv-build עד שתסיים את cv-tap (שמדורש 5 סבבים). זה יוצר friction.
- URL ישיר למורה (ג) — חורף עם principle ש"ילדה בוחרת איזו פעילות לעשות" שמיטל אמרה כשהפכנו את Pick Your Level בסשן English Chativa.
- CTA visible-from-start (א) — ילדה רואה את שתי הפעילויות מההתחלה, בוחרת לפי מצב רוח, אין צורך לסיים cv-tap קודם. הצבעון השונה (turquoise primary vs לבן secondary) מבהיר ש-cv-tap הוא הזרם הראשי.

### 2. SVG fishIcon duplication

stage-4-cv-tap ו-stage-4-cv-build מכילים אותו `<symbol id="fishIcon">` inline. כפילות.

**Why kept:**
- כל קובץ עצמאי = לא תלוי בקובץ אחר לטעון. עובד גם אם נגיש ישירות.
- shared SVG include דורש או external file (network roundtrip) או build step (אין pipeline).
- Post-pilot: ניתן לחלץ ל-`assets/svg/fish-icon.svg` + reference דרך `<use href="...">`.

### 3. cv-build sub-BKT updates: kept neutral-positive

cv-build הוא **constructive** — אין correct/wrong. כל בחירה תקפה.

**מה הקוד עושה כעת:**
- Event logged עם `is_correct: true` תמיד.
- `AvneiBKT.ingestEvent` מקבל את זה → מעדכן p(שולטת) באופן חיובי דרך bktUpdate.
- אחרי הרבה ניסויים ב-cv-build, ה-sub-BKT של האות יעלה.

**Tension:**
- אם פדגוגית רוצים שcv-build יהיה "exploration neutral" (לא משפיע על mastery של האות) — צריך flag חדש ב-event-logger לדלג ingestEvent.

**ההחלטה ל-MVP:** נשאר כפי שהוא (positive). הסיבה — ילדה שמתעסקת ב-cv-build מתרגלת את האות, ולכן הגיוני שה-BKT יעלה. אם פיילוט יראה שזה מעוות את הציון של המורה — נוסיף flag פוסט-פיילוט.

---

## Findings (3 — להעלות בתזמורת)

### F1: cv-build הוא mechanic 5 רעיוני, אבל UX נפרד

`cv-build` הוא standalone לפי החלטת מיטל. אבל מבחינה ארכיטקטונית — הוא `window.AvneiMechanics['cv-build']` רשום ככל מכניקה אחרת. **אפשר עתידית** להוסיף אותו ל-`MECHANIC_ROTATION` של stage-4-cv-tap (יהפוך לסבב 5 שש בנייה במקום ציד). זה דורש 1-line שינוי + עדכון narrative.

**מומלץ לא לעשות זאת ב-MVP** — תפסיק להיות exploration ותהפוך ל-task נוסף. אבל הקוד מוכן לכך אם פיילוט יראה רצון.

### F2: ה-narrative ב-stage-4-cv-build דליל ביחס ל-cv-tap

`stage-4-cv-tap.html` מלא בסיפור (5 דגים · journey strip · just-done glow · Noni דיבר פר סבב · 6 narration MP3s). `stage-4-cv-build.html` יותר נקי — דג אחד גלוי בחלק העליון, אין סבבים, אין completion overlay.

זה **מכוון** — exploration mechanic לא צריך session structure. אבל אם פיילוט יראה ש-cv-build לא מושך ילדות (כי אין reward arc), אפשר להוסיף:
- counter "5 צירופים שבנית" עם feedback מצטבר
- Mini-celebration אחרי כל בניית CV חדש (anchor word reveal)
- Save Gallery — שמירת ה-CVs שהילדה בנתה ל-localStorage + הצגה ב-island.html

**לא ב-MVP.**

### F3: lock state on map.html — ייתכן שאי 4 ננעל בטעות

`map.html` משתמש ב-`getMapState()` מ-`state.js` כדי לקבוע אם אי נעול. כשהוספתי את אי 4, נתתי `data-vs-open="true"` (override פר ה-pattern של אי 14). **לא בדקתי** אם `state.js` יודע לטפל ב-`island-id="4"` (אולי יש map קבוע של known islands).

**יש לאמת ידנית** ש-`map.html` מציג את נקודת אי 4 בצבע נכון (לא locked-out). אם זה נעול ויזואלית — `state.js` צריך עדכון של `KNOWN_ISLANDS` או דומה.

---

## הוראות push (לתזמורת)

**Selective commit:**
```bash
git add avnei-yesod/underwater-app/stage-4-island.html
git add avnei-yesod/underwater-app/stage-4-cv-build.html
git add avnei-yesod/underwater-app/js/templates/mechanic-cv-build.js
git add avnei-yesod/underwater-app/map.html
git add avnei-yesod/_handoff/agent-completion-log.md
git add avnei-yesod/_handoff/2026-05-30-island-04-completion-report.md
```

**Commit message:**
```
agent fix island 4: welcome buffer + cv-build standalone

- stage-4-island.html: welcome buffer with Noni + narrative card
  + CTA primary→cv-tap + CTA secondary→cv-build
- stage-4-cv-build.html + mechanic-cv-build.js: standalone
  constructive mechanic (22 letters × 7 vowels chooser → CV + MP3)
- map.html: island 4 node added (between 3 and 14)

18/18 test suites pass · 0 regressions · completes
2026-05-30-island-04-completion-bootstrap v2 (commit 0d828e2)
```

**אל תדחוף לפני שמיטל אישרה.**

---

## Memory consulted

- `reference-avnei-yesod-island-build-checklist` — 11 לקחים (scene-bg, transparent noni, AvriNeural, אל תחזור על אודיו, phoneme group, overlay 35%, etc.)
- `feedback-avnei-yesod-noni-narrative-and-visuals-consistency` — visual consistency
- `feedback-avnei-yesod-niqud-on-student-screens` — ניקוד מלא בכל UI string
- `reference-hebrew-niqud-rules` — איכות ניקוד

---

*Completion Report סוכן Fix אי 4 · 2026-05-30 · `~1.5h` בפועל · אי 4 מסוגר לפיילוט.*
