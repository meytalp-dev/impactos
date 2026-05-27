#!/usr/bin/env python3
"""
D.15 v2 שלב B-revised — הקלטה מחדש של 6 קבצי MP3 לבועות ל·נ·א.

הסיבה: ב-B-revised כל אות קיבלה מכניקה שונה (ל=pick · נ=memory · א=sort),
אבל ה-intro/find MP3 הקיימים הוקלטו עם הניסוח של tap-all ("מצאו את כל
הבועות..."). זה לא תואם למכניקה החדשה — הילד שומע משימה שלא קיימת.

הסקריפט הזה מקליט מחדש (force overwrite):
  intro-lamed.mp3 + find-lamed.mp3  →  ניסוח של "בחירה" (pick)
  intro-nun.mp3   + find-nun.mp3    →  ניסוח של "זיכרון/זוגות" (memory)
  intro-alef.mp3  + find-alef.mp3   →  ניסוח של "גרירה לרשת" (sort)

ש' נשארת בלי שינוי (tap-all שלה תקפה).

דורש: pip install edge-tts
הרצה: python scripts/regenerate-bubbles-audio-d15-revised.py
        (force תמיד-פעיל בסקריפט הזה כי אנחנו דורסים בכוונה)
"""
import asyncio
import sys
from pathlib import Path

# UTF-8 stdout ל-Windows (cp1252 לא תומך עברית)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import edge_tts

VOICE_AVRI = "he-IL-AvriNeural"
RATE       = "-10%"

ROOT     = Path(__file__).parent.parent
OUT_DIR  = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# 6 קבצים — intro + find לכל אות, עם ניסוח מותאם למכניקה
# כללי TTS עברי (מ-[[feedback-tts-hebrew-niqud-pitfalls]]):
#   "כֹּל" בחולם · שם אות מנוקד מלא · אין סמיכות אקדמית
LINES = {
    # ל — pick (בחירה, 5 סבבים)
    "intro-lamed":
        "נוֹנִי רוֹאֶה בּוּעוֹת זוֹהֲרוֹת בַּיָּם, "
        "וּבְכֹל בּוּעָה יֵשׁ אוֹת! "
        "בְּכֹל סִבּוּב — בִּחֲרוּ אֶת הַבּוּעָה עִם הָאוֹת לָמֶד.",
    "find-lamed":
        "בִּחֲרוּ אֶת הַבּוּעָה עִם הָאוֹת לָמֶד.",

    # נ — memory-pair (הופך זוגות)
    "intro-nun":
        "נוֹנִי הִחְבִּיא קְלָפִים בַּחוֹל! "
        "הָפְכוּ אוֹתָם וּמִצְאוּ זוּגוֹת. "
        "כֹּל זוּג: קֶלֶף עִם הָאוֹת נוּן וְקֶלֶף עִם תְּמוּנָה.",
    "find-nun":
        "מִצְאוּ זוּג שֶׁל הָאוֹת נוּן.",

    # א — sort-by-letter (גרירה לאקווריום)
    "intro-alef":
        "נוֹנִי רוֹאֶה בּוּעוֹת זוֹהֲרוֹת בַּיָּם! "
        "יֵשׁ שְׁתֵּי רְשָׁתוֹת לְמַטָּה. "
        "גָּרְרוּ אֶת הַבּוּעוֹת עִם הָאוֹת אָלֶף לָרֶשֶׁת הַנְּכוֹנָה.",
    "find-alef":
        "גָּרְרוּ אֶת הַבּוּעוֹת עִם הָאוֹת אָלֶף לָרֶשֶׁת.",
}


async def gen(text: str, filename: str) -> str:
    out = OUT_DIR / f"{filename}.mp3"
    # תמיד דורסים — מטרת הסקריפט הזה היא להחליף קבצים קיימים
    try:
        tts = edge_tts.Communicate(text, VOICE_AVRI, rate=RATE)
        await tts.save(str(out))
        return f"OK   {filename}"
    except Exception as e:
        return f"FAIL {filename} ({type(e).__name__}: {e})"


async def main():
    items = list(LINES.items())
    print(f"Re-generating {len(items)} bubble MP3s "
          f"(voice={VOICE_AVRI}, rate={RATE}) — FORCE overwrite")
    print(f"Output dir: {OUT_DIR}")
    print()

    success = 0
    for i, (key, text) in enumerate(items, 1):
        result = await gen(text, key)
        print(f"[{i}/{len(items)}] {result}")
        if "OK" in result:
            success += 1
        await asyncio.sleep(0.3)

    print(f"\nSuccess: {success}/{len(items)}")


if __name__ == "__main__":
    asyncio.run(main())
