#!/usr/bin/env python3
"""
מייצר MP3 לכל המילים של שלב 3 + הודעות פידבק.
דורש: pip install edge-tts
"""
import asyncio
import json
import os
import sys
from pathlib import Path

import _eleven_tts as edge_tts  # מעבר ל-ElevenLabs (was: import edge_tts)

# קונסול Windows cp1252 לא מקודד עברית — מאלצים UTF-8 על stdout
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

VOICE_HILA = "he-IL-HilaNeural"   # אישה (לא בשימוש — Avri מדויק יותר בעברית)
VOICE_AVRI = "he-IL-AvriNeural"   # גבר — קול ברירת מחדל
VOICE = VOICE_AVRI

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

WORDS_FILE = ROOT / "data" / "words-to-generate.json"

# פידבק נוסף שלא קיים בתיקייה
FEEDBACK_LINES = {
    "trywithme": "בּוֹאוּ נְנַסֶּה יַחַד",
    "exactly": "בְּדִיּוּק",
    "wow": "וָואוּ, יָפֶה מְאוֹד",
    "right": "נָכוֹן",
    "press-here": "הַקֵּשׁ פֹּה",
    "look-here": "הִסְתַּכֵּל פֹּה",
    "lets-find": "בּוֹאוּ נִמְצָא יַחַד",
    "great": "כֹּל הַכָּבוֹד",
    "stage-done": "סִיַּמְתָּ אֶת הָאוֹת! מַמְשִׁיכִים",
    # "יְפֶהפֶה" הוחלף — מיטל 6.7.2026: שלוש גרסאות לסירוגין (מצוין/מעולה/נהדר)
    "all-done": "סִיַּמְתָּ אֶת כֹּל הָאוֹתִיּוֹת. מְצֻיָּן",
    "all-done-2": "סִיַּמְתָּ אֶת כֹּל הָאוֹתִיּוֹת. מְעֻלֶּה",
    "all-done-3": "סִיַּמְתָּ אֶת כֹּל הָאוֹתִיּוֹת. נֶהְדָּר",
}


FORCE = "--force" in sys.argv

async def gen(text: str, filename: str):
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not FORCE:
        return f"skip {filename}"
    try:
        tts = edge_tts.Communicate(text, VOICE, rate="-10%")
        await tts.save(str(out))
        return f"OK   {filename}"
    except Exception as e:
        return f"FAIL {filename} ({type(e).__name__})"


async def main():
    with open(WORDS_FILE, "r", encoding="utf-8") as f:
        words = json.load(f)

    items = list(words.items()) + [(k, v) for k, v in FEEDBACK_LINES.items()]
    print(f"Generating {len(items)} files sequentially...")

    success = 0
    for i, (key, text) in enumerate(items, 1):
        result = await gen(text, key)
        print(f"[{i}/{len(items)}] {result}")
        if "OK" in result or "skip" in result:
            success += 1
        # רווח קצר בין בקשות
        await asyncio.sleep(0.3)

    print(f"\nSuccess: {success}/{len(items)}")
    print(f"Output: {OUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
