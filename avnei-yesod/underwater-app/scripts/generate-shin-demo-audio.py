#!/usr/bin/env python3
"""
מייצר MP3 לדמו של D.14 — תבנית גנרית למשחקוני אי 3, אות שׁ.

3 קבצים:
  intro-shin-quest.mp3    — פתיחה נרטיבית (overlay רמקול #1)
  intro-shin-mission.mp3  — הסבר המשימה (overlay רמקול #2)
  find-shin.mp3           — הוראה בתוך המשחק (משמיע אחרי mount + ב-auto-hint)

הערה ל-D.15: כל אחת מ-17 האותיות החסרות תצטרך את 3 הקבצים האלה.
ניתן להעתיק את הסקריפט הזה, להחליף LETTER_KEY+LINES ולהריץ. בקובץ
שמירת המסמך השלם של D.15 יהיו 17 רשומות LINES.

מצב ברירת מחדל: לא דורס קבצים קיימים. --force כדי להקליט מחדש.
דורש: pip install edge-tts
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

LETTER_KEY = "shin"
# נושא: בועות בים (אוניברסלי — אותה תבנית לכל 22 האותיות). אישרה מיטל 27.5.
# 4 כללים שעלו ממנה במהלך הבדיקה:
#   1. ילד בן 6 לא קורא — חובה אודיו מלא של ההוראה (לא רק צליל האות).
#   2. כותבים "כֹּל" בחולם (לא "כָּל") כי AvriNeural קורא קמץ-קטן כ-"kal".
#   3. ניסוח טבעי "הבועות עם האות ש" — לא "בועות שׁין" (סמיכות אקדמית).
#   4. **intro מאוחד בקובץ אחד** — לא 2 קבצים מחוברים בקוד. iOS Safari לא
#      מאפשר רצף audio שמתחיל אחרי setTimeout/onended ⇒ הקובץ השני לא מתנגן
#      במובייל. גם משפר latency בנייד. ה-! בין המשפטים נותן הפסקה טבעית.
LINES = {
    f"intro-{LETTER_KEY}":
        "נוֹנִי מָצָא בּוּעוֹת זוֹהֲרוֹת בַּיָּם, וּבְכֹל בּוּעָה יֵשׁ אוֹת! "
        "בּוֹאוּ תַּקִּישׁוּ עַל כֹּל הַבּוּעוֹת עִם הָאוֹת שִׁין, "
        "וְכֹל אַחַת שֶׁתַּדְלִיקוּ תַּחֲזִיר עוֹד אוֹר לַיָּם.",
    f"find-{LETTER_KEY}":
        "מִצְאוּ אֶת כֹּל הַבּוּעוֹת עִם הָאוֹת שִׁין בַּיָּם.",
}

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
    items = list(LINES.items())
    print(f"Generating {len(items)} files for letter '{LETTER_KEY}' (voice={VOICE_AVRI}, rate={RATE})")
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
