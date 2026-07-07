#!/usr/bin/env python3
"""
generate-island-06-audio.py — נרטיב אי 6 (אוטומטיזציה ושטף מילה · "להקת דגי המילים").

לוח בניית האיים N6 · 7.7.2026 — תבנית: generate-island-05-word-audio.py.

מפיק 4 קליפי-נרטיב בקול נוני (ElevenLabs eleven_v3, דרך _eleven_tts):
  intro-isl06          — סיפור בעיה→פתרון (דף-האי)
  mission-isl06-fast   — הוראת "דג מהיר"
  mission-isl06-repeat — הוראת "דגיגון חוזר"
  completion-isl06     — מסך-סיום (משותף לשני המשחקונים)

⚠️ מילות-היעד עצמן (word-<key>.mp3) כבר קיימות מאי 5 — הסקריפט הזה לא מייצר אותן.
   הבחירה במשחקון מוגבלת ל-anchor words שיש להן MP3 (island6-game.js).

QA (חובה): לתמלל כל קליפ ב-Whisper ולוודא התאמה (אתה לא שומע).

דורש: .env עם ELEVENLABS_API_KEY.
הרצה:
  python scripts/generate-island-06-audio.py           # 4 הקליפים
  python scripts/generate-island-06-audio.py --force   # דריסה
"""
import argparse
import asyncio
import sys
from pathlib import Path

import _eleven_tts as edge_tts  # ElevenLabs (קול נוני)

VOICE = "he-IL-AvriNeural"   # נקלט ומתועלם — _eleven_tts משתמש ב-voice_id נוני
RATE = "-8%"

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# נרטיב מנוקד מלא · לשון רבים · בלי "יופי" בשבחים.
CLIPS = {
    "intro-isl06": (
        "בַּשּׁוּנִית יֵשׁ לְהָקָה שֶׁל דְּגֵי מִלִּים, וְהֵם מְהִירִים מְאוֹד! "
        "כֹּל דָּג נוֹשֵׂא מִילָּה שֶׁכְּבָר לְמַדְתֶּם. "
        "הֵם חוֹלְפִים בְּהֶבְזֵק — זַהוּ אֶת הַמִּילָּה מַהֵר, וְהַדָּג יִשָּׁאֵר בַּלְּהָקָה!"
    ),
    "mission-isl06-fast": (
        "דָּג נוֹשֵׂא מִילָּה יַבְזִיק וְיִצְלֹל. "
        "זַהוּ אֶת הַמִּילָּה שֶׁרְאִיתֶם, וְהַקִּישׁוּ עָלֶיהָ מִבֵּין שָׁלוֹשׁ!"
    ),
    "mission-isl06-repeat": (
        "אוֹתָהּ מִילָּה תַּחֲזֹר עַל דָּגִים שׁוֹנִים. "
        "הַקְשִׁיבוּ, הִסְתַּכְּלוּ, וְהַקִּישׁוּ עָלֶיהָ — כֹּל פַּעַם מַהֵר יוֹתֵר!"
    ),
    "completion-isl06": (
        "כֹּל דְּגֵי הַמִּלִּים חָזְרוּ לַלְּהָקָה! "
        "עַכְשָׁיו אַתֶּם מַכִּירִים אֶת הַמִּלִּים בְּמַבָּט אֶחָד. "
        "כֹּל הַכָּבוֹד!"
    ),
}


async def gen_one(text: str, filename: str, force: bool, retries: int = 3) -> str:
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not force:
        return f"skip {filename}"
    last_err = None
    for attempt in range(retries):
        try:
            tts = edge_tts.Communicate(text, VOICE, rate=RATE)
            await tts.save(str(out))
            if out.exists() and out.stat().st_size > 100:
                return f"OK   {filename}" + (f" (retry {attempt})" if attempt > 0 else "")
            if out.exists():
                out.unlink()
        except Exception as e:
            last_err = e
        await asyncio.sleep(0.6 * (attempt + 1))
    return f"FAIL {filename}: {last_err or 'no audio after retries'}"


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="דרוס קבצים קיימים")
    ap.add_argument("--only", help="רק קליפ אחד (למשל intro-isl06)")
    args = ap.parse_args()

    jobs = list(CLIPS.items())
    if args.only:
        jobs = [(k, v) for k, v in jobs if k == args.only]
        if not jobs:
            print(f"✗ קליפ לא נמצא: {args.only}", file=sys.stderr)
            sys.exit(1)

    print(f"בונה {len(jobs)} MP3 (voice=נוני/ElevenLabs)...")
    results = []
    for i, (fn, text) in enumerate(jobs):
        r = await gen_one(text, fn, args.force)
        results.append(r)
        print(f"  [{i+1}/{len(jobs)}] {r}")
        await asyncio.sleep(0.15)

    fails = [r for r in results if r.startswith("FAIL")]
    ok = sum(1 for r in results if r.startswith("OK"))
    skip = sum(1 for r in results if r.startswith("skip"))
    print(f"\n✓ סיכום: {ok} נוצרו · {skip} דולגו · {len(fails)} נכשלו")
    if fails:
        for r in fails:
            print(f"  {r}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
