#!/usr/bin/env python3
"""
מייצר MP3 ייעודיים למשחקון "הסערה והאור" (stage-3-storm.html).

מצב ברירת מחדל: לא דורס קבצים קיימים. הוסיפו --force כדי להקליט מחדש.

דורש: pip install edge-tts
"""
import asyncio
import sys
from pathlib import Path

import _eleven_tts as edge_tts  # מעבר ל-ElevenLabs (was: import edge_tts)

VOICE_AVRI = "he-IL-AvriNeural"   # גבר — קביעה גלובלית באבני יסוד (לקח 23.5.2026)

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

STORM_LINES = {
    # מ׳ — לגיבוי בלבד; המשחקון הראשי כעת על ת׳
    "intro-storm-quest":     "הָיְתָה סְעָרָה. גַּן הָאַלְמוּגִים חָשׁוּךְ. נוּנִי עָצוּב.",
    "intro-storm-mission":   "בּוֹאוּ נִפְתֹּר חָמֵשׁ חִידוֹת עַל הָאוֹת מֵם, וְנַדְלִיק חֲמִשָּׁה אַלְמוּגֵי מֵם — וְכָל אַלְמוּג יַחֲזִיר עוֹד אוֹר לַיָּם.",
    "finale-storm-cleared":  "הַיָּם זוֹהֵר שׁוּב! יוֹפִי!",
    # ת׳ — המשחקון הפעיל
    "intro-storm-tav-quest":     "הָיְתָה סְעָרָה. גַּן הָאַלְמוּגִים חָשׁוּךְ. נוּנִי עָצוּב.",
    "intro-storm-tav-mission":   "בּוֹאוּ נִפְתֹּר חָמֵשׁ חִידוֹת עַל הָאוֹת תָו, וְנַדְלִיק חֲמִשָּׁה אַלְמוּגֵי תָו — וְכָל אַלְמוּג יַחֲזִיר עוֹד אוֹר לַיָּם.",
    "finale-storm-tav-cleared":  "הַיָּם זוֹהֵר שׁוּב! יוֹפִי!",
}

FORCE = "--force" in sys.argv


async def gen(text: str, filename: str):
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not FORCE:
        return f"skip {filename}"
    try:
        tts = edge_tts.Communicate(text, VOICE_AVRI, rate="-10%")
        await tts.save(str(out))
        return f"OK   {filename}"   # not printing Hebrew text — Windows cp1252 console can't encode
    except Exception as e:
        return f"FAIL {filename} ({type(e).__name__}: {e})"


async def main():
    items = list(STORM_LINES.items())
    print(f"Generating {len(items)} storm audio files (voice={VOICE_AVRI})...")

    success = 0
    for i, (key, text) in enumerate(items, 1):
        result = await gen(text, key)
        print(f"[{i}/{len(items)}] {result}")
        if "OK" in result or "skip" in result:
            success += 1
        await asyncio.sleep(0.3)

    print(f"\nSuccess: {success}/{len(items)}")
    print(f"Output: {OUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
