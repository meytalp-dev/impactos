#!/usr/bin/env python3
"""
מייצר MP3 לצלילי 5 האותיות הפעילות באי 3.
צליל = ההגייה הראשונית של האות (לא שם האות, לא מילה).
דורש: pip install edge-tts
"""
import asyncio
import sys
from pathlib import Path

import _eleven_tts as edge_tts  # מעבר ל-ElevenLabs (was: import edge_tts)

VOICE = "he-IL-AvriNeural"   # גבר — מדויק יותר בעברית
FORCE = "--force" in sys.argv

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# צלילי 5 האותיות — שווא נע אחרי האות נותן את הצליל הקצר
# (להבדיל משם האות "מם" או הברה מלאה "מַ")
LETTER_SOUNDS = {
    "sound-tav":  "תְ",   # /t/
    "sound-mem":  "מְ",   # /m/
    "sound-resh": "רְ",   # /r/
    "sound-bet":  "בְּ",  # /b/ (בית עם דגש)
    "sound-qof":  "קְ",   # /k/
}


async def gen(text: str, filename: str):
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not FORCE:
        return f"skip {filename}"
    try:
        tts = edge_tts.Communicate(text, VOICE, rate="-20%")
        await tts.save(str(out))
        return f"OK   {filename}: {text}"
    except Exception as e:
        return f"FAIL {filename}: {text} ({type(e).__name__}: {e})"


async def main():
    items = list(LETTER_SOUNDS.items())
    print(f"Generating {len(items)} letter-sound files (voice={VOICE}, force={FORCE})...")

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
