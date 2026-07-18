-- ============================================================================
-- Avnei Yesod Cloud · Migration 0011 — צינור תרגול-יומי: שיעור-נוכחי לתלמיד
-- ============================================================================
-- Created: 2026-07-18
--
-- What this does:
--   1. curriculum_lessons + practice_href — קישור-תרגול מוכן פר-שיעור (נצרב מהרזולבר
--      האמיתי של תוכנית-הלימודים · teacher-curriculum-v2 · resolvePractice).
--   2. Re-seed — 153 השיעורים האמיתיים מ-grade1-daily-tashpaz.json בסדר-רצף
--      (שיעור 1 = מודעות פונולוגית · אי 1). מחליף את ה-placeholders מ-0003.
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
-- ============================================================================


-- 1. practice_href — קישור-תרגול מוכן פר-שיעור
ALTER TABLE public.curriculum_lessons
  ADD COLUMN IF NOT EXISTS practice_href TEXT;

COMMENT ON COLUMN public.curriculum_lessons.practice_href IS
  'קישור-תרגול יחסי מ-underwater-app לשיעור. NULL = אין תרגול דיגיטלי (כתיבה/שיח).';


-- 2. Re-seed — התוכנית השנתית האמיתית (153 שיעורים, סדר-רצף).
--    מוחק את ה-placeholders מ-0003 וטוען את הקאנון האמיתי.
DELETE FROM public.curriculum_lessons;

INSERT INTO public.curriculum_lessons (seq_index, title, objective, practice_href, notes) VALUES
  (1, 'פתיחת שנה — היכרות עם הים והאות הראשונה', 'ספטמבר', 'stage-1-island.html', 'הברות · אי 1'),
  (2, 'ספירת הברות', 'ספטמבר', 'stage-1-island.html', 'הברות · אי 1'),
  (3, 'בידוד צליל ראשון — מודעות פונמית', 'ספטמבר', 'stage-2-island.html', 'צלילים · אי 2'),
  (4, 'האות הראשונה — מ', 'ספטמבר', 'stage-3-shell.html', 'הצדף הקסום'),
  (5, 'המשך אות מ + תרגול', 'ספטמבר', 'stage-3-shell.html', 'תרגול'),
  (6, 'האות השנייה — ת', 'ספטמבר', 'stage-3-shell.html', 'אות ת'),
  (7, 'המשך ת + תרגול חוזר', 'ספטמבר', 'stage-3-shell.html', 'תרגול'),
  (8, 'האות השלישית — ר', 'ספטמבר', 'stage-3-trail-resh.html', 'שביל החזרה'),
  (9, 'מיזוג צלילים — מודעות פונמית', 'ספטמבר', 'stage-5-word-merge.html', 'הרכבת מילה'),
  (10, 'האות הרביעית — ב', 'ספטמבר', 'stage-3-house.html', 'הבית של נוני'),
  (11, 'ב תרגול + השוואה', 'ספטמבר', 'stage-3-bet.html', 'אות ב'),
  (12, 'האות החמישית — ק', 'ספטמבר', 'stage-3-rescue.html', 'הצלת הדגים'),
  (13, 'ק תרגול + סיכום 5 אותיות ראשונות', 'ספטמבר', 'stage-3-tav.html', 'אות ת'),
  (14, 'אות א — תנועה ראשונה', 'ספטמבר', 'stage-3-alef.html', 'אות א'),
  (15, 'אות י', 'ספטמבר', 'stage-3-yud.html', 'אות י'),
  (16, 'אות ל', 'ספטמבר', 'stage-3-lamed.html', 'אות ל'),
  (17, 'אות ש', 'ספטמבר', 'stage-3-shin.html', 'אות ש'),
  (18, 'סיכום ספטמבר — 11 אותיות + הכנה ל-ראמ"ה תחילת שנה — "ה', 'ספטמבר', 'stage-3-het.html', 'אות ח'),
  (19, 'פתיחת אוקטובר — אות ד', 'אוקטובר', 'stage-3-dalet.html', 'אות ד'),
  (20, 'אות פ', 'אוקטובר', 'stage-3-pey.html', 'אות פ'),
  (21, 'אות ה', 'אוקטובר', 'stage-3-hey.html', 'אות ה'),
  (22, 'תרגול 14 האותיות עד כה + הכנת קמץ-פתח', 'אוקטובר', 'stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94', 'סיכום 14 אותיות'),
  (23, 'ניקוד קמץ + פתח (/a/)', 'אוקטובר', 'stage-4-cv-build.html?vowel=patach', 'קמץ-פתח'),
  (24, 'אות ס + ע + ג', 'אוקטובר', 'stage-3-samekh.html', 'אות ס'),
  (25, 'אות כ + צ + ט', 'אוקטובר', 'stage-3-kaf.html', 'אות כ'),
  (26, 'אות ז + ו — 22 אותיות הושלמו!', 'אוקטובר', 'stage-3-zayin.html', 'אות ז'),
  (27, 'תרגול 22 אותיות + קמץ-פתח', 'אוקטובר', 'stage-4-cv-build.html?vowel=patach', 'קמץ-פתח'),
  (28, 'הברה פתוחה (עיצור+תנועה) — מ עם פתח = מַ', 'אוקטובר', 'stage-4-cv-build.html?vowel=patach', 'קמץ-פתח'),
  (29, 'הברה פתוחה (עיצור+תנועה) — תרגול נרחב', 'אוקטובר', 'stage-1-island.html', 'הברות · אי 1'),
  (30, 'סוף אוקטובר — סוף BOY', 'אוקטובר', '../engine/screener.html', 'מבדק'),
  (31, 'ראמ"ה תחילת שנה — "ה — מבחן אבחוני', 'אוקטובר', '../engine/screener.html', 'מבדק'),
  (32, 'פתיחת נובמבר — הברה סגורה (עיצור+תנועה+עיצור)', 'נובמבר', 'stage-1-island.html', 'הברות · אי 1'),
  (33, 'המשך הברה סגורה + ם סופית', 'נובמבר', 'stage-3-mem.html', 'אות ם'),
  (34, 'ן סופית', 'נובמבר', 'stage-3-nun.html', 'אות ן'),
  (35, 'ך ף ץ סופיות', 'נובמבר', 'stage-3-tzadi.html', 'אות ץ'),
  (36, 'קריאת מילים שלמות — תחילת אי 5', 'נובמבר', 'stage-10-little-start.html', 'הַהַתְחָלָה הַקְּטַנָּה · אי 10'),
  (37, 'מיזוג למילים — דו-הברתי', 'נובמבר', 'stage-5-word-merge.html', 'הרכבת מילה'),
  (38, 'המשך מיזוג + תרגול אינטנסיבי', 'נובמבר', 'stage-5-word-merge.html', 'הרכבת מילה'),
  (39, 'מילים מ-5 האותיות הראשונות (ת מ ר ב ק)', 'נובמבר', 'stage-5-word-build.html', 'קריאת מילים'),
  (40, 'אבא, אמא, סבא, סבתא', 'נובמבר', 'stage-vocab-match.html?island=12', 'אוצר מילים · אי 12'),
  (41, 'מילים עם א סופית (אבא, מה, רץ)', 'נובמבר', 'stage-3-alef.html', 'אות א'),
  (42, 'מילים עם ה סופית (פרה)', 'נובמבר', 'stage-3-hey.html', 'אות ה'),
  (43, 'הבנת משפט — כן/לא (אי 8)', 'נובמבר', 'stage-5-word-build.html', 'קריאת מילים'),
  (44, 'תרגול הבנה', 'נובמבר', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (45, 'מילים פעילות + תרגול שטף ראשוני', 'נובמבר', 'stage-read-aloud.html', 'שטף קריאה'),
  (46, 'תרגול חזרתי', 'נובמבר', 'map.html?guest=1', 'תרגול מותאם'),
  (47, 'תרגול חזרתי 2', 'נובמבר', 'map.html?guest=1', 'תרגול מותאם'),
  (48, 'סיכום נובמבר — קריאת מילים שלמות', 'נובמבר', 'stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95', 'סיכום 22 אותיות'),
  (49, 'תחילת דצמבר — שווא נח/נע', 'דצמבר', 'stage-4-cv-build.html?vowel=shva', 'שווא'),
  (50, 'המשך שווא', 'דצמבר', 'stage-4-cv-build.html?vowel=shva', 'שווא'),
  (51, 'תחילת חיריק /i/', 'דצמבר', 'stage-4-cv-build.html?vowel=hiriq', 'חיריק'),
  (52, 'חיריק לעומק', 'דצמבר', 'stage-4-cv-build.html?vowel=hiriq', 'חיריק'),
  (53, 'מילים עם חיריק (מִי, רִי, יִיר)', 'דצמבר', 'stage-4-cv-build.html?vowel=hiriq', 'חיריק'),
  (54, 'תחיליות ו ב ל', 'דצמבר', 'stage-10-little-start.html', 'הַהַתְחָלָה הַקְּטַנָּה · אי 10'),
  (55, 'המשך תחיליות', 'דצמבר', 'stage-10-little-start.html', 'הַהַתְחָלָה הַקְּטַנָּה · אי 10'),
  (56, 'תרגול חיריק + תחיליות', 'דצמבר', 'stage-4-cv-build.html?vowel=hiriq', 'חיריק'),
  (57, 'חזרה לפני חנוכה', 'דצמבר', 'map.html?guest=1', 'תרגול מותאם'),
  (58, 'אחרי חנוכה — סיכום חיריק', 'דצמבר', 'stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95', 'סיכום 22 אותיות'),
  (59, 'מילים תלת-הברתיות (אי 7 גישה)', 'דצמבר', 'stage-5-word-build.html', 'קריאת מילים'),
  (60, 'תרגול', 'דצמבר', 'map.html?guest=1', 'תרגול מותאם'),
  (61, 'תרגול 2', 'דצמבר', 'map.html?guest=1', 'תרגול מותאם'),
  (62, 'סיכום דצמבר', 'דצמבר', 'stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95', 'סיכום 22 אותיות'),
  (63, 'פתיחת ינואר — חיריק חסר + מלא לעומק', 'ינואר', 'stage-4-cv-build.html?vowel=hiriq', 'חיריק'),
  (64, 'המשך חיריק', 'ינואר', 'stage-4-cv-build.html?vowel=hiriq', 'חיריק'),
  (65, 'מילים בנות 3 הברות', 'ינואר', 'stage-5-word-build.html', 'קריאת מילים'),
  (66, 'מילים בנות 4 הברות', 'ינואר', 'stage-5-word-build.html', 'קריאת מילים'),
  (67, 'תרגול שטף — מילים קצרות בקצב', 'ינואר', 'stage-read-aloud.html', 'שטף קריאה'),
  (68, 'תרגול שטף 2', 'ינואר', 'stage-read-aloud.html', 'שטף קריאה'),
  (69, 'ראמ"ה אמצע שנה — "ה — מבדק אמצע שנה', 'ינואר', '../engine/screener.html', 'מבדק'),
  (70, 'אחרי MOY — תרגיל סוגי טעויות', 'ינואר', '../engine/screener.html', 'מבדק'),
  (71, 'מילים שכיחות (אני, יש, של)', 'ינואר', 'stage-8-flash-words.html', 'מילים שכיחות · אי 8'),
  (72, 'המשך מילים שכיחות', 'ינואר', 'stage-8-flash-words.html', 'מילים שכיחות · אי 8'),
  (73, 'תרגול הבנה', 'ינואר', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (74, 'מילים פונקציה — של, את, עם', 'ינואר', 'stage-vocab-match.html?island=12', 'אוצר מילים · אי 12'),
  (75, 'סיכום ינואר', 'ינואר', 'stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95', 'סיכום 22 אותיות'),
  (76, 'פתיחת פברואר — תחילת חולם /o/', 'פברואר', 'stage-4-cv-build.html?vowel=holam', 'חולם'),
  (77, 'חולם חסר', 'פברואר', 'stage-4-cv-build.html?vowel=holam', 'חולם'),
  (78, 'חולם מלא (ו)', 'פברואר', 'stage-4-cv-build.html?vowel=holam', 'חולם'),
  (79, 'אבחנה /i/ — /o/', 'פברואר', 'stage-4-cv-build.html?vowel=hiriq', 'חיריק'),
  (80, 'מילים עם חולם', 'פברואר', 'stage-4-cv-build.html?vowel=holam', 'חולם'),
  (81, 'תרגול שטף עם חולם', 'פברואר', 'stage-4-cv-build.html?vowel=holam', 'חולם'),
  (82, 'המשך אבחנת תנועות', 'פברואר', 'stage-4-cv-build.html?vowel=', 'הברה'),
  (83, 'תרגול הבנת משפט', 'פברואר', 'stage-5-word-build.html', 'קריאת מילים'),
  (84, 'טקסטים קצרים', 'פברואר', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (85, 'תרגול חזרתי', 'פברואר', 'map.html?guest=1', 'תרגול מותאם'),
  (86, 'מילים תלת-הברתיות מורכבות', 'פברואר', 'stage-5-word-build.html', 'קריאת מילים'),
  (87, 'סיכום פברואר + סוף MOY', 'פברואר', 'stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95', 'סיכום 22 אותיות'),
  (88, 'פתיחת מרץ — צירי-סגול /e/', 'מרץ', 'stage-4-cv-build.html?vowel=tzere', 'צירי-סגול'),
  (89, 'צירי', 'מרץ', 'stage-4-cv-build.html?vowel=tzere', 'צירי-סגול'),
  (90, 'סגול', 'מרץ', 'stage-4-cv-build.html?vowel=tzere', 'צירי-סגול'),
  (91, 'אבחנת 4 תנועות', 'מרץ', 'stage-4-cv-build.html?vowel=', 'הברה'),
  (92, 'מילים עם /e/', 'מרץ', 'stage-4-cv-build.html?vowel=tzere', 'צירי-סגול'),
  (93, 'טקסטים', 'מרץ', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (94, 'תרגול שטף', 'מרץ', 'stage-read-aloud.html', 'שטף קריאה'),
  (95, 'הבנת הנקרא ראשונית', 'מרץ', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (96, 'חזרה לפני פורים', 'מרץ', 'map.html?guest=1', 'תרגול מותאם'),
  (97, 'אחרי פורים — תרגול', 'מרץ', 'map.html?guest=1', 'תרגול מותאם'),
  (98, 'מילים תלת-הברתיות', 'מרץ', 'stage-5-word-build.html', 'קריאת מילים'),
  (99, 'תרגול חזרתי', 'מרץ', 'map.html?guest=1', 'תרגול מותאם'),
  (100, 'אבחנת 4 תנועות מאוחדת', 'מרץ', 'stage-4-cv-build.html?vowel=', 'הברה'),
  (101, 'תרגול', 'מרץ', 'map.html?guest=1', 'תרגול מותאם'),
  (102, 'תרגול 2', 'מרץ', 'map.html?guest=1', 'תרגול מותאם'),
  (103, 'סיכום מרץ', 'מרץ', 'stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95', 'סיכום 22 אותיות'),
  (104, 'תחילת קובוץ-שורוק /u/', 'מרץ', 'stage-4-cv-build.html?vowel=shuruk', 'שורוק-קובוץ'),
  (105, 'פתיחת אפריל — קובוץ-שורוק לעומק', 'אפריל', 'stage-4-cv-build.html?vowel=shuruk', 'שורוק-קובוץ'),
  (106, 'שורוק (ו)', 'אפריל', 'stage-4-cv-build.html?vowel=shuruk', 'שורוק-קובוץ'),
  (107, 'קובוץ', 'אפריל', 'stage-4-cv-build.html?vowel=shuruk', 'שורוק-קובוץ'),
  (108, 'השלמת מערכת הניקוד — 5 תנועות', 'אפריל', 'stage-4-cv-build.html?vowel=', 'ניקוד'),
  (109, 'מילים עם /u/', 'אפריל', 'stage-4-cv-build.html?vowel=shuruk', 'שורוק-קובוץ'),
  (110, 'תרגול חזרתי כל הניקוד', 'אפריל', 'stage-4-cv-build.html?vowel=', 'ניקוד'),
  (111, 'חזרה לפני פסח', 'אפריל', 'map.html?guest=1', 'תרגול מותאם'),
  (112, 'אחרי פסח — תרגול שטף', 'אפריל', 'stage-read-aloud.html', 'שטף קריאה'),
  (113, 'טקסטים מנוקדים', 'אפריל', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (114, 'תרגול', 'אפריל', 'map.html?guest=1', 'תרגול מותאם'),
  (115, 'תרגול 2', 'אפריל', 'map.html?guest=1', 'תרגול מותאם'),
  (116, 'סיכום אפריל', 'אפריל', 'stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95', 'סיכום 22 אותיות'),
  (117, 'הכנה ל-EOY', 'אפריל', '../engine/screener.html', 'מבדק'),
  (118, 'פתיחת מאי — הבנת משפט לעומק', 'מאי', 'stage-5-word-build.html', 'קריאת מילים'),
  (119, 'הבנת טקסט קצר', 'מאי', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (120, 'מילות תפל (לתרגול דקודינג)', 'מאי', 'stage-read-aloud.html', 'שטף קריאה'),
  (121, 'תרגול שטף — קריאה אוראלית', 'מאי', 'stage-read-aloud.html', 'שטף קריאה'),
  (122, 'קריאה אוראלית 2', 'מאי', 'stage-read-aloud.html', 'שטף קריאה'),
  (123, 'תרגול חזרתי', 'מאי', 'map.html?guest=1', 'תרגול מותאם'),
  (124, 'טקסטים יותר ארוכים', 'מאי', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (125, 'תרגול', 'מאי', 'map.html?guest=1', 'תרגול מותאם'),
  (126, 'מילות שכיחות', 'מאי', 'stage-8-flash-words.html', 'מילים שכיחות · אי 8'),
  (127, 'תרגול הבנה', 'מאי', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (128, 'ראמ"ה סוף שנה — "ה — מבדק', 'מאי', '../engine/screener.html', 'מבדק'),
  (129, 'אחרי EOY — תרגול חזרתי', 'מאי', '../engine/screener.html', 'מבדק'),
  (130, 'סיכום מאי', 'מאי', 'stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95', 'סיכום 22 אותיות'),
  (131, 'תרגול', 'מאי', 'map.html?guest=1', 'תרגול מותאם'),
  (132, 'תרגול 2', 'מאי', 'map.html?guest=1', 'תרגול מותאם'),
  (133, 'תרגול 3', 'מאי', 'map.html?guest=1', 'תרגול מותאם'),
  (134, 'תרגול 4', 'מאי', 'map.html?guest=1', 'תרגול מותאם'),
  (135, 'תרגול 5', 'מאי', 'map.html?guest=1', 'תרגול מותאם'),
  (136, 'תרגול 6', 'מאי', 'map.html?guest=1', 'תרגול מותאם'),
  (137, 'תרגול 7', 'מאי', 'map.html?guest=1', 'תרגול מותאם'),
  (138, 'סוף מאי', 'מאי', 'map.html?guest=1', 'תרגול מותאם'),
  (139, 'סוף מאי 2', 'מאי', 'map.html?guest=1', 'תרגול מותאם'),
  (140, 'פתיחת יוני — סינתזה', 'יוני', 'stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95', 'סיכום 22 אותיות'),
  (141, 'שטף + הבנה משולבים', 'יוני', 'stage-read-aloud.html', 'שטף קריאה'),
  (142, 'קריאת פסקאות', 'יוני', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (143, 'כתיבה פונטית — אי 6', 'יוני', NULL, 'כתיבה'),
  (144, 'המשך כתיבה', 'יוני', NULL, 'כתיבה'),
  (145, 'תרגול הבנת הנקרא', 'יוני', 'stage-14-read-and-answer.html', 'הבנת הנקרא'),
  (146, 'תרגול', 'יוני', 'map.html?guest=1', 'תרגול מותאם'),
  (147, 'תרגול 2', 'יוני', 'map.html?guest=1', 'תרגול מותאם'),
  (148, 'סיכום שנתי — קריאה', 'יוני', 'stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95', 'סיכום 22 אותיות'),
  (149, 'סיכום שנתי — כתיבה', 'יוני', 'stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95', 'סיכום 22 אותיות'),
  (150, 'סיכום שנתי — הבנה', 'יוני', 'stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95', 'סיכום 22 אותיות'),
  (151, 'סיום שנת תשפ"ז', 'יוני', NULL, 'אירוע כיתתי'),
  (152, 'סיכום + שמירה אישית פר ילדה', 'יוני', 'stage-summary-cv.html?letters=%D7%9E%2C%D7%AA%2C%D7%A8%2C%D7%91%2C%D7%A7%2C%D7%90%2C%D7%99%2C%D7%9C%2C%D7%A9%2C%D7%97%2C%D7%A0%2C%D7%93%2C%D7%A4%2C%D7%94%2C%D7%A1%2C%D7%A2%2C%D7%92%2C%D7%9B%2C%D7%A6%2C%D7%98%2C%D7%96%2C%D7%95', 'סיכום 22 אותיות'),
  (153, 'טקס סיום קריאה', 'יוני', NULL, 'אירוע כיתתי');


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
