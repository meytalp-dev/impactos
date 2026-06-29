#!/usr/bin/env python3
"""
מייצר MP3 ייעודיים למשחקון "שביל החזרה" (stage-3-journey*.html) — אות מ' + אות ר'.

כולל:
- intro (quest + mission) לכל אות — הסבר מלא של המשימה (לא רק צליל!)
- mission speaker (כפתור הרמקול בתוך המשחק) — שאלת המשימה המלאה
- scaffolding — "ננסה יחד" אחרי טעות ראשונה

מצב ברירת מחדל: לא דורס קבצים קיימים. הוסיפו --force להקלטה מחדש.

דורש: pip install edge-tts
"""
import asyncio
import sys
from pathlib import Path

import _eleven_tts as edge_tts  # מעבר ל-ElevenLabs (was: import edge_tts)

VOICE_AVRI = "he-IL-AvriNeural"   # גבר — קביעה גלובלית באבני יסוד

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

JOURNEY_LINES = {
    # ===== Intro (start screen) — full mission explanation =====
    "intro-journey-quest-mem":    "נוּנִי הָלַךְ לְאִבּוּד. הוּא רוֹאֶה אֶת הַבַּיִת רָחוֹק.",
    "intro-journey-mission-mem":  "בַּדֶּרֶךְ יֵשׁ אֲבָנִים. רַק עַל אֲבָנִים עִם הָאוֹת מֵם אֶפְשָׁר לִנְחֹת. בּוֹאוּ נַחְזֹר הַבַּיְתָה!",

    "intro-journey-quest-resh":   "נוּנִי הוֹלֵךְ בָּרַגְלַיִם בַּחֲזָרָה הַבַּיְתָה.",
    "intro-journey-mission-resh": "בַּדֶּרֶךְ יֵשׁ אֲבָנִים. רַק עַל אֲבָנִים עִם הָאוֹת רֵישׁ אֶפְשָׁר לִנְחֹת. בּוֹאוּ נַחְזֹר הַבַּיְתָה!",

    # ===== Mission speaker (in-game) — full sentence, not just the letter sound =====
    "mission-find-stone-mem":     "תִּמְצְאוּ אֶת הָאֶבֶן עִם הָאוֹת מֵם.",
    "mission-find-stone-resh":    "תִּמְצְאוּ אֶת הָאֶבֶן עִם הָאוֹת רֵישׁ.",

    # ===== Scaffolding — feedback after wrong taps =====
    "try-together":               "נְנַסֶּה יַחַד.",
    "scaffold-here-mem":          "הִנֵּה הִיא, הָאוֹת מֵם. הַקִּישׁוּ עָלֶיהָ.",
    "scaffold-here-resh":         "הִנֵּה הִיא, הָאוֹת רֵישׁ. הַקִּישׁוּ עָלֶיהָ.",
}

FORCE = "--force" in sys.argv


async def gen(text: str, filename: str):
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not FORCE:
        return f"skip {filename}"
    try:
        tts = edge_tts.Communicate(text, VOICE_AVRI, rate="-10%")
        await tts.save(str(out))
        return f"OK   {filename}"
    except Exception as e:
        return f"FAIL {filename} ({type(e).__name__}: {e})"


async def main():
    items = list(JOURNEY_LINES.items())
    print(f"Generating {len(items)} journey audio files (voice={VOICE_AVRI})...")

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
