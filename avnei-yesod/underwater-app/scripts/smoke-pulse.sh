#!/usr/bin/env bash
# ============================================================================
# smoke-pulse.sh — אימות end-to-end לבקאנד הפולס (גל 2 · מיגרציה 0008)
# ----------------------------------------------------------------------------
# מה נבדק:
#   1. preflight: הטבלה pulse_responses + students.parent_token קיימים (0008 הורצה).
#   2. כתיבת ילד.ה  — ingest_pulse_response(anon, student token) → UUID.
#   3. כתיבת הורה   — ingest_pulse_response(anon, parent_token, respondent=parent) → UUID.
#   4. guard-התחזות — student token עם respondent=parent → נכשל (28000).
#   5. token שגוי   — נכשל.
#   6. שלמות דאטה   — service-role קורא 2 שורות עם answers נכונים.
#   7. RLS          — מנהלת בית-הספר רואה את השורה · מורה זרה (בי"ס אחר) לא.
#   8. ניקוי        — מוחק משתמשי-בדיקה, כיתות, תלמיד.ה (cascade מוחק פולס).
#
# דורש: bash + curl + python3. קורא מפתחות מ-.env בשורש הריפו (לא מהקוד).
# הרצה:  bash avnei-yesod/underwater-app/scripts/smoke-pulse.sh
# ============================================================================
set -uo pipefail

# ---- טעינת קונפיג מ-.env (שורש הריפו) ----
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
set -a; . "$ROOT/.env" 2>/dev/null; set +a
URL="${SUPABASE_URL:-https://ynxfszmpoppqrqocewcs.supabase.co}"
SECRET="${SUPABASE_SECRET_KEY:?SUPABASE_SECRET_KEY missing in .env}"
ANON="${SUPABASE_PUBLISHABLE_KEY:?SUPABASE_PUBLISHABLE_KEY missing in .env}"

PASS=0; FAIL=0
ok(){ echo "  ✅ $1"; PASS=$((PASS+1)); }
no(){ echo "  ❌ $1"; FAIL=$((FAIL+1)); }
jget(){ python3 -c "import sys,json;d=json.load(sys.stdin);print(${1})" 2>/dev/null; }

# service-role REST helpers (bypass RLS)
srv_get(){ curl -s -H "apikey: $SECRET" -H "Authorization: Bearer $SECRET" "$URL/rest/v1/$1"; }
srv_post(){ curl -s -H "apikey: $SECRET" -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" -H "Prefer: return=representation" -d "$2" "$URL/rest/v1/$1"; }
srv_del(){ curl -s -o /dev/null -H "apikey: $SECRET" -H "Authorization: Bearer $SECRET" -X DELETE "$URL/rest/v1/$1"; }
# anon RPC (student/parent write path)
anon_rpc(){ curl -s -H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" -d "$2" "$URL/rest/v1/rpc/$1"; }

echo "▶ 1. preflight — 0008 הורצה?"
code=$(curl -s -o /dev/null -w "%{http_code}" -H "apikey: $SECRET" -H "Authorization: Bearer $SECRET" "$URL/rest/v1/pulse_responses?select=id&limit=1")
if [ "$code" != "200" ]; then echo "  ❌ pulse_responses לא קיימת (HTTP $code). הריצי קודם את supabase/migrations/0008_pulse.sql ב-SQL Editor."; exit 1; fi
ok "pulse_responses קיימת"

TS=$(date +%s)
PEMAIL="smoke-pulse-principal-$TS@example.com"
FEMAIL="smoke-pulse-foreign-$TS@example.com"
PW="Smoke-$TS!"

echo "▶ 2. setup (service role) — 2 בתי-ספר, מנהלת, מורה זרה, כיתה, תלמיד.ה"
# משתמשי auth (email_confirm=true → אפשר להתחבר מיד; trigger יוצר teachers)
PU=$(curl -s -H "apikey: $SECRET" -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" \
  -d "{\"email\":\"$PEMAIL\",\"password\":\"$PW\",\"email_confirm\":true}" "$URL/auth/v1/admin/users")
FU=$(curl -s -H "apikey: $SECRET" -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" \
  -d "{\"email\":\"$FEMAIL\",\"password\":\"$PW\",\"email_confirm\":true}" "$URL/auth/v1/admin/users")
PUID=$(echo "$PU" | jget "d['id']"); FUID=$(echo "$FU" | jget "d['id']")
[ -n "$PUID" ] && [ -n "$FUID" ] && ok "auth users: principal=$PUID foreign=$FUID" || { no "יצירת משתמשים נכשלה"; echo "$PU"; exit 1; }

# 2 בתי-ספר
S1=$(srv_post "schools" "{\"name\":\"סמוק בי\\\"ס A $TS\",\"join_code\":\"SMK-A$TS\"}" | jget "d[0]['id']")
S2=$(srv_post "schools" "{\"name\":\"סמוק בי\\\"ס B $TS\",\"join_code\":\"SMK-B$TS\"}" | jget "d[0]['id']")
# תפקידים ושיוך (PATCH — teachers כבר קיימים דרך ה-trigger)
curl -s -o /dev/null -H "apikey: $SECRET" -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" -X PATCH \
  -d "{\"role\":\"principal\",\"school_id\":\"$S1\"}" "$URL/rest/v1/teachers?id=eq.$PUID"
curl -s -o /dev/null -H "apikey: $SECRET" -H "Authorization: Bearer $SECRET" -H "Content-Type: application/json" -X PATCH \
  -d "{\"school_id\":\"$S2\"}" "$URL/rest/v1/teachers?id=eq.$FUID"
# כיתה בבית-ספר A (של המנהלת) + תלמיד.ה
CID=$(srv_post "classes" "{\"name\":\"סמוק א׳1\",\"teacher_id\":\"$PUID\"}" | jget "d[0]['id']")
STU=$(srv_post "students" "{\"name\":\"סמוק תלמיד\",\"class_id\":\"$CID\"}")
SID=$(echo "$STU" | jget "d[0]['id']"); STOK=$(echo "$STU" | jget "d[0]['token']"); PTOK=$(echo "$STU" | jget "d[0]['parent_token']")
[ -n "$SID" ] && [ -n "$STOK" ] && [ -n "$PTOK" ] && ok "class=$CID student=$SID (token+parent_token)" || { no "יצירת כיתה/תלמיד נכשלה"; echo "$STU"; }

echo "▶ 3. כתיבת ילד.ה (anon RPC)"
R=$(anon_rpc "ingest_pulse_response" "{\"p_token\":\"$STOK\",\"p_respondent\":\"student\",\"p_cycle\":\"2026-W28\",\"p_answers\":{\"adjust\":3,\"friend\":2,\"emotion\":1,\"joy\":3},\"p_taken_at\":\"2026-07-12T08:00:00Z\"}")
echo "$R" | grep -qE '^"[0-9a-f-]{36}"$' && ok "נכתב pulse ילד.ה: $R" || no "כתיבת ילד.ה נכשלה: $R"

echo "▶ 4. כתיבת הורה (anon RPC, parent_token)"
R=$(anon_rpc "ingest_pulse_response" "{\"p_token\":\"$PTOK\",\"p_respondent\":\"parent\",\"p_cycle\":\"2026-07\",\"p_answers\":{\"joy\":2.33,\"emotion\":2,\"adjust\":3},\"p_taken_at\":\"2026-07-12T18:00:00Z\"}")
echo "$R" | grep -qE '^"[0-9a-f-]{36}"$' && ok "נכתב pulse הורה: $R" || no "כתיבת הורה נכשלה: $R"

echo "▶ 5. guard — student token עם respondent=parent → אמור להיכשל"
R=$(anon_rpc "ingest_pulse_response" "{\"p_token\":\"$STOK\",\"p_respondent\":\"parent\",\"p_cycle\":\"x\",\"p_answers\":{},\"p_taken_at\":\"2026-07-12T18:00:00Z\"}")
echo "$R" | grep -q '"code"' && ok "נדחה כצפוי (token של ילד לא כותב כהורה)" || no "לא נדחה! $R"

echo "▶ 6. token שגוי → אמור להיכשל"
R=$(anon_rpc "ingest_pulse_response" "{\"p_token\":\"nope-$TS\",\"p_respondent\":\"student\",\"p_cycle\":\"x\",\"p_answers\":{},\"p_taken_at\":\"2026-07-12T18:00:00Z\"}")
echo "$R" | grep -q '"code"' && ok "נדחה כצפוי (token לא תקף)" || no "לא נדחה! $R"

echo "▶ 7. שלמות דאטה (service role)"
ROWS=$(srv_get "pulse_responses?student_id=eq.$SID&select=respondent,cycle,answers&order=taken_at")
N=$(echo "$ROWS" | jget "len(d)")
[ "$N" = "2" ] && ok "2 שורות לתלמיד.ה" || no "ציפינו ל-2 שורות, קיבלנו $N: $ROWS"
echo "$ROWS" | grep -q '"adjust": *3' && ok "answers של הילד.ה נשמרו נכון" || no "answers לא תואמים: $ROWS"

echo "▶ 8. RLS — מנהלת רואה / מורה זרה לא"
login(){ curl -s -H "apikey: $ANON" -H "Content-Type: application/json" -d "{\"email\":\"$1\",\"password\":\"$PW\"}" "$URL/auth/v1/token?grant_type=password" | jget "d['access_token']"; }
PJWT=$(login "$PEMAIL"); FJWT=$(login "$FEMAIL")
seen(){ curl -s -H "apikey: $ANON" -H "Authorization: Bearer $1" "$URL/rest/v1/pulse_responses?student_id=eq.$SID&select=id" | jget "len(d)"; }
PN=$(seen "$PJWT"); FN=$(seen "$FJWT")
[ "$PN" = "2" ] && ok "המנהלת רואה 2 שורות" || no "המנהלת רואה $PN (ציפינו 2)"
[ "$FN" = "0" ] && ok "מורה זרה רואה 0 שורות (RLS חוסם)" || no "דליפת RLS! מורה זרה רואה $FN"

echo "▶ ניקוי"
srv_del "students?id=eq.$SID"          # cascade מוחק pulse_responses
srv_del "classes?id=eq.$CID"
srv_del "schools?id=eq.$S1"; srv_del "schools?id=eq.$S2"
curl -s -o /dev/null -H "apikey: $SECRET" -H "Authorization: Bearer $SECRET" -X DELETE "$URL/auth/v1/admin/users/$PUID"
curl -s -o /dev/null -H "apikey: $SECRET" -H "Authorization: Bearer $SECRET" -X DELETE "$URL/auth/v1/admin/users/$FUID"
ok "נמחקו משתמשי/נתוני הבדיקה"

echo ""; echo "════════ סיכום: $PASS עברו · $FAIL נכשלו ════════"
[ "$FAIL" = "0" ] && exit 0 || exit 1
