# אבני יסוד · סיכום סשן 13.7.2026 + פלואו בדיקות (מסירה לשיחה הבאה)

> מטרת המסמך: מיטל רוצה לבדוק את המערכת **על האתר החי** מקצה-לקצה — פרופיל אורייני
> בכניסה ראשונה → תרגול → מה שהמורה רואה ל-4 תלמידים → מה שהמנהלת רואה. הכל אמיתי
> לפי המיפוי (בלי דאטה מזויפת).

---

## ✅ מה בוצע בסשן הזה (הכל עלה ל-main / חי על impact-os.app)

| commit | מה |
|---|---|
| `9b1c893` | תיקוני QA: קריסת TDZ בדשבורד מורה (PLAN_BUCKET הוקדם) · לוגו 🐟→נוני · CTA במסך הורה |
| `d4ddfc2` | מובייל: `demo.css` ≤560px rail→bottom-nav לכל מסכי מורה/מנהלת · נגישות: `:focus-visible` (demo.css+tokens.css) |
| `9c7aac8` | פרטיות הקראה: שער-הסכמה חד-פעמי + שורת-פרטיות (אומת בקוד השרת שהאודיו נמחק מיד) |
| `0bd0dc9` | **פרופיל אורייני בכניסה ראשונה**: student.html מנתב תלמיד לא-מוצב ל-boy-check; boy-check מזריק אי-פתיחה + דגל + כפתור "להתחיל לתרגל" |
| `360beeb` | מיגרציה `0009_boy_auto_placement.sql` (record) — **טרם הורצה ב-SQL Editor** |

בדיקת QA רחבה קדמה לזה: 97 מסכים חיים (טעינה/קריסות/מובייל/כפתורים) + 6 פרסונות + דוח.
צד-הילד נקי (0 קריסות, 0 גלישה). הבעיות היו בצד מורה/מנהלת (טופלו).

---

## 🔑 גישה לאתר החי (חשבונות-בדיקה אמיתיים בענן)

| תפקיד | כניסה | סיסמה |
|---|---|---|
| מנהלת | `menahelet@bdika-impactos.com` | `Bdika-2026` |
| מורה | `mora@bdika-impactos.com` | `Bdika-2026` |

- כניסה: `gate.html` → כרטיס תפקיד → טאב "כניסה" → מייל+סיסמה.
- בית ספר "בדיקה" · קוד `AV-BDIKA` · כיתה א׳1.
- פתיחת האתר בתוך VSCode: `Ctrl+Alt+L` (keybinding שהוגדר).

### 4 תלמידי-בדיקה (קישורי כניסת-תלמיד; טוקנים מהרצת seed אחרונה)
כל קישור = כניסה ראשונה → פרופיל אורייני:
- בדיקה 1: `student.html?token=fb30c993-93ce-4753-8c99-68cefa853c02`
- בדיקה 2: `student.html?token=fbffdc0a-8646-41b0-a53e-45e81b872999`
- בדיקה 3: `student.html?token=6caf0e8e-9bbe-47b8-8fc3-e7f268a5989b`
- בדיקה 4: `student.html?token=076bf049-e3ee-4af2-bbcc-5c9f7bd4325c`
  (מלא: `https://impact-os.app/avnei-yesod/underwater-app/` + הנתיב)

### 🔴 seed script — זהירות
`scratchpad/sb-seed.js` (session af13a04e) יוצר את החשבונות+4 תלמידים ומדפיס טוקנים.
**הרצה חוזרת מוחקת את 4 התלמידים ואת נתוני-התרגול שלהם** (delete-then-create). אל
תריץ שוב אם מיטל כבר תרגלה — אלא אם רוצים slate נקי. דורש allow-rule ב-
`.claude/settings.local.json` (כבר קיים לנתיב הזה). יש טריגר בענן שיוצר שורת
`teachers` אוטומטית ביצירת auth-user → לעדכן (PATCH) לא INSERT.

---

## 🎯 הפלואו הנכון לבדיקות (מה מיטל רוצה)

1. **כל תלמיד בחלון/incognito נפרד** (🔴 חובה — `STATE_KEY` ב-state.js גלובלי פר-דפדפן,
   לא פר-תלמיד. הענן כן פר-תלמיד). פותחים קישור של בדיקה 1 בחלון 1, בדיקה 2 בחלון 2, וכו'.
2. עונים על **הפרופיל האורייני** (מבדק BOY: אותיות → הברה → מילה → סיפור) → המיפוי
   אומר אי-פתיחה → "להתחיל לתרגל" → מתרגלים באי הזה.
3. עונים שונה לכל אחד מ-4 → 4 הצבות שונות.
4. נכנסים כ**מורה** → "הכיתה שלי" → אמור לראות 4 תלמידים עם ההצבה וההתקדמות · פרופיל אורייני.
5. נכנסים כ**מנהלת** → מבט-על בית-ספרי.

---

## 🔴 פתוח / לבדוק בשיחה הבאה (לפי סדר עדיפות)

1. **BKT לא מגיע לענן → המורה רואה "מומלץ תרגול פתיחה" גם אחרי תרגול.**
   מיטל תרגלה 4, ובדשבורד המורה כתוב "תרגול פתיחה — לאסוף נקודת התחלה" (`k==null`).
   `k`/avgKnown נקרא מ-`bkt_state.strand_bkt.pKnown` (teacher-cloud.js:82). אבל
   `cloud-sync.js` דוחף רק **events** (`ingest_student_event`) ו-**assessments** —
   **לא `bkt_state`**. חשד: ה-BKT מחושב מקומית ולא נדחף → הענן ריק → המורה לא רואה מיומנות.
   • לאמת: לקרוא את הענן ל-4 התלמידים (סקריפט read-only `scratchpad/sb-diag.js` נכתב
     אך טרם הורץ — צריך allow-rule). לבדוק: events? bkt_state? start_island?
   • אם אין bkt_state: להוסיף push של bkt לענן ב-cloud-sync (RPC ingest/save_bkt),
     או שהמורה תחשב מיומנות מ-events. גם ייתכן ש-4-תלמידים-בדפדפן-אחד ערבבו נתונים.

2. **מיגרציה 0009 טרם הורצה** — כדי שאי-הפתיחה מהמיפוי ייכתב אוטומטית ל-`students.start_island`
   (אחרת רק מסך הפרופיל המפורט מראה אותו, לא הרוסטר/מנהלת). SQL ב-
   `supabase/migrations/0009_boy_auto_placement.sql` → Supabase SQL Editor →
   `https://supabase.com/dashboard/project/ynxfszmpoppqrqocewcs/sql/new`.
   חלופה בלי SQL: המורה מאשרת הצבה ב-`teacher-literacy-profile` (write קיים שם).

3. **חלופה לא-קולית למשימת ההקראה** (ילד עם עיכוב-דיבור) — החלטה פדגוגית של מיטל.

---

## 🛠️ עובדות טכניות שימושיות
- ענן live: `ynxfszmpoppqrqocewcs.supabase.co`. `.env`: SUPABASE_URL/PUBLISHABLE_KEY/SECRET_KEY.
  ה-SECRET_KEY מריץ data/RPC (admin) אבל **לא DDL** — שינויי-סכמה רק ב-SQL Editor.
- הרצת סקריפט שקורא סוד+פונה-לענן נחסם ע"י auto-mode classifier עד allow-rule ב-
  `.claude/settings.local.json`.
- בדיקות headless: playwright ב-`avnei-yesod/scripts/e2e/node_modules` (NODE_PATH). שרת
  מקומי: `python -m http.server 8791` מ-repo-root, ואז `http://localhost:8791/avnei-yesod/underwater-app/...`.
- זרימת הצבה: boy-check(child)→ingest_student_assessment(assessment בענן)→
  teacher-literacy-profile(מורה רואה+writes start_island)→get_student_profile מחזיר
  placement→student.html applyPlacement(state.js) קובע currentStageId.
