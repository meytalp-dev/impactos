# גְּרַנְטָה · היגיינת סודות

מסמך תפעולי קצר. חל על כל מי שנוגע בקוד של `granta/` ו-`supabase/`.
מקור הכלל: `granta/SPEC.md` §5 — «שום סוד לא בצד לקוח. כל מה שנוגע בגוגל = Edge Function.»

---

## 1. מה מותר בצד לקוח

בדפדפן (כלומר: בכל קובץ תחת `granta/`) מותרים **בדיוק שני** ערכים:

| ערך | דוגמה | למה זה בסדר |
|---|---|---|
| `SUPABASE_URL` | `https://abcdefg.supabase.co` | כתובת ציבורית. לא סוד. |
| `SUPABASE_ANON_KEY` | `eyJ...` (role `anon`) / `sb_publishable_...` | פומבי מעצם הגדרתו. מוגן ב-RLS. |

שניהם חיים **רק** בקובץ אחד: `granta/assets/granta-config.js` —
קובץ לא-מנוהל-בגיט, שנוצר מהתבנית `granta/assets/granta-config.example.js`.

🔴 ה-anon key בטוח **רק כל עוד RLS מוגדר ופעיל** על כל טבלאות `granta_*`.
anon key + טבלה בלי RLS = כל האינטרנט קורא את התיקים של כל העמותות.
RLS הוא לא "שכבה נוספת" — הוא ההגנה היחידה.

---

## 2. מה אסור בצד לקוח — לעולם

- 🔴 **`service_role` key** (וכן `supabase_admin`). עוקף את כל ה-RLS. שווה-ערך
  לסיסמת מנהל של בסיס הנתונים. אם הוא מגיע לדפדפן — כל תיק של כל עמותה
  חשוף לקריאה, לשינוי ולמחיקה, בידי כל אדם שפותח את הדף.
- 🔴 **refresh token של Google** (`1//0...`). SPEC §M9: «refresh token לעולם
  לא בצד לקוח».
- 🔴 **Google Ads developer token**, `client_secret` של OAuth (`GOCSPX-...`).
- 🔴 **כל מפתח API** — Anthropic (`sk-ant-...`), Google API key (`AIza...`),
  מפתחות ספקי מייל/תשלום/כל דבר אחר.
- 🔴 גם לא ב"הערה זמנית", גם לא ב-`console.log`, גם לא בקובץ `.example`,
  גם לא בצילום מסך שנשמר ב-`_handoff/`.

`granta.js` מזהה מפתח service-role וחוסם את האתחול ברעש
(`looksLikeServiceRole`). זו **רשת ביטחון, לא היתר** — היא בודקת רק JWT-ים
ישנים, ולא תתפוס `sb_secret_...` בפורמט החדש.

---

## 3. איפה סודות אמיתיים חיים

**רק** ב-Supabase Edge Function secrets. אין מקום שני.

```bash
# הגדרה
supabase secrets set GOOGLE_ADS_DEVELOPER_TOKEN=...
supabase secrets set GOOGLE_OAUTH_CLIENT_SECRET=...

# רשימה (מציג שמות + hash, לא ערכים)
supabase secrets list
```

בתוך ה-Edge Function: `Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN')`.

הדפדפן קורא ל-Edge Function; ה-Edge Function הוא זה שנוגע בסוד. הסוד
לא חוצה את הגבול הזה אף פעם — לא בתשובה, לא בלוג, לא בהודעת שגיאה.

לפיתוח מקומי: `supabase/.env` — מכוסה על ידי `*.env` ב-`.gitignore` בשורש.

---

## 4. פקודת בדיקה — להעתקה

מריצים **משורש הריפו**. סורק את `granta/` ואת `supabase/`, כולל קבצים
ש-git מתעלם מהם (וזה בדיוק העניין — `granta-config.js` הוא קובץ מוחרג,
ודווקא אותו חייבים לסרוק).

### Git Bash / WSL / macOS

```bash
grep -rInoE 'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}|sb_secret_[A-Za-z0-9]{10,}|GOCSPX-[A-Za-z0-9_-]{10,}|1//0[A-Za-z0-9_-]{20,}|sk-ant-[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,}' granta supabase \
  || echo '✅ נקי — לא נמצא שום מחרוזת בצורת סוד.'
```

### PowerShell (Windows)

```powershell
$pat='eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}|sb_secret_[A-Za-z0-9]{10,}|GOCSPX-[A-Za-z0-9_-]{10,}|1//0[A-Za-z0-9_-]{20,}|sk-ant-[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,}'
$hits = Get-ChildItem -Recurse -File granta,supabase | Select-String -Pattern $pat -AllMatches
if ($hits) { $hits | ForEach-Object { "$($_.Path):$($_.LineNumber)" } } else { '✅ נקי — לא נמצא שום מחרוזת בצורת סוד.' }
```

### שלב 2 — פענוח כל JWT שנמצא, כדי לראות אם הוא `anon` או `service_role`

מריצים רק אם השלב הקודם החזיר JWT (`eyJ...`). מדפיס לכל אחד את ה-payload:

```bash
grep -rnoE 'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}' granta supabase | while IFS= read -r hit; do
  loc="${hit%%:eyJ*}"; tok="eyJ${hit#*:eyJ}"
  p=$(printf '%s' "$tok" | cut -d. -f2 | tr '_-' '/+')
  while [ $(( ${#p} % 4 )) -ne 0 ]; do p="$p="; done
  echo "$loc  =>  $(printf '%s' "$p" | base64 -d 2>/dev/null)"
done
```

קוראים את שדה `"role"` בפלט:
- `"role":"anon"` → תקין, זה המפתח הפומבי.
- 🔴 `"role":"service_role"` או `"role":"supabase_admin"` → **דליפה. עצור.**
  עבור לסעיף 6.

### בדיקה משלימה — שה-config החי באמת מוחרג

```bash
git check-ignore -v granta/assets/granta-config.js   # חייב להחזיר שורה מ-.gitignore
git check-ignore    granta/assets/granta-config.example.js  # חייב להחזיר כלום (exit 1)
```

---

## 5. מתי מריצים

- לפני כל `git commit` שנוגע ב-`granta/` או ב-`supabase/`.
- לפני כל push לענף ציבורי / לפני deploy.
- אחרי כל פעם שמישהו "רק הדביק ערך כדי לבדוק".

---

## 6. 🔴 מה עושים אם סוד דלף

הכלל: **סוד שנחשף = סוד שרוף. מחיקה מהקוד לא מבטלת אותו.**
מי שכבר העתיק אותו — עדיין מחזיק מפתח עובד.

הסדר, ובסדר הזה:

1. **החלף/בטל את הסוד במקור.** זה השלב היחיד שבאמת עוצר את הדליפה.
   - Supabase service_role / anon: Dashboard → Project Settings → API Keys →
     **Rotate / Revoke**. (החלפת anon key מחייבת עדכון של
     `granta-config.js` בכל סביבה.)
   - Google OAuth `client_secret`: Google Cloud Console → Credentials →
     Reset secret.
   - Google refresh token: לבטל את ההרשאה של האפליקציה בחשבון, ולבצע
     OAuth מחדש.
   - Developer token / מפתח API אחר: להנפיק חדש ולבטל את הישן אצל הספק.
2. **הכנס את החדש למקום הנכון** — Edge Function secret, לא צד לקוח.
3. **נקה מהקוד** ומהעץ העובד. אם זה כבר ב-git history — ניקוי ההיסטוריה
   (`git filter-repo`) הוא **בונוס בלבד**, אחרי ההחלפה, ולא במקומה.
4. **בדוק מה נעשה עם המפתח** — Supabase Dashboard → Logs; אצל גוגל → audit
   log של החשבון. ב-granta יש גם `granta_audit_log` (SPEC §M8).
5. **תעד** ב-`granta/_ops/` מה דלף, מתי, מה הוחלף — כדי שהבדיקה הבאה תדע
   שהמפתח הישן כבר לא בתוקף.

אל תתקן דליפה לבד בשקט. דווח למיטל לפני שאתה נוגע במפתחות חיים.

---

## עדכון 29.8.2026 · `granta-config.js` נמצא בריפו — בכוונה

בגרסה הראשונה הקובץ הוחרג מ-git. זה נראה זהיר, ובפועל הוא שבר את הפריסה:
האתר סטטי, והדפדפן חייב לטעון את הקובץ כדי שמסך כלשהו יעבוד.

**ההחרגה גם לא הוסיפה הגנה.** המפתח הפומבי (`anon` / `sb_publishable_`) מופיע
בקוד המקור של כל דף שנפרס — כל מי שפותח את האתר רואה אותו, בין אם הוא בריפו
ובין אם לא. ההגנה על הדאטה היא **RLS**, ואומתה מול הפרויקט החי:

- אנונימי מנסה לקרוא `granta_leads` → `401`
- אנונימי מנסה לכתוב `eligibility_score` / `verdict` → `42501 permission denied`
- אנונימי מנסה להפעיל את מנוע הזכאות על ליד → נחסם, לא נכתב כלום

**מה שלא השתנה:** מפתח סודי לעולם לא בקובץ הזה. `service_role` ו-`sb_secret_`
עוקפים את RLS לחלוטין; אם אחד מהם יגיע לשם, כל תיק של כל עמותה חשוף לכל אדם
באינטרנט, כולל מחיקה ושינוי.

**השומר:** `node granta/_orchestra/check-public-config.mjs`
בודק לפני דחיפה שהקובץ נושא מפתח פומבי בלבד — קידומת `sb_secret_`, JWT עם
`role` שאינו `anon`, וסודות של ספקים אחרים. אומת בשני הכיוונים: נכשל על מפתח
סודי מושתל, עובר על הקובץ האמיתי.
