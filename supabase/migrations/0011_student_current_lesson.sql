-- ============================================================================
-- Avnei Yesod Cloud · Migration 0011 — צינור תרגול-יומי: שיעור-נוכחי לתלמיד
-- ============================================================================
-- Created: 2026-07-18
--
-- What this does:
--   1. curriculum_lessons + practice_href — קישור-תרגול מוכן פר-שיעור (נצרב מהרזולבר
--      האמיתי של תוכנית-הלימודים · teacher-curriculum-v2 · resolvePractice).
--   2. Re-seed — 195 השיעורים האמיתיים בסדר התוכנית השנתית (שיעור 1 = האות ת).
--      מחליף את ה-placeholders מ-0003.
--   3. get_student_current_lesson(p_token) — RPC לתלמיד (anon, כמו get_student_profile):
--      token -> student -> class.current_lesson_seq -> השיעור + practice_href.
--      כך "בואו נתחיל לתרגל" והכניסה החוזרת מנתבים לנושא הנוכחי של הכיתה.
--
-- Design: sequence-based (לא לפי תאריך). "היום" = השיעור ש-current_lesson_seq מצביע
--   עליו. המורה מקדמת ב-advance_lesson/set_current_lesson (0003). שיעור בלי תרגול
--   דיגיטלי (כתיבה/שיח) -> practice_href = NULL -> הלקוח נופל-חזרה בעדינות.
--
-- How to run: Supabase Dashboard -> SQL Editor -> הדביקי -> Run. (אידמפוטנטי.)
-- בטוח: הוספת עמודה + RPC חדש; הלקוח קורא לפי שם-שדה. current_lesson_seq נשמר.
--
-- ⚠️ עצמאי: כולל את תשתית 0003 (טבלה + current_lesson_seq + RPCs למורה) עם
--    IF NOT EXISTS / CREATE OR REPLACE — בטוח להריץ גם אם 0003 כבר רצה וגם אם לא.
-- ============================================================================


-- 0. תשתית (מ-0003 · אידמפוטנטי — נוצרת רק אם טרם קיימת)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.curriculum_lessons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seq_index     INT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  objective     TEXT,
  default_units JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes         TEXT,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS curriculum_lessons_seq_idx
  ON public.curriculum_lessons(seq_index) WHERE active = TRUE;

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS current_lesson_seq INT NOT NULL DEFAULT 1;

ALTER TABLE public.curriculum_lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS curriculum_lessons_select_all ON public.curriculum_lessons;
CREATE POLICY curriculum_lessons_select_all ON public.curriculum_lessons
  FOR SELECT USING (auth.role() = 'authenticated');

-- RPCs למורה (קידום הכיתה) — get / set / advance
CREATE OR REPLACE FUNCTION public.get_current_lesson(p_class_id UUID)
RETURNS TABLE(id UUID, seq_index INT, title TEXT, objective TEXT, default_units JSONB, notes TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_seq INT;
BEGIN
  SELECT c.current_lesson_seq INTO v_seq FROM public.classes c
  WHERE c.id = p_class_id AND c.teacher_id = auth.uid();
  IF v_seq IS NULL THEN
    RAISE EXCEPTION 'Class not found or not owned by caller' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT l.id, l.seq_index, l.title, l.objective, l.default_units, l.notes
  FROM public.curriculum_lessons l WHERE l.seq_index = v_seq AND l.active = TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_current_lesson(p_class_id UUID, p_seq INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.classes WHERE id = p_class_id AND teacher_id = auth.uid()) THEN
    RAISE EXCEPTION 'Class not found or not owned by caller' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.curriculum_lessons WHERE seq_index = p_seq AND active = TRUE) THEN
    RAISE EXCEPTION 'Lesson seq_index % not found', p_seq USING ERRCODE = '22023';
  END IF;
  UPDATE public.classes SET current_lesson_seq = p_seq WHERE id = p_class_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.advance_lesson(p_class_id UUID)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current INT; v_next INT;
BEGIN
  SELECT current_lesson_seq INTO v_current FROM public.classes
  WHERE id = p_class_id AND teacher_id = auth.uid();
  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Class not found or not owned by caller' USING ERRCODE = '42501';
  END IF;
  SELECT MIN(seq_index) INTO v_next FROM public.curriculum_lessons
  WHERE seq_index > v_current AND active = TRUE;
  IF v_next IS NULL THEN RETURN v_current; END IF;
  UPDATE public.classes SET current_lesson_seq = v_next WHERE id = p_class_id;
  RETURN v_next;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_lesson  TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_lesson  TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_lesson      TO authenticated;


-- 1. practice_href — קישור-תרגול מוכן פר-שיעור
ALTER TABLE public.curriculum_lessons
  ADD COLUMN IF NOT EXISTS practice_href TEXT;

COMMENT ON COLUMN public.curriculum_lessons.practice_href IS
  'קישור-תרגול יחסי מ-underwater-app לשיעור. NULL = אין תרגול דיגיטלי (כתיבה/שיח).';


-- 2. Re-seed — התוכנית השנתית האמיתית (195 שיעורים, סדר-רצף).
--    מוחק את ה-placeholders מ-0003 וטוען את הקאנון האמיתי.
DELETE FROM public.curriculum_lessons;

INSERT INTO public.curriculum_lessons (seq_index, title, objective, practice_href, notes) VALUES
  (1, 'האות ת — צורה וצליל', 'ספטמבר', 'stage-3-tav.html', 'אות ת'),
  (2, 'האות מ — צורה וצליל', 'ספטמבר', 'stage-3-mem.html', 'אות מ'),
  (3, 'האות ר — צורה וצליל (הבחנה ת/ר)', 'ספטמבר', 'stage-3-trail-resh.html', 'אות ר'),
  (4, 'האזנה לסיפור + אוצר מילים', 'ספטמבר', 'stage-14-story-sequence.html', 'הבנת הנשמע'),
  (5, 'כתיבת ת/מ/ר + סיכום שבועי', 'ספטמבר', NULL, 'כתיבה'),
  (6, 'האות ב', 'ספטמבר', 'stage-3-bet.html', 'אות ב'),
  (7, 'האות ק (הבחנה ב/כ)', 'ספטמבר', 'stage-3-kuf.html', 'אות ק'),
  (8, 'תרגול חמש האותיות שנלמדו', 'ספטמבר', 'stage-summary-cv.html?letters=%D7%AA%2C%D7%9E%2C%D7%A8%2C%D7%91%2C%D7%A7', 'סיכום · ת מ ר ב ק'),
  (9, 'הצליל הראשון והאחרון במילה', 'ספטמבר', 'stage-2-island.html', 'צלילים · אי 2'),
  (10, 'כתיבת ב/ק + מבדק קצר', 'ספטמבר', '../engine/screener.html', 'מבדק'),
  (11, 'האות א', 'ספטמבר', 'stage-3-alef.html', 'אות א'),
  (12, 'האות י', 'ספטמבר', 'stage-3-yud.html', 'אות י'),
  (13, 'הבחנה בין אותיות דומות', 'ספטמבר', 'stage-discrimination.html?pair=tav-resh,bet-kaf,hey-het&tag=%D7%90%D7%95%D6%B9%D7%AA%D6%B4%D7%99%D6%BC%D7%95%D6%B9%D7%AA%20%D7%93%D6%BC%D7%95%D6%B9%D7%9E%D7%95%D6%B9%D7%AA', 'אוֹתִיּוֹת דּוֹמוֹת'),
  (14, 'תיאור תמונה + משחקי הברות', 'ספטמבר', 'stage-1-island.html', 'משחקי הברות · אי 1'),
  (15, 'כתיבת א/י + סיכום', 'ספטמבר', NULL, 'כתיבה'),
  (16, 'האות ל', 'ספטמבר', 'stage-3-lamed.html', 'אות ל'),
  (17, 'האות ש', 'ספטמבר', 'stage-3-shin.html', 'אות ש'),
  (18, 'האות ח', 'ספטמבר', 'stage-3-het.html', 'אות ח'),
  (19, 'האות נ', 'ספטמבר', 'stage-3-nun.html', 'אות נ'),
  (20, 'סיכום 11 אותיות + כתיבה', 'ספטמבר', 'stage-summary-cv.html?letters=%D7%AA%2C%D7%9E%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0', 'סיכום 11 אותיות'),
  (21, 'האות ד (הבחנה ד/ר)', 'אוקטובר', 'stage-3-dalet.html', 'אות ד'),
  (22, 'האות פ', 'אוקטובר', 'stage-3-pey.html', 'אות פ'),
  (23, 'האות ה (הבחנה ה/ח)', 'אוקטובר', 'stage-3-hey.html', 'אות ה'),
  (24, 'האות ס', 'אוקטובר', 'stage-3-samekh.html', 'אות ס'),
  (25, 'כתיבה + מבדק זיהוי', 'אוקטובר', '../engine/screener.html', 'מבדק'),
  (26, 'האות ג', 'אוקטובר', 'stage-3-gimel.html', 'אות ג'),
  (27, 'האות ע', 'אוקטובר', 'stage-3-ayin.html', 'אות ע'),
  (28, 'האות כ (הבחנה כ/ב)', 'אוקטובר', 'stage-3-kaf.html', 'אות כ'),
  (29, 'האות צ', 'אוקטובר', 'stage-3-tzadi.html', 'אות צ'),
  (30, 'כתיבה + הבחנת אותיות', 'אוקטובר', NULL, 'כתיבה'),
  (31, 'האות ט', 'אוקטובר', 'stage-3-tet.html', 'אות ט'),
  (32, 'האות ז', 'אוקטובר', 'stage-3-zayin.html', 'אות ז'),
  (33, 'האות ו — כל 22 האותיות!', 'אוקטובר', 'stage-3-vav.html', 'אות ו'),
  (34, 'משחק זיהוי מהיר של כל הא״ב', 'אוקטובר', 'stage-summary-cv.html?letters=%D7%AA%2C%D7%9E%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%92%2C%D7%A2%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95', 'סיכום 22 אותיות'),
  (35, 'כתיבה + מבדק 22 אותיות', 'אוקטובר', '../engine/screener.html', 'מבדק'),
  (36, 'התנועה אַ — "איזה צליל שומעים?"', 'אוקטובר', 'stage-4-cv-build.html', 'הברה'),
  (37, 'קריאת הברה: מָ רָ תָ בָ קָ', 'אוקטובר', 'stage-4-cv-build.html', 'הברה'),
  (38, 'אותיות סופיות בתוך מילים', 'אוקטובר', 'stage-5-word-build.html', 'קריאת מילים'),
  (39, 'שפה דבורה + אוצר מילים', 'אוקטובר', NULL, 'שיח בכיתה'),
  (40, 'כתיבת הברות + מבדק קצר', 'אוקטובר', '../engine/screener.html', 'מבדק'),
  (41, 'הבנת משפט כן/לא', 'נובמבר', 'stage-15-sentence.html?mode=question', 'קוראים ועונים · אי 15'),
  (42, 'קריאת הברה סגורה: קַר מַר רַק בַּת', 'נובמבר', 'stage-4-cv-build.html', 'הברה'),
  (43, 'הבחנת תנועות באות א', 'נובמבר', 'stage-4-cv-build.html', 'הברה'),
  (44, 'שאלות מי/מה על הנשמע', 'נובמבר', 'stage-14-listen-and-answer.html', 'הבנת הנשמע'),
  (45, 'כתיבת מילים קצרות + סיכום', 'נובמבר', 'stage-20-spell.html', 'בּוֹנִים מִלִּים · אי 20'),
  (46, 'בניית מילה מהברות', 'נובמבר', 'stage-5-word-merge.html', 'הרכבת מילה'),
  (47, 'תרגול קריאת מילים סגורות', 'נובמבר', 'stage-5-word-build.html', 'קריאת מילים'),
  (48, 'קריאת פעלים בעבר (תָּלָה, קָרָה)', 'נובמבר', 'stage-5-word-build.html', 'קריאת מילים'),
  (49, 'משמעות פעלים + אוצר', 'נובמבר', 'stage-9-island.html', 'משפחות מילים · אי 9'),
  (50, 'כתיבת פועל קצר + סיכום', 'נובמבר', NULL, 'כתיבה'),
  (51, 'מילים קטנות: שֶׁל, אֶת, לֹא, כֵּן', 'נובמבר', 'stage-8-flash-words.html', 'מילים שכיחות · אי 8'),
  (52, 'קריאת משפט קצר', 'נובמבר', 'stage-8-sentence-catch.html', 'המשפט של נוני · אי 8'),
  (53, 'הבחנה בין מילים דומות (בָּרָק/מָרָק)', 'נובמבר', 'stage-5-word-build.html', 'קריאת מילים'),
  (54, '"איזו מילה שמעת?"', 'נובמבר', 'stage-5-word-build.html', 'קריאת מילים'),
  (55, 'כתיבת זוג מילים + סיכום', 'נובמבר', NULL, 'כתיבה'),
  (56, 'סיכום צלילים + חיבור תמונה-מילה', 'נובמבר', 'stage-5-word-build.html', 'קריאת מילים'),
  (57, 'קריאת מילים שלמות', 'נובמבר', 'stage-6-fast-fish.html', 'דָּג מָהִיר · אי 6'),
  (58, 'חזרה ותחזוקה', 'נובמבר', 'stage-summary-cv.html?letters=%D7%AA%2C%D7%9E%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%92%2C%D7%A2%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95', 'סיכום 22 אותיות'),
  (59, 'הקראה + הבנת הנשמע', 'נובמבר', 'stage-read-aloud.html', 'שטף קריאה'),
  (60, 'מבדק חודשי + כתיבה', 'נובמבר', '../engine/screener.html', 'מבדק'),
  (61, 'השווא — "איפה שומעים בְּ/שְׁ/תְּ?"', 'דצמבר', 'stage-4-cv-build.html?vowel=shva', 'שווא'),
  (62, 'קריאת הברה עם שווא', 'דצמבר', 'stage-4-cv-build.html?vowel=shva', 'שווא'),
  (63, 'התחילית לְ (לְנָדָב)', 'דצמבר', 'stage-10-little-start.html', 'הַהַתְחָלָה הַקְּטַנָּה · אי 10'),
  (64, 'התאמת מילה לאיור', 'דצמבר', 'stage-5-word-build.html', 'קריאת מילים'),
  (65, 'כתיבת מילה עם שווא + סיכום', 'דצמבר', NULL, 'כתיבה'),
  (66, 'זוגות זכר/נקבה (רָכַב/רָכְבָה)', 'דצמבר', 'stage-10-he-or-she.html', 'הוּא אוֹ הִיא · אי 10'),
  (67, 'קריאת שווא נח באמצע מילה', 'דצמבר', 'stage-4-cv-build.html?vowel=shva', 'שווא'),
  (68, 'השווא שמסמן נקבה', 'דצמבר', 'stage-4-cv-build.html?vowel=shva', 'שווא'),
  (69, 'זכר/נקבה בדיבור', 'דצמבר', NULL, 'שיח בכיתה'),
  (70, 'כתיבת זוג זכר/נקבה + סיכום', 'דצמבר', NULL, 'כתיבה'),
  (71, 'הרכבת משפט מסדר מילים', 'דצמבר', 'stage-21-dictation.html', 'דיקטה בבנייה · אי 21'),
  (72, 'קריאת משפט שלם', 'דצמבר', 'stage-5-word-build.html', 'קריאת מילים'),
  (73, 'התחיליות וְ, בְּ, לְ', 'דצמבר', 'stage-10-little-start.html', 'הַהַתְחָלָה הַקְּטַנָּה · אי 10'),
  (74, 'מילות מקום בדיבור', 'דצמבר', NULL, 'שיח בכיתה'),
  (75, 'כתיבת משפט + סיכום', 'דצמבר', NULL, 'כתיבה'),
  (76, 'התנועה אִי — הצגת הצליל', 'דצמבר', 'stage-4-cv-build.html', 'הברה'),
  (77, 'קריאת הברה: מִי, שִׁי', 'דצמבר', 'stage-4-cv-build.html', 'הברה'),
  (78, 'בחירת משפט לאיור', 'דצמבר', 'stage-15-sentence.html?mode=image', 'משפט ותמונה · אי 15'),
  (79, 'מילים עם חיריק', 'דצמבר', 'stage-4-cv-build.html?vowel=hiriq', 'חיריק'),
  (80, 'כתיבת הברת חיריק + סיכום', 'דצמבר', NULL, 'כתיבה'),
  (81, 'יחיד/רבים (שִׁיר/שִׁירִים)', 'ינואר', 'stage-10-one-or-many.html', 'אֶחָד אוֹ הַרְבֵּה · אי 10'),
  (82, 'קריאת מילה ארוכה', 'ינואר', 'stage-7-chunks.html', 'מעלית הצ׳אנקים · אי 7'),
  (83, 'ריבוי מיוחד (אִישׁ/אֲנָשִׁים)', 'ינואר', 'stage-10-one-or-many.html', 'אֶחָד אוֹ הַרְבֵּה · אי 10'),
  (84, '"מה יוצא דופן?" + יש/אין', 'ינואר', 'stage-bank-play.html?unitKey=jan-w1-d4&tag=%D7%9E%D6%B8%D7%94%20%D7%99%D7%95%D6%B9%D7%A6%D6%B5%D7%90%20%D7%93%D6%B9%D6%BC%D7%A4%D6%B6%D7%9F%3F%20%2B%20%D7%99%D6%B5%D7%A9%D7%81%2F%D7%90%D6%B5%D7%99%D7%9F', 'מָה יוֹצֵא דֹּפֶן? + יֵשׁ/אֵין'),
  (85, 'כתיבת זוג יחיד/רבים', 'ינואר', NULL, 'כתיבה'),
  (86, 'הָיָה/הָיְתָה', 'ינואר', 'stage-bank-play.html?unitKey=jan-w2-d1&tag=%D7%94%D6%B8%D7%99%D6%B8%D7%94%2F%D7%94%D6%B8%D7%99%D6%B0%D7%AA%D6%B8%D7%94', 'הָיָה/הָיְתָה'),
  (87, 'קריאת משפט עם פועל עבר', 'ינואר', 'stage-5-word-build.html', 'קריאת מילים'),
  (88, 'אַתְּ/אַתָּה (עבר)', 'ינואר', 'stage-bank-play.html?unitKey=jan-w2-d3&tag=%D7%90%D6%B7%D7%AA%D6%B0%D6%BC%2F%D7%90%D6%B7%D7%AA%D6%B8%D6%BC%D7%94', 'אַתְּ/אַתָּה'),
  (89, 'מי עשה מה? (הבנה)', 'ינואר', 'stage-14-listen-and-answer.html', 'הבנת הנשמע'),
  (90, 'כתיבת היה/הייתה', 'ינואר', NULL, 'כתיבה'),
  (91, 'אֲנִי/אַתָּה/אַתְּ + פעלים', 'ינואר', 'stage-bank-play.html?unitKey=jan-w3-d1&tag=%D7%9B%D6%B4%D6%BC%D7%A0%D6%BC%D7%95%D6%BC%D7%99%D6%B5%D7%99%20%D7%92%D6%BC%D7%95%D6%BC%D7%A3', 'כִּנּוּיֵי גּוּף'),
  (92, 'מהברה למילה', 'ינואר', 'stage-5-word-merge.html', 'הרכבת מילה'),
  (93, 'משחק התאמת חיריק', 'ינואר', 'stage-4-cv-build.html?vowel=hiriq', 'חיריק'),
  (94, 'הרחבת אוצר', 'ינואר', 'stage-vocab-match.html?island=12', 'אוצר מילים · אי 12'),
  (95, 'משפט קצר עצמאי', 'ינואר', 'stage-5-word-build.html', 'קריאת מילים'),
  (96, 'הבחנת צ/ץ', 'ינואר', 'stage-discrimination.html?pair=tzadi-final&tag=%D7%A6%20%2F%20%D7%A5', 'צ / ץ'),
  (97, '"מילים אמיתיות או בדויות?"', 'ינואר', 'stage-5-word-build.html', 'קריאת מילים'),
  (98, 'חזרה — חיריק', 'ינואר', 'stage-4-cv-build.html?vowel=hiriq', 'חיריק'),
  (99, 'מבדק אמצע שנה — משימות דבורות', 'ינואר', '../engine/screener.html', 'מבדק'),
  (100, 'כתיבה + סיכום אמצע שנה', 'ינואר', NULL, 'כתיבה'),
  (101, 'שׁ ימנית מול שׂ שמאלית (שָׁר/שָׂר)', 'פברואר', 'stage-discrimination.html?pair=shin-sin&tag=%D7%A9%D7%81%20%2F%20%D7%A9%D7%82', 'שׁ / שׂ'),
  (102, 'קריאת מילים עם שׁ/שׂ', 'פברואר', 'stage-discrimination.html?pair=shin-sin-words&tag=%D7%9E%D6%B4%D7%9C%D6%B4%D6%BC%D7%99%D7%9D%20%D7%A2%D6%B4%D7%9D%20%D7%A9%D7%81%20%2F%20%D7%A9%D7%82', 'מִלִּים עִם שׁ / שׂ'),
  (103, 'בחירת משפט לתמונה', 'פברואר', 'stage-15-sentence.html?mode=image', 'משפט ותמונה · אי 15'),
  (104, 'אבחנה שמיעתית שׁ/שׂ', 'פברואר', 'stage-discrimination.html?pair=shin-sin-listen&tag=%D7%94%D6%B7%D7%90%D6%B2%D7%96%D6%B8%D7%A0%D6%B8%D7%94%20%D7%A9%D7%81%20%2F%20%D7%A9%D7%82', 'הַאֲזָנָה שׁ / שׂ'),
  (105, 'כתיבת שׁ/שׂ + סיכום', 'פברואר', NULL, 'כתיבה'),
  (106, 'התנועה אוֹ + מילות מקום עַל/לְיַד', 'פברואר', 'stage-11-island.html', 'מילות מקום · אי 11'),
  (107, 'קריאת הברה: מוֹ, בּוֹ', 'פברואר', 'stage-4-cv-build.html', 'הברה'),
  (108, 'בניית מילים מהברות', 'פברואר', 'stage-5-word-merge.html', 'הרכבת מילה'),
  (109, 'מיקום ומרחב בדיבור', 'פברואר', NULL, 'שיח בכיתה'),
  (110, 'כתיבת הברת חולם', 'פברואר', NULL, 'כתיבה'),
  (111, 'מיון מילים לקבוצות', 'פברואר', 'stage-5-word-build.html', 'קריאת מילים'),
  (112, 'קריאת מילים מהקבוצות', 'פברואר', 'stage-5-word-build.html', 'קריאת מילים'),
  (113, 'חיפוש פריטים + צבעים', 'פברואר', 'stage-vocab-match.html?mode=word&island=12', 'אוצר מילים · אי 12'),
  (114, 'שדות סמנטיים (אוצר)', 'פברואר', 'stage-vocab-match.html?mode=sort&island=12', 'אוצר מילים · אי 12'),
  (115, 'כתיבת מילה עם חולם חסר', 'פברואר', NULL, 'כתיבה'),
  (116, 'חריזה', 'פברואר', 'stage-rhyme.html?cid=feb-w4-d1-c2', 'חריזה'),
  (117, 'השלמת מילה (חולם)', 'פברואר', 'stage-4-cv-build.html?vowel=holam', 'חולם'),
  (118, 'אסוציאציות וקטגוריות', 'פברואר', 'stage-vocab-match.html?mode=sort&island=12', 'אוצר מילים · אי 12'),
  (119, 'הבנת הנשמע — סיפור קצר', 'פברואר', 'stage-14-story-sequence.html', 'הבנת הנשמע'),
  (120, 'מבדק חודשי + כתיבה', 'פברואר', '../engine/screener.html', 'מבדק'),
  (121, 'קריאת תיאור + התאמה לדמות', 'מרץ', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (122, 'קריאת תיאור ארוך', 'מרץ', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (123, 'השלמת הברה חסרה', 'מרץ', 'stage-4-cv-build.html', 'הברה'),
  (124, 'תיאור דמות (אוצר)', 'מרץ', NULL, 'שיח בכיתה'),
  (125, 'כתיבת תיאור קצר', 'מרץ', NULL, 'כתיבה'),
  (126, 'התאמת מילה לתמונה (מהירות)', 'מרץ', 'stage-6-fast-fish.html', 'דָּג מָהִיר · אי 6'),
  (127, 'קריאה מהירה (תחילת שטף)', 'מרץ', 'stage-read-aloud.html', 'שטף קריאה'),
  (128, 'מילות שאלה: מָה/מִי/אֵיפֹה/לָמָה', 'מרץ', 'stage-bank-play.html?unitKey=mar-w2-d3&tag=%D7%9E%D6%B4%D7%9C%D6%BC%D7%95%D6%B9%D7%AA%20%D7%A9%D6%B0%D7%81%D7%90%D6%B5%D7%9C%D6%B8%D7%94', 'מִלּוֹת שְׁאֵלָה'),
  (129, 'שאלות ותשובות (דיאלוג)', 'מרץ', NULL, 'שיח בכיתה'),
  (130, 'כתיבת שאלה', 'מרץ', NULL, 'כתיבה'),
  (131, 'בחירת משפט לאיור', 'מרץ', 'stage-15-sentence.html?mode=image', 'משפט ותמונה · אי 15'),
  (132, 'התנועה אֶה (צירי-סגול)', 'מרץ', 'stage-4-cv-build.html?vowel=tzere', 'צירי-סגול'),
  (133, 'פעלים בהווה (הוֹלֵךְ/הוֹלֶכֶת)', 'מרץ', 'stage-5-word-build.html', 'קריאת מילים'),
  (134, 'התאמת מין בדיבור', 'מרץ', NULL, 'שיח בכיתה'),
  (135, 'כתיבת הברת צירי-סגול', 'מרץ', NULL, 'כתיבה'),
  (136, 'טקסט מידע + ארבע שאלות', 'מרץ', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (137, 'קריאה חוזרת (שטף)', 'מרץ', 'stage-read-aloud.html', 'שטף קריאה'),
  (138, 'שאלות מי/מה/איפה', 'מרץ', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (139, 'שאלות למה/מה יקרה', 'מרץ', 'stage-14-listen-and-answer.html', 'הבנת הנשמע'),
  (140, 'כתיבת תשובה במשפט', 'מרץ', NULL, 'כתיבה'),
  (141, 'קריאת מילים ארוכות', 'אפריל', 'stage-7-chunks.html', 'מעלית הצ׳אנקים · אי 7'),
  (142, 'קריאה חוזרת (שטף)', 'אפריל', 'stage-read-aloud.html', 'שטף קריאה'),
  (143, 'השלמת משפט בחריזה', 'אפריל', 'stage-rhyme.html?cid=feb-w4-d1-c2', 'חריזה'),
  (144, 'זיהוי חרוזים (אוצר)', 'אפריל', 'stage-rhyme.html?cid=apr-w1-d4-c1', 'חריזה'),
  (145, 'כתיבת מילה חורזת', 'אפריל', NULL, 'כתיבה'),
  (146, 'התנועה אוּ — הצגת הצליל', 'אפריל', 'stage-4-cv-build.html', 'הברה'),
  (147, 'קריאת הברה: מֻ, בּוּ', 'אפריל', 'stage-4-cv-build.html', 'הברה'),
  (148, 'בחירת מילה עם אוּ', 'אפריל', 'stage-5-word-build.html', 'קריאת מילים'),
  (149, 'מילים עם אוּ (אוצר)', 'אפריל', 'stage-5-word-build.html', 'קריאת מילים'),
  (150, 'מערכת התנועות שלמה — כתיבת הברה', 'אפריל', NULL, 'כתיבה'),
  (151, 'כינוי גוף (נושא-נשוא)', 'אפריל', 'stage-5-word-build.html', 'קריאת מילים'),
  (152, 'קריאת משפט עם כינוי גוף', 'אפריל', 'stage-5-word-build.html', 'קריאת מילים'),
  (153, 'שמות תואר + עַל', 'אפריל', 'stage-bank-play.html?unitKey=apr-w3-d3&tag=%D7%A9%D6%B0%D7%81%D7%9E%D7%95%D6%B9%D7%AA%20%D7%AA%D6%B9%D6%BC%D7%90%D6%B7%D7%A8%20%2B%20%D7%A2%D6%B7%D7%9C', 'שְׁמוֹת תֹּאַר + עַל'),
  (154, 'תיאור בעזרת תארים', 'אפריל', NULL, 'שיח בכיתה'),
  (155, 'כתיבת משפט עם תואר', 'אפריל', NULL, 'כתיבה'),
  (156, 'יֵשׁ/אֵין — מה בתמונה', 'אפריל', 'stage-bank-play.html?unitKey=apr-w4-d1-c2,apr-w4-d2-c1,apr-w4-d2-c2&tag=%D7%99%D6%B5%D7%A9%D7%81%2F%D7%90%D6%B5%D7%99%D7%9F', 'יֵשׁ/אֵין'),
  (157, 'קריאת משפט יֵשׁ/אֵין', 'אפריל', 'stage-bank-play.html?unitKey=apr-w4-d1-c2,apr-w4-d2-c1,apr-w4-d2-c2&tag=%D7%99%D6%B5%D7%A9%D7%81%2F%D7%90%D6%B5%D7%99%D7%9F', 'יֵשׁ/אֵין'),
  (158, 'חזרה — כל התנועות', 'אפריל', 'stage-4-cv-build.html', 'הברה'),
  (159, 'הבנת הנשמע — סיפור', 'אפריל', 'stage-14-story-sequence.html', 'הבנת הנשמע'),
  (160, 'מבדק חודשי + כתיבה', 'אפריל', '../engine/screener.html', 'מבדק'),
  (161, 'קריאת סיפור "יום שוק בגינה"', 'מאי', 'stage-14-read-and-answer.html?text=shuk', 'הבנת הנקרא'),
  (162, 'קריאה חוזרת (שטף)', 'מאי', 'stage-read-aloud.html', 'שטף קריאה'),
  (163, 'רצף אירועים בסיפור', 'מאי', 'stage-16-paragraph.html', 'שרשרת משפטים · אי 16'),
  (164, 'שאלות הבנה על הסיפור', 'מאי', 'stage-14-story-sequence.html', 'הבנת הנשמע'),
  (165, 'סיכום הסיפור במשפט', 'מאי', 'stage-14-story-sequence.html', 'הבנת הנשמע'),
  (166, 'מילת הדימוי כְּמוֹ', 'מאי', 'stage-bank-play.html?unitKey=may-w2-d1&tag=%D7%9E%D6%B4%D7%9C%D6%B7%D6%BC%D7%AA%20%D7%94%D6%B7%D7%93%D6%B4%D6%BC%D7%9E%D6%BC%D7%95%D6%BC%D7%99%20%D7%9B%D6%B0%D6%BC%D7%9E%D7%95%D6%B9', 'מִלַּת הַדִּמּוּי כְּמוֹ'),
  (167, 'קריאת טקסט מידע (לווייתנים)', 'מאי', 'stage-14-read-and-answer.html?text=whales', 'הבנת הנקרא'),
  (168, 'מבנה טקסט מידע', 'מאי', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (169, 'איתור מידע בטקסט', 'מאי', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (170, 'כתיבת משפט דימוי', 'מאי', NULL, 'כתיבה'),
  (171, 'טקסט מידע על דבורים', 'מאי', 'stage-14-read-and-answer.html?text=bees', 'הבנת הנקרא'),
  (172, 'קריאה חוזרת (שטף)', 'מאי', 'stage-read-aloud.html', 'שטף קריאה'),
  (173, 'משחק יחיד/רבים', 'מאי', 'stage-10-one-or-many.html', 'אֶחָד אוֹ הַרְבֵּה · אי 10'),
  (174, 'שני תרגילי הבנה', 'מאי', 'stage-14-listen-and-answer.html', 'הבנת הנשמע'),
  (175, 'כתיבת משפט מידע', 'מאי', NULL, 'כתיבה'),
  (176, 'טקסט הוראות (קֹדֶם/אַחַר כָּךְ)', 'מאי', 'stage-14-listen-and-answer.html', 'הבנת הנשמע'),
  (177, 'טקסט סיפורי + ציטוט', 'מאי', 'stage-14-story-sequence.html', 'הבנת הנשמע'),
  (178, 'מבדק סוף שנה — קריאה', 'מאי', '../engine/screener.html', 'מבדק'),
  (179, 'מבדק סוף שנה — הבנה וכתיבה', 'מאי', '../engine/screener.html', 'מבדק'),
  (180, 'כתיבת רצף הוראות', 'מאי', NULL, 'כתיבה'),
  (181, 'קריאה חוזרת של טקסט מוכר', 'יוני', 'stage-read-aloud.html', 'שטף קריאה'),
  (182, 'מדידת מילים לדקה', 'יוני', 'stage-read-aloud.html', 'שטף קריאה'),
  (183, 'קריאה בזוגות', 'יוני', 'stage-read-aloud.html', 'שטף קריאה'),
  (184, 'הבנת הנשמע + אוצר', 'יוני', 'stage-14-listen-and-answer.html', 'הבנת הנשמע'),
  (185, 'כתיבה חופשית', 'יוני', NULL, 'כתיבה'),
  (186, 'קריאת פסקה עצמית', 'יוני', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (187, 'שאלות הבנה (מי/מה/איפה)', 'יוני', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (188, 'שאלות חשיבה (למה/מה יקרה)', 'יוני', 'stage-14-listen-and-answer.html', 'הבנת הנשמע'),
  (189, 'השוואה בין שני טקסטים', 'יוני', 'stage-14-listen-and-answer.html', 'הבנת הנשמע'),
  (190, 'כתיבת תשובה מנומקת', 'יוני', NULL, 'כתיבה'),
  (191, 'הכתבת מילים שכיחות', 'יוני', 'stage-8-word-write.html', 'איך כותבים · אי 8'),
  (192, 'כתיבת "אני ___"', 'יוני', NULL, 'כתיבה'),
  (193, 'מבדק סיום שנה', 'יוני', '../engine/screener.html', 'מבדק'),
  (194, 'פרופיל אורייני לכל ילד', 'יוני', 'teacher-literacy-profile.html', 'כלי מורה'),
  (195, 'חגיגת סיום + קריאה משותפת', 'יוני', NULL, 'אירוע כיתתי');


-- 3. RPC לתלמיד — השיעור הנוכחי של הכיתה לפי token (anon)
CREATE OR REPLACE FUNCTION public.get_student_current_lesson(p_token TEXT)
RETURNS TABLE(
  seq_index     INT,
  title         TEXT,
  objective     TEXT,
  practice_href TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT l.seq_index, l.title, l.objective, l.practice_href
  FROM public.students s
  JOIN public.classes c ON s.class_id = c.id
  JOIN public.curriculum_lessons l
    ON l.seq_index = c.current_lesson_seq AND l.active = TRUE
  WHERE s.token = p_token AND s.active = TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_current_lesson(TEXT) TO anon;

-- ============================================================================
-- DONE. אימות:
--   SELECT seq_index, title, practice_href FROM curriculum_lessons ORDER BY seq_index LIMIT 5;
--   SELECT * FROM get_student_current_lesson('<token>');   -- -> השיעור הנוכחי של הכיתה
-- ============================================================================
