#!/usr/bin/env python3
"""
אי ת (תיבת האוצר) — הפקת האודיו הייעודי: intro-tav-treasure + finale-tav-treasure.

שאר האודיו של האי כבר קיים ומאומת מול טקסט-המקור (כולו קול נוני ממיגרציית 29.6):
  find-tav.mp3        "מִצְאוּ אֶת הָאוֹת תָּו"   (generate-letter-shape-prompts.py)
  cv-tav-<vowel>.mp3  כל 7 התנועות               (generate-island-04-cv-audio.py)
  praise-* / press-here — משותפים לכל האיים
הערה: finale-found-treasure הישן (23.5) לא בשימוש כאן — קול AvriNeural ישן
(שני קולות באי) + "יוֹפִי גָּדוֹל" שהגייתו לא טובה. הוחלף ב-finale-tav-treasure.

קול: ElevenLabs eleven_v3, voice נוני (ZI6I4a3UGgs1DXxqWjBV) דרך שכבת
התאימות _eleven_tts. בטקסט ל-TTS: נוּנִי בשורוק (reference-noni-voice-elevenlabs);
בטקסט מוצג לילד.ה נשאר נוֹנִי כמו בשאר האיים.

הרצה:
    PYTHONIOENCODING=utf-8 python generate-tav-treasure-audio.py [--force]
QA:  PYTHONIOENCODING=utf-8 python qa-transcribe-tav-island.py intro-tav-treasure.mp3
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

# intro מאוחד (פתיחה נרטיבית + הוראה) — קובץ אחד, אותו דפוס כמו קבוצת הבועות.
# ניקוד: "כֹּל" בחולם · פנייה ברבים (הַקְשִׁיבוּ/גְּעוּ) · וּגְעוּ בשורוק לפני שווא.
ITEMS = [
    (
        "intro-tav-treasure",
        "נוּנִי מָצָא בְּקַרְקָעִית הַיָּם תֵּבַת אוֹצָר עַתִּיקָה! "
        "שְׁמַעְתֶּם? תֵּבָה מַתְחִילָה בָּאוֹת תָּו. "
        "עַל הַתֵּבָה חֲמִשָּׁה מַנְעוּלִים. "
        "הַקְשִׁיבוּ לַצְּלִיל, גְּעוּ בְּאֶבֶן הַחֵן הַנְּכוֹנָה — וְכֹל מַנְעוּל יִפָּתַח. "
        "בּוֹאוּ נִפְתַּח אֶת הַתֵּבָה!"
    ),
    # פינאלה ייעודית — מחליפה את finale-found-treasure (23.5, קול AvriNeural ישן
    # + "יוֹפִי גָּדוֹל"). בלי "יוֹפִי" — הגייה לא טובה ב-eleven_v3 (מיטל 4.7.2026).
    (
        "finale-tav-treasure",
        "מְצָאתֶם אֶת הָאוֹצָר! כֹּל הַמַּנְעוּלִים נִפְתְּחוּ. אֵיזֶה אוֹצָר נוֹצֵץ!"
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
