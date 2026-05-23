#!/usr/bin/env python3
"""
מייצר MP3 לפרומפטים של letter-shape variant A.
"מִצְאוּ אֶת הָאוֹת [שם]"
"""
import asyncio
from pathlib import Path

import edge_tts

VOICE = "he-IL-HilaNeural"

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Variant A prompts — 5 אותיות באי 3
FIND_PROMPTS = {
    "find-tav":  "מִצְאוּ אֶת הָאוֹת תָּו",
    "find-mem":  "מִצְאוּ אֶת הָאוֹת מֵם",
    "find-resh": "מִצְאוּ אֶת הָאוֹת רֵישׁ",
    "find-bet":  "מִצְאוּ אֶת הָאוֹת בֵּית",
    "find-qof":  "מִצְאוּ אֶת הָאוֹת קוֹף",
}

# Find-letter prompts — לחיפוש האות בתוך מילה
FIND_IN_WORD = {
    "find-letter-in-word-tav":  "אֵיפֹה הָאוֹת תָּו בְּמִלָּה?",
    "find-letter-in-word-mem":  "אֵיפֹה הָאוֹת מֵם בְּמִלָּה?",
    "find-letter-in-word-resh": "אֵיפֹה הָאוֹת רֵישׁ בְּמִלָּה?",
    "find-letter-in-word-bet":  "אֵיפֹה הָאוֹת בֵּית בְּמִלָּה?",
    "find-letter-in-word-qof":  "אֵיפֹה הָאוֹת קוֹף בְּמִלָּה?",
}

# Variant B prompt — "איזו בועה אומרת..."
BUBBLE_PROMPTS = {
    "which-bubble-tav":  "אֵיזוֹ בּוּעָה אוֹמֶרֶת תָּו?",
    "which-bubble-mem":  "אֵיזוֹ בּוּעָה אוֹמֶרֶת מֵם?",
    "which-bubble-resh": "אֵיזוֹ בּוּעָה אוֹמֶרֶת רֵישׁ?",
    "which-bubble-bet":  "אֵיזוֹ בּוּעָה אוֹמֶרֶת בֵּית?",
    "which-bubble-qof":  "אֵיזוֹ בּוּעָה אוֹמֶרֶת קוֹף?",
}


async def gen(text: str, filename: str):
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists():
        return f"skip {filename}"
    try:
        tts = edge_tts.Communicate(text, VOICE, rate="-15%")
        await tts.save(str(out))
        return f"OK   {filename}"
    except Exception as e:
        return f"FAIL {filename} ({type(e).__name__}: {e})"


async def main():
    all_items = list(FIND_PROMPTS.items()) + list(FIND_IN_WORD.items()) + list(BUBBLE_PROMPTS.items())
    print(f"Generating {len(all_items)} prompt files...")
    success = 0
    for i, (key, text) in enumerate(all_items, 1):
        result = await gen(text, key)
        print(f"[{i}/{len(all_items)}] {result}")
        if "OK" in result or "skip" in result:
            success += 1
        await asyncio.sleep(0.3)
    print(f"\nSuccess: {success}/{len(all_items)}")


if __name__ == "__main__":
    asyncio.run(main())
