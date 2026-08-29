# `granta-eligibility` · מנוע הזכאות (M3)

Edge Function של גְּרַנְטָה שמריצה את 15 כללי ה-`ELIG` מ-
[`granta/_data/rules-elig.json`](../../../granta/_data/rules-elig.json)
מעל פלט הסורק [`granta-scan-website`](../granta-scan-website/README.md),
ומחזירה **ציון · פסיקה · ממצאים מנומקים בעברית**.

ספק: `granta/SPEC.md` §2 · M1 (משפך זכאות) + M3 (מנוע הכללים).
טבלאות: `granta_eligibility_checks` · `granta_leads` (מיגרציה `0100_granta_core.sql`).

---

## 🔴 שלושת הכללים שהמנוע לא מפר

### 1. `on_unknown` נאכף — `null` אינו הפרה

| ערך בשדה | מה קורה |
|---|---|
| `false` על כלל `blocker` | הכלל **נדלק** → פסילה |
| `null` / `"unknown"` / מחרוזת ריקה | לפי `on_unknown` של הכלל בקטלוג |

`on_unknown: needs_review` (13 מתוך 15 הכללים) → הכלל **לא** יורד מהציון,
אבל **מוריד את הפסיקה ל"דורש בדיקה"** — גם בציון 100.
`on_unknown: skip` (רק `GG-ELIG-06`) → מדולג לגמרי.
`on_unknown: violation` → נספר כהפרה מלאה (אף כלל לא משתמש בזה כרגע).

זו ההגנה שמונעת פסילת עמותה זכאית בגלל כשל סריקה.
🔴 **כשל סריקה מלא** (הסורק לא ענה) ⇒ כל השדות `null` ⇒ ציון 100, פסיקה "דורש בדיקה" — לא פסילה.

בנוסף: ערך מטיפוס שלא מתאים לאופרטור (למשל `sitemap_pages: "הרבה"` מול `lt`)
מטופל כלא-ידוע **ולא** כהפרה, עם אזהרה מפורשת ב-`warnings`.

### 2. `blocker` פוסל — ציון ופסיקה הם שני דברים שונים

כלל אחד בחומרת `blocker` שנדלק ⇒ `verdict = "כנראה לא זכאית"`, גם בציון 97.
הציון הוא כלי תקשורת מול העמותה; הפסיקה נקבעת קודם כל לפי חסמים.

### 3. `disclaimer_he` בכל תשובה

```
זו הערכה של גרנטה. האישור בידי Google בלבד.
```

מופיע בכל תשובה — כולל פסיקה חיובית, כולל תשובות שגיאה (`400`/`405`/`500`).

---

## החוזה

### קלט

```http
POST /granta-eligibility
Content-Type: application/json

{
  "lead_id": "<uuid, אופציונלי>",
  "scan":    { /* פלט granta-scan-website כמו שהוא */ },
  "url":     "hopa.org.il",
  "declared": { "entity_type": "nonprofit_amuta", "nihul_takin_status": "valid" }
}
```

| שדה | התנהגות |
|---|---|
| `scan` | אם קיים — משתמשים בו ולא סורקים שוב. 🔴 **השדות מקוננים תחת `scan.fields`** (כך הסורק מחזיר). מפה שטוחה מתקבלת גם היא. |
| `url` | רק כשאין `scan` — המנוע קורא ל-`granta-scan-website` בעצמו. |
| `lead_id` | UUID. אם קיים — התוצאה נכתבת ל-DB (ראו למטה). |
| `declared` (או `fields`) | השלמות ידניות שגוברות על הסורק. זה הערוץ לחמשת השדות שהסורק לעולם לא קובע. |

צריך `scan` **או** `url`; בלי שניהם — `400 missing_input`.

### פלט

```jsonc
{
  "disclaimer_he": "זו הערכה של גרנטה. האישור בידי Google בלבד.",
  "ok": true,
  "score": 100,                      // 100 פחות סכום משקלי הכללים שנדלקו
  "verdict": "דורש בדיקה",
  "verdict_code": "needs_review",    // likely_eligible | needs_review | likely_ineligible
  "verdict_reason_he": "לא נדלק אף חסם, אבל 4 כללים לא ניתנים להכרעה...",

  "triggered":    [ /* ממצאים שנדלקו */ ],
  "needs_review": [ /* כללים שלא ניתן להכריע — מידע חסר */ ],
  "skipped":      [ /* on_unknown=skip */ ],
  "passed":       [ /* נבדקו ולא נדלקו */ ],
  "triggered_codes": [], "needs_review_codes": [], "skipped_codes": [], "passed_codes": [],

  "blockers":       [ /* רק חסמים שנדלקו, מנומק בעברית */ ],
  "missing_fields": [ { "field": "entity_type", "codes": ["GG-ELIG-01","GG-ELIG-02"],
                        "source": "declared|operator", "desc_he": "..." } ],
  "triggered_weight_sum": 0,

  "fields":        { /* 19 מפתחות החוזה — מה שהמנוע פסק עליו בפועל */ },
  "field_sources": { "ssl_valid": "scan", "entity_type": "declared", "…": "none" },
  "scan":          { /* פלט הסורק כמו שהוא */ },

  "warnings": [ /* בעברית */ ],
  "rules_version": "1.0.0-draft",
  "engine_version": "granta-eligibility/1.0.0",
  "evaluated_at": "2026-08-29T…Z",
  "meta": { "rules_drift": false, "rules_hash": "…", "catalog_warning_he": "…", "…": "…" }
}
```

כל ממצא (`triggered` / `needs_review` / `skipped` / `passed`) נושא:
`code · category · severity · title_he · status · weight · weight_applied ·`
**`explain_he` · `fix_template`** `· fix_kind · needs_approval · doc_url · on_unknown ·`
`reason_he · detect {field, op, value, actual} ·` **`evidence`** (השדות מ-`evidence_fields`).

### הפסיקה

תרגום ישיר של `_meta.scoring.verdicts` בקטלוג:

| פסיקה | תנאי |
|---|---|
| `כנראה לא זכאית` | נדלק ≥1 `blocker`, **או** `score < 60` |
| `דורש בדיקה` | אין `blocker`, אבל יש ≥1 `needs_review`, **או** `score` 60–84 |
| `כנראה זכאית` | אין `blocker`, אין `needs_review`, `score ≥ 85` |

---

## מה הסורק לא ממלא — ולמה עמותה תקינה יוצאת "דורש בדיקה"

חמישה שדות חוזרים תמיד `null` מהסורק:
`entity_type` · `org_registration_number` · `nihul_takin_status` ·
`nihul_takin_expiry` · `domain_owned_by_org`.

שלושה מהם הם שדות `detect` של כללים (`GG-ELIG-01/02/03/04`), ולכן
**סריקה נקייה לגמרי עדיין תיתן "דורש בדיקה"** עד שאדם ימלא אותם דרך `declared`.
זו התנהגות נכונה, לא באג — ראו `note_he` של `TC-01` בקטלוג.

דוגמה אמיתית, `hopa.org.il` (סריקה חיה · 29.8.2026):

```
ssl_valid=true · sitemap_pages=43 · has_about/contact/privacy=true · third_party_ads=false
score 100 · triggered [] · skipped [GG-ELIG-06] · needs_review [GG-ELIG-01..04]
verdict: דורש בדיקה
```

ואחרי השלמה ידנית של `entity_type=nonprofit_amuta` · `nihul_takin_status=valid` ·
`domain_owned_by_org=true` — `score 100 · כנראה זכאית`.

---

## כתיבה לבסיס הנתונים

רק כשמתקבל `lead_id`, ורק ב-`service_role` (המיגרציה §4.4: ל-`anon` אין הרשאה).

**`granta_eligibility_checks`** — שורה חדשה בכל ריצה:
`lead_id` · `org_id` (נשלף מהליד) · `website` · `scan` · `rules` · `blockers` ·
`score` · `verdict` · `source='system'`.

* `verdict` נכתב כ**קוד** (`likely_eligible` / `needs_review` / `likely_ineligible`)
  כי ה-`CHECK` בעמודה מתיר רק אותם. הנוסח העברי נשמר ב-`scan.verdict_he`.
* `rules` = `rule_code → תוצאה`. כלל שנדלק / דורש בדיקה / דולג נשמר **במלואו**
  (כולל `explain_he` ו-`fix_template`) כדי שהשורה תישאר קריאה גם אחרי שהקטלוג ישתנה;
  כלל שעבר נשמר בקצרה.
* `blockers` = רק חסמים שנדלקו.

**`granta_leads`** — `PATCH` של `eligibility_score` + `verdict` בלבד.
🔴 `status` לא נוגעים בו — הוא של האופרייטור.

כשל כתיבה **לא** מפיל את התשובה: `meta.persisted=false` + אזהרה בעברית.
כך גם כשחסרים משתני הסביבה.

🔴 `lead_id` **לא** מועבר לסורק, כדי שלא תיווצר שורה שנייה ב-
`granta_eligibility_checks` בלי `rules`/`score`/`verdict`. שורה אחת לכל ריצה.

---

## הרצה מקומית ובדיקות

```bash
deno check supabase/functions/granta-eligibility/*.ts
deno test  -A supabase/functions/granta-eligibility/test.ts   # 14 בדיקות

# שרת מקומי על :8000
deno run -A supabase/functions/granta-eligibility/index.ts
curl -X POST http://127.0.0.1:8000/ -H 'content-type: application/json' \
  -d '{"scan":{"fields":{"ssl_valid":true,"sitemap_pages":43}}}'
```

`test.ts` מריץ את שלושת ה-`_testcases` **מתוך הקטלוג עצמו** — לא משוכפלים —
ובודק התאמה מדויקת של `triggered` · `skipped` · `needs_review` ·
`triggered_weight_sum` · `score` · `verdict`.

`GRANTA_SCANNER_URL` עוקף את כתובת הסורק (ברירת מחדל:
`${SUPABASE_URL}/functions/v1/granta-scan-website`).

פריסה:

```bash
supabase functions deploy granta-eligibility
```

---

## קטלוג הכללים — עותק נגזר

`./rules-elig.json` הוא **עותק** של `granta/_data/rules-elig.json` ואסור לערוך אותו.
ראו [`sync-rules.md`](sync-rules.md) — כולל שומר-הסדק שמדליק `meta.rules_drift`.

---

## 🔴 מגבלות — לקרוא לפני שמציגים פסיקה לעמותה

1. **הקטלוג עצמו הוא טיוטה שלא אומתה מול תיעוד גוגל.** `_meta.warning_he` מוחזר
   כמות שהוא ב-`meta.catalog_warning_he`. G-29 אמור לאמת כלל-כלל ולמלא `doc_url`
   (כרגע כולם `null` — במכוון, אף כתובת לא הומצאה).
2. **סף 5 העמודים ב-`GG-ELIG-08` הוא הערכה שלנו, לא מספר של גוגל** (`TODO-GG-ELIG-08`).
   אסור להציג אותו לעמותה כדרישה של גוגל לפני אימות.
3. **סף 30 הימים ב-`GG-ELIG-06` הוא החלטה תפעולית שלנו**, לא מדיניות גוגל.
   בפועל הכלל כמעט תמיד מדולג, כי הסורק מחזיר `ssl_expires_in_days = null` תמיד.
4. **המנוע לא מאמת את הסורק.** `false` מהסורק נלקח כ"נבדק ואין" — עם המגבלות
   שכתובות ב-README של הסורק (בלי JS, בית + עד 4 עמודי-משנה בלבד).
5. **`GG-ELIG-02` לא ידלק על מוסד חינוכי** — הוא נתפס על ידי `GG-ELIG-01`.
   שני הכללים לא חופפים בכוונה, כדי שלא תהיה הורדת ניקוד כפולה על אותה עובדה.
6. **הפסיקה היא הערכה.** האישור בידי Google בלבד.
