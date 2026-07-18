# אשף הקמת בית ספר · setup.html — Handoff לחיווט אמיתי (18.7.2026)

## מה נבנה (מוכן, דמו מלא מקצה-לקצה)

**קובץ יחיד:** `avnei-yesod/underwater-app/setup.html` — דף-על אחד שמחליף בפועל את `gate.html`.
מנוע-אשף בהשראת אשף רצף לימודי (`Downloads/ort-presentation-builder/_drafts/emergency-learning/onboarding-wizard.html`),
בשפת ה-DESIGN-LOCK של אבני יסוד (`design-lock.html`: סגול-נוני + ורוד-חתימה + נקודה ורודה=סוף-משפט, Heebo/Rubik/Fredoka).

### מבנה: טאבים = 3 שלבים (מערכת אחת, לא בורר-תפקיד)
פס-שלבים מחובר בראש ①─②─③ תמיד גלוי, לחיץ, התקדמות נשמרת פר-טאב (`S.stepByRole`).
מתחת: מסגרת קבועה (כותרת+נוני) + stepper פנימי + כרטיס-מורף + ניווט הבא/חזרה.

- **שלב 1 · מנהלת:** כניסה/הרשמה → פרטי בי"ס → **כיתות ומורות** (כל שורה = שם כיתה + שם מורה, ולכל אחת **קוד-כיתה משלה**; "טען 4 כיתות לדוגמה") → **מוכנות** (טבלת כיתות·מורות·קודים + שליחה לכל מורה בנפרד וא/מייל/העתקה + כרטיס-סיכום).
- **שלב 2 · מורה:** כניסה עם **קוד-הכיתה שלה** (שדה-קוד תמיד מוצג, ראשון) → הכיתה **מזוהה מהקוד** (שם+מורה מולאו ע"י המנהלת, אין שלב שם-כיתה) → **רק מוסיפה תלמידים** (העלאת Excel/CSV · הדבקה · ידני · "טען דוגמה") → **קודים לתלמידים**: QR פר-תלמיד + קוד-טקסט מתחת + כפתורי "העתק קוד"/"העתק QR" לכל אחד + "הדפסת דף הקודים" → מוכנות.
- **שלב 3 · תלמיד:** סורק את ה-QR שלו (`?scode=`) → זיהוי ישיר → מיפוי. בדמו: בוחר שם.

### החלטות מוצר שננעלו (מיטל)
1. שרשרת (לא מנהל-מקים-הכל), עם פוליש-רצף.
2. **קוד-פר-כיתה**, לא קוד-בי"ס אחד. לכל מורה קוד משלה.
3. המורה לא נותנת שם לכיתה — הכיתה כבר קיימת עם שם מהמנהלת; היא רק מוסיפה תלמידים.
4. **לכל תלמיד קוד משלו, כ-QR** (+ קוד-טקסט לגיבוי/הקלדה).
5. תלמיד גיל 6 = לא מקליד; סורק QR או נוגע בשם.

### טכני
- **classic script (לא module)** + Supabase UMD + XLSX (sheetjs) + **qrcodejs (cdnjs 1.0.0)** — כדי שהדמו ירוץ גם מ-`file://`. הערה: node-qrcode לא עבד בדפדפן → עברנו ל-qrcodejs.
- Dual-mode: `DEMO = file:// || ?demo=1 || אין Supabase`. בדמו הכול localStorage.
- אומת headless (Edge `--dump-dom` / `--screenshot`): אין שגיאות JS.
- gate-landing כרטיסי-תפקיד → `setup.html?role=principal|teacher|student`.
- localStorage keys: `avnei-principal-classes` (כיתות+קודים), `avnei-rosters` (code→[names]), `avnei-student-codes` (scode→name), `avnei-teacher-setup`.

---

## מה חסר לחיווט אמיתי (המשימה של השיחה הבאה)

היום הכול **צד-לקוח (localStorage)**. כדי לעבוד באמת בענן:

### 1. Supabase — לשחזר (מושהה!)
הפרויקט מושהה. Restore → probe → smoke. ראה [[project-avnei-yesod-cloud-architecture]].
מיגרציות קיימות: 0007 (schools/role/RLS-מנהלת), create_school/join_school/get_my_context. טבלת `classes` קיימת (teacher_id, school_id, name).

### 2. מיגרציה חדשה (0010) — קוד-פר-כיתה + קוד-פר-תלמיד
- `classes.join_code` unique (הקוד שהמורה מזינה). + `classes.teacher_name` (שם המורה שהמנהלת הזינה, לפני שיש teacher_id).
- `students.join_code`/token לכל תלמיד (ל-QR). אולי לנצל טוקן קיים.
- RPCs: `create_class(p_school_id,p_name,p_teacher_name)`→join_code · `join_class(p_code)` (משייך את המורה המחוברת ל-class + מחזיר class) · `resolve_class(p_code)`→{name,teacher_name} (לאישור בצד-מורה) · `resolve_student(p_code)`→token (לכניסת-תלמיד מ-QR).
- RLS: מורה רואה רק את הכיתה שלה; מנהלת את בית-הספר.

### 3. חיווט setup.html לענן (החלפת ה-demo paths)
- `classesStep.next`: `create_class` פר-שורה → להחליף demoCode ב-join_code אמיתי.
- `authStep` (מורה): `join_class(code)` במקום join_school; `resolve_class` לזיהוי שם הכיתה/מורה.
- `rosterStep.next`: insert students תחת ה-class הנכון + הפקת קוד/טוקן פר-תלמיד.
- `qrStep`/`qrURL`: ה-QR יקודד URL אמיתי (https) לכניסת-התלמיד (`student.html?token=...` או `setup.html?scode=...`→resolve_student→token).
- boot `?scode`: `resolve_student` → student.html עם הטוקן.
- כל ה-cloud paths כבר יש בהם שלד best-effort (`if(!DEMO && sb){...}`) — להשלים.

### 4. Deploy + חשבונות-בדיקה
- להעלות setup.html+gate-landing לאתר החי; לכוון את כרטיסי-השער.
- חשבונות חיים: `menahelet@bdika-impactos.com` / `mora@bdika-impactos.com` · `Bdika-2026` · קוד `AV-BDIKA` (ראה [[project-avnei-yesod-live-test-accounts]]). seed: `scratchpad/sb-seed.js`.

### 5. פדגוגיה/פרטיות שלא לשכוח
- שמות תלמידים אמיתיים = רגיש; אין צבעי-סטטוס במסך ילד ([[feedback-demo-wording-and-child-privacy]]).
- ניסוח "הוכנסו" לא "נטענו".

---

## נקודות פתוחות לאישור מיטל
- כתובת ה-QR הסופית (https של האתר החי) — לוודא שסריקה בטלפון פותחת את התלמיד הנכון.
- האם קוד-טקסט לתלמיד נשאר גם בגרסה האמיתית (כרגע: כן, גם וגם).
- העתקת-QR ללוח מול הורדת-PNG (fallback) — לבדוק מה עובד באתר החי (secure context).
