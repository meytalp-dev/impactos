#!/usr/bin/env python3
"""
אי ק (החיפוש הגדול) — הפקת האודיו הייעודי: intro + הוראת חיפוש +
הבחנת ק/כ + פינאלה + שמות חפצים (כַּדּוּר, קֶנְגּוּרוּ).

שאר האודיו של האי כבר קיים:
  sound-qof.mp3 / name-qof.mp3   קיימים (אי 3)
  word-kelev.mp3                 קיים — לאמת בתמלול Whisper לפני שימוש
  praise-* / press-here          משותפים לכל האיים
לקחי איים קודמים: בלי "יוֹפִי" (הגייה לא טובה ב-eleven_v3), פנייה ברבים,
ב/כ/פ בראש הברה בדגש, "כֹּל" בחולם.

הערת ניסוח (qof-vs-kaf): נמנעו בכוונה ממילות כ אחרי ו' החיבור
(וְכֶלֶב/וְכַדּוּר) — אחרי שווא הדגש הקל נשמט וה-TTS היה מבטא /x/.

קול: ElevenLabs eleven_v3, voice נוני (ZI6I4a3UGgs1DXxqWjBV) דרך שכבת
התאימות _eleven_tts. בטקסט ל-TTS: נוּנִי בשורוק (reference-noni-voice-elevenlabs);
בטקסט מוצג לילד.ה נשאר נוֹנִי כמו בשאר האיים.

הרצה:
    PYTHONIOENCODING=utf-8 python generate-qof-search-audio.py [--force]
QA:  PYTHONIOENCODING=utf-8 python qa-transcribe-tav-island.py intro-qof-search.mp3 find-qof-things.mp3 qof-vs-kaf.mp3 finale-qof-search.mp3 word-kadur.mp3 word-kenguru.mp3 word-kelev.mp3
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
    # intro מאוחד (פתיחה נרטיבית: בעיה→פתרון + הוראה) — קובץ אחד, דפוס אי מ.
    (
        "intro-qof-search",
        "נוּנִי שָׂחָה בַּיָּם, וּפִתְאוֹם רָאָה: חֲפָצִים נָפְלוּ מִסִּירָה אֶל קַרְקָעִית הַיָּם! "
        "נוּנִי אוֹסֵף לַסַּל רַק אֶת הַחֲפָצִים שֶׁמַּתְחִילִים בַּצְּלִיל שֶׁל קוּף — כְּמוֹ קֶנְגּוּרוּ. "
        "גְּעוּ בַּחֲפָצִים הַנְּכוֹנִים — וְהַסַּל יִתְמַלֵּא. בּוֹאוּ נְחַפֵּשׂ!"
    ),
    # הוראת סבב החיפוש — מתנגנת פעם אחת ב-mount של כל סבב + ברמקול (חזרה חופשית).
    (
        "find-qof-things",
        "מִצְאוּ אֶת כָּל הַחֲפָצִים שֶׁמַּתְחִילִים בַּצְּלִיל שֶׁל קוּף."
    ),
    # סבב ההבחנה ק/כ — אותו צליל, צורה שונה.
    (
        "qof-vs-kaf",
        "יֵשׁ לִי סוֹד! לָאוֹת קוּף וְלָאוֹת כָּף יֵשׁ אוֹתוֹ צְלִיל בְּדִיּוּק — אֲבָל צוּרָה שׁוֹנָה. "
        "קֶנְגּוּרוּ נִכְתָּב עִם קוּף. גְּעוּ בָּאוֹת קוּף!"
    ),
    # פינאלה — קֶשֶׁת מופיעה (גם קֶשֶׁת מתחילה ב-ק!).
    (
        "finale-qof-search",
        "מְצָאתֶם אֶת כָּל הַחֲפָצִים וְהַסַּל מָלֵא! וְהִנֵּה — מֵעַל הַמַּיִם הוֹפִיעָה קֶשֶׁת! "
        "גַּם קֶשֶׁת מַתְחִילָה בָּאוֹת קוּף."
    ),
    # שמות חפצים — מתנגנים בהקשה נכונה על חפץ (word-kelev.mp3 כבר קיים).
    # קֶנְגּוּרוּ עם "!": בלי סימן פיסוק eleven_v3 קיצץ את ההברה האחרונה
    # (QA Whisper 4.7.2026: 0.72 שנ' = "קנגור"; עם "!" → 1.12 שנ' = "קנגורו").
    ("word-kadur",   "כַּדּוּר"),
    ("word-kenguru", "קֶנְגּוּרוּ!"),
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
