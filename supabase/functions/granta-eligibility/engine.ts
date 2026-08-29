// ============================================================================
// גְּרַנְטָה · מנוע הזכאות (M3) — הלוגיקה הטהורה
// ============================================================================
// מריץ את קטלוג כללי ה-ELIG מעל מפת השדות שהסורק (M1) מחזיר, ומחזיר
// ציון · פסיקה · ממצאים. אין כאן רשת ואין בסיס נתונים — רק הכרעה.
// ה-HTTP shell, קריאת הסורק והכתיבה ל-DB יושבים ב-index.ts.
//
// ספק: granta/SPEC.md §2 · M1 (משפך זכאות) + M3 (מנוע הכללים)
// מקור אמת: granta/_data/rules-elig.json  →  ./rules-elig.json (עותק נגזר)
//
// ----------------------------------------------------------------------------
// 🔴 שלושה כללים שהמנוע לא מפר, לעולם
// ----------------------------------------------------------------------------
// 1. on_unknown נאכף. שדה null (או "unknown") אינו הפרה — הוא needs_review,
//    והוא מוריד את הפסיקה ל"דורש בדיקה" גם בציון 100. זו ההגנה שמונעת
//    פסילת עמותה זכאית בגלל כשל סריקה.
// 2. blocker פוסל. כלל blocker שנדלק ⇒ "כנראה לא זכאית", גם בציון 95.
//    ציון ופסיקה הם שני דברים שונים.
// 3. disclaimer_he בכל תשובה — ההחלטה בידי Google בלבד.
//
// ----------------------------------------------------------------------------
// 🔴 המנוע לא ממציא כללים
// ----------------------------------------------------------------------------
// כל כלל, משקל, סף וניסוח מגיעים מהקטלוג. הקוד הזה מריץ אותו ותו לא.
// שני המספרים היחידים שמקודדים כאן — 85 ו-60 — הם תרגום מילולי של
// _meta.scoring.verdicts שכתוב בקטלוג בפרוזה ולא כשדה מכונה. ראו VERDICT_*.
// ============================================================================

import catalogJson from "./rules-elig.json" with { type: "json" };

export const ENGINE_VERSION = "granta-eligibility/1.0.0";

/** 🔴 TODO-VERDICT-COPY בקטלוג — חייב להופיע בכל מסך תוצאה ובכל תשובה. */
export const DISCLAIMER_HE =
  "זו הערכה של גרנטה. האישור בידי Google בלבד.";

// ============================================================================
// 1. טיפוסי הקטלוג
// ============================================================================

export type Op =
  | "eq" | "neq" | "in" | "not_in"
  | "is_true" | "is_false"
  | "lt" | "lte" | "gt" | "gte";

export type Severity = "blocker" | "high" | "medium" | "low";
export type OnUnknown = "needs_review" | "skip" | "violation";

export interface DetectSpec {
  field: string;
  op: Op;
  value?: unknown;
}

export interface Rule {
  code: string;
  category: string;
  severity: Severity;
  title_he: string;
  detect: DetectSpec;
  on_unknown: OnUnknown;
  evidence_fields: string[];
  explain_he: string;
  fix_kind: string;
  fix_template: string;
  needs_approval: boolean;
  doc_url: string | null;
  weight: number;
}

export interface FieldSpec {
  type: string;
  source: string;
  desc_he: string;
  values?: string[];
}

export interface TestCase {
  id: string;
  title_he: string;
  source_he?: string;
  note_he?: string;
  input: Record<string, unknown>;
  expected: {
    triggered: string[];
    skipped: string[];
    needs_review: string[];
    triggered_weight_sum: number;
    score: number;
    verdict: string;
  };
}

export interface Catalog {
  _meta: Record<string, unknown> & {
    version: string;
    warning_he: string;
    scoring: { verdicts: Record<string, string>; weights_sum: number };
  };
  _fields: Record<string, FieldSpec | string>;
  rules: Rule[];
  _todo: unknown[];
  _testcases: TestCase[];
}

export const CATALOG = catalogJson as unknown as Catalog;
export const RULES: Rule[] = CATALOG.rules;
export const TESTCASES: TestCase[] = CATALOG._testcases;
export const RULES_VERSION: string = CATALOG._meta.version;
/** אזהרת הטיוטה מהקטלוג — מוחזרת כמות שהיא, לא מרוככת. */
export const CATALOG_WARNING_HE: string = CATALOG._meta.warning_he;

/**
 * 19 מפתחות החוזה, נגזרים מהקטלוג עצמו.
 * 🔴 `_fields` מכיל גם `_note_he` — כל מפתח שמתחיל ב-`_` אינו שדה.
 */
export const CONTRACT_FIELDS: string[] = Object.keys(CATALOG._fields)
  .filter((k) => !k.startsWith("_"));

export type FieldMap = Record<string, unknown>;

// ============================================================================
// 2. שומר-הסדק · hash של העותק מול המקור
// ============================================================================
// Supabase Edge Function אורזת רק את התיקייה של עצמה ולכן אינה יכולה לייבא
// מ-granta/_data/. העותק ./rules-elig.json הוא **נגזר** — לא מקור.
// הקבועים למטה הם ה-hash של הקובץ ב-granta/_data ברגע ההעתקה האחרונה.
// אם העותק נסדק — כותבים אזהרה בולטת ומחזירים meta.rules_drift=true,
// אבל 🔴 לא מפילים את הפונקציה: פסיקה עם קטלוג ישן עדיפה על אפס פסיקה.
// עדכון הקבועים: ראו sync-rules.md.

/** SHA-256 של granta/_data/rules-elig.json — בית-בית. */
export const RULES_SHA256_RAW =
  "9d559e8996fef6f0db364b734178da771ef0d51f50b50e20b5abb2f67fc90a04";

/** SHA-256 של אותו קובץ אחרי נרמול קנוני (מפתחות ממוינים, בלי רווחים). */
export const RULES_SHA256_CANONICAL =
  "30b6e9e87440265d4626828b3c86766cf2e430de10985c0a8cecc6f6a2ef8af0";

export interface RulesIntegrity {
  /** true = העותק נסדק מהמקור · false = תואם · null = לא ניתן היה לאמת */
  rules_drift: boolean | null;
  rules_hash: string | null;
  rules_hash_expected: string;
  /** raw = השוואת בתים (חזקה) · canonical = השוואת תוכן (fallback) */
  rules_hash_mode: "raw" | "canonical";
  rules_version: string;
  detail_he: string;
}

function canonicalize(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonicalize);
  if (v && typeof v === "object") {
    const src = v as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(src).sort()) out[k] = canonicalize(src[k]);
    return out;
  }
  return v;
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function computeIntegrity(): Promise<RulesIntegrity> {
  // מסלול א' — קריאת הבתים של העותק. החזק ביותר: תופס גם שינוי רווח בודד.
  let rawText: string | null = null;
  let readError: string | null = null;
  try {
    rawText = await Deno.readTextFile(new URL("./rules-elig.json", import.meta.url));
  } catch (e) {
    readError = e instanceof Error ? e.message : String(e);
  }

  if (rawText !== null) {
    const hash = await sha256Hex(rawText);
    const drift = hash !== RULES_SHA256_RAW;
    return {
      rules_drift: drift,
      rules_hash: hash,
      rules_hash_expected: RULES_SHA256_RAW,
      rules_hash_mode: "raw",
      rules_version: RULES_VERSION,
      detail_he: drift
        ? "העותק ./rules-elig.json אינו זהה בית-בית ל-granta/_data/rules-elig.json שממנו הועתק. ראו sync-rules.md."
        : "העותק תואם בית-בית למקור.",
    };
  }

  // מסלול ב' — הריצה לא מורשית לקרוא קבצים. משווים תוכן מנורמל.
  const hash = await sha256Hex(JSON.stringify(canonicalize(CATALOG)));
  const drift = hash !== RULES_SHA256_CANONICAL;
  return {
    rules_drift: drift,
    rules_hash: hash,
    rules_hash_expected: RULES_SHA256_CANONICAL,
    rules_hash_mode: "canonical",
    rules_version: RULES_VERSION,
    detail_he: drift
      ? `תוכן העותק ./rules-elig.json שונה מהמקור granta/_data/rules-elig.json. (קריאת הקובץ הגולמי נכשלה: ${readError}; ההשוואה נעשתה על התוכן המנורמל.) ראו sync-rules.md.`
      : `תוכן העותק תואם למקור. (קריאת הקובץ הגולמי נכשלה: ${readError}; ההשוואה נעשתה על התוכן המנורמל ולכן אינה תופסת שינויי רווחים.)`,
  };
}

let integrityPromise: Promise<RulesIntegrity> | null = null;

/** בודק פעם אחת לכל instance, ושומר. בעלייה — לא בכל בקשה. */
export function rulesIntegrity(): Promise<RulesIntegrity> {
  if (!integrityPromise) {
    integrityPromise = computeIntegrity().then((res) => {
      if (res.rules_drift === true) {
        console.error(
          "\n" +
            "🔴🔴🔴 =====================================================================\n" +
            "🔴🔴🔴  GRANTA RULES DRIFT — קטלוג הכללים נסדק\n" +
            "🔴🔴🔴 =====================================================================\n" +
            `🔴🔴🔴  ${res.detail_he}\n` +
            `🔴🔴🔴  expected (${res.rules_hash_mode}): ${res.rules_hash_expected}\n` +
            `🔴🔴🔴  actual   (${res.rules_hash_mode}): ${res.rules_hash}\n` +
            "🔴🔴🔴  המנוע ממשיך לרוץ עם העותק שבתיקייה, אבל התוצאות עלולות\n" +
            "🔴🔴🔴  לא לשקף את הקטלוג הרשמי. תקנו לפי sync-rules.md.\n" +
            "🔴🔴🔴 =====================================================================\n",
        );
      }
      return res;
    });
  }
  return integrityPromise;
}

// 🔴 מריצים כבר בעלייה, כדי שהאזהרה תופיע בלוג גם בלי בקשה ראשונה.
rulesIntegrity().catch((e) => {
  console.error("granta-eligibility: rules integrity check failed:", e);
});

// ============================================================================
// 3. הכרעת "לא ידוע"
// ============================================================================
// 🔴 unknown_semantics_he בקטלוג: null, או המחרוזת "unknown", = "לא נקבע".
//    false אינו unknown. 0 אינו unknown. זו ההבחנה שכל המוצר עומד עליה.
//    מחרוזת ריקה נחשבת גם היא ללא-ידועה — נרמול לכיוון הבטוח (needs_review
//    ולא הפרה), לא כלל חדש.

export function isUnknown(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") {
    const s = v.trim();
    return s === "" || s === "unknown";
  }
  return false;
}

// ============================================================================
// 4. הפעלת אופרטור
// ============================================================================
// מחזיר true/false, או null = "לא ניתן להעריך" (טיפוס לא מתאים לאופרטור).
// null לעולם לא הופך ל-false בשקט — הוא נשלח למסלול on_unknown.

export function applyOp(op: Op, actual: unknown, expected: unknown): boolean | null {
  switch (op) {
    case "is_true":
      return typeof actual === "boolean" ? actual === true : null;
    case "is_false":
      return typeof actual === "boolean" ? actual === false : null;
    case "eq":
      return actual === expected;
    case "neq":
      return actual !== expected;
    case "in":
      return Array.isArray(expected) ? expected.includes(actual as never) : null;
    case "not_in":
      return Array.isArray(expected) ? !expected.includes(actual as never) : null;
    case "lt":
    case "lte":
    case "gt":
    case "gte": {
      if (typeof actual !== "number" || !Number.isFinite(actual)) return null;
      if (typeof expected !== "number" || !Number.isFinite(expected)) return null;
      if (op === "lt") return actual < expected;
      if (op === "lte") return actual <= expected;
      if (op === "gt") return actual > expected;
      return actual >= expected;
    }
    default:
      return null;
  }
}

// ============================================================================
// 5. תוצאת כלל
// ============================================================================

export type RuleStatus = "triggered" | "ok" | "needs_review" | "skipped";

export interface RuleOutcome {
  code: string;
  category: string;
  severity: Severity;
  title_he: string;
  status: RuleStatus;
  /** משקל הכלל בקטלוג */
  weight: number;
  /** כמה ירד בפועל מהציון — 0 לכל מי שלא נדלק */
  weight_applied: number;
  explain_he: string;
  fix_kind: string;
  fix_template: string;
  needs_approval: boolean;
  doc_url: string | null;
  on_unknown: OnUnknown;
  reason_he: string;
  detect: { field: string; op: Op; value: unknown; actual: unknown };
  evidence: Record<string, unknown>;
}

function fmtValue(v: unknown): string {
  if (v === null) return "null (לא ידוע)";
  if (v === undefined) return "לא נמסר";
  if (typeof v === "boolean") return v ? "true (כן)" : "false (לא)";
  if (typeof v === "string") return `«${v}»`;
  return String(v);
}

function collectEvidence(rule: Rule, fields: FieldMap): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const keys = new Set<string>([...(rule.evidence_fields ?? []), rule.detect.field]);
  for (const k of keys) out[k] = k in fields ? fields[k] : null;
  return out;
}

function outcome(
  rule: Rule,
  fields: FieldMap,
  status: RuleStatus,
  reason_he: string,
): RuleOutcome {
  return {
    code: rule.code,
    category: rule.category,
    severity: rule.severity,
    title_he: rule.title_he,
    status,
    weight: rule.weight,
    weight_applied: status === "triggered" ? rule.weight : 0,
    explain_he: rule.explain_he,
    fix_kind: rule.fix_kind,
    fix_template: rule.fix_template,
    needs_approval: rule.needs_approval,
    doc_url: rule.doc_url,
    on_unknown: rule.on_unknown,
    reason_he,
    detect: {
      field: rule.detect.field,
      op: rule.detect.op,
      value: rule.detect.value ?? null,
      actual: rule.detect.field in fields ? fields[rule.detect.field] : null,
    },
    evidence: collectEvidence(rule, fields),
  };
}

/** מריץ כלל בודד. warnings נאסף כשקרה משהו שהאופרייטור צריך לדעת עליו. */
export function evaluateRule(
  rule: Rule,
  fields: FieldMap,
  warnings: string[],
): RuleOutcome {
  const field = rule.detect.field;
  const actual = field in fields ? fields[field] : undefined;

  if (!(field in fields)) {
    warnings.push(
      `הכלל ${rule.code} מסתמך על השדה «${field}» שלא הופיע בקלט. הכלל טופל כלא-ידוע.`,
    );
  }

  let result: boolean | null;
  if (isUnknown(actual)) {
    result = null;
  } else {
    result = applyOp(rule.detect.op, actual, rule.detect.value);
    if (result === null) {
      warnings.push(
        `הכלל ${rule.code}: השדה «${field}» קיבל ערך מטיפוס שאינו מתאים לאופרטור ${rule.detect.op} (${fmtValue(actual)}). הכלל טופל כלא-ידוע ולא כהפרה.`,
      );
    }
  }

  // --- ידוע ומוכרע ---
  if (result === true) {
    return outcome(
      rule,
      fields,
      "triggered",
      `הכלל נדלק — «${field}» = ${fmtValue(actual)}.`,
    );
  }
  if (result === false) {
    return outcome(
      rule,
      fields,
      "ok",
      `נבדק ולא נדלק — «${field}» = ${fmtValue(actual)}.`,
    );
  }

  // --- לא ידוע → on_unknown של הכלל, כפי שכתוב בקטלוג ---
  switch (rule.on_unknown) {
    case "skip":
      return outcome(
        rule,
        fields,
        "skipped",
        `הכלל דולג — «${field}» לא ידוע, וההגדרה בקטלוג היא on_unknown=skip. אין השפעה על הציון ואין השפעה על הפסיקה.`,
      );
    case "violation":
      return outcome(
        rule,
        fields,
        "triggered",
        `«${field}» לא ידוע, וההגדרה בקטלוג היא on_unknown=violation — חוסר המידע נחשב הפרה מלאה.`,
      );
    case "needs_review":
    default:
      return outcome(
        rule,
        fields,
        "needs_review",
        `לא ניתן להכריע — «${field}» לא ידוע. הכלל אינו הפרה, אינו מוריד ניקוד, ומוריד את הפסיקה ל"דורש בדיקה" עד שאדם ימלא את השדה.`,
      );
  }
}

// ============================================================================
// 6. ציון ופסיקה
// ============================================================================
// 🔴 שני מספרים בלבד מקודדים כאן, והם תרגום ישיר של _meta.scoring.verdicts:
//    "כנראה זכאית" — אין blocker שנדלק, אין needs_review, score ≥ 85
//    "דורש בדיקה"  — אין blocker, אבל יש needs_review, או score 60–84
//    "כנראה לא זכאית" — נדלק blocker, או score < 60

export const VERDICT_ELIGIBLE_MIN = 85;
export const VERDICT_INELIGIBLE_BELOW = 60;

export const VERDICT_HE = {
  eligible: "כנראה זכאית",
  review: "דורש בדיקה",
  ineligible: "כנראה לא זכאית",
} as const;

/** קודי הפסיקה שהמיגרציה 0100 מתירה בעמודת verdict (CHECK constraint). */
export const VERDICT_CODE = {
  [VERDICT_HE.eligible]: "likely_eligible",
  [VERDICT_HE.review]: "needs_review",
  [VERDICT_HE.ineligible]: "likely_ineligible",
} as const;

export type VerdictHe = (typeof VERDICT_HE)[keyof typeof VERDICT_HE];
export type VerdictCode = "likely_eligible" | "needs_review" | "likely_ineligible";

export interface EligibilityResult {
  score: number;
  verdict: VerdictHe;
  verdict_code: VerdictCode;
  verdict_reason_he: string;
  triggered: RuleOutcome[];
  needs_review: RuleOutcome[];
  skipped: RuleOutcome[];
  passed: RuleOutcome[];
  triggered_codes: string[];
  needs_review_codes: string[];
  skipped_codes: string[];
  passed_codes: string[];
  /** חסמים שנדלקו — severity=blocker. מנומק בעברית, לעמודת blockers. */
  blockers: Array<{
    code: string;
    severity: Severity;
    title_he: string;
    explain_he: string;
    fix_kind: string;
    fix_template: string;
    needs_approval: boolean;
    reason_he: string;
    evidence: Record<string, unknown>;
  }>;
  /** השדות שחסרונם הוריד את הפסיקה — זו הסיבה שמוצגת לאופרייטור. */
  missing_fields: Array<{ field: string; codes: string[]; source: string; desc_he: string }>;
  triggered_weight_sum: number;
  /** rule_code → תוצאה. זה מה שנכתב לעמודת rules. */
  rules: Record<string, RuleOutcome>;
  fields: FieldMap;
  warnings: string[];
  rules_version: string;
  engine_version: string;
  evaluated_at: string;
  disclaimer_he: string;
}

function fieldSpec(field: string): FieldSpec | null {
  const spec = CATALOG._fields[field];
  return spec && typeof spec === "object" ? (spec as FieldSpec) : null;
}

/**
 * מריץ את כל 15 הכללים מעל מפת שדות ומחזיר ציון · פסיקה · ממצאים.
 * הפונקציה טהורה: אותו קלט → אותו פלט (חוץ מ-evaluated_at).
 */
export function evaluateEligibility(
  input: FieldMap,
  opts: { warnings?: string[] } = {},
): EligibilityResult {
  const warnings: string[] = [...(opts.warnings ?? [])];

  // מפת השדות המלאה: כל 19 המפתחות, ברירת מחדל null.
  const fields: FieldMap = {};
  for (const key of CONTRACT_FIELDS) {
    fields[key] = key in input ? input[key] : null;
  }
  for (const key of Object.keys(input)) {
    if (!CONTRACT_FIELDS.includes(key)) {
      warnings.push(`השדה «${key}» אינו חלק מחוזה _fields — התעלמנו ממנו.`);
    }
  }

  const rules: Record<string, RuleOutcome> = {};
  const triggered: RuleOutcome[] = [];
  const needsReview: RuleOutcome[] = [];
  const skipped: RuleOutcome[] = [];
  const passed: RuleOutcome[] = [];

  for (const rule of RULES) {
    const res = evaluateRule(rule, fields, warnings);
    rules[rule.code] = res;
    if (res.status === "triggered") triggered.push(res);
    else if (res.status === "needs_review") needsReview.push(res);
    else if (res.status === "skipped") skipped.push(res);
    else passed.push(res);
  }

  // ---- ציון: 100 פחות סכום המשקלים של כל מי שנדלק (formula_he בקטלוג) ----
  const triggeredWeightSum = triggered.reduce((s, r) => s + r.weight, 0);
  const score = Math.max(0, Math.min(100, 100 - triggeredWeightSum));

  // ---- פסיקה ----
  const blockersTriggered = triggered.filter((r) => r.severity === "blocker");
  const hasBlocker = blockersTriggered.length > 0;
  const hasUnknown = needsReview.length > 0;

  let verdict: VerdictHe;
  const reasons: string[] = [];

  if (hasBlocker) {
    verdict = VERDICT_HE.ineligible;
    reasons.push(
      `נדלקו חסמים: ${blockersTriggered.map((r) => r.code).join(", ")}. חסם אחד מספיק כדי לפסול — גם אם הציון גבוה.`,
    );
  } else if (score < VERDICT_INELIGIBLE_BELOW) {
    verdict = VERDICT_HE.ineligible;
    reasons.push(`הציון ${score} נמוך מ-${VERDICT_INELIGIBLE_BELOW}.`);
  } else if (hasUnknown) {
    verdict = VERDICT_HE.review;
    reasons.push(
      `לא נדלק אף חסם, אבל ${needsReview.length} כללים לא ניתנים להכרעה בגלל מידע חסר (${needsReview.map((r) => r.code).join(", ")}). חוסר מידע אינו הפרה — הוא דורש שאדם ישלים את הנתון לפני שנקבעת זכאות.`,
    );
  } else if (score < VERDICT_ELIGIBLE_MIN) {
    verdict = VERDICT_HE.review;
    reasons.push(
      `אין חסמים ואין מידע חסר, אבל הציון ${score} בטווח ${VERDICT_INELIGIBLE_BELOW}–${VERDICT_ELIGIBLE_MIN - 1}.`,
    );
  } else {
    verdict = VERDICT_HE.eligible;
    reasons.push(
      `לא נדלק אף חסם, אין שדה חסר, והציון ${score} עומד בסף ${VERDICT_ELIGIBLE_MIN}.`,
    );
  }

  if (triggered.length > 0 && !hasBlocker) {
    reasons.push(
      `נדלקו ${triggered.length} ממצאים שאינם חסמים (${triggered.map((r) => r.code).join(", ")}).`,
    );
  }

  // ---- אילו שדות חסרים, ומי תלוי בהם ----
  const byField = new Map<string, string[]>();
  for (const r of needsReview) {
    const arr = byField.get(r.detect.field) ?? [];
    arr.push(r.code);
    byField.set(r.detect.field, arr);
  }
  const missing_fields = [...byField.entries()].map(([field, codes]) => {
    const spec = fieldSpec(field);
    return {
      field,
      codes,
      source: spec?.source ?? "unknown",
      desc_he: spec?.desc_he ?? "",
    };
  });

  return {
    score,
    verdict,
    verdict_code: VERDICT_CODE[verdict],
    verdict_reason_he: reasons.join(" "),
    triggered,
    needs_review: needsReview,
    skipped,
    passed,
    triggered_codes: triggered.map((r) => r.code),
    needs_review_codes: needsReview.map((r) => r.code),
    skipped_codes: skipped.map((r) => r.code),
    passed_codes: passed.map((r) => r.code),
    blockers: blockersTriggered.map((r) => ({
      code: r.code,
      severity: r.severity,
      title_he: r.title_he,
      explain_he: r.explain_he,
      fix_kind: r.fix_kind,
      fix_template: r.fix_template,
      needs_approval: r.needs_approval,
      reason_he: r.reason_he,
      evidence: r.evidence,
    })),
    missing_fields,
    triggered_weight_sum: triggeredWeightSum,
    rules,
    fields,
    warnings,
    rules_version: RULES_VERSION,
    engine_version: ENGINE_VERSION,
    evaluated_at: new Date().toISOString(),
    disclaimer_he: DISCLAIMER_HE,
  };
}

// ============================================================================
// 7. חילוץ שדות מפלט הסורק
// ============================================================================
// 🔴 granta-scan-website מחזיר את השדות באובייקט **מקונן**: result.fields.
//    המטא (sitemap_source · scanned_at · warnings · evidence · meta) יושב
//    מחוצה לו. מפה שטוחה מתקבלת גם היא, כדי שאפשר יהיה להזין את המנוע
//    ידנית וכדי ש-_testcases (שהם מפה שטוחה) ירוצו בלי תרגום.

export interface ExtractedScan {
  fields: FieldMap;
  shape: "nested" | "flat" | "empty";
  scan_warnings: string[];
}

export function extractScanFields(scan: unknown): ExtractedScan {
  if (!scan || typeof scan !== "object" || Array.isArray(scan)) {
    return { fields: {}, shape: "empty", scan_warnings: [] };
  }
  const obj = scan as Record<string, unknown>;
  const scanWarnings = Array.isArray(obj.warnings)
    ? (obj.warnings as unknown[]).map((w) => String(w))
    : [];

  const nested = obj.fields;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return {
      fields: { ...(nested as FieldMap) },
      shape: "nested",
      scan_warnings: scanWarnings,
    };
  }

  // מפה שטוחה — לוקחים רק מפתחות שהם חלק מהחוזה.
  const flat: FieldMap = {};
  for (const key of CONTRACT_FIELDS) {
    if (key in obj) flat[key] = obj[key];
  }
  return { fields: flat, shape: "flat", scan_warnings: scanWarnings };
}

/**
 * מרכיב את מפת השדות הסופית: סריקה, ומעליה שדות שנמסרו ידנית.
 * חמשת השדות שהסורק לעולם לא קובע (entity_type · org_registration_number ·
 * nihul_takin_status · nihul_takin_expiry · domain_owned_by_org) מגיעים
 * מהצהרת העמותה ב-/check ומאימות האופרייטור, ומוזרקים דרך `declared`.
 */
export function mergeFields(
  scanFields: FieldMap,
  declared: FieldMap | null | undefined,
  warnings: string[],
): { fields: FieldMap; sources: Record<string, "scan" | "declared" | "none"> } {
  const fields: FieldMap = {};
  const sources: Record<string, "scan" | "declared" | "none"> = {};

  for (const key of CONTRACT_FIELDS) {
    fields[key] = null;
    sources[key] = "none";
  }

  for (const key of Object.keys(scanFields)) {
    if (!CONTRACT_FIELDS.includes(key)) {
      warnings.push(`הסורק החזיר שדה «${key}» שאינו בחוזה _fields — התעלמנו ממנו.`);
      continue;
    }
    fields[key] = scanFields[key];
    if (!isUnknown(scanFields[key])) sources[key] = "scan";
  }

  if (declared && typeof declared === "object") {
    for (const key of Object.keys(declared)) {
      if (!CONTRACT_FIELDS.includes(key)) {
        warnings.push(`השדה שנמסר ידנית «${key}» אינו בחוזה _fields — התעלמנו ממנו.`);
        continue;
      }
      const v = (declared as FieldMap)[key];
      if (v === undefined) continue;
      fields[key] = v;
      sources[key] = isUnknown(v) ? sources[key] : "declared";
    }
  }

  return { fields, sources };
}
