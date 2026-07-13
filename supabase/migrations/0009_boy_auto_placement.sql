-- ============================================================================
-- Avnei Yesod Cloud · Migration 0009 — הצבה אוטומטית מהמיפוי (BOY → start_island)
-- ----------------------------------------------------------------------------
-- עד כה ingest_student_assessment רק תיעד את המבדק (assessments), ואי-הפתיחה
-- שהמיפוי חישב לא נכתב על התלמיד.ה — כך שהרוסטר/מנהלת ראו "לא הוצב.ה" עד שהמורה
-- אישרה ידנית. המיפוי הוא מקור-האמת (ר' spec §1.5), אז מבדק BOY עם placement
-- כותב אוטומטית את start_island + placement_confirmed. המורה עדיין יכולה לשנות
-- (override) — לא דורסים אישור קיים (placement_confirmed = FALSE guard).
--
-- הרצה: Supabase Dashboard → SQL Editor → הדבק → Run.
-- אימות: SELECT start_island, placement_confirmed FROM students WHERE name LIKE 'בדיקה%';
-- ============================================================================

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
  v_start_island  INT;
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

  -- BOY עם הצבה → כתיבת אי-הפתיחה מהמיפוי על התלמיד.ה (המיפוי = מקור אמת).
  -- לא דורסים אישור/override קיים של המורה (placement_confirmed = FALSE guard).
  IF p_assessment_type = 'BOY'
     AND (p_payload -> 'placement' ->> 'start_island') ~ '^\d+$' THEN
    v_start_island := (p_payload -> 'placement' ->> 'start_island')::INT;
    IF v_start_island BETWEEN 1 AND 22 THEN
      UPDATE public.students
      SET start_island        = v_start_island,
          placement_confirmed = TRUE
      WHERE id = v_student_id
        AND placement_confirmed = FALSE;
    END IF;
  END IF;

  RETURN v_assessment_id;
END;
$$;

-- DONE. ingest_student_assessment כבר GRANT ל-anon (מיגרציה 0001) — אין צורך בהרשאה נוספת.
