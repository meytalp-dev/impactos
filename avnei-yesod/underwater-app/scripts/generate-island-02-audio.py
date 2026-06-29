#!/usr/bin/env python3
"""
מייצר MP3 ייעודיים למשחקון "אצות התאומות" (stage-2-twin-seaweeds.html) — אי 2.

קול: AvriNeural (גבר) — קביעה גלובלית באבני יסוד.
מצב ברירת מחדל: לא דורס קבצים קיימים. הוסיפו --force להקלטה מחדש.

דורש: pip install edge-tts
"""
import asyncio
import sys
from pathlib import Path

import _eleven_tts as edge_tts  # מעבר ל-ElevenLabs (was: import edge_tts)

VOICE_AVRI = "he-IL-AvriNeural"

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# הוראות + פידבק + פינלה
GAME_LINES = {
    "intro-twin-seaweeds":
        "בְּשׁוֹנִית הָאַצּוֹת, שְׁתֵּי אַצּוֹת זוֹהֲרוֹת עוֹמְדוֹת זוֹ לְצַד זוֹ. כֹּל אַחַת שָׁרָה מִלָּה מִשֶּׁלָּהּ.",
    "intro-twin-mission":
        "הַמְשִׂימָה שֶׁלָּכֶם: לְהַקְשִׁיב לִשְׁתֵּי הַמִּלִּים, וְלִקְבֹּעַ — הַאִם הָאוֹת הָרִאשׁוֹנָה זֵהָה אוֹ שׁוֹנָה.",
    "twin-question-same-or-different":
        "הַאִם הַצְּלִיל הָרִאשׁוֹן בִּשְׁתֵּי הַמִּלִּים זֵהֶה אוֹ שׁוֹנֶה?",
    "twin-feedback-correct-same":
        "כֵּן! שְׁתֵּי הַמִּלִּים מַתְחִילוֹת בְּאוֹתוֹ צְלִיל.",
    "twin-feedback-correct-different":
        "כֵּן! בִּשְׁתֵּי הַמִּלִּים יֵשׁ צְלִילִים שׁוֹנִים.",
    "twin-feedback-try-again":
        "כְּדַאי לְהַקְשִׁיב שׁוּב.",
    "twin-hint-listen-again":
        "הִקְלִידוּ עַל כֹּל אַצָּה כְּדֵי לִשְׁמֹעַ אֶת הַמִּלָּה שׁוּב.",
    "twin-finale-complete":
        "הָאַצּוֹת הִתְחַבְּרוּ! הַצְּלִילִים שׁוֹמְעִים אֶחָד אֶת הַשֵּׁנִי.",
}

# פונמות בודדות — מודגשות, מאורכות. מנוקדות עם sheva nach למניעת תנועה.
PHONEME_LINES = {
    "phoneme-mmm":  "מְמְמְמ",
    "phoneme-sss":  "סְסְסְס",
    "phoneme-shh":  "שְׁשְׁשְׁש",
    "phoneme-lll":  "לְלְלְל",
    "phoneme-nnn":  "נְנְנְנ",
}

# 20 מילים — כולן continuants
WORD_LINES = {
    "word-sus":      "סוּס",
    "word-sela":     "סֶלַע",
    "word-saba":     "סָבָּא",
    "word-sukar":    "סֻכָּר",
    "word-mayim":    "מַיִם",
    "word-melech":   "מֶלֶךְ",
    "word-menora":   "מְנוֹרָה",
    "word-mafteach": "מַפְתֵּחַ",
    "word-shemesh":  "שֶׁמֶשׁ",
    "word-shulchan": "שֻׁלְחָן",
    "word-shaon":    "שָׁעוֹן",
    "word-smicha":   "שְׂמִיכָה",
    "word-lev":      "לֵב",
    "word-lechem":   "לֶחֶם",
    "word-limon":    "לִימוֹן",
    "word-levena":   "לְבֵנָה",
    "word-namer":    "נָמֵר",
    "word-nachal":   "נַחַל",
    "word-ner":      "נֵר",
    "word-nemala":   "נְמָלָה",
}

ALL_LINES = {**GAME_LINES, **WORD_LINES, **PHONEME_LINES}

# קבצים שצריך לדרוס גם בלי --force כי הטקסט שלהם השתנה
RECORD_AGAIN = {
    "twin-feedback-correct-same",
    "twin-feedback-correct-different",
}

FORCE = "--force" in sys.argv


async def gen(text: str, filename: str):
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not FORCE and filename not in RECORD_AGAIN:
        return f"skip {filename}"
    try:
        # פונמות = איטי מאוד כדי להאריך; מילים = איטי; הסברים = רגיל
        if filename.startswith("phoneme-"):
            rate = "-25%"
        elif filename.startswith("word-"):
            rate = "-15%"
        else:
            rate = "-10%"
        tts = edge_tts.Communicate(text, VOICE_AVRI, rate=rate)
        await tts.save(str(out))
        return f"OK   {filename}"
    except Exception as e:
        return f"FAIL {filename} ({type(e).__name__}: {e})"


async def main():
    items = list(ALL_LINES.items())
    print(f"Generating {len(items)} island-02 audio files (voice={VOICE_AVRI})...")

    success = 0
    for i, (key, text) in enumerate(items, 1):
        result = await gen(text, key)
        print(f"[{i}/{len(items)}] {result}")
        if "OK" in result or "skip" in result:
            success += 1
        await asyncio.sleep(0.3)

    print(f"\nSuccess: {success}/{len(items)}")
    print(f"Output: {OUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
