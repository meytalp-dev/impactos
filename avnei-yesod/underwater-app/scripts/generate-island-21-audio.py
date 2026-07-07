#!/usr/bin/env python3
"""
generate-island-21-audio.py — נרטיב + משפטים + מילים לאי 21 (לגונת הבקבוקים · דיקטה-בבנייה).

H21 · 7.7.2026 · לוח בניית האיים. תבנית: generate-island-20-audio.py.

מפיק בקול נוני (ElevenLabs eleven_v3 · ZI6I4a3UGgs1DXxqWjBV דרך _eleven_tts):
  • 3 קליפי-נרטיב (intro/mission/completion)
  • 8 משפטי-דיקטה (isl21-sent-*)  — נוני משמיעה אותם, הילד.ה בונה מהמילים
  • מילים בודדות (isl21-word-*)    — להאזנה בלחיצה-ארוכה על אריח

מילים והמשפטים = ASK פדגוגי למיטל (אוצר גן/א', נושא ימי). ניקוד מלא · ב/כ/פ דגש קל.
נוני = נקבה ("נוני שָׁרָה"/"נוני רוֹאָה").

שבחים: "כֹּל הַכָּבוֹד" / "מְעֻלֶּה" — אסור "יופי" (הגייה רעה).
QA: תמלול Whisper (אני לא שומע — לתמלל ולאמת שכל קליפ תואם).

דורש: pip install elevenlabs python-dotenv ; ELEVENLABS_API_KEY ב-.env של הריפו.
הרצה (מתוך avnei-yesod/underwater-app):
  PYTHONIOENCODING=utf-8 python scripts/generate-island-21-audio.py
  PYTHONIOENCODING=utf-8 python scripts/generate-island-21-audio.py --force
  PYTHONIOENCODING=utf-8 python scripts/generate-island-21-audio.py --only isl21-sent-gal-ba
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

# ── נרטיב מנוקד מלא (תלמיד.ת כיתה א' אינה קוראת שוטף) ──────────────────────
INTRO_TEXT = (
    "בַּלָּגוּנָה צָפִים בַּקְבּוּקִים עִם פְּתָקִים. "
    "זֶרֶם חָזָק עִרְבֵּב אֶת הַמִּלִּים שֶׁבְּתוֹךְ הַמִּשְׁפָּטִים. "
    "נוֹנִי תַּשְׁמִיעַ לָכֶם מָה הַבַּקְבּוּק אָמַר, וְאַתֶּם בּוֹנֵי הַמִּשְׁפָּטִים — "
    "מְסַדְּרִים אֶת הַמִּלִּים בַּסֵּדֶר הַנָּכוֹן!"
)

MISSION_TEXT = (
    "הַקְשִׁיבוּ טוֹב לַמִּשְׁפָּט. "
    "סַדְּרוּ אֶת הַמִּלִּים לְפִי הַסֵּדֶר — מִיָּמִין לִשְׂמֹאל. "
    "רוֹצִים לִשְׁמֹעַ שׁוּב? לִחֲצוּ עַל הַכַּפְתּוֹר."
)

COMPLETION_TEXT = (
    "כֹּל הַמִּשְׁפָּטִים חָזְרוּ לַבַּקְבּוּקִים! "
    "עַכְשָׁו אַתֶּם יוֹדְעִים לִבְנוֹת מִשְׁפָּט מִמָּה שֶׁשְּׁמַעְתֶּם. "
    "כֹּל הַכָּבוֹד!"
)

# ── משפטי-דיקטה (isl21-sent-<slug>) — חייבים לתאום ל-island21-sentences.js ──
SENTENCES = [
    ("גַּל בָּא.",                     "isl21-sent-gal-ba"),
    ("הַדָּג שָׂמֵחַ.",                 "isl21-sent-hadag-sameach"),
    ("נוֹנִי שָׁרָה.",                  "isl21-sent-noni-shara"),
    ("הַדָּג שָׁט בַּיָּם.",             "isl21-sent-hadag-shat-bayam"),
    ("גַּל גָּדוֹל בָּא.",              "isl21-sent-gal-gadol-ba"),
    ("נוֹנִי רוֹאָה דָּג.",             "isl21-sent-noni-roa-dag"),
    ("הַדָּג הַקָּטָן שָׁט בַּיָּם.",     "isl21-sent-hadag-hakatan-shat-bayam"),
    ("נוֹנִי רוֹאָה גַּל גָּדוֹל.",      "isl21-sent-noni-roa-gal-gadol"),
]

# ── מילים בודדות (isl21-word-<slug>) — כל מילה ייחודית במשפטים + מסיחים ──────
WORDS = [
    ("גַּל", "isl21-word-gal"),
    ("בָּא", "isl21-word-ba"),
    ("הַדָּג", "isl21-word-hadag"),
    ("דָּג", "isl21-word-dag"),
    ("שָׂמֵחַ", "isl21-word-sameach"),
    ("נוֹנִי", "isl21-word-noni"),
    ("שָׁרָה", "isl21-word-shara"),
    ("שָׁט", "isl21-word-shat"),
    ("בַּיָּם", "isl21-word-bayam"),
    ("גָּדוֹל", "isl21-word-gadol"),
    ("רוֹאָה", "isl21-word-roa"),
    ("הַקָּטָן", "isl21-word-hakatan"),
    # מסיחים
    ("יָם", "isl21-word-yam"),
    ("קָטָן", "isl21-word-katan"),
    ("שֶׁמֶשׁ", "isl21-word-shemesh"),
    ("חוֹל", "isl21-word-chol"),
    ("כָּחֹל", "isl21-word-kachol"),
]

JOBS = [
    (INTRO_TEXT, "intro-isl21"),
    (MISSION_TEXT, "mission-isl21"),
    (COMPLETION_TEXT, "completion-isl21"),
] + SENTENCES + WORDS


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
    ap.add_argument('--only', help='רק קליפ אחד לפי שם קובץ')
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
