-- ============================================================================
-- Avnei Yesod Cloud · Migration 0007 — Schools + Principal role (מסלול מנהלת)
-- ============================================================================
-- Created: 2026-07-12
-- Why:
--   עד כה ה-RLS היה פר-מורה בלבד (0001): כל מורה רואה רק את הכיתה שלה.
--   דשבורד המנהלת דורש מבט חוצה-כיתות של כל בית הספר. מוסיפים:
--     1. טבלת schools + join_code (קוד בית ספר, מודל הקישור המאושר)
--     2. teachers.role ('teacher' | 'principal') + teachers.school_id
--     3. RLS למנהלת: קריאה של כל classes/students/events/bkt/assessments של
--        בית-הספר שלה — כ-policy נוסף (permissive/OR), בלי לגעת בהרשאות המורה.
--     4. RPCs: create_school (מנהלת→קוד) · join_school (מורה→שיוך) · get_my_context
--
-- How to run: Supabase Dashboard → SQL Editor → הדביקי את כל הקובץ → Run.
-- Idempotent: IF NOT EXISTS / DROP POLICY IF EXISTS / CREATE OR REPLACE — בטוח
--             להריץ שוב.
-- ============================================================================


-- ============================================================================
-- 1. טבלת בתי-ספר
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.schools (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  join_code   TEXT NOT NULL UNIQUE,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.schools IS
  'בית ספר. המנהלת יוצרת → מקבלת join_code שהמורות מזינות בהרשמה כדי להשתייך.';


-- ============================================================================
-- 2. הרחבת teachers — role + school_id
-- ============================================================================
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS role       TEXT NOT NULL DEFAULT 'teacher',
  ADD COLUMN IF NOT EXISTS school_id  UUID REFERENCES public.schools(id) ON DELETE SET NULL;

-- אילוץ ערכים חוקיים (idempotent — מוסיפים רק אם חסר)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teachers_role_check'
  ) THEN
    ALTER TABLE public.teachers
      ADD CONSTRAINT teachers_role_check CHECK (role IN ('teacher', 'principal'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS teachers_school_id_idx ON public.teachers(school_id);

COMMENT ON COLUMN public.teachers.role IS 'teacher (ברירת מחדל) | principal';
COMMENT ON COLUMN public.teachers.school_id IS 'בית הספר שאליו משתייך.ת (מנהלת או מורה)';


-- ============================================================================
-- 3. פונקציות-עזר (SECURITY DEFINER) — עוקפות RLS כדי למנוע רקורסיה ב-policies
-- ============================================================================

-- 3.1 — בית-הספר של המשתמש.ת המחובר.ת
CREATE OR REPLACE FUNCTION public.my_school()
RETURNS UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$ SELECT school_id FROM public.teachers WHERE id = auth.uid(); $$;

-- 3.2 — התפקיד של המשתמש.ת המחובר.ת
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$ SELECT role FROM public.teachers WHERE id = auth.uid(); $$;

-- 3.3 — כל הכיתות של בית-הספר, אם המשתמש.ת מנהלת (אחרת ריק)
CREATE OR REPLACE FUNCTION public.principal_class_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT c.id
  FROM public.classes c
  JOIN public.teachers t ON c.teacher_id = t.id
  WHERE public.my_role() = 'principal'
    AND public.my_school() IS NOT NULL
    AND t.school_id = public.my_school();
$$;

-- 3.4 — כל התלמידים של בית-הספר (דרך הכיתות)
CREATE OR REPLACE FUNCTION public.principal_student_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT s.id
  FROM public.students s
  WHERE s.class_id IN (SELECT public.principal_class_ids());
$$;


-- ============================================================================
-- 4. RLS — schools + policies נוספים למנהלת (permissive, מצטרפים ב-OR לקיימים)
-- ============================================================================
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- 4.1 — schools: כל חבר.ת בית-הספר (מורה/מנהלת) קורא.ת את השורה (שם + קוד)
DROP POLICY IF EXISTS schools_select_member ON public.schools;
CREATE POLICY schools_select_member ON public.schools
  FOR SELECT USING (id = public.my_school());

-- 4.2 — teachers: מנהלת רואה את כל המורות בבית-הספר שלה (בנוסף ל-teachers_select_self)
DROP POLICY IF EXISTS teachers_select_school_principal ON public.teachers;
CREATE POLICY teachers_select_school_principal ON public.teachers
  FOR SELECT USING (
    public.my_role() = 'principal'
    AND school_id IS NOT NULL
    AND school_id = public.my_school()
  );

-- 4.3 — classes: מנהלת רואה את כל הכיתות בבית-הספר (בנוסף ל-classes_select_own)
DROP POLICY IF EXISTS classes_select_principal ON public.classes;
CREATE POLICY classes_select_principal ON public.classes
  FOR SELECT USING (id IN (SELECT public.principal_class_ids()));

-- 4.4 — students
DROP POLICY IF EXISTS students_select_principal ON public.students;
CREATE POLICY students_select_principal ON public.students
  FOR SELECT USING (id IN (SELECT public.principal_student_ids()));

-- 4.5 — events
DROP POLICY IF EXISTS events_select_principal ON public.events;
CREATE POLICY events_select_principal ON public.events
  FOR SELECT USING (student_id IN (SELECT public.principal_student_ids()));

-- 4.6 — bkt_state
DROP POLICY IF EXISTS bkt_select_principal ON public.bkt_state;
CREATE POLICY bkt_select_principal ON public.bkt_state
  FOR SELECT USING (student_id IN (SELECT public.principal_student_ids()));

-- 4.7 — assessments
DROP POLICY IF EXISTS assessments_select_principal ON public.assessments;
CREATE POLICY assessments_select_principal ON public.assessments
  FOR SELECT USING (student_id IN (SELECT public.principal_student_ids()));


-- ============================================================================
-- 5. RPCs — יצירת/הצטרפות בית-ספר + הקשר המשתמש.ת
-- ============================================================================

-- 5.1 — מנהלת יוצרת בית ספר → נקבעת כ-principal, מקבלת join_code ייחודי
CREATE OR REPLACE FUNCTION public.create_school(p_school_name TEXT)
RETURNS TABLE(school_id UUID, join_code TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid  UUID := auth.uid();
  v_code TEXT;
  v_id   UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;
  IF COALESCE(TRIM(p_school_name), '') = '' THEN
    RAISE EXCEPTION 'school name required';
  END IF;

  -- קוד קריא וייחודי: AV-XXXXX
  LOOP
    v_code := 'AV-' || UPPER(SUBSTR(MD5(gen_random_uuid()::text), 1, 5));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.schools WHERE public.schools.join_code = v_code);
  END LOOP;

  INSERT INTO public.schools (name, join_code, created_by)
  VALUES (TRIM(p_school_name), v_code, v_uid)
  RETURNING id INTO v_id;

  UPDATE public.teachers
  SET role = 'principal', school_id = v_id
  WHERE id = v_uid;

  RETURN QUERY SELECT v_id, v_code;
END;
$$;

-- 5.2 — מורה מצטרפת לבית ספר לפי קוד → school_id מוגדר (role נשאר 'teacher')
CREATE OR REPLACE FUNCTION public.join_school(p_code TEXT)
RETURNS TABLE(school_id UUID, school_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_id  UUID;
  v_nm  TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT id, name INTO v_id, v_nm
  FROM public.schools
  WHERE public.schools.join_code = UPPER(TRIM(p_code));

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'invalid school code' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.teachers
  SET school_id = v_id
  WHERE id = v_uid;

  RETURN QUERY SELECT v_id, v_nm;
END;
$$;

-- 5.3 — הקשר המשתמש.ת: תפקיד + בית ספר + קוד (לטעינת המסך אחרי כניסה)
CREATE OR REPLACE FUNCTION public.get_my_context()
RETURNS TABLE(role TEXT, school_id UUID, school_name TEXT, join_code TEXT)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT t.role, t.school_id, s.name, s.join_code
  FROM public.teachers t
  LEFT JOIN public.schools s ON s.id = t.school_id
  WHERE t.id = auth.uid();
$$;


-- ============================================================================
-- 6. הרשאות — ה-RPCs זמינים למשתמש.ת מחובר.ת (authenticated)
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.create_school(TEXT)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_school(TEXT)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_context()       TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_school()             TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_role()               TO authenticated;
GRANT EXECUTE ON FUNCTION public.principal_class_ids()   TO authenticated;
GRANT EXECUTE ON FUNCTION public.principal_student_ids() TO authenticated;


-- ============================================================================
-- DONE.
-- אימות מהיר (ב-SQL Editor):
--   SELECT * FROM public.get_my_context();       -- אחרי כניסה כמנהלת
--   SELECT public.create_school('בית ספר אימפקט'); -- מחזיר school_id + code
--   -- כמורה, אחרי join_school('AV-XXXXX'):
--   SELECT * FROM public.classes;  -- מנהלת אמורה לראות את כל כיתות בית-הספר
-- ============================================================================
