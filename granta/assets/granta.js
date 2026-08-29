/**
 * גְּרַנְטָה · מודול הלקוח המשותף
 * =================================
 * נקודת הגישה היחידה של כל מסך בגרנטה אל Supabase, אל הפורמטים,
 * אל שומרי-ההרשאות ואל מצבי-המסך. אין קוד Supabase מפוזר במסכים.
 *
 * טעינה במסך:
 *   <script src="../assets/granta-config.js"></script>   ← מגדיר window.GRANTA_CONFIG
 *   <script type="module">
 *     import { auth, leads, fmt, ui, nav } from '../assets/granta.js';
 *   </script>
 *
 * המודול גם נחשף כ-window.Granta עבור מסכים שאינם מודולים.
 *
 * 🔴 כלל ברזל: בצד לקוח יש anon key בלבד. service-role key לעולם לא כאן.
 *    כל מה שנוגע בגוגל או בסודות = Edge Function (SPEC §5).
 *
 * מקור: granta/SPEC.md — §1 שחקנים · §4 מודל נתונים · §5 ארכיטקטורה
 * נוצר: 2026-08-29
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

/* ------------------------------------------------------------------ *
 * 0. קבועים
 * ------------------------------------------------------------------ */

/** שמות הטבלאות — בדיוק כפי שמופיעות ב-SPEC §4. אין להמציא טבלאות. */
export const TABLES = Object.freeze({
  orgs:              'granta_orgs',
  users:             'granta_users',
  leads:             'granta_leads',
  eligibilityChecks: 'granta_eligibility_checks',
  accounts:          'granta_accounts',
  snapshots:         'granta_snapshots',
  campaigns:         'granta_campaigns',
  adgroups:          'granta_adgroups',
  ads:               'granta_ads',
  keywords:          'granta_keywords',
  policyRules:       'granta_policy_rules',
  findings:          'granta_findings',
  actions:           'granta_actions',
  alerts:            'granta_alerts',
  reports:           'granta_reports',
  documents:         'granta_documents',
  submissionSteps:   'granta_submission_steps',
  auditLog:          'granta_audit_log',
});

/** תפקידים (SPEC §1). אופרייטור = claim ב-JWT, לא בהכרח שורה בטבלה. */
export const ROLES = Object.freeze({
  ORG_ADMIN:  'org_admin',
  ORG_VIEWER: 'org_viewer',
  OPERATOR:   'operator',
});

const AUTH_STORAGE_KEY = 'granta-supabase-auth';

/* ------------------------------------------------------------------ *
 * 1. אתחול הלקוח
 * ------------------------------------------------------------------ */

/**
 * בודק אם מפתח JWT הוא service-role. בלימת-בטיחות: אם מישהו הדביק
 * בטעות service key ב-config — נכשלים ברעש, לא בשקט.
 * @param {string} key
 * @returns {boolean}
 */
function looksLikeServiceRole(key) {
  const k = String(key || '');

  // מפתחות בפורמט החדש של Supabase אינם JWT ולכן פענוח לא יעזור —
  // הזיהוי הוא לפי הקידומת. sb_secret_ הוא מפתח סודי ואסור בצד לקוח.
  // (sb_publishable_ הוא המקבילה הציבורית ל-anon key — מותר.)
  if (/^sb_secret_/i.test(k)) return true;

  // כל מה שמסומן במפורש כסוד — גם אם אינו בפורמט מוכר.
  if (/service[_-]?role|^supabase_admin/i.test(k)) return true;

  try {
    const payload = JSON.parse(atob(k.split('.')[1]));
    return payload && (payload.role === 'service_role' || payload.role === 'supabase_admin');
  } catch (_) {
    return false; // לא JWT מזוהה — לא חוסמים
  }
}

/** @type {{ok:boolean, reason:string|null, url:string|null}} */
export const configState = { ok: false, reason: null, url: null };

function readConfig() {
  const cfg = (typeof window !== 'undefined' && window.GRANTA_CONFIG) || null;
  if (!cfg) {
    return { error: 'window.GRANTA_CONFIG חסר. יש לטעון את assets/granta-config.js לפני granta.js.' };
  }
  const url = cfg.SUPABASE_URL || cfg.url || null;
  const key = cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_PUBLISHABLE_KEY || cfg.anonKey || null;
  if (!url || !key) {
    return { error: 'GRANTA_CONFIG חסר SUPABASE_URL או SUPABASE_ANON_KEY.' };
  }
  if (looksLikeServiceRole(key)) {
    return { error: '🔴 המפתח ב-GRANTA_CONFIG הוא service-role. אסור בצד לקוח. החליפי ל-anon key.' };
  }
  return { url, key, options: cfg.options || null };
}

/**
 * לקוח Supabase — או null אם ה-config חסר/פסול.
 * מסכים לא ניגשים אליו ישירות; משתמשים בשכבת הגישה שלמטה.
 * @type {import('https://esm.sh/@supabase/supabase-js@2.45.4').SupabaseClient|null}
 */
export let supabase = null;

(function initClient() {
  const parsed = readConfig();
  if (parsed.error) {
    configState.ok = false;
    configState.reason = parsed.error;
    console.error('[granta] ' + parsed.error);
    return;
  }
  supabase = createClient(parsed.url, parsed.key, Object.assign({
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: (typeof window !== 'undefined' && window.localStorage) || undefined,
      storageKey: AUTH_STORAGE_KEY,
    },
  }, parsed.options || {}));
  configState.ok = true;
  configState.url = parsed.url;
})();

/** זורק שגיאה ברורה אם אין לקוח — כדי שכשל config לא ייראה כשגיאת רשת. */
function client() {
  if (!supabase) {
    throw new Error('[granta] אין חיבור ל-Supabase: ' + (configState.reason || 'config לא אותחל.'));
  }
  return supabase;
}

/** עוטף תשובת Supabase: מחזיר data או זורק Error עם הודעה קריאה. */
function unwrap(res, what) {
  if (res && res.error) {
    const err = new Error(`[granta] ${what}: ${res.error.message || res.error}`);
    err.cause = res.error;
    err.code = res.error.code;
    throw err;
  }
  return res ? res.data : null;
}

/* ------------------------------------------------------------------ *
 * 2. סשן והרשאות
 * ------------------------------------------------------------------ */

let _sessionCache = null; // { user, role, orgId } — מתאפס בהתנתקות

export const auth = {
  /** משתמש מחובר או null. */
  async getUser() {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data || !data.user) return null;
    return data.user;
  },

  /** ה-session הגולמי (כולל access_token). */
  async getSession() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return (data && data.session) || null;
  },

  /**
   * מי המשתמש הנוכחי בשפת גרנטה.
   * @returns {Promise<{user:object, role:string|null, orgId:string|null, isOperator:boolean}|null>}
   */
  async whoami({ refresh = false } = {}) {
    if (_sessionCache && !refresh) return _sessionCache;
    const user = await auth.getUser();
    if (!user) { _sessionCache = null; return null; }

    // אופרייטור = claim ב-JWT (SPEC §1), לא שורה בטבלה.
    //
    // 🔴 אבטחה — התפקיד נקרא מ-app_metadata בלבד, לעולם לא מ-user_metadata.
    // המשתמש עורך את user_metadata של עצמו דרך auth.updateUser({data}), ולכן
    // מיזוג שלו לתוך ה-claims היה מאפשר לכל אחד להעניק לעצמו granta_role='operator'
    // ולפתוח את קונסולת האופרייטור. ה-RLS היה עדיין חוסם את הדאטה (המיגרציה 0100
    // קוראת את ה-claim מה-JWT בלבד), אבל ה-UI היה נפתח — וזה כשל אבטחה.
    // user_metadata נשאר זמין לשדות לא-מיוחסים בלבד.
    const priv  = user.app_metadata || {};
    const prefs = user.user_metadata || {};
    let role  = priv.granta_role || priv.role || null;
    let orgId = priv.org_id || null;

    if (prefs.granta_role && prefs.granta_role !== role) {
      console.warn('[granta] התעלמתי מ-granta_role שמופיע ב-user_metadata. תפקיד נקבע ב-app_metadata בלבד.');
    }

    // עמותה = שורה ב-granta_users.
    if (!orgId || role !== ROLES.OPERATOR) {
      try {
        const row = unwrap(
          await client().from(TABLES.users)
            .select('org_id, role')
            .eq('user_id', user.id)
            .maybeSingle(),
          'קריאת שיוך משתמש'
        );
        if (row) {
          orgId = orgId || row.org_id;
          if (role !== ROLES.OPERATOR) role = row.role || role;
        }
      } catch (e) {
        console.warn('[granta] whoami: לא ניתן לקרוא granta_users —', e.message);
      }
    }

    _sessionCache = {
      user,
      role: role || null,
      orgId: orgId || null,
      isOperator: role === ROLES.OPERATOR,
    };
    return _sessionCache;
  },

  /** התחברות במייל+סיסמה. */
  async signIn(email, password) {
    const data = unwrap(await client().auth.signInWithPassword({ email, password }), 'התחברות');
    _sessionCache = null;
    return data;
  },

  /** קישור-קסם למייל (ללא סיסמה). */
  async signInWithOtp(email, redirectTo) {
    return unwrap(
      await client().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo || undefined } }),
      'שליחת קישור התחברות'
    );
  },

  async signOut() {
    _sessionCache = null;
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  /** מאזין לשינויי סשן; מנקה קאש. מחזיר פונקציית ביטול. */
  onChange(handler) {
    if (!supabase) return () => {};
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      _sessionCache = null;
      if (typeof handler === 'function') handler(event, session);
    });
    return () => { try { data.subscription.unsubscribe(); } catch (_) {} };
  },
};

/* ------------------------------------------------------------------ *
 * 3. שומרי-סף (guards)
 * ------------------------------------------------------------------ */

/** נתיב ההתחברות של פורטל העמותה / הקונסולה. */
const LOGIN_PATH = 'app/login.html';
const OPS_DENIED_PATH = 'app/index.html';

/**
 * דורש משתמש מחובר המשויך לעמותה. אם אין — מפנה להתחברות.
 * @param {{redirect?:boolean}} [opts]
 * @returns {Promise<{user:object, role:string, orgId:string, isOperator:boolean}|null>}
 */
export async function requireOrg(opts = {}) {
  const redirect = opts.redirect !== false;
  const me = await auth.whoami();
  if (!me) {
    if (redirect) nav.go(LOGIN_PATH + '?next=' + encodeURIComponent(location.pathname + location.search));
    return null;
  }
  if (!me.orgId && !me.isOperator) {
    if (redirect) nav.go(LOGIN_PATH + '?err=no-org');
    return null;
  }
  return me;
}

/**
 * דורש אופרייטור (קונסולה C1–C6). אם אין — מפנה החוצה.
 * @param {{redirect?:boolean}} [opts]
 * @returns {Promise<object|null>}
 */
export async function requireOperator(opts = {}) {
  const redirect = opts.redirect !== false;
  const me = await auth.whoami();
  if (!me) {
    if (redirect) nav.go(LOGIN_PATH + '?next=' + encodeURIComponent(location.pathname + location.search));
    return null;
  }
  if (!me.isOperator) {
    if (redirect) nav.go(OPS_DENIED_PATH + '?err=not-operator');
    return null;
  }
  return me;
}

/* ------------------------------------------------------------------ *
 * 4. שכבת גישה לנתונים
 *    כל פונקציה ממופה לטבלה מ-SPEC §4. שמות עמודות מרוכזים כאן בכוונה —
 *    אם המיגרציה (0100_granta_core.sql) נוקבת בשם אחר, מתקנים במקום אחד.
 * ------------------------------------------------------------------ */

/** M1 · משפך זכאות — granta_leads */
export const leads = {
  /**
   * יצירת ליד מטופס /check (4 שדות + UTM).
   * @param {{org_name:string, website:string, email:string, has_grants:boolean|string,
   *          utm?:object, source?:string}} input
   */
  async create(input) {
    if (!input || !input.email || !input.org_name) {
      throw new Error('[granta] leads.create: חסר שם עמותה או אימייל.');
    }
    // 🔴 השדות חייבים להיות בדיוק אלה שמופיעים ב-GRANT ברמת-העמודה ל-anon
    // (0100 §5.2): org_name · website · email · has_grants · source ·
    // utm_source · utm_medium · utm_campaign · utm_term · utm_content · referrer.
    // כל שדה נוסף — גם קיים בטבלה — יפיל את ההגשה ב-permission denied.
    const utm = input.utm || collectUtm() || {};
    const row = {
      org_name:   String(input.org_name).trim(),
      website:    input.website ? String(input.website).trim() : null,
      email:      String(input.email).trim().toLowerCase(),
      has_grants: normalizeHasGrants(input.has_grants),
      source:     input.source || 'check',
      // ה-UTM שטוח בסכימה, לא אובייקט אחד.
      utm_source:   utm.utm_source   || null,
      utm_medium:   utm.utm_medium   || null,
      utm_campaign: utm.utm_campaign || null,
      utm_term:     utm.utm_term     || null,
      utm_content:  utm.utm_content  || null,
      referrer:     utm.referrer     || null,
    };
    // status לא נשלח במכוון: ברירת המחדל בעמודה היא 'new'.
    //
    // 🔴 ההגשה עוברת דרך Edge Function ולא ב-insert ישיר.
    // האפיון (§2 M1) מבטיח בדיקה אוטומטית תוך שניות, ואי אפשר לתת לדפדפן
    // להפעיל את מנוע הזכאות: המנוע רץ ב-service_role, עוקף RLS, וכתיבת פסיקה
    // לליד מוגבלת בכוונה לקורא מורשה. הדפדפן לעולם לא יהיה כזה.
    // לכן: הדפדפן מדבר עם granta-submit-lead בלבד, והיא מכניסה את הליד
    // ומפעילה את המנוע בצד שרת. שום סוד לא עובר כאן.
    const { data, error } = await client().functions.invoke('granta-submit-lead', { body: row });
    if (error) throw new Error('[granta] יצירת ליד: ' + error.message);
    if (data && data.ok === false) {
      throw new Error('[granta] יצירת ליד נדחתה: ' + (data.error || 'unknown'));
    }

    // תיעוד — SPEC §M8. מדלג בשקט כשהמגיש אנונימי (audit.log מחזיר null),
    // כי לאנונימי אין הרשאת כתיבה ליומן. התיעוד הציבורי נעשה בצד שרת.
    audit.log({ action: 'lead.create', entity: TABLES.leads, diff: { after: row } })
      .catch(() => {});
    return { ok: true };
  },

  /**
   * תיבת הלידים לאופרייטור (מסך C2), ממוינת לפי SLA.
   * @param {{status?:string, limit?:number, offset?:number, search?:string}} [opts]
   */
  async list(opts = {}) {
    let q = client().from(TABLES.leads).select('*').order('created_at', { ascending: true });
    if (opts.status) q = q.eq('status', opts.status);
    if (opts.search) q = q.ilike('org_name', `%${opts.search}%`);
    const limit = opts.limit || 100;
    const offset = opts.offset || 0;
    q = q.range(offset, offset + limit - 1);
    return unwrap(await q, 'טעינת לידים') || [];
  },

  /** ליד בודד לפי מזהה. */
  async get(id) {
    return unwrap(
      await client().from(TABLES.leads).select('*').eq('id', id).maybeSingle(),
      'טעינת ליד'
    );
  },

  /** עדכון סטטוס/פסיקה ידנית של אופרייטור — עם תיעוד. */
  async update(id, patch) {
    const before = await leads.get(id);
    const data = unwrap(
      await client().from(TABLES.leads).update(patch).eq('id', id).select().single(),
      'עדכון ליד'
    );
    audit.log({ action: 'lead.update', entity: TABLES.leads, entityId: id, diff: { before, after: patch } })
      .catch(() => {});
    return data;
  },
};

/** תיק העמותה — granta_orgs */
export const orgs = {
  /**
   * תיק עמותה לפי מזהה. ללא מזהה — התיק של המשתמש המחובר.
   * @param {string} [orgId]
   */
  async get(orgId) {
    let id = orgId;
    if (!id) {
      const me = await auth.whoami();
      id = me && me.orgId;
      if (!id) return null;
    }
    return unwrap(
      await client().from(TABLES.orgs).select('*').eq('id', id).maybeSingle(),
      'טעינת תיק עמותה'
    );
  },

  /** כל התיקים — מסך C1. RLS מגבילה לאופרייטור בלבד. */
  async list(opts = {}) {
    let q = client().from(TABLES.orgs).select('*');
    if (opts.track) q = q.eq('track', opts.track);
    if (opts.status) q = q.eq('status', opts.status);
    q = q.order(opts.orderBy || 'created_at', { ascending: opts.ascending === true });
    if (opts.limit) q = q.limit(opts.limit);
    return unwrap(await q, 'טעינת עמותות') || [];
  },
};

/** M1 · תוצאות בדיקת זכאות — granta_eligibility_checks */
export const eligibility = {
  /**
   * בדיקת הזכאות האחרונה. מקבל { leadId } או { orgId } או מזהה בדיקה.
   * @param {{leadId?:string, orgId?:string, id?:string}|string} ref
   */
  async get(ref) {
    const r = typeof ref === 'string' ? { id: ref } : (ref || {});
    let q = client().from(TABLES.eligibilityChecks).select('*');
    if (r.id) {
      return unwrap(await q.eq('id', r.id).maybeSingle(), 'טעינת בדיקת זכאות');
    }
    if (r.leadId) q = q.eq('lead_id', r.leadId);
    else if (r.orgId) q = q.eq('org_id', r.orgId);
    else throw new Error('[granta] eligibility.get: חסר leadId / orgId / id.');
    q = q.order('created_at', { ascending: false }).limit(1);
    const rows = unwrap(await q, 'טעינת בדיקת זכאות') || [];
    return rows[0] || null;
  },

  /** היסטוריית בדיקות של ליד/עמותה. */
  async list(ref) {
    const r = ref || {};
    let q = client().from(TABLES.eligibilityChecks).select('*');
    if (r.leadId) q = q.eq('lead_id', r.leadId);
    if (r.orgId) q = q.eq('org_id', r.orgId);
    return unwrap(await q.order('created_at', { ascending: false }), 'טעינת בדיקות זכאות') || [];
  },
};

/* ------------------------------------------------------------------ *
 * 5. M8 · יומן פעולות (append-only)
 * ------------------------------------------------------------------ */

export const audit = {
  /**
   * כותב שורה ל-granta_audit_log. append-only — אין update/delete.
   * @param {{action:string, entity:string, entityId?:string, diff?:object, orgId?:string}} e
   */
  async log(e) {
    if (!e || !e.action) throw new Error('[granta] audit.log: חסר action.');
    if (!supabase) { console.warn('[granta] audit.log דולג — אין חיבור.'); return null; }
    let actor = null, orgId = e.orgId || null;
    try {
      const me = await auth.whoami();
      if (me) { actor = me.user.id; orgId = orgId || me.orgId; }
    } catch (_) {}
    // actor_kind — לא actor_role. הסכימה (0100) מגדירה CHECK IN ('system','operator','org'),
    // ותפקידי המשתמש (org_admin/org_viewer) אינם ערכים חוקיים בעמודה הזו.
    const role = (_sessionCache && _sessionCache.role) || null;
    const actorKind = role === ROLES.OPERATOR ? 'operator' : (role ? 'org' : null);

    // אנונימי לא יכול לכתוב ליומן — אין policy ל-anon על granta_audit_log, וזה מכוון.
    // תיעוד של פעולה ציבורית (יצירת ליד) נעשה בצד שרת, לא כאן.
    if (!actorKind) { return null; }

    const row = {
      actor_id:   actor,
      actor_kind: actorKind,
      org_id:     orgId,
      action:     e.action,
      entity:     e.entity || null,
      entity_id:  e.entityId || null,
      diff:       e.diff || {},   // העמודה NOT NULL DEFAULT '{}' — null מפורש היה נכשל
    };
    try {
      return unwrap(await client().from(TABLES.auditLog).insert(row).select().single(), 'כתיבה ליומן');
    } catch (err) {
      // כשל תיעוד לא מפיל את הפעולה עצמה — אבל רועש בקונסולה.
      console.error('[granta] audit.log נכשל:', err.message);
      return null;
    }
  },

  /**
   * קריאת היומן — מסך B6 / C3.
   * @param {{orgId?:string, entity?:string, entityId?:string, limit?:number}} [opts]
   */
  async list(opts = {}) {
    let q = client().from(TABLES.auditLog).select('*').order('created_at', { ascending: false });
    if (opts.orgId) q = q.eq('org_id', opts.orgId);
    if (opts.entity) q = q.eq('entity', opts.entity);
    if (opts.entityId) q = q.eq('entity_id', opts.entityId);
    return unwrap(await q.limit(opts.limit || 200), 'טעינת יומן') || [];
  },
};

/* ------------------------------------------------------------------ *
 * 6. פורמטים (עברית, RTL)
 * ------------------------------------------------------------------ */

const LOCALE = 'he-IL';

const _nf = new Intl.NumberFormat(LOCALE);
const _rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
const _currencyCache = {};

function toDate(d) {
  if (d instanceof Date) return isNaN(d) ? null : d;
  if (d === null || d === undefined || d === '') return null;
  const parsed = new Date(d);
  return isNaN(parsed) ? null : parsed;
}

export const fmt = {
  /** מספר עם מפרידי אלפים. */
  number(n, digits) {
    if (n === null || n === undefined || n === '' || isNaN(Number(n))) return '—';
    if (digits === undefined) return _nf.format(Number(n));
    return new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: digits, maximumFractionDigits: digits,
    }).format(Number(n));
  },

  /**
   * מטבע. ברירת מחדל ₪ (המחירים במוצר בשקלים; תקציב Ad Grants ב-$).
   * @param {number} n
   * @param {'ILS'|'USD'} [currency]
   */
  currency(n, currency = 'ILS', opts = {}) {
    if (n === null || n === undefined || n === '' || isNaN(Number(n))) return '—';
    // ברירת מחדל: מספר שלם בלי אגורות (₪790), שבור עם שתי ספרות (₪12.40).
    const digits = opts.digits !== undefined ? opts.digits : (Number.isInteger(Number(n)) ? 0 : 2);
    const key = currency + ':' + digits;
    if (!_currencyCache[key]) {
      _currencyCache[key] = new Intl.NumberFormat(LOCALE, {
        style: 'currency', currency,
        minimumFractionDigits: digits, maximumFractionDigits: digits,
      });
    }
    return _currencyCache[key].format(Number(n));
  },

  /**
   * אחוזים. מקבל 0.0473 → "4.73%" או 4.73 עם { asRatio:false }.
   * ברירת מחדל: המספר הוא יחס (0–1), כי כך CTR מגיע מגוגל.
   */
  pct(n, opts = {}) {
    if (n === null || n === undefined || n === '' || isNaN(Number(n))) return '—';
    const asRatio = opts.asRatio !== false;
    const value = asRatio ? Number(n) : Number(n) / 100;
    const digits = opts.digits !== undefined ? opts.digits : 2;
    return new Intl.NumberFormat(LOCALE, {
      style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits,
    }).format(value);
  },

  /** תאריך בעברית. mode: 'short' | 'long' | 'datetime' | 'month' */
  date(d, mode = 'short') {
    const dt = toDate(d);
    if (!dt) return '—';
    const presets = {
      short:    { day: '2-digit', month: '2-digit', year: 'numeric' },
      long:     { day: 'numeric', month: 'long', year: 'numeric' },
      datetime: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' },
      month:    { month: 'long', year: 'numeric' },
      time:     { hour: '2-digit', minute: '2-digit' },
    };
    return new Intl.DateTimeFormat(LOCALE, presets[mode] || presets.short).format(dt);
  },

  /** זמן יחסי: "לפני 3 שעות" / "בעוד 2 ימים". */
  relTime(d, now) {
    const dt = toDate(d);
    if (!dt) return '—';
    const base = toDate(now) || new Date();
    const diffSec = Math.round((dt.getTime() - base.getTime()) / 1000);
    const units = [
      ['year',   31536000],
      ['month',  2592000],
      ['week',   604800],
      ['day',    86400],
      ['hour',   3600],
      ['minute', 60],
      ['second', 1],
    ];
    const abs = Math.abs(diffSec);
    if (abs < 45) return 'עכשיו';
    for (const [unit, sec] of units) {
      if (abs >= sec) return _rtf.format(Math.round(diffSec / sec), unit);
    }
    return _rtf.format(diffSec, 'second');
  },

  /** שעון SLA (24 שעות ללידים, SPEC §0.3): כמה נשאר / כמה עברנו. */
  slaLeft(createdAt, hours = 24) {
    const dt = toDate(createdAt);
    if (!dt) return { overdue: false, text: '—', msLeft: null };
    const due = new Date(dt.getTime() + hours * 3600 * 1000);
    const msLeft = due.getTime() - Date.now();
    return { overdue: msLeft < 0, dueAt: due, msLeft, text: fmt.relTime(due) };
  },
};

/* ------------------------------------------------------------------ *
 * 7. ניווט
 * ------------------------------------------------------------------ */

/** שורש גרנטה באתר — נגזר מהנתיב הנוכחי, כדי שיעבוד גם ב-GitHub Pages תחת תת-נתיב. */
function grantaRoot() {
  const p = (typeof location !== 'undefined' && location.pathname) || '/';
  const i = p.indexOf('/granta/');
  if (i >= 0) return p.slice(0, i + '/granta/'.length);

  // גיבוי — כשגרנטה מוגשת כשורש האתר (שרת פיתוח מקומי, או פריסה בלי /granta/).
  // 🔴 "התיקייה הנוכחית" לבדה שגויה: מ-ops/leads.html היא הייתה גוזרת 'ops/',
  // ו-nav.go('app/login.html') היה יוצא ל-ops/app/login.html.
  // לכן מקלפים תיקיית-משנה מוכרת אם היא האחרונה בנתיב.
  const dir = p.replace(/[^/]*$/, '');
  return dir.replace(/(?:^|\/)(app|ops|assets|legal)\/$/, '/');
}

export const nav = {
  root: grantaRoot,

  /**
   * מעבר לנתיב יחסי לשורש גרנטה ('app/index.html') או מוחלט ('/x' / 'https://…').
   * @param {string} path
   * @param {{replace?:boolean}} [opts]
   */
  go(path, opts = {}) {
    if (typeof location === 'undefined') return;
    const url = /^([a-z]+:)?\/\//i.test(path) || path.startsWith('/')
      ? path
      : grantaRoot() + path.replace(/^\.\//, '');
    if (opts.replace) location.replace(url); else location.assign(url);
  },

  /** חזרה — history.back() כמו בשאר המערכות. אם אין היסטוריה, נופל ללוח המצב. */
  back(fallback = 'app/index.html') {
    if (typeof history !== 'undefined' && history.length > 1) history.back();
    else nav.go(fallback);
  },

  /** פרמטר מה-query string. */
  param(name, fallback = null) {
    if (typeof location === 'undefined') return fallback;
    const v = new URLSearchParams(location.search).get(name);
    return v === null ? fallback : v;
  },
};

/* ------------------------------------------------------------------ *
 * 8. מצבי מסך — loading / empty / error
 *    מינימום HTML. העיצוב חי ב-CSS (granta.css), לא כאן.
 * ------------------------------------------------------------------ */

function resolveEl(el) {
  if (!el) return null;
  if (typeof el === 'string') return document.querySelector(el);
  return el;
}

function esc(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export const ui = {
  escape: esc,

  /** מצב טעינה. */
  loading(el, msg = 'טוען…') {
    const node = resolveEl(el);
    if (!node) return;
    node.setAttribute('aria-busy', 'true');
    node.innerHTML =
      `<div class="granta-state granta-state--loading" role="status">` +
        `<span class="granta-spinner" aria-hidden="true"></span>` +
        `<p>${esc(msg)}</p>` +
      `</div>`;
  },

  /** מצב ריק. */
  empty(el, msg = 'אין כאן עדיין כלום.', action) {
    const node = resolveEl(el);
    if (!node) return;
    node.removeAttribute('aria-busy');
    const btn = action && action.label
      ? `<button type="button" class="granta-btn" data-granta-action="empty">${esc(action.label)}</button>`
      : '';
    node.innerHTML =
      `<div class="granta-state granta-state--empty">` +
        `<p>${esc(msg)}</p>${btn}` +
      `</div>`;
    if (btn && typeof action.onClick === 'function') {
      const b = node.querySelector('[data-granta-action="empty"]');
      if (b) b.addEventListener('click', action.onClick);
    }
  },

  /** מצב שגיאה — הודעה בעברית לעמותה, פירוט טכני בקונסולה. */
  error(el, err, msg = 'משהו השתבש בטעינה.') {
    const node = resolveEl(el);
    if (node) {
      node.removeAttribute('aria-busy');
      const detail = err && err.message ? `<small class="granta-state__detail">${esc(err.message)}</small>` : '';
      node.innerHTML =
        `<div class="granta-state granta-state--error" role="alert">` +
          `<p>${esc(msg)}</p>${detail}` +
        `</div>`;
    }
    if (err) console.error('[granta]', err);
  },

  /** ניקוי מצב. */
  clear(el) {
    const node = resolveEl(el);
    if (!node) return;
    node.removeAttribute('aria-busy');
    node.innerHTML = '';
  },
};

/* ------------------------------------------------------------------ *
 * 9. עזרים פנימיים
 * ------------------------------------------------------------------ */

/** "כן"/"לא"/true/false/'yes' → boolean|null */
function normalizeHasGrants(v) {
  if (v === true || v === false) return v;
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim().toLowerCase();
  if (['true', 'yes', 'y', '1', 'כן'].includes(s)) return true;
  if (['false', 'no', 'n', '0', 'לא'].includes(s)) return false;
  return null;
}

/** אוסף UTM מה-URL הנוכחי (למקור הליד). */
function collectUtm() {
  if (typeof location === 'undefined') return null;
  const p = new URLSearchParams(location.search);
  const out = {};
  // 🔴 רק שדות שיש להם עמודה בסכימה. gclid הוסר — אין לו עמודה ב-granta_leads,
  // והוא היה מפיל את ההגשה. אם נרצה ייחוס Google Ads — נדרשת עמודה + הרחבת ה-GRANT.
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) => {
    const v = p.get(k);
    if (v) out[k] = v;
  });
  if (document && document.referrer) out.referrer = document.referrer;
  return Object.keys(out).length ? out : null;
}

/* ------------------------------------------------------------------ *
 * 10. ייצוא מרוכז + חשיפה גלובלית
 * ------------------------------------------------------------------ */

const Granta = {
  supabase: () => supabase,
  configState,
  TABLES, ROLES,
  auth, requireOrg, requireOperator,
  leads, orgs, eligibility, audit,
  fmt, nav, ui,
};

if (typeof window !== 'undefined') window.Granta = Granta;

export default Granta;
