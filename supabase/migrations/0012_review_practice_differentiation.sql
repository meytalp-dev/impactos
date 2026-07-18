-- ============================================================================
-- Avnei Yesod Cloud · Migration 0012 — תרגול-חזרה מובחן (לא לינק גנרי חוזר)
-- ============================================================================
-- Created: 2026-07-19
-- Why:
--   ב-0011, ~27 ימי-"תרגול"/"חזרה" גנריים כולם הצביעו לאותו לינק (map.html?guest=1).
--   מיטל זיהתה שזה "אותו משחק חוזר". התיקון: יום-חזרה גנרי יורש את התרגול-האמיתי
--   האחרון שלפניו (מובחן לפי המקום בשנה) — תואם למנוע ב-teacher-curriculum-v2.
--   מעדכן רק את השורות שהשתנו. אידמפוטנטי. get_student_current_lesson נשאר.
-- How to run: Supabase Dashboard -> SQL Editor -> הדביקי -> Run.
-- ============================================================================

UPDATE public.curriculum_lessons SET practice_href='stage-read-aloud.html' WHERE seq_index=46;
UPDATE public.curriculum_lessons SET practice_href='stage-read-aloud.html' WHERE seq_index=47;
UPDATE public.curriculum_lessons SET practice_href='stage-4-cv-build.html?vowel=hiriq' WHERE seq_index=57;
UPDATE public.curriculum_lessons SET practice_href='stage-5-word-build.html' WHERE seq_index=60;
UPDATE public.curriculum_lessons SET practice_href='stage-5-word-build.html' WHERE seq_index=61;
UPDATE public.curriculum_lessons SET practice_href='stage-14-read-and-answer.html' WHERE seq_index=85;
UPDATE public.curriculum_lessons SET practice_href='stage-14-read-and-answer.html' WHERE seq_index=96;
UPDATE public.curriculum_lessons SET practice_href='stage-14-read-and-answer.html' WHERE seq_index=97;
UPDATE public.curriculum_lessons SET practice_href='stage-5-word-build.html' WHERE seq_index=99;
UPDATE public.curriculum_lessons SET practice_href='stage-4-cv-build.html?vowel=' WHERE seq_index=101;
UPDATE public.curriculum_lessons SET practice_href='stage-4-cv-build.html?vowel=' WHERE seq_index=102;
UPDATE public.curriculum_lessons SET practice_href='stage-4-cv-build.html?vowel=' WHERE seq_index=111;
UPDATE public.curriculum_lessons SET practice_href='stage-14-read-and-answer.html' WHERE seq_index=114;
UPDATE public.curriculum_lessons SET practice_href='stage-14-read-and-answer.html' WHERE seq_index=115;
UPDATE public.curriculum_lessons SET practice_href='stage-read-aloud.html' WHERE seq_index=123;
UPDATE public.curriculum_lessons SET practice_href='stage-14-read-and-answer.html' WHERE seq_index=125;
UPDATE public.curriculum_lessons SET practice_href='stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95' WHERE seq_index=131;
UPDATE public.curriculum_lessons SET practice_href='stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95' WHERE seq_index=132;
UPDATE public.curriculum_lessons SET practice_href='stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95' WHERE seq_index=133;
UPDATE public.curriculum_lessons SET practice_href='stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95' WHERE seq_index=134;
UPDATE public.curriculum_lessons SET practice_href='stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95' WHERE seq_index=135;
UPDATE public.curriculum_lessons SET practice_href='stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95' WHERE seq_index=136;
UPDATE public.curriculum_lessons SET practice_href='stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95' WHERE seq_index=137;
UPDATE public.curriculum_lessons SET practice_href='stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95' WHERE seq_index=138;
UPDATE public.curriculum_lessons SET practice_href='stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95' WHERE seq_index=139;
UPDATE public.curriculum_lessons SET practice_href='stage-14-read-and-answer.html' WHERE seq_index=146;
UPDATE public.curriculum_lessons SET practice_href='stage-14-read-and-answer.html' WHERE seq_index=147;

-- DONE. אימות: SELECT seq_index,title,practice_href FROM curriculum_lessons WHERE seq_index IN (60,101,146);
