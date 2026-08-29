# `granta-scan-website` · סורק אתר לבדיקת זכאות (M1)

Edge Function של גְּרַנְטָה שמקבלת כתובת אתר, סורקת אותה, ומחזירה **בדיוק** את שדות
ה-`_fields` מתוך [`granta/_data/rules-elig.json`](../../../granta/_data/rules-elig.json) —
כדי שמנוע הכללים (M3) יריץ עליהם את קטלוג ה-`ELIG` בלי שכבת תרגום באמצע.

ספק: `granta/SPEC.md` §2 · M1 · טבלת יעד: `granta_eligibility_checks` (מיגרציה `0100_granta_core.sql`).

---

## 🔴 הכלל שמעל כל הכללים — `null` ולא `false`

| ערך | משמעות |
|---|---|
| `false` | **בדקתי בפועל, ואין.** |
| `null` | **לא הצלחתי לבדוק.** |

הקטלוג מפעיל `on_unknown: needs_review` על `null` ומוריד את הפסיקה ל"דורש בדיקה",
בעוד `false` על כלל `blocker` מפיל את העמותה ל"כנראה לא זכאית".
לכן **כל** מסלול כשל בסורק — timeout, כשל DNS, חסימת בוטים, HTML שלא הגיע —
מחזיר `null`. כל שדה מאותחל ל-`null` ונכתב ל-`false` רק אחרי בדיקה שהצליחה בפועל.
(ראו `TODO-SCANNER-CONTRACT` בקטלוג הכללים.)

---

## החוזה

### קלט

```http
POST /granta-scan-website
Content-Type: application/json

{ "url": "hopa.org.il", "lead_id": "<uuid, אופציונלי>" }
```

`url` — חובה, עד 2048 תווים. סכימה חסרה מושלמת ל-`https://`.
`lead_id` — אם נשלח, חייב להיות UUID תקין; התוצאה נכתבת ל-`granta_eligibility_checks`.

### פלט

```jsonc
{
  "ok": true,
  "fields": { /* 🔴 בדיוק 19 המפתחות של _fields — בלי תוספת ובלי חוסר */ },
  "sitemap_source": "sitemap_xml | sitemap_index | robots_sitemap | home_crawl | null",
  "scanned_at": "2026-08-29T07:59:57.682Z",
  "scanner_version": "granta-scan-website/1.0.0",
  "evidence": { /* איזו כתובת/דפוס הכריעו כל שדה — לאופרייטור */ },
  "warnings": [ /* בעברית: מה לא נבדק ולמה */ ],
  "meta": { /* סטטוס, דומיין סופי, עמודים שנסרקו, משך, persisted */ }
}
```

> **למה `fields` מקונן ולא שטוח?** כדי שאפשר יהיה לאמת אוטומטית
> `Object.keys(result.fields) ≡ Object.keys(rules._fields)` — התאמה מדויקת
> בשני הכיוונים. `sitemap_source` / `scanned_at` / `scanner_version` נדרשו
> במפורש ואינם חלק מהחוזה, ולכן הם יושבים **מחוץ** ל-`fields`.

### מה הסורק קובע

| שדה | איך |
|---|---|
| `site_url` | הקלט אחרי נרמול |
| `site_domain` | המארח שאליו הבקשה **נחתה בפועל**, אחרי מעקב הפניות ידני |
| `site_reachable` | סטטוס 2xx. `401/403/429` → `null` (הגנת בוטים ולא אתר שבור) |
| `ssl_valid` | הצלחת ה-handshake ב-`https://`. עונה ב-http אך לא ב-https → `false`. לא ענה בכלל → `null` |
| `ssl_expires_in_days` | **תמיד `null`** — ראו מגבלות |
| `https_redirect` | קפיצת ההפניה הראשונה מ-`http://` עוברת ל-`https://`. פורט 80 לא ענה → `null` |
| `sitemap_pages` | `/sitemap.xml` → `sitemapindex` (עד 10 בנים) → `robots.txt` → זחילה רדודה מהבית |
| `has_about_page` · `has_contact_page` · `has_privacy_policy` | מילון עברית+אנגלית על נתיבי ה-sitemap, קישורי הבית וכתובות JSON-LD |
| `third_party_ads` · `affiliate_links` · `ecommerce_store` | דפוסים על ה-HTML של הבית + עד 4 עמודי-משנה |
| `redirects_to_third_party` | השוואת eTLD+1 של הכתובת שנמסרה מול הדומיין הסופי |

### מה הסורק **לא** קובע — תמיד `null`, נמלא ידנית

`entity_type` · `org_registration_number` · `nihul_takin_status` ·
`nihul_takin_expiry` · `domain_owned_by_org`

אין דרך אמינה לגזור אותם מסריקת HTTP. הם מגיעים מהצהרת העמותה בטופס `/check`
ומאימות של האופרייטור מול רשם העמותות, ומוזרקים למנוע הכללים על ידי הצד הקורא.
הרשימה חוזרת גם בפלט, תחת `meta.operator_filled_fields`.

---

## הרצה מקומית

```bash
# שרת מקומי על :8000
deno run -A supabase/functions/granta-scan-website/index.ts

curl -X POST http://127.0.0.1:8000/ \
  -H 'content-type: application/json' \
  -d '{"url":"hopa.org.il"}'
```

בדיקת טיפוסים:

```bash
deno check supabase/functions/granta-scan-website/index.ts
```

הפונקציה מייצאת `scanWebsite(url)`, `registrableDomain()`, `affiliateReason()`,
`AD_PATTERNS` ו-`ECOMMERCE_PATTERNS` — כדי שאפשר יהיה לבדוק את הלוגיקה בלי לעלות לרשת.

פריסה:

```bash
supabase functions deploy granta-scan-website
```

---

## כתיבה לבסיס הנתונים

כשמתקבל `lead_id` הפונקציה כותבת שורה ל-`granta_eligibility_checks` דרך PostgREST
ב-`service_role` (המיגרציה §4.4 קובעת שכתיבת המנוע נעשית ב-service_role בלבד;
ל-`anon` אין הרשאה על הטבלה הזו).

נכתבות **רק** עמודות שהמיגרציה מגדירה בפועל: `lead_id` · `website` · `scan` · `source='system'`.
`rules` · `blockers` · `score` · `verdict` הם פלט של **מנוע הכללים** ולא של הסורק,
ונשארים בברירת המחדל של המיגרציה — הסורק לא פוסק זכאות.

משתני סביבה: `SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` (מוזרקים אוטומטית ב-Supabase).
כשהם חסרים הסריקה עדיין מוחזרת, עם `meta.persisted=false` ואזהרה בעברית — לא שגיאה.

---

## מגבלות הסורק — 🔴 לקרוא לפני שמציגים ממצא לעמותה

1. **`ssl_expires_in_days` תמיד `null`.** Deno לא חושף את תעודת העמית —
   `Deno.connectTls(...).handshake()` מחזיר `{ alpnProtocol }` בלבד (נבדק ב-Deno 2.9.6).
   לא הומצא מספר. כלל `GG-ELIG-06` מוגדר `on_unknown: skip`, ולכן `null` כאן
   פשוט מדלג על הכלל ולא פוגע בציון. מדידת תוקף אמיתית תדרוש שירות חיצוני.
2. **הסורק לא מריץ JavaScript.** באתרי SPA (כמו `hopa.org.il`) ה-HTML של הבית
   כמעט ריק. זיהוי עמודי אודות/קשר/פרטיות נשען בעיקר על ה-sitemap ועל JSON-LD,
   אבל **דגלים אדומים שמוזרקים בזמן ריצה לא ייתפסו**. במקרה כזה מתווספת אזהרה מפורשת.
3. **הדגלים האדומים נבדקים על הבית + עד 4 עמודי-משנה, לא על כל האתר.**
   כלל `GG-ELIG-12` מדבר על "גם קישור בודד וישן, בפוסט מלפני שנתיים" —
   סריקה כזו דורשת זחילה מלאה. `false` כאן = "לא נמצאה עדות בעמודים שנסרקו".
4. **`third_party_ads` — רשימת הרשתות צרה בכוונה.** `googletagmanager` · `gtag` ·
   `googleadservices` · GA4 · `doubleclick` · פיקסל פייסבוק **אינם** מסומנים:
   הם תגי מדידה ורימרקטינג של העמותה עצמה. לסמן אותם = לפסול כל עמותה שמודדת
   המרות, כולל הופה (שיש לה `AW-…` על הבית). המחיר: רשת באנרים אקזוטית עלולה לחמוק.
5. **`affiliate_links` — `ref=` הוא פרמטר נפוץ גם בקישורים תמימים.** הבדיקה מוגבלת
   לקישורים **יוצאים** בלבד, וכל התאמה נרשמת ב-`evidence.affiliate_matches` עם הסיבה.
   ממצא כאן מחייב עין של אופרייטור לפני שמוצג לעמותה.
6. **`ecommerce_store` — `/cart` או `/checkout` יכולים להיות דווקא זרימת תרומה.**
   הכלל `GG-ELIG-13` ממילא דורש שיקול דעת ("מכירה לטובת המטרה"), והראיה נשמרת.
7. **`registrableDomain` אינה Public Suffix List מלאה** אלא רשימת סיומות
   דו-רכיביות ממוקדת (`co.il`, `org.il`, `co.uk`, …). דומיין תחת סיומת אקזוטית
   עלול להיחשב בטעות "צד שלישי" ב-`redirects_to_third_party`.
8. **`sitemap_pages` מ-`home_crawl` הוא הערכת-חסר** — ספירת קישורים פנימיים
   ייחודיים מהבית בלבד. מתווספת אזהרה. שימו לב שכלל `GG-ELIG-08` (סף 5 עמודים)
   הוא ממילא מספר שנקבע על ידינו ולא על ידי גוגל (`TODO-GG-ELIG-08` בקטלוג).
9. **`has_about_page` נדלק גם על עוגן פנימי** (`#about`) באתר עמוד-יחיד.
   ה-`evidence` שומר את הכתובת המלאה כולל ה-fragment כדי שהאופרייטור יראה זאת.
10. **תקציב זמן קשיח 15 שניות** (`TOTAL_BUDGET_MS`), 8 שניות לבקשה בודדת.
    כשהתקציב נגמר באמצע — הסורק מחזיר את מה שהספיק ומוסיף אזהרה; הוא לא ממציא `false`.

## אבטחה

הפונקציה מקבלת URL מהעולם החיצון, ולכן:

- הפניות נעקבות **ידנית** (עד 5 קפיצות) ולא ב-`redirect: "follow"`.
- כל קפיצה עוברת בדיקת `isBlockedHost` מחדש — `localhost`, `127/8`, `10/8`,
  `192.168/16`, `172.16–31`, `169.254.169.254` (cloud metadata), `.local`, `.internal`, IPv6 ULA.
  הפניה היא וקטור SSRF קלאסי, ולכן לא מספיק לבדוק את הכתובת המקורית.
- רק `http`/`https`. גוף התשובה נקרא עם תקרה של 1.5MB.
- `lead_id` מאומת כ-UUID לפני שהוא מגיע ל-PostgREST.
