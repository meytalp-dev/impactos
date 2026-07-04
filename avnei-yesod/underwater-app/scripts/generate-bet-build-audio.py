#!/usr/bin/env python3
"""
אי ב (הבית של הדג הקטן) — הפקת האודיו הייעודי: intro + הוראת סבב-המילה + פינאלה.

שאר האודיו של האי כבר קיים:
  find-bet.mp3        הוראת סבב האות             (קול נוני, מיגרציית 29.6)
  cv-bet-<vowel>.mp3  כל 7 התנועות                (generate-island-04-cv-audio.py)
                      בשימוש: patach/kamatz ("בַּ") + hiriq ("בִּ") + holam (מסיח).
  word-bet-yud-tav-bayit.mp3  המילה בַּיִת         (מאגר מילים אי 3)
  praise-* / press-here — משותפים לכל האיים
לקחים: בלי "יוֹפִי" (הגייה רעה ב-eleven_v3) · בלי סבב שווא (לקח cv-tav-shva) ·
🔴 בגד-כפת: בַּיִת/בֵּית/בְּנוּ עם דגש קל — בלי דגש TTS יבטא /v/.

קול: ElevenLabs eleven_v3, voice נוני (ZI6I4a3UGgs1DXxqWjBV) דרך שכבת
התאימות _eleven_tts. בטקסט ל-TTS: נוּנִי בשורוק (reference-noni-voice-elevenlabs);
בטקסט מוצג לילד.ה נשאר נוֹנִי כמו בשאר האיים.

הרצה:
    PYTHONIOENCODING=utf-8 python generate-bet-build-audio.py [--force]
QA:  PYTHONIOENCODING=utf-8 python qa-transcribe-tav-island.py intro-bet-build.mp3 word-round-bet-bayit.mp3 finale-bet-build.mp3
"""
import asyncio
import sys
from pathlib import Path

import _eleven_tts as edge_tts  # ElevenLabs מאחורי ממשק edge_tts

VOICE_AVRI = "he-IL-AvriNeural"   # נקלט לתאימות; הקול בפועל = נוני ElevenLabs
RATE       = "-10%"

ROOT    = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ניקוד: "כֹּל" בחולם · פנייה ברבים (הַקְשִׁיבוּ/גִּרְרוּ/בְּנוּ) · ב/כ/פ בראש הברה בדגש.
ITEMS = [
    # intro מאוחד (בעיה→פתרון + הוראת הגרירה) — קובץ אחד, אותו דפוס כמו אי מ.
    (
        "intro-bet-build",
        "אוֹי! הַגַּלִּים פֵּרְקוּ אֶת הַבַּיִת שֶׁל הַדָּג הַקָּטָן. "
        "שְׁמַעְתֶּם? בַּיִת מַתְחִיל בָּאוֹת בֵּית. "
        "נוּנִי מָצָא חֲמֵשׁ אַבְנֵי צְלִילִים. "
        "הַקְשִׁיבוּ לַצְּלִיל, גִּרְרוּ אֶת הַנִּקּוּד אֶל הָאוֹת — "
        "וְכֹל צְלִיל שֶׁתִּבְנוּ יוֹסִיף אֶבֶן לַבַּיִת. "
        "בּוֹאוּ נִבְנֶה בַּיִת!"
    ),
    # הוראת סבב 5 (השלמת המילה) — מתנגנת פעם אחת ב-mount של הסבב (round.audioKey).
    (
        "word-round-bet-bayit",
        "נִשְׁאֲרָה אֶבֶן אַחַת אַחֲרוֹנָה! "
        "הַקְשִׁיבוּ לַמִּלָּה: בַּיִת. "
        "בְּנוּ אֶת הַצְּלִיל הָרִאשׁוֹן שֶׁל בַּיִת — וְהַבַּיִת יִהְיֶה מוּכָן!"
    ),
    # פינאלה — הבית שלם והדג נכנס הביתה (בעיה→פתרון נסגר; גם בַּיִת = ב!).
    (
        "finale-bet-build",
        "בְּנִיתֶם אֶת כֹּל הַצְּלִילִים! הַבַּיִת מוּכָן — וְהַדָּג הַקָּטָן נִכְנָס הַבַּיְתָה. "
        "גַּם בַּיִת מַתְחִיל בָּאוֹת בֵּית!"
    ),
]

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
    print(f"Generating {len(ITEMS)} file(s) → {OUT_DIR}")
    for i, (key, text) in enumerate(ITEMS, 1):
        result = await gen(text, key)
        print(f"[{i}/{len(ITEMS)}] {result}")
        await asyncio.sleep(0.3)


if __name__ == "__main__":
    asyncio.run(main())
