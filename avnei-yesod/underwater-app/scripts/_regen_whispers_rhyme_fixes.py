#!/usr/bin/env python3
"""
תיקוני-אוזן (מיטל, 9.7.2026) לרדיזיין החריזה של "ים השמועות".
מקליט מחדש **רק** 4 קליפים — לא נוגע במאושרים.

  word-aron   — היה קטוע → הקלטה מחדש (נסה טייק נקי)
  word-makom  — נשמע משונה → כתיב-חסר יציב יותר ("מקום")
  word-achbar — צריך דגש ב-בּ (נשמע "אכוַר") → ניקוד עם דגש
  word-nahar  — חדש: מחליף את "סוכר" שלא התאים למשפחת ‑ָר

קול נוני (ElevenLabs) דרך _eleven_tts. הרצה: PYTHONIOENCODING=utf-8 python _regen_whispers_rhyme_fixes.py
"""
import asyncio
from pathlib import Path

import _eleven_tts as edge_tts

OUT_DIR = Path(__file__).parent.parent / "assets" / "audio"

# סבב-7 (מיטל 9.7): כתיב-חסר איבד את התנועות — חוזר לניקוד מלא קמץ-קמץ
# (מָטָר, /a/-/a/ כפי שמיטל דרשה). הטעמה נכונה = מלרע ma-TÁR.
LINES = {
    "word-matar":  "מָטָר",
}


async def gen(text, filename):
    out = OUT_DIR / f"{filename}.mp3"
    try:
        tts = edge_tts.Communicate(text, "he-IL-AvriNeural", rate="-15%")
        await tts.save(str(out))
        return f"OK   {filename}  ← \"{text}\""
    except Exception as e:
        return f"FAIL {filename} ({type(e).__name__}: {e})"


async def main():
    print(f"Regenerating {len(LINES)} whispers-rhyme fix clips (voice=Noni)...\n")
    for i, (key, text) in enumerate(LINES.items(), 1):
        print(f"[{i}/{len(LINES)}] {await gen(text, key)}")
        await asyncio.sleep(0.25)
    print(f"\nOutput: {OUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
