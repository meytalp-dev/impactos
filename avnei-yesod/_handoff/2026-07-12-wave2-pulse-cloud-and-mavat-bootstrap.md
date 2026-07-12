# גל 2 · בקאנד לפולס + "מבט משולב" + "פולס בית-ספרי" אמיתיים — Bootstrap לסוכן חדש

**נכתב:** 12.7.2026 · ע"י סוכן גל 1 (מסלול מנהלת · אבני יסוד)
**מיועד ל:** סוכן חדש שיבנה את גל 2 באופן עצמאי.
**קרא/י קודם:** קובץ זה מלמעלה למטה, ואז את הקבצים המסומנים 🔎.

---

## 0. תמונת המצב — מה כבר קיים אחרי גל 1

בגל 1 חיברנו את **דשבורד המנהלת של אבני יסוד** (קריאה) לענן האמיתי:

| מה | קובץ | מצב |
|---|---|---|
| מיגרציה: `schools` + `teachers.role`/`school_id` + RLS למנהלת + RPCs | `supabase/migrations/0007_schools_principal.sql` | ✅ הורצה בענן |
| עמוד שער אמיתי (כניסה+הרשמה מורה/מנהלת, מודל "קוד בית ספר") | `avnei-yesod/underwater-app/gate.html` | ✅ |
| שכבת דאטה חוצה-כיתות למנהלת | `avnei-yesod/underwater-app/js/shared/principal-cloud.js` | ✅ |
| דשבורד מנהלת אמיתי (מפת כיתות, טיר, ילדים-לא-לפספס, שימוש-מורות) | `avnei-yesod/underwater-app/principal-avnei.html` | ✅ |

**מודל הקישור (מאושר ע"י מיטל):** קוד בית ספר. מנהלת נרשמת → `create_school()` → מקבלת `join_code` (למשל `AV-7F3A9`). מורה נרשמת ומזינה את הקוד → `join_school(code)` → `teachers.school_id` נקבע. RLS למנהלת (policies נוספים ב-OR ל-0001) מאפשר לה לקרוא את כל `classes/students/events/bkt_state/assessments` של בית-הספר, דרך פונקציות SECURITY DEFINER: `my_school()`, `my_role()`, `principal_class_ids()`, `principal_student_ids()`.

**הענן:** Supabase `impact-os-avnei-yesod`, ref `ynxfszmpoppqrqocewcs`, EU. פעיל. `mailer_autoconfirm=false` (אישור-מייל נדרש — הגייט מטפל דרך pending-action ב-localStorage). קונפיג ציבורי: `js/shared/cloud-config.js`.

---

## 1. המשימה של גל 2

מיטל בחרה לחבר **את כל שלושת מסכי המנהלת**. גל 1 עשה את הראשון. גל 2 = השניים התלויים בפולס:

1. **פולס בית-ספרי** (מנהלת) — 🔎 מקור עיצוב: `demo/principal-pulse.html`
2. **מבט משולב · למידה ורגש** — 🔎 מקור עיצוב: `demo/mavat-meshulav.html` (מנהלת) + `demo/teacher-mavat.html` (מורה)

### 🔴 החסם המרכזי: לפולס אין בקאנד בכלל

`pulse-grade1/pulse-questionnaire.html` שומר **הכול ב-localStorage** (`'pulse-demo-responses'`), ומצהיר במפורש "דמו בלבד... בפיילוט האמיתי: שליחה ל-backend". כלומר **אין דאטת-פולס בשום ענן.** לכן גל 2 = **לבנות בקאנד לפולס מאפס**, ורק אז לחבר את שני המסכים. זה הרוב של העבודה.

---

## 2. ארכיטקטורה מוצעת (לאישור מיטל לפני קידוד)

### 2.1 מיגרציה `0008_pulse.sql`
טבלה אחת מרכזית, בסגנון `events` (flat, indexed):

```sql
CREATE TABLE public.pulse_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  respondent    TEXT NOT NULL CHECK (respondent IN ('student','teacher','parent')),
  cycle         TEXT NOT NULL,          -- מזהה מחזור (למשל '2026-W28' דו-שבועי / חודשי)
  answers       JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {dimension: value} · CASEL hidden
  taken_at      TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
- **RLS:** בדיוק כמו events — מורה רואה תלמידי-כיתתה (`students_select_own`-style), מנהלת רואה `student_id IN (SELECT public.principal_student_ids())`. שכפל/י את דפוס ה-policies מ-0001 §4.4 + 0007 §4.5.
- **כתיבת תלמיד (ללא auth):** RPC `ingest_pulse_response(p_token,...)` בסגנון `ingest_student_event` (0001 §5.1) — הפולס של הילד.ה נכתב מול ה-token של התלמיד.ה, לא מול auth.
- **כתיבת מורה/הורה:** מורה מזוהה (auth) כותבת ישירות (RLS מתירה INSERT לתלמידי-כיתתה) — הוסף/י policy INSERT. הורה — דרך token או קישור ייעודי (ראה §2.4).

### 2.2 קישור פולס↔אבני-יסוד
פולס כבר משתמש במושג "כיתה"/"תלמיד". **חובה לאחד** על אותם `students`/`classes` של אבני-יסוד — אחרת אין "מבט משולב". כלומר: הפולס של הילד.ה נכתב עם ה-`student_id` הקנוני. השאלון (`pulse-questionnaire.html`) צריך לקבל `?token=` של התלמיד.ה (כמו אפליקציית הילד.ה) ולכתוב דרך `ingest_pulse_response`.

### 2.3 שכבות דאטה (בסגנון גל 1)
- `js/shared/pulse-cloud.js` — helpers: טעינת pulse_responses, אגרגציה פר-מימד/כיתה, מיפוי לרמות.
- הרחבת `principal-cloud.js` (או מודול נלווה) לאגרגציית-פולס בית-ספרית.
- **מבט משולב** = הצלבה פר-`student_id`: ציר למידה (מ-`bkt_state`/`profiles` הקיימים) × ציר רגש (מ-`pulse_responses`). ראה `demo/mavat-meshulav.html` לקווודרנטים (מתקדם/מתקשה × פנוי/לא-פנוי רגשית).

### 2.4 הורים
מזכר מיטל: **פולס הורים = כן בפיילוט**, חודשי, `pulse-parent-monthly.html`. צריך מסלול כתיבה להורה (token להורה או מגנייה נפרדת). **החלטה פתוחה — לאשר עם מיטל.**

---

## 3. מסכים לבנות/לחבר (אחרי הבקאנד)

| מסך אמיתי חדש | מבוסס על (דמו) | הערות |
|---|---|---|
| `pulse-principal.html` (או תחת `pulse-grade1/`) | `demo/principal-pulse.html` | תמונת רווחה בית-ספרית · דרך `principal-cloud`+`pulse-cloud` |
| `mavat-meshulav.html` אמיתי (מנהלת) | `demo/mavat-meshulav.html` | הצלבה פר-ילד.ה |
| `teacher-mavat.html` אמיתי (מורה) | `demo/teacher-mavat.html` | אותה הצלבה, מוגבל לכיתה |
| חיווט השאלון לענן | `pulse-grade1/pulse-questionnaire.html` | להוסיף `?token=` + `ingest_pulse_response` במקום localStorage |

**חיווט ניווט:** ב-`principal-avnei.html` (גל 1) שני פריטי-הרייל "למידה ורגש" ו"פולס" הם כרגע `data-toast="…בגל הבא"`. כשגל 2 מוכן — החלף/י אותם ל-`<a href>` אמיתי. חפש/י את המחרוזת `בגל הבא` בקובץ.

---

## 4. דפוסים לשמור עליהם (למד/י מגל 1)

- **מבנה מודול-ענן:** ראה `principal-cloud.js` — `init()` ממומואיזד, שער-אימות (אין session → `gate.html`, לא-מנהלת → הפניה), Promise.all לטעינה, helpers טהורים.
- **שימוש חוזר ב-`TeacherCloud`:** ה-helpers הטהורים (`computeProfiles/rama/knownRatio/isLive/formatLast`) — `principal-cloud` תלוי בהם. `pulse-cloud` יכול לחיות לבד.
- **RLS SECURITY DEFINER:** כדי למנוע רקורסיה ב-policies, נתב/י דרך `principal_student_ids()` (כבר קיים מ-0007) — אל תכתוב/י subquery ישיר על students בתוך policy של students.
- **עמיד ל-file://:** `if (location.protocol==='file:') throw 'cloud-unavailable-file'`.
- **עיצוב (DESIGN-LOCK):** מסכי-מורה/מנהלת = **לבן + Rubik**, override ל-demo.css (ראה ראש `principal-avnei.html` וזיכרון `reference-teacher-screens-design-system`). פסטל-שונית, לא #2E7D8C. מסכי-ילד.ה = **ניקוד מלא חובה**.
- **פרטיות-ילד:** אסור צבעי-סטטוס במסכי ילד.ה. בפולס — מיוחד: זיכרונות `feedback-audio-*`, `project-inclusion-pulse-*`.

## 5. החלטות פולס שכבר נעולות (זיכרון מיטל — לא לפתוח מחדש)
3 פנים · forced-choice · מורה דו-שבועי · הורה חודשי · WhatsApp ידני · CASEL hidden. פתוח: זמינות יועצת, מסלול-כתיבת-הורה (§2.4). מיקום קנוני: **`impactos/pulse-grade1/`** (הריפו הישן מאורכב, אודיו ב-gitignore).

## 6. אימות
כתוב/י smoke-test בסגנון `scratchpad/smoke-principal.sh` של גל 1 (admin-API עוקף אישור-מייל): יוצר תלמיד+token → `ingest_pulse_response` → מאמת שהמנהלת רואה אגרגציה בית-ספרית ושמורה זרה לא רואה. נקה/י משתמשי-בדיקה בסוף.

## 7. סדר עבודה מומלץ
1. אשר/י עם מיטל: מודל pulse_responses + מסלול-הורה + מיקום הקבצים.
2. מיגרציה 0008 (מיטל מריצה ב-SQL Editor — DDL לא רץ דרך REST).
3. חיווט `pulse-questionnaire.html` לענן (token → ingest).
4. `pulse-cloud.js` + אגרגציה.
5. `pulse-principal.html` → אחר-כך `mavat-meshulav.html` (הצלבה) → `teacher-mavat.html`.
6. חיווט הרייל ב-`principal-avnei.html` (הסרת ה-toast "בגל הבא").
7. smoke-test + עדכון זיכרון.
