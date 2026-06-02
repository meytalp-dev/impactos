-- ============================================================================
-- Avnei Yesod Cloud Backend · Migration 0002 — Student Targets (Send Practice)
-- ============================================================================
-- Created: 2026-06-02
--
-- What this does:
--   1. Create student_targets table (teacher pushes practice items to a student)
--   2. RLS: teacher manages targets of own students; student reads own via RPC
--   3. RPCs: get_student_targets(token) · complete_student_target(token, id)
--
-- How to run: SQL Editor → paste → Run.  (Idempotent.)
-- ============================================================================


-- ============================================================================
-- 1. TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.student_targets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  unit_data    JSONB NOT NULL,                -- the SkillUnit object (type, id, letter, ...)
  source       TEXT,                          -- 'teacher-send-solo' · 'auto-weak' etc.
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ                    -- NULL while active
);
CREATE INDEX IF NOT EXISTS student_targets_student_idx
  ON public.student_targets(student_id, completed_at);

COMMENT ON TABLE public.student_targets IS
  'Teacher-assigned practice items pushed to a student. Active when completed_at IS NULL.';


-- ============================================================================
-- 2. ROW LEVEL SECURITY (teacher side)
-- ============================================================================
ALTER TABLE public.student_targets ENABLE ROW LEVEL SECURITY;

-- Teacher SELECT — own students' targets
DROP POLICY IF EXISTS targets_select_own ON public.student_targets;
CREATE POLICY targets_select_own ON public.student_targets
  FOR SELECT USING (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- Teacher INSERT — own students' targets
DROP POLICY IF EXISTS targets_insert_own ON public.student_targets;
CREATE POLICY targets_insert_own ON public.student_targets
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- Teacher UPDATE — own students' targets (e.g., cancel)
DROP POLICY IF EXISTS targets_update_own ON public.student_targets;
CREATE POLICY targets_update_own ON public.student_targets
  FOR UPDATE USING (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- Teacher DELETE — own students' targets
DROP POLICY IF EXISTS targets_delete_own ON public.student_targets;
CREATE POLICY targets_delete_own ON public.student_targets
  FOR DELETE USING (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.classes c ON s.class_id = c.id
      WHERE c.teacher_id = auth.uid()
    )
  );


-- ============================================================================
-- 3. STUDENT-SIDE RPCs (token-based)
-- ============================================================================

-- 3.1 — Get active targets for a student
CREATE OR REPLACE FUNCTION public.get_student_targets(p_token TEXT)
RETURNS TABLE(id UUID, unit_data JSONB, source TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
BEGIN
  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.token = p_token AND s.active = TRUE;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or revoked student token' USING ERRCODE = '28000';
  END IF;

  RETURN QUERY
  SELECT t.id, t.unit_data, t.source, t.created_at
  FROM public.student_targets t
  WHERE t.student_id = v_student_id
    AND t.completed_at IS NULL
  ORDER BY t.created_at;
END;
$$;

-- 3.2 — Mark a target as completed
CREATE OR REPLACE FUNCTION public.complete_student_target(p_token TEXT, p_target_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
BEGIN
  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.token = p_token AND s.active = TRUE;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or revoked student token' USING ERRCODE = '28000';
  END IF;

  UPDATE public.student_targets
  SET completed_at = NOW()
  WHERE id = p_target_id
    AND student_id = v_student_id
    AND completed_at IS NULL;
END;
$$;


-- ============================================================================
-- 4. PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.get_student_targets      TO anon;
GRANT EXECUTE ON FUNCTION public.complete_student_target  TO anon;


-- ============================================================================
-- DONE.
-- ============================================================================
