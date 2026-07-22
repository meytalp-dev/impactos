#!/usr/bin/env python3
"""
מייצר קליפי הנחיה "מִצְאוּ מִלִּים שֶׁמַּתְחִילוֹת בָּאוֹת X" בקול נוני (eleven_v3),
למכניקות "צַיִד אוֹצָר" (פנס הצלילה / דיו התמנון) — קליפ פר אות.
דורש: ELEVENLABS_API_KEY ב-.env.  הרצה:  PYTHONIOENCODING=utf-8 python scripts/generate-find-words-audio.py
"""
import asyncio
import sys
from pathlib import Path

import _eleven_tts as edge_tts

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# מפתח = שם-קובץ ; ערך = הטקסט המנוקד (שם-האות מלא כדי שנוני יהגה אותו נכון)
# 22.7: "מִלִּים" → "תְּמוּנוֹת" — הילד רואה תמונות (אמוג'י), לא מילים כתובות;
# ההנחיה הקולית חייבת להתאים לכותרת שעל המסך ("מִצְאוּ תְּמוּנוֹת…").
CLIPS = {
    "find-words-shin": "מִצְאוּ תְּמוּנוֹת שֶׁמַּתְחִילוֹת בָּאוֹת שִׁין",
    "find-words-lamed": "מִצְאוּ תְּמוּנוֹת שֶׁמַּתְחִילוֹת בָּאוֹת לָמֶד",
    "find-words-nun": "מִצְאוּ תְּמוּנוֹת שֶׁמַּתְחִילוֹת בָּאוֹת נוּן",
    "find-words-resh": "מִצְאוּ תְּמוּנוֹת שֶׁמַּתְחִילוֹת בָּאוֹת רֵישׁ",
    # נרטיב ההדגמה — משמיע לילד מה עושים בזמן שהיד מדגימה את הגרירה
    "demo-drag": "כָּכָה מְשַׂחֲקִים. גּוֹרְרִים אֶת חֶבֶל הַבּוּעוֹת אֶל הַתְּמוּנָה.",
}


async def main():
    for key, text in CLIPS.items():
        out = OUT_DIR / f"{key}.mp3"
        tts = edge_tts.Communicate(text, None)
        await tts.save(str(out))
        print(f"OK   {key}  ->  {out}")


if __name__ == "__main__":
    asyncio.run(main())
