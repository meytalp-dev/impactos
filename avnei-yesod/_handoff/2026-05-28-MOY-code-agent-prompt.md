# Handoff — MOY-Lite Code Agent (Session חדש)

> מיטל: העתיקי את כל מה שמתחת לקו הראשון של "---" כפרומפט פתיחה לסשן Claude Code חדש.

---

## משימה

שלב הסיום של MOY-Lite. הביקורת הפדגוגית של 60 הפריטים סגורה. עכשיו עליך לחבר אותם ל-engine הקיים.

## הקשר

"אבני יסוד" = מערכת תרגול אדפטיבית לרכישת קריאה בעברית בכיתה א'. MOY-Lite = Middle-of-Year diagnostic tool — תוסף ל-מבדק ראמ"ה הרשמי, מבוסס משימות 3 (הבנת טקסט מושמע) + 4 (מודעות לשונית).

תשתית קיימת (Spec §7): `engine/moy-screener.html` + `state.assessments` + `js/shared/assessments.js`. **שלב 10 כבר הריץ את התשתית עם 2-3 פריטים dummy.**

## קבצי-מקור — חובה לקרוא לפני עבודה

1. **Spec פדגוגי:** `avnei-yesod/_handoff/2026-05-28-MOY-diagnostic-spec.md` — מבנה state, threshold-ים, חוקי repeat, acceptance criteria.
2. **60 פריטים מאושרים:** `avnei-yesod/_handoff/2026-05-28-MOY-items-approved-60.json` — output הסקירה הפדגוגית. **מקור-האמת לתוכן.**
3. **קובץ dummy נוכחי:** `avnei-yesod/engine/moy-items.json` — תשתית עם 2-3 פריטים dummy. **יוחלף ב-60 המאושרים.**
4. **Screener:** `avnei-yesod/engine/moy-screener.html` — להבין מבנה הרצה.
5. **Assessments API:** `avnei-yesod/js/shared/assessments.js`.
6. **Feedback memories גלובליים** (חובה):
   - `feedback-avnei-yesod-niqud-on-student-screens` — כל טקסט שתלמיד.ה רואה לבד = ניקוד מלא.
   - `feedback-avnei-yesod-cross-screen-navigation-uses-history-back` — חזרה ל-teacher-rama דרך history.back().

## החלטות ארכיטקטורה שנפלו עם מיטל

### 1. מבנה משימה 3 שונה מה-dummy
- **dummy נוכחי:** 1 passage × 3 שאלות (passage_id + questions[])
- **תוכן מאושר:** 30 passages × 1 שאלה לכל item (item_id + passage_text + question_text + options)
- **החלטה:** מבנה התוכן המאושר מנצח. הוא עדיף פדגוגית — כל פריט בודק הבנה רעננה.
- **פעולה:** עדכן את `moy-screener.html` למשוך פריטים במבנה החדש (item_id יחיד עם passage+question), לא במבנה ה-passage-עם-שאלות-מקוננות הישן.

### 2. מאגר 30 פריטים, מבדק שואב 10
- ה-pool למשימה 3 = 30 פריטים. המבדק עצמו = **10 שאלות אקראיות** מתוך ה-30 (threshold 7/10).
- מטרה: מאגר רחב למקרה repeat (אחרי fail, חזרה אחרי 5-6 שבועות בלי לחזור על אותם פריטים).
- **פעולה:** הוסף `randomSelectItems(pool, n)` ב-screener — בחירה אקראית של 10 מתוך 30 לכל סשן.

### 3. משימה 4 — מבדק שואב 22 מתוך 30
- pool למשימה 4 = 30 פריטים, מחולקים ל-3 sub_types (10 כל אחד): open_close + syllables + phonemes.
- **המבדק = 22 שאלות אקראיות:** 7+8+7 (או חלוקה דומה) מ-3 ה-sub_types. threshold 16/22.
- **פעולה:** לוגיקת בחירה תזוז סוג אחרי סוג כדי לשמור על איזון.

### 4. אודיו AvriNeural — חסר
- 60 הפריטים מכילים `audio_description` (text) אך אין `audio_url`.
- **פעולה:** שדרוג אופציונלי (לא חוסם): צור סקריפט `tools/generate-moy-audio.js` שיוצר MP3 לכל פריט תחת `assets/audio/moy/{item_id}.mp3`. עד אז — `moy-screener.html` ישתמש ב-Web Speech API (`speechSynthesis`) כ-fallback.

## משימות (להריץ ברצף)

1. ☐ קרא את כל קבצי המקור לעיל.
2. ☐ העתק את כל 60 הפריטים מ-`_handoff/2026-05-28-MOY-items-approved-60.json` אל `engine/moy-items.json`, במבנה ה-schema הקיים (task_3 + task_4) אך עם ה-item-structure החדש (item_id × 1 question per item במשימה 3).
3. ☐ עדכן את `_meta` ב-`moy-items.json` — version: "1.0", items_count: 60, אזכר את ה-handoff source.
4. ☐ עדכן את `moy-screener.html`:
   - הסר התייחסות למבנה `passages[].questions[]` הישן.
   - אמץ פלאט-array `items[]` עם 1 שאלה לכל item.
   - הוסף `randomSelectItems(pool, n)` לבחירת 10 מתוך 30 (task_3) ו-22 מתוך 30 עם איזון sub_type (task_4).
   - הוסף Web Speech API fallback (`speechSynthesis.speak(new SpeechSynthesisUtterance(text, {lang: 'he-IL'}))`) אם `audio_url` חסר.
   - שמור ניקוד מלא בכל UI strings (לפי [[feedback-avnei-yesod-niqud-on-student-screens]]).
5. ☐ הריצי `test-moy-assessments.js` הקיים — ודא שהוא עובר עם המבנה החדש (יתכן יידרש לעדכן אותו).
6. ☐ בדיקה ידנית: פתחי `engine/moy-screener.html?student=test&task=3` — ודאי 10 פריטים נטענים, אודיו עובד, תשובה נשמרת.
7. ☐ אותו דבר ל-task=4 — ודאי 22 פריטים, מתוכם איזון בין sub_types.
8. ☐ עדכון Section 6 ב-`teacher-rama.html` — לוודא שהסטטוס מתעדכן אחרי הרצה.
9. ☐ commit עם הודעה: `MOY-Lite — אינטגרציה של 60 פריטים מאושרים פדגוגית + שינוי מבנה passage→item`.

## Acceptance Criteria

- [ ] `engine/moy-items.json` מכיל 30 פריטי משימה 3 + 30 פריטי משימה 4 (10 פר sub_type).
- [ ] `moy-screener.html` בוחר 10 אקראיים למשימה 3 ו-22 מאוזנים למשימה 4.
- [ ] אודיו מתנגן (AvriNeural file או Web Speech fallback).
- [ ] תשובות נשמרות ל-`state.assessments.moy[studentId].attempts[]`.
- [ ] threshold logic: task_3 ≥7 = pass · task_4 ≥16 = pass · overall = both pass.
- [ ] אחרי סיום — `teacher-rama.html` Section 6 מציג סטטוס נכון.
- [ ] **לא** מציג ציון לתלמידה.
- [ ] בדיקות test-moy-assessments.js עוברות.
- [ ] בכל UI strings — ניקוד מלא (מסך תלמיד).

## אסור לך

- לערוך את `_handoff/2026-05-28-MOY-items-approved-60.json` — זה output הסקירה הפדגוגית, אסור לערוך.
- לשנות תוכן פריטים (passage_text, question_text, options). תיקוני ניקוד = רק לבקש ממיטל.
- להוסיף "תכונות חכמות" שלא ב-spec (ML, AI suggestions, וכו'). MOY-Lite הוא diagnostic סטטי.

## בספק

שאלי את מיטל — היא קוראת פעיל.
