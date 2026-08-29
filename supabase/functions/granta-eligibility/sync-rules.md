# `rules-elig.json` שבתיקייה הזו הוא **עותק נגזר**, לא מקור

מקור האמת היחיד הוא [`granta/_data/rules-elig.json`](../../../granta/_data/rules-elig.json).
Supabase Edge Function אורזת רק את התיקייה של עצמה ולכן אינה יכולה לייבא מ-`granta/_data/`,
ולכן העותק כאן הכרחי — **אבל אף פעם לא עורכים אותו.** עורכים את המקור, ואז מסנכרנים.

---

## סנכרון — שתי פקודות

```bash
# 1. העתקה (מריצים משורש הריפו)
cp granta/_data/rules-elig.json supabase/functions/granta-eligibility/rules-elig.json

# 2. שני ה-hash שצריך להדביק ב-engine.ts
deno run --allow-read - granta/_data/rules-elig.json <<'EOF'
function canonicalize(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonicalize);
  if (v && typeof v === "object") {
    const s = v as Record<string, unknown>;
    const o: Record<string, unknown> = {};
    for (const k of Object.keys(s).sort()) o[k] = canonicalize(s[k]);
    return o;
  }
  return v;
}
const sha = async (t: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t))))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
const raw = await Deno.readTextFile(Deno.args[0]);
console.log("RULES_SHA256_RAW       =", await sha(raw));
console.log("RULES_SHA256_CANONICAL =", await sha(JSON.stringify(canonicalize(JSON.parse(raw)))));
EOF
```

מעדכנים את `RULES_SHA256_RAW` ו-`RULES_SHA256_CANONICAL` ב-`engine.ts` (סעיף 2)
לערכים שהפקודה הדפיסה, ומריצים `deno test -A supabase/functions/granta-eligibility/test.ts`.
הבדיקה `שומר-הסדק` נכשלת אם שכחתם.

---

## 🔴 שומר-הסדק

בעלייה המנוע מחשב את ה-hash של העותק ומשווה לקבועים ב-`engine.ts`:

| מסלול | מתי | מה נתפס |
|---|---|---|
| `raw` | כשקריאת הקובץ הגולמי מצליחה (ברירת מחדל) | כל שינוי, כולל רווח בודד |
| `canonical` | fallback, כשאין הרשאת קריאה | שינוי תוכן בלבד — לא רווחים |

בפער:

1. אזהרה בולטת ל-console (`🔴🔴🔴 GRANTA RULES DRIFT`),
2. `meta.rules_drift: true` + `meta.rules_hash` / `rules_hash_expected` / `rules_drift_detail_he` בכל תשובה.

**הפונקציה לא נופלת.** פסיקה עם קטלוג ישן, מסומנת כחשודה, עדיפה על אפס פסיקה —
אבל אסור שהיא תעבור בשקט, כי שני עותקים שנסדקים בלי שאיש יודע הם בדיוק הדרך
שבה עמותה מקבלת פסיקה לפי כללים שכבר לא קיימים.

הבדיקה נעשית פעם אחת לכל instance ונשמרת, לא בכל בקשה.
