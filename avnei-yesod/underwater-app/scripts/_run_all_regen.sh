#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  כלי מסוכן — קרא לפני הרצה.
# ריצה עם --force דורסת את *כל* קובצי-האודיו מהסקריפטים, כולל הקלטות שאושרו
# באוזן ע"י מיטל, ומחזירה אותן ל-TTS גולמי = רגרסיית-הגייה. בדיוק זה קרה
# ב-18.7.2026 (64 קבצים נדרסו, "שמעתם" חזר לשווא). לכן הכלי בטוח-כברירת-מחדל:
#
#   • ברירת-מחדל (בטוח):  ./_run_all_regen.sh
#       מריץ את הגנרטורים בלי --force → הם מדלגים על קבצים קיימים וממלאים רק
#       חוסרים. לא נוגע בשום קליפ מאושר. גם מדלג על regenerate-*.py.
#
#   • דריסה מכוונת:        REGEN_FORCE=1 ./_run_all_regen.sh   (או: --force-all)
#       דורס הכל. עושים זאת רק כשבטוחים, ומאזינים+מאשרים אחרי.
#
# 🔴 תיקוני-הגייה קבועים שייכים ל-scripts/_eleven_tts.py::KNOWN_WORD_FIXES
#    (נדבקים בכל regen), לא להקלטה ידנית שאפשר לדרוס.
# ═══════════════════════════════════════════════════════════════════════════
export PYTHONIOENCODING=utf-8
cd "$(dirname "$0")/.."

FORCE=""
if [ "${REGEN_FORCE:-0}" = "1" ] || [ "$1" = "--force-all" ]; then
  FORCE="--force"
  echo "⚠️  מצב-דריסה: דורס קבצים קיימים כולל מאושרים. Ctrl-C לביטול (3 שנ')." >&2
  sleep 3
fi

LOG="_audio-test/regen-run.log"
: > "$LOG"
echo "START $(date) FORCE='${FORCE:-<safe/skip-existing>}'" >> "$LOG"
# generators — במצב-בטוח בלי --force (מדלגים קיימים)
for f in scripts/generate-*.py; do
  base=$(basename "$f")
  case "$base" in generate-fixes.py) continue;; esac
  echo "=== RUN $base ${FORCE} ===" >> "$LOG"
  python "$f" $FORCE >> "$LOG" 2>&1 && echo "OK $base" >> "$LOG" || echo "FAIL $base (exit $?)" >> "$LOG"
done
# regenerate-*.py דורסים תמיד (force פנימי) — רצים רק במצב-דריסה מפורש
if [ -n "$FORCE" ]; then
  for f in scripts/regenerate-*.py; do
    base=$(basename "$f")
    echo "=== RUN $base ===" >> "$LOG"
    python "$f" >> "$LOG" 2>&1 && echo "OK $base" >> "$LOG" || echo "FAIL $base (exit $?)" >> "$LOG"
  done
else
  echo "SKIP regenerate-*.py (מצב-בטוח — הרץ ידנית אם צריך תיקון ממוקד)" >> "$LOG"
fi
echo "DONE $(date)" >> "$LOG"
