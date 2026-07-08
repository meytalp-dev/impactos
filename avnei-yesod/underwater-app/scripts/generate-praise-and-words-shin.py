#!/usr/bin/env python3
"""
מייצר 2 קבוצות MP3:

1. **3 מילי-שבח מגוונים** (praise pool) — מחליפים את great.mp3 שכולל "כָּל הכבוד"
   ש-AvriNeural קורא "kal hakavod". במקום זה: יופי / מצוין / מעולה — בגיוון.
   הקבצים חדשים = שם אחר = bypass ל-cache בנייד.

2. **5 מילים עם ש'** (word pool לאות שׁין) — מילים קצרות שמתחילות בצליל ש.
   נשמעות אחרי הקשה נכונה: word + praise (פדגוגיה: ילד שומע מה הוא בחר נכון).

תבנית לסוכן D.15: שכפול לכל אחת מ-17 האותיות החסרות (word pool פר אות).

דורש: pip install edge-tts
"""
import asyncio
import sys
from pathlib import Path
import _eleven_tts as edge_tts  # מעבר ל-ElevenLabs (was: import edge_tts)

VOICE_AVRI = "he-IL-AvriNeural"
RATE       = "-10%"

ROOT    = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# --- מילי-שבח מגוונים (משותפים לכל המשחקונים) ---
PRAISE_POOL = {
    "praise-yofi":     "יוֹפִי!",
    "praise-metzuyan": "מְצֻיָּן!",
    "praise-mealeh":   "מְעֻלֶּה!",
}

# --- מילים שמתחילות ב-ש' (תבנית — לשכפל פר אות ב-D.15) ---
SHIN_WORD_POOL = {
    "word-shemesh":   "שֶׁמֶשׁ",
    "word-shalom":    "שָׁלוֹם",
    "word-shulchan":  "שׁוּלְחָן",
    "word-shen":      "שֵׁן",
    "word-shir":      "שִׁיר",
}

# --- finale ייעודי לנושא "בועות" (לשכפל פר נושא ב-D.15) ---
# האודיו של 5 הקיימים (finale-found-treasure, finale-rescue-saved וכו') לא מתחבר
# לסיפור של בועות. כל נושא ב-D.15 צריך finale משלו.
BUBBLES_FINALE = {
    "finale-bubbles-found": "מָצָאתֶם אֶת כֹּל הַבּוּעוֹת! מְעֻלֶּה!",
}

ALL_LINES = {**PRAISE_POOL, **SHIN_WORD_POOL, **BUBBLES_FINALE}

FORCE = "--force" in sys.argv


async def gen(text: str, filename: str):
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
    items = list(ALL_LINES.items())
    print(f"Generating {len(items)} files (voice={VOICE_AVRI}, rate={RATE})")
    print(f"  - {len(PRAISE_POOL)} praise words (universal)")
    print(f"  - {len(SHIN_WORD_POOL)} word pool for shin")
    print(f"Output: {OUT_DIR}")
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
