// ============================================================================
// גְּרַנְטָה · בדיקות מנוע הזכאות
// ============================================================================
// מריץ את שלושת ה-_testcases שכתובים בקטלוג עצמו, ובודק התאמה מדויקת של
// triggered / skipped / needs_review / triggered_weight_sum / score / verdict.
// 🔴 מקרי הבדיקה נקראים מהקטלוג — לא משוכפלים לכאן. אם הקטלוג משתנה,
//    הבדיקה משתנה איתו ולא נשארת מאחור.
//
//   deno test -A supabase/functions/granta-eligibility/test.ts
// ============================================================================

import { assertEquals } from "jsr:@std/assert@1";
import {
  CONTRACT_FIELDS,
  DISCLAIMER_HE,
  evaluateEligibility,
  extractScanFields,
  isUnknown,
  mergeFields,
  RULES,
  rulesIntegrity,
  TESTCASES,
  VERDICT_HE,
} from "./engine.ts";

// ---------------------------------------------------------------------------
// 1. שלושת מקרי המבחן מהקטלוג
// ---------------------------------------------------------------------------
for (const tc of TESTCASES) {
  Deno.test(`${tc.id} — ${tc.title_he}`, () => {
    const res = evaluateEligibility(tc.input);
    assertEquals(res.triggered_codes, tc.expected.triggered, "triggered");
    assertEquals(res.skipped_codes, tc.expected.skipped, "skipped");
    assertEquals(res.needs_review_codes, tc.expected.needs_review, "needs_review");
    assertEquals(
      res.triggered_weight_sum,
      tc.expected.triggered_weight_sum,
      "triggered_weight_sum",
    );
    assertEquals(res.score, tc.expected.score, "score");
    assertEquals(res.verdict, tc.expected.verdict, "verdict");
    // 🔴 בכל תשובה, גם בפסיקה חיובית
    assertEquals(res.disclaimer_he, DISCLAIMER_HE);
  });
}

// ---------------------------------------------------------------------------
// 2. שלושת הכללים שאסור להפר
// ---------------------------------------------------------------------------

Deno.test("null אינו הפרה — כשל סריקה מלא נותן 'דורש בדיקה' ולא פסילה", () => {
  const res = evaluateEligibility({});
  assertEquals(res.score, 100, "אף כלל לא נדלק ⇒ הציון נשאר 100");
  assertEquals(res.triggered_codes, []);
  assertEquals(res.verdict, VERDICT_HE.review);
  assertEquals(res.blockers.length, 0);
  // GG-ELIG-06 מוגדר on_unknown=skip ולכן דולג ולא נספר כחסר מידע
  assertEquals(res.skipped_codes, ["GG-ELIG-06"]);
  assertEquals(res.needs_review_codes.length, RULES.length - 1);
  assertEquals(res.missing_fields.length > 0, true, "הסיבה חייבת להיות מוצגת");
});

Deno.test("blocker פוסל גם בציון גבוה", () => {
  // רק כלל אחד נדלק — GG-ELIG-14 (blocker, משקל 3). הציון 97.
  const res = evaluateEligibility({
    entity_type: "nonprofit_amuta",
    nihul_takin_status: "valid",
    site_url: "https://x.example",
    site_domain: "x.example",
    domain_owned_by_org: true,
    site_reachable: true,
    ssl_valid: true,
    ssl_expires_in_days: 200,
    https_redirect: true,
    sitemap_pages: 40,
    has_about_page: true,
    has_contact_page: true,
    has_privacy_policy: true,
    third_party_ads: false,
    affiliate_links: false,
    ecommerce_store: false,
    redirects_to_third_party: true,
  });
  assertEquals(res.score, 97);
  assertEquals(res.triggered_codes, ["GG-ELIG-14"]);
  assertEquals(res.verdict, VERDICT_HE.ineligible, "ציון 97 ובכל זאת פסילה");
  assertEquals(res.blockers[0].code, "GG-ELIG-14");
});

Deno.test("needs_review דוחף ל'דורש בדיקה' גם בציון 100", () => {
  const base = TESTCASES.find((t) => t.id === "TC-01-hopa-positive")!;
  const res = evaluateEligibility({ ...base.input, nihul_takin_status: null });
  assertEquals(res.score, 100);
  assertEquals(res.verdict, VERDICT_HE.review);
  assertEquals(res.needs_review_codes, ["GG-ELIG-03"]);
});

// ---------------------------------------------------------------------------
// 3. הבחנת null מול false — הלב של המוצר
// ---------------------------------------------------------------------------

Deno.test("false על שדה blocker פוסל, null על אותו שדה לא", () => {
  const base = TESTCASES.find((t) => t.id === "TC-01-hopa-positive")!;

  const withFalse = evaluateEligibility({ ...base.input, ssl_valid: false });
  assertEquals(withFalse.triggered_codes, ["GG-ELIG-05"]);
  assertEquals(withFalse.verdict, VERDICT_HE.ineligible);

  const withNull = evaluateEligibility({ ...base.input, ssl_valid: null });
  assertEquals(withNull.triggered_codes, []);
  assertEquals(withNull.needs_review_codes, ["GG-ELIG-05"]);
  assertEquals(withNull.score, 100);
  assertEquals(withNull.verdict, VERDICT_HE.review);
});

Deno.test("isUnknown: null/undefined/'unknown'/'' כן · false/0 לא", () => {
  assertEquals(isUnknown(null), true);
  assertEquals(isUnknown(undefined), true);
  assertEquals(isUnknown("unknown"), true);
  assertEquals(isUnknown("  "), true);
  assertEquals(isUnknown(false), false);
  assertEquals(isUnknown(0), false);
  assertEquals(isUnknown(true), false);
});

Deno.test("ערך מטיפוס לא מתאים אינו הופך להפרה בשקט", () => {
  const base = TESTCASES.find((t) => t.id === "TC-01-hopa-positive")!;
  const res = evaluateEligibility({ ...base.input, sitemap_pages: "הרבה" });
  assertEquals(res.triggered_codes, []);
  assertEquals(res.needs_review_codes, ["GG-ELIG-08"]);
  assertEquals(
    res.warnings.some((w) => w.includes("GG-ELIG-08")),
    true,
  );
});

// ---------------------------------------------------------------------------
// 4. חוזה הסורק — fields מקונן
// ---------------------------------------------------------------------------

Deno.test("extractScanFields קורא את המבנה המקונן של הסורק", () => {
  const scan = {
    ok: true,
    fields: { ssl_valid: true, sitemap_pages: 43 },
    sitemap_source: "sitemap_xml",
    warnings: ["אזהרה כלשהי"],
  };
  const e = extractScanFields(scan);
  assertEquals(e.shape, "nested");
  assertEquals(e.fields.ssl_valid, true);
  assertEquals(e.fields.sitemap_pages, 43);
  assertEquals(e.scan_warnings, ["אזהרה כלשהי"]);
  // 🔴 sitemap_source יושב מחוץ ל-fields ואסור שייכנס למפת השדות
  assertEquals("sitemap_source" in e.fields, false);
});

Deno.test("extractScanFields מקבל גם מפה שטוחה, ומסנן מפתחות זרים", () => {
  const e = extractScanFields({ ssl_valid: true, לא_בחוזה: 1 });
  assertEquals(e.shape, "flat");
  assertEquals(e.fields, { ssl_valid: true });
});

Deno.test("mergeFields: השלמה ידנית גוברת על הסורק, ומסומנת ככזו", () => {
  const warnings: string[] = [];
  const m = mergeFields(
    { site_url: "https://hopa.org.il", ssl_valid: true, entity_type: null },
    { entity_type: "nonprofit_amuta", nihul_takin_status: "valid" },
    warnings,
  );
  assertEquals(Object.keys(m.fields).length, CONTRACT_FIELDS.length);
  assertEquals(m.fields.entity_type, "nonprofit_amuta");
  assertEquals(m.sources.entity_type, "declared");
  assertEquals(m.sources.ssl_valid, "scan");
  assertEquals(m.sources.affiliate_links, "none");
});

// ---------------------------------------------------------------------------
// 5. שלמות הקטלוג ושומר-הסדק
// ---------------------------------------------------------------------------

Deno.test("הקטלוג: 15 כללים · סכום משקלים 100 · 19 שדות", () => {
  assertEquals(RULES.length, 15);
  assertEquals(RULES.reduce((s, r) => s + r.weight, 0), 100);
  assertEquals(CONTRACT_FIELDS.length, 19);
  assertEquals(CONTRACT_FIELDS.some((f) => f.startsWith("_")), false);
});

Deno.test("שומר-הסדק: העותק המקומי תואם ל-granta/_data", async () => {
  const integrity = await rulesIntegrity();
  assertEquals(
    integrity.rules_drift,
    false,
    `העותק נסדק מהמקור. ${integrity.detail_he}`,
  );
});
