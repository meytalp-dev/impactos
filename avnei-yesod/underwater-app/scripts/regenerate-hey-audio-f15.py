#!/usr/bin/env python3
"""
D.15 v2 F1.5 — הקלטה מחדש של intro-hey + find-hey.

הבעיה: AvriNeural מבטא "הֵא" כמילה לא ברורה, מיטל לא שמעה "אות ה'".
הפתרון: להחליף ל-"הֵי" שזה צליל יותר ברור פדגוגית לילד בן 6.

force overwrite (דורסת קבצים קיימים).
"""
import asyncio, sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import _eleven_tts as edge_tts  # מעבר ל-ElevenLabs (was: import edge_tts)

VOICE_AVRI = "he-IL-AvriNeural"
RATE       = "-10%"
OUT_DIR = Path(__file__).parent.parent / "assets" / "audio"

LINES = {
    "intro-hey":
        "נוּנִי רוֹאֶה כּוֹכָבִים זוֹהֲרִים בַּיָּם! "
        "יֵשׁ שְׁתֵּי רְשָׁתוֹת לְמַטָּה. "
        "גָּרְרוּ אֶת הַכּוֹכָבִים עִם הָאוֹת הֵי לָרֶשֶׁת הַנְּכוֹנָה.",
    "find-hey":
        "גָּרְרוּ אֶת הַכּוֹכָבִים עִם הָאוֹת הֵי לָרֶשֶׁת.",
}

async def gen(text, filename):
    out = OUT_DIR / f"{filename}.mp3"
    try:
        await edge_tts.Communicate(text, VOICE_AVRI, rate=RATE).save(str(out))
        return f"OK   {filename}"
    except Exception as e:
        return f"FAIL {filename} ({e})"

async def main():
    print(f"Re-generating {len(LINES)} hey MP3s (FORCE overwrite)\n")
    for i, (k, t) in enumerate(LINES.items(), 1):
        print(f"[{i}/{len(LINES)}] {await gen(t, k)}")
        await asyncio.sleep(0.3)

asyncio.run(main())
