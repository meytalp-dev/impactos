-- ============================================================================
-- Avnei Yesod Cloud · Migration 0008 — Pulse backend (מסלול מנהלת · גל 2)
-- ============================================================================
-- Created: 2026-07-12
-- Why:
--   עד כה לפולס (רווחה חברתית-רגשית) לא היה בקאנד כלל —
--   pulse-questionnaire.html שמר הכל ב-localStorage ('pulse-demo-responses').
--   כדי לחבר את "פולס בית-ספרי" ו"מבט משולב" (למידה × רגש) לענן, נדרשת
--   דאטת-פולס אמיתית, מאוחדת על אותם students/classes של אבני יסוד.
--   מוסיפים:
--     1. טבלת pulse_responses (flat, בסגנון events) — שורה פר-הגשה,
--        answers JSONB {dimension: score}. respondent ∈ student/teacher/parent.
--     2. students.parent_token — קרדנציאל-כתיבה להורה (עמוד חודשי נפרד).
--     3. RLS: מורה רואה+כותבת לתלמידי-כיתתה · מנהלת רואה את כל בית-הספר
--        (דרך principal_student_ids() מ-0007, בלי רקורסיה).
--     4. RPC ingest_pulse_response(token,...) — כתיבת ילד/הורה ללא auth
--        (בסגנון ingest_student_event מ-0001 §5.1).
--
-- How to run: Supabase Dashboard → SQL Editor → הדביקי את כל הקובץ → Run.
-- Idempotent: IF NOT EXISTS / DROP POLICY IF EXISTS / CREATE OR REPLACE.
-- ============================================================================


-- ============================================================================
-- 1. students.parent_token — קרדנציאל-כתיבה להורה (פולס הורים חודשי, פיילוט)
-- ============================================================================
-- דומה ל-students.token של הילד.ה, אבל מסלול נפרד: ההורה מקבל.ת קישור ייעודי
-- (pulse-parent-monthly.html?ptoken=...) וכותב.ת דרך ingest_pulse_response עם
-- respondent='parent'. מפרידים כדי שקישור-הורה לא יוכל להתחזות לילד.ה ולהיפך.
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS parent_token TEXT UNIQUE DEFAULT gen_random_uuid()::text;

-- מילוי לרשומות קיימות שנוצרו לפני העמודה (DEFAULT חל רק על INSERT חדש)
UPDATE public.students SET parent_token = gen_random_uuid()::text
  WHERE parent_token IS NULL;

CREATE INDEX IF NOT EXISTS students_parent_token_idx ON public.students(parent_token);
COMMENT ON COLUMN public.students.parent_token IS
  'קרדנציאל-כתיבה להורה (פולס חודשי). נפרד מ-token של הילד.ה.';


-- ============================================================================
-- 2. טבלת pulse_responses — שורה פר-הגשת-פולס (flat, בסגנון events)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pulse_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  respondent    TEXT NOT NULL CHECK (respondent IN ('student', 'teacher', 'parent')),
  cycle         TEXT NOT NULL,                        -- מזהה מחזור: '2026-W28' (דו-שבועי) / '2026-07' (חודשי)
  answers       JSONB NOT NULL DEFAULT '{}'::jsonb,   -- {dimension: score} · CASEL hidden · ניקוד 1-3
  taken_at      TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS pulse_student_time_idx ON public.pulse_responses(student_id, taken_at DESC);
CREATE INDEX IF NOT EXISTS pulse_resp_cycle_idx   ON public.pulse_responses(respondent, cycle);
COMMENT ON TABLE public.pulse_responses IS
  'תשובת פולס (רווחה חברתית-רגשית). שורה פר-הגשה. answers={dim:score}.';


-- ============================================================================
-- 3. RLS — מורה: תלמידי-כיתתה (קריאה+כתיבה) · מנהלת: כל בית-הספר (קריאה)
-- ============================================================================
ALTER TABLE public.pulse_responses ENABLE ROW LEVEL SECURITY;

-- 3.1 — מורה קוראת את הפולס של תלמידי-כיתותיה (דפוס students_select_own מ-0001)
DROP POLICY IF EXISTS pulse_select_own ON public.pulse_responses;
CREATE POLICY pulse_select_own ON public.pulse_responses
  FOR SELECT USING (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.classes c ON c.id = s.class_id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- 3.2 — מנהלת רואה את כל בית-הספר (דפוס 0007 §4.5, דרך SECURITY DEFINER)
DROP POLICY IF EXISTS pulse_select_principal ON public.pulse_responses;
CREATE POLICY pulse_select_principal ON public.pulse_responses
  FOR SELECT USING (student_id IN (SELECT public.principal_student_ids()));

-- 3.3 — מורה כותבת פולס-מורה לתלמידי-כיתתה (respondent='teacher')
DROP POLICY IF EXISTS pulse_insert_teacher ON public.pulse_responses;
CREATE POLICY pulse_insert_teacher ON public.pulse_responses
  FOR INSERT WITH CHECK (
    respondent = 'teacher'
    AND student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.classes c ON c.id = s.class_id
      WHERE c.teacher_id = auth.uid()
    )
  );
-- כתיבת ילד.ה/הורה עוברת דרך ה-RPC (SECURITY DEFINER), לא דרך policy זו.


-- ============================================================================
-- 4. RPC — כתיבת פולס של ילד.ה/הורה (ללא auth, token-based)
-- ============================================================================
-- respondent='student' → מזוהה מול students.token · 'parent' → parent_token.
-- מונע התחזות: קישור-הורה לא יכול לכתוב כ-student ולהיפך.
CREATE OR REPLACE FUNCTION public.ingest_pulse_response(
  p_token       TEXT,
  p_respondent  TEXT,
  p_cycle       TEXT,
  p_answers     JSONB,
  p_taken_at    TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_pulse_id   UUID;
BEGIN
  IF p_respondent = 'student' THEN
    SELECT id INTO v_student_id
    FROM public.students WHERE token = p_token AND active = TRUE;
  ELSIF p_respondent = 'parent' THEN
    SELECT id INTO v_student_id
    FROM public.students WHERE parent_token = p_token AND active = TRUE;
  ELSE
    RAISE EXCEPTION 'ingest_pulse_response: respondent must be student or parent (teacher writes via RLS)'
      USING ERRCODE = '22023';
  END IF;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or revoked pulse token' USING ERRCODE = '28000';
  END IF;

  INSERT INTO public.pulse_responses (student_id, respondent, cycle, answers, taken_at)
  VALUES (v_student_id, p_respondent, p_cycle, COALESCE(p_answers, '{}'::jsonb), p_taken_at)
  RETURNING id INTO v_pulse_id;

  RETURN v_pulse_id;
END;
$$;


-- ============================================================================
-- 5. הרשאות
-- ============================================================================
-- ילד.ה/הורה כותבים ללא כניסה (anon), בדיוק כמו ingest_student_event.
GRANT EXECUTE ON FUNCTION public.ingest_pulse_response(TEXT, TEXT, TEXT, JSONB, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION public.ingest_pulse_response(TEXT, TEXT, TEXT, JSONB, TIMESTAMPTZ) TO authenticated;


-- ============================================================================
-- DONE.
-- אימות מהיר (ב-SQL Editor / smoke-test):
--   -- כתיבת ילד.ה (עם token של תלמיד.ה קיים.ת):
--   SELECT public.ingest_pulse_response(
--     '<student-token>', 'student', '2026-W28',
--     '{"adjust":3,"friend":2,"emotion":1,"joy":3}'::jsonb, NOW());
--   -- מנהלת אמורה לראות את השורה:
--   SELECT * FROM public.pulse_responses;   -- אחרי כניסה כמנהלת בית-הספר
-- ============================================================================
