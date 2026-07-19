-- ============================================================================
-- Avnei Yesod Cloud · Migration 0013 — תיקון סדר-תנועות: /e/ לפני /o/ (פבר↔מרץ)
-- ============================================================================
-- Created: 2026-07-19
--
-- למה: אימות-רצף מחקרי (deep-research wf_02408ee1-e19) מצא שגם ספר-הלימוד
--   מטח/yesod וגם הרצף הרשמי המאומת (משה"ח) קובעים סדר-תנועות
--   /a/ → /i/ → /e/ → /o/ → /u/ — כלומר **צירי-סגול לפני חולם**.
--   התוכנית לימדה חולם (פברואר) לפני צירי-סגול (מרץ) — הפוך. מיטל אישרה החלפה.
--
-- מה זה עושה: מעדכן title + practice_href לימי פברואר (76–87 → צירי-סגול /e/)
--   ומרץ (88–104 → חולם /o/) כך שהניתוב-לתלמיד (get_student_current_lesson)
--   יתאים לתוכנית-המורה המעודכנת (grade1-daily-tashpaz.json).
--   objective (חודש) ו-current_lesson_seq של כיתות — לא נוגעים.
--
-- הרצה: Supabase Dashboard → SQL Editor → הדביקי → Run. אידמפוטנטי (UPDATE לפי seq).
-- תלוי ב-0011 (curriculum_lessons + practice_href). בטוח להריץ אחרי 0011.
-- ============================================================================

BEGIN;

-- פברואר → צירי-סגול /e/
UPDATE public.curriculum_lessons SET title = 'פתיחת פברואר — צירי-סגול /e/', practice_href = 'stage-4-cv-build.html?vowel=tzere' WHERE seq_index = 76;
UPDATE public.curriculum_lessons SET title = 'צירי', practice_href = 'stage-4-cv-build.html?vowel=tzere' WHERE seq_index = 77;
UPDATE public.curriculum_lessons SET title = 'סגול', practice_href = 'stage-4-cv-build.html?vowel=tzere' WHERE seq_index = 78;
UPDATE public.curriculum_lessons SET title = 'אבחנה /i/ — /e/', practice_href = 'stage-4-cv-build.html?vowel=hiriq' WHERE seq_index = 79;
UPDATE public.curriculum_lessons SET title = 'מילים עם /e/', practice_href = 'stage-5-word-build.html' WHERE seq_index = 80;
UPDATE public.curriculum_lessons SET title = 'תרגול שטף עם /e/', practice_href = 'stage-6-fast-fish.html' WHERE seq_index = 81;
UPDATE public.curriculum_lessons SET title = 'המשך אבחנת תנועות', practice_href = 'stage-4-cv-build.html' WHERE seq_index = 82;
UPDATE public.curriculum_lessons SET title = 'תרגול הבנת משפט', practice_href = 'stage-15-sentence.html?mode=question' WHERE seq_index = 83;
UPDATE public.curriculum_lessons SET title = 'טקסטים קצרים', practice_href = 'stage-14-read-and-answer.html' WHERE seq_index = 84;
UPDATE public.curriculum_lessons SET title = 'חזרת הבנה + חיזוק תנועות', practice_href = 'stage-14-read-and-answer.html' WHERE seq_index = 85;
UPDATE public.curriculum_lessons SET title = 'מילים תלת-הברתיות מורכבות', practice_href = 'stage-7-chunks.html' WHERE seq_index = 86;
UPDATE public.curriculum_lessons SET title = 'סיכום פברואר + סוף MOY', practice_href = 'stage-summary-cv.html' WHERE seq_index = 87;

-- מרץ → חולם /o/
UPDATE public.curriculum_lessons SET title = 'פתיחת מרץ — חולם /o/', practice_href = 'stage-4-cv-build.html?vowel=holam' WHERE seq_index = 88;
UPDATE public.curriculum_lessons SET title = 'חולם חסר', practice_href = 'stage-4-cv-build.html?vowel=holam' WHERE seq_index = 89;
UPDATE public.curriculum_lessons SET title = 'חולם מלא (ו)', practice_href = 'stage-4-cv-build.html?vowel=holam' WHERE seq_index = 90;
UPDATE public.curriculum_lessons SET title = 'אבחנת 4 תנועות', practice_href = 'stage-4-cv-build.html' WHERE seq_index = 91;
UPDATE public.curriculum_lessons SET title = 'מילים עם /o/', practice_href = 'stage-5-word-build.html' WHERE seq_index = 92;
UPDATE public.curriculum_lessons SET title = 'טקסטים קצרים', practice_href = 'stage-14-read-and-answer.html' WHERE seq_index = 93;
UPDATE public.curriculum_lessons SET title = 'תרגול שטף', practice_href = 'stage-read-aloud.html' WHERE seq_index = 94;
UPDATE public.curriculum_lessons SET title = 'הבנת הנקרא ראשונית', practice_href = 'stage-14-read-and-answer.html' WHERE seq_index = 95;
UPDATE public.curriculum_lessons SET title = 'חזרה לפני פורים', practice_href = 'stage-14-read-and-answer.html' WHERE seq_index = 96;
UPDATE public.curriculum_lessons SET title = 'אחרי פורים — תרגול חזרתי', practice_href = 'stage-14-read-and-answer.html' WHERE seq_index = 97;
UPDATE public.curriculum_lessons SET title = 'מילים תלת-הברתיות', practice_href = 'stage-7-chunks.html' WHERE seq_index = 98;
UPDATE public.curriculum_lessons SET title = 'חיזוק קריאת מילים', practice_href = 'stage-5-word-build.html' WHERE seq_index = 99;
UPDATE public.curriculum_lessons SET title = 'אבחנת 4 תנועות מאוחדת', practice_href = 'stage-4-cv-build.html' WHERE seq_index = 100;
UPDATE public.curriculum_lessons SET title = 'חיזוק אבחנת תנועות', practice_href = 'stage-4-cv-build.html' WHERE seq_index = 101;
UPDATE public.curriculum_lessons SET title = 'חיזוק קריאת משפט', practice_href = 'stage-14-read-and-answer.html' WHERE seq_index = 102;
UPDATE public.curriculum_lessons SET title = 'סיכום מרץ', practice_href = 'stage-summary-cv.html' WHERE seq_index = 103;
UPDATE public.curriculum_lessons SET title = 'תחילת קובוץ-שורוק /u/', practice_href = 'stage-4-cv-build.html?vowel=shuruk' WHERE seq_index = 104;

COMMIT;

-- ============================================================================
-- אימות:
--   SELECT seq_index, title, practice_href FROM curriculum_lessons
--   WHERE seq_index BETWEEN 76 AND 104 ORDER BY seq_index;
--   -- ציפוי: 76–81 = צירי-סגול/tzere · 88–90,92 = חולם/holam
-- ============================================================================
