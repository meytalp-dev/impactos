#!/usr/bin/env python3
"""
D.15 v2 G — אודיו אמנותי לאות ד · "ים הדגיגים האבודים".

המשחקון האמנותי הראשון בקבוצת דגים. 4 קבצים חדשים:
  intro-dalet-art   — סיפור פתיחה אמנותי (~10-12 שניות)
  dalet-found       — "כל הכבוד! דגיג חזר ללהקה" (~2 שניות, פר הקשה)
  dalet-school-done — "הים זוהר שוב! כל הלהקה איתנו!" (~3 שניות, finale)
  dalet-still-dark  — שורת חיזוק כשהילד תקוע ("חפש דגיג זוהר")

intro-dalet הקיים (גנרי) נשמר במאגר ולא נמחק.
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
    "intro-dalet-art":
        "הַיָּם אָפֵל. "
        "לְהָקַת דָּגִיגִים אָבְדָה אֶת דַּרְכָּהּ בַּסְּעָרָה. "
        "רַק הַדָּגִיגִים עִם הָאוֹת דָּלֶת זוֹהֲרִים בַּכָּתוֹם. "
        "בּוֹאוּ עִזְרוּ לִי לֶאֱסֹף אוֹתָם, "
        "וְכֹל דָּגִיג שֶׁיַּחֲזֹר לַלְּהָקָה יָאִיר עוֹד פִּנָּה בַּיָּם.",
    "dalet-found":
        "כֹּל הַכָּבוֹד! דָּגִיג חָזַר לַלְּהָקָה.",
    "dalet-school-done":
        "הִצְלַחְתֶּם! הַלְּהָקָה שְׁלֵמָה, וְהַיָּם זוֹהֵר שׁוּב!",
    "dalet-still-dark":
        "חַפְּשׂוּ דָּגִיג זוֹהֵר עִם הָאוֹת דָּלֶת.",
}

FORCE = "--force" in sys.argv

async def gen(text, filename):
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not FORCE:
        return f"skip {filename}"
    try:
        await edge_tts.Communicate(text, VOICE_AVRI, rate=RATE).save(str(out))
        return f"OK   {filename}"
    except Exception as e:
        return f"FAIL {filename} ({e})"

async def main():
    print(f"Generating {len(LINES)} dalet-art MP3s (voice={VOICE_AVRI}, rate={RATE})\n")
    for i, (k, t) in enumerate(LINES.items(), 1):
        print(f"[{i}/{len(LINES)}] {await gen(t, k)}")
        await asyncio.sleep(0.3)

asyncio.run(main())
