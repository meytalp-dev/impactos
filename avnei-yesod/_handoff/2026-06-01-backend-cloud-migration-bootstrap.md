# Bootstrap — Backend Cloud Migration לאבני יסוד · 1.6.2026

> **סוכן זה ירוץ ב-VS Code נפרד מהתזמורת.** התזמורת תאסוף push בסוף לפי tests-as-signal. **scope גדול (~5-7 ימי עבודה).** בנוי כ-4 phases רציפים, כל phase מסתיים ב-checkpoint לתזמורת.

---

## מטרה

לחבר את אבני יסוד ל-Supabase כך ש:

1. **4 מורים** (מיטל פלג, לירון גולן, אופיר שטיינברג, עמית אביטבול) נכנסים ב-login עם email + password
2. **כל מורה יוצרת/מנהלת את הכיתה שלה** ("כיתת מיטל" · "כיתת לירון" · "כיתת אופיר" · "כיתת עמית") עם תלמידיה
3. **כל תלמיד.ה מקבל.ת token ייחודי** → bookmark על הטאבלט (ההורים מקצים את הטאבלטים)
4. **events ו-BKT state ו-MOY/BOY/EOY assessments מסונכרנים ל-cloud** offline-first (write-through)
5. **כל מורה רואה רק את התלמידים של הכיתה שלה** — אבטחה ברמת ה-DB (Row Level Security)
6. **Demo mode (`?presentation=1`/`?guest=1`) נשאר חי** עם 5 dummy students ב-localStorage — לא נוגעים בו

**אסור לדחוף.** התזמורת תעשה push לפי tests-as-signal. אתה רק commit מקומי + checkpoint לתזמורת בסוף כל phase.

---

## מצב בכניסה (snapshot 1.6.2026)

### Repo
- Branch: `main`
- HEAD: `af1ff93` (PIN bypass לpresentation/guest)
- Working tree: WIP של אי 5 (להתעלם — סוכן אחר בעבודה עליו). אסור לדרוס שום קובץ שב-`?? avnei-yesod/underwater-app/stage-5*`, `?? data/island-05-words/`, `?? js/shared/word-adapter.js`, `?? js/templates/mechanic-*.js`.

### Infrastructure שכבר קיימת (לא לדרוס, רק להרחיב)
| קובץ | מה הוא עושה | איך להתערב |
|---|---|---|
| `js/shared/event-logger.js:17-23` | `getStudentId()` קורא `localStorage['avnei-yesod-current-student']` | להרחיב — אם cloud mode → גם student_token. אם demo mode → ימשיך לעבוד כפי שעובד |
| `js/shared/bkt.js:831-871` | `ingestEvent()` dual-write לlocalStorage | להוסיף 3rd write לcloud queue. לא לגעת בlogic של legacy/strand. |
| `js/shared/state.js:62-66` | events FIFO ל-1000 | להרחיב — לפני eviction, push ל-cloud (אם זמין). |
| `student-picker.html` | מסך בחירת תלמידה | demo mode בלבד. ב-cloud mode נחלק dichotomy: token URL ישיר. |
| `seed-demo.html` | יוצר 5 dummy students | **לא לגעת**. demo path. |
| `teacher-action.html`, `teacher-rama.html` | dashboards | להוסיף שכבת auth + scoping ל-cloud mode. presentation/guest מצבים לא נוגעים. |
| `teacher-action.html:760`, `teacher-rama.html:1296` | `TEACHER_PIN='4521'` | להישאר. PIN ימשיך לעבוד כ-demo path. cloud path = login. |

### Auth state בקוד
- `sessionStorage['teacher_authed']` — PIN bypass
- אין concept של teacher_id היום. צריך להוסיף.

### Demo path מצבים (חיוניים — לא לפגוע)
- `?presentation=1` — bypass auth, dashboards מציגים seed data
- `?guest=1` — bypass auth, student-facing flow
- `seed-demo.html?auto=1` — מזריק 5 ילדים (מאיה, נועם, ריף, אריאל, דניאל)

---

## 🏗️ ארכיטקטורה — Dual-Mode

### עיקרון ראשי
```
URL contains ?presentation=1 or ?guest=1
  → DEMO MODE   → localStorage only (existing flow)

else
  → CLOUD MODE  → Supabase + localStorage cache
```

זיהוי mode פעם אחת ב-`js/shared/runtime-mode.js` (קובץ חדש).

### Data model — Supabase Postgres

```sql
-- 1. Teachers (mapped to Supabase auth.users)
CREATE TABLE teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,                         -- 'מיטל פלג', 'לירון גולן', וכו'
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Classes — אחת פר מורה לעת עתה (לא enforce ב-schema, רק convention)
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                         -- 'כיתת מיטל' וכו'
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Students — token-based identity, no password
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                         -- שם מלא או pseudonym
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text, -- ל-URL bookmark
  active BOOLEAN DEFAULT TRUE,                -- revocable
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON students(token);

-- 4. Events — flat table, indexed by student
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,                   -- 'item_answered' · 'mastery_check' · 'session_end' · ...
  payload JSONB NOT NULL,                     -- existing event-logger.js schema
  client_timestamp TIMESTAMPTZ NOT NULL,      -- timestamp שנוצר ב-iPad (offline-friendly)
  server_received_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON events(student_id, client_timestamp DESC);
CREATE INDEX ON events(student_id, event_type);

-- 5. BKT state — single row per student, both legacy + strand
CREATE TABLE bkt_state (
  student_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  legacy_bkt JSONB DEFAULT '{}'::jsonb,       -- avnei-bkt-v1 structure
  strand_bkt JSONB DEFAULT '{}'::jsonb,       -- avnei-bkt-strand-v1 structure
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Assessments — MOY/BOY/EOY
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL,              -- 'BOY' · 'MOY' · 'EOY'
  payload JSONB NOT NULL,                     -- existing underwater-app:assessments structure
  taken_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON assessments(student_id, assessment_type);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bkt_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Teachers: see own profile
CREATE POLICY "teacher_see_self" ON teachers FOR SELECT USING (id = auth.uid());
CREATE POLICY "teacher_update_self" ON teachers FOR UPDATE USING (id = auth.uid());

-- Classes: teacher sees + manages own classes
CREATE POLICY "teacher_see_own_classes" ON classes FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "teacher_insert_own_classes" ON classes FOR INSERT WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "teacher_update_own_classes" ON classes FOR UPDATE USING (teacher_id = auth.uid());
CREATE POLICY "teacher_delete_own_classes" ON classes FOR DELETE USING (teacher_id = auth.uid());

-- Students: teacher sees + manages students of own classes
CREATE POLICY "teacher_see_own_students" ON students FOR SELECT
  USING (class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()));
CREATE POLICY "teacher_manage_own_students" ON students FOR ALL
  USING (class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()));

-- Students can also read themselves via token (handled separately by RPC, see below)

-- Events: teacher sees events of own students
CREATE POLICY "teacher_see_own_events" ON events FOR SELECT
  USING (student_id IN (
    SELECT s.id FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE c.teacher_id = auth.uid()
  ));
-- Events INSERT — done via RPC with token (not direct table insert)

-- BKT state — same scoping as events
CREATE POLICY "teacher_see_own_bkt" ON bkt_state FOR SELECT
  USING (student_id IN (
    SELECT s.id FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE c.teacher_id = auth.uid()
  ));

-- Assessments — same
CREATE POLICY "teacher_manage_own_assessments" ON assessments FOR ALL
  USING (student_id IN (
    SELECT s.id FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE c.teacher_id = auth.uid()
  ));
```

### Student-side RPC (token auth, no login)

```sql
-- Student writes via RPC that validates token
CREATE OR REPLACE FUNCTION ingest_student_event(
  p_token TEXT,
  p_event_type TEXT,
  p_payload JSONB,
  p_client_timestamp TIMESTAMPTZ
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID;
  v_event_id UUID;
BEGIN
  SELECT id INTO v_student_id FROM students WHERE token = p_token AND active = TRUE;
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or revoked student token';
  END IF;

  INSERT INTO events (student_id, event_type, payload, client_timestamp)
  VALUES (v_student_id, p_event_type, p_payload, p_client_timestamp)
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- Student fetches own BKT state
CREATE OR REPLACE FUNCTION get_student_bkt(p_token TEXT)
RETURNS TABLE(legacy_bkt JSONB, strand_bkt JSONB)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT b.legacy_bkt, b.strand_bkt
  FROM bkt_state b
  JOIN students s ON s.id = b.student_id
  WHERE s.token = p_token AND s.active = TRUE;
END;
$$;

-- Student upserts BKT state
CREATE OR REPLACE FUNCTION upsert_student_bkt(
  p_token TEXT,
  p_legacy JSONB,
  p_strand JSONB
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID;
BEGIN
  SELECT id INTO v_student_id FROM students WHERE token = p_token AND active = TRUE;
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or revoked student token';
  END IF;

  INSERT INTO bkt_state (student_id, legacy_bkt, strand_bkt, updated_at)
  VALUES (v_student_id, p_legacy, p_strand, NOW())
  ON CONFLICT (student_id) DO UPDATE
  SET legacy_bkt = EXCLUDED.legacy_bkt,
      strand_bkt = EXCLUDED.strand_bkt,
      updated_at = NOW();
END;
$$;

-- Similar RPCs for assessments
```

**יתרון:** ה-token לא חושף student_id. אם הוא נחשף — אפשר revoke (UPDATE active=FALSE) בלי לשבור את הdb.

### Client-side sync layer

```
js/shared/
  runtime-mode.js          -- detect demo vs cloud mode
  cloud-sync.js            -- write-through queue + retry
  cloud-client.js          -- Supabase JS client wrapper
  event-logger.js          -- (existing) → add 3rd write to cloud-sync.queue()
  bkt.js                   -- (existing) → on ingestEvent, also queue cloud-sync.upsertBkt()
```

**Flow:**
1. Event happens → `event-logger.logActivityResult()` כותב ל-localStorage (כמו היום) **ו-** קורא ל-`cloudSync.queue('event', payload)`
2. `cloud-sync.js` שומר ב-`localStorage['cloud-sync-queue']` (FIFO)
3. Background sync worker (every 5s or on online event) דוחף לקואלוד
4. Successful sync → flush מ-queue
5. Failed sync (offline / 5xx) → exponential backoff, retry

**BKT sync:**
- כל `ingestEvent()` ב-`bkt.js` → queue `upsert_student_bkt(token, legacy, strand)`
- אבל debounce: לא דחיפה לכל event. אגרגציה כל 3 שניות או עזיבת page.

### Auth & onboarding flow

**Teacher login:**
1. `teacher-login.html` — email + password (Supabase auth)
2. ב-success → JWT ב-`localStorage` (Supabase client מנהל)
3. redirect ל-`teacher-action.html` (cloud mode פעיל)

**Teacher first-time setup:**
1. Teacher login לראשונה → רואה "אין כיתה פעילה. צור כיתה"
2. `teacher-setup.html` → form "שם כיתה" (default = "כיתת " + שם המורה)
3. INSERT לטבלת classes
4. אז "הוסף תלמידים" — repeating row form
5. כל student INSERT מחזיר token + URL bookmark
6. Teacher יכולה להדפיס/לשלוח 5 URL-ים (אופציה: QR generation client-side)

**Student onboarding:**
1. ההורה מקבל URL ייחודי: `https://impact-os.app/avnei-yesod/student.html?token=ABCXYZ`
2. ההורה פותח URL בטאבלט של הילדה → לוחץ "הוסף למסך הבית" (PWA-style bookmark)
3. הילדה ה-app יודע token מ-URL → שומר ב-`localStorage['avnei-yesod-student-token']`
4. בכניסות הבאות: ה-bookmark כבר נושא את ה-token, או localStorage מזכיר
5. אם 2 ילדים חולקים iPad: token override ב-URL = משנה ילדה

---

## 📐 Phases — סדרתי, לא במקביל

### Phase 1 — Supabase Foundation (יום 1)

**משימה:** להקים את כל ה-DB infrastructure + migrations.

**Pre-requisite (Meytal):** לתת לסוכן 3 secrets ב-`.env` (היא תעשה את זה לפני שאתה מתחיל):
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # was: SUPABASE_ANON_KEY (new Supabase format 2024+)
SUPABASE_SECRET_KEY=sb_secret_...             # was: SUPABASE_SERVICE_ROLE_KEY · local only, never client-side
```

**ההפרש מה-Supabase החדש:** Supabase שינו את שמות ה-keys באמצע 2024. ה-`sb_publishable_*` הוא ה-anon הישן (בטוח לחשוף client-side). ה-`sb_secret_*` הוא ה-service_role הישן. ה-`supabase-js` v2+ מקבל את שניהם.

ואת 4 user accounts (לירון, אופיר, עמית, מיטל) ב-Supabase Auth dashboard.

**מה הסוכן עושה:**
1. Create `supabase/` directory in repo root
2. Create `supabase/migrations/0001_init.sql` עם כל ה-CREATE TABLE + RLS + RPC לעיל
3. Create `supabase/seed_teachers.sql` — INSERTs לטבלת teachers שמתחברת ל-auth.users (ה-id יוזן ידנית אחרי שמיטל יצרה את ה-4 משתמשים, או דרך trigger AFTER INSERT ON auth.users שמשכפל ל-teachers)
4. Create `supabase/README.md` — איך להריץ migrations:
   - לוקלית: `npx supabase db push` (אחרי `supabase login` + `supabase link`)
   - או דרך SQL Editor ב-dashboard
5. **לבדוק:** הריץ את ה-SQL ב-dashboard Supabase SQL Editor של מיטל (היא תעבירוך). אמת ש-RLS עובד עם 2 בודקים: teacher A inserts class, teacher B שמתחבר לא רואה.

**Checkpoint:** דווח לתזמורת. אסור להמשיך ל-Phase 2 לפני אישור.

### Phase 2 — Cloud Sync Layer (יום 2-3)

**משימה:** לבנות `js/shared/cloud-sync.js` ו-`cloud-client.js` + wire ל-`event-logger.js` ו-`bkt.js`.

**מה הסוכן עושה:**
1. `npm install @supabase/supabase-js` (או CDN import אם אין build step. בדוק `package.json` או `npm-shrinkwrap.json` קודם.)
2. `js/shared/runtime-mode.js`:
   ```js
   export function getRuntimeMode() {
     const params = new URLSearchParams(location.search);
     if (params.has('presentation') || params.has('guest') || params.has('skip-picker')) {
       return 'demo';
     }
     return 'cloud';
   }
   ```
3. `js/shared/cloud-client.js`:
   - Init Supabase JS client עם anon key (קריא מ-`window.__SUPABASE_CONFIG__` שמוזן ב-HTML mounter)
   - Export: `supabase` instance, `getCurrentTeacher()`, `getCurrentStudentToken()`
4. `js/shared/cloud-sync.js`:
   - Queue ב-`localStorage['cloud-sync-queue']` (array של pending operations)
   - `queue(op, payload)` — append
   - `flush()` — iterate queue, call RPC, on success remove
   - Background worker — `setInterval(flush, 5000)` + `addEventListener('online', flush)`
   - Exponential backoff על failures (1s, 2s, 4s, 8s, max 60s)
5. `event-logger.js` (existing):
   - Find `logActivityResult()` function
   - אחרי ה-localStorage write שכבר קיים, הוסף:
     ```js
     if (getRuntimeMode() === 'cloud') {
       cloudSync.queue('event', { type, payload, client_timestamp });
     }
     ```
6. `bkt.js` (existing):
   - אחרי `ingestEvent()` dual-write קיים, הוסף call ל-cloud-sync (עם debounce)
7. **Tests:**
   - הוסף `scripts/test-cloud-sync.js` — mock Supabase responses, וודא queue/flush/retry
   - הוסף `scripts/test-runtime-mode.js` — וודא detection לכל URL param
   - ספור regressions: כל 13 test suites קיימים חייבים להמשיך לעבור

**Checkpoint:** דווח לתזמורת.

### Phase 3 — Teacher UI (יום 3-4)

**משימה:** Login + Setup + Scoped dashboards.

**מה הסוכן עושה:**
1. `teacher-login.html` חדש:
   - Form email + password
   - On submit → Supabase signInWithPassword
   - On success → redirect ל-`teacher-action.html`
   - Forgot password → Supabase resetPasswordForEmail
2. `teacher-setup.html` חדש:
   - אם אין class למורה → "צור כיתה" form (default name = "כיתת " + teacher.name)
   - אחרי class created → "הוסף תלמיד" repeating form
   - כל student INSERT מציג: שם, URL bookmark, כפתור "העתק" + "הורד QR"
3. `teacher-action.html` ו-`teacher-rama.html`:
   - בכניסה → `if (getRuntimeMode() === 'cloud')` → check session. אם אין → redirect ל-login.
   - החלף את `getAllStudents()` הקיים ב-`async getStudents()` שקורא מ-Supabase (כאשר cloud mode)
   - presentation/guest mode → ימשיך לקרוא מ-localStorage כפי שהיום
4. Header bar קטן בכל dashboard: "שלום, מיטל פלג · כיתת מיטל · 5 תלמידים · יציאה"
5. **לא לגעת ב-PIN flow היום** — `?presentation=1` ימשיך לעקוף

**Checkpoint:** דווח לתזמורת.

### Phase 4 — Student Token Flow (יום 4-5)

**משימה:** טאבלט פר ילדה, bookmark, אין login.

**מה הסוכן עושה:**
1. `student.html` חדש (entry-point לטאבלט):
   - אם `?token=XXX` → שמור ב-`localStorage['avnei-yesod-student-token']` + verify ב-Supabase RPC `get_student_bkt(token)`
   - אם token valid → set `localStorage['avnei-yesod-current-student'] = student_id` (ה-mechanism הקיים) + redirect ל-`map.html`
   - אם invalid → "ה-link הזה כבר לא פעיל. דברו עם המורה."
2. `map.html` (existing) — אם cloud mode + אין active token → redirect ל-`student.html`
3. `event-logger.js` — אם cloud mode → `getStudentId()` יחזור את ה-student_id המקושר ל-token (שנשמר ב-localStorage)
4. QR generation: ב-`teacher-setup.html`, השתמש ב-CDN `qrcodejs` (single file, ~20KB) כדי ליצור PNG client-side מ-URL
5. Initial sync on app load: אם יש token + יש wifi → fetch BKT state מ-server, merge עם localStorage (server is source of truth on conflict)
6. **בדיקת חיים:** ילדה משחקת אי 1, לחיצה Y → event מופיע ב-`events` table ב-Supabase תוך 5 שניות. F.21E של המורה רואה את ה-event ב-refresh.

**Checkpoint:** דווח לתזמורת.

### Phase 5 — MOY Migration + E2E Test + Docs (יום 5-7)

**משימה:** assessments ל-cloud + manual testing + onboarding doc.

**מה הסוכן עושה:**
1. Find `underwater-app:assessments` usage ב-codebase. wrap reads/writes ב-cloud-sync (similar pattern ל-events)
2. RPC `ingest_assessment(token, type, payload, taken_at)` ב-Supabase
3. End-to-end test:
   - 4 teachers created
   - 4 classes created
   - 5 students לכל class = 20 students total
   - Login as teacher A → רואה רק את 5 שלו
   - Login as teacher B → רואה רק את 5 שלו
   - Student token A1 plays → event רשום, teacher A רואה, teacher B לא רואה
   - Demo mode `?presentation=1` עדיין עובד עם 5 dummy students בlocalStorage
4. `_handoff/teacher-onboarding-guide.md` — 1-pager לכל מורה:
   - איך login
   - איך ליצור כיתה
   - איך להוסיף תלמיד
   - איך לשלוח URL להורה
   - איך להחיות token (אם הילדה איבדה)
5. `_handoff/parent-onboarding-guide.md` — 1-pager:
   - מה זה ה-URL
   - איך להוסיף למסך הבית בטאבלט
   - מה לעשות אם הטאבלט נופל

**Final checkpoint:** דווח לתזמורת + רשימה מלאה של commits מקומיים.

---

## 🚫 אסור-לגעת בלי אישור פר-קובץ

### מסמכי-אם — לעולם לא לעדכן
- `_handoff/architecture-mvp.md`
- `_handoff/pedagogy-integration-framework.md`
- `_handoff/literacy-grade1-2-yearly.md`
- `_handoff/llm-pitfalls.md`

### Demo mode flow — לא לשבור
- `seed-demo.html` — מזריק 5 ילדים (מאיה, נועם, ריף, אריאל, דניאל). **נשאר כפי שהוא.**
- `?presentation=1` / `?guest=1` / `?skip-picker=1` בכל הקבצים — אסור לקחת מהם feature.
- `TEACHER_PIN='4521'` ב-`teacher-action.html`/`teacher-rama.html` — נשאר חי, רק כ-fallback ל-demo path.

### תוכן מאושר פדגוגית
- 5 קבצי `data/interventions/*.json`
- 60 פריטי `data/moy-items.json`
- 7 packs ב-`data/curriculum/packs/grade1-tashpaz/`
- 25 passages ב-`data/island-14-passages.json` (v2 מאושר)

### עבודה של סוכנים אחרים — לא לגעת
- **אי 5** (סוכן השלמת אי 5 פעיל ב-VS Code אחר):
  - `underwater-app/stage-5-*.html`
  - `underwater-app/data/island-05-words/`
  - `underwater-app/js/shared/word-adapter.js`
  - `underwater-app/js/templates/mechanic-{word-merge,tap-word,word-vs-word,match-word-to-image,word-build}.js`
  - `underwater-app/scripts/generate-island-05-word-audio.py`
  - `underwater-app/scripts/test-{word-adapter,island-5-integration}.js`
- **B.7 interventions** (סוכן פדגוגי אחר):
  - `_tmp_doc.txt`, `_tmp_doc.xml`
- **Presentation / inclusion** (פרויקטים אחרים):
  - `_voice-diag.html`, `teacher-action-v2.html`, `flow-slides-mockup.html`
  - `scripts/e2e/11-presentation-assets.spec.js`, `12-f21e-presentation-screenshots.spec.js`
  - `inclusion/`
  - `english-chativa/`

### Infrastructure shared (additions only, no overwrites)
- `js/shared/bkt.js` — להוסיף call ל-cloud-sync בסוף `ingestEvent`. **לא לגעת** ב-legacy/strand logic, ב-island 5 block, ב-mastery thresholds.
- `js/shared/skill-units.js` — אם נדרש WORD type modification → לא. לא לגעת.
- `js/shared/state.js` — להוסיף flush ל-cloud לפני eviction. לא לגעת ב-FIFO cap.
- `js/shared/event-logger.js` — להוסיף branch לcloud אחרי localStorage write. לא לגעת בschema של events.
- `js/shared/mastery-check.js` — לא לגעת.
- `underwater-app/map.html` — להוסיף בדיקת token redirect. לא לגעת ב-node positions או island visuals.

---

## 🧠 Memory חובה לסוכן זה

לפני שתתחיל phase 1, קרא את אלה ב-`memory/`:

- `reference-avnei-yesod-island-build-checklist` — 11 לקחים פדגוגיים. רלוונטי אם תיגע ב-UI.
- `feedback-orchestrator-multi-vscode-parallel-pattern` — אתה רץ במקביל לסוכן אחר. אסור לדרוס.
- `feedback-orchestrator-auto-push-when-safe` — תזמורת תפוסה את ה-push. אתה לא דוחף.
- `feedback-avnei-yesod-teacher-language-simplicity` — UI טקסט לא ב-BKT/EPA jargon. "שולטת היטב" / "טועה באמצע מילים" / וכו'.
- `feedback-avnei-yesod-niqud-on-student-screens` — כל UI שילד.ה רואה.ת = ניקוד מלא.
- `feedback-kid-block-letters-not-handwriting` — Heebo בלבד.
- `project-avnei-yesod-f21a-vs-f21e-split` — F.21A תצפית, F.21E פעולה. שניהם scoped למורה.

---

## ✅ Success criteria

### Phase 1
- [ ] `supabase/migrations/0001_init.sql` קיים, מכיל את כל הtables + RLS + RPCs
- [ ] SQL הוזרק successfully (validated ע"י מיטל ב-dashboard)
- [ ] 4 teachers ב-`teachers` table, מקושרים ל-`auth.users`
- [ ] RLS test: SELECT * FROM students כ-teacher A מחזיר רק את התלמידים שלו

### Phase 2
- [ ] `js/shared/cloud-sync.js`, `cloud-client.js`, `runtime-mode.js` קיימים
- [ ] `event-logger.js` ו-`bkt.js` כותבים גם ל-cloud (cloud mode)
- [ ] 13 test suites קיימים עוברים (0 regressions)
- [ ] 2 test suites חדשים passing
- [ ] Offline: ילדה משחקת בלי wifi → events ב-queue. עם wifi → flush אוטומטית.

### Phase 3
- [ ] `teacher-login.html` עובד עם 4 חשבונות
- [ ] `teacher-setup.html` יכול ליצור class + 5 students
- [ ] `teacher-action.html` ו-`teacher-rama.html` מציגים רק תלמידים של המורה המחוברת
- [ ] `?presentation=1` ו-`?guest=1` עדיין מציגים demo data

### Phase 4
- [ ] `student.html?token=XXX` מעמיד active student, redirect ל-map
- [ ] Token לא חוקי → הודעת שגיאה ברורה (ניקוד מלא)
- [ ] Event של ילדה X מופיע ב-dashboard של המורה שלה תוך <10 שניות
- [ ] QR code מיוצר ב-`teacher-setup.html` לכל student

### Phase 5
- [ ] MOY assessments מסונכרנים
- [ ] E2E: 4 teachers × 5 students each = 20 students, scoping מאומת
- [ ] Onboarding guides קיימים (teacher + parent)

---

## 📝 דיווח לתזמורת — בסוף כל Phase

צור `_handoff/2026-06-XX-backend-phase-N-checkpoint.md`:

```markdown
# Backend Phase N Checkpoint — DATE

## Status
✅ Phase N complete · Awaiting orchestrator review for Phase N+1

## What was done
[bullet list]

## Files changed
[git diff --stat output]

## Tests
- 13 existing suites: ✓
- N new suites: ✓

## What's NOT done yet (intentionally)
[bullet list — defer to phase N+1 or out of scope]

## For Meytal — manual test
[1-3 specific actions she should try]

## Open questions
[if any]
```

ואז מקרא בצ'אט לתזמורת:
> "☁️ סוכן backend cloud migration סיים phase N. checkpoint ב-`2026-06-XX-backend-phase-N-checkpoint.md`. 0 regressions. ממתין לאישור phase N+1."

---

## 🎬 Final report (אחרי phase 5)

```markdown
# Backend Cloud Migration — Final Report

## Status
✅ All 5 phases complete · Locally committed across X commits · Awaiting push

## What's live
- Supabase project at [URL]
- 4 teachers · 4 classes · ready for real students
- Cloud sync working offline-first
- Demo mode preserved (`?presentation=1` / `?guest=1`)

## Manual test plan for Meytal (before going live)
1. Login as each of 4 teachers, verify scoping
2. Create 5 real students per class
3. Open student URL in incognito → simulate child's tablet
4. Play island 1 → verify event in dashboard
5. Disconnect wifi mid-session → verify resume
6. Open ?presentation=1 → verify demo still works

## Next steps (post-launch)
- Parental consent forms (Meytal to draft)
- GDPR/privacy policy (Meytal/legal)
- Real-time refresh in F.21E (currently poll-based)
- Bulk CSV upload for class of 30
```

---

## 🚨 Final notes

1. **אתה לא דוחף ל-origin.** התזמורת תעשה לפי tests-as-signal.
2. **אם אתה תקוע — שאל את מיטל.** היא מורה, יזמית, וגם מבינה ב-tech. ל-decisions פדגוגיות (אם תיגע ב-UI) — חובה לשאול.
3. **selective commits בלבד.** `git add` ספציפי, אסור `git add . / -A`.
4. **`.env` לא נכנס ל-git.** וודא שמופיע ב-`.gitignore`. אם לא — הוסף.
5. **לא לחשוף service_role_key client-side.** רק ל-server-side scripts (migrations, seeds).
6. **PWA manifest** — אם תרצה bookmark-friendly UX, הוסף `manifest.json` קטן ל-`student.html`. אבל זה אופציונלי.

---

*Bootstrap נכתב ע"י סוכן התזמורת ב-1.6.2026, אחרי שיחת ארכיטקטורה עם מיטל. הוא תקף כסדר מקור-אמת לכל ה-cloud migration. עדכונים יבוצעו רק בתיאום איתה.*
