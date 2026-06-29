#!/usr/bin/env python3
"""
מייצר MP3 ייעודיים למשחקון "הבית של נוני" (stage-3-house.html) — אות ב׳.

מצב ברירת מחדל: לא דורס קבצים קיימים. הוסיפו --force להקלטה מחדש.

דורש: pip install edge-tts
"""
import asyncio
import sys
from pathlib import Path

import _eleven_tts as edge_tts  # מעבר ל-ElevenLabs (was: import edge_tts)

VOICE_AVRI = "he-IL-AvriNeural"   # גבר — קביעה גלובלית באבני יסוד

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

HOUSE_LINES = {
    "intro-house-quest-bet":   "לְנוּנִי אֵין אֵיפֹה לִישׁוֹן. עִזְרוּ לוֹ לִבְנוֹת בַּיִת מֵאַלְמוּגִים בְּצוּרַת הָאוֹת בֵּית.",
    "intro-house-mission-bet": "בּוֹאוּ נִפְתֹּר חָמֵשׁ חִידוֹת עַל הָאוֹת בֵּית — וּבְכֹל פַּעַם תְּקַבְּלוּ לִבְנַת אַלְמוּג חֲדָשָׁה לַבַּיִת.",
    "finale-house-built":      "הַבַּיִת שֶׁל נוּנִי מוּכָן! יוֹפִי!",
}

FORCE = "--force" in sys.argv


async def gen(text: str, filename: str):
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not FORCE:
        return f"skip {filename}"
    try:
        tts = edge_tts.Communicate(text, VOICE_AVRI, rate="-10%")
        await tts.save(str(out))
        return f"OK   {filename}"
    except Exception as e:
        return f"FAIL {filename} ({type(e).__name__}: {e})"


async def main():
    items = list(HOUSE_LINES.items())
    print(f"Generating {len(items)} house audio files (voice={VOICE_AVRI})...")

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
