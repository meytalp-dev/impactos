#!/usr/bin/env bash
# ⚠️  ראה אזהרה מלאה ב-_run_all_regen.sh. --force דורס את קליפי-האותיות המאושרים.
#   • ברירת-מחדל (בטוח):  ./_run_letters.sh          → ממלא רק אותיות חסרות
#   • דריסה מכוונת:        REGEN_FORCE=1 ./_run_letters.sh  (או --force-all)
export PYTHONIOENCODING=utf-8
cd "$(dirname "$0")/.."

FORCE=""
if [ "${REGEN_FORCE:-0}" = "1" ] || [ "$1" = "--force-all" ]; then
  FORCE="--force"
  echo "⚠️  מצב-דריסה: דורס קליפי-אותיות קיימים. Ctrl-C לביטול (3 שנ')." >&2
  sleep 3
fi

LOG="_audio-test/regen-letters.log"
: > "$LOG"
for L in א ב ג ד ה ו ז ח ט י כ ל מ נ ס ע פ צ ק ר ש ת; do
  echo "=== $L ${FORCE} ===" >> "$LOG"
  python scripts/generate-letter-audio.py "$L" $FORCE >> "$LOG" 2>&1 && echo "OK $L" >> "$LOG" || echo "FAIL $L" >> "$LOG"
done
echo "DONE $(date) FORCE='${FORCE:-<safe/skip-existing>}'" >> "$LOG"
