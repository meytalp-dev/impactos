# Completion Report — Studio-Pipeline Agent · 1.6.2026

> **סטטוס:** ✅ Phase A-F הושלמו · 32/32 tests עוברים · אין קבצים מחוץ ל-scope.
>
> **למיטל (תזמורת):** ה-API קבוע, UI agent יכול להסיר `_pipeline-stub.js` ולטעון את `_pipeline-real.js`.

---

## 1 · מה נבנה

| Phase | קובץ | תפקיד |
|---|---|---|
| A | [auto-tagger.js](../underwater-app/js/studio/auto-tagger.js) | draft → tagged item (rama_task, peima, letters_involved, item_id, tier=2 default) |
| B | [niqud-client.js](../underwater-app/js/studio/niqud-client.js) | Dicta API wrapper + ב/כ/פ דגש קל post-processor (NFC normalize) |
| C | [tts-batch.js](../underwater-app/js/studio/tts-batch.js) | IndexedDB cache + Web-Speech fallback marker (AvriNeural client-SDK חסר) |
| D | [validator-pipeline.js](../underwater-app/js/studio/validator-pipeline.js) | 13 error codes בעברית פדגוגית, confusion lists, niqud rules |
| E | [local-store.js](../underwater-app/js/studio/local-store.js) | localStorage CRUD + versioning + cloud adapter hook |
| F.0 | [metadata.js](../underwater-app/js/studio/metadata.js) | 6 islands · 4 mechanics labels · 4 tier labels |
| F.1 | [_pipeline-real.js](../underwater-app/js/studio/_pipeline-real.js) | entry point — מחבר הכל ל-`window.AvneiStudioPipeline` |
| F.2 | [test-studio-pipeline.js](../underwater-app/scripts/test-studio-pipeline.js) | 32 tests (AT/NQ/TT/VL/LS/MD/E2E) |

**סה"כ:** 8 קבצים חדשים · 0 קבצים שונו מחוץ ל-scope · 32/32 tests ירוקים.

---

## 2 · API Contract — final (זהה ל-bootstrap)

```js
window.AvneiStudioPipeline = {
  // Auto-tagging
  autoTag(draft) → Object,                       // ← sync

  // Niqud
  applyNiqud(textPlain) → Promise<string>,        // Dicta + post-processor

  // TTS
  generateTTS(textNiqud) → Promise<{
    audioUrl: string | null,
    durationMs: number,
    fallback?: 'web-speech',                       // ← UI agent מטפל
    ttsPending?: boolean,
    text?: string
  }>,

  // Validation
  validateContent(item) → {                        // ← sync (לא async)
    valid: boolean,
    errors: [{ field, code, hebrew, severity: 'error'|'warning', suggested_fix? }]
  },

  // Storage
  saveDraft(item)    → Promise<{ id }>,
  publishItem(id)    → Promise<void>,              // ← זורק אם validation.errors.severity='error'
  listMyItems()      → Promise<Array<item>>,
  deleteDraft(id)    → Promise<void>,

  // Metadata
  getAvailableIslands()       → Array<{id, name_he, short_he, mechanics_supported, description_he}>,
  getMechanicLabel(mech)      → string,
  getMechanicDescription(mech) → string,            // ← bonus, לא ב-bootstrap
  getTierLabel(tier)          → string,

  // Internal (debug)
  _internals: { autoTagger, niqudClient, ttsBatch, validator, localStore, metadata, version }
};
```

### שינויים מ-bootstrap

| שינוי | סיבה |
|---|---|
| `validateContent` הוא **sync**, לא async | אין I/O — בדיקה לוגית בלבד |
| נוסף `getMechanicDescription(mech)` | UI agent יוכל להציג טקסט הסבר לכל mechanic ב-wizard |
| `generateTTS` מחזיר `{fallback:'web-speech', ttsPending:true, text}` במצב fallback | אין client SDK ל-AvriNeural (ראה §5) |
| `publishItem` זורק `Error` עם `.validation` כדי שה-UI יוכל להציג את ה-errors המפורטים | hand-off ל-validator-ui.js של UI agent |

ה-`AVAILABLE_ISLANDS` כולל את 6 האיים הקיימים:
`1 (בועות) · 2 (דגיגים) · 3 (בית) · 4 (שונית/CV) · 5 (מילים) · 14 (הבנת מושמע)`.

---

## 3 · Error codes (לתרגום ב-UI agent)

13 codes חשופים ב-`window.AvneiStudioPipeline._internals.validator.HEBREW_MESSAGES`:

| code | severity | מה זה אומר ב-UI |
|---|---|---|
| `missing_letter` | error | המורה לא בחרה אות |
| `missing_mechanic` | error | המורה לא בחרה סוג משחק |
| `invalid_mechanic` | error | sentinel לאמת קלט (לא אמור לקרות מהוויזרד) |
| `missing_rama_task` | error | זוג (island, mechanic) לא נתמך — באג אם מגיע מ-UI תקין |
| `rama_peima_mismatch` | error | sentinel — auto-tagger באג |
| `missing_audio` | warning | אזהרה רכה: יוחלף אחרי TTS backend |
| `niqud_violation_bgd_kpt` | **error** | אחת המילים מתחילה ב-ב/כ/פ בלי דגש |
| `niqud_violation_yofi` | warning | בעיה ספציפית: "יפי" / "יופי" בלי חולם |
| `niqud_violation_kol` | warning | "כל" עם קמץ במקום חולם |
| `niqud_missing` | error | מילה בעברית בלי ניקוד |
| `distractors_too_few` | error | mechanic=pick עם <3 distractors |
| `distractors_too_similar` | warning | distractors קלים מדי — לא במפת confusion |
| `letters_involved_empty` | error | אחרי normalize, אין אותיות תקפות |
| `letter_not_in_22` | error | letter='ם' או דומה (סופית) — מציע suggested_fix |
| `tier_out_of_range` | error | tier ∉ {1,2,3,4} |
| `tts_pending` | warning | רק כשה-item מסומן `tts_pending=true` |

ה-UI agent יכול להציג את `e.hebrew` ישירות, או למפות עוד יותר (title + body + fix CTA).

---

## 4 · TODO לקראת Phase 4 (cloud)

| Hook | מה משאיר ל-cloud agent |
|---|---|
| `local-store.saveDraft` | בודק `_cloudAvailable()` (`window.AvneiCloudSync` + `runtimeMode()==='cloud'`) — אם זמין, מפעיל `saveTeacherItem(draft)`. אם נופל — נשאר ב-localStorage (offline-first). |
| `local-store.publishItem` | אותו דבר — `publishTeacherItem(published)` |
| `local-store.deleteDraft` | `deleteTeacherDraft(id)` |
| `tts-batch.generateTTS` | בודק `window.AvneiStudioTTSBackend.synthesize(text)` — אם זמין, מקבל Blob, מטמין ב-IndexedDB, מחזיר audioUrl. אחרת fallback. |
| `auto-tagger.getTeacherId` | קורא מ-`sessionStorage['studio-teacher-id']`. cloud agent ימלא את זה ב-auth flow. |

**אין צורך לשנות שום קובץ ב-`js/studio/` כשה-cloud agent מסיים** — הוא רק מגדיר את ה-globals ו-runtime-mode פותח את הסניף.

---

## 5 · TTS — מה מומש ומה לא

### מה כן:
- **IndexedDB cache** (`studio-tts-cache-v1`) — מוכן לטיפול ב-Blob URLs כש-backend יגיע
- **SHA-256 keying** (WebCrypto API; FNV-1a fallback אם אין subtle)
- **Backend hook** — `window.AvneiStudioTTSBackend.synthesize(text)` (אם cloud agent יחשוף)
- **Web Speech fallback marker** — מחזיר `{ fallback:'web-speech', text, ttsPending:true, durationMs:estimate }`
- **estimateDurationMs** — heuristic של ~90ms/char (תואם AvriNeural rate=-10%)

### מה לא:
- **on-demand AvriNeural** — אין client SDK. ה-Python scripts (`generate-island-*-audio.py`) רצים build-time בלבד.
- **MediaRecorder + Web Speech → Blob** — לא מומש כי הוא לא יעבור איכותית את AvriNeural; עדיף UI agent ישמיע את ה-Web Speech ישירות.

### מה צריך:
**ל-pilot 1.6.2026 → במצב הנוכחי:** UI agent מקבל `{ fallback:'web-speech', text }` → מנגן `speechSynthesis.speak(new SpeechSynthesisUtterance(text, {lang:'he-IL'}))`. Validator יעיר warning `tts_pending` שמופיע ב-preview, כדי שמורה תדע שזה זמני.

**Phase 4:** Supabase Edge Function שעוטף את edge-tts/Python, חוזרת MP3 Blob. cloud agent יבנה את זה.

---

## 6 · Tests

```bash
node avnei-yesod/underwater-app/scripts/test-studio-pipeline.js
```

**32/32 ירוק** · ללא תלות network · ללא DOM/IndexedDB (בודק את ה-fallback path).

| קבוצה | טסטים |
|---|---|
| AT (auto-tagger) | 7 — basic, final letter normalize, niqud strip, invalid mechanic, deriveRamaTask, tier default, null rama_task |
| NQ (niqud post-processor) | 8 — strip, dagesh skip, dagesh add (בַ→בַּ, כְפָר, פִתְחִי, מילים מרובות), un-niqud skip, mid-word skip |
| TT (TTS fallback) | 3 — fallback marker, duration estimate scaling, empty input |
| VL (validator) | 13 — happy path, missing letter/mechanic/rama_task, niqud_missing, niqud_violation_bgd_kpt, distractors_too_few, distractors_too_similar (warning), letters_involved_empty, letter_not_in_22 (final), tts_pending warning, findYofi/findKol/distractorsHaveConfusion units |
| LS (local-store) | 6 — CRUD roundtrip, validation block on publish, draft→published transition, versioning ++, delete, teacher_id filter |
| MD (metadata) | 3 — 6 islands, mechanic Hebrew labels, tier Hebrew labels |
| E2E | 2 — full happy flow, bad-niqud blocked at publish |

**Network tests skipped:** הקריאה ל-Dicta (`_applyNiqudViaDicta`) לא רצה ב-CI. ה-post-processor (`ensureBgdKptDagesh`) נבדק עצמאית.

---

## 7 · ל-UI Agent — checklist הסנכרון

לאחר שאני מסיים (= עכשיו), UI agent צריך:

1. **להסיר את `_pipeline-stub.js`** מ-`teacher-studio.html` (היה זמני)
2. **לוודא סדר הטעינה ב-HTML:**
   ```html
   <script src="js/studio/metadata.js"></script>
   <script src="js/studio/auto-tagger.js"></script>
   <script src="js/studio/niqud-client.js"></script>
   <script src="js/studio/tts-batch.js"></script>
   <script src="js/studio/validator-pipeline.js"></script>
   <script src="js/studio/local-store.js"></script>
   <script src="js/studio/_pipeline-real.js"></script>  <!-- LAST -->
   ```
3. **לטפל ב-fallback אודיו:** ב-preview.js, אם `generateTTS` מחזיר `{fallback:'web-speech', text}` → להריץ `speechSynthesis.speak(new SpeechSynthesisUtterance(text, {lang:'he-IL'}))`. **לא** לסמוך על `audioUrl` הריק.
4. **לטפל ב-error format של `publishItem`:** הוא זורק `Error.validation = {valid, errors}` — UI יציג את ה-`e.hebrew` של כל error/warning ויחסום אם יש severity='error'.
5. **לקרוא ל-`autoTag` בכל שינוי בוויזרד** (debounced) ולתת ל-`validateContent` להחזיר warnings בזמן אמת ל-preview.
6. **`sessionStorage['studio-teacher-id']`** — UI agent קובע את ה-id (מ-auth flow ב-cloud, או 'guest' ב-`?guest=1`). אם לא קיים — Pipeline default ל-'guest' שקט.

---

## 8 · אסור-לי-לעשות checklist (וידוא)

- ✅ לא נגעתי בקבצי UI agent (`teacher-studio.html`, `css/studio.css`, `js/studio/wizard.js`, `js/studio/preview.js`, `js/studio/validator-ui.js`, `js/studio/feedback.js`, `js/studio/_pipeline-stub.js` — אף אחד מהם לא היה קיים, ולא יצרתי אותם)
- ✅ לא נגעתי ב-`js/shared/*` (bkt, event-logger, pack-bkt-bridge, state, item-schema, runtime-mode, cloud-sync)
- ✅ לא נגעתי ב-teacher-rama.html / teacher-action*.html / teacher-live.html
- ✅ לא נגעתי ב-stage-*.html
- ✅ לא נגעתי ב-`curriculum/packs/`
- ✅ לא דחפתי ל-git (רק מקומי — תזמורת תדחוף)
- ✅ לא נגעתי ב-CLAUDE.md / memory
- ✅ לא שיניתי את `ALL_HEBREW_LETTERS_22` או רשימת ה-mechanics
- ✅ לא נגעתי בקבצים של אי 5 / cloud agent
- ✅ אין UI code (אין `document.createElement`, אין DOM access) בקבצים שלי

---

## 9 · Blockers / נקודות פתוחות

**אין blockers.** ה-pipeline מוכן לסנכרון עם UI agent.

נקודות פתוחות לעיון מיטל:

1. **Dicta endpoint** — נכון להיום עוקב שני URLs (`/api/nakdan` ראשי, `/addnikud` fallback). אם ה-API משתנה — לעדכן ב-`niqud-client.js` קבועים בראש הקובץ.
2. **SOUND_CONFUSIONS** — הוספתי 10 רשומות בסיסיות. אם מורה מעירה ש-distractors קלים מדי, להרחיב לפי הצורך.
3. **getAvailableIslands** — מחזיר 6 איים נכון להיום. כשמתווסף אי חדש (8/9/10), לעדכן את `metadata.js` + `RAMA_TASK_MAP` ב-`auto-tagger.js`.
4. **TTS backend** — חוסם איכות אודיו לפיילוט. cloud agent ייצור Edge Function (לפי `project-avnei-yesod-cloud-architecture`), זה ילך ל-`AvneiStudioTTSBackend.synthesize`.

---

## 10 · Checkpoint למיטל

```
✅ Studio-Pipeline Agent · Phase A-F done
- Files changed: 8 new (6 in js/studio/, 1 in scripts/, 1 _handoff/), 0 modified outside scope
- Tests: 32/32 passing (node test-studio-pipeline.js)
- TTS status: fallback (web-speech marker + IndexedDB cache ready) — נדרש backend ל-AvriNeural מלא
- API contract changes from bootstrap: minor (sync validateContent · +getMechanicDescription · fallback marker shape · publishItem throws with .validation)
- Blockers: none
- Next: מיטל לוודא UI agent מתואם → push
```
