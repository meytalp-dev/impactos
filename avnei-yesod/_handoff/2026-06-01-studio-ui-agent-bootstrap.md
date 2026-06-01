# Bootstrap — Studio-UI Agent · Teacher Content Studio · 1.6.2026

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש בVS Code A. אומדן: 1.5-2 ימי-סוכן.
>
> **בן-זוג:** Studio-Pipeline Agent (VS Code B, bootstrap נפרד). אתה צורך את ה-API שלו דרך `window.AvneiStudioPipeline`. אסור לגעת בקבצים שלו.

---

## הוראות תזמורת — מיטל · 1.6.2026

**הקשר:** מיטל עומדת ב-go-live ב-1.6.2026 עם 4 מורות שותפות (מיטל פלג · לירון גולן · אופיר שטיינברג · עמית אביטבול). כל מורה = כיתה, 5 ילדות. השותפות הן **הנסיינות** של אבני יסוד — הן מעירות הערות, לא רק משתמשות.

**המוצר:** Teacher Content Studio — כלי שמאפשר למורה להעלות תוכן משלה (אותיות, מילים, distractors), שיתחבר למנוע BKT/EPA הקיים ויתנתח ככל תרגול אחר.

**הסקופ שלך (UI layer):** wizard 3 שלבים + preview pane חי + validator עברי + feedback widget. **אתה לא בונה auto-tagger / niqud / tts — זה Pipeline agent.**

---

## מטרה

לבנות [avnei-yesod/underwater-app/teacher-studio.html](../underwater-app/teacher-studio.html) שמורה-שותפה (לירון · אופיר · עמית · מיטל) יכולה להיכנס אליו, ולבנות פריט תרגול תקני בלי לדעת מה זה `tier`, `rama_task_alignment`, או `letters_involved`.

**Acceptance של המוצר:**
- שותפה נכנסת ל-`teacher-studio.html?guest=1` (demo mode בלי cloud)
- בוחרת אי + סוג משחק (3 שלבים, hand-holding מקסימלי)
- ממלאת תוכן (אותיות/מילים/distractors)
- רואה preview חי במצב תלמיד.ה (iframe מימין)
- שומרת — הפריט נכנס ל-localStorage ב-format תקני של pack-schema
- אם יש שגיאה — הודעה בעברית פדגוגית, **לא** error codes
- בכל מסך — כפתור "ספרי לנו" לפידבק

---

## קבצים שאתה יוצר

```
avnei-yesod/underwater-app/
├── teacher-studio.html          ← NEW · entry point
├── css/
│   └── studio.css               ← NEW
└── js/
    └── studio/
        ├── wizard.js            ← NEW · 3-step state machine + UI
        ├── preview.js           ← NEW · live preview pane (iframe)
        ├── validator-ui.js      ← NEW · Hebrew error messages, maps validate-pack.js errors → human Hebrew
        └── feedback.js          ← NEW · floating "ספרי לנו" widget
```

**אסור לגעת בקבצים אחרים** מחוץ לרשימה הזו. ראה "אסור לך" למטה.

---

## API Contract — מה Studio-Pipeline נותן לך

הסוכן הבן-זוג מספק `window.AvneiStudioPipeline` עם הפונקציות הבאות. **אתה רק קורא להן — לא מממש.**

```js
window.AvneiStudioPipeline = {
  // Auto-tagging — מקבל draft חלקי, מחזיר item תקני עם כל השדות הנגזרים
  autoTag(draft) → {
    item_id, tier, type, letter, mechanic,
    rama_task_alignment, peima_target,
    letters_involved, challenge?
  },

  // Dicta API — מקבל טקסט לא מנוקד, מחזיר מנוקד
  applyNiqud(textPlain) → Promise<string>,

  // AvriNeural TTS — מחזיר Blob URL לאודיו (cached)
  generateTTS(textNiqud) → Promise<{ audioUrl: string, durationMs: number }>,

  // Validation — pack-schema check + ניקוד rules + ב/כ/פ דגש קל
  validateContent(item) → {
    valid: boolean,
    errors: Array<{ field: string, code: string, hebrew: string, severity: 'error'|'warning' }>
  },

  // Storage (Phase 0 = localStorage, Phase 4 = Supabase)
  saveDraft(item) → Promise<{ id: string }>,
  publishItem(id) → Promise<void>,
  listMyItems() → Promise<Array<item>>,
  deleteDraft(id) → Promise<void>,

  // Metadata helpers (UI labels)
  getAvailableIslands() → Array<{ id, name_he, mechanics_supported }>,
  getMechanicLabel(mechanic) → string,   // 'tap-all' → 'הקש על כל ה...'
  getTierLabel(tier) → string,           // 1 → 'בסיסי — חזרה'
};
```

**אם API חסר/לא מוכן בעת שאתה בונה UI:** stub אותו בקובץ `js/studio/_pipeline-stub.js` (זמני) ותחליף כש-Pipeline agent סיים. השאר TODO ברור.

---

## Phase A — Studio Shell + Wizard Skeleton (4-5 שעות)

### A.1 — teacher-studio.html

מבנה:
```html
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>סטודיו תוכן — אבני יסוד</title>
  <link rel="stylesheet" href="css/tokens.css">    <!-- קיים, לא לגעת -->
  <link rel="stylesheet" href="css/studio.css">    <!-- שלך -->
</head>
<body>
  <header class="studio-header">
    <!-- שם המורה (מ-runtime-mode), חזרה לדשבורד, "ספרי לנו" -->
  </header>

  <main class="studio-main">
    <section class="studio-wizard" aria-label="בניית פריט חדש">
      <!-- שלב 1, 2, 3 — wizard.js מטפל -->
    </section>

    <aside class="studio-preview" aria-label="תצוגה מקדימה במצב תלמידה">
      <!-- preview.js מטפל — iframe + כפתורי השמע/הסתר -->
    </aside>
  </main>

  <!-- API חיצוני: pipeline agent טוען מודולים. אם לא טעון — stub -->
  <script src="js/shared/runtime-mode.js" defer></script>      <!-- ייבנה ע"י cloud agent · בינתיים stub -->
  <script src="js/studio/_pipeline-stub.js" defer></script>    <!-- שלך, זמני, עד pipeline agent מסיים -->
  <script src="js/studio/wizard.js" defer></script>
  <script src="js/studio/preview.js" defer></script>
  <script src="js/studio/validator-ui.js" defer></script>
  <script src="js/studio/feedback.js" defer></script>
</body>
</html>
```

**RTL + Hebrew אופייני:** ערך `dir="rtl"`, פונט Heebo (לא Playpen), כל strings בעברית.

### A.2 — js/studio/wizard.js

State machine פשוט:
```js
const WizardState = {
  step: 1,           // 1 | 2 | 3
  draft: {
    island_id: null,
    mechanic: null,
    letter: null,
    distractors: [],
    custom_words: [],   // אם המכניקה דורשת מילים
    challenge: null,
  },
  errors: [],
  isSaving: false,
};
```

**שלב 1 — בחירת אי + מכניקה:**
- 6 כרטיסים גדולים (אי 1, 2, 3, 4, 5, 14 — רק האיים עם משחקונים פעילים)
- כל אי מציג איזה mechanics זמינים (`getAvailableIslands()`)
- לחיצה על אי → מציג sub-grid של mechanics זמינים לאי
- "עזרה" link → modal הסבר פדגוגי (לדוגמה: "אי 3 = הכרת אותיות. בחרי משחק tap-all אם רוצה שהילדה לוחצת על כל אות מסוימת במסך")

**שלב 2 — תוכן:**
תלוי ב-mechanic שנבחר:

| mechanic | מה המורה ממלאת |
|---|---|
| `tap-all` | אות יעד (1) · distractors (3-5 אותיות אחרות) · challenge: with/without niqud |
| `pick` | אות יעד · 4 אופציות (1 נכונה + 3 distractors) · אודיו prompt |
| `memory-pair` | 4-6 זוגות (אות ↔ צליל / אות ↔ תמונה) |
| `sort-by-letter` | 2-4 קבוצות · 8-12 פריטים למיון |

**Niqud auto:** כפתור 🟡 "נקדי לי" ליד כל שדה טקסט — לוחץ → `applyNiqud()` → ממלא את השדה. המורה יכולה לערוך ידנית אחרי.

**שלב 3 — סקירה ושמירה:**
- תצוגת ה-item המלא (כל השדות, כולל auto-tagged)
- Checklist ירוק "הכל תקין" / אדום "חסר X"
- 2 כפתורים: "שמרי כטיוטה" / "פרסמי לכיתה"
- אחרי שמירה → Toast "נשמר!" + אפשרות "בנייה חדשה" או "חזרה לרשימה"

**Validation בכל step transition:**
```js
async function goToNext() {
  const result = await window.AvneiStudioPipeline.validateContent(draft);
  if (!result.valid) {
    showErrorsHebrew(result.errors);  // validator-ui.js
    return;
  }
  state.step++;
  render();
}
```

### A.3 — js/studio/_pipeline-stub.js (זמני)

מספק `window.AvneiStudioPipeline` עם implementations dummy כדי שתוכל לבדוק UI בלי לחכות ל-pipeline agent:

```js
window.AvneiStudioPipeline = window.AvneiStudioPipeline || {
  autoTag: (d) => ({ ...d, item_id: `stub-${Date.now()}`, tier: 2, type: 'new',
                     rama_task_alignment: 1, peima_target: 1, letters_involved: [d.letter].filter(Boolean) }),
  applyNiqud: async (t) => t,  // returns same text
  generateTTS: async () => ({ audioUrl: '', durationMs: 0 }),
  validateContent: (i) => ({ valid: !!i.letter && !!i.mechanic, errors: [] }),
  saveDraft: async (i) => ({ id: `stub-${Date.now()}` }),
  publishItem: async () => {},
  listMyItems: async () => [],
  deleteDraft: async () => {},
  getAvailableIslands: () => [
    { id: 1, name_he: 'בועות', mechanics_supported: ['pick'] },
    { id: 2, name_he: 'מודעות פונולוגית', mechanics_supported: ['pick', 'sort-by-letter'] },
    { id: 3, name_he: 'הכרת אותיות', mechanics_supported: ['tap-all', 'pick', 'memory-pair'] },
    { id: 4, name_he: 'CV', mechanics_supported: ['tap-all', 'pick'] },
    { id: 5, name_he: 'מילים', mechanics_supported: ['memory-pair', 'sort-by-letter'] },
    { id: 14, name_he: 'הבנת הנשמע', mechanics_supported: ['pick'] }
  ],
  getMechanicLabel: (m) => ({ 'tap-all': 'הקש על הכל', 'pick': 'בחירה', 'memory-pair': 'זיכרון זוגות', 'sort-by-letter': 'מיון לפי אות' }[m] || m),
  getTierLabel: (t) => ({ 1: 'בסיסי', 2: 'ליבה', 3: 'מתקדם', 4: 'מאסטר' }[t] || `רמה ${t}`)
};
```

**הסר את ה-stub כשPipeline agent מסיים.** עד אז — UI עובד באוויר.

---

## Phase B — Preview Pane (3-4 שעות)

### B.1 — js/studio/preview.js

iframe דינמי שמרנדר את הפריט במצב תלמיד.ה.

**איך:**
1. בעת כל שינוי ב-`state.draft` (debounced 500ms):
   - הזרק `state.draft` לתוך iframe URL: `stage-{N}-{mechanic-template}.html?preview=1&item=${encoded}`
   - או post-message ל-iframe קיים: `iframe.contentWindow.postMessage({type: 'preview', item}, '*')`

2. iframe מאזין ל-message ומרנדר. **אם אין postMessage handler ב-stage-*.html הקיימים — תוסיף thin shim בתחתית קובץ ה-stage.** רק קבצים שלא בעבודה אקטיבית.

**כפתורי preview:**
- 🔊 "השמע" — מנגן את האודיו מ-`generateTTS()`
- 🔁 "רענן"
- 📱 "סובב למצב טאבלט" (toggle aspect ratio: 9:16 vs 16:9)

**אם iframe לא טעון:** placeholder עם "תצוגה מקדימה תופיע פה אחרי שתבחרי משחק"

### B.2 — Mobile-first

ה-preview pane מימין (RTL = left visually) על desktop, מתחת ל-wizard על מובייל (`@media max-width: 900px`).

---

## Phase C — Validator UI (Hebrew Error Messages) (2 שעות)

### C.1 — js/studio/validator-ui.js

מקבל `errors` מ-`validateContent()` ומציג בעברית.

**Mapping של error codes → הסברים פדגוגיים בעברית:**

```js
const ERROR_HEBREW = {
  'missing_letter': {
    title: 'שכחת לציין על איזה אות תרגול מתמקד',
    body: 'בלי לדעת איזו אות — לא נוכל להגיד למורה אם הילדה חזקה או חלשה באות הזו.',
    fix: 'חזרי לשלב 2 ובחרי אות מהרשימה'
  },
  'missing_audio': {
    title: 'חסר אודיו לפריט הזה',
    body: 'ילדה בכיתה א\' לא תמיד יודעת לקרוא — האודיו זה איך שהיא תבין את השאלה.',
    fix: 'לחצי על "צור אודיו אוטומטי" או הקליטי בעצמך'
  },
  'niqud_violation_bgd_kpt': {
    title: 'ניקוד: ב/כ/פ צריכים דגש קל בתחילת מילה',
    body: 'אם תכתבי "בַ" במקום "בַּ" — האודיו יבטא /va/ במקום /ba/. זה ישבש את הילדה.',
    fix: 'הוסיפי דגש (נקודה בתוך האות) ב-ב, כ, פ כשהן בתחילת הברה'
  },
  'distractors_too_similar': {
    title: 'ה-distractors שבחרת קלים מדי',
    body: 'ב-Tier 2 וצריך אותיות שמתבלבלות עם האות שלך (דוגמה: ב/ו, ר/ד). הצלחה של 100% לא תלמד אותנו כלום.',
    fix: 'הוסיפי לפחות אות אחת מ-{suggested_confusions}'
  },
  'too_few_items_in_pack': {
    title: 'מעט מדי פריטים — לא יספיק לסשן',
    body: 'סשן ילדה רגיל = 8-12 פריטים. בנית פחות.',
    fix: 'הוסיפי עוד {needed} פריטים, או צרי וריאציות (אותה אות עם distractors אחרים)'
  },
  // ... (Pipeline agent יחזיר את ה-codes שיש, אתה ממפה ל-Hebrew)
};
```

**UI:**
- אדום `error` = blocks save
- צהוב `warning` = מאפשר save עם confirmation ("את בטוחה? זה לא יבטא נכון")
- כל שגיאה מציגה: title (גדול) · body (הסבר) · fix (פעולה ספציפית) · 🔗 "תקני בשבילי" (אופציונלי, מקפיץ לשדה הרלוונטי)

### C.2 — Preview validation cues

תוך כדי הקלדה — סימוני שדה (ירוק/אדום) ליד כל input. אבל **לא הודעות popup**. ההודעות המפורטות רק כשמנסה להתקדם שלב.

---

## Phase D — Feedback Widget + Onboarding Tour (3 שעות)

### D.1 — js/studio/feedback.js

Widget צף בפינה התחתונה (RTL = שמאל בעברית). לחיצה → modal:

```
ספרי לנו

איפה את עכשיו? [auto-detect: שלב {n}]
מה רצית לעשות? __________________________
מה עבד / לא עבד? __________________________
דחיפות: [שגיאה · המלצה · מחמאה]

[שלחי]   [בטלי]
```

**שמירה (Phase 0):** localStorage `studio-feedback-log` — מערך של:
```js
{
  teacher_email,
  timestamp,
  step,
  draft_snapshot,
  free_text,
  category,
  user_agent
}
```

**Phase 4 (אחרי cloud):** POST לטבלת `studio_feedback` ב-Supabase.

**הוסף גם:** כפתור קטן ❓ "ספרי לנו" על **כל אלמנט interactive עיקרי** ב-UI (כל כפתור wizard, כל input). לחיצה → אותו modal עם `step` + `element` ממולאים אוטומטית.

### D.2 — Onboarding tour (פעם ראשונה בלבד)

ב-mount של `teacher-studio.html`, אם אין `localStorage['studio-onboarded']`:

5 חלוניות tour overlay:
1. "ברוכה הבאה לסטודיו. כאן תוכלי לבנות תרגול משלך לכיתה."
2. "שלב 1: בוחרת איזה אי מבית הספר של אבני יסוד. מי שכבר בנוי — זמין כאן."
3. "שלב 2: בוחרת איך הילדים יתרגלו (משחק). יש 4 סוגי משחקים."
4. "שלב 3: ממלאת תוכן. אם חסר משהו — נסביר בעברית מה."
5. "שמרת? הפריט מופיע אצל הילדים בכיתה שלך בלבד. אנחנו לא חולקים בין מורות."

כפתור "סיימתי, אל תציג שוב" → set localStorage.

---

## Phase E — Tests + Manual (1.5 שעות)

### E.1 — Smoke tests

צור `scripts/test-studio-ui.spec.js` (Playwright, לא חובה אם זמן קצר — manual מספיק):
- מסך נטען עם `?guest=1`
- שלב 1 → בחירת אי 3 + tap-all
- שלב 2 → אות 'מ' + 3 distractors
- שלב 3 → checklist ירוק → "פרסמי"
- toast "נשמר" מופיע

### E.2 — בדיקה ידנית — חובה

1. ☐ פתחי `teacher-studio.html?guest=1` — נטען בלי errors בקונסול
2. ☐ Onboarding tour מופיע — לחצי "סיימתי"
3. ☐ refresh — tour לא חוזר
4. ☐ הקלידי מילה בעברית בלי ניקוד — לחצי "נקדי לי" — מקבלת ניקוד (עם stub: אותו text · עם pipeline: מנוקד)
5. ☐ נסי לעבור שלב 3 בלי למלא אות — שגיאה בעברית עם title + body + fix
6. ☐ פתחי feedback widget — מילאי משהו — וודאי שנשמר ב-`localStorage.studio-feedback-log`
7. ☐ Preview pane מתעדכן בעת שינוי בwizard (debounced)

### E.3 — Completion report

צור `_handoff/2026-06-01-studio-ui-completion-report.md`:
- מה נבנה
- מה לא נבנה (אם משהו)
- TODO רשימה ל-Pipeline agent (אם stub השאיר תלות)
- snapshots: 5 צילומי מסך של הסטודיו

---

## Acceptance Criteria

- [ ] `teacher-studio.html` נטען עם `?guest=1` בלי errors
- [ ] Wizard 3 שלבים פועל end-to-end
- [ ] Preview pane מתעדכן בעת שינוי (debounced)
- [ ] Validator מציג שגיאות בעברית פדגוגית (לא error codes)
- [ ] Feedback widget שומר ל-localStorage
- [ ] Onboarding tour מופיע פעם אחת בלבד
- [ ] RTL מלא, Heebo, ניקוד מוצג נכון בכל שדה preview
- [ ] בדיקה ידנית של 7 השלבים עברה
- [ ] Completion report ב-`_handoff/`
- [ ] **אין** `window.AvneiStudioPipeline = ...` בקוד שלך מעבר לקובץ `_pipeline-stub.js` (זה Pipeline agent territory)

---

## אסור לך

- ❌ **לערוך את הקבצים של Pipeline agent:**
  - `js/studio/auto-tagger.js`
  - `js/studio/niqud-client.js`
  - `js/studio/tts-batch.js`
  - `js/studio/local-store.js`
  - `js/studio/_pipeline-real.js`
  - `scripts/test-studio-pipeline.js`
- ❌ **לערוך infrastructure** של אבני יסוד:
  - `js/shared/bkt.js`
  - `js/shared/event-logger.js`
  - `js/shared/pack-bkt-bridge.js`
  - `js/shared/state.js`
  - `js/shared/item-schema.js`
  - `js/shared/runtime-mode.js` (יבנה ע"י cloud agent)
- ❌ **לערוך teacher dashboards קיימים:**
  - `teacher-rama.html` · `teacher-action.html` · `teacher-action-v2.html` · `teacher-live.html`
- ❌ **לערוך מסכי תלמיד.ה הקיימים** (stage-*.html) מעבר ל-thin postMessage shim לpreview (שורות בודדות, מאושר רק לקבצים שאין עליהם סוכן פעיל)
- ❌ **לערוך פאקים קיימים** ב-`curriculum/packs/`
- ❌ **לדחוף ל-git.** רק commit מקומי. התזמורת (מיטל) תדחוף.
- ❌ **להמציא pedagogical claims** — אם רוצה הסבר חדש בעברית — שאל את מיטל
- ❌ **לערוך CLAUDE.md / memory** של מיטל

## אסור לערוך — קבצים של סוכנים פעילים אחרים

לפני edit: `git fetch origin && git status`. אם תראה M בקבצים שלא ערכת → להפסיק ולשאול את מיטל.

- אי 5 (סוכן פעיל) — אסור לגעת ב-`stage-5*.html`, `data/island-05-words/`, `js/shared/word-adapter.js`, `js/templates/mechanic-*.js` שעודכנו לאי 5
- Cloud migration (סוכן פעיל) — אסור לגעת ב-`js/shared/runtime-mode.js`, `js/shared/cloud-sync.js`, או SQL files

---

## Memory חובה — לקרוא ראשון

- [[feedback-avnei-yesod-partners-are-testers]] · השותפות הן הבודקות → UX polished day-1
- [[feedback-avnei-yesod-teacher-language-simplicity]] · שפה פשוטה למורה (לא BKT/EPA/strands)
- [[feedback-avnei-yesod-niqud-on-student-screens]] · ניקוד מלא בכל preview של תלמיד.ה
- [[reference-hebrew-niqud-rules]] · כללי ניקוד דקדוקיים
- [[reference-hebrew-bgd-kpt-dagesh-rule]] · ב/כ/פ דגש קל
- [[feedback-kid-block-letters-not-handwriting]] · Heebo בלבד למסכי תלמיד.ה
- [[project-avnei-yesod-pilot-4-teachers]] · 4 מורים, 5 ילדים, ההורים מקצים טאבלטים
- [[project-avnei-yesod-cloud-architecture]] · Supabase dual-mode (בדיקה ב-`?guest=1`)

---

## תיאום עם Pipeline Agent (בן-הזוג)

- אתה צורך `window.AvneiStudioPipeline`. **אל תתקין יותר משדה אחד fallback ל-_pipeline-stub.js.**
- אם API ש-Pipeline נותן שונה ממה שמופיע ב-bootstrap הזה — **תאם איתו ב-completion report**. אל תדרוס.
- שיתוף קבצי `js/studio/`: כל קובץ שייך לסוכן אחד בלבד. אם צריך משהו משותף — צור `js/studio/_shared.js` והודיע לבן-הזוג ב-completion report.

---

## checkpoint עם תזמורת (מיטל)

לפני שמסיים — commit מקומי + הודעה במיטל:

```
✅ Studio-UI Agent · Phase {A|B|C|D|E} done
- Files changed: X new, 0 modified outside scope
- Tests: pass/fail
- Blockers: {אם יש}
- Next: {מה אחרי}
```

מיטל תוודא ש-Pipeline agent מתואם → תדחוף.
