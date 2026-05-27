#!/usr/bin/env python3
"""
D.15 v2 שלב E — ייצור MP3 לקבוצת "להקת הדגים" (5 אותיות: ד·ג·ח·פ·כ).

10 קבצים (2 פר אות) — intro+find. רוטציה:
  ד → tap-all   (דג)
  ג → pick      (גמל)
  ח → memory    (חתול)
  פ → sort      (פיל)
  כ → tap-all   (כלב · חזרה לתחילת הרוטציה — האות החמישית)

נושא: "להקת הדגים". סיפור פתיחה: נוני שומע להקת דגים בים.
"""
import asyncio
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import edge_tts

VOICE_AVRI = "he-IL-AvriNeural"
RATE       = "-10%"

ROOT     = Path(__file__).parent.parent
OUT_DIR  = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

LINES = {
    # ד — tap-all
    "intro-dalet":
        "נוֹנִי שָׁמַע לְהָקַת דָּגִים זוֹהֲרִים בַּיָּם, "
        "וְעַל כֹּל דָּג יֵשׁ אוֹת! "
        "הַקִּישׁוּ עַל כֹּל הַדָּגִים עִם הָאוֹת דָּלֶת.",
    "find-dalet":
        "מִצְאוּ אֶת כֹּל הַדָּגִים עִם הָאוֹת דָּלֶת.",

    # ג — pick
    "intro-gimel":
        "נוֹנִי רוֹאֶה דָּגִים זוֹהֲרִים בַּיָּם! "
        "בְּכֹל סִבּוּב — בִּחֲרוּ אֶת הַדָּג עִם הָאוֹת גִּימֶל.",
    "find-gimel":
        "בִּחֲרוּ אֶת הַדָּג עִם הָאוֹת גִּימֶל.",

    # ח — memory-pair
    "intro-het":
        "נוֹנִי הִחְבִּיא קְלָפִים בֵּין הַדָּגִים! "
        "הָפְכוּ אוֹתָם וּמִצְאוּ זוּגוֹת. "
        "כֹּל זוּג: קֶלֶף עִם הָאוֹת חֵית וְקֶלֶף עִם תְּמוּנָה.",
    "find-het":
        "מִצְאוּ זוּג שֶׁל הָאוֹת חֵית.",

    # פ — sort-by-letter
    "intro-pey":
        "נוֹנִי רוֹאֶה דָּגִים זוֹהֲרִים בַּיָּם! "
        "יֵשׁ שְׁתֵּי רְשָׁתוֹת לְמַטָּה. "
        "גָּרְרוּ אֶת הַדָּגִים עִם הָאוֹת פֵּא לָרֶשֶׁת הַנְּכוֹנָה.",
    "find-pey":
        "גָּרְרוּ אֶת הַדָּגִים עִם הָאוֹת פֵּא לָרֶשֶׁת.",

    # כ — tap-all (חזרה לרוטציה — האות החמישית)
    "intro-kaf":
        "נוֹנִי שָׁמַע לְהָקַת דָּגִים זוֹהֲרִים בַּיָּם, "
        "וְעַל כֹּל דָּג יֵשׁ אוֹת! "
        "הַקִּישׁוּ עַל כֹּל הַדָּגִים עִם הָאוֹת כָּף.",
    "find-kaf":
        "מִצְאוּ אֶת כֹּל הַדָּגִים עִם הָאוֹת כָּף.",
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
    print(f"Generating {len(items)} fish MP3s (voice={VOICE_AVRI}, rate={RATE})")
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
