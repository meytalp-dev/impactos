#!/usr/bin/env python3
"""
מייצר MP3 לדמו פולס כיתה א׳ (מערכת 10 · עולם נוני).

קול: Hila Neural (נשי) — מתאים לדמות נוני. בפרודקשן יוחלף בהקלטת שחקנית.
14 קליפים: bridge · 4 setups · 4 questions · 4 thanks · outro.

מצב ברירת מחדל: לא דורס קבצים קיימים. הוסיפו --force כדי להקליט מחדש.

דורש: pip install edge-tts
"""
import asyncio
import sys
from pathlib import Path

# Windows console UTF-8 — אחרת ה-cp1252 קורס על עברית
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import edge_tts

VOICE = "he-IL-HilaNeural"
RATE = "-10%"      # מעט איטי לכיתה א'
PITCH = "+5Hz"     # מעט גבוה — דמות צעירה/חיה

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# שמות הקליפים תואמים ל-AUDIO_MAP ב-pulse-questionnaire.html
CLIPS = {
    # ─── Bridge ──────────────────────────────────────────────
    "bridge": "נוני צריך עזרה קטנה. בכל פעם תבחרו איך נראה לכם שנוני מרגיש. אין תשובה נכונה או לא נכונה.",

    # ─── Setups (per dim) ───────────────────────────────────
    "setup-adjust":  "כל בוקר נוני מגיע לשונית. יש בקרים שקל לו, ויש בקרים שקצת פחות.",
    "setup-friend":  "בשונית יש דגים שאוהבים לשחק יחד. לפעמים נוני מצטרף, ולפעמים הוא מחפש עם מי.",
    "setup-emotion": "לפעמים קורה משהו מרגיז. נוני עוצר רגע, ומנסה להירגע.",
    "setup-joy":     "נוני מצא בשונית משהו שעוד לא הכיר. הוא מסתכל, וחושב מה זה.",

    # ─── Questions (per dim) ────────────────────────────────
    "question-adjust":  "האם נוני מרגיש טוב כשהוא בא לשונית בבוקר?",
    "question-friend":  "האם יש לנוני עם מי לשחק בשונית?",
    "question-emotion": "כשנוני כועס, האם יש משהו שעוזר לו להירגע?",
    "question-joy":     "האם כיף לנוני לגלות משהו חדש?",

    # ─── Thanks (random pick after each answer) ─────────────
    "thanks-1": "תודה שעזרתם לי.",
    "thanks-2": "זה עוזר לי להבין.",
    "thanks-3": "תודה. נעבור לבועה הבאה.",
    "thanks-4": "שמעתי את התשובה.",

    # ─── Outro ───────────────────────────────────────────────
    "outro": "תודה שעזרתם לנוני. נתראה בשונית בפעם הבאה.",
}


async def synth(name: str, text: str, force: bool) -> None:
    out = OUT_DIR / f"{name}.mp3"
    if out.exists() and not force:
        print(f"  ✓ {name}.mp3  (קיים, דלג)")
        return
    print(f"  ⊙ {name}.mp3  …", end=" ", flush=True)
    communicate = edge_tts.Communicate(text=text, voice=VOICE, rate=RATE, pitch=PITCH)
    await communicate.save(str(out))
    print("OK")


async def main() -> None:
    force = "--force" in sys.argv
    print(f"קול: {VOICE}  ·  קצב: {RATE}  ·  pitch: {PITCH}")
    print(f"יעד: {OUT_DIR}")
    print(f"מצב: {'force (overwrite)' if force else 'skip-if-exists'}")
    print("───")
    for name, text in CLIPS.items():
        await synth(name, text, force=force)
    print("───")
    print(f'סה"כ: {len(CLIPS)} קליפים.')


if __name__ == "__main__":
    asyncio.run(main())
