#!/usr/bin/env python3
"""
אי 4 · "הַרְכִּיבוּ אֶת הַצְּלִיל" (stage-4-cv-build) — הנחיית נוני שחסרה.

עד היום המשחקון הזה רק השמיע את הצליל-היעד בלי לומר לילד.ה *מה לעשות*
(בניגוד לגרסת-הגרירה שיש לה intro-bet-build). מיטל 9.7.2026: להוסיף הנחיה.
הקובץ מתנגן פעם אחת בתחילת הסבב הראשון (introAudioKey → mechanic-cv-build),
ואז מושמע הצליל-היעד.

לקחים: פנייה ברבים (הַקְשִׁיבוּ/בַּחֲרוּ/הַרְכִּיבוּ) · בלי "יוֹפִי" · כֹּל בחולם ·
נוּנִי בשורוק בטקסט ל-TTS · ב/כ/פ בראש הברה בדגש.

קול: ElevenLabs eleven_v3, voice נוני (ZI6I4a3UGgs1DXxqWjBV) דרך _eleven_tts.

הרצה:
    PYTHONIOENCODING=utf-8 python generate-cv-build-intro.py [--force]
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

ITEMS = [
    (
        "intro-cv-build",
        "נוּנִי מָצָא אַבְנֵי צְלִילִים בַּשּׁוֹנִית! "
        "הַקְשִׁיבוּ טוֹב לַצְּלִיל, "
        "בַּחֲרוּ אוֹת וְנִיקּוּד, וְהַרְכִּיבוּ אוֹתוֹ. "
        "כֹּל צְלִיל שֶׁתַּרְכִּיבוּ נָכוֹן — הַדָּג יָשִׁיר!"
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
    print(f"Generating {len(ITEMS)} file(s) -> {OUT_DIR}")
    for i, (key, text) in enumerate(ITEMS, 1):
        result = await gen(text, key)
        print(f"[{i}/{len(ITEMS)}] {result}")
        await asyncio.sleep(0.3)


if __name__ == "__main__":
    asyncio.run(main())
