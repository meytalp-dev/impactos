#!/usr/bin/env python3
"""
generate-island-20-audio.py — נרטיב אי 20 (שונית בוני המילים · איות פונולוגי-אותי).

N20 · 7.7.2026 · לוח בניית האיים. תבנית: generate-island-05-word-audio.py.

מפיק 3 קליפי-נרטיב בקול נוני (ElevenLabs eleven_v3 · ZI6I4a3UGgs1DXxqWjBV דרך
_eleven_tts). מילות ה-target וצלילי ה-CV כבר קיימים מאי 5 (word-*.mp3 / cv-*.mp3)
— לא מפיקים אותם כאן.

  intro-isl20.mp3          — סיפור הזרם ששטף את האותיות (דף-האי)
  mission-isl20-spell.mp3  — הוראת המשחקון (פעם אחת בתחילת ריצה)
  completion-isl20.mp3     — מסך-סיום

שבחים: "כֹּל הַכָּבוֹד" / "מְעֻלֶּה" — אסור "יופי" (הגייה רעה).
QA: תמלול Whisper (אני לא שומע — לתמלל ולאמת שכל קליפ תואם).

דורש: pip install elevenlabs python-dotenv ; ELEVENLABS_API_KEY ב-.env של הריפו.
הרצה (מתוך avnei-yesod/underwater-app):
  PYTHONIOENCODING=utf-8 python scripts/generate-island-20-audio.py
  PYTHONIOENCODING=utf-8 python scripts/generate-island-20-audio.py --force
"""
import argparse
import asyncio
import sys
from pathlib import Path

import _eleven_tts as edge_tts  # קול נוני (ElevenLabs)

VOICE_AVRI = "he-IL-AvriNeural"  # מתעלמים ממנו בשים — לתאימות בלבד
RATE = "-10%"

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# נרטיב מנוקד מלא (תלמיד.ת כיתה א' אינה קוראת שוטף).
INTRO_TEXT = (
    "זֶרֶם חָזָק עָבַר בַּשּׁוּנִית וְשָׁטַף אֶת הָאוֹתִיּוֹת מֵהַצְּדָפִים. "
    "עַכְשָׁו הַמִּלִּים נִשְׁמָעוֹת, אֲבָל אִי אֶפְשָׁר לִרְאוֹת אוֹתָן. "
    "נוֹנִי תַּשְׁמִיעַ לָכֶם מִלָּה, וְאַתֶּם בּוֹנֵי הַמִּלִּים — "
    "מַרְכִּיבִים אוֹתָהּ מֵהַצֵּרוּפִים!"
)

MISSION_TEXT = (
    "הַקְשִׁיבוּ טוֹב לַמִּלָּה. "
    "הַרְכִּיבוּ אוֹתָהּ מֵהַצֵּרוּפִים, לְפִי הַסֵּדֶר — מִיָּמִין לִשְׂמֹאל. "
    "רוֹצִים לִשְׁמֹעַ שׁוּב? לִחֲצוּ עַל הַכַּפְתּוֹר."
)

COMPLETION_TEXT = (
    "כֹּל הַמִּלִּים חָזְרוּ לַצְּדָפִים! "
    "עַכְשָׁו אַתֶּם יוֹדְעִים לִבְנוֹת מִלָּה מִמָּה שֶׁשְּׁמַעְתֶּם. "
    "כֹּל הַכָּבוֹד!"
)

JOBS = [
    (INTRO_TEXT, "intro-isl20"),
    (MISSION_TEXT, "mission-isl20-spell"),
    (COMPLETION_TEXT, "completion-isl20"),
]


async def gen_one(text: str, filename: str, force: bool, retries: int = 3) -> str:
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not force:
        return f"skip {filename}"
    last_err = None
    for attempt in range(retries):
        try:
            tts = edge_tts.Communicate(text, VOICE_AVRI, rate=RATE)
            await tts.save(str(out))
            if out.exists() and out.stat().st_size > 100:
                return f"OK   {filename}" + (f" (retry {attempt})" if attempt > 0 else "")
            if out.exists():
                out.unlink()
        except Exception as e:
            last_err = e
        await asyncio.sleep(0.5 * (attempt + 1))
    return f"FAIL {filename}: {last_err or 'no audio after retries'}"


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--force', action='store_true', help='דרוס קבצים קיימים')
    ap.add_argument('--only', help='רק קליפ אחד לפי שם קובץ (intro-isl20/mission-isl20-spell/completion-isl20)')
    args = ap.parse_args()

    jobs = [j for j in JOBS if (not args.only or j[1] == args.only)]
    if not jobs:
        print(f"✗ לא נמצא קליפ: {args.only}", file=sys.stderr)
        sys.exit(1)

    print(f"בונה {len(jobs)} MP3 (voice=נוני/ElevenLabs)...")
    results = []
    for i, (text, filename) in enumerate(jobs):
        result = await gen_one(text, filename, args.force)
        results.append(result)
        print(f"  [{i+1}/{len(jobs)}] {result}")
        await asyncio.sleep(0.1)

    ok = sum(1 for r in results if r.startswith('OK'))
    skip = sum(1 for r in results if r.startswith('skip'))
    fail = sum(1 for r in results if r.startswith('FAIL'))
    print(f"\n✓ סיכום: {ok} נוצרו · {skip} דולגו · {fail} נכשלו")
    if fail:
        for r in results:
            if r.startswith('FAIL'):
                print(f"  {r}")
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main())
