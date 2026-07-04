#!/usr/bin/env python3
"""
אי מ (המערה הזוהרת) — הפקת האודיו הייעודי: intro + הסבר מם-סופית + פינאלה.

שאר האודיו של האי כבר קיים ומאומת בתמלול Whisper (4.7.2026):
  find-mem.mp3        "מִצְאוּ אֶת הָאוֹת מֵם"  (קול נוני, מיגרציית 29.6)
  cv-mem-<vowel>.mp3  כל 7 התנועות             (generate-island-04-cv-audio.py)
                      בשימוש: kamatz/patach ("מה") + hiriq ("מי") — אומתו.
  praise-* / press-here — משותפים לכל האיים
לקח אי ת: בלי "יוֹפִי" (הגייה לא טובה ב-eleven_v3) ובלי סבב שווא.

קול: ElevenLabs eleven_v3, voice נוני (ZI6I4a3UGgs1DXxqWjBV) דרך שכבת
התאימות _eleven_tts. בטקסט ל-TTS: נוּנִי בשורוק (reference-noni-voice-elevenlabs);
בטקסט מוצג לילד.ה נשאר נוֹנִי כמו בשאר האיים.

הרצה:
    PYTHONIOENCODING=utf-8 python generate-mem-cave-audio.py [--force]
QA:  PYTHONIOENCODING=utf-8 python qa-transcribe-tav-island.py intro-mem-cave.mp3 final-mem-sofit.mp3 finale-mem-cave.mp3
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

# ניקוד: "כֹּל" בחולם · פנייה ברבים (הַקְשִׁיבוּ/גְּעוּ) · ב/כ/פ בראש הברה בדגש.
ITEMS = [
    # intro מאוחד (פתיחה נרטיבית + הוראה) — קובץ אחד, אותו דפוס כמו אי ת.
    (
        "intro-mem-cave",
        "נוּנִי מָצָא מְעָרָה בְּקַרְקָעִית הַיָּם! "
        "שְׁמַעְתֶּם? מְעָרָה מַתְחִילָה בָּאוֹת מֵם. "
        "בַּמְּעָרָה חָשׁוּךְ, וַחֲמִשָּׁה צְדָפִים שׁוֹמְרִים עַל הָאוֹר. "
        "הַקְשִׁיבוּ לַצְּלִיל, גְּעוּ בַּצֶּדֶף הַנָּכוֹן — וְכֹל צֶדֶף יָאִיר אֶת הַמְּעָרָה. "
        "בּוֹאוּ נַדְלִיק אֶת הָאוֹר!"
    ),
    # הסבר סבב הסופית — מתנגן פעם אחת ב-mount של הסבב (round.audioKey).
    (
        "final-mem-sofit",
        "יֵשׁ לִי סוֹד! לָאוֹת מֵם יֵשׁ צוּרָה מְיֻחֶדֶת בְּסוֹף מִלָּה — מֵם סוֹפִית. "
        "כְּמוֹ בַּמִּלָּה מַיִם: מַתְחִילָה בְּמֵם, וְנִגְמֶרֶת בְּמֵם סוֹפִית! "
        "גְּעוּ בַּצֶּדֶף עִם מֵם סוֹפִית."
    ),
    # פינאלה — מתנה מתגלה (גם מַתָּנָה מתחילה במם). הוחלף ממַרְגָּלִית —
    # מילה שילדי א' לא מכירים (מיטל 4.7.2026); אוצר מילים חייב להיות מוכר לגיל.
    (
        "finale-mem-cave",
        "הִדְלַקְתֶּם אֶת כֹּל הַצְּדָפִים! הַמְּעָרָה זוֹהֶרֶת — וּבִפְנִים מַתָּנָה נוֹצֶצֶת! "
        "גַּם מַתָּנָה מַתְחִילָה בָּאוֹת מֵם."
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
