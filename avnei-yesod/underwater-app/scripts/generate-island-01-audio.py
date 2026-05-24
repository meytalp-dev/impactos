#!/usr/bin/env python3
"""
מייצר MP3 לאי 1 — מפרץ הבועות המזמרות (מודעות הברתית, בעל-פה).

לכל מילה: word-X.mp3 (מילה שלמה) + syllable mp3 אחד לכל הברה.
+ קופי UI של משחקון BubbleRise + תמיכות פדגוגיות.

מצב ברירת מחדל: לא דורס קבצים קיימים. הוסיפו --force כדי להקליט מחדש.

דורש: pip install edge-tts
"""
import asyncio
import sys
from pathlib import Path

import edge_tts

VOICE_AVRI = "he-IL-AvriNeural"   # גבר — קביעה גלובלית באבני יסוד

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio" / "island-01"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ─── מילים מלאות ──────────────────────────────────────────────
WORDS = {
    "word-parpar":   "פַּרְפַּר",
    "word-kadur":    "כַּדּוּר",
    "word-chatul":   "חָתוּל",
    "word-avtiach":  "אֲבַטִּיחַ",
    "word-banana":   "בָּנָנָה",
    # 10 מילים נוספות (גרסה 0.2)
    "word-aba":      "אַבָּא",
    "word-ima":      "אִמָּא",
    "word-kelev":    "כֶּלֶב",
    "word-arnav":    "אַרְנָב",
    "word-dubi":     "דּוּבִּי",
    "word-barvaz":   "בַּרְוָז",
    "word-yeled":    "יֶלֶד",
    "word-sefer":    "סֵפֶר",
    "word-shokolad": "שׁוֹקוֹלָד",
    "word-mekarer":  "מְקָרֵר",
}

# ─── הברות נפרדות ─────────────────────────────────────────────
SYLLABLES = {
    "syl-par-1": "פַּר",
    "syl-par-2": "פַּר",
    "syl-ka":    "כַּ",
    "syl-dur":   "דּוּר",
    "syl-cha":   "חָ",
    "syl-tul":   "תוּל",
    "syl-av":    "אַב",
    "syl-ti":    "טִי",
    "syl-ach":   "חַ",
    "syl-ba":    "בָּ",
    "syl-na":    "נָ",
    "syl-nah":   "נָה",
    # הברות חדשות (גרסה 0.2)
    "syl-a":     "אַ",
    "syl-ba2":   "בָּא",
    "syl-i":     "אִ",
    "syl-ma":    "מָּא",
    "syl-ke":    "כֶּ",
    "syl-lev":   "לֶב",
    "syl-ar":    "אַר",
    "syl-nav":   "נָב",
    "syl-du":    "דּוּ",
    "syl-bi":    "בִּי",
    "syl-bar":   "בַּר",
    "syl-vaz":   "וָז",
    "syl-ye":    "יֶ",
    "syl-led":   "לֶד",
    "syl-se":    "סֵ",
    "syl-fer":   "פֶר",
    "syl-sho":   "שׁוֹ",
    "syl-ko":    "קוֹ",
    "syl-lad":   "לָד",
    "syl-me":    "מְ",
    "syl-ka2":   "קָ",
    "syl-rer":   "רֵר",
}

# ─── UI / קופי משחקון ─────────────────────────────────────────
UI = {
    "ui-tap-to-start":   "הַקִּישׁוּ כְּדֵי לְהַתְחִיל.",
    "ui-bubble-story":   "בּוּעַת-אוֹר קְטַנָּה נִתְקְעָה בַּקַּרְקָעִית. בּוֹאוּ נַעֲזֹר לָהּ לַעֲלוֹת.",
    "ui-listen-word":    "הַקְשִׁיבוּ לַמִּלָּה.",
    "ui-find-syllable":  "אֵיזוֹ בּוּעָה אוֹמֶרֶת אֶת הַצְּלִיל הַזֶּה?",
    "ui-try-together":   "בּוֹאוּ נְנַסֶּה יַחַד.",
    "ui-here-it-is":     "הִנֵּה הַבּוּעָה. הַקִּישׁוּ עָלֶיהָ.",
    "ui-great":          "יָפֶה מְאוֹד!",
    "ui-complete":       "הַבּוּעָה הִגִּיעָה לִפְנֵי הַמַּיִם. כָּל הַכָּבוֹד!",
}

# ─── תמיכות פדגוגיות לפי avnei-yesod-support-levels ───────────
SUPPORT = {
    "support-mistake-1": "לֹא נוֹרָא. נְנַסֶּה שׁוּב.",
    "support-mistake-2": "הִנֵּה רֶמֶז. תִּשְׁמְעוּ עוֹד פַּעַם.",
    "support-mistake-3": "הִנֵּה הַבּוּעָה הַנְּכוֹנָה. הַקִּישׁוּ עָלֶיהָ.",
    "support-order":     "לְפִי הַסֵּדֶר! קוֹדֶם זוֹ.",
}

ALL_LINES = {**WORDS, **SYLLABLES, **UI, **SUPPORT}

FORCE = "--force" in sys.argv


async def gen(text: str, filename: str):
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not FORCE:
        return f"skip {filename}"
    try:
        # rate איטי יותר להברות (לילדים בכיתה א')
        rate = "-25%" if filename.startswith("syl-") else "-10%"
        tts = edge_tts.Communicate(text, VOICE_AVRI, rate=rate)
        await tts.save(str(out))
        return f"OK   {filename}"
    except Exception as e:
        return f"FAIL {filename} ({type(e).__name__}: {e})"


async def main():
    items = list(ALL_LINES.items())
    print(f"Generating {len(items)} audio files for Island 1 (voice={VOICE_AVRI})...")
    print(f"Output: {OUT_DIR}")
    print("=" * 70)

    success = 0
    for i, (key, text) in enumerate(items, 1):
        result = await gen(text, key)
        print(f"[{i}/{len(items)}] {result}")
        if "OK" in result or "skip" in result:
            success += 1
        await asyncio.sleep(0.25)

    print("=" * 70)
    print(f"Success: {success}/{len(items)}")


if __name__ == "__main__":
    asyncio.run(main())
