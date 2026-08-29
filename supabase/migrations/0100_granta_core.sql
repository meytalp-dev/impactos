-- ============================================================================
-- גְּרַנְטָה (Granta) · Migration 0100 — Core schema + RLS
-- ============================================================================
-- Created: 2026-08-29
-- Spec:    granta/SPEC.md §1 (שחקנים והרשאות) · §4 (מודל נתונים)
--
-- מה הקובץ הזה עושה:
--   1. יוצר את 5 טבלאות הליבה של גרנטה:
--      granta_orgs · granta_users · granta_leads ·
--      granta_eligibility_checks · granta_audit_log
--   2. מדליק RLS על כולן.
--   3. עמותה רואה רק את התיק שלה (דרך granta_users).
--      אופרייטור רואה הכול — זיהוי דרך claim ב-JWT, לא דרך שורה בטבלה.
--   4. granta_audit_log = append-only. INSERT + SELECT בלבד.
--      בלי UPDATE ובלי DELETE, לאף תפקיד — כולל service_role ובעל הטבלה.
--      זה מסמך האמון של המוצר.
--
-- How to run:
--   Supabase Dashboard → SQL Editor → הדביקי את כל הקובץ → Run.
--
-- Idempotent: CREATE ... IF NOT EXISTS · DROP POLICY IF EXISTS לפני כל
--             CREATE POLICY · CREATE OR REPLACE FUNCTION. בטוח להריץ שוב.
--
-- 🔴 טווח: זו מיגרציית הליבה בלבד. accounts / snapshots / campaigns /
--    adgroups / ads / keywords / policy_rules / findings / actions / alerts /
--    reports / documents / submission_steps (SPEC §4) — במיגרציה נפרדת.
--    שום FK כאן לא מפנה לטבלה שלא נוצרת בקובץ הזה.
-- ============================================================================


-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()


-- ============================================================================
-- 1. פונקציות-עזר
-- ============================================================================
-- כולן SECURITY DEFINER / STABLE כדי לא לגרור רקורסיה בין policies
-- (אותה קונבנציה כמו my_school()/my_role() ב-0007).

-- ---------------------------------------------------------------------------
-- 1.1 — האם המשתמש.ת המחובר.ת היא אופרייטור?
-- ---------------------------------------------------------------------------
-- 🔴 אופרייטור = claim ב-JWT, לא שורה בטבלה (SPEC §1).
--    בודקים claim ברמה העליונה או תחת app_metadata — שניהם נשלטים בשרת.
--    ⚠️ user_metadata *לא* נבדק בכוונה: משתמש יכול לערוך אותו בעצמו
--       (auth.updateUser) — לסמוך עליו = להעניק אופרייטור לכל אחד.
CREATE OR REPLACE FUNCTION public.granta_is_operator()
RETURNS BOOLEAN
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'granta_role',
    auth.jwt() -> 'app_metadata' ->> 'granta_role',
    ''
  ) = 'operator';
$$;
COMMENT ON FUNCTION public.granta_is_operator() IS
  'TRUE אם ב-JWT יש granta_role=operator (top-level או app_metadata). לא נוגע בטבלאות.';

-- ---------------------------------------------------------------------------
-- 1.2 — כל התיקים שהמשתמש.ת המחובר.ת משויכת אליהם
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.granta_my_org_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT gu.org_id
  FROM public.granta_users gu
  WHERE gu.user_id = auth.uid()
    AND gu.org_id IS NOT NULL;
$$;
COMMENT ON FUNCTION public.granta_my_org_ids() IS
  'org_id-ים של המשתמש.ת המחובר.ת. SECURITY DEFINER — עוקף RLS כדי למנוע רקורסיה ב-policies.';

-- ---------------------------------------------------------------------------
-- 1.3 — האם המשתמש.ת היא org_admin של תיק מסוים? (org_viewer = קריאה בלבד)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.granta_is_org_admin(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.granta_users gu
    WHERE gu.user_id = auth.uid()
      AND gu.org_id  = p_org_id
      AND gu.role    = 'org_admin'
  );
$$;
COMMENT ON FUNCTION public.granta_is_org_admin(UUID) IS
  'TRUE אם המשתמש.ת המחובר.ת היא org_admin של התיק. org_viewer מקבל FALSE.';

-- ---------------------------------------------------------------------------
-- 1.4 — טריגר משותף ל-updated_at (קונבנציית 0004)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.granta_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ============================================================================
-- 2. טבלאות
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 2.1 — granta_orgs · תיק עמותה
-- ---------------------------------------------------------------------------
-- הישות המרכזית של המערכת. כל עמותה מנויה = שורה אחת כאן.
-- מחזיקה: פרטי זיהוי (שם, מספר עמותה, אתר), איש קשר, המסלול
-- (managed = ₪790 לחודש · from_zero = ₪1,200 × 3 ואז מעבר אוטומטי ל-managed,
-- SPEC §M10), סטטוס התיק ותאריכי המנוי.
-- כל שאר טבלאות המוצר תלויות ב-org_id הזה, וגם ה-RLS כולו.
CREATE TABLE IF NOT EXISTS public.granta_orgs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  registry_number         TEXT,                       -- מספר עמותה (רשם העמותות)
  website                 TEXT,
  contact_name            TEXT,
  contact_email           TEXT,
  contact_phone           TEXT,
  track                   TEXT NOT NULL DEFAULT 'managed'
                            CHECK (track IN ('managed', 'from_zero')),
  status                  TEXT NOT NULL DEFAULT 'onboarding'
                            CHECK (status IN ('onboarding', 'active', 'paused', 'churned')),
  monthly_price_ils       NUMERIC(10,2),              -- לפני מע"מ, כלשון דף הנחיתה
  subscription_started_at TIMESTAMPTZ,
  subscription_renews_at  TIMESTAMPTZ,
  subscription_ended_at   TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE  public.granta_orgs IS
  'תיק עמותה — הישות המרכזית. שם, מספר עמותה, אתר, איש קשר, מסלול, סטטוס, מחיר חודשי ותאריכי מנוי.';
COMMENT ON COLUMN public.granta_orgs.track IS
  'managed = חשבון Ad Grants קיים | from_zero = צינור הגשה מאפס (SPEC §M6)';
COMMENT ON COLUMN public.granta_orgs.status IS
  'onboarding | active | paused | churned';

CREATE INDEX IF NOT EXISTS granta_orgs_status_idx     ON public.granta_orgs(status);
CREATE INDEX IF NOT EXISTS granta_orgs_track_idx      ON public.granta_orgs(track);
CREATE INDEX IF NOT EXISTS granta_orgs_created_at_idx ON public.granta_orgs(created_at DESC);

DROP TRIGGER IF EXISTS trg_granta_orgs_updated_at ON public.granta_orgs;
CREATE TRIGGER trg_granta_orgs_updated_at
  BEFORE UPDATE ON public.granta_orgs
  FOR EACH ROW EXECUTE FUNCTION public.granta_touch_updated_at();


-- ---------------------------------------------------------------------------
-- 2.2 — granta_users · שיוך משתמש לתיק + תפקיד
-- ---------------------------------------------------------------------------
-- 🔴 זה הבסיס לכל ה-RLS. שורה כאן = "המשתמש הזה רשאי לראות את התיק הזה".
-- org_admin  — נציג.ת עמותה עם הרשאת כתיבה (מאשר.ת פעולות, עורך.ת פרטי תיק)
-- org_viewer — צפייה בלבד באותו תיק
-- operator   — צוות Impact OS. התפקיד רשום כאן לתיעוד/ניהול,
--              אבל 🔴 ההרשאה בפועל מגיעה מ-claim ב-JWT (granta_is_operator),
--              לא מהשורה. לאופרייטור org_id הוא NULL.
CREATE TABLE IF NOT EXISTS public.granta_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id      UUID REFERENCES public.granta_orgs(id) ON DELETE CASCADE,
  role        TEXT NOT NULL
                CHECK (role IN ('org_admin', 'org_viewer', 'operator')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- תפקידי עמותה חייבים תיק; אופרייטור הוא חוצה-תיקים ולכן בלי תיק
  CONSTRAINT granta_users_org_required_chk CHECK (
    (role =  'operator' AND org_id IS NULL) OR
    (role <> 'operator' AND org_id IS NOT NULL)
  )
);
COMMENT ON TABLE public.granta_users IS
  'שיוך auth.users → תיק עמותה + תפקיד (org_admin|org_viewer|operator). הבסיס ל-RLS. אופרייטור = claim ב-JWT, השורה כאן לתיעוד בלבד.';

-- שיוך אחד לכל צמד משתמש-תיק (ולאופרייטור — שורה אחת בלי תיק)
CREATE UNIQUE INDEX IF NOT EXISTS granta_users_user_org_uidx
  ON public.granta_users(user_id, org_id) WHERE org_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS granta_users_user_noorg_uidx
  ON public.granta_users(user_id) WHERE org_id IS NULL;

-- 🔴 אינדקס נדרש — כל בדיקת RLS במערכת עוברת דרכו
CREATE INDEX IF NOT EXISTS granta_users_user_id_idx ON public.granta_users(user_id);
CREATE INDEX IF NOT EXISTS granta_users_org_id_idx  ON public.granta_users(org_id);

DROP TRIGGER IF EXISTS trg_granta_users_updated_at ON public.granta_users;
CREATE TRIGGER trg_granta_users_updated_at
  BEFORE UPDATE ON public.granta_users
  FOR EACH ROW EXECUTE FUNCTION public.granta_touch_updated_at();


-- ---------------------------------------------------------------------------
-- 2.3 — granta_leads · לידים מטופס /check
-- ---------------------------------------------------------------------------
-- כל מילוי של טופס בדיקת הזכאות הציבורי (SPEC §M1, מסך A1) נוחת כאן.
-- 4 שדות מהטופס (שם עמותה, אתר, אימייל, has_grants) + מקור/UTM,
-- ואז המנוע ממלא ציון ופסיקה, ושעון ה-SLA (24 שעות) רץ עד תשובת האופרייטור.
-- 🔴 נקודת החשיפה היחידה במערכת: כתיבה אנונימית מותרת, קריאה לאופרייטור בלבד.
CREATE TABLE IF NOT EXISTS public.granta_leads (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name           TEXT NOT NULL,
  website            TEXT,
  email              TEXT NOT NULL,
  has_grants         BOOLEAN,                      -- "יש כבר Google Ad Grants?"
  source             TEXT,                         -- landing | check | direct | ...
  utm_source         TEXT,
  utm_medium         TEXT,
  utm_campaign       TEXT,
  utm_term           TEXT,
  utm_content        TEXT,
  referrer           TEXT,
  eligibility_score  INTEGER CHECK (eligibility_score BETWEEN 0 AND 100),
  verdict            TEXT CHECK (verdict IN
                       ('likely_eligible', 'needs_review', 'likely_ineligible')),
  sla_due_at         TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  responded_at       TIMESTAMPTZ,                  -- מתי נשלח דוח הזכאות בפועל
  status             TEXT NOT NULL DEFAULT 'new'
                       CHECK (status IN
                         ('new', 'in_review', 'report_sent', 'converted', 'rejected', 'spam')),
  org_id             UUID REFERENCES public.granta_orgs(id) ON DELETE SET NULL,
  notes              TEXT,                         -- הערות פנימיות של האופרייטור
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE  public.granta_leads IS
  'ליד מטופס /check הציבורי: שם עמותה, אתר, מייל, has_grants, מקור/UTM, ציון זכאות, פסיקה, חותמת SLA וסטטוס טיפול. כתיבה אנונימית · קריאה לאופרייטור בלבד.';
COMMENT ON COLUMN public.granta_leads.sla_due_at IS
  'חותמת SLA — 24 שעות מהגשת הטופס (SPEC §M1 / מסך C2)';
COMMENT ON COLUMN public.granta_leads.org_id IS
  'מתמלא כשהליד הומר לתיק עמותה (status=converted)';
COMMENT ON COLUMN public.granta_leads.notes IS
  'הערות פנימיות — אופרייטור בלבד. אנונימי לא יכול לכתוב לכאן (GRANT ברמת עמודה, §5).';

-- 🔴 אינדקס נדרש — תיבת הלידים C2 ממוינת לפי זמן
CREATE INDEX IF NOT EXISTS granta_leads_created_at_idx ON public.granta_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS granta_leads_status_idx     ON public.granta_leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS granta_leads_sla_idx        ON public.granta_leads(sla_due_at)
  WHERE responded_at IS NULL;
CREATE INDEX IF NOT EXISTS granta_leads_org_id_idx     ON public.granta_leads(org_id);

DROP TRIGGER IF EXISTS trg_granta_leads_updated_at ON public.granta_leads;
CREATE TRIGGER trg_granta_leads_updated_at
  BEFORE UPDATE ON public.granta_leads
  FOR EACH ROW EXECUTE FUNCTION public.granta_touch_updated_at();


-- ---------------------------------------------------------------------------
-- 2.4 — granta_eligibility_checks · תוצאות בדיקת זכאות
-- ---------------------------------------------------------------------------
-- הפלט המלא של מנוע הזכאות (SPEC §M1): סריקת האתר (HTTPS/SSL, האתר עולה,
-- שפה, עמודי אודות/צור-קשר, דגלים אדומים) + הצלבה מול כללי ELIG מקטלוג
-- הכללים — הכול כ-JSONB, בלי סכימה קשיחה שתישבר כשכלל משתנה.
-- שורה חדשה בכל ריצה: אוטומטית (system) או תיקון ידני של אופרייטור (operator).
-- ⚠️ הפסיקה היא הערכה בלבד — האישור בידי Google בלבד (SPEC §M1).
CREATE TABLE IF NOT EXISTS public.granta_eligibility_checks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID REFERENCES public.granta_leads(id) ON DELETE CASCADE,
  org_id        UUID REFERENCES public.granta_orgs(id)  ON DELETE CASCADE,
  website       TEXT,
  scan          JSONB NOT NULL DEFAULT '{}'::jsonb,   -- תוצאות סריקת האתר
  rules         JSONB NOT NULL DEFAULT '{}'::jsonb,   -- הערכת כללי ELIG (rule_code → תוצאה)
  blockers      JSONB NOT NULL DEFAULT '[]'::jsonb,   -- רשימת חסמים מנומקת בעברית
  score         INTEGER CHECK (score BETWEEN 0 AND 100),
  verdict       TEXT CHECK (verdict IN
                  ('likely_eligible', 'needs_review', 'likely_ineligible')),
  source        TEXT NOT NULL DEFAULT 'system'
                  CHECK (source IN ('system', 'operator')),
  checked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),   -- חותמת הבדיקה
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE  public.granta_eligibility_checks IS
  'תוצאת סריקת אתר + הערכת כללי ELIG כ-JSONB, ציון 0–100, פסיקה וחותמת. שורה לכל ריצה — ההיסטוריה נשמרת.';
COMMENT ON COLUMN public.granta_eligibility_checks.source IS
  'system = ריצת המנוע | operator = תיקון ידני של האופרייטור';

CREATE INDEX IF NOT EXISTS granta_elig_lead_idx
  ON public.granta_eligibility_checks(lead_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS granta_elig_org_idx
  ON public.granta_eligibility_checks(org_id, checked_at DESC);


-- ---------------------------------------------------------------------------
-- 2.5 — granta_audit_log · יומן פעולות (append-only)
-- ---------------------------------------------------------------------------
-- 🔴 מסמך האמון של המוצר (SPEC §M8). כל פעולה של המערכת / האופרייטור /
-- העמותה: מי, מה, על מה, diff, מתי. נגיש לעמותה במסך B6.
-- append-only מוחלט: INSERT + SELECT בלבד. אין policy ל-UPDATE/DELETE,
-- ההרשאות נשללות ברמת הטבלה, ובנוסף טריגר חוסם — כך שגם service_role
-- וגם בעל הטבלה לא יכולים לשכתב היסטוריה.
--
-- ⚠️ org_id בכוונה בלי FOREIGN KEY: FK עם CASCADE/SET NULL היה מוחק או
--    מעדכן שורות יומן מאחורי גבם של ה-RLS ושל הטריגר. היומן שורד מחיקת תיק.
CREATE TABLE IF NOT EXISTS public.granta_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID,                                  -- ללא FK — ראו הערה למעלה
  actor_kind  TEXT NOT NULL CHECK (actor_kind IN ('system', 'operator', 'org')),
  actor_id    UUID,                                  -- auth.users.id; NULL כשהשחקן הוא המנוע
  action      TEXT NOT NULL,                         -- 'lead.verdict_approved' | 'action.approved' | ...
  entity      TEXT NOT NULL,                         -- 'granta_leads' | 'granta_actions' | ...
  entity_id   TEXT,                                  -- TEXT ולא UUID: יש ישויות עם מפתח-קוד (rule_code)
  diff        JSONB NOT NULL DEFAULT '{}'::jsonb,    -- { "before": {...}, "after": {...} }
  at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.granta_audit_log IS
  'יומן פעולות append-only: מי (actor_kind/actor_id), מה (action), על מה (entity/entity_id), diff ומתי. אין UPDATE ואין DELETE — לאף תפקיד.';
COMMENT ON COLUMN public.granta_audit_log.actor_kind IS
  'system = מנוע/Edge Function | operator = צוות Impact OS | org = נציג.ת העמותה';
COMMENT ON COLUMN public.granta_audit_log.org_id IS
  'התיק שהפעולה נוגעת לו. NULL = פעולה חוצת-מערכת. ללא FK בכוונה — היומן שורד מחיקת תיק.';

-- 🔴 אינדקס נדרש — "מה קרה לישות הזאת" היא השאילתה המרכזית
CREATE INDEX IF NOT EXISTS granta_audit_entity_idx
  ON public.granta_audit_log(entity, entity_id, at DESC);
-- מסכי B6 / C3 — יומן התיק לפי זמן
CREATE INDEX IF NOT EXISTS granta_audit_org_at_idx
  ON public.granta_audit_log(org_id, at DESC);

-- 🔴 שומר-סף פיזי: חוסם UPDATE/DELETE גם לתפקידים שעוקפים RLS
--    (service_role, postgres). כדי לשנות סכימה בעתיד יש להסיר את הטריגר
--    במפורש במיגרציה, בכוונה מלאה. אין דרך "בטעות".
CREATE OR REPLACE FUNCTION public.granta_audit_log_is_append_only()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION
    'granta_audit_log is append-only — % is not allowed (SPEC M8)', TG_OP
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS trg_granta_audit_log_append_only ON public.granta_audit_log;
CREATE TRIGGER trg_granta_audit_log_append_only
  BEFORE UPDATE OR DELETE ON public.granta_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.granta_audit_log_is_append_only();


-- ============================================================================
-- 3. ROW LEVEL SECURITY — הדלקה
-- ============================================================================
ALTER TABLE public.granta_orgs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.granta_users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.granta_leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.granta_eligibility_checks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.granta_audit_log           ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 4. POLICIES
-- ============================================================================
-- כלל: policies מרובות הן PERMISSIVE — הן מתחברות ב-OR.
--      לכן "עמותה רואה את שלה" ו"אופרייטור רואה הכול" חיים זה לצד זה.

-- ---------------------------------------------------------------------------
-- 4.1 — granta_orgs
-- ---------------------------------------------------------------------------
-- עמותה: קוראת רק את התיק שלה. org_admin גם מעדכן. אין INSERT/DELETE לעמותה.
DROP POLICY IF EXISTS granta_orgs_select_own ON public.granta_orgs;
CREATE POLICY granta_orgs_select_own ON public.granta_orgs
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.granta_my_org_ids()));

DROP POLICY IF EXISTS granta_orgs_update_own_admin ON public.granta_orgs;
CREATE POLICY granta_orgs_update_own_admin ON public.granta_orgs
  FOR UPDATE TO authenticated
  USING      (public.granta_is_org_admin(id))
  WITH CHECK (public.granta_is_org_admin(id));

-- אופרייטור: הכול, בכל התיקים.
DROP POLICY IF EXISTS granta_orgs_operator_all ON public.granta_orgs;
CREATE POLICY granta_orgs_operator_all ON public.granta_orgs
  FOR ALL TO authenticated
  USING      (public.granta_is_operator())
  WITH CHECK (public.granta_is_operator());


-- ---------------------------------------------------------------------------
-- 4.2 — granta_users
-- ---------------------------------------------------------------------------
-- כל משתמש רואה את שיוכיו. org_admin רואה את חברי הצוות בתיק שלו.
-- 🔴 אין INSERT/UPDATE/DELETE לעמותה — אחרת משתמש היה משייך את עצמו
--    לתיק זר וקורא אותו. שיוך משתמשים = אופרייטור או service_role בלבד.
DROP POLICY IF EXISTS granta_users_select_self ON public.granta_users;
CREATE POLICY granta_users_select_self ON public.granta_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS granta_users_select_org_admin ON public.granta_users;
CREATE POLICY granta_users_select_org_admin ON public.granta_users
  FOR SELECT TO authenticated
  USING (org_id IS NOT NULL AND public.granta_is_org_admin(org_id));

DROP POLICY IF EXISTS granta_users_operator_all ON public.granta_users;
CREATE POLICY granta_users_operator_all ON public.granta_users
  FOR ALL TO authenticated
  USING      (public.granta_is_operator())
  WITH CHECK (public.granta_is_operator());


-- ---------------------------------------------------------------------------
-- 4.3 — granta_leads   🔴 נקודת החשיפה היחידה
-- ---------------------------------------------------------------------------
-- כתיבה: פתוחה לכל אחד (הטופס הציבורי /check), עם ולידציה בסיסית.
-- קריאה: אופרייטור בלבד. אין policy SELECT ל-anon ואין לעמותה.
-- הגבלת עמודות ל-anon נעשית ב-GRANT ברמת עמודה (§5) — RLS לא יודע להגביל
-- עמודות. אבל ל-authenticated יש GRANT מלא, ולכן ה-WITH CHECK כאן גם *אוכף*
-- שהשדות של המנוע והאופרייטור נשארים ריקים בהגשה — אחרת משתמש מחובר
-- (למשל נציג עמותה אחרת) היה מזריק ליד עם פסיקה או ציון מזויפים.
-- אופרייטור עוקף את המגבלה דרך granta_leads_operator_all (policies מתחברות ב-OR).
DROP POLICY IF EXISTS granta_leads_insert_public ON public.granta_leads;
CREATE POLICY granta_leads_insert_public ON public.granta_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(COALESCE(org_name, '')) BETWEEN 2 AND 200
    AND char_length(email) <= 320
    AND email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
    AND char_length(COALESCE(website, '')) <= 500
    -- שדות המנוע/האופרייטור חייבים להישאר בברירת המחדל בהגשה ציבורית
    AND eligibility_score IS NULL
    AND verdict           IS NULL
    AND responded_at      IS NULL
    AND org_id            IS NULL
    AND notes             IS NULL
    AND status = 'new'
    -- שעון ה-SLA לא נדחק קדימה כדי להתחמק מתיבת הלידים
    AND sla_due_at <= now() + INTERVAL '24 hours'
  );

DROP POLICY IF EXISTS granta_leads_operator_all ON public.granta_leads;
CREATE POLICY granta_leads_operator_all ON public.granta_leads
  FOR ALL TO authenticated
  USING      (public.granta_is_operator())
  WITH CHECK (public.granta_is_operator());


-- ---------------------------------------------------------------------------
-- 4.4 — granta_eligibility_checks
-- ---------------------------------------------------------------------------
-- עמותה: קוראת בדיקות של התיק שלה בלבד. כתיבה — לא.
-- אנונימי: כלום. דף התוצאה A2 מקבל את הפסיקה מתשובת ה-Edge Function,
--          לא מקריאה ישירה לטבלה — אחרת ניחוש id היה חושף לידים של אחרים.
-- כתיבת המנוע נעשית ב-service_role (עוקף RLS).
DROP POLICY IF EXISTS granta_elig_select_own_org ON public.granta_eligibility_checks;
CREATE POLICY granta_elig_select_own_org ON public.granta_eligibility_checks
  FOR SELECT TO authenticated
  USING (org_id IS NOT NULL AND org_id IN (SELECT public.granta_my_org_ids()));

DROP POLICY IF EXISTS granta_elig_operator_all ON public.granta_eligibility_checks;
CREATE POLICY granta_elig_operator_all ON public.granta_eligibility_checks
  FOR ALL TO authenticated
  USING      (public.granta_is_operator())
  WITH CHECK (public.granta_is_operator());


-- ---------------------------------------------------------------------------
-- 4.5 — granta_audit_log   🔴 APPEND-ONLY
-- ---------------------------------------------------------------------------
-- קריאה: העמותה את היומן שלה (מסך B6) · אופרייטור הכול.
-- כתיבה: INSERT בלבד, ורק שורה שמעידה על עצמה נכון —
--        עמותה חותמת actor_kind='org' עם ה-uid שלה ועל התיק שלה;
--        אופרייטור חותם actor_kind='operator' עם ה-uid שלו.
--        actor_kind='system' נכתב רק ב-service_role (Edge Functions / pg_cron).
-- 🔴 אין ואסור שיהיו policies ל-UPDATE או ל-DELETE. ראו גם §5 (REVOKE)
--    ואת הטריגר trg_granta_audit_log_append_only.
DROP POLICY IF EXISTS granta_audit_select_own_org ON public.granta_audit_log;
CREATE POLICY granta_audit_select_own_org ON public.granta_audit_log
  FOR SELECT TO authenticated
  USING (org_id IS NOT NULL AND org_id IN (SELECT public.granta_my_org_ids()));

DROP POLICY IF EXISTS granta_audit_select_operator ON public.granta_audit_log;
CREATE POLICY granta_audit_select_operator ON public.granta_audit_log
  FOR SELECT TO authenticated
  USING (public.granta_is_operator());

DROP POLICY IF EXISTS granta_audit_insert_org ON public.granta_audit_log;
CREATE POLICY granta_audit_insert_org ON public.granta_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_kind = 'org'
    AND actor_id = auth.uid()
    AND org_id IS NOT NULL
    AND org_id IN (SELECT public.granta_my_org_ids())
  );

DROP POLICY IF EXISTS granta_audit_insert_operator ON public.granta_audit_log;
CREATE POLICY granta_audit_insert_operator ON public.granta_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    public.granta_is_operator()
    AND actor_kind = 'operator'
    AND actor_id = auth.uid()
  );

-- ❌ בכוונה: אין granta_audit_*_update ואין granta_audit_*_delete.
--    RLS דוחה כל UPDATE/DELETE כשאין policy מתאימה.
--    לניקוי אחרי הרצה קודמת, אם היה כזה:
DROP POLICY IF EXISTS granta_audit_update_operator ON public.granta_audit_log;
DROP POLICY IF EXISTS granta_audit_delete_operator ON public.granta_audit_log;


-- ============================================================================
-- 5. GRANTS — הידוק ברמת הטבלה והעמודה
-- ============================================================================
-- ב-Supabase יש ALTER DEFAULT PRIVILEGES שמעניק ALL על טבלאות חדשות ב-public
-- ל-anon/authenticated. לכן שוללים במפורש את מה שלא רוצים,
-- ולא מסתמכים רק על RLS.

-- 5.1 — anon לא נוגע בשום טבלה, למעט הזרקת ליד מהטופס הציבורי
REVOKE ALL ON public.granta_orgs               FROM anon;
REVOKE ALL ON public.granta_users              FROM anon;
REVOKE ALL ON public.granta_leads              FROM anon;
REVOKE ALL ON public.granta_eligibility_checks FROM anon;
REVOKE ALL ON public.granta_audit_log          FROM anon;

-- 5.2 — 🔴 anon: INSERT על שדות הטופס בלבד. אין SELECT.
--       בלי ההגבלה הזאת אנונימי היה מזריק ציון/פסיקה/סטטוס/הערות פנימיות.
--       ℹ️ הלקוח חייב לשלוח Prefer: return=minimal — אין לו SELECT להחזרת השורה.
GRANT INSERT (
  org_name, website, email, has_grants,
  source, utm_source, utm_medium, utm_campaign, utm_term, utm_content, referrer
) ON public.granta_leads TO anon;

-- 5.3 — 🔴 granta_audit_log: אין UPDATE ואין DELETE לאף תפקיד.
--       כולל service_role — מסמך האמון לא ניתן לשכתוב גם מהשרת.
REVOKE UPDATE, DELETE, TRUNCATE ON public.granta_audit_log FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON public.granta_audit_log FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE ON public.granta_audit_log FROM authenticated;
REVOKE UPDATE, DELETE, TRUNCATE ON public.granta_audit_log FROM service_role;
GRANT  SELECT, INSERT ON public.granta_audit_log TO authenticated;   -- RLS מסנן
GRANT  SELECT, INSERT ON public.granta_audit_log TO service_role;

-- 5.4 — פונקציות העזר
GRANT EXECUTE ON FUNCTION public.granta_is_operator()      TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.granta_my_org_ids()       TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.granta_is_org_admin(UUID) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.granta_is_operator()      FROM anon;
REVOKE EXECUTE ON FUNCTION public.granta_my_org_ids()       FROM anon;
REVOKE EXECUTE ON FUNCTION public.granta_is_org_admin(UUID) FROM anon;


-- ============================================================================
-- DONE.
-- ============================================================================
-- אימות מהיר אחרי הרצה:
--
--   -- 1. RLS דלוק על כל החמש (חמש שורות, relrowsecurity = true):
--   SELECT relname, relrowsecurity FROM pg_class
--    WHERE relname LIKE 'granta%' AND relkind = 'r';
--
--   -- 2. אין policy של UPDATE/DELETE על היומן (צריך להחזיר 0 שורות):
--   SELECT policyname, cmd FROM pg_policies
--    WHERE tablename = 'granta_audit_log' AND cmd IN ('UPDATE', 'DELETE');
--
--   -- 3. הטריגר חוסם בפועל (צריך לזרוק שגיאה 42501):
--   -- UPDATE public.granta_audit_log SET action = 'x';
--
-- הבא בתור: מיגרציה לטבלאות התפעול (accounts, snapshots, campaigns, adgroups,
--           ads, keywords, policy_rules, findings, actions, alerts, reports,
--           documents, submission_steps) — SPEC §4.
-- ============================================================================
