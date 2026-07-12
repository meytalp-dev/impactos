#!/usr/bin/env python3
"""
מייצר MP3 ייעודיים למשחקון "ים השמועות" (stage-2-whispers.html) — אי 2 · P2.
משחקון memory-pair על עיצור-סוגר (closing phoneme).

קול: AvriNeural (גבר) — קביעה גלובלית באבני יסוד.
מצב ברירת מחדל: לא דורס קבצים קיימים. הוסיפו --force להקלטה מחדש.

תלות: pip install edge-tts
"""
import asyncio
import sys
from pathlib import Path

import _eleven_tts as edge_tts  # מעבר ל-ElevenLabs (was: import edge_tts)

VOICE_AVRI = "he-IL-AvriNeural"

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# הוראות + פידבק + פינלה (8 קבצים)
GAME_LINES = {
    "intro-whispers":
        "בְּקַרְקָעִית הַיָּם שׁוֹכְבוֹת קוֹנְכִיּוֹת מִסְתּוֹרִיּוֹת. כֹּל קוֹנְכִיָּה לוֹחֶשֶׁת מִלָּה.",
    "intro-whispers-mission":
        "הַמְשִׂימָה שֶׁלָּכֶם: מִצְאוּ אֶת הַזּוּגוֹת שֶׁמִּסְתַּיְּמִים בְּאוֹתוֹ צְלִיל!",
    "whispers-question-find-pairs":
        "בַּחֲרוּ שְׁתֵּי קוֹנְכִיּוֹת שֶׁהַמִּלָּה שֶׁלָּהֶן נִשְׁמַעַת בְּאוֹתוֹ צְלִיל בַּסּוֹף.",
    "whispers-feedback-correct-pair":
        "יָפֶה! אוֹתוֹ צְלִיל בַּסּוֹף!",
    "whispers-feedback-wrong-pair":
        "אוּפְּס, צְלִילֵי הַסּוֹף שׁוֹנִים.",
    "whispers-feedback-try-again":
        "קָדִימָה, נִרְאֶה — אֵלוּ אוֹתוֹ צְלִיל בַּסּוֹף.",
    "whispers-hint-listen-to-ends":
        "הַקְשִׁיבוּ לַצְּלִיל שֶׁבַּסּוֹף שֶׁל כֹּל מִלָּה.",
    "whispers-finale-complete":
        "כֹּל הַצְּלִילִים נִפְגְּשׁוּ! יָם הַשְּׁמוּעוֹת שָׁקֵט וְזוֹהֵר.",
}

# פונמה חדשה אחת בלבד — phoneme-rrr (4 האחרות קיימות מ-twin-seaweeds)
PHONEME_LINES = {
    "phoneme-rrr": "רְרְרְר",
}

# 20 מילים חדשות בלבד (10 המילים הקיימות מ-twin-seaweeds משמשות שוב)
WORD_LINES = {
    # סוגר -ם (4 חדשות; "מים", "לחם" קיימות)
    "word-yom":     "יוֹם",
    "word-adam":    "אָדָם",
    "word-shalom":  "שָׁלוֹם",
    "word-chalom":  "חֲלוֹם",

    # סוגר -ן (3 חדשות; "שולחן", "שעון", "לימון" קיימות)
    "word-gan":     "גַּן",
    "word-balon":   "בָּלוֹן",
    "word-aron":    "אָרוֹן",

    # סוגר -ש (5 חדשות; "שמש" קיימת)
    "word-rosh":    "רֹאשׁ",
    "word-ish":     "אִישׁ",
    "word-kvish":   "כְּבִישׁ",
    "word-chamesh": "חָמֵשׁ",
    "word-tayish":  "תַּיִשׁ",

    # סוגר -ר (3 חדשות; "נמר", "נר", "סוכר" קיימות)
    "word-sefer":   "סֵפֶר",
    "word-shir":    "שִׁיר",
    "word-shaar":   "שַׁעַר",

    # סוגר -ל (5 חדשות; "נחל" קיימת)
    "word-chatul":  "חָתוּל",
    "word-gamal":   "גָּמָל",
    "word-pil":     "פִּיל",
    "word-migdal":  "מִגְדָּל",
    "word-gal":     "גַּל",

    # === רדיזיין חריזה 9.7.2026 (מיטל פלג) — 7 מילים חדשות למשפחות-חרוז מלאות ===
    # חרוז ‑וֹם: "מקום" (יום/שלום/חלום קיימות)
    "word-makom":   "מָקוֹם",
    # חרוז ‑יר: סיר/קיר/עיר ("שיר" קיימת)
    "word-sir":     "סִיר",
    "word-kir":     "קִיר",
    "word-ir":      "עִיר",
    # חרוז ‑ָר: עכבר/מספר (סוכר/שער קיימות)
    "word-achbar":  "עַכְבָּר",
    "word-mispar":  "מִסְפָּר",
    # חרוז ‑ָל: "טל" (גל/גמל/מגדל קיימות)
    "word-tal":     "טַל",
}

ALL_LINES = {**GAME_LINES, **PHONEME_LINES, **WORD_LINES}

FORCE = "--force" in sys.argv


async def gen(text: str, filename: str):
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not FORCE:
        return f"skip {filename}"
    try:
        if filename.startswith("phoneme-"):
            rate = "-25%"
        elif filename.startswith("word-"):
            rate = "-15%"
        else:
            rate = "-10%"
        tts = edge_tts.Communicate(text, VOICE_AVRI, rate=rate)
        await tts.save(str(out))
        return f"OK   {filename}"
    except Exception as e:
        return f"FAIL {filename} ({type(e).__name__}: {e})"


async def main():
    items = list(ALL_LINES.items())
    print(f"Generating {len(items)} whispers audio files (voice={VOICE_AVRI})...")
    print(f"Sections: {len(GAME_LINES)} meta + {len(PHONEME_LINES)} phoneme + {len(WORD_LINES)} word")
    print()

    success = 0
    for i, (key, text) in enumerate(items, 1):
        result = await gen(text, key)
        print(f"[{i}/{len(items)}] {result}")
        if "OK" in result or "skip" in result:
            success += 1
        await asyncio.sleep(0.25)

    print(f"\nSuccess: {success}/{len(items)}")
    print(f"Output: {OUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
