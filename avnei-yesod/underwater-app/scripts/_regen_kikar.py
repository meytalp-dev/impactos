#!/usr/bin/env python3
"""
הקלטת word-kikar (אי 2 · משפחת חרוז ‑ָר). מחליף את שַׁעַר שה-ע' הגרונית שלו
"בלטה" (מיטל 12.7). כִּכָּר = /ki-kar/ מלרע, נקי מגרוניות. קול נוני דרך _eleven_tts.
הרצה:  PYTHONIOENCODING=utf-8 python scripts/_regen_kikar.py
"""
import asyncio
from pathlib import Path
import _eleven_tts as tts

OUT = Path(__file__).parent.parent / "assets" / "audio"
# מיטל 12.7: eleven_v3 התעלם מהדגש ב-כ' השנייה (רפה בין-תנועתי) → נשמע /ki-khar/.
# תיקון: כתיב פונטי עם ק' (תמיד /k/). התצוגה בדאטה נשארת כִּכָּר; רק האודיו מ-קִיקָר.
TARGETS = { "word-kikar": "קִיקָר" }


async def main():
    ok = 0
    for i, (key, text) in enumerate(TARGETS.items(), 1):
        out = OUT / f"{key}.mp3"
        try:
            await tts.Communicate(text).save(str(out))
            print(f"[{i}/{len(TARGETS)}] OK   {key}")
            ok += 1
        except Exception as e:
            print(f"[{i}/{len(TARGETS)}] FAIL {key} ({type(e).__name__}: {e})")
    print(f"Done: {ok}/{len(TARGETS)}")


if __name__ == "__main__":
    asyncio.run(main())
