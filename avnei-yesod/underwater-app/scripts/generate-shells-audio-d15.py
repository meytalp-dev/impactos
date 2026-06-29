#!/usr/bin/env python3
"""
D.15 v2 שלב D — ייצור MP3 לקבוצת "צדפי החוף" (4 אותיות: ס·ע·צ·ט).

8 קבצים (2 פר אות) — intro+find, עם ניסוח מותאם למכניקה ולנושא:
  ס → tap-all   (כל הצדפים עם האות)
  ע → pick      (בחירה בסיבוב)
  צ → memory    (זוגות בחול)
  ט → sort      (גרירה לרשת)

נושא: "צדפי החוף". סיפור פתיחה: נוני מוצא צדפים זוהרים על החוף.

דורש: pip install edge-tts
הרצה: python scripts/generate-shells-audio-d15.py [--force]
"""
import asyncio
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import _eleven_tts as edge_tts  # מעבר ל-ElevenLabs (was: import edge_tts)

VOICE_AVRI = "he-IL-AvriNeural"
RATE       = "-10%"

ROOT     = Path(__file__).parent.parent
OUT_DIR  = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

LINES = {
    # ס — tap-all
    "intro-samekh":
        "נוּנִי מָצָא צְדָפִים זוֹהֲרִים עַל הַחוֹף, "
        "וּבְכֹל צֶדֶף יֵשׁ אוֹת! "
        "הַקִּישׁוּ עַל כֹּל הַצְּדָפִים עִם הָאוֹת סָמֶךְ.",
    "find-samekh":
        "מִצְאוּ אֶת כֹּל הַצְּדָפִים עִם הָאוֹת סָמֶךְ.",

    # ע — pick
    "intro-ayin":
        "נוּנִי רוֹאֶה צְדָפִים זוֹהֲרִים עַל הַחוֹף! "
        "בְּכֹל סִבּוּב — בִּחֲרוּ אֶת הַצֶּדֶף עִם הָאוֹת עַיִן.",
    "find-ayin":
        "בִּחֲרוּ אֶת הַצֶּדֶף עִם הָאוֹת עַיִן.",

    # צ — memory-pair
    "intro-tzadi":
        "נוּנִי הִחְבִּיא קְלָפִים בַּחוֹל! "
        "הָפְכוּ אוֹתָם וּמִצְאוּ זוּגוֹת. "
        "כֹּל זוּג: קֶלֶף עִם הָאוֹת צָדִי וְקֶלֶף עִם תְּמוּנָה.",
    "find-tzadi":
        "מִצְאוּ זוּג שֶׁל הָאוֹת צָדִי.",

    # ט — sort-by-letter
    "intro-tet":
        "נוּנִי רוֹאֶה צְדָפִים זוֹהֲרִים עַל הַחוֹף! "
        "יֵשׁ שְׁתֵּי רְשָׁתוֹת לְמַטָּה. "
        "גָּרְרוּ אֶת הַצְּדָפִים עִם הָאוֹת טֵית לָרֶשֶׁת הַנְּכוֹנָה.",
    "find-tet":
        "גָּרְרוּ אֶת הַצְּדָפִים עִם הָאוֹת טֵית לָרֶשֶׁת.",
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
    print(f"Generating {len(items)} shells MP3s (voice={VOICE_AVRI}, rate={RATE})")
    print(f"Output dir: {OUT_DIR}\n")
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
