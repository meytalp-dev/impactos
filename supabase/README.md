# Supabase Backend — Avnei Yesod

תיקיה זו מכילה את ה-database migrations של ה-backend של אבני יסוד.

**Project:** `impact-os-avnei-yesod`
**Project ID:** `ynxfszmpoppqrqocewcs`
**Region:** Central EU (Frankfurt) · `eu-central-1`
**Created:** 2026-06-01

---

## מבנה התיקייה

```
supabase/
├── README.md                          ← הקובץ הזה
└── migrations/
    └── 0001_init.sql                  ← Schema ראשונית: 6 טבלאות + RLS + RPCs
```

---

## איך להריץ את ה-migration הראשונה (פעם אחת)

### דרך A — SQL Editor ב-Dashboard (הכי קל לפעם הראשונה)

1. פתחי https://supabase.com/dashboard/project/ynxfszmpoppqrqocewcs/sql/new
2. פתחי את הקובץ `migrations/0001_init.sql` ב-IDE
3. העתיקי את **כל** התוכן (Ctrl+A → Ctrl+C)
4. הדביקי ב-SQL Editor של Supabase
5. לחצי **Run** (או Ctrl+Enter)
6. את אמורה לראות הודעה ירוקה: `Success. No rows returned`

### דרך B — Supabase CLI (לעדכונים עתידיים)

לשימוש מתקדם, אם תרצי בעתיד לעדכן את ה-schema בצורה מתועדת ב-git.

```bash
# התקנה ראשונית (פעם אחת)
npm install -g supabase

# התחברות (פעם אחת — יפתח דפדפן)
supabase login

# קישור הproject (פעם אחת לכל מכונה)
supabase link --project-ref ynxfszmpoppqrqocewcs

# הרצת migrations
supabase db push
```

---

## אימות שה-migration הצליחה

ב-SQL Editor, הריצי את הqueries הבאים אחד אחד:

### 1. בדיקה שכל הטבלאות נוצרו
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```
**תוצאה מצופה:** 6 שורות — `assessments`, `bkt_state`, `classes`, `events`, `students`, `teachers`

### 2. בדיקה ש-RLS מופעל
```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
**תוצאה מצופה:** כל 6 הטבלאות עם `rowsecurity = true`

### 3. בדיקה שה-trigger קיים
```sql
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';
```
**תוצאה מצופה:** `on_auth_user_created`

### 4. בדיקה שה-RPCs קיימים
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```
**תוצאה מצופה:** 5 functions — `get_student_bkt`, `get_student_profile`, `handle_new_user`, `ingest_student_assessment`, `ingest_student_event`, `upsert_student_bkt`

---

## אחרי שה-migration הצליחה — הוספת מורים

ה-trigger `on_auth_user_created` ידחוף אוטומטית כל משתמש חדש שייווצר ב-Authentication ל-`public.teachers`.

### זרימה לכל מורה:

1. ב-Supabase Dashboard → **Authentication → Users → Add user → Create new user**
2. Email + Temp password + ✅ Auto Confirm User
3. ה-trigger ירוץ. ב-SQL Editor:
   ```sql
   SELECT * FROM public.teachers ORDER BY created_at DESC;
   ```
   צריכה לראות את ה-row של המורה החדש.
4. אם השם default (= local part של ה-email) לא מתאים — לערוך:
   ```sql
   UPDATE public.teachers SET name = 'מיטל פלג' WHERE email = 'meytalp@bethaarava.ort.org.il';
   ```

---

## מודל הנתונים — סקירה מהירה

```
auth.users (Supabase)
    │
    │ trigger: on_auth_user_created
    ▼
public.teachers ──< public.classes ──< public.students ──< public.events
                                              │             public.bkt_state (1:1)
                                              │             public.assessments
                                              │
                                              token (URL-safe UUID)
                                                │
                                                ▼
                                          student.html?token=...
                                          (no password, parent bookmarks)
```

**RLS rules:**
- Teachers see only their own classes/students/events/bkt/assessments (`teacher_id = auth.uid()`)
- Students never authenticate. They call RPCs with their token. RPCs verify the token before any write.

---

## Migrations עתידיות

כשתצטרכי להוסיף/לשנות schema:

1. צרי קובץ חדש: `migrations/0002_<short_description>.sql`
2. כתבי את ה-`ALTER TABLE` / `CREATE TABLE` שצריך
3. Run דרך SQL Editor (העתק-הדבק) או דרך `supabase db push`
4. **תעדי תמיד את ה-WHAT וה-WHY בראש הקובץ** — כמו ש-`0001_init.sql` עושה

---

## אבטחה

- `SUPABASE_PUBLISHABLE_KEY` (sb_publishable_*) — בטוח לחשוף client-side. RLS מגן.
- `SUPABASE_SECRET_KEY` (sb_secret_*) — **לעולם לא ב-client-side**. רק ב-`.env` של scripts מקומיים.
- `.env` חסום ב-`.gitignore` ולא יעלה ל-GitHub.
- כל ה-RPCs לתלמיד.ה מוודאים שה-token תקף ו-`active = TRUE` לפני כל פעולה.

---

## ניקוי לעת חירום (Disaster Recovery)

אם הוצעו טבלאות לא תקינות וצריך להתחיל מחדש — **זהירות, זה ימחק את כל ה-data**:

```sql
DROP TABLE IF EXISTS public.events       CASCADE;
DROP TABLE IF EXISTS public.bkt_state    CASCADE;
DROP TABLE IF EXISTS public.assessments  CASCADE;
DROP TABLE IF EXISTS public.students     CASCADE;
DROP TABLE IF EXISTS public.classes      CASCADE;
DROP TABLE IF EXISTS public.teachers     CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.ingest_student_event;
DROP FUNCTION IF EXISTS public.get_student_bkt;
DROP FUNCTION IF EXISTS public.upsert_student_bkt;
DROP FUNCTION IF EXISTS public.ingest_student_assessment;
DROP FUNCTION IF EXISTS public.get_student_profile;
```

ואז להריץ שוב את `0001_init.sql`.
