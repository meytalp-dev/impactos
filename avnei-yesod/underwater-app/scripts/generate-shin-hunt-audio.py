#!/usr/bin/env python3
"""
אי ש (מִשְׁפְּחוֹת הַדְּגִיגִים · A5) — הפקת האודיו הייעודי:
intro-shin-hunt + find-shin-fish + finale-shin-hunt.

שאר האודיו של האי כבר קיים ומאומת:
  sound-shin.mp3    צליל האות (משותף לכל האיים)
  word-shemesh.mp3  letter-anims מנגן אותו אוטומטית בפינאלה (שֶׁמֶשׁ — שׁ ימנית)
  praise-* / press-here — משותפים לכל האיים
הערה: find-shin.mp3 הישן (D.14) אומר "בּוּעוֹת" — לא מתאים לנושא הדגים,
לכן נוצר find-shin-fish חדש. הישן נשאר לתאימות stage-3-template-demo.

🔴 פדגוגיה: בספטמבר מלמדים רק שׁ ימנית (/sh/). כל מילות הטקסט עם שׁ ימנית
בלבד (שׁוּנִית, מִשְׁפָּחוֹת, שׁוּב) — נמנעו בכוונה מילים עם שׂ שמאלית
(יִשְׂחֶה, שִׂמְחָה). שׂ נלמדת בפברואר (M3).

קול: ElevenLabs eleven_v3, voice נוני (ZI6I4a3UGgs1DXxqWjBV) דרך שכבת
התאימות _eleven_tts. בטקסט ל-TTS: נוּנִי בשורוק (reference-noni-voice-elevenlabs);
בטקסט מוצג לילד.ה נשאר נוֹנִי כמו בשאר האיים.

הרצה:
    PYTHONIOENCODING=utf-8 python generate-shin-hunt-audio.py [--force]
QA:  PYTHONIOENCODING=utf-8 python qa-transcribe-tav-island.py intro-shin-hunt.mp3 find-shin-fish.mp3 finale-shin-hunt.mp3
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

# ניקוד: "כֹּל" בחולם · פנייה ברבים (גְּעוּ) · דגש קל ב-בּ/כּ/פּ בראש הברה.
ITEMS = [
    # intro מאוחד (סיפור בעיה→פתרון + הוראה) — קובץ אחד, דפוס אי ת.
    (
        "intro-shin-hunt",
        "בָּעֶרֶב, כֹּל הַדְּגִיגִים חוֹזְרִים הַבַּיְתָה אֶל הַשּׁוּנִית שֶׁל נוּנִי. "
        "אֲבָל הַיּוֹם, חָמֵשׁ מִשְׁפָּחוֹת שֶׁל דְּגִיגִים הָלְכוּ לְאִבּוּד בַּיָּם הַגָּדוֹל! "
        "אֶת הַדְּגִיגִים שֶׁל הַשּׁוּנִית מְזַהִים לְפִי הָאוֹת שִׁין. "
        "גְּעוּ בְּכֹל דָּג עִם הָאוֹת שִׁין — וְהוּא יַחֲזֹר אֶל נוּנִי. "
        "בּוֹאוּ נַחְזִיר אֶת כֹּל הַמִּשְׁפָּחוֹת הַבַּיְתָה!"
    ),
    # הוראת-משחק קצרה — מתנגנת פעם אחת ב-mount של כל סבב + ברמקול (two-tap).
    # "בַּיָּם" בסוף — כדי ש"שִׁין" לא תהיה המילה האחרונה (בגרסה הראשונה
    # ה-QA תמלל "שים"; סיום המשפט נחתך). תמלול-אימות: "שין" ברור.
    (
        "find-shin-fish",
        "גְּעוּ בְּכֹל הַדָּגִים עִם הָאוֹת שִׁין בַּיָּם!"
    ),
    # פינאלה — בלי "יוֹפִי" (הגייה לא טובה ב-eleven_v3, מיטל 4.7.2026).
    (
        "finale-shin-hunt",
        "כֹּל הַדְּגִיגִים חָזְרוּ הַבַּיְתָה! הַשּׁוּנִית שׁוּב מְלֵאָה, וְכֻלָּם בְּיַחַד. "
        "אֵיזֶה עֶרֶב נִפְלָא בַּיָּם!"
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
