-- ============================================================================
-- Avnei Yesod Cloud · Migration 0005 — Placement decision on students
-- ============================================================================
-- Created: 2026-07-10
-- Why: מבדק ה-BOY (assessments) מציע אי-פתיחה; המורה מאשרת/משנה אותו.
--      ההחלטה חייבת להישמר בענן (multi-device). מוסיפים עמודות ל-students —
--      המורה כבר מורשית UPDATE דרך policy students_update_own מ-0001.
--      תואם מבנה הנתונים במפרט §8 (start_island / confirmed_by_teacher).
--
-- How to run: Supabase Dashboard → SQL Editor → הדביקי → Run.
-- Idempotent: ADD COLUMN IF NOT EXISTS — בטוח להריץ שוב.
-- ============================================================================

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS start_island          INT,
  ADD COLUMN IF NOT EXISTS placement_confirmed    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS placement_override      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS placement_decided_at    TIMESTAMPTZ;

COMMENT ON COLUMN public.students.start_island IS
  'אי הפתיחה שהמורה אישרה (עשוי להיות שונה מהצעת ה-BOY = override)';
COMMENT ON COLUMN public.students.placement_confirmed IS
  'TRUE אחרי שהמורה אישרה את ההצבה';

-- ============================================================================
-- DONE. אין צורך ב-policy חדש: students_update_own (מ-0001) כבר מתיר
-- למורה לעדכן תלמידים של הכיתות שלה, כולל העמודות החדשות.
-- אימות: UPDATE public.students SET start_island=4, placement_confirmed=TRUE
--         WHERE id='<student-id>';  ואז SELECT — אמור לראות את הערכים.
-- ============================================================================
