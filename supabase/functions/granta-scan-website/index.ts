// ============================================================================
// גְּרַנְטָה · Supabase Edge Function — granta-scan-website
// ============================================================================
// סורק אתר של עמותה ומחזיר בדיוק את שדות ה-`_fields` מתוך
// granta/_data/rules-elig.json, כדי שמנוע הכללים (M3) יוכל להריץ עליהם
// את קטלוג ה-ELIG בלי שכבת תרגום באמצע.
//
// ספק: granta/SPEC.md §2 · M1 (משפך זכאות)
// חוזה: granta/_data/rules-elig.json → `_fields`  (🔴 מקור אמת יחיד לשמות)
// טבלה: supabase/migrations/0100_granta_core.sql → granta_eligibility_checks
//
// ----------------------------------------------------------------------------
// 🔴 הכלל שמעל כל הכללים: null ≠ false
// ----------------------------------------------------------------------------
//   false = "בדקתי בפועל, ואין."
//   null  = "לא הצלחתי לבדוק."
// הקטלוג מפעיל `on_unknown: needs_review` על null ומוריד את הפסיקה
// ל"דורש בדיקה". אם נחזיר false על כשל רשת / timeout / חסימת בוטים —
// עמותה זכאית תיפסל בטעות. לכן כל מסלול כשל בקובץ הזה מחזיר null.
// (ראו TODO-SCANNER-CONTRACT בקטלוג הכללים.)
//
// ----------------------------------------------------------------------------
// שדות שהסורק *לא* קובע — תמיד null, נמלאים ידנית על ידי האופרייטור
// ----------------------------------------------------------------------------
//   entity_type · org_registration_number · nihul_takin_status ·
//   nihul_takin_expiry · domain_owned_by_org
// אין דרך אמינה לגזור אותם מסריקת HTTP. הם מגיעים מהצהרת העמותה ב-/check
// ומאימות מול רשם העמותות, ומוזרקים למנוע הכללים על ידי הצד הקורא.
//
// ----------------------------------------------------------------------------
// פריסה
// ----------------------------------------------------------------------------
//   supabase functions deploy granta-scan-website
// משתני סביבה (מוזרקים אוטומטית על ידי Supabase):
//   SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
// הכתיבה ל-granta_eligibility_checks נעשית ב-service_role בכוונה —
// המיגרציה קובעת ש-anon/authenticated לא כותבים לטבלה הזו (§4.4).
// ============================================================================

const SCANNER_VERSION = "granta-scan-website/1.0.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---- תקציבי זמן ----
const TOTAL_BUDGET_MS = 15_000; // timeout קשיח לסריקה כולה
const PER_REQUEST_MS = 8_000;   // תקרה לבקשה בודדת
const MAX_REDIRECTS = 5;        // עוקבים ידנית, עם ולידציה בכל קפיצה
const MAX_HTML_BYTES = 1_500_000;
const MAX_CHILD_SITEMAPS = 10;  // sitemap index → כמה בנים לפתוח
const MAX_EXTRA_PAGES = 4;      // עמודים נוספים לסריקת דגלים אדומים

const USER_AGENT =
  "Mozilla/5.0 (compatible; GrantaScanner/1.0; +https://impactos.co.il) eligibility-scan";

// ---- שמות השדות בחוזה · חייבים להיות זהים ל-_fields בקטלוג הכללים ----
const CONTRACT_FIELDS = [
  "entity_type",
  "org_registration_number",
  "nihul_takin_status",
  "nihul_takin_expiry",
  "site_url",
  "site_domain",
  "domain_owned_by_org",
  "site_reachable",
  "ssl_valid",
  "ssl_expires_in_days",
  "https_redirect",
  "sitemap_pages",
  "has_about_page",
  "has_contact_page",
  "has_privacy_policy",
  "third_party_ads",
  "affiliate_links",
  "ecommerce_store",
  "redirects_to_third_party",
] as const;

export type ContractField = (typeof CONTRACT_FIELDS)[number];

/** חוזה הפלט — בדיוק מפתחות `_fields` של rules-elig.json, בלי תוספת ובלי חוסר. */
export interface ScanFields {
  entity_type: string | null;
  org_registration_number: string | null;
  nihul_takin_status: string | null;
  nihul_takin_expiry: string | null;
  site_url: string;
  site_domain: string | null;
  domain_owned_by_org: boolean | null;
  site_reachable: boolean | null;
  ssl_valid: boolean | null;
  ssl_expires_in_days: number | null;
  https_redirect: boolean | null;
  sitemap_pages: number | null;
  has_about_page: boolean | null;
  has_contact_page: boolean | null;
  has_privacy_policy: boolean | null;
  third_party_ads: boolean | null;
  affiliate_links: boolean | null;
  ecommerce_store: boolean | null;
  redirects_to_third_party: boolean | null;
}

export type SitemapSource =
  | "sitemap_xml"
  | "sitemap_index"
  | "robots_sitemap"
  | "home_crawl"
  | null;

export interface ScanResult {
  ok: boolean;
  /** 🔴 בדיוק החוזה. כל שדה נוסף יושב מחוץ לאובייקט הזה. */
  fields: ScanFields;
  sitemap_source: SitemapSource;
  scanned_at: string;
  scanner_version: string;
  evidence: Record<string, unknown>;
  warnings: string[];
  meta: Record<string, unknown>;
}

// ============================================================================
// 1. עזרי דומיין + הגנת SSRF
// ============================================================================

/**
 * סיומות ציבוריות דו-רכיביות שרלוונטיות לנו.
 * זו רשימה מכוונת-מטרה ולא Public Suffix List מלאה — ראו "מגבלות" ב-README.
 */
const MULTI_LABEL_SUFFIXES = new Set([
  "co.il", "org.il", "net.il", "ac.il", "gov.il", "muni.il", "k12.il", "idf.il",
  "co.uk", "org.uk", "ac.uk", "gov.uk", "me.uk", "net.uk",
  "com.au", "net.au", "org.au", "edu.au",
  "co.nz", "org.nz", "com.br", "com.mx", "com.ar", "co.za",
  "co.jp", "ne.jp", "or.jp", "com.tr", "org.tr", "edu.tr", "gov.tr",
  "com.sg", "com.hk", "co.in", "com.ua", "com.pl", "com.cn",
]);

/** מחזיר את הדומיין הרשום (eTLD+1) — hopa.org.il ולא www.hopa.org.il. */
export function registrableDomain(hostname: string): string {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!host) return "";
  // כתובת IP — מחזירים כמות שהיא
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) return host;
  const labels = host.split(".");
  if (labels.length <= 2) return host;
  const lastTwo = labels.slice(-2).join(".");
  if (MULTI_LABEL_SUFFIXES.has(lastTwo)) return labels.slice(-3).join(".");
  return lastTwo;
}

/**
 * חוסם יעדים פנימיים — localhost, טווחי RFC1918, ו-169.254.169.254 (metadata).
 * 🔴 הפונקציה מקבלת URL מהעולם החיצון, ולכן חייבת הגנת SSRF.
 *    הבדיקה חוזרת על עצמה בכל קפיצת הפניה, לא רק בכתובת המקורית.
 */
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  if (!h) return true;
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local")) return true;
  if (h.endsWith(".internal") || h.endsWith(".home.arpa")) return true;
  if (h === "[::1]" || h === "::1") return true;
  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true; // link-local + cloud metadata
    if (a >= 224) return true;
  }
  if (h.startsWith("[") || /^[0-9a-f:]+$/i.test(h)) {
    // IPv6 מקוצר — חוסמים unique-local ו-link-local
    if (/^\[?(fc|fd|fe8|fe9|fea|feb)/i.test(h)) return true;
  }
  return false;
}

/** נרמול קלט: משלים סכימה, מוריד fragment, מוודא http(s). */
export function normalizeInputUrl(raw: string): URL {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) throw new Error("empty_url");
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const u = new URL(withScheme);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("unsupported_scheme");
  u.hash = "";
  return u;
}

// ============================================================================
// 2. שכבת רשת — deadline גלובלי + מעקב הפניות ידני
// ============================================================================

interface FetchOutcome {
  ok: boolean;
  status: number | null;
  finalUrl: string | null;
  body: string | null;
  /** קפיצת ההפניה הראשונה, אם הייתה — משמש לזיהוי https_redirect */
  firstRedirectLocation: string | null;
  error: string | null;
  /** true אם הכשל נראה כמו כשל TLS ולא כמו כשל רשת כללי */
  tlsError: boolean;
}

const TLS_HINTS = [
  "certificate", "cert", "tls", "ssl", "handshake",
  "unknownissuer", "certexpired", "notvalidfor", "invalidpeer",
];

function looksLikeTlsError(message: string): boolean {
  const m = message.toLowerCase();
  return TLS_HINTS.some((h) => m.includes(h));
}

class Deadline {
  private readonly endsAt: number;
  constructor(budgetMs: number) {
    this.endsAt = Date.now() + budgetMs;
  }
  remaining(): number {
    return Math.max(0, this.endsAt - Date.now());
  }
  expired(): boolean {
    return this.remaining() <= 50;
  }
  slice(maxMs: number): number {
    return Math.min(maxMs, this.remaining());
  }
}

/**
 * fetch עם deadline, בלי redirect אוטומטי.
 * עוקבים ידנית כדי (א) לזהות https_redirect, (ב) לקבל את הדומיין הסופי,
 * (ג) לחסום הפניה ליעד פנימי — הפניה היא וקטור SSRF קלאסי.
 */
async function fetchFollow(
  startUrl: URL,
  deadline: Deadline,
  opts: { readBody?: boolean; accept?: string } = {},
): Promise<FetchOutcome> {
  const readBody = opts.readBody !== false;
  let current = new URL(startUrl.toString());
  let firstRedirectLocation: string | null = null;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (isBlockedHost(current.hostname)) {
      return {
        ok: false, status: null, finalUrl: current.toString(), body: null,
        firstRedirectLocation, error: "blocked_host", tlsError: false,
      };
    }
    if (deadline.expired()) {
      return {
        ok: false, status: null, finalUrl: current.toString(), body: null,
        firstRedirectLocation, error: "timeout", tlsError: false,
      };
    }

    let res: Response;
    try {
      res = await fetch(current.toString(), {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(deadline.slice(PER_REQUEST_MS)),
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": opts.accept ?? "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "he,en;q=0.8",
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      return {
        ok: false, status: null, finalUrl: current.toString(), body: null,
        firstRedirectLocation, error: msg, tlsError: looksLikeTlsError(msg),
      };
    }

    // הפניה
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      try { await res.body?.cancel(); } catch { /* ignore */ }
      if (!loc) {
        return {
          ok: false, status: res.status, finalUrl: current.toString(), body: null,
          firstRedirectLocation, error: "redirect_without_location", tlsError: false,
        };
      }
      if (hop === 0) firstRedirectLocation = new URL(loc, current).toString();
      let next: URL;
      try {
        next = new URL(loc, current);
      } catch {
        return {
          ok: false, status: res.status, finalUrl: current.toString(), body: null,
          firstRedirectLocation, error: "bad_redirect_location", tlsError: false,
        };
      }
      if (next.protocol !== "http:" && next.protocol !== "https:") {
        return {
          ok: false, status: res.status, finalUrl: next.toString(), body: null,
          firstRedirectLocation, error: "unsupported_redirect_scheme", tlsError: false,
        };
      }
      next.hash = "";
      current = next;
      continue;
    }

    let body: string | null = null;
    if (readBody && res.body) {
      try {
        body = await readCapped(res, MAX_HTML_BYTES);
      } catch (e) {
        body = null;
        void e;
      }
    } else {
      try { await res.body?.cancel(); } catch { /* ignore */ }
    }

    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      finalUrl: res.url || current.toString(),
      body,
      firstRedirectLocation,
      error: null,
      tlsError: false,
    };
  }

  return {
    ok: false, status: null, finalUrl: current.toString(), body: null,
    firstRedirectLocation, error: "too_many_redirects", tlsError: false,
  };
}

/** קורא גוף תשובה עם תקרת בייטים — אתר ענק לא יפיל את הפונקציה. */
async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body!.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.byteLength;
      if (total >= maxBytes) {
        try { await reader.cancel(); } catch { /* ignore */ }
        break;
      }
    }
  }
  const merged = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    merged.set(c.subarray(0, Math.min(c.byteLength, total - off)), off);
    off += c.byteLength;
    if (off >= total) break;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

// ============================================================================
// 3. חילוץ מתוך HTML
// ============================================================================

interface LinkCandidate {
  url: string;   // מוחלט אם ניתן היה לפתור
  text: string;  // טקסט העוגן, אם קיים
}

/** כל ה-<a href> בעמוד, עם טקסט העוגן. */
function extractAnchors(html: string, base: URL): LinkCandidate[] {
  const out: LinkCandidate[] = [];
  const re = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const href = (m[1] ?? m[2] ?? m[3] ?? "").trim();
    if (!href) continue;
    const text = stripTags(m[4] ?? "");
    out.push({ url: absolutize(href, base), text });
  }
  return out;
}

/**
 * כתובות מתוך בלוקי JSON-LD.
 * 🔴 חיוני לאתרי SPA: ב-hopa.org.il ה-HTML של הבית לא מכיל אף <a>,
 *    והניווט מתואר רק ב-SiteNavigationElement.
 */
function extractJsonLdUrls(html: string, base: URL): LinkCandidate[] {
  const out: LinkCandidate[] = [];
  const blocks = html.matchAll(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const b of blocks) {
    const raw = b[1] ?? "";
    for (const m of raw.matchAll(/"url"\s*:\s*"([^"]+)"/g)) {
      out.push({ url: absolutize(m[1], base), text: "" });
    }
  }
  return out;
}

function absolutize(href: string, base: URL): string {
  try {
    // ה-fragment נשמר בכוונה: קישור "#about" בעמוד-יחיד הוא ראיה שימושית
    // לאופרייטור. ספירת העמודים משתמשת ב-pathname בלבד, ולכן אינה מושפעת.
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** נרמול טקסט לצורך התאמת מילות-מפתח: מפענח %XX, מחליף מפרידים ברווח. */
function normalizeForMatch(s: string): string {
  let decoded = s;
  try { decoded = decodeURIComponent(s); } catch { /* קלט לא תקין — משאירים */ }
  return decoded
    .toLowerCase()
    .replace(/[_+\-–—/\\.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================================
// 4. מילוני זיהוי
// ============================================================================

// -- עמודי חובה: עברית + אנגלית --
const ABOUT_RE = /(?:^|\s)(?:about(?:\s?us)?|who\s?we\s?are|our\s?story|odot)(?:\s|$)|אודות|מי\s?אנחנו|עלינו|על\s?העמותה|על\s?הארגון/;
const CONTACT_RE = /(?:^|\s)(?:contact(?:\s?us)?|get\s?in\s?touch|reach\s?us)(?:\s|$)|צור\s?קשר|צרו\s?קשר|יצירת\s?קשר|צור\s?אתנו\s?קשר|דברו\s?איתנו/;
const PRIVACY_RE = /(?:^|\s)privacy(?:\s?policy)?(?:\s|$)|מדיניות\s?פרטיות|הצהרת\s?פרטיות|פרטיות/;

/**
 * מודעות צד-ג'.
 * 🔴 הרשימה צרה בכוונה. googletagmanager / gtag / googleadservices / GA4 /
 *    doubleclick הם תגי מדידה ורימרקטינג *של העמותה עצמה* ואינם מודעות
 *    צד-שלישי באתר. לסמן אותם = לפסול כל עמותה שמודדת המרות, כולל הופה
 *    (שיש בה AW-… על הבית). ראו "מגבלות" ב-README.
 */
export const AD_PATTERNS: Array<[string, RegExp]> = [
  ["google_adsense", /pagead2\.googlesyndication\.com|adsbygoogle|tpc\.googlesyndication\.com|class\s*=\s*["'][^"']*adsbygoogle/i],
  ["taboola", /\btaboola\b|cdn\.taboola\.com|_taboola/i],
  ["outbrain", /\boutbrain\b|widgets\.outbrain\.com/i],
  ["appnexus", /\badnxs\.com\b/i],
  ["criteo", /\bcriteo\.(?:com|net)\b|static\.criteo\.net/i],
  ["media_net", /contextual\.media\.net|\bmedia\.net\/rtb\b/i],
  ["amazon_ads", /amazon-adsystem\.com/i],
  ["revcontent", /\brevcontent\.com\b/i],
  ["mgid", /\bmgid\.com\b|jsc\.mgid\.com/i],
  ["ezoic", /\bezoic\.(?:net|com)\b|ezojs\.com/i],
  ["propellerads", /propellerads\.com|propu\.sh/i],
  ["adform", /\badform\.net\b/i],
  ["pubmatic", /\bpubmatic\.com\b/i],
  ["openx", /\bopenx\.net\b/i],
  ["rubicon", /rubiconproject\.com/i],
  ["sekindo_adnetwork", /\bsekindo\.com\b|\byieldmo\.com\b/i],
];

/** פרמטרי עמלה בקישורים יוצאים. נבדקים *רק* על קישור לדומיין אחר. */
const AFFILIATE_PARAM_RE =
  /[?&](?:tag|aff|affid|aff_id|affiliate|affiliate_id|ref|refid|ref_id|referral|partner|clickid|irclickid|subid|sub_id|awc|siteid|site_id)=/i;
const AFFILIATE_UTM_RE = /[?&]utm_source=(?:affiliate|affiliates|partner|partners)\b/i;
const AFFILIATE_NETWORK_RE =
  /\b(?:amzn\.to|shareasale\.com|awin1\.com|go\.skimresources\.com|clickbank\.net|hop\.clickbank|tradedoubler\.com|anrdoezrs\.net|dpbolvw\.net|kqzyfj\.com|jdoqocy\.com|linksynergy\.com|impact\.com\/campaign|partnerize|admitad\.com|webgains\.com)\b/i;

/** חנות מסחרית. */
export const ECOMMERCE_PATTERNS: Array<[string, RegExp]> = [
  ["woocommerce", /woocommerce|wc-ajax|wp-content\/plugins\/woocommerce/i],
  ["shopify", /cdn\.shopify\.com|myshopify\.com|Shopify\.theme/i],
  ["add_to_cart", /add[-_]?to[-_]?cart|addtocart/i],
  ["cart_page", /(?:href|action)\s*=\s*["'][^"']*\/cart(?:[/"'?]|$)/i],
  ["checkout_page", /(?:href|action)\s*=\s*["'][^"']*\/checkout(?:[/"'?]|$)/i],
  ["snipcart", /\bsnipcart\b/i],
  ["ecwid", /\becwid\b|app\.ecwid\.com/i],
  ["bigcommerce", /bigcommerce\.com/i],
  ["magento", /\bMagento\b|mage\/cookies/i],
  ["opencart", /index\.php\?route=(?:product|checkout)/i],
  ["prestashop", /\bprestashop\b/i],
  ["easy_digital_downloads", /easy-digital-downloads|edd-cart/i],
];

// ============================================================================
// 5. sitemap
// ============================================================================

function extractLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) =>
    m[1].replace(/&amp;/g, "&").trim()
  );
}

function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex[\s>]/i.test(xml);
}

/** נרמול לספירה ייחודית: אותו דומיין, בלי query/hash, בלי / בסוף. */
function canonicalPageKey(rawUrl: string, siteRegDomain: string): string | null {
  let u: URL;
  try { u = new URL(rawUrl); } catch { return null; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (registrableDomain(u.hostname) !== siteRegDomain) return null;
  let path = u.pathname.replace(/\/+$/, "");
  if (path === "") path = "/";
  return path.toLowerCase();
}

// ============================================================================
// 6. הסורק
// ============================================================================

export async function scanWebsite(inputUrl: string): Promise<ScanResult> {
  const startedAt = Date.now();
  const deadline = new Deadline(TOTAL_BUDGET_MS);
  const warnings: string[] = [];
  const evidence: Record<string, unknown> = {};
  const meta: Record<string, unknown> = {};

  // ---- 🔴 כל שדה מתחיל ב-null. false נכתב רק אחרי בדיקה שהצליחה. ----
  const fields: ScanFields = {
    entity_type: null,
    org_registration_number: null,
    nihul_takin_status: null,
    nihul_takin_expiry: null,
    site_url: String(inputUrl ?? "").trim(),
    site_domain: null,
    domain_owned_by_org: null,
    site_reachable: null,
    ssl_valid: null,
    ssl_expires_in_days: null,
    https_redirect: null,
    sitemap_pages: null,
    has_about_page: null,
    has_contact_page: null,
    has_privacy_policy: null,
    third_party_ads: null,
    affiliate_links: null,
    ecommerce_store: null,
    redirects_to_third_party: null,
  };
  let sitemapSource: SitemapSource = null;

  // ---- 6.1 נרמול קלט ----
  let input: URL;
  try {
    input = normalizeInputUrl(inputUrl);
  } catch (e) {
    warnings.push(`כתובת לא תקינה: ${e instanceof Error ? e.message : String(e)}`);
    return finish(false);
  }
  if (isBlockedHost(input.hostname)) {
    warnings.push("היעד חסום (כתובת פנימית / לולאה מקומית) — לא בוצעה סריקה.");
    return finish(false);
  }

  const inputRegDomain = registrableDomain(input.hostname);
  fields.site_url = input.toString();

  // ---- 6.2 הבית ב-HTTPS ----
  // ssl_valid נגזר מהצלחת ה-handshake. Deno לא חושף את תעודת העמית
  // (conn.handshake() מחזיר { alpnProtocol } בלבד), ולכן אין דרך אמינה
  // למדוד תוקף → ssl_expires_in_days נשאר null. 🔴 לא ממציאים מספר.
  const httpsUrl = new URL(input.toString());
  httpsUrl.protocol = "https:";
  const httpsRes = await fetchFollow(httpsUrl, deadline);

  // ---- 6.3 הבית ב-HTTP — גם למדידת https_redirect וגם כאבחנת TLS ----
  const httpUrl = new URL(input.toString());
  httpUrl.protocol = "http:";
  const httpProbe = deadline.expired()
    ? null
    : await fetchFollow(httpUrl, deadline, { readBody: !httpsRes.ok });

  // https_redirect: קפיצת ההפניה הראשונה מ-http עוברת ל-https?
  if (httpProbe && httpProbe.error === null) {
    if (httpProbe.firstRedirectLocation) {
      fields.https_redirect = httpProbe.firstRedirectLocation.toLowerCase().startsWith("https://");
      evidence.http_first_redirect = httpProbe.firstRedirectLocation;
    } else {
      // התקבלה תשובה ב-http בלי הפניה כלל
      fields.https_redirect = false;
    }
  } else {
    warnings.push("לא ניתן היה לבדוק הפניה מ-http ל-https (פורט 80 לא ענה) — https_redirect = null.");
  }

  // ssl_valid
  if (httpsRes.error === null) {
    // התקבלה תשובת HTTPS כלשהי → ה-handshake והשרשרת אומתו
    fields.ssl_valid = true;
  } else if (httpsRes.tlsError) {
    fields.ssl_valid = false;
    warnings.push(`שגיאת TLS בפנייה ל-https: ${httpsRes.error}`);
  } else if (httpProbe && httpProbe.error === null) {
    // המארח עונה ב-http אבל לא ב-https → נבדק, ואין HTTPS תקין
    fields.ssl_valid = false;
    warnings.push("השרת עונה ב-http אך לא ב-https — ssl_valid = false.");
  } else {
    // לא הצלחנו לגשת בכלל → לא נקבע
    warnings.push(`לא ניתן היה לבדוק HTTPS: ${httpsRes.error} — ssl_valid = null.`);
  }

  // ---- 6.4 האם האתר עולה ----
  const home = httpsRes.error === null ? httpsRes : (httpProbe ?? httpsRes);
  meta.home_status = home.status;
  meta.home_final_url = home.finalUrl;
  meta.home_error = home.error;

  if (home.error !== null) {
    fields.site_reachable = false;
    warnings.push(`האתר לא ענה בסריקה: ${home.error}. כל יתר השדות נשארים null.`);
    return finish(true);
  }

  // 🔴 401/403/429 = ככל הנראה הגנת בוטים, לא אתר שבור. לא מכריעים.
  if (home.status === 401 || home.status === 403 || home.status === 429) {
    fields.site_reachable = null;
    warnings.push(
      `השרת החזיר ${home.status} — ככל הנראה הגנת בוטים ולא אתר שבור. site_reachable = null (דורש בדיקה ידנית).`,
    );
  } else {
    fields.site_reachable = home.status !== null && home.status >= 200 && home.status < 300;
    if (!fields.site_reachable) {
      warnings.push(`הבית החזיר סטטוס ${home.status}.`);
    }
  }

  // ---- 6.5 דומיין סופי + הפניה לצד שלישי ----
  let finalUrl: URL | null = null;
  try {
    finalUrl = new URL(home.finalUrl ?? httpsUrl.toString());
  } catch { /* נשאר null */ }

  if (finalUrl) {
    fields.site_domain = finalUrl.hostname.toLowerCase().replace(/^www\./, "");
    const finalRegDomain = registrableDomain(finalUrl.hostname);
    fields.redirects_to_third_party = finalRegDomain !== inputRegDomain;
    evidence.input_registrable_domain = inputRegDomain;
    evidence.final_registrable_domain = finalRegDomain;
    if (fields.redirects_to_third_party) {
      warnings.push(`הכתובת ${inputRegDomain} נוחתת בפועל על ${finalRegDomain}.`);
    }
  } else {
    warnings.push("לא ניתן היה לקבוע את הדומיין הסופי — site_domain / redirects_to_third_party = null.");
  }

  const siteRegDomain = finalUrl ? registrableDomain(finalUrl.hostname) : inputRegDomain;
  const homeHtml = home.body;
  const homeBase = finalUrl ?? input;

  // ---- 6.6 sitemap ----
  const pageKeys = new Set<string>();
  const sitemapUrls: string[] = [];

  if (!deadline.expired() && finalUrl) {
    const origin = new URL(finalUrl.origin);

    // (א) /sitemap.xml
    const smUrl = new URL("/sitemap.xml", origin);
    const sm = await fetchFollow(smUrl, deadline, { accept: "application/xml,text/xml,*/*" });
    if (sm.ok && sm.body && /<(?:urlset|sitemapindex)[\s>]/i.test(sm.body)) {
      evidence.sitemap_url = sm.finalUrl;
      if (isSitemapIndex(sm.body)) {
        sitemapSource = "sitemap_index";
        const children = extractLocs(sm.body).slice(0, MAX_CHILD_SITEMAPS);
        evidence.sitemap_children = children.length;
        for (const child of children) {
          if (deadline.expired()) {
            warnings.push("תקציב הזמן נגמר באמצע קריאת sitemap index — הספירה חלקית.");
            break;
          }
          try {
            const c = await fetchFollow(new URL(child), deadline, { accept: "application/xml,text/xml,*/*" });
            if (c.ok && c.body) sitemapUrls.push(...extractLocs(c.body));
          } catch { /* מדלגים על בן פגום */ }
        }
      } else {
        sitemapSource = "sitemap_xml";
        sitemapUrls.push(...extractLocs(sm.body));
      }
    }

    // (ב) robots.txt → Sitemap:
    if (sitemapSource === null && !deadline.expired()) {
      const robots = await fetchFollow(new URL("/robots.txt", origin), deadline, { accept: "text/plain,*/*" });
      if (robots.ok && robots.body) {
        const declared = [...robots.body.matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)].map((m) => m[1]);
        evidence.robots_sitemaps = declared;
        for (const d of declared.slice(0, 5)) {
          if (deadline.expired()) break;
          try {
            const s = await fetchFollow(new URL(d, origin), deadline, { accept: "application/xml,text/xml,*/*" });
            if (!s.ok || !s.body) continue;
            if (isSitemapIndex(s.body)) {
              for (const child of extractLocs(s.body).slice(0, MAX_CHILD_SITEMAPS)) {
                if (deadline.expired()) break;
                const c = await fetchFollow(new URL(child, origin), deadline, { accept: "application/xml,text/xml,*/*" });
                if (c.ok && c.body) sitemapUrls.push(...extractLocs(c.body));
              }
            } else {
              sitemapUrls.push(...extractLocs(s.body));
            }
            sitemapSource = "robots_sitemap";
          } catch { /* מדלגים */ }
        }
      }
    }
  }

  for (const u of sitemapUrls) {
    const key = canonicalPageKey(u, siteRegDomain);
    if (key) pageKeys.add(key);
  }

  // ---- 6.7 מאגר הקישורים לזיהוי עמודים ----
  const anchors: LinkCandidate[] = homeHtml ? extractAnchors(homeHtml, homeBase) : [];
  const jsonLdUrls: LinkCandidate[] = homeHtml ? extractJsonLdUrls(homeHtml, homeBase) : [];

  // (ג) fallback: זחילה רדודה מהבית
  if (sitemapSource === null && homeHtml) {
    sitemapSource = "home_crawl";
    pageKeys.add("/");
    for (const a of [...anchors, ...jsonLdUrls]) {
      const key = canonicalPageKey(a.url, siteRegDomain);
      if (key) pageKeys.add(key);
    }
    warnings.push("לא נמצא sitemap — מספר העמודים הוא ספירת קישורים פנימיים ייחודיים מהבית בלבד, והוא הערכת-חסר.");
  }

  fields.sitemap_pages = sitemapSource === null ? null : pageKeys.size;
  if (sitemapSource === null) {
    warnings.push("לא נמצא sitemap ולא היה HTML לזחילה — sitemap_pages = null.");
  }

  // ---- 6.8 עמודי אודות / קשר / פרטיות ----
  // מאגר ההתאמה = קישורי הבית + כתובות JSON-LD + כל כתובות ה-sitemap.
  // 🔴 ה-sitemap הכרחי: באתרי SPA (כמו hopa.org.il) ה-HTML של הבית
  //    לא מכיל אף <a>, וזיהוי לפי ניווט בלבד היה מחזיר false שגוי.
  const haystack: LinkCandidate[] = [
    ...anchors,
    ...jsonLdUrls,
    ...sitemapUrls.map((u) => ({ url: u, text: "" })),
  ];
  const corpusOk = haystack.length > 0;

  if (corpusOk) {
    const about = findPage(haystack, ABOUT_RE, siteRegDomain);
    const contact = findPage(haystack, CONTACT_RE, siteRegDomain);
    const privacy = findPage(haystack, PRIVACY_RE, siteRegDomain);

    fields.has_about_page = about !== null;
    fields.has_privacy_policy = privacy !== null;

    // "צור קשר עם דרך התקשרות בפועל": עמוד ייעודי או mailto/tel גלוי בבית.
    const directContact = homeHtml ? /(?:href\s*=\s*["'](?:mailto:|tel:))/i.test(homeHtml) : false;
    fields.has_contact_page = contact !== null || directContact;

    evidence.about_page = about;
    evidence.contact_page = contact;
    evidence.privacy_page = privacy;
    evidence.direct_contact_on_home = directContact;
  } else {
    warnings.push("לא נאסף אף קישור מהאתר — עמודי אודות/קשר/פרטיות לא נבדקו (null).");
  }

  // ---- 6.9 דגלים אדומים: הבית + עד 4 עמודים נוספים ----
  const scannedPages: Array<{ url: string; bytes: number }> = [];
  const htmlDocs: Array<{ url: string; html: string }> = [];
  if (homeHtml) {
    htmlDocs.push({ url: home.finalUrl ?? fields.site_url, html: homeHtml });
    scannedPages.push({ url: home.finalUrl ?? fields.site_url, bytes: homeHtml.length });
  }

  if (homeHtml && finalUrl && !deadline.expired()) {
    for (const extra of pickExtraPages(pageKeys, finalUrl, MAX_EXTRA_PAGES)) {
      if (deadline.expired()) {
        warnings.push("תקציב הזמן נגמר — נסרקו פחות עמודי-משנה מהמתוכנן.");
        break;
      }
      const r = await fetchFollow(extra, deadline);
      if (r.ok && r.body) {
        htmlDocs.push({ url: r.finalUrl ?? extra.toString(), html: r.body });
        scannedPages.push({ url: r.finalUrl ?? extra.toString(), bytes: r.body.length });
      }
    }
  }
  meta.pages_fetched = scannedPages;

  if (htmlDocs.length > 0) {
    const adHits: Array<{ network: string; page: string }> = [];
    const shopHits: Array<{ signal: string; page: string }> = [];
    const affHits: Array<{ url: string; page: string; reason: string }> = [];

    for (const doc of htmlDocs) {
      for (const [name, re] of AD_PATTERNS) {
        if (re.test(doc.html)) adHits.push({ network: name, page: doc.url });
      }
      for (const [name, re] of ECOMMERCE_PATTERNS) {
        if (re.test(doc.html)) shopHits.push({ signal: name, page: doc.url });
      }
      let docBase: URL;
      try { docBase = new URL(doc.url); } catch { docBase = homeBase; }
      for (const a of extractAnchors(doc.html, docBase)) {
        const reason = affiliateReason(a.url, siteRegDomain);
        if (reason) affHits.push({ url: a.url, page: doc.url, reason });
      }
    }

    fields.third_party_ads = adHits.length > 0;
    fields.ecommerce_store = shopHits.length > 0;
    fields.affiliate_links = affHits.length > 0;

    evidence.ad_matches = adHits;
    evidence.ecommerce_matches = shopHits;
    evidence.affiliate_matches = affHits.slice(0, 20);

    if (htmlDocs.length === 1) {
      warnings.push(
        "הדגלים האדומים (מודעות/אפיליאייט/חנות) נבדקו על עמוד הבית בלבד — לא על כל האתר.",
      );
    }
    if (/<div\s+id\s*=\s*["']root["']\s*>\s*<\/div>/i.test(homeHtml ?? "") ||
        /<div\s+id\s*=\s*["']app["']\s*>\s*<\/div>/i.test(homeHtml ?? "")) {
      warnings.push(
        "האתר נראה כאפליקציית SPA — התוכן נבנה ב-JavaScript. הסורק אינו מריץ JS, ולכן דגלים אדומים שמוזרקים בזמן ריצה לא ייתפסו.",
      );
    }
  } else {
    warnings.push("לא התקבל HTML — third_party_ads / affiliate_links / ecommerce_store = null.");
  }

  return finish(true);

  function finish(ok: boolean): ScanResult {
    meta.duration_ms = Date.now() - startedAt;
    meta.budget_ms = TOTAL_BUDGET_MS;
    meta.input_url = String(inputUrl ?? "").trim();
    // 🔴 שדות שאינם ניתנים לקביעה מסריקה אוטומטית — נשארים null תמיד
    //    וממולאים ידנית על ידי האופרייטור (הצהרת העמותה + רשם העמותות).
    meta.operator_filled_fields = [
      "entity_type",
      "org_registration_number",
      "nihul_takin_status",
      "nihul_takin_expiry",
      "domain_owned_by_org",
    ];
    meta.contract_fields = CONTRACT_FIELDS;
    return {
      ok,
      fields,
      sitemap_source: sitemapSource,
      scanned_at: new Date().toISOString(),
      scanner_version: SCANNER_VERSION,
      evidence,
      warnings,
      meta,
    };
  }
}

/** מאתר עמוד לפי מילון — התאמה על נתיב ה-URL או על טקסט העוגן. */
function findPage(
  candidates: LinkCandidate[],
  re: RegExp,
  siteRegDomain: string,
): string | null {
  for (const c of candidates) {
    let u: URL | null = null;
    try { u = new URL(c.url); } catch { u = null; }
    // התאמה על טקסט העוגן — רק אם הקישור פנימי
    const internal = u ? registrableDomain(u.hostname) === siteRegDomain : false;
    if (u && internal) {
      const path = normalizeForMatch(u.pathname + " " + u.search);
      if (path && re.test(path)) return u.toString();
    }
    if (internal && c.text) {
      if (re.test(normalizeForMatch(c.text))) return u!.toString();
    }
  }
  return null;
}

/** מחזיר את סיבת החשד לאפיליאייט, או null. נבדק רק על קישורים יוצאים. */
export function affiliateReason(rawUrl: string, siteRegDomain: string): string | null {
  let u: URL;
  try { u = new URL(rawUrl); } catch { return null; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (registrableDomain(u.hostname) === siteRegDomain) return null; // קישור פנימי — לא אפיליאייט
  const full = u.toString();
  if (AFFILIATE_NETWORK_RE.test(u.hostname)) return "affiliate_network_domain";
  if (AFFILIATE_UTM_RE.test(full)) return "utm_source_affiliate";
  if (AFFILIATE_PARAM_RE.test(full)) return "commission_param";
  return null;
}

/** בוחר עד N עמודי-משנה מגוונים לסריקת דגלים אדומים (סעיפים שונים באתר). */
function pickExtraPages(pageKeys: Set<string>, origin: URL, limit: number): URL[] {
  const bySection = new Map<string, string>();
  for (const key of pageKeys) {
    if (key === "/") continue;
    const section = key.split("/").filter(Boolean)[0] ?? key;
    if (!bySection.has(section)) bySection.set(section, key);
  }
  const out: URL[] = [];
  for (const path of bySection.values()) {
    if (out.length >= limit) break;
    try { out.push(new URL(path, origin.origin)); } catch { /* מדלגים */ }
  }
  return out;
}

// ============================================================================
// 7. כתיבה ל-granta_eligibility_checks
// ============================================================================
// 🔴 רק העמודות שהמיגרציה 0100 מגדירה בפועל:
//    id · lead_id · org_id · website · scan · rules · blockers · score ·
//    verdict · source · checked_at · created_at
//    כותבים lead_id / website / scan / source. rules · blockers · score ·
//    verdict הם פלט של מנוע הכללים (M3) ולא של הסורק — משאירים לברירת המחדל.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function persistCheck(
  leadId: string,
  result: ScanResult,
): Promise<{ persisted: boolean; error: string | null }> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return { persisted: false, error: "missing_supabase_env" };
  }
  try {
    const res = await fetch(`${url}/rest/v1/granta_eligibility_checks`, {
      method: "POST",
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      signal: AbortSignal.timeout(PER_REQUEST_MS),
      body: JSON.stringify({
        lead_id: leadId,
        website: result.fields.site_url,
        scan: {
          fields: result.fields,
          sitemap_source: result.sitemap_source,
          scanned_at: result.scanned_at,
          scanner_version: result.scanner_version,
          evidence: result.evidence,
          warnings: result.warnings,
          meta: result.meta,
        },
        source: "system",
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      return { persisted: false, error: `rest_${res.status}: ${detail.slice(0, 400)}` };
    }
    return { persisted: true, error: null };
  } catch (e) {
    return { persisted: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ============================================================================
// 8. ה-HTTP shell
// ============================================================================

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let payload: { url?: string; lead_id?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  const url = typeof payload?.url === "string" ? payload.url.trim() : "";
  if (!url) return json({ error: "missing_url" }, 400);
  if (url.length > 2048) return json({ error: "url_too_long" }, 400);

  const leadId = typeof payload?.lead_id === "string" ? payload.lead_id.trim() : "";
  if (leadId && !UUID_RE.test(leadId)) return json({ error: "bad_lead_id" }, 400);

  try {
    const result = await scanWebsite(url);

    if (leadId) {
      const p = await persistCheck(leadId, result);
      result.meta.lead_id = leadId;
      result.meta.persisted = p.persisted;
      if (!p.persisted) {
        result.warnings.push(`הבדיקה לא נשמרה לבסיס הנתונים: ${p.error}`);
      }
    } else {
      result.meta.persisted = false;
    }

    return json(result);
  } catch (e) {
    // 🔴 גם חריגה לא צפויה לא מחזירה false על שום שדה.
    return json({ error: "exception", detail: e instanceof Error ? e.message : String(e) }, 500);
  }
});
