# SPEC — שלב 0.0: חוזה-אירוע מרכזי ומודל-נתונים

> מפרט בר-בנייה לחיבור לולאת-הנתונים הקרועה. נגזר מ-MAP v3 + סבב-הנדסה (GPT).
> **העיקרון-על:** לא לחבר 12 משחקים ל-BKT. לחבר את כולם לחוזה-אירוע אחד, ורק הוא מדבר עם מנועי-השליטה.

---

## 0. הבעיה שאנחנו סוגרים
`_measured-core.js:95` מייצר `onMeasured({firstCorrect, usedHelp})`, אבל כל 12 המשחקים מעבירים callback ריק → האירוע נזרק, BKT לא מוזן. לומי לא אדפטיבית בפועל.

---

## 0.5 בדיקת-התלבשות מול הקוד הקיים (14.7) — הפתעה גדולה

**קראתי `bkt.js` ו-`_measured-core.js`. `bkt.js` כבר הוא המנוע-המרכזי המתוחכם ש-GPT הורה לנו לבנות — הוא פשוט לא נקרא אף פעם.** רוב "המפרט" למטה כבר קיים בקוד:

| מה שתוכנן "לבנות" | סטטוס אמיתי בקוד |
|---|---|
| נקודת-ingest מרכזית אחת | ✅ **קיימת** — `LumiBKT.ingest(evt)` (`bkt.js:105`), "the ONE measured-ingest point". רק לא נקראת. |
| מפתח `target × skillDimension`, לא `itemId` | ✅ **כבר עשוי** — ממופתח לפי `word × KC-bucket` (`words` / `comp`), לא לפי itemId. ה"תיקון הקריטי" של GPT כבר מיושם. |
| `meet`/`function`/`produce` לא מעלים שליטה | ✅ **קיים** (`bkt.js:114`, `recordProduction` = evidence-only). |
| שער נגד "זיהוי רדוד" (multi-context) | ✅ **קיים וחזק יותר** — דורש ≥2 repTypes **וגם** ≥2 contexts **וגם** ניצחון discriminate אמיתי (`bkt.js:139-147`, כולל הערת "Meytal 13.7"). |
| ראיות שקופות למבוגר | ✅ **קיים** — `firstSuccess/successNoHelp/successNewImage/successInSentence/successNextSession`. |
| ראיה חוצת-סשן | ✅ **קיים** — `HISTORY_KEY` ששורד `reset()`. |

### מה שבאמת עדיין חסר (זה שלב 0.0 האמיתי — קטן בהרבה)
1. 🔴 **לקרוא ל-`ingest` מהמשחקים.** המשחק בונה `evt` מהפריט (`word,dimension,kc_comprehension,repType,context,isDiscriminate,newImage`) + `onMeasured` (`firstCorrect→is_correct, usedHelp`), וקורא `LumiBKT.ingest(evt)`. + `beginSession()` בטעינה, `markMet()` על meet, `recordProduction()` על produce. **זה הלב — ופתאום לומי אדפטיבית.**
2. 🟠 **event-store גולמי append-only.** `bkt.js` שומר רק **מצב נגזר** (`pKnown` וכו') ב-localStorage — אין לוג-אירועים immutable. זה הרובד ההנדסי החדש היחיד המשמעותי (ל-baseline/replay/telemetry).
3. 🟡 **שקלול-ראיה לפי תמיכה.** `bktUpdate` משתמש ב-pG/pS קבועים לכל KC — לא משתנה לפי בחירה-מ-2 מול שליפה-עצמאית. שדרוג, לא חוסם.
4. 🟡 **לכידה עשירה** (`responseTimeMs`, `supportsUsed`, presented≠completed) — דורש הרחבה קטנה של `_measured-core` (היום חושף רק `firstCorrect/usedHelp` בוליאני). לא חוסם לחיווט בסיסי.

**מסקנה: אין הפתעה חוסמת. המפרט מתלבש — ובעצם דורש פחות קוד ממה שנכתב, כי מנוע-השליטה כבר בנוי.** הסעיפים למטה נשארים כ*יעד* למודל-הנתונים המלא; למימוש מיידי, רובם כבר מסופקים ע"י `bkt.js`.

> **תיקון אחד למפרט:** `_measured-core` **כן** מספיק לחיווט בסיסי — המשחק בונה את רוב ה-evt מהפריט עצמו; הליבה רק צריכה הרחבה אם רוצים `supportsUsed`+זמן-תגובה. וה"מבחן 4-תרחישים" (§6) נשאר תקף כ-DoD.

---

## 1. הארכיטקטורה — שכבה אחת, לא 12

**אסור** (המלכודת — יוצר 12 פרשנויות שונות תוך שבועות):
```js
onMeasured(result) { updateBKT(item.id, result.firstCorrect); }
```

**נכון** — כל משחק שולח אירוע-גלם אחיד לשכבה מרכזית אחת:
```js
onMeasured(rawResult) {
  LearningTelemetry.recordAttempt({ activityContext, itemContext, rawResult });
}
```

ורק השכבה המרכזית עושה את כל השרשרת:
```js
const event    = normalizeMeasuredEvent({ learner, session, activity, item, rawResult });
validateLearningEvent(event);        // זורק אם צירוף לא-חוקי (§4)
eventStore.append(event);            // append-only, immutable
const evidence = evidencePolicy.fromEvent(event);   // §3 — עוצמה משוקללת
bkt.update(evidence);
spacedRepetition.update(evidence);
```

**למה זו המלכודת המרכזית:** שלב 0.0 נראה כמו "החלף callback ריק בקריאה ל-BKT", אבל זה המקום שבו נקבעת **הסמנטיקה של כל נתוני-הלמידה**. חיבור מהיר מדי (`firstCorrect=true → correct`) מחזיר בדיוק לבעיה: בחירה-מ-4, פעולה-אחרי-משפט, שליפה-עם-רמז והפקה-עצמאית נחשבות ראיה שקולה. הן לא.

---

## 2. סכימת האירוע (append-only, immutable)

```js
{
  schemaVersion: 1,               // ביטוח-migration: לקרוא עבר לפי גרסה
  eventId: "uuid",
  eventType: "learning_attempt",

  learnerId: "...",
  sessionId: "...",
  activityId: "lantern-of-hello",
  activityVersion: "git-sha|build-id",   // אותו itemId מתנהג אחרת אחרי שינוי מסיחים/רמזים

  itemId: "...",
  targetId: "...",                // ← מפתח-השליטה נגזר מזה, לא מ-itemId (§5)
  sourceWorld: "friends",

  skillDimension: "produce",
  responseModePresented: "speech",
  responseModeCompleted: "speech",       // הילד עשוי להיות מוצע speech ולעבור ל-choice
  supportLevel: "guided",                // סולם נקי (§3)
  supportsUsed: ["audio_replay","first_sound"],

  correct: true,                  // תוצאה סופית
  firstCorrect: true,             // הניסיון הנמדד — זה מה שנספר ל-BKT
  usedHelp: true,
  attemptsCount: 2,
  hintsUsed: ["replay_audio","first_sound"],
  responseTimeMs: 3840,
  sequenceLength: 1,              // >1 לרצף-הוראות/מיזוג-צלילים (§3)

  skipped: false,
  completed: true,
  occurredAt: "2026-07-14T17:22:31.123Z"
}
```

### מה **לא** נכנס לאירוע הגולמי (אלה מצבים מחושבים, לא עובדות):
`strength` · `dueAt` · הסתברות-BKT · סטטוס `mastered`.
→ שומרים אירוע-גלם immutable; מצב-השליטה **נגזר** ממנו. כך אפשר לשנות נוסחת-BKT בלי לשכתב היסטוריה.

---

## 3. מודל שלושת-הצירים (מעודכן)

### `skillDimension`
```
meet | recognize | discriminate | comprehend | produce | function | decode
```
- **`meet` = חשיפה, לא נושא-שליטה.** נרשם ל-last-seen אבל **לא מעלה שליטה** כמו תשובה נכונה.
- **`decode`** יתפצל בעתיד (אם הפוניקס יתרחב) ל-`phonological_awareness | grapheme_phoneme | decode` — **לא ל-MVP.**

### `responseMode` + מאפיינים (לא להגדיל enum מיותר)
```
exposure | choice | action | recall | speech | dialogue | trace | construct
```
- רצף (2 הוראות / סידור / מיזוג-צלילים) = לא mode חדש, אלא `responseMode:"action"` + `sequenceLength:2`.
- לשמור **presented** מול **completed** בנפרד (skip-speech→choice = ראיה מסוג אחר, לא הפקה שנכשלה).

### `supportLevel` — סולם נקי ל-BKT + רשימת-אמת
הבעיה בישן: `full_model/visual_hint/first_sound/delayed_choices/independent` אינם על סולם אחד.
```js
supportLevel: "independent" | "light" | "guided" | "modeled"   // סולם — לשקלול BKT
supportsUsed: [                                                // האמת הפדגוגית
  "audio_replay","visual_context","first_sound",
  "partial_model","delayed_choices","immediate_choices","co_speech"
]
```

### עוצמת עדכון-שליטה לפי ראיה (evidencePolicy)
| ראיה | עוצמה |
|---|---|
| בחירה מ-2 | קטן |
| בחירה מ-4 | קטן–בינוני |
| פעולה אחרי משפט | בינוני |
| שליפה עם צליל-ראשון | בינוני |
| שליפה עצמאית | גדול |
| שימוש עצמאי במשפטון | גדול יותר |

---

## 4. צירופים לא-חוקיים (ולידציה — גם ב-build, לא רק runtime)

| # | צירוף | כלל |
|---|---|---|
| 1 | `meet × recall/speech/dialogue` | לא-חוקי. `meet`=חשיפה; חוקי רק `exposure`, או `action`/`speech` כחיקוי מודרך **ללא עדכון-שליטה יצרנית**. |
| 2 | `recognize × speech` | כמעט תמיד שגיאת-תיוג (אמירה = `produce`). חוקי: `recognize × choice/action`. |
| 3 | `produce × choice` | בחירה אינה הפקה. בניית-ביטוי מחלקים = `function × construct`. |
| 4 | `function × exposure` | חשיפה ל-function ≠ ראיה לשימוש. **אין לעדכן שליטה תפקודית.** |
| 5 | `decode × speech` ללא `hasWrittenStimulus:true` | אמירה-מתמונה אינה פענוח. חייב stimulus כתוב. |
| 6 | `independent` + `supportsUsed.length>0` | סתירה. אם ניתן רמז — לא independent. |
| 7 | `recall × immediate_choices` | אם אפשרויות מיד — זו לא שליפה. שליפה-עם-אפשרויות-מושהות = `presented:recall, completed:choice, delayed_choices`. |
| 8 | `dialogue` ללא תור-קודם | חייבת פנייה שהילד מגיב לה / תור שהוא יוזם. אחרת = `produce × speech`. |

```js
isValidSkillResponse(skillDimension, responseMode)
isValidSupport(responseMode, supportLevel, supportsUsed)
hasRequiredStimulus(skillDimension, item)   // decode דורש stimulus כתוב
```

---

## 5. מפתח-השליטה
```
learnerId × targetId × skillDimension        ✅
learnerId × itemId                            ❌
```
אותו `apple` מופיע בכמה פריטים ועולמות. הצמדה ל-`itemId` → הילד "שולט" ב-3 גרסאות נפרדות בלי שהמערכת תחבר. השליטה תלויה ביעד הלשוני × המיומנות, לא בפריט הספציפי.

---

## 6. מבחן-קבלה לשלב 0.0 (Definition of Done)
לפני שממשיכים ל-T7, **ארבעת התרחישים חייבים להניב אירועים שונים** שמגיעים ל-BKT כראיות שונות:

1. נכון בפעם הראשונה, ללא עזרה.
2. נכון אחרי `audio_replay`.
3. טעות → רמז → נכון.
4. דילוג על דיבור → מעבר ל-`choice`.

אם ארבעתם מגיעים כ-`correct=true` זהה — הלולאה חוברה אבל **המודל עיוור.** זה כישלון של שלב 0.0.

---

## סדר-עבודה מוצע לשלב 0.0
1. `LearningTelemetry.recordAttempt` + `normalizeMeasuredEvent` + `validateLearningEvent` + `eventStore` (append-only).
2. `evidencePolicy.fromEvent` (טבלת §3) → `bkt.update` על מפתח `learner×target×skillDimension`.
3. לחבר משחק **אחד** (T7 / lantern-of-hello — כבר קורא dimensions) ולהוכיח את מבחן 4-התרחישים.
4. רק אז לפרוס את החיבור ל-11 הנותרים + ולידציית-build על `items/*.json`.
