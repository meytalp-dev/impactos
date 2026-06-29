#!/usr/bin/env python3
"""
generate-island-04-narration-audio.py — נרטיב נוני לאי 4.

מפיק MP3 עם AvriNeural לרגעי הנרטיב:
  intro-isl04.mp3            — סיפור פתיחה (overlay start)
  completion-isl04.mp3       — סיום (overlay done)
  mission-isl04-cv-vs-cv.mp3 — הוראת מכניקה: בחרי בין 2
  mission-isl04-tap-cv.mp3   — הוראת מכניקה: ציד CV
  mission-isl04-listen-cv.mp3 — הוראת מכניקה: שמיעה
  mission-isl04-match.mp3    — הוראת מכניקה: התאמת מילה

טקסטים מנוקדים מלא (לפי feedback-tts-hebrew-niqud-pitfalls).
"""
import asyncio
import sys
from pathlib import Path

import _eleven_tts as edge_tts  # מעבר ל-ElevenLabs (was: import edge_tts)

VOICE = "he-IL-AvriNeural"
RATE = "-10%"

ROOT = Path(__file__).parent.parent
OUT = ROOT / "assets" / "audio"
OUT.mkdir(parents=True, exist_ok=True)

LINES = {
    # סיפור פתיחה
    'intro-isl04': (
        "הַשּׁוּנִית הַשְּׁקֵטָה. "
        "בַּשּׁוּנִית שֶׁל נוּנִי חַיִּים חֲמִשָּׁה דָּגִים, "
        "וְכֹל אֶחָד שָׁר צְלִיל אַחֵר. "
        "אֲבָל הַיּוֹם הַיָּם שָׁקֵט — הַדָּגִים שָׁכְחוּ אֶת הַצְּלִיל שֶׁלָּהֶם. "
        "בּוֹאוּ נַעֲזֹר לְכֹל דָּג לְהִזָּכֵר!"
    ),
    # סיום
    'completion-isl04': (
        "הַשּׁוּנִית שָׁרָה! "
        "כֹּל חֲמֵשֶׁת הַדָּגִים מָצְאוּ אֶת הַצְּלִיל שֶׁלָּהֶם. "
        "כֹּל הַכָּבוֹד!"
    ),
    # הוראות מכניקה (גנריות — לא פר אות)
    'mission-isl04-cv-vs-cv': (
        "הַדָּג שׁוֹמֵעַ שְׁנֵי צְלִילִים — "
        "בַּחֲרִי אֶת הַצְּלִיל הַנָּכוֹן שֶׁלּוֹ."
    ),
    'mission-isl04-tap-cv': (
        "הַדָּג מְחַפֵּשׂ אֶת הַצְּלִיל שֶׁלּוֹ — "
        "אִסְפִי בִּשְׁבִילוֹ אֶת כֹּל הַצּוּרוֹת שֶׁל הַצְּלִיל הַזֶּה."
    ),
    'mission-isl04-listen-cv': (
        "הַדָּג שָׁר חַלָּשׁ. "
        "הַקְשִׁיבִי לַצְּלִיל שֶׁלּוֹ — "
        "וְהַקִּישִׁי עַל הַצּוּרָה הַנְּכוֹנָה."
    ),
    'mission-isl04-match': (
        "הַדָּג מְחַפֵּשׂ מִלָּה יְדִידָה שֶׁמַּתְחִילָה כָּמוֹהוּ. "
        "בַּחֲרִי אֶת הַמִּלָּה הַנְּכוֹנָה."
    ),
}


async def gen(key: str, text: str, force: bool = False, retries: int = 3) -> str:
    out = OUT / f"{key}.mp3"
    if out.exists() and not force and out.stat().st_size > 100:
        return f"skip {key}"
    last_err = None
    for attempt in range(retries):
        try:
            tts = edge_tts.Communicate(text, VOICE, rate=RATE)
            await tts.save(str(out))
            if out.exists() and out.stat().st_size > 100:
                return f"OK   {key}"
            if out.exists():
                out.unlink()
        except Exception as e:
            last_err = e
        await asyncio.sleep(0.5 * (attempt + 1))
    return f"FAIL {key}: {last_err or 'no audio'}"


async def main():
    force = '--force' in sys.argv
    print(f"בונה {len(LINES)} narration MP3 (voice={VOICE}, rate={RATE})...")
    results = []
    for i, (key, text) in enumerate(LINES.items()):
        r = await gen(key, text, force)
        print(f"  [{i+1}/{len(LINES)}] {r}")
        results.append(r)
        await asyncio.sleep(0.15)
    ok = sum(1 for r in results if r.startswith('OK'))
    skip = sum(1 for r in results if r.startswith('skip'))
    fail = sum(1 for r in results if r.startswith('FAIL'))
    print(f"\n✓ {ok} נוצרו · {skip} דולגו · {fail} נכשלו")
    if fail > 0:
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main())
