#!/usr/bin/env python3
"""
הקלטה-מחדש ממוקדת של קליפי אי 2 שמיטל סימנה כשגויים (8.7.2026).
דורס רק את הקבצים ברשימה למטה — לא נוגע בשאר. קול נוני (ElevenLabs) דרך _eleven_tts.
הרצה:  PYTHONIOENCODING=utf-8 python scripts/_regen_island2_fixes.py
"""
import asyncio
from pathlib import Path
import _eleven_tts as tts

OUT = Path(__file__).parent.parent / "assets" / "audio"

# key -> טקסט (כבר מתוקן). ספר/מפתח עוברים KNOWN_WORD_FIXES (פ' רפה) בתוך השים.
TARGETS = {
    # twin — שורות הנחיה + מילים
    "intro-twin-seaweeds": "בְּשׁוֹנִית הָאַצּוֹת, שְׁתֵּי אַצּוֹת זוֹהֲרוֹת עוֹמְדוֹת זוֹ לְצַד זוֹ. כֹּל אַחַת שָׁרָה מִלָּה מִשֶּׁלָּהּ.",
    "intro-twin-mission":  "הַמְשִׂימָה שֶׁלָּכֶם: לְהַקְשִׁיב לִשְׁתֵּי הַמִּלִּים, וְלִקְבֹּעַ — הַאִם הַצְּלִיל הָרִאשׁוֹן זֵהֶה אוֹ שׁוֹנֶה.",
    "word-mafteach": "מַפְתֵּחַ",
    "word-saba":     "סָבָּא",
    # פונמות פותחות (twin)
    "phoneme-mmm": "מְמְמְמ",
    "phoneme-sss": "סְסְסְס",
    "phoneme-shh": "שְׁשְׁשְׁש",
    "phoneme-lll": "לְלְלְל",
    "phoneme-nnn": "נְנְנְנ",
    # whispers
    "word-sefer":  "סֵפֶר",
    "phoneme-rrr": "רְרְרְר",
    # fish — שורות עם "שתי"/"הביתה"/"שמחה"
    "intro-fish-schools":  "בְּשׁוֹנִית הָאַצּוֹת חַיּוֹת שְׁתֵּי לְהָקוֹת דְּגִיגִים. כֹּל לְהָקָה אוֹהֶבֶת צְלִיל אֶחָד.",
    "intro-fish-mission":  "הַמְשִׂימָה שֶׁלָּכֶם: לְהַקְשִׁיב לְכָל דְּגִיג, וְלִשְׁלֹחַ אוֹתוֹ הַבַּיְתָה — לַלְּהָקָה שֶׁמַּתְחִילָה בְּאוֹתוֹ צְלִיל.",
    "fish-feedback-correct": "כֵּן! הַדָּגִיג חָזַר הַבַּיְתָה.",
    "fish-finale-complete":  "כֹּל הַדְּגִיגִים הִגִּיעוּ הַבַּיְתָה! בַּלְּהָקוֹת שִׂמְחָה.",
}


async def main():
    print(f"Regenerating {len(TARGETS)} island-2 clips (voice=noni/ElevenLabs)...")
    ok = 0
    for i, (key, text) in enumerate(TARGETS.items(), 1):
        out = OUT / f"{key}.mp3"
        try:
            await tts.Communicate(text).save(str(out))
            print(f"[{i}/{len(TARGETS)}] OK   {key}")
            ok += 1
        except Exception as e:
            print(f"[{i}/{len(TARGETS)}] FAIL {key} ({type(e).__name__}: {e})")
        await asyncio.sleep(0.25)
    print(f"\nDone: {ok}/{len(TARGETS)}")


if __name__ == "__main__":
    asyncio.run(main())
