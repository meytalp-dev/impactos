#!/usr/bin/env python3
"""
D.15 שלב 1 — ייצור MP3 ל-3 האותיות החסרות בקבוצת "בועות בים":
ל (lamed), נ (nun), א (alef).

6 קבצים סה"כ (2 פר אות, באותו דפוס כמו shin):
  intro-<key>.mp3  — קובץ אחד מאוחד (פתיחה + משימה). פותרת iOS Safari
                     שלא מתיר רצף audio אחרי setTimeout/onended.
  find-<key>.mp3   — הוראה במשחק (מנוגן 300ms אחרי mount + ב-auto-hint).

מצב ברירת מחדל: לא דורס קבצים קיימים. --force כדי להקליט מחדש.
דורש: pip install edge-tts

3 כללי ניקוד/TTS עברי שאומצו מ-shin demo (לפי
[[feedback-tts-hebrew-niqud-pitfalls]]):
  1. "כֹּל" בחולם (לא "כָּל") — אחרת AvriNeural קורא "kal" (קמץ-קטן).
  2. AvriNeural בלבד · rate -10%.
  3. ניסוח טבעי "הבועות עם האות X" — לא "בועות-X" (סמיכות אקדמית).
  4. שם האות בכתיב מלא ומנוקד: לָמֶד · נוּן · אָלֶף.
"""
import asyncio
import sys
from pathlib import Path

import edge_tts

VOICE_AVRI = "he-IL-AvriNeural"   # קביעה גלובלית באבני יסוד (23.5.2026)
RATE       = "-10%"               # אותו rate כמו בכל יתר ה-scripts

ROOT     = Path(__file__).parent.parent
OUT_DIR  = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# נושא: בועות בים (אותה תבנית כמו shin — D.14).
# 3 אותיות: ל / נ / א. כל אות מקבלת intro מאוחד + find.
LETTERS = [
    {
        "key":  "lamed",
        "name": "לָמֶד",     # שם אות מנוקד מלא (לפי הזיכרון על TTS)
    },
    {
        "key":  "nun",
        "name": "נוּן",
    },
    {
        "key":  "alef",
        "name": "אָלֶף",
    },
]


def build_lines(letter_name: str) -> dict:
    """בונה את 2 השורות פר אות עם שם האות במנוקד."""
    return {
        # intro מאוחד (פתיחה נרטיבית + הוראה מפורשת) — קובץ אחד פר אות.
        # סימני הפיסוק (! .) נותנים הפסקות טבעיות.
        "intro": (
            f"נוֹנִי מָצָא בּוּעוֹת זוֹהֲרוֹת בַּיָּם, וּבְכֹל בּוּעָה יֵשׁ אוֹת! "
            f"בּוֹאוּ תַּקִּישׁוּ עַל כֹּל הַבּוּעוֹת עִם הָאוֹת {letter_name}, "
            f"וְכֹל אַחַת שֶׁתַּדְלִיקוּ תַּחֲזִיר עוֹד אוֹר לַיָּם."
        ),
        # find — הוראה במשחק (מנוגן אחרי mount + auto-hint).
        "find": (
            f"מִצְאוּ אֶת כֹּל הַבּוּעוֹת עִם הָאוֹת {letter_name} בַּיָּם."
        ),
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
    # בונה רשימה שטוחה של (filename, text) עבור 3 אותיות × 2 קבצים.
    items = []
    for L in LETTERS:
        lines = build_lines(L["name"])
        items.append((f"intro-{L['key']}", lines["intro"]))
        items.append((f"find-{L['key']}",  lines["find"]))

    print(f"Generating {len(items)} files (voice={VOICE_AVRI}, rate={RATE})")
    print(f"Output dir: {OUT_DIR}")
    print()

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
