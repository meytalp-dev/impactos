#!/usr/bin/env python3
"""
מייצר MP3 לשמות 5 האותיות הפעילות באי 3.
שמות לפי האקדמיה ללשון העברית.
דורש: pip install edge-tts
"""
import asyncio
from pathlib import Path

import edge_tts

VOICE = "he-IL-HilaNeural"

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# שמות 5 האותיות הפעילות באי 3 (סדר חוברת 1 קסם וחברים)
LETTER_NAMES = {
    "name-tav":  "תָּו",
    "name-mem":  "מֵם",
    "name-resh": "רֵישׁ",
    "name-bet":  "בֵּית",
    "name-qof":  "קוֹף",
}


async def gen(text: str, filename: str):
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists():
        return f"skip {filename}"
    try:
        tts = edge_tts.Communicate(text, VOICE, rate="-15%")
        await tts.save(str(out))
        return f"OK   {filename}: {text}"
    except Exception as e:
        return f"FAIL {filename}: {text} ({type(e).__name__}: {e})"


async def main():
    items = list(LETTER_NAMES.items())
    print(f"Generating {len(items)} letter-name files...")

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
