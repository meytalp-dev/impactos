-- ============================================================================
-- Avnei Yesod Cloud Backend · Migration 0001 — Initial Schema
-- ============================================================================
-- Created: 2026-06-01
-- Project: impact-os-avnei-yesod
-- Region: eu-central-1 (Frankfurt)
--
-- What this does:
--   1. Create 6 tables: teachers, classes, students, events, bkt_state, assessments
--   2. Enable Row Level Security (RLS) on all tables
--   3. Create RLS policies — each teacher sees only own classes/students
--   4. Create RPCs for student-side writes (no auth, token-based)
--   5. Create trigger: when new auth.users row is created, mirror to teachers
--
-- How to run:
--   Option A (recommended for first install):
--     - Open Supabase Dashboard → SQL Editor
--     - Paste this entire file
--     - Click "Run"
--   Option B (CLI, advanced):
--     - npx supabase login
--     - npx supabase link --project-ref ynxfszmpoppqrqocewcs
--     - npx supabase db push
--
-- Idempotent: Re-running is safe (uses CREATE IF NOT EXISTS where possible
--             and DROP/RECREATE for policies and functions).
-- ============================================================================


-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- 2.1 — teachers: mirrors auth.users for app data
CREATE TABLE IF NOT EXISTS public.teachers (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.teachers IS 'Each row is a teacher account (1:1 with auth.users)';

-- 2.2 — classes: one teacher → many classes (current convention: 1 class per teacher)
CREATE TABLE IF NOT EXISTS public.classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  teacher_id  UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS classes_teacher_id_idx ON public.classes(teacher_id);

-- 2.3 — students: token-based identity, no password
CREATE TABLE IF NOT EXISTS public.students (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  class_id    UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS students_class_id_idx ON public.students(class_id);
CREATE INDEX IF NOT EXISTS students_token_idx    ON public.students(token);

-- 2.4 — events: flat events table, indexed by student
CREATE TABLE IF NOT EXISTS public.events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  event_type          TEXT NOT NULL,
  payload             JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_timestamp    TIMESTAMPTZ NOT NULL,
  server_received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS events_student_time_idx ON public.events(student_id, client_timestamp DESC);
CREATE INDEX IF NOT EXISTS events_student_type_idx ON public.events(student_id, event_type);

-- 2.5 — bkt_state: single row per student (legacy + strand)
CREATE TABLE IF NOT EXISTS public.bkt_state (
  student_id  UUID PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  legacy_bkt  JSONB NOT NULL DEFAULT '{}'::jsonb,
  strand_bkt  JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 — assessments: MOY/BOY/EOY
CREATE TABLE IF NOT EXISTS public.assessments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  assessment_type   TEXT NOT NULL CHECK (assessment_type IN ('BOY', 'MOY', 'EOY')),
  payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
  taken_at          TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS assessments_student_type_idx ON public.assessments(student_id, assessment_type);


-- ============================================================================
-- 3. AUTO-MIRROR AUTH.USERS → TEACHERS
-- ============================================================================
-- When a teacher signs up (or admin creates user), automatically create a
-- row in public.teachers. The teacher's name defaults to email's local part;
-- they can edit it later via teacher-setup.html.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.teachers (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.teachers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bkt_state   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4.1 — teachers: each sees/updates own row only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS teachers_select_self ON public.teachers;
CREATE POLICY teachers_select_self ON public.teachers
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS teachers_update_self ON public.teachers;
CREATE POLICY teachers_update_self ON public.teachers
  FOR UPDATE USING (id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4.2 — classes: teacher sees/manages own classes
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS classes_select_own ON public.classes;
CREATE POLICY classes_select_own ON public.classes
  FOR SELECT USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS classes_insert_own ON public.classes;
CREATE POLICY classes_insert_own ON public.classes
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS classes_update_own ON public.classes;
CREATE POLICY classes_update_own ON public.classes
  FOR UPDATE USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS classes_delete_own ON public.classes;
CREATE POLICY classes_delete_own ON public.classes
  FOR DELETE USING (teacher_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4.3 — students: teacher sees/manages students of own classes
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS students_select_own ON public.students;
CREATE POLICY students_select_own ON public.students
  FOR SELECT USING (
    class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS students_insert_own ON public.students;
CREATE POLICY students_insert_own ON public.students
  FOR INSERT WITH CHECK (
    class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS students_update_own ON public.students;
CREATE POLICY students_update_own ON public.students
  FOR UPDATE USING (
    class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS students_delete_own ON public.students;
CREATE POLICY students_delete_own ON public.students
  FOR DELETE USING (
    class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 4.4 — events: teacher reads events of own students. INSERT done via RPC.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS events_select_own ON public.events;
CREATE POLICY events_select_own ON public.events
  FOR SELECT USING (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4.5 — bkt_state: same scoping as events
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS bkt_select_own ON public.bkt_state;
CREATE POLICY bkt_select_own ON public.bkt_state
  FOR SELECT USING (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4.6 — assessments: same scoping
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS assessments_select_own ON public.assessments;
CREATE POLICY assessments_select_own ON public.assessments
  FOR SELECT USING (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );


-- ============================================================================
-- 5. STUDENT-SIDE RPCs (token-based, no auth)
-- ============================================================================
-- Students don't authenticate. They send a token (from URL ?token=) to
-- these RPCs. The function validates the token and inserts/upserts on behalf
-- of the student. SECURITY DEFINER lets the function bypass RLS for the
-- specific operation while still validating the token.

-- 5.1 — Ingest a single event
CREATE OR REPLACE FUNCTION public.ingest_student_event(
  p_token            TEXT,
  p_event_type       TEXT,
  p_payload          JSONB,
  p_client_timestamp TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_event_id   UUID;
BEGIN
  SELECT id INTO v_student_id
  FROM public.students
  WHERE token = p_token AND active = TRUE;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or revoked student token' USING ERRCODE = '28000';
  END IF;

  INSERT INTO public.events (student_id, event_type, payload, client_timestamp)
  VALUES (v_student_id, p_event_type, p_payload, p_client_timestamp)
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- 5.2 — Get student's BKT state (for sync on app load)
CREATE OR REPLACE FUNCTION public.get_student_bkt(p_token TEXT)
RETURNS TABLE(legacy_bkt JSONB, strand_bkt JSONB, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT b.legacy_bkt, b.strand_bkt, b.updated_at
  FROM public.bkt_state b
  JOIN public.students s ON s.id = b.student_id
  WHERE s.token = p_token AND s.active = TRUE;
END;
$$;

-- 5.3 — Upsert student's BKT state (debounced from client)
CREATE OR REPLACE FUNCTION public.upsert_student_bkt(
  p_token  TEXT,
  p_legacy JSONB,
  p_strand JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
BEGIN
  SELECT id INTO v_student_id
  FROM public.students
  WHERE token = p_token AND active = TRUE;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or revoked student token' USING ERRCODE = '28000';
  END IF;

  INSERT INTO public.bkt_state (student_id, legacy_bkt, strand_bkt, updated_at)
  VALUES (v_student_id, p_legacy, p_strand, NOW())
  ON CONFLICT (student_id) DO UPDATE
  SET legacy_bkt = EXCLUDED.legacy_bkt,
      strand_bkt = EXCLUDED.strand_bkt,
      updated_at = NOW();
END;
$$;

-- 5.4 — Ingest an assessment (MOY/BOY/EOY)
CREATE OR REPLACE FUNCTION public.ingest_student_assessment(
  p_token            TEXT,
  p_assessment_type  TEXT,
  p_payload          JSONB,
  p_taken_at         TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id    UUID;
  v_assessment_id UUID;
BEGIN
  IF p_assessment_type NOT IN ('BOY', 'MOY', 'EOY') THEN
    RAISE EXCEPTION 'Invalid assessment_type: %', p_assessment_type;
  END IF;

  SELECT id INTO v_student_id
  FROM public.students
  WHERE token = p_token AND active = TRUE;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or revoked student token' USING ERRCODE = '28000';
  END IF;

  INSERT INTO public.assessments (student_id, assessment_type, payload, taken_at)
  VALUES (v_student_id, p_assessment_type, p_payload, p_taken_at)
  RETURNING id INTO v_assessment_id;

  RETURN v_assessment_id;
END;
$$;

-- 5.5 — Get student profile (verify token, fetch name/class for UI greeting)
CREATE OR REPLACE FUNCTION public.get_student_profile(p_token TEXT)
RETURNS TABLE(student_id UUID, student_name TEXT, class_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.name, c.name
  FROM public.students s
  JOIN public.classes c ON s.class_id = c.id
  WHERE s.token = p_token AND s.active = TRUE;
END;
$$;


-- ============================================================================
-- 6. PERMISSIONS — Grant RPCs to anon role (these validate token internally)
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.ingest_student_event       TO anon;
GRANT EXECUTE ON FUNCTION public.get_student_bkt            TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_student_bkt         TO anon;
GRANT EXECUTE ON FUNCTION public.ingest_student_assessment  TO anon;
GRANT EXECUTE ON FUNCTION public.get_student_profile        TO anon;

-- Authenticated teachers use direct SELECT/INSERT via PostgREST (RLS enforces scoping)
-- No additional GRANTs needed since RLS is the gatekeeper.


-- ============================================================================
-- DONE.
-- ============================================================================
-- Next steps:
--   1. Verify in SQL Editor: SELECT * FROM teachers; (should be empty initially)
--   2. Add a teacher via Auth → Users → Add user. Trigger should auto-mirror.
--   3. SELECT * FROM teachers; — should show the new teacher.
--   4. Continue with client code.
-- ============================================================================
