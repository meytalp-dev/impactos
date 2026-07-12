#!/usr/bin/env python3
"""
מייצר MP3 ייעודיים למשחקון "להקות הדגיגים" (stage-2-fish-schools.html) — אי 2.

המילים והפונמות עצמן כבר קיימות (מ-twin-seaweeds), כאן רק קווי המשחק.
קול: AvriNeural (גבר).
"""
import asyncio
import sys
from pathlib import Path

import _eleven_tts as edge_tts  # מעבר ל-ElevenLabs (was: import edge_tts)

VOICE_AVRI = "he-IL-AvriNeural"

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

GAME_LINES = {
    "intro-fish-schools":
        "בְּשׁוֹנִית הָאַצּוֹת חַיּוֹת זוּג לְהָקוֹת דְּגִיגִים. כֹּל לְהָקָה אוֹהֶבֶת צְלִיל אֶחָד.",
    "intro-fish-mission":
        "הַמְשִׂימָה שֶׁלָּכֶם: לְהַקְשִׁיב לְכָל דְּגִיג, וְלִשְׁלֹחַ אוֹתוֹ לַלְּהָקָה שֶׁמַּתְחִילָה בְּאוֹתוֹ צְלִיל.",
    "fish-question-where-belongs":
        "לְאֵיזוֹ לְהָקָה שַׁיָּךְ הַדָּגִיג הַזֶּה?",
    "fish-feedback-correct":
        "כֵּן! הַדָּגִיג חָזַר לַלְּהָקָה שֶׁלּוֹ.",
    "fish-feedback-try-again":
        "הַדָּגִיג עוֹד לֹא בְּמָקוֹם הַנָּכוֹן. כְּדַאי לְהַקְשִׁיב שׁוּב.",
    "fish-hint-listen-to-school":
        "הִקְלִידוּ עַל כֹּל לְהָקָה כְּדֵי לִשְׁמֹעַ אֶת הַצְּלִיל שֶׁלָּהּ.",
    "fish-finale-complete":
        "כֹּל הַדְּגִיגִים הִגִּיעוּ הַבַּיְתָה! הַלְּהָקוֹת שְׂמֵחוֹת.",
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
    items = list(GAME_LINES.items())
    print(f"Generating {len(items)} fish-schools audio files (voice={VOICE_AVRI})...")

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
