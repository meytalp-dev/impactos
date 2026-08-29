// ============================================================================
// גְּרַנְטָה · Supabase Edge Function — granta-eligibility  (M3 · מנוע הכללים)
// ============================================================================
// מקבל פלט של granta-scan-website (או כתובת אתר, ואז קורא לסורק בעצמו),
// מריץ מעליו את 15 כללי ה-ELIG מהקטלוג, ומחזיר:
//   score (0–100) · verdict · triggered[] · needs_review[] · skipped[]
// כל ממצא עם explain_he · fix_template · evidence.
//
// ספק: granta/SPEC.md §2 · M1 + M3
// קטלוג: granta/_data/rules-elig.json  →  ./rules-elig.json (עותק נגזר · sync-rules.md)
// טבלה: supabase/migrations/0100_granta_core.sql → granta_eligibility_checks · granta_leads
//
// ----------------------------------------------------------------------------
// 🔴 שלושה כללים שהתשובה הזו לא מפרה
// ----------------------------------------------------------------------------
// 1. on_unknown נאכף — null אינו הפרה. needs_review דוחף ל"דורש בדיקה"
//    גם בציון 100. כשל סריקה מלא ⇒ "דורש בדיקה", לא פסילה.
// 2. blocker פוסל — גם בציון 95.
// 3. disclaimer_he מופיע בכל תשובה, גם כשהפסיקה חיובית וגם בשגיאה.
//
// ----------------------------------------------------------------------------
// פריסה
// ----------------------------------------------------------------------------
//   supabase functions deploy granta-eligibility
// משתני סביבה (מוזרקים אוטומטית על ידי Supabase):
//   SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
// אופציונלי: GRANTA_SCANNER_URL — עוקף את כתובת הסורק (הרצה מקומית).
// הכתיבה ל-granta_eligibility_checks / granta_leads ב-service_role בכוונה:
// המיגרציה קובעת ש-anon/authenticated לא כותבים לטבלאות האלה.
// ============================================================================

import {
  CATALOG_WARNING_HE,
  CONTRACT_FIELDS,
  DISCLAIMER_HE,
  ENGINE_VERSION,
  type EligibilityResult,
  evaluateEligibility,
  extractScanFields,
  type FieldMap,
  mergeFields,
  RULES,
  RULES_VERSION,
  rulesIntegrity,
} from "./engine.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SCANNER_TIMEOUT_MS = 30_000; // תקציב הסורק הוא 15 שניות + מרווח רשת
const DB_TIMEOUT_MS = 8_000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ============================================================================
// 1. קריאה לסורק
// ============================================================================
// 🔴 אם הסורק לא ענה — לא מחזירים false על אף שדה. כל השדות נשארים null,
//    כל הכללים יורדים ל-needs_review, והפסיקה יוצאת "דורש בדיקה".

/**
 * האם הקורא רשאי לכתוב לליד?
 *
 * מותר רק ל: service_role (המפתח הסודי של הפרויקט, או JWT עם role=service_role)
 * ולאופרייטור (JWT עם granta_role=operator ב-app_metadata — לא ב-user_metadata,
 * שהמשתמש עורך בעצמו).
 *
 * המפתח הפומבי (anon / sb_publishable_) לעולם לא מספיק.
 */
function callerMayPersist(req: Request): boolean {
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const apikey = (req.headers.get("apikey") ?? "").trim();
  const service = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();

  // המפתח הסודי עצמו — הפורמט הישן (JWT) והחדש (sb_secret_) כאחד.
  if (service && (bearer === service || apikey === service)) return true;

  // JWT של משתמש מחובר.
  try {
    const part = bearer.split(".")[1];
    if (!part) return false;
    const pad = part.length % 4 ? "=".repeat(4 - (part.length % 4)) : "";
    const claims = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/") + pad));
    if (claims?.role === "service_role") return true;
    // 🔴 app_metadata בלבד. user_metadata ניתן לעריכה על ידי המשתמש עצמו.
    if (claims?.app_metadata?.granta_role === "operator") return true;
  } catch (_) { /* לא JWT — לא מורשה */ }

  return false;
}

function scannerEndpoint(): string | null {
  const override = Deno.env.get("GRANTA_SCANNER_URL");
  if (override) return override;
  const base = Deno.env.get("SUPABASE_URL");
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/functions/v1/granta-scan-website`;
}

async function runScanner(
  url: string,
): Promise<{ scan: unknown | null; error: string | null }> {
  const endpoint = scannerEndpoint();
  if (!endpoint) {
    return {
      scan: null,
      error: "כתובת הסורק לא הוגדרה (חסר SUPABASE_URL / GRANTA_SCANNER_URL).",
    };
  }
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { apikey: key, Authorization: `Bearer ${key}` } : {}),
      },
      signal: AbortSignal.timeout(SCANNER_TIMEOUT_MS),
      // 🔴 lead_id לא מועבר לסורק: הסורק היה כותב שורה משלו ל-
      // granta_eligibility_checks בלי rules/score/verdict, ואנחנו כותבים
      // שורה מלאה אחת. שורה אחת לכל ריצה, לא שתיים.
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const detail = await res.text();
      return { scan: null, error: `הסורק החזיר ${res.status}: ${detail.slice(0, 300)}` };
    }
    const body = await res.json();
    if (body && typeof body === "object" && "error" in body) {
      return { scan: null, error: `הסורק החזיר שגיאה: ${String(body.error)}` };
    }
    return { scan: body, error: null };
  } catch (e) {
    return { scan: null, error: e instanceof Error ? e.message : String(e) };
  }
}

// ============================================================================
// 2. כתיבה לבסיס הנתונים
// ============================================================================
// עמודות granta_eligibility_checks לפי מיגרציה 0100 §2.4:
//   id · lead_id · org_id · website · scan · rules · blockers · score ·
//   verdict · source · checked_at · created_at
// verdict מוגבל ב-CHECK ל-likely_eligible | needs_review | likely_ineligible,
// ולכן נכתב הקוד ולא הנוסח העברי. הנוסח העברי חי בתוך scan.verdict_he.

function restHeaders(key: string, extra: Record<string, string> = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function dbEnv(): { url: string; key: string } | null {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ""), key };
}

/** שולף org_id ו-website של הליד, כדי שהשורה תישב על התיק הנכון. */
async function fetchLead(
  leadId: string,
): Promise<{ org_id: string | null; website: string | null } | null> {
  const env = dbEnv();
  if (!env) return null;
  try {
    const res = await fetch(
      `${env.url}/rest/v1/granta_leads?id=eq.${encodeURIComponent(leadId)}&select=org_id,website&limit=1`,
      { headers: restHeaders(env.key), signal: AbortSignal.timeout(DB_TIMEOUT_MS) },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return {
      org_id: rows[0]?.org_id ?? null,
      website: rows[0]?.website ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * rule_code → תוצאה, לעמודת rules.
 * כלל שנדלק / דורש בדיקה / דולג נשמר במלואו — כדי שהשורה תהיה מסמך אמון
 * שאפשר לקרוא גם אחרי שהקטלוג ישתנה. כלל שעבר נשמר בקצרה.
 */
function rulesColumn(result: EligibilityResult): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [code, r] of Object.entries(result.rules)) {
    out[code] = r.status === "ok"
      ? {
        status: r.status,
        severity: r.severity,
        weight: r.weight,
        weight_applied: r.weight_applied,
        reason_he: r.reason_he,
      }
      : r;
  }
  return out;
}

async function persist(
  leadId: string,
  result: EligibilityResult,
  scanPayload: unknown,
  website: string | null,
  warnings: string[],
): Promise<{ check_inserted: boolean; lead_updated: boolean }> {
  const env = dbEnv();
  if (!env) {
    warnings.push(
      "התוצאה לא נשמרה לבסיס הנתונים: חסרים SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.",
    );
    return { check_inserted: false, lead_updated: false };
  }

  const lead = await fetchLead(leadId);
  const site = website ?? lead?.website ?? null;

  let checkInserted = false;
  try {
    const res = await fetch(`${env.url}/rest/v1/granta_eligibility_checks`, {
      method: "POST",
      headers: restHeaders(env.key, { Prefer: "return=minimal" }),
      signal: AbortSignal.timeout(DB_TIMEOUT_MS),
      body: JSON.stringify({
        lead_id: leadId,
        org_id: lead?.org_id ?? null,
        website: site,
        scan: {
          // פלט הסורק כמו שהוא, בלי לשטח — כדי שאפשר יהיה לשחזר את ההרצה
          scanner: scanPayload,
          // מפת השדות שהמנוע פסק עליה בפועל (סריקה + השלמות ידניות)
          fields: result.fields,
          verdict_he: result.verdict,
          verdict_reason_he: result.verdict_reason_he,
          missing_fields: result.missing_fields,
          triggered_weight_sum: result.triggered_weight_sum,
          warnings: result.warnings,
          rules_version: result.rules_version,
          engine_version: result.engine_version,
          evaluated_at: result.evaluated_at,
          disclaimer_he: result.disclaimer_he,
        },
        rules: rulesColumn(result),
        blockers: result.blockers,
        score: result.score,
        verdict: result.verdict_code,
        source: "system",
      }),
    });
    if (res.ok) checkInserted = true;
    else {
      const detail = await res.text();
      warnings.push(
        `שמירת הבדיקה ל-granta_eligibility_checks נכשלה (${res.status}): ${detail.slice(0, 300)}`,
      );
    }
  } catch (e) {
    warnings.push(
      `שמירת הבדיקה ל-granta_eligibility_checks נכשלה: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  // 🔴 בליד מעדכנים ציון ופסיקה בלבד. status נשאר של האופרייטור.
  let leadUpdated = false;
  try {
    const res = await fetch(
      `${env.url}/rest/v1/granta_leads?id=eq.${encodeURIComponent(leadId)}`,
      {
        method: "PATCH",
        headers: restHeaders(env.key, { Prefer: "return=minimal" }),
        signal: AbortSignal.timeout(DB_TIMEOUT_MS),
        body: JSON.stringify({
          eligibility_score: result.score,
          verdict: result.verdict_code,
        }),
      },
    );
    if (res.ok) leadUpdated = true;
    else {
      const detail = await res.text();
      warnings.push(
        `עדכון granta_leads נכשל (${res.status}): ${detail.slice(0, 300)}`,
      );
    }
  } catch (e) {
    warnings.push(
      `עדכון granta_leads נכשל: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  return { check_inserted: checkInserted, lead_updated: leadUpdated };
}

// ============================================================================
// 3. ה-HTTP shell
// ============================================================================

function json(body: Record<string, unknown>, status = 200): Response {
  // 🔴 disclaimer_he בכל תשובה — גם בשגיאה.
  const payload = { disclaimer_he: DISCLAIMER_HE, ...body };
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}

export interface EligibilityRequest {
  lead_id?: string;
  scan?: unknown;
  url?: string;
  /** השלמות ידניות — 5 השדות שהסורק לעולם לא קובע. */
  declared?: FieldMap;
  /** כינוי ל-declared, לנוחות קוראים שמזינים מפה שטוחה. */
  fields?: FieldMap;
}

export async function handle(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  let payload: EligibilityRequest;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }
  if (!payload || typeof payload !== "object") {
    return json({ ok: false, error: "bad_json" }, 400);
  }

  const leadId = typeof payload.lead_id === "string" ? payload.lead_id.trim() : "";
  if (leadId && !UUID_RE.test(leadId)) {
    return json({ ok: false, error: "bad_lead_id" }, 400);
  }

  const url = typeof payload.url === "string" ? payload.url.trim() : "";
  const hasScan = payload.scan !== undefined && payload.scan !== null;
  if (!hasScan && !url) {
    return json(
      {
        ok: false,
        error: "missing_input",
        detail_he: "צריך scan (פלט granta-scan-website) או url לסריקה.",
      },
      400,
    );
  }
  if (url.length > 2048) return json({ ok: false, error: "url_too_long" }, 400);

  const warnings: string[] = [];
  let scanPayload: unknown = null;
  let scanSource: "provided" | "scanner" | "none" = "none";
  let scanError: string | null = null;

  if (hasScan) {
    scanPayload = payload.scan;
    scanSource = "provided";
  } else {
    const r = await runScanner(url);
    if (r.scan) {
      scanPayload = r.scan;
      scanSource = "scanner";
    } else {
      // 🔴 כשל סריקה מלא — כל השדות נשארים null. אין פסילה.
      scanError = r.error;
      warnings.push(
        `סריקת האתר נכשלה (${r.error}). כל שדות הסריקה נשארו לא-ידועים, ולכן הפסיקה היא "דורש בדיקה" ולא פסילה.`,
      );
    }
  }

  const extracted = extractScanFields(scanPayload);
  if (extracted.shape === "flat" && scanSource === "scanner") {
    warnings.push(
      "פלט הסורק הגיע במבנה שטוח ולא תחת result.fields — נקרא לפי מפתחות החוזה.",
    );
  }
  for (const w of extracted.scan_warnings) warnings.push(`מהסורק: ${w}`);

  const declared = (payload.declared ?? payload.fields ?? null) as FieldMap | null;
  const merged = mergeFields(extracted.fields, declared, warnings);

  const result = evaluateEligibility(merged.fields, { warnings });

  // ---- שומר-הסדק ----
  const integrity = await rulesIntegrity();

  // ---- שמירה ----
  //
  // 🔴 אבטחה — כתיבה לליד דורשת הרשאה מפורשת.
  // הפונקציה רצה ב-service_role ולכן ה-RLS לא חל עליה: המיגרציה 0100 חוסמת
  // מ-anon לכתוב eligibility_score/verdict ברמת העמודה, והפונקציה עוקפת את
  // החסימה הזו לגמרי. בלי הבדיקה כאן, כל מי שמחזיק במפתח הפומבי — שנמצא
  // בקוד המקור של כל דף — יכול לקבוע פסיקה לליד. נתפס בבדיקה חיה 29.8.2026.
  //
  // הערכה בלי lead_id נשארת פתוחה: היא לא כותבת כלום ומשרתת את המשפך.
  let persisted = { check_inserted: false, lead_updated: false };
  let persistDenied = false;

  if (leadId) {
    if (!callerMayPersist(req)) {
      persistDenied = true;
      result.warnings.push(
        "התוצאה לא נשמרה: כתיבה לליד מחייבת הרשאת שירות. ההערכה מוחזרת בלבד.",
      );
    } else {
      const website = typeof result.fields.site_url === "string" && result.fields.site_url
        ? result.fields.site_url
        : (url || null);
      persisted = await persist(leadId, result, scanPayload, website, result.warnings);
    }
  }

  return json({
    ok: true,
    score: result.score,
    verdict: result.verdict,
    verdict_code: result.verdict_code,
    verdict_reason_he: result.verdict_reason_he,

    triggered: result.triggered,
    needs_review: result.needs_review,
    skipped: result.skipped,
    passed: result.passed,

    triggered_codes: result.triggered_codes,
    needs_review_codes: result.needs_review_codes,
    skipped_codes: result.skipped_codes,
    passed_codes: result.passed_codes,

    blockers: result.blockers,
    missing_fields: result.missing_fields,
    triggered_weight_sum: result.triggered_weight_sum,

    fields: result.fields,
    field_sources: merged.sources,
    scan: scanPayload,

    warnings: result.warnings,
    rules_version: result.rules_version,
    engine_version: result.engine_version,
    evaluated_at: result.evaluated_at,

    meta: {
      lead_id: leadId || null,
      scan_source: scanSource,
      scan_shape: extracted.shape,
      scan_error: scanError,
      persisted: persisted.check_inserted,
      lead_updated: persisted.lead_updated,
      contract_fields: CONTRACT_FIELDS,
      rules_count: RULES.length,
      rules_version: RULES_VERSION,
      // 🔴 שומר-הסדק: העותק המקומי מול granta/_data/rules-elig.json
      rules_drift: integrity.rules_drift,
      rules_hash: integrity.rules_hash,
      rules_hash_expected: integrity.rules_hash_expected,
      rules_hash_mode: integrity.rules_hash_mode,
      rules_drift_detail_he: integrity.detail_he,
      // 🔴 הקטלוג עצמו עדיין טיוטה שלא אומתה מול תיעוד גוגל (G-29)
      catalog_warning_he: CATALOG_WARNING_HE,
    },
  });
}

Deno.serve(async (req: Request) => {
  try {
    return await handle(req);
  } catch (e) {
    // 🔴 גם חריגה לא צפויה לא הופכת לפסילה.
    return json(
      {
        ok: false,
        error: "exception",
        detail: e instanceof Error ? e.message : String(e),
        engine_version: ENGINE_VERSION,
      },
      500,
    );
  }
});
