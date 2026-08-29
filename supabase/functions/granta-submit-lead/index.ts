// ============================================================================
// גְּרַנְטָה · Supabase Edge Function — granta-submit-lead  (M1 · משפך הזכאות)
// ============================================================================
// נקודת הכניסה היחידה של טופס בדיקת הזכאות הציבורי (granta/check.html).
//
// מה היא עושה:
//   1. מוודאת את הקלט — אותם כללים בדיוק כמו ה-WITH CHECK של המדיניות
//      granta_leads_insert_public במיגרציה 0100. שכפול מכוון: שתי שכבות.
//   2. מכניסה את הליד ב-service_role ומחזירה תשובה **מיד**.
//   3. מריצה את granta-eligibility ברקע (EdgeRuntime.waitUntil) כדי שהליד
//      יקבל ציון ופסיקה בלי שהמשתמשת תמתין לסריקה.
//
// ----------------------------------------------------------------------------
// 🔴 למה הפונקציה הזו קיימת בכלל
// ----------------------------------------------------------------------------
// האפיון (§2 M1) מבטיח "בדיקה אוטומטית תוך שניות". הטופס הכניס ליד ישירות,
// ושום דבר לא הפעיל את המנוע — לידים נחתו בלי ציון ובלי פסיקה.
//
// ואי אפשר לתת לדפדפן להפעיל את המנוע: granta-eligibility רצה ב-service_role
// ולכן היא עוקפת RLS, וההרשאה לכתוב פסיקה לליד מוגבלת בכוונה לקורא מורשה
// (ראו callerMayPersist שם). הדפדפן לעולם לא יהיה כזה.
//
// הפתרון: הדפדפן מדבר עם הפונקציה הזו בלבד, והיא — בצד שרת, עם המפתח שלה —
// מפעילה את המנוע. שום סוד לא עובר בדפדפן ושום סוד לא נשמר במסד.
//
// ----------------------------------------------------------------------------
// 🔴 מה **לא** חוזר לקורא
// ----------------------------------------------------------------------------
// לא ה-id של הליד, לא הציון ולא הפסיקה. ההבטחה בדף היא מייל תוך 24 שעות
// אחרי שאופרייטור אישר (§2 M1), לא פסיקה מיידית על המסך. החזרת ה-id הייתה
// גם נותנת למי שיודע לנחש דרך לכתוב עליו.
//
// פריסה:  supabase functions deploy granta-submit-lead
// סביבה (מוזרק על ידי Supabase): SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
// ============================================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DB_TIMEOUT_MS = 8_000;
const ENGINE_TIMEOUT_MS = 60_000;

// אותה רגקס שאוכפת המדיניות ב-0100 §5.2.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// אלה בדיוק 11 העמודות שב-GRANT ל-anon. שדה מחוץ לרשימה לא נכתב לעולם:
// eligibility_score · verdict · status · responded_at · org_id · notes
// נשארים בברירת המחדל, ורק המנוע והאופרייטור נוגעים בהם.
const ALLOWED = [
  "org_name", "website", "email", "has_grants", "source",
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "referrer",
] as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}

function env() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ""), key };
}

/** נרמול כתובת אתר: משלים https, דוחה סכמה שאינה http/s ומארח בלי נקודה. */
function normalizeWebsite(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function normalizeHasGrants(v: unknown): boolean | null {
  if (v === true || v === "yes" || v === "כן" || v === "true") return true;
  if (v === false || v === "no" || v === "עדיין לא" || v === "false") return false;
  return null;
}

/**
 * ולידציה שמשקפת את ה-WITH CHECK של granta_leads_insert_public.
 * אם זה עובר כאן והמסד עדיין דוחה — יש פער בין השכבות, וזה באג.
 */
function validate(p: Record<string, unknown>) {
  const errors: string[] = [];

  const orgName = typeof p.org_name === "string" ? p.org_name.trim() : "";
  if (orgName.length < 2 || orgName.length > 200) errors.push("org_name");

  const email = typeof p.email === "string" ? p.email.trim().toLowerCase() : "";
  if (!email || email.length > 320 || !EMAIL_RE.test(email)) errors.push("email");

  const website = normalizeWebsite(p.website);
  if (!website || website.length > 500) errors.push("website");

  if (errors.length) return { ok: false as const, errors };

  const row: Record<string, unknown> = {
    org_name: orgName,
    email,
    website,
    has_grants: normalizeHasGrants(p.has_grants),
    source: typeof p.source === "string" && p.source.trim() ? p.source.trim().slice(0, 60) : "check",
  };
  for (const k of ALLOWED) {
    if (k in row) continue;
    const v = p[k];
    if (typeof v === "string" && v.trim()) row[k] = v.trim().slice(0, 300);
  }
  // website ודאי מחרוזת כאן — שדה ריק כבר נדחה למעלה.
  return { ok: true as const, row, website: website as string };
}

/** מפעיל את מנוע הזכאות על הליד. רץ ברקע — כשל כאן לא מפיל את ההגשה. */
async function runEngine(leadId: string, website: string) {
  const e = env();
  if (!e) return;
  try {
    const res = await fetch(`${e.url}/functions/v1/granta-eligibility`, {
      method: "POST",
      headers: {
        apikey: e.key,
        Authorization: `Bearer ${e.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lead_id: leadId, url: website }),
      signal: AbortSignal.timeout(ENGINE_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[submit-lead] המנוע החזיר ${res.status} לליד ${leadId}`);
    }
  } catch (err) {
    // הליד כבר נשמר. האופרייטור יראה אותו בלי ציון ויוכל להריץ ידנית.
    console.error(`[submit-lead] המנוע נכשל לליד ${leadId}:`, err instanceof Error ? err.message : err);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const e = env();
  if (!e) return json({ ok: false, error: "server_misconfigured" }, 500);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const v = validate(payload);
  if (!v.ok) return json({ ok: false, error: "validation_failed", fields: v.errors }, 400);

  // הכנסה — מבקשים את ה-id בחזרה כדי להפעיל עליו את המנוע, אבל לא מחזירים אותו.
  let leadId: string;
  try {
    const res = await fetch(`${e.url}/rest/v1/granta_leads`, {
      method: "POST",
      headers: {
        apikey: e.key,
        Authorization: `Bearer ${e.key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(v.row),
      signal: AbortSignal.timeout(DB_TIMEOUT_MS),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("[submit-lead] הכנסה נכשלה:", res.status, detail.slice(0, 300));
      return json({ ok: false, error: "insert_failed" }, 502);
    }
    const rows = await res.json();
    leadId = Array.isArray(rows) ? rows[0]?.id : rows?.id;
    if (!leadId) return json({ ok: false, error: "insert_failed" }, 502);
  } catch (err) {
    console.error("[submit-lead] הכנסה נכשלה:", err instanceof Error ? err.message : err);
    return json({ ok: false, error: "insert_failed" }, 502);
  }

  // 🔴 המנוע רץ ברקע: המשתמשת מקבלת תשובה מיד, והסריקה (2–5 שניות) לא
  //    מעכבת את הטופס. waitUntil שומר על ה-instance חי עד שהוא מסיים.
  const bg = runEngine(leadId, v.website);
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(bg); else await bg;

  return json({ ok: true });
});
