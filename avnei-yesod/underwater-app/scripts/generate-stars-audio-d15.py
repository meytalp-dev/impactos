#!/usr/bin/env python3
"""
D.15 v2 שלב C — ייצור MP3 לקבוצת "כוכבי הים" (4 אותיות: ז·י·ו·ה).

8 קבצים (2 פר אות) — intro+find, עם ניסוח מותאם לכל מכניקה:
  ז → tap-all   (כמו שיון/שמש בקבוצת בועות הראשונה)
  י → pick      (5 סבבים × 4 כוכבים בכל סבב)
  ו → memory    (6 קלפים, 3 זוגות)
  ה → sort      (גרירה לאקווריום)

כל ה-MP3 בנושא "כוכבים" — סיפור פתיחה נושאי שונה מ"בועות".

דורש: pip install edge-tts
הרצה: python scripts/generate-stars-audio-d15.py [--force]
"""
import asyncio
import sys
from pathlib import Path

# UTF-8 stdout ל-Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import edge_tts

VOICE_AVRI = "he-IL-AvriNeural"
RATE       = "-10%"

ROOT     = Path(__file__).parent.parent
OUT_DIR  = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# 8 שורות — intro+find לכל אחת מ-4 האותיות עם ניסוח פר מכניקה
# כללי TTS עברי: "כֹּל" בחולם · שם אות מנוקד מלא · ניסוח טבעי
LINES = {
    # ז — tap-all (כל הכוכבים עם האות)
    "intro-zayin":
        "נוֹנִי גִּלָּה כּוֹכָבִים זוֹהֲרִים בַּיָּם, "
        "וּבְכֹל כּוֹכָב יֵשׁ אוֹת! "
        "הַקִּישׁוּ עַל כֹּל הַכּוֹכָבִים עִם הָאוֹת זַיִן.",
    "find-zayin":
        "מִצְאוּ אֶת כֹּל הַכּוֹכָבִים עִם הָאוֹת זַיִן בַּיָּם.",

    # י — pick (סיבוב, בחירה מתוך 4)
    "intro-yud":
        "נוֹנִי רוֹאֶה כּוֹכָבִים זוֹהֲרִים בַּיָּם! "
        "בְּכֹל סִבּוּב — בִּחֲרוּ אֶת הַכּוֹכָב עִם הָאוֹת יוּד.",
    "find-yud":
        "בִּחֲרוּ אֶת הַכּוֹכָב עִם הָאוֹת יוּד.",

    # ו — memory-pair (זוגות)
    "intro-vav":
        "נוֹנִי הִחְבִּיא קְלָפִים בֵּין הַכּוֹכָבִים! "
        "הָפְכוּ אוֹתָם וּמִצְאוּ זוּגוֹת. "
        "כֹּל זוּג: קֶלֶף עִם הָאוֹת וָו וְקֶלֶף עִם תְּמוּנָה.",
    "find-vav":
        "מִצְאוּ זוּג שֶׁל הָאוֹת וָו.",

    # ה — sort-by-letter (גרירה לאקווריום)
    "intro-hey":
        "נוֹנִי רוֹאֶה כּוֹכָבִים זוֹהֲרִים בַּיָּם! "
        "יֵשׁ שְׁתֵּי רְשָׁתוֹת לְמַטָּה. "
        "גָּרְרוּ אֶת הַכּוֹכָבִים עִם הָאוֹת הֵא לָרֶשֶׁת הַנְּכוֹנָה.",
    "find-hey":
        "גָּרְרוּ אֶת הַכּוֹכָבִים עִם הָאוֹת הֵא לָרֶשֶׁת.",
}

FORCE = "--force" in sys.argv


async def gen(text: str, filename: str) -> str:
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not FORCE:
        return f"skip {filename}"
    try:
        tts = edge_tts.Communicate(text, VOICE_AVRI, rate=RATE)
        await tts.save(str(out))
        return f"OK   {filename}"
    except Exception as e:
        return f"FAIL {filename} ({type(e).__name__}: {e})"


async def main():
    items = list(LINES.items())
    print(f"Generating {len(items)} stars MP3s (voice={VOICE_AVRI}, rate={RATE})")
    print(f"Output dir: {OUT_DIR}")
    print()

    success = 0
    for i, (key, text) in enumerate(items, 1):
        result = await gen(text, key)
        print(f"[{i}/{len(items)}] {result}")
        if "OK" in result or "skip" in result:
            success += 1
        await asyncio.sleep(0.3)

    print(f"\nSuccess: {success}/{len(items)}")


if __name__ == "__main__":
    asyncio.run(main())
