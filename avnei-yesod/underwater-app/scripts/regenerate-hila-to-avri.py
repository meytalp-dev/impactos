#!/usr/bin/env python3
"""
חד-פעמי: רגנרציה של 21 קבצי MP3 שהוקלטו ב-HilaNeural ל-AvriNeural.
לפי כלל זיכרון feedback_avrineural_tts_only.md.

גיבוי לפני: assets/audio/_old-hila-backup/
"""
import asyncio
import sys
from pathlib import Path

import edge_tts

VOICE = "he-IL-AvriNeural"
ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"

# 21 קבצים שהוקלטו ב-HilaNeural ב-22.5 (לפי mtime + voice במחולל הישן)
# 17 צלילי אותיות (לכל האותיות שאינן MVP) + 4 פרזות מערכת
FILES_TO_REGENERATE = {
    # פרזות מערכת — בשימוש פעיל
    "good":       "כָּל הַכָּבוֹד!",
    "try-again":  "בּוֹאִי נְנַסֶּה שׁוּב",
    "what-letter": "אֵיזוֹ אוֹת?",
    "what-sound":  "אֵיזֶה צְלִיל?",

    # 17 צלילי אותיות שאינן MVP — מוכנים לאות חדשה
    # שווא נע אחרי האות נותן את הצליל הקצר
    "sound-alef":   "אְ",
    "sound-gimel":  "גְּ",
    "sound-dalet":  "דְּ",
    "sound-hey":    "הְ",
    "sound-vav":    "וְ",
    "sound-zayin":  "זְ",
    "sound-het":    "חְ",
    "sound-tet":    "טְ",
    "sound-yud":    "יְ",
    "sound-kaf":    "כְּ",
    "sound-lamed":  "לְ",
    "sound-nun":    "נְ",
    "sound-samekh": "סְ",
    "sound-ayin":   "עְ",
    "sound-pey":    "פְּ",
    "sound-tzadi":  "צְ",
    "sound-shin":   "שְׁ",
}


async def gen(text: str, filename: str):
    out = OUT_DIR / f"{filename}.mp3"
    try:
        tts = edge_tts.Communicate(text, VOICE, rate="-15%")
        await tts.save(str(out))
        size_kb = out.stat().st_size / 1024
        return f"OK   {filename}.mp3 ({size_kb:.1f}KB): {text}"
    except Exception as e:
        return f"FAIL {filename}: {text} ({type(e).__name__}: {e})"


async def main():
    items = list(FILES_TO_REGENERATE.items())
    print(f"Regenerating {len(items)} files in AvriNeural...")
    print(f"Output: {OUT_DIR}\n")

    success = 0
    for i, (key, text) in enumerate(items, 1):
        result = await gen(text, key)
        print(f"[{i:2}/{len(items)}] {result}")
        if "OK" in result:
            success += 1
        await asyncio.sleep(0.3)

    print(f"\nDone. {success}/{len(items)} files regenerated.")
    print("Backup of old Hila files: assets/audio/_old-hila-backup/")


if __name__ == "__main__":
    asyncio.run(main())
