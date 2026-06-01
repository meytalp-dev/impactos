# Bootstrap — Studio-Pipeline Agent · Teacher Content Studio · 1.6.2026

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש בVS Code B. אומדן: 1.5-2 ימי-סוכן.
>
> **בן-זוג:** Studio-UI Agent (VS Code A, bootstrap נפרד). הוא צורך את ה-API שלך דרך `window.AvneiStudioPipeline`. אסור לגעת בקבצים שלו.

---

## הוראות תזמורת — מיטל · 1.6.2026

**הקשר:** ראה bootstrap UI agent — אותו go-live, אותן 4 מורות שותפות, אותו מוצר (Teacher Content Studio).

**הסקופ שלך (Pipeline = business logic):** Auto-tagger · Niqud client (Dicta API) · TTS batch (AvriNeural) · Validator עם pack-schema + Hebrew rules · Storage layer (localStorage היום, Supabase מחר). **אתה לא בונה UI — זה UI agent.**

**העיקרון:** אתה חושף `window.AvneiStudioPipeline` עם API ברור. UI agent קורא לזה.

---

## מטרה

לבנות layer שמקבל draft של פריט מהמורה (אות + mechanic + תוכן), ומחזיר item תקני שעובר את `validate-pack.js` ויכול להזין את BKT/EPA הקיים בדיוק כמו כל פריט אחר.

**Acceptance של המוצר:**
- `AvneiStudioPipeline.autoTag()` מחזיר item שעובר את `validate-pack.js` קיים
- `applyNiqud()` קורא ל-Dicta API ומחזיר ניקוד תקני (כולל ב/כ/פ דגש קל)
- `generateTTS()` מחזיר Blob URL לאודיו AvriNeural, cached פר טקסט
- `validateContent()` מחזיר errors בעברית פדגוגית (לא error codes)
- `saveDraft()` / `publishItem()` עובדים ב-localStorage (Phase 0), עם adapter ל-Supabase (Phase 4)

---

## קבצים שאתה יוצר

```
avnei-yesod/underwater-app/
└── js/
    └── studio/
        ├── auto-tagger.js       ← NEW · draft → tagged item
        ├── niqud-client.js      ← NEW · Dicta API wrapper + ב/כ/פ post-processor
        ├── tts-batch.js         ← NEW · AvriNeural caller + Blob caching
        ├── validator-pipeline.js ← NEW · business validation (item schema + Hebrew rules)
        ├── local-store.js       ← NEW · localStorage CRUD + Supabase-ready adapter
        └── _pipeline-real.js    ← NEW · entry point, assembles window.AvneiStudioPipeline
└── scripts/
    └── test-studio-pipeline.js  ← NEW · node test suite (no UI deps)
```

**אסור לגעת בקבצים אחרים** מחוץ לרשימה הזו. ראה "אסור לך" למטה.

---

## API Contract — מה אתה חושף

הכל ב-`window.AvneiStudioPipeline`. UI agent **רק קורא** — לא מממש.

```js
window.AvneiStudioPipeline = {
  // ============ AUTO-TAGGING ============
  /**
   * draft → fully-tagged item תקני
   * @param {Object} draft - { island_id, mechanic, letter?, custom_words?, distractors?, challenge? }
   * @returns {Object} item with: item_id, tier, type, mechanic, letter?, skill?,
   *                              rama_task_alignment, peima_target, letters_involved
   */
  autoTag(draft) { ... },

  // ============ NIQUD ============
  /**
   * Dicta API call + ב/כ/פ דגש קל post-processor
   * @param {string} textPlain - "באה" / "כפר" / "פתחי"
   * @returns {Promise<string>} - "בָּאָה" / "כְּפָר" / "פִּתְחִי" (correctly dageshed)
   */
  async applyNiqud(textPlain) { ... },

  // ============ TTS ============
  /**
   * AvriNeural batch generation + Blob caching
   * @param {string} textNiqud - text with full niqud
   * @returns {Promise<{audioUrl: string, durationMs: number}>}
   *   audioUrl is Blob URL (cached in IndexedDB)
   */
  async generateTTS(textNiqud) { ... },

  // ============ VALIDATION ============
  /**
   * Validation: pack-schema + Hebrew rules + content quality
   * @returns {{
   *   valid: boolean,
   *   errors: Array<{
   *     field: string,
   *     code: string,           // 'missing_letter', 'niqud_violation_bgd_kpt', ...
   *     hebrew: string,         // pedagogical explanation (UI agent maps further)
   *     severity: 'error'|'warning',
   *     suggested_fix?: string
   *   }>
   * }}
   */
  validateContent(item) { ... },

  // ============ STORAGE ============
  /**
   * Save as draft (not published to class). Phase 0: localStorage. Phase 4: Supabase.
   * @returns {Promise<{id: string}>}
   */
  async saveDraft(item) { ... },

  /**
   * Mark item as published — students will see it. Versioned.
   */
  async publishItem(id) { ... },

  async listMyItems() { ... },
  async deleteDraft(id) { ... },

  // ============ METADATA HELPERS (UI labels) ============
  getAvailableIslands() { ... },
  getMechanicLabel(mechanic) { ... },
  getTierLabel(tier) { ... },
};
```

---

## Phase A — Auto-Tagger (3-4 שעות)

### A.1 — js/studio/auto-tagger.js

קלט: `draft` חלקי מה-UI. פלט: item תקני לפי [packs/_schema.md §4](../curriculum/packs/_schema.md) ו-[js/shared/item-schema.js](../underwater-app/js/shared/item-schema.js).

**שדות נגזרים:**

| שדה | מקור | לוגיקה |
|---|---|---|
| `item_id` | מיוצר | `studio-{teacher_id}-{timestamp}-{random4}` |
| `type` | מיוצר | `"new"` (Studio תמיד new — אין review מורה) |
| `tier` | default 2 | המורה תוכל לדרוס ב-UI. ברירת מחדל לוגית: 2 |
| `letters_involved` | מהתוכן | regex סריקה על `letter` + `custom_words` × 22 אותיות קנוניות (ALL_HEBREW_LETTERS_22). אותיות סופיות מנורמלות (ך→כ, ם→מ, ן→נ, ף→פ, ץ→צ) |
| `rama_task_alignment` | מ-island + mechanic | מיפוי טבלאי. ראה A.2 |
| `peima_target` | מ-rama_task_alignment | `TASK_TO_PEIMA[task]` מ-`item-schema.js` |
| `mechanic` | מ-draft | ולידציה: שייך ל-{tap-all, pick, memory-pair, sort-by-letter} |

### A.2 — Mapping טבלה: island × mechanic → rama_task

```js
const RAMA_TASK_MAP = {
  // island_id → (mechanic → task_id מתוך 1-10)
  1:  { 'pick': 2 },                                    // PA → task 2
  2:  { 'pick': 2, 'sort-by-letter': 2 },                // PA → task 2
  3:  { 'tap-all': 1, 'pick': 1, 'memory-pair': 1 },     // letter identification → task 1
  4:  { 'tap-all': 5, 'pick': 5 },                       // CV reading → task 5
  5:  { 'memory-pair': 6, 'sort-by-letter': 6 },         // word reading → task 6
  14: { 'pick': 3 },                                     // listening comprehension → task 3
};

function deriveRamaTask(islandId, mechanic) {
  return RAMA_TASK_MAP[islandId]?.[mechanic] ?? null;  // null → validation error
}
```

**מקור הטבלה:** [item-schema.js:20-31](../underwater-app/js/shared/item-schema.js#L20-L31) — 10 משימות ראמ"ה.

### A.3 — Extract letters_involved

```js
const ALL_HEBREW_LETTERS_22 = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ',
                                'ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת'];
const FINAL_TO_BASE = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

function extractLettersInvolved(draft) {
  const text = [
    draft.letter,
    ...(draft.custom_words || []),
    ...(draft.distractors || [])
  ].filter(Boolean).join('');

  const stripped = text.replace(/[֑-ׇ]/g, '');  // remove all niqud marks
  const letters = new Set();
  for (const ch of stripped) {
    const base = FINAL_TO_BASE[ch] ?? ch;
    if (ALL_HEBREW_LETTERS_22.includes(base)) letters.add(base);
  }
  return [...letters];
}
```

### A.4 — Tests

`scripts/test-studio-pipeline.js`:
```js
// AT-1: autoTag fills all required fields
test('autoTag basic letter item', () => {
  const r = autoTag({ island_id: 3, mechanic: 'tap-all', letter: 'מ', distractors: ['ב','ר'] });
  assert.equal(r.tier, 2);
  assert.equal(r.type, 'new');
  assert.equal(r.rama_task_alignment, 1);
  assert.equal(r.peima_target, 1);
  assert.deepEqual(r.letters_involved.sort(), ['ב','מ','ר']);
});

// AT-2: final letters normalized
test('final letter ם normalizes to מ', () => {
  const r = autoTag({ island_id: 5, mechanic: 'memory-pair', custom_words: ['בָּאִים'] });
  assert.ok(r.letters_involved.includes('מ'));
  assert.ok(!r.letters_involved.includes('ם'));
});

// AT-3: niqud stripped from letters_involved
test('niqud not in letters_involved', () => {
  const r = autoTag({ island_id: 3, mechanic: 'pick', letter: 'מ', custom_words: ['אִמָּא'] });
  for (const l of r.letters_involved) assert.equal(l.length, 1);
});

// AT-4: invalid mechanic throws
test('invalid mechanic rejects', () => {
  assert.throws(() => autoTag({ island_id: 3, mechanic: 'invalid' }));
});
```

---

## Phase B — Niqud Client (Dicta) (3-4 שעות)

### B.1 — js/studio/niqud-client.js

Dicta API endpoint: `https://nakdan-api.dicta.org.il/addnikud` (אמת לפני שימוש — ייתכן API שונה).

**אם API צריך key:** השתמש ב-env var `STUDIO_DICTA_KEY` או prompt ל-מיטל. **אם API לא זמין:** fallback ל-`text` (passthrough) + שגיאת warning ב-validation.

```js
async function applyNiqudViaDicta(textPlain) {
  const res = await fetch('https://nakdan-api.dicta.org.il/addnikud', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task: 'nakdan',
      data: textPlain,
      genre: 'modern'
    })
  });
  if (!res.ok) throw new Error(`Dicta API: ${res.status}`);
  const json = await res.json();
  return json.text || textPlain;
}
```

### B.2 — ב/כ/פ דגש קל post-processor

**הבעיה:** Dicta לא תמיד מדגישה ב/כ/פ בתחילת מילה. ראה [[reference-hebrew-bgd-kpt-dagesh-rule]].

```js
const BGD_KPT_AT_START = /(^|[\s־])(ב|כ|פ)(ְ|[ֱ-ֻ])/g;
//                          ↑ start or space     ↑ b/k/p   ↑ shva or any vowel

function ensureBgdKptDagesh(textNiqud) {
  return textNiqud.replace(BGD_KPT_AT_START, (m, pre, letter, vowel) => {
    // Add dagesh kal (U+05BC) after the letter if not already present
    return pre + letter + 'ּ' + vowel;
  }).replace(/ּּ+/g, 'ּ'); // collapse duplicate dagesh
}
```

**שולב:**
```js
window.AvneiStudioPipeline.applyNiqud = async (textPlain) => {
  const niqud = await applyNiqudViaDicta(textPlain);
  return ensureBgdKptDagesh(niqud);
};
```

### B.3 — Tests

```js
test('Dicta returns niqud', async () => {
  const r = await applyNiqud('בית');
  assert.match(r, /[ְ-ּ]/);  // contains niqud
});

test('B at word start gets dagesh', async () => {
  const r = ensureBgdKptDagesh('בָּ');     // already has dagesh
  assert.equal(r, 'בָּ');                  // unchanged
  const r2 = ensureBgdKptDagesh('בַ');     // missing dagesh
  assert.equal(r2, 'בַּ');                 // added (note: order of marks matters)
});

test('K not at start - no dagesh added', () => {
  assert.equal(ensureBgdKptDagesh('הַכֹּל'), 'הַכֹּל');  // already correct
});
```

**אם הבדיקות נכשלות בגלל Unicode order של ה-marks** — חקור [Hebrew niqud rules](../curriculum/llm-pitfalls.md) או memory [[reference-hebrew-niqud-rules]] ותקן.

---

## Phase C — TTS Batch (AvriNeural) (3 שעות)

### C.1 — js/studio/tts-batch.js

**הקיים בפרויקט:** TTS audio נמצא ב-`underwater-app/assets/audio/`. בדוק אם יש כבר wrapper ל-AvriNeural.

```bash
grep -r "AvriNeural" avnei-yesod/underwater-app/js/shared/ avnei-yesod/scripts/
```

**אם יש utility קיים** — השתמש בו (חסכון). אם לא:

```js
// Edge/Azure TTS (or Python script that calls ElevenLabs)
async function generateTTSViaAvri(textNiqud) {
  // Option A: backend endpoint that wraps it
  // Option B: pre-generated audio + cache lookup
  // Option C: client-side TTS lib

  // Spec: באבני יסוד יש Python script that runs offline + uploads to assets/.
  // ל-Studio — צריך פתרון on-demand. בדוק כי בקובץ זה לא מספיק מידע.
  // אם אין endpoint זמין — fallback: Web Speech API (לא mock) + warning ב-validation
  // ש-"TTS באיכות נמוכה, יוחלף לפני פיילוט"
}
```

**Caching strategy (IndexedDB):**

```js
const DB_NAME = 'studio-tts-cache-v1';
const STORE = 'audio';

async function getCachedAudio(textNiqud) {
  const key = await sha256(textNiqud);
  // IndexedDB lookup
  // returns { audioUrl: Blob URL, durationMs } או null
}

async function setCachedAudio(textNiqud, blob, durationMs) { ... }
```

**API:**
```js
window.AvneiStudioPipeline.generateTTS = async (textNiqud) => {
  const cached = await getCachedAudio(textNiqud);
  if (cached) return cached;

  const blob = await generateTTSViaAvri(textNiqud);
  const audioUrl = URL.createObjectURL(blob);
  const durationMs = await measureBlobDuration(blob);

  await setCachedAudio(textNiqud, blob, durationMs);
  return { audioUrl, durationMs };
};
```

### C.2 — אם AvriNeural לא ניתן לקריאה בלקוח

**alternative path (אם תקועה):**
1. תיעוד ב-completion report: "TTS לא מומש מלאה — נדרש backend"
2. שמירת `{ tts_pending: true, text: textNiqud }` באובייקט ה-item
3. UI agent יציג warning בpreview: "אודיו ייווצר אחרי שמירה"
4. Phase 4 (cloud): script ב-Supabase Edge Function שמייצר אודיו batch

**לא חוסם MVP** — חשוב יותר auto-tagger + niqud + validation.

---

## Phase D — Validator-Pipeline (2-3 שעות)

### D.1 — js/studio/validator-pipeline.js

**מקור:** קיים [scripts/validate-pack.js](../underwater-app/scripts/validate-pack.js) — אם קיים, אמץ אותו. אחרת, מימש לפי [_schema.md §6](../curriculum/packs/_schema.md).

**בדיקות לעשות:**

| Code | מתי | severity |
|---|---|---|
| `missing_letter` | `focus_mode=letters` ו-`type=new` ואין `letter` | error |
| `missing_mechanic` | אין `mechanic` או לא ב-{tap-all,pick,memory-pair,sort-by-letter} | error |
| `missing_rama_task` | `rama_task_alignment` חסר (= autoTag נכשל) | error |
| `missing_audio` | `mechanic` דורש prompt audio (pick, tap-all) ואין `audio_url` | warning (Phase 0) / error (Phase 4) |
| `niqud_violation_bgd_kpt` | regex מוצא ב/כ/פ בתחילת מילה בלי דגש | error |
| `niqud_violation_yofi` | "יופי" בלי "וֹ" | warning |
| `niqud_missing` | טקסט הילדה יראה (custom_words, distractors) בלי niqud | error |
| `distractors_too_few` | mechanic=pick ופחות מ-3 distractors | error |
| `distractors_too_similar` | mechanic=tap-all/pick ו-distractors לא נמצאות ב-shape/sound confusion list | warning |
| `letters_involved_empty` | letters_involved=[] | error |
| `letter_not_in_22` | letter לא ב-ALL_HEBREW_LETTERS_22 | error |

### D.2 — Confusion list (לאיתור distractors מדי קלים)

```js
const SHAPE_CONFUSIONS = {
  'ב': ['כ', 'נ', 'ו'],
  'כ': ['ב', 'ן', 'נ'],
  'ר': ['ד', 'כ'],
  'ד': ['ר'],
  'ה': ['ח', 'ת'],
  'ח': ['ה', 'ת'],
  'ת': ['ה', 'ח'],
  'מ': ['ם'],   // base form check
  // ... אם זמן — תרחיב לפי [[reference-avnei-yesod-island-build-checklist]]
};
const SOUND_CONFUSIONS = {
  'ב': ['ו'],   // both /v/ when no dagesh
  'כ': ['ח'],   // both /x/
  'ת': ['ט'],   // both /t/
  'ק': ['כ'],   // both /k/
  'ס': ['ש'],   // both /s/ (depending on point)
  'א': ['ה', 'ע'],
  // ...
};
```

### D.3 — Hebrew messages

```js
const HEBREW_MESSAGES = {
  'missing_letter': 'בחרי על איזה אות המשחק מתמקד',
  'missing_mechanic': 'בחרי סוג משחק (tap-all, pick, ...)',
  'missing_rama_task': 'לא הצלחנו לזהות איזה כיוון פדגוגי — בדקי שבחרת אי ומשחק תקפים',
  'missing_audio': 'חסר אודיו. ילדה כיתה א\' לא תוכל לקרוא את ההוראה לבד',
  'niqud_violation_bgd_kpt': 'ב/כ/פ בתחילת מילה צריכים דגש קל (נקודה בתוך האות). בלי דגש — האודיו יבטא /va·xa·fa/',
  'niqud_violation_yofi': 'כתבי "יוֹפִי" עם וֹ (לא "יפי")',
  'niqud_missing': 'מילה שילדה תראה — חייבת ניקוד מלא',
  'distractors_too_few': 'משחק בחירה דורש לפחות 3 אופציות שגויות',
  'distractors_too_similar': 'ה-distractors קלים מדי. הוסיפי אות מתבלבלת (למשל ב/ו)',
  'letters_involved_empty': 'לא זיהינו אותיות בפריט — בדקי שיש לפחות אות אחת',
  'letter_not_in_22': 'אות לא תקפה. מותרות 22 אותיות קנוניות בלבד'
};
```

UI agent ממפה הלאה (title + body + fix) — אתה רק מספק את המסר הבסיסי.

---

## Phase E — Storage Layer (2 שעות)

### E.1 — js/studio/local-store.js

**Schema ב-localStorage:**

```js
// Key: 'studio-items-v1'
{
  drafts: {
    [item_id]: { ...item, status: 'draft', created_at, updated_at, teacher_id, version: 1 }
  },
  published: {
    [item_id]: { ...item, status: 'published', published_at, version: N }
  }
}
```

**API:**

```js
async function saveDraft(item) {
  const teacherId = getTeacherId();  // from runtime-mode / sessionStorage
  const id = item.item_id || `studio-${teacherId}-${Date.now()}-${rand4()}`;
  const draft = { ...item, item_id: id, status: 'draft',
                  created_at: nowIso(), updated_at: nowIso(),
                  teacher_id: teacherId, version: 1 };
  const store = readStore();
  store.drafts[id] = draft;
  writeStore(store);
  return { id };
}

async function publishItem(id) {
  const store = readStore();
  const draft = store.drafts[id];
  if (!draft) throw new Error(`Draft not found: ${id}`);

  // Validate before publishing
  const validation = await validateContent(draft);
  if (!validation.valid) {
    const blockers = validation.errors.filter(e => e.severity === 'error');
    if (blockers.length > 0) throw new Error('Cannot publish — validation errors');
  }

  const published = { ...draft, status: 'published',
                      published_at: nowIso(),
                      version: (store.published[id]?.version || 0) + 1 };
  store.published[id] = published;
  delete store.drafts[id];
  writeStore(store);
}

async function listMyItems() {
  const teacherId = getTeacherId();
  const store = readStore();
  const mine = [];
  for (const item of Object.values(store.drafts)) {
    if (item.teacher_id === teacherId) mine.push(item);
  }
  for (const item of Object.values(store.published)) {
    if (item.teacher_id === teacherId) mine.push(item);
  }
  return mine.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
```

### E.2 — Supabase adapter (stub ל-Phase 4)

```js
// אם window.AvneiCloudSync זמין (cloud agent בנה) → השתמש בו
const cloudAvailable = () => typeof window.AvneiCloudSync !== 'undefined'
                              && window.runtimeMode() === 'cloud';

async function saveDraft(item) {
  if (cloudAvailable()) {
    // Phase 4: window.AvneiCloudSync.saveTeacherItem(item)
    // עד אז: passthrough ל-localStorage
  }
  return await saveDraftLocal(item);  // הפונקציה למעלה
}
```

**הערה חשובה:** **אל תבנה את ה-cloud sync עצמו** — cloud agent ב-VS Code אחר בונה אותו. אתה רק משאיר hook.

### E.3 — Tests

```js
test('saveDraft + listMyItems roundtrip', async () => {
  const item = { item_id: 't1', letter: 'מ', mechanic: 'tap-all', tier: 2 };
  await saveDraft(item);
  const list = await listMyItems();
  assert.ok(list.some(x => x.item_id === 't1'));
});

test('publishItem requires validation', async () => {
  const bad = { item_id: 't2' };  // missing fields
  await saveDraft(bad);
  await assert.rejects(() => publishItem('t2'));
});

test('versioning on republish', async () => {
  const good = autoTag({ island_id: 3, mechanic: 'tap-all', letter: 'מ' });
  good.item_id = 't3';
  await saveDraft(good);
  await publishItem('t3');
  // Edit + republish
  await saveDraft({ ...good });
  await publishItem('t3');
  const list = await listMyItems();
  const t3 = list.find(x => x.item_id === 't3');
  assert.equal(t3.version, 2);
});
```

---

## Phase F — Assembly + Tests (1.5 שעות)

### F.1 — js/studio/_pipeline-real.js

קובץ entry שמחבר את הכל:

```js
import { autoTag } from './auto-tagger.js';
import { applyNiqud } from './niqud-client.js';
import { generateTTS } from './tts-batch.js';
import { validateContent } from './validator-pipeline.js';
import { saveDraft, publishItem, listMyItems, deleteDraft } from './local-store.js';
import { AVAILABLE_ISLANDS, MECHANIC_LABELS, TIER_LABELS } from './metadata.js';

window.AvneiStudioPipeline = {
  autoTag,
  applyNiqud,
  generateTTS,
  validateContent,
  saveDraft,
  publishItem,
  listMyItems,
  deleteDraft,
  getAvailableIslands: () => AVAILABLE_ISLANDS,
  getMechanicLabel: (m) => MECHANIC_LABELS[m] ?? m,
  getTierLabel: (t) => TIER_LABELS[t] ?? `רמה ${t}`,
};

console.log('[studio] Pipeline ready');
```

**אם UI agent עדיין משתמש ב-`_pipeline-stub.js`** — UI agent יסיר אותו אחרי שאתה מסיים. תאם איתו ב-completion report.

### F.2 — End-to-end test

```js
test('e2e: draft → autoTag → validate → publish', async () => {
  const draft = {
    island_id: 3, mechanic: 'tap-all', letter: 'מ',
    distractors: ['ב','נ','ר'], challenge: 'no-distractors'
  };
  const tagged = autoTag(draft);
  const validation = await validateContent(tagged);
  assert.ok(validation.valid, JSON.stringify(validation.errors));
  await saveDraft(tagged);
  await publishItem(tagged.item_id);
  const list = await listMyItems();
  assert.ok(list.find(x => x.item_id === tagged.item_id && x.status === 'published'));
});
```

### F.3 — Completion report

צור `_handoff/2026-06-01-studio-pipeline-completion-report.md`:
- מה נבנה
- API החשוף (final version, אם השתנה מה-bootstrap)
- TODO ל-Phase 4 (cloud): hooks שהשארת
- Tests: pass/fail summary
- TTS — מה מומש, מה לא (אם backend נדרש)
- ל-UI agent: רשימת error codes שיש לתרגם (אם הוספת חדשים)

---

## Acceptance Criteria

- [ ] `window.AvneiStudioPipeline` חשוף עם 11 הפונקציות שב-API contract
- [ ] `autoTag()` מייצר item שעובר `validate-pack.js` הקיים
- [ ] `applyNiqud('באה')` מחזיר טקסט מנוקד עם דגש קל ב-ב
- [ ] `generateTTS()` עובד או fallback מתועד (Web Speech / pending)
- [ ] `validateContent()` מחזיר errors בעברית (לפחות 8 codes שונים)
- [ ] `saveDraft → publishItem` עם versioning עובד
- [ ] tests עוברים (node `scripts/test-studio-pipeline.js`)
- [ ] Completion report ב-`_handoff/`
- [ ] **אין** UI code בקבצים שלך (כלום ב-DOM, אין `document.createElement` וכו')

---

## אסור לך

- ❌ **לערוך את הקבצים של UI agent:**
  - `teacher-studio.html`
  - `css/studio.css`
  - `js/studio/wizard.js`
  - `js/studio/preview.js`
  - `js/studio/validator-ui.js`
  - `js/studio/feedback.js`
  - `js/studio/_pipeline-stub.js` (UI agent יסיר אותו אחרי שאתה מסיים)
- ❌ **לערוך infrastructure** של אבני יסוד:
  - `js/shared/bkt.js`
  - `js/shared/event-logger.js`
  - `js/shared/pack-bkt-bridge.js`
  - `js/shared/state.js`
  - `js/shared/item-schema.js`
  - `js/shared/runtime-mode.js` (cloud agent)
  - `js/shared/cloud-sync.js` (cloud agent)
- ❌ **לערוך teacher dashboards קיימים:**
  - `teacher-rama.html` · `teacher-action.html` · `teacher-action-v2.html` · `teacher-live.html`
- ❌ **לערוך מסכי תלמיד.ה** הקיימים (stage-*.html) — UI agent ידאג ל-preview shim
- ❌ **לערוך פאקים קיימים** ב-`curriculum/packs/`
- ❌ **לדחוף ל-git.** רק commit מקומי. התזמורת (מיטל) תדחוף.
- ❌ **לערוך CLAUDE.md / memory**
- ❌ **לשנות את ALL_HEBREW_LETTERS_22** או רשימת ה-mechanics — קבועים גלובליים

## אסור לערוך — קבצים של סוכנים פעילים אחרים

לפני edit: `git fetch origin && git status`. אם תראה M בקבצים שלא ערכת → להפסיק ולשאול את מיטל.

- אי 5 (סוכן פעיל) — אסור לגעת ב-`stage-5*.html`, `data/island-05-words/`, `js/shared/word-adapter.js`, `js/templates/mechanic-*.js`
- Cloud migration (סוכן פעיל) — אסור לגעת ב-`js/shared/runtime-mode.js`, `js/shared/cloud-sync.js`, או SQL files

---

## Memory חובה — לקרוא ראשון

- [[feedback-avnei-yesod-partners-are-testers]] · השותפות הן הבודקות → validator עברית פדגוגית
- [[reference-hebrew-niqud-rules]] · כללי ניקוד דקדוקיים (חובה ל-validator)
- [[reference-hebrew-bgd-kpt-dagesh-rule]] · ב/כ/פ דגש קל ב-CV (קריטי לbuildCV ו-niqud post-processor)
- [[reference-avnei-yesod-island-build-checklist]] · 11 הלקחים — בעיקר על אודיו (AvriNeural MP3) ו-phoneme group accept
- [[feedback-avnei-yesod-niqud-on-student-screens]] · ניקוד מלא בכל תוכן תלמיד.ה (= כל פריט)
- [[project-avnei-yesod-pilot-4-teachers]] · 4 מורים, 5 ילדים, ההורים מקצים טאבלטים
- [[project-avnei-yesod-cloud-architecture]] · Supabase dual-mode (storage adapter ready)
- [[project-moy-lite-item-structure]] · structure of items (1 passage × 1 question per item)

---

## תיאום עם UI Agent (בן-הזוג)

- אתה מספק `window.AvneiStudioPipeline`. **אסור לדרוס אותו** — UI agent יתקין stub זמני, **הוא** יסיר אותו כש-`_pipeline-real.js` שלך מוכן
- אם error codes שונים ממה שתועד — **תאם איתו ב-completion report**
- כל קובץ ב-`js/studio/` שייך לסוכן אחד. אם צריך משותף — צור `js/studio/_shared.js` והודיע
- API שינויים בעת בנייה — תעד ב-completion report עם diff מול ה-bootstrap

---

## checkpoint עם תזמורת (מיטל)

לפני שמסיים — commit מקומי + הודעה למיטל:

```
✅ Studio-Pipeline Agent · Phase {A|B|C|D|E|F} done
- Files changed: X new, 0 modified outside scope
- Tests: pass/fail (X/Y)
- TTS status: implemented / fallback / pending
- API contract changes from bootstrap: {אם יש}
- Blockers: {אם יש}
- Next: {מה אחרי}
```

מיטל תוודא ש-UI agent מתואם → תדחוף.
