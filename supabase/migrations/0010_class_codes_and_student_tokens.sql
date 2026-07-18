-- ============================================================================
-- Avnei Yesod Cloud · Migration 0010 — קוד-פר-כיתה + קוד/טוקן-פר-תלמיד + RPCs
-- ============================================================================
-- Created: 2026-07-18
-- Why:
--   אשף ההקמה (setup.html) עובד במודל "שרשרת" שאושר ע"י מיטל:
--     מנהלת בונה כיתות+מורות (כל כיתה = קוד משלה, לפני שיש חשבון-מורה) →
--     מורה נכנסת עם קוד-הכיתה שלה (המערכת מזהה שם-כיתה+שם-מורה) →
--     מורה מוסיפה תלמידים → לכל תלמיד קוד-QR משלו.
--
--   הסכמה הקיימת (0001+0007) לא תומכת בזה:
--     • classes.teacher_id הוא NOT NULL — אבל המנהלת יוצרת כיתה בלי מורה.
--     • אין classes.join_code / teacher_name / school_id.
--     • הכיתה מקושרת לבי"ס רק דרך המורה (JOIN על teacher_id) — כיתה בלי-מורה
--       לא תיראה למנהלת.
--     • אין קוד-טקסט קצר פר-תלמיד (יש רק token UUID, לא ידידותי להקלדה).
--
--   מה זה עושה (תוספתי בלבד — לא שובר נתוני פיילוט קיימים):
--     1. classes: teacher_id → nullable; + school_id, teacher_name, join_code.
--     2. students: + join_code קצר (טריגר ממלא אוטומטית). token נשאר לכניסה.
--     3. principal_class_ids(): סקופ לפי classes.school_id ישירות
--        (מכסה כיתות בלי-מורה) + fallback ליישן (דרך teacher_id).
--     4. RLS: מנהלת רואה/מנהלת כיתות בי"ס שלה; מורה נכנסת ומקושרת.
--     5. RPCs: create_class · join_class · resolve_class · resolve_student.
--
-- How to run: Supabase Dashboard → SQL Editor → הדביקי את כל הקובץ → Run.
-- Idempotent: IF NOT EXISTS / DROP ... IF EXISTS / CREATE OR REPLACE — בטוח
--             להריץ שוב.
-- ============================================================================


-- ============================================================================
-- 1. classes — teacher_id nullable + school_id + teacher_name + join_code
-- ============================================================================

-- 1.1 — teacher_id nullable (מנהלת יוצרת כיתה לפני שיש חשבון-מורה)
ALTER TABLE public.classes ALTER COLUMN teacher_id DROP NOT NULL;

-- 1.2 — עמודות חדשות
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS school_id     UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS teacher_name  TEXT,
  ADD COLUMN IF NOT EXISTS join_code     TEXT;

-- 1.3 — join_code ייחודי (index חלקי; NULL מותר בכיתות ישנות)
CREATE UNIQUE INDEX IF NOT EXISTS classes_join_code_uidx
  ON public.classes(join_code) WHERE join_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS classes_school_id_idx ON public.classes(school_id);

COMMENT ON COLUMN public.classes.school_id    IS 'בית הספר של הכיתה (קישור ישיר, לא רק דרך המורה)';
COMMENT ON COLUMN public.classes.teacher_name IS 'שם המורה שהמנהלת הזינה, לפני שיש teacher_id';
COMMENT ON COLUMN public.classes.join_code    IS 'קוד-כיתה ייחודי (CL-XXXX) שהמורה מזינה בהרשמה';


-- ============================================================================
-- 2. students — join_code קצר (QR מקודד token ישירות; join_code = גיבוי-הקלדה)
-- ============================================================================
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS join_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS students_join_code_uidx
  ON public.students(join_code) WHERE join_code IS NOT NULL;

COMMENT ON COLUMN public.students.join_code IS
  'קוד-טקסט קצר (S-XXXXX) לכניסה בהקלדה כשה-QR לא נסרק. ה-token נשאר מזהה-הכניסה.';

-- 2.1 — טריגר: ממלא join_code אם חסר (BEFORE INSERT)
CREATE OR REPLACE FUNCTION public.fill_student_join_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.join_code IS NULL OR TRIM(NEW.join_code) = '' THEN
    LOOP
      NEW.join_code := 'S-' || UPPER(SUBSTR(MD5(gen_random_uuid()::text), 1, 5));
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.students WHERE public.students.join_code = NEW.join_code
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS students_fill_join_code ON public.students;
CREATE TRIGGER students_fill_join_code
  BEFORE INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.fill_student_join_code();

-- 2.2 — backfill לכיתות/תלמידים ישנים בלי join_code
UPDATE public.students
SET join_code = 'S-' || UPPER(SUBSTR(MD5(gen_random_uuid()::text || id::text), 1, 5))
WHERE join_code IS NULL;


-- ============================================================================
-- 3. principal_class_ids() — סקופ לפי school_id ישירות (כולל כיתות בלי-מורה)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.principal_class_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  -- דרך א' (חדש): קישור ישיר class.school_id — מכסה כיתות שנוצרו ע"י המנהלת
  -- לפני שיש מורה משויכת.
  SELECT c.id
  FROM public.classes c
  WHERE public.my_role() = 'principal'
    AND public.my_school() IS NOT NULL
    AND c.school_id = public.my_school()
  UNION
  -- דרך ב' (יישן, תאימות-לאחור): קישור דרך המורה (כיתות שקדמו ל-school_id).
  SELECT c.id
  FROM public.classes c
  JOIN public.teachers t ON c.teacher_id = t.id
  WHERE public.my_role() = 'principal'
    AND public.my_school() IS NOT NULL
    AND t.school_id = public.my_school();
$$;


-- ============================================================================
-- 4. RLS — מנהלת מנהלת כיתות בי"ס שלה; תלמידים דרך כיתות המנהלת
-- ============================================================================

-- 4.1 — classes: מנהלת יכולה גם INSERT/UPDATE (בנוסף ל-SELECT מ-0007).
--       (create_class הוא SECURITY DEFINER ולא תלוי בזה, אבל שומרים עקביות.)
DROP POLICY IF EXISTS classes_insert_principal ON public.classes;
CREATE POLICY classes_insert_principal ON public.classes
  FOR INSERT WITH CHECK (
    public.my_role() = 'principal'
    AND school_id IS NOT NULL
    AND school_id = public.my_school()
  );

DROP POLICY IF EXISTS classes_update_principal ON public.classes;
CREATE POLICY classes_update_principal ON public.classes
  FOR UPDATE USING (id IN (SELECT public.principal_class_ids()));

-- 4.2 — students: מנהלת יכולה INSERT (בנוסף לזו של המורה מ-0001).
DROP POLICY IF EXISTS students_insert_principal ON public.students;
CREATE POLICY students_insert_principal ON public.students
  FOR INSERT WITH CHECK (class_id IN (SELECT public.principal_class_ids()));

DROP POLICY IF EXISTS students_update_principal ON public.students;
CREATE POLICY students_update_principal ON public.students
  FOR UPDATE USING (class_id IN (SELECT public.principal_student_ids()));


-- ============================================================================
-- 5. RPCs — create_class · join_class · resolve_class · resolve_student
-- ============================================================================

-- 5.1 — מנהלת יוצרת כיתה (בלי מורה עדיין) → מקבלת join_code ייחודי
CREATE OR REPLACE FUNCTION public.create_class(
  p_name         TEXT,
  p_teacher_name TEXT
)
RETURNS TABLE(class_id UUID, join_code TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid    UUID := auth.uid();
  v_school UUID := public.my_school();
  v_code   TEXT;
  v_id     UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;
  IF public.my_role() <> 'principal' OR v_school IS NULL THEN
    RAISE EXCEPTION 'only a principal with a school can create classes' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(TRIM(p_name), '') = '' THEN
    RAISE EXCEPTION 'class name required';
  END IF;

  -- קוד קריא וייחודי: CL-XXXX
  LOOP
    v_code := 'CL-' || UPPER(SUBSTR(MD5(gen_random_uuid()::text), 1, 4));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.classes WHERE public.classes.join_code = v_code);
  END LOOP;

  INSERT INTO public.classes (name, teacher_id, school_id, teacher_name, join_code)
  VALUES (TRIM(p_name), NULL, v_school, NULLIF(TRIM(COALESCE(p_teacher_name,'')),''), v_code)
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, v_code;
END;
$$;

-- 5.2 — מורה מצטרפת לכיתה לפי קוד → teacher_id=auth.uid() + teachers.school_id
CREATE OR REPLACE FUNCTION public.join_class(p_code TEXT)
RETURNS TABLE(class_id UUID, class_name TEXT, teacher_name TEXT, school_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      UUID := auth.uid();
  v_class    public.classes%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_class
  FROM public.classes
  WHERE public.classes.join_code = UPPER(TRIM(p_code));

  IF v_class.id IS NULL THEN
    RAISE EXCEPTION 'invalid class code' USING ERRCODE = 'P0002';
  END IF;

  -- כיתה כבר תפוסה ע"י מורה אחרת → חסימה (אלא אם זו אותה מורה, idempotent)
  IF v_class.teacher_id IS NOT NULL AND v_class.teacher_id <> v_uid THEN
    RAISE EXCEPTION 'class already claimed by another teacher' USING ERRCODE = '42501';
  END IF;

  UPDATE public.classes
  SET teacher_id = v_uid
  WHERE id = v_class.id;

  -- לשייך את המורה לבית-הספר של הכיתה (אם עדיין לא משויכת)
  UPDATE public.teachers
  SET school_id = COALESCE(school_id, v_class.school_id)
  WHERE id = v_uid;

  RETURN QUERY
  SELECT v_class.id, v_class.name, v_class.teacher_name,
         (SELECT s.name FROM public.schools s WHERE s.id = v_class.school_id);
END;
$$;

-- 5.3 — אישור-תצוגה לפני הרשמה: מי הכיתה מאחורי הקוד (anon)
CREATE OR REPLACE FUNCTION public.resolve_class(p_code TEXT)
RETURNS TABLE(class_name TEXT, teacher_name TEXT, school_name TEXT, is_claimed BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT c.name, c.teacher_name,
         (SELECT s.name FROM public.schools s WHERE s.id = c.school_id),
         (c.teacher_id IS NOT NULL)
  FROM public.classes c
  WHERE c.join_code = UPPER(TRIM(p_code));
END;
$$;

-- 5.4 — כניסת-תלמיד מ-QR/הקלדה: קוד קצר → token (anon)
CREATE OR REPLACE FUNCTION public.resolve_student(p_code TEXT)
RETURNS TABLE(token TEXT, student_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.token, s.name
  FROM public.students s
  WHERE s.join_code = UPPER(TRIM(p_code)) AND s.active = TRUE;
END;
$$;


-- ============================================================================
-- 6. הרשאות
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.create_class(TEXT, TEXT)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_class(TEXT)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_class(TEXT)       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_student(TEXT)     TO anon, authenticated;


-- ============================================================================
-- DONE.
-- אימות מהיר (ב-SQL Editor):
--   -- כמנהלת מחוברת (עם school דרך create_school):
--   SELECT * FROM public.create_class('א׳1', 'רמה לוי');   -- → class_id + CL-XXXX
--   SELECT * FROM public.resolve_class('CL-XXXX');          -- → {א׳1, רמה לוי, ...}
--   SELECT * FROM public.classes;                           -- מנהלת רואה את כל כיתות בי"ס
--   -- כמורה מחוברת:
--   SELECT * FROM public.join_class('CL-XXXX');             -- משייך אותה לכיתה
--   -- אחרי הוספת תלמיד:
--   SELECT id, name, join_code FROM public.students;        -- S-XXXXX אוטומטי
--   SELECT * FROM public.resolve_student('S-XXXXX');        -- → token
-- ============================================================================
