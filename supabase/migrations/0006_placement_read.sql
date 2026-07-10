-- ============================================================================
-- Avnei Yesod Cloud · Migration 0006 — get_student_profile מחזיר גם את ההצבה
-- ============================================================================
-- Created: 2026-07-10
-- Why: הילד.ה פותח.ת את student.html?token=… . כדי שההצבה שהמורה אישרה
--      (students.start_island, מיגרציה 0005) תקבע את אי-הפתיחה במפה, האפליקציה
--      צריכה לקרוא אותה ב-token. מרחיבים את get_student_profile (SECURITY DEFINER,
--      כבר מורשה ל-anon) להחזיר גם start_island + placement_confirmed.
--
-- How to run: Supabase Dashboard → SQL Editor → הדביקי → Run.
-- בטוח: boy-check/student קוראים לפי שם-שדה — הוספת עמודות לא שוברת.
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_student_profile(TEXT);

CREATE FUNCTION public.get_student_profile(p_token TEXT)
RETURNS TABLE(
  student_id          UUID,
  student_name        TEXT,
  class_name          TEXT,
  start_island        INT,
  placement_confirmed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.name, c.name, s.start_island, s.placement_confirmed
  FROM public.students s
  JOIN public.classes c ON s.class_id = c.id
  WHERE s.token = p_token AND s.active = TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_profile TO anon;

-- ============================================================================
-- DONE. אימות: SELECT * FROM get_student_profile('<token>');
--       אמור להחזיר גם start_island + placement_confirmed.
-- ============================================================================
